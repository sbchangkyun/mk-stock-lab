# Phase 3BB — GNews Live Fetch Adapter Design + Kill-switch Contract v0.1

## 1. Title and Metadata

- **Phase**: 3BB
- **Type**: GNews live fetch adapter design and kill-switch contract
- **Status**: Designed
- **Live GNews calls**: not performed
- **Live adapter implementation**: not performed
- **API route runtime change**: none
- **Database changes**: none
- **Supabase changes**: none
- **Home integration**: none
- **Deployment**: not performed
- **Date**: 2026-06-24

---

## 2. Objective

Phase 3BB defines the future live adapter architecture and safety contract before any live fetch code is written. The purpose is to record durable, reviewable design decisions for the `GNEWS_API_KEY`-gated live fetch path so that future implementation phases can follow the contract without re-litigating environment variable policy, kill-switch behavior, failure handling, or normalization rules.

No live GNews call is performed. No live adapter is implemented. No API route runtime behavior is changed.

---

## 3. Current Baseline

- The Phase 3BA route (`src/pages/api/news/market-feed.ts`) is fixture-backed only.
- `/api/news/market-feed` currently returns `source: "fixture"` and `liveEnabled: false` for all requests.
- The response builder (`src/lib/news/gnewsMarketFeedResponse.mjs`) is a pure no-network utility.
- The public article sanitizer returns exactly 9 public fields and excludes all 18 internal storage fields.
- No environment variable is read in the current route or helper.
- No route runtime behavior changes are made in this phase.

---

## 4. Future Architecture

```
Client / Home UI
  → GET /api/news/market-feed
    → route handler (market-feed.ts)
      → response builder (gnewsMarketFeedResponse.mjs)
        → source selector (future: liveEnabled check + kill-switch guard)
          ├─ fixture source (current: always)
          └─ live source (future: only when GNEWS_LIVE_ENABLED=true)
              → GNews live adapter (future: gnewsLiveFetchAdapter.mjs)
                → normalizer (normalizeGnewsBatch)
                  → policy engine (gnewsNewsPolicy.mjs)
                    → sanitized response (sanitizeMarketNewsArticle)
```

### Architecture constraints

- Client must never call GNews directly. GNews is a server-side-only dependency.
- Only the server route handler may trigger the live adapter.
- The live adapter module must remain isolated from all UI code, Astro pages, and client-side components.
- The route must maintain deterministic fallback behavior: if live mode is disabled or fails, the response must be fixture-backed or return a sanitized unavailable response — never crash with a raw error.
- The source selector must be a pure server-side decision evaluated at request time.

---

## 5. Future Live Adapter Module Contract

**Proposed module path**: `src/lib/news/gnewsLiveFetchAdapter.mjs`

This file must not be created in Phase 3BB. The following is a design-only contract for future implementation.

### 5.1 `buildGnewsSearchUrl(queryDefinition, options)`

- **Purpose**: Constructs the GNews API search URL for a single query theme.
- **Inputs**: `queryDefinition` object (queryKey, queryString, category), `options` (maxResults, lang, country, sortby, in).
- **Outputs**: URL string (type: string, never a live Request object in design context).
- **Safety**: Must not append API key to URL in any log. Must not construct a client-callable URL. Must not reference `PUBLIC_GNEWS_API_KEY`.

### 5.2 `fetchGnewsTheme(queryDefinition, options)`

- **Purpose**: Fetches GNews search results for a single query theme using server-side key.
- **Inputs**: `queryDefinition`, `options` (apiKey, timeout, maxResults).
- **Outputs**: `{ ok: boolean, rawArticles?: object[], error?: string }` — raw articles returned only within the adapter, never returned to route consumers.
- **Safety**: `apiKey` must come from `GNEWS_API_KEY` env var only. Must never log the key. Must never include the key in response objects. Must time out within 8 seconds. Must fail closed on any non-2xx status.

### 5.3 `fetchGnewsMarketNewsBatch(queryDefinitions, options)`

- **Purpose**: Fetches results for all 6 query themes sequentially. Returns partial results if some themes fail.
- **Inputs**: Array of `queryDefinition` objects, `options` (apiKey, timeout).
- **Outputs**: `{ results: Array<{ queryKey, ok, count, error? }>, totalFetched: number, failedThemes: string[] }`.
- **Safety**: Must not abort all themes on a single failure. Failed theme must record a sanitized error label, not a raw provider error. Must not include any raw provider response in the output object.

### 5.4 `normalizeGnewsArticle(rawArticle, context)`

