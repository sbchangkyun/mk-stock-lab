# Phase 3AJ KIS Error/Fallback Path Validation Plan v0.1

## 1. Title And Metadata

- **Phase**: 3AJ
- **Type**: KIS error/fallback path validation plan
- **Status**: Planned
- **Scope**: Error/fallback validation planning only
- **Implementation changes**: None
- **Live execution**: None
- **Source code changes**: None
- **Related successful-path validation**: `docs/planning/phase_3af_owner_vercel_preview_endpoint_validation_result_v0.1.md`
- **Related env cleanup**: `docs/planning/phase_3ai_vercel_env_scope_cleanup_result_v0.1.md`
- **Date**: 2026-06-22

---

## 2. Objective

Phase 3AJ defines a safe validation plan for KIS error, guard, and fallback behavior before any UI live quote integration is considered. Phase 3AF validated that the successful `/api/market/quote` path works correctly in Vercel Preview. Before UI integration can be approved, the system must demonstrate that it fails safely and cleanly across a broad range of error conditions: guard blocks, missing env, provider failures, cache fallback transitions, API sanitization, and request validation.

This document defines what to validate, in what order, under what constraints, and what evidence may and may not be recorded.

---

## 3. Current Known Good State

The following is the validated baseline as of Phase 3AI:

| Property | State |
|---|---|
| Vercel Preview successful path | Validated in Phase 3AF — HTTP 200, all success criteria passed |
| `classifyRuntime()` guard | Implemented in Phase 3AE — six explicit runtime classes |
| Production live KIS | Hard-blocked: `vercel-production` → unconditional `production_not_allowed` |
| `KIS_ACCOUNT_NO` presence | Blocked: triggers `production_not_allowed` by policy |
| Vercel Preview without explicit guard | Blocked: `vercel-preview` without `KIS_ENABLE_PREVIEW_LIVE_QUOTES=true` → `preview_guard_required` |
| Normalized `QuoteSnapshot` response shape | Validated on success path in Phase 3AF |
| UI live quote wiring | Blocked — not connected on any page |
| KIS error/fallback paths | Not validated — this is the subject of Phase 3AJ |
| Vercel cold-start token cache behavior | Not characterized |

---

## 4. Validation Risk Model

Failure-path validation is required before UI integration for the following reasons:

**Provider error exposure risk.** KIS returns structured error payloads with vendor-specific fields (`rt_cd`, `msg_cd`, `msg1`). If sanitization in `getKisDomesticQuoteSnapshot()` fails or is bypassed, raw vendor fields could reach the API response and then the browser.

**Token credential failure risk.** A token fetch failure that is not properly caught could expose the raw KIS upstream response body, which may contain the app key, app secret, or raw error messages in the response. The `sanitizeUnknownError` path and `PROVIDER_UNAVAILABLE` wrapping must be confirmed to strip this.

**Missing env leakage risk.** An improperly handled missing-env state could reflect env var names or values back in the response body or in a JavaScript error that reaches the browser.

**Cache fallback ambiguity risk.** If the cache returns a stale entry but the fallback metadata is not correctly set, the UI could display stale data without indication. The `QuoteFallbackMetadata` fields (`state`, `reason`, `cache.cachedAt`, etc.) must be accurate under each transition.

**API route error sanitization risk.** `quote.ts` uses `toHttpStatus(result.code)` and forwards the `ProviderErrorEnvelope` directly. If an error code is missing or the `message` field contains a raw upstream payload, it would be visible to clients.

**UI integration gate.** The UI should not be connected to live quote data until all of the above risk areas have been validated and documented with sanitized evidence.

---

## 5. Proposed Validation Scenarios

The following scenarios are grouped by concern. Each will require a dedicated test case or harness entry in Phase 3AK.

### A. Runtime Guard Scenarios

These scenarios validate that `classifyRuntime()` and `getKisQuoteConfigReadiness()` produce the expected readiness result for each runtime class.

| Scenario | Expected readiness reason |
|---|---|
| `VERCEL_ENV=production` set | `production_not_allowed` |
| `VERCEL_ENV=production` + all live flags set | `production_not_allowed` (hard block regardless) |
| `VERCEL_ENV=preview` + `KIS_ENABLE_PREVIEW_LIVE_QUOTES` absent | `preview_guard_required` |
| `VERCEL_ENV=preview` + `KIS_ENABLE_PREVIEW_LIVE_QUOTES=false` | `preview_guard_required` |
| `VERCEL_ENV=preview` + guard set to `1` (not `"true"`) | `preview_guard_required` |
| `VERCEL_ENV=` (empty string, non-Vercel) + `NODE_ENV=production` | `production_not_allowed` (`node-production`) |
| `VERCEL_ENV=unknown-value` | `production_not_allowed` (`unknown` class, fail-closed) |
| `KIS_ACCOUNT_NO` present in any runtime | `production_not_allowed` |
| Local dev (`VERCEL_ENV` absent, `NODE_ENV=development`) | Proceeds to flag/env checks |
| `VERCEL_ENV=development` (Vercel dev) | Proceeds to flag/env checks |

