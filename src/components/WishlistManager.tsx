"use client";
import React, { useState, useEffect } from 'react';
import { WishlistItem, MTGCard, PriceAlert } from '@/types';

interface WishlistManagerProps {
  userId?: string;
}

// Mock data for demonstration
const mockWishlistItems: WishlistItem[] = [
  {
    id: '1',
    userId: 'default',
    cardUuid: '1',
    card: {
      uuid: '1',
      name: 'Force of Will',
      setCode: 'EMA',
      setName: 'Eternal Masters',
      rarity: 'Mythic',
      typeLine: 'Instant',
      manaCost: '{3}{U}{U}',
      cmc: 5,
      oracleText: 'You may pay 1 life and exile a blue card from your hand rather than pay this spell\'s mana cost.'
    },
    targetPrice: 80.00,
    priority: 1,
    notes: 'For my Legacy deck',
    dateAdded: '2025-08-01',
    priceWhenAdded: 95.00,
    currentPrice: 87.50,
    priceChange: { amount: -7.50, percentage: -7.9 },
    tags: ['legacy', 'blue', 'instant'],
    alertsEnabled: true
  },
  {
    id: '2',
    userId: 'default',
    cardUuid: '2',
    card: {
      uuid: '2',
      name: 'Scalding Tarn',
      setCode: 'ZEN',
      setName: 'Zendikar',
      rarity: 'Rare',
      typeLine: 'Land',
      manaCost: '',
      cmc: 0,
      oracleText: '{T}, Pay 1 life, Sacrifice Scalding Tarn: Search your library for an Island or Mountain card, put it onto the battlefield, then shuffle.'
    },
    targetPrice: 15.00,
    priority: 2,
    notes: 'Need 4 copies for manabase',
    dateAdded: '2025-07-25',
    priceWhenAdded: 18.50,
    currentPrice: 17.25,
    priceChange: { amount: -1.25, percentage: -6.8 },
    tags: ['land', 'fetchland', 'modern'],
    alertsEnabled: true
  },
  {
    id: '3',
    userId: 'default',
    cardUuid: '3',
    card: {
      uuid: '3',
      name: 'Ragavan, Nimble Pilferer',
      setCode: 'MH2',
      setName: 'Modern Horizons 2',
      rarity: 'Mythic',
      typeLine: 'Legendary Creature — Monkey Pirate',
      manaCost: '{R}',
      cmc: 1,
      oracleText: 'Whenever Ragavan, Nimble Pilferer deals combat damage to a player, create a Treasure token and exile the top card of that player\'s library.'
    },
    targetPrice: 45.00,
    priority: 3,
    notes: 'Price too high right now',
    dateAdded: '2025-07-20',
    priceWhenAdded: 65.00,
    currentPrice: 52.00,
    priceChange: { amount: -13.00, percentage: -20.0 },
    tags: ['creature', 'red', 'modern'],
    alertsEnabled: false
  }
];

