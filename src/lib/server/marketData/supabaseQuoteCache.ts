import { getSupabaseAdminClient } from '../supabaseAdmin';
import { createProviderError } from '../providers/providerErrors';
import { assertServerRuntime } from '../providers/serverOnly';
import type { CurrencyCode, MarketCode, ProviderErrorEnvelope, ProviderName, QuoteSnapshot, SecurityIdentity } from '../providers/types';
import {
  createQuoteCacheKey,
  getQuoteCacheState,
  QUOTE_CACHE_FRESH_TTL_MS,
  QUOTE_CACHE_STALE_TTL_MS,
  type QuoteCacheEntry,
  type QuoteCacheState,
} from './quoteCache';

const moduleName = 'marketData/supabaseQuoteCache';
const tableName = 'market_quote_cache';
const schemaVersion = 1;
const quoteCacheColumns = [
  'cache_key',
  'symbol',
  'market',
  'provider',
  'source',
  'quote_json',
  'cached_at',
  'expires_at',
  'fresh_until',
  'stale_until',
  'schema_version',
  'last_refresh_status',
  'last_error_code',
  'updated_at',
].join(',');

type SafeSupabaseError = {
  code?: string;
};

type SupabaseSingleResult = {
  data: MarketQuoteCacheRow | null;
  error: SafeSupabaseError | null;
};

type SupabaseMutationResult = {
  error: SafeSupabaseError | null;
};

type SupabaseSelectBuilder = {
  eq(column: 'cache_key', value: string): {
    maybeSingle(): PromiseLike<SupabaseSingleResult>;
  };
};

type SupabaseUpdateBuilder = {
  eq(column: 'cache_key', value: string): PromiseLike<SupabaseMutationResult>;
};

type SupabaseQuoteCacheTable = {
  select(columns: string): SupabaseSelectBuilder;
  upsert(payload: MarketQuoteCacheUpsertPayload, options: { onConflict: 'cache_key' }): PromiseLike<SupabaseMutationResult>;
  update(payload: MarketQuoteCacheFailurePayload): SupabaseUpdateBuilder;
};

export type SupabaseQuoteCacheClient = {
  from(name: typeof tableName): SupabaseQuoteCacheTable;
};

type MarketQuoteCacheRow = {
  cache_key: string;
  symbol: string;
  market: MarketCode;
  provider: string;
  source: string;
  quote_json: unknown;
  cached_at: string;
  expires_at: string;
  fresh_until: string;
  stale_until: string;
  schema_version: number;
  last_refresh_status: string | null;
  last_error_code: string | null;
  updated_at: string;
};

type MarketQuoteCacheUpsertPayload = {
  cache_key: string;
  symbol: string;
  market: MarketCode;
  provider: ProviderName;
  source: string;
  quote_json: Record<string, unknown>;
  cached_at: string;
  expires_at: string;
  fresh_until: string;
  stale_until: string;
  schema_version: typeof schemaVersion;
  last_refresh_status: 'success';
  last_error_code: null;
  updated_at: string;
};

type MarketQuoteCacheFailurePayload = {
  last_refresh_status: 'failure';
  last_error_code: string;
  updated_at: string;
};

export type PersistentQuoteCacheReadResult =
  | { ok: true; entry: (QuoteCacheEntry & { state: QuoteCacheState }) | null }
  | ProviderErrorEnvelope;

export type PersistentQuoteCacheWriteResult =
  | { ok: true; entry: QuoteCacheEntry; payload: MarketQuoteCacheUpsertPayload }
  | ProviderErrorEnvelope;

export type PersistentQuoteCacheFailureResult = { ok: true } | ProviderErrorEnvelope;

type SupabaseQuoteCacheOptions = {
  client?: SupabaseQuoteCacheClient;
  nowMs?: number;
};

const normalizeSymbol = (symbol: string) => symbol.trim().toUpperCase();
const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value));
const readString = (record: Record<string, unknown>, key: string) =>
  typeof record[key] === 'string' ? record[key].trim() : '';
const readOptionalString = (record: Record<string, unknown>, key: string) => readString(record, key) || undefined;
const readNumber = (record: Record<string, unknown>, key: string) =>
  typeof record[key] === 'number' && Number.isFinite(record[key]) ? record[key] : null;
