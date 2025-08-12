/**
 * Migration Manager - Central control for all migration operations
 */

import { JsonMigration } from '../json/JsonMigration';
import { CsvImporter } from '../csv/CsvImporter';
import { DataValidator } from './DataValidator';
import { IntegrityChecker } from './IntegrityChecker';
import { ImportLogModel } from '../../database/models';
import type { 
  MigrationLog, 
  MigrationResult, 
  MigrationProgress,
  JsonMigrationOptions,
  CsvImportOptions 
} from '../types';

export class MigrationManager {
  private activeMigrations: Map<string, { migration: JsonMigration | CsvImporter; progress: MigrationProgress }> = new Map();
  private dataValidator: DataValidator;
  private integrityChecker: IntegrityChecker;

  constructor() {
    this.dataValidator = new DataValidator();
    this.integrityChecker = new IntegrityChecker();
  }

  /**
   * Start JSON migration
   */
  async startJsonMigration(
    sourceFile: string, 
    options: JsonMigrationOptions,
    progressCallback?: (progress: MigrationProgress) => void
  ): Promise<string> {
    const migration = new JsonMigration(sourceFile, {
      ...options,
      progressCallback: progressCallback || this.createProgressHandler()
    });

    const migrationId = migration.getId();
    this.activeMigrations.set(migrationId, {
      migration,
      progress: migration.getProgress()
    });

    // Start migration in background
    migration.run()
      .then(() => {
        console.log(`JSON migration ${migrationId} completed successfully`);
      })
      .catch((error) => {
        console.error(`JSON migration ${migrationId} failed:`, error);
      })
      .finally(() => {
        this.activeMigrations.delete(migrationId);
      });

    return migrationId;
  }

  /**
   * Start CSV import
   */
  async startCsvImport(
    sourceFile: string,
    options: CsvImportOptions,
    progressCallback?: (progress: MigrationProgress) => void
  ): Promise<string> {
    const importer = new CsvImporter(sourceFile, {
      ...options,
      progressCallback: progressCallback || this.createProgressHandler()
    });

    const migrationId = importer.getId();
    this.activeMigrations.set(migrationId, {
      migration: importer,
      progress: importer.getProgress()
    });

    // Start import in background
    importer.run()
      .then(() => {
        console.log(`CSV import ${migrationId} completed successfully`);
      })
      .catch((error) => {
        console.error(`CSV import ${migrationId} failed:`, error);
      })
      .finally(() => {
        this.activeMigrations.delete(migrationId);
      });

    return migrationId;
  }

  /**
   * Get progress of active migration
   */
  getMigrationProgress(migrationId: string): MigrationProgress | null {
    const migration = this.activeMigrations.get(migrationId);
    return migration ? migration.progress : null;
  }

  /**
   * List all active migrations
   */
  getActiveMigrations(): Array<{ id: string; progress: MigrationProgress }> {
    return Array.from(this.activeMigrations.entries()).map(([id, { progress }]) => ({
      id,
      progress
    }));
  }

  /**
   * Cancel active migration
   */
  async cancelMigration(migrationId: string): Promise<boolean> {
    const migration = this.activeMigrations.get(migrationId);
    if (!migration) {
      return false;
    }

    // Note: Actual cancellation would require implementing cancellation tokens
    // For now, we'll just remove it from tracking
    this.activeMigrations.delete(migrationId);
    
    // Update import log
    try {
      await ImportLogModel.updateByImportType('Migration', {
        status: 'cancelled',
        metadata: JSON.stringify({ migrationId, cancelledAt: new Date() })
      });
    } catch (error) {
      console.warn('Failed to update import log for cancelled migration:', error);
    }

    return true;
  }

  /**
   * Get migration history from database
   */
  async getMigrationHistory(limit: number = 50): Promise<MigrationLog[]> {
    try {
      const logs = await ImportLogModel.getRecent(limit);
      
      return logs.map(log => ({
        id: log.id?.toString() || 'unknown',
        type: log.importType,
        status: log.status as any,
        startTime: log.startedAt,
        endTime: log.completedAt || undefined,
        progress: {
          phase: 'completed',
          processed: log.recordsProcessed || 0,
          total: log.recordsProcessed || 0,
          failed: log.recordsFailed || 0,
          percentage: 100,
          startTime: log.startedAt,
          errors: log.errorMessage ? [log.errorMessage] : []
        },
        metadata: log.metadata || undefined
      }));
    } catch (error) {
      console.error('Failed to get migration history:', error);
      return [];
    }
  }

