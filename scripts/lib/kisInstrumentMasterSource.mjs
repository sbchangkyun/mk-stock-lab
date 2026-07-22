/**
 * Phase 3GG-T-HF3B-HF2 — KIS instrument-master source adapter (pure, offline, no dependency).
 *
 * Parses the OFFICIAL public Korea Investment & Securities master files into the normalized universal
 * instrument shape used by Chart AI. KIS-only: no KRX / data.go.kr / Nasdaq-Trader source. Classification
 * uses the KIS field-based security type ONLY (never product name / brand / ticker shape).
 *
 * Sources (downloaded to scratch by the caller; never committed):
 *   KR domestic .mst (EUC-KR, fixed-width; 단축코드[0:9] 표준코드[9:21] 한글명[21:len-tail]; group code =
 *     first 2 chars of the fixed tail): security group ST=stock, EF=ETF, EN=ETN, RT=REIT, ...
 *       - KOSPI  master: fixed tail 228, group at len-227
 *       - KOSDAQ master: fixed tail 222, group at len-221
 *   US overseas .cod (TAB-delimited): [2]=exchange code NAS/NYS/AMS, [4]=ticker, [7]=English name,
 *       [8]=security type 2=stock, 3=ETF (KIS field; no separate ETN code in these files).
 *
 * Shared by the generator (Lane A) and the refresh pipeline (Lane B) so both classify identically.
 */

// ---- KR symbol / US symbol contracts (mirror src/lib/market-data/instrument.ts) ----
export const KR_SYMBOL_RE = /^[0-9A-Z]{6}$/; // Phase HF3B-HF2: alphanumeric six-char KRX codes
export const US_SYMBOL_RE = /^[A-Z][A-Z0-9.]{0,9}$/;

const DOMESTIC_LAYOUT = {
  KOSPI: { tail: 228, groupOffset: 227, exchange: 'KOSPI' },
  KOSDAQ: { tail: 222, groupOffset: 221, exchange: 'KOSDAQ' },
};

// KIS domestic security-group code -> app asset type (only these are supported; others rejected).
const KR_GROUP_TO_TYPE = { ST: 'stock', EF: 'etf' };
// KIS overseas security-type code -> app asset type.
const US_TYPE_TO_ASSET = { 2: 'stock', 3: 'etf' };
const US_EXCD_TO_EXCHANGE = { NAS: 'NASDAQ', NYS: 'NYSE', AMS: 'AMEX' };

const collapse = (v) => String(v ?? '').normalize('NFKC').replace(/\s+/gu, ' ').trim();

/** Parse a KR domestic .mst buffer (EUC-KR) into raw records. */
export const parseKisDomesticMaster = (buf, { market }) => {
  const layout = DOMESTIC_LAYOUT[market];
  if (!layout) throw new Error(`unknown KR market: ${market}`);
  const txt = new TextDecoder('euc-kr').decode(buf);
  const lines = txt.split(/\r?\n/).filter((l) => l.length > 10);
  return lines.map((l) => {
    const shortCode = l.slice(0, 9).trim();
    const isin = l.slice(9, 21).trim();
    const nameKo = collapse(l.slice(21, l.length - layout.tail));
    const group = l.slice(l.length - layout.groupOffset, l.length - layout.groupOffset + 2);
    // Tradable 6-char KRX code = ISIN chars 3..8 (KR7XXXXXX00Y); fall back to the short code.
    const krxCode = (/^KR7/.test(isin) && isin.length >= 9 ? isin.slice(3, 9) : shortCode).toUpperCase();
    return { country: 'KR', shortCode, isin, nameKo, group, krxCode, market, exchange: layout.exchange };
  });
};

/** Parse a US overseas .cod buffer (TAB-delimited; ASCII fields) into raw records. */
export const parseKisOverseasMaster = (buf) => {
  // Decode as latin1 so byte positions/tabs are preserved; we only read ASCII fields.
  const txt = new TextDecoder('latin1').decode(buf);
  const lines = txt.split(/\r?\n/).filter((l) => l.includes('\t'));
  return lines.map((l) => {
    const f = l.split('\t');
    return {
      country: 'US',
      excd: (f[2] || '').trim(),
      ticker: (f[4] || '').trim().toUpperCase(),
      engName: collapse(f[7] || ''),
      type: (f[8] || '').trim(),
    };
  });
};

const REJECT = {
  UNSUPPORTED_GROUP: 'unsupported-security-group',
  UNSUPPORTED_TYPE: 'unsupported-security-type',
  UNSUPPORTED_EXCHANGE: 'unsupported-exchange',
  BAD_SYMBOL: 'invalid-symbol-shape',
  BLANK_FIELD: 'blank-required-field',
  DUP: 'duplicate-country-symbol',
};

const bump = (m, k) => m.set(k, (m.get(k) || 0) + 1);

