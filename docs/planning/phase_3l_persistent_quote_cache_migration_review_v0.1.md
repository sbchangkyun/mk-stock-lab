# Phase 3L Persistent Quote Cache Migration Review v0.1

## Status And Scope

Phase 3L is review and planning only. It reviews the current Supabase migration context for `market_quote_cache` against the Phase 3K persistent quote cache policy.

No SQL was executed. No migration file was added. No Supabase CLI command was run. No psql command was run. No Supabase connection or write occurred. No app source behavior changed. No provider behavior changed. No UI live quote wiring was implemented.

## Phase 3K Baseline Summary

Phase 3K defined the future persistent quote cache policy:

- Store normalized public quote data only.
- Do not store raw KIS payloads.
- Do not store KIS app key, app secret, access token, authorization header, approval key, account number, refresh token, raw errors, stack traces, connection strings, or DB passwords.
- Keep provider credentials server-only.
- Prefer app API reads before direct browser Supabase reads.
- Preserve service-role/server writes only.
- Preserve stale-but-usable fallback when provider refresh fails.
- Keep production activation approval-gated.

Phase 3J in-memory baseline:

- cache key example: `quote:KR:005930`.
- fresh TTL: 15 seconds.
- stale TTL: 120 seconds.
- cached payload: normalized `QuoteSnapshot` only.
- fresh cache returns immediately.
- stale cache attempts provider refresh.
- provider failure inside stale window returns stale cache.
- expired cache is discarded.

## Current Migration Inventory

Migration files found:

- `supabase/migrations/20260615_rebuild_schema_v0_1.sql`

Relevant validation SQL files exist under `supabase/validation/`, but they are not migrations and were not executed in Phase 3L.

`market_quote_cache` is currently defined in `supabase/migrations/20260615_rebuild_schema_v0_1.sql`.

Current migration context includes:

- `public.market_quote_cache` table.
- RLS enabled on `public.market_quote_cache`.
- `grant select on public.market_quote_cache to anon, authenticated`.
- service-role select/insert/update/delete grant across cache tables.
- public read policy `market_quote_cache_public_read`.
- unique constraint on `(symbol, market)`.
- indexes on `(symbol, market)` and `expires_at`.

## Current `market_quote_cache` Schema Assessment

Current table columns:

- `id uuid primary key default gen_random_uuid()`
- `symbol text not null check (char_length(symbol) between 1 and 32)`
- `market text not null check (market in ('KR', 'US'))`
- `quote_json jsonb not null`
- `cached_at timestamptz not null`
- `expires_at timestamptz not null`

Current constraints:

- unique `(symbol, market)`
- check `expires_at > cached_at`

Current indexes:

- `market_quote_cache_symbol_market_idx` on `(symbol, market)`
- `market_quote_cache_expires_at_idx` on `(expires_at)`

Current RLS and grants:

- RLS enabled.
- anon/authenticated select grant.
- service-role select, insert, update, delete grant.
- public read policy with `using (true)`.
- no public insert, update, or delete grant.

Assessment:

- The current schema can support a minimal persistent cache by storing a normalized `QuoteSnapshot` and browser-safe fallback metadata in `quote_json`.
- `cached_at` can represent the provider or cache write time.
- `expires_at` can represent the stale expiration boundary if the app treats it as `stale_until`.
- The current schema does not explicitly model `fresh_until`, `stale_until`, `provider`, `source`, `schema_version`, `last_refresh_status`, or `last_error_code`.
- Relying only on `quote_json`, `cached_at`, and `expires_at` makes lifecycle and cleanup policy less queryable and less auditable.
- The current public read policy is acceptable only if `quote_json` remains strictly normalized public market data with no user-specific or provider-secret fields.

## Gap Analysis

### Required For Phase 3M Persistent Adapter

These are required either as columns or as explicitly documented `quote_json` fields before enabling any persistent write code:

- Canonical cache key semantics, either current `(symbol, market)` or explicit `cache_key`.
- Clear meaning of `expires_at`, preferably `stale_until` if current table is used without migration.
- Normalized payload contract for `quote_json`.
- Schema version for the stored normalized payload, either in `quote_json` or as a column.
- Service-role-only write path.
- No public write grants.
- Validation that `quote_json` excludes raw provider payloads, headers, keys, tokens, account numbers, raw errors, stack traces, user IDs, portfolio IDs, and position IDs.

### Recommended Before Production

These should be added or formally reviewed before production persistent cache activation:

- `cache_key text unique`.
- `provider text not null`.
- `source text not null`.
- `fresh_until timestamptz not null`.
- `stale_until timestamptz not null`.
- `schema_version integer not null default 1`.
- `updated_at timestamptz not null`.
- index on `fresh_until`.
- index on `stale_until`.
- index on `(market, symbol, provider, source)`.
- sanitized `last_refresh_status`.
- sanitized `last_error_code`.
- cleanup query/index strategy for expired rows.

