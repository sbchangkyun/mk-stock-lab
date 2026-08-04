/**
 * Static contract check for Phase 4C — Chart AI Production Completion.
 *
 * Phase 4C is a truthfulness/accessibility/reliability completion pass over the existing Production
 * `/chart-ai` page (src/pages/chart-ai.astro) -- NOT a rewrite of the provider/engines/auth/usage-guard
 * layers. This checker verifies, via static source inspection only (no execution, no network), that:
 *   - Production/dev-path isolation (1-4, §5): one authoritative chartAiRealExperienceRuntime flag
 *     gates the fixture/sample computation and markup, VERCEL_ENV-authoritative (not NODE_ENV).
 *   - Auth state machine + Production copy (5-8, §6-7): the signed-out lock card uses the exact
 *     required Korean strings and the workspace body stays hidden until a real session exists.
 *   - Search combobox accessibility (9-11, §8): real combobox/listbox ARIA wiring.
 *   - Chart lifecycle + last-good-chart preservation (12-20, §9-11): the new
 *     lastRenderedInstrumentKey / isReloadOfDisplayedInstrument / preserveChart logic threads through
 *     every non-'ready' branch of loadRealChart(), while a genuinely new selection still hides on
 *     failure (updateSelection() must NOT pass the new preserveChart argument).
 *   - Analysis workspace accessibility + server-authoritative usage limit (21-26, §12-15): ARIA tabs
 *     with roving tabindex, usage state populated only from server response fields, non-advisory
 *     disclaimers present in both analysis panels.
 *   - Watchlist + resume-state preservation (27-30, §17): resume-state persistence after a successful
 *     render, watchlist toggle sync keyed by market+symbol.
 *   - Responsive layout (31-32, §18): mobile breakpoints exist for the chart-lookup layout.
 *   - API/security contract preservation (33, §19-20): the page never constructs its own bespoke auth
 *     bypass and keeps using the shared chartAiAuthHeaders/Authorization Bearer attachment pattern.
 */

globalThis.fetch = async (url) => {
  throw new Error(`[checker] BLOCKED unexpected network call to: ${String(url).slice(0, 60)}`);
};

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const CHART_AI = join(root, 'src', 'pages', 'chart-ai.astro');
const INTEGRITY = join(root, 'src', 'lib', 'chart-ai', 'selected-symbol-integrity.mjs');

const log = (msg) => process.stdout.write(msg + '\n');
let passes = 0;
let failures = 0;
const check = (label, pass) => {
  log(`  [${pass ? 'PASS' : 'FAIL'}] ${label}`);
  if (pass) passes++; else failures++;
};
const readOr = (path) => (existsSync(path) ? readFileSync(path, 'utf8') : '');
const countOf = (src, re) => (src.match(re) || []).length;

log('=== Phase 4C Chart AI Production Completion Static Contract ===');
log('');

// ---------------------------------------------------------------------------
// Group 0: File existence
// ---------------------------------------------------------------------------
log('--- Group 0: File existence ---');
check('0a. chart-ai.astro exists', existsSync(CHART_AI));
check('0b. selected-symbol-integrity.mjs exists (unchanged dependency)', existsSync(INTEGRITY));

const src = readOr(CHART_AI);
const scriptStart = src.indexOf('<script>');
const scriptBlock = scriptStart === -1 ? src : src.slice(scriptStart);
const frontmatterEnd = src.indexOf('\n---', 3);
const frontmatter = frontmatterEnd === -1 ? '' : src.slice(0, frontmatterEnd);

// ---------------------------------------------------------------------------
// Group 1: Production/dev-path isolation (1-4, §5)
// ---------------------------------------------------------------------------
log('--- Group 1: Production/dev-path isolation (1-4, §5) ---');
check('1. one authoritative chartAiRealExperienceRuntime flag is declared',
  /const chartAiRealExperienceRuntime = isVercelProductionRuntime \|\| isProtectedPreviewBetaOptInRuntime/.test(frontmatter));
check('2. Production detection is VERCEL_ENV-authoritative, not NODE_ENV',
  frontmatter.includes("readServerEnvValue('VERCEL_ENV') === 'production'") && !/NODE_ENV/.test(frontmatter));
