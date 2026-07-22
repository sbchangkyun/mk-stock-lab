/**
 * Phase 3GG-T-HF3B-HF2-HF2A2 deterministic smoke — Preview alphanumeric-search Hotfix.
 *
 * Offline: proves the committed master + pure search resolve the KIS-supported alphanumeric KR ETF
 * 0000D0 (the symbol that "could not be searched" on the SSO Preview), plus the client query
 * canonicalization contract. No network, no browser, no KIS, no credentials.
 */

import master from '../src/data/chart-ai/universalInstrumentMaster.json' with { type: 'json' };
import {
  searchUniversalInstruments,
  findUniversalInstrument,
  getUniversalMasterVersion,
} from '../src/lib/server/chart-ai/universal-instrument-search.mjs';

let passed = 0;
let failed = 0;
const check = (name, cond) => { if (cond) passed += 1; else { failed += 1; console.error(`FAIL :: ${name}`); } };

const EXPECTED_VERSION = 'hf3b-hf2-kis-16018';

// ---- A. master record ----
check('A masterVersion is expected', master.masterVersion === EXPECTED_VERSION && getUniversalMasterVersion() === EXPECTED_VERSION);
const recs = master.instruments.filter((i) => i.symbol === '0000D0');
check('A 0000D0 exists exactly once', recs.length === 1);
check('A 0000D0 is KR/KOSPI/etf/active', recs[0] && recs[0].country === 'KR' && recs[0].exchange === 'KOSPI' && recs[0].assetType === 'etf' && recs[0].active === true);
check('A 0000D0 standardCode present', recs[0] && recs[0].standardCode === 'KR70000D0009');

// ---- A/B. pure search ----
const first = (opts) => searchUniversalInstruments({ query: '0000D0', ...opts });
for (const [label, opts] of [['plain', {}], ['KR', { country: 'KR' }], ['etf', { assetType: 'etf' }], ['KR+etf', { country: 'KR', assetType: 'etf' }]]) {
  const r = first(opts);
  check(`B 0000D0 ${label}: exact-first + KR ETF`, r.total >= 1 && r.results[0]?.symbol === '0000D0' && r.results[0]?.country === 'KR' && r.results[0]?.assetType === 'etf');
}
const lower = searchUniversalInstruments({ query: '0000d0' });
check('B lowercase 0000d0 resolves to uppercase 0000D0', lower.results[0]?.symbol === '0000D0');
check('B canonical symbol stays uppercase', lower.results[0]?.symbol === '0000D0' && !/[a-z]/.test(lower.results[0].symbol));

// ---- C. exact resolver ----
check('C find 0000D0 == find 0000d0 (same record)', findUniversalInstrument('0000D0', 'KR')?.symbol === '0000D0' && findUniversalInstrument('0000d0', 'KR')?.symbol === '0000D0');
check('C resolved 0000D0 is kis-domestic mappable', findUniversalInstrument('0000d0', 'KR')?.provider === 'kis-domestic' && findUniversalInstrument('0000d0', 'KR')?.exchangeCode === null);

// ---- D. route-shaped result (client-safe fields) ----
const routeItem = first({ country: 'KR', assetType: 'etf' }).results[0];
check('D route item exposes client-safe KR ETF fields', routeItem && routeItem.currency === 'KRW' && routeItem.market === '국내' && routeItem.assetType === 'etf');

// ---- Client query-normalization contract (mirrors chart-ai normalizeQueryText) ----
const normalizeQueryText = (raw) => {
  const t = String(raw ?? '').normalize('NFKC').trim();
  return /^[0-9A-Za-z]{6}$/.test(t) ? t.toUpperCase() : t;
};
check('norm: lowercase 6-char code -> uppercase', normalizeQueryText('0000d0') === '0000D0');
check('norm: numeric leading zeros preserved', normalizeQueryText('069500') === '069500');
check('norm: uppercase code unchanged', normalizeQueryText('0000D0') === '0000D0');
check('norm: Korean name unchanged', normalizeQueryText('삼성전자') === '삼성전자');
check('norm: English name unchanged', normalizeQueryText('apple') === 'apple');
check('norm: 5-char ticker not force-uppercased-as-code (still upper-safe)', normalizeQueryText('AAPL') === 'AAPL');

console.log('');
console.log(`HF2A2-PREVIEW-SEARCH-HOTFIX-TESTS :: passed=${passed} failed=${failed} total=${passed + failed}`);
if (failed > 0) { console.error('SMOKE RESULT :: FAIL'); process.exit(1); }
console.log('SMOKE RESULT :: PASS');
