# Phase 3CD — MyPage MVP Completion
## Result Document v0.1 — 2026-06-26

---

### Metadata

- **Phase**: 3CD
- **Type**: MyPage MVP Completion
- **Status**: Implemented
- **Latest prior commit**: 01d1141 data: expand security metadata coverage
- **Runtime UI changes**: MyPage cleanup only — removed `내 데이터` card
- **API route changes**: none
- **DB / Supabase schema changes**: none
- **Live KIS calls**: none
- **Live GNews calls**: none
- **External HTTP by Claude Code**: none
- **Vercel Preview calls by Claude Code**: none
- **Deployment**: not performed

---

### Owner Requirement

Owner review found that the `내 데이터` card (showing `포트폴리오` and `관심 종목` rows both labeled `향후 제공 예정`) added no value and made the page feel like an unfinished placeholder dashboard. The owner explicitly requested its removal.

Goal: MyPage should feel like a clean, intentional MVP — presenting what the user actually has access to, not advertising a roadmap of unbuilt features.

---

### Implementation Summary

**Single targeted removal.** The `내 데이터` card section was removed from `src/pages/mypage.astro`. No other runtime logic was changed. All preserved sections remain untouched.

#### Modified Files

| File | Change |
|---|---|
| `src/pages/mypage.astro` | Removed `내 데이터` card section (HTML block, 14 lines) |
| `scripts/check_mypage_shell_static_contract.mjs` | Updated data section checks: presence→absence for `내 데이터`; added explicit absence checks for removed rows |
| `scripts/check_mypage_mvp_completion_static_contract.mjs` | New focused checker (12 groups, 79 checks) |
| `package.json` | Added `check:mypage-mvp` script |
| `docs/planning/planning_changelog.md` | Phase 3CD entry prepended |

---

### Removed Content

| Item | Type | Reason |
|---|---|---|
| `내 데이터` heading and card | Section | Owner request — no immediate value |
| `포트폴리오` row (`향후 제공 예정`) | List item | Was inside removed card |
| `관심 종목` row (`향후 제공 예정`) | List item | Was inside removed card |

Portfolio and interest-tracking features are represented by the actual Portfolio page and the notification section's watchlist alert feature — a redundant placeholder card does not add to the MVP.

---

### Preserved Behavior

**Account card** (`내 계정`):
- 이메일 (email from session)
- 로그인 방식 (dynamically resolved from `user.identities` array with `app_metadata.provider` fallback)
- 가입일 (placeholder — `확인 예정`)
- 마지막 접속 일시 (from `user.last_sign_in_at`)
- 구독 상태 (`구독 안함`)

**Login method resolver** (Phase 3CA-HF2):
- `이메일 로그인`, `Google 로그인`, `이메일 + Google`, `확인 불가`
- No hard-coded Google label; no email domain inference
- Reads from `user.identities` array first, then `app_metadata.provider` fallback

**Password reset** (Phase 3CA-HF1):
- `AuthModal.astro` reset link untouched
- `reset-password.astro` flow untouched

**Master-only banner admin** (Phase 3CA / 3CA-HF2 / 3CA-HF3):
- `운영 배너 관리` panel in `mp-admin-rail` aside
- Hidden by default via `hidden` attribute
- Revealed only when `isCurrentUserSiteAdmin()` confirms master role
- Two-column page layout (`mp-page-layout--admin-visible`) activated on desktop (≥1300px) only for admin
- Non-admin users: no empty right column
- Accordion collapse/expand with `aria-expanded`
- 3 banner slots with imageUrl/linkUrl/alt/active controls
- Save/reload flow with URL validation and preview
- No file upload, no click/impression tracking

**Notification section** (`알림 설정`):
- 내 텔레그램 연동 (준비 중)
- 관심종목 뉴스 알림 watchlist shell (in-memory, max 5)
- 내 포트 종목 뉴스 알림 toggle
- 관심종목 지정가 알림 toggle + form (UI only)
- 이벤트/혜택 알림 toggle
- 공지사항 알림 toggle

**Legal/support** (`법적 고지 및 지원`):
- 개인정보처리방침, 이용약관, 제휴문의

**Account management** (`계정 관리`):
- 회원탈퇴 placeholder with confirmation dialog and `준비 중` notice

---

### Safety and Scope

- No DB migration added
- No Supabase schema/storage change
- No API route added or modified
- No account deletion backend added
- No notification backend added
- No live KIS/GNews/external HTTP
- No image upload
- No click/impression tracking
- No setInterval/polling/cron added
- No `.env` reads
- No SQL executed
- No Home/Portfolio/Chart AI/Market/Lab files modified

---

### Validation Results

| Validator | Result |
|---|---|
| `npm run check:mypage-mvp` | PASS (79/79) |
| `npm run check:mypage-shell` | PASS |
| `npm run check:password-reset-flow` | PASS |
| `npm run check:home-rail-banner-settings` | PASS |
| `npm run build` | PASS |
| `git diff --check` | PASS |
| `git status --short` | Clean (only known pre-existing untracked files) |

---

### Manual Owner Checklist

1. Log in and open `/mypage`
2. **`내 데이터` card is gone** — no `포트폴리오` or `관심 종목` placeholder rows visible
3. **`내 계정` card remains** — email, login method, join date placeholder, last access, subscription status all visible
4. **Login method correct** — shows `이메일 로그인`, `Google 로그인`, or `이메일 + Google` depending on your account
5. **`알림 설정` section remains** — notification toggles and watchlist form still present
6. **`법적 고지 및 지원` remains** — 개인정보처리방침, 이용약관, 제휴문의 links work
7. **`계정 관리` remains** — `회원탈퇴` button opens confirmation dialog; clicking 확인 shows `준비 중` notice
8. **`운영 배너 관리` still appears for master admin** — banner accordion toggles; slots save/load; no sample flash in Home rail
9. **Non-admin account** — no empty right column on MyPage (mp-admin-rail stays hidden)
10. **Password reset** — Login modal still shows `비밀번호를 잊으셨나요?` link; reset flow works

---

### Remaining Limitations

- No real notification backend — all toggles are UI-only; no push/email/SMS
- No actual account deletion — `회원탈퇴` shows `준비 중`
- No full profile editing (username, avatar, etc.)
- No billing/subscription management
- No join date populated yet (shows `확인 예정`)
- No MyPage activity history

---

### Recommended Next Phase

**Option A — Phase 3DE: Chart AI UX Skeleton Enhancement**
- Improve Chart AI analysis flow: search input, state messaging, chart placeholder polish
- No live API required for the skeleton pass
- High visibility product milestone for the analysis entry flow

**Option B — Phase 3DE: Lab Menu Static Module Shells**
- Add static shells for planned Lab sections (sector returns, national pension holdings, etc.)
- Removes the "under construction" feel of Lab page quickly
- Low risk; pure static HTML/CSS work

**Recommendation**: Phase 3DE Chart AI UX Skeleton if the next milestone is the analysis flow; Lab static shells if the goal is removing placeholder-heavy sections from multiple pages quickly.
