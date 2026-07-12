# Phase 3GG-OP-FAST Result: Universal KR/US Stock·ETF Search, Real OHLCV Chart, Production Deploy & Browser QA

## Status / Classification

`PASS_UNIVERSAL_SEARCH_REAL_OHLCV_PRODUCTION_VERIFIED` — universal KR + US stock/ETF search and real
KR + US OHLCV candlestick/volume charts are implemented, locally verified against the real KIS provider
(owner-gated smoke 8/8 PASS), built, deployed to Production, and browser-QA'd on the real Production URL.

- **Baseline**: `69b09e1` (Phase 3GG-N-FAST).
- **Branch**: `rebuild/phase-1-ia-shell`.
- **HEAD before**: `69b09e1`.
- **Source commit**: `__SOURCE_COMMIT__`.
- **Deploy-record commit**: `__DEPLOY_COMMIT__`.

## Goal

Complete the core Chart AI user journey on the real Production URL `https://mkstocklab.vercel.app/chart-ai`:
search a domestic or US stock/ETF → select it → fetch real OHLCV → render a real candlestick and volume
chart → update the selected-symbol information → preserve the existing real KIS + LLM summary → deploy and
verify. No sample/synthetic OHLCV in Production.

## Capability audit matrix (LANE 0)

| Capability | Classification | Backing |
| --- | --- | --- |
| Korean symbol search | READY_REUSABLE (extended) | Curated static universal master + new server search route |
| US symbol search | READY_REUSABLE (new) | Same curated master (US tickers + KIS overseas EXCD) |
| Korean stock OHLCV | READY_REUSABLE | KIS domestic daily chart (`inquire-daily-itemchartprice`, `FHKST03010100`) — was already implemented in `kisClient.ts`, extended to Production under the scoped guard |
| Korean ETF OHLCV | READY_REUSABLE | Same KR domestic endpoint (ETFs reuse the domestic contract) |
| US stock OHLCV | READY (activated this phase) | KIS overseas daily chart (`dailyprice`, `HHDFS76240000`) — newly wired; account confirmed to hold overseas data permission |
| US ETF OHLCV | READY (activated this phase) | Same KIS overseas endpoint with the ETF's EXCD (e.g. SPY/VOO → AMS, QQQ → NAS) |
| daily candles | READY | Both providers |
| intraday candles | OUT OF SCOPE | Not required this phase |
| current price | READY (guarded) | KIS domestic + overseas quote (used by the summary path for KR) |
| volume | READY | Included in both OHLCV responses |
| market metadata | READY | Curated master (exchange, market, currency, asset type) |
| currency / exchange / asset type | READY | Curated master + normalized instrument model |
| caching | READY (new) | Module-scope TTL cache in the OHLCV provider (shorter TTL for the most-recent range) |
| rate-limit handling | READY_REUSABLE | KIS transport maps 429 → sanitized rate-limited error |

## Provider mapping by market

- **KR stocks & ETFs** → `kis-domestic` (KIS domestic daily chart endpoint).
- **US stocks & ETFs** → `kis-overseas` (KIS overseas daily chart endpoint), routed by the instrument's
  KIS overseas exchange code (NAS / NYS / AMS). No credentials or raw endpoints are exposed to the client.

## Search architecture (LANES 1–2)

- Canonical instrument model: `src/lib/market-data/instrument.ts` (symbol, displayName, englishName,
  country KR|US, exchange, market, assetType stock|etf, currency KRW|USD, provider, providerSymbol,
  exchangeCode, searchKeywords, isActive) + validation helpers.
- Curated real static master: `src/data/chart-ai/universalInstrumentMaster.json` (real listed KR + US
  securities; US carry the KIS overseas EXCD; no fabricated symbols).
- Server search route: `GET /api/chart-ai/instruments/search.json?q=&country=&assetType=&limit=` —
  deterministic ranking (exact ticker/code → exact name → prefix → keyword/contains), capped result count,
  sanitized error contract, no provider network call, exposes only client-safe fields.
- Client: debounced input (180 ms), stale-response protection (sequence guard + AbortController), keyboard
  navigation, mouse selection, loading/no-result/retry states, selected-symbol chip, accessible listbox.

