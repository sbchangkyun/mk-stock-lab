/**
 * Static contract check for Phase 4D — Lab Production Completion.
 *
 * Phase 4D is an accessibility/semantics/truthfulness completion pass over the existing Lab detail
 * pages (src/pages/lab/*.astro) and the return-matrix component (src/components/LabReturnMatrix.astro)
 * -- NOT a new data source or provider integration. This checker verifies, via static source
 * inspection only (no execution, no network), that:
 *   - (A) Matrix table semantics: real <table>/<caption>/<th scope> structure for both tables.
 *   - (B) Category highlighting + keyboard architecture: only the 12 legend items are native
 *     <button>s with aria-pressed; table cells stay non-tabbable; no document/window-level keydown
 *     listener; Escape clears the pin via the root-scoped handler.
 *   - (C) Horizontal scrolling: each table sits in a role="region" + tabindex="0" scroll container
 *     with an accessible label.
 *   - (D) Image export feedback: role="status"/aria-live="polite"/aria-atomic="true" status regions
 *     wired to the shared exportStatusMessage helper (no window.alert).
 *   - (E) Future-module semantics: the still-unintegrated Lab pages use <ul>/<li> preview cards, not
 *     bare <div> soup.
 *   - (F) CSS: Lab-scoped selectors exist, dark mode is scoped via body.dark-mode, no unscoped global
 *     resets were introduced.
 *   - (G) Resume-state boundary: the Phase 3GI retention module is untouched by this phase's files.
 *   - (H) No-provider boundary: no new fetch/KIS/Supabase/API-route reference was added to any file
 *     this phase touches.
 *   - nps-portfolio.astro redirects permanently to /lab/nps-holdings instead of being deleted.
 *   - labReturnMatrices.json fixture keeps its documented shape (years/categories/rankings/summary).
 */

globalThis.fetch = async (url) => {
  throw new Error(`[checker] BLOCKED unexpected network call to: ${String(url).slice(0, 60)}`);
};

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const MATRIX = join(root, 'src', 'components', 'LabReturnMatrix.astro');
const NPS_PORTFOLIO = join(root, 'src', 'pages', 'lab', 'nps-portfolio.astro');
const NPS_HOLDINGS = join(root, 'src', 'pages', 'lab', 'nps-holdings.astro');
const CONGRESS = join(root, 'src', 'pages', 'lab', 'congress-stocks.astro');
const SP500 = join(root, 'src', 'pages', 'lab', 'sp500-sectors.astro');
const ASSET = join(root, 'src', 'pages', 'lab', 'asset-class-returns.astro');
const EXPORT_LIB = join(root, 'src', 'lib', 'exportCardImage.ts');
const FIXTURE = join(root, 'src', 'data', 'labReturnMatrices.json');
const CSS = join(root, 'src', 'styles', 'style.css');
const RETENTION = join(root, 'src', 'lib', 'userRetentionClient.ts');

const log = (msg) => process.stdout.write(msg + '\n');
let passes = 0;
let failures = 0;
const check = (label, pass) => {
  log(`  [${pass ? 'PASS' : 'FAIL'}] ${label}`);
  if (pass) passes++; else failures++;
};
const readOr = (path) => (existsSync(path) ? readFileSync(path, 'utf8') : '');
const countOf = (src, re) => (src.match(re) || []).length;

log('=== Phase 4D Lab Production Completion Static Contract ===');
log('');

// ---------------------------------------------------------------------------
// Group 0: File existence
// ---------------------------------------------------------------------------
log('--- Group 0: File existence ---');
check('0a. LabReturnMatrix.astro exists', existsSync(MATRIX));
check('0b. nps-portfolio.astro exists (kept as redirect, not deleted)', existsSync(NPS_PORTFOLIO));
check('0c. nps-holdings.astro exists', existsSync(NPS_HOLDINGS));
check('0d. congress-stocks.astro exists', existsSync(CONGRESS));
check('0e. sp500-sectors.astro exists', existsSync(SP500));
check('0f. asset-class-returns.astro exists', existsSync(ASSET));
check('0g. exportCardImage.ts exists', existsSync(EXPORT_LIB));
check('0h. labReturnMatrices.json fixture exists', existsSync(FIXTURE));

