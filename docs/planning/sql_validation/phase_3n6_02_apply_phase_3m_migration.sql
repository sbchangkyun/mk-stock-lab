-- Phase 3N.6 dashboard SQL validation pack.
-- Step 02: apply the Phase 3M migration in the disposable project.
-- This is a copy of supabase/migrations/20260621_market_quote_cache_lifecycle_columns.sql.
-- Do not run in production.

alter table public.market_quote_cache
  add column if not exists cache_key text,
  add column if not exists provider text,
  add column if not exists source text,
  add column if not exists fresh_until timestamptz,
  add column if not exists stale_until timestamptz,
  add column if not exists schema_version integer not null default 1,
  add column if not exists last_refresh_status text,
  add column if not exists last_error_code text,
  add column if not exists updated_at timestamptz;

comment on column public.market_quote_cache.cache_key is 'Stable normalized quote cache identifier.';
comment on column public.market_quote_cache.provider is 'Server-side market data provider identifier.';
comment on column public.market_quote_cache.source is 'Server-side market data source identifier.';
comment on column public.market_quote_cache.fresh_until is 'Timestamp until which the cached quote is fresh.';
comment on column public.market_quote_cache.stale_until is 'Timestamp until which the cached quote may be used as stale fallback.';
comment on column public.market_quote_cache.schema_version is 'Normalized quote payload schema version.';
comment on column public.market_quote_cache.last_refresh_status is 'Sanitized refresh status for server-written cache rows.';
comment on column public.market_quote_cache.last_error_code is 'Sanitized refresh error code for server-written cache rows.';
comment on column public.market_quote_cache.updated_at is 'Timestamp when the cache row was last updated by server code.';

update public.market_quote_cache
set
  cache_key = coalesce(cache_key, 'quote:' || market || ':' || upper(symbol)),
  provider = coalesce(provider, 'kis'),
  source = coalesce(source, 'kis-domestic-quote'),
  fresh_until = coalesce(fresh_until, cached_at + interval '15 seconds'),
  stale_until = coalesce(stale_until, expires_at),
  updated_at = coalesce(updated_at, cached_at);

do $$
begin
  if exists (
    select 1
    from (
      select cache_key
      from public.market_quote_cache
      group by 1
      having count(*) > 1
    ) duplicates
  ) then
    raise exception 'market_quote_cache contains duplicate normalized cache identifiers';
  end if;

  if exists (
    select 1
    from public.market_quote_cache
    where cached_at > fresh_until
       or fresh_until > stale_until
       or stale_until > expires_at
  ) then
    raise exception 'market_quote_cache contains rows that violate lifecycle ordering';
  end if;
end $$;

alter table public.market_quote_cache
  alter column cache_key set not null,
  alter column provider set not null,
  alter column source set not null,
  alter column fresh_until set not null,
  alter column stale_until set not null,
  alter column updated_at set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'market_quote_cache_cache_key_unique'
      and conrelid = 'public.market_quote_cache'::regclass
  ) then
    alter table public.market_quote_cache
      add constraint market_quote_cache_cache_key_unique unique (cache_key);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'market_quote_cache_lifecycle_check'
      and conrelid = 'public.market_quote_cache'::regclass
  ) then
    alter table public.market_quote_cache
      add constraint market_quote_cache_lifecycle_check
      check (cached_at <= fresh_until and fresh_until <= stale_until and stale_until <= expires_at);
  end if;
end $$;

create index if not exists market_quote_cache_fresh_until_idx
  on public.market_quote_cache (fresh_until);

create index if not exists market_quote_cache_stale_until_idx
  on public.market_quote_cache (stale_until);

create index if not exists market_quote_cache_provider_source_idx
  on public.market_quote_cache (market, symbol, provider, source);
