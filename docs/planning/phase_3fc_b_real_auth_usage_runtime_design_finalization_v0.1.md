# Phase 3FC-B — Real Auth/Usage Runtime Design Finalization

## 1. Status

Design finalized from owner-approved Phase 3FC-A decisions. No runtime source was changed. No
Supabase implementation exists. No usage storage implementation exists. No SQL/migration was
created. No live KIS call was made. No deploy, no push.

## 2. Approved Inputs

The owner explicitly approved the following inputs before this phase began. This document treats
them as fixed design constraints, not open options.

- **Auth strategy**: Supabase Auth.
- **Usage storage**: Postgres/Supabase-style table.
- **Role/limit table**:

  | Role | Daily limit | Monthly limit | Can execute similarity? |
  |---|---|---|---|
  | anonymous | 0 | 0 | No |
  | authenticated | 3 | 30 | Yes |
  | beta | 10 | 100 | Yes |
  | owner | 50 | 1,000 | Yes |
  | admin | 100 | 3,000 | Yes |

- **Approved persistence categories**: usage counters, usage events, role assignments, feature
  flag audit.
- **Rejected persistence categories**: raw KIS provider payload, trading/account data,
  credentials/env/token material in app tables.
- **Approved for design only** (not activation): `AUTH_RUNTIME_ENABLED`, `USAGE_STORAGE_ENABLED`,
  `CHART_AI_SIMILARITY_BETA_ENABLED`.
- **Not approved for activation**: `CHART_AI_SIMILARITY_PUBLIC_ENABLED`, `LIVE_KIS_OHLC_ENABLED`.

## 3. Current Runtime Boundary

- The default `/api/chart-ai/similarity` route response remains `feature-disabled`
  (`buildSimilarityApiRouteShellResult`), unchanged by this phase.
- The owner-local-mocked route branch (Phase 3FB-B) remains local/dev-only, reachable only via an
  explicit request body.
- The owner-local-auth-usage-bridge route branch (Phase 3FB-C-ALT) remains mock-only: `mockAuth`
  and `mockUsage` are caller-supplied values, not a real session or a real usage store.
- No real auth/session exists anywhere in this codebase.
- No usage persistence exists anywhere in this codebase.
- No public or beta execution path exists.
- Live KIS remains off and unreferenced by any of the modules touched in this design.

## 4. Target Runtime Architecture

```
Browser
  -> POST /api/chart-ai/similarity
    -> auth subject resolver         (Section 5; Supabase Auth session -> internal subject id)
    -> role resolver                 (Section 5; role_assignments -> anonymous/authenticated/beta/owner/admin)
    -> usage snapshot loader         (Section 6; usage_counters -> daily/monthly used/limit/remaining)
    -> evaluateSimilarityExecutionGuard   (unchanged, Phase 3EY-C)
    -> mocked/KIS-disabled execution path initially   (reuses Phase 3FB-A integration)
    -> usage increment transaction   (Section 8; only after allowed execution)
    -> sanitized response            (Section 10; unchanged response contract shape)
```

Real KIS execution remains off until a separate, later approval resolves live KIS network
reachability. The public route remains disabled until `CHART_AI_SIMILARITY_PUBLIC_ENABLED` is
separately approved and activated; this phase does not activate it.

## 5. Supabase Auth Mapping Design

- A Supabase user id maps one-to-one to an internal auth subject id used only within this
  feature's own tables (`role_assignments`, `usage_counters`, `usage_events`) — never echoed back
  to the client in a route response.
- An anonymous caller has no resolvable subject and cannot execute similarity (matches the
  approved `anonymous: 0/0, no execution` policy).
- The default role for any successfully authenticated Supabase session is `authenticated`.
- `beta`, `owner`, and `admin` roles are not inferred from the session itself; they come from an
  explicit `role_assignments` record (Section 6) that a real implementation phase would populate
  and audit.
- Session validation happens only on the server, inside the route handler or a resolver module it
  calls — never trusted from a client-supplied header, cookie value, or request body field.
