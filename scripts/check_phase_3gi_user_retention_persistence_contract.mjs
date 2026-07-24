/**
 * Static contract check for Phase 3GI — cross-device resume state + watchlist persistence.
 * Verifies the additive migration shape/RLS, authenticated server routes, shared client module,
 * and Home/Chart-AI/Portfolio UI integration. No network calls.
 */

globalThis.fetch = async (url) => {
  throw new Error(`[checker] BLOCKED unexpected network call to: ${String(url).slice(0, 60)}`);
};

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const MIGRATIONS_DIR = join(root, 'supabase', 'migrations');
const SERVER_LIB = join(root, 'src', 'lib', 'server', 'userRetention.ts');
const ROUTE_RETENTION = join(root, 'src', 'pages', 'api', 'user', 'retention.ts');
const ROUTE_PREFERENCES = join(root, 'src', 'pages', 'api', 'user', 'preferences.ts');
const ROUTE_WATCHLIST = join(root, 'src', 'pages', 'api', 'user', 'watchlist.ts');
const CLIENT_LIB = join(root, 'src', 'lib', 'userRetentionClient.ts');
const SUPABASE_LIB = join(root, 'src', 'lib', 'supabase.ts');
const HEADER_ASTRO = join(root, 'src', 'components', 'Header.astro');
const HOME_RETENTION_PANEL = join(root, 'src', 'components', 'HomeRetentionPanel.astro');
const INDEX_ASTRO = join(root, 'src', 'pages', 'index.astro');
const CHART_AI_ASTRO = join(root, 'src', 'pages', 'chart-ai.astro');
const PORTFOLIO_ASTRO = join(root, 'src', 'pages', 'portfolio.astro');
const PACKAGE_JSON = join(root, 'package.json');

const log = (msg) => process.stdout.write(msg + '\n');
let failures = 0;
let passes = 0;

const check = (label, pass) => {
  log(`  [${pass ? 'PASS' : 'FAIL'}] ${label}`);
  if (pass) passes++; else failures++;
};

const readOr = (path) => (existsSync(path) ? readFileSync(path, 'utf8') : '');

log('=== Phase 3GI User Retention Persistence Static Contract ===');
log('');

const migrationFiles = existsSync(MIGRATIONS_DIR)
  ? readdirSync(MIGRATIONS_DIR).filter((name) => name.endsWith('user_retention_persistence.sql'))
  : [];
