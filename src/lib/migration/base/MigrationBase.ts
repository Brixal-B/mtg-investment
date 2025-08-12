/**
 * Base migration class providing common functionality
 */

import { ImportLogModel } from '../../database/models';
import type { 
  MigrationProgress, 
  MigrationResult, 
  MigrationOptions, 
  MigrationStatus,
  MigrationLog 
} from '../types';

export abstract class MigrationBase {
  protected options: MigrationOptions;
  protected progress: MigrationProgress;
  protected migrationId: string;
  protected importLog: typeof ImportLogModel;

  constructor(options: MigrationOptions = {}) {
    this.options = {
      batchSize: 1000,
      continueOnError: true,
      dryRun: false,
      skipValidation: false,
      ...options
    };

    this.migrationId = this.generateId();
    this.importLog = ImportLogModel;
    
    this.progress = {
      phase: 'initializing',
      processed: 0,
      total: 0,
      failed: 0,
      percentage: 0,
      startTime: new Date(),
      errors: []
    };
  }

  /**
   * Abstract method to be implemented by specific migration types
   */
  abstract migrate(): Promise<MigrationResult>;

  /**
   * Start migration with logging and progress tracking
   */
  async run(): Promise<MigrationResult> {
    try {
      await this.logStart();
      const result = await this.migrate();
      await this.logComplete(result);
      return result;
    } catch (error) {
      const errorResult: MigrationResult = {
        success: false,
        processed: this.progress.processed,
        failed: this.progress.failed + 1,
        duration: Date.now() - this.progress.startTime.getTime(),
        errors: [...this.progress.errors, error instanceof Error ? error.message : String(error)],
        warnings: []
      };
      
      await this.logError(errorResult);
      throw error;
    }
  }

  /**
   * Update progress and notify callback
   */
  protected updateProgress(updates: Partial<MigrationProgress>): void {
    this.progress = { ...this.progress, ...updates };
    
    // Calculate percentage and rate
    if (this.progress.total > 0) {
      this.progress.percentage = Math.round((this.progress.processed / this.progress.total) * 100);
    }

    const elapsed = Date.now() - this.progress.startTime.getTime();
    if (elapsed > 0 && this.progress.processed > 0) {
      this.progress.rate = Math.round((this.progress.processed / elapsed) * 1000); // per second
      
      if (this.progress.rate > 0) {
        const remaining = this.progress.total - this.progress.processed;
        this.progress.eta = Math.round(remaining / this.progress.rate);
      }
    }

    // Notify callback if provided
    if (this.options.progressCallback) {
      this.options.progressCallback(this.progress);
    }
  }

  /**
   * Process items in batches
   */
  protected async processBatches<T, R>(
    items: T[],
    processor: (batch: T[]) => Promise<R[]>,
    phase: string
  ): Promise<R[]> {
    const results: R[] = [];
    const batchSize = this.options.batchSize || 1000;
    
    this.updateProgress({ 
      phase, 
      total: items.length,
      processed: 0,
      failed: 0 
    });

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      try {
        const batchResults = await processor(batch);
        results.push(...batchResults);
        
        this.updateProgress({ 
          processed: Math.min(i + batchSize, items.length)
        });
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.progress.errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${errorMessage}`);
        
        this.updateProgress({ 
          failed: this.progress.failed + batch.length 
        });

        if (!this.options.continueOnError) {
          throw error;
        }
      }
    }

    return results;
  }

  /**
   * Validate data before processing
   */
  protected async validateData<T>(
    items: T[],
    validator: (item: T) => boolean | string
  ): Promise<{ valid: T[], invalid: Array<{ item: T, error: string }> }> {
    if (this.options.skipValidation) {
      return { valid: items, invalid: [] };
    }

    const valid: T[] = [];
    const invalid: Array<{ item: T, error: string }> = [];

    for (const item of items) {
      const result = validator(item);
      
      if (result === true) {
        valid.push(item);
      } else {
        invalid.push({
          item,
          error: typeof result === 'string' ? result : 'Validation failed'
        });
      }
    }

    return { valid, invalid };
  }

  /**
   * Log migration start
   */
  private async logStart(): Promise<void> {
    try {
      await this.importLog.create({
        import_type: this.constructor.name,
        status: 'in_progress',
        metadata: JSON.stringify({
          migrationId: this.migrationId,
          options: this.options
        })
      });
    } catch (error) {
      console.warn('Failed to log migration start:', error);
    }
  }

  /**
   * Log migration completion
   */
  private async logComplete(result: MigrationResult): Promise<void> {
    try {
      await this.importLog.updateByImportType(this.constructor.name, {
        status: result.success ? 'completed' : 'failed',
        records_processed: result.processed,
        records_failed: result.failed,
        error_message: result.errors.length > 0 ? result.errors.join('; ') : undefined,
        metadata: JSON.stringify({
          migrationId: this.migrationId,
          result,
          duration: result.duration
        })
      });
    } catch (error) {
      console.warn('Failed to log migration completion:', error);
    }
  }

  /**
   * Log migration error
   */
  private async logError(result: MigrationResult): Promise<void> {
    try {
      await this.importLog.updateByImportType(this.constructor.name, {
        status: 'failed',
        records_processed: result.processed,
        records_failed: result.failed,
        error_message: result.errors.join('; '),
        metadata: JSON.stringify({
          migrationId: this.migrationId,
          result
        })
      });
    } catch (error) {
      console.warn('Failed to log migration error:', error);
    }
  }

  /**
   * Generate unique migration ID
   */
  private generateId(): string {
    return `migration_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current progress
   */
  getProgress(): MigrationProgress {
    return { ...this.progress };
  }

  /**
   * Get migration ID
   */
  getId(): string {
    return this.migrationId;
  }
}