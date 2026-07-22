# Phase 3BU — KIS Valuation Integration Pre-Design & Data Contract v0.1

## 1. Title and Metadata

- **Phase**: 3BU
- **Type**: KIS Valuation Integration Pre-Design & Data Contract
- **Status**: Planned / documentation-only
- **Latest prior commit**: 45c3de3 fix: polish portfolio card and create sheet
- **Runtime changes**: none
- **API route changes**: none
- **DB / Supabase changes**: none
- **Live KIS calls**: none
- **Deployment**: not performed

---

## 2. Objective

This phase prepares future KIS valuation integration by auditing the existing server-side valuation skeleton, defining precise data contracts, specifying provider boundaries, describing stale/error behavior, mapping quote data to UI columns, and proposing cache/refresh/FX strategy — all before any runtime implementation.

The goal is to reduce integration risk by resolving data shape, security boundary, and UX mapping questions in documentation before code lands. Implementation phases (3BV onward) can then proceed from unambiguous contracts instead of designing while building.

---

## 3. Current Portfolio State

### Stored fields (currently persisted via Supabase)

From `portfolioClient.ts` (`Portfolio`, `PortfolioPosition`):

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | Position UUID |
| `portfolioId` | `string` | Parent portfolio UUID |
| `symbol` | `string` | Ticker symbol |
| `market` | `'KR' \| 'US'` | Exchange market |
| `assetType` | `'stock' \| 'etf'` | Asset classification |
| `name` | `string \| null` | Human-readable security name |
| `buyPrice` | `number` | Average purchase price |
| `quantity` | `number` | Units held |
| `buyDate` | `string \| null` | ISO date of purchase |
| `memo` | `string \| null` | User note |
| `currency` | `'KRW' \| 'USD'` | Position denomination |
| `createdAt` | `string` | Record creation timestamp |
| `updatedAt` | `string` | Record update timestamp |

Portfolio-level fields: `id`, `name`, `baseCurrency` (`'KRW' | 'USD'`), `createdAt`, `updatedAt`.

### Currently computed fields (no live data required)

| Field | Computation | Location |
|---|---|---|
| `costBasis` | `buyPrice × quantity` | `portfolioValuation.ts` → `buildPlaceholderRow` |
| Cost-basis weight (비중) | `position.costBasis / totalCostBasis` | `portfolio.astro` JS |
| `totalCostBasis` | Sum of all position cost-basis values | `PortfolioValuationSummary.totalCostBasis` |

### Infrastructure already present

`src/lib/server/portfolioValuation.ts` provides `buildPortfolioValuationReadiness` and `buildAggregatePortfolioValuationReadiness`. Both return `PortfolioValuationSummary` with all valuation fields set to `null` and `staleState: 'unavailable'`. This is the documented placeholder skeleton that Phase 3BV onwards will populate.

`src/lib/server/providers/types.ts` already defines `PortfolioValuationRow`, `PortfolioValuationSummary`, `QuoteSnapshot`, `FallbackState`, and `ProviderErrorCode`. The schema contract in Deliverable 2 builds directly on these existing types.

### Current placeholder fields (displayed in Portfolio holdings table)

| Portfolio Column | Current Behavior | UI Placeholder Text |
|---|---|---|
| 현재가 | null | 연동 예정 |
| 평가금 | null | 연동 예정 |
| 수익률 | null | 연동 예정 |
| 수익금 | null | 연동 예정 |
| 배당률 | null | 데이터 대기 |
| 예상 연배당금 | null | 데이터 대기 |
| 배당주기 | null | 데이터 대기 |

---

## 4. Valuation Integration Goals

The following fields are the target outputs of the future valuation integration, per position:

