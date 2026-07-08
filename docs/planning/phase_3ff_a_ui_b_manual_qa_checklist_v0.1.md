# Phase 3FF-A-UI-B — Owner-local Manual QA Checklist for the Deterministic Agent Panel

## 1. Status

Executed. All checklist items below were run against a live local dev server (`npm run dev`, `http://localhost:4321`) using real browser automation (DOM inspection, console/network capture, screenshots at PC and mobile widths). Results are recorded inline in each section and summarized in Section 14.

## 2. Purpose

Perform and document owner-local manual QA for the deterministic agent panel (Similar Pattern Agent + MK Agent) added to `/chart-ai` in Phase 3FF-A-UI-A. This is QA/documentation/checker work only — no new product behavior, no engine changes, no API route changes, no live KIS, no LLM, no public/beta activation, no deploy, no push.

## 3. Baseline

- Baseline: `a32a52c`.
- Latest completed phase before UI-B: Phase 3FF-A-UI-A.
- Branch: `rebuild/phase-1-ia-shell`.

## 4. Preconditions

- Local dev server started via the existing `npm run dev` script only. No new browser automation packages installed.
- QA performed against `localhost` (hostname `localhost`, port 4321), satisfying `isLocalOwnerHostname()`.
- Default mocked Chart AI access capability (`mockedChartAiAccess.capabilities.canAccessChartAi`) left at its existing default — not modified for this QA.
- No `.env` or `.env.local` file was read or written.
- No real session/JWT/cookie/header values were parsed; no Supabase client was created; no DB connection was made.
- No live KIS call and no LLM call occurred during QA — confirmed via network capture (Section 6, Section 7).

## 5. Safety boundaries

- No live KIS. No LLM. No public/beta activation.
- No API route changed or exercised beyond the existing mocked/local execution paths already shipped before this phase.
- No `src/pages/chart-ai.astro` change was made during this QA phase.
- No Similar Pattern Agent or MK Agent source/fixture change was made during this QA phase.
- default /chart-ai unchanged for any visitor who does not supply the owner-local opt-in query parameter on localhost.
- The deterministic-agents panel is reachable only via `ownerLocalDeterministicAgents=1` on a local owner hostname; this was verified, not assumed.

## 6. Default `/chart-ai` QA checklist

| # | Check | Result |
|---|-------|--------|
| 6.1 | Navigate to `http://localhost:4321/chart-ai` (no query string) | PASS |
| 6.2 | `#chartAiOwnerLocalDeterministicAgentsPanel` exists in the DOM (server-rendered) | PASS — exists |
| 6.3 | `#chartAiOwnerLocalDeterministicAgentsPanel.hidden === true` | PASS — `hidden: true` |
| 6.4 | Default sample/mocked Chart AI experience (search box, sample chart, 유사 패턴/MK AI tabs) renders unchanged | PASS |
| 6.5 | No public/beta activation of the deterministic panel occurs | PASS |
| 6.6 | Network capture shows no KIS-domain, LLM-provider-domain, or agent-route fetch caused by the deterministic panel | PASS — only static dev assets, pre-existing ad/auth assets, and pre-existing Supabase site-settings/banner calls unrelated to the deterministic panel were observed |
| 6.7 | No console errors on load | PASS — 0 console errors |

## 7. Owner-local opt-in QA checklist

| # | Check | Result |
|---|-------|--------|
| 7.1 | Navigate to `http://localhost:4321/chart-ai?ownerLocalDeterministicAgents=1` on `localhost` | PASS |
| 7.2 | `#chartAiOwnerLocalDeterministicAgentsPanel` becomes visible (`hidden === false`) | PASS |
| 7.3 | Panel heading text includes `Owner-local 결정형 에이전트` | PASS |
| 7.4 | Safety label `Fixture only` present | PASS |
| 7.5 | Safety label `No live KIS` present | PASS |
| 7.6 | Safety label `No LLM` present | PASS |
| 7.7 | Safety label `No public activation` present | PASS |
| 7.8 | Safety copy `실제 KIS 데이터가 아닙니다` present | PASS |
| 7.9 | Safety copy `LLM을 호출하지 않습니다` present | PASS |
| 7.10 | Activating the opt-in triggers no additional network fetch (panel is server-rendered; activation only toggles `.hidden`) | PASS — confirmed via network capture before/after opt-in navigation |
| 7.11 | No console errors after opt-in activation | PASS — 0 console errors |

## 8. Similar Pattern Agent panel checklist

