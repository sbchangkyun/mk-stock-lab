# GNews Market News Schema v0.1

Design-only document. No runtime code is generated from this file in Phase 3AY.
Types are written in TypeScript-style for readability and future implementation reference.

---

## ArticleCategory

```typescript
type ArticleCategory =
  | 'MARKET_STOCKS'        // 증시·주식
  | 'MACRO_POLICY'         // 매크로·정책
  | 'FX'                   // 환율·외환
  | 'OIL_COMMODITIES'      // 유가·원자재
  | 'CRYPTO_DIGITAL_ASSETS' // 코인·가상자산
  | 'PERSONAL_FINANCE'     // 재테크·금융생활
  | 'GENERAL_BUSINESS';    // 일반경제 (fallback)
```

---

## ArchiveReason

```typescript
type ArchiveReason =
  | 'cap_prune'   // Pruned to stay within the 100-article active cap
  | 'expired'     // publishedAt is older than the 14-day retention window
  | 'duplicate'   // Exact URL or title duplicate; superseded by a higher-scored copy
  | 'low_score'   // relevanceScore < 30 and pruned during a cap prune cycle
  | 'manual'      // Manually archived by operator
  | 'none';       // Article is currently active; no archive reason
```

---

## MarketNewsArticle

Primary document stored per normalized article.

```typescript
interface MarketNewsArticle {
  /** Stable internal UUID assigned at ingestion. Never reused. */
  id: string;

  /** Article headline as returned by GNews, stored after basic whitespace normalization. */
  title: string;

  /** Article summary/description from GNews, or null if provider returned none. */
  description: string | null;

  /** Original article URL as returned by GNews. */
  url: string;

  /**
   * SHA-256 hex digest of the canonical form of the URL.
   * Canonical form: lowercase, scheme+host+path, query params stripped
   * unless the query param is the sole differentiator (e.g., `?id=`).
   * Used for exact-match deduplication lookup.
   */
  canonicalUrlHash: string;

  /**
   * SHA-256 hex digest of the canonical form of the title.
   * Canonical form: lowercase, punctuation stripped, whitespace collapsed.
   * Used for title-match deduplication lookup.
   */
  titleHash: string;

  /** Top image URL as returned by GNews, or null if not provided. */
  imageUrl: string | null;

  /** Display name of the news source (e.g., "Maeil Business Newspaper"). */
  sourceName: string;

  /** Homepage URL of the news source. */
  sourceUrl: string;

  /**
   * Publication datetime as returned by the provider, ISO 8601.
   * Used for freshness scoring and retention window evaluation.
   */
  publishedAt: string;

  /**
   * Server-side datetime when this article was first ingested, ISO 8601.
   * Set at ingestion; not updated on re-fetch.
   */
  fetchedAt: string;

  /** Assigned content category derived from the query theme. */
  category: ArticleCategory;

  /**
   * The query theme key used when fetching this article.
   * Matches the queryKey in QueryDefinition.
   */
  queryKey: string;

  /** ISO 639-1 language code. Always "ko" for this integration. */
  language: string;

  /** ISO 3166-1 alpha-2 country code. Always "kr" for this integration. */
  country: string;

  /**
   * Relevance score 0–100.
   * Computed deterministically at ingestion using freshness, category match,
   * title relevance, and source diversity components.
   * 0 for confirmed duplicates.
   */
  relevanceScore: number;

  /**
   * Tags explaining the relevance score breakdown.
   * Examples: "fresh_article", "category_match", "strong_title_relevance",
   * "source_concentration_penalty", "missing_description_penalty", "duplicate_penalty".
   */
  scoreReasons: string[];

  /**
   * Shared UUID for articles that belong to the same duplicate group.
   * Null if the article has no known duplicates.
   * Two articles in the same group have the same canonicalUrlHash (exact URL dup)
   * or the same titleHash (title dup).
   */
  duplicateGroupId: string | null;

  /**
   * True if this article was identified as a lower-priority copy within its
   * duplicate group and should not be served to consumers.
   * False for the canonical (preferred) copy and for non-duplicate articles.
   */
  isDuplicate: boolean;

  /**
   * True while this article is eligible for serving via pagination and Home feed.
   * Set to false when the article is pruned, expired, or manually archived.
   */
  isActive: boolean;

  /**
   * ISO 8601 datetime when isActive was set to false, or null while active.
   * Used for audit logging and observability.
   */
  archivedAt: string | null;

  /**
   * Reason why isActive was set to false.
   * "none" while the article is active.
   */
  archiveReason: ArchiveReason;

  /**
   * Provider name. Always "gnews" for this integration.
   * Allows future support for additional providers.
   */
  provider: string;

  /** Provider-assigned article ID if available, or null. */
  providerArticleId: string | null;

  /**
   * Always false. Raw GNews API response bodies must not be persisted.
   * Field exists as an explicit design guard to prevent accidental raw storage.
   */
  rawProviderStored: false;
}
```

