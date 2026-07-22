# Supabase Remote Disposable Validation Plan v0.1

Status: planning-only document

This document plans validation of the Supabase rebuild migration against a remote disposable target. It does not authorize remote access. It does not authorize migration application. Production Supabase must not be touched. Any remote branch or disposable validation requires separate explicit owner approval.

## Validation Target Options

### Option A: Supabase Branch Database From Existing Project

Use a Supabase branch database only if the owner explicitly confirms the branch is disposable, isolated from production writes, and safe for migration testing.

### Option B: Separate Disposable Supabase Project

Use a separate disposable Supabase project created only for validation. This is the safer default when there is any uncertainty about branch isolation, existing production data, or operator experience.

## Option Comparison

| Category | Option A: Supabase branch database | Option B: separate disposable project |
|---|---|---|
| Setup complexity | Medium | Medium to high |
| Production isolation | Good only if branch isolation is confirmed | Stronger because it is a separate project |
| Similarity to production | Higher if created from the existing project settings | Lower unless configured to match production intentionally |
| Risk of accidental production impact | Medium if operator selects the wrong branch or merges changes | Lower if the project is clearly disposable |
| Recommended use case | Experienced operator validating branch-specific behavior | Default path for safer migration validation |
| Required owner approval | Explicit approval naming the branch target | Explicit approval naming the disposable project target |

## Recommended Path

Prefer a separate disposable Supabase project if there is any uncertainty about branch isolation, existing production data, or operator experience.

Use a Supabase branch only if the owner explicitly confirms the branch is disposable and isolated from production writes.

## Required Owner-Provided Information Later

The owner must provide or confirm the following later. Do not provide secret values in this phase.

- Validation target type: branch or disposable project.
- Confirmation that the target is not production.
- Confirmation that production data will not be used.
- Confirmation that the migration can be applied to the target.
- Confirmation whether existing disposable data can be destroyed.
- Whether Supabase SQL Editor or CLI/API will be used.
- Who will execute the migration.

Do not request access tokens, database passwords, service-role keys, or connection strings in this document.

## Pre-Flight Safety Checklist

- Confirm the target project or ref is not production.
- Confirm the production URL or project name is not selected.
- Confirm no production connection string is active in the shell.
- Confirm no real customer data is present.
- Confirm migration file path: `supabase/migrations/20260615_rebuild_schema_v0_1.sql`.
- Confirm validation script path: `supabase/validation/validate_rebuild_schema_v0_1.sql`.
- Confirm rollback or disposal plan.
- Confirm the owner has given explicit approval.

## Remote Disposable Validation Workflow

1. Create or select the disposable validation target.
2. Confirm target isolation.
3. Apply the migration to the disposable target only.
4. Run `supabase/validation/validate_rebuild_schema_v0_1.sql`.
5. Run structural checks.
6. Run RLS checks.
7. Run Chart AI usage function checks.
8. Run `ad_events` write-blocking checks.
9. Run Supabase advisors if available.
10. Capture results without secrets.
11. Dispose of the target or keep it clearly marked as validation-only.

## SQL Editor Workflow

Use this workflow only after explicit owner approval and only in a disposable project or disposable branch.

1. Open the disposable project SQL Editor only.
2. Confirm production is not selected.
3. Paste the migration SQL from `supabase/migrations/20260615_rebuild_schema_v0_1.sql`.
4. Run the migration.
5. Paste the validation SQL from `supabase/validation/validate_rebuild_schema_v0_1.sql`.
6. Run the validation.
7. Do not paste or expose secrets.
8. Export or copy only non-secret validation results.

## CLI Workflow Placeholder

This is an outline only. Do not run it without separate explicit owner approval. Do not use production project refs, tokens, passwords, or connection strings.

```powershell
# Confirm this points only to a disposable target.
supabase --version

# Option: run SQL against a disposable database URL.
psql "<DISPOSABLE_DB_URL>" -f "<LOCAL_PATH>/supabase/migrations/20260615_rebuild_schema_v0_1.sql"
psql "<DISPOSABLE_DB_URL>" -f "<LOCAL_PATH>/supabase/validation/validate_rebuild_schema_v0_1.sql"

# Option: use a disposable project ref only after owner approval.
supabase link --project-ref <DISPOSABLE_PROJECT_REF>
```

All placeholders must be replaced outside committed files. Do not commit connection strings or secrets.

## Validation Result Template

| Field | Result |
|---|---|
| Target type |  |
| Target name/ref, masked |  |
| Migration applied | yes/no |
| 14 table count | pass/fail |
| RLS status | pass/fail |
| Policy check | pass/fail |
| Function check | pass/fail |
| Usage fourth-call denial | pass/fail |
| `ad_events` public insert blocked | pass/fail |
| Supabase advisors | pass/fail/not run |
| Issues found |  |
| Decision | revise SQL / proceed to remote production plan / stop |

## Hard Stop Conditions

Stop immediately if any of the following are true:

- Target may be production.
- Production connection string is visible.
- Production data is present.
- Owner approval is missing.
- Migration file does not match expected path.
- Validation script is missing.
- Secret values appear in logs.
- Any uncertainty exists about target isolation.

## Remaining Risks

- Remote branch behavior may differ from a separate project.
- SQL Editor manual application can cause copy/paste mistakes.
- RLS role simulation must be carefully verified.
- Service-role usage function must be tested only in controlled conditions.
- Production backup/reset remains a separate decision.
- Phase 3 should not start until DB validation and application path are settled.

## Recommended Next Options

- Option A: Owner reviews the remote disposable validation plan only.
- Option B: Owner approves setup of a disposable Supabase validation target.
- Option C: Revise SQL before any validation.

## Final Statement

Phase 2E does not authorize remote access or database mutation.
