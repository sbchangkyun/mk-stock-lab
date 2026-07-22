# Phase 3FB-A — Provider-Compatible OHLC to Similarity Engine Integration Result (v0.1)

## 1. Status

Implemented. A server-only integration layer now accepts provider-compatible, mocked, normalized
`OhlcBar[]` data and runs the real deterministic similarity engine (`scanSimilarity`) against it,
entirely without live KIS. This is a working, committed implementation, not a plan.

## 2. Background

Phases 3FA-D-MANUAL-RUN-RETRY and 3FA-D-MANUAL-RUN-RETRY-HF1 diagnosed that live KIS OHLC
connectivity is blocked by a real, external network condition (a TCP connect timeout to the KIS
host), separate from a resolved configuration gate. Rather than continuing to chase that external
network issue inside this repository, this phase builds forward-looking, reusable product
functionality using the already-existing deterministic similarity engine and provider-compatible
mocked normalized OHLC data, so real KIS-normalized bars can be substituted later without
redesigning this layer.

## 3. Implementation Summary

- `src/lib/server/chartSimilarity/similarityProviderIntegrationTypes.ts` — new types:
  `SimilarityProviderIntegrationStatus`, `SimilarityProviderIntegrationSource`,
  `SimilarityProviderIntegrationMode`, `SimilarityProviderIntegrationPolicy`,
  `SimilarityProviderIntegrationRequest`, bar/match count bucket types, provider/engine status
  types, `SimilarityProviderIntegrationSafeSummary`, and `SimilarityProviderIntegrationResult`.
- `src/lib/server/chartSimilarity/similarityProviderIntegration.ts` — new module implementing
  `buildDefaultSimilarityProviderIntegrationPolicy`, `buildOwnerLocalMockedSimilarityProviderIntegrationPolicy`,
  `normalizeSimilarityProviderIntegrationRequest`, `bucketProviderNormalizedBarCount`,
  `bucketSimilarityMatchCount`, `runSimilarityProviderIntegrationWithBars`, and
  `runMockedProviderCompatibleSimilarityIntegration`. It imports `scanSimilarity` and `OhlcBar`
  from the existing public `src/lib/chartSimilarity` engine and reuses the existing mocked KIS
  OHLC fixture/adapter mapping (`buildMockedNormalizedDailyOhlcInput`,
  `toSimilarityOhlcBarsFromNormalizedDailyBars`). It never reads `process.env`/`.env`, never
  calls `fetch`, and never imports `src/lib/server/providers/kis` or any KIS client module.
- `src/lib/server/chartSimilarity/mockedSimilarityProviderIntegrationFixtures.ts` — new
  deterministic fixtures: `buildMockedProviderIntegrationRequest`,
  `buildMockedProviderIntegrationPolicy`, `buildMockedProviderCompatibleIntegrationReadyResult`,
  `buildMockedProviderCompatibleIntegrationBlockedResult`. No `Math.random`, no `Date.now`, no
  real stock prices.
- `src/lib/server/chartSimilarity/index.ts` — added exports for the three new modules above. No
  existing export was changed or removed.
- `scripts/smoke_phase_3fb_a_provider_compatible_ohlc_to_similarity_engine_integration.mjs` — new
  35-assertion smoke script, added as
  `npm run smoke:phase-3fb-a-provider-compatible-ohlc-to-similarity-engine-integration` in
  `package.json`.
- No page, API route, or `/chart-ai` UI file was touched. No new broad static checker was added.

## 4. Integration Result

Redacted, non-numeric-value smoke assertions (see the smoke script for the full list):

- **Ready path** (mocked, provider-compatible, sufficient bars): `status: "ready"`,
  `mode: "owner-local-mocked"`, `source: "mocked-provider-compatible"`,
  `providerStatus: "ready"`, `engineStatus: "ready"`, `normalizedBarsAvailable: true`,
  `normalizedBarCountBucket` not `"none"`, `matchCountBucket` not `"none"`. The real
  `scanSimilarity` engine was invoked and returned a non-empty `matches` array.
