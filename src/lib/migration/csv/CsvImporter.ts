/**
 * Cardsphere CSV Import Pipeline
 * Handles importing price data from Cardsphere CSV format
 */

import * as fs from 'fs/promises';
import * as Papa from 'papaparse';
import { MigrationBase } from '../base/MigrationBase';
import { ErrorRecovery } from '../base/ErrorRecovery';
import { CardModel, PriceHistoryModel, CardSetModel } from '../../database/models';
import type { CardsphereCSVRow } from '../../../types/mtg';
import type { 
  MigrationResult, 
  CsvImportOptions,
  CsvRow,
  ValidationError 
} from '../types';

interface ParsedCardsphereRow {
  name: string;
  setCode: string;
  setName?: string;
  quantity?: number;
  condition?: string;
  language?: string;
  foil: boolean;
  price?: number;
}

export class CsvImporter extends MigrationBase {
  private errorRecovery: ErrorRecovery;
  private sourceFile: string;
  private csvOptions: CsvImportOptions;

  constructor(sourceFile: string, options: CsvImportOptions) {
    super(options);
    this.sourceFile = sourceFile;
    this.csvOptions = options;
    this.errorRecovery = new ErrorRecovery();
  }

  /**
   * Main import method
   */
  async migrate(): Promise<MigrationResult> {
    const startTime = Date.now();
    let processed = 0;
    let failed = 0;
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      this.updateProgress({ phase: 'validating_source' });
      
      // Validate source file
      await this.validateSourceFile();

      this.updateProgress({ phase: 'parsing_csv' });
      
      // Parse CSV data
      const csvData = await this.parseCsvFile();
      
      this.updateProgress({ 
        phase: 'preparing_data',
        total: csvData.length 
      });

      // Validate and transform CSV data
      const { valid: validRows, invalid: invalidRows } = await this.validateCsvData(csvData);
      
      if (invalidRows.length > 0) {
        warnings.push(`${invalidRows.length} rows failed validation and will be skipped`);
        invalidRows.forEach(({ error }) => warnings.push(error));
      }

      if (!this.options.dryRun) {
        // Match cards with database
        this.updateProgress({ phase: 'matching_cards' });
        
        const matchResult = await this.matchCardsWithDatabase(validRows);
        warnings.push(`Matched ${matchResult.matched} of ${validRows.length} cards`);
        
        if (matchResult.unmatched > 0) {
          warnings.push(`${matchResult.unmatched} cards could not be matched and will be skipped`);
        }

        // Import price data
        this.updateProgress({ phase: 'importing_prices' });
        
        const importResult = await this.importPriceData(matchResult.matchedRows);
        processed = importResult.processed;
        failed = importResult.failed;
        errors.push(...importResult.errors);

      } else {
        processed = validRows.length;
        warnings.push('Dry run: no data was actually imported');
      }

      this.updateProgress({ phase: 'completed' });

      return {
        success: true,
        processed,
        failed,
        duration: Date.now() - startTime,
        errors,
        warnings
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(errorMessage);
      
      return {
        success: false,
        processed,
        failed: failed + 1,
        duration: Date.now() - startTime,
        errors,
        warnings
      };
    }
  }

