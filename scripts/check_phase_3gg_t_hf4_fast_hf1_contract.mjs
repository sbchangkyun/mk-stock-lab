/**
 * Phase 3GG-T-HF4-FAST-HF1 static contract checker (read-only).
 *
 * Verifies the five confirmed-defect mobile chart interaction cleanup, scoped narrowly against the
 * already-deployed HF4-FAST baseline: compact + semi-transparent mobile tooltip, an idempotent
 * outside-tap reset handler that reuses the existing lightweight reset, a narrowly-scoped [hidden]
 * override so the preparing-state panel actually collapses on chart-ready, balanced OHLCV strip
 * padding, and the complete removal of Market Intelligence from the Chart AI page runtime (backend
 * route + engine preserved). Also re-asserts HF3A selected-symbol integrity, durable-token/auth/route/
 * search/Supabase immutability, no account/order/trading scope, and no dependency change.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const BASELINE = '4b2df40';

const PAGE = 'src/pages/chart-ai.astro';
const INTEGRITY_MODULE = 'src/lib/chart-ai/selected-symbol-integrity.mjs';
const MI_ROUTE = 'src/pages/api/chart-ai/market-intelligence.json.ts';
const MI_ENGINE_DIR = 'src/lib/server/chart-ai/marketIntelligence';
const SMOKE = 'scripts/smoke_phase_3gg_t_hf4_fast_hf1_mobile_interaction_cleanup.mjs';
const CHECKER_SELF = 'scripts/check_phase_3gg_t_hf4_fast_hf1_contract.mjs';
const RESULT_DOC = 'docs/planning/phase_3gg_t_hf4_fast_hf1_mobile_interaction_cleanup_result_v0.1.md';
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

// --- 2. DEFECT-1: mobile tooltip compact + semi-transparent (max-width:640px override) ---
const mobileBlockMatch = page.match(/@media \(max-width: 640px\) \{([\s\S]*?)\n {4}\}\n\n {4}@media/);
const mobileBlock = mobileBlockMatch ? mobileBlockMatch[1] : '';
assert(mobileBlock.length > 0, 'the max-width:640px media block must be present.');
const mobileTooltipMatch = mobileBlock.match(/\.chart-tooltip \{([\s\S]*?)\}/);
const mobileTooltipRule = mobileTooltipMatch ? mobileTooltipMatch[1] : '';
assert(mobileTooltipRule.length > 0, 'mobile .chart-tooltip override must exist.');
assert(/max-width:\s*1[0-6][0-9]px/.test(mobileTooltipRule), 'mobile tooltip max-width must be compact (<=170px).');
// HF4-FAST-HF2 narrowly superseded the exact mobile font-size/background values as an approved
// visual refinement (140px/10.5px/dedicated translucent surface var); tolerate either generation.
assert(/font-size:\s*(0\.7[0-3]rem|10\.5px)/.test(mobileTooltipRule), 'mobile tooltip font-size must be compact.');
assert(/background:\s*var\(--chart-shell-overlay\)|background:\s*var\(--chart-tooltip-mobile-surface\)/.test(mobileTooltipRule), 'mobile tooltip must use a theme-aware semi-transparent surface variable.');
assert(/backdrop-filter:\s*blur\(/.test(mobileTooltipRule), 'mobile tooltip must apply a backdrop blur.');
assert(/pointer-events:\s*none/.test(page.match(/\.chart-tooltip \{([\s\S]*?)\}/)[1]), 'base .chart-tooltip rule must stay pointer-events: none.');
assert(page.includes('추정 거래대금'), 'turnover must remain labeled as an estimate (추정 거래대금).');
assert(!/[^정]거래대금/.test(page.replaceAll('추정 거래대금', '')), 'turnover must never be presented as the bare/official label.');

// --- 3. DEFECT-2: idempotent outside-tap reset handler, reusing the existing lightweight reset ---
const attachFnMatch = page.match(/const attachChartInteractionHandlers = \(\) => \{([\s\S]*?)\n {6}\};/);
const attachFnBody = attachFnMatch ? attachFnMatch[1] : '';
assert(attachFnBody.length > 0, 'attachChartInteractionHandlers must be present.');
assert(/if \(chartInteractionHandlersAttached \|\| !chart \|\| !chartSvg\) return;/.test(page), 'handler registration must stay guarded against duplicate attachment.');
assert(/document\.addEventListener\('pointerdown'/.test(attachFnBody), 'a document-level pointerdown listener must exist for outside-tap detection.');
assert(/chart\.contains\(target\)/.test(attachFnBody), 'outside-tap classification must use chart.contains(target).');
assert(/chart\.contains\(target\)\) return;\s*\n\s*resetChartCandleToLatest\(\);/.test(attachFnBody), 'outside-tap must call the existing lightweight resetChartCandleToLatest (not resetChartInteractionState).');
assert(!/stopPropagation/.test(attachFnBody), 'outside-tap handler must not call stopPropagation.');
assert(/pointerleave[\s\S]{0,120}resetChartCandleToLatest\(\)/.test(attachFnBody), 'desktop pointerleave reset must remain unchanged.');
assert(/Escape'\) \{\s*\n\s*resetChartCandleToLatest\(\);/.test(attachFnBody), 'keyboard Escape reset must remain unchanged.');
assert(/ArrowLeft/.test(attachFnBody) && /ArrowRight/.test(attachFnBody), 'keyboard Left/Right navigation must remain unchanged.');
// The outside-tap handler must never touch selection/active-chart/analysis state directly (only display reset).
assert(!/document\.addEventListener\('pointerdown', \(event\) => \{[\s\S]{0,400}(updateSelection|loadRealChart|integrity\.)/.test(page), 'outside-tap handler must not touch selection, chart-load, or analysis state.');

// --- 4. DEFECT-3: preparing-state panel actually collapses on chart-ready ---
assert(/\.chart-market-preparing-state\[hidden\] \{\s*\n\s*display: none !important;\s*\n\s*\}/.test(page), 'a narrowly-scoped [hidden] override must exist for .chart-market-preparing-state.');
assert(!/\n\s*\[hidden\] \{\s*\n\s*display: none !important;/.test(page), 'the fix must not globally redefine [hidden] for every element.');
assert(/stateEl\.hidden = mode === 'ready';/.test(page), 'JS must still set native hidden = true only once the chart is ready.');
assert(/\.chart-analysis-preparing-state,\s*\n\s*\.chart-market-preparing-state \{\s*\n\s*display: grid;/.test(page), 'the shared author display:grid rule must remain (both preparing-state variants keep their base layout).');

// --- 5. DEFECT-4: OHLCV strip balanced horizontal padding (desktop + mobile) ---
const desktopStripMatch = page.match(/\.chart-ohlcv-strip \{([\s\S]*?)\}/);
const desktopStripRule = desktopStripMatch ? desktopStripMatch[1] : '';
assert(/padding:\s*0\.45rem 0\.9rem;/.test(desktopStripRule), 'desktop .chart-ohlcv-strip must have balanced horizontal padding (12-16px inline / 6-8px block).');
const mobileStripMatch = mobileBlock.match(/\.chart-ohlcv-strip \{([\s\S]*?)\}/);
const mobileStripRule = mobileStripMatch ? mobileStripMatch[1] : '';
assert(/padding:\s*0\.4rem 0\.65rem;/.test(mobileStripRule), 'mobile .chart-ohlcv-strip must have balanced horizontal padding (10-12px inline / 6-8px block).');

// --- 6. DEFECT-5: Market Intelligence fully removed from the page runtime; backend preserved ---
for (const token of ['chartAiMarketIntel', 'chartAiMiStartBtn', 'chartAiMiStatus', 'resetSelectedMarketIntel', 'market-intelligence.json', '시장 인텔리전스', 'miAbort']) {
  assert(!page.includes(token), `chart-ai.astro must no longer contain the removed Market Intelligence token: ${token}`);
}
assert(existsSync(MI_ROUTE), 'Market Intelligence backend route must remain (client-side-only removal).');
assert(existsSync(MI_ENGINE_DIR), 'Market Intelligence backend engine directory must remain.');
const miBackendDiff = runGit(['diff', '--name-only', BASELINE, '--', MI_ROUTE, MI_ENGINE_DIR]).trim();
assert(miBackendDiff === '', `Market Intelligence backend route/engine must not change this phase, but changed: ${miBackendDiff}`);
// Only two active analysis experiences remain wired to the shared HF3A guard.
assert(/integrity\.beginAnalysis\('similar-pattern'\)/.test(page) && /integrity\.beginAnalysis\('mk-ai'\)/.test(page), 'Similar Pattern and MK AI must remain wired to the shared guard.');
assert(!/integrity\.beginAnalysis\('market-intel'\)/.test(page), 'market-intel must no longer call the shared guard.');
assert((page.match(/integrity\.beginAnalysis\(/g) || []).length === 2, 'exactly two analyses must call the shared guard after Market Intelligence removal.');

// --- 7. HF3A guard untouched: no changes to the authoritative integrity module or its wiring ---
const integrityDiff = runGit(['diff', '--name-only', BASELINE, '--', INTEGRITY_MODULE]).trim();
assert(integrityDiff === '', `selected-symbol-integrity.mjs must not change this phase, but diff reports: ${integrityDiff}`);
assert(/integrity\.selectPending\(/.test(page) && /integrity\.beginChartLoad\(\)/.test(page), 'HF3A guard call sites must remain present.');
assert(!/DEFAULT_INSTRUMENT/.test(page), 'no hidden default-instrument fallback may be reintroduced.');
assert(!/(\|\||\?\?)\s*['"]005930['"]/.test(page), 'no Samsung symbol fallback may be reintroduced.');
assert(/let\s+selectedSymbol\s*=\s*['"]['"]/.test(page), 'selectedSymbol must still initialize empty.');

// --- 8. No durable-token / auth / route / search / OHLCV-cache / Supabase architecture change ---
const OUT_OF_SCOPE_PATHS = [
  'src/lib/server/providers/kis',
  'src/pages/api/chart-ai/similarity.json.ts',
  'src/pages/api/chart-ai/mk-analysis.json.ts',
  MI_ROUTE,
  MI_ENGINE_DIR,
  'src/pages/api/chart-ai/market/ohlcv.json.ts',
  'src/pages/api/chart-ai/instruments/search.json.ts',
  'supabase',
];
const outOfScopeDiff = runGit(['diff', '--name-only', BASELINE, '--', ...OUT_OF_SCOPE_PATHS]).trim();
assert(outOfScopeDiff === '', `no durable-token/auth/route/search/Supabase source may change this phase, but changed: ${outOfScopeDiff}`);

// --- 9. No account/order/balance/trading scope; no forbidden exposure ---
for (const pat of [/inquire-balance/i, /inquire-account/i, /order-cash/i, /order-credit/i, /\/trading\//i, /funds?-transfer/i, /KIS_ACCOUNT_NO/, /inquire-psbl-order/i]) {
  assert(!pat.test(page), `no account/order/balance/trading scope may be added: ${pat}`);
}
for (const pat of [/sk-[A-Za-z0-9]{20,}/, /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/, /console\.log\([^)]*process\.env/]) {
  assert(!pat.test(page), `secret-scan: page must not match forbidden exposure ${pat}`);
}

// --- 10. No dependency / lockfile change ---
const lockDiff = runGit(['diff', '--name-only', BASELINE, '--', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock']).trim();
assert(lockDiff === '', `no lockfile change allowed, but changed: ${lockDiff}`);
const pkgDiff = runGit(['diff', BASELINE, '--', PACKAGE_JSON]);
assert(!/^[+-]\s*"[^"]+":\s*"\^?[0-9]/m.test(pkgDiff), 'package.json must not change dependencies (scripts only).');

// --- 11. No deploy command embedded in test code ---
assert(!/vercel deploy|--prod/.test(read(SMOKE)), 'smoke must not contain deploy commands.');

// --- 12. package.json scripts + changelog + result doc ---
const pkg = read(PACKAGE_JSON);
assert(pkg.includes('"smoke:phase-3gg-t-hf4-fast-hf1"') && pkg.includes('"check:phase-3gg-t-hf4-fast-hf1"'), 'package.json must define the HF4-FAST-HF1 scripts.');
assert(read(CHANGELOG).includes('Phase 3GG-T-HF4-FAST-HF1'), 'changelog must contain the Phase 3GG-T-HF4-FAST-HF1 entry.');
const doc = read(RESULT_DOC).toLowerCase();
for (const t of ['hf4-fast-hf1', 'mobile', 'tooltip', 'market intelligence', 'owner']) {
  assert(doc.includes(t), `result doc missing token: ${t}`);
}

// --- 13. .env / .vercel never tracked ---
assert(runGit(['ls-files', '--', '.env', '.env.local']).trim() === '', '.env/.env.local must never be tracked.');
assert(runGit(['ls-files', '--', '.vercel']).trim() === '', '.vercel must never be tracked.');

// --- 14. Working-tree purity: only this phase's expected files (+ narrow sibling-checker reconciliation) change ---
const RECONCILED_SIBLINGS = [
  'scripts/check_phase_3gg_t_fast_contract.mjs',
  'scripts/check_phase_3gg_t_hf1_contract.mjs',
  'scripts/check_phase_3gg_t_hf3a_contract.mjs',
  'scripts/smoke_phase_3gg_t_hf1_chart_ai_auth_zero_request_ui_cleanup.mjs',
  'scripts/smoke_phase_3gg_t_hf4_fast_hf2_mobile_tooltip_title_cleanup.mjs',
  'scripts/check_phase_3gg_t_hf4_fast_hf2_contract.mjs',
  'docs/planning/phase_3gg_t_hf4_fast_hf2_mobile_tooltip_title_cleanup_result_v0.1.md',
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
  console.log(`PASS: Phase 3GG-T-HF4-FAST-HF1 contract checker (${assertions}/${assertions} assertions).`);
  process.exit(0);
} else {
  console.error(`FAILED: ${failures}/${assertions} assertions failed.`);
  process.exit(1);
}
