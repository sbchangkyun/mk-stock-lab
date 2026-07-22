# Phase 3FC-F Feature Flag Resolver Contract

## 1. Purpose

This contract defines a server-only feature flag resolver scaffold for Chart Similarity. The
scaffold is disabled by default and evaluates only deterministic mocked flag records supplied
explicitly by the caller. It never reads a real environment variable, never reads a Vercel
environment variable, never connects to a real Supabase client or a real feature flag database,
and is not wired into any route or UI in this phase. It exists so a later, separately approved
phase can replace the mocked flag source with a real one without changing this contract's shape.

## 2. Inputs

`SimilarityFeatureFlagResolverInput` accepts only:

- `mockedFlags` — an optional array of `SimilarityFeatureFlagRecord` (or `null`), each describing
  one flag key's mocked enabled/active state. This is the only source of flag state read by the
  resolver.
- `requestedCapability` — an optional `SimilarityFeatureFlagCapability` (or `null`) the caller asks
  the resolver to evaluate against the computed gates.
- `clientClaimedFlags` — always ignored. If present, it only causes a `client_claim_ignored`
  warning; it never influences any flag state or gate.
- `currentIso` — an optional ISO timestamp string, accepted but not required for any comparison in
  this phase.

## 3. Outputs

`SimilarityFeatureFlagResolverResult` returns:

- `flags` — the resolved state of all five approved flag keys (`key`, `enabled`, `source`,
  `active`).
- `gates` — the computed dependency gate state (`authRuntimeReady`, `usageStorageReady`,
  `betaFlagReady`, `betaDependenciesSatisfied`, `publicFlagReady`, `publicDependenciesSatisfied`,
  `liveKisFlagReady`, `routeSuccessAllowed`, `betaExecutionAllowed`, `publicExecutionAllowed`,
  `liveKisAllowed`).
- `requestedCapabilityAllowed` — whether the requested capability (if any) is currently allowed.
- `safeMessage` — a human-readable, non-sensitive status message.
- `warnings` — a list of safe warning identifiers (e.g. `duplicate_flag_ignored`).
- `policy` — a safe summary of the policy in effect (booleans and dependency requirements only, no
  secret material).

## 4. Policy Defaults

The default policy (`buildDefaultSimilarityFeatureFlagResolverPolicy`) sets:

- `enabled: false`, `allowMockedFlagRead: false`
- `allowRealEnvRead: false`, `allowVercelEnvRead: false`, `allowSupabaseClient: false`
- `allowDbRead: false`, `allowDbWrite: false`, `allowSql: false`
- `allowCookieRead: false`, `allowHeaderRead: false`, `allowClientClaimedFlags: false`
- `allowRouteSuccess: false`, `allowBetaExecution: false`, `allowPublicExecution: false`,
  `allowLiveKis: false`
- `requireAuthForBeta: true`, `requireUsageForBeta: true`, `requireBetaBeforePublic: true`,
  `requireSeparateLiveKisApproval: true`

The mocked scaffold policy (`buildMockedSimilarityFeatureFlagResolverPolicy`) only flips `enabled`
and `allowMockedFlagRead` to `true`; every other boolean above remains exactly as listed.

## 5. Feature Flag Keys

The five approved flag keys are:

- `AUTH_RUNTIME_ENABLED`
- `USAGE_STORAGE_ENABLED`
- `CHART_AI_SIMILARITY_BETA_ENABLED`
- `CHART_AI_SIMILARITY_PUBLIC_ENABLED`
- `LIVE_KIS_OHLC_ENABLED`

## 6. Dependency Rules

- Beta requires `AUTH_RUNTIME_ENABLED`, `USAGE_STORAGE_ENABLED`, and
  `CHART_AI_SIMILARITY_BETA_ENABLED` all true (`betaDependenciesSatisfied`).
- Public requires `betaDependenciesSatisfied` plus `CHART_AI_SIMILARITY_PUBLIC_ENABLED` true
  (`publicDependenciesSatisfied`).
- Live KIS (`LIVE_KIS_OHLC_ENABLED`) is evaluated independently of the beta/public chain.
- `CHART_AI_SIMILARITY_PUBLIC_ENABLED` and `LIVE_KIS_OHLC_ENABLED` are not approved for activation
  in this phase or any prior phase.
- Regardless of any dependency satisfaction, `routeSuccessAllowed`, `betaExecutionAllowed`,
  `publicExecutionAllowed`, and `liveKisAllowed` always remain `false` in this scaffold — the
  resolver reports dependency state, it never grants runtime capability.

## 7. Mocked Scaffold Behavior

Under the mocked scaffold policy, the resolver correctly evaluates:

- default disabled (no policy override) — all five flags false, all gates false;
- all flags off — explicit inactive-by-value records for all five keys;
- auth only — only `AUTH_RUNTIME_ENABLED` true;
- auth + usage + beta ready — all three beta-dependency flags true, `betaDependenciesSatisfied`
  true, `betaExecutionAllowed` still false;
- beta missing auth — beta flag true, auth flag false, `beta_missing_auth_dependency` warning;
- beta missing usage — beta flag true, usage flag false, `beta_missing_usage_dependency` warning;
- public requested — public flag true, `public_activation_not_approved` warning, still no public
  execution;
- live KIS requested — live KIS flag true, `live_kis_activation_not_approved` warning, still no
  live KIS execution;
- duplicate flags ignored — two active records for the same key are ignored as a set, the default
  false state is kept, and `duplicate_flag_ignored` is added;
- client claims ignored — `clientClaimedFlags` never changes flag state, only adds
  `client_claim_ignored`.

## 8. Security Boundary

- No real environment variable is ever read.
- No Vercel environment variable is ever read.
- No Supabase package is imported and no real Supabase client is created.
- No real database is read from or written to.
- No SQL or migration file is created or referenced.
- No cookie or request header is ever read.
- No route success, beta execution, or public execution is ever granted by this scaffold.
- No live KIS activation is ever granted by this scaffold.
- No client-supplied flag claim is ever trusted.
- No raw KIS/OHLC/price/volume field, and no account/trading/balance field, ever appears in this
  module's types, fixtures, or results.

## 9. Future Integration

A later, separately approved phase may replace the mocked flag source with a real
environment/DB-backed flag source behind this same contract shape. Route integration — wiring this
resolver, the Phase 3FC-C auth subject resolver, the Phase 3FC-D role assignment resolver, and the
Phase 3FC-E usage store together into `src/pages/api/chart-ai/similarity.ts` — happens in a later
phase, not this one. Feature flags will independently gate auth runtime activation, usage storage
activation, beta/public similarity exposure, and live KIS OHLC access; each requires its own
separate approval before `routeSuccessAllowed`-equivalent behavior may ever become true.