- No access token, refresh token, or raw Supabase session payload is persisted in any app-owned
  table; if a future implementation needs Supabase's own secure session storage, it uses
  Supabase's own mechanism, not a new app table.
- The route response never includes a raw Supabase user id, session id, or token value.

This section is conceptual only. No Supabase SDK is imported, and no code implementing this
mapping is written in this phase.

## 6. Usage Storage Design

Conceptual tables only — no SQL, no migrations, no schema implementation.

### `usage_counters`
- **Purpose**: enforce daily/monthly execution limits per subject and role.
- **Conceptual key fields**: subject id (or an anonymous bucket key, though anonymous execution is
  not permitted per the approved policy), window (`daily`/`monthly`), used count, limit, window
  reset timestamp.
- **Allowed fields**: subject id, role at time of counting, window, used, limit, reset timestamp.
- **Prohibited fields**: raw request/response payload, OHLC values, similarity scores, KIS
  credentials.
- **Retention notes**: counters reset per window; historical counter values beyond the current
  window are not required to be retained by this table (see `usage_events` for history).
- **Privacy notes**: no IP address, no user-agent, no free-text field.

### `usage_events`
- **Purpose**: audit log of individual execution attempts and their guard outcome.
- **Conceptual key fields**: subject id, event timestamp, guard status
  (`allowed`/`blocked`/`auth_required`/`usage_limited`), route/feature identifier.
- **Allowed fields**: subject id, role, guard status, timestamp, bucketed symbol/asset type
  (sanitized, not a raw provider payload).
- **Prohibited fields**: raw KIS payload, access/refresh tokens, trading/account/order/balance
  data, unnecessary IP/user-agent.
- **Retention notes**: retained longer than `usage_counters` for audit purposes; retention window
  is an owner decision for a later phase.
- **Privacy notes**: no credential or env value ever recorded.

### `role_assignments`
- **Purpose**: source of truth for which role (`authenticated`/`beta`/`owner`/`admin`) a subject
  holds, beyond the default `authenticated` role granted by a valid session.
- **Conceptual key fields**: subject id, assigned role, assigned-at timestamp, assigned-by
  identifier.
- **Allowed fields**: subject id, role, timestamps, assigned-by.
- **Prohibited fields**: anything not needed to determine a subject's role.
- **Retention notes**: current assignment plus a history of changes for audit.
- **Privacy notes**: no session/token data.

### `feature_flag_audit`
- **Purpose**: record when a feature flag's value changed, for accountability.
- **Conceptual key fields**: flag name, new boolean value, changed-at timestamp, changed-by
  identifier.
- **Allowed fields**: flag name, value, timestamps, changed-by.
- **Prohibited fields**: secret/credential values (flags are booleans/names only).
- **Retention notes**: retained indefinitely as an audit trail; low volume.
- **Privacy notes**: none beyond the changed-by identifier, which should be an internal
  owner/admin identifier, not a raw session token.

## 7. Role and Limit Policy

| Role | Daily limit | Monthly limit | Can execute similarity? |
|---|---|---|---|
| anonymous | 0 | 0 | No |
| authenticated | 3 | 30 | Yes |
| beta | 10 | 100 | Yes |
| owner | 50 | 1,000 | Yes |
| admin | 100 | 3,000 | Yes |

- **Daily reset timezone recommendation**: Asia/Seoul, unless the owner later changes it.
- **Monthly reset**: based on the calendar month in Asia/Seoul.
- **Owner/admin high limits are still audited**: a high limit is not the same as an unaudited
  bypass; every allowed execution still produces a `usage_events` record.
- **No unlimited silent bypass** is permitted for beta or public routes; any bypass behavior would
  require its own explicit, separately approved design.

## 8. Usage Transaction Design

- Load the current usage counter snapshot for the resolved subject/role/window before evaluating
  the guard.
- Evaluate `evaluateSimilarityExecutionGuard` using the loaded snapshot exactly as it does today
  with caller-supplied mock data (Phase 3FB-C-ALT) — only the source of the snapshot changes from
  mock to real.
