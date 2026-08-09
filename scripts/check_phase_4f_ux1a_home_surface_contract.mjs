/**
 * Static contract check for Phase 4F-UX1-A -- remove the unintended Home resume surface
 * (UX-08) while preserving the Phase 3GI retention backend, and add a regression guard
 * against unapproved state-dependent Home surfaces reappearing between MARKET SNAPSHOT and
 * MARKET NEWS. No network calls.
 */

globalThis.fetch = async (url) => {
  throw new Error(`[checker] BLOCKED unexpected network call to: ${String(url).slice(0, 60)}`);
};

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const INDEX_ASTRO = join(root, 'src', 'pages', 'index.astro');
const HOME_RETENTION_PANEL = join(root, 'src', 'components', 'HomeRetentionPanel.astro');
const HOME_PORTFOLIO_PANEL = join(root, 'src', 'components', 'HomePortfolioPanel.astro');
const HOME_MARKET_NEWS = join(root, 'src', 'components', 'HomeMarketNews.astro');
const HOME_LIVE_MARKET_SNAPSHOT = join(root, 'src', 'components', 'HomeLiveMarketSnapshot.astro');
const HEADER_ASTRO = join(root, 'src', 'components', 'Header.astro');
const SURFACE_GUARD = join(root, 'src', 'lib', 'home', 'homeDynamicSurfaceGuard.ts');
const SERVER_LIB = join(root, 'src', 'lib', 'server', 'userRetention.ts');
const ROUTE_RETENTION = join(root, 'src', 'pages', 'api', 'user', 'retention.ts');
const ROUTE_PREFERENCES = join(root, 'src', 'pages', 'api', 'user', 'preferences.ts');
const ROUTE_WATCHLIST = join(root, 'src', 'pages', 'api', 'user', 'watchlist.ts');
const CLIENT_LIB = join(root, 'src', 'lib', 'userRetentionClient.ts');
const PORTFOLIO_ASTRO = join(root, 'src', 'pages', 'portfolio.astro');
const CHART_AI_ASTRO = join(root, 'src', 'pages', 'chart-ai.astro');
const LAB_ASTRO = join(root, 'src', 'pages', 'lab.astro');
const PACKAGE_JSON = join(root, 'package.json');

const log = (msg) => process.stdout.write(msg + '\n');
let failures = 0;
let passes = 0;

const check = (label, pass) => {
  log(`  [${pass ? 'PASS' : 'FAIL'}] ${label}`);
  if (pass) passes++;
  else failures++;
};

const readOr = (path) => (existsSync(path) ? readFileSync(path, 'utf8') : '');

log('=== Phase 4F-UX1-A Home Surface Guard Static Contract ===');
log('');

const indexAstro = readOr(INDEX_ASTRO);
const homeRetentionPanel = readOr(HOME_RETENTION_PANEL);
const homePortfolioPanel = readOr(HOME_PORTFOLIO_PANEL);
const homeMarketNews = readOr(HOME_MARKET_NEWS);
const surfaceGuard = readOr(SURFACE_GUARD);
const server = readOr(SERVER_LIB);
const routeRetention = readOr(ROUTE_RETENTION);
const routePreferences = readOr(ROUTE_PREFERENCES);
const routeWatchlist = readOr(ROUTE_WATCHLIST);
const client = readOr(CLIENT_LIB);
const portfolioAstro = readOr(PORTFOLIO_ASTRO);
const chartAiAstro = readOr(CHART_AI_ASTRO);
const labAstro = readOr(LAB_ASTRO);
const packageJson = readOr(PACKAGE_JSON);

// ---------------------------------------------------------------------------
// Group 1: HomeRetentionPanel removed from index.astro (import + render), file kept dormant
// ---------------------------------------------------------------------------
log('--- Group 1: Home resume surface removed ---');
check('index.astro does not import HomeRetentionPanel', !/import\s+HomeRetentionPanel/.test(indexAstro));
check('index.astro does not render <HomeRetentionPanel', !indexAstro.includes('<HomeRetentionPanel'));
check(
  'HomeRetentionPanel.astro file still exists (kept dormant, not deleted)',
  existsSync(HOME_RETENTION_PANEL) && homeRetentionPanel.length > 0,
);

// ---------------------------------------------------------------------------
// Group 2: approved Home section order -- Snapshot immediately precedes News, nothing between
// ---------------------------------------------------------------------------
log('--- Group 2: approved Home section order ---');
check('index.astro still renders HomeLiveMarketSnapshot', indexAstro.includes('<HomeLiveMarketSnapshot'));
check('index.astro still renders HomeMarketNews', indexAstro.includes('<HomeMarketNews'));

const snapshotIdx = indexAstro.indexOf('<HomeLiveMarketSnapshot');
const newsIdx = indexAstro.indexOf('<HomeMarketNews');
check(
  'HomeLiveMarketSnapshot appears before HomeMarketNews',
  snapshotIdx !== -1 && newsIdx !== -1 && snapshotIdx < newsIdx,
);

