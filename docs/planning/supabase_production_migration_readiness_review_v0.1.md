# Supabase Production Migration Readiness Review v0.1

## Status And Scope

This document is a final production migration readiness review. It is not production migration execution.

Codex did not connect to Supabase, did not run SQL, did not run a Supabase CLI command, did not run a `psql` command, and did not perform production migration in Phase 2J.1.

Production migration remains blocked until the owner gives the exact approval phrase for Phase 2K.

This review does not authorize Phase 2K.

## Executive Verdict

Verdict: `Ready for owner decision, not ready for execution`

- Disposable validation evidence is strong enough to support an owner decision about whether to proceed toward production.
- The source migration includes the Phase 2H usage-function fix, and the disposable patch is documented as disposable repair SQL only.
- Production target identity, production data state, backup readiness, rollback owner, and test user policy are still unconfirmed.
- The exact Phase 2K approval phrase has not been given.
- Production execution must remain blocked until the owner confirms the open gates below.

## Readiness Matrix

| Area | Evidence reviewed | Status | Blocking condition | Required owner decision |
|---|---|---|---|---|
| Disposable validation result | `docs/planning/supabase_disposable_validation_result_v0.1.md` records successful disposable validation, four-call usage test, rollback cleanup, and no critical Advisor warnings. | Ready for owner decision | Disposable success does not authorize production. | Decide whether this validation is sufficient or request another review. |
| Source migration readiness | `supabase/migrations/20260615_rebuild_schema_v0_1.sql` statically shows 14 public tables, RLS, grants, policies, and functions. | Ready for owner decision | Production schema compatibility is unknown. | Confirm whether production can receive this migration as reviewed. |
| Phase 2H patch incorporation | Static review found named unique constraint, table-qualified references, and internal `out_*` aliases in the source migration. | Satisfied by existing documentation | None for owner decision. | Confirm the fixed source migration is the production source of truth. |
| Patch handling rule | Phase 2J plan and validation README say the patch is disposable repair SQL only. | Ready for owner decision | Production state could require separate review if it already has the pre-patch function body. | Confirm fresh production should use the fixed source migration only. |
| Validation SQL readiness | `supabase/validation/validate_rebuild_schema_v0_1.sql` contains post-migration catalog, grant, function, and policy checks. | Ready for owner decision | Validation owner is not confirmed. | Assign who runs validation and records non-secret results. |
| Production target identity | Phase 2J plan requires visual production project confirmation. | Requires owner confirmation | Target project is not confirmed in this repo. | Confirm the exact production project in the dashboard without sharing secret identifiers. |
| Production schema/data state | Phase 2J plan marks production schema/data state as a hard gate. | Requires owner confirmation | Production may be empty, disposable, or contain real user data; current state is unknown. | Confirm production data state before approval. |
| Backup/recovery readiness | Phase 2J plan requires backup, restore, or accepted reset risk. | Requires owner confirmation | No backup or accepted reset-risk evidence is recorded. | Confirm backup exists or reset/rebuild risk is accepted. |
| Rollback feasibility | Phase 2J plan defines rollback decision paths. | Requires owner confirmation | Restore owner and recovery timing are unknown. | Name the rollback owner and expected recovery path. |
| Production test user policy | Phase 2J plan requires explicit approval before creating or using a production test auth user. | Requires owner confirmation | Runtime usage test may require a production test user. | Decide whether a production test auth user is allowed. |
| Environment variable separation | Phase 2J plan separates DB migration from Vercel env updates. | Ready for owner decision | Production env values were intentionally not reviewed. | Confirm no env var changes are bundled into Phase 2K. |
| Service-role safety boundary | Schema notes, migration, and human review docs keep service-role usage server-only. | Ready for owner decision | Future app code is not implemented yet. | Confirm future service-role calls must stay server-side only. |
| Advisors validation | Phase 2I records no critical Advisor warnings according to the operator. | Ready for owner decision | Production Advisors are not yet run. | Decide whether disposable Advisor evidence is enough before production. |
| Exact approval phrase | Phase 2J defines the exact phrase required for Phase 2K. | Requires owner confirmation | Exact phrase has not been given. | Use the exact phrase only after all other gates are confirmed. |
| Disposable project retention/deletion | Phase 2J recommends keeping disposable project until plan review unless owner deletes it earlier. | Requires owner confirmation | Retention choice is not recorded. | Keep through production completion or delete if no further validation is needed. |
| Root README documentation debt | Root `README.md` still contains default Astro Starter Kit content and mojibake. | Not blocking production DB decision | It is unrelated documentation debt. | Decide later when project documentation cleanup is in scope. |

## Production Hard Gate Review

