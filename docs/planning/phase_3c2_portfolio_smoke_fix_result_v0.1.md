# Phase 3C.2 Portfolio Smoke Fix Result v0.1

## Status And Scope

Status: Phase 3C.2 implementation complete pending owner manual smoke rerun.

Phase 3C.2 fixed the local Portfolio smoke blocker state classification, restored the auth/profile readiness separation, and updated the login/signup modal toward the intended Korean product UI.

Codex did not connect to Supabase, did not run SQL, did not run Supabase CLI, did not run `psql`, did not mutate production DB, did not create Auth users, did not call authenticated Portfolio write endpoints, did not mutate Vercel environment variables, and did not deploy.

## Files Changed

- `src/lib/server/supabaseAdmin.ts`
- `src/lib/profileBootstrap.ts`
- `src/lib/portfolioClient.ts`
- `src/lib/supabase.ts`
- `src/lib/server/portfolio.ts`
- `src/pages/api/auth/profile-bootstrap.ts`
- `src/components/Header.astro`
- `src/components/Auth/AuthModal.astro`
- `src/components/Auth/GoogleLogin.astro`
- `src/pages/portfolio.astro`
- `src/styles/style.css`
- `docs/planning/phase_3c1_portfolio_manual_smoke_checklist_v0.1.md`
- `docs/planning/phase_3c2_portfolio_smoke_fix_result_v0.1.md`
- `docs/planning/planning_changelog.md`

## Smoke Blocker Summary

Owner manual local smoke found that login succeeded, the modal closed, the header auth state updated, and `/portfolio` opened, but the Portfolio page showed:

- `Portfolio API unavailable`
- `Supabase configuration is not available in this runtime. No portfolio data was loaded.`
- Login as unavailable
- Profile as not ready
- Portfolio API as unavailable

No secret, token, or raw error exposure was observed by the owner.

## Root Cause Analysis

Two issues overlapped:

1. The server-only Supabase helper read the service-role category only from `process.env`. In Astro local runtime, non-public server environment categories may be available through server-side `import.meta.env`, while Vercel runtime uses `process.env`. This caused local server configuration detection to report the service-role category as missing even when the owner had local runtime setup.
2. The Portfolio page collapsed missing public login config, profile bootstrap 503, and Portfolio API 503 into one disabled UI state. That made an already signed-in user appear as Login unavailable and Profile not ready.

## Portfolio API Unavailable Fix Summary

- Updated the server-only Supabase helper to support both Vercel `process.env` and Astro server-side `import.meta.env` lookup for the service-role category.
- Kept the helper inside server-only modules and Astro API routes.
- Preserved the browser runtime guard that throws if the server-only helper runs in the browser.
- Changed Portfolio API unavailable messaging to a sanitized Korean product string.

## Profile Readiness Fix Summary

- Split profile bootstrap statuses into public config missing, server config missing, signed out, pending, ready, and failed.
- Updated `/portfolio` to render separate login, profile, and Portfolio API state rows.
- Prevented server-side profile or Portfolio API configuration failures from being displayed as browser login unavailable.
- Preserved profile bootstrap through a server-validated bearer token.

## Login/Signup UI Regression Fix Summary

- Updated header login/logout labels to Korean.
- Updated the modal title, labels, divider, buttons, and validation text to Korean.
- Preserved Google OAuth, email/password login, and signup switching.
- Added inline validation messaging instead of relying only on browser alerts.
- Kept password values out of logs and docs.

## Korean UI Changes Summary

Korean product UI strings were added only where user-facing auth/profile/Portfolio readiness messages appear. Agent progress notes, documentation prose, commit messages, and final reports remain English-only except literal product UI strings.

## Signup Nickname And Password Confirmation Validation Summary

- Added a signup-only nickname field.
- Added a signup-only password confirmation field.
- Signup blocks submission if nickname, email, password, or password confirmation is empty.
- Signup blocks submission if password and confirmation do not match.
- Signup passes nickname as safe auth metadata for later profile display-name bootstrap.
- Password confirmation is kept only in browser form state.

## Service-Role Boundary Preservation Summary

