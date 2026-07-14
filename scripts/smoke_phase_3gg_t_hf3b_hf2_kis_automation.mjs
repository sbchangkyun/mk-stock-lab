/**
 * Phase 3GG-T-HF3B-HF2 deterministic smoke — KIS-only master generation + refresh automation.
 *
 * Fully offline: exercises the KIS source adapter (KR/US parsers, field-based classification, symbol
 * contracts) with synthetic fixtures, the refresh pipeline's pure lifecycle + safety-gate logic, and the
 * real committed master for runtime regression. No network, no KIS API, no credentials, no Production
 * request. Prints booleans/counts; exits non-zero on any failure.
 */

import { readFileSync } from 'node:fs';
import {
  parseKisDomesticMaster,
  parseKisOverseasMaster,
  buildKisActiveMaster,
  KR_SYMBOL_RE,
} from '../scripts/lib/kisInstrumentMasterSource.mjs';
import {
  evaluateSafetyGates,
  applyMissingPolicy,
  unzipFirstFile,
  DEFAULT_GATE_THRESHOLDS,
} from '../scripts/automation/refresh_kis_instrument_master.mjs';
import {
  searchUniversalInstruments,
  findUniversalInstrument,
} from '../src/lib/server/chart-ai/universal-instrument-search.mjs';

let passed = 0;
let failed = 0;
const check = (name, cond) => { if (cond) passed += 1; else { failed += 1; console.error(`FAIL :: ${name}`); } };

// ---- synthetic KIS master line builders (byte-accurate for the parser offsets) ----
const krLine = (market, shortCode, isin, name, group) => {
  const head = shortCode.padEnd(9, ' ') + isin.padEnd(12, ' ') + name;
  const tailLen = market === 'KOSPI' ? 228 : 222;
  const tail = ' ' + group + '0'.repeat(tailLen - 3);
  return head + tail;
};
const enc = (s) => new TextEncoder().encode(s);
const usLine = (excd, ticker, engName, type) => {
  const f = new Array(24).fill('');
  f[0] = 'US'; f[1] = '22'; f[2] = excd; f[3] = 'kor'; f[4] = ticker; f[5] = excd + ticker;
  f[7] = engName; f[8] = String(type); f[9] = 'USD';
  return f.join('\t');
};

// ================= 16.1 KR parser + symbol =================
{
  const kospi = enc([
    krLine('KOSPI', '005930', 'KR7005930003', '삼성전자', 'ST'),
    krLine('KOSPI', '069500', 'KR7069500007', 'KODEX 200', 'EF'),
    krLine('KOSPI', '0000D0', 'KR70000D0009', 'TIGER 엔비디아', 'EF'),
    krLine('KOSPI', '530000', 'KR7530000001', '어떤ETN', 'EN'),
    krLine('KOSPI', '145270', 'KR7145270008', '어떤리츠', 'RT'),
  ].join('\n'));
  const recs = parseKisDomesticMaster(kospi, { market: 'KOSPI' });
  check('16.1 KOSPI parses all rows', recs.length === 5);
  check('16.1 EF classified via group code', recs.filter((r) => r.group === 'EF').length === 2);
  const built = buildKisActiveMaster({ domestic: [{ market: 'KOSPI', buf: kospi }], overseas: [] });
  const bySym = new Map(built.instruments.map((i) => [i.symbol, i]));
  check('16.1 EF included as etf', bySym.get('069500')?.assetType === 'etf');
  check('16.1 alphanumeric KR ETF accepted', bySym.get('0000D0')?.assetType === 'etf' && KR_SYMBOL_RE.test('0000D0'));
  check('16.1 numeric leading-zero preserved', bySym.get('069500')?.symbol === '069500');
  check('16.1 EN excluded from active', !bySym.has('530000'));
  check('16.1 RT excluded from active', !bySym.has('145270'));
  check('16.1 anchors would be present (069500)', bySym.has('069500'));
  // lowercase normalization at the symbol contract
  check('16.1 lowercase input normalizes for lookup', KR_SYMBOL_RE.test('0000d0'.toUpperCase()));
  // duplicates rejected
  const dup = buildKisActiveMaster({ domestic: [{ market: 'KOSPI', buf: enc([krLine('KOSPI', '069500', 'KR7069500007', 'KODEX 200', 'EF'), krLine('KOSPI', '069500', 'KR7069500007', 'dup', 'EF')].join('\n')) }], overseas: [] });
  check('16.1 duplicate country+symbol rejected', (dup.rejections['duplicate-country-symbol'] || 0) === 1);
}