### B. Environment Readiness Scenarios

These scenarios validate `getKisQuoteConfigReadiness()` for missing or incorrect env values.

| Scenario | Expected readiness reason |
|---|---|
| `KIS_APP_KEY` absent | `config_missing` |
| `KIS_APP_SECRET` absent | `config_missing` |
| `KIS_BASE_URL` absent | `config_missing` |
| All three required env vars absent | `config_missing` |
| `KIS_ENABLE_LIVE_QUOTES` absent | `disabled` |
| `KIS_ENABLE_LIVE_QUOTES=false` | `disabled` |
| `KIS_ENABLE_LIVE_QUOTES=1` (not `"true"`) | `disabled` |
| All env present and correct | `ready` |
| Supabase cache env missing when `QUOTE_CACHE_BACKEND=supabase` | Cache layer error (not KIS readiness block) |
| `QUOTE_CACHE_BACKEND` unset | Cache layer should fall back to memory or no-op |

### C. Provider Failure Scenarios

These scenarios validate the behavior of `getKisAccessToken()` and `getKisDomesticQuoteSnapshot()` when the network layer fails. In Phase 3AK these are tested via mock/stub — no live KIS calls.

**Token fetch failures:**

| Scenario | Expected error code |
|---|---|
| Token fetch returns HTTP 429 | `PROVIDER_RATE_LIMITED` |
| Token fetch returns HTTP 500 | `PROVIDER_UNAVAILABLE` |
| Token fetch returns HTTP 401 | `PROVIDER_UNAVAILABLE` |
| Token fetch returns HTTP 200 but empty body | `PROVIDER_UNAVAILABLE` |
| Token fetch returns HTTP 200 but `access_token` is empty string | `PROVIDER_UNAVAILABLE` |
| Token fetch network error (fetch throws) | `PROVIDER_UNAVAILABLE` via `sanitizeUnknownError` |
| Token fetch response is not parseable JSON | `PROVIDER_UNAVAILABLE` via `sanitizeUnknownError` |

**Quote fetch failures:**

| Scenario | Expected error code |
|---|---|
| Quote fetch returns HTTP 429 | `PROVIDER_RATE_LIMITED` |
| Quote fetch returns HTTP 403 | `PROVIDER_UNAVAILABLE` |
| Quote fetch returns HTTP 500 | `PROVIDER_UNAVAILABLE` |
| Quote fetch returns HTTP 200 but `rt_cd !== '0'` | `PROVIDER_UNAVAILABLE` |
| Quote fetch returns HTTP 200 but `output` is absent | `PROVIDER_UNAVAILABLE` |
| Quote fetch returns HTTP 200 but `stck_prpr` is absent | `PROVIDER_UNAVAILABLE` |
| Quote fetch returns HTTP 200 but `stck_prpr` is non-numeric | `PROVIDER_UNAVAILABLE` |
| Quote fetch returns malformed JSON (throws on `.json()`) | `PROVIDER_UNAVAILABLE` via `sanitizeUnknownError` |
| Quote fetch network error (fetch throws) | `PROVIDER_UNAVAILABLE` via `sanitizeUnknownError` |
| Quote fetch returns empty body | `PROVIDER_UNAVAILABLE` via `sanitizeUnknownError` |

### D. Cache Fallback Scenarios

These scenarios validate `QuoteFallbackMetadata` accuracy under mock conditions. The `fallback.state` and `fallback.reason` fields in the API response must correctly reflect the cache transition. No live Supabase calls in Phase 3AK.

| Scenario | Expected `fallback.state` | Expected `fallback.reason` |
|---|---|---|
| Provider succeeds, no cache | `fresh` | `provider-fresh` |
| Provider succeeds, cache write fails silently | `fresh` | `provider-fresh` |
| In-memory cache hit (fresh) | `fresh` | `cache-fresh` |
| Supabase cache hit (fresh) after memory flush | `fresh` | `cache-fresh` |
| Provider fails, stale-but-usable cache available | `stale-but-usable` | `cache-stale-provider-failed` |
| Provider fails, no cache | `unavailable` | N/A — error envelope, not `ok: true` response |
| Cache entry present but normalized fields incomplete | depends on implementation — investigate |
| Cache read throws — provider succeeds | `fresh` | `provider-fresh` |
| Cache write throws — provider succeeds | `fresh` | `provider-fresh` |
| Supabase cache read fails — stale cache entry in memory | `stale-but-usable` | `cache-stale-provider-failed` |

