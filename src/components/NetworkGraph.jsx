import { useMemo, useState, useRef, useEffect } from 'react';
import { CHART_COLORS } from '../utils/dataLoader';

export default function NetworkGraph({ shareholders, crossLinks, stockCode, issuerName, onSelectStock }) {
    const svgRef = useRef(null);
    const [hoveredNode, setHoveredNode] = useState(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

    useEffect(() => {
        const container = svgRef.current?.parentElement;
        if (container) {
            const obs = new ResizeObserver(entries => {
                const { width } = entries[0].contentRect;
                setDimensions({ width: Math.max(600, width), height: 500 });
            });
            obs.observe(container);
            return () => obs.disconnect();
        }
    }, []);

    const graph = useMemo(() => {
        const { width, height } = dimensions;
        const cx = width / 2;
        const cy = height / 2;

        // Center node = current stock
        const nodes = [{
            id: stockCode,
            label: stockCode,
            sublabel: issuerName,
            x: cx,
            y: cy,
            r: 32,
            color: '#667eea',
            type: 'stock',
            isCenter: true,
        }];

        const edges = [];

        // Tier 1: Direct shareholders (top 8 by %)
        const topShareholders = (shareholders || []).slice(0, 8);
        const tier1Radius = Math.min(width, height) * 0.32;

        topShareholders.forEach((s, i) => {
            const angle = (i / topShareholders.length) * 2 * Math.PI - Math.PI / 2;
            const x = cx + Math.cos(angle) * tier1Radius;
            const y = cy + Math.sin(angle) * tier1Radius;
            const nodeId = `sh-${s.investorName}`;

            nodes.push({
                id: nodeId,
                label: s.investorName.length > 22 ? s.investorName.slice(0, 20) + '…' : s.investorName,
                sublabel: `${s.percentage.toFixed(1)}%`,
                x, y,
                r: 8 + Math.min(s.percentage, 50) * 0.4,
                color: s.percentage >= 5 ? CHART_COLORS[i % CHART_COLORS.length] : '#94a3b8',
                type: 'shareholder',
                pct: s.percentage,
                investorType: s.investorType,
            });

            edges.push({
                source: stockCode,
                target: nodeId,
                weight: s.percentage,
                color: CHART_COLORS[i % CHART_COLORS.length],
            });
        });

        // Tier 2: Cross-stock connections (top 5 most connected investors)
        const topCross = (crossLinks || []).slice(0, 5);
        const tier2Radius = Math.min(width, height) * 0.46;

        topCross.forEach((link, ci) => {
            const shNodeId = `sh-${link.investorName}`;
            const existingShNode = nodes.find(n => n.id === shNodeId);

            link.otherStocks.slice(0, 3).forEach((os, oi) => {
                const angle = ((ci * 3 + oi) / (topCross.length * 3)) * 2 * Math.PI - Math.PI / 4;
                const x = cx + Math.cos(angle) * tier2Radius;
                const y = cy + Math.sin(angle) * tier2Radius;
                const osNodeId = `stock-${os.shareCode}`;

                if (!nodes.find(n => n.id === osNodeId)) {
                    nodes.push({
                        id: osNodeId,
                        label: os.shareCode,
                        sublabel: os.issuerName?.slice(0, 18) || '',
                        x, y,
                        r: 18,
                        color: '#06b6d4',
                        type: 'cross-stock',
                        clickable: true,
                        shareCode: os.shareCode,
                    });
                }

                if (existingShNode) {
                    edges.push({
                        source: shNodeId,
                        target: osNodeId,
                        weight: os.percentage,
                        color: '#06b6d440',
                        dashed: true,
                    });
                }
            });
        });

        return { nodes, edges };
    }, [shareholders, crossLinks, stockCode, issuerName, dimensions]);

    return (
        <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
                <div className="card-title">🕸️ Ownership Network</div>
                <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
                    <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#667eea', marginRight: 4 }}></span>Current Stock</span>
                    <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: CHART_COLORS[0], marginRight: 4 }}></span>Shareholders</span>
                    <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#06b6d4', marginRight: 4 }}></span>Cross-Holdings</span>
                </div>
            </div>
            <div style={{ overflow: 'hidden', position: 'relative' }}>
                <svg
                    ref={svgRef}
                    width={dimensions.width}
                    height={dimensions.height}
                    viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
                    style={{ display: 'block', background: 'var(--bg-card)' }}
                >
                    {/* Edges */}
                    {graph.edges.map((e, i) => {
                        const source = graph.nodes.find(n => n.id === e.source);
                        const target = graph.nodes.find(n => n.id === e.target);
                        if (!source || !target) return null;
                        return (
                            <line
                                key={`edge-${i}`}
                                x1={source.x} y1={source.y}
                                x2={target.x} y2={target.y}
                                stroke={e.color}
                                strokeWidth={Math.max(1, e.weight * 0.3)}
                                strokeDasharray={e.dashed ? '4 4' : 'none'}
                                opacity={hoveredNode ? (hoveredNode === e.source || hoveredNode === e.target ? 1 : 0.15) : 0.6}
                            />
                        );
                    })}

                    {/* Nodes */}
                    {graph.nodes.map((node) => (
                        <g
                            key={node.id}
                            onMouseEnter={() => setHoveredNode(node.id)}
                            onMouseLeave={() => setHoveredNode(null)}
                            onClick={() => {
                                if (node.type === 'cross-stock' && node.shareCode) {
                                    onSelectStock && onSelectStock(node.shareCode);
                                }
                            }}
                            style={{ cursor: node.clickable ? 'pointer' : 'default' }}
                        >
                            {/* Glow */}
                            {(node.isCenter || hoveredNode === node.id) && (
                                <circle cx={node.x} cy={node.y} r={node.r + 8} fill={node.color} opacity={0.15} />
                            )}
                            {/* Circle */}
                            <circle
                                cx={node.x} cy={node.y} r={node.r}
                                fill={node.color}
                                stroke={hoveredNode === node.id ? 'white' : node.color}
                                strokeWidth={hoveredNode === node.id ? 2 : 0}
                                opacity={hoveredNode && hoveredNode !== node.id ? 0.4 : 1}
                            />
                            {/* Label inside center */}
                            {node.isCenter && (
                                <text x={node.x} y={node.y + 1} textAnchor="middle" dominantBaseline="middle"
                                    fill="white" fontSize="14" fontWeight="800" fontFamily="Inter, sans-serif">
                                    {node.label}
                                </text>
                            )}
                            {/* Label outside for small nodes */}
                            {!node.isCenter && (
                                <>
                                    <text x={node.x} y={node.y - node.r - 6} textAnchor="middle"
                                        fill="var(--text-primary)" fontSize="10" fontWeight="600" fontFamily="Inter, sans-serif"
                                        opacity={hoveredNode && hoveredNode !== node.id ? 0.3 : 1}>
                                        {node.label}
                                    </text>
                                    <text x={node.x} y={node.y - node.r - 18} textAnchor="middle"
                                        fill="var(--text-tertiary)" fontSize="9" fontFamily="Inter, sans-serif"
                                        opacity={hoveredNode && hoveredNode !== node.id ? 0.2 : 0.7}>
                                        {node.sublabel}
                                    </text>
                                </>
                            )}
                        </g>
                    ))}
                </svg>
            </div>
        </div>
    );
}
