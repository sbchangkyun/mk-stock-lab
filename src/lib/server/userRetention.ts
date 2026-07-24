import { getSupabaseAdminClient, isSupabaseServerConfigured, validateUserFromBearerToken } from './supabaseAdmin';
import { ensurePortfolioOwned } from './portfolio';
import { isKrSymbol, isUsSymbol } from '../market-data/instrument';

type ApiFailure = {
  ok: false;
  status: number;
  code: string;
  message: string;
};

type ApiSuccess<T> = {
  ok: true;
  data: T;
};

type ApiResult<T> = ApiSuccess<T> | ApiFailure;

const MAX_WATCHLIST_ITEMS = 50;

const SURFACES = ['home', 'chart_ai', 'portfolio', 'lab'] as const;
const MARKETS = ['KR', 'US'] as const;
const ASSET_TYPES = ['stock', 'etf'] as const;
// Exact set of timeframes Chart AI's real-chart UI supports (src/pages/chart-ai.astro data-range
// buttons, assigned to `activeRange`) -- not a length bound. Kept in sync with the migration's
// `last_chart_timeframe` CHECK constraint.
const CHART_TIMEFRAMES = ['1m', '3m', '6m', '1y'] as const;

type PreferencesRow = {
  user_id: string;
  last_surface: (typeof SURFACES)[number] | null;
  last_portfolio_id: string | null;
  last_chart_market: (typeof MARKETS)[number] | null;
  last_chart_symbol: string | null;
  last_chart_name: string | null;
  last_chart_timeframe: string | null;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
};

type WatchlistRow = {
  id: string;
  user_id: string;
  market: (typeof MARKETS)[number];
  symbol: string;
  name: string | null;
  asset_type: (typeof ASSET_TYPES)[number];
  created_at: string;
  updated_at: string;
};

export const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });

export const methodNotAllowed = () =>
  jsonResponse(
    {
      ok: false,
      code: 'METHOD_NOT_ALLOWED',
      message: '허용되지 않는 요청 방식입니다.',
    },
    405,
  );

export const apiFailure = (status: number, code: string, message: string): ApiFailure => ({
  ok: false,
  status,
  code,
  message,
});

export const apiSuccess = <T>(data: T): ApiSuccess<T> => ({ ok: true, data });

export const toErrorResponse = (failure: ApiFailure) =>
  jsonResponse(
    {
      ok: false,
      code: failure.code,
      message: failure.message,
    },
    failure.status,
  );

export const readJsonBody = async (request: Request): Promise<ApiResult<Record<string, unknown>>> => {
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return apiFailure(400, 'INVALID_PAYLOAD', '요청 내용을 확인해 주세요.');
    }
    return apiSuccess(body as Record<string, unknown>);
  } catch {
    return apiFailure(400, 'INVALID_PAYLOAD', '요청 내용을 확인해 주세요.');
  }
};

export const getRetentionRequestContext = async (request: Request) => {
  const validation = await validateUserFromBearerToken(request.headers.get('authorization'));
  if (!validation.ok) {
    return apiFailure(validation.status, validation.code, validation.message);
  }

  if (!isSupabaseServerConfigured()) {
    return apiFailure(503, 'RETENTION_API_DISABLED', '내 정보 저장 기능이 아직 준비되지 않았습니다.');
  }

  return apiSuccess({ user: validation.user });
};

/**
 * The Phase 3GI migration creating public.user_preferences / public.user_watchlist_items is
 * intentionally not applied by this change (owner-confirm item). Any read/write against those
 * tables before the migration is applied must degrade to a sanitized RETENTION_API_NOT_READY
 * response, never a raw Postgres/PostgREST error.
 */
export const isMissingRetentionTableError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false;
  const code = (error as { code?: string }).code;
  const message = (error as { message?: string }).message ?? '';
  return code === '42P01' || code === 'PGRST205' || /does not exist|could not find the table/i.test(message);
};

const mapDbError = (error: unknown, fallbackCode: string, fallbackMessage: string): ApiFailure => {
  if (isMissingRetentionTableError(error)) {
    return apiFailure(503, 'RETENTION_API_NOT_READY', '내 정보 저장 기능이 아직 준비되지 않았습니다.');
  }
  return apiFailure(500, fallbackCode, fallbackMessage);
};

