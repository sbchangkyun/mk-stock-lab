# Phase 3AT Account Navigation, My Page, Footer Legal Links Roadmap v0.1

## 1. Title and Metadata

- **Phase**: 3AT
- **Type**: Account navigation, My Page, and footer legal-link roadmap
- **Status**: Planned
- **Implementation changes**: none
- **Source changes**: none
- **Deployment**: not performed
- **Scope**: Planning only
- **Date**: 2026-06-23

---

## 2. Objective

Phase 3AT captures the owner's new requirements for:
- A "마이페이지" button in the logged-in top-right header controls
- A My Page MVP structure proposal
- Required account deletion UX with exact owner-specified confirmation copy
- Footer layout change: remove YouTube; add copyright version, 개인정보처리방침, 이용약관, and 제휴문의

This document is planning only. No source code, styles, API routes, auth logic, database, or Vercel configuration is changed in this phase.

---

## 3. Header Navigation Requirement

### Current logged-in header controls

From [src/components/Header.astro](src/components/Header.astro):

```
Today: 000  |  [theme toggle]  |  [로그아웃]
```

The logout button (`#logout-btn`) is shown only in the signed-in state via `updateAuthButtons`. The login button (`#open-login-btn`) is hidden. Auth state is signalled via `auth-hint-signed-in` / `auth-hint-signed-out` CSS classes on `<html>` and a `mk:auth-state` custom event.

### Requirement

Add a "마이페이지" button to the logged-in top-right controls.

### Recommended control order (logged-in)

```
Today: 000  |  [theme toggle]  |  [마이페이지]  |  [로그아웃]
```

### Implementation notes for the future phase

- Add a new `<a>` or `<button>` element with id `mypage-btn` (or similar) and initial class `hidden`, adjacent to `#logout-btn`.
- In `updateAuthButtons`, add `mypage-btn` to the show/hide logic: show when `signed_in`, hide when `signed_out` or `unavailable`. This mirrors the existing `#logout-btn` pattern.
- Route: `/mypage` (a new Astro page `src/pages/mypage.astro`).
- Use an `<a href="/mypage">` element styled with the existing `.header-button` class so it matches the logout button style.
- Must preserve existing header layout and mobile responsiveness. No new CSS grid areas needed — the new link can be inserted inline in `.header-actions`.
- The `마이페이지` button must be invisible until auth state confirms `signed_in`. No flash of visible state before auth check.

---

## 4. My Page MVP Proposal

The My Page should be a lightweight shell that grows with the app. Do not overbuild settings UI until the auth/data schema is confirmed.

Recommended path: `/mypage`  
Recommended file: `src/pages/mypage.astro`

### A. Account summary

| Field | Source | Notes |
|---|---|---|
| User email | Supabase session | Primary identifier |
| Display name / nickname | Supabase `user_metadata` or profiles table | If available |
| Login method | `supabase.auth.getSession()` provider | e.g., email, Google |
| Join date | `created_at` from session or profiles table | Format as Korean date if available |
| Account status | Active / placeholder | Placeholder until deletion flow is implemented |

### B. Service preferences

- Theme preference (light/dark) — currently stored in `localStorage` via theme toggle. May be surfaced as a toggle here.
- Default start page preference — placeholder for future.
- Quote card display preferences — placeholder for future, aligned with `KIS_ENABLE_MARKET_QUOTE_CARD` feature flag.

### C. Data summary

- Portfolio count — from Supabase portfolio records if schema supports it.
- Saved symbols / watchlist count — placeholder if schema does not yet support it.
- Recent activity — placeholder.
- Data management — placeholder for export/delete data options.

### D. Legal and support

| Link | Target |
|---|---|
| 개인정보처리방침 | Placeholder page `/privacy` or disabled until content provided |
| 이용약관 | Placeholder page `/terms` or disabled until content provided |
| 제휴문의 | External: `https://forms.gle/WAVSxaotdes6T5yJA` |

