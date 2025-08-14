/**
 * Email Verification API - Verify user email addresses
 */

import { NextRequest, NextResponse } from 'next/server';
import { authService, UserRole } from '../../../../lib/auth-service';
import Database from '../../../../lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    const { database: db } = Database;
    await db.initialize();

    // Find user with verification token
    const user = await db.get(
      'SELECT id, email, email_verified, verification_token FROM users WHERE verification_token = ?',
      [token]
    );

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    if (user.email_verified) {
      return NextResponse.json(
        { success: true, message: 'Email already verified', already_verified: true },
        { status: 200 }
      );
    }

    // Verify the email
    await db.run(
      'UPDATE users SET email_verified = ?, verification_token = NULL WHERE id = ?',
      [true, user.id]
    );

    console.log(`✅ Email verified successfully for user: ${user.email}`);

    // Generate new JWT token with verified status
    const jwtToken = authService.generateToken({
      id: user.id,
      email: user.email,
      role: UserRole.USER, // Default role
      name: '', // We'll need to get this from the user record if needed
      createdAt: new Date()
    });

    const response = NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      user: {
        id: user.id,
        email: user.email,
        email_verified: true
      }
    });

    // Set authentication cookie
    response.cookies.set('mtg-auth-token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24 hours
    });

    return response;

  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const { database: db } = Database;
    await db.initialize();

    // Find user by email
    const user = await db.get(
      'SELECT id, email, email_verified, verification_token FROM users WHERE email = ?',
      [email]
    );

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.email_verified) {
      return NextResponse.json(
        { success: true, message: 'Email already verified' },
        { status: 200 }
      );
    }

    // Generate new verification token
    const { randomUUID } = require('crypto');
    const newToken = randomUUID();

    await db.run(
      'UPDATE users SET verification_token = ? WHERE id = ?',
      [newToken, user.id]
    );

    // Send verification email (placeholder for now)
    // In production, integrate with email service like SendGrid, AWS SES, etc.
    console.log(`📧 Resending verification email to: ${email}`);
    console.log(`🔗 New verification token: ${newToken}`);

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully'
    });

  } catch (error) {
    console.error('Email resend error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
