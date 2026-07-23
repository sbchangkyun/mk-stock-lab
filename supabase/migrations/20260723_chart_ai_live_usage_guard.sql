-- Phase 3GG-U: public PostgREST RPC bridge for the live Chart AI daily usage guard.
-- Apply via Supabase Dashboard > SQL Editor (do NOT execute via Claude Code). Additive, forward-only.
--
-- Why: src/lib/server/chartAiUsage.ts currently calls .schema('internal').rpc('consume_chart_ai_usage', ...),
-- but PostgREST does not expose the `internal` schema (PGRST106) -- the same class of gap the KIS token
-- bridge (20260714_kis_token_postgrest_rpc_bridge.sql) fixed for the token store. This migration applies
-- the identical bridge pattern to the Chart AI usage guard so the live Similarity and MK Analysis routes
-- can enforce a combined daily execution limit without exposing `internal` through PostgREST.
--
-- Design: public.consume_chart_ai_usage_v1 is a thin SQL bridge delegating to the existing, unmodified
-- internal.consume_chart_ai_usage(uuid, integer) (defined in 20260615_rebuild_schema_v0_1.sql) -- no atomic
-- logic is duplicated. public.refund_chart_ai_usage_v1 is new: it lets a route give back one usage unit
-- when a reserved execution never produced a usable analysis (provider/engine failure), so only completed
-- analyses count against the daily allowance. Both operate on the existing public.ai_usage_daily table --
-- no replacement table is created. Both are SECURITY DEFINER with an empty search_path and fully qualified
-- object names, and both are revoked from public/anon/authenticated and granted to service_role only.
--
-- Boundary: no user-callable RPC is added here. Neither function returns anything beyond the sanitized
-- usage-counter fields already returned by internal.consume_chart_ai_usage (allowed/used_count/free_limit/
-- remaining_count/usage_date_kst) -- no email, token, session, IP, account, or profile data. No existing
-- KIS token migration or object is modified.

-- ============================================================
-- 1. public.consume_chart_ai_usage_v1 -> internal.consume_chart_ai_usage (atomic, unchanged)
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
language sql
security definer
set search_path = ''
as $$
  select allowed, used_count, free_limit, remaining_count, usage_date_kst
  from internal.consume_chart_ai_usage(p_user_id, p_free_limit);
$$;

comment on function public.consume_chart_ai_usage_v1(uuid, integer) is
  'Service-role-only bridge to internal.consume_chart_ai_usage. Atomically reserves one combined Similarity + MK Analysis execution for the caller-resolved user on the current Asia/Seoul calendar day; never increments past p_free_limit. Lets the live Chart AI routes enforce the daily guard without exposing the internal schema through PostgREST. No browser access.';

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
