# Phase 3BR — Portfolio Holdings Category Header & Sort UX Result v0.1

## 1. Title and Metadata

- **Phase**: 3BR
- **Type**: Portfolio Holdings Category Header & Sort UX
- **Status**: Implemented
- **Latest prior commit**: 91eaffd fix: polish portfolio bookmark tabs
- **Portfolio page implementation**: updated
- **Home implementation**: unchanged
- **API route changes**: none
- **Database schema changes**: none
- **Supabase schema/storage changes**: none
- **Deployment**: not performed

---

## 2. Objective

Replace the existing holdings "정렬" sort toolbar with a category-style column header that shows all investment categories inline with vertical ▲▼ sort controls for sortable columns. This gives the holdings list a table-like header, aligns the UX with a portfolio management table pattern, and removes the visually disconnected sort toolbar.

---

## 3. Owner Requirement Addressed

### Required columns (in order)

1. 종목
2. 비중
3. 수량
4. 평단가
5. 현재가
6. 평가금
7. 수익률
8. 수익금
9. 배당률
10. 예상 연배당금
11. 배당주기

### Sortable columns (have ▲▼ controls)

- 비중
- 평가금
- 수익률
- 수익금
- 배당률
- 예상 연배당금

### Non-sortable columns

- 종목
- 수량
- 평단가
- 현재가
- 배당주기

---

## 4. Implementation Summary

### Files changed

- `src/pages/portfolio.astro` — HTML, TypeScript
- `src/styles/style.css` — CSS
- `scripts/check_portfolio_holdings_category_header_static_contract.mjs` — new checker
- `scripts/check_portfolio_bookmark_tabs_static_contract.mjs` — minor fix (drag-drop check tightened)
- `scripts/check_gnews_news_policy_static_contract.mjs` — Phase 3BR artifact group added
- `docs/planning/phase_3br_portfolio_holdings_category_header_sort_ux_result_v0.1.md` — this doc
- `docs/planning/planning_changelog.md` — Phase 3BR entry prepended
- `package.json` — `check:portfolio-holdings-header` script added

### Portfolio markup changes

- Replaced `.positions-toolbar` HTML block (eyebrow "정렬", explanatory text, 4-button `.sort-controls` div) with:
  - `.positions-category-header` wrapper with eyebrow "카테고리"
  - `.positions-category-grid` grid row: 13 cells (avatar spacer + 종목 + 10 metric headers + actions spacer)
  - Each sortable cell contains label `<span>` + `.sort-arrow-stack` with two `.sort-arrow-button` elements (`▲` desc, `▼` asc), each with `aria-label`
  - Non-sortable cells contain label text only
- `renderPositions()` updated:
  - Computes `totalCostBasis` from all positions before rendering loop
  - Per-position `weightPct` = `(costBasis / totalCostBasis * 100).toFixed(1) + '%'` — or `'데이터 대기'` if not computable
  - Position card now has 10 `.position-metric` cells matching the category header: 비중, 수량, 평단가, 현재가, 평가금, 수익률, 수익금, 배당률, 예상 연배당금, 배당주기
  - Card metric cells for unavailable data use `metric-placeholder` class and `'연동 예정'` or `'데이터 대기'`
  - Label text removed from metric cells (label is now in the header row)

### TypeScript changes

- `positionSort` union type expanded from 5 values to 13:
  - Added: `'weight-asc'`, `'weight-desc'`, `'profit-asc'`, `'profit-desc'`, `'dividend-yield-asc'`, `'dividend-yield-desc'`, `'annual-dividend-asc'`, `'annual-dividend-desc'`
- Added `PositionSortKind` type alias
- `getPositionSortValue` updated: `weight` kind returns `buyPrice * quantity` (cost basis as sort proxy); all other new kinds return `null` (data not yet available)
- `getSortedPositions` updated: uses `lastIndexOf('-')` to split compound sort keys like `dividend-yield-desc` correctly (previously used `split('-')[0]` which broke on hyphenated kind names)

### CSS changes

