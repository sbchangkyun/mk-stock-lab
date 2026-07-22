-- Disposable validation patch only.
-- Apply only to the already-created disposable Supabase validation project.
-- Do not run against production.
-- Do not include secrets, project refs, passwords, keys, or connection strings.

create or replace function internal.consume_chart_ai_usage(
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
          free_limit = greatest(target_usage.free_limit, excluded.free_limit),
          updated_at = now()
      where target_usage.used_count < target_usage.free_limit
    returning
      true::boolean as out_allowed,
      target_usage.used_count as out_used_count,
      target_usage.free_limit as out_free_limit,
      greatest(target_usage.free_limit - target_usage.used_count, 0)::integer as out_remaining_count,
      target_usage.usage_date_kst as out_usage_date_kst
  ),
  current_usage as (
    select
      false::boolean as out_allowed,
      existing_usage.used_count as out_used_count,
      existing_usage.free_limit as out_free_limit,
      greatest(existing_usage.free_limit - existing_usage.used_count, 0)::integer as out_remaining_count,
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

comment on function internal.consume_chart_ai_usage(uuid, integer) is 'Atomically consumes one Chart AI usage for a user based on the KST calendar day. Server-side use only.';

revoke all on function internal.consume_chart_ai_usage(uuid, integer) from public;
revoke all on function internal.consume_chart_ai_usage(uuid, integer) from anon;
revoke all on function internal.consume_chart_ai_usage(uuid, integer) from authenticated;
grant usage on schema internal to service_role;
grant execute on function internal.consume_chart_ai_usage(uuid, integer) to service_role;

-- Disposable-only manual test block.
-- Keep commented unless the target database is disposable and the operator approved testing.
-- Expected results:
-- call 1: allowed = true, remaining_count = 2
-- call 2: allowed = true, remaining_count = 1
-- call 3: allowed = true, remaining_count = 0
-- call 4: allowed = false, remaining_count = 0
--
-- begin;
-- select * from internal.consume_chart_ai_usage('00000000-0000-0000-0000-000000000001'::uuid, 3);
-- select * from internal.consume_chart_ai_usage('00000000-0000-0000-0000-000000000001'::uuid, 3);
-- select * from internal.consume_chart_ai_usage('00000000-0000-0000-0000-000000000001'::uuid, 3);
-- select * from internal.consume_chart_ai_usage('00000000-0000-0000-0000-000000000001'::uuid, 3);
-- rollback;