### E. API Response Sanitization Scenarios

These scenarios validate that `quote.ts` and `getQuoteSnapshot()` never expose sensitive content in the response body. Apply a forbidden-term scan to all test outputs.

| Must be absent from any API response | Reason |
|---|---|
| Raw KIS field names (`rt_cd`, `msg_cd`, `msg1`, `stck_prpr`, `prdy_vrss`, `prdy_ctrt`, `acml_vol`, `access_token`, `access_token_token_expired`, `expires_in`) | Raw vendor fields must be normalized away |
| KIS app key value | Secret credential |
| KIS app secret value | Secret credential |
| Any token or bearer value | Session credential |
| Supabase service-role key | Secret credential |
| Supabase anon key | Credential |
| Supabase URL | Internal infrastructure |
| DB connection string | Secret credential |
| Project ref | Internal identifier |
| JavaScript stack trace | Raw error, potential info leak |
| Raw upstream error body | Potential credential or path leak |
| `KIS_ACCOUNT_NO` | Must remain absent by policy |
| Actual stock symbol used in test | Sanitize before recording |
| Actual price value from KIS | Sanitize before recording |

### F. Request Validation Scenarios

These scenarios validate `parseQuoteRequest()` in `quote.ts` and `validateKisDomesticQuoteInput()` in `kisClient.ts`.

| Scenario | Expected HTTP status | Expected `code` |
|---|---|---|
| `market` param missing | 400 | `VALIDATION_FAILED` |
| `market=xx` (unsupported) | 400 | `VALIDATION_FAILED` |
| `market=US` (not currently supported by KIS) | 4xx | `SYMBOL_UNSUPPORTED` |
| `symbol` param missing | 400 | `VALIDATION_FAILED` |
| `symbol=` (empty string) | 400 | `VALIDATION_FAILED` |
| `symbol=ABC` (not 6 digits) | 4xx | `VALIDATION_FAILED` |
| `symbol=1234567` (7 digits) | 4xx | `VALIDATION_FAILED` |
| `symbol=ABCDEF` (letters) | 4xx | `VALIDATION_FAILED` |
| Valid `market=KR&symbol=123456` | 200 (if provider ready) or provider error | — |
| METHOD=POST | 405 | `METHOD_NOT_ALLOWED` |
| METHOD=DELETE | 405 | `METHOD_NOT_ALLOWED` |
| Extra unknown query params | Should be ignored, no error leakage | — |

---

## 6. Recommended Validation Approach

Validation should proceed in three stages:

### Phase 3AK: No-Network Mock/Harness Validation (Recommended First Step)

**Scope:** Pure-JavaScript or TypeScript unit-style script that stubs the `fetch` global and Supabase client to simulate error conditions. No live KIS calls. No live Supabase queries. No deployed endpoint calls. No Vercel CLI.

**What to implement:**
- A new script (e.g., `scripts/check_kis_error_fallback_paths.mjs`) that:
  - Imports or mirrors the relevant logic from `kisClient.ts` and `quotes.ts` in a test-friendly form.
  - Stubs `fetch` to return controlled mock responses for each provider failure scenario.
  - Stubs the cache layer to return controlled states.
  - Validates `classifyRuntime()` and `getKisQuoteConfigReadiness()` by setting/unsetting `process.env` entries.
  - Applies a forbidden-term scanner to each test output.
  - Records only boolean results and sanitized reason codes.
  - Exits non-zero on any test failure.

**What not to implement:** Any network call, Supabase client, Vercel CLI invocation, or real env var reading.

**Evidence format:** Same pattern as Phase 3AE guard script — boolean pass/fail table, `ForbiddenTermsFoundCount`, exit code.

**Commit type:** `test:` or `feat:` (no-network harness only).

### Phase 3AL: Optional Owner-Run Local Validation (If Needed)

- Only proceed if Phase 3AK mock validation is insufficient to characterize a specific scenario.
- Owner-run only. Claude Code does not call endpoints.
- Sanitized evidence only — boolean checks, no raw response body, no symbol, no price, no token, no URL, no raw KIS field, no raw error, no stack trace.
- Document as a separate result file.

### Phase 3AM: UI Integration Gate Decision

- UI live quote wiring remains blocked until all of the following are true:
  1. Phase 3AK mock error/fallback harness passes all planned scenarios.
  2. Owner explicitly approves UI integration as a separate gate decision.
  3. A UI integration plan document is created and reviewed.
- No UI page (Home, Market, Chart AI, Lab, Portfolio) should be wired to live quote data before this gate is passed.

---

## 7. Evidence Requirements

### Permitted evidence in future result documents

