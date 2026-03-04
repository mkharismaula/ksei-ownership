import * as XLSX from 'xlsx';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

async function fetchWithRetry(url, retries = MAX_RETRIES) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const contentType = response.headers.get('content-type') || '';
            // Guard against accidentally fetching an HTML error page
            if (contentType.includes('text/html')) {
                throw new Error('Received HTML instead of xlsx file. Check that the file exists in the public/ folder.');
            }
            const arrayBuffer = await response.arrayBuffer();
            if (!arrayBuffer || arrayBuffer.byteLength < 100) {
                throw new Error('Downloaded file is empty or too small');
            }
            return arrayBuffer;
        } catch (err) {
            console.warn(`Fetch attempt ${attempt}/${retries} failed:`, err.message);
            if (attempt === retries) throw err;
            await new Promise(r => setTimeout(r, RETRY_DELAY * attempt));
        }
    }
}

// Try multiple possible column name variants
function findColumn(clean, ...variants) {
    for (const v of variants) {
        if (clean[v] !== undefined && clean[v] !== '') return clean[v];
    }
    return '';
}

export async function loadKSEIData() {
    const arrayBuffer = await fetchWithRetry('/ksei_data.xlsx');
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('No sheets found in the xlsx file');
    }

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (!rawData || rawData.length === 0) {
        throw new Error('No data rows found in the spreadsheet');
    }

    console.log(`Loaded ${rawData.length} rows from sheet "${sheetName}"`);

    // Parse numeric fields safely
    const parseNum = (v) => {
        if (typeof v === 'number') return v;
        if (!v && v !== 0) return 0;
        return parseFloat(String(v).replace(/,/g, '').trim()) || 0;
    };

    // Normalize and clean data
    const data = rawData.map(row => {
        const clean = {};
        for (const key of Object.keys(row)) {
            const normalizedKey = key.trim().toUpperCase().replace(/\s+/g, '_');
            let value = row[key];
            if (typeof value === 'string') {
                value = value.trim();
            }
            clean[normalizedKey] = value;
        }

        return {
            date: findColumn(clean, 'DATE'),
            shareCode: findColumn(clean, 'SHARE_CODE', 'SHARECODE', 'STOCK_CODE', 'TICKER'),
            issuerName: findColumn(clean, 'ISSUER_NAME', 'ISSUERNAME', 'COMPANY_NAME', 'ISSUER'),
            investorName: findColumn(clean, 'INVESTOR_NAME', 'INVESTORNAME', 'SHAREHOLDER_NAME', 'INVESTOR'),
            investorType: findColumn(clean, 'INVESTOR_TYPE', 'INVESTORTYPE', 'TYPE'),
            localForeign: findColumn(clean, 'LOCAL_FOREIGN', 'LOCALFOREIGN', 'LOCAL/FOREIGN', 'L_F'),
            nationality: findColumn(clean, 'NATIONALITY'),
            domicile: findColumn(clean, 'DOMICILE'),
            holdingsScripless: parseNum(findColumn(clean, 'HOLDINGS_SCRIPLESS', 'SCRIPLESS', 'HOLDINGS_(SCRIPLESS)')),
            holdingsScript: parseNum(findColumn(clean, 'HOLDINGS_SCRIP', 'SCRIP', 'HOLDINGS_(SCRIP)')),
            totalHoldingShares: parseNum(findColumn(clean, 'TOTAL_HOLDING_SHARES', 'TOTAL_HOLDINGS', 'TOTAL_HOLDING', 'TOTAL')),
            percentage: parseNum(findColumn(clean, 'PERCENTAGE', 'PCT', 'PERCENT', '%')),
        };
    });

    const filtered = data.filter(d => d.shareCode);
    console.log(`Parsed ${filtered.length} valid shareholder records`);

    if (filtered.length === 0) {
        // Log first row keys to help debug column mismatch
        console.error('Column names found:', Object.keys(rawData[0]));
        throw new Error('No valid records found. Column names may not match expected format.');
    }

    return filtered;
}

// Group data by stock code
export function groupByStock(data) {
    const map = {};
    for (const row of data) {
        if (!map[row.shareCode]) {
            map[row.shareCode] = {
                code: row.shareCode,
                name: row.issuerName,
                shareholders: [],
            };
        }
        map[row.shareCode].shareholders.push(row);
    }
    // Sort shareholders by percentage descending
    for (const code of Object.keys(map)) {
        map[code].shareholders.sort((a, b) => b.percentage - a.percentage);
    }
    return map;
}

// Get unique stock list
export function getStockList(stockMap) {
    return Object.values(stockMap)
        .map(s => ({ code: s.code, name: s.name }))
        .sort((a, b) => a.code.localeCompare(b.code));
}

// Investor type mapping
export const INVESTOR_TYPES = {
    CP: 'Corporate',
    ID: 'Individual',
    IB: 'Investment Bank',
    IS: 'Insurance',
    SC: 'Securities Co.',
    MF: 'Mutual Fund',
    PF: 'Pension Fund',
    FD: 'Foundation',
    OT: 'Others',
};

export function getInvestorTypeLabel(code) {
    return INVESTOR_TYPES[code] || code || 'Unknown';
}

export function getLocalForeignLabel(code) {
    if (code === 'L') return 'Local';
    if (code === 'A') return 'Foreign';
    return code || '-';
}

// Determine controlling shareholders (>= 5%)
export function getControllingShareholders(shareholders) {
    return shareholders.filter(s => s.percentage >= 5);
}

// Format numbers
export function formatNumber(num) {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toLocaleString();
}

export function formatShares(num) {
    return num.toLocaleString('id-ID');
}

// Chart colors
export const CHART_COLORS = [
    '#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe',
    '#43e97b', '#fa709a', '#fee140', '#a18cd1', '#fbc2eb',
    '#ff6b6b', '#ffa36b', '#48c6ef',
];

// Build cross-stock investor index: investorName -> [{ shareCode, issuerName, percentage, ... }]
export function buildInvestorIndex(data) {
    const index = {};
    for (const row of data) {
        const name = row.investorName.toUpperCase().trim();
        if (!name) continue;
        if (!index[name]) {
            index[name] = [];
        }
        index[name].push({
            shareCode: row.shareCode,
            issuerName: row.issuerName,
            percentage: row.percentage,
            totalHoldingShares: row.totalHoldingShares,
            investorType: row.investorType,
            localForeign: row.localForeign,
        });
    }
    // Sort each investor's holdings by percentage descending
    for (const name of Object.keys(index)) {
        index[name].sort((a, b) => b.percentage - a.percentage);
    }
    return index;
}

// Get cross-stock connections for shareholders of a given stock
export function getCrossStockLinks(shareholders, investorIndex, currentCode) {
    const results = [];
    for (const s of shareholders) {
        const key = s.investorName.toUpperCase().trim();
        const holdings = investorIndex[key];
        if (holdings && holdings.length > 1) {
            const otherStocks = holdings.filter(h => h.shareCode !== currentCode);
            results.push({
                investorName: s.investorName,
                investorType: s.investorType,
                percentageInCurrent: s.percentage,
                otherStocks,
            });
        }
    }
    // Sort by number of other stocks held (most connected first)
    results.sort((a, b) => b.otherStocks.length - a.otherStocks.length);
    return results;
}

