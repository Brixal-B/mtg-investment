import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CardFilters } from '@/components';

const mockProps = {
  searchName: '',
  setSearchName: jest.fn(),
  minPrice: '',
  setMinPrice: jest.fn(),
  maxPrice: '',
  setMaxPrice: jest.fn(),
  searchSet: '',
  setSearchSet: jest.fn(),
  showNoPrice: false,
  setShowNoPrice: jest.fn(),
  showNameSuggestions: false,
  setShowNameSuggestions: jest.fn(),
  showSetSuggestions: false,
  setShowSetSuggestions: jest.fn(),
  uniqueCardNames: ['Lightning Bolt', 'Black Lotus'],
  uniqueSetNames: ['Alpha', 'Beta'],
  nameInputRef: { current: null },
  setInputRef: { current: null }
};

describe('CardFilters Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all filter inputs', () => {
    render(<CardFilters {...mockProps} />);
    
    expect(screen.getByPlaceholderText(/search by card name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/min price/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/max price/i)).toBeInTheDocument();
  });

  it('calls setSearchName when typing in search input', async () => {
    const user = userEvent.setup();
    render(<CardFilters {...mockProps} />);
    
    const searchInput = screen.getByPlaceholderText(/search by card name/i);
    await user.type(searchInput, 'Lightning');
    
    expect(mockProps.setSearchName).toHaveBeenCalledWith('Lightning');
  });

  it('toggles no price filter correctly', async () => {
    const user = userEvent.setup();
    render(<CardFilters {...mockProps} />);
    
    const checkbox = screen.getByLabelText(/show cards without prices/i);
    await user.click(checkbox);
    
    expect(mockProps.setShowNoPrice).toHaveBeenCalledWith(true);
  });
});