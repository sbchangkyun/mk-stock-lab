# Phase 3BG — News Route Source Selector with Kill Switch and Fixture Fallback v0.1

## 1. Title and Metadata

- **Phase**: 3BG
- **Type**: News route source selector with kill switch and fixture fallback
- **Status**: Implemented
- **Latest prior commit**: 534379c docs: record gnews smoke diagnostics result
- **Live GNews calls by Claude Code**: not performed
- **Owner live smoke execution**: not performed in this phase
- **API route runtime change**: source selector added; fixture remains default
- **Database changes**: none
- **Supabase changes**: none
- **Home integration**: none
- **Deployment**: not performed
- **Date**: 2026-06-24

---

## 2. Objective

The news API route now supports a `source` query parameter that controls whether the route attempts a live GNews fetch or uses the existing fixture-backed response. The fixture source remains the default for all callers that do not specify a source. All live failure modes, including gate failures, empty results, provider errors, timeouts, and invalid payloads, fall back to fixture without exposing raw provider data. Production live mode remains blocked.

---

## 3. Source Selector Contract

**Query parameter:** `source`

| Value | Behavior |
|---|---|
| *(absent or empty)* | Defaults to `fixture` |
| `fixture` | Uses fixture-backed response only; no env reads, no live calls |
| `auto` | Evaluates live gate; attempts live fetch if gate passes; falls back to fixture on any failure or empty result |
| `live` | Same as `auto`; explicitly signals live intent; still falls back to fixture on any failure |

**Invalid source:** Returns HTTP 400 with sanitized `invalid_source` error code. No raw input is echoed.

**Mode compatibility:** `mode=home` and `mode=list` are preserved exactly. Source selection is orthogonal to mode.

**Default behavior:** `mode=home` with no `source` parameter returns the fixture-backed response exactly as before this phase. No breaking change.

---

## 4. Kill Switch and Live Gate

The live gate is evaluated by `resolveNewsLiveGate(env)` in the source selector module. The env object is injected by the route — no env values are read at module load time.

**Gate conditions (all must be satisfied):**

| Condition | Description |
|---|---|
| `GNEWS_LIVE_ENABLED === 'true'` | Explicit opt-in kill switch |
| `VERCEL_ENV !== 'production'` | Production live mode is blocked |
| `GNEWS_BASE_URL` present | Endpoint URL required |
| `GNEWS_BASE_URL` endpoint-only | Query strings and embedded `apikey`/`key`/`token`/`q` fragments rejected |
| `GNEWS_API_KEY` present (or `PUBLIC_GNEWS_API_KEY` as server-side fallback) | API key required |

**Key handling:** The API key is accessed inside `resolveNewsLiveGate` and passed to the adapter. It is never included in any public response, log line, metadata object, or fallback reason code.

**Environment values not recorded:** No API key value, base URL value, or other env value from the live gate is recorded in this document.

---

## 5. Fallback Behavior

Fixture fallback occurs for any of the following conditions:

| Reason Code | Trigger |
|---|---|
| `live_disabled` | `GNEWS_LIVE_ENABLED !== 'true'` |
| `production_blocked` | `VERCEL_ENV === 'production'` |
| `missing_base_url` | `GNEWS_BASE_URL` absent |
| `invalid_base_url` | Base URL contains query string or embedded key fragment |
| `missing_api_key` | No API key available |
| `provider_empty_result` | Provider returned `articles: []` |
| `provider_rate_limited` | Provider returned 429 |
| `provider_http_error` | Provider returned non-2xx, non-429, non-4xx-auth |
| `provider_timeout` | Request exceeded `timeoutMs` |
| `provider_invalid_payload` | Response body not parseable as expected JSON |
| `provider_fetch_failed` | Adapter returned failure without a specific error code |
| `live_exception` | `fetchGnewsMarketNewsBatch` threw an uncaught exception |
| `unknown_live_failure` | Any reason not in the allowed reason set |

All reason codes are sanitized by `sanitizeLiveFallbackReason`. Any unrecognized string maps to `unknown_live_failure`.

---

## 6. Response Metadata

The following fields appear in API responses:

| Field | Fixture default | Auto/live gate failed | Live success |
|---|---|---|---|
| `source` | `"fixture"` | `"fixture"` | `"gnews_live"` |
| `liveEnabled` | `false` | `true` | `true` |
| `liveAttempted` | `false` | `false` or `true` | `true` |
| `fallbackUsed` | `false` | `true` | `false` |
| `fallbackReason` | absent | sanitized code | absent |
| `requestedSource` | absent (fixture default) | `"auto"` or `"live"` | `"auto"` or `"live"` |
| `provider` | absent | absent | `"gnews"` |
| `staleState` | `"fixture"` | `"fixture"` | `"live"` |

**Not included in any response:** API key values, request URL, query string, raw provider body, raw provider error, article internals beyond the public shape, stack traces.

---

## 7. Public Article Shape

The public article shape is enforced by `sanitizeMarketNewsArticle` and is unchanged from Phase 3BA:

| Field | Type |
|---|---|
| `id` | string |
| `title` | string |
| `description` | string \| null |
| `url` | string |
| `imageUrl` | string \| null |
| `sourceName` | string |
| `publishedAt` | string |
| `category` | string |
| `relevanceScore` | number |

No internal storage fields (`canonicalUrlHash`, `titleHash`, `isDuplicate`, `isActive`, `rawProviderStored`, etc.) are included.

---

## 8. Validation Results

| Command | Result |
|---|---|
| `npm run check:gnews-news-policy` | All checks passed. Exit 0 |
| `npm run check:gnews-news-engine` | PASS |
| `npm run check:gnews-news-api-route` | All checks passed (groups 1-8 validated). Exit 0 |
| `npm run check:gnews-news-api-response` | PASS |
| `npm run check:gnews-news-route-source-selector` | 148/148 PASS |
| `npm run check:gnews-live-adapter-design` | All checks passed. Exit 0 |
| `npm run check:gnews-live-adapter-static` | All checks passed. Exit 0 |
| `npm run check:gnews-live-adapter-mocked` | PASS |
| `npm run check:gnews-live-smoke-provider-diagnostics` | 77/77 PASS |
| `npm run smoke:gnews-live:dry` | PASS (liveAttempted=false). Exit 0 |
| `git diff --check` | LF/CRLF warnings only. Exit 0 |
| `git status --short` | Expected modified and new files only |

---

## 9. Route Boundary and Non-Goals

- Home UI is not connected to the news route or source selector in this phase.
- No `/news` page was created.
- No DB, cache, or storage was added.
- No scheduler or cron was added.
- Production live mode remains blocked (`VERCEL_ENV=production` blocks the gate).
- GNews provider compatibility (`provider_empty_result` from prior live smoke runs) remains unresolved. This phase enables the live path infrastructure without requiring provider success.
- `gnewsLiveFetchAdapter.mjs` was not modified (imported by the selector, not the route directly).

---

## 10. Safety Boundaries

- No live GNews call was made by Claude Code.
- No external HTTP request was made by Claude Code.
- No `.env*` file was read.
- No API key value was used, printed, or inferred.
- No request URL or raw provider payload was recorded.
- No article title, URL, or description beyond the fixture/public response contract was recorded.
- No DB or migration file was added.
- No Supabase query or write occurred.
- No Vercel environment variable was inspected or mutated.
- No Home integration was implemented.
- No `/news` page was created.
- No deployment was performed.
- No KIS provider logic was changed.
- No auth/session logic was changed.

---

## 11. Recommended Next Phases

| Phase | Title | Description |
|---|---|---|
| 3BH | Home Market News UI Integration | Wire top-6 articles from `/api/news/market-feed?mode=home` (fixture-backed by default) into the Home shell via SSR fetch. No live provider required. |
| 3BI | Optional `/news` Paginated List Page | `/news` route with offset pagination against the same route contract. |
| Later: Provider Compatibility | GNews provider compatibility investigation | English query profile, `lang`/`country` parameter tuning, `totalArticles` count diagnostics, provider plan/quota review, or alternative provider/RSS fallback evaluation. Isolated from main project phases. |
