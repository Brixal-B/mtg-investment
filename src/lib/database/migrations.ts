/**
 * Database migration runner
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import db from './connection';

interface Migration {
  id: number;
  name: string;
  filename: string;
  sql: string;
}

/**
 * Load migration files
 */
async function loadMigrations(): Promise<Migration[]> {
  const migrationsDir = path.join(__dirname, 'migrations');
  const dbType = db.getType();
  const suffix = dbType === 'sqlite' ? '_sqlite.sql' : '_postgresql.sql';
  
  try {
    const files = await fs.readdir(migrationsDir);
    const migrationFiles = files
      .filter(file => file.endsWith(suffix))
      .sort();

    const migrations: Migration[] = [];
    
    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = await fs.readFile(filePath, 'utf-8');
      const match = file.match(/^(\d+)_(.+)_(sqlite|postgresql)\.sql$/);
      
      if (match) {
        migrations.push({
          id: parseInt(match[1]),
          name: match[2],
          filename: file,
          sql: sql.trim()
        });
      }
    }
    
    return migrations;
  } catch (error) {
    console.error('Failed to load migrations:', error);
    throw error;
  }
}

/**
 * Create migrations table if it doesn't exist
 */
async function ensureMigrationsTable(): Promise<void> {
  const createTableSQL = db.getType() === 'sqlite' 
    ? `CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        filename TEXT NOT NULL UNIQUE,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    : `CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        filename VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )`;

  await db.query(createTableSQL);
}

/**
 * Get applied migrations
 */
async function getAppliedMigrations(): Promise<string[]> {
  try {
    const result = await db.query('SELECT filename FROM migrations ORDER BY id');
    return result.map(row => row.filename);
  } catch (error) {
    // Table might not exist yet
    return [];
  }
}

/**
 * Apply a single migration
 */
async function applyMigration(migration: Migration): Promise<void> {
  console.log(`Applying migration: ${migration.filename}`);
  
  try {
    // Split SQL into individual statements and filter out empty ones
    const statements = migration.sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    // Execute each statement individually
    for (const statement of statements) {
      if (statement.trim()) {
        await db.query(statement + ';');
      }
    }

    // Record migration as applied
    await db.query(
      'INSERT INTO migrations (id, name, filename) VALUES (?, ?, ?)',
      [migration.id, migration.name, migration.filename]
    );

    console.log(`Migration applied successfully: ${migration.filename}`);
  } catch (error) {
    console.error(`Failed to apply migration ${migration.filename}:`, error);
    throw error;
  }
}

/**
 * Run all pending migrations
 */
export async function runMigrations(): Promise<void> {
  console.log('Starting database migrations...');

  try {
    // Ensure database is connected
    if (!db.isConnected()) {
      await db.connect();
    }

    // Ensure migrations table exists
    await ensureMigrationsTable();

    // Load available migrations
    const migrations = await loadMigrations();
    const appliedMigrations = await getAppliedMigrations();

    // Find pending migrations
    const pendingMigrations = migrations.filter(
      migration => !appliedMigrations.includes(migration.filename)
    );

    if (pendingMigrations.length === 0) {
      console.log('No pending migrations found.');
      return;
    }

    console.log(`Found ${pendingMigrations.length} pending migrations.`);

    // Apply each pending migration
    for (const migration of pendingMigrations) {
      await applyMigration(migration);
    }

    console.log('All migrations completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

/**
 * Check migration status
 */
export async function getMigrationStatus(): Promise<{
  applied: string[];
  pending: string[];
  total: number;
}> {
  try {
    if (!db.isConnected()) {
      await db.connect();
    }

    await ensureMigrationsTable();
    
    const migrations = await loadMigrations();
    const appliedMigrations = await getAppliedMigrations();
    
    const pendingMigrations = migrations
      .filter(migration => !appliedMigrations.includes(migration.filename))
      .map(migration => migration.filename);

    return {
      applied: appliedMigrations,
      pending: pendingMigrations,
      total: migrations.length
    };
  } catch (error) {
    console.error('Failed to get migration status:', error);
    throw error;
  }
}