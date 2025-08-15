"use client";
import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X, Download } from 'lucide-react';
import Papa from 'papaparse';

interface CSVCollectionUploadProps {
  userId?: string;
  onUploadComplete: () => void;
  isOpen: boolean;
  onClose: () => void;
}

interface CardsphereCSVRow {
  Name: string;
  Set?: string;
  'Set Name'?: string;
  Quantity?: string;
  Condition?: string;
  Language?: string;
  Foil?: string;
  Price?: string;
  // Additional possible columns
  name?: string;
  set?: string;
  set_name?: string;
  quantity?: string;
  condition?: string;
  foil?: string;
  price?: string;
}

interface ParsedCard {
  name: string;
  setCode?: string;
  setName?: string;
  quantity: number;
  condition: string;
  foil: boolean;
  price?: number;
}

interface MatchResult {
  parsed: ParsedCard;
  matched?: {
    uuid: string;
    name: string;
    setCode: string;
    setName: string;
  };
  error?: string;
}

const CSVCollectionUpload: React.FC<CSVCollectionUploadProps> = ({
  userId = 'default',
  onUploadComplete,
  isOpen,
  onClose
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'parsing' | 'matching' | 'uploading' | 'complete' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [summary, setSummary] = useState<{
    total: number;
    matched: number;
    unmatched: number;
    errors: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const conditionMapping = {
    'M': 'mint',
    'NM': 'near_mint',
    'LP': 'light_played',
    'MP': 'played',
    'HP': 'poor',
    'D': 'poor',
    'Mint': 'mint',
    'Near Mint': 'near_mint',
    'Lightly Played': 'light_played',
    'Moderately Played': 'played',
    'Heavily Played': 'poor',
    'Damaged': 'poor'
  };

  const normalizeCondition = (condition: string): string => {
    if (!condition) return 'near_mint';
    const normalized = conditionMapping[condition as keyof typeof conditionMapping];
    return normalized || 'near_mint';
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const parseCSVRow = (row: CardsphereCSVRow): ParsedCard => {
    // Handle different possible column names from various CSV formats
    const name = row.Name || row.name || '';
    const setCode = row.Set || row.set || '';
    const setName = row['Set Name'] || row.set_name || '';
    const quantity = parseInt(row.Quantity || row.quantity || '1');
    const condition = normalizeCondition(row.Condition || row.condition || 'Near Mint');
    const foil = (row.Foil || row.foil || '').toLowerCase() === 'true' || 
                 (row.Foil || row.foil || '').toLowerCase() === 'yes' ||
                 (row.Foil || row.foil || '') === '1';
    const price = parseFloat(row.Price || row.price || '0') || undefined;

    return {
      name: name.trim(),
      setCode: setCode.trim(),
      setName: setName.trim(),
      quantity: isNaN(quantity) ? 1 : quantity,
      condition,
      foil,
      price
    };
  };

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setErrorMessage('Please select a CSV file');
      setUploadStatus('error');
      return;
    }

    setUploadStatus('parsing');
    setProgress(10);
    setErrorMessage('');

    try {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (result) => {
          try {
            setProgress(20);
            const data = result.data as CardsphereCSVRow[];
            
            if (data.length === 0) {
              throw new Error('CSV file appears to be empty or invalid');
            }

            // Parse CSV rows
            const parsedCards = data.map(parseCSVRow).filter(card => card.name);
            
            if (parsedCards.length === 0) {
              throw new Error('No valid card data found in CSV');
            }

            setProgress(40);
            setUploadStatus('matching');

            // Match cards to database
            const matchResults = await matchCardsToDatabase(parsedCards);
            setMatchResults(matchResults);
            
            setProgress(60);
            setUploadStatus('uploading');

            // Upload matched cards to collection
            await uploadToCollection(matchResults.filter(result => result.matched));
            
            setProgress(100);
            setUploadStatus('complete');
            
            // Calculate summary
            const matched = matchResults.filter(r => r.matched).length;
            const unmatched = matchResults.filter(r => !r.matched && !r.error).length;
            const errors = matchResults.filter(r => r.error).length;
            
            setSummary({
              total: matchResults.length,
              matched,
              unmatched,
              errors
            });

            // Call completion callback
            onUploadComplete();

          } catch (error) {
            console.error('Error processing CSV:', error);
            setErrorMessage(error instanceof Error ? error.message : 'Failed to process CSV file');
            setUploadStatus('error');
          }
        },
        error: (error) => {
          console.error('CSV parsing error:', error);
          setErrorMessage('Failed to parse CSV file: ' + error.message);
          setUploadStatus('error');
        }
      });
    } catch (error) {
      console.error('File processing error:', error);
      setErrorMessage('Failed to process file');
      setUploadStatus('error');
    }
  };

  const matchCardsToDatabase = async (parsedCards: ParsedCard[]): Promise<MatchResult[]> => {
    const results: MatchResult[] = [];
    
    console.log('🔍 Starting card matching for', parsedCards.length, 'cards');
    
    for (let i = 0; i < parsedCards.length; i++) {
      const card = parsedCards[i];
      setProgress(40 + (i / parsedCards.length) * 20);
      
      console.log(`🔍 Searching for card: "${card.name}"`, { setCode: card.setCode, setName: card.setName });
      
      try {
        // Search for card in database
        const searchParams = new URLSearchParams({
          name: card.name,
          ...(card.setCode && { setCode: card.setCode }),
          ...(card.setName && { setName: card.setName })
        });

        console.log('🌐 Making API request:', `/api/cards/search?${searchParams}`);
        
        const response = await fetch(`/api/cards/search?${searchParams}`);
        console.log('📡 API Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📊 API Response data:', data);
        
        if (data.ok && data.data && data.data.length > 0) {
          // Use the first match (most relevant)
          const match = data.data[0];
          console.log('✅ Found match:', match.name, 'from set', match.set_code);
          results.push({
            parsed: card,
            matched: {
              uuid: match.uuid,
              name: match.name,
              setCode: match.set_code,
              setName: match.set_name
            }
          });
        } else {
          console.log('❌ No match found for:', card.name);
          results.push({
            parsed: card,
            error: 'Card not found in database'
          });
        }
      } catch (error) {
        console.error('💥 Error searching for card:', card.name, error);
        results.push({
          parsed: card,
          error: `Error searching for card: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }
    
    console.log('🎯 Card matching complete. Results:', {
      total: results.length,
      matched: results.filter(r => r.matched).length,
      unmatched: results.filter(r => !r.matched).length
    });
    
    return results;
  };

  const uploadToCollection = async (matchedResults: MatchResult[]) => {
    const cards = matchedResults.map(result => ({
      uuid: result.matched!.uuid,
      quantity: result.parsed.quantity,
      condition: result.parsed.condition,
      foil: result.parsed.foil,
      purchase_price: result.parsed.price,
      purchase_date: new Date().toISOString().split('T')[0]
    }));

    const response = await fetch('/api/portfolio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        cards
      })
    });

    const data = await response.json();
    
    if (!data.ok) {
      throw new Error(data.error || 'Failed to add cards to collection');
    }
  };

  const downloadUnmatchedCards = () => {
    const unmatchedCards = matchResults
      .filter(result => !result.matched)
      .map(result => ({
        Name: result.parsed.name,
        Set: result.parsed.setCode,
        'Set Name': result.parsed.setName,
        Quantity: result.parsed.quantity,
        Condition: result.parsed.condition,
        Foil: result.parsed.foil,
        Price: result.parsed.price,
        Error: result.error || 'Not found in database'
      }));

    const csv = Papa.unparse(unmatchedCards);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'unmatched_cards.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const resetUpload = () => {
    setUploadStatus('idle');
    setProgress(0);
    setMatchResults([]);
    setSummary(null);
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const csvContent = 'Name,Set,Quantity,Condition,Foil,Price\nBlack Lotus,LEA,1,Near Mint,false,10000\nLightning Bolt,M10,4,Near Mint,false,1.50';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cardsphere-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Import Collection from CSV</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {uploadStatus === 'idle' && (
            <div className="space-y-6">
              <div className="text-sm text-gray-600">
                <p className="mb-2">Upload a Cardsphere CSV export to add cards to your collection.</p>
                <p>Supported formats:</p>
                <ul className="list-disc list-inside ml-2 mt-1">
                  <li>Cardsphere export CSV</li>
                  <li>CSV with columns: Name, Set, Quantity, Condition, Foil, Price</li>
                </ul>
              </div>

              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                data-testid="dropzone"
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Drop your CSV file here or click to browse
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Accepts .csv files only
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileInput}
                  className="hidden"
                  data-testid="file-input"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Select File
                </button>
              </div>

              <div className="mt-4">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    downloadTemplate();
                  }}
                  className="text-blue-600 hover:text-blue-700 text-sm underline"
                  download="cardsphere-template.csv"
                >
                  Download CSV Template
                </a>
              </div>
            </div>
          )}

          {(uploadStatus === 'parsing' || uploadStatus === 'matching' || uploadStatus === 'uploading') && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-lg font-medium text-gray-900">
                  {uploadStatus === 'parsing' && 'Parsing CSV file...'}
                  {uploadStatus === 'matching' && 'Matching cards to database...'}
                  {uploadStatus === 'uploading' && 'Adding cards to collection...'}
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                  data-testid="progress-bar"
                />
              </div>
              
              <p className="text-sm text-gray-600">{progress}% complete</p>
            </div>
          )}

          {uploadStatus === 'complete' && summary && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle size={24} />
                <span className="text-lg font-medium">Upload Complete!</span>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h3 className="font-medium text-gray-900">Import Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total cards:</span>
                    <span className="ml-2 font-medium">{summary.total}</span>
                  </div>
                  <div>
                    <span className="text-green-600">Successfully added:</span>
                    <span className="ml-2 font-medium text-green-600">{summary.matched}</span>
                  </div>
                  <div>
                    <span className="text-yellow-600">Not found:</span>
                    <span className="ml-2 font-medium text-yellow-600">{summary.unmatched}</span>
                  </div>
                  <div>
                    <span className="text-red-600">Errors:</span>
                    <span className="ml-2 font-medium text-red-600">{summary.errors}</span>
                  </div>
                </div>
              </div>

              {(summary.unmatched > 0 || summary.errors > 0) && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Some cards could not be matched to your database. You can download the unmatched cards for review.
                  </p>
                  <button
                    onClick={downloadUnmatchedCards}
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                  >
                    <Download size={16} />
                    <span>Download Unmatched Cards</span>
                  </button>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={resetUpload}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Upload Another File
                </button>
                <button
                  onClick={onClose}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {uploadStatus === 'error' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-red-600">
                <AlertCircle size={24} />
                <span className="text-lg font-medium">Upload Failed</span>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700">{errorMessage}</p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={resetUpload}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={onClose}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CSVCollectionUpload;