| Field | Description |
|---|---|
| `currentPrice` | Latest available quote price in position currency |
| `marketValue` | `currentPrice × quantity` in position currency |
| `unrealizedProfit` | `marketValue - costBasis` in position currency |
| `returnRate` | `unrealizedProfit / costBasis × 100` percent |
| `quoteTimestamp` | ISO timestamp of quote data |
| `quoteCurrency` | Currency the quote price is denominated in |
| `quoteSource` | `'provider'` \| `'cache'` \| `'unavailable'` |
| `freshnessState` | Controlled freshness enum (see Section 15) |
| `errorCode` | Controlled error code when quote unavailable |
| `errorMessagePublic` | Sanitized user-facing explanation |
| `fxConversionState` | `'not-required'` \| `'applied'` \| `'unavailable'` |

Portfolio aggregate targets:

| Field | Description |
|---|---|
| `totalMarketValue` | Sum of `marketValue` by currency or converted baseCurrency |
| `totalUnrealizedProfit` | Sum of `unrealizedProfit` by currency |
| `totalReturnRate` | `totalUnrealizedProfit / totalCostBasis × 100` |
| `quoteCoverage` | `'all'` \| `'partial'` \| `'unavailable'` |
| `staleSummary` | Worst staleState across all positions |

---

## 5. Non-Goals

The following are explicitly out of scope for the first valuation integration:

- **Dividend data** (`배당률`, `예상 연배당금`, `배당주기`) — these require a separate dividend data model and provider not yet designed. They remain `null` / `'데이터 대기'`.
- **Fabricated values** — if a quote is unavailable, the field must be `null`. No synthetic price, no last-known estimated value displayed as if current.
- **Client-side KIS call** — the browser must never call any KIS endpoint directly.
- **Browser-visible KIS credential** — access token, app key, app secret, base URL, or raw provider response must never reach the browser or be logged to a client-accessible surface.
- **Live quote polling loop** — no `setInterval` or WebSocket-based continuous refresh.
- **Automatic background scheduler** — no cron or background job until separately reviewed and approved.
- **Production live KIS enabling** — production (`VERCEL_ENV=production`) is permanently blocked in `kisClient.ts` and this must not be changed without separate owner review.
- **US market quotes in first valuation integration** — KIS `getKisDomesticQuote` validates `market === 'KR'` with six-digit symbol. US positions will return `SYMBOL_UNSUPPORTED` until a US quote provider is added in a later phase.

---

## 6. Server-Only KIS Provider Boundary

### Confirmed existing enforcement

`assertServerRuntime(moduleName)` is called at the top of every public function in `kisClient.ts` and `portfolioValuation.ts`. This throws `ServerOnlyRuntimeError` if `typeof window !== 'undefined'`, blocking any accidental browser-side import.

### Boundary rules (must remain enforced in all future phases)

| Rule | Reason |
|---|---|
| All KIS credentials are server-only env vars | Prevent browser exposure of `KIS_APP_KEY`, `KIS_APP_SECRET`, `KIS_BASE_URL` |
| Browser never receives access token | Token is an intermediate credential; must stay in server memory only |
| Browser never sees raw provider response fields | Raw KIS field names (`stck_prpr`, `prdy_vrss`, etc.) must not appear in any client response |
| Browser never sees provider URL with credentials | No URL containing appkey/appsecret in query string or header must reach client |
| Browser calls only project-owned API routes | Client uses `/api/portfolio/...` endpoints; no direct KIS calls |
| Provider adapter normalizes to `QuoteSnapshot` | Normalization removes all raw KIS field names before leaving the provider layer |
| Public API response exposes only safe fields | Route-level serialization must strip `providerMeta` or any internal envelope fields |
| Errors are mapped to `ProviderErrorCode` enum | No raw provider error strings, HTTP status texts, or stack frames in public response |
| `assertServerRuntime` on all server-module public functions | Belt-and-suspenders check in addition to import tree isolation |

### Existing sanitization pattern (to replicate in future routes)

`sanitizeUnknownError` in `providerErrors.ts` catches all unknown thrown errors and returns `{ ok: false, code: 'INTERNAL_ERROR', message: 'Provider operation failed safely.' }` — the raw error is never forwarded. This pattern must be used in every try/catch that touches provider output.

