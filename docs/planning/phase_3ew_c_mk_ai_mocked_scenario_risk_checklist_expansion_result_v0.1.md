# Phase 3EW-C — MK AI Mocked Scenario and Risk Checklist Expansion Result

## 1. Status

Implemented — mocked scenario and risk checklist expansion complete.

## 2. Background

- Phase 3EW-B completed MK AI interaction and explanation depth.
- The owner requested faster feature implementation.
- The owner explicitly authorized Vercel deployment for this phase.
- This phase expands mocked MK AI scenarios and risk checklist behavior without external AI calls and without public KIS data exposure.

## 3. Implemented Scope

- **Scenario section**: added a new "시나리오 점검" section to the MK AI panel in `src/pages/chart-ai.astro`, positioned after 핵심 해석 and before the 분석 근거 details, with a static disclaimer note ("아래 시나리오는 실제 예측이 아닌 샘플 분석 구조입니다. 실제 투자 판단 전 공시·재무·시세 데이터를 별도로 확인해야 합니다.").
- **Scenario cards**: three deterministic cards — "긍정 관찰 시나리오", "기준 유지 시나리오", "주의 점검 시나리오" — rendered as `<article>` elements with distinct tone-based left-border color coding.
- **Deterministic scenario/risk builder**: extended `buildMockMkAiAnalysis(record, context)` to also return `scenarios` (array of `{ label, tone, text }`), `riskChecklist` (deterministic string array), `scenarioNote`, and `connectedScenarioNote`. No randomness, no timestamps, no fetch — purely derived from the selected symbol's client-safe record and asset type.
- **Stock/ETF-safe copy**: distinct scenario text for `stock` vs `etf` (ETF copy references 구성 종목·NAV·괴리율·추적오차), plus a neutral fallback for other asset types.
- **Risk checklist expansion**: new "리스크 체크리스트" section (`#chartAiMkAiRiskChecklist`) rendered after the existing 확인 체크리스트 section, with distinct 5-item stock and ETF checklists (both ending in "샘플 분석과 실제 투자 판단 구분").
- **Selected-symbol synchronization**: no new call sites were added. Scenario/risk rendering was folded directly into the existing `updateMkAiPanel()` function, which is already invoked from `updateSelection()` and both owner-local quote/OHLC preview success handlers — so scenario cards and risk checklist update immediately on symbol change and preview success without touching the three protected call-site literal sequences from Phase 3EW-A/3EW-B.
- **Owner-local connected-state reflection**: when `ownerLocalConnected` is true, `#chartAiMkAiConnectedScenarioNote` shows "오너 로컬 KIS 연결 상태가 확인되었지만, 시나리오와 체크리스트는 아직 샘플 로직 기준입니다." and is hidden otherwise. No actual KIS values are included.
- **UI/CSS**: added `.chart-mk-ai-scenario-note`, `.chart-mk-ai-scenario-list`, `.chart-mk-ai-scenario-card` (with tone-based border-left color variants), `.chart-mk-ai-scenario-label`, and `.chart-mk-ai-scenario-text`. Risk checklist reuses the existing shared `.chart-mk-ai-checklist` list style. No new media queries were needed; the scenario card grid is single-column by default and remains mobile-safe.

## 4. Preserved Boundaries

- No external AI API call, package, or server-side AI route added.
- Public/default `/chart-ai` remains sample/mocked; no public KIS quote, no public KIS OHLC.
- No `source=live`, no `source=auto`.
- Owner-local KIS preview (`owner-local-quote-preview.ts`, `owner-local-ohlc-preview.ts`, `kisOwnerLocalGate.ts`) remains the only real KIS-connected path and is unchanged in this phase.
- No API/provider/gate source files changed — this phase is confined to `src/pages/chart-ai.astro`, `docs/planning`, `scripts`, and `package.json` (plus one existing static checker, `scripts/check_chart_ai_ux_skeleton_static_contract.mjs`, updated only to fix a stale literal-copy collision — see Validation).
- No raw KIS response field, secret, or account/trading API reference introduced.

