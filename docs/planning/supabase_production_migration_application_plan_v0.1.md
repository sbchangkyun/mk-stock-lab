# Supabase Production Migration Application Plan v0.1

## Status And Scope

This document is a production migration application plan only. It does not execute, approve, or authorize any production database change.

Phase 2J does not connect to Supabase, does not run SQL, does not run Supabase CLI commands, does not request secrets, and does not touch the production database.

The plan must be reviewed before any production database action. Production migration requires the exact owner approval phrase listed below.

## Current Validated Baseline

Phase 2I recorded operator-performed validation in a separate disposable Supabase validation project.

Validated baseline:

- `supabase/migrations/20260615_rebuild_schema_v0_1.sql` applied successfully to the disposable project.
- 14 required public tables were verified.
- RLS was enabled on all 14 required public tables.
- `ad_events` had no public insert policy.
- `chart_ai_cache` had no `user_id` column.
- `public.set_updated_at()` existed.
- `internal.consume_chart_ai_usage(uuid, integer)` existed.
- `internal.consume_chart_ai_usage(uuid, integer)` was executable only by `service_role`.
- Phase 2H fixed the `usage_date_kst` ambiguity in the migration source.
- The patched four-call usage test passed with remaining counts `2`, `1`, `0`, `0`.
- The test was wrapped in transaction/rollback and left no test usage row.
- The full validation SQL rerun passed after the patch.
- Supabase Advisors reported no critical warnings according to the operator.

Disposable validation reduces production risk, but it does not authorize production migration.

## Hard Gates Before Production Execution

| Gate | Required evidence | Owner action | Stop condition |
|---|---|---|---|
| Production target identity | The selected Supabase project is confirmed as the intended production project. | Visually confirm the dashboard/project before any SQL is opened. | Stop if the selected project is uncertain or not production. |
| Disposable key separation | No disposable project key, URL, project ref, or connection string is used in production. | Confirm disposable validation credentials are not copied into Vercel or production settings. | Stop if any disposable credential is present in production configuration. |
| Backup strategy | Backup or restore point exists, or the owner explicitly accepts reset/rebuild risk. | Confirm backup artifact location outside chat, without sharing secrets. | Stop if rollback expectations are unclear. |
| Existing production schema state | Existing tables, policies, and data ownership are understood. | Confirm whether production is empty, disposable, or contains real user data. | Stop if real user data exists and no migration-preservation strategy is approved. |
| Real user data check | Production data status is known. | State whether production contains real user data. | Stop if there is user data and the migration may drop, overwrite, or conflict with it. |
| Rollback feasibility | Rollback or restore path is practical for the selected target. | Confirm restore steps are available before execution. | Stop if rollback cannot be performed within acceptable time. |
| Maintenance timing | Low-traffic or maintenance window is selected if production users exist. | Pick execution timing. | Stop if user impact is unacceptable. |
| Environment variable separation | DB migration is not mixed with Vercel env var updates. | Keep env review as a separate phase unless explicitly approved. | Stop if env changes are bundled into migration execution. |
| Exact execution approval | Owner gives the exact Phase 2K approval phrase. | Provide the approval phrase in a new command. | Stop if approval is partial, implied, or paraphrased. |
| Post-migration validation | Validation checklist and owner for each check are known. | Confirm who runs validation and records non-secret results. | Stop if validation ownership is unclear. |

## Required Owner Approval Phrase

The only approval phrase that authorizes the next production execution phase is:

```text
I approve Phase 2K production Supabase migration execution for mk-stock-lab.
```

Approval of this plan alone is not execution approval. Silence, review completion, or approval of disposable validation does not authorize production migration.

## Backup And Recovery Requirements

The owner must confirm backup and recovery readiness before Phase 2K.

Required checks:

1. Confirm whether production is empty, disposable, or contains real user data.
2. If real user data exists, create a production database backup or restore point before migration.
3. Keep backup identifiers, database URLs, passwords, tokens, and project refs out of chat and committed files.
4. Confirm restore feasibility before migration, including who can restore and how long recovery is expected to take.
5. Confirm whether a full reset is acceptable if production has no real data.
6. Confirm emergency stop criteria before SQL execution.

Rollback decision tree:

| Situation | Response |
|---|---|
| Migration has not started | Do not execute; revise plan or SQL. |
| Migration starts and fails before data writes matter | Stop, capture non-secret error context, and evaluate restore/reset. |
| Migration succeeds but validation fails | Stop product rollout, preserve state, and decide between targeted fix or restore. |
| Migration affects real user data unexpectedly | Stop immediately, do not run follow-up SQL, and initiate approved recovery path. |

Emergency stop conditions:

- Wrong project is selected.
- Any secret appears in copied logs or screenshots.
- Production data status is not what was expected.
- Migration file differs from the reviewed source.
- Validation script differs from the reviewed source.
- Any SQL Editor tab, CLI context, or dashboard project identity is uncertain.

## Production Pre-Flight Checklist

Before Phase 2K execution:

