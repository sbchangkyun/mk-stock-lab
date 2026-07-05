# Phase 3FC-H Guarded Route Integration Scaffold Contract

## 1. Purpose

This phase adds the first guarded route integration scaffold branch to the Chart Similarity API
route (`src/pages/api/chart-ai/similarity.ts`) while keeping every runtime gate off. The branch
recognizes a single, exact future request discriminator and composes with the Phase 3FC-F feature
flag resolver in a safe, all-flags-off configuration. No real Supabase, no real database, no live
KIS, no beta activation, and no public activation are introduced by this phase. No provider
execution and no successful route result can occur through the new branch.

## 2. Request Discriminator

An exact-match request body is recognized only when all three fields match precisely:

- `mode: "guarded-runtime-scaffold"`
- `source: "mocked-provider-compatible"`
- `guardedRuntimeScaffold: true`

A partial body (missing any of the three fields) or a malformed body (wrong literal value for any
field) never matches. The discriminator does not collide with the existing owner-local-mocked or
owner-local-auth-usage-bridge discriminators, since all three use distinct `mode` values.

## 3. Route Behavior

The route now recognizes three mutually exclusive branches, in this order:

1. Owner-local mocked (`mode: "owner-local-mocked"`) — unchanged from Phase 3FB-B.
2. Owner-local auth/usage bridge (`mode: "owner-local-auth-usage-bridge"`) — unchanged from Phase
   3FB-C-ALT.
3. Guarded runtime scaffold (`mode: "guarded-runtime-scaffold"`) — new in this phase.

The new branch calls `runSimilarityGuardedRouteScaffold` only to confirm safe blocked/disabled
handling. It never returns a new response shape and never exposes the scaffold result to the
client: regardless of what the scaffold module computes, the route always falls back to the
existing sanitized feature-disabled shell response
(`buildSimilarityApiRouteShellResult`). All non-POST requests and the default POST shape remain
unchanged.

## 4. Scaffold Composition

`runSimilarityGuardedRouteScaffold` composes with the Phase 3FC-F feature flag resolver
(`resolveSimilarityFeatureFlags`) using the default, all-flags-off feature flag policy. It does not
call the Phase 3FC-C auth subject resolver, the Phase 3FC-D role assignment resolver, or the Phase
3FC-E usage store in this phase — those statuses are reported as `auth_not_evaluated`,
`role_not_evaluated`, and `usage_not_evaluated` placeholders, ready for a later composition phase.
It never invokes the mocked provider-compatible similarity integration and never calls the
deterministic similarity engine.

## 5. All-Flags-Off Policy

`SimilarityGuardedRouteScaffoldPolicy` fixes `allowRouteSuccess`, `allowMockedProviderExecution`,
`allowLiveKis`, `allowRealSupabase`, `allowRealDb`, `allowEnvRead`, `allowCookieRead`,
`allowHeaderAuthRead`, `allowPublicExecution`, and `allowBetaExecution` to the literal type `false`.
The default policy also sets `enabled: false` and `allowRouteBranchRecognition: false`. A
route-recognized policy variant sets `enabled: true` and `allowRouteBranchRecognition: true` for
composition readiness, but every other capability boolean remains false — no policy configuration
in this phase can produce a route success.

## 6. Safe Disabled Response

`runSimilarityGuardedRouteScaffold` always returns one of: `invalid_request` (non-exact-match
body), `disabled` (scaffold policy not enabled), or `feature_flag_blocked` (branch recognized but
feature flags remain off). `routeSuccessAllowed` and `liveKisAllowed` are always `false` in the
returned summary, and `providerStatus` is always `mocked_provider_not_invoked`. No usage increment
is recorded. The HTTP-facing route response is always the existing feature-disabled shell,
independent of the scaffold's internal status.

## 7. Preserved Existing Branches

The owner-local-mocked and owner-local-auth-usage-bridge branches are unchanged: their guard
conditions, response builders, and status-to-HTTP mappings are untouched by this phase. The
Phase 3FC-G checker's assertion that the route has exactly two dispatch branches
(`dispatchBranchMatches.length === 2`) is superseded by this phase's intentional addition of a
third branch; it is no longer a gating regression and should not be run as one. The Phase 3FC-H
checker instead asserts the route now has exactly three dispatch branches.

## 8. Security Boundary

This scaffold never reads `process.env`, `import.meta.env`, a Vercel environment variable, `.env`,
a cookie, or a request header. It never imports a Supabase package, never calls `createClient`,
never calls `fetch`, never references a KIS provider module, and never contains SQL or migration
references. It never exposes an access token, refresh token, JWT, secret, credential, raw session,
raw payload, raw KIS field, account/trading/balance field, raw price, or raw volume value. No
public or beta route success is possible through this branch.

## 9. Future Integration

A later phase (Phase 3FC-I) will exercise this exact branch with mocked fixtures only, still with
no live KIS. Real Supabase, real database, beta, and public activation each require a separate,
later, explicitly approved phase, as described in
`docs/planning/phase_3fc_g_chart_ai_remaining_roadmap_and_kis_stage_v0.1.md`.
