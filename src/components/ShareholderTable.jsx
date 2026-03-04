import { useRef, useMemo, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { getInvestorTypeLabel, getLocalForeignLabel, formatShares } from '../utils/dataLoader';

function getTypeBadgeClass(type) {
    switch (type) {
        case 'CP': return 'type-corporate';
        case 'ID': return 'type-individual';
        case 'IB': case 'IS': case 'SC': case 'MF': case 'PF':
            return 'type-institution';
        default: return 'type-other';
    }
}

export default function ShareholderTable({ shareholders }) {
    const parentRef = useRef(null);
    const [sortConfig, setSortConfig] = useState({ key: 'percentage', direction: 'desc' });
    const [filterType, setFilterType] = useState('ALL');
    const [filterLF, setFilterLF] = useState('ALL');

    // 1) Filtering and Sorting logic
    const processedShareholders = useMemo(() => {
        if (!shareholders) return [];

        // Filter
        let filtered = shareholders.filter(s => {
            if (filterType !== 'ALL') {
                const badgeClass = getTypeBadgeClass(s.investorType);
                if (filterType === 'CORPORATE' && badgeClass !== 'type-corporate') return false;
                if (filterType === 'INDIVIDUAL' && badgeClass !== 'type-individual') return false;
                if (filterType === 'INSTITUTION' && badgeClass !== 'type-institution') return false;
            }
            if (filterLF !== 'ALL' && s.localForeign !== filterLF) {
                return false;
            }
            return true;
        });

        // Sort
        filtered.sort((a, b) => {
            let aVal = a[sortConfig.key];
            let bVal = b[sortConfig.key];

            if (typeof aVal === 'string') aVal = aVal.toLowerCase();
            if (typeof bVal === 'string') bVal = bVal.toLowerCase();

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [shareholders, sortConfig, filterType, filterLF]);

    // 2) Virtualizer setup
    const rowVirtualizer = useVirtualizer({
        count: processedShareholders.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 48, // approximate row height in px
        overscan: 10, // buffer rows outside viewport
    });

    if (!shareholders || shareholders.length === 0) return null;

    const handleSort = (key) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) return <span style={{ opacity: 0.3 }}>↕</span>;
        return <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
    };

    // CSV Export function (exports currently filtered view)
    const handleExportCSV = () => {
        if (!processedShareholders || processedShareholders.length === 0) return;

        // Define headers
        const headers = ['Rank', 'Investor Name', 'Type', 'Local/Foreign', 'Nationality', 'Total Shares', 'Ownership %'];

        // Map data to rows
        const rows = processedShareholders.map((s, i) => [
            i + 1,
            `"${s.investorName.replace(/"/g, '""')}"`, // escape quotes
            getInvestorTypeLabel(s.investorType),
            getLocalForeignLabel(s.localForeign),
            s.nationality || s.domicile || '-',
            s.totalHoldingShares,
            s.percentage.toFixed(4)
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(e => e.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `shareholders_export.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div>
            {/* Toolbar: Filters & Export */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
                padding: '12px 16px',
                background: 'var(--bg-card-hover)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-light)',
                flexWrap: 'wrap',
                gap: 16
            }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    {/* Investor Type Filter */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Type:</span>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            style={{
                                padding: '6px 28px 6px 12px',
                                borderRadius: 6,
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-card)',
                                color: 'var(--text-primary)',
                                fontSize: 13,
                                outline: 'none',
                                cursor: 'pointer',
                                appearance: 'none',
                                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 8px center',
                                backgroundSize: '14px'
                            }}
                        >
                            <option value="ALL">All Types</option>
                            <option value="CORPORATE">Corporate</option>
                            <option value="INDIVIDUAL">Individual</option>
                            <option value="INSTITUTION">Institution/Fund</option>
                        </select>
                    </div>

                    {/* Local/Foreign Filter */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Domicile:</span>
                        <select
                            value={filterLF}
                            onChange={(e) => setFilterLF(e.target.value)}
                            style={{
                                padding: '6px 28px 6px 12px',
                                borderRadius: 6,
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-card)',
                                color: 'var(--text-primary)',
                                fontSize: 13,
                                outline: 'none',
                                cursor: 'pointer',
                                appearance: 'none',
                                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 8px center',
                                backgroundSize: '14px'
                            }}
                        >
                            <option value="ALL">All Origins</option>
                            <option value="L">Local Only</option>
                            <option value="F">Foreign Only</option>
                        </select>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        Showing <strong>{processedShareholders.length}</strong> of {shareholders.length}
                    </div>
                    <button
                        onClick={handleExportCSV}
                        style={{
                            padding: '8px 16px',
                            background: 'var(--bg-card)',
                            color: 'var(--text-accent)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            boxShadow: 'var(--shadow-sm)',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--text-accent)'}
                        onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Export CSV
                    </button>
                </div>
            </div>

            <div
                ref={parentRef}
                className="table-container"
                style={{
                    height: '600px',
                    overflow: 'auto',
                    position: 'relative' // needed for absolute positioning of virtual rows
                }}
            >
                <table className="data-table" style={{ width: '100%', tableLayout: 'fixed' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 2, background: 'var(--bg-card)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                        <tr>
                            <th style={{ width: '60px' }}>#</th>
                            <th
                                style={{ cursor: 'pointer', width: '30%' }}
                                onClick={() => handleSort('investorName')}
                            >
                                Investor Name <SortIcon columnKey="investorName" />
                            </th>
                            <th
                                style={{ cursor: 'pointer', width: '15%' }}
                                onClick={() => handleSort('investorType')}
                            >
                                Type <SortIcon columnKey="investorType" />
                            </th>
                            <th
                                style={{ cursor: 'pointer', width: '10%' }}
                                onClick={() => handleSort('localForeign')}
                            >
                                L/F <SortIcon columnKey="localForeign" />
                            </th>
                            <th style={{ width: '15%' }}>Nationality</th>
                            <th
                                style={{ cursor: 'pointer', width: '15%' }}
                                onClick={() => handleSort('totalHoldingShares')}
                            >
                                Total Shares <SortIcon columnKey="totalHoldingShares" />
                            </th>
                            <th
                                style={{ cursor: 'pointer', width: '15%' }}
                                onClick={() => handleSort('percentage')}
                            >
                                Ownership % <SortIcon columnKey="percentage" />
                            </th>
                        </tr>
                    </thead>
                    <tbody style={{
                        height: `${rowVirtualizer.getTotalSize()}px`,
                        position: 'relative',
                    }}>
                        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                            const s = processedShareholders[virtualRow.index];
                            return (
                                <tr
                                    key={virtualRow.key}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: `${virtualRow.size}px`,
                                        transform: `translateY(${virtualRow.start}px)`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        borderBottom: '1px solid var(--border-light)',
                                        background: 'var(--bg-card)'
                                    }}
                                >
                                    <td style={{ width: '60px', color: 'var(--text-tertiary)', fontWeight: 600, fontSize: '12px', borderBottom: 'none' }}>
                                        {virtualRow.index + 1}
                                    </td>
                                    <td className="investor-name" style={{ width: '30%', borderBottom: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>
                                        {s.investorName}
                                    </td>
                                    <td style={{ width: '15%', borderBottom: 'none' }}>
                                        <span className={`type-badge ${getTypeBadgeClass(s.investorType)}`}>
                                            {getInvestorTypeLabel(s.investorType)}
                                        </span>
                                    </td>
                                    <td style={{ width: '10%', borderBottom: 'none' }}>
                                        {s.localForeign && (
                                            <span className={`lf-badge ${s.localForeign === 'L' ? 'lf-local' : 'lf-foreign'}`}>
                                                {getLocalForeignLabel(s.localForeign)}
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ width: '15%', fontSize: '12px', borderBottom: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-secondary)' }}>
                                        {s.nationality || s.domicile || '-'}
                                    </td>
                                    <td style={{ width: '15%', fontVariantNumeric: 'tabular-nums', fontSize: '12px', borderBottom: 'none', color: 'var(--text-primary)' }}>
                                        {formatShares(s.totalHoldingShares)}
                                    </td>
                                    <td className="pct-bar-cell" style={{ width: '15%', borderBottom: 'none' }}>
                                        <div className="pct-bar-wrapper">
                                            <div className="pct-bar" style={{ background: 'var(--border-light)' }}>
                                                <div
                                                    className="pct-bar-fill"
                                                    style={{ width: `${Math.min(s.percentage, 100)}%`, background: 'var(--bg-accent)' }}
                                                />
                                            </div>
                                            <span className="pct-value" style={{ color: 'var(--text-primary)' }}>{s.percentage.toFixed(2)}%</span>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {processedShareholders.length === 0 && (
                            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)', width: '100%' }}>
                                No shareholders match the current filters.
                            </div>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
