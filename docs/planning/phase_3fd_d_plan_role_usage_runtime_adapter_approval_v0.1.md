# Phase 3FD-D-PLAN Role/Usage Store Runtime Adapter Approval Package

## 1. Purpose

This is approval planning only for future role-assignment and usage-store runtime adapters. It
implements no runtime adapter, creates no database connection or Supabase client, reads no
environment value, changes no route or UI, and enables no route success.

## 2. Current State

Phase 3FD-B provides a disabled-by-default, real-compatible auth subject resolver. Phase 3FD-C
provides a review-only migration draft that was not executed. Role and usage persistence remain
unimplemented. The guarded route remains feature-disabled and has no real role/usage backing.

## 3. Future Runtime Adapter Scope

A future role assignment adapter would read `chart_similarity_role_assignments`. A future usage
store adapter would read and write `chart_similarity_usage_counters`, while a future usage event
writer would record `chart_similarity_usage_events`. Client-supplied roles are never trusted, and
all writes are server-owned. These adapters alone would not grant route success; route integration
and activation require later, explicit approval.

## 4. Role Assignment Adapter Plan

- Input: a safe internal `subject_ref`, never a client-claimed subject.
- Output: a resolved role among `authenticated`, `beta`, `owner`, and `admin`.
- `anonymous` remains derived from auth state and is not stored.
- `authenticated` remains the default derived role unless later persistence is approved.
- `beta`, `owner`, and `admin` require an active, matching, server-owned assignment.
- Expired, revoked, scheduled, malformed, or otherwise ambiguous assignments fail closed.
- Multiple active matches fail closed and do not escalate authorization.
- Results expose no raw Supabase user identifier, email, token, or session.

## 5. Usage Store Adapter Plan

- Input: a safe `subject_ref`, resolved role, approved `usage_scope`, and daily/monthly period.
- Read daily and monthly counters using `Asia/Seoul` period boundaries.
- Compare usage against the approved role limits before any execution decision.
- In a future implementation, insert the usage event and increment its counter transactionally.
- Every increment requires a unique `idempotency_key`.
- A duplicate idempotency key returns the prior safe outcome and never double-charges usage.
- An uncertain read or write result fails closed and grants no execution.
- `metadata_safe` remains bounded, redacted, and allowlisted.

## 6. Supabase Client and Service-role Boundary

No Supabase client is created in this phase. A future client factory requires separate owner
approval. Service-role runtime use is not approved. An ordinary user client must never write role
or usage state. Environment key names and values are not read here. Any future service-role use
requires redaction tests, server-only isolation, least-privilege justification, and explicit owner
approval.

## 7. Transaction, Idempotency, and Fail-closed Policy

- Role lookup errors, missing records, ambiguous matches, and malformed results fail closed.
- Usage counter absence or ambiguity fails closed unless a separately approved zero-counter
  creation transaction succeeds.
- A duplicate idempotency key returns its prior safe outcome.
- Transaction failure or an uncertain commit does not grant execution.
- Retry behavior must reconcile the idempotency event before attempting another increment.
- Route success remains disabled until auth, adapter, role, usage, feature-flag, and owner gates all
  independently approve the request path in a later phase.

## 8. Redaction and Forbidden Data

Future adapter inputs, outputs, persistence records, logs, and errors must not expose:

- Raw Supabase user identifier, email address, or phone number.
- Access token, refresh token, JWT, raw session, or raw user object.
- Cookie value, authorization-header value, environment value, or service-role key.
- Raw KIS or OHLC payload.
- Account, trading, order, or balance data.
- Raw similarity score or return unless separately approved for a bounded purpose.

Only safe internal references, bounded categorical statuses, counts, timestamps, and allowlisted
redacted metadata may cross the future adapter boundary.

## 9. Approval Gates Before Implementation

- [ ] Owner approves role adapter implementation.
- [ ] Owner approves usage adapter implementation.
- [ ] Owner approves the Supabase client factory boundary.
- [ ] Owner approves service-role handling, if needed.
- [ ] Owner approves transaction and idempotency behavior.
- [ ] Owner approves redaction test requirements.
- [ ] Owner confirms the migration is still not executed.
- [ ] Owner confirms route success remains disabled.

## 10. Recommended Next Phase

Recommended: **Phase 3FD-D — Role/Usage Store Runtime Adapter Interface Implementation, Disabled
by Default, Mocked DB Only**.

Alternative: **Phase 3FD-B-HF1 — Real Supabase Client Factory Approval Package, No Runtime
Change**.

Hold: **Phase 3FD-C-HF1 — Migration Draft Review Revisions, Not Executed**.
