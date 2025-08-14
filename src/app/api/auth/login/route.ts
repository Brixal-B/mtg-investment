/**
 * Authentication API - Login endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { authService, UserRole } from '../../../../lib/auth-service';
import { validateInput } from '../../../../lib/validation';
import Database from '../../../../lib/database';

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

    // Initialize database connection
    const { database: db } = Database;
    await db.initialize();

    // Find user in database
    const user = await db.get(
      'SELECT id, email, password_hash, name, role, email_verified, last_login_at FROM users WHERE email = ?',
      [email]
    );

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await authService.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if email is verified (optional - you can allow login without verification)
    if (!user.email_verified) {
      return NextResponse.json(
        { 
          error: 'Email not verified', 
          code: 'EMAIL_NOT_VERIFIED',
          email: user.email
        },
        { status: 403 }
      );
    }

    // Update last login time
    await db.run(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    console.log(`✅ User logged in: ${user.email} (${user.role})`);

    // Convert role string to UserRole enum
    const userRole = user.role === 'admin' ? UserRole.ADMIN : UserRole.USER;

    // Generate tokens
    const token = authService.generateToken({
      id: user.id,
      email: user.email,
      role: userRole,
      name: user.name || '',
      createdAt: new Date(user.created_at || Date.now())
    });

    const refreshToken = authService.generateRefreshToken({
      id: user.id,
      email: user.email,
      role: userRole,
      name: user.name || '',
      createdAt: new Date(user.created_at || Date.now())
    });

    // Set authentication cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        email_verified: user.email_verified,
        last_login_at: user.last_login_at
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
