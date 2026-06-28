# Phase 3DS — Owner Local Browser Review of Portfolio Live Preview UI

## 1. Metadata

| Field | Value |
|-------|-------|
| Phase | 3DS |
| Type | Owner Local Browser Review of Portfolio Live Preview UI |
| Status | **Completed — owner browser review PASS** |
| Latest prior commit | `adee857 feat: add portfolio owner live preview ui mode` |
| Canonical production URL | `https://mkstocklab.vercel.app` |
| Runtime UI changes | None in this phase |
| API route changes | None |
| DB / Supabase schema changes | None |
| Live KIS calls by Claude Code | None |
| Live API calls by Claude Code | None |
| Browser launch by Claude Code | None |
| Local dev server by Claude Code | None |
| Live FX calls | None |
| Live GNews calls | None |
| AI provider calls | None |
| External data fetch by Claude Code | None |
| Vercel production deployment | Not performed |

---

## 2. Phase 3DR Implementation Baseline

Phase 3DR modified only `src/pages/portfolio.astro`. No other runtime files changed.

### 2.1 Owner Preview Gate

The Phase 3DR implementation requires both conditions to be true simultaneously:

1. **Hostname gate**: `window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'`
2. **Query param gate**: `new URLSearchParams(window.location.search).get('previewMode') === 'owner'`

If either condition fails, the fixture path is used silently. Production hostname (`mkstocklab.vercel.app`) always fails the hostname gate.

Helper: `isOwnerPreviewActive()` — defined in `src/pages/portfolio.astro`

### 2.2 Live Preview Eligibility

Even when `isOwnerPreviewActive()` is true, the live preview API is only called if `isLivePreviewEligible()` passes:

- Not an aggregate portfolio view
- `portfolio.baseCurrency === 'KRW'`
- `1 ≤ positions.length ≤ 10`
- All positions have `market === 'KR'`
- All positions have `currency === 'KRW'`
- All positions have valid `symbol`, finite `buyPrice ≥ 0`, finite `quantity > 0`

If ineligible, fixture path is used and the status copy shows: `현재 포트폴리오는 미리보기 조건을 충족하지 않습니다.`

Helper: `isLivePreviewEligible()` — defined in `src/pages/portfolio.astro`

### 2.3 Fixture Default

`source='fixture'` is the default in all environments and all cases where the owner preview gate does not activate. Live preview is not the default path.

`source='auto'` remains deferred and is not implemented.

`providerMeta` is not exposed to the browser or API clients.

### 2.4 Korean UI Labels Added in Phase 3DR

| Condition | Label |
|-----------|-------|
| Live preview loading | `[Owner Preview] 조회 시점 기준 평가값을 불러오는 중입니다.` |
| Live preview success | `[Owner Preview] 조회 시점 기준 평가` |
| Fixture loading | `Fixture 기준 평가값을 불러오는 중입니다.` |
| Fixture success | `Fixture 기준 평가값입니다.` |
| Per-row fresh | `조회 시점 기준` |
| Per-row stale-but-usable | `최근 조회 기준` |
| Per-row unavailable | `데이터 일시 불가` |
| API/contract failure | `연동 실패` |
| Ineligible preview | `현재 포트폴리오는 미리보기 조건을 충족하지 않습니다.` |

Label helper: `getStaleStateLabel()` — defined in `src/pages/portfolio.astro`

Labels `실시간` and `실시간 시세` must not appear as positive user-facing labels.

### 2.5 KPI Summary Change

- Fixture mode: existing fallback `posVal?.marketValue ?? (buyPrice * quantity)` remains unchanged.
- Live preview mode with unavailable rows: `buyPrice * quantity` fallback is suppressed. Market value shows `—` if any row is unavailable.

---

## 3. Owner Browser Review Prerequisites

**Claude Code must not perform these steps. Owner performs them manually.**

### Terminal 1 — Owner Only

Set KIS env vars locally before starting the dev server. Do not share env var values.
Ensure `KIS_ACCOUNT_NO` is absent or empty.

Required env var names (values must not be shared):
- `KIS_APP_KEY`
- `KIS_APP_SECRET`
- `KIS_BASE_URL`
- `KIS_ENABLE_LIVE_QUOTES=true`

```powershell
# Terminal 1 — owner only
# Set KIS env vars locally before this step.
# Ensure KIS_ACCOUNT_NO is absent or empty.
npm run dev
```

