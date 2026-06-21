-- Phase 3N.6 dashboard SQL validation pack.
-- Step 05: remove only the public-safe synthetic validation rows.
-- Run only in the disposable project after recording pass/fail summaries.
-- Do not run in production.

with deleted as (
  delete from public.market_quote_cache
  where market = 'KR'
    and symbol in ('005930', '000660')
    and (
      cache_key in ('quote:KR:005930', 'quote:KR:000660')
      or cache_key is null
    )
  returning symbol, market
)
select
  'synthetic fixture cleanup' as check_name,
  case when count(*) <= 2 then 'pass' else 'fail' end as result,
  count(*)::text || ' fixture rows deleted.' as detail
from deleted;
