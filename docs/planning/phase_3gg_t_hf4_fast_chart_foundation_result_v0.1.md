# Phase 3GG-T-HF4-FAST Result: Chart Foundation UX (HF3A Production Verify + Real Chart Interaction)

## Status / Classification

`PASS_SELECTED_SYMBOL_INTEGRITY_AND_CHART_FOUNDATION_LOCAL_VALIDATION_COMPLETE_PRODUCTION_VERIFY_PENDING`

Local implementation complete and validated with a deterministic offline smoke (54/54) + contract checker.
The final classification `PASS_SELECTED_SYMBOL_INTEGRITY_AND_CHART_FOUNDATION_PRODUCTION_VERIFIED` is
assignable only in a future turn, after Owner QA confirms the checkpoint items in the Production preview.

- **Baseline HEAD**: `5a6f092` (`rebuild/phase-1-ia-shell`).
- **Source commit**: _(this phase: `Phase 3GG-T-HF4-FAST: complete chart foundation UX`)_.

## Scope

1. Production verification of the already-implemented HF3A selected-symbol integrity guard (unchanged this
   phase — see `phase_3gg_t_hf3a_selected_symbol_integrity_result_v0.1.md`).
2. Chart layout/state cleanup: shorter Production lead copy, kicker/heading hidden off-Production, sidebar
   removed from the Production layout (solo content grid), Production-only price/change header row and
   OHLCV strip above the chart.
3. Real candlestick/volume-chart interaction UX: pointer hover, tap, keyboard (ArrowLeft/ArrowRight/Escape),
   crosshair, price/volume tooltips, a dashed latest-price line, and the Korean red-up/blue-down/gray-flat
   color convention (replacing the prior Western green-up/red-down hollow-down scheme).
4. One controlled Production deployment via `vercel deploy --prod --yes` (pending — this doc precedes it).
5. One consolidated Owner QA checkpoint (pending — this doc precedes it).

## Implementation

- **New pure module** `src/lib/chart-ai/chart-interaction-foundation.mjs` — no DOM, no window, no fetch, no
  wall-clock reads, no randomness, no environment access, no provider imports, no secrets. Exports
  `candleDirection`, `computeChange`, `formatPrice`, `formatSignedPrice`, `formatPercent`, `formatVolume`,
  `formatDate`, `estimateTurnover`/`formatEstimatedTurnoverKrw` (KRW-only; always labeled as an estimate,
  never presented as an official field), `nearestCandleIndex`, `valueToY`, `buildCandleDisplayDatum`.
- **`src/lib/chart-ai/chartScale.ts`** — additive-only: `CandleGeometry.direction` widened from `'up'|'down'`
  to `'up'|'down'|'flat'` with exact-equality logic (`close>open`/`close<open`/else flat); `MockedChartGeometry`
  now exposes `priceMin`/`priceMax` so the interaction layer can compute the latest-price line's Y position
  from the same price domain the SVG renderer already uses, instead of duplicating pixel math.
