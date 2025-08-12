import Database, { CardOperations, PriceOperations } from '@/lib/database';
import { TestDatabase } from '@/test/utils/database';

describe('Database Operations', () => {
  beforeEach(async () => {
    await TestDatabase.setupTestDatabase();
  });

  afterEach(async () => {
    await TestDatabase.cleanupTestDatabase();
  });

  describe('CardOperations', () => {
    const testCard = {
      uuid: 'test-card-uuid',
      name: 'Test Card',
      set_code: 'TST',
      set_name: 'Test Set',
      rarity: 'rare',
      mana_cost: '{1}{R}',
      cmc: 2
    };

    it('inserts and retrieves cards correctly', async () => {
      await CardOperations.insertCard(testCard);
      const retrieved = await CardOperations.getCard(testCard.uuid);

      expect(retrieved).toMatchObject({
        uuid: testCard.uuid,
        name: testCard.name,
        set_code: testCard.set_code
      });
    });

    it('searches cards by name', async () => {
      await CardOperations.insertCard(testCard);
      const results = await CardOperations.searchCards('Test');

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({ name: testCard.name });
    });

    it('finds cards by exact name', async () => {
      await CardOperations.insertCard(testCard);
      const result = await CardOperations.getCardByName(testCard.name);

      expect(result).toMatchObject({ name: testCard.name });
    });
  });

  describe('PriceOperations', () => {
    const testPriceRecord = {
      card_uuid: 'test-card-uuid',
      date: '2025-01-01',
      price_usd: 10.50,
      source: 'test'
    };

    it('inserts and retrieves price records', async () => {
      await PriceOperations.insertPriceRecord(testPriceRecord);
      const history = await PriceOperations.getPriceHistory(testPriceRecord.card_uuid);

      expect(history).toHaveLength(1);
      expect(history[0]).toMatchObject({
        card_uuid: testPriceRecord.card_uuid,
        price_usd: testPriceRecord.price_usd
      });
    });

    it('gets latest price for card', async () => {
      await PriceOperations.insertPriceRecord(testPriceRecord);
      await PriceOperations.insertPriceRecord({
        ...testPriceRecord,
        date: '2025-01-02',
        price_usd: 12.00
      });

      const latest = await PriceOperations.getLatestPrice(testPriceRecord.card_uuid);
      expect(latest?.price_usd).toBe(12.00);
    });

    it('bulk inserts price records', async () => {
      const bulkRecords = [
        { ...testPriceRecord, date: '2025-01-01' },
        { ...testPriceRecord, date: '2025-01-02', price_usd: 11.00 },
        { ...testPriceRecord, date: '2025-01-03', price_usd: 12.00 }
      ];

      await PriceOperations.bulkInsertPrices(bulkRecords);
      const history = await PriceOperations.getPriceHistory(testPriceRecord.card_uuid);

      expect(history).toHaveLength(3);
    });
  });
});