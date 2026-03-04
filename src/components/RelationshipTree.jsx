import { getInvestorTypeLabel, getLocalForeignLabel } from '../utils/dataLoader';

function getTypeClass(type) {
    switch (type) {
        case 'CP': return 'type-corporate';
        case 'ID': return 'type-individual';
        case 'IB': case 'IS': case 'SC': case 'MF': case 'PF':
            return 'type-institution';
        default: return 'type-other';
    }
}

export default function RelationshipTree({ shareholders, issuerName }) {
    if (!shareholders || shareholders.length === 0) return null;

    // Determine controlling shareholder (highest percentage)
    const sorted = [...shareholders].sort((a, b) => b.percentage - a.percentage);
    const controlling = sorted[0];
    const major = sorted.filter((s, i) => i > 0 && s.percentage >= 5);
    const significant = sorted.filter(s => s.percentage >= 1 && s.percentage < 5);
    const minor = sorted.filter(s => s.percentage < 1);

    return (
        <div className="relationship-container">
            {/* Controlling Shareholder */}
            <div className="controlling-shareholder">
                <div className="shareholder-node main">
                    <div className="node-name">{controlling.investorName}</div>
                    <div className="node-pct">{controlling.percentage.toFixed(2)}%</div>
                    <div className={`node-type ${getTypeClass(controlling.investorType)}`}
                        style={controlling.investorType === 'CP' || !controlling.investorType ? {} : {}}>
                        {getInvestorTypeLabel(controlling.investorType)}
                        {controlling.localForeign && ` · ${getLocalForeignLabel(controlling.localForeign)}`}
                    </div>
                </div>
            </div>

            {/* Connector */}
            <div className="connector-line" />

            {/* Issuer (the company) */}
            <div className="controlling-shareholder">
                <div className="shareholder-node" style={{
                    borderColor: '#667eea',
                    borderWidth: '2px',
                    background: 'linear-gradient(135deg, rgba(102,126,234,0.05) 0%, rgba(118,75,162,0.05) 100%)',
                }}>
                    <div className="node-name" style={{ fontWeight: 700, fontSize: '14px' }}>
                        {issuerName}
                    </div>
                    <div className={`node-type type-other`} style={{ marginTop: 4 }}>
                        Listed Company
                    </div>
                </div>
            </div>

            {/* Connector */}
            {(major.length > 0 || significant.length > 0) && <div className="connector-line" />}

            {/* Major shareholders (>=5%) */}
            {major.length > 0 && (
                <>
                    <div style={{
                        textAlign: 'center',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        marginBottom: '12px',
                    }}>
                        Major Shareholders (≥5%)
                    </div>
                    <div className="branch-items">
                        {major.map((s, i) => (
                            <div key={i} className="branch-item">
                                <div className="shareholder-node">
                                    <div className="node-name">{s.investorName}</div>
                                    <div className="node-pct" style={{ fontSize: '15px' }}>
                                        {s.percentage.toFixed(2)}%
                                    </div>
                                    <div className={`node-type ${getTypeClass(s.investorType)}`}>
                                        {getInvestorTypeLabel(s.investorType)}
                                        {s.localForeign && ` · ${getLocalForeignLabel(s.localForeign)}`}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Significant shareholders (1-5%) */}
            {significant.length > 0 && (
                <>
                    <div style={{
                        textAlign: 'center',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'var(--text-tertiary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        margin: '20px 0 12px',
                    }}>
                        Significant Shareholders (1% — 5%)
                    </div>
                    <div className="branch-items">
                        {significant.map((s, i) => (
                            <div key={i} className="branch-item">
                                <div className="shareholder-node" style={{
                                    borderColor: 'var(--border-color)',
                                    background: 'var(--bg-secondary)',
                                    padding: '10px 14px',
                                }}>
                                    <div className="node-name" style={{ fontSize: '11px' }}>
                                        {s.investorName}
                                    </div>
                                    <div className="node-pct" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                        {s.percentage.toFixed(2)}%
                                    </div>
                                    <div className={`node-type ${getTypeClass(s.investorType)}`}>
                                        {getInvestorTypeLabel(s.investorType)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Minor holders summary */}
            {minor.length > 0 && (
                <div style={{
                    textAlign: 'center',
                    marginTop: '20px',
                    fontSize: '12px',
                    color: 'var(--text-tertiary)',
                }}>
                    + {minor.length} other shareholder(s) with {'<'}1% each
                </div>
            )}
        </div>
    );
}
