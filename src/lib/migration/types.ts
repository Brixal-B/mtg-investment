/**
 * Migration types and interfaces
 */

// Migration status and progress tracking
export interface MigrationProgress {
  phase: string;
  processed: number;
  total: number;
  failed: number;
  percentage: number;
  rate?: number; // items per second
  eta?: number; // seconds remaining
  startTime: Date;
  errors: string[];
}

export interface MigrationResult {
  success: boolean;
  processed: number;
  failed: number;
  duration: number; // milliseconds
  errors: string[];
  warnings: string[];
}

export interface MigrationOptions {
  batchSize?: number;
  continueOnError?: boolean;
  dryRun?: boolean;
  skipValidation?: boolean;
  progressCallback?: (progress: MigrationProgress) => void;
}

// Migration status tracking
export type MigrationStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface MigrationLog {
  id: string;
  type: string;
  status: MigrationStatus;
  startTime: Date;
  endTime?: Date;
  progress: MigrationProgress;
  result?: MigrationResult;
  metadata?: Record<string, any>;
}

// Data validation types
export interface ValidationError {
  item: any;
  field: string;
  value: any;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  itemsChecked: number;
}

// CSV import specific types
export interface CsvImportOptions extends MigrationOptions {
  delimiter?: string;
  headers?: string[];
  skipHeaders?: boolean;
  encoding?: BufferEncoding;
  maxFileSize?: number;
}

export interface CsvRow {
  [key: string]: string;
}

// JSON migration specific types
export interface JsonMigrationOptions extends MigrationOptions {
  sourceType: 'mtgjson' | 'custom';
  dataPath?: string; // JSON path to data section
}

// Admin tool types
export interface DataIntegrityCheck {
  name: string;
  description: string;
  execute: () => Promise<ValidationResult>;
}

export interface MigrationConfig {
  migrations: {
    json: {
      batchSize: number;
      maxRetries: number;
      retryDelay: number;
    };
    csv: {
      batchSize: number;
      maxFileSize: number;
      supportedEncodings: BufferEncoding[];
    };
  };
  validation: {
    required: boolean;
    strictMode: boolean;
    maxErrors: number;
  };
  performance: {
    connectionPoolSize: number;
    queryTimeout: number;
    memoryLimit: number;
  };
}