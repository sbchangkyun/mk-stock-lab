import { createProviderError } from './providerErrors';
import { assertServerRuntime } from './serverOnly';
import type { ChartSeries, ProviderConfigReadiness, ProviderResult, QuoteSnapshot, SecurityIdentity } from './types';

const provider = 'kis';
const moduleName = 'kisClient';
const requiredEnvNames = ['KIS_APP_KEY', 'KIS_APP_SECRET', 'KIS_BASE_URL'];
const optionalEnvNames = ['KIS_ACCOUNT_NO'];

const isValidIdentity = (input: SecurityIdentity) =>
  (input.market === 'KR' || input.market === 'US') && typeof input.symbol === 'string' && input.symbol.trim().length > 0;

export const getKisAccessTokenReadiness = (): ProviderConfigReadiness => {
  assertServerRuntime(moduleName);
  return {
    provider,
    ready: false,
    reason: 'approval_required',
    requiredEnvNames,
    optionalEnvNames,
  };
};

export const getKisQuoteSnapshot = async (input: SecurityIdentity): Promise<ProviderResult<QuoteSnapshot>> => {
  assertServerRuntime(moduleName);
  if (!isValidIdentity(input)) {
    return createProviderError('VALIDATION_FAILED', 'Quote identity is invalid.', { provider });
  }

  return createProviderError('NOT_IMPLEMENTED', 'KIS quote integration requires a separate approval-gated phase.', {
    provider,
    staleState: 'unavailable',
  });
};

export const getKisChartSeries = async (
  input: SecurityIdentity & { interval: '1d' | '1w' | '1m' },
): Promise<ProviderResult<ChartSeries>> => {
  assertServerRuntime(moduleName);
  if (!isValidIdentity(input)) {
    return createProviderError('VALIDATION_FAILED', 'Chart identity is invalid.', { provider });
  }

  return createProviderError('NOT_IMPLEMENTED', 'KIS chart integration requires a separate approval-gated phase.', {
    provider,
    staleState: 'unavailable',
  });
};
