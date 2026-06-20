## Phase 3H Server-only Provider Adapter Scaffolding Owner Review Delta

Use this Korean-first format when reporting Phase 3H owner review results back to Codex. Do not include credentials, tokens, keys, project references, environment values, secret query strings, or screenshots containing secrets.

```text
Phase 3H Server-only Provider Adapter Scaffolding 검토 결과:

* server-only provider scaffold 범위로 충분함: 통과/실패
* 실제 KIS 호출이 구현되지 않음: 통과/실패
* 실제 OpenDART 호출이 구현되지 않음: 통과/실패
* 실제 OpenAI/Gemini 호출이 구현되지 않음: 통과/실패
* provider adapter가 browser/client 코드로 import되지 않음: 통과/실패
* env var는 이름만 있고 실제 값이 기록되지 않음: 통과/실패
* provider error envelope가 raw error/stack/token을 노출하지 않는 구조임: 통과/실패
* Portfolio valuation shell이 실제 시세/평가금액을 위조하지 않음: 통과/실패
* Chart AI context shell이 실제 AI 분석을 수행하지 않음: 통과/실패
* provider call, DB migration, SQL, Vercel env mutation, deployment가 실제로 수행되지 않음: 통과/실패
* 다음 phase 승인 게이트가 명확함: 통과/실패
* 비밀 정보 없는 메모:
```

## Phase 3G Provider/Data Readiness Planning Owner Review Delta

Use this Korean-first format when reporting Phase 3G owner review results back to Codex. Do not include credentials, tokens, keys, project references, environment values, secret query strings, or screenshots containing secrets.

```text
Phase 3G Provider/Data Readiness Planning 검토 결과:

* Provider/Data 연동 전 설계 문서로 충분함: 통과/실패
* KIS 역할과 범위가 명확함: 통과/실패
* OpenDART 역할과 범위가 명확함: 통과/실패
* Chart AI provider 역할과 제한사항이 명확함: 통과/실패
* server-only provider boundary가 명확함: 통과/실패
* browser에서 provider key를 절대 다루지 않는 구조가 명확함: 통과/실패
* Market quote/chart/treemap API 후보가 명확함: 통과/실패
* Portfolio valuation readiness가 명확함: 통과/실패
* Chart AI context package 설계가 명확함: 통과/실패
* cache/stale/fallback 정책이 명확함: 통과/실패
* env var 이름만 있고 실제 값이 기록되지 않음: 통과/실패
* error handling과 browser 노출 메시지가 안전함: 통과/실패
* provider call, DB migration, SQL, Vercel env mutation, deployment가 실제로 수행되지 않음: 통과/실패
* 다음 phase 승인 게이트가 명확함: 통과/실패
* 비밀 정보 없는 메모:
```

## Phase 3F.4 Portfolio Page Aggregate And Market Fit Manual Smoke Delta

Use this Korean-first format when reporting Phase 3F.4 results back to Codex. Do not include credentials, tokens, keys, project references, environment values, secret query strings, or screenshots containing secrets.

```text
Phase 3F.4 Portfolio 전체 보기/Market 화면 맞춤 재점검 결과:

- 테스트 대상: local / deployed
- 브라우저: Chrome 등
- `/portfolio` 진입: 통과/실패
- 포트폴리오가 1개 이상 있을 때 `전체 보기`가 목록 맨 위에 표시됨: 통과/실패
- `전체 보기` 선택 시 모든 포트폴리오 보유 종목이 합산 표시됨: 통과/실패
- 같은 시장/티커 종목이 하나의 행으로 합산됨: 통과/실패/미실행
- `전체 보기`에서 종목 추가 버튼이 보이지 않거나 사용할 수 없음: 통과/실패
- `전체 보기` 행에서 수정/삭제 대신 읽기 전용 상태가 표시됨: 통과/실패
- 개별 포트폴리오 선택 시 기존 종목 추가/수정/삭제 유지: 통과/실패/미실행
- 평가금액/현재가가 실제 시세처럼 표시되지 않고 기존 placeholder 유지: 통과/실패
- `/market` 진입: 통과/실패
- `/market` Treemap 단독 보기에서 차트가 PC 화면에 더 잘 맞음: 통과/실패
- `/market` Momentum / Trend 단독 보기에서 내부 여백이 줄고 plot 영역이 커짐: 통과/실패
- `/heatmap` 호환 진입 유지: 통과/실패
- Treemap 표시명 중심 라벨 유지: 통과/실패
- 보기 선택 `Treemap` / `Momentum / Trend` / `같이 보기` 유지: 통과/실패
- Treemap 크게 보기 동작: 통과/실패
- Momentum / Trend 크게 보기 동작: 통과/실패
- Treemap PNG 저장: 통과/실패/미실행
- Momentum / Trend PNG 저장: 통과/실패/미실행
- Home sticky 광고 유지: 통과/실패/화면폭 부족
- Chart AI 차트 우선 UX 유지: 통과/실패
- Portfolio 개별 CRUD 유지: 통과/실패/미실행
- Header 로그인 라벨 안정성 유지: 통과/실패
- `Today: 000` placeholder 유지: 통과/실패
- OpenAI/Gemini/KIS/OpenDART/Trading Economics/ETFshopping/한경 실제 호출 없음: 통과/실패
- 브라우저 콘솔에 token/key/raw DB error/stack trace 노출 없음: 통과/실패
- 비밀 정보 없는 메모:
```

## Phase 3F.3 Portfolio Aggregate And Display-Name Manual Smoke Delta

Use this Korean-first format when reporting Phase 3F.3 results back to Codex. Do not include credentials, tokens, keys, project references, environment values, secret query strings, or screenshots containing secrets.

```text
Phase 3F.3 Portfolio 전체 보기/표시명 재점검 결과:

- 테스트 대상: local / deployed
- 브라우저: Chrome 등
- `/market` 진입: 통과/실패
- `/heatmap` 호환 진입: 통과/실패
- My Portfolio 선택 시 `전체 보기` 옵션 표시: 통과/실패
- 개별 포트폴리오 선택 옵션 표시: 통과/실패/해당 없음
- `전체 보기` 선택 시 여러 포트폴리오 보유 종목이 합산 표시됨: 통과/실패/샘플 기준
- 동일 종목이 여러 포트폴리오에 있을 때 하나로 합산됨: 통과/실패/해당 없음
- Treemap 라벨이 티커가 아니라 종목명 중심으로 표시됨: 통과/실패
- Momentum / Trend 라벨이 티커가 아니라 종목명 중심으로 표시됨: 통과/실패
- tooltip/title 또는 보조 정보에서 티커 확인 가능: 통과/실패/미실행
- `Treemap` 보기 모드 유지: 통과/실패
- `Momentum / Trend` 보기 모드 유지: 통과/실패
- `같이 보기` 보기 모드 유지: 통과/실패
- Treemap 계층형 블록 시각 유지: 통과/실패
- Treemap 크게 보기 동작: 통과/실패
- 산점도 크게 보기 동작: 통과/실패
- Treemap PNG 저장: 통과/실패/미실행
- 산점도 PNG 저장: 통과/실패/미실행
- Home 광고 sticky 동작 유지: 통과/실패/화면폭 부족
- Chart AI 차트 우선 UX 유지: 통과/실패
- Portfolio 주요 기능 유지: 통과/실패/미실행
- Header 로그인 라벨 안정성 유지: 통과/실패
- `Today: 000` placeholder 유지: 통과/실패
- OpenAI/Gemini/KIS/OpenDART/Trading Economics/ETFshopping/한경/참고 URL 실제 호출 없음: 통과/실패
- 브라우저 콘솔에 token/key/raw DB error/stack trace 노출 없음: 통과/실패
- 비밀 정보 없는 메모:
```

## Phase 3F.2 Treemap Engine And View Mode Manual Smoke Delta

