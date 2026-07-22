-- Phase 3P production Dashboard SQL execution pack.
-- Script 01: read-only production prechecks.
-- Run only after confirming the selected Supabase Dashboard project is production.
-- Do not run in the disposable validation project.
-- If any row returns fail or do-not-rerun, stop before Script 02.
-- Do not paste project refs, URLs, keys, tokens, screenshots, or secret-bearing output.

with
rel as (
  select to_regclass('public.market_quote_cache') as table_regclass
),
baseline_columns(column_name) as (
  values
    ('id'),
    ('symbol'),
    ('market'),
    ('quote_json'),
    ('cached_at'),
    ('expires_at')
),
baseline_column_count as (
  select count(c.column_name) as present_count
  from baseline_columns b
  left join information_schema.columns c
    on c.table_schema = 'public'
   and c.table_name = 'market_quote_cache'
   and c.column_name = b.column_name
),
phase_columns(column_name) as (
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
phase_column_count as (
  select count(c.column_name) as present_count
  from phase_columns p
  left join information_schema.columns c
    on c.table_schema = 'public'
   and c.table_name = 'market_quote_cache'
   and c.column_name = p.column_name
),
phase_constraint_count as (
  select count(*) as present_count
  from pg_constraint pc
  join rel on rel.table_regclass is not null
  where pc.conrelid = rel.table_regclass
    and conname in (
      'market_quote_cache_cache_key_unique',
      'market_quote_cache_lifecycle_check'
    )
),
phase_index_count as (
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
duplicate_identity as (
  select count(*) as duplicate_group_count
  from (
    select market, upper(symbol) as normalized_symbol
    from public.market_quote_cache
    group by market, upper(symbol)
    having count(*) > 1
  ) duplicates
),
lifecycle_incompatible as (
  select count(*) as incompatible_count
  from public.market_quote_cache
  where cached_at + interval '15 seconds' > expires_at
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
    'market_quote_cache_exists' as check_name,
    case when (select table_regclass from rel) is not null then 'pass' else 'fail' end as status,
    case when (select table_regclass from rel) is not null then 'table exists' else 'stop: table missing' end as details
  union all
  select
    'baseline_columns_present',
    case when (select present_count from baseline_column_count) = 6 then 'pass' else 'fail' end,
    (select present_count::text from baseline_column_count) || '/6 baseline columns present'
  union all
  select
    'duplicate_normalized_cache_identity_absent',
    case when (select duplicate_group_count from duplicate_identity) = 0 then 'pass' else 'fail' end,
    (select duplicate_group_count::text from duplicate_identity) || ' duplicate normalized identities found'
  union all
  select
    'lifecycle_incompatible_rows_absent',
    case when (select incompatible_count from lifecycle_incompatible) = 0 then 'pass' else 'fail' end,
    (select incompatible_count::text from lifecycle_incompatible) || ' rows have expires_at within 15 seconds of cached_at'
  union all
  select
    'rls_enabled',
    case when (select enabled from rls_state) then 'pass' else 'fail' end,
    'RLS must be enabled on public.market_quote_cache'
  union all
  select
    'anon_authenticated_write_grants_absent',
    case when (select grant_count from write_grants) = 0 then 'pass' else 'fail' end,
    (select grant_count::text from write_grants) || ' public write grants found'
  union all
  select
    'public_read_policy_present',
    case
      when (select grant_count from select_grants) = 2
       and (select present from public_read_policy)
        then 'pass'
      else 'fail'
    end,
    'anon/authenticated SELECT grants and read policy must be present'
  union all
  select
    'service_role_write_intent_present',
    case when (select grant_count from service_role_grants) = 4 then 'pass' else 'fail' end,
    (select grant_count::text from service_role_grants) || '/4 service_role read/write privileges present'
  union all
  select
    'phase_3m_columns_not_partially_applied',
    case
      when (select present_count from phase_column_count) = 0 then 'pass'
      when (select present_count from phase_column_count) = 9 then 'do-not-rerun'
      else 'fail'
    end,
    (select present_count::text from phase_column_count) || '/9 Phase 3M columns already present'
  union all
  select
    'phase_3m_constraints_not_partially_applied',
    case
      when (select present_count from phase_constraint_count) = 0 then 'pass'
      when (select present_count from phase_constraint_count) = 2 then 'do-not-rerun'
      else 'fail'
    end,
    (select present_count::text from phase_constraint_count) || '/2 Phase 3M constraints already present'
  union all
  select
    'phase_3m_indexes_not_partially_applied',
    case
      when (select present_count from phase_index_count) = 0 then 'pass'
      when (select present_count from phase_index_count) = 3 then 'do-not-rerun'
      else 'fail'
    end,
    (select present_count::text from phase_index_count) || '/3 Phase 3M indexes already present'
),
overall as (
  select
    case
      when (select present_count from phase_column_count) = 9
       and (select present_count from phase_constraint_count) = 2
       and (select present_count from phase_index_count) = 3
        then 'do-not-rerun'
      when every(status = 'pass') then 'pass'
      else 'fail'
    end as status
  from checks
)
select check_name, status, details
from checks
union all
select
  'safe_to_apply_phase_3m_migration',
  overall.status,
  case
    when overall.status = 'pass' then 'Owner may proceed to Script 02 after confirming backup/rollback readiness.'
    when overall.status = 'do-not-rerun' then 'Migration appears already applied; do not rerun Script 02.'
    else 'Stop before Script 02 and review failed prechecks.'
  end
from overall;
