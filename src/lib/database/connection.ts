/**
 * Database connection management
 * Supports SQLite for development and PostgreSQL for production
 */

import Database from 'better-sqlite3';
import { Pool, Client } from 'pg';
import { DATABASE } from '../config';
import type { DatabaseConfig } from './types';

class DatabaseConnection {
  private sqliteDb?: Database.Database;
  private pgPool?: Pool;
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig = DATABASE) {
    this.config = config;
  }

  /**
   * Initialize database connection
   */
  async connect(): Promise<void> {
    if (this.config.type === 'sqlite') {
      await this.connectSQLite();
    } else {
      await this.connectPostgreSQL();
    }
  }

  /**
   * Initialize SQLite connection
   */
  private async connectSQLite(): Promise<void> {
    if (!this.config.filename) {
      throw new Error('SQLite filename is required');
    }

    try {
      this.sqliteDb = new Database(this.config.filename);
      this.sqliteDb.pragma('journal_mode = WAL');
      this.sqliteDb.pragma('foreign_keys = ON');
      this.sqliteDb.pragma('synchronous = NORMAL');
      
      console.log(`SQLite database connected: ${this.config.filename}`);
    } catch (error) {
      console.error('Failed to connect to SQLite:', error);
      throw error;
    }
  }

  /**
   * Initialize PostgreSQL connection
   */
  private async connectPostgreSQL(): Promise<void> {
    const poolConfig = {
      connectionString: this.config.connectionString,
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      user: this.config.username,
      password: this.config.password,
      ssl: this.config.ssl ? { rejectUnauthorized: false } : false,
      min: this.config.poolMin || 2,
      max: this.config.poolMax || 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

    try {
      this.pgPool = new Pool(poolConfig);
      
      // Test connection
      const client = await this.pgPool.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      console.log(`PostgreSQL database connected: ${this.config.database}`);
    } catch (error) {
      console.error('Failed to connect to PostgreSQL:', error);
      throw error;
    }
  }

  /**
   * Execute a query (unified interface for both databases)
   */
  async query(sql: string, params: any[] = []): Promise<any[]> {
    if (this.config.type === 'sqlite') {
      return this.querySQLite(sql, params);
    } else {
      return this.queryPostgreSQL(sql, params);
    }
  }

  /**
   * Execute SQLite query
   */
  private querySQLite(sql: string, params: any[] = []): any[] {
    if (!this.sqliteDb) {
      throw new Error('SQLite database not connected');
    }

    try {
      if (sql.trim().toLowerCase().startsWith('select') || sql.trim().toLowerCase().startsWith('with')) {
        const stmt = this.sqliteDb.prepare(sql);
        return stmt.all(params);
      } else {
        const stmt = this.sqliteDb.prepare(sql);
        const result = stmt.run(params);
        return [{ changes: result.changes, lastInsertRowid: result.lastInsertRowid }];
      }
    } catch (error) {
      console.error('SQLite query error:', error);
      throw error;
    }
  }

  /**
   * Execute PostgreSQL query
   */
  private async queryPostgreSQL(sql: string, params: any[] = []): Promise<any[]> {
    if (!this.pgPool) {
      throw new Error('PostgreSQL database not connected');
    }

    const client = await this.pgPool.connect();
    try {
      const result = await client.query(sql, params);
      return result.rows;
    } catch (error) {
      console.error('PostgreSQL query error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Begin transaction
   */
  async beginTransaction(): Promise<any> {
    if (this.config.type === 'sqlite') {
      return this.sqliteDb?.transaction(() => {});
    } else {
      const client = await this.pgPool?.connect();
      await client?.query('BEGIN');
      return client;
    }
  }

  /**
   * Commit transaction
   */
  async commitTransaction(transaction: any): Promise<void> {
    if (this.config.type === 'sqlite') {
      // SQLite transactions are handled by the transaction wrapper
      return;
    } else {
      await transaction.query('COMMIT');
      transaction.release();
    }
  }

  /**
   * Rollback transaction
   */
  async rollbackTransaction(transaction: any): Promise<void> {
    if (this.config.type === 'sqlite') {
      // SQLite transactions are handled by the transaction wrapper
      return;
    } else {
      await transaction.query('ROLLBACK');
      transaction.release();
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.sqliteDb) {
      this.sqliteDb.close();
      this.sqliteDb = undefined;
    }
    
    if (this.pgPool) {
      await this.pgPool.end();
      this.pgPool = undefined;
    }
  }

  /**
   * Check if database is connected
   */
  isConnected(): boolean {
    if (this.config.type === 'sqlite') {
      return !!this.sqliteDb;
    } else {
      return !!this.pgPool;
    }
  }

  /**
   * Get database type
   */
  getType(): 'sqlite' | 'postgresql' {
    return this.config.type;
  }
}

// Create singleton instance
const db = new DatabaseConnection();

export default db;