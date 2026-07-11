# Phase 3GG-K-ENV-HF6 — LLM Runtime Readiness Rerun or Safe Diagnostics — Result

## Status

Fixed. The owner-local KIS + LLM summary H route now reaches full LLM runtime readiness: it no longer returns `LLM_DISABLED`, the OpenAI call succeeds, and the route returns `summary.ok=true` with a valid sanitized 3-bullet Korean summary (all required labels, no ASCII digits, no forbidden investment phrasing). The KIS side remains `sourceStatus=ok`.

## Classification

`FIXED_LLM_RUNTIME_ENV_READY`

## Baseline

`536450e`

## Branch

`rebuild/phase-1-ia-shell`

## HEAD before

`536450e027678fb4870cfd05e9e65a3f38c12a11`

## HEAD after

(recorded post-commit; see final report)

## Purpose

Diagnose and, if safely justified, minimally fix the LLM runtime env-readiness blocker (`LLM_DISABLED`) discovered in Phase 3GG-K-QA-OWNER-RERUN-2, so the existing owner-local H route reaches LLM runtime readiness and returns `summary.ok=true` without exposing secrets, raw OpenAI responses, prompts, model names, KIS payloads, or numeric price/volume values.

## Files changed

- `src/pages/api/chart-ai/local-only-kis-llm-summary.json.ts` (modified — LLM env-source resolver only)
- `scripts/owner_diagnostic_phase_3gg_k_env_hf6_llm_runtime_env_readiness.mjs` (created)
- `scripts/check_phase_3gg_k_env_hf6_contract.mjs` (created)
- `docs/planning/phase_3gg_k_env_hf6_llm_runtime_readiness_result_v0.1.md` (created)
- `package.json` (modified — 2 script entries added)
- `docs/planning/planning_changelog.md` (modified — entry prepended)

## Source diff summary

Single source file changed: `src/pages/api/chart-ai/local-only-kis-llm-summary.json.ts`. Two small helpers were added (`getImportMetaEnv()` and `readServerEnvValue(name)`), and the eight LLM env values passed to the LLM runtime bridge (`CHART_AI_ENABLE_LOCAL_LLM`, `OPENAI_API_KEY`, `CHART_AI_LLM_MODEL`, `CHART_AI_LLM_MAIN_MODEL`, `CHART_AI_LLM_FALLBACK_MODEL`, `CHART_AI_LLM_TEST_MODEL`, `CHART_AI_LLM_MODERATION_MODEL`, `CHART_AI_LLM_EMBEDDING_MODEL`) were switched from reading `process.env` directly to reading through `readServerEnvValue`. The LLM runtime bridge and the model policy were **not** modified — inspection confirmed they already consume the injected `env` object exclusively (the bridge reads `input.env`; the model policy takes `env` as a parameter), so a route-only fix was sufficient. No guard, ordering, response contract, prompt, summary-contract, or fail-closed branch was altered.

## Root cause confirmed

CHART_AI_ENABLE_LOCAL_LLM runtime env mismatch (and the other LLM env vars) — **confirmed**.

The LLM summary H route built the `env` object passed to the LLM runtime bridge by reading each value directly from `process.env`. The bridge returns `LLM_DISABLED` (fail-closed, before any OpenAI call) when `env.CHART_AI_ENABLE_LOCAL_LLM !== 'true'`. In the Astro dev/SSR runtime, `.env`-file values are exposed through `import.meta.env`, not `process.env` — the exact class of runtime-env mismatch Phase 3GG-K-ENV-HF5 fixed for the KIS side in `kisClient.ts`. The LLM enable flag (and a valid `OPENAI_API_KEY`/model configuration) live in `.env`, so `process.env.CHART_AI_ENABLE_LOCAL_LLM` read as undefined → `LLM_DISABLED`. Once the route resolved the flag via `import.meta.env` first, the LLM became enabled, the OpenAI call succeeded, and a valid summary was produced — confirming both the enable flag and the key/model were correctly configured in `.env` all along, merely invisible to `process.env` in the SSR runtime. No env value, key, or model name was read or printed to determine this.

## Minimal fix summary

