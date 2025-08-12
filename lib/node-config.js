/**
 * Node.js configuration utilities for scripts outside Next.js
 * This mirrors the src/lib/config.ts but for standalone scripts
 */

const path = require('path');
const os = require('os');

// Environment detection
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';

// Base paths
const WORKSPACE_ROOT = process.cwd();
const TEMP_DIR = process.env.TEMP_DIR || (IS_PRODUCTION ? '/var/tmp/mtg' : '/tmp');
const DATA_DIR = process.env.DATA_DIR || path.join(TEMP_DIR, 'data');

// Ensure directories exist
const fs = require('fs');
try {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(TEMP_DIR, { recursive: true });
} catch (error) {
  console.warn('Warning: Could not create directories:', error.message);
}

const FILES = {
  // MTGJSON files
  MTGJSON_ALLPRICES: path.join(DATA_DIR, 'AllPrices.json'),
  MTGJSON_ALLPRICES_LOCAL: path.join(WORKSPACE_ROOT, 'AllPrices.json'),
  
  // Progress and status files
  DOWNLOAD_PROGRESS: path.join(TEMP_DIR, 'AllPrices.progress.json'),
  IMPORT_PROGRESS_LOCK: path.join(TEMP_DIR, 'AllPrices.import-in-progress'),
  IMPORT_PROGRESS_DATA: path.join(TEMP_DIR, 'AllPrices.import.progress.json'),
  IMPORT_LOG: path.join(TEMP_DIR, 'AllPrices.import.log'),
  
  // Price history
  PRICE_HISTORY: path.join(DATA_DIR, 'price-history.json'),
  PRICE_HISTORY_BACKUP: path.join(DATA_DIR, 'price-history-backup-{timestamp}.json'),
};

const API = {
  BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000',
  ENDPOINTS: {
    PRICE_HISTORY: '/api/price-history',
    DOWNLOAD_MTGJSON: '/api/admin/download-mtgjson',
    IMPORT_MTGJSON: '/api/admin/import-mtgjson',
    CHECK_MTGJSON: '/api/admin/check-mtgjson',
  },
  REQUEST_TIMEOUT: 30000, // 30 seconds
};

const VALIDATION = {
  MAX_FILE_SIZE: 1024 * 1024 * 1024 * 2, // 2GB
  ALLOWED_FILE_EXTENSIONS: ['.json', '.csv'],
  IMPORT_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  DOWNLOAD_TIMEOUT: 10 * 60 * 1000, // 10 minutes
};

module.exports = {
  NODE_ENV,
  IS_PRODUCTION,
  WORKSPACE_ROOT,
  TEMP_DIR,
  DATA_DIR,
  FILES,
  API,
  VALIDATION,
};