---

## 7. Proposed Future API Boundary

The following routes are design proposals only. No routes are created in this phase.

### Candidate route: `GET /api/portfolio/valuation`

**Purpose**: Return current portfolio valuation snapshot for one portfolio or aggregate view, using cached or provider-fresh quote data.

**Input** (query params or JSON body):
```
portfolioId: string | '__all_portfolios__'
displayCurrency?: 'KRW' | 'USD'
```

**Output shape**:
```
{
  ok: true,
  portfolioId: string,
  scope: 'single' | 'all',
  rows: PositionValuation[],
  summary: PortfolioValuationSummary,
  quotedAt: string,         // ISO timestamp
  staleSummary: QuoteFreshnessState,
  quoteCoverage: ValuationCoverage,
  fxApplied: boolean
}
```

**Authentication**: Required (Supabase session JWT in Authorization header, same as portfolio CRUD routes).

**Cache behavior**: Serves cached quote data if within TTL; triggers provider fetch on cache miss or manual refresh.

**Error shape**:
```
{
  ok: false,
  code: ProviderErrorCode,
  message: string,          // sanitized, no raw provider content
  quotedAt?: string,        // included even on error for partial results
  coverage?: ValuationCoverage
}
```

**Freshness metadata**: Included in success and partial-error responses.

**Raw provider payload**: Never included. Provider output is normalized to `QuoteSnapshot` before reaching the route handler.

### Candidate route: `POST /api/quotes/resolve`

**Purpose**: Low-level quote resolution for one or more symbols. Used internally or for manual refresh triggers.

**Input**:
```
requests: Array<{ market: string, symbol: string, assetType: string }>
```

**Output**: Array of `QuoteSnapshot` with freshness metadata per entry.

**Note**: This route may be merged with the valuation route rather than exposed separately. Decision deferred to Phase 3BV.

### Route naming convention

Current portfolio routes follow `/api/portfolio/[resource]`. The valuation route should follow this convention: `/api/portfolio/valuation`. A separate `/api/quotes/...` namespace may be added later if quote resolution needs to support non-portfolio contexts (e.g., Market Quote Card).

---

## 8. Quote Input Contract

The following fields are required to resolve a quote for a portfolio position:

| Field | Type | Notes |
|---|---|---|
| `positionId` | `string` | Position UUID; used for cache keying |
| `portfolioId` | `string` | Parent portfolio; used for scope logging |
| `symbol` | `string` | Ticker symbol (six-digit for KR) |
| `market` | `'KR' \| 'US'` | Exchange market |
| `assetType` | `'stock' \| 'etf'` | Preserved for provider routing |
| `currency` | `'KRW' \| 'USD'` | Position denomination |
| `quantity` | `number` | Used to compute `marketValue` |
| `buyPrice` | `number` | Used to compute `costBasis` |
| `baseCurrency` | `'KRW' \| 'USD'` | Portfolio's display currency |
| `displayCurrencyMode` | `'local' \| 'base'` | Whether to convert to `baseCurrency` |
| `exchangeMappingRequired?` | `boolean` | True when `currency !== baseCurrency` |

### Market-specific notes

- **KR market**: Symbol must be exactly six numeric digits. Provider: `kisClient.getKisDomesticQuote`. Currency: KRW. `market === 'KR'` is the only currently supported market in `kisClient.ts`.
- **US market**: Not yet supported by KIS domestic adapter. Symbol format TBD. Requires separate provider phase.
- **ETF vs. stock**: `assetType` is preserved in the quote input so future providers can use market-specific ETF API paths if needed.
- **Unsupported assets**: Must return `{ ok: false, code: 'SYMBOL_UNSUPPORTED', staleState: 'unavailable' }` — must not throw an uncontrolled error.

---

## 9. Quote Snapshot Contract

The following fields define the normalized internal quote output after provider data is processed. This maps to the existing `QuoteSnapshot` type in `types.ts` with additions needed for valuation:

