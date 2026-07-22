# Phase 3BV — KIS Quote Adapter Contract & Mocked Provider Tests Result v0.1

## 1. Title and Metadata

- **Phase**: 3BV
- **Type**: KIS Quote Adapter Contract & Mocked Provider Tests
- **Status**: Implemented
- **Latest prior commit**: 0c3a6cb docs: plan kis valuation integration
- **Runtime UI changes**: none
- **API route changes**: none
- **DB / Supabase changes**: none
- **Live KIS calls**: none
- **Live GNews calls**: none
- **Deployment**: not performed

---

## 2. Objective

This phase hardens the future KIS valuation integration contract by extending the server-side valuation module with no-network computation helpers, then validating them with pure mocked/synthetic quote data. No live KIS calls, no API routes, no UI changes, and no database changes are made. The goal is to verify that the data flow from `QuoteSnapshot → PortfolioValuationRow → PortfolioValuationSummary` is correctly computed, safely stripped of raw provider metadata, and handles all error/unavailable/partial/mixed-currency states correctly — before any live provider integration occurs.

---

## 3. Existing Server Skeleton Observed

### `src/lib/server/portfolioValuation.ts`

- `buildPortfolioValuationReadiness`: builds placeholder rows with `currentPrice: null`, `marketValue: null`, `unrealizedPnl: null`, `staleState: 'unavailable'`. Called `assertServerRuntime(moduleName)` at top.
- `buildAggregatePortfolioValuationReadiness`: same as above for `scope: 'all'` with `baseCurrency: 'MIXED'`.
- `buildPlaceholderRow`: internal helper computing `costBasis = buyPrice × quantity`, leaving all quote-backed fields null.
- No quote-aware computation existed before this phase.

### `src/lib/server/providers/types.ts`

Pre-existing type definitions used by this phase:
- `PortfolioValuationRow`: positionId, displayName, currentPrice, marketValue, costBasis, unrealizedPnl, unrealizedPnlPct, valuationCurrency, quoteAsOf, staleState.
- `PortfolioValuationSummary`: scope, portfolioId, rows, totalCostBasis, totalMarketValue, totalUnrealizedPnl, baseCurrency, staleState.
- `QuoteSnapshot`: market, symbol, price, currency, change, changePct, volume, marketState, asOf, staleState, `providerMeta?` (internal-only).
- `FallbackState`: `'fresh' | 'stale-but-usable' | 'expired' | 'unavailable' | 'sample'`.
- `ProviderErrorCode`: 10 controlled codes.

### `src/lib/server/providers/serverOnly.ts`

- `assertServerRuntime(moduleName)`: throws `ServerOnlyRuntimeError` if `typeof window !== 'undefined'`. Called at the top of every exported server-module function.

### `src/lib/server/providers/providerErrors.ts`

- `createProviderError`: returns typed `ProviderErrorEnvelope` with controlled `code` and sanitized `message`.
- `sanitizeUnknownError`: catches all unknown thrown errors and returns `{ ok: false, code: 'INTERNAL_ERROR', message: 'Provider operation failed safely.' }` — raw error never forwarded.

---

## 4. Mocked Quote Contract Tested

### Successful quote (synthetic example from instruction)

| Input | Value |
|---|---|
| `buyPrice` | 60000 |
| `quantity` | 10 |
| Quote `price` | 75000 |
| Quote `staleState` | `'fresh'` |

Expected outputs (verified in `check:kis-quote-adapter-mocked`):

| Field | Expected value |
|---|---|
| `costBasis` | 600000 |
| `currentPrice` | 75000 |
| `marketValue` | 750000 |
| `unrealizedPnl` | 150000 |
| `unrealizedPnlPct` | 25 |
| `staleState` | `'fresh'` |
| `quoteAsOf` | Quote timestamp |
| `providerMeta` | Absent from row |

### Unavailable quote (null)

| Field | Expected value |
|---|---|
| `costBasis` | 600000 (always available) |
| `currentPrice` | `null` |
| `marketValue` | `null` |
| `unrealizedPnl` | `null` |
| `unrealizedPnlPct` | `null` |
| `staleState` | `'unavailable'` |

### Unsupported market (US positions — KIS KR-only in this phase)

