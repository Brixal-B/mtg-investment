"use client";
import React from 'react';

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
  nameInputRef: React.RefObject<HTMLInputElement>;
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
  return (
    <div className="flex flex-wrap gap-6 mb-8 items-center justify-center">
      <div>
        <label className="font-semibold mr-2">Min Price:</label>
        <input 
          type="number" 
          value={minPrice} 
          onChange={e => setMinPrice(e.target.value)} 
          className="w-20 rounded border border-gray-700 px-2 py-1 bg-gray-800 text-gray-100" 
        />
      </div>
      <div>
        <label className="font-semibold mr-2">Max Price:</label>
        <input 
          type="number" 
          value={maxPrice} 
          onChange={e => setMaxPrice(e.target.value)} 
          className="w-20 rounded border border-gray-700 px-2 py-1 bg-gray-800 text-gray-100" 
        />
      </div>
      <div className="relative">
        <label className="font-semibold mr-2">Card Name:</label>
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
          className="w-40 rounded border border-gray-700 px-2 py-1 bg-gray-800 text-gray-100"
          placeholder="Search by name"
          autoComplete="off"
        />
        {showNameSuggestions && nameSuggestions.length > 0 && (
          <ul className="absolute top-9 left-0 w-40 bg-gray-900 border border-gray-700 rounded shadow z-10 max-h-44 overflow-y-auto">
            {nameSuggestions.map(s => (
              <li
                key={s}
                className="px-3 py-2 cursor-pointer hover:bg-gray-800 text-gray-100"
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
      <div className="relative">
        <label className="font-semibold mr-2">Set:</label>
        <input
          type="text"
          value={searchSet}
          onChange={e => {
            setSearchSet(e.target.value);
            setShowSetSuggestions(true);
          }}
          onFocus={() => setShowSetSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSetSuggestions(false), 100)}
          className="w-40 rounded border border-gray-700 px-2 py-1 bg-gray-800 text-gray-100"
          placeholder="Search by set"
          autoComplete="off"
        />
        {showSetSuggestions && setSuggestions.length > 0 && (
          <ul className="absolute top-9 left-0 w-40 bg-gray-900 border border-gray-700 rounded shadow z-10 max-h-44 overflow-y-auto">
            {setSuggestions.map(s => (
              <li
                key={s}
                className="px-3 py-2 cursor-pointer hover:bg-gray-800 text-gray-100"
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
  );
}
