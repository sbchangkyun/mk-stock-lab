# Phase 3FC-B Runtime Module Plan

## 1. Scope

This document is a future module plan only. No implementation, no new source file, and no
modification to any existing runtime file happens in this phase.

## 2. Proposed Modules

| Module | Purpose | Inputs | Outputs | Forbidden behavior | Future tests |
|---|---|---|---|---|---|
| Auth subject resolver | Resolve a real Supabase session into an internal auth subject id and auth state | Request/session context (server-only) | Subject id, auth state (`missing`/`anonymous`/`authenticated`) | Must never accept a client-supplied subject id or auth state as authoritative | Unit tests with fixture sessions; rejects malformed/missing session safely |
| Role resolver | Determine a subject's role from `role_assignments`, defaulting to `authenticated` | Subject id | Role (`anonymous`/`authenticated`/`beta`/`owner`/`admin`) | Must never accept a client-supplied role | Unit tests for default-role fallback and explicit-assignment lookup |
| Usage snapshot loader | Load the current daily/monthly usage counters for a subject/role | Subject id, role, window | Usage snapshot (`used`/`limit`/`remaining`/`resetAtIso`) | Must never fabricate a snapshot when the store is unavailable; must fail closed | Unit tests against fixture counters; failure-mode test for store unavailability |
| Usage incrementer | Atomically increment the usage counter and record a usage event after an allowed execution | Subject id, role, window, execution outcome | Updated counter confirmation, recorded event id | Must never increment before the guard returns `allowed`; must never double-increment on retry once an idempotency key is implemented | Unit tests for atomic increment under concurrent fixture calls; idempotency test |
| Feature flag resolver | Read flag values and enforce activation dependency rules (Section 9 of the main design doc) | Flag name | Boolean value, dependency-check result | Must never allow beta without auth+usage enabled; must never allow public without beta gate passed | Unit tests for each dependency rule combination |
| Route integration adapter | Wire the resolvers/store above into `/api/chart-ai/similarity` behind feature flags | Request body, resolved session | Route response (existing sanitized shape) | Must never change the existing default or owner-local-mocked/bridge branch behavior; must default to `feature-disabled` while flags are off | Integration test against fixtures, not a real Supabase project |
| Redaction/safe response verifier | Confirm no forbidden field (token, raw payload, account/trading data) appears in a built response | Response object | Pass/fail verification result | Must never itself log or persist a forbidden field it detects | Static assertion test against the existing safe-response contract |

## 3. Route Flow

```
POST /api/chart-ai/similarity
  -> parse request
  -> resolve auth subject
  -> resolve role
  -> load usage snapshot
  -> evaluate guard
  -> execute mocked/KIS-disabled provider-compatible path
  -> increment usage
  -> build sanitized response
```

This flow is additive: it becomes a third, flag-gated branch alongside the existing default and
owner-local-mocked/bridge branches, none of which change.

## 4. Failure Modes

| Failure mode | Expected handling |
|---|---|
| Missing session | Treated as `anonymous`; guard blocks execution per the approved anonymous policy (0/0, no execution) |
| Invalid session | Treated as `missing`/`anonymous`; never throws, never exposes the invalid session's contents |
| Role missing | Falls back to `authenticated` default for any valid session with no explicit assignment |
| Usage store unavailable | Fails closed (blocks execution) rather than assuming an empty/unlimited counter |
| Usage limit reached | Guard returns `usage_limited`; no execution; no increment |
| Feature flag disabled | Route falls back to the existing `feature-disabled` shell response |
| Execution failure | Safe error response returned; no partial/raw data leaked; usage increment behavior per Section 8 of the main design doc |
| Redaction failure | Verifier catches and blocks the response from being returned; treated as a release-blocking defect, not a warning |

## 5. Checker/Smoke Plan

Future checkers/smokes required before this implementation can be considered complete (none exist
yet; this is a plan only):

- A static contract checker for the auth subject resolver module (types/shape assertions against
  fixtures, no real Supabase call).
- A static contract checker for the usage store interface and its fixtures.
- A smoke script exercising the full route flow (Section 3) against fixtures only, with all
  feature flags forced to their default `false` values to confirm no behavior change until flags
  are explicitly enabled in a test context.
- A smoke script specifically exercising each failure mode in Section 4.
- A redaction static checker re-run against the new route branch's response shape, mirroring the
  existing safe-response checks already used for the Phase 3FB-C-ALT bridge.
- A regression run of every existing Phase 3FB-series checker/smoke to confirm no drift in the
  default or owner-local branches.
