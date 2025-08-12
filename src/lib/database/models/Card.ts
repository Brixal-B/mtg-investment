/**
 * Card model - maintains compatibility with MTGCard interface
 */

import db from '../connection';
import type { MTGCard, CardWithPrice, CardFilter, CardSearchResult } from '../../../types/mtg';
import type { CardRow, CardWithPricesView } from '../types';

class CardModel {
  /**
   * Create a new card
   */
  async create(card: Omit<MTGCard, 'prices'>): Promise<void> {
    const sql = `
      INSERT INTO cards (
        uuid, name, set_code, set_name, rarity, type_line, 
        mana_cost, cmc, oracle_text, image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        name = excluded.name,
        set_code = excluded.set_code,
        set_name = excluded.set_name,
        rarity = excluded.rarity,
        type_line = excluded.type_line,
        mana_cost = excluded.mana_cost,
        cmc = excluded.cmc,
        oracle_text = excluded.oracle_text,
        image_url = excluded.image_url,
        updated_at = CURRENT_TIMESTAMP
    `;

    await db.query(sql, [
      card.uuid,
      card.name,
      card.setCode,
      card.setName,
      card.rarity || null,
      card.typeLine || null,
      card.manaCost || null,
      card.cmc || null,
      card.oracleText || null,
      card.imageUrl || null
    ]);
  }

  /**
   * Create multiple cards in batch
   */
  async createBatch(cards: Omit<MTGCard, 'prices'>[]): Promise<void> {
    if (cards.length === 0) return;

    const sql = `
      INSERT INTO cards (
        uuid, name, set_code, set_name, rarity, type_line, 
        mana_cost, cmc, oracle_text, image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    for (const card of cards) {
      try {
        await db.query(sql, [
          card.uuid,
          card.name,
          card.setCode,
          card.setName,
          card.rarity || null,
          card.typeLine || null,
          card.manaCost || null,
          card.cmc || null,
          card.oracleText || null,
          card.imageUrl || null
        ]);
      } catch (error) {
        // Skip duplicates, continue with other cards
        if (!(error instanceof Error) || !error.message.includes('UNIQUE constraint')) {
          throw error;
        }
      }
    }
  }

  /**
   * Find card by UUID
   */
  async findByUuid(uuid: string): Promise<MTGCard | null> {
    const sql = 'SELECT * FROM cards WHERE uuid = ?';
    const result = await db.query(sql, [uuid]);
    
    if (result.length === 0) {
      return null;
    }

    return this.mapRowToMTGCard(result[0]);
  }

  /**
   * Find cards by name (fuzzy search)
   */
  async findByName(name: string, limit: number = 50): Promise<MTGCard[]> {
    const sql = `
      SELECT * FROM cards 
      WHERE name LIKE ? 
      ORDER BY name 
      LIMIT ?
    `;
    
    const result = await db.query(sql, [`%${name}%`, limit]);
    return result.map(row => this.mapRowToMTGCard(row));
  }

  /**
   * Find cards by set
   */
  async findBySet(setCode: string, limit: number = 500): Promise<MTGCard[]> {
    const sql = `
      SELECT * FROM cards 
      WHERE set_code = ? 
      ORDER BY name 
      LIMIT ?
    `;
    
    const result = await db.query(sql, [setCode, limit]);
    return result.map(row => this.mapRowToMTGCard(row));
  }

  /**
   * Search cards with filters
   */
  async search(filter: CardFilter, page: number = 1, pageSize: number = 50): Promise<CardSearchResult> {
    let whereConditions: string[] = [];
    let params: any[] = [];

    // Build WHERE conditions (simplified - only card properties)
    if (filter.search) {
      whereConditions.push('name LIKE ?');
      params.push(`%${filter.search}%`);
    }

    if (filter.setFilter) {
      whereConditions.push('set_code = ?');
      params.push(filter.setFilter);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Count total results
    const countSql = `
      SELECT COUNT(*) as total
      FROM cards
      ${whereClause}
    `;
    
    const countResult = await db.query(countSql, params);
    const totalCount = countResult[0]?.total || 0;

    // Get paginated results
    const offset = (page - 1) * pageSize;
    const sql = `
      SELECT * FROM cards
      ${whereClause}
      ORDER BY name
      LIMIT ? OFFSET ?
    `;

    const result = await db.query(sql, [...params, pageSize, offset]);
    const cards = result.map(row => ({
      ...this.mapRowToMTGCard(row),
      currentPrice: undefined // No price data in simplified search
    }) as CardWithPrice);

    return {
      cards,
      totalCount: totalCount,
      filteredCount: cards.length,
      totalValue: 0
    };
  }

  /**
   * Get all cards with current prices
   */
  async getAllWithPrices(limit: number = 1000): Promise<CardWithPrice[]> {
    const sql = `
      SELECT * FROM cards_with_prices 
      ORDER BY name 
      LIMIT ?
    `;
    
    const result = await db.query(sql, [limit]);
    return result.map(row => this.mapViewToCardWithPrice(row));
  }

  /**
   * Get cards without prices
   */
  async getCardsWithoutPrices(limit: number = 100): Promise<MTGCard[]> {
    const sql = `
      SELECT c.* FROM cards c
      LEFT JOIN price_history ph ON c.uuid = ph.card_uuid
      WHERE ph.card_uuid IS NULL
      ORDER BY c.name
      LIMIT ?
    `;
    
    const result = await db.query(sql, [limit]);
    return result.map(row => this.mapRowToMTGCard(row));
  }

  /**
   * Count total cards
   */
  async count(): Promise<number> {
    const result = await db.query('SELECT COUNT(*) as count FROM cards');
    return result[0]?.count || 0;
  }

  /**
   * Map database row to MTGCard interface
   */
  private mapRowToMTGCard(row: CardRow): MTGCard {
    return {
      uuid: row.uuid,
      name: row.name,
      setCode: row.set_code,
      setName: row.set_name,
      rarity: row.rarity || undefined,
      typeLine: row.type_line || undefined,
      manaCost: row.mana_cost || undefined,
      cmc: row.cmc || undefined,
      oracleText: row.oracle_text || undefined,
      imageUrl: row.image_url || undefined
    };
  }

  /**
   * Map row with price data to CardWithPrice interface  
   */
  private mapRowToCardWithPrice(row: any): CardWithPrice {
    return {
      uuid: row.uuid,
      name: row.name,
      setCode: row.set_code,
      setName: row.set_name,
      rarity: row.rarity || undefined,
      typeLine: row.type_line || undefined,
      manaCost: row.mana_cost || undefined,
      cmc: row.cmc || undefined,
      oracleText: row.oracle_text || undefined,
      imageUrl: row.image_url || undefined,
      currentPrice: row.latest_price || undefined,
      // Note: priceHistory and priceChange would be populated by separate queries if needed
    };
  }

  /**
   * Map view row to CardWithPrice interface
   */
  private mapViewToCardWithPrice(row: CardWithPricesView): CardWithPrice {
    return {
      uuid: row.uuid,
      name: row.name,
      setCode: row.set_code,
      setName: row.set_name,
      rarity: row.rarity || undefined,
      typeLine: row.type_line || undefined,
      manaCost: row.mana_cost || undefined,
      cmc: row.cmc || undefined,
      oracleText: row.oracle_text || undefined,
      imageUrl: row.image_url || undefined,
      currentPrice: row.latest_price || undefined,
      // Note: priceHistory and priceChange would be populated by separate queries if needed
    };
  }
}

export default new CardModel();