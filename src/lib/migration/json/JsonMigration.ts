/**
 * JSON to Database Migration System
 * Handles importing MTG card data from JSON files to database
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { MigrationBase } from '../base/MigrationBase';
import { ErrorRecovery } from '../base/ErrorRecovery';
import { CardModel, PriceHistoryModel, CardSetModel } from '../../database/models';
import type { MTGCard, MTGCardPrices, ProcessedCardPrice } from '../../../types/mtg';
import type { 
  MigrationResult, 
  JsonMigrationOptions,
  ValidationError 
} from '../types';

export class JsonMigration extends MigrationBase {
  private errorRecovery: ErrorRecovery;
  private sourceFile: string;
  private jsonOptions: JsonMigrationOptions;

  constructor(sourceFile: string, options: JsonMigrationOptions) {
    super(options);
    this.sourceFile = sourceFile;
    this.jsonOptions = options;
    this.errorRecovery = new ErrorRecovery();
  }

  /**
   * Main migration method
   */
  async migrate(): Promise<MigrationResult> {
    const startTime = Date.now();
    let processed = 0;
    let failed = 0;
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      this.updateProgress({ phase: 'validating_source' });
      
      // Validate source file exists
      await this.validateSourceFile();

      this.updateProgress({ phase: 'parsing_json' });
      
      // Parse JSON data based on source type
      const jsonData = await this.parseJsonFile();
      const cards = await this.extractCards(jsonData);
      
      this.updateProgress({ 
        phase: 'preparing_data',
        total: cards.length 
      });

      // Validate card data
      const { valid: validCards, invalid: invalidCards } = await this.validateCards(cards);
      
      if (invalidCards.length > 0) {
        warnings.push(`${invalidCards.length} cards failed validation and will be skipped`);
        invalidCards.forEach(({ error }) => warnings.push(error));
      }

      if (!this.options.dryRun) {
        // Import cards in batches
        this.updateProgress({ phase: 'importing_cards' });
        
        const importResult = await this.importCards(validCards);
        processed = importResult.processed;
        failed = importResult.failed;
        errors.push(...importResult.errors);

        // Import price history if available
        if (this.jsonOptions.sourceType === 'mtgjson') {
          this.updateProgress({ phase: 'importing_prices' });
          
          const priceResult = await this.importPriceHistory(jsonData);
          warnings.push(`Imported ${priceResult.processed} price records`);
          
          if (priceResult.failed > 0) {
            warnings.push(`${priceResult.failed} price records failed import`);
          }
        }
      } else {
        processed = validCards.length;
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

      if (stats.size > 5 * 1024 * 1024 * 1024) { // 5GB limit
        throw new Error(`Source file too large: ${this.sourceFile}`);
      }

    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        throw new Error(`Source file not found: ${this.sourceFile}`);
      }
      throw error;
    }
  }

  /**
   * Parse JSON file with memory-efficient streaming for large files
   */
  private async parseJsonFile(): Promise<any> {
    try {
      const stats = await fs.stat(this.sourceFile);
      
      // For files larger than 100MB, use streaming parser
      if (stats.size > 100 * 1024 * 1024) {
        return await this.parseJsonStreaming();
      } else {
        const content = await fs.readFile(this.sourceFile, 'utf8');
        return JSON.parse(content);
      }
    } catch (error) {
      throw new Error(`Failed to parse JSON file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Parse large JSON files using streaming
   */
  private async parseJsonStreaming(): Promise<any> {
    // For now, implement basic chunked reading
    // In production, consider using a streaming JSON parser like stream-json
    const content = await fs.readFile(this.sourceFile, 'utf8');
    return JSON.parse(content);
  }

  /**
   * Extract card data from parsed JSON based on source type
   */
  private async extractCards(jsonData: any): Promise<MTGCard[]> {
    const cards: MTGCard[] = [];

    if (this.jsonOptions.sourceType === 'mtgjson') {
      // Handle MTGJSON AllPrices.json format
      if (jsonData.data) {
        for (const [uuid, cardData] of Object.entries(jsonData.data)) {
          const card = this.convertMTGJSONCard(uuid, cardData as any);
          if (card) {
            cards.push(card);
          }
        }
      }
    } else {
      // Handle custom JSON format
      if (Array.isArray(jsonData)) {
        cards.push(...jsonData);
      } else if (jsonData.cards && Array.isArray(jsonData.cards)) {
        cards.push(...jsonData.cards);
      } else {
        throw new Error('Unsupported JSON format for custom source type');
      }
    }

    return cards;
  }

  /**
   * Convert MTGJSON card data to MTGCard format
   */
  private convertMTGJSONCard(uuid: string, cardData: any): MTGCard | null {
    try {
      // Extract card information from the first price entry
      // MTGJSON AllPrices.json has prices but limited card info
      const firstPriceEntry = Object.values(cardData)[0] as any;
      
      if (!firstPriceEntry) {
        return null;
      }

      // MTGCard fields need to be inferred or set to defaults
      // as AllPrices.json doesn't contain full card details
      return {
        uuid,
        name: firstPriceEntry.name || `Card-${uuid}`,
        setCode: firstPriceEntry.setCode || 'UNK',
        setName: firstPriceEntry.setName || 'Unknown Set',
        rarity: firstPriceEntry.rarity,
        typeLine: firstPriceEntry.typeLine,
        manaCost: firstPriceEntry.manaCost,
        cmc: firstPriceEntry.cmc,
        oracleText: firstPriceEntry.oracleText,
        imageUrl: firstPriceEntry.imageUrl,
        prices: cardData as MTGCardPrices
      };
    } catch (error) {
      console.warn(`Failed to convert card ${uuid}:`, error);
      return null;
    }
  }

  /**
   * Validate card data
   */
  private async validateCards(cards: MTGCard[]): Promise<{
    valid: MTGCard[];
    invalid: Array<{ item: MTGCard; error: string }>;
  }> {
    return await this.validateData(cards, (card) => {
      if (!card.uuid) {
        return 'Card missing UUID';
      }

      if (!card.name) {
        return 'Card missing name';
      }

      if (!card.setCode) {
        return 'Card missing set code';
      }

      if (card.name.length > 255) {
        return 'Card name too long (max 255 characters)';
      }

      if (card.setCode.length > 10) {
        return 'Set code too long (max 10 characters)';
      }

      return true;
    });
  }

  /**
   * Import cards to database in batches
   */
  private async importCards(cards: MTGCard[]): Promise<{
    processed: number;
    failed: number;
    errors: string[];
  }> {
    let processed = 0;
    let failed = 0;
    const errors: string[] = [];

    // First, extract and import unique sets
    await this.importCardSets(cards);

    // Then import cards
    const processor = async (batch: MTGCard[]) => {
      try {
        // Convert to card data without prices
        const cardData = batch.map(card => ({
          uuid: card.uuid,
          name: card.name,
          setCode: card.setCode,
          setName: card.setName,
          rarity: card.rarity,
          typeLine: card.typeLine,
          manaCost: card.manaCost,
          cmc: card.cmc,
          oracleText: card.oracleText,
          imageUrl: card.imageUrl
        }));

        await CardModel.createBatch(cardData);
        return cardData;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`Batch import failed: ${errorMessage}`);
        throw error;
      }
    };

    const results = await this.processBatches(cards, processor, 'importing_cards');
    processed = results.length;
    failed = cards.length - processed;

    return { processed, failed, errors };
  }

  /**
   * Import card sets from cards
   */
  private async importCardSets(cards: MTGCard[]): Promise<void> {
    const sets = new Map<string, { code: string; name: string }>();

    // Extract unique sets
    for (const card of cards) {
      if (!sets.has(card.setCode)) {
        sets.set(card.setCode, {
          code: card.setCode,
          name: card.setName
        });
      }
    }

    // Import sets
    for (const setData of sets.values()) {
      try {
        await CardSetModel.create(setData);
      } catch (error) {
        // Skip if set already exists
        if (!(error instanceof Error) || !error.message.includes('UNIQUE constraint')) {
          console.warn(`Failed to import set ${setData.code}:`, error);
        }
      }
    }
  }

  /**
   * Import price history from MTGJSON data
   */
  private async importPriceHistory(jsonData: any): Promise<{
    processed: number;
    failed: number;
  }> {
    let processed = 0;
    let failed = 0;

    if (!jsonData.data) {
      return { processed, failed };
    }

    const priceEntries: Array<{
      card_uuid: string;
      price_date: Date;
      price: number;
      source: string;
      variant: string;
    }> = [];

    // Extract price history from MTGJSON format
    for (const [uuid, cardPrices] of Object.entries(jsonData.data)) {
      const prices = cardPrices as MTGCardPrices;
      
      if (prices.paper?.tcgplayer?.retail?.normal) {
        for (const [dateStr, price] of Object.entries(prices.paper.tcgplayer.retail.normal)) {
          priceEntries.push({
            card_uuid: uuid,
            price_date: new Date(dateStr),
            price: price,
            source: 'tcgplayer',
            variant: 'normal'
          });
        }
      }

      if (prices.paper?.tcgplayer?.retail?.foil) {
        for (const [dateStr, price] of Object.entries(prices.paper.tcgplayer.retail.foil)) {
          priceEntries.push({
            card_uuid: uuid,
            price_date: new Date(dateStr),
            price: price,
            source: 'tcgplayer',
            variant: 'foil'
          });
        }
      }
    }

    // Import price entries in batches
    const batchSize = this.options.batchSize || 1000;
    
    for (let i = 0; i < priceEntries.length; i += batchSize) {
      const batch = priceEntries.slice(i, i + batchSize);
      
      try {
        await PriceHistoryModel.createBatch(batch);
        processed += batch.length;
      } catch (error) {
        failed += batch.length;
        console.warn(`Failed to import price batch:`, error);
      }
    }

    return { processed, failed };
  }

  /**
   * Get import statistics
   */
  async getImportStats(): Promise<{
    totalCards: number;
    totalSets: number;
    totalPriceRecords: number;
  }> {
    const [totalCards, totalSets, totalPriceRecords] = await Promise.all([
      CardModel.count(),
      CardSetModel.count(),
      PriceHistoryModel.count()
    ]);

    return {
      totalCards,
      totalSets,
      totalPriceRecords
    };
  }
}