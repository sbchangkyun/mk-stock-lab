# Phase 3EX-A — Chart AI Similarity MVP Scope Alignment and Architecture v0.2

## 1. 목적

- 본 문서는 Phase 3EW-C(모의 시나리오/리스크 체크리스트 확장 및 프로덕션 배포) 완료 이후, Chart AI 기능의 다음 방향을 갱신하기 위한 문서입니다.
- 오너가 제공한 KIS API 기반 "차분 유사도 분석"/"유사 패턴 분석" 설계 초안(v0.1)을 현재 프로젝트 상태 및 정책과 정렬시키는 것을 목적으로 합니다.
- 이 문서는 방향 정렬 및 계획 문서이며, 이 문서 자체가 런타임 구현을 승인하지 않습니다. Similarity engine, KIS provider, API route, DB/SQL, UI 구현은 이후 별도 phase에서 진행됩니다.

## 2. 현재 프로젝트 상태

- 현재 HEAD: `b3c2a57` ("feat: expand mocked mk ai scenarios").
- 프로덕션 URL: `https://mkstocklab.vercel.app` (Phase 3EW-C에서 배포 완료).
- `/chart-ai`는 현재 공개(public)/기본(default) 상태에서 샘플/모의(sample/mocked) 데이터로만 동작합니다. 실제 KIS 시세/OHLC는 공개 경로에 노출되지 않습니다.
- 기존 오너 로컬 KIS 프리뷰 경계: `owner-local-quote-preview.ts`, `owner-local-ohlc-preview.ts`, `kisOwnerLocalGate.ts`로 구성된 오너 로컬 전용 실행 경로만 실제 KIS 연결을 허용하며, localhost 확인, env 플래그, provider gate, endpoint 검증을 모두 통과해야 합니다. 이 경계는 본 phase에서 변경되지 않습니다.
- 기존 MK AI 패널(요약, 핵심 해석, 분석 근거, 확인 체크리스트, 데이터 한계, 시나리오 점검, 리스크 체크리스트)은 완전히 모의(mocked)이며 외부 AI 호출 없이 결정적(deterministic) 로직으로 렌더링됩니다.
- 외부 AI API는 존재하지 않습니다. OpenAI/Anthropic/Gemini 등 어떠한 외부 AI SDK/API도 연동되어 있지 않습니다.
- 공개(public) KIS 시세/OHLC 노출은 존재하지 않습니다.
- `source=live`, `source=auto`는 아직 승인되지 않았으며 사용되지 않습니다.

## 3. 설계 초안과 현재 방향의 일치 여부

| 일치 항목 | 현재 상태 | 설계 초안 방향 | 판단 |
| --- | --- | --- | --- |
| Chart AI를 핵심 서비스로 발전 | `/chart-ai`는 이미 핵심 제품 화면으로 지속 확장 중 (3EV~3EW 단계) | Chart AI를 회원 대상 핵심 차별화 기능으로 발전 | 일치 |
| 투자 추천 미제공 원칙 | MK AI 패널 전 구간에서 "실제 투자 판단용 정보가 아니며 매수·매도 추천이 아닙니다" 고지 유지 | 유사 패턴 분석도 투자 추천이 아님을 명시 | 일치 |
| Deterministic summary 우선 | 현재 MK AI 패널은 100% 결정적 로직, AI 서술 없음 | Deterministic summary를 먼저 제공하고 AI 서술은 이후 단계로 분리 | 일치 |
| 동일 종목 과거 구간 비교(MVP) | 아직 미구현, 향후 similarity engine 대상 | MVP는 동일 종목의 과거 구간 패턴 매칭으로 한정 | 일치(향후 구현 범위로 확정) |
| 서버 전용 KIS 원칙 | 오너 로컬 프리뷰는 서버 라우트(API route)를 통해서만 KIS 호출, 브라우저에 원본 응답 미노출 | KIS 호출은 서버 전용, 브라우저에 직접 노출 금지 | 일치 |
| 계좌/거래 API 미사용 | 계좌/거래/주문/잔고 API 미사용, `KIS_ACCOUNT_NO` 미사용 | 계좌/거래 API 사용 안 함을 명시 | 일치 |

## 4. 상충 또는 재정의 필요 항목

