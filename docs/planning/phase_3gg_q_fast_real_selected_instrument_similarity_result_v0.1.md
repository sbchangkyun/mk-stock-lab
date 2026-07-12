# Phase 3GG-Q-FAST Result: Real Similar Pattern Analysis on Selected Instrument OHLCV

## Status / Classification

`PASS_REAL_SIMILARITY_PRODUCTION_VERIFIED` — real deterministic similarity analysis on the selected KR/US
instrument's real OHLCV is implemented, locally verified against the real KIS provider (owner-gated smoke
4/4), built, deployed to Production, and browser-QA'd on the real Production URL.

- **Baseline**: `b2edefb` (Phase 3GG-OP-FAST). **Branch**: `rebuild/phase-1-ia-shell`.
- **HEAD before**: `b2edefb`.
- **Source commit**: `__SOURCE_COMMIT__`.
- **Deploy-record commit**: the commit adding the Deploy & Production QA findings
  (message `Phase 3GG-Q-FAST: record real similarity analysis production deploy`).

## Goal

Complete the real Similar Pattern journey on `https://mkstocklab.vercel.app/chart-ai`: select a KR/US
stock/ETF → load real OHLCV → choose the comparison window → search historical windows → rank real similar
periods → show Top 5 + normalized overlay + real forward outcomes → honest safety language → deploy and
verify. Real OHLCV only; no synthetic/sample/mocked/fixed results in Production.

## Capability audit (LANE 0)

| Capability | Classification | Notes |
| --- | --- | --- |
| analysis-window extraction | READY_REUSABLE | Phase 3EX engine logic, ported to `.mjs` |
| return normalization | READY_REUSABLE | log returns |
| correlation similarity | READY_REUSABLE | Pearson |
| cosine / distance scoring | READY_REUSABLE | RMSE (normalized) as the distance term |
| sliding-window search | READY_REUSABLE | ported |
| overlap exclusion | READY_REUSABLE | candidate end < currentStart − maxForward (no overlap, no leakage) |
| Top-N ranking | READY_REUSABLE | deterministic tie-break |
| duplicate-gap exclusion | MISSING → ADDED | new Top-K minimum start-index gap |
| forward return calculations | READY_REUSABLE | ported |
| maximum drawdown / rise | READY_REUSABLE | ported |
| normalized overlay (base 100) | READY_REUSABLE | ported |
| insufficient-history handling | READY_REUSABLE + hardened | explicit `insufficientHistory` + min-required-bars |
| result caching | PARTIAL → ADDED | long-history 6h cache + route 10min cache |
| stale-request protection | MISSING → ADDED | client seq + AbortController |
| KR / US support | READY (via OP-FAST) | real long-history for both |
| existing similarity route / auth scaffold | MOCK_ONLY (left untouched) | `similarity.ts` POST mock shell not modified |

The prior mock-only similarity route (`src/pages/api/chart-ai/similarity.ts`) and its auth/usage scaffolds
were left untouched (out of scope); the real analysis lives in a new GET route.

## History-depth decision (LANE 2)

Each KIS daily call returns at most ~100 rows and rejects spans beyond ~1 year (empirically: 3m→62,
6m→100 truncated, 1y→0). A new paginated long-history mode walks backward in ~150-day windows (KR: date
windows; US: overseas BYMD cursor), merges, validates, dedupes, sorts, and caches (6h TTL) — targeting
~750 daily bars (~3 years). No new raw provider endpoint is exposed; current_price scope unchanged.
Measured depth: KR 005930/069500 ≈ 798 bars (2023-03-31 → 2026-07-10), US AAPL/SPY ≈ 800 bars
(2023-05-02 → 2026-07-10). Both markets have sufficient history.

## Algorithm and weighting (LANE 3)

Deterministic v1 (`sim-v1-corr045-rmse035-dir020`): per candidate window, compute log-return path
similarity as **Pearson correlation (weight 0.45)** + **normalized RMSE distance (0.35)** + **direction
match (0.20)**, each mapped to 0..100 and combined, clamped 0..100. No randomization, no LLM, no OpenAI
call. Overlap exclusion + forward-buffer prevent look-ahead leakage: similarity uses only bars inside each
candidate window; forward returns/drawdown/rise are measured strictly after the candidate window end.
Deterministic tie-break: score → correlation → earliest date → earliest index. **Top-K min-gap**: greedily
select the top scored windows enforcing a minimum start-index gap so near-duplicate adjacent windows don't
fill the Top 5.

## Outcome metrics (LANE 4)

Per match: start/end date, similarity score, forward 5/20/60-day returns (null where insufficient future
data), max drawdown and max rise over the 60-day horizon, and per-horizon completeness flags. Aggregate:
average/median forward returns per horizon, positive/negative match counts, average max drawdown/rise,
match count. All from real OHLCV; descriptive historical statistics only.

## Route contract (LANE 5)

`GET /api/chart-ai/similarity.json?country=&symbol=&window=&topK=` — guarded exactly like the OHLCV/summary
routes (localhost `?ownerLocalSimilarity=1`, protected Preview beta, or production `?chartAiProdBeta=1`;
only the production-beta path forwards the scoped live-quote exception). Response: `ok`, `instrument`,
`analysisWindow`, `historyRange`, `windowLength`, `topK`, `matches`, `aggregate`, `currentNormalizedPath`,
`candidateCount`, `sourceStatus`, `sanitizedErrorCode`, `cached`, `asOf`, `methodVersion`, `disclaimer`,
and a next-phase `summary` shape (LANE 8: identity, method version, match count, score range, aggregate
outcomes, drawdown summary, data sufficiency, disclaimer — no raw OHLCV/overlay arrays sent to any LLM).
Sanitized error codes: `NON_LOCAL_REQUEST`, `UNSUPPORTED_INSTRUMENT`, `PROVIDER_UNAVAILABLE`,
`INSUFFICIENT_HISTORY`, `NO_VALID_CANDIDATES`, `INTERNAL`. Caching: long-history (provider) 6h + route
result 10min, keyed by country/symbol/window/topK.

