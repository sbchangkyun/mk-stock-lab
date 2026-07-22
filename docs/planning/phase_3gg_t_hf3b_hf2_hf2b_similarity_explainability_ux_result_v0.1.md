# Phase 3GG-T-HF3B-HF2-HF2B — Similarity Explainability UX — Result v0.1

Transforms the real Similarity result from technically-correct-but-hard-to-read output into a polished,
interactive, understandable analytical experience. **No scoring-formula change, no master change, no DB/
env/Vercel change, no LLM, no Production deploy, no PR merge.**

## 1. Executive classification

**`PASS_SIMILARITY_EXPLAINABILITY_UX_PREVIEW_VERIFIED`** — implementation + local gates complete, pushed,
and Owner authenticated protected-Preview visual and interaction QA (§10) confirmed every required overlay,
tooltip, Top-5, score-guide, insight, mobile, touch, and keyboard check with no remaining issue.

## 2. Original UX problems (all addressed)

- **Overlay:** no crosshair / no clear "which D+ am I on" / six lines hard to tell apart / hover did not
  distinguish a line.
- **Tooltip:** concatenated text (`현재882.5#185.0…`) with no spacing, colors, dates, identity, or score/
  value separation.
- **Top-5:** duplicated desktop table + mobile cards (diagnostic-looking, hard to compare).
- **Interpretation:** a number-repetition paragraph that never named the strongest match, agreement,
  risk, or a clear observation, and never explained what a score means or absolute-vs-relative strength.

## 3. Engine / route metadata extension (scoring UNCHANGED)

- `similarity-engine.mjs`: the scoring formula (correlation 0.45 / RMSE 0.35 / direction 0.20, clamped
  0–100) and method version `sim-v1-corr045-rmse035-dir020` are **byte-for-byte unchanged**. Added ONLY
  additive metadata: each scanned candidate gets its **raw sorted rank** (`candidateRank`, 1-based, before
  the min-gap Top-K selection); each selected match carries `candidateRank` and
  `candidateTopPercentile = candidateRank / candidateCount * 100`. Deterministic order and selection are
  unchanged.
- `similarity.json.ts`: surfaces the sanitized scalars `candidateRank`, `candidateTopPercentile` per match
  (plus the existing top-level `candidateCount`). The full candidate array is never exposed.

## 4. Overlay interaction (pointer / touch / keyboard)

- **Vertical crosshair** snaps to the nearest D+ index with a `D+N` marker and per-series point markers.
- **Line emphasis:** at the snapped index the visible series nearest the pointer *in screen pixels*
  (documented 18px threshold, `resolveNearestSeriesByPixel`) is thickened + full-opacity, others dimmed,
  the matching legend item is emphasized, and that series is placed first in the tooltip. No false
  selection when nothing is within the threshold.
- **Legend:** always-visible color swatch + full label (`현재 구간` / `#N · YYYY-MM-DD 시작`), `aria-pressed`
  toggle, hover/focus highlight, keyboard focus, and a guard that never allows zero visible series.
- **Touch:** first tap selects nearest index + line, drag updates the crosshair, a second tap re-emphasizes
  another line, outside tap / Escape clears; `touch-action: pan-y` preserves vertical page scrolling.
- **Keyboard:** the plot is a focusable `role="application"`; ArrowLeft/Right move one D+, Home/End jump to
  ends, Escape clears; a polite screen-reader summary updates on keyboard nav only (never on mouse move).

## 5. Structured tooltip

Header `D+N`; one row per visible series with color swatch, full identity, historical start date, similarity
score (`NN.N점`), and a right-aligned tabular normalized-path value; hovered series first; current interval
distinguished; a footnote clarifies the right value is a **normalized price index (base 100), not the
similarity score**; four-edge collision handling; compact mobile variant.

## 6. Single responsive Top-5 result

One semantic `<table class="chart-similarity-result-table">`. On mobile the same rows transform into cards
via `data-label` cells (no second card DOM), so screen readers meet each match once. Columns: rank,
similarity, **relative candidate position**, historical period, 5/20/60-day return, max drawdown, max
upside. `#1` emphasized; positive/negative shown by text sign (not color alone); `—` for unavailable data;
a note explains incomplete 60-day data.

## 7. Score guide (absolute) + relative rank

- **유사도 점수 이해하기** guide: 0 = lowest / 100 = highest structural similarity; explicitly not an expected
  return and not a probability. Fixed service bands: 80.0–100 매우 높은 · 65.0–79.9 높은 · 50.0–64.9 보통 ·
  35.0–49.9 낮은 · 0–34.9 매우 낮은 형태 유사성 — stated to be **service explanation bands, not calibrated
  probabilities**.
- **Relative position:** `전체 N개 후보 중 R위 / 상위 P%` from `candidateRank / candidateCount`
  (`<0.1%` shown where appropriate); described as position among scanned candidate windows, not confidence.

## 8. Deterministic insight model (no LLM)

Structured cards read in the required order: strongest match → score meaning → relative position → Top-5
outcome agreement → risk/upside → final observation → limitations.

- **Evidence level 패턴 비교 근거 수준** (documented constants): HIGH = top score ≥65, top percentile ≤5%, ≥4
  complete 20-day outcomes, 20-day agreement ≥80%; MODERATE = ≥50 / ≤20% / ≥3 / ≥60%; else LOW. Labelled as
  pattern-comparison basis, **not** prediction confidence.
- **Final categories** (non-advisory): 추가 확인 가치 높음 / 조건부 관심 / 관망 우선 / 패턴 신뢰도 낮음, chosen by a
  documented decision tree over evidence level, 20-day median/positive-share, risk-vs-reward dominance
  (`upsideDominanceRatio 1.25`), #1–#2 score gap (`minScoreGapForDominance 5`), and dispersion.
