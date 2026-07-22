import { randomUUID } from 'node:crypto';
import { createProviderError, sanitizeUnknownError } from './providerErrors';
import { assertServerRuntime } from './serverOnly';
import type {
  ChartSeries,
  ProviderConfigReadiness,
  ProviderErrorEnvelope,
  ProviderResult,
  QuoteSnapshot,
  SecurityIdentity,
} from './types';
// Phase 3GG-T-HF2: durable, shared KIS token lifecycle (L1 -> L2 durable store -> distributed lease).
import { resolveKisDurableTokenConfig, getEncryptionKey } from './kis/kisTokenConfig';
import { createSupabaseKisTokenDb } from './kis/kisTokenStore';
import { createKisTokenTelemetry } from './kis/kisTokenTelemetry';
import { createKisTokenManager } from './kis/kisTokenManager';
import { executeKisRequestWithToken, type KisExecutorDeps } from './kis/kisRequestExecutor';
import type { TokenIssuerResult } from './kis/kisTokenTypes';

const provider = 'kis';
const moduleName = 'kisClient';
const requiredEnvNames = ['KIS_APP_KEY', 'KIS_APP_SECRET', 'KIS_BASE_URL'];
const optionalEnvNames = ['KIS_ACCOUNT_NO'];
const featureFlagEnvName = 'KIS_ENABLE_LIVE_QUOTES';
const previewGuardFlagEnvName = 'KIS_ENABLE_PREVIEW_LIVE_QUOTES';
// Phase 3GG-M-PROD-HF1: the non-secret Production flag that -- together with an explicit
// per-call scoped signal from the Chart AI production beta summary route -- narrowly lifts
// the Vercel Production hard block below for the current_price quote scope ONLY. Its mere
// presence never opens generic production KIS usage: the scoped call option must also be set.
const productionChartAiBetaFlagEnvName = 'CHART_AI_ENABLE_PRODUCTION_CHART_AI_BETA';
const quotePath = '/uapi/domestic-stock/v1/quotations/inquire-price';
const dailyOhlcPath = '/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice';
const tokenPath = '/oauth2/tokenP';
const domesticQuoteTrId = 'FHKST01010100';
const domesticDailyOhlcTrId = 'FHKST03010100';
// Phase 3GG-OP-FAST: KIS overseas (US) read-only market-data endpoints. Historical OHLCV +
// current price only -- no account/order/balance endpoint is referenced here. These sit behind
// the same fail-closed readiness gate as the domestic quote/OHLC transports (quote scope,
// KIS_ACCOUNT_NO must be absent) and forward the same narrowly-scoped production Chart AI beta
// exception. US market data additionally requires the KIS account to hold overseas data
// permission; when it does not, the provider fails closed with a sanitized PROVIDER_UNAVAILABLE.
const overseasDailyOhlcPath = '/uapi/overseas-price/v1/quotations/dailyprice';
const overseasDailyOhlcTrId = 'HHDFS76240000';
const overseasQuotePath = '/uapi/overseas-price/v1/quotations/price';
const overseasQuoteTrId = 'HHDFS00000300';

type KisQuoteConfigReadiness = ProviderConfigReadiness & {
  featureFlagEnvName: typeof featureFlagEnvName;
  productionAllowed: false;
};

type KisRuntimeConfig = {
  appKey: string;
  appSecret: string;
  baseUrl: string;
};

type KisTokenResponse = {
  access_token?: unknown;
  access_token_token_expired?: unknown;
  expires_in?: unknown;
};

type KisQuoteOutput = {
  stck_prpr?: unknown;
  prdy_vrss?: unknown;
  prdy_ctrt?: unknown;
  acml_vol?: unknown;
};

type KisQuoteResponse = {
  rt_cd?: unknown;
  output?: KisQuoteOutput;
};

type KisDailyOhlcOutputRow = {
  stck_bsop_date?: unknown;
  stck_oprc?: unknown;
  stck_hgpr?: unknown;
  stck_lwpr?: unknown;
  stck_clpr?: unknown;
  acml_vol?: unknown;
};

