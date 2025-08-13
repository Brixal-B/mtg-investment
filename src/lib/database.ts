/**
 * 🗄️ Database Utilities - Centralized Database Access Layer
 * 
 * Provides a clean interface for database operations with connection pooling,
 * query optimization, and error handling.
 */

import { Database } from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { PATHS } from './config';

// Database configuration
export const DATABASE_CONFIG = {
  development: path.join(PATHS.DATA_DIR, 'mtg-investment.db'),
  production: process.env.DATABASE_URL || path.join(PATHS.DATA_DIR, 'mtg-investment.db'),
  options: {
    // SQLite specific options
    pragma: {
      foreign_keys: 'ON',
      journal_mode: 'WAL',
      synchronous: 'NORMAL',
      cache_size: 10000,
      temp_store: 'MEMORY'
    }
  }
} as const;

// Connection pool for managing database connections
class DatabasePool {
  private static instance: DatabasePool;
  private db: Database | null = null;
  private initialized = false;

  static getInstance(): DatabasePool {
    if (!DatabasePool.instance) {
      DatabasePool.instance = new DatabasePool();
    }
    return DatabasePool.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const dbPath = DATABASE_CONFIG.development;
    
    // Ensure data directory exists
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    this.db = new Database(dbPath);
    
    // Configure SQLite for optimal performance
    await this.executePragmas();
    
    this.initialized = true;
    console.log(`✅ Database initialized: ${dbPath}`);
  }

  private async executePragmas(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const pragmas = [
      'PRAGMA foreign_keys = ON',
      'PRAGMA journal_mode = WAL',
      'PRAGMA synchronous = NORMAL',
      'PRAGMA cache_size = 10000',
      'PRAGMA temp_store = MEMORY'
    ];

    for (const pragma of pragmas) {
      await this.run(pragma);
    }
  }

  async run(sql: string, params: unknown[] = []): Promise<{ changes: number; lastID: number }> {
    if (!this.db) await this.initialize();
    
    return new Promise((resolve, reject) => {
      this.db!.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes, lastID: this.lastID });
      });
    });
  }

  async get<T = any>(sql: string, params: unknown[] = []): Promise<T | undefined> {
    if (!this.db) await this.initialize();
    
    return new Promise((resolve, reject) => {
      this.db!.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row as T);
      });
    });
  }

  async all<T = any>(sql: string, params: unknown[] = []): Promise<T[]> {
    if (!this.db) await this.initialize();
    
    return new Promise((resolve, reject) => {
      this.db!.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows as T[]);
      });
    });
  }

  async close(): Promise<void> {
    if (!this.db) return;
    
    return new Promise((resolve) => {
      this.db!.close((err) => {
        if (err) console.warn('Database close warning:', err.message);
        this.db = null;
        this.initialized = false;
        resolve();
      });
    });
  }
}

// Singleton database instance
const db = DatabasePool.getInstance();

