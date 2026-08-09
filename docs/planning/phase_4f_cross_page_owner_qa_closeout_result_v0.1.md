# Phase 4F — Cross-Page Owner QA Closeout — Result v0.1

Status: `PHASE_4F_CROSS_PAGE_OWNER_QA_PLAN_READY_QA_NOT_STARTED`

This is a skeleton. Manual QA execution has not started. See
`phase_4f_cross_page_owner_qa_closeout_plan_v0.1.md` for the full test plan, matrix, severity
scale, evidence format, and pass rule this result doc will be filled in against.

## §1 Baseline

- Plan baseline: `main` @ `198c24c9f70010bd5cc077555c69c9035066dc7c`.
- Plan branch: `docs/phase-4f-cross-page-owner-qa-plan`.
- Plan commit: `2d80cc68dca2ab808c6560f1ab47caab3242372f`.
- Phase 4F execution baseline: `af52c624a724c728f8d71295c9891dfe58496d85`.
- PR #21 merged.

## §2 Automated Support Gate results

Run against `main` @ `af52c624a724c728f8d71295c9891dfe58496d85` on branch
`docs/phase-4f-owner-qa-execution`. No application code was modified to produce these results.

### §15 command-list results

| # | Command | Result | Total | Notes |
|---|---|---|---|---|
| 1 | `npm run check:phase-4a-home-common-shell` | PASS | 75/75 | 0 failed |
| 2 | `npm run check:phase-4b-market-production-completion` | PASS | 79/79 | 0 failed |
| 3 | `npm run check:phase-4c-chart-ai-production-completion` | PASS | 35/35 | "Phase 4C contract: 35 passed, 0 failed." |
| 4 | `npm run check:phase-4d-lab-production-completion` | PASS | 62/62 | 0 failed |
| 5 | `npm run smoke:phase-4e-portfolio-production-completion` | PASS | 21/21 | 0 failed |
| 6 | `npm run check:phase-4e-portfolio-production-completion` | PASS | 65/65 | 0 failed |
| 7 | `npm run check:mobile-baseline` | PASS | 74/74 | 0 failed |
| 8 | `npm run check:project-lightweight-roadmap` | PASS | 27/27 | 0 failed |
| 9 | `npm run smoke:phase-3gh-portfolio-live-valuation-mvp` | PASS | 55/55 | 0 failed |
| 10 | `npm run check:phase-3gh-portfolio-live-valuation-mvp` | PASS | 86/86 | 0 failed |

`git diff --check` — clean, no output, exit 0.

### Connector-assisted Vercel Production runtime-log review (read-only)

Independently verified (not re-verified by this gate run; recorded as supplied):