- **Purpose**: Maps a single raw GNews API article to a `MarketNewsArticle` shape.
- **Inputs**: `rawArticle` (raw GNews API object), `context` (category, queryKey, fetchedAt).
- **Outputs**: Normalized `MarketNewsArticle` minus DB-assigned fields (`id`, `canonicalUrlHash`, `titleHash`).
- **Field mapping**:

| `MarketNewsArticle` field | GNews source |
|---|---|
| `title` | `article.title` |
| `description` | `article.description` |
| `url` | `article.url` |
| `imageUrl` | `article.image ?? null` |
| `sourceName` | `article.source.name` |
| `sourceUrl` | `article.source.url` |
| `publishedAt` | `article.publishedAt` |
| `fetchedAt` | current server timestamp (ISO string) |
| `category` | from context |
| `queryKey` | from context |
| `language` | `"ko"` (fixed) |
| `country` | `"kr"` (fixed) |
| `provider` | `"gnews"` (fixed) |
| `rawProviderStored` | `false` (always) |

- **Safety**: `rawProviderStored` must always be forced to `false`. Any GNews-provider-only fields (e.g., `source.id`, internal pagination tokens) must be discarded. SHA-256 hash fields (`canonicalUrlHash`, `titleHash`) must be computed server-side and are not GNews-provided.

### 5.5 `normalizeGnewsBatch(rawResponse, context)`

- **Purpose**: Normalizes all articles from a batch GNews API response.
- **Inputs**: `rawResponse` (GNews API response object), `context` (queryKey, category, fetchedAt).
- **Outputs**: `{ articles: MarketNewsArticle[], count: number, truncated: boolean }`.
- **Safety**: Must call `normalizeGnewsArticle` for each item. Must discard articles with missing `url` or `title`. Must never return the raw `rawResponse` or any sub-object of it to route consumers.

### 5.6 `sanitizeGnewsAdapterError(error)`

- **Purpose**: Converts a raw adapter error into a sanitized, loggable label.
- **Inputs**: Any error object or thrown value from `fetchGnewsTheme`.
- **Outputs**: `{ label: string, retryable: boolean }` — `label` is one of: `"auth_error"`, `"rate_limit"`, `"server_error"`, `"timeout"`, `"network_error"`, `"empty_response"`, `"unknown_error"`. Never includes raw error messages, stack traces, or provider response bodies.
- **Safety**: Must never rethrow or propagate raw error objects outside the adapter module.

### 5.7 `summarizeGnewsLiveFetchResult(result)`

- **Purpose**: Produces a sanitized summary object safe for route-level metadata or internal logs.
- **Inputs**: Return value of `fetchGnewsMarketNewsBatch`.
- **Outputs**: `{ totalFetched: number, successThemes: number, failedThemes: number, failedThemeKeys: string[] }`.
- **Safety**: Must not include article counts per category that could infer API key validity. Must not include raw error details. Must not include the API key or any partial key.

---

## 6. Environment Variable Policy

### Preferred server-side variable

| Variable | Scope | Purpose |
|---|---|---|
| `GNEWS_API_KEY` | Server-only | Primary GNews API key for live fetches |

- `GNEWS_API_KEY` is the preferred variable for future live implementation.
- It must remain server-only and must never be exposed to the browser.
- It must not be logged in any log level (info, debug, error).
- It must not be returned in API responses, error responses, or metadata objects.
- It must not appear in planning docs, fixture files, result logs, or smoke output.

### Legacy variable

| Variable | Scope | Purpose |
|---|---|---|
| `PUBLIC_GNEWS_API_KEY` | Intended server-side only (misleading name) | Temporary server-side compatibility fallback only |

- `PUBLIC_GNEWS_API_KEY` may exist in the current environment as a historical artifact.
- It is not the preferred variable and should not be the basis for new implementation.
- It may be used only as a temporary server-side compatibility fallback in a future explicit implementation phase, with explicit owner acknowledgment.
- **Browser/client code must never reference `import.meta.env.PUBLIC_GNEWS_API_KEY`.** The `PUBLIC_` prefix makes this variable accessible to the Astro client bundle, which is a security risk for an API key.
- Future implementation should migrate away from `PUBLIC_GNEWS_API_KEY` entirely and use `GNEWS_API_KEY` as the single server-side source.

### Variable priority for future implementation

```
GNEWS_API_KEY            ← preferred, use first
PUBLIC_GNEWS_API_KEY     ← fallback only if GNEWS_API_KEY is absent and explicit owner approval exists
```

If neither variable is set, the live adapter must fail closed (not fall through to an empty string or null key).

---

## 7. Kill-switch Policy

### Kill-switch variable

