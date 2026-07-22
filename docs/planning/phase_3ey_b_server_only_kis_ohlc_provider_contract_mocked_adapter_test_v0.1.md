# Phase 3EY-B — Server-only KIS OHLC Provider Contract and Mocked Adapter Test v0.1

## 1. Purpose

This phase adds a mocked adapter / test harness for the server-only KIS OHLC provider
foundation added in Phase 3EY-A, so the request/normalize/validate/adapt contract can be
exercised end to end with synthetic, already-normalized data — without enabling any live KIS
call. It also adds a committed runtime smoke script that executes the real TypeScript source
(not a re-implementation) and a static checker that gates the contract.

## 2. Current State

- Phase 3EY-A added `src/lib/server/chartSimilarity/kisOhlcProviderTypes.ts`,
  `kisOhlcProviderPolicy.ts`, `serverOnlyKisOhlcProvider.ts`, and `index.ts`. The provider
  foundation returns `disabled` (default policy) or `not_implemented` (policy enabled) for any
  request, and `blocked` for an invalid request. No live KIS call exists anywhere in the
  foundation.
- The similarity engine itself (Phase 3EX-B/3EX-C) and the mocked similarity result UI
  (Phase 3EX-D) already run entirely on synthetic fixture data, independent of this provider
  track.
- This phase does not change that: it adds a mocked adapter that reuses the existing
  normalize/validate/adapt functions unchanged, plus synthetic normalized-bar fixtures, all
  under `src/lib/server/chartSimilarity/`.

## 3. Contract Under Test

- `normalizeServerOnlyKisOhlcRequest` / `validateServerOnlyKisOhlcRequest` /
  `toSimilarityOhlcBarsFromNormalizedDailyBars` from Phase 3EY-A are reused as-is by the new
  mocked adapter — not modified, not re-implemented.
- The mocked adapter (`mockedKisOhlcAdapter.ts`) accepts a request, an array of
  already-normalized synthetic `NormalizedDailyOhlcInput` rows, and an optional policy. It never
  parses a raw KIS payload, never calls `fetch`, and never imports a KIS provider/client module.
- Contract outcomes: an invalid request is `blocked`; a disabled policy (the default) returns
  `disabled`; an enabled policy with no valid mapped bars returns a safe empty-bars result; an
  enabled policy with valid mapped bars returns `ready` with `OhlcBar[]` (`source:
  "kis-normalized"`).

## 4. Mocked Adapter Policy

- The mocked adapter is a **separate module and function** from the disabled live-foundation
  provider (`getServerOnlyKisOhlcForSimilarity`), which is preserved unmodified in this phase.
- The mocked adapter's `"ready"` status is a non-live, test-harness-only result. It never
  indicates that live KIS execution has been enabled, and it is not reachable from any page or
  API route.
- Fixture data (`mockedKisOhlcFixtures.ts`) is generated from fixed arithmetic only — no
  `Math.random`, no `Date.now`, no real stock code, no actual market value, no raw KIS field
  name.

## 5. Smoke Verification Plan

- A committed runtime smoke script (`scripts/smoke_phase_3ey_b_server_only_kis_ohlc_provider_mocked_adapter.mjs`)
  copies `src/lib/server/chartSimilarity/**` and `src/lib/chartSimilarity/types.ts` into an OS
  temp directory, rewrites only the copies' relative import specifiers to add a `.ts`
  extension, and executes the real provider/adapter code via Node's native TypeScript support.
- The script asserts 30 numbered contract properties covering default policy shape, the
  disabled/not_implemented/blocked provider foundation paths, request normalization clamps,
  mocked fixture shape, the mocked adapter's disabled/ready/blocked/empty-bars paths, bar
  source/market/symbol correctness, NaN/Infinity safety, `safeMessage` presence, and the absence
  of raw KIS field names or secret-looking values in any output.
- No network call, no environment read, no dev server, and no browser are used by the smoke
  script. The temp directory is always removed in a `finally` block.

## 6. Non-Authorized Scope

This phase does not include:

- no KIS call;
- no API route;
- no `/api/chart-ai/similarity`;
- no `/chart-ai` UI change;
- no auth/usage guard runtime;
- no DB/cache runtime;
- no SQL/migration;
- no external AI call;
- no Vercel env changes;
- no deploy/push.

## 7. Future Activation Requirements

Before enabling real KIS OHLC execution for Chart Similarity, the following must all be in
place (unchanged from Phase 3EY-A):

- explicit owner approval;
- `CHART_AI_SIMILARITY_KIS_OHLC_ENABLED` feature flag turned on;
- server-only credential handling (no client exposure);
- an auth guard in front of any execution path;
- a usage guard (rate/quota limiting) in front of any execution path;
- a sanitized API route that never returns a raw provider payload;
- cache policy approval (design first, runtime later);
- SQL/migration approval if a cache/store is added.
