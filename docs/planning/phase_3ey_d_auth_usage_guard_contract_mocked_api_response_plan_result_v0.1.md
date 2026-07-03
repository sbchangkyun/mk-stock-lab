# Phase 3EY-D — Auth/Usage Guard Contract and Mocked API Response Plan Result

## 1. Status

Prepared/Implemented — sanitized mocked API response contract added on top of the Phase 3EY-C
guard, no API route or runtime integration.

## 2. Background

- Phase 3EY-C added a disabled-by-default, policy-first auth/usage execution guard that returns a
  `SimilarityExecutionGuardResult` from a caller-supplied guard request and usage snapshot.
- This phase adds the response contract a later, separately authorized phase can use to shape a
  real API route's JSON response, without adding the route itself.

## 3. Implemented Scope

- **API response types** (`src/lib/server/chartSimilarity/similarityApiResponseTypes.ts`):
  `SimilarityApiResponseStatus`, `SimilarityApiResponseSource`, `SimilarityApiResponseMode`,
  `SimilarityApiSafeRequest`, `SimilarityApiSafeUsage`, `SimilarityApiSafeError`,
  `SimilarityApiMockedMatch`, `SimilarityApiMockedSuccessData`, `SimilarityApiResponse`. No
  `userId`, `role`, `authState`, session/access/provider token, email, IP address, raw auth
  payload, raw KIS payload, or account/trading/order/balance field appears in any type.
- **Response builder** (`similarityApiResponseBuilder.ts`): `toSimilarityApiSafeRequest`,
  `toSimilarityApiSafeUsage`, `mapGuardStatusToApiStatus`, `buildSimilarityApiErrorFromGuard`,
  `buildSimilarityApiResponseFromGuard`, `buildMockedSimilarityApiSuccessData`,
  `buildMockedAllowedSimilarityApiResponse`. The builder converts a
  `SimilarityExecutionGuardResult` into a sanitized `SimilarityApiResponse`; it never calls the
  real similarity engine, never calls KIS, never calls `fetch`, never reads
  `process.env`/`.env`, never reads or writes usage state, and never throws for an expected guard
  result.
- **Mocked API response fixtures** (`mockedSimilarityApiResponseFixtures.ts`):
  `buildMockedSimilarityApiAllowedResponse`, `buildMockedSimilarityApiAuthRequiredResponse`,
  `buildMockedSimilarityApiUsageLimitedResponse`, `buildMockedSimilarityApiFeatureDisabledResponse`,
  `buildMockedSimilarityApiNotConfiguredResponse`, `buildMockedSimilarityApiBlockedResponse` — each
  drives the real Phase 3EY-C guard evaluator and mocked guard fixtures with fixed, synthetic
  policy/usage inputs to deterministically produce one response per guard status.
- **Public server exports** (`index.ts`): now also re-exports all new API response types, the
  response builder functions, and the mocked API response fixtures, alongside all existing Phase
  3EY-A/3EY-B/3EY-C exports unchanged. Not imported into any page/API route.
- **Runtime smoke verification**
  (`scripts/smoke_phase_3ey_d_auth_usage_guard_contract_mocked_api_response_plan.mjs`): copies
  `src/lib/server/chartSimilarity/**` and `src/lib/chartSimilarity/types.ts` into an OS temp
  directory, rewrites only the copies' relative import specifiers to add a `.ts` extension,
  executes the real code via Node's native TypeScript support, and asserts 33 numbered contract
  properties (per-status response shape, secret/token/auth/KIS/account safety, mocked data
  quality, builder status-mapping behavior, and a `process.env` Proxy-based runtime check that
  building every mocked response never touches an environment variable). The temp directory is
  removed in a `finally` block.
- **Docs/changelog/package**: this planning document, this result document, a prepended
  `## Phase 3EY-D - 2026-07-04` changelog entry, `package.json` scripts
  `check:phase-3ey-d-auth-usage-guard-contract-mocked-api-response-plan` and
  `smoke:phase-3ey-d-auth-usage-guard-contract-mocked-api-response-plan`, and a new 87-check
  static checker
  `scripts/check_phase_3ey_d_auth_usage_guard_contract_mocked_api_response_plan_contract.mjs`.

