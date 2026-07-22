# Phase 3DX - UI Architecture Stabilization Plan

## 1. Status

Planned - UI architecture stabilization plan completed; no runtime changes.

## 2. Background

Phase 3DV-CLOSEOUT and Phase 3DW-CLOSEOUT established the immediate production baseline for `https://mkstocklab.vercel.app`.

The plan exists because:

- Mobile regressions repeatedly came from global shell assumptions rather than a single route component.
- Route-level wrappers and dense data surfaces require explicit shrink and local-scroll boundaries.
- A fixed 728x70 footer partner ad injected into `.footer-ad-wrapper` caused production-only document-width expansion and a right-side mobile blank area.
- Phase 3DW added a public production geometry guard that measures document, body, visual viewport, and login-modal geometry.
- Future live data, charts, tables, ads, and richer visualizations need a stable UI architecture contract before their complexity increases.

This document is the reference contract for future public UI work. It records current invariants and acceptance rules; it does not authorize runtime changes.

## 3. Architecture Principles

1. A child component must never widen the document or body beyond the viewport.
2. Dense content may exceed the viewport only inside a named, overflow-isolated local scroll wrapper.
3. External advertisements, `ins` elements, and iframes must be constrained by their owning wrapper.
4. Route roots and intermediate grid/flex children must be shrink-safe with `min-width: 0` and capped with `max-width: 100%`.
5. Responsive width should derive from available inline space and page gutters, not fixed desktop assumptions.
6. Mobile user zoom must remain enabled.
7. Body-level overflow suppression is a final safety ceiling, not a substitute for component-level containment.
8. Export capture may temporarily use a wider isolated capture surface, but normal page geometry must remain viewport-safe.
9. Static checkers validate source contracts; the Phase 3DW browser guard validates actual rendered production geometry. Neither replaces the other.
10. Public UI changes are not ready for owner acceptance until their relevant static checks and geometry guard policy have been satisfied.

The accepted rendered-width threshold remains: document/body client and scroll widths must be less than or equal to `innerWidth + 2`.

## 4. Global Layout Contract

### 4.1 Viewport

- `src/layouts/Layout.astro` owns the single viewport meta declaration.
- It must retain `width=device-width`, `initial-scale=1`, and `viewport-fit=cover`.
- `user-scalable=no` is prohibited.
- `maximum-scale=1` is prohibited.
- No fixed desktop viewport width may be introduced.

### 4.2 Document and Body

- `html` and `body` remain `width: 100%` with `max-width: 100%`.
- The body remains a column flex shell with `min-height: 100vh`.
- A global fixed `min-width` is prohibited.
- `overflow-x: hidden` or `clip` may remain as a safety ceiling, but every overflowing child must still have an explicit local containment owner.
- Global `box-sizing: border-box` remains the sizing baseline.

### 4.3 Main Content and Gutters

- `.site-main` remains the shared content boundary.
- Its width continues to use the available width minus `--page-gutter-x`, capped by `--page-max-width`.
- `.site-main` must retain `min-width: 0`, `max-width: 100%`, and centered margins.
- `--page-gutter-x` remains responsive through `clamp()`, with a tighter value at mobile widths.
- Direct `.site-main` children and named route shells remain in the shared shrink-containment selector group.

### 4.4 Theme Compatibility

- Layout dimensions must not depend on light-only colors or shadows.
- New surfaces should use existing CSS variables so `body.dark-mode` remains compatible.
- Dark-mode changes must not alter intrinsic widths, overflow ownership, or breakpoint behavior.

## 5. Route Shell Contract

Every route contract below inherits the global `.site-main` boundary and prohibits fixed route-root widths, negative inline positioning that expands the document, and uncontained intrinsic-width children.

### 5.1 Home

- **Root shell**: `.home-shell`; primary content: `.home-main-column`; desktop ad column: `.home-sidebar-column`.
- **Width behavior**: `minmax(0, 1fr)` is the content track; the rail track is introduced only at the PC breakpoint.
- **Mobile behavior**: the layout remains one column below 1440px; grids and the hero collapse at their existing responsive breakpoints.
- **Allowed local overflow**: managed banner tracks only, clipped by their banner viewports.
- **Prohibited**: fixed-width children in `.home-main-column`, an always-present rail column, or banner tracks escaping their viewport.

