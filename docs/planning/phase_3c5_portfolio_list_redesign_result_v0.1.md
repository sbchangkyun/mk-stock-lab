# Phase 3C.5 Portfolio List Redesign Result v0.1

## Status And Scope

Status: Phase 3C.5 implementation and Codex validation complete.

Phase 3C.5 redesigned the Portfolio position list, added operator-provided logo mapping with local fallback avatars, removed the visible market input, added a display-only currency mode toggle, added client-side Portfolio order controls and placeholder-safe sort controls, restored a lock-style logged-out Portfolio state, and corrected the Lab label to `국회의원 보유 주식`.

Codex did not connect to Supabase, did not call authenticated Portfolio write endpoints, did not run SQL, did not run Supabase CLI, did not run `psql`, did not mutate production DB, did not create Auth users, did not read or mutate Vercel environment variables, and did not deploy.

## Files Changed

- `src/components/Header.astro`
- `src/data/securityLogos.json`
- `src/pages/index.astro`
- `src/pages/lab.astro`
- `src/pages/lab/congress-stocks.astro`
- `src/pages/portfolio.astro`
- `src/styles/style.css`
- `docs/planning/phase_3c1_portfolio_manual_smoke_checklist_v0.1.md`
- `docs/planning/phase_3c5_portfolio_list_redesign_result_v0.1.md`
- `docs/planning/planning_changelog.md`

## Owner Phase 3C.4 Smoke Feedback Summary

The owner confirmed that core Portfolio CRUD, position CRUD, refresh persistence, sign-out data hiding, re-login data reload, Korean UI, and Pretendard feel passed.

Remaining owner issues and requests addressed in Phase 3C.5:

- Header still briefly showed `확인 중` during navigation.
- Logged-out Portfolio should show a lock-style `로그인이 필요합니다` UI.
- Compact status bar should not include a duplicate right-side login action.
- Portfolio placeholder should use `계좌 이름`.
- Portfolio card actions should be smaller.
- Portfolio cards should support up/down ordering controls.
- Position list should use a cleaner finance-app information hierarchy.
- Position rows should show logo or fallback avatar plus country badge.
- Visible `시장` input should be removed.
- Currency display mode should support `현지통화 기준` and `원화 기준`.
- Sorting controls should exist for valuation and return without pretending placeholder data is real.
- Lab copy should say `국회의원 보유 주식`, not `미국 의회 주식`.

## Header Checking-State Flicker Final Polish Summary

- The header login button is no longer server-rendered as visible `확인 중`.
- Header auth controls start hidden until client-side auth UI state is applied.
- If the non-secret signed-in UI hint exists, the client immediately renders `로그아웃`.
- `확인 중` remains available only as a true first-entry client state when no signed-in UI hint exists.
- Actual auth truth still comes from Supabase session resolution.
- No token, email, user ID, session object, or raw auth payload is stored manually.

## Logged-Out Lock UI Summary

- Added a centered lock-style logged-out Portfolio state with `로그인이 필요합니다`.
- The lock visual is CSS-only and uses no external image asset.
- The lock state includes a `회원가입 / 로그인` action that opens the existing auth modal.
- Signed-out state still clears and hides user Portfolio data.

## Compact Status Bar Duplicate-Login Removal Summary

- Removed the duplicate login action from the compact status bar.
- The status bar keeps compact login/profile/API/valuation indicators.
- Signed-out action now lives in the lock UI only.

## Portfolio Card Polish Summary

- Changed Portfolio name placeholder from `핵심 보유 종목` to `계좌 이름`.
- Portfolio card `수정` and `삭제` controls now use the smaller table action style.
- Existing Portfolio create/read/update/delete behavior was preserved.

## Portfolio Order Controls Summary

- Added `위로` and `아래로` controls to Portfolio cards.
- Ordering is client-side only and non-persistent because no ordering column exists in the current schema and no migration was allowed.
- The selected portfolio state is preserved during client-side reordering.

## Security Logo JSON Mapping Summary

- Added `src/data/securityLogos.json`.
- The JSON maps stable symbol-like keys to `name`, `symbol`, `country`, and `logoUrl`.
- Seeded only the owner-provided Samsung Electronics `005930` and Coca-Cola `KO` examples.
- These are treated as operator-provided mapping examples, not scraped data.
- No logo API call, crawler, scraper, or bulk logo discovery was added.

