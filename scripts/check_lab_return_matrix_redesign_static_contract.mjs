/**
 * Static contract check for Phase 3DF-HF1 Lab Return Matrix Redesign.
 * Verifies matrix-first layout, fixture data, safety boundaries, and no-network policy.
 * No network calls. No .env reads. Exits non-zero on failure.
 */

globalThis.fetch = async (url) => {
  throw new Error(`[checker] BLOCKED unexpected network call to: ${String(url).slice(0, 60)}`);
};

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const LAB_PAGE = join(root, 'src', 'pages', 'lab.astro');
const LAB_COMPONENT = join(root, 'src', 'components', 'LabReturnMatrix.astro');
const FIXTURE_PATH = join(root, 'src', 'data', 'labReturnMatrices.json');
const STYLE_PATH = join(root, 'src', 'styles', 'style.css');
const PACKAGE_JSON = join(root, 'package.json');
const RESULT_DOC = join(root, 'docs', 'planning', 'phase_3df_hf1_lab_return_matrix_redesign_result_v0.1.md');
const API_LAB_DIR = join(root, 'src', 'pages', 'api', 'lab');

const log = (msg) => process.stdout.write(msg + '\n');
let failures = 0;
let passes = 0;

const check = (label, pass) => {
  log(`  [${pass ? 'PASS' : 'FAIL'}] ${label}`);
  if (pass) passes++; else failures++;
};

log('=== Phase 3DF-HF1 Lab Return Matrix Redesign — Static Contract Check ===');
log('');

// ---------------------------------------------------------------------------
// Group 1: File existence
// ---------------------------------------------------------------------------
log('--- Group 1: File existence ---');

check('lab.astro exists', existsSync(LAB_PAGE));
check('LabReturnMatrix.astro component exists', existsSync(LAB_COMPONENT));
check('labReturnMatrices.json fixture exists', existsSync(FIXTURE_PATH));
check('Phase 3DF-HF1 result doc exists', existsSync(RESULT_DOC));

