# Phase 3FC-E — Usage Store Interface Scaffold Result

## 1. Status

Implemented. A disabled-by-default, server-only usage store interface scaffold has been added,
testable only via deterministic mocked fixtures. No real Supabase runtime, no real usage database,
no live KIS call, no environment read, and no route/UI integration were introduced in this phase.

## 2. Background

Phase 3FC-C added a Supabase Auth subject resolver scaffold, and Phase 3FC-D added a role
assignment resolver scaffold that resolves a full `anonymous | authenticated | beta | owner |
admin` role from mocked assignment records. Per the Phase 3FC-B design and the owner-approved
daily/monthly limit table, usage must be tracked per role/window in a real Postgres/Supabase-style
usage store. This phase implements that next isolated unit: a usage store interface scaffold that
loads a role-based usage snapshot and computes a mocked usage increment result, without any real
persistence.

## 3. Implemented Scope

- `src/lib/server/chartSimilarity/similarityUsageStoreTypes.ts` — the type contract (role, window,
  status, source, subject ref, counter record, event record, store input, policy, and result
  types).
- `src/lib/server/chartSimilarity/similarityUsageStore.ts` — the usage store module:
  `buildDefaultSimilarityUsageStorePolicy`, `buildMockedSimilarityUsageStorePolicy`,
  `getApprovedSimilarityUsageLimit`, `normalizeSimilarityUsageStoreInput`,
  `loadSimilarityUsageSnapshot`, `recordSimilarityUsageIncrement`, and
  `assertSimilarityUsageStoreResultIsSafe`.
- `src/lib/server/chartSimilarity/mockedSimilarityUsageStoreFixtures.ts` — nine deterministic,
  synthetic fixture builders (anonymous, authenticated-fresh-daily, authenticated-at-daily-limit,
  beta-partial-daily, beta-at-monthly-limit, owner-partial-daily, admin-partial-monthly, a
  counter-mismatch-ignored case, and a client-claimed-usage-ignored case).
- `src/lib/server/chartSimilarity/index.ts` — updated to export the new types, functions, and
  fixtures, without removing or renaming any prior export.
- `scripts/smoke_phase_3fc_e_usage_store_interface_scaffold.mjs` — a bundled-module smoke covering
  the default-disabled path, the approved limit table, anonymous-blocked, fresh/at-limit
  snapshots, partial/at-limit increments across authenticated/beta/owner/admin, counter-mismatch
  ignoring, client-claim ignoring, and runtime safety (no fetch call, no Supabase/KIS/route
  import, no `process.env` access).
- `scripts/check_phase_3fc_e_usage_store_interface_scaffold_contract.mjs` — a static contract
  checker covering type contract, policy defaults, the approved limit table, module behavior,
  forbidden imports/operations, fixture safety, export wiring, and non-drift of the existing
  route, UI, and the Phase 3FC-C/3FC-D resolvers.

## 4. Usage Store Contract Result

See `docs/planning/phase_3fc_e_usage_store_interface_contract_v0.1.md` for the full contract.
Summary: the module accepts only an explicit input object (never a `Request`, cookie, header,
`process.env` value, or real database read); under the default policy it always returns
`disabled`/no-usage/no-event; under the mocked scaffold policy it correctly resolves an
anonymous-blocked result, a fresh zero-used snapshot, an at-limit snapshot, a partial increment
success, an at-limit increment block, and a quota-exceeded increment block, across
authenticated/beta/owner/admin roles and daily/monthly windows; a mismatched counter is ignored
for safety with a `counter_ignored` warning; a client-claimed role or usage value is always
ignored and only produces a `client_claim_ignored` warning; the increment computation never
persists anything and makes no atomicity guarantee.

## 5. Smoke Result

