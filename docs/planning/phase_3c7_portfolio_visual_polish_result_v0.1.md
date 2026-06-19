# Phase 3C.7 Portfolio Visual Polish Result v0.1

Date: 2026-06-19

## Status And Scope

Status: implementation and local validation completed.

Phase 3C.7 applied a narrow visual polish pass for the remaining owner Phase 3C.6 smoke feedback. The work stayed inside Portfolio lock UI, bottom-sheet motion, header logo application, the Portfolio refresh control, and planning documentation.

## Files Changed

- `src/components/Header.astro`
- `src/pages/portfolio.astro`
- `src/styles/style.css`
- `.gitignore`
- `docs/planning/planning_changelog.md`
- `docs/planning/phase_3c1_portfolio_manual_smoke_checklist_v0.1.md`
- `docs/planning/phase_3c7_portfolio_visual_polish_result_v0.1.md`

## Owner Phase 3C.6 Smoke Feedback Summary

- Header signed-out and signed-in labels passed owner smoke.
- Position overflow, currency toggle, compact money display, Chart AI prefill, provider-call absence, console safety, and cleanup passed owner smoke.
- Logged-out lock UI failed because the lock treatment visually overlapped another asset and used an unwanted sky-blue background.
- Position add/edit bottom sheet worked but appeared abruptly.
- Owner requested original project logo use in the top-left header if a local/tracked asset exists.
- Owner requested replacing visible Portfolio refresh text with an accessible icon button.

## Implementation Summary

### Lock UI Visual Fix

- Replaced the composite lock drawing with one large `🔐` lock visual.
- Removed the sky-blue/gradient lock icon background.
- Removed pseudo-element shackle/body layers that caused overlap.
- Increased the lock visual size for clearer signed-out state recognition.

### Bottom-Sheet Motion

- Kept the bottom sheet mounted and controlled visibility with an `open` class instead of abrupt display toggling.
- Added slide-up entry from the bottom and slide-down/fade exit behavior.
- Kept the existing backdrop.
- Added `prefers-reduced-motion: reduce` handling.
- Preserved add, edit, close, cancel, save, Escape, and sign-out sheet-clearing behavior.

### Original Project Logo Search And Application

- Searched local/tracked project assets only.
- Found original project logo candidates:
  - `public/logo.svg`
  - `public/icon-192.png`
  - `public/icon-512.png`
- Applied `public/logo.svg` to the top-left header brand area.
- Kept the existing `MK Stock Lab` text and Korean subtitle.
- No external logo was downloaded or generated.

### Refresh Icon Button

- Replaced the visible Portfolio `새로고침` text button with an icon-only circular-arrow button.
- Used local inline SVG only.
- Preserved click behavior through the same `portfolio-refresh` element id.
- Preserved accessibility with `aria-label="새로고침"` and `title="새로고침"`.

### Auth Label Stability

- Preserved the Phase 3C.6 header behavior where ordinary navigation does not show a visible auth-checking label.
- Preserved signed-out `로그인` and signed-in `로그아웃` labels.
- Did not store tokens, emails, user IDs, or raw session objects.

### Chart AI Prefill Preservation

- Preserved position-name links to `/chart-ai?symbol=...&name=...&market=...`.
- Preserved the Chart AI selected-security prefill skeleton.
- Did not add chart rendering, provider calls, market-data calls, AI calls, or usage-guard logic.

### Portfolio Behavior Preservation

- Preserved Portfolio create/read/update/delete UI paths.
- Preserved position create/read/update/delete UI paths.
- Preserved the bottom-sheet add/edit workflow.
- Preserved compact money formatting.
- Preserved the `달러 기준` / `원화 기준` display toggle.
- Preserved logo/fallback avatar and country badge rendering.
- Preserved ordering and placeholder-safe sorting controls.
- Preserved Pretendard and Korean UI.
- Preserved the corrected Lab label `국회의원 보유 주식`.

## Service-Role Boundary Preservation

- No service-role key was moved into browser code.
- No server-only helper was intentionally imported into client-executed scripts.
- Client/static generated-output scans found no service-role exposure markers.

## Explicit Non-Goals

- No production write validation by Codex.
- No Portfolio production write calls by Codex.
- No DB mutation.
- No Auth user creation.
- No Vercel environment mutation.
- No deployment.
- No provider integration.
- No Chart AI provider call.
- No Chart AI usage guard implementation.
- No ad-event route.
- No desktop left-side banner implementation.
- No FX conversion.
- No valuation analytics.
- No performance analytics.
- No provider autocomplete.
- No logo scraping.
- No external asset download.

## Provider Credential Status Note

KIS REST API APP KEY, KIS REST API APP Secret, and OpenDART API KEY have been issued for future phases. No actual values were requested, read, printed, summarized, or recorded.

## Desktop Left-Side Banner Backlog

The desktop left-side rotating image ad banner remains backlog only. It was not implemented in Phase 3C.7.

## Validation Results

- Normal `npm run build` passed.
- `.vercel/output/config.json`, `.vercel/output/functions/_render.func`, and `.vercel/output/static` were generated.
- Local unauthenticated HTTP smoke returned 200 for:
  - `/`
  - `/portfolio`
  - `/chart-ai`
  - `/chart-ai?symbol=005930&name=%EC%82%BC%EC%84%B1%EC%A0%84%EC%9E%90&market=KR`
  - `/lab`
- Removed legacy routes returned 404:
  - `/seibro`
  - `/api/news`
  - `/api/list`
  - `/api/holdings`
  - `/api/stock`
  - `/api/etf`
  - `/api/search`
- Product source and generated-output scans found no requested provider secret marker names.
- Expected Supabase public browser helper source references remain in `src/lib/supabase.ts`.
- Expected service-role source references remain server-only in `src/lib/server/supabaseAdmin.ts` and server route imports.
- Generated static browser assets did not contain service-role marker names.
- Disposable validation identifiers remained docs-only or validation-SQL-only.
- Removed legacy route strings remained absent from product source and generated output.
- Broad crypto scope remained limited to the home exclusion note, the approved asset-class returns page, and standard WebCrypto/Supabase library internals.
- Logo scraping, remote logo discovery, crawler, and external logo download code were not added.
- Chart AI remained a prefill skeleton with no provider execution.
- Ignored-file coverage was confirmed for `.env*`, `.vercel`, `.vercel/output`, `dist`, `dist/`, `.astro`, `.omc`, key files, certificate files, credential files, and service-account JSON files.
- The in-app browser connector reported `iab` unavailable, so visual validation was limited to source/CSS/generated-output inspection and local HTTP smoke.

## Updated Owner Manual Smoke Steps

Use the Phase 3C.7 section in `docs/planning/phase_3c1_portfolio_manual_smoke_checklist_v0.1.md`. Do not include credentials, tokens, keys, project references, environment values, secret query strings, or screenshots containing secrets.

## Remaining Risks

- Owner visual smoke is still required to confirm subjective motion feel and final lock-logo appearance in the intended browser.
- Codex validation must remain unauthenticated unless a later phase explicitly approves production write smoke.

## Recommended Next Action

Run the Phase 3C.7 owner manual smoke. If it passes, proceed to Phase 3D planning for Chart AI usage guard and server-only execution skeleton.
