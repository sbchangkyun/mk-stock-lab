# Phase 3EX-D — Similarity Result UI Mocked Integration (Result v0.1)

## 1. Status

Implemented — mocked similarity result UI integrated into `/chart-ai`, chart/sidebar stretch layout bug fixed.

## 2. Background

The owner performed a visual review of `/chart-ai` and found that expanding the MK AI button's right-sidebar explanation box also stretched the left chart card vertically, creating a large empty white area. This was caused by `.chart-lookup-content-grid` (a two-column CSS grid) defaulting to `align-items: stretch`, so growing sidebar content stretched the fixed-height chart card's grid cell to match. Phase 3EX-D fixes that layout bug and adds a mocked "유사 패턴 분석" (similar pattern analysis) result UI, using the deterministic chart similarity engine from Phase 3EX-B/3EX-C and synthetic fixture data only.

## 3. Implemented Scope

- **Layout fix**: added `align-items: start` to `.chart-lookup-content-grid` and `align-self: start` to `.chart-market-panel` and `.chart-stock-sidebar`, so the chart card no longer stretches vertically when sidebar content (including the MK AI note) grows.
- **Compact sidebar card**: added a new "유사 패턴 분석" card in `<aside class="chart-stock-sidebar">`, with a "샘플 분석" status chip, the specified guide copy, a `유사 패턴 분석 보기` button (`#chartAiSimilarityViewBtn`, `type="button"`, `aria-expanded`, `aria-controls="chartAiSimilarityPanel"`), and a note that real KIS-based execution requires login/authorization/usage-limit gating. The button performs no API/auth/storage call — it only sets `aria-expanded` and scrolls the full-width panel into view.
- **Full-width result panel**: added `<section id="chartAiSimilarityPanel">` after the chart/sidebar grid and before the page's general disclaimer, containing all six required subsections: 현재 패턴 요약, 유사 구간 Top 5 (accessible `<table>` with `<caption>`), 기준일 100 정규화 오버레이 (local inline SVG, no external chart library), 사후 성과 요약, MK AI 해석 (existing MK AI note relocated here), and 데이터 한계 / 투자 유의. The panel carries "샘플 데이터", "실제 KIS 데이터 아님", and "매수·매도 추천 또는 투자자문이 아님" status chips.
- **MK AI relocation**: the existing `#chartAiMkAiNote` block (all of `chart-3EW` scenario/checklist/risk content) was moved from the sidebar into the full-width panel's "MK AI 해석" subsection. The `#chartAiMkAiBtn` trigger stays in the sidebar as a compact control; its existing click handler still works unchanged (it references the note purely by DOM id) and now also scrolls the note into view on open.
- **Deterministic engine wiring**: `src/pages/chart-ai.astro` frontmatter imports `scanSimilarity` from `../lib/chartSimilarity` and `buildSyntheticOhlcvFixture` from `../data/chartSimilarity/syntheticOhlcvFixture`, and computes `similarityResult` once at render time with `{ baseWindow: 20, forwardWindows: [5, 20], topK: 5, similarityMethod: 'return_correlation_rmse', excludeRecentBars: 40 }`. No API, no fetch, no KIS call. The real engine produced 5 non-empty matches against the 260-bar synthetic fixture, so the local-mocked-object fallback described in the task brief was not needed.
- **Formatting helpers**: added frontmatter helpers `formatSimilarityScore` ("87.42점"-style), `formatForwardReturnPct` (signed percentage, or "데이터 부족" for null), and `formatDrawdownPct` (percentage, or "-" for null).
- **Docs, changelog, package script**: this result document; a prepended `## Phase 3EX-D - 2026-07-03` changelog entry; `package.json` script `check:phase-3ex-d-similarity-result-ui-mocked-integration`; a new 58-check static checker `scripts/check_phase_3ex_d_similarity_result_ui_mocked_integration_contract.mjs`.

## 4. Layout Decision

Per the owner's mandate, the right sidebar is now a compact control/status area only (종목 개요, KIS 연결 프리뷰, the new compact 유사 패턴 분석 card, and the MK AI trigger button). All long-form result content — similarity result details, the Top 5 table, the normalized overlay chart, the forward outcome summary, and the full MK AI interpretation/narrative — now lives in a full-width panel below the chart/sidebar grid. The chart card no longer stretches when the sidebar or the panel grows, because the grid's cross-axis alignment defaults to `start` instead of `stretch`.

