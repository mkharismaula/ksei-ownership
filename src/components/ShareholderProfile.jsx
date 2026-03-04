import { getInvestorTypeLabel, CHART_COLORS } from '../utils/dataLoader';

export default function ShareholderProfile({ shareholderName, holdings, onStockClick, onBack }) {
    if (!holdings || holdings.length === 0) return null;

    const totalStocks = holdings.length;
    const avgPct = holdings.reduce((sum, h) => sum + h.percentage, 0) / totalStocks;
    const maxHolding = holdings[0]; // already sorted desc
    const investorType = holdings[0]?.investorType || '';
    const localForeign = holdings[0]?.localForeign || '';

    return (
        <div style={{ marginBottom: 24 }}>
            {/* Profile Header */}
            <div style={{
                marginBottom: 24,
                padding: '24px 28px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderRadius: 16,
                color: 'white',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.8, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            👤 Shareholder Profile
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>
                            {shareholderName}
                        </div>
                        <div style={{ display: 'flex', gap: 12, fontSize: 13, opacity: 0.9 }}>
                            <span>{getInvestorTypeLabel(investorType)}</span>
                            <span>·</span>
                            <span>{localForeign === 'L' ? '🇮🇩 Local' : localForeign === 'A' ? '🌐 Foreign' : '—'}</span>
                        </div>
                    </div>
                    <button
                        onClick={onBack}
                        style={{
                            padding: '8px 20px',
                            background: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            border: '1px solid rgba(255,255,255,0.3)',
                            borderRadius: 8,
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        ← Back to Stock
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="stats-row">
                <div className="stat-card">
                    <div className="stat-label">Total Stocks Held</div>
                    <div className="stat-value">{totalStocks}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Largest Holding</div>
                    <div className="stat-value">{maxHolding.shareCode}</div>
                    <div className="stat-sub">{maxHolding.percentage.toFixed(2)}%</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Average Ownership</div>
                    <div className="stat-value">{avgPct.toFixed(2)}%</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Total Shares</div>
                    <div className="stat-value">
                        {holdings.reduce((s, h) => s + h.totalHoldingShares, 0).toLocaleString('id-ID')}
                    </div>
                </div>
            </div>

            {/* Holdings List */}
            <div className="card">
                <div className="card-header">
                    <div className="card-title">📊 Portfolio — All Stock Holdings</div>
                    <span className="card-badge badge-local">{totalStocks} Stocks</span>
                </div>
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Stock Code</th>
                                <th>Company Name</th>
                                <th>Ownership</th>
                                <th>Total Shares</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {holdings.map((h, i) => (
                                <tr key={i}>
                                    <td style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>{i + 1}</td>
                                    <td>
                                        <span style={{
                                            fontWeight: 700,
                                            color: CHART_COLORS[i % CHART_COLORS.length],
                                            cursor: 'pointer',
                                        }}
                                            onClick={() => onStockClick(h.shareCode)}
                                        >
                                            {h.shareCode}
                                        </span>
                                    </td>
                                    <td className="investor-name">{h.issuerName}</td>
                                    <td className="pct-bar-cell">
                                        <div className="pct-bar-wrapper">
                                            <div className="pct-bar" style={{ flex: 1 }}>
                                                <div
                                                    className="pct-bar-fill"
                                                    style={{
                                                        width: `${Math.min(h.percentage, 100)}%`,
                                                        background: CHART_COLORS[i % CHART_COLORS.length],
                                                    }}
                                                />
                                            </div>
                                            <span className="pct-value">{h.percentage.toFixed(2)}%</span>
                                        </div>
                                    </td>
                                    <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                                        {h.totalHoldingShares.toLocaleString('id-ID')}
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => onStockClick(h.shareCode)}
                                            style={{
                                                padding: '4px 12px',
                                                background: 'rgba(102,126,234,0.1)',
                                                color: '#667eea',
                                                border: 'none',
                                                borderRadius: 6,
                                                fontSize: 12,
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            View Stock →
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
