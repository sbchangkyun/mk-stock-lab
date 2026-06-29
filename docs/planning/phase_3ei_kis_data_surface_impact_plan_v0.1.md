# Phase 3EI — KIS Data Surface Impact Plan

## 1. Status

Planned — KIS data surface impact plan completed; no runtime changes.

## 2. Background

- Prior owner-run validation covered KIS KR stock quotes and a representative KR ETF through the domestic quote path.
- The Portfolio owner live-preview API has prior KR-only validation.
- The mixed-currency Portfolio owner preview was accepted locally using mocked FX.
- Phase 3EH closed the owner UI review with `PASS_WITH_MOBILE_NOTE`.
- Public production remains fixture/default.
- Public `source=live` remains disabled.
- `source=auto` remains deferred.
- A real FX provider is not selected.
- A US quote provider is not implemented.

This phase expands planning from Portfolio-only preview behavior to the full NAV data surface. It maps where normalized KIS data may fit, where shared infrastructure is required first, and where non-KIS sources remain unavoidable. It does not select a vendor or authorize implementation, live calls, public exposure, or provider expansion.

Tracked-source inspection also confirms the current product presentation is mostly static or fixture-backed outside the narrow quote/Portfolio paths:

- `Ticker.astro` and `homeIndexCards.json` provide local Home data.
- Chart AI uses demo symbols and demo analysis; the KIS chart adapter returns `NOT_IMPLEMENTED`.
- Market treemaps and Momentum / Trend use `marketTreemapSamples.ts`.
- Lab return matrices use `labReturnMatrices.json` and are labeled example data.
- MyPage watchlist and target-price controls are in-memory or UI-only with no persistence or worker.

## 3. Current Data Capability Baseline

| Capability | Current state | Notes |
| --- | --- | --- |
| KR stock quote | validated in owner/local preview | `kisClient.ts` has a normalized domestic quote path; owner smoke evidence covers KR stocks. Production remains blocked. |
| KR ETF quote | validated in owner/local preview | Representative ETF `069500` passed through the same KR domestic quote path; broader ETF coverage still needs regression cases. |
| Portfolio owner live preview | validated | KR-only, non-production, explicit owner gate, maximum 10 positions, no account/trading dependency. |
| Mixed-currency owner preview | local-only, mocked FX | Accepted in Phase 3EH; US rows can remain unavailable and aggregate values can remain null. |
| US quote | not implemented | Non-KR requests are unsupported; required for US holdings, US treemaps, Chart AI, and parts of Lab. |
| Real FX | not selected | Mocked FX contracts exist, but no real provider or public valuation policy exists. |
| Symbol master | not complete / needs design | A KR metadata readiness shell exists through OpenDART, but no comprehensive stock/ETF master, aliases, lifecycle status, or search index exists. |
| Historical chart series | not implemented | `getKisChartSeries()` fails closed with `NOT_IMPLEMENTED`; daily/weekly/monthly OHLCV needs a separate phase. |
| Quote cache | implemented foundation | Memory cache defaults to 15-second fresh and 120-second stale windows; persistent Supabase cache is opt-in infrastructure, not public-live readiness. |
| Market calendar | not implemented | Current normalized quote snapshots conservatively use an unknown market state. |
| Public live data | disabled | Public fixture/default behavior is preserved; existing live capabilities are owner/local and fail closed in production. |
| `source=auto` | deferred | Do not enable in this plan; routing and fallback policy are not approved. |
| Watchlist alerts | not implemented | MyPage has in-memory/UI-only shells; persistence, worker, delivery, suppression, and history are absent. |

## 4. NAV Impact Summary Matrix

Fit values describe the complete surface, not just whether one quote field can be supplied.

