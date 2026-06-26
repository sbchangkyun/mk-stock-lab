# Phase 3DJ — Mobile Baseline Usability Pass
## Result v0.1 — 2026-06-27

### Metadata

| Field | Value |
|---|---|
| Phase | 3DJ |
| Type | Responsive UX — Mobile Baseline |
| Status | Implemented, awaiting owner review |
| Prior deployed commit | 1a8ef79 fix: narrow lab matrix image export capture to matrix card |
| Canonical production URL | `https://mkstocklab.vercel.app` |
| Runtime UI changes | style.css (mobile CSS) + LabReturnMatrix.astro (tap fix) |
| API route changes | None |
| DB / Supabase schema changes | None |
| Live KIS calls | None |
| Live GNews calls | None |
| AI provider calls | None |
| External data fetch by Claude Code | None |
| Vercel production deployment | NOT performed — owner must review first |

---

## Goal

Make the main product routes usable on mobile without breaking the accepted desktop UI.
No new dependencies, no live data, no API/DB/provider work.

---

## Changes Made

### 1. `src/styles/style.css`

**Removed:**
- `min-width: 1080px` from the `body` rule (was the primary blocker for all mobile layouts)

**Added — Phase 3DJ mobile CSS block at end of file:**

| Rule | Breakpoint | Effect |
|---|---|---|
| `:root { --page-gutter-x: clamp(14px, 4vw, 24px) }` | ≤720px | Reduces page gutter from 32px to ~14px on 390px mobile |
| `.ticker-belt { overflow-x: auto }` | ≤900px | Allows ticker content to scroll instead of clipping |
| `.site-header { flex-wrap: wrap; min-height: 56px }` | ≤720px | Header compacts to 2 rows on narrow screens |
| `.brand-text small { display: none }` | ≤720px | Hides Korean subtitle ("투자 데이터 플랫폼") on mobile |
| `.primary-nav { overflow-x: auto }` + `.nav-inner { min-width: max-content; flex-wrap: nowrap }` | ≤720px | Nav scrolls horizontally — all 5 links stay in single row |
| `.hero-section { grid-template-columns: 1fr }` | ≤860px | Hero section stacks to single column |
| `h1 { font-size: clamp(26px, 7vw, 44px) }` | ≤720px | H1 scales down for mobile viewports |
| `.grid-3 → repeat(2, ...)` | ≤860px | 3-col utility grid → 2-col |
| `.grid-3 → 1fr` | ≤560px | 2-col → 1-col |
| `.grid-4 → repeat(2, ...)` | ≤560px | 4-col → 2-col |
| `.index-card-grid → repeat(2, 1fr)` | ≤720px | Market snapshot grid → 2-col |
| `.index-card-grid → 1fr` | ≤400px | → 1-col on very narrow |
| `.page-header { flex-direction: column }` | ≤640px | Stacks page title + actions vertically |
| `.lab-module-grid, .lab-preview-grid → 1fr` | ≤640px | Lab module grids stack |
| `.lab-matrix-summary-block .lab-matrix-scroll { overflow-x: auto }` | ≤720px | Summary table scrolls |
| `.mp-sections { max-width: 100% }` | ≤720px | MyPage sections fill screen width |
| `.market-chart-svg { max-width: 100% }` | ≤640px | SVG chart constrained |
| `.lab-matrix-export-header { flex-wrap: wrap }` | ≤560px | Export header wraps on very narrow |

**Preserved:**
- All desktop breakpoints and layouts unchanged
- Existing 980px breakpoint (workspace, market, portfolio) unchanged
- Existing 640px breakpoint (many components) unchanged
- Existing 1299px MyPage admin rail collapse unchanged
- Existing `.lab-matrix-scroll { overflow-x: auto }` for data table scroll unchanged
- All data-heavy horizontal scroll containers unchanged

### 2. `src/components/LabReturnMatrix.astro`

**Problem:** On mobile (touch), `click` fires AFTER `pointerleave`. Since `pointerleave` checks `pinned === null` first, it cleared the highlight before `click` could pin it. Additionally, scroll gestures on the overflow-x container trigger `pointercancel`, preventing `click` from firing at all.

