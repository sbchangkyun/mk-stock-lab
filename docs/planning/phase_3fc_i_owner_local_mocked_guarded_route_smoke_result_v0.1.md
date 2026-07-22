# Phase 3FC-I — Owner-local Mocked Guarded Route Smoke Result

## 1. Status

Prepared. Added an owner-local mocked guarded route smoke and a static contract checker that
exercise the Phase 3FC-H guarded route scaffold branch through the real route handlers, without
changing any runtime source file. Every runtime gate remains off, and the guarded branch continues
to fall back to the existing safe feature-disabled shell.

## 2. Background

Phase 3FC-H added the guarded-runtime-scaffold branch to the Chart Similarity API route, mutually
exclusive with the two pre-existing owner-local branches, always falling back to the existing
feature-disabled shell. This phase verifies that branch's behavior with a dedicated owner-local
smoke, following the roadmap recorded in
`docs/planning/phase_3fc_g_chart_ai_remaining_roadmap_and_kis_stage_v0.1.md` and the Phase 3FC-H
result doc's recommended next phase.

## 3. Implemented Scope

- `scripts/smoke_phase_3fc_i_owner_local_mocked_guarded_route_smoke_no_live_kis.mjs` — bundles and
  invokes the real route `POST`/`ALL` handlers and the Phase 3FC-H scaffold module directly.
- `scripts/check_phase_3fc_i_owner_local_mocked_guarded_route_smoke_contract.mjs` — a static
  contract checker over the new smoke, docs, and package script registration.
- Two new planning docs (this result doc and the companion scenarios doc) and a changelog entry.
- Two new `package.json` script lines.

No runtime source file was changed or modified in this phase: the route, scaffold, `/chart-ai`,
provider, deterministic engine, and data fixture files are all unchanged.

## 4. Smoke Contract

The smoke covers ten scenario groups: harness safety, a default unmatched request, owner-local
mocked branch regression, owner-local auth/usage bridge branch regression, the exact
guarded-runtime-scaffold request, a partial guarded request, a wrong-source guarded request, a
malformed/null/non-object guarded request, a direct scaffold module confirmation, and branch mutual
exclusion. The smoke runs 110 assertions, within the required 90–130 target range and above the
90-assertion floor.

## 5. Expected Route Result

Every guarded-runtime-scaffold request — exact, partial, wrong-source, or malformed — resolves to
the same feature-disabled shell response (httpStatus 503, `ok: false`, `status: 'feature_disabled'`,
`mode: 'feature-flag-off'`, `data: null`) as the default unmatched case. No new success response
shape is produced, and no scaffold-internal field (`summary`, `safeMessage`, `policy`) is leaked to
the client. The two pre-existing owner-local branches are unchanged.

## 6. Boundary Preservation

- `src/pages/chart-ai.astro`, `src/pages/api/**`, and every `src/lib/server/chartSimilarity/*.ts`
  scaffold and provider file are unchanged.
- No Supabase package, SQL/migration file, or dependency was added.
- No `process.env`, `import.meta.env`, Vercel environment variable, cookie, or request header was
  read.
- No live KIS call, KIS network diagnostic, dev server start, manual browser QA, deploy, or push
  occurred.
- The Phase 3FC-G checker's stale route-dispatch-branch-count-of-2 assertion remains superseded by
  the Phase 3FC-H checker's branch-count-of-3 assertion; the Phase 3FC-G checker must not be run as
  a gating regression in this phase's validation either.

## 7. Validation

- `npm run check:phase-3fc-i-owner-local-mocked-guarded-route-smoke-no-live-kis` — passed.
- `npm run smoke:phase-3fc-i-owner-local-mocked-guarded-route-smoke-no-live-kis` — passed
  (110/110 assertions).
- Prior regressions (Phase 3FC-H through Phase 3FC-A, Phase 3FB-F through Phase 3FB-A) — passed,
  excluding the intentionally superseded Phase 3FC-G route-branch-count assertion.
- `npm run build` — passed.
- `git diff --check` — clean.

## 8. Supersession Note

This phase does not supersede any prior checker's structural assertions other than the
already-superseded Phase 3FC-G route-dispatch-branch-count-of-2 check (superseded by Phase 3FC-H).
No other prior phase's checker or smoke is affected.

## 9. Recommended Next Phase

Primary: Phase 3FC-J — Guarded Route Runtime Composition Plan Refresh, No Runtime Change.

Alternative: Phase 3FD-A — Real Supabase/Auth/Usage Implementation Approval Package, No Runtime
Change.
