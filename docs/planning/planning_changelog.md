# MK Stock Lab Planning Changelog

## Phase 3AX - 2026-06-23

### Notification Favorite Stock Shell + About Footer Link + Home Ad Slot Expansion (Implemented)

- Created `docs/planning/phase_3ax_notification_favorite_about_ad_slots_result_v0.1.md`.
- **관심종목 뉴스 알림 search/save shell** (`src/pages/mypage.astro`): Row converted to `mp-notif-block`. Added search input ("관심종목 검색", placeholder "종목명 또는 종목코드를 입력하세요."), "관심종목 저장" button, in-memory rendered list ("저장된 관심종목", max 5, empty state, 삭제 per item), and "실제 뉴스 알림 저장 기능은 준비 중입니다." notice. No backend, no localStorage/sessionStorage, no API call. State resets on page reload.
- **관심종목 지정가 알림 on/off toggle** (`src/pages/mypage.astro`): Added "알림 사용" toggle row inside the 지정가 알림 block. Unchecked → body dimmed (opacity 0.45, pointer-events none). No persistence, no API call.
- **Footer 운영자 소개 link** (`src/components/Footer.astro`): Added `<a href="/about">운영자 소개</a>` as the first link before 개인정보처리방침. New footer order: 운영자 소개 / 개인정보처리방침 / 이용약관 / 제휴문의.
- **About placeholder page** (`src/pages/about.astro`): Created with eyebrow ABOUT, title 운영자 소개, body "운영자 소개 내용은 준비 중입니다." No fabricated content. Benchmark URL `https://etfshopping.com/about` recorded as planning reference only — not fetched, copied, or embedded.
- **Home ad rail 3-slot structure**: Added `public/ads/home-rail/home-rail-sample-03.svg` (160×600 dark-blue placeholder SVG) and added third entry to `src/data/homeAdBanners.json`. `HomeRailAd.astro` unchanged — carousel reads JSON dynamically. Now rotates Sample Banner 01, 02, 03.
- **CSS additions** (`src/styles/style.css`): `.mp-notif-inner-row`, `.mp-notif-body`, `.mp-notif-body--disabled`, `.mp-watchlist-search-label`, `.mp-watchlist-section-label`, `.mp-watchlist-search-row`, `.mp-watchlist-input`, `.mp-watchlist-add-btn`, `.mp-watchlist-list`, `.mp-watchlist-item`, `.mp-watchlist-remove-btn`, `.mp-watchlist-empty`.
- **Static validators updated**: `check_mypage_shell_static_contract.mjs` extended to 49 checks (Phase 3AX spec, added quote/news API forbidden checks). `check_header_footer_shell_static_contract.mjs` extended to 35 checks (added about page, footer order, benchmark safety). `check_home_ad_slots_static_contract.mjs` created (30 checks). `check:home-ad-slots` script added to `package.json`.
- Validation: `check:mypage-shell` 49/49 PASS; `check:header-footer-shell` 35/35 PASS; `check:home-ad-slots` 30/30 PASS; `check:market-quote-card` 32/32 PASS; `npm run build` Complete (6.99s); `git diff --check` no errors.
- No notification persistence, no Telegram integration, no external ad script, no tracking, no Supabase mutation, no API/KIS/Vercel/deployment changes, no live calls, no secrets recorded. Claude memory files not modified.

## Phase 3AW - 2026-06-23

### My Page Account/Notification Shell Revision + Legal Footer Fix (Implemented)

- Created `docs/planning/phase_3aw_mypage_notification_footer_fix_result_v0.1.md`.
- **Footer layout fix** (`src/styles/style.css`): Added `min-height: 100vh; display: flex; flex-direction: column;` to `body` and `flex: 1 0 auto;` to `.site-main`. Fixes abnormal footer positioning on short pages like /privacy and /terms. Footer now anchors to the viewport bottom.
- **Account summary revisions** (`src/pages/mypage.astro`): Email now populated from `supabase.auth.getSession()` if available; 로그인 방식 set to "Google 로그인"; 계정 상태 row removed; 마지막 접속 일시 row added (from `user.last_sign_in_at`); 구독 상태 row added (defaults to "구독 안함").
- **Service section streamlined**: Removed 기본 시작 페이지, 기본 시장, 화면 테마, 시세 카드 표시 설정; added 공지사항 and 이벤트/혜택.
- **Data section streamlined**: Removed 최근 활동 and 데이터 관리; kept 포트폴리오 and 관심 종목.
- **Notification settings section added** (알림 설정): 내 텔레그램 연동 (placeholder, 준비 중), 관심종목 뉴스 알림 toggle, 내 포트 종목 뉴스 알림 toggle, 관심종목 지정가 알림 block (최대 5개, UI-only add form, 저장 기능은 준비 중), 이벤트/혜택 알림 toggle, 공지사항 알림 toggle. No persistence, no backend, no Telegram API.
- **Logout redirect** (`src/components/Header.astro`): Added `window.location.assign('/')` after sign-out. Logout now redirects to Home across all pages.
- **CSS additions**: Notification section styles (`.mp-notif-row`, `.mp-notif-block`, `.mp-toggle`, `.mp-toggle-input`, `.mp-toggle-track`, `.mp-add-btn`, `.mp-alert-*`).
- **Static validators updated**: `check_mypage_shell_static_contract.mjs` rewritten to 40 checks (Phase 3AW spec). `check_header_footer_shell_static_contract.mjs` extended to 26 checks (added logout redirect check).
- Validation: `check:mypage-shell` 40/40 PASS; `check:header-footer-shell` 26/26 PASS; `check:market-quote-card` 32/32 PASS; `npm run build` Complete (3.32s); `git diff --check` no errors.
- No backend deletion, no notification persistence, no Telegram integration, no Supabase mutation, no API/KIS/Vercel/deployment changes, no live calls, no secrets recorded.

## Phase 3AV - 2026-06-23

### My Page MVP Shell (Implemented)

- Created `docs/planning/phase_3av_mypage_mvp_shell_result_v0.1.md`.
- Modified `src/pages/mypage.astro` — replaced placeholder page with five-section MVP shell: 내 계정 (account summary, all placeholders), 서비스 이용 설정 (4 preference rows, all "향후 제공 예정"), 내 데이터 (4 data rows, all "준비 중"), 법적 고지 및 지원 (개인정보처리방침/이용약관/제휴문의 links), 계정 관리 (danger zone with 회원탈퇴 confirmation UI).
- 회원탈퇴 confirmation UI: clicking shows inline panel with exact required message "정말 회원 탈퇴하시겠습니까? 회원탈퇴하면 등록/활동 정보가 모두 삭제됩니다." with 확인 and 취소 choices. 확인 shows "회원탈퇴 기능은 준비 중입니다." — no deletion, no API call, no auth mutation. 취소 closes panel, no action.
- No actual deletion, no backend deletion, no auth/session change, no Supabase mutation, no API route change.
- Modified `src/styles/style.css` — added My Page shell CSS: `.mp-sections`, `.mp-section-title`, `.mp-info-list`, `.mp-info-row`, `.mp-placeholder`, `.mp-pref-list`, `.mp-pref-row`, `.mp-pref-label`, `.mp-badge`, `.mp-link-list`, `.mp-danger-zone`, `.mp-danger-title`, `.mp-danger-desc`, `.mp-danger-btn`, `.mp-withdrawal-confirm`, `.mp-withdrawal-message`, `.mp-withdrawal-actions`, `.mp-confirm-btn`, `.mp-withdrawal-notice`.
- Created `scripts/check_mypage_shell_static_contract.mjs` — 23 checks: file existence, required section headings, legal/support links, withdrawal UI, safety (no fetch, no Supabase, no deletion, no auth mutation, no localStorage, no console calls, no env reads, no KIS). All 23 PASS. Exit 0.
- Modified `package.json` — added `check:mypage-shell` script.
- Validation: `check:mypage-shell` 23/23 PASS; `check:header-footer-shell` 25/25 PASS; `check:market-quote-card` 32/32 PASS; `npm run build` Complete (3.11s); `git diff --check` no errors.
- No KIS, Supabase, Vercel, SQL, live HTTP, or `.env*` access. No account deletion, trading, or auth mutation logic. No secrets recorded.

## Phase 3AU - 2026-06-23

### Header and Footer UI Shell Implementation (Implemented)

- Created `docs/planning/phase_3au_header_footer_ui_shell_result_v0.1.md`.
- Modified `src/components/Header.astro` — added `마이페이지` anchor (`#mypage-btn`, `href="/mypage"`, starts hidden) between 로그인 and 로그아웃 in `.header-actions`. Updated `updateAuthButtons` to show/hide `mypageBtn` in `signed_in` and `signed_out`/`unavailable` branches respectively. Element order when signed-in: Today: 000 → theme toggle → 마이페이지 → 로그아웃.
- Modified `src/components/Footer.astro` — removed YouTube link; updated copyright to `© 2026 MK Stock Lab ver1.0`; added `<nav class="site-footer-links">` with 개인정보처리방침 (`/privacy`), 이용약관 (`/terms`), 제휴문의 (`https://forms.gle/WAVSxaotdes6T5yJA`, `rel="noopener noreferrer"`).
- Modified `src/styles/style.css` — `.site-footer` layout changed to `space-between`; added `.site-footer-copy`, `.site-footer-links`, `.site-footer-links a`, `.site-footer-links a:hover`, `a.header-button` rules.
- Created `src/pages/privacy.astro` — placeholder, `개인정보처리방침 내용은 준비 중입니다.`, no fabricated legal text.
- Created `src/pages/terms.astro` — placeholder, `이용약관 내용은 준비 중입니다.`, no fabricated legal text.
- Created `src/pages/mypage.astro` — placeholder, `마이페이지 기능은 준비 중입니다.`, no deletion or auth logic.
- Created `scripts/check_header_footer_shell_static_contract.mjs` — 25 checks across file existence, header My Page entry, footer content, placeholder page safety, and safety boundaries. All 25 PASS. Exit 0.
- Modified `package.json` — added `check:header-footer-shell` script.
- Build: `npm run build` complete (3.38s). `git diff --check` no errors.
- No KIS, Supabase, Vercel, SQL, live HTTP, or `.env*` access. No account deletion, trading, or auth mutation logic added.

## Phase 3AT - 2026-06-23

### Account Navigation, My Page, Footer Legal Links Roadmap (Planned)

- Created `docs/planning/phase_3at_account_mypage_footer_roadmap_v0.1.md`.
- **Status**: planned.
- **Execution mode**: Documentation-only roadmap. No source code, styles, API logic, auth logic, database, or Vercel configuration changed.
- **Header requirement**: Add `마이페이지` button to logged-in top-right controls. Recommended order: Today: 000 → theme toggle → 마이페이지 → 로그아웃. Button visible only in signed-in state; routes to `/mypage`.
- **My Page MVP proposal**: lightweight shell with account summary, service preferences, data summary, legal/support links, and danger zone (회원탈퇴 confirmation UI, no actual deletion).
- **Account deletion UX**: Required confirmation message: "정말 회원 탈퇴하시겠습니까? 회원탈퇴하면 등록/활동 정보가 모두 삭제됩니다." Choices: 확인 / 취소. Staged rollout: UI only first → policy decision → backend only after explicit owner approval.
- **Footer requirement**: Remove YouTube. Left: `© 2026 MK Stock Lab ver1.0`. Right: 개인정보처리방침 | 이용약관 | 제휴문의.
- **Partnership link**: `https://forms.gle/WAVSxaotdes6T5yJA` — external Google Form, opens in new tab with `rel="noopener noreferrer"`.
- **Privacy/Terms**: Content not yet provided. Do not fabricate legal text. Create placeholder pages until owner provides final content.
- **Roadmap**: Phase 3AU (header/footer shell) → Phase 3AV (My Page shell) → Phase 3AW (account deletion policy decision, explicit owner approval required).
- No implementation, source changes, API changes, auth changes, deployment, live calls, or `.env*` reads occurred in this planning task.

## Phase 3AS - 2026-06-23

### Market Live Quote Card UX Polish + Static Validation Hardening (Implemented)

- Created `docs/planning/phase_3as_market_live_quote_card_ux_polish_result_v0.1.md`.
- Modified `src/components/MarketLiveQuoteCard.astro` — UX and accessibility improvements: eyebrow updated to `시세 조회` (avoids "Live" overclaim); `aria-live="polite"` + `role="status"` added to unavailable state; `aria-label` added to retry and new-search buttons; hint text reordered; disabled note copy simplified; timestamp order corrected to `${timeStr} 기준`; TypeScript parameter types added to all script functions (fixes 14 pre-existing implicit `any` errors).
- Modified `src/styles/style.css` — `.mqc-submit` explicit `font-size: 14px`; `.mqc-result-label` `text-transform: uppercase` removed; `.mqc-result-time` `font-weight` reduced from 700 to 400.
- Modified `scripts/check_market_quote_card_static_contract.mjs` — extended from 23 to **32 checks**: added Vercel API URL absence, fetch target exclusivity regex, `localStorage`/`sessionStorage` absence, user-triggered event listener presence, secret/token pattern absence.
- **Validation results**: `check:market-quote-card` 32/32 passed; `check:kis-error-fallback` 40/40 passed; `npm run build` clean; `git diff --check` passed.
- **Scope**: Market page only. Feature flag default unchanged (disabled). No auto-fetch on page load. All 8 UX states preserved.
- No API/KIS/Supabase/Vercel/deployment/migration changes. No live network calls. No `KIS_ENABLE_MARKET_QUOTE_CARD` enablement. No other page integration.
- No actual symbol, price value, Preview URL, bypass secret, secret, token, raw KIS field value, raw error, or stack trace recorded.

## Phase 3AQ - 2026-06-23

### Owner-Run Preview Deployment Plan — Disabled Market Quote Card (Planned)

- Created `docs/planning/phase_3aq_owner_run_preview_deployment_disabled_card_plan_v0.1.md`.
- **Status**: planned.
- **Execution mode**: Documentation-only owner-run deployment procedure. No deployment, Vercel CLI, env mutation, HTTP request, or implementation change performed by Claude Code.
- **Target**: Owner-run Vercel Preview deployment only. Production deployment remains blocked.
- **Feature flag**: `KIS_ENABLE_MARKET_QUOTE_CARD` must remain absent or non-`"true"` for the first Preview deployment. The Market quote card will render only its compact disabled message — no script, no quote network request.
- **Active quote lookup**: Remains blocked in Phase 3AQ. Enabling the card in Preview requires a separate explicit owner approval in a later phase.
- **Decision basis**: Phase 3AP (`docs/planning/phase_3ap_preview_deployment_decision_v0.1.md`).
- **Owner pre-deployment checklist**: Verify `KIS_ENABLE_MARKET_QUOTE_CARD` absent/non-true, `KIS_ACCOUNT_NO` absent, Production env unchanged, no page expansion, existing Preview vars intact.
- **Owner deployment trigger options**: git push, owner-run empty commit, or Vercel dashboard redeploy. Claude Code must not trigger deployment.
- **Owner browser checklist**: Market page loads, disabled card visible, no auto-fetch, dashboard intact, Home/Chart AI/Portfolio/Lab unchanged, no raw KIS fields/tokens/errors visible.
- **Sanitized evidence format**: Owner should report using boolean/status format defined in document section 7. No actual Preview URLs, symbols, prices, secrets, or raw values.
- **Production KIS**: Remains blocked. `VERCEL_ENV=production` guard unchanged.
- **Expansion**: Home, Chart AI, Portfolio, Lab, AI analysis, portfolio integration, account/order/trading/balance/holdings/WebSocket features remain out of scope and unapproved.
- No source code, scripts, `package.json`, styles, API logic, KIS guard, Supabase logic, Vercel config, deployment, live KIS call, live Supabase query/write, SQL, HTTP request, env mutation, or `KIS_ENABLE_MARKET_QUOTE_CARD` enablement changed in this planning task.
- No actual symbol, price value, Preview URL, bypass secret, secret, token, raw KIS field value, raw error, or stack trace was recorded.

## Phase 3AP - 2026-06-23

### Preview Deployment Decision (Decided)

- Created `docs/planning/phase_3ap_preview_deployment_decision_v0.1.md`.
- **Status**: decided.
- **Execution mode**: Documentation-only decision. No deployment, Vercel CLI, env mutation, HTTP request, or implementation change performed.
- **Decision**: Proceed to owner-run Vercel Preview deployment in the next phase (Phase 3AQ) with `KIS_ENABLE_MARKET_QUOTE_CARD` absent or non-`'true'` (feature disabled by default).
- **First Preview deployment goal**: Validate build and render stability and Market page layout with the card in its disabled state only.
- **Enabling card in Preview**: Requires a separate explicit owner approval after disabled Preview deployment is confirmed stable. Not approved by this decision.
- **Production deployment**: Not approved. Production KIS remains blocked by `VERCEL_ENV=production` guard.
- **Expansion**: Home, Chart AI, Portfolio, Lab, AI analysis, portfolio integration, account/order/trading/balance/holdings/WebSocket features remain out of scope and unapproved.
- **Evidence basis**: Phase 3AN validation (check:market-quote-card 25/25, check:kis-error-fallback 40/40, build clean) and Phase 3AO owner browser review (no blocking issues reported, implementation commit 99ddbcf).
- No source code, scripts, `package.json`, styles, API logic, KIS guard, Supabase logic, Vercel config, deployment, live KIS call, live Supabase query/write, SQL, HTTP request, or env mutation changed in this decision task.
- No actual symbol, price value, Preview URL, bypass secret, secret, token, raw KIS field value, raw error, or stack trace was recorded.

## Phase 3AO - 2026-06-23

### Owner Browser Review — Market Live Quote Card (Passed)

- Created `docs/planning/phase_3ao_owner_browser_review_market_live_quote_card_result_v0.1.md`.
- **Status**: passed with no blocking issues reported.
- **Execution mode**: Documentation-only result recording. No implementation changes, no live execution.
- **Owner review summary**: The owner performed a browser review of the Phase 3AN Market page Live Quote Snapshot card (commit 99ddbcf) and reported that, overall, there were no notable issues. The review is recorded as passed.
- **Caveat**: The owner did not provide item-by-item checklist evidence against the Phase 3AN result document section 8 checklist. This record is based on the owner's summary judgment rather than detailed per-check proof.
- **Decision**: Phase 3AN implementation retained without immediate adjustment.
- **Expansion**: Home, Chart AI, Portfolio, Lab, and Heatmap remain outside the live quote integration scope. Separate explicit owner approval required before any additional surface is wired.
- **Production KIS**: Remains blocked. No change to `VERCEL_ENV=production` guard.
- No source code, scripts, `package.json`, styles, API logic, KIS guard, Supabase logic, or Vercel configuration changed in this result-recording task.
- No live KIS call, live Supabase query/write, SQL, Vercel CLI, Vercel env mutation, deployment, HTTP request, or `.env*` read occurred.
- No actual symbol, price value, Preview URL, bypass secret, secret, token, raw KIS field value, raw error, or stack trace was recorded.

## Phase 3AN - 2026-06-23

### Minimal Market Page Live Quote Card Implementation (Implemented)

- Created `src/components/MarketLiveQuoteCard.astro` — the Market page Live Quote Snapshot card. Supports `enabled: boolean` prop. When disabled, renders a compact "시세 조회를 사용할 수 없습니다." section; no script runs, no network request is made. When enabled, renders the full interactive card with all 8 UX states (disabled, idle, validation error, loading, fresh, cache-fresh, stale fallback, unavailable).
- Modified `src/components/MarketShell.astro` — added `MarketLiveQuoteCard` import, `isMarketQuoteCardEnabled` feature flag constant (reads `import.meta.env.KIS_ENABLE_MARKET_QUOTE_CARD`), and inserted `<MarketLiveQuoteCard enabled={isMarketQuoteCardEnabled} />` between the page header and the market dashboard section.
- Modified `src/styles/style.css` — added `.market-quote-card`, `.market-quote-card--disabled`, `.mqc-*` classes (new rules only; no existing rules modified).
- Created `scripts/check_market_quote_card_static_contract.mjs` — 25-check static validation script (no network, no `.env` reads).
- Modified `package.json` — added `"check:market-quote-card": "node scripts/check_market_quote_card_static_contract.mjs"`.
- Created `docs/planning/phase_3an_minimal_market_live_quote_card_result_v0.1.md`.
- **Status**: implemented — awaiting owner browser review (Phase 3AO).
- **Validation results**: `check:market-quote-card` 25/25 passed; `check:kis-error-fallback` 40/40 passed; `npm run build` clean; `git diff --check` passed.
- **Feature flag**: `KIS_ENABLE_MARKET_QUOTE_CARD` (Astro SSR env var, default disabled). Card not rendered when flag is absent or not `'true'`.
- **Critical rule**: No auto-fetch on page load. A network request to `/api/market/quote` is only issued after the user enters a valid 6-digit symbol and explicitly submits the form.
- **Sanitization**: No raw KIS fields, no raw errors, no stack traces, no secrets, no tokens, no hardcoded actual stock symbol, no hardcoded actual price, no console.log/console.error calls in the component.
- **Scope**: Market page only. Home, Chart AI, Portfolio, Lab, and Heatmap remain disconnected from live quote data.
- **Production KIS**: Remains blocked by `VERCEL_ENV=production` hard block. No Production endpoint validation performed.
- No actual symbol, price value, Preview URL, bypass secret, secret, token, raw KIS field, raw error, or stack trace was recorded.

## Phase 3AM - 2026-06-23

### Minimal UI Live Quote Integration Plan (Planned)

- Created `docs/planning/phase_3am_minimal_ui_live_quote_integration_plan_v0.1.md`.
- **Status**: planned — documentation-only. No implementation or live execution in this phase.
- **Follows**: Phase 3AL conditionally opened gate for a minimal UI live quote integration planning phase.
- **Recommended first UI surface**: Market page only (`src/components/MarketShell.astro`). Non-targets for first implementation: Home, Chart AI, Portfolio, Lab, Heatmap. Reasoning: Market page has the closest quote-data context, limits impact, and avoids conflating live quote display with AI analysis, portfolio, or account features.
- **Proposed placement**: A compact Live Quote Snapshot section inserted between the existing `<header class="page-header market-page-header">` and `<section class="market-dashboard">` in `MarketShell.astro`. No ad rail is present on the Market page; the Home page rail is unaffected.
- **Data contract**: Future implementation must use only the existing normalized `/api/market/quote` endpoint contract (`QuoteSnapshot` fields only; no raw KIS fields, no direct KIS or Supabase browser calls).
- **UX states defined**: idle, loading, fresh, cache-fresh, stale-fallback, unavailable, validation error, disabled/kill-switch.
- **Feature flag**: Recommended `KIS_ENABLE_MARKET_QUOTE_CARD` Astro SSR environment variable; default absent/false (card not rendered).
- **Direct UI implementation**: Remains blocked in this phase. Phase 3AN implementation requires a separate explicit owner approval after this plan is reviewed.
- **Production KIS**: Remains blocked by `VERCEL_ENV=production` hard block. No Production endpoint validation performed.
- **Account/order/trading/balance/holdings/WebSocket**: Remain entirely out of scope in all current and planned phases.
- **Acceptance criteria for Phase 3AN**: Build passes; all five check scripts pass; UI limited to Market page; feature disabled by default; all 8 UX states implemented; error states sanitized; no raw KIS fields or tokens visible; owner browser review checklist completed.
- No source code, scripts, `package.json`, API logic, KIS guard, Supabase logic, or Vercel configuration changed in this planning task.
- No actual symbol, price value, Preview URL, bypass secret, secret, token, raw KIS field, raw error, or stack trace was recorded.

