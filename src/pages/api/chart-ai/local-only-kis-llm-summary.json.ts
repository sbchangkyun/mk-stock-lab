import type { APIRoute } from 'astro';
import {
  runLocalOnlyLiveKisMarketDataRequest,
  createRateLimiter,
  createQuoteCache,
  SANITIZED_ERROR_CODES,
  LOCAL_ONLY_ALLOWED_HOSTNAMES,
} from '../../../lib/server/chart-ai/local-only-live-kis-market-data-binding.mjs';
import { createChartAiKisMarketDataContext } from '../../../lib/server/chart-ai/kis-market-data-to-chart-ai-context.mjs';
import { runLocalOnlyLlmRuntimeBridge } from '../../../lib/server/chart-ai/local-only-llm-runtime-bridge.mjs';
import {
  evaluateProtectedPreviewBetaAccess,
  evaluateProductionChartAiBetaAccess,
} from '../../../lib/server/chart-ai/protected-preview-beta-guard.mjs';
import { getKisDomesticQuoteSnapshot } from '../../../lib/server/providers/kisClient';

export const prerender = false;

const DEFAULT_SYMBOL = '005930';
const SYMBOL_PATTERN = /^\d{6}$/;
const rateLimiter = createRateLimiter();
const cache = createQuoteCache();

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

const resolveLocalHostname = (url: URL, request: Request): string | null => {
  const urlHost = url.hostname.toLowerCase();
  if (LOCAL_ONLY_ALLOWED_HOSTNAMES.includes(urlHost)) return urlHost;
  const headerHost = (request.headers.get('host') ?? '').split(':')[0]?.trim().toLowerCase();
  if (headerHost && LOCAL_ONLY_ALLOWED_HOSTNAMES.includes(headerHost)) return headerHost;
  return null;
};

const hasEnvValue = (name: string): boolean => {
  const value = process.env[name];
  return typeof value === 'string' && value.trim().length > 0;
};

type ImportMetaWithEnv = ImportMeta & {
  env?: Record<string, string | undefined>;
};

const getImportMetaEnv = (): Record<string, string | undefined> =>
  (import.meta as ImportMetaWithEnv).env ?? {};

// Reads a server-only env value from the Astro/Vite runtime source (import.meta.env, where `.env`
// file values are exposed during `astro dev`/SSR) first, then falls back to process.env (owner-run
// Node harness / OS-level exported vars). Mirrors the dual-source resolver established in
// kisClient.ts (Phase 3GG-K-ENV-HF5) and supabaseAdmin.ts. Exists because `.env`-only LLM values
// such as CHART_AI_ENABLE_LOCAL_LLM are NOT visible through process.env inside the Astro dev/SSR
// runtime. Only the read source changes here -- the fail-closed LLM readiness/guard logic in the
// bridge is unchanged, and this is a server-only route module (never shipped to the client).
const readServerEnvValue = (name: string): string | undefined => {
  const fromImportMeta = getImportMetaEnv()[name];
  if (typeof fromImportMeta === 'string' && fromImportMeta.trim().length > 0) {
    return fromImportMeta;
  }
  return process.env[name];
};

const fetchQuote = async ({
  symbol,
  allowProductionChartAiBetaLiveQuotes,
}: {
  symbol: string;
  category: string;
  allowProductionChartAiBetaLiveQuotes?: boolean;
}) => {
  // Phase 3GG-M-PROD-HF1: forward the scoped production Chart AI beta signal to the provider client.
  // It is true only when the GET handler's production beta guard (VERCEL_ENV=production +
  // CHART_AI_ENABLE_PRODUCTION_CHART_AI_BETA=true + ?chartAiProdBeta=1) has already passed; kisClient
  // re-checks the Production flag itself before lifting its hard block, and the scope stays current_price.
  const result = await getKisDomesticQuoteSnapshot(
    { market: 'KR', symbol },
    { allowProductionChartAiBetaLiveQuotes: allowProductionChartAiBetaLiveQuotes === true },
  );
  if (!result.ok) return { ok: false as const, code: 'PROVIDER_UNAVAILABLE' };
  return {
    ok: true as const,
    data: { currentPrice: result.data.price, volume: typeof result.data.volume === 'number' ? result.data.volume : undefined },
  };
};