| NAV | Surface | Data needed | KIS fit | Non-KIS gap | Priority | Recommended phase |
| --- | --- | --- | --- | --- | --- | --- |
| Home | Ticker belt | Domestic/global indices, representative assets, FX, commodities | Low | US/global indices, Dollar Index, Gold, WTI, real FX | Medium | Phase 3EM |
| Home | MARKET SNAPSHOT | KOSPI/KOSDAQ, US indices, movers, volume, asset summary | Medium | US indices, cross-asset benchmarks, ranking policy | Medium | Phase 3EM |
| Chart AI | Symbol search | Master records, aliases, market, currency, asset type, status | Needs design | Comprehensive domestic master and all US symbols | Highest | Phase 3EK → 3EL |
| Chart AI | Symbol analysis | Quote, OHLCV, returns, volume, computed indicators | Medium | KIS chart series is not implemented; US/history gaps | High | Phase 3EL after 3EJ/3EK |
| Market | KOSPI200 treemap | Constituents, quote/return, weight/cap, sector | Medium | Official constituent, weight, sector source | High | Phase 3EN |
| Market | KOSDAQ150 treemap | Constituents, quote/return, weight/cap, sector | Medium | Official constituent, weight, sector source | High | Phase 3EN |
| Market | S&P500 treemap | Constituents, US quote/return, sector, weight | Blocked | US quotes plus constituent/sector/weight data | Later | Phase 3EQ |
| Market | NASDAQ100 treemap | Constituents, US quote/return, weight | Blocked | US quotes plus constituent/weight data | Later | Phase 3EQ |
| Market | Momentum / Trend | Historical returns, moving averages, volatility, stale state | Medium | Historical endpoint and US data; calculations internal | High | Phase 3EN / 3EQ |
| Market | Major index flow | Domestic and US indices, Dow, optional USD/KRW | Low | Several index and FX sources require verification/external data | Medium | Phase 3EM / 3EQ |
| Market | Asset-class returns | Equities, bonds, FX, commodities, optional crypto | Needs external source | No single KIS path covers all asset classes | Later | Phase 3EP |
| Lab | Asset-class return comparison | Historical series, proxy map, rebasing, benchmark labels | Needs external source | Global benchmarks, commodities, FX, crypto | Later | Phase 3EP |
| Lab | S&P500 sector returns | Constituents or sector ETFs, taxonomy, weights, history | Needs external source | US quote/history, sector classification, methodology | Later | Phase 3EP / 3EQ |
| Portfolio | Registered holdings valuation | Validation, quote, market/currency, valuation, FX | High for KR / Blocked for full mixed | US quote and real FX | High, existing path | Preserve; Phase 3EQ for gaps |
| MyPage | Watchlist price alerts | Persisted symbols/targets, quotes, worker, calendar, channel | Needs design | Worker, storage, channel, calendar, suppression | Medium | Phase 3EO |
| Common | Symbol master | Domestic stock/ETF identity, aliases, lifecycle | Needs design | Authoritative master source and refresh policy | Highest | Phase 3EJ → 3EK |
| Common | Quote API layer | Normalization, error taxonomy, freshness, leakage guard | High | Batch/rate policy and public-readiness design | Highest | Phase 3EJ |
| Common | Quote cache | TTL, stale fallback, persistence, failure metadata | High | Session-aware TTL and operational policy | Highest | Phase 3EJ |
| Common | Market calendar | Open/closed/holiday state for freshness and alerts | Needs design | Authoritative KR/US calendar sources | High | Phase 3EJ / 3EO |
| Common | Provider leakage guard | Raw-field exclusion, normalized output, safe errors | High | Broader regression coverage for future adapters | Highest | Every phase |
| Common | Alert worker | Scheduled checks, conditions, suppression, history | Needs design | Runtime/scheduler and notification channel | Later | Phase 3EO |

## 5. Home Impact Plan

### Ticker belt

Current state: `Ticker.astro` renders static labels for S&P 500, Nasdaq 100, Dow Jones, KOSPI, KOSDAQ, USD/KRW, Dollar Index, Gold, and WTI Oil. It is global layout-adjacent and therefore high-impact despite its compact UI.

Required data:

