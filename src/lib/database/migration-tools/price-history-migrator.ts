/**
 * Price History Migrator
 * Migrates existing price-history.json data to database
 */

import * as fs from 'fs/promises';
import db from '../connection';
import { PriceHistoryModel, ImportLogModel } from '../models';
import { FILES } from '../../config';
import type { PriceSnapshot, ProcessedCardPrice } from '../../../types/mtg';

interface PriceHistoryMigrationProgress {
  totalSnapshots: number;
  processedSnapshots: number;
  totalPricePoints: number;
  processedPricePoints: number;
  errors: number;
  importLogId?: number;
}

/**
 * Migrate price-history.json to database
 */
export async function migratePriceHistoryToDatabase(
  filePath?: string,
  options: {
    batchSize?: number;
    progressCallback?: (progress: PriceHistoryMigrationProgress) => void;
    skipExisting?: boolean;
  } = {}
): Promise<PriceHistoryMigrationProgress> {
  const {
    batchSize = 1000,
    progressCallback,
    skipExisting = true
  } = options;

  const priceHistoryFile = filePath || FILES.PRICE_HISTORY;
  
  const progress: PriceHistoryMigrationProgress = {
    totalSnapshots: 0,
    processedSnapshots: 0,
    totalPricePoints: 0,
    processedPricePoints: 0,
    errors: 0
  };

  console.log(`Starting price history migration from: ${priceHistoryFile}`);

  try {
    // Ensure database is connected
    if (!db.isConnected()) {
      await db.connect();
    }

    // Start import logging
    progress.importLogId = await ImportLogModel.startImport('price_history_migration', {
      filePath: priceHistoryFile,
      batchSize,
      skipExisting
    });

    // Check if file exists
    try {
      await fs.access(priceHistoryFile);
    } catch (error) {
      console.log(`Price history file not found: ${priceHistoryFile}. Skipping migration.`);
      return progress;
    }

    // Read and parse price history file
    console.log('Reading price history file...');
    const priceHistoryContent = await fs.readFile(priceHistoryFile, 'utf-8');
    const priceSnapshots: PriceSnapshot[] = JSON.parse(priceHistoryContent);

    progress.totalSnapshots = priceSnapshots.length;
    
    // Count total price points
    for (const snapshot of priceSnapshots) {
      for (const cardPrice of snapshot.cards) {
        progress.totalPricePoints += Object.keys(cardPrice.prices).length;
      }
    }

    console.log(`Found ${progress.totalSnapshots} snapshots with ${progress.totalPricePoints} total price points`);

    // Process each snapshot
    let priceDataBatch: {
      cardUuid: string;
      date: Date;
      price: number;
      source: string;
      variant: string;
    }[] = [];

    for (const snapshot of priceSnapshots) {
      try {
        const snapshotDate = new Date(snapshot.date);
        
        for (const cardPrice of snapshot.cards) {
          for (const [dateStr, price] of Object.entries(cardPrice.prices)) {
            const priceDate = new Date(dateStr);
            
            priceDataBatch.push({
              cardUuid: cardPrice.uuid,
              date: priceDate,
              price: price,
              source: 'tcgplayer', // Default source for historical data
              variant: 'normal'    // Default variant for historical data
            });

            progress.totalPricePoints++;

            // Process batch when full
            if (priceDataBatch.length >= batchSize) {
              await processPriceBatch(priceDataBatch, progress, skipExisting);
              priceDataBatch = [];
              
              if (progressCallback) {
                progressCallback(progress);
              }

              // Update import log progress
              if (progress.importLogId) {
                await ImportLogModel.updateProgress(
                  progress.importLogId,
                  progress.processedPricePoints,
                  progress.errors
                );
              }
            }
          }
        }

        progress.processedSnapshots++;

      } catch (error) {
        console.error(`Error processing snapshot ${snapshot.date}:`, error);
        progress.errors++;
      }
    }

    // Process remaining price data
    if (priceDataBatch.length > 0) {
      await processPriceBatch(priceDataBatch, progress, skipExisting);
    }

    // Complete import logging
    if (progress.importLogId) {
      await ImportLogModel.completeImport(
        progress.importLogId,
        progress.processedPricePoints,
        progress.errors
      );
    }

    console.log('Price history migration completed:', progress);
    return progress;

  } catch (error) {
    console.error('Price history migration failed:', error);
    
    // Fail import logging
    if (progress.importLogId) {
      await ImportLogModel.failImport(
        progress.importLogId,
        error instanceof Error ? error.message : 'Unknown error',
        progress.processedPricePoints,
        progress.errors
      );
    }
    
    throw error;
  }
}

