# Phase 3C.4 Portfolio UX Polish Result v0.1

## Status And Scope

Status: Phase 3C.4 implementation and Codex validation complete.

Phase 3C.4 polished the Portfolio MVP UX while preserving the existing Supabase client/server boundary. The work focused on the header auth visual state, compact Portfolio readiness display, position form/table polish, safe non-functional valuation placeholders, and project-managed Pretendard font integration.

Codex did not connect to Supabase, did not call authenticated Portfolio write endpoints, did not run SQL, did not run Supabase CLI, did not run `psql`, did not mutate production DB, did not create Auth users, did not read or mutate Vercel environment variables, and did not deploy.

## Files Changed

- `package.json`
- `package-lock.json`
- `src/components/Header.astro`
- `src/pages/portfolio.astro`
- `src/styles/style.css`
- `docs/planning/phase_3c1_portfolio_manual_smoke_checklist_v0.1.md`
- `docs/planning/phase_3c4_portfolio_ux_polish_result_v0.1.md`
- `docs/planning/planning_changelog.md`

## Owner Phase 3C.3 Smoke Feedback Summary

The owner confirmed that the core Portfolio MVP flow passed after Phase 3C.3, including login, profile readiness, Portfolio route entry, existing data reload, Portfolio CRUD, position CRUD, refresh persistence, sign-out data hiding, re-login reload, Korean UI provisional pass, signup nickname/password confirmation, password mismatch validation, console secret checks, and disposable data cleanup.

Remaining owner polish feedback addressed in this phase:

- Header still briefly displayed `확인 중` during navigation after a signed-in state was already known.
- The large Portfolio readiness card consumed too much vertical space.
- The position form and table needed better spacing and row/action polish.
- Position display needed security name primary and ticker/code secondary.
- Current price, valuation amount, and return needed safe placeholders.
- Separate ticker/name fields needed to become one `종목명 또는 티커` field.
- Visible `자산 유형` selection needed to be removed.
- USD positions in KRW-base portfolios must not imply implemented FX conversion.
- Korean UI font rendering needed Pretendard through a package/self-hosted approach.

## Header Auth Flicker Polish Summary

- Added a browser-only non-secret UI hint in `localStorage` that stores only the last known signed-in visual state.
- Header initialization uses the hint to keep `로그아웃` visible during normal navigation after a signed-in state has already been confirmed.
- Actual auth truth still comes from `supabase.auth.getSession()` and `supabase.auth.onAuthStateChange`.
- The hint is cleared on signed-out and unavailable states.
- No token, email, user ID, session object, or raw auth payload is manually stored or logged by this change.

## Compact Portfolio Status Bar Summary

- Replaced the large readiness card with a compact one-line status bar.
- Status indicators cover login, profile, Portfolio API, and valuation readiness.
- The login action remains available only in signed-out states.
- Setup and failure states still use sanitized Korean copy.

## Portfolio Form And Table Spacing Summary

- Added spacing below the position form action row so `종목 추가` no longer sits too close to the table.
- Added cleaner table row border handling.
- Reduced the visual weight of position row actions.
- Added compact row action buttons for `수정` and `삭제`.

## Single Security Input Summary

- Replaced separate visible ticker and name inputs with one visible field labeled `종목명 또는 티커`.
- Placeholder: `삼성전자 또는 005930`.
- Ticker is no longer a required separate user-facing field.
- Temporary mapping compromise:
  - Ticker-like values are stored as uppercase internal symbols with no separate display name.
  - Non-ticker-like values are stored as the display name and copied into the required internal symbol field up to the existing symbol length limit.
  - This is not provider-validated and is intended only to preserve the current API/schema contract until provider metadata integration.

## Visible Asset Type Removal And Internal Default Summary

- Removed the visible `자산 유형` select from the position form.
- Position submissions now use an internal `stock` default to satisfy the current API/schema contract.
- Future KIS/OpenDART integration should infer market, ticker, asset type, and currency from provider metadata where possible.

## Price, Valuation, And Return Placeholder Summary

- Added table columns for `현재가`, `평가금액`, and `수익률`.
- Current price displays `연동 예정`.
- Valuation displays `데이터 대기` unless a KRW-base portfolio contains a USD position.
- Return displays `-`.
- No fake current prices, valuation amounts, returns, or provider fetches were added.

## USD-In-KRW Portfolio Display Handling Summary

- Buy price displays the position currency as entered, for example `USD 528`.
- A USD position in a KRW-base portfolio displays `원화 환산 예정` in the valuation placeholder.
- No FX rate input, FX conversion, valuation calculation, or performance calculation was implemented.

## Position Row Display Polish Summary

- Position rows now show the security display name as the primary line.
- The secondary line shows the ticker/code when available.
- If only a ticker-like value exists, the row keeps it primary and shows `티커 직접 입력`.
- If no reliable ticker/code exists, the secondary line uses `티커 미확인`.

## Pretendard Package/Self-Hosted Integration Summary

- Added the `pretendard` npm package.
- Imported `pretendard/dist/web/variable/pretendardvariable.css` from the installed package in global CSS.
- Updated the global font stack to prefer Pretendard before existing fallbacks.
- No CDN font URL and no manually downloaded raw font files were added.

## Service-Role Boundary Preservation Summary

- Service-role usage remains limited to server-only helper code and Astro API routes.
- Browser code still imports only browser-safe helpers.
- Portfolio API routes still derive identity from a server-validated bearer token.
- Portfolio API routes still do not trust browser-submitted `user_id`.
- Browser/static generated assets do not contain service-role markers or server-only helper markers.

## Explicit Non-Goals

