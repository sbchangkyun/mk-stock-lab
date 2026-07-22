# Phase 3FA-D-MANUAL-RUN-RETRY-HF1 — Targeted Owner-local KIS Provider Path Fix Result

## 1. Status

Completed with a real transport-layer blocker identified and isolated. No source code fix was
required or committed. KIS OHLC connectivity was not confirmed at the redacted status level in this
session — the blocker moved forward from a configuration gate to a genuine network-layer connection
failure, which is outside the scope of a code change in this repository.

## 2. Background

Credential readiness (`KIS_APP_KEY`, `KIS_APP_SECRET`, `KIS_BASE_URL`) was already confirmed present
by Phase 3FA-D-MANUAL-RUN-HF1. The Phase 3FA-D-MANUAL-RUN-RETRY attempt still failed with
`providerProbe.status: "fail"` before reaching normalized bars. This phase targeted that specific
provider-path blocker directly, instead of adding another generic check.

## 3. Root-cause Analysis

- **Entrypoint**: `scripts/smoke_phase_3fa_d_manual_run_owner_local_manual_smoke_execution.mjs` →
  `runApprovedManualSmoke()`.
- **Provider path**: `runOwnerLocalKisOhlcSmoke` (`kisOwnerLocalOhlcClient.ts`) →
  `defaultTransportKr` → `getKisDomesticDailyOhlcSeries` (`kisClient.ts`).
- **Pre-provider gates evaluated, in order**: owner-local mode/network/live-call gate (pass) →
  endpoint verification (pass) → market-support check (pass) → required KR credential env-name
  presence check (pass) → `getKisQuoteConfigReadiness()` in `kisClient.ts`.
- **Blocker 1 (first retry, resolved this phase)**: `getKisQuoteConfigReadiness()` requires a
  separate non-secret boolean feature flag, `KIS_ENABLE_LIVE_QUOTES`, to equal the exact string
  `"true"`. This flag was not present in the session, independent of the three credential env
  names, causing `reason: "disabled"` and a `CONFIG_MISSING` transport error. Category:
  **missing non-secret boolean feature flag** (configuration-only, not a credential or code issue).
- **Blocker 2 (surfaced after fixing Blocker 1)**: once `KIS_ENABLE_LIVE_QUOTES` was set for the
  current process only, the readiness gate passed and the client proceeded to a real network call.
  That call raised a JavaScript exception, sanitized by the existing `sanitizeUnknownError` handler
  into a generic `INTERNAL_ERROR`. Category: **real transport/network connectivity failure** — a
  TCP-level connection-establishment timeout while attempting to reach the configured KIS host from
  this session's network environment. This is not a credential problem, not a missing feature flag,
  and not a code defect in this repository's request-building or response-handling logic.
- **Configuration-only vs. source defect**: Blocker 1 was configuration-only (existing, working
  gate). Blocker 2 is an external network condition, not a source-code defect — no source fix was
  applicable.
- **Repeated command loop avoided**: the live retry command was run once under Blocker 1, then once
  more with the discovered flag set and a temporary, off-by-default, redacted-only diagnostic
  enabled to identify Blocker 2's category, then no further live retries were attempted once the
  category was known.

## 4. Fix / Gate Handling

No permanent source fix was applied, because no source-code defect was found. Handling used:

- **Gate enablement (Blocker 1)**: the existing, already-designed boolean feature flag
  `KIS_ENABLE_LIVE_QUOTES` was set only in the current process environment for the single retry
  invocation (via `$env:KIS_ENABLE_LIVE_QUOTES="true"` in the same PowerShell session as the
  approval flags). It was not written to any file, `.env`, or Vercel environment, and is not part of
  this commit.
- **Temporary diagnostic (Blocker 2 identification only)**: a small, off-by-default diagnostic was
  added to `kisClient.ts`'s two network catch sites, printing only the caught error's type name and
  a low-level network cause code (e.g. a connection-timeout code) to stderr, gated behind an
  explicit, non-default env flag. It never altered the returned, already-redacted error envelope. It
  was reverted after use and is not part of this commit, since it was diagnostic-only and no defect
  was found to warrant a permanent change.
- No values, URLs, headers, or payload content were printed at any point.

## 5. Approved Retry Result

