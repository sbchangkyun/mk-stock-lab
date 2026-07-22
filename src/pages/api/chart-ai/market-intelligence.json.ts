/**
 * Phase 3GG-T-FAST real Market & Cross-Asset Intelligence route (deterministic, real data only).
 *
 * GET /api/chart-ai/market-intelligence.json?country=&symbol=
 *
 * Guarded exactly like the OHLCV/similarity/MK-AI routes (localhost `?ownerLocalMarketIntel=1`,
 * protected Preview beta, or production `?chartAiProdBeta=1`; only the production-beta path forwards
 * the scoped live-quote exception). Resolves a real representative benchmark + (optional verified)
 * sector, fetches REAL long-history OHLCV for the selected / benchmark / sector / gold / oil ETFs (via
 * the existing provider) and USD/KRW from the free ECB Frankfurter API, then runs the DETERMINISTIC
 * market-intelligence engine + formatter. Partial success is first-class (one failed source does not
 * fail the whole response). No LLM. No sample/synthetic/hardcoded market values or FX. No credentials/
 * raw-payload exposure. No trading/account endpoint.
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
import { resolveBenchmark } from '../../../lib/server/chart-ai/marketIntelligence/benchmarkResolver.mjs';
import { resolveSector } from '../../../lib/server/chart-ai/marketIntelligence/sectorResolver.mjs';
import { CROSS_ASSETS } from '../../../lib/server/chart-ai/marketIntelligence/marketContextTypes.mjs';
import { fetchUsdKrwContext } from '../../../lib/server/chart-ai/marketIntelligence/crossAssetProvider.mjs';
import { runMarketIntelligence } from '../../../lib/server/chart-ai/marketIntelligence/marketIntelligenceEngine.mjs';
import { formatMarketIntelligence } from '../../../lib/server/chart-ai/marketIntelligence/marketIntelligenceFormatter.mjs';

export const prerender = false;

const SANITIZED = { NONE: 'NONE', NON_LOCAL_REQUEST: 'NON_LOCAL_REQUEST', UNSUPPORTED_INSTRUMENT: 'UNSUPPORTED_INSTRUMENT', PROVIDER_UNAVAILABLE: 'PROVIDER_UNAVAILABLE', INSUFFICIENT_DATA: 'INSUFFICIENT_DATA', INTERNAL: 'INTERNAL' };

type ImportMetaWithEnv = ImportMeta & { env?: Record<string, string | undefined> };
const readServerEnvValue = (name: string): string | undefined => {
  const fromMeta = ((import.meta as ImportMetaWithEnv).env ?? {})[name];
  if (typeof fromMeta === 'string' && fromMeta.trim().length > 0) return fromMeta;
  return process.env[name];
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });

const resolveLocalHostname = (url: URL, request: Request): string | null => {
  const urlHost = url.hostname.toLowerCase();
  if (LOCAL_ONLY_ALLOWED_HOSTNAMES.includes(urlHost)) return urlHost;
  const headerHost = (request.headers.get('host') ?? '').split(':')[0]?.trim().toLowerCase();
  if (headerHost && LOCAL_ONLY_ALLOWED_HOSTNAMES.includes(headerHost)) return headerHost;
  return null;
};

const blocked = (code: string, sourceStatus = 'blocked') => ({
  ok: false, instrument: null, benchmark: null, sector: null, relativeStrength: null, equityContext: null,
  currencyContext: null, rateContext: null, volatilityContext: null, commodityContext: null, marketRegime: null,
  dataCompleteness: null, sourceStatus, sanitizedErrorCode: code, asOf: null, methodVersion: null, formatted: null,
});

type CacheEntry = { body: any; storedAtMs: number };
const resultCache = new Map<string, CacheEntry>();
const RESULT_TTL_MS = 10 * 60 * 1000;

const toSeries = (result: any) =>
  result && result.ok && Array.isArray(result.candles)
    ? result.candles.map((c: any) => ({ date: c.timestamp, close: c.close }))
    : null;

export const GET: APIRoute = async ({ url, request }) => {
  const ownerLocal = url.searchParams.get('ownerLocalMarketIntel') === '1' && Boolean(resolveLocalHostname(url, request));

  // Phase 3GG-T-HF1: authenticated Supabase user required on deployed requests (localhost-owner
  // stays token-free). Fails closed 401/403 before any provider work; reuses the Portfolio validator.
  if (!ownerLocal) {
    const auth = await validateUserFromBearerToken(request.headers.get('authorization'));
    if (!auth.ok) {
      return jsonResponse({ ok: false, code: auth.code, message: auth.message }, auth.status);
    }
  }

  const betaAccess = evaluateProtectedPreviewBetaAccess({
    betaQueryOptIn: url.searchParams.get('chartAiBetaPreview') === '1',
    env: { VERCEL_ENV: readServerEnvValue('VERCEL_ENV'), NODE_ENV: readServerEnvValue('NODE_ENV'), CHART_AI_ENABLE_PROTECTED_PREVIEW_BETA: readServerEnvValue('CHART_AI_ENABLE_PROTECTED_PREVIEW_BETA') },
  });
  const prodBetaAccess = evaluateProductionChartAiBetaAccess({
    betaQueryOptIn: url.searchParams.get('chartAiProdBeta') === '1',
    env: { VERCEL_ENV: readServerEnvValue('VERCEL_ENV'), CHART_AI_ENABLE_PRODUCTION_CHART_AI_BETA: readServerEnvValue('CHART_AI_ENABLE_PRODUCTION_CHART_AI_BETA') },
  });
  if (!ownerLocal && !betaAccess.allowed && !prodBetaAccess.allowed) {
    return jsonResponse({ ok: true, marketIntel: blocked(SANITIZED.NON_LOCAL_REQUEST) });
  }

  const countryParam = (url.searchParams.get('country') ?? '').trim().toUpperCase();
  const symbolParam = (url.searchParams.get('symbol') ?? '').trim();
  const country = countryParam === 'KR' || countryParam === 'US' ? countryParam : undefined;
  const instrument = findUniversalInstrument(symbolParam, country);
  if (!instrument) return jsonResponse({ ok: true, marketIntel: blocked(SANITIZED.UNSUPPORTED_INSTRUMENT) });

  const allowProd = prodBetaAccess.allowed === true;
  const { benchmark, mappingReason, mappingConfidence, selfBenchmark } = resolveBenchmark(instrument);
  const sector = resolveSector(instrument);

  const cacheKey = `${instrument.country}:${instrument.symbol}:${benchmark ? benchmark.symbol : 'none'}`;
  const cached = resultCache.get(cacheKey);
  if (cached && Date.now() - cached.storedAtMs < RESULT_TTL_MS) {
    return jsonResponse({ ok: true, marketIntel: { ...cached.body, cached: true } });
  }

  try {
    // ~10-12 months is enough for 6m relative strength + trend; fetching fewer bars keeps the number of
    // paginated KIS calls per instrument small. The benchmark/sector/commodity series are shared and
    // cached (6h), so after warm-up only the selected instrument is fetched fresh.
    const TARGET_BARS = 220;
    const fetchOhlcv = (inst: any) =>
      fetchLongHistoryOhlcv({ instrument: inst, allowProductionChartAiBetaLiveQuotes: allowProd, targetBars: TARGET_BARS }).catch(() => null);

    // Serialize the KIS OHLCV fetches (concurrency 1) so parallel paginated requests do not trip KIS
    // rate limits; run the independent FX fetch (different host) concurrently.
    const fxPromise = fetchUsdKrwContext().catch(() => null);
    const selectedRes = await fetchOhlcv(instrument);
    const benchmarkRes = benchmark ? await fetchOhlcv(benchmark) : null;
    const sectorRes = sector.available && sector.sectorProxy ? await fetchOhlcv(sector.sectorProxy) : null;
    const goldRes = await fetchOhlcv(CROSS_ASSETS.gold);
    const oilRes = await fetchOhlcv(CROSS_ASSETS.oil);
    const fx = await fxPromise;

    const selectedSeries = toSeries(selectedRes);
    const benchmarkSeries = toSeries(benchmarkRes);
    const sectorSeries = toSeries(sectorRes);
    const goldSeries = toSeries(goldRes);
    const oilSeries = toSeries(oilRes);

    if (!selectedSeries || selectedSeries.length < 60) {
      return jsonResponse({ ok: true, marketIntel: blocked(SANITIZED.PROVIDER_UNAVAILABLE, 'no-data') });
    }
    const asOf = selectedSeries[selectedSeries.length - 1]?.date ?? null;

    const context = runMarketIntelligence({
      instrument, benchmark, benchmarkMapping: { reason: mappingReason, confidence: mappingConfidence, selfBenchmark },
      sector, selectedSeries, benchmarkSeries, sectorSeries, goldSeries, oilSeries, fx, asOf,
    });
    const formatted = formatMarketIntelligence(context);

    const body = {
      ok: context.ok,
      instrument: context.instrument,
      benchmark: context.benchmark,
      benchmarkMapping: context.benchmarkMapping,
      sector: context.sector,
      relativeStrength: context.relativeStrength,
      equityContext: context.equityContext,
      currencyContext: context.currencyContext,
      rateContext: context.rateContext,
      volatilityContext: context.volatilityContext,
      commodityContext: context.commodityContext,
      marketRegime: context.marketRegime,
      dataCompleteness: context.dataCompleteness,
      sourceStatus: context.ok ? 'ok' : 'partial',
      sanitizedErrorCode: context.sanitizedErrorCode,
      asOf: context.asOf,
      methodVersion: context.methodVersion,
      formatted,
      cached: false,
    };
    resultCache.set(cacheKey, { body, storedAtMs: Date.now() });
    return jsonResponse({ ok: true, marketIntel: body });
  } catch {
    return jsonResponse({ ok: true, marketIntel: blocked(SANITIZED.INTERNAL, 'error') });
  }
};

export const ALL: APIRoute = () => jsonResponse({ ok: false, marketIntel: blocked(SANITIZED.NON_LOCAL_REQUEST) }, 405);