- No production write validation by Codex.
- No Portfolio production write calls by Codex.
- No DB mutation.
- No Auth user creation.
- No Vercel environment mutation.
- No deployment.
- No provider integration.
- No Chart AI implementation.
- No ad-event route.
- No desktop left-side banner implementation.
- No FX conversion.
- No valuation analytics.
- No performance analytics.
- No provider autocomplete.
- No KIS integration.
- No OpenDART integration.
- No OpenAI integration.
- No Gemini integration.

## Provider Credential Status Note

The owner previously reported that the Korea Investment Securities REST API APP KEY, Korea Investment Securities REST API APP Secret, and OpenDART API KEY have been issued for future phases.

No actual values were requested, read, printed, stored, committed, or added to environment files in Phase 3C.4.

## Desktop Left-Side Rotating Ad Banner Backlog

Backlog only. Not implemented in Phase 3C.4.

- Desktop PC home/content layout should include a left-side vertical image ad banner area.
- Each banner should support outbound links.
- Multiple active banners should be registerable.
- If two or more banners exist, the banner area should rotate every 5 seconds.
- Outbound links should open safely in a new tab.
- Mobile and tablet behavior should be designed later.
- No ad-event route or database change was added in Phase 3C.4.

## Validation Results

| Check | Result |
|---|---|
| `npm run build` | Pass |
| Vercel output generation | Pass; `.vercel/output/config.json`, `.vercel/output/functions/_render.func`, and `.vercel/output/static` exist. |
| Preview command | `astro preview` is not supported by the installed Vercel adapter, so local HTTP smoke used `npm run dev`. |
| Local HTTP smoke without authenticated writes | Pass; `/` and `/portfolio` returned 200, unauthenticated Portfolio API GET requests returned 401, and unauthenticated profile bootstrap POST returned sanitized 403. |
| In-app browser check | Attempted, but the in-app browser instance was unavailable in this Codex session. Validation used HTTP smoke plus source/generated markup checks instead. |
| Korean UI and markup checks | Pass; compact status bar, `종목명 또는 티커`, `현재가`, `평가금액`, `수익률`, Korean Portfolio copy, and Korean auth labels are present. |
| Visible asset type check | Pass; visible `자산 유형` select was removed from the Portfolio UI. Existing server validation copy remains server-side only. |
| Font/Pretendard validation | Pass; `pretendard` package dependency and package CSS import are present, and global font-family prefers Pretendard. |
| Product source/generated secret marker scan | Expected server-only source occurrence for the service-role variable marker only. |
| Service-role exposure scan | Expected server-only source occurrences only. |
| Browser/static server-only marker scan | Pass; no service-role or server-only helper marker found in generated browser/static assets. |
| Disposable identifier scan | Pass; no product source or generated-output matches. |
| Removed legacy route scan | Pass; removed route strings remain absent from product source and generated output. |
| Broad crypto scope scan | No broad crypto feature added; matches are limited to dependency package names plus existing exclusion copy and approved asset-class returns context. |
| Ignored-file coverage | Pass for `.env*`, `.vercel`, `dist`, `.astro`, `.omc`, representative credentials, certificates, and key files. |
| Package audit note | `npm install` reported existing dependency audit findings; no audit fix was run because dependency remediation is outside Phase 3C.4 scope. |

## Updated Owner Manual Smoke Steps

Owner-facing Phase 3C.4 report format is maintained in Korean in `docs/planning/phase_3c1_portfolio_manual_smoke_checklist_v0.1.md`.

Recommended focused smoke:

1. 로그인 후 메뉴를 이동해도 헤더가 `로그아웃`을 유지하는지 확인합니다.
2. 메뉴 이동 중 불필요한 `확인 중` 표시가 없는지 확인합니다.
3. `/portfolio`에서 compact 상태바가 표시되는지 확인합니다.
4. `종목명 또는 티커` 단일 입력창으로 보유 종목을 등록할 수 있는지 확인합니다.
5. `자산 유형` 수동 선택이 보이지 않는지 확인합니다.
6. `현재가`, `평가금액`, `수익률` 자리 표시가 보이는지 확인합니다.
7. KRW-base 포트폴리오에 USD 종목을 등록했을 때 원화 환산이 계산된 것처럼 보이지 않고 `원화 환산 예정`으로 남는지 확인합니다.
8. 종목명 상단, 티커/코드 하단 표시와 `수정`/`삭제` 버튼 polish를 확인합니다.
9. Pretendard 또는 개선된 한글 폰트 느낌을 확인합니다.
10. 콘솔에 토큰, 비밀값, raw DB 오류, stack trace가 표시되지 않는지 확인합니다.

## Remaining Risks

- Codex did not perform authenticated production Portfolio writes by design.
- Owner manual smoke is still required to validate real signed-in navigation timing in the owner browser.
- The non-secret auth UI hint is visual only; Supabase session resolution remains the source of truth and may still correct the UI if the session has expired.
- Position identity mapping is temporary until provider-backed metadata and autocomplete exist.
- Existing position records with ETF asset type can still render, but edited submissions use the current internal `stock` default until provider inference is implemented.
- Runtime success still depends on correct public and server-side Supabase environment categories.
- Dependency audit findings reported by npm remain outside this phase.

## Recommended Next Action

Recommended owner action: run the Phase 3C.4 manual smoke checklist and report only non-secret pass/fail results.

Next options:

- Option A: Rerun focused owner Portfolio manual smoke for Phase 3C.4.
- Option B: If smoke passes, proceed to Phase 3D Chart AI usage guard and server-only execution skeleton.
- Option C: If smoke fails, prepare a narrow Phase 3C.5 smoke fix packet using non-secret failure details.
