/**
 * Phase 3GM: read-only, sanitized health summaries of the existing in-process quote/OHLCV caches.
 *
 * Reuses the EXISTING caches unchanged:
 *  - src/lib/server/marketData/quoteCache.ts (current-price quote cache) via the new, additive
 *    `getQuoteCacheHealthSnapshot()` export.
 *  - the single shared normalized-OHLCV cache in src/lib/server/chart-ai/universalOhlcvProvider.ts
 *    via the new, additive `getOhlcvCacheHealthSnapshot()` export.
 *
 * Both caches are process-local (module-level `Map`s that exist only within the current warm
 * serverless instance) -- never a claim of cross-instance/global Production state. Never returns a
 * cached market payload, only counts/ages. Reading this never triggers a KIS/provider request: both
 * snapshot functions are pure reads over already-populated in-memory state.
 */

import {
  getQuoteCacheHealthSnapshot,
  QUOTE_CACHE_FRESH_TTL_MS,
  QUOTE_CACHE_STALE_TTL_MS,
} from '../marketData/quoteCache';
import { getOhlcvCacheHealthSnapshot } from '../chart-ai/universalOhlcvProvider';
import type { QuoteCacheSummary } from './types';

export type QuoteCacheHealthDeps = {
  readQuoteCacheSnapshot: typeof getQuoteCacheHealthSnapshot;
  readOhlcvCacheSnapshot: typeof getOhlcvCacheHealthSnapshot;
  now: () => number;
};

const defaultDeps: QuoteCacheHealthDeps = {
  readQuoteCacheSnapshot: getQuoteCacheHealthSnapshot,
  readOhlcvCacheSnapshot: getOhlcvCacheHealthSnapshot,
  now: () => Date.now(),
};

export const getQuoteCacheOverview = (deps: Partial<QuoteCacheHealthDeps> = {}): QuoteCacheSummary[] => {
  const { readQuoteCacheSnapshot, readOhlcvCacheSnapshot, now } = { ...defaultDeps, ...deps };
  const nowMs = now();
  const summaries: QuoteCacheSummary[] = [];

  try {
    const snap = readQuoteCacheSnapshot(nowMs);
    summaries.push({
      cacheId: 'current-price-quote-cache',
      scope: 'KIS 현재가 시세 (국내/해외)',
      durability: 'instance-local',
      entryCount: snap.entryCount,
      configuredTtlMs: QUOTE_CACHE_FRESH_TTL_MS + (QUOTE_CACHE_STALE_TTL_MS - QUOTE_CACHE_FRESH_TTL_MS),
      newestEntryAgeMs: snap.newestEntryAgeMs,
      oldestEntryAgeMs: snap.oldestEntryAgeMs,
      freshCount: snap.freshCount,
      staleCount: snap.staleCount,
      expiredCount: snap.expiredCount,
      lastSuccessfulUpdateAtIso: snap.lastCachedAtIso,
      status: snap.entryCount === 0 ? 'unavailable' : snap.expiredCount > 0 && snap.freshCount === 0 ? 'warning' : 'healthy',
    });
  } catch {
    summaries.push({
      cacheId: 'current-price-quote-cache',
      scope: 'KIS 현재가 시세 (국내/해외)',
      durability: 'instance-local',
      entryCount: 0,
      configuredTtlMs: null,
      newestEntryAgeMs: null,
      oldestEntryAgeMs: null,
      freshCount: null,
      staleCount: null,
      expiredCount: null,
      lastSuccessfulUpdateAtIso: null,
      status: 'unavailable',
    });
  }

  try {
    const snap = readOhlcvCacheSnapshot(nowMs);
    const freshCount = snap.entries.filter((e: { fresh: boolean }) => e.fresh).length;
    const expiredCount = snap.entries.length - freshCount;
    const newestEntryAgeMs =
      snap.entries.length === 0
        ? null
        : Math.max(0, -Math.max(...snap.entries.map((e: { msUntilExpiry: number }) => e.msUntilExpiry)));
    summaries.push({
      cacheId: 'normalized-ohlcv-cache',
      scope: '차트 OHLCV (일봉/장기 히스토리, 공유 캐시)',
      durability: 'instance-local',
      entryCount: snap.entryCount,
      configuredTtlMs: null, // per-entry TTL varies by range/negative-hit classification, not a single constant
      newestEntryAgeMs,
      oldestEntryAgeMs: null,
      freshCount,
      staleCount: 0,
      expiredCount,
      lastSuccessfulUpdateAtIso: null,
      status: snap.entryCount === 0 ? 'unavailable' : expiredCount > 0 && freshCount === 0 ? 'warning' : 'healthy',
    });
  } catch {
    summaries.push({
      cacheId: 'normalized-ohlcv-cache',
      scope: '차트 OHLCV (일봉/장기 히스토리, 공유 캐시)',
      durability: 'instance-local',
      entryCount: 0,
      configuredTtlMs: null,
      newestEntryAgeMs: null,
      oldestEntryAgeMs: null,
      freshCount: null,
      staleCount: null,
      expiredCount: null,
      lastSuccessfulUpdateAtIso: null,
      status: 'unavailable',
    });
  }

  return summaries;
};
