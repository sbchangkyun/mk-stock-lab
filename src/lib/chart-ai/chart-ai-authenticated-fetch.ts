/**
 * Phase 3GG-T-HF3B-HF2-HF2A3 — authoritative client transport for protected same-origin Chart AI APIs.
 *
 * Root cause of the "no search results for ANY instrument on the Preview": the Chart AI API calls used
 * `credentials: 'omit'`, which strips the Vercel Deployment Protection (SSO) cookie from same-origin
 * requests. On an SSO-protected Preview, Vercel intercepts/redirects those requests to its login screen
 * BEFORE they reach the Astro API route, so every search/OHLCV/analysis call fails (the app route is
 * never hit).
 *
 * This helper sends `credentials: 'same-origin'` so the Preview's SSO cookie reaches the SAME Preview
 * origin (and nowhere else), while the Supabase Bearer token remains independently required by the route.
 * It never weakens auth, never touches the cookie manually, and never logs tokens/cookies/headers/bodies.
 */

import { getCurrentSession } from '../supabase';

export type ChartAiTransportState =
  | 'SUCCESS'
  | 'NO_RESULTS'
  | 'APP_AUTH_REQUIRED'
  | 'APP_AUTH_INVALID'
  | 'PREVIEW_DEPLOYMENT_AUTH_REQUIRED'
  | 'API_RESPONSE_INVALID'
  | 'API_REQUEST_FAILED';

/** Resolve `input` against the current origin and reject a cross-origin target before any fetch. */
const resolveSameOrigin = (input: string | URL): string => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
  const resolved = new URL(String(input), origin);
  if (resolved.origin !== origin) {
    throw new Error('chartAiAuthenticatedFetch: cross-origin target is not allowed');
  }
  return resolved.toString();
};

/**
 * Authenticated, same-origin transport for a protected Chart AI API request. Attaches the current
 * Supabase Bearer token (from the existing session source only — never cached in module state) and sends
 * `credentials: 'same-origin'` so the Vercel SSO cookie accompanies the same-origin request. Preserves
 * the caller's headers (robust Headers merge), method, body, and AbortSignal. Returns the raw Response.
 */
export const chartAiAuthenticatedFetch = async (input: string | URL, init: RequestInit = {}): Promise<Response> => {
  const url = resolveSameOrigin(input);
  const headers = new Headers(init.headers);
  try {
    const session = await getCurrentSession();
    if (session?.access_token) headers.set('Authorization', `Bearer ${session.access_token}`);
  } catch {
    // No session -> no Authorization header; the route decides (fails closed). Never throw for this.
  }
  return fetch(url, {
    ...init,
    headers,
    // Same-origin only: sends the Preview SSO cookie to the SAME Preview host, never to KIS/Supabase/
    // vercel.com/another domain. Bearer auth is still required by the route.
    credentials: 'same-origin',
  });
};

/**
 * Classify a Chart AI API Response (+ optionally its parsed JSON) so a transport/deployment-protection or
 * app-auth failure is NEVER shown to the user as "zero results". Deployment protection manifests as a
 * cross-origin redirect and/or an HTML body where JSON is required.
 */
export const classifyChartAiResponse = (
  response: Response,
  data: any,
  parsedOk: boolean,
): ChartAiTransportState => {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  let redirectedOffOrigin = false;
  try {
    redirectedOffOrigin = Boolean(response.redirected) && new URL(response.url).origin !== origin;
  } catch {
    redirectedOffOrigin = false;
  }
  const contentType = response.headers.get('content-type') || '';
  const looksHtml = contentType.includes('text/html');

  // Deployment protection intercepted the request before the JSON API could answer.
  if (redirectedOffOrigin || looksHtml || (!parsedOk && !contentType.includes('application/json'))) {
    return 'PREVIEW_DEPLOYMENT_AUTH_REQUIRED';
  }
  if (!parsedOk) return 'API_RESPONSE_INVALID';

  const code = data?.code ?? data?.sanitizedErrorCode;
  if (response.status === 401 || code === 'AUTH_REQUIRED') return 'APP_AUTH_REQUIRED';
  if (response.status === 403 || code === 'AUTH_INVALID') return 'APP_AUTH_INVALID';
  if (!response.ok || data?.ok !== true) return 'API_RESPONSE_INVALID';
  return 'SUCCESS';
};

/** Non-secret transport metadata for deterministic browser QA (never tokens/cookies/user data). */
export interface ChartAiJsonResult {
  state: ChartAiTransportState;
  status: number;
  data: any;
  masterVersion: string | null;
  host: string;
}

/**
 * Authenticated same-origin JSON fetch with transport classification. Rethrows AbortError so callers keep
 * their existing abort handling; every other failure is classified (never thrown) so the caller can show
 * a transport message instead of "no results".
 */
export const fetchChartAiJson = async (input: string | URL, init: RequestInit = {}): Promise<ChartAiJsonResult> => {
  let response: Response;
  try {
    response = await chartAiAuthenticatedFetch(input, init);
  } catch (error) {
    if (error && (error as any).name === 'AbortError') throw error;
    return { state: 'API_REQUEST_FAILED', status: 0, data: null, masterVersion: null, host: '' };
  }
  let host = '';
  try { host = new URL(response.url).host; } catch { /* keep empty */ }
  const masterVersion = response.headers.get('X-MK-Instrument-Master-Version');

  let data: any = null;
  let parsedOk = false;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try { data = await response.json(); parsedOk = true; } catch { parsedOk = false; }
  }
  let state = classifyChartAiResponse(response, data, parsedOk);
  if (state === 'SUCCESS') {
    const total = Number.isFinite(data?.total) ? Number(data.total) : (Array.isArray(data?.items) ? data.items.length : 0);
    if (total === 0) state = 'NO_RESULTS';
  }
  return { state, status: response.status, data, masterVersion: masterVersion ?? (data?.masterVersion ?? null), host };
};
