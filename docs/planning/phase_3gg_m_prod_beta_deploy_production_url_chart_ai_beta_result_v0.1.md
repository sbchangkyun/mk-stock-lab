# Phase 3GG-M-PROD-BETA-DEPLOY — Production URL Chart AI Beta Activation and Cloud Deploy Result

## Status

BLOCKED before any deploy attempt. Source-side production beta guard was fully implemented, wired, and
validated per this phase's explicit "still complete the source deliverable, do not deploy" convention.
Two independent blockers were found; either alone is sufficient to stop before Production deploy, and
both must be resolved (by the owner) before a future rerun can reach an actual live Production result.

## Classification

`BLOCKED_PRODUCTION_ENV_MISSING`

(A second, independent, compounding finding — the `kisClient.ts` production runtime hard-block — is
documented below; see "Production beta guard summary" and "Next recommended phase". It does not change
this phase's classification, since the env-missing stop condition was already triggered per this
phase's own explicit instructions, but it must be resolved before a future rerun can succeed even after
the missing env var is added.)

## Baseline

`ea60afa` (`ea60afad91c32d7af9a695900ebab5f178caa91e`, Phase 3GG-L-BETA-DEPLOY-RERUN-3)

## Branch

`rebuild/phase-1-ia-shell`

## HEAD before

`ea60afad91c32d7af9a695900ebab5f178caa91e`

## HEAD after

(recorded in the final report after commit)

## Purpose

Activate the existing Chart AI KIS + LLM summary beta on the real Vercel **Production** URL
(`https://mkstocklab.vercel.app`), behind a new, separate, explicit production opt-in guard — without
weakening the existing localhost owner path or the existing Preview beta path, and without any
order/account/trading/personal-data expansion.

## Files changed

- Modified: `src/lib/server/chart-ai/protected-preview-beta-guard.mjs` (added `evaluateProductionChartAiBetaAccess`,
  `PRODUCTION_CHART_AI_BETA_FLAG_ENV_NAME`, `PRODUCTION_CHART_AI_BETA_QUERY_PARAM`)
- Modified: `src/pages/api/chart-ai/local-only-kis-llm-summary.json.ts` (added "Path 3" production beta
  evaluation, widened the combined access gate to include it)
- Modified: `src/pages/chart-ai.astro` (added `chartAiProdBetaOptIn`/`chartAiProdBetaEnabled`, extended
  the panel-enable OR and the 3-way request-query ternary)
- Created: `docs/planning/phase_3gg_m_prod_beta_deploy_production_url_chart_ai_beta_result_v0.1.md` (this file)
- Created: `scripts/check_phase_3gg_m_prod_beta_deploy_contract.mjs`
- Modified: `package.json` (1 script entry added)
- Modified: `docs/planning/planning_changelog.md` (1 entry prepended)

## Source diff summary

Diff vs baseline `ea60afa` is limited to exactly the 3 files this phase is authorized to modify, plus
the new doc/checker and the `package.json`/changelog wiring. No other source file (including every file
in the forbidden-diff list below) carries any diff.

## Forbidden-diff files (verified zero-diff vs baseline)

`src/lib/server/providers/kisClient.ts`, `local-only-live-kis-market-data-binding.mjs`,
`local-only-kis-current-price.json.ts`, `local-only-llm-runtime-bridge.mjs`,
`local-only-llm-model-policy.mjs`, `mk-agent.mjs`, `similar-pattern-agent.mjs`,
`guarded-productization-scaffold.mjs`, `components/`, `supabase/`, `src/data/`, and every lockfile.

## Production env presence booleans

Checked via `vercel env ls production` (names only; no values retrieved or printed):

- `KIS_APP_KEY` present: true
- `KIS_APP_SECRET` present: true
- `KIS_BASE_URL` present: true
- `KIS_ENABLE_LIVE_QUOTES` present: true
- `KIS_ENABLE_PREVIEW_LIVE_QUOTES` present: true (Preview-scoped; Production path does not rely on it)
- `CHART_AI_ENABLE_LOCAL_LLM` present: true
- `OPENAI_API_KEY` present: true
- `CHART_AI_LLM_MODEL` present: true (satisfies "`CHART_AI_LLM_MODEL` or `CHART_AI_LLM_MAIN_MODEL`")
- `CHART_AI_ENABLE_PRODUCTION_CHART_AI_BETA` present: **false — MISSING**
- `KIS_ACCOUNT_NO` present: false (correctly absent)

