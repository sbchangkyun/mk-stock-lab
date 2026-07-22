# Phase 3GG-M-PROD-HF1 — Guarded Production KIS Live Quotes Exception and Production URL Deploy

## Status

Source hotfix implemented, locally validated, committed, deployed to the real Vercel Production URL via
cloud build, and verified live end-to-end. Complete.

## Classification

`PASS_PRODUCTION_CHART_AI_BETA_DEPLOYED` — the Production URL `/chart-ai?chartAiProdBeta=1` returns the
real live KIS + LLM summary (`summary.ok=true`, `sourceStatus=ok`, `llmStatus=ok`), and generic
production KIS use remains fail-closed.

## Baseline

`5cbfb0b` (Phase 3GG-M-PROD-BETA-DEPLOY).

## Branch

`rebuild/phase-1-ia-shell`.

## HEAD before

`5cbfb0bc4f2aa930fac417e9166051a617627114`

## HEAD after source commit

`43923fd915c3e216c7e4da98dd9445191e6eaab5` (`Phase 3GG-M-PROD-HF1: allow guarded production Chart AI quotes`).

## HEAD after deploy doc commit if any

Recorded in the "Post-deploy update" section's final line below (this doc update commit).

## Purpose

Unblock the actual Vercel Production URL so `/chart-ai?chartAiProdBeta=1` returns the real live
KIS + LLM Chart AI summary, by adding a minimal, fail-closed production exception to KIS live quotes
scoped **only** to the Chart AI production beta summary path, and deploying to the real Vercel
Production URL. Builds directly on Phase 3GG-M-PROD-BETA-DEPLOY, which added the production UI/H-route
beta guard and the `chartAiProdBeta=1` opt-in but left `kisClient.ts` hard-blocking all Production KIS
live quotes.

## Files changed

Source (3):
- `src/lib/server/providers/kisClient.ts`
- `src/lib/server/chart-ai/local-only-live-kis-market-data-binding.mjs`
- `src/pages/api/chart-ai/local-only-kis-llm-summary.json.ts`

New:
- `docs/planning/phase_3gg_m_prod_hf1_guarded_production_kis_live_quotes_result_v0.1.md` (this doc)
- `scripts/check_phase_3gg_m_prod_hf1_contract.mjs`

Modified (project files):
- `package.json`
- `docs/planning/planning_changelog.md`

Modified (documented sibling-checker tolerance patches): the 3GG-M-PROD-BETA-DEPLOY, 3GG-L-BETA-DEPLOY-RERUN-3,
and 3GG-L-FAST checkers — to (a) drop `kisClient.ts` and the market-data binding from their
zero-diff/forbidden-diff lists (this phase is now authorized to modify them) and (b) tolerate this
phase's two new files in their working-tree scans.

`src/pages/chart-ai.astro` and `src/lib/server/chart-ai/protected-preview-beta-guard.mjs` were **not**
changed: the `chartAiProdBeta=1` panel reveal + request-query wiring (astro) and the
`evaluateProductionChartAiBetaAccess` guard already exist from Phase 3GG-M-PROD-BETA-DEPLOY.

## Source diff summary

- **kisClient.ts**: added a non-secret Production flag constant
  (`productionChartAiBetaFlagEnvName = 'CHART_AI_ENABLE_PRODUCTION_CHART_AI_BETA'`);
  `getKisQuoteConfigReadiness()` now accepts an optional
  `{ allowProductionChartAiBetaLiveQuotes?: boolean }` and computes
  `productionChartAiBetaExceptionAllowed = runtimeClass === 'vercel-production' && options.allowProductionChartAiBetaLiveQuotes === true && readEnvValue(productionChartAiBetaFlagEnvName) === 'true'`.
  The Vercel-Production hard block now fires only when the exception does **not** apply; `node-production`
  and `unknown` runtimes stay hard-blocked unconditionally. `getKisDomesticQuoteSnapshot()` accepts the
  same optional scoped option and forwards it to the readiness check; the generic `getKisQuoteSnapshot`
  wrapper and the OHLC series path continue to call readiness with **no** options and therefore stay
  fully fail-closed on Production. All existing checks below the runtime gate (`KIS_ACCOUNT_NO` absent,
  `KIS_ENABLE_LIVE_QUOTES=true`, credentials present) still run.