## Phase 3AL - 2026-06-23

### Validation Sufficiency and UI Integration Gate Decision (Decided)

- Created `docs/planning/phase_3al_validation_sufficiency_ui_integration_gate_decision_v0.1.md`.
- **Status**: decided — gate conditionally opened for a minimal UI live quote integration planning phase.
- **Execution mode**: Documentation-only gate decision. No live KIS call, Supabase query/write, SQL, Vercel CLI, deployment, HTTP request, or UI wiring involved.
- **Evidence basis**: Phase 3AF successful-path owner-run Vercel Preview validation (14/14 criteria, `ForbiddenTermsFoundCount=0`) and Phase 3AK no-network mock harness (40/40 scenarios, all six groups A–F passed, `RawKisFieldsAbsent=true`, `ForbiddenTermsFoundCount=0`, build passed, no `src/` changes).
- **Gate outcome**: Sufficient to proceed to a minimal UI live quote integration planning phase (Phase 3AM). Direct UI implementation remains blocked in Phase 3AL and in Phase 3AM; actual UI wiring implementation requires a separate explicit owner approval after the Phase 3AM plan is reviewed.
- **Production KIS**: Remains blocked. The `VERCEL_ENV=production` hard block is in place. No Production endpoint has been validated or will be validated until a separate owner-approved production readiness phase.
- **Account/order/trading/balance/holdings/WebSocket**: Remain entirely out of scope. No planning or implementation in any current or planned phase.
- **Open limitations carried forward**: No live KIS outage validated; no live Supabase outage validated; Vercel cold-start token cache behavior uncharacterized; UI rendering not implemented; browser-side behavior untested.
- **Recommended next phase**: Phase 3AM — Minimal UI Live Quote Integration Plan (surface selection, UI state specification, data contract mapping, feature flag strategy, sanitization plan, browser review checklist, implementation boundary). Phase 3AN implementation only after explicit owner approval of the Phase 3AM plan.
- No source code, scripts, `package.json`, API logic, KIS guard, Supabase logic, or Vercel configuration changed in this decision task.
- No actual symbol, price value, Preview URL, bypass secret, secret, token, raw KIS field, raw error, or stack trace was recorded.

## Phase 3AK - 2026-06-23

### No-Network KIS Error/Fallback Validation Harness (Implemented, Passed)

- Created `scripts/check_kis_error_fallback_paths.mjs` — no-network mock-based validation harness for KIS error and fallback paths.
- Added `check:kis-error-fallback` npm script to `package.json`.
- Created `docs/planning/phase_3ak_no_network_kis_error_fallback_validation_result_v0.1.md`.
- **Status**: passed — 40/40 scenarios passed, exit code 0.
- **Execution mode**: Local no-network mock validation only. No live KIS call, no live Supabase query or write, no Vercel CLI, no deployment, no HTTP request was made.
- **Scenario groups**: (A) Runtime guard — 8 scenarios; (B) Env readiness — 6 scenarios; (C) Provider failure — 9 scenarios (token: 429, non-200, empty token, throws; quote: 429, non-200, rt_cd nonzero, missing price, throws); (D) Cache fallback — 6 state transitions; (E) Sanitization — 3 checks; (F) Request validation — 8 scenarios.
- **No-network enforcement**: `globalThis.fetch` overridden at script start to throw on any real network attempt. All provider logic uses injected `fetchFn`; all cache logic uses injected mock functions.
- **Forbidden output scan**: Zero forbidden terms found across all logged output lines and serialized result objects. `RawKisFieldsAbsent=true`, `ForbiddenTermsFoundCount=0`, `SecretsTokensRawErrorsAbsent=true`.
- **Synthetic env values**: Fake placeholder credentials used to satisfy presence checks only; never printed in output or recorded.
- **Env save/restore**: `process.env` fully restored in `finally` block after all tests.
- **UI live quote wiring**: Remains blocked. No page was connected to live quote data. Explicit owner approval is required before any UI integration phase proceeds.
- **Production KIS**: Remains blocked by `VERCEL_ENV=production` runtime guard (confirmed by Group A tests).
- **KIS_ACCOUNT_NO**: Must remain absent in all scopes by policy (Group A confirms block is active).
- No actual symbol, price value, Preview URL, bypass secret, secret, token, raw KIS field, raw error, or stack trace was recorded.
- No source code (`src/`) or API route logic was changed.

## Phase 3AJ - 2026-06-22

### KIS Error/Fallback Path Validation Plan (Planned)

- Created `docs/planning/phase_3aj_kis_error_fallback_path_validation_plan_v0.1.md`.
- **Status**: planned — no implementation or live execution in this phase.
- **Purpose**: Define a safe validation plan for KIS error, guard, and fallback behavior before any UI live quote integration is approved. Follows Phase 3AF (successful Preview path validation) and Phase 3AI (env scope cleanup).
- **Validation scenario groups defined**: (A) runtime guard classification, (B) env readiness, (C) provider failure paths (token + quote), (D) cache fallback state transitions, (E) API response sanitization, (F) request validation.
- **Recommended staged approach**: Phase 3AK (no-network mock/harness validation) → Phase 3AL (optional owner-run local validation if needed) → Phase 3AM (UI integration gate decision, requires explicit owner approval).
- **UI live quote wiring**: Remains blocked. No page (Home, Market, Chart AI, Lab, Portfolio) may be connected to live quote data until Phase 3AK passes and the owner explicitly approves a UI integration phase.
- **No source code, scripts, `package.json`, API logic, KIS runtime guard, Supabase logic, Vercel configuration, deployment, live KIS call, live Supabase query/write, SQL, Vercel CLI command, or HTTP request was involved in this planning task.**
- **No actual symbol, price value, Preview URL, bypass secret, secret, token, raw KIS field, raw error, or stack trace was recorded.**

## Phase 3AI - 2026-06-22

### Vercel Env Scope Cleanup Result (Owner-Run, Passed)

- Created `docs/planning/phase_3ai_vercel_env_scope_cleanup_result_v0.1.md`.
- **Status**: owner-confirmed pass.
- **Execution mode**: Owner-run. Claude Code did not access Vercel, mutate Vercel env, run Vercel CLI, deploy, call the Preview endpoint, make HTTP requests, run live KIS calls, run live Supabase queries/writes, or execute SQL.
- **Owner-run scope cleanup**: The owner performed Vercel environment scope cleanup outside Claude Code via the Vercel dashboard, resolving the Phase 3AF owner-approved Production and Preview env scope exception.
- **Redeploy trigger commit**: `20f21ec chore: trigger preview redeploy after env scope cleanup` — owner-run empty commit and push to trigger Preview redeployment after env scope cleanup.
- **Endpoint validation basis**: Phase 3AF sanitized Preview endpoint validation already passed (recorded in `phase_3af_owner_vercel_preview_endpoint_validation_result_v0.1.md`). No additional endpoint call was run by Claude Code in Phase 3AI.
- **Production live KIS**: Remains blocked by `VERCEL_ENV=production` runtime guard. Unchanged.
- **KIS_ACCOUNT_NO**: Must remain absent in all Vercel env scopes by policy.
- **UI live quote wiring**: Remains blocked pending explicit owner gate decision.
- No actual symbol, price value, Preview URL, bypass secret, secret, token, raw KIS field, raw error, or stack trace was recorded.
- No source code, scripts, `package.json`, API logic, KIS runtime guard, Supabase logic, Vercel configuration, or UI wiring changed in this result-recording task.
- The Phase 3AF dual-scope configuration is no longer the desired steady state. The official project record should reflect that the cleanup has been performed.

## Phase 3AH - 2026-06-22

### Global Page Gutter Second Pass (Implemented)

- Created `docs/planning/phase_3ah_global_page_gutter_second_pass_result_v0.1.md`.
- Modified `src/styles/style.css`: updated `--page-gutter-x` from `clamp(20px, 2.25vw, 40px)` (Phase 3AG) to `clamp(24px, 4vw, 72px)`.
- **Owner review finding**: Phase 3AG gutter change was too subtle; layout still felt cramped at 1280 px and 1440 px. This phase approximately doubles the growth rate (2.25 → 4 px per 100 px of viewport) and raises the maximum gutter from 40 px to 72 px.
- **Approximate gutter values**: ~51 px at 1280 px, ~58 px at 1440 px, 72 px at 1920 px (clamped max; `--page-max-width: 1500px` auto-centering then dominates).
- **Ad banner 160 × 600 preserved.** `.home-rail-viewport` (160 × 600), `.home-rail-ad` (160 px), `.home-sidebar-column` (min-width 160 px), and the 1440 px+ home shell grid (`minmax(0, 1fr) 176px`) are all unchanged.
- No separate mobile media query added; `body { min-width: 1080px }` means effective minimum rendered gutter is ~43 px; clamp floor is 24 px.
- All four gutter-consuming rules (`.site-header`, `.ticker-track`, `.nav-inner`, `.site-main`) continue to reference `var(--page-gutter-x)` unchanged from Phase 3AG.
- `npm run build`: pass. `git diff --check`: pass. Only `src/styles/style.css` and documentation files changed.
- No API, KIS, Supabase, Vercel, or deployment changes occurred. No live network calls were made. No UI live quote wiring was added. No secrets or price values were recorded.
- Owner browser review required at 1280 px, 1440 px, 1920 px, and mobile width to confirm the gutter feels right.

## Phase 3AG - 2026-06-22

### Global Page Gutter Layout Refinement (Implemented)

- Created `docs/planning/phase_3ag_global_page_gutter_layout_refinement_result_v0.1.md`.
- Modified `src/styles/style.css`: added `--page-gutter-x: clamp(20px, 2.25vw, 40px)` CSS variable; applied to `.site-header`, `.ticker-track`, `.nav-inner`, and `.site-main`; removed redundant `@media (max-width: 640px)` `.site-main` width override.
- **Ad banner 160 × 600 preserved.** `.home-rail-viewport` (160 × 600), `.home-rail-ad` (160 px), `.home-sidebar-column` (min-width 160 px), and the 1440 px+ home shell grid (`minmax(0, 1fr) 176px`) are all unchanged.
- **All app pages inherit the global gutter.** Home, Chart AI, Market, Lab, Portfolio, and any page using `Layout.astro` receive the gutter change through the shared `.site-main` rule.
- **Gutter values**: 20 px (mobile/narrow, clamped minimum) → ~29 px (1280 px viewport) → ~32 px (1440 px viewport) → 40 px (1920 px+, clamped maximum; `--page-max-width: 1500px` takes over beyond that).
- Header, ticker, nav, and main content left edges are now aligned to the same horizontal offset at every viewport size.
- `npm run build`: pass. `git diff --check`: pass. Only `src/styles/style.css` and documentation files changed.
- No API, KIS, Supabase, or Vercel/deployment changes occurred. No live network calls were made. No UI live quote wiring was added. No secrets or price values were recorded.
- Owner browser review required at 1280 px, 1440 px, 1920 px, and mobile width to confirm visual result.

## Phase 3AF Owner-Run Result - 2026-06-22

### Vercel Preview Endpoint Validation Result (Owner-Run, Passed)

- Created `docs/planning/phase_3af_owner_vercel_preview_endpoint_validation_result_v0.1.md`.
- Status: **passed**. Owner-run Vercel Preview endpoint validation of `/api/market/quote` succeeded.
- Owner configured Vercel environment variables outside Claude Code and called the Preview endpoint manually.
- Deployment Protection bypass used with owner-provided secret; bypass secret not recorded.
- Production and Preview env scopes were used as an owner-approved exception. Production live KIS remains blocked by the Phase 3AE runtime guard (`VERCEL_ENV=production` is an unconditional hard block regardless of env var scope).
- **Sanitized result**: HTTP 200, JSON parse ok, `Cache-Control: no-store`, `ok: true`, `data` and `fallback` objects present, all required normalized fields present (`market`, `symbol`, `price`, `currency`, `asOf`, `fallback.state`, `fallback.reason`), raw KIS fields absent, forbidden term count 0, secrets/tokens/raw errors absent.
- Actual stock symbol was redacted before recording (`<REDACTED_6_DIGIT_KR_CODE>`). Price value was not recorded. Preview URL was not recorded. Bypass secret was not recorded.
- No live KIS call was run by Claude Code. No live Supabase query or write was run by Claude Code. No SQL was executed. No Astro dev server was started. No Vercel CLI command was run. No Vercel env mutation was performed by Claude Code. No deployment was performed by Claude Code. No HTTP request was made by Claude Code.
- No source code, scripts, `package.json`, Vercel env, deployment, UI wiring, or KIS runtime guard was changed in this result-recording task.
- No actual symbol, price value, Preview URL, bypass secret, secret, token, raw KIS field, raw error, or stack trace was recorded.
- **Recommended future scope cleanup**: KIS credential env vars were set in both Production and Preview scopes as an owner-approved exception; removing them from Production scope is recommended.
- Production KIS remains blocked. UI live quote wiring remains blocked.

## Phase 3AF - 2026-06-22

### Vercel Preview Env Mutation, Deployment, and Endpoint Validation Owner-Run Plan (Planning-Only)

