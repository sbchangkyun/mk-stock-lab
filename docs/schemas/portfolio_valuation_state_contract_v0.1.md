# Portfolio Valuation State Contract v0.1

Documentation-only. No runtime implementation. TypeScript-style interface definitions for planning purposes only.

---

## 1. Core Type Definitions

### ValuationSource

```typescript
type ValuationSource =
  | 'provider'       // Quote fetched fresh from KIS provider
  | 'cache'          // Quote served from cache (may be stale)
  | 'cost-basis'     // No quote available; cost-basis computation only
  | 'unavailable';   // No data of any kind available
```

### QuoteFreshnessState

```typescript
type QuoteFreshnessState =
  | 'fresh'              // Within freshness TTL
  | 'cached'             // Within stale-but-usable window; served from cache
  | 'stale'              // Beyond stale-but-usable; should refresh
  | 'market_closed'      // Exchange closed; price is previous close
  | 'unavailable'        // No quote, no cache fallback
  | 'provider_error'     // Provider returned error; no fallback
  | 'rate_limited'       // Provider rejected; retry later
  | 'auth_error'         // Credentials missing or invalid
  | 'config_missing'     // Feature flag off or env vars absent
  | 'unsupported_symbol' // Symbol not supported by provider
  | 'partial';           // Portfolio has mixed quote coverage
```

Maps from `FallbackState` in `src/lib/server/providers/types.ts`:

| FallbackState (existing) | QuoteFreshnessState (this contract) |
|---|---|
| `'fresh'` | `'fresh'` |
| `'stale-but-usable'` | `'cached'` |
| `'expired'` | `'stale'` |
| `'unavailable'` | `'unavailable'` |
| `'sample'` | `'unavailable'` (never shown as real data) |

### ValuationErrorCode

```typescript
type ValuationErrorCode =
  | 'AUTH_REQUIRED'         // Session auth missing
  | 'CONFIG_MISSING'        // KIS env vars absent or feature flag off
  | 'PROVIDER_UNAVAILABLE'  // KIS returned non-2xx or no usable price
  | 'PROVIDER_RATE_LIMITED' // KIS rate limit (HTTP 429)
  | 'SYMBOL_UNSUPPORTED'    // Market !== 'KR' or symbol format invalid
  | 'CACHE_MISS'            // Cache had no entry and provider also failed
  | 'DATA_STALE'            // Stale cache served (not an error, informational)
  | 'VALIDATION_FAILED'     // Request input validation failed
  | 'INTERNAL_ERROR'        // Unexpected server error; sanitized
  | 'NOT_IMPLEMENTED';      // Provider path not yet implemented (US market)
```

This mirrors `ProviderErrorCode` in `src/lib/server/providers/types.ts` exactly.

### CurrencyDisplayMode

```typescript
type CurrencyDisplayMode =
  | 'local'   // Each position displays in its own currency; no FX conversion
  | 'base';   // Positions converted to portfolio baseCurrency; requires FX rate
```

### ValuationCoverage

```typescript
type ValuationCoverage =
  | 'all'         // All positions in portfolio have quote data
  | 'partial'     // Some positions have quotes, some do not
  | 'unavailable'; // No positions have quote data
```

---

## 2. Quote Input

### QuoteInput

```typescript
interface QuoteInput {
  positionId: string;             // Position UUID; used for cache keying
  portfolioId: string;            // Parent portfolio UUID
  symbol: string;                 // Ticker symbol (6 digits for KR market)
  market: 'KR' | 'US';           // Exchange market
  assetType: 'stock' | 'etf';    // Asset classification
  currency: 'KRW' | 'USD';       // Position denomination
  quantity: number;               // Units held
  buyPrice: number;               // Purchase price per unit
  baseCurrency: 'KRW' | 'USD';   // Portfolio's configured display currency
  displayCurrencyMode: CurrencyDisplayMode;
  exchangeMappingRequired?: boolean; // true when currency !== baseCurrency
}
```

### Validation rules

- `symbol` must match `/^\d{6}$/` for `market === 'KR'`
- `market === 'US'` returns `SYMBOL_UNSUPPORTED` until US adapter is implemented
- `quantity` must be positive
- `buyPrice` must be non-negative

---

## 3. Quote Snapshot

### QuoteSnapshot (public form — safe for API response)

