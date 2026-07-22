/**
 * GNews market-news policy engine — no-network deterministic utility.
 * Pure functions only. No file I/O, no network, no env reads, no side effects.
 * Designed for reuse by future server-route implementation and offline validation.
 */

// ---------------------------------------------------------------------------
// Policy constants
// ---------------------------------------------------------------------------

export const POLICY = {
  ACTIVE_CAP: 100,
  PAGE_SIZE: 10,
  MAX_PAGES: 10,
  HOME_COUNT: 6,
  RETENTION_DAYS: 14,
  PRUNE_BATCH_SIZE: 20,
  LOW_SCORE_THRESHOLD: 30,
  HOME_MAX_PER_CATEGORY: 2,
  HOME_MAX_PER_SOURCE: 2,
  EXPECTED_CATEGORIES: [
    'MARKET_STOCKS',
    'MACRO_POLICY',
    'FX',
    'OIL_COMMODITIES',
    'CRYPTO_DIGITAL_ASSETS',
    'PERSONAL_FINANCE',
  ],
  HIGH_SIGNAL_CATEGORIES: ['FX', 'OIL_COMMODITIES', 'CRYPTO_DIGITAL_ASSETS', 'MACRO_POLICY'],
  VALID_ARCHIVE_REASONS: ['cap_prune', 'expired', 'duplicate', 'low_score', 'manual', 'none'],
};

// ---------------------------------------------------------------------------
// Internal constants (security/sanitization)
// ---------------------------------------------------------------------------

const FORBIDDEN_URL_PATTERNS = [
  'gnews.io',
  'localhost',
  '.vercel.app',
  '.supabase.co',
  'supabase.io',
  'koreainvestment.com',
];

const FORBIDDEN_KEY_PATTERNS = ['sk-', 'Bearer ', 'API_KEY=', 'token='];

const NON_EXAMPLE_TEST_URL_RE = /^https?:\/\/(?![\w.-]+\.example\.test)/;

const REQUIRED_ARTICLE_FIELDS = [
  'id', 'title', 'url', 'canonicalUrlHash', 'titleHash',
  'sourceName', 'sourceUrl', 'publishedAt', 'fetchedAt',
  'category', 'queryKey', 'language', 'country',
  'relevanceScore', 'scoreReasons', 'isDuplicate', 'isActive',
  'archiveReason', 'provider', 'rawProviderStored',
];

// ---------------------------------------------------------------------------
// normalizeArticle
// ---------------------------------------------------------------------------

/**
 * Returns a sanitized copy of a raw article object with only canonical fields.
 * Forces rawProviderStored to false regardless of input.
 * Does not mutate the input.
 */
export function normalizeArticle(article) {
  if (!article || typeof article !== 'object') return null;
  return {
    id: String(article.id ?? ''),
    title: String(article.title ?? ''),
    description: article.description ?? null,
    url: String(article.url ?? ''),
    canonicalUrlHash: String(article.canonicalUrlHash ?? ''),
    titleHash: String(article.titleHash ?? ''),
    imageUrl: article.imageUrl ?? null,
    sourceName: String(article.sourceName ?? ''),
    sourceUrl: String(article.sourceUrl ?? ''),
    publishedAt: String(article.publishedAt ?? ''),
    fetchedAt: String(article.fetchedAt ?? ''),
    category: String(article.category ?? ''),
    queryKey: String(article.queryKey ?? ''),
    language: String(article.language ?? ''),
    country: String(article.country ?? ''),
    relevanceScore: Number(article.relevanceScore ?? 0),
    scoreReasons: Array.isArray(article.scoreReasons) ? [...article.scoreReasons] : [],
    duplicateGroupId: article.duplicateGroupId ?? null,
    isDuplicate: Boolean(article.isDuplicate),
    isActive: Boolean(article.isActive),
    archivedAt: article.archivedAt ?? null,
    archiveReason: String(article.archiveReason ?? 'none'),
    provider: String(article.provider ?? ''),
    providerArticleId: article.providerArticleId ?? null,
    rawProviderStored: false,
  };
}

