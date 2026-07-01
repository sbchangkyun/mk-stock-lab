# Phase 3EO — Owner-Local KIS Quote Smoke Preparation and Execution Result

## 1. Status

PASS_WITH_INTERMITTENT_PROVIDER_NOTE — Owner-local KIS quote smoke.

The owner ran the prepared owner-local smoke locally. The first run returned PASS for KR `005930`
through the verified `KR_STOCK_QUOTE` endpoint, proving owner-local KIS quote connectivity works. An
immediate retry returned a transient `PROVIDER_UNAVAILABLE` (5xx); this is recorded as an
intermittent provider-availability note, not as a failure of Phase 3EO.

For completeness, the earlier automated (non-interactive) session was BLOCKED because live KIS
credentials and explicit smoke flags are not present there; that block was a credential/flag
availability block, never an endpoint-verification block or an authentication failure. The
owner-run PASS supersedes it as the phase decision.

Starting HEAD: `75621c6` (`feat: add kis owner local quote gate`).

## 2. Background

- Phase 3EN implemented the owner-local gate, env-name contract, request descriptor, sanitized
  mapper, and the gated (non-live) KIS provider boundary.
- The owner confirmed `KIS_APP_KEY` / `KIS_APP_SECRET` / `KIS_ACCESS_TOKEN` readiness and reported
  prior API communication test history.
- This phase is the first permitted live KIS quote smoke, strictly limited to an owner-local
  smoke script and never wired to public UI.

## 3. Implementation Scope

- Endpoint registry: `src/lib/server/providers/kis/kisQuoteEndpointRegistry.ts`.
- Owner-local smoke client: `src/lib/server/providers/kis/kisOwnerLocalQuoteClient.ts`.
- Smoke script: `scripts/kis_owner_local_quote_smoke.mjs`.
- Sanitized result template: `docs/planning/phase_3eo_owner_local_kis_quote_smoke_result_template_v0.1.md`.
- This result document.
- Static/smoke checker: `scripts/check_phase_3eo_owner_local_kis_quote_smoke_contract.mjs`.
- Env-name contract extended with smoke flag names (names only).
- No public API route, no UI wiring, no deployment, no push.

## 4. Official Endpoint Verification

- Endpoint title: KIS domestic current-price inquiry (`inquire-price`).
- endpointKey: `KR_STOCK_QUOTE` (and `KR_ETF_QUOTE`, which reuses the same domestic contract).
- Path: `/uapi/domestic-stock/v1/quotations/inquire-price`.
- tr_id verification status: `verified-official-docs` — `FHKST01010100`, with
  `FID_COND_MRKT_DIV_CODE='J'` and six-digit `FID_INPUT_ISCD`.
- Source note: verified via the existing approved adapter `src/lib/server/providers/kisClient.ts`
  and `docs/planning/phase_3i_kis_quote_read_result_v0.1.md`, which were previously derived from
  official KIS documentation.
- US endpoints (`US_STOCK_QUOTE`, `US_ETF_QUOTE`) remain `unverified` and are NOT used for a live
  smoke. No guessed endpoint values were used.

## 5. Smoke Execution

- Target market: KR.
- Target symbol: `005930`.
- Asset type: stock.
- Smoke command form (values are not shown; set them in your own shell):
  - `KIS_OWNER_LOCAL_SMOKE=1 KIS_ALLOW_LIVE_QUOTE=1 node scripts/kis_owner_local_quote_smoke.mjs --symbol 005930 --market KR --asset-type stock`
  - PowerShell: set `$env:KIS_OWNER_LOCAL_SMOKE`, `$env:KIS_ALLOW_LIVE_QUOTE`, then run the same node command.

### 5.1 Automated-session attempt (retained note)

- Decision (automated session): `BLOCKED`.
- HTTP status class: `not-run` (no live request was attempted).
- Reason: required KIS credential env names were not present in the automated session, so the smoke
  client blocked before any network call. The gate opened and the endpoint resolved as verified,
  confirming the pipeline was smoke-ready. No actual prices were recorded.

### 5.2 Owner-run first attempt (PASS)

Sanitized fields only (no prices, no raw response):

