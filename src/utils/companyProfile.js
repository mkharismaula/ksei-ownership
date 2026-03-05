/**
 * Fetch company profile details from IDX API via Vite middleware proxy.
 * The Vite dev server handles Cloudflare bypass with proper cookies/headers.
 */
export async function fetchCompanyProfile(kodeEmiten) {
    if (!kodeEmiten) return null;

    const url = `/api/idx/primary/ListedCompany/GetCompanyProfilesDetail?KodeEmiten=${encodeURIComponent(kodeEmiten)}&language=id-id`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`IDX API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!data || !data.Profiles || data.Profiles.length === 0) {
        return null;
    }

    const profile = data.Profiles[0];

    return {
        // Company Overview
        kodeEmiten: profile.KodeEmiten || kodeEmiten,
        namaEmiten: profile.NamaEmiten || '',
        alamat: profile.Alamat || '',
        telepon: profile.Telepon || '',
        fax: profile.Fax || '',
        email: profile.Email || '',
        website: profile.Website || '',
        npwp: profile.NPWP || '',
        sektor: profile.Sektor || '',
        subSektor: profile.SubSektor || '',
        industri: profile.Industri || '',
        subIndustri: profile.SubIndustri || '',
        papanPencatatan: profile.PapanPencatatan || '',
        tanggalPencatatan: profile.TanggalPencatatan || '',
        kegiatanUsahaUtama: profile.KegiatanUsahaUtama || '',
        bae: profile.BAE || '',
        logo: profile.Logo ? `https://www.idx.co.id${profile.Logo}` : null,

        // Board members
        direktur: (data.Direktur || []).map(d => ({
            nama: d.Nama,
            jabatan: d.Jabatan,
            afiliasi: d.Afiliasi,
        })),
        komisaris: (data.Komisaris || []).map(k => ({
            nama: k.Nama,
            jabatan: k.Jabatan,
            independen: k.Independen,
        })),

        // Corporate Secretary
        sekretaris: (data.Sekretaris || []).map(s => ({
            nama: s.Nama,
            telepon: s.Telepon,
            email: s.Email,
            fax: s.Fax,
        })),

        // Audit Committee
        komiteAudit: (data.KomiteAudit || []).map(k => ({
            nama: k.Nama,
            jabatan: k.Jabatan,
        })),

        // IDX Shareholders
        pemegangSaham: (data.PemegangSaham || []).filter(p => p.Persentase > 0).map(p => ({
            nama: p.Nama,
            kategori: p.Kategori,
            jumlah: p.Jumlah,
            persentase: p.Persentase,
            pengendali: p.Pengendali,
        })),

        // Subsidiaries
        anakPerusahaan: (data.AnakPerusahaan || []).map(a => ({
            nama: a.Nama,
            bidangUsaha: a.BidangUsaha,
            lokasi: a.Lokasi,
            persentase: a.Persentase,
            jumlahAset: a.JumlahAset,
            mataUang: a.MataUang,
            statusOperasi: a.StatusOperasi,
        })),
    };
}
