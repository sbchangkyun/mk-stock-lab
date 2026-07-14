/**
 * Phase 3GG-OP-FAST universal instrument search route.
 *
 * GET /api/chart-ai/instruments/search.json?q=<query>&country=<KR|US>&assetType=<stock|etf>&limit=<n>
 *
 * Searches the curated static universal instrument master (real KR codes + US tickers). No provider
 * network call, no credentials, no env reads, no raw provider payloads -- purely deterministic
 * ranking over static reference metadata. Returns only client-safe instrument fields (never the
 * internal provider / providerSymbol routing details). Deterministic ordering, capped result count,
 * sanitized error contract.
 */

import type { APIRoute } from 'astro';
import {
  searchUniversalInstruments,
  getUniversalMasterAsOf,
  getUniversalMasterVersion,
  UNIVERSAL_SEARCH_MIN_QUERY_LENGTH,
} from '../../../../lib/server/chart-ai/universal-instrument-search.mjs';
import { LOCAL_ONLY_ALLOWED_HOSTNAMES } from '../../../../lib/server/chart-ai/local-only-live-kis-market-data-binding.mjs';
import { validateUserFromBearerToken } from '../../../../lib/server/supabaseAdmin';

export const prerender = false;

const resolveLocalHostname = (url: URL, request: Request): string | null => {
  const urlHost = url.hostname.toLowerCase();
  if (LOCAL_ONLY_ALLOWED_HOSTNAMES.includes(urlHost)) return urlHost;
  const headerHost = (request.headers.get('host') ?? '').split(':')[0]?.trim().toLowerCase();
  if (headerHost && LOCAL_ONLY_ALLOWED_HOSTNAMES.includes(headerHost)) return headerHost;
  return null;
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      // Phase 3GG-T-HF3B-HF2-HF2A2: this route is authenticated (Bearer) on deployed environments, so
      // its responses (401/403 AND 200) MUST NOT be shared in a public/CDN cache across auth contexts —
      // a cached 401 or another user's 200 would surface as wrong/zero results. Keep it private + uncached
      // and vary on Authorization. The static master stays in server memory; only the HTTP response is
      // kept per-caller.
      'Cache-Control': 'private, no-store',
      Vary: 'Authorization',
      // Non-secret deployed-master identity, so a caller can confirm which master version answered.
      'X-MK-Instrument-Master-Version': getUniversalMasterVersion() ?? 'unknown',
    },
  });

const SANITIZED_ERROR_CODES = {
  NONE: 'NONE',
  QUERY_REQUIRED: 'QUERY_REQUIRED',
  INTERNAL: 'INTERNAL',
} as const;

const toClientResult = (instrument: {
  symbol: string;
  displayName: string;
  englishName?: string;
  country: 'KR' | 'US';
  exchange: string;
  market: string;
  assetType: 'stock' | 'etf';
  currency: 'KRW' | 'USD';
}) => ({
  symbol: instrument.symbol,
  displayName: instrument.displayName,
  ...(instrument.englishName ? { englishName: instrument.englishName } : {}),
  country: instrument.country,
  exchange: instrument.exchange,
  market: instrument.market,
  assetType: instrument.assetType,
  currency: instrument.currency,
});

const emptyResponse = (query: string, sanitizedErrorCode: string) => ({
  ok: false,
  query,
  resultCount: 0,
  results: [],
  items: [],
  total: 0,
  returned: 0,
  hasMore: false,
  nextOffset: null,
  appliedFilters: { country: 'all', assetType: 'all' },
  sourceStatus: 'blocked',
  sanitizedErrorCode,
  cached: false,
  asOf: getUniversalMasterAsOf(),
  masterVersion: getUniversalMasterVersion(),
});

const clampReqLimit = (raw: string | null): number | undefined => {
  if (raw === null || raw.trim() === '') return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
};

export const GET: APIRoute = async ({ url, request }) => {
  // Phase 3GG-T-HF1: Chart AI search now requires an authenticated Supabase user on deployed
  // (Preview/Production) requests; localhost stays open for owner smokes/dev. Fails closed 401/403.
  if (!resolveLocalHostname(url, request)) {
    const auth = await validateUserFromBearerToken(request.headers.get('authorization'));
    if (!auth.ok) {
      return jsonResponse({ ...emptyResponse('', 'AUTH_REQUIRED'), code: auth.code, message: auth.message }, auth.status);
    }
  }

  const rawQuery = (url.searchParams.get('q') ?? '').trim();
  const countryParam = url.searchParams.get('country') ?? undefined;
  const assetTypeParam = url.searchParams.get('assetType') ?? undefined;
  const country = countryParam === 'KR' || countryParam === 'US' ? countryParam : undefined;
  const assetType = assetTypeParam === 'stock' || assetTypeParam === 'etf' ? assetTypeParam : undefined;
  const limit = clampReqLimit(url.searchParams.get('limit'));
  const offset = clampReqLimit(url.searchParams.get('offset'));

  if (rawQuery.length < UNIVERSAL_SEARCH_MIN_QUERY_LENGTH) {
    return jsonResponse(emptyResponse(rawQuery, SANITIZED_ERROR_CODES.QUERY_REQUIRED));
  }

  try {
    const { results, resultCount, total, returned, hasMore, nextOffset, query } = searchUniversalInstruments({
      query: rawQuery,
      country,
      assetType,
      limit,
      offset,
    });
    const clientItems = results.map(toClientResult);
    return jsonResponse({
      ok: true,
      query,
      // `results`/`resultCount` are kept for backward compatibility; `items`/`total`/`hasMore`/
      // `nextOffset` are the HF3B pagination contract. Both describe the same bounded page.
      resultCount,
      results: clientItems,
      items: clientItems,
      total,
      returned,
      hasMore,
      nextOffset,
      appliedFilters: { country: country ?? 'all', assetType: assetType ?? 'all' },
      sourceStatus: 'ok',
      sanitizedErrorCode: SANITIZED_ERROR_CODES.NONE,
      cached: false,
      asOf: getUniversalMasterAsOf(),
      masterVersion: getUniversalMasterVersion(),
    });
  } catch {
    return jsonResponse(emptyResponse(rawQuery, SANITIZED_ERROR_CODES.INTERNAL), 200);
  }
};

export const ALL: APIRoute = () => jsonResponse(emptyResponse('', SANITIZED_ERROR_CODES.INTERNAL), 405);
