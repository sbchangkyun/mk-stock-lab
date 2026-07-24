import type { APIRoute } from 'astro';
import {
  getRetentionRequestContext,
  getRetentionSnapshot,
  jsonResponse,
  methodNotAllowed,
  toErrorResponse,
} from '../../../lib/server/userRetention';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const context = await getRetentionRequestContext(request);
  if (!context.ok) return toErrorResponse(context);

  const snapshot = await getRetentionSnapshot(context.data.user.id);
  if (!snapshot.ok) return toErrorResponse(snapshot);

  return jsonResponse({ ok: true, ...snapshot.data });
};

export const ALL = methodNotAllowed;
