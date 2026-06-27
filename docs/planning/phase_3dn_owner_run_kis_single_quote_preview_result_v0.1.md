# Phase 3DN — Owner-Run KIS Single Quote Preview: Result

## 1. Metadata

| Field | Value |
|-------|-------|
| Phase | 3DN |
| Type | Owner-Run KIS Single Quote Preview |
| Status | **Owner execution pending** |
| Latest prior commit | `725efba` (feat: harden kis fx mocked adapter contracts) |
| Canonical production URL | `https://mkstocklab.vercel.app` |
| Runtime UI changes | None |
| API route changes | None |
| DB / Supabase schema changes | None |
| Live KIS calls by Claude Code | None |
| Live KIS calls by owner | Pending |
| Live FX calls | None |
| Live GNews calls | None |
| AI provider calls | None |
| External data fetch by Claude Code | None |
| Vercel production deployment | Not performed |

---

## 2. Purpose

Phase 3DM completed the mocked adapter contract hardening. All static and behavioral contracts pass without live credentials.

Phase 3DN is the first owner-controlled live KIS quote validation.

The goal is for the project owner to confirm locally — using real KIS credentials and explicit guard environment variables — that a single KR domestic stock quote can be retrieved, sanitized, normalized, and cached successfully.

This phase does not enable live data for any user. It does not change the API route, UI, or production behavior. It is a local, read-only, owner-only credential smoke test.

**Primary test symbol:** `005930` (KR stock)  
**Expected currency:** `KRW`  
**Expected staleState:** `fresh`  
**Expected sanitized:** `true`

---

## 3. Preflight Results

All no-network validations passed before requesting owner execution.

| Command | Result |
|---------|--------|
| `npm run check:kis-fx-mocked-adapter` | 119/119 PASS |
| `npm run check:kis-fx-preview-smoke-plan` | 52/52 PASS |
| `npm run check:kis-valuation-design` | 73/73 PASS |
| `npm run check:kis-quote-adapter-mocked` | 101/101 PASS |
| `npm run build` | PASS |
| `git diff --check` | PASS (exit 0) |
| `git status --short` | Only expected untracked files |

---

## 4. Owner Live Smoke Result

The owner has not yet executed the live smoke command. This section will be updated after the owner runs `npm run smoke:kis-quote-live:dry` with live guards and KIS credentials set.

| Field | Value |
|-------|-------|
| Command | `npm run smoke:kis-quote-live:dry` |
| Executor | owner (not Claude Code) |
| Symbol | `005930` |
| Market | `KR` |
| Result | **pending** |
| Sanitized | unknown |
| staleState | unknown |
| pricePresent | not yet shared |
| accountApiCalled | unknown |
| rawPayloadShared | false |
| secretsShared | false |

### Owner Smoke Command

Run this from your local terminal after configuring KIS credentials and all five guard env vars:

```
npm run smoke:kis-quote-live:dry
```

This command uses `scripts/owner_smoke_kis_quote_live.mjs`. It enters live mode only when all five `PHASE_3Y_*` guard variables are set to their exact required values. Without guards, it runs a dry-run simulation using a synthetic snapshot.

### Required Environment (names only — never share values)

**KIS credentials:**
| Variable | Purpose |
|----------|---------|
| `KIS_APP_KEY` | KIS developer app key |
| `KIS_APP_SECRET` | KIS developer app secret |
| `KIS_BASE_URL` | KIS API base URL |
| `KIS_ENABLE_LIVE_QUOTES` | Must be exact string `true` |

**Scope enforcement:**
| Variable | Required state |
|----------|--------------|
| `KIS_ACCOUNT_NO` | Must be ABSENT — if set, smoke is blocked |

