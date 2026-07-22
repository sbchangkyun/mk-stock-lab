# Phase 3FA-D-MANUAL-RUN-RETRY — Owner-local KIS OHLC Smoke Retry Result (v0.1)

## 1. Status

Executed. The owner-approved owner-local KIS OHLC manual smoke retry was run once, under explicit
dual approval (CLI flag + env flag), and resolved to a redacted failed result. No source code
change was required or made — the existing manual-run script, manual-run module, and credential
check behaved exactly as designed.

## 2. Background

Phase 3FA-D-MANUAL-RUN-HF1 previously reported `status: "missing"` because required KIS credential
env key names were absent in that session. After the owner set the three required env key names at
the Windows User environment scope and restarted the host process (newly-set User-scope environment
variables are not inherited by already-running processes), the HF1 preflight check was re-run in
this session and reported `status: "configured"`, `decision: "ready_for_manual_run_retry"`,
`readyForManualRunRetry: true`. This phase reuses that confirmed-ready state to run the previously
approved manual-run retry and record only a redacted result.

## 3. Approval Scope

The owner approved a KIS OHLC call for this manual-run retry only, using the same dual-approval-flag
mechanism established in Phase 3FA-D-MANUAL-RUN (CLI flag `--owner-approved-kis-call` plus env flag
`MKSTOCKLAB_OWNER_APPROVED_KIS_CALL=1`). This approval does not extend to public execution, beta
execution, route success, API route integration, `/chart-ai` UI integration, auth runtime, usage
storage, DB/cache runtime, SQL/migration, deployment, push, raw KIS payload reporting, OHLC
price/volume/timestamp reporting, similarity score/return reporting, or credential/env echo.

## 4. Retry Command

Preflight (required before the retry):

```
npm run smoke:phase-3fa-d-manual-run-hf1-kis-credential-configuration-check
```

Approved retry (PowerShell, command shape only — no env values shown):

```
$env:MKSTOCKLAB_OWNER_APPROVED_KIS_CALL="1"
npm run smoke:phase-3fa-d-manual-run-owner-local-manual-smoke-execution -- --owner-approved-kis-call
```

## 5. Redacted Retry Result

- **Result status**: `failed_redacted`
- **Decision**: `failed_before_provider_call`
- **providerProbe.status**: `fail`
- **normalizedBarsAvailable**: `false`
- **normalizedBarCountBucket**: `none`
- **engineContractCheck.status**: `not_run`
- **engineInvoked**: `false`
- **redactionCheck.status**: `pass`
- **routeStatus**: `feature_disabled`
- **smokeExecuted**: `true`
- Raw values printed: `false`
- Credentials/env printed: `false`

The provider probe's safe message indicated a transport-level configuration gate, not a credential
presence problem — the three required KIS credential env key names were confirmed present by the
preflight check immediately beforehand. No raw KIS payload, OHLC price/volume/timestamp, similarity
score, return, credential, token, or environment value was printed or persisted at any point.

## 6. Boundary Preservation

No change to `src/pages/api/chart-ai/similarity.ts` (still feature-disabled). No change to the
`/chart-ai` UI. No change to the deterministic similarity engine (not invoked). No change to the
existing owner-local KIS OHLC client or the existing KIS client adapter. No change to the Phase
3FA-D-MANUAL-RUN or Phase 3FA-D-MANUAL-RUN-HF1 modules, fixtures, or scripts (behavior fully
preserved, no source modification was needed). No new phase, checker, harness, or credential-check
layer was created. No public or beta execution was enabled. No real auth runtime or usage storage
was implemented. No DB/cache runtime, SQL, or migration was added. No deployment and no push
occurred. No account/trading/order/balance API was called. No external AI call was made. No new
dependency was added. No `.env`/`process.env` value was printed or committed.

## 7. Validation

- `npm run smoke:phase-3fa-d-manual-run-hf1-kis-credential-configuration-check` — printed a redacted
  `configured` report, exit `0`.
- `npm run smoke:phase-3fa-d-manual-run-owner-local-manual-smoke-execution -- --owner-approved-kis-call`
  (with `MKSTOCKLAB_OWNER_APPROVED_KIS_CALL=1`) — printed a redacted `failed_redacted` report;
  redaction check passed.
- `npm run check:phase-3fa-d-manual-run-owner-local-manual-smoke-execution` — passed (script/module
  behavior unchanged).
- `npm run build` — passed.
- `git diff --check` — passed (no whitespace errors).
- `git diff --name-only 7025266 -- src/pages src/pages/api src/lib/server/providers src/lib/chartSimilarity src/data/chartSimilarity`
  — no output, confirming no forbidden-path source change occurred.

## 8. Implementation Implication

`providerProbe.status` resolved to `fail` (not `pass`) and `normalizedBarsAvailable` is `false`, so
KIS OHLC connectivity is not yet confirmed at the redacted status level. The safe transport message
indicates a configuration-gate condition distinct from credential presence — most likely an
additional, pre-existing, intentionally disabled feature gate in the established KIS client adapter
that is independent of the three required credential env key names checked by Phase
3FA-D-MANUAL-RUN-HF1. No raw detail about this gate is recorded here. The recommended next action is
a targeted, narrowly scoped follow-up to confirm and, if the owner approves, enable that additional
gate in the owner's own local session — not another generic planning or verification phase.

## 9. Recommended Next Phase

Phase 3FA-D-MANUAL-RUN-RETRY-HF1 — Targeted Owner-local KIS Provider Path Fix, to identify (without
printing any secret or raw value) the additional configuration condition that produced this
transport-level failure and, if the owner separately approves, re-run this retry.