const between = snapshotIdx !== -1 && newsIdx !== -1 ? indexAstro.slice(snapshotIdx, newsIdx) : '';
check(
  'no other component tag (e.g. HomeRetentionPanel) renders between Snapshot and News',
  between !== '' && !/<[A-Z][A-Za-z]*(?!Snapshot)/.test(between.replace('<HomeLiveMarketSnapshot', '')),
);
check(
  'the gap between Snapshot and News contains no HomeRetentionPanel render specifically',
  !between.includes('<HomeRetentionPanel'),
);

// ---------------------------------------------------------------------------
// Group 3: stateful UI regression guard (§6) -- approved dynamic-surface registry
// ---------------------------------------------------------------------------
log('--- Group 3: stateful UI regression guard ---');
check('src/lib/home/homeDynamicSurfaceGuard.ts exists', existsSync(SURFACE_GUARD));
check(
  'guard approves the Home portfolio summary panel',
  /id:\s*'home-portfolio-panel'/.test(surfaceGuard),
);
check(
  'guard approves the normal authenticated header state',
  /id:\s*'header-auth-state'/.test(surfaceGuard),
);
check(
  'guard explicitly records home-retention-panel as rejected (not silently omitted)',
  /REJECTED_HOME_DYNAMIC_SURFACES[\s\S]*?id:\s*'home-retention-panel'/.test(surfaceGuard),
);
check(
  'guard exposes isApprovedHomeDynamicSurface and isExplicitlyRejectedHomeDynamicSurface',
  surfaceGuard.includes('isApprovedHomeDynamicSurface') && surfaceGuard.includes('isExplicitlyRejectedHomeDynamicSurface'),
);
check(
  'HomePortfolioPanel.astro (the approved dynamic surface) still exists',
  existsSync(HOME_PORTFOLIO_PANEL) && homePortfolioPanel.length > 0,
);
check('Header.astro (the approved dynamic surface) still exists', existsSync(HEADER_ASTRO));

// ---------------------------------------------------------------------------
// Group 4: Phase 3GI retention backend preserved untouched
// ---------------------------------------------------------------------------
log('--- Group 4: retention backend preserved ---');
check('src/lib/server/userRetention.ts still exists', existsSync(SERVER_LIB) && server.length > 0);
check('GET /api/user/retention route still exists', existsSync(ROUTE_RETENTION) && routeRetention.length > 0);
check('PATCH /api/user/preferences route still exists', existsSync(ROUTE_PREFERENCES) && routePreferences.length > 0);
check('GET/POST/DELETE /api/user/watchlist route still exists', existsSync(ROUTE_WATCHLIST) && routeWatchlist.length > 0);
check('userRetentionClient.ts shared client module still exists', existsSync(CLIENT_LIB) && client.length > 0);

check(
  'portfolio.astro still imports userRetentionApi/hasRetentionSession',
  /import\s*{\s*userRetentionApi,\s*hasRetentionSession\s*}/.test(portfolioAstro),
);
check(
  'portfolio.astro still persists lastSurface: \'portfolio\' resume state',
  portfolioAstro.includes('persistPortfolioResumeState') && /lastSurface:\s*'portfolio'/.test(portfolioAstro),
);
check(
  'chart-ai.astro still persists chart resume state and watchlist toggling',
  chartAiAstro.includes('persistChartResumeState') && /lastSurface:\s*'chart_ai'/.test(chartAiAstro),
);
check(
  'lab.astro still persists lastSurface: \'lab\' resume state',
  labAstro.includes('userRetentionApi') && /lastSurface:\s*'lab'/.test(labAstro),
);

// ---------------------------------------------------------------------------
// Group 5: no scope creep -- no urgent-news styling, no Portfolio/Chart AI/Lab UX work added here
// ---------------------------------------------------------------------------
log('--- Group 5: no scope creep ---');
check(
  'no [급보]/[단독]/[긴급]/[속보] urgent-news tag styling added in this phase',
  !homeMarketNews.includes('급보') && !homeMarketNews.includes('단독') && !homeMarketNews.includes('긴급') && !homeMarketNews.includes('속보'),
);
check(
  'HomePortfolioPanel.astro keeps its four state ids (no redesign in this phase)',
  ['hpp-resolving', 'hpp-signed-out', 'hpp-signed-in-empty', 'hpp-signed-in-portfolio'].every((id) =>
    homePortfolioPanel.includes(id),
  ),
);

// ---------------------------------------------------------------------------
// Group 6: package.json wiring
// ---------------------------------------------------------------------------
log('--- Group 6: package.json wiring ---');
check('package.json has smoke:phase-4f-ux1a-home-surface script', packageJson.includes('"smoke:phase-4f-ux1a-home-surface"'));
check('package.json has check:phase-4f-ux1a-home-surface script', packageJson.includes('"check:phase-4f-ux1a-home-surface"'));

log('');
log(`Total: ${passes + failures} | Passed: ${passes} | Failed: ${failures}`);
process.exitCode = failures > 0 ? 1 : 0;
