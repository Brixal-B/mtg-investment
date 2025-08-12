"use client";
import React from 'react';
import { Card } from '@/types';

interface CardGridProps {
  cards: Card[];
  showNoPrice: boolean;
}

export default function CardGrid({ cards, showNoPrice }: CardGridProps) {
  if (cards.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {cards.map((card, i) => (
        <div key={i} className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700 hover:border-gray-600 transition">
          {card.imageUrl ? (
            <img 
              src={card.imageUrl} 
              alt={card.name} 
              className="w-full h-auto object-cover"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.style.display = 'none';
                const parent = img.parentElement;
                if (parent) {
                  const fallback = document.createElement('div');
                  fallback.className = 'w-full h-48 bg-gray-700 flex items-center justify-center text-gray-400 text-sm text-center p-4';
                  fallback.textContent = card.name;
                  parent.appendChild(fallback);
                }
              }}
            />
          ) : (
            <div className="w-full h-48 bg-gray-700 flex items-center justify-center text-gray-400 text-sm text-center p-4">
              {card.name}
            </div>
          )}
          <div className="p-4">
            <h3 className="font-semibold text-gray-100 mb-2 text-sm leading-tight">{card.name}</h3>
            {card.set_name && (
              <p className="text-xs text-gray-400 mb-2">{card.set_name}</p>
            )}
            {card.price ? (
              <p className="text-lg font-bold text-green-400">${card.price}</p>
            ) : showNoPrice ? (
              <p className="text-sm text-red-400">No price data</p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
