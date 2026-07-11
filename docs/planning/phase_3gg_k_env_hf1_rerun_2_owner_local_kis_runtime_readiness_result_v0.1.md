# Phase 3GG-K-ENV-HF1-RERUN-2 -- Confirm Owner-local KIS Runtime Readiness After Full Dev Server Restart Result

- **Status: Still blocked (classification: STILL_BLOCKED_DEV_SERVER_ENV_STALE)**
- **Baseline: d946eeb**
- **Branch: rebuild/phase-1-ia-shell**
- **HEAD before: d946eebdc2f8776d957eef6d22d0ecf200472d87**
- **HEAD after: (recorded at commit time, see final report)**

## 1. Purpose

Re-run the existing, unmodified owner-local KIS runtime readiness diagnostic after the owner was
instructed to fully kill every existing `npm run dev`/`astro dev` process, re-verify
`KIS_ENABLE_LIVE_QUOTES=true` locally, and start exactly one fresh dev server from the project
root, in order to confirm whether the previously observed `STILL_BLOCKED_ENV_MISSING` state
(Phase 3GG-K-ENV-HF1-RERUN) is now resolved. This is a diagnostic rerun phase only -- it
introduces no source feature change, no UI change, no KIS endpoint expansion, and reuses the
existing owner-gated diagnostic script byte-for-byte.

## 2. Files changed

- Created: `docs/planning/phase_3gg_k_env_hf1_rerun_2_owner_local_kis_runtime_readiness_result_v0.1.md`
- Created: `scripts/check_phase_3gg_k_env_hf1_rerun_2_contract.mjs`
- Modified: `package.json` (one new script entry)
- Modified: `docs/planning/planning_changelog.md` (new entry prepended)
- Not modified: `scripts/owner_diagnostic_phase_3gg_k_env_hf1_kis_runtime_readiness.mjs` (reused as-is)
- No sibling checker required a compatibility patch this phase (see Section 12).

## 3. Source diff status

No diff against baseline `d946eeb` for any of: `scripts/owner_diagnostic_phase_3gg_k_env_hf1_kis_runtime_readiness.mjs`,
`src/lib/server/providers/kisClient.ts`, `src/lib/server/chart-ai/local-only-live-kis-market-data-binding.mjs`,
`src/pages/api/chart-ai/local-only-kis-current-price.json.ts`, `src/pages/api/chart-ai/local-only-kis-llm-summary.json.ts`,
`src/lib/server/chart-ai/local-only-llm-runtime-bridge.mjs`, `src/lib/server/chart-ai/local-only-llm-model-policy.mjs`,
`src/pages/chart-ai.astro`, or any KIS provider candidate path. This phase makes no source feature change.

## 4. Owner precondition summary

The owner was instructed to: (1) fully kill every running `npm run dev`/`astro dev`/related node
process; (2) verify `.env`/`.env.local` contains exactly `KIS_ENABLE_LIVE_QUOTES=true`; (3) save the
file; (4) start exactly one fresh `npm run dev` from the project root. `.env`/`.env.local` were
never opened, read, or printed by this phase at any point -- only OS-level process metadata
(PID, creation timestamp, listening ports -- no env values, no secret values) and the existing
sanitized diagnostic/G-FAST scripts were used to observe the outcome.

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

`KIS_ENABLE_LIVE_QUOTES` exactly `'true'` in the diagnostic script's own process: **false** --
unchanged from Phase 3GG-K-ENV-HF1-RERUN. Per the Section 5 caveat carried over from every prior
phase in this family, this value reflects the diagnostic script's own isolated `node` process
env, not necessarily the dev server's -- but see Section 9 for a more direct, independent finding
this phase.

## 9. Dev server reachability

`http://localhost:4321/` was **not reachable** this phase (curl connection failed, exit code 7 --
connection refused, retried once after a short wait with the same result). `devServerReachable`:
**false**.

## 10. Dev server freshness after owner restart

`devServerFreshAfterOwnerRestart`: **false**.

Evidence basis (OS process metadata only -- no env values, no secret values, no request/response
bodies read):

- An OS-level process listing (`Get-CimInstance Win32_Process -Filter "Name = 'node.exe'"`) found
  an `astro dev` process (command line `... astro.mjs dev`) with **the exact same process ID and
  the exact same creation timestamp** as the process observed during Phase 3GG-K-ENV-HF1-RERUN
  (started `2026-07-11 11:20:52`, ~19 minutes old at that time; still the same creation timestamp
  now, one phase later). This is direct evidence that the dev server process was **not** stopped
  and restarted between the two rerun phases.
- That same still-running process was found bound to TCP ports `5173` and `5174` (Vite's own
  default dev ports), not port `4321` -- consistent with a leftover/orphaned dev server instance
  rather than the expected fresh `npm run dev` session serving the project's configured port.
- No process was found listening on port `4321` at all (`Get-NetTCPConnection -LocalPort 4321`
  returned no results; `netstat -ano | findstr 4321` returned no results).

## 11. G-FAST current_price route result

Both checks failed to connect rather than reporting a fail-closed application response:

- The owner diagnostic reported `devServerReachable: false`, `currentPriceRouteReachable: false`,
  `hRouteReachable: false`, `sourceStatus: null`, `sanitizedErrorCode: null`.
- The G-FAST owner smoke independently reported `BLOCKED: reason=local-dev-server-unreachable`.

