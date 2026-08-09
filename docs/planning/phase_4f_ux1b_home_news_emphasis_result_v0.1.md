# Phase 4F-UX1-B — Home MARKET NEWS Breaking / Exclusive Emphasis

**Result document v0.1**

## 1. Owner requirement

Home MARKET NEWS currently renders every article with the same visual treatment. When a source
article TITLE begins with exactly one of `[급보]` `[단독]` `[긴급]` `[속보]`, the Owner requested
the card be made conspicuously easier to identify — via accent border, high-visibility character,
subtle **static** glow, and an explicit text badge — while preserving the existing category badge,
in both light and dark mode. Explicitly ruled out: continuous flashing/blinking animation, and
conveying state by color alone.

This is a presentation-only change. It does not alter feed ranking, provider selection, article
filtering, or the `/api/news/home.json` contract (§6). It is unrelated to, and does not touch,
F-HIGH-02/PORT-10 or F-HIGH-03 (Portfolio canonical instrument identity), both of which remain
Owner-verification-pending per the standing Phase 4F closeout tracker.

Phase 4F-UX1-A (the prior phase, `docs/planning/phase_4f_ux1a_home_surface_guard_result_v0.1.md`
§4) explicitly excluded "Home urgent-news styling (`[급보]`/`[단독]`/`[긴급]`/`[속보]`)" from its
scope — this phase is that deferred work, done as its own separately-reviewed change.

## 2. Prefix contract

New pure module `src/lib/home/homeNewsEmphasis.ts`:

```ts
export type NewsEmphasis = 'breaking' | 'exclusive' | null;
export const parseHomeNewsEmphasis = (title: string): NewsEmphasis => { ... };
```

Matching rule: `title.trimStart()`, then an **exact** `startsWith()` check against one of exactly
four whitelisted literal prefixes — `[급보]` / `[긴급]` / `[속보]` → `'breaking'`, `[단독]` →
`'exclusive'`. No regex over arbitrary bracket content, no substring search elsewhere in the
title. A near-miss like `[속보성]` fails naturally: after matching `[속보]` character-by-character,
the very next character in the title (`성`) diverges from the literal `]` the whitelist prefix
requires, so `startsWith` returns `false` — no special-case code was needed. A prefix that isn't
at position 0 after trimming (e.g. `"오늘 [속보]라고 전한 기사"`) is also `null`, by construction of
`startsWith`.

Verified against all §8-required cases, including the two adversarial near-misses
(`[속보성]`, `[종합]`) and an additional one added during testing (`[긴급속보]`, a compound
bracket that must NOT match — see §8 below).

## 3. Display contract

The full, original article title is never discarded. `HomeMarketNews.astro`'s article anchor
still sets `aria-label="${title}"` using the untouched, HTML-escaped original title — so the
accessible name always identifies the real source headline, regardless of how the visible
headline is rendered.

For the **visible** headline text, this phase chose to strip the recognized leading prefix (via
`deriveHomeNewsDisplayTitle`) rather than keep it and risk `[속보] [속보] ...`-style duplication
next to the new emphasis badge, since the badge already communicates the urgency separately (this
was the "cleaner accessible approach" §3 asked to choose and document). If stripping would leave
an empty headline (a title that is only the bracket prefix, with no following text), the original
title is used unchanged as a fallback — a card headline is never rendered blank.

Card structure per article, in order: emphasis badge (if any) → existing category badge → source
name → published date, then the (possibly prefix-stripped) headline, then description. The
existing category badge (`국내주식`/`해외주식`/`환율`/`거시경제`/`원자재`/`시장일반`) is unchanged
and always rendered alongside the emphasis badge, never replaced by it.

## 4. Visual design

New CSS-variable pairs in `src/styles/style.css`, given explicit distinct values in **both** the
`:root` block and the `body.dark-mode` block (this project does not use `prefers-color-scheme` or
`[data-theme]` for component colors — theming is a `body.dark-mode` class toggle, so relying on
automatic dark-mode inheritance would have left the new accents undefined in dark mode):