Valuation layer receives `null` quote because KIS domestic adapter validates `market === 'KR'`. Result: same as unavailable quote. `costBasis` available; all quote-backed fields null; `staleState: 'unavailable'`.

### Provider error

Maps to controlled `ProviderErrorCode`. No raw KIS fields, no stack trace, no credential strings exposed. Per-position error does not crash the portfolio-level response.

### Partial coverage

Some positions have quotes, some do not. `totalMarketValue` remains null (cannot reliably aggregate). `quoteCoverage: 'partial'`. `staleState: 'stale-but-usable'`.

### Mixed currency

KRW + USD positions in same portfolio. `totalMarketValue: null` because FX conversion is not implemented. `totalUnrealizedPnl: null`. `totalCostBasis` still computed per-currency sum.

### Raw provider stripping

`providerMeta` (which exists on the internal `QuoteSnapshot` type) is intentionally excluded from `PortfolioValuationRow`. The comment `// providerMeta intentionally excluded from PortfolioValuationRow output` is in `portfolioValuation.ts`.

---

## 5. Valuation Computation Behavior

### Position-level (`buildPositionValuationFromQuote`)

| Condition | `currentPrice` | `marketValue` | `unrealizedPnl` | `unrealizedPnlPct` |
|---|---|---|---|---|
| Quote available | `quote.price` | `price × qty` | `mv - costBasis` | `unrealized / costBasis × 100` |
| Quote null | `null` | `null` | `null` | `null` |
| `costBasis === 0` | `quote.price` | computed | computed | `null` (no div-by-zero) |
| Break-even price | `quote.price` | computed | `0` | `0` |
| Loss scenario | `quote.price` | `< costBasis` | negative | negative |

### Portfolio-level (`buildPortfolioValuationFromQuotes`)

| Condition | `totalMarketValue` | `totalUnrealizedPnl` | `staleState` | `quoteCoverage` |
|---|---|---|---|---|
| All quoted, same currency, all fresh | Computed | Computed | `'fresh'` | `'all'` |
| All quoted, same currency, some stale | Computed | Computed | `'stale-but-usable'` | `'all'` |
| Partial coverage | `null` | `null` | `'stale-but-usable'` | `'partial'` |
| No quotes | `null` | `null` | `'unavailable'` | `'unavailable'` |
| Mixed currencies (KRW + USD) | `null` | `null` | Computed per-row | Depends on coverage |
| Empty positions | `null` | `null` | `'unavailable'` | `'unavailable'` |

---

## 6. Public Safety Contract

The following invariants are enforced by `buildPositionValuationFromQuote` and validated by the checker:

| Invariant | How enforced |
|---|---|
| `providerMeta` absent from `PortfolioValuationRow` | Not spread into row struct; explicit comment |
| Raw KIS field names absent (`stck_prpr`, `prdy_vrss`, `rt_cd`, etc.) | Never assigned to row fields |
| `rawProviderStored` never `true` in output | Field is never set; not part of `PortfolioValuationRow` |
| No credential strings (`access_token`, `appkey`, `appsecret`) | Never forwarded from internal types |
| No stack trace in public error messages | `sanitizeUnknownError` returns fixed safe message |
| Errors mapped to `ProviderErrorCode` enum | `createProviderError` only accepts controlled codes |

---

## 7. FX and Currency Behavior

- **Same-currency aggregation** (all KRW or all USD): `totalMarketValue` is computed when quote coverage is `'all'`.
- **Mixed-currency aggregation** (KRW + USD positions): `totalMarketValue` remains `null` because FX conversion is not yet implemented. Tested in checker Group 11.
- **FX provider**: remains deferred (Phase 3BZ or later).
- **No fabricated exchange rates**: the `allSameCurrency` guard in `buildPortfolioValuationFromQuotes` ensures cross-currency aggregation only happens when FX is resolved (currently never, by design).
- **`totalCostBasis`**: always computed, even for mixed-currency portfolios. This is a sum of same-denomination cost bases (per the `PortfolioPositionInput.currency` field) — mixed-currency totals are not semantically meaningful but remain available for display.

---

## 8. Error and Fallback Behavior

