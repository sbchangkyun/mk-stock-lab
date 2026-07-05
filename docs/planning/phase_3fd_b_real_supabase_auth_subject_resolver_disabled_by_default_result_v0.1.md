# Phase 3FD-B — Real Supabase Auth Subject Resolver Implementation, Disabled by Default Result

## 1. Status

Implemented. Added a server-only, real-compatible Supabase Auth subject resolver boundary that
remains disabled by default and is tested only through deterministic injected mocked clients. No
real Supabase client was created and no real Supabase call was made. No route source file was
changed. No UI source file was changed. No package was installed and no dependency was changed. No
live KIS call was made and no deploy or push occurred.

## 2. Background

Phase 3FD-A prepared the owner approval/setup package for a future real Supabase Auth runtime, and
Phase 3FD-B-ALT validated a mocked adapter contract and redaction behavior using a fully
self-contained mocked session object before real runtime work. This phase implements the
real-compatible subject resolver boundary using an injected `SimilaritySupabaseCompatibleAuthClient`
dependency instead, without connecting it to route execution.

## 3. Implemented Scope

- `similarityRealSupabaseAuthSubjectResolverTypes.ts` — real-compatible type contract (policy,
  injected client interface, resolver input/result, subject seed shape).
- `similarityRealSupabaseAuthSubjectResolver.ts` — disabled-by-default resolver module (policy
  builders, input normalizer, `resolveSimilarityRealSupabaseAuthSubject`, mapping function, safety
  assertion).
- `mockedSimilarityRealSupabaseAuthSubjectResolverFixtures.ts` — 8 deterministic input fixtures and
  8 deterministic mocked injected-client builders.
- `index.ts` export wiring for the above.
- A smoke script and a static checker.
- Two planning docs and a changelog entry.
- Two `package.json` script lines.

## 4. Resolver Contract Result

- Default policy: `enabled: false`, `allowInjectedSupabaseCompatibleClient: false`; resolves to
  `disabled`/anonymous regardless of any injected client.
- Injected-mock policy: only `enabled` and `allowInjectedSupabaseCompatibleClient` are `true`; every
  other real-capability flag remains `false`.
- Client unavailable: enabled policy with no `deps.authClient` supplied resolves to
  `client_unavailable`/anonymous.
- Missing/invalid/expired/malformed session: each resolves to the matching resolver status and an
  anonymous subject.
- Client error: resolves to `error`/anonymous, with `safeMessage` including only the safe error
  category, never a raw error object.
- Valid email/OAuth provider user: resolves to `resolved`/authenticated with a safe synthetic
  `subjectRef` (`real-supabase-auth-subject:<userRef>`), never the bare injected-client `userRef`.
- Client-claimed role: always ignored, never trusted, and always produces a
  `client_role_claim_ignored` warning without escalating `roleSeed`.
- Subject mapping: maps only to `anonymous | authenticated`, never `beta`/`owner`/`admin`.
- Safety assertion: checks only primitive values (never key names) against a forbidden-substrings
  list plus a structural email-address-shape pattern; never a bare "email" substring check.

## 5. Smoke Result

`npm run smoke:phase-3fd-b-real-supabase-auth-subject-resolver-disabled-by-default` — 111/111
assertions passed.

## 6. Boundary Preservation

The route file (`src/pages/api/chart-ai/similarity.ts`) still has exactly three dispatch branches
(owner-local-mocked, owner-local-auth-usage-bridge, guarded-runtime-scaffold), unchanged.
`/chart-ai` still contains the owner-local auth/usage bridge panel identifier, unchanged. Neither
file imports `@supabase/supabase-js`. The pre-existing Phase 3FC-C auth subject resolver files, the
Phase 3FD-A approval/setup docs, and the Phase 3FD-B-ALT mocked adapter files all remain present and
unmodified in kind. No route handler is defined in any of the new files.

## 7. Validation

- New checker: `npm run check:phase-3fd-b-real-supabase-auth-subject-resolver-disabled-by-default`
  — passed.
- New smoke: 111/111 assertions passed.
- Full regression suite (3FD-B-ALT checker+smoke, 3FD-A checker, 3FC-J through 3FC-A checkers/smokes
  excluding the intentionally-superseded 3FC-G checker, 3FB-F through 3FB-A checkers/smokes) —
  passed.
- `npm run build` — passed.
- `git diff --check` — clean.
- Forbidden-path diff against the starting commit — empty.
- Runtime-source diff (route/UI/providers/data fixtures) — empty.
- Changed-files diff — exactly the 10 allowed files for this phase.
- Known non-gating issue: the Phase 3FB-C-ALT static checker retains one permanently-stale
  assertion about `src/pages/chart-ai.astro`, intentionally superseded by Phase 3FB-E's UI wiring;
  its smoke script (not the checker) is the one included in the standard regression suite.

## 8. Implementation Implication

Chart Similarity now has a real-compatible Supabase Auth subject resolver boundary, proven against
an injected client interface, ready to be backed by a real Supabase-compatible implementation in a
later, separately approved phase — without any change to route behavior, UI behavior, or the
feature's disabled-by-default posture today.

## 9. Recommended Next Phase

Recommended: Phase 3FD-C-PLAN — Role Assignment and Usage Store Schema/Migration Approval Package,
No Runtime Change. Alternative: Phase 3FD-B-HF1 — Real Supabase Client Factory Approval Package, No
Runtime Change. Hold alternative: Phase 3FC-K — Owner Manual QA Findings Incorporation, No Runtime
Change.
