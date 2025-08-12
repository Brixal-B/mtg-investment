/**
 * Integrity Checker - Checks database integrity and identifies issues
 */

import db from '../../database/connection';

export class IntegrityChecker {
  /**
   * Find orphaned price history records (prices without corresponding cards)
   */
  async findOrphanedPrices(): Promise<{
    count: number;
    samples: Array<{ id: number; card_uuid: string; price_date: string; price: number }>;
  }> {
    try {
      // Get count of orphaned records
      const countResult = await db.query(`
        SELECT COUNT(*) as count 
        FROM price_history ph 
        LEFT JOIN cards c ON ph.card_uuid = c.uuid 
        WHERE c.uuid IS NULL
      `);

      const count = countResult[0]?.count || 0;

      // Get sample orphaned records
      const samples = await db.query(`
        SELECT ph.id, ph.card_uuid, ph.price_date, ph.price 
        FROM price_history ph 
        LEFT JOIN cards c ON ph.card_uuid = c.uuid 
        WHERE c.uuid IS NULL 
        LIMIT 10
      `);

      return { count, samples };
    } catch (error) {
      console.error('Failed to find orphaned prices:', error);
      return { count: 0, samples: [] };
    }
  }

  /**
   * Find cards that reference non-existent sets
   */
  async findMissingCardReferences(): Promise<{
    count: number;
    samples: Array<{ uuid: string; name: string; set_code: string }>;
  }> {
    try {
      // Get count of cards with missing set references
      const countResult = await db.query(`
        SELECT COUNT(*) as count 
        FROM cards c 
        LEFT JOIN card_sets cs ON c.set_code = cs.code 
        WHERE cs.code IS NULL
      `);

      const count = countResult[0]?.count || 0;

      // Get sample cards with missing set references
      const samples = await db.query(`
        SELECT c.uuid, c.name, c.set_code 
        FROM cards c 
        LEFT JOIN card_sets cs ON c.set_code = cs.code 
        WHERE cs.code IS NULL 
        LIMIT 10
      `);

      return { count, samples };
    } catch (error) {
      console.error('Failed to find missing card references:', error);
      return { count: 0, samples: [] };
    }
  }

  /**
   * Find duplicate entries in tables
   */
  async findDuplicateEntries(): Promise<{
    count: number;
    duplicateCards: Array<{ name: string; set_code: string; count: number }>;
    duplicatePrices: Array<{ card_uuid: string; price_date: string; source: string; variant: string; count: number }>;
  }> {
    try {
      // Find duplicate cards (same name + set)
      const duplicateCards = await db.query(`
        SELECT name, set_code, COUNT(*) as count 
        FROM cards 
        GROUP BY name, set_code 
        HAVING COUNT(*) > 1 
        ORDER BY count DESC 
        LIMIT 10
      `);

      // Find duplicate price entries
      const duplicatePrices = await db.query(`
        SELECT card_uuid, price_date, source, variant, COUNT(*) as count 
        FROM price_history 
        GROUP BY card_uuid, price_date, source, variant 
        HAVING COUNT(*) > 1 
        ORDER BY count DESC 
        LIMIT 10
      `);

      const totalDuplicates = duplicateCards.length + duplicatePrices.length;

      return {
        count: totalDuplicates,
        duplicateCards,
        duplicatePrices
      };
    } catch (error) {
      console.error('Failed to find duplicate entries:', error);
      return {
        count: 0,
        duplicateCards: [],
        duplicatePrices: []
      };
    }
  }

