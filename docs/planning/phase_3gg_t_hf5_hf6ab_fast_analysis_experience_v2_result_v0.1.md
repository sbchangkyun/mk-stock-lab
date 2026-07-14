# Phase 3GG-T-HF5-HF6AB — Similarity and MK Agent Experience Redesign — Result v0.1

## 1. Baseline

- Project path: `C:\Users\kkama\OneDrive\문서\Project\mk-stock-lab`
- Branch: `rebuild/phase-1-ia-shell`
- Starting HEAD (`HF4_FINAL_HEAD`): `9742724`
  (`Phase 3GG-T-HF4-FAST-HF2: verify final chart foundation cleanup in Production`)
- Confirmed matching before implementation began; no checkout/reset/stash/rebase performed.
- Known unrelated working-tree items (`.gitignore`, `.agents/`, `.claude/`, `.vscode/settings.json`,
  `docs/handoff/codex_state_inspection/`, `skills-lock.json`) left untouched and uncommitted, per standing
  instruction.

## 2. Scope

This phase does not follow a prior Owner-reported defect list; it is a planned readability/information-
architecture redesign of two already-shipped Production panels (유사 패턴 분석 / MK AI 해석), requested as
Lane B of the current session alongside Lane A's HF4-FAST-HF2 finalization (Lane A completed first, at
`9742724`, and is the baseline for this phase).

## 3. HF5 — Similarity Explainability V2

- New pure module `src/lib/chart-ai/similarity-explainability-v2.mjs`: builds normalized overlay series
  (current instrument + up to 5 historical matches, each rebased to start at 100), a toggleable legend model
  (rank + match start date per entry, `visible` boolean per series), a D+ axis label set, and a tooltip-value
  selector that only returns values for currently visible series.
- Desktop comparison table / mobile card view built from the same per-match data: 순위, 유사도, 과거 구간,
  5일 후, 20일 후, 60일 후, 최대 낙폭, 최대 상승 — any value the engine could not compute renders as `—`,
  never a fabricated `0`.
- Deterministic aggregate interpretation: counts positive-outcome matches, computes avg/median 5d and 20d
  return, best/worst 20d return, avg/worst drawdown, and classifies agreement into three fixed-threshold
  labels — "비교적 일관됨" (≥0.8 same-direction agreement), "다소 엇갈림" (≥0.6), "결과 편차가 큼" (below
  0.6). No language implies a forecast or guarantee.
- Technical/engine detail (raw distance metric, method version, window sizes) moved behind an optional
  "분석 기준 보기" `<details>`-style disclosure; the primary reading path no longer repeats disclaimer or
  engine-process copy inline.
- Chart overlay legend entries are real toggle buttons (`aria-pressed`, keyboard-operable via native button
  semantics); toggling a series updates both the overlay lines and the tooltip's visible-value set.

## 4. HF6A — MK Agent Experience V2

- New pure module `src/lib/chart-ai/mk-agent-experience-v2.mjs`: reorders the MK AI panel into (1) a single
  deterministic conclusion sentence, (2) current flow/status line, (3) six structured score cards, (4)
  strategy checkpoints (HF6B), (5) detailed sections behind a real accordion, (6) a data-basis explanation,
  (7) exactly one disclaimer.
- Six score cards — 추세 강도, 모멘텀, 가격 안정성, 패턴 유사도, 위험 수준, 데이터 품질 — each carrying a
  rounded score, a status label, a one-line meaning, and a `direction` attribute driving card styling:
  trend/momentum/stability treat a higher score as favorable; risk treats a higher score as unfavorable;
  similarity is explicitly labeled as "더 유사함" (more similar) rather than "더 상승 가능성" (more likely to
  rise); data quality is explicitly labeled as data completeness, not analysis confidence.
- Detailed sections use a real ARIA accordion (`aria-expanded` / `aria-controls` wired to matching ids, no
  native `<details>` fallback), with only the first section expanded by default.
- Data-basis explanation states in plain language that a 100-point data-quality score reflects how much
  usable price history was available, not how confident the analysis is.
- Fixed Korean particle-selection bugs: batchim-aware helper functions choose 은/는, 이/가, 을/를, 와/과
  correctly for both instrument names and dynamic values (no more literal "삼성전자은(는)").
- No direct buy/sell command language ("매수/매도하세요") and no guaranteed-return language anywhere in the
  module's generated copy.

## 5. HF6B — Strategy Checkpoints

- New "전략 체크포인트" section, four groups, each built only from values the engine can actually derive:
  - A. 상승 전환 확인 조건
  - B. 하락 위험 확대 조건
  - C. 현재 관찰 우선순위
  - D. 핵심 가격대
- Group D price levels are labeled by their real calculation basis — "최근 저점 (20거래일)", "최근 고점
  (20거래일)", "20일 이동평균", "60일 이동평균" — and never called 지지선/저항선 (support/resistance).
- Explicitly out of scope this phase (reserved for a future HF6C): RSI, MACD, Bollinger Bands, ATR, and any
  formal support/resistance calculation. Verified absent from the module's generated copy (word-boundary
  scan, comments excluded).
- When no group can derive a real signal, the group renders an honest fallback bullet rather than a
  fabricated condition.

## 6. Additive engine/scoring wiring

- `src/lib/server/chart-ai/mkAiAnalysis/analysisEngine.mjs` and `.../analysisScoring.mjs`: added
  `recentSwingHigh20` / `recentSwingLow20` derived metrics (20-bar recent high/low) to back the Group D price
  levels. Existing scoring/analysis fields and behavior unchanged; diff scoped to these two additive metrics
  only.

## 7. `chart-ai.astro` wiring

