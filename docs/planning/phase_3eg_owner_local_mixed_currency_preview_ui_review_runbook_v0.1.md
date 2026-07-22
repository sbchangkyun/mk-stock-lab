# Phase 3EG — Owner Local Mixed-Currency Preview UI Review Runbook

## 1. Purpose

Review the Phase 3EF local-only mixed-currency Portfolio preview UI.

This review is visual only.

No screenshots are required. The owner should not share screenshots unless voluntarily needed.

The owner should not share raw API responses, request bodies, response bodies, server logs, prices, totals, P&L values, secrets, environment values, cookies, localStorage, or account data.

Codex did not start the dev server, open a browser, run browser automation, collect screenshots, or perform this review.

## 2. Before Starting

Use the local project only.

Recommended command:

```powershell
cd E:\개인 프로젝트\mk-stock-lab
npm run dev -- --host 127.0.0.1 --port 4321
```

Keep this terminal open. The owner runs this command; Codex must not run it.

Use the existing private local configuration without displaying or sharing any configuration value. Do not open browser developer tools or inspect cookies, localStorage, sessionStorage, requests, responses, or account data for this review.

## 3. Review URLs

### A. Fixture default

```text
http://127.0.0.1:4321/portfolio
```

Expected:

- Portfolio page loads normally.
- No owner mixed-preview notice is shown.
- No `Mocked FX` label is shown.
- Existing default behavior appears unchanged.

### B. KR-only owner preview

```text
http://127.0.0.1:4321/portfolio?previewMode=owner
```

Expected:

- Existing KR-only owner preview behavior remains available.
- No mixed mocked-FX notice is shown unless `fxPreview=mocked` is also present.
- Existing KR-only preview labels and behavior are not broken.

### C. Mixed mocked-FX owner preview

```text
http://127.0.0.1:4321/portfolio?previewMode=owner&fxPreview=mocked
```

Expected:

- Owner-preview notice is visible.
- The UI clearly shows `오너 미리보기`.
- The UI clearly shows `Mocked FX`.
- The UI clearly shows `샘플 환율`.
- The UI clearly shows `실제 시세 아님`.
- Unavailable rows remain visible.
- Unavailable financial values are withheld or shown as dashes.
- Total market value, P&L, and return are not fabricated when aggregate state is unavailable or null.
- No `실시간`, `현재 시세`, `실시간 시세`, `real-time`, or `live FX` claim appears in the mixed-preview notice.
- The page remains usable at mobile width around 390px.

### D. Production blocked check

```text
https://mkstocklab.vercel.app/portfolio?previewMode=owner&fxPreview=mocked
```

Expected:

- Mixed mocked-FX owner preview does not activate on production.
- Public production remains fixture/default behavior.
- No owner mixed-preview notice appears.

This is a visual page-state check only. Do not inspect production requests, responses, storage, cookies, account data, or page source.

## 4. Mobile Check

Use browser responsive mode or a narrow browser width around 390px.

Expected:

- Page does not show a right-side blank area.
- Mixed preview notice wraps naturally.
- Holdings table remains inside its local horizontal scroll container.
- No new fixed-width panel breaks the viewport.

## 5. PASS Criteria

The owner may mark PASS if all are true:

- Fixture URL remains normal.
- KR-only owner preview is not broken.
- Mixed preview activates only on a local URL with both `previewMode=owner` and `fxPreview=mocked`.
- Production URL does not activate mixed preview.
- Mixed preview labels are clear.
- Unavailable rows remain visible.
- Aggregate unavailable/null state does not fabricate total value, P&L, or return.
- No forbidden real-time/current/live-FX wording appears.
- Mobile 390px layout remains usable.

## 6. FAIL Routing

If the issue is visual, route to:

```text
Phase 3EF-HF1 — Mixed-Currency Preview UI Visual Fix
```

If the issue is activation or gating, route to:

```text
Phase 3EF-HF2 — Mixed-Currency Preview Activation Gate Fix
```

If the issue is API or valuation behavior, route to:

```text
Phase 3EF-HF3 — Mixed-Currency Preview Data Contract Fix
```

If the issue is limited to the mobile layout, use the visual-fix route and mark `MOBILE_LAYOUT_ISSUE` in the result template.

If the production block fails, use the activation-gate route and mark `PRODUCTION_BLOCK_ISSUE` in the result template.

If all checks pass, route to:

```text
Phase 3EH — Owner Mixed-Currency Preview UI Review Closeout
```