- **`src/pages/chart-ai.astro`**:
  - Korean chart convention: `--chart-shell-up`/`--chart-shell-down`/`--chart-shell-flat` CSS variables
    (red/blue/gray, themed for light and dark mode); down-candles changed from hollow to filled.
  - Production-only markup: `#chartAiHeaderPriceRow` (price + change amount + change percent),
    `#chartAiOhlcvStrip` (open/high/low/close/change/volume/date), `#chartAiChartTooltip`, and an
    `aria-live="polite"` `#chartAiCandleSummary` for screen readers. The sidebar/aside is removed from the
    Production layout (`chart-lookup-content-grid--solo`).
  - Interaction layer (`clientToSvgPoint`, `buildChartOverlayLayer`, `showChartTooltipAt`,
    `updateChartHeaderPrice`, `updateChartStrip`, `applyCandleEmphasis`, `selectChartCandle`,
    `resetChartCandleToLatest`, `attachChartInteractionHandlers`, `resetChartInteractionState`) is entirely
    gated behind `if (chartTooltip) { ... }` inside the single shared `renderChartFromPoints`, since
    `#chartAiChartTooltip` only exists in Production-rendered markup — the non-Production sample chart's
    rendering is otherwise unchanged (it still inherits the shared 3-way direction/color CSS, which is
    harmless).
  - Hover (`pointermove`) only updates visual state; it never writes to the `aria-live` summary. Only commit
    interactions (click/tap/`pointerdown`, and `ArrowLeft`/`ArrowRight`/`Escape` via `keydown`) write to
    `#chartAiCandleSummary`, deduped against `chartAnnouncedIndex` so the same candle is never re-announced.
  - `setRealChartState(...)` calls `resetChartInteractionState()` on every non-`ready` mode transition
    (`idle`/`suggested`/`loading`/`error`/`no-data`/`unavailable`), so stale header/strip/tooltip content
    never lingers behind a hidden or reloading chart; the `ready` transition always follows a fresh
    `renderChartFromPoints` call (via `renderRealChart`), so the interaction layer for the new chart is
    already built by the time `ready` fires.

## HF3A preservation (verified, no changes this phase)

- `git diff --name-only 5a6f092 -- src/lib/chart-ai/selected-symbol-integrity.mjs` is empty.
- No durable-token, auth, protected-route, search, or Supabase source changed this phase (diff-scoped by
  the contract checker against the baseline).
- No `DEFAULT_INSTRUMENT` or `005930`/`삼성전자` fallback reintroduced.
- `integrity.selectPending(...)`, `integrity.beginChartLoad()`, and `integrity.beginAnalysis(...)` call sites
  remain present and unmodified in spirit; analyses still run only against the active-chart context.

## Deterministic validation

- **Smoke**: `npm run smoke:phase-3gg-t-hf4-fast` — 54/54 assertions (pure-module direction/change/formatting/
  turnover-honesty/pointer-mapping/pixel-mapping/display-datum coverage, including edge cases: null/NaN
  input, zero previous close, out-of-range index, zero-range price domain, zero/single-candle series, USD
  vs KRW turnover honesty).
- **Contract checker**: `npm run check:phase-3gg-t-hf4-fast` — static source/regex assertions covering: pure
  module purity, additive-only `chartScale.ts` changes, Production-only DOM + interaction-function presence,
  the `chartTooltip`-gated single hook point, the Korean color convention, aria-live dedup/commit-only
  semantics, keyboard reachability, the `resetChartInteractionState()` wiring, HF3A/durable-token/auth/route/
  Supabase baseline-diff scoping, forbidden-endpoint/secret scanning, dependency/lockfile immutability, and
  working-tree purity.
- **Regression suite** (all green): HF3A smoke + checker, HF2 smoke + checker, HF2-HF1 checker, T-HF1/OP/Q/
  R/T-FAST/N-FAST checkers, `npx astro build`, `git diff --check`.

## Out of scope (untouched this phase)

Durable KIS token manager, token encryption, token lease/fencing, Supabase token migration/RPC bridge,
authentication implementation, protected API guard, account/order/balance/funds/trading endpoints,
similarity-analysis/MK AI/Market Intelligence result designs, search catalogue coverage, OHLCV shared cache
architecture.

## Deployment

Pending. Deployment must use only `vercel deploy --prod --yes` (never `vercel build`/`--prebuilt`), followed
by safe unauthenticated regression checks (page 200, five protected Chart AI routes fail closed 401, bogus
bearer token rejected, zero provider/KIS work on unauthenticated entry).

## Owner QA checkpoint

Pending. Requires an authenticated Production browser session to verify: chart load, hover/tap/keyboard
interaction, tooltip content and positioning, latest-price line, header/strip population, Korean color
convention, aria-live announcements, and that the HF3A guard still blocks analyses until an explicit chart
load succeeds. This assistant does not self-certify browser results that require the owner.
