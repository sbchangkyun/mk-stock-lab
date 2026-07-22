# Phase 3AB Supabase Persistent Cache Live KIS Quote Harness Result v0.1

## 1. Title And Metadata

- **Phase**: 3AB
- **Type**: Fail-closed owner-run harness implementation result (dry-run validation)
- **Status**: Dry-run passed — ready for owner live run
- **Execution mode**: Claude Code ran dry-run only; live run is owner-initiated
- **Claude Code live execution**: Not performed — no live KIS call, no live Supabase query or write
- **Harness script**: `scripts/owner_smoke_supabase_cache_live_kis_quote.mjs`
- **npm alias**: `npm run smoke:supabase-cache-live-kis-quote:dry`
- **Previous planning document**: `docs/planning/phase_3ab_supabase_persistent_cache_live_kis_quote_validation_plan_v0.1.md`
- **Previous validated phase**: Phase 3AA — owner-run local `/api/market/quote` HTTP endpoint verification (all 11 criteria passed)
- **Date**: 2026-06-21

---

## 2. Objective

Phase 3AB Option B implements and validates a fail-closed owner-run harness to prove that a live KIS quote response can be written to and read back from the Supabase persistent quote cache through the full quote pipeline.

The harness uses Strategy 1 (in-process memory flush):

```
Call getQuoteSnapshot(identity)
  → First call: KIS provider (live) or mock provider (dry-run)
  → Writes snapshot to BOTH in-memory Map AND Supabase (real or mock)
  → Returns fallback.reason = 'provider-fresh'
clearQuoteCacheForTests()
  → Clears in-memory Map ONLY; Supabase untouched
Call getQuoteSnapshot(identity) again
  → Memory is empty; QUOTE_CACHE_BACKEND=supabase → reads Supabase first
  → If Supabase row is fresh → returns fallback.reason = 'cache-fresh'
  → supabaseReadbackConclusive=true
```

This structure conclusively proves Supabase readback because the second `cache-fresh` response cannot come from the in-memory Map (it was cleared) — it must come from Supabase.

---

## 3. Harness Design

### Guard env vars required for live mode

| Env var name | Required exact value |
|---|---|
| `MK_STOCK_LAB_PHASE_3AB_LIVE_APPROVAL` | `OWNER_APPROVES_LIVE_KIS_AND_SUPABASE_CACHE_SMOKE` |
| `MK_STOCK_LAB_PHASE_3AB_LIVE_MODE` | `true` |

Without both exact values, the harness runs in dry-run mode (default).

### Presence-only checks for live mode

| Env var group | Names checked (values never read or printed) |
|---|---|
| KIS | `KIS_APP_KEY`, `KIS_APP_SECRET`, `KIS_BASE_URL`, `KIS_ENABLE_LIVE_QUOTES` |
| Supabase | `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |

### Additional live mode requirements

| Requirement | Value |
|---|---|
| `QUOTE_CACHE_BACKEND` | Must be `supabase` |
| `KIS_ACCOUNT_NO` | Must be absent |
| `NODE_ENV` | Must not be `production` |
| `VERCEL_ENV` | Must not be `production` |
| Symbol env var | `MK_STOCK_LAB_PHASE_3AB_SYMBOL` — 6-digit KR domestic code |

### TypeScript compilation

The harness compiles the following source files into an isolated temp directory under `.astro/`:

- `src/lib/server/providers/serverOnly.ts`
- `src/lib/server/providers/providerErrors.ts`
- `src/lib/server/providers/types.ts`
- `src/lib/server/providers/kisClient.ts`
- `src/lib/server/marketData/quoteCache.ts` — provides `clearQuoteCacheForTests()`
- `src/lib/server/marketData/supabaseQuoteCache.ts`
- `src/lib/server/marketData/quotes.ts` — provides `getQuoteSnapshot()`
- `src/lib/server/supabaseAdmin.ts` — live: compiled real file; dry-run: in-process mock stub

The temp directory is cleaned up in a `finally` block.

### Dry-run mock

In dry-run mode:
- `supabaseAdmin.ts` is replaced with an in-process stub whose `getSupabaseAdminClient()` returns a mock client backed by a `Map<string, row>`. This makes the compiled `supabaseQuoteCache.ts` use the mock rather than a real Supabase connection.
- `getQuoteSnapshot()` is called with `options.provider` injected as a mock that returns a synthetic `QuoteSnapshot` (no real KIS call).
- `QUOTE_CACHE_BACKEND` is set internally to `supabase` so the Supabase code path is exercised through the mock.

### Forbidden output pattern

The harness blocks any output containing:
`KIS_APP_SECRET`, `KIS_APP_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `access_token`, `appsecret`, `appkey`, `authorization`, `Bearer`, `connectionString`, `project_ref`, `jwt`, `password`, `stack`, `trace`, `stck_prpr`, `prdy_vrss`, `prdy_ctrt`, `acml_vol`, `rt_cd`, `supabase.co`

