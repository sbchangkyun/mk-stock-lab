/*
 * Phase 3FD-C
 * DRAFT ONLY — NOT EXECUTED.
 * NOT APPROVED FOR EXECUTION.
 * Requires explicit owner approval before execution.
 * Review artifact only; do not apply through a database console, client, CLI, or migration runner.
 * Contains no secrets or environment values.
 * Contains no raw user, session, token, KIS, OHLC, account, trading, order, or balance fields.
 * User-facing reads are not approved by default.
 * Service-role usage requires separate approval.
 * Route success must remain disabled after any future migration.
 */

-- Draft table 1: server-owned role assignments.
-- `authenticated` is an approved role value but is derived from auth by default and must not be
-- persisted by the initial writer. `beta`, `owner`, and `admin` require explicit assignments.
create table chart_similarity_role_assignments (
  id uuid primary key,
  subject_ref text not null,
  role text not null,
  status text not null,
  granted_by_ref text not null,
  grant_reason text not null,
  valid_from timestamptz not null,
  valid_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_by_ref text,
  revocation_reason text,
  constraint chart_similarity_role_assignments_subject_ref_nonempty
    check (char_length(subject_ref) between 1 and 200),
  constraint chart_similarity_role_assignments_role_allowed
    check (role in ('authenticated', 'beta', 'owner', 'admin')),
  constraint chart_similarity_role_assignments_status_allowed
    check (status in ('active', 'scheduled', 'expired', 'revoked')),
  constraint chart_similarity_role_assignments_valid_window
    check (valid_until is null or valid_until > valid_from),
  constraint chart_similarity_role_assignments_grant_reason_bounded
    check (char_length(grant_reason) between 1 and 500),
  constraint chart_similarity_role_assignments_revocation_audit
    check (
      status <> 'revoked'
      or (
        revoked_at is not null
        and revoked_by_ref is not null
        and char_length(revoked_by_ref) between 1 and 200
        and revocation_reason is not null
        and char_length(revocation_reason) between 1 and 500
      )
    )
);

create unique index chart_similarity_role_assignments_one_active_subject_role_idx
  on chart_similarity_role_assignments (subject_ref, role)
  where status = 'active';

create index chart_similarity_role_assignments_subject_ref_idx
  on chart_similarity_role_assignments (subject_ref);

create index chart_similarity_role_assignments_role_status_idx
  on chart_similarity_role_assignments (role, status);

create index chart_similarity_role_assignments_validity_audit_idx
  on chart_similarity_role_assignments (valid_from, valid_until, updated_at);

-- Draft table 2: daily/monthly counters for the approved chart_similarity_scan scope.
-- Period boundaries are computed in Asia/Seoul by a separately approved future server writer.
create table chart_similarity_usage_counters (
  id uuid primary key,
  subject_ref text not null,
  role text not null,
  usage_scope text not null,
  period_type text not null,
  period_start timestamptz not null,
  period_end timestamptz not null,
  used_count integer not null default 0,
  limit_count integer not null,
  last_incremented_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chart_similarity_usage_counters_subject_ref_nonempty
    check (char_length(subject_ref) between 1 and 200),
  constraint chart_similarity_usage_counters_role_allowed
    check (role in ('authenticated', 'beta', 'owner', 'admin')),
  constraint chart_similarity_usage_counters_scope_allowed
    check (usage_scope = 'chart_similarity_scan'),
  constraint chart_similarity_usage_counters_period_type_allowed
    check (period_type in ('daily', 'monthly')),
  constraint chart_similarity_usage_counters_valid_period
    check (period_end > period_start),
  constraint chart_similarity_usage_counters_used_nonnegative
    check (used_count >= 0),
  constraint chart_similarity_usage_counters_limit_nonnegative
    check (limit_count >= 0),
  constraint chart_similarity_usage_counters_within_limit
    check (used_count <= limit_count),
  constraint chart_similarity_usage_counters_period_unique
    unique (subject_ref, usage_scope, period_type, period_start)
);

create index chart_similarity_usage_counters_subject_period_idx
  on chart_similarity_usage_counters (subject_ref, usage_scope, period_type, period_start, period_end);

create index chart_similarity_usage_counters_retention_idx
  on chart_similarity_usage_counters (period_end, updated_at);

-- Draft table 3: retry-safe usage audit events.
-- The future writer must insert the event and increment its counter in one transaction.
create table chart_similarity_usage_events (
  id uuid primary key,
  idempotency_key text not null,
  subject_ref text not null,
  role text not null,
  usage_scope text not null,
  event_type text not null,
  event_status text not null,
  period_start timestamptz not null,
  period_end timestamptz not null,
  increment_amount integer not null,
  created_at timestamptz not null default now(),
  metadata_safe jsonb not null default '{}'::jsonb,
  constraint chart_similarity_usage_events_idempotency_nonempty
    check (char_length(idempotency_key) between 1 and 200),
  constraint chart_similarity_usage_events_idempotency_unique
    unique (idempotency_key),
  constraint chart_similarity_usage_events_subject_ref_nonempty
    check (char_length(subject_ref) between 1 and 200),
  constraint chart_similarity_usage_events_role_allowed
    check (role in ('authenticated', 'beta', 'owner', 'admin')),
  constraint chart_similarity_usage_events_scope_allowed
    check (usage_scope = 'chart_similarity_scan'),
  constraint chart_similarity_usage_events_type_allowed
    check (event_type = 'increment'),
  constraint chart_similarity_usage_events_status_allowed
    check (event_status in ('committed', 'rejected')),
  constraint chart_similarity_usage_events_valid_period
    check (period_end > period_start),
  constraint chart_similarity_usage_events_increment_positive
    check (increment_amount > 0 and increment_amount <= 100),
  constraint chart_similarity_usage_events_metadata_object
    check (jsonb_typeof(metadata_safe) = 'object'),
  constraint chart_similarity_usage_events_metadata_bounded
    check (octet_length(metadata_safe::text) <= 2048)
);

create index chart_similarity_usage_events_subject_period_idx
  on chart_similarity_usage_events (subject_ref, usage_scope, period_start, period_end);

create index chart_similarity_usage_events_idempotency_idx
  on chart_similarity_usage_events (idempotency_key);

create index chart_similarity_usage_events_status_retention_idx
  on chart_similarity_usage_events (event_status, created_at);

-- Draft RLS model. These statements are review text only and have not been applied.
-- Authenticated user-facing reads and writes are denied by default.
-- A future server/admin writer requires separate runtime and credential-boundary approval.
alter table chart_similarity_role_assignments enable row level security;
alter table chart_similarity_usage_counters enable row level security;
alter table chart_similarity_usage_events enable row level security;

create policy chart_similarity_role_assignments_block_user_access
  on chart_similarity_role_assignments
  for all
  to authenticated
  using (false)
  with check (false);

create policy chart_similarity_usage_counters_block_user_access
  on chart_similarity_usage_counters
  for all
  to authenticated
  using (false)
  with check (false);

create policy chart_similarity_usage_events_block_user_access
  on chart_similarity_usage_events
  for all
  to authenticated
  using (false)
  with check (false);

-- Draft retention targets: counters 24 months, events 12 months, role audit 5 years.
-- Retention automation and hard deletion are not part of this draft. Active authorization records
-- must not be hard-deleted. Role-audit deletion or anonymization requires separate approval.
-- Duplicate idempotency keys must never double-charge usage; uncertain writes must fail closed.
-- Backup/snapshot and rollback decisions remain mandatory before any future execution approval.
-- Route success, beta/public execution, and live KIS must remain disabled.
