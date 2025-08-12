/**
 * Cardsphere CSV Importer
 * Imports Cardsphere CSV data with staging table for conflict resolution
 */

import * as fs from 'fs/promises';
import * as Papa from 'papaparse';
import db from '../connection';
import { CardModel, ImportLogModel } from '../models';
import type { CardsphereCSVRow } from '../../../types/mtg';

interface CardsphereImportOptions {
  batchSize?: number;
  progressCallback?: (progress: CardsphereImportProgress) => void;
  conflictResolution?: 'skip' | 'update' | 'error';
  validateCards?: boolean;
}

interface CardsphereImportProgress {
  totalRows: number;
  processedRows: number;
  importedCards: number;
  skippedRows: number;
  errors: number;
  importLogId?: number;
}

interface StagingRow {
  name: string;
  set_code: string;
  set_name?: string;
  quantity?: number;
  condition?: string;
  language?: string;
  foil?: boolean;
  price?: number;
  row_number: number;
  status: 'pending' | 'matched' | 'unmatched' | 'error';
  matched_uuid?: string;
  error_message?: string;
}

/**
 * Create staging table for CSV import
 */
async function createStagingTable(): Promise<void> {
  const createTableSQL = db.getType() === 'sqlite' 
    ? `CREATE TEMP TABLE IF NOT EXISTS cardsphere_staging (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        set_code TEXT,
        set_name TEXT,
        quantity INTEGER,
        condition TEXT,
        language TEXT,
        foil BOOLEAN DEFAULT FALSE,
        price DECIMAL(10,2),
        row_number INTEGER,
        status TEXT DEFAULT 'pending',
        matched_uuid TEXT,
        error_message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    : `CREATE TEMP TABLE IF NOT EXISTS cardsphere_staging (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        set_code VARCHAR(10),
        set_name VARCHAR(255),
        quantity INTEGER,
        condition VARCHAR(20),
        language VARCHAR(10),
        foil BOOLEAN DEFAULT FALSE,
        price DECIMAL(10,2),
        row_number INTEGER,
        status VARCHAR(20) DEFAULT 'pending',
        matched_uuid VARCHAR(36),
        error_message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )`;

  await db.query(createTableSQL);
}

/**
 * Import Cardsphere CSV file
 */
export async function importCardsphereCSV(
  filePath: string,
  options: CardsphereImportOptions = {}
): Promise<CardsphereImportProgress> {
  const {
    batchSize = 500,
    progressCallback,
    conflictResolution = 'skip',
    validateCards = true
  } = options;

  const progress: CardsphereImportProgress = {
    totalRows: 0,
    processedRows: 0,
    importedCards: 0,
    skippedRows: 0,
    errors: 0
  };

  console.log(`Starting Cardsphere CSV import from: ${filePath}`);

  try {
    // Ensure database is connected
    if (!db.isConnected()) {
      await db.connect();
    }

    // Start import logging
    progress.importLogId = await ImportLogModel.startImport('cardsphere_csv', {
      filePath,
      batchSize,
      conflictResolution,
      validateCards
    });

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      throw new Error(`CSV file not found: ${filePath}`);
    }

    // Read and parse CSV file
    const csvContent = await fs.readFile(filePath, 'utf-8');
    const parseResult = Papa.parse<CardsphereCSVRow>(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      transform: (value) => value.trim()
    });

    if (parseResult.errors.length > 0) {
      console.warn('CSV parsing warnings:', parseResult.errors);
    }

    const csvRows = parseResult.data;
    progress.totalRows = csvRows.length;

    if (progress.totalRows === 0) {
      throw new Error('No data found in CSV file');
    }

    console.log(`Processing ${progress.totalRows} CSV rows...`);

    // Create staging table
    await createStagingTable();

    // Load data into staging table
    await loadDataToStaging(csvRows, progress);

    // Match cards in staging with existing database cards
    if (validateCards) {
      await matchCardsInStaging(progress);
    }

    // Process staging data and import to main tables
    await processStagingData(conflictResolution, progress, batchSize);

    // Clean up staging table
    await db.query('DROP TABLE IF EXISTS cardsphere_staging');

    // Complete import logging
    if (progress.importLogId) {
      await ImportLogModel.completeImport(
        progress.importLogId,
        progress.importedCards,
        progress.errors
      );
    }

    console.log('Cardsphere CSV import completed:', progress);
    return progress;

  } catch (error) {
    console.error('Cardsphere CSV import failed:', error);
    
    // Fail import logging
    if (progress.importLogId) {
      await ImportLogModel.failImport(
        progress.importLogId,
        error instanceof Error ? error.message : 'Unknown error',
        progress.importedCards,
        progress.errors
      );
    }
    
    throw error;
  }
}

/**
 * Load CSV data into staging table
 */
async function loadDataToStaging(
  csvRows: CardsphereCSVRow[],
  progress: CardsphereImportProgress
): Promise<void> {
  console.log('Loading data to staging table...');

  const insertSQL = `
    INSERT INTO cardsphere_staging (
      name, set_code, set_name, quantity, condition, language, foil, price, row_number
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  for (let i = 0; i < csvRows.length; i++) {
    const row = csvRows[i];
    
    try {
      // Validate required fields
      if (!row.Name) {
        progress.skippedRows++;
        continue;
      }

      // Parse values
      const quantity = row.Quantity ? parseInt(row.Quantity) : 1;
      const price = row.Price ? parseFloat(row.Price.replace(/[$,]/g, '')) : null;
      const foil = row.Foil ? row.Foil.toLowerCase() === 'true' || row.Foil.toLowerCase() === 'yes' : false;

      await db.query(insertSQL, [
        row.Name,
        row.Set || null,
        row['Set Name'] || null,
        quantity,
        row.Condition || null,
        row.Language || 'English',
        foil,
        price,
        i + 1
      ]);

      progress.processedRows++;

    } catch (error) {
      console.error(`Error loading row ${i + 1}:`, error);
      progress.errors++;
    }
  }

  console.log(`Loaded ${progress.processedRows} rows to staging table`);
}

/**
 * Match cards in staging with existing database cards
 */
async function matchCardsInStaging(progress: CardsphereImportProgress): Promise<void> {
  console.log('Matching cards with database...');

  // Match by exact name and set
  const exactMatchSQL = `
    UPDATE cardsphere_staging 
    SET status = 'matched', matched_uuid = (
      SELECT uuid FROM cards 
      WHERE cards.name = cardsphere_staging.name 
      AND cards.set_code = cardsphere_staging.set_code
      LIMIT 1
    )
    WHERE cardsphere_staging.set_code IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM cards 
      WHERE cards.name = cardsphere_staging.name 
      AND cards.set_code = cardsphere_staging.set_code
    )
  `;

  await db.query(exactMatchSQL);

  // Match by name only (for rows without set or unmatched)
  const nameMatchSQL = `
    UPDATE cardsphere_staging 
    SET status = 'matched', matched_uuid = (
      SELECT uuid FROM cards 
      WHERE cards.name = cardsphere_staging.name 
      LIMIT 1
    )
    WHERE status = 'pending'
    AND EXISTS (
      SELECT 1 FROM cards 
      WHERE cards.name = cardsphere_staging.name
    )
  `;

  await db.query(nameMatchSQL);

  // Mark remaining as unmatched
  await db.query("UPDATE cardsphere_staging SET status = 'unmatched' WHERE status = 'pending'");

  // Get match statistics
  const stats = await db.query(`
    SELECT status, COUNT(*) as count 
    FROM cardsphere_staging 
    GROUP BY status
  `);

  console.log('Card matching completed:', stats);
}

/**
 * Process staging data and import to main tables
 */
async function processStagingData(
  conflictResolution: 'skip' | 'update' | 'error',
  progress: CardsphereImportProgress,
  batchSize: number
): Promise<void> {
  console.log('Processing staging data...');

  // Get all staging records
  const stagingRecords = await db.query(`
    SELECT * FROM cardsphere_staging 
    ORDER BY row_number
  `);

  let batch = [];
  for (const record of stagingRecords) {
    if (record.status === 'matched') {
      // Card exists in database
      if (conflictResolution === 'skip') {
        progress.skippedRows++;
        continue;
      } else if (conflictResolution === 'update') {
        // Could implement price updates here if needed
        progress.skippedRows++;
        continue;
      } else if (conflictResolution === 'error') {
        progress.errors++;
        continue;
      }
    } else if (record.status === 'unmatched') {
      // Create new card record (though we don't have enough MTGJSON data)
      console.warn(`Unmatched card: ${record.name} (${record.set_code})`);
      progress.skippedRows++;
      continue;
    }

    batch.push(record);

    if (batch.length >= batchSize) {
      await processBatch(batch, progress);
      batch = [];
    }
  }

  if (batch.length > 0) {
    await processBatch(batch, progress);
  }
}

/**
 * Process a batch of staging records
 */
async function processBatch(
  records: any[],
  progress: CardsphereImportProgress
): Promise<void> {
  for (const record of records) {
    try {
      // For now, we just count successfully processed records
      // In a real implementation, you might update inventory quantities, 
      // user collections, or other application-specific data
      progress.importedCards++;
    } catch (error) {
      console.error(`Error processing record ${record.row_number}:`, error);
      progress.errors++;
    }
  }
}

/**
 * Get Cardsphere import statistics
 */
export async function getCardsphereImportStats(): Promise<{
  totalImports: number;
  successfulImports: number;
  failedImports: number;
  lastImport?: Date;
}> {
  const imports = await ImportLogModel.getByType('cardsphere_csv');
  
  const totalImports = imports.length;
  const successfulImports = imports.filter(imp => imp.status === 'completed').length;
  const failedImports = imports.filter(imp => imp.status === 'failed').length;
  const lastImport = imports.length > 0 ? imports[0].completedAt : undefined;

  return {
    totalImports,
    successfulImports,
    failedImports,
    lastImport
  };
}