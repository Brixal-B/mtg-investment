/**
 * Authentication API - Login endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { authService, UserRole } from '../../../../lib/auth-service';
import { validateInput } from '../../../../lib/validation';

// Mock user database (in production, use real database)
const MOCK_USERS = [
  {
    id: '1',
    email: 'admin@mtginvestment.com',
    passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LNEjsP8QvJq7J9q7e', // "admin123"
    role: UserRole.ADMIN,
    name: 'Admin User',
    createdAt: new Date(),
  },
  {
    id: '2',
    email: 'user@mtginvestment.com',
    passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LNEjsP8QvJq7J9q7e', // "user123"
    role: UserRole.USER,
    name: 'Regular User',
    createdAt: new Date(),
  }
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = validateInput(body, {
      email: { required: true, type: 'email' },
      password: { required: true, minLength: 6 }
    });

    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.errors },
        { status: 400 }
      );
    }

    const { email, password } = body;

    // Find user (in production, query database)
    const user = MOCK_USERS.find(u => u.email === email);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await authService.verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate tokens
    const token = authService.generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      createdAt: user.createdAt
    });

    const refreshToken = authService.generateRefreshToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      createdAt: user.createdAt
    });

    // Set authentication cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      },
      token
    });

    // Set secure cookie
    response.cookies.set('mtg-auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24 hours
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
