import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { 
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling
} from '@/lib';
import Database, { MaintenanceOperations, CardOperations, PriceOperations } from '@/lib/database';

export const GET = withErrorHandling(async (req: NextRequest): Promise<NextResponse> => {
  const url = new URL(req.url);
  const action = url.searchParams.get('action') || 'info';

  try {
    switch (action) {
      case 'info':
        const info = await MaintenanceOperations.getDatabaseInfo();
        return createSuccessResponse(info, 'Retrieved database information');

      case 'health':
        const health = await MaintenanceOperations.getTableSizes();
        return createSuccessResponse(health, 'Retrieved database health status');

      case 'search':
        const query = url.searchParams.get('q');
        if (!query) {
          return createErrorResponse(
            new Error('Missing search query'),
            'Search query parameter "q" is required',
            400
          );
        }
        const results = await CardOperations.searchCards(query);
        return createSuccessResponse(results, `Found ${results.length} matching cards`);

      case 'card':
        const cardId = url.searchParams.get('uuid');
        if (!cardId) {
          return createErrorResponse(
            new Error('Missing card UUID'),
            'Card UUID parameter is required',
            400
          );
        }
        const card = await CardOperations.getCard(cardId);
        if (!card) {
          return createErrorResponse(
            new Error('Card not found'),
            `Card with UUID ${cardId} not found`,
            404
          );
        }
        return createSuccessResponse(card, 'Retrieved card information');

      default:
        return createErrorResponse(
          new Error('Invalid action'),
          `Unknown action: ${action}. Valid actions: info, health, search, card`,
          400
        );
    }
  } catch (error) {
    return createErrorResponse(error, `Database operation failed: ${action}`);
  }
});

export const POST = withErrorHandling(async (req: NextRequest): Promise<NextResponse> => {
  try {
    const body = await req.json();
    const { action, data } = body;

    switch (action) {
      case 'vacuum':
        await MaintenanceOperations.vacuum();
        return createSuccessResponse(null, 'Database vacuum completed');

      case 'analyze':
        await MaintenanceOperations.analyze();
        return createSuccessResponse(null, 'Database analyze completed');

      case 'insert_card':
        if (!data || !data.uuid || !data.name) {
          return createErrorResponse(
            new Error('Invalid card data'),
            'Card data must include uuid and name',
            400
          );
        }
        const result = await CardOperations.insertCard(data);
        return createSuccessResponse(
          { changes: result.changes, lastID: result.lastID },
          'Card inserted successfully'
        );

      default:
        return createErrorResponse(
          new Error('Invalid action'),
          `Unknown action: ${action}`,
          400
        );
    }
  } catch (error) {
    return createErrorResponse(error, 'Database operation failed');
  }
});
