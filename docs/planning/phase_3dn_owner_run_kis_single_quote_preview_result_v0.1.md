# Phase 3DN — Owner-Run KIS Single Quote Preview: Result

## 1. Metadata

| Field | Value |
|-------|-------|
| Phase | 3DN |
| Type | Owner-Run KIS Single Quote Preview |
| Status | **Completed — owner live smoke PASS** |
| Latest prior commit | `725efba` (feat: harden kis fx mocked adapter contracts) |
| Canonical production URL | `https://mkstocklab.vercel.app` |
| Runtime UI changes | None |
| API route changes | None |
| DB / Supabase schema changes | None |
| Live KIS calls by Claude Code | None |
| Live KIS calls by owner | Completed — PASS |
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

The owner executed the live smoke command from a local terminal with real KIS credentials and all five `PHASE_3Y_*` guard variables set. Two attempts were made (see §4.1 for attempt history).

| Field | Value |
|-------|-------|
| Command | `npm run smoke:kis-quote-live:dry` |
| Executor | owner (not Claude Code) |
| Symbol | `005930` |
| Market | `KR` |
| Result | **PASS** |
| Sanitized | `true` |
| staleState | `fresh` |
| pricePresent | `true` |
| accountApiCalled | `false` — `KIS_ACCOUNT_NO` was absent |
| rawPayloadShared | `false` |
| secretsShared | `false` |

### Step Results (retry attempt — PASS)

| Step | Status |
|------|--------|
| `guard-check` | passed — `mode=live-approved` |
| `runtime-check` | passed |
| `smoke-identity-validation` | passed |
| `account-env-check` | passed — `KIS_ACCOUNT_NO` absent confirmed |
| `kis-env-preflight` | passed — required config names present |
| `runtime-setup` | passed |
| `provider-import` | passed — live KIS client loaded |
| `quote-fetch` | passed — `live-quote-received` |
| `quote-normalization` | passed — `staleState=fresh` |
| `cache-backend-check` | passed — `configuredBackend=memory` |
| `cache-write` | passed |
| `fresh-readback` | passed — `state=fresh` |
| `cleanup-restore` | passed |
| `final-result` | passed — `liveKis=true`, `quoteNormalized=true`, `cacheValidated=true`, `sanitized=true` |

### Guard Variables Used (names only — values never shared)

| Variable | Required value |
|----------|--------------|
| `PHASE_3Y_LIVE_KIS_SMOKE` | `OWNER_APPROVED` |
| `PHASE_3Y_RUNTIME_CONFIRMED` | `local-non-production-confirmed` |
| `PHASE_3Y_READ_ONLY_SCOPE_CONFIRMED` | `OWNER_CONFIRMS_READ_ONLY_QUOTE_ONLY` |
| `PHASE_3Y_PROVIDER_QUOTA_RISK_ACCEPTED` | `OWNER_ACCEPTS_KIS_QUOTA_RISK` |
| `PHASE_3Y_NO_ACCOUNT_APIS_CONFIRMED` | `OWNER_CONFIRMS_NO_ACCOUNT_APIS` |

### 4.1 Attempt History

**Attempt 1 — FAIL (environment setup issue)**

- Result: `FAIL`
- Failure step: `smoke-identity-validation`
- Failure code: `SMOKE_IDENTITY_INVALID`
- Reason: `PHASE_3Y_SMOKE_MARKET` and `PHASE_3Y_SMOKE_SYMBOL` were not set in the owner's local environment
- Live KIS quote fetch reached: **no** — script exited before the `quote-fetch` step
- Interpretation: owner environment setup issue / documentation gap; not a KIS credential failure, not a code bug
- Secrets shared: no
- Raw payload shared: no

**Attempt 2 — PASS**

- Owner set `PHASE_3Y_SMOKE_MARKET=KR` and `PHASE_3Y_SMOKE_SYMBOL=005930` before retrying
- All 14 smoke steps passed
- Live KIS quote received and normalized
- `staleState=fresh`, price present
- In-process mock cache write and readback validated
- Final result: `liveKis=true`, `quoteNormalized=true`, `cacheValidated=true`, `sanitized=true`
- Secrets shared: no
- Raw payload shared: no

