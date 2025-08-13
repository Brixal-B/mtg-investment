"use client";
import React from 'react';
import { Card } from '@/types';

interface CSVUploadProps {
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  cards: Card[];
  showNoPrice: boolean;
  setShowNoPrice: (value: boolean | ((prev: boolean) => boolean)) => void;
  cardsNoPrice: Card[];
  total: number;
  loading: boolean;
  progress: number;
}

export default function CSVUpload({
  onFileChange,
  cards,
  showNoPrice,
  setShowNoPrice,
  cardsNoPrice,
  total,
  loading,
  progress
}: CSVUploadProps) {
  return (
    <section id="collection-viewer" className="w-full max-w-6xl bg-gray-900 rounded-xl shadow-lg p-4 sm:p-6 lg:p-8">
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-100 mb-2">Cardsphere CSV Card Viewer</h1>
      <p className="text-gray-400 text-sm sm:text-base lg:text-lg mb-4 sm:mb-6">Upload your Cardsphere CSV to view your collection with images and prices from Scryfall.</p>
      
      {/* Mobile-first responsive button layout */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mb-4 sm:mb-6">
        <label htmlFor="csv-upload" className="bg-gray-800 border border-gray-700 rounded px-4 sm:px-6 py-3 font-semibold cursor-pointer shadow hover:bg-gray-700 transition text-gray-100 text-center min-h-[44px] flex items-center justify-center">
          Upload CSV
          <input id="csv-upload" type="file" accept=".csv" onChange={onFileChange} className="hidden" />
        </label>
        {cards.length > 0 && (
          <button
            className={`px-4 sm:px-6 py-3 rounded border border-gray-700 font-semibold shadow transition min-h-[44px] ${showNoPrice ? 'bg-gray-800 text-gray-100' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
            onClick={() => setShowNoPrice(v => !v)}
          >
            {showNoPrice ? 'Show Priced Cards' : `Show ${cardsNoPrice.length} No Price`}
          </button>
        )}
      </div>
      
      {/* Mobile responsive total display */}
      {cards.length > 0 && !showNoPrice && (
        <div className="text-xl sm:text-2xl font-bold text-blue-400 mb-4">Total: ${total.toFixed(2)}</div>
      )}
      
      {/* Mobile optimized loading indicator */}
      {loading && (
        <div className="my-6 sm:my-8 w-full max-w-xs mx-auto">
          <div className="mb-2 text-blue-400 font-semibold text-sm sm:text-base">Loading cards... {progress}%</div>
          <div className="bg-gray-800 rounded h-3 sm:h-4 w-full overflow-hidden">
            <div className="bg-blue-600 h-full rounded transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
    </section>
  );
}
