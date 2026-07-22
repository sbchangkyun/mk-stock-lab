/**
 * Phase 3GG-T-HF3A deterministic smoke — exercises the pure selected-symbol / active-chart integrity
 * state machine that guarantees analyses run only against an explicitly loaded chart. Fully offline: no
 * DOM, no network, no login, no KIS/Supabase/Production request. The Samsung/AAPL objects are clearly
 * labeled TEST fixtures (not live defaults).
 */

import {
  createSelectedSymbolIntegrityState,
  instrumentIdentityKey,
  instrumentSymbolKey,
  ANALYSIS_KINDS,
} from '../src/lib/chart-ai/selected-symbol-integrity.mjs';

let passed = 0;
let failed = 0;
const check = (name, cond) => {
  if (cond) passed += 1;
  else failed += 1;
  console.log(`${cond ? 'PASS' : 'FAIL'} :: ${name}`);
};

// ---- TEST fixtures (not production defaults) ----
const SAMSUNG = { country: 'KR', symbol: '005930', exchange: 'KOSPI', instrumentType: 'stock', name: '삼성전자', currency: 'KRW' };
const AAPL = { country: 'US', symbol: 'AAPL', exchange: 'NASDAQ', instrumentType: 'stock', name: 'Apple', currency: 'USD' };
const keyOf = (i) => `${i.country.toLowerCase()}|${i.symbol.toLowerCase()}`;
const okChart = (i, candleCount = 120) => ({ ok: true, candleCount, responseSymbolKey: keyOf(i) });

const promote = (s, inst, candleCount = 120) => {
  s.selectPending(inst);
  const t = s.beginChartLoad();
  return s.resolveChartLoad(t, okChart(inst, candleCount));
};

// ---- 17.1 INITIAL STATE ----
{
  const s = createSelectedSymbolIntegrityState();
  s.markWorkspaceReady();
  const snap = s.getSnapshot();
  check('17.1 no pending instrument initially', snap.hasPending === false);
  check('17.1 no active chart instrument initially', snap.hasActive === false);
  check('17.1 no active candles initially', snap.activeChartCandleCount === 0);
  check('17.1 analyses disabled initially', s.canRunAnalysis() === false && s.getActiveContext() === null);
  check('17.1 no analysis can begin initially', ANALYSIS_KINDS.every((k) => s.beginAnalysis(k) === null));
  check('17.1 no chart load can begin without a pending selection', s.beginChartLoad() === null);
  check('17.1 no hidden Samsung default in identity', instrumentIdentityKey(null) === '' && s.getActiveContext() === null);
}

// ---- 17.2 PENDING SELECTION ----
{
  const s = createSelectedSymbolIntegrityState();
  s.markWorkspaceReady();
  s.selectPending(SAMSUNG);
  const snap = s.getSnapshot();
  check('17.2 pending becomes Samsung', snap.hasPending === true && snap.pendingIdentity === instrumentIdentityKey(SAMSUNG));
  check('17.2 active remains null after selection', snap.hasActive === false);
  check('17.2 analyses remain disabled while only pending', s.canRunAnalysis() === false);
  check('17.2 no analysis request until chart loaded', ANALYSIS_KINDS.every((k) => s.beginAnalysis(k) === null));
  check('17.2 selection alone made no chart request (a load must be explicitly begun)', s.getSnapshot().chartLoadStatus === 'pending');
}

// ---- 17.3 SUCCESSFUL CHART PROMOTION ----
{
  const s = createSelectedSymbolIntegrityState();
  s.markWorkspaceReady();
  const outcome = promote(s, SAMSUNG, 200);
  check('17.3 chart load accepted on success', outcome === 'accepted');
  check('17.3 active becomes Samsung only after success', s.getActiveContext() && s.getActiveContext().symbol === '005930');
  check('17.3 non-empty candles stored', s.getSnapshot().activeChartCandleCount === 200);
  check('17.3 analyses enabled after success', s.canRunAnalysis() === true);
  const tok = s.beginAnalysis('similar-pattern');
  check('17.3 analysis uses the active Samsung context', tok && tok.instrument.symbol === '005930' && tok.instrument.country === 'KR');
}

// ---- 17.4 SELECTION CHANGE ----
{
  const s = createSelectedSymbolIntegrityState();
  s.markWorkspaceReady();
  promote(s, SAMSUNG);
  check('17.4 precondition: Samsung active', s.canRunAnalysis() === true);
  s.selectPending(AAPL);
  const snap = s.getSnapshot();
  check('17.4 active Samsung cleared immediately', snap.hasActive === false && s.getActiveContext() === null);
  check('17.4 analyses disabled after change', s.canRunAnalysis() === false);
  check('17.4 pending becomes AAPL', snap.pendingIdentity === instrumentIdentityKey(AAPL));
  check('17.4 no AAPL analysis before AAPL chart success', ANALYSIS_KINDS.every((k) => s.beginAnalysis(k) === null));
}

// ---- 17.5 CHART FAILURE ----
{
  const s = createSelectedSymbolIntegrityState();
  s.markWorkspaceReady();
  s.selectPending(AAPL);
  const t1 = s.beginChartLoad();
  const r1 = s.resolveChartLoad(t1, { ok: false, candleCount: 0 });
  check('17.5 error response rejected', r1 === 'rejected');
  check('17.5 active remains null after error', s.getActiveContext() === null && s.canRunAnalysis() === false);
  s.selectPending(AAPL);
  const t2 = s.beginChartLoad();
  const r2 = s.resolveChartLoad(t2, { ok: true, candleCount: 0 });
  check('17.5 empty candles rejected', r2 === 'rejected' && s.canRunAnalysis() === false);
  check('17.5 no fallback to Samsung on failure', s.getActiveContext() === null);
}

