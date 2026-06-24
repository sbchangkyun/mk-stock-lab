# Phase 3BC — GNews Live Adapter Skeleton with Mocked Fetch Result v0.1

## 1. Title and Metadata

- **Phase**: 3BC
- **Type**: GNews live adapter skeleton with mocked fetch validation
- **Status**: Implemented
- **Live GNews calls**: not performed
- **Adapter implementation**: skeleton only (no live fetch, no env reads, mocked fetch validation only)
- **Mocked fetch validation**: performed
- **API route runtime change**: none
- **Database changes**: none
- **Supabase changes**: none
- **Home integration**: none
- **Deployment**: not performed
- **Date**: 2026-06-24

---

## 2. Objective

Phase 3BC implements the adapter skeleton documented in Phase 3BB and validates it using mocked fetch inputs and synthetic mock provider responses. The goal is to prove URL construction, request orchestration, provider response normalization, sanitized error handling, SHA-256 hash generation, and result summarization are correct before any owner-run live smoke (Phase 3BD) is attempted.

No live GNews call is performed. No API key is read. No route behavior is changed. No env var is accessed.

---

## 3. Implementation Summary

| Artifact | Path |
|---|---|
| Adapter skeleton | `src/lib/news/gnewsLiveFetchAdapter.mjs` |
| Mock provider fixture | `src/data/fixtures/gnews_live_adapter_mock_response_v0.1.json` |
| Static adapter checker | `scripts/check_gnews_live_fetch_adapter_static_contract.mjs` |
| Mocked adapter checker | `scripts/check_gnews_live_fetch_adapter_mocked.mjs` |
| Policy static checker (updated) | `scripts/check_gnews_news_policy_static_contract.mjs` |
| Phase 3BB design checker (updated) | `scripts/check_gnews_live_fetch_adapter_design_static_contract.mjs` |
| Package scripts added | `check:gnews-live-adapter-static`, `check:gnews-live-adapter-mocked` |

The Phase 3BB design checker's "no adapter file" guard was updated to "adapter exists" to reflect the Phase 3BC implementation. The policy static checker gained a Phase 3BC artifact group.

---

## 4. Adapter Exports

`src/lib/news/gnewsLiveFetchAdapter.mjs` exports:

| Export | Type | Description |
|---|---|---|
| `GNEWS_ADAPTER_POLICY` | const object | Policy constants (DEFAULT_LANG, DEFAULT_COUNTRY, DEFAULT_MAX, DEFAULT_SEARCH_IN, DEFAULT_SORT_BY, MAX_THEMES_PER_SMOKE, MAX_ARTICLES_PER_THEME, PROVIDER, RAW_PROVIDER_STORED) |
| `GNEWS_QUERY_DEFINITIONS` | const array | 6 query definitions with queryKey, category, koreanLabel, queryString |
| `buildGnewsSearchUrl` | function | Deterministic URL builder using URLSearchParams, requires injected baseUrl and apiKey |
| `fetchGnewsTheme` | async function | Single-theme fetch requiring injected fetchFn, implements timeout via Promise.race |
| `fetchGnewsMarketNewsBatch` | async function | Multi-theme orchestrator with partial failure handling and maxThemes cap |
| `normalizeGnewsArticle` | function | Maps raw provider article to MarketNewsArticle-compatible shape with SHA-256 hashes |
| `normalizeGnewsBatch` | function | Normalizes provider response array, skips invalid items with sanitized warnings |
| `sanitizeGnewsAdapterError` | function | Maps error types to sanitized error objects with retryable flag |
| `summarizeGnewsLiveFetchResult` | function | Returns sanitized summary excluding URLs, titles, descriptions, and apiKey |

---

## 5. No-Network Design

- **fetchFn injection required**: All HTTP calls are made via an explicitly injected `fetchFn` argument. No global `fetch` is called anywhere in the adapter.
- **No env reads**: `apiKey` and `baseUrl` must be provided as function arguments. The adapter contains no `process.env` or `import.meta.env` references.
- **No live endpoint hardcoded**: The adapter does not contain any provider URL. The caller provides `baseUrl`.
- **baseUrl and apiKey injected**: Tests use `https://api.example.test` as baseUrl and a non-secret synthetic placeholder string as apiKey.
- **Mocked validation only**: The mocked checker passes synthetic fetchFn functions that return mock responses without any network activity.
- **Timeout implemented**: `fetchGnewsTheme` uses `Promise.race` with a configurable `timeoutMs` (default 8000 ms). Tests use `timeoutMs: 50` with a never-resolving mock to verify `provider_timeout` error response.

