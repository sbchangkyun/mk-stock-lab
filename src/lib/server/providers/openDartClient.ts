import { createProviderError } from './providerErrors';
import { assertServerRuntime } from './serverOnly';
import type {
  DisclosureSummary,
  ProviderConfigReadiness,
  ProviderResult,
  SecurityIdentity,
  SecurityMasterRecord,
} from './types';

const provider = 'opendart';
const moduleName = 'openDartClient';
const requiredEnvNames = ['OPENDART_API_KEY'];

const isSupportedDomesticIdentity = (input: SecurityIdentity) =>
  input.market === 'KR' && typeof input.symbol === 'string' && input.symbol.trim().length > 0;

export const getOpenDartReadiness = (): ProviderConfigReadiness => {
  assertServerRuntime(moduleName);
  return {
    provider,
    ready: false,
    reason: 'approval_required',
    requiredEnvNames,
  };
};

export const getOpenDartCompanyMetadata = async (
  input: SecurityIdentity,
): Promise<ProviderResult<SecurityMasterRecord>> => {
  assertServerRuntime(moduleName);
  if (!isSupportedDomesticIdentity(input)) {
    return createProviderError('SYMBOL_UNSUPPORTED', 'OpenDART metadata shell supports Korean listed-company identities only.', { provider });
  }

  return createProviderError('NOT_IMPLEMENTED', 'OpenDART metadata integration requires a separate approval-gated phase.', {
    provider,
    staleState: 'unavailable',
  });
};

export const getOpenDartDisclosureSummary = async (
  input: SecurityIdentity,
): Promise<ProviderResult<DisclosureSummary[]>> => {
  assertServerRuntime(moduleName);
  if (!isSupportedDomesticIdentity(input)) {
    return createProviderError('SYMBOL_UNSUPPORTED', 'OpenDART disclosure shell supports Korean listed-company identities only.', { provider });
  }

  return createProviderError('NOT_IMPLEMENTED', 'OpenDART disclosure integration requires a separate approval-gated phase.', {
    provider,
    staleState: 'unavailable',
  });
};
