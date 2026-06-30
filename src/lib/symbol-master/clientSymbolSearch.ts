import { normalizeSearchText } from './normalize';
import type {
  ClientSafeSymbolSearchRecord,
  DomesticAssetType,
  DomesticExchange,
  SymbolLifecycleStatus,
  SymbolSearchMatchType,
  SymbolSearchResult,
} from './types';

export type ClientSymbolSearchOptions = {
  query: string;
  limit?: number;
  assetTypes?: DomesticAssetType[];
  exchanges?: DomesticExchange[];
  includeStatuses?: SymbolLifecycleStatus[];
};

export const DOMESTIC_SYMBOL_SEARCH_DEFAULT_LIMIT = 15;
export const DOMESTIC_SYMBOL_SEARCH_MAX_LIMIT = 20;

const matchScores: Record<SymbolSearchMatchType, number> = {
  'exact-symbol': 0,
  'exact-name-ko': 10,
  'prefix-symbol': 20,
  'prefix-name-ko': 30,
  alias: 40,
  contains: 50,
  fallback: 90,
};

const normalizeLimit = (limit: number | undefined): number => {
  if (limit === undefined || !Number.isFinite(limit)) return DOMESTIC_SYMBOL_SEARCH_DEFAULT_LIMIT;
  return Math.min(DOMESTIC_SYMBOL_SEARCH_MAX_LIMIT, Math.max(1, Math.floor(limit)));
};

const stableTextCompare = (left: string, right: string): number => {
  if (left === right) return 0;
  return left < right ? -1 : 1;
};

const resolveMatchType = (
  record: ClientSafeSymbolSearchRecord,
  query: string,
): SymbolSearchMatchType | null => {
  if (!query) return 'fallback';

  const symbol = normalizeSearchText(record.symbol);
  const nameKo = normalizeSearchText(record.nameKo);
  const nameEn = normalizeSearchText(record.nameEn ?? '');
  const aliases = record.aliases.map(normalizeSearchText);

  if (symbol === query) return 'exact-symbol';
  if (nameKo === query) return 'exact-name-ko';
  if (symbol.startsWith(query)) return 'prefix-symbol';
  if (nameKo.startsWith(query)) return 'prefix-name-ko';
  if (aliases.some((alias) => alias.includes(query))) return 'alias';

  const searchableValues = [record.displaySymbol, record.nameKo, record.nameEn ?? '']
    .map(normalizeSearchText);
  if (searchableValues.some((value) => value.includes(query)) || nameEn.includes(query)) {
    return 'contains';
  }
  return null;
};

export function searchClientSafeDomesticSymbols(
  records: readonly ClientSafeSymbolSearchRecord[],
  options: ClientSymbolSearchOptions,
): SymbolSearchResult[] {
  const query = normalizeSearchText(options.query ?? '');
  const limit = normalizeLimit(options.limit);
  const assetTypeFilter = options.assetTypes?.length ? new Set(options.assetTypes) : null;
  const exchangeFilter = options.exchanges?.length ? new Set(options.exchanges) : null;
  const statusFilter = options.includeStatuses?.length ? new Set(options.includeStatuses) : null;

  return records
    .filter((record) => !assetTypeFilter || assetTypeFilter.has(record.assetType))
    .filter((record) => !exchangeFilter || exchangeFilter.has(record.exchange))
    .filter((record) => !statusFilter || statusFilter.has(record.status))
    .map((record): SymbolSearchResult | null => {
      const matchType = resolveMatchType(record, query);
      return matchType ? { ...record, aliases: [...record.aliases], matchType, score: matchScores[matchType] } : null;
    })
    .filter((result): result is SymbolSearchResult => result !== null)
    .sort((left, right) =>
      left.score - right.score ||
      stableTextCompare(normalizeSearchText(left.nameKo), normalizeSearchText(right.nameKo)) ||
      stableTextCompare(left.symbol, right.symbol))
    .slice(0, limit);
}
