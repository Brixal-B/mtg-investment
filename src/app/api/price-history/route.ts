import { NextResponse } from 'next/server';
import { 
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling
} from '@/lib';
import { CardModel, PriceHistoryModel } from '@/lib/database/models';
import db from '@/lib/database/connection';
import type { PriceSnapshot, ProcessedCardPrice, CardWithPrice } from '@/types/mtg';

// Initialize database connection
let dbInitialized = false;
async function ensureDbConnection() {
  if (!dbInitialized) {
    try {
      await db.connect();
      dbInitialized = true;
    } catch (error) {
      console.error('Failed to connect to database:', error);
      throw error;
    }
  }
}

export const GET = withErrorHandling(async (request: Request): Promise<NextResponse> => {
  await ensureDbConnection();
  
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'snapshot';
  const limit = parseInt(searchParams.get('limit') || '1000');
  const setFilter = searchParams.get('set');
  const search = searchParams.get('search');
  const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
  const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
  const withoutPrices = searchParams.get('withoutPrices') === 'true';

  try {
    if (format === 'snapshot') {
      // Return data in the legacy PriceSnapshot format for backward compatibility
      const snapshot = await createPriceSnapshot(limit, setFilter, search, minPrice, maxPrice, withoutPrices);
      return createSuccessResponse(snapshot);
    } else if (format === 'cards') {
      // Return enhanced card data with prices
      const result = await getCardsWithPrices(limit, setFilter, search, minPrice, maxPrice, withoutPrices);
      return createSuccessResponse(result);
    } else if (format === 'history') {
      // Return price history for specific cards
      const cardUuids = searchParams.get('cards')?.split(',') || [];
      const history = await getPriceHistoryForCards(cardUuids);
      return createSuccessResponse(history);
    } else {
      throw new Error(`Unsupported format: ${format}`);
    }
  } catch (error) {
    console.error('Price history API error:', error);
    return createErrorResponse(
      error,
      'Failed to retrieve price history',
      500
    );
  }
});

/**
 * Create price snapshot in legacy format for backward compatibility
 */
async function createPriceSnapshot(
  limit: number,
  setFilter?: string | null,
  search?: string | null,
  minPrice?: number,
  maxPrice?: number,
  withoutPrices?: boolean
): Promise<PriceSnapshot> {
  const filters = {
    search: search || undefined,
    setFilter: setFilter || undefined,
    minPrice,
    maxPrice,
    onlyWithoutPrices: withoutPrices
  };

  const searchResult = await CardModel.search(filters, 1, limit);
  const cards: ProcessedCardPrice[] = [];

  for (const card of searchResult.cards) {
    if (card.currentPrice !== undefined || withoutPrices) {
      // Get price history for this card
      const priceHistory = await PriceHistoryModel.getCardPriceHistory(card.uuid, 365); // Last year
      
      const prices: Record<string, number> = {};
      for (const priceRecord of priceHistory) {
        const dateKey = priceRecord.price_date.toISOString().split('T')[0]; // YYYY-MM-DD
        prices[dateKey] = priceRecord.price;
      }

      cards.push({
        uuid: card.uuid,
        prices
      });
    }
  }

  return {
    date: new Date().toISOString(),
    cards
  };
}

/**
 * Get cards with current prices and enhanced data
 */
async function getCardsWithPrices(
  limit: number,
  setFilter?: string | null,
  search?: string | null,
  minPrice?: number,
  maxPrice?: number,
  withoutPrices?: boolean
): Promise<{
  cards: CardWithPrice[];
  totalCount: number;
  filteredCount: number;
  totalValue: number;
  metadata: {
    hasMore: boolean;
    searchApplied: boolean;
    filters: any;
  };
}> {
  const filters = {
    search: search || undefined,
    setFilter: setFilter || undefined,
    minPrice,
    maxPrice,
    onlyWithoutPrices: withoutPrices
  };

  const searchResult = await CardModel.search(filters, 1, limit);
  
  // Enhance cards with additional price data
  const enhancedCards: CardWithPrice[] = [];
  
  for (const card of searchResult.cards) {
    const enhanced: CardWithPrice = {
      ...card,
      currentPrice: card.currentPrice
    };

    // Add price history and calculate changes if card has prices
    if (card.currentPrice !== undefined) {
      const priceHistory = await PriceHistoryModel.getCardPriceHistory(card.uuid, 90); // Last 3 months
      
      if (priceHistory.length > 0) {
        const prices: Record<string, number> = {};
        let totalPrice = 0;
        
        for (const priceRecord of priceHistory) {
          const dateKey = priceRecord.price_date.toISOString().split('T')[0];
          prices[dateKey] = priceRecord.price;
          totalPrice += priceRecord.price;
        }
        
        enhanced.priceHistory = prices;
        enhanced.avgPrice = totalPrice / priceHistory.length;

        // Calculate price change from a week ago
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const weekAgoPrices = priceHistory.filter(p => p.price_date >= weekAgo);
        if (weekAgoPrices.length > 1) {
          const oldestRecent = weekAgoPrices[weekAgoPrices.length - 1].price;
          const newest = weekAgoPrices[0].price;
          
          enhanced.priceChange = {
            amount: newest - oldestRecent,
            percentage: ((newest - oldestRecent) / oldestRecent) * 100,
            period: '7d'
          };
        }
      }
    }

    enhancedCards.push(enhanced);
  }

  return {
    cards: enhancedCards,
    totalCount: searchResult.totalCount,
    filteredCount: searchResult.filteredCount,
    totalValue: searchResult.totalValue,
    metadata: {
      hasMore: searchResult.filteredCount >= limit,
      searchApplied: !!(search || setFilter || minPrice || maxPrice || withoutPrices),
      filters
    }
  };
}

/**
 * Get detailed price history for specific cards
 */
async function getPriceHistoryForCards(cardUuids: string[]): Promise<{
  cards: Array<{
    uuid: string;
    name: string;
    setCode: string;
    priceHistory: Array<{
      date: string;
      price: number;
      source: string;
      variant: string;
    }>;
  }>;
}> {
  const result: any[] = [];

  for (const uuid of cardUuids) {
    const card = await CardModel.findByUuid(uuid);
    if (!card) continue;

    const priceHistory = await PriceHistoryModel.getCardPriceHistory(uuid, 365); // Last year
    
    result.push({
      uuid: card.uuid,
      name: card.name,
      setCode: card.setCode,
      priceHistory: priceHistory.map(p => ({
        date: p.price_date.toISOString().split('T')[0],
        price: p.price,
        source: p.source,
        variant: p.variant
      }))
    });
  }

  return { cards: result };
}
