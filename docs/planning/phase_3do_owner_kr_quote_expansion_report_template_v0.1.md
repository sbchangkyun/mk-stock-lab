# Phase 3DO — Owner KR Quote Expansion: Safe Report Template

**Purpose:** Use this template to report the results of three owner-run live KIS quote smokes safely to Claude Code.

**WARNING: Do NOT paste any of the following into your report:**
- `KIS_APP_KEY` value
- `KIS_APP_SECRET` value
- `KIS_BASE_URL` value (it contains endpoint info)
- Any access token, bearer token, or authorization header
- Any KIS JSON payload or raw response body
- Any field starting with `stck_`, `prdy_`, `rt_cd`, `acml_`, `appkey`, `appsecret`
- `KIS_ACCOUNT_NO` value (or any account-related number)
- Supabase URL or service role key
- Any stack trace or raw error object
- Any actual price or market data value (report pricePresent=true/false only)

---

## Pre-Run Checklist

Before running, confirm:
- [ ] KIS credentials set locally (names only, not shared here)
- [ ] `KIS_ACCOUNT_NO` is NOT set
- [ ] All 5 `PHASE_3Y_*` guard variables set to required values
- [ ] `PHASE_3Y_SMOKE_MARKET` set to `KR` before each run
- [ ] `PHASE_3Y_SMOKE_SYMBOL` changed to target symbol before each run

---

## Run 1 — Symbol `005930` (KR Stock, Regression)

**Command run:**
```
$env:PHASE_3Y_SMOKE_MARKET = "KR"
$env:PHASE_3Y_SMOKE_SYMBOL = "005930"
npm run smoke:kis-quote-live:dry
```

**Mode:**
- [ ] Live mode (`mode=live-approved`)
- [ ] Dry-run mode (guards not set — live data NOT retrieved)

**Overall result:**
- [ ] PASS
- [ ] FAIL
- [ ] Incomplete

**Step-by-step output (sanitized lines only):**
```
phase3y step=guard-check                status=...   sanitized=true
phase3y step=runtime-check              status=...   sanitized=true
phase3y step=smoke-identity-validation  status=...   sanitized=true
phase3y step=account-env-check          status=...   sanitized=true
phase3y step=kis-env-preflight          status=...   sanitized=true
phase3y step=runtime-setup              status=...   sanitized=true
phase3y step=provider-import            status=...   sanitized=true
phase3y step=quote-fetch                status=...   sanitized=true
phase3y step=quote-normalization        status=...   sanitized=true
phase3y step=cache-backend-check        status=...   sanitized=true
phase3y step=cache-write                status=...   sanitized=true
phase3y step=fresh-readback             status=...   sanitized=true
phase3y step=cleanup-restore            status=...   sanitized=true
phase3y step=final-result               status=...   sanitized=true
```

**Key outcome fields:**
- staleState: `(e.g. fresh)`
- pricePresent: `(yes / no)`
- sanitized=true on all lines: `(yes / no)`
- SAFE_OUTPUT_BLOCKED emitted: `(yes / no)`

**If FAIL — error category code only (e.g. PROVIDER_UNAVAILABLE):**
```

```

**Safety confirmation:**
| Question | Answer (yes/no) |
|----------|----------------|
| Raw KIS token or access_token in output? | |
| Account number or KIS_ACCOUNT_NO in output? | |
| Raw KIS JSON payload in output? | |
| Raw provider field names (stck_prpr, rt_cd) in output? | |
| API key or secret in output? | |
| Supabase URL or service role key in output? | |

---

## Run 2 — Symbol `000660` (KR Stock)

**Command run:**
```
$env:PHASE_3Y_SMOKE_MARKET = "KR"
$env:PHASE_3Y_SMOKE_SYMBOL = "000660"
npm run smoke:kis-quote-live:dry
```

**Mode:**
- [ ] Live mode (`mode=live-approved`)
- [ ] Dry-run mode

**Overall result:**
- [ ] PASS
- [ ] FAIL
- [ ] Incomplete

**Step-by-step output (sanitized lines only):**
```
phase3y step=guard-check                status=...   sanitized=true
phase3y step=runtime-check              status=...   sanitized=true
phase3y step=smoke-identity-validation  status=...   sanitized=true
phase3y step=account-env-check          status=...   sanitized=true
phase3y step=kis-env-preflight          status=...   sanitized=true
phase3y step=runtime-setup              status=...   sanitized=true
phase3y step=provider-import            status=...   sanitized=true
phase3y step=quote-fetch                status=...   sanitized=true
phase3y step=quote-normalization        status=...   sanitized=true
phase3y step=cache-backend-check        status=...   sanitized=true
phase3y step=cache-write                status=...   sanitized=true
phase3y step=fresh-readback             status=...   sanitized=true
phase3y step=cleanup-restore            status=...   sanitized=true
phase3y step=final-result               status=...   sanitized=true
```

**Key outcome fields:**
- staleState: `(e.g. fresh)`
- pricePresent: `(yes / no)`
- sanitized=true on all lines: `(yes / no)`
- SAFE_OUTPUT_BLOCKED emitted: `(yes / no)`

**If FAIL — error category code only:**
```

```

**Safety confirmation:**
| Question | Answer (yes/no) |
|----------|----------------|
| Raw KIS token or access_token in output? | |
| Account number or KIS_ACCOUNT_NO in output? | |
| Raw KIS JSON payload in output? | |
| Raw provider field names (stck_prpr, rt_cd) in output? | |
| API key or secret in output? | |
| Supabase URL or service role key in output? | |

