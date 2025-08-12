import { testApiRoute } from '@/test/utils/api';
import { TestDatabase } from '@/test/utils/database';
import handler from '@/app/api/database/route';

describe('/api/database', () => {
  beforeEach(async () => {
    await TestDatabase.setupTestDatabase();
  });

  afterEach(async () => {
    await TestDatabase.cleanupTestDatabase();
  });

  describe('GET /api/database', () => {
    it('returns database info', async () => {
      const response = await testApiRoute(handler, {
        method: 'GET',
        query: { action: 'info' }
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('ok', true);
      expect(response.data.data).toHaveProperty('tables');
    });

    it('returns health status', async () => {
      const response = await testApiRoute(handler, {
        method: 'GET',
        query: { action: 'health' }
      });

      expect(response.status).toBe(200);
      expect(response.data.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ table: expect.any(String), count: expect.any(Number) })
        ])
      );
    });

    it('handles invalid action', async () => {
      const response = await testApiRoute(handler, {
        method: 'GET',
        query: { action: 'invalid' }
      });

      expect(response.status).toBe(400);
      expect(response.data).toHaveProperty('ok', false);
    });
  });
});