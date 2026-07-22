# Phase 3ES — Owner-Local KIS OHLC Smoke Preparation and Execution Result

## 1. Status

`PASS_WITH_OWNER_LOCAL_RUN` — Owner-local KIS OHLC smoke.

The owner ran the prepared owner-local OHLC smoke locally and it returned `PASS` for KR `005930`
through the verified `KR_STOCK_DAILY_OHLC` endpoint, proving owner-local KIS OHLC connectivity works
and produces a renderable, sanitized `NormalizedOhlcSeries`. See §5.3 for the sanitized owner-run
evidence.

For history, the earlier automated (non-interactive) session in this same phase was `BLOCKED`
because live KIS credential env values and the three explicit owner-local OHLC smoke flags
(`KIS_OWNER_LOCAL_SMOKE`, `KIS_ALLOW_LIVE_QUOTE`, `KIS_ENABLE_LIVE_QUOTES=true`) were not present in
that automated environment. That was a credential/flag availability block only — never an
endpoint-verification failure and never an authentication failure. The endpoint verification
recorded in §3 remains valid and unchanged; it was already correct at the time of the automated
block and is what allowed the owner-run smoke to proceed to a live call at all. The owner-run PASS
supersedes the automated-session BLOCKED result as the phase decision. This matches the accepted
Phase 3EO precedent for automated-session smoke attempts being superseded by an owner-run result.

No actual OHLC price values are recorded anywhere in this document, in either the automated-session
attempt or the owner-run attempt.

Starting HEAD: `bab2119` (`feat: add kis ohlc mocked foundation`). Owner-run PASS recorded against
HEAD `d84884b` (`feat: add owner local kis ohlc smoke`).

## 2. Background

- Phase 3ER implemented the normalized OHLC contract, the OHLC provider interface, the deterministic
  mocked OHLC provider, and a KIS OHLC endpoint registry skeleton with all endpoints unverified.
- This phase first verified the official KR domestic daily/weekly/monthly/yearly OHLC endpoint
  against the official `koreainvestment/open-trading-api` sample repository, then implemented the
  full owner-local OHLC smoke chain, mirroring the Phase 3EO/3EN owner-local quote smoke pattern.
- Chart AI's quote preview remains owner-reviewed PASS (Phase 3EP-OWNER-REVIEW-CLOSEOUT); the main
  candlestick chart remains sample/mocked OHLC data and is unchanged by this phase.

## 3. Official Endpoint Verification

- Endpoint title: KIS domestic daily/weekly/monthly/yearly price inquiry
  (`inquire-daily-itemchartprice`).
- endpointKey: `KR_STOCK_DAILY_OHLC` (and `KR_ETF_DAILY_OHLC`, inferred by precedent from the
  existing `KR_ETF_QUOTE` domestic-contract reuse pattern).
- Path: `/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice`.
- tr_id verification status: `verified-official-docs` — `FHKST03010100`, with
  `FID_COND_MRKT_DIV_CODE='J'`, six-digit `FID_INPUT_ISCD`, `FID_INPUT_DATE_1`/`FID_INPUT_DATE_2`
  (`YYYYMMDD`), `FID_PERIOD_DIV_CODE='D'`, `FID_ORG_ADJ_PRC='0'`.
- Source note: verified directly against the official KIS Developers portal endpoint listing and the
  `koreainvestment/open-trading-api` sample repository's `inquire_daily_itemchartprice` function.
- Intraday (`inquire-time-itemchartprice`) and US OHLC endpoints remain `unverified` and are
  intentionally NOT used for a live smoke in this phase, per explicit phase scope. No guessed
  endpoint values were used for any unverified endpoint.

## 4. Implementation Scope

- Endpoint registry: `src/lib/server/providers/kis/kisOhlcEndpointRegistry.ts` (KR daily endpoints
  marked `verified-official-docs`; intraday/US endpoints remain `unverified`).
- Request descriptor: `src/lib/server/providers/kis/kisOhlcRequest.ts` (endpoint-key resolution and
  verified-only KR daily query-parameter construction with period-to-date-range lookback mapping).
