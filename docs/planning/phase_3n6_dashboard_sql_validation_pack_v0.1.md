# Phase 3N.6 Dashboard SQL Validation Pack v0.1

## Status And Scope

Phase 3N.6 prepares a dashboard-executed SQL validation pack for the owner to run manually in the Supabase Dashboard SQL Editor of the already-approved disposable validation project.

This phase is documentation and SQL-pack preparation only.

Codex did not execute SQL. Codex did not connect to Supabase. Codex did not use Supabase MCP database tools. Codex did not list projects. Codex did not write to Supabase. Codex did not touch production DB. Codex did not record project refs, Supabase URLs, connection strings, passwords, keys, JWT secrets, tokens, authorization headers, or secret-bearing output. Codex did not read ignored `.env*` contents.

No app source file changed. No migration file changed. No provider behavior changed. No UI live quote wiring was implemented. No persistent cache adapter was implemented. No Vercel environment value was read, pulled, added, updated, removed, or printed. No deployment was run. Root `README.md` was not modified.

## Owner Runbook

Owner manual steps:

1. Open Supabase Dashboard.
2. Select only the disposable validation project.
3. Confirm the selected project is not production.
4. Open SQL Editor.
5. Run the SQL scripts in this exact order:
   - `docs/planning/sql_validation/phase_3n6_01_prepare_baseline_and_fixtures.sql`
   - `docs/planning/sql_validation/phase_3n6_02_apply_phase_3m_migration.sql`
   - `docs/planning/sql_validation/phase_3n6_03_validate_schema_backfill_rls_grants.sql`
   - `docs/planning/sql_validation/phase_3n6_04_negative_checks.sql`
   - `docs/planning/sql_validation/phase_3n6_05_cleanup.sql`
6. If Step 01 says the baseline table is missing, stop and manually run `supabase/migrations/20260615_rebuild_schema_v0_1.sql` in the disposable project, then rerun Step 01.
7. Do not run any script in production.
8. Do not paste back project refs, URLs, connection strings, keys, tokens, screenshots, or secret-bearing output.
9. Report only sanitized pass/fail summaries.

## SQL Pack Files

Created:

- `docs/planning/sql_validation/phase_3n6_01_prepare_baseline_and_fixtures.sql`
- `docs/planning/sql_validation/phase_3n6_02_apply_phase_3m_migration.sql`
- `docs/planning/sql_validation/phase_3n6_03_validate_schema_backfill_rls_grants.sql`
- `docs/planning/sql_validation/phase_3n6_04_negative_checks.sql`
- `docs/planning/sql_validation/phase_3n6_05_cleanup.sql`

## Baseline Detection Script

Step 01 checks whether `public.market_quote_cache` exists.

If the table is missing, the script raises a stop message instructing the owner to run:

- `supabase/migrations/20260615_rebuild_schema_v0_1.sql`

The script does not drop tables, reset the project, or make destructive baseline assumptions.

## Synthetic Fixture Script

Step 01 inserts or updates only public-safe synthetic quote cache rows:

- `KR`, `005930`
- `KR`, `000660`

The fixture payload uses normalized public quote JSON only. It does not include user IDs, portfolio IDs, position IDs, account numbers, holdings, raw provider payloads, raw provider headers, tokens, keys, credentials, or secrets.

The deterministic fixture timestamps satisfy:

- `expires_at > cached_at + interval '15 seconds'`

## Phase 3M Migration Script

Step 02 is a copy-ready SQL script containing the current contents of:

- `supabase/migrations/20260621_market_quote_cache_lifecycle_columns.sql`

The actual migration file was not modified in Phase 3N.6.

## Validation Query Script

Step 03 returns pass/fail rows for:

- expected lifecycle columns
- required not-null lifecycle columns
- `market_quote_cache_cache_key_unique`
- `market_quote_cache_lifecycle_check`
- `market_quote_cache_fresh_until_idx`
- `market_quote_cache_stale_until_idx`
- `market_quote_cache_provider_source_idx`
- synthetic `cache_key` backfill
- synthetic provider/source backfill
- synthetic lifecycle timestamp backfill
- `schema_version = 1`
- RLS enabled
- public read policy presence
- `anon` and `authenticated` select grants
- absent `anon` and `authenticated` write grants
- `service_role` write grant intent
- forbidden columns absent

This script reports only sanitized status rows.

## Negative Validation Script

Step 04 runs safe negative checks:

- duplicate `cache_key` insertion should fail
- lifecycle-incompatible row insertion should fail
- `anon` and `authenticated` write grants should be absent
- `anon` and `authenticated` write policies should be absent

