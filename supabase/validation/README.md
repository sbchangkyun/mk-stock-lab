# Supabase Validation Scripts

This folder contains read-only validation scripts for disposable database checks.

## Files

- `validate_rebuild_schema_v0_1.sql`: catalog checks for the rebuild schema after applying `supabase/migrations/20260615_rebuild_schema_v0_1.sql` to a disposable database.

## Safety Rules

- Do not run these scripts against production.
- Do not include connection strings or secrets in this folder.
- Apply migrations only after explicit operator approval.
- Keep optional mutation tests commented unless the database is disposable and the operator approved the test.
- For manual disposable project setup, review `docs/planning/supabase_disposable_project_setup_guide_v0.1.md` first.

## Example Use

After the migration is applied to a disposable database, run:

```powershell
psql "<DISPOSABLE_DATABASE_URL>" -f supabase/validation/validate_rebuild_schema_v0_1.sql
```

Replace the placeholder in your own shell only. Do not commit connection strings.