- **Safety language:** no buy/sell/guarantee/expected-profit/price-will-rise wording (enforced by smoke +
  checker). The negated disclaimer "미래 성과를 예측하거나 보장하지 않습니다" is retained.

## 9. Presentation module + Preview real-experience opt-in

- All interpretation lives in the one authoritative pure module `similarity-explainability-v2.mjs`
  (extended, not duplicated): score guide, candidate position, evidence level, final insight, tooltip
  metadata, highlight ordering, score-gap / outcome-agreement / risk-reward metrics. Pure/deterministic —
  no DOM/fetch/env/time/randomness/provider/secret.
- **One authoritative runtime flag** `chartAiRealExperienceRuntime = isVercelProductionRuntime ||
  (VERCEL_ENV=preview && ?chartAiBetaPreview=1)` replaces the scattered Production-only markup conditions.
  Visibility only — the API routes still enforce their own guards and fail closed, so an un-flagged Preview
  shows the honest guarded state. Client `productionRealChartEnabled` now also enables the real JS under the
  protected-Preview beta path. Production and ordinary-Preview/local behavior are unchanged.

## 10. Preview QA

**Functional integration — VERIFIED (Owner QA, after the HF2B-HF1 guard hotfix, commit e71403b).** The real
Similarity experience was reachable on the protected Preview only after the HF2B-HF1 access-guard fix (a
`VERCEL_ENV=preview` + `NODE_ENV=production` guard collision had blocked the OHLCV chart). On
`…/chart-ai?chartAiBetaPreview=1` (signed in): 069500 search + selection succeeded, explicit chart load
rendered the real OHLCV chart, **Similarity execution succeeded and the real Similarity result UI rendered**;
Preview runtime logs recorded one `/api/chart-ai/market/ohlcv.json` and one `/api/chart-ai/similarity.json`
request (Similarity HTTP 200), no related runtime errors, no Production deployment. See
`phase_3gg_t_hf3b_hf2_hf2b_hf1_preview_kis_guard_hotfix_result_v0.1.md` §10.

**Visual / interaction QA — VERIFIED (Owner QA, protected Preview, feature HEAD `ea9d292`).** On
`…/chart-ai?chartAiBetaPreview=1` (signed in), the Owner completed the full HF2B visual and interaction
checklist. All items **PASS**, no remaining issue:

- **Crosshair and D+ marker:** vertical crosshair followed pointer movement; the `D+N` marker updated
  correctly; visible-series point markers aligned to the inspected index.
- **Series emphasis and legend coordination:** nearest line emphasized, others dimmed; legend and graph
  emphasis synchronized; series visibility toggles behaved correctly; no zero-visible-series state occurred.
- **Tooltip structure and readability:** `D+N` heading displayed; Current and #1–#5 separated into readable
  rows; color swatch, historical date, similarity score, and normalized value visually distinct; selected
  series first; no concatenated text or plot-edge clipping.
- **Top-5 result and desktop presentation:** Top-5 output appeared only once (no duplicate table/card/text
  renderer); `#1` visually emphasized; rows remained readable and comparable.
- **Score guide and candidate percentile:** the 0–100 similarity guide displayed, clearly explained as
  structural similarity (not probability or expected return); candidate rank and top percentile displayed
  correctly.
- **Evidence level and final insight:** pattern-comparison evidence level displayed; Top-5 agreement and
  risk interpretation displayed; a valid non-advisory final insight category displayed; no direct buy/sell
  instruction or future guarantee appeared.
- **Mobile 390px and horizontal overflow:** no horizontal page overflow; the single semantic result
  structure transformed into readable mobile cards; no duplicate results; tooltip stayed inside the visible
  area.
- **Touch and keyboard interaction:** touch inspection and drag worked; normal page scrolling remained
  usable; ArrowLeft/ArrowRight/Home/End/Escape worked; plot focus and clearing behavior worked.

No implementation change was required as a result of this QA round. HF2A3 search transport remains healthy;
no selected-symbol contamination; no Production deploy; no PR merge.

## 11. Tests

- `smoke:phase-3gg-t-hf3b-hf2-hf2b` — 72/72 (engine candidateRank/percentile + unchanged scoring; score-band
  boundaries; the full insight fixture matrix incl. missing-#2 / partial-d60 / divergent; overlay tooltip +
  pixel-nearest + ordering; non-advisory language).
- `check:phase-3gg-t-hf3b-hf2-hf2b` — engine additive-only + formula frozen, module exports/constants,
  single-DOM result, overlay/tooltip/keyboard markup, score-guide + insight containers, the authoritative
  runtime flag, out-of-scope immutability, working-tree purity.
- Regression: HF2A3/HF2A2/HF3B-HF2/HF3B-HF4C/HF3A/HF5-HF6AB/T-HF1/T-HF4 + integrity/auth/workflow checkers,
  `npm ls --depth=0`, `npx astro build`, `git diff --check`. Sibling checkers narrowly reconciled where the
  single-DOM result and the runtime-flag consolidation supersede prior assertions (intent preserved).

## 12. Git / safety

Implementation commit `Phase 3GG-T-HF3B-HF2-HF2B: improve Similarity explainability UX`; docs-only
verification commit only after a real Preview PASS. Feature branch pushed (no main push / force / merge /
auto-merge). No scoring-formula change, no master/manifest/migration/token change, no DB/Supabase/env/Vercel
setting change, no dependency install, no LLM, no Production deploy.

## 13. Next phase

**Phase 3GG-T-HF3B-HF2-PREMERGE-FINALIZATION** (not started here).
