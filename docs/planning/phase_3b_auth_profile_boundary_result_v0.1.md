# Phase 3B Auth Profile Boundary Result v0.1

## Status And Scope

Status: Phase 3B implementation complete.

Phase 3B implemented the minimal Supabase client/server helper boundary and auth/profile bootstrap foundation for future DB-backed features.

Codex did not call the new profile bootstrap endpoint during validation. Codex did not create users, run SQL, run Supabase CLI, run `psql`, mutate production DB, mutate Vercel environment variables, or deploy.

## Files Changed

- `src/lib/supabase.ts`
- `src/lib/profileBootstrap.ts`
- `src/lib/server/supabaseAdmin.ts`
- `src/pages/api/auth/profile-bootstrap.ts`
- `src/components/Header.astro`
- `src/components/Auth/AuthModal.astro`
- `src/components/Auth/GoogleLogin.astro`
- `src/pages/portfolio.astro`
- `src/scripts/main.js`
- `src/styles/style.css`
- `docs/planning/phase_3b_auth_profile_boundary_result_v0.1.md`
- `docs/planning/planning_changelog.md`

## Browser Supabase Helper Changes

`src/lib/supabase.ts` now exposes browser-safe helper functions:

- `isSupabaseConfigured()`
- `getBrowserSupabaseClient()`
- `getCurrentSession()`

The browser helper reads only public-prefixed Supabase configuration variables. It does not reference the service-role key or provider keys.

The existing global `window.supabase` compatibility path is preserved only when the browser public client is configured.

Missing public configuration produces a generic browser console message without printing environment values.

## Server-Only Helper Boundary

`src/lib/server/supabaseAdmin.ts` is the server-only Supabase boundary for this phase.

It provides:

- A runtime browser guard.
- A lazy service-role admin client factory.
- A public-configured server auth client path for bearer-token validation.
- Generic configuration errors without printing environment values.

The service-role key is read through server runtime environment access, not through a browser helper.

The server-only helper is imported only by the profile bootstrap API endpoint.

## Auth/Profile Bootstrap Endpoint Design

`src/pages/api/auth/profile-bootstrap.ts` adds a POST endpoint.

The endpoint:

- Reads the bearer token from the `Authorization` header.
- Validates the token server-side with Supabase Auth.
- Derives the user identity from the validated Supabase user.
- Does not trust a browser-submitted user ID.
- Uses the production schema's `profiles` columns.
- Upserts only `id`, `email`, and `display_name`.
- Does not accept or write uncontrolled `plan` input.
- Returns a sanitized response with `ok`, `profileReady`, and safe profile fields.
- Returns safe disabled/configuration responses if required server configuration is missing.
- Does not expose service-role errors or database internals to the browser.

Codex did not call this endpoint during validation.

## Auth UI Wiring Summary

`Header.astro` now:

- Uses the browser-safe Supabase helper.
- Guards missing public configuration.
- Syncs login/logout buttons from the current browser session.
- Calls profile bootstrap after a signed-in session is detected.
- Dispatches safe profile readiness events for other shell views.

`AuthModal.astro` now:

- Guards missing public configuration.
- Keeps email/password login and signup behavior.
- Calls profile bootstrap after login/signup returns without an auth error.

`GoogleLogin.astro` now:

- Guards missing public configuration.
- Keeps the existing Google OAuth entry point.

No access tokens, user emails, or secret values are logged.

## Portfolio Readiness Behavior

`/portfolio` now shows a readiness placeholder with these states:

- Checking login status.
- Login unavailable when Supabase public configuration is missing.
- Login required when signed out.
- Profile setup pending.
- Profile ready while Portfolio MVP remains not implemented.
- Profile setup failed.

Portfolio CRUD is not implemented. No portfolio or position rows are created.

## Explicit Non-Goals

- No Portfolio CRUD.
- No Chart AI provider call.
- No ad-event server route.
- No provider ingestion.
- No Vercel environment variable mutation.
- No deployment.
- No production DB write performed by Codex validation.
- No Supabase schema mutation.
- No Auth user creation.

## Service-Role Exposure Prevention Summary

- The service-role variable marker appears only in the server-only helper source.
- The server-only helper is imported only by the Astro API endpoint.
- Generated browser/static assets do not contain service-role markers or the server-only helper name.
- Browser code uses only the public Supabase client path.
- The profile bootstrap endpoint validates identity server-side and does not accept user IDs from the browser.

## Validation Results

| Check | Result |
|---|---|
| `npm run build` | Pass |
| `.vercel/output/config.json` generated | Pass |
| `.vercel/output/functions/_render.func` generated | Pass |
| `.vercel/output/static` generated | Pass |
| Product source/generated secret marker scan | Expected server-only source occurrence for the service-role variable marker only; no browser/static occurrence found. |
| Service-role exposure scan | Expected server-only source occurrence only; no generated browser/static service-role marker found. |
| Browser/static server-only marker scan | Pass |
| Disposable identifier scan | Pass for product source and generated output. |
| Removed legacy route scan | Pass |
| Broad crypto scope scan | No broad crypto feature added; existing not-supported copy and asset-class Bitcoin context remain. |
| Ignored-file coverage | Pass |
| Final `git status --short` before commit | Intended Phase 3B implementation and documentation files only. |

## Remaining Risks

- Runtime profile bootstrap against production remains untested by Codex because Phase 3B validation intentionally avoided production writes.
- The server-only helper now depends on the future presence of the service-role variable in the server runtime.
- Browser auth still uses Supabase's normal client-side session storage behavior.
- Vercel environment value provenance remains owner-managed and was not inspected by Codex.
- Usage-function runtime testing remains pending for a later Chart AI/server route phase.

## Recommended Next Implementation Phase

Proceed to Phase 3C: Portfolio MVP integration.

Next options:

- Option A: Proceed to Phase 3C Portfolio MVP integration.
- Option B: Run a manual browser smoke check with a non-production or owner-approved account first.
- Option C: Run Advisor/security follow-up before adding more DB-backed writes.

## Final Statement

Phase 3B implemented the Supabase auth/profile boundary foundation and authorizes no production DB mutation by Codex validation, no environment variable mutation, no deployment, and no unrelated feature implementation.
