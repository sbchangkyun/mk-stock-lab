/**
 * Phase 3GG-T-HF3B-HF2-HF2A3 deterministic smoke — protected Preview API transport hotfix.
 *
 * Offline: proves the pure search resolves ALL instruments (not only 0000D0), and validates the response
 * classification decision table (deployment-protection vs app-auth vs no-results vs success) that mirrors
 * src/lib/chart-ai/chart-ai-authenticated-fetch.ts. No network, no browser, no Supabase, no credentials.
 * (The .ts transport helper's live behavior is asserted statically by the contract checker + verified on
 * the Preview; its classification logic is mirrored here to lock the decision table.)
 */

import master from '../src/data/chart-ai/universalInstrumentMaster.json' with { type: 'json' };
import { searchUniversalInstruments } from '../src/lib/server/chart-ai/universal-instrument-search.mjs';

let passed = 0;
let failed = 0;
const check = (name, cond) => { if (cond) passed += 1; else { failed += 1; console.error(`FAIL :: ${name}`); } };

const EXPECTED_VERSION = 'hf3b-hf2-kis-16018';
check('master version expected', master.masterVersion === EXPECTED_VERSION);

// ---- D. search regression matrix (ALL instruments must resolve) ----
const MATRIX = [
  { q: '005930', first: '005930', country: 'KR', type: 'stock' },
  { q: '삼성전자', first: '005930', country: 'KR', type: 'stock' },
  { q: '069500', first: '069500', country: 'KR', type: 'etf' },
  { q: '0000D0', first: '0000D0', country: 'KR', type: 'etf' },
  { q: '0000d0', first: '0000D0', country: 'KR', type: 'etf' }, // canonicalizes to uppercase
  { q: 'AAPL', first: 'AAPL', country: 'US', type: 'stock' },
  { q: 'IWM', first: 'IWM', country: 'US', type: 'etf' },
];
for (const m of MATRIX) {
  const r = searchUniversalInstruments({ query: m.q });
  check(`D search ${m.q}: first=${m.first} ${m.country}/${m.type}`,
    r.total >= 1 && r.results[0]?.symbol === m.first && r.results[0]?.country === m.country && r.results[0]?.assetType === m.type);
}
check('D lowercase 0000d0 canonical uppercase symbol', searchUniversalInstruments({ query: '0000d0' }).results[0]?.symbol === '0000D0');

// ---- C. response classification decision table (mirrors classifyChartAiResponse) ----
const classify = (response, data, parsedOk, origin = 'https://preview.example.app') => {
  let redirectedOffOrigin = false;
  try { redirectedOffOrigin = Boolean(response.redirected) && new URL(response.url).origin !== origin; } catch {}
  const contentType = response.headers.get('content-type') || '';
  const looksHtml = contentType.includes('text/html');
  if (redirectedOffOrigin || looksHtml || (!parsedOk && !contentType.includes('application/json'))) return 'PREVIEW_DEPLOYMENT_AUTH_REQUIRED';
  if (!parsedOk) return 'API_RESPONSE_INVALID';
  const code = data?.code ?? data?.sanitizedErrorCode;
  if (response.status === 401 || code === 'AUTH_REQUIRED') return 'APP_AUTH_REQUIRED';
  if (response.status === 403 || code === 'AUTH_INVALID') return 'APP_AUTH_INVALID';
  if (!response.ok || data?.ok !== true) return 'API_RESPONSE_INVALID';
  return 'SUCCESS';
};
const mockResp = ({ status = 200, ok = status >= 200 && status < 300, ct = 'application/json; charset=utf-8', redirected = false, url = 'https://preview.example.app/api/chart-ai/instruments/search.json' } = {}) =>
  ({ status, ok, redirected, url, headers: { get: (h) => (h.toLowerCase() === 'content-type' ? ct : null) } });

check('C JSON 200 ok -> SUCCESS', classify(mockResp({ status: 200 }), { ok: true, total: 1 }, true) === 'SUCCESS');
check('C JSON 401 -> APP_AUTH_REQUIRED', classify(mockResp({ status: 401 }), { ok: false, code: 'AUTH_REQUIRED' }, true) === 'APP_AUTH_REQUIRED');
check('C JSON 403 -> APP_AUTH_INVALID', classify(mockResp({ status: 403 }), { ok: false, code: 'AUTH_INVALID' }, true) === 'APP_AUTH_INVALID');
check('C HTML body -> PREVIEW_DEPLOYMENT_AUTH_REQUIRED', classify(mockResp({ status: 200, ct: 'text/html' }), null, false) === 'PREVIEW_DEPLOYMENT_AUTH_REQUIRED');
check('C off-origin redirect -> PREVIEW_DEPLOYMENT_AUTH_REQUIRED', classify(mockResp({ status: 200, redirected: true, url: 'https://vercel.com/sso-api?x=1' }), null, false) === 'PREVIEW_DEPLOYMENT_AUTH_REQUIRED');
check('C malformed JSON (json ct, unparsed) -> API_RESPONSE_INVALID', classify(mockResp({ status: 200, ct: 'application/json' }), null, false) === 'API_RESPONSE_INVALID');
check('C JSON 200 ok=false -> API_RESPONSE_INVALID', classify(mockResp({ status: 200 }), { ok: false }, true) === 'API_RESPONSE_INVALID');
// NO_RESULTS is derived by fetchChartAiJson from SUCCESS + total 0
const successZero = classify(mockResp({ status: 200 }), { ok: true, total: 0, items: [] }, true);
check('C JSON 200 zero results -> SUCCESS (caller derives NO_RESULTS)', successZero === 'SUCCESS');

// ---- E. runtime invariant: master unchanged shape (server-only) ----
check('E all four categories present', ['KR|stock', 'KR|etf', 'US|stock', 'US|etf'].every((k) => master.instruments.some((i) => `${i.country}|${i.assetType}` === k)));

console.log('');
console.log(`HF2A3-PREVIEW-TRANSPORT-HOTFIX-TESTS :: passed=${passed} failed=${failed} total=${passed + failed}`);
if (failed > 0) { console.error('SMOKE RESULT :: FAIL'); process.exit(1); }
console.log('SMOKE RESULT :: PASS');
