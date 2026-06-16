# Supabase Disposable Validation Result v0.1

## Status And Scope

This document records operator-performed disposable Supabase validation results.

Codex did not connect to Supabase. Production Supabase was not touched. Successful disposable validation does not authorize production migration.

## Validation Target

Target type: separate disposable Supabase validation project.

Recorded target detail: project name contained validation/temp wording.

This document does not record project refs, URLs, database passwords, service-role keys, anon keys, JWT secrets, access tokens, or connection strings.

## Files Validated

- `supabase/migrations/20260615_rebuild_schema_v0_1.sql`
- `supabase/validation/validate_rebuild_schema_v0_1.sql`
- `supabase/validation/patch_consume_chart_ai_usage_v0_1.sql`

## Validation Timeline

1. Migration SQL was manually applied to the disposable project by the operator.
2. Basic catalog, RLS, and function validation passed.
3. Initial usage function runtime test found a `usage_date_kst` ambiguity.
4. Phase 2H fixed the migration source and created a disposable patch SQL file.
5. The patch was manually applied to the disposable project by the operator.
6. Usage function retest passed.
7. Full validation SQL was rerun and passed after the patch.
8. Supabase Advisors reported no critical warnings according to the operator.

## Result Matrix

| Check item | Expected result | Observed result | Status |
|---|---|---|---|
| Migration applied to disposable project | Migration applies successfully | Applied manually by operator | Pass |
| 14 required public tables exist | 14 tables present | 14 tables present | Pass |
| RLS enabled on all required public tables | RLS enabled on all 14 tables | RLS enabled on all 14 tables | Pass |
| `ad_events` has no public insert policy | No public insert policy | No public insert policy | Pass |
| `chart_ai_cache` has no `user_id` | No `user_id` column | No `user_id` column | Pass |
| `public.set_updated_at()` exists | Function exists | Function exists | Pass |
| `internal.consume_chart_ai_usage(uuid, integer)` exists | Function exists | Function exists | Pass |
| `internal.consume_chart_ai_usage` executable only by `service_role` | Only `service_role` can execute | Only `service_role` can execute | Pass |
| Four-call usage test | Calls 1-3 allowed, call 4 denied | Passed after Phase 2H patch | Pass |
| Rollback/test usage row cleanup | No test usage row remains | No test usage row remained | Pass |
| Full validation SQL rerun | Validation SQL runs successfully | Rerun passed after patch | Pass |
| Supabase Advisors critical warning check | No critical warnings | No critical warnings reported by operator | Pass |

## Usage Function Test Result

- Test used a real disposable `auth.users` user.
- First three calls returned `allowed = true`.
- Fourth call returned `allowed = false`.
- `remaining_count` followed `2`, `1`, `0`, `0`.
- Test was wrapped in transaction/rollback.
- No test usage row remained after rollback.

## Bug Found And Fixed

Bug: `usage_date_kst` ambiguity in `internal.consume_chart_ai_usage`.

Cause: `returns table (...)` output column name conflicted with a table column reference inside the PL/pgSQL function.

Fix: stable named unique constraint, `on conflict on constraint`, table-qualified references, and internal `out_*` aliases.

Status: patch passed disposable validation.

Source migration status: updated in Phase 2H.

## Production Non-Authorization

This validation result does not authorize production migration.

Production migration requires a separate production application plan and explicit owner approval. Production backup/reset strategy remains unresolved. Disposable project keys must never be used in Vercel production.

## Remaining Risks

- Production database has not been migrated.
- Production backup/reset strategy is not approved.
- Production environment variables are not reviewed in this phase.
- Future server route must call the usage function with service-role access carefully.
- `profiles` login-time upsert path still needs implementation later.
- `ad_events` server-side route and rate limiting still need implementation later.
- Root `README.md` still contains default Astro Starter Kit text and remains separate documentation debt.

## Recommended Next Options

- Option A: Decide whether to delete or keep the disposable Supabase validation project.
- Option B: Prepare a production Supabase migration application plan.
- Option C: Pause DB work and review SQL/product schema further.

## Final Statement

Phase 2I is documentation-only and does not authorize production database changes.
