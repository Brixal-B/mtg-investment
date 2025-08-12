/**
 * Data Validator - Validates migrated data integrity and quality
 */

import db from '../../database/connection';
import type { ValidationError, ValidationResult } from '../types';

export class DataValidator {
  /**
   * Validate cards table data
   */
  async validateCards(sampleSize?: number): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    let itemsChecked = 0;

    try {
      // Get sample of cards
      const limit = sampleSize || 1000;
      const cards = await db.query(
        'SELECT * FROM cards ORDER BY RANDOM() LIMIT ?',
        [limit]
      );

      itemsChecked = cards.length;

      for (const card of cards) {
        // Check required fields
        if (!card.uuid) {
          errors.push({
            item: card,
            field: 'uuid',
            value: card.uuid,
            message: 'Missing required UUID',
            severity: 'error'
          });
        }

        if (!card.name) {
          errors.push({
            item: card,
            field: 'name',
            value: card.name,
            message: 'Missing required name',
            severity: 'error'
          });
        }

        if (!card.set_code) {
          errors.push({
            item: card,
            field: 'set_code',
            value: card.set_code,
            message: 'Missing required set code',
            severity: 'error'
          });
        }

        // Check data quality
        if (card.name && card.name.length > 255) {
          warnings.push({
            item: card,
            field: 'name',
            value: card.name,
            message: 'Name exceeds recommended length (255 characters)',
            severity: 'warning'
          });
        }

        if (card.set_code && card.set_code.length > 10) {
          warnings.push({
            item: card,
            field: 'set_code',
            value: card.set_code,
            message: 'Set code exceeds recommended length (10 characters)',
            severity: 'warning'
          });
        }

        if (card.cmc && (card.cmc < 0 || card.cmc > 20)) {
          warnings.push({
            item: card,
            field: 'cmc',
            value: card.cmc,
            message: 'Unusual converted mana cost value',
            severity: 'warning'
          });
        }

        // Check for potential encoding issues
        if (card.name && /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(card.name)) {
          warnings.push({
            item: card,
            field: 'name',
            value: card.name,
            message: 'Name contains control characters',
            severity: 'warning'
          });
        }
      }

    } catch (error) {
      errors.push({
        item: null,
        field: 'system',
        value: null,
        message: `Validation query failed: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'error'
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      itemsChecked
    };
  }

  /**
   * Validate price history data
   */
  async validatePriceHistory(sampleSize?: number): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    let itemsChecked = 0;

    try {
      // Get sample of price records
      const limit = sampleSize || 1000;
      const prices = await db.query(
        'SELECT * FROM price_history ORDER BY RANDOM() LIMIT ?',
        [limit]
      );

      itemsChecked = prices.length;

      for (const price of prices) {
        // Check required fields
        if (!price.card_uuid) {
          errors.push({
            item: price,
            field: 'card_uuid',
            value: price.card_uuid,
            message: 'Missing required card UUID',
            severity: 'error'
          });
        }

        if (!price.price_date) {
          errors.push({
            item: price,
            field: 'price_date',
            value: price.price_date,
            message: 'Missing required price date',
            severity: 'error'
          });
        }

        if (price.price === null || price.price === undefined) {
          errors.push({
            item: price,
            field: 'price',
            value: price.price,
            message: 'Missing required price value',
            severity: 'error'
          });
        }

        // Check data quality
        if (price.price && (price.price < 0 || price.price > 100000)) {
          warnings.push({
            item: price,
            field: 'price',
            value: price.price,
            message: 'Unusual price value (negative or extremely high)',
            severity: 'warning'
          });
        }

        if (price.price_date) {
          const date = new Date(price.price_date);
          const now = new Date();
          const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          
          if (date > now) {
            warnings.push({
              item: price,
              field: 'price_date',
              value: price.price_date,
              message: 'Price date is in the future',
              severity: 'warning'
            });
          }
          
          if (date < new Date('1990-01-01')) {
            warnings.push({
              item: price,
              field: 'price_date',
              value: price.price_date,
              message: 'Price date is unusually old',
              severity: 'warning'
            });
          }
        }

        if (price.source && !['tcgplayer', 'cardkingdom', 'cardsphere', 'mtgotraders'].includes(price.source)) {
          warnings.push({
            item: price,
            field: 'source',
            value: price.source,
            message: 'Unknown price source',
            severity: 'warning'
          });
        }

        if (price.variant && !['normal', 'foil', 'etched', 'showcase'].includes(price.variant)) {
          warnings.push({
            item: price,
            field: 'variant',
            value: price.variant,
            message: 'Unknown card variant',
            severity: 'warning'
          });
        }
      }

    } catch (error) {
      errors.push({
        item: null,
        field: 'system',
        value: null,
        message: `Validation query failed: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'error'
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      itemsChecked
    };
  }

  /**
   * Validate card sets data
   */
  async validateCardSets(sampleSize?: number): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    let itemsChecked = 0;

    try {
      // Get all sets (typically not many)
      const sets = await db.query('SELECT * FROM card_sets');
      itemsChecked = sets.length;

      for (const set of sets) {
        // Check required fields
        if (!set.code) {
          errors.push({
            item: set,
            field: 'code',
            value: set.code,
            message: 'Missing required set code',
            severity: 'error'
          });
        }

        if (!set.name) {
          errors.push({
            item: set,
            field: 'name',
            value: set.name,
            message: 'Missing required set name',
            severity: 'error'
          });
        }

        // Check data quality
        if (set.code && set.code.length > 10) {
          warnings.push({
            item: set,
            field: 'code',
            value: set.code,
            message: 'Set code exceeds recommended length',
            severity: 'warning'
          });
        }

        if (set.card_count && set.card_count < 1) {
          warnings.push({
            item: set,
            field: 'card_count',
            value: set.card_count,
            message: 'Set has no cards',
            severity: 'warning'
          });
        }

        if (set.release_date) {
          const releaseDate = new Date(set.release_date);
          const now = new Date();
          
          if (releaseDate > now) {
            warnings.push({
              item: set,
              field: 'release_date',
              value: set.release_date,
              message: 'Release date is in the future',
              severity: 'warning'
            });
          }
          
          if (releaseDate < new Date('1990-01-01')) {
            warnings.push({
              item: set,
              field: 'release_date',
              value: set.release_date,
              message: 'Release date is unusually old',
              severity: 'warning'
            });
          }
        }
      }

    } catch (error) {
      errors.push({
        item: null,
        field: 'system',
        value: null,
        message: `Validation query failed: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'error'
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      itemsChecked
    };
  }

  /**
   * Get table row counts
   */
  async getTableStats(tableName: string): Promise<number> {
    try {
      const result = await db.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      return result[0]?.count || 0;
    } catch (error) {
      console.error(`Failed to get stats for table ${tableName}:`, error);
      return 0;
    }
  }

  /**
   * Get count of cards with prices
   */
  async getCardsWithPricesCount(): Promise<number> {
    try {
      const result = await db.query(`
        SELECT COUNT(DISTINCT c.uuid) as count 
        FROM cards c 
        INNER JOIN price_history ph ON c.uuid = ph.card_uuid
      `);
      return result[0]?.count || 0;
    } catch (error) {
      console.error('Failed to get cards with prices count:', error);
      return 0;
    }
  }

  /**
   * Get set statistics
   */
  async getSetStatistics(): Promise<Array<{ setCode: string; cardCount: number }>> {
    try {
      const result = await db.query(`
        SELECT set_code as setCode, COUNT(*) as cardCount 
        FROM cards 
        GROUP BY set_code 
        ORDER BY cardCount DESC 
        LIMIT 20
      `);
      return result;
    } catch (error) {
      console.error('Failed to get set statistics:', error);
      return [];
    }
  }

  /**
   * Get price source statistics
   */
  async getPriceSourceStatistics(): Promise<Array<{ source: string; count: number }>> {
    try {
      const result = await db.query(`
        SELECT source, COUNT(*) as count 
        FROM price_history 
        GROUP BY source 
        ORDER BY count DESC
      `);
      return result;
    } catch (error) {
      console.error('Failed to get price source statistics:', error);
      return [];
    }
  }

  /**
   * Validate foreign key relationships
   */
  async validateForeignKeys(): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    let itemsChecked = 0;

    try {
      // Check for orphaned price history records
      const orphanedPrices = await db.query(`
        SELECT ph.id, ph.card_uuid 
        FROM price_history ph 
        LEFT JOIN cards c ON ph.card_uuid = c.uuid 
        WHERE c.uuid IS NULL 
        LIMIT 100
      `);

      itemsChecked += orphanedPrices.length;
      
      for (const orphan of orphanedPrices) {
        errors.push({
          item: orphan,
          field: 'card_uuid',
          value: orphan.card_uuid,
          message: `Price history record references non-existent card: ${orphan.card_uuid}`,
          severity: 'error'
        });
      }

      // Check for cards referencing non-existent sets
      const orphanedCards = await db.query(`
        SELECT c.uuid, c.set_code 
        FROM cards c 
        LEFT JOIN card_sets cs ON c.set_code = cs.code 
        WHERE cs.code IS NULL 
        LIMIT 100
      `);

      itemsChecked += orphanedCards.length;
      
      for (const orphan of orphanedCards) {
        warnings.push({
          item: orphan,
          field: 'set_code',
          value: orphan.set_code,
          message: `Card references non-existent set: ${orphan.set_code}`,
          severity: 'warning'
        });
      }

    } catch (error) {
      errors.push({
        item: null,
        field: 'system',
        value: null,
        message: `Foreign key validation failed: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'error'
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      itemsChecked
    };
  }

  /**
   * Check for data consistency issues
   */
  async validateDataConsistency(): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    let itemsChecked = 0;

    try {
      // Check for duplicate cards (same name + set)
      const duplicateCards = await db.query(`
        SELECT name, set_code, COUNT(*) as count 
        FROM cards 
        GROUP BY name, set_code 
        HAVING COUNT(*) > 1 
        LIMIT 50
      `);

      itemsChecked += duplicateCards.length;
      
      for (const duplicate of duplicateCards) {
        warnings.push({
          item: duplicate,
          field: 'name+set_code',
          value: `${duplicate.name} (${duplicate.set_code})`,
          message: `Duplicate card found: ${duplicate.count} instances`,
          severity: 'warning'
        });
      }

      // Check for inconsistent price data
      const inconsistentPrices = await db.query(`
        SELECT card_uuid, price_date, COUNT(*) as count 
        FROM price_history 
        GROUP BY card_uuid, price_date, source, variant 
        HAVING COUNT(*) > 1 
        LIMIT 50
      `);

      itemsChecked += inconsistentPrices.length;
      
      for (const inconsistent of inconsistentPrices) {
        warnings.push({
          item: inconsistent,
          field: 'price_date',
          value: inconsistent.price_date,
          message: `Multiple price entries for same card/date/source/variant: ${inconsistent.count} instances`,
          severity: 'warning'
        });
      }

    } catch (error) {
      errors.push({
        item: null,
        field: 'system',
        value: null,
        message: `Consistency validation failed: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'error'
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      itemsChecked
    };
  }
}