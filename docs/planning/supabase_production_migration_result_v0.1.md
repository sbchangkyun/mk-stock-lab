# Supabase Production Migration Result v0.1

## Status And Scope

Status: blocked before production migration.

This document records the Phase 2K production Supabase migration attempt result. It does not authorize additional production changes.

Codex used the Supabase connector for read-only project and table metadata checks. Codex did not run SQL, did not run Supabase CLI, did not run `psql`, did not apply migration SQL, did not apply patch SQL, did not create a test auth user, did not run Supabase Advisors, did not mutate Vercel environment variables, and did not deploy.

No Supabase project refs, URLs, keys, passwords, tokens, connection strings, Vercel tokens, or environment variable values are recorded in this document.

## Approval Gate Result

The Phase 2K `OWNER_APPROVAL` field exactly matched the required approval phrase.

Approval gate status: passed.

This gate allowed Phase 2K pre-flight to proceed. It did not authorize unreviewed reset, drop, cleanup, or repair SQL beyond the approved migration plan.

## Production Target Confirmation

Codex confirmed through the Supabase connector that there is a production-named project distinct from the disposable validation project.

Production target status: confirmed by non-secret project name context.

Disposable validation project status: not selected for migration.

Project refs, URLs, database hosts, and IDs are intentionally not recorded.

## Owner Confirmations Used

- Production Supabase project identity: confirmed by owner.
- Production DB real user data: no real user data; only deletable test data may exist.
- Reset/rebuild acceptable: yes.
- Backup/restore point: not required because reset/rebuild risk is accepted.
- Rollback owner: owner.
- Maintenance window: not applicable because there are no real users.
- Production test auth user creation: allowed.
- Vercel env var changes excluded from Phase 2K: confirmed.
- Vercel `PUBLIC_SUPABASE_URL` manually confirmed by owner to match the production Supabase Project URL.

## Migration File Applied

Migration file intended for production:

- `supabase/migrations/20260615_rebuild_schema_v0_1.sql`

Migration application result: not applied.

Reason: read-only production metadata showed existing public tables before migration. One existing table name conflicts with a table created by the reviewed migration source. The reviewed migration uses direct `create table` statements and is not a reset or idempotent migration script.

Because applying the reviewed migration in that state was expected to fail, Codex stopped before mutation.

## Patch Handling Result

Patch file:

- `supabase/validation/patch_consume_chart_ai_usage_v0_1.sql`

Patch application result: not applied.

The disposable patch remains disposable-validation repair SQL only. It was not selected for fresh production.

## Validation SQL Result

Validation SQL file:

- `supabase/validation/validate_rebuild_schema_v0_1.sql`

Validation SQL result: not run.

Reason: the production migration was not applied, so post-migration validation was not valid to run.

## Targeted Validation Result Matrix

| Check | Result | Note |
|---|---|---|
| 14 required public tables exist | Not run | Migration was blocked before application. |
| RLS enabled on all 14 required public tables | Not run | Migration was blocked before application. |
| `ad_events` has no public insert policy | Not run | Migration was blocked before application. |
| `chart_ai_cache` has no `user_id` | Not run | Migration was blocked before application. |
| `public.set_updated_at()` exists | Not run | Migration was blocked before application. |
| `internal.consume_chart_ai_usage(uuid, integer)` exists | Not run | Migration was blocked before application. |
| `internal.consume_chart_ai_usage(uuid, integer)` executable only by `service_role` | Not run | Migration was blocked before application. |
| Phase 2H `usage_date_kst` ambiguity fix present | Confirmed in source only | Static source review confirms the fix in the reviewed migration file. |
| Disposable patch not applied separately to fresh production | Pass | Patch was not applied. |

## Usage-Function Runtime Test Result

Result: not performed.

Reason: the production migration was not applied, so the function/runtime test target did not exist in the expected final state.

No production test auth user was needed or created.

## Test Auth User Handling

Production test auth user creation was allowed by the owner, but no test auth user was created.

No test user password, ID, or credential was requested, printed, stored, or recorded.

## Supabase Advisors Result

Supabase Advisors were not run.

Reason: migration did not apply, and no post-migration schema state existed to review.

No automatic fix or apply action was clicked or requested.

## Vercel Env Var Non-Mutation Confirmation

No Vercel environment variable was read, printed, pulled, added, updated, removed, or overwritten.

No Vercel deployment was run.

Phase 2K remained DB-only and did not modify Vercel settings.

## Secret-Safe Reporting Confirmation

No secret values were requested or recorded.

This result records only non-secret project classification, table-name-level metadata, file paths, and high-level status.

## Issue Encountered

Read-only production metadata showed existing public tables before applying the reviewed migration. At least one existing table conflicts with the reviewed migration source.

Existing public table names observed:

- `public.seibro_holdings`
- `public.portfolios`
- `public.portfolio_assets`
- `public.portfolio_items`

Blocking conflict:

- `public.portfolios` already exists and the reviewed migration also creates `public.portfolios`.

## Final Production DB Readiness Status

Status: not migrated; blocked before mutation.

The production database is not ready for Phase 3 application integration from this migration attempt.

The next production DB attempt needs either:

- an owner-approved reset/drop procedure for the existing test/legacy public tables before applying the reviewed migration, or
- a revised migration that safely handles the existing production schema.

Either path must be reviewed before execution.

## Remaining Post-Migration Tasks

These tasks remain pending because migration did not execute:

- Apply production schema migration.
- Run post-migration validation SQL.
- Run targeted RLS, grant, function, and cache-table checks.
- Perform usage-function runtime test if still needed.
- Check Supabase Advisors after migration.
- Record final production DB readiness after successful validation.

## Non-Feature Statement

Phase 2K did not implement application features, API routes, Vercel env changes, deployment changes, KIS, OpenDART, OpenAI, Gemini, Chart AI UI, Heatmap logic, Lab ingestion logic, Portfolio UI logic, or Auth UI logic.

## Recommended Next Step

Prepare a larger combined production DB reset-and-migration execution packet that includes:

- owner confirmation that existing public test/legacy tables may be dropped or reset,
- exact reset/drop SQL or an idempotent migration revision,
- pre-flight checks,
- migration application,
- validation SQL,
- targeted runtime validation,
- Advisors check,
- and result documentation.

Do not execute that reset/migration packet until explicitly approved.

## Final Statement

Phase 2K was blocked before production mutation. No production migration was applied.
