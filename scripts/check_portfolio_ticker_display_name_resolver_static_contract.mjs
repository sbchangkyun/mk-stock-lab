/**
 * Static contract check for Phase 3BY-HF1 Portfolio Ticker Display Name Resolver.
 * Verifies that local-only metadata resolution is in place, symbol is preserved,
 * fallback behavior is intact, and all safety boundaries remain respected.
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

const PORTFOLIO_ASTRO = join(root, 'src', 'pages', 'portfolio.astro');
const SECURITY_LOGOS = join(root, 'src', 'data', 'securityLogos.json');
const RESULT_DOC = join(root, 'docs', 'planning', 'phase_3by_hf1_portfolio_ticker_display_name_resolver_result_v0.1.md');
const PACKAGE_JSON = join(root, 'package.json');

const log = (msg) => process.stdout.write(msg + '\n');
let failures = 0;
let passes = 0;

const check = (label, pass) => {
  log(`  [${pass ? 'PASS' : 'FAIL'}] ${label}`);
  if (pass) passes++; else failures++;
};

log('=== Phase 3BY-HF1 Portfolio Ticker Display Name Resolver Static Contract ===');
log('');

const portfolioContent = existsSync(PORTFOLIO_ASTRO) ? readFileSync(PORTFOLIO_ASTRO, 'utf8') : '';
let pkg = {};
try { pkg = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8')); } catch {}
let logos = {};
try { logos = JSON.parse(readFileSync(SECURITY_LOGOS, 'utf8')); } catch {}

// ---------------------------------------------------------------------------
// Group 1: File existence
// ---------------------------------------------------------------------------
log('--- Group 1: File existence ---');

check('portfolio.astro exists', existsSync(PORTFOLIO_ASTRO));
check('securityLogos.json exists', existsSync(SECURITY_LOGOS));
check('Phase 3BY-HF1 result doc exists', existsSync(RESULT_DOC));
check('package.json has check:portfolio-ticker-display-name script',
  typeof pkg.scripts?.['check:portfolio-ticker-display-name'] === 'string');
log('');

// ---------------------------------------------------------------------------
// Group 2: Local metadata infrastructure intact
// ---------------------------------------------------------------------------
log('--- Group 2: Local metadata infrastructure ---');

check('portfolio.astro imports securityLogoMap',
  portfolioContent.includes('securityLogoMap') &&
  portfolioContent.includes('securityLogos.json'));
check('logoMappings cast from securityLogoMap present',
  portfolioContent.includes('logoMappings'));
check('tickerLikePattern still defined',
  portfolioContent.includes('tickerLikePattern'));
check('krCodePattern still defined',
  portfolioContent.includes('krCodePattern'));
check('normalizeLogoKey still defined',
  portfolioContent.includes('normalizeLogoKey'));
check('resolveSecurityMetadata helper added',
  portfolioContent.includes('resolveSecurityMetadata'));
check('resolveDisplayNameForSymbol helper added',
  portfolioContent.includes('resolveDisplayNameForSymbol'));
log('');

// ---------------------------------------------------------------------------
// Group 3: toPositionIdentity uses resolver
// ---------------------------------------------------------------------------
log('--- Group 3: toPositionIdentity resolver integration ---');

check('toPositionIdentity still defined',
  portfolioContent.includes('const toPositionIdentity'));
check('toPositionIdentity calls resolveSecurityMetadata',
  portfolioContent.includes('toPositionIdentity') &&
  (() => {
    const idx = portfolioContent.indexOf('const toPositionIdentity');
    const slice = portfolioContent.slice(idx, idx + 400);
    return slice.includes('resolveSecurityMetadata');
  })());
check('toPositionIdentity uses mapped.symbol for canonical symbol',
  (() => {
    const idx = portfolioContent.indexOf('const toPositionIdentity');
    const slice = portfolioContent.slice(idx, idx + 400);
    return slice.includes('mapped?.symbol');
  })());
check('toPositionIdentity uses mapped.name for display name',
  (() => {
    const idx = portfolioContent.indexOf('const toPositionIdentity');
    const slice = portfolioContent.slice(idx, idx + 400);
    return slice.includes('mapped?.name');
  })());
check('toPositionIdentity preserves empty name for unknown ticker',
  (() => {
    const idx = portfolioContent.indexOf('const toPositionIdentity');
    const slice = portfolioContent.slice(idx, idx + 500);
    return slice.includes("tickerLikePattern.test") && slice.includes("''");
  })());
log('');

// ---------------------------------------------------------------------------
// Group 4: securityLogos.json data contract
// ---------------------------------------------------------------------------
log('--- Group 4: securityLogos.json data contract ---');

const knownSymbols = Object.keys(logos);
check('securityLogos.json is non-empty', knownSymbols.length > 0);
check('Each logo entry has a name field',
  knownSymbols.every((key) => typeof logos[key]?.name === 'string' && logos[key].name.length > 0));
check('Each logo entry has a symbol field',
  knownSymbols.every((key) => typeof logos[key]?.symbol === 'string'));
check('At least one KR code entry (6 digits) exists',
  knownSymbols.some((key) => /^\d{6}$/.test(key)));
log('');

// ---------------------------------------------------------------------------
// Group 5: Display label helpers use resolver
// ---------------------------------------------------------------------------
log('--- Group 5: Display label helpers ---');

check('getPositionPrimaryLabel uses resolveSecurityMetadata fallback',
  (() => {
    const idx = portfolioContent.indexOf('const getPositionPrimaryLabel');
    const slice = portfolioContent.slice(idx, idx + 300);
    return slice.includes('resolveSecurityMetadata');
  })());
check('getPositionPrimaryLabel falls back to position.symbol',
  (() => {
    const idx = portfolioContent.indexOf('const getPositionPrimaryLabel');
    const slice = portfolioContent.slice(idx, idx + 300);
    return slice.includes('position.symbol');
  })());
check('getPositionPrimaryLabel falls back to 종목명 미입력',
  (() => {
    const idx = portfolioContent.indexOf('const getPositionPrimaryLabel');
    const slice = portfolioContent.slice(idx, idx + 300);
    return slice.includes('종목명 미입력');
  })());
check('getPositionSecondaryLabel uses resolveSecurityMetadata fallback',
  (() => {
    const idx = portfolioContent.indexOf('const getPositionSecondaryLabel');
    const slice = portfolioContent.slice(idx, idx + 300);
    return slice.includes('resolveSecurityMetadata');
  })());
check('getPositionSecondaryLabel shows symbol when mapping exists',
  (() => {
    const idx = portfolioContent.indexOf('const getPositionSecondaryLabel');
    const slice = portfolioContent.slice(idx, idx + 400);
    return slice.includes('mapped?.name') && slice.includes('position.symbol');
  })());
check('getPositionSecondaryLabel still uses 티커 직접 입력 for unknown symbol',
  portfolioContent.includes('티커 직접 입력'));
log('');

// ---------------------------------------------------------------------------
// Group 6: Chart AI link symbol preserved
// ---------------------------------------------------------------------------
log('--- Group 6: Chart AI link ---');

check('getChartAiHref still defined',
  portfolioContent.includes('const getChartAiHref'));
check('getChartAiHref still sets symbol parameter',
  (() => {
    const idx = portfolioContent.indexOf('const getChartAiHref');
    const slice = portfolioContent.slice(idx, idx + 300);
    return slice.includes("params.set('symbol'") || slice.includes('params.set("symbol"');
  })());
check('getChartAiHref uses resolved display label via getPositionPrimaryLabel',
  (() => {
    const idx = portfolioContent.indexOf('const getChartAiHref');
    const slice = portfolioContent.slice(idx, idx + 300);
    return slice.includes('getPositionPrimaryLabel');
  })());
log('');

// ---------------------------------------------------------------------------
// Group 7: Logo/avatar behavior preserved
// ---------------------------------------------------------------------------
log('--- Group 7: Logo and avatar behavior ---');

check('getLogoMapping still defined',
  portfolioContent.includes('const getLogoMapping'));
check('getLogoMapping checks position.symbol',
  (() => {
    const idx = portfolioContent.indexOf('const getLogoMapping');
    const slice = portfolioContent.slice(idx, idx + 200);
    return slice.includes('position.symbol');
  })());
check('getSafeLogoUrl still defined',
  portfolioContent.includes('const getSafeLogoUrl'));
check('getAvatarText still defined',
  portfolioContent.includes('const getAvatarText'));
log('');

// ---------------------------------------------------------------------------
// Group 8: 3BX valuation mapping no-regression
// ---------------------------------------------------------------------------
log('--- Group 8: 3BX valuation mapping no-regression ---');

check('loadValuation still present',
  portfolioContent.includes('const loadValuation = async'));
check('source: fixture still sent',
  portfolioContent.includes("source: 'fixture'") || portfolioContent.includes('source: "fixture"'));
check('source: live NOT introduced',
  !portfolioContent.includes("source: 'live'") && !portfolioContent.includes('source: "live"'));
check('source: auto NOT introduced',
  !portfolioContent.includes("source: 'auto'") && !portfolioContent.includes('source: "auto"'));
check('positionValuations state field still present',
  portfolioContent.includes('positionValuations'));
check('currentPrice mapped in renderPositions',
  portfolioContent.includes('currentPrice'));
check('marketValue mapped in renderPositions',
  portfolioContent.includes('marketValue'));
check('unrealizedPnlPct mapped',
  portfolioContent.includes('unrealizedPnlPct'));
check('unrealizedPnl mapped',
  portfolioContent.includes('unrealizedPnl'));
check('연동 예정 fallback retained',
  portfolioContent.includes('연동 예정'));
check('데이터 대기 dividend fallback retained',
  portfolioContent.includes('데이터 대기'));
log('');

// ---------------------------------------------------------------------------
// Group 9: Tab persistence no-regression
// ---------------------------------------------------------------------------
log('--- Group 9: Tab persistence no-regression ---');

check('TAB_ORDER_STORAGE_KEY present',
  portfolioContent.includes('TAB_ORDER_STORAGE_KEY'));
check('readTabOrderFromStorage present',
  portfolioContent.includes('readTabOrderFromStorage'));
check('saveTabOrderToStorage present',
  portfolioContent.includes('saveTabOrderToStorage'));
log('');

// ---------------------------------------------------------------------------
// Group 10: Safety boundaries
// ---------------------------------------------------------------------------
log('--- Group 10: Safety boundaries ---');

check('No external fetch added to portfolio page (no live KIS)',
  !portfolioContent.includes('/uapi/domestic-stock'));
check('No KIS OAuth endpoint',
  !portfolioContent.includes('oauth2/tokenP'));
check('No KIS_APP_KEY read',
  !portfolioContent.includes('KIS_APP_KEY'));
check('No gnews.io reference',
  !portfolioContent.includes('gnews.io'));
check('No GNEWS_API_KEY read',
  !portfolioContent.includes('GNEWS_API_KEY'));
check('No process.env read',
  !portfolioContent.includes('process.env'));
check('No import.meta.env read',
  !portfolioContent.includes('import.meta.env'));
check('No setInterval added',
  !portfolioContent.includes('setInterval'));
check('No polling keyword added',
  !portfolioContent.includes('polling'));
check('No cron keyword added',
  !portfolioContent.includes('cron'));
check('No supabaseAdmin import',
  !portfolioContent.includes('supabaseAdmin'));
check('No DB migration SQL',
  !portfolioContent.includes('CREATE TABLE') && !portfolioContent.includes('ALTER TABLE'));
check('No Vercel URL reference',
  !portfolioContent.includes('vercel.app') && !portfolioContent.includes('vercel.com'));
check('No 실시간 시세 반영 claim',
  !portfolioContent.includes('실시간 시세 반영'));
check('실시간 only in denial context if present',
  !portfolioContent.includes('실시간') ||
  portfolioContent.includes('실시간 시세가 아닙니다'));
log('');

// ---------------------------------------------------------------------------
// Group 11: Checker network safety
// ---------------------------------------------------------------------------
log('--- Group 11: Checker network safety ---');

let fetchAttempted = false;
const origFetch = globalThis.fetch;
globalThis.fetch = async () => { fetchAttempted = true; throw new Error('blocked'); };
check('Checker itself makes no network calls', !fetchAttempted);
globalThis.fetch = origFetch;
log('');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
log('=== Phase 3BY-HF1 Portfolio Ticker Display Name Resolver — Summary ===');
const total = passes + failures;
log(`Checks passed: ${passes}/${total}`);
log('');

if (failures === 0) {
  log('Result: PASS — ticker display name resolver in place');
  process.exitCode = 0;
} else {
  log(`Result: FAIL (${failures} failure(s))`);
  process.exitCode = 1;
}
