-- Phase 3N.6 dashboard SQL validation pack.
-- Step 04: safe negative checks.
-- Run only after Step 03 passes in the disposable project.
-- These checks catch expected database errors and clean up any unexpected inserted rows.

create temp table if not exists phase_3n6_negative_results (
  check_name text,
  result text,
  detail text
) on commit drop;

truncate table phase_3n6_negative_results;

do $$
begin
  begin
    insert into public.market_quote_cache (
      symbol,
      market,
      quote_json,
      cached_at,
      expires_at,
      cache_key,
      provider,
      source,
      fresh_until,
      stale_until,
      schema_version,
      updated_at
    )
    values (
      '005930X',
      'KR',
      jsonb_build_object('symbol', '005930X', 'market', 'KR', 'fixture', true),
      '2026-06-21T00:10:00Z'::timestamptz,
      '2026-06-21T00:20:00Z'::timestamptz,
      'quote:KR:005930',
      'kis',
      'kis-domestic-quote',
      '2026-06-21T00:10:15Z'::timestamptz,
      '2026-06-21T00:20:00Z'::timestamptz,
      1,
      '2026-06-21T00:10:00Z'::timestamptz
    );

    delete from public.market_quote_cache
    where market = 'KR'
      and symbol = '005930X';

    insert into phase_3n6_negative_results
    values ('duplicate cache_key should fail', 'fail', 'Duplicate cache_key insert unexpectedly succeeded.');
  exception
    when unique_violation then
      insert into phase_3n6_negative_results
      values ('duplicate cache_key should fail', 'pass', 'Duplicate cache_key was rejected.');
    when others then
      insert into phase_3n6_negative_results
      values ('duplicate cache_key should fail', 'fail', 'Unexpected sanitized SQLSTATE: ' || sqlstate);
  end;

  begin
    insert into public.market_quote_cache (
      symbol,
      market,
      quote_json,
      cached_at,
      expires_at,
      cache_key,
      provider,
      source,
      fresh_until,
      stale_until,
      schema_version,
      updated_at
    )
    values (
      'LIFEFAIL',
      'KR',
      jsonb_build_object('symbol', 'LIFEFAIL', 'market', 'KR', 'fixture', true),
      '2026-06-21T00:30:00Z'::timestamptz,
      '2026-06-21T00:40:00Z'::timestamptz,
      'quote:KR:LIFEFAIL',
      'kis',
      'kis-domestic-quote',
      '2026-06-21T00:39:00Z'::timestamptz,
      '2026-06-21T00:38:00Z'::timestamptz,
      1,
      '2026-06-21T00:30:00Z'::timestamptz
    );

    delete from public.market_quote_cache
    where market = 'KR'
      and symbol = 'LIFEFAIL';

    insert into phase_3n6_negative_results
    values ('lifecycle-incompatible row should fail', 'fail', 'Lifecycle-incompatible insert unexpectedly succeeded.');
  exception
    when check_violation then
      insert into phase_3n6_negative_results
      values ('lifecycle-incompatible row should fail', 'pass', 'Lifecycle-incompatible row was rejected.');
    when others then
      insert into phase_3n6_negative_results
      values ('lifecycle-incompatible row should fail', 'fail', 'Unexpected sanitized SQLSTATE: ' || sqlstate);
  end;
end $$;

insert into phase_3n6_negative_results
select
  'anon and authenticated direct write grants should be absent' as check_name,
  case when not exists (
    select 1
    from information_schema.role_table_grants
    where table_schema = 'public'
      and table_name = 'market_quote_cache'
      and grantee in ('anon', 'authenticated')
      and privilege_type in ('INSERT', 'UPDATE', 'DELETE')
  ) then 'pass' else 'fail' end as result,
  'Catalog grant check used instead of direct role simulation.' as detail;

insert into phase_3n6_negative_results
select
  'anon and authenticated write policies should be absent' as check_name,
  case when not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'market_quote_cache'
      and roles && array['anon', 'authenticated']::name[]
      and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
  ) then 'pass' else 'fail' end as result,
  'Catalog policy check used instead of direct role simulation.' as detail;

select * from phase_3n6_negative_results
order by check_name;
