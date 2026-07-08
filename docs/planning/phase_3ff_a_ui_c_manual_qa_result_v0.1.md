# Phase 3FF-A-UI-C — Owner-local Browser QA Result

## 1. Status

Executed.

## 2. Purpose

Perform owner-local browser QA for the deterministic Chart AI panel after Phase 3FF-A-SP-B and Phase 3FF-A-MK-C improvements. This phase verifies that the owner-local deterministic panel correctly displays the improved MK Agent output that now consumes the SP-B Similar Pattern contract fields: `confidenceScore`/`confidenceLabel`, `patternQuality`, `outcomeDistribution`, `matchReasonTags`, `contractSummary`-derived summaries, historical limitation copy, and the Korean grammar fix `삼성전자는`. This phase is QA/documentation/checker work only — no new product behavior, no engine changes, no API route changes, no live KIS, no LLM, no public/beta activation, no deploy, no push.

## 3. Baseline

- Baseline: `86050be`.
- Latest completed phase before UI-C: Phase 3FF-A-MK-C.
- Branch: `rebuild/phase-1-ia-shell`.

## 4. QA scope actually performed

- Started the existing local dev server via `npm run dev` (`astro-dev` launch config, port 4321; no new browser automation packages installed) and drove it with real browser automation (`mcp__Claude_Preview__*`) against `http://localhost:4321`.
- Verified default `/chart-ai` (no query string) keeps the deterministic-agents panel hidden and leaves default sample-data behavior unchanged — default /chart-ai unchanged for any visitor who does not supply the owner-local opt-in query parameter (Scenario 1).
- Verified the owner-local opt-in URL `/chart-ai?ownerLocalDeterministicAgents=1` on `localhost` reveals the panel with the required id, heading, and safety copy (Scenario 2).
- Verified all MK-C-required Korean strings and SP-B-derived bullets are visible in the MK Agent panel output, including the `삼성전자는` grammar fix, `신뢰도` confidence bullet, `D5`/`D20` 평균/중앙값 outcome-distribution bullets, `패턴 품질` pattern-quality bullet, match reason tags, and historical limitation copy (Scenario 3).
- Verified the Similar Pattern Agent panel's visible fields render identically to Phase 3FF-A-UI-B's QA'd output, with no regression from SP-B's additive fields (Scenario 4).
- Verified existing Chart AI tabs (유사 패턴 분석 보기 / MK AI 분석 보기), analysis trigger cards, and pre-existing owner-local panels (`ownerLocalMocked`, `ownerLocalAuthUsageBridge`, `ownerLocalSimilarPatternRoute`/KIS 연결 프리뷰) remain present and functional (Scenario 5).
- Verified responsive layout at a real desktop viewport (1280×900) and a real mobile viewport (375×812), including explicit overflow measurement (`scrollWidth`/`clientWidth` comparisons and `boundingClientRect` extraction), not screenshot impression alone (Scenario 6).
- Verified network and console activity throughout: 0 console errors observed at any step; no KIS-domain, LLM-provider, or deterministic-panel-triggered API route network call observed (Scenario 7).
- Ran the full negative/safety scan (mojibake list, forbidden-investment-phrase list, secret-pattern list, email-like/JWT-like/raw-JSON-dump patterns, and the specific `삼성전자은`/`사전 체크포인트` defect strings) against the rendered panel HTML (Scenario 8).

## 5. QA scope not performed

None. All 8 required QA scenarios (default page safety; owner-local opt-in; MK-C improved MK Agent output visibility; Similar Pattern panel after SP-B; existing tab/regression; responsive PC+mobile visual QA; network/console safety; negative/safety checks) were executed with real browser evidence. No scenario was skipped or downgraded to static/code-only verification.

## 6. Evidence summary

