# Phase 3GG-L-BETA-ACTIVATE — Protected Preview-only Chart AI Beta Activation — Result

## Status

Source activation implemented and locally verified fail-closed; the protected Vercel Preview deploy is blocked on owner-gated Vercel setup (project not linked; Deployment Protection unverifiable; Preview env presence uncheckable). The source is ready — the beta path is inert until the owner links the project, confirms Deployment Protection, and sets the required Preview env names.

## Classification

`PASS_SOURCE_READY_OWNER_VERCEL_ACTION_REQUIRED`

## Baseline

`6892478`

## Branch

`rebuild/phase-1-ia-shell`

## HEAD before

`68924786e4649784523e365452d05e23469aa9a9`

## HEAD after

(recorded post-commit; see final report)

## Purpose

Convert the already-verified owner-local KIS + LLM Chart AI flow into a protected Vercel Preview beta flow: allow beta users on a protected Vercel Preview URL to use the real KIS + LLM Chart AI, while preserving the local owner flow, production fail-closed behavior, current_price-only KIS scope, click-triggered execution, the 3-Korean-bullet summary contract, and zero raw secret/payload/model/prompt/numeric exposure.

## Files changed

- `src/lib/server/chart-ai/protected-preview-beta-guard.mjs` (created — server-only fail-closed access guard)
- `src/pages/api/chart-ai/local-only-kis-llm-summary.json.ts` (modified — added the protected-preview-beta authorization path)
- `src/pages/chart-ai.astro` (modified — beta panel visibility + dynamic H route query)
- `scripts/check_phase_3gg_l_beta_activate_contract.mjs` (created)
- `docs/planning/phase_3gg_l_beta_activate_protected_preview_chart_ai_beta_result_v0.1.md` (created)
- `package.json` (modified — 1 script entry added)
- `docs/planning/planning_changelog.md` (modified — entry prepended)

## Source diff summary

Three source files changed, all within the allowed set. A new pure/server-only guard module `evaluateProtectedPreviewBetaAccess` decides beta eligibility. The H route gained a second authorization path (beta) alongside the unchanged localhost owner path; when a request is an authorized beta request the route vouches for it to the market-data binding as a local-equivalent call (the binding, `kisClient`, LLM bridge, and model policy are all unchanged/forbidden diffs). `chart-ai.astro` reveals the existing panel for `?chartAiBetaPreview=1` on a deployed (non-local) host and sends the H route request with the matching query. No KIS provider change, no binding change, no LLM bridge/model-policy change, no prompt rewrite, no summary-contract rewrite, no new KIS endpoint.

## Vercel project link status

