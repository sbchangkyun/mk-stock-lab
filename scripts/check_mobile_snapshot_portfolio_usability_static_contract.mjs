/**
 * Static contract check for Phase 3DJ-HF2 — Mobile Snapshot and Portfolio Usability.
 * Verifies Home MARKET SNAPSHOT 2-column layout, portfolio KPI summary,
 * category label removal, column alignment fix, and sortable full-click.
 * No network calls. No .env reads.
 */

globalThis.fetch = async (url) => {
  throw new Error(`[checker] BLOCKED unexpected network call to: ${String(url).slice(0, 60)}`);
};

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const CSS        = join(root, 'src', 'styles', 'style.css');
const HOME_CARDS = join(root, 'src', 'components', 'HomeIndexCards.astro');
const PORTFOLIO  = join(root, 'src', 'pages', 'portfolio.astro');
const PACKAGE    = join(root, 'package.json');
const RESULT_DOC = join(root, 'docs', 'planning', 'phase_3dj_hf2_mobile_snapshot_portfolio_usability_result_v0.1.md');

const log = (msg) => process.stdout.write(msg + '\n');
let failures = 0;
let total = 0;

const read = (path) => (existsSync(path) ? readFileSync(path, 'utf8') : '');

const pass = (label) => { total++; log(`  ✓ ${label}`); };
const fail = (label) => { total++; failures++; log(`  ✗ FAIL: ${label}`); };

const check = (label, cond) => (cond ? pass(label) : fail(label));

// ── Group 1: File Existence ──────────────────────────────────────────────────
log('\nGroup 1: File existence');
check('style.css exists',            existsSync(CSS));
check('HomeIndexCards.astro exists', existsSync(HOME_CARDS));
check('portfolio.astro exists',      existsSync(PORTFOLIO));
check('result doc exists',           existsSync(RESULT_DOC));

const pkg = read(PACKAGE);
check('package.json has check:mobile-snapshot-portfolio', /"check:mobile-snapshot-portfolio"/.test(pkg));

// ── Group 2: Home MARKET SNAPSHOT Two-Column Mobile ─────────────────────────
log('\nGroup 2: Home MARKET SNAPSHOT two-column mobile');
const css = read(CSS);

check('2-column rule uses minmax(0, 1fr) to allow cell compression',
  /index-card-grid[\s\S]{0,100}repeat\(2,\s*minmax\(0,\s*1fr\)\)/.test(css));

