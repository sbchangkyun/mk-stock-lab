# Phase 3K Persistent Quote Cache Policy Plan v0.1

## Status And Scope

Phase 3K is documentation and planning only. It defines how a future phase should move from the Phase 3J server-only in-memory quote cache to a Supabase-backed persistent quote cache. It does not implement persistent writes, add migrations, run SQL, connect to Supabase, change provider behavior, wire UI live quotes, mutate Vercel env, or deploy.

Official Supabase guidance reviewed for this planning pass:

- Supabase Row Level Security documentation: `https://supabase.com/docs/guides/database/postgres/row-level-security`
- Supabase API security documentation: `https://supabase.com/docs/guides/api/securing-your-api`
- Supabase API key documentation: `https://supabase.com/docs/guides/getting-started/api-keys`
- Supabase changelog search for recent breaking-change context.

The key planning implications are:

- RLS is required for defense in depth on exposed tables.
- Data API reachability is controlled by grants plus RLS policies.
- `service_role` and secret keys bypass RLS and must stay server-only.

## Phase 3J Approval And Baseline Summary

Phase 3J added server-only in-memory quote caching around `GET /api/market/quote`. Owner review accepted:

- module-local in-memory cache scope.
- normalized `QuoteSnapshot`-only cache payload.
- no raw KIS payload, token, key, header, account number, or raw error cache.
- stale-but-usable fallback on provider failure.
- no DB migration, Supabase cache write, or UI live quote integration.

Current Phase 3J behavior:

- cache key example: `quote:KR:005930`.
- fresh TTL: 15 seconds.
- stale TTL: 120 seconds.
- fresh cache returns immediately.
- stale cache attempts provider refresh.
- provider failure inside stale window returns stale cache.
- expired cache is discarded.
- no DB persistence.
- no UI wiring.

## Current Cache Baseline

The current code uses `src/lib/server/marketData/quoteCache.ts` with a module-local `Map`. It stores only cloned normalized `QuoteSnapshot` objects plus timestamps:

- `cachedAtMs`
- `freshUntilMs`
- `staleUntilMs`

This should carry forward:

- normalized payload only.
- explicit fresh, stale, and expired states.
- stale fallback only on provider failure.
- browser-safe fallback metadata.
- no raw provider payload or token material.

This must change for persistent cache:

- cache must survive process restart.
- cache must be shared across server instances.
- server write boundaries must be explicit.
- stale and cleanup policy must be queryable.
- provider quota protection must account for concurrent requests.
- public read policy must not expose user-specific data or secrets.

## Persistent Cache Goals

The future persistent quote cache should:

- reduce repeated KIS provider calls.
- keep KIS credentials and tokens server-only.
- store only normalized, browser-safe market quote data.
- support fresh and stale-but-usable fallback.
- avoid storing raw KIS payloads.
- avoid storing provider tokens, keys, secrets, authorization headers, account numbers, raw errors, or stack traces.
- enable future server-side Market, Portfolio, and Chart AI read paths.
- preserve service-role-only writes.
- avoid public writes.
- keep production activation approval-gated.

## Proposed `market_quote_cache` Table Usage

The current reviewed migration already defines `public.market_quote_cache` with:

- `id`
- `symbol`
- `market`
- `quote_json`
- `cached_at`
- `expires_at`
- unique `(symbol, market)`
- indexes on `(symbol, market)` and `expires_at`
- RLS enabled
- public read policy
- service-role write grants

Future persistent implementation can start from that existing table if the team accepts storing a normalized JSON payload in `quote_json`.

Recommended future columns if a later migration evolves the shape:

- `cache_key`
- `market`
- `symbol`
- `provider`
- `source`
- `currency`
- `price`
- `change`
- `change_pct`
- `volume`
- `market_state`
- `as_of`
- `stale_state`
- `payload_normalized_json`
- `cached_at`
- `fresh_until`
- `stale_until`
- `expires_at`
- `provider_version`
- `schema_version`
- `last_refresh_status`
- `last_error_code`
- `created_at`
- `updated_at`

Columns that must not exist:

- `raw_kis_response`
- `raw_headers`
- `app_key`
- `app_secret`
- `access_token`
- `authorization`
- `account_number`
- `refresh_token`
- `raw_error`
- `stack_trace`
- `connection_string`
- `db_password`

Unique key proposal:

- preferred future shape: unique `cache_key`.
- acceptable current shape: unique `(symbol, market)`.
- if multiple providers or sources become active, use unique `(market, symbol, provider, source)`.

Index proposal:

- unique `cache_key`.
- `(market, symbol)`.
- `fresh_until`.
- `stale_until`.
- `expires_at`.
- `updated_at`.

