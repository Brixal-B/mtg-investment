"use client";
import React from 'react';

interface FileStatus {
  name: string;
  status: string;
  size?: string;
  id: string;
}

interface FileStatusPanelProps {
  files: FileStatus[];
  onRefresh: () => void;
  isLoading: boolean;
}

export default function FileStatusPanel({ files, onRefresh, isLoading }: FileStatusPanelProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6">
      <h3 className="text-lg font-semibold mb-3 text-blue-400">File Status & Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {files.map((file) => (
          <div key={file.id} className="bg-gray-700 rounded p-3">
            <div className="text-sm text-gray-400 mb-1">{file.name}</div>
            <div className="text-green-400 font-semibold" id={`${file.id}-status`}>
              {file.status}
            </div>
            {file.size && (
              <div className="text-xs text-gray-500" id={`${file.id}-size`}>
                {file.size}
              </div>
            )}
          </div>
        ))}
      </div>
      <button 
        onClick={onRefresh} 
        disabled={isLoading} 
        className="mt-3 px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 text-white text-sm font-semibold disabled:opacity-60"
      >
        Refresh File Status
      </button>
    </div>
  );
}

// Default file status configuration
export const defaultFileStatus: FileStatus[] = [
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
