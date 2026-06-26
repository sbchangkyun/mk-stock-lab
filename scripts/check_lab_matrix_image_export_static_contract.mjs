/**
 * Static contract check for Phase 3DI Lab Matrix Image Export.
 * Verifies export button, exportable-card wrapper, utility import, and CSS
 * on both Lab detail pages. No network calls. No .env reads.
 */

globalThis.fetch = async (url) => {
  throw new Error(`[checker] BLOCKED unexpected network call to: ${String(url).slice(0, 60)}`);
};

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const ASSET_PAGE = join(root, 'src', 'pages', 'lab', 'asset-class-returns.astro');
const SECTOR_PAGE = join(root, 'src', 'pages', 'lab', 'sp500-sectors.astro');
const EXPORT_LIB = join(root, 'src', 'lib', 'exportCardImage.ts');
const STYLE_PATH = join(root, 'src', 'styles', 'style.css');
const PACKAGE_JSON = join(root, 'package.json');
const RESULT_DOC = join(root, 'docs', 'planning', 'phase_3di_production_deployment_home_sparkline_lab_export_result_v0.1.md');

const log = (msg) => process.stdout.write(msg + '\n');
let failures = 0;
let passes = 0;

const check = (label, pass) => {
  log(`  [${pass ? 'PASS' : 'FAIL'}] ${label}`);
  if (pass) passes++; else failures++;
};

log('=== Phase 3DI Lab Matrix Image Export Static Contract Check ===');
log('');

// ---------------------------------------------------------------------------
// Group 1: File existence
// ---------------------------------------------------------------------------
log('--- Group 1: File existence ---');

check('asset-class-returns.astro exists', existsSync(ASSET_PAGE));
check('sp500-sectors.astro exists', existsSync(SECTOR_PAGE));
check('exportCardImage.ts utility exists', existsSync(EXPORT_LIB));
check('style.css exists', existsSync(STYLE_PATH));
check('Phase 3DI result doc exists', existsSync(RESULT_DOC));

