# Phase 3GG-T-HF3A Result: Explicit Selected-Symbol / Active-Chart Integrity Guard

## Status / Classification

`PASS_EXPLICIT_SYMBOL_SELECTION_ANALYSIS_GUARD_IMPLEMENTED_LOCAL_VALIDATION_COMPLETE_PRODUCTION_VERIFY_PENDING`

Local implementation complete and validated with a deterministic offline smoke (50/50) + contract checker.
No deploy, no Supabase change, no Vercel env change, no real KIS token issuance, no push.

- **Baseline HEAD**: `9de40e8` (`rebuild/phase-1-ia-shell`).
- **Source commit**: _(this phase: `Phase 3GG-T-HF3A: enforce explicit chart selection for analysis`)_.

## Confirmed defect

Chart AI client state carried hidden live defaults equivalent to `selectedSymbol='005930'`,
`selectedName='삼성전자'`, `selectedRecord=Samsung`, plus a `DEFAULT_INSTRUMENT` Samsung fallback on the URL
path. Because the analyses consumed `selectedSymbol`/`selectedRecord` directly (with no "chart actually
loaded" gate), Similar Pattern / MK AI / Market Intelligence could run against Samsung before the user
explicitly selected and loaded a chart, the visible chart and the analysis target could diverge, and a stale
response from a previous symbol could render after a new selection.

## New three-stage state model

A pure, client-safe state machine (`src/lib/chart-ai/selected-symbol-integrity.mjs`) is the single source
of truth:

- **NO INSTRUMENT** — `pendingInstrument` null, `activeChartInstrument` null, analyses disabled, no request.
- **PENDING INSTRUMENT** — an explicit search result / resolved URL suggestion is selected but not loaded;
  analyses still disabled; no OHLCV/analysis request made merely by selecting.
- **ACTIVE CHART INSTRUMENT** — a real OHLCV chart loaded successfully for the pending selection
  (`chartLoadStatus==='success'`, ≥1 candle, `activeChartRevision===selectionRevision`, response identity
  matches the request). Only then may analyses run.

Revisions/sequences: `selectionRevision` (bumped on every deliberate selection), `activeChartRevision`,
`chartRequestSeq`, and a per-kind `analysisSeq`. Canonical identity is `country|symbol|exchange|instrumentType`.

## Implementation

- **Files**: `src/pages/chart-ai.astro` (wiring) + new pure module `selected-symbol-integrity.mjs`.
- **Hidden defaults removed**: `selectedSymbol=''`, `selectedName=''`, `selectedRecord=null`;
  `DEFAULT_INSTRUMENT` deleted; static Samsung header/overview placeholders neutralized to `종목 미선택`/`—`.
- **Chart promotion rule**: `loadRealChart()` requires a pending instrument (`beginChartLoad()`), and
  promotes to ACTIVE only through `resolveChartLoad()` when the response is current (seq + revision),
  successful, non-empty, and identity-matched. Stale/empty/failed responses never render or enable analyses.
- **Shared analysis guard**: every analysis calls `integrity.beginAnalysis(kind)` (returns a token only when
  `canRunAnalysis()`), derives its symbol/country from the ACTIVE-context token (never the raw pending
  selection), and re-checks `integrity.resolveAnalysis(token)` before rendering.
- **Button states**: the three start buttons are `disabled` + `aria-disabled="true"` by default; a single
  `updateAnalysisAvailability()` enables them (and clears the guidance) only when a chart is active, and
  disables them (with honest guidance) otherwise. Not CSS-only.
- **Invalidation**: selecting a new result bumps `selectionRevision`, clears the active chart + candles,
  clears all three analysis result panels, aborts in-flight requests, and disables analyses.

## Stale response protection

Chart, Similar Pattern, MK AI, and Market Intelligence responses are each protected by (a) AbortController,
(b) a local sequence guard, and (c) the module's revision/sequence checks: a response whose selection was
superseded resolves to `stale` and never renders or enables analyses. Verified for a late chart response
after a symbol switch and for all three analysis types.

## Zero-request evidence

- Initial authenticated entry: no search/OHLCV/analysis/token request (idle state; no auto-load).
- Pending selection: 0 chart/analysis requests until an explicit load click.
- Disabled analysis interaction: 0 requests (`beginAnalysis` returns null; buttons disabled).
- Explicit chart load: exactly 1 OHLCV call; each explicit analysis click: exactly 1 call.
The durable KIS token manager was not touched; no polling/prefetch/background/auto-load added.

## Tests & regressions

- HF3A smoke `smoke_phase_3gg_t_hf3a_selected_symbol_integrity.mjs`: **50/50** (17.1–17.9 + identity/stale).
- HF3A contract checker `check_phase_3gg_t_hf3a_contract.mjs`.
- Regressions: HF2 durable-token smoke/checker, HF2-HF1 bridge smoke/checker, T-HF1/OP/Q/R/T-FAST/N-FAST
  checkers, `astro build`, `git diff --check` — all green.

## Files changed

- `src/lib/chart-ai/selected-symbol-integrity.mjs` — new pure state machine + guard.
- `src/pages/chart-ai.astro` — wiring, removed hidden defaults, explicit promotion, shared guard, a11y.
- `scripts/smoke_phase_3gg_t_hf3a_selected_symbol_integrity.mjs`, `scripts/check_phase_3gg_t_hf3a_contract.mjs`.
- `package.json` (scripts only), `docs/planning/*` (this doc + changelog), plus narrow sibling-checker tolerance.

## Production status

**Not deployed.** No Supabase change, no Vercel env change, no real KIS token issued, no push. The durable
token architecture is unchanged.

## Next Production verification plan — Phase 3GG-T-HF3A-PROD-VERIFY

Owner QA on authenticated `/chart-ai`: no symbol active initially; all three analyses disabled; select
Samsung without loading → still disabled; load Samsung chart → enabled + use Samsung; select AAPL → Samsung
cleared + disabled; load AAPL → enabled + use AAPL; rapid symbol switching during a load shows no stale
chart/analysis; no automatic KIS issuance from entry/selection; durable token remains reused. Target:
`PASS_EXPLICIT_SYMBOL_SELECTION_ANALYSIS_GUARD_PRODUCTION_VERIFIED`.
