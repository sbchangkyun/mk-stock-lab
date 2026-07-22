# Phase 3GG-A-PLAN — Live KIS / LLM Approval & Runtime Binding Plan, No Activation — v0.1

## 1. Status

Status: Prepared. Planning-only. No Activation.

This document plans an approval structure and staged runtime-binding path. It implements nothing, activates nothing, and calls no live or external service.

## 2. Purpose

Define a goal-first, planning-only approval and runtime-binding plan for progressing Chart AI from the current owner-local static shell / deterministic fixture state toward guarded runtime binding, live KIS approval, and LLM approval. This phase captures the entire approval structure in one planning-only document rather than spreading it across several nonessential intermediate phases, per the user's explicit goal-first direction (Section 5).

This phase does not implement runtime binding, does not activate live KIS, does not activate LLM, does not create or activate any API route, does not modify `src/pages/chart-ai.astro`, and does not modify any scaffold/source/provider module. Planning/documentation/checker only.

## 3. Baseline

- Baseline: `6fda354ced5281e08ccbcbea1aa9b76894304874`.
- Latest completed phase before this phase: Phase 3FG-D-HF1.
- Branch: `rebuild/phase-1-ia-shell`.

## 4. Current verified foundation

- **Phase 3FG-A** created the guarded productization scaffold (`src/lib/server/chart-ai/guarded-productization-scaffold.mjs`). 15 real-productization boolean gates (`ownerLocalEnabled`, `internalQaEnabled`, `betaEnabled`, `publicEnabled`, `liveKisEnabled`, `llmEnabled`, `mkAiRouteEnabled`, `realAuthEnabled`, `supabaseEnabled`, `dbEnabled`, `usageDeductionEnabled`, `paidEntitlementEnabled`, `adUnlockEnabled`, `deployEnabled`, `pushEnabled`) all default to `false`. Exactly one reachable `allowed: true` path exists: owner-local audience, `synthetic_fixture` or `kis_ohlc_fixture` provider mode, `deterministic_fixture` agent mode, `ownerLocalEnabled: true`, all other 14 flags `false`, and explicit `scaffoldOnlyAcknowledged: true`.
- **Phase 3FG-B** performed owner-local, command-line-only QA of the scaffold: 13/13 cases passed, confirming fail-closed behavior on every non-scaffold-only combination and confirming (via source boundary check) that the scaffold source contains no `fetch(`, `process.env`, `createClient(`, cookie/header parsing, JWT parsing, `Math.random(`, `Date.now(`, or LLM-SDK instantiation.
- **Phase 3FG-C** produced a UI readiness plan (state mapping table, data/payload minimization policy, Korean copy guidance) with no runtime wiring.
- **Phase 3FG-D** added a hidden-by-default static UI shell to `/chart-ai` (8 static decision-state cards mirroring the Phase 3FG-C plan), static content only — no scaffold import, no scaffold execution, no API route call.
- **Phase 3FG-E** performed owner-local Browser QA of the static shell: 11 of 12 cases passed; Case 1 found a CSS cascade-origin defect causing the shell to render visibly on default `/chart-ai` despite the `hidden` attribute being correctly set.
- **Phase 3FG-D-HF1** fixed the Case 1 defect with a single higher-specificity `#chartAiOwnerLocalGuardedProductizationStaticShell[hidden] { display: none; }` rule. All 12 Browser QA cases now pass; the shell is confirmed hidden by default and correctly visible only via owner-local opt-in.
- **Note**: the pre-existing Similar Pattern (SP) and MK Agent (MK) owner-local deterministic-fixture agent panel (`chartAiOwnerLocalDeterministicAgentsPanel`, delivered across the earlier 3FF-A phase family) is a separate, already-existing feature, distinct from the newer Guarded Productization Scaffold static shell. Phase 3FG-E Case 3 confirmed both coexist on `/chart-ai` without layout collision or behavioral interference.

## 5. Goal-first shortened path

The owner has explicitly directed a goal-first shortened path: reach live KIS / LLM approval planning sooner, and stop spending phases on nonessential handoff/freeze work. This phase (3GG-A-PLAN) is the direct continuation of that shortened path — it consolidates the full approval and runtime-binding structure into a single planning-only document instead of spreading it across multiple planning-only phases.

