# Phase 3FD-A Supabase Auth Runtime Implementation Plan

## 1. Purpose

This is a future implementation plan only. No runtime code is added in this phase. It describes
what a later, separately-approved implementation phase would build.

## 2. Target Future Module

- A real server-side auth subject resolver, likely an extension of (or a real-mode addition beside)
  the existing `src/lib/server/chartSimilarity/similarityAuthSubjectResolver.ts` scaffold.
- Disabled by default, gated behind `AUTH_RUNTIME_ENABLED`.
- Compatible with the existing Phase 3FC-C subject contract
  (`SimilarityAuthSubjectResolverResult`, `roleSeed: 'anonymous' | 'authenticated'`,
  `SimilarityAuthSubjectSafeRef`), so downstream role assignment and usage store modules do not need
  to change their input contract.
- Does not by itself grant route success — role assignment, usage store, and feature flag gates must
  all still agree.

## 3. Proposed Future Flow

1. An incoming request reaches the guarded route (`/api/chart-ai/similarity`).
2. The feature flag resolver checks whether `AUTH_RUNTIME_ENABLED` is on.
3. If enabled, a server-side auth runtime module extracts the session safely (server-side only,
   never trusting a client-supplied claim).
4. Supabase verifies or resolves the user session server-side.
5. The result maps to a safe internal subject reference (`SimilarityAuthSubjectSafeRef`), never a
   raw Supabase user id echoed to the client.
6. The role assignment resolver (Phase 3FC-D) later determines the subject's role from
   `role_assignments`, independent of the session itself.
7. The usage store (Phase 3FC-E) later checks the subject's usage quota.
8. The route still requires all of the above gates, plus the feature flag chain, to agree before any
   success path becomes possible.

## 4. Subject Mapping Policy

- No raw Supabase user id is echoed to the client in any route response.
- The subject reference returned to callers is an internal, safe reference
  (`SimilarityAuthSubjectSafeRef`), not the literal Supabase user id string.
- Email is never exposed in a route response.
- Provider metadata (OAuth provider details, raw claims) is never exposed in a route response.
- A client-supplied role claim is always ignored; only a warning is recorded, never trusted.

## 5. Failure Modes

| Failure mode | Safe route direction | Safe response category | Forbidden output |
| --- | --- | --- | --- |
| Missing session | Treated as anonymous | `anonymous` / feature-disabled shell | Any success status |
| Invalid session | `invalid_context` | Safe generic message | Raw error detail, stack trace |
| Expired session | Treated as anonymous or `invalid_context` | Safe generic message | Token expiry timestamp, raw token |
| Malformed cookie/header | `invalid_context` | Safe generic message | Raw cookie/header value |
| Supabase client unavailable | `disabled` / feature-disabled shell | Safe generic message | Client configuration detail, env value |
| Feature flag disabled | `disabled` (existing shell) | Existing feature-disabled response | Any implication that auth runtime is close to enabled |
| Redaction failure | Fail closed, block the response | Safe generic message | Partial leak of any forbidden field |

## 6. Validation Plan

For the future implementation phase:

- A static contract checker for the new module.
- An auth runtime smoke exercised against a mocked Supabase client only (no live Supabase call).
- A redaction smoke confirming no forbidden field ever appears in a serialized response.
- A no-env-echo check confirming no environment value is ever printed by the new module or its
  tests.
- Full regression of the existing guarded route branches (owner-local-mocked,
  owner-local-auth-usage-bridge, guarded-runtime-scaffold).
- `npm run build`.
- `git diff --check`.
- No live KIS call at any point in that phase's validation.

## 7. Future Phase Proposal

- **Recommended**: Phase 3FD-B — Real Supabase Auth Subject Resolver Implementation, Disabled by
  Default.
- **Alternative**: Phase 3FD-B-ALT — Supabase Auth Runtime Mocked Adapter First, No Real Supabase
  Call.
