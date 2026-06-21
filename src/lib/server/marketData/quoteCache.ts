import { assertServerRuntime } from '../providers/serverOnly';
import type { FallbackState, QuoteSnapshot, SecurityIdentity } from '../providers/types';

const moduleName = 'marketData/quoteCache';

export const QUOTE_CACHE_FRESH_TTL_MS = 15_000;
export const QUOTE_CACHE_STALE_TTL_MS = 120_000;
export const QUOTE_CACHE_BACKEND_ENV_NAME = 'QUOTE_CACHE_BACKEND';

export type QuoteCacheState = Extract<FallbackState, 'fresh' | 'stale-but-usable' | 'expired' | 'unavailable'>;
export type QuoteCacheBackendName = 'memory' | 'supabase';

export type QuoteCacheEntry = {
  snapshot: QuoteSnapshot;
  cachedAtMs: number;
  freshUntilMs: number;
  staleUntilMs: number;
};

const quoteCache = new Map<string, QuoteCacheEntry>();

const normalizeSymbol = (symbol: string) => symbol.trim().toUpperCase();

export const createQuoteCacheKey = (identity: Pick<SecurityIdentity, 'market' | 'symbol'>) =>
  `quote:${identity.market}:${normalizeSymbol(identity.symbol)}`;

const cloneSnapshot = (snapshot: QuoteSnapshot, staleState?: FallbackState): QuoteSnapshot => ({
  ...snapshot,
  staleState: staleState ?? snapshot.staleState,
  providerMeta: snapshot.providerMeta ? { ...snapshot.providerMeta } : undefined,
});

export const getQuoteCacheState = (entry: QuoteCacheEntry | null | undefined, nowMs = Date.now()): QuoteCacheState => {
  assertServerRuntime(moduleName);
  if (!entry) return 'unavailable';
  if (nowMs <= entry.freshUntilMs) return 'fresh';
  if (nowMs <= entry.staleUntilMs) return 'stale-but-usable';
  return 'expired';
};

export const getQuoteCacheEntry = (
  identity: Pick<SecurityIdentity, 'market' | 'symbol'>,
  nowMs = Date.now(),
): (QuoteCacheEntry & { state: QuoteCacheState }) | null => {
  assertServerRuntime(moduleName);
  const entry = quoteCache.get(createQuoteCacheKey(identity));
  if (!entry) return null;

  const state = getQuoteCacheState(entry, nowMs);
  if (state === 'expired') {
    quoteCache.delete(createQuoteCacheKey(identity));
    return null;
  }

  return {
    ...entry,
    snapshot: cloneSnapshot(entry.snapshot, state),
    state,
  };
};

export const setQuoteCacheEntry = (snapshot: QuoteSnapshot, nowMs = Date.now()): QuoteCacheEntry => {
  assertServerRuntime(moduleName);
  const freshSnapshot = cloneSnapshot(snapshot, 'fresh');
  const entry: QuoteCacheEntry = {
    snapshot: freshSnapshot,
    cachedAtMs: nowMs,
    freshUntilMs: nowMs + QUOTE_CACHE_FRESH_TTL_MS,
    staleUntilMs: nowMs + QUOTE_CACHE_STALE_TTL_MS,
  };
  quoteCache.set(createQuoteCacheKey(freshSnapshot), entry);
  return {
    ...entry,
    snapshot: cloneSnapshot(entry.snapshot),
  };
};

export const toQuoteCacheMetadata = (
  entry: QuoteCacheEntry,
  state: Extract<QuoteCacheState, 'fresh' | 'stale-but-usable'>,
) => ({
  hit: true,
  state,
  cachedAt: new Date(entry.cachedAtMs).toISOString(),
  freshUntil: new Date(entry.freshUntilMs).toISOString(),
  staleUntil: new Date(entry.staleUntilMs).toISOString(),
});

export const cloneQuoteSnapshotForCache = (snapshot: QuoteSnapshot, staleState?: FallbackState) =>
  cloneSnapshot(snapshot, staleState);

export const clearQuoteCacheForTests = () => {
  assertServerRuntime(moduleName);
  quoteCache.clear();
};

export const getConfiguredQuoteCacheBackendName = (): QuoteCacheBackendName => {
  assertServerRuntime(moduleName);
  return process.env[QUOTE_CACHE_BACKEND_ENV_NAME] === 'supabase' ? 'supabase' : 'memory';
};

export const isSupabaseQuoteCacheBackendEnabled = () => getConfiguredQuoteCacheBackendName() === 'supabase';

const loadSupabaseQuoteCache = async () => import('./supabaseQuoteCache');

export const getConfiguredQuoteCacheEntry = async (
  identity: Pick<SecurityIdentity, 'market' | 'symbol'>,
  nowMs = Date.now(),
): Promise<(QuoteCacheEntry & { state: QuoteCacheState }) | null> => {
  assertServerRuntime(moduleName);
  if (!isSupabaseQuoteCacheBackendEnabled()) return getQuoteCacheEntry(identity, nowMs);

  const persistentCache = await loadSupabaseQuoteCache();
  const persistentEntry = await persistentCache.readSupabaseQuoteCacheEntry(identity, { nowMs });
  if (persistentEntry.ok) return persistentEntry.entry;

  return getQuoteCacheEntry(identity, nowMs);
};

export const setConfiguredQuoteCacheEntry = async (
  snapshot: QuoteSnapshot,
  nowMs = Date.now(),
): Promise<QuoteCacheEntry> => {
  assertServerRuntime(moduleName);
  const memoryEntry = setQuoteCacheEntry(snapshot, nowMs);
  if (!isSupabaseQuoteCacheBackendEnabled()) return memoryEntry;

  const persistentCache = await loadSupabaseQuoteCache();
  const persistentWrite = await persistentCache.writeSupabaseQuoteCacheSuccess(snapshot, { nowMs });
  return persistentWrite.ok ? persistentWrite.entry : memoryEntry;
};

export const recordConfiguredQuoteCacheRefreshFailure = async (
  identity: Pick<SecurityIdentity, 'market' | 'symbol'>,
  errorCode: string,
  nowMs = Date.now(),
) => {
  assertServerRuntime(moduleName);
  if (!isSupabaseQuoteCacheBackendEnabled()) return;

  const persistentCache = await loadSupabaseQuoteCache();
  await persistentCache.writeSupabaseQuoteCacheRefreshFailure(identity, errorCode, { nowMs });
};