Use this Korean-first format when reporting Phase 3F.2 results back to Codex. Do not include credentials, tokens, keys, project references, environment values, secret query strings, or screenshots containing secrets.

```text
Phase 3F.2 Treemap 엔진/보기 모드 재점검 결과:

- 테스트 대상: local / deployed
- 브라우저: Chrome 등
- `/market` 진입: 통과/실패
- `/heatmap` 호환 진입: 통과/실패
- visible UI에서 `Treemap` 명칭 유지: 통과/실패
- Treemap이 가로/세로 길이가 모두 다른 계층형 블록으로 보임: 통과/실패
- Treemap이 같은 폭 막대 또는 얇은 strip처럼 보이지 않음: 통과/실패
- 대형 종목 타일이 의미 있게 크게 보임: 통과/실패
- 중소형 종목 타일이 남은 영역을 촘촘히 채움: 통과/실패
- 섹터/그룹 구분이 자연스럽게 보임: 통과/실패
- Treemap 색상 범례가 직관적임: 통과/실패
- 보기 선택 `Treemap` 동작: 통과/실패
- 보기 선택 `Momentum / Trend` 동작: 통과/실패
- 보기 선택 `같이 보기` 동작: 통과/실패
- `Treemap` 단독 보기에서 차트가 넓게 표시됨: 통과/실패
- `Momentum / Trend` 단독 보기에서 산점도가 넓게 표시됨: 통과/실패
- 산점도 점/라벨이 이전보다 보기 쉬움: 통과/실패
- 산점도 `단기 모멘텀` 문구가 표 영역을 침범하지 않음: 통과/실패
- 산점도 `장기 트렌드` 문구가 plot 직사각형 우측 하단에 유지됨: 통과/실패
- Treemap 크게 보기 동작: 통과/실패
- 산점도 크게 보기 동작: 통과/실패
- Treemap PNG 저장: 통과/실패/미실행
- 산점도 PNG 저장: 통과/실패/미실행
- Home 광고 sticky 동작 유지: 통과/실패/화면폭 부족
- Chart AI 차트 우선 UX 유지: 통과/실패
- Portfolio 주요 기능 유지: 통과/실패/미실행
- Header 로그인 라벨 안정성 유지: 통과/실패
- `Today: 000` placeholder 유지: 통과/실패
- OpenAI/Gemini/KIS/OpenDART/Trading Economics/ETFshopping/한경/참고 URL 실제 호출 없음: 통과/실패
- 브라우저 콘솔에 token/key/raw DB error/stack trace 노출 없음: 통과/실패
- 비밀 정보 없는 메모:
```

## Phase 3F.1 Treemap Visual Quality Manual Smoke Delta

Use this Korean-first format when reporting Phase 3F.1 results back to Codex. Do not include credentials, tokens, keys, project references, environment values, secret query strings, or screenshots containing secrets.

```text
Phase 3F.1 Treemap 시각화 품질 재점검 결과:

- 테스트 대상: local / deployed
- 브라우저: Chrome 등
- `/market` 진입: 통과/실패
- `/heatmap` 호환 진입: 통과/실패
- visible UI에서 `Treemap` 명칭 유지: 통과/실패
- Treemap이 세로 막대 나열이 아니라 크고 작은 직사각형 블록 조합처럼 보임: 통과/실패
- Treemap이 직사각형 영역을 빈틈 적게 채움: 통과/실패
- 섹터/그룹 구분이 자연스럽게 보임: 통과/실패
- 대형 종목 타일이 의미 있게 크게 보임: 통과/실패
- 중소형 종목 타일이 남은 영역을 촘촘히 채움: 통과/실패
- Treemap 색상 범례가 명확함: 통과/실패
- PC Web 좌우 여백이 줄어듦: 통과/실패
- Home 본문 영역이 이전보다 넓게 느껴짐: 통과/실패
- Market dashboard가 이전보다 넓게 느껴짐: 통과/실패
- Momentum / Trend 산점도가 이전보다 크게 보임: 통과/실패
- 산점도 `단기 모멘텀` 문구가 표 영역을 침범하지 않음: 통과/실패
- 산점도 `장기 트렌드` 문구가 plot 직사각형 우측 하단에 배치됨: 통과/실패
- Treemap 크게 보기 동작: 통과/실패
- 산점도 크게 보기 동작: 통과/실패
- Treemap PNG 저장: 통과/실패/미실행
- 산점도 PNG 저장: 통과/실패/미실행
- Home 광고 sticky 동작 유지: 통과/실패/화면폭 부족
- Chart AI 차트 우선 UX 유지: 통과/실패
- Portfolio 주요 기능 유지: 통과/실패/미실행
- Header 로그인 라벨 안정성 유지: 통과/실패
- `Today: 000` placeholder 유지: 통과/실패
- OpenAI/Gemini/KIS/OpenDART/Trading Economics/ETFshopping/한경 실제 호출 없음: 통과/실패
- 브라우저 콘솔에 token/key/raw DB error/stack trace 노출 없음: 통과/실패
- 비밀 정보 없는 메모:
```

# Phase 3C.1 Portfolio Manual Smoke Checklist v0.1

## Status And Scope

Status: owner-performed manual smoke checklist and result template prepared.

Phase 3C.1 is documentation-only. It validates the Phase 3C Portfolio MVP through an owner-approved browser session, but Codex must not perform authenticated production Portfolio writes, sign in, create users, collect credentials, or call authenticated Portfolio write endpoints.

Credentials, tokens, keys, project references, environment values, and screenshots containing secrets must never be recorded in this checklist, chat, or planning docs.

## Preconditions

- Phase 3C is committed.
- The local or deployed app target is accessible to the owner.
- Public Supabase browser configuration is configured for the selected app target.
- The server-side service-role environment category is configured for the selected app target.
- An owner-approved test account is available and was created or approved by the owner.
- No real financial data, sensitive holdings, or personal financial information will be used.
- Browser console inspection is available.
- The owner will not share passwords, tokens, keys, project references, secret URLs, or screenshots containing secrets.

## Suggested Disposable Data

Use only disposable values:

- Portfolio name: `Smoke Test Portfolio`
- Portfolio memo or description, if supported: `Temporary manual smoke test`
- Position symbol: `AAPL`
- Position market: `US`
- Position quantity: `1`
- Position average or buy price: `100`
- Position currency: `USD`
- Position note or memo: `Temporary smoke test position`

Do not use real holdings, account names, cost basis, purchase dates, or personal financial details.

## Manual Checklist

Mark each item pass, fail, or not run. Record only non-secret notes.

1. Open `/`.
2. Confirm the page renders without an obvious blank page or blocking UI error.
3. Open the login modal from the header auth entry.
4. Sign in with the owner-approved test account without sharing credentials with Codex.
5. Confirm the signed-in state appears in the shell.
6. Confirm profile bootstrap completes or the UI reaches a profile-ready state.
7. Open `/portfolio`.
8. Confirm the Portfolio page recognizes the authenticated/profile-ready state.
9. Confirm the initial empty state is usable if no disposable portfolios exist.
10. Create `Smoke Test Portfolio`.
11. Select the newly created test portfolio.
12. Add the disposable `AAPL` position using the suggested data.
13. Refresh the page.
14. Confirm the test portfolio and test position persist after refresh.
15. Edit the test portfolio name or base currency with disposable values.
16. Edit the test position quantity, price, memo, or optional display name with disposable values.
17. Delete the test position.
18. Delete the test portfolio.
19. Sign out.
20. Confirm signed-out state hides Portfolio data.
21. Confirm unauthenticated access does not show user Portfolio data.
22. Inspect the browser console for secrets, tokens, raw database errors, raw stack traces, or server internals.
23. Confirm the Portfolio UI does not introduce broad crypto functionality outside the approved asset-class context.
24. Confirm slide ad and footer fixed ad do not block Portfolio navigation or cleanup.

