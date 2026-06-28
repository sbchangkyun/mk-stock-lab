# Phase 3EA - Real FX Adapter Mocked-First Implementation Result

## 1. Status

Implemented - mocked-first FX adapter foundation ready; no live provider calls.

## 2. Background

Phase 3DZ defined the FX provider-selection criteria, narrow USD/KRW-first MVP, provider-neutral result contract, freshness/error policy, and owner decision gate. It did not select a real FX provider. Phase 3EA implements only the safe provider-neutral foundation and deterministic mocked behavior. Real-provider authentication, credentials, endpoints, pricing, terms, live calls, and production enablement remain outside this phase.

## 3. Implemented Scope

- **Provider-neutral FX types**: `fxTypes.ts` defines supported currencies, requests, normalized snapshots, sources, stale states, safe error codes, usable snapshots, and success/failure results.
- **FX normalization helpers**: `fxAdapter.ts` normalizes currency symbols and timestamps, validates finite positive rates, creates unavailable and identity snapshots, derives inverse rates, tests usability, and returns safe unsupported-pair results.
- **Mocked FX adapter update**: `fxMockAdapter.ts` now consumes the provider-neutral types/helpers while preserving the fixed synthetic USD/KRW rate of `1350`.
- **Identity pair behavior**: KRW/KRW and USD/USD resolve locally to `1` before the canonical mocked-rate path.
- **Derived inverse behavior**: KRW/USD is derived as `1 / 1350` from the normalized USD/KRW snapshot with the same timestamp and freshness state.
- **Error classification**: unsupported currency input maps to `FX_SYMBOL_UNSUPPORTED`; invalid rate or timestamp maps to `FX_RESPONSE_UNEXPECTED`; unavailable snapshots contain no raw payload.
- **Portfolio valuation alignment**: the existing valuation helper now derives its narrow input type from `FxRateSnapshot`; computation and public behavior are unchanged.
- **Checker**: `scripts/check_phase_3ea_real_fx_adapter_mocked_first_contract.mjs` performs static source checks plus bundled deterministic execution of the local TypeScript modules.
- **Package command**: `npm run check:phase-3ea-real-fx-adapter-mocked-first`.

No `fxLiveAdapter.ts` skeleton was added because no provider is selected and a fail-closed unused client would add no behavior beyond the normalized unavailable helpers.

## 4. Runtime Behavior Preserved

- **Public source=fixture default**: preserved.
- **Public source=live disabled**: preserved; the existing local owner-preview triple gate is unchanged and public live access is not enabled.
- **source=auto deferred**: preserved as unsupported.
- **Portfolio API behavior**: unchanged; it does not import either FX adapter or the mixed-currency FX valuation helper.
- **Portfolio UI behavior**: unchanged.
- **No real FX provider selected**: no account, SDK, endpoint, credential, or provider response schema was added.
- **No live FX calls**: none were made or implemented.
- **No live KIS calls**: none were made.

## 5. Mocked FX Contract

- **USD/KRW**: succeeds with deterministic synthetic rate `1350`.
- **KRW/USD**: succeeds with the finite positive inverse `1 / 1350`, derived from the USD/KRW snapshot.
- **KRW/KRW**: identity rate `1`, resolved locally.
- **USD/USD**: identity rate `1`, resolved locally.
- **Unsupported pairs**: fail safely with `FX_SYMBOL_UNSUPPORTED` and `staleState: 'unavailable'`.
- **staleState**: mocked usable rates, including identity rates, remain `sample`; invalid/unavailable data uses `unavailable`.
- **source**: usable mocked data remains `mocked`; unavailable normalized snapshots use `unavailable`.
- **timestamp**: the deterministic mocked timestamp is normalized to `2026-01-01T00:00:00.000Z`; missing or invalid provider-style timestamps become unavailable.
- **unavailable behavior**: rate and timestamp are null, a safe normalized error code is present, and no raw payload or provider error body is exposed.

Mocked rates are synthetic test data and must not be described as live, current, or real-time.

## 6. Safety

- **No secrets**: no secret values, provider keys, KIS keys, tokens, or account identifiers were read or recorded.
- **No .env reads**: no environment or secret file was read.
- **No fetch**: FX runtime modules contain no fetch call; the checker blocks `globalThis.fetch`.
- **No Supabase**: no client, row, Storage, or database access.
- **No SQL/migration**: none.
- **No Vercel changes**: no environment, project, or domain change.
- **No deployment**: none.
- **No push**: none.

## 7. Validation

- Phase 3EA mocked-first checker: PASS, 124/124.
- Phase 3DZ provider-plan checker: PASS, 158/158.
- Phase 3DY continuation-plan checker: PASS, 115/115.
- Existing KIS/FX mocked-adapter checker: PASS, 119/119.
- Portfolio live-preview API checker: PASS, 110/110.
- Production-domain checker: PASS, 33/33.
- Geometry guard dry-run: PASS (`DRY_RUN`); no browser or network request.
- Build: PASS.
- `git diff --check`: PASS.
- Supplemental `npx tsc --noEmit`: FAIL on the pre-existing, out-of-scope `src/pages/api/news/market-feed.ts:72` `fetchFn` options-type mismatch; Phase 3EA does not change that file, and the required build passes.

## 8. Next Phase

Recommended next phase: **Phase 3EB - Portfolio Mixed-Currency Owner Preview API**.

Phase 3EB should remain mocked-first and owner-preview-only unless the owner separately confirms provider category, account/key ownership, commercial terms, paid-plan acceptability, MVP pair scope, freshness/stale policy, and live-call authorization. A provider-gated path may instead be introduced in a separately scoped Phase 3EA-HF1 after those decisions. Public production, `source=auto`, and live calls by Codex remain blocked.
