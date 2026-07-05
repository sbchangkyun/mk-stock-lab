# Phase 3FC-D — Role Assignment Resolver Scaffold Result

## 1. Status

Implemented. A disabled-by-default, server-only role assignment resolver scaffold has been added,
testable only via deterministic mocked fixtures. No real Supabase runtime, no real role database,
no live KIS call, no environment read, and no route/UI integration were introduced in this phase.

## 2. Background

Phase 3FC-C added a Supabase Auth subject resolver scaffold that resolves only an
`anonymous`/`authenticated` role seed. Per the Phase 3FC-B design, `beta`/`owner`/`admin` roles
must come only from an explicit `role_assignments` record, never from the session itself. This
phase implements that next isolated unit: a role assignment resolver scaffold that maps a resolved
auth subject plus mocked role assignment records to a full role, without any real role database.

## 3. Implemented Scope

- `src/lib/server/chartSimilarity/similarityRoleAssignmentResolverTypes.ts` — the type contract
  (role, status, source, subject ref, assignment record, resolver input, policy, and result
  types).
- `src/lib/server/chartSimilarity/similarityRoleAssignmentResolver.ts` — the resolver module:
  `buildDefaultSimilarityRoleAssignmentResolverPolicy`,
  `buildMockedSimilarityRoleAssignmentResolverPolicy`,
  `normalizeSimilarityRoleAssignmentResolverInput`, `resolveSimilarityRoleAssignment`, and
  `assertSimilarityRoleAssignmentResolverResultIsSafe`.
- `src/lib/server/chartSimilarity/mockedSimilarityRoleAssignmentResolverFixtures.ts` — eight
  deterministic, synthetic fixture builders (anonymous, authenticated-no-assignment, beta, owner,
  admin, inactive-assignment-ignored, multiple-assignments-ignored, and a
  client-claimed-role-ignored case).
- `src/lib/server/chartSimilarity/index.ts` — updated to export the new types, functions, and
  fixtures, without removing or renaming any prior export.
- `scripts/smoke_phase_3fc_d_role_assignment_resolver_scaffold.mjs` — a bundled-module smoke
  covering the default-disabled path, anonymous/no-assignment/beta/owner/admin/inactive/multiple
  assignment cases, client-claim ignoring, and runtime safety (no fetch call, no
  Supabase/KIS/route import, no `process.env` access).
- `scripts/check_phase_3fc_d_role_assignment_resolver_scaffold_contract.mjs` — a static contract
  checker covering type contract, policy defaults, resolver behavior, forbidden
  imports/operations, fixture safety, export wiring, and non-drift of the existing route, UI, and
  the Phase 3FC-C auth subject resolver.

## 4. Resolver Contract

See `docs/planning/phase_3fc_d_role_assignment_resolver_contract_v0.1.md` for the full contract.
Summary: the resolver accepts only an explicit input object (never a `Request`, cookie, header,
`process.env` value, or real database read); under the default policy it always returns
`disabled`/anonymous/no-subject/no-assignment; under the mocked scaffold policy it correctly
resolves anonymous subjects, authenticated subjects with no assignment, and authenticated subjects
with an active beta/owner/admin assignment; an inactive or multiply-matching assignment is ignored
for safety; a client-claimed role or subject is always ignored and only produces a
`client_claim_ignored` warning; `beta`/`owner`/`admin` are never producible without an explicit,
matching, active assignment record.

## 5. Smoke Result

`npm run smoke:phase-3fc-d-role-assignment-resolver-scaffold` — PASS (79/79 assertions passed).
Covers: default disabled policy behavior; mocked policy over anonymous, authenticated-no-
assignment, beta, owner, admin, inactive-assignment-ignored, and multiple-assignments-ignored
cases; client-claimed role/subject ignoring; and runtime safety (no fetch call, no Supabase
package import, no KIS provider import, no API route import, no `process.env` property access, in
both the bundled module output and the on-disk resolver source).

