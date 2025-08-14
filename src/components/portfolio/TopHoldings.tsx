"use client";
import React from 'react';
import { TopHolding } from '@/types';
import { TrendingUp, TrendingDown, Star } from 'lucide-react';

interface TopHoldingsProps {
  holdings: TopHolding[];
}

const TopHoldings: React.FC<TopHoldingsProps> = ({ holdings }) => {
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number): string => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-secondary-900">Top Holdings</h3>
          <p className="text-secondary-600 text-sm">Your most valuable cards and their performance</p>
        </div>
        <Star className="w-6 h-6 text-warning-500" />
      </div>

      <div className="space-y-4">
        {holdings.map((holding, index) => {
          const isPositive = holding.priceChange.amount >= 0;
          
          return (
            <div key={holding.card.uuid} className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-16 bg-secondary-200 rounded flex items-center justify-center">
                  <span className="text-xs text-secondary-500">#{index + 1}</span>
                </div>
                <div>
                  <h4 className="font-medium text-secondary-900">{holding.card.name}</h4>
                  <p className="text-sm text-secondary-600">{holding.card.setName}</p>
                  <p className="text-xs text-secondary-500">
                    {holding.card.rarity} • Qty: {holding.quantity}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-lg font-bold text-secondary-900">
                  {formatCurrency(holding.currentValue)}
                </div>
                <div className="text-sm text-secondary-600">
                  {holding.percentOfPortfolio.toFixed(1)}% of portfolio
                </div>
                <div className={`text-sm flex items-center justify-end ${
                  isPositive ? 'text-success-600' : 'text-error-600'
                }`}>
                  {isPositive ? 
                    <TrendingUp className="w-3 h-3 mr-1" /> : 
                    <TrendingDown className="w-3 h-3 mr-1" />
                  }
                  {formatCurrency(Math.abs(holding.priceChange.amount))} 
                  ({formatPercentage(holding.priceChange.percentage)})
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {holdings.length === 0 && (
        <div className="text-center py-8 text-secondary-500">
          No holdings data available
        </div>
      )}
    </div>
  );
};

export default TopHoldings;