### Browser URLs

**Live preview review:**
```
http://localhost:4321/portfolio?previewMode=owner
```

**Fixture regression check:**
```
http://localhost:4321/portfolio
```

**Production-safety visual check (optional):**
```
https://mkstocklab.vercel.app/portfolio?previewMode=owner
```

### Safety Constraints for Owner

- Do not share screenshots unless all price/value fields are fully redacted.
- Do not share full API responses.
- Do not share request or response bodies.
- Do not share prices, market values, valuation values, or PnL numbers.
- Do not share tokens, secrets, account numbers, or provider payloads.
- Do not share request headers or cookies.
- Do not share raw KIS field names (e.g., `stck_prpr`, `prdy_vrss`, `rt_cd`).
- Do not share `providerMeta`.
- Do not paste anything from the Network tab response body.
- Report only pass/fail fields using the safe report template in §5.

---

## 4. Owner Review Checklist

### A. Normal Fixture Mode

URL: `http://localhost:4321/portfolio`

- [ ] Page loads without errors
- [ ] No owner preview banner or live preview label visible
- [ ] Live preview does not activate in normal fixture mode
- [ ] Valuation data loads from fixture path
- [ ] `Fixture 기준 평가값입니다.` may appear in status copy after successful fixture load
- [ ] Existing Portfolio UI elements remain usable (KPI summary, sort controls, position list)
- [ ] Existing mobile layout is not visibly broken
- [ ] `조회 시점 기준` badge must NOT appear in fixture mode (flag if it does)
- [ ] No raw API response logged to browser console

### B. Owner Preview Activation

URL: `http://localhost:4321/portfolio?previewMode=owner`

For an eligible KRW/KR portfolio with ≤ 10 positions:

- [ ] Owner preview mode activates (hostname `localhost` + query param both required)
- [ ] Status copy shows `[Owner Preview] 조회 시점 기준 평가` after successful owner preview load
- [ ] Loading state shows `[Owner Preview] 조회 시점 기준 평가값을 불러오는 중입니다.`
- [ ] `조회 시점 기준` badge appears per fresh row
- [ ] `최근 조회 기준` badge appears per stale-but-usable row (if any)
- [ ] `데이터 일시 불가` badge appears per unavailable row (if any)
- [ ] `연동 실패` appears on API or contract failure
- [ ] Label `실시간` must NOT appear anywhere in the UI
- [ ] Label `실시간 시세` must NOT appear anywhere in the UI
- [ ] No raw provider field names appear in the UI

### C. Live Preview Eligibility

- [ ] Aggregate portfolio view (`전체` or all-portfolios view) does NOT trigger live preview
- [ ] Non-KRW portfolio does NOT trigger live preview
- [ ] Portfolio with any US position does NOT trigger live preview
- [ ] Portfolio with more than 10 positions does NOT trigger live preview
- [ ] Invalid or missing symbol does NOT trigger live preview
- [ ] Ineligible state shows: `현재 포트폴리오는 미리보기 조건을 충족하지 않습니다.`
- [ ] Ineligible state does NOT produce a raw error, stack trace, or raw response

### D. KPI Summary Behavior

For an all-fresh live preview response:
- [ ] KPI `총 자산` shows total market value
- [ ] KPI `총 수익` shows total PnL

For a live preview response with any unavailable row:
- [ ] KPI `총 자산` shows `—` (not a cost-basis calculated fallback)
- [ ] KPI `총 수익` shows `—`
- [ ] No fixture values are mixed into live preview KPI totals

For fixture mode:
- [ ] Existing KPI fallback behavior (`buyPrice * quantity`) remains unchanged

### E. Row Display and Badges

- [ ] Per-row stale badges are compact (small inline text, not a wide new column)
- [ ] Badges do not add a new column to the position table
- [ ] Badges do not disrupt the existing grouped position card layout
- [ ] Unavailable rows show `—` for current price and market value fields
- [ ] No raw KIS field names are rendered in any row cell
- [ ] No `providerMeta` content is displayed

### F. Mobile Review

Resize browser to approximately 390px width.