const matrixSrc = readOr(MATRIX);
const npsPortfolioSrc = readOr(NPS_PORTFOLIO);
const npsHoldingsSrc = readOr(NPS_HOLDINGS);
const congressSrc = readOr(CONGRESS);
const sp500Src = readOr(SP500);
const assetSrc = readOr(ASSET);
const exportLibSrc = readOr(EXPORT_LIB);
const cssSrc = readOr(CSS);

// ---------------------------------------------------------------------------
// Group A: Matrix table semantics
// ---------------------------------------------------------------------------
log('--- Group A: Matrix table semantics ---');
check('A1. ranking matrix uses a real <table>', /<table class="lab-return-matrix">/.test(matrixSrc));
check('A2. ranking matrix has a <caption>', /<caption class="visually-hidden">\{data\.title\}/.test(matrixSrc));
check('A3. ranking matrix header cells use scope="col"', countOf(matrixSrc, /<th scope="col"/g) >= 2);
check('A4. ranking matrix row headers use scope="row"', /<th scope="row" class="lab-rank-cell">/.test(matrixSrc));
check('A5. summary table uses a real <table>', /<table class="lab-summary-table">/.test(matrixSrc));
check('A6. summary table has its own <caption>', countOf(matrixSrc, /<caption class="visually-hidden">/g) === 2);
check('A7. summary table row headers use scope="row"', /<th scope="row">\s*<span/.test(matrixSrc));
check('A8. empty cells carry an accessible label instead of being silently blank', /aria-label="데이터 없음"/.test(matrixSrc));

// ---------------------------------------------------------------------------
// Group B: Category highlighting + keyboard architecture
// ---------------------------------------------------------------------------
log('--- Group B: Category highlighting + keyboard architecture ---');
check('B1. legend items are native <button type="button">', /<button\s+type="button"\s+class=\{`lab-matrix-chip/.test(matrixSrc));
check('B2. legend buttons declare aria-pressed', /data-lab-legend-button[\s\S]{0,120}aria-pressed="false"/.test(matrixSrc));
check('B3. table data cells are plain <td>/<div>, not buttons (non-tabbable)', !/<td>[\s\S]{0,20}<button/.test(matrixSrc));
check('B4. no tabindex is added directly to a matrix cell', !/data-lab-matrix-cell[\s\S]{0,80}tabindex/.test(matrixSrc));
check('B5. syncPressed only ever writes aria-pressed on legend buttons', /data-lab-legend-button.*aria-pressed/.test(matrixSrc.replace(/\r?\n/g, ' ')));
check('B6. Escape clears the pin via a root-scoped keydown handler', /root\.addEventListener\('keydown'/.test(matrixSrc) && /key === 'Escape'/.test(matrixSrc));
check('B7. no document- or window-level keydown listener was added', !/(document|window)\.addEventListener\('key(down|up)'/.test(matrixSrc));
check('B8. legend click and keyboard activation share one togglePin call (no double-toggle path)', /btn\.addEventListener\('click', \(\) => togglePin\(id\)\)/.test(matrixSrc));
check('B9. keyboard focus applies the same temporary highlight as hover, without touching pinned state', /btn\.addEventListener\('focus'/.test(matrixSrc) && /applyHighlight\(root, id\)/.test(matrixSrc));

// ---------------------------------------------------------------------------
// Group C: Horizontal scrolling
// ---------------------------------------------------------------------------
log('--- Group C: Horizontal scrolling ---');
check('C1. ranking table sits in a role="region" scroll container', /class="lab-matrix-scroll"\s*\n\s*role="region"/.test(matrixSrc));
check('C2. summary table sits in its own role="region" scroll container', countOf(matrixSrc, /class="lab-matrix-scroll"/g) === 2);
check('C3. both scroll regions are keyboard-reachable (tabindex="0")', countOf(matrixSrc, /role="region"[\s\S]{0,80}tabindex="0"/g) === 2);
check('C4. both scroll regions carry a descriptive aria-label', countOf(matrixSrc, /aria-label=\{`\$\{data\.title\}/g) === 2);
check('C5. scroll containers have a visible focus style', /\.lab-matrix-scroll:focus-visible/.test(cssSrc));

