# Phase 3DL — Owner KIS + FX Preview Smoke Runbook

**For:** Project owner  
**Status:** Execution-ready (safe stages only)  
**Date:** 2026-06-27  
**Do not share this document with anyone who should not have KIS credential access.**

---

## What This Smoke Test Is For

This runbook describes a staged sequence for the owner to validate KIS quote connectivity locally before any live data is enabled for users.

The goals are:
1. Confirm KIS credentials and environment are correctly configured.
2. Confirm a single KR stock quote can be retrieved without errors.
3. Confirm the cache layer writes and reads correctly.
4. Confirm error handling is explicit — no silent fallback to fixture data on failure.
5. Confirm no account-level APIs were called (quote-only scope enforced).

---

## What This Smoke Test Is NOT For

- This is NOT a production data flow test.
- This does NOT enable live data for any user.
- This does NOT test US stocks or ETFs (US endpoint not yet implemented).
- This does NOT test FX rate retrieval (FX provider not yet selected).
- This does NOT test dividend data.
- This does NOT call any account-level KIS API.
- This does NOT write real trade orders or portfolio actions.

---

## Required Environment Variables (Names Only)

**Do not share values.** Set these in your local `.env.local` or equivalent non-committed env file.

### KIS Credentials (required for live quote)

| Variable | Purpose |
|----------|---------|
| `KIS_APP_KEY` | KIS developer app key |
| `KIS_APP_SECRET` | KIS developer app secret |
| `KIS_BASE_URL` | KIS API base URL (paper trading or production endpoint) |
| `KIS_ENABLE_LIVE_QUOTES` | Set to the string `true` to enable live quotes |

### Scope enforcement (must be absent)

| Variable | Required state |
|----------|--------------|
| `KIS_ACCOUNT_NO` | Must NOT be set — if present, all live quote calls are blocked automatically |

### Guard variables for `npm run smoke:kis-quote-live:dry`

All five must be set to their exact expected values:

| Variable | Required value |
|----------|--------------|
| `PHASE_3Y_LIVE_KIS_SMOKE` | `OWNER_APPROVED` |
| `PHASE_3Y_RUNTIME_CONFIRMED` | `local-non-production-confirmed` |
| `PHASE_3Y_READ_ONLY_SCOPE_CONFIRMED` | `OWNER_CONFIRMS_READ_ONLY_QUOTE_ONLY` |
| `PHASE_3Y_PROVIDER_QUOTA_RISK_ACCEPTED` | `OWNER_ACCEPTS_KIS_QUOTA_RISK` |
| `PHASE_3Y_NO_ACCOUNT_APIS_CONFIRMED` | `OWNER_CONFIRMS_NO_ACCOUNT_APIS` |

If any guard is missing or incorrect, the smoke script will not enter live mode and will report `GUARD_FAIL`.

---

## Safe Order of Operations

### Step 1 — Static validation (no credentials needed)

```bash
npm run check:kis-fx-preview-smoke-plan
npm run check:kis-valuation-design
npm run check:kis-quote-adapter-mocked
```

These are fully static. No network calls. No credential reads.

**Expected:** All pass.

---

### Step 2 — Mocked cache adapter (no credentials needed)

```bash
npm run smoke:persistent-quote-cache
```

Uses a mock Supabase client. No live calls. No credential reads.

**Expected:** All mocked cache scenarios pass.

---

### Step 3 — Credential presence check (no values are read or printed)

Before attempting any live call, confirm these are present in your environment:

```bash
# Check presence only — this command does not print values
node -e "const required = ['KIS_APP_KEY', 'KIS_APP_SECRET', 'KIS_BASE_URL', 'KIS_ENABLE_LIVE_QUOTES']; const missing = required.filter(k => !process.env[k]); console.log(missing.length === 0 ? 'All required KIS env vars present' : 'Missing: ' + missing.join(', '));"
```

**Expected:** `All required KIS env vars present`

Also confirm `KIS_ACCOUNT_NO` is absent:

```bash
node -e "console.log(process.env.KIS_ACCOUNT_NO ? 'WARNING: KIS_ACCOUNT_NO is set — remove it before smoke test' : 'OK: KIS_ACCOUNT_NO is absent (quote-only scope)');"
```

**Expected:** `OK: KIS_ACCOUNT_NO is absent`

---

### Step 4 — Live KIS quote smoke (credentials required, guard vars required)

```bash
npm run smoke:kis-quote-live:dry
```

This command requires all 5 guard env vars set to exact values AND KIS credentials present.

