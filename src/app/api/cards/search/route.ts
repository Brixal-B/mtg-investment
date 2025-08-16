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

// GET /api/cards/search - Search for cards by name and optional set information
export const GET = withErrorHandling(async (req: NextRequest): Promise<NextResponse> => {
  // Handle both full URLs and relative paths for testing
  if (!req.url) {
    return createErrorResponse(
      new Error('Missing request URL'),
      'Invalid request',
      400
    );
  }
  
  const url = req.url.startsWith('http') ? req.url : `http://localhost${req.url}`;
  const { searchParams } = new URL(url);
  const name = searchParams.get('name');
  const setCode = searchParams.get('setCode');
  const setName = searchParams.get('setName');
  const limit = parseInt(searchParams.get('limit') || '10');

  console.log('🔍 Card search request:', { name, setCode, setName, limit });
  
  // Force recompilation for UNKNOWN set code fix

  if (!name) {
    return createErrorResponse(
      new Error('Missing name parameter'),
      'Card name is required for search',
      400
    );
  }

  try {
    const db = database;
    
    // Build search query with flexible matching
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
        oracle_text,
        image_uris,
        scryfall_id
      FROM cards 
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    // Name matching - use LIKE for fuzzy matching
    sql += ` AND (
      name LIKE ? COLLATE NOCASE 
      OR name LIKE ? COLLATE NOCASE
      OR name LIKE ? COLLATE NOCASE
    )`;
    params.push(name, `%${name}%`, `${name}%`);
    
    // Optional set filtering - skip if setCode is 'UNKNOWN'
    if (setCode && setCode.toUpperCase() !== 'UNKNOWN') {
      sql += ` AND set_code = ? COLLATE NOCASE`;
      params.push(setCode);
    }
    
    if (setName && !setCode) {
      sql += ` AND set_name LIKE ? COLLATE NOCASE`;
      params.push(`%${setName}%`);
    }
    
    // Order by relevance - exact name matches first, then partial matches
    sql += ` 
      ORDER BY 
        CASE 
          WHEN name = ? COLLATE NOCASE THEN 1
          WHEN name LIKE ? COLLATE NOCASE THEN 2
          ELSE 3
        END,
        set_code ASC,
        collector_number ASC
      LIMIT ?
    `;
    params.push(name, `${name}%`, limit);

    console.log('📊 Executing SQL:', sql);
    console.log('📊 With params:', params);

    const cards = await db.all(sql, params);
    console.log('📊 Found', cards.length, 'cards');

    // Process image URIs if they exist
    const processedCards = cards.map((card: any) => ({
      ...card,
      image_uris: card.image_uris ? JSON.parse(card.image_uris) : null
    }));

    return createSuccessResponse(
      processedCards,
      `Found ${processedCards.length} cards matching "${name}"`
    );

  } catch (error) {
    console.error('💥 Database search error:', error);
    return createErrorResponse(error, 'Failed to search for cards');
  }
});

// POST /api/cards/search - Batch search for multiple cards
export const POST = withErrorHandling(async (req: NextRequest): Promise<NextResponse> => {
  try {
    const body = await req.json();
    const { cards } = body;

    if (!cards || !Array.isArray(cards)) {
      return createErrorResponse(
        new Error('Invalid request body'),
        'Expected cards array in request body',
        400
      );
    }

    const db = database;
    const results = [];

    for (const searchCard of cards) {
      const { name, setCode, setName } = searchCard;
      
      if (!name) {
        results.push({
          search: searchCard,
          matches: [],
          error: 'Missing card name'
        });
        continue;
      }

      try {
        // Build search query for this card
        let sql = `
          SELECT 
            uuid,
            name,
            set_code,
            set_name,
            collector_number,
            rarity,
            type_line,
            image_uris
          FROM cards 
          WHERE name LIKE ? COLLATE NOCASE
        `;
        
        const params = [`%${name}%`];
        
        if (setCode && setCode.toUpperCase() !== 'UNKNOWN') {
          sql += ` AND set_code = ? COLLATE NOCASE`;
          params.push(setCode);
        }
        
        sql += ` ORDER BY 
          CASE 
            WHEN name = ? COLLATE NOCASE THEN 1
            ELSE 2
          END
          LIMIT 5
        `;
        params.push(name);

        const matches = await db.all(sql, params);
        
        results.push({
          search: searchCard,
          matches: matches.map((card: any) => ({
            ...card,
            image_uris: card.image_uris ? JSON.parse(card.image_uris) : null
          })),
          error: null
        });

      } catch (error) {
        results.push({
          search: searchCard,
          matches: [],
          error: error instanceof Error ? error.message : 'Search failed'
        });
      }
    }

    return createSuccessResponse(
      results,
      `Searched for ${cards.length} cards`
    );

  } catch (error) {
    return createErrorResponse(error, 'Failed to perform batch card search');
  }
});
