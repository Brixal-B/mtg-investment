"use client";
import React, { useState, useEffect } from 'react';
import { Deck, DeckCard, DeckStats, MTGFormat, MTGCard } from '@/types';

interface DeckBuilderProps {
  initialDeck?: Deck;
}

// Mock card data for demonstration
const mockCards: MTGCard[] = [
  {
    uuid: '1',
    name: 'Lightning Bolt',
    setCode: 'M11',
    setName: 'Magic 2011',
    rarity: 'Common',
    typeLine: 'Instant',
    manaCost: '{R}',
    cmc: 1,
    oracleText: 'Lightning Bolt deals 3 damage to any target.'
  },
  {
    uuid: '2', 
    name: 'Counterspell',
    setCode: 'M25',
    setName: 'Masters 25',
    rarity: 'Common',
    typeLine: 'Instant',
    manaCost: '{U}{U}',
    cmc: 2,
    oracleText: 'Counter target spell.'
  },
  {
    uuid: '3',
    name: 'Serra Angel',
    setCode: 'M11',
    setName: 'Magic 2011', 
    rarity: 'Uncommon',
    typeLine: 'Creature — Angel',
    manaCost: '{3}{W}{W}',
    cmc: 5,
    oracleText: 'Flying, vigilance'
  },
  {
    uuid: '4',
    name: 'Dark Ritual',
    setCode: 'M25',
    setName: 'Masters 25',
    rarity: 'Common',
    typeLine: 'Instant',
    manaCost: '{B}',
    cmc: 1,
    oracleText: 'Add {B}{B}{B}.'
  },
  {
    uuid: '5',
    name: 'Giant Growth',
    setCode: 'M11',
    setName: 'Magic 2011',
    rarity: 'Common',
    typeLine: 'Instant',
    manaCost: '{G}',
    cmc: 1,
    oracleText: 'Target creature gets +3/+3 until end of turn.'
  }
];

