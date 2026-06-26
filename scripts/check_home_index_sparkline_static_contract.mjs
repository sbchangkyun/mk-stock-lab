/**
 * Static contract check for Phase 3CB-HF2 Home Market Snapshot Sparkline Cards.
 * Verifies fixture trend arrays, SVG sparkline markup, CSS classes, and safety constraints.
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

const FIXTURE_PATH = join(root, 'src', 'data', 'homeIndexCards.json');
const COMPONENT_PATH = join(root, 'src', 'components', 'HomeIndexCards.astro');
const STYLE_PATH = join(root, 'src', 'styles', 'style.css');
const PACKAGE_JSON = join(root, 'package.json');
const RESULT_DOC = join(root, 'docs', 'planning', 'phase_3cb_hf2_home_market_snapshot_sparkline_result_v0.1.md');

const log = (msg) => process.stdout.write(msg + '\n');
let failures = 0;
let passes = 0;

const check = (label, pass) => {
  log(`  [${pass ? 'PASS' : 'FAIL'}] ${label}`);
  if (pass) passes++; else failures++;
};

log('=== Phase 3CB-HF2 Home Index Sparkline Static Contract Check ===');
log('');

// ---------------------------------------------------------------------------
// Group 1: File existence
// ---------------------------------------------------------------------------
log('--- Group 1: File existence ---');

check('homeIndexCards.json fixture file exists', existsSync(FIXTURE_PATH));
check('HomeIndexCards.astro component exists', existsSync(COMPONENT_PATH));
check('style.css exists', existsSync(STYLE_PATH));
check('Phase 3CB-HF2 result doc exists', existsSync(RESULT_DOC));

let pkg = {};
try { pkg = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8')); } catch {}
check('package.json has check:home-index-sparkline script',
  typeof pkg.scripts?.['check:home-index-sparkline'] === 'string');
log('');

if (!existsSync(FIXTURE_PATH)) {
  log('ERROR: homeIndexCards.json missing. Cannot continue.');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Group 2: Fixture trend arrays
// ---------------------------------------------------------------------------
log('--- Group 2: Fixture trend arrays ---');

let cards = [];
try {
  cards = JSON.parse(readFileSync(FIXTURE_PATH, 'utf8'));
} catch {
  check('homeIndexCards.json parses as valid JSON', false);
  process.exitCode = 1;
  process.exit();
}

check('homeIndexCards.json parses as valid JSON', true);
check('Fixture is an array', Array.isArray(cards));
check('Fixture has 9 cards', cards.length === 9);

const allHaveTrend = cards.every((c) => Object.prototype.hasOwnProperty.call(c, 'trend'));
check('Every card has a trend field', allHaveTrend);

const allTrendsAreArrays = cards.every((c) => Array.isArray(c.trend));
check('Every trend field is an array', allTrendsAreArrays);

const allTrendsHaveSixPoints = cards.every((c) => Array.isArray(c.trend) && c.trend.length >= 6);
check('Every trend array has at least 6 points', allTrendsHaveSixPoints);

const allTrendPointsAreNumeric = cards.every((c) =>
  Array.isArray(c.trend) && c.trend.every((v) => typeof v === 'number' && isFinite(v))
);
check('All trend values are finite numbers', allTrendPointsAreNumeric);

const upCards = cards.filter((c) => c.direction === 'up');
const allUpTrendsRise = upCards.every((c) =>
  Array.isArray(c.trend) && c.trend.length >= 2 && c.trend[c.trend.length - 1] > c.trend[0]
);
check('Up-direction cards have rising trend (last > first)', allUpTrendsRise);

const downCards = cards.filter((c) => c.direction === 'down');
const allDownTrendsFall = downCards.every((c) =>
  Array.isArray(c.trend) && c.trend.length >= 2 && c.trend[c.trend.length - 1] < c.trend[0]
);
check('Down-direction cards have falling trend (last < first)', allDownTrendsFall);

const fixtureText = JSON.stringify(cards);
const hasFixtureLabel = fixtureText.includes('예시 데이터');
check('Fixture cards still carry 예시 데이터 label', hasFixtureLabel);

const hasLiveClaim = ['실시간', '현재 시세', '최신 시세', 'Real-time', 'Live data'].some(
  (p) => fixtureText.includes(p)
);
check('Fixture does not claim live/realtime data', !hasLiveClaim);
log('');

// ---------------------------------------------------------------------------
// Group 3: Component SVG sparkline markup
// ---------------------------------------------------------------------------
log('--- Group 3: Component SVG sparkline markup ---');

if (!existsSync(COMPONENT_PATH)) {
  check('HomeIndexCards.astro readable', false);
} else {
  const comp = readFileSync(COMPONENT_PATH, 'utf8');

  check('Component contains <svg element', comp.includes('<svg'));
  check('Component contains <polyline element', comp.includes('<polyline'));
  check('Component contains viewBox attribute', comp.includes('viewBox'));
  check('Component contains computePoints function', comp.includes('computePoints'));
  check('Component references item.trend', comp.includes('item.trend'));
  check('Component contains index-card-sparkline class', comp.includes('index-card-sparkline'));
  check('Component contains index-card-sparkline-svg class', comp.includes('index-card-sparkline-svg'));
  check('Component contains index-card-sparkline-line class', comp.includes('index-card-sparkline-line'));
  check('Component contains sparkline direction class (index-card-sparkline--)', comp.includes('index-card-sparkline--'));
  check('Component contains index-card-main class', comp.includes('index-card-main'));
  check('Component contains aria-hidden on sparkline SVG', comp.includes('aria-hidden'));

  check('Component still renders item.value', comp.includes('item.value'));
  check('Component still renders item.change', comp.includes('item.change'));
  check('Component still renders item.asOfLabel', comp.includes('item.asOfLabel'));
  check('Component still renders item.direction as CSS class', comp.includes('item.direction'));
  check('Component still contains 예시 데이터 disclaimer', comp.includes('예시 데이터'));
  check('Component still has MARKET SNAPSHOT label', comp.includes('MARKET SNAPSHOT'));

  check('No fetch() in component', !comp.includes('fetch('));
  check('No XMLHttpRequest in component', !comp.includes('XMLHttpRequest'));
  check('No localStorage in component', !comp.includes('localStorage'));
  check('No sessionStorage in component', !comp.includes('sessionStorage'));
  check('No setInterval in component', !comp.includes('setInterval'));
  check('No setTimeout in component', !comp.includes('setTimeout'));
  check('No Chart.js in component', !comp.toLowerCase().includes('chart.js'));
  check('No canvas element in component', !comp.includes('<canvas'));
  check('No Supabase import in component', !comp.includes('supabase'));
  check('No KIS endpoint in component', !comp.includes('koreainvestment') && !comp.includes('KIS_APP_KEY'));
  check('No GNews endpoint in component', !comp.includes('gnews.io'));
}
log('');

// ---------------------------------------------------------------------------
// Group 4: CSS sparkline classes
// ---------------------------------------------------------------------------
log('--- Group 4: CSS sparkline classes ---');

if (!existsSync(STYLE_PATH)) {
  check('style.css readable', false);
} else {
  const css = readFileSync(STYLE_PATH, 'utf8');

  check('.index-card-sparkline class defined', css.includes('.index-card-sparkline'));
  check('.index-card-sparkline-svg class defined', css.includes('.index-card-sparkline-svg'));
  check('.index-card-sparkline-line class defined', css.includes('.index-card-sparkline-line'));
  check('.index-card-sparkline--up defined', css.includes('.index-card-sparkline--up'));
  check('.index-card-sparkline--down defined', css.includes('.index-card-sparkline--down'));
  check('.index-card-sparkline--flat defined', css.includes('.index-card-sparkline--flat'));
  check('.index-card-main class defined', css.includes('.index-card-main'));

  check('Sparkline up uses positive stroke', css.includes('index-card-sparkline--up') && css.includes('var(--positive)'));
  check('Sparkline down uses negative stroke', css.includes('index-card-sparkline--down') && css.includes('var(--negative)'));

  check('Existing .index-card class still defined (no regression)', css.includes('.index-card {') || css.includes('.index-card\n'));
  check('Existing .index-card--up still defined (no regression)', css.includes('.index-card--up'));
  check('Existing .index-card--down still defined (no regression)', css.includes('.index-card--down'));
  check('Existing .index-card--flat still defined (no regression)', css.includes('.index-card--flat'));
  check('Existing .index-card-value still defined (no regression)', css.includes('.index-card-value'));
  check('Existing .index-card-change still defined (no regression)', css.includes('.index-card-change'));
}
log('');

// ---------------------------------------------------------------------------
// Group 5: Safety boundaries (no chart library, canvas, or live data)
// ---------------------------------------------------------------------------
log('--- Group 5: Safety boundaries ---');

if (existsSync(COMPONENT_PATH)) {
  const comp = readFileSync(COMPONENT_PATH, 'utf8');
  check('No canvas in component', !comp.includes('canvas'));
  check('No Chart.js import in component', !comp.includes("from 'chart.js'") && !comp.includes('from "chart.js"'));
  check('No d3 import in component', !comp.includes("from 'd3") && !comp.includes('from "d3'));
  check('No recharts in component', !comp.includes('recharts'));
  check('No process.env in component', !comp.includes('process.env.'));
  check('No import.meta.env in component', !comp.includes('import.meta.env.'));
}
log('');

// ---------------------------------------------------------------------------
// Group 6: Checker network safety (self-check)
// ---------------------------------------------------------------------------
log('--- Group 6: Checker self-check ---');

let fetchAttempted = false;
const origFetch = globalThis.fetch;
globalThis.fetch = async () => { fetchAttempted = true; throw new Error('blocked'); };
check('Checker makes no network calls during execution', !fetchAttempted);
globalThis.fetch = origFetch;
log('');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
log('=== Phase 3CB-HF2 Home Index Sparkline — Summary ===');
const total = passes + failures;
log(`Checks passed: ${passes}/${total}`);
log('');

if (failures === 0) {
  log('Result: PASS — Home market snapshot sparkline contract verified');
  process.exitCode = 0;
} else {
  log(`Result: FAIL (${failures} failure(s))`);
  process.exitCode = 1;
}
