# Phase 3DL — KIS + FX Preview Smoke Plan: Result

## 1. Metadata

| Field | Value |
|-------|-------|
| Phase | 3DL |
| Type | KIS + FX Preview Smoke Plan |
| Status | Planned / Execution-ready |
| Latest prior commit | `ba729ff` (chore: record deployment id and route check results for phase 3dk) |
| Canonical production URL | `https://mkstocklab.vercel.app` |
| Runtime UI changes | None |
| API route changes | None |
| DB / Supabase schema changes | None |
| Live KIS calls | None |
| Live FX calls | None |
| Live GNews calls | None |
| AI provider calls | None |
| External data fetch by Claude Code | None |
| Vercel production deployment | Not performed |

---

## 2. Purpose

This phase prepares a safe, implementation-ready preview smoke plan before live quote integration begins.

The project has fixture-backed portfolio valuation today. The next milestone — live KIS quotes for KR stocks and ETFs — requires validation of credentials, endpoint behavior, cache policy, error handling, and UI data-flow before any change reaches production.

This document records the codebase findings, defines the preview smoke scope, lists the environment readiness checklist, and provides a staged runbook. No live calls occurred in this phase.

---

## 3. Current Codebase Findings

### 3.1 KIS Quote Adapter

**File:** `src/lib/server/providers/kisClient.ts`

**Status: Fully implemented for KR domestic stocks.**

- `getKisDomesticQuoteSnapshot(identity: SecurityIdentity)` — fetches KR domestic stock quote via KIS UAPI endpoint.
- `validateKisDomesticQuoteInput(input)` — validates market is `KR` and symbol is exactly 6 digits.
- `getKisQuoteConfigReadiness()` — returns readiness state with `reason` codes: `ready`, `disabled`, `config_missing`, `production_not_allowed`, `preview_guard_required`.
- In-process access token cache with 60s skew.
- All error paths return typed `ProviderErrorEnvelope` with sanitized messages. No raw KIS fields in error output.
- **Hard block on `vercel-production` and `node-production` runtimes** — live quotes will never fire in production.
- `KIS_ACCOUNT_NO` must be ABSENT — if present, readiness returns `production_not_allowed`. This enforces quote-only scope.
- US market: returns `SYMBOL_UNSUPPORTED` immediately. Not implemented.
- ETF: KR ETFs (6-digit codes) pass the symbol validator and use the same domestic endpoint as stocks.

### 3.2 Quote Cache

**File:** `src/lib/server/marketData/quoteCache.ts`

**Status: In-memory cache implemented. Supabase persistent cache implemented but not default.**

- In-memory `Map<string, QuoteCacheEntry>`. Cache key format: `quote:KR:005930`.
- Fresh TTL: **15 seconds** (`QUOTE_CACHE_FRESH_TTL_MS = 15_000`).
- Stale-but-usable TTL: **120 seconds** (`QUOTE_CACHE_STALE_TTL_MS = 120_000`).
- After 120s from last cache: entry expires, returns `null`.
- `getConfiguredQuoteCacheBackendName()` — reads `QUOTE_CACHE_BACKEND` env. If `'supabase'`, uses persistent cache; otherwise memory-only.
- Supabase cache is a soft fallback: if Supabase read fails, falls back to in-memory.

### 3.3 Supabase Persistent Quote Cache

**File:** `src/lib/server/marketData/supabaseQuoteCache.ts`

**Status: Implemented. Requires `QUOTE_CACHE_BACKEND=supabase` and Supabase credentials.**

- Table: `market_quote_cache`
- Columns: `cache_key`, `symbol`, `market`, `provider`, `source`, `quote_json`, `cached_at`, `expires_at`, `fresh_until`, `stale_until`, `schema_version`, `last_refresh_status`, `last_error_code`, `updated_at`.
- `readSupabaseQuoteCacheEntry(identity)` — safe read with error handling.
- `writeSupabaseQuoteCacheSuccess(snapshot)` — upsert on `cache_key`.
- `writeSupabaseQuoteCacheRefreshFailure(identity, errorCode)` — records failure status.
- `providerMeta` is NOT stored in `quote_json` — explicitly excluded at build time.
- Raw KIS fields (`stck_prpr`, `prdy_vrss`, etc.) are never stored in `quote_json`.

### 3.4 Quote Orchestration

**File:** `src/lib/server/marketData/quotes.ts`

**Status: Implemented. Only KR market supported.**

