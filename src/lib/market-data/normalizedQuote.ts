/**
 * Normalized quote snapshot contract.
 *
 * This is the single shared shape every quote provider must return, whether it is a
 * fixture, a deterministic mock, or a future KIS local adapter. It supports Korean and
 * US stocks/ETFs and is intentionally client-safe: it must never carry secrets, raw
 * provider payloads, tokens, cookies, or account data.
 *
 * Live-safety invariants (enforced by providers, verified by the phase checker):
 * - the mocked provider returns source='mocked', freshness='sample', isLive=false;
 * - the unavailable/blocked path returns source='unavailable', isLive=false;
 * - no provider exposes live/current/real-time claims to the public UI.
 */

export type QuoteMarket = 'KR' | 'US';

export type QuoteAssetType = 'stock' | 'etf' | 'etn' | 'index' | 'unknown';

export type QuoteCurrency = 'KRW' | 'USD' | string;

export type QuoteSource =
  | 'fixture'
  | 'mocked'
  | 'kis-local'
  | 'unavailable';

export type QuoteFreshness =
  | 'sample'
  | 'fresh'
  | 'delayed'
  | 'stale'
  | 'unavailable';

export type QuoteProviderId = 'fixture' | 'mocked' | 'kis' | 'none';

export type QuoteProviderStatus = 'ok' | 'sample' | 'unavailable' | 'blocked' | 'error';

export type NormalizedQuoteSnapshot = {
  symbol: string;
  displayName: string;
  market: QuoteMarket;
  exchange: string;
  assetType: QuoteAssetType;
  currency: QuoteCurrency;

  lastPrice: number | null;
  previousClose: number | null;
  change: number | null;
  changeRate: number | null;
  volume: number | null;

  asOf: string | null;
  source: QuoteSource;
  freshness: QuoteFreshness;

  isLive: boolean;
  isTradable: boolean;

  provider: QuoteProviderId;
  providerStatus: QuoteProviderStatus;

  label: string;
  disclaimer: string;
};

/** Shared sample disclaimer used by non-live snapshots. */
export const SAMPLE_QUOTE_DISCLAIMER = '샘플 데이터입니다. 실제 시세 아님.';

/**
 * Runtime guard for the live-safety invariants. Returns true only when the snapshot
 * does not make a live claim while sourced from mocked/fixture/unavailable data.
 */
export const isLiveSafeQuoteSnapshot = (snapshot: NormalizedQuoteSnapshot): boolean => {
  if (snapshot.source === 'mocked' || snapshot.source === 'fixture' || snapshot.source === 'unavailable') {
    if (snapshot.isLive) return false;
    if (snapshot.freshness === 'fresh' || snapshot.freshness === 'delayed' || snapshot.freshness === 'stale') {
      // mocked/fixture/unavailable snapshots must present as sample or unavailable only
      return snapshot.source !== 'unavailable' ? snapshot.freshness === 'sample' : snapshot.freshness === 'unavailable';
    }
  }
  return true;
};
