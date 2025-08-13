"use client";
import React, { useState, useEffect } from 'react';
import { SystemMetrics, DatabaseHealth, PerformanceMetrics } from '@/types';

interface SystemMetricsPanelProps {
  onRefreshMetrics?: () => void;
}

export default function SystemMetricsPanel({ onRefreshMetrics }: SystemMetricsPanelProps) {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchSystemMetrics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/system-metrics');
      if (!response.ok) {
        throw new Error('Failed to fetch system metrics');
      }
      
      const data = await response.json();
      setMetrics(data);
      setLastUpdated(new Date().toLocaleTimeString());
      
      if (onRefreshMetrics) {
        onRefreshMetrics();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemMetrics();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchSystemMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getHealthColor = (status: 'healthy' | 'warning' | 'critical') => {
    switch (status) {
      case 'healthy': return 'text-green-400 bg-green-900/30 border-green-700';
      case 'warning': return 'text-yellow-400 bg-yellow-900/30 border-yellow-700';
      case 'critical': return 'text-red-400 bg-red-900/30 border-red-700';
      default: return 'text-gray-400 bg-gray-900/30 border-gray-700';
    }
  };

  if (loading && !metrics) {
    return (
      <section className="w-full max-w-4xl bg-gray-900 rounded-xl shadow-lg p-8 mb-8">
        <h2 className="text-xl font-bold mb-6">System Metrics</h2>
        <div className="text-blue-400">Loading system metrics...</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="w-full max-w-4xl bg-gray-900 rounded-xl shadow-lg p-8 mb-8">
        <h2 className="text-xl font-bold mb-6">System Metrics</h2>
        <div className="text-red-400 bg-red-900/30 border border-red-700 rounded-lg p-4">
          Error: {error}
        </div>
        <button
          onClick={fetchSystemMetrics}
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
        <h2 className="text-xl font-bold">System Metrics</h2>
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <span className="text-sm text-gray-400">
              Last updated: {lastUpdated}
            </span>
          )}
          <button
            onClick={fetchSystemMetrics}
            disabled={loading}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 rounded text-sm font-medium transition-colors"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* System Health Overview */}
          <div className={`p-4 rounded-lg border ${getHealthColor(metrics.systemHealth.status)}`}>
            <h3 className="font-semibold mb-3">System Health</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="font-medium capitalize">{metrics.systemHealth.status}</span>
              </div>
              <div className="flex justify-between">
                <span>Uptime:</span>
                <span>{formatUptime(metrics.systemHealth.uptime)}</span>
              </div>
              <div className="flex justify-between">
                <span>CPU Usage:</span>
                <span>{metrics.systemHealth.cpuUsage.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Memory:</span>
                <span>{formatBytes(metrics.systemHealth.memoryUsage)} / {formatBytes(metrics.systemHealth.totalMemory)}</span>
              </div>
            </div>
          </div>

          {/* Database Health */}
          <div className={`p-4 rounded-lg border ${getHealthColor(metrics.database.status)}`}>
            <h3 className="font-semibold mb-3">Database Health</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="font-medium capitalize">{metrics.database.status}</span>
              </div>
              <div className="flex justify-between">
                <span>Connection Pool:</span>
                <span>{metrics.database.activeConnections}/{metrics.database.maxConnections}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Records:</span>
                <span>{metrics.database.totalRecords.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Avg Query Time:</span>
                <span>{metrics.database.avgQueryTime}ms</span>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="p-4 rounded-lg border border-blue-700 bg-blue-900/30 text-blue-400">
            <h3 className="font-semibold mb-3">Performance</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Avg Response:</span>
                <span>{metrics.performance.avgResponseTime}ms</span>
              </div>
              <div className="flex justify-between">
                <span>Requests/min:</span>
                <span>{metrics.performance.requestsPerMinute}</span>
              </div>
              <div className="flex justify-between">
                <span>Cache Hit Rate:</span>
                <span>{(metrics.performance.cacheHitRate * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Error Rate:</span>
                <span>{(metrics.performance.errorRate * 100).toFixed(2)}%</span>
              </div>
            </div>
          </div>

          {/* File System Status */}
          <div className="p-4 rounded-lg border border-purple-700 bg-purple-900/30 text-purple-400">
            <h3 className="font-semibold mb-3">File System</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Data Directory:</span>
                <span className="text-xs font-mono">{metrics.fileSystem.dataDirectory}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Size:</span>
                <span>{formatBytes(metrics.fileSystem.totalSize)}</span>
              </div>
              <div className="flex justify-between">
                <span>Available:</span>
                <span>{formatBytes(metrics.fileSystem.freeSpace)}</span>
              </div>
              <div className="flex justify-between">
                <span>Usage:</span>
                <span>{((1 - metrics.fileSystem.freeSpace / metrics.fileSystem.totalSize) * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Security Status */}
          <div className="p-4 rounded-lg border border-green-700 bg-green-900/30 text-green-400">
            <h3 className="font-semibold mb-3">Security</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Auth Status:</span>
                <span className="font-medium">{metrics.security.authEnabled ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div className="flex justify-between">
                <span>Rate Limiting:</span>
                <span className="font-medium">{metrics.security.rateLimitEnabled ? 'Active' : 'Inactive'}</span>
              </div>
              <div className="flex justify-between">
                <span>Active Sessions:</span>
                <span>{metrics.security.activeSessions}</span>
              </div>
              <div className="flex justify-between">
                <span>Failed Logins (24h):</span>
                <span>{metrics.security.failedLogins24h}</span>
              </div>
            </div>
          </div>

          {/* Application Info */}
          <div className="p-4 rounded-lg border border-gray-700 bg-gray-800/50 text-gray-300">
            <h3 className="font-semibold mb-3">Application</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Version:</span>
                <span className="font-mono">{metrics.application.version}</span>
              </div>
              <div className="flex justify-between">
                <span>Environment:</span>
                <span className="font-medium capitalize">{metrics.application.environment}</span>
              </div>
              <div className="flex justify-between">
                <span>Build:</span>
                <span className="font-mono text-xs">{metrics.application.buildHash}</span>
              </div>
              <div className="flex justify-between">
                <span>Started:</span>
                <span>{new Date(metrics.application.startTime).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
