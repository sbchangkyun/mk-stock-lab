# Phase 3EX-B — Chart Similarity Engine Deterministic Foundation Result

## 1. Status

Implemented — deterministic chart similarity engine foundation complete.

## 2. Background

- Phase 3EX-A aligned Chart AI similarity MVP architecture.
- The owner locked the decision to implement the similarity engine before KIS provider, API route, DB/cache, or UI integration.
- This phase implements the pure deterministic engine using synthetic fixture OHLCV only.

## 3. Implemented Scope

- **Type foundation** (`src/lib/chartSimilarity/types.ts`): `OhlcBar`, `SimilarityWindow`, `SimilarityScanOptions`, `SimilarityScoreParts`, `ForwardOutcome`, `SimilarityMatch`, `SimilaritySummaryStats`, `SimilarityAnalysisResult`. No user identifiers, auth, DB IDs, raw KIS fields, or KIS credentials.
- **Synthetic OHLCV fixture** (`src/data/chartSimilarity/syntheticOhlcvFixture.ts`): `buildSyntheticOhlcvFixture()` returns 260 deterministic daily bars for fake market `SYNTHETIC` / symbol `SYNTH001`, generated from fixed trend + cyclical arithmetic (no `Math.random()`, no `Date.now()`).
- **Return/log-return calculation** (`src/lib/chartSimilarity/returns.ts`): `sortBarsAscending`, `validateOhlcBars`, `toSimpleReturns`, `toLogReturns`. Inputs are never mutated; invalid bars are filtered with warnings rather than throwing.
- **Normalization** (`src/lib/chartSimilarity/normalize.ts`): `zScore`, `toNormalizedPriceIndex` (base-100 overlay path).
- **Rolling windows** (`src/lib/chartSimilarity/rollingWindow.ts`): `createRollingWindows`, `getCurrentWindow`, `getCandidateWindows` (enforces same-length candidates, sufficient forward bars, and current-window/recent-bar exclusion).
- **Similarity scoring** (`src/lib/chartSimilarity/similarityScore.ts`): `pearsonCorrelation`, `rmse`, `directionMatchPct`, `computeSimilarityScore` (correlation + RMSE + direction-match, weighted 0.45 / 0.35 / 0.20, clamped 0..100).
- **Forward outcome** (`src/lib/chartSimilarity/forwardOutcome.ts`): `computeForwardReturn`, `computeForwardOutcome` (per-window forward return plus max drawdown/upside over the forward horizon).
- **Summary stats** (`src/lib/chartSimilarity/summaryStats.ts`): `average`, `median`, `summarizeMatches` (null-safe aggregation across Top K matches).
- **Scanner** (`src/lib/chartSimilarity/similarityScanner.ts`): `scanSimilarity(bars, options)` — pure, synchronous, returns `SimilarityAnalysisResult` sorted by descending similarity score with a deterministic tie-breaker (score → correlation → startDate/index). Never throws on empty/short input; surfaces `warnings` instead.
- **Public exports** (`src/lib/chartSimilarity/index.ts`): re-exports all types and functions listed above for use by future phases.
- **Optional smoke script**: not added in this phase. Node's native TypeScript type-stripping (Node 24) can execute `.ts` files directly, but it requires explicit `.ts` extensions on relative import specifiers, which conflicts with this codebase's existing extensionless relative-import convention (used consistently under `src/lib/server/providers/kis/`, etc.). Adding a committed smoke script would either require deviating from that convention across the new module or duplicating import paths that would not match how Astro/Vite resolves the same modules in production. Per phase instructions, no dependency was added to bridge this gap, so the engine was instead verified manually during development against the synthetic fixture (260 bars; `scanSimilarity` returned 5 sorted matches with scores in range, a normalized current path starting at 100, `d5`/`d20` forward-outcome keys present, no NaN/Infinity, no input mutation, and graceful empty/short-input handling) and relies on the static checker and `npm run build` for ongoing validation.

## 4. Algorithm Policy

- Raw price levels are never compared directly for similarity scoring; only log returns (`toLogReturns`) are compared.
- Return transform: log return, `ln(close[i] / close[i-1])`, guarded against non-positive/non-finite closes (falls back to `0` for that step rather than NaN/Infinity).
- Normalized display path: `toNormalizedPriceIndex` produces a base-100 index for both the current window and each matched window.
- Score formula: `similarityScore = corrScore * 0.45 + rmseScore * 0.35 + directionScore * 0.20`, where `corrScore = ((correlation + 1) / 2) * 100` and `directionScore = directionMatchPct`. **Numerical stability adjustment**: raw RMSE on the log-return scale is typically far below 1, so it is normalized by the mean absolute magnitude of the current-window returns (with a `1e-6` epsilon floor) before being converted to a 0..100 score (`rmseScore = clamp(100 - normalizedRmse * 100, 0, 100)`). This keeps the score meaningful regardless of the fixture's absolute volatility scale and is documented here as required by the phase instructions.
- Current-window/recent overlap exclusion: `getCandidateWindows` excludes any candidate window ending within `excludeRecentBars` bars of the current window's start, in addition to requiring the same window length and enough forward bars.
- No future leakage: forward outcome is always computed strictly after a candidate window's end index.
- No prediction guarantee: no function in this module claims or implies a predictive guarantee; output is descriptive only.

## 5. Preserved Boundaries

- No KIS provider was added or modified.
- No KIS call was made.
- No API route was added.
- No UI integration was made; `src/pages/**` was not touched.
- No DB/cache runtime was added.
- No SQL/migration was run.
- No auth/usage guard was implemented.
- No external AI call was made.
- No public KIS data, `source=live`, or `source=auto` was added.
- No account/trading/order/balance APIs were used.
- No Vercel env change was made.
- No deployment was performed.
- No push was performed.
- No dependency or devDependency was added or changed.
- No actual market values were used; all fixture data is synthetic (`SYNTHETIC` / `SYNTH001`).

## 6. Validation

- `npm run check:phase-3ex-b-chart-similarity-engine-deterministic-foundation`: PASS (65/65).
- `npm run check:phase-3ex-a-chart-ai-similarity-mvp-scope-alignment-architecture`: PASS (62/62).
- `npm run check:phase-3ew-c-mk-ai-mocked-scenario-risk-checklist-expansion`: PASS (50/50).
- `npm run check:phase-3ew-b-mk-ai-analysis-panel-interaction-depth`: PASS (50/50).
- `npm run check:phase-3ew-a-mk-ai-analysis-panel-mocked-first`: PASS (46/46).
- `npm run check:phase-3ev-b-chart-ai-company-overview-selected-symbol-detail`: PASS (44/44).
- `npm run check:phase-3ev-a-chart-ai-public-sample-fallback-hardening`: PASS (42/42).
- `npm run check:production-domain`: PASS (33/33).
- `npm run build`: PASS.
- `git diff --check`: PASS.

## 7. Recommended Next Phase

Recommended:
Phase 3EX-C — Similarity Engine Contract and Edge Case Hardening

Alternative:
Phase 3EX-D — Similarity Result UI Mocked Integration
