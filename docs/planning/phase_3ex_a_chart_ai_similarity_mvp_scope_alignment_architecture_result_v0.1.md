# Phase 3EX-A — Chart AI Similarity MVP Scope Alignment and Architecture Update Result

## 1. Status

Prepared — Chart AI similarity MVP scope and architecture direction aligned.

## 2. Background

- Phase 3EW-C completed mocked scenario/risk checklist expansion and Vercel production deployment.
- The owner provided a KIS-based differential similarity design draft.
- The owner then locked five direction decisions before implementation.

## 3. Owner Decisions

1. `/chart-ai` 화면은 공개 샘플로 유지하고, 실제 `유사 패턴 분석` 실행만 로그인/권한/usage guard를 적용한다.
2. production에는 UI를 배포할 수 있으나, 실제 KIS 기반 유사도 분석은 feature flag off 상태로 둔다.
3. 다음 구현 순서는 KIS provider가 아니라 similarity engine부터 시작한다.
4. DB/cache는 캐시 정책 문서화와 타입 설계를 먼저 진행하고, SQL 실행/migration은 별도 승인 phase로 분리한다.
5. 기존 MK AI 패널은 유지하되, 향후 `유사 패턴 분석` 결과를 보조 설명하는 역할로 재정의한다.

## 4. Prepared Scope

- Architecture v0.2 document: `docs/planning/phase_3ex_a_chart_ai_similarity_mvp_scope_alignment_architecture_v0.2.md`, aligning the design draft against the current project state, recording alignment/conflict tables, locking the five owner decisions, and defining MVP scope v0.2, non-MVP scope, architecture direction, data type drafts, algorithm policy, feature flag/access policy, and security/compliance policy.
- Owner decision log: `docs/planning/phase_3ex_a_chart_ai_similarity_owner_decision_log_v0.1.md`, recording the locked decisions, non-authorized items, and future approval requirements.
- Updated implementation roadmap: Phase 3EX-B through Phase 3EZ-A defined as the recommended future sequence, starting with the deterministic similarity engine.
- Feature flag/access policy: candidate env names documented without values; real KIS similarity execution remains feature-flag off until separately approved.
- Cache/type-first policy: `ChartSimilarityCachePolicy` and related type drafts documented in markdown only; SQL/migration explicitly deferred to a separate owner-approved phase.
- Similarity-engine-first sequence: Phase 3EX-B (deterministic engine using fixture OHLCV) recommended as the immediate next phase, ahead of any KIS provider work.

## 5. Preserved Boundaries

- No runtime code was added or modified in this phase.
- No KIS call was made.
- No external AI call was made.
- No API route was added.
- No DB/SQL/migration was executed.
- No Supabase mutation was made.
- No Vercel env change was made.
- No deployment was performed.
- No push was performed.
- No secrets were recorded.
- No raw KIS response was recorded.
- No public KIS data was added or authorized.
- No `source=live`/`source=auto` was added or authorized.

## 6. Validation

- `npm run check:phase-3ex-a-chart-ai-similarity-mvp-scope-alignment-architecture`: PASS (62/62).
- `npm run check:phase-3ew-c-mk-ai-mocked-scenario-risk-checklist-expansion`: PASS (50/50).
- `npm run check:phase-3ew-b-mk-ai-analysis-panel-interaction-depth`: PASS (50/50).
- `npm run check:phase-3ew-a-mk-ai-analysis-panel-mocked-first`: PASS (46/46).
- `npm run check:phase-3ev-b-chart-ai-company-overview-selected-symbol-detail`: PASS (44/44).
- `npm run check:phase-3ev-a-chart-ai-public-sample-fallback-hardening`: PASS (42/42).
- `npm run check:production-domain`: PASS (33/33).
- `npm run build`: PASS.
- `git diff --check`: PASS.

## 7. Recommended Next Phase

Recommended:
Phase 3EX-B — Chart Similarity Engine Deterministic Foundation

Alternative:
Phase 3EV-C — Chart AI Owner-Local KIS Connected Result UI Enhancement