const migration = migrationFiles.length === 1 ? readOr(join(MIGRATIONS_DIR, migrationFiles[0])) : '';
const server = readOr(SERVER_LIB);
const routeRetention = readOr(ROUTE_RETENTION);
const routePreferences = readOr(ROUTE_PREFERENCES);
const routeWatchlist = readOr(ROUTE_WATCHLIST);
const client = readOr(CLIENT_LIB);
const supabaseLib = readOr(SUPABASE_LIB);
const header = readOr(HEADER_ASTRO);
const homeRetentionPanel = readOr(HOME_RETENTION_PANEL);
const indexAstro = readOr(INDEX_ASTRO);
const chartAiAstro = readOr(CHART_AI_ASTRO);
const portfolioAstro = readOr(PORTFOLIO_ASTRO);
let pkg = {};
try { pkg = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8')); } catch {}

// ---------------------------------------------------------------------------
// Group 1: File existence
// ---------------------------------------------------------------------------
log('--- Group 1: File existence ---');
check('exactly one user_retention_persistence migration exists', migrationFiles.length === 1);
check('userRetention.ts server module exists', existsSync(SERVER_LIB));
check('GET /api/user/retention route exists', existsSync(ROUTE_RETENTION));
check('PATCH /api/user/preferences route exists', existsSync(ROUTE_PREFERENCES));
check('GET/POST/DELETE /api/user/watchlist route exists', existsSync(ROUTE_WATCHLIST));
check('userRetentionClient.ts shared client module exists', existsSync(CLIENT_LIB));
check('HomeRetentionPanel.astro exists', existsSync(HOME_RETENTION_PANEL));

// ---------------------------------------------------------------------------
// Group 2: Migration — not applied, additive, bounded, RLS own-row-only, no anon
// ---------------------------------------------------------------------------
log('--- Group 2: Migration contract ---');
check('migration has an "Apply via Supabase Dashboard" / do-not-execute header comment',
  /Apply via Supabase Dashboard.*do NOT execute via Claude Code/i.test(migration));
check('migration creates public.user_preferences', /create table public\.user_preferences/.test(migration));
check('migration creates public.user_watchlist_items', /create table public\.user_watchlist_items/.test(migration));
check('user_preferences.user_id references auth.users with cascade delete',
  /user_id uuid primary key references auth\.users\(id\) on delete cascade/.test(migration));
check('user_preferences.last_surface is CHECK-bounded to an enum', /last_surface text check \(last_surface in \('home', 'chart_ai', 'portfolio'\)\)/.test(migration));
check('user_preferences.last_portfolio_id references public.portfolios ON DELETE SET NULL (never cascaded)',
  /last_portfolio_id uuid references public\.portfolios\(id\) on delete set null/.test(migration));
check('user_preferences.last_chart_market is CHECK-bounded to KR/US', /last_chart_market text check \(last_chart_market in \('KR', 'US'\)\)/.test(migration));
check('user_preferences.last_chart_symbol has a length CHECK bound', /last_chart_symbol text check \(char_length\(last_chart_symbol\) between 1 and 32\)/.test(migration));
check('user_preferences.last_chart_name has a length CHECK bound', /last_chart_name text check \(char_length\(last_chart_name\) <= 160\)/.test(migration));
check('migration reuses the existing public.set_updated_at() trigger function (not redefined)',
  /execute function public\.set_updated_at\(\)/.test(migration) && !/create (or replace )?function public\.set_updated_at/.test(migration));
check('user_watchlist_items.market/symbol/asset_type are CHECK-bounded', /market text not null check \(market in \('KR', 'US'\)\)/.test(migration) &&
  /symbol text not null check \(char_length\(symbol\) between 1 and 32\)/.test(migration) &&
  /asset_type text not null check \(asset_type in \('stock', 'etf'\)\)/.test(migration));
check('user_watchlist_items enforces a per-user unique(market, symbol) constraint', /unique \(user_id, market, symbol\)/.test(migration));
check('user_watchlist_items has a user_id index', /create index user_watchlist_items_user_id_idx/.test(migration));
check('migration is purely additive (no drop/alter/delete/truncate of existing tables)',
  !/drop table|drop column|delete from|truncate/i.test(migration));
for (const table of ['user_preferences', 'user_watchlist_items']) {
  check(`${table}: RLS enabled`, new RegExp(`alter table public\\.${table} enable row level security`).test(migration));
  check(`${table}: anon/public access revoked`, new RegExp(`revoke all on public\\.${table} from public, anon`).test(migration));
  for (const action of ['select', 'insert', 'update', 'delete']) {
    check(`${table}: own-row ${action} policy present`, new RegExp(`create policy ${table}_${action}_own`).test(migration));
  }
  check(`${table}: policies scope to (select auth.uid()) = user_id (initplan-cached form)`,
    (migration.match(new RegExp(`${table}[\\s\\S]{0,400}?\\(select auth\\.uid\\(\\)\\) = user_id`, 'g')) || []).length >= 1);
}

// ---------------------------------------------------------------------------
// Group 3: Server module — auth boundary, sanitized missing-table mapping, limits
// ---------------------------------------------------------------------------
log('--- Group 3: Server module contract ---');
check('getRetentionRequestContext validates the bearer token before any DB work',
  /await validateUserFromBearerToken/.test(server));
check('isMissingRetentionTableError checks Postgres 42P01 / PostgREST PGRST205', server.includes("'42P01'") && server.includes("'PGRST205'"));
check('DB errors map through mapDbError to a sanitized RETENTION_API_NOT_READY response',
  /RETENTION_API_NOT_READY/.test(server) && /mapDbError/.test(server));
check('server never leaks a raw error object in a response body', !/apiFailure\([^)]*error[^)]*\)/.test(server));
check('MAX_WATCHLIST_ITEMS is bounded to 50', /MAX_WATCHLIST_ITEMS\s*=\s*50/.test(server));
check('addWatchlistItem enforces the 50-item cap before inserting',
  server.indexOf('MAX_WATCHLIST_ITEMS') < server.lastIndexOf('.insert({'));
