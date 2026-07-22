# Phase 3O Production Migration Approval Execution Plan v0.1

## Status And Scope

Phase 3O is planning and approval preparation only.

Production migration is not executed in this phase. No SQL was executed. No Supabase connection was attempted. No Supabase MCP database tool was used. No Supabase project listing was run. No Supabase write occurred. No production DB was touched.

Phase 3N.7 recorded the owner-provided sanitized manual Dashboard SQL validation result as passed for the disposable validation project. That disposable validation result makes the Phase 3M migration eligible for the next approval-gate review, but it does not approve or execute production migration.

Production migration remains blocked until a separate explicit owner approval.

No project refs, Supabase URLs, connection strings, passwords, keys, JWT secrets, tokens, screenshots, or secret-bearing output are recorded in this document.

## Migration Under Review

Migration path:

- `supabase/migrations/20260621_market_quote_cache_lifecycle_columns.sql`

Purpose:

- add lifecycle and metadata columns to `public.market_quote_cache`
- backfill deterministic values from existing public quote cache fields
- add cache-key uniqueness and lifecycle ordering constraints
- add lifecycle lookup indexes
- preserve the existing RLS and grant boundary

The migration does not add raw provider payload fields, token fields, account fields, user fields, portfolio fields, position fields, public write grants, or provider credentials.

## Disposable Validation Basis

Phase 3N.7 recorded the owner-provided sanitized disposable validation result:

- baseline/fixture: pass
- Phase 3M migration application: pass
- schema validation: pass
- constraint/index validation: pass
- backfill validation: pass
- RLS/grant validation: pass
- negative validation: pass
- cleanup: pass

Codex did not independently verify the live disposable DB because Supabase connection and SQL execution were out of scope.

This validation basis is sufficient for eligibility for production approval review. It is not automatic production approval.

## Production Target Separation Policy

Before any production execution phase, the owner must perform strict target separation checks:

- confirm the selected Supabase project is production
- confirm the selected Supabase project is not the disposable validation project
- confirm the currently selected dashboard or project context is intentional
- confirm the migration will be run only once
- confirm no project refs, URLs, screenshots, keys, tokens, or connection strings will be recorded in docs or chat

Allowed non-secret target labels:

- `production-target-confirmed`
- `not-production-target`
- `target-uncertain-stop`

Do not record production project identifiers.

## Production Readiness Checklist

Pre-execution checklist for a future production phase:

- disposable validation passed
- production target intentionally selected
- owner approval recorded in the future execution phase
- app source unchanged
- migration file unchanged since disposable validation
- no pending conflicting migration
- production `public.market_quote_cache` exists or baseline status is understood
- expected existing data risk reviewed
- duplicate normalized cache identity precheck planned
- lifecycle ordering precheck planned
- RLS/grants precheck planned
- backup/rollback plan reviewed
- maintenance or low-traffic window selected if applicable
- sanitized result template ready

If any item cannot be confirmed, stop before production SQL.

## Backup And Rollback Policy

Backup policy:

- Prefer Supabase dashboard-native backup, point-in-time recovery, or snapshot options if available for the production plan.
- Confirm the backup or recovery capability before migration execution.
- If database backup is not available on the current plan, require explicit owner acknowledgment before proceeding.
- Do not record backup identifiers, database hosts, project refs, URLs, or screenshots.

Rollback intent:

- stop if any precheck fails
- avoid destructive rollback unless separately approved
- if migration applies but postchecks fail, document the issue with sanitized evidence and decide whether to create a corrective migration
- do not run ad hoc destructive rollback SQL from chat
- do not create or execute rollback SQL in Phase 3O

No destructive rollback SQL is approved for execution by this plan.

## Production Precheck SQL Plan

The future execution phase should prepare or run owner-approved prechecks that return sanitized result names only:

- `production-target-confirmed`
- `market_quote_cache_exists`
- `baseline_columns_present`
- `duplicate_normalized_cache_identity_absent`
- `lifecycle_incompatible_rows_absent`
- `rls_enabled`
- `anon_authenticated_write_grants_absent`
- `public_read_policy_present`
- `service_role_write_intent_present`
- `phase_3m_columns_not_already_partially_applied`
- `phase_3m_constraints_not_already_partially_applied`
- `phase_3m_indexes_not_already_partially_applied`
- `migration_file_matches_disposable_validated_version`

Precheck coverage:

- `public.market_quote_cache` existence
- required baseline columns
- duplicate normalized cache identity
- lifecycle-incompatible rows
- RLS enabled
- anon/authenticated write grants absent
- existing constraints and indexes to detect prior partial application
- migration already applied or partially applied detection