- Execute the underlying similarity integration only if the guard result is `allowed`.
- **Increment timing — two options considered**:
  - Increment immediately after the guard returns `allowed`, before execution runs.
  - Increment only after a successful, safe execution response has been built.
  - **Recommended**: increment after the safe execution response is built and ready to return,
    paired with an idempotency key (e.g. a request-scoped id) in a later implementation phase, so
    that a retried request does not double-count usage. This favors not charging a user's quota
    for an execution that failed to produce a safe response, at the cost of a small window where a
    slow client disconnect could avoid an increment — an acceptable tradeoff for an internal
    beta-stage feature.
- Record a `usage_events` entry for every allowed execution (successful or not) so usage can be
  reconstructed independently of the counter table.
- Blocked, `auth_required`, and `usage_limited` requests do not decrement or increment the quota;
  recording an audit event for these outcomes is optional and left to a later implementation phase
  to decide, not a requirement of this design.
- Concurrent requests from the same subject require an atomic update (e.g. a single conditional
  `UPDATE ... WHERE used < limit RETURNING ...` or an equivalent transaction) so that two
  simultaneous requests cannot both pass a stale read of the same counter. This is a requirement
  for the future implementation phase, not something this design phase implements.

No code or SQL is written in this section.

## 9. Feature Flag Design

| Flag name | Purpose | Default | Approved for this phase |
|---|---|---|---|
| `AUTH_RUNTIME_ENABLED` | Gates whether the real Supabase auth subject resolver replaces mock auth | `false` | Design only |
| `USAGE_STORAGE_ENABLED` | Gates whether the real usage store replaces mock usage | `false` | Design only |
| `CHART_AI_SIMILARITY_BETA_ENABLED` | Gates beta-tier real execution | `false` | Design only |
| `CHART_AI_SIMILARITY_PUBLIC_ENABLED` | Gates public real execution | `false` | Not approved for activation |
| `LIVE_KIS_OHLC_ENABLED` | Separate, pre-existing concern for live KIS connectivity | `false` | Not approved for activation |

Rules:
- All flags default to `false`.
- `CHART_AI_SIMILARITY_BETA_ENABLED` cannot be enabled unless `AUTH_RUNTIME_ENABLED` and
  `USAGE_STORAGE_ENABLED` are both enabled.
- `CHART_AI_SIMILARITY_PUBLIC_ENABLED` cannot be enabled unless beta has passed QA, legal, and
  abuse-prevention checks (Phase 3FC-B Beta Release Gate Checklist).
- `LIVE_KIS_OHLC_ENABLED` remains a separate concern; it is never implied or activated by beta or
  public flag state.
- Owner approval is required before any flag listed above is actually activated in an environment.
  This phase does not add environment variables anywhere.

## 10. Safe Response Contract

The route's response contract (`SimilarityApiResponse`) is not changed by this phase and must
continue to exclude:
- a raw Supabase user id or session id.
- an auth token, access token, or refresh token of any kind.
- a raw usage store key or internal counter identifier.
- a raw KIS provider payload.
- OHLC/price/volume/timestamp values from live data, unless a separate future phase explicitly
  approves and sanitizes such a disclosure.
- account/trading/order/balance data.

The response continues to expose only the existing sanitized `status`/`mode`/`request`/`usage`/
`data`/`error`/`warnings` shape already defined in `similarityApiResponseTypes.ts`.

## 11. Future Module Plan

The following files are proposed for a later implementation phase. **None are created in this
phase.**

- `src/lib/server/chartSimilarity/similarityAuthSubjectResolver.ts` — resolves a Supabase session
  into an internal auth subject id and auth state; server-only; must never accept a client-supplied
  subject id or role.
- `src/lib/server/chartSimilarity/similarityAuthSubjectResolverTypes.ts` — type definitions for the
  resolver's input/output shapes.