| Variable | Light | Dark |
|---|---|---|
| `--news-breaking-accent` | `#e0311f` | `#ff6b57` |
| `--news-breaking-glow` | `rgba(224, 49, 31, 0.26)` | `rgba(255, 107, 87, 0.34)` |
| `--news-breaking-badge-bg` | `rgba(224, 49, 31, 0.12)` | `rgba(255, 107, 87, 0.18)` |
| `--news-exclusive-accent` | `#7a3fd1` | `#b794f6` |
| `--news-exclusive-glow` | `rgba(122, 63, 209, 0.22)` | `rgba(183, 148, 246, 0.3)` |
| `--news-exclusive-badge-bg` | `rgba(122, 63, 209, 0.12)` | `rgba(183, 148, 246, 0.18)` |

Deliberately distinct from `--positive`/`--negative` (price direction) — these mark
source-headline urgency, not price movement, and reusing the price-direction palette would
conflate the two meanings.

- **`.home-news-card--breaking`** — accent border (via an inset `box-shadow` ring, so the border
  never shifts card layout) plus a static outer glow (`box-shadow` blur, no animation), stacked on
  top of the existing `--shadow`. Explicit `:hover`/`:focus`/`:focus-visible` variants keep the
  accent visible on interaction instead of being overridden by the base card's hover rule.
- **`.home-news-card--exclusive`** — the same treatment with the violet exclusive accent/glow, a
  visibly different hue from breaking so the two levels are distinguishable at a glance.
- **`.home-news-emphasis-badge--breaking` / `--exclusive`** — explicit background + 1px border +
  text color, all derived from the same semantic variables.

No `animation:`, no `@keyframes`, no `infinite` — verified by the new checker (§9, Group 3).

## 5. Accessibility

- The badge's **text** (`속보` / `단독`) is the primary state carrier, not color — satisfies "do
  not convey state by color alone."
- Badge/accent colors were chosen saturated enough for text contrast against `--surface` in both
  modes (light: dark saturated red/violet on white; dark: bright red/violet on the dark `#162131`
  surface).
- No `text-shadow` was added.
- The anchor's click/keyboard behavior, `href`, `target="_blank"`, and
  `rel="noopener noreferrer"` are unchanged; the base card's `:focus`/`:focus-visible` outline
  rule (`outline: 2px solid var(--primary)`) is untouched and still applies to emphasis cards —
  the modifier classes only add box-shadow/border-color, a different property, so keyboard focus
  visibility is preserved.
- `aria-label` always carries the full original title (§3).

## 6. Existing news contract (unchanged)

`/api/news/home.json`, the `HomeNewsArticle` shape (`sourceName`, `category`, `publishedAt`,
`url`), the 5-minute refresh interval, the fallback/last-good `feedMode` notice logic, and the
no-news empty state are all untouched — verified explicitly by the new checker's Group 5. This
phase is presentation-only: no feed ranking, provider, or filtering change, and no "fake urgency"
classification beyond the four exact source-title prefixes.

## 7. Home surface guard (§7 — UX1-A/A1 preserved)

No new top-level `Home*.astro` component was added, `index.astro` was not touched at all, and the
Home section order/registry are unchanged. `HomeMarketNews.astro`'s internal script gained an
import and rendering logic, which is exactly the kind of "internal state inside an already-approved
component" the UX1-A guard's own limitation section documents as out of its detection scope by
design — no `index.astro` change was needed or made.

One narrow, documented reconciliation was required in
`scripts/check_phase_4f_ux1a_home_surface_contract.mjs` (Group 6): its original "no scope creep"
assertion was a blanket ban on the literal strings `급보`/`단독`/`긴급`/`속보` appearing anywhere in
`HomeMarketNews.astro`, written when that phase explicitly deferred this work. The assertion was
narrowed — not removed — to require that any occurrence of those tokens be routed through the
reviewed `src/lib/home/homeNewsEmphasis.ts` module (checked via the `from '../lib/home/
homeNewsEmphasis'` import string), rather than hand-rolled inline. This still fails on unauthorized
ad-hoc urgent-news styling; it only stops failing on the one authorized, separately-reviewed
introduction this phase makes. `smoke:phase-4f-ux1a-home-surface` (8/8 → 25/25, template-tolerant
existing suite unchanged) and `check:phase-4f-ux1a-home-surface` (28/28 → 46/46) both remain fully
green after the change.

