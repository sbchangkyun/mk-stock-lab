# Phase 3FD-A Real Supabase Auth Runtime Approval Package

## 1. Purpose

This is an approval and setup package only. It does not implement real Supabase Auth runtime for
the Chart Similarity feature. No runtime source file is changed, no package is installed, no real
Supabase client is created in this phase's scope, no environment variable value is read, no route
success path is enabled, and no live KIS call is made. This document exists so the owner can decide
whether to approve moving toward a later real Supabase Auth subject resolver implementation phase.

## 2. Current Position

- The guarded-runtime-scaffold route branch exists (Phase 3FC-H) and is route-recognized.
- The Phase 3FC-I owner-local mocked guarded route smoke passed (110/110 assertions) against the
  real route handlers.
- Phase 3FC-J prepared the manual QA checklist and productization boundary review.
- Real Supabase Auth is not implemented for the Chart Similarity feature.
- Real database persistence (role assignments, usage counters, usage events, feature flag audit)
  is not implemented for the Chart Similarity feature.
- Beta and public activation are not enabled.
- Live KIS is not connected.
- The Phase 3FC-C auth subject resolver scaffold, Phase 3FC-D role assignment resolver scaffold,
  Phase 3FC-E usage store scaffold, and Phase 3FC-F feature flag resolver scaffold remain
  disabled-by-default scaffolds with no real backing store or provider.

## 3. Approval Required Before Implementation

Before any real Supabase Auth implementation phase begins, the owner should approve:

- Using Supabase Auth as the real auth provider for the Chart Similarity feature.
- Using the already-present `@supabase/supabase-js` dependency, or installing any additional
  Supabase-related package, for this purpose.
- Candidate environment variable key names only, not values.
- The proposed server-side session resolution design (Section 5).
- The proposed cookie/header handling design (server-side only, never trusted from a client claim).
- The auth redaction policy (see the companion redaction and subject mapping policy document).
- The subject mapping policy connecting a real Supabase session to the existing Phase 3FC-C auth
  subject resolver contract.
- The feature-flag dependency rules already established in the Phase 3FC-B design (auth runtime
  and usage storage must both be enabled before beta; public requires beta to have passed its own
  gate first).
- The explicit non-goals in Section 4.

## 4. Explicit Non-Approvals

This phase does not approve:

- Installing, removing, or upgrading any package.
- Configuring or reading any environment variable value.
- Creating a real Supabase client anywhere in runtime source.
- Any route integration change to `/api/chart-ai/similarity` or `/chart-ai`.
- Enabling a route success path through the guarded branch.
- Any database schema or migration work.
- Real usage counter or usage event persistence.
- Real role assignment persistence.
- Beta or public activation.
- Live KIS connectivity.

## 5. Proposed Future Runtime Scope

Described here only as a plan for a later, separate phase — no runtime code is added in this phase:

- A server-only Supabase Auth subject resolver, implemented behind a feature flag
  (`AUTH_RUNTIME_ENABLED`) and disabled by default.
- The resolver would extend or replace the existing `similarityAuthSubjectResolver.ts` scaffold
  contract, not introduce an incompatible parallel contract.
- No route success would be granted by this module alone: the guarded route still requires role
  assignment, usage store, and feature flag gates to all agree before any success path is possible.
- No client-side role claim would ever be trusted; the server would resolve role/auth state itself.
- No token would ever be echoed back to the client; no raw session object would ever be returned.

## 6. Owner Decision Summary

- [ ] Approve proceeding to Phase 3FD-B (Real Supabase Auth Subject Resolver Implementation,
      Disabled by Default)
- [ ] Do not approve yet; continue documentation/manual QA
- [ ] Require changes to the proposed auth runtime design
- [ ] Hold
