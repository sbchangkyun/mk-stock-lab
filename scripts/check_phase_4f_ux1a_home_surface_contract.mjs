/**
 * Static contract check for Phase 4F-UX1-A / UX1-A1 -- remove the unintended Home resume
 * surface (UX-08), and enforce (not merely document) an exact-match invariant between the
 * ACTUAL top-level Home*.astro components rendered by index.astro and the APPROVED registry
 * in src/lib/home/homeDynamicSurfaceGuard.ts. A brand-new unregistered Home*.astro render, a
 * registered-but-unrendered component, or a render of an explicitly rejected component (e.g.
 * HomeRetentionPanel) must all fail this checker. No network calls.
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

log('=== Phase 4F-UX1-A / UX1-A1 Home Surface Guard Static Contract ===');
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
// Group 2: ACTUAL render-tree vs APPROVED registry -- exact-match enforcement (UX1-A1 core fix)
// ---------------------------------------------------------------------------
log('--- Group 2: actual render-tree vs registry (enforced, not documentation-only) ---');

// Extract every distinct top-level `<HomeXxx` tag actually rendered by index.astro.
const actualRenderedComponents = Array.from(
  new Set(Array.from(indexAstro.matchAll(/<Home[A-Z][A-Za-z0-9]*/g)).map((m) => m[0].slice(1))),
);
check('index.astro has at least one <Home...> render to inventory', actualRenderedComponents.length > 0);

// Extract approved/rejected component names from their own registry blocks, so
// GLOBAL_SHELL_SURFACES (e.g. Header) is never conflated with the Home render tree.
const extractBlock = (source, startMarker, endMarker) => {
  const startIdx = source.indexOf(startMarker);
  if (startIdx === -1) return '';
  const endIdx = endMarker ? source.indexOf(endMarker, startIdx) : source.length;
  return source.slice(startIdx, endIdx === -1 ? source.length : endIdx);
};

const approvedBlock = extractBlock(
  surfaceGuard,
  'export const APPROVED_HOME_SURFACES',
  'export const REJECTED_HOME_SURFACES',
);
const rejectedBlock = extractBlock(
  surfaceGuard,
  'export const REJECTED_HOME_SURFACES',
  'export const GLOBAL_SHELL_SURFACES',
);
const globalShellBlock = extractBlock(surfaceGuard, 'export const GLOBAL_SHELL_SURFACES', undefined);

const extractComponentNames = (block) =>
  Array.from(block.matchAll(/component:\s*'([^']+)'/g)).map((m) => m[1]);

const approvedComponents = extractComponentNames(approvedBlock);
const rejectedComponents = extractComponentNames(rejectedBlock);
const globalShellComponents = extractComponentNames(globalShellBlock);

check('registry APPROVED_HOME_SURFACES block is parseable and non-empty', approvedComponents.length > 0);
check('registry REJECTED_HOME_SURFACES block is parseable and non-empty', rejectedComponents.length > 0);
check(
  'Header (global shell state) is NOT mixed into APPROVED_HOME_SURFACES',
  globalShellComponents.includes('Header') && !approvedComponents.includes('Header'),
);

// Same comparison semantics as compareHomeSurfaceInventory in homeDynamicSurfaceGuard.ts,
// reimplemented here in plain JS since this checker performs static text analysis only and
// does not execute app TypeScript modules.
const actualSet = new Set(actualRenderedComponents);
const approvedSet = new Set(approvedComponents);
const rejectedSet = new Set(rejectedComponents);

const missing = approvedComponents.filter((c) => !actualSet.has(c));
const rejectedRendered = actualRenderedComponents.filter((c) => rejectedSet.has(c));
const unexpected = actualRenderedComponents.filter((c) => !approvedSet.has(c) && !rejectedSet.has(c));

check(
  `no approved component is missing from the actual render tree (missing: ${missing.join(', ') || 'none'})`,
  missing.length === 0,
);
check(
  `no unregistered component is rendered (unexpected: ${unexpected.join(', ') || 'none'})`,
  unexpected.length === 0,
);
check(
  `no explicitly rejected component is rendered (rejectedRendered: ${rejectedRendered.join(', ') || 'none'})`,
  rejectedRendered.length === 0,
);
check(
  'ACTUAL_RENDERED_HOME_COMPONENTS == APPROVED_RENDERED_HOME_COMPONENTS (exact-match invariant)',
  missing.length === 0 && unexpected.length === 0 && rejectedRendered.length === 0,
);

// ---------------------------------------------------------------------------
// Group 3: main-column order contract + Snapshot/News adjacency
// ---------------------------------------------------------------------------
log('--- Group 3: main-column order + Snapshot/News adjacency ---');
check('index.astro still renders HomePortfolioPanel', indexAstro.includes('<HomePortfolioPanel'));
check('index.astro still renders HomeMobileAd', indexAstro.includes('<HomeMobileAd'));
check('index.astro still renders HomeLiveMarketSnapshot', indexAstro.includes('<HomeLiveMarketSnapshot'));
check('index.astro still renders HomeMarketNews', indexAstro.includes('<HomeMarketNews'));
check('index.astro still renders HomeRailAd', indexAstro.includes('<HomeRailAd'));