type KisDailyOhlcResponse = {
  rt_cd?: unknown;
  output2?: KisDailyOhlcOutputRow[];
};

export type KisDailyOhlcPoint = {
  dateTime: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
};


const normalizeString = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

type ImportMetaWithEnv = ImportMeta & {
  env?: Record<string, string | undefined>;
};

const getImportMetaEnv = (): Record<string, string | undefined> =>
  (import.meta as ImportMetaWithEnv).env ?? {};

// Reads an env value from the Astro/Vite runtime source (import.meta.env, where `.env`
// file values are exposed during `astro dev`/SSR) first, then falls back to process.env
// (where an owner-run Node harness or OS-level exported vars supply them). Mirrors the
// dual-source resolver already established in supabaseAdmin.ts. This exists because
// `.env`-only values such as KIS_ENABLE_LIVE_QUOTES are NOT visible through process.env
// inside the Astro dev/SSR runtime. Only the source of each value changes here -- every
// readiness/guard decision and its fail-closed behavior below is unchanged.
const readEnvValue = (name: string): string | undefined => {
  const fromImportMeta = getImportMetaEnv()[name];
  if (typeof fromImportMeta === 'string' && fromImportMeta.trim().length > 0) {
    return fromImportMeta;
  }
  return process.env[name];
};

type KisRuntimeClass =
  | 'local'
  | 'vercel-preview'
  | 'vercel-production'
  | 'vercel-development'
  | 'node-production'
  | 'unknown';

const classifyRuntime = (): KisRuntimeClass => {
  const vercelEnv = normalizeString(readEnvValue('VERCEL_ENV')).toLowerCase();
  const nodeEnv = normalizeString(readEnvValue('NODE_ENV')).toLowerCase();
  if (vercelEnv === 'production') return 'vercel-production';
  if (vercelEnv === 'preview') return 'vercel-preview';
  if (vercelEnv === 'development') return 'vercel-development';
  if (vercelEnv !== '') return 'unknown';
  if (nodeEnv === 'production') return 'node-production';
  return 'local';
};

const hasValue = (name: string) => normalizeString(readEnvValue(name)).length > 0;

const getMissingEnvNames = () => requiredEnvNames.filter((name) => !hasValue(name));

const getRuntimeConfig = (): KisRuntimeConfig | null => {
  const appKey = normalizeString(readEnvValue('KIS_APP_KEY'));
  const appSecret = normalizeString(readEnvValue('KIS_APP_SECRET'));
  const baseUrl = normalizeString(readEnvValue('KIS_BASE_URL')).replace(/\/+$/, '');
  if (!appKey || !appSecret || !baseUrl) return null;
  return { appKey, appSecret, baseUrl };
};

