# Phase 3BP — Home Portfolio Panel Owner Review Fixes: Result Document

**Version:** v0.1
**Branch:** `rebuild/phase-1-ia-shell`
**Committed as:** `fix: polish home portfolio panel`

---

## 1. Title and Metadata

| Field | Value |
|---|---|
| Phase | 3BP |
| Type | Home Portfolio Panel polish and anti-flicker |
| Status | Implemented |
| Latest prior commit | `7ac8df8` — feat: add portfolio bookmark tabs |
| Portfolio page implementation | Unchanged |
| Home implementation | Updated (HomePortfolioPanel.astro) |
| API route changes | None |
| Database schema changes | None |
| Supabase schema/storage changes | None |
| Deployment | Not performed |

---

## 2. Objective

Address three owner-review issues found after Phase 3BL/3BN:

1. **CTA vertical text centering** — `포트폴리오 시작하기` and `포트폴리오 보기` buttons had text rendered top-aligned due to `display: block` on `.hpp-cta`, overriding `.button-link`'s flex centering.
2. **Anti-flicker for signed-in users** — SSR rendered the `signed_out` state as the default visible state. Signed-in users briefly saw the signed-out content before the client auth check completed.
3. **MY PORTFOLIO account allocation donut chart** — State C lacked any visual summary of portfolio distribution. A CSS conic-gradient donut chart was added to show cost-basis-weighted account allocation.

---

## 3. Implementation Summary

### Files changed

| File | Change |
|---|---|
| `src/components/HomePortfolioPanel.astro` | Added `hpp-resolving` state as SSR default; moved `data-hpp-default` from `signed_out` to `resolving`; added donut chart markup and JS functions; imported `PortfolioPosition`; fixed non-401 error fallback |
| `src/styles/style.css` | Fixed `.hpp-cta` from `display: block` to `display: flex`; added skeleton, donut chart, and legend CSS |
| `scripts/check_home_portfolio_panel_static_contract.mjs` | Added 3BP checks: resolving state, anti-flicker, CTA flex, donut markup, donut functions, 3BP result doc |
| `scripts/check_gnews_news_policy_static_contract.mjs` | Phase 3BP artifact group appended |
| `docs/planning/phase_3bp_home_portfolio_panel_owner_review_fixes_result_v0.1.md` | Created (this file) |
| `docs/planning/planning_changelog.md` | Phase 3BP entry prepended |

---

## 4. CTA Vertical Centering Fix

### Root cause

`.button-link` defines `display: inline-flex; align-items: center; justify-content: center;`. The `.hpp-cta` rule overrode `display` with `display: block`, which disabled the flex centering, causing text to appear top-aligned.

### Fix

```css
/* Before */
.hpp-cta {
  display: block;
  margin-top: 20px;
  text-align: center;
  text-decoration: none;
}

/* After */
.hpp-cta {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 20px;
  text-decoration: none;
  min-height: 42px;
}
```

`display: flex` is used (not `inline-flex`) so the CTA stretches to full panel width. `text-align: center` is no longer needed since `justify-content: center` handles horizontal centering. `min-height: 42px` matches the `.button-link` baseline.

---

## 5. Anti-Flicker Resolving State

### Problem

SSR renders the component with the `signed_out` state visible. For a signed-in user with portfolios, the client must complete two async operations (auth check → portfolio fetch) before switching to `signed_in_with_portfolio`. During this time the user sees the signed-out onboarding copy, then a flash transition to the portfolio summary.

### Solution

Added a new 4th state `#hpp-resolving` as the SSR-visible default:

- `data-hpp-default="true"` moved from `#hpp-signed-out` to `#hpp-resolving`
- `#hpp-signed-out` now starts with `class="hpp-state hidden"` (same as signed_in_empty and signed_in_with_portfolio)
- The resolving state shows neutral copy ("포트폴리오 상태를 확인하고 있습니다") with a shimmer skeleton
- `HPP_STATE_IDS` updated to `['hpp-resolving', 'hpp-signed-out', 'hpp-signed-in-empty', 'hpp-signed-in-portfolio']`
- `switchHppState()` iterates all 4 IDs

### Anti-flicker guarantee

- Signed-in users: see resolving → portfolio summary (no signed-out flash)
- Signed-out users: see resolving → signed-out onboarding (one visible state change, both calm)
- No-JS / SSR-only: resolving state is permanently visible (acceptable neutral state)

### Error fallback improvement

Previously all errors (401 and non-401) resolved to `signed_out`. Non-401 errors (network failure, 503) now resolve to `signed_in_empty`, since a network error does not confirm that the user is signed out.

---

## 6. MY PORTFOLIO Donut Chart

### Data basis

- **Source**: `portfolioApi.listPositions(portfolioId)` called client-side per portfolio
- **Formula**: `costBasis = sum(position.quantity * position.buyPrice)` for all positions in a portfolio
- **No live KIS**: uses registered purchase price only, not current market price
- **Multi-currency**: chart displays raw sums; no KRW/USD normalization. Copy reads "등록 금액 기준 계좌 비중" (based on registered amount) to avoid implying market-rate conversion
- **Label**: "등록 금액 기준 계좌 비중" — conservative label that does not claim live valuation or cross-currency accuracy