- **Files modified:** `src/pages/api/chart-ai/local-only-kis-llm-summary.json.ts` only (one source file, the preferred modification target).
- **Type of fix:** introduced a dual-source env resolver `readServerEnvValue(name)` that reads the Astro/Vite runtime source `import.meta.env` first (where `.env` file values are exposed during `astro dev`/SSR) and falls back to `process.env` (owner-run Node harness / OS-level exported vars). The eight-key LLM `env` object passed to the bridge now reads through this resolver. Mirrors the HF5 KIS fix (`kisClient.ts` `readEnvValue`) and the established `supabaseAdmin.ts` pattern. No env value or model name is printed anywhere.
- **Why it is minimal:** it changes only the *source* each LLM env value is read from — no dependency, no dotenv, no `.env` reading, no new route, no new endpoint, no prompt change, no summary-contract change, no bridge/model-policy change. One route file.
- **Why it does not weaken local-only/fail-closed guards:** `readServerEnvValue` returns the `import.meta.env` value only when it is a non-empty string, otherwise it falls back to `process.env`. The route's `resolveLocalHostname` localhost check and the `ownerLocalKisLlm=1` opt-in gate are untouched. The bridge's fail-closed readiness logic (`LLM_DISABLED` when the flag is not `'true'`, `LLM_CONFIG_MISSING` without key/model, `LLM_CALL_FAILED`/`LLM_TIMEOUT` on call failure, forbidden-language/numeric fail-closed) is unchanged. The KIS market-data guard env object (`NODE_ENV`/`VERCEL_ENV`/`VERCEL`) is unchanged, so deployed/production fail-closed remains intact. This is a server-only route module never shipped to the client.

## Local dev server status before/after

- Reachable before: true — Reachable after: true
- Listening on 4321 before: true (PID 10020) — after: true (PID 3288)
- Fallback ports 5173/5174 listening before: false — after: false
- devServerRestartedForFix: true
- devServerRestartedAfterFix: true

The pre-fix dev server (PID 10020) was gracefully terminated with a normal (non-elevated) `taskkill`, and a fresh `npm run dev` was started so the Astro SSR runtime would load the route change; it came up listening on 4321 (PID 3288).

## Preflight KIS readiness

- HF5 diagnostic (`npm run owner-diagnostic:phase-3gg-k-env-hf5 -- --owner-approved-local-provider-runtime-env-diagnostic --base-url=http://localhost:4321`): PASS — `route-ready`, `FIXED_RUNTIME_FLAG_INJECTION_CURRENT_PRICE_READY`.
- G-FAST owner smoke (`npm run owner-smoke:phase-3gg-g-fast -- --owner-approved-real-kis-smoke`): PASS — `sourceStatus=ok currentPricePresent=true volumePresent=true sanitized=true` (both before and after the fix).

## HF6 diagnostic command used

```
npm run owner-diagnostic:phase-3gg-k-env-hf6 -- --owner-approved-llm-runtime-env-diagnostic --base-url=http://localhost:4321
```

## HF6 diagnostic summary before and after fix

| field | before fix | after fix |
| --- | --- | --- |
| localDevServerReachable | true | true |
| hRouteReachable | true | true |
| hRouteHttpStatusClass | 2xx | 2xx |
| summaryOk | false | true |
| sourceStatus | ok | ok |
| llmStatus | unavailable | ok |
| sanitizedErrorCode | LLM_DISABLED | null |
| currentPricePresent | true | true |
| volumePresent | true | true |
| summaryTextPresent | false | true |
| summaryLineCount | 0 | 3 |
| requiredLabelsPresent | false | true |
| asciiDigitPresentInSummary | false | false |
| forbiddenInvestmentPhrasePresent | false | false |
| llmDisabled | true | false |
| llmCallFailed | false | false |
| llmEnvEvidenceKind | llm-disabled | route-ready |
| suspectedRuntimeEnvMismatch | true | false |

## Classification rationale

