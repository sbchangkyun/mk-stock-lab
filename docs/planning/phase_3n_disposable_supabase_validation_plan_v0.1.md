# Phase 3N Disposable Supabase Validation Plan v0.1

## Status And Scope

Phase 3N is a disposable Supabase validation plan only.

The Phase 3M migration file was not applied in this phase. No SQL was executed. No Supabase CLI command was run. No psql command was run. No Supabase connection was attempted. No Supabase write or cache write occurred. No app source file changed. No provider behavior changed. No UI live quote wiring was implemented. No Vercel environment value was read, pulled, added, updated, removed, or printed. No deployment was run.

This document defines how a later owner-approved phase should validate the persistent quote cache migration in a disposable or explicitly controlled Supabase environment before any production application.

## Phase 3M Baseline Summary

Phase 3M added one migration file:

- `supabase/migrations/20260621_market_quote_cache_lifecycle_columns.sql`

The migration preserves `public.market_quote_cache` and adds:

- `cache_key`
- `provider`
- `source`
- `fresh_until`
- `stale_until`
- `schema_version`
- `last_refresh_status`
- `last_error_code`
- `updated_at`

Backfill behavior:

- `cache_key`: `quote:` plus `market` plus uppercased `symbol`
- `provider`: `kis`
- `source`: `kis-domestic-quote`
- `fresh_until`: `cached_at + interval '15 seconds'`
- `stale_until`: `expires_at`
- `updated_at`: `cached_at`

Constraints and indexes:

- not-null constraints after backfill for required lifecycle and metadata columns
- unique constraint on `cache_key`
- lifecycle check: `cached_at <= fresh_until <= stale_until <= expires_at`
- indexes on `fresh_until`, `stale_until`, and `(market, symbol, provider, source)`

RLS, grants, and policies:

- the Phase 3M migration does not change RLS
- it does not change grants
- it does not change policies
- public read and service-role-write intent remain inherited from the baseline schema
- no anon or authenticated write grants are added

Known risks:

- the migration has not been executed yet
- duplicate normalized symbols can stop migration
- lifecycle-incompatible rows can stop migration
- future adapter code must write normalized public quote data only

## Disposable Validation Goal

Validation must happen first in a disposable or explicitly controlled Supabase environment because the migration changes a public-readable cache table and adds constraints that can stop on bad pre-existing data.

Production must not be used for first execution.

The later validation phase should prove:

- the baseline schema applies cleanly
- the Phase 3M migration applies cleanly
- `market_quote_cache` has the expected columns, constraints, and indexes
- RLS remains enabled
- public read remains read-only
- anon and authenticated roles cannot insert, update, or delete quote cache rows
- service-role/server write remains the only intended write path
- forbidden columns are absent
- `quote_json` can hold normalized public `QuoteSnapshot` data only
- lifecycle constraints behave as expected
- duplicate and lifecycle precondition failures are understood before production

## Disposable Environment Requirements

The future validation environment must be:

- disposable or explicitly controlled
- not production
- safe to reset or discard
- free of real user portfolio data
- free of secrets in recorded output
- clearly confirmed as non-production without recording project references

Allowed test data:

- synthetic public market quote rows only
- symbols such as `005930` and `000660`
- public-safe normalized quote JSON
- deterministic timestamps
- no real user IDs
- no portfolio IDs
- no account data
- no raw KIS payload

Disallowed test data:

- credentials
- tokens
- real account numbers
- real private portfolio holdings
- raw provider payloads
- raw provider headers
- screenshots containing project references or secrets
- terminal output containing secret-bearing URLs or connection strings

## Future Execution Precheck Plan

The later owner-approved validation phase should complete these prechecks before applying the Phase 3M migration:

1. Confirm the selected environment is disposable or explicitly controlled.
2. Confirm the production project is not selected.
3. Confirm the current migration list in the disposable environment.
4. Confirm the database is either clean or has an acceptable baseline state.
5. Confirm the baseline schema migration is present or already applied.
6. Confirm `public.market_quote_cache` exists before the Phase 3M migration.
7. Confirm current `market_quote_cache` columns before migration.
8. Confirm RLS is enabled before migration.
9. Confirm existing grants before migration.
10. Confirm the existing public read policy before migration.
11. Confirm there are no duplicate normalized `(market, upper(symbol))` rows.
12. Confirm there are no rows where `cached_at + interval '15 seconds' > expires_at`.
13. Confirm inserted validation rows are synthetic and public-safe.
14. Confirm a reset or disposal path exists before any mutation.

These are future validation steps only. They were not run in Phase 3N.

## Future Migration Application Plan

The later owner-approved validation phase should apply changes in this order:

1. Prepare disposable database baseline.
2. Apply the baseline schema if needed.
3. Insert synthetic pre-migration quote cache rows.
4. Apply `supabase/migrations/20260621_market_quote_cache_lifecycle_columns.sql`.
5. Inspect resulting columns.
6. Inspect not-null settings.
7. Inspect `market_quote_cache_cache_key_unique`.
8. Inspect `market_quote_cache_lifecycle_check`.
9. Inspect `market_quote_cache_fresh_until_idx`.
10. Inspect `market_quote_cache_stale_until_idx`.
11. Inspect `market_quote_cache_provider_source_idx`.
12. Inspect RLS status.
13. Inspect grants.
14. Confirm the existing public read policy remains read-only.
15. Confirm no public write grant exists.
16. Confirm lifecycle columns are backfilled.
17. Confirm `cache_key` values are deterministic.
18. Confirm `fresh_until`, `stale_until`, and `updated_at` values are deterministic.
19. Confirm forbidden columns do not exist.
20. Record a no-secrets validation summary.