## 8. Behavioral tests

New `scripts/phase_4f_ux1b_home_news_emphasis_testsrc.ts`, bundled and run by
`scripts/smoke_phase_4f_ux1b_home_news_emphasis.mjs` (esbuild + dynamic import, same pattern as
the UX1-A suite). **23/23 passed.** Covers, against the real unmodified `homeNewsEmphasis.ts`
module:

- All §8-required parser cases: `[속보]`/`[긴급]`/`[급보]` → breaking, `[단독]` → exclusive,
  leading-whitespace variants of both, `"오늘 [속보]..."` → null, `"[속보성]..."` → null,
  `"[종합]..."` → null, empty title → null, plain title → null, plus an added adversarial case
  `"[긴급속보]..."` → null (a compound bracket that is not one of the four exact whitelisted
  strings).
- The rendered decision: breaking → `home-news-card--breaking` class + `속보` badge label;
  exclusive → `home-news-card--exclusive` class + `단독` badge label; normal → neither.
- The display-title derivation: prefix stripped only when recognized, original title
  untouched as a value, non-matching titles pass through unchanged, and the prefix-only-title
  edge case falls back to the original instead of ever producing a blank headline.

`HomeMarketNews.astro`'s `<script>` block itself (an Astro component script, not a standalone
importable module) is verified separately via static source-text assertions in the new checker
(§9) rather than executed — the same convention used by the UX1-A suite for `index.astro`.

## 9. Contract checker

New `scripts/check_phase_4f_ux1b_home_news_emphasis_contract.mjs`. **42/42 passed.** Eight groups:
exact four-prefix whitelist + no-generic-bracket-regex (8 checks); rendering wiring — explicit
badge, dedicated modifier classes, category/source/date/link preserved, aria-label uses the
original title (10 checks); static-only visual treatment — no `@keyframes blink/pulse/flash`, no
`animation:`, no `infinite` (7 checks); light+dark semantic variables with distinct values,
referenced by class not hard-coded hex (3 checks); existing news contract preserved — route,
`feedMode` notice, empty/delayed states, refresh interval (5 checks); UX1-A surface guard + Home
order unchanged — registry counts, no `HomeRetentionPanel`, main-column order, still exactly 5
distinct `<Home...>` components (4 checks); no unrelated page changes — Portfolio/Chart AI/Lab
untouched markers (3 checks); `package.json` wiring (2 checks).

`package.json` gained `smoke:phase-4f-ux1b-home-news-emphasis` and
`check:phase-4f-ux1b-home-news-emphasis`.

## 10. Responsive design (§10)

`.home-news-card-meta` already used `flex-wrap: wrap` before this phase (for category
badge/source/date); the new emphasis badge is simply one more flex child in that row, so it wraps
onto its own line on narrow viewports using the exact same pre-existing wrapping behavior — no new
overflow risk was introduced. The card's border/box-shadow modifier does not change layout box
size (the accent ring uses an *inset* `box-shadow`, not a wider `border`, so there is zero
layout shift between emphasized and normal cards at any width). `.home-news-headline` keeps its
existing `word-break: keep-all` / `overflow-wrap: break-word` rules untouched. No changes were
made to the grid breakpoints (`980px` → 2-col, `640px` → 1-col). Reasoned through 1440/1024/768/
412/390/360/320 against the unchanged grid + pre-existing wrap behavior; no horizontal
page-overflow mechanism was touched by this change.

## 11. Test totals and regression (§11)

Focused (new):
- `smoke:phase-4f-ux1b-home-news-emphasis` — **23/23**.
- `check:phase-4f-ux1b-home-news-emphasis` — **42/42**.