`GNEWS_LIVE_ENABLED`

### Default state

**Disabled.** Any missing, empty, or non-`"true"` value is treated as disabled. The kill switch must fail closed:

- `GNEWS_LIVE_ENABLED` absent → disabled
- `GNEWS_LIVE_ENABLED=""` → disabled
- `GNEWS_LIVE_ENABLED="false"` → disabled
- `GNEWS_LIVE_ENABLED="1"` → disabled
- `GNEWS_LIVE_ENABLED="true"` → enabled (only valid enabled value)

### Disabled behavior

- Route continues to serve fixture-backed responses (`source: "fixture"`, `liveEnabled: false`).
- The live adapter module must not be imported or called when kill switch is disabled.
- The `GNEWS_API_KEY` must not be read from env when kill switch is disabled.
- No GNews request is made.

### Enabled behavior

- Allowed only in owner-approved smoke phase and future production-readiness phase.
- Route may call the live adapter only from the server-side route handler.
- Response reflects `liveEnabled: true` and `source: "gnews_live"` or `source: "gnews_cache"`.
- Live mode must always be gated behind the kill switch; enabled state is per-request, not a global singleton.

### Production guard

- Live mode in Production remains blocked until a future explicit production-readiness phase is approved.
- Recommended implementation: if `VERCEL_ENV=production`, treat `GNEWS_LIVE_ENABLED` as disabled regardless of its value until the production guard is removed in a future phase.
- This ensures Preview environment experiments do not accidentally promote to Production.

---

## 8. GNews Query Strategy Mapping

The 6 query themes are confirmed from Phase 3AY policy:

| Category enum | Korean label | queryKey | Korean search terms |
|---|---|---|---|
| MARKET_STOCKS | 증시·주식 | market_stocks | 증시 OR 주식 OR 코스피 OR 코스닥 OR 상장사 OR 실적 OR 반도체 OR 이차전지 OR ETF |
| MACRO_POLICY | 매크로·정책 | macro_policy | 경제 OR 경기 OR 금리 OR 물가 OR 한국은행 OR 금융위 OR 금감원 OR 정부정책 OR 세제 |
| FX | 환율·외환 | fx | 환율 OR 원달러 OR 달러 OR 엔화 OR 위안 OR 유로 OR 외환 OR 강달러 |
| OIL_COMMODITIES | 유가·원자재 | oil_commodities | 유가 OR WTI OR 브렌트유 OR 원유 OR 금값 OR 금 OR 은 OR 원자재 |
| CRYPTO_DIGITAL_ASSETS | 코인·가상자산 | crypto_digital_assets | 비트코인 OR 코인 OR 가상자산 OR 암호화폐 OR 이더리움 OR NFT OR 거래소 |
| PERSONAL_FINANCE | 재테크·금융생활 | personal_finance | 재테크 OR 금융 OR 부동산 OR 청약 OR 적금 OR 대출 OR 연금 OR ISA |

### Intended future GNews request parameters

```
lang=ko
country=kr
max=10
in=title,description
sortby=publishedAt
```

### Request budget

| Metric | Value |
|---|---|
| Queries per refresh | 6 |
| Refreshes per day | 12 |
| Total requests/day | 72 requests/day |
| Headroom against 100/day budget | 28 requests/day |

The 28 requests/day headroom provides buffer for retries, partial re-queries, and smoke test runs without exceeding a free-plan style 100/day limit.

---

## 9. Refresh and Cache Policy

### Refresh interval

- Target: **2 hours** between full refreshes (6 queries × 12 refreshes/day = 72 requests/day).
- Do not claim real-time news delivery. Articles may be up to 2 hours old.

### Suggested response cache headers (future implementation)

```
Cache-Control: s-maxage=7200, stale-while-revalidate=21600
```

- `s-maxage=7200` — CDN caches response for 2 hours.
- `stale-while-revalidate=21600` — CDN may serve stale content for up to 6 hours while revalidating.

### UI copy guidance

Avoid "real-time" or "live" language in the news feed UI. Suggested Korean copy:

- "시장 뉴스 요약"
- "최근 수집 기준"
- "데이터 제공 지연이 있을 수 있습니다."

---

## 10. Failure and Fallback Policy

