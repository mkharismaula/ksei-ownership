import { useMemo } from 'react';
import { getConglomerateStats } from '../utils/analytics';
import { CHART_COLORS } from '../utils/dataLoader';

export default function ConglomerateProfile({ congloName, congloStocks, stockMap, onSelectStock, onBack }) {
    const stats = useMemo(
        () => getConglomerateStats(congloStocks, stockMap),
        [congloStocks, stockMap]
    );

    if (stats.totalStocks === 0) return null;

    return (
        <div>
            {/* Header */}
            <div style={{
                marginBottom: 24,
                padding: '24px 28px',
                background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
                borderRadius: 16,
                color: 'white',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                            🏢 Conglomerate Overview
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>
                            {congloName}
                        </div>
                        <div style={{ fontSize: 14, opacity: 0.9 }}>
                            {stats.totalStocks} listed companies in this group
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
                            fontFamily: 'Inter, sans-serif',
                        }}
                    >
                        ← Back
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="stats-row" style={{ marginBottom: 24 }}>
                <div className="stat-card">
                    <div className="stat-label">Listed Companies</div>
                    <div className="stat-value">{stats.totalStocks}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Total Shareholders</div>
                    <div className="stat-value">{stats.totalShareholders}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Avg Free Float</div>
                    <div className="stat-value" style={{ color: stats.avgFreeFloat < 25 ? '#f59e0b' : '#10b981' }}>
                        {stats.avgFreeFloat.toFixed(1)}%
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Aggregate L/F Mix</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <span style={{ fontSize: 13, color: '#3b82f6', fontWeight: 700 }}>
                            🇮🇩 {stats.localPct.toFixed(0)}%
                        </span>
                        <span style={{ fontSize: 13, color: '#f59e0b', fontWeight: 700 }}>
                            🌐 {stats.foreignPct.toFixed(0)}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Stock Breakdown Table */}
            <div className="card">
                <div className="card-header">
                    <div className="card-title">📊 Group Companies</div>
                    <span className="card-badge badge-local">{stats.totalStocks} Stocks</span>
                </div>
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Code</th>
                                <th>Company</th>
                                <th>Top Holder</th>
                                <th>Top %</th>
                                <th>Free Float</th>
                                <th>Risk</th>
                                <th>L/F</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.stocks.map((s, i) => (
                                <tr key={s.code}>
                                    <td style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>{i + 1}</td>
                                    <td>
                                        <span
                                            style={{ fontWeight: 700, color: CHART_COLORS[i % CHART_COLORS.length], cursor: 'pointer' }}
                                            onClick={() => onSelectStock(s.code)}
                                        >
                                            {s.code}
                                        </span>
                                    </td>
                                    <td className="investor-name" style={{ maxWidth: 200 }}>{s.name}</td>
                                    <td style={{ fontSize: 12, maxWidth: 180 }} className="investor-name">{s.topHolder}</td>
                                    <td style={{ fontWeight: 700 }}>{s.topPct.toFixed(1)}%</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--bg-primary)', minWidth: 60 }}>
                                                <div style={{
                                                    height: '100%',
                                                    borderRadius: 3,
                                                    width: `${Math.min(s.freeFloat, 100)}%`,
                                                    background: s.riskColor,
                                                }} />
                                            </div>
                                            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', minWidth: 40 }}>
                                                {s.freeFloat.toFixed(0)}%
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{
                                            fontSize: 10,
                                            fontWeight: 700,
                                            padding: '2px 8px',
                                            borderRadius: 4,
                                            background: s.riskColor + '20',
                                            color: s.riskColor,
                                        }}>
                                            {s.riskLevel}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 4, fontSize: 11 }}>
                                            <span style={{ color: '#3b82f6' }}>{s.localPct.toFixed(0)}%</span>
                                            <span style={{ color: 'var(--text-tertiary)' }}>/</span>
                                            <span style={{ color: '#f59e0b' }}>{s.foreignPct.toFixed(0)}%</span>
                                        </div>
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