// ---------------------------------------------------------------------------
// validateArticleShape
// ---------------------------------------------------------------------------

/**
 * Validates a single article's shape, required fields, and type constraints.
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateArticleShape(article) {
  const errors = [];

  if (!article || typeof article !== 'object') {
    return { valid: false, errors: ['Article is not an object'] };
  }

  for (const field of REQUIRED_ARTICLE_FIELDS) {
    if (!(field in article)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  if (article.rawProviderStored !== false) {
    errors.push(`rawProviderStored must be exactly false, got: ${JSON.stringify(article.rawProviderStored)}`);
  }

  if (typeof article.relevanceScore !== 'number' || article.relevanceScore < 0 || article.relevanceScore > 100) {
    errors.push(`relevanceScore must be a number in [0, 100], got: ${article.relevanceScore}`);
  }

  if (!Array.isArray(article.scoreReasons)) {
    errors.push('scoreReasons must be an array');
  }

  if (typeof article.isDuplicate !== 'boolean') {
    errors.push(`isDuplicate must be a boolean, got: ${typeof article.isDuplicate}`);
  }

  if (typeof article.isActive !== 'boolean') {
    errors.push(`isActive must be a boolean, got: ${typeof article.isActive}`);
  }

  const validCats = [...POLICY.EXPECTED_CATEGORIES, 'GENERAL_BUSINESS'];
  if (article.category && !validCats.includes(article.category)) {
    errors.push(`Unknown category: '${article.category}'`);
  }

  if (!POLICY.VALID_ARCHIVE_REASONS.includes(article.archiveReason)) {
    errors.push(`Unknown archiveReason: '${article.archiveReason}'`);
  }

  // Lifecycle consistency
  if (article.isActive === true && article.archiveReason !== 'none') {
    errors.push(`Active article must have archiveReason "none", got: "${article.archiveReason}"`);
  }
  if (article.isActive === true && article.archivedAt !== null && article.archivedAt !== undefined) {
    errors.push('Active article must have archivedAt: null');
  }

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// validateFixtureShape
// ---------------------------------------------------------------------------

/**
 * Validates the fixture metadata block and articles array.
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateFixtureShape(fixture) {
  const errors = [];

  if (!fixture || typeof fixture !== 'object') {
    return { valid: false, errors: ['Fixture is not an object'] };
  }

  if (!fixture.metadata) {
    errors.push('fixture.metadata is missing');
  } else {
    const m = fixture.metadata;
    if (m.isSynthetic !== true) errors.push('metadata.isSynthetic must be true');
    if (m.maxActiveArticles !== POLICY.ACTIVE_CAP) {
      errors.push(`metadata.maxActiveArticles must be ${POLICY.ACTIVE_CAP}, got: ${m.maxActiveArticles}`);
    }
    if (m.pageSize !== POLICY.PAGE_SIZE) {
      errors.push(`metadata.pageSize must be ${POLICY.PAGE_SIZE}, got: ${m.pageSize}`);
    }
    if (m.maxPages !== POLICY.MAX_PAGES) {
      errors.push(`metadata.maxPages must be ${POLICY.MAX_PAGES}, got: ${m.maxPages}`);
    }
    if (m.pruneBatchSize !== POLICY.PRUNE_BATCH_SIZE) {
      errors.push(`metadata.pruneBatchSize must be ${POLICY.PRUNE_BATCH_SIZE}, got: ${m.pruneBatchSize}`);
    }
    if (m.retentionDays !== POLICY.RETENTION_DAYS) {
      errors.push(`metadata.retentionDays must be ${POLICY.RETENTION_DAYS}, got: ${m.retentionDays}`);
    }
    if (!Array.isArray(m.queryThemes) || m.queryThemes.length !== POLICY.EXPECTED_CATEGORIES.length) {
      errors.push(
        `metadata.queryThemes must be an array of ${POLICY.EXPECTED_CATEGORIES.length} items, got: ${m.queryThemes?.length}`,
      );
    }
  }

  if (!Array.isArray(fixture.articles)) {
    errors.push('fixture.articles must be an array');
  } else {
    if (fixture.articles.length < 24) {
      errors.push(`fixture.articles must have at least 24 articles, has ${fixture.articles.length}`);
    }
    fixture.articles.forEach((a, i) => {
      const result = validateArticleShape(a);
      if (!result.valid) {
        result.errors.forEach((e) => errors.push(`articles[${i}] (${a?.id ?? 'unknown'}): ${e}`));
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// detectDuplicateGroups
// ---------------------------------------------------------------------------

/**
 * Detects duplicate groups by canonicalUrlHash, titleHash, and duplicateGroupId.
 * Returns groups that have more than one member.
 * @param {object[]} articles
 * @returns {{
 *   exactUrlGroups: Map<string, object[]>,
 *   titleHashGroups: Map<string, object[]>,
 *   duplicateGroupIdGroups: Map<string, object[]>,
 *   duplicateCandidates: object[]
 * }}
 */
