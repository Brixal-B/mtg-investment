"use client";
import React from 'react';

interface DashboardCard {
  title: string;
  description: string;
  href: string;
  linkText: string;
}

interface DashboardCardsProps {
  cards: DashboardCard[];
}

export default function DashboardCards({ cards }: DashboardCardsProps) {
  return (
    <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
      {cards.map((card, index) => (
        <div key={index} className="bg-gray-900 rounded-xl shadow-lg p-6 flex flex-col items-center">
          <div className="text-2xl font-bold mb-2">{card.title}</div>
          <div className="text-gray-400 mb-4 text-center">{card.description}</div>
          <a 
            href={card.href} 
            className="mt-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white font-semibold transition"
          >
            {card.linkText}
          </a>
        </div>
      ))}
    </div>
  );
}

// Default dashboard cards configuration
export const defaultDashboardCards: DashboardCard[] = [
  {
    title: "Collection Portfolio",
    description: "Track your collection value, performance, and analytics.",
    href: "/portfolio",
    linkText: "View Portfolio"
  },
  {
    title: "Deck Builder",
    description: "Build decks with format validation and mana curve analysis.",
    href: "/deck-builder",
    linkText: "Build Decks"
  },
  {
    title: "Wishlist Manager",
    description: "Track wanted cards and set up price alerts.",
    href: "/wishlist",
    linkText: "Manage Wishlist"
  }
];
