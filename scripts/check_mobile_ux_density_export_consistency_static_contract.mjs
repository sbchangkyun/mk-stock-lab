/**
 * Static contract check for Phase 3DJ-HF1 — Mobile UX Density + Export Consistency.
 * Verifies grouped portfolio columns, viewport-independent export, lab copy cleanup,
 * home feature card hiding, header compaction, and CSS additions.
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
const EXPORT_LIB = join(root, 'src', 'lib', 'exportCardImage.ts');
const PORTFOLIO  = join(root, 'src', 'pages', 'portfolio.astro');
const INDEX      = join(root, 'src', 'pages', 'index.astro');
const MATRIX     = join(root, 'src', 'components', 'LabReturnMatrix.astro');
const ASSET_PAGE = join(root, 'src', 'pages', 'lab', 'asset-class-returns.astro');
const SECTOR_PAGE= join(root, 'src', 'pages', 'lab', 'sp500-sectors.astro');
const MARKET     = join(root, 'src', 'components', 'MarketShell.astro');
const PACKAGE    = join(root, 'package.json');
const RESULT_DOC = join(root, 'docs', 'planning', 'phase_3dj_hf1_mobile_ux_density_export_consistency_result_v0.1.md');

const log = (msg) => process.stdout.write(msg + '\n');
let failures = 0;
let total = 0;

const read = (path) => (existsSync(path) ? readFileSync(path, 'utf8') : '');

const pass = (label) => { total++; log(`  ✓ ${label}`); };
const fail = (label) => { total++; failures++; log(`  ✗ FAIL: ${label}`); };

const check = (label, cond) => (cond ? pass(label) : fail(label));

// ── Group 1: File existence ──────────────────────────────────────────────────
log('\nGroup 1: File existence');
check('export lib exists',   existsSync(EXPORT_LIB));
check('portfolio.astro exists', existsSync(PORTFOLIO));
check('index.astro exists',  existsSync(INDEX));
check('LabReturnMatrix exists', existsSync(MATRIX));
check('asset-class-returns page exists', existsSync(ASSET_PAGE));
check('sp500-sectors page exists', existsSync(SECTOR_PAGE));
check('MarketShell exists',  existsSync(MARKET));
check('result doc exists',   existsSync(RESULT_DOC));

// ── Group 2: Export library — viewport-independent ───────────────────────────
log('\nGroup 2: Export library — viewport-independent capture');
const exp = read(EXPORT_LIB);
check('exportCardAsPng accepts requestedExportWidth param', /exportCardAsPng\s*=\s*async\s*\([\s\S]{0,200}requestedExportWidth/.test(exp));
check('uses card.scrollWidth for natural width', /card\.scrollWidth/.test(exp));
check('adds is-exporting-image class before capture', /classList\.add\(['"]is-exporting-image['"]\)/.test(exp));
check('removes is-exporting-image in finally block', /finally[\s\S]{0,200}classList\.remove\(['"]is-exporting-image['"]\)/.test(exp));
check('forces card width to exportWidth inline style', /card\.style\.width\s*=\s*`\$\{exportWidth\}px`/.test(exp));
check('forces minWidth inline style', /card\.style\.minWidth\s*=/.test(exp));
check('sets maxWidth to none', /card\.style\.maxWidth\s*=\s*['"]none['"]/.test(exp));
check('restores original inline styles in finally', /finally[\s\S]{0,400}card\.style\.width\s*=\s*saved/.test(exp));
check('uses requestAnimationFrame to settle layout', /requestAnimationFrame/.test(exp));
check('reads data-export-width from button dataset', /button\.dataset\.exportWidth/.test(exp));
check('parses export width as integer', /parseInt\(.*exportWidth.*10\)/.test(exp));

// ── Group 3: Portfolio — grouped columns ─────────────────────────────────────
log('\nGroup 3: Portfolio — grouped column structure');
const port = read(PORTFOLIO);
check('positions-category-cell--group exists in header', /positions-category-cell--group/.test(port));
check('col-group-top span exists', /col-group-top/.test(port));
check('col-group-bottom span exists', /col-group-bottom/.test(port));
check('position-metric--group class used', /position-metric--group/.test(port));
check('평단가 and 현재가 merged into one group cell', (/평단가[\s\S]{0,200}현재가/).test(port));
check('평가금 and 원금 merged into one group cell', (/평가금[\s\S]{0,200}원금/).test(port));
check('수익률 and 수익금 merged into one group cell', (/수익률[\s\S]{0,200}수익금/).test(port));
check('배당률 and 배당주기 merged into one group cell', (/배당률[\s\S]{0,200}배당주기/).test(port));

// ── Group 4: Portfolio — redundant copy removed ───────────────────────────────
log('\nGroup 4: Portfolio — redundant copy removed');
check('eyebrow "보유 종목" removed from portfolio-panel-header', !(/portfolio-panel-header[\s\S]{0,500}<p class="eyebrow">보유 종목<\/p>/.test(port)));
check('"전체 포트폴리오" string no longer used as title', !/'전체 포트폴리오'/.test(port));
check('"4개 포트폴리오의" aggregate meta removed', !/'4개 포트폴리오의/.test(port));
check('"Fixture 기준 평가값입니다" string removed', !/'Fixture 기준 평가값입니다\./.test(port));
check('aggregate title now set to empty string', /aggregateSelected \? '' : portfolio/.test(port));

// ── Group 5: Portfolio — currency toggle compacted ───────────────────────────
log('\nGroup 5: Portfolio — currency toggle compacted to symbols');
check('dollar button shows $ symbol', /data-display-mode="local"[^>]*>\$<\/button>/.test(port));
check('won button shows ₩ symbol', /data-display-mode="krw"[^>]*>₩<\/button>/.test(port));
check('달러 기준 moved to aria-label', /aria-label="달러 기준"/.test(port));
check('원화 기준 moved to aria-label', /aria-label="원화 기준"/.test(port));
check('portfolio-list-controls-bar element added', /portfolio-list-controls-bar/.test(port));
check('currency toggle is inside portfolio-list-controls-bar', /portfolio-list-controls-bar[\s\S]{0,300}segmented-control/.test(port));
check('category/currency control row outside scroll container', !/positions-list-wrap[\s\S]{0,500}portfolio-list-controls-bar/.test(port));

// ── Group 6: Lab — redundant inner copy removed ───────────────────────────────
log('\nGroup 6: Lab — redundant inner header removed from LabReturnMatrix');
const matrix = read(MATRIX);
check('lab-section-header removed from LabReturnMatrix', !/<header class="lab-section-header">/.test(matrix));
check('lab-matrix-note-badge removed from LabReturnMatrix', !/<span class="lab-matrix-note-badge">/.test(matrix));
check('section uses aria-label instead of aria-labelledby', /aria-label=\{data\.title\}/.test(matrix));
check('legend chips still present', /lab-matrix-legend/.test(matrix));
check('interaction hint still present', /lab-matrix-interaction-hint/.test(matrix));
check('lab-matrix-card still present', /lab-matrix-card/.test(matrix));

// ── Group 7: Lab pages — export label removed + data-export-width added ──────
log('\nGroup 7: Lab pages — export label removed, data-export-width added');
const assetPage  = read(ASSET_PAGE);
const sectorPage = read(SECTOR_PAGE);
check('asset page: lab-matrix-export-label span removed', !/<span class="lab-matrix-export-label">/.test(assetPage));
check('asset page: data-export-width added to camera button', /data-export-width="800"/.test(assetPage));
check('sector page: lab-matrix-export-label span removed', !/<span class="lab-matrix-export-label">/.test(sectorPage));
check('sector page: data-export-width added to camera button', /data-export-width="800"/.test(sectorPage));

// ── Group 8: MarketShell — data-export-width on export buttons ───────────────
log('\nGroup 8: MarketShell — data-export-width on treemap/scatter buttons');
const market = read(MARKET);
check('treemap export button has data-export-width="1200"', /data-export-width="1200"/.test(market));
check('scatter export button has data-export-width="800"', /data-export-width="800"/.test(market));

// ── Group 9: Home — feature grid hidden on mobile ────────────────────────────
log('\nGroup 9: Home — feature grid hidden on mobile');
const index = read(INDEX);
check('home-feature-grid class added to grid-4 section', /class="grid-4 home-feature-grid"/.test(index));
const css = read(CSS);
check('CSS hides .home-feature-grid at ≤860px', /max-width:\s*860px[\s\S]{0,300}\.home-feature-grid[\s\S]{0,100}display:\s*none/.test(css));

// ── Group 10: CSS additions — Phase 3DJ-HF1 block ────────────────────────────
log('\nGroup 10: CSS — Phase 3DJ-HF1 additions');
check('Phase 3DJ-HF1 comment block exists in CSS', /Phase 3DJ-HF1/.test(css));
check('is-exporting-image class defined', /\.is-exporting-image\s*\{/.test(css));
check('header-actions gap compacted at 720px', /max-width:\s*720px[\s\S]{0,300}\.header-actions[\s\S]{0,100}gap:\s*6px/.test(css));
check('portfolio-list-controls-bar flex layout defined', /\.portfolio-list-controls-bar\s*\{[\s\S]{0,200}display:\s*flex/.test(css));
check('positions-category-cell--group flex-direction column', /\.positions-category-cell--group\s*\{[\s\S]{0,100}flex-direction:\s*column/.test(css));
check('position-metric--group flex-direction column', /\.position-metric--group\s*\{[\s\S]{0,100}flex-direction:\s*column/.test(css));
check('col-group-top defined', /\.col-group-top\s*[,{]/.test(css));
check('col-group-bottom defined', /\.col-group-bottom\s*[,{]/.test(css));
check('positions-category-grid min-width reduced below 960px', (() => {
  const m = css.match(/\.positions-category-grid\s*\{[\s\S]*?min-width:\s*(\d+)px/);
  return m ? parseInt(m[1]) < 960 : false;
})());
check('position-identity strong has -webkit-line-clamp', /\.position-identity strong[\s\S]{0,200}-webkit-line-clamp:\s*2/.test(css));

// ── Group 11: Package script ──────────────────────────────────────────────────
log('\nGroup 11: Package script');
const pkg = read(PACKAGE);
check('check:mobile-ux-density-export script exists', /"check:mobile-ux-density-export"/.test(pkg));

// ── Group 12: Security boundaries ─────────────────────────────────────────────
log('\nGroup 12: Security boundaries — no live calls in changed files');
const allChanged = [exp, port, matrix, assetPage, sectorPage, market, css, index, read(PACKAGE)].join('\n');
const checkerSrc = read(join(__dirname, 'check_mobile_ux_density_export_consistency_static_contract.mjs'));
check('no external HTTP fetch added to export lib or matrix files', !(/fetch\(['"`]https?:/.test([exp, matrix, assetPage, sectorPage, market].join('\n'))));
check('no supabase .from() call in changed UI files', !/\.from\(['"][a-z]/.test([exp, matrix, assetPage, sectorPage, market, index].join('\n')));
check('no KIS base-url or gnews.io domain in changed UI files', !/apigw\.koreainvestment|gnews\.io/.test([exp, port, matrix, assetPage, sectorPage, market].join('\n')));
check('no polling setInterval added to export lib or matrix files', !/setInterval/.test([exp, matrix, assetPage, sectorPage, market].join('\n')));

// ── Summary ────────────────────────────────────────────────────────────────────
log('');
log(`Total: ${total} | Passed: ${total - failures} | Failed: ${failures}`);
if (failures > 0) {
  log(`\n${failures} check(s) failed.`);
  process.exit(1);
} else {
  log('All checks passed.');
}
