# Phase 3FC-C — Supabase Auth Subject Resolver Scaffold Result

## Status

Implemented. A disabled-by-default, server-only Supabase Auth subject resolver scaffold has been
added, testable only via deterministic mocked fixtures. No real Supabase runtime, no live KIS
call, no environment read, and no route/UI integration were introduced in this phase.

## Background

Phase 3FC-B finalized the real auth/usage runtime design (Supabase Auth; Postgres/Supabase-style
usage storage; the anonymous/authenticated/beta/owner/admin role/limit policy;
approved-for-design-only feature flags) without implementing any runtime. Its recommended next
phase, and the future module plan's first proposed implementation unit, was the auth subject
resolver. This phase implements that unit as a scaffold only — it does not implement a real
Supabase Auth runtime, and it does not resolve `beta`/`owner`/`admin` roles.

## Implemented Scope

- `src/lib/server/chartSimilarity/similarityAuthSubjectResolverTypes.ts` — the type contract
  (provider, status, auth state, role seed, safe ref, resolver input, policy, and result types).
- `src/lib/server/chartSimilarity/similarityAuthSubjectResolver.ts` — the resolver module:
  `buildDefaultSimilarityAuthSubjectResolverPolicy`, `buildMockedSimilarityAuthSubjectResolverPolicy`,
  `normalizeSimilarityAuthSubjectResolverInput`, `resolveSimilarityAuthSubject`, and
  `assertSimilarityAuthSubjectResolverResultIsSafe`.
- `src/lib/server/chartSimilarity/mockedSimilarityAuthSubjectResolverFixtures.ts` — four
  deterministic, synthetic fixture builders (missing / valid / invalid mocked session, and a
  client-claimed-role-ignored case).
- `src/lib/server/chartSimilarity/index.ts` — updated to export the new types, functions, and
  fixtures, without removing or renaming any prior export.
- `scripts/smoke_phase_3fc_c_supabase_auth_subject_resolver_scaffold.mjs` — a bundled-module smoke
  covering the default-disabled path, missing/valid/invalid mocked sessions, client-claim
  ignoring, and runtime safety (no fetch call, no Supabase/KIS/route import, no `process.env`
  access).
- `scripts/check_phase_3fc_c_supabase_auth_subject_resolver_scaffold_contract.mjs` — a static
  contract checker covering type contract, policy defaults, resolver behavior, forbidden
  imports/operations, fixture safety, export wiring, and non-drift of the existing route and UI.

## Resolver Contract

See `docs/planning/phase_3fc_c_auth_subject_resolver_contract_v0.1.md` for the full contract.
Summary: the resolver accepts only an explicit input object (never a `Request`, cookie, header,
or `process.env` value); under the default policy it always returns `disabled`/anonymous/no
subject; under the mocked scaffold policy it correctly resolves missing/valid/invalid mocked
session candidates; a client-claimed role or subject is always ignored and only produces a
`client_claim_ignored` warning; `roleSeed` is limited to `anonymous | authenticated` only.

## Smoke Result

`npm run smoke:phase-3fc-c-supabase-auth-subject-resolver-scaffold` — PASS (53/53 assertions
passed). Covers: default disabled policy behavior; mocked policy over missing/valid/invalid
session candidates; client-claimed role/subject ignoring; and runtime safety (no fetch call, no
Supabase package import, no KIS provider import, no API route import, no `process.env` property
access, in both the bundled module output and the on-disk resolver source).

## Boundary Preservation

- `src/pages/api/chart-ai/similarity.ts` is unchanged in this phase: it still dispatches on
  exactly two guarded branches (`isOwnerLocalMockedSimilarityApiRequestBody`,
  `isOwnerLocalAuthUsageBridgeSimilarityApiRequestBody`) before falling back to the default
  feature-disabled shell result. It does not import or call the new resolver.
- `src/pages/chart-ai.astro` is unchanged in this phase: it still contains the pre-existing
  `chartAiOwnerLocalAuthUsageBridgePanel` and `owner-local-auth-usage-bridge` identifiers, and
  does not reference the new resolver.
- No Supabase package was imported or installed. No dependency was added. No SQL, migration, or
  schema file was created. No `.env`/`.env.local`/`.env.*` file was inspected, and no
  `process.env` property was read.
- No live KIS call, live KIS smoke rerun, or KIS network diagnostic was performed.
- No dev server was started and no manual browser QA was performed.

## Validation

- `npm run check:phase-3fc-c-supabase-auth-subject-resolver-scaffold` — PASS.
- `npm run smoke:phase-3fc-c-supabase-auth-subject-resolver-scaffold` — PASS (53/53).
- Regressions in order: `check:phase-3fc-b-real-auth-usage-runtime-design`,
  `check:phase-3fc-a-*`, `check:phase-3fb-f-*`, `check:phase-3fb-e-*`, `smoke:phase-3fb-c-alt-*`,
  `check:phase-3fb-d-*`, `check:phase-3fb-c-*`, `smoke:phase-3fb-b-*`, `smoke:phase-3fb-a-*` — all
  PASS.
- `npm run build` — succeeded.
- `git diff --check` — clean.
- Forbidden-path diff against the starting commit (`src/pages/chart-ai.astro`,
  `src/pages/api`, `src/lib/server/providers`, `src/lib/chartSimilarity`,
  `src/data/chartSimilarity`) — empty.
- Changed-files diff against the starting commit — exactly the 10 allowed files for this phase.

## Implementation Implication

The codebase now has a disabled-by-default, deterministically testable Supabase Auth subject
resolver scaffold that can be exercised in isolation via mocked fixtures, with zero real
Supabase/KIS/route/env/cookie/header dependency. This establishes the first concrete
implementation unit of the Phase 3FC-B runtime module plan without granting any new runtime
capability or route behavior change. Real Supabase session verification, route integration, and
role assignment beyond `anonymous`/`authenticated` remain explicitly out of scope until a later,
separately approved phase.

## Recommended Next Phase

- **Phase 3FC-D — Role Assignment Resolver Scaffold** (primary): build a disabled-by-default
  scaffold that maps a resolved auth subject (from this phase's resolver) plus a mocked role
  assignment record to a full `SimilarityExecutionRole` (`anonymous | authenticated | beta | owner
  | admin`), still with no real Supabase/DB runtime and no route integration.
- **Phase 3FC-D-ALT — Usage Store Interface Scaffold** (alternative): build a disabled-by-default
  usage store interface scaffold (read/increment usage counters) against mocked fixtures only, in
  preparation for a later real Postgres/Supabase-style usage store, without real DB connectivity.