- Created `docs/planning/phase_3af_vercel_preview_env_deployment_endpoint_validation_owner_run_plan_v0.1.md`.
- Phase 3AF is planning-only / owner-run procedure documentation. No execution was performed.
- No Vercel CLI command was run.
- No Vercel environment variable was mutated.
- No deployment occurred.
- No Preview endpoint was called.
- No live KIS call was run by Claude Code.
- No live Supabase query or write was run by Claude Code.
- No SQL was executed.
- No Astro dev server was started.
- No source code or scripts were changed.
- No KIS runtime guard was changed.
- No UI wiring occurred.
- **Document defines**: A future owner-run Vercel Preview validation procedure covering: (1) Preview-only env var mutation via Vercel UI, (2) Preview deployment trigger, (3) sanitized `/api/market/quote` endpoint test, (4) evidence recording using boolean-only Section 12 template, (5) cleanup plan.
- **Required Preview env names (names only, no values)**: `KIS_APP_KEY`, `KIS_APP_SECRET`, `KIS_BASE_URL`, `KIS_ENABLE_LIVE_QUOTES=true`, `KIS_ENABLE_PREVIEW_LIVE_QUOTES=true`, `QUOTE_CACHE_BACKEND=supabase`, `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- **`KIS_ACCOUNT_NO` must remain absent** in all scopes (Preview, Production, Development).
- **Production scope must not be changed** during any Phase 3AF execution step.
- **Includes**: PowerShell sanitized check template (Section 9), expected pass criteria table (Section 10), sanitized failure categories (Section 11), owner evidence template (Section 12), cleanup plan (Section 13), risk controls (Section 14).
- Any future Vercel env mutation, deployment trigger, or Preview endpoint test requires explicit owner execution only. Owner must complete the Section 5 approval checklist before any step.
- Production KIS remains blocked. UI wiring remains blocked.

## Phase 3AE - 2026-06-22

### Preview-Safe KIS Runtime Guard Implementation (Implemented and Locally Validated)

- Created `docs/planning/phase_3ae_preview_safe_kis_runtime_guard_result_v0.1.md`.
- Implements Phase 3AD Option B guard policy.
- **Source files changed**: `src/lib/server/providers/kisClient.ts`, `src/lib/server/providers/providerEnv.ts`, `src/lib/server/providers/types.ts`, `package.json`.
- **New files**: `scripts/check_kis_runtime_guard_policy.mjs`.
- `isProductionRuntime()` replaced by `classifyRuntime()` returning one of six explicit runtime classes: `local`, `vercel-preview`, `vercel-production`, `vercel-development`, `node-production`, `unknown`.
- `getKisQuoteConfigReadiness()` updated to:
  - Hard-block `vercel-production`, `node-production`, and `unknown` → `production_not_allowed`.
  - Block when `KIS_ACCOUNT_NO` is present → `production_not_allowed`.
  - Block `vercel-preview` without `KIS_ENABLE_PREVIEW_LIVE_QUOTES=true` → `preview_guard_required`.
  - Preserve existing `disabled`, `config_missing`, `ready` behavior for all other passing runtimes.
- `'preview_guard_required'` added to `ProviderConfigReadiness.reason` union in `types.ts`.
- `KIS_ENABLE_PREVIEW_LIVE_QUOTES` added to `ProviderEnvName` union and registry in `providerEnv.ts` with `productionAllowed: false`.
- **Validation commands**: `node --check scripts/check_kis_runtime_guard_policy.mjs` (pass), `npm run check:kis-runtime-guard` (7/7 pass), `npm run check:provider-boundaries` (pass), `npx tsc --noEmit` (pass), `npm run build` (pass), `git diff --check` (pass).
- **Production KIS**: Remains blocked — `VERCEL_ENV=production` is an absolute hard block, unchanged.
- **Preview KIS**: Allowed only when `VERCEL_ENV=preview` AND `KIS_ENABLE_PREVIEW_LIVE_QUOTES=true` AND `KIS_ENABLE_LIVE_QUOTES=true` AND credentials present AND `KIS_ACCOUNT_NO` absent.
- **Local KIS**: Unchanged.
- No Vercel env mutation occurred. No deployment occurred. No live KIS call was run. No live Supabase query or write was run. No SQL was executed. No Astro dev server was started. No UI live quote wiring was implemented. No `.env*` contents were read. No secret, token, key, raw KIS field, price value, or account data was recorded.
- Next step: Owner-approved Phase 3AF — Vercel Preview env mutation and deployment plan.

## Phase 3AD - 2026-06-22

### KIS Runtime Guard Preview/Production Decision (Decision-Only)

- Created `docs/planning/phase_3ad_kis_runtime_guard_preview_production_decision_v0.1.md`.
- Phase 3AD is decision-only. No code change, no execution.
- No source code was changed. `kisClient.ts` and `providerEnv.ts` are unchanged.
- No KIS guard was changed. `isProductionRuntime()` is unchanged.
- No Vercel env mutation occurred.
- No deployment occurred.
- No live KIS call was run.
- No live Supabase query/write was run.
- No SQL was executed.
- No Astro dev server was started.
- No UI wiring occurred.
- **Decision problem**: Current `isProductionRuntime()` returns `true` when `NODE_ENV === 'production'` OR `VERCEL_ENV === 'production'`. Vercel sets `NODE_ENV=production` in all deployed runtimes including Preview. Therefore, Vercel Preview live KIS is blocked under the current guard via the `NODE_ENV` branch even when `VERCEL_ENV=preview`.
- **Recommended option**: Option B — allow Vercel Preview live KIS only when `VERCEL_ENV=preview` AND a new explicit Preview guard env var (`KIS_ENABLE_PREVIEW_LIVE_QUOTES`) is set to `true`, in addition to existing `KIS_ENABLE_LIVE_QUOTES=true` and credential presence. Production hard block on `VERCEL_ENV=production` is unchanged. Local behavior is unchanged.
- **Production KIS**: Remain permanently blocked — `VERCEL_ENV=production` is an absolute hard block in the recommended option.
- **5-option decision matrix documented**: A (keep unchanged), B (Preview explicit opt-in — recommended), C (remove NODE_ENV block), D (runtime policy enum), E (defer all Vercel KIS testing).
- Risk assessment documented for: accidental Production enablement, Preview secret mis-scoping, NODE_ENV misclassification, ambiguous runtime, provider error exposure, premature UI wiring.
- Owner approval checklist provided for Phase 3AE implementation decision.
- Any future guard implementation requires explicit owner approval for both code change and Vercel Preview env mutation/deployment in separate phases.
- No project refs, secrets, price values, raw KIS fields, screenshots, raw errors, or stack traces recorded.

## Phase 3AC - 2026-06-22

### Vercel Preview Environment Validation Plan (Planning Only)

- Created `docs/planning/phase_3ac_vercel_preview_environment_validation_plan_v0.1.md`.
- Phase 3AC is planning-only. No execution occurred.
- No Vercel CLI command was run.
- No Vercel env mutation occurred.
- No deployment was triggered.
- No live KIS call was run by Claude Code.
- No live Supabase query/write was run by Claude Code.
- No SQL was executed.
- No Astro dev server was started.
- No source code or scripts were changed.
- No production KIS guard was changed.
- No UI wiring occurred.
- **Key finding**: The current `isProductionRuntime()` guard in `src/lib/server/providers/kisClient.ts` (lines 60–64) returns `true` when `NODE_ENV === 'production'` OR `VERCEL_ENV === 'production'`. Vercel sets `NODE_ENV=production` in all deployed runtimes, including Preview deployments. This means Preview live KIS calls are likely blocked by the `NODE_ENV` branch of the guard even when `VERCEL_ENV=preview`. Any live Preview KIS test will likely return `blocked_by_runtime_guard` without a separate guard-decision phase.
- Plan defines: 4-option decision matrix (plan-only / Preview env mutation only / Preview endpoint test / defer), recommended safe sequence (investigate runtime env first without secrets), future owner-run procedure, expected blocked case handling (`blocked_by_runtime_guard`), sanitized evidence template, rollback/cleanup procedure, and approval boundary.
- Any future Vercel env mutation, deployment, or Preview endpoint test requires explicit owner approval separate from this planning document.
- Any production guard change to allow `VERCEL_ENV=preview` requires a separate gate-decision planning phase and explicit owner approval before any code change.
- No project refs, secrets, price values, raw KIS fields, screenshots, raw errors, or stack traces recorded.

## Phase 3AB - 2026-06-22

### Owner-Run Live Supabase Persistent Cache + Live KIS Quote Validation Result

- Created `docs/planning/phase_3ab_owner_live_supabase_cache_kis_quote_validation_result_v0.1.md`.
- Status: passed.
- Owner ran `npm run smoke:supabase-cache-live-kis-quote:dry` in live-approved mode with real KIS and Supabase credentials.
- `guard-check`: passed — live approval guards verified.
- `runtime-check`: passed — `nodeEnvIsProduction=false`, `vercelEnvIsProduction=false`.
- `kis-accno-check`: passed — `kisAccnoAbsent=true`.
- `cache-backend-check`: passed — `configuredBackend=supabase`.
- `config-preflight`: passed — KIS and Supabase env names present.
- `first-call`: passed — `firstCallReason=provider-fresh` (live KIS fetch succeeded; quote written to in-memory Map and Supabase).
- `memory-flush`: passed — in-memory Map cleared; Supabase row untouched.
- `second-call`: passed — `secondCallReason=cache-fresh` (Supabase served the fresh row).
- `supabaseReadbackConclusive=true` — conclusive proof that Supabase persistent cache was written and read back correctly.
- `final-result`: passed — `mode=live-approved liveKis=true liveSupabase=true`.
- This is the first recorded end-to-end validation of: live KIS fetch → Supabase write → in-memory flush → Supabase readback → `cache-fresh`.
- Post-run shell environment cleanup was recommended separately but was not part of the provided harness output.
- No live KIS call by Claude Code — owner-run only.
- No live Supabase query/write by Claude Code.
- No SQL executed.
- No Astro dev server started by Claude Code.
- No Vercel command or environment mutation.
- No deployment.
- No source code, scripts, or `package.json` changed in this result-recording task.
- No production KIS guard changed.
- No UI wiring implemented.
- No actual stock symbol, price value, secret, token, key, raw KIS field, raw response body, account data, raw error, or stack trace recorded.
- Remaining unresolved areas: Vercel Preview environment validation, Vercel Production gate decision (Phase 3X Option A/B/C), UI live quote wiring, KIS rate-limit and error/fallback behavior, cold-start token cache behavior in Vercel.

## Phase 3AB - 2026-06-21

### Supabase Persistent Cache Live KIS Quote Harness Implementation (Option B)

- Created `scripts/owner_smoke_supabase_cache_live_kis_quote.mjs` — fail-closed owner-run harness.
- Added `smoke:supabase-cache-live-kis-quote:dry` script to `package.json`.
- Created `docs/planning/phase_3ab_supabase_persistent_cache_live_kis_quote_harness_result_v0.1.md`.
- Dry-run validation passed: all 26 output lines passed the forbidden output pattern scanner. No live KIS call. No live Supabase connection.
- Implementation uses Strategy 1 (in-process memory flush): first `getQuoteSnapshot()` call writes to memory + Supabase; `clearQuoteCacheForTests()` clears in-memory Map only; second `getQuoteSnapshot()` reads from Supabase → `cache-fresh`. This conclusively proves Supabase readback because the second `cache-fresh` response cannot come from the cleared in-memory Map.
- Dry-run mock: `supabaseAdmin.ts` replaced with an in-process stub backed by a `Map`; `options.provider` injected as a mock KIS provider returning a synthetic snapshot; `QUOTE_CACHE_BACKEND=supabase` set internally.
- Dry-run key results: `firstCallReason=provider-fresh`, `secondCallReason=cache-fresh`, `supabaseReadbackConclusive=true`, `mockUpsertCalled=true`, `mockSelectCalled=true`.
- TypeScript compiled to isolated `.astro/phase3ab-smoke-*/out/` temp directory; cleaned up in `finally` block.
- Forbidden output pattern blocks KIS credentials, Supabase credentials, `supabase.co`, raw KIS field names, `stack`, `trace`, and all other sensitive terms.
- Guard env var names required for live mode: `MK_STOCK_LAB_PHASE_3AB_LIVE_APPROVAL=OWNER_APPROVES_LIVE_KIS_AND_SUPABASE_CACHE_SMOKE`, `MK_STOCK_LAB_PHASE_3AB_LIVE_MODE=true`.
- Additional live mode requirements: `QUOTE_CACHE_BACKEND=supabase`, `KIS_ACCOUNT_NO` absent, non-production runtime, symbol via `MK_STOCK_LAB_PHASE_3AB_SYMBOL`.
- No live KIS call by Claude Code.
- No live Supabase query/write by Claude Code.
- No SQL executed.
- No Astro dev server started.
- No Vercel command or environment mutation.
- No deployment.
- No UI wiring.
- No production KIS guard changed.
- No secrets, price values, raw KIS fields, raw errors, or stack traces recorded.
- Live run requires explicit owner action (procedure documented in result file Section 7).

## Phase 3AB - 2026-06-21

### Supabase Persistent Cache Live KIS Quote Validation Plan (Planning Only)

- Created `docs/planning/phase_3ab_supabase_persistent_cache_live_kis_quote_validation_plan_v0.1.md`.
- Phase 3AB is planning-only. No live calls were run. No execution occurred.
- Plan defines a future owner-run validation for the combined path: live KIS quote response persisted to and read back from Supabase persistent quote cache through the full quote pipeline with `QUOTE_CACHE_BACKEND=supabase`.
- Remaining gap documented: Phase 3V validated Supabase cache independently with a synthetic payload; Phase 3Z validated local live KIS quote fetch and normalization with in-process mock cache; Phase 3AA validated the HTTP route response shape; none of these validated live KIS data flowing through Supabase persistent cache.
- Key finding: the current `/api/market/quote` response contract can distinguish `provider-fresh` from `cache-fresh` via `fallback.reason`, but cannot conclusively prove Supabase readback (vs memory readback) in the same process, because both backends are written simultaneously by `setConfiguredQuoteCacheEntry()`.
- Cold-start readback approach defined: a two-run procedure with a process restart between runs clears the in-memory cache, making a `cache-fresh` second-request response conclusively attributable to Supabase.
- Three execution options defined: Option A (manual cold-start), Option B (fail-closed harness using `clearQuoteCacheForTests()` for timing-reliable in-process Supabase readback proof), Option C (temporary instrumentation — least preferred).
- Recommended path: Option B harness, modeled after Phase 3Y, requiring explicit owner approval before implementation.
- TTL timing constraint documented: 15-second fresh TTL (`QUOTE_CACHE_FRESH_TTL_MS = 15_000`) makes Option A timing-sensitive.
- Safety gates defined: owner-run only, local non-production, `KIS_ACCOUNT_NO` absent, all secrets private, sanitized evidence only.
- Owner evidence template provided with cold-start two-run evidence fields.
- No live KIS call by Claude Code.
- No live Supabase query/write by Claude Code.
- No SQL executed.
- No Astro dev server started by Claude Code.
- No Vercel command or environment mutation.
- No deployment.
- No UI wiring.
- No source code or scripts changed.
- No production KIS guard changed.
- No project refs, secrets, price values, raw KIS fields, screenshots, raw errors, or stack traces recorded.
- Any future execution requires explicit owner approval.
- Harness implementation (Option B) requires explicit owner approval.

## Phase 3AA - 2026-06-21

### Owner-Run Manual Local HTTP Endpoint Verification Result

- Created `docs/planning/phase_3aa_owner_local_api_market_quote_http_endpoint_verification_result_v0.1.md`.
- Status: passed.
- Owner manually ran the Phase 3AA Option A procedure from `phase_3aa_local_api_market_quote_http_endpoint_verification_plan_v0.1.md`.
- Owner started local Astro dev server, sent `GET /api/market/quote?market=KR&symbol=<REDACTED_6_DIGIT_KR_CODE>`, and recorded sanitized boolean evidence only.
- All 11 success criteria passed: HTTP 200, JSON parse OK, `Cache-Control: no-store`, `ok: true`, `data` object present, `fallback` object present, required normalized public fields (`market`, `symbol`, `price`, `currency`, `asOf`) present, `fallback.state` and `fallback.reason` present, raw KIS fields absent, secrets/tokens/raw errors absent.
- `ForbiddenTermsFoundCount`: 0.
- Evidence was sanitized: no actual stock symbol recorded (replaced with `<REDACTED_6_DIGIT_KR_CODE>`), no price value recorded, no raw response body recorded, no raw KIS fields, no tokens, no keys, no account data, no raw errors, no stack traces.
- This is the first recorded successful end-to-end verification of the Astro `/api/market/quote` route with live KIS backing.
- Combined with Phase 3Z, the local server-side quote path from HTTP request through KIS provider to normalized JSON response is now validated locally.
- Supabase persistent cache live write/readback with a live KIS quote remains unvalidated.
- Vercel Preview behavior remains unvalidated.
- Vercel Production behavior remains blocked by `isProductionRuntime()` guard.
- Gate decision (Option A/B/C from Phase 3X) remains pending.
- UI wiring remains blocked.
- Phase 3AA Option B harness (`scripts/owner_smoke_api_quote_live.mjs`) remains unimplemented and requires explicit owner approval.
- No live KIS call by Claude Code.
- No live Supabase query/write by Claude Code.
- No SQL.
- No Supabase MCP DB query.
- No project listing.
- No production DB touch.
- No `.env*` read.
- No Vercel env mutation.
- No deployment.
- No source code changes.
- No script changes.
- No production KIS guard change.
- No UI live quote wiring.
- No project refs, secrets, screenshots, raw errors, or stack traces recorded.

### Local /api/market/quote HTTP Endpoint Verification Plan (Option A — Planning Only)

- Created `docs/planning/phase_3aa_local_api_market_quote_http_endpoint_verification_plan_v0.1.md`.
- This is documentation-only. No execution occurred.
- Document defines the owner-run procedure for verifying the local `/api/market/quote` HTTP endpoint with live KIS backing.
- Sections defined: objective, non-goals, safety gates, required env names, owner-run local procedure (9 steps), expected positive response shape, required absence checks, safe negative checks, owner evidence template, Option B approval boundary, and recommended next step.
- Phase 3AA target flow: HTTP GET → Astro route → `getQuoteSnapshot()` → cache check → KIS token+quote → normalization → `{ ok: true, data: QuoteSnapshot, fallback }` with `Cache-Control: no-store`.
- Phase 3AA is explicitly limited to local non-production only.
- `isProductionRuntime()` guard in `kisClient.ts` must be confirmed false before any HTTP request.
- `KIS_ACCOUNT_NO` must remain absent.
- Owner sets KIS env vars privately in the local shell; Claude Code must not read env values.
- Response evidence must be sanitized: field presence only, no actual price values, no raw KIS fields, no tokens, no keys, no account data, no raw errors, no stack traces.
- Option B harness (`scripts/owner_smoke_api_quote_live.mjs`) is not part of this phase and requires explicit owner approval.
- Harness implementation remains blocked until explicit owner approval.
- No live KIS call was run by Claude Code.
- No live Supabase query/write was run by Claude Code.
- No SQL executed.
- No Supabase MCP DB query.
- No project listing.
- No production DB touch.
- No `.env*` read.
- No Vercel env mutation.
- No deployment.
- No UI live quote wiring.
- No production KIS guard change.
- No source code changes.
- No project refs, secrets, screenshots, raw errors, or stack traces recorded.
- Recommended next action: owner reviews plan, then either runs manual procedure (Option A) or approves Option B harness.

## New Chat Handoff Pack - 2026-06-21

### Handoff Pack Creation

- Created `docs/planning/new_chat_handoff/` directory with five handoff files.
- Current completed phase recorded as Phase 3Z.
- Next recommended phase recorded as Phase 3AA.
- `CURRENT_STATE.md` — operational state snapshot including phase timeline, what is validated, what remains unvalidated, and blocked items.
- `NEXT_TASK_PROMPT.md` — copy-ready Phase 3AA instruction requiring Claude Code read-back before any implementation.
- `PROJECT_HANDOFF_INDEX.md` — source-of-truth file listing, safe startup commands, and expected read-back report structure.
- `NEW_CHAT_BOOTSTRAP_PROMPT.txt` — concise paste-ready bootstrap for a new ChatGPT chat.
- `HANDOFF_MANIFEST.json` — valid JSON manifest of project state, blocked actions, allowed startup actions, and secret handling policy.
- Handoff requires Claude Code repo read-back before any new implementation work begins.
- New chat must not rely on static summary alone.
- No live KIS call.
- No live Supabase query/write.
- No SQL.
- No Supabase MCP DB query.
- No project listing.
- No production DB touch.
- No `.env*` read.
- No Vercel env mutation.
- No deployment.
- No UI live quote wiring.
- No production KIS guard change.
- No source code changes.
- No project refs, secrets, screenshots, raw errors, or stack traces recorded.

## Phase 3Z - 2026-06-21

### Owner Local KIS Quote Smoke Result

- Recorded owner manual local KIS quote smoke result.
- Owner-provided sanitized output showed live-approved mode passed.
- `guard-check` passed — live-approved mode entered.
- `runtime-check` passed — local non-production runtime confirmed.
- `smoke-identity-validation` passed — KR market and 6-digit owner-selected symbol accepted.
- `account-env-check` passed — `KIS_ACCOUNT_NO` confirmed absent.
- `kis-env-preflight` passed — all required KIS config names present by boolean-only evidence.
- `runtime-setup` passed — TypeScript compiled to isolated temp directory.
- `provider-import` passed — live KIS client loaded.
- `quote-fetch` passed — live KIS quote received.
- `quote-normalization` passed — all required public fields present; `staleState=fresh`.
- `cache-backend-check` passed — `configuredBackend=supabase`; in-process mock used for Phase 3Y cache validation, not live Supabase.
- `cache-write` passed — in-process mock write.
- `fresh-readback` passed — `state=fresh` from mock.
- `cleanup-restore` passed — `action=deleted-smoke-cache-entry`.
- `final-result` passed — `liveKis=true quoteNormalized=true cacheValidated=true`.
- This is the first recorded successful local live KIS quote smoke.
- Supabase persistent cache write/readback with live KIS quote remains unvalidated.
- `/api/market/quote` live endpoint remains unvalidated.
- UI live quote wiring remains blocked.
- Production KIS guard unchanged.
- No live KIS call by Claude Code.
- No live Supabase query/write by Claude Code.
- No SQL.
- No Supabase MCP DB query.
- No project listing.
- No production DB touch.
- No `.env*` read.
- No Vercel env mutation.
- No deployment.
- No UI live quote wiring.
- No production KIS guard change.
- No project refs, secrets, screenshots, raw errors, or stack traces recorded.
- Recommended next action: Phase 3AA local `/api/market/quote` endpoint verification phase, only after owner approval.

## Phase 3Y - 2026-06-21

### Local KIS Quote Smoke Harness

- Created `scripts/owner_smoke_kis_quote_live.mjs` — fail-closed, owner-run, local-only KIS quote smoke harness.
- Added `smoke:kis-quote-live:dry` npm script.
- Harness is fail-closed and defaults to dry-run/mock mode.
- Live KIS mode requires all five owner approval guard env vars with exact required values.
- Live KIS mode rejects production runtime (`NODE_ENV` or `VERCEL_ENV` equals `production`) with `PRODUCTION_RUNTIME_NOT_ALLOWED`.
- Live KIS mode rejects `KIS_ACCOUNT_NO` presence with `ACCOUNT_ENV_NOT_ALLOWED` — quote-only scope enforced.
- Harness checks only env name presence for KIS config, never values.
- Harness uses stub KIS provider in dry-run mode — no live KIS code loaded.
- Harness uses in-process mock cache for cache-write, fresh-readback, cleanup-restore steps in both modes.
- Harness emits sanitized `phase3y step=... status=... sanitized=true` output only.
- Forbidden output pattern blocks raw KIS fields, credentials, tokens, secrets, and stack traces.
- Step labels implemented: guard-check, runtime-check, smoke-identity-validation, account-env-check, kis-env-preflight, runtime-setup, provider-import, quote-fetch, quote-normalization, cache-backend-check, cache-write, fresh-readback, cleanup-restore, final-result, dry-run-guard-sim, dry-run-runtime-sim, dry-run-env-sim, dry-run-identity-sim, dry-run-account-env-sim.
- Dry-run/mock validation passed — all 32 output lines confirmed.
- `wouldEmitGuardNotApproved=true`, `currentRuntimeIsProduction=false`, `wouldEmitKisConfigMissing=true`, `errorDetected=true`, `accountEnvCurrentlyAbsent=true` all confirmed.
- `npm run check:provider-boundaries` passed.
- `npx tsc --noEmit` passed.
- `npm run build` passed.
- No live KIS call by Claude Code.
- No live Supabase query/write by Claude Code.
- No SQL.
- No Supabase MCP DB query.
- No project listing.
- No production DB touch.
- No `.env*` read.
- No Vercel env mutation.
- No deployment.
- No UI live quote wiring.
- No production KIS guard change.
- No project refs, secrets, screenshots, raw errors, or stack traces recorded.
- Recommended next action: owner manually runs local KIS quote smoke and records sanitized output in Phase 3Z.

## Phase 3X - 2026-06-21

### Vercel Environment Readiness And KIS Production Gate Decision Plan

- Created Vercel env readiness and KIS production gate decision plan.
- Recorded Phase 3W baseline: Phase 3V cache smoke passed; KIS live end-to-end flow unvalidated; UI live quote wiring blocked; Vercel env mutation blocked.
- Recorded that KIS live provider end-to-end flow remains unvalidated.
- Recorded that UI live quote wiring remains blocked.
- Documented required env names by names only, without values.
- Documented secret/non-secret/project-identifying variable classification.
- Documented local vs Vercel Preview vs Vercel Production readiness strategy.
- Documented current production KIS guard behavior: `isProductionRuntime()` returns `production_not_allowed` when `NODE_ENV` or `VERCEL_ENV` is `production`; fail-closed regardless of env var values.
- Documented that setting Vercel Production env values alone does not enable production KIS calls.
- Documented production KIS gate decision options: Option A (keep production blocked), Option B (Preview-only live KIS), Option C (production read-only KIS behind multiple gates).
- Recommended local owner-run KIS smoke (Phase 3Y) before any Vercel mutation, production guard code change, deployment, or UI wiring.
- Documented owner approval gates for: local KIS env check, live KIS call, Vercel env mutation, production guard code change, deployment, server-side HTTP smoke, UI wiring, Portfolio/Chart AI integration, account-context variable setup.
- Documented future phase sequence: Phase 3Y (local KIS smoke), Phase 3Z (result recording), Phase 3AA (API endpoint verification), Phase 3AB (gate decision), Phase 3AC (Vercel env and deployment), Phase 3AD (controlled UI wiring).
- No code changes.
- No live KIS call.
- No live Supabase query/write.
- No SQL.
- No Supabase MCP DB query.
- No project listing.
- No production DB touch.
- No `.env*` read.
- No Vercel env mutation.
- No deployment.
- No UI live quote wiring.
- No project refs, secrets, screenshots, raw errors, or stack traces recorded.
- Recommended next action: Phase 3Y local owner-run KIS quote smoke harness plan or implementation, only after owner approval.

## Phase 3W - 2026-06-21

### Controlled Live Quote Integration Readiness Plan

- Created controlled live quote integration readiness plan.
- Recorded that Phase 3V persistent quote cache live smoke passed.
- Recorded that the Phase 3V smoke used a synthetic normalized quote snapshot, not a live KIS provider response.
- Recorded that KIS live provider end-to-end flow remains unvalidated.
- Recorded that UI live quote wiring remains blocked.
- Recorded critical production runtime constraint: `kisClient.ts` `isProductionRuntime()` guard blocks KIS calls in production regardless of env var values — setting Vercel env vars alone is not sufficient.
- Defined target end-to-end flow: KIS token fetch → quote fetch → normalization to `QuoteSnapshot` → cache write → API response shape.
- Defined production environment readiness requirements by variable names only, without values.
- Identified KIS secret env names (`KIS_APP_KEY`, `KIS_APP_SECRET`), non-secret feature flags (`KIS_ENABLE_LIVE_QUOTES`), and infrastructure names (`KIS_BASE_URL`).
- Identified `KIS_ACCOUNT_NO` as optional, not needed for quote-only phase, not to be set until account-context phase is approved.
- Defined live provider testing safety gates: runtime confirmation, quota/rate-limit risk acceptance, read-only scope, no account APIs.
- Defined recommended future phase sequence: Phase 3X (Vercel env checklist), Phase 3Y (local KIS smoke harness), Phase 3Z (result recording), later phase (API endpoint verification), later phase (controlled UI wiring).
- Defined first UI surface recommendation: read-only single-stock Market page quote display, only after server-side API smoke passes.
- Explained why not Portfolio valuation or Chart AI first.
- Defined API response verification checklist for future owner manual smoke.
- Defined explicit non-goals: no UI wiring, no live calls, no env mutation, no deployment, no trading/account APIs, no WebSocket.
- No live KIS call.
- No live Supabase query/write.
- No SQL.
- No Supabase MCP DB query.
- No project listing.
- No production DB touch.
- No `.env*` read.
- No Vercel env mutation.
- No deployment.
- No UI live quote wiring.
- No project refs, secrets, screenshots, raw errors, or stack traces recorded.
- Recommended next action: owner reviews plan; if approved, start Phase 3X Vercel production env readiness checklist.

## Phase 3V - 2026-06-21

### Owner Live Smoke Retry Result

- Owner manually ran the Phase 3U-improved live smoke retry.
- Runtime config presence was confirmed by owner with boolean-only evidence.
- All three required Supabase config names were present in the owner shell (`PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
- Owner-provided sanitized live smoke output recorded in Phase 3V result document.
- `guard-check` passed — live-approved mode entered, backup risk acknowledged.
- `smoke-identity-validation` passed.
- `runtime-setup` passed.
- `adapter-import` passed.
- `admin-import` passed.
- `config-preflight` passed — all three required config names present.
- `client-construction` passed — Supabase admin client constructed without error.
- `precheck-read` passed.
- `existing-row-snapshot` passed — reported `existingRowFound=false` (no pre-existing row).
- `success-write` passed — normalized public quote snapshot written to `market_quote_cache`.
- `fresh-readback` passed.
- `stale-readback` passed.
- `failure-metadata-write` passed.
- `cleanup-restore` passed — `action=deleted-smoke-row` (smoke row deleted; no original row to restore).
- `final-result` passed — `mode=live-approved liveSupabase=true cacheKeyNormalized=true originalRowExisted=false`.
- Persistent quote cache owner live smoke retry passed.
- UI live quote wiring remains blocked.
- Created `docs/planning/phase_3v_owner_live_smoke_retry_result_v0.1.md`.
- Updated `docs/planning/planning_changelog.md` with Phase 3V entry.
- Updated `docs/planning/phase_3c1_portfolio_manual_smoke_checklist_v0.1.md` with Phase 3V Korean owner review checklist.
- Claude Code did not rerun live smoke.
- Claude Code did not run live Supabase query/write.
- Claude Code did not execute SQL.
- Claude Code did not use Supabase MCP DB tools.
- Claude Code did not list projects.
- Claude Code did not touch production DB.
- Claude Code did not read `.env*` contents.
- Claude Code did not mutate Vercel env.
- Claude Code did not deploy.
- No project refs, Supabase URLs, keys, tokens, connection strings, screenshots, raw DB errors, stack traces, or secret-bearing output were recorded.
- Recommended next action: separate owner-approved planning/implementation phase for controlled live quote integration readiness; UI live quote wiring remains blocked until approved.

## Phase 3U - 2026-06-21

### Owner Live Smoke Diagnostic Improvement

