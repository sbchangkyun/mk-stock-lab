# Phase 3FB-C-ALT — Auth/Usage Runtime Bridge for Similarity Route, No Live KIS Result

## 1. Status

Implemented. `POST /api/chart-ai/similarity` now has a second explicit, owner-local-only branch
that evaluates the existing `evaluateSimilarityExecutionGuard` against a caller-supplied mock
auth/usage request before allowing the Phase 3FB-A mocked, provider-compatible similarity
integration to run. Default `/chart-ai` and default route behavior are unchanged. The existing
Phase 3FB-B owner-local-mocked branch is unchanged. Live KIS remains disabled and was never
called. No real auth provider, no real usage storage, no DB/cache/SQL, no new dependency. No
deploy, no push.

## 2. Background

As of Phase 3FB-D, the owner-local mocked UI path on `/chart-ai` is hardened (response shape
guard, timeout/abort, in-flight guard, `aria-busy`, retry-ready state), but the API route itself
still only recognized one explicit owner-local-mocked request shape with no auth/usage evaluation
in front of it. This phase does not attempt live KIS or external network work — it instead
connects the existing, already-designed `evaluateSimilarityExecutionGuard` (Phase 3EY-C) to a real
server-side route execution flow for the first time, using caller-supplied mock auth/usage state
rather than a real session or usage store. This is a runtime-bridge phase, not another
planning-only, closeout-only, network-check, credential-check, or harness-only phase.

## 3. Implemented Scope

- `src/lib/server/chartSimilarity/similarityAuthUsageRouteBridgeTypes.ts` (new) — type foundation:
  `SimilarityAuthUsageBridgeMode/Source/AuthState/Role/UsageWindow/UsageRemainingBucket`,
  `SimilarityAuthUsageBridgeMockAuth/MockUsage/RequestBody/NormalizedRequest/Policy/Result`.
- `src/lib/server/chartSimilarity/similarityAuthUsageRouteBridge.ts` (new) — the bridge itself:
  `buildDefaultSimilarityAuthUsageRouteBridgePolicy`, `isOwnerLocalAuthUsageBridgeRequestBody`
  (shape check), `normalizeSimilarityAuthUsageBridgeRequestBody` (shape check plus
  `used <= limit` / `remaining <= limit` consistency check, returns `null` on failure),
  `mapBridgeRequestToSimilarityExecutionGuardRequest`, `mapBridgeUsageToGuardUsageSnapshot`,
  `runSimilarityAuthUsageRouteBridge` (validate → guard → mocked integration).
- `src/lib/server/chartSimilarity/mockedSimilarityAuthUsageRouteBridgeFixtures.ts` (new) — four
  deterministic fixtures: owner-allowed, anonymous-blocked, usage-limited, invalid (used > limit).
- `src/lib/server/chartSimilarity/similarityApiResponseTypes.ts` (modified) — added
  `'owner-local-auth-usage-bridge'` to `SimilarityApiResponseMode` and the new
  `SimilarityApiAuthUsageBridgeSuccessData` type to the `SimilarityApiResponse.data` union.
  Existing types/unions unchanged otherwise.
- `src/lib/server/chartSimilarity/similarityApiResponseBuilder.ts` (modified) — added
  `isOwnerLocalAuthUsageBridgeSimilarityApiRequestBody`, `mapAuthUsageBridgeApiStatusToHttpStatus`,
  `buildOwnerLocalAuthUsageBridgeSimilarityApiResponse`. Existing builders
  (`buildOwnerLocalMockedSimilarityApiResponse`, `isOwnerLocalMockedSimilarityApiRequestBody`, the
  feature-disabled shell path) are unchanged.
- `src/pages/api/chart-ai/similarity.ts` (modified) — added one additional `if` branch between the
  existing owner-local-mocked branch and the final default fallback, mutually exclusive by `mode`.
- `src/lib/server/chartSimilarity/index.ts` (modified) — exported the new bridge types, functions,
  fixtures, and response additions. No existing export removed.
- `scripts/smoke_phase_3fb_c_alt_auth_usage_runtime_bridge_for_similarity_route.mjs` (new) — 59
  assertions, esbuild-bundled real route handler test, no dev server, no live KIS.
