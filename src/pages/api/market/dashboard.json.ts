/**
 * Phase 3GJ live market dashboard route.
 *
 * GET /api/market/dashboard.json?universe=<kospi200|kosdaq150|sp500|nasdaq100>&period=<1d|1w|1m|3m>
 *
 * Public route (no Supabase auth) — the Market page is a public experience. Only `universe` and
 * `period` are ever read from the query string through a closed enum parser; any other query
 * parameter (symbol arrays, sectors, exchange codes, provider names, cache-bypass/force-refresh
 * flags, Chart AI beta flags) has no effect. Route layer never calls a KIS transport directly: it
 * checks KIS readiness once (to return an honest MARKET_DASHBOARD_DISABLED without doing 12 wasted
 * constituent lookups when KIS is unavailable), then delegates all data work to the shared
 * marketDashboard service, which itself only reuses the existing cached OHLCV orchestration.
 */

import type { APIRoute } from 'astro';
import { getKisQuoteConfigReadiness } from '../../../lib/server/providers/kisClient';
import { getMarketDashboard, MARKET_DASHBOARD_SANITIZED_ERROR_CODES } from '../../../lib/server/marketDashboard/marketDashboard';
import { MARKET_UNIVERSE_IDS } from '../../../data/marketTrackedUniverses';
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
  const universeParam = (url.searchParams.get('universe') ?? '').trim();
  const periodParam = (url.searchParams.get('period') ?? '1d').trim();

  if (!MARKET_UNIVERSE_IDS.includes(universeParam as (typeof MARKET_UNIVERSE_IDS)[number])) {
    return jsonResponse({ ok: false, code: MARKET_DASHBOARD_SANITIZED_ERROR_CODES.VALIDATION_FAILED }, 400, NO_STORE);
  }
  if (!MARKET_DASHBOARD_PERIOD_IDS.includes(periodParam as (typeof MARKET_DASHBOARD_PERIOD_IDS)[number])) {
    return jsonResponse({ ok: false, code: MARKET_DASHBOARD_SANITIZED_ERROR_CODES.VALIDATION_FAILED }, 400, NO_STORE);
  }

  // Phase 3GJ: dedicated route, so the internal scoped option is structurally always true — the real
  // gate is the readiness check below (env flag + Preview guard + credentials), unchanged elsewhere.
  const readiness = getKisQuoteConfigReadiness({ allowProductionMarketDashboardLiveData: true });
  if (!readiness.ready) {
    return jsonResponse({ ok: false, code: MARKET_DASHBOARD_SANITIZED_ERROR_CODES.MARKET_DASHBOARD_DISABLED }, 200, NO_STORE);
  }

  const result = await getMarketDashboard({
    universeId: universeParam,
    period: periodParam,
    allowProductionMarketDashboardLiveData: true,
  });

  if (!result.ok) {
    return jsonResponse({ ok: false, code: result.sanitizedErrorCode }, 200, NO_STORE);
  }

  return jsonResponse({ ok: true, dashboard: result }, 200, SUCCESS_CACHE);
};

export const ALL: APIRoute = () =>
  jsonResponse({ ok: false, code: MARKET_DASHBOARD_SANITIZED_ERROR_CODES.VALIDATION_FAILED }, 405, NO_STORE);
