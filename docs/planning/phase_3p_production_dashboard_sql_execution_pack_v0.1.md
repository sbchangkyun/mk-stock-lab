# Phase 3P Production Dashboard SQL Execution Pack v0.1

## Status And Scope

Phase 3P prepares a production Dashboard SQL execution pack only.

Codex did not execute SQL. Codex did not connect to Supabase. Codex did not use Supabase MCP database tools. Codex did not list projects. Codex did not write to Supabase. Codex did not touch production DB.

Production SQL remains a manual owner action in the Supabase Dashboard SQL Editor. Production migration is not considered executed by this phase.

Production execution is still conditional on owner target confirmation, backup/rollback acceptance, owner approval wording, and all Script 01 prechecks passing.

No project refs, Supabase URLs, connection strings, passwords, keys, JWT secrets, tokens, screenshots, or secret-bearing output are recorded.

## Production Execution Prerequisites

Owner must confirm before manual production execution:

- production target is intentionally selected
- selected project is not the disposable validation project
- backup, PITR, or snapshot availability has been reviewed
- owner accepts backup/rollback limitations if backup is unavailable
- low-traffic or maintenance window has been considered
- Phase 3M migration file is unchanged since disposable validation
- owner will not share project refs, URLs, keys, tokens, screenshots, or secret-bearing output

If any prerequisite is uncertain, stop before opening the SQL Editor.

## Script Order

Run scripts in this exact order only after production target and backup/rollback readiness are confirmed:

1. `docs/planning/sql_production/phase_3p_01_production_prechecks.sql`
2. `docs/planning/sql_production/phase_3p_02_apply_phase_3m_migration.sql`
3. `docs/planning/sql_production/phase_3p_03_post_migration_validation.sql`
4. `docs/planning/sql_production/phase_3p_04_production_result_cleanup_none.sql`

Do not run Script 02 unless Script 01 returns `safe_to_apply_phase_3m_migration = pass`.

## Stop-Before-Run Checklist

```text
Phase 3P 실행 전 중단 조건 확인:

* production target confirmed: 통과/실패
* disposable project not selected: 통과/실패
* backup/rollback policy reviewed: 통과/실패
* owner approval wording confirmed: 통과/실패
* secret recording forbidden: 통과/실패
* project screenshots forbidden: 통과/실패
* no Codex SQL execution: 통과/실패
* no production run unless all prechecks pass: 통과/실패
* 비밀 정보 없는 메모:
```

## Production Precheck Script Description

File:

- `docs/planning/sql_production/phase_3p_01_production_prechecks.sql`

The precheck script is read-only and returns sanitized pass/fail rows:

- `market_quote_cache_exists`
- `baseline_columns_present`
- `duplicate_normalized_cache_identity_absent`
- `lifecycle_incompatible_rows_absent`
- `rls_enabled`
- `anon_authenticated_write_grants_absent`
- `public_read_policy_present`
- `service_role_write_intent_present`
- `phase_3m_columns_not_partially_applied`
- `phase_3m_constraints_not_partially_applied`
- `phase_3m_indexes_not_partially_applied`
- `safe_to_apply_phase_3m_migration`

The final row indicates whether the owner may proceed to Script 02. If the migration appears already fully applied, the script returns `do-not-rerun` for the overall row. If partial application is detected, the script returns `fail`.

The script does not expose project identifiers or production `quote_json` contents.

## Production Migration Script Description

File:

- `docs/planning/sql_production/phase_3p_02_apply_phase_3m_migration.sql`

The migration script is a copy-ready production execution version of:

- `supabase/migrations/20260621_market_quote_cache_lifecycle_columns.sql`

The source migration file was not modified. The production script includes top safety comments only. The executable SQL body matches the disposable-validated migration content.

Top warnings include:

- run only in production after Script 01 all pass
- do not run in the disposable project
- stop if unsure
- do not paste outputs containing secrets

The script does not include project identifiers, backup SQL, or rollback SQL.

## Post-Migration Validation Script Description

File:

- `docs/planning/sql_production/phase_3p_03_post_migration_validation.sql`

The postcheck script is read-only and returns sanitized pass/fail rows for:

- lifecycle columns exist
- required lifecycle columns are not null
- `market_quote_cache_cache_key_unique` exists
- `market_quote_cache_lifecycle_check` exists
- `market_quote_cache_fresh_until_idx` exists
- `market_quote_cache_stale_until_idx` exists
- `market_quote_cache_provider_source_idx` exists
- deterministic backfill sanity
- RLS enabled
- anon/authenticated write grants absent
- public read policy unchanged
- service-role write intent present
- overall postcheck pass/fail

