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
    <section id="collection-viewer" className="w-full max-w-6xl bg-gray-900 rounded-xl shadow-lg p-8">
      <h1 className="text-3xl font-extrabold text-gray-100 mb-2">Cardsphere CSV Card Viewer</h1>
      <p className="text-gray-400 text-lg mb-6">Upload your Cardsphere CSV to view your collection with images and prices from Scryfall.</p>
      
      <div className="flex flex-wrap gap-4 mb-6">
        <label htmlFor="csv-upload" className="bg-gray-800 border border-gray-700 rounded px-6 py-3 font-semibold cursor-pointer shadow hover:bg-gray-700 transition text-gray-100">
          Upload CSV
          <input id="csv-upload" type="file" accept=".csv" onChange={onFileChange} className="hidden" />
        </label>
        {cards.length > 0 && (
          <button
            className={`px-6 py-3 rounded border border-gray-700 font-semibold shadow transition ${showNoPrice ? 'bg-gray-800 text-gray-100' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
            onClick={() => setShowNoPrice(v => !v)}
          >
            {showNoPrice ? 'Show Priced Cards' : `Show ${cardsNoPrice.length} No Price`}
          </button>
        )}
      </div>
      
      {cards.length > 0 && !showNoPrice && (
        <div className="text-2xl font-bold text-blue-400 mb-4">Total: ${total.toFixed(2)}</div>
      )}
      
      {loading && (
        <div className="my-8 w-full max-w-xs mx-auto">
          <div className="mb-2 text-blue-400 font-semibold">Loading cards... {progress}%</div>
          <div className="bg-gray-800 rounded h-4 w-full overflow-hidden">
            <div className="bg-blue-600 h-full rounded transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
    </section>
  );
}
