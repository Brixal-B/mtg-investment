/**
 * Core MTG Card and Price Types
 * Based on MTGJSON AllPrices.json structure and application usage
 */

// Basic card information as used in the application
export interface Card {
  name: string;
  imageUrl?: string;
  price?: string;
  set?: string;
  set_name?: string;
}

// Enhanced card with more complete MTG data
export interface MTGCard {
  uuid: string;
  name: string;
  setCode: string;
  setName: string;
  rarity?: string;
  typeLine?: string;
  type?: string; // legacy field, prefer typeLine
  manaCost?: string;
  cmc?: number; // converted mana cost
  oracleText?: string;
  text?: string; // legacy field, prefer oracleText
  imageUrl?: string;
  prices?: MTGCardPrices;
}

// MTGJSON Price Structure (as found in AllPrices.json)
export interface MTGCardPrices {
  paper?: {
    tcgplayer?: {
      retail?: {
        normal?: Record<string, number>; // date -> price
        foil?: Record<string, number>;
      };
    };
    cardkingdom?: {
      retail?: {
        normal?: Record<string, number>;
        foil?: Record<string, number>;
      };
    };
  };
  mtgo?: Record<string, number>;
  mtgoFoil?: Record<string, number>;
}

// Processed price data for our application
export interface ProcessedCardPrice {
  uuid: string;
  prices: Record<string, number>; // date -> price (YYYY-MM-DD format)
}

// Price history snapshot (as stored in /api/price-history)
export interface PriceSnapshot {
  date: string; // ISO date string
  cards: ProcessedCardPrice[];
}

// Card with calculated price information
export interface CardWithPrice extends MTGCard {
  currentPrice?: number;
  avgPrice?: number;
  priceHistory?: Record<string, number>;
  priceChange?: {
    amount: number;
    percentage: number;
    period: string; // e.g., "7d", "30d", "6m"
  };
}

// CSV import types (Cardsphere format)
export interface CardsphereCSVRow {
  Name: string;
  Set: string;
  'Set Name'?: string;
  Quantity?: string;
  Condition?: string;
  Language?: string;
  Foil?: string;
  Price?: string;
}

// Search and filter types
export interface CardFilter {
  search?: string;
  setFilter?: string;
  minPrice?: number;
  maxPrice?: number;
  onlyWithoutPrices?: boolean;
}

export interface CardSearchResult {
  cards: CardWithPrice[];
  totalCount: number;
  filteredCount: number;
  totalValue: number;
}