---

## 6. Normalization Behavior

### Raw-to-normalized field mapping

| Raw provider field | Normalized field | Notes |
|---|---|---|
| `article.title` | `title` | String, empty string if null |
| `article.description` | `description` | null if absent |
| `article.url` | `url` | String, empty string if null |
| `article.image` | `imageUrl` | null if absent |
| `article.source.name` | `sourceName` | Empty string or sourceFallback if absent |
| `article.source.url` | `sourceUrl` | Empty string if absent |
| `article.publishedAt` | `publishedAt` | Preserved as-is (not validated as ISO date) |
| `context.fetchedAt` | `fetchedAt` | From context, defaults to current ISO timestamp |
| `context.category` | `category` | From context |
| `context.queryKey` | `queryKey` | From context |

### Computed fields

| Field | Method |
|---|---|
| `canonicalUrlHash` | SHA-256 (hex) of URL with tracking params (utm_*, fbclid, gclid, _ga, ref) stripped |
| `titleHash` | SHA-256 (hex) of lowercased title with punctuation removed and whitespace collapsed |
| `id` | `pending_<first 16 hex chars of canonicalUrlHash>` (placeholder until DB assigns real ID) |
| `relevanceScore` | Initial score 50–80 based on presence of title (+10), description (+5), image (+5), source name (+5), publishedAt (+5) |

### Fixed invariants

| Field | Value |
|---|---|
| `rawProviderStored` | `false` (always) |
| `isDuplicate` | `false` |
| `isActive` | `true` |
| `duplicateGroupId` | `null` |
| `providerArticleId` | `null` |
| `archiveReason` | `'none'` |
| `language` | `'ko'` |
| `country` | `'kr'` |
| `provider` | `'gnews'` |

### Invalid item handling

- `null` or non-object rawArticle → `normalizeGnewsArticle` returns `null` → skipped in `normalizeGnewsBatch` with warning
- Article with null `url` or null `title` → normalized but skipped in `normalizeGnewsBatch` (url and title required)
- Invalid `publishedAt` string → preserved as-is, not rejected
- Missing image → `imageUrl: null`
- Missing `source.url` → `sourceUrl: ''`

---

## 7. Error Handling Behavior

All errors are sanitized before return. No stack traces, raw provider JSON, API keys, or full URLs are included in error responses.

| Code | Retryable | Description |
|---|---|---|
| `missing_fetch_fn` | false | fetchFn not provided to adapter function |
| `missing_base_url` | false | baseUrl not provided or empty |
| `missing_api_key` | false | apiKey not provided or empty |
| `invalid_query_definition` | false | queryDefinition missing queryString |
| `provider_http_error` | true | Non-200/429/401 HTTP response |
| `provider_rate_limited` | true | HTTP 429 |
| `provider_unauthorized` | false | HTTP 401 or 403 |
| `provider_timeout` | true | Promise.race timeout fired |
| `provider_invalid_payload` | false | JSON parse failure or articles field not an array |
| `provider_empty_result` | false | articles array is empty |
| `internal_unavailable` | true | Unexpected thrown error |

---

## 8. Mocked Validation Results

All validators run offline. No network requests were made.

| Script | Result |
|---|---|
| `npm run check:gnews-news-policy` | All checks passed (69/69). Exit 0 |
| `npm run check:gnews-news-engine` | 57/57 PASS |
| `npm run check:gnews-news-api-route` | All checks passed (35 groups validated). Exit 0 |
| `npm run check:gnews-news-api-response` | Checks passed: 61/61. Result: PASS |
| `npm run check:gnews-live-adapter-design` | All checks passed. Exit 0 |
| `npm run check:gnews-live-adapter-static` | All checks passed. Exit 0 |
| `npm run check:gnews-live-adapter-mocked` | Checks passed: 148/148. Result: PASS |
| `git diff --check` | CRLF line-ending warnings only. Exit 0 |
| `git status --short` | Expected new and modified files only |
| `npm run build` | Build complete in 4.09s. No errors. |

