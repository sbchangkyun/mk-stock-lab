/**
 * KIS quote provider boundary.
 *
 * This is the server-only boundary for the owner-local KIS quote adapter. In Phase 3EN it is
 * gated and smoke-ready but still performs NO live call:
 * - it never calls the network fetch API;
 * - it never reads environment variables or secret files;
 * - it contains no endpoint URLs and no credentials;
 * - it delegates the go/no-go decision to the owner-local gate;
 * - when the gate blocks (the default for public production), it returns a controlled
 *   blocked/unavailable snapshot;
 * - even when the gate allows a live attempt, Phase 3EN returns a controlled
 *   not-implemented snapshot and builds the request descriptor only.
 *
 * The first real KIS call is deferred to Phase 3EO — Owner-Local KIS Quote Smoke.
 */

import { assertServerRuntime } from '../serverOnly';
import type { NormalizedQuoteSnapshot, QuoteProviderStatus } from '../../../market-data/normalizedQuote';
import type { QuoteProvider, QuoteProviderContext, QuoteProviderRequest } from '../../market-data/quoteProvider';
import { evaluateKisOwnerLocalGate, type KisOwnerLocalGateReason } from './kisOwnerLocalGate';
import { buildKisQuoteRequestDescriptor, type KisQuoteRequestDescriptor } from './kisQuoteRequest';
import { buildKisQuoteFallbackSnapshot } from './kisQuoteMapper';

const buildBlockedSnapshot = (
  request: QuoteProviderRequest,
  status: QuoteProviderStatus,
  label: string,
  disclaimer: string,
): NormalizedQuoteSnapshot => ({
  symbol: request.symbol,
  displayName: request.symbol,
  market: request.market,
  exchange: request.exchange ?? (request.market === 'KR' ? 'KRX' : 'US'),
  assetType: request.assetType ?? 'unknown',
  currency: request.market === 'KR' ? 'KRW' : 'USD',

  lastPrice: null,
  previousClose: null,
  change: null,
  changeRate: null,
  volume: null,

  asOf: null,
  source: 'unavailable',
  freshness: 'unavailable',

  isLive: false,
  isTradable: false,

  provider: 'kis',
  providerStatus: status,

  label,
  disclaimer,
});

const BLOCKED_DISCLAIMER_BY_REASON: Record<KisOwnerLocalGateReason, string> = {
  blocked_by_mode: 'KIS quote is available only in owner-local mode; blocked in this mode.',
  network_not_allowed: 'KIS quote requires explicit network permission; blocked.',
  live_flag_missing: 'KIS live quote requires an explicit owner-local live opt-in; blocked.',
  owner_local_allowed: 'KIS owner-local gate is open.',
};

/**
 * Exposed for Phase 3EO: build the (still non-executing) request descriptor for a symbol.
 * Returns null when the owner-local gate does not allow a live attempt.
 */
export const prepareKisQuoteRequest = (
  request: QuoteProviderRequest,
  context: QuoteProviderContext,
): KisQuoteRequestDescriptor | null => {
  const gate = evaluateKisOwnerLocalGate({
    mode: context.mode,
    allowNetwork: context.allowNetwork,
    allowKisLive: context.allowKisLive,
  });
  if (!gate.allowed) return null;
  return buildKisQuoteRequestDescriptor(request);
};

export const createKisQuoteProvider = (): QuoteProvider => ({
  id: 'kis-quote-provider',
  label: 'KIS quote provider (owner-local gated, no live call in Phase 3EN)',
  async getQuote(request: QuoteProviderRequest, context: QuoteProviderContext): Promise<NormalizedQuoteSnapshot> {
    assertServerRuntime('kisQuoteProvider');

    const gate = evaluateKisOwnerLocalGate({
      mode: context.mode,
      allowNetwork: context.allowNetwork,
      allowKisLive: context.allowKisLive,
    });

    if (!gate.allowed) {
      return buildBlockedSnapshot(
        request,
        'blocked',
        'KIS local smoke required',
        BLOCKED_DISCLAIMER_BY_REASON[gate.reason],
      );
    }

    // Gate is open (owner-local + allowNetwork + allowKisLive). In Phase 3EN we still perform
    // NO live call: we only build the request descriptor to prove the pipeline is smoke-ready,
    // then return a controlled not-implemented fallback. Phase 3EO plugs in real execution here.
    void buildKisQuoteRequestDescriptor(request);
    return buildKisQuoteFallbackSnapshot(
      request.symbol,
      {
        market: request.market,
        exchange: request.exchange ?? (request.market === 'KR' ? 'KRX' : 'US'),
        assetType: request.assetType ?? 'unknown',
        currency: request.market === 'KR' ? 'KRW' : 'USD',
      },
      'Live KIS quote execution is deferred to Phase 3EO owner-local smoke; not implemented in Phase 3EN.',
    );
  },
});
