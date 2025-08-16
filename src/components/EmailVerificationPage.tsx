'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface VerificationState {
  status: 'loading' | 'success' | 'error' | 'already_verified';
  message: string;
}

export default function EmailVerificationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<VerificationState>({
    status: 'loading',
    message: 'Verifying your email...'
  });
  const [isResending, setIsResending] = useState(false);

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setState({
          status: 'error',
          message: 'Invalid verification link. Please check your email for the correct link.'
        });
        return;
      }

      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`, {
          method: 'GET',
        });

        const data = await response.json();

        if (response.ok) {
          if (data.already_verified) {
            setState({
              status: 'already_verified',
              message: 'Your email has already been verified!'
            });
          } else {
            setState({
              status: 'success',
              message: 'Email verified successfully! You can now access all features.'
            });
          }
          
          // Redirect to dashboard after successful verification
          setTimeout(() => {
            router.push('/dashboard');
          }, 3000);
        } else {
          setState({
            status: 'error',
            message: data.error || 'Email verification failed'
          });
        }
      } catch (error) {
        console.error('Verification error:', error);
        setState({
          status: 'error',
          message: 'Network error. Please try again.'
        });
      }
    };

    if (token) {
      verifyEmail();
    }
  }, [token, router]);

  const handleResendEmail = async () => {
    if (!email) {
      alert('Email address not found. Please register again.');
      return;
    }

    setIsResending(true);

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Verification email sent! Please check your inbox.');
      } else {
        alert(data.error || 'Failed to resend verification email');
      }
    } catch (error) {
      console.error('Resend error:', error);
      alert('Network error. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const getIcon = () => {
    switch (state.status) {
      case 'loading':
        return (
          <svg className="animate-spin h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        );
      case 'success':
      case 'already_verified':
        return (
          <svg className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'error':
        return (
          <svg className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getBackgroundColor = () => {
    switch (state.status) {
      case 'success':
      case 'already_verified':
        return 'bg-green-50';
      case 'error':
        return 'bg-red-50';
      default:
        return 'bg-gray-50';
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${getBackgroundColor()}`}>
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            {getIcon()}
          </div>
          
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Email Verification
          </h2>
          
          <p className="mt-2 text-sm text-gray-600">
            {state.message}
          </p>

          {state.status === 'success' && (
            <div className="mt-4 p-4 bg-green-100 border border-green-200 rounded-md">
              <p className="text-green-700 text-sm">
                Redirecting to dashboard in 3 seconds...
              </p>
            </div>
          )}

          {state.status === 'error' && (
            <div className="mt-6 space-y-4">
              {email && (
                <button
                  onClick={handleResendEmail}
                  disabled={isResending}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResending ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    'Resend Verification Email'
                  )}
                </button>
              )}
              
              <div className="text-center">
                <a
                  href="/register"
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Back to Registration
                </a>
              </div>
            </div>
          )}

          {(state.status === 'success' || state.status === 'already_verified') && (
            <div className="mt-6">
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
