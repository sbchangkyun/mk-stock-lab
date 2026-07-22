import { getSupabaseAdminClient, isSupabaseServerConfigured } from './supabaseAdmin';

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

const defaultFreeLimit = 3;

const toInteger = (value: unknown, fallback: number) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.trunc(number)) : fallback;
};

const normalizeUsageRow = (row: UsageRpcRow | null | undefined): ChartAiUsageState => {
  const limit = toInteger(row?.free_limit, defaultFreeLimit);
  const used = toInteger(row?.used_count, 0);
  const remaining = toInteger(row?.remaining_count, Math.max(limit - used, 0));
  const allowed = row?.allowed === true;
  const usageDateKst = typeof row?.usage_date_kst === 'string' ? row.usage_date_kst : null;

  return {
    allowed,
    used,
    limit,
    remaining,
    usageDateKst,
    reason: allowed ? 'allowed' : 'limit_reached',
  };
};

export const consumeChartAiUsage = async (userId: string): Promise<ChartAiUsageState> => {
  if (!isSupabaseServerConfigured()) {
    return {
      allowed: false,
      used: 0,
      limit: defaultFreeLimit,
      remaining: 0,
      usageDateKst: null,
      reason: 'usage_guard_unavailable',
    };
  }

  try {
    const { data, error } = await getSupabaseAdminClient()
      .schema('internal')
      .rpc('consume_chart_ai_usage', {
        p_user_id: userId,
        p_free_limit: defaultFreeLimit,
      });

    if (error) {
      return {
        allowed: false,
        used: 0,
        limit: defaultFreeLimit,
        remaining: 0,
        usageDateKst: null,
        reason: 'usage_guard_unavailable',
      };
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row) {
      return {
        allowed: false,
        used: 0,
        limit: defaultFreeLimit,
        remaining: 0,
        usageDateKst: null,
        reason: 'usage_guard_unavailable',
      };
    }

    return normalizeUsageRow(row as UsageRpcRow);
  } catch {
    return {
      allowed: false,
      used: 0,
      limit: defaultFreeLimit,
      remaining: 0,
      usageDateKst: null,
      reason: 'usage_guard_unavailable',
    };
  }
};