1. Confirm branch: `rebuild/phase-1-ia-shell`.
2. Confirm commit hash selected for execution.
3. Confirm `git status --short` is clean or contains only explicitly approved docs.
4. Confirm `supabase/migrations/20260615_rebuild_schema_v0_1.sql` is unchanged since the approved review.
5. Confirm the Phase 2H fix is incorporated into the source migration.
6. Confirm `supabase/validation/validate_rebuild_schema_v0_1.sql` is available.
7. Confirm `supabase/validation/patch_consume_chart_ai_usage_v0_1.sql` is not planned for production if the source migration already includes the Phase 2H fix.
8. Confirm no Vercel production environment variable update is included in the DB migration step.
9. Confirm the production Supabase project is visually selected.
10. Confirm the disposable project is not selected.
11. Confirm no wrong SQL Editor tab or old browser tab is active.
12. Confirm screenshots, logs, and notes exclude secrets.

## Future Production Application Sequence

This sequence is for a later Phase 2K only, after exact owner approval.

1. Open the production Supabase project only after approval.
2. Verify production identity in the dashboard before opening SQL Editor.
3. Confirm backup or reset strategy is complete.
4. Apply `supabase/migrations/20260615_rebuild_schema_v0_1.sql`.
5. Do not apply `supabase/validation/patch_consume_chart_ai_usage_v0_1.sql` to production if the source migration already includes the Phase 2H fix.
6. Run `supabase/validation/validate_rebuild_schema_v0_1.sql`.
7. Run targeted catalog, RLS, grant, and function checks.
8. Create a production test auth user only if the owner explicitly allows it.
9. If a usage-function runtime test is approved, wrap it in `begin; ... rollback;`.
10. Verify no test rows remain after rollback.
11. Run Supabase Advisors if available.
12. Record non-secret results in a production validation result document.

None of these steps are executed in Phase 2J.

## Patch Handling Rule

`supabase/validation/patch_consume_chart_ai_usage_v0_1.sql` exists for the already-created disposable validation project.

Production should use the reviewed source migration, because the Phase 2H fix is incorporated into `supabase/migrations/20260615_rebuild_schema_v0_1.sql`.

Do not apply both the fixed source migration and the disposable patch to a fresh production database unless a separate SQL review explicitly confirms it is necessary.

## Post-Migration Validation Plan

After production migration in Phase 2K, validate:

- 14 required public tables exist.
- RLS is enabled on all required public tables.
- `ad_events` has no public insert policy.
- `chart_ai_cache` has no `user_id`.
- `public.set_updated_at()` exists.
- `internal.consume_chart_ai_usage(uuid, integer)` exists.
- `internal.consume_chart_ai_usage(uuid, integer)` is executable only by `service_role`.
- The Phase 2H `usage_date_kst` ambiguity fix is present.
- If approved, the four-call usage test returns remaining counts `2`, `1`, `0`, `0`.
- Any test usage row is removed by rollback.
- Supabase Advisors report no critical warning, or any warning is documented before product rollout.

## Production Test User Policy

Do not create or use a production test auth user unless the owner explicitly allows it during Phase 2K.

If a production test user is approved:

- Use a clearly disposable test account.
- Do not use a real customer account.
- Do not paste credentials into chat or committed files.
- Wrap database-side usage function tests in `begin; ... rollback;` where possible.
- Confirm test rows do not remain after validation.

## Environment Variable Separation

This plan intentionally separates database migration from environment variable work.

Do not add, rotate, print, summarize, or validate production values for:

- Supabase URL or keys.
- KIS keys.
- OpenDART keys.
- OpenAI keys.
- Gemini keys.
- Vercel production environment variables.

Production environment review should be a separate phase after the database migration plan is approved.

## Disposable Project Retention

Keep the disposable Supabase validation project until this production plan is reviewed, unless the owner decides to delete it earlier.

Never connect the production app to disposable project credentials. Never copy disposable project keys into Vercel production.

## Phase 2K Proposal

Recommended next execution phase:

```text
Phase 2K: Execute production Supabase migration under owner approval
```

Phase 2K must not start without this exact approval phrase:

```text
I approve Phase 2K production Supabase migration execution for mk-stock-lab.
```

## Recommended Alternatives

Option A: Execute production migration later under Phase 2K approval.

Trade-off: fastest route to real DB readiness, but requires backup confidence and exact owner approval.

Option B: Run one more schema/security review before production.

Trade-off: lowers risk before production, but delays DB availability.

Option C: Defer production DB work and continue non-DB UI/product implementation with mock/static data only.

Trade-off: keeps production DB untouched, but later integration risk remains.

## References

- Supabase Row Level Security docs: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Database Functions docs: https://supabase.com/docs/guides/database/functions
- Supabase Database Backups docs: https://supabase.com/docs/guides/platform/backups
- Supabase Database Migrations docs: https://supabase.com/docs/guides/deployment/database-migrations

## Final Statement

This plan authorizes no production action. Production migration remains blocked until exact owner approval is given for Phase 2K.
