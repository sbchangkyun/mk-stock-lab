# Phase 3BM — Portfolio Page Layout Refactor: Result Document

**Version:** v0.1
**Branch:** `rebuild/phase-1-ia-shell`
**Committed as:** `refactor: expand portfolio dashboard layout`

---

## 1. Title and Metadata

| Field | Value |
|---|---|
| Phase | 3BM |
| Type | Portfolio page layout refactor |
| Status | Implemented |
| Latest prior commit | `0833067` — feat: add home portfolio status panel |
| Portfolio page | Updated |
| Home implementation | Unchanged |
| API route changes | None |
| Database changes | None |
| Supabase schema/storage changes | None |
| Deployment | Not performed |

---

## 2. Objective

Refactor the Portfolio page (`src/pages/portfolio.astro`) so the aggregate portfolio dashboard becomes the dominant full-width view, removing developer-visible debug status chips and the permanent 360px registration sidebar that previously compressed the holdings panel. Portfolio creation remains accessible via a collapsible manage section. Bookmark tabs and reorder UX are deferred to Phase 3BN.

---

## 3. Implementation Summary

### Files changed

| File | Change |
|---|---|
| `src/pages/portfolio.astro` | Layout refactored — header, status bar, sidebar, dashboard |
| `src/styles/style.css` | Status bar CSS replaced; portfolio-mvp layout changed; new classes added |
| `scripts/check_portfolio_layout_refactor_static_contract.mjs` | Created — 12-group static checker |
| `scripts/check_gnews_news_policy_static_contract.mjs` | Phase 3BM artifact group appended |
| `package.json` | `check:portfolio-layout` script added |
| `docs/planning/phase_3bm_portfolio_page_layout_refactor_result_v0.1.md` | Created (this file) |
| `docs/planning/planning_changelog.md` | Phase 3BM entry prepended |

### Status chips removed

The `<section class="portfolio-status-bar">` containing four debug status pills was removed:
- 로그인됨 (`data-status-key="login"`)
- 프로필 준비 완료 (`data-status-key="profile"`)
- API 사용 가능 (`data-status-key="api"`)
- 평가 준비 중 (neutral pill)

Replaced with `<div class="portfolio-loading-state" id="portfolio-readiness">` — a minimal, non-visible-by-default loading message (`portfolio-readiness-copy`). CSS hides it when `[data-state="ready"]` or `[data-state="checking"]`. All JS state machine references (`id="portfolio-readiness"`, `id="portfolio-readiness-copy"`) remain functional.

### Refresh control added

A refresh icon button (`id="portfolio-refresh"`) was moved from inside the sidebar to the page header, placed in a new `.portfolio-title-row` flex container to the right of the "내 투자 포트폴리오" heading:
- `aria-label="현재 포트폴리오 다시 계산"`
- `title="현재 포트폴리오 다시 계산"`
- Connected to the existing `loadPortfolioMvp()` function
- Focus-visible ring via `.portfolio-refresh-btn:focus-visible`

### Dashboard expanded

`.portfolio-mvp` layout changed from `display: grid; grid-template-columns: 360px minmax(0, 1fr)` to `display: flex; flex-direction: column`. The `<section class="portfolio-detail portfolio-dashboard panel">` now occupies the full available width.

### Permanent registration side panel removed/collapsed

`<aside class="portfolio-sidebar panel">` was removed as a permanent layout column. Portfolio management content is now in:
- **`.portfolio-selector-bar`**: Horizontal flex container above the dashboard. Contains `#portfolio-list` (selection buttons rendered by `renderPortfolios()`) and a `+ 포트폴리오 관리` toggle button.
- **`.portfolio-manage-panel`** (hidden by default): Collapsible section below the dashboard. Contains `#portfolio-form` (create/edit) and all required form inputs. Auto-opens when no portfolios exist. Auto-opens when an edit action is triggered.

All form element IDs required by the JS state machine (`portfolio-id`, `portfolio-name`, `portfolio-base-currency`, `portfolio-submit`, `portfolio-cancel-edit`, `portfolio-form`) are preserved in the DOM in the manage panel.

### Checker added

`scripts/check_portfolio_layout_refactor_static_contract.mjs` — 12 groups, 73 checks, no network calls. Validates debug chip removal, refresh control, aggregate default, sidebar removal, form preservation, live isolation, future-feature absence, DB isolation, boundary isolation, CSS changes, and checker network safety.

### Documentation/changelog updated

`docs/planning/planning_changelog.md` updated with Phase 3BM entry.

---

## 4. Layout Behavior

### Page header behavior

The page header uses a `.portfolio-title-row` flex container:
- Left: eyebrow "포트폴리오" + h1 "내 투자 포트폴리오"
- Right: refresh icon button

