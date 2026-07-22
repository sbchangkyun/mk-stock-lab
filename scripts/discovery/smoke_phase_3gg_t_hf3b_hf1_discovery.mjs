/**
 * Phase 3GG-T-HF3B-HF1 discovery smoke (offline, deterministic, no external file required).
 *
 * Exercises the discovery tooling's pure logic with synthetic fixtures so CI can validate it without
 * the scratch-only official master files: the KIS master line parser, the KRX CSV parser, the
 * KRX↔KIS comparator, and the refresh simulator's diff + blocking rules. No network, no credentials,
 * no Production file access.
 */

import { parseKisKospiMaster } from './parse_kis_kospi_master.mjs';
import { parseKrxEtfCsv } from './parse_krx_etf_master.mjs';
import { compareEtfSets } from './compare_krx_etf_to_kis_master.mjs';
import { diffMasters, evaluateBlockingRules, simulateRefresh, DEFAULT_THRESHOLDS } from './simulate_instrument_master_refresh.mjs';

let passed = 0;
let failed = 0;
const check = (name, cond) => { if (cond) passed += 1; else { failed += 1; console.error(`FAIL :: ${name}`); } };

// --- Synthetic KIS master line builder (228-char ASCII tail; group code at [len-227,len-225)) ---
const kisLine = (shortCode, isin, name, group) => {
  const head = shortCode.padEnd(9, ' ') + isin.padEnd(12, ' ') + name;
  // tail: 1 pad char + 2 group + fill to 228 total ASCII tail chars (matches empirical len-227 offset)
  const tail = ' ' + group + '0'.repeat(225);
  return head + tail;
};
const enc = (s) => new TextEncoder().encode(s); // ASCII synthetic (parser decodes euc-kr; ASCII is a subset)

// 1. KIS parser: group code + 6-digit derivation from ISIN + alphanumeric code
{
  const buf = enc([
    kisLine('005930', 'KR7005930003', '삼성전자', 'ST'),
    kisLine('069500', 'KR7069500007', 'KODEX 200', 'EF'),
    kisLine('0000D0', 'KR70000D0009', 'TIGER 엔비디아', 'EF'),
    kisLine('530000', 'KR7530000001', '어떤ETN', 'EN'),
  ].join('\n'));
  const recs = parseKisKospiMaster(buf);
  check('KIS parser reads all rows', recs.length === 4);
  check('KIS group codes correct', recs.filter((r) => r.group === 'EF').length === 2 && recs.find((r) => r.shortCode === '005930').group === 'ST');
  check('KIS derives 6-digit ticker from ISIN', recs.find((r) => r.shortCode === '069500').krxCode === '069500');
  check('KIS preserves alphanumeric code', recs.find((r) => r.shortCode === '0000D0').krxCode === '0000D0');
  check('KIS excludes ETN from EF', recs.filter((r) => r.group === 'EF').every((r) => r.krxCode !== '530000'));
}

// 2. KRX CSV parser
{
  const csv = ['종목코드,종목명', '069500,KODEX 200', '0000D0,TIGER 엔비디아', '069500,dup', ',bad'].join('\n');
  const r = parseKrxEtfCsv(csv);
  check('KRX parser dedupes', r.count === 2 && r.duplicates === 1);
  check('KRX parser keeps alphanumeric code', r.records.some((x) => x.code === '0000D0'));
}

// 3. Comparator: mapped / unmapped / mapping %
{
  const krx = [{ code: '069500', name: 'KODEX 200' }, { code: '0000D0', name: 'TIGER 엔비디아' }, { code: '999999', name: '미상장' }];
  const kisEf = [{ krxCode: '069500', nameKo: 'KODEX 200' }, { krxCode: '0000D0', nameKo: 'TIGER 엔비디아' }];
  const rep = compareEtfSets(krx, kisEf);
  check('comparator mapped count', rep.mappedCount === 2);
  check('comparator unmapped identifies non-KIS code', rep.unmappedCount === 1 && rep.unmapped[0].code === '999999');
  check('comparator mapping pct', rep.mappingPct === Number(((2 / 3) * 100).toFixed(2)));
}

// 4. Refresh simulator diff + blocking
{
  const A = (c, s, a, e) => ({ country: c, symbol: s, exchange: e, assetType: a, name: s });
  const base = [A('KR', '069500', 'etf', 'KOSPI'), A('KR', '005930', 'stock', 'KOSPI'), A('KR', '000660', 'stock', 'KOSPI'),
    A('US', 'AAPL', 'stock', 'NASDAQ'), A('US', 'SPY', 'etf', 'NYSE Arca'),
    ...DEFAULT_THRESHOLDS.requireAnchors.filter((s) => s !== '069500').map((s) => A('KR', s, 'etf', 'KOSPI'))];
  check('simulator detects new listing', diffMasters(base, [...base, A('KR', '0000Z0', 'etf', 'KOSPI')]).NEW_LISTING.length === 1);
  check('simulator blocks anchor loss', evaluateBlockingRules(base, base.filter((r) => r.symbol !== '069500'), {}).blocked);
  check('simulator accepts safe add', simulateRefresh(base, [...base, A('KR', '0000Z0', 'etf', 'KOSPI')]).outcome === 'ACCEPTED');
  check('simulator blocks stale source', evaluateBlockingRules(base, base, { sourceStale: true }).blocked);
}

console.log(`\nHF3B-HF1-DISCOVERY-SMOKE :: passed=${passed} failed=${failed} total=${passed + failed}`);
if (failed > 0) { console.error('SMOKE RESULT :: FAIL'); process.exit(1); }
console.log('SMOKE RESULT :: PASS');
