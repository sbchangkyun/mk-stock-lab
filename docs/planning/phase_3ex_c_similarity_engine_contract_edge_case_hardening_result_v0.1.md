# Phase 3EX-C — Similarity Engine Contract and Edge Case Hardening (Result v0.1)

## 1. Status

Implemented — similarity engine contract and edge-case hardening complete.

## 2. Background

Phase 3EX-B implemented the deterministic chart similarity engine foundation under `src/lib/chartSimilarity/` and a deterministic synthetic OHLCV fixture under `src/data/chartSimilarity/`. That phase did not add a committed runtime smoke script, because Node's native TypeScript execution requires explicit `.ts` extensions on relative imports, which conflicts with the project's established extensionless-import convention. Phase 3EX-C resolves this gap safely, without adding dependencies, and hardens the engine against a broader set of edge cases.

## 3. Implemented Scope

- **Option normalization**: added `src/lib/chartSimilarity/scanOptions.ts` exporting `normalizeScanOptions(options)`, a pure function that sanitizes caller-supplied `SimilarityScanOptions` before the scanner uses them. It coerces `baseWindow` to a non-negative integer via an explicit `Number.isFinite()` check (fixing a class of bug where `NaN` silently defeats naive `<= 0` range guards), sanitizes `forwardWindows` to positive integers only (deduplicated, sorted ascending), coerces `topK` to a non-negative integer, clamps `excludeRecentBars` to `>= 0`, keeps `similarityMethod` fixed to `'return_correlation_rmse'`, and pushes a human-readable warning for every value it had to correct. It never throws on malformed but type-compatible input.
- **Scanner wiring**: `src/lib/chartSimilarity/similarityScanner.ts` now calls `normalizeScanOptions` immediately after `validateOhlcBars`, folds its warnings into the scanner's own `warnings` array, and uses the normalized `baseWindow`/`forwardWindows`/`topK`/`excludeRecentBars` everywhere downstream instead of trusting the raw `options` object.
- **Edge-case handling and no-NaN/Infinity safeguards**: audited all eight existing engine modules (`returns.ts`, `normalize.ts`, `rollingWindow.ts`, `similarityScore.ts`, `forwardOutcome.ts`, `summaryStats.ts`, `similarityScanner.ts`, `types.ts`) against the full edge-case list (empty bars, one-bar input, baseWindow <= 0/non-finite, topK <= 0, empty/negative/zero/duplicate/non-integer forwardWindows, excludeRecentBars < 0/too large, all-identical closes, zero/negative/non-finite close, non-finite volume, unsorted bars, insufficient future bars, candidate/current-window overlap, empty-array correlation/RMSE, invalid first close). All guards were already correct at the individual-function level from Phase 3EX-B (empty-array short-circuits in `pearsonCorrelation`/`rmse`/`directionMatchPct`, zero-variance handling in `zScore`, invalid-first-close fallback in `toNormalizedPriceIndex`, non-positive-close guards in `returns.ts`, null-fallback in `forwardOutcome.ts`, null-ignoring aggregation in `summaryStats.ts`, exclusion-boundary math in `getCandidateWindows`). The one genuine gap — unsanitized raw scan options reaching those guards — is closed by `scanOptions.ts`.
- **Edge-case fixtures**: added `src/data/chartSimilarity/edgeCaseOhlcvFixtures.ts` exporting `buildFlatSyntheticOhlcvFixture()`, `buildShortSyntheticOhlcvFixture()`, `buildInvalidSyntheticOhlcvFixture()`, and `buildUnsortedSyntheticOhlcvFixture()`. All are synthetic, fixed-arithmetic (no `Math.random()`, no `Date.now()`), and use no real stock codes or real market values.
- **Committed smoke verification**: added `scripts/smoke_phase_3ex_c_similarity_engine_edge_cases.mjs`, a committed runtime smoke script that copies the actual `src/lib/chartSimilarity/` and `src/data/chartSimilarity/` sources into an OS temp directory, rewrites only the copies' relative import specifiers to add a `.ts` extension (committed source imports are never modified), imports the copies via Node's native TypeScript execution, runs 27 assertions against the real engine behavior, and removes the temp directory in a `finally` block. Verified working: 27/27 checks pass.
- **Static checker**: added `scripts/check_phase_3ex_c_similarity_engine_contract_edge_case_hardening_contract.mjs` implementing 78 numbered static checks (file existence, source-content guards, doc/changelog content guards, boundary-file guards, dependency-change guards, network-blocking).
- **Docs, changelog, package scripts**: this result document; a prepended `## Phase 3EX-C - 2026-07-03` changelog entry; `package.json` scripts `check:phase-3ex-c-similarity-engine-contract-edge-case-hardening` and `smoke:phase-3ex-c-similarity-engine-edge-cases`.