export function detectDuplicateGroups(articles) {
  const exactUrlGroups = new Map();
  const titleHashGroups = new Map();
  const duplicateGroupIdGroups = new Map();

  for (const article of articles) {
    if (article.canonicalUrlHash) {
      if (!exactUrlGroups.has(article.canonicalUrlHash)) {
        exactUrlGroups.set(article.canonicalUrlHash, []);
      }
      exactUrlGroups.get(article.canonicalUrlHash).push(article);
    }

    if (article.titleHash) {
      if (!titleHashGroups.has(article.titleHash)) {
        titleHashGroups.set(article.titleHash, []);
      }
      titleHashGroups.get(article.titleHash).push(article);
    }

    if (article.duplicateGroupId) {
      if (!duplicateGroupIdGroups.has(article.duplicateGroupId)) {
        duplicateGroupIdGroups.set(article.duplicateGroupId, []);
      }
      duplicateGroupIdGroups.get(article.duplicateGroupId).push(article);
    }
  }

  // Keep only groups with > 1 member
  const filteredExact = new Map([...exactUrlGroups].filter(([, v]) => v.length > 1));
  const filteredTitle = new Map([...titleHashGroups].filter(([, v]) => v.length > 1));

  const duplicateCandidates = articles.filter((a) => a.isDuplicate === true);

  return {
    exactUrlGroups: filteredExact,
    titleHashGroups: filteredTitle,
    duplicateGroupIdGroups,
    duplicateCandidates,
  };
}

// ---------------------------------------------------------------------------
// detectExpiredArticles
// ---------------------------------------------------------------------------

/**
 * Returns articles whose publishedAt is older than retentionDays before referenceTime.
 * Uses a deterministic referenceTime — never calls Date.now() internally.
 * @param {object[]} articles
 * @param {{ referenceTime: string, retentionDays?: number }} options
 * @returns {object[]}
 */
export function detectExpiredArticles(articles, { referenceTime, retentionDays = POLICY.RETENTION_DAYS }) {
  const refMs = new Date(referenceTime).getTime();
  const cutoffMs = refMs - retentionDays * 24 * 60 * 60 * 1000;

  return articles.filter((a) => {
    const publishedMs = new Date(a.publishedAt).getTime();
    return Number.isFinite(publishedMs) && publishedMs < cutoffMs;
  });
}

// ---------------------------------------------------------------------------
// rankPruneCandidates
// ---------------------------------------------------------------------------