| # | Check | Result |
|---|-------|--------|
| 8.1 | `<h4>Similar Pattern Agent</h4>` present inside `#chartAiOwnerLocalDeterministicAgentsPanel` | PASS |
| 8.2 | market field visible (`시장` → `KR`) | PASS |
| 8.3 | symbol field visible (`종목코드` → `005930`) | PASS |
| 8.4 | baseWindow field visible (`기준 구간(baseWindow)` → `20일`) | PASS |
| 8.5 | topK field visible (`Top-K` → `5`) | PASS |
| 8.6 | match count field visible (`매칭 개수` → `5건`) | PASS |
| 8.7 | top match score field visible (`최고 유사 구간 점수` → `99.97점`) | PASS |
| 8.8 | top match label field visible (`최고 유사 구간 라벨` → `매우 유사`) | PASS |
| 8.9 | D5 outcome summary visible (`D5 평균 수익률` → `+4.54% (긍정 5 · 부정 0)`) | PASS |
| 8.10 | D20 outcome summary visible (`D20 평균 수익률` → `+6.03% (긍정 5 · 부정 0)`) | PASS |
| 8.11 | Reference-only disclaimer present (`과거 유사 흐름 기반 참고 정보이며, 미래 수익률을 보장하지 않습니다.`) | PASS |
| 8.12 | No guaranteed-future-return language | PASS |
| 8.13 | No raw JSON dump in the panel markup | PASS — no `{"key":` pattern detected |
| 8.14 | No raw KIS payload rendered | PASS |
| 8.15 | No provider error text/stack trace rendered | PASS |

## 9. MK Agent panel checklist

| # | Check | Result |
|---|-------|--------|
| 9.1 | `<h4>MK 에이전트</h4>` present | PASS |
| 9.2 | `oneLineSummary` visible | PASS — "MK 에이전트 기준으로 삼성전자은 과거 5개 유사 흐름과 비교 가능한 상태예요. 다만 과거 유사도는 미래를 예측하지 않아요." (see Section 15 for a minor grammar defect noted in this exact string) |
| 9.3 | Summary bullets list visible (3 items) | PASS |
| 9.4 | Report sections visible (7 sections: 구간·수급, 전략 체크포인트, 가격 패턴, 기술적 지표, 지지·저항, 유사 과거 흐름, 리스크 체크) | PASS |
| 9.5 | `전략 체크포인트` section present | PASS |
| 9.6 | `usageNotice` visible — exact string `오픈베타에서는 계정당 하루 3회까지 사용할 수 있어요.` | PASS |
| 9.7 | `disclaimer` visible, includes `참고용` | PASS |
| 9.8 | `disclaimer` includes `매수·매도 추천이 아닙니다` | PASS |
| 9.9 | `disclaimer` includes `투자 자문이 아닙니다` | PASS |
| 9.10 | Required string `MK 에이전트` present | PASS |
| 9.11 | Required string `전략 체크포인트` present | PASS |
| 9.12 | Required string `오픈베타에서는 계정당 하루 3회까지 사용할 수 있어요.` present | PASS |
| 9.13 | Required string `참고용` present | PASS |
| 9.14 | Required string `매수·매도 추천이 아닙니다` present | PASS |
| 9.15 | Required string `투자 자문이 아닙니다` present | PASS |

## 10. Existing tab/regression checklist

| # | Check | Result |
|---|-------|--------|
| 10.1 | `유사 패턴 분석 보기` tab exists and is clickable | PASS |
| 10.2 | `MK AI 분석 보기` tab exists and is clickable | PASS |
| 10.3 | Clicking `MK AI 분석 보기` shows its panel and hides the similarity panel (`aria-selected` toggles correctly) | PASS |
| 10.4 | Clicking back to `유사 패턴 분석 보기` restores the original tab state | PASS |
| 10.5 | Analysis trigger cards (`유사 패턴 분석 시작`, `MK AI 분석 시작`) exist and render | PASS |
| 10.6 | Clicking an analysis trigger card produces no console error and does not affect the deterministic-agents panel state | PASS |
| 10.7 | `#chartAiOwnerLocalMockedPanel` (`ownerLocalMocked`) still exists in the DOM | PASS — exists, hidden by default (its own opt-in not supplied) |
| 10.8 | `#chartAiOwnerLocalAuthUsageBridgePanel` (`ownerLocalAuthUsageBridge`) still exists in the DOM | PASS — exists, hidden by default (its own opt-in not supplied) |
| 10.9 | `ownerLocalSimilarPatternRoute` notice section (KIS 연결 프리뷰) still exists in the DOM | PASS — exists |

## 11. PC visual checklist

