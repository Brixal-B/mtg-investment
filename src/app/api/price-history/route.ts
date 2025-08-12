import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { 
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling
} from '../../../lib';
import { initializeDatabase } from '../../../lib/database-init';
import { CardModel, PriceHistoryModel, CardSetModel } from '../../../lib/database/models';

/**
 * GET /api/price-history
 * Returns price history data from the database
 * Query params:
 * - cards: comma-separated list of card UUIDs
 * - search: search term for card names
 * - set: filter by set code
 * - source: price source (tcgplayer, cardkingdom, mtgo)
 * - variant: card variant (normal, foil)
 * - days: number of days of history to return
 * - page: page number for pagination
 * - limit: number of results per page
 */
export const GET = withErrorHandling(async (req: NextRequest): Promise<NextResponse> => {
  try {
    // Ensure database is initialized
    await initializeDatabase();

    const url = new URL(req.url);
    const searchParams = url.searchParams;

    // Get query parameters
    const cardUuids = searchParams.get('cards')?.split(',').filter(Boolean) || [];
    const search = searchParams.get('search');
    const setCode = searchParams.get('set');
    const source = searchParams.get('source') || 'tcgplayer';
    const variant = searchParams.get('variant') || 'normal';
    const days = searchParams.get('days') ? parseInt(searchParams.get('days')!) : undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    let cards: any[] = [];

    // If specific card UUIDs are requested
    if (cardUuids.length > 0) {
      const cardData = await Promise.all(
        cardUuids.map(async (uuid) => {
          const card = await CardModel.findByUuid(uuid);
          if (!card) return null;

          const priceHistory = await PriceHistoryModel.getPriceHistory(uuid, source, variant, days);
          const currentPrice = await PriceHistoryModel.getCurrentPrice(uuid, source, variant);

          return {
            ...card,
            currentPrice,
            priceHistory,
            source,
            variant
          };
        })
      );

      cards = cardData.filter(Boolean);
    } 
    // If search parameters are provided
    else if (search || setCode) {
      const searchResults = await CardModel.search({
        search,
        setFilter: setCode
      }, page, limit);

      // Get price data for found cards
      const cardUuids = searchResults.cards.map(card => card.uuid);
      const priceData = await PriceHistoryModel.getLatestPrices(cardUuids, source, variant);

      cards = searchResults.cards.map(card => ({
        ...card,
        currentPrice: priceData[card.uuid] || null,
        source,
        variant
      }));
    }
    // Default: return recent price activity
    else {
      const recentCards = await CardModel.getAllWithPrices(limit);
      cards = recentCards.slice((page - 1) * limit, page * limit);
    }

    // Get price statistics
    const priceStats = await PriceHistoryModel.getPriceStats();

    return createSuccessResponse({
      cards,
      pagination: {
        page,
        limit,
        total: cards.length
      },
      filters: {
        source,
        variant,
        days,
        search,
        setCode
      },
      statistics: priceStats
    });

  } catch (error) {
    console.error('Error in price-history API:', error);
    return createErrorResponse(
      error instanceof Error ? error : new Error('Unknown error'),
      'Failed to retrieve price history',
      500
    );
  }
});

/**
 * POST /api/price-history
 * Add price data to the database
 * Body: { cardUuid, price, date?, source?, variant? }
 */
export const POST = withErrorHandling(async (req: NextRequest): Promise<NextResponse> => {
  try {
    // Ensure database is initialized
    await initializeDatabase();

    const body = await req.json();
    const { cardUuid, price, date, source = 'tcgplayer', variant = 'normal' } = body;

    if (!cardUuid || price === undefined) {
      return createErrorResponse(
        new Error('Missing required fields'),
        'cardUuid and price are required',
        400
      );
    }

    // Validate that the card exists
    const card = await CardModel.findByUuid(cardUuid);
    if (!card) {
      return createErrorResponse(
        new Error('Card not found'),
        `Card with UUID ${cardUuid} not found`,
        404
      );
    }

    // Add price data
    const priceDate = date ? new Date(date) : new Date();
    await PriceHistoryModel.addPrice(cardUuid, priceDate, price, source, variant);

    return createSuccessResponse({
      cardUuid,
      price,
      date: priceDate.toISOString(),
      source,
      variant,
      message: 'Price added successfully'
    });

  } catch (error) {
    console.error('Error adding price data:', error);
    return createErrorResponse(
      error instanceof Error ? error : new Error('Unknown error'),
      'Failed to add price data',
      500
    );
  }
});