export default function WishlistManager({ userId = 'default' }: WishlistManagerProps) {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'priority' | 'dateAdded' | 'priceChange' | 'name'>('priority');
  const [filterBy, setFilterBy] = useState<'all' | 'alerts' | 'inRange'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setWishlistItems(mockWishlistItems);
      setLoading(false);
    }, 500);
  }, [userId]);

  const sortedAndFilteredItems = wishlistItems
    .filter(item => {
      if (filterBy === 'alerts') return item.alertsEnabled;
      if (filterBy === 'inRange') return (item.currentPrice || 0) <= (item.targetPrice || Infinity);
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          return a.priority - b.priority;
        case 'dateAdded':
          return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
        case 'priceChange':
          return (b.priceChange?.percentage || 0) - (a.priceChange?.percentage || 0);
        case 'name':
          return (a.card?.name || '').localeCompare(b.card?.name || '');
        default:
          return 0;
      }
    });

  const toggleAlert = (itemId: string) => {
    setWishlistItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, alertsEnabled: !item.alertsEnabled } : item
    ));
  };

  const updatePriority = (itemId: string, newPriority: 1 | 2 | 3 | 4 | 5) => {
    setWishlistItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, priority: newPriority } : item
    ));
  };

  const updateTargetPrice = (itemId: string, newTargetPrice: number) => {
    setWishlistItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, targetPrice: newTargetPrice } : item
    ));
  };

  const removeItem = (itemId: string) => {
    setWishlistItems(prev => prev.filter(item => item.id !== itemId));
  };

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const formatPercentage = (value: number) => 
    `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'text-red-400';
      case 2: return 'text-orange-400';
      case 3: return 'text-yellow-400';
      case 4: return 'text-blue-400';
      case 5: return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return 'Urgent';
      case 2: return 'High';
      case 3: return 'Medium';
      case 4: return 'Low';
      case 5: return 'Someday';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950 text-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-lg">Loading wishlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Wishlist</h1>
            <p className="text-gray-400">Track cards you want and get notified when prices drop</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-medium"
          >
            Add Card
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h3 className="text-gray-400 text-sm font-medium mb-2">Total Items</h3>
            <div className="text-2xl font-bold">{wishlistItems.length}</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h3 className="text-gray-400 text-sm font-medium mb-2">Active Alerts</h3>
            <div className="text-2xl font-bold text-blue-400">
              {wishlistItems.filter(item => item.alertsEnabled).length}
            </div>
          </div>
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h3 className="text-gray-400 text-sm font-medium mb-2">In Price Range</h3>
            <div className="text-2xl font-bold text-green-400">
              {wishlistItems.filter(item => (item.currentPrice || 0) <= (item.targetPrice || Infinity)).length}
            </div>
          </div>
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h3 className="text-gray-400 text-sm font-medium mb-2">Total Value</h3>
            <div className="text-2xl font-bold">
              {formatCurrency(wishlistItems.reduce((sum, item) => sum + (item.currentPrice || 0), 0))}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-6 bg-gray-900 rounded-lg p-4 border border-gray-800">
          <div className="flex items-center space-x-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-sm"
              >
                <option value="priority">Priority</option>
                <option value="dateAdded">Date Added</option>
                <option value="priceChange">Price Change</option>
                <option value="name">Name</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Filter</label>
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as any)}
                className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-sm"
              >
                <option value="all">All Items</option>
                <option value="alerts">With Alerts</option>
                <option value="inRange">In Price Range</option>
              </select>
            </div>
          </div>
          <div className="text-sm text-gray-400">
            {sortedAndFilteredItems.length} of {wishlistItems.length} items
          </div>
        </div>

        {/* Wishlist Items */}
        <div className="space-y-4">
          {sortedAndFilteredItems.map(item => (
            <div key={item.id} className="bg-gray-900 rounded-lg border border-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Card Image Placeholder */}
                  <div className="w-16 h-20 bg-gray-800 rounded border border-gray-700 flex items-center justify-center">
                    <span className="text-xs text-gray-500">IMG</span>
                  </div>

                  {/* Card Info */}
                  <div>
                    <h3 className="text-lg font-semibold">{item.card?.name}</h3>
                    <p className="text-sm text-gray-400">{item.card?.setName}</p>
                    <p className="text-xs text-gray-500">{item.card?.typeLine}</p>
                    
                    {/* Tags */}
                    <div className="flex items-center space-x-2 mt-2">
                      {item.tags.map((tag, index) => (
                        <span key={index} className="text-xs bg-gray-700 px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Price and Controls */}
                <div className="text-right space-y-2">
                  <div className="flex items-center space-x-4">
                    {/* Priority */}
                    <div>
                      <label className="text-xs text-gray-400 block">Priority</label>
                      <select
                        value={item.priority}
                        onChange={(e) => updatePriority(item.id, parseInt(e.target.value) as any)}
                        className={`bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs ${getPriorityColor(item.priority)}`}
                      >
                        <option value={1}>1 - Urgent</option>
                        <option value={2}>2 - High</option>
                        <option value={3}>3 - Medium</option>
                        <option value={4}>4 - Low</option>
                        <option value={5}>5 - Someday</option>
                      </select>
                    </div>

                    {/* Target Price */}
                    <div>
                      <label className="text-xs text-gray-400 block">Target Price</label>
                      <input
                        type="number"
                        value={item.targetPrice || ''}
                        onChange={(e) => updateTargetPrice(item.id, parseFloat(e.target.value) || 0)}
                        className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs w-20"
                        step="0.01"
                        min="0"
                      />
                    </div>

                    {/* Current Price */}
                    <div>
                      <label className="text-xs text-gray-400 block">Current Price</label>
                      <div className="text-sm font-semibold">
                        {formatCurrency(item.currentPrice || 0)}
                      </div>
                      <div className={`text-xs ${
                        (item.priceChange?.amount || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {item.priceChange?.amount ? formatCurrency(item.priceChange.amount) : ''} 
                        {item.priceChange?.percentage ? ` (${formatPercentage(item.priceChange.percentage)})` : ''}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleAlert(item.id)}
                      className={`text-xs px-3 py-1 rounded ${
                        item.alertsEnabled
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {item.alertsEnabled ? 'Alert ON' : 'Alert OFF'}
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                    >
                      Remove
                    </button>
                  </div>

                  {/* Alert Status */}
                  {item.alertsEnabled && (item.currentPrice || 0) <= (item.targetPrice || Infinity) && (
                    <div className="text-xs text-green-400 bg-green-900/20 px-2 py-1 rounded">
                      🎯 Target price reached!
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {item.notes && (
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <p className="text-sm text-gray-400">{item.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {sortedAndFilteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No items in your wishlist</p>
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded font-medium"
            >
              Add Your First Card
            </button>
          </div>
        )}

        {/* Add Card Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Add Card to Wishlist</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">Card search functionality would go here</p>
                <p className="text-sm text-gray-500">This would integrate with the card database to search and add cards</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
                >
                  Add Card
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
