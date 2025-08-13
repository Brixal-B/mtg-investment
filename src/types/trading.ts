// Trading system types for MTG card exchanges

import { MTGCard } from './index';

export interface TradeCard {
  card: MTGCard;
  quantity: number;
  condition: 'mint' | 'near_mint' | 'excellent' | 'good' | 'light_played' | 'played' | 'poor';
  foil: boolean;
  estimatedValue: number;
  notes?: string;
}

export interface TradeOffer {
  userId: string;
  userName: string;
  cards: TradeCard[];
  totalValue: number;
  notes?: string;
}

export interface Trade {
  id: string;
  initiatorId: string;
  recipientId: string;
  status: 'proposed' | 'counter_proposed' | 'accepted' | 'declined' | 'completed' | 'cancelled';
  initiatorOffer: TradeOffer;
  recipientOffer: TradeOffer;
  tradeBalance: number; // Positive means initiator gets more value, negative means recipient gets more
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  messages: TradeMessage[];
}

export interface TradeMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
  type: 'message' | 'system' | 'proposal' | 'counter_proposal';
}

export interface TradeSearchFilters {
  name: string;
  setCode?: string;
  rarity?: string;
  minPrice?: number;
  maxPrice?: number;
  userId?: string; // Filter by user's collection
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  tradeRating: number;
  completedTrades: number;
  isOnline: boolean;
  lastSeen: string;
}

// Mock data for development
export const mockUsers: UserProfile[] = [
  {
    id: 'user1',
    username: 'mtg_collector',
    displayName: 'MTG Collector',
    tradeRating: 4.8,
    completedTrades: 247,
    isOnline: true,
    lastSeen: new Date().toISOString()
  },
  {
    id: 'user2', 
    username: 'power9_trader',
    displayName: 'Power Nine Trader',
    tradeRating: 4.9,
    completedTrades: 189,
    isOnline: false,
    lastSeen: '2025-08-12T10:30:00Z'
  },
  {
    id: 'user3',
    username: 'vintage_master',
    displayName: 'Vintage Master',
    tradeRating: 5.0,
    completedTrades: 95,
    isOnline: true,
    lastSeen: new Date().toISOString()
  }
];

export const mockTradeCards: TradeCard[] = [
  {
    card: {
      uuid: '1',
      name: 'Black Lotus',
      setCode: 'LEA',
      setName: 'Limited Edition Alpha',
      rarity: 'Rare',
      typeLine: 'Artifact',
      manaCost: '{0}',
      cmc: 0,
      oracleText: '{T}, Sacrifice Black Lotus: Add three mana of any one color.'
    },
    quantity: 1,
    condition: 'excellent',
    foil: false,
    estimatedValue: 8500.00,
    notes: 'Slight edge wear, centered'
  },
  {
    card: {
      uuid: '2',
      name: 'Ancestral Recall',
      setCode: 'LEA',
      setName: 'Limited Edition Alpha',
      rarity: 'Rare',
      typeLine: 'Instant',
      manaCost: '{U}',
      cmc: 1,
      oracleText: 'Target player draws three cards.'
    },
    quantity: 1,
    condition: 'near_mint',
    foil: false,
    estimatedValue: 1800.00
  },
  {
    card: {
      uuid: '3',
      name: 'Lightning Bolt',
      setCode: 'M11',
      setName: 'Magic 2011',
      rarity: 'Common',
      typeLine: 'Instant',
      manaCost: '{R}',
      cmc: 1,
      oracleText: 'Lightning Bolt deals 3 damage to any target.'
    },
    quantity: 4,
    condition: 'near_mint',
    foil: true,
    estimatedValue: 12.00
  }
];
