import type { APIRoute } from 'astro';
import {
  createPosition,
  deletePosition,
  getPortfolioRequestContext,
  jsonResponse,
  listPositions,
  methodNotAllowed,
  readJsonBody,
  toErrorResponse,
  updatePosition,
} from '../../../lib/server/portfolio';

export const prerender = false;

export const GET: APIRoute = async ({ request, url }) => {
  const context = await getPortfolioRequestContext(request);
  if (!context.ok) return toErrorResponse(context);

  const result = await listPositions(context.data.user.id, url.searchParams.get('portfolioId'));
  if (!result.ok) return toErrorResponse(result);

  return jsonResponse({ ok: true, positions: result.data });
};

export const POST: APIRoute = async ({ request }) => {
  const context = await getPortfolioRequestContext(request);
  if (!context.ok) return toErrorResponse(context);

  const body = await readJsonBody(request);
  if (!body.ok) return toErrorResponse(body);

  const result = await createPosition(context.data.user.id, body.data);
  if (!result.ok) return toErrorResponse(result);

  return jsonResponse({ ok: true, position: result.data });
};

export const PATCH: APIRoute = async ({ request }) => {
  const context = await getPortfolioRequestContext(request);
  if (!context.ok) return toErrorResponse(context);

  const body = await readJsonBody(request);
  if (!body.ok) return toErrorResponse(body);

  const result = await updatePosition(context.data.user.id, body.data);
  if (!result.ok) return toErrorResponse(result);

  return jsonResponse({ ok: true, position: result.data });
};

export const DELETE: APIRoute = async ({ request, url }) => {
  const context = await getPortfolioRequestContext(request);
  if (!context.ok) return toErrorResponse(context);

  let id: unknown = url.searchParams.get('id');
  if (!id) {
    const body = await readJsonBody(request);
    if (!body.ok) return toErrorResponse(body);
    id = body.data.id;
  }

  const result = await deletePosition(context.data.user.id, id);
  if (!result.ok) return toErrorResponse(result);

  return jsonResponse({ ok: true, deleted: result.data });
};

export const ALL = methodNotAllowed;
