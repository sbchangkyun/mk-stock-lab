# Phase 3G Provider/Data Readiness Plan v0.1

## Status And Scope

Phase 3G is a planning-only phase on `rebuild/phase-1-ia-shell`. It defines future provider and data-readiness boundaries before any real provider integration. No provider call, AI execution, market-data fetch, Supabase command, SQL, DB migration, Vercel environment mutation, deployment, Auth user creation, production write validation, visitor-count implementation, ad-event tracking, scraping, or external asset download is part of this phase.

## Phase 3F.4 Baseline Summary

- `/portfolio` has a client-only synthetic `전체 보기` option using `__all_portfolios__`.
- Portfolio aggregate mode merges positions by market and symbol, sums quantity, and uses weighted average buy price.
- Aggregate rows are read-only and keep placeholder valuation behavior.
- Market Treemap and Momentum / Trend chart sizing was tuned for PC viewport fit.
- Market still uses deterministic provider-free sample data.
- `/market` remains primary and `/heatmap` remains backward compatible.
- Chart AI has a server route and usage guard skeleton but no provider execution.
- Header auth stability and `Today: 000` placeholder remain accepted.

## Current Architecture Assessment

### App Surfaces

- Home: product shell, Market/Portfolio/Lab entry points, Home-only sticky ad, and placeholder `Today: 000`.
- Market: provider-free Treemap dashboard with KOSPI200, KOSDAQ150, S&P500, NASDAQ100, and My Portfolio sample universes.
- Chart AI: chart-first UX, query prefill, timeframe controls, and a protected server execution skeleton that returns readiness output only.
- Lab: public route skeletons for research surfaces.
- Portfolio: authenticated Portfolio and Position CRUD with browser-safe client helper, server ownership validation, and client-only aggregate view.

### Current Data Status

- Market universes are deterministic sample data in `src/data/marketTreemapSamples.ts`.
- My Portfolio in Market is still sample model data, not authenticated user data.
- `/portfolio` uses real persisted portfolio data after login and includes a client-side aggregate view.
- Portfolio current price, valuation, FX conversion, P/L, and performance analytics remain placeholders.
- Chart AI provider execution is not implemented.
- `Today: 000` remains a placeholder; no visitor counting is active.

### Existing Server-Only Boundaries

- `src/pages/api/chart-ai/analyze.ts`: validates bearer auth, consumes Chart AI usage, and returns provider-readiness output.
- `src/lib/server/chartAiUsage.ts`: server-only usage guard wrapper for `internal.consume_chart_ai_usage(uuid, integer)`.
- `src/lib/server/supabaseAdmin.ts`: service-role/admin helper with a runtime browser guard.
- `src/lib/server/portfolio.ts`: server-side Portfolio ownership, input validation, mapping, and sanitized API responses.
- `src/pages/api/portfolio/*.ts`: app API routes that validate server-side session context before data access.

### Existing Browser-Only Boundaries

- `src/lib/supabase.ts`: browser Supabase public client using public env names only.
- `src/lib/portfolioClient.ts`: browser helper that sends bearer tokens to app API routes.
- `src/lib/chartAiClient.ts`: browser helper that posts to `/api/chart-ai/analyze`.
- `src/components/MarketShell.astro`: browser-rendered SVG chart UI and view-mode behavior.
- `src/lib/exportCardImage.ts`: browser-only PNG export; no upload or DB storage.

### Architecture Risks

- `src/lib/supabase.ts` attaches the browser Supabase client to `window.supabase`; this is public-client only, but future server-only helpers must never follow that pattern.
- Market and Portfolio currently have separate aggregate paths; future real Portfolio-to-Market integration needs a shared server contract to avoid drift.
- Provider errors must be normalized before UI exposure; raw provider payloads should never pass through.
- Cache tables exist in the schema plan, but app code does not yet read or write them.

## Provider Inventory And Roles