Retention expectation:

- quote cache rows should be small.
- retain only currently supported symbols or recently requested symbols.
- future cleanup can remove expired rows older than the stale window plus a short audit grace period.

## RLS And Service-Role Policy

Initial persistent implementation should use the app server API as the read and write surface:

- server writes only through service-role runtime.
- browser direct writes forbidden.
- provider refresh only in server routes.
- public browser reads through app API first.

If direct public Supabase reads are allowed later:

- RLS must remain enabled.
- Data API grants must remain explicit.
- anon/authenticated roles may read only normalized public market quote rows.
- anon/authenticated roles must not insert, update, or delete quote cache rows.
- no user-specific data may exist in `market_quote_cache`.
- user Portfolio data must stay in `portfolios` and `portfolio_positions`.
- Portfolio valuation must be computed server-side or through user-scoped routes, not stored in public quote cache.

Service-role policy:

- service-role writes are allowed only from server runtime.
- service-role key must never be imported or exposed in browser code.
- RLS is defense in depth; service-role bypass means application code must enforce write scope carefully.

## Cache Lifecycle Policy

Local/dev policy should preserve Phase 3J defaults:

- fresh TTL: 15 seconds.
- stale TTL: 120 seconds.

Production planning ranges:

- open-hours fresh TTL: 10 to 30 seconds.
- open-hours stale TTL: 2 to 10 minutes.
- after-hours fresh TTL: longer than open-hours after exchange close is verified.
- after-hours stale TTL: longer only if UI clearly labels quote freshness.

Expired behavior:

- expired rows must not be shown as live price.
- expired rows should not be used for normal quote success.
- expired rows may support explicit unavailable placeholders only if clearly labeled in a later UI phase.

Stale-but-usable behavior:

- use stale cache only when provider refresh fails.
- return `staleState=stale-but-usable`.
- include stale metadata in `fallback`.
- never silently present stale data as fresh.

Manual invalidation triggers:

- KIS response schema change.
- symbol mapping correction.
- suspected bad quote.
- TTL policy change.
- provider source switch.
- cache payload schema version change.

Automated cleanup:

- future scheduled cleanup can remove expired rows.
- no cleanup implementation is part of Phase 3K.

## Provider Refresh And Quota Protection Policy

Future persistent refresh should include:

- single-flight refresh per cache key to avoid duplicate KIS calls.
- minimum refresh interval per key.
- provider call throttling across concurrent requests.
- provider rate-limit detection mapped to sanitized provider errors.
- stale fallback on rate-limit if stale cache exists.
- no cache update when provider response is malformed.
- sanitized `last_error_code` only if error state is stored.
- no raw error or stack trace persistence.

Rate-limit behavior:

- if provider is rate-limited and stale cache exists, return stale-but-usable.
- if provider is rate-limited and no usable cache exists, return sanitized `PROVIDER_RATE_LIMITED`.

Provider unavailable behavior:

- stale cache if within stale window.
- sanitized `PROVIDER_UNAVAILABLE` if no usable cache exists.

Invalid provider data:

- do not cache malformed data.
- stale cache if available.
- otherwise sanitized provider error.

## API Response Policy

Future persistent cache should preserve `GET /api/market/quote` response shape:

```json
{
  "ok": true,
  "data": "QuoteSnapshot",
  "fallback": {
    "state": "fresh",
    "reason": "cache-fresh",
    "cache": {
      "source": "persistent",
      "state": "fresh",
      "cachedAt": "timestamp",
      "freshUntil": "timestamp",
      "staleUntil": "timestamp"
    }
  }
}
```

Allowed future fallback metadata:

- `fallback.state`
- `fallback.reason`
- `fallback.cache.source`: `memory` or `persistent`
- `fallback.cache.state`
- `fallback.cache.cachedAt`
- `fallback.cache.freshUntil`
- `fallback.cache.staleUntil`

The API must not reveal:

- KIS endpoint internals beyond documented generic provider identity.
- raw KIS response.
- KIS headers.
- token values.
- app key values.
- app secret values.
- account numbers.
- stack traces.
- env readiness details beyond generic sanitized config state.

Keep `Cache-Control: no-store` until a later explicit HTTP caching policy changes it.

Production activation remains a separate approval gate.

## Security And Privacy Policy

`market_quote_cache` is public market data only.

Do not store:

- user IDs.
- portfolio IDs.
- position IDs.
- account numbers.
- provider tokens.
- provider secrets.
- provider app keys.
- authorization headers.
- raw provider payloads.
- raw provider errors.
- stack traces.
- connection strings.

Logging policy:

- no full provider headers.
- no full provider payloads.
- no token or secret values.
- no raw database errors returned to the browser.

## Relationship To Future Features

Market UI:

- future Market cards may read quote cache after explicit UI integration approval.
- live tiles must label stale data.

Portfolio:

- future valuation may consume quote cache server-side.
- user valuation data must not be written to public `market_quote_cache`.

Chart AI:

- future context builder may consume normalized quote cache.
- AI response cache remains separate in `chart_ai_cache`.
- quote cache must not store prompts, user questions, or AI output.

Treemap:

- real return calculations likely need `market_chart_cache`, not only quote cache.
- quote cache can support latest price overlays only.

OpenDART:

- disclosure/company metadata belongs in a separate cache or table.
- do not mix OpenDART payloads into `market_quote_cache`.

Future US stock support:

- requires separate provider policy, symbol validation, currency handling, TTL, and market-hours rules.
- Phase 3K does not expand provider support.

## Future Implementation Roadmap

Recommended next phases:

- Phase 3L: Supabase persistent quote cache migration review and adjustment plan. Approval gate: DB migration review only.
- Phase 3M: server-side persistent cache adapter, disabled by default. Approval gate: Supabase write code approval.
- Phase 3N: local/dev persistent cache write smoke against owner-approved disposable or controlled Supabase environment. Approval gate: Supabase write validation.
- Phase 3O: limited Market UI read integration through `/api/market/quote`. Approval gate: UI live-data approval.
- Later production phase: production persistent cache activation and deployment. Approval gates: provider live-call approval, production DB write approval, Vercel env approval, deployment approval.

Alternative sequencing:

- If UI urgency is higher, Phase 3O can consume the existing in-memory route first, but this will not solve multi-instance persistence.
- If quota risk is higher, implement persistent cache adapter before any UI reads.

## Explicit Non-Goals

- No DB migration.
- No SQL execution.
- No Supabase CLI.
- No psql.
- No Supabase connection.
- No Supabase write.
- No persistent cache implementation.
- No UI live quote wiring.
- No provider behavior change.
- No Vercel env mutation.
- No deployment.
- No order/account/trading/balance/holdings/WebSocket API.
- No OpenDART/OpenAI/Gemini integration.
- No real AI analysis.
- No visitor count.
- No ad-event tracking.
- No scraping.
- No external asset download.
- No broad crypto functionality.
- No investment recommendations.

## Validation Performed

- Reviewed Phase 3J cache result document.
- Reviewed Phase 3I KIS route result document.
- Reviewed Phase 3G provider/data readiness references through repository search.
- Reviewed current `quoteCache.ts`, `quotes.ts`, and quote route source.
- Reviewed current planned `market_quote_cache` schema in `supabase/migrations/20260615_rebuild_schema_v0_1.sql` without executing SQL.
- Reviewed relevant Supabase planning notes.
- Confirmed intended Phase 3K file changes are docs-only.
- Confirmed no app source changes were made.
- Confirmed no migration file was added.
- Confirmed no SQL, Supabase CLI, psql, Supabase connection, Supabase write, Vercel env mutation, or deployment was run.
- Confirmed no ignored `.env*` content was read.

Build was skipped because Phase 3K is documentation-only and app source/package files were not changed.

## Remaining Risks

- Current migration has only `quote_json`, `cached_at`, and `expires_at`; a later migration may be needed for explicit `fresh_until`, `stale_until`, provider metadata, and sanitized refresh status columns.
- Direct public read through Supabase Data API should be re-reviewed before UI consumption.
- Production TTLs depend on market-hours behavior, provider quotas, and UI needs.
- Persistent refresh concurrency requires a concrete single-flight or lock design in a later implementation phase.

## Recommended Next Action

Proceed to Phase 3L only after owner approval for persistent quote cache migration review. Do not implement Supabase writes or UI live quote reads until separate approval gates are passed.

## Minimal Owner Review Checklist

```text
Phase 3K Persistent Quote Cache Policy Planning 검토 결과:

* persistent cache 구현 전 정책 문서로 충분함: 통과/실패
* market_quote_cache에 저장 가능한 데이터와 금지 데이터가 명확함: 통과/실패
* service-role write/RLS/read boundary가 명확함: 통과/실패
* TTL/fresh/stale/expired 정책이 명확함: 통과/실패
* provider 실패/rate-limit 시 fallback 정책이 명확함: 통과/실패
* DB migration/Supabase write/UI live quote 연결이 아직 구현되지 않음: 통과/실패
* 다음 phase 승인 게이트가 명확함: 통과/실패
* 비밀 정보 없는 메모:
```
