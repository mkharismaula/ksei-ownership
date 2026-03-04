import { useState } from 'react';
import { CONGLOMERATES } from '../utils/conglomerates';

export default function ConglomerateSelector({ onSelect, onViewProfile, selectedConglo, stockMap }) {
    const [expanded, setExpanded] = useState(false);

    // Only show conglomerates that have at least 1 stock in our data
    const availableConglos = CONGLOMERATES.map(c => {
        const matchedStocks = c.stocks.filter(code => stockMap && stockMap[code]);
        return { ...c, matchedCount: matchedStocks.length };
    }).filter(c => c.matchedCount > 0);

    const displayList = expanded ? availableConglos : availableConglos.slice(0, 8);

    return (
        <div className="conglo-section">
            <div className="conglo-header">
                <div className="conglo-title">
                    <span>🏢</span> Conglomerate Groups
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                    {availableConglos.length} groups available
                </div>
            </div>

            <div className="conglo-pills">
                {/* "All Stocks" pill */}
                <button
                    className={`conglo-pill ${!selectedConglo ? 'active' : ''}`}
                    onClick={() => onSelect(null)}
                >
                    <span className="conglo-pill-emoji">📊</span>
                    <span className="conglo-pill-name">All Stocks</span>
                </button>

                {displayList.map(c => (
                    <button
                        key={c.name}
                        className={`conglo-pill ${selectedConglo === c.name ? 'active' : ''}`}
                        onClick={() => onSelect(c.name)}
                        title={`${c.name}: ${c.stocks.join(', ')}`}
                    >
                        <span className="conglo-pill-emoji">{c.emoji}</span>
                        <span className="conglo-pill-name">{c.name}</span>
                        <span className="conglo-pill-count">{c.matchedCount}</span>
                    </button>
                ))}

                {availableConglos.length > 8 && (
                    <button
                        className="conglo-pill conglo-toggle"
                        onClick={() => setExpanded(!expanded)}
                    >
                        {expanded ? '← Less' : `+${availableConglos.length - 8} more`}
                    </button>
                )}
            </div>

            {/* Info bar when a conglomerate is selected */}
            {selectedConglo && (() => {
                const conglo = CONGLOMERATES.find(c => c.name === selectedConglo);
                if (!conglo) return null;
                const matchedStocks = conglo.stocks.filter(code => stockMap && stockMap[code]);
                return (
                    <div className="conglo-info-bar">
                        <span>{conglo.emoji} <strong>{conglo.name}</strong></span>
                        <span style={{ color: 'var(--text-secondary)', flex: 1 }}>
                            {matchedStocks.length} stocks in this group: {matchedStocks.join(', ')}
                        </span>
                        {onViewProfile && (
                            <button
                                onClick={() => onViewProfile(selectedConglo)}
                                style={{
                                    padding: '4px 14px',
                                    fontSize: 12,
                                    fontWeight: 700,
                                    borderRadius: 6,
                                    border: 'none',
                                    background: 'var(--text-accent)',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontFamily: 'Inter, sans-serif',
                                }}
                            >
                                View Details →
                            </button>
                        )}
                    </div>
                );
            })()}
        </div>
    );
}
