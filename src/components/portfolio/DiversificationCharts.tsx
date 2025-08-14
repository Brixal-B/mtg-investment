"use client";
import React from 'react';
import { DiversificationMetrics } from '@/types';
import { PieChart, BarChart3 } from 'lucide-react';

interface DiversificationChartsProps {
  diversification: DiversificationMetrics;
}

const DiversificationCharts: React.FC<DiversificationChartsProps> = ({ diversification }) => {
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const colorSchemes = {
    sets: ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500'],
    rarities: ['bg-yellow-600', 'bg-gray-500', 'bg-green-600'],
    colors: ['bg-gray-600', 'bg-blue-600', 'bg-gray-800', 'bg-red-600', 'bg-yellow-100'],
    types: ['bg-orange-500', 'bg-blue-700', 'bg-green-700', 'bg-purple-700']
  };

  const DiversificationSection = ({ 
    title, 
    data, 
    colors 
  }: { 
    title: string; 
    data: Array<{ name?: string; setName?: string; rarity?: string; color?: string; type?: string; value: number; percentage: number }>; 
    colors: string[] 
  }) => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-4">
        <PieChart className="w-5 h-5 text-primary-500 mr-2" />
        <h3 className="text-lg font-semibold text-secondary-900">{title}</h3>
      </div>
      
      <div className="space-y-3">
        {data.slice(0, 5).map((item, index) => {
          const label = item.name || item.setName || item.rarity || item.color || item.type || 'Unknown';
          
          return (
            <div key={label} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded ${colors[index % colors.length]}`}></div>
                <span className="text-sm text-secondary-700">{label}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-secondary-900">
                  {formatCurrency(item.value)}
                </div>
                <div className="text-xs text-secondary-500">
                  {item.percentage.toFixed(1)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress bars */}
      <div className="mt-4 space-y-2">
        {data.slice(0, 5).map((item, index) => {
          const label = item.name || item.setName || item.rarity || item.color || item.type || 'Unknown';
          
          return (
            <div key={`bar-${label}`} className="flex items-center space-x-2">
              <div className="w-16 text-xs text-secondary-600 truncate">
                {label}
              </div>
              <div className="flex-1 bg-secondary-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${colors[index % colors.length]}`}
                  style={{ width: `${Math.min(item.percentage, 100)}%` }}
                ></div>
              </div>
              <div className="w-12 text-xs text-secondary-600 text-right">
                {item.percentage.toFixed(0)}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <DiversificationSection
        title="Diversification by Set"
        data={diversification.bySet}
        colors={colorSchemes.sets}
      />
      
      <DiversificationSection
        title="Diversification by Rarity"
        data={diversification.byRarity}
        colors={colorSchemes.rarities}
      />
      
      <DiversificationSection
        title="Diversification by Color"
        data={diversification.byColor}
        colors={colorSchemes.colors}
      />
      
      <DiversificationSection
        title="Diversification by Type"
        data={diversification.byType}
        colors={colorSchemes.types}
      />
    </div>
  );
};

export default DiversificationCharts;
