/**
 * Price History model - maintains compatibility with MTGCardPrices and ProcessedCardPrice interfaces
 */

import db from '../connection';
import type { MTGCardPrices, ProcessedCardPrice } from '../../../types/mtg';
import type { PriceHistoryRow } from '../types';

class PriceHistoryModel {
  /**
   * Add price data for a card
   */
  async addPrice(
    cardUuid: string, 
    date: Date, 
    price: number, 
    source: string = 'tcgplayer', 
    variant: string = 'normal'
  ): Promise<void> {
    const sql = `
      INSERT INTO price_history (card_uuid, price_date, price, source, variant)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(card_uuid, price_date, source, variant) 
      DO UPDATE SET price = excluded.price
    `;

    await db.query(sql, [cardUuid, date.toISOString().split('T')[0], price, source, variant]);
  }

  /**
   * Add batch price data
   */
  async addPriceBatch(priceData: {
    cardUuid: string;
    date: Date;
    price: number;
    source?: string;
    variant?: string;
  }[]): Promise<void> {
    if (priceData.length === 0) return;

    const sql = `
      INSERT INTO price_history (card_uuid, price_date, price, source, variant)
      VALUES (?, ?, ?, ?, ?)
    `;

    for (const price of priceData) {
      try {
        await db.query(sql, [
          price.cardUuid,
          price.date.toISOString().split('T')[0],
          price.price,
          price.source || 'tcgplayer',
          price.variant || 'normal'
        ]);
      } catch (error) {
        // Skip duplicates, continue with other prices
        if (!(error instanceof Error) || !error.message.includes('UNIQUE constraint')) {
          throw error;
        }
      }
    }
  }

  /**
   * Process MTGJSON price data and store it
   */
  async processMTGJSONPrices(cardUuid: string, prices: MTGCardPrices): Promise<void> {
    const priceEntries: {
      cardUuid: string;
      date: Date;
      price: number;
      source: string;
      variant: string;
    }[] = [];

    // Process paper prices
    if (prices.paper?.tcgplayer?.retail) {
      // Normal prices
      if (prices.paper.tcgplayer.retail.normal) {
        for (const [dateStr, price] of Object.entries(prices.paper.tcgplayer.retail.normal)) {
          priceEntries.push({
            cardUuid,
            date: new Date(dateStr),
            price,
            source: 'tcgplayer',
            variant: 'normal'
          });
        }
      }

      // Foil prices
      if (prices.paper.tcgplayer.retail.foil) {
        for (const [dateStr, price] of Object.entries(prices.paper.tcgplayer.retail.foil)) {
          priceEntries.push({
            cardUuid,
            date: new Date(dateStr),
            price,
            source: 'tcgplayer',
            variant: 'foil'
          });
        }
      }
    }

    // Process Card Kingdom prices
    if (prices.paper?.cardkingdom?.retail) {
      // Normal prices
      if (prices.paper.cardkingdom.retail.normal) {
        for (const [dateStr, price] of Object.entries(prices.paper.cardkingdom.retail.normal)) {
          priceEntries.push({
            cardUuid,
            date: new Date(dateStr),
            price,
            source: 'cardkingdom',
            variant: 'normal'
          });
        }
      }

      // Foil prices
      if (prices.paper.cardkingdom.retail.foil) {
        for (const [dateStr, price] of Object.entries(prices.paper.cardkingdom.retail.foil)) {
          priceEntries.push({
            cardUuid,
            date: new Date(dateStr),
            price,
            source: 'cardkingdom',
            variant: 'foil'
          });
        }
      }
    }

    // Process MTGO prices
    if (prices.mtgo) {
      for (const [dateStr, price] of Object.entries(prices.mtgo)) {
        priceEntries.push({
          cardUuid,
          date: new Date(dateStr),
          price,
          source: 'mtgo',
          variant: 'normal'
        });
      }
    }

    // Process MTGO Foil prices
    if (prices.mtgoFoil) {
      for (const [dateStr, price] of Object.entries(prices.mtgoFoil)) {
        priceEntries.push({
          cardUuid,
          date: new Date(dateStr),
          price,
          source: 'mtgo',
          variant: 'foil'
        });
      }
    }

    await this.addPriceBatch(priceEntries);
  }

  /**
   * Get price history for a card
   */
  async getPriceHistory(
    cardUuid: string, 
    source: string = 'tcgplayer', 
    variant: string = 'normal',
    days?: number
  ): Promise<Record<string, number>> {
    let sql = `
      SELECT price_date, price 
      FROM price_history 
      WHERE card_uuid = ? AND source = ? AND variant = ?
    `;
    
    const params = [cardUuid, source, variant];

    if (days) {
      sql += ` AND price_date >= DATE('now', '-${days} days')`;
    }

    sql += ' ORDER BY price_date';

    const result = await db.query(sql, params);
    
    const priceHistory: Record<string, number> = {};
    for (const row of result) {
      const date = new Date(row.price_date).toISOString().split('T')[0];
      priceHistory[date] = row.price;
    }

    return priceHistory;
  }