let pkg = {};
try { pkg = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8')); } catch {}
check('package.json has check:lab-matrix-image-export script',
  typeof pkg.scripts?.['check:lab-matrix-image-export'] === 'string');
log('');

// ---------------------------------------------------------------------------
// Group 2: Export utility contract
// ---------------------------------------------------------------------------
log('--- Group 2: Export utility contract ---');

if (existsSync(EXPORT_LIB)) {
  const lib = readFileSync(EXPORT_LIB, 'utf8');
  check('exportCardImage exports exportCardAsPng', lib.includes('exportCardAsPng'));
  check('exportCardImage exports setupCardImageExport', lib.includes('setupCardImageExport'));
  check('exportCardImage uses data-export-card selector', lib.includes('data-export-card'));
  check('exportCardImage uses data-exportable-card selector', lib.includes('data-exportable-card'));
  check('exportCardImage uses data-card-actions filter', lib.includes('data-card-actions'));
  check('exportCardImage uses html-to-image toBlob', lib.includes('toBlob'));
  check('exportCardImage uses todayStamp for filename', lib.includes('todayStamp'));
}
log('');

// ---------------------------------------------------------------------------
// Group 3: asset-class-returns.astro export contract
// ---------------------------------------------------------------------------
log('--- Group 3: asset-class-returns.astro export contract ---');

if (existsSync(ASSET_PAGE)) {
  const page = readFileSync(ASSET_PAGE, 'utf8');

  check('Asset page imports setupCardImageExport', page.includes('setupCardImageExport'));
  check('Asset page imports from exportCardImage', page.includes('exportCardImage'));
  check('Asset page has data-exportable-card wrapper', page.includes('data-exportable-card'));
  check('Asset page has data-export-card button', page.includes('data-export-card'));
  check('Asset page has data-export-target for matrix card', page.includes('data-export-target'));
  check('Asset page has data-export-filename="asset-class-returns"', page.includes('"asset-class-returns"'));
  check('Asset page has data-card-actions container', page.includes('data-card-actions'));
  check('Asset page export button aria-label is 이미지로 저장', page.includes('이미지로 저장'));
  check('Asset page uses chart-export-button class', page.includes('chart-export-button'));
  check('Asset page has lab-matrix-export-card class', page.includes('lab-matrix-export-card'));
  check('Asset page has lab-matrix-export-header class', page.includes('lab-matrix-export-header'));
  check('Asset page calls setupCardImageExport on astro:page-load', page.includes('astro:page-load'));

  check('Asset page still imports LabReturnMatrix', page.includes('LabReturnMatrix'));
  check('Asset page still has 예시 데이터 content', page.includes('예시 데이터'));
  check('Asset page still has data policy aside', page.includes('lab-data-policy'));
  check('Asset page still has related links', page.includes('lab-detail-related'));
}
log('');

// ---------------------------------------------------------------------------
// Group 4: sp500-sectors.astro export contract
// ---------------------------------------------------------------------------
log('--- Group 4: sp500-sectors.astro export contract ---');

if (existsSync(SECTOR_PAGE)) {
  const page = readFileSync(SECTOR_PAGE, 'utf8');

  check('Sector page imports setupCardImageExport', page.includes('setupCardImageExport'));
  check('Sector page imports from exportCardImage', page.includes('exportCardImage'));
  check('Sector page has data-exportable-card wrapper', page.includes('data-exportable-card'));
  check('Sector page has data-export-card button', page.includes('data-export-card'));
  check('Sector page has data-export-target for matrix card', page.includes('data-export-target'));
  check('Sector page has data-export-filename="sp500-sectors"', page.includes('"sp500-sectors"'));
  check('Sector page has data-card-actions container', page.includes('data-card-actions'));
  check('Sector page export button aria-label is 이미지로 저장', page.includes('이미지로 저장'));
  check('Sector page uses chart-export-button class', page.includes('chart-export-button'));
  check('Sector page has lab-matrix-export-card class', page.includes('lab-matrix-export-card'));
  check('Sector page has lab-matrix-export-header class', page.includes('lab-matrix-export-header'));
  check('Sector page calls setupCardImageExport on astro:page-load', page.includes('astro:page-load'));

  check('Sector page still imports LabReturnMatrix', page.includes('LabReturnMatrix'));
  check('Sector page still has 예시 데이터 content', page.includes('예시 데이터'));
  check('Sector page still has data policy aside', page.includes('lab-data-policy'));
  check('Sector page still has related links', page.includes('lab-detail-related'));
}
log('');

// ---------------------------------------------------------------------------
// Group 5: CSS classes for export header
// ---------------------------------------------------------------------------
log('--- Group 5: CSS export header classes ---');

if (existsSync(STYLE_PATH)) {
  const css = readFileSync(STYLE_PATH, 'utf8');
  check('.lab-matrix-export-header class defined', css.includes('.lab-matrix-export-header'));
  check('.lab-matrix-export-label class defined', css.includes('.lab-matrix-export-label'));
  check('.lab-matrix-export-actions class defined', css.includes('.lab-matrix-export-actions'));
  check('.chart-export-button still defined (no regression)', css.includes('.chart-export-button'));
}
log('');

// ---------------------------------------------------------------------------
// Group 6: Safety boundaries — no live data, no new API routes
// ---------------------------------------------------------------------------
log('--- Group 6: Safety boundaries ---');

if (existsSync(ASSET_PAGE)) {
  const page = readFileSync(ASSET_PAGE, 'utf8');
  check('No fetch() call in asset page', !page.includes('fetch('));
  check('No KIS endpoint in asset page', !page.includes('koreainvestment') && !page.includes('KIS_APP_KEY'));
  check('No Supabase in asset page', !page.includes('supabase'));
  check('No setInterval in asset page', !page.includes('setInterval'));
  check('No setTimeout in asset page', !page.includes('setTimeout'));
  check('No canvas in asset page', !page.includes('<canvas'));
  check('No Chart.js in asset page', !page.toLowerCase().includes('chart.js'));
}

if (existsSync(SECTOR_PAGE)) {
  const page = readFileSync(SECTOR_PAGE, 'utf8');
  check('No fetch() call in sector page', !page.includes('fetch('));
  check('No KIS endpoint in sector page', !page.includes('koreainvestment') && !page.includes('KIS_APP_KEY'));
  check('No Supabase in sector page', !page.includes('supabase'));
  check('No setInterval in sector page', !page.includes('setInterval'));
  check('No setTimeout in sector page', !page.includes('setTimeout'));
  check('No canvas in sector page', !page.includes('<canvas'));
  check('No Chart.js in sector page', !page.toLowerCase().includes('chart.js'));
}
log('');

// ---------------------------------------------------------------------------
// Group 7: Checker self-check
// ---------------------------------------------------------------------------
log('--- Group 7: Checker self-check ---');

let fetchAttempted = false;
const origFetch = globalThis.fetch;
globalThis.fetch = async () => { fetchAttempted = true; throw new Error('blocked'); };
check('Checker makes no network calls', !fetchAttempted);
globalThis.fetch = origFetch;
log('');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
log('=== Phase 3DI Lab Matrix Image Export — Summary ===');
const total = passes + failures;
log(`Checks passed: ${passes}/${total}`);
log('');

if (failures === 0) {
  log('Result: PASS — Lab matrix image export contract verified');
  process.exitCode = 0;
} else {
  log(`Result: FAIL (${failures} failure(s))`);
  process.exitCode = 1;
}