| Provider | Intended Role | Must Not Do |
| --- | --- | --- |
| KIS | Domestic quotes, possibly US quotes, exchange-specific quote data, and candle data if supported by the selected API. | Must not be called from browser code. Must not expose app key, secret, access token, account data, raw errors, or provider payloads to the client. |
| OpenDART | Corporate code mapping, listed company disclosure metadata, financial statement/disclosure metadata in later phases. | Must not be scraped. Must not expose API key. Must not block market UI when unavailable. |
| OpenAI/Gemini | Future Chart AI explanation/generation from curated server-prepared context. | Must not receive provider keys, Supabase tokens, raw user tokens, or unredacted private user data. Must not generate buy/sell/hold advice or guaranteed-return claims. |
| Supabase | Auth, app data persistence, user Portfolio persistence, usage guard, provider cache persistence, and protected server writes. | Browser must never receive service-role key. Public cache reads must not allow public writes. User-scoped rows must remain owner-scoped. |
| Optional future market providers | Index, FX, commodities, or supplemental market-data coverage if KIS/OpenDART cannot cover a requirement. | No provider is selected in Phase 3G. No reference site scraping or downloading is allowed. |

## Server-Only Boundary Plan

Future provider modules should be documented and then implemented only after an approval-gated phase:

- `src/lib/server/providers/kisClient.ts`
- `src/lib/server/providers/openDartClient.ts`
- `src/lib/server/providers/providerErrors.ts`
- `src/lib/server/marketData/quotes.ts`
- `src/lib/server/marketData/charts.ts`
- `src/lib/server/marketData/securityMaster.ts`
- `src/lib/server/portfolio/valuation.ts`
- `src/lib/server/chartAi/contextBuilder.ts`

Forbidden import rules:

- Server provider modules must never be imported into `.astro` client scripts.
- Server provider modules must never be imported into `src/lib/*.ts` browser utilities.
- Browser code may call only app API routes.
- Provider credentials and provider access tokens must remain in server runtime memory or server-side cache only.

Allowed call flow:

1. Browser UI calls an app API route.
2. API route validates input and auth requirements.
3. API route checks cache freshness and rate-limit state.
4. Server-only module calls provider only when cache policy and quota allow it.
5. API route returns normalized data or a sanitized error envelope.

Token handling:

- Provider credentials live only in Vercel environment variables or ignored local environment files.
- Values are never logged, returned to client, stored in docs, or embedded in generated bundles.
- KIS access tokens should be cached server-side with expiry metadata, never in browser storage.
- All provider errors should be mapped to internal error codes before response.

## Future API Route Contract Plan

All route names below are conceptual. They must not be implemented until the relevant approved phase.

### `GET /api/market/quote?market=KR&symbol=005930`

- Input: `market`, `symbol`.
- Auth: public read is acceptable for public market symbols; auth optional.
- Provider dependency: KIS or approved quote provider.
- Cache dependency: `market_quote_cache`.
- Rate-limit: per IP/session throttle plus provider quota guard.
- Response: `{ ok, data: QuoteSnapshot, fallback }`.
- Error: `ProviderErrorEnvelope`.
- Fallback: fresh cache, stale-but-usable cache, then placeholder.

### `GET /api/market/chart?market=KR&symbol=005930&interval=1d`

- Input: `market`, `symbol`, `interval`.
- Auth: public read for supported public securities.
- Provider dependency: KIS or approved chart provider.
- Cache dependency: `market_chart_cache`.
- Rate-limit: stricter than quote route; interval-aware TTL.
- Response: `{ ok, data: ChartSeries, fallback }`.
- Fallback: cached series, then empty chart-ready placeholder.

### `GET /api/market/treemap?universe=KOSPI200&period=1d`

- Input: whitelisted `universe`, whitelisted `period`, optional portfolio scope only if authenticated.
- Auth: public for market universes, required for real My Portfolio data.
- Provider dependency: security membership source, quote cache, chart/return calculation.
- Cache dependency: `heatmap_cache`, `market_quote_cache`, `market_chart_cache`.
- Rate-limit: public route should be cache-first and quota-protected.
- Response: `{ ok, data: { constituents, asOf, staleState }, fallback }`.
- Fallback: labeled sample data only when no real/cache data exists.

### `GET /api/portfolio/valuation?portfolioId=...`

- Input: real `portfolioId`.
- Auth: required.
- Provider dependency: quote snapshots and FX data if needed.
- Cache dependency: quote/cache only; user valuation output may be computed on demand.
- Rate-limit: per-user throttle; refresh button should not force provider calls unboundedly.
- Response: `{ ok, data: PortfolioValuationSummary }`.
- Fallback: persisted positions with placeholder valuation flags.

