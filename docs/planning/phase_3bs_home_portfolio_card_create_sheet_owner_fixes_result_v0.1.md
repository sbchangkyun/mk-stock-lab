# Phase 3BS — Home Portfolio Card & Portfolio Create Sheet Owner Fixes Result v0.1

## 1. Title and Metadata

- **Phase**: 3BS
- **Type**: Home Portfolio Card & Portfolio Create Sheet Owner Fixes
- **Status**: Implemented
- **Latest prior commit**: 94f51b6 feat: add portfolio holdings category header
- **Home implementation**: updated (HomePortfolioPanel.astro, style.css)
- **Portfolio page implementation**: updated (portfolio.astro, style.css)
- **API route changes**: none
- **Database schema changes**: none
- **Supabase schema/storage changes**: none
- **Deployment**: not performed

---

## 2. Objective

This phase improves the Home MY PORTFOLIO card visual hierarchy (larger donut chart, top-right portfolio count meta) and replaces the old inline portfolio create/manage panel (which was hidden below the page and easy to miss) with a bottom slide sheet that is always immediately visible when invoked, matching the existing 종목 추가 position sheet pattern.

---

## 3. Owner Findings Addressed

| Finding | Resolution |
|---|---|
| Donut chart is too small | Enlarged from 76px to 120px diameter |
| Donut chart should be positioned higher | Removed stat row block above donut; section margin reduced from 12px to 4px |
| "포트폴리오 / 3개" meta occupies central space | Moved to top-right corner of MY PORTFOLIO card |
| Meta wording must stay "포트폴리오 / N개" | Preserved exactly — `hpp-meta-label` = "포트폴리오", `hpp-meta-value` = "N개" |
| Old bottom inline portfolio registration box | Completely removed from page flow |
| +추가 should open bottom slide sheet | Replaced with `portfolio-sheet` bottom slide dialog |
| Sheet style should match existing position sheet | Mirrored structure and animation of `position-sheet` |

---

## 4. Home Implementation Summary

### Files changed

- `src/components/HomePortfolioPanel.astro` — State C HTML restructured
- `src/styles/style.css` — HPP CSS updated

### Card layout changes

**Before:**
- State C: eyebrow "MY PORTFOLIO" + h2 title + `.hpp-summary` stat row (포트폴리오 N개) stacked vertically above donut

**After:**
- State C: `.hpp-card-header` flex row:
  - Left: eyebrow "MY PORTFOLIO" + h2 title (same content, now in left sub-block)
  - Right: `.hpp-card-meta` with `.hpp-meta-label` "포트폴리오" and `.hpp-meta-value` "N개" (right-aligned)
- `.hpp-donut-section` appears immediately below header (reduced top margin from 12px to 4px)

### Donut chart changes

- `.hpp-donut`: size changed from `76px × 76px` to `120px × 120px`
- `.hpp-donut-hole`: `inset` changed from `19px` to `30px` (maintains ring proportions)
- `.hpp-donut-section`: `margin` changed from `12px 0 8px` to `4px 0 8px`
- `.hpp-donut-wrap`: added `margin-bottom: 6px` for spacing from basis copy

### Meta block changes

- Removed: `.hpp-summary`, `.hpp-stat-row`, `.hpp-stat-label`, `.hpp-stat-value`, `.hpp-stat-placeholder`, `.hpp-stat-row--count` CSS rules
- Added: `.hpp-card-header` (`display: flex; justify-content: space-between`), `.hpp-card-meta` (`text-align: right`), `.hpp-meta-label` (10px uppercase muted), `.hpp-meta-value` (20px bold)
- The `id="hpp-portfolio-count"` span and its "개" suffix remain in the same location, just inside the new `hpp-card-meta` container

### Anti-flicker state preserved

- `#hpp-resolving` with `data-hpp-default="true"` remains as SSR-visible default
- `#hpp-signed-out` remains `hidden` class as SSR default (no flash of signed-out for logged-in users)
- `switchHppState` JS function unchanged

### Data basis preserved

- Donut uses `conic-gradient` computed from cost-basis (`buyPrice × quantity`) via `renderDonutChart`
- Allocation basis copy: "등록 금액 기준 계좌 비중" preserved in `.hpp-donut-basis`
- Zero-data fallback: "보유 종목 입력 후 비중이 표시됩니다." preserved in `#hpp-donut-placeholder`

---

## 5. Portfolio Create Sheet Implementation Summary

### Files changed

