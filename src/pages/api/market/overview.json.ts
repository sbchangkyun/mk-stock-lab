/**
 * Phase 3GJ live market dashboard — benchmark-proxy overview route.
 *
 * GET /api/market/overview.json?period=<1d|1w|1m|3m>
 *
 * Public route (no Supabase auth). Resolves ONLY the four validated benchmark proxies (never a
 * detailed universe, never an arbitrary symbol) — consumed by both the Home live market snapshot
 * and the Market page's always-visible overview row. Same readiness-then-service pattern as
 * dashboard.json.ts; never calls a KIS transport directly.
 */

import type { APIRoute } from 'astro';
import { getKisQuoteConfigReadiness } from '../../../lib/server/providers/kisClient';
import { getMarketOverview, MARKET_DASHBOARD_SANITIZED_ERROR_CODES } from '../../../lib/server/marketDashboard/marketDashboard';
import { MARKET_DASHBOARD_PERIOD_IDS } from '../../../lib/market-dashboard/metrics';

export const prerender = false;

const jsonResponse = (body: unknown, status: number, cacheControl: string) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': cacheControl },
  });

const NO_STORE = 'no-store';
const SUCCESS_CACHE = 'public, s-maxage=60, stale-while-revalidate=300';

export const GET: APIRoute = async ({ url }) => {
  const periodParam = (url.searchParams.get('period') ?? '1d').trim();

  if (!MARKET_DASHBOARD_PERIOD_IDS.includes(periodParam as (typeof MARKET_DASHBOARD_PERIOD_IDS)[number])) {
    return jsonResponse({ ok: false, code: MARKET_DASHBOARD_SANITIZED_ERROR_CODES.VALIDATION_FAILED }, 400, NO_STORE);
  }

  const readiness = getKisQuoteConfigReadiness({ allowProductionMarketDashboardLiveData: true });
  if (!readiness.ready) {
    return jsonResponse({ ok: false, code: MARKET_DASHBOARD_SANITIZED_ERROR_CODES.MARKET_DASHBOARD_DISABLED }, 200, NO_STORE);
  }

  const result = await getMarketOverview({ period: periodParam, allowProductionMarketDashboardLiveData: true });

  if (!result.ok) {
    return jsonResponse({ ok: false, code: result.sanitizedErrorCode }, 200, NO_STORE);
  }

  return jsonResponse({ ok: true, overview: result }, 200, SUCCESS_CACHE);
};

export const ALL: APIRoute = () =>
  jsonResponse({ ok: false, code: MARKET_DASHBOARD_SANITIZED_ERROR_CODES.VALIDATION_FAILED }, 405, NO_STORE);
