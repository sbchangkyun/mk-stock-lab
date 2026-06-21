-- Phase 3N.6 dashboard SQL validation pack.
-- Step 01: detect baseline quote cache table and insert public-safe fixtures.
-- Run only in the owner-approved disposable Supabase project SQL Editor.
-- Do not run in production.

select
  'baseline table exists' as check_name,
  case when to_regclass('public.market_quote_cache') is not null then 'pass' else 'fail' end as result,
  case
    when to_regclass('public.market_quote_cache') is not null
      then 'public.market_quote_cache is present.'
    else 'Stop. Run supabase/migrations/20260615_rebuild_schema_v0_1.sql in the disposable project, then rerun this script.'
  end as detail;

do $$
begin
  if to_regclass('public.market_quote_cache') is null then
    raise exception 'public.market_quote_cache is missing. Apply the baseline migration in the disposable project before fixtures.';
  end if;
end $$;

insert into public.market_quote_cache (
  symbol,
  market,
  quote_json,
  cached_at,
  expires_at
)
values
  (
    '005930',
    'KR',
    jsonb_build_object(
      'symbol', '005930',
      'market', 'KR',
      'name', 'Synthetic Samsung Electronics fixture',
      'currency', 'KRW',
      'price', 70000,
      'changePct', 1.23,
      'asOf', '2026-06-21T00:00:00Z'
    ),
    '2026-06-21T00:00:00Z'::timestamptz,
    '2026-06-21T00:05:00Z'::timestamptz
  ),
  (
    '000660',
    'KR',
    jsonb_build_object(
      'symbol', '000660',
      'market', 'KR',
      'name', 'Synthetic SK Hynix fixture',
      'currency', 'KRW',
      'price', 180000,
      'changePct', -0.87,
      'asOf', '2026-06-21T00:00:00Z'
    ),
    '2026-06-21T00:01:00Z'::timestamptz,
    '2026-06-21T00:06:00Z'::timestamptz
  )
on conflict (symbol, market) do update
set
  quote_json = excluded.quote_json,
  cached_at = excluded.cached_at,
  expires_at = excluded.expires_at;

select
  'synthetic fixtures inserted' as check_name,
  case when count(*) = 2 then 'pass' else 'fail' end as result,
  count(*)::text || ' expected fixture rows are present.' as detail
from public.market_quote_cache
where market = 'KR'
  and symbol in ('005930', '000660');

select
  'fixture lifecycle precondition' as check_name,
  case
    when count(*) = 2
     and bool_and(expires_at > cached_at + interval '15 seconds')
      then 'pass'
    else 'fail'
  end as result,
  'expires_at must be later than cached_at plus 15 seconds.' as detail
from public.market_quote_cache
where market = 'KR'
  and symbol in ('005930', '000660');