## 4. Contract Guarantees

- Expected bad input (empty bars, one-bar input, invalid options, invalid bars) never throws an uncontrolled error — it returns warnings and/or empty matches instead.
- `similarityScore` always remains within `0..100` across all tested scenarios, including flat/all-identical data and sanitized-option edge cases.
- No NaN/Infinity value appears anywhere in any public `scanSimilarity` output across all 27 smoke scenarios (normal, empty, one-bar, flat, invalid, extreme exclusion, topK=0, messy forward windows, NaN baseWindow, unsorted).
- Forward outcomes use `null`, never `NaN`, when the underlying data is insufficient to compute a value.
- Current-window and recent-buffer overlap remains excluded from candidate windows via `excludeRecentBars`, enforced by `getCandidateWindows`'s exclusion-boundary arithmetic, unchanged from Phase 3EX-B and re-verified in this phase.
- Future data is never used in similarity scoring — `computeSimilarityScore` only ever receives log-returns computed from the current and candidate windows themselves; forward outcomes are computed separately, strictly after each candidate window's end index.

## 5. Preserved Boundaries

- No KIS provider code added.
- No KIS API call made.
- No public KIS route added or modified.
- No `/chart-ai` or other UI integration.
- No login/auth implemented.
- No usage guard implemented.
- No DB or cache runtime added.
- No SQL or migration run or added.
- No external AI API call made.
- No Vercel deployment performed.
- No `git push` performed.
- No dependency or devDependency changes.
- No `.env`/secret files read or modified.
- No dev server, browser, Playwright, Puppeteer, or screenshots used.

## 6. Validation

All 12 required commands were run for real. Results:

1. `npm run check:phase-3ex-c-similarity-engine-contract-edge-case-hardening` — PASS (78/78).
2. `npm run smoke:phase-3ex-c-similarity-engine-edge-cases` — PASS (27/27), executing the real TypeScript engine via Node's native type stripping against a temp-directory copy with rewritten import extensions.
3. `npm run check:phase-3ex-b-chart-similarity-engine-deterministic-foundation` — PASS (65/65).
4. `npm run check:phase-3ex-a-chart-ai-similarity-mvp-scope-alignment-architecture` — PASS (61/62). One pre-existing failure, `No src runtime files changed in this phase`, confirmed unrelated to this phase: it already fails at clean HEAD `9f8cfcb` (verified by stashing all Phase 3EX-C changes and re-running the checker against the unmodified working tree). The 3EX-A checker's `src/` diff filter has no allowance for the chart similarity engine that Phase 3EX-A itself scoped in as the immediate next-phase deliverable, so it flags any `src/lib/chartSimilarity/` or `src/data/chartSimilarity/` file added by any later phase. This checker is outside Phase 3EX-C's allowed changed paths, so it was left unmodified per the phase boundary rules; no runtime/public KIS/security assertion was weakened.
5. `npm run check:phase-3ew-c-mk-ai-mocked-scenario-risk-checklist-expansion` — PASS (50/50).
6. `npm run check:phase-3ew-b-mk-ai-analysis-panel-interaction-depth` — PASS (50/50).
7. `npm run check:phase-3ew-a-mk-ai-analysis-panel-mocked-first` — PASS (46/46).
8. `npm run check:phase-3ev-b-chart-ai-company-overview-selected-symbol-detail` — PASS (44/44).
9. `npm run check:phase-3ev-a-chart-ai-public-sample-fallback-hardening` — PASS (42/42).
10. `npm run check:production-domain` — PASS (33/33).
11. `npm run build` — PASS.
12. `git diff --check` — PASS (no whitespace errors).

## 7. Recommended Next Phase

- **Recommended**: Phase 3EX-D — Similarity Result UI Mocked Integration.
- **Alternative**: Phase 3EY-A — Server-only KIS OHLC Provider Planning/Foundation.
