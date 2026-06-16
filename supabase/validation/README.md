# Supabase Validation

## Status

This directory contains disposable validation materials only. It does not authorize production access or migration application.

## Files

- `validate_rebuild_schema_v0_1.sql`: read-only catalog validation script for disposable databases after migration application.
- `patch_consume_chart_ai_usage_v0_1.sql`: disposable-validation patch for the already-created validation project if `internal.consume_chart_ai_usage(uuid, integer)` raises a `usage_date_kst` ambiguity error.
- `docs/planning/supabase_disposable_project_setup_guide_v0.1.md`: operator guide for manually creating a disposable Supabase validation project.

## Safety Rules

- Never run against production.
- Never paste or commit database passwords, service-role keys, anon keys, tokens, connection strings, or project refs.
- Never capture screenshots or logs containing secrets.
- Stop if target isolation is uncertain.
- Apply `patch_consume_chart_ai_usage_v0_1.sql` only to the disposable validation project, never production.

## Intended Workflow

1. Owner manually creates a disposable project.
2. Owner explicitly approves applying the migration to the disposable project.
3. Migration SQL is applied only to the disposable project.
4. Validation SQL is run only after migration.
5. Non-secret results are captured for review.
6. Successful disposable validation does not authorize production migration.
7. Successful patch testing does not authorize production migration.

## Patch Scope

The patch SQL exists only to repair the already-created disposable validation project after manual validation found a runtime ambiguity in `internal.consume_chart_ai_usage(uuid, integer)`. The migration source of truth must still be reviewed separately before any production application.

## Related Planning Docs

- `docs/planning/supabase_disposable_project_setup_guide_v0.1.md`
- `docs/planning/supabase_remote_disposable_validation_plan_v0.1.md`
- `docs/planning/supabase_human_review_v0.1.md`
