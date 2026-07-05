# Phase 3FC-B Supabase Auth and Usage Storage Design

## 1. Purpose

This document is conceptual design only. It describes how Supabase Auth and a Postgres/Supabase
usage store would be structured for the Chart Similarity feature. No Supabase package is imported,
no schema is created, no SQL is written, and no real Supabase project is connected in this phase.

## 2. Supabase Auth Boundary

- Session validation happens only on the server (inside the API route or a resolver module it
  calls) — never trusted from a client-supplied header, cookie value, or request body field.
- No access token, refresh token, or raw session payload is echoed back to the client in any route
  response.
- No app-owned table stores a Supabase access/refresh token; if a future phase needs persistent
  session state beyond what Supabase's own client library manages, that is a separate, explicitly
  approved design.
- No client-side privilege is trusted: a client cannot declare its own role, usage snapshot, or
  auth state and have it honored by the server — every one of those values must be resolved
  server-side from the session and the app's own tables.
- No route reaches a `success` status without the server having evaluated real Supabase auth state
  first (once `AUTH_RUNTIME_ENABLED` is active); until then, the route continues to use only the
  existing mock/disabled paths.

## 3. Role Assignment Model

- `authenticated` is the default role for any subject with a valid Supabase session and no explicit
  entry in `role_assignments`.
- `beta`, `owner`, and `admin` roles come only from an explicit `role_assignments` record; a valid
  session alone never grants these roles.
- Every role change is audited (recorded with a timestamp and an assigning identifier) in
  `role_assignments`'s change history.
- No client-supplied role value is accepted anywhere in the real runtime; the request body's
  historical `mockAuth.role` field (Phase 3FB-C-ALT) is a bridge-only concept and has no equivalent
  in the real auth path.

## 4. Usage Counter Model

- Two counter windows: `daily` and `monthly`, tracked per subject and role.
- **Asia/Seoul** is the reset-timezone candidate for both the daily boundary and the monthly
  calendar boundary, pending owner confirmation.
- Increment operations must be atomic (a single conditional update or transaction) so concurrent
  requests from the same subject cannot both read a stale counter value and both succeed past the
  limit.
- An idempotency key is a future requirement for the increment step, so that a client retry of the
  same logical request does not double-count usage.
- In-memory or local-file counters are not acceptable for beta or public enforcement — this mirrors
  the constraint already established in the Phase 3FC-A approval package.

## 5. Usage Event Model

- **Allowed execution event**: recorded for every guard-`allowed` execution attempt, whether or not
  the underlying integration ultimately returned a successful result.
- **Blocked event (optional)**: recording an event for `blocked`/`auth_required`/`usage_limited`
  outcomes is left as an implementation-phase decision, not a requirement of this design.
- **Fields safe to store**: subject id, role, guard status, event timestamp, bucketed symbol/asset
  type (sanitized, not a raw provider payload), route/feature identifier.
- **Fields prohibited**: raw KIS payload, access/refresh tokens, trading/account/order/balance
  data, unnecessary IP address or user-agent, raw OHLC/volume/timestamp values, raw similarity
  scores or forward returns.

## 6. Feature Flag Model

Flags carried over from the main design document
([phase_3fc_b_real_auth_usage_runtime_design_finalization_v0.1.md](phase_3fc_b_real_auth_usage_runtime_design_finalization_v0.1.md#9-feature-flag-design)):
`AUTH_RUNTIME_ENABLED`, `USAGE_STORAGE_ENABLED`, `CHART_AI_SIMILARITY_BETA_ENABLED`,
`CHART_AI_SIMILARITY_PUBLIC_ENABLED`, `LIVE_KIS_OHLC_ENABLED`.

- **Activation dependencies**: beta cannot be enabled without both auth runtime and usage storage
  enabled; public cannot be enabled without beta having passed its QA/legal/abuse gate; live KIS
  remains independent of all of the above.
- **Audit requirement**: every flag value change is recorded in `feature_flag_audit` with a
  changed-by identifier and timestamp.

## 7. Conceptual Schema

No SQL. Table shapes below are conceptual only.

| Table | Key | Allowed columns | Prohibited columns | Notes |
|---|---|---|---|---|
| `auth_subjects` (mapping to Supabase's own user record) | subject id | subject id, created-at | password, raw OAuth token, KIS credentials | May not need its own table if Supabase's user id is used directly as the subject id in the app's own tables |
| `role_assignments` | subject id + role | subject id, role, assigned-at, assigned-by | session/token data | Source of truth for beta/owner/admin |
| `usage_counters` | subject id + window | subject id, role, window, used, limit, reset-at | raw request/response payload, OHLC values, similarity scores | Enforces daily/monthly limits |
| `usage_events` | subject id + event timestamp | subject id, role, guard status, timestamp, bucketed symbol/asset type | raw KIS payload, tokens, account/trading data, unnecessary IP/user-agent | Audit trail independent of counters |
| `feature_flag_audit` | flag name + changed-at | flag name, value, changed-at, changed-by | secret/credential values | Accountability for flag changes |

## 8. RLS / Permission Considerations

Conceptual only — no policies or SQL are written in this phase.

- The API route uses privileged, server-side access to these tables (e.g. a service-role-style
  connection), not a client-exposed anon key with broad table access.
- The client must never be able to directly update `usage_counters` or `usage_events` — all writes
  happen through the server route/module, never a direct client-to-database call.
- The client must never be able to assign or change its own role in `role_assignments`.
- Public read/write access to any of these tables should be blocked by default unless a future
  phase explicitly designs and approves a narrower, specific exception.
- `feature_flag_audit` and `role_assignments` are restricted to server-side/administrative access
  only; no client read path is designed for them in this phase.

## 9. Implementation Preconditions

- The owner provides or approves a Supabase project before any real connection is attempted.
- Environment variable names for the Supabase connection are approved in a separate, later phase —
  none are added here.
- Package installation (e.g. a Supabase client SDK) is approved separately, not assumed by this
  design phase.
- The schema/migration phase (actual `CREATE TABLE` statements) is a separate, later, explicitly
  approved phase.
- No live KIS connectivity is required or attempted in this design phase.