### `GET /api/portfolio/valuation?scope=all`

- Input: `scope=all`.
- Auth: required.
- Provider dependency: quote snapshots and FX data for all owned positions.
- Cache dependency: quote/cache only; aggregate computed server-side.
- Rate-limit: stricter per-user throttle due to potentially larger fan-out.
- Response: aggregate summary plus per-row source portfolio metadata.
- Fallback: source positions plus placeholder valuation flags.

### `POST /api/chart-ai/analyze`

- Input: selected security, timeframe, optional user question only if the UX reintroduces it later, and chart context request options.
- Auth: required.
- Provider dependency: quote/chart data first, then OpenAI/Gemini only in an approved AI execution phase.
- Cache dependency: `chart_ai_cache` for non-personal responses only.
- Rate-limit: existing usage guard plus request throttle.
- Response: sanitized analysis sections and data-readiness metadata.
- Fallback: readiness-only response if provider or model is unavailable.

## Data Contract Plan

These TypeScript-like contracts are conceptual only.

```ts
type SecurityIdentity = {
  market: 'KR' | 'US' | 'GLOBAL';
  symbol: string;
  exchange?: string;
  providerSymbol?: string;
};
```

- Source of truth: security master/provider mapping.
- Browser-safe: yes.
- Cacheable: yes.
- User-specific: no.
- Notes: no provider credentials or account identifiers.

```ts
type SecurityMasterRecord = SecurityIdentity & {
  name: string;
  displayName?: string;
  assetType: 'stock' | 'etf' | 'index' | 'fund' | 'other';
  sector?: string;
  currency: 'KRW' | 'USD' | 'OTHER';
  corporateCode?: string;
  isSupported: boolean;
  updatedAt: string;
};
```

- Source of truth: `market_symbols` plus OpenDART/KIS mapping later.
- Browser-safe: yes after normalization.
- Cacheable: yes.
- User-specific: no.
- Notes: corporate code is not secret but should be provider-normalized.

```ts
type QuoteSnapshot = SecurityIdentity & {
  price: number;
  currency: 'KRW' | 'USD' | 'OTHER';
  change: number | null;
  changePct: number | null;
  volume?: number;
  marketState: 'open' | 'closed' | 'delayed' | 'unknown';
  asOf: string;
  staleState: FallbackState;
};
```

- Source of truth: quote provider or `market_quote_cache`.
- Browser-safe: yes.
- Cacheable: yes.
- User-specific: no.
- Notes: include `asOf` and stale state every time.

```ts
type Candle = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

type ChartSeries = SecurityIdentity & {
  interval: '1d' | '1w' | '1m';
  candles: Candle[];
  currency: 'KRW' | 'USD' | 'OTHER';
  asOf: string;
  staleState: FallbackState;
};
```

- Source of truth: chart provider or `market_chart_cache`.
- Browser-safe: yes.
- Cacheable: yes.
- User-specific: no.
- Notes: normalize malformed provider candles before caching.

```ts
type TreemapConstituent = SecurityIdentity & {
  displayName: string;
  sector: string;
  value: number;
  returnPct: number | null;
  weightPct?: number;
  sourcePortfolios?: string[];
  staleState: FallbackState;
};
```

- Source of truth: universe membership, quote/chart cache, or user Portfolio aggregation.
- Browser-safe: public universes yes; user-specific source metadata requires auth.
- Cacheable: public universes yes; user-scoped cache only when owner-scoped.
- User-specific: only My Portfolio scope.

```ts
type MomentumTrendPoint = SecurityIdentity & {
  displayName: string;
  shortMomentum: number | null;
  longTrend: number | null;
  returnPct?: number | null;
  weight?: number;
  staleState: FallbackState;
};
```

- Source of truth: chart series and computed indicators.
- Browser-safe: yes for public symbols; user aggregate auth-scoped.
- Cacheable: yes when non-personal.
- Notes: formula version must be included in future cache metadata.

