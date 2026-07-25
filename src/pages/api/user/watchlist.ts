import type { APIRoute } from 'astro';
import {
  addWatchlistItem,
  getRetentionRequestContext,
  jsonResponse,
  listWatchlistItems,
  methodNotAllowed,
  readJsonBody,
  removeWatchlistItem,
  toErrorResponse,
} from '../../../lib/server/userRetention';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const context = await getRetentionRequestContext(request);
  if (!context.ok) return toErrorResponse(context);

  const result = await listWatchlistItems(context.data.user.id);
  if (!result.ok) return toErrorResponse(result);

  return jsonResponse({ ok: true, watchlist: result.data });
};

export const POST: APIRoute = async ({ request }) => {
  const context = await getRetentionRequestContext(request);
  if (!context.ok) return toErrorResponse(context);

  const body = await readJsonBody(request);
  if (!body.ok) return toErrorResponse(body);

  const result = await addWatchlistItem(context.data.user.id, body.data);
  if (!result.ok) return toErrorResponse(result);

  return jsonResponse({ ok: true, item: result.data });
};

export const DELETE: APIRoute = async ({ request }) => {
  const context = await getRetentionRequestContext(request);
  if (!context.ok) return toErrorResponse(context);

  const body = await readJsonBody(request);
  if (!body.ok) return toErrorResponse(body);

  const result = await removeWatchlistItem(context.data.user.id, body.data.id);
  if (!result.ok) return toErrorResponse(result);

  return jsonResponse({ ok: true, id: result.data.id });
};

export const ALL = methodNotAllowed;
