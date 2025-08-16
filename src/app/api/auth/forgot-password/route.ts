/**
 * Forgot Password API - Send password reset email
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateInput } from '../../../../lib/validation';
import Database from '../../../../lib/database';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = validateInput(body, {
      email: { required: true, type: 'email' }
    });

    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Invalid email address', details: validation.errors },
        { status: 400 }
      );
    }

    const { email } = body;

    const { database: db } = Database;
    await db.initialize();

    // Find user by email
    const user = await db.get(
      'SELECT id, email, name FROM users WHERE email = ?',
      [email]
    );

    if (!user) {
      // Don't reveal if email exists or not for security
      return NextResponse.json({
        success: true,
        message: 'If this email is registered, you will receive a password reset link shortly.'
      });
    }

    // Generate reset token with expiration (24 hours)
    const resetToken = randomUUID();
    const resetTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Store reset token
    await db.run(
      'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
      [resetToken, resetTokenExpires, user.id]
    );

    // Send password reset email (placeholder for now)
    // In production, integrate with email service
    console.log(`📧 Password reset email would be sent to: ${email}`);
    console.log(`🔗 Reset token: ${resetToken}`);
    console.log(`⏰ Expires: ${resetTokenExpires}`);
    console.log(`🌐 Reset URL: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`);

    return NextResponse.json({
      success: true,
      message: 'If this email is registered, you will receive a password reset link shortly.',
      // Include token in development for testing
      ...(process.env.NODE_ENV === 'development' && { 
        resetToken,
        resetUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`
      })
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