- `src/lib/server/chartSimilarity/similarityUsageStore.ts` — loads and increments usage counters
  and records usage events against the real usage storage backend; server-only; must never be
  reachable from client code.
- `src/lib/server/chartSimilarity/similarityUsageStoreTypes.ts` — type definitions for usage
  snapshot/increment operations.
- `src/lib/server/chartSimilarity/similarityRoleAssignment.ts` — reads a subject's role from
  `role_assignments`; server-only; falls back to `authenticated` for any valid session with no
  explicit assignment.
- `src/lib/server/chartSimilarity/similarityFeatureFlagPolicy.ts` — reads the feature flag values
  proposed in Section 9 (name/default only in this design; actual read implementation is a later
  phase's concern) and enforces the activation dependency rules.
- An updated `src/pages/api/chart-ai/similarity.ts` — adds a third, flag-gated branch that uses the
  real resolver/store/role/flag modules above instead of caller-supplied mock values, while leaving
  the existing default and owner-local-mocked/bridge branches unchanged.
- New smoke/check scripts mirroring the existing 3FB-series pattern (static contract checker plus a
  smoke script exercising the new modules against fixtures, not a real Supabase project).

For each proposed module: its purpose, dependencies, and safety boundary are described above; test
expectations are detailed in
[phase_3fc_b_runtime_module_plan_v0.1.md](phase_3fc_b_runtime_module_plan_v0.1.md).

## 12. Implementation Sequence

1. **Phase 3FC-C**: disabled-by-default auth subject resolver scaffold (types/interfaces/policy
   only, no real Supabase call).
2. **Phase 3FC-D**: disabled-by-default usage store interface and fixtures (types/interfaces only,
   no real DB connection).
3. **Phase 3FC-E**: route integration behind all feature flags, mocked execution only (flags remain
   `false` by default; no real Supabase/DB connection).
4. **Phase 3FC-F**: beta QA gate and manual review.
5. **Phase 3FD-A**: live KIS reachability retry, only after the external network condition is
   separately resolved.

None of these phases are implemented in Phase 3FC-B.

## 13. Risks and Mitigations

| Risk | Mitigation | Status |
|---|---|---|
| Session spoofing | All session validation happens server-side only; no client-supplied auth state is ever trusted | Planned for 3FC-C |
| Role escalation | Role comes only from `role_assignments`, never from a client-supplied field | Planned for 3FC-C/3FC-D |
| Quota race conditions | Atomic increment/transaction required for concurrent requests (Section 8) | Planned for 3FC-D/3FC-E |
| Quota bypass through retries | Idempotency key recommended for the increment step (Section 8) | Planned for 3FC-E |
| Raw data leakage | Safe response contract (Section 10) unchanged and re-verified before any flag activation | Ongoing, enforced by existing/future checkers |
| Stale feature flag activation | All flags default false; activation dependency rules defined (Section 9); owner approval required per flag | Planned for 3FC-E/3FC-F |
| Legal/investment advice exposure | Legal/disclaimer review required before beta and again before public (Beta Release Gate Checklist) | Planned for 3FC-F |
| Live KIS network instability | Kept entirely separate; tracked as Phase 3FD-A, independent of auth/usage work | Ongoing, external |

## 14. Go/No-Go Criteria

**GO for the next design-to-implementation phase:**
- Owner confirms this design.
- Owner approves a disabled-by-default implementation scaffold (Phase 3FC-C).
- Owner confirms a Supabase project/setup will be available for a later phase.
- Owner confirms no live KIS is needed for the next phase.

**NO-GO:**
- A request to enable the public route immediately.
- A request to skip auth/storage implementation.
- A request to store a prohibited field (Section 2's rejected persistence categories).
- A request to connect live KIS before the network issue is separately resolved.

## 15. Recommended Next Phase

Phase 3FC-C — Supabase Auth Subject Resolver Scaffold, Disabled by Default, No Live KIS.

Alternative: Phase 3FB-G — Owner Manual QA Findings Incorporation, Live KIS Off.