export const getKisQuoteConfigReadiness = (
  options: { allowProductionChartAiBetaLiveQuotes?: boolean } = {},
): KisQuoteConfigReadiness => {
  assertServerRuntime(moduleName);
  const missingEnvNames = getMissingEnvNames();
  const flagEnabled = readEnvValue(featureFlagEnvName) === 'true';
  const runtimeClass = classifyRuntime();

  const base = { provider, requiredEnvNames, missingEnvNames, optionalEnvNames, featureFlagEnvName, productionAllowed: false } as const;

  // Phase 3GG-M-PROD-HF1: narrowly-scoped Vercel Production exception for the Chart AI production
  // beta summary flow ONLY. All three must hold: the runtime really is Vercel Production, the caller
  // passed the explicit per-call scoped signal (set by the H route only after its own production
  // beta guard -- VERCEL_ENV=production + CHART_AI_ENABLE_PRODUCTION_CHART_AI_BETA=true +
  // ?chartAiProdBeta=1 -- has already passed), AND the non-secret Production flag is enabled. Absent
  // any one of these, production stays fully fail-closed. This lifts ONLY the runtime hard block; the
  // KIS_ACCOUNT_NO-absent, KIS_ENABLE_LIVE_QUOTES=true, and credential-present checks below still run,
  // and the scope remains current_price (the only endpoint this readiness gate serves).
  const productionChartAiBetaExceptionAllowed =
    runtimeClass === 'vercel-production' &&
    options.allowProductionChartAiBetaLiveQuotes === true &&
    readEnvValue(productionChartAiBetaFlagEnvName) === 'true';

  // Hard block: Vercel Production (unless the scoped Chart AI beta exception applies),
  // non-Vercel NODE_ENV=production, unknown VERCEL_ENV value
  if (
    (runtimeClass === 'vercel-production' && !productionChartAiBetaExceptionAllowed) ||
    runtimeClass === 'node-production' ||
    runtimeClass === 'unknown'
  ) {
    return { ...base, ready: false, reason: 'production_not_allowed' };
  }

  // KIS_ACCOUNT_NO must be absent for quote-only scope
  if (hasValue('KIS_ACCOUNT_NO')) {
    return { ...base, ready: false, reason: 'production_not_allowed' };
  }

  // Vercel Preview requires explicit Preview opt-in guard
  if (runtimeClass === 'vercel-preview' && readEnvValue(previewGuardFlagEnvName) !== 'true') {
    return { ...base, ready: false, reason: 'preview_guard_required' };
  }

  // Local / vercel-development / vercel-preview-with-guard: existing readiness checks
  if (!flagEnabled) {
    return { ...base, ready: false, reason: 'disabled' };
  }

  if (missingEnvNames.length > 0) {
    return { ...base, ready: false, reason: 'config_missing' };
  }

  return { ...base, ready: true, reason: 'ready', missingEnvNames: [] };
};

export const getKisAccessTokenReadiness = (): ProviderConfigReadiness => getKisQuoteConfigReadiness();

const readinessToError = (readiness: KisQuoteConfigReadiness): ProviderErrorEnvelope => {
  if (readiness.reason === 'production_not_allowed') {
    return createProviderError('CONFIG_MISSING', 'KIS live quotes are disabled in this runtime.', {
      provider,
      staleState: 'unavailable',
    });
  }

  if (readiness.reason === 'preview_guard_required') {
    return createProviderError('CONFIG_MISSING', 'KIS live quotes require an explicit Preview guard in this runtime.', {
      provider,
      staleState: 'unavailable',
    });
  }

  if (readiness.reason === 'disabled') {
    return createProviderError('CONFIG_MISSING', 'KIS live quotes are disabled.', {
      provider,
      staleState: 'unavailable',
    });
  }

  return createProviderError('CONFIG_MISSING', 'KIS quote provider is not configured for local live reads.', {
    provider,
    staleState: 'unavailable',
  });
};

const parseNumericText = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const numeric = Number(value.replaceAll(',', '').trim());
  return Number.isFinite(numeric) ? numeric : null;
};

const KIS_TOKEN_ENDPOINT_TIMEOUT_MS = 8000;

