# Phase 3EY-C — Auth and Usage Guard Plan for Similarity Execution Result

## 1. Status

Prepared/Implemented — auth and usage guard planning/foundation added, no real auth or usage
runtime.

## 2. Background

- Phase 3EY-B verified the server-only KIS OHLC provider contract with a mocked adapter, using
  only synthetic already-normalized input.
- This phase adds the guard policy/foundation required before any future authenticated Chart
  Similarity API route can be built: role/access-state/usage/guard-result types, a
  disabled-by-default policy, a policy-first evaluator, and mocked evaluation fixtures.

## 3. Implemented Scope

- **Guard types** (`src/lib/server/chartSimilarity/similarityExecutionGuardTypes.ts`):
  `SimilarityExecutionRole`, `SimilarityExecutionAuthState`, `SimilarityExecutionUsageWindow`,
  `SimilarityExecutionGuardStatus`, `SimilarityExecutionPurpose`, `SimilarityExecutionSource`,
  `SimilarityExecutionGuardRequest`, `SimilarityExecutionUsageSnapshot`,
  `SimilarityExecutionGuardPolicy`, `SimilarityExecutionGuardResult`. No session token, access
  token, provider token, IP address, raw auth payload, or account/trading/KIS-credential field
  appears in any type.
- **Guard policy** (`similarityExecutionGuardPolicy.ts`): candidate feature flag name constants
  (`CHART_AI_SIMILARITY_EXECUTION_ENABLED`, `CHART_AI_SIMILARITY_AUTH_REQUIRED`,
  `CHART_AI_SIMILARITY_USAGE_GUARD_REQUIRED`) and `buildDefaultSimilarityExecutionGuardPolicy()`,
  which returns `enabled: false`, `requireAuth: true`, `requireUsageGuard: true`,
  `allowAnonymousMockedPreview: true`, `allowPublicKisExecution: false`,
  `allowOwnerLocalBypass: false`, and the four role daily limits. No `process.env` or `.env` read
  anywhere in this module.
- **Guard evaluator** (`similarityExecutionGuard.ts`): `normalizeSimilarityExecutionGuardRequest`,
  `buildUsageSnapshot`, `getRoleDailyLimit`, and `evaluateSimilarityExecutionGuard`. The
  evaluator validates the request shape first (symbol/market/assetType/purpose), then branches
  by `source` (`mocked`/`kis-normalized`/`owner-local`), applying the feature-disabled, auth, and
  usage-guard rules from the task contract. It never throws for expected bad input, never calls
  an auth provider, never reads a database or cache, never reads `process.env`/`.env`, and never
  persists or increments usage — it only evaluates a caller-supplied `options.usage` snapshot.
- **Mocked guard fixtures** (`mockedSimilarityExecutionGuardFixtures.ts`):
  `buildMockedAnonymousSimilarityGuardRequest`, `buildMockedAuthenticatedSimilarityGuardRequest`,
  `buildMockedBetaSimilarityGuardRequest`, `buildMockedOwnerSimilarityGuardRequest`,
  `buildMockedInvalidSimilarityGuardRequest`, and `buildMockedUsageSnapshot`. All fixture data is
  fixed and synthetic — fake user ids (`mock-user-authenticated`, `mock-user-beta`,
  `mock-user-owner`), a fake symbol, and a fixed ISO timestamp only. No real email, token, IP
  address, auth provider payload, or KIS data appears anywhere.
- **Public server exports** (`index.ts`): now also re-exports all guard types, the guard policy
  constants/function, the guard evaluator helpers, and the mocked guard fixtures, alongside all
  existing Phase 3EY-A/3EY-B exports unchanged. Not imported into any page/API route.
- **Runtime smoke verification**
  (`scripts/smoke_phase_3ey_c_auth_usage_guard_plan_for_similarity_execution.mjs`): copies
  `src/lib/server/chartSimilarity/**` and `src/lib/chartSimilarity/types.ts` into an OS temp
  directory, rewrites only the copies' relative import specifiers to add a `.ts` extension,
  executes the real code via Node's native TypeScript support, and asserts 30 numbered contract
  properties (default policy shape, role daily limits, mocked/kis-normalized/owner-local paths,
  invalid-request blocking, secret/token/auth-payload absence, and a `process.env` Proxy-based
  runtime check that guard evaluation never touches an environment variable). The temp directory
  is removed in a `finally` block.
