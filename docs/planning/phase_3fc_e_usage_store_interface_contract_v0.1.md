# Phase 3FC-E Usage Store Interface Contract

## 1. Purpose

This document defines the contract for the usage store interface scaffold introduced in Phase
3FC-E. The scaffold is a server-only module that maps a resolved role (produced by Phase 3FC-D's
role assignment resolver) plus deterministic mocked usage counter records to a safe usage snapshot,
and separately computes a safe mocked usage increment result. It is disabled by default and
testable only through deterministic mocked fixtures. It performs no real Supabase call, no real
usage database read or write, no environment read, no cookie or header read, and no live KIS call.
It never resolves auth state or role itself — it consumes the role/subject output of the Phase
3FC-C and Phase 3FC-D resolvers.

## 2. Inputs

The module accepts a single explicit input object of type `SimilarityUsageStoreInput`:

- `role`: `SimilarityUsageStoreRole` (`anonymous | authenticated | beta | owner | admin`) —
  carried over from the Phase 3FC-D role assignment resolver's output.
- `subject`: `SimilarityUsageStoreSubjectRef | null` — structurally compatible with Phase 3FC-C's
  `SimilarityAuthSubjectSafeRef` and Phase 3FC-D's `SimilarityRoleAssignmentSubjectRef`
  (`provider`, a synthetic `subjectRef`, `source: 'mocked-scaffold'`, `stableForUsageLookup`).
- `window`: `SimilarityUsageStoreWindow` (`daily | monthly`).
- `mockedCounters`: an optional array of `SimilarityUsageCounterRecord` — synthetic usage counter
  records, never a real database row.
- `incrementBy`, `requestRef`, `currentIso`: optional fields used only by the increment
  computation.
- `clientClaimedRole` / `clientClaimedUsage`: optional client-supplied values. These are always
  ignored by the module and never influence the result; their only effect is a safe
  `client_claim_ignored` warning.

The module never reads a `Request`, cookies, request headers, `process.env`, or a real database.
It only inspects the explicit input object passed to it.

## 3. Outputs

The module returns either a `SimilarityUsageStoreSnapshotResult` (from `loadSimilarityUsageSnapshot`)
or a `SimilarityUsageStoreIncrementResult` (from `recordSimilarityUsageIncrement`):

- `ok`: boolean.
- `status`: `'disabled' | 'loaded' | 'limit_reached' | 'increment_recorded' | 'increment_blocked' |
  'anonymous_blocked' | 'invalid_subject' | 'invalid_role' | 'counter_unavailable' |
  'not_configured' | 'error'`.
- `role`, `subject`, `window`: echoed back from the resolved input.
- `usage` (snapshot result) or `before`/`after` (increment result): a `SimilarityUsageSnapshot`
  (`used`, `limit`, `remaining`, `resetAtIso`, `isLimitReached`, `source`), or `null`.
- `event` (increment result only): a safe pick (`eventRef`, `role`, `window`, `incrementBy`,
  `occurredAtIso`, `source`, `guardStatus`) of the computed usage event, or `null`.
- `safeMessage`: a human-readable, non-sensitive summary string.
- `policy`: a safe summary of the policy that produced the result.
- `warnings`: a string array (e.g. `client_claim_ignored`, `counter_ignored`,
  `anonymous_execution_blocked`, `invalid_increment_amount`, `quota_exceeded`).

## 4. Policy Defaults

`buildDefaultSimilarityUsageStorePolicy()` returns a policy with `enabled: false` and every
real-capability boolean fixed to `false`: `allowRealUsageStore`, `allowSupabaseClient`,
`allowEnvRead`, `allowDbRead`, `allowDbWrite`, `allowSql`, `allowCookieRead`, `allowHeaderRead`,
`allowClientClaimedRole`, `allowClientClaimedUsage`, `allowAnonymousExecution`,
`allowRouteSuccess`, `allowPublicExecution`, `allowBetaExecution`. Under this policy,
`loadSimilarityUsageSnapshot` and `recordSimilarityUsageIncrement` always return
`status: 'disabled'`, `ok: false`, `usage`/`before`/`after`/`event: null`, regardless of any
subject or mocked counter supplied.

