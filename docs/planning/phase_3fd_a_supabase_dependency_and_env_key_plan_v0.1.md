# Phase 3FD-A Supabase Dependency and Environment Key Plan

## 1. Purpose

This document is inventory and planning only. No package is installed, removed, or upgraded in this
phase, no dependency entry or lockfile is modified, no environment variable value is read, and no
environment variable value is printed, inferred, or otherwise output anywhere in this phase.

## 2. Current Dependency Inventory

- `package.json` already lists `@supabase/supabase-js` (currently `^2.101.1`) as a dependency, prior
  to this phase.
- This dependency is already imported elsewhere in the codebase for unrelated, pre-existing features
  (for example, the browser Supabase client in `src/lib/supabase.ts` and server-side usage in
  `src/lib/server/supabaseAdmin.ts` and `src/lib/server/portfolio.ts`). This is a read-only source
  observation, not an env value, and not a claim about what is configured in any environment.
- No package was installed, removed, or upgraded in this phase.
- No `package-lock.json` entry was modified in this phase.
- The Chart Similarity guarded route and its scaffold modules
  (`similarityAuthSubjectResolver.ts`, `similarityRoleAssignmentResolver.ts`,
  `similarityUsageStore.ts`, `similarityFeatureFlagResolver.ts`,
  `similarityGuardedRouteScaffold.ts`) do not import `@supabase/supabase-js` and are unaffected by
  its presence elsewhere in the repository.

The existing dependency's presence does not itself approve real Supabase Auth runtime usage for the
Chart Similarity feature. A future implementation phase still requires the explicit owner approvals
listed in the Phase 3FD-A approval package before wiring `@supabase/supabase-js` into the guarded
route's auth path.

## 3. Candidate Additional Packages

Listed as candidates only. No package should be installed in this phase, and every additional
package requires its own explicit owner approval in a later phase:

- A Supabase SSR/auth-helper package, if a future implementation needs standardized cookie/session
  handling for a server-rendered route.
- No other candidate package is currently identified as necessary.

## 4. Candidate Environment Variable Key Names

Key names only, proposed for a later phase — no value is read, inferred, requested, or printed
anywhere in this document or this phase:

- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — only if a future server-only administrative operation is explicitly
  justified and approved; not required for ordinary user session verification
- `AUTH_RUNTIME_ENABLED`
- `USAGE_STORAGE_ENABLED`
- `CHART_AI_SIMILARITY_BETA_ENABLED`

Note: `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` are the same candidate key names already
referenced by the pre-existing, unrelated `src/lib/supabase.ts` module. This phase does not read,
confirm, or assume any value for either key; it only observes that these key names already appear
in existing source code for a different feature.

`SUPABASE_SERVICE_ROLE_KEY` is marked **high-risk**: it must remain server-only, must never be
exposed to any client bundle, and is not needed for ordinary user session verification unless a
future phase explicitly justifies and approves a specific administrative use.

## 5. Environment Value Handling Policy

- Key names may be documented; values must never be committed to the repository.
- Values must never be printed in logs, documentation, or chat output.
- Values must never be surfaced to the client, except a public anon key intentionally designed for
  browser use if a future phase explicitly approves that exposure.
- Secret keys (for example, a service role key) must remain server-only.
- No value length, prefix, suffix, or hash should ever be recorded in documentation, logs, or chat.

## 6. Future Setup Checklist

- [ ] Owner approves the exact environment variable key names to use.
- [ ] Owner configures the corresponding values outside this repository (for example, in a Vercel
      project environment or a local, gitignored `.env.local`).
- [ ] A future implementation phase reads those values safely, without printing them anywhere.
- [ ] A redaction smoke confirms no value is ever echoed in a route response, log, or test output.
- [ ] No route success is enabled until all remaining gates (role assignment, usage store, feature
      flags, manual QA) are also approved and implemented.