## Phase 3C.2 Expected State Deltas

After Phase 3C.2, a signed-in owner-approved test account should not see Login as unavailable on `/portfolio`.

Expected states:

- Missing public browser login config: Login shows setup needed and Portfolio remains disabled.
- Signed out: Login shows required and the login button is visible.
- Signed in, profile bootstrap pending: Login shows signed in and Profile shows pending.
- Signed in, server-side profile or Portfolio config missing: Login stays signed in while Profile or Portfolio API shows a sanitized setup-needed message.
- Signed in, profile and Portfolio API ready: Login, Profile, and Portfolio API show ready/available states.

The login/signup modal should show Korean labels, a signup nickname field, a signup password confirmation field, and a Korean password mismatch validation message.

## Phase 3C.3 Expected State Deltas

After Phase 3C.3, the owner manual smoke should also confirm:

- Header auth controls do not briefly show a signed-out/login state during navigation after a valid session exists.
- `/portfolio` waits for session resolution before showing signed-out content.
- Sign-out immediately hides Portfolio and Position user data.
- Re-login reloads persisted Portfolio and Position data if the disposable data still exists.
- Current visible shell and Portfolio MVP UI labels are Korean-first.

## Phase 3C.4 Expected State Deltas

After Phase 3C.4, the owner manual smoke should also confirm:

- After login is confirmed, menu navigation keeps `로그아웃` visible.
- Menu navigation does not show unnecessary `확인 중` after a valid signed-in state is already known.
- `/portfolio` shows a compact status bar instead of a large readiness card.
- The position form uses one visible `종목명 또는 티커` field.
- The manual `자산 유형` select is not visible.
- Position table placeholders exist for `현재가`, `평가금액`, and `수익률`.
- A USD position in a KRW-base portfolio shows FX/valuation as pending, not falsely calculated.
- Position rows show security name on the first line and ticker/code status on the second line.
- `수정` and `삭제` actions are smaller and visually cleaner.
- Pretendard or improved Korean font rendering is visible.

## Phase 3C.4 Pass/Fail Result Template

Use this Korean-first format when reporting Phase 3C.4 results back to Codex. Do not include credentials, tokens, keys, project references, environment values, secret query strings, or screenshots containing secrets.

```text
Phase 3C.4 포트폴리오 UX 재점검 결과:

- 테스트 대상: local / deployed
- 브라우저: Chrome 등
- 로그인: 통과/실패
- 메뉴 이동 중 `로그아웃` 표시 유지: 통과/실패
- 메뉴 이동 중 불필요한 `확인 중` 표시 없음: 통과/실패
- `/portfolio` 진입: 통과/실패
- compact 상태바 표시: 통과/실패
- 포트폴리오 생성/조회/수정/삭제: 통과/실패/미실행
- 보유 종목 생성/조회/수정/삭제: 통과/실패/미실행
- `종목명 또는 티커` 단일 입력창: 통과/실패
- `자산 유형` 수동 선택 제거: 통과/실패
- 현재가/평가금액/수익률 자리 표시: 통과/실패
- USD 종목의 원화 환산 예정 표시: 통과/실패/해당 없음
- 종목명 상단·티커 하단 표시: 통과/실패
- 수정/삭제 버튼 크기와 테이블 구분선 개선: 통과/실패
- Pretendard 또는 개선된 한글 폰트 느낌: 통과/실패
- 로그아웃 즉시 데이터 숨김: 통과/실패
- 재로그인 후 데이터 재조회: 통과/실패/해당 없음
- 콘솔 비밀값/token/raw error 노출 없음: 통과/실패
- 테스트 데이터 정리: 통과/실패/해당 없음
- 비밀 정보 없는 메모:
```

## Phase 3C.5 Expected State Deltas

After Phase 3C.5, the owner manual smoke should also confirm:

- After login is confirmed, menu navigation keeps `로그아웃` visible.
- Menu navigation does not show unnecessary `확인 중` after a valid signed-in state is already known.
- Logged-out `/portfolio` shows a lock-style `로그인이 필요합니다` UI.
- The compact status bar does not show a duplicate login action.
- Portfolio name placeholder is `계좌 이름`.
- Portfolio card actions are smaller and visually calmer.
- Portfolio cards expose `위로` and `아래로` order controls.
- Position rows show a logo or fallback avatar.
- Position rows show a KR/US country badge.
- The manual `시장` select is not visible.
- The manual `자산 유형` select remains absent.
- The currency display toggle shows `현지통화 기준` and `원화 기준`.
- USD positions in KRW display mode show pending KRW conversion, not fake converted values.
- Valuation amount and return sorting controls exist.
- The position list is visually cleaner and closer to a modern finance app hierarchy.
- Lab uses the corrected `국회의원 보유 주식` label.

## Phase 3C.6 Expected State Deltas

After Phase 3C.6, the owner manual smoke should also confirm:

- Signed-out menu navigation keeps `로그인` visible.
- Signed-in menu navigation keeps `로그아웃` visible.
- Ordinary menu navigation does not visibly show `확인 중` in the header auth entry.
- Logged-out `/portfolio` shows a clear lock-style UI.
- Position cards do not overflow the parent panel.
- The position add form is not always visible in the main detail panel.
- The `종목 추가` button opens a bottom sheet.
- Position edit actions reuse the same bottom sheet.
- The currency display toggle shows `달러 기준` and `원화 기준`.
- USD buy-price display uses compact dollar formatting such as `$90.25`.
- KRW buy-price display uses compact won formatting such as `52,300원`.
- Clicking a position name opens `/chart-ai` with `symbol`, `name`, and `market` query parameters.
- Chart AI displays the selected security from query parameters without provider, AI, market-data, or authenticated calls.

## Phase 3C.6 Pass/Fail Result Template

Use this Korean-first format when reporting Phase 3C.6 results back to Codex. Do not include credentials, tokens, keys, project references, environment values, secret query strings, or screenshots containing secrets.

```text
Phase 3C.6 포트폴리오 최종 UX 재점검 결과:

- 테스트 대상: local / deployed
- 브라우저: Chrome 등
- 로그아웃 상태에서 메뉴 이동 중 `로그인` 유지: 통과/실패
- 로그인 상태에서 메뉴 이동 중 `로그아웃` 유지: 통과/실패
- 메뉴 이동 중 불필요한 `확인 중` 표시 없음: 통과/실패
- 로그아웃 잠금 UI가 명확함: 통과/실패
- 포지션 리스트가 부모 영역 밖으로 넘치지 않음: 통과/실패
- `종목 추가` 버튼으로 바텀시트 열림: 통과/실패
- 포지션 수정도 같은 바텀시트 사용: 통과/실패
- 통화 토글 `달러 기준` / `원화 기준` 표시: 통과/실패
- USD 금액 `$90.25` 형식 표시: 통과/실패/해당 없음
- KRW 금액 `52,300원` 형식 표시: 통과/실패/해당 없음
- 종목명 클릭 시 Chart AI로 이동: 통과/실패
- Chart AI 선택 종목 프리필 표시: 통과/실패
- Chart AI에서 외부 AI/provider 호출 없음: 통과/실패
- 콘솔 비밀값/token/raw error 노출 없음: 통과/실패
- 테스트 데이터 정리: 통과/실패/해당 없음
- 비밀 정보 없는 메모:
```

## Phase 3C.7 Expected State Deltas

After Phase 3C.7, the owner manual smoke should also confirm:

- Signed-out menu navigation keeps `로그인` visible.
- Signed-in menu navigation keeps `로그아웃` visible.
- Normal menu navigation does not visibly show `확인 중`.
- Logged-out lock UI uses only `🔐` or another clean lock visual.
- Lock icon has no sky-blue background.
- Lock icon is large and visually clear.
- Position add bottom sheet opens with slide-up motion.
- Position edit bottom sheet opens with the same slide-up motion.
- Bottom sheet closes with slide-down or natural exit motion.
- Top-left logo uses the original project logo if found.
- Portfolio refresh is shown as an icon button, not visible text.
- Chart AI selected-security prefill still works.

