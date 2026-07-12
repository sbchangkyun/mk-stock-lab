# Phase 3GG-L-BETA-DEPLOY-RERUN-3 — Protected Preview Beta Deploy Execution Result

## Status

BLOCKED (build-environment failure). The owner-gated Deployment Protection blocker from Phase
3GG-L-BETA-DEPLOY-RERUN-2 is resolved, but a new, unrelated blocker was discovered during the Vercel
Preview build step: `vercel build` cannot complete in this local OneDrive-synced workspace.

## Classification

`BLOCKED_VERCEL_BUILD_FAILED`

## Baseline

`a61fd3b` (Phase 3GG-L-BETA-DEPLOY-RERUN-2)

## Branch

`rebuild/phase-1-ia-shell`

## HEAD before

`a61fd3bc8286aaf910170fd93b9f7d0fa96ed83d`

## HEAD after

(recorded in the final report after commit)

## Purpose

Complete the protected Vercel Preview beta deployment now that Deployment Protection is
owner-confirmed enabled (Vercel Authentication, Require Log In ON, Standard Protection, confirmed
from the Vercel Dashboard screenshot), the project link is confirmed, Preview env names were
confirmed present in Phase 3GG-L-BETA-DEPLOY-RERUN-2, and `KIS_ACCOUNT_NO` was confirmed absent.

## Files changed

- Created: `docs/planning/phase_3gg_l_beta_deploy_rerun_3_protected_preview_beta_deploy_result_v0.1.md` (this file)
- Created: `scripts/check_phase_3gg_l_beta_deploy_rerun_3_contract.mjs`
- Modified: `package.json` (1 script entry added)
- Modified: `docs/planning/planning_changelog.md` (1 entry prepended)

## Source diff status

Zero source diff vs baseline `a61fd3b`. This is a deploy/documentation-only phase; no source feature
files, KIS provider files, LLM bridge/model-policy files, the beta guard, `chart-ai.astro`, MK Agent,
Similar Pattern agent, the guarded productization scaffold, `components/`, `supabase/`, `src/data/`,
or any lockfile were touched.

## Vercel CLI status

- `vercelCliAvailable`: true
- `vercelCliVersion`: 54.9.1
- `vercelAuthenticated`: true (account handle only, no token printed)

## Vercel project link status

- `vercelProjectLinked`: true — confirmed via `.vercel/repo.json` (this CLI version's repo-link
  format) and `vercel project ls --scope sbchangkyun-2946s-projects`, which returned project
  `mkstocklab` with a live Production URL.

## Deployment Protection status

- `deploymentProtectionVerified`: true
- `deploymentProtectionMethod`: `vercel-authentication-owner-dashboard-confirmed`
- Source of confirmation: owner-provided Vercel Dashboard screenshot for project `mkstocklab`:
  - Deployment Protection: enabled
  - Method: Vercel Authentication
  - Require Log In: ON
  - Mode: Standard Protection
- Per this phase's explicit instructions, this owner confirmation is treated as verified. No raw
  `vercel api` call was attempted to re-verify it.

## Preview env name presence booleans

All required Preview env names are present (checked via `vercel env ls preview`, names only, no
values retrieved or printed; no `vercel env pull` was run):

- `KIS_APP_KEY` present: true
- `KIS_APP_SECRET` present: true
- `KIS_BASE_URL` present: true
- `KIS_ENABLE_LIVE_QUOTES` present: true
- `KIS_ENABLE_PREVIEW_LIVE_QUOTES` present: true
- `CHART_AI_ENABLE_LOCAL_LLM` present: true
- `OPENAI_API_KEY` present: true
- `CHART_AI_LLM_MODEL` present: true (satisfies "CHART_AI_LLM_MODEL or CHART_AI_LLM_MAIN_MODEL")
- `CHART_AI_ENABLE_PROTECTED_PREVIEW_BETA` present: true

## KIS_ACCOUNT_NO Preview env status

