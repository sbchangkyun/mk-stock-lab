/**
 * Phase 3GM: GET /api/admin/operations/overview.json
 *
 * Read-only, administrator-only operational visibility route. GET only; every other method is
 * rejected before any operational data is read. Authorization order is strict and fail-closed:
 *   1. Bearer/session auth check (validateUserFromBearerToken, reused unchanged from the Chart AI
 *      and Portfolio API routes) -- signed-out -> sanitized 401, no operational read attempted.
 *   2. Server-side site-admin check (reused public.site_admins registry, unchanged) -- authenticated
 *      non-admin -> sanitized 403, no operational read attempted.
 *   3. Only once both pass does the route call the read-only aggregator.
 *
 * `Cache-Control: no-store` on every response (success and failure) so no admin result is ever
 * cached publicly or shared across sessions. No query parameter influences which symbols/providers
 * are read (there are none to read here) -- the aggregator only reads existing store/cache state.
 * Never returns a raw exception, a stack trace, a secret, or PII; every failure path returns a
 * fixed, sanitized `{ ok: false, code }` shape.
 */

import type { APIRoute } from 'astro';
import { authorizeAdminOperationsRequest } from '../../../../lib/server/adminOperations/adminAuthorization';
import { getAdminOperationsOverview } from '../../../../lib/server/adminOperations/operationsAggregator';

export const prerender = false;

const jsonResponse = (body: Record<string, unknown>, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

export const GET: APIRoute = async ({ request }) => {
  const authorization = await authorizeAdminOperationsRequest(request.headers.get('authorization'));
  if (!authorization.ok) {
    return jsonResponse({ ok: false, code: authorization.code, message: authorization.message }, authorization.status);
  }

  try {
    const overview = await getAdminOperationsOverview();
    return jsonResponse({ ok: true, overview }, 200);
  } catch {
    // Never surface a raw exception/stack trace to the client.
    return jsonResponse({ ok: false, code: 'ADMIN_OPERATIONS_READ_FAILED', message: '운영 정보를 불러오지 못했습니다.' }, 500);
  }
};

export const ALL: APIRoute = () =>
  jsonResponse({ ok: false, code: 'METHOD_NOT_ALLOWED', message: '허용되지 않는 요청 방식입니다.' }, 405);
