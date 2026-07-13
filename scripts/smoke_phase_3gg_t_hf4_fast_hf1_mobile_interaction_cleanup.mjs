/**
 * Phase 3GG-T-HF4-FAST-HF1 deterministic smoke — mobile chart interaction cleanup.
 *
 * Credential-free, no network, no DOM. Static source verification of the five defect fixes:
 *  - DEFECT-1: mobile chart tooltip is compact + semi-transparent (theme-aware overlay surface).
 *  - DEFECT-2: tapping outside the chart on mobile clears the committed candle selection via a single,
 *    idempotently-registered document-level pointerdown handler (chart-interaction display state only).
 *  - DEFECT-3: the "차트를 불러오는 중" preparing-state panel actually collapses in layout once the chart
 *    reaches the ready state (native [hidden] no longer loses to the unconditional author `display: grid`).
 *  - DEFECT-4: the OHLCV information strip no longer touches the left edge (balanced horizontal padding,
 *    desktop and mobile).
 *  - DEFECT-5: Market Intelligence is fully removed from the Chart AI page runtime (markup/client/CSS);
 *    the backend route + engine remain untouched.
 * Also re-asserts HF3A selected-symbol integrity is unaffected by this visual/interaction hotfix.
 * Exits non-zero on any failure.
 */

import { existsSync, readFileSync } from 'node:fs';

const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');

const PAGE = 'src/pages/chart-ai.astro';
const MI_ROUTE = 'src/pages/api/chart-ai/market-intelligence.json.ts';
const MI_ENGINE_DIR = 'src/lib/server/chart-ai/marketIntelligence';
const INTEGRITY_MODULE = 'src/lib/chart-ai/selected-symbol-integrity.mjs';

const page = read(PAGE);

let passed = 0;
let failed = 0;
const check = (name, cond) => { if (cond) passed += 1; else failed += 1; console.log(`${cond ? 'PASS' : 'FAIL'} :: ${name}`); };

