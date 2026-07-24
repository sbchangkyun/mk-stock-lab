-- Phase 3GI: cross-device user retention (resume state) + watchlist persistence.
-- Apply via Supabase Dashboard > SQL Editor (do NOT execute via Claude Code). Additive, forward-only.
--
-- Why: session restoration and a cross-device watchlist require durable, per-user state beyond
-- localStorage (which does not follow a user across devices). This migration adds exactly two new
-- tables, both directly user_id-owned with RLS restricted to the owning row -- no new provider,
-- quote, or trading surface, and no change to any existing table.
--
-- Boundary: no anon access. Neither table stores tokens, sessions, or any provider/quote data --
-- only a bounded resume pointer (last surface/portfolio/chart instrument/timeframe/activity time)
-- and a bounded list of user-chosen watchlist symbols. `last_portfolio_id` references
-- public.portfolios and is set null (never cascaded/deleted) if that portfolio is later removed,
-- so a stale pointer can never resolve to someone else's portfolio. Reuses the existing
-- public.set_updated_at() trigger function defined in 20260615_rebuild_schema_v0_1.sql.
--
-- Phase 3GI-HF1 (same file, edited in place -- still unapplied, so there is no second migration):
-- hardened before the first application to Production. Changes: `last_surface` gained `lab` and a
-- NOT NULL / DEFAULT 'home' contract; a chart-state-consistency CHECK now rejects a partial chart
-- resume pointer (market without symbol, symbol without market, or name/timeframe set without both
-- market and symbol); chart-symbol and watchlist-symbol CHECK constraints now validate against the
-- same KR/US symbol patterns already authoritative elsewhere in this codebase
-- (`src/lib/market-data/instrument.ts`), not merely a length bound; `last_chart_timeframe` is now
-- constrained to the exact set of timeframes Chart AI's UI actually supports; and the
-- `user_preferences` INSERT/UPDATE policies now independently re-verify (defense in depth, alongside
-- the existing server-side `ensurePortfolioOwned` check) that a non-null `last_portfolio_id` belongs
-- to the same authenticated user, so a client that bypasses the server route cannot point another
-- user's row at a foreign portfolio.

-- ============================================================
-- 1. public.user_preferences -- one row per user, the resume-state pointer.
-- ============================================================
create table public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_surface text not null default 'home' check (last_surface in ('home', 'chart_ai', 'portfolio', 'lab')),
  last_portfolio_id uuid references public.portfolios(id) on delete set null,
  last_chart_market text check (last_chart_market in ('KR', 'US')),
  last_chart_symbol text check (char_length(last_chart_symbol) between 1 and 32),
  last_chart_name text check (char_length(last_chart_name) <= 160),
  -- Exact set of timeframes Chart AI's real-chart UI supports (src/pages/chart-ai.astro data-range
  -- buttons / RANGE_LABELS) -- not a length bound, so an unsupported value can never be persisted.
  last_chart_timeframe text check (last_chart_timeframe in ('1m', '3m', '6m', '1y')),
  last_activity_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- A chart resume pointer must be either fully absent or fully identified (market + symbol both
  -- present); name/timeframe can never be set without an identified instrument. Prevents "market
  -- without symbol", "symbol without market", and "name/timeframe without market+symbol".
  constraint user_preferences_chart_state_consistent check (
    (last_chart_market is null and last_chart_symbol is null and last_chart_name is null and last_chart_timeframe is null)
    or (last_chart_market is not null and last_chart_symbol is not null)
  ),
  -- Same KR/US symbol contract as src/lib/market-data/instrument.ts (isKrSymbol/isUsSymbol) -- not a
  -- third convention. Symbols are normalized to uppercase by the server before this row is written.
  constraint user_preferences_chart_symbol_format check (
    last_chart_symbol is null
    or (last_chart_market = 'KR' and last_chart_symbol ~ '^[0-9A-Z]{6}$')
    or (last_chart_market = 'US' and last_chart_symbol ~ '^[A-Z][A-Z0-9.-]{0,9}$')
  )
);

comment on table public.user_preferences is
  'Per-user cross-device resume pointer only (last surface/portfolio/chart instrument/timeframe/activity time). No tokens, sessions, quotes, or provider data.';

create trigger set_user_preferences_updated_at
before update on public.user_preferences
for each row execute function public.set_updated_at();

alter table public.user_preferences enable row level security;

revoke all on public.user_preferences from public, anon;
grant select, insert, update, delete on public.user_preferences to authenticated;

create policy user_preferences_select_own
on public.user_preferences
for select
to authenticated
using ((select auth.uid()) = user_id);

-- Defense in depth alongside the server's own ensurePortfolioOwned check: a null last_portfolio_id
-- is always allowed, but a non-null value is only accepted when it names a portfolio row owned by
-- this same authenticated user. This independently rejects a foreign portfolio pointer even if a
-- client bypassed the server route and wrote to this table directly. The subquery's existence check
-- alone determines pass/fail -- it does not leak whether a foreign portfolio id exists at all.
create policy user_preferences_insert_own
on public.user_preferences
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and (
    last_portfolio_id is null
    or exists (
      select 1
      from public.portfolios p
      where p.id = last_portfolio_id
        and p.user_id = (select auth.uid())
    )
  )
);

create policy user_preferences_update_own
on public.user_preferences
for update
to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and (
    last_portfolio_id is null
    or exists (
      select 1
      from public.portfolios p
      where p.id = last_portfolio_id
        and p.user_id = (select auth.uid())
    )
  )
);

create policy user_preferences_delete_own
on public.user_preferences
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- ============================================================
-- 2. public.user_watchlist_items -- cross-device watchlist, max 50 per user
--    (the 50-item cap is enforced server-side in application code, not by a DB constraint).
-- ============================================================
create table public.user_watchlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  market text not null check (market in ('KR', 'US')),
  symbol text not null check (char_length(symbol) between 1 and 32),
  name text check (char_length(name) <= 160),
  asset_type text not null check (asset_type in ('stock', 'etf')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, market, symbol),
  -- Same KR/US symbol contract as src/lib/market-data/instrument.ts (isKrSymbol/isUsSymbol) -- not a
  -- third convention. Symbols are normalized to uppercase by the server before this row is written.
  constraint user_watchlist_items_symbol_format check (
    (market = 'KR' and symbol ~ '^[0-9A-Z]{6}$')
    or (market = 'US' and symbol ~ '^[A-Z][A-Z0-9.-]{0,9}$')
  )
);

comment on table public.user_watchlist_items is
  'Per-user cross-device watchlist of KR/US stocks and ETFs. No quote data, no polling target list beyond symbol/market/name/type.';

create trigger set_user_watchlist_items_updated_at
before update on public.user_watchlist_items
for each row execute function public.set_updated_at();

create index user_watchlist_items_user_id_idx on public.user_watchlist_items (user_id, created_at desc);

alter table public.user_watchlist_items enable row level security;

revoke all on public.user_watchlist_items from public, anon;
grant select, insert, update, delete on public.user_watchlist_items to authenticated;

create policy user_watchlist_items_select_own
on public.user_watchlist_items
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy user_watchlist_items_insert_own
on public.user_watchlist_items
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy user_watchlist_items_update_own
on public.user_watchlist_items
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy user_watchlist_items_delete_own
on public.user_watchlist_items
for delete
to authenticated
using ((select auth.uid()) = user_id);
