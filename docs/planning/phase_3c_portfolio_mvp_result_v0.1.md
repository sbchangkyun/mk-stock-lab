# Phase 3C Portfolio MVP Result v0.1

## Status And Scope

Status: Phase 3C implementation complete.

Phase 3C implemented a minimal Portfolio MVP on top of the Phase 3B auth/profile boundary.

Codex did not call Portfolio write endpoints during validation. Codex did not create users, run SQL, run Supabase CLI, run `psql`, mutate production DB, mutate Vercel environment variables, or deploy.

## Files Changed

- `src/lib/server/portfolio.ts`
- `src/pages/api/portfolio/portfolios.ts`
- `src/pages/api/portfolio/positions.ts`
- `src/lib/portfolioClient.ts`
- `src/pages/portfolio.astro`
- `src/styles/style.css`
- `docs/planning/phase_3c_portfolio_mvp_result_v0.1.md`
- `docs/planning/planning_changelog.md`

## Portfolio API Endpoints Added

`src/pages/api/portfolio/portfolios.ts`:

- `GET`: list portfolios owned by the authenticated user.
- `POST`: create a portfolio owned by the authenticated user.
- `PATCH`: update safe editable portfolio fields for an owned portfolio.
- `DELETE`: delete an owned portfolio. Child positions are handled by the existing schema `on delete cascade`.

`src/pages/api/portfolio/positions.ts`:

- `GET`: list positions for an owned portfolio.
- `POST`: create a position inside an owned portfolio.
- `PATCH`: update safe editable fields for a position inside an owned portfolio.
- `DELETE`: delete a position inside an owned portfolio.

Unsupported methods return `405`.

## Auth And Session Validation Approach

The Portfolio API reuses the Phase 3B server-only auth boundary.

Each request must include a bearer token from the current Supabase browser session. The server validates that token through Supabase Auth and derives the user ID from the validated user object.

The API never accepts or trusts browser-submitted `user_id`.

Unauthenticated requests return a sanitized `401`.

## Ownership Enforcement Approach

The API uses the service-role admin client inside server-only API code, so every query explicitly scopes resources to the validated user ID.

Portfolio operations filter by:

- `portfolios.id`
- `portfolios.user_id = validated user id`

Position operations first verify that the target `portfolio_id` belongs to the validated user. Updates and deletes also verify the existing position and then constrain the final write by the owned portfolio ID.

Non-owned portfolio or position access returns a sanitized not-found response rather than disclosing another user's row existence.

## Service-Role Boundary Summary

Service-role usage remains isolated to server-only modules and Astro API endpoints.

Browser code imports only browser-safe helpers:

- `src/lib/supabase.ts`
- `src/lib/profileBootstrap.ts`
- `src/lib/portfolioClient.ts`

Browser/static output scan found no service-role marker or server-only helper marker.

## Portfolio UI Changes

`/portfolio` now includes:

- Login/profile readiness state.
- Portfolio API availability state.
- Portfolio list.
- Create/update/delete portfolio form and controls.
- Selected portfolio detail area.
- Position list.
- Add/update/delete position form and controls.
- Empty, loading-adjacent, unavailable, and generic error states.

The UI treats symbol fields as plain user input. No market data lookup, valuation, charting, performance analytics, or provider fetch is implemented.

## Explicit Non-Goals

- No Chart AI provider call.
- No ad-event server route.
- No market/provider ingestion.
- No portfolio valuation analytics.
- No portfolio performance analytics.
- No Vercel environment variable mutation.
- No deployment.
- No production DB write performed by Codex validation.
- No Supabase schema migration or mutation.
- No Auth user creation.

## Validation Results

| Check | Result |
|---|---|
| `npm run build` | Pass |
| `.vercel/output/config.json` generated | Pass |
| `.vercel/output/functions/_render.func` generated | Pass |
| `.vercel/output/static` generated | Pass |
| Product source/generated secret marker scan | Expected server-only source occurrence for the service-role variable marker only. |
| Service-role exposure scan | Expected server-only source occurrences only. |
| Browser/static server-only marker scan | Pass |
| Disposable identifier scan | Pass for product source and generated output. |
| Removed legacy route scan | Pass |
| Broad crypto scope scan | No broad crypto feature added; existing not-supported and asset-class Bitcoin context remains. |
| Ignored-file coverage | Pass |
| Local smoke without login/write calls | In-app browser was unavailable; fallback HTTP checks confirmed `/portfolio` returns 200 and unauthenticated Portfolio API GET requests return 401. |

## Manual Smoke Checklist For Owner-Approved Account

Use an owner-approved test account only. Do not share credentials in chat or docs.

1. Open `/`.
2. Open the login modal.
3. Sign in.
4. Confirm profile bootstrap completes without exposing tokens.
5. Open `/portfolio`.
6. Confirm logged-in state and profile readiness.
7. Create one test portfolio.
8. Add one test position.
9. Refresh the page and confirm data still loads.
10. Edit the portfolio.
11. Edit the position.
12. Delete the test position.
13. Delete the test portfolio.
14. Confirm no token, service-role marker, raw DB error, or secret appears in the browser console.
15. Confirm signed-out state hides Portfolio data.
16. Record only non-secret pass/fail results.

## Remaining Risks

- Runtime Portfolio writes against production were not tested by Codex by design.
- Owner-approved manual smoke is still required to verify the full authenticated flow.
- In-app browser smoke was unavailable in this session; only local HTTP smoke was completed.
- Service-role runtime configuration must be available server-side for Portfolio API writes and reads to succeed.
- The UI does not yet include valuation, quote refresh, allocation, performance analytics, or provider-backed symbol validation.
- Browser auth still uses Supabase's normal client-side session storage behavior.

## Recommended Next Implementation Phase

Proceed to Phase 3D: Chart AI usage guard and server-only AI execution skeleton.

Next options:

- Option A: Run owner-approved manual Portfolio smoke before Phase 3D.
- Option B: Proceed to Phase 3D Chart AI usage guard and server-only execution skeleton.
- Option C: Run Advisor/security follow-up before adding more write-heavy behavior.

## Final Statement

Phase 3C implemented the Portfolio MVP API and UI foundation and authorizes no production write validation by Codex, no environment variable mutation, no deployment, and no unrelated provider integration.
