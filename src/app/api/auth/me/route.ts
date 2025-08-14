/**
 * Authentication API - Get current user endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { authService } from '../../../../lib/auth-service';
import Database from 'better-sqlite3';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Get token and verify it
    const token = authService.getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const payload = authService.verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Connect to database and fetch user
    const dbPath = path.join(process.cwd(), 'data', 'mtg-investment.db');
    const db = new Database(dbPath);
    
    try {
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.userId);
      
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Return user profile data (excluding sensitive fields)
      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
          email_verified: user.email_verified,
          created_at: user.created_at,
          last_login_at: user.last_login_at
        }
      });
      
    } finally {
      db.close();
    }

  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