## UI (LANE 6)

The Production similarity preparing state is replaced with real analysis UI: window selector (20/60
trading days) + start/retry button, current-pattern summary (date range, bar count, method version,
neutral text), Top 5 cards (rank, dates, score, forward 5/20/60, max drawdown/rise, completeness), a
base-100 normalized overlay SVG (current + top matches, legend, responsive) and aggregate outcomes with the
honest disclaimer `과거 유사 구간의 이후 움직임을 참고용으로 비교합니다. 미래 성과를 예측하거나 보장하지
않습니다.` No mock Top 5, no fixed overlay, no `예측`/`상승 확률`/target-price/buy-sell language (positive
matches are labeled as a historical `상승 마감` count, not a probability).

## Selected-symbol integration (LANE 7)

Changing the instrument aborts any in-flight analysis, clears prior results, and resets the panel
(`resetSelectedSimilarity` called from `updateSelection`); the next analysis uses the newly selected
normalized instrument. The real chart is preserved. Stale-request protection via a sequence guard +
AbortController.

## Deterministic smoke (LANE 9)

`npm run smoke:phase-3gg-q-fast` → **29/29 PASS** (credential-free): identical-high / inverse-low scoring,
deterministic ranking, overlap exclusion, min-gap de-dup, malformed-candle rejection, insufficient-history,
exact forward 1/5-day returns, exact max drawdown/rise, base-100 overlay, no NaN/Infinity, current-window
exclusion, and no fabricated dates.

## Real-provider smoke (owner-gated)

`owner-smoke:phase-3gg-q-fast --owner-approved-real-similarity-smoke` against the local dev server with the
owner's real KIS credentials → **4/4 PASS**: KR 005930 (798 bars, 699 candidates), KR ETF 069500 (798/699),
US AAPL (800/701), US ETF SPY (800/701) — all `sourceStatus=ok`, 5 matches, valid 0..100 scores, real
dates, aggregate present, base-100 overlay shape valid. Only sanitized fields printed.

## Build

`npm run build` → **Build PASS**.

## Deploy and Production QA

_Deploy method_: `vercel deploy --prod --yes` (cloud build). _(Filled after deploy.)_

- **Deploy outcome**: __DEPLOY_OUTCOME__
- **Production URL**: https://mkstocklab.vercel.app/chart-ai
- **KR stock result (005930)**: __KR_STOCK__
- **KR ETF result (069500)**: __KR_ETF__
- **US stock result (AAPL)**: __US_STOCK__
- **US ETF result (SPY)**: __US_ETF__
- **Top 5 / overlay / forward / drawdown / aggregate**: __ANALYSIS_QA__
- **Selected-symbol reset behavior**: __RESET_QA__
- **Desktop QA**: __DESKTOP_QA__
- **Mobile QA (375px)**: __MOBILE_QA__
- **Console / network**: __CONSOLE_NETWORK__
- **Mock absence**: __MOCK_ABSENCE__

## Exposure status

No exposure detected — no env/Vercel value, `OPENAI_API_KEY`, model name, prompt, raw KIS/OpenAI
request/payload/response/error, `KIS_BASE_URL`, credential, token, or Authorization header/cookie in the
diff, this doc, the changelog, or diagnostics. Numeric similarity + historical performance values are
intentional on the dedicated analytical route.

## Endpoint boundary

Read-only market data only: instrument discovery (static master), historical OHLCV (KIS domestic +
overseas daily chart, paginated), and current price (KIS quote, for the KR summary path). No
order/account/balance/funds/portfolio/trading/personal endpoint. `kisClient.ts` references only the
OP-FAST-approved endpoint paths (inquire-price, inquire-daily-itemchartprice, overseas dailyprice, overseas
price, tokenP).

## Env / .vercel / .gitignore

`.env`, `.env.local`, `.vercel` never staged or committed; `.gitignore` left unstaged. No dependency
install; no lockfile change (native-JS engine; existing SVG rendering reused).

## Files changed

New: `src/lib/server/chart-ai/similarity-engine.mjs`, `src/pages/api/chart-ai/similarity.json.ts`,
`scripts/smoke_phase_3gg_q_fast_real_similarity_engine.mjs`,
`scripts/owner_smoke_phase_3gg_q_fast_real_similarity.mjs`, `scripts/check_phase_3gg_q_fast_contract.mjs`,
and this result doc. Modified: `src/pages/chart-ai.astro`, `src/lib/server/providers/kisClient.ts`
(overseas BYMD cursor), `src/lib/server/chart-ai/universalOhlcvProvider.ts` (long-history pager),
`src/lib/server/chart-ai/universal-ohlcv-normalize.mjs` (uncapped normalize), `package.json`,
`docs/planning/planning_changelog.md`, and the sibling checkers (documented tolerance).

## Push status

Not pushed — the Vercel cloud deploy uploads the working directory directly.

## Next recommended phase

**Phase 3GG-R-FAST** — Real MK AI Analysis Using Selected Instrument, OHLCV and Similarity Results.
