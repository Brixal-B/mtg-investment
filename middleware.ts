/**
 * Next.js Security & Authentication Middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Define protected routes
const PROTECTED_ROUTES = [
  '/dashboard',
  '/profile',
  '/portfolio',
  '/admin'
];

const ADMIN_ROUTES = [
  '/admin'
];

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Create response with security headers
  const response = NextResponse.next();

  // Apply security headers first
  const securityHeaders = {
    'X-XSS-Protection': '1; mode=block',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: http:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'"
    ].join('; '),
    ...(process.env.NODE_ENV === 'production' && {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
    }),
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'interest-cohort=()'
    ].join(', ')
  };

  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Skip authentication for API routes, static files, and public routes
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.') ||
    PUBLIC_ROUTES.includes(pathname)
  ) {
    return response;
  }

  // Check if route requires authentication
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  const isAdminRoute = ADMIN_ROUTES.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    // Get token from cookies
    const token = request.cookies.get('mtg-auth-token')?.value;

    if (!token) {
      // Redirect to login if no token
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      // Verify JWT token
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret');
      const { payload } = await jwtVerify(token, secret);

      // Check admin routes
      if (isAdminRoute && payload.role !== 'admin') {
        const unauthorizedUrl = new URL('/dashboard', request.url);
        return NextResponse.redirect(unauthorizedUrl);
      }

      // Add user info to request headers for API routes
      response.headers.set('x-user-id', payload.id as string);
      response.headers.set('x-user-role', payload.role as string);
      response.headers.set('x-user-email', payload.email as string);

    } catch (error) {
      // Invalid token, redirect to login
      console.log('Invalid token:', error instanceof Error ? error.message : 'Unknown error');
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      loginUrl.searchParams.set('error', 'session-expired');
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
