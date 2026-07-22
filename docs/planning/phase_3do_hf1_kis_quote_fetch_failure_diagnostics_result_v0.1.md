# Phase 3DO-HF1 — KIS Quote Fetch Failure Diagnostics: Result

## 1. Metadata

| Field | Value |
|-------|-------|
| Phase | 3DO-HF1 |
| Type | KIS Quote Fetch Failure Diagnostics |
| Status | **Completed — diagnostic rerun PASS** |
| Latest prior commit | `bb34f9d` (docs: prepare kr quote preview expansion plan) |
| Canonical production URL | `https://mkstocklab.vercel.app` |
| Runtime UI changes | None |
| API route changes | None |
| DB / Supabase schema changes | None |
| Live KIS calls by Claude Code | None |
| Live KIS calls by owner | Completed — `069500` rerun PASS |
| Live FX calls | None |
| Live GNews calls | None |
| AI provider calls | None |
| External data fetch by Claude Code | None |
| Vercel production deployment | Not performed |

---

## 2. Background

Phase 3DO expanded the owner-run KIS quote smoke to three KR symbols. Owner execution results:

| Symbol | Type | Result |
|--------|------|--------|
| `005930` | KR stock | PASS |
| `000660` | KR stock | PASS (after retry) |
| `069500` | KR ETF | FAIL — `quote-fetch` step |

The `069500` failure at `quote-fetch` emitted only `code=QUOTE_FETCH_FAILED`, which is too generic to diagnose:
- It does not distinguish rate limiting from auth failure from unsupported symbol from provider unavailability.
- Without a specific code, the owner cannot determine whether to retry, fix credentials, wait for quota reset, or escalate to a code fix.

This hotfix improves safe diagnostic classification in the owner smoke script.

---

## 3. Change Summary

**File modified:** `scripts/owner_smoke_kis_quote_live.mjs`

Added `classifyQuoteFetchFailure(result)` helper function (pure, no network, no env reads). It maps the structured safe error code already present on the provider result object to one of the allowed safe diagnostic output codes:

| Provider code | Safe diagnostic output code |
|--------------|---------------------------|
| `PROVIDER_RATE_LIMITED` | `PROVIDER_RATE_LIMITED` |
| `PROVIDER_UNAVAILABLE` | `PROVIDER_UNAVAILABLE` |
| `AUTH_REQUIRED` | `AUTH_REQUIRED` |
| `CONFIG_MISSING` | `KIS_CONFIG_MISSING` |
| `SYMBOL_UNSUPPORTED` | `SYMBOL_UNSUPPORTED` |
| `VALIDATION_FAILED` | `PROVIDER_RESPONSE_UNEXPECTED` |
| `CACHE_MISS` | `PROVIDER_RESPONSE_UNEXPECTED` |
| `DATA_STALE` | `PROVIDER_RESPONSE_UNEXPECTED` |
| `INTERNAL_ERROR` | `QUOTE_FETCH_FAILED_UNKNOWN` |
| `NOT_IMPLEMENTED` | `QUOTE_FETCH_FAILED_UNKNOWN` |
| anything else or exception | `QUOTE_FETCH_FAILED_UNKNOWN` |

The `!quoteResult.ok` path now calls `classifyQuoteFetchFailure(quoteResult)` and emits the specific code.
The `catch` path (exception thrown) now emits `QUOTE_FETCH_FAILED_UNKNOWN`.

No other behavior was changed. PASS path is unchanged. Dry-run is unchanged. Sanitizer is unchanged.

**No changes to:**
- Provider implementation (`kisClient.ts`)
- API routes
- UI components
- Portfolio valuation logic
- Supabase / DB

---

## 4. Diagnostic Code Policy

Allowed safe output codes and their meanings:

| Code | Meaning |
|------|---------|
| `PROVIDER_RATE_LIMITED` | KIS returned a rate limit response (HTTP 429) |
| `PROVIDER_UNAVAILABLE` | KIS endpoint unreachable, returned non-OK response, or response was not usable |
| `AUTH_REQUIRED` | KIS token request returned an auth failure |
| `KIS_CONFIG_MISSING` | Required KIS env vars present by name but provider config was not ready |
| `SYMBOL_UNSUPPORTED` | Provider rejected the symbol as unsupported (e.g. ETF code not supported via domestic endpoint) |
| `PROVIDER_RESPONSE_UNEXPECTED` | Provider returned a structured result code that was not expected at this stage (e.g. VALIDATION_FAILED after identity already passed) |
| `SAFE_OUTPUT_BLOCKED` | The script's own sanitizer blocked a line containing a forbidden pattern |
| `QUOTE_FETCH_FAILED_UNKNOWN` | Exception thrown, or provider code not recognized — safe fallback |

