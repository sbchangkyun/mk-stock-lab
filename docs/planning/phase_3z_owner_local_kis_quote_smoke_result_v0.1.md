# Phase 3Z Owner Local KIS Quote Smoke Result v0.1

## 1. Status And Scope

Phase 3Z is documentation-only. It records the owner-provided sanitized result from the Phase 3Y local live KIS quote smoke harness.

The owner manually ran `scripts/owner_smoke_kis_quote_live.mjs` in a local non-production PowerShell shell after privately setting the required KIS runtime environment variables and all five live approval guard flags. The owner provided only the sanitized `phase3y step=... status=... sanitized=true` output lines.

Claude Code did not rerun the live KIS smoke. Claude Code did not call KIS. Claude Code did not read any environment variable values. Claude Code did not call Supabase. Claude Code did not execute SQL. Claude Code did not mutate Vercel environment values. Claude Code did not deploy. UI live quote wiring remains blocked. The production KIS guard in `kisClient.ts` was not changed.

## 2. Baseline Before Phase 3Z

| Item | State |
|---|---|
| Phase 3V persistent quote cache live smoke | Passed |
| Phase 3W–3X readiness and gate plans | Completed |
| Phase 3Y KIS quote smoke harness | Implemented and dry-run validated |
| Local live KIS quote fetch | Not yet validated — this phase |
| Supabase persistent cache write with live KIS quote | Not validated |
| `/api/market/quote` tested against live KIS response | Not validated |
| UI live quote wiring | Blocked |
| Vercel env mutation | Blocked — requires separate approval |
| Deployment | Blocked — requires separate approval |
| Production KIS calls | Blocked by `isProductionRuntime()` guard in `kisClient.ts` |

## 3. Owner-Provided Sanitized Output

The following lines were provided by the owner. No secret values, raw KIS payloads, price values, tokens, keys, project references, or screenshots were provided. Claude Code records these lines verbatim.

```text
phase3y step=guard-check status=started sanitized=true
phase3y step=guard-check status=passed mode=live-approved liveKis=true sanitized=true
phase3y step=runtime-check status=started sanitized=true
phase3y step=runtime-check status=passed note=local-non-production-confirmed sanitized=true
phase3y step=smoke-identity-validation status=started sanitized=true
phase3y step=smoke-identity-validation status=passed sanitized=true
phase3y step=account-env-check status=started sanitized=true
phase3y step=account-env-check status=passed note=account-env-absent-confirmed sanitized=true
phase3y step=kis-env-preflight status=started sanitized=true
phase3y step=kis-env-preflight status=passed note=all-required-kis-config-names-present sanitized=true
phase3y step=runtime-setup status=started sanitized=true
phase3y step=runtime-setup status=passed sanitized=true
phase3y step=provider-import status=started sanitized=true
phase3y step=provider-import status=passed note=live-kis-client-loaded sanitized=true
phase3y step=quote-fetch status=started sanitized=true
phase3y step=quote-fetch status=passed note=live-quote-received sanitized=true
phase3y step=quote-normalization status=started sanitized=true
phase3y step=quote-normalization status=passed hasMarket=true hasSymbol=true hasPrice=true hasCurrency=true hasAsOf=true staleState=fresh sanitized=true
phase3y step=cache-backend-check status=started sanitized=true
phase3y step=cache-backend-check status=passed configuredBackend=supabase note=using-in-process-mock-for-phase-3y-cache-validation sanitized=true
phase3y step=cache-write status=started sanitized=true
phase3y step=cache-write status=passed note=in-process-mock-write sanitized=true
phase3y step=fresh-readback status=started sanitized=true
phase3y step=fresh-readback status=passed state=fresh sanitized=true
phase3y step=cleanup-restore status=started sanitized=true
phase3y step=cleanup-restore status=passed action=deleted-smoke-cache-entry sanitized=true
phase3y step=final-result status=passed mode=live-approved liveKis=true quoteNormalized=true cacheValidated=true sanitized=true
```