Full §11 regression gate, exact order, all green:
- `smoke:phase-4f-ux1a-home-surface` — **25/25**.
- `check:phase-4f-ux1a-home-surface` — **46/46**.
- `check:phase-4a-home-common-shell` — **75/75**.
- `check:phase-4b-market-production-completion` — **79/79**.
- `check:phase-4c-chart-ai-production-completion` — **35/35**.
- `check:phase-4d-lab-production-completion` — **62/62**.
- `smoke:phase-4e-portfolio-production-completion` — **21/21**.
- `check:phase-4e-portfolio-production-completion` — **65/65**.
- `smoke:phase-4f-hf1-functional-high` — **59/59** (2 suites: 39 + 20).
- `check:phase-4f-hf1-functional-high` — **58/58**.
- `smoke:phase-4f-hf2-portfolio-identity` — **75/75** (3 suites: 15 + 26 + 34).
- `check:phase-4f-hf2-portfolio-identity` — **63/63**.
- `check:mobile-baseline` — **74/74**.
- `check:project-lightweight-roadmap` — **27/27**.
- Full 10-command Phase 4F gate (`check:phase-4a-home-common-shell` 75/75,
  `check:phase-4b-market-production-completion` 79/79,
  `check:phase-4c-chart-ai-production-completion` 35/35,
  `check:phase-4d-lab-production-completion` 62/62,
  `smoke:phase-4e-portfolio-production-completion` 21/21,
  `check:phase-4e-portfolio-production-completion` 65/65, `check:mobile-baseline` 74/74,
  `check:project-lightweight-roadmap` 27/27, `smoke:phase-3gh-portfolio-live-valuation-mvp` 55/55,
  `check:phase-3gh-portfolio-live-valuation-mvp` 86/86) — all green, unchanged from prior phases.
- `git diff --check` — clean.
- `npm ls --depth=0` — clean (no `UNMET`/`invalid`/`missing`/`extraneous`).
- `npm run build` — all real build stages completed successfully (types generated, server
  entrypoints built, 3 Vite builds, Vercel adapter server-asset rearrangement); the process then
  exited nonzero on this Windows machine, the same known post-build teardown artifact documented
  in prior Phase 4F/4E result docs — not a compile error.

No existing test was weakened; the one existing assertion that was edited
(`check_phase_4f_ux1a_home_surface_contract.mjs` Group 6, §7 above) was narrowed to keep guarding
against unauthorized scope creep while accommodating this phase's authorized, separately-reviewed
change.

## 12. Scope audit

`git status --short` confirms a small, correctly-scoped diff:

- Modified: `package.json` (2 new npm script lines).
- Modified: `scripts/check_phase_4f_ux1a_home_surface_contract.mjs` (Group 6 reconciliation, §7).
- Modified: `src/components/HomeMarketNews.astro` (import + emphasis wiring in `renderArticles`
  only).
- Modified: `src/styles/style.css` (new CSS variables + `.home-news-emphasis-badge`/
  `.home-news-card--breaking`/`.home-news-card--exclusive` rules).
- New: `src/lib/home/homeNewsEmphasis.ts`.
- New: `scripts/phase_4f_ux1b_home_news_emphasis_testsrc.ts`.
- New: `scripts/smoke_phase_4f_ux1b_home_news_emphasis.mjs`.
- New: `scripts/check_phase_4f_ux1b_home_news_emphasis_contract.mjs`.
- New: this document.

No changes to `src/pages/index.astro`, `HomeRetentionPanel.astro`, Portfolio, KIS, Chart AI,
Market Dashboard, Lab, or auth lock UI. Pre-existing Owner-local untracked files (`.agents/`,
`.claude/`, `.vscode/settings.json`, `docs/handoff/codex_state_inspection/`,
`set-gnews-vercel-env.ps1`, `skills-lock.json`) were left untouched and were not staged.

## 13. F-HIGH status (unchanged, preserved exactly)

- **F-HIGH-01 / CHART-05** — **CLOSED.**
- **F-HIGH-02 / PORT-10** — **IMPLEMENTED. PRODUCTION OWNER VERIFICATION STILL REQUIRED.**
- **F-HIGH-03 (Portfolio canonical identity)** — **IMPLEMENTED. PRODUCTION OWNER VERIFICATION
  STILL REQUIRED.**

Owner QA remains formally **0/120**. This phase does not alter F-HIGH-02 or F-HIGH-03 in any way —
it is a Home MARKET NEWS visual-emphasis-only change.

## 14. Final classification

**PHASE_4F_UX1B_HOME_NEWS_EMPHASIS_IMPLEMENTED_PREMERGE_REVIEW_REQUIRED**
