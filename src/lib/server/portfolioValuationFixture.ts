import { assertServerRuntime } from './providers/serverOnly';
import type { QuoteSnapshot } from './providers/types';

const FIXTURE_MODULE = 'portfolioValuationFixture';

// Synthetic fixture quotes for Phase 3BW.
// These values are NOT real market data. They are synthetic examples only.
// rawProviderStored: false. provider: fixture. isSynthetic: true.
// Do not cite these values in any investor-facing context.
const FIXTURE_QUOTES: Record<string, QuoteSnapshot> = {
  // Samsung Electronics — synthetic example (not a real current price)
  '005930': {
    symbol: '005930',
    market: 'KR',
    price: 73000,
    currency: 'KRW',
    change: 500,
    changePct: 0.69,
    volume: 12000000,
    marketState: 'closed',
    asOf: '2026-06-25T06:00:00.000Z',
    staleState: 'fresh',
  },
  // SK hynix — synthetic example (not a real current price)
  '000660': {
    symbol: '000660',
    market: 'KR',
    price: 198000,
    currency: 'KRW',
    change: -1000,
    changePct: -0.5,
    volume: 3500000,
    marketState: 'closed',
    asOf: '2026-06-25T06:00:00.000Z',
    staleState: 'fresh',
  },
  // NAVER — synthetic example, intentionally stale-but-usable to test fallback state
  '035420': {
    symbol: '035420',
    market: 'KR',
    price: 185000,
    currency: 'KRW',
    change: 0,
    changePct: 0,
    volume: 800000,
    marketState: 'closed',
    asOf: '2026-06-24T06:00:00.000Z',
    staleState: 'stale-but-usable',
  },
  // KODEX 200 — synthetic example (not a real current price)
  '069500': {
    symbol: '069500',
    market: 'KR',
    price: 34000,
    currency: 'KRW',
    change: 200,
    changePct: 0.59,
    volume: 5000000,
    marketState: 'closed',
    asOf: '2026-06-25T06:00:00.000Z',
    staleState: 'fresh',
  },
};

export const FIXTURE_SUPPORTED_SYMBOLS = Object.freeze(Object.keys(FIXTURE_QUOTES));

// Resolve fixture quotes by symbol. Symbols absent from fixture return null.
// providerMeta is intentionally absent from all fixture quotes —
// fixture quotes never carry raw provider metadata.
export const resolveFixtureQuotes = (
  symbols: string[],
): Record<string, QuoteSnapshot | null> => {
  assertServerRuntime(FIXTURE_MODULE);

  const result: Record<string, QuoteSnapshot | null> = {};
  for (const symbol of symbols) {
    result[symbol] = FIXTURE_QUOTES[symbol] ?? null;
  }
  return result;
};
