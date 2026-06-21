# Phase 3X Vercel Environment Readiness And KIS Production Gate Decision Plan v0.1

## 1. Status And Scope

Phase 3X is documentation-only. It defines which Vercel environment variables are required for a future live KIS quote integration, how they are classified, which environment should be prepared first, and what decision is required about the current production KIS runtime gate before any production live quotes can ever be enabled.

No code was changed. No Vercel environment values were mutated. No live KIS calls were made. No live Supabase queries or writes were executed. No SQL was run. No deployment was made. No `.env*` files were read. No secret values were read, printed, or recorded. No UI live quote wiring was implemented.

## 2. Baseline Before Phase 3X

| Item | State |
|---|---|
| Phase 3V persistent quote cache live smoke | Passed |
| Phase 3V smoke used live KIS provider response | No — synthetic normalized quote snapshot only |
| Phase 3W controlled live quote readiness plan | Completed |
| KIS live provider end-to-end flow validated | No |
| `/api/market/quote` verified against live KIS response | No |
| UI live quote wiring | Blocked |
| Vercel production environment mutation | Blocked — requires separate approval |
| Deployment | Blocked — requires separate approval |
| Production KIS calls | Blocked by hard-coded `isProductionRuntime()` guard |
| Local KIS credentials confirmed in any runtime | No |
| KIS OAuth token fetch tested | No |
| Persistent cache write with live KIS quote data | No |

## 3. Phase 3W Critical Finding Recap

**`kisClient.ts` contains a hard-coded production runtime guard that permanently blocks KIS live quote calls in production.**

The function `isProductionRuntime()` in [src/lib/server/providers/kisClient.ts](src/lib/server/providers/kisClient.ts) evaluates:

```typescript
const isProductionRuntime = () => {
  const nodeEnv = normalizeString(process.env.NODE_ENV).toLowerCase();
  const vercelEnv = normalizeString(process.env.VERCEL_ENV).toLowerCase();
  return nodeEnv === 'production' || vercelEnv === 'production';
};
```

When either `NODE_ENV` or `VERCEL_ENV` is `production`, `getKisQuoteConfigReadiness()` returns:

```
{ ready: false, reason: 'production_not_allowed', productionAllowed: false }
```

This causes `getKisDomesticQuoteSnapshot()` to return a fail-closed `CONFIG_MISSING` error before any KIS API call is attempted — regardless of whether `KIS_ENABLE_LIVE_QUOTES=true` is set and regardless of whether `KIS_APP_KEY`, `KIS_APP_SECRET`, and `KIS_BASE_URL` are present.

The `productionAllowed: false` flag is also recorded in the provider env registry for every KIS env name.

**Consequence:** Setting Vercel Production environment variable values alone will not enable production KIS live quotes. The guard must be separately and explicitly changed via an approved code-change phase. That change is not in scope for Phase 3X and must not be made until the owner separately approves it after local smoke results are recorded.

This guard is treated as a deliberate safety constraint, not a bug.

## 4. Vercel Environment Readiness Checklist

Variable names only. Values must never be printed, logged, or recorded.

### KIS Provider Variables

| Variable Name | Required for Quote Phase | Secret | Target Environment | Role | Owner Sets Privately | Claude Code May Read Value | Value May Appear in Docs |
|---|---|---|---|---|---|---|---|
| `KIS_APP_KEY` | Yes | Yes — never log | Local first; Preview/Production deferred | KIS API application key | Yes | No | No |
| `KIS_APP_SECRET` | Yes | Yes — never log | Local first; Preview/Production deferred | KIS API application secret | Yes | No | No |
| `KIS_BASE_URL` | Yes | No — internal infra | Local first; Preview/Production deferred | KIS API base URL (no trailing slash) | Yes | No | No (internal routing) |
| `KIS_ENABLE_LIVE_QUOTES` | Yes — feature flag | No | Local first; Preview/Production deferred | Must be `true` to pass feature-flag gate | Yes | No | Name only |
| `KIS_ACCOUNT_NO` | No — defer | Yes — never log | Defer — future account-context phase | Account number for portfolio/order context | N/A until approved | No | No |

