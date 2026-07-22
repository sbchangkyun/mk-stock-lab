import { assertServerRuntime } from './serverOnly';
import type {
  FxErrorCode,
  FxRateRequest,
  FxRateResult,
  FxRateSnapshot,
  FxRateSource,
  FxStaleState,
  SupportedFxCurrency,
  UsableFxRateSnapshot,
} from './fxTypes';

const moduleName = 'providers/fxAdapter';
const supportedCurrencies: ReadonlySet<string> = new Set(['KRW', 'USD']);
const safeProviderCodePattern = /^[a-z0-9][a-z0-9-]{0,39}$/;

const normalizeProviderCode = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toLowerCase();
  return safeProviderCodePattern.test(normalized) ? normalized : undefined;
};

const normalizeFxTimestamp = (value: unknown): string | null => {
  if (typeof value !== 'string' || !value.trim()) return null;
  const timestampMs = Date.parse(value);
  return Number.isFinite(timestampMs) ? new Date(timestampMs).toISOString() : null;
};

export const normalizeFxCurrency = (value: unknown): SupportedFxCurrency | null => {
  assertServerRuntime(moduleName);
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  return supportedCurrencies.has(normalized) ? (normalized as SupportedFxCurrency) : null;
};

export const buildUnavailableFxSnapshot = (
  request: FxRateRequest,
  errorCode: FxErrorCode,
  providerCode?: string,
): FxRateSnapshot => {
  assertServerRuntime(moduleName);
  const safeProviderCode = normalizeProviderCode(providerCode);
  return {
    baseCurrency: request.baseCurrency,
    quoteCurrency: request.quoteCurrency,
    rate: null,
    asOf: null,
    source: 'unavailable',
    staleState: 'unavailable',
    ...(safeProviderCode ? { providerCode: safeProviderCode } : {}),
    errorCode,
  };
};

export const buildIdentityFxSnapshot = (
  request: FxRateRequest,
  options: {
    source: Exclude<FxRateSource, 'unavailable'>;
    staleState: Exclude<FxStaleState, 'unavailable'>;
    asOf: string;
    providerCode?: string;
  },
): FxRateSnapshot => {
  assertServerRuntime(moduleName);
  if (request.baseCurrency !== request.quoteCurrency) {
    return buildUnavailableFxSnapshot(request, 'FX_SYMBOL_UNSUPPORTED', options.providerCode);
  }

  const normalizedAsOf = normalizeFxTimestamp(options.asOf);
  if (!normalizedAsOf) {
    return buildUnavailableFxSnapshot(request, 'FX_RESPONSE_UNEXPECTED', options.providerCode);
  }

  const providerCode = normalizeProviderCode(options.providerCode);
  return {
    baseCurrency: request.baseCurrency,
    quoteCurrency: request.quoteCurrency,
    rate: 1,
    asOf: normalizedAsOf,
    source: options.source,
    staleState: options.staleState,
    ...(providerCode ? { providerCode } : {}),
  };
};

export const normalizeFxRateSnapshot = (
  request: FxRateRequest,
  candidate: {
    rate: unknown;
    asOf: unknown;
    source: Exclude<FxRateSource, 'unavailable'>;
    staleState: Exclude<FxStaleState, 'unavailable'>;
    providerCode?: unknown;
  },
): FxRateSnapshot => {
  assertServerRuntime(moduleName);
  if (typeof candidate.rate !== 'number' || !Number.isFinite(candidate.rate) || candidate.rate <= 0) {
    return buildUnavailableFxSnapshot(
      request,
      'FX_RESPONSE_UNEXPECTED',
      normalizeProviderCode(candidate.providerCode),
    );
  }

  const normalizedAsOf = normalizeFxTimestamp(candidate.asOf);
  if (!normalizedAsOf) {
    return buildUnavailableFxSnapshot(
      request,
      'FX_RESPONSE_UNEXPECTED',
      normalizeProviderCode(candidate.providerCode),
    );
  }

  const providerCode = normalizeProviderCode(candidate.providerCode);
  return {
    baseCurrency: request.baseCurrency,
    quoteCurrency: request.quoteCurrency,
    rate: candidate.rate,
    asOf: normalizedAsOf,
    source: candidate.source,
    staleState: candidate.staleState,
    ...(providerCode ? { providerCode } : {}),
  };
};

export const isUsableFxRateSnapshot = (
  snapshot: FxRateSnapshot,
): snapshot is UsableFxRateSnapshot => {
  assertServerRuntime(moduleName);
  return (
    typeof snapshot.rate === 'number' &&
    Number.isFinite(snapshot.rate) &&
    snapshot.rate > 0 &&
    normalizeFxTimestamp(snapshot.asOf) !== null &&
    snapshot.source !== 'unavailable' &&
    snapshot.staleState !== 'unavailable' &&
    snapshot.errorCode === undefined
  );
};

export const deriveInverseFxSnapshot = (snapshot: FxRateSnapshot): FxRateSnapshot => {
  assertServerRuntime(moduleName);
  const inverseRequest: FxRateRequest = {
    baseCurrency: snapshot.quoteCurrency,
    quoteCurrency: snapshot.baseCurrency,
  };

  if (!isUsableFxRateSnapshot(snapshot)) {
    return buildUnavailableFxSnapshot(
      inverseRequest,
      snapshot.errorCode ?? 'FX_RESPONSE_UNEXPECTED',
      snapshot.providerCode,
    );
  }

  return normalizeFxRateSnapshot(inverseRequest, {
    rate: 1 / snapshot.rate,
    asOf: snapshot.asOf,
    source: snapshot.source,
    staleState: snapshot.staleState,
    providerCode: snapshot.providerCode,
  });
};

export const buildUnsupportedFxResult = (
  baseCurrency: unknown,
  quoteCurrency: unknown,
  providerCode?: string,
): FxRateResult => {
  assertServerRuntime(moduleName);
  const normalizedBase = normalizeFxCurrency(baseCurrency);
  const normalizedQuote = normalizeFxCurrency(quoteCurrency);
  const request = normalizedBase && normalizedQuote
    ? { baseCurrency: normalizedBase, quoteCurrency: normalizedQuote }
    : null;
  const safeProviderCode = normalizeProviderCode(providerCode);

  return {
    ok: false,
    code: 'FX_SYMBOL_UNSUPPORTED',
    message: 'FX pair is not supported.',
    data: request
      ? buildUnavailableFxSnapshot(request, 'FX_SYMBOL_UNSUPPORTED', safeProviderCode)
      : null,
    staleState: 'unavailable',
    ...(safeProviderCode ? { providerCode: safeProviderCode } : {}),
  };
};
