# Phase 3FC-D Role Assignment Resolver Contract

## 1. Purpose

This document defines the contract for the role assignment resolver scaffold introduced in Phase
3FC-D. The resolver is a server-only module that maps a resolved auth subject (produced by Phase
3FC-C's auth subject resolver) plus deterministic mocked role assignment records to a full
`SimilarityRoleAssignmentRole` (`anonymous | authenticated | beta | owner | admin`). It is
disabled by default and testable only through deterministic mocked fixtures. It performs no real
Supabase call, no real role database lookup, no environment read, no cookie or header read, and no
live KIS call. `beta`, `owner`, and `admin` are producible only from an explicit, matching, active
role assignment record — a valid authenticated session alone never grants these roles, and no
owner/admin bypass without an assignment is possible under this policy.

## 2. Inputs

The resolver accepts a single explicit input object of type `SimilarityRoleAssignmentResolverInput`:

- `authState`: `'anonymous' | 'authenticated'`.
- `roleSeed`: `'anonymous' | 'authenticated'` — carried over from the Phase 3FC-C auth subject
  resolver's output.
- `subject`: `SimilarityRoleAssignmentSubjectRef | null` — structurally compatible with Phase
  3FC-C's `SimilarityAuthSubjectSafeRef` (`provider`, a synthetic `subjectRef`,
  `source: 'mocked-scaffold'`, `stableForUsageLookup`).
- `mockedAssignments`: an optional array of `SimilarityRoleAssignmentRecord` — synthetic role
  assignment records, never a real database row.
- `clientClaimedRole` / `clientClaimedSubject`: optional client-supplied strings. These are always
  ignored by the resolver and never influence the result; their only effect is a safe
  `client_claim_ignored` warning.

The resolver never reads a `Request`, cookies, request headers, `process.env`, or a real database.
It only inspects the explicit input object passed to it.

## 3. Outputs

The resolver returns a `SimilarityRoleAssignmentResolverResult`:

- `ok`: boolean.
- `status`: `'disabled' | 'anonymous' | 'default_authenticated' | 'assigned' | 'invalid_subject' |
  'invalid_assignment' | 'not_configured' | 'error'`.
- `role`: `SimilarityRoleAssignmentRole`.
- `roleSource`: `'default' | 'mocked-assignment'`.
- `subject`: `SimilarityRoleAssignmentSubjectRef | null`.
- `assignment`: a safe pick (`role`, `assignedAtIso`, `assignedByRef`, `source`) of the matched
  assignment record, or `null` when no assignment was used.
- `safeMessage`: a human-readable, non-sensitive summary string.
- `policy`: a safe summary of the policy that produced the result.
- `warnings`: a string array (e.g. `client_claim_ignored`, `assignment_ignored`,
  `multiple_assignments_ignored`).

## 4. Policy Defaults

`buildDefaultSimilarityRoleAssignmentResolverPolicy()` returns a policy with `enabled: false` and
every real-capability boolean fixed to `false`: `allowRealRoleStore`, `allowSupabaseClient`,
`allowEnvRead`, `allowDbRead`, `allowCookieRead`, `allowHeaderRead`, `allowClientClaimedRole`,
`allowClientClaimedSubject`, `allowAnonymousExecution`, `allowOwnerAdminBypassWithoutAssignment`,
`allowRouteSuccess`, `allowPublicExecution`, `allowBetaExecution`. Under this policy,
`resolveSimilarityRoleAssignment` always returns `status: 'disabled'`, `ok: false`,
`role: 'anonymous'`, `roleSource: 'default'`, `subject: null`, `assignment: null`, regardless of
any subject or mocked assignment supplied.

`buildMockedSimilarityRoleAssignmentResolverPolicy()` sets `enabled: true` so mocked assignment
branches can be exercised for scaffold verification, but every real-capability boolean above
remains `false`, including `allowOwnerAdminBypassWithoutAssignment`. This policy grants no real
role store capability; it only unlocks the mocked assignment code paths.

## 5. Mocked Scaffold Behavior

Under the mocked scaffold policy:

- An anonymous auth subject (`authState: 'anonymous'`, `roleSeed: 'anonymous'`, or a `null`
  subject) resolves to `status: 'anonymous'`, `ok: false`, `role: 'anonymous'`,
  `roleSource: 'default'`, `assignment: null`.
- An authenticated subject with no active matching assignment record resolves to
  `status: 'default_authenticated'`, `ok: true`, `role: 'authenticated'`, `roleSource: 'default'`,
  `assignment: null`.
- An authenticated subject with exactly one active assignment record matching its `subjectRef`
  resolves to `status: 'assigned'`, `ok: true`, `role` equal to the assignment's role
  (`beta`/`owner`/`admin`), `roleSource: 'mocked-assignment'`, and a safe `assignment` pick.
- An inactive assignment record (`active: false`) is ignored: the role does not escalate, the
  result falls back to `default_authenticated`, and a `assignment_ignored` warning is added.
- Multiple active assignment records matching the same `subjectRef` are ignored for safety: the
  role does not escalate, the result falls back to `default_authenticated`, and a
  `multiple_assignments_ignored` warning is added.
- A `clientClaimedRole` or `clientClaimedSubject` value is always ignored: it never changes
  `role`, `roleSource`, `subject`, or `assignment`, and its only effect is appending a
  `client_claim_ignored` warning.
- A malformed input object resolves to `status: 'invalid_subject'` via
  `normalizeSimilarityRoleAssignmentResolverInput` returning `null`.

## 6. Security Boundary

This module:

- Never imports a Supabase package or calls a real Supabase client.
- Never reads `process.env`, `.env`, cookies, or request headers.
- Never calls `fetch` or any network API.
- Never reads a real role assignment database, cache, or table.
- Never imports a KIS provider module, the deterministic similarity engine, or an API route
  module.
- Never allows `beta`, `owner`, or `admin` to be granted without an explicit, matching, active
  assignment record — a valid session or client-supplied role claim never bypasses this.
- Is not wired into `src/pages/api/chart-ai/similarity.ts` or `src/pages/chart-ai.astro` in this
  phase — it has zero runtime effect on the existing route or UI.

`assertSimilarityRoleAssignmentResolverResultIsSafe` provides a defense-in-depth check, used only
in test/smoke contexts, that scans a result's primitive values (never its key names) for forbidden
substrings before treating the result as safe to log or assert against.

## 7. Future Integration

A later, separate phase (Phase 3FC-E — Usage Store Interface Scaffold, or the alternative Phase
3FC-E-ALT — Feature Flag Resolver Scaffold) will build on this resolver's `role` output to load and
enforce per-role usage limits and/or resolve feature flag activation dependencies. Only a
subsequent, explicitly approved phase after that will wire a real Supabase client, a real role
assignment database, and route integration. No such wiring is part of this phase.
