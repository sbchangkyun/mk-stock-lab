# Portfolio Experience State Contract v0.1

Design-only document. No runtime code is generated from this file in Phase 3BK.
Types are written in TypeScript-style for readability and future implementation reference.

---

## PortfolioHomeState

The three mutually exclusive states rendered by the Home portfolio status panel.

```typescript
type PortfolioHomeState =
  | 'loading'               // auth check in progress; show skeleton or neutral placeholder
  | 'signed_out'            // no active session; show 4-step onboarding guide
  | 'signed_in_empty'       // session exists but no portfolios saved; show 4-step guide with emphasis on step 2
  | 'signed_in_with_portfolio' // session exists and at least one portfolio saved; show compact dashboard
  | 'error';                // panel could not determine state; show neutral fallback (treat as signed_out)
```

---

## PortfolioPageState

The more granular state machine for the Portfolio page, matching the existing
`PortfolioState` type in `portfolio.astro` and extending it with UX-meaningful coarse states.

```typescript
// Existing fine-grained states (from portfolio.astro PortfolioState type)
type PortfolioPageFineState =
  | 'checking'
  | 'public_config_missing'
  | 'signed_out'
  | 'signed_in'
  | 'profile_pending'
  | 'profile_ready'
  | 'profile_failed'
  | 'profile_config_missing'
  | 'api_pending'
  | 'portfolio_config_missing'
  | 'ready';

// Coarse UX states used for rendering bookmark tabs and dashboard
type PortfolioPageCoarseState =
  | 'loading'               // checking / profile_pending / api_pending
  | 'signed_out'            // signed_out
  | 'signed_in_empty'       // ready but portfolios.length === 0
  | 'signed_in_with_portfolio' // ready and portfolios.length > 0
  | 'error';                // profile_failed / profile_config_missing / portfolio_config_missing / public_config_missing
```

---

## PortfolioSummary

Aggregate metrics shown in the Home portfolio panel (state C) and on the Portfolio page
aggregate dashboard. Fields marked `placeholder` have no live data yet — they are derived
from cost-basis-only data. Fields marked `future` depend on live KIS market data.

```typescript
type PortfolioSummary = {
  // --- Cost-basis metrics (implemented: derived from buyPrice × quantity) ---

  /** Total invested cost across all positions. Always available once positions are loaded. */
  totalCost: number;                        // IMPLEMENTED — cost basis only

  /** Number of saved portfolios. Counted from portfolios array. */
  portfolioCount: number;                   // IMPLEMENTED

  /** Total position entries across all portfolios. */
  holdingCount: number;                     // IMPLEMENTED

  // --- Valuation metrics (placeholder: requires live KIS quote data) ---

  /** Current total market value. null until KIS market data is connected. */
  totalValue: number | null;                // PLACEHOLDER — null in current phase

  /** Unrealized profit/loss in currency amount. null until live price available. */
  profitAmount: number | null;              // PLACEHOLDER

  /** Unrealized profit/loss as a percentage. null until live price available. */
  profitRate: number | null;               // PLACEHOLDER

  // --- Allocation summaries (placeholder: requires position count > 0 and categorization) ---

  /** Distribution by market region. Derived from position.market field. */
  allocationByRegion: AllocationEntry[] | null;    // PLACEHOLDER (can compute from existing data)

  /** Distribution by asset class (stock / etf). Derived from position.assetType field. */
  allocationByAssetClass: AllocationEntry[] | null; // PLACEHOLDER (can compute from existing data)

  /** Distribution by dividend payment cycle. Requires dividend metadata — not yet stored. */
  allocationByDividendCycle: AllocationEntry[] | null; // FUTURE (requires dividend data)

  // --- Optional / future fields ---

  /** Top N holdings by cost basis. Optional, shown if holdingCount > 0. */
  topHoldings?: HoldingSummary[];           // PLACEHOLDER (can compute from existing data)

  /** ISO 8601 timestamp of last successful data load. */
  updatedAt?: string;                       // IMPLEMENTED (client load time)

  /** Indicator of data freshness: 'cost_basis_only' | 'live_quote' */
  valuationStatus: 'cost_basis_only' | 'live_quote'; // IMPLEMENTED — always 'cost_basis_only' now
};

type AllocationEntry = {
  label: string;         // Display label (e.g. "국내", "미국", "ETF")
  key: string;           // Normalized key (e.g. "KR", "US", "etf")
  count: number;         // Number of positions
  weight: number;        // 0–100 percentage (by count, not value, until live data available)
};
```