`buildMockedSimilarityUsageStorePolicy()` sets `enabled: true`, `allowMockedUsageRead: true`, and
`allowMockedUsageIncrement: true` so mocked snapshot/increment branches can be exercised for
scaffold verification, but every real-capability boolean above remains `false`. This policy grants
no real usage store capability; it only unlocks the mocked code paths.

## 5. Approved Limit Table

`getApprovedSimilarityUsageLimit(role, window)` is a pure lookup function returning the
owner-approved daily/monthly limit for a role. This table is hardcoded (not derived from a uniform
multiplier, since owner and admin scale differently between daily and monthly):

| Role          | Daily | Monthly |
|---------------|-------|---------|
| anonymous     | 0     | 0       |
| authenticated | 3     | 30      |
| beta          | 10    | 100     |
| owner         | 50    | 1000    |
| admin         | 100   | 3000    |

## 6. Mocked Scaffold Behavior

Under the mocked scaffold policy:

- An anonymous role or a missing subject always resolves to `status: 'anonymous_blocked'`,
  `ok: false`, `usage: null` (snapshot) or `status: 'increment_blocked'`, `ok: false`,
  `after: null` (increment).
- A non-anonymous role with no matching mocked counter resolves to a safe zero-used snapshot at
  the approved limit for that role/window (`status: 'loaded'`).
- A non-anonymous role with a matching mocked counter resolves to a snapshot using that counter's
  `used` value against the approved limit; when `used >= limit`, `status: 'limit_reached'`.
- A mismatched counter (wrong `subjectRef`, `role`, or `window`) is ignored for safety: the
  snapshot falls back to the zero-used default, and a `counter_ignored` warning is added.
- A missing/non-integer/non-positive `incrementBy` blocks the increment
  (`status: 'increment_blocked'`) with an `invalid_increment_amount` warning.
- An increment that would exceed the approved limit blocks the increment
  (`status: 'increment_blocked'`) with a `quota_exceeded` warning; `after` remains `null`.
- A valid increment within the approved limit resolves to `status: 'increment_recorded'`,
  `ok: true`, a computed `after` snapshot, and a safe `event` pick.
- A `clientClaimedRole` or `clientClaimedUsage` value is always ignored: it never changes `role`,
  `usage`, `before`, or `after`, and its only effect is appending a `client_claim_ignored` warning.
- A malformed input object resolves to `status: 'invalid_subject'` (not a plain object, or a
  malformed subject/window/counter) or `status: 'invalid_role'` (a plain object with an invalid
  `role` field), depending on which check fails first.

## 7. Security Boundary

This module:

- Never imports a Supabase package or calls a real Supabase client.
- Never reads `process.env`, `.env`, cookies, or request headers.
- Never calls `fetch` or any network API.
- Never reads or writes a real usage database, cache, or table.
- Never imports a KIS provider module, the deterministic similarity engine, or an API route
  module.
- Never persists an increment: `recordSimilarityUsageIncrement` only computes what a real atomic
  increment would produce, with no side effect and no atomicity guarantee.
- Is not wired into `src/pages/api/chart-ai/similarity.ts` or `src/pages/chart-ai.astro` in this
  phase — it has zero runtime effect on the existing route or UI.

`assertSimilarityUsageStoreResultIsSafe` provides a defense-in-depth check, used only in
test/smoke contexts, that scans a result's primitive values (never its key names) for forbidden
substrings before treating the result as safe to log or assert against.

## 8. Future Integration

A later, separate phase (Phase 3FC-F — Feature Flag Resolver Scaffold, or the alternative Phase
3FC-F-ALT — Guarded Route Integration Plan Refresh) will build on this module's snapshot/increment
output to evaluate feature flag activation dependencies and/or plan a guarded route integration.
Only a subsequent, explicitly approved phase after that will wire a real Supabase client, a real
usage database with an atomic conditional update or transaction, idempotency handling, and route
integration. No such wiring is part of this phase.