The insert-based negative tests catch expected database exceptions and clean up unexpected inserted rows. Public write denial is checked through grants and policies rather than direct role simulation.

## Cleanup Script

Step 05 removes only the synthetic validation rows:

- `KR`, `005930`
- `KR`, `000660`

It does not delete unrelated rows. The script is intended only for the disposable validation project after the owner records sanitized pass/fail summaries.

## Safety Confirmations

Confirmed in Phase 3N.6:

- Codex did not execute SQL.
- Codex did not connect to Supabase.
- Codex did not use Supabase MCP database tools.
- Codex did not list projects.
- Codex did not record project refs or secrets.
- Codex did not touch production DB.
- Codex did not read ignored `.env*` contents.
- Codex did not mutate Vercel environment values.
- Codex did not deploy.
- App source files were not changed.
- Migration files were not changed.
- Provider behavior was not changed.
- UI live quote wiring was not implemented.
- Persistent cache adapter implementation was not added.

The owner must manually run the pack only inside the disposable project.

## Supabase Security Notes

The validation pack follows the existing project boundary where `public.market_quote_cache` is public-readable but not public-writable. Supabase's Data API access model depends on table grants and RLS policies, so Step 03 checks both grants and RLS state.

No service-role key or provider credential is needed for the owner report. Do not paste any secret-bearing output back to Codex.

## Owner Result Template

```text
Phase 3N.6 Dashboard SQL Validation 실행 결과:

* 테스트 대상: disposable project / 기타
* production project가 선택되지 않음: 통과/실패
* baseline table 존재 또는 baseline migration 수동 적용: 통과/실패
* synthetic rows 삽입: 통과/실패
* Phase 3M migration 적용: 통과/실패
* schema validation: 통과/실패
* constraint/index validation: 통과/실패
* backfill validation: 통과/실패
* RLS/grant validation: 통과/실패
* negative validation: 통과/실패
* cleanup: 통과/실패
* project ref/URL/key/token/connection string 기록 없음: 통과/실패
* production DB 접근/변경 없음: 통과/실패
* 비밀 정보 없는 메모:
```

## Explicit Non-Goals

Phase 3N.6 did not:

- execute SQL
- connect to Supabase
- use Supabase MCP database tools
- list Supabase projects
- write to Supabase
- touch production DB
- apply the migration
- alter migration files
- change app source
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

## Validation Performed By Codex

Static validation performed:

- inspected Phase 3N.5 and Phase 3N.4 blocked SQL validation results
- inspected Phase 3N validation plan
- inspected Phase 3M migration result document
- inspected `supabase/migrations/20260615_rebuild_schema_v0_1.sql`
- inspected `supabase/migrations/20260621_market_quote_cache_lifecycle_columns.sql`
- confirmed `docs/planning/sql_validation/` did not previously exist
- created the dashboard SQL validation pack under `docs/planning/sql_validation/`
- confirmed root `README.md` remains out of scope
- confirmed app source and migration files were not changed

Build is skipped because Phase 3N.6 changes documentation and planning SQL files only.

## Remaining Risks

- The SQL pack has not been run by Codex.
- The owner must select the correct disposable project manually.
- If the disposable project has unexpected existing data, Step 02 may stop on duplicate cache keys or lifecycle ordering preconditions.
- If baseline migration is missing, the owner must manually apply it before fixture insertion.
- Production migration remains blocked until disposable validation passes and a separate production approval gate is completed.

## Recommended Next Action

Owner should manually run the five SQL scripts in the disposable Supabase Dashboard SQL Editor, then return only the sanitized pass/fail owner result template.

After sanitized results are available, the next phase should record the dashboard validation result and decide whether the Phase 3M migration is ready for a separate production approval gate.

## Minimal Owner Review Checklist

```text
Phase 3N.6 Dashboard SQL Validation Pack 검토 결과:

* Dashboard SQL Editor에서 수동 검증할 수 있는 script pack이 준비됨: 통과/실패
* production DB가 아닌 disposable project에서만 실행하도록 명시됨: 통과/실패
* Codex가 SQL/Supabase MCP DB query/project listing을 실행하지 않음: 통과/실패
* schema/constraint/index/backfill/RLS/grant/negative validation 항목이 포함됨: 통과/실패
* synthetic data와 cleanup 기준이 명확함: 통과/실패
* project ref/URL/key/token/connection string이 기록되지 않음: 통과/실패
* app source/provider/UI/Vercel/deployment 변경이 없음: 통과/실패
* 다음 단계가 owner manual SQL execution 결과 확인임: 통과/실패
* 비밀 정보 없는 메모:
```
