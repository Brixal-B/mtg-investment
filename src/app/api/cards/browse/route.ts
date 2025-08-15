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

// GET /api/cards/browse - Paginated card browsing with filters
export const GET = withErrorHandling(async (req: NextRequest): Promise<NextResponse> => {
  const { searchParams } = new URL(req.url);
  
  // Pagination parameters
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Max 100 per page
  const offset = (page - 1) * limit;
  
  // Filter parameters
  const setCode = searchParams.get('setCode');
  const rarity = searchParams.get('rarity');
  const colors = searchParams.get('colors');
  const type = searchParams.get('type');
  const minCmc = searchParams.get('minCmc');
  const maxCmc = searchParams.get('maxCmc');
  const sortBy = searchParams.get('sortBy') || 'name';
  const sortOrder = searchParams.get('sortOrder') || 'ASC';

  console.log('🃏 Card browse request:', { 
    page, limit, setCode, rarity, colors, type, minCmc, maxCmc, sortBy, sortOrder 
  });

  try {
    const db = database;
    
    // Build the base query
    let sql = `
      SELECT 
        uuid,
        name,
        set_code,
        set_name,
        collector_number,
        rarity,
        mana_cost,
        cmc,
        type_line,
        colors,
        color_identity,
        oracle_text,
        power,
        toughness,
        image_uris,
        scryfall_id
      FROM cards 
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    // Apply filters
    if (setCode) {
      sql += ` AND set_code = ? COLLATE NOCASE`;
      params.push(setCode);
    }
    
    if (rarity) {
      sql += ` AND rarity = ? COLLATE NOCASE`;
      params.push(rarity);
    }
    
    if (colors) {
      // Filter by colors (can be comma-separated)
      const colorList = colors.split(',').map(c => c.trim().toUpperCase());
      const colorConditions = colorList.map(() => `colors LIKE ?`).join(' AND ');
      if (colorConditions) {
        sql += ` AND (${colorConditions})`;
        colorList.forEach(color => params.push(`%${color}%`));
      }
    }
    
    if (type) {
      sql += ` AND type_line LIKE ? COLLATE NOCASE`;
      params.push(`%${type}%`);
    }
    
    if (minCmc) {
      sql += ` AND cmc >= ?`;
      params.push(parseInt(minCmc));
    }
    
    if (maxCmc) {
      sql += ` AND cmc <= ?`;
      params.push(parseInt(maxCmc));
    }
    
    // Add sorting
    const validSortFields = ['name', 'set_code', 'rarity', 'cmc', 'collector_number'];
    const validSortOrders = ['ASC', 'DESC'];
    
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'name';
    const safeSortOrder = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC';
    
    sql += ` ORDER BY ${safeSortBy} ${safeSortOrder}, name ASC`;
    
    // Get total count for pagination
    const countSql = sql.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM').replace(/ORDER BY[\s\S]*$/, '');
    const countResult = await db.get(countSql, params);
    const totalCards = countResult?.total || 0;
    
    // Add pagination
    sql += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    console.log('📊 Executing browse SQL:', sql);
    console.log('📊 With params:', params);

    const cards = await db.all(sql, params);
    console.log('📊 Found', cards.length, 'cards');

    // Process the results
    const processedCards = cards.map((card: any) => ({
      ...card,
      image_uris: card.image_uris ? JSON.parse(card.image_uris) : null,
      colors: card.colors ? JSON.parse(card.colors) : [],
      color_identity: card.color_identity ? JSON.parse(card.color_identity) : []
    }));

    const totalPages = Math.ceil(totalCards / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return createSuccessResponse({
      cards: processedCards,
      pagination: {
        page,
        limit,
        totalCards,
        totalPages,
        hasNextPage,
        hasPrevPage
      },
      filters: {
        setCode,
        rarity,
        colors,
        type,
        minCmc,
        maxCmc,
        sortBy: safeSortBy,
        sortOrder: safeSortOrder
      }
    }, `Found ${totalCards} cards`);

  } catch (error) {
    console.error('💥 Database browse error:', error);
    return createErrorResponse(error, 'Failed to browse cards');
  }
});