- [ ] Portfolio page remains usable at 390px
- [ ] No new horizontal overflow beyond existing intended scroll areas
- [ ] No new wide columns added by stale badges
- [ ] Stale badges remain compact and do not break the grouped two-line cell layout
- [ ] KPI summary does not overflow at narrow width
- [ ] Currency toggle (₩/$) remains usable
- [ ] Sort/header row layout remains usable
- [ ] Position list rows are readable

### G. Production-Safety Review

URL: `https://mkstocklab.vercel.app/portfolio?previewMode=owner`

- [ ] Owner preview does NOT activate on production hostname
- [ ] No owner preview banner appears
- [ ] No live quote preview UI appears
- [ ] Fixture/default production behavior only
- [ ] If Phase 3DR is not yet deployed to production: record as `not applicable until deployment`

### H. Browser Console / Network Safety

Owner may inspect DevTools visually but must not share raw payloads.

- [ ] No full API response is logged to console
- [ ] No price or market value numbers are logged to console
- [ ] No KIS field names are logged to console
- [ ] No `providerMeta` is visible in console or network response preview
- [ ] No tokens, secrets, or account numbers appear in console
- [ ] No request headers with credentials are logged
- [ ] Network tab may show `/api/portfolio/valuation` — do not copy request or response body

---

## 5. Safe Owner Report Template

Copy and fill in this template. Do not include prices, screenshots with values, full API responses, request/response bodies, tokens, account numbers, or provider payloads.

```
Phase 3DS Owner Browser Review Report

Environment:
- Local URL reviewed: yes/no
- Production URL reviewed: yes/no/not applicable
- Browser:
- Viewports checked: desktop / mobile 390px / both

Fixture mode:
- /portfolio loads fixture mode: pass/fail
- No owner preview banner in fixture mode: pass/fail
- Fixture message behavior: pass/fail

Owner preview mode:
- /portfolio?previewMode=owner local gate activates: pass/fail
- Eligible KRW/KR portfolio found: yes/no
- Owner Preview banner: pass/fail
- Fresh badge shown as 조회 시점 기준: pass/fail/not observed
- Stale badge shown as 최근 조회 기준: pass/fail/not observed
- Unavailable badge shown as 데이터 일시 불가: pass/fail/not observed
- API failure label 연동 실패: pass/fail/not observed
- 실시간 / 실시간 시세 not shown: pass/fail

KPI behavior:
- Fresh KPI values displayed: pass/fail/not observed
- Unavailable KPI fallback suppressed: pass/fail/not observed
- No fixture/live value mixing observed: pass/fail/not observed

Eligibility:
- Aggregate blocked: pass/fail/not tested
- Non-KRW blocked: pass/fail/not tested
- US positions blocked: pass/fail/not tested
- >10 positions blocked: pass/fail/not tested
- Ineligible message shown safely: pass/fail/not tested

Mobile:
- 390px layout usable: pass/fail
- No new wide column regression: pass/fail
- Badges compact: pass/fail
- KPI summary does not overflow: pass/fail

Safety:
- No raw API response shown: pass/fail
- No prices shared in report: pass/fail
- No providerMeta shown: pass/fail
- No KIS raw field names shown: pass/fail
- No secrets/tokens/account numbers shown: pass/fail
- No console leakage observed: pass/fail/not checked

Final owner decision:
- PASS / FAIL / RETRY REQUIRED

Notes:
- Safe notes only. Do not include prices, screenshots with values, raw responses,
  request bodies, headers, tokens, account numbers, or provider payloads.
```

---

## 6. Review Decision Rules

### 6.1 PASS

All critical checks pass:

- Fixture mode remains normal and unmodified.
- Owner preview activates only on local hostname with `?previewMode=owner`.
- Eligible KRW/KR portfolio shows owner preview UI correctly.
- Fresh badge appears as `조회 시점 기준`.
- No `실시간` or `실시간 시세` wording anywhere.
- KPI fallback suppression is correct or not triggered (no unavailable rows encountered).
- Mobile 390px layout is acceptable.
- No provider leakage and no console leakage.
- Production URL (`mkstocklab.vercel.app`) does not activate preview mode.

**Next phase**: `Phase 3DS-CLOSEOUT — Record Owner Browser Review PASS`

### 6.2 RETRY REQUIRED

Review cannot be completed due to environment issues:

- Local dev server is not running.
- KIS env vars not loaded before dev server start.
- No eligible KRW/KR portfolio with ≤ 10 positions is available.
- Browser cache issue causing stale behavior.
- Local API temporarily unavailable (`http://localhost:4321` not reachable).