- **Default `/chart-ai`:** `#chartAiOwnerLocalDeterministicAgentsPanel` present in DOM with `hidden: true`; `#chartAiOwnerLocalMockedPanel` and `#chartAiOwnerLocalAuthUsageBridgePanel` hidden; `window.location.hostname === "localhost"`; page title `종목 차트 | MK Stock Lab`; 0 console errors; no deterministic-panel-triggered network call.
- **Owner-local opt-in URL:** navigating to `/chart-ai?ownerLocalDeterministicAgents=1` flips the panel to `hidden: false`; heading text includes `Owner-local 결정형 에이전트`; all 6 required safety strings present (`Fixture only`, `No live KIS`, `No LLM`, `No public activation`, `실제 KIS 데이터가 아닙니다`, `LLM을 호출하지 않습니다`).
- **MK-C improved MK Agent (`MK 에이전트`) output:** DOM-extracted panel text (2265 characters) confirmed all 14 required terms present verbatim, including `삼성전자는` (topic-particle grammar fix, not `삼성전자은`). Observed exact bullets: `신뢰도는 높음 수준으로 확인됐어요 (95.65점).`; `D5 기준 평균 수익률은 4.54%, 중앙값은 2.45%이며 상승 5건·하락 0건·보합 0건이었어요.`; `D20 기준 평균 수익률은 6.03%, 중앙값은 5.48%이며 상승 5건·하락 0건·보합 0건이었어요.`; `상위 매치 근거 태그: 상관계수 높음, 정규화 경로 유사, 방향성 일치, 낙폭 유사.`; `패턴 품질은 우수로 평가됐어요.`; `제한 사항: 과거 유사도는 미래 결과를 예측하거나 보장하지 않습니다. 동일 종목의 과거 가격 흐름만을 대상으로 한 형태적 유사도 비교입니다.`; `과거 유사 흐름을 참고했을 뿐이며, 이 정보는 미래 성과를 보장하지 않습니다.`; `오픈베타에서는 계정당 하루 3회까지 사용할 수 있어요.`; `이 분석은 참고용이며 매수·매도 추천이 아닙니다. 투자 자문이 아닙니다. 최종 투자 판단의 책임은 이용자 본인에게 있습니다.`
- **Similar Pattern panel:** DOM-extracted field values — 시장: `KR`; 종목코드: `005930`; 기준 구간(baseWindow): `20일`; Top-K: `5`; 매칭 개수: `5건`; 최고 유사 구간 점수: `99.97점`; 최고 유사 구간 라벨: `매우 유사`; D5 평균 수익률: `+4.54% (긍정 5 · 부정 0)`; D20 평균 수익률: `+6.03% (긍정 5 · 부정 0)`; disclaimer `과거 유사 흐름 기반 참고 정보이며, 미래 수익률을 보장하지 않습니다. 투자 판단의 책임은 본인에게 있습니다.` — identical to the values recorded in Phase 3FF-A-UI-B's result document; no regression. SP-B-specific fields are not rendered directly in this sub-panel; they surface instead in the MK Agent panel's SP-B-derived bullets (see above), consistent with phase scope.
- **PC layout (1280×900):** `document.body.scrollWidth (1265) === document.body.clientWidth (1265)` (no horizontal overflow); 0 elements inside the panel with `scrollWidth > clientWidth`; panel `boundingClientRect.width ≈ 1096.8px`.
- **Mobile layout (375×812):** `document.body.scrollWidth (375) === document.body.clientWidth (375)` (no horizontal overflow); 0 overflowing elements; panel `boundingClientRect.width ≈ 305.175px`; screenshot captured showing 구간·수급, 전략 체크포인트, 가격 패턴, 기술적 지표 sections wrapping cleanly with no clipping.
- **Existing tab/regression checks:** clicking `#chartAiMkAiTab` set `aria-selected="true"` on it (and `false` on `#chartAiSimilarityTab`), toggled `#chartAiMkAiPanel` to visible and `#chartAiSimilarityPanel` to hidden; clicking back restored the default state; 0 console errors during interaction; accessibility snapshot confirmed `#chartAiOwnerLocalMockedPanel`, `#chartAiOwnerLocalAuthUsageBridgePanel`, and the `KIS 연결 프리뷰` region (with `KIS 시세 프리뷰 확인` / `KIS 차트 프리뷰 확인` buttons) remain present in the DOM.
- **Network/console checks:** 0 console errors across default page load, owner-local opt-in navigation, and tab interactions; full network capture reviewed — only vite dev assets, pre-existing Supabase `site_settings`/storage calls (Home/Header banners, unrelated to the deterministic panel), and pre-existing third-party ad/auth widget requests (Coupang, Firebase) observed; no KIS-domain request; no LLM-provider request; no deterministic-panel-triggered API route request; the one `net::ERR_CONNECTION_REFUSED` entry was the very first request issued before the dev server finished starting, unrelated to any QA action.
- **Negative/safety checks:** full panel HTML (6891 characters) scanned for the exact defect strings `삼성전자은` / `사전 체크포인트` — 0 matches; the 10-pattern mojibake list — 0 matches; the 8-phrase forbidden-investment-language list — 0 matches; the 5 secret-like substrings (`appsecret`, `access_token`, `service_role`, `OPENAI_API_KEY`, `KIS_APP_SECRET`) — 0 matches; email-like pattern — 0 matches; JWT-like pattern — 0 matches; raw-JSON-dump pattern in panel text — 0 matches; stack trace — not present.

