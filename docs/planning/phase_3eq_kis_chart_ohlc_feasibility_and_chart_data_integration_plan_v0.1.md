# Phase 3EQ — KIS Chart/OHLC Feasibility and Chart Data Integration Plan

## 1. Status

Completed — KIS chart/OHLC feasibility and integration plan ready.

Starting HEAD: `66a2388` (`docs: close out chart ai quote preview review`).

## 2. Background

- Phase 3EP owner review PASS: the owner-local KIS quote preview was reviewed locally and accepted.
- KIS owner-local quote preview works for KR `005930` through the verified quote endpoint.
- The main Chart AI candlestick chart still uses sample/mocked OHLC and volume data
  (`샘플 OHLC·거래량 데이터`, `실제 시세 아님`).
- The next product gap is real chart/OHLC data. This phase evaluates feasibility and designs the
  integration path; it does not replace the chart, wire live OHLC, or add a public OHLC route.

## 3. Official Source Verification

### 3.1 Source hierarchy used

1. Official KIS Developers API portal (reference hierarchy; not fetched in this static phase).
2. Official Korea Investment Open Trading API sample repository (reference hierarchy).
3. Existing sanitized repository code/docs previously derived from official KIS docs — used as the
   in-repo source of truth for what is already VERIFIED here.

### 3.2 Verified in-repo today (source of truth)

- The quote endpoint is verified and already implemented in `src/lib/server/providers/kisClient.ts`
  and recorded in `docs/planning/phase_3i_kis_quote_read_result_v0.1.md`:
  - Endpoint title: domestic current-price inquiry (`inquire-price`).
  - Path: `/uapi/domestic-stock/v1/quotations/inquire-price`.
  - Transaction id: `FHKST01010100`.
  - Market division: `FID_COND_MRKT_DIV_CODE='J'`, symbol via `FID_INPUT_ISCD`.
  - Required headers: `appkey`, `appsecret`, bearer `authorization` (access token), `tr_id`,
    `custtype=P`.
- Historical chart series is NOT implemented: `getKisChartSeries()` in `kisClient.ts` fails closed
  with `NOT_IMPLEMENTED`.
- `docs/planning/phase_3ei_kis_data_surface_impact_plan_v0.1.md` records that daily/weekly/monthly
  OHLCV "needs a separate phase" and is not implemented.

### 3.3 Chart/OHLC endpoints — NEEDS_OFFICIAL_VERIFICATION

The repository does not yet contain a verified chart/OHLC endpoint path, transaction id, or
parameter set. The following are CANDIDATES to be confirmed against the official KIS Developers
portal in the owner-local OHLC smoke phase (3ES). They are NOT implementation-ready and MUST NOT be
hardcoded as final until verified:

- A. Domestic historical period price API (daily / weekly / monthly / yearly):
  - Candidate endpoint title: domestic period (기간별) item chart price. Path, transaction id, and
    the period-division parameter values are `NEEDS_OFFICIAL_VERIFICATION`.
  - Whether a single endpoint returns daily/weekly/monthly/yearly via a period-division parameter,
    or whether separate transaction ids are required, is `NEEDS_OFFICIAL_VERIFICATION`.
- B. Domestic intraday/minute candle API:
  - Availability, supported interval granularity, market open-time constraints, and rate/frequency
    limits are `NEEDS_OFFICIAL_VERIFICATION`.
- C. Overseas/US historical OHLC:
  - Endpoint, transaction id, and exchange market-code mapping are `NEEDS_OFFICIAL_VERIFICATION`.
    US OHLC remains blocked and will not be implemented until verified.
- D. Required headers (candidate, to confirm parity with the verified quote path):
  - `appkey`, `appsecret`, bearer `authorization` access token, `tr_id`, and customer type
    (`custtype`) if needed — the exact `tr_id` per chart endpoint is `NEEDS_OFFICIAL_VERIFICATION`.
- E. Query parameters (candidate names, exact keys/values `NEEDS_OFFICIAL_VERIFICATION`):
  - market division code, symbol code, start date, end date, period division code, and an adjusted
    price flag if applicable.

