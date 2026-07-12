/**
 * Phase 3GG-OP-FAST universal instrument search (server-side, provider-neutral).
 *
 * Loads the curated static universal instrument master (real KR six-digit codes + US tickers with
 * KIS overseas EXCD) and ranks matches deterministically. Pure logic: no network, no credentials,
 * no env reads, no raw provider payloads. Importable by both the server search route (.ts) and the
 * credential-free deterministic smoke (.mjs).
 *
 * Ranking (lower rank = higher priority), deterministic tie-break by name then symbol:
 *   exact ticker/code (0) -> exact name (10) -> prefix ticker/code (20) -> prefix name (30)
 *   -> alias/keyword exact (40) -> prefix keyword (50) -> contains (60).
 */

import masterFile from '../../../data/chart-ai/universalInstrumentMaster.json' with { type: 'json' };

export const UNIVERSAL_SEARCH_DEFAULT_LIMIT = 15;
export const UNIVERSAL_SEARCH_MAX_LIMIT = 25;
export const UNIVERSAL_SEARCH_MIN_QUERY_LENGTH = 1;

const MATCH_RANK = {
  'exact-symbol': 0,
  'exact-name': 10,
  'prefix-symbol': 20,
  'prefix-name': 30,
  'exact-keyword': 40,
  'prefix-keyword': 50,
  contains: 60,
};

const normalizeText = (value) =>
  String(value ?? '').normalize('NFKC').trim().replace(/\s+/gu, ' ').toLowerCase();

const deriveProvider = (country) => (country === 'KR' ? 'kis-domestic' : 'kis-overseas');
const deriveCurrency = (country) => (country === 'KR' ? 'KRW' : 'USD');
const deriveMarket = (country) => (country === 'KR' ? '국내' : '미국');

const buildInstrument = (seed) => {
  const keywords = new Set();
  [seed.symbol, seed.displayName, seed.englishName, ...(seed.aliases ?? [])]
    .filter(Boolean)
    .forEach((value) => keywords.add(normalizeText(value)));
  return {
    symbol: seed.symbol,
    displayName: seed.displayName,
    ...(seed.englishName ? { englishName: seed.englishName } : {}),
    country: seed.country,
    exchange: seed.exchange,
    market: deriveMarket(seed.country),
    assetType: seed.assetType,
    currency: deriveCurrency(seed.country),
    provider: deriveProvider(seed.country),
    providerSymbol: seed.symbol,
    exchangeCode: seed.exchangeCode ?? null,
    searchKeywords: [...keywords],
    isActive: true,
  };
};

let cachedInstruments = null;

/** Returns the full, validated, deterministically ordered instrument list (cloned). */
export const loadUniversalInstruments = () => {
  if (cachedInstruments) return cachedInstruments.map((item) => ({ ...item, searchKeywords: [...item.searchKeywords] }));
  const seeds = Array.isArray(masterFile?.instruments) ? masterFile.instruments : [];
  const built = seeds.map(buildInstrument);
  const seen = new Set();
  for (const instrument of built) {
    const key = `${instrument.country}:${instrument.symbol}`;
    if (seen.has(key)) throw new Error(`Duplicate instrument in master: ${key}`);
    seen.add(key);
  }
  built.sort((a, b) =>
    a.country === b.country ? (a.symbol < b.symbol ? -1 : a.symbol > b.symbol ? 1 : 0) : a.country < b.country ? -1 : 1,
  );
  cachedInstruments = built;
  return built.map((item) => ({ ...item, searchKeywords: [...item.searchKeywords] }));
};

export const getUniversalMasterAsOf = () =>
  typeof masterFile?.sourceAsOf === 'string' ? masterFile.sourceAsOf : null;

const resolveMatchRank = (instrument, query) => {
  const symbol = normalizeText(instrument.symbol);
  const name = normalizeText(instrument.displayName);
  const englishName = normalizeText(instrument.englishName ?? '');
  const keywords = instrument.searchKeywords;

  if (symbol === query) return MATCH_RANK['exact-symbol'];
  if (name === query || englishName === query) return MATCH_RANK['exact-name'];
  if (symbol.startsWith(query)) return MATCH_RANK['prefix-symbol'];
  if (name.startsWith(query) || englishName.startsWith(query)) return MATCH_RANK['prefix-name'];
  if (keywords.some((keyword) => keyword === query)) return MATCH_RANK['exact-keyword'];
  if (keywords.some((keyword) => keyword.startsWith(query))) return MATCH_RANK['prefix-keyword'];
  if (keywords.some((keyword) => keyword.includes(query))) return MATCH_RANK.contains;
  if (name.includes(query) || englishName.includes(query)) return MATCH_RANK.contains;
  return null;
};

const clampLimit = (limit) => {
  if (limit === undefined || limit === null || !Number.isFinite(Number(limit))) return UNIVERSAL_SEARCH_DEFAULT_LIMIT;
  return Math.min(UNIVERSAL_SEARCH_MAX_LIMIT, Math.max(1, Math.floor(Number(limit))));
};

/**
 * Deterministic universal search over the static master.
 * @returns { results, resultCount, query, appliedLimit } (results are ranked, filtered, sliced).
 */
export const searchUniversalInstruments = ({ query, country, assetType, limit } = {}) => {
  const normalizedQuery = normalizeText(query ?? '');
  const appliedLimit = clampLimit(limit);
  const countryFilter = country === 'KR' || country === 'US' ? country : null;
  const assetFilter = assetType === 'stock' || assetType === 'etf' ? assetType : null;

  if (normalizedQuery.length < UNIVERSAL_SEARCH_MIN_QUERY_LENGTH) {
    return { results: [], resultCount: 0, query: normalizedQuery, appliedLimit };
  }

  const ranked = loadUniversalInstruments()
    .filter((instrument) => (!countryFilter || instrument.country === countryFilter))
    .filter((instrument) => (!assetFilter || instrument.assetType === assetFilter))
    .map((instrument) => {
      const rank = resolveMatchRank(instrument, normalizedQuery);
      return rank === null ? null : { instrument, rank };
    })
    .filter((entry) => entry !== null)
    .sort((left, right) => {
      if (left.rank !== right.rank) return left.rank - right.rank;
      const nameCompare = normalizeText(left.instrument.displayName).localeCompare(
        normalizeText(right.instrument.displayName),
      );
      if (nameCompare !== 0) return nameCompare;
      return left.instrument.symbol < right.instrument.symbol ? -1 : left.instrument.symbol > right.instrument.symbol ? 1 : 0;
    })
    .slice(0, appliedLimit)
    .map((entry) => entry.instrument);

  return { results: ranked, resultCount: ranked.length, query: normalizedQuery, appliedLimit };
};

/** Resolves a single instrument by exact symbol (optionally scoped by country). */
export const findUniversalInstrument = (symbol, country) => {
  const normalizedSymbol = String(symbol ?? '').normalize('NFKC').trim().toUpperCase();
  const wantedCountry = country === 'KR' || country === 'US' ? country : null;
  const candidates = loadUniversalInstruments().filter(
    (instrument) => instrument.symbol.toUpperCase() === normalizedSymbol,
  );
  if (candidates.length === 0) return null;
  if (wantedCountry) {
    return candidates.find((instrument) => instrument.country === wantedCountry) ?? null;
  }
  return candidates[0];
};
