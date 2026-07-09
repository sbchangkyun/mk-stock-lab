# New Chat Start Prompt (Korean)

Copy and paste the following into a new ChatGPT conversation to continue this work.

```
프로젝트: mk-stock-lab
경로: C:\Users\kkama\OneDrive\문서\Project\mk-stock-lab
브랜치: rebuild/phase-1-ia-shell
현재 베이스라인: dcb6724
최근 완료 단계: Phase 3FF-A-HOUSEKEEPING-A

지금까지 완료된 작업 요약:
- Similar Pattern Agent 결정형(fixture 기반) 엔진 구현 (Phase 3FF-A-SP-A).
- Similar Pattern SP-B 계약(similar-pattern-agent.v0.2) 강화: confidenceScore/confidenceLabel, patternQuality, matchReasonTags, outcomeDistribution, contractSummary 추가, 기존 SP-A 출력과 완전히 하위 호환 (Phase 3FF-A-SP-B).
- MK Agent가 SP-B 계약 필드를 소비하도록 확장 (hasSpbSimilarPatternContract 등 헬퍼), 레거시 SP-A 출력과 100% 호환 (Phase 3FF-A-MK-C).
- MK Agent 한국어 조사 문법 결함(삼성전자은 → 삼성전자는) 수정 (Phase 3FF-A-MK-B).
- Owner-local 전용 결정형 에이전트 패널(/chart-ai, ownerLocalDeterministicAgents=1, localhost 전용)이 실제 브라우저 QA를 통과함 (Phase 3FF-A-UI-A/UI-B/UI-C).
- 오래된 changelog 슬라이스 가정으로 실패하던 히스토리 체커 스코프 문제를 정리함 (Phase 3FF-A-HOUSEKEEPING-A).

엄격히 금지된 항목 (반드시 유지):
- 실제 KIS(한국투자증권) 라이브 호출 금지.
- LLM 호출 금지 (모든 에이전트는 결정형 fixture 기반으로만 동작).
- MK AI API 라우트 실제 활성화 금지.
- public/beta 활성화 금지.
- 실제 Supabase/DB 연결, 실제 세션/JWT/쿠키/헤더 파싱 금지.
- 배포(deploy) 금지.
- 푸시(push) 금지.

요청: 먼저 위 현재 상태를 스스로 요약해서 확인해 주세요 (베이스라인 dcb6724, 최근 완료 단계 Phase 3FF-A-HOUSEKEEPING-A, 금지 항목 목록 포함). 그 요약이 맞는지 확인받은 후에만 다음 Claude Code 작업 지시문을 작성해 주세요.

권장 다음 단계: Phase 3FG-A-PLAN (Guarded Productization Planning, No Live KIS, No LLM, No Public Activation) — 이 단계는 계획 전용(planning-only)이며, 실제 KIS/LLM/public 활성화를 포함하지 않습니다.
```
