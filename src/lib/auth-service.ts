/**
 * Authentication Service - JWT-based authentication system
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

// User roles for RBAC
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator'
}

// User interface
export interface User {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  createdAt: Date;
  lastLoginAt?: Date;
}

// JWT payload interface
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

// Authentication configuration
const AUTH_CONFIG = {
  jwt: {
    secret: process.env.JWT_SECRET || (() => {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET environment variable is required in production');
      }
      console.warn('⚠️  Using default JWT secret in development. Set JWT_SECRET environment variable.');
      return 'dev-only-insecure-jwt-secret-change-in-production';
    })(),
    expiresIn: '24h',
    refreshExpiresIn: '7d'
  },
  bcrypt: {
    saltRounds: 12
  },
  session: {
    cookieName: 'mtg-auth-token',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
};

class AuthService {
  /**
   * Hash password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, AUTH_CONFIG.bcrypt.saltRounds);
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT token
   */
  generateToken(user: User): string {
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    return jwt.sign(payload, AUTH_CONFIG.jwt.secret as string, {
      expiresIn: AUTH_CONFIG.jwt.expiresIn
    } as jwt.SignOptions);
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(user: User): string {
    const payload = {
      userId: user.id,
      type: 'refresh'
    };

    return jwt.sign(payload, AUTH_CONFIG.jwt.secret as string, {
      expiresIn: AUTH_CONFIG.jwt.refreshExpiresIn
    } as jwt.SignOptions);
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, AUTH_CONFIG.jwt.secret as string) as JWTPayload;
    } catch (error) {
      console.error('JWT verification failed:', error);
      return null;
    }
  }

  /**
   * Set authentication cookie (server-side only)
   * Note: HttpOnly cookies cannot be set from client-side JavaScript
   */
  setAuthCookie(token: string) {
    // This method should only be called on the server-side
    if (typeof window !== 'undefined') {
      console.warn('⚠️  Cannot set HttpOnly cookies from client-side. Use server-side API endpoints.');
      return;
    }
    
    // Server-side cookie setting would be handled by API routes
    console.log('Setting auth cookie on server-side');
  }

  /**
   * Get authentication token from request
   */
  getTokenFromRequest(request: Request): string | null {
    // Try Authorization header first
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Try cookie
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

      return cookies[AUTH_CONFIG.session.cookieName] || null;
    }

    return null;
  }

  /**
   * Get current user from request
   */
  async getCurrentUser(request: Request): Promise<User | null> {
    const token = this.getTokenFromRequest(request);
    if (!token) return null;

    const payload = this.verifyToken(token);
    if (!payload) return null;

    // In a real app, you'd fetch user from database
    // For now, return user info from JWT payload
    return {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
      createdAt: new Date(),
      lastLoginAt: new Date()
    };
  }

  /**
   * Check if user has required role
   */
  hasRole(user: User, requiredRole: UserRole | UserRole[]): boolean {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return roles.includes(user.role);
  }

  /**
   * Check if user has admin privileges
   */
  isAdmin(user: User): boolean {
    return user.role === UserRole.ADMIN;
  }

  /**
   * Clear authentication
   */
  clearAuth() {
    if (typeof window !== 'undefined') {
      document.cookie = `${AUTH_CONFIG.session.cookieName}=; Max-Age=0; Path=/`;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();

// Export configuration for testing
export { AUTH_CONFIG };

export default authService;
