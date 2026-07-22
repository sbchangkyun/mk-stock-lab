# Phase 3GG-K-ENV-HF5 — Minimal Local Provider Binding Fix Result

## Status

Fixed. The existing local current_price route now returns `sourceStatus=ok` with both `currentPricePresent=true` and `volumePresent=true`, and the G-FAST owner smoke passes with the same sanitized success shape.

## Classification

`FIXED_RUNTIME_FLAG_INJECTION_CURRENT_PRICE_READY`

## Baseline

`c7e1789`

## Branch

`rebuild/phase-1-ia-shell`

## HEAD before

`c7e1789d53e56907d2627455ef9d7d7b5b5f8229`

## HEAD after

(recorded post-commit; see final report)

## Purpose

Implement the minimum safe local-provider binding fix after Phase 3GG-K-ENV-HF4 proved that real KIS OAuth token exchange and the direct current_price quote both succeed with real credentials, while the existing local current_price route still failed with `PROVIDER_UNAVAILABLE`. HF4's strongest lead was `kisLiveQuotesShellFlagExactlyTrue=false`: the running dev-server/local provider wiring did not see `KIS_ENABLE_LIVE_QUOTES=true` even though it exists on disk in `.env`.

## Files changed

- `src/lib/server/providers/kisClient.ts` (modified — env-source resolver only)
- `scripts/owner_diagnostic_phase_3gg_k_env_hf5_local_provider_runtime_env_readiness.mjs` (created)
- `scripts/check_phase_3gg_k_env_hf5_contract.mjs` (created)
- `docs/planning/phase_3gg_k_env_hf5_minimal_local_provider_binding_fix_result_v0.1.md` (created)
- `package.json` (modified — 2 script entries added)
- `docs/planning/planning_changelog.md` (modified — entry prepended)

## Source diff summary

Single source file changed: `src/lib/server/providers/kisClient.ts`. Two small helpers were added (`getImportMetaEnv()` and `readEnvValue(name)`), and the five existing env reads in the readiness/config path (`classifyRuntime` runtime detection, `hasValue` credential presence, `getRuntimeConfig` credential resolution, the `KIS_ENABLE_LIVE_QUOTES` feature-flag read, and the `KIS_ENABLE_PREVIEW_LIVE_QUOTES` preview-guard read) were switched from reading `process.env` directly to reading through `readEnvValue`. No guard, ordering, reason code, response shape, token/quote request construction, or fail-closed branch was altered.

## Root cause confirmed

KIS_ENABLE_LIVE_QUOTES runtime env mismatch — **confirmed**.

`kisClient.ts` read all of its env (credentials, runtime classification, and the `KIS_ENABLE_LIVE_QUOTES` feature flag) exclusively from `process.env`. In the Astro dev/SSR runtime, `.env` file values are exposed through `import.meta.env`, **not** `process.env`. The KIS credentials happened to be visible in the Astro runtime via OS/shell-level environment variables (which is why the binding-level credential-presence check passed and the route failed with `PROVIDER_UNAVAILABLE` rather than `MISSING_CREDENTIAL`), but `KIS_ENABLE_LIVE_QUOTES=true` lived only in the `.env` file. As a result `getKisQuoteConfigReadiness()` computed `flagEnabled=false`, returned `reason: 'disabled'`, and the route surfaced `PROVIDER_UNAVAILABLE`. HF4's direct token+quote diagnostic bypassed this readiness flag entirely, which is why it succeeded while the route did not. This is precisely the dual-source problem already solved in `src/lib/server/supabaseAdmin.ts`, whose own comment documents that `import.meta.env` is "Astro-runtime-only" and that a `process.env` fallback is required for Node harnesses.

## Minimal fix summary

- **Files modified:** `src/lib/server/providers/kisClient.ts` only (one source file).
- **Type of fix:** introduced a dual-source env resolver `readEnvValue(name)` that reads the Astro/Vite runtime source `import.meta.env` first (where `.env` file values such as `KIS_ENABLE_LIVE_QUOTES` are exposed during `astro dev`/SSR) and falls back to `process.env` (where an owner-run Node harness, or OS-level exported vars, supply them). The readiness/config path now reads every value through this resolver. No env value is printed anywhere.
- **Why it is minimal:** it changes only the *source* each existing value is read from — it adds no dependency, no dotenv, no `.env` file reading, no new route, no new KIS endpoint, and touches no other source file. It mirrors an already-established, already-shipped pattern in `supabaseAdmin.ts` rather than inventing a new mechanism.
- **Why it does not weaken local-only gates:** `readEnvValue` returns the `import.meta.env` value only when it is a non-empty string, otherwise it falls back to `process.env`. In a deployed/production runtime `process.env.VERCEL_ENV`/`NODE_ENV` remain authoritative, so the existing hard blocks (`vercel-production`, `node-production`, unknown `VERCEL_ENV`, `KIS_ACCOUNT_NO` present, preview-without-guard) are all preserved and still fail closed. The route's own `localhost`-only hostname check and `ownerLocalKisIntegration=1` opt-in gate are untouched. The provider is not made globally enabled in production.

## Local dev server status before/after

- Reachable before: true — Reachable after: true
- Listening on 4321 before: true (PID 19240) — after: true (PID 10020)
- Fallback ports 5173/5174 listening before: false — after: false
- devServerRestartedForFix: true
- devServerRestartedAfterFix: true