- **Unsupported symbol**: KIS client returns `SYMBOL_UNSUPPORTED` for non-KR or non-six-digit symbols. The valuation layer receives `null` quote, sets all computed fields to `null`, sets `staleState: 'unavailable'`. Cost basis remains available.
- **Provider unavailable**: `PROVIDER_UNAVAILABLE` returned with sanitized message. Per-position fallback to placeholder; portfolio continues with partial coverage.
- **Config missing / feature flag off**: `CONFIG_MISSING` returned. All positions return `staleState: 'unavailable'`.
- **Per-position error does not crash portfolio**: `buildPortfolioValuationFromQuotes` maps over all positions; each position independently gets either a computed row or a placeholder row based on whether a quote is available in the input map. No exception propagation.
- **`costBasis` always available**: `buildPlaceholderRow` and `buildPositionValuationFromQuote` both compute `costBasis = buyPrice × quantity` unconditionally.

---

## 9. Files Changed

| File | Change |
|---|---|
| `src/lib/server/portfolioValuation.ts` | Added `QuoteSnapshot` import; added `buildPositionValuationFromQuote` (internal helper); added `buildPortfolioValuationFromQuotes` (exported function) |
| `scripts/check_kis_quote_adapter_mocked_contract.mjs` | New 80-check no-network mocked contract checker (created) |
| `scripts/check_kis_error_fallback_paths.mjs` | Added Group G: 8 valuation-computation fallback path tests |
| `scripts/check_kis_valuation_pre_design_static_contract.mjs` | Added Phase 3BV artifact checks |
| `scripts/check_gnews_news_policy_static_contract.mjs` | Added Phase 3BV artifact group |
| `docs/planning/phase_3bv_kis_quote_adapter_contract_mocked_tests_result_v0.1.md` | This result doc (created) |
| `docs/planning/planning_changelog.md` | Phase 3BV entry prepended |
| `package.json` | `check:kis-quote-adapter-mocked` script added |

---

## 10. Validation Results

All commands run prior to commit:

| Command | Result |
|---|---|
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

## 11. Boundaries Confirmed

- No live KIS calls
- No live GNews calls
- No external HTTP requests
- No `.env` file reads
- No secrets, credentials, or raw provider content printed or recorded
- No API routes added
- No DB/migration/Supabase schema or storage changes
- No UI runtime page, style, or component files modified
- No deployment
- No `/news` page created
- No background scheduler or cron added
- No FX provider added
- No dividend model added

---

## 12. Remaining Limitations

- **Live KIS adapter still not enabled**: `KIS_ENABLE_LIVE_QUOTES` remains unset; `kisClient.ts` returns `CONFIG_MISSING` in all environments.
- **Valuation API route not implemented**: `/api/portfolio/valuation` does not exist yet. UI still receives placeholder rows from `buildPortfolioValuationReadiness`.
- **UI still shows placeholders**: Portfolio holdings table shows "연동 예정" for 현재가, 평가금, 수익률, 수익금 columns until Phase 3BX UI mapping.
- **Cache persistence deferred**: In-memory token cache only; no Supabase quote cache.
- **FX deferred**: Mixed-currency `totalMarketValue` remains null.
- **Dividend data deferred**: 배당률, 예상 연배당금, 배당주기 remain "데이터 대기".
- **US market quotes deferred**: KIS domestic adapter only supports 6-digit KR symbols. US positions always return `staleState: 'unavailable'`.
- **Tab order persistence deferred**.

---

## 13. Recommended Next Phases

- **Phase 3BW**: Portfolio Valuation API Route with Fixture/Mocked Quotes — implement `/api/portfolio/valuation` route using `buildPortfolioValuationFromQuotes` with fixture quotes; add static checker for route shape and response envelope.
- **Phase 3BX**: Portfolio UI Valuation Mapping with Cached/Mocked Data — wire Portfolio holdings table columns to valuation route response; map 현재가/평가금/수익률/수익금 from route fields; update 비중 to market-value weight when `quoteCoverage === 'all'`; update refresh button behavior.
- **Phase 3BY**: Owner-run KIS Live Smoke Test (dry-run first, then `--execute-live` only after dry-run passes; Claude Code must not execute this).
- **Phase 3BZ**: Controlled Live Quote Enablement Behind Kill Switch — `KIS_ENABLE_LIVE_QUOTES=true` in local/preview; production remains permanently blocked.
