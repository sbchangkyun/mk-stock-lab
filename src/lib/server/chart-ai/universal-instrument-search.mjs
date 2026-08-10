/**
 * Phase 3GG-OP-FAST / 3GG-T-HF3B universal instrument search (server-side, provider-neutral).
 *
 * Loads the generated static universal instrument master (real KR six-digit codes + US tickers with
 * KIS overseas EXCD) and ranks matches deterministically. Pure logic: no network, no credentials,
 * no env reads, no raw provider payloads. Importable by both the server search route (.ts) and the
 * credential-free deterministic smokes (.mjs).
 *
 * HF3B scales this to a large generated master (thousands of rows). The built index is computed ONCE
 * and reused (no full-list clone per request); each query ranks against the cached index and returns
 * only the requested, bounded page. Ranking (lower rank = higher priority):
 *   0 exact symbol/code
 *   1 exact normalized name (KO or EN)
 *   2 symbol/code prefix
 *   3 normalized name prefix (KO or EN)
 *   4 alias exact or alias prefix
 *   5 name token prefix
 *   6 contains
 * Ties break by country -> exchange -> assetType -> normalized name -> symbol (fully deterministic;
 * no popularity ranking, no hidden Samsung-first rule).
 */

import masterFile from '../../../data/chart-ai/universalInstrumentMaster.json' with { type: 'json' };

export const UNIVERSAL_SEARCH_DEFAULT_LIMIT = 20;
export const UNIVERSAL_SEARCH_MAX_LIMIT = 50;
export const UNIVERSAL_SEARCH_MIN_QUERY_LENGTH = 1;

