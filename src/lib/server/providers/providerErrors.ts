import type { FallbackState, ProviderErrorCode, ProviderErrorEnvelope, ProviderName } from './types';

const providerErrorCodes = new Set<ProviderErrorCode>([
  'AUTH_REQUIRED',
  'CONFIG_MISSING',
  'PROVIDER_UNAVAILABLE',
  'PROVIDER_RATE_LIMITED',
  'SYMBOL_UNSUPPORTED',
  'CACHE_MISS',
  'DATA_STALE',
  'VALIDATION_FAILED',
  'INTERNAL_ERROR',
  'NOT_IMPLEMENTED',
]);

export const createProviderError = (
  code: ProviderErrorCode,
  message: string,
  options: {
    provider?: ProviderName;
    retryAfterSeconds?: number;
    staleState?: FallbackState;
  } = {},
): ProviderErrorEnvelope => ({
  ok: false,
  code,
  message,
  ...(options.provider ? { provider: options.provider } : {}),
  ...(typeof options.retryAfterSeconds === 'number' ? { retryAfterSeconds: options.retryAfterSeconds } : {}),
  ...(options.staleState ? { staleState: options.staleState } : {}),
});

export const isProviderErrorEnvelope = (value: unknown): value is ProviderErrorEnvelope => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ProviderErrorEnvelope>;
  return candidate.ok === false && typeof candidate.code === 'string' && providerErrorCodes.has(candidate.code as ProviderErrorCode);
};

export const sanitizeUnknownError = (error: unknown, provider?: ProviderName): ProviderErrorEnvelope => {
  if (isProviderErrorEnvelope(error)) return error;
  return createProviderError('INTERNAL_ERROR', 'Provider operation failed safely.', { provider });
};

export const toHttpStatus = (code: ProviderErrorCode) => {
  const statusByCode: Record<ProviderErrorCode, number> = {
    AUTH_REQUIRED: 401,
    CONFIG_MISSING: 503,
    PROVIDER_UNAVAILABLE: 503,
    PROVIDER_RATE_LIMITED: 429,
    SYMBOL_UNSUPPORTED: 404,
    CACHE_MISS: 404,
    DATA_STALE: 200,
    VALIDATION_FAILED: 400,
    INTERNAL_ERROR: 500,
    NOT_IMPLEMENTED: 501,
  };
  return statusByCode[code];
};
