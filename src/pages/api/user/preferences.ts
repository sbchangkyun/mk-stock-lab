import type { APIRoute } from 'astro';
import {
  getRetentionRequestContext,
  jsonResponse,
  methodNotAllowed,
  readJsonBody,
  toErrorResponse,
  updatePreferences,
} from '../../../lib/server/userRetention';

export const prerender = false;

export const PATCH: APIRoute = async ({ request }) => {
  const context = await getRetentionRequestContext(request);
  if (!context.ok) return toErrorResponse(context);

  const body = await readJsonBody(request);
  if (!body.ok) return toErrorResponse(body);

  const result = await updatePreferences(context.data.user.id, body.data);
  if (!result.ok) return toErrorResponse(result);

  return jsonResponse({ ok: true, preferences: result.data });
};

export const ALL = methodNotAllowed;
