import type { User } from '@supabase/supabase-js';
import {
  getSupabaseAdminClient,
  isSupabaseServerConfigured,
  validateUserFromBearerToken,
} from './supabaseAdmin';

type PortfolioRow = {
  id: string;
  user_id: string;
  name: string;
  base_currency: 'KRW' | 'USD';
  created_at: string;
  updated_at: string;
};

type PositionRow = {
  id: string;
  portfolio_id: string;
  symbol: string;
  market: 'KR' | 'US';
  asset_type: 'stock' | 'etf';
  name: string | null;
  buy_price: number | string;
  quantity: number | string;
  buy_date: string | null;
  memo: string | null;
  currency: 'KRW' | 'USD';
  created_at: string;
  updated_at: string;
};

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

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

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

export const getPortfolioRequestContext = async (request: Request): Promise<ApiResult<{ user: User }>> => {
  const validation = await validateUserFromBearerToken(request.headers.get('authorization'));
  if (!validation.ok) {
    return apiFailure(validation.status, validation.code, validation.message);
  }

  if (!isSupabaseServerConfigured()) {
    return apiFailure(503, 'PORTFOLIO_API_DISABLED', '포트폴리오 API 설정이 아직 완료되지 않았습니다.');
  }

  return apiSuccess({ user: validation.user });
};

export const toErrorResponse = (failure: ApiFailure) =>
  jsonResponse(
    {
      ok: false,
      code: failure.code,
      message: failure.message,
    },
    failure.status,
  );

const asString = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
const fieldLabel = (field: string) => {
  const labels: Record<string, string> = {
    id: 'ID',
    portfolioId: '포트폴리오',
    name: '이름',
    baseCurrency: '기준 통화',
    market: '시장',
    currency: '통화',
    symbol: '티커',
    buyPrice: '매수가',
    quantity: '수량',
  };
  return labels[field] || field;
};

const optionalString = (value: unknown, maxLength: number) => {
  if (value === undefined || value === null) return null;
  const text = asString(value);
  if (!text) return null;
  return text.slice(0, maxLength);
};

const requiredString = (value: unknown, field: string, maxLength: number) => {
  const text = asString(value);
  if (!text) return apiFailure(400, 'INVALID_PAYLOAD', `${fieldLabel(field)} 입력이 필요합니다.`);
  if (text.length > maxLength) return apiFailure(400, 'INVALID_PAYLOAD', `${fieldLabel(field)} 입력이 너무 깁니다.`);
  return apiSuccess(text);
};

const enumValue = <T extends string>(value: unknown, allowed: readonly T[], field: string, fallback?: T) => {
  const raw = typeof value === 'string' ? value.trim().toUpperCase() : '';
  const normalized = allowed.find((item) => item.toUpperCase() === raw) ?? fallback;
  if (!normalized) return apiFailure(400, 'INVALID_PAYLOAD', `${fieldLabel(field)} 값을 확인해 주세요.`);
  return apiSuccess(normalized);
};

const assetTypeValue = (value: unknown) => {
  const raw = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (raw === 'stock' || raw === 'etf') return apiSuccess(raw);
  return apiFailure(400, 'INVALID_PAYLOAD', '자산 유형을 확인해 주세요.');
};

const nonNegativeNumber = (value: unknown, field: string) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    return apiFailure(400, 'INVALID_PAYLOAD', `${fieldLabel(field)} 값을 확인해 주세요.`);
  }
  return apiSuccess(number);
};

const positiveNumber = (value: unknown, field: string) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    return apiFailure(400, 'INVALID_PAYLOAD', `${fieldLabel(field)} 값을 확인해 주세요.`);
  }
  return apiSuccess(number);
};

const optionalDate = (value: unknown) => {
  if (value === undefined || value === null || value === '') return apiSuccess(null);
  if (typeof value !== 'string' || !datePattern.test(value)) {
    return apiFailure(400, 'INVALID_PAYLOAD', '매수일을 확인해 주세요.');
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    return apiFailure(400, 'INVALID_PAYLOAD', '매수일을 확인해 주세요.');
  }

  return apiSuccess(value);
};