Not linked — no `.vercel/project.json` (only `.vercel/output/` from the adapter build). `vercel link` requires interactive owner project/scope selection (hard blocker #1), so it was not run and `.vercel` was not modified/committed.

## Deployment Protection status

Not verified (cannot be checked before the project is linked/exists). Per this phase's rules, live Preview activation and any live Preview route test must not proceed, and the Preview URL must not be shared, until Deployment Protection (Vercel Authentication or Password Protection) is confirmed enabled.

## Preview env name presence

Not checked (`vercel env ls preview` requires a linked project). No `vercel env pull`; no env values requested, printed, or written to disk. To be recorded as booleans once linked:

- KIS_APP_KEY: unknown (not checked)
- KIS_APP_SECRET: unknown (not checked)
- KIS_BASE_URL: unknown (not checked)
- KIS_ENABLE_LIVE_QUOTES: unknown (not checked)
- CHART_AI_ENABLE_LOCAL_LLM: unknown (not checked)
- OPENAI_API_KEY: unknown (not checked)
- CHART_AI_LLM_MODEL or CHART_AI_LLM_MAIN_MODEL: unknown (not checked)
- CHART_AI_ENABLE_PROTECTED_PREVIEW_BETA: unknown (not checked)

### Additional Preview env dependency (documented, from forbidden-diff source inspection)

`kisClient.ts` (a forbidden-diff file, unchanged) independently classifies a Vercel Preview runtime and requires `KIS_ENABLE_PREVIEW_LIVE_QUOTES=true` (and `KIS_ACCOUNT_NO` absent) before it will serve quotes on `VERCEL_ENV=preview`. Therefore, for the beta KIS path to return live data on Preview, the owner must also set `KIS_ENABLE_PREVIEW_LIVE_QUOTES=true` on the Preview environment (in addition to the env names listed above). This gate is intentional and was not modified.

## Local regression preflight results

- HF5 diagnostic: PASS (`FIXED_RUNTIME_FLAG_INJECTION_CURRENT_PRICE_READY`)
- G-FAST owner smoke: PASS (`sourceStatus=ok currentPricePresent=true volumePresent=true sanitized=true`)
- HF6 diagnostic: PASS (`FIXED_LLM_RUNTIME_ENV_READY`)
- L-FAST regression harness: PASS (`PASS_LLM_QUALITY_REGRESSION`)

## Beta activation behavior

- **localhost owner flow preserved**: `/chart-ai?ownerLocalKisLlm=1` on a local hostname still shows the panel and the H route still serves the local owner flow. Verified locally: panel visible; owner regression PASS (summary.ok=true, 3 labeled Korean bullets, no digits, no exposure).
- **protected Preview beta flow added**: `/chart-ai?chartAiBetaPreview=1` reveals the panel only on a deployed (non-local) host; the H route executes the KIS + LLM flow only when the guard grants access — `VERCEL_ENV=preview` AND `CHART_AI_ENABLE_PROTECTED_PREVIEW_BETA=true` AND explicit `chartAiBetaPreview=1` AND not production.
- **production fail-closed preserved**: the guard denies whenever `VERCEL_ENV==='production'` or `NODE_ENV==='production'`, and denies any non-preview runtime. Verified locally: a beta-query request on localhost (VERCEL_ENV not preview) fails closed with `sanitizedErrorCode=NON_LOCAL_REQUEST`; the beta panel stays hidden on localhost.
- **explicit query opt-in required**: no panel and no request without the exact query opt-in; no auto-fetch; button click only.

## Local validation result

- `npm run build`: PASS
- `npm run check:phase-3gg-l-beta-activate`: PASS
- `npm run check:phase-3gg-l-fast`: PASS (regression)
- `npm run owner-regression:phase-3gg-l-fast -- ... --repeat=1`: PASS (local owner path intact)
- `git diff --check`: clean
- Local fail-closed browser checks: `ownerLocalKisLlm=1` panel visible; `chartAiBetaPreview=1` panel hidden on localhost; beta H route request blocked on localhost.

## Preview build result

`npm run build` PASS (adapter output produced). `vercel build` not run (project not linked).

## Preview deploy result

Not performed — blocked on owner-gated `vercel link` + Deployment Protection verification + Preview env presence. No production deploy, no promote, no push.

## Preview beta URL present

false (no deployment).

## Preview `/chart-ai?chartAiBetaPreview=1` reachability

Not applicable (no deployment).

## Preview H route beta success result

Not applicable (no deployment; live Preview route test intentionally not run until protection + Preview envs are verified).

## Exposure status

- OpenAI key exposure: Not exposed
- model name exposure: Not exposed (response carries only a `modelPresent` boolean)
- prompt exposure: Not exposed
- raw OpenAI request/response exposure: Not exposed
- KIS_BASE_URL raw value exposure: Not exposed
- credential exposure: Not exposed
- token exposure: Not exposed (Vercel auth token never printed)
- Authorization header exposure: Not exposed
- raw KIS request/payload/HTTP-body/error exposure: Not exposed
- currentPrice numeric exposure: Not exposed
- volume numeric exposure: Not exposed
- env value / Vercel env value exposure: Not exposed

## KIS endpoint boundary

- current_price only for market data: confirmed (binding `ALLOWED_ENDPOINT_CATEGORIES` unchanged; route fixes `category: 'current_price'`)
- No order/account/balance/funds/portfolio/trading/personal endpoints: confirmed

## LLM boundary

- H route only: confirmed
- ownerLocalKisLlm=1 (local) / chartAiBetaPreview=1 (Preview) opt-in required: confirmed
- No prompt rewrite: confirmed
- No model name exposure: confirmed

## Env file status

- `.env`/`.env.local` not printed: confirmed
- `.env`/`.env.local` not modified: confirmed
- `.env`/`.env.local` not staged: confirmed
- `.env`/`.env.local` not committed: confirmed

## .vercel status

- `.vercel/` present locally (adapter build output) but not staged: confirmed
- `.vercel/` not committed: confirmed

## Production deploy status

false — no production deploy, no production alias, no promote to production, no public activation.

## Push status

Not pushed.

## Owner action required to complete Lane B (protected Preview deploy)

Outside this chat:
1. `vercel link` — select/create the intended Vercel project + scope.
2. Confirm Deployment Protection (Vercel Authentication or Password Protection) is enabled on that project.
3. Set the required Preview env names (booleans-only presence): KIS_APP_KEY, KIS_APP_SECRET, KIS_BASE_URL, KIS_ENABLE_LIVE_QUOTES, **KIS_ENABLE_PREVIEW_LIVE_QUOTES=true** (kisClient's Preview gate), CHART_AI_ENABLE_LOCAL_LLM, OPENAI_API_KEY, CHART_AI_LLM_MODEL or CHART_AI_LLM_MAIN_MODEL, and **CHART_AI_ENABLE_PROTECTED_PREVIEW_BETA=true**; ensure KIS_ACCOUNT_NO is absent.

Then a follow-up run can execute `vercel build --yes` + `vercel deploy --prebuilt --yes` (Preview only), verify protection, load `/chart-ai?chartAiBetaPreview=1` on the protected Preview URL, and record the live beta result.

## Next recommended phase

Phase 3GG-L-BETA-DEPLOY — Protected Preview Beta Deploy Execution (after the owner completes link + Deployment Protection + Preview env setup above); it should run the Preview build/deploy, verify protection, and record the live protected-Preview beta result. Production remains prohibited.