---

## 4. Dry-Run Validation Evidence

Claude Code ran `node scripts/owner_smoke_supabase_cache_live_kis_quote.mjs` with no live guard env vars set (dry-run mode). All 26 output lines passed the forbidden output pattern scanner. No live KIS call was made. No live Supabase connection was made. The mock Supabase client's `rows` Map was populated by the first call and read back successfully by the second call.

### Full dry-run output (sanitized — no secrets, no prices, no raw KIS fields)

```
phase3ab step=guard-check status=started sanitized=true
phase3ab step=guard-check status=passed mode=dry-run-no-live-guards sanitized=true
phase3ab step=runtime-check status=started sanitized=true
phase3ab step=runtime-check status=passed nodeEnvIsProduction=false vercelEnvIsProduction=false sanitized=true
phase3ab step=kis-accno-check status=started sanitized=true
phase3ab step=kis-accno-check status=passed kisAccnoAbsent=true sanitized=true
phase3ab step=cache-backend-check status=started sanitized=true
phase3ab step=cache-backend-check status=passed configuredBackend=supabase sanitized=true
phase3ab step=smoke-identity-validation status=started sanitized=true
phase3ab step=smoke-identity-validation status=passed note=dry-run-using-synthetic-identity sanitized=true
phase3ab step=runtime-setup status=started sanitized=true
phase3ab step=runtime-setup status=passed sanitized=true
phase3ab step=module-import status=started sanitized=true
phase3ab step=module-import status=passed sanitized=true
phase3ab step=config-preflight status=started sanitized=true
phase3ab step=config-preflight status=passed note=dry-run-config-preflight-skipped sanitized=true
phase3ab step=first-call status=started sanitized=true
phase3ab step=first-call status=passed reason=provider-fresh sanitized=true
phase3ab step=memory-flush status=started sanitized=true
phase3ab step=memory-flush status=passed note=in-memory-map-cleared-supabase-untouched sanitized=true
phase3ab step=second-call status=started sanitized=true
phase3ab step=second-call status=passed reason=cache-fresh sanitized=true
phase3ab step=dry-run-mock-validation status=passed mockUpsertCalled=true mockSelectCalled=true sanitized=true
phase3ab step=final-result status=passed mode=dry-run-mock liveKis=false liveSupabase=false firstCallReason=provider-fresh secondCallReason=cache-fresh supabaseReadbackConclusive=true sanitized=true
phase3ab step=dry-run-guard-sim status=passed note=live-guards-absent-dry-run-mode-confirmed sanitized=true
phase3ab step=dry-run-config-sim status=passed kisConfigAbsentInDryRun=true supabaseConfigAbsentInDryRun=true sanitized=true
```

### Dry-run interpretation

