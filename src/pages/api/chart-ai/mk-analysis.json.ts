/**
 * Phase 3GG-R-FAST real MK AI analysis route (deterministic, real data only).
 *
 * GET /api/chart-ai/mk-analysis.json?country=&symbol=
 *
 * Guarded exactly like the OHLCV / similarity / summary routes (localhost `?ownerLocalMkAnalysis=1`,
 * protected Preview beta, or production `?chartAiProdBeta=1`; only the production-beta path forwards
 * the scoped live-quote exception). Fetches REAL long-history OHLCV, runs the REAL similarity engine,
 * and runs the DETERMINISTIC MK AI analysis engine + formatter over both. No LLM is called here (the
 * existing 3-line LLM summary route is untouched and kept separately). No sample/synthetic fallback,
 * no fabricated values, no prompt/model/credential/raw-payload exposure. Numeric analytical values
 * are allowed on this dedicated route.
 */

import type { APIRoute } from 'astro';
import {
  evaluateProtectedPreviewBetaAccess,
  evaluateProductionChartAiBetaAccess,
} from '../../../lib/server/chart-ai/protected-preview-beta-guard.mjs';
import { LOCAL_ONLY_ALLOWED_HOSTNAMES } from '../../../lib/server/chart-ai/local-only-live-kis-market-data-binding.mjs';
import { validateUserFromBearerToken } from '../../../lib/server/supabaseAdmin';
import { findUniversalInstrument } from '../../../lib/server/chart-ai/universal-instrument-search.mjs';
import { fetchLongHistoryOhlcv } from '../../../lib/server/chart-ai/universalOhlcvProvider';
import { runRealSimilarity } from '../../../lib/server/chart-ai/similarity-engine.mjs';
import { runMkAiAnalysis } from '../../../lib/server/chart-ai/mkAiAnalysis/analysisEngine.mjs';
import { formatMkAiAnalysis } from '../../../lib/server/chart-ai/mkAiAnalysis/analysisFormatter.mjs';

export const prerender = false;

const SANITIZED_ERROR_CODES = {
  NONE: 'NONE',
  NON_LOCAL_REQUEST: 'NON_LOCAL_REQUEST',
  UNSUPPORTED_INSTRUMENT: 'UNSUPPORTED_INSTRUMENT',
  PROVIDER_UNAVAILABLE: 'PROVIDER_UNAVAILABLE',
  INSUFFICIENT_HISTORY: 'INSUFFICIENT_HISTORY',
  INTERNAL: 'INTERNAL',
} as const;

type ImportMetaWithEnv = ImportMeta & { env?: Record<string, string | undefined> };
const getImportMetaEnv = (): Record<string, string | undefined> => (import.meta as ImportMetaWithEnv).env ?? {};
const readServerEnvValue = (name: string): string | undefined => {
  const fromImportMeta = getImportMetaEnv()[name];
  if (typeof fromImportMeta === 'string' && fromImportMeta.trim().length > 0) return fromImportMeta;
  return process.env[name];
};

const jsonResponse = (body: unknown, status = 200, extraHeaders: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extraHeaders },
  });

const resolveLocalHostname = (url: URL, request: Request): string | null => {
  const urlHost = url.hostname.toLowerCase();
  if (LOCAL_ONLY_ALLOWED_HOSTNAMES.includes(urlHost)) return urlHost;
  const headerHost = (request.headers.get('host') ?? '').split(':')[0]?.trim().toLowerCase();
  if (headerHost && LOCAL_ONLY_ALLOWED_HOSTNAMES.includes(headerHost)) return headerHost;
  return null;
};

const blocked = (sanitizedErrorCode: string, sourceStatus = 'blocked') => ({
  ok: false,
  instrument: null,
  dataStatus: null,
  dimensions: null,
  scores: null,
  dataCompletenessConfidence: null,
  formatted: null,
  sourceStatus,
  sanitizedErrorCode,
  cached: false,
  asOf: new Date().toISOString(),
  methodVersion: null,
});

type CacheEntry = { body: any; storedAtMs: number };
const resultCache = new Map<string, CacheEntry>();
const RESULT_TTL_MS = 10 * 60 * 1000;

