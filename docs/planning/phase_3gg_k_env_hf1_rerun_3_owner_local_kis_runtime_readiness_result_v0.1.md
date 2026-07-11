# Phase 3GG-K-ENV-HF1-RERUN-3 -- Confirm Owner-local KIS Runtime Readiness After Verified Port 4321 Restart Result

- **Status: Still blocked (classification: STILL_BLOCKED_ENV_MISSING)**
- **Baseline: 62d888c**
- **Branch: rebuild/phase-1-ia-shell**
- **HEAD before: 62d888c1d8f97cf7c2d0a3b4fd5a5dfe59811302**
- **HEAD after: (recorded at commit time, see final report)**

## 1. Purpose

Re-run the existing, unmodified owner-local KIS runtime readiness diagnostic now that the owner has
verified a clean dev server restart: old dev processes killed, ports `4321`/`5173`/`5174` confirmed
empty beforehand, `npm run dev` restarted from the project root, and Astro reporting
`Local http://localhost:4321/`. This is a diagnostic rerun phase only -- it introduces no source
feature change, no UI change, no KIS endpoint expansion, and reuses the existing owner-gated
diagnostic script byte-for-byte.

## 2. Files changed

- Created: `docs/planning/phase_3gg_k_env_hf1_rerun_3_owner_local_kis_runtime_readiness_result_v0.1.md`
- Created: `scripts/check_phase_3gg_k_env_hf1_rerun_3_contract.mjs`
- Modified: `package.json` (one new script entry)
- Modified: `docs/planning/planning_changelog.md` (new entry prepended)
- Not modified: `scripts/owner_diagnostic_phase_3gg_k_env_hf1_kis_runtime_readiness.mjs` (reused as-is)

## 3. Source diff status

No diff against baseline `62d888c` for any of: `scripts/owner_diagnostic_phase_3gg_k_env_hf1_kis_runtime_readiness.mjs`,
`src/lib/server/providers/kisClient.ts`, `src/lib/server/chart-ai/local-only-live-kis-market-data-binding.mjs`,
`src/pages/api/chart-ai/local-only-kis-current-price.json.ts`, `src/pages/api/chart-ai/local-only-kis-llm-summary.json.ts`,
`src/lib/server/chart-ai/local-only-llm-runtime-bridge.mjs`, `src/lib/server/chart-ai/local-only-llm-model-policy.mjs`,
`src/pages/chart-ai.astro`, or any KIS provider candidate path. This phase makes no source feature change.

## 4. Owner precondition summary

The owner reported having: (1) killed all dev-related node processes; (2) confirmed no `netstat`
output on ports `4321`, `5173`, or `5174` before restarting; (3) restarted `npm run dev` from
`C:\Users\kkama\OneDrive\문서\Project\mk-stock-lab`; (4) observed Astro report
`Local http://localhost:4321/`. `.env`/`.env.local` were never opened, read, or printed by this
phase at any point -- only sanitized OS-level process/port metadata (PID, creation timestamp,
listening ports -- no env values, no secret values) and the existing sanitized diagnostic/G-FAST
scripts were used to independently verify the outcome.

## 5. Diagnostic command used

```
npm run owner-diagnostic:phase-3gg-k-env-hf1 -- --owner-approved-kis-runtime-diagnostic --base-url=http://localhost:4321
```

Corroborated with:

```
npm run owner-smoke:phase-3gg-g-fast -- --owner-approved-real-kis-smoke
```

## 6. Env key names checked

`KIS_APP_KEY`, `KIS_APP_SECRET`, `KIS_BASE_URL`, `KIS_ENABLE_LIVE_QUOTES`, `KIS_ACCOUNT_NO` (same
set as prior phases, read only from the diagnostic script's own process, never from
`.env`/`.env.local`).

## 7. Env presence boolean summary