No raw error messages, raw HTTP status text, raw KIS JSON, stack traces, request URLs, token values, or provider field names are exposed in any code.

---

## 5. Owner Rerun Instruction

The owner should rerun only `069500` with the same KIS credentials and guard vars as Phase 3DO.

**Required env (names only — never share values):**
- `KIS_APP_KEY`, `KIS_APP_SECRET`, `KIS_BASE_URL`, `KIS_ENABLE_LIVE_QUOTES`
- All five `PHASE_3Y_*` guard vars (same values as Phase 3DO)
- `KIS_ACCOUNT_NO` must be absent
- `PHASE_3Y_SMOKE_MARKET=KR`
- `PHASE_3Y_SMOKE_SYMBOL=069500`

**Command:**
```powershell
$env:PHASE_3Y_SMOKE_MARKET = "KR"
$env:PHASE_3Y_SMOKE_SYMBOL = "069500"
npm run smoke:kis-quote-live:dry
```

**Expected improvement:** Instead of `code=QUOTE_FETCH_FAILED`, the owner will now receive one of the specific safe diagnostic codes listed in §4.

**Share only:**
- The `step=quote-fetch status=failed code=<SPECIFIC_CODE> sanitized=true` line
- Whether `sanitized=true` appeared on all lines
- Whether `SAFE_OUTPUT_BLOCKED` appeared

Do NOT share:
- Raw error messages or stack traces
- HTTP status text containing provider details
- Raw KIS JSON or response body
- Token, account number, API key or secret values
- Raw provider field names (`stck_`, `prdy_`, `rt_cd`, `acml_`, etc.)

---

## 6. Owner Rerun Result — `069500`

After HF1 was applied, the owner reran only `069500` with `PHASE_3Y_SMOKE_MARKET=KR` and `PHASE_3Y_SMOKE_SYMBOL=069500`.

| Field | Value |
|-------|-------|
| Symbol | `069500` |
| Market | `KR` |
| Type | KR ETF |
| quote-fetch | PASS — `live-quote-received` |
| quote-normalization | PASS |
| staleState | `fresh` |
| cache-write | PASS |
| fresh-readback | PASS |
| final-result | PASS |
| liveKis | `true` |
| quoteNormalized | `true` |
| cacheValidated | `true` |
| sanitized | `true` on all output lines |
| secretsShared | false |
| rawPayloadShared | false |
| accountNumberShared | false |
| rawKISFieldValuesShared | false |

The rerun passed directly without triggering any of the new diagnostic codes. The HF1 diagnostic classification was not needed to identify a failure because the rerun succeeded. The classification remains in place for any future failures.

---

## 7. Validation Results

| Command | Result |
|---------|--------|
| `npm run check:kis-quote-fetch-diagnostics` | PASS (see checker run) |
| `npm run check:kr-quote-preview-plan` | PASS |
| `npm run check:kis-single-quote-preview` | PASS |
| `npm run check:kis-fx-mocked-adapter` | PASS |
| `npm run check:kis-fx-preview-smoke-plan` | PASS |
| `npm run check:kis-valuation-design` | PASS |
| `npm run check:kis-quote-adapter-mocked` | PASS |
| `npm run build` | PASS |
| `git diff --check` | PASS |

---

## 8. Known Limitations

- This hotfix does not fix ETF quote retrieval if `SYMBOL_UNSUPPORTED` is returned — that would require a separate KIS endpoint or symbol type decision.
- If `069500` receives `SYMBOL_UNSUPPORTED`, it means the KIS domestic quote endpoint does not support this ETF code through the current API path, and a separate Phase 3DQ investigation is needed.
- `005930` PASS and `000660` PASS results from Phase 3DO are not re-recorded here; they remain in the Phase 3DO result doc.
- This hotfix does not enable API live mode.
- Production UI remains fixture/static.
- Real FX provider remains unimplemented.
- US quote endpoint remains unimplemented.
- `source=fixture` remains the only accepted API source.
- `source=live` returns 400 `UNSUPPORTED_SOURCE`.
- `source=auto` remains deferred.

---

## 9. Recommended Next Phase

The `069500` rerun passed. Phase 3DO-CLOSEOUT has been completed, recording all three KR expansion symbol results.

**Phase 3DP — Portfolio Live Preview API Contract Implementation**

- All three KR expansion targets (two KR stocks, one KR ETF) confirmed via live owner smoke.
- Proceed to implement `source=live` + `previewMode=owner` + `allowLiveQuotes=true` gate in `POST /api/portfolio/valuation`.
- The HF1 diagnostic code policy remains in place for future use.