## 4. Response Contract Results

- **Success response**: a `source: "mocked"`, guard-allowed request returns
  `{ ok: true, status: "success", mode: "mocked-plan", data: <mocked matches/narrative>, error: null }`.
- **Blocked response**: a structurally invalid guard request (empty symbol) returns
  `{ ok: false, status: "blocked", data: null }` with a structured error whose `code` preserves
  the guard's specific `errorCode` (e.g. `invalid_symbol`).
- **Auth-required response**: an unauthenticated `kis-normalized` request against an enabled
  policy returns `{ status: "auth_required", mode: "guard-blocked" }` with error code
  `auth_required`.
- **Usage-limited response**: a fully-consumed usage snapshot returns
  `{ status: "usage_limited" }` with a `retryable: true` error and `usage.remaining === 0`.
- **Feature-disabled response**: a request against the default (disabled) policy returns
  `{ status: "feature_disabled", mode: "feature-flag-off" }`.
- **Not-configured response**: an enabled policy with no usage snapshot supplied returns
  `{ status: "not_configured", usage: null }`.
- **Safe error object**: every non-ok response has a `{ code, message, retryable }` error object
  built from the guard's `errorCode`/`safeMessage`, never from a raw exception or stack trace.
- **Sanitized usage object**: `toSimilarityApiSafeUsage` copies only `window`, `used`, `limit`,
  `remaining`, and an optional `resetAtIso` — verified to drop every other guard usage field.
- **userId/role/authState leak prevention**: verified via a regex scan of the serialized response
  set from all six status fixtures — no `"userId"`, `"role"`, or `"authState"` key appears.
- **Raw KIS/auth payload safety**: verified via token-like, auth-provider-payload, KIS-credential,
  and account/trading regex scans of the same serialized response set — none match.

## 5. Boundary Preservation

- No API route added or modified.
- No real auth runtime added.
- No usage persistence added.
- No KIS call made anywhere in this phase.
- No `/chart-ai` UI change.
- No DB or cache runtime added.
- No SQL or migration run or added.
- No external AI call made or referenced.
- No public KIS data exposed; no `source=live`; no `source=auto` literal produced anywhere.
- No account/trading/order/balance API referenced.
- No Vercel env changes.
- No deployment performed.
- No `git push` performed.
- No dependency or devDependency changes.
- No actual/real market values used anywhere — mocked success data is fixed synthetic data only.
- No `.env`/`process.env` read — verified statically and via a runtime `process.env` Proxy check
  in the committed smoke script.

## 6. Validation

All required commands were run for real against the response contract and the preserved Phase
3EY-A/3EY-B/3EY-C foundation; results are recorded here after the full suite completed. The
33-assertion committed smoke script exercises the real TypeScript source through a
temp-directory copy with rewritten relative imports, and the 87-check static checker gates file
presence, contract shape, sanitization, preserved-boundary phrasing, and allowed-changed-path
scope. See the final phase report for the itemized pass/fail list of every command in the
required validation suite, run in the exact specified order, including `npm run build` and
`git diff --check`.

## 7. Roadmap

- **3EX-E**: Similarity Result UI Owner Review and Polish — mocked-data UI review only, no API or
  auth change.
- **3EZ-A**: candidate real auth integration design, still no live KIS call.
- **3EZ-B**: candidate usage storage design and approval (DB/cache), still no live KIS call.
- **3EZ-C**: candidate authenticated Chart Similarity API route wiring the Phase 3EY-C guard and
  this phase's response builder together, gated behind explicit owner approval.
- **3FA-A**: candidate live KIS-normalized execution activation, gated behind feature flag, auth,
  and usage guard all passing.
- **Limited beta**: only after 3EZ-A/3EZ-B/3EZ-C/3FA-A are all separately approved.

## 8. Recommended Next Phase

- **Recommended**: Phase 3EX-E — Similarity Result UI Owner Review and Polish.
- **Alternative**: Phase 3EZ-A — Real Auth Integration Design for Similarity Execution.
