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

- If smoke passes: proceed to Phase 3D Chart AI usage guard and server-only execution skeleton.
- If smoke fails: prepare focused Phase 3C.2 Portfolio smoke fix packet using non-secret failure details.

Options:

- Option A: Run manual Portfolio smoke now and report non-secret pass/fail.
- Option B: Proceed to Phase 3D without manual Portfolio smoke.
- Option C: Run Advisor/security follow-up before additional DB-backed feature work.

## Final Statement

Phase 3C.1 is checklist and documentation only. Codex performed no production mutation, no environment mutation, no deployment, and no code implementation for this phase.