---

## 9. Key Findings

| Finding | Value |
|---|---|
| Mock fetch calls made | 12 |
| Normalized articles (from success theme) | 3 |
| Partial batch — theme successes | 1 of 2 |
| Partial batch — theme failures | 1 of 2 |
| SHA-256 hash generation | implemented (canonicalUrlHash, titleHash, both 64-char hex) |
| Tracking param stripping | confirmed (utm_* params stripped before hashing) |
| 429 rate limit case | sanitized as provider_rate_limited |
| 401 unauthorized case | sanitized as provider_unauthorized |
| 500 server error case | sanitized as provider_http_error |
| JSON parse failure case | sanitized as provider_invalid_payload |
| Empty articles case | sanitized as provider_empty_result |
| Timeout case (50ms) | sanitized as provider_timeout |
| Partial batch failure | ok: true when at least 1 theme succeeds |
| All-failure batch | ok: false |
| Forbidden adapter findings | 0 |
| Build errors | 0 |

Article titles and URLs are not recorded in this document.

---

## 10. Route Boundary

- `src/pages/api/news/market-feed.ts` is unchanged.
- The route still returns `source: "fixture"` and `liveEnabled: false` for all requests.
- The route does not import `gnewsLiveFetchAdapter.mjs`.
- `src/lib/news/gnewsMarketFeedResponse.mjs` is unchanged.
- `src/pages/index.astro` (Home page) does not import the live adapter.

---

## 11. Safety Boundaries

- No live GNews call was made.
- No `gnews.io` request was made.
- No external HTTP request was made.
- No env var was read in the adapter or in validator scripts.
- No real API key value was used, printed, or inferred.
- No route behavior was changed.
- No database or migration file was added.
- No Supabase query or write occurred.
- No Home integration was implemented.
- No deployment was performed.
- All mock URLs use `example.test` domains.
- The adapter `rawProviderStored` is `false` in all normalized articles.
- The adapter is server-side only and is not imported by any Astro page or UI component.

---

## 12. Remaining Limitations

- No owner-run live GNews smoke has been executed.
- No real GNews fetch has been performed.
- No route source selector with kill-switch has been implemented.
- No cache or storage layer exists.
- No scheduled refresh job exists.
- No Home UI connection exists.
- No `/news` paginated list page exists.
- The adapter is not Production-enabled.
- `id` field uses `pending_*` placeholder — real IDs require DB insertion.
- Relevance scoring uses simple field-presence heuristic — full scoring requires future refinement.

---

## 13. Recommended Next Steps

| Phase | Title | Description |
|---|---|---|
| 3BD | Owner-run GNews live smoke | `scripts/owner_smoke_gnews_live_fetch.mjs`, max 2 requests, sanitized counts and category labels only, no article URLs/titles/descriptions. Requires explicit owner approval. |
| 3BE | Route source selector with kill switch | Wire `GNEWS_LIVE_ENABLED` kill switch into route; fixture fallback retained; Production still blocked until explicit future approval. |
| 3BF | Home Market News UI integration | Wire top-6 articles from `/api/news/market-feed?mode=home` into Home shell via SSR fetch. |
| 3BG | Optional /news paginated list page | `/news` route with offset pagination, `pageSize: 10`, `maxPages: 10`, optional category filter. |

---

## 14. Confirmed Non-actions

- No live GNews call occurred.
- No `gnews.io` request occurred.
- No external HTTP request occurred.
- No API route behavior was changed.
- No database or migration file was added.
- No Supabase query or write occurred from Claude Code.
- No Vercel env value was inspected or mutated.
- No Vercel CLI command was run.
- No `.env*` content was read.
- No deployment was performed.
- No deployed URL was called.
- No secret, key value, raw provider payload, Preview URL, Supabase URL, or credential-like value was recorded.
- No KIS provider logic was changed.
- No KIS runtime guard was changed.
- No Supabase backend logic was changed.
- No Vercel config was changed.
- No auth/session logic was changed.
- No Home page runtime was changed.
- No UI component was changed.
- No root README.md was changed.
- Claude memory files were not modified.
- No `/news` page was created.
- No scheduled job or Vercel cron was added.
- No owner smoke script was executed.