The lead copy paragraph sits below the title row inside the same header div. On narrow screens the title row wraps naturally.

### Aggregate/default view behavior

`loadPortfolios()` already sets `state.selectedPortfolioId = aggregatePortfolioId` when no portfolio is explicitly selected. This behavior is unchanged. The "전체 포트폴리오" aggregate view (all holdings merged by symbol/market) remains the default on initial load when portfolios exist.

### Expanded dashboard behavior

The `portfolio-mvp` section stacks vertically:
1. `.portfolio-selector-bar` — compact horizontal portfolio list + manage toggle
2. `.portfolio-detail.portfolio-dashboard.panel` — full-width holdings panel
3. `.portfolio-manage-panel` (collapsible) — portfolio create/edit form

The holdings panel takes full available width instead of the previous `minmax(0, 1fr)` within a 2-column grid.

### Registration UI handling

Portfolio creation is preserved via the collapsible `.portfolio-manage-panel`:
- Clicking "+ 포트폴리오 관리" shows/hides the form panel
- Clicking a portfolio's 수정 button in the selector list auto-opens the panel
- When no portfolios exist, the panel auto-opens so new users see the creation form immediately
- The form behavior (submit, reset, cancel-edit) is unchanged

### Responsive behavior

The `.portfolio-mvp` flex-column layout is inherently single-column and mobile-safe. The `.portfolio-selector-bar` wraps with `flex-wrap: wrap`. The dashboard panel uses `width: 100%` and inherits responsive `overflow-x: auto` from the existing positions list.

---

## 5. Refresh Semantics

| Property | Value |
|---|---|
| Refresh trigger | `loadPortfolioMvp()` — existing local function |
| What it does | Re-fetches portfolio list from `/api/portfolio/portfolios` and positions from `/api/portfolio/positions` |
| Live KIS call | No — valuation data remains placeholder only |
| Real-time quote claim | None — copy reads "현재 포트폴리오 다시 계산" |
| Future live KIS refresh | Deferred — out of scope for Phase 3BM |
| Side effects | Resets and re-renders portfolio list and positions |

The refresh button was previously in the sidebar (already wired to `loadPortfolioMvp()`). Moving it to the page header makes the same behavior more prominent without adding any new live data calls.

---

## 6. Non-Goals

| Feature | Status |
|---|---|
| Bookmark tabs | Not implemented — deferred to Phase 3BN |
| Tab reorder arrows (`‹ name ›`) | Not implemented — deferred to Phase 3BN |
| + bookmark tab | Not implemented — deferred to Phase 3BN |
| Portfolio creation modal/slide-over | Not implemented — creation form remains in collapsible manage panel |
| Tab order persistence (localStorage) | Not implemented — deferred to Phase 3BN |
| DB/Supabase schema changes | Not performed |
| Live KIS quote integration | Not performed — no KIS calls added |
| GNews changes | Not performed |
| Deployment | Not performed |

---

## 7. Safety Boundaries

All safety constraints met:
- No live GNews call made or wired
- No live KIS call made or wired
- No external HTTP request in code or checker
- No GNews env var reads added
- No KIS secret reads added
- No Supabase schema/storage changes
- No DB/migration files created
- No deployment performed
- Home page (`index.astro`) not modified
- `HomePortfolioPanel.astro` not modified
- `HomeMarketNews.astro` not modified
- `/news` page not created
- No `status-pill`, `portfolio-status-bar`, or debug-chip classes added back
- No `실시간`, `live`, or `최신 시세 반영` copy added to refresh button

---

## 8. Validation Results

| Command | Result |
|---|---|
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

## 9. Remaining Limitations

- Bookmark tabs not yet implemented (Phase 3BN).
- Portfolio selector is a flex list of items — not the final tab UI.
- Tab reorder arrows not implemented.
- Tab order persistence not implemented.
- Live KIS valuation not enabled — current/market value and return rate are placeholder-only.
- Live GNews provider compatibility still unresolved.
- `/news` paginated list page deferred (Phase 3BI).
- Portfolio creation UX still uses inline compact form (modal/slide-over deferred).
- The manage panel toggle ("+ 포트폴리오 관리") is a simple collapse — not final Phase 3BN UX.

---

## 10. Recommended Next Phases

| Phase | Description |
|---|---|
| **3BN** | Portfolio Bookmark Tabs & Reorder UX — implement horizontal tab bar with aggregate (pinned left), + tab (pinned right), user tabs (reorderable) |
| **3BO** | Portfolio Owner Browser Review — validate layout, data display, responsiveness |
| **3BI** | Optional `/news` paginated list page (deferred) |