- **market-data binding**: `runLocalOnlyLiveKisMarketDataRequest` reads a new
  `allowProductionChartAiBetaLiveQuotes` (default `false`) from `input` and forwards it **only** into
  the delegated `fetchQuote({ symbol, category, allowProductionChartAiBetaLiveQuotes })` transport call.
  It does not relax the module's own local-only guard, endpoint allowlist, symbol, credential, or
  rate-limit checks.
- **H route**: `fetchQuote` reads the option and forwards it to `getKisDomesticQuoteSnapshot`; the GET
  handler sets `allowProductionChartAiBetaLiveQuotes = prodBetaAccess.allowed === true` — i.e. only for
  an authorized production beta request (`VERCEL_ENV=production` + `CHART_AI_ENABLE_PRODUCTION_CHART_AI_BETA=true`
  + `?chartAiProdBeta=1`). Localhost owner and Preview beta paths leave it `false`.

## Production env name presence

Booleans only (no values printed):
- KIS_APP_KEY present: **true**
- KIS_APP_SECRET present: **true**
- KIS_BASE_URL present: **true**
- KIS_ENABLE_LIVE_QUOTES present: **true**
- CHART_AI_ENABLE_LOCAL_LLM present: **true**
- OPENAI_API_KEY present: **true**
- CHART_AI_LLM_MODEL (or CHART_AI_LLM_MAIN_MODEL) present: **true**
- CHART_AI_ENABLE_PRODUCTION_CHART_AI_BETA present: **true** (see correction below)
- KIS_ACCOUNT_NO absent: **true** (correctly not present)

## Production env flag correction result

`CHART_AI_ENABLE_PRODUCTION_CHART_AI_BETA` was **missing** from Production at the start of this phase
(the blocker recorded by Phase 3GG-M-PROD-BETA-DEPLOY). It was added as a **non-secret** Production
environment variable with value `true` via `vercel env add CHART_AI_ENABLE_PRODUCTION_CHART_AI_BETA
production` (value piped over stdin; no secret printed). A follow-up `vercel env ls production`
confirmed the name is now present. No other env var was added, changed, or printed; `vercel env pull`
was not run.

## Guarded production KIS exception summary

The production KIS live-quote exception is **conjunctively gated** and fail-closed. Live current_price
quotes are served on a Vercel Production runtime **only** when all of the following hold simultaneously:
1. `VERCEL_ENV=production` (runtime really is Vercel Production), AND
2. `CHART_AI_ENABLE_PRODUCTION_CHART_AI_BETA=true` (re-checked inside `kisClient.ts`, independent of the
   route), AND
3. the explicit per-call scoped signal `allowProductionChartAiBetaLiveQuotes === true`, which the H
   route sets only after its own `evaluateProductionChartAiBetaAccess` guard has passed (which itself
   requires `?chartAiProdBeta=1` + the flag + production), AND
4. the endpoint scope is `current_price` (the only endpoint this readiness gate serves).

Absent any one of these, `getKisQuoteConfigReadiness()` returns `reason: 'production_not_allowed'` and
the request stays blocked. Generic Production KIS usage (any caller that does not pass the scoped
option — including `getKisQuoteSnapshot` and the OHLC path) remains fully fail-closed. No new KIS
endpoint category was added; the market-data binding's `ALLOWED_ENDPOINT_CATEGORIES` remains
`['current_price']` and the forbidden order/account/balance/funds/portfolio/trading/personal categories
are unchanged.

## Localhost owner flow preserved

`/chart-ai?ownerLocalKisLlm=1` behavior is unchanged. The route passes the option as `false` on that
path, and on a `local` runtime the production hard block does not apply anyway. Local diagnostics
confirm the owner path still returns `sourceStatus=ok`, `summary.ok=true`.

