# Supabase Disposable Project Setup Guide v0.1

Status: setup preparation guide only

This guide prepares an operator to manually create a separate disposable Supabase project for migration validation. It does not authorize Codex, Claude, ChatGPT, or any agent to access Supabase. It does not authorize migration execution. Production Supabase must not be touched. The operator must manually create and control the disposable project.

## Purpose

The disposable project is only for validating:

- SQL parsing.
- Table creation.
- RLS policies.
- Grants.
- Internal usage function behavior.
- Validation SQL output.

No production data should be copied into the disposable project.

## Recommended Naming Convention

Use a name that clearly signals temporary validation:

- `mk-stock-lab-db-validation-disposable`
- `mk-stock-lab-supabase-validation-temp`

The name should not resemble the production project name too closely. It should include `disposable`, `validation`, or `temp`.

## Manual Supabase Dashboard Setup Checklist

The operator should perform these steps manually:

1. Open the Supabase dashboard manually.
2. Confirm the current project is not production.
3. Create a new project only for disposable validation.
4. Use a clearly disposable name.
5. Select a region intentionally.
6. Generate and store the database password in a password manager.
7. Do not paste the password into Codex, Claude, ChatGPT, Git, terminal logs, or committed files.
8. Wait until the project is fully provisioned.
9. Label or document the project as disposable validation-only.
10. Confirm no production data is imported.

## Safety Checklist Before Any SQL Is Pasted

- Confirm the project name contains `disposable`, `temp`, or `validation`.
- Confirm the production project is not selected.
- Confirm no production connection string is open in the terminal.
- Confirm migration file path: `supabase/migrations/20260615_rebuild_schema_v0_1.sql`.
- Confirm validation script path: `supabase/validation/validate_rebuild_schema_v0_1.sql`.
- Confirm SQL Editor is opened only in the disposable project.
- Confirm no secrets are pasted into SQL Editor except what Supabase itself requires internally.
- Confirm the owner has explicitly approved migration application to the disposable project.

## Disposable SQL Editor Validation Workflow

Do not perform these steps until the owner explicitly approves applying the migration to the disposable project.

1. Open SQL Editor in the disposable project only.
2. Paste migration SQL from `supabase/migrations/20260615_rebuild_schema_v0_1.sql`.
3. Run the migration.
4. Paste validation SQL from `supabase/validation/validate_rebuild_schema_v0_1.sql`.
5. Run the validation.
6. If the usage function raises a `usage_date_kst` ambiguity error, review `supabase/validation/patch_consume_chart_ai_usage_v0_1.sql` and apply it only after owner approval for the disposable project.
7. Copy non-secret validation output only.
8. Do not copy database passwords, service-role keys, anon keys, tokens, or connection strings.
9. Record results in the validation result template.

## Results The Operator Should Capture

| Result item | Value |
|---|---|
| Migration applied | yes/no |
| 14 public tables created | pass/fail |
| RLS enabled on every public table | pass/fail |
| `ad_events` public insert absent | pass/fail |
| `chart_ai_cache` has no `user_id` | pass/fail |
| `internal.consume_chart_ai_usage` exists | pass/fail |
| `public.set_updated_at()` exists | pass/fail |
| Supabase advisors run | pass/fail/not run |
| Issues found |  |
| Decision |  |

## Results That Must Not Be Captured

Do not capture, paste, save, commit, or share:

- Database password.
- Supabase access token.
- Service-role key.
- Anon key.
- JWT secret.
- Full connection string.
- Full project URL if the operator considers it sensitive.
- Screenshots containing secrets.
- Browser console logs containing secrets.

## Post-Validation Disposal Options

- Delete the disposable project after validation.
- Keep it temporarily, but clearly mark it as validation-only.
- Never connect the production app to this project.
- Never reuse disposable project keys in Vercel production.

## Hard Stop Conditions

Stop immediately if:

- The selected project may be production.
- The project name does not clearly indicate `disposable`, `temp`, or `validation`.
- Production data is present.
- A production connection string is visible.
- Secrets appear in logs or screenshots.
- Owner approval is missing.
- Migration file path is wrong.
- Validation script path is wrong.
- Any uncertainty exists about isolation.

## Owner Approval Phrases

Use these exact phrases later:

```text
Approve creating a disposable Supabase validation project
```

```text
Approve applying the migration to the disposable Supabase validation project
```

```text
Do not create or apply anything yet
```

Only the second phrase authorizes migration application to the disposable project. None of these phrases authorize production application.

## Relationship To Production Application

Successful disposable validation does not authorize production migration. Production application requires a separate production application plan and separate owner approval. Production backup/reset strategy remains unresolved.

## Recommended Next Options

- Option A: Owner manually creates the disposable Supabase project using this guide.
- Option B: Owner asks for a migration execution checklist after creating the disposable project.
- Option C: Owner pauses DB validation and reviews SQL further.

## Final Statement

Phase 2F does not authorize remote access, project creation by an agent, migration application, or database mutation.
