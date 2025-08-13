/**
 * Enhanced Security Validation Middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateInput, sanitizeHTML, sanitizeSQL } from './validation';
import { securityMonitor, extractRequestInfo, detectSQLInjection, detectXSS } from './security-monitor';

/**
 * Comprehensive security validation middleware
 */
export function withSecurityValidation(
  handler: (request: NextRequest, validatedData?: any) => Promise<NextResponse>,
  options: {
    validateBody?: boolean;
    sanitizeInputs?: boolean;
    logSuspiciousActivity?: boolean;
    blockSuspiciousIPs?: boolean;
  } = {}
) {
  const {
    validateBody = true,
    sanitizeInputs = true,
    logSuspiciousActivity = true,
    blockSuspiciousIPs = true
  } = options;

  return async (request: NextRequest) => {
    const requestInfo = extractRequestInfo(request);
    
    // Check if IP should be blocked
    if (blockSuspiciousIPs && securityMonitor.shouldBlockIP(requestInfo.ip)) {
      if (logSuspiciousActivity) {
        securityMonitor.logEvent({
          type: 'suspicious_activity',
          severity: 'high',
          ip: requestInfo.ip,
          userAgent: requestInfo.userAgent,
          details: { reason: 'blocked_ip', action: 'request_blocked' }
        });
      }
      
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    let requestData: any = {};
    
    // Parse and validate request body
    if (validateBody && (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH')) {
      try {
        const contentType = request.headers.get('content-type') || '';
        
        if (contentType.includes('application/json')) {
          requestData = await request.json();
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
          const formData = await request.formData();
          requestData = Object.fromEntries(formData.entries());
        }
      } catch (error) {
        if (logSuspiciousActivity) {
          securityMonitor.logEvent({
            type: 'suspicious_activity',
            severity: 'medium',
            ip: requestInfo.ip,
            userAgent: requestInfo.userAgent,
            details: { reason: 'invalid_json', error: error instanceof Error ? error.message : 'Unknown error' }
          });
        }
        
        return NextResponse.json(
          { error: 'Invalid request format' },
          { status: 400 }
        );
      }
    }

    // Security validation for all string inputs
    if (requestData && typeof requestData === 'object') {
      const suspiciousInputs = validateInputSecurity(requestData, requestInfo, logSuspiciousActivity);
      
      if (suspiciousInputs.length > 0) {
        return NextResponse.json(
          { error: 'Invalid input detected', details: suspiciousInputs },
          { status: 400 }
        );
      }
      
      // Sanitize inputs if requested
      if (sanitizeInputs) {
        requestData = sanitizeInputData(requestData);
      }
    }

    // Validate URL parameters
    const url = new URL(request.url);
    const urlParams = Object.fromEntries(url.searchParams.entries());
    
    if (Object.keys(urlParams).length > 0) {
      const suspiciousParams = validateInputSecurity(urlParams, requestInfo, logSuspiciousActivity);
      
      if (suspiciousParams.length > 0) {
        return NextResponse.json(
          { error: 'Invalid URL parameters detected' },
          { status: 400 }
        );
      }
    }

    // Call the original handler with validated data
    return handler(request, requestData);
  };
}

/**
 * Validate input data for security threats
 */
function validateInputSecurity(
  data: Record<string, any>, 
  requestInfo: { ip: string; userAgent?: string }, 
  logEvents: boolean
): string[] {
  const issues: string[] = [];
  
  function checkValue(key: string, value: any): void {
    if (typeof value === 'string') {
      // Check for SQL injection
      if (detectSQLInjection(value)) {
        issues.push(`SQL injection attempt detected in field: ${key}`);
        
        if (logEvents) {
          securityMonitor.logEvent({
            type: 'sql_injection_attempt',
            severity: 'critical',
            ip: requestInfo.ip,
            userAgent: requestInfo.userAgent,
            details: { 
              field: key, 
              value: value.substring(0, 100), // Log first 100 chars
              pattern: 'sql_injection'
            }
          });
        }
      }
      
      // Check for XSS
      if (detectXSS(value)) {
        issues.push(`XSS attempt detected in field: ${key}`);
        
        if (logEvents) {
          securityMonitor.logEvent({
            type: 'xss_attempt',
            severity: 'high',
            ip: requestInfo.ip,
            userAgent: requestInfo.userAgent,
            details: { 
              field: key, 
              value: value.substring(0, 100),
              pattern: 'xss'
            }
          });
        }
      }
      
      // Check for excessively long inputs (potential DoS)
      if (value.length > 10000) {
        issues.push(`Excessively long input in field: ${key}`);
        
        if (logEvents) {
          securityMonitor.logEvent({
            type: 'suspicious_activity',
            severity: 'medium',
            ip: requestInfo.ip,
            userAgent: requestInfo.userAgent,
            details: { 
              field: key, 
              length: value.length,
              pattern: 'excessive_length'
            }
          });
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      // Recursively check nested objects
      if (Array.isArray(value)) {
        value.forEach((item, index) => checkValue(`${key}[${index}]`, item));
      } else {
        Object.entries(value).forEach(([nestedKey, nestedValue]) => {
          checkValue(`${key}.${nestedKey}`, nestedValue);
        });
      }
    }
  }
  
  Object.entries(data).forEach(([key, value]) => checkValue(key, value));
  
  return issues;
}

/**
 * Sanitize input data
 */
function sanitizeInputData(data: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  function sanitizeValue(value: any): any {
    if (typeof value === 'string') {
      // Apply both HTML and SQL sanitization
      let sanitizedValue = sanitizeHTML(value);
      sanitizedValue = sanitizeSQL(sanitizedValue);
      return sanitizedValue;
    } else if (Array.isArray(value)) {
      return value.map(item => sanitizeValue(item));
    } else if (typeof value === 'object' && value !== null) {
      const sanitizedObj: Record<string, any> = {};
      Object.entries(value).forEach(([key, val]) => {
        sanitizedObj[key] = sanitizeValue(val);
      });
      return sanitizedObj;
    }
    return value;
  }
  
  Object.entries(data).forEach(([key, value]) => {
    sanitized[key] = sanitizeValue(value);
  });
  
  return sanitized;
}

/**
 * Enhanced input validation with security checks
 */
export function validateWithSecurity(data: any, schema: any) {
  // First run standard validation
  const result = validateInput(data, schema);
  
  if (!result.isValid) {
    return result;
  }
  
  // Then run security validation
  const requestInfo = { ip: 'server', userAgent: 'server' };
  const securityIssues = validateInputSecurity(data, requestInfo, false);
  
  if (securityIssues.length > 0) {
    return {
      isValid: false,
      errors: { security: securityIssues.join(', ') },
      sanitizedData: result.sanitizedData
    };
  }
  
  return result;
}

export default withSecurityValidation;
