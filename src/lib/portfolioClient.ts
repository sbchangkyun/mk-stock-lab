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
    throw new PortfolioApiError(503, 'SUPABASE_NOT_CONFIGURED', 'Portfolio API is unavailable.');
  }

  const session = await getCurrentSession();
  if (!session) {
    throw new PortfolioApiError(401, 'AUTH_REQUIRED', 'Login is required.');
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
      payload?.message || 'Portfolio request failed.',
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
};
