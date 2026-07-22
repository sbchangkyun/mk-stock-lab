# Phase 3FG-A-PLAN — Guarded Productization Planning, No Live KIS, No LLM, No Public Activation

## 1. Status

- Status: Prepared.
- This document is planning-only and introduces no runtime change.
- No implementation, activation, deploy, or push occurs as part of this phase.

## 2. Purpose

Phase 3FG-A-PLAN defines the guarded productization path for Chart AI after the deterministic, owner-local Similar Pattern Agent SP-B contract, MK Agent MK-C consumption, real-browser UI-C QA, HOUSEKEEPING-A checker stabilization, and Phase 3FF-A-HANDOFF-A current-state handoff package. It exists so that the eventual move from a deterministic, fixture-only, owner-local-only system to an authenticated, usage-guarded, cost-guarded product has an explicit, written approval path — instead of being implemented ad hoc. This phase produces a plan and approval-gate map only; it does not implement, wire, or activate any of the capabilities it describes.

## 3. Baseline

- Current baseline before Phase 3FG-A-PLAN: `dc36043`.
- Latest completed phase before Phase 3FG-A-PLAN: Phase 3FF-A-HANDOFF-A.
- Branch: `rebuild/phase-1-ia-shell`.

## 4. Current verified foundation

- **Similar Pattern Agent deterministic fixture engine** (`src/lib/server/chart-ai/similar-pattern-agent.mjs`, Phase 3FF-A-SP-A): log returns, normalized path, correlation score, RMSE score, direction match score, volatility penalty, forward D5/D20 outcomes, max drawdown. Output labeled `historical_shape_similarity_only`; no buy/sell recommendation.
- **Similar Pattern SP-B contract v0.2** (`similar-pattern-agent.v0.2`, Phase 3FF-A-SP-B): adds `contractVersion`, `confidenceScore`/`confidenceLabel`, `patternQuality`, `matchReasonTags`, `outcomeDistribution`, `contractSummary`, fully backward compatible with SP-A output.
- **MK Agent deterministic report contract** (`src/lib/server/chart-ai/mk-agent.mjs`, Phase 3FF-A-MK-A/MK-B): 7 required report sections, 6 safety flags (all false on successful output), deterministic Korean topic-particle grammar handling, forbidden-investment-language sanitizer, required disclaimer.
- **MK-C SP-B contract consumption** (Phase 3FF-A-MK-C): `hasSpbSimilarPatternContract`, `summarizeSpbContractForMkAgent`, `summarizeOutcomeDistributionForMkAgent`, `summarizePatternQualityForMkAgent`, `summarizeMatchReasonTagsForMkAgent` — fail-soft, additive, byte-identical output for legacy SP-A-shaped input.
- **Owner-local deterministic panel** (`#chartAiOwnerLocalDeterministicAgentsPanel` on `/chart-ai`, Phase 3FF-A-UI-A): hidden by default, visible only when the mocked-access gate passes, `isLocalOwnerHostname()` is true, and `ownerLocalDeterministicAgents=1` is present in the URL.
- **UI-C real browser QA** (Phase 3FF-A-UI-C): confirmed the improved MK-C/SP-B output renders correctly on PC and mobile with no regression to the default `/chart-ai` experience.
- **HOUSEKEEPING-A checker stability** (Phase 3FF-A-HOUSEKEEPING-A): historical checkers now locate their changelog section by header instead of a fixed top-of-file slice, so they remain stable as new phases are prepended.
- **HANDOFF-A current-state handoff package** (Phase 3FF-A-HANDOFF-A, baseline `dc36043`): froze the verified state under `docs/handoff/chart-ai-spb-mkc-uic-housekeeping-current-state/` so future sessions can resume without long prior chat context.

All of the above remain deterministic and fixture-only. No live KIS call and no LLM call has occurred in any of these phases.

## 5. Productization objective

The eventual productized target for Chart AI is:

- Authenticated Chart AI execution, replacing today's mocked/owner-local-only access gate.
- Guarded Similar Pattern analysis, served behind real auth, usage, and cost guards instead of only an owner-local query opt-in.
- Guarded MK Agent analysis, served behind the same guard stack, starting from the current deterministic report and later — only after a separate approval — an LLM-backed report.
- A usage / cooldown / cache / cost / audit policy that bounds how often, how cheaply, and how traceably each account can run an analysis.
- Explicit provider mode separation, so fixture, live-KIS, deterministic-agent, and LLM-agent modes are independently flagged and never silently mixed.
- Strict fail-closed behavior across every guard and every provider integration point.
- Safe Korean user-facing copy that never reads as investment advice.
- A standing no-investment-advice constraint that applies to every current and future output surface.