## Phase 3C.7 Pass/Fail Result Template

Use this Korean-first format when reporting Phase 3C.7 results back to Codex. Do not include credentials, tokens, keys, project references, environment values, secret query strings, or screenshots containing secrets.

```text
Phase 3C.7 포트폴리오 시각/모션 재점검 결과:

- 테스트 대상: local / deployed
- 브라우저: Chrome 등
- 로그아웃 상태에서 메뉴 이동 중 `로그인` 유지: 통과/실패
- 로그인 상태에서 메뉴 이동 중 `로그아웃` 유지: 통과/실패
- 메뉴 이동 중 불필요한 `확인 중` 표시 없음: 통과/실패
- 로그아웃 잠금 UI가 `🔐` 아이콘 중심으로 명확함: 통과/실패
- 잠금 아이콘에 불필요한 배경/겹침 없음: 통과/실패
- 잠금 아이콘 크기 적절함: 통과/실패
- `종목 추가` 바텀시트가 아래에서 위로 자연스럽게 열림: 통과/실패
- 포지션 수정 바텀시트도 동일하게 자연스럽게 열림: 통과/실패/미실행
- 바텀시트 닫기 동작이 자연스러움: 통과/실패
- 사이트 좌측 상단 로고가 기존 프로젝트 로고로 적용됨: 통과/실패/자산 없음
- 포트폴리오 `새로고침`이 아이콘 버튼으로 표시됨: 통과/실패
- Chart AI 선택 종목 프리필 유지: 통과/실패
- 포트폴리오 생성/조회/수정/삭제 유지: 통과/실패/미실행
- 보유 종목 생성/조회/수정/삭제 유지: 통과/실패/미실행
- 로그아웃 즉시 데이터 숨김 유지: 통과/실패
- 재로그인 후 데이터 재조회 유지: 통과/실패/해당 없음
- 콘솔 비밀값/token/raw error 노출 없음: 통과/실패
- 테스트 데이터 정리: 통과/실패/해당 없음
- 비밀 정보 없는 메모:
```

## Phase 3C.8 Expected State Deltas

After Phase 3C.8, the owner manual smoke should also confirm:

- Signed-in menu navigation does not visibly show `확인 중`.
- Signed-out menu navigation does not visibly show `확인 중`.
- Signed-out normal header state remains `로그인`.
- Signed-in normal header state remains `로그아웃`.
- Header logo is slightly larger and visually balanced with the brand text.
- Phase 3C.7 lock UI still uses a clear lock visual.
- Phase 3C.7 bottom-sheet motion still works.
- Portfolio refresh remains an icon button.
- Chart AI selected-security prefill still works.
- The Home vertical banner feasibility report exists.
- No actual Home vertical banner is shown yet.

## Phase 3C.8 Pass/Fail Result Template

Use this Korean-first format when reporting Phase 3C.8 results back to Codex. Do not include credentials, tokens, keys, project references, environment values, secret query strings, or screenshots containing secrets.

```text
Phase 3C.8 헤더/로고/배너공간 사전점검 결과:

- 테스트 대상: local / deployed
- 브라우저: Chrome 등
- 로그아웃 상태에서 메뉴 이동 중 `로그인` 유지: 통과/실패
- 로그인 상태에서 메뉴 이동 중 `로그아웃` 유지: 통과/실패
- 메뉴 이동 중 불필요한 `확인 중` 표시 없음: 통과/실패
- 좌측 상단 로고 크기 확대와 정렬: 통과/실패
- 포트폴리오 잠금 UI 유지: 통과/실패
- 바텀시트 모션 유지: 통과/실패
- 포트폴리오 새로고침 아이콘 유지: 통과/실패
- Chart AI 선택 종목 프리필 유지: 통과/실패
- Home 세로 배너 공간 산출 보고서 확인: 통과/실패
- 실제 배너가 아직 노출되지 않음: 통과/실패
- 콘솔 비밀값/token/raw error 노출 없음: 통과/실패
- 비밀 정보 없는 메모:
```

## Phase 3C.9 Expected State Deltas

After Phase 3C.9, the owner manual smoke should also confirm:

- Signed-in menu navigation does not briefly flash `로그인`.
- Signed-in normal header state remains `로그아웃`.
- Signed-out normal header state remains `로그인`.
- Visible `확인 중` remains absent.
- The logo box remains balanced while the inner MK mark appears larger.
- Header shows subtle `Today: 000`.
- Real visitor counting is not active yet.
- Home right rail appears only on sufficiently wide desktop.
- Home right rail is not shown on non-Home pages.
- The two sample banners rotate every 5 seconds with left-slide motion.
- Portfolio lock UI remains.
- Bottom-sheet motion remains.
- Portfolio refresh icon remains.
- Chart AI selected-security prefill still works.

## Phase 3C.9 Pass/Fail Result Template

Use this Korean-first format when reporting Phase 3C.9 results back to Codex. Do not include credentials, tokens, keys, project references, environment values, secret query strings, or screenshots containing secrets.

```text
Phase 3C.9 헤더/배너/Today 사전점검 결과:

- 테스트 대상: local / deployed
- 브라우저: Chrome 등
- 로그인 상태에서 메뉴 이동 중 `로그아웃` 유지 및 `로그인` 순간 노출 없음: 통과/실패
- 로그아웃 상태에서 메뉴 이동 중 `로그인` 유지: 통과/실패
- 메뉴 이동 중 불필요한 `확인 중` 표시 없음: 통과/실패
- 좌측 상단 로고 박스 안의 MK 마크가 더 크게 보임: 통과/실패
- 헤더의 연한 회색 `Today: 000` 표시: 통과/실패
- 실제 방문자 집계가 아직 동작하지 않음: 통과/실패
- Home 우측 세로 배너가 넓은 데스크톱에서 표시됨: 통과/실패/화면폭 부족
- Home 우측 세로 배너가 2개 샘플로 5초마다 왼쪽 슬라이드 전환됨: 통과/실패/미실행
- Home 우측 세로 배너가 다른 페이지에는 표시되지 않음: 통과/실패
- 포트폴리오 잠금 UI 유지: 통과/실패
- 바텀시트 모션 유지: 통과/실패
- 포트폴리오 새로고침 아이콘 유지: 통과/실패
- Chart AI 선택 종목 프리필 유지: 통과/실패
- 콘솔 비밀값/token/raw error 노출 없음: 통과/실패
- 비밀 정보 없는 메모:
```

## Phase 3C.12 Expected State Deltas

After Phase 3C.12, the owner manual smoke should also confirm:

- `/?railPreview=1` shows a visible Home preview panel in the page body.
- The preview panel has an obvious `HOME RAIL PREVIEW` label or equivalent.
- Sample Banner 01 and Sample Banner 02 are visible or have visible text fallback.
- The two sample banners rotate every 5 seconds.
- Hover pause works if tested.
- `/portfolio?railPreview=1` does not show the preview panel.
- `/chart-ai?railPreview=1` does not show the preview panel.
- `/lab?railPreview=1` does not show the preview panel.
- `/heatmap?railPreview=1` does not show the preview panel.
- Normal Home without preview still follows the wide-desktop breakpoint.
- `Today: 000` still appears.
- Real visitor counting is not active.
- Header auth state remains stable.
- Portfolio and Chart AI behavior remain stable.

## Phase 3C.12 Pass/Fail Result Template

Use this Korean-first format when reporting Phase 3C.12 results back to Codex. Do not include credentials, tokens, keys, project references, environment values, secret query strings, or screenshots containing secrets.