check('3. the synthetic fixture/similarity computation is skipped entirely in the real runtime',
  /chartAiRealExperienceRuntime \? \[\] : buildSyntheticOhlcvFixture\(\)/.test(frontmatter));
check('4. sample-only markup sections are gated behind !chartAiRealExperienceRuntime', scriptStart === -1
  ? false
  : countOf(src, /\{!chartAiRealExperienceRuntime/g) >= 5);

// ---------------------------------------------------------------------------
// Group 2: Auth state machine + Production copy (5-8, §6-7)
// ---------------------------------------------------------------------------
log('--- Group 2: Auth state machine + Production copy (5-8, §6-7) ---');
check('5. signed-out lock card eyebrow is exactly "접속 필요"', src.includes('<p class="eyebrow">접속 필요</p>'));
check('6. signed-out lock card heading is exactly "로그인이 필요합니다"', src.includes('로그인이 필요합니다</h2>'));
check('7. the workspace body is a distinct, initially-hidden element gated by a data attribute',
  /<main class="chart-lookup-shell" data-chart-ai-auth-body hidden>/.test(src));
check('8. client script reads the same [data-chart-ai-auth-body] hook to reveal the workspace on a real session',
  countOf(scriptBlock, /data-chart-ai-auth-body/g) >= 1);

// ---------------------------------------------------------------------------
// Group 3: Search combobox accessibility (9-11, §8)
// ---------------------------------------------------------------------------
log('--- Group 3: Search combobox accessibility (9-11, §8) ---');
check('9. search input has role="combobox"', src.includes('role="combobox"'));
check('10. search input starts with aria-expanded="false" and is toggled at runtime',
  src.includes('aria-expanded="false"') && /input\.setAttribute\('aria-expanded'/.test(scriptBlock));
check('11. search results render as a listbox with aria-selected options',
  src.includes('listbox') && /button\.setAttribute\('aria-selected'/.test(scriptBlock));

// ---------------------------------------------------------------------------
// Group 4: Chart lifecycle + last-good-chart preservation (12-20, §9-11)
// ---------------------------------------------------------------------------
log('--- Group 4: Chart lifecycle + last-good-chart preservation (12-20, §9-11) ---');
check('12. lastRenderedInstrumentKey is tracked at module scope', /let lastRenderedInstrumentKey: string \| null = null/.test(scriptBlock));
check('13. setRealChartState accepts a preserveChart parameter defaulting to false',
  /setRealChartState = \([^)]*preserveChart = false\)/.test(scriptBlock));
check('14. the chart host visibility is only forced hidden when NOT preserving', /chart\.hidden = mode !== 'ready' && !preserveChart/.test(scriptBlock));
check('15. interaction-layer teardown is skipped while preserving the last-good chart',
  /if \(mode !== 'ready' && !preserveChart\) resetChartInteractionState\(\)/.test(scriptBlock));
check('16. loadRealChart computes isReloadOfDisplayedInstrument by comparing country|symbol identity',
  /const isReloadOfDisplayedInstrument = lastRenderedInstrumentKey === reqInstrumentKey/.test(scriptBlock));
check('17. the outcome-mismatch failure branch passes isReloadOfDisplayedInstrument through', (() => {
  const idx = scriptBlock.indexOf("if (outcome !== 'accepted')");
  if (idx === -1) return false;
  const window = scriptBlock.slice(idx, idx + 400);
  return /setRealChartState\([^)]*isReloadOfDisplayedInstrument\)/.test(window);
})());
check('18. the network-failure .catch branch passes isReloadOfDisplayedInstrument through', (() => {
  const idx = scriptBlock.indexOf('네트워크 상태를 확인한 뒤 다시 시도해 주세요');
  if (idx === -1) return false;
  const window = scriptBlock.slice(Math.max(0, idx - 200), idx + 150);
  return /isReloadOfDisplayedInstrument/.test(window);
})());
check('19. a successful render updates lastRenderedInstrumentKey to the just-rendered instrument',
  /lastRenderedInstrumentKey = reqInstrumentKey/.test(scriptBlock));
check('20. a genuinely new search-result selection does NOT pass preserveChart (still hides on new-instrument failure)', (() => {
  const idx = scriptBlock.indexOf('const updateSelection = (record');
  const region = idx === -1 ? scriptBlock : scriptBlock.slice(idx, idx + 3000);
  const suggestedCall = region.match(/setRealChartState\([^)]*'suggested'\s*,?\s*\)/);
  return !!suggestedCall && !suggestedCall[0].includes('isReloadOfDisplayedInstrument') && !suggestedCall[0].includes('true');
})());

