-- Phase 3GG-U: public PostgREST RPC bridge for the live Chart AI daily usage guard.
-- Apply via Supabase Dashboard > SQL Editor (do NOT execute via Claude Code). Additive, forward-only.
--
-- Why: src/lib/server/chartAiUsage.ts currently calls .schema('internal').rpc('consume_chart_ai_usage', ...),
-- but PostgREST does not expose the `internal` schema (PGRST106) -- the same class of gap the KIS token
-- bridge (20260714_kis_token_postgrest_rpc_bridge.sql) fixed for the token store. This migration applies
-- the identical bridge pattern to the Chart AI usage guard so the live Similarity and MK Analysis routes
-- can enforce a combined daily execution limit without exposing `internal` through PostgREST.
--
-- Design: public.consume_chart_ai_usage_v1 is a self-contained, atomic upsert on the existing
-- public.ai_usage_daily table (defined in 20260615_rebuild_schema_v0_1.sql). It deliberately does NOT
-- delegate to internal.consume_chart_ai_usage(uuid, integer), because that internal function stores
-- free_limit = greatest(stored, incoming) and gates on used_count < stored free_limit -- so a pre-existing
-- row carrying a historically higher free_limit would authorize more than the current approved policy.
-- The approved policy is EXACTLY 3 combined Similarity + MK Analysis executions per authenticated user per
-- Asia/Seoul calendar day, with the stored free_limit PINNED to the server-provided current policy
-- (p_free_limit) so a historically higher stored limit can never authorize. This bridge enforces that by
-- (a) writing free_limit = p_free_limit (never greatest()) on every actual write and (b) gating the
-- increment on used_count < p_free_limit. internal.consume_chart_ai_usage is left completely unmodified;
-- it is simply no longer on this path. public.refund_chart_ai_usage_v1 is new: it lets a route give back
-- one usage unit when a reserved execution never produced a usable analysis (provider/engine failure), so
-- only completed analyses count against the daily allowance. Both operate on the existing
-- public.ai_usage_daily table -- no replacement table is created. Both are SECURITY DEFINER with an empty
-- search_path and fully qualified object names, and both are revoked from public/anon/authenticated and
-- granted to service_role only.
--
-- Boundary: no user-callable RPC is added here. Neither function returns anything beyond the sanitized
-- usage-counter fields (allowed/used_count/free_limit/remaining_count/usage_date_kst) -- no email, token,
-- session, IP, account, or profile data. No existing KIS token migration or object is modified, and the
-- already-applied internal.consume_chart_ai_usage function is not altered.

-- ============================================================
-- 1. public.consume_chart_ai_usage_v1 -> atomic upsert on public.ai_usage_daily, policy-pinned.
--    free_limit is pinned to the server-provided p_free_limit (never greatest()); the increment is
--    authorized only while used_count < p_free_limit, so a historically higher stored limit never
--    authorizes and the current approved policy (default 3/day KST) always wins.
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
begin
  if p_user_id is null then
    raise exception 'p_user_id is required';
  end if;

  if p_free_limit is null or p_free_limit <= 0 then
    raise exception 'p_free_limit must be greater than zero';
  end if;

  return query
  with changed as (
    -- Atomic reserve: insert today's counter, or increment an existing one only while it is strictly
    -- below the server policy. free_limit is pinned to p_free_limit on every write (never greatest()),
    -- so a historically higher stored limit is corrected down and can never grant extra executions.
    insert into public.ai_usage_daily as target_usage (
      user_id,
      usage_date_kst,
      used_count,
      free_limit
    )
    values (
      p_user_id,
      v_usage_date_kst,
      1,
      p_free_limit
    )
    on conflict on constraint ai_usage_daily_user_id_usage_date_kst_key do update
      set used_count = target_usage.used_count + 1,
          free_limit = p_free_limit,
          updated_at = now()
      where target_usage.used_count < p_free_limit
    returning
      true::boolean as out_allowed,
      target_usage.used_count as out_used_count,
      target_usage.free_limit as out_free_limit,
      greatest(target_usage.free_limit - target_usage.used_count, 0)::integer as out_remaining_count,
      target_usage.usage_date_kst as out_usage_date_kst
  ),
  current_usage as (
    -- Reservation rejected (already at/over the policy for today). Report against the pinned policy limit,
    -- never the historically stored free_limit, so remaining can never be inflated by a stale higher limit.
    select
      false::boolean as out_allowed,
      existing_usage.used_count as out_used_count,
      p_free_limit as out_free_limit,
      greatest(p_free_limit - existing_usage.used_count, 0)::integer as out_remaining_count,
      existing_usage.usage_date_kst as out_usage_date_kst
    from public.ai_usage_daily as existing_usage
    where existing_usage.user_id = p_user_id
      and existing_usage.usage_date_kst = v_usage_date_kst
      and not exists (select 1 from changed)
  )
  select
    result_rows.out_allowed,
    result_rows.out_used_count,
    result_rows.out_free_limit,
    result_rows.out_remaining_count,
    result_rows.out_usage_date_kst
  from (
    select * from changed
    union all
    select * from current_usage
  ) as result_rows;
end;
$$;

comment on function public.consume_chart_ai_usage_v1(uuid, integer) is
  'Service-role-only. Atomically reserves one combined Similarity + MK Analysis execution for the caller-resolved user on the current Asia/Seoul calendar day. Self-contained upsert on public.ai_usage_daily (does NOT delegate to internal.consume_chart_ai_usage): free_limit is pinned to the server-provided p_free_limit and the increment is authorized only while used_count < p_free_limit, so a historically higher stored limit never authorizes and the current approved policy always wins. Lets the live Chart AI routes enforce the daily guard without exposing the internal schema through PostgREST. No browser access.';

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
