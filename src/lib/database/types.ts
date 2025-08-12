/**
 * Database types and interfaces
 */

// Database configuration
export interface DatabaseConfig {
  type: 'sqlite' | 'postgresql';
  connectionString?: string;
  filename?: string; // for SQLite
  host?: string;     // for PostgreSQL
  port?: number;     // for PostgreSQL
  database?: string; // for PostgreSQL
  username?: string; // for PostgreSQL
  password?: string; // for PostgreSQL
  ssl?: boolean;     // for PostgreSQL
  poolMin?: number;
  poolMax?: number;
}

// Database row types matching our schema
export interface CardRow {
  uuid: string;
  name: string;
  set_code: string;
  set_name: string;
  rarity?: string;
  type_line?: string;
  mana_cost?: string;
  cmc?: number;
  oracle_text?: string;
  image_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface PriceHistoryRow {
  id: number;
  card_uuid: string;
  price_date: Date;
  price: number;
  source: string;
  variant: string;
  created_at: Date;
}

export interface CardSetRow {
  code: string;
  name: string;
  type?: string;
  release_date?: Date;
  card_count?: number;
  created_at: Date;
  updated_at: Date;
}

export interface ImportLogRow {
  id: number;
  import_type: string;
  status: string;
  started_at: Date;
  completed_at?: Date;
  records_processed?: number;
  records_failed?: number;
  error_message?: string;
  metadata?: string; // JSON
}

// Query result types
export interface CurrentPriceView {
  card_uuid: string;
  name: string;
  set_code: string;
  set_name: string;
  latest_price?: number;
  price_date?: Date;
  source?: string;
  variant?: string;
}

export interface CardWithPricesView {
  uuid: string;
  name: string;
  set_code: string;
  set_name: string;
  rarity?: string;
  type_line?: string;
  mana_cost?: string;
  cmc?: number;
  oracle_text?: string;
  image_url?: string;
  latest_price?: number;
  price_date?: Date;
  price_source?: string;
  price_variant?: string;
}