- Sanitized mapper: `src/lib/server/providers/kis/kisOhlcMapper.ts` (sanitized-point-to-
  `NormalizedOhlcSeries` mapping, ascending sort by `dateTime`, and a blocked/error fallback series
  builder).
- Narrow kisClient transport: `src/lib/server/providers/kisClient.ts` extended with
  `getKisDomesticDailyOhlcSeries` (reuses existing config/token/parsing helpers; performs the single
  network call for this endpoint; the caller supplies the fully-built FID_* query).
- Owner-local smoke client: `src/lib/server/providers/kis/kisOwnerLocalOhlcClient.ts`
  (`runOwnerLocalKisOhlcSmoke`, gate + endpoint-verification + KR-only + env-presence checks before
  any transport call; PASS/FAIL quality gate requires `pointCount >= 2`, renderable series, and
  open/high/low/close each present in at least two points).
- Smoke script: `scripts/kis_owner_local_ohlc_smoke.mjs` (three-flag gate, esbuild bundling, prints a
  sanitized summary only, exits 0 on BLOCKED/PASS and 1 on FAIL/script error).
- `package.json`: added `check:phase-3es-owner-local-kis-ohlc-smoke` and
  `smoke:kis-owner-local-ohlc` script entries. No new dependency added.
- This result document and the planning changelog entry.
- Static/behavioral checker: `scripts/check_phase_3es_owner_local_kis_ohlc_smoke_contract.mjs`.
- `src/pages/chart-ai.astro` and all Chart AI UI files: untouched. No public OHLC API route added.
  No Supabase/SQL/migration changes. No Vercel env changes. No deployment. No push.

## 5. Smoke Execution

- Target market: KR.
- Target symbol: `005930`.
- Asset type: stock.
- Target period: `1m`.
- Smoke command form (values are not shown; set them in your own shell):
  - `KIS_OWNER_LOCAL_SMOKE=1 KIS_ALLOW_LIVE_QUOTE=1 KIS_ENABLE_LIVE_QUOTES=true node scripts/kis_owner_local_ohlc_smoke.mjs --symbol 005930 --market KR --asset-type stock --period 1m`
  - PowerShell: set `$env:KIS_OWNER_LOCAL_SMOKE`, `$env:KIS_ALLOW_LIVE_QUOTE`,
    `$env:KIS_ENABLE_LIVE_QUOTES="true"`, then run
    `npm run smoke:kis-owner-local-ohlc -- --symbol 005930 --market KR --asset-type stock --period 1m`.

### 5.1 Automated-session attempt (retained note; superseded by §5.3)

Sanitized fields only (no prices, no raw response):

- Decision: `BLOCKED`.
- symbol: `005930`, market: `KR`, assetType: `stock`, period: `1m`.
- endpointKey: `KR_STOCK_DAILY_OHLC`, endpointVerified: `true`.
- HTTP status class: `not-run` (no live request was attempted).
- normalizedSeriesSafe: `true`.
- pointCount: `0`, renderable: `false`.
- Field-presence booleans: open `false`, high `false`, low `false`, close `false`, volume `false`.
- source: `unavailable`, freshness: `unavailable`, isLive: `false`, providerStatus: `blocked`.
- rawResponsePrinted: `false`, secretsPrinted: `false`.
- Reason: required KIS credential env names (`KIS_APP_KEY`, `KIS_APP_SECRET`, `KIS_BASE_URL`) and the
  three explicit owner-local smoke flags were not present in the automated session, so the smoke
  client blocked before any network call. The gate opened and the endpoint resolved as verified,
  confirming the pipeline was smoke-ready. No actual OHLC values were recorded.

### 5.2 Injected-transport behavioral confirmation (no network, no secrets)

To confirm the mapper and quality-gate logic before relying on a real owner-local run, the owner-local
client was exercised with an injected fake transport (dependency-injection pattern, no network call,
no real data):

- With a 3-point fake series (one point containing an invalid `dateTime` and invalid numeric fields):
  Decision `PASS`, pointCount `3`, renderable `true`, all field-presence booleans `true`,
  normalizedSeriesSafe `true`, source `kis-local`, freshness `delayed`, isLive `true`,
  providerStatus `ok`. Confirms invalid values map to `null` safely rather than crashing or leaking a
  raw value, and the series still qualifies as renderable.
