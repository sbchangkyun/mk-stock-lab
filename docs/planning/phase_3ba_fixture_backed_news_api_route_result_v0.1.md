# Phase 3BA — Fixture-backed News API Route Skeleton Result v0.1

## 1. Title and Metadata

- **Phase**: 3BA
- **Type**: Fixture-backed GNews market-feed API route skeleton
- **Status**: Implemented
- **Live GNews calls**: not performed
- **API route**: implemented as fixture-backed skeleton (`/api/news/market-feed`)
- **Database changes**: none
- **Supabase changes**: none
- **Home integration**: none
- **Deployment**: not performed
- **Date**: 2026-06-24

---

## 2. Objective

Phase 3BA creates the first route-level response contract for market news while keeping all data fixture-backed and no-network. The route proves that the home-mode and list-mode response shapes, public article sanitization, query parameter handling, and error responses are correct and policy-compliant before any live GNews fetch, Supabase storage, Home UI integration, `/news` page, or scheduled refresh is introduced.

---

## 3. Implementation Summary

| Artifact | Path |
|---|---|
| API route | `src/pages/api/news/market-feed.ts` |
| Response builder utility | `src/lib/news/gnewsMarketFeedResponse.mjs` |
| API route static checker | `scripts/check_gnews_news_api_route_static_contract.mjs` |
| API route response checker | `scripts/check_gnews_news_api_route_response.mjs` |
| Policy static checker (updated) | `scripts/check_gnews_news_policy_static_contract.mjs` |
| Package scripts added | `check:gnews-news-api-route`, `check:gnews-news-api-response` |
| Fixture source | `src/data/fixtures/gnews_market_news_fixture_v0.1.json` |
| Policy utility reused | `src/lib/news/gnewsNewsPolicy.mjs` |

