# Phase 3C.8 Header Logo Banner Feasibility Result v0.1

Date: 2026-06-19

## Status And Scope

Status: implementation and local validation completed.

Phase 3C.8 applied a narrow final header polish and produced a report-only Home vertical banner feasibility plan. The work stayed inside header auth-label behavior, header logo display size, layout analysis, and planning documentation.

## Files Changed

- `src/components/Header.astro`
- `src/pages/portfolio.astro`
- `src/styles/style.css`
- `docs/planning/planning_changelog.md`
- `docs/planning/phase_3c1_portfolio_manual_smoke_checklist_v0.1.md`
- `docs/planning/phase_3c8_header_logo_banner_feasibility_result_v0.1.md`

## Owner Phase 3C.7 Smoke Feedback Summary

- Signed-out and signed-in header labels stayed correct during most navigation.
- Owner still observed a brief visible checking state during ordinary signed-in menu navigation.
- Portfolio lock UI, bottom-sheet motion, refresh icon, Chart AI prefill, Portfolio CRUD, sign-out hiding, re-login reload, console safety, and cleanup passed owner smoke.
- The local tracked project logo was applied but should appear slightly larger.
- Owner requested a Home vertical rolling banner feasibility report before providing sample banner images.

## Header Auth-Label Final Removal Summary

- Removed the header's user-visible `checking` state from the auth UI state contract.
- Removed the branch that disabled the auth button during checking.
- Header ordinary navigation now keeps only:
  - signed out: `로그인`
  - signed in: `로그아웃`
  - unavailable public config: `설정 필요`
- Kept the existing non-secret local UI hint limited to coarse `signed_in` or `signed_out`.
- Did not store tokens, emails, user IDs, raw session objects, project identifiers, or provider credentials.
- Removed Portfolio's listener response to header `checking` events so the header no longer drives Portfolio back into a checking display during ordinary navigation.

## Header Logo Size Polish Summary

- Preserved `public/logo.svg` as the top-left project logo.
- Increased the displayed logo from 42px to 48px.
- Kept the header height at 72px.
- Kept the brand text, subtitle, alignment, and SVG object-fit behavior.
- No logo, icon, image, or font file was downloaded or generated.

## Home Vertical Banner Feasibility Report

### Current Layout Findings

- `body` has `min-width: 1080px`, so the current app is PC-first.
- `.site-main`, `.nav-inner`, and slide ad content use `max-width: 1240px` with centered layout.
- `.site-main` has 20px horizontal inner padding, so the outer content frame is still 1240px while usable inner content is about 1200px.
- The Home hero is a two-column grid with a 24px gap and a right market panel.
- Adding a banner inside the Home content grid would squeeze the hero and cards, so a future rail should live outside the main content frame.
- The existing ticker/header/nav can remain unchanged if the rail is fixed to the viewport side and hidden when side gutter space is insufficient.

### Desktop Viewport Analysis

Assumption: side gutter is `(viewport width - 1240px) / 2` when the viewport is wider than the 1240px content frame.

| Viewport | Side Gutter | 160px Rail + 24px Gap | 180px Rail + 24px Gap | 200px Rail + 24px Gap | 240px Rail + 24px Gap | Recommendation |
|---:|---:|---:|---:|---:|---:|---|
| 1366px | 63px | Does not fit | Does not fit | Does not fit | Does not fit | Hide banner |
| 1440px | 100px | Does not fit | Does not fit | Does not fit | Does not fit | Hide banner |
| 1536px | 148px | Too tight | Does not fit | Does not fit | Does not fit | Hide banner |
| 1920px | 340px | Fits comfortably | Fits comfortably | Fits comfortably | Fits comfortably | Show banner |

### Left Rail Feasibility

Left rail is technically possible only on wide desktop screens, but it competes with the brand/header reading flow and primary navigation scanning. It is also more likely to feel like page chrome because the eye starts at the left edge and moves into Home content.

Result: feasible at wide widths, but not recommended for the first implementation.

### Right Rail Feasibility

Right rail fits the current layout better because Home already has a right-side market panel inside the hero, and an outside right rail can remain visually secondary without pulling attention away from the brand and navigation. It also avoids interfering with the left-start reading path.

Result: recommended for the first implementation, desktop-only, hidden below the safe gutter threshold.

### Recommended Placement

Use a right-side fixed Home-only rail in a future implementation. Do not reserve empty space when no active banner exists.

Recommended visibility rule:

- Hide below `1660px`.
- Show a 160px-wide rail at `min-width: 1660px`.
- Optionally allow a 200px-wide rail at `min-width: 1720px` or wider after visual smoke.
- Always hide on tablet/mobile and any viewport where the side gutter is insufficient.

### Recommended Banner Dimensions

Primary owner-created image size:

- `160x600`

Optional larger owner-created image size for wide desktops:

- `200x600`

Rationale:

- `160x600` is the only listed candidate that can fit near the current content frame with a practical desktop threshold.
- `180x600` and `200x600` require wider screens and are reasonable only if the first implementation includes responsive width selection.
- `240x600` fits well at 1920px but would force the feature to appear only on very wide screens, so it is not recommended as the primary sample size.

### Future File Path Recommendation

For a later implementation phase:

- Banner images: `public/ads/home-rail/`
- Banner data: `src/data/homeAdBanners.json`

Do not add these files until the banner implementation phase.