- `getQuoteSnapshot(identity, options?)`:
  1. Validates: fails immediately for non-KR market (returns `SYMBOL_UNSUPPORTED`).
  2. Checks configured cache (memory or Supabase).
  3. If cache miss or stale: calls provider (`getKisQuoteSnapshot` by default, injectable).
  4. If provider success: writes to cache, returns `fresh`.
  5. If provider failure: checks for stale-but-usable cache fallback.
  6. If no usable cache: returns provider error envelope.
- Stale-but-usable fallback is explicit — never silently returns stale data as fresh.

### 3.5 Portfolio Valuation Layer

**File:** `src/lib/server/portfolioValuation.ts`

**Status: Implemented. FX not supported.**

- `buildPortfolioValuationFromQuotes(input)`:
  - Requires `positions[]`, `quotesBySymbol: Record<string, QuoteSnapshot | null>`, `baseCurrency`.
  - `totalMarketValue` is `null` when positions span multiple currencies (KRW + USD) — cross-currency aggregation requires FX which is not yet implemented.
  - `providerMeta` is intentionally excluded from all `PortfolioValuationRow` output.
  - `staleState` summary: `fresh` (all fresh), `stale-but-usable` (partial or stale rows), `unavailable` (no quotes).

### 3.6 Portfolio Valuation API Route

**File:** `src/pages/api/portfolio/valuation.ts`

**Status: Fixture-only. `source=live` is explicitly rejected.**

- `POST /api/portfolio/valuation` accepts JSON body with `portfolioId`, `baseCurrency`, `positions[]`, optional `source`.
- `source` defaults to `'fixture'`.
- If `source !== 'fixture'`: returns `400 UNSUPPORTED_SOURCE` — "Only source=fixture is supported. Live quote sources are not enabled."
- Position validation: `market` must be `KR` or `US`; `assetType` must be `stock` or `etf`; `currency` must be `KRW` or `USD`.
- Maximum 100 positions per request.
- Returns full `PortfolioValuationSummary` using `buildPortfolioValuationFromQuotes` with fixture quotes.

### 3.7 Fixture Quotes

**File:** `src/lib/server/portfolioValuationFixture.ts`

**Status: KR symbols only. 4 synthetic symbols.**

Supported fixture symbols: `005930` (Samsung), `000660` (SK Hynix), `035420` (NAVER, stale-but-usable), `069500` (KODEX 200 ETF).  
US symbols (`AAPL`, `NVDA`, `SPY`, `QQQ`) are NOT in fixture — they return `null` from `resolveFixtureQuotes`.

### 3.8 FX Adapter

**Status: Not yet implemented.**

No FX client, no FX provider interface, no `fx` modules in `src/lib`. `buildPortfolioValuationFromQuotes` explicitly leaves `totalMarketValue = null` for mixed-currency portfolios with the comment: "Cross-currency aggregation (KRW + USD positions) requires FX, which is not yet implemented."

FX provider selection remains pending. Options to evaluate in a later phase:
- KIS overseas FX rate endpoint (if available in the account tier)
- Separate lightweight FX provider (e.g., open exchange rate API with caching)
- Static daily rate fixture for preview testing

### 3.9 Existing Smoke Scripts

| Script | Safety for Claude Code | Notes |
|--------|----------------------|-------|
| `smoke:persistent-quote-cache` → `smoke_persistent_quote_cache_adapter.mjs` | **Safe — mocked** | Uses `createMockClient`, no live Supabase, no env reads |
| `smoke:kis-quote-live:dry` → `owner_smoke_kis_quote_live.mjs` | **Owner-only** | Requires 5 explicit guard env vars + KIS credentials |
| `smoke:persistent-quote-cache-live:dry` → `owner_smoke_persistent_quote_cache_live.mjs` | **Owner-only** | Requires Supabase guard env vars + credentials |
| `smoke:supabase-cache-live-kis-quote:dry` → `owner_smoke_supabase_cache_live_kis_quote.mjs` | **Owner-only** | Requires KIS + Supabase guards + credentials |

### 3.10 Existing Static Checkers

- `check:kis-valuation-design` — validates Phase 3BU pre-design doc. Static, no-network.
- `check:kis-quote-adapter-mocked` — validates kisClient.ts structure and mirrors valuation computation logic with synthetic data. Static + mocked behavioral, no-network.
- `check:kis-runtime-guard` and `check:kis-error-fallback` — validate runtime guard and error fallback policies. Static.

### 3.11 Missing Pieces for Live Preview