`KIS_ACCOUNT_NO` absent: true (not listed among the project's Preview env names).

## Local regression preflight result

All four owner-local checks PASS against `http://localhost:4321`:

- HF5 local provider runtime-env diagnostic: PASS — `finalClassification: FIXED_RUNTIME_FLAG_INJECTION_CURRENT_PRICE_READY`, `sourceStatus: ok`, `currentPricePresent: true`, `volumePresent: true`.
- G-FAST real KIS current_price smoke: PASS — `sourceStatus: ok`, `currentPricePresent: true`, `volumePresent: true`, `sanitized: true`.
- HF6 LLM runtime-env diagnostic: PASS — `finalClassification: FIXED_LLM_RUNTIME_ENV_READY`, `summary.ok: true`, `llmStatus: ok`, `summaryLineCount: 3`, `requiredLabelsPresent: true`, `asciiDigitPresentInSummary: false`, `forbiddenInvestmentPhrasePresent: false`.
- L-FAST LLM quality regression (repeat=1): PASS — `finalClassification: PASS_LLM_QUALITY_REGRESSION`, `runCount: 1`, `passCount: 1`, `failCount: 0`, `exposureDetected: false`.

## npm build result

PASS. `npm run build` (local, uses this project's temp-directory OneDrive workaround) completed
cleanly; `postbuild` repair script ran successfully.

## Vercel build result

FAIL — reproducible. `vercel build --yes` (Preview environment only; the `--prod` flag was never used)
was attempted twice and failed identically both times with:

```
Command "npm run build" exited with 3221226505
```

`3221226505` decodes to Windows status code `0xC0000409`
(`STATUS_STACK_BUFFER_OVERRUN`, i.e. a native-process fail-fast crash), reproducible at the identical
point in the build both times — immediately after Astro's `Rearranging server assets... Completed`
step and before the `@astrojs/vercel` adapter's function-bundling step could finish.

### Root cause (diagnosed, no source/config file modified)

This project's `astro.config.mjs` already contains a documented, pre-existing workaround:

```js
const isLocalOneDriveWorkspace =
  !process.env.CI &&
  !process.env.VERCEL &&
  process.cwd().toLowerCase().includes('onedrive');

outDir: isLocalOneDriveWorkspace ? localBuildOutDir : './dist',
```

`vercel build` sets `process.env.VERCEL=1` internally to emulate the cloud build environment. This
unconditionally disables the `isLocalOneDriveWorkspace` check (regardless of the actual working
directory), so Astro writes its server build output directly into this repo's OneDrive-synced
directory (`...\OneDrive\문서\Project\mk-stock-lab\dist\`) instead of the safe OS temp directory that
plain `npm run build` uses. The `@astrojs/vercel` adapter's esbuild-based function-bundling step then
crashes while reading/writing inside that OneDrive-synced, Unicode-path directory.

This was confirmed reproducible a third time with a direct, non-Vercel repro:
`VERCEL=1 npm run build` (run standalone, no Vercel CLI involved) failed at the exact same point,
isolating the cause to the `VERCEL` environment variable disabling the existing OneDrive safeguard —
not to Vercel CLI internals, network, credentials, or any KIS/LLM source path.

This is a **local build-environment limitation specific to running `vercel build` inside this
OneDrive-synced clone on this machine**. It is not a Deployment Protection issue, not a Preview env
issue, not a source-code defect, and not expected to reproduce on Vercel's own cloud build
infrastructure (a fresh, non-OneDrive checkout there would leave `isLocalOneDriveWorkspace` naturally
false in the intended way — `cwd` would never contain `onedrive`). Fixing it locally would require
editing `astro.config.mjs` (e.g. broadening the OneDrive detection so it does not get disabled by
`VERCEL=1` when the CLI is invoked locally), which is a build-configuration change outside this
phase's approved scope (no source feature changes; `astro.config.mjs` is not in the list of files this
phase is authorized to modify). No such change was made.

`.vercel/output` was left in an incomplete state after both failed attempts (`server/` and `static/`
directories present from partial work, but no `functions/` directory and no `config.json` — the
function-bundling step never completed). This output is not valid for `vercel deploy --prebuilt`.

**Incidental side effect noted and reverted:** `vercel build`'s internal `npm install` step touched
`package-lock.json` on disk (line-ending/mtime churn only — `git diff` against both the working tree
and baseline `a61fd3b` showed zero content bytes changed). The file was restored via
`git checkout -- package-lock.json` to guarantee a byte-exact, zero-diff working tree; no lockfile
diff exists in the final commit.

- `npmBuildPass`: true
- `vercelBuildPass`: false
- `vercelBuildEnvironment`: preview (both failed attempts were Preview-only; `--prod` was never used)

## Preview deployment result

Not performed. `vercel deploy --prebuilt --yes` was not run because the prerequisite Vercel Preview
build did not succeed and `.vercel/output` is incomplete/invalid.

- `deploymentSucceeded`: false
- Deployment environment: preview (intended, not executed)
- `deploymentUrlPresent`: false
- `deploymentUrl`: none
- Production deploy: false
- Promoted to production: false

## Preview `/chart-ai?chartAiBetaPreview=1` result

Not performed (no deployment exists to test).

## Preview H route beta result

Not performed (no deployment exists to test). All sub-fields n/a:

- `summary.ok`: n/a
- `sourceStatus`: n/a
- `llmStatus`: n/a
- `sanitizedErrorCode`: n/a
- `currentPricePresent`: n/a
- `volumePresent`: n/a
- `summaryTextPresent`: n/a
- exactly 3 Korean bullet lines: n/a
- labels present: n/a
- ASCII digit present: n/a
- forbidden investment phrase present: n/a

## Mobile result

Not checked (no deployment exists to test).

## Exposure status

No exposure occurred. No secret, env value, Vercel env value, `OPENAI_API_KEY`, model name, prompt
text, raw OpenAI request/response, raw KIS request/payload/HTTP body/error message, `KIS_BASE_URL`
raw value, `KIS_APP_KEY`, `KIS_APP_SECRET`, token, Authorization header, cookie, `currentPrice`
numeric value, or `volume` numeric value was ever printed at any point in this phase, including in
the local regression preflight output (which only ever emits sanitized booleans/enums) and in this
document.

## KIS endpoint boundary

current_price only. No order/account/balance/funds/portfolio/trading/personal endpoint was
contacted or referenced. No KIS endpoint expansion of any kind.

## LLM boundary

H route only. Explicit `chartAiBetaPreview=1` query parameter required (per the existing, unmodified
`protected-preview-beta-guard.mjs` from Phase 3GG-L-BETA-ACTIVATE). No prompt rewrite. No model name
exposure anywhere in this phase's diagnostics, doc, or checker output.

## Env file status

`.env` / `.env.local`: never printed, never modified, never staged, never committed throughout this
phase.

## .vercel status

Present locally (contains `output/`, `project.json`, `repo.json`, and the incomplete build artifacts
from the two failed `vercel build` attempts). Not staged. Not committed.

## .gitignore status

Unchanged from the state carried over from Phase 3GG-L-BETA-DEPLOY-RERUN-2 (the Vercel CLI's earlier
`vercel link`-appended `.env*` line remains present and unstaged/uncommitted). Not touched, not
staged, not committed by this phase.

## Push status

Not pushed.

## Next recommended phase

Two independent paths forward, either of which unblocks the deploy:

1. **Owner/infra path (no source change):** run the Preview build and deploy from a Vercel-native
   context that does not hit this local OneDrive/Unicode-path limitation — e.g. let Vercel's own
   cloud build run the deploy (a `git push` + a Vercel-triggered cloud build would build on Vercel's
   infrastructure, not this machine, and would not be affected by this local-only crash), or run
   `vercel build`/`vercel deploy` from a non-OneDrive-synced local clone of this repo on this machine.
   Note: a `git push` was explicitly not authorized in this phase's scope.
2. **Config-fix path (source/config change, needs explicit approval):** a follow-up phase authorized
   to modify `astro.config.mjs` could adjust the `isLocalOneDriveWorkspace` detection so that it is
   not unconditionally disabled by `VERCEL=1` when the CLI is invoked locally (e.g. also checking for
   a Vercel-cloud-only marker instead of relying solely on `VERCEL`), then re-attempt
   Phase 3GG-L-BETA-DEPLOY-RERUN-3 (or a rerun-4) with a working local `vercel build`.

Deployment Protection is now fully resolved and does not need to be re-verified in the next attempt.
