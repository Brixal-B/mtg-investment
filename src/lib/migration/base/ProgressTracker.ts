/**
 * Progress tracking utility for migrations
 */

import type { MigrationProgress } from '../types';

export class ProgressTracker {
  private progress: MigrationProgress;
  private callbacks: Array<(progress: MigrationProgress) => void> = [];
  private updateInterval?: NodeJS.Timeout;

  constructor(initialProgress?: Partial<MigrationProgress>) {
    this.progress = {
      phase: 'initializing',
      processed: 0,
      total: 0,
      failed: 0,
      percentage: 0,
      startTime: new Date(),
      errors: [],
      ...initialProgress
    };
  }

  /**
   * Update progress with new values
   */
  update(updates: Partial<MigrationProgress>): void {
    this.progress = { ...this.progress, ...updates };
    this.calculateMetrics();
    this.notifyCallbacks();
  }

  /**
   * Set total number of items to process
   */
  setTotal(total: number): void {
    this.update({ total });
  }

  /**
   * Increment processed count
   */
  incrementProcessed(count: number = 1): void {
    this.update({ processed: this.progress.processed + count });
  }

  /**
   * Increment failed count
   */
  incrementFailed(count: number = 1): void {
    this.update({ failed: this.progress.failed + count });
  }

  /**
   * Add error message
   */
  addError(error: string): void {
    this.progress.errors.push(error);
    this.notifyCallbacks();
  }

  /**
   * Set current phase
   */
  setPhase(phase: string): void {
    this.update({ phase });
  }

  /**
   * Get current progress
   */
  getProgress(): MigrationProgress {
    return { ...this.progress };
  }

  /**
   * Check if migration is complete
   */
  isComplete(): boolean {
    return this.progress.processed + this.progress.failed >= this.progress.total;
  }

  /**
   * Check if migration has errors
   */
  hasErrors(): boolean {
    return this.progress.errors.length > 0 || this.progress.failed > 0;
  }

  /**
   * Get success rate as percentage
   */
  getSuccessRate(): number {
    const total = this.progress.processed + this.progress.failed;
    if (total === 0) return 100;
    return Math.round((this.progress.processed / total) * 100);
  }

  /**
   * Add progress callback
   */
  onProgress(callback: (progress: MigrationProgress) => void): void {
    this.callbacks.push(callback);
  }

  /**
   * Remove progress callback
   */
  removeCallback(callback: (progress: MigrationProgress) => void): void {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
  }

  /**
   * Start automatic progress updates
   */
  startAutoUpdate(intervalMs: number = 1000): void {
    this.stopAutoUpdate();
    this.updateInterval = setInterval(() => {
      this.calculateMetrics();
      this.notifyCallbacks();
    }, intervalMs);
  }

  /**
   * Stop automatic progress updates
   */
  stopAutoUpdate(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = undefined;
    }
  }

  /**
   * Reset progress tracking
   */
  reset(): void {
    this.progress = {
      phase: 'initializing',
      processed: 0,
      total: 0,
      failed: 0,
      percentage: 0,
      startTime: new Date(),
      errors: []
    };
    this.notifyCallbacks();
  }

  /**
   * Calculate rate, percentage, and ETA
   */
  private calculateMetrics(): void {
    // Calculate percentage
    if (this.progress.total > 0) {
      this.progress.percentage = Math.round(
        ((this.progress.processed + this.progress.failed) / this.progress.total) * 100
      );
    }

    // Calculate rate (items per second)
    const elapsed = Date.now() - this.progress.startTime.getTime();
    if (elapsed > 0 && this.progress.processed > 0) {
      this.progress.rate = Math.round((this.progress.processed / elapsed) * 1000);
      
      // Calculate ETA (seconds remaining)
      if (this.progress.rate > 0) {
        const remaining = this.progress.total - this.progress.processed - this.progress.failed;
        this.progress.eta = Math.round(remaining / this.progress.rate);
      }
    }
  }

  /**
   * Notify all registered callbacks
   */
  private notifyCallbacks(): void {
    this.callbacks.forEach(callback => {
      try {
        callback(this.progress);
      } catch (error) {
        console.warn('Progress callback error:', error);
      }
    });
  }

  /**
   * Get formatted duration string
   */
  getDurationString(): string {
    const elapsed = Date.now() - this.progress.startTime.getTime();
    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Get formatted ETA string
   */
  getETAString(): string {
    if (!this.progress.eta) return 'Unknown';
    
    const eta = this.progress.eta;
    const hours = Math.floor(eta / 3600);
    const minutes = Math.floor((eta % 3600) / 60);
    const seconds = eta % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Get formatted rate string
   */
  getRateString(): string {
    if (!this.progress.rate) return '0 items/sec';
    
    if (this.progress.rate >= 1000) {
      return `${(this.progress.rate / 1000).toFixed(1)}k items/sec`;
    } else {
      return `${this.progress.rate} items/sec`;
    }
  }
}