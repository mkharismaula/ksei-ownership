import { useState, useEffect, useMemo } from 'react';
import {
  loadKSEIData,
  groupByStock,
  getStockList,
  buildInvestorIndex,
  getCrossStockLinks,
} from './utils/dataLoader';
import StockSearch from './components/StockSearch';
import StatsCards from './components/StatsCards';
import OwnershipChart from './components/OwnershipChart';
import RelationshipTree from './components/RelationshipTree';
import ShareholderTable from './components/ShareholderTable';
import LocalForeignChart from './components/LocalForeignChart';
import CrossStockRelationships from './components/CrossStockRelationships';
import ShareholderProfile from './components/ShareholderProfile';
import ConglomerateSelector from './components/ConglomerateSelector';
import WhaleTracker from './components/WhaleTracker';
import ConnectionFinder from './components/ConnectionFinder';
import FloatAnalysis from './components/FloatAnalysis';
import NetworkGraph from './components/NetworkGraph';
import ConglomerateProfile from './components/ConglomerateProfile';
import CompanyProfile from './components/CompanyProfile';
import { CONGLOMERATES } from './utils/conglomerates';


function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCode, setSelectedCode] = useState(null);
  const [selectedShareholder, setSelectedShareholder] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [selectedConglo, setSelectedConglo] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard | whales | connections
  const [viewCongloProfile, setViewCongloProfile] = useState(null);

  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check local storage or system preference
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ksei-theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Apply dark mode class to body whenever it changes
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('ksei-theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('ksei-theme', 'light');
    }
  }, [isDarkMode]);

  // Load data on mount (and on retry) — handles React 18 StrictMode double-mount
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    loadKSEIData()
      .then((rawData) => {
        if (!cancelled) {
          setData(rawData);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Failed to load data:', err);
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [retryCount]);

  // Retry handler
  const handleRetry = () => {
    setRetryCount((c) => c + 1);
  };

  // Memoized data processing...
  const { stockMap, dataDate } = useMemo(() => {
    if (!data || data.length === 0) return { stockMap: {}, dataDate: null };
    const date = data[0].date || null; // Changed from reportingDate to date to match original data structure
    return { stockMap: groupByStock(data), dataDate: date };
  }, [data]);

  const stockList = useMemo(() => getStockList(stockMap), [stockMap]);

  // Build index for sharing/searching across all shareholders
  const investorIndex = useMemo(() => {
    if (!data || data.length === 0) return {};
    return buildInvestorIndex(data);
  }, [data]);

  // Auto-select first stock once loaded
  useEffect(() => {
    if (stockList.length > 0 && !selectedCode) {
      setSelectedCode(stockList[0].code);
    }
  }, [stockList, selectedCode]);

  // Get data for selected stock
  const selectedStock = selectedCode ? stockMap[selectedCode] : null;
  const shareholders = selectedStock ? selectedStock.shareholders : [];

  // Cross-stock links for selected stock
  const crossLinks = useMemo(() => {
    if (!shareholders || shareholders.length === 0 || !data) return [];
    return getCrossStockLinks(shareholders, investorIndex, selectedCode); // Changed data to investorIndex to match original function signature
  }, [shareholders, investorIndex, selectedCode]); // Changed data to investorIndex in dependency array

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <div className="loading-text">Loading KSEI shareholder data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading-container">
        <div style={{ fontSize: 48 }}>⚠️</div>
        <div className="loading-text">Error: {error}</div>
        <button
          onClick={handleRetry}
          style={{
            padding: '12px 28px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            marginTop: 8,
          }}
        >
          🔄 Retry
        </button>
      </div>
    );
  }

  // Handle selection from search
  const handleSelectStock = (code) => {
    setSelectedCode(code);
    setSelectedShareholder(null);
    setActiveTab('dashboard');
    setViewCongloProfile(null);
    setSelectedConglo(null);
  };

  const handleSelectShareholder = (investorName) => {
    setSelectedShareholder(investorName);
    setActiveTab('dashboard');
    setViewCongloProfile(null);
    setSelectedConglo(null);
  };

  // Handle conglomerate profile view
  const handleViewCongloProfile = (name) => {
    setViewCongloProfile(name);
    setActiveTab('dashboard');
  };

  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <div className="header-brand">
            <div className="header-logo">K</div>
            <div>
              <div className="header-title">KSEI Shareholder Dashboard</div>
              <div className="header-subtitle">Stock Ownership & Relationship Explorer</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {dataDate && <div className="header-date">📅 Data: {dataDate}</div>}
            <div className="header-date">📊 {stockList.length} Stocks</div>

            {/* Support Link */}
            <a
              href="https://saweria.co/okkotsuyuta"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: 'white',
                fontWeight: 600,
                fontSize: 13,
                textDecoration: 'none',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              ☕ Support Me
            </a>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all var(--transition-base)'
              }}
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        position: 'sticky',
        top: 64,
        zIndex: 99,
      }}>
        <div className="app-container" style={{ display: 'flex', gap: 0 }}>
          {[
            { key: 'dashboard', label: '📊 Dashboard', icon: '' },
            { key: 'whales', label: '🐋 Whale Tracker', icon: '' },
            { key: 'connections', label: '🔀 Connection Finder', icon: '' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setViewCongloProfile(null); }}
              style={{
                padding: '12px 20px',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.key ? '3px solid var(--text-accent)' : '3px solid transparent',
                color: activeTab === tab.key ? 'var(--text-accent)' : 'var(--text-secondary)',
                fontSize: 13,
                fontWeight: activeTab === tab.key ? 700 : 500,
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                transition: 'all 150ms ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="app-container" style={{ paddingBottom: 40 }}>

        {/* ===== TAB: DASHBOARD ===== */}
        {activeTab === 'dashboard' && (
          <>
            {/* Search */}
            <StockSearch
              stocks={stockList}
              investorIndex={investorIndex}
              onSelectStock={handleSelectStock}
              onSelectShareholder={handleSelectShareholder}
              selectedCode={selectedCode}
            />

            {/* Conglomerate Selector */}
            <ConglomerateSelector
              onSelect={(name) => setSelectedConglo(name)}
              onViewProfile={handleViewCongloProfile}
              selectedConglo={selectedConglo}
              stockMap={stockMap}
            />

            {/* Stock Chips - Quick Select */}
            {(() => {
              const conglo = selectedConglo
                ? CONGLOMERATES.find(c => c.name === selectedConglo)
                : null;
              const filteredChips = conglo
                ? stockList.filter(s => conglo.stocks.includes(s.code))
                : stockList;
              const displayChips = conglo ? filteredChips : filteredChips.slice(0, 30);
              const remaining = conglo ? 0 : filteredChips.length - 30;

              return (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {displayChips.map((s) => (
                      <button
                        key={s.code}
                        className={`stock-chip ${selectedCode === s.code ? 'active' : ''}`}
                        onClick={() => setSelectedCode(s.code)}
                      >
                        <div className="stock-chip-code">{s.code}</div>
                      </button>
                    ))}
                    {remaining > 0 && (
                      <div style={{
                        padding: '10px 12px',
                        fontSize: 12,
                        color: 'var(--text-tertiary)',
                        display: 'flex',
                        alignItems: 'center',
                      }}>
                        +{remaining} more (use search)
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Conglomerate Profile View */}
            {viewCongloProfile ? (
              (() => {
                const conglo = CONGLOMERATES.find(c => c.name === viewCongloProfile);
                if (!conglo) return null;
                return (
                  <ConglomerateProfile
                    congloName={conglo.name}
                    congloStocks={conglo.stocks}
                    stockMap={stockMap}
                    onSelectStock={handleSelectStock}
                    onBack={() => setViewCongloProfile(null)}
                  />
                );
              })()
            ) : selectedShareholder ? (
              <div>
                <ShareholderProfile
                  shareholderName={selectedShareholder}
                  holdings={investorIndex[selectedShareholder.toUpperCase().trim()] || []}
                  onStockClick={(code) => {
                    setSelectedCode(code);
                    setSelectedShareholder(null);
                  }}
                  onBack={() => setSelectedShareholder(null)}
                />
              </div>
            ) : selectedStock ? (
              <>
                {/* Selected Stock Header */}
                <div style={{
                  marginBottom: 24,
                  padding: '20px 24px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: 16,
                  color: 'white',
                }}>
                  <div style={{ fontSize: 14, fontWeight: 500, opacity: 0.8, marginBottom: 4 }}>
                    Selected Stock
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>
                    {selectedStock.code}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 500, opacity: 0.9 }}>
                    {selectedStock.name}
                  </div>
                </div>

                {/* Company Profile from IDX */}
                <CompanyProfile stockCode={selectedStock.code} />

                {/* Stats */}
                <StatsCards
                  selectedStock={selectedStock}
                  shareholders={shareholders}
                />

                {/* Feature 3: Float & Concentration Analysis */}
                <FloatAnalysis shareholders={shareholders} stockCode={selectedStock.code} />

                {/* Charts Row */}
                <div className="dashboard-grid">
                  <div className="card">
                    <div className="card-header">
                      <div className="card-title">📊 Ownership Distribution</div>
                    </div>
                    <OwnershipChart shareholders={shareholders} />
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <div className="card-title">🌐 Local vs Foreign Ownership</div>
                    </div>
                    <LocalForeignChart shareholders={shareholders} />
                  </div>
                </div>

                {/* Feature 2: Network Graph */}
                <NetworkGraph
                  shareholders={shareholders}
                  crossLinks={crossLinks}
                  stockCode={selectedStock.code}
                  issuerName={selectedStock.name}
                  onSelectStock={handleSelectStock}
                />

                {/* Relationship Tree */}
                <div className="card" style={{ marginBottom: 24 }}>
                  <div className="card-header">
                    <div className="card-title">🔗 Shareholder Relationship Structure</div>
                    <span className="card-badge badge-local">
                      {shareholders.filter(s => s.percentage >= 5).length + 1} Key Holders
                    </span>
                  </div>
                  <RelationshipTree
                    shareholders={shareholders}
                    issuerName={selectedStock.name}
                  />
                </div>

                {/* Cross-Stock Relationships */}
                <div className="card" style={{ marginBottom: 24 }}>
                  <div className="card-header">
                    <div className="card-title">🔀 Cross-Stock Shareholder Connections</div>
                    <span className="card-badge badge-foreign">
                      {crossLinks.length} Connected Investors
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, marginTop: -8 }}>
                    Shareholders of <strong>{selectedStock.code}</strong> who also hold shares in other listed companies.
                    Click any stock to navigate to it.
                  </div>
                  <CrossStockRelationships
                    crossLinks={crossLinks}
                    onStockClick={handleSelectStock}
                  />
                </div>

                {/* Full Shareholder Table */}
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">📋 All Shareholders Detail</div>
                    <span className="card-badge badge-local">
                      {shareholders.length} Records
                    </span>
                  </div>
                  <ShareholderTable shareholders={shareholders} />
                </div>
              </>
            ) : (
              <div className="empty-state">
                <div className="icon">📈</div>
                <p>Select a stock or shareholder to view details</p>
              </div>
            )}
          </>
        )}

        {/* ===== TAB: WHALE TRACKER ===== */}
        {activeTab === 'whales' && (
          <WhaleTracker
            investorIndex={investorIndex}
            onSelectShareholder={(name) => {
              handleSelectShareholder(name);
              setActiveTab('dashboard');
            }}
            onSelectStock={handleSelectStock}
          />
        )}

        {/* ===== TAB: CONNECTION FINDER ===== */}
        {activeTab === 'connections' && (
          <ConnectionFinder
            stockList={stockList}
            stockMap={stockMap}
            investorIndex={investorIndex}
            onSelectStock={handleSelectStock}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        KSEI Shareholder Dashboard · Data sourced from KSEI (Kustodian Sentral Efek Indonesia)
      </footer>
    </>
  );
}

export default App;

