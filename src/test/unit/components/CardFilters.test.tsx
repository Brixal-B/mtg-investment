import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CardFilters } from '@/components/CardFilters';

describe('CardFilters', () => {
  const defaultProps = {
    filters: {
      priceMin: 0,
      priceMax: 1000,
      sets: [],
      rarities: [],
      colors: []
    },
    onFiltersChange: jest.fn(),
    availableSets: ['Alpha', 'Beta', 'Unlimited'],
    loading: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all filter options', () => {
    render(<CardFilters {...defaultProps} />);
    
    expect(screen.getByLabelText('Min Price')).toBeInTheDocument();
    expect(screen.getByLabelText('Max Price')).toBeInTheDocument();
    expect(screen.getByText('Sets')).toBeInTheDocument();
    expect(screen.getByText('Rarities')).toBeInTheDocument();
    expect(screen.getByText('Colors')).toBeInTheDocument();
  });

  it('updates price filters', () => {
    render(<CardFilters {...defaultProps} />);
    
    const minPriceInput = screen.getByLabelText('Min Price');
    fireEvent.change(minPriceInput, { target: { value: '10' } });
    
    expect(defaultProps.onFiltersChange).toHaveBeenCalledWith({
      ...defaultProps.filters,
      priceMin: 10
    });
  });

  it('handles set selection', () => {
    render(<CardFilters {...defaultProps} />);
    
    const alphaCheckbox = screen.getByLabelText('Alpha');
    fireEvent.click(alphaCheckbox);
    
    expect(defaultProps.onFiltersChange).toHaveBeenCalledWith({
      ...defaultProps.filters,
      sets: ['Alpha']
    });
  });

  it('clears all filters', () => {
    render(<CardFilters {...defaultProps} />);
    
    const clearButton = screen.getByText('Clear Filters');
    fireEvent.click(clearButton);
    
    expect(defaultProps.onFiltersChange).toHaveBeenCalledWith({
      priceMin: 0,
      priceMax: 1000,
      sets: [],
      rarities: [],
      colors: []
    });
  });

  it('shows loading state', () => {
    render(<CardFilters {...defaultProps} loading={true} />);
    
    expect(screen.getByText('Loading filters...')).toBeInTheDocument();
  });
});