The owner did not provide KIS app keys, KIS app secrets, KIS base URL values, KIS account numbers, OAuth tokens, Bearer tokens, raw KIS payload fields, Supabase URLs, Supabase keys, Vercel project identifiers, raw errors, or stack traces.

## 4. Confirmed Passed Steps

All 14 main harness steps passed in sequence:

| Step | Result |
|---|---|
| `guard-check` | Passed — live-approved mode entered (`liveKis=true`) |
| `runtime-check` | Passed — local non-production runtime confirmed |
| `smoke-identity-validation` | Passed — KR market and 6-digit owner-selected symbol accepted |
| `account-env-check` | Passed — `KIS_ACCOUNT_NO` confirmed absent |
| `kis-env-preflight` | Passed — all required KIS config names present (boolean-only evidence) |
| `runtime-setup` | Passed — TypeScript files compiled to isolated temp directory |
| `provider-import` | Passed — live KIS client module loaded (`note=live-kis-client-loaded`) |
| `quote-fetch` | Passed — live quote received (`note=live-quote-received`) |
| `quote-normalization` | Passed — `hasMarket=true hasSymbol=true hasPrice=true hasCurrency=true hasAsOf=true staleState=fresh` |
| `cache-backend-check` | Passed — `configuredBackend=supabase`; in-process mock used for Phase 3Y cache validation |
| `cache-write` | Passed — in-process mock write completed |
| `fresh-readback` | Passed — `state=fresh` from in-process mock readback |
| `cleanup-restore` | Passed — `action=deleted-smoke-cache-entry` from mock cache |
| `final-result` | Passed — `mode=live-approved liveKis=true quoteNormalized=true cacheValidated=true` |

## 5. Result Interpretation

This is the first recorded successful local live KIS quote smoke for the mk-stock-lab project.

**`quote-fetch status=passed note=live-quote-received`** confirms that the Phase 3Y harness successfully called the KIS API, received a quote response, and the `getKisQuoteSnapshot()` function returned `ok: true`. This includes the KIS OAuth token fetch (internal to `getKisQuoteSnapshot`) and the KIS domestic quote price inquiry endpoint. Both network operations succeeded without error in the owner's local non-production runtime.

**`quote-normalization status=passed`** confirms that the KIS API response was correctly normalized into a browser-safe `QuoteSnapshot` with all required fields present and of expected types. The normalization stripped all raw KIS field names (`stck_prpr`, `prdy_vrss`, etc.) and produced only the public fields: `market`, `symbol`, `price` (a finite number), `currency`, `asOf` (ISO string), and `staleState=fresh`. No raw payload was recorded.

**`cache-backend-check configuredBackend=supabase`** notes that the owner's local runtime had `QUOTE_CACHE_BACKEND=supabase` set. However, Phase 3Y harness design uses only an in-process mock cache for cache validation in both dry-run and live mode (as stated explicitly in the step output: `note=using-in-process-mock-for-phase-3y-cache-validation`). The Supabase persistent cache was not written or read in this smoke run. This is a scoped Phase 3Y constraint, not a failure.

**`final-result status=passed mode=live-approved liveKis=true quoteNormalized=true cacheValidated=true`** records the overall local smoke as passed. `cacheValidated=true` refers to the in-process mock cache validation, not Supabase persistent cache.

This pass result provides the evidentiary basis for proceeding to a separate Phase 3AA server-side `/api/market/quote` local endpoint verification phase, subject to separate owner approval.

## 6. What This Confirms

