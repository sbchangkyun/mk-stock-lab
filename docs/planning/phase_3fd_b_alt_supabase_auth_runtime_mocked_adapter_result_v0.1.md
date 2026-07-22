# Phase 3FD-B-ALT — Supabase Auth Runtime Mocked Adapter First Result

## 1. Status

Implemented. This phase implements a mocked Supabase Auth runtime adapter only. No real Supabase
call was made, no real Supabase client was created, no environment variable value was read, no
route source file was changed, no UI source file was changed, no package was installed, no
dependency was changed, no real database was implemented, no live KIS call was made, and no deploy
or push occurred.

## 2. Background

Phase 3FD-A prepared the approval and setup package for a future real Supabase Auth runtime, but
implemented no code. The owner explicitly directed this phase — Phase 3FD-B-ALT — to implement a
mocked adapter first, proving the future runtime's shape against deterministic mocked fixtures
before any real Supabase connectivity is approved. Real Supabase runtime implementation, route
integration, and database work all remain blocked pending future owner approval.

## 3. Implemented Scope

- `similaritySupabaseAuthRuntimeAdapterTypes.ts` — the type contract for the mocked adapter
  (status, source, policy, mocked user/session shapes, input, subject, result, and the safe
  subject seed shape).
- `similaritySupabaseAuthRuntimeAdapter.ts` — the adapter module implementing the default and
  mocked policy builders, input normalization, mocked session resolution, mapping to the Phase
  3FC-C auth subject seed contract, and a safety assertion.
- `mockedSimilaritySupabaseAuthRuntimeAdapterFixtures.ts` — eight deterministic mocked fixtures
  covering missing/invalid/expired/malformed/valid-email/valid-oauth/client-role-claim/redaction-
  test session states.
- `index.ts` — updated to export the new types, functions, and fixtures, without removing or
  renaming any existing export.
- `scripts/smoke_phase_3fd_b_alt_supabase_auth_runtime_mocked_adapter_first.mjs` — a focused smoke
  covering all required test cases.
- `scripts/check_phase_3fd_b_alt_supabase_auth_runtime_mocked_adapter_first_contract.mjs` — a
  static contract checker.
- This contract doc and the result doc.
- A `planning_changelog.md` entry.
- Two new `package.json` script lines (smoke and check).

## 4. Adapter Contract Result

- Default policy: `enabled: false`, `allowMockedSession: false`, every real-capability flag
  `false`; always resolves to `disabled`/anonymous.
- Mocked policy: `enabled: true`, `allowMockedSession: true`, every real-capability flag still
  `false`.
- Session states: `missing` → `missing_session`, `invalid` → `invalid_session`, `expired` →
  `expired_session`, `malformed` → `malformed_session`, `valid` (with a safe user reference) →
  `mocked_resolved`/authenticated.
- A client-claimed role is always ignored; its presence only produces the safe warning
  `client_role_claim_ignored`, and the role seed never escalates beyond `authenticated`.
- Redaction: the result and the safety assertion together guarantee no access/refresh token, no
  JWT, no raw session or user object, no real email-address-shaped value, no cookie/header/env
  value, no service role key, and no KIS/account/trading/balance data ever appears in the result.

## 5. Smoke Result

`npm run smoke:phase-3fd-b-alt-supabase-auth-runtime-mocked-adapter-first` — 95/95 assertions
passed. The smoke covers: default disabled policy; missing/invalid/expired/malformed session
handling; valid email and valid OAuth mocked session resolution; client-claimed role ignoring;
mapping to the Phase 3FC-C auth subject seed contract; and runtime safety (no `fetch` call, no
`@supabase` import, no `process.env`/`import.meta.env` access, no cookie/header parsing, no KIS
provider or route import, in both the bundled output and the on-disk source files).

## 6. Boundary Preservation

- `src/pages/api/chart-ai/similarity.ts` is unchanged and still has exactly 3 dispatch branches.
- `src/pages/chart-ai.astro` is unchanged and still contains `chartAiOwnerLocalAuthUsageBridgePanel`.
- No `@supabase/*` package is imported anywhere in the new adapter source.
- No real Supabase client is created.
- No environment variable value is read.
- No cookie or request header is read.
- No real database, SQL, or migration file was created.
- No live KIS call was made.
- No dependency entry or lockfile was modified.

## 7. Validation

- New checker: `npm run check:phase-3fd-b-alt-supabase-auth-runtime-mocked-adapter-first` passed.
- New smoke: `npm run smoke:phase-3fd-b-alt-supabase-auth-runtime-mocked-adapter-first` passed
  (95/95).
- Full regression suite (Phase 3FC-J through Phase 3FB-A, excluding the intentionally superseded
  Phase 3FC-G checker, with the Phase 3FB-C-ALT checker excluded per its known non-gating stale
  assertion) passed.
- `npm run build` passed.
- `git diff --check` reported no whitespace errors.
- The forbidden-path diff (route, `/chart-ai`, providers, chart similarity engine/data, lockfiles)
  was empty.
- The runtime-source diff outside the allowed adapter files was empty.
- The changed-files diff matched exactly the 10 allowed files for this phase.

## 8. Implementation Implication

The mocked adapter proves the future real Supabase Auth runtime adapter's shape end to end: policy
defaults, session state handling, subject mapping, client-claimed-role rejection, and redaction. A
future real implementation can reuse this exact contract, swapping only the mocked session source
for a real Supabase session, still behind the same disabled-by-default policy. Real Supabase client
creation, real environment variable reads, real cookie/header parsing, real JWT verification, route
integration, route success, and role/usage database persistence all remain blocked pending future
owner approval.

## 9. Recommended Next Phase

Recommended: **Phase 3FD-B — Real Supabase Auth Subject Resolver Implementation, Disabled by
Default**. Alternative: **Phase 3FD-C-PLAN — Role Assignment and Usage Store Schema/Migration
Approval Package, No Runtime Change**. Hold alternative: **Phase 3FC-K — Owner Manual QA Findings
Incorporation, No Runtime Change**.