## Preview beta flow preserved

`/chart-ai?chartAiBetaPreview=1` behavior is unchanged. The route passes the option as `false` on the
Preview path, and the `vercel-preview` runtime is gated by the existing `KIS_ENABLE_PREVIEW_LIVE_QUOTES`
preview guard, not the production exception.

## Production beta flow preserved

`/chart-ai?chartAiProdBeta=1` on Production now (with the flag added) may reveal the panel and, on a
button click, request `/api/chart-ai/local-only-kis-llm-summary.json?chartAiProdBeta=1&symbol=005930`,
which flows the scoped exception through to `kisClient.ts`. Live verification result recorded below.

## Local regression result

All four local diagnostics PASS against `http://localhost:4321` after the source change:
- HF5 KIS runtime-env diagnostic: PASS (`FIXED_RUNTIME_FLAG_INJECTION_CURRENT_PRICE_READY`,
  `localCurrentPriceSourceStatus=ok`, `currentPricePresent=true`, `volumePresent=true`).
- G-FAST real KIS current_price owner smoke: PASS (`sourceStatus=ok`, `currentPricePresent=true`,
  `volumePresent=true`, sanitized).
- HF6 LLM runtime-env diagnostic: PASS (`FIXED_LLM_RUNTIME_ENV_READY`, `summaryOk=true`,
  `llmStatus=ok`, `summaryLineCount=3`, `requiredLabelsPresent=true`, `asciiDigitPresentInSummary=false`,
  `forbiddenInvestmentPhrasePresent=false`).
- L-FAST LLM quality regression (repeat=1): PASS (`PASS_LLM_QUALITY_REGRESSION`, `passCount=1`,
  `exposureDetected=false`).

## npm build result

`npm run build` PASS (astro + @astrojs/vercel adapter; postbuild repair step completed). Local
`vercel build` was **not** run — the OneDrive/`VERCEL=1` local crash is already diagnosed
(Phase 3GG-L-BETA-DEPLOY-RERUN-3); Vercel cloud build is used for deploy instead.

## Vercel cloud production deploy result

`vercel deploy --prod --yes` (cloud build, not local `vercel build`): **deploymentSucceeded=true**,
`deploymentEnvironment=production` (`target: "production"`), `readyState=READY`. Deployment id
`dpl_993VnAUtwkKvegWhKFUWEvu1aCQi`. Generated URL
`https://mkstocklab-3lz1ctdpe-sbchangkyun-2946s-projects.vercel.app`, aliased to the canonical
production domain `https://mkstocklab.vercel.app`. `promotedToProduction`: not applicable — Vercel
reported the deployment as `production` directly (no separate `vercel promote` was run). No
`vercel build --prod` was run.

## Production URL present true/false

**true** — `https://mkstocklab.vercel.app` (canonical production alias; the generated deployment URL is
behind Deployment Protection / Vercel Authentication, the canonical production domain is public).

## Production `/chart-ai?chartAiProdBeta=1` result

Page reachable; beta panel visible (`panelHidden=false`); summary button visible and enabled; **no
auto-fetch** before click (H route resource count = 0 pre-click); no console error. One button click
produced **exactly one** H route request to
`/api/chart-ai/local-only-kis-llm-summary.json?chartAiProdBeta=1&symbol=005930`; the status line showed
`완료` and the summary rendered. Only the H route API was contacted; forbidden-route count = 0.

## H route production beta result

Live (via both direct probe and the browser click): **HTTP 200**, `summary.ok=true`, `sourceStatus=ok`,
`llmStatus=ok`, `sanitizedErrorCode=null`, `currentPricePresent=true`, `volumePresent=true`,
`summaryTextPresent=true`, `summaryLineCount=3`, `requiredLabelsPresent=true` (데이터 상태:/해석 범위:/유의사항:),
`asciiDigitPresentInSummary=false`, `forbiddenInvestmentPhrasePresent=false`, `modelPresent=true`
(boolean only). The response carries no `currentPrice`/`volume` numeric field at all. Negative controls
on Production confirm scoping: the same H route **without** `chartAiProdBeta=1` returns
`sourceStatus=blocked` / `NON_LOCAL_REQUEST`, and the generic `local-only-kis-current-price.json` route
returns `sourceStatus=blocked` / `NON_LOCAL_REQUEST` with null price/volume — i.e. generic production KIS
use stays fail-closed.

