/**
 * Phase 3GL — Home GNews feed (server-only, read-only, fail-safe).
 *
 * Sources up to 6 market-news headlines from GNews's public search endpoint using ONE combined query
 * per cache refresh (never a per-category multi-query fan-out — this is deliberately different from the
 * existing multi-theme src/lib/news/gnewsLiveFetchAdapter.mjs, which powers a separate, still
 * fixture-first /api/news/market-feed route and is not reused here). The API key is passed in by the
 * caller (never read from env inside this module) and is never included in any returned value, cache
 * entry, or thrown error. No stored article history, no fixture fallback: an absent key or provider
 * failure returns an honest unavailable result, never a fabricated headline. Full article `content` is
 * never requested or stored; only client-safe fields are returned, capped at 6 articles.
 */

const GNEWS_BASE = 'https://gnews.io/api/v4/search';
const GNEWS_TIMEOUT_MS = 6000;
const HOME_NEWS_TTL_MS = 5 * 60 * 1000;
const MAX_ARTICLES = 6;
const PROVIDER_MAX = 20;

// Phase 3GL-HF2 §10: simplified to a conservative 8-term OR expression after the 16-term version
// returned zero articles in Preview -- kept well within the provider's practical query-length
// tolerance while still covering the same core market-news surface (domestic stocks, overseas
// stocks, FX, rates, oil).
const COMBINED_QUERY = '코스피 OR 코스닥 OR 국내증시 OR 뉴욕증시 OR 나스닥 OR 환율 OR 금리 OR 유가';

const TRACKING_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid', 'ref'];

const CATEGORY_KEYWORDS = [
  { category: 'FX', keywords: ['환율', '원달러', '원/달러', '원화', '달러화', '엔화', '위안화', '유로화', '강달러'] },
  { category: 'COMMODITIES', keywords: ['유가', 'wti', '브렌트유', '원유', '금값', '원자재', 'opec', '은값'] },
  { category: 'MACRO', keywords: ['금리', '물가', '인플레이션', '연준', 'fomc', '한국은행', 'gdp', '실업률', '경기', '통화정책', '기준금리'] },
  { category: 'DOMESTIC_STOCKS', keywords: ['코스피', '코스닥', '국내증시', '상장사', '유가증권시장'] },
  { category: 'OVERSEAS_STOCKS', keywords: ['나스닥', '다우존스', 's&p', '뉴욕증시', '월가', '뉴욕증권거래소', '빅테크'] },
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

let cache = null;

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

const fetchGnewsSearch = async (apiKey, fetchFn) => {
  const params = new URLSearchParams({
    q: COMBINED_QUERY,
    lang: 'ko',
    max: String(PROVIDER_MAX),
    sortby: 'publishedAt',
    apikey: apiKey,
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GNEWS_TIMEOUT_MS);
  try {
    const res = await fetchFn(`${GNEWS_BASE}?${params.toString()}`, { method: 'GET', signal: controller.signal });
    if (res.status === 401 || res.status === 403) return { ok: false, code: 'NEWS_UNAUTHORIZED' };
    if (res.status === 429) return { ok: false, code: 'NEWS_RATE_LIMITED' };
    if (!res.ok) return { ok: false, code: 'NEWS_PROVIDER_ERROR' };
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
 * @param {{ apiKey?: string, fetchFn?: typeof fetch, now?: () => number }} deps
 * @returns {Promise<{ ok: boolean, code: string, generatedAt: string, articles: object[] }>}
 */
export const getHomeNewsFeed = async (deps = {}) => {
  const now = deps.now ?? (() => Date.now());
  const fetchFn = deps.fetchFn ?? fetch;
  const apiKey = typeof deps.apiKey === 'string' ? deps.apiKey.trim() : '';

  if (!apiKey) {
    return { ok: false, code: 'NEWS_NOT_CONFIGURED', generatedAt: new Date(now()).toISOString(), articles: [] };
  }

  if (cache && now() - cache.storedAtMs < HOME_NEWS_TTL_MS) {
    return { ...cache.value };
  }

  const result = await fetchGnewsSearch(apiKey, fetchFn);
  if (!result.ok) {
    return { ok: false, code: result.code, generatedAt: new Date(now()).toISOString(), articles: [] };
  }

  // Phase 3GL-HF2 §9: sanitized, non-secret counts only -- never the raw provider payload, query, or
  // rejected article contents -- so a zero-result feed is distinguishable from a genuinely broken one.
  const providerArticleCount = result.articles.length;
  const normalized = result.articles.map(normalizeGnewsHomeArticle).filter(Boolean);
  const normalizedArticleCount = normalized.length;
  const articles = dedupeAndRankHomeArticles(normalized, MAX_ARTICLES);
  const returnedArticleCount = articles.length;
  const diagnostics = { providerArticleCount, normalizedArticleCount, returnedArticleCount };

  // Phase 3GL-HF2 §11: a successful provider call that yields no usable article is not an
  // indistinguishable "ok" live feed -- report it honestly so the client shows its unavailable state.
  if (returnedArticleCount === 0) {
    const value = {
      ok: false,
      code: 'NEWS_NO_RESULTS',
      generatedAt: new Date(now()).toISOString(),
      articles: [],
      diagnostics,
    };
    cache = { value, storedAtMs: now() };
    return { ...value };
  }

  const value = { ok: true, code: 'NONE', generatedAt: new Date(now()).toISOString(), articles, diagnostics };
  cache = { value, storedAtMs: now() };
  return { ...value };
};