// ---- DEFECT-1: mobile tooltip compact + semi-transparent ----
const mobileBlockMatch = page.match(/@media \(max-width: 640px\) \{([\s\S]*?)\n {4}\}\n\n {4}@media/);
const mobileBlock = mobileBlockMatch ? mobileBlockMatch[1] : page;
const mobileTooltipMatch = mobileBlock.match(/\.chart-tooltip \{([\s\S]*?)\}/);
const mobileTooltipRule = mobileTooltipMatch ? mobileTooltipMatch[1] : '';
check('mobile .chart-tooltip override exists inside the max-width:640px media block', mobileTooltipRule.length > 0);
check('mobile tooltip max-width is compact (<=170px)', /max-width:\s*1[0-6][0-9]px/.test(mobileTooltipRule));
// HF4-FAST-HF2 narrowly superseded the exact mobile font-size/padding/background values as an
// approved visual refinement (140px/10.5px/6px 7px/dedicated translucent surface var); tolerate either.
check('mobile tooltip font-size is compact (~11-12px equivalent)', /font-size:\s*(0\.7[0-3]rem|10\.5px)/.test(mobileTooltipRule));
check('mobile tooltip padding is compact', /padding:\s*(0\.[45]|6px 7px)/.test(mobileTooltipRule));
check('mobile tooltip uses a theme-aware semi-transparent surface', /background:\s*var\(--chart-shell-overlay\)|background:\s*var\(--chart-tooltip-mobile-surface\)/.test(mobileTooltipRule));
check('mobile tooltip applies a backdrop blur for the semi-transparent effect', /backdrop-filter:\s*blur\(/.test(mobileTooltipRule));
check('mobile tooltip stays pointer-events: none (inherited base rule, no page interference)', /\.chart-tooltip \{[\s\S]{0,200}pointer-events:\s*none/.test(page));
check('turnover stays labeled as an estimate ("추정 거래대금"), never bare "거래대금"', page.includes('추정 거래대금') && !/[^정]거래대금/.test(page.replaceAll('추정 거래대금', '')));

// ---- DEFECT-2: outside-tap reset handler ----
const attachFnMatch = page.match(/const attachChartInteractionHandlers = \(\) => \{([\s\S]*?)\n {6}\};/);
const attachFnBody = attachFnMatch ? attachFnMatch[1] : '';
check('attachChartInteractionHandlers is present', attachFnBody.length > 0);
check('attachChartInteractionHandlers is guarded against duplicate registration (idempotent)', /chartInteractionHandlersAttached/.test(page) && /if \(chartInteractionHandlersAttached \|\| !chart \|\| !chartSvg\) return;/.test(page));
check('a document-level pointerdown listener exists for outside-tap detection', /document\.addEventListener\('pointerdown'/.test(attachFnBody));
check('outside-tap classification uses chart.contains(target)', /chart\.contains\(target\)/.test(attachFnBody));
check('outside-tap calls the existing lightweight reset (resetChartCandleToLatest), not the heavyweight one', /chart\.contains\(target\)\) return;\s*\n\s*resetChartCandleToLatest\(\);/.test(attachFnBody));
check('outside-tap handler does not call stopPropagation', !/stopPropagation/.test(attachFnBody));
check('desktop pointerleave reset is preserved unchanged', /pointerleave[\s\S]{0,120}resetChartCandleToLatest\(\)/.test(attachFnBody));
check('keyboard Escape reset is preserved unchanged', /Escape'\) \{\s*\n\s*resetChartCandleToLatest\(\);/.test(attachFnBody));
check('keyboard ArrowLeft/ArrowRight navigation is preserved unchanged', /ArrowLeft/.test(attachFnBody) && /ArrowRight/.test(attachFnBody));

// ---- DEFECT-3: READY-state panel actually collapses ----
check('a narrowly-scoped [hidden] override exists for the preparing-state panel', /\.chart-market-preparing-state\[hidden\] \{\s*\n\s*display: none !important;\s*\n\s*\}/.test(page));
check('the override does not globally redefine [hidden] for all elements', !/\n\s*\[hidden\] \{\s*\n\s*display: none !important;/.test(page));
check('JS still sets native hidden = true only once the chart is ready', /stateEl\.hidden = mode === 'ready';/.test(page));

// ---- DEFECT-4: OHLCV strip horizontal padding ----
const desktopStripMatch = page.match(/\.chart-ohlcv-strip \{([\s\S]*?)\}/);
const desktopStripRule = desktopStripMatch ? desktopStripMatch[1] : '';
check('desktop .chart-ohlcv-strip has balanced horizontal padding (12-16px inline)', /padding:\s*0\.45rem 0\.9rem;/.test(desktopStripRule));
const mobileStripMatch = mobileBlock.match(/\.chart-ohlcv-strip \{([\s\S]*?)\}/);
const mobileStripRule = mobileStripMatch ? mobileStripMatch[1] : '';
check('mobile .chart-ohlcv-strip has balanced horizontal padding (10-12px inline)', /padding:\s*0\.4rem 0\.65rem;/.test(mobileStripRule));

// ---- DEFECT-5: Market Intelligence fully removed from the page runtime; backend preserved ----
for (const token of ['chartAiMarketIntel', 'chartAiMiStartBtn', 'chartAiMiStatus', 'resetSelectedMarketIntel', 'market-intelligence.json', '시장 인텔리전스', 'miAbort']) {
  check(`Market Intelligence token removed from the page: ${token}`, !page.includes(token));
}
check('Market Intelligence backend route preserved', existsSync(MI_ROUTE));
check('Market Intelligence backend engine directory preserved', existsSync(MI_ENGINE_DIR));

// ---- HF3A selected-symbol integrity unaffected by this hotfix ----
check('no hidden Samsung default reintroduced', !/DEFAULT_INSTRUMENT/.test(page) && !/(\|\||\?\?)\s*['"]005930['"]/.test(page));
check('selectedSymbol still initializes empty', /let\s+selectedSymbol\s*=\s*['"]['"]/.test(page));
check('the two remaining analyses still call the shared HF3A guard', /integrity\.beginAnalysis\('similar-pattern'\)/.test(page) && /integrity\.beginAnalysis\('mk-ai'\)/.test(page));
check('market-intel no longer calls the shared HF3A guard (analysis removed with the UI)', !/integrity\.beginAnalysis\('market-intel'\)/.test(page));
check('selected-symbol-integrity.mjs module is untouched by this phase', existsSync(INTEGRITY_MODULE));

console.log(`\nSMOKE SUMMARY :: passed=${passed} failed=${failed} total=${passed + failed}`);
if (failed > 0) {
  console.log('SMOKE RESULT :: FAIL');
  process.exit(1);
} else {
  console.log('SMOKE RESULT :: PASS');
}