**Guard variables:**
| Variable | Required value |
|----------|--------------|
| `PHASE_3Y_LIVE_KIS_SMOKE` | `OWNER_APPROVED` |
| `PHASE_3Y_RUNTIME_CONFIRMED` | `local-non-production-confirmed` |
| `PHASE_3Y_READ_ONLY_SCOPE_CONFIRMED` | `OWNER_CONFIRMS_READ_ONLY_QUOTE_ONLY` |
| `PHASE_3Y_PROVIDER_QUOTA_RISK_ACCEPTED` | `OWNER_ACCEPTS_KIS_QUOTA_RISK` |
| `PHASE_3Y_NO_ACCOUNT_APIS_CONFIRMED` | `OWNER_CONFIRMS_NO_ACCOUNT_APIS` |

### Dry-run First (Safe Check)

Before live mode, you may confirm the smoke script mechanics by running without guard vars:

```
npm run smoke:kis-quote-live:dry
```

Without live guards, the script uses a synthetic snapshot (`price=70000`, `staleState=fresh`) and validates all steps except the actual KIS network call. All steps should pass. This confirms the script, identity, and sanitizer are functioning.

---

## 5. Sanitization Review

No live smoke output has been shared yet. This section will be updated once the owner shares a sanitized result.

Do NOT paste API key values, API secrets, tokens, or account numbers — only safe labeled step output is acceptable.

When reporting, do not share:
- `KIS_APP_KEY` value
- `KIS_APP_SECRET` value
- `KIS_BASE_URL` value
- Any access token or bearer token
- Any KIS JSON payload
- Any field starting with `stck_`, `prdy_`, `rt_cd`, `acml_`, `appkey`, `appsecret`
- `KIS_ACCOUNT_NO` value
- Supabase project URL or service role key

**Raw payload shared:** false (no live run completed yet)  
**Secrets shared:** false (no live run completed yet)

---

## 6. Smoke Script Behavior

`scripts/owner_smoke_kis_quote_live.mjs` performs these steps when run in live mode:

| Step | Description |
|------|-------------|
| `guard-check` | Verifies all 5 `PHASE_3Y_*` guard variables are set with exact values |
| `runtime-check` | Confirms current runtime is not a production environment |
| `smoke-identity-validation` | Validates `KR` market and `005930` (6-digit symbol) |
| `account-env-check` | Confirms `KIS_ACCOUNT_NO` is absent |
| `kis-env-preflight` | Presence-only check — verifies KIS env var names are set (values never read, printed, or compared) |
| `runtime-setup` | Compiles `kisClient.ts` to a temporary directory; does not trigger network calls yet |
| `provider-import` | Imports compiled KIS provider module |
| `quote-fetch` | Calls `getKisQuoteSnapshot({market:'KR', symbol:'005930'})` — this is the only live KIS call |
| `quote-normalization` | Validates returned snapshot: market, symbol, price, currency, asOf, staleState=fresh; checks for raw KIS field names |
| `cache-backend-check` | Records configured cache backend name |
| `cache-write` | Writes snapshot to in-process mock cache |
| `fresh-readback` | Reads back from mock cache within fresh TTL — confirms state='fresh' |
| `cleanup-restore` | Deletes smoke mock cache entry |
| `final-result` | Emits overall pass/fail |

All output lines pass through `logSafe()` which blocks any line matching the forbidden pattern (includes `stck_prpr`, `prdy_vrss`, `rt_cd`, `acml_vol`, `access_token`, `appkey`, `appsecret`, `authorization`, `Bearer`, etc.). If a forbidden line is detected, it emits `code=SAFE_OUTPUT_BLOCKED` and throws.

---

## 7. Interpretation

**If PASS (after owner runs):**
- KIS credential and config basic quote connectivity is confirmed for one KR domestic stock.
- The quote-only guard path (`KIS_ACCOUNT_NO` absent) is operational.
- The sanitized output path (`logSafe`, `forbiddenOutputPattern`) functions correctly.
- This does NOT validate US quotes (not implemented).
- This does NOT validate KR ETF (not yet tested live, though structurally supported).
- This does NOT validate FX (not implemented).
- This does NOT validate portfolio live valuation.
- This does NOT enable production live data.