## 5. Mocked Data Policy

All similarity data on this page is produced by running the existing, already-hardened deterministic engine (`scanSimilarity`, Phase 3EX-B/3EX-C) against the existing deterministic synthetic fixture (`buildSyntheticOhlcvFixture`, fake market `SYNTHETIC` / symbol `SYNTH001`, no `Math.random()`, no `Date.now()`, no real stock codes or real market values). The computation happens once in Astro frontmatter at render/build time — no client-side fetch, no API route, no KIS call. Every result section on the page carries a "샘플 데이터" / "실제 KIS 데이터 아님" disclaimer, and the MK AI 해석 section explicitly states it uses no external AI and is not investment advice.

## 6. Preserved Boundaries

- No KIS provider code added.
- No KIS API call made.
- No public KIS route added or modified.
- No `/api/chart-ai/similarity` or any other new API route added.
- No login/auth implemented.
- No usage guard implemented.
- No DB or cache runtime added.
- No SQL or migration run or added.
- No real production enablement of live similarity execution.
- No external AI API call made.
- No Vercel deployment performed.
- No `git push` performed.
- No dependency or devDependency changes.
- No `.env`/secret files read or modified.
- No dev server, browser, Playwright, Puppeteer, or screenshots used during implementation.

## 7. Validation

All required commands were run for real. Results:

1. `npm run check:phase-3ex-d-similarity-result-ui-mocked-integration` — PASS (58/58).
2. `npm run check:phase-3ex-c-similarity-engine-contract-edge-case-hardening` — PASS with one expected, documented failure (77/78). The failing check, `No src/pages files changed`, is a scope-boundary assertion written when Phase 3EX-C had no authorization to touch UI files. Phase 3EX-D is explicitly the UI integration phase and is authorized (and required) to change `src/pages/chart-ai.astro`, so this specific historical assumption is now expected to no longer hold. No other assertion in this checker failed. This checker is outside Phase 3EX-D's allowed changed paths and was left unmodified.
3. `npm run smoke:phase-3ex-c-similarity-engine-edge-cases` — PASS (27 passed, 0 failed).
4. `npm run check:phase-3ex-b-chart-similarity-engine-deterministic-foundation` — PASS with two expected, documented failures (63/65). The failing checks, `Source contains no UI/page changes` and `No forbidden tracked paths changed`, are the same class of pre-3EX-D scope-boundary assertion as above (this checker predates any UI integration phase and asserts no `src/pages` changes occurred). No other assertion in this checker failed. This checker is outside Phase 3EX-D's allowed changed paths and was left unmodified.
5. `npm run check:phase-3ew-c-mk-ai-mocked-scenario-risk-checklist-expansion` — PASS (50/50).
6. `npm run check:phase-3ew-b-mk-ai-analysis-panel-interaction-depth` — PASS (50/50).
7. `npm run check:phase-3ew-a-mk-ai-analysis-panel-mocked-first` — PASS (46/46).
8. `npm run check:phase-3ev-b-chart-ai-company-overview-selected-symbol-detail` — PASS (44/44).
9. `npm run check:phase-3ev-a-chart-ai-public-sample-fallback-hardening` — PASS (42/42).
10. `npm run check:chart-ai-ux-skeleton` — PASS (82/82).
11. `npm run check:mobile-baseline` — PASS (74/74).
12. `npm run check:production-domain` — PASS (33/33).
13. `npm run build` — PASS.
14. `git diff --check` — PASS (no whitespace errors; one benign LF→CRLF line-ending notice from git, not an error).

Note: `check:phase-3ex-a-chart-ai-similarity-mvp-scope-alignment-architecture` was intentionally excluded from this gating list per the phase brief (its `src/` diff-filter has a known, pre-existing, unrelated failure carried since Phase 3EX-C and is not repaired in this phase).

## 8. Recommended Next Phase

- **Recommended**: Phase 3EX-E — Similarity Result UI Owner Review and Polish.
- **Alternative**: Phase 3EY-A — Server-only KIS OHLC Provider Planning/Foundation.