- Decision: `PASS`.
- symbol: `005930`, market: `KR`, endpointKey: `KR_STOCK_QUOTE`, endpointVerified: `true`.
- HTTP status class: `2xx`.
- normalizedSnapshotSafe: `true`.
- source: `kis-local`, freshness: `delayed`, isLive: `true`, providerStatus: `ok`.
- Field-presence booleans: lastPrice `true`, previousClose `true`, change `true`, changeRate `true`,
  volume `true`.
- rawResponsePrinted: `false`, secretsPrinted: `false`.
- Interpretation: proves owner-local KIS quote connectivity works for KR `005930` via the verified
  `KR_STOCK_QUOTE` endpoint.

### 5.3 Owner-run immediate retry (intermittent provider note)

Sanitized fields only:

- Decision: `FAIL` on the retry, recorded as an intermittent provider-availability note.
- symbol: `005930`, market: `KR`, endpointKey: `KR_STOCK_QUOTE`, endpointVerified: `true`.
- HTTP status class: `5xx`.
- normalizedSnapshotSafe: `true`.
- source: `unavailable`, freshness: `unavailable`, isLive: `false`, providerStatus: `error`.
- Field-presence booleans: all `false`.
- message: transient `PROVIDER_UNAVAILABLE`.
- Interpretation: an immediate retry hit a transient upstream provider unavailability. Because the
  first run succeeded through the same verified endpoint, this is treated as an intermittent
  provider-availability note, not a Phase 3EO failure. The client returned a client-safe unavailable
  snapshot with no leaked data.

- No actual prices were recorded in either run; no raw response was printed or committed.

## 6. Sanitization

- No app key recorded or printed.
- No app secret recorded or printed.
- No access token recorded or printed.
- No authorization header recorded or printed.
- No raw request recorded or printed.
- No raw response recorded or printed.
- No account number used.
- No raw provider payload committed.
- No `.env` content read into docs.

## 7. Public Boundary

- No public API route added.
- No Chart AI quote preview wired.
- No production call path added; public production cannot trigger KIS live behavior.
- No deployment.
- No push.

## 8. Validation

- `npm run check:phase-3eo-owner-local-kis-quote-smoke`: PASS.
- `npm run check:phase-3en-kis-quote-adapter-owner-local-gate`: PASS.
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
- `npm run check:kis-quote-adapter-mocked`: 100/101 — known pre-existing unrelated failure (see §9).
- `npm run check:chart-ai-ux-skeleton`: PASS.
- `npm run check:mobile-baseline`: PASS.
- `npm run check:production-domain`: PASS.
- `npm run build`: PASS.
- `git diff --check`: PASS.
- `npm run guard:production-mobile-geometry`: `DRY_RUN`; no browser and no network.

## 9. Known Legacy Checker Note

- `check:kis-quote-adapter-mocked` remains `100/101`.
- The failing check is "Valuation route (when present) is fixture-only — no live source", failing
  because `src/pages/api/portfolio/valuation.ts` contains the `source=live` string.
- That file was NOT changed in Phase 3EO; the check depends only on that file, so its result is
  unchanged from the starting HEAD.
- It is unrelated to Phase 3EO and was not fixed in this phase; the checker was not weakened.
- Recommended separate cleanup: Phase 3EN-HF1 — Legacy KIS Checker Cleanup, if the owner wants zero
  known checker failures.

## 10. Recommended Next Phase

The owner-run smoke PASSed on the first attempt through the verified `KR_STOCK_QUOTE` endpoint, so
live owner-local KIS quote connectivity is proven. The immediate retry's transient
`PROVIDER_UNAVAILABLE` is an intermittent provider-availability note, not a blocker.

Recommended: Phase 3EP — Chart AI Owner-Local Quote Preview Wiring, with an intermittent-provider
fallback path so a transient `PROVIDER_UNAVAILABLE` degrades to a safe unavailable state rather than
an error surface.

Contingencies retained for reference:

- If a future owner-local run is BLOCKED due to endpoint verification (not expected for KR):
  Phase 3EO-HF1 — KIS Endpoint Verification Hotfix.
- If a future run FAILs due to auth/headers: Phase 3EO-HF2 — KIS Auth/Header Smoke Fix.

Alternative: Phase 3EN-HF1 — Legacy KIS Checker Cleanup.

Rationale: Owner-local connectivity is confirmed; Phase 3EP should wire the preview behind the same
owner-local gate while explicitly handling intermittent provider availability.
