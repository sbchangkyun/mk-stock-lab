# Phase 3EX-A — Chart AI Similarity Owner Decision Log v0.1

## Decision summary

Phase 3EX-A는 오너가 제공한 KIS API 기반 "차분 유사도 분석"(유사 패턴 분석) 설계 초안(v0.1)을 검토하고, 현재 프로젝트 방향과의 일치/상충 항목을 정리한 뒤, 다섯 가지 방향 결정을 확정했습니다. 이 phase는 계획/아키텍처 정렬 문서만 생성하며, 런타임 구현은 포함하지 않습니다.

## Locked decisions

1. `/chart-ai` 화면은 공개 샘플로 유지하고, 실제 `유사 패턴 분석` 실행만 로그인/권한/usage guard를 적용한다.
2. production에는 UI를 배포할 수 있으나, 실제 KIS 기반 유사도 분석은 feature flag off 상태로 둔다.
3. 다음 구현 순서는 KIS provider가 아니라 similarity engine부터 시작한다.
4. DB/cache는 캐시 정책 문서화와 타입 설계를 먼저 진행하고, SQL 실행/migration은 별도 승인 phase로 분리한다.
5. 기존 MK AI 패널은 유지하되, 향후 `유사 패턴 분석` 결과를 보조 설명하는 역할로 재정의한다.

production에는 UI를 배포할 수 있으나, 실제 KIS 기반 유사도 분석 실행 기능은 별도 승인 전까지 feature flag off 상태를 유지합니다.

## Non-authorized items

- 공개(public) KIS 실시간/지연 시세 및 OHLC 노출
- `source=live`, `source=auto`
- 외부 AI API(OpenAI/Anthropic/Gemini 등) 연동
- 계좌/거래/주문/잔고(account/trading/order/balance) API 사용
- SQL 실행 및 Supabase migration 적용 — 별도 승인이 필요합니다(SQL/migration requires separate approval).
- 실제 KIS 기반 유사도 분석 기능의 production 활성화(feature flag on)
- Vercel 환경 변수 변경
- 이번 phase에서의 배포(deployment) — 3EX-A에는 배포가 포함되지 않습니다(deployment is not included in 3EX-A).
- 이번 phase에서의 런타임 구현 — 3EX-A에는 구현이 포함되지 않습니다(implementation is not included in 3EX-A).

## Future approval required items

- Similarity engine 이후 KIS OHLC provider(서버 전용) 도입
- 유사 패턴 분석 결과 UI의 production 노출 및 feature flag on 전환
- Similarity 캐시 테이블/SQL migration 실행
- 로그인/인증/usage guard가 적용된 `/api/chart-ai/similarity` API route 구현
- ETF 포함 여부, 60일 forward outcome 노출 여부 등 MVP 세부 범위 확정

## Next recommended phase

Phase 3EX-B — Chart Similarity Engine Deterministic Foundation (순수 결정적 similarity 계산 엔진을 fixture OHLCV만으로 구현, KIS/DB/API/UI 연동 없음).
