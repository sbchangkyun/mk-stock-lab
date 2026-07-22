# Phase 3BX Portfolio UI Valuation Mapping with Fixture API — Result v0.1

## 1. Title and Metadata

- **Phase**: 3BX
- **Type**: Portfolio UI Valuation Mapping with Fixture API Data
- **Status**: Implemented
- **Latest prior commit**: 9f4a723 fix: persist portfolio tab order locally
- **Runtime UI changes**: yes — portfolio.astro wired to POST /api/portfolio/valuation
- **API route changes**: none (route added in Phase 3BW, unchanged)
- **DB / Supabase changes**: none
- **Live KIS calls**: none
- **Live GNews calls**: none
- **Deployment**: not performed

## 2. Objective

Wire the Portfolio page holdings table to the existing fixture-only `POST /api/portfolio/valuation` route (added in Phase 3BW) so that registered holdings display fixture-backed values for 현재가 (current price), 평가금 (market value), 수익률 (unrealized P&L %), and 수익금 (unrealized P&L amount). All columns that cannot yet be populated remain as `연동 예정`. Dividend columns remain as `데이터 대기`. No live KIS calls are introduced.

## 3. Implementation Summary

### New state fields in AppState

Three fields added to `AppState` in `portfolio.astro`:

- `positionValuations: Record<string, PositionValuation>` — keyed by `position.id` (or `market:symbol` if no id)
- `valuationStatus: ValuationStatus` — `'idle' | 'loading' | 'ready' | 'partial' | 'error'`
- `valuationMessage: string | null` — fixture disclosure copy or error message

### New types

- `ValuationStatus` — union type for the fetch lifecycle state
- `PositionValuation` — stores `currentPrice`, `marketValue`, `unrealizedPnl`, `unrealizedPnlPct` (all nullable)

### New helper functions

#### `getPositionValuation(position: DisplayPortfolioPosition): PositionValuation | null`

Looks up valuation by `position.id` as primary key, falling back to `` `${position.market}:${position.symbol}` ``. Returns `null` when no valuation data exists for the position.

#### `loadValuation(portfolioId, positions)`

Async function that:
1. Resets valuation state to idle
2. Filters positions to those the route can accept (valid market/assetType/currency/quantity/price)
3. Sets `valuationStatus = 'loading'`
4. Sends `POST /api/portfolio/valuation` with `source: 'fixture'` and all valid positions (passes `id` field when available so `positionId = position.id` in the response)
5. Maps response `rows` into `state.positionValuations` keyed by `row.positionId`
6. Sets `valuationStatus` to `'ready'` / `'partial'` / `'idle'` based on quote coverage
7. Sets `valuationMessage` to fixture disclosure copy
8. Calls `renderPositions()` to update the UI

On any fetch failure or invalid response: sets `valuationStatus = 'error'` and sets error message, then calls `renderPositions()`.

### Updated `getPositionSortValue`

Added three new sort cases using `getPositionValuation`:
- `'valuation'` → `posVal?.marketValue`
- `'return'` → `posVal?.unrealizedPnlPct`
- `'profit'` → `posVal?.unrealizedPnl`

Null values sort to the bottom per the existing sort contract.

### Updated `renderPositions`

- Added status copy element update at the start of each render
- Replaced `const valuation = getValuationPlaceholder(...)` with `const posVal = getPositionValuation(position)`
- Added four display variable computations: `currentPriceDisplay`, `marketValueDisplay`, `pnlPctDisplay`, `pnlDisplay`
- Updated 현재가/평가금/수익률/수익금 cells to show fixture values when available, `연동 예정` as fallback
- `metric-placeholder` class applied conditionally (only when display value is null)

### Updated `loadPositions`

`await loadValuation(portfolioId, state.positions)` added after each `renderPositions()` call:
- Aggregate view: render → loadValuation
- Single portfolio: render → loadValuation

This means positions render immediately (showing `연동 예정` for unvalued fields), then re-render once the fixture API responds with values.

### Updated `clearPortfolioData`

Resets `positionValuations = {}`, `valuationStatus = 'idle'`, `valuationMessage = null` on sign-out or data clear.

### HTML: valuation status copy element

Added `<p class="valuation-status-copy" id="valuation-status-copy" hidden></p>` after `<p id="selected-portfolio-meta">` in the portfolio panel header. Updated by `renderPositions` to show loading/error/disclosure messages.

### CSS: .valuation-status-copy