// Phase 3GG-T-HF2: the SINGLE authoritative /oauth2/tokenP issuance. It performs no caching — the durable
// token manager (kisTokenManager) owns L1 memory, the L2 durable store, and the distributed lease. Returns
// a timezone-safe issuer result (issuedAtMs + expires_in seconds + the optional KST absolute string); the
// manager computes the real expiry from expires_in (never feeds a tz-less KST string to Date.parse).
const issueKisTokenFromEndpoint = async (config: KisRuntimeConfig | null): Promise<TokenIssuerResult> => {
  if (!config) return { ok: false, code: 'PROVIDER_UNAVAILABLE' };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), KIS_TOKEN_ENDPOINT_TIMEOUT_MS);
  try {
    const response = await fetch(`${config.baseUrl}${tokenPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/plain',
        charset: 'UTF-8',
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        appkey: config.appKey,
        appsecret: config.appSecret,
      }),
      signal: controller.signal,
    });
    if (response.status === 429) return { ok: false, code: 'PROVIDER_RATE_LIMITED' };
    if (!response.ok) return { ok: false, code: 'PROVIDER_UNAVAILABLE' };
    const payload = (await response.json()) as KisTokenResponse;
    const accessToken = normalizeString(payload.access_token);
    if (!accessToken) return { ok: false, code: 'PROVIDER_UNAVAILABLE' };
    const issuedAtMs = Date.now();
    const expiresInRaw = parseNumericText(payload.expires_in);
    const expiresInSeconds = expiresInRaw && expiresInRaw > 0 ? Math.floor(expiresInRaw) : 23 * 60 * 60;
    const absoluteExpiryKst = normalizeString(payload.access_token_token_expired) || null;
    return { ok: true, accessToken, issuedAtMs, expiresInSeconds, absoluteExpiryKst };
  } catch {
    return { ok: false, code: 'PROVIDER_UNAVAILABLE' };
  } finally {
    clearTimeout(timeout);
  }
};

// Per-instance, non-secret identifiers for the durable lease owner + telemetry.
const kisInstanceId = randomUUID();
const kisDeploymentId =
  (typeof process.env.VERCEL_DEPLOYMENT_ID === 'string' && process.env.VERCEL_DEPLOYMENT_ID) ||
  (typeof process.env.VERCEL_GIT_COMMIT_SHA === 'string' && process.env.VERCEL_GIT_COMMIT_SHA) ||
  null;

// Lazy singleton: exactly one authoritative token manager per warm instance. When durable mode is OFF the
// manager preserves the previous L1-only behavior (process cache + single-flight); when ON it uses the
// durable L2 store + distributed lease so all instances share one token.
let kisTokenRuntime: { executorDeps: KisExecutorDeps } | null = null;
const getKisTokenRuntime = () => {
  if (kisTokenRuntime) return kisTokenRuntime;
  const durableConfig = resolveKisDurableTokenConfig();
  const db = createSupabaseKisTokenDb();
  const telemetry = createKisTokenTelemetry({
    db,
    enabled: durableConfig.telemetryEnabled,
    scopeKey: durableConfig.scopeKey,
    deploymentId: kisDeploymentId,
    instanceId: kisInstanceId,
  });
  const manager = createKisTokenManager({
    config: durableConfig,
    encryptionKey: durableConfig.durableReady ? getEncryptionKey() : null,
    db,
    telemetry,
    issueToken: () => issueKisTokenFromEndpoint(getRuntimeConfig()),
    now: () => Date.now(),
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    newGenerationId: () => randomUUID(),
    leaseOwnerId: kisInstanceId,
    instanceId: kisInstanceId,
    deploymentId: kisDeploymentId,
  });
  kisTokenRuntime = { executorDeps: { manager, config: durableConfig, telemetry } };
  return kisTokenRuntime;
};

const getKisExecutorDeps = (): KisExecutorDeps => getKisTokenRuntime().executorDeps;

// Phase 3GG-T-HF3B-HF2: KR codes may be alphanumeric six-character KRX short codes (e.g. 0000D0),
// normalized to ASCII uppercase. The KIS domestic OHLC/quote FID_INPUT_ISCD accepts the 6-char code.
const normalizeKrSymbol = (symbol: string) => symbol.trim().toUpperCase();

const isValidKrQuoteSymbol = (symbol: string) => /^[0-9A-Z]{6}$/.test(symbol);

export const validateKisDomesticQuoteInput = (input: SecurityIdentity): ProviderErrorEnvelope | null => {
  if (input.market !== 'KR') {
    return createProviderError('SYMBOL_UNSUPPORTED', 'Only KR domestic stock quotes are supported in this phase.', {
      provider,
      staleState: 'unavailable',
    });
  }

  if (!isValidKrQuoteSymbol(normalizeKrSymbol(input.symbol))) {
    return createProviderError('VALIDATION_FAILED', 'KR quote symbol must be a six-character KRX code.', {
      provider,
      staleState: 'unavailable',
    });
  }

  return null;
};

export const getKisDomesticQuoteSnapshot = async (
  input: SecurityIdentity,
  options: { allowProductionChartAiBetaLiveQuotes?: boolean } = {},
): Promise<ProviderResult<QuoteSnapshot>> => {
  assertServerRuntime(moduleName);

  const inputError = validateKisDomesticQuoteInput(input);
  if (inputError) return inputError;

  // Only the scoped current_price quote snapshot forwards the production Chart AI beta exception.
  // The generic getKisQuoteSnapshot wrapper and the OHLC series path call getKisQuoteConfigReadiness()
  // with no options, so they remain fully fail-closed on production.
  const readiness = getKisQuoteConfigReadiness({
    allowProductionChartAiBetaLiveQuotes: options.allowProductionChartAiBetaLiveQuotes === true,
  });
  if (!readiness.ready) return readinessToError(readiness);

  const config = getRuntimeConfig();
  if (!config) return readinessToError(readiness);

  return executeKisRequestWithToken(getKisExecutorDeps(), { routeCategory: 'domestic_quote' }, async (handle) => {
  const symbol = normalizeKrSymbol(input.symbol);
  const params = new URLSearchParams({
    FID_COND_MRKT_DIV_CODE: 'J',
    FID_INPUT_ISCD: symbol,
  });

  try {
    const response = await fetch(`${config.baseUrl}${quotePath}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/plain',
        charset: 'UTF-8',
        authorization: `Bearer ${handle.accessToken}`,
        appkey: config.appKey,
        appsecret: config.appSecret,
        tr_id: domesticQuoteTrId,
        custtype: 'P',
        tr_cont: '',
      },
    });

    if (response.status === 429) {
      return createProviderError('PROVIDER_RATE_LIMITED', 'KIS quote request was rate limited.', {
        provider,
        staleState: 'unavailable',
      });
    }

    if (!response.ok) {
      return createProviderError('PROVIDER_UNAVAILABLE', 'KIS quote request failed safely.', {
        provider,
        staleState: 'unavailable',
      });
    }

    const payload = (await response.json()) as KisQuoteResponse;
    if (payload.rt_cd !== '0' || !payload.output) {
      return createProviderError('PROVIDER_UNAVAILABLE', 'KIS quote provider rejected the request.', {
        provider,
        staleState: 'unavailable',
      });
    }

    const price = parseNumericText(payload.output.stck_prpr);
    if (price === null) {
      return createProviderError('PROVIDER_UNAVAILABLE', 'KIS quote response did not include a usable price.', {
        provider,
        staleState: 'unavailable',
      });
    }

    const quote: QuoteSnapshot = {
      market: 'KR',
      symbol,
      price,
      currency: 'KRW',
      change: parseNumericText(payload.output.prdy_vrss),
      changePct: parseNumericText(payload.output.prdy_ctrt),
      volume: parseNumericText(payload.output.acml_vol) ?? undefined,
      marketState: 'unknown',
      asOf: new Date().toISOString(),
      staleState: 'fresh',
      providerMeta: {
        provider,
        source: 'kis-domestic-quote',
      },
    };

    return { ok: true, data: quote, staleState: 'fresh' };
  } catch (error) {
    return sanitizeUnknownError(error, provider);
  }
  });
};

