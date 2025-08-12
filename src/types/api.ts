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
export interface ApiResponse<T = any> {
  ok?: boolean;
  error?: string;
  data?: T;
  message?: string;
  details?: string | Record<string, any>;
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
  details?: Record<string, any>;
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

// Database-related types
export interface DatabaseCard {
  id: number;
  uuid: string;
  name: string;
  set_code?: string;
  set_name?: string;
  collector_number?: string;
  rarity?: string;
  mana_cost?: string;
  cmc?: number;
  type_line?: string;
  oracle_text?: string;
  power?: string;
  toughness?: string;
  colors?: string; // JSON array
  color_identity?: string; // JSON array
  legalities?: string; // JSON object
  image_uris?: string; // JSON object
  scryfall_id?: string;
  created_at: string;
  updated_at: string;
}

export interface PriceRecord {
  id: number;
  card_uuid: string;
  date: string;
  price_usd?: number;
  price_usd_foil?: number;
  price_eur?: number;
  price_tix?: number;
  source: 'scryfall' | 'mtgjson' | 'manual';
  created_at: string;
}

export interface CollectionItem {
  id: number;
  user_id: string;
  card_uuid: string;
  quantity: number;
  condition: 'mint' | 'near_mint' | 'excellent' | 'good' | 'light_played' | 'played' | 'poor';
  foil: boolean;
  purchase_price?: number;
  purchase_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabasePriceSnapshot {
  id: number;
  snapshot_date: string;
  total_value: number;
  card_count: number;
  collection_data: string; // JSON array
  created_at: string;
}

export interface ImportLog {
  id: number;
  operation_type: 'mtgjson_import' | 'price_update' | 'csv_import';
  status: 'success' | 'error' | 'in_progress';
  records_processed: number;
  error_message?: string;
  metadata?: string; // JSON object
  started_at: string;
  completed_at?: string;
  created_at: string;
}

export interface DatabaseInfo {
  tables: Array<{ table: string; count: number }>;
  priceData: {
    earliest_date?: string;
    latest_date?: string;
    total_records?: number;
  };
  collection: {
    total_value?: number;
    card_count?: number;
  };
  timestamp: string;
}
