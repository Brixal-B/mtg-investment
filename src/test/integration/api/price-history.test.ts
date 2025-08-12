import { testApiRoute } from '@/test/utils/api';
import { TestDatabase } from '@/test/utils/database';
import handler from '@/app/api/price-history/route';

describe('/api/price-history', () => {
  beforeEach(async () => {
    await TestDatabase.setupTestDatabase();
    await TestDatabase.seedTestData();
  });

  afterEach(async () => {
    await TestDatabase.cleanupTestDatabase();
  });

  describe('GET /api/price-history', () => {
    it('returns price data overview when no card specified', async () => {
      const response = await testApiRoute(handler, {
        method: 'GET'
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('ok', true);
      expect(response.data.data).toHaveProperty('earliest_date');
      expect(response.data.data).toHaveProperty('latest_date');
    });

    it('returns price history for specific card', async () => {
      const response = await testApiRoute(handler, {
        method: 'GET',
        query: { card: 'test-card-1', days: '30' }
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('ok', true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('handles invalid card UUID', async () => {
      const response = await testApiRoute(handler, {
        method: 'GET',
        query: { card: 'invalid-uuid' }
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.data).toHaveLength(0);
    });
  });

  describe('POST /api/price-history', () => {
    it('successfully processes price data upload', async () => {
      const testData = {
        dateRange: ['2025-01-01', '2025-02-01'],
        cards: [
          {
            uuid: 'test-card-1',
            prices: {
              '2025-01-01': 10.50,
              '2025-02-01': 12.00
            }
          }
        ]
      };

      const response = await testApiRoute(handler, {
        method: 'POST',
        body: testData
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('ok', true);
      expect(response.data.data).toHaveProperty('processedRecords');
    });

    it('rejects invalid request body', async () => {
      const response = await testApiRoute(handler, {
        method: 'POST',
        body: { invalid: 'data' }
      });

      expect(response.status).toBe(400);
      expect(response.data).toHaveProperty('ok', false);
    });
  });
});