```typescript
interface QuoteSnapshot {
  symbol: string;
  market: 'KR' | 'US';
  assetType: 'stock' | 'etf';
  provider: 'kis' | 'internal';
  currentPrice: number;           // Quote price in quoteCurrency
  quoteCurrency: 'KRW' | 'USD';  // Currency of the price
  quoteTimestamp: string;         // ISO 8601 timestamp
  marketStatus: 'open' | 'closed' | 'delayed' | 'unknown';
  staleState: QuoteFreshnessState;
  source: ValuationSource;
  errorCode: ValuationErrorCode | null;
  errorMessagePublic: string | null; // Sanitized; no raw provider content
  rawProviderStored: false;          // ALWAYS false — invariant
}
```

### rawProviderStored invariant

`rawProviderStored` must be `false` in every `QuoteSnapshot` that leaves the server provider layer. This is an explicit contract that the raw KIS response (containing `stck_prpr`, `prdy_vrss`, `prdy_ctrt`, `acml_vol`, `rt_cd`, `access_token`, etc.) was never forwarded or stored in any client-accessible location.

### Relationship to existing `QuoteSnapshot` in types.ts

The existing `QuoteSnapshot` type (in `src/lib/server/providers/types.ts`) is the internal server-side type. It includes `providerMeta` which contains `provider` and `source: 'kis-domestic-quote'`. The `providerMeta` block must be stripped before the snapshot is serialized into any public API response.

The public-form `QuoteSnapshot` defined here maps internal fields:
- `price` → `currentPrice`
- `currency` → `quoteCurrency`
- `asOf` → `quoteTimestamp`
- `marketState` → `marketStatus`
- `providerMeta.provider` → `provider` (field is kept; the full `providerMeta` object is dropped)

---

## 4. Position Valuation

### PositionValuation

```typescript
interface PositionValuation {
  // Identity (from stored position)
  positionId: string;
  portfolioId: string;
  symbol: string;
  market: 'KR' | 'US';
  assetType: 'stock' | 'etf';
  name: string | null;
  currency: 'KRW' | 'USD';

  // Stored values (always available)
  buyPrice: number;
  quantity: number;
  buyDate: string | null;

  // Cost-basis computations (always available)
  costBasisLocal: number;        // buyPrice × quantity
  costBasisWeight: number | null; // costBasisLocal / totalCostBasis × 100

  // Quote-backed computations (null when quote unavailable)
  currentPrice: number | null;
  marketValueLocal: number | null;       // currentPrice × quantity
  unrealizedProfitLocal: number | null;  // marketValueLocal − costBasisLocal
  returnRate: number | null;             // unrealizedProfitLocal / costBasisLocal × 100
  marketValueWeight: number | null;      // marketValueLocal / totalMarketValue × 100

  // Active display weight (cost-basis until quote coverage is 'all' + FX resolved)
  displayWeight: number | null;

  // Quote metadata
  quote: QuoteSnapshot | null;
  staleState: QuoteFreshnessState;
  source: ValuationSource;

  // Dividend fields (deferred — separate model)
  dividendYield: null;
  estimatedAnnualDividend: null;
  dividendFrequency: null;
}
```

---

## 5. Portfolio Valuation Summary

### PortfolioValuationSummary

```typescript
interface PortfolioValuationSummary {
  scope: 'single' | 'all';
  portfolioId?: string;                   // undefined when scope === 'all'
  baseCurrency: 'KRW' | 'USD' | 'MIXED'; // 'MIXED' for aggregate view

  rows: PositionValuation[];

  // Cost-basis totals (always available)
  totalCostBasis: number;
  totalCostBasisCurrency: 'KRW' | 'USD' | 'MIXED';

  // Quote-backed totals (null when coverage not 'all' or FX unavailable)
  totalMarketValue: number | null;
  totalMarketValueCurrency: 'KRW' | 'USD' | null;
  totalUnrealizedProfit: number | null;
  totalReturnRate: number | null;

  // Coverage and freshness
  quoteCoverage: ValuationCoverage;
  staleSummary: QuoteFreshnessState;  // Worst staleState across all positions
  quotedAt: string | null;            // ISO timestamp of most recent quote resolution

  // FX state
  fxApplied: boolean;
  fxRate: number | null;              // Applied exchange rate if fxApplied
  fxRateTimestamp: string | null;     // ISO timestamp of FX rate used
}
```