- major indices;
- representative ETFs or assets;
- USD/KRW;
- S&P 500, Nasdaq 100, Dow Jones, KOSPI, KOSDAQ, Dollar Index, Gold, and WTI Oil candidates.

Impact and source policy:

- KIS may be a candidate for domestic index, domestic ETF, or domestic quote inputs only after endpoint and entitlement verification.
- Existing tracked evidence proves domestic security quotes, not every domestic index field.
- Dollar Index, Gold, WTI Oil, and some global indices likely require external benchmark feeds or explicitly approved proxy securities.
- Use a source map per ticker item; do not force every item through KIS.
- Apply Phase 3DX containment rules because the ticker is present through `Layout.astro` across NAV routes.
- Do not use “real-time” wording for REST snapshots. Use `조회 시점 기준`, `최근 조회 기준`, or `데이터 일시 불가`.
- Keep public fixture output until a later owner-preview and public-readiness sequence passes.

### MARKET SNAPSHOT

Current state: `HomeIndexCards.astro` reads `homeIndexCards.json`, which contains example values and sparkline arrays for nine cross-market items.

Required data:

- KOSPI/KOSDAQ summary;
- major US index summary;
- top movers;
- volume/turnover candidates;
- asset-class mini summary.

Plan:

1. Define the minimum card set and exact normalized fields before choosing endpoints.
2. Use domestic owner/local preview first for KOSPI/KOSDAQ or approved representative ETFs.
3. Retain placeholders for US indices and cross-asset cards until their source contracts exist.
4. Add movers only after batch limits, ranking scope, and constituent universe are defined.
5. Keep the public default fixture-backed until a separate public-readiness phase approves quota, outage, freshness, and copy behavior.

## 6. Chart AI Impact Plan

### Symbol search

Required data:

- symbol code and name;
- market and exchange/country;
- currency and asset type;
- Korean and English display names;
- ETF/stock classification;
- active, delisted, or suspended status where available;
- search aliases.

Current gap: the current page exposes four demo symbols. The existing `SecurityMasterRecord` type and KR metadata readiness shell are useful contracts, but KIS quote lookup is not a searchable symbol catalog and OpenDART metadata is not a complete stock/ETF search master.

Plan:

- Build a domestic stocks + domestic ETFs master first.
- Normalize codes, display names, market, currency, asset type, aliases, and supported status.
- Create a search index separate from quote fetching so keystrokes do not call KIS.
- Defer US search until the US quote/source policy and US master source are approved.
- Do not require account or trading APIs.

### Symbol analysis

Required data:

- normalized quote snapshot;
- daily OHLCV;
- weekly/monthly series from provider support or reproducible internal aggregation;
- volume and period returns;
- internally computed moving-average, momentum, trend, and volatility features;
- stale/unavailable state.

Plan:

- Use KIS only as a candidate market-data source where an approved endpoint supports the input.
- Keep analytical features deterministic and computed internally from normalized series.
- The current KIS chart function is explicitly not implemented; do not imply historical readiness from the quote path.
- Do not send raw KIS payloads or `providerMeta` to the UI or AI prompt layer.
- The Chart AI context builder should receive normalized security, quote, chart, and limitations only.
- Keep `실시간` wording prohibited unless a future WebSocket-specific phase explicitly supports and validates it.

## 7. Market Page Impact Plan

The current Market page uses sample universes for KOSPI200, KOSDAQ150, S&P500, NASDAQ100, and My Portfolio. Sample Momentum / Trend values and period returns are derived locally from fixture inputs; they are not live-data readiness evidence.

### KOSPI200 Treemap

Required: constituent list, normalized quote/return, market cap or weight, sector/category, and freshness state.

KIS fit: Medium. Domestic quote fit is supported by existing evidence, but the official constituent list, reconstitution dates, free-float weight/market cap, and sector taxonomy must be verified separately. Phase 3EN should start only after that source decision.

### KOSDAQ150 Treemap

Required: the same structure as KOSPI200.

KIS fit: Medium for domestic quotes, not yet proven for the complete constituent/weight/sector contract. Treat membership and weighting as separate reference data.

