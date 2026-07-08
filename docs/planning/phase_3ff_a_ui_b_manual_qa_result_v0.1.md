# Phase 3FF-A-UI-B — Owner-local Manual QA Result

## 1. Status

Executed.

## 2. Purpose

Record the result of owner-local manual QA for the deterministic agent panel (Similar Pattern Agent + MK Agent) added to `/chart-ai` in Phase 3FF-A-UI-A. This phase is QA/documentation/checker work only — no new product behavior, no engine changes, no API route changes, no live KIS, no LLM, no public/beta activation, no deploy, no push.

## 3. Baseline

- Baseline: `a32a52c`.
- Latest completed phase before UI-B: Phase 3FF-A-UI-A.
- Branch: `rebuild/phase-1-ia-shell`.

## 4. QA scope actually performed

- Started the existing local dev server via `npm run dev` (no new browser automation packages installed) and drove it with real browser automation (`mcp__Claude_Preview__*`) against `http://localhost:4321`.
- Verified default `/chart-ai` (no query string) keeps the deterministic-agents panel hidden — default /chart-ai unchanged for any visitor who does not supply the owner-local opt-in query parameter — and leaves the default mocked/sample experience unchanged.
- Verified the owner-local opt-in URL `/chart-ai?ownerLocalDeterministicAgents=1` on `localhost` reveals the panel with the required id, heading, and safety copy.
- Verified the Similar Pattern Agent panel's visible fields and disclaimer against the checklist (Section 8 of `phase_3ff_a_ui_b_manual_qa_checklist_v0.1.md`).
- Verified the MK Agent panel's visible fields, required Korean strings, and disclaimer against the checklist (Section 9).
- Verified existing Chart AI tabs (유사 패턴 분석 보기 / MK AI 분석 보기), analysis trigger cards, and the pre-existing owner-local panels (`ownerLocalMocked`, `ownerLocalAuthUsageBridge`, `ownerLocalSimilarPatternRoute`) remain present and functional.
- Verified responsive layout at a real desktop viewport (1280×900) and a real mobile viewport (375×812), including explicit overflow measurement (`scrollWidth`/`clientWidth` comparisons and `boundingClientRect` extraction), not screenshot impression alone.
- Verified network and console activity throughout: 0 console errors observed at any step; no KIS-domain, LLM-provider, or agent-route network call was triggered by the deterministic panel at any point.
- Ran the full negative/safety scan (mojibake list, forbidden-investment-phrase list, secret-pattern list, email-like/JWT-like/stack-trace/raw-JSON-dump patterns) against the rendered page and panel HTML.

## 5. QA scope not performed

None. All 7 required QA scenarios (default page safety; owner-local opt-in; Similar Pattern Agent panel; MK Agent panel; existing tab/regression; responsive PC+mobile visual QA; negative/safety checks) were executed with real browser evidence. No scenario was skipped or downgraded to static/code-only verification.

## 6. Evidence summary

