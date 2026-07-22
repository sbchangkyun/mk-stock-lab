# Phase 3AW — My Page Account/Notification Shell Revision + Legal Footer Fix v0.1

## 1. Title and Metadata

- **Phase**: 3AW
- **Type**: My Page account/notification shell revision and legal footer layout fix
- **Status**: Implemented
- **Scope**: UI shell revision, legal placeholder footer layout fix, logout redirect fix
- **Actual account deletion**: not implemented
- **Notification persistence**: not implemented
- **Telegram integration**: not implemented
- **Subscription integration**: not implemented
- **Backend changes**: none
- **Deployment**: not performed
- **Date**: 2026-06-23

---

## 2. Objective

Phase 3AW resolves owner browser-review findings from Phase 3AV and refines the My Page MVP shell. The phase addresses four specific owner observations: abnormal footer layout on short /privacy and /terms pages, /mypage account row structure revisions, new notification settings shell, and logout redirect behavior. No destructive backend behavior or persistent notification state is introduced.

---

## 3. Browser Review Issues Addressed

| Finding | Resolution |
|---|---|
| /privacy and /terms footer abnormal layout | Sticky footer via `body { display: flex; flex-direction: column; min-height: 100vh }` + `site-main { flex: 1 0 auto }` |
| /mypage account row revisions | Revised account summary rows (see section 4) |
| /mypage service/data row revisions | Service section streamlined to 공지사항 and 이벤트/혜택; data section to 포트폴리오 and 관심 종목 |
| New notification settings shell | Added 알림 설정 section with 6 entries |
| Logout from /mypage does not redirect | Added `window.location.assign('/')` to logout handler — now applies globally after sign-out |

---

## 4. Implementation Summary

### Footer/layout fix

- Added `min-height: 100vh; display: flex; flex-direction: column;` to `body` rule in `style.css`.
- Added `flex: 1 0 auto;` to `.site-main` rule.
- Effect: on short pages like /privacy and /terms, the main content area grows to fill the viewport, pushing the `bottom-document-area` (ad banner + footer) to the true bottom of the viewport. Footer remains compact and properly anchored.
- `SlideAd` is `position: fixed` and is unaffected by the flex layout change.
- `Nav` with `position: sticky` remains functional within the flex column body.

### Privacy/terms after fix

- No content changes to `/privacy` or `/terms` pages.
- Short placeholder content now fills the viewport, with footer at the bottom.

### Account summary revisions (`src/pages/mypage.astro`)

| Row | Change |
|---|---|
| 이메일 | Now populated from existing client-side `supabase.auth.getSession()` if available; falls back to "로그인 계정 확인 중" |
| 로그인 방식 | Changed from placeholder "준비 중" to literal "Google 로그인" |
| 가입일 | Unchanged, "확인 예정" placeholder |
| 계정 상태 | **Removed** |
| 마지막 접속 일시 | **Added** — populated from `user.last_sign_in_at` if available, else "확인 예정" |
| 구독 상태 | **Added** — displays "구독 안함" (no billing/subscription lookup) |

### Service section revisions

- Removed: 기본 시작 페이지, 기본 시장, 화면 테마, 시세 카드 표시 설정
- Added: 공지사항 (준비 중), 이벤트/혜택 (향후 제공 예정)

### Data section revisions

- Removed: 최근 활동, 데이터 관리
- Kept: 포트폴리오 (향후 제공 예정), 관심 종목 (향후 제공 예정)

### Notification settings section (new)

Six entries in the new 알림 설정 section:

| Entry | Type | State |
|---|---|---|
| 내 텔레그램 연동 | Description + badge | 준비 중 |
| 관심종목 뉴스 알림 | Toggle (checkbox UI) | Not persisted |
| 내 포트 종목 뉴스 알림 | Toggle | Not persisted |
| 관심종목 지정가 알림 | Block with + add form | UI-only, 최대 5개, save shows "저장 기능은 준비 중입니다." |
| 이벤트/혜택 알림 | Toggle | Not persisted |
| 공지사항 알림 | Toggle | Not persisted |

Toggles are native `<input type="checkbox">` with CSS styling. No backend, no localStorage, no sessionStorage.

### Logout redirect update (`src/components/Header.astro`)

- Added `window.location.assign('/')` after `supabase.auth.signOut()` and `syncProfileBootstrap(null)` in the logout click handler.
- Applies to all pages — consistent logout behavior across the app.
- Does not affect `onAuthStateChange` listener behavior.

### CSS additions (`src/styles/style.css`)

- Sticky footer: `body` and `.site-main` rule updates.
- Notification section: `.mp-notif-row`, `.mp-notif-block`, `.mp-notif-block-header`, `.mp-notif-desc`, `.mp-toggle`, `.mp-toggle-input`, `.mp-toggle-track`, `.mp-add-btn`, `.mp-alert-form`, `.mp-alert-form-row`, `.mp-alert-input`, `.mp-alert-save-btn`, `.mp-alert-notice`.

### Static validation updates

- `scripts/check_mypage_shell_static_contract.mjs` — rewritten for Phase 3AW: 40 checks covering revised account rows, removed rows (negative checks), new notification section entries, unchanged legal/withdrawal checks, and safety boundaries.
- `scripts/check_header_footer_shell_static_contract.mjs` — added 1 check: "Logout handler redirects to Home after sign-out" (now 26 total checks).