check('updatePreferences validates lastPortfolioId ownership via ensurePortfolioOwned (imported)',
  server.includes("import { ensurePortfolioOwned }") && /ensurePortfolioOwned\(userId, body\.lastPortfolioId\)/.test(server));
check('updatePreferences has no free-form URL/href column in its update map (arbitrary URL rejected by construction)',
  !/updates\.(last_url|url|href)\s*=/i.test(server));
check('watchlist item lookup is scoped by user_id (no cross-user read)',
  /\.from\('user_watchlist_items'\)[\s\S]{0,200}\.eq\('user_id', userId\)/.test(server));
check('removeWatchlistItem deletes scoped by both id and user_id (cross-user isolation)',
  /\.delete\(\)\s*\.eq\('id', id\)\s*\.eq\('user_id', userId\)/.test(server));
check('server module never references a provider/quote/KIS endpoint', !/kis|quote|provider/i.test(server));

// ---------------------------------------------------------------------------
// Group 4: Route contracts — auth-before-body, no-store, method allow-lists
// ---------------------------------------------------------------------------
log('--- Group 4: Route contracts ---');
for (const [name, route] of [
  ['retention.ts', routeRetention],
  ['preferences.ts', routePreferences],
  ['watchlist.ts', routeWatchlist],
]) {
  check(`${name}: server-rendered (prerender = false)`, /export const prerender = false/.test(route));
  check(`${name}: resolves auth via getRetentionRequestContext before any other work`,
    route.includes('getRetentionRequestContext') &&
    (!route.includes('readJsonBody') || route.indexOf('getRetentionRequestContext') < route.indexOf('readJsonBody')));
  check(`${name}: unhandled methods route to methodNotAllowed`, route.includes('export const ALL = methodNotAllowed'));
}
check('jsonResponse sets Cache-Control: no-store', /Cache-Control['"]?:\s*['"]no-store['"]/.test(server));
check('preferences route uses PATCH (partial update, not full overwrite)', /export const PATCH:/.test(routePreferences));
check('watchlist route supports GET/POST/DELETE', /export const GET:/.test(routeWatchlist) && /export const POST:/.test(routeWatchlist) && /export const DELETE:/.test(routeWatchlist));

// ---------------------------------------------------------------------------
// Group 5: Session restoration hardening
// ---------------------------------------------------------------------------
log('--- Group 5: Session restoration hardening ---');
check('supabase.ts sets explicit persistSession: true', /persistSession:\s*true/.test(supabaseLib));
check('supabase.ts sets explicit autoRefreshToken: true', /autoRefreshToken:\s*true/.test(supabaseLib));
check('supabase.ts never logs a Session object or token', !/console\.(log|info|debug)\([^)]*session/i.test(supabaseLib) && !/console\.(log|info|debug)\([^)]*token/i.test(supabaseLib));
check('Header.astro skips re-bootstrap on INITIAL_SESSION', /event === 'INITIAL_SESSION'/.test(header));
check('Header.astro skips re-bootstrap on TOKEN_REFRESHED (no duplicate init)', /event === 'TOKEN_REFRESHED'/.test(header));
check('Header.astro dispatches mk:auth-state for other pages to react to', header.includes("dispatchEvent(new CustomEvent('mk:auth-state'"));
check('Header.astro never logs a Session object or raw token', !/console\.(log|info|debug)\([^)]*session/i.test(header) && !/console\.(log|info|debug)\([^)]*access_token/i.test(header));

