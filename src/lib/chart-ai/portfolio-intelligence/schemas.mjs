/**
 * Phase 3GG-S-FAST Portfolio Intelligence — versioned storage schemas + validators (client-safe).
 *
 * Pure module: no network, no credentials, no env, no provider payloads. Defines the localStorage
 * namespaces, capacity limits, the normalized (OP-FAST) instrument shape stored, and strict
 * validators so corrupted/oversized/hostile entries are rejected safely. Stores NO secrets, prompts,
 * model names, raw provider payloads, raw LLM output, or full OHLCV arrays.
 */

export const SCHEMA_VERSION = 1;

export const STORAGE_KEYS = {
  watchlist: 'mkStockLab.watchlist.v1',
  recent: 'mkStockLab.recentSymbols.v1',
  saved: 'mkStockLab.savedAnalyses.v1',
  portfolio: 'mkStockLab.manualPortfolio.v1',
  settings: 'mkStockLab.portfolioSettings.v1',
};

export const LIMITS = {
  watchlist: 50,
  recent: 20,
  saved: 30,
  holdings: 50,
  note: 200,
  label: 60,
};

export const SUPPORTED_COUNTRIES = ['KR', 'US'];
export const SUPPORTED_ASSET_TYPES = ['stock', 'etf'];
export const SUPPORTED_CURRENCIES = ['KRW', 'USD'];
export const SUPPORTED_ANALYSIS_TYPES = ['similarity', 'mk-ai', 'combined'];

const KR_SYMBOL = /^\d{6}$/;
const US_SYMBOL = /^[A-Z][A-Z0-9.\-]{0,9}$/;

export const isSupportedCountry = (v) => SUPPORTED_COUNTRIES.includes(v);
export const isSupportedAssetType = (v) => SUPPORTED_ASSET_TYPES.includes(v);
export const isSupportedCurrency = (v) => SUPPORTED_CURRENCIES.includes(v);

/** Strips control characters (codepoint < 32 or 127) and caps length. Never returns non-string. */
export const sanitizeText = (value, max) => {
  const s = typeof value === 'string' ? value : '';
  let cleaned = '';
  for (const ch of s) {
    const code = ch.codePointAt(0);
    cleaned += code < 32 || code === 127 ? ' ' : ch;
  }
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned.slice(0, Math.max(0, max || 200));
};

export const toFinitePositive = (value) => {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
};

export const toFiniteNonNegative = (value) => {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

const deriveProvider = (country) => (country === 'KR' ? 'kis-domestic' : 'kis-overseas');

/**
 * Normalizes a raw instrument (from the search UI `mapApiResult` shape OR a stored record) into the
 * canonical OP-FAST stored shape. Returns null when the instrument is invalid/unsupported.
 */
export const normalizeInstrument = (raw) => {
  if (!raw || typeof raw !== 'object') return null;
  const country = raw.country === 'US' ? 'US' : raw.country === 'KR' ? 'KR' : null;
  if (!country) return null;
  const symbol = String(raw.symbol ?? '').trim().toUpperCase();
  const pattern = country === 'KR' ? KR_SYMBOL : US_SYMBOL;
  if (!pattern.test(symbol)) return null;
  const assetType = raw.assetType === 'etf' ? 'etf' : raw.assetType === 'stock' ? 'stock' : null;
  if (!assetType) return null;
  const currency = raw.currency === 'USD' || raw.currency === 'KRW' ? raw.currency : country === 'US' ? 'USD' : 'KRW';
  const displayName = sanitizeText(raw.displayName ?? raw.nameKo ?? symbol, 80) || symbol;
  const englishName = raw.englishName ? sanitizeText(raw.englishName, 80) : undefined;
  const exchange = sanitizeText(raw.exchange ?? '', 40);
  const market = sanitizeText(raw.market ?? (country === 'US' ? '미국' : '국내'), 20);
  return {
    symbol,
    displayName,
    ...(englishName ? { englishName } : {}),
    country,
    exchange,
    market,
    assetType,
    currency,
    provider: deriveProvider(country),
    providerSymbol: symbol,
    isActive: true,
  };
};

export const isValidInstrument = (inst) => normalizeInstrument(inst) !== null;

/** Canonical dedupe key: country + symbol. */
export const instrumentKey = (inst) => `${inst?.country}:${String(inst?.symbol ?? '').toUpperCase()}`;

/** Validates one manual-holding record; returns a clean record or null. */
export const normalizeHolding = (raw) => {
  const instrument = normalizeInstrument(raw?.instrument);
  if (!instrument) return null;
  const quantity = toFinitePositive(raw?.quantity);
  const averagePrice = toFiniteNonNegative(raw?.averagePrice);
  if (quantity === null || averagePrice === null) return null;
  return {
    id: typeof raw?.id === 'string' && raw.id ? raw.id : `${instrumentKey(instrument)}`,
    instrument,
    quantity,
    averagePrice,
    currency: instrument.currency,
    note: sanitizeText(raw?.note ?? '', LIMITS.note),
    createdAt: typeof raw?.createdAt === 'string' ? raw.createdAt : null,
    updatedAt: typeof raw?.updatedAt === 'string' ? raw.updatedAt : null,
  };
};

/** Validates one saved-analysis snapshot; returns a clean record or null. */
export const normalizeSavedAnalysis = (raw) => {
  const instrument = normalizeInstrument(raw?.instrument);
  if (!instrument) return null;
  if (!SUPPORTED_ANALYSIS_TYPES.includes(raw?.analysisType)) return null;
  const summary = raw?.summary && typeof raw.summary === 'object' && !Array.isArray(raw.summary) ? raw.summary : null;
  if (!summary) return null;
  // Reject any forbidden field that must never be stored (raw payloads, prompts, models, OHLCV).
  const flat = JSON.stringify(summary).toLowerCase();
  if (/openai|sk-|bearer |kis_app|prompt|gpt-|"candles"|"normalizedpath"|"ohlcv"/.test(flat)) return null;
  return {
    id: typeof raw?.id === 'string' && raw.id ? raw.id : `${instrumentKey(instrument)}:${raw?.analysisType}`,
    instrument,
    analysisType: raw.analysisType,
    methodVersion: sanitizeText(raw?.methodVersion ?? '', 60),
    summary,
    dataAsOf: sanitizeText(raw?.dataAsOf ?? '', 40),
    sourceStatus: sanitizeText(raw?.sourceStatus ?? '', 20),
    dataCompleteness: toFiniteNonNegative(raw?.dataCompleteness),
    label: sanitizeText(raw?.label ?? '', LIMITS.label),
    savedAt: typeof raw?.savedAt === 'string' ? raw.savedAt : null,
  };
};