---

## 5. Account Data Boundary

- Email uses the existing client-side `supabase.auth.getSession()` read (same API already used by Header.astro). No new backend auth API.
- Login method displays static "Google 로그인" — no live provider lookup.
- Last access time uses `user.last_sign_in_at` from the existing session object — display-only, not persisted separately.
- Subscription state displays static "구독 안함" — no billing/subscription API.

---

## 6. Notification Boundary

- Notification settings are UI shell only.
- Telegram linkage is a placeholder — no bot API, no token storage.
- Toggle checkboxes are native browser state — not persisted to backend or localStorage.
- Target-price alert form is UI-only — "저장 기능은 준비 중입니다." shown on save attempt, no API call, no data stored.
- No notification delivery exists.
- No quote API called by the alert UI.
- No Supabase writes occur.

---

## 7. Account Deletion Boundary

- 회원탈퇴 confirmation UI remains non-destructive.
- Required confirmation message remains exact: `정말 회원 탈퇴하시겠습니까? 회원탈퇴하면 등록/활동 정보가 모두 삭제됩니다.`
- 확인 shows "회원탈퇴 기능은 준비 중입니다." — does not delete anything.
- No backend deletion exists.

---

## 8. Validation Results

```
npm run check:mypage-shell        →  40/40 PASS  Exit 0
npm run check:header-footer-shell →  26/26 PASS  Exit 0
npm run check:market-quote-card   →  32/32 PASS  Exit 0
npm run build                     →  Complete! (3.32s)
git diff --check                  →  No errors (Windows CRLF warnings only)
git status --short                →  5 modified (all expected Phase 3AW files)
```

---

## 9. Owner Browser Review Checklist

- [ ] /privacy footer no longer abnormally expands — footer is at the viewport bottom.
- [ ] /terms footer no longer abnormally expands — footer is at the viewport bottom.
- [ ] Footer remains compact and aligned on both pages.
- [ ] 제휴문의 still opens Google Form correctly.
- [ ] /mypage email displays actual signed-in email or "로그인 계정 확인 중" fallback.
- [ ] 로그인 방식 shows "Google 로그인".
- [ ] 계정 상태 row is removed.
- [ ] 마지막 접속 일시 row is visible.
- [ ] 구독 상태 row shows "구독 안함".
- [ ] 서비스 이용 설정 section shows 공지사항 and 이벤트/혜택 only.
- [ ] 내 데이터 section no longer shows 최근 활동 or 데이터 관리.
- [ ] 알림 설정 section is visible.
- [ ] 내 텔레그램 연동 placeholder is visible with "준비 중" badge.
- [ ] 관심종목 뉴스 알림 toggle is visible and clickable.
- [ ] 내 포트 종목 뉴스 알림 toggle is visible and clickable.
- [ ] 관심종목 지정가 알림 section is visible with "최대 5개" badge.
- [ ] + 추가 button reveals the input form.
- [ ] 저장 button shows "저장 기능은 준비 중입니다." — no data saved.
- [ ] 이벤트/혜택 알림 toggle is visible.
- [ ] 공지사항 알림 toggle is visible.
- [ ] 회원탈퇴 confirmation still works as before.
- [ ] 확인 remains non-destructive ("회원탈퇴 기능은 준비 중입니다.").
- [ ] Clicking 로그아웃 from /mypage redirects to Home (/).
- [ ] Header and footer remain intact.
- [ ] Page has no horizontal scroll on desktop.
- [ ] No raw error/secret-like text visible.

---

## 10. Remaining Limitations

- Notification settings are not persisted (no backend, no localStorage).
- Telegram integration is not implemented.
- Subscription/billing integration is not implemented.
- Last access time shows `last_sign_in_at` from the current session — not a separately persisted "last access" value.
- Real account deletion remains blocked (Phase 3AX policy decision required).
- Privacy/Terms final content is still pending owner-provided legal text.

---

## 11. Recommended Next Steps

1. Owner browser review of /privacy, /terms (footer fix), /mypage (all revisions), and logout redirect.
2. Return to Chart AI data contract and indicator engine work.
3. Account deletion backend policy decision can be deferred — the UI shell is already in place.

---

## 12. Confirmed Non-Actions

- No API route logic changed.
- No KIS provider logic changed.
- No KIS runtime guard changed.
- No Supabase backend logic changed.
- No Vercel config changed.
- No live KIS call.
- No live Supabase query or write by Claude Code.
- No SQL executed.
- No Vercel CLI command run.
- No Vercel env mutation.
- No deployment performed.
- No deployed URL called.
- No `.env*` content read.
- No auth/session behavior changed (except redirect after explicit logout).
- No account deletion backend implemented.
- No database deletion implemented.
- No notification backend implemented.
- No Telegram backend implemented.
- No subscription/billing backend implemented.
- No Production KIS enabled.
- No account, order, trading, balance, holdings, or WebSocket feature implemented.
- No actual symbol, price, Preview URL, bypass secret, token, raw KIS field, raw error, or stack trace recorded.
- Claude memory files not modified.
- Root README.md not modified.
