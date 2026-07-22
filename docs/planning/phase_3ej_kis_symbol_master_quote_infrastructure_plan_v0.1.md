# Phase 3EJ - KIS Symbol Master & Quote Infrastructure Plan

## 1. Status

Planned - KIS symbol master and quote infrastructure plan completed; no runtime changes.

## 2. Background

- Phase 3EI mapped NAV-wide KIS data impact and identified shared data infrastructure as the next dependency.
- Current KIS evidence supports owner/local KR stock and representative KR ETF quote preview.
- The Portfolio owner live-preview API has been validated.
- Mixed-currency Portfolio owner preview is accepted locally using mocked FX.
- Existing public production remains fixture/default.
- Public `source=live` remains disabled.
- `source=auto` remains deferred.
- A real FX provider is not selected.
- A US quote provider is not implemented.
- Phase 3EJ narrows the NAV-wide impact plan to shared domestic symbol identity, search, normalized quotes, caching, freshness, market calendar, and leakage protection.

This is a planning-only phase. It does not implement or call a symbol source, KIS, FX, an API route, a search index, a cache change, or a market calendar.

## 3. Current Infrastructure Baseline

| Area | Current state | Constraint |
| --- | --- | --- |
| KR quote adapter | Existing owner/local validated path | No public live; production remains fail-closed |
| KR ETF quote | Owner/local validated with representative ETF `069500` | Broader ETF coverage still needs regression |
| Portfolio valuation | Existing owner preview path | No fixture fallback in live-owner unavailable rows |
| Mixed-currency preview | Local-only mocked FX | No real FX and no US quote |
| Symbol master | Incomplete / needs design | `securityMaster.ts` delegates KR metadata to an OpenDART readiness shell that is not a complete stock/ETF catalog |
| Search index | Incomplete / needs design | No shared index exists; must not call KIS per keystroke |
| Quote cache | Foundation implemented | In-memory default is fresh for 15 seconds and stale for 120 seconds; optional Supabase persistence is not public-live readiness |
| Market calendar | Not implemented / needs design | KIS quote normalization currently reports conservative `marketState: 'unknown'` |
| Provider leakage guard | Required and partially established | Valuation strips `providerMeta`, but a generalized safe response projection is still required across quote consumers |
| Public live readiness | Not approved | Keep public `source=live` disabled |
| `source=auto` | Deferred | Do not enable |

The current `SecurityMasterRecord` and `QuoteSnapshot` types are useful starting references, not proof of a comprehensive master or a final cross-surface quote schema. The existing `/api/market/quote` route returns normalized quote data, but future shared infrastructure must guarantee that internal `providerMeta` never crosses an API or UI boundary.

## 4. First-Scope Recommendation

Recommended first scope:

```text
Domestic listed stocks + domestic ETFs only.
```

Explicitly excluded from the first scope:

- US stocks;
- US ETFs;
- real FX;
- commodities;
- crypto;
- index constituents and weights;
- watchlist alert worker;
- public live data;
- `source=auto`;
- account/trading APIs;
- ETNs and other asset types until separately approved.

Domestic stocks and ETFs align with the validated KR quote path and can unblock Portfolio registration and Chart AI search without combining new provider failure domains. Home and Market can later consume the same identity and quote contracts. US quotes and real FX require separate provider decisions. Alerts require scheduler, storage, delivery, suppression, and market-calendar design before implementation.

## 5. Symbol Master Data Contract

Phase 3EK should implement a normalized record equivalent to:

```ts
type SymbolMasterRecord = {
  symbol: string;
  displaySymbol: string;
  nameKo: string;
  nameEn?: string;
  market: 'KR';
  exchange: 'KOSPI' | 'KOSDAQ' | 'KONEX' | 'ETF' | 'ETN' | 'UNKNOWN';
  country: 'KR';
  currency: 'KRW';
  assetType: 'stock' | 'etf' | 'etn' | 'other';
  status: 'active' | 'suspended' | 'delisted' | 'unknown';
  aliases: string[];
  searchableText: string;
  source: 'static' | 'kis' | 'krx' | 'manual' | 'mocked';
  sourceAsOf: string | null;
  updatedAt: string;
};
```

Contract rules:

