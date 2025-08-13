"use client";
import React, { useState, useEffect } from 'react';
import { CollectionPortfolio } from '@/types';
import PortfolioOverview from '@/components/portfolio/PortfolioOverview';
import TopHoldings from '@/components/portfolio/TopHoldings';
import DiversificationCharts from '@/components/portfolio/DiversificationCharts';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { BarChart3, TrendingUp, PieChart } from 'lucide-react';

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
    }
  ],
  diversification: {
    bySet: [
      { setName: 'Limited Edition Alpha', value: 12500.00, percentage: 81.1 },
      { setName: 'Limited Edition Beta', value: 1800.00, percentage: 11.7 }
    ],
    byRarity: [
      { rarity: 'Rare', value: 13200.00, percentage: 85.6 },
      { rarity: 'Uncommon', value: 1520.50, percentage: 9.9 }
    ],
    byColor: [
      { color: 'Colorless', value: 11200.00, percentage: 72.6 },
      { color: 'Blue', value: 2200.00, percentage: 14.3 }
    ],
    byType: [
      { type: 'Artifact', value: 11200.00, percentage: 72.6 },
      { type: 'Instant', value: 2400.00, percentage: 15.6 }
    ],
    byFormat: [
      { format: 'Legacy', value: 13200.00, percentage: 85.6 },
      { format: 'Vintage', value: 2200.00, percentage: 14.3 }
    ]
  },
  recentActivity: [
    {
      id: '1',
      type: 'purchase',
      cardName: 'Black Lotus',
      quantity: 1,
      amount: 25000.00,
      date: '2024-08-10',
      description: 'Acquired mint condition Black Lotus'
    },
    {
      id: '2',
      type: 'price_change',
      cardName: 'Time Walk',
      quantity: 1,
      amount: 200.00,
      date: '2024-08-09',
      description: 'Price increased by $200'
    }
  ]
});

const CollectionPortfolioDashboard: React.FC<CollectionPortfolioDashboardProps> = ({ 
  userId = 'default' 
}) => {
  const [portfolio, setPortfolio] = useState<CollectionPortfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'holdings' | 'diversification'>('overview');

  useEffect(() => {
    setTimeout(() => {
      setPortfolio(generateMockPortfolio());
      setLoading(false);
    }, 1000);
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-secondary-600 text-lg font-medium mb-2">No portfolio data available</div>
          <button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg">
            Import Collection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">Collection Portfolio</h1>
          <p className="text-secondary-600">Track your Magic collection's performance and value</p>
        </div>

        <div className="mb-8">
          <div className="border-b border-secondary-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: TrendingUp },
                { id: 'holdings', label: 'Top Holdings', icon: BarChart3 },
                { id: 'diversification', label: 'Diversification', icon: PieChart },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'overview' | 'holdings' | 'diversification')}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {activeTab === 'overview' && <PortfolioOverview portfolio={portfolio} />}
        {activeTab === 'holdings' && <TopHoldings holdings={portfolio.topHoldings} />}
        {activeTab === 'diversification' && <DiversificationCharts diversification={portfolio.diversification} />}
      </div>
    </div>
  );
};

export default CollectionPortfolioDashboard;
