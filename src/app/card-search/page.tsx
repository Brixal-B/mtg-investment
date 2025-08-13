"use client";
import React, { useState, useEffect } from 'react';
import { MTGCard } from '@/types';

// Mock card database for demonstration - in a real app, this would come from your API
const mockCardDatabase: MTGCard[] = [
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
    name: 'Black Lotus',
    setCode: 'LEA',
    setName: 'Limited Edition Alpha',
    rarity: 'Rare',
    typeLine: 'Artifact',
    manaCost: '{0}',
    cmc: 0,
    oracleText: '{T}, Sacrifice Black Lotus: Add three mana of any one color.'
  },
  {
    uuid: '5',
    name: 'Force of Will',
    setCode: 'ALL',
    setName: 'Alliances',
    rarity: 'Uncommon',
    typeLine: 'Instant',
    manaCost: '{3}{U}{U}',
    cmc: 5,
    oracleText: 'You may pay 1 life and exile a blue card from your hand rather than pay this spell\'s mana cost. Counter target spell.'
  }
];

export default function CardSearchPage() {
  const [cards, setCards] = useState<MTGCard[]>([]);
  const [filteredCards, setFilteredCards] = useState<MTGCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [setFilter, setSetFilter] = useState('');
  const [rarityFilter, setRarityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    // Simulate loading cards from API
    setTimeout(() => {
      setCards(mockCardDatabase);
      setFilteredCards(mockCardDatabase);
      setLoading(false);
    }, 500);
  }, []);

  useEffect(() => {
    // Filter cards based on search criteria
    let filtered = cards;

    if (searchQuery) {
      filtered = filtered.filter(card => 
        card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (card.oracleText && card.oracleText.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (setFilter) {
      filtered = filtered.filter(card => 
        card.setCode.toLowerCase().includes(setFilter.toLowerCase()) ||
        card.setName.toLowerCase().includes(setFilter.toLowerCase())
      );
    }

    if (rarityFilter) {
      filtered = filtered.filter(card => 
        card.rarity?.toLowerCase() === rarityFilter.toLowerCase()
      );
    }

    if (typeFilter) {
      filtered = filtered.filter(card => 
        card.typeLine?.toLowerCase().includes(typeFilter.toLowerCase())
      );
    }

    setFilteredCards(filtered);
  }, [cards, searchQuery, setFilter, rarityFilter, typeFilter]);

  const rarities = ['Common', 'Uncommon', 'Rare', 'Mythic'];
  const types = ['Artifact', 'Creature', 'Enchantment', 'Instant', 'Land', 'Planeswalker', 'Sorcery'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-lg">Loading card database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Card Search</h1>
          <p className="text-gray-400">Search and explore Magic: The Gathering cards</p>
        </div>

        {/* Search Filters */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Card Name or Text</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cards..."
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Set</label>
              <input
                type="text"
                value={setFilter}
                onChange={(e) => setSetFilter(e.target.value)}
                placeholder="Set name or code..."
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Rarity</label>
              <select
                value={rarityFilter}
                onChange={(e) => setRarityFilter(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
              >
                <option value="">All Rarities</option>
                {rarities.map(rarity => (
                  <option key={rarity} value={rarity}>{rarity}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
              >
                <option value="">All Types</option>
                {types.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Showing {filteredCards.length} of {cards.length} cards
            </div>
            <button
              onClick={() => {
                setSearchQuery('');
                setSetFilter('');
                setRarityFilter('');
                setTypeFilter('');
              }}
              className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCards.map((card) => (
            <div key={card.uuid} className="bg-gray-900 rounded-lg border border-gray-800 p-6 hover:border-gray-700 transition-colors">
              {/* Card Image Placeholder */}
              <div className="w-full h-40 bg-gray-800 rounded border border-gray-700 flex items-center justify-center mb-4">
                <span className="text-gray-500 text-sm">Card Image</span>
              </div>

              {/* Card Info */}
              <div>
                <h3 className="text-lg font-semibold mb-2">{card.name}</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Mana Cost:</span>
                    <span className="font-mono">{card.manaCost || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Type:</span>
                    <span>{card.typeLine}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Rarity:</span>
                    <span className={`
                      ${card.rarity === 'Common' ? 'text-gray-300' : ''}
                      ${card.rarity === 'Uncommon' ? 'text-green-400' : ''}
                      ${card.rarity === 'Rare' ? 'text-yellow-400' : ''}
                      ${card.rarity === 'Mythic' ? 'text-red-400' : ''}
                    `}>
                      {card.rarity}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Set:</span>
                    <span className="text-right">{card.setCode}</span>
                  </div>
                </div>

                {/* Card Text */}
                {card.oracleText && (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <p className="text-xs text-gray-300 leading-relaxed">{card.oracleText}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-4 flex space-x-2">
                  <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-3 rounded">
                    Add to Deck
                  </button>
                  <button className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-xs py-2 px-3 rounded">
                    Add to Wishlist
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredCards.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">No cards found matching your search criteria</div>
            <button
              onClick={() => {
                setSearchQuery('');
                setSetFilter('');
                setRarityFilter('');
                setTypeFilter('');
              }}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded font-medium"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Admin Note */}
        <div className="mt-12 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
          <h3 className="text-blue-400 font-semibold mb-2">💡 Expand Your Card Database</h3>
          <p className="text-blue-300 text-sm">
            This is a demo card search with sample data. To access the full MTGJSON database with thousands of cards, 
            use the <a href="/admin" className="underline">Admin Tools</a> to download and import the complete card database.
          </p>
        </div>
      </div>
    </div>
  );
}
