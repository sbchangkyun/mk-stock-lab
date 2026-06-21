# Phase 3Y Local KIS Quote Smoke Harness Result v0.1

## 1. Status And Scope

Phase 3Y implemented a fail-closed, owner-run, local-only KIS quote smoke harness (`scripts/owner_smoke_kis_quote_live.mjs`). The harness was dry-run/mock validated by Claude Code. No live KIS call was made by Claude Code. The harness is ready for the owner to run manually in a local non-production shell after privately setting the required runtime environment variables and approval guards.

UI live quote wiring remains blocked. Vercel env mutation remains blocked. Deployment remains blocked. The production KIS runtime guard in `kisClient.ts` was not changed.

## 2. Baseline Before Phase 3Y

| Item | State |
|---|---|
| Phase 3V persistent quote cache live smoke | Passed |
| Phase 3W controlled live quote readiness plan | Completed |
| Phase 3X Vercel env readiness and KIS gate plan | Completed |
| KIS live provider end-to-end flow validated | No |
| `/api/market/quote` tested against live KIS response | No |
| UI live quote wiring | Blocked |
| Vercel env mutation | Blocked — requires separate approval |
| Deployment | Blocked — requires separate approval |
| Production KIS calls | Blocked by `isProductionRuntime()` guard in `kisClient.ts` |
| Local KIS smoke harness | Not yet implemented — this phase |

## 3. Files Changed

| File | Change |
|---|---|
| `scripts/owner_smoke_kis_quote_live.mjs` | Created — Phase 3Y KIS quote smoke harness |
| `package.json` | Added `smoke:kis-quote-live:dry` script |
| `docs/planning/phase_3y_local_kis_quote_smoke_harness_result_v0.1.md` | Created — this document |
| `docs/planning/planning_changelog.md` | Phase 3Y entry prepended |
| `docs/planning/phase_3c1_portfolio_manual_smoke_checklist_v0.1.md` | Phase 3Y Korean owner review checklist prepended |

No source code changes. `kisClient.ts` was not modified. The production KIS guard was not changed.

## 4. Harness Design

The harness in `scripts/owner_smoke_kis_quote_live.mjs` is modeled after the Phase 3S/3U persistent quote cache smoke harness.

**Default mode:** dry-run/mock. Runs without any KIS credentials or live approval guards. Uses a synthetic normalized `QuoteSnapshot` and an in-process mock cache. Emits all expected step labels. Produces all dry-run simulation results. Exits with code 0.

**Live mode:** activated only when all five approval guard environment variables are set to exact required values (see Section 5). Requires a local non-production runtime. Requires `KIS_ACCOUNT_NO` to be absent. Requires `KIS_APP_KEY`, `KIS_APP_SECRET`, `KIS_BASE_URL`, `KIS_ENABLE_LIVE_QUOTES` to be present (boolean presence only — values are never read, printed, or stored). Compiles `kisClient.ts` and its dependencies to an isolated temp directory using `ts.transpileModule`. Imports the compiled module and calls `getKisQuoteSnapshot()`. Validates the normalized `QuoteSnapshot` output.

**TypeScript compilation:** same infrastructure as Phase 3U harness. Source files are compiled to an isolated `.astro/phase3y-smoke-*/out/` directory using `ts.transpileModule`. The temp directory is deleted in the `finally` block.

**In dry-run mode:** the KIS provider entry point is replaced with a stub file that exports only no-op functions. No code from `kisClient.ts` that could trigger network calls or env value access is loaded.

**In-process mock cache:** both dry-run and live mode use a simple in-process `Map` for the cache-write, fresh-readback, and cleanup-restore steps. Supabase persistent cache integration was validated in Phase 3V. Phase 3Y focuses on KIS quote fetch and normalization.

**Output sanitizer:** every output line passes through `logSafe()` which tests against a forbidden pattern covering KIS credentials, OAuth tokens, authorization headers, account numbers, Supabase secrets, raw KIS field names (`stck_prpr`, `prdy_vrss`, `prdy_ctrt`, `acml_vol`, `rt_cd`), connection strings, project refs, passwords, stack traces, and `raw`. If a match is found, `SAFE_OUTPUT_BLOCKED` is emitted and execution halts.

## 5. Live Guard Policy

