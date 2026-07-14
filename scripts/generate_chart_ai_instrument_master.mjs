/**
 * Phase 3GG-T-HF3B universal instrument master generator (offline, deterministic, no dependency).
 *
 * Builds the server-only universal instrument master from OFFICIAL primary listing metadata plus a
 * small set of curated verified anchors. Sources are provided as LOCAL FILE PATHS (this script never
 * downloads anything, never reads credentials, never calls a provider/LLM/network). It normalizes,
 * validates, maps exchanges to the existing KIS transport contract, classifies stock/ETF ONLY from
 * verified source metadata, rejects unsupported/malformed rows with counted reasons, and emits a
 * deterministic master JSON + a provenance manifest. No fabricated symbols/names/exchanges.
 *
 * Official development-time sources (owner downloads them; this script only reads the local files):
 *   - US: NASDAQ Trader Symbol Directory  nasdaqlisted.txt + otherlisted.txt
 *         (official symbol directory published by Nasdaq; carries the authoritative ETF flag and the
 *          listing exchange for NYSE/NYSE American/NYSE Arca).
 *   - KR: KRX KIND listed-corporation directory (상장법인목록), downloaded per market
 *         (marketType=stockMkt -> KOSPI, marketType=kosdaqMkt -> KOSDAQ). Carries 회사명 + 종목코드.
 *   - Curated anchors: src/data/chart-ai/universalInstrumentMaster.anchors.json (verified; the
 *         authoritative KR ETF source and the enriched-alias source).
 *
 * Usage:
 *   node scripts/generate_chart_ai_instrument_master.mjs \
 *     --kr-kospi-source  <kospi.html>      \
 *     --kr-kosdaq-source <kosdaq.html>     \
 *     --us-nasdaq-source <nasdaqlisted.txt> \
 *     --us-other-source  <otherlisted.txt> \
 *     [--anchors  src/data/chart-ai/universalInstrumentMaster.anchors.json] \
 *     [--out       src/data/chart-ai/universalInstrumentMaster.json] \
 *     [--manifest  src/data/chart-ai/universalInstrumentMaster.manifest.json] \
 *     [--report    <rejection-report.json>] \
 *     [--source-date YYYY-MM-DD] [--retrieved YYYY-MM-DD] \
 *     [--validate]   # dry-run: parse + validate + report counts, write nothing
 *
 * Exit code is non-zero on any schema/mapping error, on a duplicate canonical identity, or when a
 * required category would be empty. Deterministic: same inputs -> byte-identical output.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

// ---- CLI parsing -----------------------------------------------------------

const argv = process.argv.slice(2);
const opts = {};
for (let i = 0; i < argv.length; i += 1) {
  const a = argv[i];
  if (a.startsWith('--')) {
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) {
      opts[key] = true;
    } else {
      opts[key] = next;
      i += 1;
    }
  }
}

const DEFAULTS = {
  anchors: 'src/data/chart-ai/universalInstrumentMaster.anchors.json',
  out: 'src/data/chart-ai/universalInstrumentMaster.json',
  manifest: 'src/data/chart-ai/universalInstrumentMaster.manifest.json',
};

const anchorsPath = opts.anchors || DEFAULTS.anchors;
const outPath = opts.out || DEFAULTS.out;
const manifestPath = opts.manifest || DEFAULTS.manifest;
const validateOnly = Boolean(opts.validate);
const sourceDate = typeof opts['source-date'] === 'string' ? opts['source-date'] : null;
const retrievedDate = typeof opts.retrieved === 'string' ? opts.retrieved : null;

// ---- helpers ---------------------------------------------------------------

const fail = (message) => {
  console.error(`ERROR: ${message}`);
  process.exit(1);
};

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

const collapse = (value) => String(value ?? '').normalize('NFKC').replace(/\s+/gu, ' ').trim();

/** US display name: drop the trailing " - <descriptor>" and a trailing security-class phrase. */
const cleanUsName = (raw) => {
  let name = collapse(raw).split(' - ')[0].trim();
  name = name.replace(/\s+(Common Stock|Ordinary Shares|Common Shares)$/i, '').trim();
  return name || collapse(raw);
};

