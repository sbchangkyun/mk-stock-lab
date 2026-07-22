# Phase 3BN — Portfolio Bookmark Tabs & Reorder UX: Result Document

**Version:** v0.1
**Branch:** `rebuild/phase-1-ia-shell`
**Committed as:** `feat: add portfolio bookmark tabs`

---

## 1. Title and Metadata

| Field | Value |
|---|---|
| Phase | 3BN |
| Type | Portfolio bookmark tabs and reorder UX |
| Status | Implemented |
| Latest prior commit | `175532a` — refactor: expand portfolio dashboard layout |
| Portfolio page implementation | Updated |
| Home implementation | Unchanged |
| API route changes | None |
| Database schema changes | None |
| Supabase schema/storage changes | None |
| Deployment | Not performed |

---

## 2. Objective

Convert the Portfolio page's horizontal portfolio selector into pinned bookmark-style tabs. Aggregate view is pinned at the far left and is the default active tab. A "+" add tab is pinned at the far right and reveals the existing collapsible manage panel. User-created portfolio tabs appear between the pinned tabs and support one-slot left/right reorder controls that appear on hover or focus. Mobile/touch devices see reorder controls permanently at compact size.

---

## 3. Implementation Summary

### Files changed

| File | Change |
|---|---|
| `src/pages/portfolio.astro` | Selector bar HTML refactored; `renderPortfolios()` rewrites to bookmark tabs; toggle text updated |
| `src/styles/style.css` | Selector bar CSS replaced; bookmark tab, reorder, mobile styles added |
| `scripts/check_portfolio_bookmark_tabs_static_contract.mjs` | Created — 13-group static checker |
| `scripts/check_gnews_news_policy_static_contract.mjs` | Phase 3BN artifact group appended |
| `package.json` | `check:portfolio-bookmark-tabs` script added |
| `docs/planning/phase_3bn_portfolio_bookmark_tabs_reorder_ux_result_v0.1.md` | Created (this file) |
| `docs/planning/planning_changelog.md` | Phase 3BN entry prepended |

### Bookmark tab UI

The `portfolio-selector-bar` div was updated to also carry the `portfolio-bookmark-tabs` class. The inner list element (`id="portfolio-list"`) now has `class="portfolio-tab-list"` and `role="tablist"`. `renderPortfolios()` no longer renders `article.portfolio-item` cards — it renders bookmark-style `<button>` elements wrapped in `<span class="portfolio-tab-item">`.

### Aggregate tab pinned left

An aggregate `<button class="portfolio-bookmark-tab portfolio-bookmark-tab--aggregate">` with `data-action="select"` and `data-id="__all_portfolios__"` is rendered first in `#portfolio-list`. It receives `portfolio-bookmark-tab--active` when `isAggregateSelected()` is true.

### Add tab pinned right

`#portfolio-manage-toggle` now has `class="portfolio-bookmark-tab portfolio-bookmark-tab--add"`. Its text alternates between `+ 추가` (closed) and `닫기` (open). The click handler and `openManagePanel()` were updated to use the shorter labels. The button still has `aria-controls="portfolio-manage-panel"`.

### User tabs in the middle

Each user portfolio tab is a `<span class="portfolio-tab-item">` containing five child elements rendered via `document.createElement` (no innerHTML):
1. `<button class="portfolio-tab-reorder-btn portfolio-tab-reorder-btn--left">‹</button>` (`data-action="move-portfolio-up"`)
2. `<button class="portfolio-bookmark-tab portfolio-bookmark-tab--portfolio">name</button>` (`data-action="select"`)
3. `<button class="portfolio-tab-reorder-btn portfolio-tab-reorder-btn--right">›</button>` (`data-action="move-portfolio-down"`)
4. `<button class="portfolio-tab-inline-action">수정</button>` (`data-action="edit-portfolio"`)
5. `<button class="portfolio-tab-inline-action danger">삭제</button>` (`data-action="delete-portfolio"`)

All event handling uses the existing `#portfolio-list` click delegation via `button[data-action]` — no new event listeners were added.

### Reorder arrows

