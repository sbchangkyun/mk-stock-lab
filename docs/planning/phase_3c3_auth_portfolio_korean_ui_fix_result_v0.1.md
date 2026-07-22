# Phase 3C.3 Auth, Portfolio, And Korean UI Fix Result v0.1

## Status And Scope

Status: Phase 3C.3 implementation complete pending owner manual smoke rerun.

Phase 3C.3 stabilized the browser auth-state flow, cleared Portfolio client state immediately on sign-out, reloaded Portfolio data after re-login, and converted the current visible shell and Portfolio MVP UI to Korean-first copy.

Codex did not connect to Supabase, did not run SQL, did not run Supabase CLI, did not run `psql`, did not mutate production DB, did not create Auth users, did not call authenticated Portfolio write endpoints, did not mutate Vercel environment variables, and did not deploy.

## Files Changed

- `src/components/Header.astro`
- `src/components/Nav.astro`
- `src/components/Ticker.astro`
- `src/components/SlideAd.astro`
- `src/components/Footer.astro`
- `src/components/Auth/AuthModal.astro`
- `src/components/Auth/GoogleLogin.astro`
- `src/layouts/Layout.astro`
- `src/lib/profileBootstrap.ts`
- `src/lib/server/portfolio.ts`
- `src/pages/index.astro`
- `src/pages/chart-ai.astro`
- `src/pages/heatmap.astro`
- `src/pages/lab.astro`
- `src/pages/lab/congress-stocks.astro`
- `src/pages/lab/nps-portfolio.astro`
- `src/pages/lab/sp500-sectors.astro`
- `src/pages/lab/asset-class-returns.astro`
- `src/pages/portfolio.astro`
- `docs/planning/phase_3c1_portfolio_manual_smoke_checklist_v0.1.md`
- `docs/planning/phase_3c3_auth_portfolio_korean_ui_fix_result_v0.1.md`
- `docs/planning/planning_changelog.md`

## Owner Smoke Failure Summary

The owner confirmed that Phase 3C.2 fixed the initial Portfolio API unavailable blocker. Login, header auth state, Portfolio route entry, Portfolio API availability, Portfolio CRUD, position visibility, refresh persistence, and console secret/raw-error checks passed.

Remaining failures after Phase 3C.2:

- Signed-out state did not immediately hide Portfolio data.
- After logout and re-login, previously registered Portfolio data did not reload reliably.
- Header auth controls briefly showed a signed-out/login state during navigation before returning to signed-in/logout.
- Visible shell and Portfolio UI still contained too much English copy for the Korean target audience.
- Owner-facing manual smoke result templates needed Korean-first wording.

## Auth Flicker Root Cause And Fix Summary

Root cause: the server-rendered header initially displayed the login button before the browser Supabase session check resolved. During navigation this produced a temporary signed-out visual state even when the browser session was still valid.

Fix:

- Header auth controls now start in a neutral checking state.
- The login button is disabled and displays a Korean checking label until `supabase.auth.getSession()` resolves.
- Header dispatches a browser-only `mk:auth-state` event for checking, signed-in, signed-out, and unavailable states.
- Header still refreshes state once per page load and on `onAuthStateChange`.
- No session object, token, email, or raw auth payload is logged.

## Portfolio Reload Root Cause And Fix Summary

Root cause: `/portfolio` depended mostly on profile-bootstrap events and did not explicitly react to a shared header auth-state event. A re-login path could therefore miss a controlled reload if event timing and page initialization did not line up.

Fix:

- `/portfolio` now listens for the shared `mk:auth-state` event.
- Signed-in events trigger a controlled profile bootstrap and Portfolio reload sequence.
- Profile-ready events still trigger Portfolio fetches.
- Portfolio list fetch selects the first returned portfolio when there is no current selected portfolio.
- A loading guard prevents uncontrolled duplicate Portfolio fetch loops.

## Sign-Out Data Clearing Fix Summary

- Header dispatches signed-out state immediately on logout click.
- `/portfolio` clears portfolio list, selected portfolio, position list, edit forms, and loading state on signed-out events.
- Signed-out state hides the Portfolio MVP controls and user-scoped data.
- Stale user-scoped Portfolio data should no longer remain visible after logout.

## Korean UI Conversion Summary

Converted current visible UI copy to Korean-first wording across:

- Header auth labels and shell subtitle.
- Primary nav labels.
- Ticker helper labels.
- Home hero, market scope, and feature cards.
- Chart AI placeholder page.
- Heatmap placeholder page.
- Lab hub and child pages.
- Portfolio page headings, readiness states, forms, tables, buttons, confirmations, empty states, and toast messages.
- Slide ad and footer ad visible labels.

Preserved approved brand and financial terms such as `MK Stock Lab`, `Chart AI`, `Lab`, `S&P 500`, `Nasdaq 100`, `Dow Jones`, `KOSPI`, `KOSDAQ`, `USD/KRW`, `Dollar Index`, `Gold`, `WTI Oil`, `AAPL`, `KRW`, and `USD`.

## Signup Nickname And Password Confirmation Preservation Summary

- Signup nickname field remains.
- Signup password confirmation field remains.
- Client-side nickname, email, password, password confirmation, and password mismatch validation remain.
- Korean validation messages remain.
- Password values are not logged.
- Password confirmation remains browser form state only.

