# Phase 3EY-A — Server-only KIS OHLC Provider Planning/Foundation v0.1

## 1. Purpose

This phase prepares a server-only provider foundation for future KIS daily OHLC data used by
Chart Similarity, without enabling live execution. It defines request/result/policy types and a
disabled-by-default provider function that later phases can build on, while keeping every
current public/sample boundary intact.

## 2. Current State

- Phase 3EX-D integrated a mocked "유사 패턴 분석" (similar pattern analysis) result UI into
  `/chart-ai`, using the deterministic chart similarity engine (Phase 3EX-B/3EX-C) run against
  synthetic fixture data only.
- The similarity result UI on `/chart-ai` uses synthetic fixture data exclusively — no live KIS
  call, no `/api/chart-ai/similarity` route, no auth, no DB/cache runtime, no external AI.
- Actual KIS-powered similarity execution remains feature-flag off. This phase does not change
  that: it only adds server-only type/policy/foundation code that is never imported by
  `/chart-ai` or any page/API route.

## 3. Provider Boundary

- Server-only: all new code lives under `src/lib/server/chartSimilarity/`, never under
  `src/pages/` or `src/pages/api/`.
- No browser KIS access — the browser never talks to KIS directly or indirectly through this
  module.
- No raw provider payload is exposed to the client; only the already-decoupled `OhlcBar` shape
  from the existing chart similarity engine is produced.
- No client secrets are read, stored, or returned by any type or function in this phase.
- No account/trading/order/balance APIs are referenced.
- No public execution path exists — the foundation function returns `disabled` or
  `not_implemented`, never real data.
- No `source=live` or `source=auto` values are produced; the only bar `source` value this module
  can emit is `"kis-normalized"`, and only from an already-normalized safe input, never a live
  call.

## 4. Foundation Scope

- **Provider types** (`kisOhlcProviderTypes.ts`): `ServerOnlyKisOhlcProviderStatus`,
  `ServerOnlyKisOhlcRequest`, `ServerOnlyKisOhlcPolicy`, `ServerOnlyKisOhlcResult`, and a safe
  `NormalizedDailyOhlcInput`/`NormalizedDailyOhlcMeta` shape for the adapter placeholder. Reuses
  `OhlcBar` from `src/lib/chartSimilarity/types`.
- **Default disabled policy** (`kisOhlcProviderPolicy.ts`): candidate feature flag NAMES only
  (`CHART_AI_SIMILARITY_KIS_OHLC_ENABLED`, `CHART_AI_SIMILARITY_REQUIRE_AUTH`,
  `CHART_AI_SIMILARITY_REQUIRE_USAGE_GUARD`) and `buildDefaultServerOnlyKisOhlcPolicy()`, which
  returns `enabled: false`, `requireAuth: true`, `requireUsageGuard: true`,
  `allowPublicExecution: false`, `allowClientSecretExposure: false`,
  `allowRawProviderPayload: false`. No `process.env` or `.env` read anywhere in this module.
- **Request validation/normalization** (`serverOnlyKisOhlcProvider.ts`):
  `normalizeServerOnlyKisOhlcRequest` clamps `lookbackYears` (max 5) and `maxBars` (max 1500);
  `validateServerOnlyKisOhlcRequest` rejects an empty symbol, non-`KR` market, non-`daily`
  timeframe, invalid `assetType`, or wrong `purpose` with a structured `{ ok: false, errorCode,
  reason }` result instead of throwing.
- **Disabled/not-implemented result behavior**: `getServerOnlyKisOhlcForSimilarity(request,
  policy)` returns `status: "blocked"` for invalid requests, `status: "disabled"` when
  `policy.enabled` is `false` (the default), and `status: "not_implemented"` when `policy.enabled`
  is `true` — live provider wiring is deferred. Every path returns `bars: []` and a
  secret/provider-detail-free `safeMessage`.
- **Normalized bar adapter placeholder**: `toSimilarityOhlcBarsFromNormalizedDailyBars(input,
  meta)` is a pure function that maps an already-normalized `NormalizedDailyOhlcInput[]` (no raw
  KIS field names) into `OhlcBar[]` with `source: "kis-normalized"`, dropping non-finite rows
  with a warning instead of throwing. It never calls a provider and never parses a raw response.

## 5. Non-Authorized Scope

This phase does not include:

- no KIS call;
- no API route;
- no `/api/chart-ai/similarity`;
- no UI real-data execution;
- no auth/usage guard runtime;
- no DB/cache runtime;
- no SQL/migration;
- no Vercel env changes;
- no deploy/push.

## 6. Future Activation Requirements

Before enabling real KIS OHLC execution for Chart Similarity, the following must all be in place:

- explicit owner approval;
- `CHART_AI_SIMILARITY_KIS_OHLC_ENABLED` feature flag turned on;
- server-only credential handling (no client exposure);
- an auth guard in front of any execution path;
- a usage guard (rate/quota limiting) in front of any execution path;
- a sanitized API route that never returns a raw provider payload;
- cache policy approval (design first, runtime later);
- SQL/migration approval if a cache/store is added.

## 7. Future Phase Sequence

Recommended:

- Phase 3EY-B — Server-only KIS OHLC Provider Contract and Mocked Adapter Test
- Phase 3EY-C — Auth/Usage Guard Plan for Similarity Execution
- Phase 3EZ-A — Authenticated Similarity API Route with Feature Flag Off
- Phase 3EZ-B — Owner-local KIS Similarity Smoke, no public enable
