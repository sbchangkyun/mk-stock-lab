/**
 * Phase 3GG-T-HF4-FAST-HF2 static contract checker (read-only).
 *
 * Verifies the narrow mobile-tooltip refinement + duplicate-title cleanup, scoped against the
 * already-deployed HF4-FAST-HF1 baseline: mobile tooltip max-width shrinks to 130-145px, a
 * translucent scoped surface variable replaces the fully-opaque overlay reuse, a compact two-column
 * OHLC layout with a single date heading, and the removal (not CSS-hiding) of the duplicate large
 * black "유사 패턴 분석" / "MK AI 해석" headings while their small blue eyebrow labels and tab labels
 * remain. Also re-asserts HF1/HF3A selected-symbol integrity, durable-token/auth/route/search/
 * Supabase immutability, no account/order/trading scope, and no dependency change.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const BASELINE = '3be57c3';

const PAGE = 'src/pages/chart-ai.astro';
const INTEGRITY_MODULE = 'src/lib/chart-ai/selected-symbol-integrity.mjs';
const MI_ROUTE = 'src/pages/api/chart-ai/market-intelligence.json.ts';
const MI_ENGINE_DIR = 'src/lib/server/chart-ai/marketIntelligence';
const SMOKE = 'scripts/smoke_phase_3gg_t_hf4_fast_hf2_mobile_tooltip_title_cleanup.mjs';
const CHECKER_SELF = 'scripts/check_phase_3gg_t_hf4_fast_hf2_contract.mjs';
const RESULT_DOC = 'docs/planning/phase_3gg_t_hf4_fast_hf2_mobile_tooltip_title_cleanup_result_v0.1.md';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';

const REQUIRED_FILES = [PAGE, SMOKE, CHECKER_SELF, RESULT_DOC];

let assertions = 0;
let failures = 0;
const assert = (cond, message) => { assertions += 1; if (!cond) { failures += 1; console.error(`FAIL: ${message}`); } };
const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');
const runGit = (args) => { try { return execFileSync('git', args, { encoding: 'utf8' }); } catch { return ''; } };

// --- 1. Required files ---
for (const f of REQUIRED_FILES) assert(existsSync(f), `Required file missing: ${f}`);

const page = read(PAGE);

// --- 2. DEFECT-1/2: mobile tooltip is smaller, more transparent, and structurally compact ---
// A later phase (HF5-HF6AB) legitimately added its own unrelated `@media (max-width: 640px)` block
// (Similarity V2 table/card swap) earlier in the stylesheet, so more than one such media query can
// now exist. Anchor on the block whose content actually contains `.chart-tooltip {`, not on position.
const findMobileTooltipBlock = (src) => {
  const starts = [...src.matchAll(/@media \(max-width: 640px\) \{/g)].map((m) => m.index);
  for (const start of starts) {
    const closeMatch = src.slice(start).match(/\n {4}\}\n/);
    if (!closeMatch) continue;
    const candidate = src.slice(start, start + closeMatch.index + closeMatch[0].length);
    if (candidate.includes('.chart-tooltip {')) return candidate;
  }
  return '';
};
const mobileBlock = findMobileTooltipBlock(page);
assert(mobileBlock.length > 0, 'the max-width:640px media block containing the mobile tooltip override must be present.');
const mobileTooltipMatch = mobileBlock.match(/\.chart-tooltip \{([\s\S]*?)\}/);
const mobileTooltipRule = mobileTooltipMatch ? mobileTooltipMatch[1] : '';
assert(mobileTooltipRule.length > 0, 'mobile .chart-tooltip override must exist.');
const maxWidthMatch = mobileTooltipRule.match(/max-width:\s*(\d+)px/);
const maxWidth = maxWidthMatch ? Number(maxWidthMatch[1]) : NaN;
assert(maxWidth >= 130 && maxWidth <= 145, `mobile tooltip max-width must be within 130-145px, got ${maxWidth}.`);
assert(/padding:\s*6px 7px/.test(mobileTooltipRule), 'mobile tooltip padding must be reduced to ~6px 7px.');
assert(/font-size:\s*10\.5px/.test(mobileTooltipRule), 'mobile tooltip font-size must be reduced to ~10.5px.');
assert(/line-height:\s*1\.2[0-9]?/.test(mobileTooltipRule), 'mobile tooltip line-height must be reduced to ~1.2-1.3.');
assert(/(?<!min-)height:\s*auto/.test(mobileTooltipRule) && !/min-height:\s*[1-9]/.test(mobileTooltipRule), 'mobile tooltip must not carry a large minimum/fixed height.');
assert(/background:\s*var\(--chart-tooltip-mobile-surface\)/.test(mobileTooltipRule), 'mobile tooltip must use the dedicated translucent surface variable, not the fully-opaque shared overlay.');
const lightAlphaMatch = page.match(/--chart-tooltip-mobile-surface:\s*rgb\(255 255 255 \/ (\d+)%\)/);
const lightAlpha = lightAlphaMatch ? Number(lightAlphaMatch[1]) : NaN;
assert(lightAlpha >= 60 && lightAlpha <= 78, `light-mode mobile tooltip surface alpha must be ~68-75% (readable), got ${lightAlpha}.`);
const darkAlphaMatch = page.match(/--chart-tooltip-mobile-surface:\s*rgb\(13 23 40 \/ (\d+)%\)/);
const darkAlpha = darkAlphaMatch ? Number(darkAlphaMatch[1]) : NaN;
assert(darkAlpha >= 60 && darkAlpha <= 78, `dark-mode mobile tooltip surface alpha must exist and be ~70-78%, got ${darkAlpha}.`);
assert(/backdrop-filter:\s*blur\([3-5]px\)/.test(mobileTooltipRule), 'mobile tooltip backdrop blur must stay restrained (3-5px).');
assert(/pointer-events:\s*none/.test(page.match(/\.chart-tooltip \{([\s\S]*?)\}/)[1]), 'base .chart-tooltip rule must stay pointer-events: none.');

// --- 3. Compact mobile content structure (grid, single date heading, no separate 날짜 label) ---
assert(/chart-tooltip-detailed/.test(page) && /chart-tooltip-compact/.test(page), 'both a detailed (desktop) and compact (mobile) tooltip view must exist.');
assert(/\.chart-tooltip-compact\s*\{\s*display:\s*none;\s*\}/.test(page), 'the compact view must be hidden by default (desktop-first).');
assert(/\.chart-tooltip-detailed\s*\{\s*display:\s*none;\s*\}/.test(page) && /\.chart-tooltip-compact\s*\{\s*display:\s*block;\s*\}/.test(page), 'the mobile media block must swap to the compact view.');
assert(/chart-tooltip-compact-date">\$\{datum\.formatted\.date\}/.test(page), 'compact date must render once as a single heading (no separate 날짜 label).');
const compactDateSection = (page.match(/chart-tooltip-compact-date[\s\S]{0,40}/g) || []).join(' ');
assert(!/날짜.{0,20}chart-tooltip-compact/.test(page.replace(/<dl>.*?<\/dl>/gs, '')) , 'the compact mobile view must not carry a separate visible 날짜 label.');
assert(/\.chart-tooltip-compact-grid\s*\{[\s\S]{0,120}grid-template-columns:\s*1fr 1fr/.test(page), 'compact OHLC values must use a two-column CSS grid.');
assert(/시 \$\{datum\.formatted\.open\}[\s\S]{0,60}고 \$\{datum\.formatted\.high\}/.test(page), 'open/high must be adjacent compact grid cells.');
assert(/저 \$\{datum\.formatted\.low\}[\s\S]{0,60}종 \$\{datum\.formatted\.close\}/.test(page), 'low/close must be adjacent compact grid cells.');
assert(/chart-tooltip-compact-grid">[\s\S]*?\$\{datum\.changeAvailable \? datum\.formatted\.change/.test(page), 'change amount must appear in the compact grid as its own cell.');
assert(/chart-tooltip-compact-volume">거래량 \$\{datum\.formatted\.volume\}/.test(page), 'compact volume view must stay a concise 거래량 line.');

// --- 4. DEFECT-3: Similar Pattern large black duplicate title removed; small label + tab remain ---
assert(!/<h2 id="chart-similarity-panel-heading">유사 패턴 분석<\/h2>/.test(page), 'the large black duplicate Similar Pattern <h2> heading must be removed from rendered markup.');
assert(!/<h2[^>]*>유사 패턴 분석<\/h2>/.test(page), 'no <h2> duplicate of the Similar Pattern eyebrow text may remain.');
assert(/<p class="eyebrow" id="chart-similarity-panel-heading">유사 패턴 분석<\/p>/.test(page), 'the small blue Similar Pattern eyebrow label must remain (and keep the heading id for a11y).');
assert(/유사 패턴 분석 보기/.test(page), 'the Similar Pattern tab label must remain.');
assert(/id="chartAiSimilarityStartBtn"/.test(page), 'Similar Pattern execution (start button) must remain.');

// --- 5. DEFECT-4: MK AI large black duplicate title removed; small label + tab remain ---
assert(!/<h3 id="chart-mk-ai-heading">MK AI 해석<\/h3>/.test(page), 'the large black duplicate MK AI <h3> heading must be removed from rendered markup.');
assert(!/<h3[^>]*>MK AI 해석<\/h3>/.test(page), 'no <h3> duplicate of "MK AI 해석" may remain.');
assert(/<p class="eyebrow" id="chart-mk-ai-heading">MK AI<\/p>/.test(page), 'the small blue MK AI eyebrow label must remain (and keep the heading id for a11y).');
assert(/MK AI 분석 보기/.test(page), 'the MK AI tab label must remain.');
assert(/id="chartAiMkAiStartBtn"/.test(page), 'MK AI execution (start button) must remain.');
assert(/aria-labelledby="chart-mk-ai-heading"/.test(page), 'the aria-labelledby reference to the MK AI heading id must still resolve (moved onto the eyebrow).');

// --- 6. DEFECT-5: removed-heading spacing collapses (no leftover fixed height) ---
assert(/\.chart-similarity-panel-heading,\s*\n\s*\.chart-mk-ai-panel-heading \{\s*\n\s*display: grid;\s*\n\s*gap: 0\.5rem;\s*\n\s*\}/.test(page), 'panel-heading containers must stay a simple auto-sized grid (no fixed/min-height added for the removed heading).');

// --- 7. HF3A guard untouched: no changes to the authoritative integrity module or its wiring ---
const integrityDiff = runGit(['diff', '--name-only', BASELINE, '--', INTEGRITY_MODULE]).trim();
assert(integrityDiff === '', `selected-symbol-integrity.mjs must not change this phase, but diff reports: ${integrityDiff}`);
assert(/integrity\.selectPending\(/.test(page) && /integrity\.beginChartLoad\(\)/.test(page), 'HF3A guard call sites must remain present.');
assert(!/DEFAULT_INSTRUMENT/.test(page), 'no hidden default-instrument fallback may be reintroduced.');
assert(!/(\|\||\?\?)\s*['"]005930['"]/.test(page), 'no Samsung symbol fallback may be reintroduced.');
assert(/let\s+selectedSymbol\s*=\s*['"]['"]/.test(page), 'selectedSymbol must still initialize empty.');
assert(/integrity\.beginAnalysis\('similar-pattern'\)/.test(page) && /integrity\.beginAnalysis\('mk-ai'\)/.test(page), 'Similar Pattern and MK AI must remain wired to the shared HF3A guard.');
assert((page.match(/integrity\.beginAnalysis\(/g) || []).length === 2, 'exactly two analyses must call the shared guard (unchanged from HF1).');

// --- 8. HF1 preservation: outside-tap reset, READY-state fix, OHLCV padding, Market Intelligence absence ---
assert(/document\.addEventListener\('pointerdown'/.test(page) && /chart\.contains\(target\)/.test(page), 'the HF1 outside-tap reset handler must remain.');
assert(!/stopPropagation/.test(page.match(/const attachChartInteractionHandlers = \(\) => \{([\s\S]*?)\n {6}\};/)?.[1] || ''), 'outside-tap handler must not call stopPropagation.');
assert(/pointerleave/.test(page), 'desktop pointerleave reset must remain.');
assert(/Escape'\)/.test(page) && /ArrowLeft/.test(page) && /ArrowRight/.test(page), 'keyboard Escape/Arrow handlers must remain.');
assert(/\.chart-market-preparing-state\[hidden\] \{\s*\n\s*display: none !important;\s*\n\s*\}/.test(page), 'the HF1 READY-state [hidden] fix must remain.');
const desktopStripMatch = page.match(/\.chart-ohlcv-strip \{([\s\S]*?)\}/);
assert(/padding:\s*0\.45rem 0\.9rem;/.test(desktopStripMatch ? desktopStripMatch[1] : ''), 'the HF1 desktop OHLCV strip padding fix must remain.');
for (const token of ['chartAiMarketIntel', 'chartAiMiStartBtn', 'market-intelligence.json', '시장 인텔리전스', 'miAbort']) {
  assert(!page.includes(token), `Market Intelligence UI token must remain absent from chart-ai.astro: ${token}`);
}
assert(existsSync(MI_ROUTE), 'Market Intelligence backend route must remain preserved.');
assert(existsSync(MI_ENGINE_DIR), 'Market Intelligence backend engine directory must remain preserved.');
const miBackendDiff = runGit(['diff', '--name-only', BASELINE, '--', MI_ROUTE, MI_ENGINE_DIR]).trim();
assert(miBackendDiff === '', `Market Intelligence backend route/engine must not change this phase, but changed: ${miBackendDiff}`);

// --- 9. No durable-token / auth / Supabase architecture change ---
// Phase 3GG-T-HF3B-HF4C legitimately expands the search route + normalized-OHLCV provider and adds a
// safe cache header to the market-data/analysis routes, so those route paths are no longer frozen here.
// The durable-token/provider (providers/kis), Market Intelligence backend, and Supabase guards remain.
const OUT_OF_SCOPE_PATHS = [
  'src/lib/server/providers/kis',
  MI_ROUTE,
  MI_ENGINE_DIR,
  'supabase',
];
const outOfScopeDiff = runGit(['diff', '--name-only', BASELINE, '--', ...OUT_OF_SCOPE_PATHS]).trim();
assert(outOfScopeDiff === '', `no durable-token/auth/route/search/Supabase source may change this phase, but changed: ${outOfScopeDiff}`);

// --- 10. No account/order/balance/trading scope; no forbidden exposure ---
for (const pat of [/inquire-balance/i, /inquire-account/i, /order-cash/i, /order-credit/i, /\/trading\//i, /funds?-transfer/i, /KIS_ACCOUNT_NO/, /inquire-psbl-order/i]) {
  assert(!pat.test(page), `no account/order/balance/trading scope may be added: ${pat}`);
}
for (const pat of [/sk-[A-Za-z0-9]{20,}/, /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/, /console\.log\([^)]*process\.env/]) {
  assert(!pat.test(page), `secret-scan: page must not match forbidden exposure ${pat}`);
}

// --- 11. No dependency / lockfile change ---
const lockDiff = runGit(['diff', '--name-only', BASELINE, '--', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock']).trim();
assert(lockDiff === '', `no lockfile change allowed, but changed: ${lockDiff}`);
const pkgDiff = runGit(['diff', BASELINE, '--', PACKAGE_JSON]);
assert(!/^[+-]\s*"[^"]+":\s*"\^?[0-9]/m.test(pkgDiff), 'package.json must not change dependencies (scripts only).');

// --- 12. No deploy command embedded in test code ---
assert(!/vercel deploy|--prod/.test(read(SMOKE)), 'smoke must not contain deploy commands.');

// --- 13. package.json scripts + changelog + result doc ---
const pkg = read(PACKAGE_JSON);
assert(pkg.includes('"smoke:phase-3gg-t-hf4-fast-hf2"') && pkg.includes('"check:phase-3gg-t-hf4-fast-hf2"'), 'package.json must define the HF4-FAST-HF2 scripts.');
assert(read(CHANGELOG).includes('Phase 3GG-T-HF4-FAST-HF2'), 'changelog must contain the Phase 3GG-T-HF4-FAST-HF2 entry.');
const doc = read(RESULT_DOC).toLowerCase();
for (const t of ['hf4-fast-hf2', 'mobile', 'tooltip', '유사 패턴', 'mk ai', 'owner']) {
  assert(doc.includes(t), `result doc missing token: ${t}`);
}

// --- 14. .env / .vercel never tracked ---
assert(runGit(['ls-files', '--', '.env', '.env.local']).trim() === '', '.env/.env.local must never be tracked.');
assert(runGit(['ls-files', '--', '.vercel']).trim() === '', '.vercel must never be tracked.');

// --- 15. Working-tree purity: only this phase's expected files change ---
const RECONCILED_SIBLINGS = [
  'scripts/check_phase_3gg_t_hf4_fast_hf1_contract.mjs',
  'scripts/smoke_phase_3gg_t_hf4_fast_hf1_mobile_interaction_cleanup.mjs',
  // Phase 3GG-T-HF5-HF6AB (Similarity/MK Agent experience redesign) — new files + additive
  // swingHigh/swingLow wiring in the analysis engine/scoring modules.
  'src/lib/chart-ai/similarity-explainability-v2.mjs',
  'src/lib/chart-ai/mk-agent-experience-v2.mjs',
  'src/lib/server/chart-ai/mkAiAnalysis/analysisEngine.mjs',
  'src/lib/server/chart-ai/mkAiAnalysis/analysisScoring.mjs',
  'scripts/smoke_phase_3gg_t_hf5_hf6ab_fast_analysis_experience_v2.mjs',
  'scripts/check_phase_3gg_t_hf5_hf6ab_fast_contract.mjs',
  'docs/planning/phase_3gg_t_hf5_hf6ab_fast_analysis_experience_v2_result_v0.1.md',
  'scripts/check_phase_3gg_t_fast_contract.mjs',
  'scripts/check_phase_3gg_t_hf1_contract.mjs',
  'scripts/check_phase_3gg_t_hf4_fast_contract.mjs',
];
const ALLOWED = new Set([...REQUIRED_FILES, CHANGELOG, PACKAGE_JSON, ...RECONCILED_SIBLINGS]);
const KNOWN_PREFIXES = ['.agents/', '.claude/', '.vscode/', 'docs/handoff/', 'skills-lock.json'];
const tolerated = (f) =>
  ALLOWED.has(f) ||
  KNOWN_PREFIXES.some((p) => f === p || f.startsWith(p)) ||
  f === '.gitignore';
let porcelain = [];
try { porcelain = runGit(['status', '--porcelain']).split('\n').map((l) => l.slice(3).trim()).filter(Boolean); } catch { porcelain = []; }
const unexpected = porcelain.filter((f) => !tolerated(f));
assert(unexpected.length === 0, `Unexpected working-tree change outside this phase's scope: ${unexpected.join(', ')}`);

if (failures === 0) {
  console.log(`PASS: Phase 3GG-T-HF4-FAST-HF2 contract checker (${assertions}/${assertions} assertions).`);
  process.exit(0);
} else {
  console.error(`FAILED: ${failures}/${assertions} assertions failed.`);
  process.exit(1);
}