| 쟁점 | 설계 초안 | 현재 프로젝트 | 3EX-A 결정 |
| --- | --- | --- | --- |
| 공개 샘플 화면 vs 회원 전용 실행 | 유사 패턴 분석은 회원(로그인) 대상 기능으로 서술 | `/chart-ai`는 현재 완전 공개 화면이며 로그인 게이트가 없음 | `/chart-ai` 화면 자체는 공개 샘플로 유지하고, 실제 "유사 패턴 분석" 실행(버튼/액션)만 로그인/권한/usage guard를 적용한다. |
| 프로덕션 배포 범위 | 설계 초안은 실제 KIS 기반 유사도 분석 기능을 전제로 서술 | 프로덕션은 현재 샘플/모의 상태만 배포됨 | 프로덕션에는 UI(탭/섹션 등)를 배포할 수 있으나, 실제 KIS 기반 유사도 분석은 feature flag off 상태로 유지하며 별도 승인 전까지 활성화하지 않는다. |
| 구현 착수 순서 | 설계 초안은 KIS API 기반 데이터 수집을 전제로 순서를 서술 | 기존 순서는 KIS provider를 먼저 다루는 경향(3EN~3ET 계열) | 다음 구현 순서는 KIS provider가 아니라 순수 결정적 similarity engine부터 시작한다(3EX-B). |
| DB/캐시 처리 순서 | 설계 초안은 캐시 및 rate-limit 정책을 포함 | 현재 프로젝트는 Supabase 마이그레이션/SQL 실행에 대해 별도 오너 승인을 요구하는 관행을 유지 | DB/cache는 캐시 정책 문서화와 타입 설계만 먼저 진행하고, SQL 실행/migration은 별도 오너 승인 phase로 분리한다. |
| MK AI 패널의 역할 | 설계 초안은 유사 패턴 분석을 핵심 분석 결과로 서술 | 기존 MK AI 패널은 현재 유일한 분석 표면(analysis surface)으로 존재 | 기존 MK AI 패널은 유지하되, 향후 "유사 패턴 분석" 결과를 보조 설명(supporting narrative)하는 역할로 재정의한다. |

## 5. Owner Decisions Locked in 3EX-A

1. `/chart-ai` 화면은 공개 샘플로 유지하고, 실제 `유사 패턴 분석` 실행만 로그인/권한/usage guard를 적용한다.
2. production에는 UI를 배포할 수 있으나, 실제 KIS 기반 유사도 분석은 feature flag off 상태로 둔다.
3. 다음 구현 순서는 KIS provider가 아니라 similarity engine부터 시작한다.
4. DB/cache는 캐시 정책 문서화와 타입 설계를 먼저 진행하고, SQL 실행/migration은 별도 승인 phase로 분리한다.
5. 기존 MK AI 패널은 유지하되, 향후 `유사 패턴 분석` 결과를 보조 설명하는 역할로 재정의한다.

## 6. MVP Scope v0.2

- 기능명: 유사 패턴 분석
- 위치: `/chart-ai` 내부의 새 분석 모드 또는 탭
- 접근: 화면은 공개, 실행은 로그인/권한/usage guard 필요
- 데이터: 국내 주식 일봉 OHLCV
- 비교 범위: 동일 종목 과거 구간
- 기준 구간: 20/40/60거래일
- 기본 조회 기간: 최근 3년
- 유사 구간: Top 5
- 이후 성과: 5일/20일 수익률, 최대낙폭
- 차트: 기준일 100 정규화 오버레이
- 해석: deterministic summary first
- 실데이터: feature flag off until approved
- AI API: not in MVP implementation start
- 주문/계좌/잔고: excluded

## 7. Non-MVP / Deferred Scope

- 전체 종목 스캔
- KOSPI/KOSDAQ universe scan
- DTW(Dynamic Time Warping) 기반 유사도
- 분봉(intraday/minute bar) 데이터
- WebSocket 실시간 스트리밍
- OpenAI/Gemini 등 외부 AI narrative 생성
- portfolio/watchlist 비교 기능
- 계좌/거래/주문/잔고(account/trading/order/balance) API
- 목표가/손절가(target price/stop loss)/투자 추천