### Optional Future Improvement

- Split common quote fields into typed columns: `currency`, `price`, `change`, `change_pct`, `volume`, `market_state`, `as_of`.
- Keep `payload_normalized_json` for the full normalized snapshot.
- Add `provider_version` once KIS adapter versioning exists.
- Add `refresh_attempted_at` for operational observability.
- Add a separate refresh-lock table or advisory-lock strategy for single-flight refresh.

### Not Recommended

- Storing raw KIS response.
- Storing raw KIS headers.
- Storing provider credentials or tokens.
- Storing account numbers.
- Storing raw provider errors or stack traces.
- Storing user IDs, portfolio IDs, or position IDs in `market_quote_cache`.
- Mixing Portfolio valuation output into public quote cache.
- Allowing browser direct writes.
- Using `market_quote_cache` for Chart AI prompts or AI outputs.

## Data Safety Review

Current schema has a flexible `quote_json` column. That flexibility is useful but creates the main safety risk: unsafe values could be written unless server code validates the normalized payload before every write.

Forbidden persistent data:

- raw KIS response.
- raw headers.
- app key.
- app secret.
- access token.
- authorization header.
- account number.
- approval key.
- refresh token.
- raw error.
- stack trace.
- connection string.
- DB password.
- JWT secret.
- Vercel token.
- user IDs.
- portfolio IDs.
- position IDs.
- user Portfolio holdings or valuation rows.

Recommended write validator:

- accept only the normalized `QuoteSnapshot` shape.
- reject unknown secret-like field names.
- reject nested fields matching token, secret, password, authorization, account, raw, header, stack, connection, user_id, portfolio_id, or position_id.
- reject non-public market data mixed with user context.

## RLS, Grants, And API Boundary Review

Current public read policy:

- Acceptable for normalized public quote rows only.
- Not acceptable if `quote_json` can contain provider internals, user-specific data, or raw errors.

Current write boundary:

- Public client roles have select only.
- service-role has write grants.
- This aligns with server-only cache writes.

Recommended initial read path:

- Use app API first, not direct Supabase browser reads.
- Keep `GET /api/market/quote` as the normalization, fallback, and error-sanitization boundary.
- Direct public Supabase reads can remain a later optimization only after payload shape and RLS/grants are re-reviewed.

Supabase guidance implications:

- Grants determine whether roles can reach a table over the Data API.
- RLS policies determine which rows reachable roles can access.
- service-role bypasses RLS, so app code must strictly enforce safe writes.

No policy changes are made in Phase 3L.

## Proposed Adjustment Plan

### Minimal Phase 3M-Compatible Option

Use the current table without migration, but enforce these server-side rules:

- Treat `(market, symbol)` as the unique cache identity.
- Treat `cached_at` as the persistent cache write time.
- Treat `expires_at` as `stale_until`.
- Store `fresh_until`, `stale_until`, `provider`, `source`, `schema_version`, and normalized `QuoteSnapshot` inside `quote_json`.
- Validate `quote_json` with a strict allowlist before every write.
- Keep app API as the read path.

Purpose:

- Enables a local/dev persistent adapter without changing schema.

Risk reduced:

- Avoids migration risk while proving persistent write/read behavior in a controlled environment.

Timing:

- Phase 3M, disabled by default.

Approval:

- Supabase write code approval.
- Disposable validation approval before any live write smoke.

### Production-Hardening Option

Add explicit lifecycle and metadata columns before production cache activation:

- `cache_key`
- `provider`
- `source`
- `fresh_until`
- `stale_until`
- `schema_version`
- `last_refresh_status`
- `last_error_code`
- `updated_at`

Purpose:

- Makes TTL, cleanup, provider identity, and stale fallback queryable and auditable.

Risk reduced:

- Reduces ambiguity from overloading `quote_json`.
- Improves cleanup and monitoring.
- Makes malformed payloads easier to detect.

Timing:

- Phase 3L follow-up migration draft or Phase 3M pre-implementation gate.

Approval:

- DB migration approval.
- Supabase disposable validation approval.
- Production DB approval before production application.

## Non-Executable SQL Draft

BEGIN SQL DRAFT
Non-executable draft for future review only. Do not run this SQL in Phase 3L.

