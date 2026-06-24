/**
 * News route source selector helpers and async orchestrator (Phase 3BG).
 * Evaluates live gate conditions and provides fixture fallback for all failure paths.
 * No env reads at module load time. All env access via injected env object.
 * Never exposes API key values in responses, metadata, or logs.
 */

import {
  fetchGnewsMarketNewsBatch,
  GNEWS_QUERY_DEFINITIONS,
} from './gnewsLiveFetchAdapter.mjs';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const VALID_NEWS_SOURCES = ['fixture', 'auto', 'live'];

const ALLOWED_FALLBACK_REASONS = new Set([
  'live_disabled',
  'production_blocked',
  'missing_base_url',
  'missing_api_key',
  'invalid_base_url',
  'provider_empty_result',
  'provider_rate_limited',
  'provider_http_error',
  'provider_timeout',
  'provider_invalid_payload',
  'provider_fetch_failed',
  'live_exception',
  'unknown_live_failure',
]);

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

export function parseNewsSourceParam(value) {
  if (value === null || value === undefined || value === '') return 'fixture';
  return String(value);
}

export function validateNewsSource(source) {
  if (!VALID_NEWS_SOURCES.includes(source)) {
    return { ok: false, code: 'invalid_source' };
  }
  return { ok: true };
}

export function sanitizeLiveFallbackReason(reason) {
  const str = typeof reason === 'string' ? reason : '';
  return ALLOWED_FALLBACK_REASONS.has(str) ? str : 'unknown_live_failure';
}

function validateEndpointOnlyBaseUrl(url) {
  if (!url || typeof url !== 'string') return { ok: false };
  try {
    const parsed = new URL(url);
    if (parsed.search && parsed.search.length > 1) return { ok: false };
    if (/[?&](apikey|key|token|q)=/i.test(url)) return { ok: false };
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export function resolveNewsLiveGate(env = {}) {
  if (env.GNEWS_LIVE_ENABLED !== 'true') {
    return { enabled: false, reason: 'live_disabled' };
  }
  if (env.VERCEL_ENV === 'production') {
    return { enabled: false, reason: 'production_blocked' };
  }
  const baseUrl = env.GNEWS_BASE_URL ?? '';
  if (!baseUrl) {
    return { enabled: false, reason: 'missing_base_url' };
  }
  if (!validateEndpointOnlyBaseUrl(baseUrl).ok) {
    return { enabled: false, reason: 'invalid_base_url' };
  }
  const apiKey = env.GNEWS_API_KEY ?? env.PUBLIC_GNEWS_API_KEY ?? '';
  if (!apiKey) {
    return { enabled: false, reason: 'missing_api_key' };
  }
  // apiKey is internal — never include in public response or log
  return { enabled: true, baseUrl, apiKey };
}

export function shouldAttemptLiveSource(source, gate) {
  if (source !== 'auto' && source !== 'live') return false;
  return gate?.enabled === true;
}

export function buildFixtureFallbackMetadata({
  requestedSource = 'fixture',
  liveAttempted = false,
  fallbackReason,
} = {}) {
  const meta = {
    requestedSource,
    source: 'fixture',
    liveEnabled: requestedSource === 'fixture' ? false : true,
    liveAttempted,
    fallbackUsed: requestedSource !== 'fixture',
  };
  if (fallbackReason !== undefined) {
    meta.fallbackReason = sanitizeLiveFallbackReason(String(fallbackReason));
  }
  return meta;
}

export function buildLiveSourceMetadata({ requestedSource = 'auto' } = {}) {
  return {
    requestedSource,
    source: 'gnews_live',
    liveEnabled: true,
    liveAttempted: true,
    fallbackUsed: false,
    provider: 'gnews',
  };
}

// ---------------------------------------------------------------------------
// Async orchestrator — gate evaluation, live fetch, fixture fallback
// ---------------------------------------------------------------------------

export async function resolveMarketNewsFeedSource({
  requestedSource = 'fixture',
  fetchFn,
  env = {},
  maxThemes = 2,
} = {}) {
  // Fixture path — no env reads, no live calls
  if (requestedSource === 'fixture') {
    return {
      useLiveArticles: false,
      liveArticles: null,
      meta: buildFixtureFallbackMetadata({ requestedSource: 'fixture' }),
    };
  }

  // auto / live path — evaluate live gate
  const gate = resolveNewsLiveGate(env);

  if (!gate.enabled) {
    return {
      useLiveArticles: false,
      liveArticles: null,
      meta: buildFixtureFallbackMetadata({
        requestedSource,
        liveAttempted: false,
        fallbackReason: gate.reason,
      }),
    };
  }

  // Attempt live fetch via injected fetchFn
  let liveResult = null;
  let liveErrorReason = null;

  try {
    liveResult = await fetchGnewsMarketNewsBatch(GNEWS_QUERY_DEFINITIONS, {
      fetchFn,
      baseUrl: gate.baseUrl,
      apiKey: gate.apiKey,
      maxThemes,
    });
  } catch {
    liveErrorReason = 'live_exception';
  }

  // Live success: at least one article
  if (!liveErrorReason && liveResult && liveResult.articleCount > 0 && Array.isArray(liveResult.articles)) {
    return {
      useLiveArticles: true,
      liveArticles: liveResult.articles,
      meta: buildLiveSourceMetadata({ requestedSource }),
    };
  }

  // Live failed or empty — fixture fallback with sanitized reason
  let fallbackReason = liveErrorReason;
  if (!fallbackReason) {
    if (liveResult && liveResult.articleCount === 0) {
      fallbackReason = 'provider_empty_result';
    } else if (liveResult?.error?.code) {
      fallbackReason = sanitizeLiveFallbackReason(liveResult.error.code);
    } else {
      fallbackReason = 'provider_fetch_failed';
    }
  }

  return {
    useLiveArticles: false,
    liveArticles: null,
    meta: buildFixtureFallbackMetadata({
      requestedSource,
      liveAttempted: true,
      fallbackReason,
    }),
  };
}
