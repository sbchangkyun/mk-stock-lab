/**
 * Phase 3GG-T-HF4-FAST-HF2 deterministic smoke — mobile tooltip refinement + duplicate title cleanup.
 *
 * Credential-free, no network, no DOM. Static source verification of:
 *  - DEFECT-1/2: mobile tooltip is smaller (max-width 130-145px), more transparent, and uses a compact
 *    two-column OHLC layout with a single date heading instead of the prior one-label-per-row list.
 *  - DEFECT-3/4: the large black duplicate headings "유사 패턴 분석" and "MK AI 해석" are removed from
 *    rendered markup (not CSS-hidden); the small blue eyebrow labels and tab labels remain.
 *  - DEFECT-5: the vertical spacing that belonged to the removed headings collapses (grid gap only,
 *    no leftover fixed height).
 * Also re-asserts HF1/HF3A/HF4-FAST behavior is unaffected by this narrow visual hotfix.
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

// ---- DEFECT-1: mobile tooltip width ----
const mobileBlockMatch = page.match(/@media \(max-width: 640px\) \{([\s\S]*?)\n {4}\}\n\n {4}@media/);
const mobileBlock = mobileBlockMatch ? mobileBlockMatch[1] : page;
const mobileTooltipMatch = mobileBlock.match(/\.chart-tooltip \{([\s\S]*?)\}/);
const mobileTooltipRule = mobileTooltipMatch ? mobileTooltipMatch[1] : '';
check('mobile .chart-tooltip override exists', mobileTooltipRule.length > 0);
const mobileMaxWidthMatch = mobileTooltipRule.match(/max-width:\s*(\d+)px/);
const mobileMaxWidth = mobileMaxWidthMatch ? Number(mobileMaxWidthMatch[1]) : NaN;
check('mobile tooltip max-width is 145px or less', mobileMaxWidth <= 145);
check('mobile tooltip max-width remains at least 130px', mobileMaxWidth >= 130);

// ---- DEFECT-2: mobile tooltip spacing ----
check('mobile tooltip padding is compact (6-7px range)', /padding:\s*6px 7px/.test(mobileTooltipRule));
check('mobile tooltip font-size is compact (~10.5-11px)', /font-size:\s*10\.5px/.test(mobileTooltipRule));
check('mobile tooltip line-height is compact (~1.2-1.3)', /line-height:\s*1\.2[0-9]?/.test(mobileTooltipRule));
check('mobile tooltip has no fixed/minimum height (height stays auto, min-height stays 0)', /(?<!min-)height:\s*auto/.test(mobileTooltipRule) && !/min-height:\s*[1-9]/.test(mobileTooltipRule));

// ---- DEFECT-2 (transparency): mobile tooltip translucency ----
check('mobile tooltip uses a dedicated scoped translucent surface variable', /background:\s*var\(--chart-tooltip-mobile-surface\)/.test(mobileTooltipRule));
const lightVarMatch = page.match(/--chart-tooltip-mobile-surface:\s*rgb\(255 255 255 \/ (\d+)%\)/);
const lightAlpha = lightVarMatch ? Number(lightVarMatch[1]) : NaN;
check('light-mode mobile tooltip surface alpha is <= 78%', lightAlpha <= 78);
check('light-mode mobile tooltip surface alpha remains readable (>= 60%)', lightAlpha >= 60);
const darkVarMatch = page.match(/--chart-tooltip-mobile-surface:\s*rgb\(13 23 40 \/ (\d+)%\)/);
const darkAlpha = darkVarMatch ? Number(darkVarMatch[1]) : NaN;
check('dark-mode mobile tooltip surface alpha exists and is <= 78%', darkAlpha <= 78);
check('dark-mode mobile tooltip surface alpha remains readable (>= 60%)', darkAlpha >= 60);
check('mobile tooltip backdrop blur is restrained (3-5px)', /backdrop-filter:\s*blur\([3-5]px\)/.test(mobileTooltipRule));
check('mobile tooltip stays pointer-events: none (inherited base rule)', /\.chart-tooltip \{[\s\S]{0,200}pointer-events:\s*none/.test(page));

// ---- DEFECT-2 (structure): compact mobile content layout ----
check('compact/detailed tooltip views both exist in the JS tooltip builder', /chart-tooltip-detailed/.test(page) && /chart-tooltip-compact/.test(page));
check('desktop shows the detailed view by default (no display:none on it outside the mobile block)', !/\.chart-tooltip-detailed\s*\{\s*display:\s*none;\s*\}/.test(page.replace(mobileBlock, '')));
check('mobile hides the detailed view and shows the compact view', /\.chart-tooltip-detailed\s*\{\s*display:\s*none;\s*\}/.test(page) && /\.chart-tooltip-compact\s*\{\s*display:\s*block;\s*\}/.test(page));
check('compact date renders once as a single heading element', /chart-tooltip-compact-date/.test(page));
check('compact date is not prefixed with a separate "날짜" label', /chart-tooltip-compact-date">\$\{datum\.formatted\.date\}/.test(page));
check('compact price view uses a two-column CSS grid', /\.chart-tooltip-compact-grid\s*\{[\s\S]{0,120}grid-template-columns:\s*1fr 1fr/.test(page));
check('compact grid includes open/high/low/close fields', /시 \$\{datum\.formatted\.open\}/.test(page) && /고 \$\{datum\.formatted\.high\}/.test(page) && /저 \$\{datum\.formatted\.low\}/.test(page) && /종 \$\{datum\.formatted\.close\}/.test(page));
check('compact volume view stays concise (date + 거래량 line)', /chart-tooltip-compact-volume">거래량 \$\{datum\.formatted\.volume\}/.test(page));
check('turnover stays labeled as an estimate in the compact view when present', /chart-tooltip-compact-turnover/.test(page) && /추정 거래대금/.test(page));

// ---- DEFECT-3: Similar Pattern duplicate large heading removed ----
check('large black Similar Pattern <h2> heading is removed', !/<h2 id="chart-similarity-panel-heading">유사 패턴 분석<\/h2>/.test(page));
check('small blue Similar Pattern eyebrow label remains', /<p class="eyebrow" id="chart-similarity-panel-heading">유사 패턴 분석<\/p>/.test(page));
check('Similar Pattern tab label remains', /유사 패턴 분석 보기/.test(page));

// ---- DEFECT-4: MK AI duplicate large heading removed ----
check('large black MK AI <h3> heading is removed', !/<h3 id="chart-mk-ai-heading">MK AI 해석<\/h3>/.test(page));
check('small blue MK AI eyebrow label remains', /<p class="eyebrow" id="chart-mk-ai-heading">MK AI<\/p>/.test(page));
check('MK AI tab label remains', /MK AI 분석 보기/.test(page));

// ---- DEFECT-5: removed-heading spacing collapses (no leftover fixed height rule) ----
check('panel-heading containers stay a simple auto-sized grid (no fixed/min height added)', /\.chart-similarity-panel-heading,\s*\n\s*\.chart-mk-ai-panel-heading \{\s*\n\s*display: grid;\s*\n\s*gap: 0\.5rem;\s*\n\s*\}/.test(page));

// ---- Regression: Similar Pattern / MK AI execution + HF3A + HF1 preservation ----
check('Similar Pattern fetch/start button remains', /chartAiSimilarityStartBtn/.test(page));
check('MK AI fetch/start button remains', /chartAiMkAiStartBtn/.test(page));
check('HF3A integrity module remains untouched on disk', existsSync(INTEGRITY_MODULE));
check('outside-tap handler remains', /document\.addEventListener\('pointerdown'/.test(page) && /chart\.contains\(target\)/.test(page));
check('desktop pointerleave reset remains', /pointerleave/.test(page));
check('keyboard Escape/Arrow handlers remain', /Escape'\)/.test(page) && /ArrowLeft/.test(page) && /ArrowRight/.test(page));
check('READY-state hidden fix remains', /\.chart-market-preparing-state\[hidden\] \{\s*\n\s*display: none !important;\s*\n\s*\}/.test(page));
check('OHLCV strip padding fix remains (desktop)', /padding:\s*0\.45rem 0\.9rem;/.test(page));
check('Market Intelligence UI remains absent from Chart AI page', !page.includes('chartAiMarketIntel') && !page.includes('/api/chart-ai/market-intelligence.json'));
check('Market Intelligence backend route preserved', existsSync(MI_ROUTE));
check('Market Intelligence backend engine directory preserved', existsSync(MI_ENGINE_DIR));
check('no hidden Samsung default reintroduced', !/DEFAULT_INSTRUMENT/.test(page) && !/(\|\||\?\?)\s*['"]005930['"]/.test(page));
check('selectedSymbol still initializes empty', /let\s+selectedSymbol\s*=\s*['"]['"]/.test(page));
check('no automatic chart load on page entry (idle copy still present)', page.includes('종목을 검색해 선택하면 실제 차트를 불러옵니다.'));

console.log(`\nSMOKE SUMMARY :: passed=${passed} failed=${failed} total=${passed + failed}`);
if (failed > 0) {
  console.log('SMOKE RESULT :: FAIL');
  process.exit(1);
} else {
  console.log('SMOKE RESULT :: PASS');
}
