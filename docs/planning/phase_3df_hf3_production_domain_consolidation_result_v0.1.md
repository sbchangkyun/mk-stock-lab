# Phase 3DF-HF3 — Production Domain Consolidation
## Result v0.1 — 2026-06-26

### Metadata

| Field | Value |
|---|---|
| Phase | 3DF-HF3 |
| Type | Production Domain Consolidation |
| Status | Implemented and Deployed |
| Latest prior commit | c55b265 fix: split lab into landing and detail routes |
| Canonical production URL | `https://mkstocklab.vercel.app` |
| Temporary / non-canonical URL | `https://mk-stock-lab.vercel.app` |
| Runtime code changes | None |
| API route changes | None |
| DB / Supabase schema changes | None |
| Live KIS calls | None |
| Live GNews calls | None |
| AI provider calls | None |
| External data fetch by Claude Code | None |
| Vercel production deployment | Performed — relinked to `mkstocklab` project |

---

## Owner Problem

The project was deployed in Phase 3DF-HF2 using the Vercel CLI, which created a **new** Vercel
project named `mk-stock-lab` (serving `https://mk-stock-lab.vercel.app`) instead of deploying
to the pre-existing `mkstocklab` project (serving `https://mkstocklab.vercel.app`).

On mobile web:
- Owner navigated to the new URL `https://mk-stock-lab.vercel.app` → saw latest code.
- Owner navigated to `https://mkstocklab.vercel.app` → saw old code (the original Vercel project
  was not updated).

Desired final state: `https://mkstocklab.vercel.app` serves the latest code (Phase 3DF-HF2+).
The original `mk-stock-lab.vercel.app` is no longer canonical.

---

## Root Cause Assessment

**Root cause: Vercel project linkage mismatch.** No runtime hardcoding was found.

During Phase 3DF-HF2, `npx vercel deploy --prod --yes` created a new Vercel project called
`mk-stock-lab` (matching the local directory name) instead of reusing the existing `mkstocklab`
project. The local `.vercel/project.json` was linked to `mk-stock-lab`, not `mkstocklab`.

The codebase itself is fully domain-neutral:
- Auth flows use `window.location.origin` (dynamic, works on any domain).
- Internal navigation uses relative paths (`/portfolio`, `/lab`, etc.).
- No hardcoded deployment domain found in any runtime source file.

---

## Domain Audit Results

**Search targets:**
- `mk-stock-lab.vercel.app`
- `mkstocklab.vercel.app`

**Runtime source (`src/**`):** No matches found for either domain.

**Scripts (`scripts/**`):** `check_password_reset_flow_static_contract.mjs` references
`mkstocklab.vercel.app` as the expected canonical production URL — correct and intentional.

**Docs (`docs/**`):** All references are to `mkstocklab.vercel.app` (the canonical URL).
No `mk-stock-lab.vercel.app` found in docs.

**Auth redirect check:**
- `AuthModal.astro`: uses `window.location.origin + '/reset-password'` — correct, dynamic.
- `GoogleLogin.astro`: uses `window.location.origin` — correct, dynamic.
- `Header.astro`: uses `window.location.assign('/')` — relative, correct.

**Corrections made:** None (codebase was already domain-neutral).

---

## Implementation Summary

- Added static checker: `scripts/check_production_domain_consolidation_static_contract.mjs`
- Added `check:production-domain` to `package.json`
- Updated `docs/planning/planning_changelog.md`
- Created this result document
- Modified `.gitignore` to include `.vercel` (added by Vercel CLI, appropriate)
- Relinked local directory to the `mkstocklab` Vercel project
- Deployed to production: `https://mkstocklab.vercel.app`

---

## Supabase Auth Manual Checklist

**Owner action required — do not perform via Claude Code:**

1. **Supabase Auth → Settings → Site URL** should be:
   - `https://mkstocklab.vercel.app`

2. **Supabase Auth → Settings → Redirect URLs** should include:
   - `https://mkstocklab.vercel.app`
   - `https://mkstocklab.vercel.app/reset-password`

