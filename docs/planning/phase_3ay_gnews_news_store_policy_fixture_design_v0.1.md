# Phase 3AY — GNews News Store Policy + No-network Schema/Fixture Design v0.1

## 1. Title and Metadata

- **Phase**: 3AY
- **Type**: GNews market-news collection, storage, pagination, and prune policy design
- **Status**: Planned / Designed
- **Runtime implementation**: not performed
- **Live GNews calls**: not performed
- **Database changes**: none
- **Home integration**: none
- **Deployment**: not performed
- **Date**: 2026-06-23

---

## 2. Objective

Phase 3AY fixes the policy and no-network schema/fixture foundation before implementing GNews server routes, storage, pagination, or Home integration. The purpose is to establish a durable, reviewable design record that future implementation phases (3AZ onward) can follow without rework. No live network calls, database changes, or runtime UI integration are performed in this phase.

---

## 3. Accepted Owner Decision

| Parameter | Value |
|---|---|
| Active article cap | 100 |
| Page size | 10 |
| Maximum list pages | 10 |
| Home exposure | 6 |
| Retention window | 14 days |
| Refresh interval target | 2 hours |
| Query themes | 6 |
| Expected request usage | 72 requests/day (6 queries × 12 refreshes) |
| Reserved headroom | 28 requests/day (against 100/day free plan budget) |
| Prune batch size | 20 |
| Prune priority | duplicate/near-duplicate → expired → low score → oldest publishedAt |

**Active article cap: 100.** This is the hard upper limit of simultaneously active articles in the store at any time.

**Page size: 10.** Each paginated list response returns at most 10 articles.

**Maximum list pages: 10.** Consumers may request up to page 10, yielding up to 100 active articles total.

**Home exposure: 6.** The Home page displays at most 6 ranked articles from the active store.

**Retention window: 14 days.** Articles older than 14 days are eligible for archival/pruning.

**Prune batch size: 20.** Each prune run archives or deletes at most 20 articles.

---

## 4. Query Strategy v1

Six broad Korean market-news query themes are used to keep request volume within budget while covering the most relevant reader topics.

### Intended future GNews request parameters (not yet implemented)

```
lang=ko
country=kr
max=10
in=title,description
sortby=publishedAt
```

No live calls are made in this phase.

### Theme A — Market/stocks

| Field | Value |
|---|---|
| Category enum | MARKET_STOCKS |
| Korean label | 증시·주식 |
| queryKey | market_stocks |

Query terms:
```
증시 OR 주식 OR 코스피 OR 코스닥 OR 상장사 OR 실적 OR 반도체 OR 이차전지 OR ETF
```

### Theme B — Macro/policy

| Field | Value |
|---|---|
| Category enum | MACRO_POLICY |
| Korean label | 매크로·정책 |
| queryKey | macro_policy |

Query terms:
```
경제 OR 경기 OR 금리 OR 물가 OR 한국은행 OR 금융위 OR 금감원 OR 정부정책 OR 세제
```

### Theme C — FX

| Field | Value |
|---|---|
| Category enum | FX |
| Korean label | 환율·외환 |
| queryKey | fx |

Query terms:
```
환율 OR 원달러 OR 달러 OR 엔화 OR 위안 OR 유로 OR 외환 OR 강달러
```

### Theme D — Oil/commodities

| Field | Value |
|---|---|
| Category enum | OIL_COMMODITIES |
| Korean label | 유가·원자재 |
| queryKey | oil_commodities |

Query terms:
```
유가 OR WTI OR 브렌트유 OR 원유 OR 금값 OR 금 OR 은 OR 원자재
```

### Theme E — Crypto/digital assets

| Field | Value |
|---|---|
| Category enum | CRYPTO_DIGITAL_ASSETS |
| Korean label | 코인·가상자산 |
| queryKey | crypto_digital_assets |

Query terms:
```
코인 OR 가상자산 OR 비트코인 OR 이더리움 OR 업비트 OR 두나무 OR 거래소
```

### Theme F — Personal finance/financial life

| Field | Value |
|---|---|
| Category enum | PERSONAL_FINANCE |
| Korean label | 재테크·금융생활 |
| queryKey | personal_finance |

Query terms:
```
재테크 OR 투자 OR 예금 OR 적금 OR 연금 OR 보험 OR 카드 OR 대출 OR 부동산
```

### Request budget

- 6 themes × 1 request per theme per refresh = 6 requests per refresh cycle
- Target refresh interval: 2 hours → 12 refreshes/day
- Expected daily usage: 72 requests/day
- Budget assumption: 100 requests/day (free plan style)
- Reserved headroom: 28 requests/day for retries, manual refreshes, or future theme expansion

---

## 5. Normalized Schema v1

