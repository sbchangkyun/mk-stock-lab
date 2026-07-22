# Phase 3GG-N-FAST Result: Production Chart AI Default Route and UI Cleanup

## Classification

`PASS_PRODUCTION_VERIFIED` — source change complete, local build and regression preflight all PASS, cloud
deploy to the real Production URL succeeded, and live Production browser QA (desktop + mobile 375px)
confirms the default route, the UI cleanup, and the real KIS+LLM `MK AI 시세 요약` fetch all work correctly.

## Baseline

- **Baseline commit**: `da71860` (Phase 3GG-M-PROD-HF1).
- **Branch**: `rebuild/phase-1-ia-shell`.
- **Project path**: `E:\개인 프로젝트\mk-stock-lab`.

## Goal (owner intent)

Make `https://mkstocklab.vercel.app/chart-ai` the real Production entry point with no need to know or
append `chartAiProdBeta=1`, and clean up the page so it no longer mixes the real KIS+LLM summary with
sample/mock/owner-local content presented as real — without pretending universal search, real OHLCV, real
similarity, or full MK AI analysis exist yet. That remaining work is explicitly out of scope, reserved for
Phase 3GG-OP-FAST.

## Section results

### A/B/C — Production default route

`isVercelProductionRuntime` and `productionChartAiDefaultEnabled` are computed server-side in the
`chart-ai.astro` frontmatter (dual-source `readServerEnvValue('VERCEL_ENV')` / flag check, reusing
`evaluateProductionChartAiBetaAccess` from Phase 3GG-M-PROD-HF1). When `VERCEL_ENV=production` and the flag
is true, `/chart-ai` with no query param now serves the Production panel directly
(`data-chart-ai-production-default="true"` on the root shell). The legacy `?chartAiProdBeta=1` query param
continues to work unchanged. The internal H-route fetch (`local-only-kis-llm-summary.json.ts`) still
receives `chartAiProdBeta=1` on every request from this page, confirmed present in the compiled client
script even though the visible browser URL stays `/chart-ai`. Neither the H route nor
`protected-preview-beta-guard.mjs` was modified — both remain zero-diff versus baseline.

### D — Owner-local UI removal

All "오너 로컬 전용" wording, local-only diagnostic buttons/cards, and dev notes are now wrapped in
`{!isVercelProductionRuntime && (...)}` / `{isVercelProductionRuntime ? (...) : (...)}` `Fragment` blocks,
so they are absent from the rendered Production DOM (not CSS-hidden). Verified via a temporary
`VERCEL_ENV=production CHART_AI_ENABLE_PRODUCTION_CHART_AI_BETA=true` dev-server simulation that no
owner-local string appears in the served HTML.

### E — Real summary presentation

The shared KIS+LLM summary card (title `MK AI 시세 요약`, support copy
`현재 조회된 시장 데이터를 기반으로 핵심 상태를 요약합니다.`) renders through the
`useProductionFacingSummaryPresentation` branch on Production: no `모델 present`/`sanitized=true`, no raw
provider names/booleans, no internal warning codes, no raw `sourceStatus`/`llmStatus`. The exact 3-line
Korean summary contract (`데이터 상태:` / `해석 범위:` / `유의사항:` labels, no ASCII digits, no
investment-advice language, no `currentPrice`/`volume` numeric exposure) is preserved unchanged.

### F — Sample chart

The sample OHLC/volume chart, its status caption (`#chartAiChartStatus` / `#chartAiChartStatusStrong`), and
its sample helper paragraph are all gated behind `{!isVercelProductionRuntime && (...)}`. Production instead
renders an honest preparing state: `실시간 종목 차트 준비 중` /
`검색 종목의 실제 OHLCV 차트는 다음 업데이트에서 연결됩니다.` — confirmed the two states never render
simultaneously.

### G — Similar pattern

