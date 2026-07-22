# Phase 3FA-D-MANUAL-RUN-HF1 — Owner-local KIS Credential Configuration Check, No Secret Echo (v0.1)

## 1. Purpose

This phase adds an owner-local KIS credential configuration check. The prior Phase
3FA-D-MANUAL-RUN owner-approved manual smoke attempt resolved to `failed_redacted` because required
KIS credential env names were not present in that session. This phase adds a small, safe,
redacted/no-secret-echo check to answer, in advance of any future manual run, whether the required
credential configuration check env key names are present in the current session — without ever
performing a KIS call, without ever calling the API route, and without ever reading or printing an
actual environment value.

## 2. Scope

In scope: a new pure credential-check module and its types, deterministic mocked fixtures, a
throwaway smoke script that is the only place permitted to read `process.env` (presence-boolean
only), a static contract checker, matching `package.json` script entries, and planning/result docs.
Out of scope: any KIS call, any retry of the owner-approved manual smoke, any change to
`/api/chart-ai/similarity`, any change to `/chart-ai`, auth, storage, DB/cache, deployment, or push.

## 3. Background

The existing owner-local KIS OHLC client
(`src/lib/server/providers/kis/kisOwnerLocalOhlcClient.ts`) requires three env key names —
`KIS_APP_KEY`, `KIS_APP_SECRET`, `KIS_BASE_URL` — confirmed consistent across
`kisEnvContract.ts`, `kisOwnerLocalQuoteClient.ts`, `kisClient.ts`, and `providerEnv.ts`. This
credential-check module mirrors that required key name list locally, without importing the live
KIS provider/transport import chain, so this phase never pulls in a live KIS call path.

## 4. Credential Check Boundary

The reusable module (`similarityOwnerLocalCredentialCheck.ts`) never reads `process.env` or
`.env` itself — it only accepts a caller-supplied `Record<string, boolean>` presence map and
returns redacted status/decision fields, key names, and safe messages. Only the throwaway script
(`scripts/smoke_phase_3fa_d_manual_run_hf1_kis_credential_configuration_check.mjs`) is permitted to
read `process.env`, and only as a presence boolean (`typeof value === 'string' && value.trim().length
> 0`), never as an actual value, length, prefix, suffix, or hash. Neither the module nor the script
imports or calls a live KIS provider function, calls the API route, or imports an auth/storage/DB/
cache provider.

## 5. Check Flow

1. The script builds the required key list via `buildOwnerLocalCredentialKeyRequirements()`.
2. The script reads `process.env` presence only, for each required key name, producing a
   `Record<string, boolean>` presence map.
3. The presence map and requirements are passed into `buildOwnerLocalCredentialCheckReport()`,
   which is pure and never touches `process.env`.
4. The resulting report is wrapped into a result via `buildOwnerLocalCredentialCheckResult()`.
5. The serialized result is checked with `assertCredentialCheckReportHasNoSecretEcho()` before
   being printed; if that assertion fails, only a blocked message is printed and the process exits
   non-zero.

## 6. Report Shape

The report includes: `status` (`configured` | `missing` | `partial` | `blocked` | `not_checked`),
`decision` (`ready_for_manual_run_retry` | `missing_required_env` | `blocked_by_no_secret_echo_policy`
| `blocked_by_source_discovery_failure`), `source: 'owner-local'`, `requiredKeys` (name/required/
description/source only), `keyStatuses` (name/required/present/valueEchoed:false/safeMessage),
`missingKeyNames`, `presentKeyNames`, `readyForManualRunRetry`, and always-false `valueEchoed`/
`dotenvRead`/`kisCallAttempted`/`routeCallAttempted` flags, plus a `safeSummary` and `warnings`
array. No field in this shape can hold an actual environment value.

## 7. Future Retry Requirements

If this check reports `configured` (`readyForManualRunRetry: true`), a future, separately-approved
Phase 3FA-D-MANUAL-RUN-RETRY may reuse the existing owner-approved manual-run script under the same
dual-approval-flag policy already established in Phase 3FA-D-MANUAL-RUN. If this check reports
`partial` or `missing`, the owner must configure the missing env key(s) in their own local shell
session (never through this repository) before any future manual-run retry is attempted.

## 8. Roadmap

If configured: recommend Phase 3FA-D-MANUAL-RUN-RETRY (separately approved) as the next phase. If
missing or partial: recommend configuring the missing env key names locally, then re-running this
HF1 check. Alternative path: Phase 3FB-A may proceed without a KIS success confirmation, to scope
further non-KIS-dependent work.
