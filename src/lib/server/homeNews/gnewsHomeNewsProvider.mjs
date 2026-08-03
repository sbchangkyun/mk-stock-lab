/**
 * Phase 3GL — Home GNews feed (server-only, read-only, fail-safe).
 *
 * Phase 3GL-HF5: Production's original single-strategy Search-only Korean-OR-query approach could
 * return a successful-but-zero-article response (verified in Production: ok=false,
 * code=NEWS_NO_RESULTS, every diagnostics count 0). This module now runs a bounded TWO-STAGE cascade
 * per uncached feed load, capped at exactly 2 external requests:
 *
 *   A. PRIMARY   -- GNews Top Headlines, Korean business (category=business, lang=ko, country=kr, no
 *                   client-controlled query). Stops here whenever >=1 usable article survives
 *                   normalization. feedMode='latest'.
 *   B. FALLBACK  -- GNews Search, a broad bilingual "latest-available market news" query, sortby=
 *                   publishedAt, no from/to filter (so it can surface the newest CURRENTLY AVAILABLE
 *                   article for that query even when it isn't from today). Runs ONLY when the primary
 *                   request itself succeeded but returned zero usable articles after normalization.
 *                   feedMode='latest_available'.
 *
 * A separate module-local "last-good" result (independent of the 5-minute TTL response cache) is
 * updated after every successful non-empty feed. When a later refresh hits a provider HTTP failure,
 * timeout, invalid JSON, or a zero-usable-article outcome from BOTH strategies, and a last-good result
 * exists in the current runtime, that last-good set of articles is served as a successful response
 * (feedMode='last_good') instead of an empty state. Old `publishedAt` values are never rewritten to
 * now -- only `generatedAt` reflects the current call.
 *
 * The API key is passed in by the caller (never read from env inside this module) and is never
 * included in any returned value, cache entry, or thrown error. No stored article history beyond the
 * in-memory last-good set, no fixture fallback: an absent key, or a genuine failure of both strategies
 * with no last-good available, returns an honest unavailable result, never a fabricated headline. Full
 * article `content` is never requested or stored; only client-safe fields are returned, capped at 6
 * articles.
 */

const GNEWS_SEARCH_BASE = 'https://gnews.io/api/v4/search';
const GNEWS_TOP_HEADLINES_BASE = 'https://gnews.io/api/v4/top-headlines';
const GNEWS_TIMEOUT_MS = 6000;
const HOME_NEWS_TTL_MS = 5 * 60 * 1000;
const MAX_ARTICLES = 6;
// Phase 3GL-HF4: GNews Free plan caps `max` at 10 per request (20 returned HTTP 400).
const PROVIDER_MAX = 10;

// Phase 3GL-HF5 §5B: rate-spacing delay observed before issuing the second (fallback) request, so the
// bounded 2-request cascade never bursts both GNews calls back-to-back. Always routed through the
// injectable `sleepFn` dependency -- tests inject a no-op so they never really wait.
const FALLBACK_REQUEST_DELAY_MS = 1100;

// Phase 3GL-HF5 §5B: broad bilingual "latest-available market news" query -- verified against GNews's
// documented Search syntax (quoted-phrase support, OR operator, no from/to required) and kept well
// under its query-length limit while covering: Korean stock market, US stock market, economy, interest
// rates, FX, commodities.
const FALLBACK_QUERY =
  '코스피 OR 코스닥 OR 증시 OR 주식 OR economy OR stocks OR "stock market" OR inflation OR "interest rates" OR currency OR oil';

const TRACKING_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid', 'ref'];

