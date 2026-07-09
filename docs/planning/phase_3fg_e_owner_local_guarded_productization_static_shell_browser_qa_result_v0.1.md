# Phase 3FG-E — Owner-local Guarded Productization Static Shell Browser QA Result v0.1

- **Status: Executed.**
- **Baseline: e4414e5.**
- **Latest completed phase before this phase**: Phase 3FG-D (Owner-local Guarded Productization UI Static Shell, Hidden by Default, No Runtime Activation).
- **Branch**: `rebuild/phase-1-ia-shell`.

## 1. Purpose

Perform owner-local Browser QA for the Phase 3FG-D guarded productization static UI shell on `/chart-ai`, verifying its default-hidden state, owner-local opt-in visible state, coexistence with the pre-existing deterministic agents panel, PC viewport and mobile viewport rendering, static state-card content, Korean safety copy, absence of forbidden CTA/investment language, console cleanliness, network boundary, DOM/source boundary, and default-flow regression. Browser QA / documentation / checker only.

## 2. Files created

- `docs/planning/phase_3fg_e_owner_local_guarded_productization_static_shell_browser_qa_checklist_v0.1.md`
- `docs/planning/phase_3fg_e_owner_local_guarded_productization_static_shell_browser_qa_result_v0.1.md` (this document)
- `scripts/check_phase_3fg_e_contract.mjs`

## 3. Files modified

- `docs/planning/planning_changelog.md` (new Phase 3FG-E entry prepended).
- `package.json` (new `check:phase-3fg-e` script entry).

**No source changes.** **No chart-ai.astro change.** **No API route changed.** **No scaffold source changed.**

## 4. Browser QA environment

- Local Astro dev server (`astro dev`), loopback only, `http://localhost:4321`.
- Browser: Claude Preview tool (Chromium-based headless preview).
- Viewports: 1280×900 (PC viewport) and 375×812 (Mobile viewport).
- **No live KIS.** **No LLM.** **No public/beta activation.** No Supabase/DB real runtime call was triggered by the shell. No env/session/JWT/cookie/header parsing was exercised.

## 5. Browser QA execution summary

QA was executed by navigating the local dev server to four URL states and inspecting DOM properties, computed CSS, `innerText` content, `localStorage`/`sessionStorage`, console output, and the network request log via the Claude Preview tool's introspection APIs (not screenshot-only inspection):

1. `/chart-ai` (default, no query param).
2. `/chart-ai?ownerLocalGuardedProductizationShell=1` (shell opt-in).
3. `/chart-ai?ownerLocalDeterministicAgents=1&ownerLocalGuardedProductizationShell=1` (combined opt-in, for coexistence QA).
4. `/chart-ai` again at 375×812 and 1280×900 (regression + responsive QA).

11 of 12 QA cases passed. 1 case (Case 1, default hidden state) failed due to a confirmed CSS defect, documented in Section 6 below.

## 6. QA case results (all 12 cases)

**Case 1 — Default `/chart-ai` hidden state: FAIL.**

Evidence: at `http://localhost:4321/chart-ai` (no query param), `document.getElementById('chartAiOwnerLocalGuardedProductizationStaticShell').hasAttribute('hidden')` correctly returns `true` (the client-side visibility-gating script correctly sets the `hidden` attribute). However, `getComputedStyle(shell).display` returns `"grid"`, not `"none"`, and the element's bounding box measured `351.8 × 2285.5` px with fully readable content (Korean heading, all 8 state cards, all safety/boundary copy) — i.e. the shell is visually rendered and readable to any visitor, not just owner-local opt-in visitors.

Root cause: `src/pages/chart-ai.astro`'s Phase 3FG-D style block adds:

```css
.chart-owner-local-guarded-productization-shell {
  margin: 1.25rem 0;
  padding: 1.1rem 1.25rem;
  border-radius: 14px;
  border: 1px dashed color-mix(in srgb, var(--primary) 45%, var(--chart-shell-border));
  background: color-mix(in srgb, var(--primary) 6%, transparent);
  display: grid;
  gap: 1rem;
}
```

Per CSS cascade resolution (origin/importance, then specificity, then source order), an author-stylesheet `display: grid` declaration at normal priority always overrides the browser's built-in UA-stylesheet `[hidden] { display: none }` rule, which is also normal priority — this is an origin-priority conflict, not a specificity conflict (both selectors are specificity 0-1-0). By contrast, the pre-existing, correctly-behaving `.chart-owner-local-deterministic-agents-panel` rule has no `display` property at all, so it correctly defers to the UA `[hidden]` rule (`getComputedStyle` confirmed `display: "none"` and a `0×0` bounding box when hidden).

