import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginForm from '@/components/LoginForm';

// Mock the auth service
const mockLogin = jest.fn();
jest.mock('@/lib/auth-service', () => ({
  login: mockLogin,
}));

// Mock the Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('LoginForm', () => {
  const defaultProps = {
    onSuccess: jest.fn(),
    onError: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
  });

  it('renders login form fields', () => {
    render(<LoginForm {...defaultProps} />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('handles form submission with valid credentials', async () => {
    mockLogin.mockResolvedValue({ 
      success: true, 
      token: 'mock-token',
      user: { id: '1', email: 'test@example.com' }
    });

    render(<LoginForm {...defaultProps} />);
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });

  it('handles login failure', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid credentials'));

    render(<LoginForm {...defaultProps} />);
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'wrong@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpassword' }
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    await waitFor(() => {
      expect(defaultProps.onError).toHaveBeenCalledWith('Invalid credentials');
    });
  });

  it('validates required fields', async () => {
    render(<LoginForm {...defaultProps} />);
    
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    mockLogin.mockImplementation(() => new Promise(resolve => {
      setTimeout(resolve, 100);
    }));

    render(<LoginForm {...defaultProps} />);
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    expect(screen.getByText(/logging in/i)).toBeInTheDocument();
  });
});