- `src/pages/portfolio.astro` — HTML: removed inline manage panel, added portfolio sheet; TypeScript: new open/close functions, updated render/delegation logic
- `src/styles/style.css` — Added portfolio-sheet CSS, removed manage panel CSS

### Markup changes

**Removed:**
```html
<div class="portfolio-manage-panel hidden" id="portfolio-manage-panel">
  <div class="portfolio-manage-inner panel">
    <div class="portfolio-panel-header">...</div>
    <form class="compact-form" id="portfolio-form">...</form>
  </div>
</div>
```

**Added:**
```html
<div class="portfolio-sheet" id="portfolio-sheet"
     role="dialog" aria-modal="true" aria-hidden="true"
     aria-labelledby="portfolio-sheet-title">
  <button class="portfolio-sheet-backdrop" id="portfolio-sheet-backdrop"
          type="button" aria-label="포트폴리오 입력창 닫기"></button>
  <section class="portfolio-sheet-panel">
    <header class="portfolio-sheet-header">
      <div>
        <p class="eyebrow">포트폴리오</p>
        <h2 id="portfolio-sheet-title">포트폴리오 만들기</h2>
      </div>
      <button class="table-action-button" id="portfolio-sheet-close" type="button">닫기</button>
    </header>
    <form class="compact-form" id="portfolio-form">
      <!-- same fields: portfolio-id, portfolio-name, portfolio-base-currency,
           portfolio-submit, portfolio-cancel-edit -->
    </form>
  </section>
</div>
```

### Form relocation

- The portfolio form with all existing IDs (`portfolio-form`, `portfolio-id`, `portfolio-name`, `portfolio-base-currency`, `portfolio-submit`, `portfolio-cancel-edit`) is now inside the portfolio sheet panel, not in the inline bottom block.
- Exactly one portfolio form exists in the DOM.
- All form field IDs are preserved, so existing JS event handlers required no ID changes.

### Open/close behavior

- **`openPortfolioSheet()`**: new function — sets `sheet.classList.add('open')`, `aria-hidden="false"`, reads `portfolio-id` to determine create vs. edit mode and sets `portfolio-sheet-title` text accordingly, focuses `portfolio-name` input.
- **`closePortfolioSheet()`**: new function — removes `.open` class, sets `aria-hidden="true"`, resets `aria-expanded` on `portfolio-manage-toggle`, calls `resetPortfolioForm()`.
- Old `openManagePanel()` function fully removed.

### Add tab behavior

- `+추가` tab button (`id="portfolio-manage-toggle"`, `data-action="toggle-manage-panel"`) preserved inline at end of tab list.
- `aria-controls` changed from `portfolio-manage-panel` to `portfolio-sheet`.
- Clicking `+추가` now calls `openPortfolioSheet()` (via `toggle-manage-panel` action in click delegation).
- Button label stays `"+ 추가"` always (no toggle to "닫기" — sheet has its own close button).
- **Auto-open on empty state removed**: previously the empty-portfolio branch of `renderPortfolios` called `openManagePanel()` automatically. This auto-open is not appropriate for a sheet (it would open a sheet on every load/render). Users with no portfolios now see the `+추가` tab and click it explicitly. The tab is always prominent as the only or first tab button.

### Edit behavior

- Clicking "수정" in floating tab toolbar: fills form fields (`portfolio-id`, `portfolio-name`, `portfolio-base-currency`), sets submit text to `'포트폴리오 수정'`, shows cancel-edit button, then calls `openPortfolioSheet()`.
- `openPortfolioSheet` reads the portfolio-id value to determine edit vs. create and sets the sheet title text accordingly.

### Submit/reset behavior

- Successful create or update: calls `closePortfolioSheet()` (which calls `resetPortfolioForm()` internally), then `loadPortfolios()`.
- Cancel edit: `portfolio-cancel-edit` button now calls `closePortfolioSheet()` (was `resetPortfolioForm()`).

### Position sheet preservation

- `position-sheet`, `position-sheet-panel`, `position-sheet-backdrop`, `position-sheet-close`, `openPositionSheet`, `closePositionSheet` all unchanged.

---

## 6. Data and Copy Policy

- Donut chart uses registered/cost-basis allocation (`buyPrice × quantity`), not live market valuation.
- "등록 금액 기준 계좌 비중" basis copy preserved.
- No live KIS call, no current price, no 실시간/live/real-time valuation claims.
- Zero-data fallback text "보유 종목 입력 후 비중이 표시됩니다." preserved.
- "포트폴리오 / N개" meta: label "포트폴리오", value "N개". Not "N개 계좌".

