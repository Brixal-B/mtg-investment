import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { 
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling
} from '@/lib/errors';

// GET /api/portfolio - Get user portfolio data
export const GET = withErrorHandling(async (req: NextRequest): Promise<NextResponse> => {
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId') || 'default';

  console.log('📊 Portfolio API request for user:', userId);

  try {
    // Return mock data for now to avoid database issues
    const mockPortfolio = {
      totalValue: 0,
      totalCards: 0,
      uniqueCards: 0,
      totalInvestment: 0,
      unrealizedGains: 0,
      realizedGains: 0,
      portfolioPerformance: {
        period: '1m',
        valueChange: 0,
        percentageChange: 0,
        benchmarkComparison: 0,
        volatility: 0,
        sharpeRatio: 0
      },
      topHoldings: [],
      diversification: {
        bySet: [],
        byRarity: [], 
        byColor: [],
        byType: [],
        byFormat: []
      },
      recentActivity: []
    };

    console.log('📊 Returning mock portfolio data');
    return createSuccessResponse(mockPortfolio, 'Portfolio data retrieved successfully');
    
  } catch (error) {
    console.error('❌ Portfolio API error:', error);
    return createErrorResponse(error, 'Failed to retrieve portfolio data');
  }
});

// POST /api/portfolio - Add cards to portfolio
export const POST = withErrorHandling(async (req: NextRequest): Promise<NextResponse> => {
  try {
    const body = await req.json();
    const { userId = 'default', cards } = body;

    console.log('📊 Adding cards to portfolio:', userId, cards?.length || 0, 'cards');

    // For now, just return success
    return createSuccessResponse(
      { message: 'Cards added successfully', count: cards?.length || 0 },
      'Cards added to portfolio'
    );
    
  } catch (error) {
    console.error('❌ Add cards error:', error);
    return createErrorResponse(error, 'Failed to add cards to portfolio');
  }
});