The MarketNewsArticle schema is the canonical normalized representation used for storage, pagination, and ranking. Raw GNews response bodies must not be stored in user-visible data. Runtime code must expose only normalized fields to the UI.

Full field definitions are in the companion schema document: `docs/schemas/gnews_market_news_schema_v0.1.md`.

### Key field groups

**Identity fields:**
- `id` — stable internal UUID assigned at ingestion
- `url` — original article URL
- `canonicalUrlHash` — SHA-256 hex of normalized URL (lowercase, stripped query params) used for exact-match deduplication
- `titleHash` — SHA-256 hex of normalized title (lowercase, stripped punctuation) used for title-match deduplication

**Content fields:**
- `title`, `description`, `imageUrl`, `sourceName`, `sourceUrl`

**Temporal fields:**
- `publishedAt` — ISO 8601 as reported by provider
- `fetchedAt` — ISO 8601 server-side ingestion time

**Classification fields:**
- `category` — see ArticleCategory enum
- `queryKey` — matches theme queryKey above
- `language`, `country`

**Scoring fields:**
- `relevanceScore` — integer 0–100
- `scoreReasons` — array of string tags

**Dedup fields:**
- `duplicateGroupId` — UUID shared by articles in the same duplicate group, or null
- `isDuplicate` — boolean; true means this article was superseded and should not be served

**Lifecycle fields:**
- `isActive` — boolean; only active articles are served to pagination and Home
- `archivedAt` — ISO 8601 or null; set when the article is removed from active serving
- `archiveReason` — see ArchiveReason enum; "none" when article is active

**Provider fields:**
- `provider` — string; "gnews" for this integration
- `providerArticleId` — optional provider-side ID if available
- `rawProviderStored: false` — always false; raw response is not persisted

### ArticleCategory enum

```
MARKET_STOCKS
MACRO_POLICY
FX
OIL_COMMODITIES
CRYPTO_DIGITAL_ASSETS
PERSONAL_FINANCE
GENERAL_BUSINESS
```

### ArchiveReason enum

```
cap_prune
expired
duplicate
low_score
manual
none
```

---

## 6. Deduplication Policy

### Exact URL deduplication

- Compute `canonicalUrlHash` by normalizing the URL (lowercase, drop query params except essential) then hashing with SHA-256.
- If an incoming article has a `canonicalUrlHash` already in the store, mark the new article as `isDuplicate: true` unless it has a higher `relevanceScore`, in which case supersede the older article.
- Assign both articles the same `duplicateGroupId`.

### Title deduplication

- Compute `titleHash` by normalizing the title (lowercase, strip punctuation, collapse whitespace) then hashing.
- If an incoming article has a `titleHash` matching an existing article (different URL), treat as near-duplicate.
- Group both under the same `duplicateGroupId`.
- Prefer the article with higher `relevanceScore`, newer `publishedAt`, or richer `imageUrl`/`description`.

### Near-duplicate (future)

- Future option: normalized title edit-distance or token overlap can detect syndicated articles that differ only in wording.
- MVP may skip near-dup similarity in favor of exact hash matching only.

### Syndication rule

- Do not keep multiple copies of the same syndicated article if URL or title strongly match.
- Prefer the richer, fresher, or higher-scored copy.
- Mark lower-priority copies as `isDuplicate: true`, `isActive: false`, `archiveReason: "duplicate"`.

---

## 7. Scoring Policy

A simple deterministic v1 relevance score (0–100) is assigned at ingestion. The score is recomputable from normalized fields and testable with fixtures.

### Score components

| Component | Weight | Criteria |
|---|---|---|
| Freshness score | +35 | Published within 2 hours: +35; within 6 hours: +25; within 24 hours: +15; within 72 hours: +5; older: 0 |
| Category coverage boost | +20 | Article is the first or only article for its category in the current active set |
| Title relevance boost | +25 | Title contains one or more primary query terms from the assigned theme |
| Source diversity adjustment | +10 | Source not seen in top 10 active articles; reduces concentration of single sources |
| Duplicate penalty | -50 | Applies if `isDuplicate: true`; score should be overridden to 0 for duplicates |
| Missing content penalty | -15 | Missing title, source name, publishedAt, or description each reduce score by 5 |

### Score bands (informational)

| Band | Score | Interpretation |
|---|---|---|
| High | 70–100 | Fresh, relevant, diverse; prioritize for Home |
| Medium | 40–69 | Useful; eligible for list pages |
| Low | 0–39 | Prune candidate; eligible for cap_prune before medium-band articles |

### Design rules

- Score calculation must be deterministic: same inputs → same score.
- Score must be recalculated after dedup resolution (duplicate articles receive score 0).
- Scoring does not require external calls or ML.
- Score can be extended with additional components in future phases.