```text
Phase 3C.12 Home 배너 Preview Fallback 재점검 결과:

* 테스트 대상: local / deployed
* 브라우저: Chrome 등
* Home 일반 접속에서 화면폭 부족 시 기존 배너 숨김 유지: 통과/실패/화면폭 충분
* `/?railPreview=1`에서 Home 본문 안에 Preview 패널이 보임: 통과/실패
* Preview 패널에 `HOME RAIL PREVIEW` 또는 식별 가능한 라벨이 보임: 통과/실패
* Preview 패널에서 Sample Banner 01/02 이미지 또는 텍스트 fallback이 보임: 통과/실패
* Preview 패널에서 2개 샘플 배너가 5초마다 전환됨: 통과/실패
* Preview 패널 hover 시 전환 일시정지: 통과/실패/미실행
* `/portfolio?railPreview=1`에서 Preview 패널 미노출: 통과/실패
* `/chart-ai?railPreview=1`에서 Preview 패널 미노출: 통과/실패
* `/lab?railPreview=1`에서 Preview 패널 미노출: 통과/실패
* `/heatmap?railPreview=1`에서 Preview 패널 미노출: 통과/실패
* 로그인 상태에서 메뉴 이동 중 `로그아웃` 유지 및 `로그인` 순간 노출 없음: 통과/실패
* 메뉴 이동 중 불필요한 `확인 중` 표시 없음: 통과/실패
* 헤더의 연한 회색 `Today: 000` 표시 유지: 통과/실패
* 실제 방문자 집계가 아직 동작하지 않음: 통과/실패
* 포트폴리오 잠금 UI 유지: 통과/실패
* 바텀시트 모션 유지: 통과/실패
* 포트폴리오 새로고침 아이콘 유지: 통과/실패
* Chart AI 선택 종목 프리필 유지: 통과/실패
* 콘솔 비밀값/token/raw error 노출 없음: 통과/실패
* 비밀 정보 없는 메모:
```

## Phase 3C.11 Expected State Deltas

After Phase 3C.11, the owner manual smoke should also confirm:

- `/?railPreview=1` visibly shows the Home rail in the normal local browser viewport.
- `/?railPreview=1` positions the Home rail inside the visible viewport.
- `/?railPreview=1` rotates the two sample banners every 5 seconds.
- `/?railPreview=1` pauses rotation on hover if tested.
- `/portfolio?railPreview=1` does not show the Home rail.
- `/chart-ai?railPreview=1` does not show the Home rail.
- `/lab?railPreview=1` does not show the Home rail.
- Normal Home without preview still follows the wide-desktop breakpoint.
- `Today: 000` still appears.
- Real visitor counting is not active.
- Header auth state remains stable.
- Portfolio and Chart AI behavior remain stable.

## Phase 3C.11 Pass/Fail Result Template

Use this Korean-first format when reporting Phase 3C.11 results back to Codex. Do not include credentials, tokens, keys, project references, environment values, secret query strings, or screenshots containing secrets.

```text
Phase 3C.11 Home 배너 Preview 표시 재점검 결과:

* 테스트 대상: local / deployed
* 브라우저: Chrome 등
* Home 일반 접속에서 화면폭 부족 시 배너 숨김 유지: 통과/실패/화면폭 충분
* `/?railPreview=1`에서 Home 배너가 실제 화면 안에 보임: 통과/실패
* `/?railPreview=1`에서 배너 위치가 화면 오른쪽에 정상 표시됨: 통과/실패
* `/?railPreview=1`에서 2개 샘플 배너가 5초마다 왼쪽 슬라이드 전환: 통과/실패
* `/?railPreview=1`에서 배너 hover 시 전환 일시정지: 통과/실패/미실행
* `/portfolio?railPreview=1`에서 배너 미노출: 통과/실패
* `/chart-ai?railPreview=1`에서 배너 미노출: 통과/실패
* `/lab?railPreview=1`에서 배너 미노출: 통과/실패
* 로그인 상태에서 메뉴 이동 중 `로그아웃` 유지 및 `로그인` 순간 노출 없음: 통과/실패
* 메뉴 이동 중 불필요한 `확인 중` 표시 없음: 통과/실패
* 헤더의 연한 회색 `Today: 000` 표시 유지: 통과/실패
* 실제 방문자 집계가 아직 동작하지 않음: 통과/실패
* 포트폴리오 잠금 UI 유지: 통과/실패
* 바텀시트 모션 유지: 통과/실패
* 포트폴리오 새로고침 아이콘 유지: 통과/실패
* Chart AI 선택 종목 프리필 유지: 통과/실패
* 콘솔 비밀값/token/raw error 노출 없음: 통과/실패
* 비밀 정보 없는 메모:
```

## Phase 3C.10 Expected State Deltas

After Phase 3C.10, the owner manual smoke should also confirm:

- `/?railPreview=1` shows the Home rail even if the viewport is below 1660px.
- `/?railPreview=1` rotates the two sample banners every 5 seconds.
- `/?railPreview=1` pauses rotation on hover if tested.
- `/portfolio?railPreview=1` does not show the Home rail.
- `/chart-ai?railPreview=1` does not show the Home rail.
- `/lab?railPreview=1` does not show the Home rail.
- Normal Home without preview still follows the wide-desktop breakpoint.
- Header auth state remains stable.
- `Today: 000` still appears.
- Real visitor counting is not active.
- Portfolio and Chart AI behavior remain stable.

## Phase 3C.10 Pass/Fail Result Template

Use this Korean-first format when reporting Phase 3C.10 results back to Codex. Do not include credentials, tokens, keys, project references, environment values, secret query strings, or screenshots containing secrets.

```text
Phase 3C.10 Home 배너 검증 사전점검 결과:

- 테스트 대상: local / deployed
- 브라우저: Chrome 등
- Home 일반 접속에서 화면폭 부족 시 배너 숨김 유지: 통과/실패/화면폭 충분
- `/?railPreview=1`에서 화면폭과 무관하게 Home 배너 표시: 통과/실패
- `/?railPreview=1`에서 2개 샘플 배너가 5초마다 왼쪽 슬라이드 전환: 통과/실패
- `/?railPreview=1`에서 배너 hover 시 전환 일시정지: 통과/실패/미실행
- `/portfolio?railPreview=1`에서 배너 미노출: 통과/실패
- `/chart-ai?railPreview=1`에서 배너 미노출: 통과/실패
- `/lab?railPreview=1`에서 배너 미노출: 통과/실패
- 로그인 상태에서 메뉴 이동 중 `로그아웃` 유지 및 `로그인` 순간 노출 없음: 통과/실패
- 메뉴 이동 중 불필요한 `확인 중` 표시 없음: 통과/실패
- 헤더의 연한 회색 `Today: 000` 표시 유지: 통과/실패
- 실제 방문자 집계가 아직 동작하지 않음: 통과/실패
- 포트폴리오 잠금 UI 유지: 통과/실패
- 바텀시트 모션 유지: 통과/실패
- 포트폴리오 새로고침 아이콘 유지: 통과/실패
- Chart AI 선택 종목 프리필 유지: 통과/실패
- 콘솔 비밀값/token/raw error 노출 없음: 통과/실패
- 비밀 정보 없는 메모:
```

## Phase 3C.5 Pass/Fail Result Template

Use this Korean-first format when reporting Phase 3C.5 results back to Codex. Do not include credentials, tokens, keys, project references, environment values, secret query strings, or screenshots containing secrets.

