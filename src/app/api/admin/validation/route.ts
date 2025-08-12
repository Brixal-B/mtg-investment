import { NextResponse } from 'next/server';
import {
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling
} from '@/lib';
import { databaseTester, apiCompatibilityTester } from '@/lib/testing';
import { dbOptimizer } from '@/lib/performance';

export const GET = withErrorHandling(async (request: Request): Promise<NextResponse> => {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'database';

  try {
    if (action === 'database') {
      // Run database tests
      const report = await databaseTester.runAllTests();
      return createSuccessResponse(report);
    } else if (action === 'api') {
      // Run API compatibility tests
      const report = await apiCompatibilityTester.testApiCompatibility();
      return createSuccessResponse(report);
    } else if (action === 'performance') {
      // Get performance statistics
      const cacheStats = dbOptimizer.getCacheStats();
      const cleanedEntries = dbOptimizer.cleanupCache();
      
      const performance = {
        cache: cacheStats,
        cleanedEntries,
        timestamp: new Date().toISOString(),
        recommendations: [
          'Monitor cache hit rate to optimize query caching',
          'Consider increasing cache TTL for frequently accessed data',
          'Use batch operations for large data imports'
        ]
      };
      
      return createSuccessResponse(performance);
    } else if (action === 'warmup') {
      // Warm up the cache
      await dbOptimizer.warmCache();
      
      return createSuccessResponse({
        message: 'Cache warmed up successfully',
        cacheStats: dbOptimizer.getCacheStats()
      });
    } else {
      throw new Error(`Unsupported action: ${action}`);
    }
  } catch (error) {
    console.error('Validation API error:', error);
    return createErrorResponse(
      error,
      'Failed to run validation tests',
      500
    );
  }
});