## 6. Boundary Preservation

- `src/pages/api/chart-ai/similarity.ts` is unchanged in this phase: it still dispatches on
  exactly two guarded branches (`isOwnerLocalMockedSimilarityApiRequestBody`,
  `isOwnerLocalAuthUsageBridgeSimilarityApiRequestBody`) before falling back to the default
  feature-disabled shell result. It does not import or call the new resolver.
- `src/pages/chart-ai.astro` is unchanged in this phase: it still contains the pre-existing
  `chartAiOwnerLocalAuthUsageBridgePanel` and `owner-local-auth-usage-bridge` identifiers, and
  does not reference the new resolver.
- `src/lib/server/chartSimilarity/similarityAuthSubjectResolver.ts` (Phase 3FC-C) is unchanged and
  does not reference the new role assignment resolver.
- No Supabase package was imported or installed. No dependency was added. No SQL, migration, or
  schema file was created. No `.env`/`.env.local`/`.env.*` file was inspected, and no
  `process.env` property was read. No real role database or cache was read.
- No live KIS call, live KIS smoke rerun, or KIS network diagnostic was performed.
- No dev server was started and no manual browser QA was performed.

## 7. Validation

- `npm run check:phase-3fc-d-role-assignment-resolver-scaffold` — PASS.
- `npm run smoke:phase-3fc-d-role-assignment-resolver-scaffold` — PASS (79/79).
- Regressions in order: `check:phase-3fc-c-supabase-auth-subject-resolver-scaffold`,
  `smoke:phase-3fc-c-supabase-auth-subject-resolver-scaffold`,
  `check:phase-3fc-b-real-auth-usage-runtime-design`, `check:phase-3fc-a-*`, `check:phase-3fb-f-*`,
  `check:phase-3fb-e-*`, `smoke:phase-3fb-c-alt-*`, `check:phase-3fb-d-*`, `check:phase-3fb-c-*`,
  `smoke:phase-3fb-b-*`, `smoke:phase-3fb-a-*` — all PASS.
- `npm run build` — succeeded.
- `git diff --check` — clean.
- Forbidden-path diff against the starting commit (`src/pages/chart-ai.astro`,
  `src/pages/api`, `src/lib/server/providers`, `src/lib/chartSimilarity`,
  `src/data/chartSimilarity`) — empty.
- Changed-files diff against the starting commit — exactly the 10 allowed files for this phase.

## 8. Implementation Implication

The codebase now has a disabled-by-default, deterministically testable role assignment resolver
scaffold that can be exercised in isolation via mocked fixtures, with zero real Supabase/DB/route/
env/cookie/header dependency, and with `beta`/`owner`/`admin` role escalation strictly gated behind
an explicit, matching, active assignment record. This establishes the second concrete
implementation unit of the Phase 3FC-B runtime module plan without granting any new runtime
capability or route behavior change. Real role assignment database lookup, usage store
integration, and route integration remain explicitly out of scope until a later, separately
approved phase.

## 9. Recommended Next Phase

- **Phase 3FC-E — Usage Store Interface Scaffold** (primary): build a disabled-by-default usage
  store interface scaffold (read/increment daily/monthly usage counters keyed by the resolved
  role) against mocked fixtures only, in preparation for a later real Postgres/Supabase-style
  usage store, without real DB connectivity.
- **Phase 3FC-E-ALT — Feature Flag Resolver Scaffold** (alternative): build a disabled-by-default
  feature flag resolver scaffold that evaluates the Phase 3FC-B activation dependency rules
  (`AUTH_RUNTIME_ENABLED`, `USAGE_STORAGE_ENABLED`, `CHART_AI_SIMILARITY_BETA_ENABLED`,
  `CHART_AI_SIMILARITY_PUBLIC_ENABLED`, `LIVE_KIS_OHLC_ENABLED`) against mocked flag-value
  fixtures only, without reading any real environment variable.
