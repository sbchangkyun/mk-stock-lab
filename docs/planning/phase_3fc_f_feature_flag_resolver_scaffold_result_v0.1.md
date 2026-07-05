# Phase 3FC-F — Feature Flag Resolver Scaffold Result

## 1. Status

Implemented. A disabled-by-default, server-only feature flag resolver scaffold has been added,
testable only via deterministic mocked fixtures. No real environment variable, no Vercel
environment variable, no real Supabase runtime, no real feature flag database, no route
integration, no live KIS call, and no deploy/push were introduced in this phase.

## 2. Background

Phase 3FC-C added a Supabase Auth subject resolver scaffold, Phase 3FC-D added a role assignment
resolver scaffold, and Phase 3FC-E added a usage store interface scaffold. Per the Phase 3FC-B
design, activation of auth runtime, usage storage, and beta/public similarity exposure must be
gated by explicit feature flags, evaluated independently of any one user's role or usage. This
phase implements that next isolated unit: a feature flag resolver that evaluates the five
owner-approved flag keys and their dependency gates from mocked fixtures, before any of the four
scaffolds are wired into the route.

## 3. Implemented Scope

- `src/lib/server/chartSimilarity/similarityFeatureFlagResolverTypes.ts` — the type contract (flag
  key, resolver status, source, capability, flag record, resolver input, policy, safe policy
  summary, flag state, gate state, and result types).
- `src/lib/server/chartSimilarity/similarityFeatureFlagResolver.ts` — the resolver module:
  `buildDefaultSimilarityFeatureFlagResolverPolicy`, `buildMockedSimilarityFeatureFlagResolverPolicy`,
  `buildDefaultSimilarityFeatureFlagStates`, `normalizeSimilarityFeatureFlagResolverInput`,
  `resolveSimilarityFeatureFlags`, `isSimilarityFeatureCapabilityAllowed`, and
  `assertSimilarityFeatureFlagResolverResultIsSafe`.
- `src/lib/server/chartSimilarity/mockedSimilarityFeatureFlagResolverFixtures.ts` — nine
  deterministic, synthetic fixture builders (all-flags-off, auth-only, auth+usage+beta-ready,
  beta-missing-auth, beta-missing-usage, public-requested, live-KIS-requested,
  duplicate-flag-ignored, and client-claimed-flags-ignored).
- `src/lib/server/chartSimilarity/index.ts` — updated to export the new types, functions, and
  fixtures, without removing or renaming any prior export.
- `scripts/smoke_phase_3fc_f_feature_flag_resolver_scaffold.mjs` — a bundled-module smoke covering
  the default-disabled path, all-flags-off, auth-only, auth+usage+beta-ready, beta-missing-auth,
  beta-missing-usage, public-requested, live-KIS-requested, duplicate-flag-ignored,
  client-claim-ignored, invalid-input handling, the capability helper, and runtime safety (no
  fetch call, no Supabase/KIS/route import, no `process.env`/`import.meta.env` access).
- `scripts/check_phase_3fc_f_feature_flag_resolver_scaffold_contract.mjs` — a static contract
  checker covering the type contract, policy defaults, the five flag keys, resolver behavior,
  forbidden imports/operations, fixture safety, export wiring, and non-drift of the existing
  route, UI, and the Phase 3FC-C/3FC-D/3FC-E scaffolds.

## 4. Feature Flag Resolver Contract Result

See `docs/planning/phase_3fc_f_feature_flag_resolver_contract_v0.1.md` for the full contract.
Summary: the module accepts only an explicit input object (never a `Request`, cookie, header,
`process.env`/`import.meta.env` value, Vercel environment variable, or real database read); under
the default policy it always returns `disabled` with all five flags false and every gate false;
under the mocked scaffold policy it correctly resolves an all-flags-off state, an auth-only state,
an auth+usage+beta-ready state (`betaDependenciesSatisfied` true, `betaExecutionAllowed` still
false), a beta-missing-auth and a beta-missing-usage `dependency_blocked` state with the matching
warnings, a public-requested state with `public_activation_not_approved` even when dependencies
are satisfied, a live-KIS-requested state with `live_kis_activation_not_approved`; a duplicate
active flag record for the same key is ignored as a set with a `duplicate_flag_ignored` warning
and the default false state is kept; a client-claimed flag set is always ignored with only a
`client_claim_ignored` warning; `routeSuccessAllowed`, `betaExecutionAllowed`,
`publicExecutionAllowed`, and `liveKisAllowed` are always false regardless of dependency
satisfaction.

