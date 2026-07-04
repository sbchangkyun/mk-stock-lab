# Phase 3EZ-B — Usage Storage Design and Approval Result

## 1. Status

Prepared/Implemented — usage storage design foundation added, no storage runtime or SQL.

## 2. Background

- Phase 3EZ-A defined auth subject-to-guard mapping (`similarityAuthIntegrationDesign.ts`),
  including safe auth subject types and mocked subject builders, decoupled from any real auth
  provider.
- This phase defines usage storage design and approval requirements before any route/storage
  implementation — the future usage model for Chart Similarity execution.

## 3. Implemented Scope

- Added `src/lib/server/chartSimilarity/similarityUsageStorageDesignTypes.ts` defining
  `SimilarityUsageStorageBackendKind`, `SimilarityUsageStorageStatus`, `SimilarityUsageWindowKind`,
  `SimilarityUsageChargeTiming`, `SimilarityUsageChargeOutcome`,
  `SimilarityUsageExecutionOutcome`, `SimilarityUsageStorageKey`, `SimilarityUsageStoragePolicy`,
  `SimilarityUsageChargeDecision`, and `SimilarityUsageStorageDesignResult`. No email, raw user id
  as public output, token, IP address, raw auth provider payload, cookie, header, DB connection
  string, or SQL string is present in any of these types.
- Added `src/lib/server/chartSimilarity/similarityUsageStorageDesign.ts` with:
  - `buildDefaultSimilarityUsageStoragePolicy` — a pure, storage-agnostic default policy
    (`backendKind: 'none'`, `enabled: false`, `subjectKeyStrategy: 'not_configured'`,
    `chargeTiming: 'after_success'`, role limits `3/10/50/100` daily, `monthlyLimitMultiplier: 20`,
    `allowPublicKisExecution: false`).
  - `buildUsageWindowStartIso` — a deterministic UTC window-start builder using only string
    slicing on the caller-supplied ISO timestamp; it never calls `Date.now()` and never reads the
    current runtime date.
  - `buildSimilarityUsageStorageKey` — builds a `SimilarityUsageStorageKey` from a caller-supplied
    `subjectKey`; returns `null` when no subject key is supplied.
  - `getUsageLimitForGuardRole` — a pure role-to-limit lookup supporting daily and monthly
    windows (monthly = daily × `monthlyLimitMultiplier`).
  - `decideSimilarityUsageCharge` — a pure charge-decision helper implementing the required charge
    policy (Section 4 below), gated so that a disabled policy always returns
    `shouldWriteUsage: false` and `shouldIncrementUsage: false`.
  - `buildSimilarityUsageStorageDesignResult` — combines a policy, an optional key, and a charge
    decision into a full design result.
- Added `src/lib/server/chartSimilarity/mockedSimilarityUsageStorageDesignFixtures.ts` with
  deterministic fixtures reusing the Phase 3EZ-A fake subject ids (`mock-auth-subject`,
  `mock-beta-subject`, `mock-owner-subject`).
- Updated `src/lib/server/chartSimilarity/index.ts` to export the new types, policy/key/limit/
  charge/design helpers, and mocked fixtures. No import of this module was added to any page or
  API route.
- Added
  `docs/planning/phase_3ez_b_usage_storage_design_and_approval_v0.1.md` (planning) and this result
  document.
- Added `scripts/check_phase_3ez_b_usage_storage_design_and_approval_contract.mjs` and a matching
  `package.json` script entry.
- Prepended a Phase 3EZ-B entry to `docs/planning/planning_changelog.md`.

## 4. Usage Design Results

- Backend default: `none`. Enabled by default: `false`.
- Subject key strategy: `not_configured` (recommended future strategy: `stable_subject_id_hash`
  once a real auth provider is selected).
- Daily/monthly window model: UTC-aligned; daily windows start at `T00:00:00.000Z`, monthly
  windows start on the 1st of the month at `T00:00:00.000Z`; monthly limit = daily limit ×
  `monthlyLimitMultiplier` (default `20`).
- Role limits (daily): authenticated/default `3`, beta `10`, owner `50`, admin `100`.
- Charge timing: `after_success` by default.
- Success charge: `success` → `charge`, with `shouldReadUsage`/`shouldWriteUsage`/
  `shouldIncrementUsage` all `true` only when the policy is enabled.
- Failure charge policy: `guard_blocked`, `auth_required`, `usage_limited`, `feature_disabled`,
  `provider_disabled`, `validation_error`, `provider_error`, and `internal_error` all resolve to
  `do_not_charge`.
- Storage approval gates: `requireOwnerApprovalBeforeStorage`, `requireSqlApprovalBeforeDatabase`,
  and `requireCacheApprovalBeforeRuntime` are all fixed `true` in the policy type, and the default
  policy is `enabled: false`, so `decideSimilarityUsageCharge` always returns
  `shouldWriteUsage: false` and `shouldIncrementUsage: false` in this phase regardless of outcome.

## 5. Approval Requirements

- Owner approval of this design is required before any real storage runtime is implemented.
- SQL/migration approval is required before a database-backed store is implemented.
- Cache runtime approval is required before a cache-backed store is implemented.
- A privacy review of the `subjectKey` strategy is required before any real subject identifier is
  persisted.
- Explicit API route approval is required before any route may read or write usage.

## 6. Preserved Boundaries

- No usage storage implementation was added.
- No DB/cache runtime was added.
- No SQL file or migration was added or run.
- No Supabase, Redis, Turso, Prisma, or Drizzle import was added.
- No API route was added or modified.
- No real auth runtime was added.
- No KIS call was made.
- No `/chart-ai` UI file was changed.
- No external AI API was called.
- No public KIS data, `source=live`, or `source=auto` literal was introduced.
- No account/trading/order/balance API was referenced.
- No Vercel env change was made.
- No deployment was performed.
- No push was performed.
- No dependency or devDependency was added.
- No actual market value was used; all fixture data remains synthetic/mocked.
- No `.env` or `process.env` was read.

## 7. Validation

The full required validation suite (the new Phase 3EZ-B static checker, the established Phase
3EZ-A / 3EX-E / 3EY-D / 3EY-C / 3EX-C / 3EW-C / 3EW-B / 3EW-A / 3EV-B / 3EV-A checkers/smokes,
`check:provider-boundaries`, `check:kis-runtime-guard`, `check:kis-error-fallback`,
`check:production-domain`, `npm run build`, and `git diff --check`) was run in the specified
order. See the final phase report for the itemized pass/fail list of every command. The
historical checks with pre-existing allowed-changed-path assertions that predate this phase
(`check:phase-3ey-d`, `check:phase-3ey-c`, `check:phase-3ex-e`) remain the only expected
non-gating exceptions, consistent with the pattern already documented in Phase 3EZ-A.

## 8. Roadmap

- **3EZ-C** — Authenticated Similarity API Route Shell with Feature Flag Off
- **3FA-A** — Owner-local KIS-normalized Similarity Execution Plan
- **3FA-B** — Owner-local KIS Similarity Smoke
- **3FB-A** — Limited Beta Readiness Review

## 9. Recommended Next Phase

- **Recommended**: Phase 3EZ-C — Authenticated Similarity API Route Shell with Feature Flag Off.
- **Alternative**: Phase 3EX-E-OWNER-RUNTIME-CHECK — Owner Runtime Check of Polished Chart
  Analysis Workspace.
