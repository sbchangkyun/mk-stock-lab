# Phase 3AA Local /api/market/quote HTTP Endpoint Verification Plan v0.1

## 1. Title And Phase Metadata

- **Phase**: 3AA
- **Type**: Planning-only — no execution in this document
- **Target**: Local `/api/market/quote` HTTP endpoint verification with live KIS backing
- **Current status**: Planned, not executed
- **Previous validated phase**: Phase 3Z — owner manual local live KIS quote smoke (all 14 harness steps passed)
- **Created**: 2026-06-21

---

## 2. Objective

Phase 3AA verifies the complete server-side quote route in a local non-production Astro dev-server environment with live KIS backing:

```
HTTP GET request
  → Astro /api/market/quote route (src/pages/api/market/quote.ts)
  → parseQuoteRequest() — validates market and symbol query parameters
  → getQuoteSnapshot() (src/lib/server/marketData/quotes.ts)
  → assertServerRuntime() — confirms server-only context
  → cache check (memory or configured backend)
  → getKisQuoteSnapshot() (src/lib/server/providers/kisClient.ts)
      → isProductionRuntime() guard — must return false in local shell
      → getKisQuoteConfigReadiness() — confirms all required env names present and feature flag enabled
      → KIS OAuth token fetch (/oauth2/tokenP)
      → KIS domestic quote price inquiry (/uapi/domestic-stock/v1/quotations/inquire-price)
  → quote normalization → QuoteSnapshot (public fields only, no raw KIS fields)
  → cache write
  → JSON response: { ok: true, data: QuoteSnapshot, fallback: { state, reason } }
  → Cache-Control: no-store
```

Phase 3Z validated only steps up to and including KIS quote normalization within the harness process. Phase 3AA validates the full route by exercising the actual HTTP entry point.

---

## 3. Explicit Non-Goals

Phase 3AA does **not** include and must not be extended to include any of the following:

- UI live quote wiring — Market, Portfolio, Chart AI, Home, Lab, or any browser UI connected to live quote data
- Vercel Preview environment test
- Vercel Production environment test
- Vercel deployment of any kind
- Vercel environment variable mutation
- Production KIS enablement — `isProductionRuntime()` guard in `kisClient.ts` must not be changed
- Any change to `kisClient.ts` source code
- Supabase persistent cache live quote test — the Supabase persistent cache path with live KIS data remains unvalidated after Phase 3AA unless separately approved
- KIS account, order, trading, balance, holdings, or WebSocket APIs
- `KIS_ACCOUNT_NO` — must remain absent throughout Phase 3AA
- Claude Code running a live KIS call
- Claude Code running a live Supabase query or write
- Claude Code running an Astro dev server or making an HTTP request to the local server

---

## 4. Safety Gates

The following safety rules apply to any Phase 3AA execution. These must all be confirmed before any HTTP request is sent to the local dev server.

| Gate | Requirement |
|---|---|
| Owner-run only | Any live HTTP request to the local Astro dev server must be initiated by the owner in a private local shell |
| Claude Code KIS calls | Must not run live KIS calls |
| Claude Code Supabase calls | Must not run live Supabase queries or writes |
| Runtime | Local non-production only |
| `NODE_ENV` | Must not be `production` |
| `VERCEL_ENV` | Must not be `production` |
| `KIS_ACCOUNT_NO` | Must be absent from the shell environment |
| Secret handling | KIS app key, app secret, base URL, and any other secrets must be entered only by the owner in the local shell — must never appear in logs, documentation, or chat output |
| Response evidence | Owner records only sanitized checklist evidence — no actual price values, no raw KIS field values, no tokens, no keys, no account data, no raw error messages, no stack traces |
| Dev server isolation | The local Astro dev server must not be accessible outside the owner's local machine |

---

## 5. Required Environment Names

List of required environment names. Values must never be recorded. The owner sets these privately in the local shell before starting the dev server.

| Name | Required | Secret | Notes |
|---|---|---|---|
| `KIS_APP_KEY` | Yes | Yes — never record value | KIS API app key |
| `KIS_APP_SECRET` | Yes | Yes — never record value | KIS API app secret |
| `KIS_BASE_URL` | Yes | Non-secret | KIS API base URL |
| `KIS_ENABLE_LIVE_QUOTES` | Yes | Non-secret | Must be set to the string `true` |
| `KIS_ACCOUNT_NO` | Must be absent | Yes — never set | Must not be present in Phase 3AA |
| `QUOTE_CACHE_BACKEND` | Optional | Non-secret | Should remain unset or `memory` (default) for Phase 3AA unless Supabase cache path is separately approved |
| `NODE_ENV` | Verify only | Non-secret | Must not be `production` |
| `VERCEL_ENV` | Verify only | Non-secret | Must not be `production`; likely absent in local shell |