## 5. Smoke Result

`npm run smoke:phase-3fc-f-feature-flag-resolver-scaffold` — PASS (98/98 assertions passed).
Covers: default disabled policy behavior; mocked policy still granting no real capability;
all-flags-off; auth-only with the capability helper; auth+usage+beta-ready with
`betaExecutionAllowed` still false; beta-missing-auth and beta-missing-usage `dependency_blocked`
paths; public-requested with `public_activation_not_approved`; live-KIS-requested with
`live_kis_activation_not_approved`; duplicate-flag-ignored; client-claim-ignored; invalid/malformed
input handling (`invalid_flag_set`, `flag_ignored`); and runtime safety (no fetch call, no
Supabase package import, no KIS provider import, no API route import, no
`process.env`/`import.meta.env` access, in both the bundled module output and the on-disk resolver
source).

## 6. Boundary Preservation

- `src/pages/api/chart-ai/similarity.ts` is unchanged in this phase: it still dispatches on
  exactly two guarded branches (`isOwnerLocalMockedSimilarityApiRequestBody`,
  `isOwnerLocalAuthUsageBridgeSimilarityApiRequestBody`) before falling back to the default
  feature-disabled shell result. It does not import or call the new feature flag resolver module.
- `src/pages/chart-ai.astro` is unchanged in this phase: it still contains the pre-existing
  `chartAiOwnerLocalAuthUsageBridgePanel` and `owner-local-auth-usage-bridge` identifiers, and does
  not reference the new feature flag resolver module.
- `src/lib/server/chartSimilarity/similarityAuthSubjectResolver.ts` (Phase 3FC-C),
  `src/lib/server/chartSimilarity/similarityRoleAssignmentResolver.ts` (Phase 3FC-D), and
  `src/lib/server/chartSimilarity/similarityUsageStore.ts` (Phase 3FC-E) are unchanged and do not
  reference the new feature flag resolver module.
- No Supabase package was imported or installed. No dependency was added. No SQL, migration, or
  schema file was created. No `.env`/`.env.local`/`.env.*` file was inspected, no `process.env`
  property was read, no `import.meta.env` property was read, and no Vercel environment variable
  was read. No real feature flag database or cache was read or written.
- No live KIS call, live KIS smoke rerun, or KIS network diagnostic was performed.
- No dev server was started and no manual browser QA was performed.

## 7. Validation

- `npm run check:phase-3fc-f-feature-flag-resolver-scaffold` — PASS.
- `npm run smoke:phase-3fc-f-feature-flag-resolver-scaffold` — PASS (98/98).
- Regressions in order: `check:phase-3fc-e-usage-store-interface-scaffold`,
  `smoke:phase-3fc-e-usage-store-interface-scaffold`,
  `check:phase-3fc-d-role-assignment-resolver-scaffold`,
  `smoke:phase-3fc-d-role-assignment-resolver-scaffold`,
  `check:phase-3fc-c-supabase-auth-subject-resolver-scaffold`,
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

The codebase now has a disabled-by-default, deterministically testable feature flag resolver
scaffold that can be exercised in isolation via mocked fixtures, with zero real
environment/Vercel-environment/Supabase/DB/route dependency. Combined with the Phase 3FC-C auth
subject resolver, the Phase 3FC-D role assignment resolver, and the Phase 3FC-E usage store, all
four disabled-by-default scaffolds required by the Phase 3FC-B runtime module plan now exist. Real
feature flag database/env connectivity, real Supabase runtime, real usage database connectivity,
and route integration remain explicitly out of scope until later, separately approved phases.

## 9. Recommended Next Phase

- **Phase 3FC-G — Guarded Route Integration Plan Refresh, No Runtime Change** (primary): produce a
  documentation-only refresh of the guarded route integration plan that incorporates the Phase
  3FC-C/3FC-D/3FC-E/3FC-F resolver and store contracts, with no runtime source change.
- **Phase 3FC-G-ALT — Guarded Route Integration Scaffold, All Flags Off, No Live KIS**
  (alternative): build a disabled-by-default route integration scaffold that combines all four
  resolvers behind flags that all remain off, without granting any new runtime capability.
- **Rationale**: the auth subject, role assignment, usage store, and feature flag scaffolds are
  now all in place; the next safe increment is either a planning-only refresh that sequences how
  these scaffolds will eventually be wired into the route, or a first guarded route integration
  scaffold that still keeps every flag off and every runtime capability false.