The pre-fix dev server (PID 19240) was gracefully terminated with a normal (non-elevated) `taskkill` and a fresh `npm run dev` was started so the Astro SSR runtime would load the `kisClient.ts` change; it came up listening on 4321 (PID 10020).

## HF5 diagnostic command used

```
npm run owner-diagnostic:phase-3gg-k-env-hf5 -- --owner-approved-local-provider-runtime-env-diagnostic --base-url=http://localhost:4321
```

## HF5 diagnostic summary

- localDevServerReachable: true
- localCurrentPriceRouteReachable: true
- localCurrentPriceSourceStatus: ok
- localCurrentPriceSanitizedErrorCode: null
- localCurrentPricePresent: true
- localVolumePresent: true
- shellKisLiveQuotesExactlyTrue: false
- routeRuntimeFlagEvidenceKind: route-ready
- suspectedRuntimeEnvMismatch: false

## G-FAST owner smoke result

Ran `npm run owner-smoke:phase-3gg-g-fast -- --owner-approved-real-kis-smoke`. Result: `PASS symbol=005930 sourceStatus=ok currentPricePresent=true volumePresent=true sanitized=true`. No secrets, raw payload, or numeric price/volume were printed. Corroborates the route fix independently through the pre-existing smoke path.

## Optional HF4 diagnostic regression result

Not re-run this phase — the HF5 route-side success plus the G-FAST smoke success already confirm the current_price path end-to-end, and HF4 already proved the direct token+quote path succeeds. The `kisClient.ts` change only widens the env *source* for reads and preserves the `process.env` fallback, so the direct-path behavior HF4 measured is unchanged.

## Classification rationale

The route returned `sourceStatus=ok` with `currentPricePresent=true` and `volumePresent=true` (`routeRuntimeFlagEvidenceKind=route-ready`) while `shellKisLiveQuotesExactlyTrue=false`. Because the shell/process env did not carry the flag as exactly `"true"`, the route's readiness now depends specifically on resolving `KIS_ENABLE_LIVE_QUOTES` from the Astro runtime source (`import.meta.env`, backed by `.env`) — exactly the runtime-flag injection this phase implemented. That makes the outcome `FIXED_RUNTIME_FLAG_INJECTION_CURRENT_PRICE_READY` rather than the plain `FIXED_CURRENT_PRICE_READY` (which would apply only if the shell flag had already been exactly `"true"`).

## Owner-safe next action

Proceed to Phase 3GG-K-QA-OWNER-RERUN-2 — Verify Success-path Summary Quality After KIS Runtime Correction. The current_price runtime blocker is resolved; the next phase should confirm the downstream Chart AI success-path summary quality now that live quotes flow through the local route.

## Exposure status

- KIS_BASE_URL raw value exposure: Not exposed
- credential exposure: Not exposed
- token exposure: Not exposed
- Authorization header exposure: Not exposed
- raw KIS request exposure: Not exposed
- raw KIS payload exposure: Not exposed
- raw KIS HTTP response body exposure: Not exposed
- raw KIS error message exposure: Not exposed
- raw LLM response exposure: Not exposed
- prompt exposure: Not exposed
- currentPrice numeric exposure: Not exposed
- volume numeric exposure: Not exposed

## KIS endpoint expansion status

- current_price only for market data: confirmed
- No order/account/balance/funds/portfolio/trading/personal endpoints: confirmed

## Env file status

- `.env`/`.env.local` not printed: confirmed
- `.env`/`.env.local` not modified: confirmed
- `.env`/`.env.local` not staged: confirmed
- `.env`/`.env.local` not committed: confirmed

## Local-only guard preservation

- localhost required: preserved (route `resolveLocalHostname` + binding `evaluateLocalOnlyGuard` unchanged)
- ownerLocalKisIntegration=1 required: preserved (route opt-in gate unchanged)
- deployed/production fail-closed preserved: preserved (`classifyRuntime` still blocks `vercel-production`/`node-production`/unknown `VERCEL_ENV`; `process.env` remains authoritative for those values in deployed runtimes)

## Validation results

- `npm run owner-diagnostic:phase-3gg-k-env-hf5 -- --owner-approved-local-provider-runtime-env-diagnostic --base-url=http://localhost:4321`: PASS (`FIXED_RUNTIME_FLAG_INJECTION_CURRENT_PRICE_READY`)
- `npm run owner-smoke:phase-3gg-g-fast -- --owner-approved-real-kis-smoke`: PASS (`sourceStatus=ok currentPricePresent=true volumePresent=true sanitized=true`)
- `npm run check:phase-3gg-k-env-hf5`: PASS
- `npm run check:phase-3gg-k-env-hf4`: PASS (regression)
- `npm run build`: PASS
- `git diff --check`: clean
- `git status --short`: reviewed, only authorized files staged

## Push/deploy status

Not pushed. Not deployed.

## Next recommended phase

Phase 3GG-K-QA-OWNER-RERUN-2 — Verify Success-path Summary Quality After KIS Runtime Correction. (If any regression later reappears on the local route, fall back to Phase 3GG-K-ENV-HF6 — Narrow Local Route Provider Failure.)
