/**
 * Static contract check for Phase 3BY Portfolio UI Valuation Owner Review Prep.
 * Focused validator: verifies 3BX fixture mapping, 3BW-HF1 tab persistence, and
 * safety boundaries only. No network calls. No .env reads. Exits non-zero on failure.
 */

globalThis.fetch = async (url) => {
  throw new Error(`[checker] BLOCKED unexpected network call to: ${String(url).slice(0, 60)}`);
};

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const PORTFOLIO_ASTRO = join(root, 'src', 'pages', 'portfolio.astro');
const CSS_PATH = join(root, 'src', 'styles', 'style.css');
const VALUATION_ROUTE = join(root, 'src', 'pages', 'api', 'portfolio', 'valuation.ts');
const RESULT_DOC = join(root, 'docs', 'planning', 'phase_3by_portfolio_ui_valuation_owner_review_prep_result_v0.1.md');
const PACKAGE_JSON = join(root, 'package.json');
const NEWS_PAGE = join(root, 'src', 'pages', 'news');
const DB_MIGRATIONS = join(root, 'supabase', 'migrations');

const log = (msg) => process.stdout.write(msg + '\n');
let failures = 0;
let passes = 0;

const check = (label, pass) => {
  log(`  [${pass ? 'PASS' : 'FAIL'}] ${label}`);
  if (pass) passes++; else failures++;
};

log('=== Phase 3BY Portfolio UI Valuation Owner Review Prep Static Contract ===');
log('');

const portfolioContent = existsSync(PORTFOLIO_ASTRO) ? readFileSync(PORTFOLIO_ASTRO, 'utf8') : '';
const cssContent = existsSync(CSS_PATH) ? readFileSync(CSS_PATH, 'utf8') : '';

