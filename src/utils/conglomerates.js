// Indonesian Conglomerate → Stock Code mapping
// Source: KSEI public data reference

export const CONGLOMERATES = [
    {
        name: 'Low Tuck Kwong',
        emoji: '⛏️',
        stocks: ['BYAN', 'MYOH'],
    },
    {
        name: 'Prajogo Pangestu',
        emoji: '🏭',
        stocks: ['BREN', 'BRPT', 'CUAN', 'CDIA', 'PTRO', 'RATU', 'SSIA', 'TPIA'],
    },
    {
        name: 'Hermanto Tanoko',
        emoji: '💧',
        stocks: ['AVIA', 'CLEO', 'MERI', 'RISE', 'ZONE', 'BLES', 'PEVE', 'CAKK', 'DEPO', 'ABMM'],
    },
    {
        name: 'Happy Hapsoro',
        emoji: '🏗️',
        stocks: ['RAJA', 'RATU', 'SINI', 'MINA', 'BUVA', 'PTRO', 'FORU', 'PSKT'],
    },
    {
        name: 'Aguan / Sugianto Kusuma',
        emoji: '🏬',
        stocks: ['CBDK', 'ERAA', 'ERAL', 'PANI', 'PDPP'],
    },
    {
        name: 'Chairul Tanjung',
        emoji: '🏦',
        stocks: ['MEGA', 'GIAA', 'BBHI'],
    },
    {
        name: 'Boy Tohir',
        emoji: '⚡',
        stocks: ['AADI', 'ADRO', 'ADMR', 'ESSA', 'MBMA', 'MDKA', 'TRIM'],
    },
    {
        name: 'TP Rachmat',
        emoji: '🌴',
        stocks: ['ASSA', 'ESSA', 'DSNG', 'DRMA', 'TAPG', 'KMTR'],
    },
    {
        name: 'Arsjad Rasjid',
        emoji: '🛢️',
        stocks: ['INDY', 'MBSS', 'PSKT', 'RAJA', 'PTRO'],
    },
    {
        name: 'Bakrie & Salim',
        emoji: '🏔️',
        stocks: ['BRMS', 'BNBR', 'BTEL', 'BUMI', 'DEWA', 'ELTY', 'ENRG', 'MDIA', 'UNSP', 'VIVA', 'VKTR'],
    },
    {
        name: 'Emtek Group',
        emoji: '📺',
        stocks: ['BUKA', 'BBHI', 'EMTK', 'RSGK', 'SCMA'],
    },
    {
        name: 'Djarum Group',
        emoji: '🏧',
        stocks: ['BBCA', 'BELI', 'DATA', 'HEAL', 'RANC', 'SUPR', 'SSIA', 'TOWR'],
    },
    {
        name: 'Lippo Group',
        emoji: '🏥',
        stocks: ['GMTD', 'LPCK', 'LPGI', 'LPKR', 'LPLI', 'LPPF', 'LPPS', 'MLPL', 'MLPT', 'MPPA', 'NOBU', 'SILO'],
    },
    {
        name: 'Salim Group',
        emoji: '🍜',
        stocks: ['BINA', 'CBDK', 'DCII', 'DNET', 'FAST', 'ICBP', 'IMAS', 'IMJS', 'INDF', 'LSIP', 'META', 'SIMP', 'AMMN', 'EMTK'],
    },
    {
        name: 'MNC Group',
        emoji: '📡',
        stocks: ['BABP', 'BCAP', 'BHIT', 'BMTR', 'IATA', 'IPTV', 'KPIG', 'MNCN', 'MSIN', 'MSKY'],
    },
    {
        name: 'Astra Group',
        emoji: '🚗',
        stocks: ['AALI', 'ACST', 'ASGR', 'ASII', 'AUTO', 'UNTR', 'BNLI'],
    },
    {
        name: 'Sinar Mas Group',
        emoji: '📄',
        stocks: ['BSDE', 'BSIM', 'DMAS', 'DSSA', 'DUTI', 'FREN', 'INKP', 'SMAR', 'SMMA', 'LIFE', 'TKIM', 'GEMS'],
    },
    {
        name: 'Rajawali Group',
        emoji: '🦅',
        stocks: ['SMMT', 'FORU', 'BWPT', 'ARCI'],
    },
];

// Build reverse lookup: stock code → conglomerate name(s)
const _stockToConglo = {};
for (const c of CONGLOMERATES) {
    for (const code of c.stocks) {
        if (!_stockToConglo[code]) _stockToConglo[code] = [];
        _stockToConglo[code].push(c.name);
    }
}

export function getConglomerateForStock(code) {
    return _stockToConglo[code] || [];
}
