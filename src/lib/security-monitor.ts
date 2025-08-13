/**
 * Security Monitoring and Logging System
 */

export interface SecurityEvent {
  type: 'auth_success' | 'auth_failure' | 'rate_limit' | 'suspicious_activity' | 'sql_injection_attempt' | 'xss_attempt';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  ip: string;
  userAgent?: string;
  userId?: string;
  details: Record<string, any>;
}

class SecurityMonitor {
  private events: SecurityEvent[] = [];
  private maxEvents = 1000; // Keep last 1000 events in memory
  
  /**
   * Log a security event
   */
  logEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date().toISOString()
    };
    
    this.events.push(securityEvent);
    
    // Keep only the most recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
    
    // Log to console for high severity events
    if (event.severity === 'high' || event.severity === 'critical') {
      console.warn(`🚨 Security Event [${event.severity.toUpperCase()}]:`, {
        type: event.type,
        ip: event.ip,
        details: event.details
      });
    }
    
    // In production, you might want to send alerts or log to external service
    if (process.env.NODE_ENV === 'production' && event.severity === 'critical') {
      this.handleCriticalEvent(securityEvent);
    }
  }
  
  /**
   * Handle critical security events
   */
  private handleCriticalEvent(event: SecurityEvent): void {
    // TODO: Implement alerting system (email, Slack, etc.)
    console.error('🚨 CRITICAL SECURITY EVENT:', event);
  }
  
  /**
   * Get recent security events
   */
  getEvents(filter?: { 
    type?: SecurityEvent['type'];
    severity?: SecurityEvent['severity'];
    since?: string;
    limit?: number;
  }): SecurityEvent[] {
    let filtered = this.events;
    
    if (filter) {
      if (filter.type) {
        filtered = filtered.filter(e => e.type === filter.type);
      }
      if (filter.severity) {
        filtered = filtered.filter(e => e.severity === filter.severity);
      }
      if (filter.since) {
        const sinceDate = new Date(filter.since);
        filtered = filtered.filter(e => new Date(e.timestamp) >= sinceDate);
      }
      if (filter.limit) {
        filtered = filtered.slice(-filter.limit);
      }
    }
    
    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
  
  /**
   * Get security statistics
   */
  getStats(timeWindow: number = 24 * 60 * 60 * 1000): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    uniqueIPs: number;
    suspiciousActivity: number;
  } {
    const cutoff = new Date(Date.now() - timeWindow);
    const recentEvents = this.events.filter(e => new Date(e.timestamp) >= cutoff);
    
    const eventsByType: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};
    const uniqueIPs = new Set<string>();
    
    recentEvents.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
      uniqueIPs.add(event.ip);
    });
    
    const suspiciousActivity = recentEvents.filter(e => 
      e.type === 'sql_injection_attempt' || 
      e.type === 'xss_attempt' || 
      e.severity === 'high' || 
      e.severity === 'critical'
    ).length;
    
    return {
      totalEvents: recentEvents.length,
      eventsByType,
      eventsBySeverity,
      uniqueIPs: uniqueIPs.size,
      suspiciousActivity
    };
  }
  
  /**
   * Check if IP should be blocked based on suspicious activity
   */
  shouldBlockIP(ip: string, timeWindow: number = 60 * 60 * 1000): boolean {
    const cutoff = new Date(Date.now() - timeWindow);
    const recentEvents = this.events.filter(e => 
      e.ip === ip && 
      new Date(e.timestamp) >= cutoff &&
      (e.severity === 'high' || e.severity === 'critical')
    );
    
    // Block if more than 5 high/critical security events in the time window
    return recentEvents.length >= 5;
  }
}

// Global security monitor instance
export const securityMonitor = new SecurityMonitor();

/**
 * Middleware to extract and log request information
 */
export function extractRequestInfo(request: Request): {
  ip: string;
  userAgent?: string;
  referer?: string;
} {
  const headers = request.headers;
  
  return {
    ip: headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
        headers.get('x-real-ip') || 
        headers.get('cf-connecting-ip') ||
        'unknown',
    userAgent: headers.get('user-agent') || undefined,
    referer: headers.get('referer') || undefined
  };
}

/**
 * Detect potential SQL injection attempts
 */
export function detectSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE)?|INSERT|SELECT|UNION|UPDATE)\b)/i,
    /((\%27)|(\'))/i, // single quotes
    /((\%3D)|(=))/i, // equals sign
    /((\%3B)|(;))/i, // semicolon
    /((\%2D)|(-)){2,}/i, // double dashes
    /(\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52)))/i, // 'or'
    /exec(\s|\+)+(s|x)p\w+/i
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Detect potential XSS attempts
 */
export function detectXSS(input: string): boolean {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/i,
    /on\w+\s*=/i, // event handlers
    /<iframe\b/i,
    /<object\b/i,
    /<embed\b/i,
    /eval\(/i,
    /expression\(/i
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
}

export default securityMonitor;
