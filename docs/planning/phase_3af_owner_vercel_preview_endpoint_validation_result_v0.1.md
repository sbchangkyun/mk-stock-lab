# Phase 3AF Owner-Run Vercel Preview Endpoint Validation Result v0.1

## 1. Title And Metadata

- **Phase**: 3AF
- **Type**: Owner-run Vercel Preview endpoint validation result
- **Status**: Passed
- **Execution mode**: Owner-run Vercel Preview
- **Claude Code live execution**: Not performed — Claude Code did not call the Preview endpoint, run live KIS calls, mutate Vercel env, or deploy
- **Vercel env mutation by Claude Code**: Not performed
- **Deployment by Claude Code**: Not performed
- **Preview endpoint call by Claude Code**: Not performed
- **Previous owner-run plan**: `docs/planning/phase_3af_vercel_preview_env_deployment_endpoint_validation_owner_run_plan_v0.1.md`
- **Previous implementation phase**: Phase 3AE — Preview-safe KIS runtime guard
- **Date**: 2026-06-22

---

## 2. Objective

This document records the sanitized result of the owner-run validation of the `/api/market/quote` endpoint deployed to a Vercel Preview environment, using the Phase 3AE Preview-safe KIS runtime guard.

The validation verified that:
1. The Vercel Preview deployed function can receive and process a `/api/market/quote?market=KR&symbol=<REDACTED>` request.
2. The Phase 3AE `classifyRuntime()` guard correctly allows live KIS in the `vercel-preview` runtime class when `KIS_ENABLE_PREVIEW_LIVE_QUOTES=true` is present.
3. The response shape matches the locally validated `Phase 3AA` shape: `{ ok: true, data: {...}, fallback: {...} }`.
4. `Cache-Control: no-store` is present in the Preview response header.
5. No raw KIS fields, secrets, tokens, raw errors, stack traces, or price values were recorded.

---

## 3. Owner-Run Execution Summary

- The owner configured Vercel environment variables outside Claude Code, via the Vercel dashboard.
- Production and Preview env scopes were both used as an owner-approved exception (see Section 6).
- Deployment Protection bypass was used with an owner-provided secret. The bypass secret was not recorded.
- The endpoint was validated against a Vercel Preview deployment.
- The actual Preview deployment URL was not recorded.
- The actual stock symbol was redacted before documentation. Owner-provided chat evidence included the symbol in the request path; only `<REDACTED_6_DIGIT_KR_CODE>` is recorded here.
- No price value was recorded at any stage.
- No raw JSON response body was recorded.

---

## 4. Sanitized Evidence

The following evidence was provided by the owner after running the Phase 3AF PowerShell sanitized check template against the Vercel Preview deployment. All values are boolean or redacted.

| Evidence Field | Value |
|---|---|
| Execution type | Owner-run Vercel Preview endpoint validation |
| Vercel environment | Preview |
| Production env touched | yes — owner-approved exception (see Section 6) |
| Environment scope note | Production and Preview scopes used as owner-approved exception |
| Production live KIS status | Remains blocked by Phase 3AE runtime guard (`VERCEL_ENV=production` hard block) |
| Deployment Protection bypass used | yes — owner-provided bypass secret, not recorded |
| Request path (redacted) | `/api/market/quote?market=KR&symbol=<REDACTED_6_DIGIT_KR_CODE>` |
| HTTP status | 200 |
| `HttpStatusIs200` | True |
| `JsonParseOk` | True |
| `CacheControlNoStore` | True |
| `OkTrue` | True |
| `DataObjectPresent` | True |
| `FallbackObjectPresent` | True |
| `DataHasMarket` | True |
| `DataHasSymbol` | True |
| `DataHasPrice` | True |
| `DataHasCurrency` | True |
| `DataHasAsOf` | True |
| `FallbackHasState` | True |
| `FallbackHasReason` | True |
| `RawKisFieldsAbsent` | True |
| `ForbiddenTermsFoundCount` | 0 |
| `SecretsTokensRawErrorsAbsent` | True |
| Actual symbol exposed in recorded documentation | no — redacted before recording |
| Price value exposed in recorded documentation | no |
| Secret/token/URL value exposed in recorded documentation | no |
| Bypass secret recorded | no |
| Result | passed |

---

## 5. Success Criteria Assessment

All success criteria defined in Phase 3AF Section 10 passed.

| Criterion | Status |
|---|---|
| Vercel Preview endpoint returned HTTP 200 | Passed |
| Response parsed as JSON | Passed |
| `Cache-Control` included `no-store` | Passed |
| Body had `ok: true` | Passed |
| Body had `data` object | Passed |
| Body had `fallback` object | Passed |
| `data` had `market`, `symbol`, `price`, `currency`, and `asOf` fields | Passed |
| `fallback` had `state` and `reason` fields | Passed |
| Raw KIS fields were absent from response | Passed |
| Forbidden term count was 0 | Passed |
| Secrets, tokens, raw errors, and stack traces were absent | Passed |
| Actual stock symbol was redacted before recording | Passed |
| Price value was not recorded | Passed |
| Deployment Protection bypass secret was not recorded | Passed |

All 14 success criteria passed.

---

## 6. Important Exception Record

