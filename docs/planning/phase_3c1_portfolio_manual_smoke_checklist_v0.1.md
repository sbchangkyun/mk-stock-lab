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

- If Phase 3C.5 smoke passes: proceed to Phase 3D Chart AI usage guard and server-only execution skeleton.
- If Phase 3C.5 smoke fails: prepare focused Phase 3C.6 Portfolio UX smoke fix packet using non-secret failure details.

Options:

- Option A: Run Phase 3C.5 manual Portfolio smoke now and report non-secret pass/fail.
- Option B: Proceed to Phase 3D without manual Portfolio smoke.
- Option C: Run Advisor/security follow-up before additional DB-backed feature work.

## Final Statement

Phase 3C.1 is checklist and documentation only. Codex performed no production mutation, no environment mutation, no deployment, and no code implementation for this phase.