| Gap | Impact |
|-----|--------|
| `source=live` not enabled in valuation API | Cannot use live quotes via `/api/portfolio/valuation` |
| US quote support not implemented in kisClient | US stocks/ETFs (AAPL, NVDA, SPY, QQQ) unavailable |
| FX adapter not implemented | Mixed-currency portfolio totals remain `null` |
| `market_quote_cache` Supabase table: assumed to exist | Supabase cache requires prior table setup |
| US fixture quotes absent | US positions show `unavailable` staleState in current fixture mode |

---

## 4. Proposed Preview Smoke Scope

The first preview smoke focuses on owner-controlled, local single-symbol tests.

**In scope for Phase 3DM preview:**
- KR stock quote: single symbol preview (read-only, no account context)
- KR ETF quote: single symbol preview (same endpoint as stock)
- USD/KRW FX: manual fixture rate for preview (no live FX provider yet)
- Small mixed portfolio valuation preview (KR-only positions first; USD-FX deferred)

**Out of scope for Phase 3DM:**
- US stock and ETF live quotes (endpoint not implemented)
- Cross-currency totalMarketValue (requires FX)
- Source=live in production API route
- Supabase cache live writes (requires further owner setup)
- Dividend data (deferred)
- Chart data (not implemented, returns NOT_IMPLEMENTED)

---

## 5. Proposed Symbol Set

Based on existing fixture and metadata coverage:

| Symbol | Market | Type | Status |
|--------|--------|------|--------|
| `005930` | KR | stock | In fixture; ready for live KR preview |
| `000660` | KR | stock | In fixture; ready for live KR preview |
| `069500` | KR | etf | In fixture; KR ETF via domestic endpoint |
| `035420` | KR | stock | In fixture (stale-but-usable); good for cache/freshness tests |
| `AAPL` | US | stock | NOT supported by kisClient; US endpoint pending |
| `NVDA` | US | stock | NOT supported by kisClient; US endpoint pending |
| `SPY` | US | etf | NOT supported by kisClient; US endpoint pending |
| `QQQ` | US | etf | NOT supported by kisClient; US endpoint pending |
| `USD/KRW` | FX | — | No FX adapter; manual fixture rate only for preview |

**Phase 3DM smoke should use KR symbols only**: `005930`, `000660`, `069500`.  
US symbols and USD/KRW FX are deferred to a later phase that implements the US overseas endpoint and FX adapter.

---

## 6. Environment Readiness Checklist

Required environment variables for KIS live quote preview (names only — do not share values):

| Variable | Purpose | Required for |
|----------|---------|-------------|
| `KIS_APP_KEY` | KIS OAuth app key | All live KIS quote calls |
| `KIS_APP_SECRET` | KIS OAuth app secret | All live KIS quote calls |
| `KIS_BASE_URL` | KIS API base URL (paper trading or live) | All live KIS quote calls |
| `KIS_ENABLE_LIVE_QUOTES` | Feature flag; must be `"true"` | Enabling any live quote in non-production runtime |
| `KIS_ENABLE_PREVIEW_LIVE_QUOTES` | Required on Vercel Preview | Only if testing on Vercel Preview |

**Must be absent:**
| Variable | Why |
|----------|-----|
| `KIS_ACCOUNT_NO` | If present, kisClient blocks with `production_not_allowed` — quote-only scope enforced |