export const GET: APIRoute = async ({ url, request }) => {
  const ownerLocalOptIn = url.searchParams.get('ownerLocalMkAnalysis') === '1';
  const resolvedHostname = resolveLocalHostname(url, request);
  const localOwnerAllowed = ownerLocalOptIn && Boolean(resolvedHostname);

  // Phase 3GG-T-HF1: authenticated Supabase user required on deployed requests (localhost-owner
  // stays token-free). Fails closed 401/403 before any provider work; reuses the Portfolio validator.
  if (!localOwnerAllowed) {
    const auth = await validateUserFromBearerToken(request.headers.get('authorization'));
    if (!auth.ok) {
      return jsonResponse({ ok: false, code: auth.code, message: auth.message }, auth.status);
    }
  }

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
    return jsonResponse({ ok: true, mkai: blocked(SANITIZED_ERROR_CODES.NON_LOCAL_REQUEST) });
  }

  const countryParam = (url.searchParams.get('country') ?? '').trim().toUpperCase();
  const symbolParam = (url.searchParams.get('symbol') ?? '').trim();
  const country = countryParam === 'KR' || countryParam === 'US' ? countryParam : undefined;

  const instrument = findUniversalInstrument(symbolParam, country);
  if (!instrument) {
    return jsonResponse({ ok: true, mkai: blocked(SANITIZED_ERROR_CODES.UNSUPPORTED_INSTRUMENT) });
  }

  const allowProd = prodBetaAccess.allowed === true;
  const cacheKey = `${instrument.country}:${instrument.symbol}`;
  const cached = resultCache.get(cacheKey);
  if (cached && Date.now() - cached.storedAtMs < RESULT_TTL_MS) {
    return jsonResponse({ ok: true, mkai: { ...cached.body, cached: true } }, 200, { 'X-MK-OHLCV-Cache': 'RESULT_HIT' });
  }

  try {
    const history = await fetchLongHistoryOhlcv({ instrument, allowProductionChartAiBetaLiveQuotes: allowProd });
    const ohlcvCacheState = typeof history.cacheState === 'string' ? history.cacheState : 'MISS';
    if (!history.ok || history.candles.length === 0) {
      const code =
        history.sourceStatus === 'no-data'
          ? SANITIZED_ERROR_CODES.INSUFFICIENT_HISTORY
          : SANITIZED_ERROR_CODES.PROVIDER_UNAVAILABLE;
      return jsonResponse({ ok: true, mkai: blocked(code, history.sourceStatus) });
    }

    const bars = history.candles.map((c) => ({
      market: instrument.country,
      symbol: instrument.symbol,
      date: c.timestamp,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: typeof c.volume === 'number' ? c.volume : null,
      adjusted: true,
      source: 'kis-normalized',
    }));

    const similarity = runRealSimilarity(bars, { baseWindow: 20, forwardWindows: [5, 20, 60], topK: 5, minGapBars: 10 });
    const analysis = runMkAiAnalysis({ instrument, candles: history.candles, similarity });

    if (!analysis.ok) {
      return jsonResponse({ ok: true, mkai: blocked(SANITIZED_ERROR_CODES.INSUFFICIENT_HISTORY, 'no-data') });
    }

    const formatted = formatMkAiAnalysis(analysis);

    const body = {
      ok: true,
      instrument: analysis.instrument,
      dataStatus: analysis.dataStatus,
      dimensions: analysis.dimensions,
      scores: analysis.scores,
      dataCompletenessConfidence: analysis.dataCompletenessConfidence,
      formatted,
      sourceStatus: 'ok',
      sanitizedErrorCode: SANITIZED_ERROR_CODES.NONE,
      cached: false,
      asOf: history.asOf,
      methodVersion: analysis.methodVersion,
    };

    resultCache.set(cacheKey, { body, storedAtMs: Date.now() });
    return jsonResponse({ ok: true, mkai: body }, 200, { 'X-MK-OHLCV-Cache': ohlcvCacheState });
  } catch {
    return jsonResponse({ ok: true, mkai: blocked(SANITIZED_ERROR_CODES.INTERNAL, 'error') });
  }
};

export const ALL: APIRoute = () => jsonResponse({ ok: false, mkai: blocked(SANITIZED_ERROR_CODES.NON_LOCAL_REQUEST) }, 405);
