/**
 * Phase 3GG-OP-FAST real OHLCV route (KR domestic + US overseas, provider-neutral).
 *
 * GET /api/chart-ai/market/ohlcv.json?country=<KR|US>&symbol=<code|ticker>&range=<1m|3m|6m|1y>
 *
 * Returns real, delayed OHLCV candles for a selected instrument. Guarded exactly like the KIS+LLM
 * summary route: a localhost owner opt-in (?ownerLocalOhlcv=1), the protected Vercel Preview beta,
 * or the production Chart AI beta. Only the production-beta path forwards the scoped live-quote
 * exception to kisClient. No sample/synthetic OHLCV fallback: an unavailable/no-data result is
 * returned honestly with a sanitized error code. Numeric OHLCV is intentional on this dedicated
 * chart-data path and is kept separate from the non-numeric LLM summary contract.
 */

import type { APIRoute } from 'astro';
import {
  evaluateProtectedPreviewBetaAccess,
  evaluateProductionChartAiBetaAccess,
} from '../../../../lib/server/chart-ai/protected-preview-beta-guard.mjs';
import { LOCAL_ONLY_ALLOWED_HOSTNAMES } from '../../../../lib/server/chart-ai/local-only-live-kis-market-data-binding.mjs';
import { findUniversalInstrument } from '../../../../lib/server/chart-ai/universal-instrument-search.mjs';
import {
  fetchUniversalOhlcv,
  OHLCV_SANITIZED_ERROR_CODES,
} from '../../../../lib/server/chart-ai/universalOhlcvProvider';
import { normalizeOhlcvRange } from '../../../../lib/server/chart-ai/universal-ohlcv-normalize.mjs';

export const prerender = false;

type ImportMetaWithEnv = ImportMeta & { env?: Record<string, string | undefined> };
const getImportMetaEnv = (): Record<string, string | undefined> =>
  (import.meta as ImportMetaWithEnv).env ?? {};
const readServerEnvValue = (name: string): string | undefined => {
  const fromImportMeta = getImportMetaEnv()[name];
  if (typeof fromImportMeta === 'string' && fromImportMeta.trim().length > 0) return fromImportMeta;
  return process.env[name];
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

const resolveLocalHostname = (url: URL, request: Request): string | null => {
  const urlHost = url.hostname.toLowerCase();
  if (LOCAL_ONLY_ALLOWED_HOSTNAMES.includes(urlHost)) return urlHost;
  const headerHost = (request.headers.get('host') ?? '').split(':')[0]?.trim().toLowerCase();
  if (headerHost && LOCAL_ONLY_ALLOWED_HOSTNAMES.includes(headerHost)) return headerHost;
  return null;
};

const blockedResponse = (range: string, sanitizedErrorCode: string) => ({
  ok: false,
  instrument: null,
  range,
  interval: '1d',
  candles: [],
  candleCount: 0,
  sourceStatus: 'blocked',
  sanitizedErrorCode,
  cached: false,
  asOf: null,
  isDelayed: true,
});

export const GET: APIRoute = async ({ url, request }) => {
  const range = normalizeOhlcvRange(url.searchParams.get('range') ?? undefined);

  // Guard: localhost owner opt-in OR protected preview beta OR production beta.
  const ownerLocalOptIn = url.searchParams.get('ownerLocalOhlcv') === '1';
  const resolvedHostname = resolveLocalHostname(url, request);
  const localOwnerAllowed = ownerLocalOptIn && Boolean(resolvedHostname);

  const betaAccess = evaluateProtectedPreviewBetaAccess({
    betaQueryOptIn: url.searchParams.get('chartAiBetaPreview') === '1',
    env: {
      VERCEL_ENV: readServerEnvValue('VERCEL_ENV'),
      NODE_ENV: readServerEnvValue('NODE_ENV'),
      CHART_AI_ENABLE_PROTECTED_PREVIEW_BETA: readServerEnvValue('CHART_AI_ENABLE_PROTECTED_PREVIEW_BETA'),
    },
  });

  const prodBetaAccess = evaluateProductionChartAiBetaAccess({
    betaQueryOptIn: url.searchParams.get('chartAiProdBeta') === '1',
    env: {
      VERCEL_ENV: readServerEnvValue('VERCEL_ENV'),
      CHART_AI_ENABLE_PRODUCTION_CHART_AI_BETA: readServerEnvValue('CHART_AI_ENABLE_PRODUCTION_CHART_AI_BETA'),
    },
  });

  if (!localOwnerAllowed && !betaAccess.allowed && !prodBetaAccess.allowed) {
    return jsonResponse({ ok: true, ohlcv: blockedResponse(range, 'NON_LOCAL_REQUEST') });
  }

  const countryParam = (url.searchParams.get('country') ?? '').trim().toUpperCase();
  const symbolParam = (url.searchParams.get('symbol') ?? '').trim();
  const country = countryParam === 'KR' || countryParam === 'US' ? countryParam : undefined;

  const instrument = findUniversalInstrument(symbolParam, country);
  if (!instrument) {
    return jsonResponse({
      ok: true,
      ohlcv: blockedResponse(range, OHLCV_SANITIZED_ERROR_CODES.INVALID_INSTRUMENT),
    });
  }

  const ohlcv = await fetchUniversalOhlcv({
    instrument,
    range,
    allowProductionChartAiBetaLiveQuotes: prodBetaAccess.allowed === true,
  });

  return jsonResponse({ ok: true, ohlcv });
};

export const ALL: APIRoute = () => jsonResponse({ ok: false, ohlcv: blockedResponse('3m', 'NON_LOCAL_REQUEST') }, 405);