const blockedSummaryResponse = (sanitizedErrorCode: string) => ({
  ok: false,
  symbol: null,
  market: null,
  llmStatus: 'unavailable',
  summaryText: null,
  sanitizedErrorCode,
  modelPresent: false,
  sourceStatus: 'blocked',
  currentPricePresent: false,
  volumePresent: false,
  warnings: [sanitizedErrorCode],
});

export const GET: APIRoute = async ({ url, request }) => {
  // Path 1 (unchanged): localhost owner flow -- requires a local hostname AND ?ownerLocalKisLlm=1.
  const ownerLocalKisLlmOptIn = url.searchParams.get('ownerLocalKisLlm') === '1';
  const resolvedHostname = resolveLocalHostname(url, request);
  const localOwnerAllowed = ownerLocalKisLlmOptIn && Boolean(resolvedHostname);

  // Path 2 (Phase 3GG-L-BETA-ACTIVATE): protected Vercel Preview beta flow. Fail-closed guard --
  // grants access ONLY on a Vercel Preview deployment (VERCEL_ENV=preview, not production) with the
  // owner flag CHART_AI_ENABLE_PROTECTED_PREVIEW_BETA=true AND the explicit ?chartAiBetaPreview=1
  // opt-in. Production and every missing/unknown condition fail closed. Deployment Protection
  // (Vercel Authentication / Password Protection) is an additional owner-configured layer in front
  // of the whole deployment and is required before the Preview URL is shared.
  const betaPreviewOptIn = url.searchParams.get('chartAiBetaPreview') === '1';
  const betaAccess = evaluateProtectedPreviewBetaAccess({
    betaQueryOptIn: betaPreviewOptIn,
    env: {
      VERCEL_ENV: readServerEnvValue('VERCEL_ENV'),
      NODE_ENV: readServerEnvValue('NODE_ENV'),
      CHART_AI_ENABLE_PROTECTED_PREVIEW_BETA: readServerEnvValue('CHART_AI_ENABLE_PROTECTED_PREVIEW_BETA'),
    },
  });

  // Path 3 (Phase 3GG-M-PROD-BETA-DEPLOY): production Chart AI beta flow. Separate fail-closed guard
  // -- grants access ONLY on the actual Vercel Production deployment (VERCEL_ENV=production) with the
  // owner flag CHART_AI_ENABLE_PRODUCTION_CHART_AI_BETA=true AND the explicit ?chartAiProdBeta=1
  // opt-in. Any non-production runtime (including Preview) fails closed on this path.
  const prodBetaOptIn = url.searchParams.get('chartAiProdBeta') === '1';
  const prodBetaAccess = evaluateProductionChartAiBetaAccess({
    betaQueryOptIn: prodBetaOptIn,
    env: {
      VERCEL_ENV: readServerEnvValue('VERCEL_ENV'),
      CHART_AI_ENABLE_PRODUCTION_CHART_AI_BETA: readServerEnvValue('CHART_AI_ENABLE_PRODUCTION_CHART_AI_BETA'),
    },
  });

  if (!localOwnerAllowed && !betaAccess.allowed && !prodBetaAccess.allowed) {
    return jsonResponse({ ok: true, summary: blockedSummaryResponse(SANITIZED_ERROR_CODES.NON_LOCAL_REQUEST) });
  }

  // Phase 3GG-OP-FAST: the summary now follows the selected instrument. KR six-digit codes get the
  // real KIS current_price + LLM summary. US instruments are honestly reported as summary-unavailable
  // for now (the real US OHLCV chart is served separately) -- never faked, and never silently falling
  // back to the default KR symbol while a US instrument is selected.
  const countryParam = (url.searchParams.get('country') ?? '').trim().toUpperCase();
  if (countryParam === 'US') {
    return jsonResponse({ ok: true, summary: blockedSummaryResponse('US_SUMMARY_UNSUPPORTED') });
  }

  const symbolParam = (url.searchParams.get('symbol') ?? '').trim();
  if (symbolParam.length > 0 && !SYMBOL_PATTERN.test(symbolParam)) {
    return jsonResponse({ ok: true, summary: blockedSummaryResponse(SANITIZED_ERROR_CODES.INVALID_SYMBOL) });
  }
  const symbol = symbolParam.length > 0 ? symbolParam : DEFAULT_SYMBOL;

  // The market-data binding's local-only guard rejects non-local hostnames and deployed environments.
  // The localhost owner path passes its real hostname + real runtime env (so it still fails closed on
  // a deployed/production runtime). An authorized protected-preview-beta request has already been
  // verified above (Preview + owner flag + explicit opt-in + not-production), so the route vouches for
  // it as a local-equivalent request to the binding; downstream defense-in-depth remains in force
  // (endpoint allowlist is current_price-only, symbol validation, credential presence, rate limiting,
  // and kisClient's own Vercel-Preview readiness gate).
  const bindingHostname = localOwnerAllowed ? (resolvedHostname as string) : 'localhost';
  const bindingEnv = localOwnerAllowed
    ? { NODE_ENV: process.env.NODE_ENV, VERCEL_ENV: process.env.VERCEL_ENV, VERCEL: process.env.VERCEL }
    : {};

  // Phase 3GG-M-PROD-HF1: the scoped production KIS live-quote exception is enabled ONLY for an
  // authorized production beta request (prodBetaAccess.allowed). The localhost owner path and the
  // Preview beta path leave this false, so their behavior is unchanged (and on those runtimes
  // kisClient's production hard block does not apply anyway). kisClient independently re-verifies the
  // Production flag before honoring the signal, so this remains fail-closed and current_price-scoped.
  const allowProductionChartAiBetaLiveQuotes = prodBetaAccess.allowed === true;

  const sanitizedKis = await runLocalOnlyLiveKisMarketDataRequest(
    {
      hostname: bindingHostname,
      env: bindingEnv,
      symbol,
      category: 'current_price',
      nowMs: Date.now(),
      allowProductionChartAiBetaLiveQuotes,
    },
    { rateLimiter, cache, hasEnvValue, fetchQuote, now: () => Date.now(), timeoutMs: 8000 },
  );

  const kisContext = createChartAiKisMarketDataContext(sanitizedKis, { integrationMode: 'local-only' });

  const llmSummary = await runLocalOnlyLlmRuntimeBridge(
    {
      context: {
        symbol: kisContext.symbol,
        market: kisContext.market,
        currentPrice: kisContext.currentPrice,
        volume: kisContext.volume,
        timestamp: kisContext.timestamp,
        sourceStatus: kisContext.sourceStatus,
        cacheStatus: kisContext.cacheStatus,
        providerLabel: kisContext.providerLabel,
        integrationMode: kisContext.integrationMode,
      },
      env: {
        CHART_AI_ENABLE_LOCAL_LLM: readServerEnvValue('CHART_AI_ENABLE_LOCAL_LLM'),
        OPENAI_API_KEY: readServerEnvValue('OPENAI_API_KEY'),
        CHART_AI_LLM_MODEL: readServerEnvValue('CHART_AI_LLM_MODEL'),
        CHART_AI_LLM_MAIN_MODEL: readServerEnvValue('CHART_AI_LLM_MAIN_MODEL'),
        CHART_AI_LLM_FALLBACK_MODEL: readServerEnvValue('CHART_AI_LLM_FALLBACK_MODEL'),
        CHART_AI_LLM_TEST_MODEL: readServerEnvValue('CHART_AI_LLM_TEST_MODEL'),
        CHART_AI_LLM_MODERATION_MODEL: readServerEnvValue('CHART_AI_LLM_MODERATION_MODEL'),
        CHART_AI_LLM_EMBEDDING_MODEL: readServerEnvValue('CHART_AI_LLM_EMBEDDING_MODEL'),
      },
    },
    { timeoutMs: 12000 },
  );

  return jsonResponse({ ok: true, summary: llmSummary });
};

export const ALL: APIRoute = () =>
  jsonResponse({ ok: false, summary: blockedSummaryResponse(SANITIZED_ERROR_CODES.NON_LOCAL_REQUEST) }, 405);