| Failure scenario | Future recommended behavior |
|---|---|
| Missing API key | Return fixture fallback (`source: "fixture"`) or sanitized unavailable response; log sanitized label `"missing_api_key"`. |
| Kill switch disabled | Serve fixture source. No error returned. `liveEnabled: false`. |
| GNews 401 / 403 | Return fixture fallback. Log sanitized label `"auth_error"`. Never expose key value. |
| GNews 429 / rate limit | Return cached or fixture fallback. Set `staleState: "rate_limited"`. Log `"rate_limit"`. Do not retry immediately. |
| GNews 5xx / server error | Return fixture fallback. Log `"server_error"`. Do not propagate raw response. |
| Network timeout | Return fixture fallback. Log `"timeout"`. Apply 8-second server-side timeout. |
| Empty result | Return articles from other successful themes. Log `"empty_response"` for that theme. Do not treat as fatal. |
| Invalid provider payload | Discard malformed article(s). Continue with valid items. Log count of discarded articles. |
| Partial query failure | Return articles from successful themes. Set `staleState: "partial"`. Log `failedThemeKeys`. |

### General fallback rules

- Never expose raw provider errors in API responses or logs.
- Never expose stack traces in API responses.
- Never crash the route on a single theme failure.
- Always return a valid response shape, even if `articles` is empty.
- Fallback-to-fixture is always safe and must remain available as last resort.

---

## 11. Normalization Policy

### Raw GNews article field mapping

Raw GNews API article fields must be mapped to the `MarketNewsArticle` schema. Provider-only internal fields must be discarded.

| Target field | Source | Notes |
|---|---|---|
| `title` | `rawArticle.title` | Trim whitespace |
| `description` | `rawArticle.description` | May be null |
| `url` | `rawArticle.url` | Validate: must be https |
| `imageUrl` | `rawArticle.image ?? null` | May be null |
| `sourceName` | `rawArticle.source.name` | |
| `sourceUrl` | `rawArticle.source.url` | |
| `publishedAt` | `rawArticle.publishedAt` | Must be valid ISO 8601 |
| `fetchedAt` | Server timestamp at request time | Set by adapter, not GNews |
| `category` | From query context | Not provided by GNews |
| `queryKey` | From query context | Not provided by GNews |
| `language` | `"ko"` | Fixed |
| `country` | `"kr"` | Fixed |
| `provider` | `"gnews"` | Fixed |
| `rawProviderStored` | `false` | Always forced to false |

### Hash fields

`canonicalUrlHash` and `titleHash` must be computed server-side using SHA-256 on the normalized URL and title respectively. These fields are not provided by GNews and must not be assumed from provider data.

### Raw payload policy

- Raw provider response must not be persisted in UI-facing data.
- Raw provider response must not be returned to route consumers.
- Any provider-only fields (source IDs, pagination cursors, internal metadata) must be discarded unless explicitly mapped above.
- `rawProviderStored: false` is a mandatory invariant for all normalized articles.

---

## 12. Response Contract Preservation

Future live mode must preserve all Phase 3BA response contracts:

### Preserved contracts

- **Home response shape**: `{ ok, mode, source, liveEnabled, count, totalActive, lastRefreshedAt, staleState, articles }`.
- **List response shape**: `{ ok, mode, source, liveEnabled, pagination, oldestFetchedAt, newestFetchedAt, articles }`.
- **Public article fields**: exactly the 9 public fields from `sanitizeMarketNewsArticle`.
- **Sanitized error shape**: `{ ok: false, error: { code, message } }`.
- **Mode semantics**: `mode=home` returns up to 6 articles; `mode=list` paginates with `pageSize=10`, `maxPages=10`.
- **Exclusion of internal fields**: `canonicalUrlHash`, `titleHash`, `duplicateGroupId`, `isDuplicate`, `isActive`, `archivedAt`, `archiveReason`, `providerArticleId`, `rawProviderStored` must never appear in public responses.

### Allowed changes in live mode

- `source` may become `"gnews_live"`, `"gnews_cache"`, or `"fixture"` depending on actual data source for that response.
- `liveEnabled` must accurately report whether live mode was active: `true` only if the live adapter was called and succeeded; `false` otherwise.
- `lastRefreshedAt` in home mode may become a real ISO timestamp from the last successful GNews fetch.
- `staleState` may become `"live"`, `"cached"`, `"partial"`, `"rate_limited"`, or `"fixture"`.

---

## 13. Owner-run Smoke Validation Plan

This is a plan for a future owner-run phase only. No smoke test is executed in Phase 3BB.

### Proposed future smoke script

`scripts/owner_smoke_gnews_live_fetch.mjs`

### Proposed package script

`smoke:gnews-live:dry`

### Requirements for future smoke implementation

