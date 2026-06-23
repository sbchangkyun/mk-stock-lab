# Phase 3AV — My Page MVP Shell Result v0.1

## 1. Title and Metadata

- **Phase**: 3AV
- **Type**: My Page MVP Shell Implementation
- **Status**: Implemented
- **Scope**: /mypage UI shell and account deletion confirmation UI only
- **Actual account deletion**: not implemented
- **Backend deletion**: not implemented
- **Live Supabase**: not used
- **Deployment**: not performed
- **Date**: 2026-06-23

---

## 2. Objective

Phase 3AV replaces the placeholder My Page route (added in Phase 3AU) with a lightweight account page shell. The page provides a structured five-section layout covering account summary, service preferences, data summary, legal/support links, and a danger zone with a UI-only 회원탈퇴 confirmation flow. All destructive operations remain blocked pending Phase 3AW policy decision.

---

## 3. Implementation Summary

### /mypage sections implemented

| Section | Heading | Notes |
|---|---|---|
| A | 내 계정 | Placeholder values: 로그인된 사용자, 준비 중, 확인 예정, 활성 |
| B | 서비스 이용 설정 | 4 rows: 기본 시작 페이지, 기본 시장, 화면 테마, 시세 카드 표시 설정 — all "향후 제공 예정" |
| C | 내 데이터 | 4 rows: 포트폴리오, 관심 종목, 최근 활동, 데이터 관리 — all "준비 중" |
| D | 법적 고지 및 지원 | Links to /privacy, /terms, and partnership Google Form |
| E | 계정 관리 | Danger zone with 회원탈퇴 button and confirmation UI |

### Legal/support links

- 개인정보처리방침 → `/privacy`
- 이용약관 → `/terms`
- 제휴문의 → `https://forms.gle/WAVSxaotdes6T5yJA` (`target="_blank"` `rel="noopener noreferrer"`)

### Danger zone

- Section border uses `var(--negative)` to visually distinguish it.
- Section title "계정 관리" is colored `var(--negative)` as an additional non-color signal.
- Button `회원탈퇴` uses outline-only danger styling (border: 1px solid var(--negative), background: transparent).
- No destructive verbs in code paths beyond UI labels.

### 회원탈퇴 confirmation UI-only behavior

- Clicking 회원탈퇴 reveals an inline confirmation panel (not a browser dialog).
- Confirmation panel uses `role="alertdialog"` and `aria-modal="true"` for accessibility.
- Required exact confirmation message is shown:
  `정말 회원 탈퇴하시겠습니까? 회원탈퇴하면 등록/활동 정보가 모두 삭제됩니다.`
- 확인 button: hides confirmation panel, shows "회원탈퇴 기능은 준비 중입니다." — no API call, no data mutation.
- 취소 button: hides confirmation panel, returns focus to 회원탈퇴 button — no action.
- `aria-live="polite"` on the notice message for screen reader announcement.

### Static validation script and package command

- `scripts/check_mypage_shell_static_contract.mjs` — 23 checks across five groups.
- `package.json` — added `"check:mypage-shell": "node scripts/check_mypage_shell_static_contract.mjs"`.

### CSS additions

Added to `src/styles/style.css` (end of file):
- `.mp-sections` — grid layout, max-width 680px
- `.mp-section-title` — section heading style
- `.mp-info-list`, `.mp-info-row`, `.mp-placeholder` — account summary dl/dt/dd
- `.mp-pref-list`, `.mp-pref-row`, `.mp-pref-label`, `.mp-badge` — preference row list
- `.mp-link-list` — legal links list
- `.mp-danger-zone`, `.mp-danger-title`, `.mp-danger-desc`, `.mp-danger-btn` — danger zone
- `.mp-withdrawal-confirm`, `.mp-withdrawal-message`, `.mp-withdrawal-actions` — confirmation panel
- `.mp-confirm-btn`, `.mp-withdrawal-notice` — confirm button and prepared message

---

## 4. Account Deletion Boundary

