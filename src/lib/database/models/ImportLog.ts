/**
 * Import Log model - for tracking data imports
 */

import db from '../connection';
import type { ImportLogRow } from '../types';

interface ImportLog {
  id?: number;
  importType: string;
  status: 'started' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  recordsProcessed?: number;
  recordsFailed?: number;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

class ImportLogModel {
  /**
   * Start a new import process
   */
  async startImport(importType: string, metadata?: Record<string, any>): Promise<number> {
    const sql = `
      INSERT INTO import_logs (import_type, status, metadata)
      VALUES (?, 'started', ?)
    `;

    const result = await db.query(sql, [
      importType,
      metadata ? JSON.stringify(metadata) : null
    ]);

    return result[0]?.lastInsertRowid || result[0]?.id;
  }

  /**
   * Update import progress
   */
  async updateProgress(
    id: number,
    recordsProcessed: number,
    recordsFailed: number = 0
  ): Promise<void> {
    const sql = `
      UPDATE import_logs 
      SET records_processed = ?, records_failed = ?
      WHERE id = ?
    `;

    await db.query(sql, [recordsProcessed, recordsFailed, id]);
  }

  /**
   * Complete import successfully
   */
  async completeImport(
    id: number,
    recordsProcessed: number,
    recordsFailed: number = 0
  ): Promise<void> {
    const sql = `
      UPDATE import_logs 
      SET status = 'completed', 
          completed_at = CURRENT_TIMESTAMP,
          records_processed = ?,
          records_failed = ?
      WHERE id = ?
    `;

    await db.query(sql, [recordsProcessed, recordsFailed, id]);
  }

  /**
   * Fail import with error
   */
  async failImport(
    id: number,
    errorMessage: string,
    recordsProcessed: number = 0,
    recordsFailed: number = 0
  ): Promise<void> {
    const sql = `
      UPDATE import_logs 
      SET status = 'failed',
          completed_at = CURRENT_TIMESTAMP,
          error_message = ?,
          records_processed = ?,
          records_failed = ?
      WHERE id = ?
    `;

    await db.query(sql, [errorMessage, recordsProcessed, recordsFailed, id]);
  }

  /**
   * Get import by ID
   */
  async findById(id: number): Promise<ImportLog | null> {
    const sql = 'SELECT * FROM import_logs WHERE id = ?';
    const result = await db.query(sql, [id]);
    
    if (result.length === 0) {
      return null;
    }

    return this.mapRowToImportLog(result[0]);
  }

  /**
   * Get recent imports
   */
  async getRecent(limit: number = 50): Promise<ImportLog[]> {
    const sql = `
      SELECT * FROM import_logs 
      ORDER BY started_at DESC 
      LIMIT ?
    `;
    const result = await db.query(sql, [limit]);
    return result.map(row => this.mapRowToImportLog(row));
  }

  /**
   * Get imports by type
   */
  async getByType(importType: string, limit: number = 20): Promise<ImportLog[]> {
    const sql = `
      SELECT * FROM import_logs 
      WHERE import_type = ? 
      ORDER BY started_at DESC 
      LIMIT ?
    `;
    const result = await db.query(sql, [importType, limit]);
    return result.map(row => this.mapRowToImportLog(row));
  }

  /**
   * Get failed imports
   */
  async getFailed(limit: number = 20): Promise<ImportLog[]> {
    const sql = `
      SELECT * FROM import_logs 
      WHERE status = 'failed' 
      ORDER BY started_at DESC 
      LIMIT ?
    `;
    const result = await db.query(sql, [limit]);
    return result.map(row => this.mapRowToImportLog(row));
  }

  /**
   * Get running imports
   */
  async getRunning(): Promise<ImportLog[]> {
    const sql = `
      SELECT * FROM import_logs 
      WHERE status = 'started' 
      ORDER BY started_at DESC
    `;
    const result = await db.query(sql);
    return result.map(row => this.mapRowToImportLog(row));
  }

  /**
   * Get import statistics
   */
  async getStats(): Promise<{
    total: number;
    completed: number;
    failed: number;
    running: number;
    totalRecordsProcessed: number;
  }> {
    const queries = [
      'SELECT COUNT(*) as total FROM import_logs',
      "SELECT COUNT(*) as completed FROM import_logs WHERE status = 'completed'",
      "SELECT COUNT(*) as failed FROM import_logs WHERE status = 'failed'",
      "SELECT COUNT(*) as running FROM import_logs WHERE status = 'started'",
      'SELECT COALESCE(SUM(records_processed), 0) as total_records FROM import_logs'
    ];

    const [totalResult, completedResult, failedResult, runningResult, recordsResult] = 
      await Promise.all(queries.map(query => db.query(query)));

    return {
      total: totalResult[0]?.total || 0,
      completed: completedResult[0]?.completed || 0,
      failed: failedResult[0]?.failed || 0,
      running: runningResult[0]?.running || 0,
      totalRecordsProcessed: recordsResult[0]?.total_records || 0
    };
  }

  /**
   * Clean up old import logs
   */
  async cleanup(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await db.query(
      'DELETE FROM import_logs WHERE started_at < ?',
      [cutoffDate.toISOString()]
    );

    return result[0]?.changes || 0;
  }

  /**
   * Map database row to ImportLog interface
   */
  private mapRowToImportLog(row: ImportLogRow): ImportLog {
    return {
      id: row.id,
      importType: row.import_type,
      status: row.status as 'started' | 'completed' | 'failed',
      startedAt: row.started_at,
      completedAt: row.completed_at || undefined,
      recordsProcessed: row.records_processed || undefined,
      recordsFailed: row.records_failed || undefined,
      errorMessage: row.error_message || undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined
    };
  }
}

export default new ImportLogModel();