import type { APIRoute } from 'astro';
import {
  runLocalOnlyLiveKisMarketDataRequest,
  createRateLimiter,
  createQuoteCache,
  SANITIZED_ERROR_CODES,
  LOCAL_ONLY_ALLOWED_HOSTNAMES,
} from '../../../lib/server/chart-ai/local-only-live-kis-market-data-binding.mjs';
import { createChartAiKisMarketDataContext } from '../../../lib/server/chart-ai/kis-market-data-to-chart-ai-context.mjs';
import { runLocalOnlyLlmRuntimeBridge } from '../../../lib/server/chart-ai/local-only-llm-runtime-bridge.mjs';
import { getKisDomesticQuoteSnapshot } from '../../../lib/server/providers/kisClient';

export const prerender = false;

const DEFAULT_SYMBOL = '005930';
const SYMBOL_PATTERN = /^\d{6}$/;
const rateLimiter = createRateLimiter();
const cache = createQuoteCache();

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

const hasEnvValue = (name: string): boolean => {
  const value = process.env[name];
  return typeof value === 'string' && value.trim().length > 0;
};

const fetchQuote = async ({ symbol }: { symbol: string; category: string }) => {
  const result = await getKisDomesticQuoteSnapshot({ market: 'KR', symbol });
  if (!result.ok) return { ok: false as const, code: 'PROVIDER_UNAVAILABLE' };
  return {
    ok: true as const,
    data: { currentPrice: result.data.price, volume: typeof result.data.volume === 'number' ? result.data.volume : undefined },
  };
};

const blockedSummaryResponse = (sanitizedErrorCode: string) => ({
  ok: false,
  symbol: null,
  market: null,
  llmStatus: 'unavailable',
  summaryText: null,
  sanitizedErrorCode,
  modelPresent: false,
  sourceStatus: 'blocked',
  currentPricePresent: false,
  volumePresent: false,
  warnings: [sanitizedErrorCode],
});

export const GET: APIRoute = async ({ url, request }) => {
  const ownerLocalKisLlmOptIn = url.searchParams.get('ownerLocalKisLlm') === '1';
  const resolvedHostname = resolveLocalHostname(url, request);
  if (!ownerLocalKisLlmOptIn || !resolvedHostname) {
    return jsonResponse({ ok: true, summary: blockedSummaryResponse(SANITIZED_ERROR_CODES.NON_LOCAL_REQUEST) });
  }

  const symbolParam = (url.searchParams.get('symbol') ?? '').trim();
  if (symbolParam.length > 0 && !SYMBOL_PATTERN.test(symbolParam)) {
    return jsonResponse({ ok: true, summary: blockedSummaryResponse(SANITIZED_ERROR_CODES.INVALID_SYMBOL) });
  }
  const symbol = symbolParam.length > 0 ? symbolParam : DEFAULT_SYMBOL;

  const sanitizedKis = await runLocalOnlyLiveKisMarketDataRequest(
    {
      hostname: resolvedHostname,
      env: { NODE_ENV: process.env.NODE_ENV, VERCEL_ENV: process.env.VERCEL_ENV, VERCEL: process.env.VERCEL },
      symbol,
      category: 'current_price',
      nowMs: Date.now(),
    },
    { rateLimiter, cache, hasEnvValue, fetchQuote, now: () => Date.now(), timeoutMs: 8000 },
  );

  const kisContext = createChartAiKisMarketDataContext(sanitizedKis, { integrationMode: 'local-only' });

  const llmSummary = await runLocalOnlyLlmRuntimeBridge(
    {
      context: {
        symbol: kisContext.symbol,
        market: kisContext.market,
        currentPrice: kisContext.currentPrice,
        volume: kisContext.volume,
        timestamp: kisContext.timestamp,
        sourceStatus: kisContext.sourceStatus,
        cacheStatus: kisContext.cacheStatus,
        providerLabel: kisContext.providerLabel,
        integrationMode: kisContext.integrationMode,
      },
      env: {
        CHART_AI_ENABLE_LOCAL_LLM: process.env.CHART_AI_ENABLE_LOCAL_LLM,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        CHART_AI_LLM_MODEL: process.env.CHART_AI_LLM_MODEL,
      },
    },
    { timeoutMs: 12000 },
  );

  return jsonResponse({ ok: true, summary: llmSummary });
};

export const ALL: APIRoute = () =>
  jsonResponse({ ok: false, summary: blockedSummaryResponse(SANITIZED_ERROR_CODES.NON_LOCAL_REQUEST) }, 405);