- Deployment: `dpl_93kGp3ntmYJLWviXcgPySUV4wVZB` — state READY, target production.
- `githubCommitRef`: `main`; `githubCommitSha`: `af52c624a724c728f8d71295c9891dfe58496d85` (matches this
  gate's baseline).
- Routes checked: `/`, `/market`, `/chart-ai` — all HTTP 200.
- Runtime error/fatal count: 0 for both a recent 10-minute window and a broader 2-hour window.
- 5xx count: 0 for both windows.
- No Redeploy, mutation, environment change, or config change was made to obtain this result
  (strictly read-only connector access, per plan §3 ambiguity #1 / §15).

### Classification

All 10 automated commands PASS (0 failures across all totals) and the connector-assisted Vercel
Production runtime-log review shows 0 errors/5xx on the matching commit SHA.

**`PHASE_4F_AUTOMATED_GATE_PASS_OWNER_QA_READY`**

This classification covers only the automated pre-QA support gate. It does not change the overall
Phase 4F closeout classification (see §6), which remains PENDING until Owner Manual QA (§3) is
executed.

## Owner Findings Checkpoint — 2026-08-09

Evidence source:

- Real authenticated Production Owner review.
- Owner-supplied Production screenshots covering: Home, Chart AI, Market, Lab, Portfolio.
- Independent Claude Code read-only product/code audit (three parallel read-only investigation
  agents tracing the Chart AI timeframe data path, the Portfolio cluster, and the UI/content
  cluster against `main` @ `af52c624a724c728f8d71295c9891dfe58496d85`).
- No application mutation occurred during evidence collection.

**Screenshot evidence limitation, stated explicitly:** the screenshots prove only what is actually
visible. They are not converted into keyboard/touch/focus/session PASS claims unless the
interaction itself was explicitly observed. Where a case below is marked
`PRE_FIX_EVIDENCE_PASS`, only the visible state is confirmed — any unverified interaction
behavior (focus trap, Shift+Tab wrap, Escape close, focus restoration, etc.) remains outstanding
and must be repeated in the final Owner QA pass.

### Two HIGH functional failures

#### F-HIGH-01 — Chart AI timeframe window defect

- Maps to: `CHART-05`
- Result: **FAIL**
- Severity: **HIGH**

Owner observation: 3개월 / 6개월 / 1년 selections rendered substantially the same recent date
window instead of meaningfully different requested ranges.

Independent code audit conclusion: **CONFIRMED.**

Root cause:

- The client correctly sends `activeRange`.
- The OHLCV API correctly receives `range`.
- The normalizer defines distinct lookback windows for 1m / 3m / 6m / 1y.
- The chart-mode provider fetch does only one KIS page per requested range.
- One KIS page is insufficient for 6m/1y (KIS returns at most ~100 daily rows per call).
- The KR query asks for a wider calendar range but still receives only the single recent
  provider page.
- The US chart path requests the latest page without using backward `BYMD` paging.
- Existing candle caps trim results but do not enforce a minimum requested coverage.
- Long-history mode already contains backward paging logic, but chart mode does not use it.

Therefore the UI is not lying intentionally, but successful responses can silently contain
materially less history than the requested window.

Required future correction: **Phase 4F-HF1 only. No fix in this task.**

Required proving test after fix: for representative KR and US instruments, 3m/6m/1y must return
materially different first-candle dates. Target approximate trading-day coverage: 3m ≈ 60–66
candles, 6m ≈ 125–130 candles, 1y ≈ 250–260 candles. Exact counts may vary for holidays/listing
history, so the contract should primarily assert meaningful coverage/window difference rather
than one fragile exact count. Short provider history must surface an honest coverage warning
rather than silently masquerading as a complete requested range.

#### F-HIGH-02 — Portfolio Production KR valuation unavailable

- Maps to: `PORT-10`
- Result: **FAIL**
- Severity: **HIGH**

Owner observation: domestic KR positions display an unavailable/current-price-failed state
rather than actual current valuation and return information.

Independent code audit conclusion: **CONFIRMED.**

Root cause chain: portfolio valuation route → `getQuoteSnapshot({ market: 'KR', symbol })` →
generic `getKisQuoteSnapshot` → generic Production readiness has no Portfolio-scoped exception →
Vercel Production returns `production_not_allowed` → quote becomes unavailable → Portfolio
valuation displays the truthful unavailable state. Existing scoped Production exceptions
currently cover Chart AI and Market Dashboard only, not Portfolio valuation.

Required future correction: add a narrow Portfolio valuation Production exception, analogous to
the existing route-scoped patterns.

- Candidate capability: `allowProductionPortfolioValuationLiveData`
- Candidate explicit Production feature gate: `KIS_ENABLE_PRODUCTION_PORTFOLIO_VALUATION=true`

Security boundary that must remain: authenticated Portfolio valuation route only; read-only
domestic current-price quote only; `KIS_ACCOUNT_NO` remains absent; no account endpoint; no
balance endpoint; no order endpoint; no trading functionality; no generic Production KIS
widening.

Required future correction belongs to **Phase 4F-HF1 only.**

### Functional PASS + UX finding combinations (pre-fix evidence, not final closeout)

#### CHART-07

- Functional evidence: **PASS** — Similarity analysis successfully rendered real output.
- Additional finding: `UX_FINDING_MEDIUM` — information hierarchy is too implementation-oriented;
  Top-5/detail/prose blocks are too dense; difficult to identify the first thing the user should
  understand.
- Not marked as a final post-fix Phase 4F PASS yet.

#### CHART-08

- Functional evidence: **PASS** — MK AI analysis successfully rendered output.
- Additional finding: `UX_FINDING_MEDIUM` — report remains too text-heavy; score/checkpoint/detail
  hierarchy requires redesign; should be integrated into one user-oriented analysis report rather
  than remain a separate engine-oriented presentation.
- Not marked as a final post-fix PASS yet.

#### LAB-13

- Current QA behavior: **PASS** — Congress/NPS pages truthfully disclose that public-data
  integration is still pending and do not present example structures as real holdings.
- Additional classification: `PRODUCT_GAP`. This is not a Phase 4F truthfulness failure.
- Owner decision: move Lab toward a real-data-first MVP after the HIGH fixes / UX correction.

#### PORT-23

- Screenshot evidence supports only: `PRE_FIX_EVIDENCE_PASS` — position-add dialog visibly opens.
- Not claimed from screenshot alone: focus trap, Shift+Tab wrap, Escape close, focus restoration.
  These remain unverified and must be repeated in final Owner QA.

### Cross-product UX / product findings

| ID | Title | Severity | Affected | Finding | Target |
|---|---|---|---|---|---|
| UX-01 | Auth lock-state inconsistency | MEDIUM | Chart AI / Portfolio (inspect Admin before implementation) | "접속 필요 / 로그인이 필요합니다" surfaces use inconsistent typography, font sizing, weight, line-height and spacing — the same concept has separate markup/style implementations | One shared `AuthRequiredState` / lock-state component and one common visual recipe |
| UX-02 | Home urgent-news visual hierarchy | LOW-MEDIUM ENHANCEMENT | Home MARKET NEWS | Titles beginning exactly with `[급보]` `[단독]` `[긴급]` `[속보]` should receive an explicit text badge, accent/high-visibility border, and a subtle static glow if appropriate | Do NOT rely on color alone; do NOT use distracting continuous flashing animation; do NOT style arbitrary bracket prefixes |
| UX-03 | Chart AI report information architecture | MEDIUM | Chart AI | Owner explicitly rejects further incremental cosmetic tweaking; replace the engine-oriented "유사 패턴 분석 보기" / "MK AI 분석 보기" presentation | Unified user-oriented report hierarchy: 1. 요약, 2. 시나리오/과거 유사 흐름, 3. 유사 사례, 4. 근거 데이터/방법론 — using existing API fields where possible; no trading recommendation, no fabricated prediction certainty, no server feature expansion merely for visual redesign |
| UX-04 | Market content-first hierarchy | LOW-MEDIUM | Market | Long introduction + four disclosure bullets currently precede the main dashboard | Title → compact truthfulness/data-basis chips → actual Dashboard → bottom "데이터 기준 및 유의사항"; do not delete the disclosure facts, reorder them |
| PRODUCT-01 | Lab real-data MVP | PRODUCT P0 after HF1/UX1 sequencing | Lab | Congress and NPS have remained placeholders for too long (current truthfulness: PASS) | Real data first → simple table/list → sorting/filter → visualization later. Sequence: NPS first (validate official holdings source → snapshot/as-of/source → actual holdings table), Congress second (validate a defensible Korean National Assembly asset-disclosure source; only implement structured holdings when source extraction is reliable, otherwise retain the honest placeholder). Also flag for source validation: current NPS copy mentioning "분기별" disclosure must be checked against the actual selected official disclosure cadence before implementation |
| UX-05 | Portfolio slow re-entry | MEDIUM | Portfolio | After Portfolio is already loaded, navigating away and returning causes a long load again. Code-audit finding: MPA navigation destroys in-memory state, no persisted data cache, initial path forces fresh selected-portfolio position load, valuation adds provider latency | Short-TTL sessionStorage stale-while-revalidate: namespace by authenticated user id, never store the auth token, clear on sign-out, cached values must display stale/updating semantics honestly, background refresh replaces stale state |
| UX-06 | Portfolio dashboard visual hierarchy | MEDIUM | Portfolio | Asset-management page is dominated by the holdings table | Target above the existing holdings table: total valuation, total cost basis, unrealized P/L, unrealized P/L %, allocation visualization, KR/US breakdown, stock/ETF breakdown, per-portfolio breakdown when aggregate, Top holdings. No historical performance/equity curve in this lane because no historical portfolio valuation snapshot store currently exists |
| UX-07 | Portfolio instrument search absent | MEDIUM-HIGH UX | Portfolio | Typing "삼성전" gives no canonical suggestions. Current behavior: free text + local/static metadata/exact lookup + heuristic inference | Reuse/extract the existing Chart AI instrument search as a shared financial instrument combobox. Selected result must canonically resolve: symbol, displayName, country/market, exchange, assetType, currency. Server-side validation still remains authoritative |

### Architecture notes from independent audit

- **A.** Two competing instrument-identity systems exist: the Chart AI universal instrument
  search/master, and Portfolio's free-text/local heuristic identity. Direction: unify them during
  UX1.
- **B.** Production KIS scope booleans are accumulating. For the Portfolio HIGH fix, adding the
  third narrow scoped flag is acceptable — do not refactor now. Decision: if a fourth Production
  consumer is later added, consider replacing multiple boolean parameters with an explicit
  capability/scope enum.
- **C.** No common client data layer exists across MPA pages. Do not globally refactor now —
  Portfolio SWR is the first targeted correction.
- **D.** OHLCV has no explicit delivered-coverage contract. HF1 should add a truthful
  requested-vs-delivered coverage concept or equivalent testable state.
- **E.** `chart-ai.astro` is a very large mixed-responsibility surface. Do not undertake a broad
  refactor in HF1. UX1 may extract only the components required by the approved redesign: shared
  instrument combobox, shared auth state, presentation components.

### QA status / count policy

Initial Owner evidence collected; formal post-fix closeout matrix remains 0/120. These are
pre-fix findings/evidence, and the materially changed surfaces (Chart AI, Portfolio, Lab, common
UX) must be re-run from zero after HF1 / UX1 / LAB-MVP land, to avoid duplicate QA work against
surfaces that are about to change.

### Execution classification

- Automated gate remains: `PHASE_4F_AUTOMATED_GATE_PASS_OWNER_QA_READY`
- Current execution classification: `PHASE_4F_OWNER_QA_PAUSED_HIGH_FIX_REQUIRED`

Phase 4F is **not** complete. This is not a final closeout classification.

### Approved work-lane sequence

1. **Phase 4F-B1** — Owner findings checkpoint (this task).
2. **Phase 4F-HF1** — Functional HIGH fixes only: Chart AI truthful timeframe coverage/paging;
   Portfolio Production KR valuation KIS scope.
3. **Phase 4F-UX1** — Product UX correction: unified Chart AI analysis report; shared instrument
   combobox; Portfolio SWR; Portfolio dashboard; shared auth-required state; Market
   content-first; Home urgent-news treatment.
4. **LAB-MVP** — NPS source validation + real-data MVP; Korean National Assembly source spike;
   Congress MVP only if the source is defensible.
5. Full automated regression.
6. Final 120-case Owner QA from zero.
7. Phase 4F closeout.

## §3 Owner Manual QA Execution — PENDING (0 / 120 cases recorded)

Per-surface progress (target counts from plan §17):

| Surface | Recorded | Target |
|---|---|---|
| A. Home / Common Shell | 0 | 14 |
| B. Chart AI | 0 | 17 |
| C. Market | 0 | 14 |
| D. Lab | 0 | 15 |
| E. Portfolio | 0 | 38 |
| F. Cross-page / Session | 0 | 8 |
| Accessibility spot check | 0 | 14 |
| **Total** | **0** | **120** |

Evidence records, one per test ID per plan §13's format, go here once QA execution begins.

## §4 Defects Found — PENDING

None recorded yet. Defects are recorded here as found, per plan §12's severity scale, and are
**not** fixed during the evidence-gathering phase — a separate hotfix decision follows afterward.

| ID | Surface | Severity | Summary | Status |
|---|---|---|---|---|
| _none yet_ | | | | |

## §5 Pass-Rule Evaluation — PENDING

Evaluated against plan §16 once §2–§4 above are complete:

- [ ] Zero BLOCKER findings remain.
- [ ] Zero unresolved HIGH findings remain.
- [ ] Every required Owner-manual test has a PASS or an explicitly accepted limitation.
- [ ] The automated regression gate shows no new regression.
- [ ] All remaining MEDIUM/LOW findings are fixed or explicitly accepted/deferred.
- [ ] Evidence recorded per plan §13.
- [ ] Roadmap and changelog updated to accurately state the outcome.

## §6 Final Classification — PENDING

To be set once §5 is fully evaluated. Candidates:
`PHASE_4F_CROSS_PAGE_OWNER_QA_CLOSED_PASS`,
`PHASE_4F_CROSS_PAGE_OWNER_QA_CLOSED_WITH_ACCEPTED_LIMITATIONS`, or a blocked/in-progress label if
findings remain outstanding.