---

## 8. Storage Policy

### Active article cap

Active article cap: 100. At no time should the active store (where `isActive: true`) hold more than 100 articles.

Trigger a prune run immediately after ingestion if the active count exceeds 100.

### Retention window

Articles whose `publishedAt` is older than 14 days are expired and eligible for pruning with `archiveReason: "expired"`.

Expiry is evaluated relative to the ingestion wall-clock time, not the client's local time.

### Archive vs. hard delete

- MVP may use hard-delete (physical removal) for pruned records.
- Soft archive (set `isActive: false`, `archivedAt`, `archiveReason`) is recommended for future observability and audit logging.
- Schema includes `archivedAt` and `archiveReason` to support either approach.
- If hard-delete is used, the deletion event should be logged at the server level.

### Field constraints

- `isActive` defaults to `true` on successful ingestion.
- `archivedAt` is `null` while `isActive: true`.
- `archiveReason` is `"none"` while `isActive: true`.
- `rawProviderStored` is always `false`; raw API responses must not be persisted.

---

## 9. Prune Policy

### Trigger

Prune runs after each ingestion/upsert cycle when `COUNT(isActive=true) > 100`.

### Prune batch size: 20

Each prune run archives or deletes at most 20 articles per invocation. If more than 20 articles qualify, the run stops after 20 and waits for the next cycle.

### Candidate selection and ordering

Prune candidates are selected in this priority order:

1. **Duplicates first** — `isDuplicate: true` and `isActive: true` (should not exist in a healthy store; emergency cleanup)
2. **Expired** — `publishedAt < (now - 14 days)` → `archiveReason: "expired"`
3. **Low score** — `relevanceScore < 30` → `archiveReason: "low_score"`
4. **Oldest publishedAt** — remaining candidates ordered by publishedAt ASC → `archiveReason: "cap_prune"`

### Category protection

- Never prune the only remaining active article for a category unless it is a duplicate or otherwise invalid.
- If pruning a candidate would empty a category, skip it and prune the next candidate.
- This ensures all 6 categories remain represented in the active store when possible.

### Future balancing

- Cap max active articles per category at `floor(cap / themes)` = 16 per category (100 cap / 6 themes, rounded).
- Future: if a category has > 16 active articles, prune excess before pruning other categories.

---

## 10. Pagination Policy

### Home exposure

The Home page displays at most 6 ranked articles selected from the active store using the Home ranking policy (see Section 11). Home does not paginate.

### News list page

Future route: `/news`

| Parameter | Value |
|---|---|
| Default page size | 10 |
| Minimum page size | 10 |
| Maximum page size | 10 |
| Maximum pages | 10 |
| Maximum active articles exposed | 100 |

### Cursor options

- **MVP**: offset-based pagination using `page` (1-indexed) and `pageSize` (always 10).
- **Future**: cursor-based pagination using `afterPublishedAt` + `afterId` to avoid offset drift on concurrent inserts/prunes.

### Category filter

- **MVP**: no category filter; all active articles returned sorted by `relevanceScore DESC`, then `publishedAt DESC`.
- **Future**: `?category=MARKET_STOCKS` query parameter.

---

## 11. Home Ranking Policy

The Home feed selects 6 articles from the active store using the following rules:

1. Select all `isActive: true` articles ordered by `relevanceScore DESC`, then `publishedAt DESC`.
2. Walk the ranked list and apply selection constraints:
   - **Same category max 2**: If a category already has 2 slots filled in the selection, skip additional articles from that category.
   - **Same source max 2**: If a source already has 2 slots filled, skip additional articles from that source.
3. Try to include at least one article from high-signal categories: FX, OIL_COMMODITIES, CRYPTO_DIGITAL_ASSETS, MACRO_POLICY — if any are available with relevanceScore ≥ 40.
4. Do not allow MARKET_STOCKS to fill all 6 slots even if it dominates the score list.
5. Fill remaining slots in score order.
6. If fewer than 6 active articles exist, return all available.

---

## 12. Environment Variable and Security Policy

### Server-only preference

Future server-side GNews route code should **prefer `GNEWS_API_KEY`** as a server-only variable (not prefixed with `PUBLIC_`). This ensures the key is never visible in the browser bundle.

Implementation note: Astro server-side routes access server-only variables via `import.meta.env.GNEWS_API_KEY` (no PUBLIC_ prefix), which are not exposed to client bundles.

### Temporary compatibility fallback

`PUBLIC_GNEWS_API_KEY` already exists in the local environment and in Vercel Environment Variables per owner confirmation. If the future implementation uses it as a fallback, it must be used **only inside server-side route code** (e.g., inside a `.ts` file under `src/pages/api/` or `src/lib/server/`). It must never be exported to or consumed in client code.

