-- MK Stock Lab rebuild schema v0.1 validation checks
-- Read-only checks for a disposable database after migration application.
-- Do not run against production.

with required_tables(table_name) as (
  values
    ('profiles'),
    ('portfolios'),
    ('portfolio_positions'),
    ('ai_usage_daily'),
    ('market_symbols'),
    ('market_quote_cache'),
    ('market_chart_cache'),
    ('chart_ai_cache'),
    ('heatmap_cache'),
    ('lab_sp500_sector_returns'),
    ('lab_asset_class_returns'),
    ('lab_nps_holdings'),
    ('lab_congress_stock_holdings'),
    ('ad_events')
),
existing_tables as (
  select table_name
  from information_schema.tables
  where table_schema = 'public'
    and table_type = 'BASE TABLE'
)
select
  'required_public_tables' as check_name,
  count(existing_tables.table_name) as actual_count,
  14 as expected_count,
  array_agg(required_tables.table_name order by required_tables.table_name)
    filter (where existing_tables.table_name is null) as missing_tables
from required_tables
left join existing_tables using (table_name);

with required_tables(table_name) as (
  values
    ('profiles'),
    ('portfolios'),
    ('portfolio_positions'),
    ('ai_usage_daily'),
    ('market_symbols'),
    ('market_quote_cache'),
    ('market_chart_cache'),
    ('chart_ai_cache'),
    ('heatmap_cache'),
    ('lab_sp500_sector_returns'),
    ('lab_asset_class_returns'),
    ('lab_nps_holdings'),
    ('lab_congress_stock_holdings'),
    ('ad_events')
)
select
  required_tables.table_name,
  coalesce(pg_tables.rowsecurity, false) as rowsecurity_enabled
from required_tables
left join pg_tables
  on pg_tables.schemaname = 'public'
 and pg_tables.tablename = required_tables.table_name
order by required_tables.table_name;

select
  tablename,
  policyname,
  cmd,
  roles,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

select
  table_name,
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated', 'service_role')
  and table_name in (
    'profiles',
    'portfolios',
    'portfolio_positions',
    'ai_usage_daily',
    'market_symbols',
    'market_quote_cache',
    'market_chart_cache',
    'chart_ai_cache',
    'heatmap_cache',
    'lab_sp500_sector_returns',
    'lab_asset_class_returns',
    'lab_nps_holdings',
    'lab_congress_stock_holdings',
    'ad_events'
  )
order by table_name, grantee, privilege_type;

select
  table_name,
  column_name,
  grantee,
  privilege_type
from information_schema.role_column_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated', 'service_role')
  and table_name = 'profiles'
order by table_name, column_name, grantee, privilege_type;

select
  routine_schema,
  routine_name,
  data_type,
  type_udt_name
from information_schema.routines
where (routine_schema = 'public' and routine_name = 'set_updated_at')
   or (routine_schema = 'internal' and routine_name = 'consume_chart_ai_usage')
order by routine_schema, routine_name;

select
  n.nspname as function_schema,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as identity_arguments,
  p.prosecdef as security_definer,
  p.proconfig as function_config
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where (n.nspname = 'public' and p.proname = 'set_updated_at')
   or (n.nspname = 'internal' and p.proname = 'consume_chart_ai_usage')
order by function_schema, function_name;

select
  'public.set_updated_at()' as function_name,
  'anon' as role_name,
  has_function_privilege('anon', 'public.set_updated_at()', 'execute') as can_execute
union all
select
  'public.set_updated_at()',
  'authenticated',
  has_function_privilege('authenticated', 'public.set_updated_at()', 'execute')
union all
select
  'internal.consume_chart_ai_usage(uuid, integer)',
  'anon',
  has_function_privilege('anon', 'internal.consume_chart_ai_usage(uuid, integer)', 'execute')
union all
select
  'internal.consume_chart_ai_usage(uuid, integer)',
  'authenticated',
  has_function_privilege('authenticated', 'internal.consume_chart_ai_usage(uuid, integer)', 'execute')
union all
select
  'internal.consume_chart_ai_usage(uuid, integer)',
  'service_role',
  has_function_privilege('service_role', 'internal.consume_chart_ai_usage(uuid, integer)', 'execute')
order by function_name, role_name;

select
  'chart_ai_cache_has_user_id' as check_name,
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'chart_ai_cache'
      and column_name = 'user_id'
  ) as should_be_false;

select
  'ad_events_public_select_or_insert_policy' as check_name,
  count(*) as matching_policy_count
from pg_policies
where schemaname = 'public'
  and tablename = 'ad_events'
  and cmd in ('SELECT', 'INSERT')
  and roles::text ~ '(public|anon|authenticated)';

select
  schemaname,
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in (
    'portfolios',
    'portfolio_positions',
    'ai_usage_daily',
    'market_symbols',
    'market_quote_cache',
    'market_chart_cache',
    'chart_ai_cache',
    'heatmap_cache',
    'lab_sp500_sector_returns',
    'lab_asset_class_returns',
    'lab_nps_holdings',
    'lab_congress_stock_holdings'
  )
order by tablename, indexname;

-- Disposable-only examples.
-- Keep commented unless the target database is disposable and the operator approved testing.

-- Chart AI usage function test using a disposable UUID and service-role context.
-- If this test raises an ambiguity error, review patch_consume_chart_ai_usage_v0_1.sql.
-- Expected results:
-- call 1: allowed = true, remaining_count = 2
-- call 2: allowed = true, remaining_count = 1
-- call 3: allowed = true, remaining_count = 0
-- call 4: allowed = false, remaining_count = 0
-- select * from internal.consume_chart_ai_usage('00000000-0000-0000-0000-000000000001'::uuid, 3);
-- select * from internal.consume_chart_ai_usage('00000000-0000-0000-0000-000000000001'::uuid, 3);
-- select * from internal.consume_chart_ai_usage('00000000-0000-0000-0000-000000000001'::uuid, 3);
-- select * from internal.consume_chart_ai_usage('00000000-0000-0000-0000-000000000001'::uuid, 3);

-- Profile ownership behavior should be tested through disposable authenticated clients.
-- Portfolio ownership behavior should be tested through disposable authenticated clients.
-- Anonymous and authenticated clients should fail when inserting into public.ad_events.
