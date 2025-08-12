/**
 * MTGJSON to Database Importer
 * Converts MTGJSON AllPrices.json data to database format
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { Readable } from 'stream';
import * as StreamValues from 'stream-json/streamers/StreamValues';
import * as parser from 'stream-json';

import db from '../connection';
import { CardModel, PriceHistoryModel, CardSetModel, ImportLogModel } from '../models';
import { FILES } from '../../config';
import type { MTGCard, MTGCardPrices } from '../../../types/mtg';

interface MTGJSONCard {
  uuid: string;
  name: string;
  setCode: string;
  setName?: string;
  rarity?: string;
  typeLine?: string;
  manaCost?: string;
  convertedManaCost?: number;
  text?: string;
  prices?: MTGCardPrices;
  // Add other MTGJSON fields as needed
}

interface ImportProgress {
  totalCards: number;
  processedCards: number;
  processedPrices: number;
  processedSets: number;
  errors: number;
  importLogId?: number;
}

/**
 * Import MTGJSON AllPrices.json data to database
 */
export async function importMTGJSONToDatabase(
  filePath?: string,
  options: {
    batchSize?: number;
    progressCallback?: (progress: ImportProgress) => void;
    skipExisting?: boolean;
  } = {}
): Promise<ImportProgress> {
  const {
    batchSize = 1000,
    progressCallback,
    skipExisting = true
  } = options;

  const mtgjsonFile = filePath || FILES.MTGJSON_ALLPRICES;
  
  // Initialize progress tracking
  const progress: ImportProgress = {
    totalCards: 0,
    processedCards: 0,
    processedPrices: 0,
    processedSets: 0,
    errors: 0
  };

  let cardBatch: Omit<MTGCard, 'prices'>[] = [];
  const setMap = new Map<string, { code: string; name: string }>();

  console.log(`Starting MTGJSON import from: ${mtgjsonFile}`);

  try {
    // Ensure database is connected
    if (!db.isConnected()) {
      await db.connect();
    }

    // Start import logging
    progress.importLogId = await ImportLogModel.startImport('mtgjson', {
      filePath: mtgjsonFile,
      batchSize,
      skipExisting
    });

    // Check if file exists
    try {
      await fs.access(mtgjsonFile);
    } catch (error) {
      throw new Error(`MTGJSON file not found: ${mtgjsonFile}`);
    }

    // Get file size for progress estimation
    const stats = await fs.stat(mtgjsonFile);
    console.log(`Processing file size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

    // Create read stream and JSON parser
    const fileStream = await fs.open(mtgjsonFile, 'r');
    const readStream = fileStream.createReadStream();
    
    const pipeline = readStream
      .pipe((parser as any)())
      .pipe((StreamValues as any).withParser());

    // Process each card in the stream
    for await (const { value: cardData } of pipeline) {
      try {
        const card = cardData as MTGJSONCard;
        
        if (!card.uuid || !card.name || !card.setCode) {
          progress.errors++;
          continue;
        }

        // Track unique sets
        if (!setMap.has(card.setCode)) {
          setMap.set(card.setCode, {
            code: card.setCode,
            name: card.setName || card.setCode
          });
        }

        // Convert to MTGCard format
        const mtgCard: Omit<MTGCard, 'prices'> = {
          uuid: card.uuid,
          name: card.name,
          setCode: card.setCode,
          setName: card.setName || card.setCode,
          rarity: card.rarity,
          typeLine: card.typeLine,
          manaCost: card.manaCost,
          cmc: card.convertedManaCost,
          oracleText: card.text,
          // imageUrl will be populated later if needed
        };

        cardBatch.push(mtgCard);

        // Process price data immediately
        if (card.prices) {
          try {
            await PriceHistoryModel.processMTGJSONPrices(card.uuid, card.prices);
            progress.processedPrices++;
          } catch (error) {
            console.error(`Error processing prices for card ${card.uuid}:`, error);
            progress.errors++;
          }
        }

        progress.totalCards++;

        // Process batch when full
        if (cardBatch.length >= batchSize) {
          await processBatch(cardBatch, progress, skipExisting);
          cardBatch = [];
          
          if (progressCallback) {
            progressCallback(progress);
          }

          // Update import log progress
          if (progress.importLogId) {
            await ImportLogModel.updateProgress(
              progress.importLogId,
              progress.processedCards,
              progress.errors
            );
          }
        }

      } catch (error) {
        console.error('Error processing card:', error);
        progress.errors++;
      }
    }

    // Process remaining cards in batch
    if (cardBatch.length > 0) {
      await processBatch(cardBatch, progress, skipExisting);
    }

    // Process collected sets
    console.log(`Processing ${setMap.size} card sets...`);
    const setEntries = Array.from(setMap.entries());
    for (const [code, setData] of setEntries) {
      try {
        await CardSetModel.create({
          code: setData.code,
          name: setData.name
        });
        progress.processedSets++;
      } catch (error) {
        console.error(`Error creating set ${code}:`, error);
        progress.errors++;
      }
    }

    await fileStream.close();

    // Complete import logging
    if (progress.importLogId) {
      await ImportLogModel.completeImport(
        progress.importLogId,
        progress.processedCards + progress.processedSets,
        progress.errors
      );
    }

    console.log('MTGJSON import completed:', progress);
    return progress;

  } catch (error) {
    console.error('MTGJSON import failed:', error);
    
    // Fail import logging
    if (progress.importLogId) {
      await ImportLogModel.failImport(
        progress.importLogId,
        error instanceof Error ? error.message : 'Unknown error',
        progress.processedCards,
        progress.errors
      );
    }
    
    throw error;
  }
}

/**
 * Process a batch of cards
 */
async function processBatch(
  cards: Omit<MTGCard, 'prices'>[],
  progress: ImportProgress,
  skipExisting: boolean
): Promise<void> {
  try {
    if (skipExisting) {
      // Use individual inserts with conflict handling for SQLite
      for (const card of cards) {
        try {
          await CardModel.create(card);
          progress.processedCards++;
        } catch (error) {
          // Skip if already exists, count as error otherwise
          if (!(error instanceof Error) || !error.message.includes('UNIQUE constraint')) {
            progress.errors++;
          }
        }
      }
    } else {
      await CardModel.createBatch(cards);
      progress.processedCards += cards.length;
    }
  } catch (error) {
    console.error('Error processing card batch:', error);
    progress.errors += cards.length;
  }
}

/**
 * Get import statistics
 */
export async function getMTGJSONImportStats(): Promise<{
  cardsInDatabase: number;
  pricePointsInDatabase: number;
  setsInDatabase: number;
  lastImport?: Date;
}> {
  const [cardCount, priceStats, setCount] = await Promise.all([
    CardModel.count(),
    PriceHistoryModel.getPriceStats(),
    CardSetModel.count()
  ]);

  // Get last MTGJSON import
  const recentImports = await ImportLogModel.getByType('mtgjson', 1);
  const lastImport = recentImports.length > 0 ? recentImports[0].completedAt : undefined;

  return {
    cardsInDatabase: cardCount,
    pricePointsInDatabase: priceStats.totalPricePoints,
    setsInDatabase: setCount,
    lastImport
  };
}