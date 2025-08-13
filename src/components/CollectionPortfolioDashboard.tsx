"use client";
import React, { useState, useEffect } from 'react';
import { CollectionPortfolio, PortfolioPerformance, TopHolding, DiversificationMetrics } from '@/types';

interface CollectionPortfolioDashboardProps {
  userId?: string;
}

// Mock data generator for demonstration
const generateMockPortfolio = (): CollectionPortfolio => ({
  totalValue: 15420.50,
  totalCards: 1247,
  uniqueCards: 892,
  totalInvestment: 12800.00,
  unrealizedGains: 2620.50,
  realizedGains: 0,
  portfolioPerformance: {
    period: '1m',
    valueChange: 420.50,
    percentageChange: 2.8,
    benchmarkComparison: 1.2,
    volatility: 8.5,
    sharpeRatio: 0.85
  },
  topHoldings: [
    {
      card: {
        uuid: '1',
        name: 'Black Lotus',
        setCode: 'LEA',
        setName: 'Limited Edition Alpha',
        rarity: 'Rare',
        typeLine: 'Artifact',
        imageUrl: 'https://example.com/black-lotus.jpg'
      },
      quantity: 1,
      currentValue: 8500.00,
      percentOfPortfolio: 55.1,
      priceChange: { amount: 300.00, percentage: 3.7, period: '30d' },
      averageCost: 8000.00,
      unrealizedGainLoss: 500.00
    },
    {
      card: {
        uuid: '2',
        name: 'Mox Sapphire',
        setCode: 'LEA',
        setName: 'Limited Edition Alpha',
        rarity: 'Rare',
        typeLine: 'Artifact',
        imageUrl: 'https://example.com/mox-sapphire.jpg'
      },
      quantity: 1,
      currentValue: 2200.00,
      percentOfPortfolio: 14.3,
      priceChange: { amount: -50.00, percentage: -2.2, period: '30d' },
      averageCost: 2000.00,
      unrealizedGainLoss: 200.00
    },
    {
      card: {
        uuid: '3',
        name: 'Ancestral Recall',
        setCode: 'LEA',
        setName: 'Limited Edition Alpha',
        rarity: 'Rare',
        typeLine: 'Instant',
        imageUrl: 'https://example.com/ancestral-recall.jpg'
      },
      quantity: 1,
      currentValue: 1800.00,
      percentOfPortfolio: 11.7,
      priceChange: { amount: 100.00, percentage: 5.9, period: '30d' },
      averageCost: 1500.00,
      unrealizedGainLoss: 300.00
    }
  ],
  diversification: {
    bySet: [
      { setName: 'Limited Edition Alpha', value: 12500.00, percentage: 81.1 },
      { setName: 'Limited Edition Beta', value: 1800.00, percentage: 11.7 },
      { setName: 'Unlimited Edition', value: 920.50, percentage: 6.0 },
      { setName: 'Revised Edition', value: 200.00, percentage: 1.3 }
    ],
    byRarity: [
      { rarity: 'Rare', value: 13200.00, percentage: 85.6 },
      { rarity: 'Uncommon', value: 1520.50, percentage: 9.9 },
      { rarity: 'Common', value: 700.00, percentage: 4.5 }
    ],
    byColor: [
      { color: 'Colorless', value: 11200.00, percentage: 72.6 },
      { color: 'Blue', value: 2200.00, percentage: 14.3 },
      { color: 'Black', value: 1020.50, percentage: 6.6 },
      { color: 'Red', value: 600.00, percentage: 3.9 },
      { color: 'White', value: 400.00, percentage: 2.6 }
    ],
    byType: [
      { type: 'Artifact', value: 11200.00, percentage: 72.6 },
      { type: 'Instant', value: 2400.00, percentage: 15.6 },
      { type: 'Creature', value: 1200.50, percentage: 7.8 },
      { type: 'Sorcery', value: 620.00, percentage: 4.0 }
    ],
    byFormat: [
      { format: 'Vintage', value: 15420.50, percentage: 100.0 },
      { format: 'Legacy', value: 2920.50, percentage: 18.9 },
      { format: 'Commander', value: 1820.50, percentage: 11.8 },
      { format: 'Modern', value: 420.50, percentage: 2.7 }
    ]
  },
  recentActivity: [
    {
      id: '1',
      type: 'price_change',
      cardName: 'Black Lotus',
      quantity: 1,
      amount: 300.00,
      date: '2025-08-11',
      description: 'Price increased by $300.00 (3.7%)'
    },
    {
      id: '2',
      type: 'purchase',
      cardName: 'Force of Will',
      quantity: 2,
      amount: -240.00,
      date: '2025-08-10',
      description: 'Purchased 2x Force of Will for $120.00 each'
    }
  ]
});

