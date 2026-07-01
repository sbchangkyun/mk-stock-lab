/**
 * KIS quote provider boundary (skeleton).
 *
 * This establishes the server-only boundary for a future KIS quote adapter. It intentionally
 * cannot perform a live call in this phase:
 * - it never calls the network fetch API;
 * - it never reads environment variables or secret files;
 * - it contains no endpoint URLs and no credentials;
 * - it returns a controlled blocked snapshot until the owner-local smoke phase (Phase 3EO)
 *   implements and validates the real adapter.
 *
 * The first real KIS call is deferred to Phase 3EO — Owner-Local KIS Quote Smoke.
 */

import { assertServerRuntime } from '../serverOnly';
import type {
  NormalizedQuoteSnapshot,
  QuoteProviderStatus,
} from '../../../market-data/normalizedQuote';
import type { QuoteProvider, QuoteProviderContext, QuoteProviderRequest } from '../../market-data/quoteProvider';

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

export const createKisQuoteProvider = (): QuoteProvider => ({
  id: 'kis-quote-provider',
  label: 'KIS quote provider (blocked until owner-local smoke)',
  async getQuote(request: QuoteProviderRequest, context: QuoteProviderContext): Promise<NormalizedQuoteSnapshot> {
    assertServerRuntime('kisQuoteProvider');

    if (!context.allowNetwork) {
      return buildBlockedSnapshot(
        request,
        'blocked',
        'KIS local smoke required',
        'KIS quote integration is blocked until owner-local smoke validation.',
      );
    }

    // Network is explicitly allowed, but the live adapter is not implemented in this phase.
    // The first real KIS call is deferred to Phase 3EO — Owner-Local KIS Quote Smoke.
    return buildBlockedSnapshot(
      request,
      'blocked',
      'KIS live quote not yet implemented',
      'Live KIS quote calls are deferred to Phase 3EO owner-local smoke and are not implemented in this phase.',
    );
  },
});