- Created `docs/planning/phase_3u_owner_live_smoke_diagnostic_improvement_result_v0.1.md`.
- Improved `scripts/owner_smoke_persistent_quote_cache_live.mjs` with owner-safe step-level diagnostic labels.
- Changed harness output prefix from `phase3s` to `phase3u`.
- Added `logStep(step, status, extra)` helper emitting structured `phase3u step=... status=... sanitized=true` lines.
- Added `checkLiveConfigPresence()` that checks only presence of required config names in `process.env`, never values.
- Added config preflight step in live mode, running after admin import and before Supabase client construction.
- Separated failure paths for: guard evaluation, smoke identity validation, runtime setup, adapter import, admin import, config presence, client construction, precheck read, existing-row snapshot, success write, fresh readback, stale readback, failure metadata write, cleanup/restore, and final result.
- Reduced `UNEXPECTED_SAFE_FAILURE` to last-resort only in the top-level `.catch()` handler.
- Updated top-level `.catch()` to use `console.log` directly, avoiding re-triggering `logSafe` in the catch path.
- Updated `logSafe` to emit `SAFE_OUTPUT_BLOCKED` via `console.log` before throwing, so the owner sees a named blocked notice.
- Added `runDryRunSimulations()` logging guard detection, config presence detection, and identity validation simulation results after a successful dry-run smoke.
- Added `process.env` fallback to `src/lib/server/supabaseAdmin.ts` for `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` so the owner-run Node harness can supply these without relying on `import.meta.env`, which is Astro-runtime-only.
- Astro runtime behavior unchanged: `import.meta.env.*` takes precedence via `??`.
- Browser safety unchanged: `assertServerRuntime()` throws before any config access.
- Fail-closed live mode preserved: all six required live approval guards remain unchanged.
- Dry-run mode continues to use a mock Supabase client and never imports the live admin helper.
- No live smoke was rerun by Claude Code.
- No live Supabase query or write was executed by Claude Code.
- No SQL was executed by Claude Code.
- No Supabase MCP database query was run by Claude Code.
- No Supabase project listing was run.
- No Supabase connection was attempted by Claude Code.
- No production DB was touched by Claude Code.
- No ignored `.env*` contents were read.
- No Vercel environment values were read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No UI live quote wiring was implemented.
- No migration files were modified.
- No production SQL pack files were modified.
- No root `README.md` was modified.
- No project refs, Supabase URLs, connection strings, DB passwords, service-role keys, anon keys, JWT secrets, tokens, screenshots, raw DB errors, stack traces, or secret-bearing outputs were recorded.
- Validation passed:
  - `npm run smoke:persistent-quote-cache-live:dry`
  - `node scripts/smoke_persistent_quote_cache_adapter.mjs`
  - `node scripts/smoke_quote_cache_policy.mjs`
  - `node scripts/smoke_market_quote_route_disabled.mjs`
  - `npm run check:provider-boundaries`
  - `npx tsc --noEmit`
  - `npm run build`
- Dry-run output confirmed all step labels present and sanitized, `dry-run-config-sim` reported `wouldEmitConfigMissing=true`, and cleanup-restore label appeared in mock success path.
- Recommended next action: owner manually runs a live smoke retry as a separate approved Phase 3V or equivalent result phase, after setting required config names in the runtime environment.

## Phase 3T - 2026-06-21

### Owner Live Smoke Failed Result

- Created `docs/planning/phase_3t_owner_live_smoke_failed_result_v0.1.md`.
- Recorded the owner-provided sanitized Phase 3S live smoke output.
- Owner manually ran the Phase 3S live smoke.
- Live-approved mode was entered.
- The backup risk acceptance flag was accepted by the harness.
- The live smoke failed with `UNEXPECTED_SAFE_FAILURE`.
- The output was sanitized.
- Persistent adapter live enablement is not passed.
- Write/upsert success was not concluded.
- Readback success was not concluded.
- Cleanup/restore success was not concluded.
- UI live quote wiring remains blocked.
- Static code-path inspection was performed.
- The broad failure boundary is after the live-approved and backup-risk log lines, before any labeled smoke step or cleanup line was reported.
- Static diagnosis identified setup/import/config/client-construction/precheck boundaries as likely broad failure regions.
- A specific static risk is that the owner-run Node harness imports the Supabase admin helper outside the Astro runtime while that helper resolves public Supabase config through `import.meta.env`.
- Corrective action is needed before any live retry.
- Recommended next action: Phase 3U safe diagnostic improvement before any owner manual live retry.
- Codex did not rerun the live smoke.
- Codex did not run live Supabase query or write.
- Codex did not execute SQL.
- Codex did not use Supabase MCP database tools.
- Codex did not list projects.
- Codex did not attempt a Supabase connection.
- Codex did not touch production DB.
- Codex did not read ignored `.env*` contents.
- Codex did not mutate Vercel environment values.
- Codex did not deploy.
- No project refs, Supabase URLs, connection strings, DB passwords, service-role keys, anon keys, JWT secrets, tokens, screenshots, raw DB errors, stack traces, or secret-bearing outputs were recorded.
- Build was skipped because Phase 3T changed documentation only.

## Phase 3S - 2026-06-21

### Persistent Quote Cache Enablement Smoke Harness

- Created `docs/planning/phase_3s_persistent_quote_cache_enablement_smoke_harness_result_v0.1.md`.
- Added `scripts/owner_smoke_persistent_quote_cache_live.mjs`.
- Added `npm run smoke:persistent-quote-cache-live:dry`.
- Prepared an owner-run persistent adapter live smoke harness.
- The live smoke harness is fail-closed.
- Live mode requires all explicit owner approval flags before any live Supabase access can occur:
  - `QUOTE_CACHE_BACKEND=supabase`
  - `PHASE_3S_LIVE_SMOKE=OWNER_APPROVED`
  - `PHASE_3S_TARGET_CONFIRMED=production-or-controlled-runtime-confirmed`
  - `PHASE_3S_BACKUP_RISK_ACCEPTED=OWNER_ACCEPTS_CURRENT_RISK`
  - owner-selected `PHASE_3S_SMOKE_MARKET`
  - owner-selected `PHASE_3S_SMOKE_SYMBOL`
- Dry-run/mock validation passed.
- The dry-run path uses a mock Supabase client and does not import the live Supabase admin helper.
- The harness validates normalized cache-key creation, success write, readback, fresh classification, stale classification, sanitized failure metadata update, and cleanup/delete behavior.
- The live path includes a cleanup/restore strategy for the selected smoke cache key.
- No live Supabase query or write was executed by Codex.
- No SQL was executed by Codex.
- No Supabase MCP database query was run by Codex.
- No Supabase project listing was run.
- No Supabase connection was attempted by Codex.
- No production DB was touched by Codex.
- No live KIS call was run by Codex.
- No UI live quote wiring was implemented.
- No Vercel environment value was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No root `README.md` change was made.
- No migration file change was made.
- No production SQL pack file change was made.
- No project refs, project URLs, connection strings, DB passwords, service-role keys, anon keys, JWT secrets, tokens, screenshots, or secret-bearing outputs were recorded.
- Validation passed:
  - `npm run smoke:persistent-quote-cache-live:dry`
  - `node scripts/smoke_persistent_quote_cache_adapter.mjs`
  - `node scripts/smoke_quote_cache_policy.mjs`
  - `node scripts/smoke_market_quote_route_disabled.mjs`
  - `npm run check:provider-boundaries`
  - `npx tsc --noEmit`
  - `npm run build`
- Browser/static output scans found no provider secret markers or server-only markers.
- Recommended next action: owner manually runs the live smoke only after confirming runtime target and risk acceptance, then records sanitized pass/fail results in a separate phase.

## Phase 3R - 2026-06-21

### Persistent Quote Cache Adapter

- Created `docs/planning/phase_3r_persistent_quote_cache_adapter_result_v0.1.md`.
- Implemented a server-only persistent Supabase quote cache adapter for `market_quote_cache`.
- Kept the adapter disabled by default.
- Preserved the in-memory quote cache as the default backend.
- Added the non-secret `QUOTE_CACHE_BACKEND` runtime switch; only the explicit value `supabase` selects the persistent adapter.
- Added normalized cache-key handling using `quote:{market}:{UPPER_SYMBOL}`.
- Added persistent cache read support with fresh, stale-but-usable, expired, and miss classification.
- Added success upsert support for normalized public quote snapshots only.
- Added sanitized refresh-failure metadata write support for existing cache rows.
- Reused the existing server-only Supabase admin helper without printing or resolving environment values during validation.
- Adjusted the Supabase admin helper so mock-only Node validation can import server code without resolving env values at module load time.
- Updated the quote service to use the configured cache backend while preserving default memory behavior.
- Strengthened provider/server boundary validation against client imports of server modules and the persistent quote cache adapter.
- Added `scripts/smoke_persistent_quote_cache_adapter.mjs`.
- Added `npm run smoke:persistent-quote-cache`.
- Raw KIS payloads are not persisted.
- Provider headers, authorization headers, app keys, tokens, account numbers, raw errors, stack traces, DB URLs, connection strings, user IDs, portfolio IDs, and position IDs are not persisted.
- No UI live quote wiring was implemented.
- No live Supabase query or write was executed by Codex.
- No Supabase MCP database query was run by Codex.
- No Supabase project listing was run.
- No Supabase connection was attempted by Codex.
- No SQL was executed by Codex.
- No production DB was touched by Codex.
- No live KIS call was run by Codex.
- No Vercel environment value was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No root `README.md` change was made.
- No migration file change was made.
- No production SQL pack file change was made.
- No project refs, project URLs, connection strings, DB passwords, service-role keys, anon keys, JWT secrets, tokens, screenshots, or secret-bearing outputs were recorded.
- Validation passed:
  - `node scripts/smoke_persistent_quote_cache_adapter.mjs`
  - `node scripts/smoke_quote_cache_policy.mjs`
  - `node scripts/smoke_market_quote_route_disabled.mjs`
  - `npm run check:provider-boundaries`
  - `npx tsc --noEmit`
  - `npm run build`
- Vercel output artifacts were generated: `.vercel/output/config.json`, `.vercel/output/functions/_render.func`, and `.vercel/output/static`.
- Browser/static output scans found no provider secret markers or server-only markers.
- Recommended next action: run a separate owner-approved persistent adapter enablement/API smoke before any UI live quote wiring.

## Phase 3Q - 2026-06-21

### Production Migration Execution Result

- Created `docs/planning/phase_3q_production_migration_execution_result_v0.1.md`.
- Owner manually executed the Phase 3P production Dashboard SQL script pack in Supabase SQL Editor.
- Owner reported production target confirmation passed.
- Owner reported disposable/non-production target was not selected.
- Owner reported the production project is on Free Plan.
- Owner reported dashboard-native scheduled backup, PITR, or snapshot was unavailable.
- Owner explicitly accepted the backup-unavailable risk before running Script 02.
- Script 01 production prechecks passed.
- Script 01 final row `safe_to_apply_phase_3m_migration` passed.
- Script 02 Phase 3M migration application passed.
- Script 03 post-migration validation passed.
- Script 03 RLS/grants preserved passed.
- Script 04 cleanup-none confirmation passed.
- Production DB changed by owner manual execution, not by Codex.
- Rollback or corrective action was not needed according to the owner-provided sanitized result.
- No SQL was executed by Codex.
- No Supabase MCP database query was run by Codex.
- No Supabase project listing was run.
- No Supabase connection was attempted by Codex.
- No Supabase write occurred by Codex.
- No production DB was touched by Codex.
- No project refs, project URLs, connection strings, DB passwords, service-role keys, anon keys, JWT secrets, tokens, screenshots, or secret-bearing outputs were recorded.
- No app source files changed.
- No migration files changed.
- No production SQL pack files changed.
- No provider behavior changed.
- No UI live quote wiring was implemented.
- No persistent cache adapter was implemented.
- No Vercel environment value was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- Ignored `.env*` contents were not read.
- Build was skipped because Phase 3Q changed documentation only.
- Recommended next action: approve the next implementation phase only after owner review, with persistent cache adapter work kept separate.

## Phase 3P - 2026-06-21

### Production Dashboard SQL Execution Pack

- Created `docs/planning/phase_3p_production_dashboard_sql_execution_pack_v0.1.md`.
- Created production SQL pack files under `docs/planning/sql_production/`.
- Prepared production Dashboard SQL precheck and execution pack for `supabase/migrations/20260621_market_quote_cache_lifecycle_columns.sql`.
- Created read-only production precheck script with stop-before-migration pass/fail rows and `safe_to_apply_phase_3m_migration`.
- Created production migration script whose executable body matches the disposable-validated Phase 3M migration after safety comments.
- Created read-only post-migration validation script with schema, constraint, index, backfill, RLS, grant, public-read, service-role, and overall validation rows.
- Created no-write production cleanup confirmation script.
- Production migration remains manual owner action and is not considered executed by this phase.
- No SQL was executed by Codex.
- No Supabase MCP database query was run.
- No Supabase project listing was run.
- No Supabase connection was attempted by Codex.
- No Supabase write occurred by Codex.
- No production DB was touched by Codex.
- No project refs, project URLs, connection strings, DB passwords, service-role keys, anon keys, JWT secrets, tokens, screenshots, or secret-bearing outputs were recorded.
- No app source files changed.
- No migration files changed.
- No Phase 3N.6 validation SQL files changed.
- No provider behavior changed.
- No UI live quote wiring was implemented.
- No persistent cache adapter was implemented.
- No Vercel environment value was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- Ignored `.env*` contents were not read.
- Build was skipped because Phase 3P changed documentation and planning SQL files only.
- Recommended next action: owner reviews the pack, confirms backup/rollback and production target, then manually executes only if explicitly approved.

## Phase 3O - 2026-06-21

### Production Migration Approval Plan

- Created `docs/planning/phase_3o_production_migration_approval_execution_plan_v0.1.md`.
- Prepared a production migration approval and execution plan for `supabase/migrations/20260621_market_quote_cache_lifecycle_columns.sql`.
- Recorded that Phase 3N.7 disposable validation passed based on owner-provided sanitized results.
- Defined production target separation checks using only non-secret labels.
- Defined production readiness checklist, backup/rollback policy, precheck plan, execution sequence, post-migration validation plan, abort conditions, owner approval wording, and sanitized future result template.
- Production migration remains blocked until a separate explicit owner approval.
- No SQL was executed.
- No Supabase MCP database query was run.
- No Supabase project listing was run.
- No Supabase connection was attempted by Codex.
- No Supabase write occurred by Codex.
- No production DB was touched.
- No project refs, project URLs, connection strings, DB passwords, service-role keys, anon keys, JWT secrets, tokens, screenshots, or secret-bearing outputs were recorded.
- No app source files changed.
- No migration files changed.
- No planning SQL files changed.
- No provider behavior changed.
- No UI live quote wiring was implemented.
- No persistent cache adapter was implemented.
- No Vercel environment value was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- Ignored `.env*` contents were not read.
- Build was skipped because Phase 3O changed documentation only.
- Recommended next action: owner review and separate Phase 3P approval only if production execution should proceed.

## Phase 3N.7 - 2026-06-21

### Dashboard SQL Validation Result

- Created `docs/planning/phase_3n7_dashboard_sql_validation_result_v0.1.md`.
- Owner manually ran the Phase 3N.6 SQL pack in the disposable Supabase Dashboard SQL Editor.
- Owner reported all sanitized validation results passed.
- Target category remains `disposable-remote-approved`.
- Phase 3M migration disposable validation is recorded as passed based on owner-provided sanitized results.
- Validated migration: `supabase/migrations/20260621_market_quote_cache_lifecycle_columns.sql`.
- Step 01 baseline/fixture SQL passed.
- Synthetic rows insertion passed.
- Step 02 Phase 3M migration application passed.
- Step 03 schema validation passed.
- Step 03 constraint/index validation passed.
- Step 03 backfill validation passed.
- Step 03 RLS/grant validation passed.
- Step 04 negative validation passed.
- Step 05 cleanup passed.
- No SQL was executed by Codex.
- No Supabase MCP database query was run by Codex.
- No Supabase project listing was run.
- No Supabase connection was attempted by Codex.
- No Supabase write occurred by Codex.
- No production DB was touched.
- No project refs, project URLs, connection strings, DB passwords, service-role keys, anon keys, JWT secrets, tokens, screenshots, or secret-bearing outputs were recorded.
- No app source files changed.
- No migration files changed.
- No provider behavior changed.
- No UI live quote wiring was implemented.
- No persistent cache adapter was implemented.
- No Vercel environment value was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- Ignored `.env*` contents were not read.
- Build was skipped because Phase 3N.7 changed documentation only.
- Recommended next action: prepare a separate production migration approval and execution plan, or proceed to the next implementation phase only after owner approval.

## Phase 3N.6 - 2026-06-21

### Dashboard SQL Validation Pack

- Created `docs/planning/phase_3n6_dashboard_sql_validation_pack_v0.1.md`.
- Created dashboard SQL validation scripts under `docs/planning/sql_validation/`.
- Prepared a manual Supabase Dashboard SQL Editor validation pack for `supabase/migrations/20260621_market_quote_cache_lifecycle_columns.sql`.
- Included baseline table detection and instructions to run `supabase/migrations/20260615_rebuild_schema_v0_1.sql` manually if the disposable project lacks the baseline table.
- Included synthetic public-safe quote cache fixtures for `KR` `005930` and `KR` `000660`.
- Included a copy-ready Phase 3M migration script without modifying the migration file.
- Included schema, constraint, index, backfill, RLS, grant, and negative validation queries.
- Included cleanup SQL limited to the synthetic validation rows.
- No SQL was executed by Codex.
- No Supabase MCP database query was run.
- No Supabase project listing was run.
- No Supabase connection was attempted by Codex.
- No Supabase write occurred by Codex.
- No production DB was touched.
- No project refs, project URLs, connection strings, DB passwords, service-role keys, anon keys, JWT secrets, tokens, or secret-bearing outputs were recorded.
- No app source files changed.
- No migration files changed.
- No provider behavior changed.
- No UI live quote wiring was implemented.
- No persistent cache adapter was implemented.
- No Vercel environment value was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- Ignored `.env*` contents were not read.
- Build was skipped because Phase 3N.6 changed documentation and planning SQL files only.
- Recommended next action: owner manually runs the validation pack in the disposable Supabase Dashboard SQL Editor and returns sanitized pass/fail results only.

## Phase 3N.5 - 2026-06-21

### Runtime Target SQL Validation Attempt

- Created `docs/planning/phase_3n5_runtime_target_sql_validation_result_v0.1.md`.
- Owner approved runtime-only use of the already-configured disposable Supabase project identifier solely as an MCP tool target argument.
- Target category remains `disposable-remote-approved`.
- Stopped before SQL because no runtime-only target handle is available to Codex in the callable context without recording or discovering the identifier.
- Supabase projects were not listed.
- Migration file intended for validation: `supabase/migrations/20260621_market_quote_cache_lifecycle_columns.sql`.
- Baseline migration file: `supabase/migrations/20260615_rebuild_schema_v0_1.sql`.
- No project refs, project URLs, connection strings, DB passwords, service-role keys, anon keys, JWT secrets, tokens, or secret-bearing outputs were recorded.
- No SQL was run.
- No migration was applied.
- No Supabase MCP database query was run.
- No Supabase write occurred.
- No production DB was touched.
- No app source files changed.
- No migration files changed.
- No provider behavior changed.
- No UI live quote wiring was implemented.
- No persistent cache adapter was implemented.
- No Vercel environment value was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- Ignored `.env*` contents were not read.
- Build was skipped because Phase 3N.5 changed documentation only.
- Recommended next action: adjust the secure MCP setup so SQL tools can use the scoped disposable target without Codex supplying a visible target identifier value, then rerun Phase 3N.5.

## Phase 3N.4 - 2026-06-21

### Disposable Supabase SQL Validation Attempt

- Created `docs/planning/phase_3n4_disposable_supabase_sql_validation_result_v0.1.md`.
- Owner designated the target category as `disposable-remote-approved`.
- SQL execution was approved only against the already-scoped disposable Supabase MCP target.
- Stopped before SQL because the callable Supabase MCP database tools still require an explicit target identifier argument.
- Project listing was not run because project references must not be recorded.
- Migration file intended for validation: `supabase/migrations/20260621_market_quote_cache_lifecycle_columns.sql`.
- Baseline migration file: `supabase/migrations/20260615_rebuild_schema_v0_1.sql`.
- No project refs, project URLs, connection strings, DB passwords, service-role keys, anon keys, JWT secrets, tokens, or secret-bearing outputs were recorded.
- No SQL was run.
- No migration was applied.
- No Supabase MCP database query was run.
- No Supabase write occurred.
- No production DB was touched.
- No app source files changed.
- No migration files changed.
- No provider behavior changed.
- No UI live quote wiring was implemented.
- No persistent cache adapter was implemented.
- No Vercel environment value was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- Ignored `.env*` contents were not read.
- Build was skipped because Phase 3N.4 changed documentation only.
- Recommended next action: adjust the secure MCP setup so Codex can use the already-scoped disposable target without providing or recording a target identifier, then rerun Phase 3N.4.

## Phase 3N.3A - 2026-06-21

### Supabase Target Status Check

- Created `docs/planning/phase_3n3a_supabase_target_status_check_v0.1.md`.
- Checked whether a pre-approved disposable or controlled non-production Supabase MCP target is already designated.
- Used only non-secret local and tool-surface evidence.
- Recorded target-status result as `not-designated`.
- Confirmed no default selected target is visible in the current tool interface.
- Confirmed the available Supabase MCP database tools require an explicit target identifier for execution.
- Supabase projects were not listed.
- No project refs, URLs, connection strings, passwords, keys, JWT secrets, tokens, or secret-bearing outputs were recorded.
- No SQL was run.
- No migration was applied.
- No Supabase MCP database query was run.
- No Supabase write occurred.
- No production DB was touched.
- No app source files changed.
- No migration files changed.
- No provider behavior changed.
- No UI live quote wiring was implemented.
- No Vercel environment value was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- Ignored `.env*` contents were not read.
- Build was skipped because Phase 3N.3A changed documentation only.
- Recommended next action: owner must designate a disposable or controlled non-production target through a secure tool context before Phase 3N.4.

## Phase 3N.3 - 2026-06-21

### Disposable Supabase MCP Target Designation Path

- Created `docs/planning/phase_3n3_disposable_supabase_target_designation_result_v0.1.md`.
- Documented the owner option 2 decision to use a pre-approved disposable Supabase target through Supabase MCP.
- Confirmed Phase 3N.3 is target designation and safety-gate preparation only.
- Recorded target category as `blocked-before-target-designation`.
- Supabase MCP capability was available in the session, but no pre-approved disposable target was available through a non-recorded secure context.
- Supabase projects were not listed because project listing could expose or record project references.
- No project refs, project URLs, connection strings, DB passwords, service-role keys, anon keys, JWT secrets, tokens, or secret-bearing outputs were recorded.
- No SQL was run.
- No migration was applied.
- No Supabase MCP database query was run.
- No Supabase write occurred.
- No production DB was touched.
- No app source files changed.
- No migration files changed.
- No provider behavior changed.
- No UI live quote wiring was implemented.
- No persistent cache adapter was implemented.
- No Vercel environment value was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- Ignored `.env*` contents were not read.
- Build was skipped because Phase 3N.3 changed documentation only.
- Recommended next action: designate a disposable target through a secure non-recorded tool context, then start Phase 3N.4 for SQL validation with a separate approval gate.

## Phase 3N.2 - 2026-06-21

### Disposable Supabase SQL Validation Attempt

