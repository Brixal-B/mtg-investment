/**
 * Enhanced MTGJSON Download Service - Backend API Agent Implementation
 * Follows centralized configuration, standardized error handling, and robust utilities
 */

import { createWriteStream, existsSync } from 'fs';
import { unlink, stat } from 'fs/promises';
import { EventEmitter } from 'events';
import { FILES, API } from './config';
import { createApiError, handleNetworkError } from './errors';
import { writeJsonFile } from './filesystem';

export interface DownloadProgress {
  id: string;
  url: string;
  filePath: string;
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'cancelled';
  progress: {
    percent: number;
    received: number;
    total: number;
    speed: number; // bytes per second
    eta: number; // seconds remaining
  };
  error?: string;
  startTime: number;
  endTime?: number;
}

export interface DownloadOptions {
  timeout?: number;
  retries?: number;
  chunkSize?: number;
  validateChecksum?: boolean;
  resumable?: boolean;
}

/**
 * Enhanced Download Manager with proper lifecycle management
 */
export class DownloadManager extends EventEmitter {
  private activeDownloads = new Map<string, DownloadProgress>();
  private abortControllers = new Map<string, AbortController>();

  /**
   * Start a new download with comprehensive progress tracking
   */
  async startDownload(
    url: string,
    filePath: string,
    options: DownloadOptions = {}
  ): Promise<string> {
    const downloadId = this.generateDownloadId();
    const {
      timeout = API.DOWNLOAD_TIMEOUT, // Performance Agent: 15 minutes for 1GB+ files
      retries = 5, // Performance Agent: Increased retries for stability
      chunkSize = 8192, // Performance Agent: 8KB chunks for optimal streaming
      resumable = true
    } = options;

    // Initialize download state
    const downloadState: DownloadProgress = {
      id: downloadId,
      url,
      filePath,
      status: 'pending',
      progress: {
        percent: 0,
        received: 0,
        total: 0,
        speed: 0,
        eta: 0
      },
      startTime: Date.now()
    };

    this.activeDownloads.set(downloadId, downloadState);
    
    try {
      // Check if we can resume an existing download
      let resumePosition = 0;
      if (resumable && existsSync(filePath)) {
        const fileStats = await stat(filePath);
        resumePosition = fileStats.size;
        downloadState.progress.received = resumePosition;
        console.log(`Resuming download from position: ${resumePosition}`);
      }

      // Create abort controller for cancellation support
      const abortController = new AbortController();
      this.abortControllers.set(downloadId, abortController);

      // Start the download process
      downloadState.status = 'downloading';
      this.emit('downloadStarted', downloadState);
      
      await this.executeDownload(downloadState, abortController, {
        timeout,
        retries,
        chunkSize,
        resumePosition
      });

      downloadState.status = 'completed';
      downloadState.endTime = Date.now();
      this.emit('downloadCompleted', downloadState);

      console.log(`Download completed: ${filePath} (${this.formatBytes(downloadState.progress.received)})`);
      return downloadId;

    } catch (error) {
      downloadState.status = 'failed';
      downloadState.error = error instanceof Error ? error.message : 'Unknown error';
      downloadState.endTime = Date.now();
      
      this.emit('downloadFailed', downloadState);
      console.error(`Download failed: ${downloadState.error}`);
      
      // Cleanup partial file on failure
      try {
        if (existsSync(filePath)) {
          await unlink(filePath);
        }
      } catch {}

      throw error;
    } finally {
      // Cleanup
      this.abortControllers.delete(downloadId);
      
      // Keep download state for status queries but mark as finished
      setTimeout(() => {
        this.activeDownloads.delete(downloadId);
      }, 300000); // Keep for 5 minutes
    }
  }