### Persistent Cache Variables

| Variable Name | Required for Quote Phase | Secret | Target Environment | Role | Owner Sets Privately | Claude Code May Read Value | Value May Appear in Docs |
|---|---|---|---|---|---|---|---|
| `QUOTE_CACHE_BACKEND` | Yes — for Supabase cache | No | Local / Preview / Production | `supabase` to enable persistent cache; default `memory` | Yes | No | Name only |
| `PUBLIC_SUPABASE_URL` | Yes | No — but project-identifying | Local / Preview / Production | Supabase project URL | Yes | No | No (project-identifying) |
| `PUBLIC_SUPABASE_ANON_KEY` | Yes | No — public scoped key | Local / Preview / Production | Supabase anon key for client-side auth | Yes | No | No (project-identifying) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Yes — never log | Local / Preview / Production | Supabase service role key for admin ops | Yes | No | No |

### Setup Priority Notes

- `KIS_ACCOUNT_NO` must not be set during quote-only phases. Setting it before account-context work is approved may inadvertently enable account-context API paths. Defer until a separate account-context phase is explicitly approved.
- Supabase variables were confirmed present in the owner shell during Phase 3V. Their Vercel production env status is unknown and was not verified in Phase 3X.
- KIS variables have never been confirmed present in any runtime. Their status must be confirmed by the owner privately before any live KIS call is made.

## 5. Secret And Non-Secret Variable Classification

### Secrets — Must Never Be Printed, Logged, Recorded, or Returned in API Responses

These values must never appear in documentation, chat, logs, harness output, API responses, browser payloads, or any artifact readable by any party other than the owner at the point of private configuration:

- `KIS_APP_KEY` — KIS API application key
- `KIS_APP_SECRET` — KIS API application secret
- `KIS_ACCOUNT_NO` — KIS account number (optional, deferred)
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase admin-level key
- KIS OAuth access token — issued at runtime, cached in-memory only, never stored or returned
- Any Bearer token issued by KIS — same policy as access token
- Database passwords — not used directly (Supabase handles connection)
- Connection strings — not used directly

### Project-Identifying or Sensitive Infrastructure — Do Not Record Values

These values are not cryptographically secret, but they identify the specific project or infrastructure. Recording them would allow someone to target or enumerate project resources. Values must not appear in documents, chat, or harness output:

- `PUBLIC_SUPABASE_URL` — identifies the Supabase project endpoint
- `PUBLIC_SUPABASE_ANON_KEY` — scoped but project-identifying
- `KIS_BASE_URL` — identifies the KIS API gateway; treat as internal infrastructure value
- Vercel project identifiers and team IDs
- Supabase project reference strings

### Non-Secret Feature Switches — Names May Be Documented; Values Permitted Only If Non-Sensitive

These control behavior without exposing secrets or project identity. Their names and intended values may appear in planning documents:

- `KIS_ENABLE_LIVE_QUOTES` — value `true` enables live KIS calls; value `false` or absent disables
- `QUOTE_CACHE_BACKEND` — value `supabase` enables persistent cache; any other value or absent uses in-memory cache
- `NODE_ENV` — standard Node.js environment classification (`development`, `production`, `test`)
- `VERCEL_ENV` — Vercel deployment classification (`development`, `preview`, `production`) — Vercel sets this automatically

## 6. Local vs Vercel Preview vs Vercel Production Readiness Strategy

### Step 1 — Local First (Phase 3Y)

All KIS live API validation must happen locally before any Vercel environment is prepared.

