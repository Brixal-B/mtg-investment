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
 * Rate limiting middleware with enhanced security
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number; blocked?: boolean }>();

export function withRateLimit(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
  options: { maxRequests: number; windowMs: number; blockDuration?: number } = { 
    maxRequests: 100, 
    windowMs: 60000,
    blockDuration: 300000 // 5 minutes
  }
) {
  return async (request: NextRequest, ...args: any[]) => {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               request.headers.get('x-real-ip') || 
               request.headers.get('cf-connecting-ip') ||
               'unknown';
    const now = Date.now();
    
    const rateLimitData = rateLimitMap.get(ip);
    
    if (rateLimitData) {
      // Check if IP is currently blocked
      if (rateLimitData.blocked && now < rateLimitData.resetTime) {
        return NextResponse.json(
          { 
            error: 'IP temporarily blocked due to rate limit violations',
            blockedUntil: new Date(rateLimitData.resetTime).toISOString()
          },
          { 
            status: 429,
            headers: {
              'Retry-After': Math.ceil((rateLimitData.resetTime - now) / 1000).toString(),
              'X-RateLimit-Limit': options.maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': new Date(rateLimitData.resetTime).toISOString()
            }
          }
        );
      }
      
      if (now < rateLimitData.resetTime) {
        if (rateLimitData.count >= options.maxRequests) {
          // Block IP for extended period after repeated violations
          rateLimitData.blocked = true;
          rateLimitData.resetTime = now + (options.blockDuration || 300000);
          
          return NextResponse.json(
            { 
              error: 'Rate limit exceeded. IP blocked temporarily.',
              blockedUntil: new Date(rateLimitData.resetTime).toISOString()
            },
            { 
              status: 429,
              headers: {
                'Retry-After': Math.ceil((rateLimitData.resetTime - now) / 1000).toString(),
                'X-RateLimit-Limit': options.maxRequests.toString(),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': new Date(rateLimitData.resetTime).toISOString()
              }
            }
          );
        }
        rateLimitData.count++;
      } else {
        // Reset window
        rateLimitData.count = 1;
        rateLimitData.resetTime = now + options.windowMs;
        rateLimitData.blocked = false;
      }
    } else {
      // First request from this IP
      rateLimitMap.set(ip, {
        count: 1,
        resetTime: now + options.windowMs,
        blocked: false
      });
    }

    // Clean up old entries periodically
    if (Math.random() < 0.01) { // 1% chance to clean up
      const cutoff = now - (options.windowMs * 2);
      for (const [key, value] of rateLimitMap.entries()) {
        if (value.resetTime < cutoff) {
          rateLimitMap.delete(key);
        }
      }
    }

    const currentData = rateLimitMap.get(ip)!;
    const response = await handler(request, ...args);
    
    // Add rate limit headers to response
    response.headers.set('X-RateLimit-Limit', options.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', Math.max(0, options.maxRequests - currentData.count).toString());
    response.headers.set('X-RateLimit-Reset', new Date(currentData.resetTime).toISOString());

    return response;
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