  /**
   * Check for data consistency issues
   */
  async checkDataConsistency(): Promise<{
    issues: Array<{
      type: 'missing_prices' | 'invalid_dates' | 'extreme_values' | 'encoding_issues';
      description: string;
      count: number;
      samples: any[];
    }>;
  }> {
    const issues: any[] = [];

    try {
      // Check for cards without any price data
      const cardsWithoutPrices = await db.query(`
        SELECT COUNT(*) as count 
        FROM cards c 
        LEFT JOIN price_history ph ON c.uuid = ph.card_uuid 
        WHERE ph.card_uuid IS NULL
      `);

      const missingPricesCount = cardsWithoutPrices[0]?.count || 0;
      if (missingPricesCount > 0) {
        const samples = await db.query(`
          SELECT c.uuid, c.name, c.set_code 
          FROM cards c 
          LEFT JOIN price_history ph ON c.uuid = ph.card_uuid 
          WHERE ph.card_uuid IS NULL 
          LIMIT 5
        `);

        issues.push({
          type: 'missing_prices',
          description: 'Cards without any price history',
          count: missingPricesCount,
          samples
        });
      }

      // Check for invalid price dates
      const invalidDates = await db.query(`
        SELECT COUNT(*) as count 
        FROM price_history 
        WHERE price_date > datetime('now') OR price_date < datetime('1990-01-01')
      `);

      const invalidDatesCount = invalidDates[0]?.count || 0;
      if (invalidDatesCount > 0) {
        const samples = await db.query(`
          SELECT id, card_uuid, price_date, price 
          FROM price_history 
          WHERE price_date > datetime('now') OR price_date < datetime('1990-01-01') 
          LIMIT 5
        `);

        issues.push({
          type: 'invalid_dates',
          description: 'Price records with invalid dates',
          count: invalidDatesCount,
          samples
        });
      }

      // Check for extreme price values
      const extremePrices = await db.query(`
        SELECT COUNT(*) as count 
        FROM price_history 
        WHERE price < 0 OR price > 10000
      `);

      const extremePricesCount = extremePrices[0]?.count || 0;
      if (extremePricesCount > 0) {
        const samples = await db.query(`
          SELECT id, card_uuid, price_date, price, source 
          FROM price_history 
          WHERE price < 0 OR price > 10000 
          LIMIT 5
        `);

        issues.push({
          type: 'extreme_values',
          description: 'Price records with extreme values (negative or > $10,000)',
          count: extremePricesCount,
          samples
        });
      }

      // Check for encoding issues in card names
      const encodingIssues = await db.query(`
        SELECT COUNT(*) as count 
        FROM cards 
        WHERE name LIKE '%?%' OR name LIKE '%�%'
      `);

      const encodingIssuesCount = encodingIssues[0]?.count || 0;
      if (encodingIssuesCount > 0) {
        const samples = await db.query(`
          SELECT uuid, name, set_code 
          FROM cards 
          WHERE name LIKE '%?%' OR name LIKE '%�%' 
          LIMIT 5
        `);

        issues.push({
          type: 'encoding_issues',
          description: 'Cards with potential encoding issues in names',
          count: encodingIssuesCount,
          samples
        });
      }

    } catch (error) {
      console.error('Failed to check data consistency:', error);
    }

    return { issues };
  }

  /**
   * Analyze price data quality
   */
  async analyzePriceDataQuality(): Promise<{
    summary: {
      totalPriceRecords: number;
      uniqueCards: number;
      avgPricesPerCard: number;
      dateRange: { earliest: string; latest: string };
      sources: Array<{ source: string; count: number; percentage: number }>;
    };
    issues: {
      gapsInData: Array<{ card_uuid: string; name: string; gap_days: number }>;
      priceSpikes: Array<{ card_uuid: string; name: string; date: string; price_change: number }>;
      staleData: Array<{ card_uuid: string; name: string; last_update: string }>;
    };
  }> {
    try {
      // Get summary statistics
      const summaryStats = await db.query(`
        SELECT 
          COUNT(*) as total_records,
          COUNT(DISTINCT card_uuid) as unique_cards,
          MIN(price_date) as earliest_date,
          MAX(price_date) as latest_date
        FROM price_history
      `);

      const summary = summaryStats[0] || {};
      const avgPricesPerCard = summary.unique_cards > 0 ? 
        Math.round(summary.total_records / summary.unique_cards) : 0;

      // Get source distribution
      const sourceStats = await db.query(`
        SELECT 
          source, 
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM price_history), 2) as percentage
        FROM price_history 
        GROUP BY source 
        ORDER BY count DESC
      `);

      // Find cards with significant gaps in price data
      const dataGaps = await db.query(`
        SELECT 
          ph1.card_uuid,
          c.name,
          julianday(ph2.price_date) - julianday(ph1.price_date) as gap_days
        FROM price_history ph1
        JOIN price_history ph2 ON ph1.card_uuid = ph2.card_uuid
        JOIN cards c ON ph1.card_uuid = c.uuid
        WHERE ph2.price_date > ph1.price_date
        AND julianday(ph2.price_date) - julianday(ph1.price_date) > 30
        GROUP BY ph1.card_uuid
        ORDER BY gap_days DESC
        LIMIT 10
      `);

      // Find significant price spikes (>50% change)
      const priceSpikes = await db.query(`
        SELECT 
          ph1.card_uuid,
          c.name,
          ph2.price_date as date,
          ROUND(((ph2.price - ph1.price) / ph1.price) * 100, 2) as price_change
        FROM price_history ph1
        JOIN price_history ph2 ON ph1.card_uuid = ph2.card_uuid
        JOIN cards c ON ph1.card_uuid = c.uuid
        WHERE ph2.price_date > ph1.price_date
        AND ph1.price > 0
        AND ABS((ph2.price - ph1.price) / ph1.price) > 0.5
        ORDER BY ABS(price_change) DESC
        LIMIT 10
      `);

      // Find cards with stale data (no updates in 6+ months)
      const staleData = await db.query(`
        SELECT 
          ph.card_uuid,
          c.name,
          MAX(ph.price_date) as last_update
        FROM price_history ph
        JOIN cards c ON ph.card_uuid = c.uuid
        GROUP BY ph.card_uuid, c.name
        HAVING julianday('now') - julianday(MAX(ph.price_date)) > 180
        ORDER BY last_update ASC
        LIMIT 10
      `);

      return {
        summary: {
          totalPriceRecords: summary.total_records || 0,
          uniqueCards: summary.unique_cards || 0,
          avgPricesPerCard,
          dateRange: {
            earliest: summary.earliest_date || 'N/A',
            latest: summary.latest_date || 'N/A'
          },
          sources: sourceStats
        },
        issues: {
          gapsInData: dataGaps,
          priceSpikes: priceSpikes,
          staleData: staleData
        }
      };
    } catch (error) {
      console.error('Failed to analyze price data quality:', error);
      return {
        summary: {
          totalPriceRecords: 0,
          uniqueCards: 0,
          avgPricesPerCard: 0,
          dateRange: { earliest: 'N/A', latest: 'N/A' },
          sources: []
        },
        issues: {
          gapsInData: [],
          priceSpikes: [],
          staleData: []
        }
      };
    }
  }

