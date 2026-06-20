import { getKisQuoteSnapshot } from '../providers/kisClient';
import { createProviderError } from '../providers/providerErrors';
import { assertServerRuntime } from '../providers/serverOnly';
import type { ProviderResult, QuoteSnapshot, SecurityIdentity } from '../providers/types';

const moduleName = 'marketData/quotes';

export const getQuoteSnapshot = async (identity: SecurityIdentity): Promise<ProviderResult<QuoteSnapshot>> => {
  assertServerRuntime(moduleName);
  if (!identity.symbol || !identity.market) {
    return createProviderError('VALIDATION_FAILED', 'Quote request requires market and symbol.');
  }

  if (identity.market !== 'KR') {
    return createProviderError('SYMBOL_UNSUPPORTED', 'Only KR domestic stock quotes are supported in this phase.', {
      staleState: 'unavailable',
    });
  }

  return getKisQuoteSnapshot(identity);
};

export const getQuoteSnapshotReadiness = getQuoteSnapshot;