- `scripts/check_phase_3fb_c_alt_auth_usage_runtime_bridge_for_similarity_route_contract.mjs`
  (new) — 76 static-text assertions across the new/modified files.
- `package.json` (modified) — added the two script lines above only.
- No change to `src/pages/chart-ai.astro`, `src/lib/server/providers/**`,
  `src/lib/chartSimilarity/**`, or `src/data/chartSimilarity/**`.

## 4. Auth/Usage Bridge Contract

- **Caller-supplied mock state only**: `mockAuth: { state, role }` and
  `mockUsage: { window, used, limit, remaining }` come directly from the request body — never a
  cookie, header, external auth provider, or `process.env` value.
- **Shape validation, then consistency validation, then guard**:
  `isOwnerLocalAuthUsageBridgeRequestBody` checks `mode`, `source`,
  `ownerLocalAuthUsageBridge: true`, and that `mockAuth`/`mockUsage` are shape-valid (enum values,
  non-negative integers). `normalizeSimilarityAuthUsageBridgeRequestBody` additionally requires
  `used <= limit` and `remaining <= limit`; either failure returns `null` and maps to a `blocked`
  result (`errorCode: 'invalid_bridge_request'`) **before** the guard is ever evaluated.
- **Guard evaluation**: the normalized request is mapped to the existing
  `SimilarityExecutionGuardRequest`/`SimilarityExecutionUsageSnapshot` shapes
  (`source: 'owner-local'`, deterministic `requestedAtIso`) and passed to the existing
  `evaluateSimilarityExecutionGuard`, using a bridge-local policy
  (`enabled: true`, `allowPublicKisExecution: false` — fixed by the guard policy type itself, so
  live/public execution can never be enabled through this bridge).
- **Execution only after `allowed`**: if the guard does not return `allowed`, the bridge returns a
  sanitized blocked/auth_required/usage_limited result without calling the integration. If
  `allowed`, it calls the existing Phase 3FB-A `runMockedProviderCompatibleSimilarityIntegration`
  and returns a sanitized, bucketed result (`usageRemainingBucket`: `'none' | 'low' | 'available' |
  'unknown'` — bucketed rather than exact numbers).
- **Policy fields fixed**: `ownerLocalOnly: true`, `allowLiveKis: false`,
  `allowPublicExecution: false`, `allowRealAuthProvider: false`, `allowUsagePersistence: false`,
  `allowRawProviderPayload: false`, `allowCredentialEcho: false`, `allowEnvEcho: false`,
  `allowAccountTradingFields: false`.

## 5. Route Contract

- New request shape (mutually exclusive with the existing owner-local-mocked shape by `mode`):
  `{ mode: "owner-local-auth-usage-bridge", source: "mocked-provider-compatible",
  ownerLocalAuthUsageBridge: true, symbol?, assetType?, mockAuth: { state, role }, mockUsage:
  { window, used, limit, remaining } }`.
- HTTP status mapping (`mapAuthUsageBridgeApiStatusToHttpStatus`): `success` → 200,
  `auth_required` → 401, `usage_limited` → 429, `feature_disabled` → 503 (unused on this branch),
  `blocked`/`not_configured`/`error` → 422.
- Default route behavior (no recognized owner-local body) is unchanged: `feature_disabled`, 503.
- The existing Phase 3FB-B owner-local-mocked branch (`mode: "owner-local-mocked"`) is unchanged
  and still reachable; the new branch only activates for the distinct new `mode` value.
- Malformed JSON still falls back safely to the default feature-disabled shell result.
- The `ALL` handler (non-POST) is unchanged.

## 6. Safe Response

- Success data (`SimilarityApiAuthUsageBridgeSuccessData`): `guardStatus`, `authState`, `role`,
  `usageWindow`, `usageRemainingBucket`, `engineStatus`, `normalizedBarsAvailable`,
  `normalizedBarCountBucket`, `matchCountBucket`, `disclaimer`, `dataPolicy` (five booleans).
