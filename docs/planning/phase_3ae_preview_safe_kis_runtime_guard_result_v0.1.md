# Phase 3AE Preview-Safe KIS Runtime Guard Implementation Result v0.1

## 1. Title And Metadata

- **Phase**: 3AE
- **Type**: Preview-safe KIS runtime guard implementation result
- **Status**: Implemented and locally validated
- **Previous decision document**: `docs/planning/phase_3ad_kis_runtime_guard_preview_production_decision_v0.1.md`
- **Production KIS status**: Blocked — `VERCEL_ENV=production` is an absolute hard block, unchanged
- **Vercel env mutation**: Not performed
- **Deployment**: Not performed
- **Live KIS execution by Claude Code**: Not performed
- **Date**: 2026-06-22

---

## 2. Objective

Phase 3AE implements the Phase 3AD Option B policy:

- **Vercel Production** remains hard-blocked unconditionally.
- **Vercel Preview** allows live KIS only when a new explicit Preview opt-in guard (`KIS_ENABLE_PREVIEW_LIVE_QUOTES=true`) is set in addition to the existing feature flag and credentials.
- **Local non-production** behavior is unchanged.
- **Non-Vercel `NODE_ENV=production`** remains blocked as a defense-in-depth fallback for non-Vercel environments.
- **Unknown `VERCEL_ENV` values** fail closed.
- **`KIS_ACCOUNT_NO` presence** blocks quote readiness in all non-hard-blocked runtimes.

---

## 3. Implementation Summary

### Files Changed

| File | Change |
|---|---|
| `src/lib/server/providers/types.ts` | Added `'preview_guard_required'` to `ProviderConfigReadiness.reason` union |
| `src/lib/server/providers/providerEnv.ts` | Added `'KIS_ENABLE_PREVIEW_LIVE_QUOTES'` to `ProviderEnvName` union and registry |
| `src/lib/server/providers/kisClient.ts` | Replaced `isProductionRuntime()` with `classifyRuntime()`; updated `getKisQuoteConfigReadiness()` and `readinessToError()` |
| `scripts/check_kis_runtime_guard_policy.mjs` | New safe guard policy validation script (no network calls, no TypeScript imports) |
| `package.json` | Added `check:kis-runtime-guard` script |

### Runtime Classification Behavior

The old `isProductionRuntime()` boolean was replaced by `classifyRuntime()` returning one of six explicit classes:

| `VERCEL_ENV` | `NODE_ENV` | Runtime Class |
|---|---|---|
| `production` | any | `vercel-production` |
| `preview` | any | `vercel-preview` |
| `development` | any | `vercel-development` |
| absent/empty | `production` | `node-production` |
| absent/empty | other | `local` |
| any other value | any | `unknown` |

### Guard Flow in `getKisQuoteConfigReadiness()`

1. Classify runtime using `classifyRuntime()`.
2. Hard block if `vercel-production`, `node-production`, or `unknown` → return `reason: 'production_not_allowed'`.
3. Block if `KIS_ACCOUNT_NO` is present → return `reason: 'production_not_allowed'`.
4. Block if `vercel-preview` and `KIS_ENABLE_PREVIEW_LIVE_QUOTES !== 'true'` → return `reason: 'preview_guard_required'`.
5. Block if `KIS_ENABLE_LIVE_QUOTES !== 'true'` → return `reason: 'disabled'`.
6. Block if required credentials missing → return `reason: 'config_missing'`.
7. Return `reason: 'ready'` (local / vercel-development / vercel-preview-with-guard).

### New Env Name

`KIS_ENABLE_PREVIEW_LIVE_QUOTES` — non-secret explicit Preview opt-in flag. Registered in `providerEnv.ts` with `productionAllowed: false`, `requiredPhase: '3AE'`, `owner: 'engineering'`, `serverOnly: true`, `browserSafe: false`.

---

## 4. Guard Policy Matrix

| Runtime | Env Flags Required | `KIS_ACCOUNT_NO` | Result |
|---|---|---|---|
| Local non-production | `KIS_ENABLE_LIVE_QUOTES=true` + credentials | must be absent | Allowed → `ready` |
| Non-Vercel `NODE_ENV=production` | any | any | Blocked → `production_not_allowed` |
| Vercel Preview without preview guard | any | any | Blocked → `preview_guard_required` |
| Vercel Preview with preview guard | `KIS_ENABLE_PREVIEW_LIVE_QUOTES=true` + `KIS_ENABLE_LIVE_QUOTES=true` + credentials | must be absent | Allowed → `ready` |
| Vercel Production | any | any | Blocked → `production_not_allowed` |
| Unknown `VERCEL_ENV` | any | any | Blocked → `production_not_allowed` |

---

## 5. Validation Results

### `node --check scripts/check_kis_runtime_guard_policy.mjs`

```
syntax-ok
```

Exit code: 0. Pass.

### `npm run check:kis-runtime-guard`

