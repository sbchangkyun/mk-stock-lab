# Phase 3FC-C Auth Subject Resolver Contract

## Purpose

This document defines the contract for the Supabase Auth subject resolver scaffold introduced in
Phase 3FC-C. The resolver is a server-only module that maps an explicit, caller-supplied input
object to a safe auth subject result. It is disabled by default and testable only through
deterministic mocked fixtures. It performs no real Supabase call, no environment read, no cookie
or header read, and no live KIS call. It resolves only an `anonymous` or `authenticated` role
seed — it never resolves `beta`, `owner`, or `admin`. Those roles are the responsibility of a
later, separate role assignment resolver (Phase 3FC-D), per the Phase 3FC-B design.

## Inputs

The resolver accepts a single explicit input object of type `SimilarityAuthSubjectResolverInput`:

- `provider`: fixed to `'supabase'`.
- `mode`: `'disabled-scaffold'` or `'mocked-scaffold'`.
- `serverSessionCandidate`: an optional `SimilarityAuthSubjectMockSessionCandidate` describing a
  synthetic session state (`'missing' | 'valid' | 'invalid'`), a synthetic `subjectRef`, and an
  optional `emailVerified` boolean. This is never a real Supabase session object.
- `clientClaimedRole` / `clientClaimedSubject`: optional client-supplied strings. These are always
  ignored by the resolver and never influence the result; their only effect is a safe
  `client_claim_ignored` warning.

The resolver never reads a `Request`, cookies, request headers, or `process.env`. It only
inspects the explicit input object passed to it.

## Outputs

The resolver returns a `SimilarityAuthSubjectResolverResult`:

- `ok`: boolean.
- `status`: `'disabled' | 'anonymous' | 'authenticated' | 'invalid_context' | 'not_configured' | 'error'`.
- `authState`: `'anonymous' | 'authenticated'`.
- `roleSeed`: `'anonymous' | 'authenticated'` only.
- `subject`: `SimilarityAuthSubjectSafeRef | null` — when present, contains only `provider`,
  a synthetic `subjectRef`, `source: 'mocked-scaffold'`, and `stableForUsageLookup`. No token, no
  raw session payload, no account/trading/balance field.
- `safeMessage`: a human-readable, non-sensitive summary string.
- `policy`: a safe summary of the policy that produced the result.
- `warnings`: a string array (e.g. `client_claim_ignored`).

## Policy Defaults

`buildDefaultSimilarityAuthSubjectResolverPolicy()` returns a policy with `enabled: false` and
every real-capability boolean fixed to `false`: `allowRealSupabaseClient`, `allowEnvRead`,
`allowCookieRead`, `allowHeaderRead`, `allowClientClaimedSubject`, `allowClientClaimedRole`,
`allowTokenEcho`, `allowRawSessionEcho`, `allowRouteSuccess`, `allowPublicExecution`,
`allowBetaExecution`. Under this policy, `resolveSimilarityAuthSubject` always returns
`status: 'disabled'`, `ok: false`, `authState: 'anonymous'`, `roleSeed: 'anonymous'`,
`subject: null`, regardless of any session candidate supplied.

`buildMockedSimilarityAuthSubjectResolverPolicy()` sets `enabled: true` so mocked session
candidate branches can be exercised for scaffold verification, but every real-capability boolean
above remains `false`. This policy grants no real Supabase capability; it only unlocks the mocked
session-candidate code paths.

## Mocked Scaffold Behavior

Under the mocked scaffold policy:

- A missing session candidate (`state: 'missing'`, or no candidate at all) resolves to
  `status: 'anonymous'`, `ok: false`, `subject: null`.
- A valid session candidate (`state: 'valid'`, with a synthetic `subjectRef`) resolves to
  `status: 'authenticated'`, `ok: true`, `roleSeed: 'authenticated'`, and a `subject` with
  `source: 'mocked-scaffold'` and `stableForUsageLookup: true`.
- An invalid session candidate (`state: 'invalid'`) resolves to `status: 'invalid_context'`,
  `ok: false`, `subject: null`.
- A malformed input object (wrong `provider`, wrong `mode`, or an unrecognized candidate shape)
  resolves to `status: 'invalid_context'` via `normalizeSimilarityAuthSubjectResolverInput`
  returning `null`.
- A `clientClaimedRole` or `clientClaimedSubject` value is always ignored: it never changes
  `roleSeed`, `authState`, or `subject`, and its only effect is appending a `client_claim_ignored`
  warning.

## Security Boundary

This module:

- Never imports a Supabase package or calls a real Supabase client.
- Never reads `process.env`, `.env`, cookies, or request headers.
- Never calls `fetch` or any network API.
- Never imports a KIS provider module, the deterministic similarity engine, or an API route
  module.
- Never echoes an access token, refresh token, JWT, or raw session payload in its result.
- Never resolves `beta`, `owner`, or `admin` role seeds.
- Is not wired into `src/pages/api/chart-ai/similarity.ts` or `src/pages/chart-ai.astro` in this
  phase — it has zero runtime effect on the existing route or UI.

`assertSimilarityAuthSubjectResolverResultIsSafe` provides a defense-in-depth check, used only in
test/smoke contexts, that scans a result's primitive values (never its key names) for forbidden
substrings before treating the result as safe to log or assert against.

## Future Integration

A later, separate phase (Phase 3FC-D — Role Assignment Resolver Scaffold, or the alternative
Phase 3FC-D-ALT — Usage Store Interface Scaffold) will build on this resolver's `roleSeed` output
to assign `beta`/`owner`/`admin` roles and/or connect a usage store, and only a subsequent,
explicitly approved phase after that will wire a real Supabase client, real session/JWT
verification, and route integration. No such wiring is part of this phase.