```sql
-- Review-only sketch. Create an actual migration only after owner approval.
alter table public.market_quote_cache
  add column if not exists cache_key text,
  add column if not exists provider text,
  add column if not exists source text,
  add column if not exists fresh_until timestamptz,
  add column if not exists stale_until timestamptz,
  add column if not exists schema_version integer not null default 1,
  add column if not exists last_refresh_status text,
  add column if not exists last_error_code text,
  add column if not exists updated_at timestamptz;

update public.market_quote_cache
set
  cache_key = coalesce(cache_key, 'quote:' || market || ':' || upper(symbol)),
  provider = coalesce(provider, 'kis'),
  source = coalesce(source, 'kis-domestic-quote'),
  fresh_until = coalesce(fresh_until, cached_at + interval '15 seconds'),
  stale_until = coalesce(stale_until, expires_at),
  updated_at = coalesce(updated_at, cached_at);

alter table public.market_quote_cache
  alter column cache_key set not null,
  alter column provider set not null,
  alter column source set not null,
  alter column fresh_until set not null,
  alter column stale_until set not null,
  alter column updated_at set not null,
  add constraint market_quote_cache_cache_key_unique unique (cache_key),
  add constraint market_quote_cache_lifecycle_check
    check (cached_at <= fresh_until and fresh_until <= stale_until and stale_until <= expires_at);

create index if not exists market_quote_cache_fresh_until_idx
  on public.market_quote_cache (fresh_until);

create index if not exists market_quote_cache_stale_until_idx
  on public.market_quote_cache (stale_until);

create index if not exists market_quote_cache_provider_source_idx
  on public.market_quote_cache (market, symbol, provider, source);
```
END SQL DRAFT

Draft notes:

- The lifecycle check assumes `expires_at` remains the final expiration boundary.
- If the team decides `expires_at` should equal `stale_until`, the check and column plan should be simplified before migration.
- The draft does not include policy changes because current RLS/grants already match public-read and service-role-write intent for normalized public quote data.

## Future Phase Roadmap

- Phase 3M: persistent quote cache adapter, disabled by default, no production write.
- Phase 3N: owner-approved disposable Supabase persistent cache write smoke.
- Phase 3O: limited Market UI read integration through `/api/market/quote`.
- Later production phase: production activation with explicit Vercel env and deployment approval.

Approval gates:

- DB migration approval.
- Supabase write approval.
- provider live-call approval.
- UI live-data wiring approval.
- Vercel env mutation approval.
- deployment approval.

## Explicit Non-Goals

- No migration file creation.
- No SQL execution.
- No Supabase CLI.
- No psql.
- No Supabase connection.
- No Supabase write.
- No persistent cache adapter implementation.
- No provider behavior change.
- No KIS route behavior change.
- No UI live quote wiring.
- No Vercel env mutation.
- No deployment.
- No secrets requested or recorded.
- No ignored `.env*` reads.
- No order/account/trading/balance/holdings/WebSocket API.
- No OpenDART/OpenAI/Gemini integration.
- No visitor count.
- No ad-event tracking.
- No scraping or external downloads.

## Validation Performed

- Reviewed Phase 3K persistent quote cache policy plan.
- Reviewed Phase 3J in-memory cache result.
- Reviewed Phase 3I KIS quote route result.
- Reviewed current `quoteCache.ts`, `quotes.ts`, quote route, provider types, and provider errors.
- Inspected `supabase/migrations/20260615_rebuild_schema_v0_1.sql` as text only.
- Inspected current `market_quote_cache` table definition, constraints, indexes, grants, and RLS policy as text only.
- Reviewed relevant Supabase schema planning notes.
- Checked migration inventory.
- Checked documentation completeness.
- Confirmed no app source files changed.
- Confirmed no migration file was added.
- Confirmed no SQL, Supabase CLI, or psql was run.
- Confirmed no Supabase connection/write/cache write occurred.
- Confirmed no Vercel env mutation or deployment occurred.
- Confirmed no secret values were requested or recorded.
- Confirmed ignored `.env*` contents were not read.

Build was skipped because Phase 3L is documentation-only and app source/package/config files were not changed.

## Remaining Risks

- Current `quote_json` flexibility can hold unsafe payloads if future write code lacks strict validation.
- Current table lacks explicit `fresh_until` and `stale_until` columns, so lifecycle querying is ambiguous without a convention.
- Current public read policy is safe only while rows remain normalized public quote data.
- Future direct browser Supabase reads need a separate review.
- Future migration draft must be validated in a disposable Supabase environment before production.

## Recommended Next Action

Owner review of this migration adjustment plan. If accepted, approve Phase 3M only for a disabled-by-default persistent cache adapter, or approve a separate migration-draft phase if explicit lifecycle columns should be added first.

## Minimal Owner Review Checklist

```text
Phase 3L Persistent Quote Cache Migration Review 검토 결과:

* 기존 market_quote_cache 스키마와 Phase 3K 정책 차이가 명확히 정리됨: 통과/실패
* 필수 조정사항과 선택 조정사항이 구분됨: 통과/실패
* RLS/grant/service-role write boundary 검토가 충분함: 통과/실패
* 금지 저장 데이터(raw payload/token/key/계좌정보 등)가 명확함: 통과/실패
* 실제 migration file 생성, SQL 실행, Supabase write가 수행되지 않음: 통과/실패
* 다음 phase 승인 게이트가 명확함: 통과/실패
* 비밀 정보 없는 메모:
```