// Phase 3GL-HF5 §8: added English keyword coverage (case-insensitive; haystack is already lowercased)
// so fallback English-language articles classify honestly instead of defaulting to GENERAL_MARKET or
// being over-classified as OVERSEAS_STOCKS. Order is preserved (FX -> COMMODITIES -> MACRO ->
// DOMESTIC_STOCKS -> OVERSEAS_STOCKS -> default) so the more specific categories are always checked
// with at least equal priority before the generic OVERSEAS_STOCKS bucket.
const CATEGORY_KEYWORDS = [
  {
    category: 'FX',
    keywords: [
      '환율', '원달러', '원/달러', '원화', '달러화', '엔화', '위안화', '유로화', '강달러',
      'exchange rate', 'currency', 'dollar', 'yen', 'euro', 'forex',
    ],
  },
  {
    category: 'COMMODITIES',
    keywords: [
      '유가', 'wti', '브렌트유', '원유', '금값', '원자재', 'opec', '은값',
      'oil', 'crude', 'brent', 'gold', 'commodities',
    ],
  },
  {
    category: 'MACRO',
    keywords: [
      '금리', '물가', '인플레이션', '연준', 'fomc', '한국은행', 'gdp', '실업률', '경기', '통화정책', '기준금리',
      'interest rate', 'inflation', 'federal reserve', 'fed', 'central bank', 'unemployment', 'monetary policy',
    ],
  },
  {
    category: 'DOMESTIC_STOCKS',
    keywords: [
      '코스피', '코스닥', '국내증시', '상장사', '유가증권시장',
      'kospi', 'kosdaq', 'korean stocks', 'south korean stocks',
    ],
  },
  {
    category: 'OVERSEAS_STOCKS',
    keywords: [
      '나스닥', '다우존스', 's&p', '뉴욕증시', '월가', '뉴욕증권거래소', '빅테크',
      'nasdaq', 'dow', 'wall street', 'stocks', 'equities', 'stock market',
    ],
  },
];

/** Client-facing category codes; HomeMarketNews.astro maps these to Korean labels. */
export const HOME_NEWS_CATEGORIES = [
  'DOMESTIC_STOCKS',
  'OVERSEAS_STOCKS',
  'FX',
  'MACRO',
  'COMMODITIES',
  'GENERAL_MARKET',
];

// The 5-minute TTL response cache -- reused across calls within the window regardless of which
// strategy/feedMode produced the cached value (a cache hit issues zero provider requests).
let ttlCache = null;

// Phase 3GL-HF5 §6: a SEPARATE, TTL-independent last-good result. Updated after every successful
// non-empty feed (from either strategy); consulted only when the current refresh cannot produce a
// fresh non-empty result of its own.
let lastGoodArticles = null;

const canonicalizeUrl = (rawUrl) => {
  if (!rawUrl) return '';
  try {
    const u = new URL(rawUrl);
    TRACKING_PARAMS.forEach((p) => u.searchParams.delete(p));
    const qs = u.searchParams.toString();
    return u.origin + u.pathname + (qs ? `?${qs}` : '') + u.hash;
  } catch {
    return String(rawUrl).trim();
  }
};