- Removed: `.positions-toolbar`, `.sort-controls`, `.sort-controls button`, `.sort-controls button.active` (dead code)
- Simplified: `.segmented-control button` and `.segmented-control button.active` now standalone (no longer merged with `.sort-controls`)
- Added: `.positions-category-header`, `.positions-category-grid`, `.positions-category-cell`, `.positions-category-cell--sortable`, `.sort-arrow-stack`, `.sort-arrow-button`, `.sort-arrow-button:hover`, `.sort-arrow-button:focus-visible`, `.sort-arrow-button.active`
- Updated: `.positions-list-wrap { overflow-x: auto }` — enables horizontal scroll for category header + cards
- Updated: `.positions-list { min-width: 960px }` — ensures consistent scroll width
- Updated: `.position-card` grid from 8 columns (`avatar + identity + 5 metrics + actions`) to 13 columns (`avatar + identity + 10 metrics + actions`), `min-width: 960px`
- `.positions-category-grid` uses matching `grid-template-columns` and `min-width: 960px`
- Mobile breakpoint (`@media (max-width: 900px)`): removed `.positions-toolbar` column-flex override and `.position-card` 4-column grid override; horizontal scroll on `.positions-list-wrap` replaces mobile column collapse

### Checker updates

- New: `scripts/check_portfolio_holdings_category_header_static_contract.mjs` — 90 checks across 12 groups
- `check_portfolio_bookmark_tabs_static_contract.mjs` Group 10: "No drag-and-drop library import" check tightened from `includes('sortable')` to specific library names/imports (to avoid false failure from `positions-category-cell--sortable`)
- `check_gnews_news_policy_static_contract.mjs`: Phase 3BR artifact group appended

---

## 5. Sort UX Contract

### Arrow placement
- ▲ (desc) on top, ▼ (asc) below, vertically stacked in `.sort-arrow-stack`
- Stack appears immediately to the right of the column label within `.positions-category-cell--sortable`

### Asc/desc behavior
- Clicking ▲: `data-sort="<kind>-desc"` → sorted highest-first
- Clicking ▼: `data-sort="<kind>-asc"` → sorted lowest-first
- Clicking the same active arrow again → back to `'none'` (no sort)

### Active sort indicator
- The active arrow button receives `.active` class
- CSS `.sort-arrow-button.active`: `opacity: 1; color: var(--primary)`

### Missing value handling
- `getPositionSortValue` returns `null` for unavailable columns
- Null values always sort to the bottom regardless of direction (ascending or descending)
- Stable secondary sort by original index preserves relative order within nulls

### Fully unavailable column behavior
- `profit`, `dividend-yield`, `annual-dividend`, `valuation`, `return`: all return `null` from `getPositionSortValue`
- Clicking their sort arrows is structurally wired (no error), but sort order remains unchanged (all null → stable index order)
- Row cells for these columns show `'연동 예정'` or `'데이터 대기'`
- No live data implied

### No live valuation claims
- `weight` sort uses `buyPrice × quantity` (registered purchase cost basis), not live market valuation
- Label is "비중" — interpreted as cost-basis weight until live KIS integration is added

---

## 6. Data Availability Policy

| Column | Data basis | Status |
|---|---|---|
| 종목 | stored name/symbol | available |
| 비중 | `buyPrice × quantity / total` (cost basis weight) | computed from stored data |
| 수량 | stored quantity | available |
| 평단가 | stored buyPrice | available |
| 현재가 | not stored | "연동 예정" |
| 평가금 | not stored (no current price) | "연동 예정" / "데이터 대기" |
| 수익률 | not stored | "연동 예정" |
| 수익금 | not stored | "연동 예정" |
| 배당률 | not stored | "데이터 대기" |
| 예상 연배당금 | not stored | "데이터 대기" |
| 배당주기 | not stored | "데이터 대기" |

**비중 basis**: Cost basis weight (`buyPrice × quantity`) from stored purchase data. This is registered purchase amount, not live market valuation. Label "비중" accurately reflects relative cost allocation, not live portfolio weight.

**No fabricated values**: Zero values are not shown for unknown fields. Only `'연동 예정'` or `'데이터 대기'` are used.

---

## 7. Layout and Responsiveness