All five guards must be present with exact values before live KIS mode activates. If any guard is missing or incorrect, the harness runs in dry-run/mock mode and makes no KIS API calls.

| Environment Variable | Required Value |
|---|---|
| `PHASE_3Y_LIVE_KIS_SMOKE` | `OWNER_APPROVED` |
| `PHASE_3Y_RUNTIME_CONFIRMED` | `local-non-production-confirmed` |
| `PHASE_3Y_READ_ONLY_SCOPE_CONFIRMED` | `OWNER_CONFIRMS_READ_ONLY_QUOTE_ONLY` |
| `PHASE_3Y_PROVIDER_QUOTA_RISK_ACCEPTED` | `OWNER_ACCEPTS_KIS_QUOTA_RISK` |
| `PHASE_3Y_NO_ACCOUNT_APIS_CONFIRMED` | `OWNER_CONFIRMS_NO_ACCOUNT_APIS` |

Plus identity variables (required in live mode; synthetic fallback is used in dry-run):

| Environment Variable | Expected Value |
|---|---|
| `PHASE_3Y_SMOKE_MARKET` | `KR` |
| `PHASE_3Y_SMOKE_SYMBOL` | Owner-selected 6-digit KR stock code |

## 6. Local Runtime Policy

The harness enforces that live KIS calls may only happen in a local non-production shell.

- If `NODE_ENV=production` or `VERCEL_ENV=production`, the `runtime-check` step fails immediately with `PRODUCTION_RUNTIME_NOT_ALLOWED` before any KIS module is loaded or called.
- The harness does not alter `NODE_ENV` or `VERCEL_ENV`.
- The compiled `kisClient.ts` also has its own `isProductionRuntime()` guard that independently blocks KIS calls in production — defense-in-depth.
- The owner must confirm the local shell has `NODE_ENV` and `VERCEL_ENV` not set to `production` before running live mode.

## 7. KIS Env Preflight Policy

The `kis-env-preflight` step checks only whether the four required KIS env names are present (truthy) in `process.env`. It never reads, prints, compares, hashes, truncates, or stores any env value.

Required KIS config names checked for presence only:
- `KIS_APP_KEY`
- `KIS_APP_SECRET`
- `KIS_BASE_URL`
- `KIS_ENABLE_LIVE_QUOTES`

If any name is absent, the step fails with `KIS_CONFIG_MISSING` and exits before any KIS module is imported or any network call is attempted.

## 8. Account Env Exclusion Policy

The `account-env-check` step checks that `KIS_ACCOUNT_NO` is absent from `process.env`.

If `KIS_ACCOUNT_NO` is present in live mode, the step fails with `ACCOUNT_ENV_NOT_ALLOWED` and exits before any KIS call. This enforces that Phase 3Y is read-only quote scope only. Account numbers must not be set during quote-only smoke phases. `KIS_ACCOUNT_NO` must remain unset until a separate account-context phase is explicitly approved.

## 9. Sanitized Step Labels And Failure Codes

All output uses prefix `phase3y`. Format: `phase3y step=<step-name> status=<started|passed|failed> [key=value ...] sanitized=true`.

### Step Sequence

| Step | Description |
|---|---|
| `guard-check` | Checks all five live approval guard flags |
| `runtime-check` | Confirms local non-production runtime in live mode |
| `smoke-identity-validation` | Validates `PHASE_3Y_SMOKE_MARKET=KR` and `PHASE_3Y_SMOKE_SYMBOL` is 6 digits |
| `account-env-check` | Confirms `KIS_ACCOUNT_NO` is absent |
| `kis-env-preflight` | Confirms all four KIS config names are present (boolean only) |
| `runtime-setup` | Compiles TypeScript to isolated temp directory |
| `provider-import` | Imports compiled KIS provider module (or stub in dry-run) |
| `quote-fetch` | Calls live `getKisQuoteSnapshot()` or returns synthetic snapshot in dry-run |
| `quote-normalization` | Verifies normalized `QuoteSnapshot` field presence, types, and absence of raw provider fields |
| `cache-backend-check` | Notes configured cache backend; uses in-process mock for Phase 3Y |
| `cache-write` | Writes snapshot to in-process mock cache |
| `fresh-readback` | Reads back from mock cache and verifies `state=fresh` |
| `cleanup-restore` | Deletes smoke cache entry from mock cache |
| `final-result` | Summary of overall smoke result |
| `dry-run-guard-sim` | Confirms live guards are absent in dry-run |
| `dry-run-runtime-sim` | Confirms production runtime check is functional |
| `dry-run-env-sim` | Confirms KIS config names are absent in dry-run env |
| `dry-run-identity-sim` | Confirms invalid identity is rejected |
| `dry-run-account-env-sim` | Confirms account env check passes when `KIS_ACCOUNT_NO` is absent |

