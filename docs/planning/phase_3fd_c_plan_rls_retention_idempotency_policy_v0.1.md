# Phase 3FD-C-PLAN RLS Retention and Idempotency Policy

## 1. Purpose

This policy is planning only. It defines no executable RLS, SQL, migration, database connection,
or runtime code.

## 2. RLS Strategy

- Role assignment writes must be server/admin-only.
- Usage counter writes must be server-only.
- Usage event writes must be server-only.
- Any user-facing read must be separately approved, safe, minimal, and limited to the caller's
  non-privileged summary.
- Service-role use requires separate owner approval and a server-only handling review.
- Client role, usage, subject, and flag claims remain untrusted.

No RLS policy is implemented in this phase.

## 3. Retention Strategy

- Retain usage counters for an owner-approved operational and reconciliation period.
- Retain usage events for an owner-approved audit and debugging period.
- Retain role-assignment grant/revoke audit records longer than ordinary usage events.
- Exact retention periods require owner approval before migration drafting.
- Deletion, legal hold, anonymization, and subject-erasure behavior require explicit approval.
- Retention jobs must not silently alter active authorization or usage decisions.

## 4. Idempotency Strategy

Every usage increment requires an idempotency key. A duplicate key must return the previously
determined safe outcome and must not double-charge usage. An uncertain write result must fail
closed. Retries must be safe across timeouts and process restarts. An idempotency key must be
opaque and must not contain raw token, session, user, KIS, request-body, or market-data content.

## 5. Redaction Strategy

Future role and usage tables must not store any of the following fields or values:

- Access token or refresh token.
- JWT, raw session, or raw user object.
- Email address or phone number.
- Cookie or authorization-header value.
- Environment value or service-role key.
- Raw KIS payload.
- OHLC price, volume, or timestamp data.
- Raw similarity score or return unless separately approved for a different bounded purpose.
- Account, trading, order, or balance data.

Safe references, bounded categorical statuses, approved timestamps, counts, and allowlisted
redacted metadata are the only proposed persistence inputs.

## 6. Rollback and Backup Strategy

A reviewed migration rollback plan is required before execution approval. The owner must decide
whether a backup or snapshot is required and confirm its scope before execution. Rollback must
preserve audit integrity and must not silently grant roles or reset usage. A failed, partial, or
rolled-back migration must not enable route success, beta activation, public activation, or live
KIS access.

## 7. Open Owner Decisions

- [ ] Approve the RLS strategy.
- [ ] Approve the service-role boundary.
- [ ] Approve retention periods.
- [ ] Approve the anonymization/deletion model.
- [ ] Approve the idempotency strategy.
- [ ] Approve rollback and backup requirements.
- [ ] Approve a future migration execution phase.