**For Supabase persistent cache (optional, later phase):**
| Variable | Purpose |
|----------|---------|
| `QUOTE_CACHE_BACKEND` | Set to `"supabase"` to enable; leave unset for memory-only |
| `PUBLIC_SUPABASE_URL` | Supabase project URL |
| `PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (required for cache writes) |

**For owner-run smoke scripts (additional guard variables):**

The `owner_smoke_kis_quote_live.mjs` script requires these guard env vars set to exact values before it enters live mode:
- `PHASE_3Y_LIVE_KIS_SMOKE=OWNER_APPROVED`
- `PHASE_3Y_RUNTIME_CONFIRMED=local-non-production-confirmed`
- `PHASE_3Y_READ_ONLY_SCOPE_CONFIRMED=OWNER_CONFIRMS_READ_ONLY_QUOTE_ONLY`
- `PHASE_3Y_PROVIDER_QUOTA_RISK_ACCEPTED=OWNER_ACCEPTS_KIS_QUOTA_RISK`
- `PHASE_3Y_NO_ACCOUNT_APIS_CONFIRMED=OWNER_CONFIRMS_NO_ACCOUNT_APIS`

**For FX:** No env variable names assigned yet. FX provider selection is pending.

---

## 7. Smoke Runbook

### Stage 0 — No-Network Static Validation (Claude Code-safe)

```
npm run check:kis-fx-preview-smoke-plan
npm run check:kis-valuation-design
npm run check:kis-quote-adapter-mocked
npm run check:kis-runtime-guard
npm run check:kis-error-fallback
npm run build
```

All of the above are static or mocked. No network calls, no env reads, no live KIS.

**Expected outcome:** All pass. Build succeeds.

---

### Stage 1 — Mocked Adapter Validation (Claude Code-safe)

```
npm run smoke:persistent-quote-cache
```

`smoke_persistent_quote_cache_adapter.mjs` compiles TypeScript in-memory and runs behavioral tests against a mock Supabase client. No live calls. No env reads.

**Expected outcome:** All mocked cache scenarios pass (read, write, stale, failure).

---

### Stage 2 — Dry-Run Request Construction Validation (Claude Code-safe, inspection only)

Inspect `owner_smoke_kis_quote_live.mjs` to confirm:
- Guard env check runs first (presence-only, no value printing)
- Production runtime is blocked
- `KIS_ACCOUNT_NO` absence is enforced
- Sanitized output with forbidden pattern filter active

Do not run this script from Claude Code.

---

### Stage 3 — Owner-Only: Single KR Stock Quote Preview

**Owner must run on local machine with KIS credentials and guard env vars set.**

```bash
# Set guard vars (example — exact values required)
PHASE_3Y_LIVE_KIS_SMOKE=OWNER_APPROVED \
PHASE_3Y_RUNTIME_CONFIRMED=local-non-production-confirmed \
PHASE_3Y_READ_ONLY_SCOPE_CONFIRMED=OWNER_CONFIRMS_READ_ONLY_QUOTE_ONLY \
PHASE_3Y_PROVIDER_QUOTA_RISK_ACCEPTED=OWNER_ACCEPTS_KIS_QUOTA_RISK \
PHASE_3Y_NO_ACCOUNT_APIS_CONFIRMED=OWNER_CONFIRMS_NO_ACCOUNT_APIS \
npm run smoke:kis-quote-live:dry
```

**Expected outcome (sanitized):** Single KR stock quote returns price, currency, staleState. No raw KIS fields in output. Sanitized step log with `sanitized=true`.

---

### Stage 4 — Owner-Only: Small Mixed KR Portfolio Preview

After Stage 3 passes, owner tests a small portfolio of KR symbols using the existing mocked valuation flow or a future `source=live` valuation route.

This requires extending `POST /api/portfolio/valuation` to support `source=live` (a future phase task, NOT done in Phase 3DL).

**Expected outcome:** KR positions show live `currentPrice`, `marketValue`, `staleState=fresh`. Mixed-currency positions show `marketValue=null` until FX is integrated.

---

### Stage 5 — Owner-Only: Cache/Freshness Preview

If Supabase cache is enabled (`QUOTE_CACHE_BACKEND=supabase`):

```bash
npm run smoke:persistent-quote-cache-live:dry
```

This requires Supabase guard env vars + credentials. Owner-only.

**Expected outcome:** Fresh quote written to Supabase. Second read returns cached result within fresh TTL. After 15s, returns stale-but-usable. After 120s, returns unavailable.

---

### Stage 6 — UI Preview (Later Phase Only)

No UI changes in this phase. UI preview integration (`source=live` in portfolio page, freshness labels, loading states) is deferred to Phase 3DM or later.

---

## 8. API / UI Integration Plan for Later Phase

When `source=live` is enabled in `POST /api/portfolio/valuation`:

- `source=fixture` remains the default for all users
- `source=live` enabled only via explicit owner/dev query param or env flag
- `source=auto` deferred until cache/freshness semantics are stable and tested
- UI labels for live preview:
  - Use `조회 시점 기준` instead of `실시간`
  - Use `최근 조회 기준` for stale-but-usable
  - Use `데이터 제공 지연 가능` as a permanent disclosure note
  - Use `연동 실패` or `데이터 일시 불가` for provider failure
- Loading state: show cost-basis skeleton while quote is loading, do not show `0` or fabricated price
- Error state: if live provider fails, show `unavailable` state; do not silently fall back to fixture quote as if live succeeded
- No `실시간` wording in any user-facing copy

### Minimum field requirements for live preview:

`PortfolioValuationRow` fields already exist:
- `currentPrice` — from live `QuoteSnapshot.price`
- `marketValue` — computed from `currentPrice × quantity`
- `costBasis` — already computed from `buyPrice × quantity`
- `unrealizedPnl` — `marketValue - costBasis`
- `unrealizedPnlPct` — `unrealizedPnl / costBasis * 100`
- `staleState` — `fresh` | `stale-but-usable` | `unavailable`
- `quoteAsOf` — from `QuoteSnapshot.asOf`

No schema changes needed for live preview. The existing `PortfolioValuationRow` type is sufficient.

---

## 9. Cache and Freshness Policy

**Current state:**
- In-memory cache: exists, always active. Fresh TTL: 15s. Stale TTL: 120s.
- Supabase persistent cache: implemented, opt-in via `QUOTE_CACHE_BACKEND=supabase`. Requires `market_quote_cache` table.

**No cache migration in this phase.** The Supabase table schema is assumed to be in place from prior phases.

**Freshness labeling policy:**
| staleState | UI wording |
|------------|-----------|
| `fresh` | `조회 시점 기준` |
| `stale-but-usable` | `최근 조회 기준 (일시 지연)` |
| `unavailable` | `데이터 일시 불가` |
| `sample` (fixture) | (no live-data wording; no wording implying current price) |

**Suggested TTL for future review:**
- Fresh TTL 15s is appropriate for intraday quote preview (matches typical KIS polling guidance).
- Stale TTL 120s provides a 2-minute grace window for provider outage. This should be reviewed against KIS rate limit policy before enabling production live quotes.

---

## 10. Error and Fallback Policy

1. **If KIS quote succeeds:** return `ProviderResult<QuoteSnapshot>` with `ok: true`, `staleState: 'fresh'`. Write to cache.
2. **If KIS quote fails:** return `ProviderErrorEnvelope` with `ok: false`, appropriate `code` (`PROVIDER_UNAVAILABLE`, `PROVIDER_RATE_LIMITED`, `CONFIG_MISSING`, etc.). Do NOT substitute fixture quote silently.
3. **If stale cache exists (within 120s):** return stale snapshot with `staleState: 'stale-but-usable'` and `fallback.reason: 'cache-stale-provider-failed'`.
4. **If no usable cache:** return provider error envelope. UI shows `데이터 일시 불가`.
5. **`source=auto` deferred** until fallback and freshness semantics are fully tested and UI wording is approved.
6. **`source=live` failures never fall back to fixture** — live failure is explicit, not hidden.

---

## 11. Risk Register

| Risk | Mitigation |
|------|-----------|
| KIS credential exposure | `shouldLogValue: false` enforced; smoke script has forbidden output pattern filter; credentials never printed |
| Wrong endpoint by market (KR vs US) | `validateKisDomesticQuoteInput` blocks non-KR immediately; US returns `SYMBOL_UNSUPPORTED` |
| KIS rate limiting | `429` handling exists; `PROVIDER_RATE_LIMITED` returned; cache reduces request frequency |
| FX provider mismatch | FX deferred; `totalMarketValue=null` for mixed-currency until FX is implemented |
| Silent fixture fallback confusion | Explicitly blocked — live failure returns error envelope, not fixture data |
| Stale data mistaken for live | `staleState` field always present; UI wording must not use `실시간` |
| Market holiday / closed market | `marketState: 'closed'` in snapshot; no market state is fabricated |
| Currency conversion ambiguity | `totalMarketValue=null` when currencies differ; never coerced without FX |
| Server load from polling | No polling, no `setInterval`, no cron. Quote requests only on user-triggered load |
| Production runtime KIS calls | Hard-blocked via `classifyRuntime()` returning `production_not_allowed` |
| `KIS_ACCOUNT_NO` present | If set, `getKisQuoteConfigReadiness` returns `production_not_allowed` immediately |

---

## 12. Recommended Next Phase

**Phase 3DM — KIS + FX Mocked Adapter Contract Hardening**

Rationale: The existing mocked adapter checker (`check:kis-quote-adapter-mocked`) covers computation logic. However, the following are not yet covered by static checks:
- KIS token acquisition flow (mocked)
- KIS quote response parsing with edge-case fields
- Quote cache fresh/stale/expired state transitions
- `getQuoteSnapshot` orchestration layer (cache miss, provider fresh, stale fallback paths)
- `source=live` path in valuation API route (not yet implemented)

Phase 3DM should:
1. Harden mocked adapter coverage for the above paths
2. Add `source=live` support to `POST /api/portfolio/valuation` behind an explicit flag
3. Prepare the owner-run single-quote smoke for `005930`, `000660`, `069500`
4. Establish the FX provider decision (KIS FX endpoint vs separate provider vs static fixture)

Alternatively, if the owner is ready to run the existing `owner_smoke_kis_quote_live.mjs` against real KIS credentials, Phase 3DM can be an **Owner-Run KIS Single Quote Preview** instead of further mocked coverage.