- `symbol` is the canonical domestic code; Phase 3EK should initially require the six-digit KR format.
- `displaySymbol` may equal `symbol` in the KR-first scope.
- `nameKo` is required for Korean product UI; `nameEn` is optional.
- `aliases` may contain reviewed Korean, English, shorthand, and ticker-like inputs.
- `searchableText` is generated, never accepted as authoritative source input. Use Unicode NFKC normalization, lowercase conversion where applicable, trimming, and collapsed whitespace.
- `sourceAsOf` is required as a nullable field so stale or undated symbol lists remain distinguishable.
- `updatedAt` records generation/normalization time, not necessarily the upstream effective date.
- `status: 'unknown'` is safer than assuming an unverified symbol is active.
- The schema remains extensible for ETN/other records, but Phase 3EK seed acceptance is limited to stocks and ETFs.
- Provider raw fields, internal provider symbols, credentials, entitlement data, and raw metadata must not be included.

## 6. Symbol Master Source Strategy

No final vendor or live-sync source is selected in this phase.

| Source type | Role | Pros | Cons | Phase 3EK recommendation |
| --- | --- | --- | --- | --- |
| Static checked-in seed file | Versioned bootstrap universe | Deterministic, reviewable, offline, testable | Manual refresh and incomplete coverage risk | Recommended initial authoritative bootstrap |
| KIS-supported metadata endpoint or file, if available and later verified | Possible future broker-supported enrichment/sync | May align with quote identifiers | Availability, completeness, terms, entitlement, and ETF coverage are unverified | Later verification only; do not assume completeness |
| KRX or exchange official source, if later approved | Candidate authoritative listing/exchange lifecycle data | Strong domestic-market relevance | Format, automation rights, licensing, and refresh workflow require approval | Preferred source-verification candidate after bootstrap |
| OpenDART metadata | Company-identity enrichment for eligible issuers | Useful corporate identity linkage | Not sufficient alone for listed stock/ETF universe or exchange lifecycle | Optional enrichment only |
| Manual override file | Correct aliases, names, classification, or status | Small, auditable corrections | Can drift or mask upstream quality issues | Recommended small server-side overlay |
| Mocked sample file for implementation bootstrap | Minimal deterministic fixtures | Enables contract/search testing without external access | Not representative or production-complete | Required for early tests; clearly label mocked |

Rules:

- Do not call KIS or fetch an external source file in Phase 3EJ.
- Do not claim KIS provides a complete symbol master unless a later source-verification phase proves it.
- KRX/exchange use requires later owner approval and licensing/automation review.
- OpenDART is not sufficient alone because its current tracked integration is a readiness shell and it is not an ETF/listing master.
- Phase 3EK should be mocked-first or static-seed-first, not live-sync-first.
- All imported source data must be transformed through the normalized contract before use.

## 7. Search Index Plan

Search must not call KIS per keystroke. Phase 3EK should build a local in-memory index on the server and/or a generated client-safe static payload from the reviewed symbol master.

Required behavior:

- Unicode NFKC, trim, whitespace collapse, and normalized lowercase matching;
- Korean `nameKo` matching;
- canonical and display symbol matching;
- alias matching;
- optional English-name matching;
- `assetType` filters;
- market/exchange filters;
- configurable maximum result limit, with recommended default 15 and allowed owner range 10-20;
- deterministic ordering with a stable final tie-breaker of `nameKo`, then `symbol`;
- no external runtime fetch for search;
- no quote request during search ranking.

Deterministic sort order:

1. Exact symbol match.
2. Exact Korean name match.
3. Prefix symbol match.
4. Prefix Korean name match.
5. Alias match.
6. Contains match.
7. Fallback alphabetical/name order using normalized `nameKo`, then `symbol`.

Client-safe search payloads should contain only `symbol`, `displaySymbol`, display names, market/exchange, currency, asset type, status when approved, and aliases needed for matching. They must exclude upstream source metadata, raw fields, provider symbols, and internal notes.

Initial consumers are Chart AI symbol search, Portfolio holding registration, MyPage watchlist, Market domestic treemap validation, and future Home ticker configuration.

## 8. Quote Snapshot Contract

Future quote consumers should receive a safe normalized projection equivalent to:

```ts
type NormalizedQuoteSnapshot = {
  market: 'KR' | 'US';
  symbol: string;
  price: number | null;
  currency: 'KRW' | 'USD' | string;
  change: number | null;
  changePercent: number | null;
  volume: number | null;
  asOf: string | null;
  marketState: 'open' | 'closed' | 'preopen' | 'afterhours' | 'holiday' | 'unknown';
  staleState: 'fresh' | 'stale-but-usable' | 'unavailable';
  source: 'fixture' | 'owner-live' | 'mocked' | 'cache' | 'unavailable';
  provider: 'kis' | 'fixture' | 'mocked' | 'unknown';
  errorCode?: string;
};
```

Rules:

- No raw provider payload and no provider-specific field names in UI output.
- `price: null` and `asOf: null` are valid and required for unavailable rows.
- `staleState` is explicit and never inferred from UI copy alone.
- `source` differentiates fixture, owner preview, sample/mock, cache fallback, and unavailable behavior.
- `provider` is an allow-listed class label only, not private metadata or an endpoint identifier.
- `changePercent` is the public normalized name; adapters may internally map an existing `changePct` field.
- Public UI must not expose private `providerMeta`.
- Error output uses safe normalized codes and never embeds a provider message/body.

## 9. Quote API Layer Plan

Future shared quote APIs should:

1. Accept and normalize symbol input.
2. Validate the symbol against the approved symbol master.
3. Map market and asset type to a supported quote-provider path.
4. Read the appropriate quote cache first.
5. Call a provider only in approved owner/local or separately approved public-ready modes.
6. Normalize rate/quote fields and timestamps.
7. Classify failures into safe error codes.
8. Strip `providerMeta`, raw provider fields, response bodies, and internal diagnostics.
9. Return explicit source, market-state, and stale-state fields.
10. Fail closed on an unsupported source.
11. Never fall back to fixture data in live-owner unavailable rows.
12. Keep account/trading operations outside the quote layer.

Required normalized unsupported/error states:

```text
SYMBOL_NOT_FOUND
SYMBOL_UNSUPPORTED
MARKET_UNSUPPORTED
ASSET_TYPE_UNSUPPORTED
PROVIDER_CONFIG_MISSING
PROVIDER_AUTH_REQUIRED
PROVIDER_RATE_LIMITED
PROVIDER_UNAVAILABLE
PROVIDER_RESPONSE_UNEXPECTED
QUOTE_STALE_BEYOND_LIMIT
QUOTE_UNAVAILABLE
SOURCE_UNSUPPORTED
UNKNOWN_ERROR
```

The existing owner/local gates remain authoritative until a later public-readiness phase. Batch semantics, maximum symbols, timeout budget, retries, and quota allocation require explicit design before adding multi-symbol endpoints.

## 10. Quote Cache and Freshness Policy

TTL values below are planning defaults, not implementation constants.

| Cache tier | Use case | Suggested TTL | Stale window | Notes |
| --- | --- | --- | --- | --- |
| Owner local preview | Explicit low-volume local quote preview | Fresh 15s | Stale 120s | Matches current memory-cache foundation; stale only after safe provider failure |
| Public fixture/default | Stable synthetic/default UI | Version/build scoped | Not a live stale fallback | Must remain clearly fixture-labeled |
| Future public live | Public normalized quote surface | TBD after quota review | TBD after outage/rights review | Requires rate capacity, coalescing, observability, rollback, and owner approval |
| Alert worker | Scheduled target evaluation | TBD after scheduler design | TBD; never trigger from disallowed stale data | Deduplicate quote requests and alert events |
| Chart AI analysis | Repeated analysis for the same symbol | Fresh 60s | Stale 5m | Avoid repeated provider fetch during one analysis flow |
| Home ticker/Market Snapshot | Shared high-read snapshot cards | Fresh 60s | Stale 5m | Use coalescing/batch policy before public live |

Planning rules:

- Owner preview can retain the current short TTL.
- Future public live needs a separate quota/rate, cache-rights, and request-coalescing policy.
- Chart AI should reuse one normalized observation across repeated analysis steps.
- An alert worker must avoid duplicate provider calls and must not trigger from expired/unavailable data.
- `stale-but-usable` must remain visible where material.
- `unavailable` must not fabricate a price, change, valuation, or alert condition.
- Cache keys should use normalized market and symbol plus provider/schema version where necessary.
- Cache storage should contain normalized snapshots rather than raw provider payloads.

## 11. Market Calendar Plan

A market calendar is required to distinguish genuine staleness from expected closure, label snapshots correctly, schedule alerts, and define after-hours behavior.

Recommended first scope:

```text
KR market calendar only, static or mocked-first.
```

The first calendar contract should represent date, trading-day status, holiday name when known, session boundaries, timezone, early/special close, and source/version timestamps. It must cover market open/closed state, holidays, stale-label accuracy, alert scheduling, and after-hours behavior. The domestic-first implementation must not imply US calendar coverage; a future US market calendar remains a separate gap.

No calendar data or synchronization is implemented in Phase 3EJ.

## 12. Source and Freshness Label Policy

Allowed labels include the exact product-copy concepts:

```text
fixture
owner preview
sample
조회 시점 기준
최근 조회 기준
데이터 일시 불가
평가 불가
연동 실패
```

