/**
 * Performance optimization utilities for database operations
 */

import db from '../database/connection';

export class DatabaseOptimizer {
  private queryCache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private connectionPool: any[] = [];

  /**
   * Execute query with caching
   */
  async executeWithCache(
    sql: string, 
    params: any[] = [], 
    ttlSeconds: number = 300
  ): Promise<any> {
    const cacheKey = this.generateCacheKey(sql, params);
    const cached = this.queryCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < cached.ttl * 1000) {
      return cached.data;
    }

    const result = await db.query(sql, params);
    
    this.queryCache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
      ttl: ttlSeconds
    });

    return result;
  }

  /**
   * Clear cache for specific pattern or all
   */
  clearCache(pattern?: string): void {
    if (!pattern) {
      this.queryCache.clear();
      return;
    }

    for (const [key] of this.queryCache) {
      if (key.includes(pattern)) {
        this.queryCache.delete(key);
      }
    }
  }

  /**
   * Generate cache key for query and parameters
   */
  private generateCacheKey(sql: string, params: any[]): string {
    return `${sql}|${JSON.stringify(params)}`;
  }

  /**
   * Optimize common queries by pre-warming cache
   */
  async warmCache(): Promise<void> {
    const commonQueries = [
      // Pre-load card counts by set
      { 
        sql: 'SELECT set_code, COUNT(*) as count FROM cards GROUP BY set_code',
        params: [],
        ttl: 3600 // 1 hour
      },
      // Pre-load recent price statistics
      {
        sql: `SELECT source, COUNT(*) as count FROM price_history 
              WHERE price_date >= DATE('now', '-30 days') 
              GROUP BY source`,
        params: [],
        ttl: 1800 // 30 minutes
      },
      // Pre-load set information
      {
        sql: 'SELECT * FROM card_sets ORDER BY name',
        params: [],
        ttl: 3600 // 1 hour
      }
    ];

    await Promise.all(
      commonQueries.map(query => 
        this.executeWithCache(query.sql, query.params, query.ttl)
      )
    );
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    hitRate: number;
    memoryUsage: string;
  } {
    const size = this.queryCache.size;
    let totalSize = 0;
    
    for (const [key, value] of this.queryCache) {
      totalSize += key.length + JSON.stringify(value.data).length;
    }

    return {
      size,
      hitRate: 0, // Would need to track hits/misses for accurate calculation
      memoryUsage: `${(totalSize / 1024 / 1024).toFixed(2)} MB`
    };
  }

  /**
   * Cleanup expired cache entries
   */
  cleanupCache(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, value] of this.queryCache) {
      if (now - value.timestamp > value.ttl * 1000) {
        this.queryCache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }
}

/**
 * Query optimization recommendations
 */
export class QueryOptimizer {
  /**
   * Analyze query performance and suggest optimizations
   */
  async analyzeQuery(sql: string, params: any[] = []): Promise<{
    estimatedCost: string;
    recommendations: string[];
    indexSuggestions: string[];
  }> {
    const recommendations: string[] = [];
    const indexSuggestions: string[] = [];

    // Basic query analysis
    const sqlLower = sql.toLowerCase();

    // Check for full table scans
    if (sqlLower.includes('select *') && !sqlLower.includes('limit')) {
      recommendations.push('Consider adding LIMIT clause to prevent full table scan');
    }

    // Check for missing WHERE clauses on large tables
    if (sqlLower.includes('from cards') && !sqlLower.includes('where')) {
      recommendations.push('Consider adding WHERE clause when querying cards table');
    }

    if (sqlLower.includes('from price_history') && !sqlLower.includes('where')) {
      recommendations.push('Consider adding WHERE clause when querying price_history table');
    }

    // Check for potentially expensive operations
    if (sqlLower.includes('like %')) {
      recommendations.push('LIKE with leading wildcard can be expensive - consider full-text search');
    }

    if (sqlLower.includes('order by') && !sqlLower.includes('limit')) {
      recommendations.push('ORDER BY without LIMIT can be expensive on large datasets');
    }

    // Index suggestions based on query patterns
    if (sqlLower.includes('where card_uuid =')) {
      indexSuggestions.push('Ensure index exists on card_uuid column');
    }

    if (sqlLower.includes('where price_date >')) {
      indexSuggestions.push('Ensure index exists on price_date column');
    }

    if (sqlLower.includes('where set_code =')) {
      indexSuggestions.push('Ensure index exists on set_code column');
    }

    return {
      estimatedCost: 'Medium', // Simplified - would need EXPLAIN QUERY PLAN for accurate cost
      recommendations,
      indexSuggestions
    };
  }

