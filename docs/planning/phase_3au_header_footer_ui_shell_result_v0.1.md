# Phase 3AU — Header and Footer UI Shell Implementation

**Date**: 2026-06-23
**Branch**: rebuild/phase-1-ia-shell
**Status**: Completed

## Summary

Implemented the header My Page navigation entry and the legal footer shell. No auth logic, backend API, database, KIS, Vercel config, or `.env*` files were touched.

## Changes

### `src/components/Header.astro`

- Added `<a class="header-button secondary hidden" id="mypage-btn" href="/mypage">마이페이지</a>` between `#open-login-btn` and `#logout-btn` in `.header-actions`.
- Updated `updateAuthButtons(status)`:
  - `signed_in` branch: added `mypageBtn?.classList.remove('hidden')` after showing logout button.
  - `signed_out`/`unavailable` branch: added `mypageBtn?.classList.add('hidden')` after hiding logout button.
- Element order in `.header-actions`: Today: 000 → theme toggle → 로그인 (signed-out) / 마이페이지 + 로그아웃 (signed-in).
- My Page link starts hidden via `hidden` class; shown/hidden at runtime by `updateAuthButtons`.

### `src/components/Footer.astro`

- Removed YouTube link (`https://www.youtube.com/@MaunjaroKIM`).
- Updated copyright text: `© 2026 MK Stock Lab` → `© 2026 MK Stock Lab ver1.0`.
- Added `<nav class="site-footer-links" aria-label="하단 링크">` with three links:
  - `개인정보처리방침` → `/privacy`
  - `이용약관` → `/terms`
  - `제휴문의` → `https://forms.gle/WAVSxaotdes6T5yJA` (`target="_blank"` `rel="noopener noreferrer"`)

### `src/styles/style.css`

- `.site-footer`: changed `justify-content: center` → `space-between`; changed `height: 34px` → `min-height: 34px`; added `padding: 6px var(--page-gutter-x)`; added `flex-wrap: wrap`.
- Added `.site-footer-copy`, `.site-footer-links`, `.site-footer-links a`, `.site-footer-links a:hover` rules.
- Added `a.header-button` rule (`display: inline-flex; align-items: center; text-decoration: none`) to support anchor element using the header-button class.

### New pages

- `src/pages/privacy.astro` — placeholder page. Heading: `개인정보처리방침`. Body: `개인정보처리방침 내용은 준비 중입니다.` No fabricated legal text.
- `src/pages/terms.astro` — placeholder page. Heading: `이용약관`. Body: `이용약관 내용은 준비 중입니다.` No fabricated legal text.
- `src/pages/mypage.astro` — placeholder page. Heading: `마이페이지`. Body: `마이페이지 기능은 준비 중입니다.` No auth, account management, or deletion logic.

### `scripts/check_header_footer_shell_static_contract.mjs`

New static validator with 25 checks across five groups:

| Group | Checks |
|---|---|
| File existence | 5 |
| Header My Page entry | 4 |
| Footer content | 9 |
| Placeholder page safety | 3 |
| Safety boundaries | 3 |
| **Total** | **25** |

All 25 checks pass. Exit 0.

### `package.json`

Added script: `"check:header-footer-shell": "node scripts/check_header_footer_shell_static_contract.mjs"`

## Validation Results

```
npm run check:header-footer-shell  →  25/25 PASS  Exit 0
npm run build                      →  Complete! (3.38s)
git diff --check                   →  No errors (Windows CRLF warnings only)
```

## Safety Verification

- No KIS calls, KIS OAuth, or KIS URL references added.
- No Supabase calls or mutations added.
- No SQL, migration, or production SQL pack files modified.
- No Vercel config, Vercel CLI, or environment variables touched.
- No live HTTP requests made.
- No `.env*` files read.
- No account deletion API, auth mutation, or database deletion logic added.
- Partnership link URL `https://forms.gle/WAVSxaotdes6T5yJA` used verbatim as specified.
- Privacy/Terms pages contain placeholder text only — no fabricated legal content.
- My Page page contains placeholder text only — no auth or deletion UI.
- root `README.md` and Claude memory files not modified.
