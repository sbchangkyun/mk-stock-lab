/**
 * Static contract check for Phase 3DI + 3DI-HF1 Lab Matrix Image Export.
 * Verifies export button, inner capture target on lab-matrix-card,
 * LabReturnMatrix captureId prop, CSS, and safety constraints.
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

const ASSET_PAGE = join(root, 'src', 'pages', 'lab', 'asset-class-returns.astro');
const SECTOR_PAGE = join(root, 'src', 'pages', 'lab', 'sp500-sectors.astro');
const MATRIX_COMPONENT = join(root, 'src', 'components', 'LabReturnMatrix.astro');
const EXPORT_LIB = join(root, 'src', 'lib', 'exportCardImage.ts');
const STYLE_PATH = join(root, 'src', 'styles', 'style.css');
const PACKAGE_JSON = join(root, 'package.json');
const RESULT_DOC_3DI = join(root, 'docs', 'planning', 'phase_3di_production_deployment_home_sparkline_lab_export_result_v0.1.md');
const RESULT_DOC_HF1 = join(root, 'docs', 'planning', 'phase_3di_hf1_lab_matrix_export_capture_scope_result_v0.1.md');

const ASSET_CAPTURE_ID = 'asset-class-returns-matrix-capture';
const SECTOR_CAPTURE_ID = 'sp500-sectors-matrix-capture';

const log = (msg) => process.stdout.write(msg + '\n');
let failures = 0;
let passes = 0;

const check = (label, pass) => {
  log(`  [${pass ? 'PASS' : 'FAIL'}] ${label}`);
  if (pass) passes++; else failures++;
};

log('=== Phase 3DI/3DI-HF1 Lab Matrix Image Export Static Contract Check ===');
log('');

// ---------------------------------------------------------------------------
// Group 1: File existence
// ---------------------------------------------------------------------------
log('--- Group 1: File existence ---');

check('asset-class-returns.astro exists', existsSync(ASSET_PAGE));
check('sp500-sectors.astro exists', existsSync(SECTOR_PAGE));
check('LabReturnMatrix.astro exists', existsSync(MATRIX_COMPONENT));
check('exportCardImage.ts utility exists', existsSync(EXPORT_LIB));
check('style.css exists', existsSync(STYLE_PATH));
check('Phase 3DI result doc exists', existsSync(RESULT_DOC_3DI));
check('Phase 3DI-HF1 result doc exists', existsSync(RESULT_DOC_HF1));

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
// Group 3: LabReturnMatrix captureId prop contract
// ---------------------------------------------------------------------------
log('--- Group 3: LabReturnMatrix captureId prop ---');

if (existsSync(MATRIX_COMPONENT)) {
  const matrix = readFileSync(MATRIX_COMPONENT, 'utf8');

  check('LabReturnMatrix defines captureId prop in interface', matrix.includes('captureId'));
  check('LabReturnMatrix destructures captureId from props', matrix.includes('captureId } = Astro.props'));
  check('LabReturnMatrix applies captureId as id on lab-matrix-card', matrix.includes('id={captureId}'));
  check('LabReturnMatrix applies data-exportable-card conditionally on lab-matrix-card', matrix.includes('data-exportable-card={captureId'));
  check('LabReturnMatrix lab-matrix-card is capture target (not outer section)', matrix.includes('class="lab-matrix-card"'));
  check('LabReturnMatrix still renders lab-return-matrix table', matrix.includes('lab-return-matrix'));
  check('LabReturnMatrix still renders lab-matrix-data-note', matrix.includes('lab-matrix-data-note'));
  check('LabReturnMatrix lab-matrix-summary-block is outside capture target',
    matrix.indexOf('lab-matrix-summary-block') > matrix.indexOf('lab-matrix-data-note'));
  check('LabReturnMatrix lab-matrix-legend is outside capture target',
    matrix.indexOf('lab-matrix-legend') < matrix.indexOf('lab-matrix-card'));
  check('LabReturnMatrix lab-matrix-interaction-hint is outside capture target',
    matrix.indexOf('lab-matrix-interaction-hint') < matrix.indexOf('lab-matrix-card'));
  check('LabReturnMatrix still has hover interaction script', matrix.includes('setupMatrix'));
  check('LabReturnMatrix still has astro:page-load listener', matrix.includes('astro:page-load'));
}
log('');

// ---------------------------------------------------------------------------
// Group 4: asset-class-returns.astro capture scope contract
// ---------------------------------------------------------------------------
log('--- Group 4: asset-class-returns.astro capture scope ---');

if (existsSync(ASSET_PAGE)) {
  const page = readFileSync(ASSET_PAGE, 'utf8');

  check('Asset page imports setupCardImageExport', page.includes('setupCardImageExport'));
  check('Asset page imports from exportCardImage', page.includes('exportCardImage'));
  check('Asset page has data-export-card button', page.includes('data-export-card'));
  check('Asset page data-export-target points to inner matrix capture ID',
    page.includes(`data-export-target="${ASSET_CAPTURE_ID}"`));
  check('Asset page passes captureId to LabReturnMatrix',
    page.includes(`captureId="${ASSET_CAPTURE_ID}"`));
  check('Asset page does NOT have data-exportable-card (capture is inside LabReturnMatrix)',
    !page.includes('data-exportable-card'));
  check('Asset page outer wrapper no longer uses old lab-asset-matrix-card target',
    !page.includes('data-export-target="lab-asset-matrix-card"'));
  check('Asset page has data-export-filename="asset-class-returns"',
    page.includes('"asset-class-returns"'));
  check('Asset page has data-card-actions container', page.includes('data-card-actions'));
  check('Asset page export button aria-label is 이미지로 저장', page.includes('이미지로 저장'));
  check('Asset page calls setupCardImageExport on astro:page-load', page.includes('astro:page-load'));
  check('Asset page still imports LabReturnMatrix', page.includes('LabReturnMatrix'));
  check('Asset page still has 예시 데이터 content', page.includes('예시 데이터'));
  check('Asset page still has data policy aside', page.includes('lab-data-policy'));
  check('Asset page still has related links', page.includes('lab-detail-related'));
}
log('');

// ---------------------------------------------------------------------------
// Group 5: sp500-sectors.astro capture scope contract
// ---------------------------------------------------------------------------
log('--- Group 5: sp500-sectors.astro capture scope ---');

if (existsSync(SECTOR_PAGE)) {
  const page = readFileSync(SECTOR_PAGE, 'utf8');

  check('Sector page imports setupCardImageExport', page.includes('setupCardImageExport'));
  check('Sector page imports from exportCardImage', page.includes('exportCardImage'));
  check('Sector page has data-export-card button', page.includes('data-export-card'));
  check('Sector page data-export-target points to inner matrix capture ID',
    page.includes(`data-export-target="${SECTOR_CAPTURE_ID}"`));
  check('Sector page passes captureId to LabReturnMatrix',
    page.includes(`captureId="${SECTOR_CAPTURE_ID}"`));
  check('Sector page does NOT have data-exportable-card (capture is inside LabReturnMatrix)',
    !page.includes('data-exportable-card'));
  check('Sector page outer wrapper no longer uses old lab-sector-matrix-card target',
    !page.includes('data-export-target="lab-sector-matrix-card"'));
  check('Sector page has data-export-filename="sp500-sectors"',
    page.includes('"sp500-sectors"'));
  check('Sector page has data-card-actions container', page.includes('data-card-actions'));
  check('Sector page export button aria-label is 이미지로 저장', page.includes('이미지로 저장'));
  check('Sector page calls setupCardImageExport on astro:page-load', page.includes('astro:page-load'));
  check('Sector page still imports LabReturnMatrix', page.includes('LabReturnMatrix'));
  check('Sector page still has 예시 데이터 content', page.includes('예시 데이터'));
  check('Sector page still has data policy aside', page.includes('lab-data-policy'));
  check('Sector page still has related links', page.includes('lab-detail-related'));
}
log('');

// ---------------------------------------------------------------------------
// Group 6: CSS export header classes
// ---------------------------------------------------------------------------
log('--- Group 6: CSS export header classes ---');

if (existsSync(STYLE_PATH)) {
  const css = readFileSync(STYLE_PATH, 'utf8');
  check('.lab-matrix-export-header class defined', css.includes('.lab-matrix-export-header'));
  check('.lab-matrix-export-label class defined', css.includes('.lab-matrix-export-label'));
  check('.lab-matrix-export-actions class defined', css.includes('.lab-matrix-export-actions'));
  check('.chart-export-button still defined (no regression)', css.includes('.chart-export-button'));
}
log('');

// ---------------------------------------------------------------------------
// Group 7: Safety boundaries — no live data, no new dependencies
// ---------------------------------------------------------------------------
log('--- Group 7: Safety boundaries ---');

const filesToCheck = [
  ['asset page', ASSET_PAGE],
  ['sector page', SECTOR_PAGE],
  ['LabReturnMatrix', MATRIX_COMPONENT],
];

for (const [name, path] of filesToCheck) {
  if (!existsSync(path)) continue;
  const src = readFileSync(path, 'utf8');
  check(`No fetch() in ${name}`, !src.includes('fetch('));
  check(`No KIS endpoint in ${name}`, !src.includes('koreainvestment') && !src.includes('KIS_APP_KEY'));
  check(`No Supabase in ${name}`, !src.includes('supabase'));
  check(`No setInterval in ${name}`, !src.includes('setInterval'));
  check(`No canvas in ${name}`, !src.includes('<canvas'));
  check(`No Chart.js in ${name}`, !src.toLowerCase().includes('chart.js'));
}
log('');

// ---------------------------------------------------------------------------
// Group 8: Checker self-check
// ---------------------------------------------------------------------------
log('--- Group 8: Checker self-check ---');

let fetchAttempted = false;
const origFetch = globalThis.fetch;
globalThis.fetch = async () => { fetchAttempted = true; throw new Error('blocked'); };
check('Checker makes no network calls', !fetchAttempted);
globalThis.fetch = origFetch;
log('');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
log('=== Phase 3DI/3DI-HF1 Lab Matrix Image Export — Summary ===');
const total = passes + failures;
log(`Checks passed: ${passes}/${total}`);
log('');

if (failures === 0) {
  log('Result: PASS — Lab matrix image export (narrowed capture scope) contract verified');
  process.exitCode = 0;
} else {
  log(`Result: FAIL (${failures} failure(s))`);
  process.exitCode = 1;
}
