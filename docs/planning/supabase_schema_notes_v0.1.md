# Supabase Schema Notes v0.1

Status: Phase 2A local draft only

## Tables Drafted

- User/account: `profiles`
- Portfolio: `portfolios`, `portfolio_positions`
- Chart AI usage: `ai_usage_daily`
- Market data: `market_symbols`, `market_quote_cache`, `market_chart_cache`, `chart_ai_cache`, `heatmap_cache`
- Lab data: `lab_sp500_sector_returns`, `lab_asset_class_returns`, `lab_nps_holdings`, `lab_congress_stock_holdings`
- Ads: `ad_events`

## RLS Summary

- RLS is enabled on every public table in the migration draft.
- `profiles` allows authenticated users to select and update only their own profile row.
- `portfolios` allows authenticated users to create, read, update, and delete only their own portfolios.
- `portfolio_positions` allows authenticated users to create, read, update, and delete only positions attached to portfolios they own.
- `ai_usage_daily` allows authenticated users to read only their own usage rows. Public client writes are not allowed.
- `market_symbols`, market cache tables, `chart_ai_cache`, and public `heatmap_cache` rows allow public read and no public write.
- `heatmap_cache` also allows authenticated users to read their own user-scoped cache rows.
- Lab tables allow public read and no public write.
- `ad_events` allows minimal anonymous or authenticated inserts only. It does not expose public select access.

## Functions and Triggers

- `public.set_updated_at()` updates mutable tables before row updates.
- `internal.consume_chart_ai_usage(uuid, integer)` is a draft server-only function for atomic Chart AI daily usage consumption.
- The usage function uses the KST calendar day and defaults to a free limit of 3.
- The usage function is in the `internal` schema, uses `security definer`, sets an empty `search_path`, and grants execution only to `service_role`.

## Not Applied Yet

- This migration has not been applied to any local or remote Supabase database.
- No remote Supabase connection was used during Phase 2A.
- No existing remote tables were dropped, reset, migrated, or altered.
- No KIS, OpenDART, OpenAI, Gemini, Chart AI UI logic, Heatmap data logic, or Lab ingestion logic was implemented.

## Human Review Before Remote Application

1. Review all table names, column names, checks, and indexes against product requirements.
2. Confirm whether the target Supabase project requires explicit Data API grants for newly created public tables.
3. Review RLS policies in a disposable local or branch database before production application.
4. Validate `internal.consume_chart_ai_usage` with concurrent usage tests before wiring it to server routes.
5. Confirm whether `profiles` should get a separate onboarding insert path or an auth user creation trigger in a later phase.
6. Confirm whether public `ad_events` inserts are acceptable or should be server-side only.
7. Run Supabase advisors after applying to a local or branch database.
