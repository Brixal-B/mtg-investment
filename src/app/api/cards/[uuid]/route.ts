import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { 
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling
} from '../../../../lib';
import { initializeDatabase } from '../../../../lib/database-init';
import { CardModel, PriceHistoryModel } from '../../../../lib/database/models';

/**
 * GET /api/cards/[uuid]
 * Get a specific card by UUID with price history
 */
export const GET = withErrorHandling(async (
  req: NextRequest,
  { params }: { params: { uuid: string } }
): Promise<NextResponse> => {
  try {
    // Ensure database is initialized
    await initializeDatabase();

    const { uuid } = params;
    const url = new URL(req.url);
    const source = url.searchParams.get('source') || 'tcgplayer';
    const variant = url.searchParams.get('variant') || 'normal';
    const days = url.searchParams.get('days') ? parseInt(url.searchParams.get('days')!) : undefined;

    // Get the card
    const card = await CardModel.findByUuid(uuid);
    if (!card) {
      return createErrorResponse(
        new Error('Card not found'),
        `Card with UUID ${uuid} not found`,
        404
      );
    }

    // Get price data
    const currentPrice = await PriceHistoryModel.getCurrentPrice(uuid, source, variant);
    const priceHistory = await PriceHistoryModel.getPriceHistory(uuid, source, variant, days);

    return createSuccessResponse({
      card: {
        ...card,
        currentPrice,
        priceHistory,
        prices: {
          current: currentPrice,
          history: priceHistory,
          source,
          variant
        }
      }
    });

  } catch (error) {
    console.error('Error retrieving card:', error);
    return createErrorResponse(
      error instanceof Error ? error : new Error('Unknown error'),
      'Failed to retrieve card',
      500
    );
  }
});