const normalizeTitleKey = (title) =>
  String(title ?? '')
    .toLowerCase()
    .replace(/[^\w\s가-힣]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

const classifyArticle = (title, description) => {
  const haystack = `${title ?? ''} ${description ?? ''}`.toLowerCase();
  for (const { category, keywords } of CATEGORY_KEYWORDS) {
    if (keywords.some((k) => haystack.includes(k.toLowerCase()))) return category;
  }
  return 'GENERAL_MARKET';
};

const MAX_TITLE_LEN = 240;
const MAX_DESCRIPTION_LEN = 600;
const MAX_SOURCE_NAME_LEN = 120;
const MAX_URL_LEN = 2048;

/** True only for a well-formed http/https URL within the given length bound. */
const isSafeHttpUrl = (value, maxLen) => {
  if (typeof value !== 'string' || value.length === 0 || value.length > maxLen) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

/** True only for a string that parses as a real, non-NaN point in time. */
const isValidIsoDate = (value) => {
  if (typeof value !== 'string' || value.trim().length === 0) return false;
  const ms = Date.parse(value);
  return Number.isFinite(ms);
};

const truncate = (value, maxLen) => (value.length > maxLen ? value.slice(0, maxLen) : value);

/**
 * Maps a raw GNews article to client-safe fields only. Returns null when any required field
 * (title, url, publishedAt) is missing, malformed, non-HTTP(S), or out of its length bound —
 * this is the only gate between untrusted provider content and the client response.
 */
export const normalizeGnewsHomeArticle = (rawArticle) => {
  if (!rawArticle || typeof rawArticle !== 'object') return null;

  const title = typeof rawArticle.title === 'string' ? rawArticle.title.trim() : '';
  if (!title || title.length > MAX_TITLE_LEN) return null;

  const url = typeof rawArticle.url === 'string' ? rawArticle.url.trim() : '';
  if (!isSafeHttpUrl(url, MAX_URL_LEN)) return null;

  const publishedAt = typeof rawArticle.publishedAt === 'string' ? rawArticle.publishedAt.trim() : '';
  if (!isValidIsoDate(publishedAt)) return null;

  const rawDescription = typeof rawArticle.description === 'string' ? rawArticle.description.trim() : '';
  const description = rawDescription ? truncate(rawDescription, MAX_DESCRIPTION_LEN) : null;

  const rawSourceName = typeof rawArticle.source?.name === 'string' ? rawArticle.source.name.trim() : '';
  const sourceName = rawSourceName ? truncate(rawSourceName, MAX_SOURCE_NAME_LEN) : '알 수 없음';

  const rawImage = typeof rawArticle.image === 'string' ? rawArticle.image.trim() : '';
  const image = isSafeHttpUrl(rawImage, MAX_URL_LEN) ? rawImage : null;

  const rawSourceUrl = typeof rawArticle.source?.url === 'string' ? rawArticle.source.url.trim() : '';
  const sourceUrl = isSafeHttpUrl(rawSourceUrl, MAX_URL_LEN) ? rawSourceUrl : null;

  return {
    id: canonicalizeUrl(url),
    title,
    description,
    url,
    image,
    publishedAt,
    sourceName,
    sourceUrl,
    category: classifyArticle(title, description),
    titleKey: normalizeTitleKey(title),
  };
};

/** Dedupes by canonical URL and normalized title, sorts newest first, caps to `limit`. */
export const dedupeAndRankHomeArticles = (articles, limit = MAX_ARTICLES) => {
  const sorted = [...articles].sort((a, b) => {
    const ta = a?.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const tb = b?.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0);
  });

  const seenUrls = new Set();
  const seenTitles = new Set();
  const deduped = [];

  for (const article of sorted) {
    if (!article || !article.id) continue;
    if (seenUrls.has(article.id)) continue;
    if (article.titleKey && seenTitles.has(article.titleKey)) continue;
    seenUrls.add(article.id);
    if (article.titleKey) seenTitles.add(article.titleKey);
    const { titleKey, ...publicArticle } = article;
    void titleKey;
    deduped.push(publicArticle);
    if (deduped.length >= limit) break;
  }

  return deduped;
};

/** Sanitized upstream status mapping shared by both GNews endpoints — never surfaces a raw status/body. */
const mapGnewsHttpErrorCode = (status) => {
  if (status === 400) return 'NEWS_BAD_REQUEST';
  if (status === 401) return 'NEWS_UNAUTHORIZED';
  if (status === 403) return 'NEWS_QUOTA_EXHAUSTED';
  if (status === 429) return 'NEWS_RATE_LIMITED';
  return 'NEWS_PROVIDER_ERROR';
};

/** Shared bounded-timeout GET + sanitized-error-mapping for both GNews endpoints. */
const fetchGnewsEndpoint = async (url, fetchFn) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GNEWS_TIMEOUT_MS);
  try {
    const res = await fetchFn(url, { method: 'GET', signal: controller.signal });
    if (!res.ok) return { ok: false, code: mapGnewsHttpErrorCode(res.status) };
    const body = await res.json();
    if (!Array.isArray(body?.articles)) return { ok: false, code: 'NEWS_PROVIDER_ERROR' };
    return { ok: true, articles: body.articles };
  } catch {
    return { ok: false, code: 'NEWS_PROVIDER_ERROR' };
  } finally {
    clearTimeout(timer);
  }
};