- 회원탈퇴 confirmation UI exists in the danger zone.
- Required confirmation message is implemented verbatim.
- 확인 and 취소 choices are present.
- 확인 does not delete any data — it shows "회원탈퇴 기능은 준비 중입니다."
- No backend deletion API exists.
- No Supabase auth.admin.deleteUser call exists.
- Actual deletion remains blocked pending Phase 3AW policy decision and explicit owner approval.

---

## 5. Preserved Boundaries

- No auth/session behavior changed.
- No database deletion implemented.
- No Supabase mutation implemented.
- No API route logic changed.
- No KIS provider logic changed.
- No KIS runtime guard changed.
- No Vercel config changed.
- No live network calls made.
- No real account data fetched.
- No localStorage or sessionStorage used in mypage.astro.

---

## 6. Static Validation Summary

| Script | Checks | Result |
|---|---|---|
| `check:mypage-shell` | 23 | All PASS |
| `check:header-footer-shell` | 25 | All PASS |
| `check:market-quote-card` | 32 | All PASS |

---

## 7. Validation Results

```
npm run check:mypage-shell       →  23/23 PASS  Exit 0
npm run check:header-footer-shell →  25/25 PASS  Exit 0
npm run check:market-quote-card  →  32/32 PASS  Exit 0
npm run build                    →  Complete! (3.11s)
git diff --check                 →  No errors (Windows CRLF warnings only)
git status --short               →  3 modified, 1 untracked (all expected Phase 3AV files)
```

---

## 8. Owner Browser Review Checklist

- [ ] 마이페이지 header button (signed-in state) routes to /mypage.
- [ ] /mypage loads without error.
- [ ] 내 계정 section is visible with placeholder rows.
- [ ] 서비스 이용 설정 section is visible with "향후 제공 예정" badges.
- [ ] 내 데이터 section is visible with "준비 중" badges.
- [ ] 법적 고지 및 지원 section shows all three links.
- [ ] 개인정보처리방침 link navigates to /privacy.
- [ ] 이용약관 link navigates to /terms.
- [ ] 제휴문의 link opens the Google Form in a new tab.
- [ ] 회원탈퇴 button is visible in the danger zone (계정 관리 section).
- [ ] Clicking 회원탈퇴 shows the confirmation panel with the exact required message.
- [ ] 취소 closes the confirmation panel without any action.
- [ ] 확인 closes the confirmation panel and shows "회원탈퇴 기능은 준비 중입니다." — no deletion occurs.
- [ ] Footer and header remain intact on /mypage.
- [ ] Page layout has no horizontal scroll on desktop.
- [ ] No raw error text, secret-like content, or token visible on the page.

---

## 9. Remaining Limitations

- Real user account data (email, join date, login method) is not connected — all placeholder values.
- Service preferences are not persisted.
- My data counts are placeholder values — no database reads.
- Actual account deletion is not implemented.
- Account deletion backend policy remains undecided (Phase 3AW).
- Privacy/Terms final content remains pending owner input.

---

## 10. Recommended Next Steps

1. Owner browser review of /mypage shell (see checklist above).
2. Phase 3AW: Account deletion backend policy decision (soft-delete vs. hard-delete vs. grace period).
3. Actual deletion implementation only after Phase 3AW is completed and explicitly owner-approved.
4. When owner provides Privacy/Terms content, replace placeholder text in /privacy and /terms pages.

---

## 11. Confirmed Non-Actions

- No API route logic changed.
- No KIS provider logic changed.
- No KIS runtime guard changed.
- No Supabase logic changed.
- No Vercel config changed.
- No live KIS call.
- No live Supabase query or write.
- No SQL executed.
- No Vercel CLI command run.
- No Vercel env mutation.
- No deployment performed.
- No deployed URL called.
- No `.env*` content read.
- No auth/session behavior changed.
- No account deletion backend implemented.
- No database deletion implemented.
- No Production KIS enabled.
- No account, order, trading, balance, holdings, or WebSocket feature implemented.
- No actual symbol, price, Preview URL, bypass secret, token, raw KIS field, raw error, or stack trace recorded.
- Claude memory files not modified.
- Root README.md not modified.
