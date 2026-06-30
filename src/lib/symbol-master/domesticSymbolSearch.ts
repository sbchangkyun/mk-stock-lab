import { getClientSafeDomesticSymbolRecords } from './domesticSymbolMaster';
import {
  DOMESTIC_SYMBOL_SEARCH_DEFAULT_LIMIT,
  DOMESTIC_SYMBOL_SEARCH_MAX_LIMIT,
  searchClientSafeDomesticSymbols,
} from './clientSymbolSearch';
import type { ClientSymbolSearchOptions } from './clientSymbolSearch';
import type { SymbolSearchResult } from './types';

export type DomesticSymbolSearchOptions = ClientSymbolSearchOptions;
export {
  DOMESTIC_SYMBOL_SEARCH_DEFAULT_LIMIT,
  DOMESTIC_SYMBOL_SEARCH_MAX_LIMIT,
};

export function searchDomesticSymbols(
  options: DomesticSymbolSearchOptions,
): SymbolSearchResult[] {
  return searchClientSafeDomesticSymbols(getClientSafeDomesticSymbolRecords(), options);
}