- With `hasEnvValue` forced to `false`: Decision `BLOCKED`, matching the expected missing-env path.
- With a forced transport failure (`PROVIDER_UNAVAILABLE`): Decision `FAIL`, `pointCount: 0`,
  `renderable: false`, `source: unavailable`, confirming the fallback-series path is safe.

No real KIS credentials, network calls, or raw responses were involved in this confirmation step.

### 5.3 Owner-run attempt (PASS — supersedes §5.1)

Sanitized fields only (no prices, no raw response):

- Decision: `PASS`.
- symbol: `005930`, market: `KR`, assetType: `stock`, period: `1m`.
- endpointKey: `KR_STOCK_DAILY_OHLC`, endpointVerified: `true`.
- HTTP status class: `2xx`.
- normalizedSeriesSafe: `true`.
- pointCount: `27`, renderable: `true`.
- Field-presence booleans: open `true`, high `true`, low `true`, close `true`, volume `true`.
- source: `kis-local`, freshness: `delayed`, isLive: `true`, providerStatus: `ok`.
- rawResponsePrinted: `false`, secretsPrinted: `false`.
- message: "Owner-local KIS OHLC smoke completed."
- Interpretation: proves owner-local KIS OHLC connectivity works for KR `005930` via the verified
  `KR_STOCK_DAILY_OHLC` endpoint, producing a renderable, sanitized 27-point daily series with all
  OHLCV fields present.

- No actual OHLC prices were recorded in the automated-session attempt, the injected-transport
  confirmation, or the owner-run attempt; no raw response was printed or committed in any of them.

## 6. Sanitization

- No app key recorded or printed.
- No app secret recorded or printed.
- No access token recorded or printed.
- No authorization header recorded or printed.
- No raw request recorded or printed.
- No raw response recorded or printed.
- No account number used; `KIS_ACCOUNT_NO` not referenced.
- No raw provider payload committed.
- No actual OHLC price values committed anywhere in this document or in committed code.
- No `.env` content read into docs.

## 7. Chart AI Boundary

- `src/pages/chart-ai.astro` and Chart AI UI/preview files: unchanged.
- No OHLC wiring added to Chart AI in this phase.
- The existing sample/mocked candlestick chart is preserved unchanged.
- No public OHLC API route added.
- No production call path added; public production cannot trigger KIS live OHLC behavior.
- No deployment.
- No push.

## 8. Validation

- `npm run check:phase-3es-owner-local-kis-ohlc-smoke`: PASS (70/70).
- `npm run check:phase-3er-kis-ohlc-contract-mocked-adapter`: 117/120 — known pre-existing
  assumption break, unrelated to this phase's own scope (see §9).
- `npm run check:phase-3eq-kis-chart-ohlc-feasibility-plan`: 64/66 — known pre-existing open-diff
  checker fragility, unrelated to this phase's own scope (see §9).
- `npm run check:phase-3ep-owner-review-closeout`: 30/32 — known pre-existing open-diff checker
  fragility, unrelated to this phase's own scope (see §9).
- `npm run check:phase-3ep-chart-ai-owner-local-quote-preview-wiring`: PASS (49/49).
- `npm run check:phase-3eo-owner-local-kis-quote-smoke-closeout`: PASS (36/36).
- `npm run check:phase-3eo-owner-local-kis-quote-smoke`: PASS (58/58).
- `npm run check:phase-3en-kis-quote-adapter-owner-local-gate`: PASS (87/87).
- `npm run check:provider-boundaries`: PASS.
- `npm run check:kis-runtime-guard`: PASS.
- `npm run check:kis-error-fallback`: PASS.
- `npm run check:kis-quote-adapter-mocked`: 100/101 — known pre-existing unrelated failure (see §9).
- `npm run check:chart-ai-ux-skeleton`: PASS (82/82).
- `npm run check:mobile-baseline`: PASS (74/74).
- `npm run check:production-domain`: PASS (33/33).
- `npm run build`: PASS.
- `git diff --check`: PASS (line-ending warnings only, exit code 0).
- `npm run guard:production-mobile-geometry`: `DRY_RUN`; no browser and no network.