The mock similar-pattern trigger card, result reveal (synthetic Top5 ranking, fixed backtest stats,
completion states), and the contradictory "유사 패턴 분석 결과" / "샘플 데이터" panel heading are all gated
behind `{!isVercelProductionRuntime && (...)}`. Production instead renders a single honest disabled/empty
state: title `유사 패턴 분석`, copy
`검색 종목의 실제 과거 OHLCV 데이터 연결 후 분석할 수 있습니다.`, with the trigger button disabled/hidden.

### H — MK AI tab

The MK AI tab's synthetic trigger card and result reveal are gated behind
`{!isVercelProductionRuntime && (...)}`. Production instead shows only the real 3-line `MK AI 시세 요약`
card as the active result, plus a preparing notice:
`실제 OHLCV 및 유사 패턴 데이터 연결 후 확장 분석이 제공됩니다.` — no second fake experience is offered.

### I — Search

The current hardcoded search list is labeled `지원 종목 검색` (unchanged from Phase 3GG-L-FAST); no
universal-coverage claim is made; the list itself was not expanded or modified this phase.

## Null-safety verification (pre-removal)

Before gating any subtree out of the Production DOM, traced:

- `renderMockedAnalysisState` (~lines 2101-2162): comprehensive early-return guard covering the entire
  similar-pattern and MK AI trigger-card/result-reveal subtrees — becomes a safe no-op when those elements
  are absent.
- `document.querySelectorAll('[data-chart-ai-analysis-trigger]').forEach(...)` (~line 2315): no-op when no
  matching elements exist.
- `setText()` (~line 1461): null-safe `getElementById` helper used by `setChartStatus()` — safe to omit
  `#chartAiChartStatus` / `#chartAiChartStatusStrong` from Production DOM.

## Local regression preflight (Task #9)

All four commands run against the live dev server after the change, confirming the Phase 3GG-M-PROD-HF1 KIS
production exception and the pre-existing local/Preview flows are unaffected by this phase's UI-only
changes:

- `owner-diagnostic:phase-3gg-k-env-hf5` → `FIXED_RUNTIME_FLAG_INJECTION_CURRENT_PRICE_READY`
- `owner-diagnostic:phase-3gg-g-fast` → `PASS: symbol=005930, sourceStatus=ok`
- `owner-diagnostic:phase-3gg-k-env-hf6` → `FIXED_LLM_RUNTIME_ENV_READY`, `llmStatus=ok`, `summary.ok=true`
- `owner-regression:phase-3gg-l-fast` → `PASS_LLM_QUALITY_REGRESSION` (exact 3-line Korean summary, no
  ASCII digits, no forbidden phrasing)

## Build result

`npm run build` → **Build PASS** (Astro build + Vercel adapter bundling + `repair-vercel-output.mjs`
postbuild step all completed cleanly, confirming the new `Fragment`/conditional JSX is syntactically valid).

## Live-runtime verification (self-directed, beyond the strict 16-step list)

Ran a temporary env-var-scoped dev server (`VERCEL_ENV=production CHART_AI_ENABLE_PRODUCTION_CHART_AI_BETA=true
npm run dev -- --port 4325`, no `.env.local` changes) to independently confirm, against actually-rendered
HTML rather than only source reading:

- Zero forbidden-string leaks in the rendered Production HTML.
- All expected Production copy present (Sections D-I above).
- Default-route signal `data-chart-ai-production-default="true"` correctly present with no query param.
- Legacy `?chartAiProdBeta=1` route still renders identically.
- Internal H-route fetch in the compiled client script still carries `chartAiProdBeta=1`.

The temporary server was torn down after verification; no `.env.local` was modified.

## Exposure and boundary status

- **Exposure status**: No exposure detected — no env value, Vercel env value, `OPENAI_API_KEY`, model name,
  prompt text, raw OpenAI request/response, raw KIS request/payload/response/error, `KIS_BASE_URL`,
  credential, token, Authorization header/cookie, or `currentPrice`/`volume` numeric value appears in the
  diff, this doc, or the changelog entry.