const readOptionalNumber = (record: Record<string, unknown>, key: string) => readNumber(record, key) ?? undefined;

const isMarketCode = (value: unknown): value is MarketCode => value === 'KR' || value === 'US' || value === 'GLOBAL';
const isCurrencyCode = (value: unknown): value is CurrencyCode => value === 'KRW' || value === 'USD' || value === 'OTHER';
const isMarketState = (value: unknown): value is QuoteSnapshot['marketState'] =>
  value === 'open' || value === 'closed' || value === 'delayed' || value === 'unknown';
const allowedLastErrorCodes = new Set([
  'AUTH_REQUIRED',
  'CONFIG_MISSING',
  'PROVIDER_UNAVAILABLE',
  'PROVIDER_RATE_LIMITED',
  'SYMBOL_UNSUPPORTED',
  'CACHE_MISS',
  'DATA_STALE',
  'VALIDATION_FAILED',
  'INTERNAL_ERROR',
  'NOT_IMPLEMENTED',
]);

const getClient = (client?: SupabaseQuoteCacheClient) =>
  client ?? (getSupabaseAdminClient() as unknown as SupabaseQuoteCacheClient);

const safeCacheError = (operation: 'read' | 'write' | 'failure') =>
  createProviderError('PROVIDER_UNAVAILABLE', `Persistent quote cache ${operation} failed safely.`, {
    provider: 'internal',
    staleState: 'unavailable',
  });

const sanitizeLastErrorCode = (code: string) => {
  const normalized = code.trim().toUpperCase();
  return allowedLastErrorCodes.has(normalized) ? normalized : 'UNKNOWN';
};

export const buildSupabaseQuoteCacheKey = (identity: Pick<SecurityIdentity, 'market' | 'symbol'>) =>
  createQuoteCacheKey({ market: identity.market, symbol: normalizeSymbol(identity.symbol) });

const buildSafeQuoteJson = (snapshot: QuoteSnapshot): Record<string, unknown> => ({
  market: snapshot.market,
  symbol: normalizeSymbol(snapshot.symbol),
  ...(snapshot.exchange ? { exchange: snapshot.exchange } : {}),
  ...(snapshot.providerSymbol ? { providerSymbol: snapshot.providerSymbol } : {}),
  price: snapshot.price,
  currency: snapshot.currency,
  change: snapshot.change,
  changePct: snapshot.changePct,
  ...(typeof snapshot.volume === 'number' ? { volume: snapshot.volume } : {}),
  marketState: snapshot.marketState,
  asOf: snapshot.asOf,
  staleState: 'fresh',
});

const buildSnapshotFromRow = (row: MarketQuoteCacheRow): QuoteSnapshot | null => {
  if (!isRecord(row.quote_json)) return null;

  const payload = row.quote_json;
  const market = isMarketCode(payload.market) ? payload.market : row.market;
  const symbol = readString(payload, 'symbol') || row.symbol;
  const price = readNumber(payload, 'price');
  const currency = isCurrencyCode(payload.currency) ? payload.currency : null;
  const marketState = isMarketState(payload.marketState) ? payload.marketState : 'unknown';
  const asOf = readString(payload, 'asOf') || row.cached_at;
  const providerMeta =
    row.provider === 'kis' && row.source === 'kis-domestic-quote'
      ? ({ provider: 'kis', source: 'kis-domestic-quote' } as const)
      : undefined;

  if (!isMarketCode(market) || !symbol || price === null || !currency) return null;

  return {
    market,
    symbol: normalizeSymbol(symbol),
    exchange: readOptionalString(payload, 'exchange'),
    providerSymbol: readOptionalString(payload, 'providerSymbol'),
    price,
    currency,
    change: readNumber(payload, 'change'),
    changePct: readNumber(payload, 'changePct'),
    volume: readOptionalNumber(payload, 'volume'),
    marketState,
    asOf,
    staleState: 'fresh',
    providerMeta,
  };
};