## 5. Validation

- `npm run check:phase-3ew-c-mk-ai-mocked-scenario-risk-checklist-expansion`: PASS (50/50).
- `npm run check:phase-3ew-b-mk-ai-analysis-panel-interaction-depth`: PASS (50/50).
- `npm run check:phase-3ew-a-mk-ai-analysis-panel-mocked-first`: PASS (46/46).
- `npm run check:phase-3ev-b-chart-ai-company-overview-selected-symbol-detail`: PASS (44/44).
- `npm run check:phase-3ev-a-chart-ai-public-sample-fallback-hardening`: PASS (42/42).
- `npm run check:chart-ai-ux-skeleton`: PASS (82/82). One pre-existing check ("Page removes default risk card") initially failed because its substring guard `리스크 체크` collided with the new legitimate "리스크 체크리스트" section label. The guard was narrowed with a negative lookahead (`/리스크 체크(?!리스트)/`) so it still blocks reintroduction of the old default risk-card copy while allowing the new checklist label.
- `npm run check:mobile-baseline`: PASS (74/74).
- `npm run check:provider-boundaries`: PASS.
- `npm run check:kis-runtime-guard`: PASS (7/7).
- `npm run check:kis-error-fallback`: PASS (48/48).
- `npm run check:production-domain`: PASS (33/33).
- `npm run build`: PASS.
- `git diff --check`: PASS (no whitespace errors).

## 6. Vercel Deployment

- Deployment was authorized by the owner for this phase only, and was run after implementation, validation, and commit content were finalized.
- Vercel CLI: `vercel --version` returned `Vercel CLI 54.9.1` (installed); `vercel whoami` confirmed an authenticated session (`sbchangkyun-2946`) without printing any secret or token value.
- Project link: `.vercel/repo.json` confirms the project is linked (project `mkstocklab`, org `team_2wgRRK8xsVfLlNgaiORdCflC`).
- Deployment command: `vercel --prod --yes`.
- Deployment result: SUCCESS. `readyState: "READY"`, `target: "production"`, deployment id `dpl_H8SrWq1TcZJ7MeahCwbdGmFCi7XQ`.
- Deployment URL: `https://mkstocklab-iaevgc1w0-sbchangkyun-2946s-projects.vercel.app`.
- Production URL (aliased): `https://mkstocklab.vercel.app`.
- No Vercel env changes were made. No secret values were printed or inspected.
- Post-deploy safe status check: `curl -I https://mkstocklab.vercel.app/chart-ai` → HTTP 200.
- Push: not required. `vercel --prod --yes` uploads and builds the local working directory directly via the Vercel CLI; it does not depend on or trigger from a git push. No push was performed as part of this deployment.

## 7. Safety

- UI/copy and client-side script change only, confined to `src/pages/chart-ai.astro`; one pre-existing checker's stale literal-copy guard was narrowed (not weakened — it still blocks the original default risk-card copy).
- No live KIS call, no external AI call, no dev server, browser, Playwright/Puppeteer, or screenshot used by Codex.
- No `.env` read; no actual market values, raw response fields, or secrets recorded in this document or the checker.
- No account/trading APIs; no `KIS_ACCOUNT_NO` reference.
- No Supabase/SQL/migration or dependency change.
- No Vercel env changes.
- Deployment: succeeded to production via `vercel --prod --yes` (`https://mkstocklab.vercel.app`); post-deploy status check returned HTTP 200 on `/chart-ai`. Push: not performed, not required.

## 8. Recommended Next Phase

Recommended:
Phase 3EV-C — Chart AI Owner-Local KIS Connected Result UI Enhancement

Alternative:
Phase 3EW-D — MK AI Mocked Action Plan and User Guidance Expansion
