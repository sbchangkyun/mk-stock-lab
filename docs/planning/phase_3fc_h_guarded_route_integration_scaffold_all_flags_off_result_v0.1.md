# Phase 3FC-H — Guarded Route Integration Scaffold, All Flags Off Result

## 1. Status

Implemented. The Chart Similarity API route now recognizes a third, exact-match request
discriminator (`guarded-runtime-scaffold`) and calls a new guarded route scaffold module to
confirm safe blocked/disabled handling. Every runtime gate remains off. No real Supabase, no real
database, no live KIS, and no public/beta route success were introduced.

## 2. Background

Phase 3FC-G refreshed the route integration blueprint after the Phase 3FC-C (auth subject), 3FC-D
(role assignment), 3FC-E (usage store), and 3FC-F (feature flag) scaffolds were completed but left
unwired. This phase adds the first route scaffold branch without activating real runtime behavior,
following the roadmap recorded in
`docs/planning/phase_3fc_g_chart_ai_remaining_roadmap_and_kis_stage_v0.1.md`.

## 3. Implemented Scope

- `similarityGuardedRouteScaffoldTypes.ts` — server-only type contract.
- `similarityGuardedRouteScaffold.ts` — the scaffold module, composing with the Phase 3FC-F feature
  flag resolver in a safe, all-flags-off configuration.
- `mockedSimilarityGuardedRouteScaffoldFixtures.ts` — deterministic, synthetic request fixtures.
- A new exact-match dispatch branch in `src/pages/api/chart-ai/similarity.ts`, mutually exclusive
  with the two existing owner-local branches, always falling back to the existing feature-disabled
  shell response.
- `index.ts` exports for the new types, functions, and fixtures, with no prior export removed.
- A smoke script and a static contract checker.
- A contract doc, a result doc, a changelog entry, and two new package scripts.

## 4. Route Scaffold Result

`runSimilarityGuardedRouteScaffold` always returns `invalid_request`, `disabled`, or
`feature_flag_blocked`. `routeSuccessAllowed` and `liveKisAllowed` are always `false`, and
`providerStatus` is always `mocked_provider_not_invoked`. No usage increment is recorded, no
mocked provider integration is invoked, and no deterministic similarity engine call occurs. The
HTTP-facing route response for the new branch is always the existing sanitized feature-disabled
shell — no new success response shape exists.

## 5. Boundary Preservation

- `src/pages/chart-ai.astro` is unchanged.
- The owner-local-mocked and owner-local-auth-usage-bridge branches are unchanged.
- The Phase 3FC-C, 3FC-D, 3FC-E, and 3FC-F scaffold modules are unchanged.
- No Supabase package, SQL/migration file, or dependency was added.
- No `process.env`, `import.meta.env`, Vercel environment variable, cookie, or request header was
  read.
- No live KIS call, KIS network diagnostic, or deploy/push occurred.
- The Phase 3FC-G checker's route-dispatch-branch-count-of-2 assertion is intentionally superseded
  by this phase's addition of a third branch; the Phase 3FC-H checker instead asserts a
  branch count of exactly 3, and the 3FC-G checker should not be run as a gating regression after
  this phase.

## 6. Validation

- `npm run check:phase-3fc-h-guarded-route-integration-scaffold-all-flags-off` — passed.
- `npm run smoke:phase-3fc-h-guarded-route-integration-scaffold-all-flags-off` — passed.
- Prior regressions (Phase 3FC-F through Phase 3FC-A, Phase 3FB-F through Phase 3FB-A) — passed,
  excluding the intentionally superseded Phase 3FC-G route-branch-count assertion.
- `npm run build` — passed.
- `git diff --check` — clean.

## 7. Files Changed

The exact 11 files listed in the governing prompt: the route file, the three new
`similarityGuardedRouteScaffold*` source files, `index.ts`, the new smoke script, the new checker
script, the two new planning docs, the changelog, and `package.json`.

## 8. Implementation Implication

The route is now composition-ready for a guarded runtime path without granting any runtime
capability. Real Supabase, real database, beta, and public activation each remain separate,
later, explicitly approved phases. Live KIS remains a separate track requiring network
reachability confirmation before any dedicated KIS phase.

## 9. Recommended Next Phase

Primary: Phase 3FC-I — Owner-local Mocked Guarded Route Smoke, No Live KIS.

Alternative: Phase 3FC-I-ALT — Real Supabase/Auth/Usage Implementation Approval Package, No
Runtime Change.