// Card-related database operations
export const CardOperations = {
  async getCard(uuid: string) {
    return db.get('SELECT * FROM cards WHERE uuid = ?', [uuid]);
  },

  async getCardByName(name: string) {
    return db.get('SELECT * FROM cards WHERE name = ? LIMIT 1', [name]);
  },

  async searchCards(query: string, limit = 50) {
    return db.all(`
      SELECT * FROM cards 
      WHERE name LIKE ? OR set_name LIKE ? 
      ORDER BY name 
      LIMIT ?
    `, [`%${query}%`, `%${query}%`, limit]);
  },

  async insertCard(cardData: unknown) {
    const card = cardData as any; // Type assertion for unknown data
    const sql = `
      INSERT OR REPLACE INTO cards 
      (uuid, name, set_code, set_name, collector_number, rarity, mana_cost, cmc, 
       type_line, oracle_text, power, toughness, colors, color_identity, 
       legalities, image_uris, scryfall_id, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;
    
    return db.run(sql, [
      card.uuid,
      card.name,
      card.set_code,
      card.set_name,
      card.collector_number,
      card.rarity,
      card.mana_cost,
      card.cmc,
      card.type_line,
      card.oracle_text,
      card.power,
      card.toughness,
      JSON.stringify(card.colors),
      JSON.stringify(card.color_identity),
      JSON.stringify(card.legalities),
      JSON.stringify(card.image_uris),
      card.scryfall_id
    ]);
  },

  async getCardsWithoutPrices() {
    return db.all(`
      SELECT c.* FROM cards c
      LEFT JOIN price_history ph ON c.uuid = ph.card_uuid
      WHERE ph.card_uuid IS NULL
      LIMIT 100
    `);
  }
};

// Price history operations
export const PriceOperations = {
  async getPriceHistory(cardUuid: string, days = 180) {
    return db.all(`
      SELECT * FROM price_history 
      WHERE card_uuid = ? 
      AND date >= date('now', '-${days} days')
      ORDER BY date DESC
    `, [cardUuid]);
  },

  async getLatestPrice(cardUuid: string) {
    return db.get(`
      SELECT * FROM price_history 
      WHERE card_uuid = ? 
      ORDER BY date DESC 
      LIMIT 1
    `, [cardUuid]);
  },

  async insertPriceRecord(priceData: unknown) {
    const price = priceData as any; // Type assertion for unknown data
    const sql = `
      INSERT OR REPLACE INTO price_history 
      (card_uuid, date, price_usd, price_usd_foil, price_eur, price_tix, source)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    return db.run(sql, [
      price.card_uuid,
      price.date,
      price.price_usd,
      price.price_usd_foil,
      price.price_eur,
      price.price_tix,
      price.source
    ]);
  },

  async bulkInsertPrices(priceRecords: unknown[]) {
    // Use transaction for better performance
    await db.run('BEGIN TRANSACTION');
    
    try {
      for (const record of priceRecords) {
        await this.insertPriceRecord(record);
      }
      await db.run('COMMIT');
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  },

  async getDateRange() {
    const result = await db.get(`
      SELECT 
        MIN(date) as earliest_date,
        MAX(date) as latest_date,
        COUNT(*) as total_records
      FROM price_history
    `);
    return result;
  }
};

// Collection operations
export const CollectionOperations = {
  async getUserCollection(userId = 'default') {
    return db.all(`
      SELECT c.*, col.quantity, col.condition, col.foil, col.purchase_price, col.purchase_date
      FROM collections col
      JOIN cards c ON col.card_uuid = c.uuid
      WHERE col.user_id = ?
      ORDER BY c.name
    `, [userId]);
  },

  async addToCollection(cardUuid: string, quantity = 1, options: unknown = {}) {
    const opts = options as any; // Type assertion for unknown data
    const sql = `
      INSERT OR REPLACE INTO collections 
      (user_id, card_uuid, quantity, condition, foil, purchase_price, purchase_date, notes, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;
    
    return db.run(sql, [
      opts.user_id || 'default',
      cardUuid,
      quantity,
      opts.condition || 'near_mint',
      opts.foil || false,
      opts.purchase_price,
      opts.purchase_date,
      opts.notes
    ]);
  },

  async removeFromCollection(cardUuid: string, userId = 'default') {
    return db.run('DELETE FROM collections WHERE card_uuid = ? AND user_id = ?', [cardUuid, userId]);
  },

  async getCollectionValue(userId = 'default') {
    const result = await db.get(`
      SELECT 
        SUM(col.quantity * COALESCE(ph.price_usd, 0)) as total_value,
        COUNT(*) as card_count
      FROM collections col
      LEFT JOIN (
        SELECT DISTINCT card_uuid, 
               FIRST_VALUE(price_usd) OVER (PARTITION BY card_uuid ORDER BY date DESC) as price_usd
        FROM price_history
      ) ph ON col.card_uuid = ph.card_uuid
      WHERE col.user_id = ?
    `, [userId]);
    
    return result;
  }
};

// Snapshot operations
export const SnapshotOperations = {
  async createSnapshot(date?: string) {
    const snapshotDate = date || new Date().toISOString().split('T')[0];
    
    // Get current collection value
    const valueData = await CollectionOperations.getCollectionValue();
    const collectionData = await CollectionOperations.getUserCollection();
    
    const sql = `
      INSERT OR REPLACE INTO price_snapshots 
      (snapshot_date, total_value, card_count, collection_data)
      VALUES (?, ?, ?, ?)
    `;
    
    return db.run(sql, [
      snapshotDate,
      valueData?.total_value || 0,
      valueData?.card_count || 0,
      JSON.stringify(collectionData)
    ]);
  },

  async getSnapshots(limit = 30) {
    return db.all(`
      SELECT * FROM price_snapshots 
      ORDER BY snapshot_date DESC 
      LIMIT ?
    `, [limit]);
  },

  async getSnapshotTrend(days = 30) {
    return db.all(`
      SELECT 
        snapshot_date,
        total_value,
        card_count,
        total_value - LAG(total_value) OVER (ORDER BY snapshot_date) as value_change
      FROM price_snapshots 
      WHERE snapshot_date >= date('now', '-${days} days')
      ORDER BY snapshot_date
    `);
  }
};

// Import logging operations
export const ImportLogOperations = {
  async createImportLog(operationType: string, metadata: unknown = {}) {
    const sql = `
      INSERT INTO import_logs 
      (operation_type, status, metadata, started_at)
      VALUES (?, 'in_progress', ?, CURRENT_TIMESTAMP)
    `;
    
    const result = await db.run(sql, [operationType, JSON.stringify(metadata)]);
    return result.lastID;
  },

  async updateImportLog(logId: number, status: string, recordsProcessed = 0, errorMessage?: string) {
    const sql = `
      UPDATE import_logs 
      SET status = ?, records_processed = ?, error_message = ?, completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    return db.run(sql, [status, recordsProcessed, errorMessage, logId]);
  },

  async getImportLogs(limit = 50) {
    return db.all(`
      SELECT * FROM import_logs 
      ORDER BY created_at DESC 
      LIMIT ?
    `, [limit]);
  }
};

// Database health and maintenance
export const MaintenanceOperations = {
  async getTableSizes() {
    const tables = ['cards', 'price_history', 'collections', 'price_snapshots', 'import_logs'];
    const sizes = [];
    
    for (const table of tables) {
      const result = await db.get(`SELECT COUNT(*) as count FROM ${table}`);
      sizes.push({ table, count: result?.count || 0 });
    }
    
    return sizes;
  },

  async vacuum() {
    return db.run('VACUUM');
  },

  async analyze() {
    return db.run('ANALYZE');
  },

  async getDatabaseInfo() {
    const [tableInfo, dateRange, collectionValue] = await Promise.all([
      this.getTableSizes(),
      PriceOperations.getDateRange(),
      CollectionOperations.getCollectionValue()
    ]);

    return {
      tables: tableInfo,
      priceData: dateRange,
      collection: collectionValue,
      timestamp: new Date().toISOString()
    };
  }
};

// Initialize database on import
// Wrap initialization in try-catch to prevent startup failures
(async () => {
  try {
    await db.initialize();
  } catch (error) {
    console.warn('Database initialization warning:', error instanceof Error ? error.message : String(error));
  }
})();

// Export the database instance for advanced operations
export { db as database };

// Default export with all operations
export default {
  Cards: CardOperations,
  Prices: PriceOperations,
  Collection: CollectionOperations,
  Snapshots: SnapshotOperations,
  ImportLogs: ImportLogOperations,
  Maintenance: MaintenanceOperations,
  database: db
};