### S&P500 Treemap

Required: constituent list, US quote/return, sector, and weight or market cap.

KIS fit: Blocked for the current codebase because US quote is not implemented. Constituent, sector, and weighting data likely require an external or static licensed source. Do not move beyond fixture display until Phase 3EQ.

### NASDAQ100 Treemap

Required: constituent list, US quote/return, and weight or market cap.

KIS fit: Blocked for the current codebase because US quote is not implemented. Constituent and weighting data require a separately approved source.

### Momentum / Trend

Required: daily returns, period returns, moving averages, trend labels, volatility candidates, and stale state.

Plan: source normalized market series from KIS where supported, then calculate features internally. Separate domestic and US readiness. Do not extrapolate the current fixture multipliers into production methodology.

### Major index flow

Required: KOSPI, KOSDAQ, S&P 500, Nasdaq 100, Dow, and optionally USD/KRW.

Plan: create three groups—verified domestic index candidates, US index candidates, and external FX/benchmark candidates. Each group needs its own source, timestamp, freshness, and outage policy.

### Asset-class returns

Required: equities, bonds, USD/KRW, gold, oil, optional crypto, and representative ETFs or external benchmarks.

Plan: create an explicit proxy/source map. KIS may cover selected domestic ETFs, but it does not establish full cross-asset coverage. Reproducible returns require aligned calendars, currencies, and rebasing rules.

## 8. Lab Impact Plan

### Asset-class return comparison

Required data:

- approved representative assets or ETFs;
- historical price series;
- normalized return calculations;
- benchmark and source labels;
- a documented rebasing method.

Plan:

- KIS may cover domestic ETFs or securities after historical-series support is implemented.
- FX, commodities, crypto, and global benchmarks may need external or static sources.
- Record proxy substitutions explicitly and never mix raw benchmark series with ETF proxies without labeling the methodology.
- Keep calculations reproducible from stored normalized observations and source versions.

### S&P 500 sector returns

Required data:

- S&P500 constituents or approved sector ETF proxies;
- sector classification;
- quote or historical price series;
- sector weighting methodology.

Plan:

- KIS alone is not enough under the current implementation.
- A safer later MVP may use approved sector ETF proxies, but only after the owner chooses proxy-based versus constituent-weighted methodology.
- The classification and weighting sources must be explicit and versioned.

## 9. Portfolio Impact Plan

Affected data and behavior:

- user-registered holdings;
- symbol validation and display-name resolution;
- market/currency detection;
- quote snapshots;
- valuation and P&L;
- unavailable rows and aggregate null;
- KR-only owner preview;
- mixed-currency preview using mocked FX;
- future US quote and real FX requirements.

Preserved rules:

- Preserve Phase 3EF implementation and Phase 3EH owner acceptance.
- Do not enable public live data.
- Do not enable `source=auto`.
- Do not silently use fixture values for owner-live unavailable rows.
- Preserve unavailable rows and null aggregates when required data is missing.
- Always strip raw provider fields and preserve the provider leakage guard.
- Treat US quotes and real FX as separate provider decisions and failure domains.

## 10. MyPage Impact Plan

Current state: the MyPage watchlist is an in-memory UI shell and the target-price alert controls are UI-only. No backend persistence, scheduler, notification delivery, or durable alert history exists.

Required data and state:

- watchlist symbols;
- target price and condition direction;
- active/inactive state;
- last trigger timestamp;
- duplicate suppression state;
- alert channel;
- market calendar;
- quote source and freshness;
- stale/unavailable behavior.

Plan:

- MyPage is the setting and history surface, not the execution engine.
- Implement watchlist-only persistence before price alerts.
- The alert feature requires a background worker or scheduled task; do not design it as browser-only polling.
- Do not introduce account or trading APIs.
- Evaluate conditions only from normalized quotes and market-calendar-aware schedules.
- Require duplicate suppression, retry policy, delivery status, and alert history before enabling notifications.
- Alert channel is an owner decision; default to no external channel until Phase 3EO.

