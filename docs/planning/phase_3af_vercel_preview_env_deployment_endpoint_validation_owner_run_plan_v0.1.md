# Phase 3AF Vercel Preview Env Mutation, Deployment, and Endpoint Validation Owner-Run Plan v0.1

## 1. Title And Phase Metadata

- **Phase**: 3AF
- **Type**: Planning-only / owner-run procedure
- **Target**: Vercel Preview env mutation, Preview deployment trigger, and Preview `/api/market/quote` endpoint validation
- **Current status**: Planned — not executed. This document does not authorize Claude Code to perform any step.
- **Previous phase**: Phase 3AE — Preview-safe KIS runtime guard implementation
- **Execution model**: Owner-run only. All Vercel UI interactions, deployment triggers, and HTTP endpoint calls must be performed by the owner.
- **Production KIS status**: Blocked — `VERCEL_ENV=production` is an absolute hard block, unchanged
- **UI wiring status**: Blocked — Market, Portfolio, Chart AI, Home, and Lab pages remain disconnected from live quote data
- **Created**: 2026-06-22

---

## 2. Background

### Validated Local Milestones

| Phase | What Was Validated |
|---|---|
| Phase 3Z | Local live KIS token fetch + domestic quote fetch + normalization to `QuoteSnapshot` |
| Phase 3AA | Local `/api/market/quote` HTTP endpoint response shape with live KIS backing |
| Phase 3AB | Live KIS fetch → Supabase persistent cache write → in-memory flush → Supabase readback (`supabaseReadbackConclusive=true`) |
| Phase 3AC | Planning-only. Vercel Preview validation plan. Identified that `VERCEL_ENV=preview` + `NODE_ENV=production` → old guard would block KIS in Preview |
| Phase 3AD | Decision-only. Selected Option B guard policy: allow Preview with explicit opt-in, keep Production hard-blocked |
| Phase 3AE | Implemented Option B: `classifyRuntime()` replaces `isProductionRuntime()`; `KIS_ENABLE_PREVIEW_LIVE_QUOTES=true` required for Preview; `VERCEL_ENV=production` remains absolute hard block; `KIS_ACCOUNT_NO` presence blocks in all runtimes; 7/7 guard policy tests pass |

### Remaining Gap

All prior validation occurred in local non-production environments. The behavior of `/api/market/quote` in a Vercel Preview deployed function has not been tested. Phase 3AF closes this gap by defining the owner-run procedure to set up Preview-only env vars, deploy to Preview, and call the endpoint.

---

## 3. Objective

Phase 3AF aims to verify the following in an owner-run Vercel Preview environment:

1. The Vercel Preview deployed function can receive and process a `/api/market/quote?market=KR&symbol=<PRIVATE>` request.
2. Preview-scoped env vars (`KIS_ENABLE_PREVIEW_LIVE_QUOTES=true`, `KIS_ENABLE_LIVE_QUOTES=true`, KIS credentials, Supabase vars) are sufficient to satisfy `getKisQuoteConfigReadiness()` in the `vercel-preview` runtime class.
3. Preview live KIS is allowed only by explicit double opt-in (`KIS_ENABLE_PREVIEW_LIVE_QUOTES=true` + `KIS_ENABLE_LIVE_QUOTES=true`); it is blocked without both.
4. Production scope env vars are not changed during this procedure.
5. The HTTP response shape matches the local `Phase 3AA` validated shape: `{ ok: true, data: {...}, fallback: {...} }`.
6. `Cache-Control: no-store` is present in the Preview response header.
7. No raw KIS fields, secrets, tokens, account data, raw errors, stack traces, or price values are recorded in evidence.

---

## 4. Explicit Non-Goals

Phase 3AF does not include and must not be extended to include:

- Production env mutation
- Production deployment validation
- Production KIS enablement
- Any code change (`kisClient.ts`, `providerEnv.ts`, or any source file)
- Any KIS runtime guard change
- UI live quote wiring (Market, Portfolio, Chart AI, Home, Lab)
- Account, order, trading, balance, holdings, or WebSocket APIs
- `KIS_ACCOUNT_NO` usage in any env
- KIS rate-limit stress test or sustained-load test
- Load testing or concurrent request testing
- SQL execution
- Supabase schema changes
- Migration file modifications
- `postbuild` or `repair-vercel-output` changes
- Supabase client changes
- KIS OAuth flow changes

