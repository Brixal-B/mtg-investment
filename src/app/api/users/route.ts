import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling } from '@/lib/errors';

// Mock user data for development
const users = new Map([
  ['user1', {
    id: 'user1',
    username: 'current_user',
    displayName: 'Current User',
    avatar: null,
    tradeRating: 4.5,
    completedTrades: 42,
    isOnline: true,
    lastSeen: new Date().toISOString(),
    joinedAt: '2024-01-15T00:00:00Z'
  }],
  ['user2', {
    id: 'user2',
    username: 'power9_trader',
    displayName: 'Power Nine Trader',
    avatar: null,
    tradeRating: 4.9,
    completedTrades: 189,
    isOnline: false,
    lastSeen: '2025-08-12T10:30:00Z',
    joinedAt: '2022-03-20T00:00:00Z'
  }],
  ['user3', {
    id: 'user3',
    username: 'vintage_master',
    displayName: 'Vintage Master',
    avatar: null,
    tradeRating: 5.0,
    completedTrades: 95,
    isOnline: true,
    lastSeen: new Date().toISOString(),
    joinedAt: '2023-06-10T00:00:00Z'
  }],
  ['user4', {
    id: 'user4',
    username: 'mtg_collector',
    displayName: 'MTG Collector',
    avatar: null,
    tradeRating: 4.8,
    completedTrades: 247,
    isOnline: true,
    lastSeen: new Date().toISOString(),
    joinedAt: '2021-11-05T00:00:00Z'
  }],
  ['user5', {
    id: 'user5',
    username: 'legacy_specialist',
    displayName: 'Legacy Specialist',
    avatar: null,
    tradeRating: 4.7,
    completedTrades: 156,
    isOnline: false,
    lastSeen: '2025-08-11T15:45:00Z',
    joinedAt: '2023-02-28T00:00:00Z'
  }]
]);

export const GET = withErrorHandling(async (req: NextRequest): Promise<NextResponse> => {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const search = searchParams.get('search') || '';
  const exclude = searchParams.get('exclude'); // Exclude specific user ID

  if (userId) {
    // Get specific user
    const user = users.get(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(user);
  }

  // Search users
  let filteredUsers = Array.from(users.values());

  // Exclude specific user if requested
  if (exclude) {
    filteredUsers = filteredUsers.filter(user => user.id !== exclude);
  }

  // Filter by search query
  if (search) {
    const searchLower = search.toLowerCase();
    filteredUsers = filteredUsers.filter(user =>
      user.username.toLowerCase().includes(searchLower) ||
      user.displayName.toLowerCase().includes(searchLower)
    );
  }

  return NextResponse.json({
    users: filteredUsers,
    total: filteredUsers.length
  });
});

export const PUT = withErrorHandling(async (req: NextRequest): Promise<NextResponse> => {
  const body = await req.json();
  const { userId, ...updateData } = body;

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  const user = users.get(userId);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Update user data (only allow certain fields to be updated)
  const allowedFields = ['displayName', 'avatar', 'isOnline', 'lastSeen'] as const;
  const updatedUser = { ...user };

  for (const field of allowedFields) {
    if (field in updateData) {
      (updatedUser as any)[field] = updateData[field];
    }
  }

  users.set(userId, updatedUser);
  return NextResponse.json(updatedUser);
});

export const POST = withErrorHandling(async (req: NextRequest): Promise<NextResponse> => {
  const body = await req.json();
  const { type, ...data } = body;

  switch (type) {
    case 'update_trade_rating': {
      const { userId, newRating, tradeId } = data;
      const user = users.get(userId);
      
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // In a real app, this would calculate the new rating based on the feedback
      // For now, we'll just update it directly
      user.tradeRating = newRating;
      user.completedTrades += 1;
      
      users.set(userId, user);
      return NextResponse.json(user);
    }

    case 'create_user': {
      const { username, displayName } = data;
      const userId = `user_${Date.now()}`;
      
      const newUser = {
        id: userId,
        username,
        displayName: displayName || username,
        avatar: null,
        tradeRating: 5.0, // Start with perfect rating
        completedTrades: 0,
        isOnline: true,
        lastSeen: new Date().toISOString(),
        joinedAt: new Date().toISOString()
      };

      users.set(userId, newUser);
      return NextResponse.json(newUser, { status: 201 });
    }

    default:
      return NextResponse.json({ error: 'Invalid operation type' }, { status: 400 });
  }
});