- **credentialPreflightStatus**: `configured`
- **credentialReady**: `true`
- **approvedRetryRun**: `true`
- **resultStatus**: `failed_redacted`
- **decision**: `failed_before_provider_call`
- **providerProbeStatus**: `fail`
- **normalizedBarsAvailable**: `false`
- **normalizedBarCountBucket**: `none`
- **engineContractCheckStatus**: `not_run`
- **engineInvoked**: `false`
- **redactionCheckStatus**: `pass`
- **routeStatus**: `feature_disabled`
- **smokeExecuted**: `true`
- **rawValuesPrinted**: `false`
- **credentialsOrEnvPrinted**: `false`
- **identifiedBlockerCategory**: `missing_non_secret_feature_flag` (resolved this phase), followed by
  `real_transport_connectivity_failure` (unresolved, external to this codebase)
- **identifiedNonSecretGateNames**: `KIS_ENABLE_LIVE_QUOTES`
- **sourceFixApplied**: `false`
- **nextBlockerCategory**: `real_transport_connectivity_failure`

## 6. Boundary Preservation

`src/pages/api/chart-ai/similarity.ts` unchanged; route remains `feature_disabled`. `/chart-ai` UI
unchanged. Deterministic similarity engine unchanged and not invoked. No public or beta execution.
No auth runtime, usage storage, DB/cache runtime, SQL, or migration added. No account/trading/order/
balance API called. No new dependency. No deployment, no push. No raw KIS payload, OHLC value,
volume, timestamp, similarity score, return, credential, token, or environment value was printed or
committed. No new checker, harness, or credential-check layer was created. `kisClient.ts`'s
temporary diagnostic edit was reverted before commit, leaving the file identical to its prior
committed state.

## 7. Validation

- `npm run smoke:phase-3fa-d-manual-run-hf1-kis-credential-configuration-check` — `configured`,
  `readyForManualRunRetry: true`, exit `0`.
- `npm run smoke:phase-3fa-d-manual-run-owner-local-manual-smoke-execution -- --owner-approved-kis-call`
  (with `MKSTOCKLAB_OWNER_APPROVED_KIS_CALL=1`, `KIS_ENABLE_LIVE_QUOTES=true`) — redacted
  `failed_redacted` report, `providerProbe.status: "fail"` (`CONFIG_MISSING` — Blocker 1 confirmed).
- Same command re-run once with a temporary diagnostic flag enabled — redacted `failed_redacted`
  report, `providerProbe.status: "fail"` (`INTERNAL_ERROR` — Blocker 1 resolved, Blocker 2
  identified as a network-layer connect timeout via a safe, non-secret diagnostic line only).
- `git checkout -- src/lib/server/providers/kisClient.ts` — confirmed the temporary diagnostic edit
  was fully reverted; `git status --short` showed no tracked changes to this file afterward.
- `npm run build` — passed.
- `git diff --check` — passed.
- `git diff --name-only 5109489 -- src/pages src/pages/api src/lib/chartSimilarity src/data/chartSimilarity`
  — no output.
- `git diff --name-only 5109489 -- src/lib/server/providers/kis` — no output (no permanent change
  in this directory either, since the diagnostic edit was reverted).

**Known non-gating note**: this phase did not modify any source file, so no forbidden-path or
provider-path diff review beyond the confirmations above was necessary.

## 8. Files Changed

- `docs/planning/phase_3fa_d_manual_run_retry_hf1_targeted_kis_provider_path_fix_result_v0.1.md` —
  new result document (this file).
- `docs/planning/planning_changelog.md` — new top changelog entry.

No source files are part of this commit; the temporary `kisClient.ts` diagnostic was reverted.

## 9. Implementation Implication

`normalizedBarsAvailable` remains `false`. KIS OHLC connectivity is still not confirmed. The
blocker moved from a configuration gate (resolved) to a real network-layer connectivity condition
(a TCP connect timeout to the configured KIS host from this session's network environment). This is
not something a further code change in this repository can fix — it requires the owner to confirm,
from their own local network context, that outbound HTTPS access to the KIS host is actually
reachable (e.g. checking firewall, proxy, VPN, or DNS conditions), separately from this codebase.

## 10. Recommended Next Phase

Phase 3FA-D-MANUAL-RUN-RETRY-HF2 — Targeted Fix for Real Transport Connectivity Failure: the owner
should confirm outbound network reachability to the KIS host from the local session (outside this
repository), then re-run this same approved retry with `KIS_ENABLE_LIVE_QUOTES=true` set for that
session once reachability is confirmed. No further generic verification phase is recommended.
