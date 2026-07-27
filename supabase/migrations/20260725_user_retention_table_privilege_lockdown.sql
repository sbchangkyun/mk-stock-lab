-- Phase 3GI-HF2: restrict authenticated privileges on retention tables to DML only.
-- Forward-only hotfix after user_retention_persistence was applied.

revoke all privileges on table public.user_preferences from public, anon, authenticated;
grant select, insert, update, delete on table public.user_preferences to authenticated;
grant all privileges on table public.user_preferences to service_role;

revoke all privileges on table public.user_watchlist_items from public, anon, authenticated;
grant select, insert, update, delete on table public.user_watchlist_items to authenticated;
grant all privileges on table public.user_watchlist_items to service_role;