## 11. Common Data Infrastructure

### Symbol master

Purpose:

- search and display-name resolution;
- ticker validation;
- market/currency and ETF/stock classification;
- Portfolio holding validation;
- watchlist and alert validation;
- treemap constituent validation.

First scope recommendation:

```text
Domestic stocks + domestic ETFs first.
```

The first plan must define authoritative source, identifiers, aliases, lifecycle state, refresh cadence, versioning, and failure semantics. OpenDART company metadata can enrich eligible KR records but is not a complete master by itself.

### Search index

Build a local normalized index from the approved symbol master. Search should support code, Korean/English name, aliases, asset type, and market without issuing a provider request per keystroke.

### Quote API layer

Purpose:

- hide raw provider data;
- normalize quote fields;
- classify errors;
- return freshness and stale state;
- keep account/trading concerns out of quote-only features.

The current normalized quote contract is a useful starting point, but future planning must define batch semantics, quotas, timeout policy, endpoint ownership, and public-readiness gates.

### Quote cache

Purpose:

- reduce provider calls;
- stabilize UI behavior;
- support stale-but-usable results.

Current evidence includes an in-memory default with a 15-second fresh TTL and a 120-second stale window plus an opt-in persistent adapter. Phase 3EJ must decide TTL classes by market state and surface rather than treating current constants as universal production policy.

Required behavior:

- explicit fresh TTL and stale window;
- stale fallback only after safe provider failure;
- rate-limit and outage classification;
- no raw provider payload leakage;
- separate cache keys by market and normalized symbol;
- observability that exposes safe counts/codes, not secrets or payloads.

### Market calendar

Purpose:

- holiday and market-open state;
- alert scheduling;
- correct freshness labels;
- avoiding false stale warnings while a market is closed.

Domestic and US calendar coverage need separate source decisions. The current normalized KIS quote reports conservative `marketState=unknown`, so calendar-aware behavior is not implemented.

### Source labels

Required labels:

```text
fixture
owner preview
sample
조회 시점 기준
최근 조회 기준
데이터 일시 불가
평가 불가
```

Forbidden unless a later WebSocket-specific phase supports and validates the claim:

```text
실시간
실시간 시세
real-time
live FX
current FX
actual market value
```

### Provider leakage guard

Preserve these boundaries for every adapter and consumer:

- no raw KIS fields in UI or AI prompt inputs;
- no `providerMeta` in public UI;
- no tokens or authorization headers;
- no request or response bodies;
- no account numbers;
- no raw provider payloads;
- normalized, allowlisted response shapes only.

### Alert worker

Purpose:

- scheduled quote checks;
- condition evaluation;
- duplicate suppression;
- delivery retries and alert history.

The worker needs explicit runtime ownership, scheduler policy, market calendar, rate budget, storage schema, delivery channel, and failure handling before implementation.

## 12. External Data Gap Register

No vendor is selected in this phase.