- `KIS_APP_KEY` present: **true**
- `KIS_APP_SECRET` present: **true**
- `KIS_BASE_URL` present: **true**
- `KIS_ACCOUNT_NO` absent (required for quote-only scope): **true**

## 8. KIS_ENABLE_LIVE_QUOTES true/false summary

`KIS_ENABLE_LIVE_QUOTES` exactly `'true'`: **false**. This value was independently corroborated by
the live dev server route response itself (see Section 11), not just the diagnostic script's own
isolated process env -- both signals now agree, unlike the earlier ENV-HF1-RERUN phase where the
dev server was unreachable and could not corroborate anything.

## 9. Dev server reachability

`http://localhost:4321/` was **reachable** this phase: a direct `curl` request returned
`HTTP 200`. `devServerReachable`: **true**.

## 10. Dev server listening on 4321

**true.** Sanitized port-listener inspection (`Get-NetTCPConnection -LocalPort 4321,5173,5174`)
found exactly one listener, bound to port `4321`, owned by a single `node.exe` process. No listener
was found on `5173` or `5174` -- confirming the owner's report that those fallback ports are now
empty and only one dev server instance is running.

## 11. Dev server freshness after owner restart

`devServerFreshAfterOwnerRestart`: **true**.

Evidence basis (OS process metadata only -- no env values, no secret values, no request/response
bodies read):

- The `node.exe` process now listening on port `4321` has a **different process ID and a later
  creation timestamp** than the stale/orphaned process observed during Phase 3GG-K-ENV-HF1-RERUN-2
  (which was bound to ports `5173`/`5174`, not `4321`, and had not changed since the earlier
  Phase 3GG-K-ENV-HF1-RERUN). This is direct evidence that a genuinely new dev server process is
  now serving the expected port.
- No process was found listening on `5173` or `5174` at all -- consistent with the owner's report
  that the old leftover instance was actually terminated this time, not merely left running on a
  fallback port.
- This is corroborated functionally: unlike the prior rerun-2 phase (which failed to connect at
  all, `sourceStatus: null`), this phase's diagnostic and G-FAST smoke both received a real,
  well-formed HTTP response from the current_price route (`sourceStatus: "unavailable"`), which is
  only possible if a live, correctly-routed Astro dev server is actually answering on `4321`.

## 12. G-FAST current_price route result

Both checks reached a live route and received a real, fail-closed application response (not a
connection failure):

- The owner diagnostic reported `devServerReachable: true`, `currentPriceRouteReachable: true`,
  `hRouteReachable: true`, `sourceStatus: "unavailable"`, `sanitizedErrorCode: "PROVIDER_UNAVAILABLE"`,
  `currentPricePresent: false`, `volumePresent: false`.
- The G-FAST owner smoke independently reported
  `BLOCKED: reason=fail-closed-or-unavailable sourceStatus=unavailable sanitizedErrorCode=PROVIDER_UNAVAILABLE`.

This matches the exact same readiness-gate rejection signature observed during the original Phase
3GG-K-ENV-HF1 and Phase 3GG-K-ENV-HF1-RERUN phases -- a live server correctly reachable at `4321`,
but the KIS readiness gate inside `kisClient.ts` still rejects before any network call, consistent
with `KIS_ENABLE_LIVE_QUOTES` still not being exactly `'true'` in the dev server's own environment.

## 13. H route result

Reachable this phase (`hRouteReachable: true`), consistent with a correctly-routed live Astro
server; not independently exercised beyond the diagnostic's own reachability check (no LLM bridge
call was made, per this phase's current_price-only scope).

## 14. sourceStatus

`"unavailable"`

## 15. sanitizedErrorCode

`"PROVIDER_UNAVAILABLE"`

## 16. currentPricePresent / volumePresent

`currentPricePresent`: **false**. `volumePresent`: **false**.

## 17. Classification

**STILL_BLOCKED_ENV_MISSING**

