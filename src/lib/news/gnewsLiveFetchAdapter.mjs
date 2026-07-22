/**
 * GNews live fetch adapter skeleton (Phase 3BC).
 * No-network: all HTTP calls require an explicitly injected fetchFn.
 * No env reads: apiKey and baseUrl must be provided as function arguments.
 * No real endpoint hardcoded. Tests use example.test baseUrl and synthetic placeholder keys only.
 */

import { createHash } from 'node:crypto';

// ---------------------------------------------------------------------------
// Policy constants
// ---------------------------------------------------------------------------

export const GNEWS_ADAPTER_POLICY = {
  DEFAULT_LANG: 'ko',
  DEFAULT_COUNTRY: 'kr',
  DEFAULT_MAX: 10,
  DEFAULT_SEARCH_IN: 'title,description',
  DEFAULT_SORT_BY: 'publishedAt',
  MAX_THEMES_PER_SMOKE: 2,
  MAX_ARTICLES_PER_THEME: 10,
  PROVIDER: 'gnews',
  RAW_PROVIDER_STORED: false,
};

// ---------------------------------------------------------------------------
// Query definitions — 6 themes with Korean query strings
// ---------------------------------------------------------------------------

export const GNEWS_QUERY_DEFINITIONS = [
  {
    queryKey: 'market_stocks',
    category: 'MARKET_STOCKS',
    koreanLabel: '증시·주식',
    queryString: '증시 OR 주식 OR 코스피 OR 코스닥 OR 상장사 OR 실적 OR 반도체 OR 이차전지 OR ETF',
  },
  {
    queryKey: 'macro_policy',
    category: 'MACRO_POLICY',
    koreanLabel: '매크로·정책',
    queryString: '경제 OR 경기 OR 금리 OR 물가 OR 한국은행 OR 금융위 OR 금감원 OR 정부정책 OR 세제',
  },
  {
    queryKey: 'fx',
    category: 'FX',
    koreanLabel: '환율·외환',
    queryString: '환율 OR 원달러 OR 달러 OR 엔화 OR 위안 OR 유로 OR 외환 OR 강달러',
  },
  {
    queryKey: 'oil_commodities',
    category: 'OIL_COMMODITIES',
    koreanLabel: '유가·원자재',
    queryString: '유가 OR WTI OR 브렌트유 OR 원유 OR 금값 OR 금 OR 은 OR 원자재',
  },
  {
    queryKey: 'crypto_digital_assets',
    category: 'CRYPTO_DIGITAL_ASSETS',
    koreanLabel: '코인·가상자산',
    queryString: '코인 OR 가상자산 OR 비트코인 OR 이더리움 OR 업비트 OR 두나무 OR 거래소',
  },
  {
    queryKey: 'personal_finance',
    category: 'PERSONAL_FINANCE',
    koreanLabel: '재테크·금융생활',
    queryString: '재테크 OR 투자 OR 예금 OR 적금 OR 연금 OR 보험 OR 카드 OR 대출 OR 부동산',
  },
];

// ---------------------------------------------------------------------------
// Sanitized error mapping
// ---------------------------------------------------------------------------

const ADAPTER_ERROR_MESSAGES = {
  missing_fetch_fn: 'Adapter requires an injected fetch function.',
  missing_base_url: 'Adapter requires a base URL.',
  missing_api_key: 'Adapter requires an API key.',
  invalid_query_definition: 'Invalid query definition.',
  provider_http_error: 'Provider returned an error response.',
  provider_rate_limited: 'Provider rate limit reached.',
  provider_unauthorized: 'Provider authorization failed.',
  provider_timeout: 'Provider request timed out.',
  provider_invalid_payload: 'Provider returned an invalid payload.',
  provider_empty_result: 'Provider returned an empty result.',
  internal_unavailable: 'Adapter temporarily unavailable.',
};

const RETRYABLE_ERROR_CODES = new Set([
  'provider_rate_limited',
  'provider_timeout',
  'provider_http_error',
  'internal_unavailable',
]);