```ts
type PortfolioPositionInput = {
  portfolioId: string;
  market: 'KR' | 'US';
  symbol: string;
  name?: string | null;
  assetType: 'stock' | 'etf';
  quantity: number;
  buyPrice: number;
  buyDate?: string | null;
  currency: 'KRW' | 'USD';
};
```

- Source of truth: owned Portfolio position rows.
- Browser-safe: only for the authenticated owner.
- Cacheable: no shared cache.
- User-specific: yes.

```ts
type PortfolioValuationRow = PortfolioPositionInput & {
  positionId: string;
  displayName: string;
  currentPrice: number | null;
  marketValue: number | null;
  costBasis: number;
  unrealizedPnl: number | null;
  unrealizedPnlPct: number | null;
  valuationCurrency: 'KRW' | 'USD';
  quoteAsOf?: string;
  staleState: FallbackState;
};
```

- Source of truth: owned positions plus quote/FX cache.
- Browser-safe: only for the authenticated owner.
- Cacheable: computed on demand; do not store shared user valuation unless schema explicitly allows it.
- Notes: null values are valid when quote/FX data is unavailable.

```ts
type PortfolioValuationSummary = {
  scope: 'single' | 'all';
  portfolioId?: string;
  rows: PortfolioValuationRow[];
  totalCostBasis: number;
  totalMarketValue: number | null;
  totalUnrealizedPnl: number | null;
  baseCurrency: 'KRW' | 'USD' | 'MIXED';
  staleState: FallbackState;
};
```

- Source of truth: server-side valuation service.
- Browser-safe: only for the authenticated owner.
- Cacheable: no shared cache.
- Notes: aggregate `전체 보기` must preserve source portfolio metadata.

```ts
type ChartAiContextPackage = {
  security: SecurityMasterRecord;
  quote?: QuoteSnapshot;
  chart?: ChartSeries;
  disclosures?: Array<{ title: string; date: string; category?: string; url?: string }>;
  portfolioExposure?: {
    ownsSecurity: boolean;
    quantity?: number;
    portfolioNames?: string[];
  };
  dataLimitations: string[];
  generatedAt: string;
};
```

- Source of truth: server-side context builder.
- Browser-safe: only the final sanitized subset returned by API.
- Cacheable: non-personal packages only.
- User-specific: only when `portfolioExposure` is included.
- Notes: no raw access tokens, provider keys, or private database errors.

```ts
type ProviderCacheRecord<T> = {
  cacheKey: string;
  provider: 'kis' | 'opendart' | 'openai' | 'gemini' | 'internal';
  payload: T;
  cachedAt: string;
  expiresAt: string;
  staleUntil?: string;
  sourceVersion?: string;
};
```

- Source of truth: existing cache tables.
- Browser-safe: payload dependent.
- Cacheable: yes.
- Notes: never store secrets, raw provider auth payloads, or user tokens.

```ts
type ProviderErrorEnvelope = {
  ok: false;
  code:
    | 'AUTH_REQUIRED'
    | 'CONFIG_MISSING'
    | 'PROVIDER_UNAVAILABLE'
    | 'PROVIDER_RATE_LIMITED'
    | 'SYMBOL_UNSUPPORTED'
    | 'CACHE_MISS'
    | 'DATA_STALE'
    | 'VALIDATION_FAILED'
    | 'INTERNAL_ERROR';
  message: string;
  retryAfterSeconds?: number;
  staleState?: FallbackState;
};

type FallbackState = 'fresh' | 'stale-but-usable' | 'expired' | 'unavailable' | 'sample';
```

- Source of truth: app server.
- Browser-safe: yes after sanitization.
- Cacheable: no for internal errors; possible for stale metadata.
- Notes: never include raw stack traces, SQL errors, provider payloads, or token fragments.

## Cache Policy Plan

Existing planned cache tables to align with:

- `market_symbols`
- `market_quote_cache`
- `market_chart_cache`
- `chart_ai_cache`
- `heatmap_cache`

Recommended TTL policy:

| Cache | Fresh TTL | Stale-Usable Window | Notes |
| --- | ---: | ---: | --- |
| Market quote cache | 30-90 seconds during open market, longer after close | up to 1 trading day | Include market state and `asOf`. |
| Chart cache | 15-30 minutes for daily, 1-4 hours for weekly/monthly | up to 3 trading days | Key by market, symbol, interval, adjustment policy. |
| OpenDART corporate code cache | 7-30 days | up to 90 days | Refresh manually or scheduled; not request-time critical. |
| Disclosure/company info cache | 6-24 hours for recent disclosures, longer for static profile | up to 7 days | Record source date. |
| Treemap cache | 1-5 minutes during open market, longer after close | up to 1 trading day | Public market universe rows can be public-read. |
| Chart AI cache | 1-7 days for non-personal symbol/timeframe analysis | not stale for personalized context | Do not store user-specific context in `chart_ai_cache`. |

Stale states:

- `fresh`: cache is within TTL.
- `stale-but-usable`: expired fresh TTL but inside stale window and clearly labeled.
- `expired`: too old for display except as diagnostic fallback.
- `unavailable`: no provider/cache data.
- `sample`: deterministic sample fallback, visibly labeled as sample.

Fallback rules:

- Prefer fresh cache.
- Use stale-but-usable cache when provider is unavailable and label `asOf`.
- Use placeholder UI if no cache exists.
- Use sample data only where explicitly labeled sample.
- Never cache secrets, auth tokens, raw provider error payloads, direct personal contact/payment data, or raw user PII.

Invalidation triggers:

- Manual refresh.
- Period/timeframe change.
- Market open/close boundary.
- Portfolio position create/update/delete.
- Provider mapping update.
- Formula version change for Momentum / Trend.

## Portfolio Valuation Readiness Plan

Future valuation should combine:

- Owned positions from Portfolio API.
- Quote snapshots by market and symbol.
- FX rates if base currency and quote currency differ.
- Portfolio base currency.
- Cost basis from buy price and quantity.
- Market value, unrealized P/L, and return percentage.

Server-side responsibilities:

- Validate user and portfolio ownership.
- Fetch owned positions.
- Resolve security identities.
- Read quote/FX cache and optionally refresh through server-only provider modules.
- Compute valuation and aggregate rows.
- Return null placeholders when required inputs are missing.

Browser responsibilities:

- Display values and stale states.
- Never submit user id as authority.
- Never call provider endpoints directly.

Aggregate `전체 보기` behavior:

- Server-side aggregate should group duplicates by market and symbol.
- Preserve per-portfolio source names and quantities.
- Handle mixed currencies explicitly as `MIXED` until FX is available.
- Do not fake total market value when any required quote/FX is missing.

Risks:

- Stale quotes during market-close transitions.
- Unsupported symbols.
- Missing FX.
- Delayed or partial provider data.
- Different quote conventions across KR/US markets.

## Market Dashboard Readiness Plan

Universe data flow:

- KOSPI200 and KOSDAQ150 need source membership, security master mapping, quote snapshots, and period return calculation.
- S&P500 and NASDAQ100 need equivalent membership and US quote/chart coverage.
- My Portfolio needs authenticated owned positions, quote snapshots, and server-side aggregate logic.

Constituent strategy:

- Static membership can seed the first implementation if clearly versioned.
- Cached membership should be preferred after provider/source mapping is approved.
- Provider-loaded membership should happen only through server-only jobs/routes.

Return and Momentum / Trend computation:

- Period returns should come from chart candles or provider return data, not client guesses.
- Momentum / Trend should use a documented formula version.
- Formula inputs and output should be cached or reproducible.

Fallback:

- Show cached market universe if stale-but-usable.
- Show sample dashboard only when marked sample.
- For My Portfolio, show owned positions with placeholder valuation when quote data is unavailable.

## Chart AI Readiness Plan

Future server context builder should assemble:

- Selected security identity.
- Recent chart series.
- Quote snapshot.
- Basic company/disclosure metadata if available.
- Portfolio exposure only when the authenticated user permits and owns the data.
- Data limitations, stale states, and source timestamps.

Allowed model output:

- Descriptive chart interpretation.
- Risk factors and scenario framing.
- Data limitations and stale-data warnings.
- Educational explanation of indicators.

Forbidden model output:

- Direct buy/sell/hold recommendation.
- Guaranteed return claims.
- Personalized financial advice.
- Hidden provider/source claims not present in context.

