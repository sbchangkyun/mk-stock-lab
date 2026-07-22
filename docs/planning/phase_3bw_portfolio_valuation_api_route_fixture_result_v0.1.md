# Phase 3BW — Portfolio Valuation API Route with Fixture/Mocked Quotes Result v0.1

## 1. Title and Metadata

- **Phase**: 3BW
- **Type**: Portfolio Valuation API Route with Fixture/Mocked Quotes
- **Status**: Implemented
- **Latest prior commit**: 9d7993d test: add mocked kis valuation contract
- **Runtime UI changes**: none
- **API route changes**: yes — `POST /api/portfolio/valuation` (fixture-only)
- **DB / Supabase changes**: none
- **Live KIS calls**: none
- **Live GNews calls**: none
- **Deployment**: not performed

---

## 2. Objective

This phase adds a project-owned portfolio valuation API route at `POST /api/portfolio/valuation`. The route is backed exclusively by synthetic fixture quote data and uses the `buildPortfolioValuationFromQuotes` server helper from Phase 3BV. No live KIS calls, no Supabase, no DB access, and no UI runtime changes are made. The route prepares the system for future Portfolio UI valuation integration (Phase 3BX) without enabling any live provider connectivity.

---

## 3. Route Contract

### Route

- **Path**: `POST /api/portfolio/valuation`
- **Method**: `POST` (returns 405 for `GET`)

### Request body (JSON)

```json
{
  "portfolioId": "string (required, non-empty)",
  "baseCurrency": "KRW | USD",
  "positions": [
    {
      "id": "(optional) string",
      "symbol": "string (required, non-empty)",
      "market": "KR | US",
      "assetType": "stock | etf",
      "buyPrice": "number >= 0",
      "quantity": "number > 0",
      "currency": "KRW | USD",
      "name": "(optional) string | null",
      "buyDate": "(optional) string | null",
      "memo": "(optional, ignored)"
    }
  ],
  "source": "(optional) 'fixture' — defaults to 'fixture' if absent"
}
```

Limits: maximum 100 positions per request.

### Success response

```json
{
  "ok": true,
  "data": {
    "portfolioId": "string",
    "baseCurrency": "KRW | USD",
    "source": "fixture",
    "valuation": {
      "scope": "single",
      "portfolioId": "string",
      "rows": [...],
      "totalCostBasis": "number",
      "totalMarketValue": "number | null",
      "totalUnrealizedPnl": "number | null",
      "baseCurrency": "KRW | USD",
      "staleState": "fresh | stale-but-usable | unavailable"
    },
    "meta": {
      "quoteSource": "fixture",
      "liveAttempted": false,
      "rawProviderStored": false,
      "generatedAt": "ISO 8601 string",
      "unsupportedSymbols": ["..."],
      "missingQuoteSymbols": ["..."]
    }
  }
}
```