// Reasons a row is rejected (counted, reported — never silently dropped).
const REJECT = {
  TEST_ISSUE: 'test-issue',
  BAD_SYMBOL: 'invalid-symbol-shape',
  UNSUPPORTED_EXCHANGE: 'unsupported-exchange',
  NON_COMMON_SECURITY: 'non-common-security-type',
  BLANK_FIELD: 'blank-required-field',
  DUP_IN_SOURCE: 'duplicate-within-source',
};

// A US stock (ETF flag N) whose official security name marks it as a non-common derivative/debt
// instrument is out of scope for chart loading. ETF classification itself never uses the name — it
// uses the source ETF column. This filter only trims clearly non-equity rows and is fully reported.
const US_NON_COMMON_NAME = /\b(warrant|warrants|right|rights|preferred|preference|when[- ]issued|debenture|subordinated notes|% notes|contingent value)\b/i;

const US_SYMBOL_OK = /^[A-Z]{1,5}$/; // pure-alpha 1..5 => confident KIS overseas addressing
const KR_SYMBOL_OK = /^\d{6}$/; // six-digit KRX code, leading zeros preserved as a string

const rejections = [];
const bump = (bucketMap, reason) => bucketMap.set(reason, (bucketMap.get(reason) || 0) + 1);

// ---- source parsers --------------------------------------------------------

/** Parse a NASDAQ Trader pipe-delimited symbol-directory file. Returns { header, rows }. */
const parseNasdaqTrader = (text) => {
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) return { header: [], rows: [] };
  const header = lines[0].split('|');
  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.startsWith('File Creation Time')) continue; // trailer
    const cells = line.split('|');
    if (cells.length !== header.length) continue;
    const row = {};
    header.forEach((h, idx) => {
      row[h.trim()] = (cells[idx] ?? '').trim();
    });
    rows.push(row);
  }
  return { header, rows };
};

/** Parse a KRX KIND corp-list HTML table (EUC-KR bytes) -> [{ name, code }]. */
const parseKrxCorpList = (buf) => {
  const html = new TextDecoder('euc-kr').decode(buf);
  const out = [];
  for (const chunk of html.split(/<\/tr>/i)) {
    const cells = [...chunk.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) =>
      m[1].replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim(),
    );
    if (cells.length < 3) continue;
    const name = cells[0];
    const code = cells[2];
    if (!name || !code) continue;
    out.push({ name, code });
  }
  return out;
};

// ---- builders --------------------------------------------------------------

const usExchangeFromOther = (code) => {
  switch (code) {
    case 'N': return { exchange: 'NYSE', exchangeCode: 'NYS' };
    case 'A': return { exchange: 'NYSE American', exchangeCode: 'AMS' };
    case 'P': return { exchange: 'NYSE Arca', exchangeCode: 'AMS' };
    default: return null; // Z (Cboe BZX), V (IEX), M etc. -> unsupported by the KIS overseas contract
  }
};

const buildUsRecord = ({ symbol, securityName, etfFlag, exchange, exchangeCode }, counter) => {
  const sym = collapse(symbol).toUpperCase();
  if (!US_SYMBOL_OK.test(sym)) { bump(counter, REJECT.BAD_SYMBOL); return null; }
  const assetType = etfFlag === 'Y' ? 'etf' : 'stock';
  if (assetType === 'stock' && US_NON_COMMON_NAME.test(securityName)) {
    bump(counter, REJECT.NON_COMMON_SECURITY);
    return null;
  }
  const name = cleanUsName(securityName);
  if (!name) { bump(counter, REJECT.BLANK_FIELD); return null; }
  return {
    symbol: sym,
    displayName: name,
    englishName: name,
    country: 'US',
    exchange,
    assetType,
    exchangeCode,
    aliases: [sym.toLowerCase()],
  };
};

