
"use client";
import React, { useState, useEffect } from "react";
import { MTGCard, PriceSnapshot } from '@/types';

export default function IndexMtgjsonPage() {
  const [index, setIndex] = useState<MTGCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingPhase, setLoadingPhase] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [setFilter, setSetFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Check if processed data is available instead of loading raw file
  useEffect(() => {
    async function checkProcessedData() {
      try {
        // Check if there's processed price history data available
        const res = await fetch("/api/price-history");
        if (res.ok) {
          const data: PriceSnapshot[] = await res.json();
          if (data && data.length > 0) {
            // Transform price snapshot data to MTGCard format for display
            const latestSnapshot = data[data.length - 1];
            const cards: MTGCard[] = latestSnapshot.cards.slice(0, 100).map(card => ({
              uuid: card.uuid,
              name: `Card ${card.uuid.slice(0, 8)}`, // Placeholder name
              setCode: 'UNK',
              setName: 'Unknown Set',
              prices: {
                paper: {
                  tcgplayer: {
                    retail: {
                      normal: card.prices
                    }
                  }
                }
              }
            }));
            setIndex(cards);
          }
        }
      } catch (e) {
        // No processed data available - user needs to use admin tools
        console.log("No processed data available");
      }
    }
    checkProcessedData();
  }, []);

  return (
    <main className="w-full min-h-screen flex flex-col items-center bg-gray-950 text-gray-100 px-4 py-8">
      <div className="w-full max-w-4xl bg-gray-900 rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-extrabold text-gray-100 mb-2">Database</h1>
        <p className="text-gray-400 text-lg mb-6">Browse the latest Magic: The Gathering card prices and sets. Data is loaded automatically from processed MTGJSON data.</p>
        
        <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4 mb-6">
          <div className="text-yellow-200 font-semibold mb-2">⚠️ Large Dataset Notice</div>
          <div className="text-yellow-100 text-sm">
            The AllPrices.json file (1.05GB) is too large to load directly in the browser. 
            Please use the <strong>Admin Tools</strong> on the homepage to:
            <br />1. Import MTGJSON data to generate a processed price history
            <br />2. Then download the processed data for analysis
          </div>
          <div className="mt-3">
            <a href="/" className="inline-block px-4 py-2 bg-yellow-600 hover:bg-yellow-500 rounded text-white font-semibold transition">
              Go to Admin Tools
            </a>
          </div>
        </div>
        {index.length > 0 && (
          <div className="mt-2">
            <div className="flex flex-wrap gap-4 mb-6 items-center">
              <input
                type="text"
                placeholder="Search name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="px-3 py-2 rounded border border-gray-700 bg-gray-800 text-gray-100 text-base min-w-[180px]"
              />
              <input
                type="text"
                placeholder="Set code..."
                value={setFilter}
                onChange={e => setSetFilter(e.target.value)}
                className="px-3 py-2 rounded border border-gray-700 bg-gray-800 text-gray-100 text-base min-w-[120px]"
              />
              <input
                type="number"
                placeholder="Min price"
                value={minPrice}
                onChange={e => setMinPrice(e.target.value)}
                className="px-3 py-2 rounded border border-gray-700 bg-gray-800 text-gray-100 text-base w-[110px]"
              />
              <input
                type="number"
                placeholder="Max price"
                value={maxPrice}
                onChange={e => setMaxPrice(e.target.value)}
                className="px-3 py-2 rounded border border-gray-700 bg-gray-800 text-gray-100 text-base w-[110px]"
              />
              <span className="text-gray-400 text-sm ml-3">
                Showing {index.filter((card: MTGCard) => {
                  if (search && !card.name.toLowerCase().includes(search.toLowerCase())) return false;
                  if (setFilter && !card.setCode.toLowerCase().includes(setFilter.toLowerCase())) return false;
                  // For now, skip price filtering since we need to extract price from the complex price structure
                  return true;
                }).slice(0, 500).length} of {index.length}
              </span>
            </div>
            <div className="overflow-x-auto rounded-lg shadow">
              <table className="w-full bg-gray-800 rounded-lg">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="text-left px-4 py-2 text-gray-200">Name</th>
                    <th className="text-left px-4 py-2 text-gray-200">Set</th>
                    <th className="text-left px-4 py-2 text-gray-200">Latest Price (USD)</th>
                  </tr>
                </thead>
                <tbody>
                  {index.filter((card: MTGCard) => {
                    if (search && !card.name.toLowerCase().includes(search.toLowerCase())) return false;
                    if (setFilter && !card.setCode.toLowerCase().includes(setFilter.toLowerCase())) return false;
                    return true;
                  }).slice(0, 500).map((card: MTGCard, i: number) => (
                    <tr key={card.uuid || i} className="border-b border-gray-700 last:border-0">
                      <td className="px-4 py-2">{card.name}</td>
                      <td className="px-4 py-2">{card.setCode} - {card.setName}</td>
                      <td className="px-4 py-2">
                        <span className="text-gray-400">Price data processing...</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {index.filter((card: MTGCard) => {
              if (search && !card.name.toLowerCase().includes(search.toLowerCase())) return false;
              if (setFilter && !card.setCode.toLowerCase().includes(setFilter.toLowerCase())) return false;
              return true;
            }).length > 500 && <div className="mt-2 text-gray-500">(Showing first 500 cards)</div>}
          </div>
        )}
      </div>
    </main>
  );
}
