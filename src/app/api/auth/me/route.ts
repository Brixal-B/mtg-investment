/**
 * Authentication API - Get current user endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { authService } from '../../../../lib/auth-service';

export async function GET(request: NextRequest) {
  try {
    const user = await authService.getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