```text
Phase 3C.5 포트폴리오 리스트 재점검 결과:

- 테스트 대상: local / deployed
- 브라우저: Chrome 등
- 로그인: 통과/실패
- 메뉴 이동 중 `로그아웃` 표시 유지: 통과/실패
- 메뉴 이동 중 불필요한 `확인 중` 표시 없음: 통과/실패
- 로그아웃 상태의 물쇠형 `로그인이 필요합니다` UI: 통과/실패
- compact 상태바 중복 로그인 제거: 통과/실패
- `계좌 이름` placeholder: 통과/실패
- 포트폴리오 카드 `수정`/`삭제` 크기 개선: 통과/실패
- 포트폴리오 순서 변경 버튼: 통과/실패
- 보유 종목 로고 또는 fallback 아바타: 통과/실패
- 종목 국가 배지: 통과/실패
- `시장` 수동 선택 제거: 통과/실패
- `자산 유형` 수동 선택 제거 유지: 통과/실패
- 통화 표시 토글 `현지통화 기준 / 원화 기준`: 통과/실패
- USD 종목의 원화 기준 표시가 `원화 환산 예정` 등으로 안전하게 표시: 통과/실패/해당 없음
- 평가금액/수익률 정렬 컨트롤: 통과/실패
- 종목 리스트가 토스증권 참고형으로 더 정리됨: 통과/실패
- Lab의 `국회의원 보유 주식` 라벨 정정: 통과/실패
- 포트폴리오 생성/조회/수정/삭제: 통과/실패/미실행
- 보유 종목 생성/조회/수정/삭제: 통과/실패/미실행
- 로그아웃 즉시 데이터 숨김: 통과/실패
- 재로그인 후 데이터 재조회: 통과/실패/해당 없음
- 콘솔 비밀값/token/raw error 노출 없음: 통과/실패
- 테스트 데이터 정리: 통과/실패/해당 없음
- 비밀 정보 없는 메모:
```

## Pass/Fail Result Template

Use this Korean-first format when reporting results back to Codex. Do not include credentials, tokens, keys, project references, environment values, secret query strings, or screenshots containing secrets.

```text
Phase 3C.3 포트폴리오 수동 점검 결과:

- 테스트 대상: local / deployed
- 브라우저: Chrome 등
- 로그인: 통과/실패
- 헤더 로그인 상태 유지: 통과/실패
- 메뉴 이동 중 로그인 상태 깜박임 없음: 통과/실패
- `/portfolio` 진입: 통과/실패
- 포트폴리오 화면의 로그인 상태: 통과/실패
- 프로필 상태: 통과/실패
- 포트폴리오 API 상태: 통과/실패
- 기존 포트폴리오 자동 재조회: 통과/실패/해당 없음
- 포트폴리오 생성/조회/수정/삭제: 통과/실패/미실행
- 보유 종목 생성/조회/수정/삭제: 통과/실패/미실행
- 새로고침 후 데이터 유지: 통과/실패/미실행
- 로그아웃 즉시 데이터 숨김: 통과/실패
- 재로그인 후 데이터 재조회: 통과/실패/해당 없음
- 한국어 UI 표시: 통과/실패
- 회원가입 닉네임 입력칸: 통과/실패
- 회원가입 비밀번호 확인칸: 통과/실패
- 비밀번호 불일치 검증: 통과/실패
- 콘솔 비밀값/token/raw error 노출 없음: 통과/실패
- 테스트 데이터 정리: 통과/실패/해당 없음
- 비밀 정보 없는 메모:
```

## Failure Triage Guide

Record only the failure category and non-secret details.

| Symptom | Likely Cause | Safe Next Action |
|---|---|---|
| Login controls are unavailable. | Supabase public config is missing for the selected app target. | Record the missing-public-config symptom without values and stop. |
| Portfolio API says unavailable. | Server-side service-role environment category is missing or not loaded. | Record the API-unavailable symptom without values and stop. |
| Profile never becomes ready. | Profile bootstrap is failing or server auth validation is unavailable. | Record profile-bootstrap fail and the sanitized UI message only. |
| Portfolio API returns 401 while signed in. | Session token is absent, expired, or rejected by server validation. | Sign out and back in once; if still failing, record 401 and stop. |
| Portfolio API returns 403 or 404 for owned test data. | Ownership lookup, RLS, or route scoping may be misaligned. | Record the operation and sanitized status only. |
| Generic configuration unavailable message appears. | Runtime server environment is missing even though build passed. | Record build-versus-runtime config mismatch and stop. |
| Validation error appears. | Disposable input does not match allowed fields or numeric bounds. | Retry once with the suggested disposable data. |
| UI does not refresh after create, edit, or delete. | Client state refresh or selection handling may be stale. | Record the action and visible non-secret state mismatch. |
| Console shows raw error, token, key, or stack trace. | Sanitization boundary failed. | Stop immediately and report only that a secret/raw error exposure was observed. |
| Build passes but runtime fails. | Deployment or preview runtime environment differs from build environment. | Record the app target type and sanitized runtime symptom only. |

Do not paste secrets, tokens, project references, environment values, database identifiers, or screenshots with secrets when reporting failures.

## Stop Conditions

Stop the manual smoke immediately if any of these occur:

- A secret, token, key, or credential appears in the UI or browser console.
- A raw database error, stack trace, or server internal appears in browser-visible UI.
- Another user's data appears.
- Signed-out state still shows Portfolio data.
- An unauthenticated request appears to create, edit, or delete Portfolio data.
- The owner is asked to paste credentials into chat or docs.
- Real or sensitive production data is present.
- Broad crypto functionality appears in Portfolio UI outside the approved asset-class context.

## Cleanup

- Delete the disposable test position before deleting the disposable test portfolio.
- Delete the disposable test portfolio before ending the smoke check.
- If cleanup fails, record only a non-secret cleanup failure and stop.
- Do not perform SQL cleanup unless a later phase explicitly approves it.
- Do not ask Codex to clean production data directly in Phase 3C.1.

## Recommended Next Action

Choose exactly one:

- If Phase 3D smoke passes: proceed to the next approved Chart AI provider-boundary planning or integration-preparation phase.
- If Phase 3D smoke fails: prepare a focused Phase 3D follow-up using non-secret failure details.

Options:

- Option A: Run Phase 3D manual Chart AI skeleton smoke now and report non-secret pass/fail.
- Option B: Prepare the next Chart AI provider-boundary planning phase after Phase 3D smoke passes.
- Option C: Run Advisor/security follow-up before additional provider-backed feature work.

## Final Statement

Phase 3C.1 is checklist and documentation only. Codex performed no production mutation, no environment mutation, no deployment, and no code implementation for this phase.

## Phase 3D Chart AI Manual Smoke Delta

Use this Korean-first format when reporting Phase 3D results back to Codex. Do not include credentials, tokens, keys, project references, environment values, secret query strings, or screenshots containing secrets.

```text
Phase 3D Chart AI 사용량 가드 Skeleton 점검 결과:

- 테스트 대상: local / deployed
- 브라우저: Chrome 등
- `/chart-ai` 진입: 통과/실패
- `/chart-ai?symbol=005930&name=삼성전자&market=KR` 선택 종목 프리필: 통과/실패
- 선택 종목 없이 실행 시 종목 선택 필요 안내: 통과/실패
- 로그아웃 상태에서 `AI 분석 실행` 클릭 시 로그인 필요 상태 표시: 통과/실패
- 로그인 상태에서 `AI 분석 실행` 클릭 시 서버 사용량 가드 확인 시도: 통과/실패/미실행
- 성공 시 실제 AI 분석이 아니라 준비 상태 안내만 표시: 통과/실패/미실행
- 일일 한도 초과 시 한도 안내 표시: 통과/실패/미실행
- 서비스 설정 부족 시 설정 필요 안내 표시: 통과/실패/미실행
- OpenAI/Gemini/KIS/OpenDART 실제 호출 없음: 통과/실패
- Chart AI 화면에서 token/key/raw DB error/stack trace 노출 없음: 통과/실패
- 로그인 상태에서 메뉴 이동 중 `로그아웃` 유지 및 `로그인` 순간 노출 없음: 통과/실패
- 메뉴 이동 중 불필요한 `확인 중` 표시 없음: 통과/실패
- Header의 `Today: 000` placeholder 유지: 통과/실패
- 실제 방문자 집계가 아직 동작하지 않음: 통과/실패
- Portfolio 잠금 UI 유지: 통과/실패
- Portfolio 생성/조회/수정/삭제 유지: 통과/실패/미실행
- 보유 종목 생성/조회/수정/삭제 유지: 통과/실패/미실행
- Portfolio에서 Chart AI 선택 종목 프리필 유지: 통과/실패
- Home `/?railPreview=1` fallback preview 유지: 통과/실패/미실행
- 비밀 정보 없는 메모:
```