| Hard gate | Classification | Review note |
|---|---|---|
| Production target identity | Requires owner confirmation | The reviewed docs require visual confirmation, but no production target confirmation is recorded. |
| Disposable key separation | Requires owner confirmation | Docs state disposable credentials must never enter production; current production configuration was not inspected. |
| Backup strategy | Requires owner confirmation | No backup artifact, restore point, or accepted reset-risk decision is recorded. |
| Existing production schema state | Requires owner confirmation | Existing production tables, policies, and data ownership are unknown. |
| Real user data check | Requires owner confirmation | The repo does not establish whether production contains real user data. |
| Rollback feasibility | Requires owner confirmation | Restore authority, restore steps, and recovery timing are not confirmed. |
| Maintenance timing | Requires owner confirmation | Required only if production users or production traffic exist, which is not confirmed. |
| Environment variable separation | Satisfied by existing documentation | Phase 2J separates DB migration from env var changes; owner must still confirm Phase 2K keeps them separate. |
| Exact execution approval | Requires owner confirmation | The exact approval phrase has not been provided. |
| Post-migration validation | Requires owner confirmation | The validation script exists, but the validation runner/recorder is not assigned. |

Production schema/data state is unknown, so production execution is blocked until the owner confirms it.

## SQL And Patch Handling Review

Static file review only:

- Production should use `supabase/migrations/20260615_rebuild_schema_v0_1.sql`.
- `supabase/validation/patch_consume_chart_ai_usage_v0_1.sql` is disposable repair SQL for the already-created validation project.
- Fresh production should not receive both the fixed source migration and the disposable patch unless a later SQL review explicitly determines production already has the pre-patch function body.
- `supabase/validation/validate_rebuild_schema_v0_1.sql` remains the post-migration validation script.

No SQL was run during this review.

## Function And RLS Safety Review

The current documentation sufficiently preserves the intended safety rules:

- All 14 public tables are expected to have RLS enabled.
- `ad_events` is server-write only.
- `chart_ai_cache` is non-personal and has no `user_id`.
- `internal.consume_chart_ai_usage(uuid, integer)` should be executable only by `service_role`.
- Future app code must call service-role operations only from server-side routes.
- Client-side code must never receive service-role keys.

Static review of the migration aligns with the documentation: RLS is enabled for all required public tables, explicit grants are present, `ad_events` has service-role write intent, and the internal usage function revokes public, anon, and authenticated execution before granting execute to `service_role`.

This safety posture is sufficient for an owner decision. It is not a substitute for production post-migration validation.

## Production Data And Backup Decision Gap

The following owner inputs remain unresolved and must not be assumed:

- Whether production is empty, disposable, or contains real user data.
- Whether reset/rebuild is acceptable.
- Whether a backup or restore point exists.
- Who can restore production and how quickly.
- Whether a maintenance window is needed.
- Whether a production test auth user is allowed.

These are owner decision items, not facts established by Codex.

## Phase 2K Start Conditions

Phase 2K can start only after all of the following are true:

1. The owner provides the exact approval phrase: `I approve Phase 2K production Supabase migration execution for mk-stock-lab.`
2. The production Supabase target is confirmed.
3. Production data state is confirmed.
4. Backup exists or reset/rebuild risk is explicitly accepted.
5. Rollback owner and restore path are confirmed.
6. No disposable credentials are present in production.
7. No Vercel env var changes are bundled into the DB migration.
8. Migration path is confirmed: `supabase/migrations/20260615_rebuild_schema_v0_1.sql`.
9. Validation path is confirmed: `supabase/validation/validate_rebuild_schema_v0_1.sql`.
10. Patch handling rule is confirmed: do not apply the disposable patch to fresh production when using the fixed source migration.
11. Post-migration validation owner is confirmed.
12. Secret-safe reporting rules are confirmed.

## Phase 2K No-Go Conditions

Do not start Phase 2K if any of these are true:

- Approval phrase is partial or paraphrased.
- Project identity is unclear.
- Production data state is unknown.
- Real user data exists and no backup is available.
- Rollback path is unresolved.
- Expected SQL file differs from the reviewed file.
- Disposable patch is planned for fresh production without written justification.
- Vercel env updates are bundled into DB migration.
- Any secret appears in logs or screenshots intended for sharing.
- Owner does not approve a production test user but runtime validation requires one.

## Disposable Project Decision

Recommended decision:

- Keep the disposable project until this readiness review is accepted or production migration is completed and documented.
- Delete the disposable project after owner decision if no further validation is needed.
- Never connect disposable credentials to Vercel production or the production app.
- If accidental disposable credential use occurred, rotate or delete credentials and document the incident without secrets.

## Recommended Next Options

Option A: Collect owner confirmations and then request exact Phase 2K approval phrase.

Option B: Resolve backup/rollback and production data-state questions before any approval.

Option C: Defer production DB work and proceed with non-DB UI/product implementation using mock/static data only.

Recommended option: Option B. The review is ready for owner decision, but execution should not be requested until production data state, backup, and rollback ownership are resolved.

## References

- Supabase Row Level Security docs: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Database Functions docs: https://supabase.com/docs/guides/database/functions
- Supabase Database Backups docs: https://supabase.com/docs/guides/platform/backups
- Supabase Database Migrations docs: https://supabase.com/docs/guides/deployment/database-migrations
- Supabase Data API grants changelog: https://supabase.com/changelog

## Final Statement

Phase 2J.1 is review-only and authorizes no production action.
