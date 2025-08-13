"use client";
import React from 'react';
import { UserProfile } from '@/types/trading';
import { User, Star } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface UserSearchProps {
  users: UserProfile[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isLoading: boolean;
  onUserSelect: (user: UserProfile) => void;
}

const UserSearch: React.FC<UserSearchProps> = ({
  users,
  searchQuery,
  setSearchQuery,
  isLoading,
  onUserSelect
}) => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-secondary-900">Start a New Trade</h1>
          <p className="text-secondary-600 mt-2">Search for a user to trade with</p>
        </div>

        <div className="p-6">
          <div className="relative mb-6">
            <div className="absolute left-3 top-3">
              <svg className="w-4 h-4 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search users by username or display name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" text="Loading users..." />
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border border-secondary-200 rounded-lg hover:border-primary-300 cursor-pointer transition-colors"
                  onClick={() => onUserSelect(user)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-secondary-200 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-secondary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-secondary-900">{user.displayName}</h3>
                      <p className="text-sm text-secondary-600">@{user.username}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-warning-400 fill-current" />
                          <span className="text-sm text-secondary-600">{user.tradeRating}</span>
                        </div>
                        <span className="text-sm text-secondary-600">{user.completedTrades} trades</span>
                        <div className="flex items-center space-x-1">
                          <div className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-success-400' : 'bg-secondary-400'}`} />
                          <span className="text-sm text-secondary-600">
                            {user.isOnline ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                    Start Trade
                  </button>
                </div>
              ))}
              {users.length === 0 && searchQuery && (
                <div className="text-center py-8 text-secondary-500">
                  No users found matching "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserSearch;
