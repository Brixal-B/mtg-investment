/**
 * Error recovery utility for robust migration operations
 */

import type { MigrationProgress } from '../types';

export interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  backoffMultiplier?: number;
  maxDelay?: number;
}

export interface RecoveryCheckpoint {
  id: string;
  timestamp: Date;
  processed: number;
  failed: number;
  lastSuccessfulBatch: number;
  errors: string[];
}

export class ErrorRecovery {
  private checkpoints: Map<string, RecoveryCheckpoint> = new Map();
  private retryAttempts: Map<string, number> = new Map();

  /**
   * Execute operation with retry logic
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    operationId: string,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      backoffMultiplier = 2,
      maxDelay = 30000
    } = options;

    let attempt = 0;
    let delay = retryDelay;

    while (attempt <= maxRetries) {
      try {
        const result = await operation();
        // Reset retry count on success
        this.retryAttempts.delete(operationId);
        return result;
      } catch (error) {
        attempt++;
        this.retryAttempts.set(operationId, attempt);

        if (attempt > maxRetries) {
          throw new Error(
            `Operation failed after ${maxRetries} retries: ${error instanceof Error ? error.message : String(error)}`
          );
        }

        console.warn(
          `Operation ${operationId} failed (attempt ${attempt}/${maxRetries}): ${error instanceof Error ? error.message : String(error)}`
        );

        // Wait before retry with exponential backoff
        await this.sleep(Math.min(delay, maxDelay));
        delay *= backoffMultiplier;
      }
    }

    throw new Error('Unexpected retry loop exit');
  }

  /**
   * Create a checkpoint for recovery
   */
  createCheckpoint(
    id: string,
    progress: MigrationProgress,
    lastSuccessfulBatch: number
  ): void {
    const checkpoint: RecoveryCheckpoint = {
      id,
      timestamp: new Date(),
      processed: progress.processed,
      failed: progress.failed,
      lastSuccessfulBatch,
      errors: [...progress.errors]
    };

    this.checkpoints.set(id, checkpoint);
    console.log(`Checkpoint created: ${id} (processed: ${progress.processed})`);
  }

  /**
   * Get checkpoint for recovery
   */
  getCheckpoint(id: string): RecoveryCheckpoint | undefined {
    return this.checkpoints.get(id);
  }

  /**
   * List all available checkpoints
   */
  listCheckpoints(): RecoveryCheckpoint[] {
    return Array.from(this.checkpoints.values()).sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  /**
   * Remove checkpoint
   */
  removeCheckpoint(id: string): boolean {
    return this.checkpoints.delete(id);
  }

  /**
   * Clear all checkpoints
   */
  clearCheckpoints(): void {
    this.checkpoints.clear();
  }

  /**
   * Process items with automatic checkpointing
   */
  async processWithCheckpoints<T, R>(
    items: T[],
    processor: (batch: T[]) => Promise<R[]>,
    batchSize: number,
    checkpointId: string,
    resumeFromCheckpoint?: boolean
  ): Promise<R[]> {
    const results: R[] = [];
    let startIndex = 0;

    // Resume from checkpoint if requested
    if (resumeFromCheckpoint) {
      const checkpoint = this.getCheckpoint(checkpointId);
      if (checkpoint) {
        startIndex = checkpoint.lastSuccessfulBatch * batchSize;
        console.log(`Resuming from checkpoint: batch ${checkpoint.lastSuccessfulBatch}`);
      }
    }

    let batchIndex = Math.floor(startIndex / batchSize);

    for (let i = startIndex; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      try {
        const batchResults = await this.withRetry(
          () => processor(batch),
          `${checkpointId}_batch_${batchIndex}`
        );
        
        results.push(...batchResults);

        // Create checkpoint every 10 batches
        if (batchIndex % 10 === 0) {
          this.createCheckpoint(
            `${checkpointId}_auto_${batchIndex}`,
            {
              phase: 'processing',
              processed: i + batch.length,
              total: items.length,
              failed: 0,
              percentage: 0,
              startTime: new Date(),
              errors: []
            },
            batchIndex
          );
        }

        batchIndex++;
        
      } catch (error) {
        // Create error checkpoint
        this.createCheckpoint(
          `${checkpointId}_error_${batchIndex}`,
          {
            phase: 'error',
            processed: i,
            total: items.length,
            failed: batch.length,
            percentage: 0,
            startTime: new Date(),
            errors: [error instanceof Error ? error.message : String(error)]
          },
          batchIndex - 1 // Last successful batch
        );

        throw error;
      }
    }

    return results;
  }

  /**
   * Handle critical errors with fallback strategies
   */
  async handleCriticalError<T>(
    error: Error,
    context: string,
    fallbackStrategy?: () => Promise<T>
  ): Promise<T | never> {
    console.error(`Critical error in ${context}:`, error);

    // Log error details
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      retryAttempts: Array.from(this.retryAttempts.entries())
    };

    console.error('Error details:', errorInfo);

    // Try fallback strategy if provided
    if (fallbackStrategy) {
      try {
        console.log('Attempting fallback strategy...');
        return await fallbackStrategy();
      } catch (fallbackError) {
        console.error('Fallback strategy also failed:', fallbackError);
      }
    }

    // If no fallback or fallback failed, re-throw original error
    throw error;
  }

  /**
   * Validate data integrity after recovery
   */
  async validateRecovery<T>(
    items: T[],
    validator: (item: T) => boolean | Promise<boolean>,
    sampleSize?: number
  ): Promise<{ valid: boolean; checkedCount: number; errors: string[] }> {
    const errors: string[] = [];
    const toCheck = sampleSize ? items.slice(0, sampleSize) : items;
    let validCount = 0;

    for (let i = 0; i < toCheck.length; i++) {
      try {
        const isValid = await validator(toCheck[i]);
        if (isValid) {
          validCount++;
        } else {
          errors.push(`Item ${i} failed validation`);
        }
      } catch (error) {
        errors.push(`Item ${i} validation error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return {
      valid: errors.length === 0,
      checkedCount: toCheck.length,
      errors
    };
  }

  /**
   * Get retry statistics
   */
  getRetryStats(): { operationId: string; attempts: number }[] {
    return Array.from(this.retryAttempts.entries()).map(([operationId, attempts]) => ({
      operationId,
      attempts
    }));
  }

  /**
   * Reset retry counters
   */
  resetRetryCounters(): void {
    this.retryAttempts.clear();
  }

  /**
   * Sleep utility for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}