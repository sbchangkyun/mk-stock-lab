# Phase 3FB-F — Chart AI Owner-local Auth/Usage Bridge Manual QA and Productization Boundary Review

## 1. Status

Prepared. This phase creates an owner-executable manual QA checklist and a productization boundary
review for the `/chart-ai` owner-local auth/usage bridge path built in Phase 3FB-C-ALT (route) and
Phase 3FB-E (UI wiring). No runtime source was changed. Live KIS remains off. No deploy, no push.

## 2. Current Implementation Summary

- `/chart-ai` default public behavior: sample chart, search, similarity/MK AI tabs, existing
  disclaimers — unchanged by any 3FB-A through 3FB-F phase.
- `/chart-ai?ownerLocalMocked=1` (Phase 3FB-C, hardened in 3FB-D): local-only panel that calls the
  owner-local-mocked branch of `/api/chart-ai/similarity` with one button, a hardened runtime
  (response shape guard, 8s timeout, in-flight flag, retry-ready state).
- `/chart-ai?ownerLocalAuthUsageBridge=1` (Phase 3FB-E): local-only panel, independently gated,
  with four scenario buttons (allowed owner, anonymous blocked, usage-limited, invalid usage) that
  call the owner-local-auth-usage-bridge branch of the same route, with the same class of runtime
  hardening.
- `POST /api/chart-ai/similarity` (`src/pages/api/chart-ai/similarity.ts`) has three mutually
  exclusive paths by request `mode`: default `feature_disabled` shell (503), `owner-local-mocked`
  (Phase 3FB-B), and `owner-local-auth-usage-bridge` (Phase 3FB-C-ALT). The auth/usage bridge path
  evaluates the existing `evaluateSimilarityExecutionGuard` against caller-supplied mock
  `mockAuth`/`mockUsage` state before allowing the Phase 3FB-A mocked provider-compatible
  integration to run; execution only happens if the guard returns `allowed`.
- Guard-before-execution: the bridge's policy fixes `allowLiveKis: false`,
  `allowPublicExecution: false`, `allowRealAuthProvider: false`, `allowUsagePersistence: false`,
  `allowRawProviderPayload: false`, `allowCredentialEcho: false`, `allowEnvEcho: false`,
  `allowAccountTradingFields: false` at the type level, not just as a runtime default.
- Live KIS remains disabled and externally unreachable (a separate, previously-identified network
  condition, unrelated to this phase).
- No real auth provider and no real usage storage runtime exist anywhere in this codebase yet;
  every auth/usage value exercised so far is caller-supplied mock data only.

## 3. What This Phase Does

- Creates an owner-executable manual QA checklist
  ([phase_3fb_f_manual_qa_checklist_v0.1.md](phase_3fb_f_manual_qa_checklist_v0.1.md)) covering
  default UI, panel visibility, all four scenarios, duplicate-click/loading behavior,
  timeout/network-failure behavior, cross-panel isolation, and an optional production boundary
  check.
- Defines explicit pass/fail criteria and a final QA decision model (PASS / PASS WITH NOTES /
  BLOCKED / NOT TESTED).
- Defines the productization boundary: what is true today, what must become true before any
  public/beta exposure, and who must decide it.
- Defines go/no-go criteria for internal local review versus public/beta exposure.
- Adds a narrow static checker
  (`scripts/check_phase_3fb_f_manual_qa_productization_boundary_contract.mjs`) confirming both new
  documents exist with their required sections and that no unexpected runtime source drift
  occurred in this phase.

## 4. What This Phase Does Not Do

- Does not implement a real auth provider.
- Does not implement real usage persistence (DB, cache, or otherwise).
- Does not enable public route success.
- Does not enable beta exposure.
- Does not call live KIS or attempt to resolve live KIS network reachability.
- Does not call any account/trading/order/balance API.
- Does not deploy.
- Does not push.
- Does not add a new route branch, new UI panel, or any new runtime capability.

## 5. Productization Boundary Matrix