const validUuid = (value: unknown, field: string) => {
  if (typeof value !== 'string' || !uuidPattern.test(value)) {
    return apiFailure(400, 'INVALID_PAYLOAD', `${fieldLabel(field)} 값을 확인해 주세요.`);
  }

  return apiSuccess(value);
};

const mapPortfolio = (row: PortfolioRow) => ({
  id: row.id,
  name: row.name,
  baseCurrency: row.base_currency,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapPosition = (row: PositionRow) => ({
  id: row.id,
  portfolioId: row.portfolio_id,
  symbol: row.symbol,
  market: row.market,
  assetType: row.asset_type,
  name: row.name,
  buyPrice: Number(row.buy_price),
  quantity: Number(row.quantity),
  buyDate: row.buy_date,
  memo: row.memo,
  currency: row.currency,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const portfolioSelect = 'id, user_id, name, base_currency, created_at, updated_at';
const positionSelect =
  'id, portfolio_id, symbol, market, asset_type, name, buy_price, quantity, buy_date, memo, currency, created_at, updated_at';

export const listPortfolios = async (userId: string) => {
  const { data, error } = await getSupabaseAdminClient()
    .from('portfolios')
    .select(portfolioSelect)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return apiFailure(500, 'PORTFOLIO_LIST_FAILED', '포트폴리오를 불러오지 못했습니다.');
  return apiSuccess(data.map((row) => mapPortfolio(row as PortfolioRow)));
};

export const createPortfolio = async (userId: string, body: Record<string, unknown>) => {
  const name = requiredString(body.name, 'name', 120);
  if (!name.ok) return name;

  const baseCurrency = enumValue(body.baseCurrency, ['KRW', 'USD'] as const, 'baseCurrency', 'KRW');
  if (!baseCurrency.ok) return baseCurrency;

  const { data, error } = await getSupabaseAdminClient()
    .from('portfolios')
    .insert({
      user_id: userId,
      name: name.data,
      base_currency: baseCurrency.data,
    })
    .select(portfolioSelect)
    .single();

  if (error || !data) return apiFailure(500, 'PORTFOLIO_CREATE_FAILED', '포트폴리오를 만들지 못했습니다.');
  return apiSuccess(mapPortfolio(data as PortfolioRow));
};

export const updatePortfolio = async (userId: string, body: Record<string, unknown>) => {
  const id = validUuid(body.id, 'id');
  if (!id.ok) return id;

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) {
    const name = requiredString(body.name, 'name', 120);
    if (!name.ok) return name;
    updates.name = name.data;
  }

  if (body.baseCurrency !== undefined) {
    const baseCurrency = enumValue(body.baseCurrency, ['KRW', 'USD'] as const, 'baseCurrency');
    if (!baseCurrency.ok) return baseCurrency;
    updates.base_currency = baseCurrency.data;
  }

  if (Object.keys(updates).length === 0) {
    return apiFailure(400, 'INVALID_PAYLOAD', '수정할 포트폴리오 항목이 없습니다.');
  }

  const { data, error } = await getSupabaseAdminClient()
    .from('portfolios')
    .update(updates)
    .eq('id', id.data)
    .eq('user_id', userId)
    .select(portfolioSelect)
    .maybeSingle();

  if (error) return apiFailure(500, 'PORTFOLIO_UPDATE_FAILED', '포트폴리오를 수정하지 못했습니다.');
  if (!data) return apiFailure(404, 'PORTFOLIO_NOT_FOUND', '포트폴리오를 찾을 수 없습니다.');
  return apiSuccess(mapPortfolio(data as PortfolioRow));
};

export const deletePortfolio = async (userId: string, idValue: unknown) => {
  const id = validUuid(idValue, 'id');
  if (!id.ok) return id;

  const { data, error } = await getSupabaseAdminClient()
    .from('portfolios')
    .delete()
    .eq('id', id.data)
    .eq('user_id', userId)
    .select('id')
    .maybeSingle();

  if (error) return apiFailure(500, 'PORTFOLIO_DELETE_FAILED', '포트폴리오를 삭제하지 못했습니다.');
  if (!data) return apiFailure(404, 'PORTFOLIO_NOT_FOUND', '포트폴리오를 찾을 수 없습니다.');
  return apiSuccess({ id: id.data });
};

export const ensurePortfolioOwned = async (userId: string, portfolioIdValue: unknown) => {
  const portfolioId = validUuid(portfolioIdValue, 'portfolioId');
  if (!portfolioId.ok) return portfolioId;

  const { data, error } = await getSupabaseAdminClient()
    .from('portfolios')
    .select('id')
    .eq('id', portfolioId.data)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) return apiFailure(500, 'PORTFOLIO_LOOKUP_FAILED', '포트폴리오를 확인하지 못했습니다.');
  if (!data) return apiFailure(404, 'PORTFOLIO_NOT_FOUND', '포트폴리오를 찾을 수 없습니다.');
  return apiSuccess(portfolioId.data);
};

export const listPositions = async (userId: string, portfolioIdValue: unknown) => {
  const owned = await ensurePortfolioOwned(userId, portfolioIdValue);
  if (!owned.ok) return owned;

  const { data, error } = await getSupabaseAdminClient()
    .from('portfolio_positions')
    .select(positionSelect)
    .eq('portfolio_id', owned.data)
    .order('created_at', { ascending: false });

  if (error || !data) return apiFailure(500, 'POSITION_LIST_FAILED', '보유 종목을 불러오지 못했습니다.');
  return apiSuccess(data.map((row) => mapPosition(row as PositionRow)));
};

export const createPosition = async (userId: string, body: Record<string, unknown>) => {
  const owned = await ensurePortfolioOwned(userId, body.portfolioId);
  if (!owned.ok) return owned;

  const symbol = requiredString(body.symbol, 'symbol', 32);
  if (!symbol.ok) return symbol;

  const market = enumValue(body.market, ['KR', 'US'] as const, 'market');
  if (!market.ok) return market;

  const assetType = assetTypeValue(body.assetType);
  if (!assetType.ok) return assetType;

  const buyPrice = nonNegativeNumber(body.buyPrice, 'buyPrice');
  if (!buyPrice.ok) return buyPrice;

  const quantity = positiveNumber(body.quantity, 'quantity');
  if (!quantity.ok) return quantity;

  const buyDate = optionalDate(body.buyDate);
  if (!buyDate.ok) return buyDate;

  const currency = enumValue(body.currency, ['KRW', 'USD'] as const, 'currency', market.data === 'KR' ? 'KRW' : 'USD');
  if (!currency.ok) return currency;

  const { data, error } = await getSupabaseAdminClient()
    .from('portfolio_positions')
    .insert({
      portfolio_id: owned.data,
      symbol: symbol.data.toUpperCase(),
      market: market.data,
      asset_type: assetType.data,
      name: optionalString(body.name, 160),
      buy_price: buyPrice.data,
      quantity: quantity.data,
      buy_date: buyDate.data,
      memo: optionalString(body.memo, 500),
      currency: currency.data,
    })
    .select(positionSelect)
    .single();

  if (error || !data) return apiFailure(500, 'POSITION_CREATE_FAILED', '보유 종목을 추가하지 못했습니다.');
  return apiSuccess(mapPosition(data as PositionRow));
};

export const updatePosition = async (userId: string, body: Record<string, unknown>) => {
  const id = validUuid(body.id, 'id');
  if (!id.ok) return id;

  const { data: existing, error: lookupError } = await getSupabaseAdminClient()
    .from('portfolio_positions')
    .select('id, portfolio_id')
    .eq('id', id.data)
    .maybeSingle();

  if (lookupError) return apiFailure(500, 'POSITION_LOOKUP_FAILED', '보유 종목을 확인하지 못했습니다.');
  if (!existing) return apiFailure(404, 'POSITION_NOT_FOUND', '보유 종목을 찾을 수 없습니다.');

  const owned = await ensurePortfolioOwned(userId, existing.portfolio_id);
  if (!owned.ok) return apiFailure(404, 'POSITION_NOT_FOUND', '보유 종목을 찾을 수 없습니다.');

  const updates: Record<string, unknown> = {};
  if (body.symbol !== undefined) {
    const symbol = requiredString(body.symbol, 'symbol', 32);
    if (!symbol.ok) return symbol;
    updates.symbol = symbol.data.toUpperCase();
  }
  if (body.market !== undefined) {
    const market = enumValue(body.market, ['KR', 'US'] as const, 'market');
    if (!market.ok) return market;
    updates.market = market.data;
  }
  if (body.assetType !== undefined) {
    const assetType = assetTypeValue(body.assetType);
    if (!assetType.ok) return assetType;
    updates.asset_type = assetType.data;
  }
  if (body.name !== undefined) updates.name = optionalString(body.name, 160);
  if (body.buyPrice !== undefined) {
    const buyPrice = nonNegativeNumber(body.buyPrice, 'buyPrice');
    if (!buyPrice.ok) return buyPrice;
    updates.buy_price = buyPrice.data;
  }
  if (body.quantity !== undefined) {
    const quantity = positiveNumber(body.quantity, 'quantity');
    if (!quantity.ok) return quantity;
    updates.quantity = quantity.data;
  }
  if (body.buyDate !== undefined) {
    const buyDate = optionalDate(body.buyDate);
    if (!buyDate.ok) return buyDate;
    updates.buy_date = buyDate.data;
  }
  if (body.memo !== undefined) updates.memo = optionalString(body.memo, 500);
  if (body.currency !== undefined) {
    const currency = enumValue(body.currency, ['KRW', 'USD'] as const, 'currency');
    if (!currency.ok) return currency;
    updates.currency = currency.data;
  }

  if (Object.keys(updates).length === 0) {
    return apiFailure(400, 'INVALID_PAYLOAD', '수정할 보유 종목 항목이 없습니다.');
  }

  const { data, error } = await getSupabaseAdminClient()
    .from('portfolio_positions')
    .update(updates)
    .eq('id', id.data)
    .eq('portfolio_id', owned.data)
    .select(positionSelect)
    .maybeSingle();

  if (error) return apiFailure(500, 'POSITION_UPDATE_FAILED', '보유 종목을 수정하지 못했습니다.');
  if (!data) return apiFailure(404, 'POSITION_NOT_FOUND', '보유 종목을 찾을 수 없습니다.');
  return apiSuccess(mapPosition(data as PositionRow));
};

export const deletePosition = async (userId: string, idValue: unknown) => {
  const id = validUuid(idValue, 'id');
  if (!id.ok) return id;

  const { data: existing, error: lookupError } = await getSupabaseAdminClient()
    .from('portfolio_positions')
    .select('id, portfolio_id')
    .eq('id', id.data)
    .maybeSingle();

  if (lookupError) return apiFailure(500, 'POSITION_LOOKUP_FAILED', '보유 종목을 확인하지 못했습니다.');
  if (!existing) return apiFailure(404, 'POSITION_NOT_FOUND', '보유 종목을 찾을 수 없습니다.');

  const owned = await ensurePortfolioOwned(userId, existing.portfolio_id);
  if (!owned.ok) return apiFailure(404, 'POSITION_NOT_FOUND', '보유 종목을 찾을 수 없습니다.');

  const { data, error } = await getSupabaseAdminClient()
    .from('portfolio_positions')
    .delete()
    .eq('id', id.data)
    .eq('portfolio_id', owned.data)
    .select('id')
    .maybeSingle();

  if (error) return apiFailure(500, 'POSITION_DELETE_FAILED', '보유 종목을 삭제하지 못했습니다.');
  if (!data) return apiFailure(404, 'POSITION_NOT_FOUND', '보유 종목을 찾을 수 없습니다.');
  return apiSuccess({ id: id.data });
};
