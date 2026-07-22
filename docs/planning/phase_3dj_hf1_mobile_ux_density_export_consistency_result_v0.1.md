# Phase 3DJ-HF1 — Mobile UX Density + Export Consistency
## Result v0.1 — 2026-06-27

### Metadata

| Field | Value |
|---|---|
| Phase | 3DJ-HF1 |
| Type | Mobile UX Density Hotfix + Export Consistency |
| Status | Implemented, awaiting owner review |
| Prior deployed commit | 1a8ef79 fix: narrow lab matrix image export capture to matrix card |
| Canonical production URL | `https://mkstocklab.vercel.app` |
| Runtime UI changes | style.css, portfolio.astro, index.astro, LabReturnMatrix.astro, lab pages, MarketShell.astro, exportCardImage.ts |
| API route changes | None |
| DB / Supabase schema changes | None |
| Live KIS calls | None |
| Live GNews calls | None |
| AI provider calls | None |
| External data fetch by Claude Code | None |
| Vercel production deployment | NOT performed — owner must review first |

---

## Goal

Address owner review failure from Phase 3DJ. The site felt like "a desktop web page squeezed into a narrow viewport." This hotfix delivers actual mobile-native UX density improvements and makes image export viewport-independent.

---

## Changes Made

### A. `src/lib/exportCardImage.ts` — Viewport-independent export

**Problem:** `getBoundingClientRect()` gave mobile-sized dimensions on narrow viewports, producing small PNGs from export buttons.

**Fix:** `exportCardAsPng` now:
1. Computes `naturalWidth = Math.max(card.scrollWidth, getBoundingClientRect().width)` as the stable content width
2. Accepts optional `requestedExportWidth` (e.g., 800, 1200) from `data-export-width` on buttons
3. Adds `.is-exporting-image` class to card before capture
4. Forces `width`, `minWidth`, `maxWidth: none`, `overflow: visible` as inline styles
5. Waits one `requestAnimationFrame` for layout to settle
6. Captures `card.scrollHeight` post-expand as the true height
7. Restores all inline styles in a `finally` block (always runs, even on error)

`setupCardImageExport` now reads `button.dataset.exportWidth` and passes it as `parseInt(value, 10)` to `exportCardAsPng`.

### B. `src/styles/style.css` — Phase 3DJ-HF1 CSS block

Added at end of file:

| Rule | Effect |
|---|---|
| `.is-exporting-image { overflow: visible !important }` | Export mode: prevents clipping |
| `.is-exporting-image .lab-matrix-scroll { overflow: visible }` | Export mode: matrix shows all columns |
| `@media ≤720px: .header-actions { gap: 6px }` | Header actions compact on mobile |
| `@media ≤720px: .header-button { padding, font-size, min-height }` | Auth buttons smaller on mobile |
| `@media ≤860px: .home-feature-grid { display: none }` | Feature cards hidden on mobile (duplicate nav) |
| `@media ≤720px: .hero-copy .lead` | Hero lead text clamped to 3 lines |
| `@media ≤720px: .news-card-summary { display: none }` | News summary hidden on mobile |
| `@media ≤720px: .news-card-title { -webkit-line-clamp: 2 }` | News title compact |
| `@media ≤720px: .index-card { padding: 10px 12px }` | Market snapshot card padding reduced |
| `@media ≤720px: .chart-ai-shell { gap: 12px }` | Chart AI less spacing |
| `@media ≤720px: .page-header .lead { -webkit-line-clamp: 2 }` | Page lead text clamped |
| `@media ≤720px: .market-chart-panel { overflow-x: auto }` | Market charts scroll if wide |
| `.portfolio-list-controls-bar { display: flex; justify-content: space-between }` | 카테고리 + $ ₩ fixed row above scroll |
| `.positions-category-cell--group { flex-direction: column }` | Grouped header cells stack vertically |
| `.position-metric--group { flex-direction: column }` | Grouped data cells stack vertically |
| `.col-group-top / .col-group-bottom` | Group label typography |
| `@media ≤720px: .lab-matrix-interaction-hint { font-size: 11px }` | Hint text compact on mobile |

**Existing portfolio rules updated:**
- `.positions-category-grid`: `grid-template-columns` → 9 columns (was 13), `min-width: 740px` (was 960px), `align-items: start`
- `.position-card`: same 9-column template, `min-width: 740px`
- `.positions-list`: `min-width: 740px`
- `.position-identity strong`: added `-webkit-line-clamp: 2` for max 2-line security names

### C. `src/pages/index.astro`

Added `home-feature-grid` class to the `<section class="grid-4">` element so it can be targeted by the mobile hide rule without affecting other `.grid-4` instances.

### D. `src/pages/portfolio.astro` — HTML restructuring + JS updates

