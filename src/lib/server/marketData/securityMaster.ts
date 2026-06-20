import { getOpenDartCompanyMetadata } from '../providers/openDartClient';
import { createProviderError } from '../providers/providerErrors';
import { assertServerRuntime } from '../providers/serverOnly';
import type { ProviderResult, SecurityIdentity, SecurityMasterRecord } from '../providers/types';

const moduleName = 'marketData/securityMaster';

export const resolveSecurityIdentityReadiness = async (
  identity: SecurityIdentity,
): Promise<ProviderResult<SecurityMasterRecord>> => {
  assertServerRuntime(moduleName);
  if (!identity.symbol || !identity.market) {
    return createProviderError('VALIDATION_FAILED', 'Security master readiness requires market and symbol.');
  }

  if (identity.market !== 'KR') {
    return createProviderError('NOT_IMPLEMENTED', 'Non-Korean security master resolution requires a future approved provider phase.', {
      staleState: 'unavailable',
    });
  }

  return getOpenDartCompanyMetadata(identity);
};
