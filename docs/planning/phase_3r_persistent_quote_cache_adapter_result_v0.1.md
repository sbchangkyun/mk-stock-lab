# Phase 3R Persistent Quote Cache Adapter Result v0.1

## Status And Scope

Phase 3R implemented a disabled-by-default, server-only persistent Supabase quote cache adapter for normalized public quote snapshots.

The current in-memory quote cache remains the default backend. The Supabase persistent backend is opt-in only through the non-secret runtime switch `QUOTE_CACHE_BACKEND=supabase`.

Codex did not execute SQL, did not connect to Supabase, did not run Supabase MCP database queries, did not list projects, did not run live Supabase reads or writes, did not run live KIS calls, did not touch production DB, did not mutate Vercel environment values, and did not deploy.

## Baseline Before Phase 3R

- Phase 3J provided a server-only in-memory quote cache with 15-second fresh and 120-second stale fallback windows.
- Phase 3M added the reviewed `market_quote_cache` lifecycle migration file.
- Phase 3Q recorded that the owner manually applied the Phase 3M migration to production with sanitized pass/fail evidence.
- Live UI quote wiring remained blocked.
- Persistent cache adapter code did not exist.

## What Was Implemented

- Added `src/lib/server/marketData/supabaseQuoteCache.ts`.
- Added persistent cache read, success upsert, and sanitized refresh-failure metadata functions.
- Added cache-key normalization for `quote:{market}:{UPPER_SYMBOL}`.
- Added async configured cache functions in `src/lib/server/marketData/quoteCache.ts`.
- Updated `src/lib/server/marketData/quotes.ts` to use the configured cache backend while preserving memory default behavior.
- Updated `src/lib/server/supabaseAdmin.ts` so the server helper can be imported safely by mock-only Node validation without resolving environment values at module load time.
- Added `scripts/smoke_persistent_quote_cache_adapter.mjs`.
- Added `npm run smoke:persistent-quote-cache`.
- Strengthened `scripts/check_server_only_provider_boundaries.mjs` to reject client imports of server modules and the persistent quote cache adapter.

## Cache Backend Selection Policy

- Default backend: memory.
- Explicit opt-in backend: Supabase.
- Switch name: `QUOTE_CACHE_BACKEND`.
- Only the exact runtime value `supabase` selects the persistent adapter.
- Any missing or different value uses the memory backend.
- No Vercel environment value was read, printed, pulled, added, updated, or removed by Codex.

## Server-Only Supabase Adapter Boundary

The adapter lives under `src/lib/server/marketData/` and calls the existing server-only Supabase admin helper only when the persistent backend is explicitly enabled or when mock validation injects a fake client.

Browser/client code must not import the adapter. The provider boundary check now detects server-module imports outside `src/lib/server/` and `src/pages/api/`.

## Normalized Payload Policy

Persistent writes use only normalized public quote snapshot fields:

- `market`
- `symbol`
- `exchange`
- `providerSymbol`
- `price`
- `currency`
- `change`
- `changePct`
- `volume`
- `marketState`
- `asOf`
- `staleState`

The table write shape uses the Phase 3M lifecycle fields:

- `cache_key`
- `symbol`
- `market`
- `provider`
- `source`
- `quote_json`
- `cached_at`
- `expires_at`
- `fresh_until`
- `stale_until`
- `schema_version`
- `last_refresh_status`
- `last_error_code`
- `updated_at`

## Forbidden Persistence Data

The adapter does not persist raw KIS payloads, provider headers, authorization headers, app keys, tokens, account numbers, raw errors, stack traces, DB URLs, connection strings, user IDs, portfolio IDs, or position IDs.

The mock smoke validates that unsafe extra runtime fields are dropped from `quote_json`.

## TTL And Stale Fallback Behavior

- Fresh TTL remains 15 seconds.
- Stale TTL remains 120 seconds.
- Persistent reads classify rows as fresh, stale-but-usable, expired, or miss using the same lifecycle window semantics as the in-memory cache.
- Quote service still returns stale cache only when the provider refresh fails and the stale window is still usable.
- Expired persistent rows are not used for successful quote responses.

## Service-Role Write Boundary

Persistent writes are intended to run only server-side through the Supabase admin helper. Public roles may read normalized public quote cache rows under the Phase 3M schema and policy boundary, while writes remain server-side/service-role only.