## Logo Fallback Avatar And Country Badge Summary

- Position rows render a logo image when a safe HTTPS mapped logo URL exists.
- If no logo URL exists or image loading fails, the row shows a local text avatar based on the security name or symbol.
- Each avatar includes a small KR/US country badge.
- Country is inferred from the mapping, stored market, currency, and symbol heuristics until provider metadata exists.

## Market Field Removal And Temporary Market Inference Summary

- Removed the visible `시장` select from the position form.
- Preserved a hidden internal market field for current API/schema compatibility.
- Submission market is inferred temporarily:
  - 6-digit numeric input: `KR`
  - alphabetic ticker-like input: `US`
  - otherwise based on selected currency, defaulting to KR for KRW and US for USD
- This inference is not provider-validated.

## Currency Display Mode Toggle Summary

- Added a Portfolio-level display toggle:
  - `현지통화 기준`
  - `원화 기준`
- The toggle is display-only and client-side.
- No FX conversion or manual FX input was added.

## Local-Currency Versus KRW-Display Behavior Summary

- In `현지통화 기준`, positions show their stored local currency values.
- In `원화 기준`, USD values show `원화 환산 예정` and retain the original USD value as small secondary text where useful.
- Future FX behavior should show KRW primary and the original USD value as secondary text, for example `₩261,000` and `($191.08)`.

## Position List Redesign Summary

- Replaced the table-style position list with a card/list layout.
- Each row now follows a cleaner finance-app hierarchy:
  - logo/fallback avatar and country badge
  - security name and ticker/code status
  - quantity
  - buy price
  - current price placeholder
  - valuation placeholder
  - return placeholder
  - compact actions
- No third-party UI library was added.

## Sorting Controls Summary

- Added client-side sort controls for valuation amount and return rate, ascending and descending.
- Because valuation and return are placeholders, rows keep stable ordering until numeric values exist.
- Sorting does not mutate the database.

## Lab Label Correction Summary

- Corrected visible Lab copy to `국회의원 보유 주식`.
- Updated `/`, `/lab`, and `/lab/congress-stocks` user-facing copy.
- The technical route remains `/lab/congress-stocks`; this route/name mismatch is documented technical debt until a future route cleanup phase.
- No Lab data ingestion or implementation was added.

## KIS Logo/Image API Finding Summary

- A dedicated official KIS stock logo/image API was not confirmed from accessible KIS documentation.
- Phase 3C.5 therefore does not assume KIS provides logo images.
- The implementation uses only owner/operator-provided logo URL mappings and local fallback avatars.
- Future production use of third-party logo URLs should be reviewed for licensing and reliability.

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
- No logo scraping.
- No remote logo discovery.
- No KIS integration.
- No OpenDART integration.
- No OpenAI integration.
- No Gemini integration.

## Provider Credential Status Note

The owner previously reported that the Korea Investment Securities REST API APP KEY, Korea Investment Securities REST API APP Secret, and OpenDART API KEY have been issued for future phases.

No actual values were requested, read, printed, stored, committed, or added to environment files in Phase 3C.5.

## Desktop Left-Side Rotating Ad Banner Backlog

Backlog only. Not implemented in Phase 3C.5.

- Desktop PC home/content layout should include a left-side vertical image ad banner area.
- Each banner should support outbound links.
- Multiple active banners should be registerable.
- If two or more banners exist, the banner area should rotate every 5 seconds.
- Outbound links should open safely in a new tab.
- Mobile and tablet behavior should be designed later.
- No ad-event route or database change was added in Phase 3C.5.

## Validation Results

