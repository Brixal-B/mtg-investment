/**
 * Registration API - User signup endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { authService, UserRole } from '../../../../lib/auth-service';
import { validateInput } from '../../../../lib/validation';
import { randomUUID } from 'crypto';
import Database from '../../../../lib/database';

interface RegistrationRequest {
  email: string;
  password: string;
  name?: string;
  confirmPassword: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RegistrationRequest = await request.json();
    
    // Validate input
    const validation = validateInput(body, {
      email: { required: true, type: 'email' },
      password: { required: true, minLength: 6 },
      confirmPassword: { required: true },
      name: { required: false, maxLength: 100 }
    });

    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.errors },
        { status: 400 }
      );
    }

    const { email, password, confirmPassword, name } = body;

    // Check if passwords match
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    // Check password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: 'Password does not meet requirements', details: passwordValidation.errors },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { database: db } = Database;
    await db.initialize();
    
    try {
      const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email]);
      
      if (existingUser) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 }
        );
      }
    } catch (error) {
      console.error('Database query error:', error);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    // Hash password
    const passwordHash = await authService.hashPassword(password);
    
    // Generate verification token
    const verificationToken = randomUUID();
    
    // Create user record
    const userId = randomUUID();
    const now = new Date().toISOString();
    
    try {
      await db.run(`
        INSERT INTO users (id, email, password_hash, name, role, email_verified, verification_token, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [userId, email, passwordHash, name || null, UserRole.USER, false, verificationToken, now]);

      console.log(`✅ New user registered: ${email} (${userId})`);
    } catch (error) {
      console.error('User creation error:', error);
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Send verification email (placeholder for now)
    // In production, integrate with email service like SendGrid, AWS SES, etc.
    console.log(`📧 Verification email would be sent to: ${email}`);
    console.log(`🔗 Verification token: ${verificationToken}`);

    // Generate JWT token for immediate login (optional - some apps require email verification first)
    const token = authService.generateToken({
      id: userId,
      email,
      role: UserRole.USER,
      name: name || '',
      createdAt: new Date()
    });

    // Set authentication cookie
    const response = NextResponse.json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: userId,
        email,
        name,
        role: UserRole.USER,
        email_verified: false
      },
      token,
      verification_required: true
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
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Validate password strength
 */
function validatePassword(password: string): { isValid: boolean; errors?: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  // Optional: special characters
  // if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
  //   errors.push('Password must contain at least one special character');
  // }
  
  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}
