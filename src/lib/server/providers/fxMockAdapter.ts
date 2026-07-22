import {
  buildIdentityFxSnapshot,
  buildUnsupportedFxResult,
  deriveInverseFxSnapshot,
  isUsableFxRateSnapshot,
  normalizeFxCurrency,
  normalizeFxRateSnapshot,
} from './fxAdapter';
import { assertServerRuntime } from './serverOnly';
import type {
  FxRateResult,
  FxRateSnapshot,
  SupportedFxCurrency,
} from './fxTypes';

export type { FxRateResult, FxRateSnapshot, SupportedFxCurrency } from './fxTypes';

const moduleName = 'providers/fxMockAdapter';

// Fixed synthetic example for mocked/preview testing only.
// It is not a live, current, or real-time FX rate.
const MOCKED_USD_KRW_RATE = 1350;
const MOCKED_RATE_AS_OF = '2026-01-01T00:00:00.000Z';
const MOCKED_PROVIDER_CODE = 'fx-mock';

const toMockedResult = (snapshot: FxRateSnapshot): FxRateResult => {
  if (isUsableFxRateSnapshot(snapshot)) {
    return { ok: true, data: snapshot, staleState: snapshot.staleState };
  }

  return {
    ok: false,
    code: snapshot.errorCode ?? 'FX_RESPONSE_UNEXPECTED',
    message: 'Mocked FX rate is unavailable.',
    data: snapshot,
    staleState: 'unavailable',
    providerCode: MOCKED_PROVIDER_CODE,
  };
};

export const getMockedFxRate = (
  baseCurrency: SupportedFxCurrency | string,
  quoteCurrency: SupportedFxCurrency | string,
): FxRateResult => {
  assertServerRuntime(moduleName);
  const normalizedBase = normalizeFxCurrency(baseCurrency);
  const normalizedQuote = normalizeFxCurrency(quoteCurrency);

  if (!normalizedBase || !normalizedQuote) {
    return buildUnsupportedFxResult(baseCurrency, quoteCurrency, MOCKED_PROVIDER_CODE);
  }

  const request = { baseCurrency: normalizedBase, quoteCurrency: normalizedQuote };

  // Identity pairs are resolved locally before any provider-specific rate path.
  if (normalizedBase === normalizedQuote) {
    return toMockedResult(buildIdentityFxSnapshot(request, {
      source: 'mocked',
      staleState: 'sample',
      asOf: MOCKED_RATE_AS_OF,
      providerCode: MOCKED_PROVIDER_CODE,
    }));
  }

  const usdKrw = normalizeFxRateSnapshot(
    { baseCurrency: 'USD', quoteCurrency: 'KRW' },
    {
      rate: MOCKED_USD_KRW_RATE,
      asOf: MOCKED_RATE_AS_OF,
      source: 'mocked',
      staleState: 'sample',
      providerCode: MOCKED_PROVIDER_CODE,
    },
  );

  if (normalizedBase === 'USD' && normalizedQuote === 'KRW') {
    return toMockedResult(usdKrw);
  }

  if (normalizedBase === 'KRW' && normalizedQuote === 'USD') {
    return toMockedResult(deriveInverseFxSnapshot(usdKrw));
  }

  return buildUnsupportedFxResult(normalizedBase, normalizedQuote, MOCKED_PROVIDER_CODE);
};

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