- Created `docs/planning/phase_3n2_disposable_supabase_sql_validation_result_v0.1.md`.
- Owner approved SQL execution for disposable or explicitly controlled non-production validation only.
- Stopped before SQL because no disposable or explicitly controlled non-production target could be confirmed with non-secret evidence.
- Target category recorded as `blocked-before-target-selection`.
- Migration file intended for validation: `supabase/migrations/20260621_market_quote_cache_lifecycle_columns.sql`.
- Baseline migration file: `supabase/migrations/20260615_rebuild_schema_v0_1.sql`.
- Supabase MCP execution tools were available but were not used for project listing, SQL execution, or migration application.
- Supabase projects were not listed because project discovery that records project references was not approved.
- No production DB was touched.
- No migration was applied.
- No SQL was run.
- No Supabase CLI was run.
- No psql command was run.
- No Supabase MCP database query or migration command was run.
- No Supabase connection or write occurred.
- No app source files changed.
- No migration files changed.
- No provider behavior changed.
- No UI live quote wiring was implemented.
- No Vercel environment value was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No secret values were requested or recorded.
- Ignored `.env*` contents were not read.
- Build was skipped because Phase 3N.2 changed documentation only.
- Recommended next action: establish a disposable validation target through a non-secret secure flow, then rerun Phase 3N.2.

## Phase 3N.1 - 2026-06-21

### Disposable Supabase Migration Validation Attempt

- Created `docs/planning/phase_3n1_disposable_supabase_validation_result_v0.1.md`.
- Attempted to start disposable validation for `supabase/migrations/20260621_market_quote_cache_lifecycle_columns.sql`.
- Stopped before SQL because the hard safety gate could not be satisfied with non-secret evidence.
- Environment category recorded as `blocked-before-target-selection`.
- Confirmed local `docker` is unavailable.
- Confirmed local `psql` is unavailable.
- Confirmed Supabase CLI is unavailable on PATH.
- Confirmed a Supabase MCP execution surface is available but was not used because no non-secret disposable target identifier or environment label was available.
- Did not list Supabase projects because that could expose or record project references.
- No production DB was touched.
- No migration was applied.
- No SQL was run.
- No Supabase CLI was run.
- No psql command was run.
- No Supabase MCP database query or migration command was run.
- No Supabase connection or write occurred.
- No app source files changed.
- No migration files changed.
- No provider behavior changed.
- No UI live quote wiring was implemented.
- No Vercel environment value was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No secret values were requested or recorded.
- Ignored `.env*` contents were not read.
- Build was skipped because Phase 3N.1 changed documentation only.
- Recommended next action: establish a disposable validation target through a non-secret/secure channel, then rerun Phase 3N.1.

## Phase 3N - 2026-06-21

### Disposable Supabase Validation Plan

- Created `docs/planning/phase_3n_disposable_supabase_validation_plan_v0.1.md`.
- Planned disposable or controlled Supabase validation for `supabase/migrations/20260621_market_quote_cache_lifecycle_columns.sql`.
- Documented Phase 3M migration baseline, lifecycle columns, deterministic backfill, constraints, indexes, and unchanged RLS/grant boundary.
- Defined disposable validation goals for migration application, schema inspection, RLS/grant checks, public-read safety, negative tests, and evidence capture.
- Defined disposable environment requirements and allowed synthetic public quote test data.
- Documented future precheck plan, migration application plan, negative validation plan, evidence policy, rollback/reset policy, pass criteria, and fail criteria.
- Documented that production DB must not be used for first execution.
- Added a minimal Korean owner review checklist.
- Disposable validation plan only; no migration was applied.
- No SQL was run.
- No Supabase CLI was run.
- No psql command was run.
- No Supabase connection or write occurred.
- No app source files changed.
- No provider behavior changed.
- No KIS route behavior changed.
- No UI live quote wiring was implemented.
- No Vercel environment value was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No secret values were requested or recorded.
- Ignored `.env*` contents were not read.
- Build was skipped because Phase 3N changed documentation only.
- Recommended next action: owner review, then execute disposable validation only after an explicit approval gate.

## Phase 3M - 2026-06-21

### Persistent Quote Cache Migration File Draft

- Added `supabase/migrations/20260621_market_quote_cache_lifecycle_columns.sql`.
- Converted the Phase 3L reviewed SQL draft into one migration file only.
- Preserved the existing `public.market_quote_cache` table.
- Added lifecycle and metadata columns for future persistent quote cache writes: `cache_key`, `provider`, `source`, `fresh_until`, `stale_until`, `schema_version`, `last_refresh_status`, `last_error_code`, and `updated_at`.
- Added deterministic backfill from existing `symbol`, `market`, `cached_at`, and `expires_at` fields.
- Added guarded checks for normalized duplicate cache identifiers and lifecycle ordering.
- Added idempotent constraint creation through `DO` blocks.
- Added indexes for `fresh_until`, `stale_until`, and `(market, symbol, provider, source)`.
- Preserved existing public-read and service-role-write intent.
- Did not add anon or authenticated write grants.
- Did not change RLS policies.
- Created `docs/planning/phase_3m_persistent_quote_cache_migration_file_result_v0.1.md`.
- Updated the owner manual smoke checklist with a minimal Phase 3M owner review section.
- Migration file drafted only; it was not applied.
- No SQL was run.
- No Supabase CLI was run.
- No psql command was run.
- No Supabase connection or write occurred.
- No app source files changed.
- No persistent cache adapter was implemented.
- No provider behavior changed.
- No UI live quote wiring was implemented.
- No Vercel environment value was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No secret values were requested or recorded.
- Ignored `.env*` contents were not read.
- Build was skipped because Phase 3M changed only a migration file and planning documentation.
- Recommended next action: owner review, then disposable Supabase validation only after an explicit approval gate.

## Phase 3L - 2026-06-21

### Persistent Quote Cache Migration Review

- Created `docs/planning/phase_3l_persistent_quote_cache_migration_review_v0.1.md`.
- Reviewed the existing `market_quote_cache` migration shape against the Phase 3K persistent quote cache policy.
- Inventoried the current migration files and confirmed `supabase/migrations/20260615_rebuild_schema_v0_1.sql` is the only migration file.
- Documented current `market_quote_cache` columns: `id`, `symbol`, `market`, `quote_json`, `cached_at`, and `expires_at`.
- Documented current constraints, indexes, RLS enablement, grants, and public read policy.
- Assessed that the current schema can support a minimal persistent adapter by storing normalized `QuoteSnapshot` and lifecycle metadata in `quote_json`.
- Documented limitations of relying only on `quote_json`, `cached_at`, and `expires_at`.
- Classified required Phase 3M decisions, recommended production hardening changes, optional future improvements, and not-recommended storage patterns.
- Documented data safety rules forbidding raw KIS payloads, headers, keys, tokens, authorization headers, account numbers, raw errors, stack traces, connection strings, DB passwords, user IDs, portfolio IDs, and position IDs.
- Reviewed RLS, Data API grant, public read, and service-role write boundaries.
- Added a non-executable SQL draft inside the planning document only.
- Added future roadmap and approval gates for migration, Supabase writes, provider live calls, UI wiring, Vercel env mutation, and deployment.
- Added a minimal Korean owner review checklist.
- Review/planning only; no migration file was added.
- No SQL was run.
- No Supabase CLI was run.
- No psql command was run.
- No Supabase connection or write occurred.
- No app source files changed.
- No provider behavior changed.
- No UI live quote wiring was implemented.
- No Vercel env value was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No secret values were requested or recorded.
- Ignored `.env*` contents were not read.
- Build was skipped because Phase 3L changed documentation only.
- Recommended next action: owner review, then approve Phase 3M only if disabled persistent cache adapter work should begin.

## Phase 3K - 2026-06-21

### Persistent Quote Cache Policy Planning

- Created `docs/planning/phase_3k_persistent_quote_cache_policy_plan_v0.1.md`.
- Planned the future transition from Phase 3J in-memory quote cache to a Supabase-backed persistent quote cache.
- Documented the current Phase 3J baseline: module-local `Map`, normalized `QuoteSnapshot` only, 15-second fresh TTL, 120-second stale TTL, stale fallback on provider failure, no DB persistence, and no UI wiring.
- Documented persistent cache goals for reduced KIS calls, normalized public quote payloads, stale fallback, server-only writes, and approval-gated production activation.
- Documented proposed `market_quote_cache` table usage using the existing planned table and optional future columns.
- Documented data that may be persisted and data that must never be persisted, including raw KIS payloads, headers, keys, tokens, account numbers, raw errors, and stack traces.
- Documented RLS, Data API grant, and service-role write boundaries.
- Documented TTL, fresh, stale, expired, invalidation, cleanup, refresh deduplication, and provider quota protection policy.
- Documented future API response metadata policy and security/privacy requirements.
- Documented relationship to Market, Portfolio, Chart AI, Treemap, OpenDART, and future US stock support.
- Added a future implementation roadmap with approval gates for migration review, Supabase write code, disposable validation, UI live-data wiring, production env, and deployment.
- Added a minimal Korean owner review checklist.
- Planning only; no DB migration was added.
- No SQL was run.
- No Supabase CLI was run.
- No psql command was run.
- No Supabase connection was attempted.
- No Supabase write or cache write was implemented.
- No persistent cache implementation was added.
- No UI live quote wiring was added.
- No provider behavior changed.
- No Vercel env value was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No secret values were requested or recorded.
- Ignored `.env*` contents were not read.
- Build was skipped because Phase 3K changed documentation only.
- Recommended next action: owner review, then approve Phase 3L only if persistent quote cache migration review should begin.

## Phase 3J - 2026-06-21

### Quote Cache Stale Fallback Policy

- Added server-only in-memory quote cache for the local/dev KIS quote route.
- Cached normalized `QuoteSnapshot` objects only.
- Added cache key normalization such as `quote:KR:005930`.
- Added local/dev TTL policy: 15-second fresh window and 120-second stale window.
- Added fresh cache hit behavior with browser-safe fallback metadata.
- Added stale-but-usable fallback behavior when provider refresh fails inside the stale window.
- Added expired cache behavior that removes expired entries and returns sanitized provider errors when no usable cache exists.
- Preserved existing local/dev provider feature gate and production-disabled provider execution.
- Preserved `GET /api/market/quote` response shape with `{ ok, data, fallback }`.
- Added `src/lib/server/marketData/quoteCache.ts`.
- Added `scripts/smoke_quote_cache_policy.mjs`.
- Updated disabled route smoke coverage for the new cache module.
- Added Phase 3J result documentation and a minimal Korean owner review checklist.
- No raw KIS payload was cached.
- No token, key, app secret, authorization header, account number, raw headers, or raw errors were cached in quote cache.
- No Supabase cache write was implemented.
- No DB migration was added.
- No SQL was run.
- No Supabase CLI was run.
- No psql command was run.
- No UI live quote wiring was added.
- No Vercel env value was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No order, account, trading, balance, holdings, or WebSocket API was implemented.
- No OpenDART, OpenAI, Gemini, real AI analysis, visitor count, ad-event tracking, scraping, remote discovery, external asset download, FX conversion, valuation analytics, performance analytics, or provider autocomplete was implemented.
- No secret values were requested or recorded.
- Ignored `.env*` contents were not read.
- `node scripts/smoke_quote_cache_policy.mjs`: passed.
- `node scripts/smoke_market_quote_route_disabled.mjs`: passed.
- `npm run check:provider-boundaries`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- Recommended next action: optional owner live cache smoke, then approve the next provider/cache/UI phase only after reviewing scope.

## Phase 3I - 2026-06-21

### KIS Domestic Quote Read Route

- Added KIS domestic stock quote read integration behind `GET /api/market/quote`.
- Kept the route local/dev-only and guarded by `KIS_ENABLE_LIVE_QUOTES`.
- Added production-disabled KIS quote readiness handling.
- Added server-only KIS token request and domestic quote request code.
- Added module-local in-memory KIS token cache only.
- Added normalized `QuoteSnapshot` output for verified KIS quote fields.
- Added sanitized provider error responses for disabled config, invalid input, unsupported markets, token failure, provider failure, and rate-limit paths.
- Added `KIS_ENABLE_LIVE_QUOTES` to the server-only provider env registry as a name only.
- Updated the market quote service wrapper for KR quote reads and unsupported-market responses.
- Updated provider-boundary validation so `fetch` is allowed only in the KIS provider module.
- Added disabled-mode route smoke script that does not require credentials or make a live KIS call.
- Added Phase 3I result documentation and Korean owner review checklist.
- Market, Portfolio, Chart AI, Home, and Lab UI remain disconnected from `/api/market/quote`.
- No order, account, trading, balance, holdings, or WebSocket API was implemented.
- No DB migration was added.
- No direct SQL was run.
- No Supabase CLI was run.
- No psql command was run.
- No Supabase write or cache write was implemented.
- No Auth user was created.
- No production authenticated write validation was performed by Codex.
- No Portfolio write endpoint was called by Codex.
- No Vercel env value was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No OpenDART, OpenAI, Gemini, real AI analysis, visitor count, ad-event tracking, scraping, remote discovery, external asset download, FX conversion, valuation analytics, performance analytics, or provider autocomplete was implemented.
- No secret values were requested or recorded.
- Ignored `.env*` contents were not read.
- Official KIS Developers and official Korea Investment Open API GitHub samples were verified before implementation.
- `npm run check:provider-boundaries`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- `node scripts/smoke_market_quote_route_disabled.mjs`: passed.
- Disabled/config smoke returned sanitized `503 CONFIG_MISSING`.
- Invalid KR symbol smoke returned sanitized `400 VALIDATION_FAILED`.
- Unsupported US quote smoke returned sanitized `404 SYMBOL_UNSUPPORTED`.
- Live KIS smoke was not run by Codex.
- Recommended next action: owner local live smoke for `/api/market/quote?market=KR&symbol=005930` with private local env values, then decide the next approved provider phase.

## Phase 3H - 2026-06-21

### Server-only Provider Adapter Scaffolding

- Added server-only provider type contracts in `src/lib/server/providers/types.ts`.
- Added provider error utilities in `src/lib/server/providers/providerErrors.ts`.
- Added a server-only runtime guard in `src/lib/server/providers/serverOnly.ts`.
- Added env name registry metadata in `src/lib/server/providers/providerEnv.ts`, names only.
- Added KIS adapter shell in `src/lib/server/providers/kisClient.ts` with no external calls.
- Added OpenDART adapter shell in `src/lib/server/providers/openDartClient.ts` with no external calls.
- Added AI provider shell in `src/lib/server/providers/aiProviderClient.ts` with no external calls.
- Added market data readiness shells for quotes, charts, and security master.
- Added Portfolio valuation readiness shell in `src/lib/server/portfolioValuation.ts`.
- Added Chart AI context builder shell in `src/lib/server/chartAi/contextBuilder.ts`.
- Added `scripts/check_server_only_provider_boundaries.mjs`.
- Added `npm run check:provider-boundaries`.
- Documented that `src/lib/server/portfolioValuation.ts` is used because existing `src/lib/server/portfolio.ts` blocks the planned directory path.
- Added Phase 3H owner review checklist.
- Server-only provider adapter scaffolding only; no provider call was implemented.
- No real AI analysis was implemented.
- No real market-data fetching was implemented.
- No DB migration was added.
- No SQL was run.
- No Supabase CLI was run.
- No psql command was run.
- No Auth user was created.
- No production authenticated write validation was performed by Codex.
- No Portfolio write endpoint was called by Codex.
- No Supabase connection was attempted by Codex validation.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No visitor count was implemented.
- No ad-event tracking was implemented.
- No secrets were requested or recorded.
- Recommended next action: owner review of Phase 3H, then approve Phase 3I only if KIS quote read integration should begin.

## Phase 3G - 2026-06-20

### Provider/Data Readiness Planning

- Created `docs/planning/phase_3g_provider_data_readiness_plan_v0.1.md`.
- Documented current Home, Market, Chart AI, Lab, and Portfolio architecture status.
- Documented provider roles for KIS, OpenDART, OpenAI/Gemini, Supabase, and optional future providers.
- Defined server-only provider boundary principles and forbidden browser import rules.
- Planned conceptual future API routes for market quote, chart, treemap, Portfolio valuation, and Chart AI analysis.
- Defined conceptual data contracts for security identity, security master, quote snapshots, candles, chart series, Treemap constituents, Momentum / Trend points, Portfolio valuation, Chart AI context packages, provider cache records, provider errors, and fallback states.
- Aligned cache policy with existing planned tables: `market_symbols`, `market_quote_cache`, `market_chart_cache`, `chart_ai_cache`, and `heatmap_cache`.
- Documented Portfolio valuation readiness, aggregate `전체 보기` valuation behavior, and placeholder rules.
- Documented Market dashboard readiness for KOSPI200, KOSDAQ150, S&P500, NASDAQ100, and My Portfolio.
- Documented Chart AI readiness, context-builder design, usage guard preservation, and output restrictions.
- Documented environment variable names only, without values.
- Documented sanitized error taxonomy, Korean UI error copy guidance, and logging restrictions.
- Added an approval-gated roadmap from Phase 3H through Phase 3O.
- Added a Phase 3G owner review checklist to the manual smoke checklist document.
- Provider/data readiness planning only; no provider call was implemented.
- No real AI analysis was implemented.
- No real market-data fetching was implemented.
- No DB migration was added.
- No SQL was run.
- No Supabase CLI was run.
- No psql command was run.
- No Auth user was created.
- No production authenticated write validation was performed by Codex.
- No Portfolio write endpoint was called by Codex.
- No Supabase connection was attempted by Codex validation.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No visitor count was implemented.
- No ad-event tracking was implemented.
- No secrets were requested or recorded.
- Recommended next action: owner review of the Phase 3G plan, then approve Phase 3H only if server-only scaffolding should begin.

## Phase 3F.4 - 2026-06-20

### Portfolio Page Aggregate And Market Viewport Fit

- Added `/portfolio` synthetic `전체 보기` as a browser UI state option above real portfolios.
- Used safe synthetic id `__all_portfolios__` only in client state, not as a mutation target.
- Merged Portfolio page positions by stable market and symbol identity.
- Summed duplicate quantities and calculated weighted average buy price for aggregate rows.
- Added source portfolio names to aggregate rows.
- Kept aggregate rows read-only with no edit/delete buttons.
- Hid and guarded add-position behavior while synthetic aggregate mode is selected.
- Preserved individual portfolio selection, portfolio CRUD, and position CRUD.
- Preserved placeholder valuation behavior; no live market value, FX conversion, or fake valuation was added.
- Tuned Market Treemap single-view height and card spacing for better PC viewport fit.
- Tuned Momentum / Trend SVG viewBox and plot rectangle to reduce inner whitespace and enlarge the usable plot area.
- Preserved the `d3-hierarchy` Treemap engine.
- Preserved display-name-first chart labels and ticker metadata.
- Preserved Market view modes, fullscreen, and browser-only PNG export.
- Preserved `/market` primary route and `/heatmap` backward-compatible route.
- Preserved Home sticky ad, Chart AI chart-first UX, Portfolio behavior, Header auth stability, and `Today: 000`.
- No provider call was implemented.
- No real AI analysis was implemented.
- No real market-data fetching was implemented.
- No Trading Economics, ETFshopping, Hankyung, or reference-site scraping/fetching was implemented.
- No DB migration was added.
- No direct SQL, Supabase CLI, or psql command was run.
- No Auth user was created.
- No production authenticated write validation was performed by Codex.
- No Portfolio write endpoint was called by Codex.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No real visitor count or ad-event tracking was implemented.
- No secrets were requested or recorded.
- Recommended next action: run the Phase 3F.4 owner manual smoke in Chrome.

## Phase 3F.3 - 2026-06-20

### Portfolio Aggregate View And Display-Name Chart Labels

- Added My Portfolio `전체 보기` in the Market dashboard sample model.
- Added individual sample portfolio scope selection for `Core Growth` and `Income Balance`.
- Added aggregate portfolio logic for the sample data path.
- Merged duplicate securities by market + symbol.
- Used deterministic sample value for Treemap area sizing and weighted merged return/momentum/trend values by sample value.
- Switched Treemap visible labels from ticker-first to display-name-first.
- Switched Momentum / Trend visible labels from ticker-first to display-name-first.
- Preserved ticker/symbol in SVG title, aria label, internal metadata, and export filenames.
- Added display-name support to sample constituents and Korean display names for selected Korean sample securities.
- Preserved the `d3-hierarchy` Treemap engine.
- Preserved `Treemap`, `Momentum / Trend`, and `같이 보기` view modes.
- Preserved fullscreen and browser-only PNG export.
- Preserved Home sticky ad behavior.
- Preserved Chart AI chart-first UX and selected-security prefill.
- Preserved Portfolio CRUD, Header auth stability, and `Today: 000`.
- No provider call was implemented.
- No real AI analysis was implemented.
- No real market-data fetching was implemented.
- No reference-site scraping/fetching was implemented.
- No DB migration was added.
- No direct SQL, Supabase CLI, or `psql` was run.
- No Auth user was created.
- No production authenticated write validation was performed by Codex.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No secrets were requested or recorded.
- Recommended next action: run the Phase 3F.3 owner manual smoke in Chrome.

## Phase 3F.2 - 2026-06-20

### Hierarchy Treemap Engine And Market View Modes

- Replaced the failed local squarify helper with a hierarchy-based squarified Treemap layout.
- Added `d3-hierarchy` as a focused dependency.
- Used `hierarchy`, `treemap`, and `treemapSquarify` only in `src/components/MarketShell.astro`.
- Improved true nested rectangle composition through root -> sector -> constituent hierarchy.
- Preserved value-based area mapping from provider-free sample values.
- Preserved sector grouping with sector parent nodes and constituent leaf nodes.
- Preserved market-style return color direction: positive red, negative blue, neutral gray.
- Added Market view-mode selector:
  - `Treemap`
  - `Momentum / Trend`
  - `같이 보기`
- Made `Treemap` mode a full-width Treemap view.
- Made `Momentum / Trend` mode a full-width scatter view.
- Preserved combined view with both charts.
- Preserved `/market` and `/heatmap`.
- Preserved visible `Treemap` terminology.
- Preserved fullscreen and browser-only PNG export.
- Preserved Home sticky ad behavior.
- Preserved Chart AI chart-first UX and selected-security prefill.
- No provider call was implemented.
- No real AI analysis was implemented.
- No real market-data fetching was implemented.
- No reference-site scraping/fetching was implemented.
- No DB migration was added.
- No direct SQL, Supabase CLI, or `psql` was run.
- No Auth user was created.
- No production authenticated write validation was performed by Codex.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No secrets were requested or recorded.
- Recommended next action: run the Phase 3F.2 owner manual smoke in Chrome.

## Phase 3F.1 - 2026-06-20

### Treemap Visual Quality And PC Width Polish