No unverified value in this document is treated as final or implementation-ready. Every chart/OHLC
endpoint value is explicitly marked `NEEDS_OFFICIAL_VERIFICATION` and must be verified in Phase 3ES.

## 4. Current Chart AI Chart Contract

- Mocked data contract: `src/lib/chart-ai/mockedOhlc.ts` exports `MockedOhlcPoint`
  (`date`, `open`, `high`, `low`, `close`, `volume`), the period keys `CHART_PERIOD_KEYS`
  (`1d`, `1w`, `1m`, `3m`, `1y`), `CHART_PERIOD_LABELS` (`1일`, `1주`, `1개월`, `3개월`, `1년`), and a
  deterministic fixed-seed generator (`createMockedOhlcSeries`) with per-period point counts.
- Geometry: `src/lib/chart-ai/chartScale.ts` (`buildMockedChartGeometry`) computes price labels,
  date labels, candle bodies/wicks, and the volume band consumed by the SVG renderer in
  `src/pages/chart-ai.astro`.
- Period controls in `chart-ai.astro`: `1일` / `1주` / `1개월` / `3개월` / `1년` real buttons that
  re-render the mocked series for the selected symbol.
- Sample labels that MUST be preserved until a public-safe chart-data policy exists:
  `샘플 차트`, `샘플 OHLC·거래량 데이터`, `실제 시세 아님`.
- What must be preserved: the mocked/sample chart rendering, period controls, selected-symbol chart
  update, light/dark theme, mobile containment, and the owner-local quote preview behavior. The real
  OHLC integration must be additive and gated, not a silent replacement of the sample chart.

## 5. KIS OHLC Feasibility

- Domestic stock feasibility: LIKELY feasible. The verified quote path proves domestic KR
  connectivity, auth, and headers work owner-locally; a domestic period/daily chart endpoint is
  expected to exist but its exact path/tr_id/params are `NEEDS_OFFICIAL_VERIFICATION`.
- Domestic ETF feasibility: LIKELY feasible via the same domestic chart endpoint (six-digit KRX
  codes such as `069500`), consistent with how the verified quote path treats ETFs; confirm in 3ES.
- 1d intraday feasibility: `NEEDS_OFFICIAL_VERIFICATION`. Intraday/minute candles may exist but have
  market open-time and frequency constraints. Initial implementation should prefer daily data and
  fall back to the sample chart for `1일` until intraday is verified.
- Daily / weekly / monthly / yearly feasibility: daily is the primary target; weekly/monthly may be
  available via a period-division parameter or require client-side aggregation from daily. Yearly is
  a range/performance concern. All exact mappings are `NEEDS_OFFICIAL_VERIFICATION`.
- Volume availability: the domestic period/daily chart response is expected to include a volume
  field per candle; confirm in 3ES. If absent, volume degrades to `null` (band hidden).
- Adjusted price policy: an adjusted-price flag may be available. Policy: request a single,
  consistent adjustment mode and label it; do not silently mix adjusted and raw candles. Exact flag
  is `NEEDS_OFFICIAL_VERIFICATION`.
- US feasibility status: BLOCKED / `NEEDS_OFFICIAL_VERIFICATION`. US OHLC is not verified and will
  not be implemented in the near-term sequence.

## 6. Period Mapping

| Chart AI control | Desired user meaning | KIS source candidate | Direct or aggregated | Feasibility | Notes |
|---|---|---|---|---|---|
| 1일 | Intraday chart | minute/intraday endpoint if verified | direct | TBD / NEEDS_OFFICIAL_VERIFICATION | fallback to sample if unavailable; may start on daily |
| 1주 | recent daily candles | daily endpoint | direct/aggregated | TBD / NEEDS_OFFICIAL_VERIFICATION | ~5 trading days |
| 1개월 | daily candles | daily endpoint | direct | TBD / NEEDS_OFFICIAL_VERIFICATION | ~20-30 trading days |
| 3개월 | daily candles | daily endpoint | direct | TBD / NEEDS_OFFICIAL_VERIFICATION | ~60-90 calendar days |
| 1년 | daily/weekly/monthly candles | daily or weekly/monthly endpoint | direct/aggregated | TBD / NEEDS_OFFICIAL_VERIFICATION | performance/range concern |