**Fix:** Replaced `click` handler with `pointerdown` (record touch start X/Y) + `pointerup` (check movement threshold < 10px, set pin).

**Why this works:** On touch, event order is: `pointerdown` → `pointerup` → `pointerleave` → `click`. Since `pointerup` fires BEFORE `pointerleave`, the pin is set before `pointerleave` checks it. When `pointerleave` fires with `pinned !== null`, it calls `applyHighlight(root, pinned)` — maintaining the highlight.

**For scroll gestures:** `pointercancel` fires before `pointerup` (which is skipped). The movement threshold check prevents `pointerup` from pinning when the user is scrolling the matrix table.

### 3. `scripts/check_mobile_baseline_usability_static_contract.mjs`

New static checker — 74 checks across 13 groups:
- Group 1: File existence (5 checks)
- Group 2: Global desktop min-width removed (8 checks)
- Group 3: Header and nav mobile safety (5 checks)
- Group 4: Viewport and site-main safety (6 checks)
- Group 5: Major desktop grids — mobile stacking (6 checks)
- Group 6: Data table and matrix scroll containers preserved (5 checks)
- Group 7: Lab matrix export capture scope unchanged (5 checks)
- Group 8: Lab matrix interaction — desktop hover + mobile tap (10 checks)
- Group 9: Portfolio mobile safety (5 checks)
- Group 10: Chart AI mobile safety (2 checks)
- Group 11: MyPage and reset-password mobile safety (4 checks)
- Group 12: Safety boundaries (12 checks)
- Group 13: Checker self-check (1 check)

### 4. `package.json`

Added `"check:mobile-baseline"` script.

---

## Validation Results

| Check | Result |
|---|---|
| `npm run check:mobile-baseline` | PASS (74/74) |
| `npm run check:lab-matrix-image-export` | PASS (80/80) |
| `npm run build` | PASS |
| `git diff --check` | PASS |

---

## Routes Affected

| Route | Mobile improvement |
|---|---|
| `/` (Home) | Body min-width removed; hero stacks; index-card-grid 2-col; nav scrolls |
| `/market` | Nav scrolls; workspace-grid already had 980px breakpoint |
| `/chart` | Nav scrolls; chart AI symbol row already had 640px breakpoint |
| `/lab` | Nav scrolls; lab module grid stacks at 640px |
| `/lab/asset-class-returns` | Matrix table scrolls horizontally; export header wraps |
| `/lab/sp500-sectors` | Matrix table scrolls horizontally; export header wraps |
| `/portfolio` | Nav scrolls; existing 980px/640px breakpoints intact |
| `/mypage` | Nav scrolls; mp-sections full width on mobile |
| `/reset-password` | Nav scrolls; modal/panel already constrained |

---

## Owner Review Checklist

**Before deploying, test on a real mobile device (or Chrome DevTools 390px iPhone viewport):**

1. Open `https://mkstocklab.vercel.app` on mobile.
2. Confirm site header fits without horizontal overflow — brand name visible, no scrollbar.
3. Confirm nav bar has exactly 5 tabs; can scroll nav left/right to reach all tabs.
4. Confirm Home hero section shows single-column layout (market summary on top, chart below).
5. Confirm Market Snapshot cards show 2-column grid.
6. Confirm Lab page module cards stack vertically.
7. Open `/lab/asset-class-returns` — confirm matrix table is horizontally scrollable.
8. Tap a colored cell in the matrix — confirm row/column highlight persists (tap pin fix).
9. Tap a different cell — highlight moves. Tap same cell again — highlight clears.
10. Swipe the matrix table horizontally — confirm no accidental cell pin during scroll.
11. Confirm camera export button still works on mobile (downloads PNG).
12. Open `/portfolio` — confirm layout renders without overflow.
13. Open `/mypage` — confirm sections fill the screen width.
14. Rotate to landscape on mobile — confirm desktop proportions return.

**Desktop regression check:**
15. Open on a 1920px desktop — confirm ALL desktop layouts unchanged.
16. Confirm no new horizontal scrollbar on desktop viewport.
17. Confirm hero section has 2 columns on desktop.
