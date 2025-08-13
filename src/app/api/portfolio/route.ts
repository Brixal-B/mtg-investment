import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { 
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling
} from '@/lib';
import Database from '@/lib/database';

// GET /api/portfolio - Get user portfolio data
export const GET = withErrorHandling(async (req: NextRequest): Promise<NextResponse> => {
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId') || 'default';

  try {
    // Get user's collection
    const collection = await Database.Collection.getUserCollection(userId);
    
    // Calculate portfolio metrics
    let totalValue = 0;
    let totalInvestment = 0;
    let totalCards = 0;
    let uniqueCards = 0;
    
    const topHoldings: any[] = [];
    const setDistribution = new Map<string, { value: number; count: number }>();
    const rarityDistribution = new Map<string, { value: number; count: number }>();
    
    for (const item of collection) {
      const quantity = item.quantity || 1;
      const purchasePrice = item.purchase_price || 0;
      
      // Get latest price for the card
      const latestPrice = await Database.Prices.getLatestPrice(item.uuid);
      const currentPrice = latestPrice?.price_usd || 0;
      
      const itemValue = currentPrice * quantity;
      const itemInvestment = purchasePrice * quantity;
      
      totalValue += itemValue;
      totalInvestment += itemInvestment;
      totalCards += quantity;
      uniqueCards++;
      
      // Add to top holdings
      if (itemValue > 0) {
        topHoldings.push({
          cardName: item.name,
          quantity: quantity,
          currentPrice: currentPrice,
          totalValue: itemValue,
          percentOfPortfolio: 0, // Will calculate after total is known
          priceChange: {
            amount: currentPrice - purchasePrice,
            percentage: purchasePrice > 0 ? ((currentPrice - purchasePrice) / purchasePrice) * 100 : 0,
            period: '30d'
          },
          averageCost: purchasePrice,
          unrealizedGainLoss: itemValue - itemInvestment
        });
      }
      
      // Track distribution by set
      const setKey = item.set_name || 'Unknown Set';
      if (!setDistribution.has(setKey)) {
        setDistribution.set(setKey, { value: 0, count: 0 });
      }
      const setData = setDistribution.get(setKey)!;
      setData.value += itemValue;
      setData.count += quantity;
      
      // Track distribution by rarity
      const rarityKey = item.rarity || 'Unknown';
      if (!rarityDistribution.has(rarityKey)) {
        rarityDistribution.set(rarityKey, { value: 0, count: 0 });
      }
      const rarityData = rarityDistribution.get(rarityKey)!;
      rarityData.value += itemValue;
      rarityData.count += quantity;
    }
    
    // Calculate percentages for top holdings
    topHoldings.forEach(holding => {
      holding.percentOfPortfolio = totalValue > 0 ? (holding.totalValue / totalValue) * 100 : 0;
    });
    
    // Sort top holdings by value
    topHoldings.sort((a, b) => b.totalValue - a.totalValue);
    
    // Build diversification data
    const bySet = Array.from(setDistribution.entries()).map(([setName, data]) => ({
      setName,
      value: data.value,
      percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0
    })).sort((a, b) => b.value - a.value);
    
    const byRarity = Array.from(rarityDistribution.entries()).map(([rarity, data]) => ({
      rarity,
      value: data.value,
      percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0
    })).sort((a, b) => b.value - a.value);
    
    // Calculate performance metrics
    const unrealizedGains = totalValue - totalInvestment;
    const performanceChange = totalInvestment > 0 ? (unrealizedGains / totalInvestment) * 100 : 0;
    
    // Build portfolio response
    const portfolio = {
      totalValue: Math.round(totalValue * 100) / 100,
      totalCards,
      uniqueCards,
      totalInvestment: Math.round(totalInvestment * 100) / 100,
      unrealizedGains: Math.round(unrealizedGains * 100) / 100,
      realizedGains: 0, // TODO: Track actual sales
      portfolioPerformance: {
        period: '1m' as const,
        valueChange: unrealizedGains,
        percentageChange: performanceChange,
        benchmarkComparison: 0, // TODO: Compare to market
        volatility: 0, // TODO: Calculate volatility
        sharpeRatio: 0
      },
      topHoldings: topHoldings.slice(0, 10),
      diversification: {
        bySet: bySet.slice(0, 10),
        byRarity,
        byColor: [], // TODO: Extract color data from cards
        byType: [], // TODO: Extract type data from cards
        byFormat: [] // TODO: Calculate format legality
      },
      recentActivity: [] // TODO: Track recent transactions
    };

    return createSuccessResponse(portfolio, `Retrieved portfolio for user ${userId}`);
    
  } catch (error) {
    return createErrorResponse(error, 'Failed to retrieve portfolio data');
  }
});

// POST /api/portfolio - Add cards to collection
export const POST = withErrorHandling(async (req: NextRequest): Promise<NextResponse> => {
  try {
    const body = await req.json();
    const { userId = 'default', cards } = body;

    if (!cards || !Array.isArray(cards)) {
      return createErrorResponse(
        new Error('Invalid request body'),
        'Expected cards array in request body',
        400
      );
    }

    let processedCount = 0;
    const errors: string[] = [];

    for (const card of cards) {
      try {
        await Database.Collection.addToCollection(card.uuid, card.quantity || 1, {
          user_id: userId,
          condition: card.condition || 'near_mint',
          foil: card.foil || false,
          purchase_price: card.purchase_price || 0,
          purchase_date: card.purchase_date || new Date().toISOString().split('T')[0],
          notes: card.notes || null
        });
        processedCount++;
      } catch (error) {
        errors.push(`Failed to add card ${card.uuid}: ${(error as Error).message}`);
      }
    }

    const summary = {
      processedCards: processedCount,
      totalCards: cards.length,
      errors: errors.length,
      errorSample: errors.slice(0, 5)
    };

    return createSuccessResponse(
      summary,
      `Added ${processedCount} cards to collection`
    );

  } catch (error) {
    return createErrorResponse(error, 'Failed to add cards to collection');
  }
});