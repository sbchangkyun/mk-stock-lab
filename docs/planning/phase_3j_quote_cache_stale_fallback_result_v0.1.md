# Phase 3J Quote Cache Stale Fallback Result v0.1

## Status And Scope

Phase 3J added a server-only in-memory quote cache/stale/fallback policy for the existing local/dev KIS quote route. The route remains `GET /api/market/quote`, local/dev-only for provider execution, and disconnected from Market, Portfolio, Chart AI, Home, and Lab UI.

No Supabase cache write, DB migration, persistent cache, production cache activation, deployment, Vercel env mutation, SQL, Supabase CLI, psql, or UI live quote wiring was added.

## Phase 3I Live Smoke Baseline Summary

The owner reported that Phase 3I local live smoke passed for `/api/market/quote?market=KR&symbol=005930`: the route returned `ok: true`, normalized `QuoteSnapshot` fields, `currency=KRW`, `staleState=fresh`, and `providerMeta.provider=kis`, with no key, token, raw provider payload, authorization header, app secret, or stack trace in the response.

## Files Changed

- `src/lib/server/providers/types.ts`
- `src/lib/server/marketData/quoteCache.ts`
- `src/lib/server/marketData/quotes.ts`
- `src/pages/api/market/quote.ts`
- `scripts/smoke_market_quote_route_disabled.mjs`
- `scripts/smoke_quote_cache_policy.mjs`
- `docs/planning/phase_3j_quote_cache_stale_fallback_result_v0.1.md`
- `docs/planning/planning_changelog.md`
- `docs/planning/phase_3c1_portfolio_manual_smoke_checklist_v0.1.md`

## Cache Policy Summary

- Cache storage: module-local in-memory `Map`.
- Cache key: `quote:{market}:{normalizedSymbol}`, for example `quote:KR:005930`.
- Fresh TTL: 15 seconds.
- Stale TTL: 120 seconds.
- Cached payload: normalized `QuoteSnapshot` only.
- Not cached: raw KIS payload, raw headers, token, key, secret, authorization header, account number, raw errors, or provider internals.

Production TTLs and persistent cache policy remain future-phase work.

## Fresh, Stale, And Expired Behavior

- Fresh cache: returned immediately as `ok: true`, `staleState=fresh`, `fallback.reason=cache-fresh`.
- Stale-but-usable cache: provider refresh is attempted. If refresh fails, stale cache is returned as `ok: true`, `staleState=stale-but-usable`, `fallback.reason=cache-stale-provider-failed`.
- Expired cache: removed and not used. If provider also fails, the sanitized provider error is returned.
- No cache: existing provider flow runs behind the Phase 3I feature gate.

## Quote Service Flow Summary

1. Validate market and symbol.
2. Check in-memory cache.
3. Return fresh cache when available.
4. Attempt provider refresh for missing or stale cache.
5. Cache successful normalized provider response.
6. Return stale cache only when provider refresh fails and stale window is still valid.
7. Return sanitized provider error when no usable cache exists.

## API Response Behavior Summary

The route preserves:

- `GET` only.
- `Cache-Control: no-store`.
- public local/dev route with provider feature gate.
- normalized success shape `{ ok: true, data, fallback }`.
- sanitized failure envelope.

The success fallback metadata is browser-safe:

- `fallback.state`
- `fallback.reason`
- `fallback.cache.hit`
- `fallback.cache.state`
- `fallback.cache.cachedAt`
- `fallback.cache.freshUntil`
- `fallback.cache.staleUntil`

No token, key, app secret, raw KIS payload, raw headers, or stack trace is exposed.

## Sanitized Error And Fallback Behavior Summary

Provider failures still return sanitized provider envelopes when no usable cache exists. Stale fallback returns `ok: true` with stale metadata and never includes the raw provider failure.

## In-Memory-Only Confirmation

The cache is in server process memory only. It is not persisted to disk, localStorage, sessionStorage, Supabase, DB tables, Vercel storage, browser state, or generated assets.

## No Supabase Cache Write Confirmation

No Supabase cache write was implemented. No Supabase connection was attempted by Codex validation.

## No DB Migration Confirmation

No DB migration was added. No SQL, Supabase CLI, or psql command was run.

## No UI Wiring Confirmation

Market, Portfolio, Chart AI, Home, and Lab remain disconnected from `/api/market/quote`.

## Automated Smoke Summary

- `node scripts/smoke_quote_cache_policy.mjs`: passed.
- `node scripts/smoke_market_quote_route_disabled.mjs`: passed.
- `npm run check:provider-boundaries`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.

The cache smoke verified provider-fresh, cache-fresh, stale fallback, expired unavailable behavior, and no unsafe marker in serialized smoke output.

## Owner-Only Live Smoke Summary

Codex did not run live KIS smoke because private credentials are owner-controlled. Owner live smoke is optional for Phase 3J because the owner already confirmed Phase 3I live quote behavior.

## Security Notes

- KIS provider execution remains behind the existing local/dev feature gate.
- Production provider execution remains disabled.
- Quote cache does not contain token, key, secret, authorization header, account number, or raw provider data.
- Token lifecycle remains separate from quote cache.
- Ignored `.env*` contents were not read.
- No secret values were requested or recorded.

## Remaining Risks

- In-memory cache is per server process and will reset on restart.
- Owner live cache behavior can only be confirmed in a private credential-backed local runtime.
- Persistent cache, production TTLs, quota policy, and UI integration require separate approval phases.

## Recommended Next Action

Optional owner live cache smoke, then decide whether the next phase should plan persistent cache policy or safely wire limited UI reads.

## Minimal Owner Review Checklist

```text
Phase 3J Quote Cache/Stale/Fallback 검토 결과:

* Codex 자동 검증 결과가 통과함: 통과/실패
* quote cache가 server-only in-memory 범위로 제한됨: 통과/실패
* raw KIS payload/token/key가 cache 또는 응답에 저장/노출되지 않음: 통과/실패
* provider 실패 시 stale-but-usable fallback 정책이 문서와 구현에 반영됨: 통과/실패
* DB migration/Supabase cache write/UI live quote 연결이 아직 구현되지 않음: 통과/실패
* 실제 KIS live smoke 재확인: 통과/실패/미실행
* 비밀 정보 없는 메모:
```
