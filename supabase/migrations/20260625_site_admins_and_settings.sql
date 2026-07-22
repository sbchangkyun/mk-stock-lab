-- Phase 3CA: site_admins and site_settings tables
-- Apply via Supabase Dashboard > SQL Editor (do not execute via Claude Code).
-- After applying, owner must insert their own auth user_id to gain master access:
--   insert into public.site_admins (user_id, role)
--   values ('<YOUR_SUPABASE_AUTH_USER_ID>', 'master');

-- ============================================================
-- Tables
-- ============================================================

create table if not exists public.site_admins (
  user_id   uuid        primary key references auth.users(id) on delete cascade,
  role      text        not null default 'master' check (role in ('master')),
  created_at timestamptz not null default now()
);
comment on table public.site_admins is
  'Operator/master admin registry. Populated manually by owner via Supabase dashboard.';

create table if not exists public.site_settings (
  key        text        primary key,
  value      jsonb       not null default '{}'::jsonb,
  updated_by uuid        references auth.users(id),
  updated_at timestamptz not null default now()
);
comment on table public.site_settings is
  'Key-value site configuration. Keys are stable string identifiers.';

-- ============================================================
-- Security-definer helper for RLS
-- Avoids recursive RLS evaluation on site_admins.
-- ============================================================

create or replace function public.is_site_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.site_admins
    where user_id = auth.uid()
  );
$$;

comment on function public.is_site_admin() is
  'Returns true if the current authenticated user has a row in site_admins.';

revoke all on function public.is_site_admin() from public;
grant execute on function public.is_site_admin() to authenticated;

-- ============================================================
-- RLS: site_admins
-- ============================================================

alter table public.site_admins enable row level security;

create policy "site_admins: authenticated user reads own row"
  on public.site_admins
  for select to authenticated
  using (user_id = auth.uid());

-- No client-side insert/update/delete on site_admins.
-- Owner seeds this table via Supabase dashboard or SQL Editor.

-- ============================================================
-- RLS: site_settings
-- ============================================================

alter table public.site_settings enable row level security;

-- Anyone (including anonymous visitors) may read the home_rail_banners key.
create policy "site_settings: public read home_rail_banners"
  on public.site_settings
  for select to anon, authenticated
  using (key = 'home_rail_banners');

-- Only master admins may insert new settings rows.
create policy "site_settings: master insert"
  on public.site_settings
  for insert to authenticated
  with check (public.is_site_admin());

-- Only master admins may update existing settings rows.
create policy "site_settings: master update"
  on public.site_settings
  for update to authenticated
  using (public.is_site_admin())
  with check (public.is_site_admin());

-- ============================================================
-- Default data: 3 inactive placeholder banner slots
-- ============================================================

insert into public.site_settings (key, value, updated_at)
values (
  'home_rail_banners',
  '[
    {"slot": 1, "imageUrl": "", "linkUrl": "", "alt": "", "active": false},
    {"slot": 2, "imageUrl": "", "linkUrl": "", "alt": "", "active": false},
    {"slot": 3, "imageUrl": "", "linkUrl": "", "alt": "", "active": false}
  ]'::jsonb,
  now()
)
on conflict (key) do nothing;