/**
 * Ranks all articles as prune candidates using the accepted policy priority:
 *   Tier 1: isDuplicate — archiveReason: "duplicate"
 *   Tier 2: expired (publishedAt older than retentionDays) — archiveReason: "expired"
 *   Tier 3: low relevanceScore (< lowScoreThreshold) — archiveReason: "low_score"
 *   Tier 4: remaining — archiveReason: "cap_prune"
 * Within each tier, oldest publishedAt is ranked first (highest prune priority).
 * Category protection: active articles that are the last in their category are marked
 * isProtected: true (skipped during live prune unless duplicate or expired).
 *
 * @param {object[]} articles
 * @param {{
 *   referenceTime: string,
 *   retentionDays?: number,
 *   lowScoreThreshold?: number,
 *   batchSize?: number
 * }} options
 * @returns {{ article: object, pruneReason: string, tier: number, isProtected: boolean }[]}
 */
export function rankPruneCandidates(articles, {
  referenceTime,
  retentionDays = POLICY.RETENTION_DAYS,
  lowScoreThreshold = POLICY.LOW_SCORE_THRESHOLD,
  batchSize = POLICY.PRUNE_BATCH_SIZE,
}) {
  const refMs = new Date(referenceTime).getTime();
  const cutoffMs = refMs - retentionDays * 24 * 60 * 60 * 1000;

  const assignTier = (article) => {
    if (article.isDuplicate) return { tier: 1, pruneReason: 'duplicate' };
    const publishedMs = new Date(article.publishedAt).getTime();
    if (Number.isFinite(publishedMs) && publishedMs < cutoffMs) return { tier: 2, pruneReason: 'expired' };
    if (typeof article.relevanceScore === 'number' && article.relevanceScore < lowScoreThreshold) {
      return { tier: 3, pruneReason: 'low_score' };
    }
    return { tier: 4, pruneReason: 'cap_prune' };
  };

  // Assign tiers and sort: tier ASC, then publishedAt ASC (oldest first)
  const scored = articles.map((a) => {
    const { tier, pruneReason } = assignTier(a);
    return { article: a, pruneReason, tier, isProtected: false };
  });

  scored.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    const tA = new Date(a.article.publishedAt).getTime();
    const tB = new Date(b.article.publishedAt).getTime();
    return (Number.isFinite(tA) ? tA : 0) - (Number.isFinite(tB) ? tB : 0);
  });

  // Simulate active count per category for protection logic
  const simulatedCount = {};
  for (const a of articles) {
    if (a.isActive) {
      simulatedCount[a.category] = (simulatedCount[a.category] || 0) + 1;
    }
  }

  const result = [];

  for (const entry of scored) {
    const { article, tier } = entry;

    // Tier 1 (duplicate) and Tier 2 (expired) bypass category protection
    if (tier === 1 || tier === 2) {
      result.push({ ...entry, isProtected: false });
      if (article.isActive) {
        simulatedCount[article.category] = Math.max(0, (simulatedCount[article.category] || 0) - 1);
      }
      continue;
    }

    // Category protection for tier 3 and 4
    if (article.isActive && (simulatedCount[article.category] || 0) <= 1) {
      result.push({ ...entry, isProtected: true });
      continue;
    }

    result.push({ ...entry, isProtected: false });
    if (article.isActive) {
      simulatedCount[article.category] = Math.max(0, (simulatedCount[article.category] || 0) - 1);
    }

    const unprotectedCount = result.filter((r) => !r.isProtected).length;
    if (unprotectedCount >= batchSize) break;
  }

  return result;
}

// ---------------------------------------------------------------------------
// paginateArticles
// ---------------------------------------------------------------------------

/**
 * Paginates active, non-duplicate articles.
 * Input page is clamped to [1, totalPages]. Policy page size is always 10.
 * @param {object[]} articles
 * @param {{ page?: number, pageSize?: number, maxPages?: number }} options
 * @returns {{ articles: object[], pagination: object }}
 */
