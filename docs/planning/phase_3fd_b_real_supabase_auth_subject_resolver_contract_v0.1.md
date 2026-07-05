# Phase 3FD-B Real Supabase Auth Subject Resolver Contract

## 1. Purpose

This phase implements a server-only, real-compatible Supabase Auth subject resolver boundary for
Chart Similarity. The resolver is disabled by default and is proven only against an injected
Supabase-compatible auth client interface and deterministic mocked clients. No real Supabase client
is created and no real Supabase call is made in this phase. This is distinct from Phase 3FD-B-ALT's
mocked adapter first approach, which took a fully self-contained mocked session object as input —
this resolver instead models a future real-Supabase-backed implementation by accepting an injected
`SimilaritySupabaseCompatibleAuthClient` dependency, without implementing a real client itself.

## 2. Inputs

`resolveSimilarityRealSupabaseAuthSubject` accepts a plain in-memory input object
(`SimilarityRealSupabaseAuthSubjectResolverInput`) carrying `sessionEvidenceRef` (a redacted
reference, never a real token value), `tokenShape`, `currentIso`, `requestedRuntime`, and an
optional `clientClaimedRole`. It also accepts a `deps` object
(`SimilarityRealSupabaseAuthSubjectResolverDeps`) carrying an optional injected `authClient`
implementing `SimilaritySupabaseCompatibleAuthClient.getUser()`, and a policy object. The resolver
never reads a `Request`, cookies, headers, `process.env`, or `import.meta.env` itself — any I/O
only ever happens inside the caller-supplied `deps.authClient.getUser()` implementation, which in
this phase is always a deterministic mocked client. `clientClaimedRole` is always ignored — never
trusted — and its presence only ever produces a safe `client_role_claim_ignored` warning.

## 3. Outputs

The resolver returns a `SimilarityRealSupabaseAuthSubjectResolverResult` containing `ok`, `status`,
`source`, `subject` (`state`, `subjectRef`, `providerKind`, `roleSeed`, `safeWarnings`),
`safeMessage`, `warnings`, and a safe policy summary. No raw email, token, cookie, header, or
session field ever appears in the result — `subjectRef` is always a derived synthetic reference
(`real-supabase-auth-subject:<userRef>`), never the bare injected-client `userRef`.

## 4. Policy Defaults

The default policy (`buildDefaultSimilarityRealSupabaseAuthSubjectResolverPolicy`) sets `enabled:
false` and `allowInjectedSupabaseCompatibleClient: false`. Every real-capability flag
(`allowRealSupabaseClientCreation`, `allowEnvRead`, `allowCookieRead`, `allowHeaderRead`,
`allowJwtVerification`, `allowRouteSuccess`, `allowClientRoleTrust`, `allowRawSessionEcho`,
`allowRawUserEcho`) is literal-typed `false` and never set to `true` by either policy builder,
including the injected-mock policy builder
(`buildInjectedMockSimilarityRealSupabaseAuthSubjectResolverPolicy`), which only flips `enabled` and
`allowInjectedSupabaseCompatibleClient` to `true`.

## 5. Injected Client Boundary

The resolver never constructs a Supabase-compatible auth client itself. It only ever consults a
caller-supplied implementation of `SimilaritySupabaseCompatibleAuthClient`. In this phase, every
implementation of that interface is a local, in-memory, deterministic mocked client (see the
fixtures module) — none of them call a real Supabase service or the network. When the policy allows
an injected client but none was supplied via `deps.authClient`, the resolver resolves to
`client_unavailable`/anonymous rather than attempting any fallback construction of its own.

## 6. Session State Handling

| Injected client `getUser()` status | Resolver status     | Subject state |
| ----------------------------------- | -------------------- | ------------- |
| (policy disabled)                   | `disabled`            | anonymous     |
| (no `deps.authClient` supplied)      | `client_unavailable`  | anonymous     |
| `missing_session`                   | `missing_session`     | anonymous     |
| `invalid_session`                   | `invalid_session`     | anonymous     |
| `expired_session`                   | `expired_session`     | anonymous     |
| `malformed_session`                 | `malformed_session`   | anonymous     |
| `client_error`                      | `error`               | anonymous     |
| `ok` (valid user)                   | `resolved`            | authenticated |

## 7. Subject Mapping

`mapRealSupabaseAuthSubjectResultToAuthSubjectSeed` maps a resolver result to the existing Phase
3FC-C auth subject seed contract (`authState`/`roleSeed` of `anonymous | authenticated` only,
`subjectRef` a safe synthetic reference or `null`). It never maps to `beta`/`owner`/`admin` — those
roles remain the responsibility of the Phase 3FC-D role assignment resolver. A client-claimed role
never escalates the mapped `roleSeed`.

## 8. Redaction and Safety Boundary

`assertSimilarityRealSupabaseAuthSubjectResolverResultIsSafe` collects only primitive values (never
key names) from a result and checks them against a forbidden-substrings list (token, raw
session/user markers, cookie/header/env-shaped terms, service role key, KIS/account/trading/balance
fields, live/auto source markers) plus a structural email-address-shape pattern
(`EMAIL_ADDRESS_SHAPE_PATTERN`). Avoid the false positive already observed in Phase 3FD-B-ALT:
category strings like the safe `providerKind: 'email'` enum value are not secret values, so a bare
"email" substring check is never used — only a real email-address-shaped match (requiring `@` and a
domain) is treated as forbidden.

## 9. Relationship to Phase 3FD-A and 3FD-B-ALT

Phase 3FD-A prepared the owner approval/setup package for a future real Supabase Auth runtime, and
Phase 3FD-B-ALT proved a mocked adapter contract and redaction behavior using a fully self-contained
mocked session input. This phase implements the real-compatible subject resolver boundary using an
injected Supabase-compatible client dependency instead, moving one step closer to the eventual real
implementation while still making no real Supabase call. The repository's pre-existing
`@supabase/supabase-js` dependency (used by unrelated pre-existing features) is not, and has never
been, treated as approval to instantiate or call a real Supabase client for Chart Similarity.

## 10. Future Integration

Recommended next: Phase 3FD-C-PLAN — Role Assignment and Usage Store Schema/Migration Approval
Package, No Runtime Change. Alternative: Phase 3FD-B-HF1 — Real Supabase Client Factory Approval
Package, No Runtime Change. The real Supabase client factory, env reading, cookie/header parsing,
and route integration remain later, separately approved phases.