### E. Danger zone — 회원탈퇴

See section 5 for the exact required UX.

### Shell-first approach

The first My Page implementation should render the page structure with placeholders for most sections. Actual data fetches (portfolio count, join date, etc.) can be wired incrementally. The page must not error if a data field is unavailable.

---

## 5. Account Deletion Requirement

### Required UX

**Trigger**: A "회원탈퇴" button in the danger zone section of My Page.

**Confirmation dialog/section** (exact owner-specified copy):

> 정말 회원 탈퇴하시겠습니까? 회원탈퇴하면 등록/활동 정보가 모두 삭제됩니다.

**Required choices**:
- **확인** — proceeds with account deletion
- **취소** — cancels and returns to My Page

### Implementation staging (recommended three-phase rollout)

**Phase 1 — UI confirmation flow only (no deletion)**
- Build the 회원탈퇴 button and the exact confirmation UI.
- On "확인": show a "현재 서비스 중입니다. 계정 삭제는 준비 중입니다." placeholder or similar.
- No API call. No database write. Safe to ship while deletion policy is finalized.

**Phase 2 — Soft-delete or deactivation policy decision**
- Owner decides: soft-delete (flag account as deactivated), hard-delete (remove all data), or grace period with recovery.
- Confirm which Supabase tables, RLS rules, and auth provider settings are affected.
- Decide data retention policy (e.g., portfolio records, quote history, preferences).

**Phase 3 — Actual deletion API (only after explicit owner approval)**
- Implement a server-side deletion endpoint (e.g., `DELETE /api/account`).
- Call Supabase `auth.admin.deleteUser` (requires service-role key — server-side only).
- Cascade delete user data per confirmed schema.
- Log deletion event per data retention policy.
- Redirect to sign-out and show confirmation.

### Safety note

Account deletion is irreversible if implemented as hard-delete. Do not implement any deletion API until Phase 2 policy decision is completed and Phase 3 is separately approved by the owner. The UI shell in Phase 1 is safe because it makes no destructive call.

---

## 6. Footer Requirement

### Current footer

From [src/components/Footer.astro](src/components/Footer.astro):

```html
<footer class="site-footer">
  <span>© 2026 MK Stock Lab</span>
  <a href="https://www.youtube.com/@MaunjaroKIM" target="_blank" rel="noreferrer">YouTube</a>
</footer>
```

### Target footer layout

**Left side:**
```
© 2026 MK Stock Lab ver1.0
```

**Right side links:**
```
개인정보처리방침  |  이용약관  |  제휴문의
```

### Link strategy

| Link | Target | Notes |
|---|---|---|
| 개인정보처리방침 | `/privacy` placeholder or `aria-disabled` | Do not fabricate legal text. Placeholder until owner provides content. |
| 이용약관 | `/terms` placeholder or `aria-disabled` | Same as above. |
| 제휴문의 | `https://forms.gle/WAVSxaotdes6T5yJA` | External Google Form. Use `target="_blank" rel="noopener noreferrer"`. |

### Implementation notes for the future phase

- YouTube `<a>` element and its `href` should be removed entirely.
- Update copyright span from `© 2026 MK Stock Lab` to `© 2026 MK Stock Lab ver1.0`.
- Add right-side links. If CSS already uses flex with space-between on `.site-footer`, the new links can use a wrapping `<nav aria-label="하단 링크">` element.
- Privacy/Terms links should render as visually muted or `aria-disabled="true"` until content pages exist, to avoid 404s.
- The Google Form link must open in a new tab with `rel="noopener noreferrer"`.
- No footer ad or Coupang widget is affected by this change — they are in the `.bottom-ad-banner` above the `<footer>` element.

---

## 7. Legal Content Staging