These steps describe the future execution order only. Phase 3N did not apply either migration.

## Future Negative Validation Plan

The later owner-approved validation phase should include negative tests:

- Insert a duplicate normalized cache-key fixture and verify the migration precondition blocks it.
- Insert a lifecycle-incompatible fixture and verify the migration precondition blocks it.
- Attempt anon insert, update, and delete against `market_quote_cache`; each should be blocked.
- Attempt authenticated insert, update, and delete against `market_quote_cache`; each should be blocked.
- Attempt public read of normalized quote data; it should return only public-safe data if public read remains expected.
- Attempt payloads containing forbidden fields in a future adapter validation test; the adapter should reject them.

Adapter validation is a future requirement. Phase 3N does not implement an adapter validator.

## Evidence And Reporting Policy

Future validation reports should include:

- pass/fail summary
- migration file name
- disposable environment confirmation without project reference
- schema result summary
- RLS and grant result summary
- negative test result summary
- reset or disposal confirmation
- no-secrets confirmation

Future validation reports must not include:

- service-role key
- anon key
- project URL
- database password
- connection string
- JWT secret
- Supabase project reference
- raw provider payload
- screenshots with secrets
- terminal output containing credentials
- access tokens or refresh tokens

## Rollback And Reset Policy

Disposable validation should prefer full project reset, database reset, or complete disposable database disposal.

No rollback migration is created in Phase 3N.

If rollback SQL is documented in a later execution phase, it must be marked disposable-only unless a separate production rollback plan has been reviewed and approved.

Production rollback planning must be separate before any production application.

## Pass And Fail Criteria

Pass criteria:

- migration applies cleanly in a disposable environment
- expected columns exist
- required columns are not null after backfill
- backfill matches deterministic policy
- lifecycle check exists
- cache-key unique constraint exists
- expected indexes exist
- RLS remains enabled
- anon and authenticated writes remain blocked
- service-role write intent remains intact
- public read exposes only normalized public market data
- forbidden columns are absent
- no secrets appear in logs or report

Fail criteria:

- migration fails on a clean disposable baseline
- migration changes public write permissions
- RLS is disabled
- unsafe columns exist
- secrets appear in output
- app source is required to apply migration
- production project is touched
- Supabase write occurs outside disposable approval
- validation evidence includes project references, keys, tokens, or connection strings

## Next Phase Approval Gate

Recommended next phase:

- Option A: Phase 3N.1 or Phase 3O executes disposable validation with explicit owner approval.
- Option B: Phase 3O implements a disabled-by-default persistent cache adapter only after disposable migration validation passes.

Execution validation should happen before adapter implementation.

No production migration should occur until disposable validation passes and a separate production approval gate is completed.

## Explicit Non-Goals

Phase 3N does not:

- apply any migration
- execute SQL
- run Supabase CLI
- run psql
- connect to Supabase
- write to Supabase
- access production DB
- mutate production DB
- change app source
- implement persistent cache writes
- change provider behavior
- change KIS route behavior
- wire live quotes into Market, Portfolio, Chart AI, Home, or Lab UI
- read or mutate Vercel environment values
- deploy
- request or record secrets
- read ignored `.env*` contents
- modify root `README.md`
- add order, account, trading, balance, holdings, or WebSocket APIs
- add OpenDART, OpenAI, or Gemini integration
- implement visitor count
- implement ad-event tracking
- scrape or download external assets

## Validation Performed

Phase 3N static validation performed by Codex:

- inspected Phase 3M result documentation
- inspected Phase 3L and Phase 3K planning context
- inspected baseline and Phase 3M migration filenames
- inspected Phase 3M migration text
- confirmed `supabase/validation/` filenames only
- confirmed no SQL was executed
- confirmed no Supabase CLI command was run
- confirmed no psql command was run
- confirmed no Supabase connection or write occurred
- confirmed no Vercel environment mutation or deployment occurred
- confirmed no secrets were requested or recorded
- confirmed ignored `.env*` contents were not read
- confirmed no app source changes were required

Build is skipped because this phase is documentation-only and does not change app source, package, or config files.

## Remaining Risks

- The Phase 3M migration still has not been executed against a database.
- Disposable validation may reveal baseline data conditions that require migration adjustment.
- Public read remains safe only if future cache rows contain normalized public quote data.
- Future adapter code must reject forbidden fields before writing to `market_quote_cache`.
- Production migration still requires a separate approval gate and rollback plan.

## Recommended Next Action

Owner should review this validation plan. If accepted, the next phase should execute disposable validation only with explicit approval and without recording secrets.

## Minimal Owner Review Checklist

```text
Phase 3N Disposable Supabase Validation Plan 검토 결과:

* disposable 환경에서만 migration 검증하도록 계획됨: 통과/실패
* production DB 적용은 명확히 금지됨: 통과/실패
* precheck, migration 적용, negative validation, evidence 정책이 충분함: 통과/실패
* raw payload/token/key/계정정보/user portfolio data 기록 금지가 명확함: 통과/실패
* 실제 SQL/Supabase CLI/psql/Supabase write가 실행되지 않음: 통과/실패
* 다음 phase에서 disposable 실행 전 owner approval gate가 명확함: 통과/실패
* 비밀 정보 없는 메모:
```
