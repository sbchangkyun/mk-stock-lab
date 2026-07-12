# Phase 3GG-S-FAST Result: Portfolio Intelligence

## Status / Classification

`PASS_PORTFOLIO_INTELLIGENCE_PRODUCTION_VERIFIED` — a user-facing Portfolio Intelligence layer
(watchlist, recent symbols, saved analysis snapshots, manual portfolio, deterministic comparison + risk
summary, local export/import) built entirely on browser localStorage, integrated into the Chart AI page,
locally verified, built, deployed to Production, and browser-QA'd.

- **Baseline**: `85858fc` (Phase 3GG-R-FAST). **Branch**: `rebuild/phase-1-ia-shell`. **HEAD before**: `85858fc`.
- **Source commit**: `5ff0a2a`.
- **Deploy-record commit**: the commit adding the Deploy & Production QA findings
  (message `Phase 3GG-S-FAST: record Portfolio Intelligence production deploy`).

## Purpose

Add Watchlist, Recent symbols, Saved analysis snapshots, Manual portfolio, portfolio-aware comparison,
and a portfolio risk summary on top of the existing normalized-instrument / real-OHLCV / similarity /
deterministic-MK-AI architecture — with NO brokerage/account integration and manual holdings only.

## Capability audit (LANE 0)

| Capability | Classification |
| --- | --- |
| instrument serialization (OP-FAST normalized shape) | READY_REUSABLE |
| selected-symbol restoration (`updateSelection`) | READY_REUSABLE |
| localStorage abstraction | MISSING → ADDED |
| watchlist / recent / saved / manual holdings | MISSING → ADDED |
| current-price retrieval (latest daily close via OHLCV route) | READY_REUSABLE (reused, no new route) |
| multi-symbol comparison / portfolio aggregation | MISSING → ADDED |
| export/import | MISSING → ADDED |
| mobile layout / stale-result reset / corruption handling | ADDED |

## Storage architecture

Browser localStorage only (no auth/DB/Supabase). Namespaces (schemaVersion 1): `mkStockLab.watchlist.v1`,
`mkStockLab.recentSymbols.v1`, `mkStockLab.savedAnalyses.v1`, `mkStockLab.manualPortfolio.v1`. Each is a
`{ schemaVersion, updatedAt, items:[] }` envelope; every read tolerates corrupted/oversized/hostile JSON
and recovers to empty; every write is quota-safe. Modules: `schemas`, `storage`, `watchlist`,
`recentSymbols`, `savedAnalyses`, `manualPortfolio`, `portfolioMetrics`, `exportImport` (all pure `.mjs`).

## Schema versions

`SCHEMA_VERSION = 1`. Limits: watchlist 50, recent 20, saved 30, holdings 50, note 200, label 60. Stored
instrument uses the OP-FAST normalized shape; strict validators reject invalid country/asset/currency,
non-finite/non-positive quantity, negative price, oversized strings, and any summary containing a
forbidden field (prompt / model / raw payload / `candles` / `normalizedPath` / `ohlcv` / openai / bearer).

## Behavior

- **Watchlist**: add current / remove / select / clear-with-confirm / sort; dedupe; selecting updates the
  page instrument + URL + real chart and clears stale analyses; no auto analysis.
- **Recent symbols**: recorded only after a valid selection; most-recent-first; dedupe; capacity 20.
- **Saved analyses**: explicit save of the last similarity / MK AI result as a sanitized compact summary;
  labeled `저장된 분석` + `실시간 아님`; opening a snapshot calls no API; "이 종목 열기" is the only way it
  changes the selected instrument.
- **Manual portfolio**: manual add/edit/remove; one holding per country+symbol (a duplicate is an explicit
  conflict, never silently merged); per-position invested cost, market value, unrealized amount/percent,
  cost-based allocation weight within the currency bucket, price basis, data timestamp.
- **Current-price basis**: latest daily close from the existing OHLCV route on explicit refresh (batch ≤5),
  labeled `최신 종가(지연)`; missing price → `가격 정보 없음`. A daily close is never mislabeled as live.
- **KRW/USD treatment**: kept in SEPARATE currency buckets; never combined (no FX provider, no hardcoded
  rate). Totals shown per currency.
- **Comparison engine**: consumes cached deterministic scores (from analyses the user actually ran);
  instruments without cached analysis show `분석 필요` (never fabricated).
- **Risk summary**: holding/market/asset counts, per-currency cost totals + top-position concentration,
  weighted volatility/risk (where data exists), missing-data ratio, and neutral concentration notices
  (single position ≥40% of a currency bucket; one country ≥80%). ETF overlap reported as unavailable
  (never inferred from names). Neutral disclaimer; no rebalance/advice.
- **Batch refresh**: user-triggered only, ≤5 holdings per action, sequential; no polling/background loop.
- **Export/import**: user-triggered local JSON; export excludes secrets/prompt/model/raw payload/full
  OHLCV; import strictly validated (size cap, per-item re-validation, invalid entries skipped with a
  count, merge-or-cancel), no code execution.

## Performance / provider-call policy (LANE 10)