- HTTP status category (e.g., "200", "400", "429") — not raw response body.
- Boolean checks: `HttpStatusIs200`, `JsonParseOk`, `CacheControlNoStore`, `OkTrue`, `OkFalse`, `CodeIs<expected>`, `RawKisFieldsAbsent`, `SecretsTokensRawErrorsAbsent`.
- Sanitized reason: `fallback.state` and `fallback.reason` only if they are normalized `FallbackState` and `QuoteFallbackMetadata.reason` values (not raw KIS fields).
- `ForbiddenTermsFoundCount` — numeric value (should be 0).
- Result: `passed` or `failed` per scenario.
- Mock stub description: what the stub returned (e.g., "HTTP 429 response"), not the content.

### Must never be recorded

| Category | Examples |
|---|---|
| Stock symbol | Any actual 6-digit KR code or other security identifier |
| Price value | Any numeric price from KIS |
| Preview URL | Any Vercel deployment URL |
| KIS credentials | App key, app secret, access token, bearer value |
| Bypass secret | Vercel Deployment Protection bypass secret |
| Supabase credentials | Service-role key, anon key, URL, DB URL, project ref, connection string |
| Raw KIS response fields | `rt_cd`, `msg_cd`, `msg1`, `stck_prpr`, `access_token`, and all other raw vendor field names with their values |
| Raw upstream error body | Any non-normalized error response from KIS or Supabase |
| Stack trace | Any JavaScript or Node.js stack trace |
| Account data | `KIS_ACCOUNT_NO`, trading account number, balance, holdings |

---

## 8. Acceptance Criteria for Phase 3AK

Phase 3AK should be considered passed only if all of the following hold:

1. All planned no-network guard scenarios (Section 5A) pass with correct `reason` codes.
2. All planned env readiness scenarios (Section 5B) pass with correct `reason` codes.
3. All planned provider failure scenarios (Section 5C) pass — error codes match expected values, no raw vendor fields in output.
4. All planned cache fallback scenarios (Section 5D) pass — `fallback.state` and `fallback.reason` are correct for each transition.
5. All planned sanitization scenarios (Section 5E) pass — `ForbiddenTermsFoundCount` is 0 for all test outputs.
6. All planned request validation scenarios (Section 5F) pass — correct HTTP status and `code` for each bad input.
7. No source-visible output (console, response body, log) leaks secrets, symbols, prices, raw KIS fields, raw errors, or stack traces.
8. Result document records only boolean/sanitized evidence.
9. UI live quote wiring remains untouched in all Phase 3AK source changes.
10. `npm run build` passes after Phase 3AK script and harness additions.

---

## 9. Non-Goals

The following are explicitly out of scope for Phase 3AJ and its follow-on phases until separately approved:

- UI live quote integration — any connection of Home, Market, Chart AI, Lab, or Portfolio to live KIS data.
- Trading, account, order, balance, or holdings features.
- Production KIS validation — remains hard-blocked.
- Vercel env mutation — owner-only.
- Deployment — owner-only.
- Live network validation in Phase 3AJ — this document is planning only.
- Schema or migration changes.
- WebSocket or streaming quote connections.
- Non-KR markets (US, GLOBAL) — outside current KIS implementation scope.

---

## 10. Recommended Next Phase

**Phase 3AK (recommended immediate next step):** Implement a no-network mock-based KIS error/fallback validation harness. The harness should be a pure-JS or TypeScript script under `scripts/` that stubs `fetch` and the cache layer, runs all scenarios from Section 5, applies a forbidden-term scanner, and exits non-zero on failure. Record results in a new `phase_3ak_kis_error_fallback_mock_validation_result_v0.1.md` document.

**Phase 3AL (conditional):** If Phase 3AK mock validation is insufficient to characterize a specific behavior (e.g., a scenario that cannot be accurately mocked), Phase 3AL may be planned as an owner-run local validation step with sanitized evidence.

**Phase 3AM (gated):** UI live quote integration gate decision. Requires Phase 3AK pass and explicit owner approval. Must not be entered before both conditions are met.

---

## 11. Confirmed Non-Actions for Phase 3AJ

- No source code (`src/`) was changed in this planning task.
- No scripts (`scripts/`) were changed in this planning task.
- No `package.json` change was made in this planning task.
- No live KIS call was run.
- No live Supabase query or write was run.
- No SQL was executed.
- No Astro dev server was started.
- No Vercel CLI command was run.
- No Vercel environment variable was mutated.
- No deployment occurred.
- No HTTP request was made.
- No `.env*` file contents were read.
- No UI live quote wiring was implemented.
- No actual stock symbol was recorded.
- No price value was recorded.
- No Preview URL was recorded.
- No bypass secret was recorded.
- No secret, token, key, raw KIS field value, raw error, or stack trace was recorded.
- No KIS runtime guard was changed.
- No production KIS enablement was performed or authorized.