## 8. Architecture Direction

향후 아키텍처 방향을 정의하되, 이번 phase에서는 구현하지 않습니다.

### 8.1 Similarity Engine First

- 순수 결정적(pure deterministic) 계산 모듈을 가장 먼저 구현한다.
- KIS 의존성 없음(No KIS dependency) — 실제 API 호출 없이 동작한다.
- DB 의존성 없음(No DB dependency) — 저장소 없이 동작한다.
- 픽스처/샘플 OHLCV(fixture/sample OHLCV)만 사용한다.
- 수익률 계산, 정규화, rolling window, 스코어링, forward outcome 계산을 독립적으로 테스트할 수 있게 한다.

### 8.2 KIS Provider Later

- 서버 전용(Server-only)으로만 동작한다.
- 브라우저에 직접 노출되지 않는다(No browser exposure).
- 클라이언트에 원본(raw) payload를 전달하지 않는다(No raw payload to client).
- 계좌/거래 API를 사용하지 않는다(No account/trading APIs).
- 기존 오너 로컬 프리뷰 경계는 별도 승인 전까지 그대로 유지된다(Existing owner-local preview boundary remains untouched until approved).

### 8.3 API Route Later

향후 후보 경로: `POST /api/chart-ai/similarity`

- 3EX-A에서는 구현되지 않는다(not implemented in 3EX-A).
- 향후 라우트는 인증(authenticated)이 필요하다.
- feature flag로 보호되어야 한다(feature flag protected).
- usage guard가 적용되어야 한다(usage guarded).
- 오류 응답은 sanitized error만 반환해야 한다(sanitized error only).

### 8.4 Cache/DB Later

- 3EX-A는 캐시 정책과 타입만 문서화한다(3EX-A only documents cache policy and types).
- SQL/migration은 별도 오너 승인이 필요하다(SQL/migration requires separate owner approval).
- 정규화된 OHLCV만 캐시 대상으로 한다(normalized OHLCV only).
- 원본 KIS payload는 저장하지 않는다(no raw KIS payload).
- 토큰/키/에러 payload는 저장하지 않는다(no token/key/error payload).

### 8.5 UI Integration Later

- `/chart-ai`는 공개 샘플 화면으로 유지된다.
- "유사 패턴 분석" UI는 먼저 비활성/미리보기(disabled/preview) 상태로 도입될 수 있다.
- 실제 실행 버튼은 로그인/인증/usage guard를 반드시 요구해야 한다.
- 기존 MK AI 패널은 향후 유사 패턴 분석 결과를 보조 설명하는 계층(supporting narrative layer)이 되어야 한다.

## 9. Data Types Draft

아래 타입 초안은 문서화 목적의 마크다운 코드로만 제공되며, 이번 phase에서 실제 소스 파일로 추가되지 않습니다.

```ts
interface OhlcBar {
  date: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
```

```ts
interface SimilarityRequest {
  symbol: string;
  windowSize: 20 | 40 | 60;
  lookbackYears: number; // default 3
  topN: number; // default 5
}
```

```ts
interface SimilarityMatch {
  windowStartDate: string;
  windowEndDate: string;
  score: number; // combined similarity score
  correlation: number;
  rmse: number;
  directionMatchRatio: number;
  forwardReturn5d: number | null;
  forwardReturn20d: number | null;
  maxDrawdownForward: number | null;
}
```

```ts
interface SimilaritySummaryStats {
  averageForwardReturn5d: number | null;
  averageForwardReturn20d: number | null;
  averageMaxDrawdownForward: number | null;
  positiveOutcomeRatio5d: number | null;
  positiveOutcomeRatio20d: number | null;
}
```

```ts
interface SimilarityAnalysisResult {
  symbol: string;
  windowSize: 20 | 40 | 60;
  currentWindowStartDate: string;
  currentWindowEndDate: string;
  matches: SimilarityMatch[]; // top N, excludes current window overlap
  summaryStats: SimilaritySummaryStats;
  deterministicSummaryText: string;
  generatedAt: string;
}
```

```ts
interface ChartSimilarityCachePolicy {
  cacheKeyPattern: string; // e.g. symbol+windowSize+lookbackYears
  normalizedOhlcOnly: true;
  storeRawProviderPayload: false;
  storeSecretOrToken: false;
  ttlSeconds: number;
  staleWhileRevalidate: boolean;
}
```