---

## Run 3 — Symbol `069500` (KR ETF — KODEX 200)

**Command run:**
```
$env:PHASE_3Y_SMOKE_MARKET = "KR"
$env:PHASE_3Y_SMOKE_SYMBOL = "069500"
npm run smoke:kis-quote-live:dry
```

**Note:** `069500` is a KR ETF. KIS treats all 6-digit domestic codes uniformly — ETFs use the same domestic endpoint as stocks. This run confirms ETF quote retrieval works through the existing adapter.

**Mode:**
- [ ] Live mode (`mode=live-approved`)
- [ ] Dry-run mode

**Overall result:**
- [ ] PASS
- [ ] FAIL
- [ ] Incomplete

**Step-by-step output (sanitized lines only):**
```
phase3y step=guard-check                status=...   sanitized=true
phase3y step=runtime-check              status=...   sanitized=true
phase3y step=smoke-identity-validation  status=...   sanitized=true
phase3y step=account-env-check          status=...   sanitized=true
phase3y step=kis-env-preflight          status=...   sanitized=true
phase3y step=runtime-setup              status=...   sanitized=true
phase3y step=provider-import            status=...   sanitized=true
phase3y step=quote-fetch                status=...   sanitized=true
phase3y step=quote-normalization        status=...   sanitized=true
phase3y step=cache-backend-check        status=...   sanitized=true
phase3y step=cache-write                status=...   sanitized=true
phase3y step=fresh-readback             status=...   sanitized=true
phase3y step=cleanup-restore            status=...   sanitized=true
phase3y step=final-result               status=...   sanitized=true
```

**Key outcome fields:**
- staleState: `(e.g. fresh)`
- pricePresent: `(yes / no)`
- sanitized=true on all lines: `(yes / no)`
- SAFE_OUTPUT_BLOCKED emitted: `(yes / no)`

**If FAIL — error category code only:**
```

```

**Safety confirmation:**
| Question | Answer (yes/no) |
|----------|----------------|
| Raw KIS token or access_token in output? | |
| Account number or KIS_ACCOUNT_NO in output? | |
| Raw KIS JSON payload in output? | |
| Raw provider field names (stck_prpr, rt_cd) in output? | |
| API key or secret in output? | |
| Supabase URL or service role key in output? | |

---

## Overall Summary

| Symbol | Type | Result | staleState | pricePresent | secretsShared |
|--------|------|--------|-----------|-------------|--------------|
| `005930` | KR stock | | | | no |
| `000660` | KR stock | | | | no |
| `069500` | KR ETF | | | | no |

---

## Additional Notes

```
(optional — e.g. market hours, retry attempts, environment details without credential values)
```

---

## HF1 Diagnostic Rerun — Symbol `069500`

*(Complete this section after Phase 3DO-HF1 is applied and you rerun only `069500`.)*

**Phase 3DO-HF1 improves failure diagnostics.** If `069500` previously returned `code=QUOTE_FETCH_FAILED`, this rerun will now return a specific safe code.

**IMPORTANT — what NOT to share in this section:**
- Do NOT paste raw error messages, raw stack traces, or HTTP status text containing provider details.
- Do NOT paste raw KIS JSON or any response body.
- Do NOT paste token, account number, API key, or secret values.
- Do NOT paste raw provider field names (`stck_`, `prdy_`, `rt_cd`, `acml_`, etc.).
- Paste ONLY the single safe `code=<SPECIFIC_CODE>` label from the `quote-fetch` line.

**Command run:**
```powershell
$env:PHASE_3Y_SMOKE_MARKET = "KR"
$env:PHASE_3Y_SMOKE_SYMBOL = "069500"
npm run smoke:kis-quote-live:dry
```

**Mode:**
- [ ] Live mode (`mode=live-approved`)
- [ ] Dry-run mode

**Overall result:**
- [ ] PASS
- [ ] FAIL

**Failed step (if FAIL):**
```
(e.g. step=quote-fetch status=failed)
```

**Safe diagnostic code (paste only the code= value from quote-fetch output line):**
```
(e.g. code=SYMBOL_UNSUPPORTED)
```

Allowed codes: `PROVIDER_RATE_LIMITED`, `PROVIDER_UNAVAILABLE`, `AUTH_REQUIRED`,
`KIS_CONFIG_MISSING`, `SYMBOL_UNSUPPORTED`, `PROVIDER_RESPONSE_UNEXPECTED`, `QUOTE_FETCH_FAILED_UNKNOWN`

**staleState (if available):**
```
(e.g. fresh — or not reached)
```

**pricePresent (if available):**
- [ ] Yes
- [ ] No
- [ ] Not reached (failed before normalization)

**sanitized=true on all lines:**
- [ ] Yes
- [ ] No — one or more lines lacked sanitized=true

**SAFE_OUTPUT_BLOCKED emitted:**
- [ ] Yes
- [ ] No

**Safety confirmation:**
| Question | Answer (yes/no) |
|----------|----------------|
| Raw KIS token or access_token in output? | |
| Account number or KIS_ACCOUNT_NO in output? | |
| Raw KIS JSON payload in output? | |
| Raw provider field names (stck_prpr, rt_cd) in output? | |
| API key or secret in output? | |
| Supabase URL or service role key in output? | |

**rawPayloadShared:** no
**secretsShared:** no
**accountNumberShared:** no