- **Default `/chart-ai`:** `#chartAiOwnerLocalDeterministicAgentsPanel` present in DOM with `hidden: true`; `#chartAiOwnerLocalMockedPanel` hidden; `#chartAiOwnerLocalAuthUsageBridgePanel` hidden; `window.location.hostname === "localhost"`; page title `종목 차트 | MK Stock Lab`; network capture showed no KIS/LLM/agent-route call attributable to the deterministic panel; 0 console errors.
- **Owner-local opt-in URL:** navigating to `/chart-ai?ownerLocalDeterministicAgents=1` flips the panel to `hidden: false`; heading text includes `Owner-local 결정형 에이전트`; panel innerHTML length 6313 characters; all 6 required safety strings present (`Fixture only`, `No live KIS`, `No LLM`, `No public activation`, `실제 KIS 데이터가 아닙니다`, `LLM을 호출하지 않습니다`); 0 console errors; no additional network call fired by the opt-in itself (panel is server-rendered, opt-in only toggles a `hidden` attribute client-side).
- **Similar Pattern Agent panel:** DOM-extracted field values — 시장: `KR`; 종목코드: `005930`; 기준 구간(baseWindow): `20일`; Top-K: `5`; 매칭 개수: `5건`; 최고 유사 구간 점수: `99.97점`; 최고 유사 구간 라벨: `매우 유사`; D5 평균 수익률: `+4.54% (긍정 5 · 부정 0)`; D20 평균 수익률: `+6.03% (긍정 5 · 부정 0)`; disclaimer `과거 유사 흐름 기반 참고 정보이며, 미래 수익률을 보장하지 않습니다. 투자 판단의 책임은 본인에게 있습니다.`; no raw JSON, no raw KIS payload, no provider error text present.
- **MK Agent panel:** `<h4>MK 에이전트</h4>` present; guide text lists all 7 report sections (구간·수급, 전략 체크포인트, 가격 패턴, 기술적 지표, 지지·저항, 유사 과거 흐름, 리스크 체크); `oneLineSummary` = `MK 에이전트 기준으로 삼성전자은 과거 5개 유사 흐름과 비교 가능한 상태예요. 다만 과거 유사도는 미래를 예측하지 않아요.` (grammar defect noted in Section 8 below); 3 summary bullets present; 7 `<h5>` report sections each with paragraph + bullets, including 전략 체크포인트 price-checkpoint language (`72,000원은 하단 관찰 체크포인트로만 볼게요, 75,000원은 중간 시나리오 체크포인트로만 볼게요, 78,000원은 상단 관찰 체크포인트로만 볼게요.`); `usageNotice` = `오픈베타에서는 계정당 하루 3회까지 사용할 수 있어요.` (exact match); `disclaimer` = `이 분석은 참고용이며 매수·매도 추천이 아닙니다. 투자 자문이 아닙니다. 최종 투자 판단의 책임은 이용자 본인에게 있습니다.`; all 6 required Korean strings (`MK 에이전트`, `전략 체크포인트`, `오픈베타에서는 계정당 하루 3회까지 사용할 수 있어요.`, `참고용`, `매수·매도 추천이 아닙니다`, `투자 자문이 아닙니다`) confirmed present verbatim.
- **PC layout (1280×900):** panel `boundingBox.width = 1063.2px` inside `document.body.clientWidth = 1265px`; `document.body.scrollWidth === document.body.clientWidth` (no horizontal overflow); 0 elements inside the panel with `scrollWidth > clientWidth`; screenshot captured and reviewed; existing chart/sidebar layout intact.
- **Mobile layout (375×812):** `document.body.scrollWidth === document.body.clientWidth === 375`; panel `boundingBox.width ≈ 305.175px`; 0 overflowing elements; screenshots captured of the panel content, the long-text 전략 체크포인트 section (clean wrap, no clipping), and the page header/sample-chart area (no collapse of existing layout).
- **Existing tab/regression checks:** clicking `MK AI 분석 보기` and back to `유사 패턴 분석 보기` correctly toggled `.hidden` and `aria-selected` on both tab panels; both `.chart-analysis-trigger-card` elements found (유사 패턴 분석 시작, MK AI 분석 시작) and a light click test produced 0 console errors and did not alter the deterministic panel's state; `ownerLocalSimilarPatternRoute` notice section and its `KIS 시세 프리뷰 확인` / `KIS 차트 프리뷰 확인` buttons confirmed present via full-page snapshot.
- **Safety checks:** full-page HTML scanned for the exact 10-pattern mojibake list — 0 matches; exact 8-phrase forbidden-investment-language list — 0 matches; panel-scoped scan for secret-like substrings (`sk-`, `Bearer `, `api_key`, `apiKey`, `APP_KEY`, `APP_SECRET`, `SUPABASE_SERVICE`, `password`, `secret`, `private_key`) — 0 matches; email-like pattern — 0 matches; JWT-like pattern — 0 matches; stack-trace pattern — not present; raw-JSON-dump pattern — not present.

## 7. Validation results

| Command | Result |
|---|---|
| `npm run check:phase-3ff-a-ui-b-manual-qa` | PASS |
| `npm run smoke:phase-3ff-a-ui-a` | PASS |
| `npm run check:phase-3ff-a-ui-a` | PASS |
| `npm run smoke:phase-3ff-a-mk-a` | PASS |
| `npm run check:phase-3ff-a-mk-a` | PASS |
| `npm run smoke:phase-3ff-a-sp-a` | PASS |
| `npm run check:phase-3ff-a-sp-a` | PASS |
| `npm run check:phase-3ff-a-plan` | PASS |
| `npm run build` | PASS |
| `git diff --check` | PASS (no whitespace-conflict errors) |
| `git status --short` | Reviewed — only Phase 3FF-A-UI-B allowed files and pre-existing untracked paths present |
| `git diff --name-only a32a52c -- src/pages/chart-ai.astro pages/api src/pages/api components src/lib/server/chart-ai supabase src/data package-lock.json pnpm-lock.yaml yarn.lock .env .env.local` | Empty output (no forbidden path changed) |

