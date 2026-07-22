# Phase 3FA-B — Owner-local KIS Similarity Smoke Plan Result

## 1. Status

Prepared/Implemented — owner-local KIS similarity smoke plan added, no smoke executed.

## 2. Background

- Phase 3FA-A defined the owner-local KIS-normalized similarity execution plan.
- This phase defines the future owner-local manual smoke procedure, redaction policy, safe report
  template, and pass/fail criteria before any KIS smoke or live similarity execution is allowed.

## 3. Implemented Scope

- Added `src/lib/server/chartSimilarity/similarityOwnerLocalSmokePlanTypes.ts` defining
  `SimilarityOwnerLocalSmokePlanStatus`, `SimilarityOwnerLocalSmokeStage`,
  `SimilarityOwnerLocalSmokeGate`, `SimilarityOwnerLocalSmokeRedactionPolicy`,
  `SimilarityOwnerLocalSmokeCheckOutcome`, `SimilarityOwnerLocalSmokeReportTemplate`,
  `SimilarityOwnerLocalSmokePlanPolicy`, and `SimilarityOwnerLocalSmokePlanResult`. No raw KIS
  field, actual OHLC price/volume, market timestamp, similarity score/derived return from real
  data, KIS credential, account/trading field, token/email/IP/cookie/header, DB connection string,
  or SQL string is present in any of these types.
- Added `src/lib/server/chartSimilarity/similarityOwnerLocalSmokePlan.ts` with:
  - `buildDefaultSimilarityOwnerLocalSmokePlanPolicy` — a pure default policy (`enabled: false`,
    `ownerLocalOnly: true`, `manualExecutionOnly: true`, `publicExecutionAllowed: false`,
    `betaExecutionAllowed: false`, `routeSuccessAllowed: false`,
    `liveKisCallAllowedInThisPhase: false`, `liveSimilarityExecutionAllowedInThisPhase: false`,
    `rawProviderPayloadAllowed: false`, `actualMarketValuesInReportsAllowed: false`,
    `requiresOwnerApprovalBeforeSmoke: true`, `requiresProviderEnvPreparedButUnreadByPlan: true`,
    `requiresRouteShellToRemainDisabled: true`, `requiresNoStoreResponsePolicy: true`).
  - `buildOwnerLocalSmokeStages` — returns the ordered nine-stage sequence:
    `preflight_boundary_check`, `owner_local_environment_confirmation`,
    `route_shell_disabled_confirmation`, `auth_usage_precondition_review`,
    `kis_normalized_ohlc_provider_probe`, `normalized_bar_shape_validation`,
    `similarity_engine_contract_dry_run`, `safe_response_redaction_check`,
    `manual_review_closeout`.
  - `buildOwnerLocalSmokeGates` — returns eleven required gates; the six static safety gates
    (route success disabled, public execution disabled, beta execution disabled, raw provider
    payload exclusion, no actual market values in report, no credential/env echo, no
    deployment/push) are `satisfied: true`, and the remaining approval/confirmation gates (owner
    approval before smoke, owner-local environment confirmation, provider env prepared but
    unread by plan, route shell remains disabled) are `satisfied: false` in this phase.
  - `buildOwnerLocalSmokeRedactionPolicy` — returns the strict redaction policy disallowing raw
    KIS payload, OHLC values, volume values, timestamps, similarity scores, derived returns,
    credential echo, token echo, and env echo, with `allowedReportFields` limited to safe
    status/summary fields only.
  - `buildOwnerLocalSmokeReportTemplate` — returns a deterministic not-yet-run report template.
  - `isOwnerLocalSmokeAllowedByPlan` — returns `false` whenever `policy.enabled` is `false` or any
    required gate is unsatisfied; since the default policy's `enabled` field is fixed `false`,
    this always returns `false` in this phase.
  - `buildSimilarityOwnerLocalSmokePlanResult` — combines the policy, stages, gates, redaction
    policy, and report template into a full plan result with a safe message stating no KIS call,
    no similarity engine execution, no env read, and no route success occur.
- Added `src/lib/server/chartSimilarity/mockedSimilarityOwnerLocalSmokePlanFixtures.ts` with
  deterministic fixtures: `buildMockedOwnerLocalSmokePlanPolicy`,
  `buildMockedOwnerLocalSmokeStages`, `buildMockedOwnerLocalSmokeGates`,
  `buildMockedOwnerLocalSmokeRedactionPolicy`, `buildMockedOwnerLocalSmokeReportTemplate`,
  `buildMockedOwnerLocalSmokePlanResult`, and `buildMockedOwnerLocalSmokeDeniedResult`.
- Updated `src/lib/server/chartSimilarity/index.ts` to export the new types, policy/stages/gates/
  redaction-policy/report-template/result builders, the smoke-allowed helper, and the mocked
  fixtures. No import of this module was added to the API route shell or any `/chart-ai` UI file.
- Added `docs/planning/phase_3fa_b_owner_local_kis_similarity_smoke_plan_v0.1.md` (planning) and
  this result document.