## 7. Validation results

| Command | Result |
|---|---|
| `npm run check:phase-3ff-a-ui-c-manual-qa` | PASS |
| `npm run smoke:phase-3ff-a-mk-c` | PASS |
| `npm run check:phase-3ff-a-mk-c` | PASS |
| `npm run smoke:phase-3ff-a-sp-b` | PASS |
| `npm run check:phase-3ff-a-sp-b` | PASS |
| `npm run smoke:phase-3ff-a-mk-b` | PASS |
| `npm run check:phase-3ff-a-mk-b` | PASS |
| `npm run check:phase-3ff-a-ui-b-manual-qa` | PASS |
| `npm run smoke:phase-3ff-a-ui-a` | PASS |
| `npm run check:phase-3ff-a-ui-a` | PASS |
| `npm run smoke:phase-3ff-a-mk-a` | PASS |
| `npm run check:phase-3ff-a-mk-a` | PASS |
| `npm run smoke:phase-3ff-a-sp-a` | PASS |
| `npm run check:phase-3ff-a-sp-a` | PASS |
| `npm run check:phase-3ff-a-plan` | PASS |
| `npm run build` | PASS |
| `git diff --check` | PASS (no whitespace/conflict-marker errors) |
| `git status --short` | Reviewed — only Phase 3FF-A-UI-C allowed files and pre-existing untracked paths present |
| `git diff --name-only 86050be -- src/pages/chart-ai.astro src/lib/server/chart-ai/mk-agent.mjs src/lib/server/chart-ai/mk-agent.fixture.mjs src/lib/server/chart-ai/similar-pattern-agent.mjs src/lib/server/chart-ai/similar-pattern-agent.fixture.mjs pages/api src/pages/api components supabase src/data package-lock.json pnpm-lock.yaml yarn.lock .env .env.local` | Empty output (no forbidden path changed) |

(Exact re-run assertion counts are recorded in the working session transcript at the time each command was executed; every command listed above returned a passing/zero-diff result.)

## 8. Boundary preservation

- No UI file changed.
- No API route changed.
- No MK Agent source/fixture changed.
- No Similar Pattern Agent source/fixture changed.
- No live KIS call occurred.
- No LLM call occurred.
- No MK AI route activation occurred.
- No Supabase client was created.
- No DB connection occurred.
- No env/session/JWT/cookie/header parsing occurred.
- No public/beta activation occurred.
- No dependency/lockfile change occurred.
- No deploy/push occurred.

## 9. Known out-of-scope issues

- None discovered during this phase. The existing owner-local panel in `src/pages/chart-ai.astro` (unchanged since Phase 3FF-A-UI-A) already surfaces all required SP-B/MK-C-derived content without any UI code change, because the default fixture chain (`createMkAgentFixtureInput()` → `createDefaultSimilarPattern()` → `runSimilarPatternAgent(createSimilarPatternFixtureInput())`) already emits the `similar-pattern-agent.v0.2` contract consumed by `mk-agent.mjs`'s `hasSpbSimilarPatternContract` gate. No critical blocker was found; no future HF phase is required as a result of this QA pass.
- The Phase 3FF-A-UI-B result document's previously-noted `삼성전자은` grammar defect is confirmed fixed in this phase's QA evidence (`삼성전자는` now renders correctly), consistent with Phase 3FF-A-MK-B's Korean grammar fix.

## 10. Next recommended phase

QA passed with no blocker. Recommended next steps, in order of priority:

1. **Phase 3FF-A-HOUSEKEEPING-A** — stale historical checker cleanup (e.g. the pre-existing, causally-unrelated `check:phase-3fd-j-handoff-chart-ai-new-chat-package` failure noted in prior UI-B/MK-C documentation, caused by changelog growth past a fixed character offset).
2. **Phase 3FG-A-PLAN** — guarded productization planning for the deterministic panel (e.g. scoping a path toward broader-than-owner-local availability under explicit future approval).

Direct live KIS, LLM activation, beta/public activation, deploy, and push remain blocked.