Because `CHART_AI_ENABLE_PRODUCTION_CHART_AI_BETA` is absent from Production env, this phase stops here
per its own explicit instruction ("If `CHART_AI_ENABLE_PRODUCTION_CHART_AI_BETA` is missing: stop with
classification `BLOCKED_PRODUCTION_ENV_MISSING`... do not deploy").

## Local regression preflight result

All four owner-local checks PASS against `http://localhost:4321` (sanitized booleans/enums only, no
raw value ever printed):

- HF5 local provider runtime-env diagnostic: PASS — `finalClassification: FIXED_RUNTIME_FLAG_INJECTION_CURRENT_PRICE_READY`, `sourceStatus: ok`, `currentPricePresent: true`, `volumePresent: true`.
- G-FAST real KIS current_price smoke: PASS — `sourceStatus: ok`, `currentPricePresent: true`, `volumePresent: true`, `sanitized: true`.
- HF6 LLM runtime-env diagnostic: PASS — `finalClassification: FIXED_LLM_RUNTIME_ENV_READY`, `summary.ok: true`, `llmStatus: ok`, `summaryLineCount: 3`, `requiredLabelsPresent: true`, `asciiDigitPresentInSummary: false`, `forbiddenInvestmentPhrasePresent: false`.
- L-FAST LLM quality regression (repeat=1): PASS — `finalClassification: PASS_LLM_QUALITY_REGRESSION`, `runCount: 1`, `passCount: 1`, `failCount: 0`, `exposureDetected: false`.

The app itself is fully deploy-ready modulo the missing Production env flag.

## Production beta guard summary

Implemented as a separate, fail-closed evaluator (`evaluateProductionChartAiBetaAccess` in
`protected-preview-beta-guard.mjs`), mirroring the existing Preview guard's structure without modifying
it. Requires all three, simultaneously: `VERCEL_ENV === 'production'`,
`CHART_AI_ENABLE_PRODUCTION_CHART_AI_BETA === 'true'`, and the explicit `chartAiProdBeta=1` query.
Wired into the H route (`local-only-kis-llm-summary.json.ts`) as "Path 3", alongside the unchanged
localhost owner path (Path 1) and Preview beta path (Path 2); the combined access gate now requires all
three paths to deny before the route fails closed. `chart-ai.astro` extended with a matching
`chartAiProdBetaOptIn`/`chartAiProdBetaEnabled` client-side check, hidden by default, requiring the
`chartAiProdBeta=1` query, with no auto-fetch (button click only), preserving the existing
`ownerLocalKisLlm=1` and `chartAiBetaPreview=1` behaviors unchanged.

**Compounding finding (read-only investigation of the forbidden-diff file `kisClient.ts`, not
modified):** `kisClient.ts`'s `getKisQuoteConfigReadiness()` classifies the runtime via `classifyRuntime()`,
which returns `'vercel-production'` whenever `VERCEL_ENV === 'production'`. The readiness function then
unconditionally hard-blocks that runtime class (along with `'node-production'` and `'unknown'`) with
`{ ready: false, reason: 'production_not_allowed' }`, before any of its other checks (flag, missing env,
`KIS_ACCOUNT_NO`) are evaluated — there is no exception path in the surrounding code. This means that
even after `CHART_AI_ENABLE_PRODUCTION_CHART_AI_BETA=true` is added to Production env, and even with the
new route-level production beta guard correctly authorizing a request, the underlying KIS provider
client itself will still refuse to serve a live quote on the actual Vercel Production runtime — the H
route would reach `sourceStatus: blocked`/`error` (a sanitized, non-`ok` state) rather than a working
summary. `kisClient.ts` is a forbidden-diff file for this phase, so no change was made to it. This is an
architectural, owner-level decision (not a bug): the provider client was apparently built to hard-block
Production by design. Resolving it will require either (a) an explicitly approved follow-up phase
authorized to modify `kisClient.ts` to add a governed Production-allowed path (e.g. mirroring the
existing Preview guard-flag pattern), or (b) an owner decision to keep Production KIS-hard-blocked
indefinitely, in which case the Production Chart AI beta panel could still ship visually but would only
ever return a blocked/degraded state, never a live summary.

## Localhost / Preview / Production flow preservation status

- Localhost owner path (`?ownerLocalKisLlm=1`): unchanged, verified via passing local regression preflight.
- Preview beta path (`?chartAiBetaPreview=1`): unchanged (guard function untouched; only appended to, not edited).
- Production beta path (`?chartAiProdBeta=1`): newly added, source-complete, not yet deployable (env missing) and not yet functionally provable end-to-end (kisClient.ts compounding block).

## npm build result

Not re-run in this phase (no build-affecting change; prior phase's `npm run build` PASS already
established code-readiness, and this phase's local regression preflight re-confirms the runtime path).
Will be re-run as part of the validation chain below before commit.

## Cloud deploy / production deploy result

Not attempted. `git push` was not performed. Per this phase's explicit instruction, the deploy path
(steps 10-12 of the work order) is skipped entirely once `BLOCKED_PRODUCTION_ENV_MISSING` is triggered.

## Production URL present

false (no new deployment was created or promoted this phase; the existing Production URL
`https://mkstocklab.vercel.app` is unchanged and does not yet include this phase's source).

## Production `/chart-ai?chartAiProdBeta=1` result

Not tested (not deployed).

## H route production beta result

Not tested (not deployed).

## Exposure status

No secret, env value, Vercel env value, `OPENAI_API_KEY`, model name, prompt text, raw OpenAI
request/response, raw KIS request/payload/HTTP body/error message, `KIS_BASE_URL` raw value,
`KIS_APP_KEY`, `KIS_APP_SECRET`, token, Authorization header, cookie, `currentPrice` numeric value, or
`volume` numeric value was printed at any point in this phase, including in the env-presence checks
(booleans/names only), the local regression preflight output (sanitized booleans/enums only), the
`kisClient.ts` read-only investigation (structural/control-flow findings only, no values), and this
document.

## KIS endpoint boundary

`current_price` only. No order/account/balance/funds/portfolio/trading/personal endpoint was added,
referenced, or contacted. No KIS endpoint expansion of any kind.

## LLM boundary

H route only. Production beta path requires the explicit `chartAiProdBeta=1` query parameter and the
new fail-closed production guard. No prompt rewrite. No summary contract rewrite. No model name exposed
anywhere in this phase's guard code, route code, UI code, diagnostics, doc, or checker output.

## Env file status

`.env` / `.env.local`: never printed, never modified, never staged, never committed throughout this
phase.

## .vercel status

Present locally from prior phases (not staged, not committed by this phase).

## .gitignore status

Unchanged; not touched, not staged, not committed by this phase.

## Push status

Not pushed.

## Production deploy status

Not deployed. Not promoted.

## Next recommended phase

Two things must happen, independently, before a future rerun can reach
`PASS_PRODUCTION_CHART_AI_BETA_DEPLOYED`:

1. **Owner env action (no source change):** add `CHART_AI_ENABLE_PRODUCTION_CHART_AI_BETA=true` to the
   Vercel Production environment (`vercel env add CHART_AI_ENABLE_PRODUCTION_CHART_AI_BETA production`
   or via the Dashboard). This alone unblocks this phase's own guard but not the compounding finding below.
2. **Owner scope decision on `kisClient.ts`'s Production hard-block:** either (a) approve a follow-up
   phase authorized to modify `kisClient.ts` to add a governed, explicit Production-allowed path (mirroring
   the existing Preview `previewGuardFlagEnvName` pattern, e.g. a `productionGuardFlagEnvName` gate), so
   live KIS quotes can actually flow on Production once the route-level beta guard authorizes a request; or
   (b) accept that the Production Chart AI beta panel will only ever show a blocked/degraded state on the
   real Production URL, and treat this phase's guard work as forward-looking infrastructure for a later
   `kisClient.ts` change.

Once (1) is done, `git push` of this branch (or a rerun's equivalent) would trigger a Vercel cloud build
(avoiding the previously diagnosed local OneDrive `vercel build` crash) and could create/promote a
Production deployment; that deployment's `/chart-ai?chartAiProdBeta=1` H route would still return a
blocked/sanitized-error `sourceStatus` until (2) is also resolved.
