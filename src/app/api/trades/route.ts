import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling } from '@/lib/errors';

// Mock data store for development
const trades = new Map();
const userCollections = new Map();

// Initialize with some mock data
userCollections.set('user1', [
  {
    uuid: '1',
    name: 'Black Lotus',
    setCode: 'LEA',
    setName: 'Limited Edition Alpha',
    rarity: 'Rare',
    typeLine: 'Artifact',
    quantity: 1,
    condition: 'excellent',
    estimatedValue: 8500.00
  },
  {
    uuid: '2',
    name: 'Ancestral Recall',
    setCode: 'LEA',
    setName: 'Limited Edition Alpha',
    rarity: 'Rare',
    typeLine: 'Instant',
    quantity: 1,
    condition: 'near_mint',
    estimatedValue: 1800.00
  }
]);

userCollections.set('user2', [
  {
    uuid: '3',
    name: 'Mox Ruby',
    setCode: 'LEA',
    setName: 'Limited Edition Alpha',
    rarity: 'Rare',
    typeLine: 'Artifact',
    quantity: 1,
    condition: 'good',
    estimatedValue: 2200.00
  },
  {
    uuid: '4',
    name: 'Force of Will',
    setCode: 'ALL',
    setName: 'Alliances',
    rarity: 'Uncommon',
    typeLine: 'Instant',
    quantity: 2,
    condition: 'near_mint',
    estimatedValue: 120.00
  }
]);

export const GET = withErrorHandling(async (req: NextRequest): Promise<NextResponse> => {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const tradeId = searchParams.get('tradeId');

  if (tradeId) {
    // Get specific trade
    const trade = trades.get(tradeId);
    if (!trade) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
    }
    return NextResponse.json(trade);
  }

  if (userId) {
    // Get user's trades
    const userTrades = Array.from(trades.values()).filter(
      (trade: any) => trade.initiatorId === userId || trade.recipientId === userId
    );
    return NextResponse.json(userTrades);
  }

  // Get all trades
  return NextResponse.json(Array.from(trades.values()));
});

export const POST = withErrorHandling(async (req: NextRequest): Promise<NextResponse> => {
  const body = await req.json();
  const { type, ...data } = body;

  switch (type) {
    case 'create_trade': {
      const { initiatorId, recipientId } = data;
      const tradeId = `trade_${Date.now()}`;
      
      const newTrade = {
        id: tradeId,
        initiatorId,
        recipientId,
        status: 'proposed',
        initiatorOffer: {
          userId: initiatorId,
          userName: 'Current User',
          cards: [],
          totalValue: 0
        },
        recipientOffer: {
          userId: recipientId,
          userName: 'Other User',
          cards: [],
          totalValue: 0
        },
        tradeBalance: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: []
      };

      trades.set(tradeId, newTrade);
      return NextResponse.json(newTrade, { status: 201 });
    }

    case 'add_card': {
      const { tradeId, cardData, trader } = data;
      const trade = trades.get(tradeId);
      
      if (!trade) {
        return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
      }

      if (trader === 'initiator') {
        trade.initiatorOffer.cards.push(cardData);
        trade.initiatorOffer.totalValue += cardData.estimatedValue;
      } else {
        trade.recipientOffer.cards.push(cardData);
        trade.recipientOffer.totalValue += cardData.estimatedValue;
      }

      trade.tradeBalance = trade.initiatorOffer.totalValue - trade.recipientOffer.totalValue;
      trade.updatedAt = new Date().toISOString();
      
      trades.set(tradeId, trade);
      return NextResponse.json(trade);
    }

    case 'remove_card': {
      const { tradeId, cardIndex, trader } = data;
      const trade = trades.get(tradeId);
      
      if (!trade) {
        return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
      }

      if (trader === 'initiator' && trade.initiatorOffer.cards[cardIndex]) {
        const removedCard = trade.initiatorOffer.cards[cardIndex];
        trade.initiatorOffer.cards.splice(cardIndex, 1);
        trade.initiatorOffer.totalValue -= removedCard.estimatedValue;
      } else if (trader === 'recipient' && trade.recipientOffer.cards[cardIndex]) {
        const removedCard = trade.recipientOffer.cards[cardIndex];
        trade.recipientOffer.cards.splice(cardIndex, 1);
        trade.recipientOffer.totalValue -= removedCard.estimatedValue;
      }

      trade.tradeBalance = trade.initiatorOffer.totalValue - trade.recipientOffer.totalValue;
      trade.updatedAt = new Date().toISOString();
      
      trades.set(tradeId, trade);
      return NextResponse.json(trade);
    }

    case 'update_status': {
      const { tradeId, status } = data;
      const trade = trades.get(tradeId);
      
      if (!trade) {
        return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
      }

      trade.status = status;
      trade.updatedAt = new Date().toISOString();
      
      if (status === 'completed') {
        trade.completedAt = new Date().toISOString();
      }
      
      trades.set(tradeId, trade);
      return NextResponse.json(trade);
    }

    default:
      return NextResponse.json({ error: 'Invalid operation type' }, { status: 400 });
  }
});

export const PUT = withErrorHandling(async (req: NextRequest): Promise<NextResponse> => {
  const body = await req.json();
  const { tradeId, ...updateData } = body;

  if (!tradeId) {
    return NextResponse.json({ error: 'Trade ID is required' }, { status: 400 });
  }

  const trade = trades.get(tradeId);
  if (!trade) {
    return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
  }

  // Update trade with new data
  Object.assign(trade, updateData, { updatedAt: new Date().toISOString() });
  trades.set(tradeId, trade);

  return NextResponse.json(trade);
});

export const DELETE = withErrorHandling(async (req: NextRequest): Promise<NextResponse> => {
  const { searchParams } = new URL(req.url);
  const tradeId = searchParams.get('tradeId');

  if (!tradeId) {
    return NextResponse.json({ error: 'Trade ID is required' }, { status: 400 });
  }

  if (!trades.has(tradeId)) {
    return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
  }

  trades.delete(tradeId);
  return NextResponse.json({ message: 'Trade deleted successfully' });
});