- Must require explicit owner action to run (`:dry` suffix convention signals owner-only).
- Must not run as part of `npm run build`, `npm test`, or any default CI validation.
- Must read `GNEWS_API_KEY` from the local owner environment only. Must never hardcode or print the key.
- Must call at most **2 query themes** per smoke run (not all 6). Caps GNews spend at 2 requests per run.
- Must print only sanitized output:
  - Theme key (e.g., `"fx"`, `"market_stocks"`)
  - Total articles fetched per theme (count only, e.g., `"fetched: 8"`)
  - Category label (e.g., `"FX"`)
  - Success/failure label (e.g., `"ok"`, `"auth_error"`)
- **Must not print**:
  - Article URLs
  - Article titles
  - Article descriptions
  - API key values (not even partial)
  - Raw GNews JSON
  - Raw provider error messages
  - Stack traces
  - Any env var names or values
- Must restore environment state if modified.
- Must fail closed: any unexpected error returns exit code 1 with a sanitized label only.
- Must not write to Supabase, any database, or any file except an optional sanitized result doc if explicitly requested in a future phase.
- Must confirm explicitly at startup that `GNEWS_LIVE_ENABLED=true` is set before proceeding.

---

## 14. Validation and Checker Strategy

### Phase 3BB (current)

This phase creates a design document and a static design checker only. No executable adapter code is introduced.

Static checker: `scripts/check_gnews_live_fetch_adapter_design_static_contract.mjs`
Package script: `check:gnews-live-adapter-design`

### Future implementation phases must include

- No-network adapter unit tests using mocked fetch (not live GNews).
- Owner-run smoke test (max 2 requests, sanitized output, `smoke:gnews-live:dry` convention).
- Forbidden pattern scan on adapter source (no `GNEWS_API_KEY` literals, no `PUBLIC_GNEWS_API_KEY` in client code).
- Response sanitizer tests: verify all 18 internal fields are excluded from public responses.
- Rate-limit and failure-path tests using mocked error responses.
- Build validation after adapter implementation.

---

## 15. Security Boundaries

- `GNEWS_API_KEY` is a secret. It must never appear in browser bundles, logs, responses, or documentation.
- No browser/client code may reference `import.meta.env.PUBLIC_GNEWS_API_KEY` for GNews calls.
- Raw provider payloads must not be stored in any UI-facing data structure.
- Raw provider errors must not be propagated to route consumers or client code.
- No server log entry may include an API key value at any log level.
- No stack trace may appear in any API response.
- GNews API calls must originate only from server-side route handlers via the adapter module.
- No Supabase storage until separately approved in a dedicated storage phase.
- No Production live mode until a dedicated production-readiness phase is explicitly approved.

---

## 16. Recommended Future Phases

| Phase | Title | Description |
|---|---|---|
| 3BC | GNews live adapter skeleton | Implement `src/lib/news/gnewsLiveFetchAdapter.mjs` with mocked fetch only. Kill switch disabled by default. No live GNews call. No env read. |
| 3BD | Owner-run GNews live smoke validation | Owner runs `smoke:gnews-live:dry`. Max 2 requests. Sanitized counts and category labels only. No raw payloads. |
| 3BE | Route live source selector | Add kill-switch-gated source selector to route. Live mode remains disabled in Production. `liveEnabled` accurately reported. |
| 3BF | Home market-news feed integration | Wire `/api/news/market-feed?mode=home` into the Home shell via SSR fetch. Uses fixture or live route contract. |
| 3BG | Paginated `/news` list page | `/news` route with `mode=list`, `page`, `category` filter, `pageSize: 10`, `maxPages: 10`. |
| 3BH | GNews storage/persistence design | Design Supabase schema and upsert policy for normalized articles. Owner-approved separately. |

---

## 17. Confirmed Non-actions

- No live GNews call occurred.
- No `gnews.io` request occurred.
- No external HTTP request occurred.
- No live adapter was implemented.
- No API route runtime behavior was changed.
- `src/pages/api/news/market-feed.ts` was not modified.
- `src/lib/news/gnewsMarketFeedResponse.mjs` was not modified.
- `src/lib/news/gnewsNewsPolicy.mjs` was not modified.
- No database or migration file was added.
- No Supabase query or write occurred.
- No Vercel env value was inspected or mutated.
- No Vercel CLI command was run.
- No deployment was performed.
- No deployed URL was called.
- No `.env*` content was read.
- No secret, key value, raw provider payload, Preview URL, Supabase URL, or credential-like value was recorded.
- No KIS provider logic was changed.
- No Supabase backend logic was changed.
- No Vercel config was changed.
- No auth/session logic was changed.
- No Home page runtime was changed.
- No UI component was changed.
- No `/news` page was created.
- No scheduled job or Vercel cron was added.
- No root README.md was changed.
- Claude memory files were not modified.
