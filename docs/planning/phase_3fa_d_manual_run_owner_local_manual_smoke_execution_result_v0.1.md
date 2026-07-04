# Phase 3FA-D-MANUAL-RUN — Owner-local Manual Smoke Execution Result (v0.1)

## 1. Status

Implemented and executed. The manual-run module, fixtures, script, static checker, and package
scripts are in place. One owner-approved manual smoke attempt was made in this owner-local session
under both required approval flags; the redacted result is recorded below. No route, UI, auth,
storage, or deployment change occurred.

## 2. Approval

The owner explicitly approved a KIS call for this phase only ("Phase 3FA-D-MANUAL-RUN 진행, (KIS
호출 승인)"). This approval does not extend to route success, public/beta execution, DB/cache
storage, auth runtime, deployment, or push. The approved run was invoked only via the documented
dual-flag command (`--owner-approved-kis-call` CLI flag plus `MKSTOCKLAB_OWNER_APPROVED_KIS_CALL=1`
environment flag).

## 3. Implemented Scope

Added `similarityOwnerLocalManualRunTypes.ts` (manual-run status/decision/check-status/check/
policy/provider-probe/engine-contract-check/redaction-check/report/result types),
`similarityOwnerLocalManualRun.ts` (`buildDefaultSimilarityOwnerLocalManualRunPolicy`,
`buildApprovedSimilarityOwnerLocalManualRunPolicy`, `bucketNormalizedBarCount`,
`buildOwnerLocalManualRunPreflightChecks`, `buildOwnerLocalManualRunBlockedReport`,
`buildOwnerLocalManualRunRedactedReport`, `buildOwnerLocalManualRunResult`,
`sanitizeManualRunSerializedOutput`, `assertManualRunReportIsRedacted`),
`mockedSimilarityOwnerLocalManualRunFixtures.ts` (deterministic non-live fixtures), updated
`src/lib/server/chartSimilarity/index.ts` exports, a manual-run script
(`scripts/smoke_phase_3fa_d_manual_run_owner_local_manual_smoke_execution.mjs`) that reuses the
existing, already-approved owner-local KIS OHLC client (`runOwnerLocalKisOhlcSmoke`) rather than
creating a new client, and a new static checker (165 checks) with matching `package.json` script
entries.

## 4. Manual Run Result

The single owner-approved manual smoke attempt in this session resolved to redacted status
`failed_redacted`, decision `failed_before_provider_call`: the provider probe reported `blocked`
with `normalizedBarsAvailable: false` and bucket `none`, with the safe message "Required KIS
credential env names are not present in this session (3 missing); live smoke blocked." The engine
contract check was not run (`engineInvoked: false`) by design for this phase. The redaction check
reported `pass` with all four leak booleans `false`. No raw KIS payload, actual OHLC price/volume/
timestamp, similarity score/return, credential, token, or environment value was printed, persisted,
or is recorded anywhere in this document — only the redacted status fields above. All eleven
preflight checks resolved `pass`.

## 5. Preserved Boundaries

No change to `src/pages/api/chart-ai/similarity.ts` (still feature-disabled). No change to the
`/chart-ai` UI. No change to the deterministic similarity engine
(`src/lib/chartSimilarity/**`), which was not invoked. No change to the existing owner-local KIS
OHLC client (reused unmodified). Route success remains disabled regardless of the manual run
outcome. No public or beta execution was enabled. No real auth runtime or usage storage was
implemented. No DB/cache runtime, SQL, or migration was added. No deployment and no push occurred.
No account/trading/order/balance API was called. No external AI call was made. No new dependency
was added. No `.env`/`process.env` value was printed or committed.

## 6. Validation

The new Phase 3FA-D-MANUAL-RUN static checker (165 checks) passed, the manual-run script was run
both without approval flags (safe blocked report, exit `0`) and with both approval flags (the one
approved manual run, redacted `failed_redacted` result), followed by the Phase 3FA-D closeout
checker/smoke and the full established historical checker/smoke suite, `npm run build`, and
`git diff --check`; see the final phase report for the itemized pass/fail list, including any
expected non-gating failures in stale historical phase checkers caused by this phase's new files.

## 7. Known Non-gating Notes

Historical phase checkers with fixed `startingCommit`/`allowedChangedPaths` baselines are expected
to show stale "allowed changed files only" failures once this phase's new files exist under
`src/lib/server/chartSimilarity/`, consistent with the same non-gating pattern observed in prior
phases (3FA-C, 3FA-D).

## 8. Roadmap

Recommended next phase: Phase 3FB-A, to decide the next scoped step based on this manual run's
redacted outcome (e.g., diagnosing the missing KIS credential configuration in a future
owner-authorized session, or advancing route/UI integration under further separate owner
approval). Alternative: a follow-up owner-local credential-configuration check phase before any
further live KIS attempt.

## 9. Recommended Next Phase

Phase 3FB-A — to be scoped and separately authorized by the owner. No route, UI, auth, storage, or
deployment work is approved by this phase.