---

## 5. Required Owner Approvals Before Execution

The owner must confirm each approval before performing any step in this procedure. No execution is authorized until all relevant boxes are marked yes.

```text
Phase 3AF — Owner Approval Checklist (pre-execution)

Approve Preview-only Vercel env mutation:        yes / no
Approve Preview deployment trigger:              yes / no
Approve Preview endpoint test:                   yes / no
Confirm Production env must not be changed:      yes / no
Confirm KIS_ACCOUNT_NO must remain absent:       yes / no
Confirm no actual symbol, price, secret, token,
URL, or raw response body will be recorded
in docs or chat:                                 yes / no
```

All six items must be confirmed before any step is executed.

---

## 6. Preview-Only Environment Variable Plan

### Env Names to Set — Preview Scope Only

All entries below must be scoped to **Vercel Preview only**. Values are not recorded here. Only the env names are listed.

**KIS configuration (Preview scope only):**

| Env Name | Required Value Pattern |
|---|---|
| `KIS_APP_KEY` | Owner's KIS API key (non-secret in KIS sandbox; treated as secret here) |
| `KIS_APP_SECRET` | Owner's KIS API secret |
| `KIS_BASE_URL` | KIS API base URL (no trailing slash) |
| `KIS_ENABLE_LIVE_QUOTES` | Must be exactly `true` |
| `KIS_ENABLE_PREVIEW_LIVE_QUOTES` | Must be exactly `true` |

**Supabase cache configuration (Preview scope only):**

| Env Name | Required Value Pattern |
|---|---|
| `QUOTE_CACHE_BACKEND` | Must be exactly `supabase` |
| `PUBLIC_SUPABASE_URL` | Owner's Supabase project URL |
| `PUBLIC_SUPABASE_ANON_KEY` | Owner's Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Owner's Supabase service role key |

**Must remain absent (all scopes):**

| Env Name | Required State |
|---|---|
| `KIS_ACCOUNT_NO` | Must not be present in Preview, Production, or Development scope |

### Scoping Warning

- When adding env vars in the Vercel UI, select **Preview only**. Vercel UI labels may vary; look for a scope or environment selector.
- **Do not select Production**. If the Vercel UI shows combined-scope options (e.g., "All Environments"), do not use that option.
- If `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` already exist in Production or Development scope from prior phases, verify their values are not overwritten.
- Never record actual values in documentation or chat.

---

## 7. Owner-Run Vercel UI Procedure

This section describes the steps the owner must perform manually. Claude Code will not perform any of these steps.

**Step 1 — Open Vercel dashboard.**
Navigate to the Vercel project dashboard for mk-stock-lab. Vercel UI labels may vary across dashboard versions.

**Step 2 — Navigate to Environment Variables settings.**
In the project settings, find the Environment Variables section (typically under Settings → Environment Variables).

**Step 3 — Review existing env vars.**
Before adding anything, review the current env var list. Note which vars already exist and in which scopes (Production, Preview, Development). Do not modify Production-scoped vars.

**Step 4 — Verify `KIS_ACCOUNT_NO` is absent.**
Confirm that `KIS_ACCOUNT_NO` does not exist in any scope. If it does, do not proceed without removing it first.

**Step 5 — Add Preview-scoped KIS env vars.**
Add or update the five KIS env names listed in Section 6, each scoped to Preview only:
- `KIS_APP_KEY`
- `KIS_APP_SECRET`
- `KIS_BASE_URL`
- `KIS_ENABLE_LIVE_QUOTES` = `true`
- `KIS_ENABLE_PREVIEW_LIVE_QUOTES` = `true`

When entering each var, confirm only the Preview environment checkbox is selected. Vercel UI labels may vary.

**Step 6 — Add or verify Preview-scoped Supabase env vars.**
If not already present in Preview scope, add:
- `QUOTE_CACHE_BACKEND` = `supabase`
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

All four must be Preview-scoped only. If `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` are already present in Production scope from the existing Supabase configuration, do not modify or overwrite them in Production scope.

**Step 7 — Save changes.**
Save the env var changes in Vercel UI.

**Step 8 — Verify no Production vars were changed.**
Review the Production-scoped env var list and confirm that none of the KIS-specific vars appear in Production scope.

