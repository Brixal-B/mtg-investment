"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigationItems = [
  {
    label: 'Home',
    href: '/',
    icon: '🏠',
    description: 'Main dashboard and collection viewer'
  },
  {
    label: 'Collection Portfolio',
    href: '/portfolio',
    icon: '📊',
    description: 'Track your collection value and performance',
    isNew: true
  },
  {
    label: 'Deck Builder',
    href: '/deck-builder',
    icon: '🃏',
    description: 'Build and manage your decks',
    isNew: true
  },
  {
    label: 'Wishlist',
    href: '/wishlist',
    icon: '⭐',
    description: 'Track cards you want with price alerts',
    isNew: true
  },
  {
    label: 'Admin Tools',
    href: '/admin',
    icon: '⚙️',
    description: 'System administration and data management'
  }
];

export default function MagicPlayerNav() {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-gray-900 border border-gray-700 text-gray-100 p-2 rounded-lg shadow-lg"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Overlay for mobile */}
      {isExpanded && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Navigation Sidebar */}
      <nav className={`
        fixed top-0 left-0 h-full bg-gray-900 border-r border-gray-800 shadow-xl z-50
        transition-transform duration-300 ease-in-out
        ${isExpanded ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        w-80
      `}>
        <div className="p-6">
          {/* Logo/Title */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-100 mb-2">MTG Investment</h1>
            <p className="text-sm text-gray-400">Magic Player Tools</p>
          </div>

          {/* Navigation Items */}
          <div className="space-y-2">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsExpanded(false)}
                  className={`
                    block p-4 rounded-lg transition-all duration-200
                    ${isActive 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }
                  `}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-xl">{item.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{item.label}</span>
                        {item.isNew && (
                          <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-sm opacity-75 mt-1">{item.description}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Player Features Highlight */}
          <div className="mt-8 p-4 bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-lg border border-blue-800/50">
            <h3 className="text-sm font-semibold text-blue-200 mb-2">🎮 New Player Features</h3>
            <p className="text-xs text-blue-300 leading-relaxed">
              Track your collection value, build decks with format validation, and set price alerts for cards you want!
            </p>
          </div>

          {/* Quick Stats */}
          <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Quick Stats</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Collection Value</span>
                <span className="text-green-400 font-medium">$15,420</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Cards</span>
                <span className="text-blue-400 font-medium">1,247</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Active Decks</span>
                <span className="text-purple-400 font-medium">3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Wishlist Items</span>
                <span className="text-yellow-400 font-medium">12</span>
              </div>
            </div>
          </div>

          {/* Version Info */}
          <div className="mt-6 pt-4 border-t border-gray-800">
            <p className="text-xs text-gray-500">
              MTG Investment v2.0 • Enhanced for Magic Players
            </p>
          </div>
        </div>
      </nav>

      {/* Main Content Spacer for Desktop */}
      <div className="hidden lg:block w-80 flex-shrink-0" />
    </>
  );
}
