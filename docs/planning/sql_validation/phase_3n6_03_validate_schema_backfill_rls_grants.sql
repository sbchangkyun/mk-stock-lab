-- Phase 3N.6 dashboard SQL validation pack.
-- Step 03: validate schema, backfill, RLS, and grants.
-- Run only after Step 02 succeeds in the disposable project.
-- Copy only pass/fail summaries back to Codex. Do not copy project identifiers or secrets.

with expected_columns(column_name) as (
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
required_not_null(column_name) as (
  values
    ('cache_key'),
    ('provider'),
    ('source'),
    ('fresh_until'),
    ('stale_until'),
    ('schema_version'),
    ('updated_at')
),
forbidden_columns(column_name) as (
  values
    ('raw_payload'),
    ('raw_provider_payload'),
    ('provider_payload'),
    ('raw_headers'),
    ('headers'),
    ('authorization_header'),
    ('access_token'),
    ('refresh_token'),
    ('secret'),
    ('account_number'),
    ('account'),
    ('user_id'),
    ('portfolio_id'),
    ('position_id'),
    ('holdings'),
    ('raw_error'),
    ('stack_trace')
)
select
  'expected lifecycle columns exist' as check_name,
  case when count(c.column_name) = (select count(*) from expected_columns) then 'pass' else 'fail' end as result,
  count(c.column_name)::text || '/' || (select count(*)::text from expected_columns) || ' expected columns present.' as detail
from expected_columns e
left join information_schema.columns c
  on c.table_schema = 'public'
 and c.table_name = 'market_quote_cache'
 and c.column_name = e.column_name

union all

select
  'required lifecycle columns are not null' as check_name,
  case when count(c.column_name) = (select count(*) from required_not_null) then 'pass' else 'fail' end as result,
  count(c.column_name)::text || '/' || (select count(*)::text from required_not_null) || ' required not-null columns present.' as detail
from required_not_null r
left join information_schema.columns c
  on c.table_schema = 'public'
 and c.table_name = 'market_quote_cache'
 and c.column_name = r.column_name
 and c.is_nullable = 'NO'

union all

select
  'cache_key unique constraint exists' as check_name,
  case when exists (
    select 1
    from pg_constraint
    where conrelid = 'public.market_quote_cache'::regclass
      and conname = 'market_quote_cache_cache_key_unique'
  ) then 'pass' else 'fail' end as result,
  'Checks market_quote_cache_cache_key_unique.' as detail

union all

select
  'lifecycle check constraint exists' as check_name,
  case when exists (
    select 1
    from pg_constraint
    where conrelid = 'public.market_quote_cache'::regclass
      and conname = 'market_quote_cache_lifecycle_check'
  ) then 'pass' else 'fail' end as result,
  'Checks market_quote_cache_lifecycle_check.' as detail

union all

select
  'fresh_until index exists' as check_name,
  case when exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'market_quote_cache'
      and indexname = 'market_quote_cache_fresh_until_idx'
  ) then 'pass' else 'fail' end as result,
  'Checks market_quote_cache_fresh_until_idx.' as detail

union all

select
  'stale_until index exists' as check_name,
  case when exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'market_quote_cache'
      and indexname = 'market_quote_cache_stale_until_idx'
  ) then 'pass' else 'fail' end as result,
  'Checks market_quote_cache_stale_until_idx.' as detail

union all

select
  'provider source index exists' as check_name,
  case when exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'market_quote_cache'
      and indexname = 'market_quote_cache_provider_source_idx'
  ) then 'pass' else 'fail' end as result,
  'Checks market_quote_cache_provider_source_idx.' as detail

union all

select
  'synthetic cache keys backfilled' as check_name,
  case
    when count(*) = 2
     and bool_and(cache_key = 'quote:' || market || ':' || upper(symbol))
      then 'pass'
    else 'fail'
  end as result,
  'Expected quote:KR:005930 and quote:KR:000660.' as detail
from public.market_quote_cache
where market = 'KR'
  and symbol in ('005930', '000660')

union all

select
  'synthetic provider and source backfilled' as check_name,
  case
    when count(*) = 2
     and bool_and(provider = 'kis')
     and bool_and(source = 'kis-domestic-quote')
      then 'pass'
    else 'fail'
  end as result,
  'Expected provider kis and source kis-domestic-quote.' as detail
from public.market_quote_cache
where market = 'KR'
  and symbol in ('005930', '000660')

union all

select
  'synthetic lifecycle timestamps backfilled' as check_name,
  case
    when count(*) = 2
     and bool_and(fresh_until = cached_at + interval '15 seconds')
     and bool_and(stale_until = expires_at)
     and bool_and(updated_at = cached_at)
      then 'pass'
    else 'fail'
  end as result,
  'Expected fresh_until, stale_until, and updated_at deterministic backfill.' as detail
from public.market_quote_cache
where market = 'KR'
  and symbol in ('005930', '000660')

union all

select
  'schema_version backfilled' as check_name,
  case
    when count(*) = 2
     and bool_and(schema_version = 1)
      then 'pass'
    else 'fail'
  end as result,
  'Expected schema_version = 1.' as detail
from public.market_quote_cache
where market = 'KR'
  and symbol in ('005930', '000660')

union all

select
  'RLS remains enabled' as check_name,
  case when exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'market_quote_cache'
      and c.relrowsecurity
  ) then 'pass' else 'fail' end as result,
  'Checks pg_class.relrowsecurity.' as detail

union all

select
  'public read policy remains present' as check_name,
  case when exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'market_quote_cache'
      and policyname = 'market_quote_cache_public_read'
      and cmd = 'SELECT'
  ) then 'pass' else 'fail' end as result,
  'Checks read-only policy name and SELECT command.' as detail

union all

select
  'anon and authenticated select grants remain' as check_name,
  case when (
    select count(distinct grantee)
    from information_schema.role_table_grants
    where table_schema = 'public'
      and table_name = 'market_quote_cache'
      and grantee in ('anon', 'authenticated')
      and privilege_type = 'SELECT'
  ) = 2 then 'pass' else 'fail' end as result,
  'Expected SELECT grants for anon and authenticated.' as detail

union all

select
  'anon and authenticated write grants remain absent' as check_name,
  case when not exists (
    select 1
    from information_schema.role_table_grants
    where table_schema = 'public'
      and table_name = 'market_quote_cache'
      and grantee in ('anon', 'authenticated')
      and privilege_type in ('INSERT', 'UPDATE', 'DELETE')
  ) then 'pass' else 'fail' end as result,
  'Expected no INSERT, UPDATE, or DELETE grant for anon/authenticated.' as detail

union all

select
  'service_role write grant remains available' as check_name,
  case when (
    select count(distinct privilege_type)
    from information_schema.role_table_grants
    where table_schema = 'public'
      and table_name = 'market_quote_cache'
      and grantee = 'service_role'
      and privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'SELECT')
  ) = 4 then 'pass' else 'fail' end as result,
  'Expected service_role read/write grants from the baseline.' as detail

union all

select
  'forbidden columns remain absent' as check_name,
  case when count(c.column_name) = 0 then 'pass' else 'fail' end as result,
  count(c.column_name)::text || ' forbidden columns found.' as detail
from forbidden_columns f
left join information_schema.columns c
  on c.table_schema = 'public'
 and c.table_name = 'market_quote_cache'
 and c.column_name = f.column_name;
