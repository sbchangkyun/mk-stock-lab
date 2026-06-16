-- MK Stock Lab rebuild schema v0.1
-- Draft migration only. Review before applying to any Supabase project.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create schema if not exists internal;
revoke all on schema internal from public;
revoke all on schema internal from anon;
revoke all on schema internal from authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is 'Sets updated_at to the current transaction timestamp before row updates.';

revoke all on function public.set_updated_at() from public;
revoke all on function public.set_updated_at() from anon;
revoke all on function public.set_updated_at() from authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  plan text not null default 'free' check (plan in ('free', 'pro', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'User profile records linked one-to-one with Supabase Auth users.';

create table public.portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  base_currency text not null default 'KRW' check (base_currency in ('KRW', 'USD')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.portfolios is 'User-owned portfolio containers.';

create table public.portfolio_positions (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  symbol text not null check (char_length(symbol) between 1 and 32),
  market text not null check (market in ('KR', 'US')),
  asset_type text not null check (asset_type in ('stock', 'etf')),
  name text,
  buy_price numeric not null check (buy_price >= 0),
  quantity numeric not null check (quantity > 0),
  buy_date date,
  memo text,
  currency text not null check (currency in ('KRW', 'USD')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.portfolio_positions is 'Holdings inside user-owned portfolios.';

create table public.ai_usage_daily (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date_kst date not null,
  used_count integer not null default 0 check (used_count >= 0),
  free_limit integer not null default 3 check (free_limit > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_usage_daily_user_id_usage_date_kst_key unique (user_id, usage_date_kst)
);

comment on table public.ai_usage_daily is 'Daily Chart AI usage counters keyed by user and KST date.';

create table public.market_symbols (
  id uuid primary key default gen_random_uuid(),
  symbol text not null check (char_length(symbol) between 1 and 32),
  name text not null check (char_length(name) between 1 and 240),
  market text not null check (market in ('KR', 'US')),
  exchange text,
  asset_type text not null check (asset_type in ('stock', 'etf', 'index')),
  sector text,
  industry text,
  currency text not null check (currency in ('KRW', 'USD')),
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (symbol, market)
);

comment on table public.market_symbols is 'Searchable stock, ETF, and index symbol directory.';

create table public.market_quote_cache (
  id uuid primary key default gen_random_uuid(),
  symbol text not null check (char_length(symbol) between 1 and 32),
  market text not null check (market in ('KR', 'US')),
  quote_json jsonb not null,
  cached_at timestamptz not null,
  expires_at timestamptz not null,
  unique (symbol, market),
  check (expires_at > cached_at)
);

comment on table public.market_quote_cache is 'Server-written quote cache by symbol and market.';

create table public.market_chart_cache (
  id uuid primary key default gen_random_uuid(),
  symbol text not null check (char_length(symbol) between 1 and 32),
  market text not null check (market in ('KR', 'US')),
  timeframe text not null check (timeframe in ('daily', 'weekly', 'monthly')),
  chart_json jsonb not null,
  indicator_json jsonb not null default '{}'::jsonb,
  cached_at timestamptz not null,
  expires_at timestamptz not null,
  unique (symbol, market, timeframe),
  check (expires_at > cached_at)
);

comment on table public.market_chart_cache is 'Server-written OHLCV and indicator cache.';

create table public.chart_ai_cache (
  id uuid primary key default gen_random_uuid(),
  symbol text not null check (char_length(symbol) between 1 and 32),
  market text not null check (market in ('KR', 'US')),
  timeframe text not null check (timeframe in ('daily', 'weekly', 'monthly')),
  analysis_json jsonb not null,
  model_used text,
  cached_at timestamptz not null,
  expires_at timestamptz not null,
  unique (symbol, market, timeframe),
  check (expires_at > cached_at)
);

comment on table public.chart_ai_cache is 'Non-personal Chart AI response cache by symbol, market, and timeframe.';

create table public.heatmap_cache (
  id uuid primary key default gen_random_uuid(),
  universe text not null check (char_length(universe) between 1 and 120),
  user_id uuid references auth.users(id) on delete cascade,
  data_json jsonb not null,
  cached_at timestamptz not null,
  expires_at timestamptz not null,
  check (expires_at > cached_at)
);

comment on table public.heatmap_cache is 'Public market heatmap cache and optional user-owned portfolio heatmap cache.';

create table public.lab_sp500_sector_returns (
  id uuid primary key default gen_random_uuid(),
  year integer not null check (year between 1900 and 2200),
  sector_key text not null check (char_length(sector_key) between 1 and 80),
  sector_name_ko text,
  index_name text not null,
  return_pct numeric,
  rank integer check (rank is null or rank > 0),
  source_url text,
  updated_at timestamptz not null default now(),
  unique (year, sector_key)
);

comment on table public.lab_sp500_sector_returns is 'Annual S&P 500 sector return records for Lab pages.';

create table public.lab_asset_class_returns (
  id uuid primary key default gen_random_uuid(),
  year integer not null check (year between 1900 and 2200),
  asset_key text not null check (char_length(asset_key) between 1 and 80),
  asset_name_ko text,
  tracking_index text,
  representative_etfs text[],
  return_pct numeric,
  source_url text,
  updated_at timestamptz not null default now(),
  unique (year, asset_key)
);

comment on table public.lab_asset_class_returns is 'Annual asset-class return records for Lab pages.';

create table public.lab_nps_holdings (
  id uuid primary key default gen_random_uuid(),
  source_type text not null check (char_length(source_type) between 1 and 80),
  report_type text,
  report_date date,
  symbol text,
  company_name text not null,
  market text check (market in ('KR', 'US')),
  shares numeric check (shares is null or shares >= 0),
  value numeric check (value is null or value >= 0),
  currency text check (currency is null or currency in ('KRW', 'USD')),
  sector text,
  source_url text,
  raw_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

comment on table public.lab_nps_holdings is 'Normalized NPS holdings records for Lab pages.';

create table public.lab_congress_stock_holdings (
  id uuid primary key default gen_random_uuid(),
  disclosure_year integer not null check (disclosure_year between 1900 and 2200),
  disclosure_date date,
  report_base_date date,
  lawmaker_name text not null,
  party text,
  relation text,
  security_type text,
  symbol text,
  company_name text not null,
  shares numeric check (shares is null or shares >= 0),
  current_value_krw_thousand numeric check (current_value_krw_thousand is null or current_value_krw_thousand >= 0),
  raw_text text,
  source_page integer check (source_page is null or source_page > 0),
  updated_at timestamptz not null default now()
);

comment on table public.lab_congress_stock_holdings is 'Normalized public official stock holding disclosure records for Lab pages.';

create table public.ad_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  ad_type text not null check (char_length(ad_type) between 1 and 80),
  event_type text not null check (event_type in ('impression', 'click', 'close', 'affiliate_open')),
  page_path text check (page_path is null or char_length(page_path) <= 300),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.ad_events is 'Server-written minimal ad interaction events. Do not store direct personal contact or payment data.';

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_portfolios_updated_at
before update on public.portfolios
for each row execute function public.set_updated_at();

create trigger set_portfolio_positions_updated_at
before update on public.portfolio_positions
for each row execute function public.set_updated_at();

create trigger set_ai_usage_daily_updated_at
before update on public.ai_usage_daily
for each row execute function public.set_updated_at();

create trigger set_market_symbols_updated_at
before update on public.market_symbols
for each row execute function public.set_updated_at();

create trigger set_lab_sp500_sector_returns_updated_at
before update on public.lab_sp500_sector_returns
for each row execute function public.set_updated_at();

create trigger set_lab_asset_class_returns_updated_at
before update on public.lab_asset_class_returns
for each row execute function public.set_updated_at();

create trigger set_lab_nps_holdings_updated_at
before update on public.lab_nps_holdings
for each row execute function public.set_updated_at();

create trigger set_lab_congress_stock_holdings_updated_at
before update on public.lab_congress_stock_holdings
for each row execute function public.set_updated_at();

create index profiles_email_idx on public.profiles (lower(email)) where email is not null;
create index portfolios_user_id_idx on public.portfolios (user_id);
create index portfolio_positions_portfolio_id_idx on public.portfolio_positions (portfolio_id);
create index portfolio_positions_symbol_market_idx on public.portfolio_positions (market, symbol);
create index market_symbols_search_idx on public.market_symbols (market, asset_type, is_active, lower(symbol), lower(name));
create index market_symbols_sector_idx on public.market_symbols (market, sector) where sector is not null;
create index market_quote_cache_symbol_market_idx on public.market_quote_cache (symbol, market);
create index market_quote_cache_expires_at_idx on public.market_quote_cache (expires_at);
create index market_chart_cache_symbol_market_timeframe_idx on public.market_chart_cache (symbol, market, timeframe);
create index market_chart_cache_expires_at_idx on public.market_chart_cache (expires_at);
create index chart_ai_cache_symbol_market_timeframe_idx on public.chart_ai_cache (symbol, market, timeframe);
create index chart_ai_cache_expires_at_idx on public.chart_ai_cache (expires_at);
create index heatmap_cache_universe_user_id_idx on public.heatmap_cache (universe, user_id);
create index heatmap_cache_expires_at_idx on public.heatmap_cache (expires_at);
create unique index heatmap_cache_public_universe_unique_idx on public.heatmap_cache (universe) where user_id is null;
create unique index heatmap_cache_user_universe_unique_idx on public.heatmap_cache (user_id, universe) where user_id is not null;
create index lab_sp500_sector_returns_year_rank_idx on public.lab_sp500_sector_returns (year, rank);
create index lab_asset_class_returns_year_idx on public.lab_asset_class_returns (year);
create index lab_nps_holdings_report_date_idx on public.lab_nps_holdings (report_date);
create index lab_nps_holdings_symbol_market_idx on public.lab_nps_holdings (symbol, market) where symbol is not null;
create index lab_congress_stock_holdings_year_idx on public.lab_congress_stock_holdings (disclosure_year);
create index lab_congress_stock_holdings_lawmaker_idx on public.lab_congress_stock_holdings (lawmaker_name);
create index lab_congress_stock_holdings_symbol_idx on public.lab_congress_stock_holdings (symbol) where symbol is not null;
create index ad_events_created_at_idx on public.ad_events (created_at);
create index ad_events_page_path_idx on public.ad_events (page_path) where page_path is not null;

alter table public.profiles enable row level security;
alter table public.portfolios enable row level security;
alter table public.portfolio_positions enable row level security;
alter table public.ai_usage_daily enable row level security;
alter table public.market_symbols enable row level security;
alter table public.market_quote_cache enable row level security;
alter table public.market_chart_cache enable row level security;
alter table public.chart_ai_cache enable row level security;
alter table public.heatmap_cache enable row level security;
alter table public.lab_sp500_sector_returns enable row level security;
alter table public.lab_asset_class_returns enable row level security;
alter table public.lab_nps_holdings enable row level security;
alter table public.lab_congress_stock_holdings enable row level security;
alter table public.ad_events enable row level security;

revoke all on table
  public.profiles,
  public.portfolios,
  public.portfolio_positions,
  public.ai_usage_daily,
  public.market_symbols,
  public.market_quote_cache,
  public.market_chart_cache,
  public.chart_ai_cache,
  public.heatmap_cache,
  public.lab_sp500_sector_returns,
  public.lab_asset_class_returns,
  public.lab_nps_holdings,
  public.lab_congress_stock_holdings,
  public.ad_events
from public, anon, authenticated;

grant usage on schema public to anon, authenticated, service_role;
grant select on public.profiles to authenticated;
grant insert (id, email, display_name) on public.profiles to authenticated;
grant update (email, display_name) on public.profiles to authenticated;
grant select, insert, update, delete on public.portfolios to authenticated;
grant select, insert, update, delete on public.portfolio_positions to authenticated;
grant select on public.ai_usage_daily to authenticated;
grant select on public.market_symbols to anon, authenticated;
grant select on public.market_quote_cache to anon, authenticated;
grant select on public.market_chart_cache to anon, authenticated;
grant select on public.chart_ai_cache to anon, authenticated;
grant select on public.heatmap_cache to anon, authenticated;
grant select on public.lab_sp500_sector_returns to anon, authenticated;
grant select on public.lab_asset_class_returns to anon, authenticated;
grant select on public.lab_nps_holdings to anon, authenticated;
grant select on public.lab_congress_stock_holdings to anon, authenticated;
grant select, insert, update, delete on table
  public.profiles,
  public.portfolios,
  public.portfolio_positions,
  public.ai_usage_daily,
  public.market_symbols,
  public.market_quote_cache,
  public.market_chart_cache,
  public.chart_ai_cache,
  public.heatmap_cache,
  public.lab_sp500_sector_returns,
  public.lab_asset_class_returns,
  public.lab_nps_holdings,
  public.lab_congress_stock_holdings,
  public.ad_events
to service_role;

create policy profiles_select_own
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy profiles_insert_own_free
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id and plan = 'free');

create policy profiles_update_own
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy portfolios_select_own
on public.portfolios
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy portfolios_insert_own
on public.portfolios
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy portfolios_update_own
on public.portfolios
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy portfolios_delete_own
on public.portfolios
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy portfolio_positions_select_owned
on public.portfolio_positions
for select
to authenticated
using (
  exists (
    select 1
    from public.portfolios
    where portfolios.id = portfolio_positions.portfolio_id
      and portfolios.user_id = (select auth.uid())
  )
);

create policy portfolio_positions_insert_owned
on public.portfolio_positions
for insert
to authenticated
with check (
  exists (
    select 1
    from public.portfolios
    where portfolios.id = portfolio_positions.portfolio_id
      and portfolios.user_id = (select auth.uid())
  )
);

create policy portfolio_positions_update_owned
on public.portfolio_positions
for update
to authenticated
using (
  exists (
    select 1
    from public.portfolios
    where portfolios.id = portfolio_positions.portfolio_id
      and portfolios.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.portfolios
    where portfolios.id = portfolio_positions.portfolio_id
      and portfolios.user_id = (select auth.uid())
  )
);

create policy portfolio_positions_delete_owned
on public.portfolio_positions
for delete
to authenticated
using (
  exists (
    select 1
    from public.portfolios
    where portfolios.id = portfolio_positions.portfolio_id
      and portfolios.user_id = (select auth.uid())
  )
);

create policy ai_usage_daily_select_own
on public.ai_usage_daily
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy market_symbols_public_read
on public.market_symbols
for select
to anon, authenticated
using (true);

create policy market_quote_cache_public_read
on public.market_quote_cache
for select
to anon, authenticated
using (true);

create policy market_chart_cache_public_read
on public.market_chart_cache
for select
to anon, authenticated
using (true);

create policy chart_ai_cache_public_read
on public.chart_ai_cache
for select
to anon, authenticated
using (true);

create policy heatmap_cache_read_public_or_own
on public.heatmap_cache
for select
to anon, authenticated
using (user_id is null or (select auth.uid()) = user_id);

create policy lab_sp500_sector_returns_public_read
on public.lab_sp500_sector_returns
for select
to anon, authenticated
using (true);

create policy lab_asset_class_returns_public_read
on public.lab_asset_class_returns
for select
to anon, authenticated
using (true);

create policy lab_nps_holdings_public_read
on public.lab_nps_holdings
for select
to anon, authenticated
using (true);

create policy lab_congress_stock_holdings_public_read
on public.lab_congress_stock_holdings
for select
to anon, authenticated
using (true);

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
