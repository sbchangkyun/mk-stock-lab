# Phase 3FB-B — Owner-local Mocked Similarity API Route Integration Result (v0.1)

## 1. Status

Implemented. The existing `/api/chart-ai/similarity` route now has an explicit, owner-local
mocked execution branch that calls the Phase 3FB-A provider-compatible mocked similarity
integration and returns a sanitized, bucketed success response. Default route behavior for every
other request shape is unchanged: it still always resolves to `feature_disabled`. This is a
working, committed implementation, not a plan.

## 2. Background

Phase 3FB-A built a server-only integration layer that runs the real deterministic similarity
engine against provider-compatible, mocked, normalized `OhlcBar[]` data, but it was not wired into
any page or API route. Live KIS OHLC connectivity remains externally blocked, so this phase
continues forward-looking implementation work: connecting the existing Phase 3FB-A integration to
the existing `/api/chart-ai/similarity` route as an owner-local mocked-only execution path, while
keeping the default public route behavior, live KIS, real auth, and usage storage completely
untouched.

## 3. Implemented Scope

- `src/pages/api/chart-ai/similarity.ts` — added a detection branch: a request whose JSON body
  contains `mode: "owner-local-mocked"`, `source: "mocked-provider-compatible"`, and
  `ownerLocalMocked: true` is routed to the new owner-local mocked builder; every other request
  (including the previous default shape) is unchanged and still resolves through
  `buildSimilarityApiRouteShellResult`. The owner-local mocked branch is wrapped in a `try/catch`
  that falls back to the safe default feature-disabled response on any unexpected error.
- `src/lib/server/chartSimilarity/similarityApiResponseTypes.ts` — extended
  `SimilarityApiResponseSource` with `'mocked-provider-compatible'` and
  `SimilarityApiResponseMode` with `'owner-local-mocked'`; added a new
  `SimilarityApiOwnerLocalMockedSuccessData` type (bucketed, non-numeric-value fields only) and
  widened `SimilarityApiResponse['data']` to include it alongside the existing
  `SimilarityApiMockedSuccessData` shape used by the older guard-based mocked-plan path.
- `src/lib/server/chartSimilarity/similarityApiResponseBuilder.ts` — added
  `isOwnerLocalMockedSimilarityApiRequestBody`, `extractOwnerLocalMockedIntegrationRequestFields`,
  and `buildOwnerLocalMockedSimilarityApiResponse`, which calls
  `runMockedProviderCompatibleSimilarityIntegration` (Phase 3FB-A) and packages its result into a
  sanitized `SimilarityApiResponse`. Never calls live KIS, `fetch`, or `process.env`.
- `src/lib/server/chartSimilarity/index.ts` — exported the new types and functions above; no
  existing export was changed or removed.
- `scripts/smoke_phase_3fb_b_owner_local_mocked_similarity_api_route_integration.mjs` — new
  36-assertion smoke script, added as
  `npm run smoke:phase-3fb-b-owner-local-mocked-similarity-api-route-integration` in
  `package.json`. Bundles and directly invokes the real exported `POST`/`ALL` route handlers with
  constructed `Request` objects — no dev server, no browser tools.
- No change to `src/pages/chart-ai.astro`, `src/lib/server/providers/**`,
  `src/lib/chartSimilarity/**`, or `src/data/chartSimilarity/**`. No new broad static checker was
  added.

## 4. Route Contract

- **Default request** (no owner-local-mocked approval, including the previous default shape and
  malformed JSON): `httpStatus: 503`, `status: "feature_disabled"`, `mode: "feature-flag-off"`,
  `data: null` — byte-identical to the pre-existing contract.
- **Owner-local mocked request** (`mode: "owner-local-mocked"`,
  `source: "mocked-provider-compatible"`, `ownerLocalMocked: true`): `httpStatus: 200`,
  `ok: true`, `status: "success"`, `mode: "owner-local-mocked"`,
  `request.source: "mocked-provider-compatible"`, `data.normalizedBarsAvailable: true`,
  `data.normalizedBarCountBucket` and `data.matchCountBucket` both non-`"none"` buckets,
  `data.engineStatus: "ready"`, a mocked/sample disclaimer string, and `data.dataPolicy` with
  `allowLiveKis: false`, `allowRouteSuccess: false`, `allowPublicExecution: false`. No raw
  `matches` array, no raw provider payload, no credential/env value, no `source: "live"`/
  `source: "auto"`.
