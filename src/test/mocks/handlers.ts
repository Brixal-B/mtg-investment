import { http, HttpResponse } from 'msw';

export const handlers = [
  // Mock price history API
  http.get('/api/price-history', () => {
    return HttpResponse.json({
      ok: true,
      data: {
        earliest_date: '2025-01-01',
        latest_date: '2025-08-12',
        total_records: 1000
      }
    });
  }),

  // Mock database API
  http.get('/api/database', ({ request }) => {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    
    switch (action) {
      case 'info':
        return HttpResponse.json({
          ok: true,
          data: {
            tables: [
              { table: 'cards', count: 100 },
              { table: 'price_history', count: 1000 }
            ]
          }
        });
      case 'health':
        return HttpResponse.json({
          ok: true,
          data: [
            { table: 'cards', count: 100 },
            { table: 'price_history', count: 1000 }
          ]
        });
      default:
        return HttpResponse.json(
          { ok: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  }),

  // Mock Scryfall API
  http.get('https://api.scryfall.com/cards/named', ({ request }) => {
    const url = new URL(request.url);
    const exact = url.searchParams.get('exact');
    
    return HttpResponse.json({
      name: exact,
      prices: { usd: '10.50' },
      image_uris: { normal: 'https://example.com/card.jpg' },
      set: 'TST',
      set_name: 'Test Set'
    });
  })
];