# Phase 3FG-C — Owner-local Guarded Productization UI Readiness Plan, No Runtime Wiring

## 1. Status

- Status: Prepared.
- Planning-only.
- No Runtime Wiring.

## 2. Purpose

This phase defines the UI readiness plan for a future owner-local guarded productization UI path, building on the Phase 3FG-A guarded productization scaffold and the Phase 3FG-B command-line QA that verified it. It exists so that a later implementation phase has a written design for how the scaffold's decision states may eventually be surfaced in the owner-local `/chart-ai` experience, instead of that design being improvised at wiring time. This phase produces a plan only; it does not touch `src/pages/chart-ai.astro`, does not create an API route, and does not modify either scaffold source file. There is no UI wiring and no API route activation in this phase: this remains planning/documentation/checker only from start to finish.

## 3. Baseline

- Baseline: `172e146`.
- Latest completed phase before this phase: Phase 3FG-B.
- Branch: `rebuild/phase-1-ia-shell`.

## 4. Current verified foundation

- **Phase 3FG-A guarded productization scaffold** (`src/lib/server/chart-ai/guarded-productization-scaffold.mjs`, `guarded-productization-scaffold.fixture.mjs`): a server-only, pure/deterministic module. All 15 real productization gates (`ownerLocalEnabled`, `internalQaEnabled`, `betaEnabled`, `publicEnabled`, `liveKisEnabled`, `llmEnabled`, `mkAiRouteEnabled`, `realAuthEnabled`, `supabaseEnabled`, `dbEnabled`, `usageDeductionEnabled`, `paidEntitlementEnabled`, `adUnlockEnabled`, `deployEnabled`, `pushEnabled`) default `false`.
- **Fail-closed decision by default**: `evaluateGuardedProductizationAccess` returns `allowed: false`, `failClosed: true` for every audience/provider/agent combination except one.
- **Narrow scaffold-only owner-local allowed:true path**: the only reachable `allowed: true` outcome requires `audience === 'owner-local'`, a fixture-only `providerMode`, `agentMode === 'deterministic_fixture'`, `flags.ownerLocalEnabled === true`, every other of the 14 flags `false`, and an explicit `scaffoldOnlyAcknowledged: true` that no fixture builder sets on its own.
- **Phase 3FG-B command-line QA, 13/13 pass**: confirmed the default fixture, the owner-local fixture without and with `scaffoldOnlyAcknowledged`, the beta/public/live-KIS/LLM/real-auth attempt fixtures, `assertNoRuntimeActivation`, determinism, safety copy, forbidden-language absence, and a source boundary scan — with no defect found in the scaffold.
- **No UI wiring yet**: `src/pages/chart-ai.astro` has never imported or referenced the scaffold module.
- **No API route activation yet**: no `pages/api` or `src/pages/api` route exists for the scaffold, and none is created by this phase.

## 5. UI readiness objective

A future UI integration of this scaffold must, at minimum:

- Display the scaffold decision status to the owner-local audience only.
- Never be exposed to a public or beta audience.
- Never trigger a real analysis execution — the scaffold-only `allowed: true` state is a display of a fail-closed-by-default policy check, not a real runtime activation.
- Never invoke a real provider (no live KIS, no KIS OHLC fetch triggered from this UI path).
- Never invoke an LLM.
- Never parse a real auth/session/JWT/cookie/header value to render the display.
- Never deduct usage.
- Never gate on a paid entitlement or an ad unlock.
- Never be part of a deploy or push in this phase.

## 6. Proposed future UI placement

Planned, not implemented in this phase:

- A future, hidden-by-default `/chart-ai` owner-local panel section, distinct from and additive to the existing `#chartAiOwnerLocalDeterministicAgentsPanel` (Phase 3FF-A-UI-A).
- Not visible in the default `/chart-ai` experience under any circumstance.
- Visible only under an explicit owner-local query parameter, introduced in a later, separately approved phase — this plan does not name or reserve that parameter's final value, since naming it is an implementation-phase decision.
- Must not change the existing deterministic agent panel's markup, styling, or activation conditions.
- Must be visually and textually distinct from the existing deterministic agent panel and from any future public/beta feature, so an owner reviewing the page can never mistake it for an active product surface.

## 7. Future UI guard model

A future implementation phase must require ALL of the following before rendering this panel, mirroring the layered-guard precedent already used for the existing deterministic agent panel:

- `isLocalOwnerHostname()` (or an equivalent localhost check) must be true.
- An explicit owner-local query parameter must be present, matching the precedent set by `ownerLocalDeterministicAgents=1`.
- Reuse of the existing owner/mock access gate is permitted only if that reuse is separately approved in the implementation phase's own result document — this plan does not pre-approve that reuse.
- All 15 real productization gates must remain `false`; the panel must never render a state implying any real gate is `true`.
- No real auth runtime may be consulted to decide whether to render the panel.
- No public or beta audience tier may ever reach this panel.
- No live KIS call may be triggered by rendering or interacting with this panel.
- No LLM call may be triggered by rendering or interacting with this panel.
- If any required guard condition cannot be evaluated or is missing, the panel must fail closed — i.e., remain hidden — rather than default to visible.

