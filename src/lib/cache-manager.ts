/**
 * Cache Manager - Advanced caching strategies for MTG Investment app
 */

// In-memory cache for frequent lookups
class MemoryCache {
  private cache = new Map<string, { data: unknown; expires: number }>();
  private maxSize = 1000;

  set(key: string, data: unknown, ttlMs: number = 300000): void { // 5 min default
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data,
      expires: Date.now() + ttlMs
    });
  }

  get<T = unknown>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data as T;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Cache configuration
export const CACHE_CONFIG = {
  ttl: {
    mtgjson: 24 * 60 * 60 * 1000,    // 24 hours
    prices: 60 * 60 * 1000,          // 1 hour  
    search: 5 * 60 * 1000,           // 5 minutes
    cards: 30 * 60 * 1000,           // 30 minutes
    user_preferences: 12 * 60 * 60 * 1000 // 12 hours
  },
  maxSize: {
    memory: 1000,
    redis: 10000
  }
};

// Global cache instances
export const memoryCache = new MemoryCache();

// Cache key generators
export const generateCacheKey = {
  mtgjson: (version?: string) => `mtgjson:data:${version || 'latest'}`,
  priceHistory: (cardId: string, timeframe: string) => `prices:${cardId}:${timeframe}`,
  searchResults: (query: string, filters: string) => `search:${query}:${filters}`,
  cardData: (cardId: string) => `card:${cardId}`,
  userPrefs: (userId: string) => `user:${userId}:prefs`
};

// Cache utilities
export const cacheUtils = {
  // Cached API call wrapper
  cachedApiCall: async <T>(
    key: string,
    apiCall: () => Promise<T>,
    ttl: number = CACHE_CONFIG.ttl.cards
  ): Promise<T> => {
    const cached = memoryCache.get<T>(key);
    if (cached) return cached;
    
    const result = await apiCall();
    memoryCache.set(key, result, ttl);
    return result;
  },
  
  // Batch cache operations
  batchSet: (items: Array<{ key: string; data: unknown; ttl?: number }>) => {
    items.forEach(({ key, data, ttl }) => {
      memoryCache.set(key, data, ttl);
    });
  },
  
  // Cache warming for frequently accessed data
  warmCache: async () => {
    console.log('🔥 Warming cache with frequently accessed data...');
    // Implement cache warming strategies
  }
};

// Redis setup (for production scaling)
export const redisConfig = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true
};

export default {
  memoryCache,
  CACHE_CONFIG,
  generateCacheKey,
  cacheUtils,
  redisConfig
};