This is a materially different signature from the prior two phases (which both got a real
`sourceStatus: unavailable` / `sanitizedErrorCode: PROVIDER_UNAVAILABLE` HTTP response from a live
route) -- this phase's evidence points to no correctly-configured server being reachable at the
expected local address at all, not to a readiness-gate rejection from a live server.

## 12. H route result

Not reachable this phase (`hRouteReachable: false`, same connectivity failure as the current_price
route -- consistent with no server listening at the expected address, not a route-specific issue).

## 13. sourceStatus

`null` (no HTTP response was obtained -- the request could not connect).

## 14. sanitizedErrorCode

`null` (no HTTP response was obtained). The diagnostic script's own classification for this exact
combination is `BLOCKED_UNKNOWN`; this result doc narrows that further using the Section 10 process
evidence (see Section 15 rationale).

## 15. currentPricePresent / volumePresent

`currentPricePresent`: **false**. `volumePresent`: **false**.

## 16. Classification

**STILL_BLOCKED_DEV_SERVER_ENV_STALE**

Rationale: the diagnostic script's raw output alone classifies this as `BLOCKED_UNKNOWN` (no
route response was obtained at all), but the additional sanitized process evidence gathered in
Section 10 -- the exact same process ID and creation timestamp as the prior rerun phase, now bound
to Vite's fallback ports `5173`/`5174` instead of the project's configured `4321` -- directly
matches this classification's own definition ("likely old dev server process or wrong
project/session"). The most parsimonious explanation is that the owner's env edit was not
verified against a genuinely fresh server: the previous dev server process from Phase
3GG-K-ENV-HF1-RERUN (or earlier) was never actually killed, is still running as an orphaned/stale
instance, and is no longer even bound to the expected port -- so no request from this phase's
diagnostic could reach any dev server at `http://localhost:4321/`, whether corrected or not.

## 17. Owner-safe next action

1. Fully close **every** terminal/window that might be running `npm run dev` or `astro dev` for
   this project, including any that may have been left open from a previous session.
2. Confirm via Task Manager (or an equivalent OS process list) that there is no lingering
   `node.exe` process still running `astro.mjs dev` or `npm run dev` for this project before
   proceeding -- if one is found, end that process explicitly.
3. Re-open `.env` or `.env.local` locally (owner only, not in chat) and re-confirm the line reads
   exactly `KIS_ENABLE_LIVE_QUOTES=true` with no typo, no extra whitespace, no surrounding quotes,
   and is not commented out (no leading `#`). Save the file.
4. Start exactly **one** fresh `npm run dev` process from the project root
   (`C:\Users\kkama\OneDrive\문서\Project\mk-stock-lab`) and wait for it to print that it is ready
   and listening on port `4321` specifically (not a fallback port like `5173`/`5174` -- a fallback
   port itself is a signal that another process is still holding `4321`).
5. Re-run this same Phase 3GG-K-ENV-HF1-RERUN-2 diagnostic
   (`npm run owner-diagnostic:phase-3gg-k-env-hf1 -- --owner-approved-kis-runtime-diagnostic
   --base-url=http://localhost:4321`).
6. If the dev server is then reachable at `4321` but `KIS_ENABLE_LIVE_QUOTES_exactly_true` is
   still `false`, the blocker narrows back to `STILL_BLOCKED_ENV_MISSING` -- re-verify the exact
   env line locally. If it is `true` but the route still reports `unavailable`, this narrows to
   `STILL_BLOCKED_PROVIDER_AUTH` or `STILL_BLOCKED_PROVIDER_NETWORK`.

## 18. Exposure status

- Credential exposure status: **Not exposed**
- Raw KIS payload exposure status: **Not exposed**
- Raw LLM response exposure status: **Not exposed**
- Prompt exposure status: **Not exposed**
- currentPrice numeric exposure status: **Not exposed**
- volume numeric exposure status: **Not exposed**

## 19. KIS endpoint expansion status

None. `current_price` only, unchanged from baseline.

## 20. Validation results

- `npm run owner-diagnostic:phase-3gg-k-env-hf1 -- --owner-approved-kis-runtime-diagnostic --base-url=http://localhost:4321`: ran, reported classification `BLOCKED_UNKNOWN` at the script's own raw level (exit code 1, expected for a blocked outcome); refined to `STILL_BLOCKED_DEV_SERVER_ENV_STALE` in this result doc using additional sanitized process evidence.
- `npm run owner-smoke:phase-3gg-g-fast -- --owner-approved-real-kis-smoke`: ran, reported `BLOCKED: reason=local-dev-server-unreachable` (exit code 1, expected).
- `npm run check:phase-3gg-k-env-hf1-rerun-2`: PASS (see commit log for count).
- `npm run check:phase-3gg-k-env-hf1-rerun`: PASS (regression).
- `npm run check:phase-3gg-k-env-hf1`: PASS (regression).
- `npm run build`: succeeded.
- `git diff --check`: clean.

## 21. Push/deploy status

**Not pushed. Not deployed.**

## 22. Next recommended phase

Because this phase's classification is `STILL_BLOCKED_DEV_SERVER_ENV_STALE`, not
`PASS_CURRENT_PRICE_READY`: the owner must fully kill all node/dev processes (verifying via an OS
process list, not just closing the terminal window) and start exactly one fresh dev server from
the project root confirmed to be listening on port `4321`, then repeat this same Phase
3GG-K-ENV-HF1-RERUN-2 diagnostic again. Only once `PASS_CURRENT_PRICE_READY` is confirmed should
**Phase 3GG-K-QA-OWNER-RERUN-2 -- Verify Success-path Summary Quality After KIS Runtime
Correction** run.