## Phase 3E Market, Chart AI, And Home Ad Manual Smoke Delta

Use this Korean-first format when reporting Phase 3E results back to Codex. Do not include credentials, tokens, keys, project references, environment values, secret query strings, or screenshots containing secrets.

```text
Phase 3E 시장/Chart AI/Home 광고 UX 점검 결과:

- 테스트 대상: local / deployed
- 브라우저: Chrome 등
- Home 일반 접속에서 오른쪽 광고 배너 표시: 통과/실패/화면폭 부족
- Home에서 `HOME RAIL PREVIEW` 패널이 더 이상 보이지 않음: 통과/실패
- Home 광고 배너가 2개 샘플로 5초마다 전환됨: 통과/실패/미실행
- `/chart-ai`, `/portfolio`, `/lab`, `/market` 또는 `/heatmap`에서 Home 광고 배너 미노출: 통과/실패
- 메뉴명이 `시장`으로 표시됨: 통과/실패
- 기존 Heatmap 메뉴명이 주요 메뉴에서 제거됨: 통과/실패
- 시장 페이지 진입: 통과/실패
- KOSPI200 섹션 표시: 통과/실패
- KOSDAQ150 섹션 표시: 통과/실패
- S&P500 섹션 표시: 통과/실패
- NASDAQ100 섹션 표시: 통과/실패
- My Portfolio holdings 섹션 표시: 통과/실패
- 각 섹션의 Heatmap 카드 표시: 통과/실패
- 각 섹션의 단기 모멘텀 × 장기 트렌드 산점도 카드 표시: 통과/실패
- Heatmap 카드 오른쪽 상단 카메라 아이콘 표시: 통과/실패
- 산점도 카드 오른쪽 상단 카메라 아이콘 표시: 통과/실패
- 카메라 아이콘 클릭 시 PNG 이미지가 로컬에 저장됨: 통과/실패
- `/chart-ai` 질문 입력 칸 제거: 통과/실패
- `/chart-ai` 종목명/티커 입력 옆 `차트 불러오기` 버튼 표시: 통과/실패
- `/chart-ai` 일봉/주봉/월봉 선택이 차트 영역에 표시: 통과/실패
- `/chart-ai?symbol=005930&name=삼성전자&market=KR` 선택 종목 프리필 유지: 통과/실패
- `AI 분석 실행`이 차트 준비 이후 후속 액션으로 보임: 통과/실패
- 실제 AI 분석이 아니라 준비 상태 안내만 표시: 통과/실패/미실행
- OpenAI/Gemini/KIS/OpenDART/Trading Economics 실제 호출 없음: 통과/실패
- Portfolio 주요 기능 유지: 통과/실패/미실행
- Header 로그인 라벨 안정성 유지: 통과/실패
- `Today: 000` placeholder 유지: 통과/실패
- 실제 방문자 집계가 아직 동작하지 않음: 통과/실패
- 브라우저 콘솔에 token/key/raw DB error/stack trace 노출 없음: 통과/실패
- 비밀 정보 없는 메모:
```

## Phase 3E.1 Home Rail, Footer, Market Expand, And Export Manual Smoke Delta

Use this Korean-first format when reporting Phase 3E.1 results back to Codex. Do not include credentials, tokens, keys, project references, environment values, secret query strings, or screenshots containing secrets.

```text
Phase 3E.1 Home 광고/시장 카드 보정 점검 결과:

- 테스트 대상: local / deployed
- 브라우저: Chrome 등
- Home 일반 접속에서 오른쪽 광고 배너가 하단 잘림 없이 표시됨: 통과/실패/화면폭 부족
- 하단 footer 또는 footer ad가 스크롤을 따라다니지 않음: 통과/실패
- Home 광고 배너가 2개 샘플로 5초마다 전환됨: 통과/실패/미실행
- `/chart-ai`, `/portfolio`, `/lab`, `/market`, `/heatmap`에서 Home 광고 배너 미노출: 통과/실패
- 시장 페이지 진입: 통과/실패
- Heatmap 카드 확대 아이콘 표시: 통과/실패
- 산점도 카드 확대 아이콘 표시: 통과/실패
- Heatmap 카드 확대 보기 열림: 통과/실패
- 산점도 카드 확대 보기 열림: 통과/실패
- 확대 보기 닫기 버튼 동작: 통과/실패
- ESC로 확대 보기 닫힘: 통과/실패/미실행
- 카메라 아이콘 클릭 시 PNG 이미지가 로컬에 저장됨: 통과/실패
- 저장된 PNG에 카드 제목과 차트 본문이 포함됨: 통과/실패/미실행
- 저장된 PNG에 카메라/확대 아이콘이 불필요하게 포함되지 않음: 통과/실패/미실행
- `/chart-ai` 질문 입력 칸 제거 유지: 통과/실패
- `/chart-ai` 차트 불러오기 버튼 유지: 통과/실패
- `/chart-ai` 일봉/주봉/월봉 선택이 차트 영역에 유지: 통과/실패
- `/chart-ai?symbol=005930&name=삼성전자&market=KR` 선택 종목 프리필 유지: 통과/실패
- OpenAI/Gemini/KIS/OpenDART/Trading Economics 실제 호출 없음: 통과/실패
- Portfolio 주요 기능 유지: 통과/실패/미실행
- Header 로그인 라벨 안정성 유지: 통과/실패
- `Today: 000` placeholder 유지: 통과/실패
- 실제 방문자 집계가 아직 동작하지 않음: 통과/실패
- 브라우저 콘솔에 token/key/raw DB error/stack trace 노출 없음: 통과/실패
- 비밀 정보 없는 메모:
```

## Phase 3E.2 Home Sidebar And Market Scatter Manual Smoke Delta

Use this Korean-first format when reporting Phase 3E.2 results back to Codex. Do not include credentials, tokens, keys, project references, environment values, secret query strings, or screenshots containing secrets.

```text
Phase 3E.2 Home 광고/시장 산점도 재점검 결과:

- 테스트 대상: local / deployed
- 브라우저: Chrome 등
- Home 일반 접속에서 오른쪽 광고 배너가 헤더/메뉴와 겹치지 않음: 통과/실패/화면폭 부족
- Home 일반 접속에서 오른쪽 광고 배너가 footer 또는 하단 광고와 겹치지 않음: 통과/실패/화면폭 부족
- Home 광고 배너가 2개 샘플로 5초마다 전환됨: 통과/실패/미실행
- Home 광고 배너 hover 시 전환 일시정지: 통과/실패/미실행
- `/chart-ai`, `/portfolio`, `/lab`, `/market`, `/heatmap`에서 Home 광고 배너 미노출: 통과/실패
- Market 산점도 카드 확대 보기에서 차트가 검은 영역 없이 표시됨: 통과/실패
- Market 산점도 카드 확대 보기가 한 화면 안에 표시되고 내부 스크롤이 과하지 않음: 통과/실패
- Market 확대 보기 닫기 X가 명확히 보임: 통과/실패
- Market 산점도 PNG 저장 시 검은 사각형 없이 저장됨: 통과/실패/미실행
- Market Heatmap PNG 저장은 유지됨: 통과/실패/미실행
- Chart AI 차트 우선 UX 유지: 통과/실패
- Chart AI 선택 종목 프리필 유지: 통과/실패
- Portfolio 주요 기능 유지: 통과/실패/미실행
- Header 로그인 라벨 안정성 유지: 통과/실패
- `Today: 000` placeholder 유지: 통과/실패
- 실제 방문자 집계가 아직 동작하지 않음: 통과/실패
- OpenAI/Gemini/KIS/OpenDART/Trading Economics 실제 호출 없음: 통과/실패
- 브라우저 콘솔에 token/key/raw DB error/stack trace 노출 없음: 통과/실패
- 비밀 정보 없는 메모:
```

