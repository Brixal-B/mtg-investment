import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminToolsPanel from '@/components/AdminToolsPanel';

describe('AdminToolsPanel', () => {
  const defaultProps = {
    adminStatus: 'idle',
    adminLoading: false,
    downloadProgress: null,
    downloadSpeed: null,
    importProgress: null,
    importPhase: null,
    importRate: null,
    importEta: null,
    importProcessed: null,
    importTotal: null,
    onDownloadMtgjson: jest.fn(),
    onImportMtgjson: jest.fn(),
    onDebugImportMtgjson: jest.fn(),
    onDownloadPriceHistory: jest.fn(),
    onDownloadImportLog: jest.fn(),
    onRefreshFileStatus: jest.fn(),
    onTestJsonValidity: jest.fn(),
    onClearLogs: jest.fn(),
    onClearImportLock: jest.fn(),
    fileStatus: {
      mtgjsonExists: false,
      mtgjsonSize: null,
      mtgjsonLastModified: null,
      priceHistoryExists: false,
      priceHistorySize: null,
      importLogExists: false
    },
    dbStats: {
      totalCards: 0,
      totalPrices: 0,
      lastUpdate: null,
      dbSize: 0
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders admin status correctly', () => {
    render(<AdminToolsPanel {...defaultProps} />);
    
    expect(screen.getByText(/admin status/i)).toBeInTheDocument();
  });

  it('handles download MTGJSON action', () => {
    render(<AdminToolsPanel {...defaultProps} />);
    
    const downloadButton = screen.getByRole('button', { name: /download/i });
    fireEvent.click(downloadButton);
    
    expect(defaultProps.onDownloadMtgjson).toHaveBeenCalled();
  });

  it('handles import MTGJSON action', () => {
    render(<AdminToolsPanel {...defaultProps} />);
    
    const importButton = screen.getByRole('button', { name: /import/i });
    fireEvent.click(importButton);
    
    expect(defaultProps.onImportMtgjson).toHaveBeenCalled();
  });

  it('shows loading state correctly', () => {
    render(<AdminToolsPanel {...defaultProps} adminLoading={true} />);
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays download progress', () => {
    render(<AdminToolsPanel {...defaultProps} downloadProgress={50} />);
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('shows import progress with phase', () => {
    render(<AdminToolsPanel 
      {...defaultProps} 
      importProgress={75} 
      importPhase="Processing cards" 
    />);
    
    expect(screen.getByText('Processing cards')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });
});