/**
 * Phase 3GL — shared Home live-market route.
 *
 * GET /api/home/live-market.json
 *
 * Public route (no Supabase auth, no client-controlled input — a closed server-side registry only).
 * Serves both the Home ticker belt and the Home Market Snapshot from ONE resolution pass (see
 * src/lib/server/homeLiveMarket/homeLiveMarket.ts). Reuses the same Production-exception flag as the
 * existing Phase 3GJ market-dashboard routes, so no new Vercel environment variable is required.
 */

import type { APIRoute } from 'astro';
import { getKisQuoteConfigReadiness } from '../../../lib/server/providers/kisClient';
import { getHomeLiveMarket } from '../../../lib/server/homeLiveMarket/homeLiveMarket';
import { MARKET_DASHBOARD_SANITIZED_ERROR_CODES } from '../../../lib/server/marketDashboard/marketDashboard';

export const prerender = false;

const jsonResponse = (body: unknown, status: number, cacheControl: string) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': cacheControl },
  });

const NO_STORE = 'no-store';
const SUCCESS_CACHE = 'public, s-maxage=45, stale-while-revalidate=45';

export const GET: APIRoute = async () => {
  const readiness = getKisQuoteConfigReadiness({ allowProductionMarketDashboardLiveData: true });
  if (!readiness.ready) {
    return jsonResponse({ ok: false, code: MARKET_DASHBOARD_SANITIZED_ERROR_CODES.MARKET_DASHBOARD_DISABLED }, 200, NO_STORE);
  }

  const result = await getHomeLiveMarket({ allowProductionMarketDashboardLiveData: true });

  if (!result.ok) {
    return jsonResponse({ ok: false, code: result.sanitizedErrorCode }, 200, NO_STORE);
  }

  return jsonResponse(
    { ok: true, generatedAt: result.generatedAt, ticker: result.ticker, snapshot: result.snapshot },
    200,
    SUCCESS_CACHE,
  );
};

export const ALL: APIRoute = () =>
  jsonResponse({ ok: false, code: MARKET_DASHBOARD_SANITIZED_ERROR_CODES.VALIDATION_FAILED }, 405, NO_STORE);