export default function CollectionPortfolioDashboard({ userId = 'default' }: CollectionPortfolioDashboardProps) {
  const [portfolio, setPortfolio] = useState<CollectionPortfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'1d' | '1w' | '1m' | '3m' | '6m' | '1y' | 'all'>('1m');
  const [activeTab, setActiveTab] = useState<'overview' | 'holdings' | 'analytics' | 'activity'>('overview');

  useEffect(() => {
    // Simulate API call - replace with actual API when ready
    setTimeout(() => {
      setPortfolio(generateMockPortfolio());
      setLoading(false);
    }, 1000);
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950 text-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-lg">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950 text-gray-100">
        <div className="text-center">
          <p className="text-lg mb-4">No portfolio data available</p>
          <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
            Import Collection
          </button>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const formatPercentage = (value: number) => 
    `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Collection Portfolio</h1>
          <p className="text-gray-400">Track your Magic collection's performance and value</p>
        </div>

        {/* Portfolio Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h3 className="text-gray-400 text-sm font-medium mb-2">Total Portfolio Value</h3>
            <div className="text-2xl font-bold mb-1">{formatCurrency(portfolio.totalValue)}</div>
            <div className={`text-sm flex items-center ${
              portfolio.portfolioPerformance.valueChange >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              <span className="mr-1">
                {portfolio.portfolioPerformance.valueChange >= 0 ? '↗' : '↘'}
              </span>
              {formatCurrency(Math.abs(portfolio.portfolioPerformance.valueChange))} 
              ({formatPercentage(portfolio.portfolioPerformance.percentageChange)})
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h3 className="text-gray-400 text-sm font-medium mb-2">Total Cards</h3>
            <div className="text-2xl font-bold mb-1">{portfolio.totalCards.toLocaleString()}</div>
            <div className="text-sm text-gray-400">
              {portfolio.uniqueCards.toLocaleString()} unique
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h3 className="text-gray-400 text-sm font-medium mb-2">Unrealized Gains</h3>
            <div className={`text-2xl font-bold mb-1 ${
              portfolio.unrealizedGains >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {formatCurrency(portfolio.unrealizedGains)}
            </div>
            <div className="text-sm text-gray-400">
              vs {formatCurrency(portfolio.totalInvestment)} invested
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h3 className="text-gray-400 text-sm font-medium mb-2">Return on Investment</h3>
            <div className={`text-2xl font-bold mb-1 ${
              portfolio.unrealizedGains >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {formatPercentage((portfolio.unrealizedGains / portfolio.totalInvestment) * 100)}
            </div>
            <div className="text-sm text-gray-400">
              Sharpe: {portfolio.portfolioPerformance.sharpeRatio?.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'holdings', label: 'Top Holdings' },
              { id: 'analytics', label: 'Analytics' },
              { id: 'activity', label: 'Recent Activity' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-400 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Diversification Charts */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h3 className="text-lg font-semibold mb-4">Diversification by Set</h3>
              <div className="space-y-3">
                {portfolio.diversification.bySet.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">{item.setName}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-400 h-2 rounded-full" 
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-300 w-12 text-right">
                        {item.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h3 className="text-lg font-semibold mb-4">Diversification by Rarity</h3>
              <div className="space-y-3">
                {portfolio.diversification.byRarity.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-300 capitalize">{item.rarity}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-purple-400 h-2 rounded-full" 
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-300 w-12 text-right">
                        {item.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'holdings' && (
          <div className="bg-gray-900 rounded-lg border border-gray-800">
            <div className="p-6 border-b border-gray-800">
              <h3 className="text-lg font-semibold">Top Holdings</h3>
              <p className="text-gray-400 text-sm">Your most valuable cards and their performance</p>
            </div>
            <div className="divide-y divide-gray-800">
              {portfolio.topHoldings.map((holding, index) => (
                <div key={index} className="p-6 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-16 bg-gray-800 rounded border border-gray-700 flex items-center justify-center">
                      <span className="text-xs text-gray-500">IMG</span>
                    </div>
                    <div>
                      <h4 className="font-medium">{holding.card.name}</h4>
                      <p className="text-sm text-gray-400">{holding.card.setName}</p>
                      <p className="text-xs text-gray-500">Qty: {holding.quantity}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(holding.currentValue)}</div>
                    <div className={`text-sm ${
                      holding.priceChange.amount >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatCurrency(holding.priceChange.amount)} 
                      ({formatPercentage(holding.priceChange.percentage)})
                    </div>
                    <div className="text-xs text-gray-500">
                      {holding.percentOfPortfolio.toFixed(1)}% of portfolio
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h3 className="text-lg font-semibold mb-4">Portfolio Analytics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Volatility</h4>
                  <div className="text-2xl font-bold">{portfolio.portfolioPerformance.volatility}%</div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Sharpe Ratio</h4>
                  <div className="text-2xl font-bold">{portfolio.portfolioPerformance.sharpeRatio?.toFixed(2)}</div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">vs Market</h4>
                  <div className={`text-2xl font-bold ${
                    (portfolio.portfolioPerformance.benchmarkComparison || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {formatPercentage(portfolio.portfolioPerformance.benchmarkComparison || 0)}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <h3 className="text-lg font-semibold mb-4">Format Legality</h3>
                <div className="space-y-3">
                  {portfolio.diversification.byFormat.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-300 capitalize">{item.format}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{formatCurrency(item.value)}</span>
                        <span className="text-xs text-gray-500">({item.percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <h3 className="text-lg font-semibold mb-4">Color Distribution</h3>
                <div className="space-y-3">
                  {portfolio.diversification.byColor.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">{item.color}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{formatCurrency(item.value)}</span>
                        <span className="text-xs text-gray-500">({item.percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-gray-900 rounded-lg border border-gray-800">
            <div className="p-6 border-b border-gray-800">
              <h3 className="text-lg font-semibold">Recent Activity</h3>
              <p className="text-gray-400 text-sm">Latest changes to your collection</p>
            </div>
            <div className="divide-y divide-gray-800">
              {portfolio.recentActivity.map((activity) => (
                <div key={activity.id} className="p-6 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${
                      activity.type === 'purchase' ? 'bg-blue-400' :
                      activity.type === 'sale' ? 'bg-red-400' :
                      activity.type === 'price_change' ? 'bg-green-400' : 'bg-gray-400'
                    }`} />
                    <div>
                      <h4 className="font-medium">{activity.cardName}</h4>
                      <p className="text-sm text-gray-400">{activity.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${
                      activity.amount >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatCurrency(Math.abs(activity.amount))}
                    </div>
                    <div className="text-xs text-gray-500">{activity.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
