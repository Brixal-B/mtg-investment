/**
 * Collection Portfolio Types
 * Enhanced types for Magic player collection management
 */

import { MTGCard, CardFilter } from './mtg';

// Collection portfolio analytics
export interface CollectionPortfolio {
  totalValue: number;
  totalCards: number;
  uniqueCards: number;
  totalInvestment: number;
  unrealizedGains: number;
  realizedGains: number;
  portfolioPerformance: PortfolioPerformance;
  topHoldings: TopHolding[];
  diversification: DiversificationMetrics;
  recentActivity: RecentActivity[];
}

export interface PortfolioPerformance {
  period: '1d' | '1w' | '1m' | '3m' | '6m' | '1y' | 'all';
  valueChange: number;
  percentageChange: number;
  benchmarkComparison?: number; // vs market average
  volatility: number;
  sharpeRatio?: number;
}

export interface TopHolding {
  card: MTGCard;
  quantity: number;
  currentValue: number;
  percentOfPortfolio: number;
  priceChange: {
    amount: number;
    percentage: number;
    period: string;
  };
  averageCost: number;
  unrealizedGainLoss: number;
}

export interface DiversificationMetrics {
  bySet: { setName: string; value: number; percentage: number }[];
  byRarity: { rarity: string; value: number; percentage: number }[];
  byColor: { color: string; value: number; percentage: number }[];
  byType: { type: string; value: number; percentage: number }[];
  byFormat: { format: string; value: number; percentage: number }[];
}

export interface RecentActivity {
  id: string;
  type: 'purchase' | 'sale' | 'trade' | 'price_change';
  cardName: string;
  quantity: number;
  amount: number;
  date: string;
  description: string;
}

// Deck building types
export interface Deck {
  id: string;
  userId: string;
  name: string;
  format: MTGFormat;
  description?: string;
  colors: string[]; // Color identity
  mainboard: DeckCard[];
  sideboard: DeckCard[];
  maybeboard?: DeckCard[];
  tags: string[];
  isPublic: boolean;
  totalValue: number;
  ownedPercentage: number; // % of deck owned in collection
  createdAt: string;
  updatedAt: string;
}

export interface DeckCard {
  cardUuid: string;
  card?: MTGCard; // Populated when fetched
  quantity: number;
  isCommander?: boolean; // For Commander format
  categories?: string[]; // Custom categories like "removal", "card draw"
}

export interface DeckStats {
  totalCards: number;
  totalValue: number;
  manaCurve: { cmc: number; count: number }[];
  colorDistribution: { color: string; count: number }[];
  typeDistribution: { type: string; count: number }[];
  averageCMC: number;
  priceBreakdown: { priceRange: string; count: number }[];
  ownedCards: number;
  missingCards: DeckCard[];
}

export type MTGFormat = 
  | 'standard' 
  | 'pioneer' 
  | 'modern' 
  | 'legacy' 
  | 'vintage' 
  | 'commander' 
  | 'pauper' 
  | 'historic' 
  | 'alchemy' 
  | 'brawl' 
  | 'draft' 
  | 'sealed'
  | 'casual';

// Wishlist types
export interface WishlistItem {
  id: string;
  userId: string;
  cardUuid: string;
  card?: MTGCard; // Populated when fetched
  targetPrice?: number;
  priority: 1 | 2 | 3 | 4 | 5; // 1 = highest, 5 = lowest
  notes?: string;
  dateAdded: string;
  priceWhenAdded: number;
  currentPrice?: number;
  priceChange?: {
    amount: number;
    percentage: number;
  };
  tags: string[];
  alertsEnabled: boolean;
}

export interface PriceAlert {
  id: string;
  userId: string;
  cardUuid: string;
  targetPrice: number;
  alertType: 'below' | 'above' | 'change_percentage';
  isActive: boolean;
  createdAt: string;
  triggeredAt?: string;
  lastChecked: string;
}