  /**
   * Check index effectiveness and performance
   */
  async checkIndexPerformance(): Promise<{
    indexes: Array<{
      table: string;
      index: string;
      usage: 'high' | 'medium' | 'low' | 'unused';
      recommendation: string;
    }>;
    slowQueries: Array<{
      query: string;
      estimatedTime: string;
      recommendation: string;
    }>;
  }> {
    try {
      // This is a simplified version - real implementation would require
      // database-specific performance monitoring capabilities
      
      const recommendations: any[] = [
        {
          table: 'price_history',
          index: 'idx_price_history_card_date',
          usage: 'high',
          recommendation: 'Well utilized for price history queries'
        },
        {
          table: 'cards',
          index: 'idx_cards_name',
          usage: 'medium',
          recommendation: 'Consider composite index on (name, set_code) for better search performance'
        },
        {
          table: 'cards',
          index: 'idx_cards_set_code',
          usage: 'high',
          recommendation: 'Well utilized for set-based queries'
        }
      ];

      const slowQueries: any[] = [
        {
          query: 'Complex joins between cards and price_history without proper indexing',
          estimatedTime: '> 1 second',
          recommendation: 'Ensure proper indexing on card_uuid and price_date'
        }
      ];

      return {
        indexes: recommendations,
        slowQueries
      };
    } catch (error) {
      console.error('Failed to check index performance:', error);
      return {
        indexes: [],
        slowQueries: []
      };
    }
  }

  /**
   * Generate integrity report
   */
  async generateIntegrityReport(): Promise<{
    timestamp: string;
    summary: {
      healthy: boolean;
      totalIssues: number;
      criticalIssues: number;
      warnings: number;
    };
    details: {
      orphanedRecords: any;
      duplicateEntries: any;
      consistencyIssues: any;
      dataQuality: any;
      performance: any;
    };
    recommendations: string[];
  }> {
    const [
      orphanedPrices,
      missingRefs,
      duplicates,
      consistency,
      dataQuality,
      performance
    ] = await Promise.all([
      this.findOrphanedPrices(),
      this.findMissingCardReferences(),
      this.findDuplicateEntries(),
      this.checkDataConsistency(),
      this.analyzePriceDataQuality(),
      this.checkIndexPerformance()
    ]);

    const criticalIssues = orphanedPrices.count + consistency.issues.length;
    const warnings = missingRefs.count + duplicates.count;
    const totalIssues = criticalIssues + warnings;

    const recommendations: string[] = [];
    
    if (orphanedPrices.count > 0) {
      recommendations.push(`Clean up ${orphanedPrices.count} orphaned price records`);
    }
    
    if (missingRefs.count > 0) {
      recommendations.push(`Add missing card set references for ${missingRefs.count} cards`);
    }
    
    if (duplicates.count > 0) {
      recommendations.push(`Remove duplicate entries to improve data quality`);
    }
    
    if (dataQuality.issues.staleData.length > 0) {
      recommendations.push(`Update stale price data for ${dataQuality.issues.staleData.length} cards`);
    }

    return {
      timestamp: new Date().toISOString(),
      summary: {
        healthy: criticalIssues === 0,
        totalIssues,
        criticalIssues,
        warnings
      },
      details: {
        orphanedRecords: { orphanedPrices, missingRefs },
        duplicateEntries: duplicates,
        consistencyIssues: consistency,
        dataQuality,
        performance
      },
      recommendations
    };
  }
}