Reorder arrows use `‹` / `›` characters. They are hidden by default (`opacity: 0`) and revealed on `.portfolio-tab-item:hover` and `.portfolio-tab-item:focus-within`. Disabled arrows (`leftBtn.disabled = isFirst`, `rightBtn.disabled = isLast`) are shown at 30% opacity when the tab item is hovered/focused.

The existing `move-portfolio-up` / `move-portfolio-down` action handler in the `#portfolio-list` click delegation was not changed — it swaps entries in `state.portfolioOrder` one slot at a time.

### Mobile behavior

`@media (hover: none)` makes `.portfolio-tab-reorder-btn` and `.portfolio-tab-inline-action` always visible (`opacity: 1`). The reorder button widens from 22px to 28px for tap target comfort. Disabled arrows appear at 30% opacity. No long-press, no drag-and-drop.

### Checker

`scripts/check_portfolio_bookmark_tabs_static_contract.mjs` — 13 groups, 88 checks, no network calls. Validates tab UI markers, aggregate tab, add tab, user tab rendering, reorder arrow controls, boundary rules, active tab behavior, CSS styles, non-goals, 3BM invariants, boundary isolation, and checker network safety.

### Documentation/changelog

`docs/planning/planning_changelog.md` updated with Phase 3BN entry.

---

## 4. Tab Contract

| Tab type | Position | Label | Moveable | Active state |
|---|---|---|---|---|
| aggregate | Pinned left | 전체 포트폴리오 | No | Default on load |
| portfolio | Middle | Portfolio name | Yes (one-slot) | When selected |
| add | Pinned right | + 추가 / 닫기 | No | N/A (always visible) |

### Default active tab

On initial portfolio load (`loadPortfolios()`), `state.selectedPortfolioId = aggregatePortfolioId` when no portfolio is explicitly selected. The aggregate tab renders with `portfolio-bookmark-tab--active` class and `aria-selected="true"`.

### Active tab after reorder

When a user clicks a reorder arrow, `state.portfolioOrder` is updated but `state.selectedPortfolioId` is not changed. `renderPortfolios()` is called which re-renders all tabs, preserving the active state of whichever tab was selected.

### Boundary rules

| Rule | Implementation |
|---|---|
| First user tab: left arrow disabled | `leftBtn.disabled = isFirst` (index === 0) |
| Last user tab: right arrow disabled | `rightBtn.disabled = isLast` (index === ordered.length - 1) |
| Aggregate cannot move | `isAggregatePortfolioId(id)` guard in click handler |
| Add tab cannot move | Not in `#portfolio-list` — has its own event listener |

---

## 5. Reorder Behavior

- **One-slot movement**: Clicking ‹ decreases index by 1; clicking › increases by 1. Implemented in existing `move-portfolio-up` / `move-portfolio-down` handler via swap: `[ordered[index], ordered[nextIndex]] = [ordered[nextIndex], ordered[index]]`.
- **Left/right controls**: `portfolio-tab-reorder-btn--left` (‹) and `portfolio-tab-reorder-btn--right` (›) — both `<button>` elements with `aria-label`.
- **Disabled boundary behavior**: `leftBtn.disabled = isFirst`, `rightBtn.disabled = isLast`. Disabled reorder buttons are still focusable for accessibility but visually distinct (30% opacity on hover/focus-within).
- **Active tab preserved**: `state.selectedPortfolioId` is not modified during reorder — only `state.portfolioOrder` is updated.
- **Persistence approach**: Client-memory only for Phase 3BN. `state.portfolioOrder` is initialized from portfolio API response order and updated on user reorder actions. No localStorage key is written. No backend orderIndex update call is made.
- **Persistence limitation**: Tab order resets on full page reload. Persistence is deferred to a later phase.

---

## 6. Add Tab Behavior

- The `+ 추가` tab (`id="portfolio-manage-toggle"`) opens the Phase 3BM collapsible manage panel (`id="portfolio-manage-panel"`).
- When the panel is open, the button text changes to `닫기`. When closed, it reads `+ 추가`.
- No new modal, slide-over, or creation overlay was introduced.
- No new database schema or API endpoint was added.
- The existing `portfolio-form` and all form inputs remain in the manage panel, unchanged.

