/**
 * Centralized error handling utilities for API routes
 */

import { NextResponse } from 'next/server';

// Define ApiError interface locally since it wasn't exported
interface ApiError extends Error {
  status?: number;
  code?: string;
  cause?: unknown;
}

/**
 * Standard error response format
 */
export function createErrorResponse(
  error: unknown,
  defaultMessage: string = 'An unexpected error occurred',
  status: number = 500
): NextResponse {
  console.error('API Error:', error);
  
  // Check if it's an error with API properties
  if (error && typeof error === 'object' && 'status' in error && 'code' in error) {
    const apiError = error as ApiError;
    return NextResponse.json(
      {
        ok: false,
        error: apiError.message,
        code: apiError.code,
        details: apiError.cause ? String(apiError.cause) : undefined
      },
      { status: apiError.status || status }
    );
  }
  
  if (error instanceof Error) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
        details: error.stack
      },
      { status }
    );
  }
  
  return NextResponse.json(
    {
      ok: false,
      error: defaultMessage,
      details: String(error)
    },
    { status }
  );
}

/**
 * Success response wrapper
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      ok: true,
      data,
      message
    },
    { status }
  );
}

/**
 * Validation error response
 */
export function createValidationError(
  message: string,
  field?: string
): NextResponse {
  return NextResponse.json(
    {
      ok: false,
      error: 'Validation failed',
      details: message,
      field
    },
    { status: 400 }
  );
}

/**
 * Create custom API error
 */
export function createApiError(
  message: string,
  status: number = 500,
  code?: string,
  cause?: unknown
): ApiError {
  const error = new Error(message) as ApiError;
  error.name = 'ApiError';
  error.status = status;
  error.code = code;
  error.cause = cause;
  return error;
}

/**
 * Async error wrapper for API routes
 */
export function withErrorHandling<T extends unknown[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R | NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return createErrorResponse(error);
    }
  };
}

/**
 * File operation error handler
 */
export function handleFileError(error: unknown, operation: string, filePath: string): never {
  const message = `Failed to ${operation} file: ${filePath}`;
  
  if (error instanceof Error) {
    if (error.message.includes('ENOENT')) {
      throw createApiError(`File not found: ${filePath}`, 404, 'FILE_NOT_FOUND', error);
    }
    if (error.message.includes('EACCES')) {
      throw createApiError(`Permission denied: ${filePath}`, 403, 'PERMISSION_DENIED', error);
    }
    if (error.message.includes('ENOSPC')) {
      throw createApiError('Insufficient disk space', 507, 'DISK_FULL', error);
    }
  }
  
  throw createApiError(message, 500, 'FILE_OPERATION_FAILED', error);
}

/**
 * Network operation error handler
 */
export function handleNetworkError(error: unknown, url: string): never {
  const message = `Network request failed: ${url}`;
  
  if (error instanceof Error) {
    if (error.message.includes('timeout')) {
      throw createApiError(`Request timeout: ${url}`, 408, 'REQUEST_TIMEOUT', error);
    }
    if (error.message.includes('ENOTFOUND')) {
      throw createApiError(`Host not found: ${url}`, 502, 'HOST_NOT_FOUND', error);
    }
  }
  
  throw createApiError(message, 502, 'NETWORK_ERROR', error);
}

/**
 * Process operation error handler
 */
export function handleProcessError(error: unknown, operation: string): never {
  const message = `Process operation failed: ${operation}`;
  
  throw createApiError(message, 500, 'PROCESS_ERROR', error);
}