Codex validation used a mock Supabase client and did not invoke the live admin client.

## Public-Read Safety

The cache payload is normalized public quote data only. The adapter never returns raw DB errors to browser-facing layers; cache read/write failures are converted to sanitized provider envelopes.

Supabase documentation reviewed for this phase reinforces that exposed tables require RLS/Data API care and that privileged keys must remain outside browser clients.

## Validation Performed

- `node scripts/smoke_persistent_quote_cache_adapter.mjs`: passed.
- `node scripts/smoke_quote_cache_policy.mjs`: passed.
- `node scripts/smoke_market_quote_route_disabled.mjs`: passed.
- `npm run check:provider-boundaries`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- Vercel output check: `.vercel/output/config.json`, `.vercel/output/functions/_render.func`, and `.vercel/output/static` exist.
- Browser/static output scan for provider secret markers and server-only markers: no matches.
- Adapter import scan: persistent adapter appears only in server source.
- Service-role marker scan: expected server-only source references only; no browser/static match.
- Static source review: no root `README.md`, migration file, production SQL pack, Vercel env, deployment, UI live quote wiring, or provider execution change was made.

## Explicit Non-Goals

Phase 3R did not:

- execute SQL
- run Supabase CLI
- run psql
- run Supabase MCP database queries
- list Supabase projects
- connect to Supabase
- run live Supabase reads or writes
- touch production DB
- run live KIS calls
- implement OpenDART, OpenAI, Gemini, or other provider calls
- wire live quotes into Market, Portfolio, Chart AI, Home, or Lab UI
- mutate Vercel environment values
- deploy
- create Auth users
- implement account, order, balance, holdings, trading, or WebSocket APIs
- implement visitor count
- implement ad-event tracking
- scrape or download external assets
- modify root `README.md`
- modify migration files
- modify production SQL pack files

## Files Changed

- `package.json`
- `scripts/check_server_only_provider_boundaries.mjs`
- `scripts/smoke_persistent_quote_cache_adapter.mjs`
- `src/lib/server/marketData/quoteCache.ts`
- `src/lib/server/marketData/quotes.ts`
- `src/lib/server/marketData/supabaseQuoteCache.ts`
- `src/lib/server/supabaseAdmin.ts`
- `docs/planning/phase_3r_persistent_quote_cache_adapter_result_v0.1.md`
- `docs/planning/planning_changelog.md`
- `docs/planning/phase_3c1_portfolio_manual_smoke_checklist_v0.1.md`

## Remaining Risks

- The persistent adapter was validated with mocks only; live Supabase read/write behavior still requires a separate owner-approved smoke phase.
- Production cache activation requires an external environment switch and should be reviewed separately before enablement.
- Live UI quote wiring remains blocked until explicitly approved.
- The production migration status is based on owner-provided sanitized Phase 3Q evidence; Codex did not independently inspect production.

## Recommended Next Action

Run an owner-approved non-UI API smoke for persistent cache enablement in a controlled runtime, using sanitized pass/fail evidence only. Keep UI live quote wiring blocked until the adapter enablement smoke passes.

## Minimal Korean Owner Review Checklist

```text
Phase 3R Persistent Supabase Quote Cache Adapter 검토 결과:

* persistent Supabase quote cache adapter가 server-only로 구현됨: 통과/실패
* memory cache가 default backend로 유지됨: 통과/실패
* Supabase persistent backend가 opt-in 방식으로만 동작함: 통과/실패
* raw KIS payload/token/key/header/account data가 저장되지 않음: 통과/실패
* quote_json에는 normalized public quote snapshot만 저장되도록 제한됨: 통과/실패
* service-role/server-side write boundary가 유지됨: 통과/실패
* browser/client 코드가 persistent adapter를 import하지 않음: 통과/실패
* Codex가 Supabase live query/write를 실행하지 않음: 통과/실패
* Codex가 SQL/Supabase MCP DB query/project listing을 실행하지 않음: 통과/실패
* UI live quote wiring이 아직 구현되지 않음: 통과/실패
* Vercel env 변경 및 deployment가 없음: 통과/실패
* mock/static validation이 통과함: 통과/실패
* 다음 단계가 별도 adapter enablement 또는 API smoke approval임: 통과/실패
* 비밀 정보 없는 메모:
```