| Gap | Affected surfaces | Why KIS may not be enough | Candidate source type | Owner decision needed |
| --- | --- | --- | --- | --- |
| S&P500 constituents | Market, Lab, Chart AI search | Current US master/quote path absent; membership is reference data | Licensed index file, maintained static snapshot, or approved market-data API | Source, license, refresh cadence |
| S&P500 sector classification | Market, Lab | Sector taxonomy is not supplied by the current quote contract | Licensed classification, constituent file, or approved reference API | Taxonomy and versioning |
| S&P500 sector weights | Market, Lab | Requires constituent weights/caps and methodology | Licensed index weights or calculated from approved cap data | Official versus derived methodology |
| NASDAQ100 constituents | Market | Current US master/quote path absent | Licensed index file, static versioned file, or approved API | Source and reconstitution updates |
| NASDAQ100 weights | Market | Quote alone does not supply index weights | Licensed weights or approved calculated method | Official versus derived weights |
| KOSPI200/KOSDAQ150 official constituent/weight source | Market | Domestic quote validation does not prove official membership/weights | Exchange/index reference file or approved static snapshot | Authority, license, refresh cadence |
| Dollar Index | Home, Market, Lab | Not covered by domestic security quote evidence | Benchmark API or approved proxy | Direct benchmark versus proxy |
| Gold | Home, Market, Lab | Spot/futures benchmark is outside current quote contract | Commodity feed or approved ETF proxy | Benchmark and currency convention |
| WTI Oil | Home, Market, Lab | Commodity benchmark is outside current quote contract | Commodity feed or approved ETF proxy | Contract/spot/proxy choice |
| Crypto asset if used | Market, Lab | Outside KIS securities quote scope | Approved crypto market-data API or remove from scope | Include or exclude; venue policy |
| Real FX provider | Home, Portfolio, Market, Lab | Mocked rates are not current/live | Approved FX reference API or bank/reference feed | Provider, as-of policy, cost |
| US quote provider | Chart AI, Market, Lab, Portfolio | KIS overseas endpoint is not implemented in this codebase | Dedicated US provider or separately approved KIS overseas design | Provider and entitlement |
| Market calendar coverage | All time-sensitive surfaces, alerts | Current market state is unknown and calendars differ | Exchange calendars or versioned calendar service | KR/US source and update ownership |
| Alert notification channel | MyPage | KIS provides data, not product notification delivery | Email, Telegram, push, or none | Channel, consent, operating cost |

## 13. Priority and Roadmap Recommendation

Recommended order:

1. **Phase 3EJ — KIS Symbol Master & Quote Infrastructure Plan**: define master authority, normalized quote/batch contracts, cache TTL classes, calendar integration, leakage regression, and public-readiness gates.
2. **Phase 3EK — Domestic Symbol Master / Search Index Mocked-First Implementation**: build domestic stock + ETF records and local search without provider calls per query.
3. **Phase 3EL — Chart AI Symbol Search Data Wiring Plan**: connect normalized domestic search and define historical analysis inputs.
4. **Phase 3EM — Home Ticker Belt / Market Snapshot Data Plan**: define the exact Home item/source map and owner-preview sequence.
5. **Phase 3EN — Market Domestic Index and Treemap Data Plan**: decide KOSPI200/KOSDAQ150 reference data before quote wiring.
6. **Phase 3EO — MyPage Watchlist and Alert Worker Plan**: persist watchlists first, then design worker, calendar, suppression, and channel.
7. **Phase 3EP — Lab Asset-Class Data Source Plan**: approve benchmark/proxy methodology and reproducible historical calculations.
8. **Phase 3EQ — US Quote and External Data Provider Decision Plan**: decide US quote, US master/index data, commodities, and real FX separately.

Alternative route:

```text
Alternative: Phase 3EJ — Home Ticker Belt / MARKET SNAPSHOT Preview Plan
```

Use the alternative only if the owner prioritizes visible product progress before common infrastructure design. It must remain fixture/public by default and owner/local preview first.

## 14. Owner Decision Matrix

