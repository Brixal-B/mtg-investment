"use client";
import React from 'react';

interface ProgressBarProps {
  progress: number;
  title: string;
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'orange';
  speed?: string;
  phase?: string;
  rate?: number;
  eta?: number;
  processed?: number;
  total?: number;
}

export default function ProgressBar({ 
  progress, 
  title, 
  color, 
  speed, 
  phase, 
  rate, 
  eta, 
  processed, 
  total 
}: ProgressBarProps) {
  const colorClasses = {
    blue: 'text-blue-400 bg-blue-600',
    green: 'text-green-400 bg-green-600',
    yellow: 'text-yellow-400 bg-yellow-600',
    purple: 'text-purple-400 bg-purple-600',
    orange: 'text-orange-400 bg-orange-600'
  };

  const getDisplayTitle = () => {
    if (phase) {
      switch (phase) {
        case 'counting':
          return 'Counting cards';
        case 'processing':
          return `${title}: ${progress}%`;
        case 'starting':
          return 'Starting import...';
        case 'completed':
          return 'Import completed!';
        default:
          return `Processing: ${progress}%`;
      }
    }
    return `${title}: ${progress}%`;
  };

  return (
    <div className="my-4 w-full max-w-lg mx-auto">
      <div className={`${colorClasses[color].split(' ')[0]} font-semibold mb-1`}>
        {getDisplayTitle()}
        {speed && (
          <span className="ml-2 text-gray-400 font-normal text-sm">{speed}</span>
        )}
        {rate && rate > 0 && (
          <span className="ml-2 text-gray-400 font-normal text-sm">{rate.toFixed(1)} cards/sec</span>
        )}
        {eta && eta > 1 && (
          <span className="ml-2 text-gray-400 font-normal text-sm">
            ETA: {Math.floor(eta / 60) > 0 ? Math.floor(eta / 60) + 'm ' : ''}{Math.round(eta % 60)}s
          </span>
        )}
      </div>
      <div className="bg-gray-800 rounded h-3 w-full overflow-hidden">
        <div 
          className={`${colorClasses[color].split(' ')[1]} h-full rounded transition-all`} 
          style={{ width: `${progress}%` }} 
        />
      </div>
      {processed !== null && total !== null && processed !== undefined && total !== undefined && (
        <div className="text-xs text-gray-500 mt-1 text-center">
          {processed.toLocaleString()} / {total.toLocaleString()} cards processed
        </div>
      )}
    </div>
  );
}
