# Phase 3FC-G Route Contract Matrix

## 1. Purpose

This document is a future route integration matrix only. It records the current
`/api/chart-ai/similarity` branches as they exist today and proposes the shape of a future guarded
branch. No route source is changed by this document.

## 2. Current Route Branches

| Branch | Request discriminator | Current status | Data source | Auth/usage behavior | KIS behavior | Response safety |
| --- | --- | --- | --- | --- | --- | --- |
| Default feature-disabled shell | any body not matching a guarded discriminator, or any non-`POST` method | active, default | none | none — feature reported as disabled | none | sanitized disabled response only |
| Owner-local mocked | `mode: "owner-local-mocked"`, `source: "mocked-provider-compatible"`, `ownerLocalMocked: true` | active, owner-local only | mocked provider-compatible integration | none (no auth/usage check) | none — mocked data only | sanitized, bucketed mocked result |
| Owner-local auth/usage bridge | `mode: "owner-local-auth-usage-bridge"`, `source: "mocked-provider-compatible"`, `ownerLocalAuthUsageBridge: true`, `mockAuth`, `mockUsage` | active, owner-local only | mocked auth/usage state supplied by caller, evaluated by the existing execution guard | mocked auth/usage guard evaluation, not real persistence | none — mocked data only | sanitized, bucketed mocked result or guard-blocked response |

## 3. Future Branch Proposal

| Field | Value |
| --- | --- |
| Branch name | `guarded-runtime-scaffold` |
| Request discriminator | `mode: "guarded-runtime-scaffold"` (exact shape to be finalized in the implementation phase) |
| Required flags | `AUTH_RUNTIME_ENABLED`, `USAGE_STORAGE_ENABLED` at minimum; `CHART_AI_SIMILARITY_BETA_ENABLED` for beta eligibility |
| Required auth | a resolved, non-anonymous auth subject via the Phase 3FC-C resolver |
| Required role | a resolved role assignment via the Phase 3FC-D resolver |
| Required usage snapshot | a loaded usage snapshot via the Phase 3FC-E usage store, evaluated against role limits |
| Expected response categories | feature-disabled, auth required, usage limited, blocked, mocked success, malformed request |
| Live KIS | still no live KIS in this branch — mocked provider-compatible integration only |

## 4. Future Response Mapping

| Route case | HTTP status direction | API status direction | Safe data fields | Forbidden fields |
| --- | --- | --- | --- | --- |
| Feature disabled | 200 | `disabled` | feature flag summary only | any flag secret/env value |
| Auth required | 401 or 200 with an `auth_required` status, per existing convention | `auth_required` | safe subject-state summary only | raw subject id, token, session |
| Usage limited | 200 with a `usage_limited` status | `usage_limited` | bucketed remaining/limit counts | raw usage row identifiers |
| Blocked | 200 with a `blocked` status | `blocked` | safe reason code | raw guard internals |
| Mocked success | 200 | `ok` | sanitized, bucketed similarity result | raw provider payload, raw score internals not approved for exposure |
| Malformed request | 422 | `invalid_request`-style status | safe validation summary | raw request echo |
| Redaction failure | 200 with a safe blocked status (fail closed) | `blocked` | none beyond a safe reason code | any unredacted field |
| Live KIS requested too early | 200 with a safe blocked status | `blocked` | `live_kis_activation_not_approved`-style reason code | any live KIS field |

## 5. Mutual Exclusion Rules

- The owner-local mocked path remains exact-match only on its three discriminator fields.
- The owner-local auth/usage bridge path remains exact-match only on its five discriminator
  fields.
- The future guarded runtime path must have its own exact discriminator, distinct from both
  existing paths.
- Partial or malformed matches against any discriminator must fall back to the blocked or
  feature-disabled response, never to another branch.
- No branch may auto-upgrade a request intended for another branch.

## 6. Regression Requirements

- The owner-local mocked branch's existing smoke (`smoke:phase-3fb-b-owner-local-mocked-similarity-api-route-integration`)
  must continue to pass unchanged.
- The owner-local auth/usage bridge branch's existing smoke
  (`smoke:phase-3fb-c-alt-auth-usage-runtime-bridge-for-similarity-route`) must continue to pass
  unchanged.
- The `/chart-ai` UI regression checks (Phase 3FB-D, 3FB-E, 3FB-F) must continue to pass unchanged.
- The default feature-disabled shell's dispatch-branch count must remain exactly the current count
  until a future phase deliberately adds the guarded runtime branch.
- Any future branch addition must be validated against this matrix before implementation.