export function paginateArticles(articles, {
  page = 1,
  pageSize = POLICY.PAGE_SIZE,
  maxPages = POLICY.MAX_PAGES,
} = {}) {
  const eligible = articles.filter((a) => a.isActive === true && a.isDuplicate === false);

  const sorted = [...eligible].sort((a, b) => {
    if (b.relevanceScore !== a.relevanceScore) return b.relevanceScore - a.relevanceScore;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  const totalActive = sorted.length;
  const totalPages = Math.min(Math.ceil(totalActive / pageSize), maxPages) || 1;
  const clampedPage = Math.max(1, Math.min(Math.floor(page), totalPages));

  const start = (clampedPage - 1) * pageSize;
  const pageArticles = sorted.slice(start, start + pageSize);

  return {
    articles: pageArticles,
    pagination: {
      page: clampedPage,
      pageSize,
      totalActive,
      totalPages,
      hasNextPage: clampedPage < totalPages,
      hasPrevPage: clampedPage > 1,
    },
  };
}

// ---------------------------------------------------------------------------
// selectHomeArticles
// ---------------------------------------------------------------------------

/**
 * Selects up to `count` articles for the Home feed using category/source balancing.
 * Walk the relevanceScore-sorted eligible list and apply per-category and per-source caps.
 * Excludes inactive and duplicate articles.
 * @param {object[]} articles
 * @param {{ count?: number, maxPerCategory?: number, maxPerSource?: number }} options
 * @returns {{ articles: object[], count: number }}
 */
export function selectHomeArticles(articles, {
  count = POLICY.HOME_COUNT,
  maxPerCategory = POLICY.HOME_MAX_PER_CATEGORY,
  maxPerSource = POLICY.HOME_MAX_PER_SOURCE,
} = {}) {
  const candidates = articles
    .filter((a) => a.isActive === true && a.isDuplicate === false)
    .sort((a, b) => {
      if (b.relevanceScore !== a.relevanceScore) return b.relevanceScore - a.relevanceScore;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

  const selected = [];
  const categoryCounts = {};
  const sourceCounts = {};

  for (const article of candidates) {
    if (selected.length >= count) break;

    const catCount = categoryCounts[article.category] || 0;
    const srcCount = sourceCounts[article.sourceName] || 0;

    if (catCount >= maxPerCategory) continue;
    if (srcCount >= maxPerSource) continue;

    selected.push(article);
    categoryCounts[article.category] = catCount + 1;
    sourceCounts[article.sourceName] = srcCount + 1;
  }

  return { articles: selected, count: selected.length };
}

// ---------------------------------------------------------------------------
// scanNewsPolicyForbiddenPatterns
// ---------------------------------------------------------------------------

/**
 * Scans a string of text for forbidden URL patterns, key patterns, and dangerous code patterns.
 * Returns sanitized finding labels only — never returns matched values.
 * @param {string} text
 * @returns {{ findings: string[] }}
 */
export function scanNewsPolicyForbiddenPatterns(text) {
  const findings = [];

  for (const pattern of FORBIDDEN_URL_PATTERNS) {
    if (text.includes(pattern)) findings.push(`Forbidden URL pattern: '${pattern}'`);
  }

  for (const pattern of FORBIDDEN_KEY_PATTERNS) {
    if (text.includes(pattern)) findings.push(`Forbidden key pattern: '${pattern}'`);
  }

  if (/fetch\s*\(/.test(text)) findings.push('Contains fetch() call');
  if (/XMLHttpRequest/.test(text)) findings.push('Contains XMLHttpRequest');
  if (/require\s*\(\s*['"]https?['"]/.test(text)) findings.push("Contains require('http/https')");
  if (/import\.meta\.env\.(?:PUBLIC_)?GNEWS_API_KEY/.test(text)) {
    findings.push('Contains GNEWS_API_KEY import.meta.env read');
  }
  if (/process\.env\.(?:PUBLIC_)?GNEWS_API_KEY/.test(text)) {
    findings.push('Contains GNEWS_API_KEY process.env read');
  }

  return { findings };
}

// ---------------------------------------------------------------------------
// checkArticleUrlDomains
// ---------------------------------------------------------------------------

/**
 * Verifies that all URL fields in article objects are under *.example.test domains.
 * @param {object[]} articles
 * @returns {{ violations: string[] }}
 */
export function checkArticleUrlDomains(articles) {
  const violations = [];

  for (const a of articles) {
    if (a.url && NON_EXAMPLE_TEST_URL_RE.test(a.url)) {
      violations.push(`${a.id}: url not under example.test`);
    }
    if (a.imageUrl && NON_EXAMPLE_TEST_URL_RE.test(a.imageUrl)) {
      violations.push(`${a.id}: imageUrl not under example.test`);
    }
    if (a.sourceUrl && NON_EXAMPLE_TEST_URL_RE.test(a.sourceUrl)) {
      violations.push(`${a.id}: sourceUrl not under example.test`);
    }
  }

  return { violations };
}

// ---------------------------------------------------------------------------
// summarizePolicyValidation
// ---------------------------------------------------------------------------

/**
 * Runs all policy validations against a fixture and returns a compact summary object.
 * Uses a deterministic referenceTime (never Date.now()).
 * @param {object} fixture
 * @param {{ referenceTime?: string }} options
 */
export function summarizePolicyValidation(fixture, { referenceTime = '2026-06-23T09:00:00Z' } = {}) {
  const articles = Array.isArray(fixture?.articles) ? fixture.articles : [];

  const fixtureValidation = validateFixtureShape(fixture);
  const urlCheck = checkArticleUrlDomains(articles);
  const dupResult = detectDuplicateGroups(articles);
  const expiredList = detectExpiredArticles(articles, { referenceTime, retentionDays: POLICY.RETENTION_DAYS });
  const pruneCandidates = rankPruneCandidates(articles, { referenceTime });
  const page1 = paginateArticles(articles, { page: 1 });
  const homeResult = selectHomeArticles(articles);

  const activeNonDup = articles.filter((a) => a.isActive && !a.isDuplicate);
  const uniqueCategories = new Set(activeNonDup.map((a) => a.category));
  const homeCategories = new Set(homeResult.articles.map((a) => a.category));

  return {
    fixtureValid: fixtureValidation.valid,
    fixtureErrors: fixtureValidation.errors,
    articleCount: articles.length,
    activeNonDupCount: activeNonDup.length,
    urlViolations: urlCheck.violations.length,
    categoriesInFixture: uniqueCategories.size,
    exactUrlDupGroups: dupResult.exactUrlGroups.size,
    titleHashDupGroups: dupResult.titleHashGroups.size,
    duplicateGroupIdGroups: dupResult.duplicateGroupIdGroups.size,
    markedDuplicateCount: dupResult.duplicateCandidates.length,
    expiredCount: expiredList.length,
    pruneCandidatesTotal: pruneCandidates.length,
    pruneCandidatesUnprotected: pruneCandidates.filter((c) => !c.isProtected).length,
    pruneTierCounts: {
      tier1_duplicate: pruneCandidates.filter((c) => c.tier === 1).length,
      tier2_expired: pruneCandidates.filter((c) => c.tier === 2).length,
      tier3_lowScore: pruneCandidates.filter((c) => c.tier === 3).length,
      tier4_capPrune: pruneCandidates.filter((c) => c.tier === 4).length,
    },
    paginationPage1Count: page1.articles.length,
    paginationTotalActive: page1.pagination.totalActive,
    paginationTotalPages: page1.pagination.totalPages,
    homeCount: homeResult.count,
    homeCategoryCount: homeCategories.size,
    homeMarketStocksCount: homeResult.articles.filter((a) => a.category === 'MARKET_STOCKS').length,
  };
}
