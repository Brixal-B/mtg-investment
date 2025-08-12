import { http, HttpResponse } from 'msw';
import { mockCards, mockPriceHistory } from '@/test/fixtures/card-data';
import { mockUser, mockAuthResponse } from '@/test/fixtures/user-data';

export const handlers = [
  // Authentication endpoints
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as { email: string; password: string };
    
    if (body.email === 'admin@example.com' && body.password === 'admin') {
      return HttpResponse.json(mockAuthResponse);
    }
    
    return HttpResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  }),

  http.post('/api/auth/logout', () => {
    return HttpResponse.json({ success: true });
  }),

  http.get('/api/auth/me', () => {
    return HttpResponse.json(mockUser);
  }),

  // Price history endpoints
  http.get('/api/price-history', () => {
    return HttpResponse.json(mockPriceHistory);
  }),

  http.post('/api/price-history', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ success: true, data: body });
  }),

  // Admin endpoints
  http.post('/api/admin/download-mtgjson', () => {
    return HttpResponse.json({ 
      success: true, 
      message: 'Download started',
      progress: { current: 0, total: 100 }
    });
  }),

  http.post('/api/admin/import-mtgjson', () => {
    return HttpResponse.json({
      success: true,
      message: 'Import completed',
      stats: { processed: 1000, imported: 950, errors: 50 }
    });
  }),

  http.get('/api/admin/check-mtgjson', () => {
    return HttpResponse.json({
      exists: true,
      size: 1024000,
      lastModified: new Date().toISOString()
    });
  }),

  // Database endpoints
  http.get('/api/database/info', () => {
    return HttpResponse.json({
      tables: ['cards', 'prices', 'users'],
      totalRecords: 50000,
      dbSize: '125MB'
    });
  }),

  // Test JSON endpoint
  http.get('/api/test-json', () => {
    return HttpResponse.json(mockCards);
  }),

  // MTG JSON data endpoint
  http.get('/api/mtgjson-data', () => {
    return HttpResponse.json({
      cards: mockCards,
      total: mockCards.length,
      page: 1,
      limit: 50
    });
  }),

  // Error simulation endpoints for testing error handling
  http.get('/api/error/500', () => {
    return HttpResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }),

  http.get('/api/error/404', () => {
    return HttpResponse.json(
      { error: 'Not found' },
      { status: 404 }
    );
  }),

  http.get('/api/error/timeout', () => {
    return new Promise(() => {
      // Never resolves to simulate timeout
    });
  }),
];