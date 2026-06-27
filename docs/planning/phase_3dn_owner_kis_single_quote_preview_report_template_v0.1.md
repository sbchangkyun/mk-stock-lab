# Phase 3DN — Owner KIS Single Quote Preview: Safe Report Template

**Purpose:** Use this template to report your `npm run smoke:kis-quote-live:dry` result safely to Claude Code.

**WARNING: Do NOT paste any of the following into your report:**
- `KIS_APP_KEY` value
- `KIS_APP_SECRET` value
- `KIS_BASE_URL` value (it contains endpoint info)
- Any access token, bearer token, or authorization header
- Any KIS JSON payload or raw response
- Any field starting with `stck_`, `prdy_`, `rt_cd`, `acml_`, `appkey`, `appsecret`
- `KIS_ACCOUNT_NO` value
- Supabase URL, Supabase service role key
- Any stack trace or raw error object

---

## Safe Report Fields

Fill in only the fields below. Leave unknown fields blank.

**Command run:**
```
npm run smoke:kis-quote-live:dry
```

**Mode (check one):**
- [ ] Live mode (all 5 PHASE_3Y_* guard vars were set to exact required values)
- [ ] Dry-run mode (guard vars were NOT set)

**Overall result:**
- [ ] PASS
- [ ] FAIL
- [ ] Incomplete / script crashed before final-result step

**Symbol tested:**
```
005930
```

**Market:**
```
KR
```

---

## Step-by-Step Results

Copy the sanitized step labels from the output (the `step=... status=... sanitized=true` lines). Do not copy any line that contains a raw value.

```
phase3y step=guard-check          status=...   sanitized=true
phase3y step=runtime-check        status=...   sanitized=true
phase3y step=smoke-identity-validation  status=...   sanitized=true
phase3y step=account-env-check    status=...   sanitized=true
phase3y step=kis-env-preflight    status=...   sanitized=true
phase3y step=runtime-setup        status=...   sanitized=true
phase3y step=provider-import      status=...   sanitized=true
phase3y step=quote-fetch          status=...   sanitized=true
phase3y step=quote-normalization  status=...   sanitized=true
phase3y step=cache-backend-check  status=...   sanitized=true
phase3y step=cache-write          status=...   sanitized=true
phase3y step=fresh-readback       status=...   sanitized=true
phase3y step=cleanup-restore      status=...   sanitized=true
phase3y step=final-result         status=...   sanitized=true
```

---

## Key Outcome Fields

**staleState** (from `quote-normalization` or `quote-fetch` step):
```
(e.g. fresh)
```

**Was a price value present in the snapshot?**
- [ ] Yes (pricePresent=true)
- [ ] No
- [ ] Not shown in output

**Was the output labeled `sanitized=true` on all step lines?**
- [ ] Yes
- [ ] No — one or more lines lacked `sanitized=true`

**Did the script emit `SAFE_OUTPUT_BLOCKED` on any line?**
- [ ] Yes — paste the blocked step name only, not the blocked content
- [ ] No

---

## Failure Information (if FAIL)

**Which step failed?**
```
(e.g. step=quote-fetch status=failed)
```

**Error category code** (e.g. `KIS_CONFIG_MISSING`, `AUTH_REQUIRED`, `PROVIDER_UNAVAILABLE`, `PROVIDER_RATE_LIMITED`):
```
(e.g. code=PROVIDER_UNAVAILABLE)
```

Do not paste raw error messages, stack traces, or raw provider responses.

---

## Safety Confirmation

Answer yes/no only:

| Question | Answer |
|----------|--------|
| Did output contain raw KIS token or access_token value? | |
| Did output contain account number or KIS_ACCOUNT_NO value? | |
| Did output contain raw KIS JSON payload? | |
| Did output contain raw provider field names (stck_prpr, rt_cd, etc.)? | |
| Did output contain API key or secret value? | |
| Did output contain Supabase URL or service role key? | |

All answers should be **no**. If any answer is **yes**, do not paste further output. Instead, share only:
```
SANITIZATION CONCERN: output contained potentially sensitive data in [step name].
Please do not share further output from that step.
```

---

## Additional Notes

```
(optional — e.g. market hours, retry attempts, local environment details without secret values)
```
