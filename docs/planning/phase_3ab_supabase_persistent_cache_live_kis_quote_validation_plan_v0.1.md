# Phase 3AB Supabase Persistent Cache Live KIS Quote Validation Plan v0.1

## 1. Title And Phase Metadata

- **Phase**: 3AB
- **Type**: Planning-only — no execution in this document
- **Target**: Supabase persistent quote cache validation with a live KIS quote response
- **Current status**: Planned, not executed
- **Previous validated phase**: Phase 3AA — local `/api/market/quote` HTTP response shape validated with live KIS backing
- **Execution model for future phase**: Owner-run local only
- **Created**: 2026-06-21

---

## 2. Background

### Completed Prior Phases

**Phase 3V** validated the Supabase persistent quote cache write, readback, and cleanup path in isolation, using the `scripts/owner_smoke_persistent_quote_cache_live.mjs` harness with a synthetic `QuoteSnapshot` test payload. This confirmed that the `market_quote_cache` Supabase table is accessible, writable, readable, and that the lifecycle migration was applied correctly. It did not involve a live KIS API call.

**Phase 3Z** validated that the local KIS OAuth token endpoint and domestic quote price inquiry endpoint can be reached from a local non-production Node.js runtime, that the response can be normalized into a browser-safe `QuoteSnapshot`, and that the Phase 3Y harness cache mock (in-process) passed write/readback/cleanup. It did not write to Supabase.

**Phase 3AA** validated that the local Astro `/api/market/quote` HTTP route returns the correct response shape — HTTP 200, `Cache-Control: no-store`, `{ ok: true, data: QuoteSnapshot, fallback }` — with live KIS backing in a local non-production dev-server. The owner noted `QUOTE_CACHE_BACKEND` was unset or defaulting to memory for Phase 3AA.

### Remaining Gap

The project has not yet validated **live KIS quote data being persisted to and read back from the Supabase persistent quote cache through the production quote pipeline** with `QUOTE_CACHE_BACKEND=supabase` explicitly enabled. Specifically:

- It is unverified that `writeSupabaseQuoteCacheSuccess()` is called with a live normalized `QuoteSnapshot` and that the write reaches the Supabase `market_quote_cache` table.
- It is unverified that a subsequent `readSupabaseQuoteCacheEntry()` call in a fresh runtime (no in-memory cache) finds the persisted entry and serves it as `fallback.reason = 'cache-fresh'`.
- It is unverified that `buildSafeQuoteJson()` correctly serializes the live normalized `QuoteSnapshot` into the `quote_json` column and that `buildSnapshotFromRow()` can deserialize it back correctly.

---

## 3. Objective

Phase 3AB aims to validate the combined live KIS quote + Supabase persistent cache path through the local server quote pipeline.

Specifically, the future owner-run validation should confirm:

1. Enabling `QUOTE_CACHE_BACKEND=supabase` causes `getConfiguredQuoteCacheEntry()` to try the Supabase backend first on every request.
2. A first request with a cold Supabase cache fetches a live KIS quote, normalizes it, writes the `QuoteSnapshot` to Supabase via `writeSupabaseQuoteCacheSuccess()`, and returns `fallback.reason = 'provider-fresh'`.
3. After a full process restart (clearing the in-memory cache), a second request to the same symbol within the Supabase entry's fresh TTL window reads from Supabase via `readSupabaseQuoteCacheEntry()` and returns `fallback.reason = 'cache-fresh'` — provably from Supabase, not from in-memory cache, because the process is fresh.
4. The response evidence remains sanitized throughout: no price values, no raw KIS fields, no tokens, no keys, no account data, no raw errors, no stack traces, and no Supabase row contents.

---

## 4. Explicit Non-Goals

Phase 3AB does not include and must not be extended to include any of the following:

- UI live quote wiring — Market, Portfolio, Chart AI, Home, Lab, or any browser UI connected to live quote data
- Vercel Preview environment test
- Vercel Production environment test
- Vercel deployment of any kind
- Vercel environment variable mutation
- Production KIS enablement — `isProductionRuntime()` guard in `kisClient.ts` must not be changed
- Any change to `kisClient.ts` or any other source file
- DB schema change or migration modification
- SQL execution or Supabase CLI commands
- Supabase project listing or Supabase MCP database tools
- KIS account, order, trading, balance, holdings, or WebSocket APIs
- `KIS_ACCOUNT_NO` — must remain absent
- KIS rate-limit stress testing
- Production load testing
- Claude Code running a live KIS call
- Claude Code running a live Supabase query or write
- Claude Code starting an Astro dev server

---

## 5. Safety Gates

