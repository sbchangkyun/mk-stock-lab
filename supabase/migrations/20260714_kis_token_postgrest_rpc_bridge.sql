-- Phase 3GG-T-HF2-HF1: public PostgREST RPC bridge for the durable KIS token store.
-- Apply via Supabase Dashboard > SQL Editor (do NOT execute via Claude Code). Additive, forward-only.
--
-- Why: the durable token manager reaches Supabase through the JS client. PostgREST does not expose the
-- `internal` schema (PGRST106), so the earlier activation failed closed. These six SECURITY DEFINER bridge
-- functions live in `public` (which IS exposed) and DELEGATE to the authoritative `internal` tables/
-- functions, so `internal` never needs to be added to Supabase "Exposed schemas".
--
-- Boundary: bridges are service_role-ONLY (execute revoked from public/anon/authenticated). No token table
-- or view is created in public; the encrypted envelope stays in internal.kis_token_state. RLS on the
-- internal tables is unchanged. No internal object is dropped, moved, or altered here.

-- ============================================================
-- 1. public.kis_token_read_state  (metadata + encrypted envelope only; never plaintext)
--    Replaces the old direct .schema('internal').from('kis_token_state') read.
-- ============================================================
create or replace function public.kis_token_read_state(p_scope_key text)
returns table (
  scope_key                 text,
  provider                  text,
  status                    text,
  token_ciphertext          text,
  token_iv                  text,
  token_auth_tag            text,
  encryption_key_version    integer,
  generation_id             uuid,
  issued_at                 timestamptz,
  expires_at                timestamptz,
  usable_until              timestamptz,
  last_issue_attempt_at     timestamptz,
  last_issue_success_at     timestamptz,
  last_forced_refresh_at    timestamptz,
  last_error_code           text,
  invalidated_generation_id uuid,
  lease_owner               text,
  lease_version             bigint,
  lease_acquired_at         timestamptz,
  lease_expires_at          timestamptz,
  created_at                timestamptz,
  updated_at                timestamptz
)
language sql
security definer
set search_path = ''
as $$
  select
    s.scope_key, s.provider, s.status,
    s.token_ciphertext, s.token_iv, s.token_auth_tag, s.encryption_key_version,
    s.generation_id, s.issued_at, s.expires_at, s.usable_until,
    s.last_issue_attempt_at, s.last_issue_success_at, s.last_forced_refresh_at,
    s.last_error_code, s.invalidated_generation_id,
    s.lease_owner, s.lease_version, s.lease_acquired_at, s.lease_expires_at,
    s.created_at, s.updated_at
  from internal.kis_token_state as s
  where s.scope_key = p_scope_key
  limit 1;
$$;
comment on function public.kis_token_read_state(text) is
  'Service-role-only bridge: returns one internal.kis_token_state row (encrypted envelope only, never plaintext). Lets the durable token manager read state without exposing the internal schema through PostgREST. No browser access.';

-- ============================================================
-- 2. public.kis_token_acquire_lease  -> internal.acquire_kis_token_lease (atomic fencing lease)
-- ============================================================
create or replace function public.kis_token_acquire_lease(
  p_scope_key        text,
  p_lease_owner      text,
  p_lease_ttl_seconds integer
)
returns table (acquired boolean, lease_version bigint, lease_expires_at timestamptz)
language sql
security definer
set search_path = ''
as $$
  select acquired, lease_version, lease_expires_at
  from internal.acquire_kis_token_lease(p_scope_key, p_lease_owner, p_lease_ttl_seconds);
$$;
comment on function public.kis_token_acquire_lease(text, text, integer) is
  'Service-role-only bridge to internal.acquire_kis_token_lease. Delegates the atomic fencing lease; no locking logic is duplicated here. No browser access.';

-- ============================================================
-- 3. public.kis_token_release_lease  -> internal.release_kis_token_lease (fenced)
-- ============================================================
create or replace function public.kis_token_release_lease(
  p_scope_key     text,
  p_lease_owner   text,
  p_lease_version bigint
)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select internal.release_kis_token_lease(p_scope_key, p_lease_owner, p_lease_version);
$$;
comment on function public.kis_token_release_lease(text, text, bigint) is
  'Service-role-only bridge to internal.release_kis_token_lease (owner + version fenced). No browser access.';

