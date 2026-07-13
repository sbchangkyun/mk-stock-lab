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
      // Search is static reference data; a short shared cache is safe and reduces load.
      'Cache-Control': 'public, max-age=300',
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
  sourceStatus: 'blocked',
  sanitizedErrorCode,
  cached: false,
  asOf: getUniversalMasterAsOf(),
});

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
  const country = url.searchParams.get('country') ?? undefined;
  const assetType = url.searchParams.get('assetType') ?? undefined;
  const limitParam = url.searchParams.get('limit');
  const limit = limitParam !== null && limitParam.trim() !== '' ? Number(limitParam) : undefined;

  if (rawQuery.length < UNIVERSAL_SEARCH_MIN_QUERY_LENGTH) {
    return jsonResponse(emptyResponse(rawQuery, SANITIZED_ERROR_CODES.QUERY_REQUIRED));
  }

  try {
    const { results, resultCount, query } = searchUniversalInstruments({
      query: rawQuery,
      country,
      assetType,
      limit,
    });
    return jsonResponse({
      ok: true,
      query,
      resultCount,
      results: results.map(toClientResult),
      sourceStatus: 'ok',
      sanitizedErrorCode: SANITIZED_ERROR_CODES.NONE,
      cached: false,
      asOf: getUniversalMasterAsOf(),
    });
  } catch {
    return jsonResponse(emptyResponse(rawQuery, SANITIZED_ERROR_CODES.INTERNAL), 200);
  }
};

export const ALL: APIRoute = () => jsonResponse(emptyResponse('', SANITIZED_ERROR_CODES.INTERNAL), 405);