### Error response

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_FAILED | METHOD_NOT_ALLOWED | UNSUPPORTED_SOURCE | INTERNAL_ERROR",
    "message": "safe public message"
  },
  "meta": {
    "liveAttempted": false,
    "rawProviderStored": false
  }
}
```

### Supported source

- `source=fixture` (default when absent)

### Unsupported source behavior

- `source=live` → HTTP 400, code `UNSUPPORTED_SOURCE`
- `source=auto` → HTTP 400, code `UNSUPPORTED_SOURCE`
- Any other non-fixture value → HTTP 400, code `UNSUPPORTED_SOURCE`

### Method-not-allowed behavior

- `GET /api/portfolio/valuation` → HTTP 405, code `METHOD_NOT_ALLOWED`

### Validation errors

- HTTP 400, code `VALIDATION_FAILED`
- Triggers: missing/invalid portfolioId, invalid baseCurrency, non-array positions, >100 positions, invalid position fields

### Internal error

- HTTP 500, code `INTERNAL_ERROR`, message: `Portfolio valuation failed safely.`
- Raw error message, stack trace, and thrown exception details are never forwarded.

---

## 4. Fixture Quote Policy

- **Fixture-only**: all quotes are resolved from synthetic in-memory data in `portfolioValuationFixture.ts`.
- **Synthetic data only**: prices are NOT real market data, NOT real current prices. These are example values for Phase 3BW development and testing only.
- **No raw provider payload**: fixture objects do not contain `providerMeta`, `stck_prpr`, `rt_cd`, or any raw KIS response fields.
- **No credentials**: no API key, appkey, appsecret, access_token, or authorization header values appear anywhere in fixture data.
- **No provider URL**: no live provider URLs in fixture data.
- **liveAttempted: false** in every response.
- **rawProviderStored: false** in every response.
- **Missing symbol behavior**: any symbol not in the fixture map resolves to `null` quote; the position still appears in the response with `costBasis` available and all quote-backed fields null.

### Fixture symbols (KR only, synthetic)

| Symbol | Synthetic price | Currency | staleState |
|---|---|---|---|
| `005930` | 73000 KRW | KRW | `fresh` |
| `000660` | 198000 KRW | KRW | `fresh` |
| `035420` | 185000 KRW | KRW | `stale-but-usable` |
| `069500` | 34000 KRW | KRW | `fresh` |

---

## 5. Valuation Behavior

### Position-level

| Field | Condition |
|---|---|
| `costBasis` | Always available (`buyPrice × quantity`) |
| `currentPrice` | Quote.price from fixture, or `null` if no fixture match |
| `marketValue` | `currentPrice × quantity`, or `null` if no quote |
| `unrealizedPnl` | `marketValue - costBasis`, or `null` if no quote |
| `unrealizedPnlPct` | `unrealizedPnl / costBasis × 100`, or `null` if no quote or costBasis = 0 |
| `staleState` | From fixture quote (`fresh`/`stale-but-usable`), or `unavailable` if no quote |

### Portfolio-level

| Condition | `totalMarketValue` | `totalUnrealizedPnl` | `staleState` |
|---|---|---|---|
| All quoted, same currency, all fresh | Computed | Computed | `fresh` |
| All quoted, same currency, some stale | Computed | Computed | `stale-but-usable` |
| Partial coverage (some quotes missing) | `null` | `null` | `stale-but-usable` |
| No quotes available | `null` | `null` | `unavailable` |
| Mixed currencies (KRW + USD) | `null` | `null` | Depends on coverage |

### Partial coverage

`totalMarketValue` is `null` when any position lacks a fixture quote. Each quoted position still contributes its individual computed fields.

### Unavailable quote

Position with unknown/unsupported symbol receives all quote-backed fields as `null`. `costBasis` is always computed.

### Unsupported symbols

US market positions have no fixture quote (fixture covers KR domestic only). They are treated as quote-unavailable. Symbol appears in `meta.missingQuoteSymbols` and `meta.unsupportedSymbols`.

---

## 6. Currency and FX Behavior

- **Same-currency aggregation** (all KRW or all USD): `totalMarketValue` is computed by `buildPortfolioValuationFromQuotes` when all positions have quotes and all share the `baseCurrency`.
- **Mixed-currency** (KRW + USD positions): `totalMarketValue` remains `null` because FX conversion is not implemented. No exchange rates are fabricated.
- **FX provider**: deferred to a future phase.
- **`baseCurrency: 'MIXED'`**: not returned by this route since requests specify a single `baseCurrency`.

---

## 7. Public Safety Contract

| Invariant | Status |
|---|---|
| `providerMeta` absent from all route responses | Confirmed — `PortfolioValuationRow` never includes `providerMeta` |
| Raw KIS field names absent (`stck_prpr`, `prdy_vrss`, `rt_cd`, etc.) | Confirmed — never assigned anywhere in fixture or route |
| `rawProviderStored: false` in all responses | Confirmed — hardcoded in route |
| `liveAttempted: false` in all responses | Confirmed — hardcoded in route |
| No stack traces in public error messages | Confirmed — only controlled `INTERNAL_ERROR` message forwarded |
| No credential-like strings | Confirmed — no appkey/appsecret/access_token/authorization appear |
| No fetch calls in route or fixture resolver | Confirmed |
| No process.env or import.meta.env reads | Confirmed |
| No live KIS imports | Confirmed — `getKisDomesticQuote` not imported |
| Errors use controlled `RouteErrorCode` enum | Confirmed |

---

## 8. Files Changed

| File | Change |
|---|---|
| `src/pages/api/portfolio/valuation.ts` | New — POST route with validation, fixture resolver call, `buildPortfolioValuationFromQuotes`, sanitized JSON response |
| `src/lib/server/portfolioValuationFixture.ts` | New — fixture resolver with 4 synthetic KR quote entries; calls `assertServerRuntime` |
| `scripts/check_portfolio_valuation_api_route_fixture_contract.mjs` | New — no-network checker (Groups 1-13) |
| `scripts/check_kis_quote_adapter_mocked_contract.mjs` | Updated — Phase 3BW artifact checks added |
| `scripts/check_kis_valuation_pre_design_static_contract.mjs` | Updated — Phase 3BW artifact checks added |
| `scripts/check_gnews_news_policy_static_contract.mjs` | Updated — Phase 3BW artifact checks added |
| `docs/planning/phase_3bw_portfolio_valuation_api_route_fixture_result_v0.1.md` | New — this result doc |
| `docs/planning/planning_changelog.md` | Updated — Phase 3BW entry prepended |
| `package.json` | Updated — `check:portfolio-valuation-api` script added |

---

## 9. Validation Results

All commands run prior to commit:

| Command | Result |
|---|---|
| `npm run check:portfolio-valuation-api` | PASS |
| `npm run check:kis-quote-adapter-mocked` | PASS |
| `npm run check:kis-valuation-design` | PASS |
| `npm run check:provider-boundaries` | PASS |
| `npm run check:kis-runtime-guard` | PASS |
| `npm run check:kis-error-fallback` | PASS |
| `npm run check:portfolio-create-sheet` | PASS |
| `npm run check:portfolio-holdings-header` | PASS |
| `npm run check:portfolio-bookmark-tabs` | PASS |
| `npm run check:portfolio-layout` | PASS |
| `npm run check:home-portfolio-panel` | PASS |
| `npm run check:home-market-news` | PASS |
| `npm run check:gnews-news-policy` | PASS |
| `npm run check:gnews-news-engine` | PASS |
| `npm run check:gnews-news-api-route` | PASS |
| `npm run check:gnews-news-api-response` | PASS |
| `npm run check:gnews-news-route-source-selector` | PASS |
| `npm run check:gnews-live-adapter-design` | PASS |
| `npm run check:gnews-live-adapter-static` | PASS |
| `npm run check:gnews-live-adapter-mocked` | PASS |
| `npm run smoke:gnews-live:dry` | PASS |
| `git diff --check` | clean |
| `git status --short` | expected files + pre-existing `.vscode/settings.json`, `.agents/`, `skills-lock.json` |
| `npm run build` | PASS |

---

## 10. Boundaries Confirmed

- No live KIS calls
- No live GNews calls
- No external HTTP requests
- No `.env` file reads
- No secrets, credentials, or raw provider content printed or recorded
- No DB/migration/Supabase schema or storage changes
- No UI runtime page, style, or component files modified
- No deployment
- No `/news` page created
- Route is fixture-only; no live source option enabled

---

## 11. Remaining Limitations

- **Live KIS adapter not connected**: `buildPortfolioValuationFromQuotes` receives only fixture quotes; no live KIS call path exists yet.
- **Portfolio UI does not consume the route**: the route is available but `portfolio.astro` still calls `buildPortfolioValuationReadiness` (placeholders). Phase 3BX will wire the UI.
- **Auth-backed server-side position loading deferred**: the route currently relies on client-submitted positions in the request body rather than loading them server-side from Supabase.
- **Cache persistence deferred**: no Supabase quote cache.
- **FX deferred**: mixed-currency `totalMarketValue` remains null.
- **Dividend data deferred**: 배당률, 예상 연배당금, 배당주기 remain "데이터 대기".
- **US quotes deferred**: fixture only covers KR domestic symbols.
- **Tab order persistence deferred**.

---

## 12. Recommended Next Phases

- **Phase 3BX**: Portfolio UI Valuation Mapping with Fixture API Data — wire `portfolio.astro` to call `POST /api/portfolio/valuation` (fixture-only); map 현재가/평가금/수익률/수익금 columns from route response; update 비중 to market-value weight when `quoteCoverage === 'all'`; update refresh button to call the route.
- **Phase 3BY**: Owner-run KIS Live Smoke Test — dry-run first, then `--execute-live` only after dry-run passes. Claude Code must not execute this.
- **Phase 3BZ**: Controlled Live Quote Enablement Behind Kill Switch — `KIS_ENABLE_LIVE_QUOTES=true` in local/preview; production remains blocked.
- **Later**: Supabase quote cache persistence; FX normalization; dividend data model.