- **Privacy policy** (`개인정보처리방침`) and **terms of service** (`이용약관`) text are not yet provided by the owner.
- Do not fabricate legal text under any circumstances. Fabricated legal text creates liability.
- Recommended staging:
  1. Create placeholder pages (`src/pages/privacy.astro`, `src/pages/terms.astro`) with a neutral message such as "준비 중입니다." until final content is provided.
  2. Footer links render as `href="/privacy"` and `href="/terms"` — they will resolve to placeholder pages.
  3. When the owner provides final content, replace placeholder text in those pages.
  4. Any legal text should be reviewed separately before public release.

---

## 8. Recommended Implementation Roadmap

### Phase 3AU — Header and Footer UI Shell

- Add `마이페이지` link (`<a href="/mypage">`) to `Header.astro`, shown only in signed-in state.
- Update footer: remove YouTube, add `ver1.0` to copyright, add 개인정보처리방침/이용약관/제휴문의 links.
- Create placeholder pages `src/pages/privacy.astro` and `src/pages/terms.astro` (neutral "준비 중" content).
- Add partnership link to footer.
- **No My Page page in this phase. No account deletion backend.**
- Validation: existing auth flow unchanged; logout still works; mobile header responsive.

### Phase 3AV — My Page MVP Shell

- Create `src/pages/mypage.astro` at `/mypage` route.
- Require auth — redirect to home or show login prompt if not signed in.
- Add sections: account summary (email, login method), service preferences (placeholders), data summary (placeholders), legal/support links, danger zone with 회원탈퇴 confirmation UI.
- Confirmation dialog shows the exact owner-required message and 확인/취소 buttons.
- 확인 shows a placeholder message — no actual deletion.
- **No destructive deletion in this phase.**
- Validation: page accessible; confirmation copy matches requirement; no auth logic changed.

### Phase 3AW — Account Deletion Backend Policy Decision

- Owner decision: soft-delete vs. hard-delete vs. grace period.
- Define affected Supabase tables and RLS policies.
- Define auth provider deletion sequence.
- Define data retention and recovery policies.
- **Only after this phase is completed and explicitly owner-approved, implement actual deletion API.**
- Separate explicit owner approval required before any destructive backend code is written.

---

## 9. Acceptance Criteria for Future Implementation

The following criteria apply to future implementation phases (3AU, 3AV, 3AW and beyond):

- [ ] 마이페이지 header button appears only in signed-in state.
- [ ] Logged-out state is visually unchanged from current.
- [ ] Header remains responsive at all tested widths.
- [ ] Footer YouTube link is removed.
- [ ] Footer copyright reads `© 2026 MK Stock Lab ver1.0`.
- [ ] 개인정보처리방침 and 이용약관 footer links do not 404 (placeholder pages exist) and do not contain fabricated legal text.
- [ ] 제휴문의 link opens `https://forms.gle/WAVSxaotdes6T5yJA` in a new tab with `rel="noopener noreferrer"`.
- [ ] `/mypage` is accessible to signed-in users and requires auth.
- [ ] 회원탈퇴 confirmation shows the exact message: "정말 회원 탈퇴하시겠습니까? 회원탈퇴하면 등록/활동 정보가 모두 삭제됩니다."
- [ ] 확인 and 취소 buttons are present in the confirmation.
- [ ] No real account deletion occurs unless Phase 3AW backend policy is approved and implemented.
- [ ] No KIS/Supabase/Vercel/API/auth logic changes are introduced by UI shell work in Phase 3AU or 3AV.
- [ ] Existing auth flows (login modal, logout, auth state events) remain unaffected.

---

## 10. Confirmed Non-Actions for Phase 3AT

- No source code changed.
- No scripts changed.
- No `package.json` changed.
- No styles changed.
- No API logic changed.
- No KIS logic changed.
- No Supabase logic changed.
- No Vercel configuration changed.
- No auth behavior changed.
- No account deletion implemented.
- No database deletion implemented.
- No deployment performed.
- No live network calls made.
- No `.env*` file content read.
- No migration files modified.
- No production SQL pack files modified.
- No root README modified.
- No Claude memory files modified.
