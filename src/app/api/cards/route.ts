import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { 
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling
} from '../../../lib';
import { initializeDatabase } from '../../../lib/database-init';
import { CardModel } from '../../../lib/database/models';

/**
 * GET /api/cards
 * Search and retrieve cards from the database
 * Query params:
 * - search: search term for card names
 * - set: filter by set code
 * - rarity: filter by rarity
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
    const search = searchParams.get('search');
    const setCode = searchParams.get('set');
    const rarity = searchParams.get('rarity');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Perform search
    const results = await CardModel.search({
      search: search || undefined,
      setFilter: setCode || undefined,
    }, page, limit);

    // Get total count for pagination
    const totalCount = await CardModel.count();

    return createSuccessResponse({
      cards: results.cards,
      pagination: {
        page,
        limit,
        total: results.totalCount,
        filteredCount: results.filteredCount,
        totalPages: Math.ceil(results.totalCount / limit)
      },
      filters: {
        search,
        setCode,
        rarity
      },
      totalValue: results.totalValue
    });

  } catch (error) {
    console.error('Error in cards API:', error);
    return createErrorResponse(
      error instanceof Error ? error : new Error('Unknown error'),
      'Failed to retrieve cards',
      500
    );
  }
});

/**
 * POST /api/cards
 * Add a new card to the database
 * Body: MTGCard interface data
 */
export const POST = withErrorHandling(async (req: NextRequest): Promise<NextResponse> => {
  try {
    // Ensure database is initialized
    await initializeDatabase();

    const cardData = await req.json();

    // Validate required fields
    if (!cardData.uuid || !cardData.name || !cardData.setCode) {
      return createErrorResponse(
        new Error('Missing required fields'),
        'uuid, name, and setCode are required',
        400
      );
    }

    // Create the card
    await CardModel.create(cardData);

    return createSuccessResponse({
      card: cardData,
      message: 'Card created successfully'
    });

  } catch (error) {
    console.error('Error creating card:', error);
    return createErrorResponse(
      error instanceof Error ? error : new Error('Unknown error'),
      'Failed to create card',
      500
    );
  }
});