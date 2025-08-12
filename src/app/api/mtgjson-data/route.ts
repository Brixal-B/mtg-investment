import { NextResponse } from 'next/server';
import { 
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling
} from '@/lib';
import { CardModel, CardSetModel, PriceHistoryModel } from '@/lib/database/models';
import db from '@/lib/database/connection';
import type { MTGCard, CardSearchResult } from '@/types/mtg';

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
  const action = searchParams.get('action') || 'meta';
  const limit = parseInt(searchParams.get('limit') || '1000');
  const setFilter = searchParams.get('set');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '1');

  try {
    if (action === 'meta') {
      // Return metadata about the database
      const meta = await getDatabaseMetadata();
      return createSuccessResponse({
        meta,
        message: "Database-powered MTG data - use other action parameters for specific data",
        availableActions: ['meta', 'cards', 'sets', 'stats'],
        suggestion: "Use action=cards to get card data, action=sets for set information"
      });
    } else if (action === 'cards') {
      // Return card data with optional filtering
      const result = await getCards(search, setFilter, page, limit);
      return createSuccessResponse(result);
    } else if (action === 'sets') {
      // Return set information
      const sets = await getSets();
      return createSuccessResponse({ sets });
    } else if (action === 'stats') {
      // Return database statistics
      const stats = await getDatabaseStats();
      return createSuccessResponse(stats);
    } else {
      throw new Error(`Unsupported action: ${action}`);
    }
  } catch (error) {
    console.error('MTGJSON Data API error:', error);
    return createErrorResponse(
      error,
      'Failed to retrieve MTG data',
      500
    );
  }
});

/**
 * Get database metadata in MTGJSON-compatible format
 */
async function getDatabaseMetadata() {
  const [totalCards, totalSets, totalPrices] = await Promise.all([
    CardModel.count(),
    CardSetModel.count(),
    PriceHistoryModel.count()
  ]);

  // Get latest price date
  const latestPriceResult = await db.query(
    'SELECT MAX(price_date) as latest_date FROM price_history LIMIT 1'
  );
  const latestPriceDate = latestPriceResult[0]?.latest_date;

  return {
    date: new Date().toISOString().split('T')[0],
    version: "5.2.0", // Mimic MTGJSON version format
    totalCards,
    totalSets,
    totalPriceRecords: totalPrices,
    latestPriceUpdate: latestPriceDate,
    source: "MTG Investment Database",
    disclaimer: "Data sourced from MTGJSON and enhanced with additional price tracking"
  };
}

/**
 * Get cards with filtering and pagination
 */
async function getCards(
  search?: string | null,
  setFilter?: string | null,
  page: number = 1,
  limit: number = 1000
): Promise<{
  cards: MTGCard[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
}> {
  const filters = {
    search: search || undefined,
    setFilter: setFilter || undefined
  };

  const searchResult = await CardModel.search(filters, page, limit);
  const totalPages = Math.ceil(searchResult.totalCount / limit);

  return {
    cards: searchResult.cards.map(card => ({
      uuid: card.uuid,
      name: card.name,
      setCode: card.setCode,
      setName: card.setName,
      rarity: card.rarity,
      typeLine: card.typeLine,
      manaCost: card.manaCost,
      cmc: card.cmc,
      oracleText: card.oracleText,
      imageUrl: card.imageUrl
    })),
    totalCount: searchResult.totalCount,
    currentPage: page,
    totalPages,
    hasMore: page < totalPages
  };
}

/**
 * Get all card sets
 */
async function getSets(): Promise<Array<{
  code: string;
  name: string;
  type?: string;
  releaseDate?: string;
  cardCount: number;
}>> {
  const sets = await CardSetModel.getAll();
  
  // Get card counts for each set
  const setsWithCounts = await Promise.all(
    sets.map(async (set) => {
      const cardCount = await db.query(
        'SELECT COUNT(*) as count FROM cards WHERE set_code = ?',
        [set.code]
      );
      
      return {
        code: set.code,
        name: set.name,
        type: set.type,
        releaseDate: set.releaseDate?.toISOString().split('T')[0],
        cardCount: cardCount[0]?.count || 0
      };
    })
  );

  return setsWithCounts.sort((a, b) => b.cardCount - a.cardCount);
}

/**
 * Get comprehensive database statistics
 */
async function getDatabaseStats(): Promise<{
  overview: any;
  cardsBySet: any[];
  pricesBySource: any[];
  recentActivity: any;
}> {
  // Overview statistics
  const [totalCards, totalSets, totalPrices] = await Promise.all([
    CardModel.count(),
    CardSetModel.count(),
    PriceHistoryModel.count()
  ]);

  const cardsWithPricesResult = await db.query(`
    SELECT COUNT(DISTINCT card_uuid) as count 
    FROM price_history
  `);
  const cardsWithPrices = cardsWithPricesResult[0]?.count || 0;

  // Cards by set (top 10)
  const cardsBySet = await db.query(`
    SELECT set_code, set_name, COUNT(*) as card_count
    FROM cards 
    GROUP BY set_code, set_name 
    ORDER BY card_count DESC 
    LIMIT 10
  `);

  // Prices by source
  const pricesBySource = await db.query(`
    SELECT source, COUNT(*) as count
    FROM price_history 
    GROUP BY source 
    ORDER BY count DESC
  `);

  // Recent activity (last 30 days)
  const recentPricesResult = await db.query(`
    SELECT COUNT(*) as count
    FROM price_history 
    WHERE price_date >= date('now', '-30 days')
  `);
  const recentPrices = recentPricesResult[0]?.count || 0;

  return {
    overview: {
      totalCards,
      totalSets,
      totalPriceRecords: totalPrices,
      cardsWithPrices,
      cardsWithoutPrices: totalCards - cardsWithPrices,
      coveragePercentage: totalCards > 0 ? Math.round((cardsWithPrices / totalCards) * 100) : 0
    },
    cardsBySet: cardsBySet.map((row: any) => ({
      setCode: row.set_code,
      setName: row.set_name,
      cardCount: row.card_count
    })),
    pricesBySource: pricesBySource.map((row: any) => ({
      source: row.source,
      count: row.count
    })),
    recentActivity: {
      recentPriceUpdates: recentPrices,
      lastUpdated: new Date().toISOString()
    }
  };
}