## Service-Role Boundary Preservation Summary

- Service-role usage remains limited to server-only helper code and Astro API routes.
- Browser code imports only browser-safe helpers.
- Portfolio API routes still derive identity from a server-validated bearer token.
- Portfolio API routes still do not trust browser-submitted `user_id`.
- Portfolio and position operations remain scoped to the validated user ID.
- Non-owned access and server failures remain sanitized.

## Explicit Non-Goals

- No production write validation by Codex.
- No Portfolio production write calls by Codex.
- No DB mutation.
- No Auth user creation.
- No Vercel env mutation.
- No deployment.
- No provider integration.
- No Chart AI implementation.
- No ad-event route.
- No desktop left-side banner implementation.
- No valuation analytics.
- No performance analytics.

## Provider Credential Status Note

The owner previously reported that the Korea Investment Securities REST API APP KEY, Korea Investment Securities REST API APP Secret, and OpenDART API KEY have been issued.

No actual values were requested, read, printed, stored, committed, or added to environment files in Phase 3C.3.

Future KIS/OpenDART phases must include a secret-safe `.env` and deployment environment registration process before provider integration work begins.

## Desktop Left-Side Rotating Ad Banner Backlog

Backlog only. Not implemented in Phase 3C.3.

- Desktop PC home/content layout should include a left-side vertical image ad banner area.
- Each banner should support outbound links.
- Multiple active banners should be registerable.
- If two or more banners exist, the banner area should rotate every 5 seconds.
- Outbound links should open safely in a new tab.
- Mobile and tablet behavior should be designed later.
- No ad-event route or database change was added in Phase 3C.3.

## Validation Results

| Check | Result |
|---|---|
| `npm run build` | Pass |
| Vercel output generation | Pass; `.vercel/output/config.json`, `.vercel/output/functions/_render.func`, and `.vercel/output/static` exist. |
| Local HTTP smoke without authenticated writes | Pass; `/` and `/portfolio` returned 200, unauthenticated Portfolio API GET requests returned 401, and same-origin unauthenticated profile bootstrap returned sanitized 401. |
| Korean UI and markup checks | Pass; Korean nav, header checking state, login/logout labels, auth modal labels, nickname field, password confirmation field, generated password mismatch validation, and Portfolio status/form labels were confirmed. |
| Product source/generated secret marker scan | Expected server-only source occurrence for the service-role variable marker only. |
| Service-role exposure scan | Expected server-only source occurrences only. |
| Browser/static server-only marker scan | Pass; no service-role or server-only helper marker found in generated browser/static assets. |
| Disposable identifier scan | Product source and generated output pass; matches are limited to existing planning docs. |
| Removed legacy route scan | Pass |
| Broad crypto scope scan | No broad crypto feature added; existing exclusion copy and asset-class Bitcoin context remain. |
| Ignored-file coverage | Pass for `.env*`, `.vercel`, `dist`, `.astro`, `.omc`, representative credentials, certificates, and key files. |

## Updated Owner Manual Smoke Steps

Owner-facing report format is maintained in Korean in `docs/planning/phase_3c1_portfolio_manual_smoke_checklist_v0.1.md`.

Recommended focused smoke:

1. 로컬 또는 배포 대상에서 앱을 엽니다.
2. 로그인 전 헤더가 잠깐 로그인 상태로 깜박이지 않는지 확인합니다.
3. 소유자 승인 테스트 계정으로 로그인합니다.
4. 메뉴 이동 중 헤더가 로그인 상태로 깜박이지 않는지 확인합니다.
5. `/portfolio`로 이동합니다.
6. 로그인, 프로필, 포트폴리오 API 상태가 각각 올바르게 표시되는지 확인합니다.
7. 기존 포트폴리오와 보유 종목이 남아 있다면 자동으로 다시 표시되는지 확인합니다.
8. 로그아웃합니다.
9. 포트폴리오와 보유 종목 데이터가 즉시 사라지는지 확인합니다.
10. 다시 로그인합니다.
11. 기존 데이터가 남아 있다면 다시 불러와지는지 확인합니다.
12. 한국어 UI, 닉네임 입력, 비밀번호 확인, 비밀번호 불일치 검증을 확인합니다.
13. 토큰, 비밀값, raw DB 오류, stack trace가 콘솔이나 UI에 표시되지 않는지 확인합니다.

## Remaining Risks

- Codex did not perform authenticated production Portfolio writes by design.
- Owner manual smoke is still required to validate real browser session timing with the owner-approved account.
- Runtime success still depends on correct public and server-side Supabase environment categories.
- Browser auth still uses Supabase's normal client-side session storage behavior.
- Provider credentials are issued but intentionally not integrated or registered by Codex in this phase.

## Recommended Next Action

Recommended owner action: rerun the Phase 3C.3 focused manual smoke and report only non-secret Korean pass/fail results.

Next options:

- Option A: Rerun Phase 3C.3 focused owner manual Portfolio smoke.
- Option B: If smoke passes, proceed to Phase 3D Chart AI usage guard and server-only execution skeleton.
- Option C: If smoke fails, prepare a focused Phase 3C.4 smoke fix packet using non-secret failure details.