Local runtime characteristics:
- `NODE_ENV` is not `production` in a typical local development shell.
- `VERCEL_ENV` is absent in a local shell unless set explicitly.
- The `isProductionRuntime()` guard therefore returns `false` locally, allowing KIS calls when `KIS_ENABLE_LIVE_QUOTES=true` and all required env names are present.
- Owner sets `KIS_APP_KEY`, `KIS_APP_SECRET`, `KIS_BASE_URL`, and `KIS_ENABLE_LIVE_QUOTES=true` in the local shell privately.
- A fail-closed owner-run harness (Phase 3Y plan) confirms token fetch, quote fetch, normalization, and cache write/readback locally.
- No Vercel mutation needed for this step.

### Step 2 — Vercel Preview (Phase 3AB, if approved separately)

Vercel Preview deployments use `VERCEL_ENV=preview`, which is NOT `production`. The current `isProductionRuntime()` guard would therefore return `false` in Vercel Preview.

However, even for Preview:
- The owner must separately approve any Vercel env mutation.
- The owner must separately approve any deployment.
- The Preview deployment must not use `KIS_ACCOUNT_NO` or any account-context variables.
- The Preview deployment must treat live KIS data as read-only price data only.
- Preview validation should happen before Production.

### Step 3 — Vercel Production (Phase 3AB/3AC, only after gate decision is resolved)

Vercel Production deployments set `VERCEL_ENV=production`. The current `isProductionRuntime()` guard blocks KIS calls regardless of env var values.

**Production KIS calls require a separate approved code change.** That change is not in scope until:
1. Local KIS smoke passes (Phase 3Z).
2. Owner reviews and approves the production gate decision (see Section 10).
3. A code-change phase is explicitly opened and approved.

Vercel Production environment mutation is blocked until the owner separately approves it after the above prerequisites are satisfied.

### Sequencing Summary

```
Local KIS smoke (Phase 3Y/3Z)
  → Server-side API endpoint verification (Phase 3AA)
    → Gate decision: Preview-only or Production-enabled (Phase 3AB)
      → Vercel env setup approval (Phase 3AC, separate approval)
        → Deployment approval (Phase 3AC, separate approval)
          → UI wiring approval (Phase 3AD, separate approval)
```

Each arrow represents a distinct owner approval gate. No step may proceed to the next without explicit approval.

## 7. Current Production KIS Gate Behavior

`kisClient.ts` `isProductionRuntime()` is the first check executed in `getKisQuoteConfigReadiness()` when `getKisDomesticQuoteSnapshot()` is called. If it returns `true`, the function immediately returns a fail-closed readiness object with `reason: 'production_not_allowed'` and `ready: false`. No further checks (feature flag, credential presence) are evaluated. No KIS API call is made.

This means:
- A Vercel Production function serving `/api/market/quote` will always return `{ ok: false, code: 'CONFIG_MISSING', message: 'KIS live quotes are disabled in this runtime.' }` for any KIS-backed quote request.
- The cache layer still works in production — if a stale-but-usable entry exists, it will be returned. If no entry exists, the final response is a safe unavailable error.
- There is no credentials-exposure risk from the guard itself.
- There is no way to bypass this guard without changing the source code.

This is consistent with the `productionAllowed: false` field on all KIS entries in `providerEnv.ts`. It is treated as a deliberate safety constraint.

## 8. Production KIS Gate Decision Options

The following options are defined for the owner's future consideration. No option is implemented in Phase 3X. The owner must separately approve whichever path is chosen before any code change is made.

### Option A — Keep Production KIS Blocked Permanently (or Indefinitely)

**Description:** Leave `isProductionRuntime()` returning `true` in production and `production_not_allowed` blocking all KIS calls in Vercel Production deployments.

**Tradeoff:**
- Safest option. No production KIS credentials needed in Vercel. No production KIS call risk.
- Production users see the persistent cache (if `QUOTE_CACHE_BACKEND=supabase`) serving stale data, or an unavailable state.
- If stale-but-usable cache data is present (written by a non-production process or an earlier session), the cache layer serves it. Otherwise, the endpoint returns an unavailable error.
- Suitable if the project does not need real-time live KIS data on the production site.