- **Partial or mismatched approval** (only one or two of the three required fields present) is
  treated as a non-owner-local-mocked request and returns the same default `feature_disabled`
  contract — all three fields are required together.
- `Content-Type: application/json; charset=utf-8` and `Cache-Control: no-store` are preserved on
  every response path, including the owner-local mocked path.

## 5. Smoke Result

`npm run smoke:phase-3fb-b-owner-local-mocked-similarity-api-route-integration` —
**PASS (36/36 assertions passed)**. Covers: default POST contract (status/mode/data/headers),
owner-local mocked POST contract (status/ok/mode/source/bucket fields/engineStatus/disclaimer/
dataPolicy/usage/error/no-raw-matches/headers), forbidden-substring scan on both response bodies
(no credential/token/account/trading/balance/env-name substrings, no `source: "live"`/
`source: "auto"`), malformed-JSON fallback (no throw), partial-approval fallback, wrong-source
fallback, the non-POST/`ALL` catch-all handler, and a `fetch` guard confirming no network call is
ever attempted.

## 6. Boundary Preservation

`src/pages/chart-ai.astro`, `src/lib/server/providers` (including `src/lib/server/providers/kis`),
`src/lib/chartSimilarity`, and `src/data/chartSimilarity` are all unchanged — confirmed by an
empty `git diff --name-only c24652d` against those paths. No live KIS call was made. No network
diagnostic was run. No real auth runtime, usage storage, DB/cache runtime, SQL, or migration was
added. No account/trading/order/balance API was called. No dependency or lockfile change was
made. No deployment, no push. The default route contract for every non-owner-local-mocked request
is byte-identical to the pre-existing Phase 3EZ-C behavior.

## 7. Validation

- `npm run smoke:phase-3fb-b-owner-local-mocked-similarity-api-route-integration` — `PASS
  (36/36 assertions passed)`.
- `npm run smoke:phase-3fb-a-provider-compatible-ohlc-to-similarity-engine-integration` — `PASS
  (35/35 assertions passed)`, confirming no regression to the Phase 3FB-A integration layer.
- `npm run build` — passed.
- `git diff --check` — no whitespace errors introduced by this phase's changes.
- `git diff --name-only c24652d -- src/pages/chart-ai.astro src/lib/server/providers src/lib/chartSimilarity src/data/chartSimilarity`
  — no output (no forbidden-path change).
- `git diff --name-only c24652d` — limited to `package.json`,
  `src/lib/server/chartSimilarity/index.ts`, `src/lib/server/chartSimilarity/similarityApiResponseBuilder.ts`,
  `src/lib/server/chartSimilarity/similarityApiResponseTypes.ts`, and
  `src/pages/api/chart-ai/similarity.ts` (all modified), plus the new smoke script and this
  documentation/changelog (untracked/new).
- Live KIS smoke was not re-run. No network diagnostic was run. No full historical checker suite
  was run, since no broad or forbidden-path source change occurred.

## 8. Implementation Implication

The Phase 3FB-A deterministic similarity engine integration is now reachable through the real
`/api/chart-ai/similarity` API route contract for owner-local mocked verification, end to end,
without any dependency on live KIS reachability or any change to public route behavior. This
unblocks further UI-facing work (e.g. wiring `/chart-ai` to call this owner-local mocked path
during development) while live KIS network reachability remains a separate, externally blocked
track that can proceed independently.

## 9. Recommended Next Phase

Phase 3FB-C — Chart AI UI Owner-local Mocked API Execution Wiring, Live KIS Off. Alternative:
Phase 3FB-C-ALT — Auth/Usage Runtime Bridge for Similarity Route, No Live KIS.