  /**
   * Validate source file exists and is readable
   */
  private async validateSourceFile(): Promise<void> {
    try {
      const stats = await fs.stat(this.sourceFile);
      
      if (!stats.isFile()) {
        throw new Error(`Source path is not a file: ${this.sourceFile}`);
      }

      if (stats.size === 0) {
        throw new Error(`Source file is empty: ${this.sourceFile}`);
      }

      if (stats.size > this.csvOptions.maxFileSize || 100 * 1024 * 1024) { // 100MB default limit
        throw new Error(`Source file too large: ${this.sourceFile}`);
      }

      // Check file extension
      const ext = this.sourceFile.toLowerCase().split('.').pop();
      if (ext !== 'csv') {
        warnings.push(`File extension is not .csv, proceeding anyway`);
      }

    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        throw new Error(`Source file not found: ${this.sourceFile}`);
      }
      throw error;
    }
  }

  /**
   * Parse CSV file using Papa Parse
   */
  private async parseCsvFile(): Promise<CsvRow[]> {
    try {
      const content = await fs.readFile(this.sourceFile, this.csvOptions.encoding || 'utf8');
      
      return new Promise((resolve, reject) => {
        Papa.parse(content, {
          header: !this.csvOptions.skipHeaders,
          delimiter: this.csvOptions.delimiter || ',',
          skipEmptyLines: true,
          transformHeader: (header: string) => header.trim(),
          transform: (value: string) => value.trim(),
          complete: (results) => {
            if (results.errors.length > 0) {
              const errorMessages = results.errors.map(err => `Row ${err.row}: ${err.message}`);
              reject(new Error(`CSV parsing errors: ${errorMessages.join('; ')}`));
            } else {
              resolve(results.data as CsvRow[]);
            }
          },
          error: (error) => {
            reject(new Error(`CSV parsing failed: ${error.message}`));
          }
        });
      });
    } catch (error) {
      throw new Error(`Failed to read CSV file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate and transform CSV data to internal format
   */
  private async validateCsvData(csvData: CsvRow[]): Promise<{
    valid: ParsedCardsphereRow[];
    invalid: Array<{ item: CsvRow; error: string }>;
  }> {
    const valid: ParsedCardsphereRow[] = [];
    const invalid: Array<{ item: CsvRow; error: string }> = [];

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      
      try {
        const parsedRow = this.parseCardsphereRow(row, i);
        if (parsedRow) {
          valid.push(parsedRow);
        }
      } catch (error) {
        invalid.push({
          item: row,
          error: `Row ${i + 1}: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    }

    return { valid, invalid };
  }

  /**
   * Parse individual Cardsphere CSV row
   */
  private parseCardsphereRow(row: CsvRow, rowIndex: number): ParsedCardsphereRow | null {
    // Common Cardsphere CSV field mappings
    const name = row['Name'] || row['Card Name'] || row['name'];
    const setCode = row['Set'] || row['Set Code'] || row['set'];
    const setName = row['Set Name'] || row['set_name'];
    const quantity = row['Quantity'] || row['Qty'] || row['quantity'];
    const condition = row['Condition'] || row['condition'];
    const language = row['Language'] || row['Lang'] || row['language'];
    const foil = row['Foil'] || row['foil'];
    const price = row['Price'] || row['Value'] || row['price'];

    // Validate required fields
    if (!name) {
      throw new Error('Missing required field: Name');
    }

    if (!setCode) {
      throw new Error('Missing required field: Set');
    }

    // Parse and validate data types
    let parsedQuantity: number | undefined;
    if (quantity) {
      parsedQuantity = parseInt(quantity.toString(), 10);
      if (isNaN(parsedQuantity) || parsedQuantity < 0) {
        throw new Error(`Invalid quantity: ${quantity}`);
      }
    }

    let parsedPrice: number | undefined;
    if (price) {
      // Remove currency symbols and parse
      const cleanPrice = price.toString().replace(/[$,\s]/g, '');
      parsedPrice = parseFloat(cleanPrice);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        throw new Error(`Invalid price: ${price}`);
      }
    }

    // Parse foil status
    const isFoil = foil ? 
      (foil.toString().toLowerCase() === 'true' || 
       foil.toString().toLowerCase() === 'yes' || 
       foil.toString() === '1') : false;

    return {
      name: name.toString().trim(),
      setCode: setCode.toString().trim().toUpperCase(),
      setName: setName?.toString().trim(),
      quantity: parsedQuantity,
      condition: condition?.toString().trim(),
      language: language?.toString().trim() || 'English',
      foil: isFoil,
      price: parsedPrice
    };
  }

  /**
   * Match CSV cards with existing database cards
   */
  private async matchCardsWithDatabase(rows: ParsedCardsphereRow[]): Promise<{
    matched: number;
    unmatched: number;
    matchedRows: Array<ParsedCardsphereRow & { cardUuid: string }>;
  }> {
    const matchedRows: Array<ParsedCardsphereRow & { cardUuid: string }> = [];
    let matched = 0;
    let unmatched = 0;

    // Group rows by set for efficient database queries
    const rowsBySet = new Map<string, ParsedCardsphereRow[]>();
    
    for (const row of rows) {
      if (!rowsBySet.has(row.setCode)) {
        rowsBySet.set(row.setCode, []);
      }
      rowsBySet.get(row.setCode)!.push(row);
    }

    // Process each set
    for (const [setCode, setRows] of rowsBySet) {
      try {
        // Get all cards from this set
        const setCards = await CardModel.findBySet(setCode, 10000);
        const cardsByName = new Map(setCards.map(card => [card.name.toLowerCase(), card.uuid]));

        // Match rows with cards
        for (const row of setRows) {
          const cardUuid = cardsByName.get(row.name.toLowerCase());
          
          if (cardUuid) {
            matchedRows.push({ ...row, cardUuid });
            matched++;
          } else {
            unmatched++;
            
            // Try fuzzy matching for common variations
            const fuzzyMatch = this.findFuzzyMatch(row.name, Array.from(cardsByName.keys()));
            if (fuzzyMatch) {
              const uuid = cardsByName.get(fuzzyMatch);
              if (uuid) {
                matchedRows.push({ ...row, cardUuid: uuid });
                matched++;
                unmatched--;
              }
            }
          }
        }
      } catch (error) {
        console.warn(`Failed to process set ${setCode}:`, error);
        unmatched += setRows.length;
      }
    }

    return { matched, unmatched, matchedRows };
  }

  /**
   * Simple fuzzy matching for card names
   */
  private findFuzzyMatch(targetName: string, cardNames: string[]): string | null {
    const target = targetName.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    for (const cardName of cardNames) {
      const candidate = cardName.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Exact match after normalization
      if (candidate === target) {
        return cardName;
      }
      
      // Check if one is contained in the other
      if (candidate.includes(target) || target.includes(candidate)) {
        return cardName;
      }
    }

    return null;
  }

  /**
   * Import price data to database
   */
  private async importPriceData(matchedRows: Array<ParsedCardsphereRow & { cardUuid: string }>): Promise<{
    processed: number;
    failed: number;
    errors: string[];
  }> {
    let processed = 0;
    let failed = 0;
    const errors: string[] = [];

    // Filter rows that have price data
    const rowsWithPrices = matchedRows.filter(row => row.price !== undefined);

    if (rowsWithPrices.length === 0) {
      return { processed, failed, errors };
    }

    // Convert to price history entries
    const priceEntries = rowsWithPrices.map(row => ({
      card_uuid: row.cardUuid,
      price_date: new Date(), // Use current date for import
      price: row.price!,
      source: 'cardsphere',
      variant: row.foil ? 'foil' : 'normal'
    }));

    // Import in batches
    const processor = async (batch: typeof priceEntries) => {
      try {
        await PriceHistoryModel.createBatch(batch);
        return batch;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`Price batch import failed: ${errorMessage}`);
        throw error;
      }
    };

    const results = await this.processBatches(priceEntries, processor, 'importing_prices');
    processed = results.length;
    failed = priceEntries.length - processed;

    return { processed, failed, errors };
  }

  /**
   * Validate CSV format against expected Cardsphere structure
   */
  static async validateCsvFormat(filePath: string): Promise<{
    valid: boolean;
    requiredFields: string[];
    foundFields: string[];
    missingFields: string[];
  }> {
    const requiredFields = ['Name', 'Set'];
    const optionalFields = ['Set Name', 'Quantity', 'Condition', 'Language', 'Foil', 'Price'];
    
    try {
      const content = await fs.readFile(filePath, 'utf8');
      
      return new Promise((resolve) => {
        Papa.parse(content, {
          header: true,
          preview: 1, // Only parse first row to get headers
          complete: (results) => {
            const foundFields = results.meta.fields || [];
            const missingFields = requiredFields.filter(field => !foundFields.includes(field));
            
            resolve({
              valid: missingFields.length === 0,
              requiredFields: [...requiredFields, ...optionalFields],
              foundFields,
              missingFields
            });
          },
          error: () => {
            resolve({
              valid: false,
              requiredFields: [...requiredFields, ...optionalFields],
              foundFields: [],
              missingFields: requiredFields
            });
          }
        });
      });
    } catch (error) {
      return {
        valid: false,
        requiredFields: [...requiredFields, ...optionalFields],
        foundFields: [],
        missingFields: requiredFields
      };
    }
  }

  /**
   * Get import preview without actually importing
   */
  async getImportPreview(maxRows: number = 10): Promise<{
    totalRows: number;
    sampleRows: ParsedCardsphereRow[];
    estimatedMatches: number;
    issues: string[];
  }> {
    const issues: string[] = [];
    
    try {
      // Parse first batch of CSV
      const csvData = await this.parseCsvFile();
      const sampleSize = Math.min(maxRows, csvData.length);
      const sampleData = csvData.slice(0, sampleSize);
      
      // Validate sample
      const { valid: validRows, invalid: invalidRows } = await this.validateCsvData(sampleData);
      
      if (invalidRows.length > 0) {
        issues.push(`${invalidRows.length} of ${sampleSize} sample rows have validation errors`);
      }

      // Estimate matches for sample
      const matchResult = await this.matchCardsWithDatabase(validRows);
      const matchRate = validRows.length > 0 ? matchResult.matched / validRows.length : 0;
      
      return {
        totalRows: csvData.length,
        sampleRows: validRows,
        estimatedMatches: Math.round(csvData.length * matchRate),
        issues
      };
      
    } catch (error) {
      issues.push(`Preview failed: ${error instanceof Error ? error.message : String(error)}`);
      
      return {
        totalRows: 0,
        sampleRows: [],
        estimatedMatches: 0,
        issues
      };
    }
  }
}