**Required work:** None beyond Phase 3Y local smoke.

---

### Option B — Allow Live KIS Calls in Vercel Preview; Keep Production Blocked

**Description:** Modify `isProductionRuntime()` or the readiness check to allow KIS calls when `VERCEL_ENV=preview` but continue blocking when `VERCEL_ENV=production`. This requires an approved code change.

**Tradeoff:**
- Lower risk than production. Preview deployments are not indexed or publicly promoted.
- Enables end-to-end validation of the KIS → normalize → cache → API response cycle in a deployed environment before any production risk.
- Requires code change, Vercel env setup, and deployment approval — each as separate phases.
- KIS credentials must be set in Vercel Preview environment — owner sets privately.

**Required work:** Approved code change to `kisClient.ts` (or a separate gate file), Vercel Preview env setup, deployment, and server-side API endpoint smoke in Preview before production.

---

### Option C — Allow Read-Only KIS Quote Calls in Vercel Production Behind Multiple Gates

**Description:** Remove or gate the production_not_allowed block specifically for the read-only domestic quote endpoint, while keeping all other restrictions in place. This is the highest-complexity option.

**Tradeoff:**
- Enables live KIS quote data on the production site.
- Requires all of the following in separate approved phases before production is enabled:
  1. Local smoke passes (Phase 3Z).
  2. Preview smoke passes (option B path).
  3. Explicit owner approval for production guard change.
  4. Approved code change to `kisClient.ts` — scoped to read-only domestic quote only, not chart, not account.
  5. Vercel Production env setup for `KIS_APP_KEY`, `KIS_APP_SECRET`, `KIS_BASE_URL`, `KIS_ENABLE_LIVE_QUOTES`.
  6. Approved deployment.
  7. Server-side HTTP endpoint live smoke on production (owner manual call, sanitized result).
  8. Response verification against the API response checklist.
  9. Monitoring plan for KIS rate limits and 429 behavior.
  10. Rollback plan if KIS calls fail or produce unexpected output.
- `KIS_ACCOUNT_NO` must NOT be set in production during this phase.
- No trading, order, balance, holdings, or WebSocket scope.

**Required work:** Very significant — multiple phases, each requiring separate owner approval.

## 9. Recommended Safe Decision Path

1. **Start with local smoke only.** Do not decide between Options A, B, and C until the Phase 3Y local owner-run KIS quote smoke and Phase 3Z result recording are complete. The local smoke will confirm whether KIS token fetch, quote fetch, and normalization work correctly with the owner's credentials.

2. **After local smoke passes:** Review Option A first. If serving live KIS data in production is not currently needed, Option A is sufficient — the persistent cache can warm over time via local or Preview writes, and the production site serves cache hits or graceful unavailable errors.

3. **If Preview-only live KIS is desired:** Proceed with Option B as a separate approved phase after Phase 3Z. Do not combine Option B implementation with local smoke in a single phase.

4. **If Production live KIS is eventually desired:** Proceed through Option B first as a prerequisite, then open a separate phase for Option C. Do not skip to Option C directly.

5. **Do not wire any browser UI surface to live quote data until:**
   - The server-side API endpoint smoke (Phase 3AA) result is recorded.
   - The gate decision is resolved.
   - Vercel env mutation and deployment are separately approved.

## 10. Owner Approval Gates

Each of the following requires a separate explicit owner approval. Completing an earlier step does not grant implicit approval for any later step.