- The service-role category remains referenced only by server-only helper code.
- Browser code still imports only browser-safe helpers.
- Portfolio API routes still derive the user from a server-validated bearer token.
- Portfolio API routes still do not trust browser-submitted `user_id`.
- Portfolio and position operations remain scoped to the validated user ID.
- API error responses remain sanitized.

## Explicit Non-Goals

- No production write validation by Codex.
- No Portfolio production write calls by Codex.
- No DB mutation.
- No Auth user creation.
- No Vercel env mutation.
- No deployment.
- No provider integration.
- No Chart AI implementation.
- No ad-event route.
- No desktop left-side banner implementation.
- No valuation analytics.
- No performance analytics.

## Provider Credential Status Note

The owner reported that the Korea Investment Securities REST API APP KEY, Korea Investment Securities REST API APP Secret, and OpenDART API KEY have been issued.

No actual values were requested, read, printed, stored, committed, or added to environment files in Phase 3C.2.

Future KIS/OpenDART phases must include a secret-safe `.env` and deployment environment registration process before provider integration work begins.

## Desktop Left-Side Rotating Ad Banner Backlog

Backlog only. Not implemented in Phase 3C.2.

- Desktop PC home/content layout should include a left-side vertical image ad banner area.
- Each banner should support outbound links.
- Multiple active banners should be registerable.
- If two or more banners exist, the banner area should rotate every 5 seconds.
- Outbound links should open safely in a new tab.
- Mobile and tablet behavior should be designed later.
- No ad-event route or database change was added in Phase 3C.2.

## Validation Results

| Check | Result |
|---|---|
| `npm run build` | Pass |
| Vercel output generation | Pass; `.vercel/output/config.json`, `.vercel/output/functions/_render.func`, and `.vercel/output/static` exist. |
| Local HTTP smoke without authenticated writes | Pass; `/` and `/portfolio` returned 200, unauthenticated Portfolio API GET requests returned 401, and same-origin unauthenticated profile bootstrap returned sanitized 401. |
| Login/signup markup check | Pass; Korean login/signup text, Google Korean text, nickname field, password confirmation field, and generated password mismatch validation string are present. |
| Product source/generated secret marker scan | Expected server-only source occurrence for the service-role variable marker only. |
| Service-role exposure scan | Expected server-only source occurrences only. |
| Browser/static server-only marker scan | Pass; no service-role or server-only helper marker found in generated browser/static assets. |
| Disposable identifier scan | Product source and generated output pass; matches are limited to existing planning docs. |
| Removed legacy route scan | Pass |
| Broad crypto scope scan | No broad crypto feature added; existing not-supported copy and asset-class Bitcoin context remain. |
| Ignored-file coverage | Pass for `.env*`, `.vercel`, `dist`, `.astro`, `.omc`, representative credentials, certificates, and key files. |

## Updated Manual Smoke Checklist Deltas

Repeat the failed manual path:

1. Sign in with the owner-approved test account.
2. Confirm the header signed-in state.
3. Open `/portfolio`.
4. Confirm Login status is signed in, not unavailable.
5. Confirm Profile state is ready or a precise sanitized server-configuration message.
6. Confirm Portfolio API state is available if server-side service-role runtime configuration exists.
7. If available, create/edit/delete one disposable portfolio and one disposable position.
8. Confirm no token, secret, raw DB error, or stack trace appears.
9. Confirm login/signup UI is Korean.
10. Confirm signup nickname field exists.
11. Confirm signup password confirmation field exists.
12. Confirm password mismatch validation works.

Report only non-secret pass/fail results.

## Remaining Risks

- Owner manual authenticated Portfolio write smoke remains pending after this fix.
- Runtime success still depends on correct public and server-side Supabase environment categories being configured for the selected app target.
- Browser auth still uses Supabase's normal client-side session storage behavior.
- Provider credentials are issued but intentionally not integrated or registered by Codex in this phase.

## Recommended Next Action

Recommended owner action: rerun the focused Phase 3C.2 manual smoke path and report only non-secret pass/fail results.

Next options:

- Option A: Rerun focused owner manual Portfolio smoke and report non-secret pass/fail.
- Option B: If smoke passes, proceed to Phase 3D Chart AI usage guard and server-only execution skeleton.
- Option C: If smoke fails, prepare a focused Phase 3C.3 smoke fix packet using non-secret failure details.
