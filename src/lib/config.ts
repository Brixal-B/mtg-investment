/**
 * Centralized configuration for the MTG Investment app
 * Handles environment-specific settings and file paths
 */

import path from 'path';
import os from 'os';

// Environment configuration
export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000'),
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
} as const;

// File system configuration
export const PATHS = {
  // Use system temp directory with fallback
  TEMP_DIR: process.env.TEMP_DIR || process.env.TMPDIR || os.tmpdir(),
  
  // Data directory - can be overridden for production
  DATA_DIR: process.env.DATA_DIR || (ENV.IS_PRODUCTION ? '/data' : path.join(os.tmpdir(), 'mtg-data')),
  
  // Workspace root for development
  WORKSPACE_ROOT: process.cwd(),
} as const;

// Computed file paths
export const FILES = {
  // MTGJSON files
  MTGJSON_ALLPRICES: path.join(PATHS.DATA_DIR, 'AllPrices.json'),
  MTGJSON_ALLPRICES_LOCAL: path.join(PATHS.WORKSPACE_ROOT, 'AllPrices.json'),
  
  // Progress and status files
  DOWNLOAD_PROGRESS: path.join(PATHS.TEMP_DIR, 'AllPrices.progress.json'),
  IMPORT_PROGRESS_LOCK: path.join(PATHS.TEMP_DIR, 'AllPrices.import-in-progress'),
  IMPORT_PROGRESS_DATA: path.join(PATHS.TEMP_DIR, 'AllPrices.import.progress.json'),
  IMPORT_LOG: path.join(PATHS.TEMP_DIR, 'AllPrices.import.log'),
  
  // Application data
  PRICE_HISTORY: path.join(PATHS.DATA_DIR, 'price-history.json'),
  PRICE_HISTORY_BACKUP: path.join(PATHS.DATA_DIR, 'price-history-backup.json'),
} as const;

// API configuration
export const API = {
  MTGJSON_URL: 'https://mtgjson.com/api/v5/AllPrices.json',
  SCRYFALL_API_BASE: 'https://api.scryfall.com',
  REQUEST_TIMEOUT: 30000, // 30 seconds
  RATE_LIMIT_DELAY: 100, // milliseconds between requests
} as const;

// Import/processing configuration
export const PROCESSING = {
  BATCH_SIZE: 5000,
  PROGRESS_UPDATE_INTERVAL: 25000,
  RATE_WINDOW_SIZE: 3,
  ESTIMATED_TOTAL: 500000,
  MEMORY_CLEANUP_INTERVAL: 50000,
  DEBUG_LIMIT: 20,
} as const;

// Validation helpers
export const VALIDATION = {
  MAX_FILE_SIZE: 1024 * 1024 * 1024 * 2, // 2GB
  ALLOWED_FILE_EXTENSIONS: ['.json', '.csv'],
  IMPORT_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  DOWNLOAD_TIMEOUT: 10 * 60 * 1000, // 10 minutes
} as const;

/**
 * Ensures required directories exist
 */
export async function ensureDirectories() {
  const fs = await import('fs/promises');
  
  try {
    await fs.mkdir(PATHS.DATA_DIR, { recursive: true });
    await fs.mkdir(PATHS.TEMP_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create directories:', error);
    throw error;
  }
}

/**
 * Get configuration summary for debugging
 */
export function getConfigSummary() {
  return {
    environment: ENV.NODE_ENV,
    dataDir: PATHS.DATA_DIR,
    tempDir: PATHS.TEMP_DIR,
    isProduction: ENV.IS_PRODUCTION,
    mtgjsonFile: FILES.MTGJSON_ALLPRICES,
    priceHistoryFile: FILES.PRICE_HISTORY,
  };
}

const config = {
  ENV,
  PATHS,
  FILES,
  API,
  PROCESSING,
  VALIDATION,
  ensureDirectories,
  getConfigSummary,
};

export default config;
