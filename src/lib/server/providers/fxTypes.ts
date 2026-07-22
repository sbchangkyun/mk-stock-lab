export type SupportedFxCurrency = 'KRW' | 'USD';

export type FxRateRequest = {
  baseCurrency: SupportedFxCurrency;
  quoteCurrency: SupportedFxCurrency;
  asOf?: string;
};

export type FxRateSource = 'mocked' | 'live' | 'cache' | 'unavailable';

export type FxStaleState = 'fresh' | 'stale-but-usable' | 'sample' | 'unavailable';

export type FxErrorCode =
  | 'FX_CONFIG_MISSING'
  | 'FX_AUTH_REQUIRED'
  | 'FX_PROVIDER_RATE_LIMITED'
  | 'FX_PROVIDER_UNAVAILABLE'
  | 'FX_SYMBOL_UNSUPPORTED'
  | 'FX_RESPONSE_UNEXPECTED'
  | 'FX_STALE_BEYOND_LIMIT'
  | 'FX_UNKNOWN_ERROR';

export type FxRateSnapshot = {
  baseCurrency: SupportedFxCurrency;
  quoteCurrency: SupportedFxCurrency;
  rate: number | null;
  asOf: string | null;
  source: FxRateSource;
  staleState: FxStaleState;
  providerCode?: string;
  errorCode?: FxErrorCode;
};

export type UsableFxRateSnapshot = FxRateSnapshot & {
  rate: number;
  asOf: string;
  source: Exclude<FxRateSource, 'unavailable'>;
  staleState: Exclude<FxStaleState, 'unavailable'>;
  errorCode?: never;
};

export type FxRateResult =
  | {
      ok: true;
      data: UsableFxRateSnapshot;
      staleState: UsableFxRateSnapshot['staleState'];
    }
  | {
      ok: false;
      code: FxErrorCode;
      message: string;
      data: FxRateSnapshot | null;
      staleState: 'unavailable';
      providerCode?: string;
    };
