/**
 * Quote provider boundary.
 *
 * Every quote provider (fixture, mocked, and the future KIS local adapter) implements
 * this single interface so that mocked data now and KIS data later share one contract.
 *
 * Boundary rules:
 * - the interface never requires credentials;
 * - the interface never reads environment variables;
 * - network permission is explicit through `allowNetwork` on the context;
 * - live KIS execution requires an additional explicit `allowKisLive` opt-in (Phase 3EN),
 *   so `allowNetwork` alone can never trigger a live KIS call;
 * - public production must never be able to accidentally trigger a live call, so the
 *   default `owner-local`/`allowNetwork`/`allowKisLive` gating lives with the caller, not the type.
 */

import type { NormalizedQuoteSnapshot, QuoteAssetType, QuoteMarket } from '../../market-data/normalizedQuote';

export type QuoteProviderRequest = {
  symbol: string;
  market: QuoteMarket;
  assetType?: QuoteAssetType;
  exchange?: string;
};

export type QuoteProviderMode = 'fixture' | 'mocked' | 'owner-local';

export type QuoteProviderContext = {
  mode: QuoteProviderMode;
  allowNetwork: boolean;
  /**
   * Explicit opt-in required before a live KIS quote may be attempted. Optional and
   * defaults to disabled so existing providers (fixture, mocked) are unaffected. Even
   * when true, Phase 3EN performs no live call; the first live call is deferred to 3EO.
   */
  allowKisLive?: boolean;
};

export type QuoteProvider = {
  readonly id: string;
  readonly label: string;
  getQuote(
    request: QuoteProviderRequest,
    context: QuoteProviderContext,
  ): Promise<NormalizedQuoteSnapshot>;
};
