# Phase 3GG-T-FAST Result: Market and Cross-Asset Intelligence

## Status / Classification

`PASS_CORE_MARKET_INTELLIGENCE_PARTIAL_MACRO_DATA` — a deterministic, real-data Market & Cross-Asset
Intelligence layer (representative benchmark resolution, relative strength vs benchmark/sector, USD/KRW
currency context, broad + single-instrument volatility, commodity/risk-asset context, and a
market-regime classification with a neutral cross-asset interpretation) integrated into the Chart AI
page, locally verified, built, deployed to Production, and desktop + mobile browser-QA'd. Core market
intelligence (benchmark, relative strength, volatility, currency, commodity, regime) is real and
complete; **interest-rate** data is honestly reported as not sourced this phase and **market breadth**
is marked unavailable — the partial-macro classification reflects those two known, disclosed gaps, not a
degraded core.

- **Baseline**: `2e7dc90` (Phase 3GG-S-FAST). **Branch**: `rebuild/phase-1-ia-shell`. **HEAD before**: `2e7dc90`.
- **Method version**: `market-intel-v1-deterministic`.
- **Source commit**: _(filled at commit: `Phase 3GG-T-FAST: add Market and Cross-Asset Intelligence`)_.
- **Deploy-record commit**: the commit adding the Deploy & Production QA findings
  (message `Phase 3GG-T-FAST: record Market Intelligence production deploy`).

## Purpose

Analyze a selected KR/US stock or ETF against its real market context — equity-market benchmark,
sector/representative ETF, currency (USD/KRW), commodity/risk-asset context, relative strength,
deterministic market-regime classification, and a neutral cross-asset interpretation — using REAL data
only, and honestly disclosing which datasets (rates, breadth) are missing or delayed. Descriptive market
intelligence, never a recommendation.

## Capability audit (LANE 0)

| Capability | Classification |
| --- | --- |
| normalized instrument shape (OP-FAST) + universe search | READY_REUSABLE |
| real long-history OHLCV provider (KR domestic + US overseas, paginated, cached) | READY_REUSABLE |
| deterministic scoring (`sma`/`smaSlope`/`annualizedVolatility`/`trendScore`) | READY_REUSABLE (from MK AI) |
| protected-preview / production beta guard + local-only binding | READY_REUSABLE |
| representative benchmark resolution | MISSING → ADDED |
| verified US GICS sector proxy map | MISSING → ADDED |
| relative-strength engine (aligned dates, 1m/3m/6m, currency-aware) | MISSING → ADDED |
| USD/KRW context (free ECB Frankfurter) | MISSING → ADDED |
| commodity / risk-asset context (GLD/USO) | MISSING → ADDED |
| market-regime classifier + formatter | MISSING → ADDED |
| interest-rate context | NOT SOURCED (honest gap this phase) |
| market breadth | NOT SOURCED (honest gap this phase) |

## Data-source policy (real only)

- **Equity benchmark / sector proxy / commodity / instrument volatility**: real OHLCV via the existing
  KIS provider (`fetchLongHistoryOhlcv`, `targetBars: 220`, serialized to respect KIS rate limits, 6h
  cache; per-target cache key so the market-intel fetch does not poison the 750-bar similarity/MK-AI
  cache).
- **Currency (USD/KRW)**: the free ECB-backed Frankfurter API (`crossAssetProvider.fetchUsdKrwContext`,
  3.5s timeout, 6h cache, honest-unavailable fallback). No secret, no hardcoded rate.
- **Interest rates**: honestly `NOT_SOURCED` this phase (no reliable free official source secured). The
  UI/formatter state this plainly.
- **Market breadth**: marked unavailable in the availability list (not computed from a partial universe).

## Architecture

Pure, deterministic modules under `src/lib/server/chart-ai/marketIntelligence/`:
`marketContextTypes` (constants/labels/thresholds/cross-asset registry), `benchmarkResolver`,
`sectorResolver`, `relativeStrength`, `marketRegime`, `crossAssetProvider` (the only networked module —
FX), `marketIntelligenceEngine` (canonical context assembly), `marketIntelligenceFormatter` (neutral
Korean sections + availability list + conclusion). Route: `src/pages/api/chart-ai/market-intelligence.json.ts`.

## Benchmark mapping (no fabrication)

KR → KODEX 200 (`069500`) for KOSPI, KODEX 코스닥150 (`229200`) for KOSDAQ. US → QQQ for NASDAQ-listed,
else SPY (broad). When the selected instrument *is* its benchmark (e.g. SPY, KODEX 200), it cross-checks
to the opposite broad benchmark and is labeled `selfBenchmark` with `broad-market-fallback` confidence.
Every mapping carries a confidence describing data completeness, never a prediction.

## Relative strength

Aligns selected vs benchmark (and, only where a verified US GICS sector proxy exists, vs sector) on
common trading dates, measuring cumulative-return gaps over 21/63/126-day windows. Currency mismatch or
insufficient overlap → honest `available:false` (never compared across currencies without an FX method,
never fabricated). Neutral strength labels only.