const buildKrRecord = ({ name, code, exchange }, counter) => {
  const sym = collapse(code);
  if (!KR_SYMBOL_OK.test(sym)) { bump(counter, REJECT.BAD_SYMBOL); return null; }
  const displayName = collapse(name);
  if (!displayName) { bump(counter, REJECT.BLANK_FIELD); return null; }
  return {
    symbol: sym,
    displayName,
    country: 'KR',
    exchange,
    assetType: 'stock', // KRX corp-list enumerates listed companies (stocks); ETFs come from anchors
    exchangeCode: null,
    aliases: [sym],
  };
};

// ---- ingest ----------------------------------------------------------------

const provenance = [];
const readSource = (path, label) => {
  const buf = readFileSync(path);
  provenance.push({ label, file: path.split(/[\\/]/).pop(), bytes: buf.length, sha256: sha256(buf) });
  return buf;
};

const usCounter = new Map();
const krCounter = new Map();
const usRecords = [];
const krRecords = [];

// US: NASDAQ-listed -> all NAS
if (opts['us-nasdaq-source']) {
  const buf = readSource(opts['us-nasdaq-source'], 'us-nasdaq (nasdaqlisted.txt)');
  const { rows } = parseNasdaqTrader(buf.toString('utf8'));
  for (const r of rows) {
    if (r['Test Issue'] === 'Y') { bump(usCounter, REJECT.TEST_ISSUE); continue; }
    const rec = buildUsRecord(
      { symbol: r.Symbol, securityName: r['Security Name'], etfFlag: r.ETF, exchange: 'NASDAQ', exchangeCode: 'NAS' },
      usCounter,
    );
    if (rec) usRecords.push(rec);
  }
}

// US: other-listed -> NYSE / NYSE American / NYSE Arca (per Exchange column)
if (opts['us-other-source']) {
  const buf = readSource(opts['us-other-source'], 'us-other (otherlisted.txt)');
  const { rows } = parseNasdaqTrader(buf.toString('utf8'));
  for (const r of rows) {
    if (r['Test Issue'] === 'Y') { bump(usCounter, REJECT.TEST_ISSUE); continue; }
    const mapped = usExchangeFromOther(r.Exchange);
    if (!mapped) { bump(usCounter, REJECT.UNSUPPORTED_EXCHANGE); continue; }
    const rec = buildUsRecord(
      { symbol: r['ACT Symbol'], securityName: r['Security Name'], etfFlag: r.ETF, ...mapped },
      usCounter,
    );
    if (rec) usRecords.push(rec);
  }
}

// KR: KOSPI + KOSDAQ listed corporations
if (opts['kr-kospi-source']) {
  const buf = readSource(opts['kr-kospi-source'], 'kr-kospi (KRX KIND stockMkt)');
  for (const row of parseKrxCorpList(buf)) {
    const rec = buildKrRecord({ ...row, exchange: 'KOSPI' }, krCounter);
    if (rec) krRecords.push(rec);
  }
}
if (opts['kr-kosdaq-source']) {
  const buf = readSource(opts['kr-kosdaq-source'], 'kr-kosdaq (KRX KIND kosdaqMkt)');
  for (const row of parseKrxCorpList(buf)) {
    const rec = buildKrRecord({ ...row, exchange: 'KOSDAQ' }, krCounter);
    if (rec) krRecords.push(rec);
  }
}

// Curated anchors (verified) — authoritative for KR ETFs and enriched aliases/englishName.
let anchors = [];
try {
  const anchorsRaw = JSON.parse(readFileSync(anchorsPath, 'utf8'));
  anchors = Array.isArray(anchorsRaw?.instruments) ? anchorsRaw.instruments : [];
  provenance.push({ label: 'curated-anchors', file: anchorsPath.split(/[\\/]/).pop(), count: anchors.length });
} catch (e) {
  fail(`could not read anchors at ${anchorsPath}: ${e.message}`);
}

// ---- merge + dedupe --------------------------------------------------------

const canonical = (r) => `${r.country}|${r.symbol}|${r.exchange}|${r.assetType}`;
const countrySymbol = (r) => `${r.country}|${r.symbol}`;