**Next phase**: `Phase 3DS-Retry — Owner Local Browser Review Retry`

### 6.3 FAIL

Review finds a UI bug or safety issue:

- Owner preview activates without the `?previewMode=owner` query param.
- Owner preview activates on production hostname (`mkstocklab.vercel.app`).
- Live preview is the default without any query param.
- Fixture path is broken or returns errors.
- KPI mixes `buyPrice * quantity` cost-basis fallback into live unavailable rows.
- `실시간` or `실시간 시세` appears as a positive label.
- Raw API response, prices, or provider field names are logged or rendered.
- Mobile layout regression is material (scrolling breaks, columns overflow severely).

**Next phase**: `Phase 3DR-HF1 — Portfolio Owner Preview UI Review Fixes`

---

## 7. Known Limitations

- This phase does not perform the browser review. Claude Code does not run the dev server.
- Claude Code does not call the API, start a browser, or execute any live smoke.
- Owner must manually navigate to the review URLs and complete the checklist.
- Live preview remains local-owner only. No public live quotes are exposed.
- No production deployment is performed in this phase.
- No US quote support. KR-only positions are eligible.
- No real FX conversion. `baseCurrency=USD` portfolios are not eligible.
- `source=auto` activation remains deferred.
- Per-row stale badge CSS uses `var(--positive)`, `var(--neutral)`, `var(--negative)` — appearance depends on the global CSS variable values set by the Layout.
- If Phase 3DR has not been deployed to production, the production-safety check is not applicable until after a future production deployment.

---

## 8. Validation Results

| Command | Result |
|---------|--------|
| `npm run check:phase-3ds-owner-browser-review` | PASS — see checker run |
| `npm run check:portfolio-ui-valuation-fixture` | PASS (71/71) |
| `npm run check:portfolio-live-preview-api` | PASS (110/110) |
| `npm run check:portfolio-live-preview-owner-smoke-closeout` | PASS (68/68) |
| `npm run check:phase-3dq-ui-preview-plan` | PASS (79/79) |
| `npm run check:mobile-snapshot-portfolio` | PASS (49/49) |
| `npm run check:mobile-baseline` | PASS (74/74) |
| `npm run check:portfolio-layout` | PASS (73/73) |
| `npm run check:portfolio-bookmark-tabs` | PASS (121/121) |
| `npm run check:portfolio-holdings-header` | 85/90 — pre-existing failure from before Phase 3DS (not blocking) |
| `npm run check:portfolio-ticker-display-name` | PASS (73/73) |
| `npm run build` | PASS |
| `git diff --check` | PASS |

---

## 9. Recommended Next Phase

| Owner review outcome | Next phase |
|---------------------|------------|
| PASS | `Phase 3DS-CLOSEOUT — Record Owner Browser Review PASS` |
| Environment/local issue | `Phase 3DS-Retry — Owner Local Browser Review Retry` |
| UI bug or safety issue | `Phase 3DR-HF1 — Portfolio Owner Preview UI Review Fixes` |

---

## 10. Final Review Result (Closeout — added in Phase 3DS-CLOSEOUT)

Owner browser review: **PASS**

| Field | Value |
|-------|-------|
| Owner decision | PASS |
| Review result source | Owner-reported safe review result |
| Runtime UI changed in this closeout phase | None |
| API route changed in this closeout phase | None |
| Production deployment | Not performed |
| Live KIS by Claude Code | None |
| Live API calls by Claude Code | None |
| Browser launch by Claude Code | None |
| Local dev server by Claude Code | None |
| Raw response bodies recorded | No |
| Prices or valuation values recorded | No |
| Screenshots with values recorded | No |
| Tokens/secrets/account numbers recorded | No |
| Provider payloads recorded | No |

### Closeout Interpretation

Phase 3DR owner local browser review passed. Portfolio owner preview mode is accepted for local owner/developer review use.

- `source=fixture` remains default in all environments.
- `source=auto` remains deferred and is not implemented.
- Production UI live quote exposure remains disabled by default.
- No production deployment was performed.
- No public live quote exposure was enabled.
- `providerMeta` is not exposed to the browser or API clients.

### Next Work Note

Next requested product work: mobile Home ad banner slot. This is deferred to Phase 3DT. No mobile ad banner implementation was performed in this closeout phase.