Under this strategy, **Phase 3FG-F (Guarded Productization Current State Handoff Package, No Runtime Change)** — previously named as the "next recommended phase" in the Phase 3FG-D-HF1 result document — is explicitly **postponed**. Phase 3FG-F does not move the project closer to a live KIS / LLM approval decision; it remains available later only if a context-continuity handoff package becomes operationally necessary (e.g. a long session gap or a team handoff), not as a required gate on this path. The next recommended phase is **Phase 3GG-B** (Section 18), not Phase 3FG-F.

## 6. Productization lanes

| Lane | Audience | Data source | Agent mode | Route exposure | Approval requirement | Risk | Min validation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A | owner-local | `synthetic_fixture` / `kis_ohlc_fixture` | `deterministic_fixture` | none (no API route) | none — already owner-approved (3FG-A/3FG-B) | none (fixture-only) | existing `check:phase-3fg-*` chain |
| B | owner-local | `kis_ohlc_fixture` (real OHLC-shaped fixture, still not live) | `deterministic_fixture` | internal only, feature-flagged off | none beyond existing scaffold approval | low | scaffold CLI QA + smoke |
| C | owner-local | `live_kis` | `deterministic_fixture` | internal only, owner-local guard | Live KIS approval (Section 7) | medium (external API, cost, rate limit, credential handling) | Section 7 gates + new smoke script, live guard off by default |
| D | owner-local | any allowed provider | `llm` | internal only | LLM approval (Section 8) | medium-high (cost, hallucination, safety-copy compliance, prompt injection) | Section 8 gates + LLM output safety-copy conformance checker |
| E | internal-qa / beta | live KIS and/or LLM as separately approved | `deterministic_fixture` or `llm` | restricted audience | Beta/public activation approval AND Live KIS and/or LLM approval | high (broader exposure, usage/cost scaling) | full auth/usage/cache/audit stack (Section 13) + manual QA package |
| F | public | live KIS and/or LLM as separately approved | `deterministic_fixture` or `llm` | general audience | Beta/public activation approval AND Live KIS/LLM approval AND paid entitlement/usage deduction approval as applicable | highest | full production-readiness validation, real auth, real usage store, monitoring, legal/compliance copy review |

## 7. Live KIS approval plan

**Meaning**: enabling `providerMode: 'live_kis'` (currently in `BLOCKED_PROVIDER_MODES`) and/or `flags.liveKisEnabled: true`, so `evaluateGuardedProductizationAccess` no longer force-blocks that provider mode and no longer appends `APPROVAL_LABELS.liveKis` ("Live KIS approval") to `requiredApprovals`.

**Why blocked**: real external calls to the KIS API incur cost, rate-limit exposure, credential-handling risk, and data-accuracy/liability considerations that have not yet been reviewed or approved by the owner for this scaffold path. Live KIS remains blocked until every gate below is individually signed off.

**11 approval gates** (each must be explicitly approved by the owner, in writing, before any code change unblocks live KIS):

1. Owner confirms KIS API credentials/environment variables are provisioned and scoped read-only (no order/trade permissions).
2. Owner confirms the rate-limit and quota ceiling for the target KIS endpoint(s) used by Chart AI.
3. Owner confirms the cost/budget ceiling for live KIS calls.
4. Owner confirms the caching policy (minimum TTL, cache-before-call) that bounds call volume.
5. Owner confirms the audience scope for first live KIS activation (must be owner-local only, per Lane C).
6. Owner confirms error/fallback behavior (must fail closed to fixture or a clear unavailable state, never fabricate data).
7. Owner confirms no raw KIS payload (account/order/balance data) is ever surfaced to any UI or log accessible outside the server boundary.
8. Owner confirms the audit/logging policy for live KIS calls (what is logged, retention, access).
9. Owner confirms this activation does not implicitly unlock beta/public audiences — that remains a separate, later approval.
10. Owner confirms a rollback plan (single flag flip back to fixture-only) is documented and tested.
11. Owner signs off on the specific commit/PR that flips `liveKisEnabled` and/or removes `live_kis` from `BLOCKED_PROVIDER_MODES`.

**7 non-goals of this Live KIS approval plan** (this section plans; it performs none of the following in this phase):

