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

// GET /api/cards/filters - Get available filter options for card browsing
export const GET = withErrorHandling(async (req: NextRequest): Promise<NextResponse> => {
  const { searchParams } = new URL(req.url);
  const setCode = searchParams.get('setCode'); // Optional: get filters for specific set

  console.log('🔍 Filters request for set:', setCode || 'all sets');

  try {
    const db = database;
    
    // Build base WHERE clause
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    
    if (setCode) {
      whereClause += ' AND set_code = ? COLLATE NOCASE';
      params.push(setCode);
    }
    
    // Get rarities
    const raritiesQuery = `
      SELECT DISTINCT rarity, COUNT(*) as count 
      FROM cards ${whereClause} AND rarity IS NOT NULL AND rarity != ''
      GROUP BY rarity 
      ORDER BY 
        CASE rarity
          WHEN 'mythic' THEN 1
          WHEN 'rare' THEN 2
          WHEN 'uncommon' THEN 3
          WHEN 'common' THEN 4
          ELSE 5
        END
    `;
    
    // Get card types (extract main types from type_line)
    const typesQuery = `
      SELECT DISTINCT 
        CASE 
          WHEN type_line LIKE '%Creature%' THEN 'Creature'
          WHEN type_line LIKE '%Instant%' THEN 'Instant'
          WHEN type_line LIKE '%Sorcery%' THEN 'Sorcery'
          WHEN type_line LIKE '%Enchantment%' THEN 'Enchantment'
          WHEN type_line LIKE '%Artifact%' THEN 'Artifact'
          WHEN type_line LIKE '%Planeswalker%' THEN 'Planeswalker'
          WHEN type_line LIKE '%Land%' THEN 'Land'
          WHEN type_line LIKE '%Battle%' THEN 'Battle'
          ELSE 'Other'
        END as main_type,
        COUNT(*) as count
      FROM cards ${whereClause} AND type_line IS NOT NULL
      GROUP BY main_type
      ORDER BY count DESC
    `;
    
    // Get CMC range
    const cmcQuery = `
      SELECT 
        MIN(cmc) as min_cmc,
        MAX(cmc) as max_cmc,
        COUNT(DISTINCT cmc) as unique_cmc_count
      FROM cards ${whereClause} AND cmc IS NOT NULL
    `;
    
    // Get colors
    const colorsQuery = `
      SELECT DISTINCT 
        colors,
        COUNT(*) as count
      FROM cards ${whereClause} AND colors IS NOT NULL AND colors != '[]'
      GROUP BY colors
      ORDER BY count DESC
      LIMIT 20
    `;
    
    // Get sets (if not filtering by specific set)
    let setsQuery = '';
    let setsParams: any[] = [];
    if (!setCode) {
      setsQuery = `
        SELECT DISTINCT 
          set_code,
          set_name,
          COUNT(*) as count
        FROM cards
        GROUP BY set_code, set_name
        ORDER BY count DESC, set_name ASC
        LIMIT 50
      `;
    }

    console.log('📊 Executing filters queries...');

    // Execute all queries
    const [rarities, types, cmcRange, colors] = await Promise.all([
      db.all(raritiesQuery, params),
      db.all(typesQuery, params),
      db.get(cmcQuery, params),
      db.all(colorsQuery, params)
    ]);
    
    let sets: any[] = [];
    if (!setCode && setsQuery) {
      sets = await db.all(setsQuery, setsParams);
    }

    // Process colors data
    const processedColors = colors.map((color: any) => {
      let colorArray: string[] = [];
      try {
        colorArray = JSON.parse(color.colors);
      } catch {
        colorArray = [];
      }
      
      return {
        colors: colorArray,
        colorString: colorArray.join(''),
        count: color.count,
        displayName: colorArray.length === 0 ? 'Colorless' : 
                    colorArray.length === 1 ? colorArray[0] :
                    `${colorArray.length} colors (${colorArray.join('')})`
      };
    }).filter((color: any) => color.colors.length <= 5); // Filter out invalid entries

    const filterOptions = {
      rarities: rarities.map((r: any) => ({
        value: r.rarity,
        label: r.rarity.charAt(0).toUpperCase() + r.rarity.slice(1),
        count: r.count
      })),
      types: types.filter((t: any) => t.main_type !== 'Other').map((t: any) => ({
        value: t.main_type,
        label: t.main_type,
        count: t.count
      })),
      cmcRange: {
        min: cmcRange?.min_cmc || 0,
        max: cmcRange?.max_cmc || 20,
        uniqueValues: cmcRange?.unique_cmc_count || 0
      },
      colors: processedColors.slice(0, 10), // Top 10 most common color combinations
      sets: sets.map((s: any) => ({
        code: s.set_code,
        name: s.set_name,
        count: s.count
      }))
    };

    console.log('📊 Filter options prepared:', {
      rarities: filterOptions.rarities.length,
      types: filterOptions.types.length,
      colors: filterOptions.colors.length,
      sets: filterOptions.sets.length,
      cmcRange: filterOptions.cmcRange
    });

    return createSuccessResponse(
      filterOptions,
      `Filter options loaded for ${setCode || 'all sets'}`
    );

  } catch (error) {
    console.error('💥 Database filters error:', error);
    return createErrorResponse(error, 'Failed to load filter options');
  }
});
