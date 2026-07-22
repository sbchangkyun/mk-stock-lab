# Phase 3FD-F Owner-local Guarded Composition Manual QA Package

## 1. Purpose

This is a documentation-only manual QA package. Manual QA is not executed in this phase. It makes
no route source change, UI change, or runtime source change; connects to no database; creates no
Supabase client; reads no environment value; executes no migration; calls no live KIS path;
enables no route success; and performs no deployment or push.

## 2. Preconditions for Future Owner-local QA

- The repository is on the expected `rebuild/phase-1-ia-shell` branch.
- The tracked tree is clean.
- The latest targeted checkers and smokes pass.
- The owner intentionally starts a local development server in a future manual QA session.
- The owner confirms no push or deployment will occur during QA.
- The owner confirms live KIS remains disabled.
- The owner confirms no real database, Supabase, or environment access is approved.

This phase does not start the development server, run browser automation, or execute manual QA.

## 3. QA Surface

- API default safe disabled path.
- Malformed JSON fallback path.
- Guarded runtime scaffold path.
- Owner-local mocked path.
- Owner-local auth/usage bridge path.
- `/chart-ai` default page.
- `/chart-ai?ownerLocalMocked=1`.
- `/chart-ai?ownerLocalAuthUsageBridge=1`.

## 4. Owner-local API Request Examples

These examples are documentation only. They contain no real credential, user, market, or
environment value.

### 4.1 Default request body

```json
{}
```

Expected:

- Safe disabled shell.
- No route success.
- No raw data.

### 4.2 Malformed JSON

In a future owner-run session, send an intentionally malformed JSON body and confirm that parsing
fails closed.

Expected:

- Safe disabled shell.
- No crash.
- No raw error.

### 4.3 Guarded runtime scaffold request

```json
{
  "mode": "guarded-runtime-scaffold",
  "source": "mocked-provider-compatible",
  "guardedRuntimeScaffold": true
}
```

Expected:

- Safe blocked/feature-disabled shell.
- No composition internals exposed.
- No provider execution.
- No route success.

### 4.4 Owner-local mocked request

Use only the exact route-supported shape: `mode` must be `owner-local-mocked`, `source` must be
`mocked-provider-compatible`, and `ownerLocalMocked` must be `true`. This branch is not real auth
and is not public or beta activation. Its expected response remains sanitized and bucketed.

### 4.5 Owner-local auth/usage bridge request

Use only the exact route-supported shape: `mode` must be `owner-local-auth-usage-bridge`, `source`
must be `mocked-provider-compatible`, `ownerLocalAuthUsageBridge` must be `true`, and the request
must contain the existing caller-supplied mock auth and usage objects. This branch is not real
auth, uses caller-supplied mock auth/usage only, and is not real persistence. Its expected response
remains sanitized and bucketed.

## 5. Expected Safe Response Rules

Allowed response fields:

- `status`, `mode`, `ok`, `dataPolicy`, `disclaimer`, and `safeMessage`.
- `guardStatus`, `authState`, and `role` or `resolvedRole`.
- `usageWindow`, `usageRemainingBucket`, `usageRemainingDailyBucket`, and
  `usageRemainingMonthlyBucket`.
- `engineStatus`, `normalizedBarsAvailable`, `normalizedBarCountBucket`, and `matchCountBucket`.

Forbidden response content:

- Raw Supabase user identifier, email address, phone number, access token, refresh token, JWT,
  session, or user object.
- Cookie or header value, environment value, or service-role key.
- Raw database record or raw usage counter.
- Raw KIS payload or OHLC price, volume, or timestamp.
- Raw similarity score or return.
- Account, trading, order, or balance data.

## 6. Pass Criteria

Manual QA may pass only if the default path remains safe disabled; malformed JSON falls back
safely; the guarded path returns the safe blocked/feature-disabled shell without composition
internals; both owner-local branches and all three `/chart-ai` surfaces remain unchanged; query-
gated panels stay hidden unless explicitly requested; no guarded route success, beta/public
activation, live KIS, or real database/Supabase/environment path appears; no forbidden raw data is
returned; and no deployment or push occurs.

## 7. Fail Criteria

Manual QA must fail if any guarded path returns success; provider execution runs from the guarded
path; the route branch count changes; composition internals or forbidden raw auth/session/token/
environment/DB/KIS/OHLC/score/account/trading/order/balance data appears; either owner-local branch
regresses; `/chart-ai` query-gated behavior regresses; a real database/Supabase/environment/live
KIS path is introduced; or deployment or push occurs without explicit approval.

## 8. Manual QA Result Template

```text
Owner-local Manual QA Result

Date:
Operator:
Branch:
Commit:
Local URL:
Dev server started by owner: Yes / No
Push/deploy performed: No

API default safe disabled:
Malformed JSON fallback:
Guarded scaffold safe blocked:
Guarded response has no composition internals:
Owner-local mocked branch unchanged:
Owner-local auth/usage branch unchanged:
Chart AI default page unchanged:
Owner-local mocked panel unchanged:
Owner-local auth/usage panel unchanged:
No route success:
No beta/public:
No live KIS:
No DB/Supabase/env:
No raw forbidden data:

Decision:
- PASS / FAIL / BLOCKED

Notes:
```

## 9. Activation Boundary

Even if future manual QA passes, this package does not approve route success, provider execution,
beta activation, public activation, real database connection, Supabase client creation,
environment reads, cookie/header/session/JWT processing, migration execution, service-role use,
live KIS, deployment, or push.

## 10. Recommended Next Phase

Recommended: **Phase 3FD-F-MANUAL-RUN — Owner Executes Manual QA Locally and Reports Results**.

Alternative: **Phase 3FD-E-HF1 — Guarded Composition Scaffold Revisions, All Gates Off**.

Hold: **Phase 3FD-B-HF1 — Real Supabase Client Factory Approval Package, No Runtime Change**.
