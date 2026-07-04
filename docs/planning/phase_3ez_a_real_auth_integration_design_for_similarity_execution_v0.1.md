# Phase 3EZ-A — Real Auth Integration Design for Similarity Execution v0.1

## 1. Purpose

This phase defines how future real-auth subjects will map into Chart Similarity execution guard
requests (`SimilarityExecutionGuardRequest`, Phase 3EY-C), without implementing real
authentication and without adding any API route. It establishes provider-agnostic types, a
default role mapping policy, mocked/synthetic subject builders, and pure mapping functions that a
later, separately authorized phase can wire to a real auth provider and a real route.

## 2. Current State

- Phase 3EX-E completed the `/chart-ai` owner-review UI polish; the similarity/MK AI tabs live in
  a single chart-lower analysis workspace.
- Phase 3EY-C added the server-only auth/usage execution guard foundation
  (`similarityExecutionGuard.ts`), disabled by default and not wired to any route.
- Phase 3EY-D added the sanitized mocked API response contract
  (`similarityApiResponseBuilder.ts`) that converts a guard result into a `SimilarityApiResponse`
  shape.
- No `/api/chart-ai/similarity` route or any other API route exists.
- No real auth runtime exists anywhere in the Chart Similarity execution path.
- No usage storage exists.
- No live KIS Chart Similarity execution exists.

## 3. Auth Integration Boundary

- This phase is design/foundation only.
- No real auth provider (Supabase, Auth0, OAuth, NextAuth, or any other) is imported.
- No Supabase auth import is added anywhere in this phase.
- No cookies, request headers, or session data are read.
- No API route is added or modified.
- No DB/cache runtime is added.
- No KIS call is made.
- No `userId`, `role`, or `authState` leaks into any API-facing response — `SimilarityApiResponse`
  (Phase 3EY-D) already omits these fields from `toSimilarityApiSafeRequest`, and this phase does
  not change that boundary.

## 4. Subject and Role Model

Five subject kinds are defined in `SimilarityAuthSubjectKind`:

- `anonymous` — no session; maps to guard role `anonymous` and guard auth state `missing`.
- `user` — a real or mocked authenticated user; maps to guard role `authenticated` and guard auth
  state `authenticated`.
- `beta_user` — an authenticated user granted beta access; maps to guard role `beta` and guard
  auth state `authenticated`.
- `owner` — the product owner; maps to guard role `owner` and guard auth state `owner`.
- `admin` — an administrator; maps to guard role `admin` and guard auth state `admin`.

Each subject kind maps deterministically to the existing `SimilarityExecutionRole` and
`SimilarityExecutionAuthState` types from Phase 3EY-C via `mapAuthSubjectToGuardRole` and
`mapAuthSubjectToGuardAuthState` in `similarityAuthIntegrationDesign.ts`. These mapping functions
are pure and never throw.

## 5. Provider Strategy

`SimilarityAuthProviderKind` enumerates four candidate provider kinds:

- `none` — no provider is configured (the default in this phase).
- `supabase` — a future Supabase-auth-backed provider.
- `custom` — a future in-house session/auth provider.
- `external` — a future third-party OAuth/Auth0/NextAuth-style provider.

This phase does not choose or activate a provider. `buildDefaultSimilarityAuthRoleMappingPolicy`
returns `providerKind: 'none'` and leaves `betaRoleSource`, `ownerRoleSource`, and
`adminRoleSource` as `'not_configured'`. It only defines provider-agnostic safe types and mapping
rules so that a future phase can select and wire a real provider without redesigning the guard
integration surface.

## 6. Safe Data Policy

- No session token, access token, refresh token, or provider token is represented anywhere in
  `similarityAuthIntegrationDesignTypes.ts` or `similarityAuthIntegrationDesign.ts`.
- No email address is represented.
- No IP address is represented.
- No raw auth provider payload is represented.
- No cookies or request headers are read.
- No provider claims are placed into any API response.
- `stableSubjectId` may be placed into the guard request's `userId` field for internal guard
  evaluation only. `SimilarityApiResponse` (Phase 3EY-D) continues to drop `userId`, `role`, and
  `authState` from any API-facing payload — this phase does not change that sanitization boundary.

## 7. Future Activation Requirements

Before any real auth integration is implemented, the following must happen:

- Owner approval of this design.
- A provider decision (which of `supabase` / `custom` / `external` to activate).
- A concrete auth session lookup design (how a real subject is derived from a real session, in a
  future phase, without reading raw provider payloads into shared code).
- Owner approval of the beta/owner/admin role sources (e.g., manual allowlist vs. a future DB
  claim vs. a future env claim).
- A usage storage design and separate approval (Phase 3EZ-B).
- SQL/migration approval if a database-backed usage store or role claim source is chosen.
- Confirmation that the sanitized `SimilarityApiResponse` builder (Phase 3EY-D) remains the only
  API response boundary — no route may return a raw guard result or raw auth subject.
- KIS provider activation remains a separate, independently approved decision from auth
  integration.

## 8. Roadmap After 3EZ-A

- **3EZ-B** — Usage Storage Design and Approval
- **3EZ-C** — Authenticated Similarity API Route Shell with Feature Flag Off
- **3FA-A** — Owner-local KIS-normalized Similarity Execution Plan
- **3FA-B** — Owner-local KIS Similarity Smoke
- **3FB-A** — Limited Beta Readiness Review
