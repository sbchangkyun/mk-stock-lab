/**
 * Blocked KIS OHLC provider skeleton.
 *
 * Prepares the server-only boundary for a future KIS OHLC/chart adapter. It reuses the same
 * owner-local gate as the quote adapter, but ALWAYS returns a blocked/unavailable series in
 * this phase: `resolveVerifiedKisOhlcEndpoint` returns null for every endpoint because no
 * chart/OHLC endpoint has been verified against official KIS documentation yet. This provider
 * never calls fetch, and never reads the runtime environment or local secret configuration.
 * The first live OHLC call is deferred to Phase 3ES — Owner-Local KIS OHLC Smoke.
 */

import { assertServerRuntime } from '../serverOnly';
import { evaluateKisOwnerLocalGate } from './kisOwnerLocalGate';
import { resolveVerifiedKisOhlcEndpoint, type KisOhlcEndpointKey } from './kisOhlcEndpointRegistry';
import { buildUnavailableOhlcSeries, type NormalizedOhlcSeries } from '../../../market-data/normalizedOhlc';
import type { OhlcProvider, OhlcProviderContext, OhlcProviderRequest } from '../../market-data/ohlcProvider';

const isEtfLike = (assetType: OhlcProviderRequest['assetType']): boolean =>
  assetType === 'etf' || assetType === 'etn';

const resolveEndpointKey = (request: OhlcProviderRequest): KisOhlcEndpointKey => {
  if (request.market === 'KR') {
    return isEtfLike(request.assetType) ? 'KR_ETF_DAILY_OHLC' : 'KR_STOCK_DAILY_OHLC';
  }
  return isEtfLike(request.assetType) ? 'US_ETF_DAILY_OHLC' : 'US_STOCK_DAILY_OHLC';
};

const buildBlocked = (request: OhlcProviderRequest, reason: string): NormalizedOhlcSeries =>
  buildUnavailableOhlcSeries({
    symbol: request.symbol,
    market: request.market,
    assetType: request.assetType ?? 'unknown',
    currency: request.market === 'KR' ? 'KRW' : 'USD',
    period: request.period,
    providerStatus: 'blocked',
    message: `KIS OHLC 프리뷰 조건이 충족되지 않았습니다. (${reason})`,
  });

const buildUnverified = (request: OhlcProviderRequest): NormalizedOhlcSeries =>
  buildUnavailableOhlcSeries({
    symbol: request.symbol,
    market: request.market,
    assetType: request.assetType ?? 'unknown',
    currency: request.market === 'KR' ? 'KRW' : 'USD',
    period: request.period,
    providerStatus: 'unavailable',
    message: 'KIS OHLC 엔드포인트가 아직 공식 문서로 검증되지 않았습니다. Phase 3ES에서 검증됩니다.',
  });

export const createKisOhlcProvider = (): OhlcProvider => ({
  id: 'kis-ohlc-provider',
  label: 'KIS OHLC provider (blocked — endpoint not yet verified)',
  async getOhlc(request: OhlcProviderRequest, context: OhlcProviderContext): Promise<NormalizedOhlcSeries> {
    assertServerRuntime('kisOhlcProvider');

    const gate = evaluateKisOwnerLocalGate({
      mode: context.mode,
      allowNetwork: context.allowNetwork,
      allowKisLive: context.allowKisLive,
    });
    if (!gate.allowed) {
      return buildBlocked(request, gate.reason);
    }

    // Even when the gate is open, no endpoint is verified in Phase 3ER, so no live call is
    // ever attempted here. Live execution is deferred to Phase 3ES.
    const endpoint = resolveVerifiedKisOhlcEndpoint(resolveEndpointKey(request));
    if (!endpoint) {
      return buildUnverified(request);
    }

    return buildUnverified(request);
  },
});