export const getKisQuoteSnapshot = async (input: SecurityIdentity): Promise<ProviderResult<QuoteSnapshot>> =>
  getKisDomesticQuoteSnapshot(input);

/**
 * Narrow KIS domestic daily/weekly/monthly/yearly OHLC transport (Phase 3ES). The caller
 * (kisOhlcRequest.ts / kisOwnerLocalOhlcClient.ts) builds the FID_* query; this function only
 * performs the request, sanitizes the response into minimal OHLC points, and never exposes any
 * other raw KIS field. Reuses the same token/readiness/error-mapping conventions as the quote
 * transport above; does not call account/trading APIs and never reads KIS_ACCOUNT_NO.
 */
export const getKisDomesticDailyOhlcSeries = async (
  input: {
    symbol: string;
    query: Record<string, string>;
  },
  options: { allowProductionChartAiBetaLiveQuotes?: boolean } = {},
): Promise<ProviderResult<{ symbol: string; points: KisDailyOhlcPoint[] }>> => {
  assertServerRuntime(moduleName);

  const symbol = normalizeKrSymbol(input.symbol);
  if (!isValidKrQuoteSymbol(symbol)) {
    return createProviderError('VALIDATION_FAILED', 'KR OHLC symbol must be exactly six digits.', {
      provider,
      staleState: 'unavailable',
    });
  }

  // Phase 3GG-OP-FAST: forward the same scoped production Chart AI beta signal the current_price
  // path uses (Phase 3GG-M-PROD-HF1). historical OHLCV is an explicitly in-scope read; the scope
  // stays quote-level (no KIS_ACCOUNT_NO, no order/account endpoint). kisClient re-verifies the
  // Production flag before lifting its hard block, so this remains fail-closed.
  const readiness = getKisQuoteConfigReadiness({
    allowProductionChartAiBetaLiveQuotes: options.allowProductionChartAiBetaLiveQuotes === true,
  });
  if (!readiness.ready) return readinessToError(readiness);

  const config = getRuntimeConfig();
  if (!config) return readinessToError(readiness);

  return executeKisRequestWithToken(getKisExecutorDeps(), { routeCategory: 'domestic_ohlcv' }, async (handle) => {
  const params = new URLSearchParams(input.query);

  try {
    const response = await fetch(`${config.baseUrl}${dailyOhlcPath}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/plain',
        charset: 'UTF-8',
        authorization: `Bearer ${handle.accessToken}`,
        appkey: config.appKey,
        appsecret: config.appSecret,
        tr_id: domesticDailyOhlcTrId,
        custtype: 'P',
        tr_cont: '',
      },
    });

    if (response.status === 429) {
      return createProviderError('PROVIDER_RATE_LIMITED', 'KIS OHLC request was rate limited.', {
        provider,
        staleState: 'unavailable',
      });
    }

    if (!response.ok) {
      return createProviderError('PROVIDER_UNAVAILABLE', 'KIS OHLC request failed safely.', {
        provider,
        staleState: 'unavailable',
      });
    }

    const payload = (await response.json()) as KisDailyOhlcResponse;
    if (payload.rt_cd !== '0' || !Array.isArray(payload.output2)) {
      return createProviderError('PROVIDER_UNAVAILABLE', 'KIS OHLC provider rejected the request.', {
        provider,
        staleState: 'unavailable',
      });
    }

    const points: KisDailyOhlcPoint[] = payload.output2
      .map((row) => ({
        dateTime: normalizeString(row.stck_bsop_date),
        open: parseNumericText(row.stck_oprc),
        high: parseNumericText(row.stck_hgpr),
        low: parseNumericText(row.stck_lwpr),
        close: parseNumericText(row.stck_clpr),
        volume: parseNumericText(row.acml_vol),
      }))
      .filter((point) => point.dateTime.length > 0);

    return { ok: true, data: { symbol, points }, staleState: 'fresh' };
  } catch (error) {
    return sanitizeUnknownError(error, provider);
  }
  });
};

type KisOverseasDailyRow = {
  xymd?: unknown;
  open?: unknown;
  high?: unknown;
  low?: unknown;
  clos?: unknown;
  tvol?: unknown;
};

type KisOverseasDailyResponse = {
  rt_cd?: unknown;
  output2?: KisOverseasDailyRow[];
};

type KisOverseasQuoteResponse = {
  rt_cd?: unknown;
  output?: { last?: unknown; tvol?: unknown };
};

const US_SYMBOL_PATTERN = /^[A-Z][A-Z0-9.\-]{0,9}$/;
const US_EXCHANGE_CODES = ['NAS', 'NYS', 'AMS'];

const normalizeUsSymbol = (symbol: string) => symbol.trim().toUpperCase();
const isValidUsSymbol = (symbol: string) => US_SYMBOL_PATTERN.test(normalizeUsSymbol(symbol));
const isValidUsExchangeCode = (code: string) => US_EXCHANGE_CODES.includes(code);

/**
 * Narrow KIS overseas (US) daily OHLCV transport (Phase 3GG-OP-FAST). Read-only historical chart
 * data via the overseas dailyprice endpoint; never calls an account/order/balance API and never
 * reads KIS_ACCOUNT_NO. Reuses the same token/readiness/error-mapping conventions and forwards the
 * scoped production Chart AI beta exception. Requires the KIS account to hold overseas data
 * permission; when it does not, the request fails closed with a sanitized error.
 */
export const getKisOverseasDailyOhlcSeries = async (
  input: { symbol: string; exchangeCode: string; bymd?: string },
  options: { allowProductionChartAiBetaLiveQuotes?: boolean } = {},
): Promise<ProviderResult<{ symbol: string; points: KisDailyOhlcPoint[] }>> => {
  assertServerRuntime(moduleName);

  const symbol = normalizeUsSymbol(input.symbol);
  const exchangeCode = (input.exchangeCode ?? '').trim().toUpperCase();
  // Phase 3GG-Q-FAST: optional BYMD (base date, YYYYMMDD) lets the long-history pager walk backward
  // one ~100-row page at a time. Empty = most recent page. Still read-only market data.
  const bymd = /^\d{8}$/.test((input.bymd ?? '').trim()) ? (input.bymd ?? '').trim() : '';
  if (!isValidUsSymbol(symbol) || !isValidUsExchangeCode(exchangeCode)) {
    return createProviderError('VALIDATION_FAILED', 'US OHLC request requires a valid ticker and exchange code.', {
      provider,
      staleState: 'unavailable',
    });
  }

  const readiness = getKisQuoteConfigReadiness({
    allowProductionChartAiBetaLiveQuotes: options.allowProductionChartAiBetaLiveQuotes === true,
  });
  if (!readiness.ready) return readinessToError(readiness);

  const config = getRuntimeConfig();
  if (!config) return readinessToError(readiness);

  return executeKisRequestWithToken(getKisExecutorDeps(), { routeCategory: 'overseas_ohlcv' }, async (handle) => {
  const params = new URLSearchParams({
    AUTH: '',
    EXCD: exchangeCode,
    SYMB: symbol,
    GUBN: '0',
    BYMD: bymd,
    MODP: '1',
  });

  try {
    const response = await fetch(`${config.baseUrl}${overseasDailyOhlcPath}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/plain',
        charset: 'UTF-8',
        authorization: `Bearer ${handle.accessToken}`,
        appkey: config.appKey,
        appsecret: config.appSecret,
        tr_id: overseasDailyOhlcTrId,
        custtype: 'P',
        tr_cont: '',
      },
    });

    if (response.status === 429) {
      return createProviderError('PROVIDER_RATE_LIMITED', 'KIS overseas OHLC request was rate limited.', {
        provider,
        staleState: 'unavailable',
      });
    }

    if (!response.ok) {
      return createProviderError('PROVIDER_UNAVAILABLE', 'KIS overseas OHLC request failed safely.', {
        provider,
        staleState: 'unavailable',
      });
    }

    const payload = (await response.json()) as KisOverseasDailyResponse;
    if (payload.rt_cd !== '0' || !Array.isArray(payload.output2)) {
      return createProviderError('PROVIDER_UNAVAILABLE', 'KIS overseas OHLC provider rejected the request.', {
        provider,
        staleState: 'unavailable',
      });
    }

    const points: KisDailyOhlcPoint[] = payload.output2
      .map((row) => ({
        dateTime: normalizeString(row.xymd),
        open: parseNumericText(row.open),
        high: parseNumericText(row.high),
        low: parseNumericText(row.low),
        close: parseNumericText(row.clos),
        volume: parseNumericText(row.tvol),
      }))
      .filter((point) => point.dateTime.length > 0);

    return { ok: true, data: { symbol, points }, staleState: 'fresh' };
  } catch (error) {
    return sanitizeUnknownError(error, provider);
  }
  });
};