export const asString = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

// Exported for direct pure-function testing (mirrors the Phase 3GH precedent of extracting
// sanitized-classification logic out of the DB-touching route for smoke coverage without a
// live Supabase connection). Note there is intentionally no free-form URL field anywhere in this
// validation surface -- only these bounded/enum/UUID-checked fields -- so an "arbitrary URL"
// can never be persisted by construction, not by an explicit rejection branch.
export const optionalEnum = <T extends string>(value: unknown, allowed: readonly T[], field: string) => {
  if (value === undefined) return apiSuccess(undefined);
  if (value === null) return apiSuccess(null);
  const raw = asString(value);
  const normalized = allowed.find((item) => item === raw);
  if (!normalized) return apiFailure(400, 'INVALID_PAYLOAD', `${field} 값을 확인해 주세요.`);
  return apiSuccess(normalized);
};

export const optionalBoundedString = (value: unknown, maxLength: number, field: string) => {
  if (value === undefined) return apiSuccess(undefined);
  if (value === null) return apiSuccess(null);
  if (typeof value !== 'string') return apiFailure(400, 'INVALID_PAYLOAD', `${field} 값을 확인해 주세요.`);
  const text = value.trim();
  if (!text) return apiSuccess(null);
  if (text.length > maxLength) return apiFailure(400, 'INVALID_PAYLOAD', `${field} 값이 너무 깁니다.`);
  return apiSuccess(text);
};

const mapPreferences = (row: PreferencesRow | null) =>
  row
    ? {
        lastSurface: row.last_surface,
        lastPortfolioId: row.last_portfolio_id,
        lastChartMarket: row.last_chart_market,
        lastChartSymbol: row.last_chart_symbol,
        lastChartName: row.last_chart_name,
        lastChartTimeframe: row.last_chart_timeframe,
        lastActivityAt: row.last_activity_at,
        updatedAt: row.updated_at,
      }
    : null;

const mapWatchlistItem = (row: WatchlistRow) => ({
  id: row.id,
  market: row.market,
  symbol: row.symbol,
  name: row.name,
  assetType: row.asset_type,
  createdAt: row.created_at,
});

const preferencesSelect =
  'user_id, last_surface, last_portfolio_id, last_chart_market, last_chart_symbol, last_chart_name, last_chart_timeframe, last_activity_at, created_at, updated_at';
const watchlistSelect = 'id, user_id, market, symbol, name, asset_type, created_at, updated_at';

export const getPreferences = async (userId: string) => {
  const { data, error } = await getSupabaseAdminClient()
    .from('user_preferences')
    .select(preferencesSelect)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) return mapDbError(error, 'RETENTION_PREFERENCES_LOAD_FAILED', '설정을 불러오지 못했습니다.');
  return apiSuccess(mapPreferences((data as PreferencesRow | null) ?? null));
};

export const listWatchlistItems = async (userId: string) => {
  const { data, error } = await getSupabaseAdminClient()
    .from('user_watchlist_items')
    .select(watchlistSelect)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(MAX_WATCHLIST_ITEMS);

  if (error || !data) return mapDbError(error, 'WATCHLIST_LIST_FAILED', '관심 종목을 불러오지 못했습니다.');
  return apiSuccess(data.map((row) => mapWatchlistItem(row as WatchlistRow)));
};

export const getRetentionSnapshot = async (userId: string) => {
  const preferences = await getPreferences(userId);
  if (!preferences.ok) return preferences;

  const watchlist = await listWatchlistItems(userId);
  if (!watchlist.ok) return watchlist;

  return apiSuccess({ preferences: preferences.data, watchlist: watchlist.data });
};

const CHART_FIELDS = ['lastChartMarket', 'lastChartSymbol', 'lastChartName', 'lastChartTimeframe'] as const;

export type ChartResumeStateUpdate = {
  last_chart_market: (typeof MARKETS)[number] | null;
  last_chart_symbol: string | null;
  last_chart_name: string | null;
  last_chart_timeframe: (typeof CHART_TIMEFRAMES)[number] | null;
};

