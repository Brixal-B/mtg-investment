export const mockCards = [
  {
    name: 'Lightning Bolt',
    price: '0.50',
    set: 'Alpha',
    set_name: 'Limited Edition Alpha',
    imageUrl: 'https://example.com/lightning-bolt.jpg'
  },
  {
    name: 'Black Lotus',
    price: '25000.00',
    set: 'Alpha',
    set_name: 'Limited Edition Alpha',
    imageUrl: 'https://example.com/black-lotus.jpg'
  },
  {
    name: 'Counterspell',
    price: '2.50',
    set: 'Beta',
    set_name: 'Limited Edition Beta',
    imageUrl: 'https://example.com/counterspell.jpg'
  }
];

// Extended card data for detailed testing
export const mockMTGCards = [
  {
    uuid: '1',
    name: 'Lightning Bolt',
    setCode: 'LEA',
    setName: 'Limited Edition Alpha',
    rarity: 'Common',
    typeLine: 'Instant',
    manaCost: '{R}',
    cmc: 1,
    oracleText: 'Lightning Bolt deals 3 damage to any target.',
    imageUrl: 'https://example.com/lightning-bolt.jpg',
    prices: {
      usd: '0.50',
      eur: '0.45',
      tix: '0.02'
    }
  },
  {
    uuid: '2',
    name: 'Black Lotus',
    setCode: 'LEA',
    setName: 'Limited Edition Alpha',
    rarity: 'Rare',
    typeLine: 'Artifact',
    manaCost: '{0}',
    cmc: 0,
    oracleText: '{T}, Sacrifice Black Lotus: Add three mana of any one color.',
    imageUrl: 'https://example.com/black-lotus.jpg',
    prices: {
      usd: '25000.00',
      eur: '22000.00',
      tix: '1200.00'
    }
  }
];

export const mockPriceHistory = [
  {
    cardId: '1',
    cardName: 'Lightning Bolt',
    date: '2024-01-01',
    price: 0.45,
    source: 'tcgplayer'
  },
  {
    cardId: '1',
    cardName: 'Lightning Bolt',
    date: '2024-01-02',
    price: 0.48,
    source: 'tcgplayer'
  },
  {
    cardId: '1',
    cardName: 'Lightning Bolt',
    date: '2024-01-03',
    price: 0.50,
    source: 'tcgplayer'
  },
  {
    cardId: '2',
    cardName: 'Black Lotus',
    date: '2024-01-01',
    price: 24500.00,
    source: 'tcgplayer'
  },
  {
    cardId: '2',
    cardName: 'Black Lotus',
    date: '2024-01-02',
    price: 24800.00,
    source: 'tcgplayer'
  },
  {
    cardId: '2',
    cardName: 'Black Lotus',
    date: '2024-01-03',
    price: 25000.00,
    source: 'tcgplayer'
  }
];

export const mockInventoryData = [
  {
    id: '1',
    cardName: 'Lightning Bolt',
    set: 'Alpha',
    condition: 'Near Mint',
    quantity: 4,
    purchasePrice: 0.40,
    currentPrice: 0.50,
    totalValue: 2.00,
    profit: 0.40,
    profitPercent: 25.0
  },
  {
    id: '2',
    cardName: 'Black Lotus',
    set: 'Alpha',
    condition: 'Played',
    quantity: 1,
    purchasePrice: 20000.00,
    currentPrice: 25000.00,
    totalValue: 25000.00,
    profit: 5000.00,
    profitPercent: 25.0
  }
];

export const mockCSVData = `Card Name,Set,Condition,Quantity,Purchase Price
Lightning Bolt,Alpha,Near Mint,4,0.40
Black Lotus,Alpha,Played,1,20000.00
Counterspell,Beta,Excellent,2,2.00`;