Sequence:

1. Validate auth and usage guard.
2. Validate input.
3. Assemble quote/chart/disclosure context.
4. Apply data-readiness checks.
5. Call AI provider only in an approved provider-execution phase.
6. Sanitize and cache only non-personal outputs if appropriate.

The current usage guard must remain before AI execution. If market data is unavailable, the route should return a readiness/fallback message rather than silently inventing analysis.

## Environment Variable Naming Plan

Names only; no values are requested or recorded.

| Name | Owner | Scope | Browser Safe | Vercel Scope | Local Guidance | Rotation Note |
| --- | --- | --- | --- | --- | --- | --- |
| `KIS_APP_KEY` | Owner/provider | Server provider runtime | No | Preview/Production only after approval | ignored `.env.local` only | Rotate if exposed or staff changes. |
| `KIS_APP_SECRET` | Owner/provider | Server provider runtime | No | Preview/Production only after approval | ignored `.env.local` only | Rotate immediately on exposure. |
| `KIS_ACCOUNT_NO` | Owner/provider | Not needed for public quotes unless future API requires account context | No | Avoid unless explicitly required | ignored `.env.local` only | Treat as sensitive account metadata. |
| `KIS_BASE_URL` | Engineering | Server provider runtime | No | Preview/Production | may use sandbox/non-production URL | Review before switching live/sandbox. |
| `KIS_ACCESS_TOKEN_CACHE_KEY` | Engineering | Conceptual server cache key name | No | Optional server runtime | not a secret value | Rotate cache key namespace if token storage design changes. |
| `OPENDART_API_KEY` | Owner/provider | Server provider runtime | No | Preview/Production only after approval | ignored `.env.local` only | Rotate on exposure. |
| `OPENAI_API_KEY` | Owner/provider | Server AI runtime | No | Preview/Production only after approval | ignored `.env.local` only | Rotate on exposure or provider policy change. |
| `GEMINI_API_KEY` | Owner/provider | Server AI runtime | No | Preview/Production only after approval | ignored `.env.local` only | Rotate on exposure or provider policy change. |
| `PUBLIC_SUPABASE_URL` | Engineering/Supabase | Public browser config | Yes | Preview/Production | ignored `.env.local` only | Not a secret, but still avoid casual logging. |
| `PUBLIC_SUPABASE_ANON_KEY` | Engineering/Supabase | Public browser config | Yes | Preview/Production | ignored `.env.local` only | Public client key; rotate if project policy requires. |
| `SUPABASE_SERVICE_ROLE_KEY` | Owner/Supabase | Server-only admin runtime | No | Server runtime only | ignored `.env.local` only | Rotate immediately on exposure. |

## Error Handling And Observability Plan

Sanitized error taxonomy:

- `AUTH_REQUIRED`
- `CONFIG_MISSING`
- `PROVIDER_UNAVAILABLE`
- `PROVIDER_RATE_LIMITED`
- `SYMBOL_UNSUPPORTED`
- `CACHE_MISS`
- `DATA_STALE`
- `VALIDATION_FAILED`
- `INTERNAL_ERROR`

Logging rules:

- No tokens, provider keys, DB passwords, connection strings, JWTs, refresh tokens, or Vercel tokens.
- No raw provider auth payloads.
- No stack traces or raw SQL/DB errors to browser.
- No user PII in logs.
- Log normalized codes, provider category, market, symbol, cache state, and request id only when safe.

Korean UI copy guidelines:

- Setup missing: `설정이 아직 완료되지 않았습니다.`
- Data preparing: `데이터를 준비하고 있습니다.`
- Provider unavailable: `데이터 제공처가 일시적으로 응답하지 않습니다. 잠시 후 다시 시도해 주세요.`
- Stale data notice: `최근 업데이트 시각 기준 데이터입니다.`
- Unsupported symbol: `지원하지 않는 종목입니다.`

Observability later:

- Add server-side request ids.
- Track provider error counts and rate-limit counts without analytics beacons.
- Keep monitoring implementation in a separate approved phase.

## Approval-Gated Roadmap

