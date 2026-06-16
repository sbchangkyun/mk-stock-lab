# Supabase Validation

## Status

This directory contains disposable validation materials only. It does not authorize production access or migration application.

## Files

- `validate_rebuild_schema_v0_1.sql`: read-only catalog validation script for disposable databases after migration application.
- `docs/planning/supabase_disposable_project_setup_guide_v0.1.md`: operator guide for manually creating a disposable Supabase validation project.

## Safety Rules

- Never run against production.
- Never paste or commit database passwords, service-role keys, anon keys, tokens, connection strings, or project refs.
- Never capture screenshots or logs containing secrets.
- Stop if target isolation is uncertain.

## Intended Workflow

1. Owner manually creates a disposable project.
2. Owner explicitly approves applying the migration to the disposable project.
3. Migration SQL is applied only to the disposable project.
4. Validation SQL is run only after migration.
5. Non-secret results are captured for review.
6. Successful disposable validation does not authorize production migration.

## Related Planning Docs

- `docs/planning/supabase_disposable_project_setup_guide_v0.1.md`
- `docs/planning/supabase_remote_disposable_validation_plan_v0.1.md`
- `docs/planning/supabase_human_review_v0.1.md`
