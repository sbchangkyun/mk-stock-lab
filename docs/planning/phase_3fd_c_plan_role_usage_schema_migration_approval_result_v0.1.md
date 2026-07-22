# Phase 3FD-C-PLAN — Role Assignment and Usage Store Schema/Migration Approval Package Result

## 1. Status

Prepared as a documentation-only approval package. This phase makes no runtime source change,
route source change, UI change, SQL file, migration file, schema file, database connection,
Supabase client, environment-value read, package installation, dependency change, live KIS call,
deployment, or push.

## 2. Background

Phase 3FD-B implemented a disabled, real-compatible auth subject resolver using injected mocked
clients only. Real role-assignment and usage-store persistence remain missing and unapproved. This
phase prepares the owner approval package required before database artifacts may be drafted.

## 3. Implemented Scope

- Role assignment schema approval document.
- Usage store schema approval document.
- RLS, retention, and idempotency policy document.
- Migration execution approval checklist.
- This result document.
- Narrow static checker.
- Planning changelog entry.
- One package check script.

## 4. Role Assignment Plan Result

The package proposes the conceptual `chart_similarity_role_assignments` table, server-owned
`authenticated`/`beta`/`owner`/`admin` roles, lifecycle constraints, resolver and audit indexes,
a server/admin-only write model, and complete grant/revoke audit fields. Table naming, persisted
authenticated assignments, status values, uniqueness, RLS, audit, and migration creation remain
open owner decisions.

## 5. Usage Store Plan Result

The package proposes conceptual `chart_similarity_usage_counters` and
`chart_similarity_usage_events` tables, preserves the approved daily/monthly role limits, defines
counter and event constraints and indexes, requires idempotency-protected increments, and bounds
`metadata_safe`. Table names, scopes, periods, idempotency, metadata, update model, and migration
creation remain open owner decisions.

## 6. RLS Retention Idempotency Result

The proposed policy keeps role and usage writes server-only, requires separately approved minimal
reads, leaves exact retention periods open, requires retry-safe unique idempotency keys, forbids
sensitive identity/provider/market/account data, and requires rollback and backup decisions before
execution.

## 7. Migration Approval Result

Migration creation is not approved. Migration execution is not approved. A future phase requires
explicit owner approval of the schema design, RLS, retention, idempotency, rollback, backup, target
environment, and continued disabled route posture.

## 8. Boundary Preservation

- The API route is unchanged and retains exactly three dispatch branches.
- `/chart-ai` is unchanged.
- Server runtime source is unchanged.
- No SQL, migration, or schema file exists from this phase.
- No database connection or Supabase client was created.
- No environment value was read.
- No live KIS call was made.
- No dependency or lockfile changed.
- No deployment or push occurred.

## 9. Validation

- `npm run check:phase-3fd-c-plan-role-usage-schema-migration-approval` — passed (144/144).
- Phase 3FD-B checker/smoke — passed (128/128 and 111/111).
- Phase 3FD-B-ALT checker/smoke — passed (109/109 and 95/95).
- Phase 3FD-A checker — passed (109/109).
- Phase 3FC-J checker — passed (125/125).
- Phase 3FC-I checker/smoke — passed (122/122 and 110/110).
- Phase 3FC-H checker/smoke — passed (141/141 and 89/89).
- Phase 3FC-F checker/smoke — passed (97/97 and 98/98).
- Phase 3FC-E checker/smoke — passed (85/85 and 98/98).
- Phase 3FC-D checker/smoke — passed (81/81 and 79/79).
- Phase 3FC-C checker/smoke — passed (74/74 and 53/53).
- Phase 3FC-B checker — passed (94/94).
- Phase 3FC-A checker — passed (80/80).
- `npm run build` — passed.
- `git diff --check` — passed with only pre-existing working-copy LF-to-CRLF normalization
  warnings for `planning_changelog.md` and `package.json`.
- Forbidden-path diff from `45764db` — empty.
- Phase 3FC-G was intentionally not run because its pre-3FC-H branch-count contract is superseded.
- No stale historical checker failure occurred.

## 10. Recommended Next Phase

Recommended: **Phase 3FD-C — Role Assignment and Usage Store Migration Draft, Not Executed**.

Alternative: **Phase 3FD-B-HF1 — Real Supabase Client Factory Approval Package, No Runtime
Change**.

Hold alternative: **Phase 3FC-K — Owner Manual QA Findings Incorporation, No Runtime Change**.