- **`.env` / `.env.local` / `.vercel`**: not staged, not committed, not modified this phase.
- **`.gitignore`**: not staged, not committed, not modified this phase.
- **Dependencies / lockfile**: no install performed; no lockfile diff.
- **KIS endpoints**: unchanged — `current_price` only, per Phase 3GG-M-PROD-HF1; no expansion.
- **H route / guard**: `local-only-kis-llm-summary.json.ts` and `protected-preview-beta-guard.mjs` are both
  zero-diff versus baseline this phase.

## Files changed

- `src/pages/chart-ai.astro` (source change — the only allowed source file this phase).
- `docs/planning/phase_3gg_n_fast_production_chart_ai_default_route_ui_cleanup_result_v0.1.md` (this file).
- `scripts/check_phase_3gg_n_fast_contract.mjs` (new contract checker).
- `package.json` (added `check:phase-3gg-n-fast` script entry).
- `docs/planning/planning_changelog.md` (added `## Phase 3GG-N-FAST - 2026-07-12` entry).

## Deploy and Production QA

- **Deploy method**: Vercel cloud production deploy (`vercel deploy --prod --yes`) — never local
  `vercel build --prod`, per the known OneDrive/`VERCEL=1` build-path crash. The Vercel CLI (54.9.1) was
  available and already authenticated in this environment.
- **Deploy outcome**: **PASS.** Deployment `dpl_429Z2PUhpaWeGSoWVNZeGBHc9gdP` built successfully in the
  Vercel cloud (project `sbchangkyun-2946s-projects/mkstocklab`), `readyState: "READY"`, `target:
  "production"`, aliased to `https://mkstocklab.vercel.app`.
- **Production browser QA (desktop)**: **PASS.**
  - `GET https://mkstocklab.vercel.app/chart-ai` (no query param) → `200`, served the `chart-ai.astro`
    bundle directly (confirmed via network requests, not a redirect).
  - `document.querySelector('[data-chart-ai-production-default]')` → `"true"`.
  - Zero forbidden strings found in rendered HTML (`오너 로컬`, `modelPresent`, `sanitized=true`, model
    names, `OPENAI_API_KEY`, `KIS_BASE_URL`, `Authorization: Bearer`).
  - `[data-chart-ai-analysis-state="similar-pattern"]` and `[data-chart-ai-analysis-state="mk-ai"]` (the
    mock trigger/result cards) are absent from the DOM — confirmed via `querySelector` returning `null`.
  - Legacy route `GET https://mkstocklab.vercel.app/chart-ai?chartAiProdBeta=1` confirmed via
    `window.location.href`/`search` to load with the query param intact, rendering identically to the
    default route.
  - Triggered the real `MK AI 시세 요약` fetch by clicking `#chartAiOwnerLocalKisLlmSummaryButton`: network
    request `GET /api/chart-ai/local-only-kis-llm-summary.json?chartAiProdBeta=1&symbol=005930` → `200`
    (confirms the internal H-route fetch still carries `chartAiProdBeta=1` even though the browser URL has
    no query param). The rendered result is the exact 3-line Korean summary contract (`데이터 상태:` /
    `해석 범위:` / `유의사항:` labels), states "실제 시세 수치와 원문 응답은 표시되지 않습니다"
    (actual price values and raw responses are not shown), includes the investment-advice disclaimer, and
    contains no raw `sourceStatus`/`llmStatus`/`sanitized=true`/`modelPresent`/`currentPrice`/`volume`
    numeric exposure.
  - Sample chart preparing state (`실시간 종목 차트 준비 중`), similar-pattern honest empty state
    (`검색 종목의 실제 과거 OHLCV 데이터 연결 후 분석할 수 있습니다.`), and search label
    (`지원 종목 검색`) all render as specified.
- **Production browser QA (mobile, 375px)**: **PASS.** Resized viewport to 375x812; re-verified the same
  default-route marker (`"true"`) and zero forbidden strings; `document.documentElement.scrollWidth` (375)
  equals `window.innerWidth` (375) — no horizontal overflow; page text content matches the desktop render.

## Next recommended phase

**Phase 3GG-OP-FAST** — universal search, real OHLCV chart wiring, real similarity analysis, and full MK AI
analysis, once the owner is ready to scope that data-connection work.
