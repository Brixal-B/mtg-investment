"use client";
import React, { useState } from 'react';

interface CardFiltersProps {
  minPrice: string;
  maxPrice: string;
  searchName: string;
  searchSet: string;
  setMinPrice: (value: string) => void;
  setMaxPrice: (value: string) => void;
  setSearchName: (value: string) => void;
  setSearchSet: (value: string) => void;
  showNameSuggestions: boolean;
  setShowNameSuggestions: (show: boolean) => void;
  showSetSuggestions: boolean;
  setShowSetSuggestions: (show: boolean) => void;
  nameSuggestions: string[];
  setSuggestions: string[];
  nameInputRef: React.RefObject<HTMLInputElement | null>;
}

export default function CardFilters({
  minPrice,
  maxPrice,
  searchName,
  searchSet,
  setMinPrice,
  setMaxPrice,
  setSearchName,
  setSearchSet,
  showNameSuggestions,
  setShowNameSuggestions,
  showSetSuggestions,
  setShowSetSuggestions,
  nameSuggestions,
  setSuggestions,
  nameInputRef
}: CardFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="w-full max-w-4xl mb-6 sm:mb-8">
      {/* Mobile: Collapsible Filter Header */}
      <div className="sm:hidden mb-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 hover:bg-gray-700 transition-colors"
          style={{ minHeight: '44px' }}
        >
          <span className="font-semibold">Filters</span>
          <svg 
            className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Filter Content - Always visible on desktop, collapsible on mobile */}
      <div className={`${isExpanded ? 'block' : 'hidden'} sm:block`}>
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 sm:gap-6 items-start sm:items-center justify-center p-4 sm:p-0">
          {/* Price Range Filters */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
            <div className="flex-1 sm:flex-none">
              <label className="block font-semibold mb-1 text-sm">Min Price:</label>
              <input 
                type="number" 
                value={minPrice} 
                onChange={e => setMinPrice(e.target.value)} 
                className="w-full sm:w-20 rounded border border-gray-700 px-3 py-2 bg-gray-800 text-gray-100 text-sm" 
                style={{ minHeight: '44px' }}
              />
            </div>
            <div className="flex-1 sm:flex-none">
              <label className="block font-semibold mb-1 text-sm">Max Price:</label>
              <input 
                type="number" 
                value={maxPrice} 
                onChange={e => setMaxPrice(e.target.value)} 
                className="w-full sm:w-20 rounded border border-gray-700 px-3 py-2 bg-gray-800 text-gray-100 text-sm" 
                style={{ minHeight: '44px' }}
              />
            </div>
          </div>

          {/* Card Name Filter */}
          <div className="relative w-full sm:w-auto">
            <label className="block font-semibold mb-1 text-sm">Card Name:</label>
            <input
              ref={nameInputRef}
              type="text"
              value={searchName}
              onChange={e => {
                setSearchName(e.target.value);
                setShowNameSuggestions(true);
              }}
              onFocus={() => setShowNameSuggestions(true)}
              onBlur={() => setTimeout(() => setShowNameSuggestions(false), 100)}
              className="w-full sm:w-40 rounded border border-gray-700 px-3 py-2 bg-gray-800 text-gray-100 text-sm"
              placeholder="Search by name"
              autoComplete="off"
              style={{ minHeight: '44px' }}
            />
            {showNameSuggestions && nameSuggestions.length > 0 && (
              <ul className="absolute top-16 left-0 w-full sm:w-40 bg-gray-900 border border-gray-700 rounded shadow-lg z-10 max-h-44 overflow-y-auto">
                {nameSuggestions.map(s => (
                  <li
                    key={s}
                    className="px-3 py-2 cursor-pointer hover:bg-gray-800 text-gray-100 text-sm"
                    style={{ minHeight: '44px' }}
                    onMouseDown={() => {
                      setSearchName(s);
                      setShowNameSuggestions(false);
                      nameInputRef.current?.blur();
                    }}
                  >
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Set Filter */}
          <div className="relative w-full sm:w-auto">
            <label className="block font-semibold mb-1 text-sm">Set:</label>
            <input
              type="text"
              value={searchSet}
              onChange={e => {
                setSearchSet(e.target.value);
                setShowSetSuggestions(true);
              }}
              onFocus={() => setShowSetSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSetSuggestions(false), 100)}
              className="w-full sm:w-40 rounded border border-gray-700 px-3 py-2 bg-gray-800 text-gray-100 text-sm"
              placeholder="Search by set"
              autoComplete="off"
              style={{ minHeight: '44px' }}
            />
            {showSetSuggestions && setSuggestions.length > 0 && (
              <ul className="absolute top-16 left-0 w-full sm:w-40 bg-gray-900 border border-gray-700 rounded shadow-lg z-10 max-h-44 overflow-y-auto">
                {setSuggestions.map(s => (
                  <li
                    key={s}
                    className="px-3 py-2 cursor-pointer hover:bg-gray-800 text-gray-100 text-sm"
                    style={{ minHeight: '44px' }}
                    onMouseDown={() => {
                      setSearchSet(s);
                      setShowSetSuggestions(false);
                    }}
                  >
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
