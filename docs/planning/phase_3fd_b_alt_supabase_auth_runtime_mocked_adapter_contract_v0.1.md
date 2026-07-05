# Phase 3FD-B-ALT Supabase Auth Runtime Mocked Adapter Contract

## 1. Purpose

This document defines the contract for a mocked Supabase Auth runtime adapter first. This phase
proves the shape of a future real Supabase Auth runtime adapter using deterministic mocked
fixtures only. This phase makes no real Supabase call, creates no real Supabase client, performs
no real environment variable read, performs no route or UI integration, and enables no route
success path. The mocked adapter is a server-only scaffold that maps a mocked Supabase-like session
into the existing Phase 3FC-C auth subject resolver contract, so that a future real implementation
can reuse the same proven shape.

## 2. Inputs

The adapter accepts a single explicit in-memory input object (`SimilaritySupabaseAuthRuntimeAdapterInput`):

- `mockedSession` — a `SimilarityMockedSupabaseSession` object (or `null`), describing a mocked
  Supabase-like session state (`missing` | `valid` | `invalid` | `expired` | `malformed`) and an
  optional mocked, safe user reference.
- `currentIso` — an optional ISO-8601 string used only to make fixture construction deterministic;
  the adapter never reads the system clock or any external time source.
- `requestedRuntime` — an optional literal `'auth-subject-resolution'` marker describing the
  intended future call site.
- `clientClaimedRole` — an optional, always-ignored client-claimed role value. Its presence only
  ever produces a safe warning; it is never trusted for authorization.

The adapter never reads a `Request` object, cookies, headers, environment variables, or a real
database — every input above is an explicit, caller-supplied, in-memory value.

## 3. Outputs

The adapter returns a `SimilaritySupabaseAuthRuntimeAdapterResult`:

- `ok` — whether the mocked session resolved to an authenticated subject.
- `status` — one of `disabled` | `mocked_resolved` | `missing_session` | `invalid_session` |
  `expired_session` | `malformed_session` | `redaction_failed` | `error`.
- `source` — `mocked-supabase-auth` or `disabled`.
- `subject` — a safe subject summary: `state` (`anonymous` | `authenticated`), `subjectRef` (a
  safe synthetic reference or `null`), `providerKind`, `roleSeed` (`anonymous` | `authenticated`
  only — never `beta`/`owner`/`admin`), and `safeWarnings`.
- `safeMessage` — a short, redacted, human-readable status message.
- `warnings` — a list of safe warning codes (for example `client_role_claim_ignored`).
- `policy` — a safe policy summary confirming all real-capability flags remain `false`.

## 4. Policy Defaults

`buildDefaultSimilaritySupabaseAuthRuntimeAdapterPolicy()` returns a policy with `enabled: false`
and `allowMockedSession: false`; every real-capability flag (`allowRealSupabaseClient`,
`allowEnvRead`, `allowCookieRead`, `allowHeaderRead`, `allowJwtVerification`, `allowRouteSuccess`,
`allowClientRoleTrust`) is `false`. Under this default policy the adapter always resolves to
`disabled`/anonymous, regardless of the mocked session supplied.

`buildMockedSimilaritySupabaseAuthRuntimeAdapterPolicy()` returns `enabled: true` and
`allowMockedSession: true`, but every real-capability flag above remains `false`. This mocked
policy only ever permits resolution against a mocked, in-memory session — it grants no real
Supabase capability.

## 5. Session State Handling

| Mocked session state | Adapter status      | Subject      |
| --------------------- | -------------------- | ------------ |
| `missing`              | `missing_session`    | anonymous    |
| `invalid`              | `invalid_session`     | anonymous    |
| `expired`              | `expired_session`     | anonymous    |
| `malformed`            | `malformed_session`   | anonymous    |
| `valid` (safe user)    | `mocked_resolved`     | authenticated |

A `valid` session without a safe user reference (missing `idRef`) is treated as `invalid_session`,
never as authenticated.

## 6. Subject Mapping

`mapSupabaseAuthAdapterResultToAuthSubjectSeed(result)` produces a seed shape compatible with the
existing Phase 3FC-C auth subject resolver's expectations:

- A non-`ok` adapter result maps to `authState: 'anonymous'`, `roleSeed: 'anonymous'`,
  `subjectRef: null`.
- An `ok` adapter result with an `authenticated` subject maps to `authState: 'authenticated'`,
  `roleSeed: 'authenticated'`, and `subjectRef` equal to the adapter's own safe synthetic subject
  reference.
- The mapping never produces `beta`, `owner`, or `admin` — those roles remain the responsibility of
  the Phase 3FC-D role assignment resolver.
- The mapping never surfaces a raw Supabase user id, a raw email address, a raw session, or a raw
  token — only the safe seed fields above.

## 7. Redaction and Safety Boundary

The adapter result and the safety assertion (`assertSimilaritySupabaseAuthRuntimeAdapterResultIsSafe`)
guarantee the result never contains: an access token, a refresh token, a JWT, a raw session object,
a raw user object, a real email-address-shaped value, a phone number, raw provider metadata, a
cookie value, an authorization header value, `SUPABASE_SERVICE_ROLE_KEY` or any service role key
value, a secret, a credential, a KIS app key or secret, or any account/trading/balance data. A safe
category value such as `providerKind: 'email'` remains allowed, since it identifies a provider kind
rather than leaking a real address.

## 8. Relationship to Phase 3FD-A

Phase 3FD-A prepared the approval and setup package only — planning docs describing the future
real Supabase Auth runtime, candidate environment variable key names, and a redaction policy, with
no code implementation. Phase 3FD-B-ALT is the first phase in this chain to implement real
TypeScript modules, but it implements only a mocked adapter proven against deterministic fixtures.
This phase still does not approve a real Supabase client, a real environment variable read, real
cookie/header parsing, real JWT verification, route integration, or route success.

## 9. Future Integration

Recommended next phase: **Phase 3FD-B — Real Supabase Auth Subject Resolver Implementation,
Disabled by Default**, which would implement the real Supabase Auth runtime behind this same proven
adapter shape, still disabled by default. Alternative: **Phase 3FD-C-PLAN — Role/Usage DB Schema
Approval Package, No Runtime Change**, which would prepare a database schema approval package for
the Phase 3FC-D role assignment resolver and the Phase 3FC-E usage store, without implementing a
real database.