Rendering the workspace makes ZERO provider calls. Provider calls occur only on: chart load for the
selected instrument, explicit summary/similarity/MK-AI clicks, or an explicit holding price refresh
(bounded). No polling, no background refresh, stale-result protection, cache reuse.

## UI / Mobile / Accessibility

Collapsible tabbed workspace (관심종목 · 최근 조회 · 저장된 분석 · 수동 포트폴리오 · 비교·리스크) below the
single-symbol experience; empty states for every list; storage-unavailable notice; labeled form fields;
keyboard-operable tabs; confirm dialogs for destructive actions; gain/loss shown with sign text (not
color-only). Mobile 375px: horizontally scrollable tabs, stacked form, card/compact-grid layouts, no
page-level horizontal overflow.

## Deterministic smoke

`npm run smoke:phase-3gg-s-fast` → **53/53 PASS** (credential-free): watchlist add/remove/dedupe/capacity,
recent ordering/dedupe/capacity, corruption recovery, schema versioning, snapshot creation + non-live +
sanitization + deletion, holding validation + duplicate policy, native-currency totals (no KRW/USD merge),
allocation weights, unrealized calc, missing-price behavior, concentration flags, missing-analysis
behavior, export sanitization + import validation, no NaN/Infinity, and no prohibited recommendation
wording.

## Build

`npm run build` → **Build PASS**.

## Deploy and Production QA

_Deploy method_: `vercel deploy --prod --yes` (Vercel cloud build).

- **Deploy outcome**: **PASS.** Deployment `mkstocklab-d5umo75w2-*`, `readyState: READY`,
  `target: production`, aliased to `https://mkstocklab.vercel.app`.
- **Production URL**: https://mkstocklab.vercel.app/chart-ai
- **Watchlist**: **PASS.** Added 005930 + AAPL; duplicate add prevented (2 stored); select updates the
  instrument/chart; persists after reload (2 rows).
- **Recent**: **PASS.** Selecting instruments records recent (2 persisted), most-recent-first, dedupe.
- **Saved analyses**: **PASS.** Ran MK AI then saved a snapshot; card labeled `저장된 분석` + `실시간
  아님`; saving triggered **0** API calls; persists after reload (1 snapshot).
- **Manual portfolio**: **PASS.** Added a KR (005930) and a US (AAPL) holding; validation enforced;
  **separate KRW/USD totals** (USD 투자원금 1,000 / 평가액 1,576.6; KRW 투자원금 700,000 / 평가액
  2,850,000) — never combined; price basis labeled (`가격 새로고침 필요` → latest daily close after
  refresh); persists after reload (2 holdings).
- **Comparison / risk**: **PASS.** Comparison shows real scores only for the instrument whose MK AI was
  run (삼성전자); AAPL honestly shows `분석 필요` (no fabricated score). Risk summary renders concentration
  notices + neutral disclaimer, no rebalance/recommendation.
- **Provider-call behavior**: **PASS.** Rendering the workspace made **0** provider calls; watchlist/
  saved/compare actions made 0 calls; the only calls were the chart OHLCV, the click-triggered MK AI, and
  the explicit price refresh (batch = 2 ohlcv calls). No request storm; no forbidden endpoint.
- **Storage persistence / corruption**: **PASS.** All four namespaces survive reload; an injected
  corrupted `savedAnalyses` namespace recovers to an empty state without crashing the page; no secret /
  prompt / model / raw payload / full OHLCV in localStorage.
- **Mobile QA (375px)**: **PASS.** `scrollWidth === innerWidth === 375` (no horizontal overflow) before
  and after tab switching; tabs/forms/cards usable.
- **Console / network / exposure**: **PASS.** Zero console errors. Only the expected routes hit
  (`instruments/search`, `market/ohlcv`, `mk-analysis`, `similarity`); no order/account/balance/trading
  endpoint; no prohibited recommendation wording in the workspace; no credentials/tokens/model names.

## No-account/trading boundary

No KIS account/balance/funds/order/portfolio/personal endpoint; no brokerage login/account number; no
trade execution; no automatic position import — verified by the checker (no such endpoint strings; no API
route/provider change vs baseline).

## Exposure status

No exposure — no env/Vercel value, credential, token, Authorization header, prompt, model name, raw
KIS/OpenAI payload. Portfolio numeric values live only in the dedicated UI/localStorage and are never sent
to the LLM.

## Env / .vercel / .gitignore

`.env`, `.env.local`, `.vercel` never staged; `.gitignore` left unstaged. No dependency/lockfile change; no
Supabase schema change; no new API route.

## Files changed

New: `src/lib/chart-ai/portfolio-intelligence/{schemas,storage,watchlist,recentSymbols,savedAnalyses,manualPortfolio,portfolioMetrics,exportImport}.mjs`,
`scripts/smoke_phase_3gg_s_fast_portfolio_intelligence.mjs`, `scripts/check_phase_3gg_s_fast_contract.mjs`,
and this result doc. Modified: `src/pages/chart-ai.astro`, `package.json`,
`docs/planning/planning_changelog.md`, and sibling checkers (documented tolerance).

## Push status

Not pushed — the Vercel cloud deploy uploads the working directory directly.

## Next recommended phase

**Phase 3GG-T-FAST** — Market and Cross-Asset Intelligence.