Full command transcripts are attached to this phase's execution log in the working session; the table above reflects the final observed status of each command, re-run after all Phase 3FF-A-UI-B deliverable files, checker patches, package.json script, and changelog entry were in place.

Two categories of validator-compatibility patches (checker files only, no product/engine/API changes) were required to reach the all-PASS state above, both within the "validator compatibility checker files only if absolutely necessary" allowance for this phase:

- `scripts/check_phase_3ff_a_ui_a_contract.mjs` hard-asserted that its own changelog entry must be the very first `## ` entry in `planning_changelog.md`. Prepending the required `## Phase 3FF-A-UI-B - 2026-07-08` entry above it (per this phase's own changelog instructions) broke that assertion. Fixed by narrowing the assertion to tolerate exactly one known header above the UI-A entry — the UI-B QA entry — while still failing if any other/unexpected header appears there.
- `scripts/check_phase_3ff_a_mk_a_contract.mjs`, `scripts/check_phase_3ff_a_sp_a_contract.mjs`, and `scripts/check_phase_3ff_a_plan_contract.mjs` each already tolerated the `src/pages/chart-ai.astro` diff from Phase 3FF-A-UI-A, but had never been updated to tolerate UI-A's own `phase_3ff_a_ui_a_result_v0.1.md` / `check_phase_3ff_a_ui_a_contract.mjs` / `smoke_phase_3ff_a_ui_a_owner_local_deterministic_agent_ui_wiring.mjs` files in their own scope checks. This gap pre-dates Phase 3FF-A-UI-B (it was left over from Phase 3FF-A-UI-A's own downstream-checker patch step) and was only surfaced now because this phase is the first to re-run the full sibling validation chain. Fixed by adding the same three UI-A file paths to each checker's `allowedFiles` set, mirroring the existing `chart-ai.astro` tolerance.

## 8. Known out-of-scope issue

- **Minor MK Agent copy defect (non-blocking, newly discovered during this QA pass):** the MK Agent `oneLineSummary` fixture output reads `"MK 에이전트 기준으로 삼성전자은 과거 5개 유사 흐름과 비교 가능한 상태예요."` — the topic-marker particle should be `는`, not `은` (`삼성전자는`), because `삼성전자` ends in a vowel sound. This is a content-quality defect in the MK Agent source/fixture layer, not in `src/pages/chart-ai.astro` (which only renders the value it receives). It does not violate any safety/policy boundary, does not affect functionality, and is judged not to be a "critical blocker" under this phase's own threshold for requiring an HF instead of QA-only documentation — fixing it would require touching MK Agent source/fixture files, which are explicitly out of scope for this QA-only phase. Recommended as a small follow-up hotfix (e.g., `MK-A-HF2`) or as part of `MK-B` content polish.
- **Known pre-existing, causally-unrelated failure:** `npm run check:phase-3fd-j-handoff-chart-ai-new-chat-package` is already documented (in `docs/planning/phase_3ff_a_ui_a_result_v0.1.md`, Section 9) as failing independently of Phase 3FF-A-UI-A/UI-B, because the `## Phase 3FD-J-HANDOFF - 2026-07-04` changelog entry has moved past the first 3000 characters of `docs/planning/planning_changelog.md` as later phase entries were prepended above it. This checker is not part of Phase 3FF-A-UI-B's required validation chain; it is recorded here for continuity only, and is neither caused by nor fixed by this phase.

## 9. Boundary preservation

- No API route changed.
- No default UI behavior changed.
- No live KIS call occurred.
- No LLM call occurred.
- No MK AI route activation occurred.
- No Supabase client was created.
- No DB connection occurred.
- No env/session/JWT/cookie/header parsing occurred.
- No public/beta activation occurred.
- No dependency/lockfile change occurred.
- No deploy/push occurred.

## 10. Next recommended phase

QA passed with no blocker. Recommended next steps, in order of priority:

1. **SP-B** and/or **MK-B** — the next planned functional phases for Similar Pattern Agent and MK Agent, now that owner-local UI wiring has passed manual QA.
2. Optional small hotfix (`MK-A-HF2` or equivalent) to correct the `삼성전자은` → `삼성전자는` particle defect noted in Section 8, if the team wants it resolved before SP-B/MK-B rather than folded into that work.
3. Any future live-KIS, LLM, or public/beta activation phase remains gated behind separate, explicit approval and is not recommended as an immediate next step from this QA phase alone.
