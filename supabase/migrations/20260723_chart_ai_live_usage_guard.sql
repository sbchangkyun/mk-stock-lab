-- Phase 3GG-U: public PostgREST RPC bridge for the live Chart AI daily usage guard.
-- Apply via Supabase Dashboard > SQL Editor (do NOT execute via Claude Code). Additive, forward-only.
--
-- Why: PostgREST does not expose the `internal` schema (PGRST106) -- the same class of gap the KIS token
-- bridge (20260714_kis_token_postgrest_rpc_bridge.sql) fixed for the token store. This migration applies
-- the identical public/service-role-only bridge pattern to the Chart AI usage guard so the live Similarity
-- and MK Analysis routes (src/lib/server/chartAiUsage.ts, which calls this public bridge via
-- getSupabaseAdminClient().rpc(...), never `.schema('internal')`) can enforce a combined daily execution
-- limit without exposing `internal` through PostgREST.
--
-- Design: public.consume_chart_ai_usage_v1 is a self-contained, atomic, policy-pinned upsert on the
-- existing public.ai_usage_daily table (defined in 20260615_rebuild_schema_v0_1.sql). It deliberately does
-- NOT call internal.consume_chart_ai_usage(uuid, integer) -- that internal function stores
-- free_limit = greatest(stored, incoming) and gates eligibility on used_count < stored free_limit, so a
-- pre-existing row carrying a historically higher (or lower) free_limit would authorize a different number
-- of executions than the current approved policy. The approved policy is EXACTLY 3 combined Similarity +
-- MK Analysis executions per authenticated user per Asia/Seoul calendar day, and the server-provided
-- p_free_limit is always authoritative: the stored free_limit is pinned to p_free_limit on every call
-- (never greatest(), and corrected even when the call is rejected), and eligibility is checked against
-- p_free_limit directly, never against any previously stored value. internal.consume_chart_ai_usage is
-- left completely unmodified; it is simply no longer on this path. public.refund_chart_ai_usage_v1 is new:
-- it lets a route give back one usage unit when a reserved execution never produced a usable analysis
-- (provider/engine failure), so only completed analyses count against the daily allowance. Both operate on
-- the existing public.ai_usage_daily table -- no replacement table is created. Both are SECURITY DEFINER
-- with an empty search_path and fully qualified object names, and both are revoked from
-- public/anon/authenticated and granted to service_role only.
--
-- Boundary: no user-callable RPC is added here. Neither function returns anything beyond the sanitized
-- usage-counter fields (allowed/used_count/free_limit/remaining_count/usage_date_kst) -- no email, token,
-- session, IP, account, or profile data. No existing KIS token migration or object is modified, and the
-- already-applied internal.consume_chart_ai_usage function is not altered.