| Field | Type | Notes |
|---|---|---|
| `symbol` | `string` | Normalized ticker |
| `market` | `'KR' \| 'US'` | Exchange market |
| `assetType` | `'stock' \| 'etf'` | Asset classification |
| `provider` | `'kis' \| 'internal'` | Source provider |
| `currentPrice` | `number` | Quote price in `quoteCurrency` |
| `quoteCurrency` | `'KRW' \| 'USD'` | Currency the price is denominated in |
| `quoteTimestamp` | `string` | ISO timestamp of quote data |
| `marketStatus` | `'open' \| 'closed' \| 'delayed' \| 'unknown'` | Exchange trading status |
| `staleState` | `QuoteFreshnessState` | Freshness classification |
| `errorCode` | `ProviderErrorCode \| null` | Present only when quote failed |
| `errorMessagePublic` | `string \| null` | Sanitized user-facing error; no raw provider content |
| `rawProviderStored` | `false` | Always false — raw KIS response must not be stored anywhere client-accessible |
| `source` | `'provider' \| 'cache' \| 'unavailable'` | Where this snapshot came from |

### Existing fields in `QuoteSnapshot` (types.ts)

The existing type already has: `market`, `symbol`, `price` (maps to `currentPrice`), `currency` (maps to `quoteCurrency`), `change`, `changePct`, `volume`, `marketState` (maps to `marketStatus`), `asOf` (maps to `quoteTimestamp`), `staleState`, `providerMeta`.

`providerMeta` (which contains `provider` and `source: 'kis-domestic-quote'`) must be stripped before the snapshot reaches any public API response.

---

## 10. Position Valuation Contract

The following computations define how a position's stored data and a quote snapshot combine to produce displayed valuation fields:

| Field | Computation | Availability |
|---|---|---|
| `costBasisLocal` | `buyPrice × quantity` | Always available (stored data only) |
| `marketValueLocal` | `currentPrice × quantity` | Only when `currentPrice` is not null |
| `unrealizedProfitLocal` | `marketValueLocal − costBasisLocal` | Only when `marketValueLocal` is not null |
| `returnRate` | `unrealizedProfitLocal / costBasisLocal × 100` | Only when `costBasisLocal > 0` and `marketValueLocal` is not null |
| `weight (비중)` | Phase 1 fallback: `costBasisLocal / totalCostBasis × 100` | Always (cost-basis mode) |
| `weight (비중)` future | `marketValueLocal / totalMarketValue × 100` | When quote coverage is sufficient and FX is resolved |

### Null rules

- **If `currentPrice` is null**: `marketValueLocal`, `unrealizedProfitLocal`, and `returnRate` must all be `null`. Never substitute 0.
- **If `costBasisLocal === 0`**: `returnRate` must be `null` to avoid division by zero.
- **If weight denominator is 0 or unavailable**: `weight` must be `null`. Never substitute 0.
- **Display**: Null values display as `연동 예정` for KIS-backed fields, `데이터 대기` for dividend fields.

### Existing implementation note

`buildPlaceholderRow` in `portfolioValuation.ts` already correctly sets `currentPrice: null`, `marketValue: null`, `unrealizedPnl: null`, `unrealizedPnlPct: null` with `costBasis: buyPrice * quantity`. Future implementation must populate these from `QuoteSnapshot` when available.

---

## 11. Portfolio Aggregate Contract

When computing portfolio-level totals:

| Field | Type | Computation |
|---|---|---|
| `totalCostBasis` | `number` | Sum of `costBasisLocal` for all positions. Always available. |
| `totalMarketValue` | `number \| null` | Sum of `marketValueLocal` only when all positions have valid quotes. Null if any position is unavailable and FX is not resolved. |
| `totalUnrealizedProfit` | `number \| null` | `totalMarketValue − totalCostBasis`. Null if `totalMarketValue` is null. |
| `totalReturnRate` | `number \| null` | `totalUnrealizedProfit / totalCostBasis × 100`. Null if prerequisites unavailable. |
| `quoteCoverage` | `ValuationCoverage` | `'all'` / `'partial'` / `'unavailable'` |
| `staleSummary` | `QuoteFreshnessState` | Worst-case stale state across all positions |
| `baseCurrency` | `'KRW' \| 'USD' \| 'MIXED'` | `'MIXED'` when positions span both KRW and USD (aggregate view) |

