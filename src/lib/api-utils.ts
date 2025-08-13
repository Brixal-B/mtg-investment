/**
 * API utilities and helpers for backend routes
 */

import { NextRequest } from 'next/server';
import { API, VALIDATION } from './config';
import { createApiError, handleNetworkError } from './errors';

/**
 * HTTP client with timeout and error handling
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = API.REQUEST_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw createApiError(`Request timeout: ${url}`, 408, 'REQUEST_TIMEOUT');
    }
    
    handleNetworkError(error, url);
  }
}

/**
 * Download file with progress tracking
 */
export async function downloadWithProgress(
  url: string,
  filePath: string,
  onProgress?: (progress: { percent: number; received: number; total: number }) => void
): Promise<void> {
  const fs = await import('fs');
  const path = await import('path');
  
  try {
    const response = await fetchWithTimeout(url);
    
    if (!response.ok) {
      throw createApiError(
        `Download failed: ${response.status} ${response.statusText}`,
        response.status,
        'DOWNLOAD_FAILED'
      );
    }
    
    const contentLength = response.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;
    let received = 0;
    
    // Ensure directory exists
    const dir = path.dirname(filePath);
    await fs.promises.mkdir(dir, { recursive: true });
    
    const fileStream = fs.createWriteStream(filePath);
    const reader = response.body?.getReader();
    
    if (!reader) {
      throw createApiError('Failed to read response body', 500, 'RESPONSE_READ_ERROR');
    }
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        received += value.length;
        fileStream.write(value);
        
        if (onProgress && total > 0) {
          const percent = Math.round((received / total) * 100);
          onProgress({ percent, received, total });
        }
      }
      
      fileStream.end();
      
      // Wait for write stream to finish
      await new Promise((resolve, reject) => {
        fileStream.on('finish', () => resolve(void 0));
        fileStream.on('error', reject);
      });
      
    } finally {
      reader.releaseLock();
    }
    
  } catch (error) {
    // Clean up partial file on error
    try {
      await fs.promises.unlink(filePath);
    } catch {
      // Ignore cleanup errors
    }
    throw error;
  }
}

/**
 * Parse request query parameters safely
 */
export function parseQueryParams(request: NextRequest) {
  const url = new URL(request.url);
  const params = Object.fromEntries(url.searchParams.entries());
  
  return {
    debug: params.debug === 'true',
    progress: params.progress === '1',
    log: params.log === '1',
    limit: params.limit ? parseInt(params.limit, 10) : undefined,
    offset: params.offset ? parseInt(params.offset, 10) : undefined,
  };
}

/**
 * Validate file upload
 */
export function validateFileUpload(file: File) {
  // Check file size
  if (file.size > VALIDATION.MAX_FILE_SIZE) {
    throw createApiError(
      `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB (max ${VALIDATION.MAX_FILE_SIZE / 1024 / 1024}MB)`,
      413,
      'FILE_TOO_LARGE'
    );
  }
  
  // Check file extension
  const extension = `.${file.name.toLowerCase().split('.').pop()}`;
  if (!VALIDATION.ALLOWED_FILE_EXTENSIONS.includes(extension)) {
    throw createApiError(
      `Invalid file type: ${extension} (allowed: ${VALIDATION.ALLOWED_FILE_EXTENSIONS.join(', ')})`,
      400,
      'INVALID_FILE_TYPE'
    );
  }
}

/**
 * Rate limiting helper
 */
export function createRateLimiter(delay: number = API.RATE_LIMIT_DELAY) {
  let lastCall = 0;
  
  return async function rateLimitedCall<T>(fn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;
    
    if (timeSinceLastCall < delay) {
      await new Promise(resolve => setTimeout(resolve, delay - timeSinceLastCall));
    }
    
    lastCall = Date.now();
    return await fn();
  };
}

/**
 * Process executor with timeout
 */
export function executeWithTimeout<T>(
  promise: Promise<T>,
  timeout: number,
  errorMessage: string = 'Operation timeout'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(createApiError(errorMessage, 408, 'TIMEOUT')), timeout)
    ),
  ]);
}

/**
 * Retry helper for unreliable operations
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries) {
        break;
      }
      
      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, lastError.message);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
  
  throw lastError!;
}

/**
 * Simple JSON file processor (for smaller files)
 */
export async function processJsonFile<T>(
  filePath: string,
  processor: (data: T) => void
): Promise<void> {
  const fs = await import('fs/promises');
  
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(content) as T;
    processor(data);
  } catch (error) {
    throw createApiError(
      `Failed to process JSON file: ${filePath}`,
      500,
      'JSON_PROCESS_ERROR',
      error
    );
  }
}
