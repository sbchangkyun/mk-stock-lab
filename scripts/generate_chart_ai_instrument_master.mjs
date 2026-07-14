/**
 * Phase 3GG-T-HF3B-HF2 — KIS-only universal instrument master generator (offline, deterministic).
 *
 * Builds the server-only universal instrument master from OFFICIAL public KIS master files ONLY:
 *   KR: KOSPI + KOSDAQ domestic masters (kospi_code.mst / kosdaq_code.mst)
 *   US: overseas masters NASDAQ + NYSE + AMEX (nasmst.cod / nysmst.cod / amsmst.cod)
 * No KRX / data.go.kr / Nasdaq-Trader source. Security type comes ONLY from KIS field-based
 * classification (KR security-group code ST/EF; US security-type 2/3) — never product-name guessing.
 * KR ETFs include KIS EF records with alphanumeric six-character codes (KR symbol contract ^[0-9A-Z]{6}$).
 *
 * Sources are provided as LOCAL FILE PATHS (this script never downloads, never reads credentials, never
 * calls a provider/LLM/network). Raw source files are kept in scratch and must not be committed.
 *
 * Usage:
 *   node scripts/generate_chart_ai_instrument_master.mjs \
 *     --kospi-source <kospi_code.mst> --kosdaq-source <kosdaq_code.mst> \
 *     --nasdaq-source <nasmst.cod> --nyse-source <nysmst.cod> --amex-source <amsmst.cod> \
 *     [--anchors src/data/chart-ai/universalInstrumentMaster.anchors.json] \
 *     [--out src/data/chart-ai/universalInstrumentMaster.json] \
 *     [--manifest src/data/chart-ai/universalInstrumentMaster.manifest.json] \
 *     [--report <report.json>] [--source-date YYYY-MM-DD] [--retrieved YYYY-MM-DD] [--validate]
 *
 * Exit code is non-zero on any schema/mapping error, duplicate canonical identity, or an empty required
 * category. Deterministic: same inputs -> byte-identical output.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { buildKisActiveMaster, KR_SYMBOL_RE, US_SYMBOL_RE } from './lib/kisInstrumentMasterSource.mjs';

const argv = process.argv.slice(2);
const opts = {};
for (let i = 0; i < argv.length; i += 1) {
  const a = argv[i];
  if (a.startsWith('--')) { const k = a.slice(2); const n = argv[i + 1]; if (n === undefined || n.startsWith('--')) opts[k] = true; else { opts[k] = n; i += 1; } }
}
const fail = (m) => { console.error(`ERROR: ${m}`); process.exit(1); };
const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

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

const REQUIRED = {
  'kospi-source': 'KOSPI', 'kosdaq-source': 'KOSDAQ',
  'nasdaq-source': 'NASDAQ', 'nyse-source': 'NYSE', 'amex-source': 'AMEX',
};
for (const key of Object.keys(REQUIRED)) if (!opts[key] || opts[key] === true) fail(`missing --${key} <file>`);

const provenance = [];
const readSource = (path, family) => {
  const buf = readFileSync(path);
  provenance.push({ family, file: path.split(/[\\/]/).pop(), bytes: buf.length, sha256: sha256(buf) });
  return buf;
};

const kospiBuf = readSource(opts['kospi-source'], 'kis-kospi');
const kosdaqBuf = readSource(opts['kosdaq-source'], 'kis-kosdaq');
const nasBuf = readSource(opts['nasdaq-source'], 'kis-overseas-nasdaq');
const nysBuf = readSource(opts['nyse-source'], 'kis-overseas-nyse');
const amsBuf = readSource(opts['amex-source'], 'kis-overseas-amex');

let anchors = [];
try {
  const raw = JSON.parse(readFileSync(anchorsPath, 'utf8'));
  anchors = Array.isArray(raw?.instruments) ? raw.instruments : [];
  provenance.push({ family: 'curated-anchors', file: anchorsPath.split(/[\\/]/).pop(), count: anchors.length });
} catch (e) { fail(`could not read anchors at ${anchorsPath}: ${e.message}`); }

const { instruments, rejections, counts } = buildKisActiveMaster({
  domestic: [{ market: 'KOSPI', buf: kospiBuf }, { market: 'KOSDAQ', buf: kosdaqBuf }],
  overseas: [{ buf: nasBuf }, { buf: nysBuf }, { buf: amsBuf }],
  anchors,
});

// ---- validation ----
const canonicalSeen = new Set();
for (const r of instruments) {
  if (!r.symbol || !r.displayName || !r.exchange || !r.assetType || !r.country) fail(`record missing required field: ${JSON.stringify(r)}`);
  if (r.country === 'KR') {
    if (!KR_SYMBOL_RE.test(r.symbol)) fail(`KR symbol not six-char alphanumeric: ${r.symbol}`);
    if (r.exchangeCode !== null) fail(`KR ${r.symbol} must have null exchangeCode`);
    if (!['KOSPI', 'KOSDAQ'].includes(r.exchange)) fail(`KR ${r.symbol} unsupported exchange ${r.exchange}`);
  } else if (r.country === 'US') {
    if (!US_SYMBOL_RE.test(r.symbol)) fail(`US symbol invalid: ${r.symbol}`);
    if (!['NAS', 'NYS', 'AMS'].includes(r.exchangeCode)) fail(`US ${r.symbol} unsupported exchangeCode ${r.exchangeCode}`);
    if (!['NASDAQ', 'NYSE', 'AMEX'].includes(r.exchange)) fail(`US ${r.symbol} unsupported exchange ${r.exchange}`);
  } else fail(`unknown country ${r.country} for ${r.symbol}`);
  if (!['stock', 'etf'].includes(r.assetType)) fail(`bad assetType ${r.assetType} for ${r.symbol}`);
  const c = `${r.country}|${r.symbol}|${r.exchange}|${r.assetType}`;
  if (canonicalSeen.has(c)) fail(`duplicate canonical identity: ${c}`);
  canonicalSeen.add(c);
}

// required categories non-empty + verified ETF anchors present
for (const [k, v] of Object.entries({ krStock: counts.krStock, krEtf: counts.krEtf, usStock: counts.usStock, usEtf: counts.usEtf })) {
  if (v <= 0) fail(`required category ${k} is empty`);
}
const KR_ETF_ANCHORS = ['069500', '102110', '114800', '229200', '360750', '133690', '379800'];
const symbolSet = new Set(instruments.map((i) => i.symbol));
for (const a of KR_ETF_ANCHORS) if (!symbolSet.has(a)) fail(`verified KR ETF anchor missing: ${a}`);

// ---- manifest ----
const masterVersion = `hf3b-hf2-kis-${counts.total}`;
const manifest = {
  note: 'Provenance manifest for universalInstrumentMaster.json (Phase 3GG-T-HF3B-HF2). Generated by scripts/generate_chart_ai_instrument_master.mjs from OFFICIAL public KIS master files ONLY (KR KOSPI+KOSDAQ domestic; US NASDAQ+NYSE+AMEX overseas) + curated anchors. KIS-supported subset only (NOT a complete exchange-listed universe). Sole listing source family is the official KIS master files; no non-KIS external listing source, no credentials, no raw provider payloads, no fabricated rows.',
  generator: 'scripts/generate_chart_ai_instrument_master.mjs',
  masterVersion,
  scope: 'kis-supported-only',
  sourceFamily: 'kis-official-master-files',
  sourceDate,
  retrievedDate,
  sources: provenance,
  counts,
  rejections,
  classification: {
    KR: 'KIS domestic security-group code: ST=stock, EF=ETF; EN/RT/other excluded (field-based, never name-based).',
    US: 'KIS overseas security-type: 2=stock, 3=ETF (field-based); exchange NAS/NYS/AMS -> NASDAQ/NYSE/AMEX.',
  },
  krSymbolRule: '^[0-9A-Z]{6}$ (six-character KRX code; numeric or alphanumeric; ASCII-uppercased).',
  usSymbolRule: '^[A-Z][A-Z0-9.]{0,9}$ (KIS overseas ticker).',
};

const master = {
  note: `Phase 3GG-T-HF3B-HF2 KIS-only universal instrument master. KIS-SUPPORTED KR (KOSPI/KOSDAQ, six-character codes incl. alphanumeric) and US (NASDAQ/NYSE/AMEX, KIS overseas EXCD NAS/NYS/AMS) stocks & ETFs from official public KIS master files + curated anchors. KIS-supported subset only, NOT a complete exchange-listed universe. Security type is KIS field-based only (no name guessing). Server-only reference metadata: no credentials, no account data, no raw provider payloads. Regenerate with scripts/generate_chart_ai_instrument_master.mjs. masterVersion=${masterVersion}.`,
  masterVersion,
  scope: 'kis-supported-only',
  sourceAsOf: sourceDate || retrievedDate || null,
  instruments,
};

console.log('--- KIS-only generation summary ---');
console.log('total          :', counts.total);
console.log('KR stock / etf :', counts.krStock, '/', counts.krEtf, `(etf: ${counts.krEtfNumeric} numeric + ${counts.krEtfAlphanumeric} alphanumeric)`);
console.log('US stock / etf :', counts.usStock, '/', counts.usEtf);
console.log('by exchange    :', JSON.stringify(counts.byExchange));
console.log('rejections     :', JSON.stringify(rejections));

if (opts.report && opts.report !== true) writeFileSync(opts.report, JSON.stringify({ counts, rejections, sources: provenance }, null, 2) + '\n');

if (validateOnly) { console.log('validate-only: no files written.'); process.exit(0); }

writeFileSync(outPath, JSON.stringify(master, null, 2) + '\n');
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log('master written :', outPath);
console.log('manifest       :', manifestPath);