### Scope behavior

`PortfolioValuationSummary.scope` already defines `'single'` (one portfolio) and `'all'` (aggregate view). Aggregate view (`baseCurrency: 'MIXED'`) cannot produce a single `totalMarketValue` without FX resolution.

### Partial coverage

If some positions have quotes and some do not, `quoteCoverage` is `'partial'`. `totalMarketValue` for the quoted subset may optionally be shown as a partial subtotal with a `'partial'` coverage indicator. The display must clearly indicate that the total is not complete.

---

## 12. Currency and FX Policy

### Core rule

Do not add KRW and USD values without FX conversion. Mixing currencies produces meaningless totals.

### Single-portfolio rules

- If all positions are in the same currency as `baseCurrency`: no FX required; totals are directly computed.
- If any position currency differs from `baseCurrency`: FX rate required before displaying converted totals.
- If FX is unavailable: show local values per position without cross-currency aggregation. Do not show a blended total. Do not fabricate an exchange rate.

### Aggregate view rules

- `baseCurrency: 'MIXED'` signals cross-currency aggregate.
- Displaying a combined total requires FX normalization to a display currency.
- If FX is unavailable: omit cross-currency aggregate total; show per-currency subtotals if possible.

### FX provider decision

FX rate source is deferred. Options include:
- KIS FX rate endpoint (separate approval required)
- Third-party FX provider (separate approval required)
- Manual/fixture rate for development testing

No FX provider is implemented in this phase. FX conversion fields must remain `null` or `'unavailable'` until a provider is approved and implemented.

### Currency display mode

Two display modes are proposed:

| Mode | Behavior |
|---|---|
| `'local'` | Each position displays in its own currency; no FX conversion |
| `'base'` | Positions converted to portfolio `baseCurrency`; requires FX rate |

The current UI effectively operates in `'local'` mode for all positions.

---

## 13. UI Mapping Contract

How future valuation fields map to existing Portfolio holdings table columns:

| Column (UI) | Current State | Future State | Fallback When Unavailable |
|---|---|---|---|
| 종목 | symbol + name (stored) | unchanged | — |
| 비중 | cost-basis weight | market-value weight when coverage ≥ all + FX resolved | cost-basis weight (always) |
| 수량 | stored `quantity` | unchanged | — |
| 평단가 | stored `buyPrice` | unchanged | — |
| 현재가 | null / 연동 예정 | `currentPrice` from `QuoteSnapshot` | 연동 예정 |
| 평가금 | null / 연동 예정 | `marketValue` (`currentPrice × quantity`) | 연동 예정 |
| 수익률 | null / 연동 예정 | `returnRate` (%) | 연동 예정 |
| 수익금 | null / 연동 예정 | `unrealizedProfit` | 연동 예정 |
| 배당률 | null / 데이터 대기 | deferred (dividend model) | 데이터 대기 |
| 예상 연배당금 | null / 데이터 대기 | deferred (dividend model) | 데이터 대기 |
| 배당주기 | null / 데이터 대기 | deferred (dividend model) | 데이터 대기 |

### Home MY PORTFOLIO card

- Current: donut chart uses cost-basis allocation weight.
- Future: donut may use market-value allocation weight when all required quotes and FX are available.
- Transition: cost-basis weight remains default until quote coverage is `'all'` and FX is resolved.
- No live valuation claim must appear in UI copy unless live data is actually being served.

---

## 14. Sorting Policy

