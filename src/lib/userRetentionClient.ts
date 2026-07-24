import { getCurrentSession, isSupabaseConfigured } from './supabase';

export class UserRetentionApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export type UserPreferences = {
  lastSurface: 'home' | 'chart_ai' | 'portfolio' | null;
  lastPortfolioId: string | null;
  lastChartMarket: 'KR' | 'US' | null;
  lastChartSymbol: string | null;
  lastChartName: string | null;
  lastChartTimeframe: string | null;
  lastActivityAt: string | null;
  updatedAt: string;
} | null;

export type WatchlistItem = {
  id: string;
  market: 'KR' | 'US';
  symbol: string;
  name: string | null;
  assetType: 'stock' | 'etf';
  createdAt: string;
};

export type RetentionSnapshot = {
  preferences: UserPreferences;
  watchlist: WatchlistItem[];
};

const getAuthHeaders = async () => {
  if (!isSupabaseConfigured()) {
    throw new UserRetentionApiError(503, 'SUPABASE_NOT_CONFIGURED', '로그인 설정이 아직 완료되지 않았습니다.');
  }
  const session = await getCurrentSession();
  if (!session) {
    throw new UserRetentionApiError(401, 'AUTH_REQUIRED', '로그인이 필요합니다.');
  }
  return { Authorization: `Bearer ${session.access_token}`, Accept: 'application/json' };
};

const parseResponse = async <T>(response: Response, key?: string): Promise<T> => {
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.ok) {
    throw new UserRetentionApiError(
      response.status,
      payload?.code || 'RETENTION_API_ERROR',
      payload?.message || '요청을 처리하지 못했습니다.',
    );
  }
  return key ? payload[key] : payload;
};

const requestJson = async <T>(url: string, init: RequestInit = {}, key?: string): Promise<T> => {
  const headers = await getAuthHeaders();
  const response = await fetch(url, {
    ...init,
    headers: { ...headers, ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...init.headers },
  });
  return parseResponse<T>(response, key);
};

/**
 * True only when a session already exists locally -- callers should check this before invoking
 * any retention/watchlist request so signed-out visitors never trigger a network call.
 */
export const hasRetentionSession = async () => {
  if (!isSupabaseConfigured()) return false;
  const session = await getCurrentSession();
  return Boolean(session);
};

const isNotReady = (error: unknown) => error instanceof UserRetentionApiError && error.code === 'RETENTION_API_NOT_READY';

export const userRetentionApi = {
  isNotReady,
  getSnapshot: (): Promise<RetentionSnapshot> => requestJson<RetentionSnapshot>('/api/user/retention'),
  updatePreferences: (updates: Record<string, unknown>) =>
    requestJson<UserPreferences>(
      '/api/user/preferences',
      { method: 'PATCH', body: JSON.stringify(updates) },
      'preferences',
    ),
  listWatchlist: () => requestJson<WatchlistItem[]>('/api/user/watchlist', {}, 'watchlist'),
  addWatchlistItem: (item: { market: 'KR' | 'US'; symbol: string; name?: string | null; assetType: 'stock' | 'etf' }) =>
    requestJson<WatchlistItem>('/api/user/watchlist', { method: 'POST', body: JSON.stringify(item) }, 'item'),
  removeWatchlistItem: (id: string) =>
    requestJson<{ id: string }>('/api/user/watchlist', { method: 'DELETE', body: JSON.stringify({ id }) }),
};
