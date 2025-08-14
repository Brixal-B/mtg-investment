"use client";
import React from 'react';

interface SkeletonLoaderProps {
  variant?: 'card' | 'list' | 'text' | 'avatar' | 'custom';
  count?: number;
  className?: string;
  width?: string;
  height?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'card',
  count = 1,
  className = '',
  width,
  height
}) => {
  const variants = {
    card: 'rounded-lg bg-secondary-200 animate-pulse',
    list: 'rounded bg-secondary-200 animate-pulse',
    text: 'rounded bg-secondary-200 animate-pulse h-4',
    avatar: 'rounded-full bg-secondary-200 animate-pulse',
    custom: 'bg-secondary-200 animate-pulse'
  };

  const defaultDimensions = {
    card: 'h-48 w-full',
    list: 'h-12 w-full',
    text: 'h-4 w-3/4',
    avatar: 'h-10 w-10',
    custom: ''
  };

  const skeletonClass = `${variants[variant]} ${defaultDimensions[variant]} ${className}`;
  const style = {
    ...(width && { width }),
    ...(height && { height })
  };

  if (variant === 'card') {
    return (
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="border border-secondary-200 rounded-lg p-4 space-y-3">
            <div className="h-32 bg-secondary-200 rounded animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 bg-secondary-200 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-secondary-200 rounded animate-pulse w-1/2" />
            </div>
            <div className="flex justify-between items-center">
              <div className="h-3 bg-secondary-200 rounded animate-pulse w-1/4" />
              <div className="h-6 bg-secondary-200 rounded animate-pulse w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={skeletonClass} style={style} />
      ))}
    </div>
  );
};

export default SkeletonLoader;