- Corrected the Market Treemap from a column-like layout to a squarified/nested layout.
- Replaced the old slice-only layout helper with a deterministic local `squarify` helper.
- Improved sector grouping by squarifying sector blocks in the full Treemap rectangle.
- Improved value-based tile sizing by squarifying constituents inside each sector block.
- Adjusted sample values for selected large names so the visual hierarchy is clearer while keeping provider-free sample data.
- Improved Treemap tile text rules for large, medium, and small rectangles.
- Replaced the three-chip legend with a granular stepped return scale.
- Preserved return color direction: negative blue, neutral gray, positive red.
- Optimized PC web width with a shared `1500px` page max width.
- Widened Home, Market, nav, and slide-ad content containers while keeping responsive margins.
- Improved Market card ratio so the Treemap is dominant and scatter remains readable.
- Enlarged the normal scatter chart.
- Moved `장기 트렌드` to the bottom-right of the scatter plot rectangle.
- Kept `단기 모멘텀` outside the plot area.
- Preserved Treemap terminology.
- Preserved `/market` and `/heatmap`.
- Preserved fullscreen and browser-only PNG export.
- Preserved Home sticky ad behavior.
- Preserved Chart AI chart-first UX and selected-security prefill.
- No provider call was implemented.
- No real AI analysis was implemented.
- No real market-data fetching was implemented.
- No Trading Economics, ETFshopping, or Hankyung scraping/fetching was implemented.
- No DB migration was added.
- No direct SQL, Supabase CLI, or `psql` was run.
- No Auth user was created.
- No production authenticated write validation was performed by Codex.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No secrets were requested or recorded.
- Recommended next action: run the Phase 3F.1 owner manual smoke in Chrome.

## Phase 3F - 2026-06-20

### Market Treemap Dashboard Redesign

- Rebuilt the Market surface as a Treemap-first dashboard.
- Preserved `/market` as the primary route and `/heatmap` as a backward-compatible alias.
- Replaced visible Market/Home `Heatmap` product language with `Treemap` where safe.
- Added universe controls for `KOSPI200`, `KOSDAQ150`, `S&P500`, `NASDAQ100`, and `My Portfolio`.
- Added period controls for `1일`, `1주`, `1개월`, `3개월`, `6개월`, and `1년`.
- Added deterministic provider-free sample market data in `src/data/marketTreemapSamples.ts`.
- Added one selected-universe Treemap card and one selected-universe Momentum / Trend scatter card.
- Implemented sector grouping, value-sized Treemap tiles, return-color mapping, and a visible color legend.
- Fixed Market scatter axis label placement so Korean labels remain outside the plot area.
- Preserved fullscreen/expanded card behavior and browser-only PNG export.
- Treemap export filenames now use `treemap`.
- Preserved Home sticky sidebar ad behavior.
- Preserved Chart AI chart-first UX and selected-security prefill.
- Preserved Portfolio behavior by scope.
- Preserved Header auth label stability and `Today: 000`.
- No Supabase connection for writes was attempted.
- No SQL, Supabase CLI, `psql`, or DB command was run.
- No production DB mutation was performed by Codex.
- No Auth user was created.
- No Portfolio write endpoint was called by Codex.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No provider integration, Chart AI provider call, AI execution, real market-data fetch, Trading Economics/ETFshopping/Hankyung fetch or scrape, real visitor count, ad-event tracking, analytics, FX conversion, valuation analytics, performance analytics, provider autocomplete, logo/banner scraping, remote discovery, or external asset download was added.
- No secrets were requested or recorded.
- `npm run preview` remains unsupported by the installed Vercel adapter; local HTTP smoke used `npm run dev`.
- Recommended next action: run the Phase 3F owner manual smoke in Chrome.

## Phase 3E.4 - 2026-06-20

### Home Sidebar Sticky Range Fix

- Fixed the Home sticky range by restructuring the Home layout into a shared `home-shell` wrapper with a main content column and a right sidebar column.
- Preserved the in-flow sidebar architecture.
- Fixed scroll-follow behavior without returning to a fixed viewport rail.
- Preserved header/nav/ticker collision prevention with the existing `112px` sticky top offset.
- Preserved footer/footer ad collision prevention by keeping the rail constrained to the Home shell.
- Preserved Home-only ad behavior.
- Preserved the `1440px` breakpoint.
- Preserved full `160x600` local sample banners.
- Preserved 5-second rotation, hover pause, and reduced-motion handling.
- Preserved non-Home ad absence.
- Preserved Market scatter fullscreen/export fixes.
- Preserved Chart AI chart-first UX and selected-security prefill.
- Recorded a Phase 3F planning note: rename visible `Heatmap` terminology to `Treemap` during the Market Treemap redesign.
- Did not implement the Phase 3F Treemap redesign.
- No provider call was implemented.
- No real AI analysis was implemented.
- No real market-data fetching was implemented.
- No Trading Economics, ETFshopping, Hankyung, or reference-site scraping/fetching was implemented.
- No DB migration was added.
- No direct SQL, Supabase CLI, or `psql` was run.
- No Auth user was created.
- No production authenticated write validation was performed by Codex.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No secrets were requested or recorded.
- Recommended next action: run the Phase 3E.4 owner manual smoke in Chrome.

## Phase 3E.3 - 2026-06-20

### Safe Sticky Home Sidebar Ad

- Added sticky behavior to the in-flow Home right sidebar by applying `position: sticky` to the inner Home rail viewport.
- Fixed Home ad scroll-follow behavior without returning to the unsafe viewport-fixed rail.
- Preserved header/nav/ticker collision prevention with a Home-only `112px` sticky top offset.
- Preserved footer/footer ad collision prevention by keeping the outer rail in normal Home grid flow.
- Preserved Home-only ad behavior.
- Preserved the `1440px` display breakpoint.
- Preserved full `160x600` local sample banners.
- Preserved 5-second rotation, hover pause, and reduced-motion handling.
- Preserved non-Home ad absence.
- Preserved Market scatter fullscreen/export fixes.
- Preserved Chart AI chart-first UX and selected-security prefill.
- No provider call was implemented.
- No real AI analysis was implemented.
- No real market-data fetching was implemented.
- No Trading Economics scraping or fetching was implemented.
- No DB migration was added.
- No direct SQL, Supabase CLI, or `psql` was run.
- No Auth user was created.
- No production authenticated write validation was performed by Codex.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No secrets were requested or recorded.
- Recommended next action: run the Phase 3E.3 owner manual smoke in Chrome.

## Phase 3E.2 - 2026-06-20

### Home Sidebar Rail And Market Scatter Export Stabilization

- Converted the Home ad rail from viewport-fixed placement into an in-flow Home-only right sidebar.
- Removed the obsolete fixed Home rail `top` and `right` positioning path.
- Preserved the `1440px` Home rail display breakpoint, full `160x600` local sample banners, 5-second rotation, hover pause, and reduced-motion handling.
- Preserved Home-only isolation; non-Home routes do not import or render `HomeRailAd`.
- Renamed the bottom footer/ad wrapper away from the old fixed-area class while keeping it in natural document flow.
- Reworked the Market expanded modal as a bounded grid with hidden overflow so scatter cards fit the modal viewport.
- Made the expanded modal close `X` visually clearer with explicit stroke SVG rendering.
- Hardened scatter SVG rendering with explicit white background, plot background, axes, point colors, and point label colors.
- Kept browser-only `html-to-image` PNG export and excluded modal close controls from capture.
- Preserved Heatmap export behavior.
- Preserved `/market` and `/heatmap`.
- Preserved Chart AI chart-first UX, selected-security prefill, and server-only usage guard boundary.
- Preserved Header auth label stability and `Today: 000`.
- Preserved Portfolio behavior by scope.
- No Supabase connection was attempted.
- No SQL, Supabase CLI, `psql`, or DB command was run.
- No production DB mutation was performed by Codex.
- No Auth user was created.
- No Portfolio write endpoint was called by Codex.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No provider integration, real AI analysis, real market-data fetch, Trading Economics fetch/scrape, real visitor count, ad-event tracking, analytics, FX conversion, valuation analytics, performance analytics, provider autocomplete, scraping, or external asset download was added.
- No secrets were requested or recorded.
- Recommended next action: run the Phase 3E.2 owner manual smoke in Chrome.

## Phase 3E.1 - 2026-06-20

### Home Rail, Footer, Market Fullscreen, And Export Polish

- Removed fixed viewport-following behavior from the bottom footer/ad area.
- Removed body bottom padding that compensated for the fixed bottom area.
- Kept the footer/ad block at the natural document bottom.
- Fixed Home rail clipping by moving the rail top offset higher and using a viewport-aware `min(600px, calc(100vh - 156px))` rail height.
- Preserved Home-only rail behavior and the `1440px` display breakpoint.
- Preserved existing local Home sample banners, 5-second rotation, hover pause, and reduced-motion handling.
- Added Market card expand/fullscreen controls for heatmap and scatter cards.
- Added modal close behavior through close button, backdrop click, and ESC.
- Hardened PNG export by replacing the fragile custom SVG `foreignObject` canvas path with browser-only `html-to-image`.
- Added `html-to-image` to `package.json` and `package-lock.json`.
- Kept export local-only; no upload, DB storage, analytics, or ad-event tracking was added.
- Preserved `/market` and `/heatmap`.
- Preserved Chart AI chart-first UX and the Phase 3D server-only usage guard skeleton.

### Safety And Validation

- Ran normal `npm run build`; build passed.
- Confirmed `.vercel/output/config.json`, `_render.func`, and static output exist.
- Confirmed local unauthenticated HTTP smoke for active routes and removed legacy routes.
- Confirmed unauthenticated POST to `/api/chart-ai/analyze` returned sanitized 401.
- No provider call was implemented.
- No real AI analysis was implemented.
- No real market-data fetching was implemented.
- No Trading Economics scraping or fetching was implemented.
- No DB migration was added.
- No direct SQL, Supabase CLI, or `psql` was run.
- No Auth user was created.
- No production authenticated write validation was performed by Codex.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No real visitor-count API/DB, local counter, migration, or analytics was added.
- No ad-event route or tracking logic was added.
- No secrets were requested or recorded.
- Recommended next action: run the Phase 3E.1 owner manual smoke in Chrome.

## Phase 3E - 2026-06-20

### Market, Chart AI UX, And Home Ad Shell

- Activated the normal Home right-side ad rail on `/`.
- Lowered the Home rail display breakpoint and added a Home-only content-width adjustment so the `160x600` rail can be visible locally without covering primary content.
- Removed the Phase 3C.12 in-page Home preview fallback panel from product source.
- Preserved existing local Home ad sample SVGs and `src/data/homeAdBanners.json`.
- Changed the primary nav label from Heatmap to `시장`.
- Added `/market` as the primary Market route.
- Kept `/heatmap` as a backward-compatible Market route.
- Rebuilt the Market surface with KOSPI200, KOSDAQ150, S&P500, NASDAQ100, and My Portfolio holdings sections.
- Added provider-free heatmap cards and short-term momentum vs long-term trend scatter cards for each section.
- Added camera buttons for each Market card.
- Added browser-only local PNG export with no new dependency.
- Removed the Chart AI question input from the UI.
- Removed `question` from the browser Chart AI request payload while leaving server-side tolerance for older payloads.
- Added `차트 불러오기` as the chart-load action near the security input.
- Moved Chart AI interval controls into the chart area as `일봉`, `주봉`, and `월봉`.
- Preserved Chart AI selected-security query prefill and the Phase 3D server-only usage guard skeleton.

### Safety And Validation

- Ran normal `npm run build`; build passed.
- Confirmed `.vercel/output/config.json`, `_render.func`, and static output exist.
- Confirmed local unauthenticated HTTP smoke for active routes and removed legacy routes.
- Confirmed unauthenticated POST to `/api/chart-ai/analyze` returned sanitized 401.
- No provider call was implemented.
- No real AI analysis was implemented.
- No real market-data fetching was implemented.
- No Trading Economics scraping or fetching was implemented.
- No DB migration was added.
- No direct SQL, Supabase CLI, or `psql` was run.
- No Auth user was created.
- No production authenticated write validation was performed by Codex.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No real visitor-count API/DB, local counter, migration, or analytics was added.
- No ad-event route or tracking logic was added.
- No secrets were requested or recorded.
- Recommended next action: run the Phase 3E owner manual smoke for Home rail visibility, Market card export, and Chart AI chart-first flow.

## Phase 3D - 2026-06-19

### Chart AI Usage Guard Skeleton

- Added POST-only `/api/chart-ai/analyze`.
- Added server-only usage helper `src/lib/server/chartAiUsage.ts`.
- Reused the existing bearer-token validation boundary and derived user ID from server-validated auth state.
- Did not accept or trust browser-submitted `user_id`.
- Limited request fields to `symbol`, `name`, `market`, `timeframe`, and `question`.
- Added deterministic placeholder response with `status: "ready_for_provider_integration"` for authenticated and allowed requests.
- Added `src/lib/chartAiClient.ts` as a browser-safe helper that obtains the current Supabase session and sends a bearer token without logging or storing it.
- Updated `/chart-ai` with Korean execution states, selected-security prefill preservation, timeframe/question inputs, and an `AI 분석 실행` button.
- Preserved Chart AI provider non-execution: no OpenAI, Gemini, KIS, OpenDART, market data, cache write, or AI analysis was implemented.
- Preserved Portfolio behavior, Header auth stability, `Today: 000`, and Home rail preview behavior.
- Hardened ignored-file coverage by adding `*.cert`.

### Safety And Validation

- Ran normal `npm run build`; build passed.
- Confirmed `.vercel/output/config.json`, `_render.func`, and static output exist.
- `npm run preview` was unavailable because the Vercel adapter does not support Astro preview.
- Used local `npm run dev` for unauthenticated HTTP smoke only.
- Confirmed active routes returned 200 and removed legacy routes returned 404.
- Confirmed unauthenticated POST to `/api/chart-ai/analyze` returned sanitized 401.
- No authenticated Chart AI production endpoint call was made by Codex.
- No Supabase connection was attempted by Codex for authenticated writes.
- No Portfolio write endpoint was called by Codex.
- No SQL, Supabase CLI, `psql`, migration, or DB command was run.
- No production DB mutation was performed by Codex validation.
- No Auth user was created.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No real visitor-count API/DB, local counter, migration, or analytics was added.
- No ad-event route or tracking logic was added.
- No provider integration, Chart AI provider call, AI execution, FX conversion, valuation analytics, performance analytics, provider autocomplete, logo/banner scraping, remote discovery, or external asset download was implemented.
- No secrets were requested, read from ignored env files, recorded, or printed.
- Browser automation was not completed because Playwright was not installed and no browser-control tool was directly available.
- Recommended next action: run the Phase 3D owner manual smoke for signed-out and signed-in Chart AI skeleton behavior.

## Phase 3C.12 - 2026-06-19

### Home Rail Preview Fallback Panel

- Recorded the owner Phase 3C.11 smoke result: normal Home breakpoint behavior passed, but the fixed `/?railPreview=1` rail remained invisible in the owner browser.
- Added a guaranteed Home-only in-page preview fallback panel for `/?railPreview=1`.
- Added fallback panel DOM markers:
  - `data-home-rail-preview-panel`
  - `home-rail-preview-panel`
  - `data-preview-banner-track`
  - `data-preview-banner-card`
  - `data-preview-banner-index`
- Added visible `HOME RAIL PREVIEW` label and concise preview helper copy.
- Added text fallback labels for sample SVG image failure:
  - `Sample Banner 01`
  - `Sample Banner 02`
- Added small preview thumbnails so both sample banner entries are visible immediately.
- Added preview-specific carousel behavior with 5000ms interval, left-slide transform, hover pause, and reduced-motion handling.
- Chose to hide the fixed right rail during `railPreview=1`; the in-page fallback panel is now the single owner-smoke acceptance surface.
- Preserved non-Home route isolation for Portfolio, Chart AI, Heatmap, Lab, and Lab detail routes.
- Preserved normal production breakpoint behavior: normal Home rail remains hidden below `1660px`.
- Preserved `Today: 000`, header auth label stability, Chart AI prefill, Portfolio behavior, and provider credential status notes for future phases without values.

### Safety And Validation

- No Supabase connection was attempted.
- No SQL, Supabase CLI, `psql`, or DB command was run.
- No production DB mutation was performed by Codex validation.
- No Auth user was created.
- No Portfolio write endpoint was called by Codex.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No provider integration, Chart AI provider call, AI execution, real visitor-count API/DB, ad-event write/tracking, FX conversion, valuation analytics, performance analytics, provider autocomplete, logo/banner scraping, remote discovery, or external asset download was implemented.
- No real visitor count implementation was added.
- No ad-event tracking was added.
- No secrets were requested or recorded.
- Normal `npm run build` passed and Vercel output was generated.
- Local unauthenticated HTTP smoke passed for required active and preview routes, and removed legacy routes returned 404.
- Browser visual smoke could not be completed because the in-app browser backend was unavailable.
- Recommended next action: run the Phase 3C.12 owner manual smoke using `/?railPreview=1`.

## Phase 3C.11 - 2026-06-19

### Home Rail Preview Visibility Hard Fix

- Recorded the owner Phase 3C.10 smoke result: normal Home breakpoint behavior passed, but `/?railPreview=1` did not visibly show the rail in the owner browser.
- Identified the issue as a visual preview hardening gap, not a route-isolation or non-Home import problem.
- Added a hard visibility path for `/?railPreview=1` with server-rendered inline root visibility styles.
- Added stronger preview CSS selectors for `.home-rail-ad[data-home-rail-preview="true"]` and `.home-rail-ad.rail-preview`.
- Forced preview display, visibility, opacity, pointer events, fixed positioning, safe right/top values, width, z-index, and viewport-safe height.
- Added a Home-only query fallback that reapplies the preview marker and class from `window.location.search` without localStorage or sessionStorage.
- Preserved two-banner carousel behavior, 5000ms interval, left-slide transform, hover pause, and reduced-motion handling.
- Preserved non-Home route isolation for Portfolio, Chart AI, Lab, and Lab detail routes.
- Preserved normal production breakpoint behavior: Home rail remains hidden below `1660px` unless `railPreview=1` is present on Home.
- Preserved `Today: 000`, header auth label stability, Chart AI prefill, Portfolio behavior, and provider credential status notes for future phases without values.

### Safety And Validation

- No Supabase connection was attempted.
- No SQL, Supabase CLI, `psql`, or DB command was run.
- No production DB mutation was performed by Codex validation.
- No Auth user was created.
- No Portfolio write endpoint was called by Codex.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No provider integration, Chart AI provider call, AI execution, real visitor-count API/DB, ad-event write/tracking, FX conversion, valuation analytics, performance analytics, provider autocomplete, logo/banner scraping, remote discovery, or external asset download was implemented.
- No real visitor count implementation was added.
- No ad-event tracking was added.
- No secrets were requested or recorded.
- Normal `npm run build` passed and Vercel output was generated.
- Local unauthenticated HTTP smoke passed for required active and preview routes, and removed legacy routes returned 404.
- Browser visual smoke could not be completed because the in-app browser backend was unavailable and local Playwright was not installed.
- Recommended next action: run the Phase 3C.11 owner manual smoke using `/?railPreview=1`.

## Phase 3C.10 - 2026-06-19

### Home Rail Preview And Isolation

- Verified that `HomeRailAd` is imported only by the Home route and not by shared layout or non-Home pages.
- Added Home-only `railPreview=1` support at `/?railPreview=1`.
- Preview mode forces the Home rail visible below the normal breakpoint for owner smoke testing.
- Preview mode is query-only and is not persisted to localStorage or sessionStorage.
- Confirmed non-Home preview URLs do not render the rail:
  - `/portfolio?railPreview=1`
  - `/chart-ai?railPreview=1`
  - `/lab?railPreview=1`
- Preserved normal production breakpoint behavior: Home rail remains hidden below `1660px` unless `railPreview=1` is present on Home.
- Preserved two-banner 5-second left-slide rotation, hover pause, reduced-motion handling, and zero/one/two-plus behavior.
- Preserved `Today: 000`, header auth stability, Chart AI prefill, Portfolio behavior, and provider credential status notes for future phases without values.

### Safety And Validation

- No Supabase connection was attempted.
- No SQL, Supabase CLI, `psql`, or DB command was run.
- No production DB mutation was performed by Codex validation.
- No Auth user was created.
- No Portfolio write endpoint was called by Codex.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No provider integration, Chart AI provider call, AI execution, real visitor-count API/DB, ad-event write/tracking, FX conversion, valuation analytics, performance analytics, provider autocomplete, logo/banner scraping, remote discovery, or external asset download was implemented.
- No secrets were requested or recorded.
- Normal `npm run build` passed and Vercel output was generated.
- `npm run preview` was confirmed unsupported by the installed `@astrojs/vercel` adapter, so local route smoke used an isolated `npm run dev` server.
- Local unauthenticated HTTP smoke passed for required active and preview routes, and removed legacy routes returned 404.
- Recommended next action: run the Phase 3C.10 owner manual smoke using `/?railPreview=1`.

## Phase 3C.9 - 2026-06-19

### Header, Home Rail, And Today Placeholder

- Added an early coarse auth UI hint in the document head to prevent a signed-in user from briefly seeing `로그인` during ordinary navigation before session resolution completes.
- Preserved signed-out `로그인`, signed-in `로그아웃`, and unavailable `설정 필요`.
- Kept visible `확인 중` absent from ordinary header auth UI.
- Reworked the header logo treatment so `public/logo.svg` is displayed inside a fixed 42px frame with the SVG scaled inside the frame, making the inner mark appear larger without growing the whole header logo box.
- Added a subtle display-only `Today: 000` header placeholder.
- Documented future real Today visitor-count logic using KST date, a per-day browser localStorage counted flag, a future server aggregate increment API, service-role-only DB writes, an aggregate read endpoint, and no IP/User-Agent/email/user_id storage for the MVP.
- Real visitor-count API, DB table, migration, DB write, local counting, and analytics were not implemented.

### Home Right Rail Sample Banners

- Added a Home-only right rail component.
- Added two local generated 160x600 SVG sample banners:
  - `public/ads/home-rail/home-rail-sample-01.svg`
  - `public/ads/home-rail/home-rail-sample-02.svg`
- Added `src/data/homeAdBanners.json` with two active sample banners.
- Implemented zero/one/two-plus banner behavior:
  - zero active banners render no rail.
  - one active banner renders static.
  - two or more active banners rotate every 5 seconds with a left-slide transition.
- Added reduced-motion handling and hover pause for the sample carousel.
- Kept the rail hidden below the wide-desktop breakpoint and Home-only.
- No ad-event route, analytics, or real outbound ad tracking was implemented.

### Safety And Validation

- No Supabase connection was attempted.
- No SQL, Supabase CLI, `psql`, or DB command was run.
- No production DB mutation was performed by Codex validation.
- No Auth user was created.
- No Portfolio write endpoint was called by Codex.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No provider integration, Chart AI provider call, AI execution, real visitor-count API/DB, ad-event write, FX conversion, valuation analytics, performance analytics, provider autocomplete, logo scraping, remote logo discovery, or external asset download was implemented.
- No secrets were requested or recorded.
- Provider credential status remains preserved for future phases without values.
- Normal `npm run build` passed and Vercel output was generated.
- Local unauthenticated HTTP smoke passed for the required active routes, and removed legacy routes returned 404.
- Browser connector visual smoke was not completed because the in-app browser path was unavailable.
- Recommended next action: run the Phase 3C.9 owner manual smoke using the Korean result template.

