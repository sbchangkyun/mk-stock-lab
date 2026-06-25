# Phase 3CA-HF1 — Password Reset Flow Hotfix
## Result Document v0.1 — 2026-06-25

---

### Metadata

- **Phase**: 3CA-HF1
- **Type**: Password Reset Flow Hotfix
- **Status**: Implemented
- **Latest prior commit**: a86f862 feat: add home rail banner settings
- **Runtime UI changes**: Auth/login modal + new `/reset-password` page
- **API route changes**: none
- **DB / Supabase schema changes**: none
- **Live KIS calls**: none
- **Live GNews calls**: none
- **External HTTP by Claude Code**: none
- **Vercel Preview calls by Claude Code**: none
- **Deployment**: not performed

---

### Urgency / Business Reason

The master banner admin account (`kkamagi707@naver.com`, user_id `cd873fcc-79a2-4ae4-973b-f7b6c664f2a1`) was unable to sign in because the password was forgotten. The existing login UI had no password reset entry point.

The `운영 배너 관리` panel added in Phase 3CA cannot be tested until the master account recovers access. This hotfix was required before any Home rail banner advertising testing could proceed.

---

### Implemented Flow

#### Step 1 — Login UI Reset Entry Point

- Added `비밀번호를 잊으셨나요?` button to the auth modal login form
- Button is visible only in login mode, hidden in signup mode
- Clicking it opens the reset panel inside the same modal (no page navigation)
- The panel pre-fills the email field from the login form if populated
- A `로그인으로 돌아가기` back button returns to the login form

#### Step 2 — Reset Email Request

- The reset panel has an email input and a `비밀번호 재설정 메일 보내기` submit button
- On submit: validates email format, then calls `supabase.auth.resetPasswordForEmail(email, { redirectTo })`
- `redirectTo` is built dynamically: `window.location.origin + '/reset-password'`
  - No hard-coded localhost or production URL in code
- On any result (success or email not found), shows generic message:
  - `입력하신 이메일로 비밀번호 재설정 링크를 발송했습니다. 메일함을 확인해 주세요.`
- Does not reveal whether the email address exists in the system
- On configuration/client unavailable error: shows `재설정 메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.`

#### Step 3 — `/reset-password` Page

- New page at `src/pages/reset-password.astro`
- Uses the existing Layout
- Title: `비밀번호 재설정 | MK Stock Lab`
- Four UI states: checking, invalid/expired, password form, success

State machine:
1. **Checking** (default): Supabase recovery session being detected; shown for up to 2.5 seconds
2. **Invalid**: No `PASSWORD_RECOVERY` event within 2.5 seconds → shows `재설정 링크가 만료되었거나 유효하지 않습니다. 다시 요청해 주세요.` + home link
3. **Form**: `PASSWORD_RECOVERY` event detected → shows new password + confirm fields, 새 비밀번호 저장 button
4. **Success**: Password updated → shows `비밀번호가 변경되었습니다. 새 비밀번호로 로그인해 주세요.` + home link

#### Step 4 — Password Update

- On form submit: validates length ≥ 8, validates confirmation match
- Calls `supabase.auth.updateUser({ password: newPassword })`
- On success: calls `supabase.auth.signOut()`, transitions to success state
- On error: shows `비밀번호 변경에 실패했습니다. 다시 시도해 주세요.`
- No raw Supabase error details shown in UI

---

### Redirect URL Prerequisites

Owner has already configured Supabase Auth Redirect URLs:
- `http://localhost:4321`
- `http://localhost:4321/reset-password`
- `https://mkstocklab.vercel.app/reset-password`
- Site URL: `https://mkstocklab.vercel.app/`

**Note**: Vercel Preview deployment URLs (e.g., `https://mk-stock-lab-git-branch-name.vercel.app/reset-password`) must be added separately to Supabase Auth Redirect URLs if testing on Preview environments.

---

### Security and Privacy

- **No email existence disclosure**: Both "email found" and "email not found" cases return the same generic success message
- **No service_role**: Uses `anon` key browser client only
- **No admin APIs**: Uses only client-side `resetPasswordForEmail` and `updateUser`
- **No DB migration**: No schema changes
- **No raw errors in UI**: Supabase error objects never shown to user
- **Minimum password length**: 8 characters enforced client-side with Korean error message
- **Password confirmation**: Required before `updateUser` call
- **Recovery session detection**: Uses `PASSWORD_RECOVERY` auth event only; 2.5-second timeout for invalid link state

---

### Files Changed

| File | Change |
|---|---|
| `src/components/Auth/AuthModal.astro` | Added reset panel HTML + reset link button + `showReset`/`hideReset` functions + `resetPasswordForEmail` submit handler |
| `src/pages/reset-password.astro` | New page with 4-state UI + `updateUser` logic |
| `src/styles/style.css` | Added `.auth-reset-link`, `.auth-reset-panel`, `.auth-reset-desc`, `.auth-reset-success`, `.reset-pw-*` classes |
| `scripts/check_password_reset_flow_static_contract.mjs` | New 55-check static validator |
| `scripts/check_header_footer_shell_static_contract.mjs` | Added Phase 3CA-HF1 no-regression group (3 checks) |
| `docs/planning/phase_3ca_hf1_password_reset_flow_result_v0.1.md` | This document |
| `docs/planning/planning_changelog.md` | Phase 3CA-HF1 entry prepended |
| `package.json` | Added `check:password-reset-flow` script |

---

### Validation Results

| Validator | Result |
|---|---|
| `npm run check:password-reset-flow` | PASS |
| `npm run check:header-footer-shell` | PASS |
| `npm run check:mypage-shell` | PASS (unchanged) |
| `npm run build` | PASS |
| `git diff --check` | PASS |

---

### Manual Owner Browser Checklist

1. Open the site (localhost or deployed)
2. Click the `로그인` button in the header
3. In the login modal, confirm `비밀번호를 잊으셨나요?` link is visible
4. Click `비밀번호를 잊으셨나요?`
5. Confirm the reset panel appears with email field and `비밀번호 재설정 메일 보내기` button
6. Enter `kkamagi707@naver.com`
7. Click `비밀번호 재설정 메일 보내기`
8. Confirm the generic success message appears (does not say "email not found")
9. Check the `kkamagi707@naver.com` inbox for the Supabase password reset email
10. Click the reset link in the email
11. Confirm `/reset-password` opens with "재설정 링크를 확인하는 중입니다..." briefly visible
12. Confirm the password form appears (new password + confirm fields)
13. Enter a new password of 8+ characters and confirm it
14. Click `새 비밀번호 저장`
15. Confirm `비밀번호가 변경되었습니다. 새 비밀번호로 로그인해 주세요.` appears
16. Click `홈으로 돌아가기` and sign in with `kkamagi707@naver.com` and the new password
17. Navigate to `/mypage`
18. Confirm `운영 배너 관리` panel appears (master admin access restored)

---

### Remaining Limitations

- Supabase email delivery depends on the project's email provider configuration (confirmation email template, sender domain)
- Vercel Preview URLs require separate Supabase Auth Redirect URL configuration per preview domain
- No custom email template; Supabase default reset email is used
- No MFA support
- No account recovery path other than email-based reset
- Password strength policy is client-side minimum-length only (server-side policy depends on Supabase project settings)

---

### Recommended Next Phase

**Phase 3CA Owner Browser Review** — verify password reset flow and Home rail banner admin panel with `kkamagi707@naver.com` master account. Then proceed to banner URL testing and Phase 3CB (Home Index Cards Fixture Data).