This defect is **not fixed in this phase**, per the Phase 3FG-E forbidden-changes boundary ("Do not modify `src/pages/chart-ai.astro`"). It is fully documented here for the next phase.

**Case 2 — Owner-local shell opt-in visible state: PASS.**

At `/chart-ai?ownerLocalGuardedProductizationShell=1`: `shell.hasAttribute('hidden') === false`; `getComputedStyle(shell).display === "grid"` (now correctly so, since this is the opt-in-visible state); 8 `.chart-owner-local-guarded-productization-shell-card` elements present with badges `["차단됨 (Blocked)" × 7, "스캐폴드 전용 허용 (실제 실행 아님)" × 1]`; zero `<button>`, `<form>`, or `<input>`/`<textarea>`/`<select>` elements inside the shell (no execution CTA, confirmed via direct DOM query).

**Case 3 — Existing deterministic panel preservation: PASS.**

Source inspection of the client-side gating script confirmed `ownerLocalDeterministicAgentsEnabled = mockedChartAiAccess.capabilities.canAccessChartAi && isLocalOwnerHostname() && ownerLocalDeterministicAgentsOptIn` — no additional mocked-access query parameter is required beyond the panel's own `ownerLocalDeterministicAgents=1` opt-in flag, since `canAccessChartAi` defaults to `true` (only `false` when `?chartAiMockLoggedOut=1` is also present). At the combined URL `/chart-ai?ownerLocalDeterministicAgents=1&ownerLocalGuardedProductizationShell=1`, both panels render simultaneously without layout collision: the deterministic panel's bounding box (`top: 1867.7, bottom: 4118.6`) and the shell's bounding box (`top: 4172.2, bottom: 6457.8`) do not overlap (53.6px gap between them), and document order is preserved (deterministic panel precedes the shell).

**Case 4 — PC viewport visual QA: PASS.**

At 1280×900 on the opt-in URL: `document.documentElement.scrollWidth (1265)` ≤ `window.innerWidth (1280)` — no horizontal overflow. No card's `getBoundingClientRect().right` exceeds the viewport width. All 8 cards and all safety/boundary copy are within the document flow. Shell renders as a visually separate block from the deterministic panel (confirmed non-overlapping bounding boxes, Case 3).

**Case 5 — Mobile viewport visual QA: PASS (visibility-with-param mechanics); underlying Case 1 defect also reproduces at mobile width.**

At 375×812 on the opt-in URL: `document.documentElement.scrollWidth (375) === window.innerWidth (375)` — no horizontal overflow. No card exceeds the viewport width. A per-card scan for clipped children (`scrollWidth > clientWidth + 2`) returned zero clipped elements across all 8 cards. Screenshot evidence confirmed readable Korean layout at mobile width. The Case 1 defect (shell visible without the opt-in param) reproduces identically at mobile width, since it is a CSS cascade defect independent of viewport size — not a new mobile-specific regression.

**Case 6 — State card content QA: PASS.**

All 8 required state cards are present with the exact required labels: `Default fail-closed`, `Owner-local without scaffoldOnlyAcknowledged`, `Owner-local with explicit scaffoldOnlyAcknowledged`, `Beta attempt blocked`, `Public attempt blocked`, `Live KIS attempt blocked`, `LLM attempt blocked`, `Real auth attempt blocked`. Each card's extracted `innerText` confirms: a status badge (`차단됨 (Blocked)` for 7 cards; `스캐폴드 전용 허용 (실제 실행 아님)` for the scaffold-only card), a Korean explanation line, a required-approval line, safety-note copy, and a no-execution statement (`이 상태에서는 실제 실행이 전혀 발생하지 않습니다.` for blocked cards; explicit non-runtime-activation language for the scaffold-only card: `실제 런타임 활성화가 아닙니다. 퍼블릭/베타 접근을 활성화하지 않습니다. 실시간 KIS를 활성화하지 않습니다. LLM을 활성화하지 않습니다. 사용량을 차감하지 않습니다. 유료/광고 권한을 해제하지 않습니다.`).

**Case 7 — Safety copy QA: PASS.**

All 6 required Korean safety phrases confirmed present via `innerText` substring match on the shell: `참고용`; `매수·매도 추천이 아닙니다`; `투자 자문이 아닙니다`; `과거 유사 흐름은 미래 성과를 보장하지 않습니다.`; `현재 단계에서는 실제 분석 실행이 아니라 안전 경계 확인용 화면입니다.`; `모든 실제 상품화 게이트는 꺼져 있습니다.`.

