// Advanced analytics utilities for KSEI data

/**
 * Feature 1: Whale Tracking
 * Get top investors across the entire market sorted by number of stocks held
 */
export function getTopInvestors(investorIndex, limit = 50) {
    const investors = Object.entries(investorIndex).map(([name, holdings]) => {
        const totalShares = holdings.reduce((s, h) => s + h.totalHoldingShares, 0);
        const avgPct = holdings.reduce((s, h) => s + h.percentage, 0) / holdings.length;
        const maxHolding = holdings[0]; // already sorted desc
        const controllingCount = holdings.filter(h => h.percentage >= 5).length;

        // Determine dominant type
        const typeCounts = {};
        holdings.forEach(h => {
            typeCounts[h.investorType] = (typeCounts[h.investorType] || 0) + 1;
        });
        const dominantType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';

        // Determine L/F
        const localForeign = holdings[0]?.localForeign || '';

        return {
            name,
            stockCount: holdings.length,
            totalShares,
            avgPct,
            maxHolding,
            controllingCount,
            dominantType,
            localForeign,
            holdings,
        };
    });

    return investors
        .filter(i => i.stockCount >= 2) // Only multi-stock holders
        .sort((a, b) => b.stockCount - a.stockCount)
        .slice(0, limit);
}

/**
 * Feature 3: Ownership Concentration & Free Float
 */
export function calculateOwnershipConcentration(shareholders) {
    if (!shareholders || shareholders.length === 0) {
        return {
            controllingShareholders: [],
            controllingPct: 0,
            freeFloatPct: 100,
            hhi: 0,
            riskLevel: 'Unknown',
            riskColor: '#9ca3af',
            topHolderPct: 0,
            top5Pct: 0,
            retailCount: 0,
            institutionalCount: 0,
        };
    }

    const sorted = [...shareholders].sort((a, b) => b.percentage - a.percentage);
    const controlling = sorted.filter(s => s.percentage >= 5);
    const controllingPct = controlling.reduce((s, c) => s + c.percentage, 0);
    const freeFloatPct = Math.max(0, 100 - controllingPct);

    // Herfindahl-Hirschman Index (HHI) - measure of concentration
    const hhi = sorted.reduce((sum, s) => sum + Math.pow(s.percentage, 2), 0);

    const topHolderPct = sorted[0]?.percentage || 0;
    const top5Pct = sorted.slice(0, 5).reduce((s, c) => s + c.percentage, 0);

    // Risk assessment
    let riskLevel, riskColor;
    if (freeFloatPct < 10) {
        riskLevel = 'Very High';
        riskColor = '#ef4444';
    } else if (freeFloatPct < 25) {
        riskLevel = 'High';
        riskColor = '#f59e0b';
    } else if (freeFloatPct < 50) {
        riskLevel = 'Medium';
        riskColor = '#3b82f6';
    } else {
        riskLevel = 'Low';
        riskColor = '#10b981';
    }

    const retailCount = shareholders.filter(s => s.investorType === 'ID').length;
    const institutionalCount = shareholders.filter(s =>
        ['CP', 'IB', 'IS', 'SC', 'MF', 'PF'].includes(s.investorType)
    ).length;

    return {
        controllingShareholders: controlling,
        controllingPct,
        freeFloatPct,
        hhi: Math.round(hhi),
        riskLevel,
        riskColor,
        topHolderPct,
        top5Pct,
        retailCount,
        institutionalCount,
    };
}

/**
 * Feature 4: Connection Finder (BFS pathfinding between two stocks)
 * Finds shared investors between Stock A and Stock B
 */
