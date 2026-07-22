/**
 * Canonical, provider-neutral instrument model (Phase 3GG-OP-FAST).
 *
 * One client/server-safe shape describing a searchable Korean or US stock/ETF. It intentionally
 * carries NO provider credentials, NO raw provider payloads, NO internal account identifiers, and
 * NO unsupported metadata presented as known. `providerSymbol` is the code the backing provider
 * uses (e.g. a KIS overseas ticker) and `exchangeCode` is the provider exchange code (e.g. the KIS
 * overseas EXCD) needed to route a real OHLCV request; neither is a secret.
 *
 * This model is the seam the whole universal-search / real-OHLCV feature is built on: search
 * returns `NormalizedInstrument[]`, the OHLCV provider maps a `NormalizedInstrument` to a
 * provider-specific request, and the UI renders selected-symbol state from it.
 */

export type InstrumentCountry = 'KR' | 'US';

export type InstrumentAssetType = 'stock' | 'etf';

export type InstrumentCurrency = 'KRW' | 'USD';

export type InstrumentProvider = 'kis-domestic' | 'kis-overseas';

/**
 * KIS overseas exchange code (EXCD). Only used for US instruments. `null` for KR instruments,
 * which are addressed by six-digit KRX code instead.
 */
export type UsExchangeCode = 'NAS' | 'NYS' | 'AMS' | null;

export type NormalizedInstrument = {
  /** Canonical app-level symbol. KR: six-digit KRX code. US: ticker (e.g. AAPL). */
  symbol: string;
  displayName: string;
  englishName?: string;
  country: InstrumentCountry;
  /** Human-facing exchange label (e.g. KOSPI, NASDAQ, NYSE Arca). */
  exchange: string;
  /** Coarse market label kept for UI display; not a provider code. */
  market: string;
  assetType: InstrumentAssetType;
  currency: InstrumentCurrency;
  provider: InstrumentProvider;
  /** The code the backing provider addresses this instrument by. */
  providerSymbol: string;
  /** Provider exchange code (KIS overseas EXCD) for US; null for KR. */
  exchangeCode: UsExchangeCode;
  /** Lowercase normalized keywords used for search ranking (name, ticker, aliases). */
  searchKeywords: string[];
  isActive: boolean;
};

export const INSTRUMENT_COUNTRIES: readonly InstrumentCountry[] = ['KR', 'US'];
export const INSTRUMENT_ASSET_TYPES: readonly InstrumentAssetType[] = ['stock', 'etf'];

// Phase 3GG-T-HF3B-HF2: KR codes are six-character KRX short codes that are NO LONGER numeric-only —
// KRX has exhausted the numeric space and issues alphanumeric codes (e.g. 0000D0 for newer ETFs). The
// contract is widened to ^[0-9A-Z]{6}$ with ASCII-uppercase normalization; leading zeros are preserved.
const KR_SYMBOL_PATTERN = /^[0-9A-Z]{6}$/;
const US_SYMBOL_PATTERN = /^[A-Z][A-Z0-9.\-]{0,9}$/;

export const isKrSymbol = (value: string): boolean => KR_SYMBOL_PATTERN.test(value.trim().toUpperCase());
export const isUsSymbol = (value: string): boolean => US_SYMBOL_PATTERN.test(value.trim().toUpperCase());

/** Normalizes free text for deterministic, case/width-insensitive keyword matching. */
export const normalizeInstrumentSearchText = (value: string): string =>
  value.normalize('NFKC').trim().replace(/\s+/gu, ' ').toLowerCase();

export const isInstrumentCountry = (value: unknown): value is InstrumentCountry =>
  typeof value === 'string' && (INSTRUMENT_COUNTRIES as readonly string[]).includes(value);

export const isInstrumentAssetType = (value: unknown): value is InstrumentAssetType =>
  typeof value === 'string' && (INSTRUMENT_ASSET_TYPES as readonly string[]).includes(value);

/** Validates one instrument and throws a descriptive error if it is malformed. */
export const assertValidInstrument = (instrument: NormalizedInstrument): void => {
  const { symbol, country, assetType, currency, provider, providerSymbol, exchangeCode } = instrument;
  if (!symbol.trim()) throw new Error('Instrument symbol is required.');
  if (!instrument.displayName.trim()) throw new Error(`Instrument ${symbol} missing displayName.`);
  if (!isInstrumentCountry(country)) throw new Error(`Instrument ${symbol} invalid country.`);
  if (!isInstrumentAssetType(assetType)) throw new Error(`Instrument ${symbol} invalid assetType.`);

  if (country === 'KR') {
    if (!isKrSymbol(symbol)) throw new Error(`KR instrument ${symbol} must be a six-character KRX code.`);
    if (currency !== 'KRW') throw new Error(`KR instrument ${symbol} must be KRW.`);
    if (provider !== 'kis-domestic') throw new Error(`KR instrument ${symbol} must use kis-domestic.`);
    if (exchangeCode !== null) throw new Error(`KR instrument ${symbol} must not carry a US exchange code.`);
  } else {
    if (!isUsSymbol(symbol)) throw new Error(`US instrument ${symbol} must be a valid ticker.`);
    if (currency !== 'USD') throw new Error(`US instrument ${symbol} must be USD.`);
    if (provider !== 'kis-overseas') throw new Error(`US instrument ${symbol} must use kis-overseas.`);
    if (exchangeCode === null) throw new Error(`US instrument ${symbol} requires a KIS overseas exchange code.`);
  }

  if (!providerSymbol.trim()) throw new Error(`Instrument ${symbol} missing providerSymbol.`);
  if (!Array.isArray(instrument.searchKeywords) || instrument.searchKeywords.length === 0) {
    throw new Error(`Instrument ${symbol} requires at least one search keyword.`);
  }
};