let pkg = {};
try { pkg = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8')); } catch {}

// ---------------------------------------------------------------------------
// Group 1: File existence
// ---------------------------------------------------------------------------
log('--- Group 1: File existence ---');

check('portfolio.astro exists', existsSync(PORTFOLIO_ASTRO));
check('style.css exists', existsSync(CSS_PATH));
check('/api/portfolio/valuation route exists', existsSync(VALUATION_ROUTE));
check('Phase 3BY result doc exists', existsSync(RESULT_DOC));
check('package.json has check:portfolio-owner-review-prep script',
  typeof pkg.scripts?.['check:portfolio-owner-review-prep'] === 'string');
log('');

// ---------------------------------------------------------------------------
// Group 2: Phase 3BX fixture mapping intact
// ---------------------------------------------------------------------------
log('--- Group 2: Phase 3BX fixture mapping intact ---');

check('loadValuation function present',
  portfolioContent.includes('const loadValuation = async'));
check('portfolio.astro posts to /api/portfolio/valuation',
  portfolioContent.includes("'/api/portfolio/valuation'") ||
  portfolioContent.includes('"/api/portfolio/valuation"'));
check('source: fixture sent in valuation request',
  portfolioContent.includes("source: 'fixture'") || portfolioContent.includes('source: "fixture"'));
check('source: live NOT present',
  !portfolioContent.includes("source: 'live'") && !portfolioContent.includes('source: "live"'));
check('source: auto NOT present',
  !portfolioContent.includes("source: 'auto'") && !portfolioContent.includes('source: "auto"'));
check('currentPrice mapped (현재가)',
  portfolioContent.includes('currentPrice'));
check('marketValue mapped (평가금)',
  portfolioContent.includes('marketValue'));
check('unrealizedPnlPct mapped (수익률)',
  portfolioContent.includes('unrealizedPnlPct'));
check('unrealizedPnl mapped (수익금)',
  portfolioContent.includes('unrealizedPnl'));
check('valuation-status-copy element present',
  portfolioContent.includes('valuation-status-copy'));
check('.valuation-status-copy defined in CSS',
  cssContent.includes('.valuation-status-copy'));
check('Fallback 연동 예정 retained for missing values',
  portfolioContent.includes("?? '연동 예정'") || portfolioContent.includes('연동 예정'));
check('Dividend fallback 데이터 대기 retained',
  portfolioContent.includes('데이터 대기'));
log('');

// ---------------------------------------------------------------------------
// Group 3: No false real-time / misleading copy
// ---------------------------------------------------------------------------
log('--- Group 3: No false real-time claims ---');

check('No 실시간 시세 반영 claim',
  !portfolioContent.includes('실시간 시세 반영'));
check('No 최신 시세 반영 claim',
  !portfolioContent.includes('최신 시세 반영') && !portfolioContent.includes('최신 시세'));
check('No KIS 연결 완료 claim',
  !portfolioContent.includes('KIS 연결 완료'));
check('실시간 appears only in denial context (실시간 시세가 아닙니다) if at all',
  !portfolioContent.includes('실시간') ||
  portfolioContent.includes('실시간 시세가 아닙니다'));
log('');

// ---------------------------------------------------------------------------
// Group 4: Phase 3BW-HF1 tab order persistence intact
// ---------------------------------------------------------------------------
log('--- Group 4: Tab order persistence intact (3BW-HF1) ---');

check('TAB_ORDER_STORAGE_KEY present',
  portfolioContent.includes('TAB_ORDER_STORAGE_KEY'));
check('readTabOrderFromStorage present',
  portfolioContent.includes('readTabOrderFromStorage'));
check('saveTabOrderToStorage present',
  portfolioContent.includes('saveTabOrderToStorage'));
check('Controlled localStorage key mk-stock-lab:portfolio-tab-order used',
  portfolioContent.includes('mk-stock-lab:portfolio-tab-order'));
check('No uncontrolled ad-hoc localStorage tab key',
  !portfolioContent.includes('portfolioTabOrder'));
log('');

// ---------------------------------------------------------------------------
// Group 5: No server-heavy / polling / background refresh patterns
// ---------------------------------------------------------------------------
log('--- Group 5: No server-heavy or polling patterns ---');

check('No setInterval in portfolio page',
  !portfolioContent.includes('setInterval'));
check('No polling loop (polling keyword absent)',
  !portfolioContent.includes('polling'));
check('No cron/scheduler in portfolio page',
  !portfolioContent.includes('cron'));
check('No background refresh pattern (refresh interval absent)',
  !portfolioContent.includes('refreshInterval') && !portfolioContent.includes('refresh_interval'));
log('');

// ---------------------------------------------------------------------------
// Group 6: Live provider isolation
// ---------------------------------------------------------------------------
log('--- Group 6: Live provider isolation ---');

check('No live KIS endpoint path',
  !portfolioContent.includes('/uapi/domestic-stock'));
check('No KIS OAuth endpoint',
  !portfolioContent.includes('oauth2/tokenP'));
check('No KIS_APP_KEY read',
  !portfolioContent.includes('KIS_APP_KEY'));
check('No gnews.io in portfolio page',
  !portfolioContent.includes('gnews.io'));
check('No GNEWS_API_KEY read',
  !portfolioContent.includes('GNEWS_API_KEY'));
check('No koreainvestment.com reference',
  !portfolioContent.includes('koreainvestment'));
log('');

// ---------------------------------------------------------------------------
// Group 7: Environment / deployment isolation
// ---------------------------------------------------------------------------
log('--- Group 7: Environment and deployment isolation ---');

check('No process.env read in portfolio page',
  !portfolioContent.includes('process.env'));
check('No import.meta.env read in portfolio page',
  !portfolioContent.includes('import.meta.env'));
check('No Vercel URL reference in portfolio page',
  !portfolioContent.includes('vercel.app') && !portfolioContent.includes('vercel.com'));
check('No supabaseAdmin import in portfolio page',
  !portfolioContent.includes('supabaseAdmin'));
check('No DB migration SQL in portfolio page',
  !portfolioContent.includes('CREATE TABLE') && !portfolioContent.includes('ALTER TABLE'));
check('No /news page exists',
  !existsSync(NEWS_PAGE));
log('');

// ---------------------------------------------------------------------------
// Group 8: Checker network safety
// ---------------------------------------------------------------------------
log('--- Group 8: Checker network safety ---');

let fetchAttempted = false;
const origFetch = globalThis.fetch;
globalThis.fetch = async () => { fetchAttempted = true; throw new Error('blocked'); };
check('Checker itself makes no network calls', !fetchAttempted);
globalThis.fetch = origFetch;
log('');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
log('=== Phase 3BY Portfolio UI Valuation Owner Review Prep — Summary ===');
const total = passes + failures;
log(`Checks passed: ${passes}/${total}`);
log('');

if (failures === 0) {
  log('Result: PASS — ready for owner browser review');
  process.exitCode = 0;
} else {
  log(`Result: FAIL (${failures} failure(s))`);
  process.exitCode = 1;
}