| Gate | Trigger | Required Before |
|---|---|---|
| Local KIS env presence check | Before any live KIS call in local runtime | Phase 3Y harness implementation |
| Live KIS API call | Owner confirms local runtime, credentials present, read-only scope | Phase 3Y harness execution |
| Vercel env mutation | Owner approves adding/updating any variable in Vercel Dashboard or CLI | Any Vercel env setup phase |
| Production guard code change | Owner reviews options and approves Option B or C | Any `kisClient.ts` change |
| Deployment | Owner approves Vercel deployment for Preview or Production | Any deployment phase |
| Server-side HTTP endpoint smoke | Owner approves manual curl/HTTP test on local or deployed endpoint | Phase 3AA or Preview smoke |
| UI live quote wiring | Owner approves connecting a specific browser component to the API | Phase 3AD or equivalent |
| Portfolio valuation integration | Owner separately approves | Future phase not yet in scope |
| Chart AI live inference integration | Owner separately approves | Future phase not yet in scope |
| Account-context variable setup | Owner separately approves; `KIS_ACCOUNT_NO` not to be set until then | Future account-context phase |

## 11. Recommended Future Phase Sequence

Phase names are suggestions and may be adjusted to match local conventions.

| Phase | Name | Type | Prerequisite |
|---|---|---|---|
| **3Y** | Local KIS Quote Smoke Harness Plan or Implementation | Implementation or Harness | Owner approves Phase 3Y start |
| **3Z** | Owner Manual Local KIS Quote Smoke Result Recording | Documentation | Phase 3Y harness built; owner runs locally |
| **3AA** | Server-Side `/api/market/quote` Local Endpoint Verification | Documentation | Phase 3Z local smoke passed |
| **3AB** | Preview/Production Gate Decision and Vercel Env Readiness Approval | Documentation or Planning | Phase 3AA result reviewed by owner |
| **3AC** | Vercel Env Setup and Deployment Plan | Documentation + Owner Action | Owner approves gate decision and Vercel mutation |
| **3AD** | Controlled UI Wiring to One Read-Only Market Page Surface | Implementation | Phase 3AC deployment verified; API endpoint smoke passes in target env |

Each phase requires explicit owner approval before Claude Code begins any work in that phase. Phases must not be combined unless the owner explicitly scopes them together.

## 12. Explicit Non-Goals

Phase 3X did not and must not:

- Change any source code
- Change `kisClient.ts` or the `isProductionRuntime()` guard
- Implement or modify any production guard behavior
- Run live KIS, OpenDART, OpenAI, Gemini, or any external provider call
- Run live Supabase query or write
- Execute SQL
- Run Supabase CLI or psql
- Use Supabase MCP database tools
- List Supabase projects
- Touch production DB
- Read ignored `.env*` files
- Read, print, infer, or record any secret values or project-identifying values
- Mutate any Vercel environment variable
- Use Vercel CLI to pull, add, remove, update, inspect, or print env values
- Deploy to any environment
- Implement UI live quote wiring
- Connect Market, Portfolio, Chart AI, Home, or Lab to live quote data
- Implement account, order, trading, balance, holdings, or WebSocket APIs
- Implement Portfolio valuation automation or live P&L
- Implement Chart AI live market inference
- Implement visitor count, ad tracking, scraping, or external asset downloads
- Modify root `README.md`
- Modify migration files
- Modify production SQL pack files
- Record Vercel project IDs, Supabase project refs, KIS app keys, KIS app secrets, tokens, account numbers, connection strings, DB passwords, service-role keys, anon keys, JWT secrets, screenshots, raw errors, or stack traces

## 13. Files Changed

- `docs/planning/phase_3x_vercel_env_readiness_and_kis_gate_plan_v0.1.md`
- `docs/planning/planning_changelog.md`
- `docs/planning/phase_3c1_portfolio_manual_smoke_checklist_v0.1.md`

No source code was changed.

## 14. Validation / Build Status

Documentation-only phase. No source code changes. Build skipped. `git status --short` confirms only the three documentation files changed.

## 15. Remaining Risks

