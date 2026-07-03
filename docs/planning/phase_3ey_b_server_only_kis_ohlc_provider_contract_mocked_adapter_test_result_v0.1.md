# Phase 3EY-B — Server-only KIS OHLC Provider Contract and Mocked Adapter Test Result

## 1. Status

Implemented — server-only KIS OHLC provider contract and mocked adapter verification complete.

## 2. Background

- Phase 3EY-A added the server-only KIS OHLC provider type/policy/foundation modules under
  `src/lib/server/chartSimilarity/`, with `getServerOnlyKisOhlcForSimilarity` returning
  `disabled` (default policy) or `not_implemented` (policy enabled), never real data.
- This phase adds a mocked adapter / test harness that exercises the same normalize/validate/
  adapt contract end to end using only already-normalized synthetic OHLC input, plus a
  committed runtime smoke script that runs the real TypeScript source via Node's native
  TypeScript support.
- No live KIS execution is enabled by this phase.

## 3. Implemented Scope

- **Mocked normalized OHLC fixtures** (`src/lib/server/chartSimilarity/mockedKisOhlcFixtures.ts`):
  `buildMockedNormalizedDailyOhlcInput(count = 80)` produces deterministic synthetic
  `NormalizedDailyOhlcInput[]` rows from fixed sine/cosine arithmetic around a 100-based
  baseline (no `Math.random`, no `Date.now`, no real stock code, no raw KIS field name);
  `buildInvalidMockedNormalizedDailyOhlcInput()` produces a fixed set of intentionally invalid
  rows (NaN/Infinity fields, an empty date) for safe-drop testing.
- **Mocked adapter / test harness** (`src/lib/server/chartSimilarity/mockedKisOhlcAdapter.ts`):
  `getMockedServerOnlyKisOhlcForSimilarity(input)` reuses `normalizeServerOnlyKisOhlcRequest`,
  `validateServerOnlyKisOhlcRequest`, and `toSimilarityOhlcBarsFromNormalizedDailyBars` from the
  Phase 3EY-A foundation unmodified. It returns `blocked` for an invalid request, `disabled`
  when the supplied (or default) policy is not enabled, a safe empty-bars `blocked` result when
  an enabled policy maps to zero valid bars, and `ready` with mapped `OhlcBar[]` (`source:
  "kis-normalized"`) when an enabled policy maps to at least one valid bar. This is a
  non-live, test-harness-only "ready" path — it never calls `fetch` and never imports a KIS
  provider/client module.
- **Disabled provider preservation**: `serverOnlyKisOhlcProvider.ts`, `kisOhlcProviderTypes.ts`,
  and `kisOhlcProviderPolicy.ts` from Phase 3EY-A were not modified; `getServerOnlyKisOhlcForSimilarity`
  still returns `disabled`/`not_implemented`/`blocked` only.
- **Public server exports** (`src/lib/server/chartSimilarity/index.ts`): now also re-exports
  `MockedServerOnlyKisOhlcAdapterInput`, `getMockedServerOnlyKisOhlcForSimilarity`,
  `buildMockedNormalizedDailyOhlcInput`, and `buildInvalidMockedNormalizedDailyOhlcInput`,
  alongside all existing Phase 3EY-A exports unchanged. Not imported into any page/API route.
- **Runtime smoke verification** (`scripts/smoke_phase_3ey_b_server_only_kis_ohlc_provider_mocked_adapter.mjs`):
  copies `src/lib/server/chartSimilarity/**` and `src/lib/chartSimilarity/types.ts` into an OS
  temp directory, rewrites only the copies' relative import specifiers to add a `.ts`
  extension, executes the real code via Node's native TypeScript support, and asserts 30
  numbered contract properties; the temp directory is removed in a `finally` block.
- **Docs/changelog/package**: this planning document, this result document, a prepended
  `## Phase 3EY-B - 2026-07-03` changelog entry, `package.json` scripts
  `check:phase-3ey-b-server-only-kis-ohlc-provider-contract-mocked-adapter-test` and
  `smoke:phase-3ey-b-server-only-kis-ohlc-provider-mocked-adapter`, and a new 72-check static
  checker `scripts/check_phase_3ey_b_server_only_kis_ohlc_provider_contract_mocked_adapter_test_contract.mjs`.

## 4. Contract Results

- **Default disabled path**: `getMockedServerOnlyKisOhlcForSimilarity` with no policy argument
  (or the default policy) returns `status: "disabled"`, `ok: false`, `bars: []`.
- **Enabled not_implemented path**: the unmodified `getServerOnlyKisOhlcForSimilarity` still
  returns `status: "not_implemented"` when a policy with `enabled: true` is supplied to it —
  this path is untouched by the mocked adapter.
- **Invalid request blocked path**: an invalid request (empty symbol, non-`KR` market,
  non-`daily` timeframe, invalid `assetType`, or invalid `purpose`) returns `status: "blocked"`
  before any bar mapping is attempted.
- **Mocked ready path**: an enabled policy with valid mocked normalized bars returns `status:
  "ready"`, `ok: true`, and a non-empty `OhlcBar[]`.
- **Source mapping**: every mapped bar carries `source: "kis-normalized"`, `market: "KR"`, and
  the requested `symbol`.
- **NaN/Infinity safety**: no result produced by the mocked adapter or the disabled foundation
  contains a NaN or Infinity value anywhere in its structure.
- **Raw KIS field safety**: no mocked adapter output, fixture, or result contains any raw KIS
  provider response field name.
- **Secret safety**: no mocked adapter output contains a token, app key, app secret, or other
  secret-looking value.

## 5. Preserved Boundaries

- No KIS call made anywhere in this phase.
- No KIS provider/client module (`src/lib/server/providers/kis/**`, `kisClient.ts`) imported by
  any new or modified file.
- No API route added or modified.
- No `/chart-ai` UI change — `src/pages/chart-ai.astro` was not touched.
- No DB or cache runtime added.
- No SQL or migration run or added.
- No auth or usage guard runtime added.
- No external AI call made or referenced.
- No public KIS data exposed; no `source=live`; no `source=auto` literal produced anywhere.
- No account/trading/order/balance API referenced.
- No Vercel env changes.
- No deployment performed.
- No `git push` performed.
- No dependency or devDependency changes.
- No actual/real market values used anywhere — mocked fixtures are fixed synthetic arithmetic
  only.
- No `.env`/secret file read.

## 6. Validation

All required commands were run for real against the mocked adapter and the preserved Phase
3EY-A foundation; results are recorded here after the full suite completed. The 30-assertion
committed smoke script exercises the real TypeScript source through a temp-directory copy with
rewritten relative imports, and the 72-check static checker gates file presence, contract
shape, preserved-boundary phrasing, and allowed-changed-path scope. See the final phase report
for the itemized pass/fail list of every command in the required validation suite, run in the
exact specified order, including `npm run build` and `git diff --check`.

## 7. Recommended Next Phase

- **Recommended**: Phase 3EY-C — Auth and Usage Guard Plan for Similarity Execution.
- **Alternative**: Phase 3EX-E — Similarity Result UI Owner Review and Polish.
