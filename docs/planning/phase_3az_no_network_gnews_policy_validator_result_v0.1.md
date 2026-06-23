# Phase 3AZ — No-network GNews Policy Validator Result v0.1

## 1. Title and Metadata

- **Phase**: 3AZ
- **Type**: No-network GNews policy validator implementation
- **Status**: Implemented
- **Live GNews calls**: not performed
- **API route**: not implemented
- **Database changes**: none
- **Supabase changes**: none
- **Home integration**: none
- **Deployment**: not performed
- **Date**: 2026-06-24

---

## 2. Objective

Phase 3AZ turns the Phase 3AY policy/schema/fixture design into a deterministic no-network validation engine. The engine proves that the news storage policy — deduplication, expiration, prune ranking, pagination, and Home top-6 selection — is internally consistent and correct before any live GNews API call, database write, or Home UI integration is attempted. All validation is driven by the synthetic Phase 3AY fixture using fixed deterministic inputs; no live runtime environment is required.

---

## 3. Implementation Summary

| Artifact | Path |
|---|---|
| No-network policy utility | `src/lib/news/gnewsNewsPolicy.mjs` |
| Engine validator script | `scripts/check_gnews_news_policy_engine.mjs` |
| Package script | `check:gnews-news-engine` |
| Static artifact checker (updated) | `scripts/check_gnews_news_policy_static_contract.mjs` |
| Package script | `check:gnews-news-policy` |
| Fixture used | `src/data/fixtures/gnews_market_news_fixture_v0.1.json` |
| Reference time (deterministic) | `2026-06-23T09:00:00Z` |

### Utility module location

`src/lib/news/gnewsNewsPolicy.mjs` was placed in `src/lib/news/` following the existing `src/lib/` convention for reusable non-server logic. The `.mjs` extension was chosen to allow direct import in Node.js validator scripts without a TypeScript compilation step while remaining importable by future Astro server routes.

---

## 4. Policy Operations Implemented

### 4.1 Fixture validation (`validateFixtureShape`)

Validates the fixture metadata block against policy constants and validates every article against the `MarketNewsArticle` shape contract (`validateArticleShape`). Checks: metadata existence, `isSynthetic: true`, `maxActiveArticles: 100`, `pageSize: 10`, `maxPages: 10`, `pruneBatchSize: 20`, `retentionDays: 14`, 6 queryThemes, ≥24 articles, all required fields, `rawProviderStored: false` for all.

### 4.2 Article shape validation (`validateArticleShape`)

Validates individual articles for: required field presence, `rawProviderStored === false`, `relevanceScore` in [0, 100], `isDuplicate` and `isActive` are booleans, `category` is a known enum value, `archiveReason` is a valid enum value, lifecycle consistency (`isActive: true` ↔ `archiveReason: "none"` and `archivedAt: null`).

### 4.3 URL domain safety (`checkArticleUrlDomains`)

Rejects any article `url`, `imageUrl`, or `sourceUrl` that does not match the `*.example.test` domain pattern. Tested against all 26 fixture articles (0 violations).

### 4.4 Deduplication detection (`detectDuplicateGroups`)

Groups articles by:
- `canonicalUrlHash` — detects exact URL duplicates (fixture-019 / fixture-020 share hash `a6b7c8d9e0f1a6b7`)
- `titleHash` — detects exact title duplicates (no fixture scenario)
- `duplicateGroupId` — detects near-duplicate title groups (fixture-003 and fixture-004 share `dup-group-a1b2c3d4`)

Returns filtered maps of groups with > 1 member and a `duplicateCandidates` array of `isDuplicate: true` articles.

### 4.5 Expiration detection (`detectExpiredArticles`)

Accepts a deterministic `referenceTime` string and `retentionDays` integer. Computes a cutoff timestamp and returns articles whose `publishedAt` precedes the cutoff. Never calls `Date.now()` internally; determinism is the caller's responsibility.

