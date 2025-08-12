import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CardGrid from '@/components/CardGrid';
import { mockCards } from '@/test/fixtures/card-data';

describe('CardGrid', () => {
  const defaultProps = {
    cards: mockCards,
    showNoPrice: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders cards correctly', () => {
    render(<CardGrid {...defaultProps} />);
    
    expect(screen.getByText(mockCards[0].name)).toBeInTheDocument();
    expect(screen.getByText(mockCards[1].name)).toBeInTheDocument();
  });

  it('shows cards without prices when showNoPrice is true', () => {
    render(<CardGrid {...defaultProps} showNoPrice={true} />);
    
    // Should render cards but handle price display differently
    expect(screen.getByText(mockCards[0].name)).toBeInTheDocument();
  });

  it('handles empty card list', () => {
    render(<CardGrid {...defaultProps} cards={[]} />);
    
    // The component may render an empty grid, not a specific message
    expect(screen.queryByText(mockCards[0].name)).not.toBeInTheDocument();
  });

  it('displays card information correctly', () => {
    render(<CardGrid {...defaultProps} />);
    
    // Check for card details - use getAllByText since there are multiple cards
    expect(screen.getByText(mockCards[0].name)).toBeInTheDocument();
    expect(screen.getAllByText(mockCards[0].set_name!)).toHaveLength(2); // Lightning Bolt and Black Lotus both from Alpha
  });

  it('renders card prices when available', () => {
    render(<CardGrid {...defaultProps} />);
    
    // Should display price information
    const priceElements = screen.getAllByText(/\$/);
    expect(priceElements.length).toBeGreaterThan(0);
  });

  it('handles cards with no price data', () => {
    const cardsWithoutPrice = mockCards.map(card => ({ ...card, price: undefined }));
    render(<CardGrid {...defaultProps} cards={cardsWithoutPrice} />);
    
    expect(screen.getByText(cardsWithoutPrice[0].name)).toBeInTheDocument();
  });
});