/**
 * Build the normalized active master from KIS sources.
 * @param {{ domestic: {market:string, buf:Buffer}[], overseas: {buf:Buffer}[],
 *           anchors?: any[], sourceAsOf?: string }} input
 * @returns {{ instruments, rejections, counts }}
 */
export const buildKisActiveMaster = ({ domestic = [], overseas = [], anchors = [] } = {}) => {
  const rejections = new Map();
  const byCountrySymbol = new Map();

  const add = (rec) => {
    const key = `${rec.country}|${rec.symbol}`;
    if (byCountrySymbol.has(key)) { bump(rejections, REJECT.DUP); return; }
    byCountrySymbol.set(key, rec);
  };

  // KR domestic
  for (const { market, buf } of domestic) {
    for (const r of parseKisDomesticMaster(buf, { market })) {
      const assetType = KR_GROUP_TO_TYPE[r.group];
      if (!assetType) { bump(rejections, REJECT.UNSUPPORTED_GROUP); continue; } // EN/RT/... excluded
      if (!KR_SYMBOL_RE.test(r.krxCode)) { bump(rejections, REJECT.BAD_SYMBOL); continue; }
      if (!r.nameKo) { bump(rejections, REJECT.BLANK_FIELD); continue; }
      add({
        symbol: r.krxCode,
        displayName: r.nameKo,
        country: 'KR',
        exchange: r.exchange,
        assetType,
        exchangeCode: null,
        standardCode: r.isin || null,
        aliases: [r.krxCode.toLowerCase()],
      });
    }
  }

  // US overseas
  for (const { buf } of overseas) {
    for (const r of parseKisOverseasMaster(buf)) {
      const assetType = US_TYPE_TO_ASSET[r.type];
      if (!assetType) { bump(rejections, REJECT.UNSUPPORTED_TYPE); continue; } // ETN/other excluded
      const exchange = US_EXCD_TO_EXCHANGE[r.excd];
      if (!exchange) { bump(rejections, REJECT.UNSUPPORTED_EXCHANGE); continue; }
      if (!US_SYMBOL_RE.test(r.ticker)) { bump(rejections, REJECT.BAD_SYMBOL); continue; }
      if (!r.engName) { bump(rejections, REJECT.BLANK_FIELD); continue; }
      add({
        symbol: r.ticker,
        displayName: r.engName,
        englishName: r.engName,
        country: 'US',
        exchange,
        assetType,
        exchangeCode: r.excd,
        standardCode: null,
        aliases: [r.ticker.toLowerCase()],
      });
    }
  }

  // Enrich with curated anchors (englishName / Korean aliases) by country+symbol — never adds new rows,
  // only enriches an already-KIS-present record (KIS is the membership authority).
  const anchorByKey = new Map(anchors.map((a) => [`${a.country}|${a.symbol}`, a]));
  for (const [key, rec] of byCountrySymbol) {
    const a = anchorByKey.get(key);
    if (!a) continue;
    if (a.englishName && !rec.englishName) rec.englishName = a.englishName;
    const extra = [...(a.aliases || []), a.englishName].filter(Boolean).map((x) => collapse(x).toLowerCase());
    rec.aliases = [...new Set([...rec.aliases, ...extra])];
  }

  // Deterministic ordering + stable per-record shape + normalized aliases
  const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
  const instruments = [...byCountrySymbol.values()]
    .sort((a, b) => cmp(a.country, b.country) || cmp(a.assetType, b.assetType) || cmp(a.symbol, b.symbol) || cmp(a.exchange, b.exchange))
    .map((r) => {
      const aliasSet = new Set([...(r.aliases || []), r.symbol.toLowerCase()].map((x) => collapse(x).toLowerCase()).filter(Boolean));
      return {
        symbol: r.symbol,
        displayName: r.displayName,
        ...(r.englishName ? { englishName: r.englishName } : {}),
        country: r.country,
        exchange: r.exchange,
        assetType: r.assetType,
        exchangeCode: r.exchangeCode ?? null,
        ...(r.standardCode ? { standardCode: r.standardCode } : {}),
        aliases: [...aliasSet].sort(),
        active: true,
      };
    });

  const catCount = (c, a) => instruments.filter((i) => i.country === c && i.assetType === a).length;
  const krEtf = instruments.filter((i) => i.country === 'KR' && i.assetType === 'etf');
  const counts = {
    total: instruments.length,
    krStock: catCount('KR', 'stock'),
    krEtf: krEtf.length,
    krEtfNumeric: krEtf.filter((i) => /^\d{6}$/.test(i.symbol)).length,
    krEtfAlphanumeric: krEtf.filter((i) => /^[0-9A-Z]{6}$/.test(i.symbol) && !/^\d{6}$/.test(i.symbol)).length,
    usStock: catCount('US', 'stock'),
    usEtf: catCount('US', 'etf'),
    byExchange: instruments.reduce((acc, i) => { acc[i.exchange] = (acc[i.exchange] || 0) + 1; return acc; }, {}),
  };

  return { instruments, rejections: Object.fromEntries(rejections), counts };
};