- **Docs/changelog/package**: this planning document, this result document, a prepended
  `## Phase 3EY-C - 2026-07-03` changelog entry, `package.json` scripts
  `check:phase-3ey-c-auth-usage-guard-plan-for-similarity-execution` and
  `smoke:phase-3ey-c-auth-usage-guard-plan-for-similarity-execution`, and a new 91-check static
  checker
  `scripts/check_phase_3ey_c_auth_usage_guard_plan_for_similarity_execution_contract.mjs`.

## 4. Guard Policy

- **Enabled by default**: `false`.
- **Auth required**: `true`.
- **Usage guard required**: `true`.
- **Anonymous mocked preview**: allowed (`allowAnonymousMockedPreview: true`).
- **Public KIS execution**: disallowed (`allowPublicKisExecution: false`, a fixed type-level
  `false`).
- **Owner-local bypass**: disallowed by default (`allowOwnerLocalBypass: false`).
- **Role limits**: `defaultDailyLimit: 3`, `betaDailyLimit: 10`, `ownerDailyLimit: 50`,
  `adminDailyLimit: 100`.

## 5. Guard Contract Results

- **Anonymous mocked preview**: a `source: "mocked"` request from an anonymous caller returns
  `status: "allowed"`, `ok: true`, regardless of `policy.enabled`, as long as
  `allowAnonymousMockedPreview` is `true`.
- **KIS-normalized feature-disabled path**: a `source: "kis-normalized"` request returns
  `status: "feature_disabled"` whenever `policy.enabled` is `false`, for any role.
- **Auth-required path**: an unauthenticated (`role: "anonymous"` or `authState: "missing"` /
  `"anonymous"`) request against an enabled policy returns `status: "auth_required"`; this also
  applies to `owner-local` requests from a non-owner/non-admin, unauthenticated caller.
- **Missing usage not_configured path**: an authenticated request against an enabled policy with
  no usage snapshot supplied returns `status: "not_configured"`.
- **Usage-limited path**: a supplied usage snapshot with `used >= limit` (or `remaining <= 0`)
  returns `status: "usage_limited"`.
- **Allowed path**: an authenticated, enabled-policy request with a usage snapshot that has
  remaining quota returns `status: "allowed"`, `ok: true`.
- **Owner-local restriction**: a `source: "owner-local"` request from a non-owner/non-admin role
  is never `ok: true`; only `owner`/`admin` roles, with an enabled policy and a valid usage
  snapshot, can reach `status: "allowed"`.
- **Invalid request blocking**: an empty symbol, non-`KR` market, invalid `assetType`, or invalid
  `purpose` all return `status: "blocked"` with a structured `errorCode`, before any
  source-specific branching runs.
- **Secret/auth payload safety**: no evaluator result contains a token-like value, a raw auth
  provider payload marker, a KIS credential name, or an account/trading/order/balance field.

## 6. Preserved Boundaries

- No real auth runtime added.
- No usage persistence added.
- No Supabase auth import.
- No API route added or modified.
- No `/chart-ai` UI change.
- No KIS call made anywhere in this phase.
- No DB or cache runtime added.
- No SQL or migration run or added.
- No external AI call made or referenced.
- No public KIS data exposed; no `source=live`; no `source=auto` literal produced anywhere.
- No account/trading/order/balance API referenced.
- No Vercel env changes.
- No deployment performed.
- No `git push` performed.
- No dependency or devDependency changes.
- No actual/real market values used anywhere — mocked fixtures are fixed synthetic data only.
- No `.env`/`process.env` read — verified statically and via a runtime `process.env` Proxy check
  in the committed smoke script.

## 7. Validation

All required commands were run for real against the guard foundation and the preserved Phase
3EY-A/3EY-B foundation; results are recorded here after the full suite completed. The
30-assertion committed smoke script exercises the real TypeScript source through a
temp-directory copy with rewritten relative imports, and the 91-check static checker gates file
presence, contract shape, preserved-boundary phrasing, and allowed-changed-path scope. See the
final phase report for the itemized pass/fail list of every command in the required validation
suite, run in the exact specified order, including `npm run build` and `git diff --check`.

## 8. Recommended Next Phase

- **Recommended**: Phase 3EY-D — Auth/Usage Guard Contract and Mocked API Response Plan.
- **Alternative**: Phase 3EX-E — Similarity Result UI Owner Review and Polish.
