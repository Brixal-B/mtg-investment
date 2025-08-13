"use client";
import React, { useState, useEffect } from 'react';
import { 
  AdminToolsPanel, 
  SystemMetricsPanel, 
  SecurityDashboard, 
  PerformanceMonitor 
} from '@/components';
import { AdminStatus, DownloadProgress, ImportProgress } from '@/types';

export default function EnhancedAdminPage() {
  // Existing admin state from original page
  const [adminStatus, setAdminStatus] = useState<string>('');
  const [adminLoading, setAdminLoading] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [downloadSpeed, setDownloadSpeed] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState<number | null>(null);
  const [importPhase, setImportPhase] = useState<string | null>(null);
  const [importRate, setImportRate] = useState<number | null>(null);
  const [importEta, setImportEta] = useState<number | null>(null);
  const [importProcessed, setImportProcessed] = useState<number | null>(null);
  const [importTotal, setImportTotal] = useState<number | null>(null);

  // Enhanced admin state
  const [activeTab, setActiveTab] = useState<'overview' | 'system' | 'security' | 'performance'>('overview');
  const [lastRefresh, setLastRefresh] = useState<string>('');

  // Update last refresh timestamp
  const updateLastRefresh = () => {
    setLastRefresh(new Date().toLocaleTimeString());
  };

  // Existing admin handlers (preserved from original functionality)
  const handleDownloadMtgjson = async () => {
    setAdminLoading(true);
    setAdminStatus('Starting MTGJSON download...');
    
    try {
      const response = await fetch('/api/admin/download-mtgjson', { method: 'POST' });
      const data = await response.json();
      setAdminStatus(data.message || 'Download completed');
    } catch (error) {
      setAdminStatus(`Download failed: ${error}`);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleImportMtgjson = async () => {
    setAdminLoading(true);
    setAdminStatus('Starting MTGJSON import...');
    
    try {
      const response = await fetch('/api/admin/import-mtgjson', { method: 'POST' });
      const data = await response.json();
      setAdminStatus(data.message || 'Import completed');
    } catch (error) {
      setAdminStatus(`Import failed: ${error}`);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleDebugImportMtgjson = async () => {
    setAdminLoading(true);
    setAdminStatus('Starting debug import (first 20 cards)...');
    
    try {
      const response = await fetch('/api/admin/import-mtgjson?debug=true', { method: 'POST' });
      const data = await response.json();
      setAdminStatus(data.message || 'Debug import completed');
    } catch (error) {
      setAdminStatus(`Debug import failed: ${error}`);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleDownloadPriceHistory = async () => {
    try {
      const response = await fetch('/api/price-history');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'price-history.json';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setAdminStatus(`Download failed: ${error}`);
    }
  };

  const handleDownloadImportLog = async () => {
    try {
      const response = await fetch('/api/admin/download-import-log');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'import.log';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setAdminStatus(`Log download failed: ${error}`);
    }
  };

  const handleRefreshFileStatus = async () => {
    setAdminStatus('Refreshing file status...');
    updateLastRefresh();
    // File status refresh is handled by individual components
    setAdminStatus('File status refreshed');
  };

  const handleTestJsonValidity = async () => {
    setAdminLoading(true);
    setAdminStatus('Testing JSON validity...');
    
    try {
      const response = await fetch('/api/test-json');
      const data = await response.json();
      setAdminStatus(data.message || 'JSON validation completed');
    } catch (error) {
      setAdminStatus(`JSON test failed: ${error}`);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleClearLogs = async () => {
    try {
      const response = await fetch('/api/admin/clear-logs', { method: 'POST' });
      const data = await response.json();
      setAdminStatus(data.message || 'Logs cleared');
    } catch (error) {
      setAdminStatus(`Clear logs failed: ${error}`);
    }
  };

  const handleClearImportLock = async () => {
    try {
      const response = await fetch('/api/admin/clear-import-lock', { method: 'POST' });
      const data = await response.json();
      setAdminStatus(data.message || 'Import lock cleared');
    } catch (error) {
      setAdminStatus(`Clear lock failed: ${error}`);
    }
  };

  const handleRefreshAll = () => {
    updateLastRefresh();
    setAdminStatus('Refreshing all dashboards...');
    // Trigger refresh for all components
    handleRefreshFileStatus();
  };

  const tabs = [
    { id: 'overview', label: '📊 Overview', description: 'Admin tools and file operations' },
    { id: 'system', label: '⚙️ System', description: 'System health and metrics' },
    { id: 'security', label: '🔒 Security', description: 'Security monitoring and alerts' },
    { id: 'performance', label: '⚡ Performance', description: 'Performance metrics and optimization' }
  ] as const;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Enhanced Admin Dashboard
              </h1>
              <p className="text-gray-400 mt-2">
                Comprehensive system monitoring and administration
              </p>
            </div>
            <div className="flex items-center gap-4">
              {lastRefresh && (
                <span className="text-sm text-gray-400">
                  Last refresh: {lastRefresh}
                </span>
              )}
              <button
                onClick={handleRefreshAll}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
              >
                🔄 Refresh All
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
                title={tab.description}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === 'overview' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">System Overview</h2>
              <AdminToolsPanel
                adminStatus={adminStatus}
                adminLoading={adminLoading}
                downloadProgress={downloadProgress}
                downloadSpeed={downloadSpeed}
                importProgress={importProgress}
                importPhase={importPhase}
                importRate={importRate}
                importEta={importEta}
                importProcessed={importProcessed}
                importTotal={importTotal}
                onDownloadMtgjson={handleDownloadMtgjson}
                onImportMtgjson={handleImportMtgjson}
                onDebugImportMtgjson={handleDebugImportMtgjson}
                onDownloadPriceHistory={handleDownloadPriceHistory}
                onDownloadImportLog={handleDownloadImportLog}
                onRefreshFileStatus={handleRefreshFileStatus}
                onTestJsonValidity={handleTestJsonValidity}
                onClearLogs={handleClearLogs}
                onClearImportLock={handleClearImportLock}
              />
            </div>
          )}

          {activeTab === 'system' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">System Metrics</h2>
              <SystemMetricsPanel onRefreshMetrics={updateLastRefresh} />
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Security Dashboard</h2>
              <SecurityDashboard onRefreshSecurity={updateLastRefresh} />
            </div>
          )}

          {activeTab === 'performance' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Performance Monitor</h2>
              <PerformanceMonitor onRefreshPerformance={updateLastRefresh} />
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>MTG Investment Admin Dashboard - Enhanced with System Monitoring</p>
          <p className="mt-1">
            Built with {tabs.length} monitoring modules using existing agent infrastructure
          </p>
        </div>
      </div>
    </div>
  );
}