Directly mappable (expected): `1주`, `1개월`, `3개월` from daily candles. Aggregation likely: `1주`
if only intraday exists, and `1년` if only daily exists (aggregate daily → weekly/monthly). `1일`
needs intraday verification and should fall back to sample first. No feasibility above is final until
verified in Phase 3ES.

## 7. Proposed Normalized OHLC Contract

Planned (non-runtime) contract for Phase 3ER. This is a design proposal only; no runtime type file
is created in this phase.

```ts
type NormalizedOhlcPoint = {
  dateTime: string;              // ISO 8601, KST-normalized; null-safe numeric fields
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
};

type NormalizedOhlcSeries = {
  symbol: string;
  market: 'KR' | 'US';
  assetType: 'stock' | 'etf' | 'etn' | 'index' | 'unknown';
  currency: 'KRW' | 'USD' | string;
  period: '1d' | '1w' | '1m' | '3m' | '1y';
  interval: 'minute' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'sample';
  source: 'kis-local' | 'mocked' | 'unavailable';
  freshness: 'delayed' | 'sample' | 'unavailable';
  isLive: boolean;
  providerStatus: 'ok' | 'blocked' | 'unavailable' | 'error' | 'sample';
  points: NormalizedOhlcPoint[];
  message: string;
  safety: {
    rawResponsePrinted: false;
    secretsPrinted: false;
    publicProductionBlocked: true;
  };
};
```

Safety and shape rules:

- Null handling: any invalid/missing numeric field maps to `null` (never `NaN`, never a raw string),
  mirroring the quote mapper's `toNullableNumber`.
- Ordering: `points` ascending by `dateTime` (oldest → newest) for left-to-right rendering.
- Minimum point count for rendering: at least 2 valid points; below that, treat as insufficient and
  fall back to the sample series.
- Volume handling: `volume` may be `null`; the renderer hides the volume band when volume is missing.
- Timezone/KST handling: normalize timestamps to KST and emit ISO 8601; the mapper owns
  normalization so the renderer stays timezone-agnostic.
- Adjusted-price policy: one consistent adjustment mode per series, surfaced via a label; never mix
  adjusted and unadjusted candles in a single series.
- Sample fallback policy: on block/unavailable/insufficient data, return `source='mocked'`,
  `interval='sample'`, `isLive=false`, `providerStatus='sample'` with the deterministic mocked series
  so the chart always renders something clearly labeled as sample.
- No raw response storage policy: only normalized, sanitized points are returned; raw KIS responses
  are never persisted, returned to the client, or committed.

## 8. Integration Architecture

- Endpoint registry extension: extend the existing KIS endpoint-registry pattern
  (`kisQuoteEndpointRegistry.ts` style) with chart/OHLC endpoint definitions carrying a
  `verification` flag (`verified-official-docs` | `unverified`). Chart endpoints stay `unverified`
  until Phase 3ES confirms them; unverified endpoints are never used for a live call.
- OHLC adapter: a server-only `kisOhlc*` adapter that reuses the owner-local gate and delegates
  transport to the approved `kisClient` (no new `fetch` outside `kisClient`), maps raw fields into
  `NormalizedOhlcSeries`, and returns the sample series on any failure.
- Owner-local smoke (3ES): a smoke script mirroring the quote smoke — explicit owner-local flags,
  sanitized summary only (point counts and field-presence booleans, no prices), no committed output.
- Preview API (3ET): an owner-local-gated preview route mirroring
  `owner-local-quote-preview.ts` (blocked-by-default, local-host + query flags + env flags +
  provider gate, `Cache-Control: no-store`); no public OHLC route.
- Chart renderer mapping: map `NormalizedOhlcSeries.points` into the existing `chartScale`
  geometry so the current SVG candlestick/volume renderer is reused; the mocked path remains the
  default and public path.
