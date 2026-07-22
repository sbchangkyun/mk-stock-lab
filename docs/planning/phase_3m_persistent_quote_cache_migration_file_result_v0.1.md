# Phase 3M Persistent Quote Cache Migration File Result v0.1

## Status And Scope

Phase 3M converted the reviewed Phase 3L persistent quote cache SQL draft into one migration file only.

This phase did not apply the migration. It did not execute SQL, run Supabase CLI, run psql, connect to Supabase, write to Supabase, change app source, implement a persistent cache adapter, change provider behavior, wire UI live quotes, mutate Vercel environment values, deploy, request secrets, read ignored `.env*` contents, or modify the root `README.md`.

## Phase 3L Baseline Summary

Phase 3L reviewed the existing `market_quote_cache` shape:

- `id`
- `symbol`
- `market`
- `quote_json`
- `cached_at`
- `expires_at`
- unique `(symbol, market)`
- existing `(symbol, market)` and `(expires_at)` indexes
- RLS enabled
- public read for `anon` and `authenticated`
- server-side writes intended through service-role access only

Phase 3L concluded that lifecycle metadata should be made explicit before a persistent adapter writes quote cache rows.

## Migration File Added

Added:

- `supabase/migrations/20260621_market_quote_cache_lifecycle_columns.sql`

No existing migration file was modified.

## Migration Design Summary

The migration preserves the existing `public.market_quote_cache` table and alters it in place. It does not drop the table, drop columns, remove existing constraints, change existing policies, add public write grants, or add user-specific fields.

The migration uses:

- `alter table ... add column if not exists`
- deterministic backfill from existing public market quote fields
- precondition checks for normalized duplicate cache identifiers and lifecycle ordering
- `DO` blocks for idempotent constraint creation
- `create index if not exists`

## Columns Added

The migration adds:

- `cache_key text`
- `provider text`
- `source text`
- `fresh_until timestamptz`
- `stale_until timestamptz`
- `schema_version integer not null default 1`
- `last_refresh_status text`
- `last_error_code text`
- `updated_at timestamptz`

## Backfill Behavior

Backfill is deterministic and non-secret:

- `cache_key`: `quote:` plus `market` plus uppercased `symbol`
- `provider`: `kis`
- `source`: `kis-domestic-quote`
- `fresh_until`: `cached_at + interval '15 seconds'`
- `stale_until`: `expires_at`
- `updated_at`: `cached_at`

The migration does not add provider credentials, authorization data, private account fields, user data, portfolio data, or raw provider payload fields.

## Constraints And Indexes

After backfill, the migration sets these columns to `not null`:

- `cache_key`
- `provider`
- `source`
- `fresh_until`
- `stale_until`
- `updated_at`

It adds these constraints through guarded `DO` blocks:

- `market_quote_cache_cache_key_unique` on `cache_key`
- `market_quote_cache_lifecycle_check`

The lifecycle check is:

- `cached_at <= fresh_until`
- `fresh_until <= stale_until`
- `stale_until <= expires_at`

It adds these indexes:

- `market_quote_cache_fresh_until_idx`
- `market_quote_cache_stale_until_idx`
- `market_quote_cache_provider_source_idx`

Existing indexes remain unchanged.

## RLS, Grants, And Access Boundary Confirmation

The migration does not change RLS, grants, or policies.

The intended boundary remains:

- public read through existing `anon` and `authenticated` select access
- no public insert, update, or delete access
- server-side writes only through the existing service-role boundary
- normalized public market quote data only

This matches Supabase's grants-plus-RLS model: grants determine whether API roles can reach an object, while RLS policies determine visible rows after access is granted.

## Forbidden Data Safety Confirmation

The migration does not add columns for:

- raw provider responses
- raw headers
- app credentials
- access credentials
- authorization headers
- approval credentials
- account numbers
- refresh credentials
- raw errors
- stack traces
- connection strings
- DB passwords
- JWT secrets
- Vercel credentials
- user IDs
- portfolio IDs
- position IDs
- user holdings
- user valuation output

The only field containing `key` in its name is the required public-safe `cache_key` identifier.

## Static Validation Summary

Static validation performed:

- Confirmed only one migration file was added.
- Confirmed no existing migration file was modified.
- Confirmed no app source file changed.
- Confirmed no package, config, or root `README.md` file changed.
- Confirmed the migration does not include public write grants.
- Confirmed the migration does not include `drop table`, `drop column`, or `drop policy`.
- Confirmed the migration uses guarded constraint creation rather than unsupported `add constraint if not exists`.
- Confirmed the migration keeps RLS and grant behavior unchanged.

## Explicit Non-Goals

Phase 3M did not implement:

- migration application
- Supabase writes
- persistent cache adapter
- provider behavior changes
- KIS route behavior changes
- Market live quote wiring
- Portfolio live quote wiring
- Chart AI live quote wiring
- Home or Lab live data wiring
- Vercel environment mutation
- deployment
- secret handling

## What Was Not Executed

No SQL was executed. No Supabase CLI command was run. No psql command was run. No Supabase connection was attempted. No Supabase write or cache write occurred.

Build was skipped because Phase 3M changed only one migration file and planning documentation; no app source, package, or config file changed.

## Remaining Risks

- The migration has not been run against a disposable or production database.
- Existing rows with normalized symbol duplicates differing only by case would cause the migration to stop before the unique constraint is added.
- Existing rows where `cached_at + interval '15 seconds'` is later than `expires_at` would cause the lifecycle ordering check to stop the migration.
- Future adapter code must write normalized public quote payloads only.
- Owner approval is still required before any database application.

## Recommended Next Action

Review the migration file and this result document. If approved, the next phase should validate the migration in a disposable Supabase environment before any production application.

## Minimal Owner Review Checklist

```text
Phase 3M Persistent Quote Cache Migration File 검토 결과:

* migration file은 생성되었지만 아직 실행되지 않음: 통과/실패
* market_quote_cache lifecycle/metadata 컬럼 추가 목적이 명확함: 통과/실패
* raw payload/token/key/계정정보/user portfolio data 저장 컬럼이 없음: 통과/실패
* anon/authenticated write 권한이 추가되지 않음: 통과/실패
* app source/provider/UI 동작 변경이 없음: 통과/실패
* SQL/Supabase CLI/psql/Supabase write가 실행되지 않음: 통과/실패
* 다음 phase에서 실행 전 owner approval gate가 명확함: 통과/실패
* 비밀 정보 없는 메모:
```