-- ============================================================
-- 4. public.kis_token_store_generation -> internal.store_kis_token_generation (atomic store + release)
-- ============================================================
create or replace function public.kis_token_store_generation(
  p_scope_key      text,
  p_lease_owner    text,
  p_lease_version  bigint,
  p_generation_id  uuid,
  p_ciphertext     text,
  p_iv             text,
  p_auth_tag       text,
  p_key_version    integer,
  p_issued_at      timestamptz,
  p_expires_at     timestamptz,
  p_usable_until   timestamptz
)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select internal.store_kis_token_generation(
    p_scope_key, p_lease_owner, p_lease_version, p_generation_id,
    p_ciphertext, p_iv, p_auth_tag, p_key_version,
    p_issued_at, p_expires_at, p_usable_until
  );
$$;
comment on function public.kis_token_store_generation(text, text, bigint, uuid, text, text, text, integer, timestamptz, timestamptz, timestamptz) is
  'Service-role-only bridge to internal.store_kis_token_generation (atomic encrypted-envelope store + lease release, stale-lease fenced). Accepts only the encrypted envelope, never plaintext. No browser access.';

-- ============================================================
-- 5. public.kis_token_invalidate_generation -> internal.invalidate_kis_token_generation (generation-matched)
-- ============================================================
create or replace function public.kis_token_invalidate_generation(
  p_scope_key     text,
  p_generation_id uuid
)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select internal.invalidate_kis_token_generation(p_scope_key, p_generation_id);
$$;
comment on function public.kis_token_invalidate_generation(text, uuid) is
  'Service-role-only bridge to internal.invalidate_kis_token_generation (invalidates ONLY the matching generation). No browser access.';

-- ============================================================
-- 6. public.kis_token_record_event -> internal.record_kis_token_event (metadata-only telemetry)
-- ============================================================
create or replace function public.kis_token_record_event(
  p_scope_key      text,
  p_event_type     text,
  p_generation_id  uuid,
  p_route_category text,
  p_deployment_id  text,
  p_instance_id    text,
  p_lock_wait_ms   integer,
  p_safe_error_code text,
  p_metadata       jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform internal.record_kis_token_event(
    p_scope_key, p_event_type, p_generation_id, p_route_category,
    p_deployment_id, p_instance_id, p_lock_wait_ms, p_safe_error_code, p_metadata
  );
end;
$$;
comment on function public.kis_token_record_event(text, text, uuid, text, text, text, integer, text, jsonb) is
  'Service-role-only bridge to internal.record_kis_token_event (metadata-only telemetry; the internal function/table define the allowlist). No browser access.';

-- ============================================================
-- Privileges: service_role ONLY. Browser roles get nothing.
-- ============================================================
revoke all on function public.kis_token_read_state(text) from public, anon, authenticated;
revoke all on function public.kis_token_acquire_lease(text, text, integer) from public, anon, authenticated;
revoke all on function public.kis_token_release_lease(text, text, bigint) from public, anon, authenticated;
revoke all on function public.kis_token_store_generation(text, text, bigint, uuid, text, text, text, integer, timestamptz, timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function public.kis_token_invalidate_generation(text, uuid) from public, anon, authenticated;
revoke all on function public.kis_token_record_event(text, text, uuid, text, text, text, integer, text, jsonb) from public, anon, authenticated;

grant execute on function public.kis_token_read_state(text) to service_role;
grant execute on function public.kis_token_acquire_lease(text, text, integer) to service_role;
grant execute on function public.kis_token_release_lease(text, text, bigint) to service_role;
grant execute on function public.kis_token_store_generation(text, text, bigint, uuid, text, text, text, integer, timestamptz, timestamptz, timestamptz) to service_role;
grant execute on function public.kis_token_invalidate_generation(text, uuid) to service_role;
grant execute on function public.kis_token_record_event(text, text, uuid, text, text, text, integer, text, jsonb) to service_role;
