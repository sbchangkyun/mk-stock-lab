# Phase 3EB - Portfolio Mixed-Currency Owner Preview API Result

## 1. Status

Implemented - mocked FX mixed-currency owner-preview API ready; no live provider calls by Codex.

## 2. Background

Phase 3EA introduced provider-neutral FX types, normalization helpers, and deterministic mocked rates without selecting or connecting a real provider. Phase 3EB uses that foundation only behind the existing non-production owner live-preview gate plus two new explicit mocked-FX flags. The public fixture path, public Portfolio UI, real-provider decision gate, and production restrictions remain unchanged.

## 3. Implemented Scope

- **Owner-preview mixed-currency API gate**: mixed KRW/USD requests require `source="live"`, `previewMode="owner"`, `allowLiveQuotes=true`, `allowMockedFx=true`, `fxMode="mocked"`, a non-production runtime, and `baseCurrency="KRW"`.
- **Mocked FX integration**: the route calls only `getMockedFxRate('USD', 'KRW')` and passes its normalized snapshot to `buildPortfolioValuationFromQuotesWithFx()`.
- **Supported currencies**: positions are limited to KRW and USD; live-owner market/currency pairs must be KR/KRW or US/USD.
- **Unsupported currency handling**: unsupported currencies fail validation before any quote request.
- **Missing quote handling**: KR symbols may use the existing owner-gated quote path; US symbols never reach a provider and remain explicit unavailable rows.
- **Response metadata**: identifies owner-preview activation, KR-only quote scope, mocked FX source/rate/pair/sample state, missing symbols, unsupported symbols, and whether a KR quote attempt occurred.
- **Checker**: `scripts/check_phase_3eb_portfolio_mixed_currency_owner_preview_api_contract.mjs` combines static checks with bundled deterministic FX, valuation, and API execution using a local quote stub.
- **Package command**: `npm run check:phase-3eb-mixed-currency-owner-preview-api`.

## 4. Runtime Behavior Preserved

- **Public source=fixture default**: preserved with the existing resolver, validation, and response shape.
- **Public source=live disabled**: preserved; requests without the existing owner gate are rejected before any quote request.
- **source=auto deferred**: preserved as unsupported.
- **Existing KR-only owner live preview**: preserved without requiring mocked-FX flags.
- **Portfolio UI behavior**: unchanged.
- **No real FX provider**: no client, SDK, endpoint, account, key, or provider response schema was added.
- **No live FX calls**: none were implemented or run.
- **No live KIS calls by Codex**: none were run; existing owner-gated KR quote capability was not invoked during validation.

## 5. Mixed-Currency Contract

- **baseCurrency**: KRW only.
- **position currency scope**: KRW and USD; KR positions must use KRW and US positions must use USD.
- **max positions**: 10.
- **allowMockedFx**: must be exactly `true` whenever a US/USD position is present.
- **fxMode**: must be exactly `mocked` whenever mixed-currency preview is requested.
- **USD/KRW**: deterministic synthetic rate `1350`.
- **KRW/USD**: deterministic derived inverse `1 / 1350`, covered by the checker.
- **identity pairs**: KRW/KRW and USD/USD return `1`, covered by the checker.
- **unavailable rows**: US rows remain unavailable because no US quote endpoint or request-supplied sample-price contract exists.
- **aggregate total behavior**: totals are calculated only when every row has a safe quote and the FX snapshot is usable. Missing quotes or FX keep market value and unrealized PnL totals null. Deterministic internal fixtures verify conversion math without enabling fabricated API quotes.
- **response safety**: metadata uses `owner-preview`, `mocked`, `sample`, and `unavailable`; it does not expose request bodies, provider metadata, raw payloads, credentials, account data, or real-provider fields.

## 6. Safety

- **No secrets**: no provider keys, KIS keys, tokens, cookies, account identifiers, project identifiers, or raw database values were read or recorded.
- **No .env reads**: no environment or secret file was read.
- **No fetch**: no direct route or FX fetch was added; the checker blocks global fetch and uses a local quote stub.
- **No Supabase**: no database, row, Storage, or client access.
- **No SQL/migration**: none.
- **No Vercel changes**: no environment, project, domain, or link change.
- **No deployment**: none.
- **No push**: none.

## 7. Validation

- Phase 3EB mixed-currency owner-preview checker: PASS, 92/92.
- Phase 3EA mocked-first FX checker: PASS, 124/124.
- Phase 3DZ provider-plan checker: PASS, 158/158.
- Existing KIS/FX mocked-adapter checker: PASS, 119/119.
- Existing Portfolio live-preview API checker: PASS, 110/110.
- Production-domain checker: PASS, 33/33.
- Geometry guard dry-run: PASS (`DRY_RUN`); no browser or network request.
- Build: PASS.
- `git diff --check`: PASS.

## 8. Next Phase

Recommended next phase: **Phase 3EC - Owner-Run Mixed-Currency Preview Smoke**.

The owner should run only sanitized local smoke commands in that separately authorized phase. Public production, `source=auto`, US quote-provider work, and live FX provider integration remain blocked.