1. Does not provision or read any real KIS credential/env value.
2. Does not call the live KIS API.
3. Does not modify `guarded-productization-scaffold.mjs` or any KIS provider module.
4. Does not enable `liveKisEnabled` or remove `live_kis` from the blocked list.
5. Does not create or activate any API route that would call live KIS.
6. Does not expand audience beyond owner-local.
7. Does not commit to a specific activation date.

## 8. LLM approval plan

**Meaning**: enabling `agentMode: 'llm'` (currently in `BLOCKED_AGENT_MODES`) and/or `flags.llmEnabled: true`.

**Why blocked**: LLM-generated agent output for financial-adjacent content carries hallucination risk, prompt-injection risk, cost-per-call risk, and requires strict enforcement of the safety-copy policy (Section 15) that has not yet been reviewed or approved. LLM is not active and remains blocked until every gate below is individually signed off.

**11 approval gates**:

1. Owner confirms which LLM provider/model will be used and that its data-handling/retention terms are acceptable.
2. Owner confirms API key provisioning and scoping (no elevated permissions beyond text generation).
3. Owner confirms the cost/budget ceiling per call and per period.
4. Owner confirms the prompt template (no leaking internal system state, no user PII in the prompt).
5. Owner confirms output must be deterministically post-processed to guarantee required safety copy is present verbatim (never LLM-generated safety copy).
6. Owner confirms output must never contain a forbidden investment-advice phrase (Section 15).
7. Owner confirms a content-filter/guard layer for hallucinated numeric claims (e.g. fabricated price targets) is in place before any LLM output reaches a user.
8. Owner confirms the audience scope for first LLM activation (must be owner-local only, per Lane D).
9. Owner confirms fallback behavior when the LLM call fails or times out (must fall back to deterministic fixture output, never a blank/broken UI state).
10. Owner confirms the audit/logging policy for LLM calls and outputs.
11. Owner signs off on the specific commit/PR that flips `llmEnabled` and/or removes `llm` from `BLOCKED_AGENT_MODES`.

**5 non-goals**:

1. Does not call any LLM provider (OpenAI/Gemini/Anthropic or other).
2. Does not modify `mk-agent.mjs`, `similar-pattern-agent.mjs`, or their fixture counterparts.
3. Does not enable `llmEnabled` or remove `llm` from the blocked list.
4. Does not draft or store any real prompt template as executable code.
5. Does not expand audience beyond owner-local.

## 9. API route activation plan

| Stage | Allowed flags | Required approvals | Forbidden combos | Response shape | Failure behavior |
| --- | --- | --- | --- | --- | --- |
| 0 — No route exists (current state) | none relevant | none | n/a | n/a — `/chart-ai` renders the static shell only | n/a |
| 1 — Route file created, feature-flagged off by default | none enabled by default | none yet; requires its own phase-specific checker before implementation | route must not import live KIS/LLM client code without a compile-time-inert guard | fixed "not yet available" JSON | fail closed to unavailable |
| 2 — Route enabled, owner-local, fixture-only (Lane A/B) | `ownerLocalEnabled` | none beyond existing scaffold approval (already granted, 3FG-A/3FG-B) | `liveKisEnabled`/`llmEnabled` true while audience !== owner-local | decision-object envelope (`scaffoldVersion`, `allowed`, `audience`, `providerMode`, `agentMode`, `reasons`, `blockedBoundaries`, `requiredApprovals`, `failClosed`, `safetyCopy`) | fail closed, returns the fail-closed decision object with reasons |
| 3 — Route enabled, owner-local + live KIS (Lane C) | `ownerLocalEnabled` + `liveKisEnabled` | all 11 Live KIS approval gates (Section 7) | `betaEnabled`/`publicEnabled` true simultaneously; `llmEnabled` true without separate LLM approval | same envelope, `providerMode: 'live_kis'`, payload minimized per Section 14 | fail closed to unavailable on live KIS failure; never fabricate data; never silently fall back to fixture without labeling it as fixture |
| 4 — Route enabled, owner-local + LLM (Lane D) | `ownerLocalEnabled` + `llmEnabled` | all 11 LLM approval gates (Section 8) | `betaEnabled`/`publicEnabled` true simultaneously | same envelope, `agentMode: 'llm'`, output post-processed to guarantee safety copy | fail closed to deterministic fixture output, labeled as such, on LLM failure/timeout |
| 5 — Route enabled, internal-qa/beta (Lane E) | `internalQaEnabled` or `betaEnabled`, plus separately approved `liveKisEnabled`/`llmEnabled` | Beta/public activation approval + real auth runtime approval (Section 13 ordering) + usage store wiring approval | `publicEnabled` true while still in Stage 5; `usageDeductionEnabled`/`paidEntitlementEnabled` true without a completed usage-store phase | envelope plus auth/usage metadata (never raw session/JWT values) | fail closed on auth failure, usage-cap failure, or any upstream failure |
| 6 — Route enabled, public (Lane F) | `publicEnabled` plus fully approved capability flags | every `APPROVAL_LABELS` entry that applies to the enabled capability set, plus deploy/push approval | any flag enabled without its corresponding approval gate signed off | production-hardened envelope with full audit/logging | fail closed on any single gate failure; the entire request is rejected, never partially served |

