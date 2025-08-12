import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CardGrid } from '@/components';
import type { Card } from '@/types';

const mockCards: Card[] = [
  {
    name: 'Lightning Bolt',
    set_name: 'Alpha',
    price: 50.0,
    image_uris: { normal: 'test-image.jpg' },
    set: 'LEA',
    uuid: 'test-1'
  },
  {
    name: 'Black Lotus',
    set_name: 'Alpha', 
    price: 10000.0,
    image_uris: { normal: 'test-image2.jpg' },
    set: 'LEA',
    uuid: 'test-2'
  }
];

describe('CardGrid Component', () => {
  it('renders cards correctly', () => {
    render(<CardGrid cards={mockCards} />);
    
    expect(screen.getByText('Lightning Bolt')).toBeInTheDocument();
    expect(screen.getByText('Black Lotus')).toBeInTheDocument();
  });

  it('displays loading state', () => {
    render(<CardGrid cards={[]} loading={true} />);
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('displays error state', () => {
    const errorMessage = 'Failed to load cards';
    render(<CardGrid cards={[]} error={errorMessage} />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('shows card prices when available', () => {
    render(<CardGrid cards={mockCards} />);
    
    expect(screen.getByText('$50.00')).toBeInTheDocument();
    expect(screen.getByText('$10,000.00')).toBeInTheDocument();
  });
});