// ---------------------------------------------------------------------------
// Group 6: Shared client module
// ---------------------------------------------------------------------------
log('--- Group 6: Shared client module ---');
check('client exports hasRetentionSession for zero-request signed-out gating', client.includes('export const hasRetentionSession'));
check('hasRetentionSession never calls fetch (session-only check)', /export const hasRetentionSession = async \(\) => \{[\s\S]{0,200}?\};/.exec(client)?.[0]?.includes('fetch') === false);
check('client exports userRetentionApi with getSnapshot/updatePreferences/listWatchlist/addWatchlistItem/removeWatchlistItem',
  ['getSnapshot', 'updatePreferences', 'listWatchlist', 'addWatchlistItem', 'removeWatchlistItem'].every((m) => client.includes(m)));
check('client exports a typed UserRetentionApiError with status/code', /class UserRetentionApiError extends Error/.test(client) && client.includes('status:') && client.includes('code:'));
check('client attaches a Bearer Authorization header from the current session', /Authorization: `Bearer \$\{session\.access_token\}`/.test(client));
check('client never persists or logs raw session/token values', !/console\.(log|info|debug)\([^)]*(session|token)/i.test(client));

// ---------------------------------------------------------------------------
// Group 7: Home UI integration — resume card + compact watchlist, zero-request signed-out
// ---------------------------------------------------------------------------
log('--- Group 7: Home UI integration ---');
check('index.astro renders HomeRetentionPanel', indexAstro.includes('<HomeRetentionPanel'));
check('HomeRetentionPanel checks hasRetentionSession before any API call', /await hasRetentionSession\(\)/.test(homeRetentionPanel));
check('HomeRetentionPanel makes zero requests when signed out (early return before getSnapshot)',
  /if \(!hasSession\) \{[\s\S]{0,80}?return;\s*\}/.test(homeRetentionPanel) &&
  homeRetentionPanel.indexOf('if (!hasSession)') < homeRetentionPanel.indexOf('getSnapshot()'));
