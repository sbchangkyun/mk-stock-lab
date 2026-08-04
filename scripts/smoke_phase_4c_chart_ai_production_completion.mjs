/**
 * Phase 4C — Chart AI Production Completion smoke (pure, no network, no DOM).
 *
 * Phase 4C's only executable change is inline client script inside src/pages/chart-ai.astro (a
 * completion pass over the existing Production chart-lookup UI, not a rewrite -- see
 * check_phase_4c_chart_ai_production_completion_contract.mjs for the static source-contract checks
 * covering that inline script). That script is not an independently importable module, so this smoke
 * instead proves the one pure, already-existing module its new last-good-chart-preservation logic
 * (§9-11) depends on for correctness: the Phase 3GG-T-HF3A chart/analysis integrity state machine
 * (src/lib/chart-ai/selected-symbol-integrity.mjs). The new code in loadRealChart() gates every
 * non-'ready' state transition on `integrity.failChartLoad(token, 'error') === 'stale'` -- if that
 * lifecycle guard's stale/accepted/rejected contract ever regresses, the last-good-chart fix would
 * silently misbehave (e.g. preserving a chart for an instrument the user has already navigated away
 * from). This locks that contract down.
 */

import {
  createSelectedSymbolIntegrityState,
  instrumentIdentityKey,
  instrumentSymbolKey,
} from '../src/lib/chart-ai/selected-symbol-integrity.mjs';

let passed = 0;
let failed = 0;
const check = (name, cond) => { if (cond) { passed += 1; } else { failed += 1; console.error(`FAIL: ${name}`); } };

const samsung = { country: 'KR', symbol: '005930', exchange: 'KRX', instrumentType: 'stock' };
const apple = { country: 'US', symbol: 'AAPL', exchange: 'NASDAQ', instrumentType: 'stock' };

// ---------------------------------------------------------------------------------------------------
// A. Reload-of-displayed-instrument: a period switch / retry for the SAME instrument that is already
//    ACTIVE CHART must still resolve through the same current token (this is what lets the new
//    `isReloadOfDisplayedInstrument` check in loadRealChart() compare against a live, non-stale token).
// ---------------------------------------------------------------------------------------------------
{
  const s = createSelectedSymbolIntegrityState();
  s.markWorkspaceReady();
  s.selectPending(samsung);
  const loadToken = s.beginChartLoad();
  check('1 beginChartLoad token carries the requested instrument + symbol key',
    loadToken.instrument === samsung && loadToken.requestedSymbolKey === instrumentSymbolKey(samsung));
  const outcome1 = s.resolveChartLoad(loadToken, { ok: true, candleCount: 120, responseSymbolKey: instrumentSymbolKey(samsung) });
  check('2 first successful load is accepted', outcome1 === 'accepted');
  check('3 analysis is runnable once active chart matches pending selection', s.canRunAnalysis() === true);

  // A period-switch reload of the SAME instrument starts a fresh token (still current: same seq family).
  const reloadToken = s.beginChartLoad();
  check('4 a reload of the same pending instrument still yields a live (non-stale) token',
    reloadToken !== null && reloadToken.instrument === samsung);
  // Simulate the reload failing (network error) -- the new §9-11 code calls failChartLoad and, only if
  // it is NOT 'stale', keeps the last-good chart pixels on screen while still disabling analysis.
  const failOutcome = s.failChartLoad(reloadToken, 'error');
  check('5 a failed reload of the still-current instrument resolves (not stale) so the UI may preserve the chart', failOutcome === 'failed');
  check('6 analysis is correctly disabled after the failed reload even though the old chart may stay visible', s.canRunAnalysis() === false);
}

// ---------------------------------------------------------------------------------------------------
// B. Genuinely new instrument selection while a chart is already active: the OLD token becomes stale
//    the instant the new selection is made, so a late-arriving failure for the OLD instrument must
//    never be allowed to touch the new selection's UI (integrity.failChartLoad returns 'stale').
// ---------------------------------------------------------------------------------------------------
{
  const s = createSelectedSymbolIntegrityState();
  s.markWorkspaceReady();
  s.selectPending(samsung);
  const samsungToken = s.beginChartLoad();
  s.resolveChartLoad(samsungToken, { ok: true, candleCount: 90, responseSymbolKey: instrumentSymbolKey(samsung) });
  check('7 samsung active after first load', s.canRunAnalysis() === true);

  // User switches to a genuinely different instrument before any reload of samsung is attempted.
  s.selectPending(apple);
  const appleToken = s.beginChartLoad();
  check('8 apple token is a fresh, distinct instrument from the prior active chart',
    instrumentIdentityKey(appleToken.instrument) !== instrumentIdentityKey(samsung));

  // A late failure callback for the OLD samsung token must be rejected as stale -- it must never
  // resolve as a live 'failed' outcome that could preserve or otherwise affect the apple chart now on
  // screen.
  const staleOutcome = s.failChartLoad(samsungToken, 'error');
  check('9 a late failure for the superseded (old-instrument) token is stale, never live', staleOutcome === 'stale');

  // The apple load itself resolving success is unaffected by the stale samsung callback.
  const appleOutcome = s.resolveChartLoad(appleToken, { ok: true, candleCount: 60, responseSymbolKey: instrumentSymbolKey(apple) });
  check('10 the new instrument load still resolves normally after the stale callback', appleOutcome === 'accepted');
  check('11 active context is the new instrument, not the old one', s.getActiveContext() === apple);
}

// ---------------------------------------------------------------------------------------------------
// C. First load of a brand-new instrument failing outright (no prior good chart for THIS instrument to
//    preserve) -- isReloadOfDisplayedInstrument must be false so the UI still blanks/hides normally.
// ---------------------------------------------------------------------------------------------------
{
  const s = createSelectedSymbolIntegrityState();
  s.markWorkspaceReady();
  s.selectPending(apple);
  const firstToken = s.beginChartLoad();
  const firstFail = s.failChartLoad(firstToken, 'error');
  check('12 a first-ever load failure for a freshly selected instrument resolves live (not stale)', firstFail === 'failed');
  check('13 there is no active context to preserve for a never-successfully-loaded instrument', s.getActiveContext() === null);
}

console.log(`\nPhase 4C-CHART-AI-PRODUCTION-COMPLETION smoke: ${passed} passed, ${failed} failed.`);
process.exit(failed > 0 ? 1 : 0);