Fixture result at `referenceTime: 2026-06-23T09:00:00Z`, `retentionDays: 14`:
- Cutoff: `2026-06-09T09:00:00Z`
- Expired: fixture-018 (`publishedAt: 2026-05-15T10:00:00Z`) — 39 days past cutoff

### 4.6 Prune candidate ranking (`rankPruneCandidates`)

Assigns a priority tier to each article:

| Tier | Condition | `archiveReason` |
|---|---|---|
| 1 | `isDuplicate: true` | `duplicate` |
| 2 | `publishedAt < cutoff` | `expired` |
| 3 | `relevanceScore < 30` (and not tier 1/2) | `low_score` |
| 4 | All remaining | `cap_prune` |

Within each tier, articles are sorted by `publishedAt ASC` (oldest first = highest prune priority). Applies category protection: skips active articles that are the last representative of their category (tiers 3 and 4 only; tiers 1 and 2 bypass protection). Returns `{ article, pruneReason, tier, isProtected }[]`.

Fixture result: 1 tier-1 / 1 tier-2 / 1 tier-3 / 21 tier-4. Category protection flagged 4 articles.

### 4.7 Pagination (`paginateArticles`)

Filters `isActive: true && isDuplicate: false`, sorts by `relevanceScore DESC` then `publishedAt DESC`, clamps `page` to `[1, totalPages]`. Returns `{ articles, pagination: { page, pageSize, totalActive, totalPages, hasNextPage, hasPrevPage } }`.

Policy: `pageSize: 10`, `maxPages: 10`, active article cap: 100.

Fixture result: 24 active non-duplicate articles, 3 pages, page 1 returns 10 articles.

### 4.8 Home top-6 selection (`selectHomeArticles`)

Walks the relevance-score-sorted eligible list and applies:
- `maxPerCategory: 2` — MARKET_STOCKS cannot fill all 6 slots
- `maxPerSource: 2` — no single source dominates

Fixture result: 6 articles selected from 5 distinct categories (MARKET_STOCKS, FX, MACRO_POLICY, PERSONAL_FINANCE, CRYPTO_DIGITAL_ASSETS). MARKET_STOCKS occupies exactly 2 slots. No source exceeds 2 slots.

### 4.9 Article normalization (`normalizeArticle`)

Returns a sanitized copy with only canonical fields. Forces `rawProviderStored: false` regardless of input. Does not mutate the source object.

### 4.10 Forbidden pattern scan (`scanNewsPolicyForbiddenPatterns`)

Scans a text string for: forbidden URL patterns (`gnews.io`, `localhost`, `.vercel.app`, `.supabase.co`), forbidden key patterns (`sk-`, `Bearer `, `API_KEY=`, `token=`), and dangerous code patterns (`fetch()` calls, `XMLHttpRequest` usage, GNEWS_API_KEY env reads). Designed for scanning content data (fixtures, planning docs) — not for scanning code that defines these patterns as constants.

---

## 5. Deterministic Test Settings

| Setting | Value |
|---|---|
| Fixture path | `src/data/fixtures/gnews_market_news_fixture_v0.1.json` |
| Reference time | `2026-06-23T09:00:00Z` |
| Retention window | 14 days → cutoff `2026-06-09T09:00:00Z` |
| Active article cap | 100 |
| Page size | 10 |
| Maximum pages | 10 |
| Home exposure | 6 articles |
| Prune batch size | 20 |
| Low-score threshold | `relevanceScore < 30` |
| Home max per category | 2 |
| Home max per source | 2 |

---

## 6. Validation Results

```
npm run check:gnews-news-policy  →  44/44 PASS  Exit 0
npm run check:gnews-news-engine  →  57/57 PASS  Exit 0
git diff --check                 →  No errors (Windows CRLF warnings only)
git status --short               →  Expected Phase 3AZ files only
```

The static contract checker (`check:gnews-news-policy`) was extended with 7 additional Phase 3AZ checks: result doc exists, policy utility exists, engine checker exists, `check:gnews-news-engine` in package.json, no `/api/news` live route, policy utility makes no fetch call, policy utility does not read GNEWS_API_KEY.