**Case 8 — Forbidden CTA/recommendation language QA: PASS.**

All forbidden CTA/investment phrases (`AI 분석 시작`, `실행하기`, `구매`, `신청`, `매수하세요`, `매도하세요`, `지금 진입`, `목표가는`, `손절가는`, `강력 추천`, `상승이 확정`, `하락이 확정`) are absent from the shell's visible text. The substring `활성화` does appear, but only inside negated/blocked-context sentences (`실제 런타임 활성화가 아닙니다.`, `퍼블릭/베타 접근을 활성화하지 않습니다.`, `실시간 KIS를 활성화하지 않습니다.`, `LLM을 활성화하지 않습니다.`, `베타 활성화는 아직 승인되지 않았습니다.`, `퍼블릭 활성화는 아직 승인되지 않았습니다.`) — never as approved CTA/recommendation copy, consistent with the work order's explicit tolerance for negative-context occurrences.

**Case 9 — Console QA: PASS.**

Zero console errors were observed at any tested URL or viewport. Only benign Vite HMR debug messages (`[vite] connecting...`, `[vite] connected.`) were logged, which are pre-existing dev-server infrastructure noise unrelated to the shell.

**Case 10 — Network QA: PASS.**

No live KIS call, no OpenAI/Anthropic/Gemini/LLM call, and no new API route call were observed at any tested URL. Requests observed after navigating to `/chart-ai` (with or without the shell param) were limited to: local dev server assets (`@vite/client`, HMR entrypoint, `style.css`, `chart-ai.astro` style/script chunks, `src/lib/chart-ai/*`, `src/lib/symbol-master/*`, `node_modules/.vite/deps/*`), pre-existing site-wide third-party assets loaded by the shared `Layout.astro`/`Header.astro` (Coupang ad widget script, Google `gstatic` auth icon), and pre-existing Supabase REST/storage calls (`site_settings`, `home-banners` signed URLs) that occur during Home page load, before any navigation to `/chart-ai`, and are unrelated to the shell. One `GET http://localhost:4321/` request showed `net::ERR_ABORTED`, an incidental artifact of the very first page load being superseded by the browser tool's own subsequent navigation — not caused by the shell and not reproducible on any `/chart-ai` navigation.

**Case 11 — DOM/source boundary QA: PASS.**

No scaffold import or execution was observed (confirmed via network log: no request for `guarded-productization-scaffold.mjs` or any `/api/` path). No fetch was introduced by the shell. No env/session/JWT/cookie/header parsing occurred. `localStorage` contained only the pre-existing site-wide keys `theme`, `adPopupExpire`, `mk-stock-lab-auth-ui-hint` — no shell-introduced key. `sessionStorage` was empty. No raw payload, secret, or user identifier was visible in the shell's rendered content (all content is static copy defined in the Phase 3FG-D frontmatter arrays).

**Case 12 — Regression QA: PASS** (aside from the Case 1 defect, which is a visibility defect, not a regression in existing functionality).

At `/chart-ai` default state: existing nav links (`Home`, `Chart AI`, `시장`, `Lab`, `포트폴리오`, `유사 패턴 분석 보기`, `MK AI 분석 보기`, `운영자 소개`, `개인정보처리방침`, `이용약관`) are all present and unchanged. The stock search input and the 5 chart period buttons (`1일`, `1주`, `1개월`, `3개월`, `1년`) are present and unchanged. `chartAiOwnerLocalDeterministicAgentsPanel` remains correctly hidden by default (`hidden: true`, `display: "none"`). The existing default user flow is not altered by the shell's presence in the DOM.

## 7. PC viewport result

PASS. No horizontal overflow at 1280×900 (`scrollWidth 1265` ≤ `innerWidth 1280`); all 8 cards and copy readable within the viewport; shell visually separate from the deterministic panel.

## 8. Mobile viewport result

PASS for opt-in visibility mechanics at 375×812 (`scrollWidth 375 === innerWidth 375`, zero clipped elements across all 8 cards, screenshot-confirmed readable Korean layout). The Case 1 default-hidden defect also reproduces at mobile width (same CSS root cause, not a mobile-specific issue).

## 9. Console result

0 console errors across all 4 tested navigation states. No warnings attributable to the new static shell were observed; the only console output was pre-existing Vite HMR debug noise, unrelated to this phase's change and not newly introduced by it.