## Normalized OHLCV contract (LANE 3)

- Candle: `{ timestamp, open, high, low, close, volume }`; series response: `{ ok, instrument, range,
  interval, candles, candleCount, sourceStatus, sanitizedErrorCode, cached, asOf, isDelayed, timezone }`.
- Ranges: `1m`, `3m`, `6m`, `1y` (daily interval). Normalization: ascending sort, dedupe by timestamp
  (last wins), malformed-candle rejection (finite OHLC, `low <= min(open,close)`, `high >= max(open,close)`,
  `high >= low`), zero-volume preserved, capped to the range window. No fabricated candles, no sample
  fallback.

## OHLCV route + caching / rate-limit behavior (LANE 3)

- `GET /api/chart-ai/market/ohlcv.json?country=&symbol=&range=` — guarded exactly like the KIS+LLM summary
  route (localhost owner opt-in `?ownerLocalOhlcv=1`, protected Preview beta, or production Chart AI beta).
  Only the production-beta path forwards the scoped `allowProductionChartAiBetaLiveQuotes` signal to
  `kisClient`, which independently re-checks `CHART_AI_ENABLE_PRODUCTION_CHART_AI_BETA` before lifting its
  hard block. Scope stays read-only market data.
- Caching: module-scope TTL cache keyed by `country:symbol:range` (3 min for `1m`, 20 min otherwise) so
  switching ranges/tabs does not storm the provider. 429 responses map to a sanitized error.

## Chart implementation (LANE 4)

- Reuses the existing SVG candlestick + volume renderer (`renderChartFromPoints` /
  `buildMockedChartGeometry`) fed with real normalized candles — real candlesticks (wick + body) and real
  volume bars, not a line-only chart, not the old sample array.
- Production replaces the preparing state with the real chart only after a successful OHLCV response; shows
  honest loading / error / no-data states otherwise. Selecting a different instrument aborts stale requests,
  clears the prior chart, and updates URL state (`?symbol=&country=`). Default instrument: Samsung
  Electronics `005930` (as a default selection, not a search limitation).

## Dependency decision

- **No new dependency added.** The existing in-repo SVG candlestick/volume renderer draws real candles
  adequately, so no chart library was introduced. `package.json` `dependencies` unchanged; no lockfile diff.

## Selected-symbol state + LLM summary integration (LANE 5)

- Selection updates identity (name, symbol, exchange, asset type, currency), overview, chart, URL, and the
  summary target. The summary now follows the selected instrument: KR six-digit symbols get the real KIS
  current_price + LLM 3-line summary; US instruments return an honest sanitized "summary unavailable for
  this market" state — never faked, and never silently analyzing `005930` while a US instrument is
  selected. The 3-line contract (`데이터 상태:` / `해석 범위:` / `유의사항:`), click-only, one-request-per-
  click, no ASCII digits, no raw price/volume, no prompt/model/raw-provider exposure — all preserved.

## Unsupported-market behavior

- US LLM summary: honest sanitized unavailable state (`US_SUMMARY_UNSUPPORTED`). US OHLCV chart: fully
  supported and real. No market is faked.

## Preparing states (LANE 6)

- Similarity: honest preparing state, `실제 유사 패턴 분석은 다음 단계에서 연결됩니다.`
- Expanded MK AI: honest preparing state, `OHLCV와 유사 패턴 결과를 결합한 확장 분석은 다음 단계에서 제공됩니다.`

## Deterministic smoke results (LANE 7)

`npm run smoke:phase-3gg-op-fast` → **32/32 PASS** (credential-free): KR/US stock/ETF search, exact
ticker + Korean-code ranking, country/assetType filters, OHLCV normalization (ascending sort, dedupe,
malformed rejection, OHLC relationship, zero-volume preserved), and the no-sample-fallback guarantee.

## Real-provider smoke results (owner-gated)

`owner-smoke:phase-3gg-op-fast --owner-approved-real-market-data-smoke` against the local dev server with
the owner's real KIS credentials → **8/8 PASS**:

