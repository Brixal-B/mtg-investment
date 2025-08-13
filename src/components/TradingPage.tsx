"use client";
import React, { useState, useEffect } from 'react';
import { Trade, TradeCard, UserProfile, mockUsers, mockTradeCards } from '@/types/trading';
import { MTGCard } from '@/types';
import UserSearch from '@/components/trading/UserSearch';
import CardSearchModal from '@/components/trading/CardSearchModal';
import TradeOfferSection from '@/components/trading/TradeOfferSection';
import TradeControls from '@/components/trading/TradeControls';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/Toast';
import { Search, Plus, X, User, Star, Clock, DollarSign, MessageSquare, Loader2 } from 'lucide-react';

interface TradingPageProps {
  currentUserId?: string;
  tradeId?: string;
}

const TradingPage: React.FC<TradingPageProps> = ({ 
  currentUserId = 'user1', 
  tradeId 
}) => {
  const toast = useToast();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showUserSearch, setShowUserSearch] = useState(!tradeId);
  const [showCardSearch, setShowCardSearch] = useState({ initiator: false, recipient: false });
  const [searchQuery, setSearchQuery] = useState('');
  const [cardSearchQuery, setCardSearchQuery] = useState('');
  const [activeTrader, setActiveTrader] = useState<'initiator' | 'recipient'>('initiator');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [availableCards, setAvailableCards] = useState<MTGCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load users for search
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await fetch(`/api/users?exclude=${currentUserId}&search=${searchQuery}`);
        const data = await response.json();
        setUsers(data.users || []);
      } catch (error) {
        console.error('Failed to load users:', error);
      }
    };

    if (showUserSearch) {
      loadUsers();
    }
  }, [showUserSearch, searchQuery, currentUserId]);

  // Load available cards for search
  useEffect(() => {
    const loadCards = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/trades/cards?q=${cardSearchQuery}&limit=20`);
        const data = await response.json();
        setAvailableCards(data.cards || []);
      } catch (error) {
        console.error('Failed to load cards:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (showCardSearch.initiator || showCardSearch.recipient) {
      loadCards();
    }
  }, [showCardSearch, cardSearchQuery]);

  // Initialize trade or load existing
  useEffect(() => {
    if (tradeId) {
      // Load existing trade (mock for now)
      setTrade(generateMockTrade());
    }
  }, [tradeId]);

  const generateMockTrade = (): Trade => ({
    id: 'trade-123',
    initiatorId: currentUserId,
    recipientId: 'user2',
    status: 'proposed',
    initiatorOffer: {
      userId: currentUserId,
      userName: 'Current User',
      cards: [],
      totalValue: 0
    },
    recipientOffer: {
      userId: 'user2',
      userName: 'Power Nine Trader',
      cards: [],
      totalValue: 0
    },
    tradeBalance: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: []
  });

  const startTrade = async (user: UserProfile) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'create_trade',
          initiatorId: currentUserId,
          recipientId: user.id
        })
      });

      if (response.ok) {
        const newTrade = await response.json();
        setTrade(newTrade);
        setSelectedUser(user);
        setShowUserSearch(false);
      } else {
        console.error('Failed to create trade');
      }
    } catch (error) {
      console.error('Error creating trade:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addCardToTrade = async (card: MTGCard, trader: 'initiator' | 'recipient') => {
    if (!trade) return;

    const tradeCard: TradeCard = {
      card,
      quantity: 1,
      condition: 'near_mint',
      foil: false,
      estimatedValue: Math.random() * 100 + 10, // Mock price for now
      notes: ''
    };

    try {
      const response = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'add_card',
          tradeId: trade.id,
          cardData: tradeCard,
          trader
        })
      });

      if (response.ok) {
        const updatedTrade = await response.json();
        setTrade(updatedTrade);
        setShowCardSearch({ initiator: false, recipient: false });
      }
    } catch (error) {
      console.error('Error adding card to trade:', error);
    }
  };

  const removeCardFromTrade = async (cardIndex: number, trader: 'initiator' | 'recipient') => {
    if (!trade) return;

    try {
      const response = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'remove_card',
          tradeId: trade.id,
          cardIndex,
          trader
        })
      });

      if (response.ok) {
        const updatedTrade = await response.json();
        setTrade(updatedTrade);
      }
    } catch (error) {
      console.error('Error removing card from trade:', error);
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCards = availableCards.filter(card =>
    card.name.toLowerCase().includes(cardSearchQuery.toLowerCase()) ||
    card.setName?.toLowerCase().includes(cardSearchQuery.toLowerCase())
  );

  if (showUserSearch) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold text-gray-900">Start a New Trade</h1>
            <p className="text-gray-600 mt-2">Search for a user to trade with</p>
          </div>

          <div className="p-6">
            <div className="relative mb-6">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by username or display name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors"
                  onClick={() => startTrade(user)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{user.displayName}</h3>
                      <p className="text-sm text-gray-600">@{user.username}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600">{user.tradeRating}</span>
                        </div>
                        <span className="text-sm text-gray-600">{user.completedTrades} trades</span>
                        <div className="flex items-center space-x-1">
                          <div className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-green-400' : 'bg-gray-400'}`} />
                          <span className="text-sm text-gray-600">
                            {user.isOnline ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    disabled={isLoading}
                    onClick={() => startTrade(user)}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <span>Start Trade</span>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!trade) return null;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Trade Proposal</h1>
              <p className="text-gray-600 mt-1">
                Trade between you and {trade.recipientOffer.userName}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                trade.status === 'proposed' ? 'bg-yellow-100 text-yellow-800' :
                trade.status === 'accepted' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {trade.status.replace('_', ' ').toUpperCase()}
              </span>
              <button className="text-gray-400 hover:text-gray-600">
                <MessageSquare className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Trade Interface */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Initiator Side */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Your Offer</h2>
                <button
                  onClick={() => {
                    setActiveTrader('initiator');
                    setShowCardSearch({ ...showCardSearch, initiator: true });
                  }}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Card</span>
                </button>
              </div>

              <div className="space-y-2">
                {trade.initiatorOffer.cards.map((tradeCard, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{tradeCard.card.name}</h3>
                      <p className="text-sm text-gray-600">{tradeCard.card.setName}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-gray-600">Qty: {tradeCard.quantity}</span>
                        <span className="text-sm text-gray-600">{tradeCard.condition}</span>
                        {tradeCard.foil && <span className="text-sm text-yellow-600">Foil</span>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-semibold text-green-600">
                        ${tradeCard.estimatedValue.toFixed(2)}
                      </span>
                      <button
                        onClick={() => removeCardFromTrade(index, 'initiator')}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {trade.initiatorOffer.cards.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No cards added yet. Click "Add Card" to start your offer.
                  </div>
                )}
              </div>
            </div>

            {/* Recipient Side */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {trade.recipientOffer.userName}'s Offer
                </h2>
                <button
                  onClick={() => {
                    setActiveTrader('recipient');
                    setShowCardSearch({ ...showCardSearch, recipient: true });
                  }}
                  className="flex items-center space-x-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Card</span>
                </button>
              </div>

              <div className="space-y-2">
                {trade.recipientOffer.cards.map((tradeCard, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{tradeCard.card.name}</h3>
                      <p className="text-sm text-gray-600">{tradeCard.card.setName}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-gray-600">Qty: {tradeCard.quantity}</span>
                        <span className="text-sm text-gray-600">{tradeCard.condition}</span>
                        {tradeCard.foil && <span className="text-sm text-yellow-600">Foil</span>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-semibold text-green-600">
                        ${tradeCard.estimatedValue.toFixed(2)}
                      </span>
                      <button
                        onClick={() => removeCardFromTrade(index, 'recipient')}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {trade.recipientOffer.cards.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No cards added yet. Click "Add Card" to add to their offer.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Trade Summary */}
          <div className="mt-8 p-6 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-600">Your Total</span>
                </div>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  ${trade.initiatorOffer.totalValue.toFixed(2)}
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-sm font-medium text-gray-600">Trade Balance</span>
                </div>
                <p className={`text-2xl font-bold mt-1 ${
                  trade.tradeBalance > 0 ? 'text-green-600' : 
                  trade.tradeBalance < 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {trade.tradeBalance > 0 ? '+' : ''}${trade.tradeBalance.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {trade.tradeBalance > 0 ? 'You receive more value' :
                   trade.tradeBalance < 0 ? 'They receive more value' : 'Equal value trade'}
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center space-x-2">
                  <DollarSign className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-600">Their Total</span>
                </div>
                <p className="text-2xl font-bold text-gray-600 mt-1">
                  ${trade.recipientOffer.totalValue.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex justify-center space-x-4 mt-6">
              <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                Propose Trade
              </button>
              <button className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                Save Draft
              </button>
              <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      <CardSearchModal
        isOpen={showCardSearch.initiator || showCardSearch.recipient}
        onClose={() => setShowCardSearch({ initiator: false, recipient: false })}
        searchQuery={cardSearchQuery}
        setSearchQuery={setCardSearchQuery}
        cards={filteredCards}
        isLoading={isLoading}
        onCardSelect={(card) => addCardToTrade(card, activeTrader)}
        traderName={showCardSearch.initiator ? 'Your' : (selectedUser?.username || 'Trader')}
      />
    </div>
  );
};

export default TradingPage;
