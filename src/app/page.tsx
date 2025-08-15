"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Card, ApiResponse, AdminStatus, DownloadProgress, ImportProgress } from '@/types';
import { 
  DashboardCards, 
  defaultDashboardCards, 
  AdminToolsPanel,
  CardFilters,
  CSVUpload,
  CardGrid
} from '@/components';
import Papa from "papaparse";

// Utility to trigger backend actions
async function triggerApiAction(path: string, method: string = 'POST'): Promise<any> {
  const res = await fetch(path, { method });
  if (!res.ok) throw new Error(await res.text());
  return res.json ? res.json() : undefined;
}

interface FeatureCard {
  title: string;
  description: string;
  icon: string;
  link: string;
  status: 'ready' | 'beta' | 'admin';
  features: string[];
}

interface Stats {
  totalCards?: number;
  totalSets?: number;
  lastUpdated?: string;
  databaseSize?: string;
}

export default function Home() {
  // Admin/tools state
  const [adminStatus, setAdminStatus] = useState<string>("");
  const [adminLoading, setAdminLoading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [downloadSpeed, setDownloadSpeed] = useState<string | null>(null);
  
  // Import progress state
  const [importProgress, setImportProgress] = useState<number | null>(null);
  const [importPhase, setImportPhase] = useState<string | null>(null);
  const [importRate, setImportRate] = useState<number | null>(null);
  const [importEta, setImportEta] = useState<number | null>(null);
  const [importProcessed, setImportProcessed] = useState<number | null>(null);
  const [importTotal, setImportTotal] = useState<number | null>(null);

  // Collection state
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showNoPrice, setShowNoPrice] = useState(false);
  
  // Filter state
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [searchName, setSearchName] = useState("");
  const [searchSet, setSearchSet] = useState("");
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const [showSetSuggestions, setShowSetSuggestions] = useState(false);
  
  // New state for homepage
  const [stats, setStats] = useState<Stats>({});
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [showAdminTools, setShowAdminTools] = useState(false);
  
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Load file status on component mount
  useEffect(() => {
    refreshFileStatus();
  }, []);

  // Computed values
  const cardsNoPrice = cards.filter(card => !card.price);
  const nameSuggestions = searchName ? 
    [...new Set(cards.filter(card => card && card.name).map(c => c.name))].filter(name => 
      name.toLowerCase().includes(searchName.toLowerCase())
    ).slice(0, 10) : [];
  const setSuggestions = searchSet ? 
    [...new Set(cards.filter(card => card && card.set_name).map(c => c.set_name).filter(Boolean) as string[])].filter(setName => 
      setName.toLowerCase().includes(searchSet.toLowerCase())
    ).slice(0, 10) : [];

  const filteredCards = cards.filter(card => {
    if (!card || !card.name) return false;
    if (showNoPrice) return !card.price;
    const price = card.price ? parseFloat(card.price) : 0;
    if (minPrice && price < parseFloat(minPrice)) return false;
    if (maxPrice && price > parseFloat(maxPrice)) return false;
    if (searchName && !card.name.toLowerCase().includes(searchName.toLowerCase())) return false;
    if (searchSet && card.set_name && card.set_name.toLowerCase() !== searchSet.toLowerCase()) return false;
    return true;
  });

  const total = filteredCards.reduce((sum, card) => sum + (card.price ? parseFloat(card.price) : 0), 0);

  // Feature cards for homepage
  const featureCards: FeatureCard[] = [
    {
      title: "Card Browser",
      description: "Browse and search through Magic: The Gathering cards from the comprehensive database",
      icon: "🃏",
      link: "/index-mtgjson",
      status: "ready",
      features: [
        "Search by card name, set, or rarity",
        "Filter by mana cost, colors, and type",
        "Paginated browsing with high-resolution images",
        "Database-driven for fast performance"
      ]
    },
    {
      title: "Investment Tracking",
      description: "Track your MTG card collection and monitor investment performance over time",
      icon: "📈",
      link: "/portfolio",
      status: "ready",
      features: [
        "Portfolio management with price tracking",
        "Historical price data and trends",
        "Investment performance analytics",
        "CSV import for bulk collection uploads"
      ]
    },
    {
      title: "Card Search",
      description: "Advanced search functionality with real-time filtering and suggestions",
      icon: "🔍",
      link: "/card-search",
      status: "ready",
      features: [
        "Real-time search with autocomplete",
        "Advanced filtering options",
        "Integration with Scryfall API",
        "Detailed card information display"
      ]
    },
    {
      title: "Admin Dashboard",
      description: "Comprehensive administration tools for system management and data processing",
      icon: "⚙️",
      link: "/admin",
      status: "admin",
      features: [
        "MTGJSON data management",
        "System monitoring and metrics",
        "Database administration",
        "Security and performance tools"
      ]
    },
    {
      title: "Authentication",
      description: "Secure user registration and login system with session management",
      icon: "🔐",
      link: "/auth/login",
      status: "ready",
      features: [
        "Secure user registration",
        "Email verification system",
        "Password reset functionality",
        "Session management"
      ]
    },
    {
      title: "Trading System",
      description: "Track card trades and transactions with other players",
      icon: "🔄",
      link: "/trades",
      status: "beta",
      features: [
        "Trade tracking and history",
        "Transaction management",
        "User-to-user interactions",
        "Trade value calculations"
      ]
    }
  ];

  // Load database statistics
  useEffect(() => {
    async function loadStats() {
      try {
        // Get card count from filters API
        const filtersRes = await fetch('/api/cards/filters');
        if (filtersRes.ok) {
          const filtersData = await filtersRes.json();
          const setsCount = filtersData.data.sets?.length || 0;
          
          // Get total cards from a browse request
          const browseRes = await fetch('/api/cards/browse?limit=1');
          if (browseRes.ok) {
            const browseData = await browseRes.json();
            const totalCards = browseData.data.pagination?.totalCards || 0;
            
            setStats({
              totalCards,
              totalSets: setsCount,
              lastUpdated: new Date().toLocaleDateString(),
              databaseSize: "Local SQLite"
            });
            setStatsLoaded(true);
          }
        }
      } catch (error) {
        console.error('Failed to load stats:', error);
        setStatsLoaded(true); // Set to true even on error to avoid infinite loading
      }
    }
    
    loadStats();
  }, []);

  // Admin action handlers
  async function refreshFileStatus() {
    try {
      const [mtgjsonRes, priceHistoryRes] = await Promise.all([
        fetch("/api/admin/check-mtgjson"),
        fetch("/api/price-history")
      ]);

      if (mtgjsonRes.ok) {
        const check = await mtgjsonRes.json();
        const statusEl = document.getElementById("mtgjson-status");
        const sizeEl = document.getElementById("mtgjson-size");
        if (statusEl) {
          statusEl.textContent = check.exists ? "✅ Downloaded" : "❌ Not found";
          statusEl.className = check.exists ? "text-green-400 font-semibold" : "text-red-400 font-semibold";
        }
        if (sizeEl && check.exists) {
          sizeEl.textContent = `Size: ${(check.size / 1024 / 1024).toFixed(1)} MB`;
        }
      }

      if (priceHistoryRes.ok) {
        const data = await priceHistoryRes.json();
        const statusEl = document.getElementById("price-history-status");
        const sizeEl = document.getElementById("price-history-size");
        if (statusEl) {
          statusEl.textContent = data.length > 0 ? "✅ Available" : "❌ No data";
          statusEl.className = data.length > 0 ? "text-green-400 font-semibold" : "text-red-400 font-semibold";
        }
        if (sizeEl && data.length > 0) {
          sizeEl.textContent = `Snapshots: ${data.length}`;
        }
      }
    } catch (error: unknown) {
      console.error("Error refreshing file status:", error);
    }
  }

  async function handleDownloadMtgjson() {
    setAdminStatus("Checking for existing MTGJSON file...");
    setAdminLoading(true);
    setDownloadProgress(0);
    setDownloadSpeed(null);
    
    let poller: NodeJS.Timeout | null = null;
    let lastReceived = 0;
    let lastTime = Date.now();
    
    function formatSpeed(bytesPerSec: number) {
      if (bytesPerSec > 1024 * 1024) return (bytesPerSec / (1024 * 1024)).toFixed(2) + ' MB/s';
      if (bytesPerSec > 1024) return (bytesPerSec / 1024).toFixed(1) + ' KB/s';
      return bytesPerSec.toFixed(0) + ' B/s';
    }
    
    function formatBytes(bytes: number) {
      if (bytes > 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
      if (bytes > 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
      if (bytes > 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return bytes + ' B';
    }
    
    try {
      const checkRes = await fetch("/api/admin/check-mtgjson");
      if (checkRes.ok) {
        const checkText = await checkRes.text();
        let check: any = {};
        try {
          check = checkText && checkText.trim() ? JSON.parse(checkText) : {};
        } catch (parseError) {
          console.error('Failed to parse check response:', parseError);
          check = {};
        }
        
        if (check.exists) {
          // Frontend Agent: Check if download is in progress using new API
          const progressRes = await fetch("/api/admin/download-mtgjson");
          if (progressRes.ok) {
            const progressData = await progressRes.json();
            
            if (progressData.status === 'downloading' && progressData.progress) {
              const { percent } = progressData.progress;
              setAdminStatus(`AllPrices.json is currently downloading: ${percent}% complete.`);
              setAdminLoading(false);
              return;
            }
          }
          setAdminStatus(`AllPrices.json already downloaded (${(check.size/1024/1024).toFixed(1)} MB).`);
          setAdminLoading(false);
          return;
        }
      }
      
      setAdminStatus("Starting MTGJSON download...");
      
      // Frontend Agent: Start download with new async API
      const startRes = await fetch("/api/admin/download-mtgjson", { 
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!startRes.ok) {
        const errorText = await startRes.text();
        console.error('Download start failed:', startRes.status, startRes.statusText, errorText);
        throw new Error(`Failed to start download: ${startRes.status} ${startRes.statusText} - ${errorText}`);
      }

      const startResponse = await startRes.json();
      console.log('🚀 Download started:', startResponse);
      
      setAdminStatus(`Download started (ID: ${startResponse.downloadId}). Tracking progress...`);

      // Frontend Agent: Poll for status using new async GET endpoint
      poller = setInterval(async () => {
        try {
          const statusRes = await fetch("/api/admin/download-mtgjson");
          if (!statusRes.ok) {
            console.error('Status check failed:', statusRes.status);
            return;
          }
          
          const statusData = await statusRes.json();
          
          if (statusData.error) {
            console.error('Download error:', statusData.error);
            clearInterval(poller!);
            setAdminStatus(`Download failed: ${statusData.error}`);
            setAdminLoading(false);
            return;
          }

          const { status, progress } = statusData;
          
          if (status === 'downloading' && progress) {
            const { percent, received, total, speed } = progress;
            setDownloadProgress(percent);
            
            // Convert bytes per second to readable format
            if (speed) {
              setDownloadSpeed(formatSpeed(speed));
            }
            
            setAdminStatus(`Downloading: ${percent}% complete (${formatBytes(received)}/${formatBytes(total)})`);
          } else if (status === 'completed') {
            clearInterval(poller!);
            setDownloadProgress(100);
            setDownloadSpeed(null);
            setAdminStatus("MTGJSON file downloaded successfully! You can now import price history.");
            setAdminLoading(false);
          } else if (status === 'failed') {
            clearInterval(poller!);
            setAdminStatus(`Download failed: ${statusData.error || 'Unknown error'}`);
            setAdminLoading(false);
          }
        } catch (error) {
          console.error('Status polling error:', error);
        }
      }, 2000); // Poll every 2 seconds

    } catch (error: unknown) {
      setAdminStatus(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setAdminLoading(false);
      setDownloadProgress(null);
      if (poller) clearInterval(poller);
      await refreshFileStatus();
    }
  }

  async function handleImportMtgjson() {
    await startImport(false);
  }

  async function handleDebugImportMtgjson() {
    await startImport(true);
  }

  async function startImport(debugMode: boolean) {
    setAdminStatus(debugMode ? "Starting debug import (first 20 cards)..." : "Starting import...");
    setAdminLoading(true);
    setImportProgress(0);
    setImportPhase("starting");
    setImportRate(null);
    setImportEta(null);
    setImportProcessed(null);
    setImportTotal(null);

    let poller: NodeJS.Timeout | null = null;

    try {
      const checkRes = await fetch("/api/admin/check-mtgjson");
      if (!checkRes.ok || !(await checkRes.json()).exists) {
        setAdminStatus("❌ AllPrices.json not found. Please download MTGJSON first.");
        setAdminLoading(false);
        return;
      }

      const url = debugMode ? "/api/admin/import-mtgjson?debug=true" : "/api/admin/import-mtgjson";
      const startRes = await fetch(url, { method: "POST" });
      
      if (!startRes.ok) {
        const errorText = await startRes.text();
        throw new Error(errorText);
      }

      await new Promise<void>((resolve, reject) => {
        poller = setInterval(async () => {
          try {
            const res = await fetch("/api/admin/import-mtgjson?progress=1");
            if (!res.ok) return;
            
            const data = await res.json();
            
            if (!data.inProgress) {
              clearInterval(poller!);
              setAdminStatus("✅ Import completed successfully!");
              setImportPhase("completed");
              resolve();
              return;
            }

            if (data.progress !== undefined) setImportProgress(data.progress);
            if (data.phase) setImportPhase(data.phase);
            if (data.rate) setImportRate(data.rate);
            if (data.eta) setImportEta(data.eta);
            if (data.processed !== undefined) setImportProcessed(data.processed);
            if (data.total !== undefined) setImportTotal(data.total);
          } catch (e) {
            // ignore polling errors
          }
        }, 2000);

        setTimeout(() => {
          clearInterval(poller!);
          reject(new Error("Import timeout"));
        }, 30 * 60 * 1000);
      });
    } catch (error: unknown) {
      setAdminStatus(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setAdminLoading(false);
      setImportProgress(null);
      setImportPhase(null);
      if (poller) clearInterval(poller);
      await refreshFileStatus();
    }
  }

  async function handleDownloadPriceHistory() {
    try {
      setAdminLoading(true);
      setAdminStatus("Downloading price history...");
      const response = await fetch("/api/price-history/download");
      if (!response.ok) throw new Error("Download failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'price-history.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setAdminStatus("✅ Price history downloaded successfully!");
    } catch (error: unknown) {
      setAdminStatus(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setAdminLoading(false);
    }
  }

  async function handleDownloadImportLog() {
    try {
      setAdminLoading(true);
      setAdminStatus("Downloading import log...");
      const response = await fetch("/api/admin/import-log");
      if (!response.ok) throw new Error("Download failed");
      
      const data = await response.json();
      const blob = new Blob([data.log || "No log data available"], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'import-log.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setAdminStatus("✅ Import log downloaded successfully!");
    } catch (error: unknown) {
      setAdminStatus(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setAdminLoading(false);
    }
  }

  async function testJsonValidity() {
    try {
      setAdminLoading(true);
      const result = await triggerApiAction("/api/test-json");
      setAdminStatus(`✅ JSON validity test: ${JSON.stringify(result, null, 2)}`);
    } catch (error: unknown) {
      setAdminStatus(`❌ JSON test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setAdminLoading(false);
    }
  }

  async function clearLogs() {
    try {
      setAdminLoading(true);
      await triggerApiAction("/api/admin/clear-logs");
      setAdminStatus("✅ Logs cleared successfully!");
    } catch (error: unknown) {
      setAdminStatus(`❌ Clear logs failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setAdminLoading(false);
    }
  }

  async function clearImportLock() {
    try {
      setAdminLoading(true);
      await triggerApiAction("/api/admin/clear-import-lock");
      setAdminStatus("✅ Import lock cleared successfully!");
    } catch (error: unknown) {
      setAdminStatus(`❌ Clear lock failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setAdminLoading(false);
    }
  }

  // CSV handling
  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setProgress(0);
    
    try {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (result) => {
          const data = result.data as any[];
          setProgress(10);
          
          const cardPromises = data.map(async (row, index) => {
            const cardName = row.Name || row.name || row.card_name;
            if (!cardName) return null;

            try {
              const response = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}`);
              if (!response.ok) return { name: cardName, price: row.Price || row.price };
              
              const cardData = await response.json();
              const price = cardData.prices?.usd || row.Price || row.price;
              
              return {
                name: cardName,
                imageUrl: cardData.image_uris?.normal,
                price: price,
                set: cardData.set,
                set_name: cardData.set_name
              };
            } catch {
              return { name: cardName, price: row.Price || row.price };
            } finally {
              setProgress(10 + Math.floor((index / data.length) * 90));
            }
          });

          const resolvedCards = await Promise.all(cardPromises);
          const validCards = resolvedCards.filter(Boolean) as Card[];
          
          setCards(validCards);
          setProgress(100);
          setLoading(false);
        },
        error: (error) => {
          console.error("CSV parsing error:", error);
          setLoading(false);
        }
      });
    } catch (error: unknown) {
      console.error("File processing error:", error);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen w-full flex flex-col bg-gray-950 text-gray-100">
      {/* Hero Section */}
      <section className="w-full bg-gradient-to-br from-blue-950 via-purple-950 to-gray-950 py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-blue-900/30 border border-blue-700 rounded-full text-blue-300 text-sm mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
              System Online • Database Ready • API Active
            </div>
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-6">
              MTG Investment Tracker
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Professional Magic: The Gathering card investment tracking with comprehensive database,
              real-time pricing, and advanced portfolio analytics
            </p>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-gray-900/50 backdrop-blur border border-gray-700 rounded-xl p-6">
              <div className="text-3xl font-bold text-blue-400 mb-2">
                {statsLoaded ? (stats.totalCards?.toLocaleString() || "0") : "—"}
              </div>
              <div className="text-gray-400">Total Cards</div>
            </div>
            <div className="bg-gray-900/50 backdrop-blur border border-gray-700 rounded-xl p-6">
              <div className="text-3xl font-bold text-purple-400 mb-2">
                {statsLoaded ? (stats.totalSets || "0") : "—"}
              </div>
              <div className="text-gray-400">Sets Available</div>
            </div>
            <div className="bg-gray-900/50 backdrop-blur border border-gray-700 rounded-xl p-6">
              <div className="text-3xl font-bold text-green-400 mb-2">Real-Time</div>
              <div className="text-gray-400">Price Updates</div>
            </div>
            <div className="bg-gray-900/50 backdrop-blur border border-gray-700 rounded-xl p-6">
              <div className="text-3xl font-bold text-orange-400 mb-2">
                {statsLoaded ? (stats.databaseSize || "Local") : "—"}
              </div>
              <div className="text-gray-400">Database</div>
            </div>
          </div>
          
          {/* Primary Actions */}
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href="/index-mtgjson"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center gap-2"
            >
              🃏 Browse Cards
            </Link>
            <Link 
              href="/portfolio"
              className="px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center gap-2"
            >
              📈 Track Portfolio
            </Link>
            <Link 
              href="/card-search"
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center gap-2"
            >
              � Search Cards
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-100 mb-4">Platform Capabilities</h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Comprehensive tools for Magic: The Gathering collectors, investors, and players
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featureCards.map((feature, index) => (
              <div key={feature.title} className="bg-gray-900/50 backdrop-blur border border-gray-700 rounded-xl p-8 hover:border-blue-500/50 transition-all duration-300 group">
                <div className="flex items-start justify-between mb-6">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    feature.status === 'ready' ? 'bg-green-900/30 text-green-400 border border-green-500/30' :
                    feature.status === 'beta' ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-500/30' :
                    'bg-blue-900/30 text-blue-400 border border-blue-500/30'
                  }`}>
                    {feature.status === 'ready' ? 'Ready' : feature.status === 'beta' ? 'Beta' : 'Admin'}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-100 mb-3 group-hover:text-blue-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-400 mb-6">{feature.description}</p>
                <ul className="space-y-2 mb-8">
                  {feature.features.map((feat, i) => (
                    <li key={i} className="flex items-center text-gray-300 text-sm">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link
                  href={feature.link}
                  className="inline-flex items-center px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-100 rounded-lg transition-all duration-200 group-hover:bg-blue-600/20 group-hover:text-blue-400 font-medium"
                >
                  Explore Feature
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Tools Section - Collapsible */}
      <section className="w-full py-12 px-4 bg-gray-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-100 mb-2">Development Tools</h2>
              <p className="text-gray-400">Admin tools, CSV upload, and system management</p>
            </div>
            <button
              onClick={() => setShowAdminTools(!showAdminTools)}
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-100 rounded-lg transition-all duration-200 flex items-center gap-2"
            >
              {showAdminTools ? 'Hide Tools' : 'Show Tools'}
              <svg 
                className={`w-4 h-4 transition-transform ${showAdminTools ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          
          {showAdminTools && (
            <div className="space-y-8 animate-in slide-in-from-top duration-300">
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
                onRefreshFileStatus={refreshFileStatus}
                onTestJsonValidity={testJsonValidity}
                onClearLogs={clearLogs}
                onClearImportLock={clearImportLock}
              />
              
              <CSVUpload
                onFileChange={handleFileChange}
                cards={cards}
                showNoPrice={showNoPrice}
                setShowNoPrice={setShowNoPrice}
                cardsNoPrice={cardsNoPrice}
                total={total}
                loading={loading}
                progress={progress}
              />
              
              {cards.length > 0 && (
                <>
                  <CardFilters
                    minPrice={minPrice}
                    maxPrice={maxPrice}
                    searchName={searchName}
                    searchSet={searchSet}
                    setMinPrice={setMinPrice}
                    setMaxPrice={setMaxPrice}
                    setSearchName={setSearchName}
                    setSearchSet={setSearchSet}
                    showNameSuggestions={showNameSuggestions}
                    setShowNameSuggestions={setShowNameSuggestions}
                    showSetSuggestions={showSetSuggestions}
                    setShowSetSuggestions={setShowSetSuggestions}
                    nameSuggestions={nameSuggestions}
                    setSuggestions={setSuggestions}
                    nameInputRef={nameInputRef}
                  />
                  <CardGrid cards={showNoPrice ? cardsNoPrice : filteredCards} showNoPrice={showNoPrice} />
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-12 px-4 border-t border-gray-800 bg-gray-950">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <h3 className="text-2xl font-bold text-gray-100 mb-4">MTG Investment Tracker</h3>
              <p className="text-gray-400 mb-4">
                Professional-grade Magic: The Gathering investment tracking platform built with modern web technologies.
                Features comprehensive card database, real-time pricing, and advanced portfolio analytics.
              </p>
              <div className="flex items-center text-gray-500 text-sm">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                Last updated: {statsLoaded ? (stats.lastUpdated || new Date().toLocaleDateString()) : new Date().toLocaleDateString()}
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-gray-200 mb-4">Features</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Card Database Browser</li>
                <li>Investment Portfolio</li>
                <li>Advanced Search</li>
                <li>Price History</li>
                <li>Trading System</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-gray-200 mb-4">Technology</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Next.js 13+</li>
                <li>TypeScript</li>
                <li>SQLite Database</li>
                <li>MTGJSON Integration</li>
                <li>Scryfall API</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-500">
            <p>&copy; 2025 MTG Investment Tracker. Built for collectors, investors, and players.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