## 10. Algorithm Policy v0.2

- 원본 가격(raw price) 값 자체는 유사도 스코어링에 사용하지 않는다(raw price comparison is not used for similarity scoring).
- 기본 변환(default transform)은 로그 수익률(log return) 또는 단순 수익률(simple return)을 사용한다.
- 차트 표시는 기준일 100 기준 정규화 가격 지수(normalized price index starting at 100)를 사용한다.
- 스코어링은 상관관계(correlation) + RMSE + 방향 일치율(direction match)을 조합한다.
- 변동성 페널티(volatility penalty)는 이후 단계에서 추가될 수 있다.
- 현재 구간과 겹치는 과거 구간은 제외한다(current-window overlap exclusion).
- 미래 데이터 누수가 없어야 한다(no future leakage).
- 예측을 보장하지 않는다(no prediction guarantee).

## 11. Feature Flag and Access Policy

후보 env 이름(값은 기록하지 않음):

- `CHART_AI_SIMILARITY_ENABLED`
- `CHART_AI_SIMILARITY_PUBLIC_UI_ENABLED`
- `CHART_AI_SIMILARITY_REQUIRE_AUTH`
- `CHART_AI_SIMILARITY_DAILY_LIMIT_FREE`
- `CHART_AI_SIMILARITY_MAX_LOOKBACK_YEARS`

- 위 env 값은 어떤 문서/커밋/체커에도 절대 기록하지 않는다(values must never be recorded).
- 3EX-A에서는 Vercel env 변경이 이루어지지 않는다(Vercel env changes are not made in 3EX-A).
- production 활성화는 이후 별도 오너 승인이 필요하다(production enable requires later owner approval).

## 12. Security and Compliance Policy

- KIS 시크릿을 브라우저에 노출하지 않는다(no KIS secrets in browser).
- 원본 KIS 응답을 클라이언트에 전달하지 않는다(no raw KIS response to client).
- 계좌/거래/주문/잔고 API를 사용하지 않는다(no account/trading/order/balance APIs).
- 투자 추천을 제공하지 않는다(no investment recommendation).
- 목표가/손절가를 제공하지 않는다(no target price/stop loss).
- 원본 provider 오류를 클라이언트에 노출하지 않는다(no raw provider errors to client).
- `.env`를 읽지 않는다(no .env read).
- Vercel env 값을 출력하지 않는다(no Vercel env print).
- 오류는 sanitized error만 반환한다(sanitized errors only).

## 13. Updated Implementation Roadmap

### Phase 3EX-B — Chart Similarity Engine Deterministic Foundation
- Implement pure calculation engine with fixture OHLCV only.
- No KIS, no API route, no DB, no UI integration.

### Phase 3EX-C — Similarity Engine Contract and Edge Case Hardening
- Validate NaN/Infinity, insufficient data, window exclusion, score range.

### Phase 3EX-D — Similarity Result UI Mocked Integration
- Add disabled/mock result UI inside /chart-ai.
- No real execution.

### Phase 3EY-A — Server-only KIS OHLC Provider Planning or Foundation
- Start only after owner approval.

### Phase 3EY-B — Cache Policy and Type Foundation
- Type-only or docs-first; SQL later.

### Phase 3EZ-A — Authenticated Similarity API Route
- Feature flag off by default.
- Login/usage guard.
- No production enable until approved.

## 14. Open Questions for Owner

- Should similarity MVP initially support ETF as well as stock, or stock-only first?
- Should 60-day forward outcome be hidden until later?
- Should the first UI be a tab, accordion section, or separate sub-panel?
- Should public users see disabled result examples?
- Should owner-local KIS preview and similarity MVP share OHLC normalized types later?

## 15. 3EX-A Conclusion

- 설계 방향은 5개 오너 결정을 반영한 이후 현재 프로젝트 방향과 일치한다.
- 다음 구현은 Phase 3EX-B(Similarity Engine Deterministic Foundation)로 진행해야 한다.
- 3EX-A에서는 KIS/DB/API/UI 런타임 구현이 이루어지지 않았다.