---

## PortfolioRecord

Matches the existing `Portfolio` type in `portfolioClient.ts` and Supabase `portfolios` table.

```typescript
type PortfolioRecord = {
  id: string;               // UUID
  name: string;             // User-defined name, max 120 chars
  baseCurrency: 'KRW' | 'USD';
  createdAt: string;        // ISO 8601
  updatedAt: string;        // ISO 8601

  // --- UI-only fields, not stored in DB ---
  orderIndex: number;       // Derived from client-side portfolioOrder array
  holdingCount: number;     // Derived by counting positions for this portfolio
  canMoveLeft: boolean;     // true if orderIndex > 0
  canMoveRight: boolean;    // true if orderIndex < userPortfolios.length - 1
};
```

---

## HoldingSummary

Normalized position for display. Derived from `PortfolioPosition` (portfolioClient.ts).
Valuation fields are placeholder until live KIS data is connected.

```typescript
type HoldingSummary = {
  id: string;
  symbol: string;
  name: string | null;
  market: 'KR' | 'US';
  assetType: 'stock' | 'etf';
  currency: 'KRW' | 'USD';
  quantity: number;
  averagePrice: number;        // buyPrice from PortfolioPosition

  // --- Placeholder fields (null until KIS market data connected) ---
  currentPrice: number | null; // PLACEHOLDER
  evaluatedAmount: number | null; // PLACEHOLDER (currentPrice × quantity)
  profitAmount: number | null; // PLACEHOLDER (evaluatedAmount - costBasis)
  profitRate: number | null;   // PLACEHOLDER ((profitAmount / costBasis) × 100)

  // --- Future fields (require dividend data source) ---
  dividendYield?: number | null;  // FUTURE
  dividendCycle?: 'monthly' | 'quarterly' | 'semi-annual' | 'annual' | 'irregular' | null; // FUTURE
  region?: 'domestic' | 'international' | null; // FUTURE (can be inferred from market)
};
```

---

## BookmarkTab

Represents a single tab in the portfolio bookmark tab bar on the Portfolio page.

```typescript
type BookmarkTabType = 'aggregate' | 'portfolio' | 'add';

type BookmarkTab = {
  /** Discriminator for the three tab types. */
  type: BookmarkTabType;

  /**
   * Stable identifier.
   * - 'aggregate' tab: id === '__all_portfolios__' (matches existing aggregatePortfolioId)
   * - 'portfolio' tabs: id === portfolio.id (UUID)
   * - 'add' tab: id === '__add_portfolio__'
   */
  id: string;

  /** Display label shown in the tab. */
  label: string;
  // aggregate → '전체 포트폴리오'
  // portfolio → portfolio.name (e.g. '국내계좌')
  // add → '추가'  (with + icon)

  /** true for aggregate and add tabs; false for user portfolio tabs. */
  pinned: boolean;

  /**
   * Zero-based visual order index within the movable tabs only (portfolio type).
   * Aggregate tab is always at visual position 0; add tab is always last.
   * orderIndex is only meaningful for type === 'portfolio'.
   */
  orderIndex: number;

  /** Whether this tab can move one slot to the left (decreasing orderIndex). */
  canMoveLeft: boolean;   // false if pinned or orderIndex === 0

  /** Whether this tab can move one slot to the right (increasing orderIndex). */
  canMoveRight: boolean;  // false if pinned or orderIndex === userTabs.length - 1

  /** Whether this tab is the currently active/selected view. */
  isActive: boolean;
};
```

### Reorder rules