### Owner-Approved Environment Scope Exception

The original Phase 3AF plan (Section 6) specified that env vars should be scoped to **Vercel Preview only**, with Production scope untouched. The owner explicitly approved an exception:

- **What happened**: The owner configured env vars in both Production and Preview scopes.
- **Owner approval status**: Explicitly approved by the owner before execution.
- **Production live KIS status**: Production remains blocked by the `VERCEL_ENV=production` hard block in `getKisQuoteConfigReadiness()` (`kisClient.ts`). The Phase 3AE `classifyRuntime()` function returns `vercel-production` for Production deployments, which triggers the unconditional `production_not_allowed` block regardless of which env vars are set in the Production scope. Production KIS live calls cannot occur due to the guard.
- **Implication**: Even though KIS credential env vars may now exist in Production scope, the guard prevents any live KIS call in a Production deployment.
- **This exception does not authorize**: Production endpoint validation, Production KIS enablement, or any bypass of the Production hard block.
- **Recommended future action**: A scope cleanup step is recommended to remove KIS credential env vars from Production scope, reducing the risk surface. This is not required immediately but is good practice.

---

## 7. Technical Conclusion

**Phase 3AF validates that the Vercel Preview deployment can serve the `/api/market/quote` endpoint with live KIS backing using the Phase 3AE Preview-safe runtime guard, while all response evidence remains sanitized.**

This is the first recorded validation of the complete Vercel-deployed quote path:

```
Vercel Preview deployed function
  → GET /api/market/quote?market=KR&symbol=<REDACTED>
  → classifyRuntime() → vercel-preview
  → KIS_ENABLE_PREVIEW_LIVE_QUOTES=true → Preview guard passes
  → getKisQuoteConfigReadiness() → ready
  → KIS token fetch → KIS domestic quote fetch
  → QuoteSnapshot normalization
  → (Supabase cache write, if configured)
  → { ok: true, data: {...}, fallback: {...} }
  → HTTP 200 + Cache-Control: no-store
  → Forbidden term scan: 0 matches
```

**Production KIS is not validated and remains blocked.** The `VERCEL_ENV=production` hard block in the Phase 3AE guard prevents any live KIS call in a Production deployment, regardless of which env vars are present in Production scope.

---

## 8. Confirmed Non-Actions

- Claude Code did not run the Preview endpoint call.
- Claude Code did not run live KIS calls.
- Claude Code did not run live Supabase queries or writes.
- Claude Code did not execute SQL.
- Claude Code did not start an Astro dev server.
- Claude Code did not run any Vercel CLI command.
- Claude Code did not mutate any Vercel environment variable.
- Claude Code did not deploy.
- Claude Code did not read any `.env*` file contents.
- No source code (`src/`) was changed in this result-recording task.
- No script (`scripts/`) was changed in this result-recording task.
- No `package.json` change was made in this result-recording task.
- No KIS runtime guard was changed in this result-recording task.
- No UI live quote wiring was implemented.
- No actual stock symbol was recorded.
- No price value was recorded.
- No Preview deployment URL was recorded.
- No Deployment Protection bypass secret was recorded.
- No secret, token, key, raw KIS field value, account data, raw error, stack trace, Supabase URL, project ref, service-role key, anon key, or connection string was recorded.

---

## 9. Remaining Limitations

- **Production endpoint behavior** — not validated and remains blocked. The `VERCEL_ENV=production` hard block prevents any live KIS call in Production deployments.
- **Production KIS enablement** — permanently blocked until a separate explicit owner approval and guard change.
- **UI live quote wiring** — Market, Portfolio, Chart AI, Home, and Lab pages remain disconnected from live quote data.
- **KIS error/fallback paths** — 429 rate-limit, non-`0` `rt_cd`, missing price field, and network failure responses from KIS have not been exercised in a Vercel Preview environment.
- **KIS rate-limit behavior** — not stress-tested under sustained load or near-quota conditions.
- **Vercel cold-start token cache behavior** — the in-memory `accessTokenCache` resets on each function cold start; this behavior has not been separately characterized.
- **Env scope exception** — Production and Preview env scopes were both used. A future scope cleanup step to remove KIS credential env vars from Production scope is recommended (see Section 6).
- **Single test request** — only one request was validated; repeated-call and cache-hit behavior in Vercel Preview is uncharacterized.

---

## 10. Recommended Next Steps

| Option | Description |
|---|---|
| **Option 1** | Treat Phase 3AF as complete and record it as validated. Proceed to planning the next phase. |
| **Option 2** | Tighten Vercel env scope: remove KIS credential env vars from Production scope and re-validate Preview. Record cleanup evidence. |
| **Option 3** | Plan KIS error/fallback path validation in Vercel Preview (429 rate-limit, non-`0` `rt_cd`, network failure). |
| **Option 4** | Plan UI layout refinement as a separate task (pages, components, routing) independent of live quote wiring. |
| **Option 5** | Keep UI live quote wiring blocked until the owner explicitly approves a UI integration phase with a separate gate decision. |

**Regardless of which option is chosen next:**
- Production KIS must remain blocked until a separate explicit owner approval and implementation phase.
- UI live quote wiring must remain blocked until the owner explicitly approves a UI integration phase.
