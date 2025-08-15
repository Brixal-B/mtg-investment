import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock component since we're testing the testing framework setup
const MockComponent = ({ onSubmit }: { onSubmit?: (data: string) => void }) => {
  const [value, setValue] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(value);
  };

  return (
    <form onSubmit={handleSubmit} data-testid="test-form">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Enter text"
        data-testid="test-input"
      />
      <button type="submit" data-testid="test-button">
        Submit
      </button>
      <div data-testid="test-output">{value}</div>
    </form>
  );
};

describe('React Testing Setup', () => {
  it('should render components correctly', () => {
    render(<MockComponent />);
    
    expect(screen.getByTestId('test-form')).toBeInTheDocument();
    expect(screen.getByTestId('test-input')).toBeInTheDocument();
    expect(screen.getByTestId('test-button')).toBeInTheDocument();
    expect(screen.getByTestId('test-output')).toBeInTheDocument();
  });

  it('should handle user input', async () => {
    const user = userEvent.setup();
    render(<MockComponent />);
    
    const input = screen.getByTestId('test-input');
    await user.type(input, 'test value');
    
    expect(input).toHaveValue('test value');
    expect(screen.getByTestId('test-output')).toHaveTextContent('test value');
  });

  it('should handle form submission', async () => {
    const user = userEvent.setup();
    const mockSubmit = jest.fn();
    render(<MockComponent onSubmit={mockSubmit} />);
    
    const input = screen.getByTestId('test-input');
    const button = screen.getByTestId('test-button');
    
    await user.type(input, 'test submission');
    await user.click(button);
    
    expect(mockSubmit).toHaveBeenCalledWith('test submission');
  });

  it('should handle async operations', async () => {
    const AsyncComponent = () => {
      const [loading, setLoading] = React.useState(false);
      const [data, setData] = React.useState('');

      const fetchData = async () => {
        setLoading(true);
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 100));
        setData('Loaded data');
        setLoading(false);
      };

      return (
        <div>
          <button onClick={fetchData} data-testid="fetch-button">
            Fetch Data
          </button>
          {loading && <div data-testid="loading">Loading...</div>}
          {data && <div data-testid="data">{data}</div>}
        </div>
      );
    };

    const user = userEvent.setup();
    render(<AsyncComponent />);
    
    const button = screen.getByTestId('fetch-button');
    await user.click(button);
    
    // Check loading state
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByTestId('data')).toHaveTextContent('Loaded data');
    });
    
    // Loading should be gone
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
  });

  it('should handle error boundaries', () => {
    const ErrorComponent = ({ shouldError }: { shouldError: boolean }) => {
      if (shouldError) {
        throw new Error('Test error');
      }
      return <div data-testid="success">No error</div>;
    };

    const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
      const [hasError, setHasError] = React.useState(false);

      React.useEffect(() => {
        const handleError = () => setHasError(true);
        window.addEventListener('error', handleError);
        return () => window.removeEventListener('error', handleError);
      }, []);

      if (hasError) {
        return <div data-testid="error">Something went wrong</div>;
      }

      return <>{children}</>;
    };

    // Test successful render
    render(
      <ErrorBoundary>
        <ErrorComponent shouldError={false} />
      </ErrorBoundary>
    );
    
    expect(screen.getByTestId('success')).toBeInTheDocument();
  });

  it('should handle DOM events', () => {
    const EventComponent = () => {
      const [clicked, setClicked] = React.useState(false);
      const [hovered, setHovered] = React.useState(false);

      return (
        <div
          data-testid="event-div"
          onClick={() => setClicked(true)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {clicked && <span data-testid="clicked">Clicked!</span>}
          {hovered && <span data-testid="hovered">Hovered!</span>}
        </div>
      );
    };

    render(<EventComponent />);
    
    const div = screen.getByTestId('event-div');
    
    // Test click
    fireEvent.click(div);
    expect(screen.getByTestId('clicked')).toBeInTheDocument();
    
    // Test hover
    fireEvent.mouseEnter(div);
    expect(screen.getByTestId('hovered')).toBeInTheDocument();
    
    fireEvent.mouseLeave(div);
    expect(screen.queryByTestId('hovered')).not.toBeInTheDocument();
  });

  it('should handle component props and state', () => {
    const StatefulComponent = ({ initialValue = 0 }: { initialValue?: number }) => {
      const [count, setCount] = React.useState(initialValue);

      // Update state when initialValue prop changes
      React.useEffect(() => {
        setCount(initialValue);
      }, [initialValue]);

      return (
        <div>
          <span data-testid="count">{count}</span>
          <button onClick={() => setCount(c => c + 1)} data-testid="increment">
            +
          </button>
          <button onClick={() => setCount(c => c - 1)} data-testid="decrement">
            -
          </button>
        </div>
      );
    };

    const { rerender } = render(<StatefulComponent initialValue={5} />);
    
    expect(screen.getByTestId('count')).toHaveTextContent('5');
    
    fireEvent.click(screen.getByTestId('increment'));
    expect(screen.getByTestId('count')).toHaveTextContent('6');
    
    fireEvent.click(screen.getByTestId('decrement'));
    expect(screen.getByTestId('count')).toHaveTextContent('5');
    
    // Test prop changes - component should update state when initialValue changes
    rerender(<StatefulComponent initialValue={10} />);
    expect(screen.getByTestId('count')).toHaveTextContent('10');
  });
});

describe('Testing Utilities', () => {
  it('should provide custom matchers', () => {
    render(<div>Test Content</div>);
    
    const element = screen.getByText('Test Content');
    
    // Test jest-dom matchers
    expect(element).toBeInTheDocument();
    expect(element).toBeVisible();
    expect(element).toHaveTextContent('Test Content');
  });

  it('should handle accessibility testing', () => {
    render(
      <div>
        <label htmlFor="test-input">Test Label</label>
        <input id="test-input" type="text" />
        <button aria-label="Close dialog">×</button>
      </div>
    );
    
    // Test accessibility queries
    expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close dialog' })).toBeInTheDocument();
  });

  it('should handle data attributes and queries', () => {
    render(
      <div data-custom="test-value" data-testid="custom-element">
        Custom Element
      </div>
    );
    
    const element = screen.getByTestId('custom-element');
    expect(element).toHaveAttribute('data-custom', 'test-value');
    expect(element).toHaveTextContent('Custom Element');
  });
});