**If FAIL (after owner runs):**
- See §8 for failure categories and recommended actions.
- Do not interpret a single smoke failure as evidence of a code path bug unless the failure is `SAFE_OUTPUT_BLOCKED` or `QUOTE_NORMALIZATION_FAILED`.
- `GUARD_FAIL`, `CONFIG_MISSING`, `AUTH_REQUIRED`, and `PROVIDER_UNAVAILABLE` are owner-environment issues, not code bugs.

---

## 8. Failure Categories and Remediation

Report only the error category code (e.g. `PROVIDER_UNAVAILABLE`) — not the raw error message or stack trace.

| Failure code | Likely cause | Remediation |
|-------------|-------------|-------------|
| `GUARD_FAIL` / `mode=dry-run-no-live-guards` | Guard env vars missing or incorrect | Check all 5 `PHASE_3Y_*` vars match exact required values |
| `CONFIG_MISSING` | `KIS_APP_KEY`, `KIS_APP_SECRET`, or `KIS_BASE_URL` not set | Set KIS credentials locally |
| `KIS_CONFIG_MISSING` | `KIS_ENABLE_LIVE_QUOTES` not set to `true` | Set `KIS_ENABLE_LIVE_QUOTES=true` |
| `ACCOUNT_ENV_NOT_ALLOWED` | `KIS_ACCOUNT_NO` is set | Unset `KIS_ACCOUNT_NO` before running |
| `AUTH_REQUIRED` / token step fails | KIS credentials invalid or expired | Renew KIS app credentials |
| `PROVIDER_UNAVAILABLE` on quote step | KIS endpoint unreachable or rejected | Check `KIS_BASE_URL`, retry after brief wait |
| `PROVIDER_RATE_LIMITED` | KIS returned 429 | Wait 60+ seconds before retrying |
| `VALIDATION_FAILED` | Symbol failed 6-digit check | Confirm symbol is `005930` (6 digits) |
| `SAFE_OUTPUT_BLOCKED` | Script's own sanitizer blocked a line | May indicate a script sanitization bug → recommend Phase 3DN-HF1 |
| `QUOTE_NORMALIZATION_FAILED` | Returned snapshot contains unexpected fields or missing required fields | May indicate a parsing bug → recommend Phase 3DN-HF1 |

---

## 9. Known Limitations

- Only one KR domestic stock (`005930`) was targeted in this phase.
- KR ETF was not live-tested (structurally supported, but separate live test needed).
- US quote endpoint is not implemented — US positions remain `SYMBOL_UNSUPPORTED`.
- FX real provider is not implemented — mixed-currency portfolio total requires mocked adapter or future FX integration.
- `POST /api/portfolio/valuation` source=fixture remains the default — the API still requires `source=fixture` from callers.
- Portfolio `source=live` is still disabled (`source=live` returns 400 `UNSUPPORTED_SOURCE`).
- Production UI remains fixture/static for all users.
- `source=auto` remains deferred.

---

## 10. Recommended Next Phase

**If PASS:**

Phase 3DO — KR Quote Preview Expansion and Portfolio Live Preview API Plan

- Test additional KR symbols (`000660`, `069500`)
- Plan `source=live` activation in `POST /api/portfolio/valuation` with explicit owner/preview flag
- Plan UI freshness labeling (`조회 시점 기준`, `최근 조회 기준`, `데이터 일시 불가`)

**If FAIL (owner configuration issue):**

Phase 3DN-Retry — Owner KIS Credential / Guard Retry

- Owner re-checks env vars, credentials, guard values, KIS_ACCOUNT_NO absence
- No code changes required

**If FAIL (suspected script/sanitization bug):**

Phase 3DN-HF1 — KIS Smoke Script Sanitization / Guard Fix

- Inspect `scripts/owner_smoke_kis_quote_live.mjs` for the failure pattern
- Fix the sanitizer or normalization check
- Re-run owner smoke after fix