---

## 6. Field Status Table

| Field | Status | Notes |
|---|---|---|
| `costBasisLocal` | Implemented now | `buyPrice × quantity` in `portfolioValuation.ts` |
| `costBasisWeight` | Implemented now | Cost-basis allocation, computed client-side |
| `totalCostBasis` | Implemented now | `PortfolioValuationSummary.totalCostBasis` |
| `currentPrice` | Planned — KIS | Via `getKisDomesticQuote` → `QuoteSnapshot.price` |
| `marketValueLocal` | Planned — KIS | `currentPrice × quantity` |
| `unrealizedProfitLocal` | Planned — KIS | `marketValueLocal − costBasisLocal` |
| `returnRate` | Planned — KIS | `unrealizedProfit / costBasis × 100` |
| `marketValueWeight` | Planned — KIS | Replaces `costBasisWeight` when `coverage === 'all'` + FX ok |
| `quoteTimestamp` | Planned — KIS | From `QuoteSnapshot.asOf` |
| `staleSummary` | Planned — KIS | Mapped from `FallbackState` |
| `quoteCoverage` | Planned — KIS | Computed from row `staleState` values |
| `fxApplied` / `fxRate` | Planned — FX | Deferred; separate FX provider phase |
| `totalMarketValue` (cross-currency) | Planned — FX | Requires FX normalization |
| `dividendYield` | Planned — dividend | Separate dividend data model; deferred |
| `estimatedAnnualDividend` | Planned — dividend | Deferred |
| `dividendFrequency` | Planned — dividend | Deferred |
| `rawProviderStored` | Always `false` | Invariant; never changes |

---

## 7. UI Copy Mapping

| State / Condition | 현재가 column | 평가금 column | 수익률 column | 수익금 column | 비중 column |
|---|---|---|---|---|---|
| No quote (config missing / feature off) | 연동 예정 | 연동 예정 | 연동 예정 | 연동 예정 | cost-basis % |
| Unsupported symbol (US market, non-6-digit) | 미지원 종목 | 미지원 종목 | 미지원 종목 | 미지원 종목 | cost-basis % |
| Quote available, fresh | price value | value | % value | value | market-value % (if all) |
| Quote available, cached (stale-but-usable) | price value + 캐시 기준 | value | % | value | market-value % |
| Provider error, no cache | 갱신 실패 | 갱신 실패 | 갱신 실패 | 갱신 실패 | cost-basis % |
| Partial coverage | some 연동 예정 | some 연동 예정 | some 연동 예정 | some 연동 예정 | cost-basis % (fallback) |

| State | Dividend columns (배당률 / 예상 연배당금 / 배당주기) |
|---|---|
| All states | 데이터 대기 (unchanged until dividend model exists) |

### Portfolio-level freshness badge copy

| QuoteFreshnessState | Korean copy |
|---|---|
| `'fresh'` | (no badge) |
| `'cached'` | 캐시 기준 |
| `'stale'` | 갱신 필요 |
| `'market_closed'` | 장 마감 기준 |
| `'partial'` | 일부 연동 |
| `'unavailable'`, `'auth_error'`, `'config_missing'`, `'not_implemented'` | 연동 예정 |
| `'provider_error'`, `'rate_limited'` | 갱신 실패 |
| `'unsupported_symbol'` | 미지원 종목 |

---

## 8. Invariants (Must Remain True in All Implementations)

1. `rawProviderStored` is always `false` in every `QuoteSnapshot` that leaves the server provider layer.
2. `currentPrice` is never fabricated — it is null unless a real (provider-fresh or cache-backed) quote exists.
3. `returnRate` is null whenever `costBasisLocal` is 0 or `currentPrice` is null.
4. Null sort values always sort below non-null values, regardless of sort direction.
5. `KIS_APP_KEY`, `KIS_APP_SECRET`, `KIS_BASE_URL` never appear in any serialized API response.
6. `access_token` from KIS OAuth never appears in any client-side response or log.
7. `providerMeta` is stripped before any `QuoteSnapshot` is serialized into a public API response.
8. Dividend fields remain `null` until a separate dividend data model is implemented.
9. `VERCEL_ENV=production` always results in `ready: false` from `getKisQuoteConfigReadiness`.
10. `assertServerRuntime` is called at the top of every public function in any server-only provider module.
