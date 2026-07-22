# Phase 3BW-HF1 Portfolio Bookmark Tab Order Local Persistence Hotfix — Result v0.1

## 1. Title and Metadata

- **Phase**: 3BW-HF1
- **Type**: Portfolio Bookmark Tab Order Local Persistence Hotfix
- **Status**: Implemented
- **Latest prior commit**: c8de065 feat: add fixture portfolio valuation api
- **Runtime UI changes**: yes — `portfolio.astro` localStorage tab order persistence only
- **API route changes**: none
- **DB / Supabase changes**: none
- **Live KIS calls**: none
- **Live GNews calls**: none
- **Deployment**: not performed

## 2. Objective

Persist user portfolio bookmark tab order in browser `localStorage` so that left/right tab movement survives page refresh and same-browser navigation, without adding server persistence, Supabase schema changes, or new API routes.

## 3. Owner Issue

Phase 3BN introduced bookmark-style portfolio tabs with left/right reorder arrows. The implementation used client-memory-only state: `state.portfolioOrder` held the current tab order in-memory but was never saved to `localStorage` or any persistent store.

- Left/right tab movement worked visually during the session.
- After refreshing `/portfolio` or navigating away and returning, `state.portfolioOrder` was reset because `loadPortfolios` reconstructed it from the API response order.
- The user expected left/right movement to be saved — the physical movement implied persistence.
- Phase 3BN intentionally deferred persistence (documented as "client-memory-only"), but owner browser review after Phase 3BW identified this as a critical UX regression.

## 4. Implementation Summary

### localStorage key

- Key: `mk-stock-lab:portfolio-tab-order:v1`
- Constant: `TAB_ORDER_STORAGE_KEY`
- Scope: global browser key (profile-scoped key deferred; user ID not available in current state without additional API calls)

### Storage functions

- `readTabOrderFromStorage(): string[]` — reads and validates saved order; returns `[]` on missing/invalid data; cleans up invalid JSON with `removeItem`.
- `saveTabOrderToStorage(ids: string[]): void` — writes JSON-encoded ID array; fails silently on quota/security errors.

### Read/restore timing

`loadPortfolios()` calls `readTabOrderFromStorage()` on every invocation. The saved order is used as `baseOrder` for reconciliation. This means the saved order is applied on initial page load, on portfolio refresh, and after create/delete/edit operations.

### Reorder save timing

`saveTabOrderToStorage(state.portfolioOrder)` is called immediately after the index swap in the reorder handler, before `renderPortfolios()`. This ensures the persisted order reflects the user's intent within the same interaction.

### Create reconciliation

After `portfolioApi.createPortfolio`, `loadPortfolios()` is called. Reconciliation appends the new portfolio ID (not in `baseOrder`) at the end of the user tab area.

### Delete reconciliation

After `portfolioApi.deletePortfolio`, `loadPortfolios()` is called. Reconciliation filters out the deleted ID (no longer in `knownIds`) from `baseOrder`.

### Edit/rename reconciliation

After `portfolioApi.updatePortfolio`, `loadPortfolios()` is called. The portfolio ID is unchanged; saved order is preserved exactly.

### Aggregate and add tab behavior

- Aggregate tab (`__all_portfolios__`) is never part of `state.portfolioOrder` (it is not in `state.portfolios` returned by the API). It is always rendered first, pinned left.
- Add tab (`+추가`) is a separate UI button, never a portfolio record. It is always rendered last, after user portfolio tabs.
- Neither is included in the stored ID array.

### Defensive error handling

Both `readTabOrderFromStorage` and `saveTabOrderToStorage` are wrapped in `try/catch`. If `localStorage` is unavailable (private browsing restrictions, quota exceeded, security policy), errors are swallowed and the in-memory order is preserved for the current session.

## 5. Persistence Scope

