# Phase 3EM — KIS Quote Integration Roadmap Reset and Local Provider Foundation Result

## 1. Status

Implemented — KIS quote integration foundation ready for mocked/local validation.

Starting HEAD: `32cdd87` (`docs: close out chart ai hf2 lx owner review`).

## 2. Background

- The owner requested faster progress toward KIS API integration instead of continuing
  documentation-only review loops.
- Recent Chart AI work (Phase 3EL-HF1 through Phase 3EL-HF2-LX) established the `/chart-ai`
  stock lookup UI surface, mocked candlestick chart, and header/sidebar layout.
- Phase 3EL-OWNER-REVIEW-HF2-LX-CLOSEOUT recorded owner review `PASS_WITH_COPY_NOTE`.
- The accepted copy note `국내 주식·ETF` → `국내/미국 주식·ETF` is applied in this phase.
- MK AI HF3 work (intro/loading/results) is deferred behind the KIS foundation track.

## 3. Implemented Scope

- Applied the eyebrow copy update on `/chart-ai`.
- Added a normalized quote snapshot contract.
- Added a quote provider request/context/interface boundary.
- Added a deterministic mocked quote provider for Korean and US stock/ETF samples.
- Added a server-only KIS provider boundary/skeleton that cannot perform a live call yet.
- No live KIS call.
- No public API route.
- No UI quote wiring.
- No deployment/push.

## 4. Quote Contract

- File: `src/lib/market-data/normalizedQuote.ts` (new; the existing `QuoteSnapshot` in
  `src/lib/server/providers/types.ts` remains for the legacy KIS/fixture path, so a distinct
  normalized contract was added rather than mutating the established provider type).
- Fields: `symbol`, `displayName`, `market`, `exchange`, `assetType`, `currency`, `lastPrice`,
  `previousClose`, `change`, `changeRate`, `volume`, `asOf`, `source`, `freshness`, `isLive`,
  `isTradable`, `provider`, `providerStatus`, `label`, `disclaimer`.
- Markets: `KR` and `US`.
- Asset types: `stock`, `etf`, `etn`, `index`, `unknown`.
- Currencies: `KRW`, `USD`, or a passthrough string.
- Source/freshness: `source` ∈ {`fixture`, `mocked`, `kis-local`, `unavailable`};
  `freshness` ∈ {`sample`, `fresh`, `delayed`, `stale`, `unavailable`}.
- Live-safety invariants: mocked snapshots use `source='mocked'`, `freshness='sample'`,
  `isLive=false`; blocked/unavailable snapshots use `source='unavailable'`, `isLive=false`;
  no snapshot carries secrets, raw provider payloads, account data, cookies, or tokens.
  `isLiveSafeQuoteSnapshot()` encodes the invariant for callers.

## 5. Provider Boundary

- Interface file: `src/lib/server/market-data/quoteProvider.ts`
  (`QuoteProviderRequest`, `QuoteProviderContext`, `QuoteProvider`).
- Mocked provider file: `src/lib/server/market-data/mockedQuoteProvider.ts`.
  - Deterministic output derived only from `symbol + market` via a stable FNV-1a hash.
  - No `Math.random`, no network, no credentials, no dependency.
  - Supports `005930`, `000660`, `069500`, `AAPL`, and `SPY` samples, and resolves any other
    symbol to a deterministic sample snapshot from the request fields.
  - Always returns `source='mocked'`, `freshness='sample'`, `isLive=false`,
    `provider='mocked'`, `providerStatus='sample'`.
- KIS boundary file: `src/lib/server/providers/kis/kisQuoteProvider.ts`.
  - Same `QuoteProvider` interface.
  - With `allowNetwork: false` it returns a `blocked` snapshot
    (`KIS local smoke required`).
  - With `allowNetwork: true` it still returns a controlled `blocked` snapshot because the
    live adapter is not implemented until the owner-local smoke phase.
  - No `fetch`, no endpoint URLs, no `process.env`, no `.env` read, no credentials.
- `allowNetwork` rule: network permission is explicit on the context; providers never read the
  environment, so public production cannot accidentally trigger a live KIS call.
- Owner-local mode: `QuoteProviderContext.mode` includes `owner-local`, reserved for the future
  gated adapter; it is not wired to any caller in this phase.

## 6. Accelerated Roadmap

Phase 3EM:
- quote contract and provider foundation;
- copy update.

Phase 3EN:
- KIS adapter implementation behind owner-local gate;
- token/request mapping;
- still no public UI wiring.

Phase 3EO:
- owner-local KIS quote smoke;
- first real KIS call happens here only;
- sanitized result template;
- no secrets committed.

Phase 3EP:
- Chart AI quote preview wiring;
- still local/owner gated;
- public production blocked.

Phase 3EQ:
- KIS chart/OHLC feasibility check.

Phase 3ER:
- Korean/US stock and ETF symbol expansion.

## 7. Deferred Scope

- live KIS quote call;
- KIS OAuth/token handling;
- KIS chart/OHLC;
- public quote API;
- Chart AI quote preview UI;
- US symbol search UI;
- MK AI intro/loading/results;
- deployment/push.

## 8. Safety Confirmation

- no live KIS call;
- no FX call;
- no provider payload committed;
- no env read;
- no secrets;
- no Supabase/SQL/migration;
- no Vercel changes;
- no deployment;
- no push.

## 9. Validation

- `npm run check:phase-3em-kis-quote-integration-foundation`: PASS.
- `npm run check:phase-3el-owner-review-hf2-lx-closeout`: PASS.
- `npm run check:phase-3el-hf2-lx-chart-header-sidebar-layout-hotfix`: PASS.
- `npm run check:phase-3el-hf2-mocked-candlestick-chart-volume-foundation`: PASS.
- `npm run check:phase-3el-hf1-sx2-chart-ai-compact-search-panel-hotfix`: PASS.
- `npm run check:phase-3el-chart-ai-domestic-symbol-search-wiring`: PASS.
- `npm run check:phase-3ek-domestic-symbol-master-search-index-mocked-first`: PASS.
- `npm run check:phase-3ej-kis-symbol-master-quote-infrastructure-plan`: PASS.
- `npm run check:provider-boundaries`: PASS.
- `npm run check:kis-runtime-guard`: PASS.
- `npm run check:kis-error-fallback`: PASS.
- `npm run check:kis-quote-adapter-mocked`: PASS.
- `npm run check:chart-ai-ux-skeleton`: PASS.
- `npm run check:mobile-baseline`: PASS.
- `npm run check:production-domain`: PASS.
- `npm run build`: PASS.
- `git diff --check`: PASS.
- `npm run guard:production-mobile-geometry`: `DRY_RUN`; no browser and no network.

## 10. Recommended Next Phase

Recommended: Phase 3EN — KIS Quote Adapter Owner-Local Gate Implementation.

Alternative: Phase 3EO — Owner-Local KIS Quote Smoke, only if the adapter boundary is already
sufficient and the owner confirms local credential/environment readiness.

Rationale: The first real KIS call should happen in a controlled owner-local smoke phase, not in
public UI, so the adapter implementation and its gate should land before any live call.
