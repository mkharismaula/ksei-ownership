import { useMemo } from 'react';
import { calculateOwnershipConcentration } from '../utils/analytics';

export default function FloatAnalysis({ shareholders, stockCode }) {
    const analysis = useMemo(
        () => calculateOwnershipConcentration(shareholders),
        [shareholders]
    );

    const gaugeAngle = (analysis.freeFloatPct / 100) * 180; // 0-180 degrees

    return (
        <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
                <div className="card-title">🚨 Float & Concentration Analysis</div>
                <span className="card-badge" style={{
                    background: analysis.riskColor + '20',
                    color: analysis.riskColor,
                    border: `1px solid ${analysis.riskColor}40`,
                }}>
                    {analysis.riskLevel} Risk
                </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, padding: '0 4px' }}>
                {/* Left: Gauge */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {/* SVG Gauge */}
                    <svg viewBox="0 0 200 120" style={{ width: '100%', maxWidth: 280 }}>
                        {/* Background arc */}
                        <path
                            d="M 20 100 A 80 80 0 0 1 180 100"
                            fill="none"
                            stroke="var(--border-color)"
                            strokeWidth="16"
                            strokeLinecap="round"
                        />
                        {/* Value arc */}
                        <path
                            d={describeArc(100, 100, 80, 180, 180 + gaugeAngle)}
                            fill="none"
                            stroke={analysis.riskColor}
                            strokeWidth="16"
                            strokeLinecap="round"
                        />
                        {/* Center text */}
                        <text x="100" y="85" textAnchor="middle" fill="var(--text-primary)" fontSize="28" fontWeight="800">
                            {analysis.freeFloatPct.toFixed(1)}%
                        </text>
                        <text x="100" y="105" textAnchor="middle" fill="var(--text-secondary)" fontSize="11" fontWeight="600">
                            FREE FLOAT
                        </text>
                    </svg>

                    <div style={{ textAlign: 'center', marginTop: 8 }}>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                            Controlling: <strong style={{ color: 'var(--text-primary)' }}>{analysis.controllingPct.toFixed(1)}%</strong>
                            {' · '}HHI: <strong style={{ color: 'var(--text-primary)' }}>{analysis.hhi}</strong>
                        </div>
                    </div>
                </div>

                {/* Right: Breakdown */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <StatRow label="Top Holder" value={`${analysis.topHolderPct.toFixed(1)}%`} color="#ef4444" />
                    <StatRow label="Top 5 Combined" value={`${analysis.top5Pct.toFixed(1)}%`} color="#f59e0b" />
                    <StatRow label="Free Float" value={`${analysis.freeFloatPct.toFixed(1)}%`} color={analysis.riskColor} />

                    <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 12, marginTop: 4 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Retail Investors</span>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{analysis.retailCount}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 4 }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Institutional Investors</span>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{analysis.institutionalCount}</span>
                        </div>
                    </div>

                    {/* Concentration bar */}
                    <div>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase' }}>
                            Ownership Breakdown
                        </div>
                        <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', background: 'var(--bg-primary)' }}>
                            {analysis.controllingShareholders.map((s, i) => (
                                <div
                                    key={i}
                                    title={`${s.investorName}: ${s.percentage.toFixed(2)}%`}
                                    style={{
                                        width: `${s.percentage}%`,
                                        background: ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b'][i % 5],
                                    }}
                                />
                            ))}
                            <div
                                title={`Free Float: ${analysis.freeFloatPct.toFixed(1)}%`}
                                style={{ flex: 1, background: 'var(--border-color)' }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatRow({ label, value, color }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
            <span style={{ fontSize: 18, fontWeight: 800, color }}>{value}</span>
        </div>
    );
}

// Helper to draw SVG arc
function describeArc(x, y, radius, startAngle, endAngle) {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

function polarToCartesian(cx, cy, radius, angleDeg) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}