| Gate | Requirement |
|---|---|
| Owner-run only | All live KIS and Supabase interactions must be performed by the owner in a private local shell |
| Claude Code KIS calls | Must not run live KIS calls |
| Claude Code Supabase calls | Must not run live Supabase queries or writes |
| Runtime | Local non-production only — both dev-server runs |
| `NODE_ENV` | Must not be `production` in either dev-server run |
| `VERCEL_ENV` | Must not be `production`; likely absent in local shell |
| `KIS_ACCOUNT_NO` | Must remain absent throughout all Phase 3AB steps |
| Secret handling | KIS credentials, Supabase URL, anon key, service-role key must be entered only by the owner in the private local shell — must never appear in logs, documentation, or chat |
| Actual stock symbol | Must not be recorded — use `<REDACTED_6_DIGIT_KR_CODE>` in all documentation |
| Price values | Must not be recorded |
| Raw KIS fields | Must not appear in response or documentation (`stck_prpr`, `prdy_vrss`, `prdy_ctrt`, `acml_vol`, `rt_cd`, `output`) |
| Supabase row contents | Must not be recorded — evidence is field-presence and boolean checks only |
| Response evidence | Sanitized field presence and boolean checks only — no raw response bodies |
| Supabase table contents | Must not be queried or recorded directly by Claude Code |

---

## 6. Required Environment Names

Values must never be recorded. The owner sets all of these privately in the local shell.

### KIS

| Name | Required | Secret | Notes |
|---|---|---|---|
| `KIS_APP_KEY` | Yes | Yes | KIS API app key |
| `KIS_APP_SECRET` | Yes | Yes | KIS API app secret |
| `KIS_BASE_URL` | Yes | Non-secret internal | KIS API base URL |
| `KIS_ENABLE_LIVE_QUOTES` | Yes | Non-secret | Must be string `true` |
| `KIS_ACCOUNT_NO` | Must be absent | Yes | Must not be present |

### Supabase Cache

| Name | Required | Secret | Notes |
|---|---|---|---|
| `QUOTE_CACHE_BACKEND` | Yes | Non-secret | Must be set to `supabase` |
| `PUBLIC_SUPABASE_URL` | Yes | Non-secret (public) | Supabase project URL |
| `PUBLIC_SUPABASE_ANON_KEY` | Yes | Non-secret (public) | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Yes — never record | Supabase service role key |

### Runtime

| Name | Verify only | Notes |
|---|---|---|
| `NODE_ENV` | Must not be `production` in either run | Verify before each dev-server start |
| `VERCEL_ENV` | Must not be `production`; likely absent in local shell | Verify before each dev-server start |

---

## 7. Proposed Owner-Run Validation Approach

This procedure is defined for future owner execution. Claude Code must not run any step.

### Step 1 — Confirm baseline

Confirm the `market_quote_cache` table in Supabase contains no existing rows for the test symbol (optional, but helps establish a clean baseline). The Phase 3V harness cleanup deleted the smoke row; the table may already be clean.

### Step 2 — Open a private local shell

Open a new PowerShell window not connected to any logging or recording system.

### Step 3 — Set all environment variables privately

Set the following privately (values not shown — owner knows them):

```powershell
$env:KIS_APP_KEY = "<owner sets privately>"
$env:KIS_APP_SECRET = "<owner sets privately>"
$env:KIS_BASE_URL = "<owner sets privately>"
$env:KIS_ENABLE_LIVE_QUOTES = "true"
$env:QUOTE_CACHE_BACKEND = "supabase"
$env:PUBLIC_SUPABASE_URL = "<owner sets privately>"
$env:PUBLIC_SUPABASE_ANON_KEY = "<owner sets privately>"
$env:SUPABASE_SERVICE_ROLE_KEY = "<owner sets privately>"
```

Do not paste these values into any chat, log file, or documentation.

### Step 4 — Confirm safety gates

```powershell
echo $env:NODE_ENV       # must be empty or non-production
echo $env:VERCEL_ENV     # must be empty or non-production
echo $env:KIS_ACCOUNT_NO # must be empty
```

If any gate fails, stop.

### Step 5 — First dev-server run (cache write)

Start the local Astro dev server:

```powershell
npx astro dev
```

Once listening, send the first request:

```
GET http://localhost:4321/api/market/quote?market=KR&symbol=<REDACTED_6_DIGIT_KR_CODE>
```

Record sanitized response-shape evidence only (field presence, `fallback.reason`, HTTP status, no price values). Expected `fallback.reason = 'provider-fresh'` for the first request to a cold Supabase cache.