| # | Check | Result |
|---|-------|--------|
| 11.1 | Viewport set to 1280×900 (desktop) | PASS |
| 11.2 | Deterministic-agents panel renders at near-full content width (1063px measured within a 1280px viewport) | PASS |
| 11.3 | No horizontal page overflow (`document.body.scrollWidth === document.body.clientWidth`) | PASS — 1265px === 1265px |
| 11.4 | No element inside the panel has `scrollWidth > clientWidth` | PASS — 0 overflowing elements |
| 11.5 | Screenshot taken and visually reviewed; long Korean paragraphs and `<dl>` field rows render cleanly | PASS |
| 11.6 | Existing chart/sidebar layout unaffected | PASS |

## 12. Mobile visual checklist

| # | Check | Result |
|---|-------|--------|
| 12.1 | Viewport set to 375×812 (mobile) | PASS |
| 12.2 | No horizontal page overflow (`document.body.scrollWidth === document.body.clientWidth`) | PASS — 375px === 375px |
| 12.3 | No element inside the panel has `scrollWidth > clientWidth` | PASS — 0 overflowing elements |
| 12.4 | Long Korean text (price-checkpoint sentences in `전략 체크포인트` / `지지·저항`) wraps without overflow or clipping | PASS — screenshot reviewed |
| 12.5 | `<dl>` field rows (market/symbol/baseWindow/etc.) remain readable at narrow width | PASS — screenshot reviewed |
| 12.6 | Existing nav bar, search box, and sample chart card render without collapse above the new panel | PASS — screenshot reviewed |

## 13. Negative/safety checklist

Scanned the full rendered page (`document.documentElement.outerHTML`) and the deterministic-agents panel specifically.

| # | Check | Result |
|---|-------|--------|
| 13.1 | No corrupted-encoding (mojibake) byte-sequence pattern present — the same standard 10-pattern corrupted-encoding list used by the Phase 3FF-A-UI-A checker (one Unicode replacement character plus 9 known corrupted Korean/CJK fragments) | PASS — 0 matches |
| 13.2 | No forbidden direct-investment-instruction phrase present — the same standard 8-phrase forbidden list used by the Phase 3FF-A-PLAN design doc (imperative buy/sell instructions, explicit target/stop price claims, guaranteed-direction claims) | PASS — 0 matches |
| 13.3 | No secret-like pattern present in the panel (`sk-`, `Bearer `, `api_key`, `apiKey`, `APP_KEY`, `APP_SECRET`, `SUPABASE_SERVICE`, `password`, `secret`, `private_key`) | PASS — 0 matches |
| 13.4 | No raw email-like value in the panel | PASS — 0 matches |
| 13.5 | No JWT-like value in the panel | PASS — 0 matches |
| 13.6 | No raw provider payload (`{"key":`-style JSON dump) in the panel | PASS — 0 matches |
| 13.7 | No stack trace pattern in the panel | PASS — 0 matches |

## 14. Pass/fail recording table

| Scenario | Section | Result |
|---|---|---|
| 1. Default page safety | 6 | PASS |
| 2. Owner-local opt-in | 7 | PASS |
| 3. Similar Pattern Agent panel | 8 | PASS |
| 4. MK Agent panel | 9 | PASS (see Section 15 for a non-blocking copy defect) |
| 5. Existing tabs/regression | 10 | PASS |
| 6. PC visual QA | 11 | PASS |
| 7. Mobile visual QA | 12 | PASS |
| 8. Negative/safety checks | 13 | PASS |

Overall: PASS. No blocker found. No `src/pages/chart-ai.astro` change was required.

## 15. Known out-of-scope issue

- **Minor MK Agent copy defect (non-blocking):** the MK Agent `oneLineSummary` fixture output reads `"MK 에이전트 기준으로 삼성전자은 과거 5개 유사 흐름과 비교 가능한 상태예요."` — the particle `은` should be `는` (`삼성전자는`), since `삼성전자` ends in a vowel sound and takes `는`, not the consonant-ending form `은`. This is a content-quality defect in the MK Agent fixture/report source (not in `src/pages/chart-ai.astro`, which only renders the value it is given). Fixing it would require touching MK Agent source/fixture files, which are out of scope for this QA-only phase. It does not violate any safety/policy boundary, does not affect functionality, and does not block this phase's PASS status. Recommended for a future MK-A follow-up hotfix (naming convention: `MK-A-HF2` or equivalent) or as part of `MK-B` content polish.
- **Known pre-existing, causally-unrelated failure:** `npm run check:phase-3fd-j-handoff-chart-ai-new-chat-package` was already documented as failing independently of Phase 3FF-A-UI-A (see `docs/planning/phase_3ff_a_ui_a_result_v0.1.md`, Section 9) because the `## Phase 3FD-J-HANDOFF - 2026-07-04` changelog entry no longer stays within the first 3000 characters of `docs/planning/planning_changelog.md` after later phases were prepended above it. This checker is not part of Phase 3FF-A-UI-B's required validation chain and is not caused by, or fixed by, this phase.