| Sort Key | Current | Future |
|---|---|---|
| 비중 | cost-basis weight (valid) | market-value weight when available |
| 수익률 | unavailable (returns null) | sort by returnRate ascending/descending |
| 수익금 | unavailable (returns null) | sort by unrealizedProfit |
| 현재가 | unavailable | sort by currentPrice |
| 평가금 | unavailable | sort by marketValue |

### Null sort rule

Positions with null values for the sort key **always sort to the bottom**, regardless of sort direction. They must not be assigned a synthetic value of 0 for sort purposes — that would misrepresent unavailable data as zero-return positions.

### Stable sort when all unavailable

If all positions have null values for the active sort key, the current insertion order (or previously sorted order) must be preserved. No shuffle.

### Cost-basis sort remains valid

Sorts by `costBasis`, `buyPrice`, `quantity`, `symbol`, `name` do not depend on live data and remain valid at all times.

---

## 15. Freshness and Stale States

Controlled state set for `QuoteFreshnessState`:

| State | Meaning | Suggested UI copy |
|---|---|---|
| `'fresh'` | Quote is within the freshness TTL window | — (no indicator needed) |
| `'cached'` | Quote served from cache, within stale-but-usable window | 캐시 기준 |
| `'stale'` | Quote is older than stale-but-usable window; should refresh | 갱신 필요 |
| `'market_closed'` | Exchange is closed; quote is previous close | 장 마감 |
| `'unavailable'` | No quote available, no stale fallback | 연동 예정 |
| `'provider_error'` | Provider returned an error; no fallback | 갱신 실패 |
| `'rate_limited'` | Provider rejected due to rate limit; may retry after delay | 갱신 실패 |
| `'auth_error'` | Provider credentials missing or invalid | 연동 예정 |
| `'config_missing'` | Required env vars absent or feature flag off | 연동 예정 |
| `'unsupported_symbol'` | Symbol not supported by provider | 미지원 종목 |
| `'partial'` | Some positions have quotes, others do not | 일부 연동 |

### Notes on existing type

`types.ts` defines `FallbackState` as `'fresh' | 'stale-but-usable' | 'expired' | 'unavailable' | 'sample'`. The `QuoteFreshnessState` enum in the schema doc extends this with additional states for UI copy purposes. The implementation should map `FallbackState` values to `QuoteFreshnessState` at the route layer.

---

## 16. Error and Fallback Policy

### Public error rules

- All errors returned to clients must use the `ProviderErrorCode` enum values.
- No raw KIS error fields, HTTP status text, stack traces, request URLs, or credential names must appear in any client-facing response.
- `sanitizeUnknownError` in `providerErrors.ts` is the required catch-all for unknown thrown errors.

### Per-position fallback

Prefer per-position `null` + `staleState: 'unavailable'` over failing the entire portfolio response. A portfolio with 10 positions where 2 have quote errors should still return the 8 successful positions with valuations, and 2 positions with `staleState: 'unavailable'`.

### Route-level fallback

The valuation route should return a partial response with `ok: true` and `coverage: 'partial'` when some (but not all) positions fail, rather than returning an error envelope for the entire request.

### Error → UI copy mapping

| ProviderErrorCode | UI display |
|---|---|
| `CONFIG_MISSING`, `AUTH_REQUIRED` | 연동 예정 |
| `PROVIDER_UNAVAILABLE`, `PROVIDER_RATE_LIMITED` | 갱신 실패 |
| `SYMBOL_UNSUPPORTED` | 미지원 종목 |
| `DATA_STALE` | 캐시 기준 |
| `NOT_IMPLEMENTED` | 연동 예정 |
| `INTERNAL_ERROR` | 갱신 실패 |

---

## 17. Cache Strategy Proposal

Design only. No cache implementation in this phase. No schema change in this phase.

### Cache key structure (candidate)

```
{provider}:{market}:{symbol}:{assetType}:{quoteDateBucket}
```

Where `quoteDateBucket` is a rounded timestamp (e.g., 30-second or 60-second bucket) to allow grouping of concurrent requests.

