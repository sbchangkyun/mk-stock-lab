# Phase 3GG-L-FAST — Owner-local LLM Quality Regression Harness — Result (Lane A)

## Status

Passed. A repeatable owner-local regression harness now verifies the already-working KIS + LLM summary quality path end-to-end through the H route, using sanitized booleans/classes only. The harness passed on its first run.

## Classification

`PASS_LLM_QUALITY_REGRESSION`

## Baseline

`7669123`

## Branch

`rebuild/phase-1-ia-shell`

## HEAD before

`76691232bdb3f9e950ef10796106f74a9a556bf4`

## HEAD after

(recorded post-commit; see final report)

## Purpose

Create a repeatable owner-local regression harness (Lane A) that verifies the KIS + LLM summary quality path (KIS current_price → H route → LLM bridge → sanitized Korean summary) using only sanitized fields, as the durable quality gate before the protected Vercel Preview beta deploy (Lane B).

## Files changed

- `scripts/owner_regression_phase_3gg_l_fast_llm_quality_harness.mjs` (created)
- `scripts/check_phase_3gg_l_fast_contract.mjs` (created)
- `docs/planning/phase_3gg_l_fast_owner_local_llm_quality_regression_harness_result_v0.1.md` (created)
- `package.json` (modified — 2 script entries added)
- `docs/planning/planning_changelog.md` (modified — entry prepended)

## Source diff status

Zero diff from baseline `7669123` for all forbidden-diff source files (kisClient.ts, the KIS market-data binding, both chart-ai API routes, the LLM runtime bridge, the model policy module, `chart-ai.astro`, MK Agent, Similar Pattern agent, guarded productization scaffold, `components`, `supabase`, `src/data`, lockfiles, `.env`, `.env.local`, `.vercel`). Lane A adds only a harness, its checker, docs, and package/changelog wiring — no source feature/UI/provider/route/bridge/model-policy change.

## Preflight results

- HF5 diagnostic: PASS — `route-ready`, `FIXED_RUNTIME_FLAG_INJECTION_CURRENT_PRICE_READY`.
- G-FAST owner smoke: PASS — `sourceStatus=ok currentPricePresent=true volumePresent=true sanitized=true`.
- HF6 diagnostic: PASS — `FIXED_LLM_RUNTIME_ENV_READY` (summaryOk=true, llmStatus=ok, summaryLineCount=3, requiredLabelsPresent=true).

## Harness command

```
npm run owner-regression:phase-3gg-l-fast -- --owner-approved-llm-quality-regression --base-url=http://localhost:4321 --repeat=1
```

(Default `--repeat=1` keeps execution fast and OpenAI cost controlled; `--repeat` is capped at 3 and rejected above 3.)

## Harness result

- runCount: 1
- passCount: 1
- failCount: 0
- hRouteReachable: true
- hRouteHttpStatusClass: 2xx
- summaryOk: true
- sourceStatus: ok
- llmStatus: ok
- sanitizedErrorCode: null
- currentPricePresent: true
- volumePresent: true
- summaryTextPresent: true
- summaryLineCount: 3
- requiredLabelsPresent: true
- asciiDigitPresentInSummary: false
- forbiddenInvestmentPhrasePresent: false
- exposureDetected: false
- finalClassification: PASS_LLM_QUALITY_REGRESSION

## Summary quality result

- Exactly 3 Korean bullet lines: true (summaryLineCount = 3)
- Labels present:
  - `데이터 상태:`: true
  - `해석 범위:`: true
  - `유의사항:`: true
- ASCII digit present: false
- Forbidden investment phrase present: false

## Exposure status

No exposure detected. The harness scanned the raw H route response for forbidden patterns (OpenAI-style key, `Bearer` header, prompt fields, raw OpenAI response fields, raw KIS payload fields, KIS base URL host) — all absent.

- OpenAI key exposure: Not exposed
- credential exposure: Not exposed
- token exposure: Not exposed
- Authorization header exposure: Not exposed
- raw KIS request exposure: Not exposed
- raw KIS payload exposure: Not exposed
- raw KIS HTTP response body exposure: Not exposed
- raw KIS error message exposure: Not exposed
- raw OpenAI request exposure: Not exposed
- raw OpenAI response exposure: Not exposed
- prompt exposure: Not exposed
- model name exposure: Not exposed
- currentPrice numeric exposure: Not exposed
- volume numeric exposure: Not exposed
- KIS_BASE_URL raw value exposure: Not exposed

## KIS endpoint boundary

- current_price only for market data: confirmed
- H route only: confirmed (the harness calls only the LLM summary H route)
- No order/account/balance/funds/portfolio/trading/personal endpoints: confirmed

## LLM boundary

- H route only: confirmed (no direct OpenAI call)
- ownerLocalKisLlm=1 required: preserved (the harness uses the opt-in query, localhost only)
- No prompt rewrite: confirmed
- No model name exposure: confirmed (only a `modelPresent` boolean flows through)

## Env file status

- `.env`/`.env.local` not printed: confirmed
- `.env`/`.env.local` not modified: confirmed
- `.env`/`.env.local` not staged: confirmed
- `.env`/`.env.local` not committed: confirmed

## Validation results

- HF5 diagnostic: PASS
- G-FAST owner smoke: PASS
- HF6 diagnostic: PASS
- `npm run owner-regression:phase-3gg-l-fast -- ... --repeat=1`: PASS (`PASS_LLM_QUALITY_REGRESSION`)
- `npm run check:phase-3gg-l-fast`: PASS
- `npm run check:phase-3gg-k-qa-owner-rerun-3`: PASS (regression)
- `npm run build`: PASS
- `git diff --check`: clean
- `git status --short`: reviewed, only authorized files staged

## Push/deploy status

Not pushed. Not deployed before the Preview step. (Lane B — protected Vercel Preview beta deploy — is recorded separately.)

## Next action

Protected Vercel Preview beta deploy (Lane B) — Preview only, production prohibited. See `phase_3gg_l_fast_vercel_preview_beta_deploy_result_v0.1.md`.