Note: KIS token fetch and quote fetch are both covered by the `quote-fetch` step. They are sequential within `getKisQuoteSnapshot()` and are not split into separate steps to avoid refactoring provider internals.

### Safe Failure Codes

| Code | Step |
|---|---|
| `GUARD_NOT_APPROVED` | (dry-run simulation only — harness simply does not enter live mode) |
| `PRODUCTION_RUNTIME_NOT_ALLOWED` | `runtime-check` |
| `SMOKE_IDENTITY_INVALID` | `smoke-identity-validation` |
| `ACCOUNT_ENV_NOT_ALLOWED` | `account-env-check` |
| `KIS_CONFIG_MISSING` | `kis-env-preflight` |
| `RUNTIME_SETUP_FAILED` | `runtime-setup` |
| `PROVIDER_IMPORT_FAILED` | `provider-import` |
| `QUOTE_FETCH_FAILED` | `quote-fetch` |
| `QUOTE_NORMALIZATION_FAILED` | `quote-normalization` |
| `CACHE_BACKEND_NOT_READY` | (reserved for future Supabase cache path) |
| `CACHE_WRITE_FAILED` | `cache-write` |
| `FRESH_READBACK_FAILED` | `fresh-readback` |
| `CLEANUP_RESTORE_FAILED` | `cleanup-restore` |
| `SAFE_OUTPUT_BLOCKED` | `safe-output-guard` (any step) |
| `UNEXPECTED_SAFE_FAILURE` | `unexpected-catch` (last-resort top-level catch only) |

## 10. Dry-Run / Mock Validation Behavior

The dry-run validates that:

1. All 14 main step labels appear in the expected sequence.
2. All 5 dry-run simulation steps appear after `final-result`.
3. The guard simulation confirms `wouldEmitGuardNotApproved=true` (live guards absent in dry-run, as expected).
4. The runtime simulation confirms `currentRuntimeIsProduction=false` (local dev shell, as expected) and `wouldBlockIfProduction=true`.
5. The env simulation confirms `wouldEmitKisConfigMissing=true` (KIS names absent in dry-run env, as expected).
6. The identity simulation confirms `errorDetected=true` (invalid market/symbol rejected).
7. The account env simulation confirms `accountEnvCurrentlyAbsent=true` (no `KIS_ACCOUNT_NO` in dry-run) and `wouldBlockIfAccountEnvPresent=true`.
8. The synthetic quote snapshot passes normalization check: all required fields present, correct types, `staleState=fresh`, no raw provider fields.
9. The mock cache write, fresh readback, and cleanup all pass.
10. The output sanitizer does not block any dry-run output line.
11. Exit code 0.

Dry-run does not import any live KIS code. It does not call any KIS endpoint. It does not access any Supabase. It does not read any `.env*` file.

## 11. Future Owner Live Run Instructions

**Prerequisites before running live mode:**

1. Confirm the shell is local and non-production (`NODE_ENV` and `VERCEL_ENV` are not set to `production`).
2. Confirm `KIS_ACCOUNT_NO` is NOT set in the shell.
3. Set `KIS_APP_KEY`, `KIS_APP_SECRET`, `KIS_BASE_URL`, `KIS_ENABLE_LIVE_QUOTES=true` privately. Do not paste values into chat, email, or any document.
4. Select a valid KR 6-digit stock symbol for the smoke key.
5. Understand that KIS token requests and quote requests count against KIS API quota and daily rate limits.
6. Confirm only read-only price inquiry endpoints are called — no trading, no orders, no account reads.

**PowerShell command shape (placeholder values only — owner must supply real values privately):**