- **Blocked path** (deliberately insufficient mocked bars): `status: "blocked"`,
  `engineStatus: "not_run"`, `matchCountBucket: "none"`.
- **Disabled path** (default, feature-flag-off policy): `status: "disabled"`,
  `mode: "feature-flag-off"`, `engineStatus: "not_run"`.
- **Future live-KIS source guard**: a request with `source: "kis-normalized-future"` is always
  rejected as `status: "blocked"` / `providerStatus: "blocked"`, even under an enabled owner-local
  mocked policy — live KIS remains out of scope for this phase.
- A `fetch` guard in the smoke script confirmed no network call is made anywhere in this path.
- No credential, token, env value, raw provider payload, account/trading/order/balance field, or
  `NaN`/`Infinity` value appears in any serialized result.

## 5. Boundary Preservation

`src/pages`, `src/pages/api`, `src/lib/server/providers` (including `src/lib/server/providers/kis`),
`src/lib/chartSimilarity`, and `src/data/chartSimilarity` are all unchanged — confirmed by an empty
`git diff --name-only 833cb40` against those paths. `/chart-ai` UI unchanged. No route was wired to
this integration. No public or beta execution path exists. No auth runtime, usage storage, DB/cache
runtime, SQL, or migration was added. No account/trading/order/balance API was called. No live KIS
call was attempted. No network diagnostic was run in this phase. No new dependency or lockfile
change was made. No deployment, no push.

## 6. Validation

- `npm run smoke:phase-3fb-a-provider-compatible-ohlc-to-similarity-engine-integration` — `PASS
  (35/35 assertions passed)`.
- `npm run build` — passed.
- `git diff --check` — no whitespace errors introduced by this phase's changes.
- `git diff --name-only 833cb40 -- src/pages src/pages/api src/lib/server/providers src/lib/chartSimilarity src/data/chartSimilarity`
  — no output (no forbidden-path change).
- `git diff --name-only 833cb40` — limited to `package.json` and
  `src/lib/server/chartSimilarity/index.ts` (modified) plus the new files listed in Section 7
  (untracked/new).
- Live KIS smoke was not re-run. No network diagnostic was run. No full historical checker suite
  was run, since no broad or forbidden-path source change occurred.

## 7. Files Changed

- `src/lib/server/chartSimilarity/similarityProviderIntegrationTypes.ts` — new.
- `src/lib/server/chartSimilarity/similarityProviderIntegration.ts` — new.
- `src/lib/server/chartSimilarity/mockedSimilarityProviderIntegrationFixtures.ts` — new.
- `src/lib/server/chartSimilarity/index.ts` — modified (new exports appended only).
- `scripts/smoke_phase_3fb_a_provider_compatible_ohlc_to_similarity_engine_integration.mjs` — new.
- `package.json` — modified (one new smoke script line).
- `docs/planning/phase_3fb_a_provider_compatible_ohlc_to_similarity_engine_integration_result_v0.1.md`
  — new result document (this file).
- `docs/planning/planning_changelog.md` — new top changelog entry.

## 8. Implementation Implication

The deterministic similarity engine can now be exercised end-to-end through a server-only,
provider-compatible integration layer without any dependency on live KIS reachability. This
unblocks further product work (e.g. exposing a mocked-only preview path, or later wiring real
KIS-normalized bars once network reachability is restored) without needing to redesign the
request/result contract — `runSimilarityProviderIntegrationWithBars` already accepts the same
`OhlcBar[]` shape a real KIS-normalized provider would produce.

## 9. Recommended Next Phase

Phase 3FB-B — decide whether to (a) wire this mocked integration into a disabled-by-default,
owner-local-only API route path for manual review, or (b) continue pursuing KIS network
reachability (Phase 3FA-D-MANUAL-RUN-RETRY-HF2) as a separate, parallel track. Both can proceed
independently since this integration layer has no dependency on the KIS network outcome.