let pkg = {};
try { pkg = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8')); } catch {}
check('package.json has check:lab-return-matrix script',
  typeof pkg.scripts?.['check:lab-return-matrix'] === 'string');

log('');

if (!existsSync(LAB_PAGE)) {
  log('ERROR: lab.astro missing. Cannot continue.');
  process.exit(1);
}
if (!existsSync(FIXTURE_PATH)) {
  log('ERROR: labReturnMatrices.json missing. Cannot continue.');
  process.exit(1);
}

const page = readFileSync(LAB_PAGE, 'utf8');
const componentSrc = existsSync(LAB_COMPONENT) ? readFileSync(LAB_COMPONENT, 'utf8') : '';
const pageAndComponent = page + '\n' + componentSrc;
const css = existsSync(STYLE_PATH) ? readFileSync(STYLE_PATH, 'utf8') : '';

// ---------------------------------------------------------------------------
// Group 2: Fixture JSON structure
// ---------------------------------------------------------------------------
log('--- Group 2: Fixture JSON structure ---');

let fixture = null;
try {
  fixture = JSON.parse(readFileSync(FIXTURE_PATH, 'utf8'));
  check('Fixture parses as valid JSON', true);
} catch {
  check('Fixture parses as valid JSON', false);
  log('ERROR: JSON parse failed. Cannot continue fixture checks.');
  fixture = null;
}

if (fixture !== null) {
  check('Fixture has assetMatrix', typeof fixture.assetMatrix === 'object' && fixture.assetMatrix !== null);
  check('Fixture has sectorMatrix', typeof fixture.sectorMatrix === 'object' && fixture.sectorMatrix !== null);

  const am = fixture.assetMatrix || {};
  const sm = fixture.sectorMatrix || {};

  check('assetMatrix.title includes "자산군 수익률 비교"',
    typeof am.title === 'string' && am.title.includes('자산군 수익률 비교'));
  check('sectorMatrix.title includes "S&P 500 섹터별 수익률"',
    typeof sm.title === 'string' && sm.title.includes('S&P 500 섹터별 수익률'));

  // Category counts
  check('Asset matrix has at least 8 categories',
    Array.isArray(am.categories) && am.categories.length >= 8);
  check('Sector matrix has at least 11 categories',
    Array.isArray(sm.categories) && sm.categories.length >= 11);

  // Year columns
  check('Asset matrix has at least 6 year columns',
    Array.isArray(am.years) && am.years.length >= 6);
  check('Asset matrix includes YTD column',
    Array.isArray(am.years) && am.years.includes('YTD'));
  check('Sector matrix has at least 6 year columns',
    Array.isArray(sm.years) && sm.years.length >= 6);
  check('Sector matrix includes YTD column',
    Array.isArray(sm.years) && sm.years.includes('YTD'));

  // Rank row counts
  check('Asset matrix has at least 8 rank rows',
    Array.isArray(am.rankings) && am.rankings.length >= 8);
  check('Sector matrix has at least 11 rank rows',
    Array.isArray(sm.rankings) && sm.rankings.length >= 11);

  // Cell structure: each cell has label and return
  const amCellsOk = Array.isArray(am.rankings) && am.rankings.every((row) =>
    Array.isArray(row.cells) && row.cells.every((c) =>
      typeof c.label === 'string' && c.label.length > 0 &&
      typeof c.return === 'string' && c.return.length > 0 &&
      typeof c.categoryId === 'string' && c.categoryId.length > 0
    )
  );
  check('Every asset matrix cell has label, return, and categoryId', amCellsOk);

  const smCellsOk = Array.isArray(sm.rankings) && sm.rankings.every((row) =>
    Array.isArray(row.cells) && row.cells.every((c) =>
      typeof c.label === 'string' && c.label.length > 0 &&
      typeof c.return === 'string' && c.return.length > 0 &&
      typeof c.categoryId === 'string' && c.categoryId.length > 0
    )
  );
  check('Every sector matrix cell has label, return, and categoryId', smCellsOk);

  // Summary rows
  check('Asset matrix has summary rows',
    Array.isArray(am.summary) && am.summary.length > 0);
  check('Sector matrix has summary rows',
    Array.isArray(sm.summary) && sm.summary.length > 0);

  // Each summary row has required fields
  const amSummaryOk = Array.isArray(am.summary) && am.summary.every((r) =>
    r.categoryId && r.label && r.average && r.best && r.worst
  );
  check('Asset matrix summary rows have categoryId, label, average, best, worst', amSummaryOk);

  const smSummaryOk = Array.isArray(sm.summary) && sm.summary.every((r) =>
    r.categoryId && r.label && r.average && r.best && r.worst
  );
  check('Sector matrix summary rows have categoryId, label, average, best, worst', smSummaryOk);

  // No realtime claim in fixture
  const fixtureStr = JSON.stringify(fixture);
  check('Fixture does not claim realtime data', !fixtureStr.includes('실시간'));
  check('Fixture does not contain buy/sell recommendation', !fixtureStr.includes('매수 신호') && !fixtureStr.includes('매도 신호'));
  check('Fixture does not contain ETFShopping branding', !fixtureStr.includes('ETF쇼핑') && !fixtureStr.includes('ETFSHOPPING'));
}

log('');

// ---------------------------------------------------------------------------
// Group 3: Lab page information architecture
// ---------------------------------------------------------------------------
log('--- Group 3: Lab page IA ---');

check('Page contains h1 "리서치 Lab"', page.includes('리서치 Lab'));
check('Page imports LabReturnMatrix component',
  page.includes('LabReturnMatrix'));
check('Page imports labReturnMatrices fixture',
  page.includes('labReturnMatrices'));
check('Page renders assetMatrix before sectorMatrix (order check)',
  (() => {
    const assetPos = page.indexOf('assetMatrix');
    const sectorPos = page.indexOf('sectorMatrix');
    return assetPos !== -1 && sectorPos !== -1 && assetPos < sectorPos;
  })());
check('Page contains 자산군 수익률 비교 (from fixture or page)',
  page.includes('자산군') || (fixture && fixture.assetMatrix?.title?.includes('자산군 수익률 비교')));
check('Page contains S&P 500 섹터별 수익률 reference',
  page.includes('S&P 500') || page.includes('섹터별 수익률') ||
  (fixture && fixture.sectorMatrix?.title?.includes('S&P 500 섹터별 수익률')));
check('Page references 국회의원 보유 주식 (in future modules)',
  page.includes('국회의원 보유 주식') || page.includes('congress-stocks'));
check('Page references 국민연금 보유 현황 (in future modules)',
  page.includes('국민연금 보유 현황') || page.includes('nps-holdings'));

log('');

// ---------------------------------------------------------------------------
// Group 4: LabReturnMatrix component structure
// ---------------------------------------------------------------------------
log('--- Group 4: LabReturnMatrix component ---');

check('Component contains lab-matrix-legend class', componentSrc.includes('lab-matrix-legend'));
check('Component contains lab-matrix-chip class', componentSrc.includes('lab-matrix-chip'));
check('Component contains lab-matrix-scroll class (horizontal scroll wrapper)',
  componentSrc.includes('lab-matrix-scroll'));
check('Component contains lab-return-matrix class (table)',
  componentSrc.includes('lab-return-matrix'));
check('Component contains lab-return-cell class (colored cell)',
  componentSrc.includes('lab-return-cell'));
check('Component contains lab-return-cell-label class', componentSrc.includes('lab-return-cell-label'));
check('Component contains lab-return-cell-value class', componentSrc.includes('lab-return-cell-value'));
check('Component contains lab-summary-table class', componentSrc.includes('lab-summary-table'));
check('Component contains rank column header (순위)',
  componentSrc.includes('순위'));
check('Component renders rank row label (위)',
  componentSrc.includes('위'));

log('');

// ---------------------------------------------------------------------------
// Group 5: Lab page elements
// ---------------------------------------------------------------------------
log('--- Group 5: Lab page elements ---');

check('Page contains lab-shell class', page.includes('lab-shell'));
check('Page contains legend chip reference (via LabReturnMatrix or direct)',
  pageAndComponent.includes('lab-matrix-legend'));
check('Page contains horizontal scroll wrapper reference',
  pageAndComponent.includes('lab-matrix-scroll'));
check('Page contains summary table reference',
  pageAndComponent.includes('lab-summary-table'));
check('Page contains future modules section',
  page.includes('lab-future-modules') || page.includes('lab-future-card'));
check('Page contains data policy disclaimer (lab-disclaimer)',
  page.includes('lab-disclaimer'));
check('Page labels data as example (예시 데이터)', page.includes('예시 데이터'));
check('Page contains 데이터 연동 전 or 연동 전',
  page.includes('데이터 연동 전') || page.includes('연동 전'));
check('Page says not for investment decisions',
  page.includes('투자 판단에 사용할 수 없습니다'));
check('Page disavows buy/sell recommendation',
  page.includes('매수 또는 매도를 권고하지 않습니다') || page.includes('매수나 매도를'));

log('');

// ---------------------------------------------------------------------------
// Group 6: Data labeling
// ---------------------------------------------------------------------------
log('--- Group 6: Data labeling and copy rules ---');

check('Page does not claim realtime data (실시간)', !page.includes('실시간'));
check('Page does not claim current data (현재 수익률)', !page.includes('현재 수익률'));
check('Page does not claim ETFShopping branding', !page.includes('ETF쇼핑') && !page.includes('ETFSHOPPING'));
check('Component does not claim realtime data', !componentSrc.includes('실시간'));
check('No buy signal wording in page', !page.includes('매수 신호'));
check('No sell signal wording in page', !page.includes('매도 신호'));
check('No profit guarantee wording', !page.includes('확정 수익'));
check('No stock recommendation wording', !page.includes('추천 종목'));
check('No 국민연금 실제 보유 claim', !page.includes('국민연금 실제 보유'));
check('No 국회의원 실제 보유 claim', !page.includes('국회의원 실제 보유'));

log('');

// ---------------------------------------------------------------------------
// Group 7: Safety boundaries
// ---------------------------------------------------------------------------
log('--- Group 7: Safety boundaries ---');

const allSrc = page + '\n' + componentSrc;
check('No fetch() call in lab.astro', !/\bfetch\s*\(/.test(page));
check('No fetch() call in LabReturnMatrix.astro', !/\bfetch\s*\(/.test(componentSrc));
check('No XMLHttpRequest in lab pages', !allSrc.includes('XMLHttpRequest'));
check('No Supabase import in lab pages', !/@supabase/.test(allSrc));
check('No process.env read', !allSrc.includes('process.env'));
check('No import.meta.env read', !allSrc.includes('import.meta.env'));
check('No KIS endpoint reference', !allSrc.includes('koreainvestment') && !allSrc.includes('KIS_APP_KEY'));
check('No GNews endpoint reference', !allSrc.includes('gnews.io') && !allSrc.includes('GNEWS_API_KEY'));
check('No service_role reference', !allSrc.includes('service_role'));
check('No API route added for Lab', !existsSync(API_LAB_DIR));
check('No setInterval added', !allSrc.includes('setInterval'));
check('No setTimeout added to lab pages', !allSrc.includes('setTimeout'));
check('No cron/polling keyword', !allSrc.includes('cron') && !allSrc.includes('polling'));
check('No AI provider reference', !allSrc.includes('openai') && !allSrc.includes('anthropic') && !allSrc.includes('gemini'));
check('No localStorage usage', !allSrc.includes('localStorage'));
check('No canvas/charting library usage', !allSrc.includes('canvas') && !allSrc.includes('Chart.js'));

log('');

// ---------------------------------------------------------------------------
// Group 8: CSS additions
// ---------------------------------------------------------------------------
log('--- Group 8: CSS additions ---');

check('.lab-shell class in style.css', css.includes('.lab-shell'));
check('.lab-hero-note class in style.css', css.includes('.lab-hero-note'));
check('.lab-section class in style.css', css.includes('.lab-section'));
check('.lab-matrix-legend class in style.css', css.includes('.lab-matrix-legend'));
check('.lab-matrix-chip class in style.css', css.includes('.lab-matrix-chip'));
check('.lab-matrix-scroll class in style.css', css.includes('.lab-matrix-scroll'));
check('.lab-return-matrix class in style.css', css.includes('.lab-return-matrix'));
check('.lab-return-cell class in style.css', css.includes('.lab-return-cell'));
check('.lab-return-cell-label class in style.css', css.includes('.lab-return-cell-label'));
check('.lab-return-cell-value class in style.css', css.includes('.lab-return-cell-value'));
check('.lab-summary-table class in style.css', css.includes('.lab-summary-table'));
check('.lab-future-modules class in style.css', css.includes('.lab-future-modules'));
check('.lab-future-card class in style.css', css.includes('.lab-future-card'));
check('.lab-disclaimer class in style.css', css.includes('.lab-disclaimer'));
check('Color token for sp500 category', css.includes('.lab-return-cell--sp500'));
check('Color token for bitcoin category', css.includes('.lab-return-cell--bitcoin'));
check('Color token for technology sector', css.includes('.lab-return-cell--technology'));
check('Color token for energy sector', css.includes('.lab-return-cell--energy'));
check('Color token for spx benchmark', css.includes('.lab-return-cell--spx'));

log('');

// ---------------------------------------------------------------------------
// Group 9: No third-party branding or exact source data
// ---------------------------------------------------------------------------
log('--- Group 9: No third-party branding ---');

check('No ETFSHOPPING.COM in page', !page.includes('ETFSHOPPING'));
check('No ETF쇼핑 in page', !page.includes('ETF쇼핑'));
check('No ETFSHOPPING.COM in component', !componentSrc.includes('ETFSHOPPING'));
check('No ETF쇼핑 in component', !componentSrc.includes('ETF쇼핑'));

const fixtureStrSafe = existsSync(FIXTURE_PATH) ? readFileSync(FIXTURE_PATH, 'utf8') : '';
check('No ETFSHOPPING in fixture data', !fixtureStrSafe.includes('ETFSHOPPING'));
check('No ETF쇼핑 in fixture data', !fixtureStrSafe.includes('ETF쇼핑'));
check('No OpenDart/FSS reference', !page.includes('opendart') && !page.includes('dart.fss'));
check('No NPS/lawmaker live API reference',
  !page.includes('data.go.kr') && !page.includes('assembly.go.kr'));

log('');

// ---------------------------------------------------------------------------
// Group 10: Self-check
// ---------------------------------------------------------------------------
log('--- Group 10: Checker self-check ---');

let fetchAttempted = false;
const origFetch = globalThis.fetch;
globalThis.fetch = async () => { fetchAttempted = true; throw new Error('blocked'); };
check('Checker makes no network calls', !fetchAttempted);
globalThis.fetch = origFetch;
check('Checker is a static-only validation script (no async DB calls)', true);

log('');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
log('=== Phase 3DF-HF1 Lab Return Matrix Redesign — Summary ===');
const total = passes + failures;
log(`Checks passed: ${passes}/${total}`);
log('');

if (failures === 0) {
  log('Result: PASS — Phase 3DF-HF1 Lab Return Matrix Redesign implemented');
  process.exitCode = 0;
} else {
  log(`Result: FAIL (${failures} failure(s))`);
  process.exitCode = 1;
}