## Phase 3C.8 - 2026-06-19

### Header Auth And Logo Polish

- Removed the header's user-visible auth `checking` state branch so ordinary navigation only presents `로그인`, `로그아웃`, or `설정 필요`.
- Removed Portfolio's response to header `checking` events so header navigation cannot push the Portfolio shell back into a checking display.
- Preserved signed-out `로그인` and signed-in `로그아웃` labels.
- Increased the top-left `public/logo.svg` display size from 42px to 48px while keeping the 72px header height stable.
- Preserved Auth, Portfolio, Chart AI prefill, bottom-sheet motion, lock UI, refresh icon, sorting/order controls, logo/fallback avatar, country badge, Pretendard, and Korean UI behavior.

### Home Vertical Banner Feasibility

- Produced a report-only feasibility plan for a future Home vertical ad rail.
- Confirmed the current centered content frame is 1240px wide.
- Estimated side gutter space at common desktop widths: 63px at 1366px, 100px at 1440px, 148px at 1536px, and 340px at 1920px.
- Recommended a Home-only right-side rail for a later phase.
- Recommended owner-created `160x600` images first, with optional `200x600` images for wider desktop testing.
- Recommended hiding the future rail below roughly 1660px and showing no rail or reserved space when no active banner exists.
- Recommended future paths `public/ads/home-rail/` and `src/data/homeAdBanners.json`, but did not add or wire them in this phase.
- Banner implementation, banner carousel, banner assets, outbound ad link behavior, and ad-event routes were not added.

### Safety And Validation

- No Supabase connection was attempted.
- No SQL, Supabase CLI, `psql`, or DB command was run.
- No production DB mutation was performed by Codex validation.
- No Auth user was created.
- No Portfolio write endpoint was called by Codex.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No provider integration, Chart AI provider call, AI execution, ad-event write, banner implementation, FX conversion, valuation analytics, performance analytics, provider autocomplete, logo scraping, remote logo discovery, or external asset download was implemented.
- No secrets were requested or recorded.
- Provider credential status remains preserved for future phases without values.
- Normal `npm run build` passed and Vercel output was generated.
- Local unauthenticated HTTP smoke passed for the required active routes, and removed legacy routes returned 404.
- Browser connector visual smoke was not completed because the in-app `iab` browser was unavailable.
- Recommended next action: run the Phase 3C.8 owner manual smoke using the Korean result template.

## Phase 3C.7 - 2026-06-19

### Portfolio Visual Polish

- Replaced the signed-out Portfolio lock treatment with one larger `🔐` visual.
- Removed the sky-blue/gradient lock-icon background and overlapping lock drawing layers.
- Added bottom-sheet slide-up and slide-down/fade motion for position add/edit.
- Added reduced-motion handling for the bottom-sheet transition.
- Searched local/tracked logo assets and applied `public/logo.svg` to the top-left header brand area.
- Replaced the visible Portfolio refresh text with an icon-only circular-arrow button while preserving `aria-label="새로고침"`.
- Preserved auth label stability: signed-out `로그인`, signed-in `로그아웃`, and no visible checking label in ordinary navigation.
- Preserved Chart AI selected-security prefill without provider, AI, market-data, or authenticated calls.
- Hardened ignored-file coverage for certificate files.
- Preserved the provider credential status note for future phases without recording values.
- Preserved the desktop left-side rotating image ad banner as backlog only.

### Safety And Validation

- No Supabase connection was attempted.
- No SQL, Supabase CLI, `psql`, or DB command was run.
- No production DB mutation was performed by Codex validation.
- No Auth user was created.
- No Portfolio write endpoint was called by Codex.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No provider integration, Chart AI provider call, AI execution, ad-event write, banner implementation, FX conversion, valuation analytics, performance analytics, provider autocomplete, logo scraping, remote logo discovery, or external asset download was implemented.
- No secrets were requested or recorded.
- Normal `npm run build` passed and Vercel output was generated.
- Local unauthenticated HTTP smoke passed for the required active routes, and removed legacy routes returned 404.
- Browser connector visual smoke was not completed because the in-app `iab` browser was unavailable.
- Recommended next action: run the Phase 3C.7 owner manual smoke using the Korean result template.

## Phase 3C.6 - 2026-06-19

### Portfolio Final UX Smoke Fix

- Removed the visible auth-checking label from ordinary header and Portfolio shell navigation states.
- Strengthened the signed-out Portfolio lock state with a visible lock treatment.
- Moved the position add/edit form into a bottom sheet opened by `종목 추가`.
- Reused the bottom sheet for position edit actions.
- Changed the currency display toggle labels to `달러 기준` and `원화 기준`.
- Changed local money formatting to compact USD and KRW display.
- Linked position names to Chart AI with `symbol`, `name`, and `market` query parameters.
- Added a safe Chart AI query-prefill skeleton without provider, AI, market-data, or authenticated calls.
- Tightened `.gitignore` coverage for literal `dist` and service-account credential JSON probes.

### Validation

- Ran normal `npm run build`; it exits with code 0.
- Confirmed `.vercel/output/config.json` and `.vercel/output/functions/_render.func` are generated.
- Confirmed `astro preview` is still unsupported by the installed Vercel adapter, so the local smoke check used the Astro dev server.
- Confirmed target routes return HTTP 200.
- Confirmed removed legacy routes return HTTP 404 and do not expose old surface markers.
- Confirmed no requested provider secret markers appear in source, public assets, or generated Vercel output.
- Confirmed no service-role marker appears in client-facing source or generated static output.
- Confirmed ignored-file coverage for `.env*`, `.vercel`, `.vercel/output`, `dist`, `dist/`, `.astro`, `.omc`, representative key files, service-account JSON files, credential files, and secret files.
- Browser connector smoke was not completed because the in-app `iab` browser was unavailable in this session; owner visual and console smoke remains recommended before Phase 3D.

## Phase 3C.5 - 2026-06-19

### Portfolio List Redesign

- Removed the header's visible server-rendered `확인 중` auth button state so normal signed-in navigation can avoid that flash when the non-secret signed-in UI hint exists.
- Added a lock-style logged-out Portfolio UI with `로그인이 필요합니다` and a `회원가입 / 로그인` action.
- Removed the duplicate login action from the compact Portfolio status bar.
- Changed the Portfolio name placeholder to `계좌 이름`.
- Applied smaller Portfolio card action controls and added client-side `위로`/`아래로` ordering controls.
- Added `src/data/securityLogos.json` for operator-provided logo mappings.
- Added position logo rendering, local fallback avatars, and KR/US country badges.
- Removed the visible `시장` field from the position form and added temporary internal market inference.
- Added a display-only currency mode toggle: `현지통화 기준` and `원화 기준`.
- Preserved safe USD/KRW behavior by showing `원화 환산 예정` instead of fake FX conversion.
- Replaced the position table with a cleaner card/list layout inspired by financial app information hierarchy.
- Added placeholder-safe valuation and return sorting controls.
- Corrected visible Lab copy from `미국 의회 주식` to `국회의원 보유 주식`.

### Backlog And Provider Notes

- Documented that an official KIS logo/image API was not confirmed from accessible docs.
- Used only owner/operator-provided logo URL mappings and local fallback avatars.
- Preserved the note that KIS REST API APP KEY, KIS REST API APP Secret, and OpenDART API KEY have been issued for future phases, without recording values.
- Preserved the desktop left-side rotating image ad banner as backlog only.
- Did not implement provider integration, Chart AI provider calls, ad-event writes, banner implementation, FX conversion, valuation analytics, performance analytics, provider autocomplete, logo scraping, or remote logo discovery.

### Safety And Scope

- No Supabase connection was attempted.
- No SQL, Supabase CLI, `psql`, or DB command was run.
- No production DB mutation was performed by Codex validation.
- No Auth user was created.
- No authenticated Portfolio write endpoint was called by Codex.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No provider credentials were requested or recorded.
- `npm run build` passed.
- Vercel output generation passed.
- Local unauthenticated HTTP smoke passed using `npm run dev` because the Vercel adapter does not support `astro preview`.
- Source and generated-output scans found only expected server-only service-role source markers and no browser/static exposure.
- Recommended next action: run the Phase 3C.5 owner manual smoke using the Korean result template.

## Phase 3C.4 - 2026-06-18

### Portfolio UX Polish

- Added a non-secret browser UI hint so the header can keep `로그아웃` visible during normal navigation after a signed-in state has already been confirmed.
- Replaced the large Portfolio readiness card with a compact status bar for login, profile, Portfolio API, and valuation readiness.
- Polished Portfolio position form spacing, table borders, row display, and `수정`/`삭제` action styling.
- Replaced separate visible ticker and name inputs with one `종목명 또는 티커` field.
- Removed the visible `자산 유형` select while preserving an internal `stock` default for the current API/schema contract.
- Added safe placeholders for `현재가`, `평가금액`, and `수익률`.
- Added USD-in-KRW valuation placeholder behavior so USD buy price remains displayed as USD and KRW valuation remains pending.
- Updated position rows to show security name first and ticker/code status second.
- Added the `pretendard` package and imported its package CSS for project-managed, self-hosted Korean font rendering.

### Backlog And Provider Notes

- Preserved the note that KIS REST API APP KEY, KIS REST API APP Secret, and OpenDART API KEY have been issued for future phases, without recording values.
- Preserved the desktop left-side rotating image ad banner as backlog only.
- Did not implement provider integration, Chart AI provider calls, ad-event writes, banner implementation, FX conversion, valuation analytics, performance analytics, or provider autocomplete.

### Safety And Scope

- No Supabase connection was attempted.
- No SQL, Supabase CLI, `psql`, or DB command was run.
- No production DB mutation was performed by Codex validation.
- No Auth user was created.
- No authenticated Portfolio write endpoint was called by Codex.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No provider credentials were requested or recorded.
- `npm run build` passed.
- Vercel output generation passed.
- Local unauthenticated HTTP smoke passed using `npm run dev` because the Vercel adapter does not support `astro preview`.
- Source and generated-output scans found only expected server-only service-role source markers and no browser/static exposure.
- Recommended next action: run the Phase 3C.4 owner manual smoke using the Korean result template.

## Phase 3C.3 - 2026-06-18

### Auth And Portfolio State Stabilization

- Replaced the header's initial signed-out visual default with a neutral session-checking state to reduce auth-state flicker during navigation.
- Added a shared browser-only auth-state event so Portfolio can react to checking, signed-in, signed-out, and unavailable states.
- Cleared portfolio list, selected portfolio, position list, edit forms, and loading state immediately on sign-out.
- Reran profile bootstrap and Portfolio list loading after signed-in state so re-login can reload persisted Portfolio data.
- Preserved signup nickname and password confirmation fields and Korean validation messages.

### Korean UI Conversion

- Converted the current visible shell and Portfolio MVP UI to Korean-first copy across header, nav, ticker helper text, home, Chart AI, Heatmap, Lab, Portfolio, slide ad, and footer ad surfaces.
- Preserved approved brand, feature, financial proper noun, ticker, currency, and route labels where appropriate.
- Updated owner manual smoke reporting format to Korean-first copy while preserving secret-safety rules.

### Backlog And Provider Notes

- Preserved the note that KIS REST API APP KEY, KIS REST API APP Secret, and OpenDART API KEY have been issued for future phases, without recording values.
- Preserved the desktop left-side rotating image ad banner as backlog only.
- Did not implement a left-side banner, ad-event route, database change, provider integration, valuation analytics, or performance analytics.

### Safety And Scope

- No Supabase connection was attempted.
- No SQL, Supabase CLI, `psql`, or DB command was run.
- No production DB mutation was performed by Codex validation.
- No Auth user was created.
- No authenticated Portfolio write endpoint was called by Codex.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No provider credentials were requested or recorded.
- Recommended next action: rerun focused owner manual Portfolio smoke using the Korean result template.

## Phase 3C.2 - 2026-06-18

### Portfolio Smoke Fix

- Fixed local server-side Supabase service-role category detection to support Astro server-side runtime lookup while preserving Vercel `process.env` behavior.
- Split Portfolio readiness states so public login config, profile bootstrap config, profile readiness, and Portfolio API availability are shown separately.
- Prevented a server-side Portfolio/API configuration issue from being displayed as Login unavailable after successful sign-in.
- Preserved Phase 3C Portfolio MVP list/create/update/delete UI and server-side ownership checks.

### Auth Modal UI

- Restored login/signup modal direction toward Korean product UI.
- Updated header login/logout labels and modal labels/buttons/messages to Korean product strings.
- Added signup nickname field.
- Added signup password confirmation field.
- Added client-side signup validation for nickname, email, password, password confirmation, and password mismatch.
- Kept password values out of logs, docs, and persistent state.

### Backlog And Provider Notes

- Documented that the KIS REST API APP KEY, KIS REST API APP Secret, and OpenDART API KEY have been issued for future phases, without recording values.
- Documented that future KIS/OpenDART phases must include secret-safe local and deployment environment registration guidance.
- Captured the desktop left-side rotating image ad banner requirement as backlog only.
- Did not implement a left-side banner, ad-event route, database change, provider integration, valuation analytics, or performance analytics.

### Safety And Scope

- No Supabase connection was attempted.
- No SQL, Supabase CLI, `psql`, or DB command was run.
- No production DB mutation was performed by Codex validation.
- No Auth user was created.
- No authenticated Portfolio write endpoint was called by Codex.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No provider credentials were requested or recorded.
- Recommended next action: rerun focused owner manual Portfolio smoke and report only non-secret pass/fail results.

## Phase 3C.1 - 2026-06-18

### Portfolio Manual Smoke Checklist

- Created `docs/planning/phase_3c1_portfolio_manual_smoke_checklist_v0.1.md`.
- Prepared an owner-performed manual smoke checklist and non-secret result template for the Phase 3C Portfolio MVP.
- Documented disposable test data, manual browser checks, failure triage, stop conditions, cleanup, and next-action options.
- Confirmed Phase 3C authenticated write validation remains owner-performed.

### Safety And Scope

- No Supabase connection was attempted.
- No SQL, Supabase CLI, `psql`, or DB command was run.
- No production DB mutation was performed.
- No Auth user was created.
- No Portfolio API write endpoint was called by Codex.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No code implementation was performed.
- No secret values were requested or recorded.
- Next decision depends on the owner manual smoke result.

## Phase 3C - 2026-06-18

### Portfolio MVP Integration

- Added server-side Portfolio API boundaries in `src/pages/api/portfolio/portfolios.ts` and `src/pages/api/portfolio/positions.ts`.
- Added server-only Portfolio ownership and validation helpers in `src/lib/server/portfolio.ts`.
- Added browser-safe Portfolio API wrapper in `src/lib/portfolioClient.ts`.
- Rebuilt `/portfolio` from readiness-only placeholder into a minimal Portfolio MVP shell with portfolio list/create/update/delete and position list/create/update/delete UI.
- Preserved login/profile readiness behavior from Phase 3B.
- Kept symbols as plain user input; no provider lookup, valuation, performance analytics, or market refresh was added.
- Created `docs/planning/phase_3c_portfolio_mvp_result_v0.1.md`.

### Safety And Scope

- Portfolio API derives ownership from a server-validated Supabase session token and never trusts a browser-submitted `user_id`.
- Portfolio API routes explicitly scope service-role queries to the validated user ID.
- Non-owned portfolio or position access returns sanitized not-found behavior.
- No Portfolio write endpoint was called by Codex during validation.
- No Supabase SQL, Supabase CLI, `psql`, or DB command was run.
- No production DB mutation was performed by Codex validation.
- No Auth user was created.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No Chart AI provider call, ad-event write, market/provider ingestion, valuation analytics, or performance analytics was implemented.
- No secret values were requested or recorded.

### Validation

- `npm run build` passed.
- `.vercel/output/config.json`, `.vercel/output/functions/_render.func`, and `.vercel/output/static` were generated.
- Product source/generated secret marker scan found only the expected server-only source occurrence for the service-role variable marker.
- Service-role exposure scan found expected server-only source occurrences only.
- Browser/static bundle server-only marker scan found no service-role marker and no server-only helper marker.
- Disposable identifier scan found no product source or generated-output matches.
- Removed legacy route scan found no product source or generated-output matches.
- Broad crypto scope scan found no newly added broad crypto feature; existing crypto-not-supported and asset-class Bitcoin copy remain within approved scope.
- Ignored-file coverage was confirmed for `.env*`, `.vercel`, `dist`, `.astro`, `.omc`, representative credentials, certificates, and key files.
- In-app browser smoke was unavailable; fallback local HTTP smoke confirmed `/portfolio` returns 200 and unauthenticated Portfolio API GET requests return 401 without write calls.
- Recommended next phase: Phase 3D Chart AI usage guard and server-only AI execution skeleton.

## Phase 3B - 2026-06-18

### Auth/Profile Boundary Implementation

- Implemented the browser-safe Supabase helper boundary in `src/lib/supabase.ts`.
- Added browser-safe profile bootstrap helper logic in `src/lib/profileBootstrap.ts`.
- Added the server-only Supabase helper boundary in `src/lib/server/supabaseAdmin.ts`.
- Added `POST /api/auth/profile-bootstrap` in `src/pages/api/auth/profile-bootstrap.ts`.
- Wired the existing auth shell to call profile bootstrap after a signed-in session exists.
- Updated the Portfolio shell to show login/profile readiness states without implementing Portfolio CRUD.
- Created `docs/planning/phase_3b_auth_profile_boundary_result_v0.1.md`.

### Safety And Scope

- No profile bootstrap endpoint call was made by Codex during validation.
- No Supabase SQL, Supabase CLI, `psql`, or DB command was run.
- No production DB mutation was performed by Codex validation.
- No Auth user was created.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No Portfolio CRUD, Chart AI provider call, ad-event write route, market provider ingestion, OpenAI, Gemini, KIS, or OpenDART integration was implemented.
- No secret values were requested or recorded.

### Validation

- `npm run build` passed.
- `.vercel/output/config.json`, `.vercel/output/functions/_render.func`, and `.vercel/output/static` were generated.
- Product source/generated secret marker scan found only the expected server-only source occurrence for the service-role variable marker.
- Service-role exposure scan found expected server-only source occurrences only.
- Browser/static bundle server-only marker scan found no service-role marker and no server-only helper marker.
- Disposable identifier scan found no product source or generated-output matches.
- Removed legacy route scan found no product source or generated-output matches.
- Broad crypto scope scan found no newly added broad crypto feature; existing crypto-not-supported and asset-class Bitcoin copy remain within the approved scope.
- Ignored-file coverage was confirmed for `.env*`, `.vercel`, `dist`, `.astro`, `.omc`, representative credentials, certificates, and key files.
- Recommended next phase: Phase 3C Portfolio MVP integration.

## Phase 3A - 2026-06-18

### App/Server Integration Planning

- Created `docs/planning/app_server_integration_plan_v0.1.md`.
- Acknowledged Phase 2L production schema readiness for application/server integration planning.
- Documented the current Astro route shell, Supabase browser helper, auth entry points, shared layout/nav/ticker/ad components, and the absence of current server endpoint files.
- Documented route-to-table integration mapping, service-role boundary principles, environment variable categories, planned server API boundaries, Chart AI usage-guard requirements, Portfolio/Auth/Profile sequence, public Lab/Heatmap read strategy, and ad-event server-write design.
- Preserved Advisor follow-ups and the pending runtime test for `internal.consume_chart_ai_usage(uuid, integer)`.
- Recommended the next implementation packet: Phase 3B Supabase client/server helper boundary and auth/profile bootstrap.

### Safety And Scope

- No Supabase connection was attempted.
- No SQL, Supabase CLI, `psql`, or DB command was run.
- No production DB mutation was performed.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No feature implementation, API route creation, provider integration, or database write path was added.
- No secret values were requested or recorded.

### Validation

- Run normal `npm run build` only for Phase 3A validation.
- Scan source and generated output for requested provider secret markers.
- Scan source and generated output for service-role exposure markers, reporting docs-only occurrences separately.
- Scan source and generated output for disposable validation identifiers, reporting docs-only occurrences separately.
- Confirm removed legacy route strings remain absent from product source and generated output.
- Confirm ignored-file coverage for `.env*`, `.vercel`, `dist`, `.astro`, `.omc`, credentials, certificates, and key files.
- Confirm final `git status --short`.

## Phase 2L - 2026-06-18

### Production Reset/Drop And Supabase Migration

- Created `docs/planning/supabase_production_reset_migration_result_v0.1.md`.
- Confirmed the exact Phase 2L approval gate passed.
- Used the Supabase connector for approved production DB execution.
- Performed metadata dependency review before reset/drop.
- Dropped only approved legacy/test public tables:
  - `public.portfolio_items`
  - `public.portfolio_assets`
  - `public.seibro_holdings`
  - `public.portfolios`
- Applied `supabase/migrations/20260615_rebuild_schema_v0_1.sql`.
- Did not apply `supabase/validation/patch_consume_chart_ai_usage_v0_1.sql`.
- Ran `supabase/validation/validate_rebuild_schema_v0_1.sql`; the connector returned only the final result set, so targeted read-only validation queries were run separately.
- Confirmed 14 required public tables exist and RLS is enabled on all 14.
- Confirmed `ad_events` has no public select or insert policy.
- Confirmed `chart_ai_cache` has no `user_id`.
- Confirmed `public.set_updated_at()` and `internal.consume_chart_ai_usage(uuid, integer)` exist.
- Confirmed `internal.consume_chart_ai_usage(uuid, integer)` is executable only by `service_role`.
- Confirmed the Phase 2H `usage_date_kst` ambiguity fix is present.
- Skipped the usage-function runtime test because no safe Auth Admin/test-user creation channel was available through the connector.
- Checked Supabase Advisors and recorded non-secret high-level findings.
- Did not mutate Vercel env vars.
- Did not deploy.

### Safety Notes

- Supabase production DB mutation was limited to the approved legacy/test table reset/drop and fixed source migration.
- No Supabase CLI command was run.
- No `psql` command was run.
- No Vercel env value was read, printed, pulled, added, updated, removed, or overwritten.
- No secret values, project refs, URLs, connection strings, tokens, anon keys, service-role keys, JWT secrets, database passwords, or Vercel tokens were requested or recorded.
- Production DB schema is ready for the next integration planning phase, with Advisor and runtime-test follow-up items documented.

## Phase 2K - 2026-06-18

### Production Supabase Migration Attempt

- Created `docs/planning/supabase_production_migration_result_v0.1.md`.
- Confirmed the exact Phase 2K approval gate passed.
- Used the Supabase connector for read-only project and table metadata checks.
- Confirmed the production target is distinct from the disposable validation project without recording project refs, URLs, database hosts, keys, or connection strings.
- Stopped before migration because read-only production metadata showed existing public tables, including `public.portfolios`, which conflicts with the reviewed migration source.
- Did not apply `supabase/migrations/20260615_rebuild_schema_v0_1.sql`.
- Did not apply `supabase/validation/patch_consume_chart_ai_usage_v0_1.sql`.
- Did not run `supabase/validation/validate_rebuild_schema_v0_1.sql`.
- Did not perform the usage-function runtime test.
- Did not create a production test auth user.
- Did not run Supabase Advisors.
- Did not mutate Vercel env vars.
- Did not deploy.