/**
 * PRIMARY (Phase 3GL-HF5 §5A) — GNews Top Headlines, Korean business. No client-controlled query
 * parameter at all; category/lang/country are the only targeting mechanism.
 */
const fetchGnewsTopHeadlinesBusinessKoKr = async (apiKey, fetchFn) => {
  const params = new URLSearchParams({
    category: 'business',
    lang: 'ko',
    country: 'kr',
    max: String(PROVIDER_MAX),
    apikey: apiKey,
  });
  return fetchGnewsEndpoint(`${GNEWS_TOP_HEADLINES_BASE}?${params.toString()}`, fetchFn);
};

/**
 * FALLBACK (Phase 3GL-HF5 §5B) — GNews Search, broad bilingual "latest-available market news" query.
 * No `lang` (Search's supported-language list does not include Korean — see HF4), no `from`/`to` (so
 * the newest CURRENTLY AVAILABLE article for the query surfaces even when it predates today).
 */
const fetchGnewsSearchLatestAvailable = async (apiKey, fetchFn) => {
  const params = new URLSearchParams({
    q: FALLBACK_QUERY,
    max: String(PROVIDER_MAX),
    sortby: 'publishedAt',
    apikey: apiKey,
  });
  return fetchGnewsEndpoint(`${GNEWS_SEARCH_BASE}?${params.toString()}`, fetchFn);
};

const normalizeAndRank = (rawArticles) => {
  const normalized = rawArticles.map(normalizeGnewsHomeArticle).filter(Boolean);
  return { normalized, ranked: dedupeAndRankHomeArticles(normalized, MAX_ARTICLES) };
};

/** Records a fresh non-empty successful result as the runtime-local last-good set (Phase 3GL-HF5 §6). */
const rememberLastGood = (articles) => {
  lastGoodArticles = articles.map((article) => ({ ...article }));
};

/**
 * Builds a successful last-good response. `publishedAt` values are copied through unchanged from the
 * remembered articles — only `generatedAt` reflects the current call (Phase 3GL-HF5 §6).
 */
const buildLastGoodValue = (now, diagnostics) => {
  const baseDiagnostics =
    diagnostics ?? {
      primaryProviderArticleCount: 0,
      primaryNormalizedArticleCount: 0,
      fallbackAttempted: false,
      fallbackProviderArticleCount: 0,
      fallbackNormalizedArticleCount: 0,
    };
  return {
    ok: true,
    code: 'NONE',
    generatedAt: new Date(now()).toISOString(),
    articles: lastGoodArticles.map((article) => ({ ...article })),
    feedMode: 'last_good',
    selectedStrategy: 'last_good_runtime_cache',
    // returnedArticleCount always reflects what is ACTUALLY served (the last-good set), never the
    // (possibly zero) count from the cascade that triggered this fallback.
    diagnostics: { ...baseDiagnostics, returnedArticleCount: lastGoodArticles.length },
  };
};

/**
 * @param {{ apiKey?: string, fetchFn?: typeof fetch, now?: () => number, sleepFn?: (ms: number) => Promise<void> }} deps
 * @returns {Promise<{ ok: boolean, code: string, generatedAt: string, articles: object[], feedMode?: string, selectedStrategy?: string, diagnostics?: object }>}
 */
