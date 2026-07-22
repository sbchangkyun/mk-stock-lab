# Phase 3FC-G — Guarded Route Integration Plan Refresh

## 1. Status

This phase is documentation-only. No runtime source was changed. There is no route integration,
no UI integration, no real Supabase runtime, no real database, no environment or Vercel
environment variable read, no live KIS call, and no deploy or push.

## 2. Current Scaffold Inventory

- **Phase 3FC-C — auth subject resolver.** Purpose: resolve an auth subject (anonymous,
  authenticated, beta, owner, admin) from an explicit mocked input only. Current capability:
  deterministic mocked resolution and a safe result summary. Current limitation: never reads a
  real Supabase session, cookie, or header. Not wired into the route or UI.
- **Phase 3FC-D — role assignment resolver.** Purpose: resolve a role assignment from an explicit
  mocked input, independent of the auth subject resolver. Current capability: deterministic mocked
  role resolution with a safe result summary. Current limitation: never reads a real role
  database. Not wired into the route or UI.
- **Phase 3FC-E — usage store interface.** Purpose: model a usage snapshot (daily/monthly counters
  against the approved role limits) and a usage increment operation, from explicit mocked input
  only. Current capability: deterministic mocked snapshot/increment evaluation. Current
  limitation: never reads or writes a real usage database. Not wired into the route or UI.
- **Phase 3FC-F — feature flag resolver.** Purpose: resolve the five approved feature flag keys
  and their dependency gates from explicit mocked input only. Current capability: deterministic
  mocked flag/gate resolution; `routeSuccessAllowed`, `betaExecutionAllowed`,
  `publicExecutionAllowed`, and `liveKisAllowed` are always false regardless of dependency state.
  Current limitation: never reads a real environment variable, Vercel environment variable, or
  real feature flag database. Not wired into the route or UI.

All four scaffolds are independent, deterministic, mocked-fixture-testable modules exported from
`src/lib/server/chartSimilarity/index.ts`. None of them is imported by
`src/pages/api/chart-ai/similarity.ts` or `src/pages/chart-ai.astro`.

## 3. Existing Route Boundary

`src/pages/api/chart-ai/similarity.ts` currently dispatches on exactly two guarded request-body
discriminators before falling back to the default shell:

- `isOwnerLocalMockedSimilarityApiRequestBody` — the Phase 3FB-B owner-local mocked branch, calling
  `buildOwnerLocalMockedSimilarityApiResponse`.
- `isOwnerLocalAuthUsageBridgeSimilarityApiRequestBody` — the Phase 3FB-C-ALT owner-local
  auth/usage bridge branch, calling `buildOwnerLocalAuthUsageBridgeSimilarityApiResponse`.
- Any other request body, and the `ALL` handler for any non-`POST` method, falls back to
  `buildSimilarityApiRouteShellResult({})`, the existing default feature-disabled shell.

No 3FC-C/D/E/F scaffold module is imported by this route file today. This plan does not propose
changing that in this phase.

## 4. Future Guarded Route Branch Concept

A later, separately implemented phase may add a third guarded request-body discriminator. This
section defines the concept only; it is not implemented here.

- Suggested future branch name: `guarded-runtime-scaffold`.
- Suggested future request mode: `mode: "guarded-runtime-scaffold"`.
- This is planning only — the exact request body shape may be refined during the implementation
  phase.
- The future branch must be mutually exclusive from the existing owner-local mocked and
  owner-local auth/usage bridge branches, using its own distinct discriminator.
- The future branch must remain disabled (falling through to the default feature-disabled shell)
  unless the feature flag resolver's gates and the required owner approvals allow it.

## 5. Proposed Future Route Flow

The following sequence describes the intended future guarded route branch. It is a plan, not an
implementation:

```
POST /api/chart-ai/similarity
  -> parse and validate request
  -> resolve feature flags
  -> if route success not allowed, return existing feature-disabled shell
  -> resolve auth subject
  -> resolve role assignment
  -> load usage snapshot
  -> evaluate existing execution guard
  -> if not allowed, return safe blocked/auth_required/usage_limited response
  -> run mocked provider-compatible similarity integration only
  -> build sanitized response
  -> record mocked/no-op usage increment only in scaffold phase
  -> return sanitized response
```

Important constraints on this future flow:

- Live KIS must not be part of this route branch yet.
- A raw provider payload must never be returned to the caller.
- Account, trading, order, and balance APIs remain out of scope entirely.

## 6. Feature Flag Gate Rules

- `AUTH_RUNTIME_ENABLED` gates whether auth runtime is available to the future guarded branch.
- `USAGE_STORAGE_ENABLED` gates whether usage snapshot/increment is available to the future
  guarded branch.
- `CHART_AI_SIMILARITY_BETA_ENABLED` gates beta route eligibility.
- `CHART_AI_SIMILARITY_PUBLIC_ENABLED` remains not approved for activation.
- `LIVE_KIS_OHLC_ENABLED` remains not approved for activation.
- Route success remains false until a later implementation phase explicitly changes this policy
  with separate owner approval.
- A beta route requires auth runtime, usage storage, and the beta flag all satisfied
  (`betaDependenciesSatisfied` from the Phase 3FC-F contract).
- A public route requires the beta dependency chain satisfied plus separate public approval
  (`publicDependenciesSatisfied`).
- Live KIS must remain gated separately from the beta/public approval chain; it is never unlocked
  by the beta or public flags alone.

## 7. Safe Failure Mapping