## 9. Known Legacy Checker Note

### 9.1 `check:kis-quote-adapter-mocked` — 100/101 (pre-existing, unrelated)

- The failing check is "Valuation route (when present) is fixture-only — no live source", failing
  because `src/pages/api/portfolio/valuation.ts` contains the `source=live` string.
- That file was NOT changed in Phase 3ES; the check depends only on that file, so its result is
  unchanged from the starting HEAD.
- It is unrelated to Phase 3ES and was not fixed in this phase; the checker was not weakened.

### 9.2 `check:phase-3er-kis-ohlc-contract-mocked-adapter` — 117/120 (pre-existing assumption break)

- Failing checks: "Registry marks endpoints unverified", "resolveVerifiedKisOhlcEndpoint(KR_STOCK_DAILY_OHLC)
  returns null", "resolveVerifiedKisOhlcEndpoint(KR_ETF_DAILY_OHLC) returns null".
- The Phase 3ER checker was written when all OHLC endpoints were intentionally `unverified`, and it
  asserts that state directly. Phase 3ES's entire purpose was to verify the KR domestic daily OHLC
  endpoint against official docs, which is an intentional, in-scope, spec-required state change, not
  a regression. The Phase 3ER checker's assumption is now historically stale by design.
- Not fixed in this phase, consistent with the "do not fix legacy checkers" boundary; the checker was
  not weakened.

### 9.3 `check:phase-3eq-kis-chart-ohlc-feasibility-plan` and `check:phase-3ep-owner-review-closeout` — pre-existing open-diff fragility

- Failing checks: "No src runtime file changed in this phase" / "No src file changed in this
  closeout" and their provider-file equivalents.
- Both of these older checkers compute their phase-scoped git diff from a single pinned starting
  commit with **no pinned ending commit**, so the diff always extends to the current working tree.
  Any later phase that touches `src/` (Phase 3ER's mocked-adapter foundation, and now Phase 3ES's
  OHLC smoke implementation) will trip their "no runtime file changed" assumption, which was only
  ever valid at the time each checker was authored. Later checkers in this codebase (e.g. Phase
  3EO's and 3EP's) correctly pin both a starting and an ending commit to avoid this; these two did
  not.
- Not fixed in this phase, consistent with the "do not fix legacy checkers" boundary; neither checker
  was weakened or modified.

### 9.4 Recommended cleanup

- Recommended separate cleanup: Phase 3EN-HF1 — Legacy KIS Checker Cleanup, if the owner wants zero
  known checker failures. That cleanup should also pin an ending commit on the Phase 3EQ and Phase
  3EP-owner-review-closeout checkers' git diffs so they stop breaking on every later phase's runtime
  changes.

## 10. Recommended Next Phase

The owner-run smoke PASSed through the verified `KR_STOCK_DAILY_OHLC` endpoint with a renderable
27-point series and all OHLCV fields present, so live owner-local KIS OHLC connectivity is proven.

Recommended: Phase 3ET — Chart AI Owner-Local OHLC Preview Wiring (mirroring Phase 3EP's owner-local
quote preview pattern, with the same intermittent-provider-unavailable fallback handling established
in Phase 3EO/3EP).

See `docs/planning/phase_3es_owner_local_kis_ohlc_smoke_closeout_result_v0.1.md` for the formal
closeout of this phase.

Contingencies retained for reference (not expected, since the owner-run already PASSed):

- If a future owner-local run is BLOCKED due to endpoint verification: Phase 3ES-HF1 — KIS OHLC
  Endpoint Verification Hotfix.
- If a future run FAILs due to auth/headers: Phase 3ES-HF2 — KIS OHLC Auth/Header Smoke Fix.

Alternative: Phase 3EN-HF1 — Legacy KIS Checker Cleanup.

Rationale: owner-local OHLC connectivity is confirmed; Phase 3ET should wire the preview behind the
same owner-local gate while preserving the sample/mocked chart for public production.