### 5.2 Chart AI

- **Root shell**: `.chart-ai-shell`.
- **Width behavior**: shrink-safe grid capped to the route width.
- **Mobile behavior**: `.chart-ai-symbol-row` and `.chart-ai-result-grid` collapse to one column at 640px; descriptive density is reduced at mobile widths.
- **Allowed local overflow**: only a specifically named future chart viewport or capture wrapper.
- **Prohibited**: canvas/SVG intrinsic dimensions determining route width or fixed-width result panels.

### 5.3 Market

- **Root shell**: `.market-dashboard`; intermediate containment includes `.market-dashboard-stage`, `.market-dashboard-panel`, `.market-dashboard-grid`, and `.market-fixture-section`.
- **Width behavior**: each dashboard layer must remain `min-width: 0` and `max-width: 100%`.
- **Mobile behavior**: controls, grids, SVG charts, and summaries collapse or scale within the route shell.
- **Allowed local overflow**: an explicitly named data/table wrapper; expanded charts stay within `.market-card-modal-panel`.
- **Prohibited**: SVG/canvas width escaping its card, or expanded-card geometry based on document width rather than viewport width.

### 5.4 Lab

- **Root shells**: `.lab-landing-shell` for the landing page and `.lab-detail-shell` for detail routes such as `/lab/asset-class-returns` and `/lab/sp500-sectors`.
- **Width behavior**: landing cards and detail content remain shrink-safe and capped to the content boundary.
- **Mobile behavior**: card and related-content grids collapse to one column at narrow widths.
- **Allowed local overflow**: `.lab-matrix-scroll` around `.lab-return-matrix` and summary tables.
- **Prohibited**: placing the matrix's 700px minimum width directly on the route root or removing its scroll wrapper.

### 5.5 Portfolio

- **Root shells**: `.portfolio-mvp` and `.portfolio-dashboard`.
- **Width behavior**: dashboard, panel headers, and action groups must shrink or wrap inside the route boundary.
- **Mobile behavior**: panel headers and forms stack; sheet panels use viewport-relative widths.
- **Allowed local overflow**: `.portfolio-bookmark-tabs`, `.positions-list-wrap`, and explicitly named table wrappers.
- **Prohibited**: wide holdings rows outside `.positions-list-wrap`, fixed sheet widths, or aggregate controls widening the dashboard.

### 5.6 MyPage

- **Root shell**: `.mp-page-layout`; account content: `.mp-sections`; optional admin content: `.mp-admin-rail`.
- **Width behavior**: account content is capped at 680px; the admin-visible two-column layout uses a shrink-safe account track.
- **Mobile behavior**: the admin rail stacks below 1300px; `.mp-sections` is capped to 100% at mobile widths.
- **Allowed local overflow**: only an explicitly named admin data wrapper if one is introduced.
- **Prohibited**: preserving the desktop two-column rail below its safe breakpoint or adding fixed-width form controls.

## 6. Header, Ticker, and Nav Contract

- `.site-header` must compress or wrap safely on mobile; action additions must be tested at the narrowest supported viewport.
- Mobile header controls may reduce gaps, padding, and secondary brand copy, but must retain usable targets.
- `.ticker-belt` may scroll horizontally inside itself. `.ticker-track` intrinsic width must not widen the body.
- `.primary-nav` may scroll horizontally inside itself on mobile.
- `.nav-inner { min-width: max-content; }` is permitted only while `.primary-nav` owns `overflow-x: auto`.
- Sticky positioning on `.primary-nav` must not introduce a wider containing block.
- Header actions, authentication-state buttons, ticker items, and nav links must not create hidden body-level overflow.
- Adding a header, ticker, or nav item requires mobile-width validation and the Phase 3DW guard dry-run policy.

## 7. Advertisement and Iframe Contract

### 7.1 General Rule

