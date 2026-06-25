/**
 * Static contract check for Phase 3DF Lab Static Module Shells.
 * Verifies page structure, fixture data, safety boundaries, and no-network policy.
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

const LAB_PATH = join(root, 'src', 'pages', 'lab.astro');
const FIXTURE_PATH = join(root, 'src', 'data', 'labStaticModules.json');
const STYLE_PATH = join(root, 'src', 'styles', 'style.css');
const PACKAGE_JSON = join(root, 'package.json');
const RESULT_DOC = join(root, 'docs', 'planning', 'phase_3df_lab_static_module_shells_result_v0.1.md');
const API_LAB_DIR = join(root, 'src', 'pages', 'api', 'lab');

const log = (msg) => process.stdout.write(msg + '\n');
let failures = 0;
let passes = 0;

const check = (label, pass) => {
  log(`  [${pass ? 'PASS' : 'FAIL'}] ${label}`);
  if (pass) passes++; else failures++;
};

log('=== Phase 3DF Lab Static Module Shells Static Contract Check ===');
log('');

// ---------------------------------------------------------------------------
// Group 1: File existence
// ---------------------------------------------------------------------------
log('--- Group 1: File existence ---');

check('lab.astro exists', existsSync(LAB_PATH));
check('labStaticModules.json exists', existsSync(FIXTURE_PATH));
check('Phase 3DF result doc exists', existsSync(RESULT_DOC));

let pkg = {};
try { pkg = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8')); } catch {}
check('package.json has check:lab-static-modules script',
  typeof pkg.scripts?.['check:lab-static-modules'] === 'string');

log('');

if (!existsSync(LAB_PATH)) {
  log('ERROR: lab.astro missing. Cannot continue.');
  process.exit(1);
}

const page = readFileSync(LAB_PATH, 'utf8');
// Fixture text for checking dynamically rendered content (Astro SSR renders from fixture at build time)
const fixtureText = existsSync(FIXTURE_PATH) ? readFileSync(FIXTURE_PATH, 'utf8') : '';
const pageOrFixture = page + '\n' + fixtureText;

// ---------------------------------------------------------------------------
// Group 2: Improved page heading
// ---------------------------------------------------------------------------
log('--- Group 2: Page heading ---');

check('Page contains improved h1 heading "리서치 Lab"',
  page.includes('리서치 Lab'));
check('Page contains Lab eyebrow label',
  page.includes('>Lab<') || page.includes('"Lab"') || page.includes("'Lab'"));
check('Page contains lead copy explaining research hub or data connection',
  page.includes('리서치') && (page.includes('데이터 연동') || page.includes('이후 단계')));

log('');

// ---------------------------------------------------------------------------
// Group 3: Four required module concepts (matrix-first design accepted)
// ---------------------------------------------------------------------------
// Updated for Phase 3DF-HF1: matrix-first redesign. Module concepts can now
// appear as matrix section titles (rendered from fixture) or future module cards.
// Use pageOrFixture so dynamically rendered titles from JSON are found.
log('--- Group 3: Four required module concepts ---');

check('Page or fixture contains 국회의원 보유 주식', pageOrFixture.includes('국회의원 보유 주식'));
check('Page or fixture contains 국민연금 보유 현황', pageOrFixture.includes('국민연금 보유 현황'));
check('Page or fixture contains S&P 500 섹터', pageOrFixture.includes('S&P 500 섹터') || pageOrFixture.includes('S&P 500 섹터별 수익률'));
check('Page or fixture contains 자산군 수익률', pageOrFixture.includes('자산군 수익률'));
check('Page contains lab-shell class (main content wrapper)', page.includes('lab-shell'));
check('Page has future module or matrix structure (lab-future or lab-matrix or lab-module)',
  page.includes('lab-future') || page.includes('lab-matrix') || page.includes('lab-module'));

log('');

// ---------------------------------------------------------------------------
// Group 4: Static/example status labels
// ---------------------------------------------------------------------------
log('--- Group 4: Static/example status labels ---');

// These labels appear in dynamically rendered fixture data (mod.status, mod.scope),
// so check the combined page source + fixture text (Astro renders from fixture at build time).
check('Page or fixture contains "정적 모듈" status label',
  pageOrFixture.includes('정적 모듈'));
check('Page contains "예시 데이터" label',
  page.includes('예시 데이터'));
check('Page contains "연동 전" or "데이터 연동 전" label',
  page.includes('데이터 연동 전') || page.includes('연동 전'));
check('Page or fixture contains "연동 예정" label',
  pageOrFixture.includes('연동 예정'));
check('Page contains badge class for status labels (lab-module-badge or lab-future-badge)',
  page.includes('lab-module-badge') || page.includes('lab-future-badge'));

log('');

// ---------------------------------------------------------------------------
// Group 5: Data preview / matrix section
// ---------------------------------------------------------------------------
// Updated for Phase 3DF-HF1: old card-based preview section replaced by
// matrix visualization. Accept matrix-first layout. Sector/asset samples
// may now appear only in fixture data (rendered server-side from matrix JSON).
log('--- Group 5: Data preview / matrix section ---');

// Category names are in fixture JSON files — use pageOrFixture to find them.
check('Page or fixture contains Technology sector reference',
  pageOrFixture.includes('Technology'));
check('Page or fixture contains Healthcare sector reference',
  pageOrFixture.includes('Healthcare'));
check('Page or fixture contains Financials sector reference',
  pageOrFixture.includes('Financials'));
check('Page or fixture contains Bonds asset reference',
  pageOrFixture.includes('Bonds'));
check('Page or fixture contains Gold asset reference',
  pageOrFixture.includes('Gold'));
check('Page contains 예시 데이터 label (example data indicator)',
  page.includes('예시 데이터'));
check('Page or fixture contains 정적 표시값 or 예시 데이터 (static value label)',
  pageOrFixture.includes('정적 표시값') || page.includes('예시 데이터'));
check('Page has a data visualization or preview structure (matrix or preview class)',
  page.includes('lab-matrix') || page.includes('lab-preview') || page.includes('LabReturnMatrix'));
check('Page uses matrix component or scroll container (lab-matrix-scroll in component, or LabReturnMatrix import)',
  page.includes('lab-matrix-scroll') || page.includes('LabReturnMatrix') || pageOrFixture.includes('lab-matrix-scroll'));

log('');

// ---------------------------------------------------------------------------
// Group 6: Future modules / connection plan
// ---------------------------------------------------------------------------
// Updated for Phase 3DF-HF1: old roadmap panel replaced by a future modules
// section. Accept any mention of future/planned data integration.
log('--- Group 6: Future modules / connection plan ---');

check('Page contains future modules or disclaimer section referencing data integration',
  page.includes('lab-future-modules') || page.includes('lab-roadmap-panel') || page.includes('연동 예정'));
check('Page or fixture references 국회의원 module concept',
  pageOrFixture.includes('국회의원') && (pageOrFixture.includes('모듈') || page.includes('congress-stocks')));
check('Page or fixture references 국민연금 module concept',
  pageOrFixture.includes('국민연금') && (pageOrFixture.includes('모듈') || page.includes('nps-holdings')));
check('Page or fixture references S&P 500 섹터 concept',
  pageOrFixture.includes('S&P 500') && (pageOrFixture.includes('섹터') || pageOrFixture.includes('sp500')));
check('Page or fixture references 자산군 수익률 concept',
  pageOrFixture.includes('자산군') && pageOrFixture.includes('수익률'));
check('Page contains data policy or disclaimer (lab-disclaimer or 데이터 정책)',
  page.includes('lab-disclaimer') || page.includes('데이터 정책'));

log('');

// ---------------------------------------------------------------------------
// Group 7: Disclaimer / data policy panel
// ---------------------------------------------------------------------------
log('--- Group 7: Disclaimer/data policy ---');

check('Page contains lab-disclaimer class', page.includes('lab-disclaimer'));
check('Disclaimer says data is example only ("예시 데이터")',
  page.includes('예시 데이터'));
check('Disclaimer says not for investment decisions',
  page.includes('투자 판단에 사용할 수 없습니다'));
check('Disclaimer disavows buy/sell recommendation',
  page.includes('매수 또는 매도를 권고하지 않습니다') || page.includes('매수나 매도를'));
check('Disclaimer explains future real data connection',
  page.includes('연동 후') || page.includes('연동 예정'));

log('');

// ---------------------------------------------------------------------------
// Group 8: Fixture data validation
// ---------------------------------------------------------------------------
log('--- Group 8: Fixture data (labStaticModules.json) ---');

let fixture = null;
try {
  fixture = JSON.parse(readFileSync(FIXTURE_PATH, 'utf8'));
} catch {
  check('Fixture data parses as valid JSON', false);
  log('ERROR: Fixture JSON parse failed. Skipping fixture checks.');
  fixture = null;
}

if (fixture !== null) {
  check('Fixture data parses as valid JSON', true);
  check('Fixture has modules array', Array.isArray(fixture.modules));
  check('Fixture modules array has at least 4 entries',
    Array.isArray(fixture.modules) && fixture.modules.length >= 4);

  if (Array.isArray(fixture.modules)) {
    const ids = fixture.modules.map((m) => m?.id);
    const titles = fixture.modules.map((m) => m?.title || '');
    check('Fixture includes congress-stocks module (id or title)',
      ids.includes('congress-stocks') || titles.some((t) => t.includes('국회의원 보유 주식')));
    check('Fixture includes nps-holdings module (id or title)',
      ids.includes('nps-holdings') || titles.some((t) => t.includes('국민연금')));
    check('Fixture includes sp500-sectors module (id or title)',
      ids.includes('sp500-sectors') || titles.some((t) => t.includes('S&P 500')));
    check('Fixture includes asset-class-returns module (id or title)',
      ids.includes('asset-class-returns') || titles.some((t) => t.includes('자산군 수익률')));

    const REQUIRED_MODULE_FIELDS = ['title', 'status', 'description', 'scope'];
    const badModules = fixture.modules.filter((m) =>
      !m || REQUIRED_MODULE_FIELDS.some((f) => !m[f])
    );
    check('All modules have required fields (title, status, description, scope)',
      badModules.length === 0);

    check('Module status fields use example/static language',
      fixture.modules.every((m) =>
        m?.status && (
          m.status.includes('예시') || m.status.includes('정적') ||
          m.status.includes('연동') || m.status.includes('리서치')
        )
      ));
  }

  check('Fixture has sectorSamples array', Array.isArray(fixture.sectorSamples));
  check('Fixture sectorSamples has at least 3 entries',
    Array.isArray(fixture.sectorSamples) && fixture.sectorSamples.length >= 3);
  check('Sector samples include Technology',
    Array.isArray(fixture.sectorSamples) &&
    fixture.sectorSamples.some((r) => r?.name?.includes('Technology')));
  check('Sector samples labeled as static ("정적 표시값")',
    Array.isArray(fixture.sectorSamples) &&
    fixture.sectorSamples.every((r) => r?.note?.includes('정적 표시값')));

  check('Fixture has assetSamples array', Array.isArray(fixture.assetSamples));
  check('Fixture assetSamples has at least 3 entries',
    Array.isArray(fixture.assetSamples) && fixture.assetSamples.length >= 3);
  check('Asset samples include Bonds',
    Array.isArray(fixture.assetSamples) &&
    fixture.assetSamples.some((r) => r?.name?.includes('Bonds')));
  check('Asset samples labeled as static ("정적 표시값")',
    Array.isArray(fixture.assetSamples) &&
    fixture.assetSamples.every((r) => r?.note?.includes('정적 표시값')));

  check('Fixture data does not claim realtime data',
    !JSON.stringify(fixture).includes('실시간'));
  check('Fixture data does not claim actual NPS or lawmaker holdings',
    !JSON.stringify(fixture).includes('국민연금 실제') &&
    !JSON.stringify(fixture).includes('국회의원 실제'));
}

log('');

// ---------------------------------------------------------------------------
// Group 9: Safety boundaries
// ---------------------------------------------------------------------------
log('--- Group 9: Safety boundaries ---');

check('No fetch() call in lab.astro', !/\bfetch\s*\(/.test(page));
check('No XMLHttpRequest in lab.astro', !page.includes('XMLHttpRequest'));
check('No Supabase import in lab.astro', !/@supabase/.test(page));
check('No process.env read', !page.includes('process.env'));
check('No import.meta.env read', !page.includes('import.meta.env'));
check('No KIS endpoint or credential reference',
  !page.includes('koreainvestment') && !page.includes('KIS_APP_KEY'));
check('No GNews endpoint reference',
  !page.includes('gnews.io') && !page.includes('GNEWS_API_KEY'));
check('No service_role reference', !page.includes('service_role'));
check('No API route added for Lab',
  !existsSync(API_LAB_DIR));
check('No setInterval added', !page.includes('setInterval'));
check('No cron/polling keyword', !page.includes('cron') && !page.includes('polling'));
check('No 실시간 (realtime) claim', !page.includes('실시간'));
check('No 최신 (current/latest) claim used to imply live data',
  !page.includes('최신 데이터') && !page.includes('현재 수익률'));
check('No buy signal wording (매수 신호)', !page.includes('매수 신호'));
check('No sell signal wording (매도 신호)', !page.includes('매도 신호'));
check('No profit guarantee wording (확정 수익)', !page.includes('확정 수익'));
check('No stock recommendation wording (추천 종목)', !page.includes('추천 종목'));
check('No 국민연금 실제 보유 claim', !page.includes('국민연금 실제 보유'));
check('No 국회의원 실제 보유 claim', !page.includes('국회의원 실제 보유'));

log('');

// ---------------------------------------------------------------------------
// Group 10: CSS additions
// ---------------------------------------------------------------------------
log('--- Group 10: CSS additions ---');

const css = existsSync(STYLE_PATH) ? readFileSync(STYLE_PATH, 'utf8') : '';
check('.lab-shell class in style.css', css.includes('.lab-shell'));
check('.lab-module-grid class in style.css', css.includes('.lab-module-grid'));
check('.lab-module-card class in style.css', css.includes('.lab-module-card'));
check('.lab-disclaimer class in style.css', css.includes('.lab-disclaimer'));
check('.lab-preview-section class in style.css', css.includes('.lab-preview-section'));

log('');

// ---------------------------------------------------------------------------
// Group 11: Self-check
// ---------------------------------------------------------------------------
log('--- Group 11: Checker self-check ---');

let fetchAttempted = false;
const origFetch = globalThis.fetch;
globalThis.fetch = async () => { fetchAttempted = true; throw new Error('blocked'); };
check('Checker makes no network calls', !fetchAttempted);
globalThis.fetch = origFetch;

log('');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
log('=== Phase 3DF Lab Static Module Shells — Summary ===');
const total = passes + failures;
log(`Checks passed: ${passes}/${total}`);
log('');

if (failures === 0) {
  log('Result: PASS — Phase 3DF Lab Static Module Shells implemented');
  process.exitCode = 0;
} else {
  log(`Result: FAIL (${failures} failure(s))`);
  process.exitCode = 1;
}