## 10. Runtime binding sequence

**11-step minimum safe sequence** (applies to enabling Live KIS and/or LLM for owner-local first):

1. Owner approval for Live KIS (Section 7 gates) AND/OR LLM (Section 8 gates) signed off, scoped to owner-local only.
2. Flip exactly one scaffold flag (`liveKisEnabled` or `llmEnabled`) in a dedicated, narrowly-scoped commit — no other flag changes in the same commit.
3. Re-run the full existing scaffold CLI QA chain (Phase 3FG-B pattern) against the newly-enabled flag combination, confirming every other path still fails closed.
4. Implement the corresponding API route stage (Section 9) behind the newly-enabled flag, owner-local only, with its own smoke script (all gates off by default) and checker, following the established `smoke:phase-*` / `check:phase-*` pattern.
5. Run owner-local Browser QA (12-case pattern from Phase 3FG-E) against the new route/UI wiring.
6. Fix any defects found via a dedicated, narrow-scope hotfix phase, following the Phase 3FG-D-HF1 pattern.
7. Re-run Browser QA to confirm zero open defects.
8. Document a phase-specific result document and checker; update the changelog.
9. Only after owner-local is fully verified stable, begin planning (a separate future phase) for internal-qa/beta audience expansion. This step is explicitly **not** included in this phase's scope and requires its own approval chain (Beta/public activation approval).
10. Real auth/usage/cache/audit wiring (Section 13 ordering) must be completed and verified before any beta/public expansion, regardless of Live KIS/LLM approval status.
11. Public activation requires every applicable `APPROVAL_LABELS` entry signed off, plus deploy/push approval, plus a final owner go/no-go review — no partial public activation.

## 11. Approval matrix

Zero cells in this matrix are "Allowed now" as of this phase — every real productization capability remains blocked for every audience tier. The matrix below plans the eventual approval status per audience tier × capability, using four statuses: **Allowed now**, **Planned but blocked**, **Requires explicit approval**, **Forbidden**.

| Capability | owner-local | internal-qa | beta | public |
| --- | --- | --- | --- | --- |
| Live KIS | Requires explicit approval (Section 7) | Planned but blocked | Planned but blocked | Forbidden |
| LLM | Requires explicit approval (Section 8) | Planned but blocked | Planned but blocked | Forbidden |
| MK AI route activation | Requires explicit approval | Planned but blocked | Planned but blocked | Forbidden |
| Real auth runtime | Forbidden (owner-local uses hostname guard only) | Requires explicit approval | Requires explicit approval | Planned but blocked |
| Supabase/DB real runtime | Forbidden | Requires explicit approval | Requires explicit approval | Planned but blocked |
| Usage deduction | Forbidden | Planned but blocked | Requires explicit approval | Planned but blocked |
| Paid entitlement | Forbidden | Forbidden | Planned but blocked | Forbidden |
| Ad unlock | Forbidden | Forbidden | Planned but blocked | Forbidden |
| Deploy/push | Forbidden | Requires explicit approval | Requires explicit approval | Forbidden |

## 12. Flag and configuration policy

