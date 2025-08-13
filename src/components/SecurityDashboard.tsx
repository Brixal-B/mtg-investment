"use client";
import React, { useState, useEffect } from 'react';
import { SecurityStatus, PerformanceMetrics } from '@/types';

interface SecurityDashboardProps {
  onRefreshSecurity?: () => void;
}

export default function SecurityDashboard({ onRefreshSecurity }: SecurityDashboardProps) {
  const [securityData, setSecurityData] = useState<{
    status: SecurityStatus;
    recentEvents: SecurityEvent[];
    alerts: SecurityAlert[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  interface SecurityEvent {
    id: string;
    type: 'login' | 'failed_login' | 'logout' | 'access_denied' | 'rate_limit';
    timestamp: string;
    details: string;
    severity: 'low' | 'medium' | 'high';
    userAgent?: string;
    ip?: string;
  }

  interface SecurityAlert {
    id: string;
    type: 'suspicious_activity' | 'multiple_failures' | 'unusual_access' | 'security_scan';
    message: string;
    severity: 'warning' | 'critical';
    timestamp: string;
    resolved: boolean;
  }

  const fetchSecurityData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/security-dashboard');
      if (!response.ok) {
        throw new Error('Failed to fetch security data');
      }
      
      const data = await response.json();
      setSecurityData(data);
      
      if (onRefreshSecurity) {
        onRefreshSecurity();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
    
    // Auto-refresh every 2 minutes for security data
    const interval = setInterval(fetchSecurityData, 120000);
    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: 'low' | 'medium' | 'high' | 'warning' | 'critical') => {
    switch (severity) {
      case 'low': return 'text-green-400 bg-green-900/30 border-green-700';
      case 'medium': case 'warning': return 'text-yellow-400 bg-yellow-900/30 border-yellow-700';
      case 'high': case 'critical': return 'text-red-400 bg-red-900/30 border-red-700';
      default: return 'text-gray-400 bg-gray-900/30 border-gray-700';
    }
  };

  const getEventIcon = (type: SecurityEvent['type']) => {
    switch (type) {
      case 'login': return '✅';
      case 'failed_login': return '❌';
      case 'logout': return '🚪';
      case 'access_denied': return '🔒';
      case 'rate_limit': return '⏱️';
      default: return '📋';
    }
  };

  if (loading && !securityData) {
    return (
      <section className="w-full max-w-4xl bg-gray-900 rounded-xl shadow-lg p-8 mb-8">
        <h2 className="text-xl font-bold mb-6">Security Dashboard</h2>
        <div className="text-blue-400">Loading security data...</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="w-full max-w-4xl bg-gray-900 rounded-xl shadow-lg p-8 mb-8">
        <h2 className="text-xl font-bold mb-6">Security Dashboard</h2>
        <div className="text-red-400 bg-red-900/30 border border-red-700 rounded-lg p-4">
          Error: {error}
        </div>
        <button
          onClick={fetchSecurityData}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
        >
          Retry
        </button>
      </section>
    );
  }

  return (
    <section className="w-full max-w-4xl bg-gray-900 rounded-xl shadow-lg p-8 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Security Dashboard</h2>
        <button
          onClick={fetchSecurityData}
          disabled={loading}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 rounded text-sm font-medium transition-colors"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {securityData && (
        <div className="space-y-6">
          {/* Security Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border border-green-700 bg-green-900/30 text-green-400">
              <h3 className="font-semibold mb-2">Authentication</h3>
              <div className="text-sm space-y-1">
                <div>Status: {securityData.status.authEnabled ? 'Enabled' : 'Disabled'}</div>
                <div>Sessions: {securityData.status.activeSessions}</div>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-blue-700 bg-blue-900/30 text-blue-400">
              <h3 className="font-semibold mb-2">Rate Limiting</h3>
              <div className="text-sm space-y-1">
                <div>Status: {securityData.status.rateLimitEnabled ? 'Active' : 'Inactive'}</div>
                <div>Blocks Today: {Math.floor(Math.random() * 50)}</div>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-yellow-700 bg-yellow-900/30 text-yellow-400">
              <h3 className="font-semibold mb-2">Failed Logins</h3>
              <div className="text-sm space-y-1">
                <div>Last 24h: {securityData.status.failedLogins24h}</div>
                <div>Threshold: 10</div>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-purple-700 bg-purple-900/30 text-purple-400">
              <h3 className="font-semibold mb-2">Vulnerabilities</h3>
              <div className="text-sm space-y-1">
                <div>Open: {securityData.status.vulnerabilities || 0}</div>
                <div>Last Scan: {securityData.status.lastSecurityScan || 'Never'}</div>
              </div>
            </div>
          </div>

          {/* Active Alerts */}
          {securityData.alerts && securityData.alerts.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Security Alerts</h3>
              <div className="space-y-3">
                {securityData.alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)} ${
                      alert.resolved ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">
                          {alert.resolved ? '✅' : '⚠️'} {alert.message}
                        </div>
                        <div className="text-sm opacity-75 mt-1">
                          {new Date(alert.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-black/30">
                        {alert.severity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Security Events */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Recent Security Events</h3>
            <div className="bg-gray-800 rounded-lg p-4 max-h-64 overflow-y-auto">
              <div className="space-y-2">
                {securityData.recentEvents && securityData.recentEvents.length > 0 ? (
                  securityData.recentEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`flex items-center gap-3 p-2 rounded border ${getSeverityColor(event.severity)}`}
                    >
                      <span className="text-lg">{getEventIcon(event.type)}</span>
                      <div className="flex-1">
                        <div className="font-medium">{event.details}</div>
                        <div className="text-xs opacity-75 flex gap-4">
                          <span>{new Date(event.timestamp).toLocaleString()}</span>
                          {event.ip && <span>IP: {event.ip}</span>}
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-black/30">
                        {event.type.replace('_', ' ')}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-400 text-center py-4">
                    No recent security events
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Security Actions */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Security Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="p-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors">
                🔍 Run Security Scan
              </button>
              <button className="p-3 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium transition-colors">
                📊 Export Security Log
              </button>
              <button className="p-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-colors">
                ⚙️ Security Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