**HTML changes:**
- Removed `<p class="eyebrow">보유 종목</p>` from `portfolio-panel-header`
- Moved `segmented-control` (currency toggle) out of `portfolio-panel-header.portfolio-panel-actions`
- Added new `<div class="portfolio-list-controls-bar">` between `portfolio-panel-header` and `positions-list-wrap`, containing: `<p class="eyebrow">카테고리</p>` (left) + `segmented-control` (right)
- Currency buttons: `달러 기준` → `$` with `aria-label="달러 기준" title="달러 기준"`, `원화 기준` → `₩` with `aria-label="원화 기준" title="원화 기준"`
- Removed `<p class="eyebrow">카테고리</p>` from inside `positions-category-header` (now in control bar above scroll)
- Restructured `positions-category-grid` from 13-column (12 separate metric columns) to 9-column grouped structure:
  - Col 1: avatar, Col 2: 종목, Col 3: 비중 (sortable), Col 4: 수량
  - Col 5: 가격 group (평단가 top / 현재가 bottom)
  - Col 6: 금액 group (평가금 top+sortable / 원금 bottom)
  - Col 7: 수익 group (수익률 top+sortable / 수익금 bottom+sortable)
  - Col 8: 배당 group (배당률 top+sortable / 배당주기 bottom)
  - Col 9: actions

**JS changes in `renderPositions()`:**
- Aggregate view: `title.textContent = ''` (was "전체 포트폴리오"), `meta.textContent = ''` (was "4개 포트폴리오의 ...")
- Individual portfolio: `title.textContent = portfolio.name`, `meta.textContent = ''` (removed "기준 통화: ...")
- `state.valuationMessage = null` instead of "Fixture 기준 평가값입니다. 실시간 시세가 아닙니다."
- `item.innerHTML` restructured from 12 separate `position-metric` divs to 4 grouped `position-metric--group` divs, with `<strong>` (top) and `<small>` (bottom) in each

### E. `src/components/LabReturnMatrix.astro`

Removed the `<header class="lab-section-header">` block (contained h2 title, description, and badge "예시 데이터 · 연동 전") — these are duplicates of what the lab detail pages already render.

Changed `<section aria-labelledby={sectionId}>` to `<section aria-label={data.title}>` since the h2 reference was removed. The unused `sectionId` prop is retained for backward compatibility.

### F. `src/pages/lab/asset-class-returns.astro` + `src/pages/lab/sp500-sectors.astro`

Removed `<span class="lab-matrix-export-label">...</span>` from each export header.

Added `data-export-width="800"` to each camera export button so export produces 800px-wide PNG regardless of viewport.

### G. `src/components/MarketShell.astro`

Added `data-export-width="1200"` to all treemap export buttons (wide chart needs more width).

Added `data-export-width="800"` to all scatter export buttons.

### H. `scripts/check_mobile_ux_density_export_consistency_static_contract.mjs`

New static checker — 68 checks across 12 groups:
- Group 1: File existence (8 checks)
- Group 2: Export library — viewport-independent capture (11 checks)
- Group 3: Portfolio — grouped column structure (8 checks)
- Group 4: Portfolio — redundant copy removed (5 checks)
- Group 5: Portfolio — currency toggle compacted to symbols (7 checks)
- Group 6: Lab — redundant inner header removed (6 checks)
- Group 7: Lab pages — export label removed + data-export-width added (4 checks)
- Group 8: MarketShell — data-export-width on buttons (2 checks)
- Group 9: Home — feature grid hidden on mobile (2 checks)
- Group 10: CSS — Phase 3DJ-HF1 additions (10 checks)
- Group 11: Package script (1 check)
- Group 12: Security boundaries (4 checks)

### I. `package.json`

Added `"check:mobile-ux-density-export"` script.

---

## Validation Results

| Check | Result |
|---|---|
| `npm run check:mobile-ux-density-export` | PASS (68/68) |
| `npm run check:mobile-baseline` | PASS |
| `npm run check:lab-matrix-image-export` | PASS |
| `npm run check:lab-matrix-hover` | PASS |
| `npm run check:home-index-sparkline` | PASS |
| `npm run check:home-index-cards` | PASS |
| `npm run check:market-fixture-chart` | PASS |
| `npm run build` | PASS |
| `git diff --check` | PASS |

---

## Owner Review Checklist

**Mobile (Chrome DevTools 390px iPhone viewport or real device):**

1. Open site — confirm header fits on one line. Auth buttons are small but legible.
2. Home page: feature cards (Chart AI / 시장 / Lab / 포트폴리오 nav cards) are HIDDEN. Nav at top provides equivalent navigation.
3. Home page: hero text shows ≤3 lines lead copy. Market Snapshot stays 2-column.
4. Home news cards: no summary text shown. Title is max 2 lines.
5. Chart AI: page opens with compact spacing. Lead text clamped.
6. Market: charts don't overflow page width on mobile (scroll if needed).
7. Portfolio: currency toggle shows `$` / `₩` buttons (small, accessible). Tap to switch.
8. Portfolio: `카테고리` label is on same row as `$` / `₩` toggle, fixed above the scrolling table.
9. Portfolio: table has 9 grouped columns instead of 13. Each group cell shows two related values.
10. Portfolio: security names clamp at 2 lines.
11. Lab: `/lab/asset-class-returns` — the matrix does NOT show a second title/description above the legend (inner header removed).
12. Lab: camera export → produces desktop-size PNG (800px wide) even on mobile viewport.
13. Market: camera export buttons → treemap produces 1200px PNG, scatter produces 800px PNG.

**Desktop regression check:**
14. All desktop layouts unchanged. No extra whitespace or layout shifts.
15. Portfolio table: 9 grouped columns are readable on desktop. Sort arrows still work.
16. `$` / `₩` toggle still switches currency display mode correctly.
17. Lab matrix highlight interaction unchanged on desktop hover.