```powershell
$env:KIS_APP_KEY="OWNER_PRIVATE_VALUE"
$env:KIS_APP_SECRET="OWNER_PRIVATE_VALUE"
$env:KIS_BASE_URL="OWNER_PRIVATE_VALUE"
$env:KIS_ENABLE_LIVE_QUOTES="true"

$env:PHASE_3Y_LIVE_KIS_SMOKE="OWNER_APPROVED"
$env:PHASE_3Y_RUNTIME_CONFIRMED="local-non-production-confirmed"
$env:PHASE_3Y_READ_ONLY_SCOPE_CONFIRMED="OWNER_CONFIRMS_READ_ONLY_QUOTE_ONLY"
$env:PHASE_3Y_PROVIDER_QUOTA_RISK_ACCEPTED="OWNER_ACCEPTS_KIS_QUOTA_RISK"
$env:PHASE_3Y_NO_ACCOUNT_APIS_CONFIRMED="OWNER_CONFIRMS_NO_ACCOUNT_APIS"
$env:PHASE_3Y_SMOKE_MARKET="KR"
$env:PHASE_3Y_SMOKE_SYMBOL="005930"

node .\scripts\owner_smoke_kis_quote_live.mjs
```

Replace `OWNER_PRIVATE_VALUE` with the real value privately in the terminal. Replace `005930` with the owner's selected 6-digit KR symbol. Do not share real values in chat.

**Verify boolean presence before running (optional safety check):**

```powershell
[bool]$env:KIS_APP_KEY
[bool]$env:KIS_APP_SECRET
[bool]$env:KIS_BASE_URL
[bool]$env:KIS_ENABLE_LIVE_QUOTES
```

All must output `True`. If any outputs `False`, do not proceed.

**Cleanup command shape (run immediately after smoke regardless of result):**

```powershell
Remove-Item Env:KIS_APP_KEY
Remove-Item Env:KIS_APP_SECRET
Remove-Item Env:KIS_BASE_URL
Remove-Item Env:KIS_ENABLE_LIVE_QUOTES
Remove-Item Env:PHASE_3Y_LIVE_KIS_SMOKE
Remove-Item Env:PHASE_3Y_RUNTIME_CONFIRMED
Remove-Item Env:PHASE_3Y_READ_ONLY_SCOPE_CONFIRMED
Remove-Item Env:PHASE_3Y_PROVIDER_QUOTA_RISK_ACCEPTED
Remove-Item Env:PHASE_3Y_NO_ACCOUNT_APIS_CONFIRMED
Remove-Item Env:PHASE_3Y_SMOKE_MARKET
Remove-Item Env:PHASE_3Y_SMOKE_SYMBOL
```

**What to record after running:**

Record only the sanitized `phase3y step=... status=... sanitized=true` output lines. Do not record actual price values, provider codes, KIS field values, raw error messages, tokens, or any secret-bearing content. Provide only the boolean-shaped output to Claude Code as Phase 3Z input.

## 12. What This Phase Confirms

- A fail-closed, sanitized, owner-run local KIS quote smoke harness has been implemented.
- The harness correctly defaults to dry-run/mock mode without live guards.
- The harness correctly rejects production runtime in live mode.
- The harness correctly rejects `KIS_ACCOUNT_NO` presence.
- The harness correctly checks KIS env name presence without reading values.
- The harness emits all required sanitized step labels.
- The harness uses a stub KIS provider in dry-run mode — no live KIS code is loaded.
- All five dry-run simulation steps confirm expected detection behavior.
- The dry-run/mock smoke passed all validation commands.

## 13. What This Phase Does Not Confirm

- No live KIS token fetch was performed.
- No live KIS quote request was made.
- No live normalized `QuoteSnapshot` from KIS was received or validated.
- No KIS error or rate-limit behavior was observed.
- `/api/market/quote` was not tested against a live KIS response.
- The production KIS guard was not changed. Production KIS calls remain blocked.
- Vercel env mutation did not occur.
- No deployment was made.
- UI live quote wiring was not implemented.

## 14. Explicit Non-Goals

Phase 3Y did not:

- Run a live KIS API call
- Call the KIS OAuth token endpoint
- Call the KIS quote endpoint
- Run live Supabase query or write
- Execute SQL
- Touch production DB
- Read ignored `.env*` files
- Read, print, infer, or record any secret value
- Mutate Vercel environment values
- Deploy
- Change `kisClient.ts` production guard
- Allow production KIS calls
- Implement UI live quote wiring
- Connect Market, Portfolio, Chart AI, Home, or Lab to live quote data
- Implement account, order, trading, balance, holdings, or WebSocket APIs
- Record project refs, Vercel project IDs, Supabase URLs, KIS app keys, KIS app secrets, tokens, account numbers, connection strings, DB passwords, service-role keys, screenshots, raw errors, or stack traces

## 15. Validation / Build Status

| Command | Result |
|---|---|
| `npm run smoke:kis-quote-live:dry` | Passed — 32 lines, all step labels and dry-run simulations confirmed |
| `npm run check:provider-boundaries` | Passed |
| `npx tsc --noEmit` | Passed (no output) |
| `npm run build` | Passed — Vercel output artifacts present |

`wouldEmitGuardNotApproved=true`, `currentRuntimeIsProduction=false`, `wouldEmitKisConfigMissing=true`, `errorDetected=true`, `accountEnvCurrentlyAbsent=true` all confirmed. Exit code 0.

## 16. Remaining Risks

- The live KIS smoke has not been run. KIS token fetch and quote fetch may encounter rate limits, credential errors, KIS API policy changes, or network policy blocks.
- The KIS in-memory token cache (`accessTokenCache` in `kisClient.ts`) resets on each process restart. Each live smoke run will trigger a fresh token request.
- KIS quota and rate limits apply to token requests and quote requests. The owner must be aware before running live.
- Phase 3Y uses an in-process mock cache for cache validation. Supabase persistent cache behavior with live KIS quote data is not yet tested. A future harness or result phase can extend this if needed.
- If the owner's `KIS_BASE_URL` points to a KIS demo/sandbox endpoint rather than the production endpoint, the quote response may differ from production behavior.
- `providerCode` from a failed live KIS call is not emitted (only `QUOTE_FETCH_FAILED` is logged). The owner will need to check raw harness exit behavior to diagnose specific provider-level failures.

## 17. Recommended Next Action

Owner reviews this document. If approved, the owner manually runs the Phase 3Y live smoke harness in a local non-production shell after privately setting all required environment variables. The owner then provides only the sanitized `phase3y step=... status=... sanitized=true` output lines to Claude Code as **Phase 3Z** input — without including any secret values, raw KIS fields, token data, or stack traces.

## 18. Minimal Korean Owner Review Checklist

```text
Phase 3Y Local KIS Quote Smoke Harness 검토 결과:

* local owner-run KIS quote smoke harness가 준비됨: 통과/실패
* harness가 fail-closed 방식으로 구현됨: 통과/실패
* 기본 실행이 dry-run/mock으로 유지됨: 통과/실패
* live KIS mode에 owner approval guards가 필요함: 통과/실패
* production runtime에서 live KIS call이 차단됨: 통과/실패
* quote-only phase에서 `KIS_ACCOUNT_NO` 사용이 차단됨: 통과/실패
* KIS env 값이 아니라 존재 여부만 확인하도록 설계됨: 통과/실패
* sanitized `phase3y step=... status=...` 출력이 구현됨: 통과/실패
* raw KIS payload/token/key/header/account data 출력이 차단됨: 통과/실패
* dry-run/mock validation이 통과함: 통과/실패
* Claude Code가 live KIS call을 실행하지 않음: 통과/실패
* Claude Code가 live Supabase query/write를 실행하지 않음: 통과/실패
* Claude Code가 SQL/Supabase MCP DB query/project listing을 실행하지 않음: 통과/실패
* production DB가 Claude Code에 의해 접근/변경되지 않음: 통과/실패
* `.env*` 파일 내용이 읽히지 않음: 통과/실패
* Vercel env 변경 및 deployment가 없음: 통과/실패
* UI live quote wiring이 계속 차단됨: 통과/실패
* production KIS guard가 변경되지 않음: 통과/실패
* project ref/URL/key/token/connection string/screenshot/raw error/stack trace가 기록되지 않음: 통과/실패
* 다음 단계가 별도 owner manual local KIS smoke result recording phase임: 통과/실패
* 비밀 정보 없는 메모:
```
