# Phase 3FD-C-PLAN Role Assignment Schema Approval

## 1. Purpose

This document is an approval-planning artifact for a future role-assignment persistence phase.
It defines a conceptual schema only. This phase creates no SQL file, migration file, database
connection, runtime code, route change, or UI change.

## 2. Current Role Boundary

Phase 3FC-D provides a disabled-by-default role assignment resolver scaffold. Phase 3FD-B provides
a disabled, real-compatible auth subject resolver that produces only `anonymous` or
`authenticated` seeds. `beta`, `owner`, and `admin` must come from explicit server-owned role
assignments; client role claims are never trusted. The guarded route still falls back to the
feature-disabled shell, so route success remains blocked.

## 3. Proposed Role Assignment Table

The proposed conceptual table name is `chart_similarity_role_assignments`.

| Column | Proposed purpose |
| --- | --- |
| `id` | Internal immutable record identifier. |
| `subject_ref` | Safe internal subject lookup reference. |
| `role` | Approved assigned role. |
| `status` | Assignment lifecycle state. |
| `granted_by_ref` | Safe internal reference for the granting administrator. |
| `grant_reason` | Bounded administrative reason. |
| `valid_from` | Start of assignment validity. |
| `valid_until` | Optional end of assignment validity. |
| `created_at` | Record creation time. |
| `updated_at` | Last administrative update time. |
| `revoked_at` | Optional revocation time. |
| `revoked_by_ref` | Optional safe internal reference for the revoking administrator. |
| `revocation_reason` | Optional bounded revocation reason. |

Allowed conceptual role values are `authenticated`, `beta`, `owner`, and `admin`. `anonymous` is
not stored as an assignment. `authenticated` may remain derived from auth unless explicit
persistence is approved later. `beta`, `owner`, and `admin` always require an explicit
server-owned assignment.

## 4. Proposed Constraints

- Constrain `role` to the approved role set.
- Constrain `status` to an owner-approved lifecycle set such as `active`, `scheduled`, `expired`,
  or `revoked`.
- Require a non-empty `subject_ref`; never accept a client-supplied subject or role as authority.
- If approved, permit at most one active assignment per subject and role.
- Treat a missing `valid_until` as owner-approved indefinite validity; otherwise require it to be
  later than `valid_from`.
- Exclude revoked, expired, future, malformed, or multiply-matching assignments from escalation.
- Require revocation audit fields when status becomes `revoked`.

## 5. Proposed Indexes

- A `subject_ref` lookup index for resolver reads.
- A role index for authorized administrative review.
- A status index for lifecycle maintenance.
- A composite active-assignment lookup over subject, status, role, and validity times.
- Time-oriented indexes for grant, update, expiry, and revocation audit review.

Exact index shapes and partial-index predicates require owner approval and migration review.

## 6. RLS Policy Proposal

This is conceptual only. Users must not be able to grant, edit, or revoke their own roles.
User-facing reads, if approved at all, must not expose privileged assignment details. The future
server-side resolver may require narrowly scoped server-only access. Any service-role use requires
separate approval, justification, and secret-handling review. No RLS policy is implemented in this
phase.

## 7. Audit and Admin Requirements

Every grant, scheduled change, expiry override, and revocation must be auditable. Administrative
actions must record a safe administrator subject reference, reason, and timestamp. Client
responses must not contain a raw Supabase user identifier, email, token, session, privileged audit
detail, or administrative reason. Audit mutation and retention rules require explicit approval.

## 8. Open Owner Decisions

- [ ] Approve the table name.
- [ ] Approve the role values.
- [ ] Approve the status values.
- [ ] Approve whether the authenticated role is persisted or derived.
- [ ] Approve the active-assignment uniqueness rule.
- [ ] Approve the RLS strategy.
- [ ] Approve the audit requirements.
- [ ] Approve migration creation in a later phase.