Forbidden unless a later WebSocket-specific phase explicitly supports and validates them:

```text
실시간
실시간 시세
real-time
live FX
current FX
actual market value
```

REST snapshots must not be labeled as real-time. Mocked FX remains visibly sample/mocked. Fixture data must not be confused with live data. Unavailable rows remain visible where they represent user holdings, with unavailable financial values withheld rather than replaced.

## 13. Provider Leakage Guard Plan

The following must never be exposed in public UI, owner UI, logs, docs, or safe outputs:

```text
raw KIS fields
providerMeta
raw provider payload
request body
response body
authorization headers
access tokens
app keys
app secrets
account numbers
environment values
provider URLs
stack traces containing provider data
```

Allowed safe normalized fields are `market`, `symbol`, approved `price`, `currency`, `change`, `changePercent`, `volume`, `asOf`, `marketState`, `staleState`, `source`, an allow-listed provider class name, and a safe error code.

Every future API adapter must use an explicit projection function rather than object spreading provider results. Static leakage checks should scan API routes, UI serialization, logs, fixtures, and owner-run report output. Safe diagnostics may report counts, normalized codes, cache state, and timing buckets only.

## 14. Storage and File Plan

| Option | Description | Pros | Cons | Recommended first use |
| --- | --- | --- | --- | --- |
| Checked-in JSON seed | Reviewed normalized master stored in the repository | Versioned, deterministic, offline | Manual update and repository churn | Yes, first bootstrap source |
| Generated static JSON | Build-generated client-safe search projection | Small, fast, browser-safe | Requires reproducible generation and drift checks | Yes, generated from reviewed seed |
| Server-only data file | Overrides/source metadata unavailable to clients | Keeps internal provenance private | Server bundling and update workflow required | Yes, small manual override/provenance file |
| Supabase table | Queryable dynamic symbol records | Central updates and filtering | Schema, RLS, migrations, operations, and availability | Not in Phase 3EK |
| Supabase Storage file | Remotely replaceable master artifact | Simple large-file distribution | Versioning, validation, access, and atomic rollout complexity | Not in Phase 3EK |
| External source fetch at build time | Refresh during controlled build | Static runtime result | Licensing, build reliability, and nondeterminism | Later source-sync design only |
| External source fetch at runtime | Fetch master/search data on demand | Potential freshness | Latency, outages, quota, leakage, and per-user inconsistency | Prohibited for initial search |

Recommended first use:

```text
checked-in mocked/static seed + generated client-safe search JSON.
```

Phase 3EK should not add a Supabase migration unless explicitly scoped. Symbol search must not perform runtime external fetches. Provider raw/source metadata remains server-side. The generated client-safe JSON contains only safe display/search fields and should include a schema/version marker and generation timestamp.

## 15. Consumer Surface Mapping

| Consumer | Uses symbol master | Uses quote snapshot | Uses cache | Uses calendar | Notes |
| --- | --- | --- | --- | --- | --- |
| Home ticker belt | Yes, for configured security proxies | Yes | Yes | Yes | Cross-asset items still need separate source map |
| Home MARKET SNAPSHOT | Yes | Yes | Yes | Yes | Public live remains blocked |
| Chart AI search | Yes | No | No | No | First direct consumer of client-safe search index |
| Chart AI analysis | Yes | Yes | Yes | Yes | Historical series remains a separate gap |
| Market treemap | Yes | Yes | Yes | Yes | Constituents/weights/sector source is separate |
| Market Momentum / Trend | Yes | Yes plus history | Yes | Yes | Compute features from normalized observations |
| Lab asset-class comparison | Possibly, for proxy securities | Yes plus history | Yes | Multi-calendar | External/global sources remain necessary |
| Lab S&P500 sector returns | US master later | US quote/history later | Yes | US calendar later | Blocked by US provider/source decisions |
| Portfolio holdings | Yes | Yes | Yes | Yes | Preserve unavailable rows and null aggregates |
| MyPage watchlist | Yes | Later | Later | Later | Persistence is not part of Phase 3EK |
| MyPage price alerts | Yes | Yes | Yes | Yes | Requires scheduler, suppression, delivery, history |

## 16. Implementation Roadmap

Recommended order:

```text
Phase 3EK - Domestic Symbol Master / Search Index Mocked-First Implementation
Phase 3EL - Chart AI Domestic Symbol Search Wiring
Phase 3EM - Normalized Quote Infrastructure Refactor Plan
Phase 3EN - Home Ticker Belt / MARKET SNAPSHOT Owner Preview Plan
Phase 3EO - Market Domestic Treemap Source Plan
Phase 3EP - MyPage Watchlist MVP Plan
Phase 3EQ - External Data and US Quote Provider Decision Plan
```

