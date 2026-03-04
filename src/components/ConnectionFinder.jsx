import { useState, useMemo } from 'react';
import { findConnectionPath } from '../utils/analytics';
import { getInvestorTypeLabel, CHART_COLORS } from '../utils/dataLoader';

export default function ConnectionFinder({ stockList, stockMap, investorIndex, onSelectStock }) {
    const [stockA, setStockA] = useState('');
    const [stockB, setStockB] = useState('');
    const [searchA, setSearchA] = useState('');
    const [searchB, setSearchB] = useState('');
    const [showResults, setShowResults] = useState(false);

    const filteredA = searchA.length > 0
        ? stockList.filter(s => s.code.toLowerCase().includes(searchA.toLowerCase()) || s.name.toLowerCase().includes(searchA.toLowerCase())).slice(0, 8)
        : [];
    const filteredB = searchB.length > 0
        ? stockList.filter(s => s.code.toLowerCase().includes(searchB.toLowerCase()) || s.name.toLowerCase().includes(searchB.toLowerCase())).slice(0, 8)
        : [];

    const result = useMemo(() => {
        if (!stockA || !stockB || !showResults) return null;
        return findConnectionPath(stockMap, investorIndex, stockA, stockB);
    }, [stockA, stockB, stockMap, investorIndex, showResults]);

    const handleFind = () => {
        if (stockA && stockB) setShowResults(true);
    };

    const stockAData = stockA ? stockMap[stockA] : null;
    const stockBData = stockB ? stockMap[stockB] : null;

    return (
        <div>
            {/* Header */}
            <div style={{
                marginBottom: 24,
                padding: '24px 28px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
                borderRadius: 16,
                color: 'white',
            }}>
                <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                    🔀 Connection Finder
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>
                    Six Degrees of Separation
                </div>
                <div style={{ fontSize: 14, opacity: 0.9 }}>
                    Find hidden ownership links between any two stocks
                </div>
            </div>

            {/* Input Area */}
            <div className="card" style={{ marginBottom: 24 }}>
                <div style={{ padding: 24 }}>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        {/* Stock A Selector */}
                        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
                            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'block' }}>
                                Stock A
                            </label>
                            <input
                                type="text"
                                placeholder="Search stock code..."
                                value={searchA}
                                onChange={(e) => { setSearchA(e.target.value); setShowResults(false); }}
                                onFocus={() => { }}
                                style={{
                                    width: '100%',
                                    padding: '10px 14px',
                                    border: `2px solid ${stockA ? '#10b981' : 'var(--border-color)'}`,
                                    borderRadius: 8,
                                    fontSize: 14,
                                    fontFamily: 'Inter, sans-serif',
                                    background: 'var(--bg-secondary)',
                                    color: 'var(--text-primary)',
                                    outline: 'none',
                                }}
                            />
                            {stockA && (
                                <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600, marginTop: 4 }}>
                                    ✓ {stockA} — {stockAData?.name || ''}
                                </div>
                            )}
                            {filteredA.length > 0 && !stockA && (
                                <div style={{
                                    position: 'absolute', top: '100%', left: 0, right: 0,
                                    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                                    borderRadius: 8, boxShadow: 'var(--shadow-lg)', zIndex: 10, maxHeight: 200, overflowY: 'auto',
                                }}>
                                    {filteredA.map(s => (
                                        <div key={s.code} onClick={() => { setStockA(s.code); setSearchA(s.code); }}
                                            style={{ padding: '8px 14px', cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)' }}
                                            onMouseEnter={(e) => e.target.style.background = 'var(--bg-card-hover)'}
                                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                        >
                                            <strong>{s.code}</strong> <span style={{ color: 'var(--text-secondary)' }}>{s.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Arrow */}
                        <div style={{ fontSize: 24, color: 'var(--text-tertiary)', paddingBottom: 10 }}>⟷</div>

                        {/* Stock B Selector */}
                        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
                            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'block' }}>
                                Stock B
                            </label>
                            <input
                                type="text"
                                placeholder="Search stock code..."
                                value={searchB}
                                onChange={(e) => { setSearchB(e.target.value); setShowResults(false); }}
                                style={{
                                    width: '100%',
                                    padding: '10px 14px',
                                    border: `2px solid ${stockB ? '#10b981' : 'var(--border-color)'}`,
                                    borderRadius: 8,
                                    fontSize: 14,
                                    fontFamily: 'Inter, sans-serif',
                                    background: 'var(--bg-secondary)',
                                    color: 'var(--text-primary)',
                                    outline: 'none',
                                }}
                            />
                            {stockB && (
                                <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600, marginTop: 4 }}>
                                    ✓ {stockB} — {stockBData?.name || ''}
                                </div>
                            )}
                            {filteredB.length > 0 && !stockB && (
                                <div style={{
                                    position: 'absolute', top: '100%', left: 0, right: 0,
                                    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                                    borderRadius: 8, boxShadow: 'var(--shadow-lg)', zIndex: 10, maxHeight: 200, overflowY: 'auto',
                                }}>
                                    {filteredB.map(s => (
                                        <div key={s.code} onClick={() => { setStockB(s.code); setSearchB(s.code); }}
                                            style={{ padding: '8px 14px', cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)' }}
                                            onMouseEnter={(e) => e.target.style.background = 'var(--bg-card-hover)'}
                                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                        >
                                            <strong>{s.code}</strong> <span style={{ color: 'var(--text-secondary)' }}>{s.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Find Button */}
                        <button
                            onClick={handleFind}
                            disabled={!stockA || !stockB || stockA === stockB}
                            style={{
                                padding: '10px 28px',
                                background: stockA && stockB && stockA !== stockB
                                    ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'var(--bg-primary)',
                                color: stockA && stockB ? 'white' : 'var(--text-tertiary)',
                                border: 'none',
                                borderRadius: 8,
                                fontSize: 14,
                                fontWeight: 700,
                                cursor: stockA && stockB ? 'pointer' : 'default',
                                fontFamily: 'Inter, sans-serif',
                                boxShadow: stockA && stockB ? 'var(--shadow-accent)' : 'none',
                            }}
                        >
                            🔍 Find Connections
                        </button>

                        {/* Reset */}
                        <button
                            onClick={() => { setStockA(''); setStockB(''); setSearchA(''); setSearchB(''); setShowResults(false); }}
                            style={{
                                padding: '10px 16px',
                                background: 'var(--bg-primary)',
                                color: 'var(--text-secondary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 8,
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontFamily: 'Inter, sans-serif',
                            }}
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            {/* Results */}
            {result && (
                <div>
                    {/* Summary */}
                    <div className="card" style={{ marginBottom: 16, padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontSize: 28 }}>{result.direct.length > 0 ? '🔗' : result.connected ? '🔀' : '❌'}</span>
                            <div>
                                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                                    {result.direct.length > 0
                                        ? `${result.direct.length} Direct Connection${result.direct.length > 1 ? 's' : ''} Found!`
                                        : result.connected
                                            ? `${result.indirect.length} Indirect Connection${result.indirect.length > 1 ? 's' : ''} via Bridge Stocks`
                                            : 'No connections found between these stocks'}
                                </div>
                                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                    {result.direct.length > 0
                                        ? `These investors hold shares in both ${stockA} and ${stockB}`
                                        : result.connected
                                            ? `Connected through shared investors in other companies`
                                            : `${stockA} and ${stockB} have no common shareholders`}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Direct Connections */}
                    {result.direct.length > 0 && (
                        <div className="card" style={{ marginBottom: 16 }}>
                            <div className="card-header">
                                <div className="card-title">🔗 Direct Shared Investors</div>
                            </div>
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Investor</th>
                                            <th>Type</th>
                                            <th>% in {stockA}</th>
                                            <th>% in {stockB}</th>
                                            <th>Combined</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result.direct.map((c, i) => (
                                            <tr key={i}>
                                                <td style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>{i + 1}</td>
                                                <td style={{ fontWeight: 600 }}>{c.investorName}</td>
                                                <td>
                                                    <span className={`type-badge type-${c.investorType?.toLowerCase()}`}>
                                                        {getInvestorTypeLabel(c.investorType)}
                                                    </span>
                                                </td>
                                                <td style={{ fontWeight: 700, color: CHART_COLORS[0] }}>{c.pctInA.toFixed(2)}%</td>
                                                <td style={{ fontWeight: 700, color: CHART_COLORS[1] }}>{c.pctInB.toFixed(2)}%</td>
                                                <td style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{(c.pctInA + c.pctInB).toFixed(2)}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Indirect Connections */}
                    {result.indirect.length > 0 && (
                        <div className="card">
                            <div className="card-header">
                                <div className="card-title">🔀 Indirect Connections via Bridge Stocks</div>
                            </div>
                            <div style={{ padding: '0 20px 20px' }}>
                                {result.indirect.slice(0, 10).map((c, i) => (
                                    <div key={i} style={{
                                        padding: 12,
                                        borderBottom: i < result.indirect.length - 1 ? '1px solid var(--border-light)' : 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12,
                                        fontSize: 13,
                                    }}>
                                        <span style={{ color: 'var(--text-tertiary)', fontSize: 11, fontWeight: 700 }}>#{i + 1}</span>
                                        <span style={{ color: CHART_COLORS[0], fontWeight: 600 }}>{c.investorA}</span>
                                        <span style={{ color: 'var(--text-tertiary)' }}>→</span>
                                        <span
                                            onClick={() => onSelectStock && onSelectStock(c.bridgeStock)}
                                            style={{ fontWeight: 800, color: 'var(--text-accent)', cursor: 'pointer' }}
                                        >
                                            {c.bridgeStock}
                                        </span>
                                        <span style={{ color: 'var(--text-tertiary)' }}>←</span>
                                        <span style={{ color: CHART_COLORS[1], fontWeight: 600 }}>{c.investorB}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
