# Phase 3GJ — Live Market Dashboard — Result v0.1

Replaces the fixture-driven Home index-card snapshot and public Market page with a live market dashboard MVP
covering four tracked universes (`kospi200`/`kosdaq150`/`sp500`/`nasdaq100`), sourced entirely from real KIS
OHLCV via the existing shared orchestration (`fetchLongHistoryOhlcv`/`universalOhlcvProvider.ts`) and the
existing durable KIS token manager. **Explicitly not this phase:** any new KIS endpoint, invented index API/TR
ID, `/api/market/quote` change, account/trading API call, LLM call, second market-data provider, polling/interval
refresh, or Phase 3GK work.

## 1. Executive classification

`IMPLEMENTED_PUSHED_PREVIEW_READY_PRODUCTION_ACTIVATION_APPROVAL_PENDING`, qualified with
`DETAILED_QA_DEFERRED_BY_OWNER` — see the accompanying final report.

## 2. Product policy implemented

### 2a. Tracked-universe registry (`src/data/marketTrackedUniverses.ts`)

- Closed `MarketUniverseId` union (`kospi200`/`kosdaq150`/`sp500`/`nasdaq100`) — no `my-portfolio` or any other
  id is exposed.
- Each universe carries a `benchmarkProxy` (KOSPI200→KR/069500 KODEX 200, KOSDAQ150→KR/229200 KODEX
  코스닥150, S&P500→US/SPY, NASDAQ100→US/QQQ), always labeled explicitly as a proxy in Korean (e.g. "KOSPI200
  대표 ETF (KODEX 200)"), never as the exact index.
- Exactly 12 constituents per universe, sorted by descending `relativeWeight` (a fixed, hand-curated ranking
  value used only for treemap tile sizing — documented in-module as never live market cap), preserving sector
  diversity. Every constituent symbol/country pair was verified against
  `src/data/chart-ai/universalInstrumentMaster.json` (the same authoritative resolver `findUniversalInstrument`
  uses) before being added.
- No `baseChangePct`, no static momentum/trend score, no sample `asOf` date, no fabricated price anywhere in
  this module — only symbol/country/name/sector/relativeWeight/benchmark-proxy identity, all static metadata.

### 2b. Pure metrics module (`src/lib/market-dashboard/metrics.ts`)

- `computePeriodReturnPct`/`computeMomentum20dPct`/`computeSma60`/`computeTrendVsSma60Pct` implement the exact
  spec formulas (period return over the 1d/1w/1m/3m trading-day offsets 1/5/21/63; 20-session momentum; 60-close
  SMA trend) and return `null` — never a substituted zero — when the close history is insufficient.
- `aggregateWeightedBreadth` computes weighted/median period return, advancer/decliner/unchanged counts, and
  fresh/stale counts across a set of members: only members with a non-null `periodReturnPct` and a finite
  `relativeWeight` contribute to the weighted/median/advance-decline figures (a failed constituent is never
  treated as a zero return); `freshCount`/`staleCount` are computed over *all* members purely from `freshness`,
  independent of return resolution.
- `meetsMinimumRenderThreshold` gates rendering on `successfulCount >= 5 && coverageRatio >= 0.4`.
- `classifyOverallFreshness` derives one overall `FreshnessState` (`fresh`/`cached`/`stale-but-usable`/
  `partial`/`unavailable`) from successful count, requested count, and stale count.

### 2c. Server orchestration (`src/lib/server/marketDashboard/marketDashboard.ts`)

- `getMarketDashboard`/`getMarketOverview` both take an injectable `deps: Partial<MarketDashboardDeps>` merged
  over `defaultDeps` (`fetchLongHistoryOhlcv`, `findUniversalInstrument`, `now`), enabling fully offline,
  deterministic unit tests with no network/Supabase/KIS dependency.
- Constituent/proxy resolution is bounded to `CONCURRENCY_LIMIT = 3` simultaneous resolutions via a
  `mapWithConcurrency` worker-pool helper — never an unbounded `Promise.all` over all items — for both the
  per-universe constituent set (≤12) and the four-proxy overview.
- `classifyResultFreshness` marks a result `stale-but-usable` once its `asOf` date is more than
  `STALE_AFTER_CALENDAR_DAYS = 4` calendar days old; a failed constituent is recorded with
  `status: 'unresolved'` and `periodReturnPct: null` — never silently coerced into a zero-return record — so
  the rest of the universe can still render.
- Below the minimum-render threshold (`getMarketDashboard`) or with zero successful proxies
  (`getMarketOverview`), the service returns a sanitized `unavailable`/`MARKET_DATA_UNAVAILABLE` (or
  `MARKET_DATA_PARTIAL_BELOW_THRESHOLD`) result rather than partially-fabricated data.
- Exports the closed `MARKET_DASHBOARD_SANITIZED_ERROR_CODES` map (`VALIDATION_FAILED`,
  `MARKET_DASHBOARD_DISABLED`, `MARKET_DATA_UNAVAILABLE`, `MARKET_DATA_PARTIAL_BELOW_THRESHOLD`,
  `PROVIDER_RATE_LIMITED`) — no raw provider payload, token, header, SQL, internal error text, or Supabase
  detail is ever included in a response.
- No direct KIS transport import — the module only imports `fetchLongHistoryOhlcv` from
  `universalOhlcvProvider.ts` and `findUniversalInstrument` from the existing instrument resolver, preserving
  the required call chain: route → `marketDashboard.ts` → `universalOhlcvProvider.ts` → existing KIS provider
  transport → existing durable token manager/executor.

### 2d. Production/Preview gating

- New independent, non-secret env contract `KIS_ENABLE_PRODUCTION_MARKET_DASHBOARD`, referenced (never set or
  mutated this phase) alongside the pre-existing `KIS_ENABLE_PRODUCTION_CHART_AI_BETA` exception.
- `getKisQuoteConfigReadiness` in `src/lib/server/providers/kisClient.ts` gained a second, independently-OR'd
  scoped exception, `productionMarketDashboardExceptionAllowed`, requiring `runtimeClass === 'vercel-production'`
  AND a caller-supplied `allowProductionMarketDashboardLiveData: true` option AND
  `KIS_ENABLE_PRODUCTION_MARKET_DASHBOARD === 'true'` — all other checks (`KIS_ACCOUNT_NO` absent,
  `KIS_ENABLE_LIVE_QUOTES`, credential presence, durable-token readiness) still run unchanged, and this
  exception lifts only the Production runtime hard block, never any other gate. It does not touch
  `/api/market/quote`, Chart AI routes, Portfolio routes, or any account/trading API.
- Preview continues to obey the existing, unchanged `KIS_ENABLE_PREVIEW_LIVE_QUOTES` guard.
- When the flag is absent (the default, unset this phase): both dashboard routes fail closed with
  `MARKET_DASHBOARD_DISABLED`, zero KIS requests are made, and the UI shows a non-error unavailable state — never
  fixture numbers.

### 2e. API routes

- `GET /api/market/dashboard.json` (`universe`, `period`) and `GET /api/market/overview.json` (`period`) —
  `prerender = false`, a closed enum parser validates both query params before any service call, an unsupported
  HTTP verb is rejected via `ALL`. Success responses: `Cache-Control: public, s-maxage=60,
  stale-while-revalidate=300`. Any validation/disabled/unavailable response: `Cache-Control: no-store`. No
  Supabase-session requirement — the Market dashboard is a public experience, unlike Chart AI's authenticated
  routes.

### 2f. UI (`src/components/LiveMarketDashboard.astro`, `src/components/HomeLiveMarketSnapshot.astro`)

- `market.astro` is now a 9-line shell rendering `<LiveMarketDashboard />` — the retired fixture shell/dashboard
  are gone.
- Initial load performs exactly one `/api/market/overview.json` request and one
  `/api/market/dashboard.json` request (default universe/period) via a `setup()` function; universe/period tab
  clicks trigger exactly one additional dashboard request each, guarded by a `requestToken` staleness check so a
  slow, superseded response is discarded. No `setInterval`, no polling, no auto-loop anywhere in either
  component.
- Preserves the existing d3-hierarchy treemap + scatter SVG visualization approach, now populated from the live
  fetch response instead of the retired fixture JSON; export buttons unchanged.
- `MarketLiveQuoteCard.astro` (explicitly out of scope) is untouched and still rendered ahead of the dashboard
  section, gated by its own pre-existing `KIS_ENABLE_MARKET_QUOTE_CARD` flag.
- `HomeLiveMarketSnapshot.astro` replaces `HomeIndexCards.astro`, performing exactly one
  `/api/market/overview.json?period=1d` fetch per page load (plus Astro view-transition re-init), rendering a
  non-error `data-home-snapshot-unavailable` fallback on any non-ok/malformed response instead of fixture
  numbers.

## 3. Fixture retirement (spec §4/§17)

Removed: `src/components/MarketShell.astro`, `src/components/MarketFixtureDashboard.astro`,
`src/data/marketTreemapSamples.ts`, `src/data/marketFixtureDashboard.json`, `src/components/HomeIndexCards.astro`,
`src/data/homeIndexCards.json`. Confirmed zero remaining code references to any of the six retired
files/exports (a single doc-comment in `HomeLiveMarketSnapshot.astro` names the fixture it replaces, not an
import). Static metadata (symbol/country/name/sector/relative weight/benchmark-proxy identity) was carried
forward into `marketTrackedUniverses.ts`; sample `asOf` dates, static `baseChangePct`, multiplier-generated
returns, static momentum/trend scores, and "예시 데이터" labels were **not** carried forward anywhere.
`MarketLiveQuoteCard.astro` (separate, already-real, already-gated) was left untouched throughout.

## 4. New server/data surface

- `src/data/marketTrackedUniverses.ts` — closed tracked-universe registry (§2a).
- `src/lib/market-dashboard/metrics.ts` — pure calculation module (§2b).
- `src/lib/market-dashboard/formatters.ts` — display-string formatting for period returns/momentum/trend/as-of
  dates, consumed by both the dashboard and overview UI.
- `src/lib/server/marketDashboard/marketDashboard.ts` — `getMarketDashboard`/`getMarketOverview` orchestration
  (§2c).
- `src/pages/api/market/dashboard.json.ts`, `src/pages/api/market/overview.json.ts` — API routes (§2e).
- `src/components/LiveMarketDashboard.astro`, `src/components/HomeLiveMarketSnapshot.astro` — UI (§2f).
- `src/lib/server/providers/kisClient.ts` — extended readiness gate (§2d), no other behavior change.

## 5. Tests

- `scripts/market_dashboard_testsrc.ts` + `scripts/smoke_phase_3gj_live_market_dashboard.mjs`
  (`npm run smoke:phase-3gj-live-market-dashboard`) — **118/118** pure-function/deterministic-dependency-injection
  checks across 11 groups: metrics formulas (including insufficient-history null cases), weighted breadth
  aggregation, minimum-render-threshold + freshness classification, formatters, tracked-universe registry
  shape, `getMarketDashboard` across 8 injected-dependency scenarios (full success, partial failure, below
  threshold, stale, disabled, validation failure), and `getMarketOverview` across 3 scenarios (full success,
  partial failure, total failure → `MARKET_DATA_UNAVAILABLE` with every proxy marked unavailable, none
  fabricated).
- `scripts/check_phase_3gj_live_market_dashboard_contract.mjs` (`npm run check:phase-3gj-live-market-dashboard`)
  — **112/112** static contract assertions across 11 groups: file existence; tracked-universe closed contract;
  pure metrics module; display formatters; server orchestration boundary (no direct KIS import, concurrency
  limit, sanitized error codes, never-zero-coerced failures, `getMarketOverview` resolves only the four registry
  benchmark proxies); Production/Preview gating; API routes' closed query contract; client UI behavior
  (`LiveMarketDashboard` + `HomeLiveMarketSnapshot`: single-request initial load, no polling, requestToken
  staleness guard); fixture retirement; no prohibited surface (no new KIS endpoint, no account/trading call, no
  LLM call, no second provider, no `my-portfolio` exposure); `package.json` wiring.

## 6. Regression gate list — this phase's run

| Gate | Result | Notes |
|---|---|---|
| `smoke:phase-3gj-live-market-dashboard` | 118/118 PASS | new |
| `check:phase-3gj-live-market-dashboard` | 112/112 PASS | new |
| `smoke:phase-3gi-user-retention-persistence` | 35/35 PASS | unaffected |
| `check:phase-3gi-user-retention-persistence` | 149/149 PASS | unaffected |
| `smoke:phase-3gh-portfolio-live-valuation-mvp` | 55/55 PASS | unaffected |
| `check:phase-3gh-portfolio-live-valuation-mvp` | 86/86 PASS | unaffected |
| `npm ls --depth=0` | clean | no dependency issues |
| `npm run build` | clean | Astro + Vite server build completed, no errors |
| `git diff --check` | clean (exit 0) | no whitespace/conflict-marker issues |

No `check:market-fixture-chart` or `check:home-index-cards`/`check:home-index-sparkline` run was attempted —
those checkers assert against the now-intentionally-removed fixture files and components by design; they are
superseded by this phase, not a regression, and are tracked for retirement/rewrite in the checker-suite-
consolidation lane (see roadmap §5.1).

## 7. Scope discipline

No migration authored or applied (this phase introduces no schema change). No merge. No Production deploy. No
Production/Preview environment variable set or mutated (`KIS_ENABLE_PRODUCTION_MARKET_DASHBOARD` is referenced
only). No new KIS endpoint, invented index API, or TR ID. No `/api/market/quote` change. No account/trading API
call. No LLM call. No second market-data provider. No Phase 3GK work started. `feature/phase-3gj-live-market-
dashboard` branch, created from `origin/main` at `16eee948c0ce34f5b92394e98b3527e5545bf4a7` (the Phase 3GI-HF2
merge commit), not yet pushed as of this document.

## 8. Owner-only items (not performed by this phase)

- Review and, if approved, set `KIS_ENABLE_PRODUCTION_MARKET_DASHBOARD=true` in Production (not performed by
  this assistant per explicit instruction).
- Signed-out/public manual QA of the Market dashboard and Home live snapshot on Preview across the four
  universes and four periods, plus mobile viewport and treemap/scatter export.
- Decide whether to merge the Phase 3GJ PR (not performed by this phase per explicit instruction).