## 10. Network result

No forbidden network calls (no live KIS, no LLM, no new API route, no scaffold-triggered fetch) were observed at any tested URL. All observed network calls are documented in Section 6, Case 10 above.

## 11. Regression result

PASS. Existing tab labels, nav links, search input, period buttons, and the deterministic panel's default-hidden behavior are all unchanged and unbroken by the presence of the Phase 3FG-D shell.

## 12. Smoke/checker results

- `npm run smoke:phase-3fg-d`: PASS (pre-existing smoke script, unaffected by this documentation-only phase).
- `npm run check:phase-3fg-d`: PASS (pre-existing checker, unaffected by this documentation-only phase).
- `npm run check:phase-3fg-e` (new, this phase): PASS.

Full command-by-command output is recorded in the final report delivered at the end of this phase.

## 13. Full validation results

All 27 commands from the work order's validation chain, plus `npm run build`, `git diff --check`, and `git status --short`, were executed after all three deliverable files were created and `package.json`/`planning_changelog.md` were updated. Results are recorded in the final report delivered at the end of this phase; any sibling-checker cascade patch required to keep an older checker passing against a HEAD that now includes this phase's changelog entry is documented there as well, following the same additive-only tolerance pattern used in every prior phase.

## 14. Forbidden diff result

Command: `git diff --name-only e4414e5 -- src/pages/chart-ai.astro src/lib/server/chart-ai/guarded-productization-scaffold.mjs src/lib/server/chart-ai/guarded-productization-scaffold.fixture.mjs src/lib/server/chart-ai/mk-agent.mjs src/lib/server/chart-ai/mk-agent.fixture.mjs src/lib/server/chart-ai/similar-pattern-agent.mjs src/lib/server/chart-ai/similar-pattern-agent.fixture.mjs pages/api src/pages/api components supabase src/data package-lock.json pnpm-lock.yaml yarn.lock .env .env.local`

Result: **forbidden diff: empty.**

## 15. Controlled chart-ai diff result

Command: `git diff --name-only e4414e5 -- src/pages/chart-ai.astro`

Result: **controlled chart-ai diff: empty.** (This phase makes zero changes to `chart-ai.astro`, unlike Phase 3FG-D which was allowed exactly that one file.)

## 16. Boundary preservation

**No live KIS.** **No LLM.** No MK AI route activation. **No public/beta activation.** No Supabase/DB real runtime call triggered by the shell. No env/session/JWT/cookie/header parsing. No usage deduction. No paid entitlement unlock. No ad unlock. No dependency/lockfile change. No deploy. No push. **No API route changed.** **No scaffold source changed.** No MK Agent source/fixture change. No Similar Pattern Agent source/fixture change. No KIS provider module change. **No chart-ai.astro change.**

## 17. Known out-of-scope issues

- **Case 1 defect (documented above)**: the Phase 3FG-D static shell is not actually hidden by default due to a CSS `display: grid` cascade-origin defect, despite the `hidden` DOM attribute being correctly toggled by the client-side script. This is a genuine UI defect, not a QA tooling artifact — confirmed via `getComputedStyle`, bounding-box measurement, and `innerText` extraction, and root-caused to a specific CSS rule and line range in `src/pages/chart-ai.astro`. Fixing it is out of scope for this phase per the explicit forbidden-changes boundary and is deferred to Phase 3FG-D-HF1.
- No other UI defects, console errors, or network boundary violations were found during this QA pass.
- Screen-reader/ARIA labeling was not exercised in this QA pass (out of scope per the original work order, which specified DOM/CSS/console/network introspection, not full accessibility audit).

## 18. Next recommended phase

**Phase 3FG-D-HF1 — Static Shell Browser QA Fixes, Hidden by Default, No Runtime Activation.**

Because this QA phase found a real UI defect (Case 1), the next phase must fix the CSS cascade issue in `src/pages/chart-ai.astro` (remove or override the unconditional `display: grid` declaration on `.chart-owner-local-guarded-productization-shell` so it correctly defers to the `[hidden]` UA rule, mirroring the pre-existing correctly-behaving `.chart-owner-local-deterministic-agents-panel` rule), then re-verify all 12 Browser QA cases from this phase (especially Case 1 and Case 5) before Phase 3FG-F (Guarded Productization Current State Handoff Package, No Runtime Change) proceeds.

Live KIS, LLM, beta/public activation, API route activation, scaffold source change, deploy, and push all remain blocked and were not exercised in this phase.
