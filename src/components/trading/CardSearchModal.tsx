"use client";
import React from 'react';
import { MTGCard } from '@/types';
import { X } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import SkeletonLoader from '@/components/ui/SkeletonLoader';

interface CardSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  cards: MTGCard[];
  isLoading: boolean;
  onCardSelect: (card: MTGCard) => void;
  traderName: string;
}

const CardSearchModal: React.FC<CardSearchModalProps> = ({
  isOpen,
  onClose,
  searchQuery,
  setSearchQuery,
  cards,
  isLoading,
  onCardSelect,
  traderName
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-modal">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-secondary-900">
              Add Card to {traderName}'s Offer
            </h2>
            <button
              onClick={onClose}
              className="text-secondary-400 hover:text-secondary-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="relative mb-6">
            <div className="absolute left-3 top-3">
              <svg className="w-4 h-4 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search cards by name or set..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              autoFocus
            />
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <SkeletonLoader variant="card" count={6} />
              </div>
            ) : cards.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cards.map((card) => (
                  <div
                    key={card.uuid}
                    className="border border-secondary-200 rounded-lg p-4 hover:border-primary-300 cursor-pointer transition-colors group"
                    onClick={() => onCardSelect(card)}
                  >
                    <div className="aspect-[2.5/3.5] bg-secondary-100 rounded mb-3 flex items-center justify-center">
                      <span className="text-secondary-400 text-xs">No Image</span>
                    </div>
                    <h3 className="font-medium text-secondary-900 group-hover:text-primary-600 transition-colors">
                      {card.name}
                    </h3>
                    <p className="text-sm text-secondary-600">{card.setName}</p>
                    <p className="text-sm text-secondary-600">{card.rarity} • {card.typeLine}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-success-600">
                        ${((card as any).estimatedValue || Math.random() * 100 + 10).toFixed(2)}
                      </span>
                      <button className="text-primary-600 hover:text-primary-800 text-sm font-medium transition-colors">
                        Add to Trade
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-secondary-500">
                {searchQuery ? 'No cards found matching your search.' : 'Start typing to search for cards.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardSearchModal;
