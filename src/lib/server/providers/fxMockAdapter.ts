import { assertServerRuntime } from './serverOnly';

const moduleName = 'providers/fxMockAdapter';

export type SupportedFxCurrency = 'KRW' | 'USD';

export type FxRateSnapshot = {
  pair: string;
  baseCurrency: SupportedFxCurrency;
  quoteCurrency: SupportedFxCurrency;
  rate: number;
  asOf: string;
  source: 'mocked';
  staleState: 'sample';
  provider: 'fx-mock';
};

export type FxRateResult =
  | { ok: true; data: FxRateSnapshot; staleState: 'sample' }
  | { ok: false; code: 'SYMBOL_UNSUPPORTED' | 'NOT_IMPLEMENTED'; message: string; provider: 'fx-mock'; staleState: 'unavailable' };

// Fixed mocked USD/KRW rate — synthetic example, not a real or current rate.
// For mocked/preview testing only. source='mocked', staleState='sample'.
// Do not display as live, current, or real-time in any UI copy.
const MOCKED_USD_KRW_RATE = 1350;
const MOCKED_RATE_AS_OF = '2026-01-01T00:00:00.000Z';

export const getMockedFxRate = (
  baseCurrency: SupportedFxCurrency,
  quoteCurrency: SupportedFxCurrency,
): FxRateResult => {
  assertServerRuntime(moduleName);

  if (baseCurrency === quoteCurrency) {
    return {
      ok: true,
      data: {
        pair: `${baseCurrency}/${quoteCurrency}`,
        baseCurrency,
        quoteCurrency,
        rate: 1,
        asOf: MOCKED_RATE_AS_OF,
        source: 'mocked',
        staleState: 'sample',
        provider: 'fx-mock',
      },
      staleState: 'sample',
    };
  }

  if (baseCurrency === 'USD' && quoteCurrency === 'KRW') {
    return {
      ok: true,
      data: {
        pair: 'USD/KRW',
        baseCurrency: 'USD',
        quoteCurrency: 'KRW',
        rate: MOCKED_USD_KRW_RATE,
        asOf: MOCKED_RATE_AS_OF,
        source: 'mocked',
        staleState: 'sample',
        provider: 'fx-mock',
      },
      staleState: 'sample',
    };
  }

  if (baseCurrency === 'KRW' && quoteCurrency === 'USD') {
    return {
      ok: true,
      data: {
        pair: 'KRW/USD',
        baseCurrency: 'KRW',
        quoteCurrency: 'USD',
        rate: 1 / MOCKED_USD_KRW_RATE,
        asOf: MOCKED_RATE_AS_OF,
        source: 'mocked',
        staleState: 'sample',
        provider: 'fx-mock',
      },
      staleState: 'sample',
    };
  }

  return {
    ok: false,
    code: 'NOT_IMPLEMENTED',
    message: 'FX pair not supported by mocked adapter.',
    provider: 'fx-mock',
    staleState: 'unavailable',
  };
};

// Convert an amount between two currencies using the mocked adapter.
// Returns null if the pair is not supported.
// source is always 'mocked' — never treat result as a current or real rate.
export const convertCurrencyMocked = (
  amount: number,
  fromCurrency: SupportedFxCurrency,
  toCurrency: SupportedFxCurrency,
): { convertedAmount: number; rate: number; source: 'mocked' } | null => {
  assertServerRuntime(moduleName);
  const rateResult = getMockedFxRate(fromCurrency, toCurrency);
  if (!rateResult.ok) return null;
  return {
    convertedAmount: amount * rateResult.data.rate,
    rate: rateResult.data.rate,
    source: 'mocked',
  };
};