const toCacheEntry = (row: MarketQuoteCacheRow, nowMs: number): (QuoteCacheEntry & { state: QuoteCacheState }) | null => {
  const snapshot = buildSnapshotFromRow(row);
  if (!snapshot) return null;

  const entry: QuoteCacheEntry = {
    snapshot,
    cachedAtMs: Date.parse(row.cached_at),
    freshUntilMs: Date.parse(row.fresh_until),
    staleUntilMs: Date.parse(row.stale_until),
  };

  if (![entry.cachedAtMs, entry.freshUntilMs, entry.staleUntilMs].every(Number.isFinite)) return null;

  const state = getQuoteCacheState(entry, nowMs);
  return {
    ...entry,
    snapshot: {
      ...snapshot,
      staleState: state === 'stale-but-usable' ? 'stale-but-usable' : state === 'expired' ? 'expired' : 'fresh',
    },
    state,
  };
};

export const readSupabaseQuoteCacheEntry = async (
  identity: Pick<SecurityIdentity, 'market' | 'symbol'>,
  options: SupabaseQuoteCacheOptions = {},
): Promise<PersistentQuoteCacheReadResult> => {
  assertServerRuntime(moduleName);
  const nowMs = options.nowMs ?? Date.now();
  const cacheKey = buildSupabaseQuoteCacheKey(identity);

  try {
    const result = await getClient(options.client)
      .from(tableName)
      .select(quoteCacheColumns)
      .eq('cache_key', cacheKey)
      .maybeSingle();

    if (result.error) return safeCacheError('read');
    if (!result.data) return { ok: true, entry: null };

    return { ok: true, entry: toCacheEntry(result.data, nowMs) };
  } catch {
    return safeCacheError('read');
  }
};

export const writeSupabaseQuoteCacheSuccess = async (
  snapshot: QuoteSnapshot,
  options: SupabaseQuoteCacheOptions = {},
): Promise<PersistentQuoteCacheWriteResult> => {
  assertServerRuntime(moduleName);
  const nowMs = options.nowMs ?? Date.now();
  const cachedAt = new Date(nowMs).toISOString();
  const freshUntil = new Date(nowMs + QUOTE_CACHE_FRESH_TTL_MS).toISOString();
  const staleUntil = new Date(nowMs + QUOTE_CACHE_STALE_TTL_MS).toISOString();
  const provider = snapshot.providerMeta?.provider ?? 'internal';
  const source = snapshot.providerMeta?.source ?? 'normalized-quote';
  const payload: MarketQuoteCacheUpsertPayload = {
    cache_key: buildSupabaseQuoteCacheKey(snapshot),
    symbol: normalizeSymbol(snapshot.symbol),
    market: snapshot.market,
    provider,
    source,
    quote_json: buildSafeQuoteJson(snapshot),
    cached_at: cachedAt,
    expires_at: staleUntil,
    fresh_until: freshUntil,
    stale_until: staleUntil,
    schema_version: schemaVersion,
    last_refresh_status: 'success',
    last_error_code: null,
    updated_at: cachedAt,
  };

  try {
    const result = await getClient(options.client).from(tableName).upsert(payload, { onConflict: 'cache_key' });
    if (result.error) return safeCacheError('write');

    return {
      ok: true,
      payload,
      entry: {
        snapshot: {
          ...snapshot,
          symbol: normalizeSymbol(snapshot.symbol),
          staleState: 'fresh',
        },
        cachedAtMs: nowMs,
        freshUntilMs: nowMs + QUOTE_CACHE_FRESH_TTL_MS,
        staleUntilMs: nowMs + QUOTE_CACHE_STALE_TTL_MS,
      },
    };
  } catch {
    return safeCacheError('write');
  }
};

export const writeSupabaseQuoteCacheRefreshFailure = async (
  identity: Pick<SecurityIdentity, 'market' | 'symbol'>,
  errorCode: string,
  options: SupabaseQuoteCacheOptions = {},
): Promise<PersistentQuoteCacheFailureResult> => {
  assertServerRuntime(moduleName);
  const payload: MarketQuoteCacheFailurePayload = {
    last_refresh_status: 'failure',
    last_error_code: sanitizeLastErrorCode(errorCode),
    updated_at: new Date(options.nowMs ?? Date.now()).toISOString(),
  };

  try {
    const result = await getClient(options.client)
      .from(tableName)
      .update(payload)
      .eq('cache_key', buildSupabaseQuoteCacheKey(identity));
    if (result.error) return safeCacheError('failure');
    return { ok: true };
  } catch {
    return safeCacheError('failure');
  }
};
