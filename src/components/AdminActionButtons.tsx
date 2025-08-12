"use client";
import React from 'react';

interface AdminAction {
  id: string;
  label: string;
  description: string;
  onClick: () => void;
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'orange';
  disabled?: boolean;
}

interface AdminActionButtonsProps {
  actions: AdminAction[];
  isLoading: boolean;
}

export default function AdminActionButtons({ actions, isLoading }: AdminActionButtonsProps) {
  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-600 hover:bg-blue-500',
      green: 'bg-green-600 hover:bg-green-500',
      yellow: 'bg-yellow-600 hover:bg-yellow-500',
      purple: 'bg-purple-600 hover:bg-purple-500',
      orange: 'bg-orange-600 hover:bg-orange-500'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="flex flex-wrap gap-4 mb-6 justify-center">
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={action.onClick}
          disabled={action.disabled || isLoading}
          className={`px-5 py-2 rounded ${getColorClasses(action.color)} text-white font-semibold disabled:opacity-60`}
        >
          {action.label}
          <div className="text-xs opacity-75">{action.description}</div>
        </button>
      ))}
    </div>
  );
}
