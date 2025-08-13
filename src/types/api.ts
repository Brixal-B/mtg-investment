/**
 * API Response Types and Admin Tool Types
 */

// Error handling types
export interface AppError {
  name: string;
  message: string;
  stack?: string;
  cause?: unknown;
}

export interface ApiError extends AppError {
  status?: number;
  code?: string;
}

// Standard API response wrapper
export interface ApiResponse<T = unknown> {
  ok?: boolean;
  error?: string;
  data?: T;
  message?: string;
  details?: string | Record<string, unknown>;
}

// Admin tool status and progress types
export interface AdminStatus {
  message: string;
  loading: boolean;
  progress?: number;
  speed?: string;
  eta?: number;
  phase?: string;
}

// Download progress (for MTGJSON downloads)
export interface DownloadProgress {
  percent: number;
  received: number;
  total: number;
  speed?: string;
}

// Import progress (for MTGJSON processing)
export interface ImportProgress {
  percent: number;
  processed: number;
  total: number;
  rate?: number; // cards per second
  eta?: number; // seconds remaining
  phase: string;
  inProgress: boolean;
}

// MTGJSON file status
export interface MTGJSONFileStatus {
  exists: boolean;
  size?: number;
  lastModified?: string;
  path?: string;
}

// Error types for better error handling
export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  details?: Record<string, unknown>;
}

// Configuration types
export interface AppConfig {
  paths: {
    mtgjsonFile: string;
    priceHistoryFile: string;
    importProgressFile: string;
    importLogFile: string;
    tempDirectory: string;
  };
  mtgjson: {
    downloadUrl: string;
    targetDates: string[]; // YYYY-MM-DD format
  };
  import: {
    batchSize: number;
    progressUpdateInterval: number;
    memoryCleanupInterval: number;
    debugLimit?: number;
  };
}

// Debug configuration
export interface DebugConfig {
  SHOW_CARD_DETAILS: boolean;
  SHOW_PRICE_ANALYSIS: boolean;
  SHOW_SET_STATISTICS: boolean;
  SHOW_MONTHLY_TRENDS: boolean;
  USE_FALLBACK_DATES: boolean;
  VERBOSE_LOGGING: boolean;
}

// Admin action types
export type AdminAction = 
  | 'download-mtgjson'
  | 'import-mtgjson'
  | 'check-mtgjson'
  | 'clear-import-lock'
  | 'view-import-log';

// File processing status
export interface FileProcessingStatus {
  phase: 'downloading' | 'processing' | 'complete' | 'error';
  progress: number;
  speed?: string;
  eta?: number;
  error?: string;
}