The script avoids returning production `quote_json` payloads.

## Cleanup Script Description

File:

- `docs/planning/sql_production/phase_3p_04_production_result_cleanup_none.sql`

Production cleanup should not delete production data.

The cleanup script states that no cleanup is needed because the production migration does not insert synthetic validation rows. It contains no delete statements and no write statements.

## Abort Conditions

Stop before production migration if:

- selected target is uncertain
- selected target is disposable or non-production
- backup/rollback policy has not been reviewed
- any precheck returns `fail`
- any precheck returns `do-not-rerun`
- duplicate normalized cache identity exists
- lifecycle-incompatible rows exist
- migration appears partially applied
- RLS/grants are unexpected
- migration file mismatch is suspected
- owner approval is missing
- secret-bearing evidence appears
- SQL Editor context is unclear

If any abort condition occurs, do not run Script 02.

## Owner Approval Wording

The owner must paste or confirm this wording before any future manual production execution:

```text
Phase 3P Production SQL 실행 승인 문구:

본인은 production Supabase project를 직접 확인했으며 disposable validation project가 아님을 확인했습니다.

본인은 Phase 3M migration(`supabase/migrations/20260621_market_quote_cache_lifecycle_columns.sql`)이 disposable project에서 수동 검증 all pass로 기록되었다고 Phase 3O production migration approval plan을 확인했습니다.

본인은 backup/PITR/snapshot 가능 여부 또는 backup 미가용 시의 리스크를 확인했으며 production SQL 실행 전 precheck가 모두 통과하지 않으면 migration을 적용하지 않는 조건에 동의합니다.

본인은 project ref, URL, key, token, connection string, secret-bearing output, screenshot을 문서/채팅/커밋에 기록하지 않겠습니다.

위 조건을 전제로 별도 수동 실행 단계에서 production Dashboard SQL Editor를 통해 Phase 3P script pack을 실행하는 것을 승인합니다.
```

## Sanitized Result Template

```text
Phase 3P Production Migration 실행 결과:

* production target confirmed: 통과/실패
* disposable/non-production target not selected: 통과/실패
* backup/rollback policy reviewed: 통과/실패
* owner approval wording confirmed: 통과/실패
* Script 01 production prechecks: 통과/실패
* Script 02 Phase 3M migration applied: 통과/실패/미실행
* Script 03 post-migration validation: 통과/실패/미실행
* RLS/grants preserved: 통과/실패/미실행
* production DB changed: yes/no
* project refs/secrets/screenshots not recorded: 통과/실패
* rollback/corrective action needed: yes/no
* 비밀 정보 없는 메모:
```

## Explicit Non-Goals

Phase 3P does not:

- execute SQL by Codex
- connect to Supabase by Codex
- use Supabase MCP database tools
- list projects
- mutate Supabase by Codex
- modify app source
- modify migration files
- modify Phase 3N.6 validation SQL files
- implement persistent cache adapter
- wire live quotes
- change provider behavior
- mutate Vercel environment values
- deploy
- read ignored `.env*` contents
- modify root `README.md`

## Validation Performed By Codex

Static validation performed:

- inspected Phase 3O production migration approval plan
- inspected Phase 3N.7 disposable validation result
- inspected Phase 3N.6 dashboard SQL validation pack
- inspected Phase 3M migration result
- inspected baseline and Phase 3M migration files
- created production SQL pack files under `docs/planning/sql_production/`
- confirmed Script 01 is SELECT-only
- confirmed Script 03 is SELECT-only
- confirmed Script 04 has no write statements
- confirmed Script 02 executable body matches the Phase 3M migration after safety comments
- confirmed app source, migration files, package/config files, Phase 3N.6 validation SQL files, `.gitignore`, and root `README.md` were not changed

Build is skipped because Phase 3P changes documentation and planning SQL files only.

## Remaining Risks

- Codex did not inspect or touch production DB.
- Owner must manually confirm the production target in Supabase Dashboard.
- Backup/PITR/snapshot availability is plan-dependent and must be reviewed by owner.
- Production prechecks may fail due to existing data not represented in disposable validation.
- If production migration is applied manually, any result must be recorded with sanitized pass/fail summaries only.
- Persistent cache adapter implementation remains future work.

## Recommended Next Action

Owner reviews the Phase 3P pack, confirms production target and backup/rollback readiness, then decides whether to manually execute the production SQL scripts.

If the owner manually executes the scripts, the next phase should record only sanitized production execution results and should not include project refs, URLs, keys, tokens, screenshots, or secret-bearing output.