**Step 9 — Trigger a Preview deployment (only after owner approval).**
Push a commit to the tracked branch or manually trigger a Preview deployment using the Vercel dashboard. Do not trigger a Production deployment. Confirm approval from Section 5 before this step.

**Step 10 — Identify the Preview deployment URL.**
After the Preview deployment completes, find the Preview deployment URL. Do not paste the full URL into documentation or chat if it contains a sensitive project identifier. Use a placeholder or redacted label in evidence (e.g., `<PREVIEW_BASE_URL>`).

**Step 11 — Verify deployment succeeded.**
Check the Vercel build log for the Preview deployment. If the build failed, investigate the build log without pasting raw error output into documentation.

---

## 8. Future Owner-Run Preview Endpoint Test Procedure

After the Preview deployment is confirmed successful, the owner may test the endpoint.

**Endpoint path:**
```
/api/market/quote?market=KR&symbol=<PRIVATE_6_DIGIT_KR_CODE>
```

**Owner should:**
1. Choose a valid 6-digit KR stock code privately. Do not record the symbol.
2. Call the Preview endpoint using a browser, PowerShell, or another HTTP client.
3. Record only sanitized field-presence and boolean evidence as defined in Section 12.
4. Never record actual price values.
5. Never record the actual stock symbol.
6. Never record raw response body if it contains price data.
7. Never record tokens, keys, Supabase field values, raw KIS fields, raw provider errors, or stack traces.
8. If the response contains unexpected content, do not paste raw output. Use the blocked/failure categories from Section 11 to describe the result.

---

## 9. Suggested PowerShell Sanitized Check Template

The owner may use the following PowerShell template. Replace `<PREVIEW_BASE_URL>` and `<PRIVATE_6_DIGIT_KR_CODE>` with actual values privately. Do not record actual values when reporting evidence.

```powershell
# Phase 3AF Preview Endpoint Validation — PowerShell Sanitized Check Template
# Replace placeholders privately. Do not record actual values.

$previewBase = "<PREVIEW_BASE_URL>"
$symbol = "<PRIVATE_6_DIGIT_KR_CODE>"   # Set this privately; do not record

$uri = "$previewBase/api/market/quote?market=KR&symbol=$symbol"

$forbiddenTerms = @(
  "stck_prpr", "prdy_vrss", "prdy_ctrt", "acml_vol", "rt_cd", '"output"',
  "access_token", '"token"', "bearer", "appkey", "appsecret",
  "KIS_APP_KEY", "KIS_APP_SECRET", "KIS_ACCOUNT_NO",
  "SUPABASE_SERVICE_ROLE_KEY", "PUBLIC_SUPABASE_ANON_KEY", "PUBLIC_SUPABASE_URL",
  "supabase.co", '"stack"', '"trace"'
)

try {
  $response = Invoke-WebRequest -Uri $uri -Method GET -UseBasicParsing
  $status = $response.StatusCode
  $cacheControl = $response.Headers["Cache-Control"]
  $body = $response.Content

  # Forbidden term scan — must pass before any further inspection
  $forbiddenFound = @()
  foreach ($term in $forbiddenTerms) {
    if ($body -imatch [regex]::Escape($term)) {
      $forbiddenFound += $term
    }
  }

  if ($forbiddenFound.Count -gt 0) {
    Write-Host "phase3af forbidden-output-detected count=$($forbiddenFound.Count) sanitized=true"
    Write-Host "phase3af result=failed reason=forbidden_output_detected sanitized=true"
    exit 1
  }

  # Parse JSON
  $json = $body | ConvertFrom-Json
  $jsonParseOk = ($null -ne $json)
  $okTrue = ($json.ok -eq $true)
  $dataPresent = ($null -ne $json.data)
  $fallbackPresent = ($null -ne $json.fallback)

  # Field presence checks — do not print values
  $requiredDataFields = @("market", "symbol", "price", "currency", "asOf")
  $requiredFallbackFields = @("state", "reason")
  $dataFieldsPresent = $requiredDataFields | ForEach-Object { $null -ne $json.data.$_ }
  $allDataFieldsPresent = -not ($dataFieldsPresent -contains $false)
  $fallbackFieldsPresent = $requiredFallbackFields | ForEach-Object { $null -ne $json.fallback.$_ }
  $allFallbackFieldsPresent = -not ($fallbackFieldsPresent -contains $false)
  $cacheControlNoStore = ($cacheControl -imatch "no-store")

  # Raw KIS field absence check
  $rawKisFields = @("stck_prpr", "prdy_vrss", "prdy_ctrt", "acml_vol", "rt_cd")
  $rawKisAbsent = $true
  foreach ($field in $rawKisFields) {
    if ($null -ne $json.$field -or $null -ne $json.data.$field) {
      $rawKisAbsent = $false
    }
  }

  Write-Host "phase3af step=status status=$status sanitized=true"
  Write-Host "phase3af step=json-parse ok=$jsonParseOk sanitized=true"
  Write-Host "phase3af step=cache-control no-store=$cacheControlNoStore sanitized=true"
  Write-Host "phase3af step=ok-field value=$okTrue sanitized=true"
  Write-Host "phase3af step=data-present value=$dataPresent sanitized=true"
  Write-Host "phase3af step=fallback-present value=$fallbackPresent sanitized=true"
  Write-Host "phase3af step=data-fields-present value=$allDataFieldsPresent sanitized=true"
  Write-Host "phase3af step=fallback-fields-present value=$allFallbackFieldsPresent sanitized=true"
  Write-Host "phase3af step=raw-kis-fields-absent value=$rawKisAbsent sanitized=true"

  $allPass = $status -eq 200 -and $jsonParseOk -and $cacheControlNoStore -and
             $okTrue -and $dataPresent -and $fallbackPresent -and
             $allDataFieldsPresent -and $allFallbackFieldsPresent -and $rawKisAbsent

  Write-Host "phase3af step=final-result status=$(if ($allPass) { 'pass' } else { 'fail' }) sanitized=true"

} catch {
  # Do not print exception details — they may contain URLs or env values
  Write-Host "phase3af step=request-error status=failed code=endpoint_error sanitized=true"
  exit 1
} finally {
  Remove-Variable -Name symbol -ErrorAction SilentlyContinue
  Remove-Variable -Name uri -ErrorAction SilentlyContinue
  Remove-Variable -Name previewBase -ErrorAction SilentlyContinue
}
```

