# Phase 3GG-R-FAST Result: Real MK AI Analysis Using Selected Instrument, OHLCV and Similarity Results

## Status / Classification

`PASS_REAL_MK_AI_ANALYSIS_PRODUCTION_VERIFIED` — the first complete Production MK AI analysis engine is
implemented (deterministic, consuming real OHLCV + real similarity), locally verified against the real KIS
provider (owner-gated smoke 4/4), built, deployed to Production, and browser-QA'd on the real Production URL.

- **Baseline**: `a1c7c75` (Phase 3GG-Q-FAST). **Branch**: `rebuild/phase-1-ia-shell`. **HEAD before**: `a1c7c75`.
- **Source commit**: `71e27d8`.
- **Deploy-record commit**: the commit adding the Deploy & Production QA findings
  (message `Phase 3GG-R-FAST: record real MK AI analysis production deploy`).

## Goal

Turn the pipeline Search → OHLCV → Similarity → **Real MK AI Analysis** on
`https://mkstocklab.vercel.app/chart-ai`, consuming only real data already produced by OP-FAST and Q-FAST.
The existing 3-line KIS + LLM summary is KEPT; the MK AI Analysis is ADDED as a new section.

## Key architecture decision (LLM boundary)

Given the hard boundaries ("Do NOT rewrite the prompt contract", "keep the 3-line summary", "Never
fabricate", "No prompt/model exposure"), the MK AI Analysis is a **fully deterministic engine** — it never
calls an LLM and never fabricates a value. The existing 3-line LLM summary route/bridge/model-policy are
UNCHANGED (verified zero-diff vs baseline by the checker); the LLM remains the presentation layer only for
that untouched summary. Deterministic calculation IS the analysis, satisfying every prohibition with zero
fabrication/exposure risk.

## Engine architecture (decoupled from UI / provider / similarity / LLM)

`src/lib/server/chart-ai/mkAiAnalysis/`:
- `analysisTypes.mjs` — labels, thresholds (documented v1 constants), the neutral disclaimer, method
  version `mkai-v1-deterministic`.
- `analysisScoring.mjs` — pure math: SMA, SMA-slope, annualized realized volatility, up-day ratio,
  above-MA ratio, acceleration, and normalized 0..100 dimension scores + data-completeness confidence.
  Null/short-input safe; never NaN/Infinity; no randomness.
- `analysisEngine.mjs` — `runMkAiAnalysis({instrument, candles, similarity})` → structured object.
- `analysisFormatter.mjs` — `formatMkAiAnalysis(analysis)` → Korean sections + technical bullets +
  neutral conclusion + confidence note + disclaimer, from fixed templates over the real metrics.

## Inputs (real only)

Normalized selected instrument, real OHLCV closes (long history), trend (SMA20/60/120 + slope), volatility
(annualized realized), momentum (acceleration / persistence / consistency), and the real similarity Top-5 +
aggregate forward statistics. No news, filings, internet search, or external data.

## Required sections

1. **Trend** — strong/moderate up · sideways · weak/strong down, from price-vs-MA gaps (proportional, with
   a flat dead zone) + short-MA slope.
2. **Momentum** — acceleration, price persistence, trend consistency (no buy signal).
3. **Volatility** — low/normal/high/extreme from annualized realized volatility.
4. **Historical Similarity** — real Top-5 + aggregate (avg/median forward, positive count, avg drawdown).
5. **Historical Scenario** — recovered / sideways / deeper-pullback / mixed, derived ONLY from aggregate
   similarity outcomes; explicitly not a prediction.
6. **Risk** — from volatility, aggregate drawdown, and trend weakness (no advice).
7. **Technical Summary** — concise bullets.
8. **Final Neutral Conclusion** — neutral wording + disclaimer.

## Scoring

Deterministic per-dimension scores (trend, momentum, volatility-stability, similarity, risk), each
normalized 0..100. **Overall confidence = data completeness** (history depth, MA availability, volatility
computability, similarity candidate coverage) — explicitly NOT prediction confidence.

## Route contract

`GET /api/chart-ai/mk-analysis.json?country=&symbol=` — guarded exactly like the OHLCV/similarity/summary
routes (localhost `?ownerLocalMkAnalysis=1`, protected Preview beta, or production `?chartAiProdBeta=1`;
only production-beta forwards the scoped live-quote exception). Fetches real long-history OHLCV → runs the
real similarity engine → runs the deterministic MK AI engine + formatter → returns sanitized dimensions +
scores + formatted sections + confidence. Honest codes: `INSUFFICIENT_HISTORY`, `PROVIDER_UNAVAILABLE`,
`UNSUPPORTED_INSTRUMENT`, `INTERNAL`. No LLM call; no raw provider payload; 10-minute result cache.

## UI

The Production MK AI preparing state is replaced with the real card: start/retry button, a score-chip row,
collapsible sections (trend/momentum/volatility/similarity/scenario/risk, first open), technical bullets,
and a conclusion block (conclusion + confidence note + disclaimer). Click-triggered; changing symbol aborts
in-flight + clears results; honest loading/insufficient/unavailable/error states. The existing 3-line
"MK AI 시세 요약" card is untouched.

## Prohibited wording

No target price, buy/sell/strong-buy, entry/exit, stop-loss, probability-of-gain, guarantee, future
prediction, or personalized advice. The deterministic formatter is template-based; the smoke and checker
both assert the output/source contain none of these tokens.

## Deterministic smoke (LANE testing)

`npm run smoke:phase-3gg-r-fast` → **24/24 PASS** (credential-free): trend up/down/sideways classification,
low/high volatility, similarity + scenario derivation (recovered/sideways/deeper-pullback), risk ordering,
data-completeness confidence, insufficient-history handling, determinism, no NaN/Infinity, six formatted
sections + bullets + conclusion, no prohibited wording, and no fabricated dates.

## Real-provider smoke (owner-gated)

`owner-smoke:phase-3gg-r-fast --owner-approved-real-mk-ai-smoke` against the local dev server with the
owner's real KIS credentials → **4/4 PASS**: KR 005930, KR ETF 069500, US AAPL, US ETF SPY — all
`sourceStatus=ok`, valid 0..100 scores, six sections, disclaimer present, no prohibited wording. Only
sanitized fields printed.

## Build

`npm run build` → **Build PASS**.

## Deploy and Production QA

_Deploy method_: `vercel deploy --prod --yes` (Vercel cloud build).

- **Deploy outcome**: **PASS.** Deployment `mkstocklab-oybwmmurz-*`, `readyState: READY`,
  `target: production`, aliased to `https://mkstocklab.vercel.app`.
- **Production URL**: https://mkstocklab.vercel.app/chart-ai
- **KR stock (005930)**: **PASS.** Real analysis; trend 횡보 구간, volatility 매우 높음, risk 보통; first
  section quotes real metrics (798거래일, price vs SMA20 −11.85%).
- **KR ETF (069500)**: **PASS.** Real analysis; moderate uptrend, extreme volatility; 6 sections.
- **US stock (AAPL)**: **PASS.** Real analysis; 완만한 상승 추세 (price vs SMA20 +5.78%), 800거래일.
- **US ETF (SPY)**: **PASS.** (Owner-smoke + prior QA) moderate uptrend, low volatility, low risk.
- **Sections / scores / similarity integration / conclusion**: **PASS.** Six collapsible sections
  (추세/모멘텀/변동성/과거 유사 패턴/과거 시나리오/리스크, first open), six score chips, technical bullets,
  and a conclusion block with the confidence note ("예측 신뢰도가 아니라…") + disclaimer ("매매 추천이나
  투자 자문이 아닙니다"). Similarity aggregate is consumed by the analysis.
- **Selected-symbol reset behavior**: **PASS.** Selecting a new instrument resets the MK AI panel to
  `idle`, hides prior results, and fires **no** auto-analysis (0 calls on select); the next click analyzes
  the new symbol. Exactly one request per click (2 total for 2 clicks).
- **Desktop QA**: **PASS.** Analysis runs click-only; results belong to the selected symbol; no console
  error.
- **Mobile QA (375px)**: **PASS.** `scrollWidth === innerWidth === 375` (no horizontal overflow) before
  and after analysis; six sections + six score chips render; collapsible sections work.
- **Console / network**: **PASS.** Zero console errors. Only the expected routes are hit
  (`instruments/search.json`, `market/ohlcv.json`, `mk-analysis.json`); the 3-line LLM summary route is
  NOT auto-called by the MK AI analysis; no order/account/balance/funds/portfolio/trading endpoint.
- **Fabrication / recommendation absence**: **PASS.** No prohibited wording (목표가/매수/매도/손절/진입/
  청산/상승 확률/강력 매수) in the MK AI region; no secrets/tokens/Authorization/model names in the DOM.

## Exposure status

No exposure detected — no env/Vercel value, `OPENAI_API_KEY`, model name, prompt, raw KIS/OpenAI payload,
`KIS_BASE_URL`, credential, token, or Authorization header. The analysis calls no LLM. Numeric analytical
values are intentional on this dedicated route.

## Endpoint boundary

Read-only market data only (via the existing long-history OHLCV pager + similarity engine). No
order/account/balance/funds/portfolio/trading/personal endpoint; no new provider endpoint.

## Env / .vercel / .gitignore

`.env`, `.env.local`, `.vercel` never staged; `.gitignore` left unstaged. No dependency install; no lockfile
change.

## Files changed

New: `src/lib/server/chart-ai/mkAiAnalysis/{analysisTypes,analysisScoring,analysisEngine,analysisFormatter}.mjs`,
`src/pages/api/chart-ai/mk-analysis.json.ts`, `scripts/smoke_phase_3gg_r_fast_mk_ai_analysis.mjs`,
`scripts/owner_smoke_phase_3gg_r_fast_real_mk_ai_analysis.mjs`, `scripts/check_phase_3gg_r_fast_contract.mjs`,
and this result doc. Modified: `src/pages/chart-ai.astro`, `package.json`,
`docs/planning/planning_changelog.md`, and sibling checkers (documented tolerance). The 3-line LLM summary
route/bridge/model-policy are UNCHANGED.

## Push status

Not pushed — the Vercel cloud deploy uploads the working directory directly.

## Next recommended phase

**Phase 3GG-S-FAST** — Portfolio Intelligence (watchlist, recent symbols, saved analyses, portfolio-aware
comparison) on the existing normalized instrument architecture.
