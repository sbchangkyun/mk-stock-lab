/**
 * Phase 3GG-Q-FAST real Similar-Pattern route (KR + US, deterministic, real OHLCV only).
 *
 * GET /api/chart-ai/similarity.json?country=&symbol=&window=&topK=
 *
 * Guarded exactly like the OHLCV/summary routes (localhost owner opt-in `?ownerLocalSimilarity=1`,
 * protected Preview beta, or production Chart AI beta; only the production-beta path forwards the
 * scoped live-quote exception). Fetches multi-year REAL OHLCV via the provider-neutral long-history
 * pager, runs the deterministic similarity engine, and returns sanitized Top-K matches + aggregate
 * historical outcomes. No sample/synthetic fallback, no fabricated dates/scores/returns, no LLM, no
 * credentials/raw-payload exposure. Numeric similarity + historical performance values are allowed
 * on this dedicated analytical route.
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

export const prerender = false;

const SIMILARITY_DISCLAIMER =
  '과거 유사 구간의 이후 움직임을 참고용으로 비교합니다. 미래 성과를 예측하거나 보장하지 않습니다.';

const FORWARD_HORIZONS = [5, 20, 60];
const DEFAULT_WINDOW = 20;
const ALLOWED_WINDOWS = [20, 30, 60];
const DEFAULT_TOPK = 5;

const SANITIZED_ERROR_CODES = {
  NONE: 'NONE',
  NON_LOCAL_REQUEST: 'NON_LOCAL_REQUEST',
  INVALID_REQUEST: 'INVALID_REQUEST',
  UNSUPPORTED_INSTRUMENT: 'UNSUPPORTED_INSTRUMENT',
  PROVIDER_UNAVAILABLE: 'PROVIDER_UNAVAILABLE',
  INSUFFICIENT_HISTORY: 'INSUFFICIENT_HISTORY',
  NO_VALID_CANDIDATES: 'NO_VALID_CANDIDATES',
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
  analysisWindow: null,
  historyRange: null,
  windowLength: DEFAULT_WINDOW,
  topK: DEFAULT_TOPK,
  matches: [],
  aggregate: null,
  currentNormalizedPath: [],
  candidateCount: 0,
  sourceStatus,
  sanitizedErrorCode,
  cached: false,
  asOf: new Date().toISOString(),
  methodVersion: null,
  disclaimer: SIMILARITY_DISCLAIMER,
  summary: null,
});

// Light result cache (the expensive long-history fetch is already cached in the provider).
type CacheEntry = { body: any; storedAtMs: number };
const resultCache = new Map<string, CacheEntry>();
const RESULT_TTL_MS = 10 * 60 * 1000;

export const GET: APIRoute = async ({ url, request }) => {
  const ownerLocalOptIn = url.searchParams.get('ownerLocalSimilarity') === '1';
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
    return jsonResponse({ ok: true, similarity: blocked(SANITIZED_ERROR_CODES.NON_LOCAL_REQUEST) });
  }

  const countryParam = (url.searchParams.get('country') ?? '').trim().toUpperCase();
  const symbolParam = (url.searchParams.get('symbol') ?? '').trim();
  const country = countryParam === 'KR' || countryParam === 'US' ? countryParam : undefined;

  const rawWindow = Number(url.searchParams.get('window'));
  const windowLength = ALLOWED_WINDOWS.includes(rawWindow) ? rawWindow : DEFAULT_WINDOW;
  const rawTopK = Number(url.searchParams.get('topK'));
  const topK = Number.isInteger(rawTopK) && rawTopK >= 1 && rawTopK <= 10 ? rawTopK : DEFAULT_TOPK;

  const instrument = findUniversalInstrument(symbolParam, country);
  if (!instrument) {
    return jsonResponse({ ok: true, similarity: blocked(SANITIZED_ERROR_CODES.UNSUPPORTED_INSTRUMENT) });
  }

  const allowProd = prodBetaAccess.allowed === true;
  const cacheKey = `${instrument.country}:${instrument.symbol}:${windowLength}:${topK}`;
  const cached = resultCache.get(cacheKey);
  if (cached && Date.now() - cached.storedAtMs < RESULT_TTL_MS) {
    return jsonResponse({ ok: true, similarity: { ...cached.body, cached: true } }, 200, { 'X-MK-OHLCV-Cache': 'RESULT_HIT' });
  }

  try {
    const history = await fetchLongHistoryOhlcv({
      instrument,
      allowProductionChartAiBetaLiveQuotes: allowProd,
    });
    const ohlcvCacheState = typeof history.cacheState === 'string' ? history.cacheState : 'MISS';

    if (!history.ok || history.candles.length === 0) {
      const code =
        history.sourceStatus === 'no-data'
          ? SANITIZED_ERROR_CODES.INSUFFICIENT_HISTORY
          : SANITIZED_ERROR_CODES.PROVIDER_UNAVAILABLE;
      return jsonResponse({ ok: true, similarity: blocked(code, history.sourceStatus) });
    }

    // Convert normalized candles -> engine bars (real, adjusted, KIS-normalized).
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

    const result = runRealSimilarity(bars, {
      baseWindow: windowLength,
      forwardWindows: FORWARD_HORIZONS,
      topK,
      minGapBars: Math.max(5, Math.floor(windowLength / 2)),
    });

    if (result.insufficientHistory) {
      const code = result.candidateCount === 0 && result.historyBarCount >= windowLength * 2
        ? SANITIZED_ERROR_CODES.NO_VALID_CANDIDATES
        : SANITIZED_ERROR_CODES.INSUFFICIENT_HISTORY;
      return jsonResponse({ ok: true, similarity: blocked(code, 'no-data') });
    }

    const completeness = (m: any) => ({
      d5: m.forwardOutcome.forwardReturns.d5 !== null && m.forwardOutcome.forwardReturns.d5 !== undefined,
      d20: m.forwardOutcome.forwardReturns.d20 !== null && m.forwardOutcome.forwardReturns.d20 !== undefined,
      d60: m.forwardOutcome.forwardReturns.d60 !== null && m.forwardOutcome.forwardReturns.d60 !== undefined,
    });

    const matches = result.matches.map((m: any) => ({
      rank: m.rank,
      // Phase 3GG-T-HF3B-HF2-HF2B: sanitized relative-position metadata (raw sorted rank + derived
      // top-percentile over all scanned candidate windows). Additive only — no scoring/order change,
      // and the full candidate array is never exposed (only these scalars + candidateCount below).
      candidateRank: typeof m.candidateRank === 'number' ? m.candidateRank : null,
      candidateTopPercentile: typeof m.candidateTopPercentile === 'number' ? m.candidateTopPercentile : null,
      startDate: m.startDate.slice(0, 10),
      endDate: m.endDate.slice(0, 10),
      similarityScore: m.similarityScore,
      scoreParts: {
        correlation: m.scoreParts.correlation,
        rmse: m.scoreParts.rmse,
        directionMatchPct: m.scoreParts.directionMatchPct,
      },
      forwardReturns: m.forwardOutcome.forwardReturns,
      maxDrawdownPct: m.forwardOutcome.maxDrawdownPct,
      maxUpsidePct: m.forwardOutcome.maxUpsidePct,
      normalizedPath: m.normalizedPath.map((p: any) => p.value),
      dataComplete: completeness(m),
    }));

    const scores = matches.map((m) => m.similarityScore);
    const summary = {
      instrument: { symbol: instrument.symbol, displayName: instrument.displayName, country: instrument.country, assetType: instrument.assetType, currency: instrument.currency },
      methodVersion: result.methodVersion,
      matchCount: matches.length,
      scoreRange: scores.length ? { min: Math.min(...scores), max: Math.max(...scores) } : null,
      aggregateForwardReturns: result.aggregate.averageForwardReturnByWindow,
      medianForwardReturns: result.aggregate.medianForwardReturnByWindow,
      positiveCountByWindow: result.aggregate.positiveCountByWindow,
      averageMaxDrawdownPct: result.aggregate.averageMaxDrawdownPct,
      dataSufficiency: { historyBars: result.historyBarCount, candidateWindows: result.candidateCount },
      disclaimer: SIMILARITY_DISCLAIMER,
    };

    const body = {
      ok: true,
      instrument: history.instrument,
      analysisWindow: {
        startDate: result.currentWindow.startDate.slice(0, 10),
        endDate: result.currentWindow.endDate.slice(0, 10),
        barCount: result.currentWindow.barCount,
      },
      historyRange: history.historyRange
        ? { start: history.historyRange.start.slice(0, 10), end: history.historyRange.end.slice(0, 10) }
        : null,
      windowLength,
      topK,
      matches,
      aggregate: {
        averageForwardReturnByWindow: result.aggregate.averageForwardReturnByWindow,
        medianForwardReturnByWindow: result.aggregate.medianForwardReturnByWindow,
        positiveCountByWindow: result.aggregate.positiveCountByWindow,
        negativeCountByWindow: result.aggregate.negativeCountByWindow,
        averageMaxDrawdownPct: result.aggregate.averageMaxDrawdownPct,
        averageMaxUpsidePct: result.aggregate.averageMaxUpsidePct,
        matchCount: result.aggregate.matchCount,
      },
      currentNormalizedPath: result.currentNormalizedPath.map((p: any) => p.value),
      candidateCount: result.candidateCount,
      historyBarCount: result.historyBarCount,
      sourceStatus: 'ok',
      sanitizedErrorCode: SANITIZED_ERROR_CODES.NONE,
      cached: false,
      asOf: history.asOf,
      methodVersion: result.methodVersion,
      disclaimer: SIMILARITY_DISCLAIMER,
      summary,
    };

    resultCache.set(cacheKey, { body, storedAtMs: Date.now() });
    return jsonResponse({ ok: true, similarity: body }, 200, { 'X-MK-OHLCV-Cache': ohlcvCacheState });
  } catch {
    return jsonResponse({ ok: true, similarity: blocked(SANITIZED_ERROR_CODES.INTERNAL, 'error') });
  }
};

export const ALL: APIRoute = () => jsonResponse({ ok: false, similarity: blocked(SANITIZED_ERROR_CODES.NON_LOCAL_REQUEST) }, 405);
