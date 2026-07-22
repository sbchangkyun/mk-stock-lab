# Phase 3FF-A-UI-C — Owner-local Browser QA Checklist (SP-B/MK-C Improved Deterministic Panel Output)

## 1. Status

Executed.

## 2. Purpose

Perform owner-local browser QA for the deterministic Chart AI panel after Phase 3FF-A-SP-B and Phase 3FF-A-MK-C improvements. This checklist verifies that the owner-local deterministic panel correctly displays the improved MK Agent output that now consumes the SP-B Similar Pattern contract fields: `confidenceScore` / `confidenceLabel`, `patternQuality`, `outcomeDistribution`, `matchReasonTags`, `contractSummary`-derived summaries, historical limitation copy, and the Korean grammar fix `삼성전자는`. This phase is QA/documentation/checker work only.

## 3. Baseline

- Current baseline before UI-C: `86050be`.
- Latest completed phase before UI-C: Phase 3FF-A-MK-C.
- Branch: `rebuild/phase-1-ia-shell`.

## 4. Preconditions

- Working tree clean at `86050be` except known unrelated untracked paths (`.agents/`, `.claude/`, `.vscode/settings.json`, `docs/handoff/codex_state_inspection/`, `skills-lock.json`).
- Local dev server (`npm run dev`, Astro, port 4321) reachable at `http://localhost:4321`.
- No `.env`/`.env.local` read or written during QA.
- No new browser automation packages installed; `mcp__Claude_Preview__*` tools used against the existing dev server.

## 5. Safety boundaries

- No UI file changed (`src/pages/chart-ai.astro` untouched).
- No MK Agent or Similar Pattern Agent source/fixture changed.
- No API route changed. No `pages/api`/`src/pages/api` files created.
- No live KIS call. No LLM call (OpenAI/Gemini/Anthropic or any provider).
- No Supabase client created for QA purposes. No DB connection initiated by QA actions.
- No env/session/JWT/cookie/header value parsed or logged.
- No public/beta activation. No deploy. No push.

## 6. Default `/chart-ai` checklist

- [x] Navigate to `http://localhost:4321/chart-ai` (no query string).
- [x] `#chartAiOwnerLocalDeterministicAgentsPanel` exists in DOM.
- [x] Panel `hidden` attribute is `true` (panel remains hidden by default).
- [x] `#chartAiOwnerLocalMockedPanel` and `#chartAiOwnerLocalAuthUsageBridgePanel` remain hidden.
- [x] Default sample-data experience (page title `종목 차트 | MK Stock Lab`, sample chart, sample overview) unchanged — default /chart-ai unchanged for any visitor who does not supply the owner-local opt-in query parameter.
- [x] No deterministic-panel-triggered API route or network call observed.
- [x] No public/beta activation observed.

## 7. Owner-local opt-in checklist

- [x] Navigate to `http://localhost:4321/chart-ai?ownerLocalDeterministicAgents=1` on `localhost` (hostname confirmed `localhost`).
- [x] Panel `hidden` attribute flips to `false`.
- [x] Heading text includes `Owner-local 결정형 에이전트`.
- [x] Safety copy present verbatim: `Fixture only`, `No live KIS`, `No LLM`, `No public activation`, `실제 KIS 데이터가 아닙니다`, `LLM을 호출하지 않습니다`.

## 8. MK-C improved MK Agent output checklist

- [x] `MK 에이전트` heading present.
- [x] `삼성전자는` present in `oneLineSummary` (Korean topic-particle grammar fix confirmed, not `삼성전자은`).
- [x] `신뢰도` (confidence) bullet present with a numeric score (observed: `신뢰도는 높음 수준으로 확인됐어요 (95.65점).`).
- [x] `D5` and `D20` outcome-distribution bullets present with `평균` and `중앙값` (observed: `D5 기준 평균 수익률은 4.54%, 중앙값은 2.45%...`, `D20 기준 평균 수익률은 6.03%, 중앙값은 5.48%...`).
- [x] `패턴 품질` (pattern quality) bullet present (observed: `패턴 품질은 우수로 평가됐어요.`).
- [x] At least one match reason tag present (observed: `상관계수 높음`, `정규화 경로 유사`, `방향성 일치` — 3 of 4 possible tags present in the top-match roll-up bullet).
- [x] Historical limitation copy present verbatim: `과거 유사 흐름` and `미래 성과를 보장하지 않습니다`.
- [x] `전략 체크포인트` section present.
- [x] Usage notice present verbatim: `오픈베타에서는 계정당 하루 3회까지 사용할 수 있어요.`
- [x] Disclaimer phrases present verbatim: `참고용`, `매수·매도 추천이 아닙니다`, `투자 자문이 아닙니다`.

## 9. Similar Pattern panel checklist

- [x] `Similar Pattern Agent` heading present.
- [x] Fields present: `시장` (KR), `종목코드` (005930), `기준 구간(baseWindow)` (20일), `Top-K` (5), `매칭 개수` (5건), `최고 유사 구간 점수` (99.97점), `최고 유사 구간 라벨` (매우 유사), `D5 평균 수익률`, `D20 평균 수익률`.
- [x] No visible regression from SP-B additive fields — existing SP-A-shaped fields render identically to Phase 3FF-A-UI-B's QA'd output.
- [x] SP-B-specific fields (`confidenceScore`, `patternQuality`, `matchReasonTags`, `outcomeDistribution`, `contractSummary`) are not rendered directly in the Similar Pattern Agent sub-panel — this is acceptable per phase scope, since the MK Agent panel (Section 8 above) consumes and displays the SP-B-derived bullets instead.

