# Phase 3ER — KIS OHLC Contract and Mocked Adapter Foundation Result

## 1. Status
Implemented — normalized OHLC contract and mocked adapter foundation ready.

## 2. Background
- Phase 3EQ completed the KIS Chart/OHLC feasibility plan and recommended Phase 3ER before Phase 3ES.
- Chart AI quote preview is owner-reviewed and PASS (Phase 3EP-OWNER-REVIEW-CLOSEOUT).
- Main chart still uses sample/mocked OHLC.
- This phase creates the normalized OHLC contract and a deterministic mocked adapter required before the first owner-local KIS OHLC smoke.

## 3. Implemented Scope
- normalized OHLC contract (`src/lib/market-data/normalizedOhlc.ts`)
- OHLC provider interface (`src/lib/server/market-data/ohlcProvider.ts`)
- deterministic mocked OHLC provider (`src/lib/server/market-data/mockedOhlcProvider.ts`)
- KIS OHLC endpoint registry skeleton (`src/lib/server/providers/kis/kisOhlcEndpointRegistry.ts`)
- blocked KIS OHLC provider skeleton (`src/lib/server/providers/kis/kisOhlcProvider.ts`)
- static checker (`scripts/check_phase_3er_kis_ohlc_contract_mocked_adapter_contract.mjs`)
- no live KIS
- no chart replacement
- no public API route

## 4. Normalized OHLC Contract
`NormalizedOhlcPoint` fields: `dateTime`, `open`, `high`, `low`, `close`, `volume` — each numeric
field is `number | null`; invalid or missing values coerce to `null` via `toNullableOhlcNumber`
and never produce `NaN`.

`NormalizedOhlcSeries` fields: `symbol`, `market`, `assetType`, `currency`, `period`, `interval`,
`source`, `freshness`, `isLive`, `providerStatus`, `points`, `message`, `safety`. `points` must
be in ascending `dateTime` order. `isRenderableOhlcSeries` requires at least 2 numerically valid
points before a series is treated as chartable. `safety.rawResponsePrinted`,
`safety.secretsPrinted` are always `false`, and `safety.publicProductionBlocked` is always
`true` for every series this phase produces, mirroring `normalizedQuote.ts`'s live-safety
invariants.

## 5. Mocked OHLC Adapter
`createMockedOhlcProvider()` (and the direct helper `getMockedOhlcSeries`) converts the existing
`chart-ai/mockedOhlc.ts` deterministic generator into `NormalizedOhlcSeries`. It derives every
point only from `symbol + period` using the existing FNV-1a-style hash and a seeded PRNG — no
`Math.random`, no `Date.now` dependency (the underlying series uses a fixed anchor timestamp).
Supported named samples: `005930`, `000660` (KR stock), `069500` (KR ETF), `AAPL` (US stock),
`SPY` (US ETF); any other symbol still resolves deterministically via the same fallback pattern
used by `mockedQuoteProvider.ts`. All five period controls (`1d`, `1w`, `1m`, `3m`, `1y`) are
supported, each returning enough points for the existing chart controls (24/7/22/42/56 points
respectively) in ascending `dateTime` order, always including `volume`. Every mocked series
returns `source: 'mocked'`, `freshness: 'sample'`, `isLive: false`, `providerStatus: 'sample'`,
`interval: 'sample'`.

## 6. KIS OHLC Boundary
- All six registry endpoints (`KR_STOCK_DAILY_OHLC`, `KR_ETF_DAILY_OHLC`,
  `KR_STOCK_INTRADAY_OHLC`, `KR_ETF_INTRADAY_OHLC`, `US_STOCK_DAILY_OHLC`, `US_ETF_DAILY_OHLC`)
  are marked `unverified` with `VERIFY_WITH_KIS_DOCS_*` placeholder paths/transaction ids.
- `resolveVerifiedKisOhlcEndpoint(...)` unconditionally returns `null` in this phase.
- `createKisOhlcProvider()` uses `evaluateKisOwnerLocalGate` for its gate check and
  `resolveVerifiedKisOhlcEndpoint` for its endpoint check; it never calls `fetch` and never
  reads `process.env` or `.env` files. Even when the owner-local gate is open, the provider is
  blocked by design because no endpoint is verified, so it always returns a client-safe
  unavailable series (`source: 'unavailable'`, `isLive: false`).
- First live OHLC call is deferred to Phase 3ES — Owner-Local KIS OHLC Smoke.

## 7. Chart AI Preservation
- `src/pages/chart-ai.astro` was not modified in this phase.
- Existing sample chart labels (`샘플 차트`, `샘플 OHLC·거래량 데이터`, `실제 시세 아님`) remain unchanged.
- The owner-local quote preview section (`chartAiQuotePreview`) and its gated fetch remain unchanged.
- No OHLC preview UI was added in this phase.

## 8. Safety
- No live KIS call.
- No `fetch` call in any new module.
- No `process.env` or `.env` read in any new module.
- No public OHLC API route added.
- No Chart AI chart replacement.
- No raw KIS response recorded or committed.
- No secrets recorded or printed.
- No account/trading APIs.
- No Supabase/SQL/migration changes.
- No Vercel environment changes.
- No new dependency.
- No deployment.
- No push.

## 9. Validation
All commands below were run against the working tree before commit; see the Final Report for the actual pass/fail counts recorded at execution time.

- `npm run check:phase-3er-kis-ohlc-contract-mocked-adapter`
- `npm run check:phase-3eq-kis-chart-ohlc-feasibility-plan`
- `npm run check:phase-3ep-owner-review-closeout`
- `npm run check:phase-3ep-chart-ai-owner-local-quote-preview-wiring`
- `npm run check:phase-3eo-owner-local-kis-quote-smoke-closeout`
- `npm run check:phase-3eo-owner-local-kis-quote-smoke`
- `npm run check:phase-3en-kis-quote-adapter-owner-local-gate`
- `npm run check:phase-3em-kis-quote-integration-foundation`
- `npm run check:provider-boundaries`
- `npm run check:kis-runtime-guard`
- `npm run check:kis-error-fallback`
- `npm run check:chart-ai-ux-skeleton`
- `npm run check:mobile-baseline`
- `npm run check:production-domain`
- `npm run build`
- `git diff --check`
- `npm run guard:production-mobile-geometry`

## 10. Known Legacy Checker Note
`check:kis-quote-adapter-mocked` remains at 100/101 due to the pre-existing `source=live` string
in `src/pages/api/portfolio/valuation.ts`. This file is unrelated to Chart AI/KIS OHLC work and
was not modified in this phase. Not fixed here per instructions; recommended cleanup remains
Phase 3EN-HF1.

## 11. Recommended Next Phase
Recommended: Phase 3ES — Owner-Local KIS OHLC Smoke

Alternative: Phase 3EN-HF1 — Legacy KIS Checker Cleanup

Rationale: The normalized OHLC contract and deterministic mocked adapter foundation are now
ready; Phase 3ES can verify real KIS OHLC endpoint values owner-locally (paths, transaction ids,
and parameters against official KIS documentation) without touching public UI, mirroring how
Phase 3EO first verified the quote endpoint.
