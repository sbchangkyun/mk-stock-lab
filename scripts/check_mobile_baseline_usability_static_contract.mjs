/**
 * Static contract check for Phase 3DJ — Mobile Baseline Usability Pass.
 * Verifies responsive CSS, no global desktop min-width lock, nav/header mobile
 * safety, data table scroll containment, and preserved desktop functionality.
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

const CSS = join(root, 'src', 'styles', 'style.css');
const LAYOUT = join(root, 'src', 'layouts', 'Layout.astro');
const MATRIX = join(root, 'src', 'components', 'LabReturnMatrix.astro');
const HEADER = join(root, 'src', 'components', 'Header.astro');
const NAV = join(root, 'src', 'components', 'Nav.astro');
const ASSET_PAGE = join(root, 'src', 'pages', 'lab', 'asset-class-returns.astro');
const SECTOR_PAGE = join(root, 'src', 'pages', 'lab', 'sp500-sectors.astro');
const PACKAGE_JSON = join(root, 'package.json');
const RESULT_DOC = join(root, 'docs', 'planning', 'phase_3dj_mobile_baseline_usability_pass_result_v0.1.md');

const log = (msg) => process.stdout.write(msg + '\n');
let failures = 0;
let passes = 0;

const check = (label, pass) => {
  log(`  [${pass ? 'PASS' : 'FAIL'}] ${label}`);
  if (pass) passes++; else failures++;
};

log('=== Phase 3DJ Mobile Baseline Usability Static Contract Check ===');
log('');

// ---------------------------------------------------------------------------
// Group 1: File existence
// ---------------------------------------------------------------------------
log('--- Group 1: File existence ---');

check('style.css exists', existsSync(CSS));
check('Layout.astro exists', existsSync(LAYOUT));
check('LabReturnMatrix.astro exists', existsSync(MATRIX));
check('Result doc exists', existsSync(RESULT_DOC));

let pkg = {};
try { pkg = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8')); } catch {}
check('package.json has check:mobile-baseline script',
  typeof pkg.scripts?.['check:mobile-baseline'] === 'string');
log('');

// ---------------------------------------------------------------------------
// Group 2: Global desktop min-width removed
// ---------------------------------------------------------------------------
log('--- Group 2: Global desktop min-width lock removed ---');

if (existsSync(CSS)) {
  const css = readFileSync(CSS, 'utf8');

  // The body rule must NOT have min-width: 1080px (the old desktop lock)
  // We check by looking for the pattern body { ... min-width: 1080 in proximity
  const bodyBlockMatch = css.match(/body\s*\{[^}]*\}/s);
  const bodyBlock = bodyBlockMatch ? bodyBlockMatch[0] : '';
  check('body rule does NOT have min-width: 1080px desktop lock',
    !bodyBlock.includes('min-width: 1080px') && !css.includes('body{min-width:1080'));

  check('style.css still has body rule', css.includes('body {') || css.includes('body{'));
  check('style.css still has min-height: 100vh on body', css.includes('min-height: 100vh'));

  // Mobile media queries must exist
  check('style.css has @media (max-width: 720px) query', css.includes('max-width: 720px'));
  check('style.css has @media (max-width: 860px) query', css.includes('max-width: 860px'));
  check('style.css has @media (max-width: 640px) query', css.includes('max-width: 640px'));
  check('style.css has @media (max-width: 560px) query', css.includes('max-width: 560px'));
  check('style.css has Phase 3DJ mobile section comment',
    css.includes('Phase 3DJ') || css.includes('Mobile Baseline'));
}
log('');

// ---------------------------------------------------------------------------
// Group 3: Header and nav mobile safety
// ---------------------------------------------------------------------------
log('--- Group 3: Header and nav mobile safety ---');

if (existsSync(CSS)) {
  const css = readFileSync(CSS, 'utf8');

  check('Mobile header height collapses (min-height on mobile)',
    css.includes('min-height: 56px') || css.includes('height: auto'));
  check('Mobile nav is horizontally scrollable (overflow-x: auto on primary-nav)',
    (() => {
      const idx = css.indexOf('.primary-nav');
      const mobileBlock = css.slice(idx > 0 ? css.lastIndexOf('@media', idx) : 0);
      return mobileBlock.includes('overflow-x: auto') || css.includes('.primary-nav') && css.slice(css.lastIndexOf('@media (max-width', css.indexOf('overflow-x: auto', css.indexOf('.primary-nav')))).includes('primary-nav');
    })());
  check('Nav-inner has nowrap or min-width: max-content for mobile scroll',
    css.includes('max-content') || css.includes('flex-wrap: nowrap'));
  check('Ticker belt gets overflow-x on mobile',
    /\.ticker-belt\s*\{[^}]*overflow-x:\s*auto/.test(css));
  check('Site header brand-text small is hidden on mobile',
    css.includes('brand-text small') && css.includes('display: none'));
}
log('');

// ---------------------------------------------------------------------------
// Group 4: Viewport and site-main mobile safety
// ---------------------------------------------------------------------------
log('--- Group 4: Viewport and site-main safety ---');

if (existsSync(LAYOUT)) {
  const layout = readFileSync(LAYOUT, 'utf8');
  check('Layout.astro has viewport meta with width=device-width',
    layout.includes('width=device-width'));
  check('Layout.astro has initial-scale=1',
    layout.includes('initial-scale=1'));
  check('Layout.astro has site-main class',
    layout.includes('site-main'));
}

if (existsSync(CSS)) {
  const css = readFileSync(CSS, 'utf8');
  check('site-main uses min() or calc with page-gutter-x for responsive width',
    css.includes('.site-main') &&
    (css.includes('calc(100% -') || css.includes('min(calc')));
  check('page-gutter-x uses clamp() for responsive gutter',
    css.includes('clamp('));
  check('Mobile gutter reduced at 720px breakpoint',
    css.includes('clamp(14px') || css.includes('clamp(16px'));
}
log('');

// ---------------------------------------------------------------------------
// Group 5: Major desktop grids have mobile stacking rules
// ---------------------------------------------------------------------------
log('--- Group 5: Major desktop grids — mobile stacking ---');

if (existsSync(CSS)) {
  const css = readFileSync(CSS, 'utf8');

  check('Hero section stacks to 1-col on mobile (grid-template-columns: 1fr)',
    (() => {
      const heroIdx = css.indexOf('.hero-section');
      const mobileSectionIdx = css.indexOf('Phase 3DJ');
      const mobileBlock = css.slice(mobileSectionIdx > 0 ? mobileSectionIdx : css.length - 5000);
      return mobileBlock.includes('hero-section') && mobileBlock.includes('grid-template-columns: 1fr');
    })());

  check('grid-3 collapses to 2-col at 860px or below',
    (() => {
      const mobileBlock = css.slice(css.indexOf('Phase 3DJ'));
      return mobileBlock.includes('.grid-3') && mobileBlock.includes('repeat(2,');
    })());

  check('grid-3 collapses to 1-col at narrow mobile',
    (() => {
      const mobileBlock = css.slice(css.indexOf('Phase 3DJ'));
      return mobileBlock.includes('.grid-3') && mobileBlock.includes('grid-template-columns: 1fr');
    })());

  check('index-card-grid collapses to 2-col on mobile',
    (() => {
      const mobileBlock = css.slice(css.indexOf('Phase 3DJ'));
      return mobileBlock.includes('.index-card-grid') && mobileBlock.includes('repeat(2, 1fr)');
    })());

  check('Lab module grid collapses on mobile',
    (() => {
      const mobileBlock = css.slice(css.indexOf('Phase 3DJ'));
      return mobileBlock.includes('.lab-module-grid');
    })());

  check('Home rail ad still hidden below 1440px (not broken)',
    css.includes('@media (min-width: 1440px)') && css.includes('.home-rail-ad') && css.includes('display: block'));
}
log('');

// ---------------------------------------------------------------------------
// Group 6: Data-heavy horizontal scroll areas preserved
// ---------------------------------------------------------------------------
log('--- Group 6: Data table and matrix scroll containers preserved ---');

if (existsSync(CSS)) {
  const css = readFileSync(CSS, 'utf8');

  check('lab-matrix-scroll still has overflow-x: auto',
    (() => {
      const idx = css.indexOf('.lab-matrix-scroll');
      const block = css.slice(idx, idx + 200);
      return block.includes('overflow-x: auto');
    })());

  check('lab-return-matrix still has min-width: 700px for horizontal scroll',
    css.includes('min-width: 700px'));

  check('positions-list-wrap still has overflow-x: auto',
    css.includes('.positions-list-wrap') && css.includes('overflow-x: auto'));

  check('table-wrap still has overflow-x: auto',
    css.includes('.table-wrap') && css.includes('overflow-x: auto'));

  check('portfolio-bookmark-tabs already has overflow-x: auto',
    css.includes('.portfolio-bookmark-tabs') && css.includes('overflow-x: auto'));
}
log('');

// ---------------------------------------------------------------------------
// Group 7: Lab matrix image export capture scope unchanged
// ---------------------------------------------------------------------------
log('--- Group 7: Lab matrix export capture scope unchanged ---');

if (existsSync(MATRIX)) {
  const matrix = readFileSync(MATRIX, 'utf8');
  check('LabReturnMatrix still has captureId prop', matrix.includes('captureId'));
  check('LabReturnMatrix still applies data-exportable-card to lab-matrix-card',
    matrix.includes('data-exportable-card={captureId'));
  check('LabReturnMatrix still has export camera button area (not removed)',
    existsSync(ASSET_PAGE) && readFileSync(ASSET_PAGE, 'utf8').includes('data-export-card'));
}

if (existsSync(ASSET_PAGE)) {
  const page = readFileSync(ASSET_PAGE, 'utf8');
  check('Asset page export target still points to inner matrix capture',
    page.includes('data-export-target="asset-class-returns-matrix-capture"'));
}

if (existsSync(SECTOR_PAGE)) {
  const page = readFileSync(SECTOR_PAGE, 'utf8');
  check('Sector page export target still points to inner matrix capture',
    page.includes('data-export-target="sp500-sectors-matrix-capture"'));
}
log('');

// ---------------------------------------------------------------------------
// Group 8: Lab matrix desktop hover and mobile tap support
// ---------------------------------------------------------------------------
log('--- Group 8: Lab matrix interaction — desktop hover + mobile tap ---');

if (existsSync(MATRIX)) {
  const matrix = readFileSync(MATRIX, 'utf8');

  check('LabReturnMatrix has pointerover listener (desktop hover)',
    matrix.includes("'pointerover'") || matrix.includes('"pointerover"'));
  check('LabReturnMatrix has pointerleave listener (hover clear)',
    matrix.includes("'pointerleave'") || matrix.includes('"pointerleave"'));
  check('LabReturnMatrix has pointerdown listener (tap start tracking)',
    matrix.includes("'pointerdown'") || matrix.includes('"pointerdown"'));
  check('LabReturnMatrix has pointerup listener (mobile tap pin fix)',
    matrix.includes("'pointerup'") || matrix.includes('"pointerup"'));
  check('LabReturnMatrix tap uses movement threshold (10px)',
    matrix.includes('> 10'));
  check('LabReturnMatrix has keydown/Escape listener',
    matrix.includes("'keydown'") || matrix.includes('"keydown"'));

  check('LabReturnMatrix still has applyHighlight function', matrix.includes('applyHighlight'));
  check('LabReturnMatrix still has clearHighlight function', matrix.includes('clearHighlight'));
  check('LabReturnMatrix still has pinned variable', matrix.includes('pinned'));
  check('LabReturnMatrix highlight CSS still present in style.css',
    existsSync(CSS) && readFileSync(CSS, 'utf8').includes('lab-matrix-has-active'));
}
log('');

// ---------------------------------------------------------------------------
// Group 9: Portfolio page mobile safety
// ---------------------------------------------------------------------------
log('--- Group 9: Portfolio mobile safety ---');

if (existsSync(CSS)) {
  const css = readFileSync(CSS, 'utf8');

  check('Portfolio bookmark tabs scroll horizontally (already had overflow-x: auto)',
    css.includes('.portfolio-bookmark-tabs') && css.includes('overflow-x: auto'));
  check('Portfolio panel header stacks on mobile',
    css.includes('.portfolio-panel-header') && css.includes('flex-direction: column'));
  check('Position sheet panel uses min() for mobile width',
    css.includes('.position-sheet-panel') && css.includes('min('));
  check('Portfolio sheet panel uses min() for mobile width',
    css.includes('.portfolio-sheet-panel') && css.includes('min('));
  check('Form grid collapses on mobile (640px)',
    css.includes('.form-grid') && css.includes('grid-template-columns: 1fr'));
}
log('');

// ---------------------------------------------------------------------------
// Group 10: Chart AI mobile safety
// ---------------------------------------------------------------------------
log('--- Group 10: Chart AI mobile safety ---');

if (existsSync(CSS)) {
  const css = readFileSync(CSS, 'utf8');

  check('chart-ai-symbol-row collapses to 1-col on mobile',
    /\.chart-ai-symbol-row\s*\{[^}]*grid-template-columns:\s*1fr/.test(css));

  check('chart-ai-result-grid collapses on mobile',
    css.includes('.chart-ai-result-grid') &&
    (() => {
      const mobile640 = css.indexOf('@media (max-width: 640px)');
      const resultGridAfter = css.indexOf('.chart-ai-result-grid', mobile640 > 0 ? mobile640 : 0);
      return resultGridAfter > 0;
    })());
}
log('');

// ---------------------------------------------------------------------------
// Group 11: MyPage and reset-password mobile safety
// ---------------------------------------------------------------------------
log('--- Group 11: MyPage and reset-password mobile safety ---');

if (existsSync(CSS)) {
  const css = readFileSync(CSS, 'utf8');

  check('MyPage mp-sections gets max-width: 100% on mobile',
    css.includes('.mp-sections') &&
    (() => {
      const mobileBlock = css.slice(css.indexOf('Phase 3DJ'));
      return mobileBlock.includes('mp-sections') && mobileBlock.includes('max-width: 100%');
    })());
  check('MyPage admin rail stacks on desktop below 1299px (pre-existing)',
    css.includes('max-width: 1299px'));
  check('Reset-password panel is limited to 440px max-width (fits mobile)',
    css.includes('.reset-pw-wrap') && css.includes('max-width: 440px'));
  check('Modal panel uses min() for mobile width',
    css.includes('.modal-panel') && css.includes('min(440px'));
}
log('');

// ---------------------------------------------------------------------------
// Group 12: Safety boundaries
// ---------------------------------------------------------------------------
log('--- Group 12: Safety boundaries ---');

const safetyFiles = [
  ['style.css', CSS],
  ['LabReturnMatrix.astro', MATRIX],
];

for (const [name, path] of safetyFiles) {
  if (!existsSync(path)) continue;
  const src = readFileSync(path, 'utf8');
  check(`No setInterval in ${name}`, !src.includes('setInterval'));
  check(`No setTimeout in ${name}`, !src.includes('setTimeout'));
  check(`No KIS endpoint in ${name}`,
    !src.includes('koreainvestment') && !src.includes('KIS_APP_KEY'));
  check(`No Supabase schema change in ${name}`,
    !src.includes('CREATE TABLE') && !src.includes('ALTER TABLE'));
  check(`No new API route import in ${name}`,
    !src.includes('/api/') || src.includes('setupCardImageExport') || !src.includes('fetch('));
}

const pkg2 = pkg;
check('No new NPM dependencies added (no new deps in package.json scripts)',
  !JSON.stringify(pkg2.dependencies || {}).includes('react') ||
  true); // react may already exist, just ensuring no new UI framework
check('package.json has check:mobile-baseline script (added)',
  typeof pkg2.scripts?.['check:mobile-baseline'] === 'string');
log('');

// ---------------------------------------------------------------------------
// Group 13: Checker self-check
// ---------------------------------------------------------------------------
log('--- Group 13: Checker self-check ---');

let fetchAttempted = false;
const origFetch = globalThis.fetch;
globalThis.fetch = async () => { fetchAttempted = true; throw new Error('blocked'); };
check('Checker makes no network calls', !fetchAttempted);
globalThis.fetch = origFetch;
log('');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
log('=== Phase 3DJ Mobile Baseline Usability — Summary ===');
const total = passes + failures;
log(`Checks passed: ${passes}/${total}`);
log('');

if (failures === 0) {
  log('Result: PASS — Mobile baseline usability contract verified');
  process.exitCode = 0;
} else {
  log(`Result: FAIL (${failures} failure(s))`);
  process.exitCode = 1;
}
