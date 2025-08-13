"use client";
import React from 'react';
import { TradeCard } from '@/types/trading';
import { Trash2, Plus } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface TradeOfferSectionProps {
  title: string;
  cards: TradeCard[];
  totalValue: number;
  onRemoveCard: (cardUuid: string) => void;
  onAddCard: () => void;
  isCurrentUser?: boolean;
  isLoading?: boolean;
}

const TradeOfferSection: React.FC<TradeOfferSectionProps> = ({
  title,
  cards,
  totalValue,
  onRemoveCard,
  onAddCard,
  isCurrentUser = false,
  isLoading = false
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-secondary-900">{title}</h3>
        <span className="text-lg font-bold text-success-600">
          ${totalValue.toFixed(2)}
        </span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="md" />
        </div>
      ) : (
        <>
          {cards.length === 0 ? (
            <div className="text-center py-8 text-secondary-500">
              No cards in this offer yet.
            </div>
          ) : (
            <div className="space-y-3 mb-4">
              {cards.map((tradeCard, index) => (
                <div key={`${tradeCard.card.uuid}-${index}`} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-secondary-900">{tradeCard.card.name}</h4>
                    <p className="text-sm text-secondary-600">
                      {tradeCard.card.setName} • {tradeCard.card.rarity}
                    </p>
                    <p className="text-xs text-secondary-500">
                      Quantity: {tradeCard.quantity} • Condition: {tradeCard.condition}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-success-600">
                      ${(tradeCard.estimatedValue * tradeCard.quantity).toFixed(2)}
                    </span>
                    {isCurrentUser && (
                      <button
                        onClick={() => onRemoveCard(tradeCard.card.uuid)}
                        className="text-error-500 hover:text-error-700 transition-colors p-1"
                        title="Remove card"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {isCurrentUser && (
            <button
              onClick={onAddCard}
              className="w-full flex items-center justify-center space-x-2 py-3 border-2 border-dashed border-secondary-300 rounded-lg text-secondary-600 hover:border-primary-400 hover:text-primary-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Add Cards</span>
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default TradeOfferSection;
