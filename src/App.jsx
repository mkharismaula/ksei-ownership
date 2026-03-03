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

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCode, setSelectedCode] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

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
  const handleRetry = () => setRetryCount((c) => c + 1);

  // Compute stock map & list
  const stockMap = useMemo(() => (data ? groupByStock(data) : {}), [data]);
  const stockList = useMemo(() => getStockList(stockMap), [stockMap]);

  // Build cross-stock investor index
  const investorIndex = useMemo(() => (data ? buildInvestorIndex(data) : {}), [data]);

  // Auto-select first stock once loaded
  useEffect(() => {
    if (stockList.length > 0 && !selectedCode) {
      setSelectedCode(stockList[0].code);
    }
  }, [stockList, selectedCode]);

  const selectedStock = selectedCode ? stockMap[selectedCode] : null;
  const shareholders = selectedStock ? selectedStock.shareholders : [];

  // Cross-stock links for selected stock
  const crossLinks = useMemo(
    () => (shareholders.length > 0 ? getCrossStockLinks(shareholders, investorIndex, selectedCode) : []),
    [shareholders, investorIndex, selectedCode]
  );

  // Extract date from first row
  const dataDate = data && data.length > 0 ? data[0].date : '';

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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-container" style={{ paddingBottom: 40 }}>
        {/* Search */}
        <StockSearch
          stocks={stockList}
          onSelect={setSelectedCode}
          selectedCode={selectedCode}
        />

        {/* Stock Chips - Quick Select */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {stockList.slice(0, 30).map((s) => (
              <button
                key={s.code}
                className={`stock-chip ${selectedCode === s.code ? 'active' : ''}`}
                onClick={() => setSelectedCode(s.code)}
              >
                <div className="stock-chip-code">{s.code}</div>
              </button>
            ))}
            {stockList.length > 30 && (
              <div style={{
                padding: '10px 12px',
                fontSize: 12,
                color: '#9ca3af',
                display: 'flex',
                alignItems: 'center',
              }}>
                +{stockList.length - 30} more (use search)
              </div>
            )}
          </div>
        </div>

        {selectedStock ? (
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

            {/* Stats */}
            <StatsCards
              selectedStock={selectedStock}
              shareholders={shareholders}
            />

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

            {/* Cross-Stock Shareholder Relationships */}
            <div className="card" style={{ marginBottom: 24 }}>
              <div className="card-header">
                <div className="card-title">🔀 Cross-Stock Shareholder Connections</div>
                <span className="card-badge badge-foreign">
                  {crossLinks.length} Connected Investors
                </span>
              </div>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16, marginTop: -8 }}>
                Shareholders of <strong>{selectedStock.code}</strong> who also hold shares in other listed companies.
                Click any stock to navigate to it.
              </div>
              <CrossStockRelationships
                crossLinks={crossLinks}
                onStockClick={setSelectedCode}
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
            <p>Select a stock to view ownership details</p>
          </div>
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
