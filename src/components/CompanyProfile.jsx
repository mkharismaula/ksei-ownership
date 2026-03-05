import { useState, useEffect } from 'react';
import { fetchCompanyProfile } from '../utils/companyProfile';

export default function CompanyProfile({ stockCode }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [expanded, setExpanded] = useState(true);

    useEffect(() => {
        if (!stockCode) return;
        let cancelled = false;
        setLoading(true);
        setError(null);
        setProfile(null);

        fetchCompanyProfile(stockCode)
            .then((data) => {
                if (!cancelled) {
                    setProfile(data);
                    setLoading(false);
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    console.warn('Failed to fetch company profile:', err.message);
                    setError(err.message);
                    setLoading(false);
                }
            });

        return () => { cancelled = true; };
    }, [stockCode]);

    if (loading) {
        return (
            <div className="card" style={{ marginBottom: 24 }}>
                <div className="card-header">
                    <div className="card-title">🏢 Company Profile</div>
                </div>
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
                    <div style={{ fontSize: 13 }}>Loading company profile from IDX...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="card" style={{ marginBottom: 24 }}>
                <div className="card-header">
                    <div className="card-title">🏢 Company Profile</div>
                </div>
                <div style={{ textAlign: 'center', padding: '32px 24px', color: 'var(--text-secondary)' }}>
                    <div style={{ fontSize: 32, marginBottom: 16 }}>🛡️</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                        IDX Data Protection Active
                    </div>
                    <div style={{ fontSize: 13, maxWidth: 500, margin: '0 auto 20px', lineHeight: 1.5 }}>
                        The Indonesian Stock Exchange (IDX) has strict anti-bot protections that currently block third-party widgets from loading profile data automatically.
                    </div>
                    <a
                        href={`https://www.idx.co.id/id/perusahaan-tercatat/profil-perusahaan-tercatat/${stockCode}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            padding: '10px 20px', background: 'var(--text-accent)', color: 'white',
                            borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none',
                            boxShadow: 'var(--shadow-sm)'
                        }}
                    >
                        View {stockCode} Profile on IDX ↗
                    </a>
                </div>
            </div>
        );
    }

    if (!profile) return null;

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        try {
            return new Date(dateStr).toLocaleDateString('id-ID', {
                year: 'numeric', month: 'long', day: 'numeric',
            });
        } catch { return dateStr; }
    };

    const formatAsset = (num, currency) => {
        if (!num) return '-';
        if (num >= 1e12) return `${currency} ${(num / 1e12).toFixed(2)}T`;
        if (num >= 1e9) return `${currency} ${(num / 1e9).toFixed(2)}B`;
        if (num >= 1e6) return `${currency} ${(num / 1e6).toFixed(1)}M`;
        return `${currency} ${num.toLocaleString('id-ID')}`;
    };

    const sectionStyle = { marginBottom: 20 };
    const sectionTitleStyle = {
        fontSize: 13, fontWeight: 700, color: 'var(--text-primary)',
        marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6,
    };

    return (
        <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header" style={{ cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
                <div className="card-title">🏢 Company Profile — IDX Data</div>
                <span style={{
                    fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 500,
                    display: 'flex', alignItems: 'center', gap: 8,
                }}>
                    <span className="card-badge badge-local">{profile.papanPencatatan}</span>
                    {expanded ? '▲ Collapse' : '▼ Expand'}
                </span>
            </div>

            {expanded && (
                <div>
                    {/* === Company Overview === */}
                    <div style={sectionStyle}>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: profile.logo ? 'auto 1fr' : '1fr',
                            gap: 20,
                            padding: '16px 20px',
                            background: 'var(--bg-primary)',
                            borderRadius: 12,
                            border: '1px solid var(--border-light)',
                        }}>
                            {profile.logo && (
                                <div style={{
                                    width: 72, height: 72, borderRadius: 12,
                                    background: 'white',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    overflow: 'hidden', border: '1px solid var(--border-color)',
                                }}>
                                    <img
                                        src={profile.logo}
                                        alt={profile.kodeEmiten}
                                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                </div>
                            )}
                            <div>
                                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
                                    {profile.namaEmiten}
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                                    <span style={tagStyle('#3b82f6')}>{profile.sektor}</span>
                                    <span style={tagStyle('#8b5cf6')}>{profile.subSektor}</span>
                                    {profile.industri && <span style={tagStyle('#10b981')}>{profile.industri}</span>}
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                    {profile.kegiatanUsahaUtama}
                                </div>
                            </div>
                        </div>

                        {/* Info Grid */}
                        <div style={{
                            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                            gap: 12, marginTop: 12,
                        }}>
                            <InfoItem icon="📍" label="Address" value={profile.alamat} />
                            <InfoItem icon="📞" label="Phone" value={profile.telepon} />
                            <InfoItem icon="📧" label="Email" value={profile.email} />
                            <InfoItem icon="🌐" label="Website" value={profile.website} isLink />
                            <InfoItem icon="📅" label="Listed Since" value={formatDate(profile.tanggalPencatatan)} />
                            <InfoItem icon="🏦" label="BAE" value={profile.bae} />
                        </div>
                    </div>

                    {/* === Corporate Secretary === */}
                    {profile.sekretaris.length > 0 && (
                        <div style={sectionStyle}>
                            <div style={sectionTitleStyle}>📋 Corporate Secretary</div>
                            <div style={{
                                display: 'flex', flexWrap: 'wrap', gap: 12,
                            }}>
                                {profile.sekretaris.map((s, i) => (
                                    <div key={i} style={{
                                        padding: '10px 16px', borderRadius: 10,
                                        background: 'var(--bg-primary)', border: '1px solid var(--border-light)',
                                        fontSize: 13,
                                    }}>
                                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{s.nama}</div>
                                        {s.email && <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>📧 {s.email}</div>}
                                        {s.telepon && <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>📞 {s.telepon}</div>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* === Board of Directors === */}
                    {profile.direktur.length > 0 && (
                        <div style={sectionStyle}>
                            <div style={sectionTitleStyle}>👔 Board of Directors</div>
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Name</th>
                                            <th>Position</th>
                                            <th>Affiliated</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {profile.direktur.map((d, i) => (
                                            <tr key={i}>
                                                <td style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>{i + 1}</td>
                                                <td className="investor-name">{d.nama}</td>
                                                <td style={{ fontSize: 12, textTransform: 'capitalize' }}>
                                                    {d.jabatan?.toLowerCase()}
                                                </td>
                                                <td>
                                                    <span style={{
                                                        fontSize: 10, fontWeight: 600, padding: '2px 8px',
                                                        borderRadius: 4,
                                                        background: d.afiliasi ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                                                        color: d.afiliasi ? '#f59e0b' : '#10b981',
                                                    }}>
                                                        {d.afiliasi ? 'Yes' : 'No'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* === Board of Commissioners === */}
                    {profile.komisaris.length > 0 && (
                        <div style={sectionStyle}>
                            <div style={sectionTitleStyle}>🏛️ Board of Commissioners</div>
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Name</th>
                                            <th>Position</th>
                                            <th>Independent</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {profile.komisaris.map((k, i) => (
                                            <tr key={i}>
                                                <td style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>{i + 1}</td>
                                                <td className="investor-name">{k.nama}</td>
                                                <td style={{ fontSize: 12, textTransform: 'capitalize' }}>
                                                    {k.jabatan?.toLowerCase()}
                                                </td>
                                                <td>
                                                    <span style={{
                                                        fontSize: 10, fontWeight: 600, padding: '2px 8px',
                                                        borderRadius: 4,
                                                        background: k.independen ? 'rgba(16,185,129,0.1)' : 'rgba(148,163,184,0.1)',
                                                        color: k.independen ? '#10b981' : '#94a3b8',
                                                    }}>
                                                        {k.independen ? '✓ Independent' : 'Non-Independent'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* === IDX Shareholders === */}
                    {profile.pemegangSaham.length > 0 && (
                        <div style={sectionStyle}>
                            <div style={sectionTitleStyle}>📊 Shareholders (IDX Data)</div>
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Shareholder</th>
                                            <th>Category</th>
                                            <th>Shares</th>
                                            <th>%</th>
                                            <th>Controlling</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {profile.pemegangSaham.map((p, i) => (
                                            <tr key={i}>
                                                <td style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>{i + 1}</td>
                                                <td className="investor-name">{p.nama}</td>
                                                <td style={{ fontSize: 11 }}>
                                                    <span style={{
                                                        padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                                                        background: 'rgba(102,126,234,0.1)', color: '#667eea',
                                                    }}>
                                                        {p.kategori}
                                                    </span>
                                                </td>
                                                <td style={{ fontSize: 12 }}>{p.jumlah.toLocaleString('id-ID')}</td>
                                                <td style={{ fontWeight: 700 }}>{p.persentase.toFixed(2)}%</td>
                                                <td>
                                                    {p.pengendali && (
                                                        <span style={{
                                                            fontSize: 10, fontWeight: 600, padding: '2px 8px',
                                                            borderRadius: 4,
                                                            background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                                                        }}>
                                                            ⚡ Controller
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* === Subsidiaries === */}
                    {profile.anakPerusahaan.length > 0 && (
                        <div style={sectionStyle}>
                            <div style={sectionTitleStyle}>🏗️ Subsidiaries</div>
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Company</th>
                                            <th>Business</th>
                                            <th>Location</th>
                                            <th>Ownership %</th>
                                            <th>Total Assets</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {profile.anakPerusahaan.map((a, i) => (
                                            <tr key={i}>
                                                <td style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>{i + 1}</td>
                                                <td className="investor-name">{a.nama}</td>
                                                <td style={{ fontSize: 12 }}>{a.bidangUsaha}</td>
                                                <td style={{ fontSize: 12 }}>{a.lokasi}</td>
                                                <td style={{ fontWeight: 700 }}>{a.persentase.toFixed(2)}%</td>
                                                <td style={{ fontSize: 12 }}>{formatAsset(a.jumlahAset, a.mataUang)}</td>
                                                <td>
                                                    <span style={{
                                                        fontSize: 10, fontWeight: 600, padding: '2px 8px',
                                                        borderRadius: 4,
                                                        background: a.statusOperasi === 'Operasi'
                                                            ? 'rgba(16,185,129,0.1)' : 'rgba(148,163,184,0.1)',
                                                        color: a.statusOperasi === 'Operasi' ? '#10b981' : '#94a3b8',
                                                    }}>
                                                        {a.statusOperasi}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* === Audit Committee === */}
                    {profile.komiteAudit.length > 0 && (
                        <div style={sectionStyle}>
                            <div style={sectionTitleStyle}>🔍 Audit Committee</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {profile.komiteAudit.map((k, i) => (
                                    <div key={i} style={{
                                        padding: '8px 14px', borderRadius: 8,
                                        background: 'var(--bg-primary)', border: '1px solid var(--border-light)',
                                        fontSize: 12,
                                    }}>
                                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{k.nama}</span>
                                        <span style={{ color: 'var(--text-tertiary)', marginLeft: 6 }}>
                                            ({k.jabatan?.toLowerCase()})
                                        </span>
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

/* ===== Helper Components ===== */

function InfoItem({ icon, label, value, isLink }) {
    if (!value || value === '-') return null;
    return (
        <div style={{
            padding: '10px 14px', borderRadius: 8,
            background: 'var(--bg-primary)', border: '1px solid var(--border-light)',
        }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
                {icon} {label}
            </div>
            {isLink ? (
                <a
                    href={value.startsWith('http') ? value : `https://${value}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-accent)', textDecoration: 'none' }}
                >
                    {value}
                </a>
            ) : (
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                    {value}
                </div>
            )}
        </div>
    );
}

function tagStyle(color) {
    return {
        fontSize: 10, fontWeight: 600, padding: '2px 10px',
        borderRadius: 6, background: `${color}15`, color: color,
        textTransform: 'uppercase', letterSpacing: '0.04em',
    };
}
