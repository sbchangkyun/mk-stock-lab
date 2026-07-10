/**
 * Phase 3GG-E-INTEGRATE local-only KIS current_price -> Chart AI context route.
 *
 * BLOCKED BY DEFAULT. Only ever returns a non-blocked context when ALL of the following hold:
 * - the request carries the explicit owner-local opt-in query flag `ownerLocalKisIntegration=1`;
 * - the request resolves to a local hostname (localhost / 127.0.0.1 / ::1);
 * - the Phase 3GG-D-FAST local-only guard (env-based) also allows it (never runs in a Vercel/
 *   deployed/production runtime, regardless of hostname);
 * - `KIS_ENABLE_LIVE_QUOTES` and the other required KIS credential env vars are present, which
 *   the delegated `kisClient.ts` transport checks on every call.
 *
 * Endpoint category is fixed to `current_price` -- there is no way to request any other category
 * through this route. No other KIS capability of any kind is exposed here or reachable from here.
 * Every response is a sanitized Chart AI context object built by
 * `kis-market-data-to-chart-ai-context.mjs`; this route never returns a raw KIS payload, a raw
 * error, a call trace, a credential value, or any header/cookie/session/token data. Responses are
 * always `Cache-Control: no-store`.
 */

import type { APIRoute } from 'astro';
import {
  runLocalOnlyLiveKisMarketDataRequest,
  createRateLimiter,
  createQuoteCache,
  SANITIZED_ERROR_CODES,
  LOCAL_ONLY_ALLOWED_HOSTNAMES,
} from '../../../lib/server/chart-ai/local-only-live-kis-market-data-binding.mjs';
import { createChartAiKisMarketDataContext } from '../../../lib/server/chart-ai/kis-market-data-to-chart-ai-context.mjs';
import { getKisDomesticQuoteSnapshot } from '../../../lib/server/providers/kisClient';

export const prerender = false;

const DEFAULT_SYMBOL = '005930';

// Module-scope rate limiter / cache: shared across requests within one running server process,
// same pattern as kisClient.ts's own module-scope access-token cache.
const rateLimiter = createRateLimiter();
const cache = createQuoteCache();

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });

const resolveLocalHostname = (url: URL, request: Request): string | null => {
  const urlHost = url.hostname.toLowerCase();
  if (LOCAL_ONLY_ALLOWED_HOSTNAMES.includes(urlHost)) return urlHost;
  const headerHost = (request.headers.get('host') ?? '').split(':')[0]?.trim().toLowerCase();
  if (headerHost && LOCAL_ONLY_ALLOWED_HOSTNAMES.includes(headerHost)) return headerHost;
  return null;
};

// Boolean-presence check only; never reads, logs, or serializes the value itself.
const hasEnvValue = (name: string): boolean => {
  const value = process.env[name];
  return typeof value === 'string' && value.trim().length > 0;
};

const fetchQuote = async ({ symbol }: { symbol: string; category: string }) => {
  const result = await getKisDomesticQuoteSnapshot({ market: 'KR', symbol });
  if (!result.ok) {
    return { ok: false as const, code: 'PROVIDER_UNAVAILABLE' };
  }
  return {
    ok: true as const,
    data: {
      currentPrice: result.data.price,
      volume: typeof result.data.volume === 'number' ? result.data.volume : undefined,
    },
  };
};

const blockedContext = (sanitizedErrorCode: string) =>
  createChartAiKisMarketDataContext(
    { sourceStatus: 'blocked', sanitizedErrorCode },
    { integrationMode: 'local-only' },
  );

export const GET: APIRoute = async ({ url, request }) => {
  const ownerLocalKisIntegrationOptIn = url.searchParams.get('ownerLocalKisIntegration') === '1';
  const resolvedHostname = resolveLocalHostname(url, request);

  // Explicit opt-in AND local hostname required before anything else runs. Missing either
  // yields the same fail-closed "not a local-only owner request" context.
  if (!ownerLocalKisIntegrationOptIn || !resolvedHostname) {
    return jsonResponse({ ok: true, context: blockedContext(SANITIZED_ERROR_CODES.NON_LOCAL_REQUEST) });
  }

  const symbolParam = (url.searchParams.get('symbol') ?? '').trim();
  const symbol = symbolParam.length > 0 ? symbolParam : DEFAULT_SYMBOL;

  const sanitized = await runLocalOnlyLiveKisMarketDataRequest(
    {
      hostname: resolvedHostname,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: process.env.VERCEL_ENV,
        VERCEL: process.env.VERCEL,
      },
      symbol,
      category: 'current_price',
      nowMs: Date.now(),
    },
    {
      rateLimiter,
      cache,
      hasEnvValue,
      fetchQuote,
      now: () => Date.now(),
      timeoutMs: 8000,
    },
  );

  return jsonResponse({ ok: true, context: createChartAiKisMarketDataContext(sanitized, { integrationMode: 'local-only' }) });
};

export const ALL: APIRoute = () =>
  jsonResponse({ ok: false, context: blockedContext(SANITIZED_ERROR_CODES.NON_LOCAL_REQUEST) }, 405);
