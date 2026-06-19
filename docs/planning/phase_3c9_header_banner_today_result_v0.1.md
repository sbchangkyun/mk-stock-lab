# Phase 3C.9 Header Banner Today Result v0.1

Date: 2026-06-19

## Status And Scope

Status: implementation and local validation completed.

Phase 3C.9 applied a narrow visible UI pass for the remaining owner smoke feedback. The work stayed inside header auth flicker stabilization, header logo inner-mark polish, a Home-only right rail with local sample banners, a display-only Today placeholder, and planning documentation.

## Files Changed

- `src/layouts/Layout.astro`
- `src/components/Header.astro`
- `src/components/HomeRailAd.astro`
- `src/pages/index.astro`
- `src/styles/style.css`
- `src/data/homeAdBanners.json`
- `public/ads/home-rail/home-rail-sample-01.svg`
- `public/ads/home-rail/home-rail-sample-02.svg`
- `docs/planning/planning_changelog.md`
- `docs/planning/phase_3c1_portfolio_manual_smoke_checklist_v0.1.md`
- `docs/planning/phase_3c9_header_banner_today_result_v0.1.md`

## Owner Phase 3C.8 Smoke Feedback Summary

- Visible `확인 중` no longer appeared.
- Signed-out and signed-in labels were mostly stable.
- Remaining failure: after login, ordinary menu navigation briefly showed `로그인` before returning to `로그아웃`.
- Header logo size/alignment still failed because enlarging the whole logo box was not the desired treatment.
- Portfolio lock UI, bottom-sheet motion, Portfolio refresh icon, Chart AI prefill, and console safety passed.
- Owner requested a real Home right rail sample banner implementation and a display-only `Today: 000` header placeholder.

## Header Signed-In `로그인` Flash Final Fix Summary

- Added an early inline head script that reads only the coarse non-secret auth UI hint from `localStorage`.
- The script applies `auth-hint-signed-in` or `auth-hint-signed-out` to the document before the header is rendered.
- CSS uses the signed-in document class to hide `로그인` and show `로그아웃` even before the full Supabase session check completes.
- The regular header auth script still resolves the real Supabase session afterward and corrects state if needed.
- The stored hint remains limited to `signed_in` or `signed_out`.
- No token, refresh token, email, user ID, raw session object, project identifier, or provider credential is stored.
- Explicit logout still immediately writes the signed-out hint and shows `로그인`.

## Header Logo Inner-Mark Polish Summary

- Preserved `public/logo.svg`.
- Inspected the SVG and found it is a traced path asset without a clean separate MK group to transform safely.
- Replaced the whole-box enlargement with a 42px clipped logo frame.
- Rendered the SVG at 48px and scaled it inside the fixed frame so the inner mark appears larger while the header box remains balanced.
- Header height remains 72px.
- No logo, icon, image, or font file was downloaded or generated for the logo.

## Home Right Rail Banner Implementation Summary

- Added a Home-only `HomeRailAd` component.
- Imported it only from `src/pages/index.astro`.
- The rail does not appear on Portfolio, Chart AI, Heatmap, Lab, or other route skeletons.
- The rail is fixed to the right side and does not push, shrink, or reserve space inside `.site-main`.
- The rail is hidden below the configured wide-desktop breakpoint.

## Sample Banner Asset Summary

Added two local generated SVG sample banners:

- `public/ads/home-rail/home-rail-sample-01.svg`
- `public/ads/home-rail/home-rail-sample-02.svg`

Both files are 160x600 local SVGs. They contain no external image references, no embedded remote URL, and no base64 payload.

## Banner Data File Summary

Added:

- `src/data/homeAdBanners.json`

The file contains two active sample banners with:

- `id`
- `imageSrc`
- `alt`
- `href`
- `isActive`
- `displayOrder`

The sample `href` values are `#` placeholders. No outbound ad links were added.

## Banner Behavior Summary

- Zero active banners: the server-rendered component returns no rail.
- One active banner: the rail renders as a static banner with no carousel behavior.
- Two or more active banners: the rail rotates every 5 seconds.
- Rotation uses a left-slide transform between cards.
- Hover pauses the rotation.
- `prefers-reduced-motion: reduce` shortens the slide transition to an instant/no-motion swap.
- No ad-event write logic or analytics was added.

## Visibility Breakpoint Summary

- The rail is hidden by default.
- The rail is visible at `min-width: 1660px`.
- The rail uses a 160px width and a right-side gutter calculation based on the existing 1240px centered content frame.
- The rail does not reserve space when hidden.
- The rail does not alter the Home content frame.

