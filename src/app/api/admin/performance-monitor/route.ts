import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/errors';

/**
 * GET /api/admin/performance-monitor
 * Provides performance monitoring data for admin dashboard
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '1h';
    
    // Mock performance data - in production this would come from actual APM tools
    const performanceData = {
      current: generateCurrentMetrics(),
      history: generatePerformanceHistory(range),
      benchmarks: {
        responseTime: { good: 100, warning: 500, critical: 1000 },
        errorRate: { good: 0.01, warning: 0.05, critical: 0.1 },
        cacheHitRate: { good: 0.9, warning: 0.7, critical: 0.5 }
      }
    };

    return NextResponse.json(performanceData);
    
  } catch (error) {
    console.error('Performance monitor error:', error);
    return createErrorResponse(error, 'Failed to fetch performance data');
  }
}

function generateCurrentMetrics() {
  return {
    avgResponseTime: Math.random() * 200 + 50, // 50-250ms
    requestsPerMinute: Math.floor(Math.random() * 100 + 20), // 20-120 req/min
    cacheHitRate: Math.random() * 0.3 + 0.7, // 70-100%
    errorRate: Math.random() * 0.03, // 0-3%
    throughput: Math.random() * 1000 + 500, // 500-1500 req/s
    activeUsers: Math.floor(Math.random() * 10 + 1) // 1-10 users
  };
}

function generatePerformanceHistory(range: string) {
  const history = [];
  let dataPoints = 0;
  let intervalMs = 0;
  
  switch (range) {
    case '1h':
      dataPoints = 60; // Every minute for 1 hour
      intervalMs = 60 * 1000;
      break;
    case '24h':
      dataPoints = 144; // Every 10 minutes for 24 hours
      intervalMs = 10 * 60 * 1000;
      break;
    case '7d':
      dataPoints = 168; // Every hour for 7 days
      intervalMs = 60 * 60 * 1000;
      break;
    default:
      dataPoints = 60;
      intervalMs = 60 * 1000;
  }
  
  const now = Date.now();
  
  for (let i = dataPoints - 1; i >= 0; i--) {
    const timestamp = new Date(now - (i * intervalMs)).toISOString();
    
    // Add some variability and trends
    const timeFactor = i / dataPoints;
    const baseResponseTime = 80 + (Math.sin(timeFactor * Math.PI * 4) * 30);
    const baseErrorRate = 0.01 + (Math.random() * 0.02);
    
    history.push({
      timestamp,
      avgResponseTime: Math.max(20, baseResponseTime + (Math.random() * 40 - 20)),
      requestsPerMinute: Math.floor(30 + (Math.sin(timeFactor * Math.PI * 2) * 20) + (Math.random() * 20)),
      errorRate: Math.max(0, baseErrorRate + (Math.random() * 0.01 - 0.005)),
      cacheHitRate: Math.min(1, 0.85 + (Math.random() * 0.1))
    });
  }
  
  return history;
}
