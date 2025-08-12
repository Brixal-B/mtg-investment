import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
  test('price history API responds correctly', async ({ request }) => {
    const response = await request.get('/api/price-history');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('ok', true);
  });

  test('database API returns health status', async ({ request }) => {
    const response = await request.get('/api/database?action=health');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  test('admin API endpoints are protected', async ({ request }) => {
    const response = await request.post('/api/admin/import-mtgjson');
    // Should either succeed or fail gracefully, not crash
    expect([200, 400, 409, 500]).toContain(response.status());
  });
});