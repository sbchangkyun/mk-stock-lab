# Phase 3C.10 Home Rail Preview Fix Result v0.1

Date: 2026-06-19

## Status And Scope

Status: implementation and local validation completed.

Phase 3C.10 was a narrow Home rail verification and owner-smoke support pass. It added a Home-only query preview mode, verified route isolation, preserved the production wide-desktop breakpoint, and documented owner smoke steps.

## Files Changed

- `src/pages/index.astro`
- `src/components/HomeRailAd.astro`
- `src/styles/style.css`
- `docs/planning/planning_changelog.md`
- `docs/planning/phase_3c1_portfolio_manual_smoke_checklist_v0.1.md`
- `docs/planning/phase_3c10_home_rail_preview_fix_result_v0.1.md`

## Owner Phase 3C.9 Smoke Feedback Summary

- Header signed-in flicker, signed-out label, hidden checking label, logo inner mark, `Today: 000`, Portfolio lock UI, bottom-sheet motion, Portfolio refresh icon, Chart AI prefill, and console safety passed owner smoke.
- Home right rail visibility could not be verified because the owner viewport was below the normal production threshold.
- Banner rotation was marked failed from owner perspective because the rail was not visible.
- Non-Home route absence was marked failed from owner perspective and needed route-isolation verification.

## Route-Isolation Audit Summary

- `HomeRailAd` is imported only by `src/pages/index.astro`.
- `HomeRailAd` is not imported by `src/layouts/Layout.astro`, `src/components/Header.astro`, `src/components/Nav.astro`, or non-Home route pages.
- Non-Home HTTP preview checks confirmed no rendered `data-home-rail-ad` DOM marker on:
  - `/portfolio?railPreview=1`
  - `/chart-ai?railPreview=1`
  - `/lab?railPreview=1`

## Non-Home Route Isolation Fix Summary

No route-isolation code move was required. The existing import boundary was already Home-only. Phase 3C.10 added validation and documentation to make this clear.

## `railPreview=1` Preview Mode Summary

- Added Home-only `railPreview=1` support through `src/pages/index.astro`.
- `/?railPreview=1` passes a `preview` prop to `HomeRailAd`.
- Preview mode adds a `rail-preview` class and `data-home-rail-preview="true"` to the Home rail.
- Preview mode forces the rail visible below the normal wide-desktop breakpoint.
- Preview mode is query-only and page-local.
- Preview mode is not stored in localStorage or sessionStorage.
- Preview mode has no effect on non-Home routes because the rail component is not rendered there.

## Banner Rotation Verification And Fix Summary

- Preserved the 5-second interval for two or more active banners.
- Preserved left-slide behavior through `translateX(-100%)` style updates.
- Preserved hover pause and resume behavior.
- Preserved `prefers-reduced-motion: reduce` handling.
- Moved shared rail viewport, track, card, and image CSS outside the production breakpoint media query so preview mode has the same carousel layout below 1660px.

## Zero/One/Two-Plus Banner Behavior Preservation

- Zero active banners: no rail DOM is rendered.
- One active banner: static rail, no carousel class or script requirement.
- Two or more active banners: rail has carousel behavior and rotates every 5 seconds.

## Visibility Breakpoint Preservation

- Normal production behavior remains hidden below `1660px`.
- Normal Home without `railPreview=1` still uses the wide-desktop breakpoint.
- `railPreview=1` is the only bypass for below-breakpoint owner testing.

## Owner Preview Smoke Instructions

Use these URLs:

- Home preview: `/?railPreview=1`
- Non-Home preview checks:
  - `/portfolio?railPreview=1`
  - `/chart-ai?railPreview=1`
  - `/lab?railPreview=1`

Expected results:

- `/?railPreview=1`: rail is visible and rotates two sample banners every 5 seconds.
- `/portfolio?railPreview=1`: no rail.
- `/chart-ai?railPreview=1`: no rail.
- `/lab?railPreview=1`: no rail.
- `/` without preview: rail follows the normal wide-desktop breakpoint.

## Preserved Phase 3C.9 Behavior

- Header signed-in state remains `로그아웃` without flashing `로그인`.
- Signed-out state remains `로그인`.
- Visible `확인 중` remains absent.
- `설정 필요` remains the unavailable public-config label.
- Logo inner-mark polish and `Today: 000` are preserved.
- Real visitor counting remains unimplemented.
- Ad-event tracking remains unimplemented.
- Portfolio lock UI, bottom-sheet motion, refresh icon, Chart AI prefill, ordering/sorting, logo/fallback avatar, country badge, compact money display, Pretendard, and Korean UI remain preserved.

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
- No real visitor-count API or DB.
- No ad-event route.
- No analytics.
- No FX conversion.
- No valuation analytics.
- No performance analytics.
- No provider autocomplete.
- No logo or banner scraping.
- No external asset download.

## Provider Credential Status Note

KIS REST API APP KEY, KIS REST API APP Secret, and OpenDART API KEY have been issued for future phases. No actual values were requested, read, printed, summarized, or recorded.

## Validation Results

- Normal `npm run build` passed.
- `.vercel/output/config.json`, `.vercel/output/functions/_render.func`, and `.vercel/output/static` were generated.
- `npm run preview` was attempted, but the installed `@astrojs/vercel` adapter does not support Astro preview mode.
- Local route validation used `npm run dev` on an isolated localhost port because preview mode is unsupported by this adapter.
- Local unauthenticated HTTP smoke returned 200 for required active and preview routes.
- Removed legacy routes returned 404.
- Home route rendered the rail marker.
- `/?railPreview=1` rendered `data-home-rail-preview="true"`.
- Non-Home preview routes did not render the rail marker.
- Two active sample banners remain configured.
- Rotation interval remains 5000ms.
- Left-slide transform, hover pause, and reduced-motion handling remain present.
- Generated static browser assets did not contain service-role marker names.
- Disposable validation identifiers remained docs-only or validation-SQL-only.
- Removed legacy route strings remained absent from product source and generated output.
- Broad crypto scope remained limited to the approved asset-class returns context and standard library/server internals.
- Logo/banner scraping, remote discovery, crawler, and external asset download code were not added.
- Chart AI remained a prefill skeleton with no provider execution.
- No real visitor-count API, DB, migration, analytics, ad-event route, or tracking logic was added.
- Ignored-file coverage was confirmed for `.env*`, `.vercel`, `.vercel/output`, `dist`, `dist/`, `.astro`, `.omc`, key files, certificate files, credential files, and service-account JSON files.

## Updated Owner Manual Smoke Steps

Use the Phase 3C.10 section in `docs/planning/phase_3c1_portfolio_manual_smoke_checklist_v0.1.md`. Do not include credentials, tokens, keys, project references, environment values, secret query strings, or screenshots containing secrets.

## Remaining Risks

- Owner visual smoke is still required to confirm the actual slide motion and hover pause in the target browser.
- The in-app browser backend remained unavailable during Codex validation, so visual verification used HTTP/source/generated-output checks.

## Recommended Next Action

Run the Phase 3C.10 owner smoke using `/?railPreview=1`. If it passes, proceed to the next planned integration phase.
