# Phase 3AB Owner-Run Live Supabase Persistent Cache + Live KIS Quote Validation Result v0.1

## 1. Title And Metadata

- **Phase**: 3AB
- **Type**: Owner-run live Supabase persistent cache + live KIS quote validation result
- **Status**: Passed
- **Execution mode**: Owner-run live-approved
- **Claude Code live execution**: Not performed — Claude Code did not run the live harness, make live KIS calls, or perform live Supabase queries or writes
- **Script path**: `scripts/owner_smoke_supabase_cache_live_kis_quote.mjs`
- **npm script**: `smoke:supabase-cache-live-kis-quote:dry`
- **Previous harness result document**: `docs/planning/phase_3ab_supabase_persistent_cache_live_kis_quote_harness_result_v0.1.md`
- **Previous validated phase**: Phase 3AA — owner-run local `/api/market/quote` HTTP endpoint verification (all 11 criteria passed)
- **Date**: 2026-06-22

---

## 2. Objective

This document records the result of the owner-run live execution of the Phase 3AB fail-closed harness (`scripts/owner_smoke_supabase_cache_live_kis_quote.mjs`). The validation verified, using sanitized evidence only, that a live KIS quote response can be:

1. Fetched from the KIS domestic quote API.
2. Persisted to the Supabase persistent quote cache (`market_quote_cache` table) via `setConfiguredQuoteCacheEntry()`.
3. Recovered from Supabase after the in-memory cache is explicitly cleared via `clearQuoteCacheForTests()`.

The Strategy 1 proof structure (in-process memory flush) conclusively attributes the second `cache-fresh` response to Supabase rather than the in-memory `Map`, because the in-memory Map was empty at the time of the second call.

No actual stock symbol, price value, KIS credential, Supabase credential, or any other sensitive value was recorded.

---

## 3. Sanitized Owner-Provided Evidence

The owner ran the harness in live-approved mode and provided the following sanitized step-level evidence. No actual symbol, price, token, key, raw KIS field, raw response body, or secret was recorded.

| Evidence Field | Value |
|---|---|
| Command type | Owner-run live-approved harness execution |
| npm script | `smoke:supabase-cache-live-kis-quote:dry` |
| Live mode | live-approved |
| `liveKis` | true |
| `liveSupabase` | true |
| `guard-check` | passed |
| `runtime-check` | passed |
| `nodeEnvIsProduction` | false |
| `vercelEnvIsProduction` | false |
| `kis-accno-check` | passed |
| `kisAccnoAbsent` | true |
| `cache-backend-check` | passed |
| `configuredBackend` | supabase |
| `smoke-identity-validation` | passed |
| `runtime-setup` | passed |
| `module-import` | passed |
| `config-preflight` | passed |
| `first-call` | passed |
| `firstCallReason` | provider-fresh |
| `memory-flush` | passed |
| `memoryFlushNote` | in-memory-map-cleared-supabase-untouched |
| `second-call` | passed |
| `secondCallReason` | cache-fresh |
| `final-result` | passed |
| `supabaseReadbackConclusive` | true |
| `sanitized` | true |

Post-run shell environment cleanup was recommended separately but was not part of the provided harness output.

---

## 4. Success Criteria Assessment

| Criterion | Status |
|---|---|
| Live approval guards passed (`MK_STOCK_LAB_PHASE_3AB_LIVE_APPROVAL`, `MK_STOCK_LAB_PHASE_3AB_LIVE_MODE`) | Passed |
| Runtime was non-production (`nodeEnvIsProduction=false`, `vercelEnvIsProduction=false`) | Passed |
| `KIS_ACCOUNT_NO` was absent (`kisAccnoAbsent=true`) | Passed |
| Configured cache backend was `supabase` (`configuredBackend=supabase`) | Passed |
| Config preflight passed (KIS and Supabase env names present) | Passed |
| First call passed with `provider-fresh` (live KIS fetch succeeded, cache written) | Passed |
| In-memory cache cleared while Supabase cache remained untouched | Passed |
| Second call passed with `cache-fresh` (Supabase served the entry) | Passed |
| Supabase readback was conclusive (`supabaseReadbackConclusive=true`) | Passed |
| Final result passed | Passed |
| Output was sanitized (`sanitized=true`) | Passed |

All 11 success criteria passed.

---

## 5. Interpretation

The `firstCallReason=provider-fresh` confirms that the live KIS API was successfully invoked, a valid quote snapshot was returned and normalized, and `setConfiguredQuoteCacheEntry()` wrote the snapshot to both the in-memory Map and the Supabase `market_quote_cache` table.

The `memory-flush` step confirms that `clearQuoteCacheForTests()` cleared the in-memory Map, leaving the Supabase row untouched.