Symbol master comes first because every later consumer needs stable identity, display names, asset classification, market/currency, lifecycle state, and validation before requesting or presenting quotes. Building visible quote UI first would duplicate symbol parsing and make provider leakage and unsupported-symbol behavior inconsistent.

## 17. Owner Decision Matrix

| Decision | Options | Recommended default | Needed before |
| --- | --- | --- | --- |
| First implementation scope | Stocks only; stocks + ETFs; wider domestic | Domestic stocks + ETFs | Phase 3EK |
| Domestic ETFs included or excluded | Include; exclude | Include | Phase 3EK seed acceptance |
| Static seed vs live metadata source | Static/mock; verified sync | Checked-in mocked/static seed first | Phase 3EK |
| Client-side search data shape | Full safe record; compact projection; server-only search | Compact generated client-safe projection | Phase 3EK |
| Search result limit | 10; 15; 20 | 15, within 10-20 range | Phase 3EK |
| Suspended/delisted symbols | Exclude; include marked; unknown status | Include only when source clearly marks status; otherwise `unknown` | Source import policy |
| Manual override file | None; small server-only overlay | Yes, small server-side override file | Phase 3EK |
| Quote TTL defaults | Current short; per-surface tiers | Keep owner preview short; public TBD | Phase 3EM |
| Market calendar first source | Mock/static; later official sync | KR mocked/static first | Calendar implementation |
| Supabase in first implementation | None; table; Storage | Not in first implementation | Phase 3EK |
| Public live previews later | Disabled; owner preview; public gated | Disabled | Public-readiness phase |
| Whether `source=auto` remains deferred | Deferred; implement routing | Deferred | Quote-routing phase |
| Home visible progress before infrastructure | Infrastructure first; jump to Home | After symbol/search infrastructure | Phase ordering |

## 18. Risk Register

| Risk | Impact | Mitigation / gate |
| --- | --- | --- |
| Incomplete symbol coverage | Valid securities missing from search | Seed coverage report, owner-reviewed sample, explicit unknowns |
| Incorrect ETF classification | Wrong provider/UI behavior | Curated ETF regression set and override file |
| Ticker/name mismatch | Wrong security selected | Canonical code validation and deterministic identity tests |
| Search result confusion | User chooses similar/wrong name | Exact/prefix ranking, market/type labels, stable limits |
| Stale symbol master | New/delisted symbols inaccurate | `sourceAsOf`, version, freshness report, controlled refresh |
| Provider rate limits | Quote outages or throttling | Cache, coalescing, batch/quota policy before public use |
| Stale quote confusion | Misleading values | Explicit stale labels and market-calendar-aware policy |
| Raw provider leakage | Security/legal/contract exposure | Explicit safe projection and static leakage checker |
| Fixture/live confusion | False trust in sample data | Mandatory source labels and no silent fallback |
| Market holiday handling | False stale warnings/alerts | KR calendar before alert scheduling |
| Alert over-triggering | Duplicate/noisy notifications | Worker dedupe, suppression, history, allowed freshness |
| Public live premature activation | Quota, outage, and UX risk | Preserve disabled default and separate readiness approval |
| Mobile overflow from dense search results | Broken layout | Result limit, local scroll/containment, mobile baseline and geometry guard |
| Supabase schema churn | Migration and operational cost | Keep Phase 3EK file-based; separate persistence design |
| External source licensing ambiguity | Unauthorized storage/display | Owner/legal/source review before sync or public use |

## 19. Validation Plan

Future implementation phases must include:

```bash
npm run check:mobile-baseline
npm run check:production-domain
npm run build
git diff --check
npm run guard:production-mobile-geometry
```

Feature-specific checks are required for the symbol master contract, search index contract, client-safe search payload, quote snapshot normalization, provider leakage guard, cache/freshness policy, and market calendar labels.

Each implementation phase must also audit changed source/API/UI/provider files and dependency changes. A mocked/static pass is not evidence of live source coverage, current provider rights, public readiness, or production acceptance. Production geometry should only run after actual deployment and explicit owner approval; planning and pre-deployment phases use dry-run only.

## 20. Final Recommendation

Recommended next phase: Phase 3EK - Domestic Symbol Master / Search Index Mocked-First Implementation.

Alternative: Phase 3EN - Home Ticker Belt / MARKET SNAPSHOT Owner Preview Plan, only if the owner prioritizes visible UI progress before shared symbol/search infrastructure.