Added muted small-text style (0.75rem, `var(--text-muted)`, 0.8 opacity, 4px top margin).

## 4. Column Behavior After 3BX

| Column | Before 3BX | After 3BX (KR fixture symbols) | After 3BX (US/unknown) |
|---|---|---|---|
| 현재가 | 연동 예정 | Fixture price (e.g., 73,000원) | 연동 예정 |
| 평가금 | 데이터 대기 | Fixture market value | 연동 예정 |
| 수익률 | 연동 예정 | +21.67% (sign-prefixed) | 연동 예정 |
| 수익금 | 연동 예정 | +130,000원 (sign-prefixed) | 연동 예정 |
| 배당률 | 데이터 대기 | 데이터 대기 (unchanged) | 데이터 대기 |
| 예상 연배당금 | 데이터 대기 | 데이터 대기 (unchanged) | 데이터 대기 |
| 배당주기 | 데이터 대기 | 데이터 대기 (unchanged) | 데이터 대기 |
| 비중 | cost-basis % | cost-basis % (unchanged) | cost-basis % |

### Fixture symbols and expected values

- 005930 (Samsung Electronics): 73,000 KRW
- 000660 (SK Hynix): 198,000 KRW
- 035420 (NAVER, stale-but-usable): 185,000 KRW
- 069500 (KODEX 200): 34,000 KRW
- US symbols: null quotes (no fixture data)

## 5. Fixture Disclosure Copy

When fixture data loads successfully: `'Fixture 기준 평가값입니다. 실시간 시세가 아닙니다.'`

When fetch fails: `'평가값을 불러오지 못해 등록 금액 기준 정보만 표시합니다.'`

This copy is shown in the `#valuation-status-copy` paragraph below the portfolio meta text.

## 6. Valuation Key Strategy

| View | Key sent to route | positionId in response | Lookup key in state |
|---|---|---|---|
| Single portfolio | `id: position.id` (UUID) | `position.id` | `position.id` |
| Aggregate view | `id: aggregate-KR--005930` | `aggregate-KR--005930` | `position.id` (same synthetic ID) |

For aggregate positions, `position.id = toSafeAggregateId(key)` is passed, so valuation lookup is consistent.

## 7. Boundary Preservation

- Valuation route `POST /api/portfolio/valuation` — unchanged
- Fixture resolver — unchanged
- Tab order localStorage persistence (3BW-HF1) — unchanged; no new localStorage keys
- Portfolio bookmark tabs — unchanged
- Position CRUD (add/edit/delete) — unchanged
- Home Portfolio Panel — unchanged
- Home Market News — unchanged
- No Supabase schema changes
- No new API routes
- No live KIS or GNews calls

## 8. Validation Results

| Check | Result |
|---|---|
| `npm run check:portfolio-ui-valuation-fixture` | 71/71 PASS |
| `npm run check:portfolio-valuation-api` | 124/124 PASS |
| `npm run check:portfolio-holdings-header` | 90/90 PASS |
| `npm run check:portfolio-tab-order-persistence` | 61/61 PASS |
| `npm run check:portfolio-bookmark-tabs` | 121/121 PASS |
| `npm run check:portfolio-create-sheet` | 79/79 PASS |
| `npm run check:portfolio-layout` | 73/73 PASS |
| `npm run check:gnews-news-policy` | PASS |
| `npm run check:kis-quote-adapter-mocked` | 101/101 PASS |
| `npm run check:kis-valuation-design` | 73/73 PASS |
| `npm run check:home-portfolio-panel` | 102/102 PASS |
| `npm run check:home-market-news` | 57/57 PASS |
| `npm run check:provider-boundaries` | PASS |
| `npm run check:kis-error-fallback` | 48/48 PASS |
| `npm run build` | PASS |

## 9. Remaining Limitations

- **Fixture-only**: all valuation data comes from hard-coded synthetic quotes, not live market data
- **KR only**: only 4 KR symbols have fixture quotes; all US positions show `연동 예정`
- **No FX**: USD positions cannot show KRW-equivalent market value (FX not available)
- **No dividend data**: 배당률/예상 연배당금/배당주기 remain `데이터 대기`
- **No live KIS**: Phase 3BZ (planned) will enable controlled live quote fetching

## 10. Recommended Next Phase

**Phase 3BY — Owner Browser Review**: validate that fixture valuation values display correctly in the portfolio holdings table, that the status copy shows as expected, and that sort by 평가금/수익률/수익금 works correctly.