---

## 6. Owner-Run Local Procedure

This procedure is defined for future owner execution. Claude Code must not run any step of this procedure.

### Step 1 — Open a private local shell

Open a new PowerShell window that is not shared with any logging or recording system.

### Step 2 — Confirm runtime is non-production

```powershell
echo $env:NODE_ENV
echo $env:VERCEL_ENV
```

Both must be empty or non-`production`. If either is `production`, stop — do not proceed.

### Step 3 — Confirm KIS_ACCOUNT_NO is absent

```powershell
echo $env:KIS_ACCOUNT_NO
```

Output must be empty. If `KIS_ACCOUNT_NO` is set, unset it before proceeding:

```powershell
Remove-Item Env:KIS_ACCOUNT_NO
```

### Step 4 — Set required KIS environment variables privately

Set the following privately (values are not shown here — owner knows them):

```powershell
$env:KIS_APP_KEY = "<owner sets privately>"
$env:KIS_APP_SECRET = "<owner sets privately>"
$env:KIS_BASE_URL = "<owner sets privately>"
$env:KIS_ENABLE_LIVE_QUOTES = "true"
```

Do not paste these values into any chat, log file, or documentation.

### Step 5 — Start the local Astro dev server

From the project root:

```powershell
npx astro dev
```

Wait for the server to confirm it is listening, typically on `http://localhost:4321`. Do not expose this server to any external network.

### Step 6 — Send the HTTP request

In a separate PowerShell window (or using any local HTTP client), send:

```
GET http://localhost:4321/api/market/quote?market=KR&symbol=XXXXXX
```

Replace `XXXXXX` with a valid 6-digit KR domestic stock code of the owner's choice. Do not record the symbol used.

Example using PowerShell `Invoke-RestMethod`:

```powershell
$response = Invoke-RestMethod -Method GET -Uri "http://localhost:4321/api/market/quote?market=KR&symbol=XXXXXX" -Headers @{ Accept = "application/json" }
$response | ConvertTo-Json -Depth 5
```

Do not record the actual price value from the response. Record only structural evidence (field presence/absence, status code, headers).

### Step 7 — Record sanitized evidence

Fill in the owner evidence template defined in Section 10. Do not include any price values, raw KIS fields, tokens, keys, account data, raw errors, or stack traces.

### Step 8 — Stop the dev server

Press `Ctrl+C` in the Astro dev server terminal to stop it.

### Step 9 — Remove private env vars from the shell session

```powershell
Remove-Item Env:KIS_APP_KEY
Remove-Item Env:KIS_APP_SECRET
Remove-Item Env:KIS_BASE_URL
Remove-Item Env:KIS_ENABLE_LIVE_QUOTES
```

---

## 7. Expected Positive Response Shape

When the owner sends a valid `GET /api/market/quote?market=KR&symbol=XXXXXX` request to the local dev server with all required KIS env vars set, the expected successful response is:

**HTTP status**: `200`

**Headers**:
- `Content-Type: application/json; charset=utf-8`
- `Cache-Control: no-store`

**JSON body**:
```json
{
  "ok": true,
  "data": {
    "market": "KR",
    "symbol": "<6-digit KR code — owner knows>",
    "price": <number — do not record actual value>,
    "currency": "KRW",
    "change": <number or null>,
    "changePct": <number or null>,
    "volume": <number or null>,
    "marketState": <string>,
    "asOf": "<ISO 8601 datetime string>",
    "staleState": "fresh",
    "providerMeta": { "provider": "kis" }
  },
  "fallback": {
    "state": "fresh",
    "reason": "provider-fresh",
    "cache": { ... }
  }
}
```

For a successful live call on first hit (no prior cache), `fallback.reason` should be `"provider-fresh"` and `data.staleState` should be `"fresh"`.

If a fresh cache entry exists from a prior request within the 15-second TTL, `fallback.reason` may be `"cache-fresh"`.

The `data` object must not contain any raw KIS field names (`stck_prpr`, `prdy_vrss`, `prdy_ctrt`, `acml_vol`, `rt_cd`, `output`). It must not contain any token, key, account number, or authorization header value.

The owner must confirm field presence only. Actual price values must not be pasted into any documentation or chat.

---

## 8. Required Absence Checks

The response body and headers must not contain any of the following strings or fields. The owner confirms their absence as part of the sanitized evidence record.

**Raw KIS field names** (must not appear as JSON keys or values):
- `stck_prpr`
- `prdy_vrss`
- `prdy_ctrt`
- `acml_vol`
- `rt_cd`
- `output` (as a raw KIS envelope key)

**Secret or credential strings** (must not appear anywhere in the response):
- `access_token`
- `token` (as a credential value)
- `bearer`
- `appkey`
- `appsecret`
- `KIS_APP_KEY`
- `KIS_APP_SECRET`
- `KIS_ACCOUNT_NO`