- Added `scripts/check_phase_3fa_b_owner_local_kis_similarity_smoke_plan_contract.mjs` and a
  matching `package.json` script entry.
- Prepended a Phase 3FA-B entry to `docs/planning/planning_changelog.md`.

## 4. Smoke Plan Results

- `enabled`: `false` by default.
- `ownerLocalOnly`: `true`.
- `manualExecutionOnly`: `true`.
- `publicExecutionAllowed`: `false`.
- `betaExecutionAllowed`: `false`.
- `routeSuccessAllowed`: `false`.
- `liveKisCallAllowedInThisPhase`: `false`.
- `liveSimilarityExecutionAllowedInThisPhase`: `false`.
- `rawProviderPayloadAllowed`: `false`.
- `actualMarketValuesInReportsAllowed`: `false`.
- Planned stages (ordered): preflight boundary check → owner-local environment confirmation →
  route shell disabled confirmation → auth/usage precondition review → KIS-normalized OHLC
  provider probe → normalized bar shape validation → similarity engine contract dry run → safe
  response redaction check → manual review closeout.
- Gates: owner approval before smoke, owner-local environment confirmation, provider env prepared
  but unread by plan, route shell remains disabled, route success disabled, public execution
  disabled, beta execution disabled, raw provider payload exclusion, no actual market values in
  report, no credential/env echo, no deployment/push.
- Report template: `status: not_run`, `smokeId: owner-local-kis-similarity-smoke-plan`,
  `executedBy: owner-local-manual`, `source: owner-local`, `providerProbe: not_run`,
  `normalizationCheck: not_run`, `engineContractCheck: not_run`,
  `responseRedactionCheck: not_run`, safe summary and warnings only.

## 5. Redaction and Reporting Policy

- No raw KIS payload may appear in any smoke report.
- No OHLC prices may appear in any smoke report.
- No volume values may appear in any smoke report.
- No market timestamps may appear in any smoke report.
- No similarity scores derived from real data may appear in any smoke report.
- No derived returns computed from real data may appear in any smoke report.
- No credential, token, or environment value may be echoed anywhere.
- Only safe status/pass/fail/summary fields (`status`, `smokeId`, `executedBy`, `source`,
  `providerProbe`, `normalizationCheck`, `engineContractCheck`, `responseRedactionCheck`,
  `safeSummary`, `warnings`) may be reported.

## 6. Preserved Boundaries

- No KIS call was made in this phase.
- No live similarity execution occurred; the real similarity engine (`src/lib/chartSimilarity/**`)
  was not imported or called.
- No API route change was made; `src/pages/api/chart-ai/similarity.ts` was not modified.
- No `/chart-ai` UI change was made in this phase.
- No real auth runtime or usage storage implementation was added in this phase.
- No DB/cache runtime was added.
- No SQL file or migration was added or run.
- No external AI API was called.
- No public KIS data, `source=live`, or `source=auto` literal was introduced.
- No account/trading/order/balance API was referenced.
- No Vercel env change was made.
- No deployment was performed.
- No push was performed.
- No dependency or devDependency was added.
- No actual market value was used; all fixture data remains synthetic/mocked.
- No `.env` or `process.env` value was read.

## 7. Validation

The full required validation suite (the new Phase 3FA-B static checker, Phase 3FA-A, the
established Phase 3EZ-C / 3EZ-B / 3EZ-A / 3EX-E / 3EY-D / 3EY-C / 3EX-C / 3EW-C / 3EW-B / 3EW-A /
3EV-B / 3EV-A checkers/smokes, `check:provider-boundaries`, `check:kis-runtime-guard`,
`check:kis-error-fallback`, `check:production-domain`, `npm run build`, and `git diff --check`) was
run in the specified order. See the final phase report for the itemized pass/fail list of every
command.

## 8. Known Non-gating Notes

- `check:phase-3fa-a`, `check:phase-3ez-c`, `check:phase-3ez-b`, `check:phase-3ez-a`,
  `check:phase-3ex-e`, `check:phase-3ey-d`, and `check:phase-3ey-c` contain historical
  allowed-changed-path assertions scoped only to files known at their own authoring time; they do
  not account for this phase's new `src/lib/server/chartSimilarity/` files, and are expected to
  show a non-gating "allowed changed files" failure as a result.
- These historical checks remain useful for validating their own phase's other invariants and are
  not treated as gating for this phase.

## 9. Roadmap

- **3FA-C** — Owner-local KIS Similarity Smoke Harness, Disabled by Default
- **3FA-D** — Owner-local Manual Smoke Execution Closeout
- **3FB-A** — Limited Beta Readiness Review

## 10. Recommended Next Phase

- **Recommended**: Phase 3FA-C — Owner-local KIS Similarity Smoke Harness, Disabled by Default.
- **Alternative**: Phase 3EX-E-OWNER-RUNTIME-CHECK — Owner Runtime Check of Polished Chart Analysis
  Workspace.