## 8. UI state mapping plan

The table below maps each scaffold decision outcome to a future UI state. This is a design reference for a later implementation phase; no markup is created by this phase.

| Scaffold outcome | Label | User-facing copy (Korean) | Severity | Visual treatment | Safety copy | Required approval display | Forbidden actions |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Default fail-closed state | 기본 차단 상태 | 현재 단계에서는 실제 분석 실행이 아니라 안전 경계 확인용 화면입니다. 모든 실제 상품화 게이트는 꺼져 있습니다. | Info | Neutral/blocked, no CTA | All 4 required safety phrases (Section 9) | None (no path attempted) | No execution button, no "start" CTA |
| Owner-local without `scaffoldOnlyAcknowledged` | 소유자-로컬 승인 대기 | 이 화면은 명시적 승인 전까지 차단 상태입니다. | Info/blocked | Blocked, no CTA | All 4 required safety phrases | None | No auto-acknowledge, no hidden auto-submit |
| `scaffoldOnlyAcknowledged` scaffold-only allowed state | 스캐폴드 전용 허용 상태 (실제 실행 아님) | 이 상태는 실제 상품화 실행이 아니라 스캐폴드 전용 경계 확인 결과입니다. | Info (not success/active) | Distinct "inert-allowed" treatment, still no CTA, no execution affordance | All 4 required safety phrases plus the explanatory sentence in Section 9 | None (no real approval required for scaffold-only) | No "실행" or "분석 시작" language, no live/LLM affordance |
| Beta blocked state | 베타 차단 | 베타 활성화는 아직 승인되지 않았습니다. | Blocked | Blocked, no CTA | All 4 required safety phrases | "Beta/public activation approval" label shown as required-but-not-granted | No beta opt-in control |
| Public blocked state | 퍼블릭 차단 | 퍼블릭 활성화는 아직 승인되지 않았습니다. | Blocked | Blocked, no CTA | All 4 required safety phrases | "Beta/public activation approval" label shown as required-but-not-granted | No public opt-in control |
| Live-KIS blocked state | 실시간 KIS 차단 | 실시간 시세 연동은 아직 승인되지 않았습니다. | Blocked | Blocked, no CTA | All 4 required safety phrases | "Live KIS approval" label shown as required-but-not-granted | No live-data toggle |
| LLM blocked state | LLM 차단 | LLM 기반 분석은 아직 승인되지 않았습니다. | Blocked | Blocked, no CTA | All 4 required safety phrases | "LLM approval" label shown as required-but-not-granted | No LLM toggle |
| Real-auth blocked state | 실제 인증 차단 | 실제 인증 런타임은 아직 승인되지 않았습니다. | Blocked | Blocked, no CTA | All 4 required safety phrases | "Real auth runtime approval" label shown as required-but-not-granted | No login/session control tied to this panel |

## 9. Korean copy guidance

Safe Korean UI copy examples for future use, none of which constitute investment recommendation language:

- 참고용
- 매수·매도 추천이 아닙니다
- 투자 자문이 아닙니다
- 과거 유사 흐름은 미래 성과를 보장하지 않습니다
- 현재 단계에서는 실제 분석 실행이 아니라 안전 경계 확인용 화면입니다
- 모든 실제 상품화 게이트는 꺼져 있습니다

A future implementation phase must not introduce investment recommendation language (buy/sell instructions, target price, stop-loss, certainty-of-outcome language) anywhere in this panel.

## 10. UX guardrails

A future implementation phase must:

- Never present this panel as an active beta feature.
- Never present this panel as a public launch or public-facing capability.
- Never use "AI 분석 시작" or equivalent execution-implying copy for this scaffold-only readiness path.
- Avoid any call-to-action that suggests an analysis, trade, or provider call will be executed.
- Use read-only, status-report language throughout ("상태를 표시합니다" rather than "실행하세요").
- Clearly display which boundaries are blocked, using the scaffold's own `blockedBoundaries` copy.
- Clearly display which approvals are required but not yet granted, using the scaffold's own `requiredApprovals` labels.
- Explicitly explain, in-panel, that the scaffold-only allowed path is not a real runtime activation — it performs no network call, no env/session read, and no Supabase/DB/live-KIS/LLM access.

## 11. Data and payload policy

A future implementation phase must ensure this panel:

- Never displays a raw provider payload of any kind.
- Never displays a raw KIS payload.
- Never displays account, order, balance, or trading data.
- Never displays a user email address.
- Never displays a JWT, session token, cookie, or header value.
- Never displays a raw Supabase row.
- Never displays a private/identifying user identifier.
- Displays only the scaffold's own sanitized decision fields: `allowed`, `audience`, `providerMode`, `agentMode`, `reasons`, `blockedBoundaries`, `requiredApprovals`, `failClosed`, `safetyCopy`, and non-sensitive `diagnostics` fields already produced by the scaffold (e.g. flag names, never real credentials).

## 12. Accessibility and responsive readiness

Planning criteria for a future implementation phase:

- Must render correctly at a PC viewport width (matching the 1280px precedent from Phase 3FF-A-UI-B).
- Must render correctly at a mobile viewport width (matching the 375px precedent from Phase 3FF-A-UI-B).
- Must not introduce horizontal overflow at either width.
- Korean labels must remain fully readable, not truncated or clipped, at both widths.
- Must avoid any button or CTA element that implies an executable action, consistent with Section 10.
- Status text must use screen-reader-friendly labels if and when this panel is actually implemented (e.g. explicit `aria-label` or visible text, not icon-only status).
- Status must be conveyed through explicit text/label semantics, not through color alone.
- Color must not be the sole indicator of allowed/blocked status — a text label (e.g. "허용"/"차단") must always accompany any color treatment.

## 13. Failure and empty states

A future implementation phase must define fail-closed UI behavior for each of the following conditions — in every case, the panel must default to hidden or to a generic blocked display, never to a visible "allowed"-looking state:

| Condition | Required UI behavior |
| --- | --- |
| Scaffold module unavailable (import fails) | Panel does not render; no error detail is shown to the end user. |
| Decision object missing | Panel renders a generic blocked state, not an allowed state. |
| Malformed decision object (missing expected fields) | Panel renders a generic blocked state; never guesses or fabricates a missing field's value. |
| Missing `safetyCopy` | Panel does not render as allowed; treated as a malformed decision. |
| Missing `blockedBoundaries` on a blocked decision | Panel still renders as blocked; absence of boundary copy never implies a broader allowed state. |
| Unexpected `allowed: true` outside the single known scaffold-only path | Panel renders a blocked/error state rather than trusting an unexpected allowed value. |
| Any real gate observed `true` in `diagnostics.flags` | Panel renders a blocked/error state; never displays or acts on a real-gate-enabled decision. |
| Unknown `audience`, `providerMode`, or `agentMode` value | Panel renders a generic blocked state, consistent with the scaffold's own unrecognized-audience handling. |

## 14. Non-goals

Phase 3FG-C explicitly does not include:

- No implementation of any UI behavior described in this plan.
- No change to `/chart-ai` (`src/pages/chart-ai.astro`).
- No API route.
- No scaffold source change.
- No dev server run, no browser QA.
- No live KIS.
- No LLM.
- No Supabase/DB/auth/session/JWT.
- No public/beta activation.
- No deploy, no push.

## 15. Future implementation phase proposal

Recommended next phase: **Phase 3FG-D — Owner-local Guarded Productization UI Static Shell, Hidden by Default, No Runtime Activation.**

This phase would implement only the static, hidden-by-default UI shell described in Sections 6–8 above (markup and state-mapping display logic, still fed by the existing fixture builders), while continuing to defer all of the following to their own separately approved phases: live KIS, LLM, public/beta activation, real Supabase/DB/auth/session/JWT, usage deduction, paid entitlement, ad unlock, deploy, and push.

## 16. Approval gates

The following must be separately approved before any later phase may activate them, unchanged from the Phase 3FG-A-PLAN approval-gate list:

- UI wiring (i.e., the actual `/chart-ai` markup/script change implementing Sections 6–8).
- API route wiring.
- Real auth runtime.
- Usage deduction.
- Cache/audit persistence.
- Live KIS.
- LLM.
- Beta/public activation.
- Deploy/push.

No approval recorded for one item in this list authorizes any other item on this list.

## 17. Validation plan

The following commands should pass for this planning phase:

```
npm run check:phase-3fg-c
npm run check:phase-3fg-b
npm run smoke:phase-3fg-a
npm run check:phase-3fg-a
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
git diff --name-only 172e146 -- src/pages/chart-ai.astro src/lib/server/chart-ai/guarded-productization-scaffold.mjs src/lib/server/chart-ai/guarded-productization-scaffold.fixture.mjs src/lib/server/chart-ai/mk-agent.mjs src/lib/server/chart-ai/mk-agent.fixture.mjs src/lib/server/chart-ai/similar-pattern-agent.mjs src/lib/server/chart-ai/similar-pattern-agent.fixture.mjs pages/api src/pages/api components supabase src/data package-lock.json pnpm-lock.yaml yarn.lock .env .env.local
```