// ---------------------------------------------------------------------------
// Group D: Image export feedback
// ---------------------------------------------------------------------------
log('--- Group D: Image export feedback ---');
check('D1. exportStatusMessage helper is exported and pure (no DOM reference)', /export const exportStatusMessage/.test(exportLibSrc) && !/document\./.test(exportLibSrc.split('export const exportStatusMessage')[1]?.split('};')[0] ?? ''));
check('D2. setupCardImageExport routes all three status writes through the helper', countOf(exportLibSrc, /setStatus\(exportStatusMessage\(/g) === 3);
check('D3. no literal duplicate status string remains inlined in the click handler', !/setStatus\('이미지를 저장하는 중입니다\.'\)/.test(exportLibSrc));
check('D4. no window.alert is used for export feedback', !/window\.alert/.test(exportLibSrc));
check('D5. sp500-sectors.astro wires a role="status"/aria-live="polite"/aria-atomic="true" export status region', /role="status"[\s\S]{0,40}aria-live="polite"[\s\S]{0,40}aria-atomic="true"/.test(sp500Src));
check('D6. asset-class-returns.astro wires the same export status region pattern', /role="status"[\s\S]{0,40}aria-live="polite"[\s\S]{0,40}aria-atomic="true"/.test(assetSrc));
check('D7. sp500-sectors.astro export button links to its status region via data-export-status', /data-export-status="sp500-sectors-export-status"/.test(sp500Src) && /id="sp500-sectors-export-status"/.test(sp500Src));
check('D8. asset-class-returns.astro export button links to its status region via data-export-status', /data-export-status="asset-class-returns-export-status"/.test(assetSrc) && /id="asset-class-returns-export-status"/.test(assetSrc));

// ---------------------------------------------------------------------------
// Group E: Future-module semantics
// ---------------------------------------------------------------------------
log('--- Group E: Future-module semantics ---');
check('E1. nps-holdings.astro preview grid uses <ul>/<li>, not bare <div> soup', /<ul class="lab-static-preview-grid">/.test(npsHoldingsSrc) && /<li class="lab-static-preview-card">/.test(npsHoldingsSrc));
check('E2. congress-stocks.astro preview grid uses <ul>/<li>', /<ul class="lab-static-preview-grid">/.test(congressSrc) && /<li class="lab-static-preview-card">/.test(congressSrc));
check('E3. nps-holdings.astro has exactly 3 preview cards, all list items', countOf(npsHoldingsSrc, /<li class="lab-static-preview-card">/g) === 3);
check('E4. congress-stocks.astro has exactly 3 preview cards, all list items', countOf(congressSrc, /<li class="lab-static-preview-card">/g) === 3);
check('E5. both preview pages keep the non-advisory data-policy aside', /자동화된 투자 권고를 제공하지 않습니다/.test(npsHoldingsSrc) && /자동화된 투자 권고를 제공하지 않습니다/.test(congressSrc));

// ---------------------------------------------------------------------------
// Group F: CSS scoping
// ---------------------------------------------------------------------------
log('--- Group F: CSS scoping ---');
check('F1. legend chip focus-visible style exists and is Lab-scoped', /\.lab-matrix-legend button\.lab-matrix-chip:focus-visible/.test(cssSrc));
check('F2. dark mode overrides are scoped via body.dark-mode, not a bare selector', /body\.dark-mode \.lab-matrix-legend button\.lab-matrix-chip:focus-visible/.test(cssSrc) && /body\.dark-mode \.lab-matrix-scroll:focus-visible/.test(cssSrc));
check('F3. static preview grid list-reset styling exists', /\.lab-static-preview-grid \{/.test(cssSrc));
check('F4. export status region styling exists', /\.lab-export-status \{/.test(cssSrc) && /\.lab-export-status:empty \{/.test(cssSrc));
check('F5. no global, unscoped ul/li reset was introduced by this phase', !/\n\s*ul\s*,\s*li\s*\{/.test(cssSrc));

// ---------------------------------------------------------------------------
// Group G: Resume-state boundary (Phase 3GI retention untouched)
// ---------------------------------------------------------------------------
log('--- Group G: Resume-state boundary ---');
check('G1. userRetentionClient.ts module still exists, unreferenced by this phase\'s new markup', existsSync(RETENTION));
check('G2. LabReturnMatrix.astro does not import or call into the retention module', !/userRetention/.test(matrixSrc));
check('G3. Lab detail pages touched by this phase do not reference the retention module',
  [npsHoldingsSrc, congressSrc, sp500Src, assetSrc].every((s) => !/userRetention/.test(s)));

// ---------------------------------------------------------------------------
// Group H: No-provider boundary
// ---------------------------------------------------------------------------
log('--- Group H: No-provider boundary ---');
const phaseFiles = [matrixSrc, npsPortfolioSrc, npsHoldingsSrc, congressSrc, sp500Src, assetSrc, exportLibSrc];
check('H1. no fetch() call was added across the files this phase touches', phaseFiles.every((s) => !/\bfetch\(/.test(s)));
check('H2. no KIS provider reference was added', phaseFiles.every((s) => !/kis[A-Z]/.test(s) && !/KIS_/.test(s)));
check('H3. no Supabase reference was added', phaseFiles.every((s) => !/supabase/i.test(s)));
check('H4. no /api/ route reference was added', phaseFiles.every((s) => !/['"`]\/api\//.test(s)));

// ---------------------------------------------------------------------------
// Group I: nps-portfolio redirect
// ---------------------------------------------------------------------------
log('--- Group I: nps-portfolio permanent redirect ---');
check('I1. nps-portfolio.astro redirects instead of rendering markup', /Astro\.redirect\('\/lab\/nps-holdings', 301\)/.test(npsPortfolioSrc));
check('I2. nps-portfolio.astro has no rendered body left over', !/<Layout/.test(npsPortfolioSrc));

// ---------------------------------------------------------------------------
// Group J: labReturnMatrices.json fixture shape
// ---------------------------------------------------------------------------
log('--- Group J: fixture integrity ---');
let fixture = null;
try {
  fixture = JSON.parse(readOr(FIXTURE));
} catch {
  fixture = null;
}
check('J1. fixture parses as valid JSON', fixture !== null);
check('J2. fixture has an assetMatrix and a sectorMatrix', !!fixture?.assetMatrix && !!fixture?.sectorMatrix);
check('J3. assetMatrix has 7 years, 12 categories, 12 rankings, 12 summary rows',
  fixture?.assetMatrix?.years?.length === 7 &&
  fixture?.assetMatrix?.categories?.length === 12 &&
  fixture?.assetMatrix?.rankings?.length === 12 &&
  fixture?.assetMatrix?.summary?.length === 12);
check('J4. sectorMatrix has 7 years, 12 categories, 12 rankings, 12 summary rows',
  fixture?.sectorMatrix?.years?.length === 7 &&
  fixture?.sectorMatrix?.categories?.length === 12 &&
  fixture?.sectorMatrix?.rankings?.length === 12 &&
  fixture?.sectorMatrix?.summary?.length === 12);
check('J5. both matrices carry the non-advisory example-data disclaimer in their note',
  /예시 데이터/.test(fixture?.assetMatrix?.note ?? '') && /투자 판단/.test(fixture?.assetMatrix?.note ?? '') &&
  /예시 데이터/.test(fixture?.sectorMatrix?.note ?? '') && /투자 판단/.test(fixture?.sectorMatrix?.note ?? ''));

log('');
log(`Total: ${passes + failures} | Passed: ${passes} | Failed: ${failures}`);
process.exitCode = failures === 0 ? 0 : 1;