- Fallback to mocked sample: whenever live OHLC is blocked/unavailable/insufficient, render the
  deterministic mocked series with explicit sample labels.
- Cache/freshness policy: OHLC is heavier and changes less often than a quote, so it may use a short
  owner-local in-memory TTL distinct from the quote path; quote and OHLC should share the freshness
  vocabulary (`delayed` / `sample` / `unavailable`) but not necessarily the same cache lifetime.
- Public production boundary: public production stays on the mocked/sample chart. Live OHLC remains
  owner-local gated until Phase 3EV decides a public-safe policy (mocked, delayed, cached, or
  disabled). Public production must never trigger a live KIS chart call.

## 9. Failure and Fallback Policy

- `PROVIDER_UNAVAILABLE`: return the sample series (`source='mocked'`, `providerStatus='sample'`) and
  show a non-blocking note; never surface a raw error. Consistent with the intermittent behavior
  observed in the Phase 3EO smoke.
- `CONFIG_MISSING`: treat as blocked (owner-local conditions not met); render the sample chart.
- Endpoint unverified: if the resolved chart endpoint is `unverified`, block the live path and render
  the sample chart.
- Rate limit: back off and render the sample chart; do not retry aggressively.
- Malformed response: map to `unavailable` and render the sample chart; drop malformed points.
- Insufficient points (< 2 valid points): treat as unavailable and render the sample chart.
- Market closed / no recent intraday data: for `1일`, fall back to daily or the sample series and
  label it clearly.
- Fallback UI and data behavior: the chart always renders; live vs sample state is explicitly
  labeled; no raw error details, no raw provider payload, and no secrets are ever shown.

## 10. Security and Safety

- No live KIS call in this phase.
- No secrets recorded or printed.
- No raw response recorded or committed.
- No account/trading APIs used or planned in the near-term sequence.
- No Vercel environment changes.
- No public production live exposure; public stays on the sample chart.
- No deployment.
- No push.

## 11. Validation

- `npm run check:phase-3eq-kis-chart-ohlc-feasibility-plan`: PASS.
- `npm run check:phase-3ep-owner-review-closeout`: PASS.
- `npm run check:phase-3ep-chart-ai-owner-local-quote-preview-wiring`: PASS.
- `npm run check:phase-3eo-owner-local-kis-quote-smoke-closeout`: PASS.
- `npm run check:phase-3eo-owner-local-kis-quote-smoke`: PASS.
- `npm run check:phase-3en-kis-quote-adapter-owner-local-gate`: PASS.
- `npm run check:phase-3em-kis-quote-integration-foundation`: PASS.
- `npm run check:provider-boundaries`: PASS.
- `npm run check:kis-runtime-guard`: PASS.
- `npm run check:kis-error-fallback`: PASS.
- `npm run check:chart-ai-ux-skeleton`: PASS.
- `npm run check:mobile-baseline`: PASS.
- `npm run check:production-domain`: PASS.
- `npm run build`: PASS.
- `git diff --check`: PASS.
- `npm run guard:production-mobile-geometry`: `DRY_RUN`; no browser and no network.

## 12. Known Legacy Checker Note

`check:kis-quote-adapter-mocked` remains `100/101` due to the pre-existing unrelated `source=live`
string in `src/pages/api/portfolio/valuation.ts`. That file is unchanged in this phase and the
checker was not weakened. Recommended separate cleanup: Phase 3EN-HF1 — Legacy KIS Checker Cleanup.

## 13. Recommended Next Phase

Recommended: Phase 3ER — KIS OHLC Contract and Mocked Adapter Foundation.

Alternative: Phase 3EN-HF1 — Legacy KIS Checker Cleanup.

Rationale: Do not wire live OHLC before defining the normalized OHLC contract and a deterministic
mocked adapter that match the verified KIS shape. Phase 3ER builds that contract + mocked adapter
with no live KIS; Phase 3ES then verifies the real chart endpoint values owner-locally before any
preview wiring (3ET), owner review (3EU), and a public-safe chart-data policy decision (3EV).