---

## 7. Accessibility and Interaction Behavior

### Dialog role/aria attributes

- `role="dialog"` on `portfolio-sheet`
- `aria-modal="true"` signals a modal dialog to assistive technologies
- `aria-hidden="true"` when closed, `aria-hidden="false"` when open
- `aria-labelledby="portfolio-sheet-title"` links to the visible title element
- `aria-expanded` on `portfolio-manage-toggle` tab button reflects sheet open state

### Close button / backdrop behavior

- `portfolio-sheet-close` button: clicking calls `closePortfolioSheet()`
- `portfolio-sheet-backdrop` button: clicking calls `closePortfolioSheet()`
- Backdrop has `aria-label="포트폴리오 입력창 닫기"` for screen reader context

### Focus behavior

- On open: `portfolio-name` input receives focus after a short `setTimeout(0)` to allow transition
- Focus is not explicitly trapped (minimal focus management, consistent with existing position sheet pattern)

### Keyboard / ESC behavior

- ESC key closes the portfolio sheet if it is open (added to existing keydown handler)
- ESC for position sheet preserved: checked first, then portfolio sheet

### Mobile behavior

- `portfolio-sheet-panel` uses `width: min(560px, calc(100vw - 32px))` for responsive width
- At `max-width: 640px`: width falls back to `calc(100vw - 20px)`, `margin-bottom: 10px`
- `prefers-reduced-motion: reduce` suppresses slide animation via `transition-duration: 1ms`

---

## 8. Preserved Boundaries

- Holdings category header unchanged (`.positions-category-header`, 11 columns, sort arrows)
- Bookmark tabs unchanged except `+추가` target (`aria-controls` now points to `portfolio-sheet`)
- Position add sheet unchanged (`position-sheet`, `openPositionSheet`, `closePositionSheet`)
- HomeMarketNews unchanged
- No /news page created
- Refresh button in `portfolio-h1-row` unchanged
- Portfolio tab floating edit/delete actions unchanged
- Currency display toggle unchanged
- Aggregate tab "전체" label unchanged

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
- No modal library imported
- No drag-to-close added

---

## 10. Validation Results

All commands run prior to commit:

| Checker | Result |
|---|---|
| `check:home-portfolio-panel` | 101/102 PASS (1 failure: result doc not yet created — expected) → 102/102 after doc |
| `check:portfolio-create-sheet` | 78/79 PASS (1 failure: result doc not yet created — expected) → 79/79 after doc |
| `check:portfolio-bookmark-tabs` | 105/105 PASS |
| `check:portfolio-layout` | 73/73 PASS |
| `check:portfolio-holdings-header` | 90/90 PASS |
| `check:home-market-news` | 57/57 PASS |
| `check:gnews-news-policy` | PASS (1 pre-doc failure expected) → PASS after doc |
| `check:gnews-news-engine` | PASS |
| `check:gnews-news-api-route` | PASS |
| `check:gnews-news-api-response` | PASS |
| `check:gnews-news-route-source-selector` | PASS |
| `check:gnews-live-adapter-design` | PASS |
| `check:gnews-live-adapter-static` | PASS |
| `check:gnews-live-adapter-mocked` | PASS |
| `smoke:gnews-live:dry` | PASS |
| `git diff --check` | clean |
| `git status --short` | expected changed files + pre-existing `.vscode/settings.json` |
| `npm run build` | PASS |

---

## 11. Remaining Limitations

- Donut is cost-basis allocation (registered purchase amount × quantity), not live market portfolio weight
- Portfolio creation is now a sheet; advanced account setup (brokerage connection, KIS OAuth) remains deferred
- Live KIS valuation not enabled — current price, true valuation, return rate, profit remain unavailable
- Dividend data (배당률, 예상 연배당금, 배당주기) integration not started
- Tab order persistence remains client-memory only (localStorage deferred)
- Live GNews provider compatibility unresolved
- /news page deferred
- No focus trap in portfolio sheet (consistent with existing position sheet pattern)

---

## 12. Recommended Next Phases

- **Phase 3BT**: Owner Browser Review Round 3 — validate Home card layout (donut size, meta position), portfolio create sheet UX, ESC/close behavior, mobile responsiveness
- **Phase 3BS-R1** (if needed): Focused polish based on owner review findings
- **Later**: KIS valuation integration, dividend data model, tab order persistence, optional /news page