Rationale: this phase's own classification criteria for `STILL_BLOCKED_ENV_MISSING` are met exactly
-- `devServerReachable=true` AND `KIS_ENABLE_LIVE_QUOTES` is still not exactly `'true'` (or required
env presence is still missing). The dev server restart precondition is now confirmed genuinely
satisfied (Section 11), which rules out `STILL_BLOCKED_DEV_SERVER_ENV_STALE` for this phase. The
live route itself corroborates the diagnostic's own process-level env reading by independently
returning the same `PROVIDER_UNAVAILABLE` readiness-gate rejection, so this is not a provider auth
or network failure (both of which require env booleans to appear ready first) -- it is a genuine,
now-unambiguous env-configuration gap.

## 18. Owner-safe next action

1. Re-open `.env` or `.env.local` locally (owner only, not in chat) and re-confirm the line reads
   exactly `KIS_ENABLE_LIVE_QUOTES=true` with no typo, no extra whitespace, no surrounding quotes,
   and is not commented out (no leading `#`).
2. Save the file, then **fully restart** `npm run dev` again (the dev server must be restarted
   after any `.env`/`.env.local` edit -- Vite/Astro does not hot-reload environment variable
   changes).
3. Re-run this same diagnostic
   (`npm run owner-diagnostic:phase-3gg-k-env-hf1 -- --owner-approved-kis-runtime-diagnostic
   --base-url=http://localhost:4321`).
4. If `KIS_ENABLE_LIVE_QUOTES_exactly_true` is then `true` but the route still reports
   `unavailable`, the blocker narrows to `STILL_BLOCKED_PROVIDER_AUTH` or
   `STILL_BLOCKED_PROVIDER_NETWORK`, and Phase 3GG-K-ENV-HF2 should follow.

## 19. Exposure status

- Credential exposure status: **Not exposed**
- Raw KIS payload exposure status: **Not exposed**
- Raw LLM response exposure status: **Not exposed**
- Prompt exposure status: **Not exposed**
- currentPrice numeric exposure status: **Not exposed**
- volume numeric exposure status: **Not exposed**

## 20. KIS endpoint expansion status

None. `current_price` only, unchanged from baseline.

## 21. Validation results

- `npm run owner-diagnostic:phase-3gg-k-env-hf1 -- --owner-approved-kis-runtime-diagnostic --base-url=http://localhost:4321`: ran, reported classification `BLOCKED_ENV_MISSING` (exit code 1, expected for a blocked outcome); recorded as `STILL_BLOCKED_ENV_MISSING` in this result doc.
- `npm run owner-smoke:phase-3gg-g-fast -- --owner-approved-real-kis-smoke`: ran, reported `BLOCKED: reason=fail-closed-or-unavailable sourceStatus=unavailable sanitizedErrorCode=PROVIDER_UNAVAILABLE` (exit code 1, expected).
- `npm run check:phase-3gg-k-env-hf1-rerun-3`: PASS (see commit log for count).
- `npm run check:phase-3gg-k-env-hf1-rerun-2`: PASS (regression).
- `npm run check:phase-3gg-k-env-hf1-rerun`: PASS (regression).
- `npm run check:phase-3gg-k-env-hf1`: PASS (regression).
- `npm run build`: succeeded.
- `git diff --check`: clean.

## 22. Push/deploy status

**Not pushed. Not deployed.**

## 23. Next recommended phase

Because this phase's classification is `STILL_BLOCKED_ENV_MISSING`, not `PASS_CURRENT_PRICE_READY`:
the owner must re-check the exact local `.env`/`.env.local` line
(`KIS_ENABLE_LIVE_QUOTES=true`, no typo/quotes/comment), save, fully restart `npm run dev` again
(env changes require a restart, not just a save), and repeat this same diagnostic. Only once
`PASS_CURRENT_PRICE_READY` is confirmed should **Phase 3GG-K-QA-OWNER-RERUN-2 -- Verify
Success-path Summary Quality After KIS Runtime Correction** run.
