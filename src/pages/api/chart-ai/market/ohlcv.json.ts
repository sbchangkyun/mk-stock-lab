/**
 * Phase 3GG-OP-FAST real OHLCV route (KR domestic + US overseas, provider-neutral).
 *
 * GET /api/chart-ai/market/ohlcv.json?country=<KR|US>&symbol=<code|ticker>&range=<1m|3m|6m|1y>
 *
 * Returns real, delayed OHLCV candles for a selected instrument. Guarded exactly like the KIS+LLM
 * summary route: a localhost owner opt-in (?ownerLocalOhlcv=1), the protected Vercel Preview beta,
 * or the production Chart AI beta. Only the production-beta path forwards the scoped live-quote
 * exception to kisClient. No sample/synthetic OHLCV fallback: an unavailable/no-data result is
 * returned honestly with a sanitized error code. Numeric OHLCV is intentional on this dedicated
 * chart-data path and is kept separate from the non-numeric LLM summary contract.
 */

import type { APIRoute } from 'astro';
import {
  evaluateProtectedPreviewBetaAccess,
  evaluateProductionChartAiBetaAccess,
} from '../../../../lib/server/chart-ai/protected-preview-beta-guard.mjs';
import { LOCAL_ONLY_ALLOWED_HOSTNAMES } from '../../../../lib/server/chart-ai/local-only-live-kis-market-data-binding.mjs';
import { validateUserFromBearerToken } from '../../../../lib/server/supabaseAdmin';
import { findUniversalInstrument } from '../../../../lib/server/chart-ai/universal-instrument-search.mjs';
import {
  fetchUniversalOhlcv,
  OHLCV_SANITIZED_ERROR_CODES,
} from '../../../../lib/server/chart-ai/universalOhlcvProvider';
import { normalizeOhlcvRange } from '../../../../lib/server/chart-ai/universal-ohlcv-normalize.mjs';
import { getKisQuoteConfigReadiness } from '../../../../lib/server/providers/kisClient';

export const prerender = false;

// Phase 3GG-T-HF3B-HF2-HF2B-HF1: sanitized, non-secret access/readiness classification so a blocked
// chart is never shown as an ambiguous "access rights" catch-all. These are coarse fixed enums only —
// no env values, tokens, cookies, identities, or raw provider payloads are ever exposed. Read-only
// market-data route (never used on account/order/balance routes).
const CHART_AI_ACCESS_CODE = {
  NONE: 'NONE',
  NON_LOCAL_REQUEST: 'NON_LOCAL_REQUEST',
  PREVIEW_BETA_GUARD_BLOCKED: 'PREVIEW_BETA_GUARD_BLOCKED',
  KIS_PREVIEW_GUARD_REQUIRED: 'KIS_PREVIEW_GUARD_REQUIRED',
  KIS_DISABLED: 'KIS_DISABLED',
  KIS_CONFIG_MISSING: 'KIS_CONFIG_MISSING',
  KIS_PROVIDER_UNAVAILABLE: 'KIS_PROVIDER_UNAVAILABLE',
  NO_DATA: 'NO_DATA',
  INVALID_INSTRUMENT: 'INVALID_INSTRUMENT',
} as const;

// Coarse KIS readiness reason -> sanitized client code (fixed enum; never a value).
const READINESS_CODE: Record<string, string> = {
  preview_guard_required: CHART_AI_ACCESS_CODE.KIS_PREVIEW_GUARD_REQUIRED,
  disabled: CHART_AI_ACCESS_CODE.KIS_DISABLED,
  config_missing: CHART_AI_ACCESS_CODE.KIS_CONFIG_MISSING,
  production_not_allowed: CHART_AI_ACCESS_CODE.KIS_CONFIG_MISSING,
};

type ImportMetaWithEnv = ImportMeta & { env?: Record<string, string | undefined> };
const getImportMetaEnv = (): Record<string, string | undefined> =>
  (import.meta as ImportMetaWithEnv).env ?? {};