## 6. Real auth boundary plan

This section defines the real auth boundary plan that will eventually replace today's mocked-access and owner-local gates. It is planning-only: no session, JWT, cookie, or header value is read, parsed, or persisted as part of this phase.

- **Anonymous user**: no session subject resolved. Sees only the existing public/sample/mocked experience. No Similar Pattern or MK Agent execution is granted.
- **Authenticated normal user**: has a resolved auth subject and a resolved usage/role record. Subject to the daily usage cap and cooldown described in Section 8.
- **Owner/admin/master user**: has a resolved auth subject with an elevated role. May be exempt from cooldown (continuing the precedent already designed in Phase 3FD-H's master cooldown exemption), but is still subject to fail-closed behavior on every other guard.
- **Role/capability resolver**: a single server-only function that maps a resolved auth subject to a capability set (e.g. `canRunSimilarPattern`, `canRunMkAgent`, `isCooldownExempt`). This resolver already exists in scaffold form (Phase 3FC-D role assignment resolver scaffold) and should be extended, not replaced.
- **Auth subject resolver**: a single server-only function that turns a real session into a stable, privacy-safe subject identifier. This scaffold already exists (Phase 3FC-C Supabase auth subject resolver scaffold; Phase 3FD-B real Supabase auth subject resolver, disabled by default) and should be extended, not replaced.
- **Session/JWT/cookie/header boundary**: all real session material is read and validated server-side only, never logged in raw form, never exposed to client-side script, and never echoed back in an API response body.
- **Real auth remains blocked in this phase.** No session/JWT/cookie/header value is parsed, no Supabase auth call is made, and no real auth runtime is activated by Phase 3FG-A-PLAN.

## 7. Feature flag / environment separation plan

This section defines the feature flag and environment separation strategy, covering owner-local, internal QA, beta, and public audience tiers, plus independent provider-mode and agent-mode gates. All gates default off.

Audience-tier gates (who can reach the feature at all):

- `owner-local` — today's behavior: localhost only, explicit query opt-in, no wider audience.
- `internal-qa` — a small, explicitly allow-listed set of internal accounts, for pre-beta QA once real auth exists.
- `beta` — a larger but still explicitly gated set of accounts (allow-list or capability flag), not the general public.
- `public` — the fully public audience; the widest and last tier to be enabled.

Provider-mode and agent-mode gates (independent of audience tier):

- `provider-fixture-mode` — synthetic and KIS-OHLC-fixture data only (today's mode).
- `provider-live-kis-mode` — real KIS market data (requires the separate Live KIS Approval Package in Section 14/16).
- `agent-deterministic-mode` — today's deterministic MK Agent report (current default and current only active mode).
- `agent-llm-mode` — an LLM-backed MK Agent report (requires the separate LLM Approval Package in Section 14/16).

Every one of these six gates must default to off / most-restrictive, must be independently toggleable, and must be evaluated server-side only. No flag introduced by a future phase may default to an enabled state without an explicit owner approval recorded in that phase's result document.

## 8. Usage / cooldown / cache / cost / audit policy

This section defines planning-only usage, cooldown, cache, cost, and audit policy; no real persistence exists yet, and the usage-store interface remains the existing mocked/scaffold implementation (Phase 3FC-E usage store interface scaffold).

- **Daily free usage**: a small fixed per-account per-day quota. As an illustrative starting point, planning may reuse the existing open-beta precedent of 3 uses per account per day noted in Phase 3FF-A-PLAN's MK Agent design doc, subject to real cost-guard review before any activation.
- **Cooldown**: a minimum interval enforced between consecutive analysis runs for the same account, separate from the daily cap, continuing the master/owner cooldown-exemption precedent from Phase 3FD-H.
- **Cache key strategy**: a composite key of symbol, timeframe, provider mode, and contract version. No raw account identifier is embedded in a cache key.
- **Cache TTL**: bounded short enough to avoid stale analysis results and long enough to bound provider/LLM call volume and cost; the exact TTL value is an implementation-phase decision, not a Phase 3FG-A-PLAN decision.
- **Cost estimation**: once a paid provider or LLM call path is active, each call must be attributed an estimated cost against a per-account and/or global budget ceiling, with an alert path before the ceiling is reached.
- **Audit log scope**: who (privacy-safe subject identifier), when, which symbol, which provider mode, which agent mode, and the safety-flag outcome of the run. Audit logs never contain raw provider payloads, raw session material, or secrets.
- **Privacy-safe identifiers**: any identifier written to a cache key, audit log, or usage record must be an opaque/hashed subject identifier, never a raw email, raw session token, or other directly identifying value.
- **No real persistence in this phase**: everything above is an interface-level design constraint for a future implementation phase. Phase 3FG-A-PLAN does not create a Supabase client, does not open a DB connection, and does not write any usage/cache/audit record.

## 9. Provider boundary plan

This section defines the provider boundary plan; live KIS remains blocked pending a separate approval phase.

- **Synthetic fixture provider**: the current default for Similar Pattern and MK Agent input; always available, zero cost, fully deterministic.
- **KIS OHLC fixture provider**: the existing Phase 3FE-A owner-local fixture-backed provider boundary; still fixture-backed, not a live network call.
- **Live KIS provider approval gap**: moving from the KIS OHLC fixture provider to a live KIS call requires, at minimum: a credential-handling design that never logs or exposes the raw API key/secret, an explicit rate-limit and retry policy, a redaction policy for upstream error bodies, and a dedicated Live KIS Approval Package phase (Section 14/16) with explicit owner sign-off. Live KIS remains blocked until that approval package is completed and separately approved.
- **No account/trading/order/balance APIs**: the provider boundary excludes any KIS account, trading, order, or balance endpoint, in this phase and in every phase that follows it, unless an entirely separate future approval explicitly authorizes that different capability.
- **No raw KIS payload exposure**: no raw upstream provider payload is ever returned to the UI or any public API response; only sanitized, contract-shaped output crosses that boundary.
- **Provider errors must be redacted**: any provider failure surfaces a generic, safe, Korean-language failure state to the end user; raw stack traces, upstream error bodies, and internal diagnostic detail are never included in a response body.

## 10. MK Agent deterministic vs LLM approval gap

LLM is not active in this phase or any prior phase; the deterministic MK Agent remains the only active path.

- **Deterministic MK Agent remains the current path**: every MK Agent output in production today, and through the end of this planning phase, is produced by the deterministic, fixture-only report generator in `src/lib/server/chart-ai/mk-agent.mjs`.
- **LLM is not active**: no OpenAI, Gemini, Anthropic, or other LLM provider call has occurred, and none occurs as part of Phase 3FG-A-PLAN.
- **LLM approval package required before activation**: a future LLM Approval Package phase must define, at minimum, the provider/model choice, the exact prompt and system-instruction design, a per-call cost ceiling, and an explicit owner sign-off before any LLM call is made.
- **Safety filters required**: any future LLM-backed output must pass through the same class of forbidden-investment-language sanitizer already enforced on the deterministic MK Agent output before it can be returned to a user.
- **No raw user/private data to LLM**: no raw session token, no raw account identifier, and no raw private portfolio data may be included in any future LLM prompt; only sanitized, minimized, task-relevant fields may be sent.
- **No investment recommendation**: a future LLM-backed MK Agent output is held to the same no-investment-advice constraint defined in Section 13, with no exception.
- **No target price/stop-loss instruction**: a future LLM-backed MK Agent output must not state a specific target price value, must not state a specific stop-loss value, and must not instruct placing one — the same constraint already enforced deterministically today.

## 11. Public/beta readiness criteria

Before any beta or public exposure of a guarded route, all of the following must be verified and recorded in that future phase's result document:

- Login/auth verified — real auth subject resolution works end-to-end, fails closed on any error.
- Usage limits verified — daily cap and cooldown enforced correctly, including the owner/master exemption path.
- Cost guard verified — per-call cost estimation and budget ceiling behave correctly under load.
- Audit and privacy policy verified — audit records contain only privacy-safe identifiers and no raw secrets/payloads.
- Korean legal/safety copy reviewed — every disclaimer in Section 13 is present and unmodified in the shipped UI copy.
- Mobile/PC UI QA complete — matching the rigor already established in Phase 3FF-A-UI-B/UI-C real-browser QA.
- Failure states tested — every failure mode in Section 12 has been deliberately triggered and observed to fail closed.
- Monitoring/rollback plan — a way to detect a bad rollout and revert it exists before the audience tier widens.
- Explicit owner approval — a named, recorded owner sign-off is the final gate before any beta or public audience-tier flag is enabled.

## 12. Failure mode / fail-closed policy

Every integration point in this plan must fail-closed rather than fail-open when a dependency is unavailable.

| Failure | Required behavior |
| --- | --- |
| Auth unavailable | Treat the request as anonymous/denied; never fail open into an authenticated capability. |
| Usage exceeded | Block the request with a clear Korean message; no bypass except the owner/master exemption. |
| Provider unavailable | Return a safe "data unavailable" state; never fabricate or guess data. |
| Insufficient data | Return the same safe-empty state already used by today's SP-A/SP-B edge-case fixtures. |
| Cache unavailable | Bypass the cache and proceed only if the cost guard still allows the call; otherwise block. |
| LLM unavailable | Fall back to the deterministic MK Agent output; never surface a raw provider error to the user. |
| Sanitizer failure | Fail closed — block the output entirely rather than risk returning unsanitized text. |
| Network/API failure | Redact the error, log it internally, and return the same safe fallback state as "provider unavailable." |
| Unexpected runtime error | Fail closed with a generic safe message; never leak a stack trace or internal detail. |

## 13. Legal/safety copy and no investment advice constraints

No investment advice is provided by any current or planned output of this system. Every guarded output surface must carry, at minimum, the following required Korean disclaimer phrases:

- 참고용
- 매수·매도 추천이 아닙니다
- 투자 자문이 아닙니다
- 과거 유사 흐름은 미래 성과를 보장하지 않습니다

In addition, every current and future output is constrained as follows:

- No certainty language: outputs must not assert a guaranteed or certain future outcome.
- No target price: outputs must not state a specific target price value.
- No stop-loss: outputs must not state a specific stop-loss value or instruct placing one.
- No buy/sell instruction: outputs must not directly instruct the user to buy or sell.

These constraints apply identically to the current deterministic MK Agent output and to any future LLM-backed output described in Section 10; no future phase may weaken or remove them without a separate, explicit owner approval.

## 14. Proposed next implementation phases

The following narrow, gate-scoped phases are recommended, in this order, after Phase 3FG-A-PLAN:

- **Phase 3FG-A** — Guarded Productization Scaffold, All Gates Off. Wires the flag/gate structure from Section 7 and the resolver interfaces from Section 6 as inert scaffolding, mirroring the "all gates off" precedent from Phase 3FD-E/3FD-H/3FD-I.
- **Phase 3FG-B** — Owner-local Guarded Productization QA. Real-browser QA of the Phase 3FG-A scaffold, still owner-local only.
- **Phase 3FG-C** — Usage/Cache/Cost/Audit Mocked Runtime. Implements the Section 8 policy against a mocked store, still no real DB.
- **Phase 3FG-D** — Beta Readiness Approval Package. Assembles the Section 11 readiness checklist into a formal approval package for owner sign-off.
- **Live KIS Approval Package** — a dedicated phase implementing the Section 9 live-KIS approval gap, gated on explicit owner approval.
- **LLM Approval Package** — a dedicated phase implementing the Section 10 LLM approval gap, gated on explicit owner approval.

## 15. Explicit non-goals

Phase 3FG-A-PLAN explicitly does not include:

- No implementation of any product behavior described in this plan.
- No live KIS.
- No LLM.
- No public/beta activation.
- No deploy.
- No push.
- No real DB.
- No real auth runtime.
- No paid entitlement.
- No ad unlock.

## 16. Approval gates

The following capabilities require a separate, explicit owner approval before any future phase may activate them:

- Live KIS.
- LLM.
- Beta/public activation.
- Deploy.
- Push.
- Supabase/DB real runtime.
- Paid entitlement.
- Ad unlock.

No approval recorded for one item in this list authorizes any other item on this list.

## 17. Validation plan

The following commands should pass for this planning phase:

```
npm run check:phase-3fg-a-plan
npm run check:phase-3ff-a-handoff-a
npm run check:phase-3ff-a-housekeeping-a
npm run check:phase-3ff-a-ui-c-manual-qa
npm run smoke:phase-3ff-a-mk-c
npm run check:phase-3ff-a-mk-c
npm run smoke:phase-3ff-a-sp-b
npm run check:phase-3ff-a-sp-b
npm run smoke:phase-3ff-a-mk-b
npm run check:phase-3ff-a-mk-b
npm run check:phase-3ff-a-ui-b-manual-qa
npm run smoke:phase-3ff-a-ui-a
npm run check:phase-3ff-a-ui-a
npm run smoke:phase-3ff-a-mk-a
npm run check:phase-3ff-a-mk-a
npm run smoke:phase-3ff-a-sp-a
npm run check:phase-3ff-a-sp-a
npm run check:phase-3ff-a-plan
npm run build
git diff --check
git status --short
```

Forbidden diff check, expected empty:

```
git diff --name-only dc36043 -- src/pages/chart-ai.astro src/lib/server/chart-ai/mk-agent.mjs src/lib/server/chart-ai/mk-agent.fixture.mjs src/lib/server/chart-ai/similar-pattern-agent.mjs src/lib/server/chart-ai/similar-pattern-agent.fixture.mjs pages/api src/pages/api components supabase src/data package-lock.json pnpm-lock.yaml yarn.lock .env .env.local
```