**Important template usage notes:**
- Set `$symbol` and `$previewBase` directly in a private shell session; never assign them in a file that is committed.
- Do not print `$symbol`, `$uri`, `$previewBase`, or any JSON field values in reported evidence.
- If the forbidden term scan fires, stop immediately and do not paste the response body.
- The `finally` block clears in-memory variables after the test completes.

---

## 10. Expected Preview Pass Criteria

A successful Phase 3AF owner-run validation requires all of the following:

| Criterion | Expected |
|---|---|
| HTTP status | 200 |
| JSON parse | Success |
| `Cache-Control` | Includes `no-store` |
| `ok` field | `true` |
| `data` object | Present |
| `fallback` object | Present |
| `data.market` | Present |
| `data.symbol` | Present (value not recorded) |
| `data.price` | Present (value not recorded) |
| `data.currency` | Present |
| `data.asOf` | Present |
| `fallback.state` | Present |
| `fallback.reason` | Present |
| Raw KIS fields (`stck_prpr`, `prdy_vrss`, etc.) | Absent from response |
| Secrets / tokens / raw errors / stack traces | Absent from response |
| Actual price value recorded | No |
| Actual stock symbol recorded | No |
| Production env changed | No |
| `KIS_ACCOUNT_NO` present in any scope | No |
| Forbidden term scan | Pass |

---

## 11. Expected Blocked / Failure Categories

If the endpoint test does not return HTTP 200 with a valid quote, the owner should classify the result using one of the following sanitized categories. Do not paste raw error output.

| Category | Description |
|---|---|
| `preview_env_missing` | Preview env vars not yet set or not applied after deployment |
| `preview_guard_missing` | `KIS_ENABLE_PREVIEW_LIVE_QUOTES` absent or not `true` in Preview scope |
| `production_runtime_blocked` | `VERCEL_ENV=production` triggered the hard block — would indicate an env scoping error |
| `kis_account_no_present` | `KIS_ACCOUNT_NO` was present — must be removed and redeployed |
| `kis_config_missing` | One or more KIS credential env names missing from Preview scope |
| `supabase_config_missing` | `QUOTE_CACHE_BACKEND` or Supabase env names missing from Preview scope |
| `response_not_json` | Response body is not valid JSON |
| `endpoint_error` | HTTP error status (e.g., 503, 500) |
| `forbidden_output_detected` | Forbidden term scan found sensitive content in response |
| `unexpected_safe_failure` | None of the above categories apply; do not paste raw output |

