/**
 * Database initialization and setup utility
 */

import db from './database/connection';
import { runMigrations, getMigrationStatus } from './database/migrations';
import { ensureDirectories } from './config';

/**
 * Initialize database and run migrations
 */
export async function initializeDatabase(): Promise<{
  connected: boolean;
  migrationsApplied: number;
  migrationStatus: any;
}> {
  try {
    console.log('Initializing database...');

    // Ensure required directories exist
    await ensureDirectories();

    // Connect to database
    await db.connect();
    console.log(`Database connected (${db.getType()})`);

    // Run migrations
    await runMigrations();

    // Get migration status
    const migrationStatus = await getMigrationStatus();
    
    console.log('Database initialization complete');
    console.log(`Applied migrations: ${migrationStatus.applied.length}`);
    console.log(`Pending migrations: ${migrationStatus.pending.length}`);

    return {
      connected: db.isConnected(),
      migrationsApplied: migrationStatus.applied.length,
      migrationStatus
    };

  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

/**
 * Check database health and status
 */
export async function checkDatabaseHealth(): Promise<{
  connected: boolean;
  type: string;
  migrations: any;
  tableStatus: Record<string, boolean>;
}> {
  try {
    const connected = db.isConnected();
    if (!connected) {
      await db.connect();
    }

    const type = db.getType();
    const migrations = await getMigrationStatus();

    // Check if core tables exist
    const tableChecks = [
      'cards',
      'price_history', 
      'card_sets',
      'import_logs'
    ];

    const tableStatus: Record<string, boolean> = {};
    
    for (const table of tableChecks) {
      try {
        await db.query(`SELECT 1 FROM ${table} LIMIT 1`);
        tableStatus[table] = true;
      } catch (error) {
        tableStatus[table] = false;
      }
    }

    return {
      connected: db.isConnected(),
      type,
      migrations,
      tableStatus
    };

  } catch (error) {
    console.error('Database health check failed:', error);
    throw error;
  }
}

/**
 * Reset database (development only)
 */
export async function resetDatabase(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Database reset is not allowed in production');
  }

  try {
    console.log('Resetting database...');

    // Connect if not connected
    if (!db.isConnected()) {
      await db.connect();
    }

    // Drop all tables in reverse dependency order
    const dropTables = [
      'DROP VIEW IF EXISTS cards_with_prices',
      'DROP VIEW IF EXISTS current_prices',
      'DROP TABLE IF EXISTS price_history',
      'DROP TABLE IF EXISTS import_logs',
      'DROP TABLE IF EXISTS cards',
      'DROP TABLE IF EXISTS card_sets',
      'DROP TABLE IF EXISTS migrations'
    ];

    for (const dropSQL of dropTables) {
      try {
        await db.query(dropSQL);
      } catch (error) {
        // Ignore errors for non-existent tables
        console.warn(`Drop table warning: ${error}`);
      }
    }

    console.log('Database reset complete');

  } catch (error) {
    console.error('Database reset failed:', error);
    throw error;
  }
}

export default {
  initializeDatabase,
  checkDatabaseHealth,
  resetDatabase
};