| Failure point | Future route condition | Safe response direction | Notes |
| --- | --- | --- | --- |
| Feature flags disabled | `routeSuccessAllowed` false | existing feature-disabled shell | current default behavior, unchanged |
| Auth missing | `AUTH_RUNTIME_ENABLED` gate not ready or no subject resolved | `auth_required`-style safe response | no session/token echoed |
| Invalid auth subject | auth subject resolver returns an invalid/unrecognized subject | `auth_required`-style safe response | no raw subject id echoed |
| Role assignment unavailable | role resolver cannot resolve a role | safe blocked response | no role DB error detail exposed |
| Anonymous role | resolved role is anonymous | `auth_required`-style safe response | anonymous has 0/day, 0/month by design |
| Usage store unavailable | usage snapshot cannot be loaded | safe blocked response | no raw DB error detail exposed |
| Usage limit reached | usage snapshot shows daily/monthly limit reached | `usage_limited`-style safe response | no quota internals beyond bucketed counts |
| Execution guard blocked | `evaluateSimilarityExecutionGuard` returns not-allowed | safe blocked response | reuses the existing guard contract |
| Provider-compatible mocked integration failure | mocked integration throws or returns invalid data | safe blocked response, falls back to default shell | never a raw error stack in the response |
| Redaction failure | sanitization step cannot guarantee a safe result | safe blocked response | fail closed, never return unredacted data |
| Live KIS requested too early | request implies live KIS before `LIVE_KIS_OHLC_ENABLED` approval | safe blocked response | `live_kis_activation_not_approved` warning class |
| Public flag requested too early | request implies public exposure before public approval | safe blocked response | `public_activation_not_approved` warning class |

## 8. Redaction and Response Policy

- No raw Supabase subject id is ever echoed.
- No auth tokens are ever included in a response.
- No raw session object is ever included in a response.
- No environment variable value is ever included in a response.
- No KIS credential is ever included in a response.
- No raw KIS payload is ever included in a response.
- No OHLC price, volume, or timestamp field sourced from live KIS is ever included in a response.
- No raw similarity score or return value is exposed unless a separate, future phase explicitly
  approves that exposure for the UI.
- No account, trading, order, or balance data is ever included in a response.
- Only safe, bucketed, sanitized response fields may be returned.

## 9. Usage Increment Policy

- The scaffold route (this phase and Phase 3FC-H) must not persist any usage increment.
- A future real route implementation must increment usage only after the allowed execution path
  reaches the agreed point in the flow (after a successful, sanitized similarity result is
  produced).
- A real implementation requires an atomic transaction or a conditional update to avoid
  double-counting concurrent requests.
- A real implementation requires an idempotency strategy so that client retries do not
  double-increment usage.
- Blocked, `auth_required`, and `usage_limited` responses must never decrement or consume quota.
- Audit-only blocked events may be considered for future observability, but that is a separate,
  later decision.

## 10. Route Non-Regression Requirements

A later implementation phase must preserve all of the following:

- The default feature-disabled behavior remains the fallback unless the exact future guarded
  request shape is supplied.
- The owner-local mocked branch (`isOwnerLocalMockedSimilarityApiRequestBody`) remains unchanged.
- The owner-local auth/usage bridge branch (`isOwnerLocalAuthUsageBridgeSimilarityApiRequestBody`)
  remains unchanged.
- The `/chart-ai` public sample behavior remains unchanged.
- The existing local-only query gates remain unchanged.
- No auto-run behavior is introduced.

## 11. Validation Plan Before Route Code Change

Before any route source file is changed in a future implementation phase, the following must run
and pass:

- All Phase 3FC-C/3FC-D/3FC-E/3FC-F checkers and smokes.
- The Phase 3FC-B and Phase 3FC-A checkers.
- The full 3FB route/UI regression suite (owner-local mocked, owner-local auth/usage bridge,
  manual QA/productization boundary checks).
- `npm run build`.
- `git diff --check`.
- A forbidden-path diff review against the pre-change commit.
- A redaction review of every new response branch.
- A route branch mutual-exclusion review confirming no branch can be accidentally triggered by
  another branch's request shape.

## 12. Actual KIS API Connection Stage

- Actual KIS API connection is not part of Phase 3FC-G.
- Actual KIS route integration is not part of the next route scaffold phase (Phase 3FC-H).
- Prior KIS work surfaced an external/network reachability blocker, not a confirmed repository
  source defect.
- The owner must confirm outbound network reachability to the KIS host before any live KIS retry.
- Live KIS retry requires explicit, separate approval from this phase's approval.
- Live KIS must remain owner-local and redacted until the beta/public safety gates described above
  are complete.
- Live KIS must never be enabled by the beta or public flags alone.
- `LIVE_KIS_OHLC_ENABLED` remains false until a separate activation approval is given.

Recommended KIS sequence:

1. KIS-0: owner/network TCP reachability confirmation outside the app runtime.
2. KIS-1: owner-local redacted live KIS reachability recheck, separately approved.
3. KIS-2: owner-local redacted OHLC provider smoke, no route/UI change.
4. KIS-3: provider-compatible live OHLC adapter review, no public route.
5. KIS-4: guarded route integration behind `LIVE_KIS_OHLC_ENABLED`, owner-local/beta only.
6. KIS-5: public consideration only after legal/disclaimer, monitoring, abuse, data retention, and
   rollback review, plus owner approval.

## 13. Recommended Next Phase

- **Recommended**: Phase 3FC-H — Guarded Route Integration Scaffold, All Flags Off, No Live KIS.
- **Alternative**: Phase 3FC-H-ALT — Real Supabase/Auth/Usage Implementation Approval Package, No
  Runtime Change.
