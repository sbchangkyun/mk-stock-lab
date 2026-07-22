# Phase 3DZ - FX Provider Selection and Real FX Adapter Plan

## 1. Status

Planned - FX provider selection and real adapter plan completed; no runtime changes.

## 2. Background

Phase 3DY completed the KIS / FX live-data continuation plan. The current boundary is:

- Owner-run KIS smokes passed for representative KR stocks `005930` and `000660` and KR ETF `069500`.
- The Portfolio owner live preview API smoke passed for the guarded local KR-only path.
- FX remains mocked through `src/lib/server/providers/fxMockAdapter.ts`.
- Mixed-currency valuation exists only through mocked FX helper logic in `buildPortfolioValuationFromQuotesWithFx()`.
- A real FX provider is not selected.
- The KIS US quote endpoint is not implemented.
- Public `source=live` remains disabled; `source=fixture` remains the default.
- `source=auto` remains deferred and unsupported.
- Phase 3DX UI architecture rules and the Phase 3DW production mobile geometry guard remain binding for future public UI changes.

This phase evaluates provider categories and defines provider-neutral contracts only. It makes no live KIS or FX calls, changes no runtime source, and does not enable any public live-data path.

## 3. Current FX Integration Baseline

| Area | Current behavior | Boundary |
| ---- | ---------------- | -------- |
| Mocked adapter | `fxMockAdapter.ts` returns a fixed synthetic USD/KRW rate of `1350` with `source: 'mocked'` and `staleState: 'sample'` | It is contract/test data, not a current or live rate |
| Mocked pairs | Supports USD/KRW directly and KRW/USD by inversion | No other non-identity pair is supported |
| Identity pairs | KRW/KRW and USD/USD return `1` | Identity conversion requires no provider request |
| Mixed-currency helper | `buildPortfolioValuationFromQuotesWithFx()` in `portfolioValuation.ts` accepts normalized quotes plus an FX snapshot | Mocked FX caps the aggregate freshness at `stale-but-usable` |
| Missing FX | Mixed-currency totals remain null/unavailable when required FX is absent | Cost basis or fixture values are not substituted as live values |
| Owner live preview API | The guarded local path is KR-only with `baseCurrency=KRW` and at most 10 positions | Real FX and mixed-currency live valuation are not wired into this route |
| Public behavior | `source=fixture` is the stable default | Mixed-currency real FX is not public production behavior |

Existing normalized quote, cache, and response boundaries remain useful. The default quote cache is in-memory, with an optional persistent backend already available for quotes, but no FX cache behavior is implemented or approved by this plan.

## 4. Provider Selection Criteria

Provider facts, plan terms, quotas, prices, and legal rights can change. The owner must confirm them directly against the current provider agreement before implementation or production use.

| Criteria | Why it matters | Required for MVP? | Owner decision needed? |
| -------- | -------------- | ----------------- | ---------------------- |
| USD/KRW support | Required to convert initial USD holdings into the KRW portfolio base | Yes | Confirm provider coverage |
| KRW/USD support | Needed for inverse display or a future USD base; may be derived safely from USD/KRW | Yes, direct or derived | Confirm whether derivation is acceptable |
| Timestamp availability | Required to classify freshness and compare FX with quote time | Yes | Confirm accepted timestamp semantics |
| Freshness granularity | Distinguishes intraday data from daily reference rates | Yes | Select an intraday or reference-rate policy |
| Historical rate support | Enables `asOf` valuation and deterministic tests later | No for first live snapshot | Decide future historical scope |
| Free vs paid plan | Affects quota, freshness, rights, and continuity | Yes | Approve paid usage and budget |
| Rate limits | Determines cache TTL, coalescing, and owner/public capacity | Yes | Approve usage budget and headroom |
| Commercial usage allowance | Public display and derived portfolio values may require commercial rights | Yes | Owner/legal confirmation required |
| Authentication model | Controls secret storage, token refresh, and operational complexity | Yes | Approve account and credential ownership |
| API reliability/SLA | Determines whether the source is suitable for portfolio totals | Yes | Set minimum reliability expectations |
| Provider terms | May restrict storage, redistribution, attribution, and derived display | Yes | Owner/legal review required |
| Fallback/stale-data permission | Provider terms may constrain caching or reuse during outage | Yes | Approve permitted stale behavior |
| Response schema simplicity | Reduces normalization and unexpected-response risk | Yes | Technical evaluation only |
| Server-side use suitability | The adapter must run server-side without a browser dependency | Yes | Confirm provider permits backend use |
| TypeScript integration complexity | Affects implementation, testability, and maintenance | No | Technical evaluation only |
| No raw provider payload exposure | Prevents proprietary fields and sensitive diagnostics reaching clients | Yes | Fixed security requirement |
| No client-side key exposure | Provider credentials must never ship to the browser | Yes | Fixed security requirement |

