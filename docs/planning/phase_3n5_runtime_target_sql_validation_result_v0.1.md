# Phase 3N.5 Runtime Target SQL Validation Result v0.1

## Status And Scope

Phase 3N.5 authorized runtime-only use of the already-configured disposable Supabase project identifier solely as the MCP tool target argument.

Execution is blocked before SQL. The target category is `disposable-remote-approved`, but the runtime-only target handle is not available to Codex in the callable context without supplying an explicit target identifier value. Project listing remains forbidden, and the target identifier must not be printed, logged, summarized, committed, documented, copied into planning docs, or included in final reports.

No SQL was executed. No migration was applied. No Supabase project listing was run. No Supabase MCP database query was run. No Supabase write occurred. No production DB was touched. No app source file changed. No migration file changed. No provider behavior changed. No UI live quote wiring was implemented. No persistent cache adapter was implemented. No Vercel environment value was read, pulled, added, updated, removed, or printed. No deployment was run. Ignored `.env*` contents were not read.

## Owner Runtime-Only Target Handle Approval

Approved:

- runtime-only use of the already-configured disposable target identifier as an MCP tool argument
- SQL execution only against `disposable-remote-approved`
- sanitized pass/fail evidence only

Not approved:

- project listing
- production DB access
- recording the target identifier
- recording Supabase URLs, connection strings, passwords, keys, JWT secrets, access tokens, refresh tokens, authorization headers, or secret-bearing output
- app source changes
- migration file changes
- provider behavior changes
- UI live quote wiring
- persistent cache adapter implementation
- Vercel environment mutation
- deployment

## Target Category

Target category:

- `disposable-remote-approved`

No project reference, URL, or identifier is recorded.

## Execution Path

Execution path attempted:

- runtime target gate only

SQL did not proceed because the callable Supabase MCP database tools still require a target identifier argument, and no runtime-only target handle is available to Codex without recording or discovering the identifier.

Project listing was not run.

## Phase 3M Migration Baseline

Migration intended for validation:

- `supabase/migrations/20260621_market_quote_cache_lifecycle_columns.sql`

Baseline migration:

- `supabase/migrations/20260615_rebuild_schema_v0_1.sql`

The Phase 3M migration is intended to add lifecycle and metadata columns to `public.market_quote_cache`, backfill deterministic values, add lifecycle constraints and indexes, and preserve existing RLS, grants, and policies.

## Static Migration Validation

Static local status:

- baseline migration file exists
- Phase 3M migration file exists
- Phase 3M migration file was not modified in Phase 3N.5
- no SQL execution was started

Static safety expectations from prior reviews remain:

- no public write grants added by the Phase 3M migration
- no `drop table`
- no `drop column`
- no `drop policy`
- no raw provider payload storage columns
- no token, secret, account, user, portfolio, or position storage columns except the approved public-safe `cache_key`

## Baseline Schema Preparation And Inspection

Baseline preparation was not executed.

Live baseline schema inspection was not executed.

Not run:

- baseline schema presence query
- baseline migration application
- `public.market_quote_cache` live inspection
- live RLS status inspection
- live grant inspection
- live policy inspection

## Synthetic Data Summary

No synthetic data was inserted.

Intended future synthetic rows remain:

- `KR`, `005930`
- `KR`, `000660`
- public-safe normalized quote JSON only
- deterministic timestamps where `expires_at > cached_at + interval '15 seconds'`

## Precondition Check Result

Precondition checks were not executed.

Not run:

- duplicate normalized cache identity check
- lifecycle compatibility check

## Migration Application Result

The Phase 3M migration was not applied.

SQL execution status:

- blocked-before-SQL

Block reason:

- runtime-only target use is approved
- callable Supabase MCP database tools still require an explicit target identifier argument
- no runtime-only target handle is available in the callable context without recording or discovering the identifier
- project listing remains forbidden

## Post-Migration Schema Inspection

Post-migration schema inspection was not executed.

Expected future checks remain:

- new lifecycle columns exist
- required lifecycle columns are not null after backfill
- `market_quote_cache_cache_key_unique` exists
- `market_quote_cache_lifecycle_check` exists
- lifecycle indexes exist
- RLS remains enabled
- public write grants remain absent

