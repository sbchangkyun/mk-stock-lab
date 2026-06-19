# Phase 3C.6 Portfolio Final UX Smoke Fix Result v0.1

Date: 2026-06-19

## Scope

Phase 3C.6 fixed the remaining non-secret Portfolio UX smoke issues reported after Phase 3C.5.

Included changes:

- Removed the visible auth-checking label from ordinary header and Portfolio shell navigation states.
- Strengthened the signed-out Portfolio lock state with a visible lock treatment.
- Moved the always-visible position add/edit form into a slide-up bottom sheet opened by `종목 추가`.
- Reused the same bottom sheet for position edit actions.
- Changed the currency display toggle labels to `달러 기준` and `원화 기준`.
- Changed local price formatting to compact display: USD uses `$90.25` style and KRW uses `52,300원` style.
- Made position/security names link to `/chart-ai?symbol=...&name=...&market=...`.
- Added a safe Chart AI query-prefill skeleton that displays the selected security without provider, AI, market-data, or authenticated calls.
- Tightened `.gitignore` coverage for literal `dist` and service-account credential JSON probes.

Out of scope:

- No Supabase schema work.
- No KIS, OpenDART, OpenAI, Gemini, or market-data integration.
- No authenticated Portfolio write smoke.
- No production deployment or Vercel environment mutation.
- No Supabase SQL, CLI, or remote API call.

## Validation

- `npm run build` passed with exit code 0.
- `.vercel/output/config.json` exists after build.
- `.vercel/output/functions/_render.func` exists after build.
- Astro dev server was used for local route smoke because `astro preview` is not supported by the installed Vercel adapter.
- Target routes returned HTTP 200:
  - `/`
  - `/chart-ai`
  - `/chart-ai?symbol=005930&name=Samsung%20Electronics&market=KR`
  - `/heatmap`
  - `/lab`
  - `/portfolio`
  - `/lab/congress-stocks`
  - `/lab/nps-portfolio`
  - `/lab/sp500-sectors`
  - `/lab/asset-class-returns`
- Removed legacy routes returned HTTP 404 and did not expose old surface markers:
  - `/seibro`
  - `/api/news`
  - `/api/list`
  - `/api/holdings`
  - `/api/stock`
  - `/api/etf`
  - `/api/search`
- No requested provider secret markers were found in source, public assets, or generated Vercel output.
- No service-role marker was found in client-facing source or generated static output.
- Removed legacy route strings were absent from source, public assets, and generated Vercel output.
- Ignored-file coverage was confirmed for `.env*`, `.vercel`, `.vercel/output`, `dist`, `dist/`, `.astro`, `.omc`, representative key files, service-account JSON files, credential files, and secret files.

## Browser Smoke Limitation

The in-app browser connector reported that the `iab` browser was unavailable in this session. Because of that, Codex could not perform a true visual browser-console smoke pass. The local HTTP route smoke and source/generated scans were completed instead.

Owner browser smoke should still confirm:

- Signed-out header navigation keeps `로그인` visible and does not show `확인 중`.
- Signed-in header navigation keeps `로그아웃` visible and does not show `확인 중`.
- The signed-out Portfolio lock UI is visually clear.
- The position bottom sheet opens from `종목 추가`, closes cleanly, and is reused for edit.
- Position cards do not overflow the parent container.
- Clicking a position name navigates to Chart AI with the expected selected-security prefill.
- Browser console has no obvious errors and no secrets.

## Phase 3D Readiness

Phase 3D can start after owner browser smoke confirms the remaining visual and console checks above.
