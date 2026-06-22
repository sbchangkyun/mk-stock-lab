# Phase 3AH Global Page Gutter Second Pass Result v0.1

## 1. Title And Metadata

- **Phase**: 3AH
- **Type**: UI layout refinement second pass
- **Status**: Implemented
- **Scope**: Global page gutter increase
- **API changes**: None
- **KIS/Supabase/Vercel changes**: None
- **Date**: 2026-06-22

---

## 2. Objective

The owner reviewed Phase 3AG in the browser across Home, Chart AI, Market, Lab, and Portfolio and reported that the gutter change was too subtle — the page still felt cramped and too close to the left and right viewport edges. This phase increases the global desktop gutter more visibly so the breathing room is immediately perceptible.

---

## 3. Implementation Summary

### File Changed

| File | Change |
|---|---|
| `src/styles/style.css` | Updated `--page-gutter-x` in `:root` |

### CSS Variable Change

| | Value |
|---|---|
| **Previous (Phase 3AG)** | `clamp(20px, 2.25vw, 40px)` |
| **New (Phase 3AH)** | `clamp(24px, 4vw, 72px)` |

Only line 5 of `src/styles/style.css` changed. No other files were modified.

### Why the new value creates a more visible desktop gutter

The previous value grew at 2.25 px per 100 px of viewport width. At 1280 px this yielded about 29 px and at 1440 px about 32 px — an 11 px improvement over Phase 3AE baseline that was not clearly perceptible.

The new value grows at 4 px per 100 px of viewport width, nearly double the growth rate:

| Viewport | Previous gutter | New gutter | Delta |
|---|---|---|---|
| 1080 px (body min-width) | 24 px | 43 px | +19 px |
| 1280 px | ~29 px | ~51 px | +22 px |
| 1440 px | ~32 px | ~58 px | +26 px |
| 1920 px | 40 px (max) | 72 px (clamped max) | +32 px |

The wider viewport range (max grows from 40 px to 72 px) and steeper slope make the gutter visibly wider at common desktop breakpoints.

### Mobile gutter

The clamp minimum is 24 px (increased from 20 px in Phase 3AG). No separate mobile media query was added because:
- The `body` rule sets `min-width: 1080px`, so the effective minimum rendered width is 1080 px where `4vw = 43px`.
- Even at the CSS minimum clamp floor (24 px), the value is modest and not overly padded.
- The existing `@media (max-width: 640px)` block already handles component-level responsive adjustments.

### Ad rail dimensions preserved

The following values were not changed:

- `.home-rail-viewport`: `width: 160px; height: 600px` — unchanged
- `.home-rail-ad`: `width: 160px` — unchanged
- `.home-sidebar-column`: `min-width: 160px` — unchanged
- `@media (min-width: 1440px)` home shell grid: `minmax(0, 1fr) 176px` — unchanged

The `--page-max-width: 1500px` root variable was also not changed.

### How the change propagates

All four gutter-consuming rules from Phase 3AG continue to consume `--page-gutter-x` unchanged:

| Element | Rule |
|---|---|
| `.site-header` | `padding: 0 var(--page-gutter-x)` |
| `.ticker-track` | `padding: 0 var(--page-gutter-x)` |
| `.nav-inner` | `padding: 0 var(--page-gutter-x)` |
| `.site-main` | `width: min(calc(100% - 2 * var(--page-gutter-x)), var(--page-max-width))` |

All pages (Home, Market, Chart AI, Lab, Portfolio) inherit the change through `Layout.astro` without per-page changes.

---

## 4. Expected Visual Behavior

| Viewport Width | `--page-gutter-x` value | Content edge from viewport edge |
|---|---|---|
| 320 px | 24 px (clamped minimum) | 24 px each side |
| 640 px | 25.6 px | ~26 px each side |
| 1080 px (body min) | ~43 px | ~43 px each side |
| 1280 px | ~51 px | ~51 px each side |
| 1440 px | ~58 px | ~58 px each side |
| 1800 px | 72 px (clamped maximum) | 72 px each side |
| 1920 px+ | 72 px (max) — then `--page-max-width: 1500px` auto-centers | generous auto-centering beyond 1500 px content width |

At 1920 px, the `min()` in `.site-main` resolves to `min(1920 - 144, 1500) = min(1776, 1500) = 1500px`, so `--page-max-width` centering applies and effective side space is `(1920 - 1500) / 2 = 210 px`.

---

## 5. Validation Results

| Command | Result |
|---|---|
| `npm run build` | Pass — Server built in 2.56 s, Complete |
| `git diff --check` | Pass — LF→CRLF warning only, no whitespace errors |
| `git status --short` | Only `src/styles/style.css` modified |

No TypeScript source files were changed, so `npx tsc --noEmit` was not required.

---

## 6. Confirmed Non-Actions

- No API logic was changed (`src/pages/api/` untouched).
- No KIS provider logic was changed (`kisClient.ts` untouched, `classifyRuntime` guard unchanged).
- No Supabase logic was changed.
- No Vercel configuration was changed.
- No Vercel environment variables were mutated.
- No deployment occurred.
- No live network calls were made.
- No UI live quote wiring was added.
- No migration files were changed.
- No production SQL pack files were changed.
- No root `README.md` was changed.
- No `.env*` file contents were read.
- No secrets or price values were recorded.

---

## 7. Owner Browser Review Checklist

- [ ] **Home at 1440 px** — the left content column and the right 160 × 600 ad rail should no longer feel too close to the viewport left and right edges. The ad rail itself must remain 160 px wide and 600 px tall.
- [ ] **Market at 1440 px** — the treemap card and scatter card should have clearly visible side breathing room (~58 px from viewport edge to card edge).
- [ ] **Lab at 1440 px** — card grid should not feel edge-to-edge; visible outer margin expected.
- [ ] **Portfolio at 1440 px** — left sidebar panel (360 px) and main position table should have a clear outer left margin.
- [ ] **Chart AI at 1440 px** — the two-column workspace grid (chart left, analysis right) should remain balanced with visible side gutters.
- [ ] **Mobile (375–390 px)** — no horizontal scroll; 24 px minimum gutter is comfortable but unobtrusive.
- [ ] **At 1280 px** — gutter should be noticeably wider than Phase 3AG (~51 px vs ~29 px before).
- [ ] **At 1440 px** — gutter should be clearly wider than Phase 3AG (~58 px vs ~32 px before).
- [ ] **Header, ticker, nav, and content left edges** — all remain horizontally aligned at every viewport width.
- [ ] **If the gutter feels off** — adjust only `clamp(24px, 4vw, 72px)` in `--page-gutter-x`. No other files need to change.