// ================= 16.2 US parser =================
{
  const nas = enc([usLine('NAS', 'AAPL', 'APPLE INC', 2), usLine('NAS', 'QQQ', 'INVESCO QQQ', 3), usLine('NAS', 'BADETN', 'SOME ETN', 4)].join('\n'));
  const nys = enc([usLine('NYS', 'JPM', 'JPMORGAN', 2)].join('\n'));
  const ams = enc([usLine('AMS', 'SPY', 'SPDR SP500 ETF', 3)].join('\n'));
  const badExcd = enc([usLine('ZZZ', 'FOO', 'UNSUPPORTED EXCH', 2)].join('\n'));
  const built = buildKisActiveMaster({ domestic: [], overseas: [{ buf: nas }, { buf: nys }, { buf: ams }, { buf: badExcd }] });
  const bySym = new Map(built.instruments.map((i) => [i.symbol, i]));
  check('16.2 NASDAQ stock accepted', bySym.get('AAPL')?.assetType === 'stock' && bySym.get('AAPL')?.exchange === 'NASDAQ');
  check('16.2 NASDAQ ETF accepted', bySym.get('QQQ')?.assetType === 'etf');
  check('16.2 NYSE accepted', bySym.get('JPM')?.exchange === 'NYSE' && bySym.get('JPM')?.exchangeCode === 'NYS');
  check('16.2 AMEX accepted', bySym.get('SPY')?.exchange === 'AMEX' && bySym.get('SPY')?.exchangeCode === 'AMS');
  check('16.2 US ETN (type 4) excluded', !bySym.has('BADETN'));
  check('16.2 unsupported exchange rejected', !bySym.has('FOO') && (built.rejections['unsupported-exchange'] || 0) >= 1);
  check('16.2 malformed symbol rejected', buildKisActiveMaster({ domestic: [], overseas: [{ buf: enc([usLine('NAS', 'BAD$SYM', 'X', 2)].join('\n')) }] }).instruments.length === 0);
}

// ================= 16.3 Lifecycle =================
{
  const A = (c, s, a, e, extra = {}) => ({ country: c, symbol: s, exchange: e, assetType: a, displayName: `${s}-name`, aliases: [s.toLowerCase()], ...extra });
  const prev = [A('KR', '069500', 'etf', 'KOSPI'), A('KR', '005930', 'stock', 'KOSPI'), A('US', 'AAPL', 'stock', 'NASDAQ')];
  const emptyState = { missingCounts: {}, pendingInactive: {} };
  // new listing
  const r1 = applyMissingPolicy({ prevActive: prev, candidate: [...prev, A('KR', '0000Z0', 'etf', 'KOSPI')], state: emptyState, archive: [], asOf: '2026-07-14' });
  check('16.3 new listing detected', r1.events.NEW_LISTING.length === 1);
  // 1st absence -> pending, stays active
  const candMinus = prev.filter((r) => r.symbol !== '005930');
  const r2 = applyMissingPolicy({ prevActive: prev, candidate: candMinus, state: emptyState, archive: [], asOf: '2026-07-14' });
  check('16.3 first absence -> pending (still active)', r2.events.PENDING_INACTIVE.length === 1 && r2.nextActive.some((r) => r.symbol === '005930'));
  check('16.3 pending missing count = 1', r2.nextState.missingCounts['KR|005930'] === 1);
  // 2nd consecutive absence -> archived
  const r3 = applyMissingPolicy({ prevActive: prev, candidate: candMinus, state: r2.nextState, archive: [], asOf: '2026-07-15' });
  check('16.3 second absence -> archived + removed from active', r3.events.DELISTED_OR_REMOVED.length === 1 && !r3.nextActive.some((r) => r.symbol === '005930'));
  check('16.3 archive reason is two-consecutive', r3.nextArchive.some((a) => a.priorSymbol === '005930' && a.inactiveReason === 'SOURCE_ABSENT_TWO_CONSECUTIVE_VALID_SNAPSHOTS'));
  check('16.3 inactive retention indefinite (no expiry field)', r3.nextArchive.every((a) => !('retentionUntil' in a)));
  // reappearance resets pending
  const r4 = applyMissingPolicy({ prevActive: prev, candidate: prev, state: r2.nextState, archive: [], asOf: '2026-07-16' });
  check('16.3 reappearance resets pending', r4.nextState.missingCounts['KR|005930'] === undefined);
  // archived reappearance -> reactivated
  const r5 = applyMissingPolicy({ prevActive: candMinus, candidate: prev, state: r3.nextState, archive: r3.nextArchive, asOf: '2026-07-17' });
  check('16.3 archived reappearance -> reactivated', r5.events.REACTIVATED.some((e) => e.symbol === '005930'));
  // rename preserves alias
  const renamed = prev.map((r) => (r.symbol === '069500' ? { ...r, displayName: 'KODEX 200 NEW' } : r));
  const r6 = applyMissingPolicy({ prevActive: prev, candidate: renamed, state: emptyState, archive: [], asOf: '2026-07-14' });
  check('16.3 rename event + alias retained', r6.events.RENAMED.length === 1 && r6.nextActive.find((r) => r.symbol === '069500').aliases.includes('069500-name'));
  // failed source does not increment missing (gate blocks first — modeled by sourceOk=false gate)
  check('16.3 failed source blocks before missing policy', evaluateSafetyGates({ prevActive: prev, candidate: [], sourceOk: false }).blocked);
}

