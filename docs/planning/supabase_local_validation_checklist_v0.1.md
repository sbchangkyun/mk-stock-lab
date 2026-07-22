# Supabase Local Validation Checklist v0.1

Status: Phase 2B validation plan

Use this checklist only against a local Supabase database, disposable branch database, or other throwaway Postgres instance prepared for review. Do not run it against production.

## Setup Gate

1. Confirm the target database is disposable.
2. Confirm no production connection string is active in the shell.
3. Confirm the migration under review is `supabase/migrations/20260615_rebuild_schema_v0_1.sql`.
4. Confirm `supabase --version` works if using Supabase CLI.
5. Confirm `psql --version` works if using direct Postgres validation.

## Apply Gate

1. Apply the migration only to the disposable database.
2. Do not seed production data.
3. Do not connect the disposable database to production auth, providers, or scheduled jobs.

## Structural Checks

```sql
select count(*) as public_table_count
from information_schema.tables
where table_schema = 'public'
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
  );

select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;

select tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

Expected result:

- `public_table_count` is `14`.
- Every drafted public table has `rowsecurity = true`.
- `ad_events` has no public insert policy.

## Chart AI Usage Function Checks

Run with a disposable auth user id and a service-role connection only.

```sql
select *
from internal.consume_chart_ai_usage('00000000-0000-0000-0000-000000000001'::uuid, 3);
```

Expected result:

- Calls 1 through 3 return `allowed = true`.
- Call 4 on the same KST date returns `allowed = false`.
- `remaining_count` does not go below `0`.
- Normal `anon` and `authenticated` clients cannot execute the function.

## Profile RLS Checks

Validate with two disposable authenticated users.

- User A can select only User A profile.
- User B can select only User B profile.
- User A can insert only a profile with `id = auth.uid()` and default `plan = 'free'`.
- User A can update only editable profile columns.
- User A cannot update `plan`.

## Portfolio RLS Checks

- User A can create, read, update, and delete User A portfolios.
- User A cannot read, update, or delete User B portfolios.
- User A can manage positions only under User A portfolios.
- User A cannot insert a position into User B portfolio.

## Public Read Checks

- Anonymous clients can select intended public rows from market and Lab tables.
- Anonymous clients cannot insert, update, or delete market or Lab rows.
- Authenticated clients cannot write market, Lab, or cache rows except through future server routes.
- User-scoped `heatmap_cache` rows are visible only to their owner.

## Ad Event Checks

- Anonymous clients cannot insert `ad_events`.
- Authenticated clients cannot insert `ad_events`.
- Server-side service-role code can insert minimal ad events.
- API-level rate limiting is required before production tracking is enabled.

## Advisor Gate

Run Supabase database advisors against the disposable database after migration application. Review all security and performance findings before any remote application.
