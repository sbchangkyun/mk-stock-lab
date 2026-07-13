/**
 * Phase 3GG-T-HF4-FAST static contract checker (read-only).
 *
 * Verifies: the HF3A selected-symbol integrity guard is untouched and still authoritative; the new pure
 * chart-interaction-foundation.mjs helper module stays pure (no DOM/network/time/randomness); chartScale.ts
 * only gained additive fields (3-way candle direction, exposed priceMin/priceMax); chart-ai.astro wires a
 * Production-only interaction layer (header price row, OHLCV strip, tooltip, crosshair, latest-price line,
 * Korean red-up/blue-down color convention) gated behind the Production-only #chartAiChartTooltip element;
 * the interaction layer resets on every non-ready chart state; no durable-token/auth/route/search/OHLCV-cache
 * architecture change; no account/order/trading scope; no dependency change; no secret exposure.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const BASELINE = '5a6f092';

const PAGE = 'src/pages/chart-ai.astro';
const INTERACTION_MODULE = 'src/lib/chart-ai/chart-interaction-foundation.mjs';
const CHART_SCALE = 'src/lib/chart-ai/chartScale.ts';
const INTEGRITY_MODULE = 'src/lib/chart-ai/selected-symbol-integrity.mjs';
const SMOKE = 'scripts/smoke_phase_3gg_t_hf4_fast_chart_foundation.mjs';
const CHECKER_SELF = 'scripts/check_phase_3gg_t_hf4_fast_contract.mjs';
const RESULT_DOC = 'docs/planning/phase_3gg_t_hf4_fast_chart_foundation_result_v0.1.md';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';

const REQUIRED_FILES = [PAGE, INTERACTION_MODULE, CHART_SCALE, SMOKE, CHECKER_SELF, RESULT_DOC];

let assertions = 0;
let failures = 0;
const assert = (cond, message) => { assertions += 1; if (!cond) { failures += 1; console.error(`FAIL: ${message}`); } };
const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');
const runGit = (args) => { try { return execFileSync('git', args, { encoding: 'utf8' }); } catch { return ''; } };

// --- 1. Required files ---
for (const f of REQUIRED_FILES) assert(existsSync(f), `Required file missing: ${f}`);

const page = read(PAGE);
const interactionModule = read(INTERACTION_MODULE);
const chartScale = read(CHART_SCALE);

// --- 2. Pure interaction/formatting module (no DOM / network / time / randomness / secrets) ---
for (const token of [
  'candleDirection', 'computeChange', 'formatPrice', 'formatSignedPrice', 'formatPercent', 'formatVolume',
  'formatDate', 'estimateTurnover', 'formatEstimatedTurnoverKrw', 'nearestCandleIndex', 'valueToY', 'buildCandleDisplayDatum',
]) {
  assert(new RegExp(`export function ${token}\\(`).test(interactionModule), `chart-interaction-foundation.mjs missing export: ${token}`);
}
for (const forbidden of [/\bdocument\./, /\bwindow\./, /\bfetch\(/, /Date\.now\(/, /Math\.random\(/, /new Date\(/, /process\.env\./]) {
  assert(!forbidden.test(interactionModule), `interaction module must stay pure (no DOM/network/time/env): ${forbidden}`);
}

// --- 3. chartScale.ts only gained additive fields (3-way direction, exposed price domain) ---
assert(/direction:\s*'up'\s*\|\s*'down'\s*\|\s*'flat'/.test(chartScale), 'CandleGeometry.direction must widen to include flat.');
assert(/priceMin:\s*number;\s*\n\s*priceMax:\s*number;/.test(chartScale), 'MockedChartGeometry must expose priceMin/priceMax.');
assert(/point\.close > point\.open \? 'up' : point\.close < point\.open \? 'down' : 'flat'/.test(chartScale), 'direction computation must use exact-equality flat logic.');
assert(/priceMin,\s*\n\s*priceMax,/.test(chartScale), 'buildMockedChartGeometry must return priceMin/priceMax.');

// --- 4. Page imports the pure helpers and instantiates the interaction layer ---
assert(/from\s+['"]\.\.\/lib\/chart-ai\/chart-interaction-foundation\.mjs['"]/.test(page), 'page must import chart-interaction-foundation.mjs.');
for (const token of ['nearestCandleIndex', 'valueToY', 'buildCandleDisplayDatum', 'formatPrice']) {
  assert(page.includes(token), `page must reference pure helper: ${token}`);
}

// --- 5. Production-only interaction DOM (header price row, OHLCV strip, tooltip, accessible summary) ---
for (const id of [
  'chartAiChartTooltip', 'chartAiHeaderPriceRow', 'chartAiHeaderPrice', 'chartAiHeaderChangeAmount',
  'chartAiHeaderChangePercent', 'chartAiOhlcvStrip', 'chartAiCandleSummary',
  'chartAiStripOpen', 'chartAiStripHigh', 'chartAiStripLow', 'chartAiStripClose',
  'chartAiStripChangeAmount', 'chartAiStripChangePercent', 'chartAiStripVolume', 'chartAiStripDate',
]) {
  assert(new RegExp(`id="${id}"`).test(page), `page must render #${id}.`);
}
assert(/aria-live="polite"/.test(page) && /chartAiCandleSummary/.test(page), 'accessible candle summary must be aria-live polite.');
assert(/isVercelProductionRuntime\s*&&[\s\S]{0,120}chartAiChartTooltip/.test(page), 'tooltip element must be gated to Production only.');

// --- 6. Interaction functions exist and are gated behind the Production-only tooltip element ---
for (const fn of [
  'clientToSvgPoint', 'buildChartOverlayLayer', 'showChartTooltipAt', 'updateChartHeaderPrice', 'updateChartStrip',
  'applyCandleEmphasis', 'selectChartCandle', 'resetChartCandleToLatest', 'attachChartInteractionHandlers',
  'resetChartInteractionState',
]) {
  assert(new RegExp(`const ${fn} = `).test(page), `page must define interaction function: ${fn}`);
}
assert(/if \(chartTooltip\) \{[\s\S]{0,400}buildChartOverlayLayer\(geometry\)[\s\S]{0,200}attachChartInteractionHandlers\(\)/.test(page),
  'renderChartFromPoints must gate the new interaction layer behind the Production-only chartTooltip element.');

// --- 7. Korean chart convention: rising=red/filled, falling=blue/filled (swapped from Western green/red) ---
assert(/--chart-shell-up:\s*#c43f3f/.test(page) || /--chart-shell-up:\s*#f06b74/.test(page), 'rising candles must use a red hue (Korean convention).');
assert(/--chart-shell-down:\s*#1f6fd6/.test(page) || /--chart-shell-down:\s*#5b9dff/.test(page), 'falling candles must use a blue hue (Korean convention).');
assert(!/--chart-shell-up:\s*#[0-9a-f]*(?:2e7d32|4caf50|22c55e|16a34a)/i.test(page), 'rising candles must not keep a Western green hue.');
assert(/\.chart-candle-body\.is-down\)[\s\S]{0,200}\{[\s\S]{0,120}fill:\s*var\(--chart-shell-down\)/.test(page), 'down-candles must be filled (not hollow) with the down color.');
assert(/is-flat/.test(page), 'a flat candle/volume visual state must exist.');

// --- 8. Latest-price line + crosshair + tooltip, built from the shared geometry (no duplicated pixel math) ---
assert(/valueToY\(\s*latestClose,\s*geometry\.priceMin,\s*geometry\.priceMax/.test(page), 'latest-price line Y must be derived via valueToY against the shared price domain.');
assert(/chart-crosshair-line/.test(page) && /chart-price-line/.test(page) && /chart-price-line-label/.test(page), 'overlay must render crosshair + price line + price label elements.');

// --- 9. aria-live spam avoidance: hover never announces; only commit + index-changed writes ---
assert(/chartAnnouncedIndex/.test(page), 'page must track the last-announced index to dedup aria-live writes.');
assert(/opts\.commit\s*&&\s*chartCandleSummary\s*&&\s*index\s*!==\s*chartAnnouncedIndex/.test(page),
  'aria-live summary must only update on commit AND when the index actually changed.');
assert(/pointermove[\s\S]{0,200}selectChartCandle\([^)]*\{\s*commit:\s*false/.test(page), 'pointermove (hover) must never commit an aria-live announcement.');

// --- 10. Chart is keyboard-reachable and responds to Left/Right/Escape ---
assert(/tabindex=\{isVercelProductionRuntime \? '0' : undefined\}/.test(page), 'chart host must be keyboard-focusable in Production.');
assert(/ArrowLeft/.test(page) && /ArrowRight/.test(page) && /Escape/.test(page), 'chart must support ArrowLeft/ArrowRight/Escape keyboard interaction.');

// --- 11. HF3A-preservation: interaction state resets on every non-ready chart transition ---
const setRealChartStateMatch = page.match(/const setRealChartState = \([^)]*\) => \{([\s\S]*?)\n\s{6}\};/);
assert(setRealChartStateMatch !== null, 'setRealChartState must be present.');
const setRealChartStateBody = setRealChartStateMatch ? setRealChartStateMatch[1] : '';
assert(/if \(mode !== 'ready'\) resetChartInteractionState\(\);/.test(setRealChartStateBody),
  'setRealChartState must call resetChartInteractionState() on every non-ready transition.');

// --- 12. HF3A guard untouched: no changes to the authoritative integrity module or its wiring ---
const integrityDiff = runGit(['diff', '--name-only', BASELINE, '--', INTEGRITY_MODULE]).trim();
assert(integrityDiff === '', `selected-symbol-integrity.mjs must not change this phase, but diff reports: ${integrityDiff}`);
assert(/integrity\.selectPending\(/.test(page) && /integrity\.beginChartLoad\(\)/.test(page) && /integrity\.beginAnalysis\(/.test(page),
  'HF3A guard call sites must remain present and unmodified in spirit.');
assert(!/DEFAULT_INSTRUMENT/.test(page), 'no hidden default-instrument fallback may be reintroduced.');
assert(!/(\|\||\?\?)\s*['"]005930['"]/.test(page), 'no Samsung symbol fallback may be reintroduced.');

// --- 13. No durable-token / auth / route / search / OHLCV-cache architecture change ---
const OUT_OF_SCOPE_PATHS = [
  'src/lib/server/providers/kis',
  'src/pages/api/chart-ai/similarity.json.ts',
  'src/pages/api/chart-ai/mk-analysis.json.ts',
  'src/pages/api/chart-ai/market-intelligence.json.ts',
  'src/pages/api/chart-ai/market/ohlcv.json.ts',
  'src/pages/api/chart-ai/instruments/search.json.ts',
  'supabase',
];
const outOfScopeDiff = runGit(['diff', '--name-only', BASELINE, '--', ...OUT_OF_SCOPE_PATHS]).trim();
assert(outOfScopeDiff === '', `no durable-token/auth/route/search/Supabase source may change this phase, but changed: ${outOfScopeDiff}`);

// --- 14. No account/order/balance/trading scope; no forbidden exposure ---
const surface = [page, interactionModule, chartScale].join('\n');
for (const pat of [/inquire-balance/i, /inquire-account/i, /order-cash/i, /order-credit/i, /\/trading\//i, /funds?-transfer/i, /KIS_ACCOUNT_NO/, /inquire-psbl-order/i]) {
  assert(!pat.test(surface), `no account/order/balance/trading scope may be added: ${pat}`);
}
for (const pat of [/sk-[A-Za-z0-9]{20,}/, /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/, /console\.log\([^)]*process\.env/]) {
  assert(!pat.test(surface), `secret-scan: touched surface must not match forbidden exposure ${pat}`);
}

// --- 15. No dependency / lockfile change ---
const lockDiff = runGit(['diff', '--name-only', BASELINE, '--', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock']).trim();
assert(lockDiff === '', `no lockfile change allowed, but changed: ${lockDiff}`);
const pkgDiff = runGit(['diff', BASELINE, '--', PACKAGE_JSON]);
assert(!/^[+-]\s*"[^"]+":\s*"\^?[0-9]/m.test(pkgDiff), 'package.json must not change dependencies (scripts only).');

// --- 16. No deploy command embedded in test code ---
assert(!/vercel deploy|--prod/.test(read(SMOKE)), 'smoke must not contain deploy commands.');

// --- 17. package.json scripts + changelog + result doc ---
const pkg = read(PACKAGE_JSON);
assert(pkg.includes('"smoke:phase-3gg-t-hf4-fast"') && pkg.includes('"check:phase-3gg-t-hf4-fast"'), 'package.json must define the HF4-FAST scripts.');
assert(read(CHANGELOG).includes('Phase 3GG-T-HF4-FAST'), 'changelog must contain the Phase 3GG-T-HF4-FAST entry.');
const doc = read(RESULT_DOC).toLowerCase();
for (const t of ['hf4-fast', 'chart foundation', 'production', 'owner']) {
  assert(doc.includes(t), `result doc missing token: ${t}`);
}

// --- 18. .env / .vercel never tracked ---
assert(runGit(['ls-files', '--', '.env', '.env.local']).trim() === '', '.env/.env.local must never be tracked.');
assert(runGit(['ls-files', '--', '.vercel']).trim() === '', '.vercel must never be tracked.');

// --- 19. Working-tree purity: only this phase's expected files change ---
const ALLOWED = new Set([...REQUIRED_FILES, CHANGELOG, PACKAGE_JSON]);
const KNOWN_PREFIXES = ['.agents/', '.claude/', '.vscode/', 'docs/handoff/', 'skills-lock.json'];
const tolerated = (f) =>
  ALLOWED.has(f) ||
  KNOWN_PREFIXES.some((p) => f === p || f.startsWith(p)) ||
  f === '.gitignore' ||
  /^src\/lib\/chart-ai\//.test(f) ||
  /^scripts\/(smoke|check|owner_smoke)_phase_3gg_[a-z0-9_]+\.mjs$/.test(f) ||
  /^docs\/planning\/phase_3gg_[a-z0-9_]+_result(_v[0-9.]+)?\.md$/.test(f);
let porcelain = [];
try { porcelain = runGit(['status', '--porcelain']).split('\n').map((l) => l.slice(3).trim()).filter(Boolean); } catch { porcelain = []; }
const unexpected = porcelain.filter((f) => !tolerated(f));
assert(unexpected.length === 0, `Unexpected working-tree change outside this phase's scope: ${unexpected.join(', ')}`);

if (failures === 0) {
  console.log(`PASS: Phase 3GG-T-HF4-FAST contract checker (${assertions}/${assertions} assertions).`);
  process.exit(0);
} else {
  console.error(`FAILED: ${failures}/${assertions} assertions failed.`);
  process.exit(1);
}