The response builder (`gnewsMarketFeedResponse.mjs`) is a `.mjs` utility importable by both the TypeScript API route (via Vite's ESM resolution at build time) and the Node.js validator scripts (directly at runtime). The TypeScript route uses `// @ts-ignore` to suppress the missing-declaration warning for the `.mjs` import.

---

## 4. Route Contract

### Endpoint

`GET /api/news/market-feed`

### Mode: home

Request: `/api/news/market-feed?mode=home`

Behavior:
- Returns up to 6 articles using `selectHomeArticles` with category/source balancing.
- Applies `maxPerCategory: 2` and `maxPerSource: 2`.
- Excludes inactive and duplicate articles.
- Always `source: "fixture"`, `liveEnabled: false` in this phase.

### Mode: list

Request: `/api/news/market-feed?mode=list&page=1`

Behavior:
- Returns paginated active, non-duplicate articles using `paginateArticles`.
- Page size fixed at 10 (policy `PAGE_SIZE`).
- Maximum pages capped at 10 (policy `MAX_PAGES`).
- `page` values are clamped to `[1, totalPages]`; invalid non-integer values default to 1.
- Optional `category` filter accepted; invalid category enum values return 400.

### Default mode

`mode` absent → defaults to `home`.

### Invalid mode

Unrecognized `mode` value → `400` with `{ ok: false, error: { code: "invalid_mode", ... } }`.

### Invalid category

Category present but not a known enum → `400` with `{ ok: false, error: { code: "invalid_category", ... } }`.

### Page normalization

- Non-integer `page` → treated as default (1).
- `page < 1` → normalized to 1 via `Math.max(1, ...)`.
- `page > totalPages` → clamped to `totalPages` inside `paginateArticles`.

### Method not allowed

Non-GET methods → `405` with `{ ok: false, error: { code: "method_not_allowed", ... } }`.

---

## 5. Response Shapes

### Home response (sanitized shape)

```
{
  ok: true,
  mode: "home",
  source: "fixture",
  liveEnabled: false,
  count: 6,
  totalActive: 24,
  lastRefreshedAt: null,
  staleState: "fixture",
  articles: [ ...6 sanitized articles ]
}
```

### List response (sanitized shape)

```
{
  ok: true,
  mode: "list",
  source: "fixture",
  liveEnabled: false,
  pagination: {
    page: 1,
    pageSize: 10,
    totalActive: 24,
    totalPages: 3,
    hasNextPage: true,
    hasPrevPage: false
  },
  oldestFetchedAt: "<ISO string>",
  newestFetchedAt: "<ISO string>",
  articles: [ ...up to 10 sanitized articles ]
}
```

### Error response (sanitized shape)

```
{
  ok: false,
  error: {
    code: "invalid_mode",
    message: "Unsupported news feed request."
  }
}
```

Allowed error codes: `invalid_mode`, `invalid_category`, `fixture_unavailable`, `internal_unavailable`.

---

## 6. Public Article Fields

### Fields returned

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `title` | string | |
| `description` | string \| null | |
| `url` | string | |
| `imageUrl` | string \| null | |
| `sourceName` | string | |
| `publishedAt` | string (ISO) | |
| `category` | string (enum) | |
| `relevanceScore` | number | |

### Internal fields intentionally excluded

`canonicalUrlHash`, `titleHash`, `duplicateGroupId`, `isDuplicate`, `isActive`, `archivedAt`, `archiveReason`, `providerArticleId`, `rawProviderStored`, `queryKey`, `language`, `country`, `fetchedAt`, `provider`, `sourceUrl`, `scoreReasons`

---

## 7. Live-mode Boundary

- `source: "fixture"` in all success responses.
- `liveEnabled: false` in all success responses.
- No `GNEWS_API_KEY` reference in any executable code.
- No `PUBLIC_GNEWS_API_KEY` reference in any executable code.
- No `import.meta.env` read in route or helper.
- No GNews live fetch implemented.
- No client-side GNews call possible (route is server-only SSR).
- If a future query includes `source=live` or `live=true`, the route ignores it (parameter is not read).

---

## 8. Validation Results

```
npm run check:gnews-news-policy       →  52/52 PASS  Exit 0
npm run check:gnews-news-engine       →  57/57 PASS  Exit 0
npm run check:gnews-news-api-route    →  35/35 PASS  Exit 0
npm run check:gnews-news-api-response →  61/61 PASS  Exit 0
git diff --check                      →  No errors (Windows CRLF warnings only)
git status --short                    →  Expected Phase 3BA files only
npm run build                         →  Build complete in ~4.2s (no TypeScript errors)
```

The policy static checker was updated with 7 Phase 3BA artifact checks (replacing the previous "no route" guard with "route exists" and adding result doc, checker, script, no-/news-page, and no-fetch checks).

---

## 9. Key Findings

| Finding | Value |
|---|---|
| Route mode home — articles returned | 6 |
| Route mode list — page 1 articles | 10 |
| Route mode list — totalActive | 24 |
| Internal fields excluded from response | 18 fields |
| Home categories covered | 5 of 6 (MARKET_STOCKS, FX, MACRO_POLICY, PERSONAL_FINANCE, CRYPTO_DIGITAL_ASSETS) |
| Page 99 clamped to totalPages | confirmed |
| Page -5 normalized to page 1 | confirmed |
| FX category filter returns FX-only articles | confirmed |
| Error responses have no stack traces | confirmed |
| Build output | success, no TypeScript errors |
| GNEWS_API_KEY in executable route/helper | none |
| Forbidden findings in fixture | 0 |

---

## 10. Safety Boundaries

- No live GNews call occurred.
- No external HTTP request occurred.
- No API key value was used, printed, or inferred.
- No `.env*` content was read.
- No Supabase query or write occurred.
- No database or migration file was added.
- No Home runtime integration was implemented.
- No `/news` page was created.
- No Vercel env value was inspected or mutated.
- No deployment was performed.
- All fixture data uses `*.example.test` domains.
- `rawProviderStored: false` is enforced by the existing `normalizeArticle` function.
- Route is server-only (`prerender = false`); no client bundle exposure.

---

## 11. Remaining Limitations

- No live GNews fetch is implemented. Route returns fixture data only.
- No storage persistence layer exists.
- No scheduled refresh job exists.
- No Home UI wiring exists.
- No `/news` paginated page exists.
- Category filter does not support multiple categories simultaneously.
- `lastRefreshedAt` is `null` in this phase (no live refresh timestamp available).
- No SHA-256 canonicalization is implemented in the route (fixture data uses pre-computed abbreviated hashes).
- The route is not protected by any rate limiting or authentication in this phase.

---

## 12. Recommended Next Steps

| Phase | Title | Description |
|---|---|---|
| 3BB | Owner-approved GNews live fetch adapter | Skeleton server-side GNews fetch with kill switch, owner-run smoke test only. Returns sanitized article count and category distribution; no raw payloads logged. |
| 3BC | Home market-news feed integration | Wire the top-6 articles from `/api/news/market-feed?mode=home` into the Home shell via SSR fetch. |
| 3BD | Paginated `/news` list page | `/news` route with offset pagination, `pageSize: 10`, `maxPages: 10`, optional category filter. |
| Future | Live mode kill switch | `liveEnabled` flag controlled by env var; route falls back to fixture when disabled. |
| Future | `lastRefreshedAt` timestamp | Real timestamp once live fetch is implemented and persisted. |

---

## 13. Confirmed Non-actions

- No live GNews call occurred.
- No `gnews.io` request occurred.
- No external HTTP request occurred.
- No database or migration file was added.
- No Supabase query or write occurred from Claude Code.
- No Vercel env value was inspected or mutated.
- No Vercel CLI command was run.
- No deployment was performed.
- No deployed URL was called.
- No `.env*` content was read.
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
