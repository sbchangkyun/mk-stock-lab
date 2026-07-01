/**
 * Deterministic mocked quote provider.
 *
 * Produces stable, non-live quote snapshots derived only from `symbol + market`. There is
 * no randomness, no network, no credential, and no dependency. Every snapshot is marked as
 * sample/non-live so it can never be mistaken for a real market value.
 *
 * Supported samples: KR stock (005930, 000660), KR ETF (069500), US stock (AAPL), US ETF (SPY).
 * Any other symbol still resolves to a deterministic sample snapshot using the request fields.
 */

import { assertServerRuntime } from '../providers/serverOnly';
import {
  SAMPLE_QUOTE_DISCLAIMER,
  type NormalizedQuoteSnapshot,
  type QuoteAssetType,
  type QuoteCurrency,
  type QuoteMarket,
} from '../../market-data/normalizedQuote';
import type { QuoteProvider, QuoteProviderContext, QuoteProviderRequest } from './quoteProvider';

const SAMPLE_AS_OF = '2026-07-01T00:00:00.000Z';

type SampleMeta = {
  displayName: string;
  market: QuoteMarket;
  exchange: string;
  assetType: QuoteAssetType;
  currency: QuoteCurrency;
};

const SAMPLE_REGISTRY: Record<string, SampleMeta> = {
  '005930': { displayName: '삼성전자', market: 'KR', exchange: 'KOSPI', assetType: 'stock', currency: 'KRW' },
  '000660': { displayName: 'SK하이닉스', market: 'KR', exchange: 'KOSPI', assetType: 'stock', currency: 'KRW' },
  '069500': { displayName: 'KODEX 200', market: 'KR', exchange: 'KOSPI', assetType: 'etf', currency: 'KRW' },
  AAPL: { displayName: 'Apple Inc.', market: 'US', exchange: 'NASDAQ', assetType: 'stock', currency: 'USD' },
  SPY: { displayName: 'SPDR S&P 500 ETF Trust', market: 'US', exchange: 'NYSE Arca', assetType: 'etf', currency: 'USD' },
};

/** Stable FNV-1a hash. Deterministic across runs; no runtime randomness. */
const hashString = (value: string): number => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const round2 = (value: number): number => Math.round(value * 100) / 100;

const resolveMeta = (request: QuoteProviderRequest): SampleMeta => {
  const registered = SAMPLE_REGISTRY[request.symbol.toUpperCase()] ?? SAMPLE_REGISTRY[request.symbol];
  if (registered) return registered;
  return {
    displayName: request.symbol,
    market: request.market,
    exchange: request.exchange ?? (request.market === 'KR' ? 'KRX' : 'US'),
    assetType: request.assetType ?? 'unknown',
    currency: request.market === 'KR' ? 'KRW' : 'USD',
  };
};

const buildDeterministicSnapshot = (request: QuoteProviderRequest, meta: SampleMeta): NormalizedQuoteSnapshot => {
  const key = `${request.symbol}:${meta.market}`;
  const priceSeed = hashString(key);
  const changeSeed = hashString(`${key}:change`);
  const volumeSeed = hashString(`${key}:volume`);
  const isKrw = meta.currency === 'KRW';

  const lastPrice = isKrw
    ? 10000 + (priceSeed % 900) * 100
    : round2(50 + (priceSeed % 45000) / 100);
  const direction = changeSeed % 2 === 0 ? 1 : -1;
  const changeMagnitude = isKrw
    ? (changeSeed % 400) * 5
    : round2((changeSeed % 800) / 100);
  const change = direction * changeMagnitude;
  const previousClose = round2(lastPrice - change);
  const changeRate = previousClose !== 0 ? round2((change / previousClose) * 100) : 0;
  const volume = 100000 + (volumeSeed % 9000000);

  return {
    symbol: request.symbol,
    displayName: meta.displayName,
    market: meta.market,
    exchange: meta.exchange,
    assetType: meta.assetType,
    currency: meta.currency,

    lastPrice,
    previousClose,
    change,
    changeRate,
    volume,

    asOf: SAMPLE_AS_OF,
    source: 'mocked',
    freshness: 'sample',

    isLive: false,
    isTradable: false,

    provider: 'mocked',
    providerStatus: 'sample',

    label: '샘플 시세',
    disclaimer: SAMPLE_QUOTE_DISCLAIMER,
  };
};

export const createMockedQuoteProvider = (): QuoteProvider => ({
  id: 'mocked-quote-provider',
  label: 'Mocked quote provider (sample data)',
  async getQuote(request: QuoteProviderRequest, _context: QuoteProviderContext): Promise<NormalizedQuoteSnapshot> {
    assertServerRuntime('mockedQuoteProvider');
    const meta = resolveMeta(request);
    return buildDeterministicSnapshot(request, meta);
  },
});

/** Direct helper for deterministic tests and future callers. */
export const getMockedQuoteSnapshot = (request: QuoteProviderRequest): NormalizedQuoteSnapshot =>
  buildDeterministicSnapshot(request, resolveMeta(request));

export const MOCKED_QUOTE_SAMPLE_SYMBOLS = Object.keys(SAMPLE_REGISTRY);
