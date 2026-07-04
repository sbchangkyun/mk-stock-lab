# Phase 3EZ-A — Real Auth Integration Design for Similarity Execution Result

## 1. Status

Prepared/Implemented — real-auth integration design foundation added, no real auth runtime or API
route.

## 2. Background

- Phase 3EX-E completed the `/chart-ai` owner-review UI polish, moving the similarity and MK AI
  content into a shared tabbed chart-lower analysis workspace.
- Phase 3EY-C added the server-only auth/usage execution guard foundation
  (`similarityExecutionGuard.ts`), disabled by default and not wired to any route.
- Phase 3EY-D added the sanitized mocked API response contract
  (`similarityApiResponseBuilder.ts`).
- This phase defines the provider-agnostic mapping from a future real auth subject to the
  existing `SimilarityExecutionGuardRequest` shape.

## 3. Implemented Scope

- Added `src/lib/server/chartSimilarity/similarityAuthIntegrationDesignTypes.ts` defining
  `SimilarityAuthProviderKind`, `SimilarityAuthIntegrationStatus`, `SimilarityAuthSubjectKind`,
  `SimilarityAuthSubject`, `SimilarityAuthRoleMappingPolicy`, and
  `SimilarityAuthIntegrationDesignResult`. No token, email, IP, raw auth provider payload, cookie,
  or header field is present in any of these types.
- Added `src/lib/server/chartSimilarity/similarityAuthIntegrationDesign.ts` with:
  - `buildDefaultSimilarityAuthRoleMappingPolicy` — a pure, provider-agnostic default policy
    (`providerKind: 'none'`, beta/owner/admin role sources `'not_configured'`,
    `allowAnonymousMockedPreview: true`, `allowPublicKisExecution: false`).
  - Mocked subject builders: `buildAnonymousSimilarityAuthSubject`,
    `buildMockedAuthenticatedSimilarityAuthSubject`, `buildMockedBetaSimilarityAuthSubject`,
    `buildMockedOwnerSimilarityAuthSubject`, `buildMockedAdminSimilarityAuthSubject`, using only
    the fake ids `mock-auth-subject`, `mock-beta-subject`, `mock-owner-subject`, and
    `mock-admin-subject` (the anonymous subject's `stableSubjectId` is `null`).
  - Pure mapping functions `mapAuthSubjectToGuardRole` and `mapAuthSubjectToGuardAuthState`.
  - `buildSimilarityAuthIntegrationDesignResult`, which wraps a subject and provider kind into a
    `SimilarityAuthIntegrationDesignResult`.
  - `buildGuardRequestFromAuthDesign`, which accepts a design result or a raw subject plus
    `source`/`symbol`/`market`/`assetType` and returns a `SimilarityExecutionGuardRequest`
    (Phase 3EY-C), placing `stableSubjectId` into `userId` only for internal guard evaluation.
- Updated `src/lib/server/chartSimilarity/index.ts` to export the new types, policy builder,
  subject builders, mapping functions, and guard request builder. No import of this module was
  added to any page or API route.
- Added `docs/planning/phase_3ez_a_real_auth_integration_design_for_similarity_execution_v0.1.md`
  (planning) and this result document.
- Added
  `scripts/check_phase_3ez_a_real_auth_integration_design_for_similarity_execution_contract.mjs`
  and a matching `package.json` script entry.
- Prepended a Phase 3EZ-A entry to `docs/planning/planning_changelog.md`.

## 4. Auth Mapping Results

- Anonymous → guard role `anonymous`, guard auth state `missing`.
- Authenticated (`user`) → guard role `authenticated`, guard auth state `authenticated`.
- Beta (`beta_user`) → guard role `beta`, guard auth state `authenticated`.
- Owner → guard role `owner`, guard auth state `owner`.
- Admin → guard role `admin`, guard auth state `admin`.
- **Safe internal `userId` policy**: `buildGuardRequestFromAuthDesign` places a subject's
  `stableSubjectId` into the guard request's `userId` field only for internal guard evaluation
  (e.g., usage lookups in a future phase). This value is never itself returned to a caller.
- **API response leakage prevention**: `SimilarityApiResponse` (Phase 3EY-D,
  `toSimilarityApiSafeRequest`) already omits `userId`, `role`, and `authState` from its
  API-facing `request` field; this phase adds no path that changes that sanitization boundary.

## 5. Preserved Boundaries

- No real auth runtime was added.
- No Supabase auth import was added.
- No external auth provider (Auth0/OAuth/NextAuth) import was added.
- No cookies or request headers were read.
- No API route was added or modified.
- No usage storage was implemented.
- No KIS call was made.
- No `/chart-ai` UI file was changed.
- No DB/cache runtime was added.
- No SQL/migration was run.
- No external AI API was called.
- No public KIS data, `source=live`, or `source=auto` literal was introduced.
- No account/trading/order/balance API was referenced.
- No Vercel env change was made.
- No deployment was performed.
- No push was performed.
- No dependency or devDependency was added.
- No actual market value was used; all fixture data remains synthetic/mocked.
- No `.env` or `process.env` was read.

## 6. Validation

The full required validation suite (the new Phase 3EZ-A static checker, the established Phase
3EX-E / 3EY-D / 3EY-C / 3EX-C / 3EW-C / 3EW-B / 3EW-A / 3EV-B / 3EV-A checkers/smokes,
`check:provider-boundaries`, `check:kis-runtime-guard`, `check:kis-error-fallback`,
`check:production-domain`, `npm run build`, and `git diff --check`) was run in the specified
order. See the final phase report for the itemized pass/fail list of every command. The two
historical checks with pre-existing allowed-changed-path assertions that predate this phase
(`check:phase-3ey-d`, `check:phase-3ey-c`) remain the only expected non-gating exceptions.

## 7. Roadmap

- **3EZ-B** — Usage Storage Design and Approval
- **3EZ-C** — Authenticated Similarity API Route Shell with Feature Flag Off
- **3FA-A** — Owner-local KIS-normalized Similarity Execution Plan
- **3FA-B** — Owner-local KIS Similarity Smoke
- **3FB-A** — Limited Beta Readiness Review

## 8. Recommended Next Phase

- **Recommended**: Phase 3EZ-B — Usage Storage Design and Approval.
- **Alternative**: Phase 3EX-E-OWNER-RUNTIME-CHECK — Owner Runtime Check of Polished Chart
  Analysis Workspace.
