import { getCurrentSession, isSupabaseConfigured } from './supabase';

export type Portfolio = {
  id: string;
  name: string;
  baseCurrency: 'KRW' | 'USD';
  createdAt: string;
  updatedAt: string;
};

export type PortfolioPosition = {
  id: string;
  portfolioId: string;
  symbol: string;
  market: 'KR' | 'US';
  assetType: 'stock' | 'etf';
  name: string | null;
  buyPrice: number;
  quantity: number;
  buyDate: string | null;
  memo: string | null;
  currency: 'KRW' | 'USD';
  createdAt: string;
  updatedAt: string;
};

export type PortfolioInput = {
  id?: string;
  name: string;
  baseCurrency: 'KRW' | 'USD';
};

export type PositionInput = {
  id?: string;
  portfolioId: string;
  symbol: string;
  market: 'KR' | 'US';
  assetType: 'stock' | 'etf';
  name?: string;
  buyPrice: number;
  quantity: number;
  buyDate?: string;
  memo?: string;
  currency: 'KRW' | 'USD';
};

export type PortfolioValuationUnsupportedReason =
  | 'unsupported_market'
  | 'unsupported_currency'
  | 'market_currency_mismatch'
  | 'missing_symbol'
  | 'invalid_position_data'
  | 'quote_unavailable';

export type PortfolioValuationRow = {
  positionId: string;
  portfolioId: string;
  sourcePortfolioName?: string;
  symbol: string;
  displayName: string;
  market: 'KR' | 'US';
  assetType: 'stock' | 'etf';
  currency: 'KRW' | 'USD';
  quantity: number;
  buyPrice: number;
  costBasis: number;
  supported: boolean;
  currentPrice: number | null;
  marketValue: number | null;
  unrealizedPnl: number | null;
  unrealizedPnlPct: number | null;
  weightPct: number | null;
  quoteAsOf: string | null;
  staleState: 'fresh' | 'stale-but-usable' | 'expired' | 'unavailable' | 'sample' | null;
  unsupportedReason: PortfolioValuationUnsupportedReason | null;
};

export type PortfolioValuationTotals = {
  supportedCostBasis: number;
  supportedMarketValue: number | null;
  supportedUnrealizedPnl: number | null;
  supportedUnrealizedPnlPct: number | null;
  supportedPositionCount: number;
  unsupportedPositionCount: number;
  unavailableQuoteCount: number;
  totalPositionCount: number;
};

export type PortfolioValuationResult = {
  portfolioId: string;
  scope: 'single' | 'all';
  state: 'full' | 'partial' | 'unavailable' | 'empty';
  generatedAt: string;
  rows: PortfolioValuationRow[];
  totals: PortfolioValuationTotals;
  staleState: 'fresh' | 'stale-but-usable' | 'unavailable';
};

export class PortfolioApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'PortfolioApiError';
    this.status = status;
    this.code = code;
  }
}

const getAuthHeaders = async () => {
  if (!isSupabaseConfigured()) {
    throw new PortfolioApiError(503, 'SUPABASE_NOT_CONFIGURED', '포트폴리오 API 설정이 아직 완료되지 않았습니다.');
  }

  const session = await getCurrentSession();
  if (!session) {
    throw new PortfolioApiError(401, 'AUTH_REQUIRED', '로그인이 필요합니다.');
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
    Accept: 'application/json',
  };
};

const parseResponse = async <T>(response: Response, key?: string): Promise<T> => {
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.ok) {
    throw new PortfolioApiError(
      response.status,
      payload?.code || 'PORTFOLIO_API_ERROR',
      payload?.message || '포트폴리오 요청에 실패했습니다.',
    );
  }

  return key ? payload[key] : payload;
};

const requestJson = async <T>(url: string, init: RequestInit = {}, key?: string) => {
  const headers = await getAuthHeaders();
  const response = await fetch(url, {
    ...init,
    headers: {
      ...headers,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });

  return parseResponse<T>(response, key);
};

export const portfolioApi = {
  listPortfolios: () =>
    requestJson<Portfolio[]>('/api/portfolio/portfolios', { method: 'GET' }, 'portfolios'),

  createPortfolio: (input: PortfolioInput) =>
    requestJson<Portfolio>(
      '/api/portfolio/portfolios',
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
      'portfolio',
    ),

  updatePortfolio: (input: PortfolioInput & { id: string }) =>
    requestJson<Portfolio>(
      '/api/portfolio/portfolios',
      {
        method: 'PATCH',
        body: JSON.stringify(input),
      },
      'portfolio',
    ),

  deletePortfolio: (id: string) =>
    requestJson<{ id: string }>(
      '/api/portfolio/portfolios',
      {
        method: 'DELETE',
        body: JSON.stringify({ id }),
      },
      'deleted',
    ),

  listPositions: (portfolioId: string) =>
    requestJson<PortfolioPosition[]>(
      `/api/portfolio/positions?portfolioId=${encodeURIComponent(portfolioId)}`,
      { method: 'GET' },
      'positions',
    ),

  createPosition: (input: PositionInput) =>
    requestJson<PortfolioPosition>(
      '/api/portfolio/positions',
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
      'position',
    ),

  updatePosition: (input: PositionInput & { id: string }) =>
    requestJson<PortfolioPosition>(
      '/api/portfolio/positions',
      {
        method: 'PATCH',
        body: JSON.stringify(input),
      },
      'position',
    ),

  deletePosition: (id: string) =>
    requestJson<{ id: string }>(
      '/api/portfolio/positions',
      {
        method: 'DELETE',
        body: JSON.stringify({ id }),
      },
      'deleted',
    ),

  getValuation: (portfolioId: string) =>
    requestJson<PortfolioValuationResult>(
      '/api/portfolio/valuation',
      {
        method: 'POST',
        body: JSON.stringify({ portfolioId }),
      },
      'valuation',
    ),
};
