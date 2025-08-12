"use client";
import React from 'react';

interface QuickAction {
  id: string;
  label: string;
  onClick?: () => void;
  href?: string;
  color?: 'gray' | 'red';
  disabled?: boolean;
}

interface QuickActionsProps {
  actions: QuickAction[];
  isLoading: boolean;
}

export default function QuickActions({ actions, isLoading }: QuickActionsProps) {
  const getColorClasses = (color: string = 'gray') => {
    const colors = {
      gray: 'bg-gray-700 hover:bg-gray-600',
      red: 'bg-red-700 hover:bg-red-600'
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  return (
    <div className="mt-6 pt-4 border-t border-gray-700">
      <h4 className="text-sm font-semibold text-gray-400 mb-2">Quick Actions</h4>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => {
          if (action.href) {
            return (
              <a
                key={action.id}
                href={action.href}
                className={`px-3 py-1 rounded ${getColorClasses(action.color)} text-white text-sm`}
              >
                {action.label}
              </a>
            );
          }
          
          return (
            <button
              key={action.id}
              onClick={action.onClick}
              disabled={action.disabled || isLoading}
              className={`px-3 py-1 rounded ${getColorClasses(action.color)} text-white text-sm disabled:opacity-60`}
            >
              {action.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