## Backfill Validation Result

Backfill validation was not executed.

Expected future checks remain:

- `cache_key = quote:KR:005930`
- `cache_key = quote:KR:000660`
- `provider = kis`
- `source = kis-domestic-quote`
- `fresh_until = cached_at + interval '15 seconds'`
- `stale_until = expires_at`
- `updated_at = cached_at`
- `schema_version = 1`

## RLS And Grant Validation Result

Live RLS and grant validation was not executed.

No role simulation was attempted. No catalog query was run. No Supabase MCP SQL command was run.

## Negative Validation Result

Negative validation was not executed.

Not run:

- duplicate normalized cache-key scenario
- lifecycle-incompatible row scenario
- public write denial scenario
- forbidden column live inspection

## Reset, Disposal, Or Cleanup Result

No disposable target was connected, mutated, reset, disposed, or cleaned up.

Cleanup status:

- not applicable because execution stopped before SQL

## Evidence And No-Secrets Confirmation

Evidence recorded in this document is limited to non-secret local state, the owner-approved target category, and blocked execution status.

No project reference, project URL, database connection string, DB password, service-role key, anon key, JWT secret, access token, refresh token, authorization header, Vercel token, KIS credential, OpenDART key, OpenAI key, Gemini key, or secret-bearing output was requested, printed, summarized, stored, committed, or documented.

No ignored `.env*` contents were read.

No screenshots were captured.

## Explicit Non-Goals

Phase 3N.5 did not:

- touch production DB
- apply migration to production
- apply migration to disposable DB
- run SQL
- list Supabase projects
- query Supabase DB
- mutate Supabase
- change app source
- change migration files
- implement persistent cache writes
- change KIS route behavior
- change provider behavior
- wire live quotes into Market, Portfolio, Chart AI, Home, or Lab
- mutate Vercel environment values
- deploy
- create Auth users
- call Portfolio write endpoints
- add order, account, trading, balance, holdings, or WebSocket APIs
- add OpenDART, OpenAI, or Gemini integration
- implement visitor count
- implement ad-event tracking
- scrape or download external assets
- modify root `README.md`

## What Was Not Changed

Not changed:

- app source files
- migration files
- package files
- config files
- root `README.md`
- Vercel configuration
- provider behavior
- UI live quote behavior

## Remaining Risks

- Phase 3M migration remains unvalidated against a live disposable Supabase target.
- Runtime-only target-handle approval is now clear, but the handle is not available to Codex in a way that can be used without recording or discovering the identifier.
- SQL validation remains blocked until the MCP tool can execute against the scoped disposable target without Codex supplying a visible target identifier value.
- Production migration remains blocked until disposable validation passes and a separate production approval gate is completed.

## Recommended Next Action

Adjust the secure MCP setup so the execution tool can use the scoped disposable target without requiring Codex to provide the target identifier argument, or provide a secure runtime-only mechanism that does not expose the handle in chat, docs, commits, final reports, or visible tool arguments.

Then rerun Phase 3N.5 with the same target category, `disposable-remote-approved`, and explicit SQL execution approval.

## Minimal Owner Review Checklist

```text
Phase 3N.5 Runtime-only Supabase Target SQL Validation 결과:

* runtime-only target handle은 MCP tool argument로만 사용 승인됨: 통과/실패
* SQL 실행은 `disposable-remote-approved` target으로만 제한됨: 통과/실패
* production DB에 접근/변경되지 않음: 통과/실패
* Phase 3M migration 적용 검증은 runtime handle 미가용으로 아직 실행되지 않음: 통과/실패
* schema/constraint/index/backfill live 검증은 아직 미실행임: 통과/실패
* RLS/grant/public write 차단 live 검증은 아직 미실행임: 통과/실패
* raw payload/token/key/계정정보/user portfolio data가 기록되지 않음: 통과/실패
* project ref/URL/connection string이 문서/채팅/커밋에 기록되지 않음: 통과/실패
* app source/provider/UI/Vercel/deployment 변경이 없음: 통과/실패
* reset/disposal은 SQL 미실행으로 해당 없음: 통과/실패
* 비밀 정보 없는 메모:
```