// ---- 17.6 STALE CHART RESPONSE ----
{
  const s = createSelectedSymbolIntegrityState();
  s.markWorkspaceReady();
  s.selectPending(SAMSUNG);
  const tSamsung = s.beginChartLoad(); // Samsung load begins
  s.selectPending(AAPL);               // user switches before Samsung returns
  const late = s.resolveChartLoad(tSamsung, okChart(SAMSUNG)); // Samsung resolves late
  check('17.6 late Samsung response ignored as stale', late === 'stale');
  check('17.6 Samsung not active', s.getActiveContext() === null || s.getActiveContext().symbol !== '005930');
  check('17.6 no analysis enabled (AAPL only pending)', s.canRunAnalysis() === false);
}

// ---- 17.7 STALE ANALYSIS RESPONSE (all three kinds) ----
for (const kind of ANALYSIS_KINDS) {
  const s = createSelectedSymbolIntegrityState();
  s.markWorkspaceReady();
  promote(s, SAMSUNG);
  const aTok = s.beginAnalysis(kind);
  check(`17.7 [${kind}] analysis token issued while active`, aTok !== null);
  s.selectPending(AAPL); // switch symbol before the analysis response arrives
  const verdict = s.resolveAnalysis(aTok);
  check(`17.7 [${kind}] stale Samsung analysis response ignored`, verdict === 'stale');
  check(`17.7 [${kind}] AAPL pending, analyses disabled`, s.canRunAnalysis() === false);
}

// ---- 17.8 URL SUGGESTION (suggestion-only, no active chart) ----
{
  const s = createSelectedSymbolIntegrityState();
  s.markWorkspaceReady();
  // A URL ?symbol suggestion does NOT call selectPending/beginChartLoad — it stays NO INSTRUMENT until
  // the user explicitly clicks load (which resolves → selectPending → beginChartLoad).
  const snap = s.getSnapshot();
  check('17.8 suggestion does not create an active chart', snap.hasActive === false);
  check('17.8 suggestion does not enable analyses', s.canRunAnalysis() === false);
  check('17.8 suggestion issues no chart load (no pending yet)', s.beginChartLoad() === null);
  // After the explicit click resolves the suggestion into a pending selection and loads it:
  const outcome = promote(s, SAMSUNG);
  check('17.8 explicit click required to activate', outcome === 'accepted' && s.canRunAnalysis() === true);
}

// ---- 17.9 REQUEST COUNT ----
{
  const s = createSelectedSymbolIntegrityState();
  s.markWorkspaceReady();
  let chartCalls = 0;
  let analysisCalls = 0;
  const tryChartLoad = () => { const t = s.beginChartLoad(); if (t) { chartCalls += 1; return t; } return null; };
  const tryAnalysis = (k) => { const t = s.beginAnalysis(k); if (t) { analysisCalls += 1; return t; } return null; };

  // initial entry: nothing invoked
  check('17.9 initial entry: 0 chart calls, 0 analysis calls', chartCalls === 0 && analysisCalls === 0);
  // pending selection: no chart/analysis request merely from selecting
  s.selectPending(SAMSUNG);
  check('17.9 pending selection: 0 chart calls, 0 analysis calls', chartCalls === 0 && analysisCalls === 0);
  // disabled analysis interaction (chart not loaded yet): no request
  ANALYSIS_KINDS.forEach((k) => tryAnalysis(k));
  check('17.9 disabled analysis interaction: 0 analysis calls', analysisCalls === 0);
  // explicit chart load: exactly 1 OHLCV call
  const ct = tryChartLoad();
  s.resolveChartLoad(ct, okChart(SAMSUNG));
  check('17.9 explicit chart load: exactly 1 OHLCV call', chartCalls === 1);
  // each explicit analysis click: at most exactly 1 corresponding call
  ANALYSIS_KINDS.forEach((k) => tryAnalysis(k));
  check('17.9 one click each analysis: exactly 3 analysis calls total', analysisCalls === 3);
}

// ---- Extra: chart response identity-mismatch is rejected ----
{
  const s = createSelectedSymbolIntegrityState();
  s.markWorkspaceReady();
  s.selectPending(SAMSUNG);
  const t = s.beginChartLoad();
  const r = s.resolveChartLoad(t, { ok: true, candleCount: 120, responseSymbolKey: keyOf(AAPL) });
  check('extra: response for a different symbol rejected', r === 'rejected' && s.canRunAnalysis() === false);
}

// ---- Extra: identity helpers ----
{
  check('extra: identity key is country|symbol|exchange|instrumentType', instrumentIdentityKey(SAMSUNG) === 'kr|005930|kospi|stock');
  check('extra: symbol key is country|symbol', instrumentSymbolKey(AAPL) === 'us|aapl');
}

console.log('');
console.log(`HF3A-SELECTED-SYMBOL-TESTS :: passed=${passed} failed=${failed} total=${passed + failed}`);
process.exit(failed > 0 ? 1 : 0);