  /**
   * Run data validation
   */
  async validateData(options: {
    checkCards?: boolean;
    checkPrices?: boolean;
    checkSets?: boolean;
    sampleSize?: number;
  } = {}): Promise<{
    cards?: any;
    prices?: any;
    sets?: any;
    overall: {
      valid: boolean;
      totalErrors: number;
      totalWarnings: number;
    };
  }> {
    const results: any = {};
    let totalErrors = 0;
    let totalWarnings = 0;

    if (options.checkCards !== false) {
      results.cards = await this.dataValidator.validateCards(options.sampleSize);
      totalErrors += results.cards.errors.length;
      totalWarnings += results.cards.warnings.length;
    }

    if (options.checkPrices !== false) {
      results.prices = await this.dataValidator.validatePriceHistory(options.sampleSize);
      totalErrors += results.prices.errors.length;
      totalWarnings += results.prices.warnings.length;
    }

    if (options.checkSets !== false) {
      results.sets = await this.dataValidator.validateCardSets(options.sampleSize);
      totalErrors += results.sets.errors.length;
      totalWarnings += results.sets.warnings.length;
    }

    results.overall = {
      valid: totalErrors === 0,
      totalErrors,
      totalWarnings
    };

    return results;
  }

  /**
   * Run integrity checks
   */
  async checkIntegrity(): Promise<{
    orphanedPrices: any;
    missingCards: any;
    duplicateEntries: any;
    overall: {
      healthy: boolean;
      totalIssues: number;
    };
  }> {
    const [orphanedPrices, missingCards, duplicateEntries] = await Promise.all([
      this.integrityChecker.findOrphanedPrices(),
      this.integrityChecker.findMissingCardReferences(),
      this.integrityChecker.findDuplicateEntries()
    ]);

    const totalIssues = orphanedPrices.count + missingCards.count + duplicateEntries.count;

    return {
      orphanedPrices,
      missingCards,
      duplicateEntries,
      overall: {
        healthy: totalIssues === 0,
        totalIssues
      }
    };
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(): Promise<{
    cards: { total: number; withPrices: number; withoutPrices: number };
    sets: { total: number; cardCounts: Array<{ setCode: string; cardCount: number }> };
    prices: { total: number; sources: Array<{ source: string; count: number }> };
    storage: { estimatedSize: string };
  }> {
    try {
      const [cardsTotal, setsTotal, pricesTotal] = await Promise.all([
        this.dataValidator.getTableStats('cards'),
        this.dataValidator.getTableStats('card_sets'),
        this.dataValidator.getTableStats('price_history')
      ]);

      // Get cards with/without prices
      const cardsWithPrices = await this.dataValidator.getCardsWithPricesCount();
      const cardsWithoutPrices = cardsTotal - cardsWithPrices;

      // Get set statistics
      const setStats = await this.dataValidator.getSetStatistics();

      // Get price source statistics
      const priceSourceStats = await this.dataValidator.getPriceSourceStatistics();

      return {
        cards: {
          total: cardsTotal,
          withPrices: cardsWithPrices,
          withoutPrices: cardsWithoutPrices
        },
        sets: {
          total: setsTotal,
          cardCounts: setStats
        },
        prices: {
          total: pricesTotal,
          sources: priceSourceStats
        },
        storage: {
          estimatedSize: 'Not available' // Would need database-specific queries
        }
      };
    } catch (error) {
      console.error('Failed to get database stats:', error);
      throw error;
    }
  }

  /**
   * Clean up completed migrations
   */
  async cleanupCompletedMigrations(): Promise<number> {
    const completed = Array.from(this.activeMigrations.entries()).filter(
      ([_, { progress }]) => progress.percentage >= 100
    );

    for (const [id] of completed) {
      this.activeMigrations.delete(id);
    }

    return completed.length;
  }

  /**
   * Create default progress handler
   */
  private createProgressHandler(): (progress: MigrationProgress) => void {
    return (progress: MigrationProgress) => {
      console.log(
        `Migration progress: ${progress.phase} - ${progress.percentage}% ` +
        `(${progress.processed}/${progress.total}) ` +
        `${progress.rate ? `- ${progress.rate} items/sec` : ''} ` +
        `${progress.eta ? `- ETA: ${progress.eta}s` : ''}`
      );

      if (progress.errors.length > 0) {
        console.warn('Migration errors:', progress.errors.slice(-3)); // Show last 3 errors
      }
    };
  }

  /**
   * Get migration configuration recommendations
   */
  async getConfigurationRecommendations(): Promise<{
    batchSize: number;
    connectionPoolSize: number;
    memoryLimit: string;
    warnings: string[];
  }> {
    const warnings: string[] = [];
    const stats = await this.getDatabaseStats();

    // Recommend batch size based on data volume
    let batchSize = 1000;
    if (stats.cards.total > 100000) {
      batchSize = 5000;
    } else if (stats.cards.total < 10000) {
      batchSize = 500;
    }

    // Recommend connection pool size
    let connectionPoolSize = 5;
    if (stats.prices.total > 1000000) {
      connectionPoolSize = 10;
      warnings.push('Large price history detected - consider increasing connection pool size');
    }

    // Memory recommendations
    let memoryLimit = '512MB';
    if (stats.cards.total > 50000) {
      memoryLimit = '1GB';
      warnings.push('Large dataset detected - consider increasing memory allocation');
    }

    return {
      batchSize,
      connectionPoolSize,
      memoryLimit,
      warnings
    };
  }
}