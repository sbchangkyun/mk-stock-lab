# Phase 3FA-D-MANUAL-RUN — Owner-local Manual Smoke Execution, Separately Approved (v0.1)

## 1. Purpose

Phase 3FA-D closed out the owner-local manual smoke execution readiness layer without executing
any live KIS call, and recommended Phase 3FA-D-MANUAL-RUN as a separately authorized next step.
This phase is that separately authorized step: it adds a manual-run module and script that may
perform one owner-approved, owner-local KIS OHLC probe for chart-similarity readiness, and reports
the outcome only through redacted status fields. It never changes the API route, the `/chart-ai`
UI, auth, usage storage, DB/cache, or deployment/push state.

## 2. Approval Scope

The owner explicitly approved a KIS call for this phase only, by stating approval for
"Phase 3FA-D-MANUAL-RUN 진행, (KIS 호출 승인)". This approval:

- Applies only to one owner-local manual KIS OHLC probe for chart-similarity readiness, in this
  phase.
- Does **not** approve public execution, beta execution, route success, API route integration,
  UI integration, DB/cache storage, auth runtime, deployment, or push.
- Is enforced in code by requiring both an explicit CLI flag (`--owner-approved-kis-call`) and an
  explicit environment flag (`MKSTOCKLAB_OWNER_APPROVED_KIS_CALL=1`) before any live provider call
  is attempted; without both flags, the manual-run script only ever produces a safe blocked report.

## 3. Current State

Before this phase: the `chartSimilarity` module tree contained a disabled-by-default plan
(3FA-A/3FA-B), a disabled-by-default smoke harness (3FA-C), and a closeout layer (3FA-D) that
never executed a live smoke and recorded `nextAllowedPhase: '3FA-D-MANUAL-RUN'`. The API route
(`src/pages/api/chart-ai/similarity.ts`) remained feature-disabled and unchanged. A separate,
already-approved and already-committed owner-local KIS OHLC smoke client
(`runOwnerLocalKisOhlcSmoke` in `src/lib/server/providers/kis/kisOwnerLocalOhlcClient.ts`, Phase
3ES) already existed and was safety-reviewed, but had not yet been exercised from within this
manual-run layer.

## 4. Manual Run Boundary

This phase reuses the existing, already-approved owner-local KIS OHLC client rather than creating
a new raw KIS client. The only new live-call surface is the manual-run script
(`scripts/smoke_phase_3fa_d_manual_run_owner_local_manual_smoke_execution.mjs`), which:

- Never attempts a live call unless both the CLI flag and the env flag are present.
- Never reads `process.env` or `.env` values inside the manual-run module itself — the script
  supplies an explicit approved policy/context once its own approval flags are satisfied.
- Never calls the API route, never starts a dev server or browser, never touches a DB/cache, and
  never calls an account/trading/order/balance API.
- Never invokes the deterministic similarity engine (`src/lib/chartSimilarity/**`) in this phase;
  the engine contract check is recorded as `not_run` by design.
- Never prints the literal test symbol; only a generic "Owner-local test symbol configured."
  message is printed.

## 5. Manual Run Flow

1. Parse CLI args and environment for both approval flags.
2. If either flag is missing: build the default (disabled) policy, build the safe blocked report,
   assert it is redacted, print it, and exit `0`.
3. If both flags are present: build the approved policy, construct an owner-local execution
   context (`{ mode: 'owner-local', allowNetwork: true, allowKisLive: true }`), and call the
   existing `runOwnerLocalKisOhlcSmoke` client with a fixed, safe, well-known test request.
4. Convert the client's result into a redacted `providerProbe` (status/bucketed bar count/safe
   message only — no raw OHLC values).
5. Record the engine contract check as `not_run` (engine not invoked in this phase) and the
   redaction check as `pass` (no raw fields present by construction).
6. Build the final redacted report and result, assert it is fully redacted, and print only that
   redacted JSON. If the assertion fails, print a safe failure line instead and exit non-zero.

## 6. Redacted Report Shape

The manual run report and result expose only:

- `status` (`not_run` / `blocked` / `executed_redacted` / `failed_redacted`)
- `decision` (`owner_approved_manual_run` / `blocked_by_missing_approval` / `blocked_by_policy` /
  `failed_before_provider_call` / `failed_after_redaction`)
- `smokeExecuted` (boolean)
- `source` (`'owner-local'`), `routeStatus` (`'feature_disabled'`)
- `providerProbe` (status/provider/market/timeframe/`normalizedBarsAvailable`/bucketed count/safe
  message only — no raw values)
- `engineContractCheck` (status/`engineInvoked`/safe message only)
- `redactionCheck` (status plus four `false` booleans confirming nothing raw was printed)
- `checks` (eleven named preflight checks with safe messages)
- `safeSummary` and `warnings` (static, non-sensitive strings)

## 7. Prohibited Output

The manual run module and script never print or persist: a raw KIS payload field, an actual OHLC
price/volume/timestamp, a similarity score or derived return computed from real data, a
credential/token/env value, an account/trading/order/balance field, or `source: "live"`/`"auto"`
in any redacted report. A defense-in-depth `assertManualRunReportIsRedacted` check, scoped to JSON
`"key": value` shapes (not bare English prose words), gates every printed report.

## 8. Validation Strategy

A static contract checker
(`scripts/check_phase_3fa_d_manual_run_owner_local_manual_smoke_execution_contract.mjs`) verifies
file presence, type/module/fixture shape, forbidden-pattern exclusions, unchanged route/UI/engine/
existing-KIS-client files, allowed-changed-files-only, and documentation content — all without any
network access. The smoke script itself is run twice: once with no approval flags (must produce a
safe blocked report) and once with owner approval (the one approved manual live probe for this
phase).

## 9. Roadmap After Manual Run

Recommended next phase: Phase 3FB-A (or a next owner-authorized phase) to evaluate the actual
manual run outcome and decide the next scoped step (e.g., extending the KIS OHLC provider
foundation, or advancing route/UI integration under further separate owner approval). No route,
UI, auth, storage, or deployment work is approved by this phase.