Run from your local machine only. Do not run in CI. Do not run on Vercel.

**Expected:** A structured sanitized log with `sanitized=true` at each step. No raw KIS field names in output. A price value for the test symbol with `staleState=fresh`.

---

### Step 5 — Cache freshness check (optional, if Supabase cache is enabled)

If you have set `QUOTE_CACHE_BACKEND=supabase` and Supabase credentials:

```bash
npm run smoke:persistent-quote-cache-live:dry
```

**Expected:** Quote cached in Supabase. Re-read within 15s returns `fresh`. After 15s returns `stale-but-usable`. After 120s returns `unavailable/expired`.

---

## What Success Looks Like

- All static checks pass.
- Mocked cache adapter scenarios pass.
- Live smoke produces structured output: `step=quote-fetch status=success symbol=005930 staleState=fresh sanitized=true` (or similar sanitized form).
- No raw KIS field names (`stck_prpr`, `prdy_vrss`, `rt_cd`, `acml_vol`) appear in output.
- No credential-like strings appear in output.
- The sanitized result confirms: price retrieved, currency is KRW, staleState is fresh.

---

## What Failure Looks Like

Common failure patterns and what they mean:

| Failure type | Likely cause |
|-------------|-------------|
| `GUARD_FAIL` | One or more Phase 3Y guard env vars missing or incorrect |
| `CONFIG_MISSING` | `KIS_APP_KEY`, `KIS_APP_SECRET`, or `KIS_BASE_URL` not set |
| `CONFIG_MISSING: disabled` | `KIS_ENABLE_LIVE_QUOTES` not set to `"true"` |
| `CONFIG_MISSING: production_not_allowed` | `KIS_ACCOUNT_NO` is set — remove it |
| `AUTH_REQUIRED` or `PROVIDER_UNAVAILABLE` on token step | KIS credentials may be incorrect or expired |
| `PROVIDER_RATE_LIMITED` | KIS returned 429 — wait and retry after a minute |
| `PROVIDER_UNAVAILABLE` on quote step | KIS endpoint unreachable or symbol rejected |
| `VALIDATION_FAILED` | Symbol failed 6-digit validation |

---

## What Not to Share Back

Do not share API keys, raw tokens, account numbers, or raw provider payloads.

If you report results to Claude Code or a team member, do NOT share:

- `KIS_APP_KEY` value
- `KIS_APP_SECRET` value
- `KIS_BASE_URL` value (it contains environment information)
- Any access token value
- Raw KIS response JSON
- Any field starting with `stck_`, `prdy_`, `rt_cd`, `acml_`, or `appkey`/`appsecret`
- `KIS_ACCOUNT_NO` value (if you ever set it for other purposes)
- Supabase project URL
- Supabase service role key
- Any bearer token or authorization header value

---

## How to Report Results Safely

When reporting back, share only:

| What to share | Example |
|--------------|---------|
| Command name | `npm run smoke:kis-quote-live:dry` |
| Step name | `quote-fetch` |
| PASS/FAIL status | `status=success` or `status=fail` |
| Sanitized error category | `code=PROVIDER_UNAVAILABLE` (not the full message) |
| Symbol tested | `symbol=005930` |
| staleState | `staleState=fresh` |
| Whether output was blocked | `code=SAFE_OUTPUT_BLOCKED` if a forbidden pattern was detected |

**Sample safe report:**
```
smoke:kis-quote-live:dry
step=guard-check         status=pass
step=config-presence     status=pass
step=token-acquire       status=success  sanitized=true
step=quote-fetch         status=success  symbol=005930  staleState=fresh  sanitized=true
step=cache-write         status=success  sanitized=true
```

---

## Notes on Market Hours

KIS domestic quotes are available during KRX trading hours. Outside of market hours, `marketState` will be `closed` and the price will be the previous session's close.

This does not indicate an error. A `staleState=fresh` quote with `marketState=closed` is correct behavior after market close.

---

## When to Stop and Report an Issue

Stop and report (without sharing raw values) if:

- The smoke script crashes with an unhandled exception
- The output contains `SAFE_OUTPUT_BLOCKED` (a forbidden pattern was detected in output — the sanitizer caught it)
- The output contains actual credential-like strings in plaintext (this would be a sanitizer bug)
- Repeated `PROVIDER_RATE_LIMITED` responses (may indicate KIS quota issue)
- Any log line that starts with `Error:` followed by a stack trace (this should not happen; smoke script catches all errors)