`npm run smoke:phase-3fc-e-usage-store-interface-scaffold` — PASS (98/98 assertions passed).
Covers: default disabled policy behavior; the approved daily/monthly limit table for all five
roles; anonymous-blocked snapshot and increment; authenticated fresh-daily snapshot; authenticated
at-daily-limit snapshot and blocked increment; beta partial-daily increment success; beta
at-monthly-limit snapshot and blocked increment; owner partial-daily increment; admin
partial-monthly increment; counter-mismatch-ignored fallback; client-claimed-usage-ignored
fallback; and runtime safety (no fetch call, no Supabase package import, no KIS provider import,
no API route import, no `process.env` property access, in both the bundled module output and the
on-disk usage store source).

## 6. Boundary Preservation

- `src/pages/api/chart-ai/similarity.ts` is unchanged in this phase: it still dispatches on
  exactly two guarded branches (`isOwnerLocalMockedSimilarityApiRequestBody`,
  `isOwnerLocalAuthUsageBridgeSimilarityApiRequestBody`) before falling back to the default
  feature-disabled shell result. It does not import or call the new usage store module.
- `src/pages/chart-ai.astro` is unchanged in this phase: it still contains the pre-existing
  `chartAiOwnerLocalAuthUsageBridgePanel` and `owner-local-auth-usage-bridge` identifiers, and
  does not reference the new usage store module.
- `src/lib/server/chartSimilarity/similarityAuthSubjectResolver.ts` (Phase 3FC-C) and
  `src/lib/server/chartSimilarity/similarityRoleAssignmentResolver.ts` (Phase 3FC-D) are unchanged
  and do not reference the new usage store module.
- No Supabase package was imported or installed. No dependency was added. No SQL, migration, or
  schema file was created. No `.env`/`.env.local`/`.env.*` file was inspected, and no
  `process.env` property was read. No real usage database or cache was read or written.
- No live KIS call, live KIS smoke rerun, or KIS network diagnostic was performed.
- No dev server was started and no manual browser QA was performed.

## 7. Validation

- `npm run check:phase-3fc-e-usage-store-interface-scaffold` — PASS.
- `npm run smoke:phase-3fc-e-usage-store-interface-scaffold` — PASS (98/98).
- Regressions in order: `check:phase-3fc-d-role-assignment-resolver-scaffold`,
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

The codebase now has a disabled-by-default, deterministically testable usage store interface
scaffold that can be exercised in isolation via mocked fixtures, with zero real Supabase/DB/route/
env/cookie/header dependency, and with the owner-approved daily/monthly limit table enforced as a
pure lookup. This establishes the third concrete implementation unit of the Phase 3FC-B runtime
module plan without granting any new runtime capability or route behavior change. Real usage
database connectivity (with an atomic conditional update or transaction and idempotency handling),
feature flag resolution, and route integration remain explicitly out of scope until a later,
separately approved phase.

## 9. Recommended Next Phase

- **Phase 3FC-F — Feature Flag Resolver Scaffold** (primary): build a disabled-by-default feature
  flag resolver scaffold that evaluates the Phase 3FC-B activation dependency rules
  (`AUTH_RUNTIME_ENABLED`, `USAGE_STORAGE_ENABLED`, `CHART_AI_SIMILARITY_BETA_ENABLED`,
  `CHART_AI_SIMILARITY_PUBLIC_ENABLED`, `LIVE_KIS_OHLC_ENABLED`) against mocked flag-value
  fixtures only, without reading any real environment variable.
- **Phase 3FC-F-ALT — Guarded Route Integration Plan Refresh** (alternative): produce a
  documentation-only refresh of the guarded route integration plan that incorporates the Phase
  3FC-C/3FC-D/3FC-E resolver and usage store contracts, with no runtime source change.
- **Rationale**: the auth subject, role assignment, and usage store scaffolds are now all in
  place; the next safe increment is either the remaining feature flag resolver scaffold (to
  complete the Phase 3FC-B module plan's disabled-by-default resolver set) or a planning-only
  refresh that sequences how these scaffolds will eventually be wired into the route without yet
  changing runtime behavior.