export function sanitizeGnewsAdapterError(input = {}) {
  const rawCode = typeof input?.type === 'string' ? input.type : 'internal_unavailable';
  const code = rawCode in ADAPTER_ERROR_MESSAGES ? rawCode : 'internal_unavailable';
  const result = {
    code,
    message: ADAPTER_ERROR_MESSAGES[code],
    retryable: RETRYABLE_ERROR_CODES.has(code),
    provider: GNEWS_ADAPTER_POLICY.PROVIDER,
  };
  if (typeof input?.status === 'number' && input.status >= 400 && input.status < 600) {
    result.status = input.status;
  }
  return result;
}

// ---------------------------------------------------------------------------
// URL builder — deterministic, no fetch, requires injected baseUrl and apiKey
// ---------------------------------------------------------------------------

export function buildGnewsSearchUrl(queryDefinition, options = {}) {
  const { baseUrl, apiKey } = options;

  if (!baseUrl || typeof baseUrl !== 'string') {
    return { ok: false, error: sanitizeGnewsAdapterError({ type: 'missing_base_url' }) };
  }
  if (!apiKey || typeof apiKey !== 'string') {
    return { ok: false, error: sanitizeGnewsAdapterError({ type: 'missing_api_key' }) };
  }
  if (!queryDefinition?.queryString || typeof queryDefinition.queryString !== 'string') {
    return { ok: false, error: sanitizeGnewsAdapterError({ type: 'invalid_query_definition' }) };
  }

  try {
    const params = new URLSearchParams({
      q: queryDefinition.queryString,
      lang: options.lang ?? GNEWS_ADAPTER_POLICY.DEFAULT_LANG,
      country: options.country ?? GNEWS_ADAPTER_POLICY.DEFAULT_COUNTRY,
      max: String(options.max ?? GNEWS_ADAPTER_POLICY.DEFAULT_MAX),
      in: options.searchIn ?? GNEWS_ADAPTER_POLICY.DEFAULT_SEARCH_IN,
      sortby: options.sortBy ?? GNEWS_ADAPTER_POLICY.DEFAULT_SORT_BY,
      apikey: apiKey,
    });
    const url = new URL(`?${params.toString()}`, baseUrl);
    return { ok: true, url };
  } catch {
    return { ok: false, error: sanitizeGnewsAdapterError({ type: 'missing_base_url' }) };
  }
}

// ---------------------------------------------------------------------------
// Normalization helpers — SHA-256 via node:crypto (not used for secrets)
// ---------------------------------------------------------------------------

function sha256hex(str) {
  return createHash('sha256').update(String(str ?? ''), 'utf8').digest('hex');
}

const TRACKING_PARAMS = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'fbclid', 'gclid', '_ga', 'ref',
];

function canonicalizeUrl(rawUrl) {
  if (!rawUrl) return '';
  try {
    const u = new URL(rawUrl);
    TRACKING_PARAMS.forEach((p) => u.searchParams.delete(p));
    const qs = u.searchParams.toString();
    return u.origin + u.pathname + (qs ? `?${qs}` : '') + u.hash;
  } catch {
    return String(rawUrl).trim();
  }
}