### Safety Notes

- No SQL was run by Codex.
- No Supabase CLI command was run.
- No `psql` command was run.
- No database object was created, dropped, reset, truncated, altered, or mutated.
- No Vercel env value was read, printed, pulled, added, updated, removed, or overwritten.
- No secret values, project refs, URLs, connection strings, tokens, anon keys, service-role keys, JWT secrets, database passwords, or Vercel tokens were requested or recorded.
- Production DB readiness remains blocked until an owner-approved reset/drop procedure or revised migration handles the existing test/legacy public tables.

## Phase 2J.3 - 2026-06-18

### Vercel Production Environment Separation Audit

- Created `docs/planning/vercel_production_env_separation_audit_v0.1.md`.
- Recorded owner confirmations for production target identity, production data state, reset/rebuild acceptance, backup/restore decision, rollback owner, maintenance timing, production test auth user allowance, and Phase 2K Vercel env var exclusion.
- Confirmed application source and generated output do not contain requested provider secret markers or disposable validation identifiers.
- Confirmed `.gitignore` coverage for `.env*`, `.vercel/`, `dist/`, `.astro/`, `.omc/`, credentials, certificates, and key files.
- Checked Vercel project linkage without printing IDs; this checkout is not linked.
- Confirmed Vercel CLI is available, but read-only production env metadata could not be queried because project linkage is missing.
- Classified Vercel production env separation as `Not cleared; Vercel metadata unavailable`.
- Documented the remaining manual Vercel Production value-provenance check.
- Documented the acceleration policy for next work.

### Safety Notes

- Codex did not connect to Supabase.
- Codex did not run SQL.
- Codex did not run Supabase CLI.
- Codex did not run `psql`.
- Codex did not run any database command.
- Codex did not read, print, pull, add, update, or remove any Vercel env value.
- Codex did not run a deployment.
- No production migration was applied.
- No secret values, project refs, URLs, connection strings, tokens, anon keys, service-role keys, JWT secrets, database passwords, or Vercel tokens were requested or recorded.
- The exact Phase 2K approval phrase remains mandatory.

## Phase 2J.2 - 2026-06-18

### Owner Confirmation Package

- Created `docs/planning/supabase_owner_confirmation_package_v0.1.md`.
- Converted the Phase 2J.1 owner-confirmation blockers into a fillable decision form.
- Preserved backup/rollback and production data-state blockers before any Phase 2K execution.
- Preserved disposable credential separation from production and Vercel production settings.
- Documented allowed answer choices, evidence requirements, stop conditions, secret-safe reporting rules, production test user policy, decision outcomes, readiness scores, and the exact Phase 2K approval phrase gate.
- Updated `supabase/validation/README.md` with a cross-reference to the owner confirmation package.

### Safety Notes

- Codex did not connect to Supabase.
- Codex did not run SQL.
- Codex did not run Supabase CLI.
- Codex did not run `psql`.
- Codex did not run any database command.
- No production migration was applied.
- No secret values, project refs, URLs, connection strings, tokens, anon keys, service-role keys, JWT secrets, or database passwords were requested or recorded.
- The exact Phase 2K approval phrase remains mandatory and was not requested by this package-generation phase.

## Phase 2J.1 - 2026-06-17

### Final Production Migration Readiness Review

- Created `docs/planning/supabase_production_migration_readiness_review_v0.1.md`.
- Reviewed the Phase 2J production migration application plan against existing Phase 2 migration, validation, and human-review documents.
- Recorded the verdict: `Ready for owner decision, not ready for execution`.
- Documented unresolved owner confirmations for production target identity, production schema/data state, backup/recovery readiness, rollback feasibility, maintenance timing, production test user policy, disposable credential separation, and post-migration validation ownership.
- Confirmed by static review only that the fixed source migration is the production source of truth and that `supabase/validation/patch_consume_chart_ai_usage_v0_1.sql` remains disposable repair SQL.
- Updated `supabase/validation/README.md` with a cross-reference to the readiness review.

### Safety Notes

- Codex did not connect to Supabase.
- Codex did not run SQL.
- Codex did not run Supabase CLI.
- Codex did not run `psql`.
- Codex did not run any database command.
- No production migration was applied.
- No secret values, project refs, URLs, connection strings, tokens, anon keys, service-role keys, JWT secrets, or database passwords were requested or recorded.
- Owner confirmations remain required before Phase 2K.
- The exact Phase 2K approval phrase remains mandatory.
- Production data, backup, and rollback decision gaps remain documented blockers before execution.

## Phase 2J - 2026-06-17

### Production Migration Application Plan

- Created `docs/planning/supabase_production_migration_application_plan_v0.1.md`.
- Documented the production migration hard gates, backup/recovery checks, pre-flight checklist, future Phase 2K execution sequence, patch handling rule, post-migration validation checklist, and production test user policy.
- Recorded that successful disposable validation does not authorize production migration.
- Recorded the exact owner approval phrase required before Phase 2K can start.
- Documented that `supabase/validation/patch_consume_chart_ai_usage_v0_1.sql` is disposable-validation repair SQL and should not be applied to fresh production when the fixed source migration is used.
- Updated `supabase/validation/README.md` with a cross-reference to the production migration application plan.

### Safety Notes

- Codex did not connect to Supabase.
- Codex did not run any database command.
- Codex did not apply migration or patch SQL.
- Production Supabase was not touched.
- No secret values, project refs, URLs, connection strings, tokens, anon keys, service-role keys, or database passwords were requested or recorded.
- Disposable project retention remains an owner decision; disposable credentials must never be used in Vercel production.

## Phase 2I - 2026-06-16

### Disposable Validation Result

- Created `docs/planning/supabase_disposable_validation_result_v0.1.md`.
- Recorded operator-performed disposable Supabase validation results.
- Recorded that the migration was manually applied to a separate disposable validation project.
- Recorded that `supabase/validation/patch_consume_chart_ai_usage_v0_1.sql` was manually applied to the disposable validation project.
- Recorded that the patched `internal.consume_chart_ai_usage(uuid, integer)` four-call test passed with remaining counts `2`, `1`, `0`, `0`.
- Recorded that full validation SQL was rerun successfully after the patch.
- Recorded that Supabase Advisors reported no critical warnings according to the operator.
- Updated `supabase/validation/README.md` with a cross-reference to the validation result document.

### Safety Notes

- Codex did not connect to Supabase.
- Codex did not run any database command.
- Codex did not apply migration or patch SQL.
- Production Supabase was not touched.
- Successful disposable validation does not authorize production application.

## Phase 2H - 2026-06-16

### Chart AI Usage Function Fix

- Disposable validation found a runtime ambiguity in `internal.consume_chart_ai_usage(uuid, integer)`.
- The observed error reported ambiguous `usage_date_kst` resolution inside the PL/pgSQL function.
- Fixed the migration source by naming the `ai_usage_daily` user/date unique constraint and using `on conflict on constraint ai_usage_daily_user_id_usage_date_kst_key`.
- Updated the function body to use internal `out_*` aliases and table-qualified references so output column names do not conflict with table columns.
- Created `supabase/validation/patch_consume_chart_ai_usage_v0_1.sql` for disposable validation project repair.
- Updated validation docs to mention the disposable-only patch and the expected four-call usage test results.

### Safety Notes

- No Supabase connection was attempted by Codex.
- No database command was run by Codex.
- No migration or patch was applied by Codex.
- The patch file is for the disposable validation project only and does not authorize production migration.

## Phase 2G - 2026-06-16

### Validation README Verification

- Confirmed root `README.md` still contains the existing Astro Starter Kit content.
- Confirmed root `README.md` was not changed during Phase 2G.
- Confirmed `supabase/validation/README.md` exists and was the file modified by Phase 2F.
- Corrected `supabase/validation/README.md` to use the required `# Supabase Validation` title and focused disposable validation structure.
- Confirmed `supabase/validation/README.md` cross-references `supabase/validation/validate_rebuild_schema_v0_1.sql` and `docs/planning/supabase_disposable_project_setup_guide_v0.1.md`.
- Recorded the Astro Starter Kit root README as unrelated existing project documentation debt.

### Safety Notes

- No Supabase connection was attempted.
- No Supabase project was created.
- No migration was applied anywhere.
- No database command was run.

## Phase 2F - 2026-06-16

### Disposable Project Setup Preparation

- Created `docs/planning/supabase_disposable_project_setup_guide_v0.1.md`.
- Documented manual-only setup steps for a separate disposable Supabase validation project.
- Added disposable naming guidance, SQL Editor validation workflow, allowed validation-result fields, prohibited secret-bearing captures, disposal options, hard stop conditions, and explicit owner approval phrases.
- Updated `supabase/validation/README.md` with a cross-reference to the disposable project setup guide.
- Reiterated that Phase 2F does not authorize remote access, agent-created projects, migration application, or database mutation.

### Safety Notes

- No Supabase connection was attempted.
- No Supabase project was created.
- No migration was applied anywhere.
- No database command was run.
- No secret value, project ref, database URL, token, password, anon key, or service-role key was requested or recorded.

## Phase 2E - 2026-06-16

### Remote Disposable Validation Planning

- Created `docs/planning/supabase_remote_disposable_validation_plan_v0.1.md`.
- Documented two remote disposable validation target options:
  - Supabase branch database from the existing project.
  - Separate disposable Supabase project.
- Recommended a separate disposable Supabase project as the safer default when branch isolation, production data, or operator experience is uncertain.
- Added pre-flight checks, hard stop conditions, SQL Editor workflow, CLI placeholder workflow, and a validation result template.
- Reiterated that Phase 2E does not authorize remote access or database mutation.

### Safety Notes

- No Supabase project connection was attempted.
- No migration was applied anywhere.
- No database command was run.
- No production deployment setting or product feature was changed.
- No secret value, project ref, database URL, token, password, or service-role key was requested or recorded.

## Phase 2D - 2026-06-16

### Disposable Validation Preparation

- Created `docs/planning/supabase_disposable_validation_plan_v0.1.md`.
- Created `supabase/validation/validate_rebuild_schema_v0_1.sql` as a read-only validation script for disposable databases after migration application.
- Created `supabase/validation/README.md` with validation script safety notes.
- Checked local tool availability:
  - Supabase CLI is not installed.
  - `psql` is not installed.
  - Docker is not installed.
- Documented validation options for local Supabase CLI, direct disposable Postgres with `psql`, and Supabase branch or disposable remote database only after explicit owner approval.

### Safety Notes

- No tool was installed.
- No local database service was started.
- No migration was applied locally, to a disposable database, to a branch database, or to a remote database.
- No remote Supabase command was run.
- The validation SQL includes only read-only catalog checks plus commented disposable-only examples.

## Phase 2C - 2026-06-16

### Human Review Package

- Created `docs/planning/supabase_human_review_v0.1.md` for owner approval or rejection before any database application.
- Summarized all 14 migration tables by product group.
- Added a table-by-table approval matrix with all statuses set to `Pending owner review`.
- Documented RLS and access-control behavior for profiles, portfolios, usage, market/cache, Lab, and ad event tables.
- Documented critical security decisions from Phase 2B, including server-only `ad_events`, server-controlled profile plans, non-personal `chart_ai_cache`, and service-role-only usage function execution.
- Added an explicit remote application gate requiring a separate owner command.
- Reiterated that Phase 2C does not authorize any database changes.

### Safety Notes

- No SQL migration file was changed during Phase 2C.
- No local, disposable, branch, or remote database migration was applied.
- No remote Supabase command was run.
- Phase 2C should lead to owner review, disposable validation preparation, or a remote application plan only after explicit owner approval.

## Phase 2B - 2026-06-16

### Supabase SQL Review

- Reviewed `supabase/migrations/20260615_rebuild_schema_v0_1.sql` for table coverage, RLS shape, grants, function safety, and server-write boundaries.
- Confirmed all 14 required tables remain drafted.
- Confirmed `chart_ai_cache` remains non-personal and has no `user_id`.
- Hardened `profiles` so normal authenticated clients can insert only their own initial profile fields and update only editable columns.
- Kept profile plan changes server-controlled.
- Removed anonymous and authenticated insert access for `ad_events`; ad tracking is now documented as server-write only.
- Added explicit service-role table grants for server-side writes and newer Supabase Data API grant behavior.
- Revoked public client execution from `public.set_updated_at()`.
- Updated `internal.consume_chart_ai_usage(uuid, integer)` to return `remaining_count`.

### Validation Plan

- Added `docs/planning/supabase_local_validation_checklist_v0.1.md` for disposable database validation.
- Updated `docs/planning/supabase_schema_notes_v0.1.md` with SQL review results, RLS review, `ad_events` decision, `profiles` decision, and local validation steps.
- No remote Supabase command was run.
- No local database migration was applied because Supabase CLI and `psql` are not installed locally.

## Phase 2A - 2026-06-16

### Supabase Migration Draft

- Created `supabase/migrations/20260615_rebuild_schema_v0_1.sql` as a local-only migration draft.
- Created `docs/planning/supabase_schema_notes_v0.1.md` with review gates before any remote database application.
- Updated `docs/planning/api_db_spec_v0.1.md` with concrete schema decisions from the draft.
- Drafted tables for profiles, portfolios, portfolio positions, Chart AI usage, market caches, Lab datasets, and ad events.
- Enabled RLS on every public table in the draft.
- Added explicit grants for intended `anon` and `authenticated` Data API access paths.
- Added `public.set_updated_at()` and triggers for mutable tables.
- Added `internal.consume_chart_ai_usage(uuid, integer)` as a server-only draft function for atomic KST daily Chart AI usage tracking.

### Safety Notes

- No Supabase remote connection was used.
- No local or remote migration was applied.
- No database reset, drop, or destructive command was run.
- Supabase CLI was not installed locally, so no CLI dry-run was available.
- Phase 2B should review the SQL in a disposable local or branch database before any production application.

## Phase 1.2 - 2026-06-15

### Browser Smoke Check

- Ran normal `npm run build`; it exits with code 0.
- Confirmed `astro preview` is not supported by the installed Vercel adapter, so the local smoke check used the Astro dev server instead.
- Confirmed target route skeletons return usable pages:
  - `/`
  - `/chart-ai`
  - `/heatmap`
  - `/lab`
  - `/portfolio`
  - `/lab/congress-stocks`
  - `/lab/nps-portfolio`
  - `/lab/sp500-sectors`
  - `/lab/asset-class-returns`
- Confirmed removed legacy routes return 404 and do not expose old page markers:
  - `/seibro`
  - `/api/news`
  - `/api/list`
  - `/api/holdings`
  - `/api/stock`
  - `/api/etf`
  - `/api/search`

### Shell Validation

- Confirmed the primary nav contains only Home, Chart AI, Heatmap, Lab, and Portfolio.
- Confirmed the auth entry is visible and opens the login modal.
- Confirmed the light/dark theme toggle changes page state.
- Confirmed the slide ad and footer fixed ad render without blocking route checks.
- Replaced the external TradingView iframe ticker with a local static market ticker belt after the browser smoke check found an iframe listener console error.
- Confirmed the local ticker belt contains no crypto tickers.
- Confirmed the follow-up browser smoke check reports no console or page errors on initial shell load.

### Validation

- No requested provider secret markers were found in source or generated output.
- No removed legacy route strings were found in source or generated output.
- Ignored-file coverage was confirmed for `.env*`, `.vercel`, `dist`, `.astro`, `.omc`, and representative credential/key filenames.
- `.vercel/output/config.json`, `.vercel/output/functions/_render.func`, and `.vercel/output/static` remain generated by the normal build.
- Phase 2 can start from the stabilized IA shell after this commit.

## Phase 1.1 - 2026-06-15

### Build Stabilization

- Identified the Vercel adapter packaging failure root cause as a local Windows OneDrive file attribute issue.
- Generated build files inside the OneDrive workspace were marked as reparse-point entries, and Node recursive copy used by the Vercel adapter terminated during packaging.
- Kept `output: 'server'` for Vercel server-capable production behavior.
- Added local OneDrive detection in `astro.config.mjs` so local builds write Astro `outDir` to a normal temporary filesystem path outside OneDrive.
- Added `postbuild` script `scripts/repair-vercel-output.mjs` to populate `.vercel/output/static` from generated client assets when the adapter leaves static output empty.

### Validation

- `npm run build` now exits with code 0.
- `.vercel/output/config.json` is generated.
- `.vercel/output/functions/_render.func` is generated.
- `.vercel/output/static` contains generated static assets.
- No requested provider secret markers were found in source or generated output.
- Removed legacy route strings remain absent from source and generated output.
- Ignored-file coverage was confirmed for `.env*`, `.vercel`, `dist`, `.astro`, `.omc`, and representative credential/key filenames.
- No Hangul text was found in source, scripts, config, package metadata, or planning docs.

## Phase 1 - 2026-06-15

### Changed

- Replaced the legacy single-page menu shell with an explicit Astro route shell.
- Added target route skeletons:
  - `/`
  - `/chart-ai`
  - `/heatmap`
  - `/lab`
  - `/portfolio`
  - `/lab/congress-stocks`
  - `/lab/nps-portfolio`
  - `/lab/sp500-sectors`
  - `/lab/asset-class-returns`
- Rebuilt shared layout, header, auth modal entry points, nav, ticker belt, slide ad, footer fixed ad, theme handling, and base styles.
- Removed crypto tickers from the ticker belt.
- Simplified the Supabase helper to preserve browser auth entry points without legacy portfolio table helpers.

### Removed

- Removed obsolete Economic News API route.
- Removed obsolete Crypto News API route.
- Removed obsolete Seibro/Supply Analysis page and components.
- Removed legacy Naver stock and ETF proxy API routes used by the old menu shell.
- Removed the old single-page menu and word-cloud script.
- Removed the old crypto redirect file.

### Validation

- Ran normal `npm run build` only. No verbose Astro or Vite build was run.
- Astro and Vite generated `dist/client` and `dist/server`, but the command still exited with code 1.
- `.vercel/output/static` and `.vercel/output/server` were created, but `.vercel/output/config.json` and Vercel function folders were not written.
- The generated server entry imports successfully.
- No obsolete news, crypto news, Seibro, or removed API route strings were found in `src`, `public`, `dist/server`, or `dist/client`.
- No requested provider secret markers were found in `src`, `public`, `dist/client`, or `dist/server`.
- Ignored-file coverage was confirmed for `.env*`, `.vercel`, `dist`, `.astro`, `.omc`, and representative credential/key filenames.
- No Hangul text was found in `src`, `docs/planning`, or `.gitignore`.

### Remaining Build Risk

- The current build failure is classified as Vercel adapter output packaging after successful Astro/Vite bundling.
- It is not currently classified as a legacy route/module import failure because those routes were removed and the generated server entry imports successfully.
- If this persists in Phase 2, investigate Vercel adapter build-output generation and `@vercel/nft` packaging behavior with sanitized environment variables only.

## Phase 0.1 - 2026-06-15

### Safety Changes

- Hardened `.gitignore` so `.env.local`, `.env.*`, `.vercel/`, common key files, certificate bundles, credential files, and secret-named local files are ignored.
- Created and switched to the safe working branch `rebuild/phase-1-ia-shell` before any Phase 1 product-code work.
- Confirmed `git status --short` does not show `.env*`, `dist`, `.astro`, `.vercel`, or obvious secret-bearing files as staged or untracked.
- Confirmed ignored-path coverage with `git check-ignore` for `.env`, `.env.local`, `.env.production`, `.env.development`, `.vercel`, `dist`, `.astro`, and representative local credential filenames.

### Build Stabilization Notes

- Ran a normal `npm run build` only. No verbose Astro or Vite build was run during Phase 0.1.
- The normal build still exits with code 1 after Astro and Vite complete server/client artifact generation.
- The build output does not print an actionable error line.
- `dist/client` and `dist/server` are generated.
- `.vercel/output/static` and `.vercel/output/server` are created, but `.vercel/output/config.json` and Vercel function folders are not written.
- The built server entry imports successfully, so the current failure is not a generated server bundle import failure.
- Current evidence points to a Vercel adapter serverless output packaging failure after successful Astro/Vite bundling, not malformed legacy source code.

### Phase 1 Gate

- Phase 1 can start safely on `rebuild/phase-1-ia-shell`.
- Phase 1 should keep the first product-code block focused on replacing the legacy IA shell and then rerun a normal `npm run build`.
- If the Vercel adapter packaging failure remains after removing legacy routes, investigate adapter packaging, `@vercel/nft` tracing, and Vercel build-output generation without using verbose logs while real environment variables are loaded.

## v0.1 - 2026-06-15

### Added

- Created `docs/planning/` as the maintained planning document location.
- Added rebuild plan, screen specification, API and DB specification, development roadmap, execution prompt, and changelog.
- Documented target navigation: Home, Chart AI, Heatmap, Lab, Portfolio.
- Documented Lab routes for Congress Stocks, NPS Portfolio, S&P 500 Sectors, and Asset-Class Returns.
- Documented Supabase schema target and RLS baseline.
- Documented server-only provider environment variables.
- Documented phase roadmap from Phase 0 through Phase 10.

### Phase 0 Audit Findings

- Current app is an Astro project with Vercel server output.
- Current source contains legacy news, crypto news, and Seibro supply-analysis features.
- Current source contains portfolio and Supabase Auth functionality worth preserving and rebuilding.
- Current source includes slide and footer fixed ad components that should be preserved.
- Current source contains mojibake, malformed strings, and malformed markup that are likely to block builds.
- Dependencies were already installed; `npm install` was not required during Phase 0.

### Key Decisions

- Remove Economic News, Crypto News, and old Supply Analysis functionality during Phase 1.
- Preserve Supabase Auth, Vercel deployment, portfolio concept, ticker belt, slide ad, and footer fixed ad.
- Exclude crypto from the main product.
- Allow Bitcoin only in the Lab asset-class returns page.
- Require login for Chart AI execution and Portfolio.
- Keep Lab pages public.
- Use server-only wrappers for KIS, OpenDART, OpenAI, and Gemini.

### Validation Log

- `npm ls --depth=0` resolved declared dependencies.
- `npm run build` generated Astro/Vite server and client artifacts but returned exit code 1 without an actionable error line in the normal captured output.
- `npm run build -- --verbose` also returned exit code 1 and exposed resolved environment variables in logs. Do not use verbose builds while real secrets are loaded.
- Secret-name search across `src`, `public`, `dist`, and `.astro` found no matches for `KIS_APP_SECRET`, `KIS_APP_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, or `OPENDART_API_KEY`.
- Additional file-name search found no matches in `src`, `public`, `dist`, or `.astro` for service-role markers `SUPABASE_SERVICE_ROLE_KEY`, `KIS_SECRET_KEY`, or `sb_secret`.
- `docs/planning/` contains no Hangul text.
- Obsolete routes and generated artifacts for news, crypto, and Seibro remain present. Removal is assigned to Phase 1.
