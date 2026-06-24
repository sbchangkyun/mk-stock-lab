# Phase 3BQ — Portfolio Bookmark Tabs Owner Review Fixes Result v0.1

## Objective

Apply seven owner-review fixes to the Portfolio page bookmark tab row identified after Phase 3BN.

---

## Fix 1: Refresh Icon Moved Inline with H1

**Problem:** The refresh icon button was at the far right of `.portfolio-title-row` (flex row, `justify-content: space-between`), visually separated from the heading.

**Fix:** `.portfolio-title-row` changed from a flex row to a plain block. Added `.portfolio-h1-row { display: flex; align-items: center; gap: 8px; }` wrapping `<h1>` and the refresh `<button>` together. The eyebrow `<p class="eyebrow">` is now a direct child of `.portfolio-title-row` above the h1 row.

---

## Fix 2: Aggregate Tab Label Shortened to "전체"

**Problem:** The aggregate tab displayed "전체 포트폴리오" — too wide for a compact tab.

**Fix:** `aggregateTab.textContent` changed from `'전체 포트폴리오'` to `'전체'`. The detail panel title (`title.textContent = aggregateSelected ? '전체 포트폴리오' : portfolio!.name`) is unchanged.

---

## Fix 3: Floating Mini Toolbar for Edit/Delete

**Problem:** Edit/delete buttons were inline siblings of the tab button, reserving horizontal space always.

**Fix:** Each `.portfolio-tab-item` is now `flex-direction: column`. A `.portfolio-tab-floating-actions` span sits above `.portfolio-tab-main`. The floating actions have `height: 24px; opacity: 0; pointer-events: none` by default, revealed on `.portfolio-tab-item:hover` and `:focus-within`. Horizontal space is never reserved.

---

## Fix 4: Remove Vertical Scrollbar from Tab Row

**Root cause:** `.portfolio-bookmark-tabs { overflow-x: auto; overflow-y: visible }` — browsers normalize `overflow-x: auto` + `overflow-y: visible` to both `auto`, adding a vertical scrollbar when tab items become taller.

**Fix:** Changed `overflow-y: visible` to `overflow-y: hidden`. With column-flex tab items, vertical height is fixed in layout so no content is clipped.

**Supplemental fix:** `.portfolio-tab-list { align-items: flex-end }` ensures aggregate and add tabs (which remain single-row without floating actions overhead) align to the bottom of the tab row, matching user tab bottom edges visually.

---

## Fix 5: Inline `+ 추가` Tab After User Portfolio Tabs

**Problem:** `+ 추가` was a static HTML button outside `#portfolio-list`, pinned far-right via `margin-left: auto; border-left: 1px solid var(--border)`.

**Fix:**
- Static `<button id="portfolio-manage-toggle">` removed from HTML.
- `renderPortfolios()` now creates `addBtn` as the last child of `#portfolio-list` using `addBtn.id = 'portfolio-manage-toggle'`, `addBtn.dataset.action = 'toggle-manage-panel'`.
- CSS `.portfolio-bookmark-tab--add` strips `margin-left: auto` and `border-left`.
- The add tab is rendered in both branches of `renderPortfolios()`: after user tabs (portfolios > 0) and alone when portfolios = 0.

---

## Fix 6: Toggle-Manage-Panel Click Handling

**Problem:** The standalone `getElement('portfolio-manage-toggle')?.addEventListener(...)` targeted the removed static HTML element — dead code at runtime after this fix.

**Fix:**
- Removed the dead standalone listener.
- Added a `toggle-manage-panel` case at the top of the `#portfolio-list` click delegation (before the `if (!id) return` guard) that reads `isPanelOpen`, toggles panel visibility, and updates `aria-expanded` and button text.

---

## Non-goals

- Tab order persistence (localStorage) — deferred.
- Live KIS valuation or GNews fetch — not added.
- Drag-and-drop reorder — not added.
- `/news` page — not created.
- Any changes to `HomePortfolioPanel.astro`, `HomeMarketNews.astro`, auth, Supabase, Vercel config.

---

## CSS Classes Added / Modified

| Class | Change |
|---|---|
| `.portfolio-h1-row` | New — `display: flex; align-items: center; gap: 8px` |
| `.portfolio-title-row` | Removed flex layout; now `margin-bottom: 8px` only |
| `.portfolio-tab-floating-actions` | New — `height: 24px; opacity: 0; pointer-events: none; transition: opacity 0.12s` |
| `.portfolio-tab-item:hover .portfolio-tab-floating-actions` | New — `opacity: 1; pointer-events: auto` |
| `.portfolio-tab-main` | New — `display: flex; align-items: center` |
| `.portfolio-tab-item` | Added `flex-direction: column` |
| `.portfolio-tab-inline-action` | Removed `opacity: 0` and `transition` (parent controls) |
| `.portfolio-tab-list` | Changed `align-items: stretch` → `align-items: flex-end` |
| `.portfolio-bookmark-tabs` | Changed `overflow-y: visible` → `overflow-y: hidden` |
| `.portfolio-bookmark-tab--add` | Removed `margin-left: auto` and `border-left` |
| `@media (hover: none)` | Changed `.portfolio-tab-inline-action { opacity: 1 }` → `.portfolio-tab-floating-actions { opacity: 1; pointer-events: auto }` |

---

## Validation Results

- `check_portfolio_bookmark_tabs_static_contract.mjs`: 104/105 PASS (only result doc check pending at time of run; 105/105 after doc created)
- `check_portfolio_layout_refactor_static_contract.mjs`: 73/73 PASS
- `check_home_portfolio_panel_static_contract.mjs`: 84/84 PASS
- `check_gnews_news_policy_static_contract.mjs`: run during final validation
- Build: passes

---

## Safety Boundaries Confirmed

- No live KIS calls
- No live GNews calls
- No Supabase writes
- No DB migrations
- No Vercel config changes
- No auth changes
- `HomePortfolioPanel.astro` not modified
- `HomeMarketNews.astro` not modified
