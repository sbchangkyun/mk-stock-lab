# Phase 3AG Global Page Gutter Layout Refinement Result v0.1

## 1. Title And Metadata

- **Phase**: 3AG
- **Type**: UI layout refinement
- **Status**: Implemented
- **Scope**: Global page gutters / layout shell
- **API changes**: None
- **KIS/Supabase/Vercel changes**: None
- **Date**: 2026-06-22

---

## 2. Objective

The owner reported that the site layout felt too cramped after a prior layout-width adjustment. The goal was to restore modest, consistent left/right breathing room across the full app (Home, Chart AI, Market, Lab, Portfolio, and all shared shell elements) while preserving the 160 × 600 ad banner size.

---

## 3. Implementation Summary

### Files Changed

| File | Change |
|---|---|
| `src/styles/style.css` | Added `--page-gutter-x` CSS variable; updated four layout elements to use it; removed redundant mobile override |

### Change Summary

**New CSS variable in `:root`:**
```css
--page-gutter-x: clamp(20px, 2.25vw, 40px);
```

This single variable drives all horizontal spacing. It clamps between 20 px (narrow / mobile) and 40 px (large desktop), scaling smoothly with the viewport width in between.

**Four layout elements updated to use `--page-gutter-x`:**

| Element | Before | After |
|---|---|---|
| `.site-header` | `padding: 0 40px` | `padding: 0 var(--page-gutter-x)` |
| `.ticker-track` | `padding: 0 40px` | `padding: 0 var(--page-gutter-x)` |
| `.nav-inner` | `padding: 0 20px` | `padding: 0 var(--page-gutter-x)` |
| `.site-main` | `width: min(calc(100% - 48px), ...)` | `width: min(calc(100% - 2 * var(--page-gutter-x)), ...)` |

**Removed redundant mobile override:**
The `@media (max-width: 640px)` block previously overrode `.site-main` width to `calc(100% - 28px)` (14 px per side). Since `--page-gutter-x` clamps to its minimum of 20 px at narrow viewports, the override was no longer needed and was removed.

### Why these four elements

Previously, the header and ticker used 40 px padding while the main content used only 24 px gutters, and the nav inner padding was 20 px. This three-way mismatch caused the left edge of page content to appear indented differently from the header/nav/ticker row above it, making the overall layout feel incoherent and cramped. Unifying all four under one shared variable aligns their left edges consistently across all viewport widths.

### Ad rail dimensions preserved

The following values were not changed:

- `.home-rail-viewport`: `width: 160px; height: 600px` — unchanged
- `.home-rail-ad`: `width: 160px` — unchanged
- `.home-sidebar-column`: `min-width: 160px` — unchanged
- `@media (min-width: 1440px)` home shell: `grid-template-columns: minmax(0, 1fr) 176px` — unchanged

The 160 × 600 ad banner dimensions and the layout grid that positions the ad rail are all unchanged.

### How all pages inherit the change

All pages use `Layout.astro`, which wraps page content in `<main class="site-main">`. The shared `.site-main` CSS rule is the sole width/centering container for all page content. Updating `.site-main` once in `style.css` applies the gutter change to every page without any per-page modifications.

---

## 4. Visual Behavior Summary

| Viewport Width | `--page-gutter-x` value | Content edge from viewport |
|---|---|---|
| 320 px (mobile) | 20 px (clamped minimum) | 20 px each side |
| 640 px (tablet/mobile boundary) | 20 px (clamped minimum) | 20 px each side |
| 1024 px (tablet landscape) | ~23 px | ~23 px each side |
| 1280 px (desktop) | ~29 px | ~29 px each side |
| 1440 px (large desktop) | ~32 px | ~32 px each side |
| 1920 px+ (wide desktop) | 40 px (clamped maximum) — then `--page-max-width: 1500px` takes over | Auto-centered beyond 1500 px |

**Key improvements:**
- Left edge of header brand, ticker items, nav links, and main page content are now aligned to the same horizontal offset at every viewport size.
- Content no longer appears flush against the viewport edge on 1280–1440 px displays.
- At very wide viewports (≥ 1500 px effective content width), the existing `--page-max-width` takes over and auto-centers with generous side space.
- The ad rail column at 1440 px+ continues to appear aligned within the main content area.
- No horizontal overflow is introduced (the `min()` in `.site-main` prevents content from exceeding `--page-max-width`).

---

## 5. Validation Results

| Command | Result |
|---|---|
| `npm run build` | Pass — Server built in 6.20 s, Complete |
| `git diff --check` | Pass — LF→CRLF warning only, no whitespace errors |
| `git status --short` | Only `src/styles/style.css` modified |

No TypeScript source files were changed, so `npx tsc --noEmit` was not required.

---

## 6. Confirmed Non-Actions

- No API logic was changed (`src/pages/api/` untouched).
- No KIS provider logic was changed (`kisClient.ts` untouched, `isProductionRuntime` / `classifyRuntime` unchanged).
- No Supabase logic was changed.
- No Vercel configuration was changed.
- No deployment occurred.
- No live network calls were made.
- No UI live quote wiring was added.
- No migration files were changed.
- No production SQL pack files were changed.
- No root `README.md` was changed.
- No secrets, tokens, price values, or raw KIS fields were recorded.

---

## 7. Remaining Notes

- **Owner browser review required.** The layout change affects rendering in the browser. Claude Code cannot visually inspect the rendered output. The owner should open the site in a browser at 1280 px, 1440 px, and 1920 px widths and verify the gutter feels right.
- **Pages to review**: Home (`/`), Market (`/market`), Chart AI (`/chart-ai`), Portfolio (`/portfolio`), Lab (`/lab`), and at least one Lab sub-page.
- **Ad rail check**: Confirm the 160 × 600 ad rail in the right sidebar appears unchanged and is not clipped or shifted.
- **Mobile check**: Open at 375 px or 390 px width and confirm the 20 px gutters feel correct.
- **Header/nav/content alignment**: At any viewport width, the left edge of the brand logo, nav links, and main content should now be horizontally aligned.
- **If the gutter feels too large or too small**: The single `--page-gutter-x` variable value can be adjusted by changing the `clamp(20px, 2.25vw, 40px)` values. No other files need to change.