check('2-column grid rule applies at >= 341px (breakpoint must be above 340px)',
  (() => {
    const m = css.match(/max-width:\s*(\d+)px[\s\S]{0,200}\.index-card-grid[\s\S]{0,100}repeat\(2/);
    return m ? parseInt(m[1]) > 340 : false;
  })());

check('one-column fallback breakpoint is 340px or below (not 400px)',
  (() => {
    // Use @media anchor so the {0,80} gap cannot span two media-query boundaries.
    // Require grid-template-columns: 1fr without repeat() in between.
    const m = css.match(/@media\s*\(\s*max-width:\s*(\d+)px\s*\)[\s\S]{0,80}\.index-card-grid[\s\S]{0,100}grid-template-columns:\s*1fr\b/);
    return m ? parseInt(m[1]) <= 340 : false;
  })());

check('390px viewport is NOT within the 1-column fallback breakpoint',
  (() => {
    const m = css.match(/@media\s*\(\s*max-width:\s*(\d+)px\s*\)[\s\S]{0,80}\.index-card-grid[\s\S]{0,100}grid-template-columns:\s*1fr\b/);
    return m ? parseInt(m[1]) < 390 : true; // no 1-col rule is also fine
  })());

check('sparkline SVG shrinks on mobile (width <= 80px)',
  /index-card-sparkline-svg[\s\S]{0,150}width:\s*(\d+)px/.test(css) &&
  (() => {
    const m = css.match(/index-card-sparkline-svg[\s\S]{0,150}width:\s*(\d+)px/);
    return m ? parseInt(m[1]) <= 80 : false;
  })());

check('index-card-value font-size reduced on mobile',
  /max-width[\s\S]{0,200}index-card-value[\s\S]{0,100}font-size:\s*1[0-9]px/.test(css));

check('no live/realtime/current data wording added to home card component',
  !(/실시간|live data|current price/).test(read(HOME_CARDS)));

// ── Group 3: Portfolio Control Label Cleanup ─────────────────────────────────
log('\nGroup 3: Portfolio control label cleanup');
const port = read(PORTFOLIO);

check('visible 카테고리 label removed from portfolio-list-controls-bar',
  !(/portfolio-list-controls-bar[\s\S]{0,200}<p class="eyebrow">카테고리/).test(port));

check('$ currency control button remains', /data-display-mode="local"[^>]*>\$<\/button>/.test(port));
check('₩ currency control button remains', /data-display-mode="krw"[^>]*>₩<\/button>/.test(port));
check('달러 기준 aria-label preserved', /aria-label="달러 기준"/.test(port));
check('원화 기준 aria-label preserved', /aria-label="원화 기준"/.test(port));

check('currency controls are outside positions-list-wrap (scroll container)',
  !(/positions-list-wrap[\s\S]{0,1000}currency-display-toggle/).test(port));

// ── Group 4: Portfolio KPI Summary ───────────────────────────────────────────
log('\nGroup 4: Portfolio KPI summary');

check('portfolio-kpi-summary element exists in HTML', /portfolio-kpi-summary/.test(port));
check('총 자산 label present in kpi block', /kpi-label[^>]*>총 자산/.test(port));
check('총 수익 text used in JS computed output', /총 수익/.test(port));
check('kpi-value element exists', /class="kpi-value"/.test(port));
check('kpi-profit element exists', /class="kpi-profit/.test(port));
check('KPI not hardcoded — value comes from computed totalMarketValue', /totalMarketValue/.test(port));
check('KPI positive/negative/neutral class applied', /positive.*negative.*neutral|kpi-profit.*positive/.test(port));
check('kpi-value CSS defined', /\.kpi-value\s*\{/.test(css));
check('kpi-profit positive color defined', /\.kpi-profit\.positive\s*\{/.test(css));
check('kpi-profit negative color defined', /\.kpi-profit\.negative\s*\{/.test(css));

// ── Group 5: Portfolio Header Alignment and Sorting ─────────────────────────
log('\nGroup 5: Portfolio header alignment and sorting');

check('positions-category-header has matching horizontal padding (14px)',
  /\.positions-category-header\s*\{[\s\S]{0,200}padding:\s*0\s*14px/.test(css));

check('positions-category-grid min-width reduced to 712px for alignment',
  /\.positions-category-grid\s*\{[\s\S]{0,300}min-width:\s*712px/.test(css));

check('data-sort-column="weight" on 비중 header cell', /data-sort-column="weight"/.test(port));
check('data-sort-column="valuation" on 금액 group header', /data-sort-column="valuation"/.test(port));
check('data-sort-column="return" on 수익 group header', /data-sort-column="return"/.test(port));
check('data-sort-column="dividend-yield" on 배당 group header', /data-sort-column="dividend-yield"/.test(port));

check('[data-sort-column] has cursor:pointer CSS', /\[data-sort-column\][\s\S]{0,100}cursor:\s*pointer/.test(css));

check('sort handler handles [data-sort-column] cell clicks', /sortableCell.*dataset\.sortColumn|data-sort-column[\s\S]{0,500}positionSort/.test(port));
check('sort toggles desc then asc on repeated cell click', /positionSort === descKey \? ascKey : descKey/.test(port));
check('sort arrow buttons still have data-sort attributes', /data-sort="weight-desc"/.test(port));
check('sort active class logic preserved', /classList\.toggle\('active', state\.positionSort/.test(port));

// ── Group 6: 종목 추가 Button Placement ──────────────────────────────────────
log('\nGroup 6: 종목 추가 button placement');

check('종목 추가 button exists', /id="open-position-sheet"/.test(port));
check('button is inside portfolio-panel-header area',
  /portfolio-panel-header[\s\S]{0,1200}open-position-sheet/.test(port));
check('button is NOT inside positions-list-wrap scroll area',
  !(/positions-list-wrap[\s\S]{0,2000}open-position-sheet/).test(port));
check('portfolio-panel-actions contains the button',
  /portfolio-panel-actions[\s\S]{0,200}open-position-sheet/.test(port));

// ── Group 7: Safety Boundaries ────────────────────────────────────────────────
log('\nGroup 7: Safety boundaries');

const changed = [css, port, read(HOME_CARDS), pkg].join('\n');
check('no new API route file added', !(/\/api\/portfolio-kpi|\/api\/snapshot/).test(changed));
check('no supabase .from() call added to UI files', !/\.from\(['"][a-z]/.test([port, read(HOME_CARDS)].join('\n')));
check('no KIS/GNews domain in changed UI files', !/apigw\.koreainvestment|gnews\.io/.test([port, read(HOME_CARDS)].join('\n')));
check('no setInterval added to portfolio page', !/setInterval/.test(port));
check('no hardcoded 총 자산 example amounts', !(/103,615,263|321,805|6,733,407|12,003/).test(port));
check('no deployment commands added', !/vercel deploy|netlify deploy/.test(changed));

// ── Summary ────────────────────────────────────────────────────────────────────
log('');
log(`Total: ${total} | Passed: ${total - failures} | Failed: ${failures}`);
if (failures > 0) {
  log(`\n${failures} check(s) failed.`);
  process.exit(1);
} else {
  log('All checks passed.');
}