// Market analysis types
export interface MarketTrend {
  cardUuid: string;
  card?: MTGCard;
  trend: 'bullish' | 'bearish' | 'neutral';
  confidence: number; // 0-100
  priceVelocity: number; // Rate of price change
  volume: number; // Trading volume indicator
  marketCap: number; // Total estimated market value
  support: number; // Support price level
  resistance: number; // Resistance price level
  signals: TrendSignal[];
}

export interface TrendSignal {
  type: 'technical' | 'fundamental' | 'social';
  indicator: string;
  strength: 'weak' | 'moderate' | 'strong';
  description: string;
}

// Collection analytics
export interface CollectionAnalytics {
  performance: {
    allTime: PortfolioPerformance;
    yearToDate: PortfolioPerformance;
    monthly: PortfolioPerformance[];
  };
  insights: CollectionInsight[];
  recommendations: CollectionRecommendation[];
  riskMetrics: RiskMetrics;
}

export interface CollectionInsight {
  type: 'gain' | 'loss' | 'trend' | 'opportunity' | 'risk';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
  cards?: string[]; // Card UUIDs related to insight
}

export interface CollectionRecommendation {
  type: 'buy' | 'sell' | 'hold' | 'diversify';
  title: string;
  description: string;
  expectedReturn: number;
  riskLevel: 'low' | 'medium' | 'high';
  timeHorizon: 'short' | 'medium' | 'long';
  cards: string[]; // Card UUIDs
  reasoning: string[];
}

export interface RiskMetrics {
  volatility: number;
  maxDrawdown: number;
  concentrationRisk: number; // % in top 10 holdings
  liquidityRisk: number; // Based on trading volume
  formatRisk: { format: string; risk: number }[];
}

// Advanced search types
export interface AdvancedCardFilter extends CardFilter {
  // Mana cost filters
  manaCost?: string; // Exact mana cost like "{2}{U}{U}"
  cmc?: { min?: number; max?: number };
  colors?: string[]; // Required colors
  colorIdentity?: string[]; // Color identity
  colorOperator?: 'and' | 'or' | 'exactly'; // How to match colors
  
  // Type filters
  types?: string[]; // Card types
  subtypes?: string[]; // Subtypes
  supertypes?: string[]; // Supertypes
  
  // Game data filters
  power?: { min?: number; max?: number };
  toughness?: { min?: number; max?: number };
  loyalty?: { min?: number; max?: number };
  
  // Format legality
  legalIn?: MTGFormat[];
  bannedIn?: MTGFormat[];
  
  // Market filters
  priceChange?: { 
    period: '1d' | '1w' | '1m' | '3m' | '6m' | '1y';
    min?: number; 
    max?: number;
  };
  
  // Collection filters
  owned?: boolean;
  ownedQuantity?: { min?: number; max?: number };
  inDecks?: string[]; // Deck IDs
  inWishlist?: boolean;
  
  // Text search
  oracleText?: string; // Search in card text
  flavorText?: string; // Search in flavor text
  artist?: string; // Artist name
  
  // Advanced options
  sortBy?: 'name' | 'cmc' | 'price' | 'priceChange' | 'releaseDate' | 'edhrec';
  sortOrder?: 'asc' | 'desc';
  excludeReprints?: boolean;
  includeDigital?: boolean;
}

// User preferences and settings
export interface UserPreferences {
  userId: string;
  defaultCurrency: 'USD' | 'EUR' | 'GBP';
  priceDisplayFormat: 'actual' | 'rounded' | 'abbreviated';
  collectionPrivacy: 'public' | 'friends' | 'private';
  emailAlerts: boolean;
  pushNotifications: boolean;
  darkMode: boolean;
  defaultFormat: MTGFormat;
  autoBackup: boolean;
  analyticsEnabled: boolean;
  betaFeatures: boolean;
}

// Import this in the main types index
export * from './mtg';
export * from './api';
export * from './components';