| Check | Result |
|---|---|
| All 26 output lines passed forbidden pattern scanner | Confirmed |
| `mode=dry-run-mock` | Confirmed — no live guards present |
| `liveKis=false` | Confirmed — no real KIS call |
| `liveSupabase=false` | Confirmed — no real Supabase connection |
| `firstCallReason=provider-fresh` | Confirmed — mock provider returned synthetic snapshot, cache write succeeded |
| `secondCallReason=cache-fresh` | Confirmed — memory cache cleared, mock Supabase returned fresh entry |
| `supabaseReadbackConclusive=true` | Confirmed — conclusive Strategy 1 proof path exercised |
| `mockUpsertCalled=true` | Confirmed — mock Supabase `upsert` was called during cache write |
| `mockSelectCalled=true` | Confirmed — mock Supabase `select` was called during cache read |
| `kisConfigAbsentInDryRun=true` | Confirmed — dry-run does not require live KIS env vars |
| `supabaseConfigAbsentInDryRun=true` | Confirmed — dry-run does not require live Supabase env vars |

---

## 5. Step Inventory

| Step | Purpose |
|---|---|
| `guard-check` | Verify live guard env vars or confirm dry-run mode |
| `runtime-check` | Block `NODE_ENV=production` and `VERCEL_ENV=production` |
| `kis-accno-check` | Require `KIS_ACCOUNT_NO` to be absent |
| `cache-backend-check` | Require `QUOTE_CACHE_BACKEND=supabase` (live); set internally (dry-run) |
| `smoke-identity-validation` | Validate `MK_STOCK_LAB_PHASE_3AB_SYMBOL` as 6-digit KR code (live) |
| `runtime-setup` | Compile TypeScript to isolated temp directory |
| `module-import` | Import compiled `quotes.js`, `quoteCache.js`, `supabaseAdmin.js` |
| `config-preflight` | Presence-only check for KIS and Supabase env names (live only) |
| `first-call` | First `getQuoteSnapshot()` call — expects `provider-fresh` or `cache-fresh` |
| `memory-flush` | `clearQuoteCacheForTests()` — clears in-memory Map, leaves Supabase untouched |
| `second-call` | Second `getQuoteSnapshot()` — expects `cache-fresh` from Supabase |
| `dry-run-mock-validation` | Confirm mock Supabase upsert and select were both called (dry-run only) |
| `final-result` | Overall pass/fail with `supabaseReadbackConclusive` flag |
| `dry-run-guard-sim` | Confirm live guards are absent in dry-run (dry-run only) |
| `dry-run-config-sim` | Confirm KIS and Supabase config absent in dry-run (dry-run only) |

---

## 6. Confirmed Non-Actions

- Claude Code did not run a live KIS call.
- Claude Code did not run a live Supabase query or write.
- Claude Code did not execute SQL.
- Claude Code did not start an Astro dev server.
- Claude Code did not use Vercel CLI.
- No Vercel environment mutation occurred.
- No deployment occurred.
- No `.env*` contents were read.
- No secrets, tokens, keys, price values, raw KIS fields, raw errors, or stack traces were printed.
- No source code in `src/` was changed.
- No production KIS guard was changed.
- `KIS_ACCOUNT_NO` remained absent throughout.

---

## 7. Owner Live Run Procedure

The live run requires explicit owner action. Claude Code must not perform any step.

### Required env vars (owner sets privately)

```powershell
$env:MK_STOCK_LAB_PHASE_3AB_LIVE_APPROVAL = "OWNER_APPROVES_LIVE_KIS_AND_SUPABASE_CACHE_SMOKE"
$env:MK_STOCK_LAB_PHASE_3AB_LIVE_MODE     = "true"
$env:QUOTE_CACHE_BACKEND                   = "supabase"
$env:MK_STOCK_LAB_PHASE_3AB_SYMBOL        = "<6-digit KR domestic code>"
$env:KIS_APP_KEY                           = "<owner sets privately>"
$env:KIS_APP_SECRET                        = "<owner sets privately>"
$env:KIS_BASE_URL                          = "<owner sets privately>"
$env:KIS_ENABLE_LIVE_QUOTES               = "true"
$env:PUBLIC_SUPABASE_URL                   = "<owner sets privately>"
$env:PUBLIC_SUPABASE_ANON_KEY              = "<owner sets privately>"
$env:SUPABASE_SERVICE_ROLE_KEY             = "<owner sets privately>"
```