- Local non-production live KIS quote fetch works with the owner's privately set KIS runtime configuration.
- The Phase 3Y harness correctly compiled `kisClient.ts` and its dependencies at runtime.
- The live KIS client module was loadable and callable in the local non-production Node.js runtime.
- KIS OAuth token fetch and domestic quote price inquiry both completed without error (covered by `quote-fetch`).
- The KIS quote response was successfully normalized into a `QuoteSnapshot` with all required public fields.
- The normalized quote result was `staleState=fresh`.
- No account-context environment variable (`KIS_ACCOUNT_NO`) was present during the smoke, confirming read-only scope.
- No account, trading, order, balance, holdings, or WebSocket API was involved.
- The sanitized harness output did not reveal any secret values, raw KIS fields, tokens, or project references.
- In-process mock cache write, readback, and cleanup all passed.
- The harness safely handled the owner's `QUOTE_CACHE_BACKEND=supabase` configuration without attempting a real Supabase write.

## 7. What This Does Not Confirm

- Supabase persistent cache write and readback using a live KIS quote response. The `cache-backend-check` noted `configuredBackend=supabase` but used in-process mock for validation. A future phase can test this path explicitly.
- `/api/market/quote` HTTP endpoint behavior with live KIS backing. The server route, request parsing, response serialization, cache integration, and HTTP status codes have not been tested against a live provider response.
- Vercel Preview environment behavior with live KIS quotes.
- Vercel Production environment behavior — production KIS calls remain blocked by `isProductionRuntime()` and no guard change was made.
- Vercel environment variable presence or mutation.
- Deployment readiness.
- UI live quote wiring. Market, Portfolio, Chart AI, Home, and Lab surfaces remain disconnected from live quote data.
- Portfolio valuation accuracy with live prices.
- Chart AI live market inference.
- KIS rate-limit behavior beyond a single local smoke call (one token request, one quote request).
- Cold-start token cache behavior in a deployed Vercel runtime.
- KIS account, trading, order, balance, holdings, or WebSocket API behavior.
- Behavior under KIS API errors, 429 rate-limit responses, or network failures.

## 8. Safety And Secret-Handling Confirmation

- No KIS app key recorded.
- No KIS app secret recorded.
- No KIS base URL value recorded.
- No KIS account number recorded.
- No OAuth token recorded.
- No Bearer token recorded.
- No raw KIS payload recorded.
- No raw KIS fields (`stck_prpr`, `prdy_vrss`, `prdy_ctrt`, `acml_vol`, `rt_cd`, `output`) recorded.
- No actual price value recorded.
- No Supabase URL or key recorded.
- No Vercel project ID recorded.
- No connection strings recorded.
- No DB passwords recorded.
- No JWT secrets recorded.
- No raw error messages or stack traces recorded.
- No screenshots recorded.
- Owner-provided output was in sanitized `phase3y step=... status=... sanitized=true` format throughout.
- Ignored `.env*` file contents were not read.
- No Vercel environment values were read, printed, pulled, added, updated, or removed.

## 9. Explicit Non-Goals

Phase 3Z did not:

- Rerun `scripts/owner_smoke_kis_quote_live.mjs` in live mode
- Call the KIS OAuth/token endpoint
- Call the KIS quote endpoint
- Run live Supabase query or write
- Execute SQL
- Run Supabase CLI or psql
- Use Supabase MCP database tools
- List Supabase projects
- Touch production DB
- Read ignored `.env*` files
- Read, print, infer, or record any secret values
- Mutate Vercel environment values
- Deploy
- Change `kisClient.ts` production KIS guard
- Allow production KIS calls
- Implement UI live quote wiring
- Connect Market, Portfolio, Chart AI, Home, or Lab to live quote data
- Implement account, order, trading, balance, holdings, or WebSocket APIs
- Implement Portfolio valuation automation or live P&L
- Implement Chart AI live market inference
- Modify root `README.md`
- Modify migration files
- Modify production SQL pack files
- Change any source code or scripts

## 10. Files Changed

- `docs/planning/phase_3z_owner_local_kis_quote_smoke_result_v0.1.md`
- `docs/planning/planning_changelog.md`
- `docs/planning/phase_3c1_portfolio_manual_smoke_checklist_v0.1.md`

No source code was changed. No scripts were changed. No `package.json` changes. No `kisClient.ts` changes.

## 11. Validation / Build Status

