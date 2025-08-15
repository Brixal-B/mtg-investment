
"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";

interface Card {
  uuid: string;
  name: string;
  set_code: string;
  set_name: string;
  collector_number: string;
  rarity: string;
  mana_cost?: string;
  cmc?: number;
  type_line: string;
  colors: string[];
  color_identity: string[];
  oracle_text?: string;
  power?: string;
  toughness?: string;
  image_uris?: {
    small?: string;
    normal?: string;
    large?: string;
  };
  scryfall_id?: string;
}

interface Set {
  code: string;
  name: string;
  count: number;
}

interface FilterOptions {
  rarities: Array<{ value: string; label: string; count: number }>;
  types: Array<{ value: string; label: string; count: number }>;
  sets: Set[];
  cmcRange: { min: number; max: number };
}

export default function CardBrowserPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCards, setTotalCards] = useState(0);
  
  // Filters
  const [nameSearch, setNameSearch] = useState("");
  const [selectedSet, setSelectedSet] = useState("");
  const [selectedRarity, setSelectedRarity] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [minCmc, setMinCmc] = useState("");
  const [maxCmc, setMaxCmc] = useState("");
  
  // Filter options
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [randomCards, setRandomCards] = useState<Card[]>([]);
  
  // Load filter options
  useEffect(() => {
    async function loadFilterOptions() {
      try {
        const res = await fetch('/api/cards/filters');
        if (res.ok) {
          const data = await res.json();
          setFilterOptions(data.data);
        }
      } catch (err) {
        console.error('Failed to load filter options:', err);
      }
    }
    loadFilterOptions();
  }, []);
  
  // Load random cards for initial display
  useEffect(() => {
    async function loadRandomCards() {
      try {
        const res = await fetch('/api/cards/random?count=20&hasImage=true');
        if (res.ok) {
          const data = await res.json();
          setRandomCards(data.data.cards);
        }
      } catch (err) {
        console.error('Failed to load random cards:', err);
      }
    }
    loadRandomCards();
  }, []);

  // Search/browse cards
  const searchCards = async (page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '24'
      });
      
      if (nameSearch.trim()) {
        // Use search API for name-based searches
        const searchRes = await fetch(`/api/cards/search?name=${encodeURIComponent(nameSearch.trim())}&limit=24`);
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          setCards(searchData.data || []);
          setTotalCards(searchData.data?.length || 0);
          setTotalPages(1);
          setCurrentPage(1);
        } else {
          throw new Error('Search failed');
        }
      } else {
        // Use browse API for filtered browsing
        if (selectedSet) params.append('setCode', selectedSet);
        if (selectedRarity) params.append('rarity', selectedRarity);
        if (selectedType) params.append('type', selectedType);
        if (minCmc) params.append('minCmc', minCmc);
        if (maxCmc) params.append('maxCmc', maxCmc);
        
        const browseRes = await fetch(`/api/cards/browse?${params}`);
        if (browseRes.ok) {
          const browseData = await browseRes.json();
          setCards(browseData.data.cards);
          setTotalCards(browseData.data.pagination.totalCards);
          setTotalPages(browseData.data.pagination.totalPages);
          setCurrentPage(browseData.data.pagination.page);
        } else {
          throw new Error('Browse failed');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cards');
    } finally {
      setLoading(false);
    }
  };

  // Load cards on filter changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (nameSearch.trim() || selectedSet || selectedRarity || selectedType || minCmc || maxCmc) {
        searchCards(1);
      }
    }, 500); // Debounce searches
    
    return () => clearTimeout(timeoutId);
  }, [nameSearch, selectedSet, selectedRarity, selectedType, minCmc, maxCmc]);

  // Initial load
  useEffect(() => {
    searchCards(1);
  }, []);

  const clearFilters = () => {
    setNameSearch("");
    setSelectedSet("");
    setSelectedRarity("");
    setSelectedType("");
    setMinCmc("");
    setMaxCmc("");
  };

  const displayCards = cards.length > 0 ? cards : randomCards;

  return (
    <main className="w-full min-h-screen flex flex-col items-center bg-gray-950 text-gray-100 px-4 py-8">
      <div className="w-full max-w-7xl bg-gray-900 rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-100 mb-2">MTG Card Browser</h1>
            <p className="text-gray-400 text-lg">Browse Magic: The Gathering cards from the database</p>
          </div>
          <Link 
            href="/" 
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white font-semibold transition"
          >
            Back to Dashboard
          </Link>
        </div>
        
        {/* Filters */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-300 mb-2">Search Name</label>
              <input
                type="text"
                placeholder="Search card names..."
                value={nameSearch}
                onChange={(e) => setNameSearch(e.target.value)}
                className="w-full px-3 py-2 rounded border border-gray-700 bg-gray-700 text-gray-100"
              />
            </div>
            
            <div className="min-w-[150px]">
              <label className="block text-sm font-medium text-gray-300 mb-2">Set</label>
              <select
                value={selectedSet}
                onChange={(e) => setSelectedSet(e.target.value)}
                className="w-full px-3 py-2 rounded border border-gray-700 bg-gray-700 text-gray-100"
              >
                <option value="">All Sets</option>
                {filterOptions?.sets.slice(0, 20).map(set => (
                  <option key={set.code} value={set.code}>
                    {set.code} - {set.name} ({set.count})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="min-w-[120px]">
              <label className="block text-sm font-medium text-gray-300 mb-2">Rarity</label>
              <select
                value={selectedRarity}
                onChange={(e) => setSelectedRarity(e.target.value)}
                className="w-full px-3 py-2 rounded border border-gray-700 bg-gray-700 text-gray-100"
              >
                <option value="">All Rarities</option>
                {filterOptions?.rarities.map(rarity => (
                  <option key={rarity.value} value={rarity.value}>
                    {rarity.label} ({rarity.count})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="min-w-[120px]">
              <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 rounded border border-gray-700 bg-gray-700 text-gray-100"
              >
                <option value="">All Types</option>
                {filterOptions?.types.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label} ({type.count})
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 items-end">
            <div className="min-w-[100px]">
              <label className="block text-sm font-medium text-gray-300 mb-2">Min CMC</label>
              <input
                type="number"
                min="0"
                max={filterOptions?.cmcRange.max || 20}
                placeholder="0"
                value={minCmc}
                onChange={(e) => setMinCmc(e.target.value)}
                className="w-full px-3 py-2 rounded border border-gray-700 bg-gray-700 text-gray-100"
              />
            </div>
            
            <div className="min-w-[100px]">
              <label className="block text-sm font-medium text-gray-300 mb-2">Max CMC</label>
              <input
                type="number"
                min={filterOptions?.cmcRange.min || 0}
                max={filterOptions?.cmcRange.max || 20}
                placeholder="20"
                value={maxCmc}
                onChange={(e) => setMaxCmc(e.target.value)}
                className="w-full px-3 py-2 rounded border border-gray-700 bg-gray-700 text-gray-100"
              />
            </div>
            
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded text-white transition"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-gray-300">
            {loading ? (
              <span>Loading...</span>
            ) : totalCards > 0 ? (
              <span>Showing {displayCards.length} of {totalCards} cards</span>
            ) : (
              <span>Showing {randomCards.length} random cards</span>
            )}
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => searchCards(currentPage - 1)}
                disabled={currentPage <= 1 || loading}
                className="px-3 py-1 rounded bg-gray-600 hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-gray-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => searchCards(currentPage + 1)}
                disabled={currentPage >= totalPages || loading}
                className="px-3 py-1 rounded bg-gray-600 hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-600 rounded-lg p-4 mb-6">
            <div className="text-red-200">{error}</div>
          </div>
        )}

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {displayCards.map((card) => (
            <div key={card.uuid} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              {card.image_uris?.small && (
                <img
                  src={card.image_uris.small}
                  alt={card.name}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              )}
              <div className="p-3">
                <h3 className="font-semibold text-gray-100 text-sm mb-1 truncate" title={card.name}>
                  {card.name}
                </h3>
                <p className="text-gray-400 text-xs mb-1">
                  {card.set_code} - #{card.collector_number}
                </p>
                <p className="text-gray-500 text-xs capitalize mb-1">
                  {card.rarity}
                </p>
                {card.mana_cost && (
                  <p className="text-gray-300 text-xs font-mono">
                    {card.mana_cost} ({card.cmc})
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {displayCards.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">No cards found</div>
            <div className="text-gray-500">
              Try adjusting your filters or search terms
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