**Important clarifications:**
- A `preview_guard_missing` result is not a Production failure; it means the Preview guard is not configured correctly. Fix the env var and redeploy.
- A `production_runtime_blocked` result would indicate that `VERCEL_ENV` was not `preview` in the deployed function. This should not happen in a Vercel Preview deployment; investigate `VERCEL_ENV` value in Preview function logs if it occurs.
- Any raw error, exception message, or stack trace must not be pasted into documentation or chat.
- Any `production_runtime_blocked` result must not be bypassed by changing the guard; investigate the env configuration.

---

## 12. Sanitized Owner Evidence Template

The owner should record evidence using the following template after running the endpoint test. Fill in only the boolean fields. Never fill in actual values for symbol, price, URL, secrets, or raw response body.

```text
Phase 3AF Preview Owner-Run Validation Evidence

Date/time:
Vercel environment: Preview
Production env touched: no
Preview env mutation approved: yes / no
Preview deployment approved: yes / no
Preview endpoint test approved: yes / no
KIS_ACCOUNT_NO absent (all scopes): yes / no
KIS env vars present in Preview by boolean only: yes / no
  KIS_APP_KEY present in Preview: yes / no
  KIS_APP_SECRET present in Preview: yes / no
  KIS_BASE_URL present in Preview: yes / no
  KIS_ENABLE_LIVE_QUOTES=true in Preview: yes / no
  KIS_ENABLE_PREVIEW_LIVE_QUOTES=true in Preview: yes / no
Supabase env vars present in Preview by boolean only: yes / no
  QUOTE_CACHE_BACKEND=supabase in Preview: yes / no
  PUBLIC_SUPABASE_URL present in Preview: yes / no
  PUBLIC_SUPABASE_ANON_KEY present in Preview: yes / no
  SUPABASE_SERVICE_ROLE_KEY present in Preview: yes / no
Preview deployment successful: yes / no
Request path only: /api/market/quote?market=KR&symbol=<REDACTED_6_DIGIT_KR_CODE>
HTTP status:
JSON parse ok: yes / no
Cache-Control no-store: yes / no
ok true: yes / no
data object present: yes / no
fallback object present: yes / no
required normalized fields present (market, symbol, price, currency, asOf): yes / no
fallback state and reason present: yes / no
raw KIS fields absent: yes / no
secrets/tokens/raw errors/stack traces absent: yes / no
forbidden term scan passed: yes / no
actual symbol exposed: no
price value exposed: no
secret/token/URL value exposed: no
Production env touched during this procedure: no
KIS_ACCOUNT_NO was present at any point: no
runtime guard blocked request: yes / no / unknown
if blocked, sanitized reason category:
overall result: passed / failed / blocked / inconclusive
```

---

## 13. Rollback And Cleanup Plan

After the Preview endpoint test is complete (pass, fail, or blocked), the owner should decide whether to retain or remove the Preview-scoped KIS and Supabase env vars.

**Default recommended action — remove Preview KIS env vars after test:**

1. In Vercel UI, remove the following from Preview scope:
   - `KIS_APP_KEY`
   - `KIS_APP_SECRET`
   - `KIS_BASE_URL`
   - `KIS_ENABLE_LIVE_QUOTES`
   - `KIS_ENABLE_PREVIEW_LIVE_QUOTES`

2. Whether to retain or remove `QUOTE_CACHE_BACKEND`, `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in Preview scope is at the owner's discretion based on whether Supabase access is needed in Preview for other features.

3. Confirm `KIS_ACCOUNT_NO` was not added during this procedure.

4. Confirm Production env vars were not changed.

5. Trigger a new Preview deployment if vars were removed (to reflect clean state).

**Cleanup evidence (boolean only):**
```text
Phase 3AF Cleanup Evidence

