import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { CHART_COLORS, getInvestorTypeLabel } from '../utils/dataLoader';

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const d = payload[0]?.payload;
        if (!d) return null;
        return (
            <div className="custom-tooltip">
                <div className="label">{d.name || 'N/A'}</div>
                <div className="value">{(d.value ?? 0).toFixed(2)}% ownership</div>
                <div className="value">{(d.shares ?? 0).toLocaleString('id-ID')} shares</div>
            </div>
        );
    }
    return null;
};

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
    if (percent < 0.04) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
        <text
            x={x} y={y}
            fill="#fff"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={11}
            fontWeight={600}
        >
            {`${(percent * 100).toFixed(1)}%`}
        </text>
    );
};

export default function OwnershipChart({ shareholders }) {
    if (!shareholders || shareholders.length === 0) return null;

    // Top shareholders + "Others" bucket
    const topN = 8;
    const sorted = [...shareholders].sort((a, b) => b.percentage - a.percentage);
    const top = sorted.slice(0, topN);
    const rest = sorted.slice(topN);
    const othersTotal = rest.reduce((sum, s) => sum + s.percentage, 0);
    const othersShares = rest.reduce((sum, s) => sum + s.totalHoldingShares, 0);

    const chartData = top.map(s => ({
        name: s.investorName,
        value: s.percentage,
        shares: s.totalHoldingShares,
        type: s.investorType,
    }));

    if (othersTotal > 0) {
        chartData.push({
            name: `Others (${rest.length} shareholders)`,
            value: othersTotal,
            shares: othersShares,
            type: 'OT',
        });
    }

    // Remaining public float
    const totalMapped = chartData.reduce((sum, d) => sum + d.value, 0);
    if (totalMapped < 99.5) {
        chartData.push({
            name: 'Public Float',
            value: Math.max(0, 100 - totalMapped),
            shares: 0,
            type: 'PUB',
        });
    }

    return (
        <div>
            <div className="chart-container">
                <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={65}
                            outerRadius={130}
                            paddingAngle={2}
                            dataKey="value"
                            labelLine={false}
                            label={renderCustomLabel}
                            animationBegin={0}
                            animationDuration={800}
                        >
                            {chartData.map((_, i) => (
                                <Cell
                                    key={i}
                                    fill={CHART_COLORS[i % CHART_COLORS.length]}
                                    stroke="#fff"
                                    strokeWidth={2}
                                />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="custom-legend">
                {chartData.map((d, i) => (
                    <div key={i} className="legend-item">
                        <span
                            className="legend-dot"
                            style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                        />
                        <span>
                            {d.name.length > 25 ? d.name.substring(0, 25) + '...' : d.name}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
