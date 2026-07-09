# Phase 3FG-B — Owner-local Guarded Productization QA, All Real Gates Off — Checklist v0.1

## 1. Phase name

Phase 3FG-B — Owner-local Guarded Productization QA, All Real Gates Off.

## 2. Baseline and prior phase

- Baseline: `7a3ed70`.
- Latest completed phase before this QA phase: Phase 3FG-A.
- Branch: `rebuild/phase-1-ia-shell`.

## 3. QA objective

Perform and document owner-local, command-line-only QA for the Phase 3FG-A guarded productization scaffold (`src/lib/server/chart-ai/guarded-productization-scaffold.mjs` and `guarded-productization-scaffold.fixture.mjs`), confirming that every real productization gate remains off, that the only reachable `allowed: true` path is the narrow owner-local scaffold-only fixture path, and that every other audience/provider/agent/gate combination fails closed with correct blocked-boundary and required-approval reporting.

## 4. QA environment

- Node (project-pinned engine, `>=22.12.0`), invoked directly via `node --input-type=module`.
- No dev server started.
- No browser used.

## 5. Explicit scope statement

- Command-line QA only.
- No browser QA.
- No UI wiring.
- No API route activation.
- No live KIS.
- No LLM.
- All real gates off throughout this phase; the only exercised `allowed: true` path is the single scaffold-only owner-local fixture path with explicit `scaffoldOnlyAcknowledged: true`, which is not a real runtime activation.

This QA pass was performed as command-line QA only, with no UI wiring and no API route activation of any kind; all real gates off for the full duration. It exercised the beta attempt, public attempt, live KIS attempt, LLM attempt, and real auth attempt fixtures alongside the default and owner-local fixtures, and every non-scaffold-only outcome remained fail-closed and deterministic.

## 6. QA checklist table

| # | Case | Expected result | Outcome |
| --- | --- | --- | --- |
| 1 | Default fixture | `allowed: false`, `failClosed: true`, `safetyCopy` present, `blockedBoundaries` includes No live KIS / No LLM / No public/beta activation | PASS |
| 2 | Owner-local fixture without `scaffoldOnlyAcknowledged` | `allowed: false`, `failClosed: true`, reason states scaffold-only acknowledgement is required | PASS |
| 3 | Owner-local fixture with explicit `scaffoldOnlyAcknowledged: true` | `allowed: true`, `failClosed: false`, audience `owner-local`, providerMode `synthetic_fixture`, agentMode `deterministic_fixture`, all real gates except `ownerLocalEnabled` false; documented as scaffold-only, not a real runtime activation | PASS |
| 4 | Beta attempt | `allowed: false`, `failClosed: true`, required approval includes beta/public activation approval | PASS |
| 5 | Public attempt | `allowed: false`, `failClosed: true`, required approval includes beta/public activation approval | PASS |
| 6 | Live KIS attempt | `allowed: false`, `failClosed: true`, required approval includes Live KIS approval, no live KIS call occurs | PASS |
| 7 | LLM attempt | `allowed: false`, `failClosed: true`, required approval includes LLM approval, no LLM call occurs | PASS |
| 8 | Real auth attempt | `allowed: false`, `failClosed: true`, required approval includes real auth runtime approval, no env/session/JWT/cookie/header parsing occurs | PASS |
| 9 | `assertNoRuntimeActivation` | Default flags do not throw; any real gate `true` throws | PASS |
| 10 | Determinism | Repeated evaluation of the same input returns identical JSON | PASS |
| 11 | Safety copy | Includes 참고용, 매수·매도 추천이 아닙니다, 투자 자문이 아닙니다, 과거 유사 흐름은 미래 성과를 보장하지 않습니다 | PASS |
| 12 | Forbidden language | No approved recommendation phrasing from the 8-phrase forbidden investment language list (defined in `scripts/smoke_phase_3fg_a_guarded_productization_scaffold_all_gates_off.mjs`) present in any decision or summary output | PASS |
| 13 | Source boundary check | No fetch, process.env, createClient, cookies, headers, JWT parsing, OpenAI/Anthropic/Gemini, KIS provider credential/token-like identifiers, Math.random, Date.now | PASS |

All 13 QA cases executed against the deterministic scaffold exports; all 13 produced the expected result with no deviation.

## 7. Boundary preservation checklist

- [x] No change to `src/pages/chart-ai.astro`.
- [x] No change to `src/lib/server/chart-ai/guarded-productization-scaffold.mjs`.
- [x] No change to `src/lib/server/chart-ai/guarded-productization-scaffold.fixture.mjs`.
- [x] No change to `src/lib/server/chart-ai/mk-agent.mjs` / `mk-agent.fixture.mjs`.
- [x] No change to `src/lib/server/chart-ai/similar-pattern-agent.mjs` / `similar-pattern-agent.fixture.mjs`.
- [x] No API route created or changed (`pages/api`, `src/pages/api`).
- [x] No change to `components/`, `supabase/`, `src/data/`.
- [x] No lockfile change.
- [x] No `.env` / `.env.local` read or write.
- [x] No live KIS call. No LLM call. No public/beta activation. No deploy. No push.
- [x] Known unrelated untracked paths (`.agents/`, `.claude/`, `.vscode/settings.json`, `docs/handoff/codex_state_inspection/`, `skills-lock.json`) left untouched.

## 8. Forbidden diff checklist

Command:

```
git diff --name-only 7a3ed70 -- src/pages/chart-ai.astro src/lib/server/chart-ai/guarded-productization-scaffold.mjs src/lib/server/chart-ai/guarded-productization-scaffold.fixture.mjs src/lib/server/chart-ai/mk-agent.mjs src/lib/server/chart-ai/mk-agent.fixture.mjs src/lib/server/chart-ai/similar-pattern-agent.mjs src/lib/server/chart-ai/similar-pattern-agent.fixture.mjs pages/api src/pages/api components supabase src/data package-lock.json pnpm-lock.yaml yarn.lock .env .env.local
```

Expected: empty. Result: empty (confirmed).

## 9. Validation command list

```
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

## 10. Pass/fail criteria

This phase passes if and only if:

- All 13 QA cases above produce their expected result with no deviation.
- `scripts/check_phase_3fg_b_contract.mjs` passes with 0 failures.
- Every command in Section 9 passes.
- The forbidden diff check in Section 8 returns empty.
- No forbidden investment language, mojibake, or secret-like token appears in any new document or checker.
- No file outside the allowed create/modify set (Section 9 of the result document) changed since baseline `7a3ed70`.

## 11. Next recommended phase

Phase 3FG-C — Owner-local Guarded Productization UI Readiness Plan, No Runtime Wiring.

Rationale: all 13 QA cases passed with no deviation and no defect was found in the Phase 3FG-A scaffold. The two candidate next phases were "Owner-local Guarded Productization UI Readiness Plan, No Runtime Wiring" and "Usage/Cache/Cost/Audit Mocked Runtime Plan"; the UI Readiness Plan is the safer choice because it remains planning-only (no runtime wiring, no mocked-store implementation) and produces a written design for how the already-QA'd scaffold-only path would eventually surface in the UI, before any phase begins implementing runtime behavior (mocked or otherwise) against it. This keeps the system's active surface area unchanged for one more phase while the next concrete step is designed on paper first.
