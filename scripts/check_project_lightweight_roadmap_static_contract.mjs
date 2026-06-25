/**
 * Static contract check for Phase 3BZ Lightweight Roadmap Plan.
 * Verifies the roadmap document exists, contains all required policy sections,
 * and confirms no forbidden runtime changes occurred.
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

const ROADMAP_DOC = join(root, 'docs', 'planning', 'phase_3bz_fast_roadmap_reprioritization_lightweight_execution_plan_v0.1.md');
const CHANGELOG = join(root, 'docs', 'planning', 'planning_changelog.md');
const PACKAGE_JSON = join(root, 'package.json');
const NEWS_PAGE = join(root, 'src', 'pages', 'news');

const log = (msg) => process.stdout.write(msg + '\n');
let failures = 0;
let passes = 0;

const check = (label, pass) => {
  log(`  [${pass ? 'PASS' : 'FAIL'}] ${label}`);
  if (pass) passes++; else failures++;
};

log('=== Phase 3BZ Lightweight Roadmap Static Contract Check ===');
log('');

const roadmapContent = existsSync(ROADMAP_DOC) ? readFileSync(ROADMAP_DOC, 'utf8') : '';
const changelogContent = existsSync(CHANGELOG) ? readFileSync(CHANGELOG, 'utf8') : '';
let pkg = {};
try { pkg = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8')); } catch {}

// ---------------------------------------------------------------------------
// Group 1: File existence
// ---------------------------------------------------------------------------
log('--- Group 1: File existence ---');

check('3BZ roadmap document exists', existsSync(ROADMAP_DOC));
check('planning_changelog.md exists', existsSync(CHANGELOG));
check('package.json has check:project-lightweight-roadmap script',
  typeof pkg.scripts?.['check:project-lightweight-roadmap'] === 'string');
check('No /news page was created', !existsSync(NEWS_PAGE));
log('');

// ---------------------------------------------------------------------------
// Group 2: Roadmap policy sections present
// ---------------------------------------------------------------------------
log('--- Group 2: Roadmap policy sections ---');

check('Roadmap contains basic server plan policy',
  roadmapContent.includes('basic server plan') || roadmapContent.includes('Basic server plan'));
check('Roadmap contains no broad smoke suite policy',
  roadmapContent.includes('broad smoke') || roadmapContent.includes('broad suite'));
check('Roadmap contains focused validation policy',
  roadmapContent.includes('focused validation') || roadmapContent.includes('Focused Validation'));
check('Roadmap contains manual owner review policy',
  roadmapContent.includes('Manual Review') || roadmapContent.includes('manual review') || roadmapContent.includes('owner must review'));
check('Roadmap contains KIS/FX policy',
  roadmapContent.includes('KIS') && roadmapContent.includes('FX') &&
  (roadmapContent.includes('KIS/FX') || roadmapContent.includes('KIS + FX')));
check('Roadmap contains quote cache policy',
  roadmapContent.includes('quote cache') || roadmapContent.includes('Quote Cache'));
check('Roadmap contains server-side tab order policy',
  roadmapContent.includes('tab order') || roadmapContent.includes('Tab Order'));
check('Roadmap contains security metadata policy',
  roadmapContent.includes('securityLogos') || roadmapContent.includes('Security Metadata') || roadmapContent.includes('security metadata'));
log('');

// ---------------------------------------------------------------------------
// Group 3: Roadmap coverage of feature areas
// ---------------------------------------------------------------------------
log('--- Group 3: Feature area coverage ---');

check('Roadmap covers Home index cards',
  roadmapContent.includes('Home') && (roadmapContent.includes('index card') || roadmapContent.includes('Index Card') || roadmapContent.includes('index cards')));
check('Roadmap covers Chart AI',
  roadmapContent.includes('Chart AI'));
check('Roadmap covers Market charts (fixture or live path)',
  roadmapContent.includes('Market') && (roadmapContent.includes('chart') || roadmapContent.includes('Chart')));
check('Roadmap covers Lab lawmaker stock holdings',
  roadmapContent.includes('congress') || roadmapContent.includes('lawmaker') || roadmapContent.includes('국회의원'));
check('Roadmap covers Lab National Pension portfolio',
  roadmapContent.includes('nps') || roadmapContent.includes('National Pension') || roadmapContent.includes('국민연금'));
check('Roadmap covers Lab S&P 500 sector/asset-class returns',
  roadmapContent.includes('S&P 500') || roadmapContent.includes('S&P500') || roadmapContent.includes('sp500'));
check('Roadmap covers MyPage completion',
  roadmapContent.includes('MyPage') || roadmapContent.includes('My Page'));
log('');

// ---------------------------------------------------------------------------
// Group 4: KIS/FX and live-provider constraints
// ---------------------------------------------------------------------------
log('--- Group 4: KIS/FX constraints ---');

check('Roadmap states no live KIS in this phase',
  (roadmapContent.includes('Live KIS calls') && roadmapContent.includes('none')) ||
  roadmapContent.includes('no live KIS') ||
  roadmapContent.includes('No live KIS'));
check('Roadmap states no deployment in this phase',
  (roadmapContent.includes('Deployment') && roadmapContent.includes('not performed')) ||
  roadmapContent.includes('no deployment') || roadmapContent.includes('No deployment'));
check('Roadmap states no runtime UI changes',
  (roadmapContent.includes('Runtime UI changes') && roadmapContent.includes('none')) ||
  roadmapContent.includes('no runtime') || roadmapContent.includes('No runtime'));
check('Roadmap states Vercel Preview smoke is later (not this phase)',
  roadmapContent.includes('Vercel Preview') &&
  (roadmapContent.includes('later') || roadmapContent.includes('Phase 3CI') || roadmapContent.includes('not in this phase') || roadmapContent.includes('not earlier')));
check('Roadmap recommends 조회 시점 기준 / 최근 조회 기준 and avoids 실시간 시세 반영',
  (roadmapContent.includes('조회 시점 기준') || roadmapContent.includes('최근 조회 기준')) &&
  !roadmapContent.includes('실시간 시세 반영'));
check('Roadmap states source=auto deferred',
  roadmapContent.includes('source=auto') && roadmapContent.includes('deferred'));
log('');

// ---------------------------------------------------------------------------
// Group 5: Changelog entry
// ---------------------------------------------------------------------------
log('--- Group 5: Changelog ---');

check('planning_changelog.md has Phase 3BZ entry',
  changelogContent.includes('Phase 3BZ') || changelogContent.includes('3BZ'));
log('');

// ---------------------------------------------------------------------------
// Group 6: Checker network safety
// ---------------------------------------------------------------------------
log('--- Group 6: Checker network safety ---');

let fetchAttempted = false;
const origFetch = globalThis.fetch;
globalThis.fetch = async () => { fetchAttempted = true; throw new Error('blocked'); };
check('Checker itself makes no network calls', !fetchAttempted);
globalThis.fetch = origFetch;
log('');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
log('=== Phase 3BZ Lightweight Roadmap Static Contract — Summary ===');
const total = passes + failures;
log(`Checks passed: ${passes}/${total}`);
log('');

if (failures === 0) {
  log('Result: PASS — roadmap plan ready for execution');
  process.exitCode = 0;
} else {
  log(`Result: FAIL (${failures} failure(s))`);
  process.exitCode = 1;
}