- **Never included**: exact user id, session/access/refresh token, IP address, credential value,
  env value, raw usage store key, account/trading/order/balance field, raw provider payload, raw
  matches array, similarity scores, forward returns, OHLC values, volume, or real timestamps.
- Blocked/auth_required/usage_limited/invalid responses return `data: null` and a sanitized
  `error: { code, message, retryable }` — never a raw thrown error or raw guard/integration object.

## 7. Boundary Preservation

- `src/pages/chart-ai.astro` untouched — no UI change in this phase.
- `src/lib/server/providers/**`, `src/lib/chartSimilarity/**`, `src/data/chartSimilarity/**`
  untouched.
- No live KIS call, no `fetch` call, no `process.env`/`.env` read anywhere in the new code.
- No real external auth provider import (Supabase/Auth0/OAuth/NextAuth/Clerk/Firebase/Passport).
- No real usage DB/cache/SQL/migration added.
- No new dependency, no lockfile change.
- No public/live execution enabled — `allowPublicKisExecution: false` and `allowLiveKis: false`
  are fixed at the type level, not just the default value.
- Default route and default `/chart-ai` behavior unchanged; existing Phase 3FB-B path unchanged.
- No deployment, no push.

## 8. Validation

- `npm run check:phase-3fb-c-alt-auth-usage-runtime-bridge-for-similarity-route` — `PASS (76/76
  assertions passed)`.
- `npm run smoke:phase-3fb-c-alt-auth-usage-runtime-bridge-for-similarity-route` — `PASS (59/59
  assertions passed)`.
- `npm run check:phase-3fb-d-chart-ai-owner-local-mocked-ui-runtime-polish` — `PASS (67/67
  assertions passed)`, regression clean.
- `npm run check:phase-3fb-c-chart-ai-ui-owner-local-mocked-api-execution-wiring` — `PASS (49/49
  assertions passed)`, regression clean.
- `npm run smoke:phase-3fb-b-owner-local-mocked-similarity-api-route-integration` — `PASS (36/36
  assertions passed)`, regression clean.
- `npm run smoke:phase-3fb-a-provider-compatible-ohlc-to-similarity-engine-integration` — `PASS
  (35/35 assertions passed)`, regression clean.
- `npm run build` — passed.
- `git diff --check` — no diff errors (only expected LF/CRLF line-ending notices).
- Forbidden-path diff against `src/pages/chart-ai.astro src/lib/server/providers
  src/lib/chartSimilarity src/data/chartSimilarity` (relative to `54ebf44`) — no output.
- Changed-files diff (relative to `54ebf44`) — limited to the 12 allowed files.
- Live KIS smoke was not re-run. No network diagnostic was run.
- One first-time failure was found and fixed during implementation (not a repeated error): the
  route-dispatch shape check and the deep numeric-consistency check were the same function, so an
  internally-inconsistent usage snapshot (`used > limit`) never reached the bridge's intended
  `blocked` response and instead fell through to the unrelated default branch. Fixed by splitting
  shape validation (`isOwnerLocalAuthUsageBridgeRequestBody`, used for route dispatch) from
  cross-field consistency validation (moved into `normalizeSimilarityAuthUsageBridgeRequestBody`),
  matching the intended validation-before-guard design.

## 9. Implementation Implication

The similarity route can now be exercised end-to-end — request validation, auth/usage guard
evaluation, and mocked provider-compatible execution — through one real, server-only owner-local
path, without a real auth provider, real usage store, or live KIS. This gives the owner a concrete
way to locally verify guard behavior (allowed / auth_required / usage_limited / blocked) against
real route responses before any real auth/usage runtime is introduced. Live KIS reachability
remains a separate, external, unresolved concern outside this repository's control.

## 10. Recommended Next Phase

Phase 3FB-E — Wire the owner-local auth/usage bridge into a local-only, explicit opt-in `/chart-ai`
panel (mirroring the Phase 3FB-C/3FB-D gating pattern), so the bridge can be exercised from the
browser without a real auth provider or live KIS.

Alternative: Phase 3FB-F — Chart AI Owner-local Auth/Usage Bridge Manual QA and Productization
Boundary Review, Live KIS Off.
