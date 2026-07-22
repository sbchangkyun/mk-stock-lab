# Phase 3EZ-C — Authenticated Similarity API Route Shell with Feature Flag Off Result

## 1. Status

Implemented — route shell added, feature flag off, no real auth/usage storage/KIS runtime.

## 2. Background

- Phase 3EZ-B defined the storage-agnostic usage storage design
  (`similarityUsageStorageDesign.ts`) and required explicit API route approval before any route
  may read or write usage.
- This phase adds that route — as a shell only, disabled by default, before any real auth or
  usage storage backend exists.

## 3. Implemented Scope

- Added `src/lib/server/chartSimilarity/similarityApiRouteShellTypes.ts` defining
  `SimilarityApiRouteShellStatus`, `SimilarityApiRouteShellPolicy`, `SimilarityApiRouteShellRequest`,
  and `SimilarityApiRouteShellResult`. No user id, role, auth state, session/access/provider
  token, email, IP address, request header, cookie, raw auth provider payload, KIS credential,
  account/trading field, DB/cache connection string, or SQL string is present in any of these
  types.
- Added `src/lib/server/chartSimilarity/similarityApiRouteShell.ts` with:
  - `buildDefaultSimilarityApiRouteShellPolicy` — a pure default policy (`enabled: false`,
    `featureFlagName: 'CHART_AI_SIMILARITY_ROUTE_ENABLED'`, `requireAuth: true`,
    `requireUsageStorage: true`, `allowMockedSuccess: false`, `allowLiveKisExecution: false`,
    `allowPublicExecution: false`).
  - `normalizeSimilarityApiRouteShellRequest` — a pure, never-throwing request normalizer that
    defaults `symbol` to `'UNKNOWN'`, `source` to `'kis-normalized'`, `market` to `'KR'`, and
    `assetType` to `'stock'`, and only accepts `source` values `'mocked'`/`'kis-normalized'`/
    `'owner-local'` (never `'live'` or `'auto'`).
  - `buildFeatureFlagOffSimilarityApiRouteShellResult` — always returns `httpStatus: 503` and a
    sanitized `SimilarityApiResponse` with `ok: false`, `status: 'feature_disabled'`,
    `mode: 'feature-flag-off'`, `data: null`, and a safe error object. Built directly rather than
    delegated to `evaluateSimilarityExecutionGuard`, because the guard's default policy still
    allows an anonymous mocked preview to succeed for `source: 'mocked'` — a success path this
    route shell must never reach in this phase.
  - `buildSimilarityApiRouteShellResult` — calls the feature-flag-off builder when
    `policy.enabled` is `false` (the only reachable state in this phase); if `enabled` becomes
    `true` in a future phase, falls back to a safe `not_configured` / `provider-deferred`
    response rather than any success path.
- Added `src/pages/api/chart-ai/similarity.ts`: a server-side-only Astro `POST` route
  (`prerender = false`) that parses the request body defensively (malformed JSON never crashes
  the route), delegates to `buildSimilarityApiRouteShellResult`, and returns
  `Content-Type: application/json; charset=utf-8` and `Cache-Control: no-store`. Any other HTTP
  method resolves to the same safe feature-disabled response via the `ALL` export.
- Updated `src/lib/server/chartSimilarity/index.ts` to export the new route shell types, policy
  builder, request normalizer, and result builders. No import of this server module was added to
  any `/chart-ai` UI file.
- Added
  `docs/planning/phase_3ez_c_authenticated_similarity_api_route_shell_feature_flag_off_v0.1.md`
  (planning) and this result document.
- Added
  `scripts/check_phase_3ez_c_authenticated_similarity_api_route_shell_feature_flag_off_contract.mjs`
  and a matching `package.json` script entry.
- Prepended a Phase 3EZ-C entry to `docs/planning/planning_changelog.md`.

## 4. Route Contract Results

- `POST /api/chart-ai/similarity` always returns `httpStatus: 503` in this phase.
- Response shape: `ok: false`, `status: 'feature_disabled'`, `mode: 'feature-flag-off'`,
  `data: null`, `error: { code: 'feature_disabled', message, retryable: false }`, matching the
  existing Phase 3EY-D `SimilarityApiResponse` contract exactly.
- Headers: `Content-Type: application/json; charset=utf-8`, `Cache-Control: no-store`.
- Non-`POST` methods resolve to the identical safe feature-disabled response with no side effects.
- No route path other than `/api/chart-ai/similarity` was added.

## 5. Preserved Boundaries

- No real auth runtime was added. No Supabase, Auth0, OAuth, NextAuth, Clerk, Firebase, or
  Passport import was added.
- No usage storage implementation was added.
- No DB/cache runtime was added. No Supabase, Redis, Upstash, Turso, Prisma, or Drizzle import was
  added.
- No SQL file or migration was added or run.
- No KIS call was made. No `src/lib/server/providers/kis/**` or `kisClient` import was added.
- No live similarity execution occurred; the real similarity engine
  (`src/lib/chartSimilarity/**`) was not imported or called.
- No UI change was made in this phase; no `/chart-ai` UI file was touched.
- No Vercel env change was made. No deployment was performed. No push was performed.
- No dependency or devDependency was added.
- No `.env` or `process.env` value was read in this phase.
- No account/trading/order/balance API was referenced.
- No public KIS data, `source=live`, or `source=auto` literal was introduced.

## 6. Validation

The full required validation suite (the new Phase 3EZ-C static checker, the established Phase
3EZ-B / 3EZ-A / 3EX-E / 3EY-D / 3EY-C / 3EX-C / 3EW-C / 3EW-B / 3EW-A / 3EV-B / 3EV-A
checkers/smokes, `check:provider-boundaries`, `check:kis-runtime-guard`,
`check:kis-error-fallback`, `check:production-domain`, `npm run build`, and `git diff --check`) was
run in the specified order. See the final phase report for the itemized pass/fail list of every
command.

## 7. Known Non-gating Notes

- `check:phase-3ez-b`, `check:phase-3ez-a`, `check:phase-3ex-e`, `check:phase-3ey-d`, and
  `check:phase-3ey-c` contain historical allowed-changed-path assertions scoped only to files
  known at their own authoring time; they do not account for this phase's new
  `src/pages/api/chart-ai/similarity.ts` route file or new `src/lib/server/chartSimilarity/`
  files, and are expected to show a non-gating "allowed changed files" failure as a result.
- These historical checks remain useful for validating their own phase's other invariants and are
  not treated as gating for this phase.

## 8. Roadmap

- **3FA-A** — Owner-local KIS-normalized Similarity Execution Plan
- **3FA-B** — Owner-local KIS Similarity Smoke
- **3FB-A** — Limited Beta Readiness Review

## 9. Recommended Next Phase

- **Recommended**: Phase 3FA-A — Owner-local KIS-normalized Similarity Execution Plan.
- **Alternative**: Phase 3EX-E-OWNER-RUNTIME-CHECK — Owner Runtime Check of Polished Chart
  Analysis Workspace.
