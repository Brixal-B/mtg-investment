/**
 * 🗄️ Test Database Schema Setup
 * 
 * Provides schema initialization for test databases to ensure
 * integration tests have proper table structure.
 */

import Database from './database';

export class TestDatabaseSetup {
  /**
   * Initialize test database with complete schema
   */
  static async initializeTestSchema(): Promise<void> {
    const db = Database.database;
    await db.initialize();

    const schemas = [
      // Cards table - stores MTG card information
      `CREATE TABLE IF NOT EXISTS cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        set_code TEXT,
        set_name TEXT,
        collector_number TEXT,
        rarity TEXT,
        mana_cost TEXT,
        cmc INTEGER,
        type_line TEXT,
        oracle_text TEXT,
        power TEXT,
        toughness TEXT,
        colors TEXT, -- JSON array
        color_identity TEXT, -- JSON array
        legalities TEXT, -- JSON object
        image_uris TEXT, -- JSON object
        scryfall_id TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Price history table - stores historical price data
      `CREATE TABLE IF NOT EXISTS price_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        card_uuid TEXT NOT NULL,
        date DATE NOT NULL,
        price_usd DECIMAL(10,2),
        price_usd_foil DECIMAL(10,2),
        price_eur DECIMAL(10,2),
        price_tix DECIMAL(10,2),
        source TEXT NOT NULL, -- 'scryfall', 'mtgjson', 'manual'
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (card_uuid) REFERENCES cards(uuid),
        UNIQUE(card_uuid, date, source)
      )`,
      
      // User collections - stores user card inventories
      `CREATE TABLE IF NOT EXISTS collections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT DEFAULT 'default',
        card_uuid TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        condition TEXT DEFAULT 'near_mint',
        foil BOOLEAN DEFAULT FALSE,
        purchase_price DECIMAL(10,2),
        purchase_date DATE,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (card_uuid) REFERENCES cards(uuid)
      )`,
      
      // Price snapshots - stores periodic portfolio valuations
      `CREATE TABLE IF NOT EXISTS price_snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        snapshot_date DATE NOT NULL,
        total_value DECIMAL(12,2) NOT NULL,
        card_count INTEGER NOT NULL,
        collection_data TEXT NOT NULL, -- JSON array of card valuations
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(snapshot_date)
      )`,
      
      // Import logs - tracks data import operations
      `CREATE TABLE IF NOT EXISTS import_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        operation_type TEXT NOT NULL,
        status TEXT NOT NULL,
        records_processed INTEGER DEFAULT 0,
        error_message TEXT,
        metadata TEXT, -- JSON object with operation details
        started_at DATETIME NOT NULL,
        completed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    // Create all tables
    for (const schema of schemas) {
      await db.run(schema);
    }

    // Create indexes for better query performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_cards_uuid ON cards(uuid)',
      'CREATE INDEX IF NOT EXISTS idx_cards_name ON cards(name)',
      'CREATE INDEX IF NOT EXISTS idx_cards_set ON cards(set_code)',
      'CREATE INDEX IF NOT EXISTS idx_price_history_card_date ON price_history(card_uuid, date)',
      'CREATE INDEX IF NOT EXISTS idx_price_history_date ON price_history(date)',
      'CREATE INDEX IF NOT EXISTS idx_collections_card ON collections(card_uuid)',
      'CREATE INDEX IF NOT EXISTS idx_collections_user ON collections(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_snapshots_date ON price_snapshots(snapshot_date)'
    ];

    for (const index of indexes) {
      await db.run(index);
    }

    console.log('✅ Test database schema initialized');
  }

  /**
   * Insert test data for integration tests
   */
  static async insertTestData(): Promise<void> {
    const db = Database.database;
    
    // Insert sample cards for testing
    const testCards = [
      {
        uuid: 'test-card-1',
        name: 'Lightning Bolt',
        set_code: 'LEA',
        set_name: 'Limited Edition Alpha',
        rarity: 'common',
        scryfall_id: 'test-scryfall-1'
      },
      {
        uuid: 'test-card-2',
        name: 'Black Lotus',
        set_code: 'LEA',
        set_name: 'Limited Edition Alpha', 
        rarity: 'rare',
        scryfall_id: 'test-scryfall-2'
      },
      {
        uuid: 'test-integration-uuid',
        name: 'Test Card',
        set_code: 'TEST',
        set_name: 'Test Set',
        rarity: 'common',
        scryfall_id: 'test-scryfall-3'
      }
    ];

    for (const card of testCards) {
      try {
        await db.run(
          `INSERT OR REPLACE INTO cards (uuid, name, set_code, set_name, rarity, scryfall_id)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [card.uuid, card.name, card.set_code, card.set_name, card.rarity, card.scryfall_id]
        );
      } catch (error) {
        // Ignore duplicate key errors for idempotent test setup
        if (error instanceof Error && !error.message.includes('UNIQUE constraint failed')) {
          throw error;
        }
      }
    }

    // Insert sample price history
    const testPrices = [
      {
        card_uuid: 'test-card-1',
        date: '2024-01-01',
        price_usd: 1.50,
        source: 'test'
      },
      {
        card_uuid: 'test-card-2',
        date: '2024-01-01',
        price_usd: 25000.00,
        source: 'test'
      }
    ];

    for (const price of testPrices) {
      try {
        await db.run(
          `INSERT OR REPLACE INTO price_history (card_uuid, date, price_usd, source)
           VALUES (?, ?, ?, ?)`,
          [price.card_uuid, price.date, price.price_usd, price.source]
        );
      } catch (error) {
        // Ignore duplicate key errors
        if (error instanceof Error && !error.message.includes('UNIQUE constraint failed')) {
          throw error;
        }
      }
    }

    console.log('✅ Test data inserted');
  }

  /**
   * Clean up test database
   */
  static async cleanup(): Promise<void> {
    const db = Database.database;
    
    // Clear test data but keep schema
    const tables = ['collections', 'price_history', 'cards', 'price_snapshots', 'import_logs'];
    
    for (const table of tables) {
      await db.run(`DELETE FROM ${table}`);
    }
    
    console.log('✅ Test database cleaned');
  }
}