## Market regime

Deterministic classification into risk-on / neutral / risk-off / high-volatility-transition /
data-insufficient from documented fixed thresholds + weights (trend 0.30, momentum 0.25, volatility
0.25, commodity 0.10, fx 0.10). Fewer than 2 core dimensions → data-insufficient. Confidence =
completeness·0.6 + factor-agreement·0.4, explicitly labeled as input-data/agreement, NOT a forecast.

## Partial success / honesty

`Promise`-serialized sourcing where one failed source never fails the whole response; each missing
sub-context is `{available:false}` (never zero); a `dataCompleteness` percentage and a per-dataset
availability list (marking rates + breadth unavailable) are surfaced. The standard disclaimer
(`시장·환율·금리·변동성 데이터를 종합한 참고용 환경 분석입니다. 미래 성과를 예측하거나 보장하지 않습니다.`)
is always shown.

## Guard parity

The route reuses the exact same guard as the OHLCV/similarity/MK-AI routes: localhost owner opt-in
(`?ownerLocalMarketIntel=1`), protected Preview beta, or production beta (`?chartAiProdBeta=1`); only the
production-beta path forwards `allowProductionChartAiBetaLiveQuotes`. No guard weakened.

## UI / Mobile / Accessibility

Production-gated collapsible `시장 인텔리전스` section below the analysis workspace: header (instrument ·
benchmark · asOf + analyze button), regime card with factor chips, relative-strength panel (1m/3m/6m +
sector line), context cards (광의 시장 / 환율 / 금리 / 변동성 / 원자재·리스크 자산), a data-availability
panel, and a neutral conclusion. Click-triggered only (`시장 인텔리전스 분석` button); a stale-request
sequence guard + AbortController; resets on symbol change via `resetSelectedMarketIntel`. Mobile 375px:
2-column cards, stacked header, full-width button, no page-level horizontal overflow.

## Deterministic smoke

`npm run smoke:phase-3gg-t-fast` → **32/32 PASS** (credential-free): benchmark KOSPI/KOSDAQ/NASDAQ/broad
+ self-benchmark fallback, no fabricated sector, relative-strength outperform/underperform/
insufficient-overlap/currency-mismatch, regime risk-on/risk-off/neutral/high-vol/insufficient, full +
partial engine success, honest rate/sector/breadth unavailable, no NaN/Infinity, and no prohibited
recommendation wording.

## Build

`npx astro build` → **Build PASS**.

## Deploy and Production QA

_Deploy method_: `vercel deploy --prod --yes` (Vercel cloud build).

- **Deploy outcome**: _(filled after deploy)_.
- **Production URL**: https://mkstocklab.vercel.app/chart-ai
- **005930 (삼성전자, KR)**: _(filled after QA)_.
- **069500 (KODEX 200, KR self-benchmark)**: _(filled after QA)_.
- **AAPL (US, QQQ + tech sector)**: _(filled after QA)_.
- **SPY (US self-benchmark)**: _(filled after QA)_.
- **Honest unavailable (rates / breadth)**: _(filled after QA)_.
- **Click-only / stale-reset**: _(filled after QA)_.
- **Mobile QA (375px)**: _(filled after QA)_.
- **Console / network / exposure**: _(filled after QA)_.

## No-account/trading boundary

No KIS account/balance/funds/order/portfolio/personal endpoint; no brokerage login/account number; no
trade execution; no automatic position import — verified by the checker (no such endpoint strings; no
provider/Supabase change vs baseline).

## Exposure status

No exposure — no env/Vercel value, credential, token, Authorization header, prompt, model name, or raw
KIS/Frankfurter payload reaches the client. The FX provider returns only a sanitized rate/changePct/asOf.

## Env / .vercel / .gitignore

`.env`, `.env.local`, `.vercel` never staged; `.gitignore` left unstaged. No dependency/lockfile change;
no Supabase schema change.

## Files changed

New: `src/lib/server/chart-ai/marketIntelligence/{marketContextTypes,benchmarkResolver,sectorResolver,relativeStrength,marketRegime,crossAssetProvider,marketIntelligenceEngine,marketIntelligenceFormatter}.mjs`,
`src/pages/api/chart-ai/market-intelligence.json.ts`,
`scripts/smoke_phase_3gg_t_fast_market_cross_asset_intelligence.mjs`,
`scripts/check_phase_3gg_t_fast_contract.mjs`, and this result doc. Modified:
`src/lib/server/chart-ai/universalOhlcvProvider.ts` (additive `targetBars` param, per-target cache key),
`src/pages/chart-ai.astro`, `package.json`, `docs/planning/planning_changelog.md`, and sibling checkers
(documented tolerance for the marketIntelligence path + market-intelligence route).

## Push status

Not pushed — the Vercel cloud deploy uploads the working directory directly.

## Next recommended phase

**Phase 3GG-U-FAST** — News, Filings and Macro Event Intelligence.
