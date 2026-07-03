# Phase 3EY-C — Auth and Usage Guard Plan for Similarity Execution v0.1

## 1. Purpose

This phase defines the future auth/usage guard contract for Chart Similarity execution without
implementing real authentication, usage storage, an API route, or live KIS execution. It adds a
server-only, disabled-by-default, policy-first guard evaluator that a later, separately
authorized phase can wire in front of an authenticated Chart Similarity API route.

## 2. Current State

- Phase 3EX-D integrated a mocked "유사 패턴 분석" (similar pattern analysis) result UI into
  `/chart-ai`, using the deterministic chart similarity engine (Phase 3EX-B/3EX-C) run against
  synthetic fixture data only.
- Phase 3EY-A added the server-only KIS OHLC provider foundation
  (`src/lib/server/chartSimilarity/kisOhlcProviderTypes.ts`, `kisOhlcProviderPolicy.ts`,
  `serverOnlyKisOhlcProvider.ts`), disabled by default and returning `disabled`/`not_implemented`
  only.
- Phase 3EY-B added a mocked adapter / test harness (`mockedKisOhlcAdapter.ts`,
  `mockedKisOhlcFixtures.ts`) that verified the same request/normalize/validate/adapt contract
  end to end with synthetic, already-normalized input, with a committed runtime smoke script and
  static checker.
- Live KIS execution remains feature-flag off. No authenticated Chart Similarity API route
  exists. No auth runtime, usage guard runtime, or DB/cache runtime exists anywhere in the
  Chart Similarity track.

## 3. Guard Boundary

- Server-only planning/foundation: all new code lives under
  `src/lib/server/chartSimilarity/`, never under `src/pages/` or `src/pages/api/`.
- No real auth provider is imported or called — no Supabase auth, no OAuth provider, no session
  lookup.
- No usage persistence — the evaluator only evaluates a caller-supplied usage snapshot; it never
  reads or writes a store.
- No DB or cache runtime is added.
- No API route is added or modified.
- No `/chart-ai` UI change is made.
- No KIS call is made, and no public KIS execution path is enabled by this phase
  (`allowPublicKisExecution` is a fixed `false` in the policy type).

## 4. Access Model

Five roles are defined: `anonymous`, `authenticated`, `beta`, `owner`, `admin`.

Intended access, once real execution is later authorized:

- **anonymous** may see the mocked preview only (`source: "mocked"`); it can never reach
  `kis-normalized` or `owner-local` execution.
- **authenticated** may later run limited similarity execution, but only after the feature flag,
  auth check, and usage guard all pass.
- **beta** may have a higher daily limit than the default authenticated limit, for an
  owner-controlled beta cohort.
- **owner**/**admin** may have higher limits still, but there is no public bypass — even the
  owner/admin roles are still subject to the feature flag and (for `owner-local`) an explicit
  auth check.
- `owner-local` execution remains restricted to the `owner`/`admin` roles unless a future,
  separately authorized phase changes that.

## 5. Usage Model

- A daily (or monthly) usage window is modeled via `SimilarityExecutionUsageWindow`.
- Proposed default daily limits: `defaultDailyLimit: 3`, `betaDailyLimit: 10`,
  `ownerDailyLimit: 50`, `adminDailyLimit: 100`.
- The guard evaluator in this phase only **evaluates** a usage snapshot supplied by the caller
  (`options.usage`) — it never increments, decrements, or persists usage anywhere.
- A future, separately approved phase must design and implement real usage storage (DB/cache)
  before any authenticated route can rely on this guard for real quota enforcement.

## 6. Guard Result Model

`SimilarityExecutionGuardStatus` has seven values:

- `allowed` — request may proceed.
- `blocked` — the request itself is structurally invalid (bad symbol/market/assetType/purpose).
- `auth_required` — the caller is unauthenticated (or insufficiently privileged) for the
  requested source.
- `usage_limited` — the supplied usage snapshot shows no remaining quota.
- `feature_disabled` — the relevant execution path is off by policy (`policy.enabled` is
  `false`).
- `not_configured` — a usage guard is required by policy but no usage snapshot was supplied.
- `error` — reserved for a future phase's unexpected-failure path; not produced by this phase's
  evaluator.

## 7. Non-Authorized Scope

This phase does not include:

- no real authentication;
- no Supabase auth import;
- no usage storage;
- no API route;
- no KIS call;
- no DB/cache runtime;
- no SQL/migration;
- no deploy/push.

## 8. Future Activation Requirements

Before any real authenticated Chart Similarity API route or live KIS wiring may be added, the
following must all be in place:

- explicit owner approval;
- `CHART_AI_SIMILARITY_EXECUTION_ENABLED` feature flag turned on;
- a real auth integration (session/user resolution) feeding `SimilarityExecutionAuthState`;
- a usage storage design (DB/cache) approved separately from this planning phase;
- SQL/migration approval if a DB-backed usage store is used;
- a sanitized API response shape that never exposes a raw provider payload or auth payload;
- the existing KIS provider activation gate from Phase 3EY-A/3EY-B (feature flag, server-only
  credential handling, sanitized API route);
- no raw KIS or auth payload exposure at any layer.
