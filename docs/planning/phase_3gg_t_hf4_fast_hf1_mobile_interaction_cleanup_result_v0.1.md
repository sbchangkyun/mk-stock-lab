# Phase 3GG-T-HF4-FAST-HF1 Result: Mobile Chart Interaction Cleanup

## Status / Classification

`PASS_SELECTED_SYMBOL_INTEGRITY_AND_CHART_FOUNDATION_LOCAL_VALIDATION_COMPLETE_PRODUCTION_VERIFY_PENDING`

Local implementation complete and validated with a deterministic offline smoke (36/36) + contract checker.
The final classification `PASS_SELECTED_SYMBOL_INTEGRITY_AND_CHART_FOUNDATION_PRODUCTION_VERIFIED` is
assignable only in a future turn, after Owner QA confirms the checkpoint items in Production.

- **Baseline HEAD**: `4b2df40` (`Phase 3GG-T-HF4-FAST: complete chart foundation UX`, `rebuild/phase-1-ia-shell`).
- **Source commit**: _(this phase: `Phase 3GG-T-HF4-FAST-HF1: clean up mobile chart interaction`)_.

## Scope

A narrow, fully-specified follow-up to the already-deployed HF4-FAST chart foundation. Fixes exactly five
confirmed defects from prior Owner QA (item C: candle/volume hover and mobile tap — FAIL) without touching
any already-PASSing behavior (HF3A selected-symbol integrity, chart layout, Samsung/AAPL analysis behavior,
durable KIS token reuse, authentication).

## Confirmed defects fixed

1. **Oversized mobile chart tooltip.** The `max-width: 640px` `.chart-tooltip` override is now compact
   (`max-width: 165px`, smaller padding/font/line-height/row gaps) and reuses the existing theme-aware
   `--chart-shell-overlay` CSS variable plus `backdrop-filter: blur(6px)` for a semi-transparent surface,
   instead of introducing new rgba literals. `showChartTooltipAt` already clamps position from the tooltip's
   own `offsetWidth`/`offsetHeight`, so the edge-flip behavior needed no JS change.
2. **Mobile tooltip/crosshair not clearing after tapping outside the chart.** A single document-level
   `pointerdown` listener, registered inside the existing idempotent `attachChartInteractionHandlers()`
   guard, classifies inside/outside via `chart.contains(event.target)` (no `stopPropagation`) and calls the
   existing lightweight `resetChartCandleToLatest()` — the same reset desktop `pointerleave`/`Escape` already
   use. It only touches chart-interaction display state (tooltip/crosshair/emphasis/strip); it never clears
   the selected instrument, active chart data, or analysis availability.