### TTL considerations

| State | Suggested TTL | Rationale |
|---|---|---|
| Fresh (market open) | 30–60 seconds | Balance freshness vs. rate limits |
| Stale-but-usable | 2–5 minutes | Fallback window during provider instability |
| Market closed | Until next open | Previous close is stable; no need to refresh |
| After-hours | 5–15 minutes | Reduce calls when market activity is low |
| Manual refresh | Bypass cache immediately | User-initiated; always fetch fresh |

### Cache backend options (deferred decision)

- **In-memory** (server module singleton): simple, lost on cold start; acceptable for development
- **Supabase table** (Supabase row with TTL field): persistent across instances; requires schema addition (deferred)
- **Vercel KV / Edge Config**: fast read; external dependency

The `ProviderCacheRecord<T>` type already exists in `types.ts` with `cacheKey`, `provider`, `payload`, `cachedAt`, `expiresAt`, `staleUntil` — this can be used as the cache record shape for whichever backend is approved.

### Concurrent request deduplication

When multiple positions share the same symbol and market, the cache layer must deduplicate: one quote fetch per symbol per TTL window, not one per position.

---

## 18. Refresh Button Future Behavior

The current Portfolio page has a "현재 포트폴리오 다시 계산" (recalculate) button in `portfolio-h1-row`.

### Current behavior

Client-side only: recalculates cost-basis totals and re-renders the table using stored position data. No server call. Label is accurate — it recalculates, not refreshes live quotes.

### Future behavior design

When valuation is live, the button should transition through states:

| Phase | Button behavior | Label |
|---|---|---|
| Phase 1 (cost-basis only) | Recalculate locally | 다시 계산 |
| Phase 2 (cached quotes) | Request `/api/portfolio/valuation` with cached quotes | 새로고침 |
| Phase 3 (live quotes) | Request `/api/portfolio/valuation` with `forceRefresh: true` | 실시간 갱신 |

### Label policy

- Do not rename to "실시간" unless live behavior is actually enabled and serving fresh provider data.
- "새로고침" is appropriate for cached quote refresh.
- "실시간 갱신" is appropriate only when the request bypasses cache and fetches from the KIS provider.
- A loading/spinning state during the refresh call is required for usability.

### Distinguish three operations

The UI must visually distinguish:
1. **Recalculation**: local JS, instant, no spinner needed
2. **Cached quote refresh**: server call, 100–500ms, brief spinner
3. **Live provider refresh**: server + KIS call, 500–3000ms, explicit loading state

---

## 19. Security Checklist

### Credentials

- [ ] `KIS_APP_KEY`, `KIS_APP_SECRET`, `KIS_BASE_URL` must remain server-only env vars, never bundled into client JS.
- [ ] Access token from KIS OAuth must stay in server memory (`accessTokenCache`) only; never serialized to client response.
- [ ] `KIS_ACCOUNT_NO` presence must permanently block all live quote calls (production-only guard).

### Response sanitization

- [ ] No raw KIS response field names (`stck_prpr`, `prdy_vrss`, etc.) in any public API response.
- [ ] No `providerMeta` block in public API response (strip before serialization).
- [ ] All errors go through `sanitizeUnknownError` or `createProviderError` — no raw thrown error forwarding.
- [ ] No provider request URL with credentials in any log or response.

### Runtime guard

- [ ] `VERCEL_ENV=production` always blocks live KIS calls (existing `classifyRuntime` logic).
- [ ] `VERCEL_ENV=preview` without `KIS_ENABLE_PREVIEW_LIVE_QUOTES=true` blocks live calls.
- [ ] Unknown `VERCEL_ENV` value fails closed (blocked).
- [ ] `assertServerRuntime(moduleName)` on all public server-module functions.

### Static checker coverage