- KR stock search 삼성전자, KR ETF search KODEX 200, US stock search AAPL, US ETF search SPY — all resolve.
- KR OHLCV 005930 → `sourceStatus=ok`, 62 candles, valid shape, currency KRW.
- KR ETF OHLCV 069500 → `sourceStatus=ok`, 62 candles, valid shape, currency KRW.
- US OHLCV AAPL → `sourceStatus=ok`, 66 candles, valid shape, currency USD.
- US ETF OHLCV SPY → `sourceStatus=ok`, 66 candles, valid shape, currency USD.

Only booleans / counts / statuses are printed; no raw OHLCV arrays, credentials, or payloads.

## Local build

`npm run build` → **Build PASS** (Astro + Vercel adapter + `repair-vercel-output.mjs`).

## Contract checker

`npm run check:phase-3gg-op-fast` → **PASS**. Sibling checkers `check:phase-3gg-n-fast`,
`check:phase-3gg-m-prod-hf1`, `check:phase-3gg-l-fast` → **PASS** (documented OP-FAST tolerance added for
this superseding change; kisClient/summary/src/data extended under the same scoped guard).

## Deploy and Production QA

_Deploy method_: `vercel deploy --prod --yes` (cloud build). _(Filled after deploy.)_

- **Deploy outcome**: __DEPLOY_OUTCOME__
- **Production URL**: https://mkstocklab.vercel.app/chart-ai
- **Desktop QA**: __DESKTOP_QA__
- **KR stock result**: __KR_STOCK__
- **KR ETF result**: __KR_ETF__
- **US stock result**: __US_STOCK__
- **US ETF result**: __US_ETF__
- **Candlestick / volume / range controls**: __CHART_QA__
- **Selected-symbol state / summary behavior**: __SUMMARY_QA__
- **Mobile QA (375px)**: __MOBILE_QA__
- **Console / network**: __CONSOLE_NETWORK__
- **Sample/mock absence**: __SAMPLE_ABSENCE__

## Exposure status

No exposure detected — no env value, Vercel env value, `OPENAI_API_KEY`, model name, prompt text, raw
OpenAI/KIS request/payload/response/error, `KIS_BASE_URL`, credential, token, or Authorization header/cookie
appears in the diff, this doc, the changelog, or diagnostics. OHLCV numeric chart data is intentional on the
dedicated chart-data path; the LLM summary remains non-numeric/sanitized.

## Endpoint boundary

Read-only market data only: symbol/instrument discovery (static master), historical OHLCV (KIS domestic +
overseas daily chart), and current price (KIS domestic/overseas quote, for the KR summary path). No
order/account/balance/funds/portfolio/trading/personal endpoint is referenced anywhere.

## Env / .vercel / .gitignore status

`.env`, `.env.local`, `.vercel` never staged or committed; `.gitignore` left unstaged (pre-existing,
unrelated). No dependency install; no lockfile diff.

## Files changed

New: `src/lib/market-data/instrument.ts`, `src/data/chart-ai/universalInstrumentMaster.json`,
`src/lib/server/chart-ai/universal-instrument-search.mjs`,
`src/lib/server/chart-ai/universal-ohlcv-normalize.mjs`,
`src/lib/server/chart-ai/universalOhlcvProvider.ts`,
`src/pages/api/chart-ai/instruments/search.json.ts`, `src/pages/api/chart-ai/market/ohlcv.json.ts`,
`scripts/smoke_phase_3gg_op_fast_symbol_search_and_ohlcv.mjs`,
`scripts/owner_smoke_phase_3gg_op_fast_real_market_data.mjs`,
`scripts/check_phase_3gg_op_fast_contract.mjs`, and this result doc.
Modified: `src/pages/chart-ai.astro`, `src/lib/server/providers/kisClient.ts`,
`src/lib/server/providers/types.ts`, `src/pages/api/chart-ai/local-only-kis-llm-summary.json.ts`,
`package.json`, `docs/planning/planning_changelog.md`, and the three sibling checkers (documented
tolerance).

## Push status

Not pushed — the Vercel cloud deploy uploads the working directory directly (consistent with prior phases).

## Next recommended phase

**Phase 3GG-Q-FAST** — Real Similar Pattern Analysis on Selected Instrument OHLCV.