### Header layout
- `.positions-category-grid`: CSS grid with 13 columns matching `.position-card`
- Both share `grid-template-columns: 58px minmax(0, 1.35fr) repeat(10, minmax(52px, 0.75fr)) minmax(74px, auto)`
- `min-width: 960px` on both ensures columns are always visible

### Row alignment
- `.position-card` now uses 13-column grid matching the category header column widths exactly
- Metric cells in card rows are unlabeled (labels are in the header)

### Horizontal scroll
- `.positions-list-wrap { overflow-x: auto }` is the scroll container
- Both the category header and the card rows scroll together as a unit
- Page-level horizontal overflow is not introduced; scroll is section-scoped

### Mobile behavior
- Viewport narrower than 960px: horizontal scroll within `.positions-list-wrap`
- Old 4-column mobile collapse removed; table is always 13 columns wide and scrollable
- `overflow-x: auto` on `.positions-list-wrap` handles all viewport widths

### Accessibility / focus
- Sort arrow buttons have `aria-label` for screen reader context
- `.sort-arrow-button:focus-visible` has `outline: 2px solid var(--primary)` with `border-radius: 2px`
- Category cells use `role="columnheader"` and the grid row uses `role="row"`

---

## 8. Preserved Boundaries

- **Bookmark tabs unchanged**: `portfolio-bookmark-tabs`, `portfolio-h1-row`, inline add tab, floating edit/delete actions all preserved (3BQ contract intact)
- **Refresh button unchanged**: still inline with h1 in `portfolio-h1-row`
- **Manage panel unchanged**: `portfolio-manage-panel` toggle behavior intact
- **Position sheet unchanged**: add/edit/delete position form behavior intact
- **Home unchanged**: `HomePortfolioPanel.astro` and `HomeMarketNews.astro` not modified
- **No /news page created**

---

## 9. Safety Boundaries

- No live GNews call
- No live KIS call
- No external HTTP request
- No GNews env reads
- No KIS secret reads
- No Supabase schema/storage changes
- No DB/migration files added
- No deployment

---

## 10. Validation Results

All commands run prior to commit:

| Checker | Result |
|---|---|
| `check:portfolio-holdings-header` | 90/90 PASS |
| `check:portfolio-bookmark-tabs` | 105/105 PASS |
| `check:portfolio-layout` | 73/73 PASS |
| `check:home-portfolio-panel` | 84/84 PASS |
| `check:home-market-news` | PASS |
| `check:gnews-news-policy` | PASS |
| `check:gnews-news-engine` | PASS |
| `check:gnews-news-api-route` | PASS |
| `check:gnews-news-api-response` | PASS |
| `check:gnews-news-route-source-selector` | PASS |
| `check:gnews-live-adapter-design` | PASS |
| `check:gnews-live-adapter-static` | PASS |
| `check:gnews-live-adapter-mocked` | PASS |
| `smoke:gnews-live:dry` | PASS |
| `git diff --check` | clean |
| `git status --short` | only `.vscode/settings.json` untracked (pre-existing) |
| `npm run build` | PASS |

---

## 11. Remaining Limitations

- Live KIS valuation not enabled — current price, true valuation, return rate, and profit remain deferred
- "비중" is cost-basis weight (registered purchase amount), not live market portfolio weight
- Dividend data (배당률, 예상 연배당금, 배당주기) integration not started
- Tab order persistence remains client-memory only (localStorage deferred)
- Live GNews provider compatibility unresolved
- /news page deferred
- Full table alignment across all viewport widths: at very wide viewports (>1400px), fractional column widths may produce minor spacing differences between header and cards — this is a cosmetic refinement deferred to Phase 3BR-R1 if needed

---

## 12. Recommended Next Phases

- **Phase 3BS**: Portfolio Owner Browser Review Round 2 — validate category header layout, sort UX, horizontal scroll behavior, mobile behavior, and overall holdings presentation
- **Phase 3BR-R1** (if needed): Holdings Header Fixes based on owner review findings
- **Later**: KIS valuation integration (current price → true 평가금, 수익률, 수익금), dividend data model, tab order persistence, optional /news page