  /**
   * Get current price for a card
   */
  async getCurrentPrice(
    cardUuid: string, 
    source: string = 'tcgplayer', 
    variant: string = 'normal'
  ): Promise<number | null> {
    const sql = `
      SELECT price 
      FROM price_history 
      WHERE card_uuid = ? AND source = ? AND variant = ?
      ORDER BY price_date DESC 
      LIMIT 1
    `;

    const result = await db.query(sql, [cardUuid, source, variant]);
    return result.length > 0 ? result[0].price : null;
  }

  /**
   * Get processed card prices (compatible with ProcessedCardPrice interface)
   */
  async getProcessedCardPrices(
    cardUuids: string[], 
    source: string = 'tcgplayer', 
    variant: string = 'normal'
  ): Promise<ProcessedCardPrice[]> {
    if (cardUuids.length === 0) return [];

    const placeholders = cardUuids.map(() => '?').join(',');
    const sql = `
      SELECT card_uuid, price_date, price 
      FROM price_history 
      WHERE card_uuid IN (${placeholders}) AND source = ? AND variant = ?
      ORDER BY card_uuid, price_date
    `;

    const result = await db.query(sql, [...cardUuids, source, variant]);

    // Group by card UUID
    const pricesByCard: Record<string, Record<string, number>> = {};
    
    for (const row of result) {
      if (!pricesByCard[row.card_uuid]) {
        pricesByCard[row.card_uuid] = {};
      }
      const date = new Date(row.price_date).toISOString().split('T')[0];
      pricesByCard[row.card_uuid][date] = row.price;
    }

    // Convert to ProcessedCardPrice format
    return Object.entries(pricesByCard).map(([uuid, prices]) => ({
      uuid,
      prices
    }));
  }

  /**
   * Get latest prices for multiple cards
   */
  async getLatestPrices(
    cardUuids: string[], 
    source: string = 'tcgplayer', 
    variant: string = 'normal'
  ): Promise<Record<string, number>> {
    if (cardUuids.length === 0) return {};

    const placeholders = cardUuids.map(() => '?').join(',');
    const sql = `
      SELECT p1.card_uuid, p1.price
      FROM price_history p1
      INNER JOIN (
        SELECT card_uuid, MAX(price_date) as max_date
        FROM price_history
        WHERE card_uuid IN (${placeholders}) AND source = ? AND variant = ?
        GROUP BY card_uuid
      ) p2 ON p1.card_uuid = p2.card_uuid AND p1.price_date = p2.max_date
      WHERE p1.source = ? AND p1.variant = ?
    `;

    const result = await db.query(sql, [...cardUuids, source, variant, source, variant]);
    
    const prices: Record<string, number> = {};
    for (const row of result) {
      prices[row.card_uuid] = row.price;
    }

    return prices;
  }

  /**
   * Get price statistics
   */
  async getPriceStats(): Promise<{
    totalPricePoints: number;
    uniqueCards: number;
    dateRange: { start: Date | null; end: Date | null };
    sources: string[];
  }> {
    const statsQueries = [
      'SELECT COUNT(*) as total FROM price_history',
      'SELECT COUNT(DISTINCT card_uuid) as unique_cards FROM price_history',
      'SELECT MIN(price_date) as start_date, MAX(price_date) as end_date FROM price_history',
      'SELECT DISTINCT source FROM price_history ORDER BY source'
    ];

    const [totalResult, uniqueResult, dateResult, sourceResult] = await Promise.all(
      statsQueries.map(query => db.query(query))
    );

    return {
      totalPricePoints: totalResult[0]?.total || 0,
      uniqueCards: uniqueResult[0]?.unique_cards || 0,
      dateRange: {
        start: dateResult[0]?.start_date ? new Date(dateResult[0].start_date) : null,
        end: dateResult[0]?.end_date ? new Date(dateResult[0].end_date) : null
      },
      sources: sourceResult.map(row => row.source)
    };
  }

  /**
   * Delete price history for a card
   */
  async deletePriceHistory(cardUuid: string): Promise<void> {
    await db.query('DELETE FROM price_history WHERE card_uuid = ?', [cardUuid]);
  }

  /**
   * Delete old price data beyond a certain date
   */
  async deleteOldPrices(cutoffDate: Date): Promise<number> {
    const result = await db.query(
      'DELETE FROM price_history WHERE price_date < ?', 
      [cutoffDate.toISOString().split('T')[0]]
    );
    
    return result[0]?.changes || 0;
  }
}

export default new PriceHistoryModel();