Do not set `KIS_ACCOUNT_NO`. Do not paste secret values into any chat or log.

### Run the harness

```powershell
npm run smoke:supabase-cache-live-kis-quote:dry
```

Note: the `:dry` suffix in the npm alias does not restrict to dry-run — it reflects that this script defaults to dry-run mode. With the live guard env vars set above, the script runs in live mode.

### Remove env vars after the run

```powershell
Remove-Item Env:MK_STOCK_LAB_PHASE_3AB_LIVE_APPROVAL
Remove-Item Env:MK_STOCK_LAB_PHASE_3AB_LIVE_MODE
Remove-Item Env:QUOTE_CACHE_BACKEND
Remove-Item Env:MK_STOCK_LAB_PHASE_3AB_SYMBOL
Remove-Item Env:KIS_APP_KEY
Remove-Item Env:KIS_APP_SECRET
Remove-Item Env:KIS_BASE_URL
Remove-Item Env:KIS_ENABLE_LIVE_QUOTES
Remove-Item Env:PUBLIC_SUPABASE_URL
Remove-Item Env:PUBLIC_SUPABASE_ANON_KEY
Remove-Item Env:SUPABASE_SERVICE_ROLE_KEY
```

### Expected live output shape

When the live run succeeds, the output should contain (all values sanitized):

```
phase3ab step=final-result status=passed mode=live-approved liveKis=true liveSupabase=true firstCallReason=provider-fresh secondCallReason=cache-fresh supabaseReadbackConclusive=true sanitized=true
```

If `firstCallReason=cache-fresh` (a prior Supabase entry was fresh), that is also acceptable — `supabaseReadbackConclusive=true` still holds as long as `secondCallReason=cache-fresh`.

---

## 8. Owner Live Run Evidence Template

After running the live harness, the owner may provide sanitized evidence using the following template. Do not include actual stock symbols, price values, secrets, tokens, raw errors, or stack traces.

```text
Phase 3AB Supabase Cache Live KIS Quote Harness — Live Run Evidence

Date/time: <YYYY-MM-DD HH:MM local time>
Local only (not sent to Vercel): yes / no
NODE_ENV production at run time: no / yes
VERCEL_ENV production at run time: no / yes / unset
KIS_ACCOUNT_NO absent: yes / no
Symbol used: REDACTED (6-digit KR domestic code, owner knows)
All 15 steps passed: yes / no
firstCallReason: provider-fresh / cache-fresh / other
secondCallReason: cache-fresh / other
supabaseReadbackConclusive: true / false
mockUpsertCalled: n/a (live mode)
mockSelectCalled: n/a (live mode)
ForbiddenTermsFoundCount: <integer>
Overall result: passed / failed

Optional notes (no secrets, no symbol, no price values):
```

---

## 9. Remaining Gaps

This phase validates the harness structure and dry-run path. After a successful live owner run, the following remain unvalidated:

- **Vercel Preview environment behavior** — unvalidated.
- **Vercel Production environment behavior** — permanently blocked by `isProductionRuntime()` until a separate code change and owner approval.
- **Production KIS enablement** — no change made; gate decision (Option A/B/C from Phase 3X) remains pending.
- **UI wiring** — Market, Portfolio, Chart AI, Home, and Lab remain disconnected from live quote data.
- **KIS rate-limit and error fallback paths** — 429, non-`0` `rt_cd`, missing price field, or network failure responses from KIS have not been exercised.
- **Cold-start token cache behavior in Vercel** — the in-memory `accessTokenCache` in `kisClient.ts` resets on each function cold start; behavior in deployed runtime not tested.
- **KIS_ACCOUNT_NO** — must remain absent in all phases until a separate explicit owner approval.