---

## QueryDefinition

Configuration record for each GNews query theme.

```typescript
interface QueryDefinition {
  /** Internal key matching MarketNewsArticle.queryKey. */
  queryKey: string;

  /** Category assigned to articles returned by this query. */
  category: ArticleCategory;

  /** Korean display label used for UI category filters. */
  label: string;

  /**
   * GNews `q` parameter value.
   * Space-separated Korean terms, combined with OR logic by GNews.
   */
  query: string;

  /**
   * GNews `in` parameter.
   * "title,description" searches both fields.
   */
  searchIn: string;

  /** ISO 639-1 language code for GNews `lang` parameter. */
  lang: string;

  /** ISO 3166-1 alpha-2 country code for GNews `country` parameter. */
  country: string;

  /** GNews `max` parameter. Always 10 (page size) per policy. */
  pageSize: 10;

  /** GNews `sortby` parameter. "publishedAt" for freshness-first ordering. */
  sortBy: 'publishedAt' | 'relevance';
}
```

---

## PaginationRequest

Parameters accepted by the future `/api/news/market-feed` list endpoint.

```typescript
interface PaginationRequest {
  /** 1-indexed page number. Minimum: 1. Maximum: 10. */
  page: number;

  /** Items per page. Fixed at 10 per policy. */
  pageSize: 10;

  /** Optional category filter. If omitted, all categories are returned. */
  category?: ArticleCategory;
}
```

---

## PaginationResponse

Response shape for the future paginated news list endpoint.

```typescript
interface PaginationResponse {
  articles: MarketNewsArticle[];

  pagination: {
    page: number;
    pageSize: number;
    totalActive: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };

  /** ISO 8601 datetime of the oldest cached article. */
  oldestFetchedAt: string | null;

  /** ISO 8601 datetime of the newest cached article. */
  newestFetchedAt: string | null;
}
```

---

## HomeFeedResponse

Response shape for the Home top-6 news selection.

```typescript
interface HomeFeedResponse {
  articles: MarketNewsArticle[];

  /** Number of articles returned. Maximum 6. */
  count: number;

  /** Total number of currently active articles in the store. */
  totalActive: number;

  /** ISO 8601 datetime of the last successful ingestion cycle. */
  lastRefreshedAt: string | null;
}
```

---

## PruneDecision

Internal record produced during a prune cycle, one per candidate article.

```typescript
interface PruneDecision {
  articleId: string;
  action: 'archive' | 'skip';
  reason: ArchiveReason | 'category_protection' | 'batch_limit_reached';
  activeCountBefore: number;
  activeCountAfter: number;
}
```

---

## IngestionResult

Internal summary produced at the end of an ingestion cycle.

```typescript
interface IngestionResult {
  queryKey: string;
  fetchedCount: number;
  insertedCount: number;
  duplicatesSkipped: number;
  prunedCount: number;
  activeCountAfter: number;
  errorOccurred: boolean;
  errorCode: string | null;
}
```

---

## Schema constraints (normative)

| Field | Constraint |
|---|---|
| `id` | Non-empty UUID string, unique across all articles |
| `title` | Non-empty string; max 500 chars recommended |
| `description` | Nullable; max 1000 chars recommended |
| `url` | Non-empty, valid URL string |
| `canonicalUrlHash` | 64-char lowercase hex (SHA-256) |
| `titleHash` | 64-char lowercase hex (SHA-256) |
| `imageUrl` | Nullable; valid URL string if present |
| `publishedAt` | ISO 8601; must not be in the future beyond 1 hour clock skew |
| `fetchedAt` | ISO 8601; must be >= publishedAt |
| `relevanceScore` | Integer 0–100 inclusive |
| `scoreReasons` | Array; may be empty; no duplicate entries within one article |
| `isActive` | False when archiveReason != "none" |
| `archivedAt` | Null when isActive is true; ISO 8601 when isActive is false |
| `rawProviderStored` | Always literal `false`; never true |
| `provider` | Non-empty string; "gnews" for this integration |

---

## Notes on future implementation

- SHA-256 hashing for `canonicalUrlHash` and `titleHash` must be performed server-side only. No hashing in browser code.
- The `rawProviderStored: false` field is a design-time guard. Implementation code should assert `rawProviderStored === false` before writing records and fail loudly if any path would set it to true.
- The `providerArticleId` field is nullable because GNews v4 does not return a stable per-article ID in its free-plan response. It is reserved for future compatibility with a paid tier or alternative provider.
- Score recalculation after deduplication: if an article is marked `isDuplicate: true`, override `relevanceScore` to 0 and add `"duplicate_penalty"` to `scoreReasons`.
