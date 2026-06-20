export type MarketCode = 'KR' | 'US' | 'GLOBAL';
export type ProviderName = 'kis' | 'opendart' | 'openai' | 'gemini' | 'internal';
export type CurrencyCode = 'KRW' | 'USD' | 'OTHER';
export type AssetType = 'stock' | 'etf' | 'index' | 'fund' | 'other';
export type ChartInterval = '1d' | '1w' | '1m';
export type FallbackState = 'fresh' | 'stale-but-usable' | 'expired' | 'unavailable' | 'sample';

export type ProviderErrorCode =
  | 'AUTH_REQUIRED'
  | 'CONFIG_MISSING'
  | 'PROVIDER_UNAVAILABLE'
  | 'PROVIDER_RATE_LIMITED'
  | 'SYMBOL_UNSUPPORTED'
  | 'CACHE_MISS'
  | 'DATA_STALE'
  | 'VALIDATION_FAILED'
  | 'INTERNAL_ERROR'
  | 'NOT_IMPLEMENTED';

export type ProviderErrorEnvelope = {
  ok: false;
  code: ProviderErrorCode;
  message: string;
  provider?: ProviderName;
  retryAfterSeconds?: number;
  staleState?: FallbackState;
};

export type ProviderResult<T> =
  | { ok: true; data: T; staleState?: FallbackState; fallback?: QuoteFallbackMetadata }
  | ProviderErrorEnvelope;

export type QuoteFallbackMetadata = {
  state: Extract<FallbackState, 'fresh' | 'stale-but-usable' | 'unavailable'>;
  reason: 'provider-fresh' | 'cache-fresh' | 'cache-stale-provider-failed';
  cache?: {
    hit: boolean;
    state: Extract<FallbackState, 'fresh' | 'stale-but-usable'>;
    cachedAt: string;
    freshUntil: string;
    staleUntil: string;
  };
};

export type ProviderConfigReadiness = {
  provider: ProviderName;
  ready: boolean;
  reason: 'ready' | 'not_implemented' | 'config_missing' | 'approval_required' | 'disabled' | 'production_not_allowed';
  requiredEnvNames: string[];
  missingEnvNames?: string[];
  optionalEnvNames?: string[];
};

export type SecurityIdentity = {
  market: MarketCode;
  symbol: string;
  exchange?: string;
  providerSymbol?: string;
};

export type SecurityMasterRecord = SecurityIdentity & {
  name: string;
  displayName?: string;
  assetType: AssetType;
  sector?: string;
  currency: CurrencyCode;
  corporateCode?: string;
  isSupported: boolean;
  updatedAt: string;
};

export type QuoteSnapshot = SecurityIdentity & {
  price: number;
  currency: CurrencyCode;
  change: number | null;
  changePct: number | null;
  volume?: number;
  marketState: 'open' | 'closed' | 'delayed' | 'unknown';
  asOf: string;
  staleState: FallbackState;
  providerMeta?: {
    provider: Extract<ProviderName, 'kis'>;
    source: 'kis-domestic-quote';
    delayed?: boolean;
  };
};

export type Candle = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

export type ChartSeries = SecurityIdentity & {
  interval: ChartInterval;
  candles: Candle[];
  currency: CurrencyCode;
  asOf: string;
  staleState: FallbackState;
};

export type TreemapConstituent = SecurityIdentity & {
  displayName: string;
  sector: string;
  value: number;
  returnPct: number | null;
  weightPct?: number;
  sourcePortfolios?: string[];
  staleState: FallbackState;
};

export type MomentumTrendPoint = SecurityIdentity & {
  displayName: string;
  shortMomentum: number | null;
  longTrend: number | null;
  returnPct?: number | null;
  weight?: number;
  staleState: FallbackState;
};

export type PortfolioPositionInput = {
  portfolioId: string;
  market: 'KR' | 'US';
  symbol: string;
  name?: string | null;
  assetType: 'stock' | 'etf';
  quantity: number;
  buyPrice: number;
  buyDate?: string | null;
  currency: 'KRW' | 'USD';
};

export type PortfolioValuationRow = PortfolioPositionInput & {
  positionId: string;
  displayName: string;
  currentPrice: number | null;
  marketValue: number | null;
  costBasis: number;
  unrealizedPnl: number | null;
  unrealizedPnlPct: number | null;
  valuationCurrency: 'KRW' | 'USD';
  quoteAsOf?: string;
  staleState: FallbackState;
  sourcePortfolioNames?: string[];
};

export type PortfolioValuationSummary = {
  scope: 'single' | 'all';
  portfolioId?: string;
  rows: PortfolioValuationRow[];
  totalCostBasis: number;
  totalMarketValue: number | null;
  totalUnrealizedPnl: number | null;
  baseCurrency: 'KRW' | 'USD' | 'MIXED';
  staleState: FallbackState;
};

export type DisclosureSummary = {
  title: string;
  date: string;
  category?: string;
  url?: string;
};

export type ChartAiContextPackage = {
  security: Partial<SecurityMasterRecord> & SecurityIdentity;
  quote?: QuoteSnapshot;
  chart?: ChartSeries;
  disclosures?: DisclosureSummary[];
  portfolioExposure?: {
    ownsSecurity: boolean;
    quantity?: number;
    portfolioNames?: string[];
  };
  dataLimitations: string[];
  generatedAt: string;
};

export type ChartAiNarrative = {
  status: 'not_implemented' | 'ready';
  sections: Array<{ title: string; body: string }>;
  limitations: string[];
};

export type ProviderCacheRecord<T> = {
  cacheKey: string;
  provider: ProviderName;
  payload: T;
  cachedAt: string;
  expiresAt: string;
  staleUntil?: string;
  sourceVersion?: string;
};