check('HomeRetentionPanel hides on mk:auth-state signed_out', /signed_out['"][\s\S]{0,120}?classList\.add\('hidden'\)/.test(homeRetentionPanel));
check('HomeRetentionPanel degrades silently on any snapshot error (RETENTION_API_NOT_READY or transient)',
  /catch \{[\s\S]{0,120}?classList\.add\('hidden'\)/.test(homeRetentionPanel));
check('HomeRetentionPanel resume link never persists/uses an arbitrary raw URL (only chart-ai/portfolio deep links)',
  /\/chart-ai\?/.test(homeRetentionPanel) && /\/portfolio\?portfolio=/.test(homeRetentionPanel) && !/preferences\.lastUrl|lastHref/.test(homeRetentionPanel));

// ---------------------------------------------------------------------------
// Group 8: Chart AI UI integration — watchlist toggle, resume persistence, dedup
// ---------------------------------------------------------------------------
log('--- Group 8: Chart AI UI integration ---');
check('chart-ai.astro imports userRetentionApi/hasRetentionSession', chartAiAstro.includes("from '../lib/userRetentionClient'"));
check('chart-ai.astro has a watchlist toggle button', chartAiAstro.includes('chartAiWatchlistToggleBtn'));
check('watchlist toggle is hidden until an active chart instrument is resolved',
  /const active = integrity\.getActiveContext\(\);\s*\n\s*if \(!active\) \{ hideWatchlistToggle\(\); return; \}/.test(chartAiAstro));
check('watchlist toggle checks hasRetentionSession before listing/mutating (auth-gated)',
  /await hasRetentionSession\(\)/.test(chartAiAstro));
check('persistChartResumeState is deduplicated by instrument identity (no write storm)',
  /identity === lastPersistedChartIdentity/.test(chartAiAstro));
check('persistChartResumeState sets lastSurface: \'chart_ai\'', /lastSurface: 'chart_ai'/.test(chartAiAstro));
check('resume/watchlist persistence never blocks chart rendering (fire-and-forget void + try/catch)',
  /void \(async \(\) => \{[\s\S]{0,60}?const hasSession = await hasRetentionSession\(\);/.test(chartAiAstro) || /void refreshWatchlistToggleForActiveInstrument\(\)/.test(chartAiAstro));
check('watchlist add/remove is single in-flight (watchlistToggleInFlight guard)', /watchlistToggleInFlight/.test(chartAiAstro));
check('chart-ai.astro never triggers analysis or usage-quota consumption from the watchlist/resume paths',
  !/persistChartResumeState[\s\S]{0,300}(runAnalysis|consumeUsage|similarity\.json|mk-analysis\.json)/.test(chartAiAstro));

// ---------------------------------------------------------------------------
// Group 9: Portfolio UI integration — real owned ids only, deep link, dedup
// ---------------------------------------------------------------------------
log('--- Group 9: Portfolio UI integration ---');
check('portfolio.astro imports userRetentionApi/hasRetentionSession', portfolioAstro.includes("from '../lib/userRetentionClient'"));
check('persistPortfolioResumeState rejects the aggregate sentinel before persisting',
  /persistPortfolioResumeState = \(id: string\) => \{\s*\n\s*if \(isAggregatePortfolioId\(id\)/.test(portfolioAstro));
check('persistPortfolioResumeState is deduplicated by id (no write storm on re-render)',
  /id === lastPersistedPortfolioId/.test(portfolioAstro));
check('persistPortfolioResumeState sets lastSurface: \'portfolio\'', /lastSurface: 'portfolio'/.test(portfolioAstro));
check('portfolio.astro reads a `?portfolio=` deep link and only honors an id the user actually owns',
  /consumeRequestedPortfolioIdFromUrl/.test(portfolioAstro) &&
  /state\.portfolios\.some\(\(portfolio\) => portfolio\.id === requestedId\)/.test(portfolioAstro));
check('an unowned/invalid `?portfolio=` id falls back to normal aggregate/last-selection behavior (no forced aggregate override)',
  portfolioAstro.indexOf('if (requestedId && state.portfolios.some') < portfolioAstro.indexOf("state.selectedPortfolioId = aggregatePortfolioId;"));
check('tab-click selection also persists resume state', /await loadPositions\(id\);\s*\n\s*persistPortfolioResumeState\(id\);/.test(portfolioAstro));

// ---------------------------------------------------------------------------
// Group 10: No account/trading/provider surfaces introduced
// ---------------------------------------------------------------------------
log('--- Group 10: No account / trading / provider surfaces ---');
for (const source of [server, routeRetention, routePreferences, routeWatchlist, client]) {
  check('no reference to KIS_ACCOUNT_NO in Phase 3GI sources', !source.includes('KIS_ACCOUNT_NO'));
  check('no reference to an order/trade/balance endpoint in Phase 3GI sources', !/\/api\/(?:kis-)?(?:order|trade|balance|account)/i.test(source));
}
check('watchlist persistence never introduces quote polling (no setInterval/pollQuote)', !/setInterval|pollQuote/.test(client) && !/setInterval|pollQuote/.test(homeRetentionPanel));

// ---------------------------------------------------------------------------
// Group 11: package.json wiring
// ---------------------------------------------------------------------------
log('--- Group 11: package.json wiring ---');
check('package.json has smoke:phase-3gi-user-retention-persistence script',
  typeof pkg.scripts?.['smoke:phase-3gi-user-retention-persistence'] === 'string');
check('package.json has check:phase-3gi-user-retention-persistence script',
  typeof pkg.scripts?.['check:phase-3gi-user-retention-persistence'] === 'string');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
log('');
log(`Total: ${passes + failures} | Passed: ${passes} | Failed: ${failures}`);
process.exit(failures === 0 ? 0 : 1);
