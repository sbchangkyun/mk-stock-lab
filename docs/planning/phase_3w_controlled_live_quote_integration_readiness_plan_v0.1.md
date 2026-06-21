# Phase 3W Controlled Live Quote Integration Readiness Plan v0.1

## 1. Status And Scope

Phase 3W is a documentation-only readiness planning phase. It defines the safe sequence for moving from the current successful persistent quote cache smoke state toward a controlled server-side live KIS quote API verification phase.

Claude Code did not run live KIS calls, live Supabase queries or writes, SQL, Supabase CLI, psql, Supabase MCP database tools, or project listing. Claude Code did not touch production DB, read ignored `.env*` files, mutate Vercel environment values, or deploy. UI live quote wiring is not implemented and remains blocked.

## 2. Baseline Before Phase 3W

| Item | State |
|---|---|
| Phase 3V persistent quote cache live smoke | Passed |
| Smoke used live KIS provider response | No — synthetic normalized quote snapshot only |
| KIS live provider end-to-end flow validated | No |
| `/api/market/quote` endpoint tested against live KIS | No |
| KIS credentials set in Vercel production env | Unknown — not verified, not mutated |
| `KIS_ENABLE_LIVE_QUOTES` set in Vercel production env | Unknown |
| `QUOTE_CACHE_BACKEND=supabase` in Vercel production env | Unknown |
| UI live quote wiring | Blocked |
| Vercel environment mutation | Blocked — requires separate approval |
| Deployment | Blocked — requires separate approval |
| KIS production runtime gate | Fail-closed by design — see Section 5 |

## 3. Target End-To-End Flow To Validate

The full live quote request flow through the server stack:

```
1.  Browser or client sends GET /api/market/quote?market=KR&symbol=XXXXXX
2.  Astro API route (src/pages/api/market/quote.ts) validates market and symbol
3.  getQuoteSnapshot() (src/lib/server/marketData/quotes.ts) is called
4.  assertServerRuntime() confirms server-only execution context
5.  getConfiguredQuoteCacheEntry() checks for a fresh or stale-but-usable cache hit
6.  If fresh cache hit → return cached QuoteSnapshot without calling KIS
7.  If no fresh hit → getKisQuoteSnapshot() (src/lib/server/providers/kisClient.ts) is called
8.  kisClient reads KIS_ENABLE_LIVE_QUOTES; if not 'true' → fail-closed CONFIG_MISSING
9.  kisClient reads NODE_ENV / VERCEL_ENV; if production → fail-closed production_not_allowed
10. kisClient resolves KIS_APP_KEY, KIS_APP_SECRET, KIS_BASE_URL from process.env
11. kisClient requests KIS OAuth token from /oauth2/tokenP
12. kisClient caches access token in-memory (expires with 60s skew before official expiry)
13. kisClient sends GET to /uapi/domestic-stock/v1/quotations/inquire-price with auth headers
14. kisClient normalizes raw KIS output into QuoteSnapshot (price, change, changePct, volume, asOf)
15. Raw KIS payload fields (stck_prpr, prdy_vrss, prdy_ctrt, acml_vol) are extracted and then discarded
16. No raw payload, token, appKey, appSecret, or account number is stored or returned
17. QuoteSnapshot is written to configured cache (memory or Supabase) via setConfiguredQuoteCacheEntry()
18. API route returns { ok: true, data: QuoteSnapshot, fallback: { state, reason, cache } }
19. If KIS fails and stale-but-usable cache exists → return stale snapshot with fallback metadata
20. If KIS fails and no usable cache → return { ok: false, code, message, staleState: 'unavailable' }
21. All error responses are sanitized — no raw errors, stacks, tokens, or provider credentials exposed
```

This is the flow that needs to be validated by a separate owner-run local KIS quote smoke before any UI surface is wired.

## 4. Production Environment Readiness Requirements

The following Vercel environment variable **names** are required for a fully operational production live quote flow. Values must be set privately by the owner. Values must never be printed, logged, or recorded.

### KIS Provider Variables

| Name | Secret? | Owner | Purpose | Current registry phase |
|---|---|---|---|---|
| `KIS_APP_KEY` | Yes — never log | Owner | KIS API application key | 3I |
| `KIS_APP_SECRET` | Yes — never log | Owner | KIS API application secret | 3I |
| `KIS_BASE_URL` | No — but internal | Engineering | KIS API base URL (no trailing slash) | 3I |
| `KIS_ENABLE_LIVE_QUOTES` | No — feature flag | Engineering | Must be `true` to enable live KIS calls | 3I |
| `KIS_ACCOUNT_NO` | Yes — never log | Owner | Account number — optional, not needed for quote-only | future-account-context |

Note: `KIS_ACCOUNT_NO` is registered as optional and is not required for read-only quote fetches. It should not be set until an account-context phase is separately approved.

