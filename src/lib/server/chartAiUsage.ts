import { getSupabaseAdminClient, isSupabaseServerConfigured } from './supabaseAdmin';

// Minimal shape this module needs from the Supabase admin client -- lets tests inject a fake recording
// client (no `.schema()`/`.from()`, so a regression back to `.schema('internal')` would fail to compile
// against this type / throw at the fake). Mirrors the injectable-client pattern already used by
// createSupabaseKisTokenDb in src/lib/server/providers/kis/kisTokenStore.ts.
export type ChartAiUsageRpcClient = {
  rpc: (fn: string, params?: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
};

export type ChartAiUsageState = {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  usageDateKst: string | null;
  reason: 'allowed' | 'limit_reached' | 'usage_guard_unavailable';
};

type UsageRpcRow = {
  allowed?: unknown;
  used_count?: unknown;
  free_limit?: unknown;
  remaining_count?: unknown;
  usage_date_kst?: unknown;
};

// Single authoritative location for the free-tier daily Chart AI analysis limit (Similarity + MK
// Analysis combined). Also the fallback default `p_free_limit` sent to consume_chart_ai_usage_v1.
export const defaultFreeLimit = 3;

const unavailableState: ChartAiUsageState = {
  allowed: false,
  used: 0,
  limit: defaultFreeLimit,
  remaining: 0,
  usageDateKst: null,
  reason: 'usage_guard_unavailable',
};

const toInteger = (value: unknown, fallback: number) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.trunc(number)) : fallback;
};

const normalizeUsageRow = (row: UsageRpcRow | null | undefined): ChartAiUsageState | null => {
  if (!row || typeof row !== 'object') return null;
  if (typeof row.allowed !== 'boolean') return null;
  const limit = toInteger(row.free_limit, defaultFreeLimit);
  const used = toInteger(row.used_count, 0);
  const remaining = toInteger(row.remaining_count, Math.max(limit - used, 0));
  const usageDateKst = typeof row.usage_date_kst === 'string' ? row.usage_date_kst : null;

  return {
    allowed: row.allowed,
    used,
    limit,
    remaining,
    usageDateKst,
    reason: row.allowed ? 'allowed' : 'limit_reached',
  };
};

const firstRow = (data: unknown): UsageRpcRow | null => {
  const row = Array.isArray(data) ? data[0] : data;
  return row && typeof row === 'object' ? (row as UsageRpcRow) : null;
};

/**
 * Reserves one combined Similarity + MK Analysis execution for `userId` on the current Asia/Seoul
 * calendar day via the public.consume_chart_ai_usage_v1 service-role-only bridge (see
 * supabase/migrations/20260723_chart_ai_live_usage_guard.sql). Never uses .schema('internal') --
 * PostgREST does not expose that schema. Fails closed (`usage_guard_unavailable`) on missing server
 * config, RPC error, or a malformed/empty row; never throws; never logs the user id or any RPC payload.
 */
export const consumeChartAiUsage = async (
  userId: string,
  getClient: () => ChartAiUsageRpcClient = () => getSupabaseAdminClient() as unknown as ChartAiUsageRpcClient,
  isConfigured: () => boolean = isSupabaseServerConfigured,
): Promise<ChartAiUsageState> => {
  if (!isConfigured()) return { ...unavailableState };

  try {
    const { data, error } = await getClient().rpc('consume_chart_ai_usage_v1', {
      p_user_id: userId,
      p_free_limit: defaultFreeLimit,
    });

    if (error) return { ...unavailableState };

    const normalized = normalizeUsageRow(firstRow(data));
    return normalized ?? { ...unavailableState };
  } catch {
    return { ...unavailableState };
  }
};

/**
 * Gives back one usage unit reserved by `consumeChartAiUsage` when the reservation never produced a
 * usable analysis (provider/engine failure, insufficient history, internal error) via the
 * public.refund_chart_ai_usage_v1 service-role-only bridge. Best-effort: fails safely and never throws,
 * so a refund failure never surfaces as a route error. Returns null when the guard is unavailable or the
 * refund could not be confirmed -- callers must treat null as "no updated usage state to display",
 * never as an error to propagate.
 */
export const refundChartAiUsage = async (
  userId: string,
  getClient: () => ChartAiUsageRpcClient = () => getSupabaseAdminClient() as unknown as ChartAiUsageRpcClient,
  isConfigured: () => boolean = isSupabaseServerConfigured,
): Promise<ChartAiUsageState | null> => {
  if (!isConfigured()) return null;

  try {
    const { data, error } = await getClient().rpc('refund_chart_ai_usage_v1', {
      p_user_id: userId,
    });

    if (error) return null;
    return normalizeUsageRow(firstRow(data));
  } catch {
    return null;
  }
};
