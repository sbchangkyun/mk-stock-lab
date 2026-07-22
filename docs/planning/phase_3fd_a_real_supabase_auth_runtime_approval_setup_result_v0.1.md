# Phase 3FD-A — Real Supabase Auth Runtime Approval and Setup Package Result

## 1. Status

Prepared. This is a documentation-only phase. No runtime source file was changed, no route source
file was changed, no UI file was changed, no package was installed, no dependency was changed, no
real Supabase client was created, no real database was implemented, and no live KIS call was made.
No deploy or push occurred.

## 2. Background

Phase 3FC-J completed the guarded route manual QA checklist and productization boundary review.
This phase prepares the owner approval package needed before any real Supabase Auth subject
resolver implementation phase can begin. Implementation itself is not performed in this phase.

## 3. Implemented Scope

- `docs/planning/phase_3fd_a_real_supabase_auth_runtime_approval_package_v0.1.md` — main approval
  package.
- `docs/planning/phase_3fd_a_supabase_dependency_and_env_key_plan_v0.1.md` — dependency and
  environment key plan.
- `docs/planning/phase_3fd_a_supabase_auth_runtime_implementation_plan_v0.1.md` — future runtime
  implementation plan.
- `docs/planning/phase_3fd_a_auth_redaction_and_subject_mapping_policy_v0.1.md` — redaction and
  subject mapping policy.
- `docs/planning/phase_3fd_a_owner_approval_form_v0.1.md` — owner approval form.
- This result doc.
- `scripts/check_phase_3fd_a_real_supabase_auth_runtime_approval_setup_contract.mjs` — static
  contract checker.
- A changelog entry and one new `package.json` script line.

## 4. Approval Package Result

The approval package lists the required owner approvals (Supabase Auth as provider, use of the
existing dependency or a future additional package, candidate env key names only, session
resolution design, redaction policy, subject mapping policy, feature-flag dependency rules) and the
explicit non-approvals (no package install, no env values, no Supabase client creation, no route
integration change, no route success, no DB schema/migration, no usage/role persistence, no
beta/public activation, no live KIS). The owner decision summary offers four options: approve
proceeding to Phase 3FD-B, do not approve yet, require design changes, or hold.

## 5. Dependency and Env Key Result

`@supabase/supabase-js` (currently `^2.101.1`) is already present in `package.json`, prior to this
phase, and is already used by unrelated, pre-existing features elsewhere in the repository. No
dependency was changed in this phase. Its existing presence does not itself approve real Supabase
Auth runtime usage for the Chart Similarity feature. Candidate environment variable key names
(`PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`AUTH_RUNTIME_ENABLED`, `USAGE_STORAGE_ENABLED`, `CHART_AI_SIMILARITY_BETA_ENABLED`) were proposed by
name only; no value was read, inferred, requested, or printed anywhere in this phase.

## 6. Runtime Implementation Plan Result

The future module would extend the existing Phase 3FC-C subject resolver contract, disabled by
default behind `AUTH_RUNTIME_ENABLED`. The proposed flow, subject mapping rules, and a seven-case
failure-mode table were documented, along with a validation plan for the future phase. Phase 3FD-B
(Real Supabase Auth Subject Resolver Implementation, Disabled by Default) is the recommendation;
Phase 3FD-B-ALT (Supabase Auth Runtime Mocked Adapter First, No Real Supabase Call) is the
alternative.

## 7. Redaction Policy Result

Forbidden outputs (tokens, raw session, raw user id, email, provider metadata, cookie/header values,
env/secret values), allowed safe outputs (auth state bucket, role seed, internal subject reference,
provider kind, redacted error category, safe warnings), subject reference design rules, and error
redaction rules were documented, along with the test requirements a future implementation phase must
satisfy.

## 8. Boundary Preservation

- The Chart Similarity API route is unchanged; it still recognizes all three dispatch branches.
- `/chart-ai` is unchanged.
- Every `src/lib/server/chartSimilarity/*.ts` scaffold file is unchanged.
- No Supabase runtime code was added to any Chart Similarity source file.
- No environment variable value was read.
- No database, SQL, or migration file was created.
- No live KIS call was made.
- No dependency or lockfile was changed.
- No push or deploy occurred.

## 9. Validation

- `npm run check:phase-3fd-a-real-supabase-auth-runtime-approval-setup` — passed.
- Prior regressions (Phase 3FC-J through Phase 3FB-A) — passed, excluding the intentionally
  superseded Phase 3FC-G route-branch-count assertion and the pre-existing stale Phase 3FB-C-ALT
  `chart-ai.astro` assertion (superseded by Phase 3FB-E's intentional UI wiring, unrelated to this
  phase's changes).
- `npm run build` — passed.
- `git diff --check` — clean.

## 10. Recommended Next Phase

Primary: Phase 3FD-B — Real Supabase Auth Subject Resolver Implementation, Disabled by Default.

Alternative: Phase 3FD-B-ALT — Supabase Auth Runtime Mocked Adapter First, No Real Supabase Call.

Hold alternative: Phase 3FC-K — Owner Manual QA Findings Incorporation, No Runtime Change.