- Every ad integration must have an explicit owner wrapper with `width: 100%`, `min-width: 0`, and an appropriate maximum-width boundary.
- Fixed-size partner creative must be capped by its wrapper.
- Injected `ins` and iframe elements must not determine document width.
- Centering a fixed-size child does not count as containment.
- Body overflow hiding must never be the only advertisement fix.

### 7.2 Phase 3DV-HF1-Retry Lesson

The fixed 728x70 footer partner ad injected into `.footer-ad-wrapper` expanded document width and caused right-side mobile blank area. Future fixed-size ad integrations must be contained at the wrapper level and must not rely on body overflow hiding alone.

The current footer contract keeps `.bottom-document-area`, `.bottom-ad-banner`, and `.footer-ad-wrapper` at `width: 100%`, `min-width: 0`, `max-width: 100vw`, with local horizontal containment. Injected `.footer-ad-wrapper > ins` and `.footer-ad-wrapper iframe` content is capped to the wrapper width.

### 7.3 Separate Advertisement Contracts

- **Footer/bottom ad**: fixed 728x70 source creative; wrapper-level containment is mandatory.
- **Top slide ad**: separate 320x140 integration; its fixed overlay and child creative must remain inside the viewport.
- **Home mobile banner**: full-width 720:225 viewport with clipped carousel track and contained images.
- **PC Home rail**: 160px rail creative, enabled only from 1440px and owned by the desktop sidebar column.
- **Future ads/iframes**: require static containment checks plus the Phase 3DW production geometry guard before owner acceptance.

## 8. Dense Data Surface Contract

### 8.1 Local Scroll Ownership

- Portfolio holdings use `.positions-list-wrap` for horizontal overflow.
- Portfolio selector tabs use `.portfolio-bookmark-tabs` for local horizontal scrolling.
- Lab matrices use `.lab-matrix-scroll`; `.lab-return-matrix` may retain its 700px minimum width only inside that wrapper.
- Generic dense tables use `.table-wrap` or another explicitly named local wrapper.
- Market charts and SVG surfaces scale to their card or modal container; any future wide data grid needs its own local wrapper.

### 8.2 Export and Snapshot Surfaces

- Exportable content is identified through `data-exportable-card` and an intentionally scoped capture target.
- Export width may intentionally exceed the mobile viewport only during isolated capture logic such as `.is-exporting-image`.
- Temporary capture overflow must be restored immediately after export.
- Capture behavior must not change normal document/body geometry.
- Chart snapshots, canvases, SVGs, and exported cards must still pass the normal production page geometry checks outside capture mode.

### 8.3 Prohibited Dense-Surface Behavior

- A dense table, matrix, chart, or row must not rely on body scrolling.
- A minimum content width must not be applied to a route root.
- Removing a named scroll wrapper requires an equivalent reviewed containment boundary.

## 9. Modal and Overlay Contract

- Modal and sheet overlays use fixed viewport positioning and must cover, not resize, the route shell.
- The login `.modal-panel` retains viewport-relative sizing such as `min(440px, calc(100vw - 40px))`.
- `.market-card-modal-panel` remains bounded by both `100vw` and `100vh` calculations.
- `.position-sheet-panel` and `.portfolio-sheet-panel` retain viewport-relative widths and heights.
- A modal must not calculate width from an already-inflated document layout.
- Modal content uses internal overflow where needed; it must not widen the overlay or body.
- The public login modal remains part of Phase 3DW geometry coverage at every supported guard viewport.

## 10. Home Banner and PC Rail Contract

- Mobile Home banners are visible through 859px.
- Mobile Home banners are hidden from 860px.
- The PC Home rail is enabled from 1440px.
- PC and mobile slot management remain separate in MyPage administration.
- Banner registration remains URL-only; no file upload UI is added.
- Active slots require valid HTTP(S) image URLs; unchecked slots remain excluded.
- Zero active banners: clear stale content and keep the surface hidden.
- One active banner: show a static banner without starting a carousel.
- Multiple active banners: enable the carousel with the current 5000ms rotation behavior.
- Carousel tracks remain clipped by `.home-mobile-ad-viewport` or `.home-rail-viewport` and respect the existing reduced-motion transition policy.
- Banner storage compatibility and the established PC/mobile persistence behavior remain outside the scope of visual refactors.