// Anchors win over generated bulk rows (richer names/aliases, verified). Merge by country+symbol so a
// generated bare row is replaced by its verified anchor; anchors also contribute KR ETFs not present
// in the corp-list. Then enforce canonical-identity + country+symbol uniqueness.
const byCountrySymbol = new Map();
const addRecord = (rec, isAnchor) => {
  const key = countrySymbol(rec);
  const existing = byCountrySymbol.get(key);
  if (!existing) { byCountrySymbol.set(key, { rec, isAnchor }); return; }
  if (isAnchor && !existing.isAnchor) { byCountrySymbol.set(key, { rec, isAnchor }); return; }
  // otherwise keep the first (both bulk, or existing anchor): count as an in-source duplicate
  const counter = rec.country === 'US' ? usCounter : krCounter;
  bump(counter, REJECT.DUP_IN_SOURCE);
};

for (const r of [...usRecords, ...krRecords]) addRecord(r, false);
for (const a of anchors) {
  // normalize anchor shape to the generated shape (keep its aliases/englishName as-is)
  addRecord(
    {
      symbol: a.symbol,
      displayName: a.displayName,
      ...(a.englishName ? { englishName: a.englishName } : {}),
      country: a.country,
      exchange: a.exchange,
      assetType: a.assetType,
      exchangeCode: a.exchangeCode ?? null,
      aliases: Array.isArray(a.aliases) ? a.aliases : [],
    },
    true,
  );
}

const merged = [...byCountrySymbol.values()].map((v) => v.rec);

// ---- validation ------------------------------------------------------------

const canonicalSeen = new Set();
for (const r of merged) {
  if (!r.symbol || !r.displayName || !r.exchange || !r.assetType || !r.country) {
    fail(`record missing required field: ${JSON.stringify(r)}`);
  }
  if (r.country === 'KR') {
    if (!KR_SYMBOL_OK.test(r.symbol)) fail(`KR symbol not six-digit: ${r.symbol}`);
    if (r.exchangeCode !== null) fail(`KR ${r.symbol} must have null exchangeCode`);
  } else if (r.country === 'US') {
    if (!US_SYMBOL_OK.test(r.symbol)) fail(`US symbol invalid: ${r.symbol}`);
    if (!['NAS', 'NYS', 'AMS'].includes(r.exchangeCode)) fail(`US ${r.symbol} unsupported exchangeCode ${r.exchangeCode}`);
  } else {
    fail(`unknown country ${r.country} for ${r.symbol}`);
  }
  if (!['stock', 'etf'].includes(r.assetType)) fail(`bad assetType ${r.assetType} for ${r.symbol}`);
  const c = canonical(r);
  if (canonicalSeen.has(c)) fail(`duplicate canonical identity: ${c}`);
  canonicalSeen.add(c);
}

// ---- deterministic ordering ------------------------------------------------

const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
merged.sort((a, b) =>
  cmp(a.country, b.country) ||
  cmp(a.assetType, b.assetType) ||
  cmp(a.symbol, b.symbol) ||
  cmp(a.exchange, b.exchange));

// stable per-record field order + normalized aliases (unique, sorted, lowercased incl. symbol)
const finalInstruments = merged.map((r) => {
  const aliasSet = new Set([...(r.aliases || []), r.symbol].map((a) => collapse(a).toLowerCase()).filter(Boolean));
  return {
    symbol: r.symbol,
    displayName: r.displayName,
    ...(r.englishName ? { englishName: r.englishName } : {}),
    country: r.country,
    exchange: r.exchange,
    assetType: r.assetType,
    exchangeCode: r.exchangeCode ?? null,
    aliases: [...aliasSet].sort(),
  };
});

// ---- counts / categories ---------------------------------------------------

const catCount = (country, assetType) =>
  finalInstruments.filter((r) => r.country === country && r.assetType === assetType).length;