3. **Keep temporarily** (while the old URL is still in use):
   - `https://mk-stock-lab.vercel.app`
   - `https://mk-stock-lab.vercel.app/reset-password`

4. **Remove after confirmation** (when `mk-stock-lab` Vercel project is archived):
   - `https://mk-stock-lab.vercel.app`
   - `https://mk-stock-lab.vercel.app/reset-password`

Password reset emails use `window.location.origin` dynamically, so they will send the correct
redirect URL regardless of which domain the user accesses — no auth code changes are needed.

---

## Vercel Consolidation Steps

1. Inspected `.vercel/project.json` → found project name `mk-stock-lab` (wrong project).
2. Relinked local directory to the existing `mkstocklab` Vercel project:
   `npx vercel link --project mkstocklab --yes`
3. Deployed production:
   `npx vercel deploy --prod --yes`
4. Canonical production URL confirmed: `https://mkstocklab.vercel.app`

Note: No project IDs or organization IDs were printed or stored.

---

## Validation Results

| Check | Result |
|---|---|
| `npm run check:production-domain` | PASS |
| `npm run check:lab-route-split` | PASS (104/104) |
| `npm run check:lab-return-matrix` | PASS (114/114) |
| `npm run build` | PASS |
| `git diff --check` | PASS |
| `git status --short` | Clean (only expected untracked) |

---

## Deployment Results

| Field | Value |
|---|---|
| Commit deployed | see git log for phase 3DF-HF3 commit |
| Deployment command | `npx vercel deploy --prod --yes` |
| Production URL | `https://mkstocklab.vercel.app` |
| Deployment status | Ready |

---

## Production Route Checklist

Owner should visually verify each route on `https://mkstocklab.vercel.app`:

- `https://mkstocklab.vercel.app` — Home page
- `https://mkstocklab.vercel.app/portfolio` — Portfolio page
- `https://mkstocklab.vercel.app/lab` — Lab landing (실험실, 4 cards)
- `https://mkstocklab.vercel.app/lab/asset-class-returns` — 자산군 수익률 비교 matrix
- `https://mkstocklab.vercel.app/lab/sp500-sectors` — S&P 500 섹터별 수익률 matrix
- `https://mkstocklab.vercel.app/lab/congress-stocks` — 국회의원 보유 주식 (연동 예정)
- `https://mkstocklab.vercel.app/lab/nps-holdings` — 국민연금 보유 현황 (연동 예정)
- `https://mkstocklab.vercel.app/chart-ai` — Chart AI skeleton
- `https://mkstocklab.vercel.app/mypage` — MyPage with banner admin

---

## Owner Mobile Visual Checklist

1. Open `https://mkstocklab.vercel.app` on mobile browser.
2. Log in (Google or email).
3. Tap Portfolio → verify latest redesigned Portfolio page (bookmark tabs, holdings header).
4. Confirm URL stays at `mkstocklab.vercel.app` throughout navigation.
5. Tap Lab → confirm card gallery landing with 실험실 heading and 4 cards.
6. Tap 자산군 수익률 비교 → confirm full ranking matrix renders.
7. Tap Lab back link → confirm returns to `/lab`.
8. Tap Chart AI → confirm skeleton page.
9. Tap MyPage → confirm latest MyPage with banner admin accordion on desktop right.
10. Confirm no redirect to `mk-stock-lab.vercel.app` at any step.
11. If password reset was tested before — confirm `비밀번호를 잊으셨나요?` still works
    (sends email with link pointing to current domain origin, not a hardcoded domain).

---

## Cleanup Recommendation

After owner confirms canonical production URL (`https://mkstocklab.vercel.app`) is fully working:

1. Archive or delete the temporary `mk-stock-lab` Vercel project manually in the Vercel dashboard.
2. Remove `https://mk-stock-lab.vercel.app` and its `/reset-password` variant from
   Supabase Auth Redirect URLs.
3. Do NOT perform project deletion via Claude Code — this is an owner manual action.

---

## Recommended Next Phase

**Phase 3DG — Market Page Fixture Chart Enhancement**

Only after owner confirms canonical production URL behavior is correct on mobile.