## 11. Production Acceptance Policy

Before owner acceptance for any UI, layout, ad, iframe, chart, table, modal, header, ticker, nav, banner, or route-shell change, run:

```bash
npm run check:phase-3dx-ui-architecture-plan
npm run check:mobile-baseline
npm run check:production-domain
npm run guard:production-mobile-geometry
```

The last command is a dry-run unless the explicit production guard variable is present.

After deployment of a public UI change and before production acceptance, run:

```bash
PHASE_3DW_ALLOW_PRODUCTION_GEOMETRY=YES npm run guard:production-mobile-geometry
```

Windows PowerShell:

```powershell
$env:PHASE_3DW_ALLOW_PRODUCTION_GEOMETRY="YES"; npm run guard:production-mobile-geometry; Remove-Item Env:\PHASE_3DW_ALLOW_PRODUCTION_GEOMETRY
```

Acceptance requires all covered routes (`/`, `/chart-ai`, `/market`, `/lab`, `/portfolio`, `/mypage`) and the public login modal state to satisfy the `innerWidth + 2` geometry threshold at 390x844, 412x915, and 430x932.

A failure opens a separate diagnosis/hotfix phase. Do not conceal a failing child solely with body-level overflow suppression.

## 12. Future Phase Checklist

Future Codex UI phases must:

- [ ] Identify every affected route shell and intermediate grid/flex container.
- [ ] Identify dense tables, matrices, charts, canvases, SVGs, or export surfaces.
- [ ] Identify any ad, iframe, `ins`, or external widget involvement.
- [ ] Preserve the viewport meta contract and mobile user zoom.
- [ ] Preserve or add explicit local scroll wrappers for dense content.
- [ ] Preserve the 859px, 860px, and 1440px banner/rail breakpoints.
- [ ] Confirm modal and overlay widths remain viewport-relative.
- [ ] Confirm header, ticker, and nav overflow remains locally owned.
- [ ] Run the architecture, mobile-baseline, domain, and phase-specific static checkers.
- [ ] Run the Phase 3DW guard dry-run.
- [ ] Run the guarded production geometry check after deployment when public UI changed.
- [ ] Record the owner-review route, state, viewport, and interaction scope.
- [ ] Record whether runtime source, deployment, and push occurred.

## 13. Explicit Prohibited Patterns

The following patterns require rejection or redesign:

- A global fixed `min-width` on `html`, `body`, `.site-main`, or another global shell.
- A fixed-width route root or page grid that cannot shrink.
- Uncontained `100vw` usage inside padded or centered ancestors.
- A fixed-size ad, iframe, `ins`, canvas, SVG, or external widget outside a constrained wrapper.
- Body-level overflow hiding used as the only fix for an overflowing child.
- Dense content wider than the viewport without a named local scroll wrapper.
- Modal width based on document width instead of viewport-relative bounds.
- `user-scalable=no`, `maximum-scale=1`, or any other disabling of user zoom.
- Production guards that collect screenshots, page text, cookies, `localStorage`, or `sessionStorage`.
- Raw HTML, request body, or response body capture in production geometry diagnostics.
- A heavy browser dependency added without owner approval.
- UI acceptance based only on static source checks without rendered geometry verification after deployment.

## 14. Recommended Next Phases

Primary recommendation:

```text
Phase 3DY - KIS / FX Live Data Integration Continuation
```

Rationale: the stable shell, containment rules, and geometry acceptance guard now provide a safer foundation for continued live-data integration without mixing architecture work into provider changes.

Alternative when the owner prefers design-system refinement first:

```text
Phase 3DY - UI Component Contract Hardening
```

That alternative should convert the rules in this plan into smaller component-level static contracts before new visual features are added.

## 15. Phase Safety and Change Boundary

- No runtime source files under `src/` were changed.
- No product UI behavior was changed.
- No secrets or environment files were read.
- No Supabase database inspection, SQL, migration, or Storage operation occurred.
- No Vercel environment or project setting was changed.
- No deployment was performed.
- No remote push was performed.