### Prohibition

**Client code must never** reference `import.meta.env.PUBLIC_GNEWS_API_KEY`. Any module that imports this variable and is bundled for browser delivery is a security violation. The GNews API key must not be returned to the browser in any response, log, or header.

This prohibition applies regardless of whether the variable name begins with `PUBLIC_`: server routes may reference `PUBLIC_GNEWS_API_KEY` as a compatibility fallback because server routes are not client-bundled, but the principle is to migrate to `GNEWS_API_KEY` (server-only) as the canonical variable.

### Summary

| Variable | Allowed context | Status |
|---|---|---|
| `GNEWS_API_KEY` | Server-only route code | Preferred (future) |
| `PUBLIC_GNEWS_API_KEY` | Server-side route code only, as compatibility fallback | Temporary; migrate away |
| `PUBLIC_GNEWS_API_KEY` | Browser/client bundle | **FORBIDDEN** |

No API key value should be logged, returned in API responses, or stored in fixtures or documentation.

---

## 13. No-network Fixture Design

Fixture file: `src/data/fixtures/gnews_market_news_fixture_v0.1.json`

### Purpose

The fixture provides a synthetic, no-network dataset for testing the following without any runtime environment:

- Schema field completeness
- Exact URL deduplication scenario (same `canonicalUrlHash` in two articles)
- Near-duplicate title scenario (same `duplicateGroupId`, different URL)
- Prune ordering (duplicate → expired → low-score → oldest)
- Pagination slice correctness
- Category balancing (all 6 categories present)
- Home top-6 selection logic
- Missing image handling (`imageUrl: null`)
- Expired article handling (`publishedAt` older than 14 days, `archiveReason: "expired"`)
- Low-score article handling (`relevanceScore < 30`, `archiveReason: "low_score"`)

### Constraints

- All article titles are fictional and generic; no real current news titles are used.
- Source names are fictional: "Market Daily KR", "Finance Desk KR", "Macro Wire KR", "Energy Herald KR", "Digital Assets KR", "Personal Finance KR", "Economic Observer KR", "Investment Weekly KR".
- All article URLs are under `*.example.test` domains.
- No API keys, tokens, real credentials, real Preview URLs, Supabase URLs, or real GNews API payloads are included.
- `rawProviderStored` is always `false` in all fixture articles.
- `provider` is always `"gnews"` to represent the intended provider.
- Hash values in the fixture are abbreviated 16-character hex strings for readability; production code will use full SHA-256 hashes.

### Fixture coverage matrix

| Scenario | Article IDs |
|---|---|
| Normal active high-score | fixture-001, fixture-002, fixture-007, fixture-011 |
| Near-duplicate title pair | fixture-003, fixture-004 (same duplicateGroupId) |
| Low-score prune candidate | fixture-009 (relevanceScore: 22) |
| Missing image | fixture-012 (imageUrl: null) |
| Expired (older than 14 days) | fixture-018 (archiveReason: "expired") |
| Exact URL duplicate | fixture-019, fixture-020 (same canonicalUrlHash, fixture-020 isDuplicate: true) |
| Category balancing (all 6) | All themes represented across 26 articles |

---

## 14. Future Implementation Roadmap

| Phase | Title | Description |
|---|---|---|
| 3AZ | No-network news policy validator | Implement Jest or Node test harness using the Phase 3AY fixture to validate dedup, prune, scoring, pagination, and Home-6 selection logic without any live calls |
| 3BA | Server route skeleton `/api/news/market-feed` | Skeleton route returning empty data; no live GNews fetch; no KIS dependency; controlled by a feature flag similar to KIS_ENABLE_MARKET_QUOTE_CARD |
| 3BB | Owner-approved GNews live fetch validation | Owner-run smoke test; returns sanitized article count and category distribution only; no raw payloads logged |
| 3BC | Home News Feed integration | Wire the top-6 ranked articles into the Home shell using an SSR fetch from the `/api/news/market-feed` route |
| 3BD | Paginated /news list page | Optional: create `/news` paginated route using offset or cursor pagination |

---

## 15. Confirmed Non-actions

- No live GNews API call occurred.
- No external HTTP request occurred.
- No API route was added.
- No database or Supabase mutation occurred.
- No Supabase migration was created.
- No Vercel env value was inspected or mutated.
- No Home runtime integration was implemented.
- No `.env*` content was read.
- No secret, token, key value, raw provider payload, Preview URL, Supabase URL, or credential-like value was recorded.
- No scheduled job was added.
- No ad script or tracking was added.
- No KIS provider logic was changed.
- No auth/session logic was changed.
- Claude memory files were not modified.
- Root README.md was not modified.
