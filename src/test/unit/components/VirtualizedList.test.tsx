import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import VirtualizedList from '@/components/VirtualizedList';

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

describe('VirtualizedList', () => {
  const mockItems = Array.from({ length: 1000 }, (_, i) => ({
    id: i.toString(),
    name: `Item ${i}`,
    value: Math.random() * 100
  }));

  const renderItem = jest.fn((item, index) => (
    <div key={item.id} data-testid={`item-${item.id}`}>
      {item.name}: {item.value.toFixed(2)}
    </div>
  ));

  const defaultProps = {
    items: mockItems,
    renderItem,
    itemHeight: 50,
    containerHeight: 300
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders virtualized list container', () => {
    render(<VirtualizedList {...defaultProps} />);
    
    expect(screen.getByRole('list')).toBeInTheDocument();
  });

  it('renders only visible items', () => {
    render(<VirtualizedList {...defaultProps} />);
    
    // Should only render visible items (not all 1000)
    const renderedItems = screen.getAllByTestId(/item-/);
    expect(renderedItems.length).toBeLessThan(20); // Much less than 1000
  });

  it('handles empty list', () => {
    render(
      <VirtualizedList
        {...defaultProps}
        items={[]}
      />
    );
    
    expect(screen.getByText(/no items to display/i)).toBeInTheDocument();
  });

  it('handles small item count', () => {
    render(
      <VirtualizedList
        {...defaultProps}
        items={mockItems.slice(0, 5)}
      />
    );
    
    const renderedItems = screen.getAllByTestId(/item-/);
    expect(renderedItems.length).toBe(5);
  });

  it('applies custom className', () => {
    render(
      <VirtualizedList
        {...defaultProps}
        className="custom-list"
      />
    );
    
    expect(screen.getByRole('list')).toHaveClass('custom-list');
  });

  it('calculates total height correctly', () => {
    render(<VirtualizedList {...defaultProps} />);
    
    const listContainer = screen.getByRole('list');
    const totalHeight = mockItems.length * defaultProps.itemHeight;
    
    expect(listContainer.firstChild).toHaveStyle({
      height: `${totalHeight}px`
    });
  });
});