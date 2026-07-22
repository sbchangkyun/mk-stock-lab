# Phase 3FD-E-PLAN Guarded Route Runtime Composition Approval Package

## 1. Purpose

This is approval planning only for a future guarded-route runtime composition phase. It makes no
route source change, UI change, or runtime implementation change; creates no database connection
or Supabase client; reads no environment value; executes no migration; and enables no route
success.

## 2. Current State

- The real-compatible auth subject resolver exists but is disabled by default.
- The role/usage runtime adapter exists but is disabled by default and mocked-DB-only.
- The feature flag resolver exists but remains disabled by default.
- The guarded route scaffold exists and still fails closed.
- The API route retains its three existing branches and does not compose these runtime parts.
- Route success, beta activation, public activation, and live KIS remain blocked.

## 3. Future Composition Sequence

The future guarded branch would evaluate components in this exact order:

1. Validate the request shape and explicit route mode.
2. Resolve the auth subject.
3. Resolve role and usage through the runtime adapter.
4. Evaluate feature flags and dependency gates.
5. Evaluate provider execution eligibility.
6. Run mocked/provider-compatible execution only when every preceding gate allows it.
7. Shape a safe, bucketed API response.
8. Apply the final fail-closed fallback for every unhandled or unsafe state.

This phase does not implement this sequence. Route behavior remains unchanged.

## 4. Runtime Components to Compose

- Supabase Auth subject resolver boundary: produces a safe anonymous/authenticated subject seed.
- Role/usage runtime adapter boundary: resolves server-owned roles and safe usage buckets.
- Feature flag resolver boundary: evaluates auth, usage, beta/public, and provider dependencies.
- Guarded route scaffold boundary: owns the all-gates-off composition shell.
- Mocked provider-compatible similarity execution boundary: remains non-live and separately gated.
- Safe API response builder boundary: emits only allowlisted, bucketed response fields.

No component independently grants route success.

## 5. Fail-closed Matrix

| Condition | Expected safe status | Route success allowed | Beta/public allowed | Raw data exposure |
| --- | --- | --- | --- | --- |
| Malformed request | `invalid_request` | No | No | No |
| Auth disabled | `auth_disabled` | No | No | No |
| Auth missing, invalid, or expired | `auth_unavailable` | No | No | No |
| Role adapter disabled | `role_usage_disabled` | No | No | No |
| Role ambiguous | `role_ambiguous` | No | No | No |
| Role invalid | `role_invalid` | No | No | No |
| Usage missing | `usage_unavailable` | No | No | No |
| Usage limited | `usage_limited` | No | No | No |
| Idempotent replay | `idempotent_replay` | No | No | No |
| Feature flag disabled | `feature_disabled` | No | No | No |
| Route success disabled | `route_disabled` | No | No | No |
| Provider execution unavailable | `provider_unavailable` | No | No | No |
| Redaction failure | `redaction_failed` | No | No | No |
| Unexpected error | `safe_error` | No | No | No |

An idempotent replay may reuse a prior safe adapter outcome, but it does not authorize route
execution in this approval phase. Every matrix outcome remains blocked until later implementation
and activation approvals explicitly permit otherwise.

## 6. Safe Response Shape

Future guarded-route output may expose only:

- `guardStatus`
- `authState` bucket
- `resolvedRole`
- `usageWindow`
- `usageRemainingDailyBucket`
- `usageRemainingMonthlyBucket`
- `engineStatus` bucket
- `normalizedBarsAvailable` boolean
- `normalizedBarCountBucket`
- `matchCountBucket`
- `dataPolicy`
- `disclaimer`
- `safeMessage`

It must not expose:

- Raw Supabase user identifier, email address, token, session, or JWT.
- Cookie or authorization-header value.
- Environment value or service-role key.
- Raw database records or raw usage counts.
- Raw KIS payload or OHLC price, volume, or timestamp data.
- Raw similarity scores or returns.
- Account, trading, order, or balance data.

## 7. Approval Gates Before Implementation

- [ ] Owner approves route composition implementation.
- [ ] Owner approves the exact guarded route request mode.
- [ ] Owner approves auth subject resolver wiring.
- [ ] Owner approves mocked role/usage adapter wiring.
- [ ] Owner approves feature flag gate wiring.
- [ ] Owner approves the safe response shape.
- [ ] Owner confirms route success remains disabled by default.
- [ ] Owner confirms no real DB, Supabase, environment, or live KIS access in the next phase.

## 8. Explicit Non-Approvals

This phase does not approve route source changes, route success, real database runtime, Supabase
client creation, environment reads, cookie/header/session parsing, JWT verification, migration
execution, service-role use, beta/public activation, live KIS, deployment, or push.

## 9. Recommended Next Phase

Recommended: **Phase 3FD-E — Guarded Route Runtime Composition Scaffold, All Gates Off, Mocked
Runtime Only**.

Alternative: **Phase 3FD-B-HF1 — Real Supabase Client Factory Approval Package, No Runtime
Change**.

Hold: **Phase 3FD-D-HF1 — Runtime Adapter Mocked DB Revisions**.