### Future JSON Schema Recommendation

```json
[
  {
    "id": "home-rail-example",
    "imageSrc": "/ads/home-rail/example-160x600.png",
    "alt": "Banner description",
    "href": "https://example.com",
    "isActive": true,
    "displayOrder": 1
  }
]
```

### Future Rolling Behavior Recommendation

- Zero active banners: render no banner rail and reserve no rail space.
- One active banner: render a static image with no motion.
- Two or more active banners: rotate every 5 seconds with a left-slide transition.
- Outbound links should open in a new tab with `rel="noopener noreferrer sponsored"` or the final product-approved equivalent.
- Respect `prefers-reduced-motion: reduce` by disabling slide motion and using a no-motion swap.
- Keep the first implementation Home-only.

### Assumptions And Open Questions

- Assumption: the future rail should not alter `.site-main` width or push the Home content.
- Assumption: owner-created samples can be produced at `160x600` first.
- Open question for owner: should the first sample also include a `200x600` version for wide desktop testing? Recommendation: start with `160x600`; add `200x600` only after the first Home-only rail smoke passes.

## Banner Implementation Status

The Home vertical banner was not implemented in product UI. No banner component, carousel, banner image, outbound ad link behavior, ad-event route, or banner data file was added.

## Auth Label Stability Preservation

- Signed-out ordinary navigation remains `로그인`.
- Signed-in ordinary navigation remains `로그아웃`.
- The header no longer has a user-visible checking branch.
- Supabase session resolution logic remains in place.
- Explicit logout still immediately switches to signed-out UI and clears the coarse UI hint.

## Chart AI Prefill Preservation

- Position/security links to `/chart-ai?symbol=...&name=...&market=...` remain preserved.
- Chart AI selected-security prefill remains skeleton-only.
- No provider call, AI execution, market data fetch, authenticated call, or usage guard was added.

## Portfolio Behavior Preservation

- Portfolio and position CRUD UI paths remain preserved.
- Signed-out lock UI remains the clear `🔐` visual.
- Position add/edit bottom-sheet motion remains preserved.
- Portfolio refresh icon remains preserved.
- Logo/fallback avatar, country badge, order controls, sorting controls, compact money display, Korean UI, and Pretendard remain preserved.
- Desktop vertical banner remains planning/backlog only.

## Service-Role Boundary Preservation

- No service-role key was moved into browser code.
- No server-only helper was intentionally imported into client-executed scripts.
- No Supabase connection, SQL command, Supabase CLI command, `psql`, or DB command was run by Codex.

## Explicit Non-Goals

- No production write validation by Codex.
- No Portfolio production write calls by Codex.
- No DB mutation.
- No Auth user creation.
- No Vercel environment mutation.
- No deployment.
- No provider integration.
- No Chart AI provider call.
- No Chart AI usage guard implementation.
- No ad-event route.
- No banner implementation.
- No banner asset addition.
- No outbound ad link implementation.
- No FX conversion.
- No valuation analytics.
- No performance analytics.
- No provider autocomplete.
- No logo scraping.
- No external asset download.

## Provider Credential Status Note

KIS REST API APP KEY, KIS REST API APP Secret, and OpenDART API KEY have been issued for future phases. No actual values were requested, read, printed, summarized, or recorded.

## Validation Results

- Normal `npm run build` passed.
- `.vercel/output/config.json`, `.vercel/output/functions/_render.func`, and `.vercel/output/static` were generated.
- Local unauthenticated HTTP smoke returned 200 for the required active routes.
- Removed legacy routes returned 404.
- Header source no longer contains a `checking` auth UI state branch.
- Generated header static output no longer contains a `checking` auth UI state branch.
- `public/logo.svg` remains used and is displayed at 48px.
- No Home vertical banner implementation or banner data file was added.
- No requested provider secret values were printed or recorded.
- Expected Supabase env-name references remain limited to source helper files.
- Generated static browser assets did not contain service-role marker names.
- Disposable validation identifiers remained docs-only or validation-SQL-only.
- Removed legacy route strings remained absent from product source and generated output.
- Broad crypto scope remained limited to the approved asset-class returns context and standard library internals.
- Logo scraping, remote logo discovery, crawler, and external asset download code were not added.
- Chart AI remained a prefill skeleton with no provider execution.
- Ignored-file coverage was confirmed for `.env*`, `.vercel`, `.vercel/output`, `dist`, `dist/`, `.astro`, `.omc`, key files, certificate files, credential files, and service-account JSON files.
- The in-app browser connector was unavailable, so browser visual validation remains owner-smoke-only.

## Updated Owner Manual Smoke Steps

Use the Phase 3C.8 section in `docs/planning/phase_3c1_portfolio_manual_smoke_checklist_v0.1.md`. Do not include credentials, tokens, keys, project references, environment values, secret query strings, or screenshots containing secrets.

## Remaining Risks

- Owner visual smoke is required to confirm that signed-in navigation no longer flashes a visible checking label in the actual browser session.
- The banner sizing report is based on CSS layout inspection and HTTP smoke, not an implemented banner prototype.
- A later banner implementation should start Home-only and must not reserve empty rail space when no active banner exists.

## Recommended Next Action

Run the Phase 3C.8 owner manual smoke. If the header auth-label issue passes, proceed to the next planned integration phase or a separate Home rail implementation planning phase when owner banner images are ready.