| Check | Result |
|---|---|
| `npm run build` | Pass |
| Vercel output generation | Pass; `.vercel/output/config.json`, `.vercel/output/functions/_render.func`, and `.vercel/output/static` exist. |
| Local HTTP smoke without authenticated writes | Pass; `/`, `/portfolio`, and `/lab` returned 200; unauthenticated Portfolio API GET requests returned 401; unauthenticated profile bootstrap POST returned sanitized 403. |
| In-app browser check | Attempted, but the in-app browser instance was unavailable in this Codex session. Validation used HTTP smoke plus source/generated markup checks instead. |
| Korean UI and markup checks | Pass; lock UI, `계좌 이름`, order controls, currency toggle, sort controls, avatar/country badge classes, and corrected Lab label are present. |
| Visible market field check | Pass; visible market select was removed. A hidden `position-market` field and inference script remain for API compatibility. |
| Visible asset type check | Pass; visible `자산 유형` select remains absent. Existing server validation copy remains server-side only. |
| Logo mapping/fallback validation | Pass; `src/data/securityLogos.json` exists, mapped HTTPS logo URLs are imported, and fallback avatar/country badge markup and CSS exist. |
| Product source/generated secret marker scan | Expected server-only source occurrence for the service-role variable marker only. |
| Service-role exposure scan | Expected server-only source occurrences only. |
| Browser/static server-only marker scan | Pass; no service-role or server-only helper marker found in generated browser/static assets. |
| Disposable identifier scan | Pass; no product source or generated-output matches. |
| Removed legacy route scan | Pass; removed route strings remain absent from product source and generated output. |
| Broad crypto scope scan | No broad crypto feature added; matches are limited to dependency package names plus existing exclusion copy and approved asset-class returns context. |
| Logo scraping/remote discovery scan | Pass for new product code; only owner-provided JSON URLs and local mapping/rendering code were added. Existing legacy planning docs still mention old scraper inventory. |
| Ignored-file coverage | Pass for `.env*`, `.vercel`, `dist`, `.astro`, `.omc`, representative credentials, certificates, and key files. |

## Updated Owner Manual Smoke Steps

Owner-facing Phase 3C.5 report format is maintained in Korean in `docs/planning/phase_3c1_portfolio_manual_smoke_checklist_v0.1.md`.

Recommended focused smoke:

1. 로그인 후 메뉴를 이동해도 헤더가 `로그아웃`을 유지하는지 확인합니다.
2. 메뉴 이동 중 불필요한 `확인 중` 표시가 없는지 확인합니다.
3. 로그아웃 상태에서 `/portfolio`가 물쇠형 `로그인이 필요합니다` UI를 보여주는지 확인합니다.
4. compact 상태바에 중복 로그인 버튼이 없는지 확인합니다.
5. 포트폴리오 입력 placeholder가 `계좌 이름`인지 확인합니다.
6. 포트폴리오 카드 `위로`/`아래로`/`수정`/`삭제` 컨트롤을 확인합니다.
7. 보유 종목 리스트의 로고 또는 fallback 아바타와 KR/US 배지를 확인합니다.
8. `시장`과 `자산 유형` 수동 선택이 보이지 않는지 확인합니다.
9. `현지통화 기준`/`원화 기준` 토글과 USD 원화 환산 예정 표시를 확인합니다.
10. 평가금액/수익률 정렬 컨트롤이 표시되는지 확인합니다.
11. Lab 라벨이 `국회의원 보유 주식`으로 표시되는지 확인합니다.
12. 콘솔에 토큰, 비밀값, raw DB 오류, stack trace가 표시되지 않는지 확인합니다.

## Remaining Risks

- Codex did not perform authenticated production Portfolio writes by design.
- Owner manual smoke is still required to validate real signed-in navigation timing in the owner browser.
- Header checking-state removal avoids visible server-rendered `확인 중`, but Supabase session resolution remains the source of truth and may still correct stale UI hints.
- Portfolio order is client-side only and resets after reload or refetch.
- Sorting controls are placeholder-safe and stable until real valuation/return data exists.
- Market and country inference are temporary heuristics until provider metadata exists.
- Owner-provided third-party logo URLs should be reviewed before production-scale use.
- Runtime success still depends on correct public and server-side Supabase environment categories.

## Recommended Next Action

Recommended owner action: run the Phase 3C.5 manual smoke checklist and report only non-secret pass/fail results.

Next options:

- Option A: Rerun focused owner Portfolio manual smoke for Phase 3C.5.
- Option B: If smoke passes, proceed to Phase 3D Chart AI usage guard and server-only execution skeleton.
- Option C: If smoke fails, prepare a narrow Phase 3C.6 Portfolio UX smoke fix packet using non-secret failure details.