function normalizeTitle(title) {
  return String(title ?? '')
    .toLowerCase()
    .replace(/[^\w\s가-힣]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function computeInitialRelevanceScore(rawArticle) {
  let score = 50;
  if (rawArticle.title) score += 10;
  if (rawArticle.description) score += 5;
  if (rawArticle.image) score += 5;
  if (rawArticle.source?.name) score += 5;
  if (rawArticle.publishedAt) score += 5;
  return Math.min(score, 80);
}

// ---------------------------------------------------------------------------
// Article normalizer — raw provider shape → MarketNewsArticle-compatible shape
// ---------------------------------------------------------------------------

export function normalizeGnewsArticle(rawArticle, context = {}) {
  if (!rawArticle || typeof rawArticle !== 'object') {
    return null;
  }

  const {
    category = 'MARKET_STOCKS',
    queryKey = 'unknown',
    fetchedAt = new Date().toISOString(),
    provider = GNEWS_ADAPTER_POLICY.PROVIDER,
    sourceFallback = '',
  } = context;

  const rawUrl = rawArticle.url ?? '';
  const rawTitle = rawArticle.title ?? '';

  const canonicalUrl = canonicalizeUrl(rawUrl);
  const canonicalUrlHash = sha256hex(canonicalUrl);
  const titleHash = sha256hex(normalizeTitle(rawTitle));

  const relevanceScore = computeInitialRelevanceScore(rawArticle);
  const scoreReasons = [];
  if (rawArticle.title) scoreReasons.push('has_title');
  if (rawArticle.description) scoreReasons.push('has_description');
  if (rawArticle.image) scoreReasons.push('has_image');
  if (rawArticle.source?.name) scoreReasons.push('has_source_name');
  if (rawArticle.publishedAt) scoreReasons.push('has_published_at');

  return {
    id: `pending_${canonicalUrlHash.slice(0, 16)}`,
    title: rawTitle,
    description: rawArticle.description ?? null,
    url: rawUrl,
    canonicalUrlHash,
    titleHash,
    imageUrl: rawArticle.image ?? null,
    sourceName: rawArticle.source?.name ?? sourceFallback,
    sourceUrl: rawArticle.source?.url ?? '',
    publishedAt: rawArticle.publishedAt ?? '',
    fetchedAt,
    category,
    queryKey,
    language: GNEWS_ADAPTER_POLICY.DEFAULT_LANG,
    country: GNEWS_ADAPTER_POLICY.DEFAULT_COUNTRY,
    relevanceScore,
    scoreReasons,
    duplicateGroupId: null,
    isDuplicate: false,
    isActive: true,
    archivedAt: null,
    archiveReason: 'none',
    provider,
    providerArticleId: null,
    rawProviderStored: false,
  };
}

// ---------------------------------------------------------------------------
// Batch normalizer — provider response → normalized article list
// ---------------------------------------------------------------------------

export function normalizeGnewsBatch(rawResponse, context = {}) {
  const {
    queryKey = 'unknown',
    category = 'MARKET_STOCKS',
    fetchedAt = new Date().toISOString(),
  } = context;

  if (!rawResponse || !Array.isArray(rawResponse.articles)) {
    return {
      ok: false,
      error: sanitizeGnewsAdapterError({ type: 'provider_invalid_payload' }),
      provider: GNEWS_ADAPTER_POLICY.PROVIDER,
      queryKey,
      category,
      fetchedAt,
      articleCount: 0,
      articles: [],
      warnings: ['Provider response missing articles array'],
    };
  }

  const articles = [];
  const warnings = [];

  for (const rawArticle of rawResponse.articles) {
    const normalized = normalizeGnewsArticle(rawArticle, { category, queryKey, fetchedAt });
    if (normalized === null) {
      warnings.push('Skipped null or non-object article item');
      continue;
    }
    if (!normalized.url || !normalized.title) {
      warnings.push('Skipped article missing url or title');
      continue;
    }
    articles.push(normalized);
  }

  return {
    ok: true,
    provider: GNEWS_ADAPTER_POLICY.PROVIDER,
    queryKey,
    category,
    fetchedAt,
    articleCount: articles.length,
    articles,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Theme fetcher — async, requires injected fetchFn
// ---------------------------------------------------------------------------

class AdapterTimeoutError extends Error {
  constructor() {
    super('adapter_timeout');
    this.code = 'provider_timeout';
  }
}

export async function fetchGnewsTheme(queryDefinition, options = {}) {
  const { fetchFn, baseUrl, apiKey, timeoutMs = 8000, nowIso } = options;

  if (!fetchFn || typeof fetchFn !== 'function') {
    return { ok: false, error: sanitizeGnewsAdapterError({ type: 'missing_fetch_fn' }) };
  }

  const urlResult = buildGnewsSearchUrl(queryDefinition, options);
  if (!urlResult.ok) {
    return { ok: false, error: urlResult.error };
  }

  const fetchedAt = nowIso ?? new Date().toISOString();
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new AdapterTimeoutError()), timeoutMs);
  });

  try {
    const response = await Promise.race([fetchFn(urlResult.url.toString()), timeoutPromise]);
    clearTimeout(timeoutId);

    if (response.status === 429) {
      return { ok: false, error: sanitizeGnewsAdapterError({ type: 'provider_rate_limited', status: 429 }) };
    }
    if (response.status === 401 || response.status === 403) {
      return { ok: false, error: sanitizeGnewsAdapterError({ type: 'provider_unauthorized', status: response.status }) };
    }
    if (!response.ok) {
      return { ok: false, error: sanitizeGnewsAdapterError({ type: 'provider_http_error', status: response.status }) };
    }

    let rawData;
    try {
      rawData = await response.json();
    } catch {
      return { ok: false, error: sanitizeGnewsAdapterError({ type: 'provider_invalid_payload' }) };
    }

    if (!Array.isArray(rawData?.articles) || rawData.articles.length === 0) {
      return { ok: false, error: sanitizeGnewsAdapterError({ type: 'provider_empty_result' }) };
    }

    return normalizeGnewsBatch(rawData, {
      queryKey: queryDefinition.queryKey,
      category: queryDefinition.category,
      fetchedAt,
    });

  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof AdapterTimeoutError) {
      return { ok: false, error: sanitizeGnewsAdapterError({ type: 'provider_timeout' }) };
    }
    return { ok: false, error: sanitizeGnewsAdapterError({ type: 'internal_unavailable' }) };
  }
}