// ---------------------------------------------------------------------------
// Group 5: Analysis workspace accessibility + server-authoritative usage limit (21-26, §12-15)
// ---------------------------------------------------------------------------
log('--- Group 5: Analysis workspace accessibility + server-authoritative usage limit (21-26, §12-15) ---');
check('21. analysis view switch is a real ARIA tablist', /role="tablist" aria-label="차트 분석 보기 선택"/.test(src));
check('22. both tabs declare role="tab" with aria-selected', countOf(src, /role="tab"/g) >= 2 && countOf(src, /aria-selected="(true|false)"/g) >= 2);
check('23. tab activation updates aria-selected on both tabs at runtime',
  /similarityTab\?\.setAttribute\('aria-selected'/.test(scriptBlock) && /mkAiTab\?\.setAttribute\('aria-selected'/.test(scriptBlock));
check('24. usage display state is populated only via applyChartAiUsageState from a server response, never a localStorage API call',
  /applyChartAiUsageState\(data\.usage\)/.test(scriptBlock) && !/localStorage\./.test(scriptBlock));
check('25. both real analysis runners handle the top-level daily-limit guard codes identically',
  countOf(scriptBlock, /CHART_AI_DAILY_LIMIT_REACHED/g) >= 2 && countOf(scriptBlock, /CHART_AI_USAGE_GUARD_UNAVAILABLE/g) >= 2);
check('26. both analysis panels carry an explicit non-advisory disclaimer', countOf(src, /매수·매도 추천/g) >= 2 && countOf(src, /투자 자문이 아닙니다/g) >= 2);

// ---------------------------------------------------------------------------
// Group 6: Watchlist + resume-state preservation (27-30, §17)
// ---------------------------------------------------------------------------
log('--- Group 6: Watchlist + resume-state preservation (27-30, §17) ---');
check('27. resume state is persisted after every successful chart render', /persistChartResumeState\(token\.instrument, activeRange\)/.test(scriptBlock));
check('28. resume-state persistence writes lastSurface: chart_ai', /lastSurface:\s*'chart_ai'/.test(scriptBlock));
check('29. watchlist toggle is refreshed for the active instrument after a successful render',
  /refreshWatchlistToggleForActiveInstrument\(\)/.test(scriptBlock));
check('30. watchlist matching is keyed by market + uppercased symbol (not name, which can vary)',
  /symbol\.toUpperCase\(\)/.test(scriptBlock));

// ---------------------------------------------------------------------------
// Group 7: Responsive layout (31-32, §18)
// ---------------------------------------------------------------------------
log('--- Group 7: Responsive layout (31-32, §18) ---');
check('31. a sub-640px mobile breakpoint exists for the chart-lookup layout', /@media \(max-width: 640px\)/.test(src));
check('32. a narrow (<=420px) breakpoint exists for small-phone widths', /@media \(max-width: 420px\)/.test(src));

// ---------------------------------------------------------------------------
// Group 8: API/security contract preservation (33, §19-20)
// ---------------------------------------------------------------------------
log('--- Group 8: API/security contract preservation (33, §19-20) ---');
check('33. every real fetch to a Chart AI API route attaches the shared Authorization Bearer header helper',
  /chartAiAuthHeaders/.test(scriptBlock) && !/Authorization['"]?\s*:\s*['"]Bearer/.test(scriptBlock.replace(/chartAiAuthHeaders[\s\S]{0,80}/g, '')));

log('');
log(`Phase 4C contract: ${passes} passed, ${failures} failed.`);
process.exit(failures > 0 ? 1 : 0);
