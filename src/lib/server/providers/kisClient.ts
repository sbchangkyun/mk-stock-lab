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

const provider = 'kis';
const moduleName = 'kisClient';
const requiredEnvNames = ['KIS_APP_KEY', 'KIS_APP_SECRET', 'KIS_BASE_URL'];
const optionalEnvNames = ['KIS_ACCOUNT_NO'];
const featureFlagEnvName = 'KIS_ENABLE_LIVE_QUOTES';
const previewGuardFlagEnvName = 'KIS_ENABLE_PREVIEW_LIVE_QUOTES';
const quotePath = '/uapi/domestic-stock/v1/quotations/inquire-price';
const tokenPath = '/oauth2/tokenP';
const domesticQuoteTrId = 'FHKST01010100';
const tokenCacheSkewMs = 60_000;

type KisQuoteConfigReadiness = ProviderConfigReadiness & {
  featureFlagEnvName: typeof featureFlagEnvName;
  productionAllowed: false;
};

type KisRuntimeConfig = {
  appKey: string;
  appSecret: string;
  baseUrl: string;
};

type KisAccessTokenCache = {
  accessToken: string;
  expiresAtMs: number;
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

let accessTokenCache: KisAccessTokenCache | null = null;

const normalizeString = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

type KisRuntimeClass =
  | 'local'
  | 'vercel-preview'
  | 'vercel-production'
  | 'vercel-development'
  | 'node-production'
  | 'unknown';

const classifyRuntime = (): KisRuntimeClass => {
  const vercelEnv = normalizeString(process.env.VERCEL_ENV).toLowerCase();
  const nodeEnv = normalizeString(process.env.NODE_ENV).toLowerCase();
  if (vercelEnv === 'production') return 'vercel-production';
  if (vercelEnv === 'preview') return 'vercel-preview';
  if (vercelEnv === 'development') return 'vercel-development';
  if (vercelEnv !== '') return 'unknown';
  if (nodeEnv === 'production') return 'node-production';
  return 'local';
};

const hasValue = (name: string) => normalizeString(process.env[name]).length > 0;

const getMissingEnvNames = () => requiredEnvNames.filter((name) => !hasValue(name));

const getRuntimeConfig = (): KisRuntimeConfig | null => {
  const appKey = normalizeString(process.env.KIS_APP_KEY);
  const appSecret = normalizeString(process.env.KIS_APP_SECRET);
  const baseUrl = normalizeString(process.env.KIS_BASE_URL).replace(/\/+$/, '');
  if (!appKey || !appSecret || !baseUrl) return null;
  return { appKey, appSecret, baseUrl };
};

export const getKisQuoteConfigReadiness = (): KisQuoteConfigReadiness => {
  assertServerRuntime(moduleName);
  const missingEnvNames = getMissingEnvNames();
  const flagEnabled = process.env[featureFlagEnvName] === 'true';
  const runtimeClass = classifyRuntime();

  const base = { provider, requiredEnvNames, missingEnvNames, optionalEnvNames, featureFlagEnvName, productionAllowed: false } as const;

  // Hard block: Vercel Production, non-Vercel NODE_ENV=production, unknown VERCEL_ENV value
  if (runtimeClass === 'vercel-production' || runtimeClass === 'node-production' || runtimeClass === 'unknown') {
    return { ...base, ready: false, reason: 'production_not_allowed' };
  }

  // KIS_ACCOUNT_NO must be absent for quote-only scope
  if (hasValue('KIS_ACCOUNT_NO')) {
    return { ...base, ready: false, reason: 'production_not_allowed' };
  }

  // Vercel Preview requires explicit Preview opt-in guard
  if (runtimeClass === 'vercel-preview' && process.env[previewGuardFlagEnvName] !== 'true') {
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

const parseTokenExpiry = (payload: KisTokenResponse): number => {
  const officialExpiry = normalizeString(payload.access_token_token_expired);
  const parsedOfficialExpiry = officialExpiry ? Date.parse(officialExpiry.replace(' ', 'T')) : NaN;
  if (Number.isFinite(parsedOfficialExpiry)) return parsedOfficialExpiry;

  const expiresIn = parseNumericText(payload.expires_in);
  if (expiresIn && expiresIn > 0) return Date.now() + expiresIn * 1000;

  return Date.now() + 23 * 60 * 60 * 1000;
};

const getKisAccessToken = async (config: KisRuntimeConfig): Promise<ProviderResult<{ accessToken: string }>> => {
  const now = Date.now();
  if (accessTokenCache && accessTokenCache.expiresAtMs - tokenCacheSkewMs > now) {
    return { ok: true, data: { accessToken: accessTokenCache.accessToken }, staleState: 'fresh' };
  }

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
    });

    if (response.status === 429) {
      return createProviderError('PROVIDER_RATE_LIMITED', 'KIS token request was rate limited.', {
        provider,
        staleState: 'unavailable',
      });
    }

    if (!response.ok) {
      accessTokenCache = null;
      return createProviderError('PROVIDER_UNAVAILABLE', 'KIS token request failed safely.', {
        provider,
        staleState: 'unavailable',
      });
    }

    const payload = (await response.json()) as KisTokenResponse;
    const accessToken = normalizeString(payload.access_token);
    if (!accessToken) {
      accessTokenCache = null;
      return createProviderError('PROVIDER_UNAVAILABLE', 'KIS token response was not usable.', {
        provider,
        staleState: 'unavailable',
      });
    }

    accessTokenCache = {
      accessToken,
      expiresAtMs: parseTokenExpiry(payload),
    };

    return { ok: true, data: { accessToken }, staleState: 'fresh' };
  } catch (error) {
    accessTokenCache = null;
    return sanitizeUnknownError(error, provider);
  }
};

const normalizeKrSymbol = (symbol: string) => symbol.trim();

const isValidKrQuoteSymbol = (symbol: string) => /^\d{6}$/.test(symbol);

export const validateKisDomesticQuoteInput = (input: SecurityIdentity): ProviderErrorEnvelope | null => {
  if (input.market !== 'KR') {
    return createProviderError('SYMBOL_UNSUPPORTED', 'Only KR domestic stock quotes are supported in this phase.', {
      provider,
      staleState: 'unavailable',
    });
  }

  if (!isValidKrQuoteSymbol(normalizeKrSymbol(input.symbol))) {
    return createProviderError('VALIDATION_FAILED', 'KR quote symbol must be exactly six digits.', {
      provider,
      staleState: 'unavailable',
    });
  }

  return null;
};

export const getKisDomesticQuoteSnapshot = async (input: SecurityIdentity): Promise<ProviderResult<QuoteSnapshot>> => {
  assertServerRuntime(moduleName);

  const inputError = validateKisDomesticQuoteInput(input);
  if (inputError) return inputError;

  const readiness = getKisQuoteConfigReadiness();
  if (!readiness.ready) return readinessToError(readiness);

  const config = getRuntimeConfig();
  if (!config) return readinessToError(readiness);

  const tokenResult = await getKisAccessToken(config);
  if (!tokenResult.ok) return tokenResult;

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
        authorization: `Bearer ${tokenResult.data.accessToken}`,
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
};

export const getKisQuoteSnapshot = async (input: SecurityIdentity): Promise<ProviderResult<QuoteSnapshot>> =>
  getKisDomesticQuoteSnapshot(input);

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
