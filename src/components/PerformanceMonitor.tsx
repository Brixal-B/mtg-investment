"use client";
import React, { useState, useEffect } from 'react';
import { PerformanceMetrics } from '@/types';

interface PerformanceMonitorProps {
  onRefreshPerformance?: () => void;
}

export default function PerformanceMonitor({ onRefreshPerformance }: PerformanceMonitorProps) {
  const [performanceData, setPerformanceData] = useState<{
    current: PerformanceMetrics;
    history: PerformanceSnapshot[];
    benchmarks: PerformanceBenchmarks;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d'>('1h');

  interface PerformanceSnapshot {
    timestamp: string;
    avgResponseTime: number;
    requestsPerMinute: number;
    errorRate: number;
    cacheHitRate: number;
  }

  interface PerformanceBenchmarks {
    responseTime: { good: number; warning: number; critical: number };
    errorRate: { good: number; warning: number; critical: number };
    cacheHitRate: { good: number; warning: number; critical: number };
  }

  const fetchPerformanceData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/performance-monitor?range=${timeRange}`);
      if (!response.ok) {
        throw new Error('Failed to fetch performance data');
      }
      
      const data = await response.json();
      setPerformanceData(data);
      
      if (onRefreshPerformance) {
        onRefreshPerformance();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceData();
    
    // Auto-refresh every minute for performance data
    const interval = setInterval(fetchPerformanceData, 60000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const getPerformanceStatus = (
    value: number,
    benchmarks: { good: number; warning: number; critical: number },
    reverse: boolean = false
  ) => {
    if (reverse) {
      if (value <= benchmarks.good) return 'good';
      if (value <= benchmarks.warning) return 'warning';
      return 'critical';
    } else {
      if (value >= benchmarks.good) return 'good';
      if (value >= benchmarks.warning) return 'warning';
      return 'critical';
    }
  };

  const getStatusColor = (status: 'good' | 'warning' | 'critical') => {
    switch (status) {
      case 'good': return 'text-green-400 bg-green-900/30 border-green-700';
      case 'warning': return 'text-yellow-400 bg-yellow-900/30 border-yellow-700';
      case 'critical': return 'text-red-400 bg-red-900/30 border-red-700';
      default: return 'text-gray-400 bg-gray-900/30 border-gray-700';
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  if (loading && !performanceData) {
    return (
      <section className="w-full max-w-4xl bg-gray-900 rounded-xl shadow-lg p-8 mb-8">
        <h2 className="text-xl font-bold mb-6">Performance Monitor</h2>
        <div className="text-blue-400">Loading performance data...</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="w-full max-w-4xl bg-gray-900 rounded-xl shadow-lg p-8 mb-8">
        <h2 className="text-xl font-bold mb-6">Performance Monitor</h2>
        <div className="text-red-400 bg-red-900/30 border border-red-700 rounded-lg p-4">
          Error: {error}
        </div>
        <button
          onClick={fetchPerformanceData}
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
        <h2 className="text-xl font-bold">Performance Monitor</h2>
        <div className="flex items-center gap-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '1h' | '24h' | '7d')}
            className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-white"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>
          <button
            onClick={fetchPerformanceData}
            disabled={loading}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 rounded text-sm font-medium transition-colors"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {performanceData && (
        <div className="space-y-6">
          {/* Current Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              className={`p-4 rounded-lg border ${getStatusColor(
                getPerformanceStatus(
                  performanceData.current.avgResponseTime,
                  performanceData.benchmarks.responseTime,
                  true
                )
              )}`}
            >
              <h3 className="font-semibold mb-2">Response Time</h3>
              <div className="text-2xl font-bold mb-1">
                {formatDuration(performanceData.current.avgResponseTime)}
              </div>
              <div className="text-sm opacity-75">
                Target: &lt;{formatDuration(performanceData.benchmarks.responseTime.good)}
              </div>
            </div>

            <div className="p-4 rounded-lg border border-blue-700 bg-blue-900/30 text-blue-400">
              <h3 className="font-semibold mb-2">Throughput</h3>
              <div className="text-2xl font-bold mb-1">
                {performanceData.current.requestsPerMinute}
              </div>
              <div className="text-sm opacity-75">requests/min</div>
            </div>

            <div
              className={`p-4 rounded-lg border ${getStatusColor(
                getPerformanceStatus(
                  performanceData.current.cacheHitRate,
                  performanceData.benchmarks.cacheHitRate
                )
              )}`}
            >
              <h3 className="font-semibold mb-2">Cache Hit Rate</h3>
              <div className="text-2xl font-bold mb-1">
                {formatPercentage(performanceData.current.cacheHitRate)}
              </div>
              <div className="text-sm opacity-75">
                Target: &gt;{formatPercentage(performanceData.benchmarks.cacheHitRate.good)}
              </div>
            </div>

            <div
              className={`p-4 rounded-lg border ${getStatusColor(
                getPerformanceStatus(
                  performanceData.current.errorRate,
                  performanceData.benchmarks.errorRate,
                  true
                )
              )}`}
            >
              <h3 className="font-semibold mb-2">Error Rate</h3>
              <div className="text-2xl font-bold mb-1">
                {formatPercentage(performanceData.current.errorRate)}
              </div>
              <div className="text-sm opacity-75">
                Target: &lt;{formatPercentage(performanceData.benchmarks.errorRate.good)}
              </div>
            </div>
          </div>

          {/* Performance Trends */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Performance Trends ({timeRange})</h3>
            <div className="bg-gray-800 rounded-lg p-4">
              {performanceData.history && performanceData.history.length > 0 ? (
                <div className="space-y-4">
                  {/* Simple trend visualization */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">Response Time Trend</h4>
                      <div className="flex items-end gap-1 h-20">
                        {performanceData.history.slice(-20).map((snapshot, index) => {
                          const height = Math.max(
                            10,
                            (snapshot.avgResponseTime / Math.max(...performanceData.history.map(s => s.avgResponseTime))) * 100
                          );
                          return (
                            <div
                              key={index}
                              className="bg-blue-500 flex-1 rounded-t"
                              style={{ height: `${height}%` }}
                              title={`${formatDuration(snapshot.avgResponseTime)} at ${new Date(snapshot.timestamp).toLocaleTimeString()}`}
                            />
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Error Rate Trend</h4>
                      <div className="flex items-end gap-1 h-20">
                        {performanceData.history.slice(-20).map((snapshot, index) => {
                          const height = Math.max(
                            10,
                            (snapshot.errorRate / Math.max(...performanceData.history.map(s => s.errorRate))) * 100
                          );
                          return (
                            <div
                              key={index}
                              className={`flex-1 rounded-t ${
                                snapshot.errorRate > performanceData.benchmarks.errorRate.warning
                                  ? 'bg-red-500'
                                  : 'bg-green-500'
                              }`}
                              style={{ height: `${height}%` }}
                              title={`${formatPercentage(snapshot.errorRate)} at ${new Date(snapshot.timestamp).toLocaleTimeString()}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Recent Snapshots Table */}
                  <div>
                    <h4 className="font-medium mb-2">Recent Snapshots</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="text-left p-2">Time</th>
                            <th className="text-left p-2">Response Time</th>
                            <th className="text-left p-2">Requests/min</th>
                            <th className="text-left p-2">Cache Hit</th>
                            <th className="text-left p-2">Error Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {performanceData.history.slice(-10).reverse().map((snapshot, index) => (
                            <tr key={index} className="border-b border-gray-800">
                              <td className="p-2">{new Date(snapshot.timestamp).toLocaleTimeString()}</td>
                              <td className="p-2">{formatDuration(snapshot.avgResponseTime)}</td>
                              <td className="p-2">{snapshot.requestsPerMinute}</td>
                              <td className="p-2">{formatPercentage(snapshot.cacheHitRate)}</td>
                              <td className="p-2">{formatPercentage(snapshot.errorRate)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-400 text-center py-8">
                  No performance history available
                </div>
              )}
            </div>
          </div>

          {/* Performance Actions */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Performance Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <button className="p-3 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium transition-colors">
                🧹 Clear Cache
              </button>
              <button className="p-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors">
                📊 Export Metrics
              </button>
              <button className="p-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-colors">
                ⚡ Run Benchmark
              </button>
              <button className="p-3 bg-orange-600 hover:bg-orange-700 rounded-lg text-white font-medium transition-colors">
                🔧 Optimize
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