1. Every new capability flag must default to `false` and be added to `DEFAULT_GUARDED_PRODUCTIZATION_FLAGS` (or its future route-level equivalent) before any code path can reference it.
2. Exactly one flag may be flipped per commit/PR (Section 10, step 2) — no bundling of unrelated flag changes.
3. No flag may be read from `.env`/`.env.local` or any runtime environment variable without a dedicated, owner-approved "real env parsing" phase — until then, all flags are explicit function-argument/fixture inputs only.
4. No flag's default may be changed by editing `DEFAULT_GUARDED_PRODUCTIZATION_FLAGS` without an explicit owner-approved phase whose sole purpose is that flip.
5. Flags must never be inferred from request headers, cookies, or query parameters in a way that lets an end user self-elevate audience or capability — the existing owner-local UI gating uses a query-param opt-in only to show/hide already-safe static content, never to grant real capability.
6. Every capability flag must map to exactly one `APPROVAL_LABELS` entry (or a documented combination) so the approval trail is always traceable from flag to owner sign-off.
7. Any new flag introduced by a future phase must be added to the forbidden-diff / sibling-checker cascade pattern (Section 17) so existing checkers continue to enforce fail-closed defaults.

## 13. Auth/usage/cache/audit ordering

1. Real auth must be implemented and verified before real usage deduction — usage cannot be metered against an unauthenticated or hostname-guard-only identity.
2. Cache must be implemented and verified before live KIS is enabled for any audience beyond owner-local — this bounds call volume and cost before broader exposure.
3. Usage store must be implemented and verified before paid entitlement or ad unlock — entitlement/unlock logic depends on a working usage ledger.
4. Audit/logging must be implemented before any live KIS or LLM call is enabled for any audience beyond owner-local — every real external call must be traceable.
5. Cooldown/rate-limit enforcement (building on the existing 3FD-G/3FD-H cooldown UX groundwork) must be verified before internal-qa/beta expansion, independent of Live KIS/LLM approval status.
6. Deploy/push approval is always the last gate in any sequence — no capability is deployed or pushed ahead of its own auth/usage/cache/audit prerequisites being verified locally.

## 14. Data minimization and privacy policy

1. Never surface a raw KIS provider payload to any client-facing response or log outside the server boundary — only minimized, purpose-built fields.
2. Never surface account/order/balance data, even in owner-local mode.
3. Never surface email addresses, JWT values, session tokens, cookies, or raw header values in any response, log, or UI.
4. Never surface a raw Supabase row; only minimized, purpose-built projections.
5. Never log a secret, API key, or credential value, even at debug level.
6. Any LLM prompt must exclude user PII and internal system implementation details.
7. Any audit log entry must record only the minimum fields needed for traceability (timestamp, audience, capability, decision) — never the full request/response payload.

## 15. Safety and Korean copy policy

**5 required phrases** (must appear verbatim in any future user-facing surface that exposes real Live KIS/LLM output):

1. 참고용 정보이며 투자 판단의 유일한 근거로 사용할 수 없습니다.
2. 이 콘텐츠는 매수·매도 추천이 아닙니다.
3. 이 콘텐츠는 투자 자문이 아닙니다.
4. 과거 유사 흐름은 미래 성과를 보장하지 않습니다.
5. 모든 실제 상품화 게이트는 꺼져 있습니다.

**8 forbidden phrases** (must never appear as approved output copy):

매수하세요, 매도하세요, 지금 진입, 목표가는, 손절가는, 강력 추천, 상승이 확정, 하락이 확정.

## 16. Failure mode policy

Every listed condition fails closed — never partial success, never fabricated data, never a silent fallback that looks like a real result.

| # | Failure condition | Fail-closed behavior |
| --- | --- | --- |
| 1 | Live KIS API timeout | Fail closed to unavailable state, no fabricated data |
| 2 | Live KIS API error/non-200 | Fail closed to unavailable state, log error class only (no raw response body) |
| 3 | Live KIS rate-limit exceeded | Fail closed, backoff, no retry storm |
| 4 | LLM API timeout | Fail closed to deterministic fixture output, labeled as fixture |
| 5 | LLM API error | Fail closed to deterministic fixture output, labeled as fixture |
| 6 | LLM output missing required safety copy | Reject output, fail closed, never display partially-safe output |
| 7 | LLM output contains forbidden investment-advice phrase | Reject output, fail closed |
| 8 | Auth failure (invalid/missing session) | Fail closed, no partial content served |
| 9 | Usage cap exceeded | Fail closed with a clear cooldown/limit message, no silent throttling that looks like success |
| 10 | Flag misconfiguration (mutually exclusive flags both true) | Fail closed, treat as full block, never "best effort" merge |
| 11 | Cache miss + upstream unavailable | Fail closed to unavailable state, never serve stale data silently mislabeled as fresh |
| 12 | Audit/logging write failure | Fail closed — do not serve a real-capability response if its audit trail cannot be recorded |
| 13 | Unexpected/unhandled exception in the guarded path | Fail closed to the existing `createFailClosedDecision()` shape, never leak a stack trace or internal error detail to the client |