/**
 * Narrow KIS overseas (US) current-price snapshot (Phase 3GG-OP-FAST). Used so the LLM summary can
 * follow a selected US instrument with real data; never fabricates a US price. Read-only quote
 * scope, same guards as above.
 */
export const getKisOverseasQuoteSnapshot = async (
  input: { symbol: string; exchangeCode: string },
  options: { allowProductionChartAiBetaLiveQuotes?: boolean } = {},
): Promise<ProviderResult<QuoteSnapshot>> => {
  assertServerRuntime(moduleName);

  const symbol = normalizeUsSymbol(input.symbol);
  const exchangeCode = (input.exchangeCode ?? '').trim().toUpperCase();
  if (!isValidUsSymbol(symbol) || !isValidUsExchangeCode(exchangeCode)) {
    return createProviderError('VALIDATION_FAILED', 'US quote request requires a valid ticker and exchange code.', {
      provider,
      staleState: 'unavailable',
    });
  }

  const readiness = getKisQuoteConfigReadiness({
    allowProductionChartAiBetaLiveQuotes: options.allowProductionChartAiBetaLiveQuotes === true,
  });
  if (!readiness.ready) return readinessToError(readiness);

  const config = getRuntimeConfig();
  if (!config) return readinessToError(readiness);

  return executeKisRequestWithToken(getKisExecutorDeps(), { routeCategory: 'overseas_quote' }, async (handle) => {
  const params = new URLSearchParams({ AUTH: '', EXCD: exchangeCode, SYMB: symbol });

  try {
    const response = await fetch(`${config.baseUrl}${overseasQuotePath}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/plain',
        charset: 'UTF-8',
        authorization: `Bearer ${handle.accessToken}`,
        appkey: config.appKey,
        appsecret: config.appSecret,
        tr_id: overseasQuoteTrId,
        custtype: 'P',
        tr_cont: '',
      },
    });

    if (response.status === 429) {
      return createProviderError('PROVIDER_RATE_LIMITED', 'KIS overseas quote request was rate limited.', {
        provider,
        staleState: 'unavailable',
      });
    }

    if (!response.ok) {
      return createProviderError('PROVIDER_UNAVAILABLE', 'KIS overseas quote request failed safely.', {
        provider,
        staleState: 'unavailable',
      });
    }

    const payload = (await response.json()) as KisOverseasQuoteResponse;
    if (payload.rt_cd !== '0' || !payload.output) {
      return createProviderError('PROVIDER_UNAVAILABLE', 'KIS overseas quote provider rejected the request.', {
        provider,
        staleState: 'unavailable',
      });
    }

    const price = parseNumericText(payload.output.last);
    if (price === null) {
      return createProviderError('PROVIDER_UNAVAILABLE', 'KIS overseas quote response did not include a usable price.', {
        provider,
        staleState: 'unavailable',
      });
    }

    const quote: QuoteSnapshot = {
      market: 'US',
      symbol,
      price,
      currency: 'USD',
      change: null,
      changePct: null,
      volume: parseNumericText(payload.output.tvol) ?? undefined,
      marketState: 'unknown',
      asOf: new Date().toISOString(),
      staleState: 'fresh',
      providerMeta: { provider, source: 'kis-overseas-quote' },
    };

    return { ok: true, data: quote, staleState: 'fresh' };
  } catch (error) {
    return sanitizeUnknownError(error, provider);
  }
  });
};

export const getKisChartSeries = async (
  input: SecurityIdentity & { interval: '1d' | '1w' | '1m' },
): Promise<ProviderResult<ChartSeries>> => {
  assertServerRuntime(moduleName);
  if (!input.symbol || !input.market || !input.interval) {
    return createProviderError('VALIDATION_FAILED', 'Chart identity is invalid.', { provider });
  }

  return createProviderError('NOT_IMPLEMENTED', 'KIS chart integration requires a separate approval-gated phase.', {
    provider,
    staleState: 'unavailable',
  });
};