Before the fix, the route returned `LLM_DISABLED` with the KIS side fully working (`sourceStatus=ok`, `currentPricePresent=true`) — the fingerprint of the same `import.meta.env`-vs-`process.env` runtime-env mismatch HF5 fixed for KIS (`suspectedRuntimeEnvMismatch=true`). After resolving the LLM env through `import.meta.env` first, the route returned `summaryOk=true`, `llmStatus=ok`, `sanitizedErrorCode=null`, with `summaryTextPresent=true`, `summaryLineCount=3`, `requiredLabelsPresent=true`, `asciiDigitPresentInSummary=false`, and `forbiddenInvestmentPhrasePresent=false` (`llmEnvEvidenceKind=route-ready`). That satisfies every condition of `FIXED_LLM_RUNTIME_ENV_READY`: no longer `LLM_DISABLED`, `summaryOk=true`, `llmStatus=ok`, `summaryTextPresent=true`, `sourceStatus=ok`, `currentPricePresent=true`, `volumePresent=true`.

## Owner-safe next action

Proceed to Phase 3GG-K-QA-OWNER-RERUN-3 — Verify Success-path Summary Quality After LLM Runtime Correction. Full browser QA (default-hidden, opt-in idle, click-only, mobile 375px, and rendered 3-bullet summary quality) should now be re-run against the working success path.

## Exposure status

- OpenAI key exposure: Not exposed
- model name exposure: Not exposed
- prompt exposure: Not exposed
- raw OpenAI request exposure: Not exposed
- raw OpenAI response exposure: Not exposed
- KIS_BASE_URL raw value exposure: Not exposed
- credential exposure: Not exposed
- token exposure: Not exposed
- Authorization header exposure: Not exposed
- raw KIS request exposure: Not exposed
- raw KIS payload exposure: Not exposed
- raw KIS HTTP response body exposure: Not exposed
- raw KIS error message exposure: Not exposed
- currentPrice numeric exposure: Not exposed
- volume numeric exposure: Not exposed

## KIS endpoint expansion status

- current_price only for market data: confirmed
- No order/account/balance/funds/portfolio/trading/personal endpoints: confirmed

## LLM boundary status

- H route only: confirmed (the diagnostic calls only the existing H route; no direct OpenAI call)
- ownerLocalKisLlm=1 required: preserved (route opt-in gate unchanged)
- No direct OpenAI diagnostic unless through the existing route: confirmed
- No prompt rewrite: confirmed
- No model name exposure: confirmed (only a `modelPresent` boolean flows through)

## Env file status

- `.env`/`.env.local` not printed: confirmed
- `.env`/`.env.local` not modified: confirmed
- `.env`/`.env.local` not staged: confirmed
- `.env`/`.env.local` not committed: confirmed

## Local-only guard preservation

- localhost required: preserved (route `resolveLocalHostname` unchanged)
- ownerLocalKisLlm=1 required: preserved (route opt-in gate unchanged)
- deployed/production fail-closed preserved: preserved (KIS guard env object and bridge fail-closed logic unchanged; `readServerEnvValue` keeps `process.env` authoritative when `import.meta.env` is empty)

## Validation results

- HF5 diagnostic preflight: PASS
- G-FAST owner smoke: PASS
- `npm run owner-diagnostic:phase-3gg-k-env-hf6 -- ...` (before fix): `BLOCKED_LLM_ENV_NOT_CONFIGURED` (LLM_DISABLED)
- `npm run owner-diagnostic:phase-3gg-k-env-hf6 -- ...` (after fix): PASS — `FIXED_LLM_RUNTIME_ENV_READY`
- `npm run check:phase-3gg-k-env-hf6`: PASS
- `npm run check:phase-3gg-k-qa-owner-rerun-2`: PASS (regression)
- `npm run build`: PASS
- `git diff --check`: clean
- `git status --short`: reviewed, only authorized files staged

## Push/deploy status

Not pushed. Not deployed.

## Next recommended phase

Phase 3GG-K-QA-OWNER-RERUN-3 — Verify Success-path Summary Quality After LLM Runtime Correction. (If the summary path later regresses on the LLM provider call, the follow-up is Phase 3GG-K-ENV-HF7 — LLM Provider Call Safe Diagnostics; if a summary is produced but violates the 3-label/no-digit/no-forbidden-phrase contract, the follow-up is Phase 3GG-K-HF2 — Summary Contract Hotfix.)
