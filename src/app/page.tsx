"use client";
import { useState, useRef, useEffect } from "react";
import { Card, ApiResponse, AdminStatus, DownloadProgress, ImportProgress } from '@/types';
import { 
  DashboardCards, 
  defaultDashboardCards, 
  AdminToolsPanel,
  CardFilters,
  CSVUpload,
  CardGrid
} from '@/components';
import Papa from "papaparse";

// Utility to trigger backend actions
async function triggerApiAction(path: string, method: string = 'POST'): Promise<any> {
  const res = await fetch(path, { method });
  if (!res.ok) throw new Error(await res.text());
  return res.json ? res.json() : undefined;
}

export default function Home() {
  // Admin/tools state
  const [adminStatus, setAdminStatus] = useState<string>("");
  const [adminLoading, setAdminLoading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [downloadSpeed, setDownloadSpeed] = useState<string | null>(null);
  
  // Import progress state
  const [importProgress, setImportProgress] = useState<number | null>(null);
  const [importPhase, setImportPhase] = useState<string | null>(null);
  const [importRate, setImportRate] = useState<number | null>(null);
  const [importEta, setImportEta] = useState<number | null>(null);
  const [importProcessed, setImportProcessed] = useState<number | null>(null);
  const [importTotal, setImportTotal] = useState<number | null>(null);

  // Collection state
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showNoPrice, setShowNoPrice] = useState(false);
  
  // Filter state
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [searchName, setSearchName] = useState("");
  const [searchSet, setSearchSet] = useState("");
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const [showSetSuggestions, setShowSetSuggestions] = useState(false);
  
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Load file status on component mount
  useEffect(() => {
    refreshFileStatus();
  }, []);

  // Computed values
  const cardsNoPrice = cards.filter(card => !card.price);
  const nameSuggestions = searchName ? 
    [...new Set(cards.map(c => c.name))].filter(name => 
      name.toLowerCase().includes(searchName.toLowerCase())
    ).slice(0, 10) : [];
  const setSuggestions = searchSet ? 
    [...new Set(cards.map(c => c.set_name).filter(Boolean) as string[])].filter(setName => 
      setName.toLowerCase().includes(searchSet.toLowerCase())
    ).slice(0, 10) : [];

  const filteredCards = cards.filter(card => {
    if (showNoPrice) return !card.price;
    const price = card.price ? parseFloat(card.price) : 0;
    if (minPrice && price < parseFloat(minPrice)) return false;
    if (maxPrice && price > parseFloat(maxPrice)) return false;
    if (searchName && !card.name.toLowerCase().includes(searchName.toLowerCase())) return false;
    if (searchSet && card.set_name && card.set_name.toLowerCase() !== searchSet.toLowerCase()) return false;
    return true;
  });

  const total = filteredCards.reduce((sum, card) => sum + (card.price ? parseFloat(card.price) : 0), 0);

  // Admin action handlers
  async function refreshFileStatus() {
    try {
      const [mtgjsonRes, priceHistoryRes] = await Promise.all([
        fetch("/api/admin/check-mtgjson"),
        fetch("/api/price-history")
      ]);

      if (mtgjsonRes.ok) {
        const check = await mtgjsonRes.json();
        const statusEl = document.getElementById("mtgjson-status");
        const sizeEl = document.getElementById("mtgjson-size");
        if (statusEl) {
          statusEl.textContent = check.exists ? "✅ Downloaded" : "❌ Not found";
          statusEl.className = check.exists ? "text-green-400 font-semibold" : "text-red-400 font-semibold";
        }
        if (sizeEl && check.exists) {
          sizeEl.textContent = `Size: ${(check.size / 1024 / 1024).toFixed(1)} MB`;
        }
      }

      if (priceHistoryRes.ok) {
        const data = await priceHistoryRes.json();
        const statusEl = document.getElementById("price-history-status");
        const sizeEl = document.getElementById("price-history-size");
        if (statusEl) {
          statusEl.textContent = data.length > 0 ? "✅ Available" : "❌ No data";
          statusEl.className = data.length > 0 ? "text-green-400 font-semibold" : "text-red-400 font-semibold";
        }
        if (sizeEl && data.length > 0) {
          sizeEl.textContent = `Snapshots: ${data.length}`;
        }
      }
    } catch (error: unknown) {
      console.error("Error refreshing file status:", error);
    }
  }

  async function handleDownloadMtgjson() {
    setAdminStatus("Checking for existing MTGJSON file...");
    setAdminLoading(true);
    setDownloadProgress(0);
    setDownloadSpeed(null);
    
    let poller: NodeJS.Timeout | null = null;
    let lastReceived = 0;
    let lastTime = Date.now();
    
    function formatSpeed(bytesPerSec: number) {
      if (bytesPerSec > 1024 * 1024) return (bytesPerSec / (1024 * 1024)).toFixed(2) + ' MB/s';
      if (bytesPerSec > 1024) return (bytesPerSec / 1024).toFixed(1) + ' KB/s';
      return bytesPerSec.toFixed(0) + ' B/s';
    }
    
    function formatBytes(bytes: number) {
      if (bytes > 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
      if (bytes > 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
      if (bytes > 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return bytes + ' B';
    }
    
    try {
      const checkRes = await fetch("/api/admin/check-mtgjson");
      if (checkRes.ok) {
        const checkText = await checkRes.text();
        let check: any = {};
        try {
          check = checkText && checkText.trim() ? JSON.parse(checkText) : {};
        } catch (parseError) {
          console.error('Failed to parse check response:', parseError);
          check = {};
        }
        
        if (check.exists) {
          // Frontend Agent: Check if download is in progress using new API
          const progressRes = await fetch("/api/admin/download-mtgjson");
          if (progressRes.ok) {
            const progressData = await progressRes.json();
            
            if (progressData.status === 'downloading' && progressData.progress) {
              const { percent } = progressData.progress;
              setAdminStatus(`AllPrices.json is currently downloading: ${percent}% complete.`);
              setAdminLoading(false);
              return;
            }
          }
          setAdminStatus(`AllPrices.json already downloaded (${(check.size/1024/1024).toFixed(1)} MB).`);
          setAdminLoading(false);
          return;
        }
      }
      
      setAdminStatus("Starting MTGJSON download...");
      
      // Frontend Agent: Start download with new async API
      const startRes = await fetch("/api/admin/download-mtgjson", { 
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!startRes.ok) {
        const errorText = await startRes.text();
        console.error('Download start failed:', startRes.status, startRes.statusText, errorText);
        throw new Error(`Failed to start download: ${startRes.status} ${startRes.statusText} - ${errorText}`);
      }

      const startResponse = await startRes.json();
      console.log('🚀 Download started:', startResponse);
      
      setAdminStatus(`Download started (ID: ${startResponse.downloadId}). Tracking progress...`);

      // Frontend Agent: Poll for status using new async GET endpoint
      poller = setInterval(async () => {
        try {
          const statusRes = await fetch("/api/admin/download-mtgjson");
          if (!statusRes.ok) {
            console.error('Status check failed:', statusRes.status);
            return;
          }
          
          const statusData = await statusRes.json();
          
          if (statusData.error) {
            console.error('Download error:', statusData.error);
            clearInterval(poller!);
            setAdminStatus(`Download failed: ${statusData.error}`);
            setAdminLoading(false);
            return;
          }

          const { status, progress } = statusData;
          
          if (status === 'downloading' && progress) {
            const { percent, received, total, speed } = progress;
            setDownloadProgress(percent);
            
            // Convert bytes per second to readable format
            if (speed) {
              setDownloadSpeed(formatSpeed(speed));
            }
            
            setAdminStatus(`Downloading: ${percent}% complete (${formatBytes(received)}/${formatBytes(total)})`);
          } else if (status === 'completed') {
            clearInterval(poller!);
            setDownloadProgress(100);
            setDownloadSpeed(null);
            setAdminStatus("MTGJSON file downloaded successfully! You can now import price history.");
            setAdminLoading(false);
          } else if (status === 'failed') {
            clearInterval(poller!);
            setAdminStatus(`Download failed: ${statusData.error || 'Unknown error'}`);
            setAdminLoading(false);
          }
        } catch (error) {
          console.error('Status polling error:', error);
        }
      }, 2000); // Poll every 2 seconds

    } catch (error: unknown) {
      setAdminStatus(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setAdminLoading(false);
      setDownloadProgress(null);
      if (poller) clearInterval(poller);
      await refreshFileStatus();
    }
  }

  async function handleImportMtgjson() {
    await startImport(false);
  }

  async function handleDebugImportMtgjson() {
    await startImport(true);
  }

  async function startImport(debugMode: boolean) {
    setAdminStatus(debugMode ? "Starting debug import (first 20 cards)..." : "Starting import...");
    setAdminLoading(true);
    setImportProgress(0);
    setImportPhase("starting");
    setImportRate(null);
    setImportEta(null);
    setImportProcessed(null);
    setImportTotal(null);

    let poller: NodeJS.Timeout | null = null;

    try {
      const checkRes = await fetch("/api/admin/check-mtgjson");
      if (!checkRes.ok || !(await checkRes.json()).exists) {
        setAdminStatus("❌ AllPrices.json not found. Please download MTGJSON first.");
        setAdminLoading(false);
        return;
      }

      const url = debugMode ? "/api/admin/import-mtgjson?debug=true" : "/api/admin/import-mtgjson";
      const startRes = await fetch(url, { method: "POST" });
      
      if (!startRes.ok) {
        const errorText = await startRes.text();
        throw new Error(errorText);
      }

      await new Promise<void>((resolve, reject) => {
        poller = setInterval(async () => {
          try {
            const res = await fetch("/api/admin/import-mtgjson?progress=1");
            if (!res.ok) return;
            
            const data = await res.json();
            
            if (!data.inProgress) {
              clearInterval(poller!);
              setAdminStatus("✅ Import completed successfully!");
              setImportPhase("completed");
              resolve();
              return;
            }

            if (data.progress !== undefined) setImportProgress(data.progress);
            if (data.phase) setImportPhase(data.phase);
            if (data.rate) setImportRate(data.rate);
            if (data.eta) setImportEta(data.eta);
            if (data.processed !== undefined) setImportProcessed(data.processed);
            if (data.total !== undefined) setImportTotal(data.total);
          } catch (e) {
            // ignore polling errors
          }
        }, 2000);

        setTimeout(() => {
          clearInterval(poller!);
          reject(new Error("Import timeout"));
        }, 30 * 60 * 1000);
      });
    } catch (error: unknown) {
      setAdminStatus(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setAdminLoading(false);
      setImportProgress(null);
      setImportPhase(null);
      if (poller) clearInterval(poller);
      await refreshFileStatus();
    }
  }

  async function handleDownloadPriceHistory() {
    try {
      setAdminLoading(true);
      setAdminStatus("Downloading price history...");
      const response = await fetch("/api/price-history/download");
      if (!response.ok) throw new Error("Download failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'price-history.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setAdminStatus("✅ Price history downloaded successfully!");
    } catch (error: unknown) {
      setAdminStatus(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setAdminLoading(false);
    }
  }

  async function handleDownloadImportLog() {
    try {
      setAdminLoading(true);
      setAdminStatus("Downloading import log...");
      const response = await fetch("/api/admin/import-log");
      if (!response.ok) throw new Error("Download failed");
      
      const data = await response.json();
      const blob = new Blob([data.log || "No log data available"], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'import-log.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setAdminStatus("✅ Import log downloaded successfully!");
    } catch (error: unknown) {
      setAdminStatus(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setAdminLoading(false);
    }
  }

  async function testJsonValidity() {
    try {
      setAdminLoading(true);
      const result = await triggerApiAction("/api/test-json");
      setAdminStatus(`✅ JSON validity test: ${JSON.stringify(result, null, 2)}`);
    } catch (error: unknown) {
      setAdminStatus(`❌ JSON test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setAdminLoading(false);
    }
  }

  async function clearLogs() {
    try {
      setAdminLoading(true);
      await triggerApiAction("/api/admin/clear-logs");
      setAdminStatus("✅ Logs cleared successfully!");
    } catch (error: unknown) {
      setAdminStatus(`❌ Clear logs failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setAdminLoading(false);
    }
  }

  async function clearImportLock() {
    try {
      setAdminLoading(true);
      await triggerApiAction("/api/admin/clear-import-lock");
      setAdminStatus("✅ Import lock cleared successfully!");
    } catch (error: unknown) {
      setAdminStatus(`❌ Clear lock failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setAdminLoading(false);
    }
  }

  // CSV handling
  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setProgress(0);
    
    try {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (result) => {
          const data = result.data as any[];
          setProgress(10);
          
          const cardPromises = data.map(async (row, index) => {
            const cardName = row.Name || row.name || row.card_name;
            if (!cardName) return null;

            try {
              const response = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}`);
              if (!response.ok) return { name: cardName, price: row.Price || row.price };
              
              const cardData = await response.json();
              const price = cardData.prices?.usd || row.Price || row.price;
              
              return {
                name: cardName,
                imageUrl: cardData.image_uris?.normal,
                price: price,
                set: cardData.set,
                set_name: cardData.set_name
              };
            } catch {
              return { name: cardName, price: row.Price || row.price };
            } finally {
              setProgress(10 + Math.floor((index / data.length) * 90));
            }
          });

          const resolvedCards = await Promise.all(cardPromises);
          const validCards = resolvedCards.filter(Boolean) as Card[];
          
          setCards(validCards);
          setProgress(100);
          setLoading(false);
        },
        error: (error) => {
          console.error("CSV parsing error:", error);
          setLoading(false);
        }
      });
    } catch (error: unknown) {
      console.error("File processing error:", error);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen w-full flex flex-col items-center bg-gray-950 text-gray-100 px-3 sm:px-4 py-4 sm:py-8">
      {/* Navigation to Enhanced Admin - Mobile Optimized */}
      <div className="w-full max-w-4xl mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-700 rounded-xl">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-blue-400">Enhanced Admin Dashboard Available</h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Access comprehensive system monitoring, security dashboard, and performance metrics
            </p>
          </div>
          <a
            href="/admin"
            className="px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg text-center text-sm sm:text-base"
            style={{ minHeight: '44px' }}
          >
            🚀 Open Enhanced Admin
          </a>
        </div>
      </div>

      <DashboardCards cards={defaultDashboardCards} />
      
      <AdminToolsPanel
        adminStatus={adminStatus}
        adminLoading={adminLoading}
        downloadProgress={downloadProgress}
        downloadSpeed={downloadSpeed}
        importProgress={importProgress}
        importPhase={importPhase}
        importRate={importRate}
        importEta={importEta}
        importProcessed={importProcessed}
        importTotal={importTotal}
        onDownloadMtgjson={handleDownloadMtgjson}
        onImportMtgjson={handleImportMtgjson}
        onDebugImportMtgjson={handleDebugImportMtgjson}
        onDownloadPriceHistory={handleDownloadPriceHistory}
        onDownloadImportLog={handleDownloadImportLog}
        onRefreshFileStatus={refreshFileStatus}
        onTestJsonValidity={testJsonValidity}
        onClearLogs={clearLogs}
        onClearImportLock={clearImportLock}
      />
      
      <CSVUpload
        onFileChange={handleFileChange}
        cards={cards}
        showNoPrice={showNoPrice}
        setShowNoPrice={setShowNoPrice}
        cardsNoPrice={cardsNoPrice}
        total={total}
        loading={loading}
        progress={progress}
      />
      
      {cards.length > 0 && (
        <CardFilters
          minPrice={minPrice}
          maxPrice={maxPrice}
          searchName={searchName}
          searchSet={searchSet}
          setMinPrice={setMinPrice}
          setMaxPrice={setMaxPrice}
          setSearchName={setSearchName}
          setSearchSet={setSearchSet}
          showNameSuggestions={showNameSuggestions}
          setShowNameSuggestions={setShowNameSuggestions}
          showSetSuggestions={showSetSuggestions}
          setShowSetSuggestions={setShowSetSuggestions}
          nameSuggestions={nameSuggestions}
          setSuggestions={setSuggestions}
          nameInputRef={nameInputRef}
        />
      )}
      
      <CardGrid cards={showNoPrice ? cardsNoPrice : filteredCards} showNoPrice={showNoPrice} />
    </main>
  );
}
