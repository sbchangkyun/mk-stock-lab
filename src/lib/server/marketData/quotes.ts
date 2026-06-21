import { getKisQuoteSnapshot } from '../providers/kisClient';
import { createProviderError } from '../providers/providerErrors';
import { assertServerRuntime } from '../providers/serverOnly';
import type { ProviderResult, QuoteSnapshot, SecurityIdentity } from '../providers/types';
import {
  cloneQuoteSnapshotForCache,
  getConfiguredQuoteCacheEntry,
  recordConfiguredQuoteCacheRefreshFailure,
  setConfiguredQuoteCacheEntry,
  toQuoteCacheMetadata,
} from './quoteCache';

const moduleName = 'marketData/quotes';

type QuoteProvider = (identity: SecurityIdentity) => Promise<ProviderResult<QuoteSnapshot>>;

type QuoteSnapshotOptions = {
  nowMs?: number;
  provider?: QuoteProvider;
};

const validateQuoteIdentity = (identity: SecurityIdentity): ProviderResult<never> | null => {
  if (!identity.symbol || !identity.market) {
    return createProviderError('VALIDATION_FAILED', 'Quote request requires market and symbol.');
  }

  if (identity.market !== 'KR') {
    return createProviderError('SYMBOL_UNSUPPORTED', 'Only KR domestic stock quotes are supported in this phase.', {
      staleState: 'unavailable',
    });
  }

  return null;
};

export const getQuoteSnapshot = async (
  identity: SecurityIdentity,
  options: QuoteSnapshotOptions = {},
): Promise<ProviderResult<QuoteSnapshot>> => {
  assertServerRuntime(moduleName);
  const validationError = validateQuoteIdentity(identity);
  if (validationError) return validationError;

  const nowMs = options.nowMs ?? Date.now();
  const cached = await getConfiguredQuoteCacheEntry(identity, nowMs);

  if (cached?.state === 'fresh') {
    const snapshot = cloneQuoteSnapshotForCache(cached.snapshot, 'fresh');
    return {
      ok: true,
      data: snapshot,
      staleState: 'fresh',
      fallback: {
        state: 'fresh',
        reason: 'cache-fresh',
        cache: toQuoteCacheMetadata(cached, 'fresh'),
      },
    };
  }

  const provider = options.provider ?? getKisQuoteSnapshot;
  const providerResult = await provider(identity);

  if (providerResult.ok) {
    const entry = await setConfiguredQuoteCacheEntry(providerResult.data, nowMs);
    return {
      ok: true,
      data: cloneQuoteSnapshotForCache(providerResult.data, 'fresh'),
      staleState: 'fresh',
      fallback: {
        state: 'fresh',
        reason: 'provider-fresh',
        cache: toQuoteCacheMetadata(entry, 'fresh'),
      },
    };
  }

  await recordConfiguredQuoteCacheRefreshFailure(identity, providerResult.code, nowMs);

  if (cached?.state === 'stale-but-usable') {
    const snapshot = cloneQuoteSnapshotForCache(cached.snapshot, 'stale-but-usable');
    return {
      ok: true,
      data: snapshot,
      staleState: 'stale-but-usable',
      fallback: {
        state: 'stale-but-usable',
        reason: 'cache-stale-provider-failed',
        cache: toQuoteCacheMetadata(cached, 'stale-but-usable'),
      },
    };
  }

  return providerResult;
};

export const getQuoteSnapshotReadiness = getQuoteSnapshot;
