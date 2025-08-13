/**
 * MTGJSON Download API - Backend API Agent Implementation
 * Enhanced with proper lifecycle management, progress tracking, and error handling
 */

import { NextResponse } from 'next/server';
import { 
  FILES,
  API,
  downloadManager,
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling,
  initializeFileSystem,
  fileExists
} from '@/lib';

// Initialize file system on module load
initializeFileSystem().catch(console.error);

/**
 * POST /api/admin/download-mtgjson
 * Start MTGJSON download with enhanced progress tracking
 */
export const POST = withErrorHandling(async (): Promise<NextResponse> => {
  try {
    console.log('🚀 Starting MTGJSON download with enhanced backend agent...');
    
    // Check if a download is already in progress
    const activeDownloads = downloadManager.getActiveDownloads();
    const existingDownload = activeDownloads.find(d => 
      d.url === API.MTGJSON_URL && 
      ['pending', 'downloading'].includes(d.status)
    );
    
    if (existingDownload) {
      console.log(`📥 Download already in progress: ${existingDownload.id}`);
      return createSuccessResponse({
        downloadId: existingDownload.id,
        status: existingDownload.status,
        progress: existingDownload.progress,
        message: 'Download already in progress'
      });
    }

    // Check if file already exists and is complete
    if (fileExists(FILES.MTGJSON_ALLPRICES)) {
      try {
        const fs = require('fs');
        const stats = fs.statSync(FILES.MTGJSON_ALLPRICES);
        
        // Consider file complete if it's larger than 1GB (reasonable size check)
        if (stats.size > 1000000000) {
          console.log(`✅ File already exists and appears complete: ${(stats.size / 1024 / 1024).toFixed(1)}MB`);
          return createSuccessResponse({
            alreadyExists: true,
            fileSize: stats.size,
            filePath: FILES.MTGJSON_ALLPRICES,
            message: 'MTGJSON file already downloaded'
          });
        }
      } catch (error) {
        console.warn('Error checking existing file:', error);
        // Continue with download if we can't verify the file
      }
    }

    // Set up download event handlers for real-time progress
    downloadManager.on('downloadProgress', (progress) => {
      console.log(`📊 Download progress: ${progress.progress.percent}% (${formatBytes(progress.progress.received)}/${formatBytes(progress.progress.total)}) @ ${formatBytes(progress.progress.speed)}/s`);
    });

    downloadManager.on('downloadCompleted', (progress) => {
      console.log(`✅ Download completed: ${progress.filePath}`);
    });

    downloadManager.on('downloadFailed', (progress) => {
      console.error(`❌ Download failed: ${progress.error}`);
    });

    // Start the download asynchronously
    const downloadId = await downloadManager.startDownload(
      API.MTGJSON_URL,
      FILES.MTGJSON_ALLPRICES,
      {
        timeout: API.DOWNLOAD_TIMEOUT,
        retries: 3,
        resumable: true,
        validateChecksum: false // Could add SHA verification later
      }
    );

    console.log(`🎯 Download started with ID: ${downloadId}`);

    // Return immediately with download ID for tracking
    return createSuccessResponse({
      downloadId,
      status: 'started',
      message: 'MTGJSON download started successfully',
      trackingUrl: `/api/admin/download-mtgjson?id=${downloadId}`
    });

  } catch (error) {
    console.error('❌ Failed to start MTGJSON download:', error);
    return createErrorResponse(
      error, 
      'Failed to start MTGJSON download',
      500
    );
  }
});

/**
 * GET /api/admin/download-mtgjson
 * Get download progress or specific download status
 */
export const GET = withErrorHandling(async (request: Request): Promise<NextResponse> => {
  try {
    const url = new URL(request.url);
    const downloadId = url.searchParams.get('id');

    // If specific download ID requested, return that status
    if (downloadId) {
      const downloadStatus = downloadManager.getDownloadStatus(downloadId);
      
      if (!downloadStatus) {
        return createErrorResponse(
          new Error('Download not found'),
          'Download not found',
          404
        );
      }

      return createSuccessResponse(downloadStatus);
    }

    // Return general progress status
    const activeDownloads = downloadManager.getActiveDownloads();
    const mtgjsonDownload = activeDownloads.find(d => d.url === API.MTGJSON_URL);

    if (mtgjsonDownload) {
      return createSuccessResponse({
        hasActiveDownload: true,
        download: mtgjsonDownload,
        ...mtgjsonDownload.progress
      });
    }

    // No active download - check if file exists
    if (fileExists(FILES.MTGJSON_ALLPRICES)) {
      try {
        const fs = require('fs');
        const stats = fs.statSync(FILES.MTGJSON_ALLPRICES);
        
        return createSuccessResponse({
          hasActiveDownload: false,
          fileExists: true,
          fileSize: stats.size,
          lastModified: stats.mtime,
          percent: 100,
          received: stats.size,
          total: stats.size
        });
      } catch (error) {
        console.error('Error checking file stats:', error);
      }
    }

    // Default response - no download, no file
    return createSuccessResponse({
      hasActiveDownload: false,
      fileExists: false,
      percent: 0,
      received: 0,
      total: 0
    });

  } catch (error) {
    console.error('❌ Failed to get download status:', error);
    return createErrorResponse(
      error,
      'Failed to get download status',
      500
    );
  }
});

/**
 * DELETE /api/admin/download-mtgjson
 * Cancel active download
 */
export const DELETE = withErrorHandling(async (request: Request): Promise<NextResponse> => {
  try {
    const url = new URL(request.url);
    const downloadId = url.searchParams.get('id');

    if (!downloadId) {
      return createErrorResponse(
        new Error('Download ID required'),
        'Download ID required for cancellation',
        400
      );
    }

    const cancelled = await downloadManager.cancelDownload(downloadId);

    if (cancelled) {
      console.log(`🛑 Download cancelled: ${downloadId}`);
      return createSuccessResponse({
        cancelled: true,
        downloadId,
        message: 'Download cancelled successfully'
      });
    } else {
      return createErrorResponse(
        new Error('Download not found or already completed'),
        'Cannot cancel download - not found or already completed',
        404
      );
    }

  } catch (error) {
    console.error('❌ Failed to cancel download:', error);
    return createErrorResponse(
      error,
      'Failed to cancel download',
      500
    );
  }
});

/**
 * Helper function to format bytes for logging
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
