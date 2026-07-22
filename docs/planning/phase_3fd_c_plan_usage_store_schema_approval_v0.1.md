# Phase 3FD-C-PLAN Usage Store Schema Approval

## 1. Purpose

This document is approval planning only for future Chart Similarity usage persistence. It creates
no SQL or migration file, database runtime, database connection, or route integration.

## 2. Current Usage Boundary

Phase 3FC-E provides a disabled-by-default usage store interface scaffold backed only by
deterministic mocked counters and events. No real persistence exists. Current limits are a
design-policy baseline, not database state. The guarded route remains feature-disabled, and route
success remains blocked.

## 3. Usage Limit Policy Baseline

| Role | Daily limit | Monthly limit |
| --- | ---: | ---: |
| `anonymous` | 0 | 0 |
| `authenticated` | 3 | 30 |
| `beta` | 10 | 100 |
| `owner` | 50 | 1000 |
| `admin` | 100 | 3000 |

Any future change to these limits requires separate policy approval and regression coverage.

## 4. Proposed Usage Counter Table

The proposed conceptual table name is `chart_similarity_usage_counters`.

| Column | Proposed purpose |
| --- | --- |
| `id` | Internal immutable counter identifier. |
| `subject_ref` | Safe internal subject lookup reference. |
| `role` | Server-resolved role used for the limit decision. |
| `usage_scope` | Approved capability or operation scope. |
| `period_type` | Daily or monthly window. |
| `period_start` | Inclusive window start. |
| `period_end` | Exclusive window end. |
| `used_count` | Committed usage in the window. |
| `limit_count` | Applied limit captured for auditability. |
| `last_incremented_at` | Last successful increment time. |
| `created_at` | Counter creation time. |
| `updated_at` | Counter update time. |

`subject_ref` is a safe internal reference. The table must not contain a raw Supabase user
identifier, email, token, or session field.

## 5. Proposed Usage Event Table

The proposed conceptual table name is `chart_similarity_usage_events`.

| Column | Proposed purpose |
| --- | --- |
| `id` | Internal immutable event identifier. |
| `idempotency_key` | Retry-safe unique operation key. |
| `subject_ref` | Safe internal subject lookup reference. |
| `role` | Server-resolved role at decision time. |
| `usage_scope` | Approved capability or operation scope. |
| `event_type` | Approved usage event category. |
| `event_status` | Committed, rejected, or owner-approved lifecycle state. |
| `period_start` | Associated counter-window start. |
| `period_end` | Associated counter-window end. |
| `increment_amount` | Positive bounded increment. |
| `created_at` | Event creation time. |
| `metadata_safe` | Optional bounded, redacted metadata. |

`metadata_safe` must be schema-bounded, redacted, size-limited, and allowlisted. It must not contain
raw request, session, token, KIS, or OHLC values.

## 6. Proposed Constraints and Indexes

- Enforce a unique `idempotency_key` for retry safety.
- Enforce a unique counter identity over `subject_ref`, `usage_scope`, `period_type`, and
  `period_start` if approved.
- Index subject and period lookups used by the guard.
- Index `event_status`, `period_start`, and `period_end` for operational review and retention.
- Require `used_count` and `limit_count` to be non-negative.
- Require `increment_amount` to be positive and bounded by an owner-approved maximum.
- Require valid, non-overlapping period boundaries under the approved timezone policy.

## 7. Counter Update Model

The preferred conceptual model is a transactional counter increment paired with event insertion.
An event-first model followed by a counter update is an alternative only if recovery semantics are
fully specified. Every retry must be protected by the idempotency key. An uncertain write result
must fail closed: do not grant execution and do not retry without checking the idempotency result.
No update model is implemented in this phase.

## 8. Open Owner Decisions

- [ ] Approve the counter table name.
- [ ] Approve the event table name.
- [ ] Approve usage scopes.
- [ ] Approve the daily/monthly period model and timezone.
- [ ] Approve the idempotency-key strategy.
- [ ] Approve the `metadata_safe` boundary.
- [ ] Approve the counter update model.
- [ ] Approve migration creation in a later phase.