- [ ] `check:provider-boundaries` validates no `fetch` outside approved KIS adapter.
- [ ] `check:kis-runtime-guard` validates all runtime guard scenarios.
- [ ] `check:kis-error-fallback` validates provider error normalization.
- [ ] No `.env` file reads in any static checker.
- [ ] No live KIS calls in any static checker.

### Owner approval gate

- [ ] Production live KIS enablement requires explicit owner decision (separate phase).
- [ ] Live smoke test must be owner-run only (`scripts/owner_smoke_*.mjs`).
- [ ] Claude Code must not execute `--execute-live` flag or any live smoke command.

---

## 20. Future Phase Split

### Phase 3BV — KIS Quote Adapter Contract & Mocked Provider Tests

- Define formal TypeScript types for `QuoteInput` → `QuoteSnapshot` mapping.
- Extend `check:kis-error-fallback` to cover position valuation computation paths.
- Add no-network mocked tests for `buildPortfolioValuationReadiness` with sample quotes.
- No live KIS calls.

### Phase 3BW — Portfolio Valuation API Route with Fixture/Mocked Quotes

- Implement `/api/portfolio/valuation` route.
- Route returns `PortfolioValuationSummary` built from stored positions and fixture/mocked quotes.
- Add cache layer with in-memory TTL.
- Static checker for route structure and response shape.
- No live KIS calls.

### Phase 3BX — Portfolio UI Valuation Mapping with Cached/Mocked Data

- Connect Portfolio holdings table to `/api/portfolio/valuation` response.
- Map `현재가`, `평가금`, `수익률`, `수익금` columns to live fields when available; `연동 예정` when null.
- Update `비중` to use market-value weight when `quoteCoverage === 'all'`.
- Update refresh button to call valuation route.
- No live KIS calls.

### Phase 3BY — Owner-run KIS Live Smoke Test

- Owner runs `scripts/owner_smoke_kis_quote_live.mjs` in local/preview environment.
- Claude Code must not execute this script.
- Dry-run first, then `--execute-live` only after dry-run passes.
- Document provider response shape and validate normalization.

### Phase 3BZ — Controlled Live Quote Enablement Behind Kill Switch

- Owner approves enabling `KIS_ENABLE_LIVE_QUOTES=true` in local/preview.
- Production remains permanently blocked.
- Kill switch: set `KIS_ENABLE_LIVE_QUOTES=false` to revert instantly.
- Post-enablement static validation pass.

### Later phases (deferred)

- **Dividend data model**: separate provider, separate data contract, separate phase
- **FX normalization**: separate provider approval, separate implementation phase
- **US market quote support**: KIS US adapter or separate provider, separate phase
- **Tab order persistence** (localStorage): separate small phase
- **/news page**: deferred per earlier decision

---

## 21. Open Decisions

The following decisions must be made by the owner before runtime implementation begins:

| Decision | Options | Impact |
|---|---|---|
| Which KIS API product scope is approved? | Quote-only (current) / Full trading account | Affects `KIS_ACCOUNT_NO` presence, data available |
| KR-only first or KR+US together? | KR-only (current KIS supports) / KR+US (needs separate US adapter) | Determines Phase 3BV scope |
| Should valuation refresh be manual-only first? | Manual (button) / Automatic on load / Both | UX and rate limit implications |
| Is Supabase quote cache approved? | Yes (needs schema phase) / No (in-memory only) | Cache persistence strategy |
| What quote freshness TTL is acceptable? | 30s / 60s / 5m / market-close window | Rate limit vs. staleness trade-off |
| Should FX normalization be included in first valuation implementation? | Yes (needs FX provider) / No (local-only display) | Affects aggregate totals |
| Should valuation be per selected portfolio only or also aggregate? | Selected-only / Both simultaneously | Route response scope |
| How to handle non-KIS supported tickers? | 연동 예정 (current) / 미지원 종목 badge / Hide row | UI clarity for unsupported assets |
| Should `check:kis-error-fallback` be extended to cover Phase 3BV paths? | Yes (recommended) / Separate new checker | Test coverage strategy |
