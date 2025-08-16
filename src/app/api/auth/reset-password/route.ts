/**
 * Reset Password API - Reset user password with token
 */

import { NextRequest, NextResponse } from 'next/server';
import { authService } from '../../../../lib/auth-service';
import { validateInput } from '../../../../lib/validation';
import Database from '../../../../lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = validateInput(body, {
      token: { required: true, type: 'string' },
      password: { required: true, type: 'string', minLength: 8 },
      confirmPassword: { required: true, type: 'string' }
    });

    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.errors },
        { status: 400 }
      );
    }

    const { token, password, confirmPassword } = body;

    // Check if passwords match
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: 'Password does not meet requirements', details: passwordValidation.errors },
        { status: 400 }
      );
    }

    const { database: db } = Database;
    await db.initialize();

    // Find user with valid reset token
    const user = await db.get(
      'SELECT id, email, reset_token, reset_token_expires FROM users WHERE reset_token = ?',
      [token]
    );

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Check if token has expired
    if (new Date() > new Date(user.reset_token_expires)) {
      return NextResponse.json(
        { error: 'Reset token has expired. Please request a new password reset.' },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await authService.hashPassword(password);

    // Update password and clear reset token
    await db.run(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      [passwordHash, user.id]
    );

    console.log(`✅ Password reset successfully for user: ${user.email}`);

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
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
  
  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}