const portfolioIdx = indexAstro.indexOf('<HomePortfolioPanel');
const mobileAdIdx = indexAstro.indexOf('<HomeMobileAd');
const snapshotIdx = indexAstro.indexOf('<HomeLiveMarketSnapshot');
const newsIdx = indexAstro.indexOf('<HomeMarketNews');
const railAdIdx = indexAstro.indexOf('<HomeRailAd');
const sidebarMarkerIdx = indexAstro.indexOf('home-sidebar-column');

check(
  'main-column order holds: HomePortfolioPanel < HomeMobileAd < HomeLiveMarketSnapshot < HomeMarketNews',
  [portfolioIdx, mobileAdIdx, snapshotIdx, newsIdx].every((i) => i !== -1) &&
    portfolioIdx < mobileAdIdx &&
    mobileAdIdx < snapshotIdx &&
    snapshotIdx < newsIdx,
);
check(
  'HomeRailAd is rendered in the sidebar branch, excluded from the main-column linear order',
  sidebarMarkerIdx !== -1 && railAdIdx !== -1 && sidebarMarkerIdx < railAdIdx,
);

const between = snapshotIdx !== -1 && newsIdx !== -1 ? indexAstro.slice(snapshotIdx, newsIdx) : '';
check(
  'HomeLiveMarketSnapshot immediately precedes HomeMarketNews (nothing else renders between them)',
  between !== '' &&
    !/<[A-Z][A-Za-z0-9]*/.test(between.replace('<HomeLiveMarketSnapshot', '')),
);
check(
  'the gap between Snapshot and News contains no HomeRetentionPanel render specifically',
  !between.includes('<HomeRetentionPanel'),
);

// ---------------------------------------------------------------------------
// Group 4: registry structure -- visibility model + rejected/global-shell separation
// ---------------------------------------------------------------------------
log('--- Group 4: registry structure ---');
check('src/lib/home/homeDynamicSurfaceGuard.ts exists', existsSync(SURFACE_GUARD));
check(
  'guard declares the HomeSurfaceVisibility union (always | stateful | rejected)',
  /type HomeSurfaceVisibility\s*=\s*'always'\s*\|\s*'stateful'\s*\|\s*'rejected'/.test(surfaceGuard),
);
check('guard approves the Home portfolio summary panel', /id:\s*'home-portfolio-panel'/.test(surfaceGuard));
check('guard approves the Home mobile ad slot', /id:\s*'home-mobile-ad'/.test(surfaceGuard));
check('guard approves the Home live market snapshot', /id:\s*'home-live-market-snapshot'/.test(surfaceGuard));
check('guard approves the Home market news section', /id:\s*'home-market-news'/.test(surfaceGuard));
check('guard approves the Home rail ad slot', /id:\s*'home-rail-ad'/.test(surfaceGuard));
check(
  'guard explicitly records home-retention-panel as rejected (not silently omitted)',
  /id:\s*'home-retention-panel'/.test(rejectedBlock) && /visibility:\s*'rejected'/.test(rejectedBlock),
);
check(
  'header-auth-state lives in GLOBAL_SHELL_SURFACES, separated from the Home render-tree inventory',
  /id:\s*'header-auth-state'/.test(globalShellBlock) && !/id:\s*'header-auth-state'/.test(approvedBlock),
);
check(
  'guard exposes isApprovedHomeSurface, isExplicitlyRejectedHomeSurface, and compareHomeSurfaceInventory',
  surfaceGuard.includes('isApprovedHomeSurface') &&
    surfaceGuard.includes('isExplicitlyRejectedHomeSurface') &&
    surfaceGuard.includes('compareHomeSurfaceInventory'),
);
check(
  'HomePortfolioPanel.astro (an approved surface) still exists',
  existsSync(HOME_PORTFOLIO_PANEL) && homePortfolioPanel.length > 0,
);
check('Header.astro (the global-shell surface) still exists', existsSync(HEADER_ASTRO));
check('HomeLiveMarketSnapshot.astro (an approved surface) still exists', existsSync(HOME_LIVE_MARKET_SNAPSHOT));

// ---------------------------------------------------------------------------
// Group 5: Phase 3GI retention backend preserved untouched
// ---------------------------------------------------------------------------
log('--- Group 5: retention backend preserved ---');
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
// Group 6: no scope creep -- no urgent-news styling, no Portfolio/Chart AI/Lab UX work added here
// ---------------------------------------------------------------------------
log('--- Group 6: no scope creep ---');
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
// Group 7: package.json wiring
// ---------------------------------------------------------------------------
log('--- Group 7: package.json wiring ---');
check('package.json has smoke:phase-4f-ux1a-home-surface script', packageJson.includes('"smoke:phase-4f-ux1a-home-surface"'));
check('package.json has check:phase-4f-ux1a-home-surface script', packageJson.includes('"check:phase-4f-ux1a-home-surface"'));

log('');
log(`Total: ${passes + failures} | Passed: ${passes} | Failed: ${failures}`);
process.exitCode = failures > 0 ? 1 : 0;