| Area | Current Status | Required Before Public/Beta | Blocker Severity | Owner Decision Required |
|---|---|---|---|---|
| Authentication | Caller-supplied mock only; no real provider | Real auth provider or app-native auth strategy selected and implemented | Blocking | Yes |
| Usage limit storage | Caller-supplied mock only; no persistence | Real usage store (DB/cache) with per-user/window tracking | Blocking | Yes |
| Route feature flag | Route defaults to `feature_disabled`; owner-local branches require explicit request body | Explicit, reviewed decision to flip a public/beta feature flag | Blocking | Yes |
| KIS data source | Mocked, provider-compatible fixtures only; live KIS externally unreachable | Live KIS connectivity resolved and verified end-to-end | Blocking | Yes (network side is external) |
| Response redaction | Sanitized/bucketed fields only, verified by static checkers and smokes | Re-verify redaction against any new/real data source before go-live | Blocking | Yes |
| UI disclosure | Korean copy states local/mock/no-persistence/not-investment-advice | Confirm disclosure copy for any public-facing surface | Non-blocking (copy review) | Yes |
| Legal/investment disclaimer | Present on existing panels ("not investment advice") | Legal review of final public-facing disclaimer copy | Blocking | Yes |
| Abuse prevention | None (owner-local only, not public) | Rate limiting / abuse policy before any public exposure | Blocking | Yes |
| Logging/observability | None added by this bridge | Decide what (if anything) should be logged for a real auth/usage runtime | Blocking | Yes |
| QA coverage | Static checkers + smokes (source-level); manual browser QA pending owner execution | Owner-executed manual QA (this phase's checklist) plus QA for any real auth/usage runtime | Blocking until owner runs checklist | Yes |
| Deployment approval | Not deployed | Explicit owner approval to deploy, separate from this phase | Blocking | Yes |

## 6. Go/No-Go Criteria

**GO for internal local review:**
- Local hostname + query opt-in gate confirmed for both owner-local panels.
- All four auth/usage bridge scenarios render safely (per the manual QA checklist).
- No raw values (credentials, env, tokens, session/user id, IP, account/trading/balance, OHLC,
  volume, timestamps, raw matches, similarity scores, forward returns) appear in any response or
  render.
- No public exposure: both panels remain hidden without the local hostname + query opt-in
  combination.
- Route defaults to `feature_disabled` for any request that isn't one of the two explicit
  owner-local shapes.

**NO-GO for public/beta exposure:**
- No real auth provider is implemented yet.
- No real usage persistence is implemented yet.
- Live KIS reachability is unresolved.
- No public/beta feature-flag decision has been made or reviewed.
- No legal/disclaimer review has been completed for public-facing copy.
- No abuse-prevention/rate-limit policy has been defined.

## 7. Known Non-Blocking Issues

- A prior-phase (`check:phase-3fb-c-alt-auth-usage-runtime-bridge-for-similarity-route`) static
  checker assertion states that `src/pages/chart-ai.astro` must not reference the auth/usage
  bridge. That assertion enforced Phase 3FB-C-ALT's own route-only scope at the time it was
  written. Phase 3FB-E's explicit, approved mandate was to add exactly that reference, so this
  single assertion is expected to fail and is not a defect introduced by Phase 3FB-E or 3FB-F. The
  checker script itself is out of scope to modify in both phases.
- KIS live network reachability remains an external, unresolved condition outside this
  repository's control (tracked separately from the 3FB chart-similarity work).
- Manual browser QA (Sections 3–12 of the checklist) still requires the owner to actually execute
  it; this review package documents what to check but cannot substitute for the owner running it.

## 8. Required Owner Decisions Before Next Product Phase

- Choose a real auth provider or an app-native auth strategy.
- Choose a usage-persistence backend (DB, cache, or other).
- Define role tiers (e.g. anonymous/authenticated/beta/owner/admin) and their usage limits.
- Decide whether beta users may access mocked-only analysis before real auth/usage exists, or
  whether that must wait for the real runtime.
- Decide final public-facing disclosure/disclaimer language.
- Decide whether to keep the owner-local verification panels in the codebase (hidden, gated) or
  remove them before any public deployment.
- Decide the live KIS connectivity track separately from this auth/usage work.

## 9. Recommended Next Phase

Phase 3FC-A — Real Auth Provider Selection and Usage Storage Approval, No Live KIS.

Alternative: Phase 3FB-G — Owner Manual QA Findings Incorporation, Live KIS Off (to be run only
after the owner has executed the Phase 3FB-F manual QA checklist and reports findings).
