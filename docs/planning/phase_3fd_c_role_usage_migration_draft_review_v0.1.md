# Phase 3FD-C Role Usage Migration Draft Review

## 1. Purpose

This document reviews the Phase 3FD-C migration draft. The draft is not executed, no database
connection is made, no Supabase client is created, and no route, UI, or runtime source is changed.

## 2. Owner Decisions Applied

### Role assignment

- Table: `chart_similarity_role_assignments`.
- Roles: `authenticated`, `beta`, `owner`, `admin`; `anonymous` is not stored.
- Statuses: `active`, `scheduled`, `expired`, `revoked`.
- `authenticated` is derived from auth by default and is not initially persisted.
- `beta`, `owner`, and `admin` require explicit server-owned assignments.
- Active uniqueness permits at most one active assignment per `subject_ref` and role.
- Users cannot grant, edit, revoke, or escalate their own roles.
- Grant, revoke, scheduled, and expiry actions require a safe administrator reference, reason,
  and timestamp.

### Usage store

- Counter table: `chart_similarity_usage_counters`.
- Event table: `chart_similarity_usage_events`.
- Initial scope: `chart_similarity_scan`.
- Periods: daily and monthly, using `Asia/Seoul` boundaries.
- Every increment requires a unique `idempotency_key`.
- `metadata_safe` is bounded, redacted, and allowlisted.
- The approved update model pairs the counter increment and event insertion transactionally.

### RLS, retention, and rollback

- Role assignment writes are server/admin-only; counter/event writes are server-only.
- User-facing reads are not approved by default.
- Service-role runtime use is not approved; only its future server-only boundary is documented.
- Draft retention targets are 24 months for counters, 12 months for events, and 5 years for role
  assignment audit.
- Active authorization records are not hard-deleted. Expired usage data may be deleted or
  anonymized after retention. Role-audit deletion or anonymization needs separate approval.
- Duplicate idempotency keys never double-charge usage; uncertain writes fail closed.
- A backup/snapshot decision and audit-preserving rollback are required before execution.

## 3. Draft Tables

- `chart_similarity_role_assignments` stores explicit privileged role assignments and their full
  grant/revoke lifecycle audit.
- `chart_similarity_usage_counters` stores bounded daily/monthly usage for the approved scan scope.
- `chart_similarity_usage_events` stores retry-safe, redacted increment decisions.

## 4. Draft Constraints and Indexes

The draft constrains role and lifecycle values, requires non-empty safe references, validates
assignment validity windows and revocation audit fields, prevents negative counters, requires
positive bounded increments, bounds `metadata_safe`, and makes idempotency keys unique. Proposed
indexes cover subject lookup, role/status and active assignment lookup, counter subject/period
lookup, event idempotency, and retention/time review.

## 5. Draft RLS Model

The draft enables RLS conceptually and includes deny-by-default user policies. Role writes remain
server/admin-only and usage writes remain server-only. User-facing reads are not approved by
default. Service-role usage requires separate approval. No RLS statement was executed.

## 6. Redaction Review

The draft contains no raw Supabase user identifier, email address, token, session, JWT, cookie,
authorization-header value, environment value, service-role key, KIS or OHLC data, or account,
trading, order, or balance data. Only safe internal references, bounded categories, counts,
timestamps, and allowlisted redacted metadata are proposed.

## 7. Execution Gate

Migration execution is not approved. Future execution requires explicit owner approval of the
target environment, backup or snapshot decision, rollback procedure, and any service-role
handling. Route success must remain disabled before, during, and after any future migration.

## 8. Open Items Before Execution

- [ ] Owner reviews the draft SQL.
- [ ] Owner approves the target environment.
- [ ] Owner approves the backup/snapshot decision.
- [ ] Owner approves the rollback procedure.
- [ ] Owner approves service-role handling, if needed.
- [ ] Owner approves migration execution.
- [ ] Owner confirms route success remains disabled.