- Both new pure modules imported and used to render the Similarity and MK AI Production panels.
- HF3A `selected-symbol-integrity` guard call sites unchanged: exactly 2 `integrity.beginAnalysis(...)`
  calls (`similar-pattern`, `mk-ai`), `resolveAnalysis` gating preserved, no `DEFAULT_INSTRUMENT`/Samsung
  fallback reintroduced.
- Market Intelligence UI remains absent from the Chart AI page; its backend route and engine are untouched
  and preserved.
- No account/order/balance/funds/trading markup or endpoint added.

## 8. Sibling checker/smoke reconciliation (narrow)

- Added tolerance for this phase's additive files (`src/lib/chart-ai/similarity-explainability-v2.mjs`,
  `src/lib/chart-ai/mk-agent-experience-v2.mjs`, the two analysis-engine/scoring files, and this phase's new
  smoke/checker/result-doc) across five sibling checkers: T-HF1, T-HF4-FAST, T-HF4-FAST-HF1, T-HF4-FAST-HF2,
  T-FAST — using each checker's existing tolerance style (`RECONCILED_SIBLINGS` array or inline regex chain,
  unchanged per-checker convention).
- Fixed a real fragility (not a functional regression) in the HF4-FAST-HF1 and HF4-FAST-HF2 smoke+checker
  files (4 files total): their mobile-tooltip block locator assumed exactly one
  `@media (max-width: 640px)` block in the stylesheet, immediately followed by another `@media` block. This
  phase's new, unrelated `@media (max-width: 640px) { .chart-similarity-table-wrap { display: none; } }`
  block (added for the Similarity V2 responsive table/card swap) is a second occurrence of that selector
  earlier in the file, which the old position-based regex matched instead of the real mobile-tooltip block.
  Fixed by anchoring the locator on the block whose content contains `.chart-tooltip {`, independent of
  position or how many same-media-query blocks exist. No assertion threshold was weakened; the live CSS
  itself was confirmed correct and unchanged before touching any test file.
- Second-order cascade: after editing three sibling checkers directly (T-FAST, T-HF1, T-HF4-FAST), their own
  file paths were added to the HF4-FAST-HF1/HF2 `RECONCILED_SIBLINGS` lists so those two checkers' own
  working-tree-purity checks did not flag the edited sibling-checker files as unexpected.

## 9. Local test results

- `node scripts/smoke_phase_3gg_t_hf5_hf6ab_fast_analysis_experience_v2.mjs` — 106/106 PASS
- `node scripts/check_phase_3gg_t_hf5_hf6ab_fast_contract.mjs` — 122/122 PASS
- Full regression gate: HF4-FAST-HF2 smoke/checker, HF4-FAST-HF1 smoke/checker, HF4-FAST checker, HF3A
  smoke/checker, T-HF1 checker, T-HF2/T-HF2-HF1 checkers, T-FAST checker, Q/R/N-FAST checkers, OP checker —
  all PASS (see Owner Checkpoint report delivered alongside this doc for the full list and counts).
- `npx astro build` — PASS (`[build] Complete!`)
- `git diff --check` — clean (only benign CRLF warnings on Windows, exit code 0)

## 10. Implementation commit

- Commit message: `Phase 3GG-T-HF5-HF6AB: redesign Similarity and MK Agent experience`
- Files changed: `src/pages/chart-ai.astro`, `src/lib/chart-ai/similarity-explainability-v2.mjs`,
  `src/lib/chart-ai/mk-agent-experience-v2.mjs`,
  `src/lib/server/chart-ai/mkAiAnalysis/analysisEngine.mjs`,
  `src/lib/server/chart-ai/mkAiAnalysis/analysisScoring.mjs`,
  `scripts/smoke_phase_3gg_t_hf5_hf6ab_fast_analysis_experience_v2.mjs`,
  `scripts/check_phase_3gg_t_hf5_hf6ab_fast_contract.mjs`,
  `scripts/check_phase_3gg_t_hf4_fast_hf1_contract.mjs`, `scripts/check_phase_3gg_t_hf4_fast_hf2_contract.mjs`,
  `scripts/smoke_phase_3gg_t_hf4_fast_hf1_mobile_interaction_cleanup.mjs`,
  `scripts/smoke_phase_3gg_t_hf4_fast_hf2_mobile_tooltip_title_cleanup.mjs`,
  `scripts/check_phase_3gg_t_hf1_contract.mjs`, `scripts/check_phase_3gg_t_hf4_fast_contract.mjs`,
  `scripts/check_phase_3gg_t_fast_contract.mjs`, `package.json`, `docs/planning/planning_changelog.md`,
  this result document.
- No push performed (`GIT_PUSH_AUTHORIZED: NO`).

## 11. Production deployment

- Deployed via `vercel deploy --prod --yes` only (no local `vercel build`).
- Deployment metadata (id, READY state, alias, deployed commit hash) recorded in the Owner Checkpoint report
  delivered alongside this commit — no environment values printed.

## 12. Safe unauthenticated Production regression

Performed after deployment: `GET /chart-ai` → 200; the five protected Chart AI API routes → sanitized 401
with no stack trace or secret; no provider/KIS work triggered by unauthenticated entry; deployed page HTML
contains no Market Intelligence UI and no hidden Samsung default; deployed HTML/CSS contains the new
Similarity legend/table/card and MK AI score-card/accordion markup; no account/order/trading endpoint
exposed.

## 13. Owner QA — pending

Owner-authenticated browser QA has not been performed as part of this run
(`OWNER_AUTHENTICATED_BROWSER_QA_REQUIRED: YES`). This document will be updated with the Owner's checkpoint
results and final classification once that QA completes; until then no `PASS_..._PRODUCTION_VERIFIED`
classification is claimed for HF5-HF6AB.
