# Phase 3DV-HF1 - Mobile Viewport and Global Responsive Layout Hotfix Result

## 1. Status

Implemented - owner production re-check pending.

Production deployment is pending successful validation and the implementation commit.

## 2. Owner-Reported Issue

Production mobile pages rendered like a desktop page scaled down, with a large right-side blank area and a non-fluid layout across Home, Chart AI, Market, Lab, Portfolio, MyPage, and login modal states.

## 3. Root Cause

Source inspection confirmed that `Layout.astro` already had one device-width viewport meta tag, so a missing or fixed-width viewport tag was not the primary source defect.

The shared shell did not fully isolate the document width from intrinsic-width descendants:

- `html` and `body` had no explicit `width` / `max-width` viewport ceiling.
- `body` had no horizontal-overflow guard.
- `.site-main` used `max-width: none` and did not declare `min-width: 0`.
- Major route shells did not consistently declare `min-width: 0` / `max-width: 100%` containment.
- Portfolio holdings and Lab matrices intentionally contain 700px+ data surfaces. Their internal scroll wrappers existed, but the outer shell lacked a consistent shrink boundary.

That combination allowed intrinsic-width content to influence the page-level width instead of remaining isolated inside its local scrolling container.

## 4. Fix Summary

- **Viewport meta**: retained `width=device-width` and `initial-scale=1`, added `viewport-fit=cover`, and preserved user zoom.
- **Global shell**: constrained `html` and `body` to `100%`, added body-level `overflow-x: hidden` after fixing shrink containment, and capped common shell elements at the viewport width.
- **Route-level responsive fixes**: added shrink-safe containment to `.site-main`, its direct route roots, and the Home, Chart AI, Market, Lab, Portfolio, and MyPage shell classes.
- **Internal scroll preservation**: retained `overflow-x: auto` on `.positions-list-wrap`, `.lab-matrix-scroll`, `.table-wrap`, and mobile navigation/ticker containers.
- **Banner behavior preservation**: retained the mobile Home banner through 859px, its hidden state from 860px, and the desktop Home rail from 1440px.

## 5. Validation

- `npm run check:phase-3dv-hf1-mobile-viewport`: PASS (47/47)
- `npm run check:mobile-baseline`: PASS (74/74)
- `npm run check:phase-3du-mobile-home-ad-banner`: PASS (59/59)
- `npm run check:phase-3du-hf2-banner-admin-persistence`: PASS (43/43)
- `npm run check:phase-3dv-production-deployment`: PASS (32/32)
- `npm run check:production-domain`: PASS (33/33)
- `npm run build`: PASS
- `git diff --check`: PASS

## 6. Safety

- No secrets were read or printed.
- No live Supabase rows were inspected.
- No SQL or migration was run.
- No Supabase Storage upload occurred.
- No Vercel environment variables were changed.
- No API route or provider/backend logic was changed.
- No logged-in browser automation was run.
- No remote push was performed.

## 7. Owner Re-check

After production deployment, the owner should verify:

- Home fills the mobile viewport without a right-side blank area.
- Chart AI fills the mobile viewport.
- Market fills the mobile viewport.
- Lab fills the mobile viewport.
- Portfolio fills the mobile viewport while preserving internal holdings-table scrolling.
- MyPage fills the mobile viewport.
- The login modal remains centered and sized inside the viewport.
- The mobile Home banner remains correctly placed and visible through 859px.
- The PC Home rail remains correct at 1440px and above.