const readServerEnvValue = (name: string): string | undefined => {
  const fromImportMeta = getImportMetaEnv()[name];
  if (typeof fromImportMeta === 'string' && fromImportMeta.trim().length > 0) return fromImportMeta;
  return process.env[name];
};

const jsonResponse = (body: unknown, status = 200, extraHeaders: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extraHeaders },
  });

const resolveLocalHostname = (url: URL, request: Request): string | null => {
  const urlHost = url.hostname.toLowerCase();
  if (LOCAL_ONLY_ALLOWED_HOSTNAMES.includes(urlHost)) return urlHost;
  const headerHost = (request.headers.get('host') ?? '').split(':')[0]?.trim().toLowerCase();
  if (headerHost && LOCAL_ONLY_ALLOWED_HOSTNAMES.includes(headerHost)) return headerHost;
  return null;
};

const blockedResponse = (range: string, sanitizedErrorCode: string) => ({
  ok: false,
  instrument: null,
  range,
  interval: '1d',
  candles: [],
  candleCount: 0,
  sourceStatus: 'blocked',
  sanitizedErrorCode,
  cached: false,
  asOf: null,
  isDelayed: true,
});

export const GET: APIRoute = async ({ url, request }) => {
  const range = normalizeOhlcvRange(url.searchParams.get('range') ?? undefined);

  // Guard: localhost owner opt-in OR protected preview beta OR production beta.
  const ownerLocalOptIn = url.searchParams.get('ownerLocalOhlcv') === '1';
  const resolvedHostname = resolveLocalHostname(url, request);
  const localOwnerAllowed = ownerLocalOptIn && Boolean(resolvedHostname);

  // Phase 3GG-T-HF1: Chart AI requires an authenticated Supabase user on every deployed
  // (Preview/Production) request. The localhost owner opt-in stays token-free for owner smokes/dev.
  // Fails closed with a sanitized 401/403 before any provider work — reuses the same Bearer-token
  // validator the Portfolio APIs use (no new auth scheme).
  if (!localOwnerAllowed) {
    const auth = await validateUserFromBearerToken(request.headers.get('authorization'));
    if (!auth.ok) {
      return jsonResponse({ ok: false, code: auth.code, message: auth.message }, auth.status);
    }
  }

  const betaAccess = evaluateProtectedPreviewBetaAccess({
    betaQueryOptIn: url.searchParams.get('chartAiBetaPreview') === '1',
    env: {
      VERCEL_ENV: readServerEnvValue('VERCEL_ENV'),
      NODE_ENV: readServerEnvValue('NODE_ENV'),
      CHART_AI_ENABLE_PROTECTED_PREVIEW_BETA: readServerEnvValue('CHART_AI_ENABLE_PROTECTED_PREVIEW_BETA'),
    },
  });

  const prodBetaAccess = evaluateProductionChartAiBetaAccess({
    betaQueryOptIn: url.searchParams.get('chartAiProdBeta') === '1',
    env: {
      VERCEL_ENV: readServerEnvValue('VERCEL_ENV'),
      CHART_AI_ENABLE_PRODUCTION_CHART_AI_BETA: readServerEnvValue('CHART_AI_ENABLE_PRODUCTION_CHART_AI_BETA'),
    },
  });

  // Stage 1 — access guard. Distinguish "beta opt-in present but the protected-Preview guard denied it"
  // from a plain non-local request, so the client shows an honest message instead of an access-rights
  // catch-all. (X-MK-Chart-AI-Access-Stage is a coarse fixed enum — no env values are exposed.)
  if (!localOwnerAllowed && !betaAccess.allowed && !prodBetaAccess.allowed) {
    const betaOptInPresent = url.searchParams.get('chartAiBetaPreview') === '1';
    const code = betaOptInPresent ? CHART_AI_ACCESS_CODE.PREVIEW_BETA_GUARD_BLOCKED : CHART_AI_ACCESS_CODE.NON_LOCAL_REQUEST;
    return jsonResponse({ ok: true, ohlcv: blockedResponse(range, code) }, 200, {
      'X-MK-Chart-AI-Access-Stage': 'GUARD_BLOCKED',
      'X-MK-KIS-Readiness-State': 'not_checked',
    });
  }

  const countryParam = (url.searchParams.get('country') ?? '').trim().toUpperCase();
  const symbolParam = (url.searchParams.get('symbol') ?? '').trim();
  const country = countryParam === 'KR' || countryParam === 'US' ? countryParam : undefined;

  const instrument = findUniversalInstrument(symbolParam, country);
  if (!instrument) {
    return jsonResponse({
      ok: true,
      ohlcv: blockedResponse(range, OHLCV_SANITIZED_ERROR_CODES.INVALID_INSTRUMENT),
    }, 200, { 'X-MK-Chart-AI-Access-Stage': 'GUARD_ALLOWED', 'X-MK-KIS-Readiness-State': 'not_checked' });
  }

  const allowProd = prodBetaAccess.allowed === true;

  // Stage 2 — KIS readiness (read-only, same gate the provider uses). If the runtime is a valid Preview
  // but a required Preview-scoped KIS variable is absent/disabled, classify it honestly (config, not
  // access rights) BEFORE any token/provider work. This never issues a token and never reads a value —
  // only the coarse readiness reason enum is surfaced.
  const readiness = getKisQuoteConfigReadiness({ allowProductionChartAiBetaLiveQuotes: allowProd });
  const readinessState = typeof readiness.reason === 'string' ? readiness.reason : 'unknown';
  if (!readiness.ready) {
    const code = READINESS_CODE[readinessState] ?? CHART_AI_ACCESS_CODE.KIS_CONFIG_MISSING;
    return jsonResponse({ ok: true, ohlcv: blockedResponse(range, code) }, 200, {
      'X-MK-Chart-AI-Access-Stage': 'READINESS_BLOCKED',
      'X-MK-KIS-Readiness-State': readinessState,
    });
  }

  // Stage 3 — provider fetch (token lifecycle handled by the existing durable manager; unchanged).
  const ohlcv = await fetchUniversalOhlcv({ instrument, range, allowProductionChartAiBetaLiveQuotes: allowProd });

  // A provider failure AFTER a ready readiness is a token/data failure, not an access/config problem —
  // surface a coarse KIS_PROVIDER_UNAVAILABLE (never the raw provider error). no-data stays NO_DATA.
  const mappedOhlcv =
    ohlcv.sourceStatus === 'unavailable' && ohlcv.sanitizedErrorCode === OHLCV_SANITIZED_ERROR_CODES.PROVIDER_UNAVAILABLE
      ? { ...ohlcv, sourceStatus: 'unavailable' as const, sanitizedErrorCode: CHART_AI_ACCESS_CODE.KIS_PROVIDER_UNAVAILABLE }
      : ohlcv;

  // Safe cache-observability header (MISS | HIT | COALESCED | NEGATIVE_HIT | BYPASS). Metadata only:
  // no key, no credentials, no user identity; the response body contract is unchanged.
  const cacheState = typeof ohlcv.cacheState === 'string' ? ohlcv.cacheState : 'MISS';
  const accessStage = mappedOhlcv.sourceStatus === 'ok' ? 'OK' : 'PROVIDER';
  return jsonResponse({ ok: true, ohlcv: mappedOhlcv }, 200, {
    'X-MK-OHLCV-Cache': cacheState,
    'X-MK-Chart-AI-Access-Stage': accessStage,
    'X-MK-KIS-Readiness-State': readinessState,
  });
};

export const ALL: APIRoute = () => jsonResponse({ ok: false, ohlcv: blockedResponse('3m', 'NON_LOCAL_REQUEST') }, 405);
