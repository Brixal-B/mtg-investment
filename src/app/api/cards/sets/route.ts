import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';

// Response helpers
const createSuccessResponse = (data: any, message?: string) => {
  return NextResponse.json({
    ok: true,
    data,
    message,
    timestamp: new Date().toISOString()
  });
};

const createErrorResponse = (error: unknown, message: string, status = 500) => {
  console.error(`API Error: ${message}`, error);
  return NextResponse.json({
    ok: false,
    error: message,
    details: error instanceof Error ? error.message : 'Unknown error',
    timestamp: new Date().toISOString()
  }, { status });
};

const withErrorHandling = (handler: (req: NextRequest) => Promise<NextResponse>) => {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(req);
    } catch (error) {
      return createErrorResponse(error, 'Internal server error');
    }
  };
};

// GET /api/cards/sets - Get all sets with card counts and filtering options
export const GET = withErrorHandling(async (req: NextRequest): Promise<NextResponse> => {
  const { searchParams } = new URL(req.url);
  
  // Parameters
  const search = searchParams.get('search'); // Search by set name or code
  const sortBy = searchParams.get('sortBy') || 'set_name';
  const sortOrder = searchParams.get('sortOrder') || 'ASC';
  const includeCardCounts = searchParams.get('includeCounts') !== 'false';

  console.log('🎴 Sets browse request:', { search, sortBy, sortOrder, includeCardCounts });

  try {
    const db = database;
    
    let sql: string;
    let params: any[] = [];
    
    if (includeCardCounts) {
      // Query with card counts
      sql = `
        SELECT 
          set_code,
          set_name,
          COUNT(*) as card_count,
          GROUP_CONCAT(DISTINCT rarity) as rarities,
          MIN(collector_number) as min_collector_number,
          MAX(collector_number) as max_collector_number
        FROM cards 
        WHERE 1=1
      `;
      
      if (search) {
        sql += ` AND (set_name LIKE ? COLLATE NOCASE OR set_code LIKE ? COLLATE NOCASE)`;
        params.push(`%${search}%`, `%${search}%`);
      }
      
      sql += ` GROUP BY set_code, set_name`;
    } else {
      // Simple query without counts (faster)
      sql = `
        SELECT DISTINCT
          set_code,
          set_name
        FROM cards 
        WHERE 1=1
      `;
      
      if (search) {
        sql += ` AND (set_name LIKE ? COLLATE NOCASE OR set_code LIKE ? COLLATE NOCASE)`;
        params.push(`%${search}%`, `%${search}%`);
      }
    }
    
    // Add sorting
    const validSortFields = ['set_code', 'set_name', 'card_count'];
    const validSortOrders = ['ASC', 'DESC'];
    
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'set_name';
    const safeSortOrder = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC';
    
    sql += ` ORDER BY ${safeSortBy} ${safeSortOrder}`;

    console.log('📊 Executing sets SQL:', sql);
    console.log('📊 With params:', params);

    const sets = await db.all(sql, params);
    console.log('📊 Found', sets.length, 'sets');

    // Process the results
    const processedSets = sets.map((set: any) => ({
      ...set,
      rarities: set.rarities ? set.rarities.split(',').map((r: string) => r.trim()) : undefined
    }));

    return createSuccessResponse({
      sets: processedSets,
      total: processedSets.length,
      filters: {
        search,
        sortBy: safeSortBy,
        sortOrder: safeSortOrder,
        includeCardCounts
      }
    }, `Found ${processedSets.length} sets`);

  } catch (error) {
    console.error('💥 Database sets error:', error);
    return createErrorResponse(error, 'Failed to browse sets');
  }
});
