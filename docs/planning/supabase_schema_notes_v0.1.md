# Supabase Schema Notes v0.1

Status: Phase 2B reviewed local draft only

## Tables Drafted

- User/account: `profiles`
- Portfolio: `portfolios`, `portfolio_positions`
- Chart AI usage: `ai_usage_daily`
- Market data: `market_symbols`, `market_quote_cache`, `market_chart_cache`, `chart_ai_cache`, `heatmap_cache`
- Lab data: `lab_sp500_sector_returns`, `lab_asset_class_returns`, `lab_nps_holdings`, `lab_congress_stock_holdings`
- Ads: `ad_events`

## RLS Summary

- RLS is enabled on every public table in the migration draft.
- `profiles` allows authenticated users to select their own profile row, insert their own initial free profile, and update only editable profile columns.
- `portfolios` allows authenticated users to create, read, update, and delete only their own portfolios.
- `portfolio_positions` allows authenticated users to create, read, update, and delete only positions attached to portfolios they own.
- `ai_usage_daily` allows authenticated users to read only their own usage rows. Public client writes are not allowed.
- `market_symbols`, market cache tables, `chart_ai_cache`, and public `heatmap_cache` rows allow public read and no public write.
- `heatmap_cache` also allows authenticated users to read their own user-scoped cache rows.
- Lab tables allow public read and no public write.
- `ad_events` is server-write only in the reviewed draft. It does not expose public select or public insert access.

## Functions and Triggers

- `public.set_updated_at()` updates mutable tables before row updates.
- `internal.consume_chart_ai_usage(uuid, integer)` is a draft server-only function for atomic Chart AI daily usage consumption.
- The usage function uses the KST calendar day and defaults to a free limit of 3.
- The usage function returns `allowed`, `used_count`, `free_limit`, `remaining_count`, and `usage_date_kst`.
- The usage function is in the `internal` schema, uses `security definer`, sets an empty `search_path`, and grants execution only to `service_role`.

## Phase 2B Review Result

- All 14 required tables are present in the migration draft.
- `chart_ai_cache` remains non-personal and has no `user_id` column.
- `portfolio_positions` policies depend on ownership through `portfolios`.
- `ai_usage_daily` allows authenticated users to read only their own usage and does not allow public client writes.
- Market, Lab, and cache tables allow public read where intended and no public write.
- User-scoped `heatmap_cache` rows are visible only to their owning authenticated user.
- Service-role table grants were added for server-side writes in newer Supabase projects where public schema objects are not auto-exposed.
- `public.set_updated_at()` execution was revoked from public client roles because it is only needed as a trigger function.

## Decisions

- `ad_events`: use server-side insert through a future API route. Anonymous/client insert was removed from the draft to reduce spam and metadata-abuse risk. A later implementation should add API-level rate limiting before recording ad events.
- `profiles`: use login-time upsert in a later auth phase rather than an auth trigger. The migration supports authenticated users inserting their own initial free profile and updating only editable columns. Plan changes remain server-controlled through `service_role`.

## Not Applied Yet

- This migration has not been applied to any local, disposable, branch, or remote Supabase database.
- No remote Supabase connection was used during Phase 2A.
- No existing remote tables were dropped, reset, migrated, or altered.
- No KIS, OpenDART, OpenAI, Gemini, Chart AI UI logic, Heatmap data logic, or Lab ingestion logic was implemented.

## Local Validation Steps

Use a disposable local Supabase database or disposable branch database only. Do not run these commands against production.

1. Install or make available a project-local Supabase CLI only after human approval.
2. Run `supabase --version` and confirm the CLI supports local database commands.
3. Run `supabase start` in a disposable environment.
4. Apply the migration to the local database only.
5. Run SQL checks for table count, primary keys, foreign keys, RLS-enabled tables, grants, policies, and function privileges.
6. Test `internal.consume_chart_ai_usage` using the service role and confirm the fourth use on the same KST date returns `allowed = false`.
7. Test authenticated profile insert and editable-column update behavior.
8. Test that authenticated clients cannot update `profiles.plan`.
9. Test that anonymous and authenticated clients cannot insert `ad_events`.
10. Run Supabase advisors against the disposable database and review findings before any remote application.

## Human Review Before Remote Application

1. Review all table names, column names, checks, and indexes against product requirements.
2. Confirm whether the target Supabase project requires explicit Data API grants for newly created public tables.
3. Review RLS policies in a disposable local or branch database before production application.
4. Validate `internal.consume_chart_ai_usage` with concurrent usage tests before wiring it to server routes.
5. Confirm the login-time `profiles` upsert path during the auth implementation phase.
6. Confirm the server-only `ad_events` API route and rate-limiting design before tracking ad events.
7. Run Supabase advisors after applying to a local or branch database.