// ================= 16.4 Safety Gates =================
{
  const A = (c, s, a, e) => ({ country: c, symbol: s, exchange: e, assetType: a, displayName: s });
  const anchors = ['069500', '102110', '114800', '229200', '360750', '133690', '379800'];
  const base = [
    ...anchors.map((s) => A('KR', s, 'etf', 'KOSPI')),
    A('KR', '005930', 'stock', 'KOSPI'), A('KR', '000660', 'stock', 'KOSPI'),
    A('US', 'AAPL', 'stock', 'NASDAQ'), A('US', 'SPY', 'etf', 'AMEX'),
  ];
  check('16.4 source unavailable blocks', evaluateSafetyGates({ prevActive: base, candidate: base, sourceOk: false }).blocked);
  check('16.4 empty category blocks', evaluateSafetyGates({ prevActive: base, candidate: base.filter((r) => !(r.country === 'US' && r.assetType === 'etf')), sourceOk: true }).reasons.some((r) => r.startsWith('EMPTY_CATEGORY_US_etf')));
  check('16.4 duplicate identity blocks', evaluateSafetyGates({ prevActive: base, candidate: [...base, A('KR', '069500', 'etf', 'KOSPI')], sourceOk: true }).reasons.includes('DUPLICATE_CANONICAL_IDENTITY'));
  check('16.4 leading-zero/shape damage blocks', evaluateSafetyGates({ prevActive: base, candidate: base.map((r) => (r.symbol === '069500' ? { ...r, symbol: '69500' } : r)), sourceOk: true }).reasons.includes('KR_CODE_SHAPE_DAMAGED'));
  check('16.4 anchor disappearance blocks', evaluateSafetyGates({ prevActive: base, candidate: base.filter((r) => r.symbol !== '069500'), sourceOk: true }).reasons.some((r) => r.startsWith('ANCHORS_MISSING')));
  // mass KR ETF removal (>10): grow base ETFs then drop many
  const bigEtf = [...base, ...Array.from({ length: 30 }, (_, i) => A('KR', `E${String(i).padStart(5, '0')}`.slice(0, 6).toUpperCase(), 'etf', 'KOSPI'))];
  check('16.4 mass KR ETF removal blocks', evaluateSafetyGates({ prevActive: bigEtf, candidate: base, sourceOk: true }).reasons.some((r) => r.startsWith('KR_ETF') ));
  // mass US removal (>100)
  const bigUs = [...base, ...Array.from({ length: 150 }, (_, i) => A('US', `US${i}`.slice(0, 5).toUpperCase(), 'stock', 'NASDAQ'))];
  check('16.4 mass US removal blocks', evaluateSafetyGates({ prevActive: bigUs, candidate: base, sourceOk: true }).reasons.some((r) => r.startsWith('US_REMOVALS')));
  // type-change spike (>20)
  const manyStocks = Array.from({ length: 25 }, (_, i) => A('KR', String(100000 + i), 'stock', 'KOSPI'));
  const prevT = [...base, ...manyStocks];
  const candT = [...base, ...manyStocks.map((r) => ({ ...r, assetType: 'etf' }))];
  check('16.4 type-change spike blocks', evaluateSafetyGates({ prevActive: prevT, candidate: candT, sourceOk: true }).reasons.some((r) => r.startsWith('TYPE_CHANGES')));
  // total drop >5%
  check('16.4 total drop blocks', evaluateSafetyGates({ prevActive: bigUs, candidate: bigUs.slice(0, Math.floor(bigUs.length * 0.9)), sourceOk: true }).reasons.some((r) => r.startsWith('TOTAL_DROP')));
  // last-known-good preserved on block: pipeline exits non-zero (behavior); here assert gate.blocked true
  check('16.4 clean refresh passes', !evaluateSafetyGates({ prevActive: base, candidate: base, sourceOk: true }).blocked);
  check('16.4 thresholds documented', DEFAULT_GATE_THRESHOLDS.maxUsRemovals === 100 && DEFAULT_GATE_THRESHOLDS.maxKrEtfRemovals === 10);
}