## Phase 3E.3 Home Sidebar Sticky Manual Smoke Delta

Use this Korean-first format when reporting Phase 3E.3 results back to Codex. Do not include credentials, tokens, keys, project references, environment values, secret query strings, or screenshots containing secrets.

```text
Phase 3E.3 Home 광고 Sticky 보정 점검 결과:

- 테스트 대상: local / deployed
- 브라우저: Chrome 등
- Home 광고 배너가 본문 오른쪽 영역에 표시됨: 통과/실패/화면폭 부족
- Home 광고 배너가 스크롤 중 일정 위치에서 따라옴: 통과/실패
- Home 광고 배너가 header/nav/ticker 영역을 침범하지 않음: 통과/실패
- Home 광고 배너가 footer/footer ad 영역을 침범하지 않음: 통과/실패
- footer 근처에서 Home 광고 배너가 자연스럽게 멈추거나 본문과 함께 벗어남: 통과/실패
- Home 광고 배너가 2개 샘플로 5초마다 전환됨: 통과/실패/미실행
- Home 광고 배너 hover 시 전환 일시정지: 통과/실패/미실행
- 비 Home 페이지에서 Home 광고 배너 미노출: 통과/실패
- Market 산점도 카드 확대 보기에서 차트가 검은 영역 없이 표시됨: 통과/실패
- Market 산점도 PNG 저장 시 검은 사각형 없이 저장됨: 통과/실패/미실행
- Chart AI 차트 우선 UX 유지: 통과/실패
- Chart AI 선택 종목 프리필 유지: 통과/실패
- Portfolio 주요 기능 유지: 통과/실패/미실행
- Header 로그인 라벨 안정성 유지: 통과/실패
- `Today: 000` placeholder 유지: 통과/실패
- 실제 방문자 집계가 아직 동작하지 않음: 통과/실패
- OpenAI/Gemini/KIS/OpenDART/Trading Economics 실제 호출 없음: 통과/실패
- 브라우저 콘솔에 token/key/raw DB error/stack trace 노출 없음: 통과/실패
- 비밀 정보 없는 메모:
```

## Phase 3E.4 Home Sidebar Sticky Range Manual Smoke Delta

Use this Korean-first format when reporting Phase 3E.4 results back to Codex. Do not include credentials, tokens, keys, project references, environment values, secret query strings, or screenshots containing secrets.

```text
Phase 3E.4 Home 광고 Sticky Range 보정 점검 결과:

- 테스트 대상: local / deployed
- 브라우저: Chrome 등
- Home 광고 배너가 본문 오른쪽 영역에 표시됨: 통과/실패/화면폭 부족
- Home 광고 배너가 스크롤 중 일정 위치에서 따라옴: 통과/실패
- Home 광고 배너가 header/nav/ticker 영역을 침범하지 않음: 통과/실패
- Home 광고 배너가 footer/footer ad 영역을 침범하지 않음: 통과/실패
- footer 근처에서 Home 광고 배너가 자연스럽게 멈추거나 본문과 함께 벗어남: 통과/실패
- Home 광고 배너가 2개 샘플로 5초마다 전환됨: 통과/실패/미실행
- Home 광고 배너 hover 시 전환 일시정지: 통과/실패/미실행
- 비 Home 페이지에서 Home 광고 배너 미노출: 통과/실패
- Market 산점도 카드 확대 보기에서 차트가 검은 영역 없이 표시됨: 통과/실패
- Market 산점도 PNG 저장 시 검은 사각형 없이 저장됨: 통과/실패/미실행
- Chart AI 차트 우선 UX 유지: 통과/실패
- Chart AI 선택 종목 프리필 유지: 통과/실패
- Portfolio 주요 기능 유지: 통과/실패/미실행
- Header 로그인 라벨 안정성 유지: 통과/실패
- `Today: 000` placeholder 유지: 통과/실패
- 실제 방문자 집계가 아직 동작하지 않음: 통과/실패
- OpenAI/Gemini/KIS/OpenDART/Trading Economics/ETFshopping/한경 실제 호출 없음: 통과/실패
- Phase 3F에서 Heatmap 명칭을 Treemap으로 수정할 계획이 문서에 반영됨: 통과/실패
- 브라우저 콘솔에 token/key/raw DB error/stack trace 노출 없음: 통과/실패
- 비밀 정보 없는 메모:
```
## Phase 3F Market Treemap Dashboard Manual Smoke Delta

Use this Korean-first format when reporting Phase 3F results back to Codex. Do not include credentials, tokens, keys, project references, environment values, secret query strings, or screenshots containing secrets.

```text
Phase 3F 시장 Treemap 대시보드 재점검 결과:

- 테스트 대상: local / deployed
- 브라우저: Chrome 등
- 메뉴명이 `시장`으로 표시됨: 통과/실패
- 기존 주요 메뉴에서 `Heatmap` 메뉴명이 보이지 않음: 통과/실패
- `/market` 진입: 통과/실패
- `/heatmap` 진입 시 새 시장 Treemap 대시보드가 표시됨: 통과/실패
- KOSPI200 선택 버튼 표시: 통과/실패
- KOSDAQ150 선택 버튼 표시: 통과/실패
- S&P500 선택 버튼 표시: 통과/실패
- NASDAQ100 선택 버튼 표시: 통과/실패
- My Portfolio 선택 버튼 표시: 통과/실패
- 기간 선택 `1일`, `1주`, `1개월`, `3개월`, `6개월`, `1년` 표시: 통과/실패
- 선택한 시장과 기간에 맞는 큰 Treemap 카드 표시: 통과/실패
- Treemap 타일이 섹터별로 묶여 보임: 통과/실패
- Treemap 타일 크기가 비중에 따라 달라 보임: 통과/실패
- Treemap 색상 범례 표시: 통과/실패
- 선택한 시장과 기간에 맞는 Momentum / Trend 산점도 표시: 통과/실패
- 산점도 축 라벨 `단기 모멘텀`, `장기 트렌드`가 플롯 영역을 침범하지 않음: 통과/실패
- Treemap 카드 우측 상단 카메라 아이콘 표시: 통과/실패
- 산점도 카드 우측 상단 카메라 아이콘 표시: 통과/실패
- Treemap 카드 크게 보기 동작: 통과/실패
- 산점도 카드 크게 보기 동작: 통과/실패
- 카메라 아이콘 클릭 시 PNG 이미지가 로컬에 저장됨: 통과/실패/미실행
- Home 오른쪽 광고 배너 sticky 동작 유지: 통과/실패/화면폭 부족
- `/chart-ai`, `/portfolio`, `/lab`, `/market`, `/heatmap`에서 Home 광고 배너 미노출: 통과/실패
- Chart AI 선택 종목 프리필 유지: 통과/실패
- Portfolio 주요 기능 유지: 통과/실패/미실행
- Header 로그인 라벨 안정성 유지: 통과/실패
- `Today: 000` placeholder 유지: 통과/실패
- 실제 방문자 집계가 아직 동작하지 않음: 통과/실패
- OpenAI/Gemini/KIS/OpenDART/Trading Economics/ETFshopping/한국경제 실제 호출 없음: 통과/실패
- 브라우저 콘솔에 token/key/raw DB error/stack trace 노출 없음: 통과/실패
- 비밀 정보 없는 메모:
```