Stop the dev server (`Ctrl+C`). This clears the in-memory cache completely.

### Step 6 — Second dev-server run (cold-start Supabase readback)

Start the local Astro dev server again in the same shell (all env vars still set):

```powershell
npx astro dev
```

**Important**: Starting a new process means the in-memory `Map` cache in `quoteCache.ts` is empty. The only populated cache is in Supabase.

Send a second request within the Supabase entry's fresh TTL window (within 15 seconds of the first request's cache write timestamp — this may require sending it quickly, or adjusting timing):

```
GET http://localhost:4321/api/market/quote?market=KR&symbol=<REDACTED_6_DIGIT_KR_CODE>
```

Record sanitized response-shape evidence only. If `fallback.reason = 'cache-fresh'`, this confirms Supabase readback — the fresh process had no in-memory cache, so the only possible source is Supabase.

Stop the dev server.

### Step 7 — Cleanup

Remove private env vars from the shell session:

```powershell
Remove-Item Env:KIS_APP_KEY
Remove-Item Env:KIS_APP_SECRET
Remove-Item Env:KIS_BASE_URL
Remove-Item Env:KIS_ENABLE_LIVE_QUOTES
Remove-Item Env:QUOTE_CACHE_BACKEND
Remove-Item Env:PUBLIC_SUPABASE_URL
Remove-Item Env:PUBLIC_SUPABASE_ANON_KEY
Remove-Item Env:SUPABASE_SERVICE_ROLE_KEY
```

---

## 8. Cache Behavior Evidence Design

Required positive evidence for Phase 3AB (sanitized, no price values, no raw response bodies):

| Evidence Item | Expected Value |
|---|---|
| First request HTTP status | 200 |
| First request JSON parse | OK |
| First request `Cache-Control` | `no-store` |
| First request `ok` | `true` |
| First request `data` object present | Yes |
| First request `fallback` object present | Yes |
| First request required normalized fields present (`market`, `symbol`, `price`, `currency`, `asOf`) | Yes |
| First request raw KIS fields absent | Yes |
| First request secrets/tokens/raw errors/stack traces absent | Yes |
| First request `fallback.reason` | `provider-fresh` (cold Supabase cache path confirmed) |
| Second request (cold-start process) HTTP status | 200 |
| Second request JSON parse | OK |
| Second request `ok` | `true` |
| Second request `data` object present | Yes |
| Second request `fallback` object present | Yes |
| Second request required normalized fields present | Yes |
| Second request `fallback.reason` | `cache-fresh` (Supabase readback confirmed — no in-memory cache in fresh process) |
| Second request raw KIS fields absent | Yes |
| Second request secrets/tokens/raw errors/stack traces absent | Yes |

The 15-second fresh TTL (`QUOTE_CACHE_FRESH_TTL_MS = 15_000`) means the second request must arrive within 15 seconds of the Supabase write timestamp from Step 5. If the owner cannot send the second request within the fresh TTL, the expected `fallback.reason` may be `provider-fresh` again (Supabase entry is stale or expired and KIS is called again). The owner evidence template includes a timing note to account for this.

---

## 9. Important Contract Limitation Analysis

### Finding: The current `/api/market/quote` response is **partially sufficient but not fully conclusive** without the cold-start technique described in Section 7.

**What the current response contract exposes:**

`getQuoteSnapshot()` in `quotes.ts` produces a `fallback` object in the response that distinguishes:
- `fallback.reason = 'provider-fresh'` — no cache hit; KIS was called; result written to cache
- `fallback.reason = 'cache-fresh'` — a fresh cache entry was found; KIS was not called
- `fallback.reason = 'cache-stale-provider-failed'` — stale cache used as fallback

The `fallback.cache` metadata includes `hit: true`, `state`, `cachedAt`, `freshUntil`, `staleUntil` timestamps. These are sanitized (no price data, no row contents).

**The ambiguity:**

When `QUOTE_CACHE_BACKEND=supabase`, `setConfiguredQuoteCacheEntry()` **always writes to both the in-memory cache and Supabase simultaneously** (see `quoteCache.ts` lines 120–131). On the first request, the normalized `QuoteSnapshot` is written to both backends.

On a second request **within the same process**, `getConfiguredQuoteCacheEntry()` tries Supabase first (line 111–117), but the in-memory cache was also populated. If Supabase read succeeds, the Supabase entry is returned. If Supabase read fails silently (network error, timeout), the code falls back to the in-memory entry (line 117). In either case, `fallback.reason` in the response is `'cache-fresh'`. **The response cannot prove which backend served the second request in a same-process scenario.**

**The solution — cold-start readback:**