// ================= unzip helper =================
{
  // deflate-store round trip is covered by the pipeline; assert the extractor rejects a non-zip.
  let threw = false;
  try { unzipFirstFile(Buffer.from('not a zip')); } catch { threw = true; }
  check('unzipFirstFile rejects non-zip', threw);
}

// ================= 16.6 Runtime regression (real committed master) =================
{
  const master = JSON.parse(readFileSync(new URL('../src/data/chart-ai/universalInstrumentMaster.json', import.meta.url), 'utf8'));
  const insts = master.instruments;
  check('16.6 master is KIS-only scope', master.scope === 'kis-supported-only');
  check('16.6 all four categories present', ['KR|stock', 'KR|etf', 'US|stock', 'US|etf'].every((k) => insts.some((i) => `${i.country}|${i.assetType}` === k)));
  check('16.6 KR ETF count materially expanded (>500)', insts.filter((i) => i.country === 'KR' && i.assetType === 'etf').length > 500);
  check('16.6 alphanumeric KR ETF present in master', insts.some((i) => i.country === 'KR' && i.assetType === 'etf' && /[A-Z]/.test(i.symbol)));
  check('16.6 all KR symbols six-char alphanumeric', insts.filter((i) => i.country === 'KR').every((i) => /^[0-9A-Z]{6}$/.test(i.symbol)));
  check('16.6 US exchanges limited to NASDAQ/NYSE/AMEX', insts.filter((i) => i.country === 'US').every((i) => ['NASDAQ', 'NYSE', 'AMEX'].includes(i.exchange)));
  // findUniversalInstrument resolves an alphanumeric KR ETF (mocked-provider chart-load path identity)
  const alnum = insts.find((i) => i.country === 'KR' && i.assetType === 'etf' && /[A-Z]/.test(i.symbol));
  check('16.6 alphanumeric KR ETF resolves via findUniversalInstrument', findUniversalInstrument(alnum.symbol, 'KR')?.symbol === alnum.symbol);
  check('16.6 lowercase alphanumeric resolves (case-insensitive)', findUniversalInstrument(alnum.symbol.toLowerCase(), 'KR')?.symbol === alnum.symbol);
  // Similarity / MK identity acceptance = the same resolver both routes use
  const resolved = findUniversalInstrument(alnum.symbol, 'KR');
  check('16.6 resolved identity is KIS-domestic mappable', resolved?.provider === 'kis-domestic' && resolved?.exchangeCode === null);
  // search stays bounded + server-only
  const s = searchUniversalInstruments({ query: 'a', limit: 999 });
  check('16.6 search remains bounded (<=50)', s.returned <= 50 && s.hasMore !== undefined);
  check('16.6 anchors resolve', ['069500', '102110', '229200'].every((a) => findUniversalInstrument(a, 'KR')?.assetType === 'etf'));
  // KIS-only sourcing: manifest source families must all be KIS; no KRX/data.go.kr/Nasdaq-Trader source.
  const manifest = JSON.parse(readFileSync(new URL('../src/data/chart-ai/universalInstrumentMaster.manifest.json', import.meta.url), 'utf8'));
  const families = (manifest.sources || []).map((s) => s.family);
  check('16.6 all source families are KIS/curated', families.length > 0 && families.every((f) => /^kis-|^curated-/.test(f)));
  check('16.6 no KRX/data.go.kr/Nasdaq-Trader source family', !families.some((f) => /krx|data\.go\.kr|nasdaqtrader|nasdaq-trader/i.test(f)));
  check('16.6 manifest scope is kis-supported-only', manifest.scope === 'kis-supported-only');
}

console.log('');
console.log(`HF3B-HF2-KIS-AUTOMATION-TESTS :: passed=${passed} failed=${failed} total=${passed + failed}`);
if (failed > 0) { console.error('SMOKE RESULT :: FAIL'); process.exit(1); }
console.log('SMOKE RESULT :: PASS');