/**
 * Pure validation for the Chart AI resume-state quad, extracted out of updatePreferences (which
 * also performs a DB write) so it can be unit-tested directly without a Supabase connection --
 * mirrors this module's existing precedent for optionalEnum/optionalBoundedString. Chart resume
 * state is only ever meaningful as a complete unit: either fully cleared (all four fields
 * explicitly null) or fully identified (market + symbol both present; name/timeframe optional
 * within that). Returns `null` when none of the four chart fields are present in `body` (nothing
 * to validate/update this call).
 */
export const validateChartResumeState = (body: Record<string, unknown>): ApiResult<ChartResumeStateUpdate> | null => {
  const chartFieldsPresent = CHART_FIELDS.filter((field) => Object.prototype.hasOwnProperty.call(body, field));
  if (chartFieldsPresent.length === 0) return null;
  if (chartFieldsPresent.length !== CHART_FIELDS.length) {
    return apiFailure(400, 'INVALID_PAYLOAD', '차트 상태 값을 모두 함께 보내주세요.');
  }

  const marketResult = optionalEnum(body.lastChartMarket, MARKETS, '시장');
  if (!marketResult.ok) return marketResult;
  const market = marketResult.data ?? null;

  const rawSymbol = body.lastChartSymbol;
  let symbol: string | null = null;
  if (rawSymbol !== null && rawSymbol !== undefined) {
    if (typeof rawSymbol !== 'string') {
      return apiFailure(400, 'INVALID_PAYLOAD', '종목 코드 값을 확인해 주세요.');
    }
    const trimmed = rawSymbol.trim().toUpperCase();
    if (trimmed) {
      if (market === 'KR' && isKrSymbol(trimmed)) {
        symbol = trimmed;
      } else if (market === 'US' && isUsSymbol(trimmed)) {
        symbol = trimmed;
      } else {
        return apiFailure(400, 'INVALID_PAYLOAD', '종목 코드 형식을 확인해 주세요.');
      }
    }
  }

  const nameResult = optionalBoundedString(body.lastChartName, 160, '종목명');
  if (!nameResult.ok) return nameResult;
  const name = nameResult.data ?? null;

  const timeframeResult = optionalEnum(body.lastChartTimeframe, CHART_TIMEFRAMES, '기간');
  if (!timeframeResult.ok) return timeframeResult;
  const timeframe = timeframeResult.data ?? null;

  const isFullyCleared = market === null && symbol === null && name === null && timeframe === null;
  const isFullyIdentified = market !== null && symbol !== null;
  if (!isFullyCleared && !isFullyIdentified) {
    return apiFailure(400, 'INVALID_PAYLOAD', '차트 상태가 올바르지 않습니다.');
  }

  return apiSuccess({
    last_chart_market: market,
    last_chart_symbol: symbol,
    last_chart_name: name,
    last_chart_timeframe: timeframe,
  });
};

/**
 * Pure validation reused by both Chart AI resume state and the watchlist (§5D) -- the same KR/US
 * symbol contract, never a third convention. Returns the normalized (trimmed, uppercased) symbol
 * on success.
 */
export const validateMarketSymbol = (market: (typeof MARKETS)[number], rawSymbol: string): ApiResult<string> => {
  const trimmed = rawSymbol.trim().toUpperCase();
  const valid = (market === 'KR' && isKrSymbol(trimmed)) || (market === 'US' && isUsSymbol(trimmed));
  if (!valid) return apiFailure(400, 'INVALID_PAYLOAD', '종목 코드 형식을 확인해 주세요.');
  return apiSuccess(trimmed);
};

