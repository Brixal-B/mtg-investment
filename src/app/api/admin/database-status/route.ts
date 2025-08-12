import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { 
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling
} from '../../../../lib';
import { checkDatabaseHealth, initializeDatabase } from '../../../../lib/database-init';
import { CardModel, PriceHistoryModel, CardSetModel, ImportLogModel } from '../../../../lib/database/models';

/**
 * GET /api/admin/database-status
 * Get comprehensive database status and health information
 */
export const GET = withErrorHandling(async (req: NextRequest): Promise<NextResponse> => {
  try {
    const url = new URL(req.url);
    
    if (url.searchParams.get('health') === '1') {
      // Get database health check
      const health = await checkDatabaseHealth();
      return createSuccessResponse(health);
    }

    if (url.searchParams.get('init') === '1') {
      // Initialize database and return status
      const initResult = await initializeDatabase();
      return createSuccessResponse(initResult);
    }

    // Get comprehensive database status
    const [health, cardCount, setCount, priceStats, importStats] = await Promise.all([
      checkDatabaseHealth(),
      CardModel.count(),
      CardSetModel.count(),
      PriceHistoryModel.getPriceStats(),
      ImportLogModel.getStats()
    ]);

    return createSuccessResponse({
      health,
      statistics: {
        cards: cardCount,
        sets: setCount,
        pricePoints: priceStats.totalPricePoints,
        uniqueCardsWithPrices: priceStats.uniqueCards,
        priceSourcesAvailable: priceStats.sources,
        priceDateRange: priceStats.dateRange
      },
      imports: importStats,
      ready: health.connected && Object.values(health.tableStatus).every(status => status)
    });

  } catch (error) {
    console.error('Error getting database status:', error);
    return createErrorResponse(
      error instanceof Error ? error : new Error('Unknown error'),
      'Failed to get database status',
      500
    );
  }
});

/**
 * POST /api/admin/database-status
 * Perform database operations like initialization or health checks
 */
export const POST = withErrorHandling(async (req: NextRequest): Promise<NextResponse> => {
  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'initialize':
        const initResult = await initializeDatabase();
        return createSuccessResponse({
          action: 'initialize',
          result: initResult,
          message: 'Database initialized successfully'
        });

      case 'health-check':
        const health = await checkDatabaseHealth();
        return createSuccessResponse({
          action: 'health-check',
          result: health,
          message: 'Database health check completed'
        });

      default:
        return createErrorResponse(
          new Error('Invalid action'),
          `Unknown action: ${action}. Available actions: initialize, health-check`,
          400
        );
    }

  } catch (error) {
    console.error('Error performing database operation:', error);
    return createErrorResponse(
      error instanceof Error ? error : new Error('Unknown error'),
      'Failed to perform database operation',
      500
    );
  }
});