| Phase | Goal | Needs Credentials | Needs DB Migration | Needs Supabase Access | Needs Vercel Env Mutation | Needs Deployment | Owner Smoke/Security Gate |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Phase 3H | Server-only provider adapter scaffolding, no external calls | No | No | No | No | No | Static import-boundary review |
| Phase 3I | KIS quote read integration behind server route, local/dev only | Yes | No | Maybe cache read only | Maybe local only first | No | Explicit provider-call approval |
| Phase 3J | Quote cache and stale fallback | Yes | Only if schema gaps exist | Yes | Maybe | No until validated | Cache/RLS/security review |
| Phase 3K | Portfolio valuation read path | Maybe | Maybe | Yes | Maybe | No until validated | Auth owner smoke and cross-user access review |
| Phase 3L | Chart data/candle route | Yes | Maybe | Yes | Maybe | No until validated | Chart fallback and quota review |
| Phase 3M | Chart AI context builder, no AI call | No new AI call | Maybe no | Yes | No | No | Context redaction review |
| Phase 3N | AI provider execution behind usage guard | Yes | Maybe | Yes | Yes | Yes after approval | Explicit AI-call approval and safety review |
| Phase 3O | OpenDART company/disclosure metadata | Yes | Maybe | Yes | Yes | Maybe | Disclosure cache and provider quota review |

Approval gates:

- Any provider call requires explicit owner approval.
- Any Vercel env mutation requires explicit owner approval.
- Any SQL, migration, Supabase CLI, or psql step requires explicit owner approval.
- Any deployment requires explicit owner approval.
- Any authenticated production write validation requires explicit owner approval.

## Security And Non-Goals

- No provider integration code was added in Phase 3G.
- No API provider route was implemented in Phase 3G.
- No DB migration or SQL was added in Phase 3G.
- No Supabase CLI, psql, or Supabase connection was used by Codex validation.
- No Vercel environment values were read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No secret values were requested, read, printed, summarized, or recorded.
- Ignored `.env*` file contents were not read.
- No visitor-count API, DB write, local counting, or analytics was planned for implementation in this phase.
- No ad-event route or tracking logic was implemented.
- No reference-site scraping/fetching or external asset download was implemented.

## Validation Performed

- Static review of planning docs and source boundaries.
- Confirmed current source has server-only Supabase admin helper and browser public Supabase helper separation.
- Confirmed existing planned cache table names from docs/migration history.
- Confirmed root `README.md` is unrelated starter documentation debt and was not modified.
- Build and scans are recorded in the Phase 3G final report after this document update.

## Remaining Risks

- Provider-specific API constraints must be verified against current provider docs before implementation.
- KIS token lifecycle and quote endpoint details are not validated in this planning phase.
- OpenDART corporate-code mapping strategy needs a future data-loading design.
- Existing browser `window.supabase` exposure is public-client only but should be reviewed before adding more browser utilities.
- Cache table schema may need review against final data contracts before provider writes begin.

## Recommended Next Phase

Phase 3H: server-only provider adapter scaffolding with no external provider calls. The phase should create import-boundary scaffolding, provider error types, and testable mock adapters only after owner approval.

## Owner Review Checklist

```text
Phase 3G Provider/Data Readiness Planning 검토 결과:

* Provider/Data 연동 전 설계 문서로 충분함: 통과/실패
* KIS 역할과 범위가 명확함: 통과/실패
* OpenDART 역할과 범위가 명확함: 통과/실패
* Chart AI provider 역할과 제한사항이 명확함: 통과/실패
* server-only provider boundary가 명확함: 통과/실패
* browser에서 provider key를 절대 다루지 않는 구조가 명확함: 통과/실패
* Market quote/chart/treemap API 후보가 명확함: 통과/실패
* Portfolio valuation readiness가 명확함: 통과/실패
* Chart AI context package 설계가 명확함: 통과/실패
* cache/stale/fallback 정책이 명확함: 통과/실패
* env var 이름만 있고 실제 값이 기록되지 않음: 통과/실패
* error handling과 browser 노출 메시지가 안전함: 통과/실패
* provider call, DB migration, SQL, Vercel env mutation, deployment가 실제로 수행되지 않음: 통과/실패
* 다음 phase 승인 게이트가 명확함: 통과/실패
* 비밀 정보 없는 메모:
```