- **Production KIS gate is permanently blocking.** Until the owner resolves the gate decision and a code change is approved, production live KIS quotes are impossible regardless of env var state.
- **Local KIS credentials have not been confirmed.** The local smoke (Phase 3Y) has not been planned or run. KIS token fetch and quote fetch may encounter rate limits, credential errors, or network policy blocks.
- **KIS token cache resets on cold starts.** Each function cold start fetches a fresh token. High cold-start frequency may exhaust KIS token rate limits faster than expected.
- **Preview vs Production isolation.** If Vercel Preview is enabled for KIS (Option B), the owner must ensure Preview KIS env vars are distinct from any production values to prevent accidental production env mutation.
- **`KIS_ACCOUNT_NO` must remain absent.** Setting it before an account-context phase is approved could inadvertently expose account-context paths in the KIS client.
- **Supabase variables in Vercel production env** have not been confirmed. Phase 3V confirmed them in the owner's local shell only. Vercel production env state for Supabase is unknown.
- **`QUOTE_CACHE_BACKEND=supabase` in Vercel production env** has not been confirmed. Without it, the persistent cache is inactive in production and quote responses rely on in-memory cache only, which resets on cold start.

## 16. Recommended Next Action

Owner reviews this plan. If the plan is approved, start **Phase 3Y** — a fail-closed, sanitized, owner-run local KIS quote smoke harness (plan or implementation). This harness will validate KIS token fetch, quote fetch, normalization, cache write/readback, and sanitized API response shape in a local non-production Node runtime before any Vercel environment mutation or production gate decision is made.

Before Phase 3Y begins, the owner must:
1. Confirm the Phase 3Y harness implementation or plan is separately approved.
2. Confirm the local runtime is non-production (`NODE_ENV` and `VERCEL_ENV` not set to `production`).
3. Confirm `KIS_APP_KEY`, `KIS_APP_SECRET`, `KIS_BASE_URL`, and `KIS_ENABLE_LIVE_QUOTES=true` are ready to be set in the local runtime privately.
4. Confirm `KIS_ACCOUNT_NO` will not be set.
5. Confirm the harness must emit sanitized step-level output only — no raw KIS payload, no token, no appKey, no appSecret.

## 17. Minimal Korean Owner Review Checklist

```text
Phase 3X Vercel Env Readiness And KIS Gate Plan 검토 결과:

* Phase 3W baseline과 Phase 3V cache smoke 통과 상태가 반영됨: 통과/실패
* KIS live end-to-end flow가 아직 미검증으로 기록됨: 통과/실패
* Vercel env mutation이 아직 수행되지 않음: 통과/실패
* production KIS guard의 `production_not_allowed` 제약이 명확히 기록됨: 통과/실패
* Vercel Production env 값 설정만으로 production KIS 호출이 활성화되지 않음이 기록됨: 통과/실패
* 필요한 env 이름만 정리되고 값은 기록되지 않음: 통과/실패
* secret / non-secret / project-identifying 값 구분이 명확함: 통과/실패
* Local / Preview / Production 단계 전략이 분리되어 있음: 통과/실패
* production KIS gate decision options가 정리됨: 통과/실패
* live KIS call 전 owner approval gate가 명확함: 통과/실패
* Vercel env mutation 전 owner approval gate가 명확함: 통과/실패
* production guard code change 전 owner approval gate가 명확함: 통과/실패
* deployment 전 owner approval gate가 명확함: 통과/실패
* UI live quote wiring이 계속 차단됨: 통과/실패
* Claude Code가 code/source를 변경하지 않음: 통과/실패
* Claude Code가 live KIS call을 실행하지 않음: 통과/실패
* Claude Code가 live Supabase query/write를 실행하지 않음: 통과/실패
* Claude Code가 SQL/Supabase MCP DB query/project listing을 실행하지 않음: 통과/실패
* production DB가 Claude Code에 의해 접근/변경되지 않음: 통과/실패
* `.env*` 파일 내용이 읽히지 않음: 통과/실패
* Vercel env 변경 및 deployment가 없음: 통과/실패
* project ref/URL/key/token/connection string/screenshot/raw error/stack trace가 기록되지 않음: 통과/실패
* 다음 단계가 별도 local KIS quote smoke harness phase임: 통과/실패
* 비밀 정보 없는 메모:
```
