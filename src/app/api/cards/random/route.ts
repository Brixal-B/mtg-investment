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

// GET /api/cards/random - Get random cards for discovery
export const GET = withErrorHandling(async (req: NextRequest): Promise<NextResponse> => {
  const { searchParams } = new URL(req.url);
  
  const count = Math.min(parseInt(searchParams.get('count') || '10'), 50); // Max 50 random cards
  const setCode = searchParams.get('setCode');
  const rarity = searchParams.get('rarity');
  const type = searchParams.get('type');
  const colors = searchParams.get('colors');
  const minCmc = searchParams.get('minCmc');
  const maxCmc = searchParams.get('maxCmc');
  const hasImage = searchParams.get('hasImage') === 'true';

  console.log('🎲 Random cards request:', { 
    count, setCode, rarity, type, colors, minCmc, maxCmc, hasImage 
  });

  try {
    const db = database;
    
    // Build the query with filters
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
    
    if (type) {
      sql += ` AND type_line LIKE ? COLLATE NOCASE`;
      params.push(`%${type}%`);
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
    
    if (minCmc) {
      sql += ` AND cmc >= ?`;
      params.push(parseInt(minCmc));
    }
    
    if (maxCmc) {
      sql += ` AND cmc <= ?`;
      params.push(parseInt(maxCmc));
    }
    
    if (hasImage) {
      sql += ` AND image_uris IS NOT NULL AND image_uris != ''`;
    }
    
    // Add random ordering and limit
    sql += ` ORDER BY RANDOM() LIMIT ?`;
    params.push(count);

    console.log('📊 Executing random SQL:', sql);
    console.log('📊 With params:', params);

    const cards = await db.all(sql, params);
    console.log('📊 Found', cards.length, 'random cards');

    // Process the results
    const processedCards = cards.map((card: any) => ({
      ...card,
      image_uris: card.image_uris ? JSON.parse(card.image_uris) : null,
      colors: card.colors ? JSON.parse(card.colors) : [],
      color_identity: card.color_identity ? JSON.parse(card.color_identity) : []
    }));

    return createSuccessResponse({
      cards: processedCards,
      count: processedCards.length,
      filters: {
        setCode,
        rarity,
        type,
        colors,
        minCmc,
        maxCmc,
        hasImage
      }
    }, `Found ${processedCards.length} random cards`);

  } catch (error) {
    console.error('💥 Database random cards error:', error);
    return createErrorResponse(error, 'Failed to get random cards');
  }
});