The precheck plan is not executed in Phase 3O.

## Execution Plan

Future production execution sequence:

1. Confirm target using only non-secret labels.
2. Confirm owner approval wording for the execution phase.
3. Confirm backup or recovery policy acceptance.
4. Run prechecks.
5. Stop if any precheck fails.
6. Apply `supabase/migrations/20260621_market_quote_cache_lifecycle_columns.sql`.
7. Run postchecks.
8. Record sanitized result.
9. Do not paste project refs, URLs, keys, tokens, screenshots, or secret-bearing output.
10. Stop before any adapter implementation.

This document is a plan only and does not execute the sequence.

## Post-Migration Validation Plan

Expected production postchecks:

- lifecycle columns exist
- required lifecycle columns are not null
- `market_quote_cache_cache_key_unique` exists
- `market_quote_cache_lifecycle_check` exists
- `market_quote_cache_fresh_until_idx` exists
- `market_quote_cache_stale_until_idx` exists
- `market_quote_cache_provider_source_idx` exists
- backfill values are deterministic
- RLS remains enabled
- anon/authenticated write grants remain absent
- public read boundary is unchanged
- service-role write intent remains available

Postcheck evidence must be summarized as pass/fail only, without project refs or secrets.

## Abort Conditions

Stop before production SQL if:

- target is uncertain
- production target cannot be confirmed
- backup/rollback policy is not accepted
- duplicate cache identity exists
- lifecycle precheck fails
- migration is already partially applied
- RLS/grant state is unexpected
- migration file differs from the disposable-validated version
- any secret appears in planned evidence
- owner approval wording is not provided

If any abort condition occurs, document only a sanitized blocked result and do not run production migration.

## Owner Approval Wording

Copy-ready owner approval wording for a future production execution phase:

```text
Phase 3O Production Migration 승인 문구:

본인은 Phase 3M migration(`supabase/migrations/20260621_market_quote_cache_lifecycle_columns.sql`)이 disposable Supabase project에서 수동 검증 all pass로 기록되었음을 확인했습니다.

production Supabase project에 대한 migration 적용은 별도 실행 단계에서만 진행하며, 실행 전 production target 확인, backup/rollback 정책 확인, precheck 통과, postcheck 기록, 비밀 정보 비기록 원칙을 준수하는 조건으로 검토합니다.

아직 본 문구만으로 production SQL 실행을 승인하는 것은 아니며, 실제 실행은 별도 Phase에서 명시적으로 승인합니다.
```

## Sanitized Production Execution Result Template

Future production execution result template:

```text
Phase 3P Production Migration 실행 결과:

* production target confirmed: 통과/실패
* backup/rollback policy reviewed: 통과/실패
* prechecks passed: 통과/실패
* migration applied: 통과/실패
* postchecks passed: 통과/실패
* RLS/grants preserved: 통과/실패
* project refs/secrets not recorded: 통과/실패
* production DB changed: yes/no
* rollback/corrective action needed: yes/no
* 비밀 정보 없는 메모:
```

## Explicit Non-Goals

Phase 3O does not:

- run SQL
- apply production migration
- connect to Supabase
- use Supabase MCP database tools
- list projects
- modify app source
- modify migration files
- modify planning SQL files
- implement persistent cache adapter
- wire live quotes
- change provider behavior
- mutate Vercel environment values
- deploy
- read ignored `.env*` contents
- modify root `README.md`

## Validation Performed By Codex

Static validation performed:

- inspected Phase 3N.7 disposable validation result
- inspected Phase 3N.6 dashboard SQL validation pack
- inspected Phase 3N disposable validation plan
- inspected Phase 3M migration result
- inspected baseline and Phase 3M migration files
- confirmed root `README.md` remains out of scope
- confirmed app source and migration files were not changed

Build is skipped because Phase 3O changes documentation only.

## Remaining Risks

- Production has not been inspected by Codex.
- Production data may contain duplicates or lifecycle-incompatible rows that were not present in disposable validation.
- Backup/PITR availability depends on the production Supabase plan and must be confirmed by the owner.
- Production execution requires a separate explicit approval and sanitized result record.
- Persistent quote cache adapter implementation remains future work.

## Recommended Next Action

Owner should review this Phase 3O plan.

If acceptable, create a separate Phase 3P production precheck/execution approval prompt. Do not proceed to production execution until explicit owner approval is given in that future phase.
