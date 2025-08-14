"use client";
import React from 'react';
import { CollectionPortfolio } from '@/types';
import { TrendingUp, TrendingDown, DollarSign, Archive, Users, Target } from 'lucide-react';

interface PortfolioOverviewProps {
  portfolio: CollectionPortfolio;
}

const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({ portfolio }) => {
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

  const isPositive = portfolio.portfolioPerformance.valueChange >= 0;

  return (
    <div className="space-y-6">
      {/* Main Portfolio Value */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Portfolio Value</h2>
            <p className="text-primary-100">Track your Magic collection's performance and value</p>
          </div>
          <DollarSign className="w-8 h-8 text-primary-200" />
        </div>
        
        <div className="mt-6">
          <div className="text-4xl font-bold mb-2">{formatCurrency(portfolio.totalValue)}</div>
          <div className={`flex items-center text-lg ${isPositive ? 'text-success-200' : 'text-error-200'}`}>
            {isPositive ? <TrendingUp className="w-5 h-5 mr-1" /> : <TrendingDown className="w-5 h-5 mr-1" />}
            {formatCurrency(Math.abs(portfolio.portfolioPerformance.valueChange))} 
            ({formatPercentage(portfolio.portfolioPerformance.percentageChange)})
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-secondary-600">Total Cards</div>
              <div className="text-2xl font-bold text-secondary-900">{portfolio.totalCards.toLocaleString()}</div>
            </div>
            <Archive className="w-8 h-8 text-primary-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-secondary-600">Unique Cards</div>
              <div className="text-2xl font-bold text-secondary-900">{portfolio.uniqueCards.toLocaleString()}</div>
            </div>
            <Users className="w-8 h-8 text-primary-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-secondary-600">Total Investment</div>
              <div className="text-2xl font-bold text-secondary-900">{formatCurrency(portfolio.totalInvestment)}</div>
            </div>
            <Target className="w-8 h-8 text-primary-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-secondary-600">Unrealized Gains</div>
              <div className={`text-2xl font-bold ${portfolio.unrealizedGains >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                {formatCurrency(portfolio.unrealizedGains)}
              </div>
            </div>
            {portfolio.unrealizedGains >= 0 ? 
              <TrendingUp className="w-8 h-8 text-success-500" /> : 
              <TrendingDown className="w-8 h-8 text-error-500" />
            }
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-sm text-secondary-600 mb-1">Volatility</div>
            <div className="text-2xl font-bold text-secondary-900">{portfolio.portfolioPerformance.volatility}%</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-secondary-600 mb-1">Sharpe Ratio</div>
            <div className="text-2xl font-bold text-secondary-900">{portfolio.portfolioPerformance.sharpeRatio?.toFixed(2)}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-secondary-600 mb-1">vs Benchmark</div>
            <div className={`text-2xl font-bold ${
              (portfolio.portfolioPerformance.benchmarkComparison || 0) >= 0 ? 'text-success-600' : 'text-error-600'
            }`}>
              {formatPercentage(portfolio.portfolioPerformance.benchmarkComparison || 0)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioOverview;