The `secondCallReason=cache-fresh` confirms that `getConfiguredQuoteCacheEntry()` found a fresh row in Supabase and returned it without calling the KIS provider again.

Because the in-memory Map was empty at the time of the second call, the `cache-fresh` result is conclusively attributable to Supabase persistent cache. `supabaseReadbackConclusive=true` is the correct conclusion.

**This validation provides conclusive evidence that a live KIS quote response can be persisted to Supabase persistent quote cache and read back from Supabase after the in-memory cache is cleared.** This is the first time this complete path — live KIS fetch → Supabase write → in-memory flush → Supabase readback → `cache-fresh` — has been validated in a local non-production environment.

---

## 6. Confirmed Non-Actions

- Claude Code did not run the live validation.
- Claude Code did not run live KIS calls.
- Claude Code did not run live Supabase queries or writes.
- Claude Code did not execute SQL.
- Claude Code did not start an Astro dev server.
- Claude Code did not use Vercel CLI.
- No Vercel environment mutation occurred.
- No deployment occurred.
- No `.env*` contents were read.
- No source code in `src/` was changed in this result-recording task.
- No scripts in `scripts/` were changed in this result-recording task.
- No `package.json` was changed in this result-recording task.
- No production KIS guard (`isProductionRuntime()` in `kisClient.ts`) was changed.
- No UI live quote wiring was implemented.
- No actual stock symbol was recorded.
- No price value was recorded.
- No secret, token, key, raw KIS field, raw response body, account data, raw provider error, or stack trace was recorded.
- No Supabase URL, service-role key, anon key, project ref, or connection string was recorded.

---

## 7. Remaining Limitations

Phase 3AB validated the local non-production end-to-end path from live KIS fetch through Supabase persistent cache write and readback. The following remain unvalidated:

- **Vercel Preview environment behavior** — unvalidated. Supabase persistent cache behavior in a deployed Vercel function (cold start, concurrent invocations, TTL behavior) has not been tested.
- **Vercel Production environment behavior** — permanently blocked by `isProductionRuntime()` in `kisClient.ts` until a separate code change and explicit owner approval (Phase 3X gate decision).
- **Production KIS enablement** — no change made. The Phase 3X gate decision (Option A, B, or C) must be made before any Vercel env mutation, deployment change, or production KIS guard modification.
- **UI live quote wiring** — Market, Portfolio, Chart AI, Home, and Lab remain disconnected from live quote data.
- **KIS rate-limit and error fallback paths** — 429 rate-limit, non-`0` `rt_cd`, missing price field, or network failure responses from KIS have not been exercised under live conditions.
- **Cold-start token cache behavior in Vercel** — the in-memory `accessTokenCache` in `kisClient.ts` resets on each function cold start; behavior in the deployed runtime is not tested.
- **Sustained-load and repeated-call behavior** — only a single token request and one or two quote requests were made; behavior under sustained load or near-quota conditions is unknown.
- **`KIS_ACCOUNT_NO`** — must remain absent in all subsequent phases unless a separate explicit owner approval is given.

---

## 8. Result

**Phase 3AB owner-run live Supabase persistent cache + live KIS quote validation passed.**

This is the first recorded end-to-end validation of the complete path:

```
Live KIS domestic quote API fetch
  → Quote normalization → QuoteSnapshot (public fields only)
  → setConfiguredQuoteCacheEntry() → in-memory Map write + Supabase upsert
  → clearQuoteCacheForTests() → in-memory Map cleared; Supabase row untouched
  → getConfiguredQuoteCacheEntry() → Supabase read → cache-fresh response
  → supabaseReadbackConclusive=true
```

Combined with Phase 3Z (local live KIS fetch and normalization), Phase 3AA (HTTP route response shape with live KIS backing), and Phase 3V (Supabase persistent cache synthetic payload smoke), the local server-side quote pipeline is now validated end-to-end from HTTP request through live KIS provider through Supabase persistent cache in a local non-production environment.

---

## 9. Recommended Next Steps

| Option | Description |
|---|---|
| **Option 1** | Treat Phase 3AB as complete and proceed to Vercel Preview gate planning. |
| **Option 2** | Plan KIS error/fallback path validation before moving to Vercel deployment. |
| **Option 3** | Plan Vercel Preview environment validation with `QUOTE_CACHE_BACKEND=supabase` without enabling Production KIS. |
| **Option 4** | Keep UI live quote wiring blocked until deployment and runtime gate decisions are fully resolved. |

The Phase 3X gate decision (Option A, B, or C for Production KIS enablement) must be made before any Vercel environment mutation, deployment change, or production KIS guard modification, regardless of which option above is pursued next.