- **Browser-local only**: order persists within the same browser and device.
- **Not account/server synchronized**: different browsers or devices will not share order.
- **Clearing browser storage resets order**: if the user clears localStorage, the tab order resets to API default on next load.
- **No Supabase `orderIndex`**: no database column was added.
- **No DB schema**: no migration was created.
- **Server persistence deferred**: a future phase may add a `portfolioOrder` column or serverless KV store if cross-device sync is needed.

## 6. Boundary Preservation

- Aggregate tab `전체` pinned left — behavior unchanged.
- Add tab `+추가` pinned right/end — behavior unchanged.
- User portfolio tabs only are persisted — aggregate and add tab are excluded from stored IDs.
- Portfolio create bottom sheet (`portfolio-sheet`) — unchanged.
- Position add/edit sheet (`position-sheet`) — unchanged.
- Holdings category header — unchanged.
- Valuation API route (`POST /api/portfolio/valuation`) — not modified; remains fixture-only.
- Valuation UI: still not wired — `portfolio.astro` still renders placeholder values for 현재가, 평가금, 수익률, 수익금.

## 7. Privacy and Safety

Only stored in localStorage under `mk-stock-lab:portfolio-tab-order:v1`:

- Portfolio IDs (opaque UUID strings from Supabase)

Not stored:

- Portfolio names
- Position symbols
- Buy prices
- Quantities
- Memo content
- Valuation data
- Quote data
- API response payloads
- User email
- Tokens or secrets
- Supabase URLs or project references

## 8. Validation Results

| Check | Result |
|---|---|
| `npm run check:portfolio-tab-order-persistence` | 55/55 PASS |
| `npm run check:portfolio-bookmark-tabs` | 121/121 PASS |
| `npm run check:portfolio-create-sheet` | 79/79 PASS |
| `npm run check:portfolio-holdings-header` | 90/90 PASS |
| `npm run check:portfolio-layout` | 73/73 PASS |
| `npm run check:portfolio-valuation-api` | 114/114 PASS |
| `npm run check:kis-quote-adapter-mocked` | 101/101 PASS |
| `npm run check:kis-valuation-design` | 73/73 PASS |
| `npm run check:provider-boundaries` | PASS |
| `npm run check:kis-runtime-guard` | PASS |
| `npm run check:kis-error-fallback` | 48/48 PASS |
| `npm run check:home-portfolio-panel` | 102/102 PASS |
| `npm run check:home-market-news` | 57/57 PASS |
| `npm run check:gnews-news-policy` | PASS |
| `npm run check:gnews-news-engine` | PASS |
| `npm run check:gnews-news-api-route` | PASS |
| `npm run check:gnews-news-api-response` | 148/148 PASS |
| `npm run check:gnews-news-route-source-selector` | PASS |
| `npm run check:gnews-live-adapter-design` | PASS |
| `npm run check:gnews-live-adapter-static` | 148/148 PASS |
| `npm run check:gnews-live-adapter-mocked` | PASS |
| `npm run smoke:gnews-live:dry` | PASS |
| `git diff --check` | clean |
| `git status --short` | clean |
| `npm run build` | PASS |

## 9. Remaining Limitations

- **localStorage only**: order does not sync across browsers or devices.
- **Storage cleared = order reset**: clearing browser data removes saved order.
- **No cross-device sync**: a user who logs in on a second device will see API default order.
- **Server-side `orderIndex` deferred**: Supabase column + API route persistence may be added in a future phase.
- **Portfolio UI valuation mapping still deferred**: `portfolio.astro` still shows placeholder values for 현재가, 평가금, 수익률, 수익금. Phase 3BX will connect the UI to the fixture valuation API.
- **Live KIS still disabled**: no live quote data is fetched.

## 10. Recommended Next Phase

**Phase 3BX — Portfolio UI Valuation Mapping with Fixture API Data**

Wire the portfolio holdings display to `POST /api/portfolio/valuation` (added in Phase 3BW). Replace the placeholder values for 현재가, 평가금, 수익률, 수익금 with computed data from the fixture quote resolver. No live KIS calls; fixture-only.