### Chart implementation

CSS conic-gradient donut chart — no external library:

```javascript
donutEl.style.background = `conic-gradient(${gradient.join(', ')})`;
```

- Up to 4 individual portfolio segments displayed; additional portfolios grouped as "기타" in slate gray
- Hole: 19px inset `div.hpp-donut-hole` with `background: var(--surface)` for donut appearance
- Legend: `hpp-donut-legend-item` spans with color dot, portfolio name (truncated on overflow), percentage
- Zero-cost fallback: if all positions have zero or missing `buyPrice`/`quantity`, gray placeholder donut + "보유 종목 입력 후 비중이 표시됩니다."
- Load failure fallback: if `listPositions()` throws, `renderDonutChart()` is still called with empty data — placeholder is shown gracefully

### Color palette

| Slot | Color |
|---|---|
| Portfolio 1 | `#3b82f6` (blue) |
| Portfolio 2 | `#f59e0b` (amber) |
| Portfolio 3 | `#10b981` (emerald) |
| Portfolio 4 | `#ef4444` (red) |
| Portfolio 5+ | `#8b5cf6` (violet) |
| 기타 group | `#94a3b8` (slate) |

### Non-blocking load

`updatePortfolioDisplay()` switches to `signed_in_with_portfolio` state first, then fires `void loadDonutChart(portfolios)` asynchronously. The panel becomes interactive immediately while the chart loads in the background.

---

## 7. CSS Changes

### Added classes

| Class | Purpose |
|---|---|
| `.hpp-resolving-skeleton` | Container for skeleton shimmer lines in resolving state |
| `.hpp-skeleton-line` | Individual shimmer line (default 85% width) |
| `.hpp-skeleton-line--wide` | Full-width skeleton line (100%) |
| `.hpp-skeleton-line--narrow` | Narrow skeleton line (60%) |
| `@keyframes hpp-shimmer` | Opacity pulse animation (0.7 → 0.35 → 0.7, 1.5s) |
| `.hpp-donut-section` | Wrapper for donut + label + placeholder |
| `.hpp-donut-wrap` | Flex row: donut circle + legend |
| `.hpp-donut` | 76×76px circle with conic-gradient background |
| `.hpp-donut-hole` | 19px inset hole div (creates donut effect) |
| `.hpp-donut-legend` | Column flex legend area |
| `.hpp-donut-legend-item` | Individual legend row: dot + name + percentage |
| `.hpp-donut-legend-dot` | 8px color dot |
| `.hpp-donut-legend-name` | Portfolio name (truncated on overflow) |
| `.hpp-donut-legend-pct` | Bold percentage label |
| `.hpp-donut-basis` | 10px muted copy: "등록 금액 기준 계좌 비중" |
| `.hpp-donut-placeholder` | 11px placeholder shown when no cost basis data |
| `.hpp-stat-row--count` | Override for single stat row (prevents `:last-child` column-direction from applying) |

---

## 8. Non-Goals

| Feature | Status |
|---|---|
| Live KIS market price valuation | Not implemented |
| KRW/USD cross-currency normalization | Not implemented |
| Animated donut transitions | Not implemented (transition: background 0.3s only) |
| Portfolio page changes | Not modified |
| HomeMarketNews changes | Not modified |
| DB schema changes | Not performed |
| Supabase schema/storage changes | Not performed |
| /news page | Not created |
| Deployment | Not performed |

---

## 9. Safety Boundaries

All safety constraints met:
- No live GNews call made or wired
- No live KIS call made or wired (`listPositions` uses Supabase-backed API, no KIS)
- No external HTTP request added
- No GNews env var reads added
- No KIS secret reads added
- No Supabase schema/storage changes
- No DB/migration files created
- No deployment performed
- Portfolio page (`portfolio.astro`) not modified
- `HomeMarketNews.astro` not modified
- `/news` page not created
- No `status-pill` / `portfolio-status-bar` classes restored
- No real-time KIS quote copy added
- Donut chart label does not claim live valuation or cross-currency normalization

---

## 10. Validation Results

| Command | Result |
|---|---|
| `npm run check:home-portfolio-panel` | 84/84 PASS |
| `npm run check:portfolio-bookmark-tabs` | 88/88 PASS |
| `npm run check:portfolio-layout` | 73/73 PASS |
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
| `git status --short` | Clean (only expected files) |
| `npm run build` | PASS |

---

## 11. Remaining Limitations

- Donut chart shows registered purchase amount (cost basis), not current market value — no live KIS price.
- Multi-currency portfolios (KRW + USD) are shown with raw sums without normalization — chart is approximately proportional only when all portfolios share the same currency.
- Resolving state text is static — no timeout-based fallback if auth check hangs indefinitely (addressed if users report stalls).
- Chart loads after state switch — brief gray placeholder donut visible during `listPositions()` fetch.

---

## 12. Recommended Next Phases

| Phase | Description |
|---|---|
| **3BO** | Portfolio Owner Browser Review — validate tab UI, donut chart, anti-flicker, CTA centering |
| **3BN-R1** | Bookmark Tab Fixes if owner review reveals issues |
| **3BI** | Optional `/news` paginated list page (deferred) |
| **Future** | Live KIS valuation integration for accurate portfolio returns |