```
check:kis-runtime-guard step=start status=running sanitized=true
check:kis-runtime-guard step=local-non-production-allowed status=pass expected-ready=true actual-ready=true expected-reason=ready actual-reason=ready runtimeClass=local sanitized=true
check:kis-runtime-guard step=vercel-production-blocked status=pass expected-ready=false actual-ready=false expected-reason=production_not_allowed actual-reason=production_not_allowed runtimeClass=vercel-production sanitized=true
check:kis-runtime-guard step=vercel-preview-blocked-no-preview-guard status=pass expected-ready=false actual-ready=false expected-reason=preview_guard_required actual-reason=preview_guard_required runtimeClass=vercel-preview sanitized=true
check:kis-runtime-guard step=vercel-preview-allowed-with-preview-guard status=pass expected-ready=true actual-ready=true expected-reason=ready actual-reason=ready runtimeClass=vercel-preview sanitized=true
check:kis-runtime-guard step=non-vercel-node-production-blocked status=pass expected-ready=false actual-ready=false expected-reason=production_not_allowed actual-reason=production_not_allowed runtimeClass=node-production sanitized=true
check:kis-runtime-guard step=unknown-vercel-env-blocked status=pass expected-ready=false actual-ready=false expected-reason=production_not_allowed actual-reason=production_not_allowed runtimeClass=unknown sanitized=true
check:kis-runtime-guard step=account-no-present-blocked status=pass expected-ready=false actual-ready=false expected-reason=production_not_allowed actual-reason=production_not_allowed runtimeClass=local sanitized=true
check:kis-runtime-guard step=summary status=pass passed=7 failed=0 total=7 sanitized=true
check:kis-runtime-guard step=forbidden-output-check status=pass sanitized=true
```

Exit code: 0. All 7 tests passed.

### `npm run check:provider-boundaries`

```
Provider boundary validation passed.
```

Exit code: 0. Pass.

### `npx tsc --noEmit`

No output. Exit code: 0. Pass.

### `npm run build`

```
[build] mode: "server"
[build] adapter: @astrojs/vercel
[build] ✓ Completed in 8.78s.
[build] Complete!
```

Exit code: 0. Pass.

### `git diff --check`

LF→CRLF warnings only (expected for this repository). No whitespace errors. Exit code: 0. Pass.

---

## 6. Confirmed Non-Actions

- No live KIS call was run by Claude Code.
- No live Supabase query or write was run by Claude Code.
- No SQL was executed.
- No Astro dev server was started.
- No Vercel CLI command was run.
- No Vercel environment variable was mutated.
- No deployment occurred.
- No `.env*` file contents were read.
- No UI live quote wiring was implemented.
- No account, order, trading, balance, holdings, or WebSocket API was implemented.
- No actual stock symbol, price value, secret, token, key, raw KIS field, account data, raw error, stack trace, project ref, Supabase URL, service-role key, anon key, or connection string was recorded.
- `KIS_ACCOUNT_NO` was never set to a real value; it was used only as a synthetic placeholder in the guard validation script (`synthetic-account-no-for-guard-test`).

---

## 7. Remaining Limitations

- **Vercel Preview env values not configured.** `KIS_ENABLE_PREVIEW_LIVE_QUOTES` does not yet exist in the Vercel project settings. This requires a separate owner-approved step.
- **Vercel Preview deployment not performed.** The guard change is not yet deployed to any Preview function. Endpoint behavior is unvalidated in any deployed runtime.
- **Preview endpoint validation not performed.** No `/api/market/quote` call has been made in a Vercel Preview environment with the new guard.
- **Production KIS remains blocked.** The `VERCEL_ENV=production` hard block is unchanged. No Production gate decision has been made.
- **UI live quote wiring remains blocked.** Market, Portfolio, Chart AI, Home, and Lab remain disconnected from live quote data until Preview validation passes and owner explicitly approves wiring.
- **KIS error/fallback paths remain unvalidated** in any deployed environment.
- **Cold-start token cache behavior in Vercel** — the in-memory `accessTokenCache` resets on each function cold start; behavior in a deployed Preview function is not tested.

---

## 8. Recommended Next Steps

| Option | Description |
|---|---|
| **Option 1 — Phase 3AF: Vercel Preview env mutation plan (owner-approved only)** | Owner approves adding `KIS_ENABLE_PREVIEW_LIVE_QUOTES=true`, `KIS_ENABLE_LIVE_QUOTES=true`, and KIS credential env vars to Vercel Preview scope only. Does not touch Production env. Requires separate owner approval for the env mutation step and the deployment step. |
| **Option 2 — Phase 3AF alternative: owner-run Preview runtime env inspection without secrets** | Owner deploys a Preview build and inspects the runtime environment (VERCEL_ENV, NODE_ENV values, guard readiness endpoint) using only non-secret env vars to confirm the guard classification fires correctly in a real Preview function before adding KIS credentials. |
| **Option 3 — Defer Preview deployment, validate KIS error/fallback paths locally first** | Validate KIS 429 rate-limit, non-`0` `rt_cd`, missing price field, and network failure error paths in a local smoke harness before deploying to Vercel Preview. |

**Keep Production blocked regardless of which option is pursued.**
**Keep UI live quote wiring blocked until Vercel Preview endpoint validation passes and owner explicitly approves.**