By **stopping and restarting the dev server** between the two requests (as described in Section 7, Steps 5–6), the in-memory `Map` cache is empty at the start of the second process. If the second request returns `fallback.reason = 'cache-fresh'`, it **must** have come from Supabase — there is no other cache source. This makes the evidence conclusive.

**If the 15-second TTL window is missed**, both runs will call KIS again and return `'provider-fresh'`. This is not a failure of the pipeline — it means the TTL expired between the two runs. In that case, the evidence would be inconclusive for Supabase readback specifically, and the owner should use Option B (harness) for more reliable timing control.

**Conclusion for the planning document:**

A manual cold-start two-run procedure (Option A) can provide conclusive Supabase readback evidence if the owner can execute the second request within the 15-second fresh TTL after the dev-server restart. If timing is unreliable, Option B (fail-closed harness) is the recommended path.

---

## 10. Suggested Future Execution Options

### Option A — Owner manual cold-start validation using the existing route

**Procedure**: Two dev-server runs with a process restart between them, as defined in Section 7.

| | |
|---|---|
| **Benefit** | No new code required; uses the existing route and evidence template; no harness risk |
| **Risk** | 15-second fresh TTL window is very tight; if timing is missed, the second request fetches from KIS again and Supabase readback is not provable |
| **Required approval** | Owner approval to run (no code change needed) |
| **Source code change** | No |
| **Exposes price values or secrets** | No — if the evidence template is followed |

### Option B — Fail-closed owner-run harness (`scripts/owner_smoke_supabase_cache_live_kis_quote.mjs`)

**Procedure**: A new harness modeled after Phase 3Y (`owner_smoke_kis_quote_live.mjs`) that directly calls `getQuoteSnapshot()` with `QUOTE_CACHE_BACKEND=supabase`, captures the first result (provider-fresh expected), waits a configurable delay below the fresh TTL, calls `getQuoteSnapshot()` again in the same process (memory cache may serve it), resets the in-memory cache explicitly (using `clearQuoteCacheForTests()`), calls `getQuoteSnapshot()` a third time to force Supabase readback, and records only sanitized step-level status evidence.

| | |
|---|---|
| **Benefit** | Explicit in-process memory cache flush using `clearQuoteCacheForTests()` makes Supabase readback provable in a single process without timing pressure |
| **Risk** | Requires new harness code and owner-approval guard vars; adds a dependency on `clearQuoteCacheForTests()` which is intended for testing |
| **Required approval** | Explicit owner approval for harness implementation |
| **Source code change** | No production code change; new harness script only |
| **Exposes price values or secrets** | No — if forbidden output pattern and logSafe() are used |

**Why Option B is the recommended approach for timing reliability**: The harness can call `clearQuoteCacheForTests()` between the first and third `getQuoteSnapshot()` calls in-process, eliminating the 15-second timing window constraint entirely. The Supabase readback is then provable in a single process run without a server restart race condition.

### Option C — Minimal temporary sanitized instrumentation in the route or `quotes.ts`

**Procedure**: Add a temporary, non-secret, non-price `x-cache-backend` or similar response header to the route that indicates which backend served the entry (`memory` vs `supabase`).

| | |
|---|---|
| **Benefit** | Makes the source of the cache hit explicit in the HTTP response without any harness |
| **Risk** | Modifies production source code; instrumentation must be removed after validation; adds risk of accidental secret or data exposure in headers |
| **Required approval** | Explicit owner approval; source code change |
| **Source code change** | Yes — `quote.ts` or `quotes.ts` modified |
| **Exposes price values or secrets** | No — if limited to a backend-name string only |

Option C is the least preferred path. It requires a source code change, carries removal debt, and the harness approach (Option B) achieves the same result without touching production code.

---

## 11. Recommended Path

**Recommended approach: Option B — fail-closed harness.**

Option A (manual cold-start) is viable if the owner can reliably execute the second request within the 15-second fresh TTL after a full process restart. However, the narrow timing window makes this unreliable for a manual procedure, especially given that `npx astro dev` startup time may consume several seconds of the TTL.

Option B (harness using `clearQuoteCacheForTests()`) eliminates the timing constraint entirely. It follows the established Phase 3Y harness pattern and produces reproducible, consistent, sanitized evidence.

The recommended Phase 3AB execution sequence is:

1. **Owner reviews this plan** — confirms the objective, safety gates, and Option B approach.
2. **Owner approves Phase 3AB Option B harness implementation** — Claude Code implements `scripts/owner_smoke_supabase_cache_live_kis_quote.mjs` following the Phase 3Y fail-closed pattern.
3. **Harness dry-run/mock validation** — Claude Code validates the harness in dry-run mode (no live calls).
4. **Owner live run** — Owner runs the harness with live guards, KIS env vars, and Supabase env vars set privately.
5. **Owner provides sanitized step-level output** — Claude Code records the result as Phase 3AB result.

If the owner prefers Option A first, the cold-start manual procedure in Section 7 can be attempted before committing to harness implementation.

**The harness must**:
- Default to dry-run/mock mode
- Require explicit approval guard env vars for live mode
- Reject production runtimes (`NODE_ENV=production` or `VERCEL_ENV=production`)
- Reject `KIS_ACCOUNT_NO` presence
- Call `clearQuoteCacheForTests()` between the first and third `getQuoteSnapshot()` calls to force Supabase-only readback
- Emit only sanitized step-level `phase3ab step=... status=... sanitized=true` output
- Never print price values, raw KIS fields, tokens, keys, account data, raw errors, or stack traces
- Use a forbidden output pattern consistent with Phase 3Y

---

## 12. Owner Evidence Template

After running the Phase 3AB validation, the owner may paste back the following filled-in template. Do not include actual stock symbols, price values, raw KIS fields, tokens, keys, Supabase row contents, service-role keys, anon keys, project references, raw error messages, or stack traces.

```text
Phase 3AB Supabase Persistent Cache Live KIS Quote Validation Evidence

Date/time: <YYYY-MM-DD HH:MM local time>
Local only (not sent to Vercel): yes / no
NODE_ENV production at test time: no / yes
VERCEL_ENV production at test time: no / yes / unset
KIS_ACCOUNT_NO absent: yes / no
QUOTE_CACHE_BACKEND=supabase confirmed: yes / no
Supabase env vars present by boolean only: yes / no
KIS env vars present by boolean only: yes / no
Request path used: /api/market/quote?market=KR&symbol=REDACTED

First request (cold Supabase cache):
  HTTP 200: yes / no
  ok: true: yes / no
  Cache-Control: no-store: yes / no
  data object present: yes / no
  fallback object present: yes / no
  Required normalized public fields present: yes / no
  fallback.reason: <value — expected: provider-fresh>
  Raw KIS fields absent: yes / no
  Secrets/tokens/raw errors absent: yes / no

Dev server stopped between runs (process restart): yes / no

Second request (cold-start process — no in-memory cache):
  HTTP 200: yes / no
  ok: true: yes / no
  data object present: yes / no
  fallback object present: yes / no
  Required normalized public fields present: yes / no
  fallback.reason: <value — expected: cache-fresh if within fresh TTL; provider-fresh if TTL expired>
  Cache behavior conclusively proves Supabase readback: yes / no / inconclusive
  If inconclusive, reason: <TTL expired / timing issue / other>
  Raw KIS fields absent: yes / no
  Secrets/tokens/raw errors absent: yes / no

Dev server stopped after test: yes / no
Private env vars cleared: yes / no
Overall result: passed / failed / inconclusive

Optional notes (no secrets, no price values, no symbols):
```

---

## 13. Approval Boundary

This document defines a plan only. It does not authorize any execution.

- **Future live execution requires explicit owner approval** — the owner must confirm they wish to proceed before any live KIS or Supabase call is made.
- **Future harness implementation (Option B) requires explicit owner approval** — Claude Code must not implement `scripts/owner_smoke_supabase_cache_live_kis_quote.mjs` without an explicit instruction from the owner.
- **Any Vercel environment mutation or deployment remains separately blocked** — Phase 3X gate decision (Option A/B/C) must be made independently.
- **Production KIS enablement remains blocked** — `isProductionRuntime()` guard in `kisClient.ts` must not be changed without a separate explicit owner approval and code change decision.
- **No DB schema change or migration is required** — the `market_quote_cache` table from Phase 3Q is already in production.

---

## 14. Recommended Next Step

Owner reviews this planning document. Specifically:

1. **Confirm the objective** — Supabase persistent cache write/readback with live KIS quote data through the full quote pipeline.
2. **Confirm the recommended approach** — Option B harness, or Option A manual cold-start if preferred.
3. **If Option B**: Provide explicit approval for Claude Code to implement `scripts/owner_smoke_supabase_cache_live_kis_quote.mjs` following the Phase 3Y fail-closed pattern.
4. **If Option A**: Follow the procedure in Section 7. Timing of the second request is critical (within 15 seconds of the Supabase write from the first run).

In either case: gate decision (Phase 3X Option A/B/C), Vercel env mutation, deployment, and UI wiring remain separately blocked.