export function findConnectionPath(stockMapData, investorIndex, codeA, codeB) {
    if (!stockMapData || !investorIndex || !codeA || !codeB || codeA === codeB) {
        return { direct: [], indirect: [], connected: false };
    }

    const stockA = stockMapData[codeA];
    const stockB = stockMapData[codeB];
    if (!stockA || !stockB) return { direct: [], indirect: [], connected: false };

    // Direct connections: investors who hold BOTH stocks
    const investorsA = new Set(stockA.shareholders.map(s => s.investorName.toUpperCase().trim()));
    const investorsB = new Set(stockB.shareholders.map(s => s.investorName.toUpperCase().trim()));

    const direct = [];
    for (const name of investorsA) {
        if (investorsB.has(name)) {
            const holdingsA = stockA.shareholders.find(s => s.investorName.toUpperCase().trim() === name);
            const holdingsB = stockB.shareholders.find(s => s.investorName.toUpperCase().trim() === name);
            direct.push({
                investorName: holdingsA?.investorName || name,
                investorType: holdingsA?.investorType || '',
                pctInA: holdingsA?.percentage || 0,
                pctInB: holdingsB?.percentage || 0,
            });
        }
    }
    direct.sort((a, b) => (b.pctInA + b.pctInB) - (a.pctInA + a.pctInB));

    // Indirect connections: investors who hold Stock A and also share another stock with investors of Stock B
    const indirect = [];
    if (direct.length === 0) {
        // Find bridge stocks: what other stocks do A's investors hold?
        for (const sA of stockA.shareholders) {
            const keyA = sA.investorName.toUpperCase().trim();
            const allHoldings = investorIndex[keyA];
            if (!allHoldings || allHoldings.length <= 1) continue;

            for (const h of allHoldings) {
                if (h.shareCode === codeA || h.shareCode === codeB) continue;

                // Check if any investor in Stock B also holds this bridge stock
                const bridgeStock = stockMapData[h.shareCode];
                if (!bridgeStock) continue;

                for (const sB of stockB.shareholders) {
                    const keyB = sB.investorName.toUpperCase().trim();
                    const bridgeMatch = bridgeStock.shareholders.find(
                        bs => bs.investorName.toUpperCase().trim() === keyB
                    );
                    if (bridgeMatch) {
                        indirect.push({
                            investorA: sA.investorName,
                            investorB: sB.investorName,
                            bridgeStock: h.shareCode,
                            bridgeIssuer: h.issuerName,
                            pctAinBridge: h.percentage,
                            pctBinBridge: bridgeMatch.percentage,
                        });
                    }
                }
            }
        }
        // Deduplicate and sort
        const seen = new Set();
        const uniqueIndirect = indirect.filter(item => {
            const key = `${item.investorA}-${item.bridgeStock}-${item.investorB}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
        uniqueIndirect.sort((a, b) =>
            (b.pctAinBridge + b.pctBinBridge) - (a.pctAinBridge + a.pctBinBridge)
        );
        return { direct, indirect: uniqueIndirect.slice(0, 20), connected: uniqueIndirect.length > 0 };
    }

    return { direct, indirect, connected: direct.length > 0 };
}

/**
 * Feature 5: Conglomerate aggregate stats
 */
export function getConglomerateStats(congloStocks, stockMap) {
    const stats = {
        totalStocks: 0,
        totalShareholders: 0,
        avgFreeFloat: 0,
        avgConcentration: 0,
        localPct: 0,
        foreignPct: 0,
        stocks: [],
    };

    let totalLocal = 0, totalForeign = 0, totalOther = 0;
    let floatSum = 0;

    for (const code of congloStocks) {
        const stock = stockMap[code];
        if (!stock) continue;

        stats.totalStocks++;
        stats.totalShareholders += stock.shareholders.length;

        const conc = calculateOwnershipConcentration(stock.shareholders);
        floatSum += conc.freeFloatPct;

        let sLocal = 0, sForeign = 0, sOther = 0;
        stock.shareholders.forEach(s => {
            if (s.localForeign === 'L') sLocal += s.percentage;
            else if (s.localForeign === 'A') sForeign += s.percentage;
            else sOther += s.percentage;
        });

        stats.stocks.push({
            code: stock.code,
            name: stock.name,
            shareholderCount: stock.shareholders.length,
            freeFloat: conc.freeFloatPct,
            riskLevel: conc.riskLevel,
            riskColor: conc.riskColor,
            topHolder: stock.shareholders[0]?.investorName || '-',
            topPct: stock.shareholders[0]?.percentage || 0,
            localPct: sLocal,
            foreignPct: sForeign,
        });

        totalLocal += sLocal;
        totalForeign += sForeign;
        totalOther += sOther;
    }

    if (stats.totalStocks > 0) {
        stats.avgFreeFloat = floatSum / stats.totalStocks;
        const totalPct = totalLocal + totalForeign + totalOther;
        stats.localPct = totalPct > 0 ? (totalLocal / totalPct) * 100 : 0;
        stats.foreignPct = totalPct > 0 ? (totalForeign / totalPct) * 100 : 0;
    }

    stats.stocks.sort((a, b) => b.topPct - a.topPct);
    return stats;
}