**Error/debug strings** (must not appear in a successful response):
- `stack`
- `trace`
- Raw provider error details or internal error messages

---

## 9. Suggested Safe Negative Checks

The following route-contract checks can be verified without a live KIS call, because validation failures occur before the provider is invoked. These are part of this plan only — they are not executed by Claude Code in this phase.

| Check | Request | Expected |
|---|---|---|
| Missing market | `GET /api/market/quote?symbol=XXXXXX` | 400, `{ ok: false, code: "VALIDATION_FAILED" }` |
| Empty market | `GET /api/market/quote?market=&symbol=XXXXXX` | 400, `{ ok: false, code: "VALIDATION_FAILED" }` |
| Unsupported market | `GET /api/market/quote?market=JP&symbol=XXXXXX` | error (SYMBOL_UNSUPPORTED or VALIDATION_FAILED) |
| Missing symbol | `GET /api/market/quote?market=KR` | 400, `{ ok: false, code: "VALIDATION_FAILED" }` |
| Unsupported method (POST) | `POST /api/market/quote` | 405, `{ ok: false, code: "METHOD_NOT_ALLOWED" }` |

For all responses, `Cache-Control: no-store` should be present and no raw error or stack trace should appear in the response body.

The owner may optionally run these checks without setting KIS env vars (validation returns before KIS is called). Claude Code must not run these checks in this planning phase.

---

## 10. Owner Evidence Template

After running the Phase 3AA local endpoint procedure, the owner may paste back the following filled-in template. Do not include actual price values, raw KIS field values, tokens, keys, account data, raw errors, or stack traces.

```text
Phase 3AA Local /api/market/quote Endpoint Verification Evidence

Date/time: <YYYY-MM-DD HH:MM local time>
Local only (not sent to Vercel): yes / no
NODE_ENV production at test time: no / yes
VERCEL_ENV production at test time: no / yes / unset
KIS_ACCOUNT_NO absent: yes / no
Request path used: /api/market/quote?market=KR&symbol=REDACTED
HTTP status: <code>
Cache-Control: no-store present: yes / no
ok: true in response body: yes / no
data object present: yes / no
fallback object present: yes / no
Required normalized public fields present (market, symbol, price, currency, asOf): yes / no
price is a finite number (do not record value): yes / no
staleState is fresh: yes / no
fallback.reason is provider-fresh or cache-fresh: yes / no
Raw KIS fields absent (stck_prpr, prdy_vrss, prdy_ctrt, acml_vol, rt_cd, output): yes / no
Secrets/tokens absent in response: yes / no
Raw errors/stack traces absent in response: yes / no
Negative check — missing market returns 400: yes / no / not tested
Negative check — POST returns 405: yes / no / not tested
Dev server stopped after test: yes / no
KIS env vars removed from shell after test: yes / no
Overall result: passed / failed

Optional notes (no secrets, no price values):
```

Korean is acceptable in the notes field if the owner prefers, consistent with the project's Korean owner-review checklist convention.

---

## 11. Approval Boundary For Option B

Implementing `scripts/owner_smoke_api_quote_live.mjs` — a fail-closed automated HTTP smoke harness for Phase 3AA — is **not part of this phase** and requires explicit owner approval after this planning document is reviewed.

If the owner chooses Option B (harness), the harness should follow the Phase 3Y pattern:

- Default dry-run/mock mode
- Live mode requires all approval guard env vars with exact required values
- `PRODUCTION_RUNTIME_NOT_ALLOWED` fail-closed check
- `KIS_ACCOUNT_NO` absent check
- Sanitized step-level output only — no price values, no raw KIS fields, no tokens
- Forbidden output pattern blocking credentials and raw provider data
- Last-resort `.catch()` only for `UNEXPECTED_SAFE_FAILURE`

The owner may also choose to run the manual procedure from Section 6 directly (Option A manual execution) without a harness.

---

## 12. Recommended Next Step

Owner reviews this planning document. Then chooses one of:

**Option A — Manual execution**: Owner follows the procedure in Section 6 directly, fills in the evidence template from Section 10, and provides the sanitized evidence to Claude Code for recording as Phase 3AA result.

**Option B — Harness implementation**: Owner approves Phase 3AA Option B. Claude Code implements `scripts/owner_smoke_api_quote_live.mjs` following the fail-closed pattern from Phase 3Y. Owner dry-run validates, then runs live, then provides sanitized output.

In either case:

- Do not wire any UI to live quote data.
- Do not mutate Vercel env.
- Do not deploy.
- Keep the production KIS guard in `kisClient.ts` unchanged.
- Gate decision for Vercel Preview/Production (Option A/B/C from Phase 3X) must be made separately, after Phase 3AA local verification is complete.