Build was not run in this phase as Phase 3AZ introduces no runtime changes (no Astro pages, components, or API routes were modified).

---

## 7. Key Validation Findings

| Finding | Value |
|---|---|
| Fixture is synthetic | true |
| Article count | 26 |
| Active non-duplicate articles | 24 |
| Categories covered | 6/6 |
| Exact URL duplicate groups | 1 (fixture-019 / fixture-020) |
| Near-duplicate title groups (by duplicateGroupId) | 2 (including fixture-003 / fixture-004) |
| Expired articles detected | 1 (fixture-018, published 2026-05-15) |
| Low-score article detected | 1 (fixture-009, relevanceScore 22) |
| Missing-image article present | 1 (fixture-012, imageUrl null) |
| Prune tier counts | 1 dup / 1 expired / 1 low-score / 21 cap-prune |
| Category protection flagged | 4 articles |
| Pagination page 1 count | 10 |
| Pagination total active | 24 |
| Home selection count | 6 |
| Home categories | MARKET_STOCKS, FX, MACRO_POLICY, PERSONAL_FINANCE, CRYPTO_DIGITAL_ASSETS |
| Forbidden patterns in fixture JSON | 0 |
| API key-like values in fixture | none |
| rawProviderStored: false for all | confirmed |

---

## 8. Safety Boundaries

- No GNews live API call occurred.
- No external HTTP request occurred.
- No API route was added.
- No database or migration was created.
- No Supabase query or write occurred.
- No Vercel env value was inspected or mutated.
- No Home runtime integration was implemented.
- No `.env*` content was read.
- No API key value was printed, inferred, or used.
- No deployment was performed.
- No real article titles, URLs, or news content was used.
- All fixture data uses `*.example.test` domains.
- `rawProviderStored: false` is enforced in `normalizeArticle`.
- `PUBLIC_GNEWS_API_KEY` is not referenced in any new executable code.
- `GNEWS_API_KEY` is not used in any executable code in this phase.

---

## 9. Remaining Limitations

- No live GNews fetch is implemented. The engine operates on synthetic data only.
- No storage persistence layer exists. The policy logic is pure computation with no DB backing.
- No scheduled refresh job exists. Refresh cadence is policy-documented only.
- No Home UI integration exists. Home top-6 selection is validated but not wired.
- Near-duplicate fuzzy detection (edit-distance / token overlap) is not implemented. The engine uses exact `canonicalUrlHash`, exact `titleHash`, and shared `duplicateGroupId` only.
- Soft archive (`isActive: false`, `archivedAt`, `archiveReason`) is design-only. No live prune execution occurs.
- The `normalizeArticle` function does not compute `canonicalUrlHash` or `titleHash` (SHA-256 hashing is a server-side responsibility deferred to the future live route implementation).

---

## 10. Recommended Next Steps

| Phase | Title | Description |
|---|---|---|
| 3BA | Server route skeleton `/api/news/market-feed` | Skeleton route returning static fixture-backed response. Feature-flagged off by default. No live GNews fetch. No KIS dependency. |
| 3BB | Owner-approved GNews live fetch validation | Owner-run smoke test. Returns sanitized article count and category distribution only. No raw payloads logged. |
| 3BC | Home News Feed integration | Wire the top-6 ranked articles from `/api/news/market-feed` into the Home shell via SSR fetch. |
| 3BD | Paginated /news list page | Optional: `/news` route using offset pagination, `pageSize: 10`, `maxPages: 10`. |
| Future | SHA-256 hash computation | Implement server-side SHA-256 for `canonicalUrlHash` and `titleHash` in the live ingest path. |
| Future | Near-duplicate fuzzy detection | Evaluate title token-overlap similarity for syndicated articles without exact hash matches. |

---

## 11. Confirmed Non-actions

- No live GNews call occurred.
- No gnews.io request occurred.
- No external HTTP request occurred.
- No API route was added to `src/pages/api/`.
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
