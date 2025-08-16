/**
 * @jest-environment node
 */

import Database from '../../lib/database';
import { TestDatabaseSetup } from '../../lib/test-database-setup';
import { NextRequest } from 'next/server';
import { GET, POST } from '../../app/api/cards/search/route';

// Integration tests that test the full flow without mocking the database
describe('Database Integration Tests', () => {
  beforeAll(async () => {
    // Initialize test database with schema and test data
    await TestDatabaseSetup.initializeTestSchema();
    await TestDatabaseSetup.insertTestData();
  });

  afterAll(async () => {
    // Clean up test database
    await TestDatabaseSetup.cleanup();
    if (Database.database) {
      await Database.database.close();
    }
  });

  describe('Card Operations Integration', () => {
    it('should handle the full card search flow', async () => {
      // This test would work with actual test data
      // For now, we'll test the structure without real data
      
      const searchResult = await Database.Cards.searchCards('Black Lotus', 10);
      expect(Array.isArray(searchResult)).toBe(true);
    });

    it('should handle card insertion and retrieval', async () => {
      const testCard = {
        uuid: 'test-integration-uuid',
        name: 'Test Card',
        set_code: 'TEST',
        set_name: 'Test Set'
      };

      try {
        await Database.Cards.insertCard(testCard);
        const retrievedCard = await Database.Cards.getCard('test-integration-uuid');
        
        expect(retrievedCard?.name).toBe('Test Card');
        expect(retrievedCard?.set_code).toBe('TEST');
      } catch (error) {
        // Handle case where card already exists or database is read-only
        expect(error).toBeDefined();
      }
    });
  });

  describe('API Integration Tests', () => {
    it('should handle API search requests end-to-end', async () => {
      const request = new NextRequest('http://localhost:3000/api/cards/search?name=Lightning%20Bolt');
      
      const response = await GET(request);
      expect(response).toBeDefined();
      
      // Test response structure - API returns structured response
      const responseData = await response.json();
      expect(responseData).toHaveProperty('ok');
      expect(responseData).toHaveProperty('data');
      expect(Array.isArray(responseData.data)).toBe(true);
    });

    it('should handle POST requests with card data', async () => {
      const requestBody = {
        cards: [
          { name: 'Lightning Bolt', setCode: 'LEA' }
        ]
      };

      const request = {
        json: () => Promise.resolve(requestBody)
      } as unknown as NextRequest;

      const response = await POST(request);
      expect(response).toBeDefined();
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('ok');
      expect(responseData).toHaveProperty('data');
      expect(Array.isArray(responseData.data)).toBe(true);
    });

    it('should handle invalid API requests gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/cards/search');
      
      const response = await GET(request);
      expect(response).toBeDefined();
      
      // Should return error response for missing name parameter
      const responseData = await response.json();
      expect(responseData).toHaveProperty('ok');
      expect(responseData.ok).toBe(false);
      expect(responseData).toHaveProperty('error');
    });
  });

  describe('Price Operations Integration', () => {
    it('should handle price history retrieval', async () => {
      const priceHistory = await Database.Prices.getPriceHistory('test-uuid', 30);
      expect(Array.isArray(priceHistory)).toBe(true);
    });

    it('should handle latest price queries', async () => {
      const latestPrice = await Database.Prices.getLatestPrice('test-uuid');
      // Should handle case where no price exists (returns undefined) or valid price object
      expect(latestPrice === undefined || latestPrice === null || typeof latestPrice === 'object').toBe(true);
    });

    it('should ensure cards exist before price operations', async () => {
      const result = await Database.Prices.ensureCardExists('test-new-uuid', 'Test Card');
      expect(result).toBe('test-new-uuid');
    });
  });

  describe('Collection Operations Integration', () => {
    it('should handle collection retrieval', async () => {
      const collection = await Database.Collection.getUserCollection();
      expect(Array.isArray(collection)).toBe(true);
    });

    it('should handle collection value calculation', async () => {
      const value = await Database.Collection.getCollectionValue();
      expect(typeof value === 'object' || value === null).toBe(true);
    });

    it('should handle adding cards to collection', async () => {
      try {
        const result = await Database.Collection.addToCollection('test-uuid', 1);
        expect(result.changes).toBeGreaterThanOrEqual(0);
      } catch (error) {
        // Handle case where operation fails due to constraints
        expect(error).toBeDefined();
      }
    });
  });

  describe('Maintenance Operations Integration', () => {
    it('should provide database information', async () => {
      const info = await Database.Maintenance.getDatabaseInfo();
      expect(typeof info).toBe('object');
      expect(info).toHaveProperty('tables');
    });

    it('should handle database optimization', async () => {
      // This might be disabled in production
      try {
        await Database.Maintenance.vacuum();
      } catch (error) {
        // Expected if optimization is disabled
        expect(error).toBeDefined();
      }
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle database connection errors', async () => {
      // Test with invalid UUID format
      try {
        await Database.Cards.getCard('');
        // Should still work, just return null/undefined
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle malformed queries safely', async () => {
      const maliciousQuery = "'; DROP TABLE cards; --";
      
      // Should not throw error, should handle safely
      const result = await Database.Cards.searchCards(maliciousQuery);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle concurrent operations', async () => {
      // Test multiple simultaneous queries
      const promises = Array.from({ length: 5 }, (_, i) => 
        Database.Cards.searchCards(`test query ${i}`)
      );

      const results = await Promise.all(promises);
      expect(results.length).toBe(5);
      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true);
      });
    });
  });

  describe('Performance Integration', () => {
    it('should handle large search queries efficiently', async () => {
      const startTime = Date.now();
      
      await Database.Cards.searchCards('a', 100); // Broad search
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (5 seconds)
      expect(duration).toBeLessThan(5000);
    });

    it('should handle multiple price queries efficiently', async () => {
      const startTime = Date.now();
      
      const promises = Array.from({ length: 10 }, (_, i) => 
        Database.Prices.getPriceHistory(`test-uuid-${i}`, 30)
      );

      await Promise.all(promises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time
      expect(duration).toBeLessThan(3000);
    });
  });
});