// ---------------------------------------------------------------------------
// Batch orchestrator — fetches all selected themes, handles partial failures
// ---------------------------------------------------------------------------

export async function fetchGnewsMarketNewsBatch(queryDefinitions, options = {}) {
  const { fetchFn, baseUrl, apiKey, maxThemes, nowIso } = options;

  if (!fetchFn || typeof fetchFn !== 'function') {
    return {
      ok: false,
      error: sanitizeGnewsAdapterError({ type: 'missing_fetch_fn' }),
      provider: GNEWS_ADAPTER_POLICY.PROVIDER,
      liveAttempted: false,
      themeCount: 0,
      successCount: 0,
      failureCount: 0,
      articleCount: 0,
      articles: [],
      warnings: [],
    };
  }

  const themes = Array.isArray(queryDefinitions) ? queryDefinitions : [];
  const selected = typeof maxThemes === 'number' && maxThemes > 0 ? themes.slice(0, maxThemes) : themes;

  let successCount = 0;
  let failureCount = 0;
  const allArticles = [];
  const warnings = [];

  for (const qDef of selected) {
    const result = await fetchGnewsTheme(qDef, { fetchFn, baseUrl, apiKey, nowIso });
    if (result.ok) {
      successCount++;
      allArticles.push(...(result.articles ?? []));
      if (result.warnings?.length) {
        warnings.push(...result.warnings);
      }
    } else {
      failureCount++;
      const errCode = result.error?.code ?? 'unknown_error';
      warnings.push(`Theme ${qDef.queryKey ?? 'unknown'} failed: ${errCode}`);
    }
  }

  return {
    ok: failureCount === 0 || successCount > 0,
    provider: GNEWS_ADAPTER_POLICY.PROVIDER,
    liveAttempted: true,
    themeCount: selected.length,
    successCount,
    failureCount,
    articleCount: allArticles.length,
    articles: allArticles,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Sanitized result summary — excludes URLs, titles, descriptions, keys
// ---------------------------------------------------------------------------

export function summarizeGnewsLiveFetchResult(result) {
  const categories = new Set();
  const errorCodes = new Set();

  if (Array.isArray(result?.articles)) {
    result.articles.forEach((a) => {
      if (a?.category) categories.add(a.category);
    });
  }

  if (Array.isArray(result?.warnings)) {
    result.warnings.forEach((w) => {
      const match = /failed:\s*(\w+)/.exec(String(w));
      if (match) errorCodes.add(match[1]);
    });
  }

  return {
    ok: result?.ok ?? false,
    provider: result?.provider ?? GNEWS_ADAPTER_POLICY.PROVIDER,
    liveAttempted: result?.liveAttempted ?? false,
    themeCount: result?.themeCount ?? 0,
    successCount: result?.successCount ?? 0,
    failureCount: result?.failureCount ?? 0,
    articleCount: result?.articleCount ?? 0,
    categories: [...categories],
    warningCount: result?.warnings?.length ?? 0,
    errorCodes: [...errorCodes],
  };
}