### Persistent Cache Variables

| Name | Secret? | Owner | Purpose |
|---|---|---|---|
| `QUOTE_CACHE_BACKEND` | No — feature flag | Engineering | Must be `supabase` to use persistent cache |
| `PUBLIC_SUPABASE_URL` | No — but project-identifying | Engineering | Supabase project URL |
| `PUBLIC_SUPABASE_ANON_KEY` | No — public scoped key | Engineering | Supabase anon key for client-side auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes — never log | Owner | Supabase service role key for admin operations |

The Supabase variables were already confirmed present in the owner shell during Phase 3V. Their Vercel production env status is unknown and was not verified.

### Secret Handling Policy

The following names must **never** have their values printed, logged, recorded, returned in API responses, or stored in any document:

- `KIS_APP_KEY`
- `KIS_APP_SECRET`
- `KIS_ACCOUNT_NO`
- `SUPABASE_SERVICE_ROLE_KEY`
- Any OAuth token or Bearer token issued by KIS

The following names are non-secret feature switches or infrastructure addresses whose values may be referenced in planning context but must not appear in any API response, browser code, or client-side bundle:

- `KIS_ENABLE_LIVE_QUOTES`
- `KIS_BASE_URL`
- `QUOTE_CACHE_BACKEND`
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`

## 5. Critical Production Runtime KIS Gate Constraint

**KIS live quotes are permanently disabled in production runtime by design.** This is a hard-coded guard in `kisClient.ts`, not a configuration flag.

The `isProductionRuntime()` function in [src/lib/server/providers/kisClient.ts](src/lib/server/providers/kisClient.ts) checks:

```typescript
const isProductionRuntime = () => {
  const nodeEnv = normalizeString(process.env.NODE_ENV).toLowerCase();
  const vercelEnv = normalizeString(process.env.VERCEL_ENV).toLowerCase();
  return nodeEnv === 'production' || vercelEnv === 'production';
};
```

When `isProductionRuntime()` returns `true`, `getKisQuoteConfigReadiness()` returns `ready: false, reason: 'production_not_allowed'` and the client **never makes a KIS API call**, even if `KIS_ENABLE_LIVE_QUOTES=true` and all credentials are set.

**Implication:** Enabling KIS live quotes in the Vercel production deployment requires a separate approved implementation phase to change or gate this production guard. Setting environment variables alone is not sufficient to serve live KIS quotes from production. This constraint must be understood before any Vercel production env mutation is approved.

For the near-term KIS smoke plan, live KIS calls are only possible in a local (non-production) runtime where `VERCEL_ENV` and `NODE_ENV` are not set to `production`.

## 6. Safety Gates Before Live KIS Provider Testing

All of the following owner confirmations are required before any live KIS API smoke may proceed. These gates are in addition to the existing Phase 3S live approval guards.

| Gate | Description |
|---|---|
| Owner confirms runtime target | Owner confirms the smoke will run locally (not in Vercel production, not in Vercel preview), so the production_not_allowed guard does not apply |
| Owner confirms KIS env values are set privately | Owner confirms `KIS_APP_KEY`, `KIS_APP_SECRET`, `KIS_BASE_URL` are set in local runtime without printing them |
| Owner confirms `KIS_ENABLE_LIVE_QUOTES=true` | Owner confirms the feature flag is set in the local runtime |
| Owner confirms provider quota/rate-limit risk | Owner acknowledges that KIS token requests and quote requests count against API quota and daily rate limits |
| Owner confirms read-only scope | Owner confirms only read-only quote price endpoints are in scope — no order placement, no account reads, no position reads, no balance reads, no WebSocket |
| Owner confirms no trading or account APIs | Owner confirms `KIS_ACCOUNT_NO` is not set during the quote smoke and no account-context endpoints are called |
| Owner explicit approval before live KIS smoke | Owner separately approves each live KIS smoke phase before Claude Code begins implementation |
| Owner explicit approval before Vercel env mutation | Owner separately approves Vercel production env changes before any are made |
| Owner explicit approval before deployment | Owner separately approves each deployment |
| Owner explicit approval before UI live quote wiring | Owner separately approves each UI surface connection before any browser code is changed |

## 7. Recommended Future Phase Sequence

The following sequence maintains separation between each risk boundary. Phase names are suggestions and may be adjusted.

### Phase 3X — Vercel Production Environment Readiness Checklist

Documentation only. No Vercel env mutation by Claude Code.

- Review which Vercel environment (Preview vs Production) should receive KIS and Supabase env vars.
- Document which variables need to be added, updated, or confirmed present.
- Document the production_not_allowed KIS gate constraint and what implementation change is needed before production KIS calls are possible.
- Owner privately confirms or sets required env values via Vercel Dashboard or Vercel CLI.
- No mutation by Claude Code unless separately approved.

### Phase 3Y — Local Server-Side KIS Quote API Smoke Plan

Documentation or harness only. Owner runs locally, not in production.

- Define a fail-closed, owner-run local smoke harness for the KIS quote API, analogous to the persistent cache smoke harness from Phase 3S.
- The harness must call `getKisDomesticQuoteSnapshot()` directly (or via `getQuoteSnapshot()`) with a known-good KR 6-digit symbol.
- The harness must verify the local runtime is not production before calling KIS.
- The harness must emit sanitized step-level output with no raw token, key, payload, or account data.
- The harness must record only normalized `QuoteSnapshot` fields: market, symbol, price, currency, change, changePct, volume, asOf, staleState. No raw KIS fields (stck_prpr, prdy_vrss, etc.), no access tokens, no appKey, no appSecret.
- The harness should verify the full cache write/read cycle with the live quote result.
- Six owner approval guards, analogous to Phase 3S.

### Phase 3Z — Owner Manual Local KIS Quote Smoke Result Recording

Documentation only. Owner runs the Phase 3Y harness locally and provides sanitized output.

- Owner provides sanitized step-level harness output (no raw tokens, keys, payloads, account data).
- Claude Code records the sanitized result, confirms what passed, and documents what was not confirmed.
- If the smoke passes, a separate phase is opened for server-side API endpoint verification.

### Later Phase — Server-Side API Endpoint Verification

Owner manually calls `/api/market/quote?market=KR&symbol=XXXXXX` against a local or preview deployment and records the sanitized response shape.

- Verify response has `ok: true`, `data` with normalized fields, `fallback` with cache metadata.
- Verify no raw KIS payload, no token or key, no account number, no raw error or stack.
- This phase does NOT wire any browser UI component.

### Subsequent Phase — Controlled UI Wiring To One Surface

Only after server-side API endpoint verification passes. See Section 8 for first surface recommendation.

## 8. First UI Surface Recommendation

**Recommendation: do not wire any browser UI component until the server-side API endpoint smoke result phase is complete.**

When that phase is complete, the safest first UI surface is a read-only **single-stock quote display on the Market page** — a narrow, isolated display showing price, change, and staleness status for a single KR symbol.

### Why Not Portfolio Valuation First

Portfolio valuation multiplies a live quote price against position quantities to produce a running P&L or current market value. Connecting live quotes to Portfolio valuation before the quote API response shape is confirmed in production introduces compounding risk: an incorrect price feeds into a holding value display that the owner may interpret as financial information. Portfolio valuation also depends on positions data, which involves the Supabase portfolio and position tables. Testing portfolio valuation requires both the quote path and the portfolio data path to be correct simultaneously. Isolating the quote path first reduces risk.

### Why Not Chart AI First

Chart AI (`/api/chart-ai/analyze`) calls an AI provider with market context. Connecting live quotes to Chart AI before the quote API is verified adds a second unknown (AI inference on unverified data) on top of the first (live KIS price data). Chart AI analysis correctness depends on quote data accuracy. Verifying the quote path in isolation first is the safer sequence.

### What The Recommended First Surface Should Show

When first UI wiring is eventually approved:

- Display price, change, changePct for a single hardcoded or owner-selected KR symbol.
- Display cache state (fresh / stale-but-usable) as a visible indicator, not hidden.
- Display `asOf` timestamp so the owner can verify data freshness.
- Display a production-disabled placeholder when KIS gate is off (staleState unavailable).
- Do not display portfolio P&L, position counts, valuation totals, or account data.
- Do not call Chart AI from the same surface simultaneously.

## 9. API Response Verification Checklist For Future Owner Manual Smoke

When the owner manually calls `/api/market/quote?market=KR&symbol=XXXXXX` and records a sanitized response, verify:

| Check | What to Verify |
|---|---|
| Response has `ok` | Top-level `ok` field is present and boolean |
| Response has normalized `data` | `data.market`, `data.symbol`, `data.price` (number), `data.currency`, `data.asOf` (ISO string), `data.staleState` are all present |
| No raw KIS payload fields | No `stck_prpr`, `prdy_vrss`, `prdy_ctrt`, `acml_vol`, `rt_cd`, `output` in the response |
| No token or key data | No `access_token`, `appkey`, `appsecret`, `authorization` in the response |
| No account data | No account number, portfolio ID, position ID in the response |
| No raw error or stack | Error responses contain only `ok: false`, `code`, `message`, `staleState` — no stack trace |
| Cache metadata is browser-safe | `fallback.cache` contains only `hit`, `state`, `cachedAt`, `freshUntil`, `staleUntil` in ISO string form |
| Stale fallback behavior is understandable | If KIS fails and stale cache exists, response has `ok: true` with `staleState: 'stale-but-usable'` and explains reason in `fallback.reason` |
| Production-disabled behavior is safe | When `KIS_ENABLE_LIVE_QUOTES` is not set or production guard fires, response is `ok: false, code: CONFIG_MISSING, staleState: 'unavailable'` — no credentials exposed |
| HTTP status matches error code | `CONFIG_MISSING` returns 503 (or configured code via `toHttpStatus`); `VALIDATION_FAILED` returns 400 |
| Cache-Control header | Response must have `Cache-Control: no-store` |

## 10. Explicit Non-Goals

Phase 3W did not and must not:

- Implement UI live quote wiring
- Run live KIS, OpenDART, OpenAI, Gemini, or any external provider call
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
- Implement account, order, trading, balance, holdings, or WebSocket APIs
- Implement Portfolio valuation automation or live P&L
- Implement Chart AI live market inference
- Implement visitor count, ad tracking, scraping, or external asset downloads
- Connect Market, Portfolio, Chart AI, Home, or Lab to live quote data
- Modify root `README.md`
- Modify migration files
- Modify production SQL pack files
- Provide a timeline estimate for KIS live quotes in production (the production_not_allowed gate requires a separate implementation change)

## 11. Files Changed

- `docs/planning/phase_3w_controlled_live_quote_integration_readiness_plan_v0.1.md`
- `docs/planning/planning_changelog.md`
- `docs/planning/phase_3c1_portfolio_manual_smoke_checklist_v0.1.md`

No source code was changed.

## 12. Validation Status

Documentation-only phase. No source code changes. Build skipped. `git status --short` confirms only the three documentation files changed.

## 13. Remaining Risks

- KIS live quotes are blocked in production runtime by the hard-coded `isProductionRuntime()` guard. Setting Vercel env vars alone is not sufficient for production KIS live quotes. A separate approved implementation phase is required.
- Local KIS smoke has not been run. KIS credentials have not been confirmed in any runtime.
- The persistent cache smoke used a synthetic quote snapshot. A live KIS quote response may differ in field presence, numeric precision, or error behavior.
- `KIS_ACCOUNT_NO` is registered as optional. It must not be set during the quote-only smoke phase to avoid inadvertently enabling account-context API paths.
- Chart series (`getKisChartSeries`) returns `NOT_IMPLEMENTED`. Chart integration requires a separate approved phase.
- Portfolio valuation, Chart AI inference, and other downstream consumers of live quote data have not been scoped or approved.
- The KIS in-memory token cache (`accessTokenCache`) resets on each server cold start. High cold-start rate may cause more frequent token requests.

## 14. Recommended Next Action

Owner reviews this plan. If the plan is approved, start Phase 3X to define the Vercel production environment readiness checklist and document the production_not_allowed gate constraint before any environment mutation is considered.

Before any live KIS smoke (Phase 3Y), the owner must:
1. Confirm the smoke will run locally (non-production Node runtime).
2. Confirm `KIS_APP_KEY`, `KIS_APP_SECRET`, `KIS_BASE_URL`, and `KIS_ENABLE_LIVE_QUOTES=true` are set in the local runtime.
3. Confirm read-only scope — no account number set, no trading endpoints called.
4. Separately approve the Phase 3Y harness implementation.

## 15. Minimal Korean Owner Review Checklist

```text
Phase 3W Controlled Live Quote Integration Readiness Plan 검토 결과:

* Phase 3V persistent quote cache live smoke 통과 상태가 반영됨: 통과/실패
* KIS live provider end-to-end flow가 아직 미검증으로 기록됨: 통과/실패
* UI live quote wiring이 계속 차단됨: 통과/실패
* Vercel production env mutation이 아직 수행되지 않음: 통과/실패
* 필요한 env 이름만 정리되고 값은 기록되지 않음: 통과/실패
* KIS read-only quote 범위가 명확함: 통과/실패
* trading/account/order/balance/WebSocket 범위가 명확히 제외됨: 통과/실패
* live provider testing 전 owner approval gate가 명확함: 통과/실패
* API response verification checklist가 정리됨: 통과/실패
* 향후 phase sequence가 분리되어 정리됨: 통과/실패
* Claude Code가 live KIS call을 실행하지 않음: 통과/실패
* Claude Code가 live Supabase query/write를 실행하지 않음: 통과/실패
* Claude Code가 SQL/Supabase MCP DB query/project listing을 실행하지 않음: 통과/실패
* production DB가 Claude Code에 의해 접근/변경되지 않음: 통과/실패
* `.env*` 파일 내용이 읽히지 않음: 통과/실패
* Vercel env 변경 및 deployment가 없음: 통과/실패
* project ref/URL/key/token/connection string/screenshot/raw error/stack trace가 기록되지 않음: 통과/실패
* 다음 단계가 별도 env readiness 또는 server-side KIS API smoke planning phase임: 통과/실패
* 비밀 정보 없는 메모:
```