export const updatePreferences = async (userId: string, body: Record<string, unknown>) => {
  const updates: Record<string, unknown> = {};

  const lastSurface = optionalEnum(body.lastSurface, SURFACES, '화면 위치');
  if (!lastSurface.ok) return lastSurface;
  if (lastSurface.data !== undefined) updates.last_surface = lastSurface.data;

  if (body.lastPortfolioId !== undefined) {
    if (body.lastPortfolioId === null) {
      updates.last_portfolio_id = null;
    } else {
      const owned = await ensurePortfolioOwned(userId, body.lastPortfolioId);
      if (!owned.ok) return owned;
      updates.last_portfolio_id = owned.data;
    }
  }

  const chartState = validateChartResumeState(body);
  if (chartState) {
    if (!chartState.ok) return chartState;
    Object.assign(updates, chartState.data);
  }

  // The activity timestamp is always server-generated -- a client-supplied value is never trusted
  // or even read, so a caller cannot backdate/forward-date this column.
  updates.last_activity_at = new Date().toISOString();

  const { data, error } = await getSupabaseAdminClient()
    .from('user_preferences')
    .upsert({ user_id: userId, ...updates }, { onConflict: 'user_id' })
    .select(preferencesSelect)
    .single();

  if (error || !data) return mapDbError(error, 'RETENTION_PREFERENCES_UPDATE_FAILED', '설정을 저장하지 못했습니다.');
  return apiSuccess(mapPreferences(data as PreferencesRow));
};

const requiredMarket = (value: unknown) => optionalEnum(value, MARKETS, '시장');
const requiredAssetType = (value: unknown) => optionalEnum(value, ASSET_TYPES, '자산 유형');

export const addWatchlistItem = async (userId: string, body: Record<string, unknown>) => {
  const market = requiredMarket(body.market);
  if (!market.ok) return market;
  if (!market.data) return apiFailure(400, 'INVALID_PAYLOAD', '시장 값을 확인해 주세요.');

  const symbolResult = validateMarketSymbol(market.data, asString(body.symbol));
  if (!symbolResult.ok) return symbolResult;
  const symbol = symbolResult.data;

  const assetType = requiredAssetType(body.assetType);
  if (!assetType.ok) return assetType;
  if (!assetType.data) return apiFailure(400, 'INVALID_PAYLOAD', '자산 유형을 확인해 주세요.');

  const name = optionalBoundedString(body.name, 160, '종목명');
  if (!name.ok) return name;

  const existing = await getSupabaseAdminClient()
    .from('user_watchlist_items')
    .select('id')
    .eq('user_id', userId)
    .eq('market', market.data)
    .eq('symbol', symbol)
    .maybeSingle();

  if (existing.error) return mapDbError(existing.error, 'WATCHLIST_LOOKUP_FAILED', '관심 종목을 확인하지 못했습니다.');
  if (existing.data) {
    const list = await listWatchlistItems(userId);
    if (!list.ok) return list;
    const item = list.data.find((row) => row.id === existing.data!.id);
    return item ? apiSuccess(item) : apiFailure(500, 'WATCHLIST_ADD_FAILED', '관심 종목을 추가하지 못했습니다.');
  }

  const { count, error: countError } = await getSupabaseAdminClient()
    .from('user_watchlist_items')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (countError) return mapDbError(countError, 'WATCHLIST_LOOKUP_FAILED', '관심 종목을 확인하지 못했습니다.');
  if ((count ?? 0) >= MAX_WATCHLIST_ITEMS) {
    return apiFailure(400, 'WATCHLIST_LIMIT_EXCEEDED', `관심 종목은 최대 ${MAX_WATCHLIST_ITEMS}개까지 등록할 수 있습니다.`);
  }

  const { data, error } = await getSupabaseAdminClient()
    .from('user_watchlist_items')
    .insert({
      user_id: userId,
      market: market.data,
      symbol,
      name: name.data ?? null,
      asset_type: assetType.data,
    })
    .select(watchlistSelect)
    .single();

  if (error || !data) return mapDbError(error, 'WATCHLIST_ADD_FAILED', '관심 종목을 추가하지 못했습니다.');
  return apiSuccess(mapWatchlistItem(data as WatchlistRow));
};

export const removeWatchlistItem = async (userId: string, idValue: unknown) => {
  const id = asString(idValue);
  if (!id) return apiFailure(400, 'INVALID_PAYLOAD', 'ID 값을 확인해 주세요.');

  const { data, error } = await getSupabaseAdminClient()
    .from('user_watchlist_items')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .select('id')
    .maybeSingle();

  if (error) return mapDbError(error, 'WATCHLIST_REMOVE_FAILED', '관심 종목을 삭제하지 못했습니다.');
  if (!data) return apiFailure(404, 'WATCHLIST_ITEM_NOT_FOUND', '관심 종목을 찾을 수 없습니다.');
  return apiSuccess({ id });
};