## Exposure status

No exposure. No env value, Vercel env value, `OPENAI_API_KEY`, model name, prompt text, raw OpenAI
request/response, `KIS_BASE_URL`/`KIS_APP_KEY`/`KIS_APP_SECRET` raw value, token, Authorization header,
cookie, raw KIS request/payload/HTTP body/error message, `currentPrice` numeric, or `volume` numeric
was printed at any point. The sanitized response contract (booleans + sanitized error code +
`modelPresent` boolean) is unchanged.

## KIS endpoint boundary

`current_price` only. No order/account/balance/funds/portfolio/trading/personal endpoint exists or was
added. The binding allowlist remains `['current_price']`.

## LLM boundary

H route only. The LLM runtime bridge, model policy, prompt, and summary contract were **not** modified.
No prompt rewrite, no summary-contract rewrite, no model name exposure.

## Env file status

`.env` / `.env.local` were never printed, modified, staged, or committed.

## .vercel status

`.vercel` was never staged or committed.

## .gitignore status

`.gitignore` has a pre-existing unstaged change (Vercel CLI's earlier `vercel link`-appended `.env*`
line, carried over from prior phases). It was left unstaged and not committed this phase.

## Push/deploy status

Production deploy: **succeeded** (`vercel deploy --prod --yes`, cloud build). `git push`: **not
performed** — the cloud deploy uploads the working directory directly and did not require a push; the
commit `43923fd` remains local on `rebuild/phase-1-ia-shell`.

## Next recommended phase

If Production live verification passes: a Production Chart AI beta browser-QA phase (mobile viewport,
default-hidden/opt-in/click-only accounting) analogous to the K-QA-OWNER-RERUN-3 owner QA, run against
the Production URL. If the KIS provider rejects the Production request at runtime (entitlement/IP
allowlist), a narrow Production KIS runtime diagnostic phase. Otherwise, monitoring only.

---

## Post-deploy update

- **Deploy**: `vercel deploy --prod --yes` → `target=production`, `readyState=READY`, deployment id
  `dpl_993VnAUtwkKvegWhKFUWEvu1aCQi`, aliased to `https://mkstocklab.vercel.app`.
- **Production live verification** (canonical production alias): `/chart-ai?chartAiProdBeta=1` panel
  visible, no auto-fetch, one click → one H route request → HTTP 200, `summary.ok=true`,
  `sourceStatus=ok`, `llmStatus=ok`, 3 Korean summary lines with all required labels, no ASCII digit in
  the summary, no forbidden investment phrase in the LLM summary, no numeric price/volume field, no
  console error, forbidden-route count = 0. The only rendered digit token is the 6-digit input ticker;
  the app's static "not investment advice / no buy-sell recommendation" disclaimer is a fixed negation,
  not model output.
- **Negative controls on Production**: H route without `chartAiProdBeta=1` → blocked (`NON_LOCAL_REQUEST`);
  generic `local-only-kis-current-price.json` → blocked (`NON_LOCAL_REQUEST`, null price/volume). Generic
  production KIS use remains fail-closed; the exception is scoped to the explicit opt-in path only.
- **Exposure**: none. No secret, token, Authorization header, model name, prompt, raw OpenAI/KIS payload,
  or currentPrice/volume numeric was printed anywhere during deploy or verification.
- **Final classification**: `PASS_PRODUCTION_CHART_AI_BETA_DEPLOYED`.
- **HEAD after this deploy-doc commit**: recorded in the changelog/commit log as the
  `Phase 3GG-M-PROD-HF1: record production deployment result` commit (immediately follows `43923fd`).