-- ============================================================
-- 1. public.consume_chart_ai_usage_v1 -> atomic, policy-pinned, two-step reservation on
--    public.ai_usage_daily. Never calls internal.consume_chart_ai_usage.
--
--    Step A (unconditional): insert today's row, or take its row lock and pin
--    free_limit = p_free_limit -- with NO WHERE clause, so a historically higher OR lower stored
--    free_limit is always corrected to the current server policy, even when step B below rejects the
--    call. The ON CONFLICT DO UPDATE lock is held for the remainder of this function's transaction,
--    serializing concurrent callers for the same (user_id, usage_date_kst) key.
--    Step B (conditional): increment used_count by exactly one, but only while it is strictly below
--    p_free_limit -- eligibility is checked against the server policy value directly, never against any
--    previously stored free_limit.
--    Step C: report the current, now-pinned row. allowed = true only when step B actually incremented.
-- ============================================================
create or replace function public.consume_chart_ai_usage_v1(
  p_user_id uuid,
  p_free_limit integer default 3
)
returns table (
  allowed boolean,
  used_count integer,
  free_limit integer,
  remaining_count integer,
  usage_date_kst date
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usage_date_kst date := (timezone('Asia/Seoul', now()))::date;
  v_incremented boolean;
begin
  if p_user_id is null then
    raise exception 'p_user_id is required';
  end if;

  if p_free_limit is null or p_free_limit <= 0 then
    raise exception 'p_free_limit must be greater than zero';
  end if;

  -- Step A: ensure today's row exists and unconditionally pin free_limit to the current server policy.
  -- Taking the row lock here (even when only free_limit changes) serializes concurrent callers until
  -- this transaction commits.
  insert into public.ai_usage_daily as target_usage (
    user_id,
    usage_date_kst,
    used_count,
    free_limit
  )
  values (
    p_user_id,
    v_usage_date_kst,
    0,
    p_free_limit
  )
  on conflict on constraint ai_usage_daily_user_id_usage_date_kst_key do update
    set free_limit = p_free_limit,
        updated_at = now();

  -- Step B: attempt exactly one conditional increment, bounded by the server policy value.
  update public.ai_usage_daily as target_usage
  set used_count = target_usage.used_count + 1,
      updated_at = now()
  where target_usage.user_id = p_user_id
    and target_usage.usage_date_kst = v_usage_date_kst
    and target_usage.used_count < p_free_limit;

  v_incremented := found;

  -- Step C: report the current, already-pinned row.
  return query
  select
    v_incremented as allowed,
    existing_usage.used_count as used_count,
    existing_usage.free_limit as free_limit,
    greatest(existing_usage.free_limit - existing_usage.used_count, 0)::integer as remaining_count,
    existing_usage.usage_date_kst as usage_date_kst
  from public.ai_usage_daily as existing_usage
  where existing_usage.user_id = p_user_id
    and existing_usage.usage_date_kst = v_usage_date_kst;
end;
$$;

comment on function public.consume_chart_ai_usage_v1(uuid, integer) is
  'Service-role-only. Atomically reserves one combined Similarity + MK Analysis execution for the caller-resolved user on the current Asia/Seoul calendar day. Self-contained two-step reservation on public.ai_usage_daily (does NOT call internal.consume_chart_ai_usage): free_limit is unconditionally pinned to the server-provided p_free_limit every call (corrected even when rejected), and the increment is authorized only while used_count < p_free_limit -- never against any previously stored free_limit -- so a historically higher OR lower stored limit never changes how many executions the current approved policy grants. Lets the live Chart AI routes enforce the daily guard without exposing the internal schema through PostgREST. No browser access.';

-- ============================================================
-- 2. public.refund_chart_ai_usage_v1 -> operates directly on public.ai_usage_daily
--    Gives back one usage unit reserved by consume_chart_ai_usage_v1 when the reserved execution never
--    produced a usable analysis (provider/engine failure, insufficient history, internal error).
-- ============================================================
create or replace function public.refund_chart_ai_usage_v1(
  p_user_id uuid
)
returns table (
  allowed boolean,
  used_count integer,
  free_limit integer,
  remaining_count integer,
  usage_date_kst date
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usage_date_kst date := (timezone('Asia/Seoul', now()))::date;
begin
  if p_user_id is null then
    raise exception 'p_user_id is required';
  end if;

  return query
  update public.ai_usage_daily as target_usage
  set used_count = greatest(target_usage.used_count - 1, 0),
      updated_at = now()
  where target_usage.user_id = p_user_id
    and target_usage.usage_date_kst = v_usage_date_kst
  returning
    (target_usage.used_count < target_usage.free_limit) as allowed,
    target_usage.used_count as used_count,
    target_usage.free_limit as free_limit,
    greatest(target_usage.free_limit - target_usage.used_count, 0)::integer as remaining_count,
    target_usage.usage_date_kst as usage_date_kst;
end;
$$;

comment on function public.refund_chart_ai_usage_v1(uuid) is
  'Service-role-only bridge. Decrements the caller-resolved user''s current-KST-day ai_usage_daily counter by at most one unit, never below zero. Returns zero rows if no counter row exists yet for today (caller must treat that as a safe no-op, never as an error). Used so provider/engine failures after a reservation do not consume a successful-analysis allowance. No browser access.';

-- ============================================================
-- Privileges: service_role ONLY. Browser roles get nothing.
-- ============================================================
revoke all on function public.consume_chart_ai_usage_v1(uuid, integer) from public, anon, authenticated;
revoke all on function public.refund_chart_ai_usage_v1(uuid) from public, anon, authenticated;

grant execute on function public.consume_chart_ai_usage_v1(uuid, integer) to service_role;
grant execute on function public.refund_chart_ai_usage_v1(uuid) to service_role;
