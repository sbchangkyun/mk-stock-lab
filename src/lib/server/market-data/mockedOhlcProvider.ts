/**
 * Deterministic mocked OHLC provider.
 *
 * Converts the existing UI-facing sample OHLC generator (`chart-ai/mockedOhlc.ts`) into the
 * normalized OHLC contract. There is no randomness, no network, no credential, and no
 * dependency on the current wall-clock time: every point is derived only from
 * `symbol + period`, so the same request always produces the same series.
 *
 * Supported samples: KR stock (005930, 000660), KR ETF (069500), US stock (AAPL), US ETF (SPY).
 * Any other symbol still resolves to a deterministic sample series using the request fields,
 * matching the mocked quote provider's fallback behavior.
 */

import { assertServerRuntime } from '../providers/serverOnly';
import { createMockedOhlcSeries } from '../../chart-ai/mockedOhlc';
import {
  toNullableOhlcNumber,
  type NormalizedOhlcPoint,
  type NormalizedOhlcSeries,
  type OhlcAssetType,
  type OhlcCurrency,
  type OhlcMarket,
} from '../../market-data/normalizedOhlc';
import type { OhlcProvider, OhlcProviderContext, OhlcProviderRequest } from './ohlcProvider';

type SampleMeta = {
  displayName: string;
  market: OhlcMarket;
  assetType: OhlcAssetType;
  currency: OhlcCurrency;
};

const SAMPLE_REGISTRY: Record<string, SampleMeta> = {
  '005930': { displayName: '삼성전자', market: 'KR', assetType: 'stock', currency: 'KRW' },
  '000660': { displayName: 'SK하이닉스', market: 'KR', assetType: 'stock', currency: 'KRW' },
  '069500': { displayName: 'KODEX 200', market: 'KR', assetType: 'etf', currency: 'KRW' },
  AAPL: { displayName: 'Apple Inc.', market: 'US', assetType: 'stock', currency: 'USD' },
  SPY: { displayName: 'SPDR S&P 500 ETF Trust', market: 'US', assetType: 'etf', currency: 'USD' },
};

const resolveMeta = (request: OhlcProviderRequest): SampleMeta => {
  const registered = SAMPLE_REGISTRY[request.symbol.toUpperCase()] ?? SAMPLE_REGISTRY[request.symbol];
  if (registered) return registered;
  return {
    displayName: request.symbol,
    market: request.market,
    assetType: request.assetType ?? 'unknown',
    currency: request.market === 'KR' ? 'KRW' : 'USD',
  };
};

const buildDeterministicSeries = (request: OhlcProviderRequest): NormalizedOhlcSeries => {
  const meta = resolveMeta(request);
  const points: NormalizedOhlcPoint[] = createMockedOhlcSeries(request.symbol, request.period).map((point) => ({
    dateTime: point.date,
    open: toNullableOhlcNumber(point.open),
    high: toNullableOhlcNumber(point.high),
    low: toNullableOhlcNumber(point.low),
    close: toNullableOhlcNumber(point.close),
    volume: toNullableOhlcNumber(point.volume),
  }));

  return {
    symbol: request.symbol,
    market: meta.market,
    assetType: meta.assetType,
    currency: meta.currency,
    period: request.period,
    interval: 'sample',
    source: 'mocked',
    freshness: 'sample',
    isLive: false,
    providerStatus: 'sample',
    points,
    message: '샘플 OHLC·거래량 데이터입니다. 실제 시세 아님.',
    safety: { rawResponsePrinted: false, secretsPrinted: false, publicProductionBlocked: true },
  };
};

export const createMockedOhlcProvider = (): OhlcProvider => ({
  id: 'mocked-ohlc-provider',
  label: 'Mocked OHLC provider (sample data)',
  async getOhlc(request: OhlcProviderRequest, _context: OhlcProviderContext): Promise<NormalizedOhlcSeries> {
    assertServerRuntime('mockedOhlcProvider');
    return buildDeterministicSeries(request);
  },
});

/** Direct helper for deterministic tests and future callers. */
export const getMockedOhlcSeries = (request: OhlcProviderRequest): NormalizedOhlcSeries =>
  buildDeterministicSeries(request);

export const MOCKED_OHLC_SAMPLE_SYMBOLS = Object.keys(SAMPLE_REGISTRY);