const RANK = {
  EXACT_SYMBOL: 0,
  EXACT_NAME: 1,
  PREFIX_SYMBOL: 2,
  PREFIX_NAME: 3,
  ALIAS: 4,
  TOKEN_PREFIX: 5,
  CONTAINS: 6,
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
let cachedIndex = null;

/** Builds (once) and returns the full validated instrument list. Treat as read-only. */
export const loadUniversalInstruments = () => {
  if (cachedInstruments) return cachedInstruments;
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
  return cachedInstruments;
};

/** Precomputed, normalized search index over the built instruments (computed once). */
const loadIndex = () => {
  if (cachedIndex) return cachedIndex;
  cachedIndex = loadUniversalInstruments().map((instrument) => {
    const nameNorm = normalizeText(instrument.displayName);
    const enNorm = normalizeText(instrument.englishName ?? '');
    const symbolNorm = normalizeText(instrument.symbol);
    const aliasNorms = instrument.searchKeywords.filter((k) => k !== symbolNorm && k !== nameNorm && k !== enNorm);
    const tokens = [...new Set([...nameNorm.split(' '), ...enNorm.split(' ')].filter(Boolean))];
    return { instrument, nameNorm, enNorm, symbolNorm, aliasNorms, tokens };
  });
  return cachedIndex;
};

export const getUniversalMasterAsOf = () =>
  typeof masterFile?.sourceAsOf === 'string' ? masterFile.sourceAsOf : null;

export const getUniversalMasterVersion = () =>
  typeof masterFile?.masterVersion === 'string' ? masterFile.masterVersion : null;

const resolveMatchRank = (entry, query) => {
  if (entry.symbolNorm === query) return RANK.EXACT_SYMBOL;
  if (entry.nameNorm === query || entry.enNorm === query) return RANK.EXACT_NAME;
  if (entry.symbolNorm.startsWith(query)) return RANK.PREFIX_SYMBOL;
  if (entry.nameNorm.startsWith(query) || entry.enNorm.startsWith(query)) return RANK.PREFIX_NAME;
  if (entry.aliasNorms.some((a) => a === query || a.startsWith(query))) return RANK.ALIAS;
  if (entry.tokens.some((t) => t.startsWith(query))) return RANK.TOKEN_PREFIX;
  if (
    entry.nameNorm.includes(query) ||
    entry.enNorm.includes(query) ||
    entry.aliasNorms.some((a) => a.includes(query))
  ) {
    return RANK.CONTAINS;
  }
  return null;
};

const clampLimit = (limit) => {
  if (limit === undefined || limit === null || !Number.isFinite(Number(limit))) return UNIVERSAL_SEARCH_DEFAULT_LIMIT;
  return Math.min(UNIVERSAL_SEARCH_MAX_LIMIT, Math.max(1, Math.floor(Number(limit))));
};

const clampOffset = (offset) => {
  if (offset === undefined || offset === null || !Number.isFinite(Number(offset))) return 0;
  return Math.max(0, Math.floor(Number(offset)));
};

/**
 * Deterministic universal search over the static master, with country/type filters + offset paging.
 * @returns { results, resultCount, total, returned, hasMore, nextOffset, offset, appliedLimit, query }
 */
export const searchUniversalInstruments = ({ query, country, assetType, limit, offset } = {}) => {
  const normalizedQuery = normalizeText(query ?? '');
  const appliedLimit = clampLimit(limit);
  const appliedOffset = clampOffset(offset);
  const countryFilter = country === 'KR' || country === 'US' ? country : null;
  const assetFilter = assetType === 'stock' || assetType === 'etf' ? assetType : null;

  if (normalizedQuery.length < UNIVERSAL_SEARCH_MIN_QUERY_LENGTH) {
    return {
      results: [],
      resultCount: 0,
      total: 0,
      returned: 0,
      hasMore: false,
      nextOffset: null,
      offset: appliedOffset,
      appliedLimit,
      query: normalizedQuery,
    };
  }

  const ranked = loadIndex()
    .filter((entry) => (!countryFilter || entry.instrument.country === countryFilter))
    .filter((entry) => (!assetFilter || entry.instrument.assetType === assetFilter))
    .map((entry) => {
      const rank = resolveMatchRank(entry, normalizedQuery);
      return rank === null ? null : { entry, rank };
    })
    .filter((item) => item !== null)
    .sort((left, right) => {
      if (left.rank !== right.rank) return left.rank - right.rank;
      const a = left.entry;
      const b = right.entry;
      if (a.instrument.country !== b.instrument.country) return a.instrument.country < b.instrument.country ? -1 : 1;
      if (a.instrument.exchange !== b.instrument.exchange) return a.instrument.exchange < b.instrument.exchange ? -1 : 1;
      if (a.instrument.assetType !== b.instrument.assetType) return a.instrument.assetType < b.instrument.assetType ? -1 : 1;
      if (a.nameNorm !== b.nameNorm) return a.nameNorm < b.nameNorm ? -1 : 1;
      return a.instrument.symbol < b.instrument.symbol ? -1 : a.instrument.symbol > b.instrument.symbol ? 1 : 0;
    });

  const total = ranked.length;
  const page = ranked.slice(appliedOffset, appliedOffset + appliedLimit).map((item) => ({ ...item.entry.instrument }));
  const nextOffset = appliedOffset + appliedLimit;
  const hasMore = nextOffset < total;

  return {
    results: page,
    resultCount: page.length,
    total,
    returned: page.length,
    hasMore,
    nextOffset: hasMore ? nextOffset : null,
    offset: appliedOffset,
    appliedLimit,
    query: normalizedQuery,
  };
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

/**
 * Phase 4F-HF2 (PORT identity canonicalization) authoritative EXACT-only resolver. Unlike
 * `searchUniversalInstruments`'s ranked results (which intentionally include prefix/contains
 * matches for a live-typing UI), this is the sole function allowed to back a persistence decision
 * (Portfolio position create/update, legacy-row valuation compatibility). Allowed matches, in
 * order: exact canonical symbol, exact normalized displayName, exact normalized englishName, exact
 * alias ONLY when unique. Any category with more than one exact match is treated as ambiguous and
 * rejected outright (never silently falls through to a weaker category) — prefix/substring input
 * (e.g. "삼성") must never resolve here.
 */
export const resolveUniversalInstrumentExact = ({ query, country } = {}) => {
  const normalizedQuery = normalizeText(query ?? '');
  if (!normalizedQuery) return null;
  const wantedCountry = country === 'KR' || country === 'US' ? country : null;
  const scoped = loadIndex().filter((entry) => !wantedCountry || entry.instrument.country === wantedCountry);

  const bySymbol = scoped.filter((entry) => entry.symbolNorm === normalizedQuery);
  if (bySymbol.length === 1) return { ...bySymbol[0].instrument };
  if (bySymbol.length > 1) return null;

  const byName = scoped.filter((entry) => entry.nameNorm === normalizedQuery);
  if (byName.length === 1) return { ...byName[0].instrument };
  if (byName.length > 1) return null;

  const byEnglish = scoped.filter((entry) => entry.enNorm && entry.enNorm === normalizedQuery);
  if (byEnglish.length === 1) return { ...byEnglish[0].instrument };
  if (byEnglish.length > 1) return null;

  const byAlias = scoped.filter((entry) => entry.aliasNorms.includes(normalizedQuery));
  if (byAlias.length === 1) {
    const matched = byAlias[0];
    // A short alias (e.g. "삼성") can be a unique alias entry for one instrument while still
    // being a generic group/family fragment shared by several distinct instruments' real names
    // (삼성전자, 삼성물산, 삼성SDI, ...). Treat that as ambiguous rather than authoritative: if the
    // query is also a proper prefix of a DIFFERENT instrument's full name, it is not a safe exact
    // identity match.
    const isGenericNamePrefix = scoped.some((entry) => {
      if (entry === matched) return false;
      return (
        (entry.nameNorm && entry.nameNorm !== normalizedQuery && entry.nameNorm.startsWith(normalizedQuery)) ||
        (entry.enNorm && entry.enNorm !== normalizedQuery && entry.enNorm.startsWith(normalizedQuery))
      );
    });
    if (!isGenericNamePrefix) return { ...matched.instrument };
  }
  return null;
};

/**
 * Server-authoritative canonicalization for Portfolio position create/update (Phase 4F-HF2,
 * F-HIGH-03). Only the submitted `symbol` is ever used to look up an instrument; `market` is
 * accepted solely as a disambiguation hint and is never adopted verbatim -- every identity field
 * (symbol/displayName/country/exchange/assetType/currency) the caller persists must come from the
 * resolved canonical instrument. A hint that contradicts the only resolvable instrument (e.g.
 * symbol=005930, market=US) is rejected rather than silently corrected or silently ignored.
 */
export const resolveCanonicalPortfolioInstrument = ({ symbol, market } = {}) => {
  const trimmedSymbol = String(symbol ?? '').trim();
  if (!trimmedSymbol) return { ok: false, code: 'INSTRUMENT_SYMBOL_REQUIRED' };
  const requestedMarket = market === 'KR' || market === 'US' ? market : null;

  if (requestedMarket) {
    const scoped = resolveUniversalInstrumentExact({ query: trimmedSymbol, country: requestedMarket });
    if (scoped) return { ok: true, instrument: scoped };
    const unscoped = resolveUniversalInstrumentExact({ query: trimmedSymbol });
    if (unscoped) return { ok: false, code: 'INSTRUMENT_MARKET_MISMATCH' };
    return { ok: false, code: 'INSTRUMENT_NOT_RESOLVED' };
  }

  const unscoped = resolveUniversalInstrumentExact({ query: trimmedSymbol });
  if (unscoped) return { ok: true, instrument: unscoped };
  return { ok: false, code: 'INSTRUMENT_NOT_RESOLVED' };
};