  /**
   * Execute the actual download with streaming and progress tracking
   */
  private async executeDownload(
    downloadState: DownloadProgress,
    abortController: AbortController,
    options: {
      timeout: number;
      retries: number;
      chunkSize: number;
      resumePosition: number;
    }
  ): Promise<void> {
    const { timeout, retries, chunkSize, resumePosition } = options;
    let attempt = 0;

    while (attempt < retries) {
      try {
        // Set up request headers
        const headers: Record<string, string> = {};
        if (resumePosition > 0) {
          headers['Range'] = `bytes=${resumePosition}-`;
        }

        // Validate download state before making request
        if (!downloadState.url) {
          throw new Error(`Download state missing URL. State: ${JSON.stringify(downloadState)}`);
        }

        // Ensure URL is a string before passing to fetch
        const url = String(downloadState.url);

        // Make the request
        const response = await fetch(url, {
          headers,
          signal: abortController.signal,
          ...(timeout && { 
            // Note: fetch doesn't support timeout directly, we'll use AbortController
          })
        });

        // Set up timeout
        const timeoutId = setTimeout(() => {
          abortController.abort();
        }, timeout);

        try {
          if (!response.ok) {
            throw createApiError(
              `HTTP ${response.status}: ${response.statusText}`,
              response.status,
              'HTTP_ERROR'
            );
          }

          // Get content information
          const contentLength = response.headers.get('content-length');
          const total = contentLength ? parseInt(contentLength, 10) + resumePosition : 0;
          const acceptsRanges = response.headers.get('accept-ranges') === 'bytes';

          downloadState.progress.total = total;

          console.log(`Download info:
            - URL: ${downloadState.url}
            - Content-Length: ${contentLength} (${this.formatBytes(total)})
            - Accepts Ranges: ${acceptsRanges}
            - Resume Position: ${resumePosition}`);

          // Set up file stream
          const fileStream = createWriteStream(downloadState.filePath, {
            flags: resumePosition > 0 ? 'a' : 'w'
          });

          // Set up progress tracking
          const progressTracker = this.createProgressTracker(downloadState, total);

          // Stream the response
          await this.streamResponse(response, fileStream, progressTracker, chunkSize);

          clearTimeout(timeoutId);
          return; // Success!

        } catch (streamError) {
          clearTimeout(timeoutId);
          throw streamError;
        }

      } catch (error) {
        attempt++;
        
        // Ensure downloadState integrity is maintained for retries
        if (!downloadState.url || !downloadState.filePath) {
          console.error('❌ Download state corrupted during retry:', downloadState);
          throw new Error('Download state corrupted - missing URL or file path');
        }
        
        if (attempt >= retries) {
          throw error;
        }

        console.warn(`Download attempt ${attempt} failed, retrying... Error:`, error);
        
        // Wait before retry with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Stream response data with progress tracking
   */
  private async streamResponse(
    response: Response,
    fileStream: NodeJS.WritableStream,
    progressTracker: (chunk: Uint8Array) => void,
    chunkSize: number
  ): Promise<void> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw createApiError('No response body to read', 500, 'NO_RESPONSE_BODY');
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        // Write chunk to file
        await new Promise<void>((resolve, reject) => {
          fileStream.write(value, (error) => {
            if (error) reject(error);
            else resolve();
          });
        });

        // Update progress
        progressTracker(value);
      }

      // Close the file stream
      await new Promise<void>((resolve, reject) => {
        fileStream.end(() => {
          resolve();
        });
        fileStream.on('error', reject);
      });

    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Create progress tracking function
   */
  private createProgressTracker(downloadState: DownloadProgress, total: number) {
    let lastUpdateTime = Date.now();
    let lastReceivedBytes = downloadState.progress.received;

    return (chunk: Uint8Array) => {
      const now = Date.now();
      downloadState.progress.received += chunk.length;

      // Update progress percentage
      if (total > 0) {
        downloadState.progress.percent = Math.round(
          (downloadState.progress.received / total) * 100
        );
      }

      // Calculate speed and ETA (update every 500ms)
      if (now - lastUpdateTime >= 500) {
        const timeDiff = (now - lastUpdateTime) / 1000;
        const bytesDiff = downloadState.progress.received - lastReceivedBytes;
        
        downloadState.progress.speed = bytesDiff / timeDiff;
        
        if (total > 0 && downloadState.progress.speed > 0) {
          const remainingBytes = total - downloadState.progress.received;
          downloadState.progress.eta = remainingBytes / downloadState.progress.speed;
        }

        lastUpdateTime = now;
        lastReceivedBytes = downloadState.progress.received;

        // Emit progress event
        this.emit('downloadProgress', downloadState);

        // Persist progress to file for frontend polling
        this.persistProgress(downloadState).catch(console.error);
      }
    };
  }

  /**
   * Persist download progress to file for frontend access
   */
  private async persistProgress(downloadState: DownloadProgress): Promise<void> {
    try {
      await writeJsonFile(FILES.DOWNLOAD_PROGRESS, {
        ...downloadState.progress,
        status: downloadState.status,
        error: downloadState.error,
        id: downloadState.id,
        startTime: downloadState.startTime
      });
    } catch (error) {
      console.error('Failed to persist progress:', error);
      // Don't throw - progress persistence shouldn't break the download
    }
  }

  /**
   * Cancel an active download
   */
  async cancelDownload(downloadId: string): Promise<boolean> {
    const controller = this.abortControllers.get(downloadId);
    const downloadState = this.activeDownloads.get(downloadId);

    if (controller && downloadState) {
      controller.abort();
      downloadState.status = 'cancelled';
      downloadState.endTime = Date.now();
      
      this.emit('downloadCancelled', downloadState);
      return true;
    }

    return false;
  }

  /**
   * Get download status
   */
  getDownloadStatus(downloadId: string): DownloadProgress | null {
    return this.activeDownloads.get(downloadId) || null;
  }

  /**
   * Get all active downloads
   */
  getActiveDownloads(): DownloadProgress[] {
    return Array.from(this.activeDownloads.values());
  }

  /**
   * Generate unique download ID
   */
  private generateDownloadId(): string {
    return `download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Format bytes for human-readable display
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Global download manager instance
export const downloadManager = new DownloadManager();