const createEmptyDeck = (): Deck => ({
  id: '',
  userId: 'default',
  name: 'New Deck',
  format: 'standard',
  colors: [],
  mainboard: [],
  sideboard: [],
  tags: [],
  isPublic: false,
  totalValue: 0,
  ownedPercentage: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

export default function DeckBuilder({ initialDeck }: DeckBuilderProps) {
  const [deck, setDeck] = useState<Deck>(initialDeck || createEmptyDeck());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MTGCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<MTGCard | null>(null);
  const [activeTab, setActiveTab] = useState<'mainboard' | 'sideboard'>('mainboard');
  const [stats, setStats] = useState<DeckStats | null>(null);

  useEffect(() => {
    // Simulate card search
    if (searchQuery.length > 0) {
      const filtered = mockCards.filter(card => 
        card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (card.typeLine && card.typeLine.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setSearchResults(filtered);
    } else {
      setSearchResults(mockCards.slice(0, 5)); // Show some cards by default
    }
  }, [searchQuery]);

  useEffect(() => {
    // Calculate deck stats
    calculateDeckStats();
  }, [deck.mainboard, deck.sideboard]);

  const calculateDeckStats = () => {
    const allCards = [...deck.mainboard, ...deck.sideboard];
    const totalCards = allCards.reduce((sum, deckCard) => sum + deckCard.quantity, 0);
    
    // Calculate mana curve
    const manaCurve: { cmc: number; count: number }[] = [];
    for (let i = 0; i <= 10; i++) {
      const count = allCards.reduce((sum, deckCard) => {
        const card = mockCards.find(c => c.uuid === deckCard.cardUuid);
        const cmc = card?.cmc || 0;
        return cmc === i ? sum + deckCard.quantity : sum;
      }, 0);
      manaCurve.push({ cmc: i, count });
    }

    // Calculate color distribution
    const colorDistribution: { color: string; count: number }[] = [
      { color: 'White', count: 0 },
      { color: 'Blue', count: 0 },
      { color: 'Black', count: 0 },
      { color: 'Red', count: 0 },
      { color: 'Green', count: 0 },
      { color: 'Colorless', count: 0 }
    ];

    allCards.forEach(deckCard => {
      const card = mockCards.find(c => c.uuid === deckCard.cardUuid);
      if (card?.manaCost) {
        if (card.manaCost.includes('{W}')) colorDistribution[0].count += deckCard.quantity;
        if (card.manaCost.includes('{U}')) colorDistribution[1].count += deckCard.quantity;
        if (card.manaCost.includes('{B}')) colorDistribution[2].count += deckCard.quantity;
        if (card.manaCost.includes('{R}')) colorDistribution[3].count += deckCard.quantity;
        if (card.manaCost.includes('{G}')) colorDistribution[4].count += deckCard.quantity;
        if (!card.manaCost.includes('{W}') && !card.manaCost.includes('{U}') && 
            !card.manaCost.includes('{B}') && !card.manaCost.includes('{R}') && 
            !card.manaCost.includes('{G}')) {
          colorDistribution[5].count += deckCard.quantity;
        }
      }
    });

    // Calculate type distribution
    const typeDistribution: { type: string; count: number }[] = [];
    const typeMap = new Map<string, number>();
    
    allCards.forEach(deckCard => {
      const card = mockCards.find(c => c.uuid === deckCard.cardUuid);
      if (card?.typeLine) {
        const primaryType = card.typeLine.split(' — ')[0].split(' ')[0];
        typeMap.set(primaryType, (typeMap.get(primaryType) || 0) + deckCard.quantity);
      }
    });

    typeMap.forEach((count, type) => {
      typeDistribution.push({ type, count });
    });

    const averageCMC = allCards.reduce((sum, deckCard) => {
      const card = mockCards.find(c => c.uuid === deckCard.cardUuid);
      return sum + (card?.cmc || 0) * deckCard.quantity;
    }, 0) / (totalCards || 1);

    setStats({
      totalCards,
      totalValue: 0, // Would calculate from actual prices
      manaCurve,
      colorDistribution,
      typeDistribution,
      averageCMC,
      priceBreakdown: [],
      ownedCards: 0,
      missingCards: []
    });
  };

  const addCardToDeck = (card: MTGCard, quantity: number = 1) => {
    const target = activeTab === 'mainboard' ? 'mainboard' : 'sideboard';
    const existingIndex = deck[target].findIndex(dc => dc.cardUuid === card.uuid);
    
    if (existingIndex >= 0) {
      // Update existing card
      const updated = [...deck[target]];
      updated[existingIndex].quantity += quantity;
      setDeck(prev => ({ ...prev, [target]: updated }));
    } else {
      // Add new card
      const newDeckCard: DeckCard = {
        cardUuid: card.uuid,
        card,
        quantity
      };
      setDeck(prev => ({ ...prev, [target]: [...prev[target], newDeckCard] }));
    }
  };

  const removeCardFromDeck = (cardUuid: string, fromSideboard: boolean = false) => {
    const target = fromSideboard ? 'sideboard' : 'mainboard';
    setDeck(prev => ({
      ...prev,
      [target]: prev[target].filter(dc => dc.cardUuid !== cardUuid)
    }));
  };

  const updateCardQuantity = (cardUuid: string, newQuantity: number, fromSideboard: boolean = false) => {
    if (newQuantity <= 0) {
      removeCardFromDeck(cardUuid, fromSideboard);
      return;
    }

    const target = fromSideboard ? 'sideboard' : 'mainboard';
    setDeck(prev => ({
      ...prev,
      [target]: prev[target].map(dc => 
        dc.cardUuid === cardUuid ? { ...dc, quantity: newQuantity } : dc
      )
    }));
  };

  const handleSave = () => {
    console.log('Saving deck:', deck);
    // In a real app, this would save to the backend
    alert(`Deck "${deck.name}" saved!`);
  };

  const formatList = ['standard', 'pioneer', 'modern', 'legacy', 'vintage', 'commander', 'pauper'] as MTGFormat[];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <input
              type="text"
              value={deck.name}
              onChange={(e) => setDeck(prev => ({ ...prev, name: e.target.value }))}
              className="text-3xl font-bold bg-transparent border-none outline-none focus:bg-gray-900 rounded px-2 py-1"
              placeholder="Deck Name"
            />
            <div className="flex items-center space-x-4 mt-2">
              <select
                value={deck.format}
                onChange={(e) => setDeck(prev => ({ ...prev, format: e.target.value as MTGFormat }))}
                className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-sm"
              >
                {formatList.map(format => (
                  <option key={format} value={format} className="capitalize">
                    {format}
                  </option>
                ))}
              </select>
              <div className="text-sm text-gray-400">
                {deck.mainboard.reduce((sum, dc) => sum + dc.quantity, 0)} cards
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm font-medium"
            >
              Save Deck
            </button>
            <button className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm font-medium">
              Export
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Card Search */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Card Search</h3>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for cards..."
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm mb-4"
              />
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {searchResults.map(card => (
                  <div
                    key={card.uuid}
                    onClick={() => setSelectedCard(card)}
                    className="p-3 bg-gray-800 hover:bg-gray-700 rounded cursor-pointer border border-gray-700"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-sm">{card.name}</h4>
                        <p className="text-xs text-gray-400">{card.typeLine}</p>
                        <p className="text-xs text-gray-500">{card.setName}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-mono">{card.manaCost || ''}</div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addCardToDeck(card);
                          }}
                          className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded mt-1"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Deck Stats */}
            {stats && (
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                <h3 className="text-lg font-semibold mb-4">Deck Statistics</h3>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Mana Curve</h4>
                  <div className="flex items-end space-x-1 h-16">
                    {stats.manaCurve.slice(0, 8).map((point, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div 
                          className="bg-blue-400 w-full rounded-t"
                          style={{ 
                            height: `${Math.max(point.count * 4, 2)}px`,
                            maxHeight: '48px'
                          }}
                        />
                        <span className="text-xs text-gray-500 mt-1">{index}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Color Distribution</h4>
                  <div className="space-y-1">
                    {stats.colorDistribution.filter(c => c.count > 0).map((color, index) => (
                      <div key={index} className="flex items-center justify-between text-xs">
                        <span>{color.color}</span>
                        <span>{color.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Avg. CMC</h4>
                  <div className="text-lg font-semibold">{stats.averageCMC.toFixed(2)}</div>
                </div>
              </div>
            )}
          </div>

          {/* Deck Lists */}
          <div className="lg:col-span-2">
            {/* Deck Tabs */}
            <div className="flex space-x-4 mb-6">
              <button
                onClick={() => setActiveTab('mainboard')}
                className={`px-4 py-2 rounded text-sm font-medium ${
                  activeTab === 'mainboard'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Mainboard ({deck.mainboard.reduce((sum, dc) => sum + dc.quantity, 0)})
              </button>
              <button
                onClick={() => setActiveTab('sideboard')}
                className={`px-4 py-2 rounded text-sm font-medium ${
                  activeTab === 'sideboard'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Sideboard ({deck.sideboard.reduce((sum, dc) => sum + dc.quantity, 0)})
              </button>
            </div>

            {/* Deck List */}
            <div className="bg-gray-900 rounded-lg border border-gray-800">
              <div className="p-4 border-b border-gray-800">
                <h3 className="text-lg font-semibold capitalize">{activeTab}</h3>
              </div>
              <div className="p-4">
                {(activeTab === 'mainboard' ? deck.mainboard : deck.sideboard).length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <p>No cards in {activeTab}</p>
                    <p className="text-sm">Search and add cards to get started</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(activeTab === 'mainboard' ? deck.mainboard : deck.sideboard).map((deckCard, index) => {
                      const card = mockCards.find(c => c.uuid === deckCard.cardUuid);
                      return (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded border border-gray-700">
                          <div className="flex items-center space-x-3">
                            <input
                              type="number"
                              value={deckCard.quantity}
                              onChange={(e) => updateCardQuantity(
                                deckCard.cardUuid, 
                                parseInt(e.target.value) || 0, 
                                activeTab === 'sideboard'
                              )}
                              className="w-12 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                              min="0"
                              max="4"
                            />
                            <div>
                              <h4 className="font-medium text-sm">{card?.name || 'Unknown Card'}</h4>
                              <p className="text-xs text-gray-400">{card?.typeLine}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-mono text-gray-400">{card?.manaCost || ''}</span>
                            <button
                              onClick={() => removeCardFromDeck(deckCard.cardUuid, activeTab === 'sideboard')}
                              className="text-red-400 hover:text-red-300 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Card Detail Modal */}
        {selectedCard && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold">{selectedCard.name}</h3>
                <button
                  onClick={() => setSelectedCard(null)}
                  className="text-gray-400 hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-2 text-sm mb-4">
                <p><span className="text-gray-400">Type:</span> {selectedCard.typeLine}</p>
                <p><span className="text-gray-400">Mana Cost:</span> {selectedCard.manaCost || 'None'}</p>
                <p><span className="text-gray-400">Set:</span> {selectedCard.setName}</p>
                <p><span className="text-gray-400">Rarity:</span> {selectedCard.rarity}</p>
                {selectedCard.oracleText && (
                  <p><span className="text-gray-400">Text:</span> {selectedCard.oracleText}</p>
                )}
              </div>
              <button
                onClick={() => {
                  addCardToDeck(selectedCard);
                  setSelectedCard(null);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-medium"
              >
                Add to {activeTab}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