| Action | Allowed | Boundary |
|--------|---------|----------|
| Move portfolio tab left | Yes | Cannot move before aggregate tab (orderIndex === 0) |
| Move portfolio tab right | Yes | Cannot move after add tab (orderIndex === userTabs.length - 1) |
| Move aggregate tab | No | Always pinned at left |
| Move add tab | No | Always pinned at right |

### Hover affordance (desktop)

When hovering over a portfolio tab (type === `portfolio`):
- Show directional arrows: `‹ {label} ›`
- Left arrow (`‹`): disabled when `canMoveLeft === false`
- Right arrow (`›`): disabled when `canMoveRight === false`
- Arrow clicks fire reorder action, not navigation

### Mobile affordance

Mobile devices have no hover state. Options (decision deferred to Phase 3BN):
1. Long-press to enter reorder mode (shows arrows)
2. Tap-to-select, edit mode accessible via context menu / kebab icon
3. Touch-drag reorder (complex; deferred beyond Phase 3BN)

**Recommendation for Phase 3BN first implementation**: Long-press with 500ms threshold
to reveal reorder arrows, styled as inline icon buttons adjacent to the tab label.

### Persistence (first implementation)

Tab order is stored in client-side memory only (matching existing `state.portfolioOrder` array).
Order resets on page reload. Backend persistence and localStorage are deferred.

---

## RefreshIntent

Describes what the refresh button action means at each phase of implementation.

```typescript
type RefreshIntent =
  | 'recalculate_view'       // Re-derive displayed values from already-loaded client state (no network)
  | 'reload_portfolio_data'  // Re-fetch portfolios and positions from API (/api/portfolio/*)
  | 'refetch_quote_later'    // Placeholder for future: fetch live market prices from KIS (not yet)
  | 'sync_backend_later';    // Placeholder for future: sync with backend cache (not yet)
```

### Phase mapping

| Phase | Refresh action | What it does |
|-------|---------------|--------------|
| Phase 3BM | `reload_portfolio_data` | Re-calls `portfolioApi.listPortfolios()` and `listPositions()` |
| Future | `refetch_quote_later` | Not approved yet; requires KIS live gate |
| Future | `sync_backend_later` | Not approved yet; requires backend cache contract |

**Current recommendation**: Refresh = `reload_portfolio_data` (same as the existing
`loadPortfolioMvp()` function, already wired to `#portfolio-refresh` button).

**UI tooltip**: `현재 포트폴리오 다시 계산`

---

## Field status summary

| Field / Type | Status | Notes |
|---|---|---|
| PortfolioHomeState | PLANNED | Implemented in Phase 3BL |
| PortfolioPageCoarseState | PLANNED | Implemented in Phase 3BM |
| PortfolioRecord.id / name / currency / createdAt / updatedAt | IMPLEMENTED | Live in Supabase |
| PortfolioRecord.orderIndex / holdingCount / canMoveLeft / canMoveRight | PLANNED | Derived client-side in Phase 3BN |
| PortfolioSummary.totalCost / portfolioCount / holdingCount | PLANNED | Can compute from existing data in Phase 3BL |
| PortfolioSummary.totalValue / profitAmount / profitRate | PLACEHOLDER | Requires live KIS — deferred |
| PortfolioSummary.allocationByRegion / allocationByAssetClass | PLANNED | Derivable from existing position data |
| PortfolioSummary.allocationByDividendCycle | FUTURE | Requires dividend metadata not yet stored |
| HoldingSummary.quantity / averagePrice | IMPLEMENTED | From PortfolioPosition.buyPrice / quantity |
| HoldingSummary.currentPrice / evaluatedAmount / profitAmount / profitRate | PLACEHOLDER | Null — KIS not connected |
| HoldingSummary.dividendYield / dividendCycle | FUTURE | Requires new data source |
| BookmarkTab | PLANNED | Implemented in Phase 3BN |
| RefreshIntent.reload_portfolio_data | PLANNED | Implemented in Phase 3BM |
| RefreshIntent.refetch_quote_later / sync_backend_later | FUTURE | Not approved |
