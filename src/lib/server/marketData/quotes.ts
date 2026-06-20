import { getKisQuoteSnapshot } from '../providers/kisClient';
import { createProviderError } from '../providers/providerErrors';
import { assertServerRuntime } from '../providers/serverOnly';
import type { ProviderResult, QuoteSnapshot, SecurityIdentity } from '../providers/types';

const moduleName = 'marketData/quotes';

export const getQuoteSnapshotReadiness = async (
  identity: SecurityIdentity,
): Promise<ProviderResult<QuoteSnapshot>> => {
  assertServerRuntime(moduleName);
  if (!identity.symbol || !identity.market) {
    return createProviderError('VALIDATION_FAILED', 'Quote readiness requires market and symbol.');
  }

  return getKisQuoteSnapshot(identity);
};
