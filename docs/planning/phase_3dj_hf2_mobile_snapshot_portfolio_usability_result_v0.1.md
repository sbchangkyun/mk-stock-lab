# Phase 3DJ-HF2 — Mobile Snapshot and Portfolio Usability: Result

**Status:** COMPLETE  
**Branch:** `rebuild/phase-1-ia-shell`  
**Date:** 2026-06-27  
**Static checker:** `npm run check:mobile-snapshot-portfolio`

---

## Background

Phase 3DJ-HF1 passed technical validation but failed owner review on two areas:

1. Home MARKET SNAPSHOT still rendered as a single column at 390px viewport width.
2. Portfolio box had usability issues: visible 카테고리 label, poor column alignment, small sort tap targets, no KPI summary, 종목 추가 button buried inside scroll area.

This hotfix (HF2) addresses all identified issues.

---

## Changes Made

### 1. Home MARKET SNAPSHOT Two-Column Fix

**Root cause:** `@media (max-width: 400px)` in Phase 3DJ triggered at 390px mobile viewport, forcing the grid to a single column.

**Fix:**
- Changed 1-column fallback breakpoint from `max-width: 400px` → `max-width: 340px`.
- Changed `repeat(2, 1fr)` → `repeat(2, minmax(0, 1fr))` to allow cells to compress when sparkline SVG is fixed-width.
- Added `gap: 6px` for tighter mobile layout.
- Added CSS override: `.index-card-sparkline-svg` shrinks to `64×22px` at ≤720px.
- Added CSS override: `.index-card-value` font-size `14px` at ≤720px.

**Result:** At 390px the grid shows two columns; 1-column fallback only activates at ≤340px.

### 2. Portfolio Control Label Cleanup

- Removed `<p class="eyebrow">카테고리</p>` from `.portfolio-list-controls-bar`.
- Currency toggle (`$` / `₩`) remains right-aligned outside the horizontal scroll container.
- Added `justify-content: flex-end` CSS to `.portfolio-list-controls-bar` to cleanly right-align the remaining control.

### 3. Portfolio Header/Body Column Alignment

- Added `padding: 0 14px 2px` to `.positions-category-header` to match the `padding: 14px` of position cards (border-box model: 712px grid + 28px padding = 740px total).
- Reduced `.positions-category-grid` `min-width` from `740px` → `712px` to maintain grid width parity after padding is applied.

### 4. Full Sortable Label Clickability

- Added `data-sort-column` attribute to all four sortable category header cells:
  - `data-sort-column="weight"` on the 비중 cell
  - `data-sort-column="valuation"` on the 금액 group cell
  - `data-sort-column="return"` on the 수익 group cell
  - `data-sort-column="dividend-yield"` on the 배당 group cell
- Added CSS: `[data-sort-column] { cursor: pointer; user-select: none; }` and hover highlight.
- Extended click handler: clicking a `[data-sort-column]` cell toggles `{col}-desc` on first click, `{col}-asc` on second, then back to `{col}-desc`.
- Existing `▲▼` arrow buttons preserve precise directional control.

### 5. Portfolio KPI Summary Block

- Added `<div class="portfolio-kpi-summary hidden" id="portfolio-kpi-summary">` inside `.portfolio-panel-header` / `.portfolio-panel-info`.
- Contains: `kpi-label` (총 자산), `kpi-value` (computed total market value), `kpi-profit` (total P&L with %).
- Computed from existing `getPositionValuation()` and position data — no new API routes or network calls.
- Falls back to `buyPrice × quantity` when live valuation is unavailable.
- Hidden when no portfolio is selected or when the position list is empty.

### 6. 종목 추가 Button Placement

The button remains in `.portfolio-panel-header` / `.portfolio-panel-actions` (upper-right), outside the horizontal scroll container — no position change was needed; it was already correct.

---

## Static Checker Results

```
check:mobile-snapshot-portfolio — 49 checks, 49 passed, 0 failed
```

---

## Files Modified

| File | Change |
|------|--------|
| `src/styles/style.css` | 2-col breakpoint fix, sparkline size, KPI styles, sort cursor, control bar alignment |
| `src/pages/portfolio.astro` | Remove 카테고리 label, add KPI block HTML + JS, add data-sort-column, extend sort handler |
| `scripts/check_mobile_snapshot_portfolio_usability_static_contract.mjs` | New static checker (49 checks) |
| `package.json` | Added `check:mobile-snapshot-portfolio` script |
| `docs/planning/planning_changelog.md` | Phase 3DJ-HF2 entry prepended |

---

## Security Notes

- No new API routes created.
- No database queries added.
- No external HTTP calls.
- No `setInterval` / `setTimeout` added.
- No environment variables read.
- KPI values computed entirely from in-memory state (`state.positionValuations`, `state.positions`).
