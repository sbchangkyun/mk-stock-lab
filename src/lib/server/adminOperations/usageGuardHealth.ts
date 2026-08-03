/**
 * Phase 3GM: read-only aggregate health view of the Chart AI daily usage guard.
 *
 * Reuses the EXISTING guard store (public.ai_usage_daily, defined in
 * supabase/migrations/20260615_rebuild_schema_v0_1.sql and written to exclusively via the
 * service-role-only public.consume_chart_ai_usage_v1 / refund_chart_ai_usage_v1 bridge functions in
 * supabase/migrations/20260723_chart_ai_live_usage_guard.sql -- see src/lib/server/chartAiUsage.ts).
 * This module ONLY reads public.ai_usage_daily via the existing service-role admin client (which
 * already has unrestricted select/insert/update/delete grants on this table per the base schema
 * migration) and aggregates in application code -- no new table, RPC, or migration is added.
 *
 * Never returns an individual user id, email, or any other per-user identity: only aggregate counts
 * and a single "most recent" timestamp.
 */

import { getSupabaseAdminClient, isSupabaseServerConfigured } from '../supabaseAdmin';
import { defaultFreeLimit } from '../chartAiUsage';
import type { UsageGuardOverview } from './types';

type AiUsageDailyRow = {
  used_count: number;
  free_limit: number;
  user_id: string;
  updated_at: string;
};

// Minimal shape this module needs from the Supabase admin client -- lets tests inject a fake
// recording client (no `.rpc()`, so nothing here can accidentally reuse the write-path RPC bridge).
// Mirrors the injectable-client pattern already used by consumeChartAiUsage in
// src/lib/server/chartAiUsage.ts.
export type UsageGuardReadClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (
        column: string,
        value: string,
      ) => Promise<{ data: AiUsageDailyRow[] | null; error: unknown }>;
    };
  };
};

const getUsageDateKst = (): string => {
  // Same Asia/Seoul calendar-day convention as consume_chart_ai_usage_v1 (`timezone('Asia/Seoul',
  // now())::date`), computed client-side via Intl so no extra DB round trip is needed just to know
  // "today" in KST.
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const year = parts.find((p) => p.type === 'year')?.value ?? '1970';
  const month = parts.find((p) => p.type === 'month')?.value ?? '01';
  const day = parts.find((p) => p.type === 'day')?.value ?? '01';
  return `${year}-${month}-${day}`;
};

const unavailable = (sanitizedErrorCode: string): UsageGuardOverview => ({
  status: 'unavailable',
  storeReady: false,
  usageDateKst: null,
  configuredDailyLimit: defaultFreeLimit,
  totalGuardedExecutionsToday: 0,
  distinctUserCountToday: 0,
  usersAtLimitCountToday: 0,
  mostRecentGuardedExecutionAtIso: null,
  sanitizedErrorCode,
});

export const getUsageGuardOverview = async (
  getClient: () => UsageGuardReadClient = () => getSupabaseAdminClient() as unknown as UsageGuardReadClient,
  isConfigured: () => boolean = isSupabaseServerConfigured,
): Promise<UsageGuardOverview> => {
  if (!isConfigured()) return unavailable('USAGE_GUARD_STORE_UNAVAILABLE');

  const usageDateKst = getUsageDateKst();

  try {
    const { data, error } = await getClient()
      .from('ai_usage_daily')
      .select('used_count, free_limit, user_id, updated_at')
      .eq('usage_date_kst', usageDateKst);

    if (error) return unavailable('USAGE_GUARD_STORE_READ_FAILED');

    const rows = (data ?? []) as AiUsageDailyRow[];
    const distinctUserIds = new Set<string>();
    let totalGuardedExecutionsToday = 0;
    let usersAtLimitCountToday = 0;
    let mostRecentMs: number | null = null;

    for (const row of rows) {
      distinctUserIds.add(row.user_id);
      totalGuardedExecutionsToday += Math.max(0, row.used_count);
      if (row.used_count >= row.free_limit) usersAtLimitCountToday += 1;
      const updatedMs = Date.parse(row.updated_at);
      if (Number.isFinite(updatedMs) && (mostRecentMs === null || updatedMs > mostRecentMs)) {
        mostRecentMs = updatedMs;
      }
    }

    return {
      status: 'healthy',
      storeReady: true,
      usageDateKst,
      configuredDailyLimit: defaultFreeLimit,
      totalGuardedExecutionsToday,
      distinctUserCountToday: distinctUserIds.size,
      usersAtLimitCountToday,
      mostRecentGuardedExecutionAtIso: mostRecentMs === null ? null : new Date(mostRecentMs).toISOString(),
      sanitizedErrorCode: null,
    };
  } catch {
    return unavailable('USAGE_GUARD_STORE_READ_FAILED');
  }
};