Selection evidence should record the reviewed documentation date and terms version. Marketing labels such as “live” must not substitute for timestamp, update-frequency, and SLA evidence.

## 5. Provider Candidate Categories

No provider is selected by this plan. Public documentation gives useful examples only:

- A commercial FX API such as [Open Exchange Rates](https://openexchangerates.org/about) documents JSON live and historical currency data and an App ID model; its current pricing, quota, licensing, and commercial terms still require owner review.
- A general financial data API such as [Alpha Vantage](https://www.alphavantage.co/documentation/) documents currency exchange-rate and historical FX functions using an API key; its plan limits and usage rights require owner confirmation.
- A central-bank source such as the [ECB Data API](https://data.ecb.europa.eu/help/api/data) exposes reference data. It must be evaluated as published reference-rate data, not assumed to be intraday or real-time.
- The [KIS Open API service description](https://apiportal.koreainvestment.com/about-open-api) documents OAuth-based access and material market-data use/redistribution restrictions. This plan does not assume that a suitable FX endpoint or public-display right exists.

| Category | Strengths | Risks | Likely cost profile | Expected freshness | Expected authentication | Owner preview | Eventual public production |
| -------- | --------- | ----- | ------------------- | ------------------ | ----------------------- | ------------- | -------------------------- |
| 1. Commercial FX API provider | Currency-focused schema, broad pair coverage, historical endpoints, support options | Subscription dependency; quotas, attribution, storage, and redistribution terms vary | Free trial or limited tier, then paid by quota/features | Intraday to daily depending on plan | Server-side API key/App ID | Suitable after account and mocked tests | Potentially suitable only with commercial rights, capacity, and SLA approval |
| 2. Financial market data API provider | May combine FX with future securities data and shared operations | FX may be secondary; plan limits and symbols can differ from quote products | Limited free tier or paid market-data plan | Intraday, delayed, or end-of-day by product | Server-side API key or token | Suitable after timestamp semantics are proven | Potentially suitable after rights, quota, and outage policy review |
| 3. Bank or central-bank reference-rate source | Authoritative publication, simple public data, low credential burden | Usually daily/reference-only; weekends, holidays, and publication lags; unsuitable for “real-time” claims | Usually no direct API fee | Scheduled daily/reference publication | Often none, but source terms still apply | Suitable for conservative reference valuation | Suitable only if reference-rate UX and publication cadence are explicitly accepted |
| 4. Existing broker/market-data provider, if FX endpoint exists | Could reuse operational relationship and authentication | Endpoint existence, pair coverage, redistribution rights, account coupling, and rate limits are not established | Existing account or separate market-data agreement | Product-specific | OAuth/client credentials or broker token | Only after endpoint and account-policy confirmation | High legal/operational review; KIS restrictions prevent automatic assumption |
| 5. Manual owner-supplied FX source for early testing | Deterministic, no provider integration, easy mocked-first verification | Manual, stale, unaudited, and not scalable; can be mistaken for live data | No API cost | Owner supplied; not live | None; local test input only | Suitable for explicitly labeled sample testing | Not suitable |

The final comparison must use the same criteria matrix across shortlisted providers and must not infer permission from a free tier or accessible endpoint.

## 6. Recommended MVP FX Scope

Initial real FX MVP should support only USD/KRW and KRW/USD, plus identity pairs such as KRW/KRW and USD/USD.

Reasons:

- Current portfolio totals primarily use KRW as the base currency.
- The validated KIS KR stock/ETF quote path is KRW-oriented.
- A single canonical USD/KRW snapshot can validate mixed-currency valuation safely.
- KRW/USD may be derived as `1 / USDKRW` when the rate is finite and greater than zero, if the owner approves derivation.
- Identity pairs should return `1` locally without consuming provider quota.
- Restricting the MVP reduces pair mapping, timestamp, cache, fallback, and provider-term ambiguity.

Additional currencies require a later scope decision and dedicated contract cases.

## 7. Provider-Neutral FX Interface

The Phase 3EA implementation should define provider-neutral types similar to the following. This is documentation only; no runtime type is added in Phase 3DZ.

```ts
type SupportedFxCurrency = 'KRW' | 'USD';

type FxRateRequest = {
  baseCurrency: SupportedFxCurrency;
  quoteCurrency: SupportedFxCurrency;
  asOf?: string;
};

type FxRateSource = 'mocked' | 'live' | 'cache' | 'unavailable';
type FxStaleState = 'fresh' | 'stale-but-usable' | 'sample' | 'unavailable';

type FxErrorCode =
  | 'FX_CONFIG_MISSING'
  | 'FX_AUTH_REQUIRED'
  | 'FX_PROVIDER_RATE_LIMITED'
  | 'FX_PROVIDER_UNAVAILABLE'
  | 'FX_SYMBOL_UNSUPPORTED'
  | 'FX_RESPONSE_UNEXPECTED'
  | 'FX_STALE_BEYOND_LIMIT'
  | 'FX_UNKNOWN_ERROR';

type FxRateSnapshot = {
  baseCurrency: SupportedFxCurrency;
  quoteCurrency: SupportedFxCurrency;
  rate: number | null;
  asOf: string | null;
  source: FxRateSource;
  staleState: FxStaleState;
  providerCode?: string;
  errorCode?: FxErrorCode;
};
```

Contract rules:

- A usable non-identity result requires a finite positive `rate` and a valid normalized UTC timestamp in `asOf`.
- Identity pairs return `rate: 1` without a provider call and use the request/evaluation time as the normalized timestamp.
- `rate` is `null` when the pair is unavailable, invalid, or stale beyond the approved limit.
- `asOf` is `null` only when no trustworthy provider timestamp can be normalized; such a provider result is unavailable.
- `source` records the normalized delivery path, not an untrusted provider field.
- `sample` is reserved for mocked/manual test data and must not be labeled live.
- Provider errors map to `errorCode`; provider messages, request URLs, raw response bodies, headers, and stack details remain server-internal.
- `providerCode` may be a short allow-listed identifier for server diagnostics. It must not contain account, request, subscription, or secret values.
- Provider-specific metadata is stripped before Portfolio API serialization. Existing `providerMeta` remains absent from the public response.

## 8. Freshness and Stale Policy

The final thresholds depend on the selected provider category and owner tolerance. Phase 3EA should make the policy explicit and injectable rather than burying provider-specific constants in valuation logic.

Proposed planning defaults:

| Source policy | Fresh | Stale-but-usable | Unavailable |
| ------------- | ----- | ---------------- | ----------- |
| Intraday provider candidate | Age at or below 15 minutes, subject to the provider guarantee | Older than 15 minutes and at or below 24 hours | Older than 24 hours, missing/invalid timestamp, or invalid rate |
| Daily reference-rate candidate | Latest expected published reference date for the provider calendar | Prior accepted publication during a weekend/holiday grace period, capped at 72 hours | Beyond the publication/grace policy, missing/invalid timestamp, or invalid rate |

Rules:

- These are proposed defaults, not approved production values. Provider guarantees and the owner decision may require stricter thresholds.
- Market closed behavior must follow the selected provider publication calendar. A closed FX venue or weekend does not turn old data into intraday-fresh data.
- A timestamp is mandatory for every non-identity provider rate. Missing, future-skewed, or unparseable timestamps produce `unavailable` and `FX_RESPONSE_UNEXPECTED`.
- A rate older than the stale limit produces `unavailable` and `FX_STALE_BEYOND_LIMIT`; it is not used in totals.
- If the KIS quote timestamp and FX timestamp differ by more than the owner-approved alignment tolerance, the affected mixed-currency rows and totals are at most `stale-but-usable`; beyond the stale limit they are unavailable.
- A portfolio summary uses the least-fresh state among required usable quotes and FX snapshots.
- The UI may display “fresh,” “stale,” “sample,” or “unavailable” according to normalized state. It must not claim “real-time” unless the selected provider guarantee and owner policy explicitly approve that wording.

## 9. Error Classification

| Code | Meaning | Retryable? | Result/UI behavior | Owner action |
| ---- | ------- | ---------- | ------------------ | ------------ |
| `FX_CONFIG_MISSING` | Required server configuration is absent | No | Required FX and affected mixed-currency totals unavailable | Supply approved server-only configuration |
| `FX_AUTH_REQUIRED` | Credential absent, rejected, or expired | Only after credential correction/refresh | Unavailable; no raw provider error exposed | Verify account, key, token, and plan |
| `FX_PROVIDER_RATE_LIMITED` | Provider quota or burst limit reached | Yes, after server-directed backoff | Use permitted cache only within stale window; otherwise unavailable | Review quota/cache/capacity if recurring |
| `FX_PROVIDER_UNAVAILABLE` | Timeout, network failure, or provider 5xx/outage | Yes, bounded and backoff-aware | Use permitted cache only within stale window; otherwise unavailable | Review incident if persistent |
| `FX_SYMBOL_UNSUPPORTED` | Pair is outside adapter/provider scope | No | Pair and dependent totals unavailable | Approve scope/provider change |
| `FX_RESPONSE_UNEXPECTED` | Invalid schema, timestamp, or rate | No immediate retry unless transient evidence exists | Unavailable; retain sanitized diagnostics only | Review adapter/provider contract |
| `FX_STALE_BEYOND_LIMIT` | Last valid rate exceeds approved stale window | Retry only to fetch a newer value | Unavailable; stale value excluded from totals | Reassess provider freshness/outage |
| `FX_UNKNOWN_ERROR` | Unclassified safe failure | At most one bounded retry if safe | Unavailable with generic public state | Investigate sanitized server diagnostics |

Configuration and authentication failures require owner action and must not be retried in a tight loop. Rate limiting and provider outage are transient candidates for bounded retry with jitter/backoff. Every error can produce unavailable rows when no policy-permitted cache entry exists. Raw provider codes/messages, payloads, credentials, URLs containing keys, and request identifiers are blocked from public output.

## 10. Caching and Rate-Limit Policy

- Use an in-memory FX cache as the Phase 3EA default. Do not make the optional persistent cache a prerequisite for the mocked-first phase.
- Use a normalized cache key such as `fx:{provider}:{base}:{quote}:{asOfBucket}`, excluding credentials and user identifiers.
- Identity pairs bypass provider and persistent cache access.
- Cache the canonical provider direction once; derive the inverse from the same timestamp when owner-approved, avoiding two quota-consuming requests and cross-rate drift.
- Align cache fresh TTL and stale TTL with the selected freshness policy. Proposed intraday candidates are 15 minutes fresh and 24 hours stale; reference-rate candidates follow the publication calendar with at most 72 hours of approved weekend/holiday grace.
- Cache only normalized snapshots. Do not cache raw payloads, response headers, authentication data, or provider error bodies.
- Coalesce concurrent requests for the same cache key so one upstream request supplies all waiters.
- On rate limit or outage, serve the last normalized value only if provider terms permit caching and it remains inside the stale window; mark it `source: 'cache'` and `staleState: 'stale-but-usable'`.
- Do not silently fall back to mocked, fixture, manual, or cost-basis values after a live FX failure.
- Owner preview should remain low-volume and explicitly gated. Cache misses must not trigger uncontrolled retries.
- Public production remains blocked until quota capacity, burst limits, cache rights, request coalescing, observability, outage behavior, and a safe rollback policy are approved and tested.
- Any future persistent FX cache requires a separate design decision, normalized-schema contract, retention policy, and owner smoke. This phase makes no Supabase change.

## 11. Integration with Portfolio Valuation

- Preserve `buildPortfolioValuationFromQuotesWithFx()` as the provider-neutral valuation seam; it should consume normalized `FxRateSnapshot` data, never a raw provider response.
- Keep `source=fixture` as the default API/UI path.
- Introduce real FX in the existing non-production, explicit owner preview path first, in a later phase with separate gates and tests.
- Mixed-currency rows require both a usable market quote and a usable FX snapshot when their quote currency differs from the portfolio base.
- If FX is unavailable, affected row market value, gain/loss, and dependent totals remain null/unavailable. Unaffected same-currency rows may remain usable, but the complete portfolio total must not imply completeness.
- Portfolio totals and KPI summaries use the least-fresh required input state and clearly distinguish partial from complete valuation.
- UI freshness badges reflect normalized quote and FX freshness conservatively; `sample` and unavailable data must remain explicit.
- Live FX failure must not fall back to fixture FX, mocked FX, cost basis, or an implicit rate of `1` for a non-identity pair.
- `providerMeta`, raw provider fields, and provider error messages must not appear in the Portfolio API response.
- Mixed-currency public production remains blocked until provider, cache, owner smoke, UX review, and production acceptance gates pass.

## 12. Security and Secret Handling

- API keys, client secrets, and access tokens are server-only and must never enter client bundles or browser-visible responses.
- No raw provider payload, authorization header, credential-bearing URL, request body, or response body may be logged.
- Phase 3DZ does not read `.env`, `.env.local`, or any secret file.
- Documentation, fixtures, tests, reports, and commit history must not contain secret values.
- Provider credentials must not be committed.
- Creating an account, accepting provider terms, purchasing a plan, or changing Vercel environment variables requires explicit owner approval.
- Provider secrets must not depend on Supabase Storage or database rows; this plan adds no Supabase dependency, SQL, or migration.
- Public errors contain only allow-listed normalized codes and availability/freshness state.

## 13. Owner Decisions Required

The owner must decide before Phase 3EA can include a real provider skeleton:

1. Which provider category is preferred?
2. Should a paid provider be allowed, and what budget/quota ceiling applies?
3. Is USD/KRW-only provider coverage acceptable for the MVP?
4. Is deriving KRW/USD from one timestamped USD/KRW rate acceptable?
5. What FX freshness tolerance is acceptable for intraday versus daily reference data?
6. Is stale FX display allowed, for how long, and under which UI label?
7. Should unavailable FX block all mixed-currency totals while preserving unaffected row values?
8. Should real FX appear only in owner preview first?
9. Should public production remain fixture-only until a mixed-currency owner smoke and UX review pass?
10. Who will create/own the provider account and supply the API key if needed?
11. When can `source=auto` be reconsidered, and which provider/cache/UX/production gates must pass first?

Owner confirmation must also cover current commercial rights, storage/fallback permissions, attribution, rate limits, and SLA. Codex must not create the account or run a credentialed call.

## 14. Recommended Next Implementation Phase

Recommended next phase after owner decisions: **Phase 3EA - Real FX Adapter Mocked-First Implementation**.

Phase 3EA scope:

- Implement provider-neutral FX types and normalization boundaries.
- Keep the existing mocked adapter as the behavioral baseline.
- Add a real adapter skeleton only if the provider decision, auth model, terms, and policy decisions are complete.
- Do not make live calls by Codex.
- Add mocked behavioral tests for direct, inverse, identity, stale, invalid, unavailable, and safe-error cases.
- Add an owner-run fail-closed dry-run script only if credentials are later supplied by the owner in an approved environment.
- Do not enable public production, `source=auto`, US quotes, or Portfolio UI behavior.

If provider selection remains unresolved, use the smaller **Phase 3DZ-HF1 - Owner FX Provider Decision Closeout** instead. That phase should record the owner’s category/provider, commercial-plan, pair, freshness, stale, credential-ownership, and preview policy decisions without runtime changes.

## 15. Validation Plan for Phase 3EA

Future Phase 3EA validation should include:

1. Static provider-boundary checker proving server-only imports and no client key exposure.
2. Mocked FX behavioral checker for direct, inverse, identity, freshness, null, and error cases.
3. Portfolio mixed-currency valuation checker covering complete, partial, and unavailable totals.
4. Owner-run FX smoke dry-run proving explicit guard and fail-closed behavior without a provider call.
5. No-secret output checker for logs, API responses, fixtures, and reports.
6. `npm run check:portfolio-live-preview-api` regression checker.
7. `npm run check:phase-3dx-ui-architecture-plan`.
8. `npm run check:mobile-baseline` if UI changes occur.
9. `npm run guard:production-mobile-geometry` in dry-run mode; guarded production geometry only after a separately approved public UI deployment.
10. `npm run build`.
11. `git diff --check` and an explicit file-scope audit.

A mocked pass is not evidence that provider authentication, a live rate, an owner smoke, public production, or provider terms have passed.

## 16. Final Recommendation

Proceed to Phase 3EA only after the owner confirms the FX provider category, MVP currency-pair scope, freshness tolerance, and whether a paid provider is acceptable.

No runtime source file under `src/` was changed. No deployment was performed. No push was performed.