---

## 7. Mobile / Accessibility Behavior

### Mobile/touch handling

`@media (hover: none)` is used to target devices without hover support (primarily touch screens). On such devices:
- All `.portfolio-tab-reorder-btn` elements are rendered visible (`opacity: 1`) at all times.
- Disabled reorder buttons appear at 30% opacity.
- All `.portfolio-tab-inline-action` (edit/delete) buttons are rendered visible.
- The reorder button tap target width is expanded to 28px.

### Keyboard accessibility

- All reorder arrows are `<button>` elements — keyboard-focusable and operable.
- On keyboard focus, `portfolio-tab-item:focus-within` makes all controls visible.
- Individual buttons have `aria-label` attributes for screen readers.
- Aggregate and user tabs have `role="tab"` and `aria-selected` attributes.
- The add button has `aria-expanded` (reflecting manage panel state) and `aria-controls`.

### Focus-visible styles

- `.portfolio-bookmark-tab:focus-visible`: 2px outline, negative offset, rounded top corners.
- `.portfolio-tab-reorder-btn:focus-visible`: 2px outline, 1px offset — also makes the button `opacity: 1`.
- `.portfolio-tab-inline-action:focus-visible`: 2px outline, 1px offset.

### Disabled control behavior

- Disabled reorder arrows are rendered at `opacity: 0` when the tab item is not hovered/focused, and at `opacity: 0.3` when hovered/focused.
- On mobile (hover: none), disabled arrows are always at `opacity: 0.3`.
- `cursor: not-allowed` is applied to disabled reorder buttons.

---

## 8. Non-Goals

| Feature | Status |
|---|---|
| Drag-and-drop | Not implemented |
| Portfolio creation modal | Not implemented — existing manage panel unchanged |
| Slide-over creation UI | Not implemented |
| DB schema changes | Not performed |
| Supabase schema/storage changes | Not performed |
| Tab order persistence (localStorage / backend) | Deferred — client memory only |
| KIS live quote refresh | Not performed |
| GNews changes | Not performed |
| /news page | Not created |

---

## 9. Safety Boundaries

All safety constraints met:
- No live GNews call made or wired
- No live KIS call made or wired
- No external HTTP request added
- No GNews env var reads added
- No KIS secret reads added
- No Supabase schema/storage changes
- No DB/migration files created
- No deployment performed
- Home page (`index.astro`) not modified
- `HomePortfolioPanel.astro` not modified
- `HomeMarketNews.astro` not modified
- `/news` page not created
- No drag-and-drop library imported
- No new localStorage key written
- No `status-pill` / `portfolio-status-bar` classes restored
- No real-time KIS quote copy added

---

## 10. Validation Results

| Command | Result |
|---|---|
| `npm run check:portfolio-bookmark-tabs` | 88/88 PASS |
| `npm run check:portfolio-layout` | 73/73 PASS |
| `npm run check:home-portfolio-panel` | 61/61 PASS |
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
| `git diff --check` | No whitespace errors |
| `git status --short` | Clean (only expected new/modified files) |
| `npm run build` | PASS |

---

## 11. Remaining Limitations

- Portfolio tab order resets on full page reload (client memory only, not persisted).
- Portfolio creation UX remains the collapsible manage panel — no modal or slide-over.
- Live KIS valuation not enabled — current/market value and return rate are placeholder only.
- Live GNews provider compatibility still unresolved.
- `/news` paginated list page deferred.
- Tab order persistence deferred (no localStorage key, no backend orderIndex update).
- The "‹ OO계좌 ›" pattern arrows appear only on hover/focus on desktop; always visible on touch devices.

---

## 12. Recommended Next Phases

| Phase | Description |
|---|---|
| **3BO** | Portfolio Owner Browser Review — validate tab UI, reorder UX, dashboard behavior, responsiveness |
| **3BN-R1** | Portfolio Bookmark Tab Fixes (if owner review reveals issues) |
| **3BP** | Tab order persistence — evaluate safe localStorage or backend orderIndex approach |
| **3BI** | Optional `/news` paginated list page (deferred) |
| **Future** | Portfolio creation modal/slide-over, if approved |
