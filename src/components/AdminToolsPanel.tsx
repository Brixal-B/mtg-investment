"use client";
import React from 'react';
import FileStatusPanel from './FileStatusPanel';
import AdminActionButtons from './AdminActionButtons';
import ProgressBar from './ProgressBar';
import QuickActions from './QuickActions';

interface AdminToolsPanelProps {
  // Status and progress
  adminStatus: string;
  adminLoading: boolean;
  downloadProgress: number | null;
  downloadSpeed: string | null;
  importProgress: number | null;
  importPhase: string | null;
  importRate: number | null;
  importEta: number | null;
  importProcessed: number | null;
  importTotal: number | null;
  
  // Action handlers
  onDownloadMtgjson: () => void;
  onImportMtgjson: () => void;
  onDebugImportMtgjson: () => void;
  onDownloadPriceHistory: () => void;
  onDownloadImportLog: () => void;
  onRefreshFileStatus: () => void;
  onTestJsonValidity: () => void;
  onClearLogs: () => void;
  onClearImportLock: () => void;
}

export default function AdminToolsPanel({
  adminStatus,
  adminLoading,
  downloadProgress,
  downloadSpeed,
  importProgress,
  importPhase,
  importRate,
  importEta,
  importProcessed,
  importTotal,
  onDownloadMtgjson,
  onImportMtgjson,
  onDebugImportMtgjson,
  onDownloadPriceHistory,
  onDownloadImportLog,
  onRefreshFileStatus,
  onTestJsonValidity,
  onClearLogs,
  onClearImportLock
}: AdminToolsPanelProps) {
  
  const adminActions = [
    {
      id: 'download',
      label: 'Download MTGJSON',
      description: '~1.05 GB AllPrices.json',
      onClick: onDownloadMtgjson,
      color: 'blue' as const
    },
    {
      id: 'import',
      label: 'Import to Price History',
      description: 'Process AllPrices.json',
      onClick: onImportMtgjson,
      color: 'green' as const
    },
    {
      id: 'debug',
      label: '🐛 Debug Import',
      description: 'Test with first 20 cards',
      onClick: onDebugImportMtgjson,
      color: 'yellow' as const
    },
    {
      id: 'download-history',
      label: 'Download Price History',
      description: 'Export processed data',
      onClick: onDownloadPriceHistory,
      color: 'purple' as const
    },
    {
      id: 'download-log',
      label: 'Download Import Log',
      description: 'Debug information',
      onClick: onDownloadImportLog,
      color: 'orange' as const
    }
  ];

  const quickActions = [
    {
      id: 'test-json',
      label: 'Test JSON Validity',
      onClick: onTestJsonValidity
    },
    {
      id: 'clear-logs',
      label: 'Clear Logs',
      onClick: onClearLogs
    },
    {
      id: 'clear-lock',
      label: 'Clear Import Lock',
      onClick: onClearImportLock,
      color: 'red' as const
    },
    {
      id: 'browse-data',
      label: 'Browse Card Database',
      href: '/index-mtgjson'
    }
  ];

  const fileStatus = [
    {
      id: "mtgjson",
      name: "AllPrices.json",
      status: "Checking..."
    },
    {
      id: "price-history", 
      name: "price-history.json",
      status: "Checking..."
    }
  ];

  return (
    <section id="admin-tools" className="w-full max-w-4xl bg-gray-900 rounded-xl shadow-lg p-8 mb-12">
      <h2 className="text-xl font-bold mb-6">Admin / Tools</h2>
      
      <FileStatusPanel 
        files={fileStatus}
        onRefresh={onRefreshFileStatus}
        isLoading={adminLoading}
      />
      
      <AdminActionButtons 
        actions={adminActions}
        isLoading={adminLoading}
      />
      
      {/* Progress Bars */}
      {typeof downloadProgress === 'number' && (
        <ProgressBar
          progress={downloadProgress}
          title="Downloading MTGJSON"
          color="blue"
          speed={downloadSpeed || undefined}
        />
      )}

      {typeof importProgress === 'number' && (
        <ProgressBar
          progress={importProgress}
          title="Importing MTGJSON"
          color="green"
          phase={importPhase || undefined}
          rate={importRate || undefined}
          eta={importEta || undefined}
          processed={importProcessed || undefined}
          total={importTotal || undefined}
        />
      )}

      {/* Status Display */}
      {adminLoading && <div className="text-blue-400 font-semibold">Working...</div>}
      {adminStatus && (
        <div className={`mt-4 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap ${
          adminStatus.includes('failed') ? 'bg-red-900/30 text-red-400 border border-red-700' : 
          'bg-blue-900/30 text-blue-400 border border-blue-700'
        }`}>
          {adminStatus}
        </div>
      )}

      <QuickActions 
        actions={quickActions}
        isLoading={adminLoading}
      />
    </section>
  );
}
