import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/errors';

/**
 * GET /api/admin/security-dashboard
 * Provides security monitoring data for admin dashboard
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Mock security data - in production this would come from actual security monitoring
    const securityData = {
      status: {
        authEnabled: process.env.AUTH_ENABLED === 'true',
        rateLimitEnabled: true,
        activeSessions: Math.floor(Math.random() * 5 + 1),
        failedLogins24h: Math.floor(Math.random() * 3),
        vulnerabilities: 0,
        lastSecurityScan: new Date(Date.now() - Math.random() * 86400000).toISOString()
      },
      recentEvents: generateMockSecurityEvents(),
      alerts: generateMockSecurityAlerts()
    };

    return NextResponse.json(securityData);
    
  } catch (error) {
    console.error('Security dashboard error:', error);
    return createErrorResponse(error, 'Failed to fetch security data');
  }
}

function generateMockSecurityEvents() {
  const eventTypes = ['login', 'failed_login', 'logout', 'access_denied', 'rate_limit'] as const;
  const events = [];
  
  for (let i = 0; i < 10; i++) {
    const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const timestamp = new Date(Date.now() - Math.random() * 86400000).toISOString();
    
    events.push({
      id: `evt_${Date.now()}_${i}`,
      type,
      timestamp,
      details: getEventDetails(type),
      severity: getEventSeverity(type),
      ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
      userAgent: 'Mozilla/5.0 (compatible admin client)'
    });
  }
  
  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function generateMockSecurityAlerts() {
  const alerts = [];
  
  // Generate some random alerts
  if (Math.random() > 0.7) {
    alerts.push({
      id: `alert_${Date.now()}`,
      type: 'multiple_failures' as const,
      message: 'Multiple failed login attempts detected from same IP',
      severity: 'warning' as const,
      timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      resolved: Math.random() > 0.5
    });
  }
  
  if (Math.random() > 0.9) {
    alerts.push({
      id: `alert_${Date.now()}_2`,
      type: 'suspicious_activity' as const,
      message: 'Unusual access pattern detected',
      severity: 'critical' as const,
      timestamp: new Date(Date.now() - Math.random() * 7200000).toISOString(),
      resolved: false
    });
  }
  
  return alerts;
}

function getEventDetails(type: string): string {
  switch (type) {
    case 'login': return 'User successfully authenticated';
    case 'failed_login': return 'Authentication failed - invalid credentials';
    case 'logout': return 'User session terminated';
    case 'access_denied': return 'Access denied to protected resource';
    case 'rate_limit': return 'Request rate limit exceeded';
    default: return 'Security event occurred';
  }
}

function getEventSeverity(type: string): 'low' | 'medium' | 'high' {
  switch (type) {
    case 'login': case 'logout': return 'low';
    case 'failed_login': case 'rate_limit': return 'medium';
    case 'access_denied': return 'high';
    default: return 'medium';
  }
}