export const getHomeNewsFeed = async (deps = {}) => {
  const now = deps.now ?? (() => Date.now());
  const fetchFn = deps.fetchFn ?? fetch;
  const sleepFn = deps.sleepFn ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  const apiKey = typeof deps.apiKey === 'string' ? deps.apiKey.trim() : '';

  if (!apiKey) {
    return { ok: false, code: 'NEWS_NOT_CONFIGURED', generatedAt: new Date(now()).toISOString(), articles: [] };
  }

  if (ttlCache && now() - ttlCache.storedAtMs < HOME_NEWS_TTL_MS) {
    return { ...ttlCache.value };
  }

  const store = (value) => {
    ttlCache = { value, storedAtMs: now() };
    return { ...value };
  };

  // STAGE A -- primary: Korean business Top Headlines.
  const primaryResult = await fetchGnewsTopHeadlinesBusinessKoKr(apiKey, fetchFn);

  if (!primaryResult.ok) {
    // Phase 3GL-HF5 §11: a primary-request error may use an existing last-good result instead of an
    // honest failure code -- but the Search fallback is NOT run after a primary request-level error
    // (it is only for a *successful*, zero-result primary response — §5B).
    if (lastGoodArticles) return store(buildLastGoodValue(now));
    // Never cache an honest failure -- the next load should retry the provider immediately rather
    // than being wedged into repeating the same error for the rest of the 5-minute TTL window.
    return { ok: false, code: primaryResult.code, generatedAt: new Date(now()).toISOString(), articles: [] };
  }

  const primaryProviderArticleCount = primaryResult.articles.length;
  const { normalized: primaryNormalized, ranked: primaryArticles } = normalizeAndRank(primaryResult.articles);
  const primaryNormalizedArticleCount = primaryNormalized.length;

  if (primaryArticles.length > 0) {
    rememberLastGood(primaryArticles);
    const diagnostics = {
      primaryProviderArticleCount,
      primaryNormalizedArticleCount,
      fallbackAttempted: false,
      fallbackProviderArticleCount: 0,
      fallbackNormalizedArticleCount: 0,
      returnedArticleCount: primaryArticles.length,
    };
    return store({
      ok: true,
      code: 'NONE',
      generatedAt: new Date(now()).toISOString(),
      articles: primaryArticles,
      feedMode: 'latest',
      selectedStrategy: 'top_headlines_business_ko_kr',
      diagnostics,
    });
  }

  // STAGE B -- fallback: primary succeeded but yielded zero usable articles after normalization.
  await sleepFn(FALLBACK_REQUEST_DELAY_MS);
  const fallbackResult = await fetchGnewsSearchLatestAvailable(apiKey, fetchFn);

  const fallbackProviderArticleCount = fallbackResult.ok ? fallbackResult.articles.length : 0;
  const { normalized: fallbackNormalized, ranked: fallbackArticles } = fallbackResult.ok
    ? normalizeAndRank(fallbackResult.articles)
    : { normalized: [], ranked: [] };
  const fallbackNormalizedArticleCount = fallbackNormalized.length;

  if (fallbackArticles.length > 0) {
    rememberLastGood(fallbackArticles);
    const diagnostics = {
      primaryProviderArticleCount,
      primaryNormalizedArticleCount,
      fallbackAttempted: true,
      fallbackProviderArticleCount,
      fallbackNormalizedArticleCount,
      returnedArticleCount: fallbackArticles.length,
    };
    return store({
      ok: true,
      code: 'NONE',
      generatedAt: new Date(now()).toISOString(),
      articles: fallbackArticles,
      feedMode: 'latest_available',
      selectedStrategy: 'search_latest_available_market',
      diagnostics,
    });
  }

  // Both approved strategies returned zero usable articles.
  const diagnostics = {
    primaryProviderArticleCount,
    primaryNormalizedArticleCount,
    fallbackAttempted: true,
    fallbackProviderArticleCount,
    fallbackNormalizedArticleCount,
    returnedArticleCount: 0,
  };

  if (lastGoodArticles) return store(buildLastGoodValue(now, diagnostics));

  // Phase 3GL-HF2 §11 (still honored): a successful-but-empty outcome is not an indistinguishable
  // "ok" live feed -- report it honestly so the client shows its unavailable state. Never cached, for
  // the same reason as the primary-error path above: retry on the very next load, don't wedge.
  return { ok: false, code: 'NEWS_NO_RESULTS', generatedAt: new Date(now()).toISOString(), articles: [], diagnostics };
};
