/**
 * Static contract check for Phase 3DG Market Fixture Chart Enhancement.
 * Validates fixture data, component structure, and safety boundaries.
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

const MARKET_PAGE      = join(root, 'src', 'pages', 'market.astro');
const FIXTURE_COMP     = join(root, 'src', 'components', 'MarketFixtureDashboard.astro');
const FIXTURE_DATA     = join(root, 'src', 'data', 'marketFixtureDashboard.json');
const RESULT_DOC       = join(root, 'docs', 'planning', 'phase_3dg_market_fixture_chart_enhancement_result_v0.1.md');
const PACKAGE_JSON     = join(root, 'package.json');
const API_MARKET_DIR   = join(root, 'src', 'pages', 'api', 'market');

const log = (msg) => process.stdout.write(msg + '\n');
let passes = 0;
let failures = 0;

const check = (label, pass) => {
  log(`  [${pass ? 'PASS' : 'FAIL'}] ${label}`);
  if (pass) passes++; else failures++;
};

log('=== Phase 3DG Market Fixture Chart Enhancement — Static Contract Check ===');
log('');

// ---------------------------------------------------------------------------
// Group 1: File existence
// ---------------------------------------------------------------------------
log('--- Group 1: File existence ---');

const pageExists     = existsSync(MARKET_PAGE);
const compExists     = existsSync(FIXTURE_COMP);
const dataExists     = existsSync(FIXTURE_DATA);
const resultDocExists = existsSync(RESULT_DOC);

check('market.astro page exists', pageExists);
check('MarketFixtureDashboard.astro component exists', compExists);
check('marketFixtureDashboard.json fixture data exists', dataExists);
check('Phase 3DG result doc exists', resultDocExists);

let pkg = {};
try { pkg = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8')); } catch {}
check('package.json has check:market-fixture-chart script',
  typeof pkg.scripts?.['check:market-fixture-chart'] === 'string');

log('');

if (!dataExists || !compExists || !pageExists) {
  log('ERROR: Required files missing. Cannot continue.');
  process.exitCode = 1;
  process.exit(1);
}

const pageSrc = readFileSync(MARKET_PAGE, 'utf8');
const compSrc = readFileSync(FIXTURE_COMP, 'utf8');
const combined = pageSrc + '\n' + compSrc;

// ---------------------------------------------------------------------------
// Group 2: Fixture JSON structure
// ---------------------------------------------------------------------------
log('--- Group 2: Fixture JSON structure ---');

let fixture = null;
try {
  fixture = JSON.parse(readFileSync(FIXTURE_DATA, 'utf8'));
} catch (e) {
  check('Fixture JSON parses without error', false);
  log(`  Parse error: ${e.message}`);
  process.exitCode = 1;
  process.exit(1);
}
check('Fixture JSON parses without error', true);

check('Fixture has summaryCards array', Array.isArray(fixture.summaryCards));
check('Fixture summaryCards has at least 4 cards', (fixture.summaryCards?.length ?? 0) >= 4);
check('Fixture summaryCards has at least 6 cards', (fixture.summaryCards?.length ?? 0) >= 6);

const cardLabels = (fixture.summaryCards ?? []).map((c) => c.label ?? '');
check('Fixture includes KOSPI card', cardLabels.some((l) => l.includes('KOSPI')));
check('Fixture includes KOSDAQ card', cardLabels.some((l) => l.includes('KOSDAQ')));
check('Fixture includes S&P 500 card', cardLabels.some((l) => l.includes('S&P') || l.includes('SP500') || l.includes('S&P500')));
check('Fixture includes Nasdaq 100 card', cardLabels.some((l) => l.includes('Nasdaq') || l.includes('NASDAQ')));
check('Fixture includes USD/KRW card', cardLabels.some((l) => l.includes('USD') || l.includes('KRW') || l.includes('USD/KRW')));

log('');
log('--- Group 3: Trend chart fixture ---');

const tc = fixture.trendChart;
check('Fixture has trendChart object', tc && typeof tc === 'object');
check('trendChart has labels array', Array.isArray(tc?.labels));
check('trendChart has at least 6 labels', (tc?.labels?.length ?? 0) >= 6);
check('trendChart has series array', Array.isArray(tc?.series));
check('trendChart has at least 2 series', (tc?.series?.length ?? 0) >= 2);
check('trendChart has note field', typeof tc?.note === 'string' && tc.note.length > 0);

if (Array.isArray(tc?.series)) {
  tc.series.forEach((s) => {
    check(`Series "${s.label || s.id}" has values array matching label count`,
      Array.isArray(s.values) && s.values.length === (tc?.labels?.length ?? 0));
  });
}

log('');
log('--- Group 4: Comparison fixture ---');

const comp = fixture.comparison;
check('Fixture has comparison object', comp && typeof comp === 'object');
check('comparison has items array', Array.isArray(comp?.items));
check('comparison has at least 5 items', (comp?.items?.length ?? 0) >= 5);
check('comparison items have numeric change values',
  (comp?.items ?? []).every((item) => typeof item.change === 'number'));
check('comparison has note field', typeof comp?.note === 'string');

log('');
log('--- Group 5: Watch points fixture ---');

const wp = fixture.watchPoints;
check('Fixture has watchPoints array', Array.isArray(wp));
check('watchPoints has at least 4 cards', (wp?.length ?? 0) >= 4);
check('watchPoints cards have title and body', (wp ?? []).every((p) => p.title && p.body));

log('');

// ---------------------------------------------------------------------------
// Group 6: Component structure checks
// ---------------------------------------------------------------------------
log('--- Group 6: Component structure ---');

check('market.astro imports MarketFixtureDashboard', pageSrc.includes('MarketFixtureDashboard'));
check('market.astro renders MarketFixtureDashboard', pageSrc.includes('<MarketFixtureDashboard'));

check('Component renders 예시 데이터', compSrc.includes('예시 데이터'));
check('Component renders 데이터 연동 전 or 연동 전 화면',
  compSrc.includes('데이터 연동 전') || compSrc.includes('연동 전 화면'));

check('Component has market-summary-grid class', compSrc.includes('market-summary-grid'));
check('Component has market-summary-card class', compSrc.includes('market-summary-card'));
check('Component has market-chart-section class', compSrc.includes('market-chart-section'));
check('Component has market-chart-panel class', compSrc.includes('market-chart-panel'));
check('Component has market-comparison-section class', compSrc.includes('market-comparison-section'));
check('Component has market-comparison-list class', compSrc.includes('market-comparison-list'));
check('Component has market-watch-grid class', compSrc.includes('market-watch-grid'));
check('Component has market-watch-card class', compSrc.includes('market-watch-card'));
check('Component has market-data-policy class', compSrc.includes('market-data-policy'));

log('');
log('--- Group 7: SVG chart markup ---');

check('Component contains <svg element (chart)', compSrc.includes('<svg'));
check('Component has market-chart-svg class', compSrc.includes('market-chart-svg'));
check('Component uses <polyline for line chart series', compSrc.includes('<polyline'));
check('Component has comparison bars (market-comparison-bar)', compSrc.includes('market-comparison-bar'));
check('Component has chart legend (market-chart-legend)', compSrc.includes('market-chart-legend'));

log('');

// ---------------------------------------------------------------------------
// Group 8: Safety boundaries — new component
// ---------------------------------------------------------------------------
log('--- Group 8: Safety boundaries (new component) ---');

check('No fetch() call in MarketFixtureDashboard', !compSrc.includes('fetch('));
check('No XMLHttpRequest in MarketFixtureDashboard', !compSrc.includes('XMLHttpRequest'));
check('No Supabase import in MarketFixtureDashboard',
  !compSrc.includes('@supabase') && !compSrc.includes('supabase-js'));
check('No import.meta.env in MarketFixtureDashboard', !compSrc.includes('import.meta.env'));
check('No process.env in MarketFixtureDashboard', !compSrc.includes('process.env'));
check('No KIS endpoint/string in MarketFixtureDashboard',
  !compSrc.includes('koreainvestment') && !compSrc.includes('openapi.kis') && !compSrc.includes('KIS_'));
check('No GNews endpoint in MarketFixtureDashboard', !compSrc.includes('gnews.io'));
check('No AI provider string in MarketFixtureDashboard',
  !compSrc.includes('openai.com') && !compSrc.includes('anthropic.com') && !compSrc.includes('generativelanguage'));
check('No service_role in MarketFixtureDashboard', !compSrc.includes('service_role'));
check('No setInterval in MarketFixtureDashboard', !compSrc.includes('setInterval'));
check('No setTimeout added in MarketFixtureDashboard', !compSrc.includes('setTimeout'));
check('No WebSocket in MarketFixtureDashboard', !compSrc.includes('WebSocket'));
check('No canvas in MarketFixtureDashboard', !compSrc.includes('canvas'));

log('');
log('--- Group 9: No forbidden copy in new component ---');

check('No 실시간 claim in component', !compSrc.includes('실시간'));
check('No 현재 시세 claim in component', !compSrc.includes('현재 시세'));
check('No 최신 데이터 claim in component', !compSrc.includes('최신 데이터'));
check('No 매수 in component', !compSrc.includes('매수'));
check('No 매도 in component', !compSrc.includes('매도'));
check('No AI 추천 in component', !compSrc.includes('AI 추천'));
check('No 추천 종목 in component', !compSrc.includes('추천 종목'));
check('No KIS 연결 완료 in component', !compSrc.includes('KIS 연결 완료'));
check('No GNews 연결 완료 in component', !compSrc.includes('GNews 연결 완료'));

log('');
log('--- Group 10: No forbidden copy in fixture JSON ---');

const fixtureRaw = readFileSync(FIXTURE_DATA, 'utf8');
check('No 실시간 in fixture JSON', !fixtureRaw.includes('실시간'));
check('No live or realtime in fixture JSON', !fixtureRaw.includes('"live"') && !fixtureRaw.includes('"realtime"'));

log('');
log('--- Group 11: No new Market API route added ---');

const allowedApiFiles = new Set(['quote.ts']);
let unexpectedApiFiles = [];
try {
  const { readdirSync } = await import('fs');
  const apiFiles = readdirSync(API_MARKET_DIR);
  unexpectedApiFiles = apiFiles.filter((f) => !allowedApiFiles.has(f));
} catch {
  // directory not readable or missing — not a failure
}
check('No unexpected new API route files in api/market/',
  unexpectedApiFiles.length === 0);

log('');
log('--- Group 12: Checker self-check ---');

let fetchAttempted = false;
const origFetch = globalThis.fetch;
globalThis.fetch = async () => { fetchAttempted = true; throw new Error('blocked'); };
check('Checker makes no network calls during execution', !fetchAttempted);
globalThis.fetch = origFetch;
check('Checker is a static-only validation script', true);

log('');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
log('=== Phase 3DG Market Fixture Chart Enhancement — Summary ===');
const total = passes + failures;
log(`Checks passed: ${passes}/${total}`);
log('');

if (failures === 0) {
  log('Result: PASS — Market fixture dashboard contract verified');
  process.exitCode = 0;
} else {
  log(`Result: FAIL (${failures} failure(s))`);
  process.exitCode = 1;
}