const counts = {
  total: finalInstruments.length,
  krStock: catCount('KR', 'stock'),
  krEtf: catCount('KR', 'etf'),
  usStock: catCount('US', 'stock'),
  usEtf: catCount('US', 'etf'),
  byExchange: finalInstruments.reduce((acc, r) => {
    acc[r.exchange] = (acc[r.exchange] || 0) + 1;
    return acc;
  }, {}),
};

const rejectionSummary = {
  us: Object.fromEntries(usCounter),
  kr: Object.fromEntries(krCounter),
};

// required-category guard
for (const [k, v] of Object.entries({ krStock: counts.krStock, krEtf: counts.krEtf, usStock: counts.usStock, usEtf: counts.usEtf })) {
  if (v <= 0) fail(`required category ${k} is empty — refusing to write an incomplete master`);
}

// ---- manifest --------------------------------------------------------------

const manifest = {
  note: 'Provenance manifest for universalInstrumentMaster.json. Generated by scripts/generate_chart_ai_instrument_master.mjs from official listing metadata + curated anchors. No credentials, no raw provider payloads, no fabricated rows.',
  generator: 'scripts/generate_chart_ai_instrument_master.mjs',
  masterVersion: `hf3b-${counts.total}`,
  sourceDate: sourceDate,
  retrievedDate: retrievedDate,
  sources: provenance,
  counts,
  rejections: rejectionSummary,
  exchangeMapping: {
    US: { 'NASDAQ (nasdaqlisted)': 'NAS', 'NYSE (N)': 'NYS', 'NYSE American (A)': 'AMS', 'NYSE Arca (P)': 'AMS', 'Cboe BZX (Z) / IEX (V) / other': 'REJECTED (unsupported by KIS overseas contract)' },
    KR: { KOSPI: 'kis-domestic (null EXCD)', KOSDAQ: 'kis-domestic (null EXCD)', 'KONEX / non-6-digit code': 'REJECTED' },
  },
  usSymbolRule: 'US symbol must match ^[A-Z]{1,5}$ (pure alpha) for confident KIS overseas addressing.',
  krSymbolRule: 'KR symbol must match ^\\d{6}$ (six-digit KRX code, leading zeros preserved).',
  assetTypeRule: 'US stock/ETF classification is taken verbatim from the official NASDAQ Trader ETF flag; KR ETFs come only from verified curated anchors (never inferred from a name substring).',
};

const master = {
  note: `Phase 3GG-T-HF3B generated universal instrument master. Real listed KR (six-digit KRX code, KOSPI/KOSDAQ) and US (pure-alpha ticker, NAS/NYS/AMS EXCD) stocks & ETFs from official listing metadata (NASDAQ Trader Symbol Directory; KRX KIND listed-corporation directory) plus curated verified anchors. exchangeCode is the KIS overseas EXCD for US, null for KR. Server-only reference metadata: no credentials, no account data, no raw provider payloads, no fabricated symbols. Regenerate with scripts/generate_chart_ai_instrument_master.mjs. masterVersion=${manifest.masterVersion}.`,
  masterVersion: manifest.masterVersion,
  sourceAsOf: sourceDate || retrievedDate || null,
  instruments: finalInstruments,
};

// ---- output ----------------------------------------------------------------

console.log('--- generation summary ---');
console.log('total          :', counts.total);
console.log('KR stock / etf :', counts.krStock, '/', counts.krEtf);
console.log('US stock / etf :', counts.usStock, '/', counts.usEtf);
console.log('by exchange    :', JSON.stringify(counts.byExchange));
console.log('rejections US  :', JSON.stringify(rejectionSummary.us));
console.log('rejections KR  :', JSON.stringify(rejectionSummary.kr));

if (opts.report) {
  writeFileSync(opts.report, JSON.stringify({ counts, rejections: rejectionSummary, sources: provenance }, null, 2) + '\n');
  console.log('report written :', opts.report);
}

if (validateOnly) {
  console.log('validate-only: no files written.');
  process.exit(0);
}

writeFileSync(outPath, JSON.stringify(master, null, 2) + '\n');
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log('master written :', outPath);
console.log('manifest       :', manifestPath);
