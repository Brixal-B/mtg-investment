import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling } from '@/lib/errors';
import { CardOperations } from '@/lib/database';

export const GET = withErrorHandling(async (req: NextRequest): Promise<NextResponse> => {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') || '';
  const userId = searchParams.get('userId');
  const limit = parseInt(searchParams.get('limit') || '20');

  try {
    let cards;
    
    if (userId) {
      // Search within user's collection
      // For now, return mock data - in a real app this would query the user's collection
      cards = [
        {
          uuid: '1',
          name: 'Black Lotus',
          setCode: 'LEA',
          setName: 'Limited Edition Alpha',
          rarity: 'Rare',
          typeLine: 'Artifact',
          manaCost: '{0}',
          cmc: 0,
          oracleText: '{T}, Sacrifice Black Lotus: Add three mana of any one color.',
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
          manaCost: '{U}',
          cmc: 1,
          oracleText: 'Target player draws three cards.',
          quantity: 1,
          condition: 'near_mint',
          estimatedValue: 1800.00
        },
        {
          uuid: '3',
          name: 'Mox Ruby',
          setCode: 'LEA',
          setName: 'Limited Edition Alpha',
          rarity: 'Rare',
          typeLine: 'Artifact',
          manaCost: '{0}',
          cmc: 0,
          oracleText: '{T}: Add {R}.',
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
          manaCost: '{3}{U}{U}',
          cmc: 5,
          oracleText: 'You may pay 1 life and exile a blue card from your hand rather than pay this spell\'s mana cost.',
          quantity: 2,
          condition: 'near_mint',
          estimatedValue: 120.00
        },
        {
          uuid: '5',
          name: 'Lightning Bolt',
          setCode: 'M11',
          setName: 'Magic 2011',
          rarity: 'Common',
          typeLine: 'Instant',
          manaCost: '{R}',
          cmc: 1,
          oracleText: 'Lightning Bolt deals 3 damage to any target.',
          quantity: 4,
          condition: 'near_mint',
          estimatedValue: 3.00
        }
      ].filter(card => 
        card.name.toLowerCase().includes(query.toLowerCase()) ||
        card.setName.toLowerCase().includes(query.toLowerCase())
      ).slice(0, limit);
    } else {
      // Search all available cards
      if (query) {
        const searchResults = await CardOperations.searchCards(query, limit);
        cards = searchResults.map(card => ({
          ...card,
          quantity: 1,
          condition: 'near_mint',
          estimatedValue: Math.random() * 100 + 1 // Mock pricing
        }));
      } else {
        // Return some popular cards for browsing
        cards = [
          {
            uuid: '6',
            name: 'Counterspell',
            setCode: 'LEA',
            setName: 'Limited Edition Alpha',
            rarity: 'Uncommon',
            typeLine: 'Instant',
            manaCost: '{U}{U}',
            cmc: 2,
            oracleText: 'Counter target spell.',
            quantity: 1,
            condition: 'near_mint',
            estimatedValue: 45.00
          },
          {
            uuid: '7',
            name: 'Dark Ritual',
            setCode: 'LEA',
            setName: 'Limited Edition Alpha',
            rarity: 'Common',
            typeLine: 'Instant',
            manaCost: '{B}',
            cmc: 1,
            oracleText: 'Add {B}{B}{B}.',
            quantity: 1,
            condition: 'near_mint',
            estimatedValue: 25.00
          },
          {
            uuid: '8',
            name: 'Serra Angel',
            setCode: 'LEA',
            setName: 'Limited Edition Alpha',
            rarity: 'Uncommon',
            typeLine: 'Creature — Angel',
            manaCost: '{3}{W}{W}',
            cmc: 5,
            oracleText: 'Flying, vigilance',
            quantity: 1,
            condition: 'near_mint',
            estimatedValue: 35.00
          }
        ].filter(card => 
          !query || 
          card.name.toLowerCase().includes(query.toLowerCase()) ||
          card.setName.toLowerCase().includes(query.toLowerCase())
        ).slice(0, limit);
      }
    }

    return NextResponse.json({
      cards,
      total: cards.length,
      query,
      userId
    });

  } catch (error) {
    console.error('Error searching cards for trade:', error);
    return NextResponse.json(
      { error: 'Failed to search cards' },
      { status: 500 }
    );
  }
});