Documentation-only phase. No source code changes. Build skipped. `git status --short` confirms only the three documentation files changed.

## 12. Remaining Risks

- **Supabase persistent cache path with live KIS data not validated.** The owner's local runtime had `QUOTE_CACHE_BACKEND=supabase`, but the Phase 3Y harness used in-process mock cache. A future phase can test live KIS quote → Supabase persistent cache → readback if needed.
- **`/api/market/quote` HTTP endpoint not validated with live KIS.** The server route, request validation, serialization, and HTTP status codes must be tested separately before any UI surface is connected.
- **Production KIS gate unchanged.** Production live KIS quotes remain blocked regardless of env var values until a separate approved code change is made.
- **Single smoke call.** One token request and one quote request were made. KIS rate-limit behavior under repeated calls, high concurrency, or near-quota conditions is unknown.
- **Cold-start token cache reset.** In a deployed runtime, the in-memory `accessTokenCache` in `kisClient.ts` resets on each cold start, causing a fresh token request per cold start.
- **No fallback behavior tested.** If KIS returns a 429, a non-`0` `rt_cd`, or a missing price field, the `getKisQuoteSnapshot` error paths return safe `ProviderErrorEnvelope` responses. This behavior was not exercised in the Phase 3Z smoke.

## 13. Recommended Next Action

Owner reviews this result. If approved, start **Phase 3AA** — a local server-side `/api/market/quote` endpoint verification plan or owner-run local HTTP smoke that tests the full server route response shape with live KIS backing. This phase should:

1. Plan or implement a harness or owner manual HTTP call that sends `GET /api/market/quote?market=KR&symbol=XXXXXX` to a local running Astro server with KIS env vars set.
2. Record only the sanitized response shape: presence of `ok`, `data`, `fallback`; absence of raw KIS fields, tokens, keys, account data, raw errors; `Cache-Control: no-store` header.
3. Not wire any browser UI component.
4. Not mutate Vercel env.
5. Not deploy.
6. Separately approve the production gate decision (Option A/B/C from Phase 3X) before any Vercel env or deployment change.

## 14. Minimal Korean Owner Review Checklist

```text
Phase 3Z Owner Local KIS Quote Smoke Result 기록 결과:

* owner manual local KIS quote smoke 성공 결과가 문서화됨: 통과/실패
* sanitized `phase3y` output만 기록됨: 통과/실패
* live-approved mode 통과가 기록됨: 통과/실패
* local non-production runtime 통과가 기록됨: 통과/실패
* `KIS_ACCOUNT_NO` 부재 확인이 기록됨: 통과/실패
* KIS env name presence 확인이 값 노출 없이 기록됨: 통과/실패
* provider-import 통과가 기록됨: 통과/실패
* live KIS quote fetch 통과가 기록됨: 통과/실패
* quote-normalization 통과가 기록됨: 통과/실패
* in-process mock cache write/readback/cleanup 통과가 기록됨: 통과/실패
* Supabase persistent cache live write/readback은 아직 미검증으로 기록됨: 통과/실패
* `/api/market/quote` live endpoint는 아직 미검증으로 기록됨: 통과/실패
* UI live quote wiring이 계속 차단됨: 통과/실패
* production KIS guard가 변경되지 않음: 통과/실패
* Claude Code가 live KIS call을 실행하지 않음: 통과/실패
* Claude Code가 live Supabase query/write를 실행하지 않음: 통과/실패
* Claude Code가 SQL/Supabase MCP DB query/project listing을 실행하지 않음: 통과/실패
* production DB가 Claude Code에 의해 접근/변경되지 않음: 통과/실패
* `.env*` 파일 내용이 읽히지 않음: 통과/실패
* Vercel env 변경 및 deployment가 없음: 통과/실패
* project ref/URL/key/token/connection string/screenshot/raw error/stack trace가 기록되지 않음: 통과/실패
* 다음 단계가 별도 local `/api/market/quote` endpoint verification phase임: 통과/실패
* 비밀 정보 없는 메모:
```