---

## 5. Sanitization Review

The owner shared only sanitized `step=... status=... sanitized=true` labeled output. No unsafe content was provided.

Confirmed:

| Field | Status |
|-------|--------|
| API keys shared | No |
| App secrets shared | No |
| Tokens or bearer tokens shared | No |
| Account numbers shared | No |
| Raw KIS JSON payload shared | No |
| Raw provider payload shared | No |
| Authorization headers shared | No |
| Raw KIS field values (`stck_`, `prdy_`, `rt_cd`) shared | No |
| Supabase secrets shared | No |

Do NOT paste API key values, API secrets, tokens, or account numbers — only safe labeled step output is acceptable.

**Raw payload shared:** false

**Secrets shared:** false

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

**PASS confirmed:**

- Basic KIS credential and config connectivity is confirmed for one KR domestic stock (`005930`).
- Live KIS domestic quote retrieval works for `005930`.
- The quote-only guard path (`KIS_ACCOUNT_NO` absent) is operational.
- Quote normalization passed — returned snapshot has correct structure, no raw KIS field names, `staleState=fresh`.
- The sanitized output path (`logSafe`, `forbiddenOutputPattern`) functions correctly.
- In-process mock cache write and fresh readback validated.
- The identity validation guard correctly blocked the first attempt when `PHASE_3Y_SMOKE_MARKET` / `PHASE_3Y_SMOKE_SYMBOL` were absent — confirming the guard works as designed.

**This PASS does NOT mean:**

- This does NOT validate KR ETF (not yet tested live, though structurally supported).
- This does NOT validate US quotes (US quote endpoint not implemented).
- This does NOT validate real FX rates (real FX provider not implemented).
- This does NOT enable live portfolio valuation.
- This does NOT enable production UI live quotes for any user.

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
| `SMOKE_IDENTITY_INVALID` | `PHASE_3Y_SMOKE_MARKET` or `PHASE_3Y_SMOKE_SYMBOL` not set | Set both env vars before running |
| `VALIDATION_FAILED` | Symbol failed 6-digit check | Confirm symbol is `005930` (6 digits) |
| `SAFE_OUTPUT_BLOCKED` | Script's own sanitizer blocked a line | May indicate a script sanitization bug → recommend Phase 3DN-HF1 |
| `QUOTE_NORMALIZATION_FAILED` | Returned snapshot contains unexpected fields or missing required fields | May indicate a parsing bug → recommend Phase 3DN-HF1 |

---

## 9. Known Limitations

- Only one KR domestic stock (`005930`) was live-tested in this phase.
- KR ETF live quote not yet tested (structurally supported, but separate live test needed).
- US quote endpoint is not implemented — US positions remain `SYMBOL_UNSUPPORTED`.
- FX real provider is not implemented — mixed-currency portfolio total requires mocked adapter or future FX integration.
- `POST /api/portfolio/valuation` source=fixture remains the default — the API still requires `source=fixture` from callers.
- Portfolio `source=live` is still disabled (`source=live` returns 400 `UNSUPPORTED_SOURCE`).
- Production UI remains fixture/static for all users.
- `source=auto` remains deferred.

---

## 10. Recommended Next Phase

**Phase 3DO — KR Quote Preview Expansion and Portfolio Live Preview API Plan**

Phase 3DN established that a single KR domestic stock quote can be retrieved live, normalized, sanitized, and cached. Phase 3DO should expand the coverage to a controlled set of symbols:

| Symbol | Type | Expected currency |
|--------|------|------------------|
| `005930` | KR stock (Samsung) | KRW |
| `000660` | KR stock (SK Hynix) | KRW |
| `069500` | KR ETF (KODEX 200) | KRW |

Phase 3DO should also plan:

- `source=live` activation path in `POST /api/portfolio/valuation` with explicit owner/preview flag (not yet enabled)
- UI freshness labeling design (`조회 시점 기준`, `최근 조회 기준`, `데이터 일시 불가`)

Do not enable production UI live quotes until Phase 3DO expansion is validated.
