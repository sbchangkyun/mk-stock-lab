# Supabase Production Reset Migration Result v0.1

## Status And Scope

Status: production reset/drop and migration completed; validation completed with noted follow-up items.

This document records Phase 2L production reset/drop and Supabase migration execution. It does not authorize unrelated production changes.

Codex used the Supabase connector for approved production DB execution after the exact Phase 2L approval gate passed. Codex did not use Supabase CLI, did not use `psql`, did not connect to the disposable validation project, did not apply the disposable patch SQL, did not mutate Vercel environment variables, and did not deploy.

No Supabase project refs, URLs, keys, passwords, tokens, connection strings, Vercel tokens, or environment variable values are recorded in this document.

## Approval Gate Result

The Phase 2L `OWNER_APPROVAL` field exactly matched the required approval phrase.

Approval gate status: passed.

## Production Target Confirmation

The production target was confirmed through non-secret project-name context and was distinct from the disposable validation project.

Project refs, URLs, database hosts, and IDs are intentionally not recorded.

## Owner Confirmations Used

- Production DB contains no real user data; deletable test data may exist.
- Reset/rebuild risk is accepted.
- Backup/restore point is not required because reset/rebuild risk is accepted.
- Rollback owner is the owner.
- Maintenance window is not applicable because there are no real users.
- Production test auth user creation is allowed.
- Vercel `PUBLIC_SUPABASE_URL` was manually confirmed by the owner to match the production Supabase Project URL.
- Vercel environment variable changes are excluded from Phase 2L.

## Existing Legacy/Test Tables Detected Before Reset

Read-only metadata before reset showed these approved legacy/test public tables:

- `public.seibro_holdings`
- `public.portfolios`
- `public.portfolio_assets`
- `public.portfolio_items`

All four tables reported zero rows in metadata.

## Dependency Review Result

Dependency review found the only table-level foreign-key dependencies among the approved reset targets:

- `public.portfolio_items.portfolio_id` referenced `public.portfolios.id`.
- `public.portfolio_assets.portfolio_id` referenced `public.portfolios.id`.

No unexpected public tables were listed before reset. No non-approved production table was selected for reset/drop.

## Reset/Drop SQL Summary

The approved reset/drop affected only the four approved legacy/test public tables:

```sql
drop table if exists public.portfolio_items cascade;
drop table if exists public.portfolio_assets cascade;
drop table if exists public.seibro_holdings cascade;
drop table if exists public.portfolios cascade;
```

No broad `drop schema public cascade` was used. No auth, storage, realtime, extension, vault, graphql, Supabase-managed schema, or non-approved public table was selected for reset/drop.

## Reset/Drop Execution Result

Result: passed.

After reset/drop, the public schema listed no tables before applying the rebuild migration.

## Migration File Applied

Applied migration source:

- `supabase/migrations/20260615_rebuild_schema_v0_1.sql`

Result: passed.

## Patch Handling Result

Patch source:

- `supabase/validation/patch_consume_chart_ai_usage_v0_1.sql`

Result: not applied.

The disposable patch remains disposable-validation repair SQL only. The fixed source migration was used as the production source of truth.

## Validation SQL Result

Validation source:

- `supabase/validation/validate_rebuild_schema_v0_1.sql`

Result: ran without SQL execution error.

The connector returned only the final result set from the multi-statement validation file, so Codex ran targeted read-only validation queries separately to capture each required pass/fail criterion.

## Targeted Validation Result Matrix

| Check | Result | Evidence summary |
|---|---|---|
| 14 required public tables exist | Pass | Required table count returned 14 of 14 with no missing tables. |
| RLS enabled on all 14 required public tables | Pass | RLS-enabled count returned 14 of 14 with no missing tables. |
| `ad_events` has no public select or insert policy | Pass | Matching public/anon/authenticated select-or-insert policy count returned 0. |
| `chart_ai_cache` has no `user_id` | Pass | Column existence check returned false. |
| `public.set_updated_at()` exists | Pass | Function existence count returned 1. |
| `internal.consume_chart_ai_usage(uuid, integer)` exists | Pass | Function existence count returned 1. |
| `internal.consume_chart_ai_usage(uuid, integer)` executable only by `service_role` | Pass | `anon` false, `authenticated` false, `service_role` true. |
| Phase 2H `usage_date_kst` ambiguity fix present | Pass | Function definition contains the internal aliases, named unique constraint, and qualified usage-date reference. |
| Disposable patch not applied separately to production | Pass | Patch SQL was not applied. |

## Usage-Function Runtime Test Result

Result: not performed.

Reason: the Supabase connector available to Codex did not expose a safe Auth Admin operation for creating a production test auth user. A direct auth schema metadata check failed at the connector transport layer, and Codex did not force direct auth-table manipulation.

Schema-level function validation passed, including function existence, service-role-only execution privilege, and Phase 2H ambiguity-fix checks.

## Test Auth User Handling

No production test auth user was created.

No test user password, ID, or credential was requested, printed, stored, or recorded.

## Supabase Advisors Result

Security Advisors result: warnings exist and require owner review.

- One `WARN`: leaked password protection is disabled.
- One `INFO`: `ad_events` has RLS enabled with no policies. This matches the current server-write-only intent and should be reviewed again when the future ad-event API route is implemented.

Performance Advisors result: informational findings only.

- One `INFO`: `ad_events.user_id` foreign key is currently unindexed.
- Multiple `INFO` unused-index findings are expected immediately after a fresh schema rebuild with no production workload yet.

No automatic Advisor fix/apply action was run.

## Vercel Env Var Non-Mutation Confirmation

No Vercel environment variable was read, printed, pulled, added, updated, removed, or overwritten.

No Vercel deployment was run.

## Secret-Safe Reporting Confirmation

No secret values were requested or recorded.

This result records only non-secret project classification, table names, file paths, validation counts, and high-level Advisor findings.

## Issues Encountered

- The reviewed validation SQL file contains a disposable-only warning in its header, but Phase 2L explicitly required running it against production after migration. It ran without execution error.
- The Supabase connector returned only the final result set for the multi-statement validation file, so Codex ran separate targeted validation queries for the required criteria.
- The usage-function runtime test was skipped because no safe Auth Admin test-user creation channel was available through the connector.

## Final Production DB Readiness Status

Status: production schema ready for next integration phase, with follow-up items.

The production database now has the Phase 2 rebuild schema applied and targeted catalog/RLS/function checks passed.

## Remaining Post-Migration Tasks

- Review Security Advisor warning for leaked password protection.
- Decide whether to add an index for `ad_events.user_id` before or during the future ad-event server route implementation.
- Revisit the `ad_events` RLS/no-policy informational Advisor item when the server-write ad-event API route is implemented.
- Run a usage-function runtime test later through a safe Auth Admin/test-user path or server route implementation.
- Implement application features in later phases only.

## Non-Feature Statement

Phase 2L did not implement application features, API routes, Vercel env changes, deployment changes, KIS, OpenDART, OpenAI, Gemini, Chart AI UI, Heatmap logic, Lab ingestion logic, Portfolio UI logic, or Auth UI logic.

## Final Statement

Phase 2L completed the approved production reset/drop and fixed-source Supabase migration. Production DB schema readiness is sufficient to proceed to the next integration planning phase, subject to the remaining follow-up items above.
