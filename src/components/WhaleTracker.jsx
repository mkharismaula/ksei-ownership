import { useMemo, useState } from 'react';
import { getTopInvestors } from '../utils/analytics';
import { getInvestorTypeLabel, CHART_COLORS } from '../utils/dataLoader';

export default function WhaleTracker({ investorIndex, onSelectShareholder, onSelectStock }) {
    const [sortBy, setSortBy] = useState('stockCount'); // stockCount | controllingCount | totalShares
    const [filterType, setFilterType] = useState('all'); // all | CP | ID | IB | foreign

    const whales = useMemo(() => {
        const all = getTopInvestors(investorIndex, 100);
        let filtered = all;

        if (filterType === 'foreign') {
            filtered = all.filter(w => w.localForeign === 'A');
        } else if (filterType !== 'all') {
            filtered = all.filter(w => w.dominantType === filterType);
        }

        filtered.sort((a, b) => {
            if (sortBy === 'stockCount') return b.stockCount - a.stockCount;
            if (sortBy === 'controllingCount') return b.controllingCount - a.controllingCount;
            if (sortBy === 'totalShares') return b.totalShares - a.totalShares;
            return 0;
        });

        return filtered;
    }, [investorIndex, sortBy, filterType]);

    const getTypeColor = (type) => {
        const map = { CP: '#8b5cf6', ID: '#10b981', IB: '#3b82f6', IS: '#f59e0b', MF: '#ef4444', SC: '#06b6d4' };
        return map[type] || '#9ca3af';
    };

    return (
        <div>
            {/* Header */}
            <div style={{
                marginBottom: 24,
                padding: '24px 28px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                borderRadius: 16,
                color: 'white',
            }}>
                <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                    🐋 Whale Tracker
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>
                    Smart Money & Top Investors
                </div>
                <div style={{ fontSize: 14, opacity: 0.9 }}>
                    Investors holding positions in multiple listed companies
                </div>
            </div>

            {/* Summary Cards */}
            <div className="stats-row" style={{ marginBottom: 24 }}>
                <div className="stat-card">
                    <div className="stat-label">Multi-Stock Investors</div>
                    <div className="stat-value">{whales.length}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Most Connected</div>
                    <div className="stat-value">{whales[0]?.stockCount || 0}</div>
                    <div className="stat-sub">stocks held by #{whales[0]?.name.slice(0, 20) || '-'}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Avg Controlling Stakes</div>
                    <div className="stat-value">
                        {whales.length > 0 ? (whales.reduce((s, w) => s + w.controllingCount, 0) / whales.length).toFixed(1) : 0}
                    </div>
                    <div className="stat-sub">≥5% ownership positions</div>
                </div>
            </div>

            {/* Controls */}
            <div className="card" style={{ marginBottom: 24 }}>
                <div style={{ padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Sort by:</span>
                        {[
                            { key: 'stockCount', label: '# Stocks' },
                            { key: 'controllingCount', label: '# Controlling' },
                            { key: 'totalShares', label: 'Total Shares' },
                        ].map(opt => (
                            <button
                                key={opt.key}
                                onClick={() => setSortBy(opt.key)}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: 6,
                                    border: 'none',
                                    background: sortBy === opt.key ? 'var(--text-accent)' : 'var(--bg-primary)',
                                    color: sortBy === opt.key ? 'white' : 'var(--text-secondary)',
                                    fontSize: 12,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    fontFamily: 'Inter, sans-serif',
                                }}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Filter:</span>
                        {[
                            { key: 'all', label: 'All' },
                            { key: 'CP', label: 'Corporate' },
                            { key: 'ID', label: 'Individual' },
                            { key: 'IB', label: 'Inst. Bank' },
                            { key: 'foreign', label: '🌐 Foreign' },
                        ].map(opt => (
                            <button
                                key={opt.key}
                                onClick={() => setFilterType(opt.key)}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: 6,
                                    border: 'none',
                                    background: filterType === opt.key ? 'var(--text-accent)' : 'var(--bg-primary)',
                                    color: filterType === opt.key ? 'white' : 'var(--text-secondary)',
                                    fontSize: 12,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    fontFamily: 'Inter, sans-serif',
                                }}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Whale List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {whales.slice(0, 30).map((whale, idx) => (
                    <div key={whale.name} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'stretch' }}>
                            {/* Rank */}
                            <div style={{
                                width: 56,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: idx < 3 ? CHART_COLORS[idx] : 'var(--bg-primary)',
                                color: idx < 3 ? 'white' : 'var(--text-tertiary)',
                                fontWeight: 800,
                                fontSize: idx < 3 ? 20 : 16,
                                flexShrink: 0,
                            }}>
                                {idx < 3 ? ['🥇', '🥈', '🥉'][idx] : `#${idx + 1}`}
                            </div>

                            {/* Info */}
                            <div style={{ flex: 1, padding: '16px 20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                    <div>
                                        <div
                                            style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer' }}
                                            onClick={() => onSelectShareholder && onSelectShareholder(whale.name)}
                                        >
                                            {whale.name}
                                        </div>
                                        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                                            <span style={{
                                                fontSize: 10,
                                                fontWeight: 700,
                                                padding: '2px 8px',
                                                borderRadius: 4,
                                                background: getTypeColor(whale.dominantType) + '20',
                                                color: getTypeColor(whale.dominantType),
                                                textTransform: 'uppercase',
                                            }}>
                                                {getInvestorTypeLabel(whale.dominantType)}
                                            </span>
                                            <span style={{
                                                fontSize: 10,
                                                fontWeight: 700,
                                                padding: '2px 8px',
                                                borderRadius: 4,
                                                background: whale.localForeign === 'A' ? '#f59e0b20' : '#3b82f620',
                                                color: whale.localForeign === 'A' ? '#f59e0b' : '#3b82f6',
                                            }}>
                                                {whale.localForeign === 'A' ? '🌐 Foreign' : '🇮🇩 Local'}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-accent)' }}>
                                            {whale.stockCount}
                                        </div>
                                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600 }}>STOCKS</div>
                                    </div>
                                </div>

                                {/* Holdings preview */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                    {whale.holdings.slice(0, 8).map((h, i) => (
                                        <span
                                            key={h.shareCode}
                                            onClick={() => onSelectStock && onSelectStock(h.shareCode)}
                                            style={{
                                                fontSize: 11,
                                                fontWeight: 600,
                                                padding: '3px 8px',
                                                borderRadius: 4,
                                                background: h.percentage >= 5 ? CHART_COLORS[i % CHART_COLORS.length] + '20' : 'var(--bg-primary)',
                                                color: h.percentage >= 5 ? CHART_COLORS[i % CHART_COLORS.length] : 'var(--text-secondary)',
                                                cursor: 'pointer',
                                                border: h.percentage >= 5 ? `1px solid ${CHART_COLORS[i % CHART_COLORS.length]}40` : '1px solid var(--border-light)',
                                            }}
                                        >
                                            {h.shareCode} {h.percentage >= 1 ? `${h.percentage.toFixed(1)}%` : '<1%'}
                                        </span>
                                    ))}
                                    {whale.holdings.length > 8 && (
                                        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', padding: '3px 4px' }}>
                                            +{whale.holdings.length - 8} more
                                        </span>
                                    )}
                                </div>

                                {/* Stats bar */}
                                <div style={{ display: 'flex', gap: 20, marginTop: 10, fontSize: 12, color: 'var(--text-secondary)' }}>
                                    <span>🎯 <strong>{whale.controllingCount}</strong> controlling (≥5%)</span>
                                    <span>📊 Avg {whale.avgPct.toFixed(2)}%</span>
                                    <span>🏆 Top: {whale.maxHolding?.shareCode} ({whale.maxHolding?.percentage.toFixed(1)}%)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
