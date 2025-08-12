/**
 * Card Set model
 */

import db from '../connection';
import type { CardSetRow } from '../types';

interface CardSet {
  code: string;
  name: string;
  type?: string;
  releaseDate?: Date;
  cardCount?: number;
}

class CardSetModel {
  /**
   * Create or update a card set
   */
  async create(cardSet: CardSet): Promise<void> {
    const sql = `
      INSERT INTO card_sets (code, name, type, release_date, card_count)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(code) DO UPDATE SET
        name = excluded.name,
        type = excluded.type,
        release_date = excluded.release_date,
        card_count = excluded.card_count,
        updated_at = CURRENT_TIMESTAMP
    `;

    await db.query(sql, [
      cardSet.code,
      cardSet.name,
      cardSet.type || null,
      cardSet.releaseDate?.toISOString().split('T')[0] || null,
      cardSet.cardCount || null
    ]);
  }

  /**
   * Create multiple card sets in batch
   */
  async createBatch(cardSets: CardSet[]): Promise<void> {
    if (cardSets.length === 0) return;

    for (const cardSet of cardSets) {
      await this.create(cardSet);
    }
  }

  /**
   * Find card set by code
   */
  async findByCode(code: string): Promise<CardSet | null> {
    const sql = 'SELECT * FROM card_sets WHERE code = ?';
    const result = await db.query(sql, [code]);
    
    if (result.length === 0) {
      return null;
    }

    return this.mapRowToCardSet(result[0]);
  }

  /**
   * Get all card sets
   */
  async getAll(): Promise<CardSet[]> {
    const sql = 'SELECT * FROM card_sets ORDER BY release_date DESC, name';
    const result = await db.query(sql);
    return result.map(row => this.mapRowToCardSet(row));
  }

  /**
   * Get card sets by type
   */
  async getByType(type: string): Promise<CardSet[]> {
    const sql = 'SELECT * FROM card_sets WHERE type = ? ORDER BY release_date DESC';
    const result = await db.query(sql, [type]);
    return result.map(row => this.mapRowToCardSet(row));
  }

  /**
   * Get recent card sets
   */
  async getRecent(limit: number = 10): Promise<CardSet[]> {
    const sql = `
      SELECT * FROM card_sets 
      WHERE release_date IS NOT NULL 
      ORDER BY release_date DESC 
      LIMIT ?
    `;
    const result = await db.query(sql, [limit]);
    return result.map(row => this.mapRowToCardSet(row));
  }

  /**
   * Search card sets by name
   */
  async searchByName(name: string, limit: number = 20): Promise<CardSet[]> {
    const sql = `
      SELECT * FROM card_sets 
      WHERE name LIKE ? 
      ORDER BY name 
      LIMIT ?
    `;
    const result = await db.query(sql, [`%${name}%`, limit]);
    return result.map(row => this.mapRowToCardSet(row));
  }

  /**
   * Count total sets
   */
  async count(): Promise<number> {
    const result = await db.query('SELECT COUNT(*) as count FROM card_sets');
    return result[0]?.count || 0;
  }

  /**
   * Update card count for a set
   */
  async updateCardCount(code: string, cardCount: number): Promise<void> {
    const sql = `
      UPDATE card_sets 
      SET card_count = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE code = ?
    `;
    await db.query(sql, [cardCount, code]);
  }

  /**
   * Delete a card set
   */
  async delete(code: string): Promise<void> {
    await db.query('DELETE FROM card_sets WHERE code = ?', [code]);
  }

  /**
   * Map database row to CardSet interface
   */
  private mapRowToCardSet(row: CardSetRow): CardSet {
    return {
      code: row.code,
      name: row.name,
      type: row.type || undefined,
      releaseDate: row.release_date || undefined,
      cardCount: row.card_count || undefined
    };
  }
}

export default new CardSetModel();