## Today Placeholder Summary

- Added a subtle light-gray `Today: 000` placeholder in the header.
- The placeholder is display-only.
- It does not call any API.
- It does not read or write visitor-count localStorage.
- It does not track sessions, users, IPs, devices, or page views.
- It hides on narrower desktop widths to avoid crowding the header.

## Future Real Today Visitor-Counting Logic

Recommended future design:

- Use Korea Standard Time for the daily date key.
- Browser localStorage stores only a per-day counted flag, such as `today-counted:YYYY-MM-DD`.
- The browser calls a future server API at most once per day per browser.
- The server increments an aggregate daily count through the service-role boundary.
- The MVP counter should store no IP address, User-Agent, email, user ID, or personal data.
- The header reads a future aggregate count endpoint to display the current daily total.
- Known limitation: clearing localStorage, using another browser, or using another device may count the same person more than once.

Real visitor counting was not implemented in Phase 3C.9.

## Auth Label Stability Preservation

- Signed-out ordinary navigation remains `로그인`.
- Signed-in ordinary navigation remains `로그아웃`.
- Visible `확인 중` remains absent from ordinary header auth UI.
- Public config unavailable state remains `설정 필요`.

## Chart AI Prefill Preservation

- Position/security links to `/chart-ai?symbol=...&name=...&market=...` remain preserved.
- Chart AI selected-security prefill remains skeleton-only.
- No provider call, AI execution, market-data fetch, authenticated call, or usage guard was added.

## Portfolio Behavior Preservation

- Portfolio and position CRUD UI paths remain preserved.
- Signed-out lock UI remains the clear `🔐` visual.
- Position add/edit bottom-sheet motion remains preserved.
- Portfolio refresh icon remains preserved.
- Logo/fallback avatar, country badge, order controls, sorting controls, compact money display, Korean UI, and Pretendard remain preserved.

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
- No logo scraping.
- No external asset download.

## Provider Credential Status Note

KIS REST API APP KEY, KIS REST API APP Secret, and OpenDART API KEY have been issued for future phases. No actual values were requested, read, printed, summarized, or recorded.

## Validation Results

- Normal `npm run build` passed.
- `.vercel/output/config.json`, `.vercel/output/functions/_render.func`, and `.vercel/output/static` were generated.
- Local unauthenticated HTTP smoke returned 200 for the required active routes.
- Removed legacy routes returned 404.
- Header source and generated output include `Today: 000`.
- Header source and generated output include the early coarse auth hint path.
- Header source and generated output contain no visible `확인 중` header auth label.
- `public/logo.svg` remains used.
- Home rail source exists only in the Home route import path.
- The sample SVG banners are local 160x600 assets without external references.
- `src/data/homeAdBanners.json` exists with two active sample banners.
- Banner rotation logic exists for two or more active banners with 5-second interval and reduced-motion handling.
- No visitor-count API, DB, migration, analytics, or real counting implementation was added.
- No ad-event write route or ad tracking was added.
- Expected Supabase env-name references remain limited to source helper files.
- Generated static browser assets did not contain service-role marker names.
- Disposable validation identifiers remained docs-only or validation-SQL-only.
- Removed legacy route strings remained absent from product source and generated output.
- Broad crypto scope remained limited to the approved asset-class returns context and standard library/server internals.
- Logo scraping, remote logo discovery, crawler, and external asset download code were not added.
- Chart AI remained a prefill skeleton with no provider execution.
- Ignored-file coverage was confirmed for `.env*`, `.vercel`, `.vercel/output`, `dist`, `dist/`, `.astro`, `.omc`, key files, certificate files, credential files, and service-account JSON files.
- The in-app browser connector was unavailable, so browser visual validation remains owner-smoke-only.

## Updated Owner Manual Smoke Steps

Use the Phase 3C.9 section in `docs/planning/phase_3c1_portfolio_manual_smoke_checklist_v0.1.md`. Do not include credentials, tokens, keys, project references, environment values, secret query strings, or screenshots containing secrets.

## Remaining Risks

- Owner visual smoke is required to confirm the signed-in navigation no longer flashes `로그인` in the actual browser session.
- Owner visual smoke is required to confirm the clipped/scaled logo treatment matches the expected inner-mark polish.
- Home rail visibility can only be observed on sufficiently wide desktop viewports, roughly 1660px or wider.

## Recommended Next Action

Run the Phase 3C.9 owner manual smoke. If it passes, proceed to the next planned integration phase; if banner visual polish fails, handle it as a narrow sample-rail polish phase.