| Decision | Options | Recommended default | Needed before |
| --- | --- | --- | --- |
| First implementation target after Phase 3EI | Common infrastructure; Home preview; Chart AI search | Common symbol master + quote infrastructure | Phase 3EJ scope lock |
| Domestic-only or domestic+US symbol search | Domestic only; domestic+US | Domestic stocks + ETFs first | Phase 3EK |
| Domestic ETF inclusion | Include first scope; defer | Include with explicit classification/regression | Phase 3EK |
| Home ticker scope | Full nine items; domestic subset; mixed placeholders | Preserve fixture set; owner/local data preview later | Phase 3EM |
| Market Snapshot scope | Full cross-market; domestic first; index placeholders | KOSPI/KOSDAQ + US index placeholders first | Phase 3EM |
| Treemap first target | KOSPI200; KOSDAQ150; US index | KOSPI200 after constituent source decision | Phase 3EN |
| Static constituent files | Versioned static; provider API; no treemap | Allow versioned static MVP if licensed/maintained | Phase 3EN |
| S&P500 sector method | Constituent-weighted; sector ETF proxies; defer | Defer provider choice; proxy MVP only with explicit approval | Phase 3EP/3EQ |
| Asset-class return proxy list | Direct benchmarks; ETFs; mixed | Explicit approved proxy map with labels | Phase 3EP |
| Watchlist-only vs price-alert MVP | Watchlist only; alerts together | Watchlist-only first | Phase 3EO |
| Alert channel | None, email, Telegram, push | No external channel until worker design | Phase 3EO |
| Cache TTL class | Fixed current TTL; market-state classes; per-surface | Market-state classes with per-surface caps | Phase 3EJ |
| Market calendar source | Versioned files; service/API; library | Decide KR first, then US; keep source explicit | Phase 3EJ/3EO |
| Public live-readiness threshold | Owner smoke only; smoke+UI+quota+outage+mobile; never | Require mocked/static checks, owner smoke, UI review, quota/outage policy, and post-deploy geometry | Future readiness phase |
| Whether `source=auto` remains deferred | Keep deferred; design now; enable | Keep deferred | Every phase until readiness |
| Strict dedicated 390px proof before deployment | Required; optional | Required before any future deployment that changes dense/public data UI | Pre-deployment owner review |

## 15. Risk Register

| Risk | Impact | Mitigation / required decision |
| --- | --- | --- |
| Provider rate limits | Missing or throttled data across several surfaces | Batch/caching plan, rate budget, backoff, safe stale fallback |
| Stale data confusion | Users interpret old values as current | Market-calendar-aware freshness and explicit source labels |
| Real-time wording risk | Misleading product claim for REST snapshots | Prohibit real-time copy until a validated WebSocket phase |
| Raw provider leakage | Secrets/internal fields reach UI, logs, or AI | Normalized allowlists, regression checker, no raw bodies/meta |
| Symbol mismatch | Wrong quote or holding mapping | Canonical master IDs, market-qualified keys, alias review |
| ETF/stock classification mismatch | Search, analysis, or alerts use wrong policy | Authoritative asset type and ETF regression cases |
| Index constituent licensing/source mismatch | Incorrect or unlicensed treemaps | Explicit source/license/version and reconstitution process |
| US quote gap | US surfaces remain incomplete | Keep blocked/placeholders until Phase 3EQ |
| FX gap | Cross-currency values become misleading | Preserve mocked/local-only state and null aggregates; select provider separately |
| Alert duplication | Repeated notifications | Durable last-trigger state, cooldown, idempotency key |
| Market closed/holiday handling | False alerts and stale warnings | Market calendar plus session-aware worker policy |
| Mobile layout overflow from dense data | NAV pages become unusable | Phase 3DX containment, local scroll owners, mobile baseline and owner review |
| Public live premature activation | Quota, outage, compliance, and trust risk | Keep `source=live` and `source=auto` blocked until explicit readiness approval |

## 16. Validation Plan

Every future implementation phase must add a feature-specific static checker where relevant and run:

```bash
npm run check:mobile-baseline
npm run check:production-domain
npm run build
git diff --check
npm run guard:production-mobile-geometry
```

Additional requirements:

- Provider work must run mocked/no-network contracts before any separately authorized owner smoke.
- Public behavior must remain fixture/default until a public-readiness phase explicitly changes it.
- Production geometry must only run after an actual deployment and explicit owner approval; implementation phases use the dry-run guard only.
- Dense tables, treemaps, matrices, and ticker changes require mobile containment assertions.
- Adapter checkers must assert raw provider leakage remains blocked.

## 17. Final Recommendation

Recommended next phase: Phase 3EJ — KIS Symbol Master & Quote Infrastructure Plan.

Alternative: Phase 3EJ — Home Ticker Belt / MARKET SNAPSHOT Preview Plan, only if the owner prioritizes visible UI progress before shared data infrastructure.