/**
 * Process a batch of price data
 */
async function processPriceBatch(
  priceData: {
    cardUuid: string;
    date: Date;
    price: number;
    source: string;
    variant: string;
  }[],
  progress: PriceHistoryMigrationProgress,
  skipExisting: boolean
): Promise<void> {
  try {
    await PriceHistoryModel.addPriceBatch(priceData);
    progress.processedPricePoints += priceData.length;
  } catch (error) {
    console.error('Error processing price batch:', error);
    progress.errors += priceData.length;
  }
}

/**
 * Migrate existing price-history.json and create backup
 */
export async function migrateAndBackupPriceHistory(): Promise<{
  migrationResult: PriceHistoryMigrationProgress;
  backupCreated: boolean;
}> {
  let backupCreated = false;

  try {
    // Create backup of existing price history
    try {
      await fs.access(FILES.PRICE_HISTORY);
      await fs.copyFile(FILES.PRICE_HISTORY, FILES.PRICE_HISTORY_BACKUP);
      backupCreated = true;
      console.log(`Backup created: ${FILES.PRICE_HISTORY_BACKUP}`);
    } catch (error) {
      console.log('No existing price history file to backup');
    }

    // Migrate to database
    const migrationResult = await migratePriceHistoryToDatabase();

    return {
      migrationResult,
      backupCreated
    };

  } catch (error) {
    console.error('Migration and backup failed:', error);
    throw error;
  }
}

/**
 * Export database price history back to JSON format
 */
export async function exportPriceHistoryToJSON(
  outputPath?: string,
  dateRange?: { start: Date; end: Date }
): Promise<string> {
  const outputFile = outputPath || FILES.PRICE_HISTORY;

  try {
    console.log('Exporting price history from database to JSON...');

    // Get all cards with price history
    const cardQuery = 'SELECT DISTINCT card_uuid FROM price_history';
    let params: any[] = [];
    
    if (dateRange) {
      cardQuery.concat(' WHERE price_date BETWEEN ? AND ?');
      params = [dateRange.start.toISOString().split('T')[0], dateRange.end.toISOString().split('T')[0]];
    }

    const cardResults = await db.query(cardQuery, params);
    const cardUuids = cardResults.map(row => row.card_uuid);

    // Get processed card prices
    const processedPrices = await PriceHistoryModel.getProcessedCardPrices(cardUuids);

    // Create snapshot format
    const snapshot: PriceSnapshot = {
      date: new Date().toISOString(),
      cards: processedPrices
    };

    // Write to file
    await fs.writeFile(outputFile, JSON.stringify([snapshot], null, 2));
    
    console.log(`Price history exported to: ${outputFile}`);
    return outputFile;

  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  }
}

/**
 * Get price history migration statistics
 */
export async function getPriceHistoryMigrationStats(): Promise<{
  hasPriceHistoryFile: boolean;
  hasBackupFile: boolean;
  pricePointsInDatabase: number;
  lastMigration?: Date;
}> {
  const [priceStats] = await Promise.all([
    PriceHistoryModel.getPriceStats()
  ]);

  // Check file existence
  let hasPriceHistoryFile = false;
  let hasBackupFile = false;

  try {
    await fs.access(FILES.PRICE_HISTORY);
    hasPriceHistoryFile = true;
  } catch {
    // File doesn't exist
  }

  try {
    await fs.access(FILES.PRICE_HISTORY_BACKUP);
    hasBackupFile = true;
  } catch {
    // File doesn't exist
  }

  // Get last migration
  const recentImports = await ImportLogModel.getByType('price_history_migration', 1);
  const lastMigration = recentImports.length > 0 ? recentImports[0].completedAt : undefined;

  return {
    hasPriceHistoryFile,
    hasBackupFile,
    pricePointsInDatabase: priceStats.totalPricePoints,
    lastMigration
  };
}