## 17. Minimum validation plan

1. `smoke:*` — deterministic, no-network smoke script per phase, all gates off by default.
2. `check:*` — static contract checker per phase, asserting required files, required tokens, forbidden diff, changelog entry.
3. Source boundary check — grep-based scan (Phase 3FG-B Case 13 pattern) confirming no `fetch(`, `process.env`, `createClient(`, cookie/header parsing, JWT parsing, `Math.random(`, `Date.now(`, or LLM-SDK instantiation in any module that must remain fixture-only until its own approval phase.
4. Forbidden-diff check — `git diff --name-only <baseline> -- <forbidden paths>` must be empty for any phase that is not the specific phase authorized to touch that path.
5. Owner-local Browser QA — 12-case pattern (Phase 3FG-E) for any UI-visible change, executed via DOM/CSS/console/network introspection, not screenshot-only inspection.
6. Mojibake / secret / PII scan — static text scan of all new docs and, once real code exists, of all new source for Korean-encoding corruption and secret-like patterns.
7. `npm run build` + `git diff --check` + `git status --short` — full build and hygiene check before every commit, as already established across every prior phase.

## 18. Recommended next phases

Per the goal-first shortened path (Section 5), the recommended sequence is:

- **Phase 3GG-B** — Live KIS Approval Gate Checklist: an owner-reviewable, planning-only checklist artifact that lets the owner sign off the 11 Section 7 gates individually. No activation.
- **Phase 3GG-C** — LLM Approval Gate Checklist: an owner-reviewable, planning-only checklist artifact that lets the owner sign off the 11 Section 8 gates individually. No activation.
- **Phase 3GG-D** — API Route Stage 1 Scaffold: the route file created, feature-flagged off by default, no live call, mirroring the established 3FC/3FD "all gates off" pattern. Only after 3GG-B/3GG-C owner review, not activation.
- **Phase 3GG-E** — Owner-local Live KIS Activation (Lane C): only after all 11 Section 7 gates are individually signed off by the owner.
- **Phase 3GG-F** — Owner-local LLM Activation (Lane D): only after all 11 Section 8 gates are individually signed off by the owner.

The next recommended phase is **Phase 3GG-B**, not Phase 3FG-F. Phase 3FG-F is postponed — it remains a valid future phase if a handoff package becomes operationally necessary later, but it is not on the critical path to a live KIS/LLM approval decision, which is the owner's stated priority.

## 19. Non-goals

1. Does not implement runtime binding of any kind.
2. Does not activate live KIS.
3. Does not activate LLM.
4. Does not create or activate any API route.
5. Does not modify `src/pages/chart-ai.astro`.
6. Does not modify any scaffold/agent source or fixture module.
7. Does not modify any KIS provider module.
8. Does not activate beta or public audiences.
9. Does not implement real auth/session/JWT/cookie/header parsing.
10. Does not implement a real Supabase/DB runtime.
11. Does not implement usage deduction, paid entitlement, or ad unlock.
12. Does not deploy or push.

## 20. Decision summary

**What proceeds**: this planning document, its result document, and its static contract checker are created; `package.json` gains one new script (`check:phase-3gg-a-plan`); `planning_changelog.md` gains one new entry. Nothing else changes.

**What's blocked**: live KIS, LLM, MK AI route activation, beta/public activation, Supabase/DB real runtime, real auth/session/JWT/cookie/header parsing, usage deduction, paid entitlement, ad unlock, deploy, and push all remain fully blocked, exactly as before this phase. No live KIS. No LLM. No public/beta activation. No API route activation. No scaffold source change. No deploy. No push.

**What needs owner approval**: every gate listed in Section 7 (Live KIS, 11 gates) and Section 8 (LLM, 11 gates) — 22 gates total — before Live KIS or LLM can be enabled even for owner-local; the Beta/public activation approval before any audience expansion beyond owner-local; deploy/push approval before any release.