## 10. Existing tab/regression checklist

- [x] `유사 패턴 분석 보기` tab (`#chartAiSimilarityTab`) selected by default (`aria-selected="true"`); panel visible.
- [x] Clicking `MK AI 분석 보기` tab (`#chartAiMkAiTab`) sets `aria-selected="true"` on it and `false` on the similarity tab; `#chartAiMkAiPanel` becomes visible, `#chartAiSimilarityPanel` becomes hidden.
- [x] Clicking back to `유사 패턴 분석 보기` restores original state.
- [x] Existing analysis trigger cards (유사 패턴 분석 시작 / MK AI 분석 시작) remain present.
- [x] `#chartAiOwnerLocalMockedPanel`, `#chartAiOwnerLocalAuthUsageBridgePanel` remain present in DOM (not removed by SP-B/MK-C changes).
- [x] `KIS 연결 프리뷰` region (ownerLocalSimilarPatternRoute notice, `KIS 시세 프리뷰 확인` / `KIS 차트 프리뷰 확인` buttons) confirmed present via accessibility snapshot.
- [x] 0 console errors observed across tab interactions.

## 11. PC visual checklist

- [x] Viewport resized to 1280×900.
- [x] `document.body.scrollWidth (1265) === document.body.clientWidth (1265)` — no horizontal overflow.
- [x] 0 descendant elements inside the deterministic panel with `scrollWidth > clientWidth`.
- [x] Panel `boundingClientRect.width ≈ 1096.8px`, fits within body width.
- [x] Existing chart/sidebar/nav layout intact (visually reviewed).

## 12. Mobile visual checklist

- [x] Viewport resized to 375×812.
- [x] `document.body.scrollWidth (375) === document.body.clientWidth (375)` — no horizontal overflow.
- [x] 0 descendant elements inside the deterministic panel with `scrollWidth > clientWidth`.
- [x] Panel `boundingClientRect.width ≈ 305.175px`.
- [x] Long Korean bullets (e.g. `전략 체크포인트` price-checkpoint sentence) wrap cleanly with no clipping (screenshot evidence captured).
- [x] Match reason tag text does not overflow.

## 13. Network/console checklist

- [x] 0 console errors observed at default `/chart-ai`, at owner-local opt-in URL, and after tab interactions.
- [x] No KIS-domain request observed.
- [x] No LLM-provider request observed (OpenAI/Gemini/Anthropic or similar).
- [x] No deterministic-panel-triggered API route request observed (panel is server-rendered from fixture data at build/request time; no client-side fetch fired for it).
- [x] Only pre-existing unrelated network activity observed (vite dev assets, Supabase `site_settings`/storage banner calls from the Home/Header, Coupang/Firebase third-party widgets already present before this phase) — none attributable to the deterministic panel.
- [x] The single `net::ERR_CONNECTION_REFUSED` entry observed was the very first request issued before the dev server finished starting, unrelated to the panel or to any QA action.

## 14. Negative/safety checklist

- [x] `삼성전자은` — not found.
- [x] `사전 체크포인트` — not found.
- [x] Mojibake patterns (the exact 10-pattern list defined in this phase's task spec, deliberately not reproduced verbatim in this document to avoid self-triggering the mojibake scanner) — not found.
- [x] Forbidden investment phrases (the exact 8-phrase list defined in this phase's task spec, deliberately not reproduced verbatim in this document to avoid self-triggering the forbidden-language scanner) — not found.
- [x] Secret-like substrings (the exact secret-pattern list defined in this phase's task spec) — not found.
- [x] Email-like pattern — not found.
- [x] JWT-like pattern — not found.
- [x] Raw JSON dump pattern in panel text — not found.
- [x] Stack trace — not present.

## 15. Pass/fail recording table

| # | Scenario | Result |
|---|---|---|
| 1 | Default page safety | PASS |
| 2 | Owner-local opt-in | PASS |
| 3 | MK-C improved MK Agent output visibility | PASS |
| 4 | Similar Pattern panel after SP-B | PASS |
| 5 | Existing tab/regression | PASS |
| 6 | Responsive visual QA (PC) | PASS |
| 6 | Responsive visual QA (mobile) | PASS |
| 7 | Network and console safety | PASS |
| 8 | Negative/safety checks | PASS |

## 16. Known out-of-scope issue section

- None discovered during this phase. The existing owner-local panel already surfaces all required SP-B/MK-C-derived content (confidence, pattern quality, outcome distribution, match reason tags, historical limitation copy, corrected `삼성전자는` grammar) without any `src/pages/chart-ai.astro` code change, because the default fixture chain (`createMkAgentFixtureInput()` → `createDefaultSimilarPattern()` → `runSimilarPatternAgent(createSimilarPatternFixtureInput())`) already emits the `similar-pattern-agent.v0.2` contract that `mk-agent.mjs`'s `hasSpbSimilarPatternContract` gate consumes. No critical blocker was found; no HF phase is required as a result of this QA pass.
