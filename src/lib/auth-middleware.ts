/**
 * Authorization Middleware - Role-based access control
 */

import { NextRequest, NextResponse } from 'next/server';
import { authService, User, UserRole } from './auth-service';

// Middleware options
interface AuthMiddlewareOptions {
  requiredRole?: UserRole | UserRole[];
  allowGuest?: boolean;
  redirectOnFail?: string;
}

/**
 * Authentication middleware for API routes
 */
export function withAuth(
  handler: (request: NextRequest, user: User) => Promise<NextResponse>,
  options: AuthMiddlewareOptions = {}
) {
  return async (request: NextRequest) => {
    try {
      const user = await authService.getCurrentUser(request);

      // Check if user is authenticated
      if (!user) {
        if (options.allowGuest) {
          // Allow guest access, call handler with null user
          return handler(request, null as any);
        }
        
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Check role requirements
      if (options.requiredRole) {
        if (!authService.hasRole(user, options.requiredRole)) {
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          );
        }
      }

      // Call the actual handler with authenticated user
      return handler(request, user);

    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Admin-only middleware
 */
export function withAdminAuth(
  handler: (request: NextRequest, user: User) => Promise<NextResponse>
) {
  return withAuth(handler, { requiredRole: UserRole.ADMIN });
}

/**
 * Moderator or Admin middleware
 */
export function withModeratorAuth(
  handler: (request: NextRequest, user: User) => Promise<NextResponse>
) {
  return withAuth(handler, { requiredRole: [UserRole.ADMIN, UserRole.MODERATOR] });
}

/**
 * Rate limiting middleware
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function withRateLimit(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
  options: { maxRequests: number; windowMs: number } = { maxRequests: 100, windowMs: 60000 }
) {
  return async (request: NextRequest, ...args: any[]) => {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    
    const rateLimitData = rateLimitMap.get(ip);
    
    if (rateLimitData) {
      if (now < rateLimitData.resetTime) {
        if (rateLimitData.count >= options.maxRequests) {
          return NextResponse.json(
            { error: 'Rate limit exceeded' },
            { 
              status: 429,
              headers: {
                'Retry-After': Math.ceil((rateLimitData.resetTime - now) / 1000).toString()
              }
            }
          );
        }
        rateLimitData.count++;
      } else {
        // Reset window
        rateLimitData.count = 1;
        rateLimitData.resetTime = now + options.windowMs;
      }
    } else {
      // First request from this IP
      rateLimitMap.set(ip, {
        count: 1,
        resetTime: now + options.windowMs
      });
    }

    return handler(request, ...args);
  };
}

/**
 * Combined auth and rate limiting middleware
 */
export function withSecureAuth(
  handler: (request: NextRequest, user: User) => Promise<NextResponse>,
  authOptions: AuthMiddlewareOptions = {},
  rateLimitOptions: { maxRequests: number; windowMs: number } = { maxRequests: 60, windowMs: 60000 }
) {
  return withRateLimit(
    withAuth(handler, authOptions),
    rateLimitOptions
  );
}

export default {
  withAuth,
  withAdminAuth,
  withModeratorAuth,
  withRateLimit,
  withSecureAuth
};
