export type DomesticMarket = 'KR';

export type DomesticExchange =
  | 'KOSPI'
  | 'KOSDAQ'
  | 'KONEX'
  | 'ETF'
  | 'ETN'
  | 'UNKNOWN';

export type DomesticAssetType = 'stock' | 'etf' | 'etn' | 'other';

export type SymbolLifecycleStatus =
  | 'active'
  | 'suspended'
  | 'delisted'
  | 'unknown';

export type SymbolSource =
  | 'static'
  | 'kis'
  | 'krx'
  | 'manual'
  | 'mocked';

export type SymbolMasterRecord = {
  symbol: string;
  displaySymbol: string;
  nameKo: string;
  nameEn?: string;
  market: DomesticMarket;
  exchange: DomesticExchange;
  country: 'KR';
  currency: 'KRW';
  assetType: DomesticAssetType;
  status: SymbolLifecycleStatus;
  aliases: string[];
  searchableText: string;
  source: SymbolSource;
  sourceAsOf: string | null;
  updatedAt: string;
};

export type ClientSafeSymbolSearchRecord = {
  symbol: string;
  displaySymbol: string;
  nameKo: string;
  nameEn?: string;
  market: DomesticMarket;
  exchange: DomesticExchange;
  country: 'KR';
  currency: 'KRW';
  assetType: DomesticAssetType;
  status: SymbolLifecycleStatus;
  aliases: string[];
};

export type SymbolSearchMatchType =
  | 'exact-symbol'
  | 'exact-name-ko'
  | 'prefix-symbol'
  | 'prefix-name-ko'
  | 'alias'
  | 'contains'
  | 'fallback';

export type SymbolSearchResult = ClientSafeSymbolSearchRecord & {
  matchType: SymbolSearchMatchType;
  score: number;
};
