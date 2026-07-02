/**
 * OHLC provider boundary.
 *
 * Every OHLC provider (mocked now, the future KIS local adapter later) implements this single
 * interface so that mocked chart data now and KIS chart data later share one contract.
 *
 * Boundary rules (mirrors the quote provider boundary in `quoteProvider.ts`):
 * - the interface never requires credentials;
 * - the interface never reads environment variables;
 * - network permission is explicit through `allowNetwork` on the context;
 * - live KIS execution requires an additional explicit `allowKisLive` opt-in, so `allowNetwork`
 *   alone can never trigger a live KIS call;
 * - public production must never be able to accidentally trigger a live call, so the default
 *   `owner-local`/`allowNetwork`/`allowKisLive` gating lives with the caller, not the type.
 */

import type { NormalizedOhlcSeries, OhlcAssetType, OhlcMarket, OhlcPeriod } from '../../market-data/normalizedOhlc';

export type OhlcProviderRequest = {
  symbol: string;
  market: OhlcMarket;
  period: OhlcPeriod;
  assetType?: OhlcAssetType;
  exchange?: string;
};

export type OhlcProviderMode = 'fixture' | 'mocked' | 'owner-local';

export type OhlcProviderContext = {
  mode: OhlcProviderMode;
  allowNetwork: boolean;
  /**
   * Explicit opt-in required before a live KIS OHLC call may be attempted. Optional and
   * defaults to disabled so existing providers (fixture, mocked) are unaffected. Even when
   * true, Phase 3ER performs no live call; the first live OHLC call is deferred to Phase 3ES.
   */
  allowKisLive?: boolean;
};

export type OhlcProvider = {
  readonly id: string;
  readonly label: string;
  getOhlc(
    request: OhlcProviderRequest,
    context: OhlcProviderContext,
  ): Promise<NormalizedOhlcSeries>;
};