KIS Preview env vars removed: yes / no
Supabase Preview env vars retained or removed: retained / removed
KIS_ACCOUNT_NO was never added: yes / no
Production env confirmed unchanged: yes / no
New Preview deployment after cleanup: yes / no / not-needed
```

Do not record env values.

---

## 14. Risk Controls

| Risk | Description | Mitigation |
|---|---|---|
| Production scope selection | Owner accidentally selects Production scope when adding KIS env vars in Vercel UI | Review each env var entry scope before saving; verify Production env list before and after changes; use Section 5 approval checklist |
| Secret leakage | KIS credentials or Supabase service-role key pasted into documentation or chat | Never record values; use boolean presence evidence only; PowerShell template suppresses value printing |
| `KIS_ACCOUNT_NO` accidental addition | Owner adds `KIS_ACCOUNT_NO` to Preview scope, blocking quote readiness | Verify absence before and after env mutation; the guard blocks readiness when it is present |
| Preview URL leakage | Preview deployment URL contains a sensitive project identifier and is pasted into docs | Use `<PREVIEW_BASE_URL>` placeholder in evidence; do not paste raw URL |
| Raw response body leakage | Owner pastes JSON body containing price or raw KIS fields | PowerShell template does not print body; forbidden term scan runs before any inspection; use Section 11 category codes instead of raw output |
| Price value recording | Owner records actual price in evidence template | Evidence template has `price value exposed: no` assertion; only field presence (boolean) is recorded |
| Deployment trigger risk | Owner triggers Production deployment instead of Preview | Confirm deployment type before triggering; Vercel Preview deployment is typically triggered by a branch push or a Preview-specific deploy button |
| Guard bypass risk | Owner changes guard code to force Preview to pass | Phase 3AF is documentation-only; guard source code is not to be changed; any guard bypass must go through a separate approval process |

---

## 15. Approval Boundary

- This document does not authorize Claude Code to mutate Vercel environment variables.
- This document does not authorize Claude Code to trigger any deployment.
- This document does not authorize Claude Code to call any Preview endpoint.
- This document does not authorize Claude Code to run any Vercel CLI command.
- This document does not authorize Claude Code to make live KIS API calls.
- This document does not authorize Claude Code to run live Supabase queries or writes.
- Only the owner may perform Vercel UI env changes, trigger Preview deployment, and call the Preview endpoint.
- Production KIS remains blocked by the `VERCEL_ENV=production` hard block in `kisClient.ts`.
- UI live quote wiring (Market, Portfolio, Chart AI, Home, Lab) remains blocked until Preview validation passes and a separate owner approval for UI wiring is given.
- If any steps in this document are ambiguous, the owner must resolve ambiguity before execution, not after.

---

## 16. Result Of This Phase

**Phase 3AF is complete when:**
- `docs/planning/phase_3af_vercel_preview_env_deployment_endpoint_validation_owner_run_plan_v0.1.md` is created.
- `docs/planning/planning_changelog.md` is updated with the Phase 3AF planning entry.
- A commit is made with message `docs: add phase 3af vercel preview owner-run plan`.

**No execution is included in Phase 3AF.** No Vercel UI change, no deployment, no endpoint test, and no live KIS call is part of this phase. All execution steps are owner-run only and require the Section 5 approval checklist to be completed by the owner before any step is taken.

---

## 17. Recommended Next Step

After the owner reviews this document and completes the Section 5 approval checklist, the recommended sequence is:

1. **Owner executes Section 7 (Vercel UI procedure)** — adds Preview-scoped KIS and Supabase env vars.
2. **Owner triggers Preview deployment** — after confirming the deployment is Preview, not Production.
3. **Owner runs Section 9 (PowerShell sanitized check template)** — using a private symbol and Preview base URL.
4. **Owner records sanitized evidence using Section 12 template** — boolean fields only, no values.
5. **Owner performs Section 13 cleanup** — removes Preview KIS env vars after test, records cleanup evidence.
6. **If evidence passes all Section 10 criteria**, the owner may provide the sanitized Section 12 evidence for a result-recording phase.
7. **A separate result-recording phase** will be created to capture the sanitized evidence as a Phase 3AF result document, following the same pattern as Phase 3AB (live result) and Phase 3AA (local endpoint result).

**Production KIS must remain blocked regardless of Phase 3AF outcome.**
**UI wiring must remain blocked until Phase 3AF passes and a separate explicit owner approval for wiring is given.**
