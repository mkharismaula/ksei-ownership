import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { CHART_COLORS } from '../utils/dataLoader';

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div className="custom-tooltip">
                {payload.map((entry, i) => (
                    <div key={i} className="value" style={{ color: entry.color || entry.payload?.fill }}>
                        {entry.payload?.name || 'N/A'}: {(entry.value ?? 0).toFixed(2)}%
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function LocalForeignChart({ shareholders }) {
    if (!shareholders || shareholders.length === 0) return null;

    const localPct = shareholders
        .filter(s => s.localForeign === 'L')
        .reduce((sum, s) => sum + s.percentage, 0);
    const foreignPct = shareholders
        .filter(s => s.localForeign === 'A')
        .reduce((sum, s) => sum + s.percentage, 0);
    const otherPct = Math.max(0, 100 - localPct - foreignPct);

    const data = [
        { name: 'Local', value: localPct, fill: '#3b82f6' },
        { name: 'Foreign', value: foreignPct, fill: '#f59e0b' },
    ];

    if (otherPct > 0.5) {
        data.push({ name: 'Unclassified', value: otherPct, fill: '#e5e7eb' });
    }

    return (
        <div>
            {/* Stacked bar */}
            <div className="ownership-bar">
                <div
                    className="ownership-segment"
                    style={{ width: `${localPct}%`, background: '#3b82f6' }}
                    title={`Local: ${localPct.toFixed(2)}%`}
                />
                <div
                    className="ownership-segment"
                    style={{ width: `${foreignPct}%`, background: '#f59e0b' }}
                    title={`Foreign: ${foreignPct.toFixed(2)}%`}
                />
                {otherPct > 0.5 && (
                    <div
                        className="ownership-segment"
                        style={{ width: `${otherPct}%`, background: 'var(--text-tertiary)' }}
                        title={`Unclassified: ${otherPct.toFixed(2)}%`}
                    />
                )}
            </div>
            <div className="ownership-labels">
                <span>
                    <span style={{ color: '#3b82f6', fontWeight: 600 }}>● Local</span>{' '}
                    {localPct.toFixed(1)}%
                </span>
                <span>
                    <span style={{ color: '#f59e0b', fontWeight: 600 }}>● Foreign</span>{' '}
                    {foreignPct.toFixed(1)}%
                </span>
                {otherPct > 0.5 && (
                    <span>
                        <span style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>● Other</span>{' '}
                        {otherPct.toFixed(1)}%
                    </span>
                )}
            </div>

            {/* Horizontal bar chart */}
            <div style={{ marginTop: 20 }}>
                <ResponsiveContainer width="100%" height={100}>
                    <BarChart data={data} layout="vertical" barCategoryGap={8}>
                        <XAxis type="number" domain={[0, 100]} hide />
                        <YAxis
                            type="category"
                            dataKey="name"
                            width={80}
                            tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 500 }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar
                            dataKey="value"
                            radius={[0, 6, 6, 0]}
                            animationDuration={800}
                        >
                            {data.map((entry, i) => (
                                <Cell key={i} fill={entry.fill} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