3. **Loading message stays visible after a successful chart load.** The preparing-state panel's shared
   `display: grid` rule is an author-origin rule that always won over the UA `[hidden] { display: none }`
   default regardless of specificity, so `stateEl.hidden = mode === 'ready'` never actually collapsed the
   panel's layout. Fixed with a narrowly-scoped `.chart-market-preparing-state[hidden] { display: none
   !important; }` override — `[hidden]` is not globally redefined.
4. **OHLCV strip touches the left edge.** Desktop `.chart-ohlcv-strip` padding widened from `0.4rem 0.1rem`
   to `0.45rem 0.9rem`; the mobile override gained `padding: 0.4rem 0.65rem`.
5. **Market Intelligence removed from the Chart AI page.** All client-side markup, the stub declaration, the
   `ANALYSIS_CONTROLS` entry, the reset call site, the full analysis IIFE (DOM lookups, `runMi`,
   `miAbort`, click wiring, the `/api/chart-ai/market-intelligence.json` fetch), and the dead
   `.chart-market-intel*` CSS block are all removed — not CSS-hidden. The backend route
   (`src/pages/api/chart-ai/market-intelligence.json.ts`) and engine
   (`src/lib/server/chart-ai/marketIntelligence/`) are untouched (diff-scoped against baseline). Chart AI
   now has two active analysis experiences: Similar Pattern and MK AI, both still wired through the single
   HF3A `integrity.beginAnalysis`/`resolveAnalysis` guard. The `selected-symbol-integrity.mjs` module's
   `ANALYSIS_KINDS` list (`['similar-pattern', 'mk-ai', 'market-intel']`) is intentionally left untouched —
   re-adding the caller is lower-risk than a module edit, and no contract depends on the list shrinking.

## HF3A / durable-token preservation (verified, no changes this phase)

- `git diff --name-only 4b2df40 -- src/lib/chart-ai/selected-symbol-integrity.mjs` is empty.
- No durable-token, auth, protected-route, search, OHLCV, or Supabase source changed this phase.
- No `DEFAULT_INSTRUMENT` or `005930`/`삼성전자` fallback reintroduced; `selectedSymbol` still initializes empty.
- This hotfix adds no polling, no auto-reload, no hover-triggered network calls, and no outside-tap provider
  calls — the outside-tap handler is a pure client-side display reset.

## Tests & regressions

- New smoke `scripts/smoke_phase_3gg_t_hf4_fast_hf1_mobile_interaction_cleanup.mjs`: **36/36**.
- New contract checker `scripts/check_phase_3gg_t_hf4_fast_hf1_contract.mjs`.
- Sibling-checker reconciliation (narrow, documented inline as `Phase 3GG-T-HF4-FAST-HF1 SUPERSEDED this`):
  `check_phase_3gg_t_fast_contract.mjs` (Section 8: UI assertion → backend-route-only assertion),
  `check_phase_3gg_t_hf1_contract.mjs` (line 98: page-presence → backend-route-existence),
  `check_phase_3gg_t_hf3a_contract.mjs` (Sections 7/9/10/13: three analyses → two; `miAbort` removed),
  `smoke_phase_3gg_t_hf1_chart_ai_auth_zero_request_ui_cleanup.mjs` (auth-header count 5→4; MI-preserved
  check → UI-removed + backend-route-existence checks).
- Full regression suite (HF4-FAST-HF1 smoke + checker, HF4-FAST smoke + checker, HF3A smoke + checker, HF2
  smoke + checker, HF2-HF1 checker, T-HF1/OP/Q/R/T-FAST/N-FAST checkers, `astro build`, `git diff --check`)
  — see the companion regression run recorded in the changelog entry for this phase.

## Files changed

- `src/pages/chart-ai.astro` — mobile tooltip CSS, outside-tap handler, `[hidden]` override, OHLCV strip
  padding, Market Intelligence removal (markup, client script, CSS).
- `scripts/smoke_phase_3gg_t_hf4_fast_hf1_mobile_interaction_cleanup.mjs`,
  `scripts/check_phase_3gg_t_hf4_fast_hf1_contract.mjs` — new.
- `scripts/check_phase_3gg_t_fast_contract.mjs`, `scripts/check_phase_3gg_t_hf1_contract.mjs`,
  `scripts/check_phase_3gg_t_hf3a_contract.mjs`,
  `scripts/smoke_phase_3gg_t_hf1_chart_ai_auth_zero_request_ui_cleanup.mjs` — narrow MI-removal reconciliation.
- `package.json` (scripts only), `docs/planning/*` (this doc + changelog).

## Out of scope (untouched this phase)

Similar Pattern / MK AI redesign, search coverage, OHLCV cache architecture, technical indicators, market-data
suppliers, LLM calls, portfolio/account/order/trading integration, unrelated typography/layout.

## Production status

**Not yet deployed as of this document's authoring.** Deployment (via `vercel deploy --prod --yes` only) and
safe unauthenticated Production regression follow this local-validation step, per the phase authorization.

## Owner Checkpoint — HF4-FAST-HF1 Production QA (pending)

Requires an authenticated Production browser session (mobile viewport) to verify: compact semi-transparent
tooltip on tap, tooltip/crosshair/selection clearing on outside tap, the loading message fully disappearing
after a successful chart load, the OHLCV strip no longer touching the screen edge, and the absence of any
Market Intelligence section or network call. Must also reconfirm items already PASSing (HF3A guard, layout,
Samsung/AAPL analysis, zero additional KIS issuance). This assistant does not self-certify authenticated
browser results that require the owner.