  /**
   * Optimize price history queries for time-series operations
   */
  generateOptimizedPriceQuery(
    cardUuid?: string,
    dateRange?: { start: Date; end: Date },
    sources?: string[],
    limit: number = 1000
  ): { sql: string; params: any[] } {
    const conditions: string[] = [];
    const params: any[] = [];

    if (cardUuid) {
      conditions.push('card_uuid = ?');
      params.push(cardUuid);
    }

    if (dateRange) {
      conditions.push('price_date BETWEEN ? AND ?');
      params.push(
        dateRange.start.toISOString().split('T')[0],
        dateRange.end.toISOString().split('T')[0]
      );
    }

    if (sources && sources.length > 0) {
      conditions.push(`source IN (${sources.map(() => '?').join(', ')})`);
      params.push(...sources);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        ph.card_uuid,
        ph.price_date,
        ph.price,
        ph.source,
        ph.variant,
        c.name as card_name,
        c.set_code
      FROM price_history ph
      JOIN cards c ON ph.card_uuid = c.uuid
      ${whereClause}
      ORDER BY ph.price_date DESC, ph.card_uuid
      LIMIT ?
    `;

    params.push(limit);

    return { sql, params };
  }

  /**
   * Generate optimized card search query
   */
  generateOptimizedCardQuery(
    search?: string,
    setCode?: string,
    priceRange?: { min: number; max: number },
    limit: number = 100
  ): { sql: string; params: any[] } {
    const conditions: string[] = [];
    const params: any[] = [];

    if (search) {
      // Use LIKE with optimization for common patterns
      if (search.length <= 2) {
        conditions.push('c.name LIKE ?');
        params.push(`${search}%`); // Prefix search for short queries
      } else {
        conditions.push('c.name LIKE ?');
        params.push(`%${search}%`);
      }
    }

    if (setCode) {
      conditions.push('c.set_code = ?');
      params.push(setCode);
    }

    if (priceRange) {
      conditions.push('cwp.latest_price BETWEEN ? AND ?');
      params.push(priceRange.min, priceRange.max);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        c.*,
        cwp.latest_price,
        cwp.price_date,
        cwp.price_source,
        cwp.price_variant
      FROM cards c
      LEFT JOIN cards_with_prices cwp ON c.uuid = cwp.uuid
      ${whereClause}
      ORDER BY c.name
      LIMIT ?
    `;

    params.push(limit);

    return { sql, params };
  }
}

/**
 * Connection pool manager for better concurrency
 */
export class ConnectionManager {
  private activeConnections: number = 0;
  private maxConnections: number = 10;
  private waitingQueue: Array<{ resolve: Function; reject: Function }> = [];

  /**
   * Execute query with connection pooling
   */
  async executeWithPool<T>(operation: () => Promise<T>): Promise<T> {
    await this.acquireConnection();
    
    try {
      const result = await operation();
      return result;
    } finally {
      this.releaseConnection();
    }
  }

  /**
   * Acquire connection from pool
   */
  private async acquireConnection(): Promise<void> {
    if (this.activeConnections < this.maxConnections) {
      this.activeConnections++;
      return;
    }

    // Wait for available connection
    return new Promise((resolve, reject) => {
      this.waitingQueue.push({ resolve, reject });
    });
  }

  /**
   * Release connection back to pool
   */
  private releaseConnection(): void {
    this.activeConnections--;
    
    if (this.waitingQueue.length > 0) {
      const { resolve } = this.waitingQueue.shift()!;
      this.activeConnections++;
      resolve();
    }
  }

  /**
   * Get pool statistics
   */
  getPoolStats(): {
    active: number;
    max: number;
    waiting: number;
    utilization: number;
  } {
    return {
      active: this.activeConnections,
      max: this.maxConnections,
      waiting: this.waitingQueue.length,
      utilization: (this.activeConnections / this.maxConnections) * 100
    };
  }

  /**
   * Configure pool settings
   */
  configure(maxConnections: number): void {
    this.maxConnections = maxConnections;
  }
}

// Singleton instances
export const dbOptimizer = new DatabaseOptimizer();
export const queryOptimizer = new QueryOptimizer();
export const connectionManager = new ConnectionManager();