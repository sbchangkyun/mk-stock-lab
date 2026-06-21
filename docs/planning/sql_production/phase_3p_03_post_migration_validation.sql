-- Phase 3P production Dashboard SQL execution pack.
-- Script 03: read-only post-migration validation.
-- Run only after Script 02 completes in the confirmed production project.
-- Do not paste project refs, URLs, keys, tokens, screenshots, or secret-bearing output.
-- This script does not return production quote_json payloads.

with
expected_columns(column_name) as (
  values
    ('cache_key'),
    ('provider'),
    ('source'),
    ('fresh_until'),
    ('stale_until'),
    ('schema_version'),
    ('last_refresh_status'),
    ('last_error_code'),
    ('updated_at')
),
expected_not_null(column_name) as (
  values
    ('cache_key'),
    ('provider'),
    ('source'),
    ('fresh_until'),
    ('stale_until'),
    ('schema_version'),
    ('updated_at')
),
expected_column_count as (
  select count(c.column_name) as present_count
  from expected_columns e
  left join information_schema.columns c
    on c.table_schema = 'public'
   and c.table_name = 'market_quote_cache'
   and c.column_name = e.column_name
),
not_null_count as (
  select count(c.column_name) as present_count
  from expected_not_null e
  left join information_schema.columns c
    on c.table_schema = 'public'
   and c.table_name = 'market_quote_cache'
   and c.column_name = e.column_name
   and c.is_nullable = 'NO'
),
constraint_count as (
  select count(*) as present_count
  from pg_constraint
  where conrelid = 'public.market_quote_cache'::regclass
    and conname in (
      'market_quote_cache_cache_key_unique',
      'market_quote_cache_lifecycle_check'
    )
),
index_count as (
  select count(*) as present_count
  from pg_indexes
  where schemaname = 'public'
    and tablename = 'market_quote_cache'
    and indexname in (
      'market_quote_cache_fresh_until_idx',
      'market_quote_cache_stale_until_idx',
      'market_quote_cache_provider_source_idx'
    )
),
backfill_sanity as (
  select
    count(*) as row_count,
    coalesce(bool_and(cache_key = 'quote:' || market || ':' || upper(symbol)), true) as cache_key_ok,
    coalesce(bool_and(provider = 'kis'), true) as provider_ok,
    coalesce(bool_and(source = 'kis-domestic-quote'), true) as source_ok,
    coalesce(bool_and(fresh_until = cached_at + interval '15 seconds'), true) as fresh_until_ok,
    coalesce(bool_and(stale_until = expires_at), true) as stale_until_ok,
    coalesce(bool_and(updated_at = cached_at), true) as updated_at_ok,
    coalesce(bool_and(schema_version = 1), true) as schema_version_ok
  from public.market_quote_cache
),
rls_state as (
  select exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'market_quote_cache'
      and c.relrowsecurity
  ) as enabled
),
write_grants as (
  select count(*) as grant_count
  from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name = 'market_quote_cache'
    and grantee in ('anon', 'authenticated')
    and privilege_type in ('INSERT', 'UPDATE', 'DELETE')
),
select_grants as (
  select count(distinct grantee) as grant_count
  from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name = 'market_quote_cache'
    and grantee in ('anon', 'authenticated')
    and privilege_type = 'SELECT'
),
service_role_grants as (
  select count(distinct privilege_type) as grant_count
  from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name = 'market_quote_cache'
    and grantee = 'service_role'
    and privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
),
public_read_policy as (
  select exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'market_quote_cache'
      and policyname = 'market_quote_cache_public_read'
      and cmd = 'SELECT'
  ) as present
),
checks as (
  select
    'lifecycle_columns_exist' as check_name,
    case when (select present_count from expected_column_count) = 9 then 'pass' else 'fail' end as status,
    (select present_count::text from expected_column_count) || '/9 lifecycle columns present' as details
  union all
  select
    'required_lifecycle_columns_not_null',
    case when (select present_count from not_null_count) = 7 then 'pass' else 'fail' end,
    (select present_count::text from not_null_count) || '/7 required not-null columns present'
  union all
  select
    'market_quote_cache_cache_key_unique_exists',
    case when exists (
      select 1
      from pg_constraint
      where conrelid = 'public.market_quote_cache'::regclass
        and conname = 'market_quote_cache_cache_key_unique'
    ) then 'pass' else 'fail' end,
    'cache_key unique constraint must exist'
  union all
  select
    'market_quote_cache_lifecycle_check_exists',
    case when exists (
      select 1
      from pg_constraint
      where conrelid = 'public.market_quote_cache'::regclass
        and conname = 'market_quote_cache_lifecycle_check'
    ) then 'pass' else 'fail' end,
    'lifecycle check constraint must exist'
  union all
  select
    'market_quote_cache_fresh_until_idx_exists',
    case when exists (
      select 1
      from pg_indexes
      where schemaname = 'public'
        and tablename = 'market_quote_cache'
        and indexname = 'market_quote_cache_fresh_until_idx'
    ) then 'pass' else 'fail' end,
    'fresh_until index must exist'
  union all
  select
    'market_quote_cache_stale_until_idx_exists',
    case when exists (
      select 1
      from pg_indexes
      where schemaname = 'public'
        and tablename = 'market_quote_cache'
        and indexname = 'market_quote_cache_stale_until_idx'
    ) then 'pass' else 'fail' end,
    'stale_until index must exist'
  union all
  select
    'market_quote_cache_provider_source_idx_exists',
    case when exists (
      select 1
      from pg_indexes
      where schemaname = 'public'
        and tablename = 'market_quote_cache'
        and indexname = 'market_quote_cache_provider_source_idx'
    ) then 'pass' else 'fail' end,
    'provider/source index must exist'
  union all
  select
    'deterministic_backfill_sanity',
    case
      when (select cache_key_ok and provider_ok and source_ok and fresh_until_ok and stale_until_ok and updated_at_ok and schema_version_ok from backfill_sanity)
        then 'pass'
      else 'fail'
    end,
    (select row_count::text from backfill_sanity) || ' rows checked without returning quote_json payloads'
  union all
  select
    'rls_enabled',
    case when (select enabled from rls_state) then 'pass' else 'fail' end,
    'RLS must remain enabled on public.market_quote_cache'
  union all
  select
    'anon_authenticated_write_grants_absent',
    case when (select grant_count from write_grants) = 0 then 'pass' else 'fail' end,
    (select grant_count::text from write_grants) || ' public write grants found'
  union all
  select
    'public_read_policy_unchanged',
    case
      when (select grant_count from select_grants) = 2
       and (select present from public_read_policy)
        then 'pass'
      else 'fail'
    end,
    'anon/authenticated SELECT grants and read policy should remain present'
  union all
  select
    'service_role_write_intent_present',
    case when (select grant_count from service_role_grants) = 4 then 'pass' else 'fail' end,
    (select grant_count::text from service_role_grants) || '/4 service_role read/write privileges present'
),
overall as (
  select case when every(status = 'pass') then 'pass' else 'fail' end as status
  from checks
)
select check_name, status, details
from checks
union all
select
  'phase_3p_post_migration_validation',
  overall.status,
  case
    when overall.status = 'pass' then 'Post-migration validation passed.'
    else 'Post-migration validation failed; stop before adapter implementation.'
  end
from overall;
