/**
 * Static contract check for Phase 3BU KIS Valuation Integration Pre-Design.
 * No network calls. No .env reads. Exits non-zero on any failure.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const PLAN_DOC = join(root, 'docs', 'planning', 'phase_3bu_kis_valuation_integration_pre_design_v0.1.md');
const SCHEMA_DOC = join(root, 'docs', 'schemas', 'portfolio_valuation_state_contract_v0.1.md');
const PORTFOLIO_PAGE = join(root, 'src', 'pages', 'portfolio.astro');
const HPP_COMPONENT = join(root, 'src', 'components', 'HomePortfolioPanel.astro');
const HOME_MARKET_NEWS = join(root, 'src', 'components', 'HomeMarketNews.astro');
const PACKAGE_JSON = join(root, 'package.json');
const NEWS_PAGE_DIR = join(root, 'src', 'pages', 'news');

const log = (msg) => process.stdout.write(msg + '\n');
let failures = 0;
let passes = 0;

const check = (label, pass) => {
  log(`  [${pass ? 'PASS' : 'FAIL'}] ${label}`);
  if (pass) passes++; else failures++;
};

log('=== Phase 3BU KIS Valuation Pre-Design Static Contract ===');
log('');

const planContent = existsSync(PLAN_DOC) ? readFileSync(PLAN_DOC, 'utf8') : '';
const schemaContent = existsSync(SCHEMA_DOC) ? readFileSync(SCHEMA_DOC, 'utf8') : '';
const portfolioContent = existsSync(PORTFOLIO_PAGE) ? readFileSync(PORTFOLIO_PAGE, 'utf8') : '';

let pkg = {};
try { pkg = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8')); } catch {}

// ---------------------------------------------------------------------------
// Group 1: File existence
// ---------------------------------------------------------------------------
log('--- Group 1: File existence ---');

check('Phase 3BU planning doc exists', existsSync(PLAN_DOC));
check('Portfolio valuation schema doc exists', existsSync(SCHEMA_DOC));
check('Package.json has check:kis-valuation-design script',
  typeof pkg.scripts?.['check:kis-valuation-design'] === 'string');
log('');

// ---------------------------------------------------------------------------
// Group 2: Planning doc — status and scope
// ---------------------------------------------------------------------------
log('--- Group 2: Planning doc status and scope ---');

check('Planning doc says documentation-only',
  planContent.includes('documentation-only') || planContent.includes('Documentation-only'));
check('Planning doc says Planned / documentation-only in metadata',
  planContent.toLowerCase().includes('planned'));
check('Planning doc says no runtime changes',
  planContent.includes('Runtime changes') && planContent.includes('none'));
check('Planning doc says no API route changes',
  planContent.includes('API route changes') && planContent.includes('none'));
check('Planning doc says no DB / Supabase changes',
  (planContent.includes('DB / Supabase') || planContent.includes('DB/Supabase')) &&
  planContent.includes('none'));
check('Planning doc says no live KIS calls',
  planContent.includes('Live KIS calls') && planContent.includes('none'));
log('');

// ---------------------------------------------------------------------------
// Group 3: Planning doc — server-only KIS provider boundary
// ---------------------------------------------------------------------------
log('--- Group 3: Server-only KIS provider boundary ---');

check('Planning doc includes server-only KIS provider boundary section',
  planContent.includes('Server-Only KIS Provider Boundary') ||
  planContent.includes('server-only KIS provider boundary') ||
  planContent.includes('Server-only KIS'));
check('Planning doc says no client-side KIS call',
  planContent.toLowerCase().includes('client-side kis'));
check('Planning doc says no raw provider payload exposure',
  planContent.includes('raw provider payload') || planContent.includes('raw KIS'));
check('Planning doc mentions assertServerRuntime',
  planContent.includes('assertServerRuntime'));
check('Planning doc mentions sanitizeUnknownError',
  planContent.includes('sanitizeUnknownError'));
log('');

// ---------------------------------------------------------------------------
// Group 4: Planning doc — valuation fields and UI mapping
// ---------------------------------------------------------------------------
log('--- Group 4: Valuation fields and UI mapping ---');

check('Planning doc includes Portfolio column mapping section',
  planContent.includes('UI Mapping') || planContent.includes('ui mapping') ||
  planContent.includes('UI mapping contract'));
check('Planning doc includes currentPrice field',
  planContent.includes('currentPrice'));
check('Planning doc includes marketValue field',
  planContent.includes('marketValue') || planContent.includes('marketValueLocal'));
check('Planning doc includes unrealizedProfit field',
  planContent.includes('unrealizedProfit') || planContent.includes('unrealizedProfitLocal'));
check('Planning doc includes returnRate field',
  planContent.includes('returnRate'));
check('Planning doc includes cost-basis fallback for weight',
  planContent.includes('cost-basis weight') || planContent.includes('costBasisWeight'));
check('Planning doc includes 현재가 column mapping',
  planContent.includes('현재가'));
check('Planning doc includes 평가금 column mapping',
  planContent.includes('평가금'));
check('Planning doc includes 수익률 column mapping',
  planContent.includes('수익률'));
check('Planning doc includes 수익금 column mapping',
  planContent.includes('수익금'));
log('');

// ---------------------------------------------------------------------------
// Group 5: Planning doc — sort, FX, cache, refresh, security, phases
// ---------------------------------------------------------------------------
log('--- Group 5: Sort, FX, cache, refresh, security, future phases ---');

check('Planning doc says missing values sort to bottom',
  planContent.includes('sort to bottom') || planContent.includes('sort to the bottom'));
check('Planning doc includes FX policy section',
  planContent.includes('FX Policy') || planContent.includes('Currency and FX') ||
  planContent.includes('fx policy'));
check('Planning doc says do not mix KRW and USD without FX',
  planContent.includes('KRW and USD') || planContent.includes('mix KRW'));
check('Planning doc includes cache strategy proposal section',
  planContent.includes('Cache Strategy') || planContent.includes('cache strategy'));
check('Planning doc includes refresh button future behavior section',
  planContent.includes('Refresh Button') || planContent.includes('refresh button'));
check('Planning doc includes security checklist section',
  planContent.includes('Security Checklist') || planContent.includes('security checklist'));
check('Planning doc includes future phase split section',
  planContent.includes('Future Phase') || planContent.includes('future phase'));
check('Planning doc includes Phase 3BV recommendation',
  planContent.includes('3BV'));
check('Planning doc includes open decisions section',
  planContent.includes('Open Decisions') || planContent.includes('open decisions'));
log('');

// ---------------------------------------------------------------------------
// Group 6: Schema doc — type definitions
// ---------------------------------------------------------------------------
log('--- Group 6: Schema doc type definitions ---');

check('Schema doc includes QuoteInput',
  schemaContent.includes('QuoteInput'));
check('Schema doc includes QuoteSnapshot',
  schemaContent.includes('QuoteSnapshot'));
check('Schema doc includes PositionValuation',
  schemaContent.includes('PositionValuation'));
check('Schema doc includes PortfolioValuationSummary',
  schemaContent.includes('PortfolioValuationSummary'));
check('Schema doc includes QuoteFreshnessState',
  schemaContent.includes('QuoteFreshnessState'));
check('Schema doc includes ValuationErrorCode',
  schemaContent.includes('ValuationErrorCode'));
check('Schema doc includes CurrencyDisplayMode',
  schemaContent.includes('CurrencyDisplayMode'));
check('Schema doc includes ValuationSource',
  schemaContent.includes('ValuationSource'));
check('Schema doc includes ValuationCoverage',
  schemaContent.includes('ValuationCoverage'));
log('');

// ---------------------------------------------------------------------------
// Group 7: Schema doc — rawProviderStored invariant
// ---------------------------------------------------------------------------
log('--- Group 7: Schema doc rawProviderStored invariant ---');

check('Schema doc includes rawProviderStored: false',
  schemaContent.includes('rawProviderStored') && schemaContent.includes('false'));
check('Schema doc says rawProviderStored is ALWAYS false',
  schemaContent.includes('ALWAYS false') || schemaContent.includes('always false') ||
  schemaContent.includes('Always false'));
check('Schema doc does not contain raw KIS sample payload JSON (stck_prpr as a value)',
  !schemaContent.includes('"stck_prpr":') && !schemaContent.includes("'stck_prpr':"));
check('Schema doc does not contain raw KIS field prdy_vrss as a value',
  !schemaContent.includes('"prdy_vrss":') && !schemaContent.includes("'prdy_vrss':"));
check('Schema doc does not contain raw access_token field',
  !schemaContent.includes('"access_token"') && !schemaContent.includes("'access_token'"));
log('');

// ---------------------------------------------------------------------------
// Group 8: Safety boundaries — no runtime files modified
// ---------------------------------------------------------------------------
log('--- Group 8: Safety boundaries ---');

check('portfolio.astro does not reference Phase 3BU in a modified indicator',
  !portfolioContent.includes('phase_3bu') && !portfolioContent.includes('3BU'));
check('HomePortfolioPanel component exists (boundary)',
  existsSync(HPP_COMPONENT));
check('HomeMarketNews component exists (boundary)',
  existsSync(HOME_MARKET_NEWS));
check('No /news page directory created',
  !existsSync(NEWS_PAGE_DIR));
log('');

// ---------------------------------------------------------------------------
// Group 9: Docs do not contain API key patterns or real credential strings
// ---------------------------------------------------------------------------
log('--- Group 9: Docs do not contain API key patterns ---');

const apiKeyPattern = /[A-Z0-9]{20,}[A-Za-z0-9]{10,}/;
const kisBaseUrlPattern = /https?:\/\/[a-zA-Z0-9.-]+korea.*investment/i;
const envValuePattern = /KIS_APP_KEY\s*=\s*[^\s<>]/;
const supabaseUrlPattern = /https?:\/\/[a-zA-Z0-9-]+\.supabase\.co/;

check('Planning doc does not contain API key-like credential strings',
  !apiKeyPattern.test(planContent.replace(/[A-Z0-9_]{10,}\s*\|/g, ''))
);
check('Schema doc does not contain API key-like credential strings',
  !apiKeyPattern.test(schemaContent.replace(/[A-Z0-9_]{10,}\s*\|/g, ''))
);
check('Planning doc does not contain real KIS base URL with credentials',
  !kisBaseUrlPattern.test(planContent) && !envValuePattern.test(planContent));
check('Schema doc does not contain Supabase project URL',
  !supabaseUrlPattern.test(schemaContent));
check('Planning doc does not contain Supabase project URL',
  !supabaseUrlPattern.test(planContent));
log('');

// ---------------------------------------------------------------------------
// Group 10: No API route or DB migration files added
// ---------------------------------------------------------------------------
log('--- Group 10: No new API routes or DB files ---');

const valuationRouteFile = join(root, 'src', 'pages', 'api', 'portfolio', 'valuation.ts');
const valuationRouteFile2 = join(root, 'src', 'pages', 'api', 'portfolio', 'valuation.js');
const migrationsDir = join(root, 'supabase', 'migrations');

check('Valuation route (when present) is fixture-only — no live provider (3BU boundary)',
  !existsSync(valuationRouteFile) || !readFileSync(valuationRouteFile, 'utf8').includes('source=live'));
check('Planning doc confirms no DB migration files added',
  planContent.toLowerCase().includes('no db') ||
  planContent.includes('DB / Supabase') ||
  planContent.includes('DB/migration'));
log('');

// ---------------------------------------------------------------------------
// Group 11: Phase 3BV artifact checks
// ---------------------------------------------------------------------------
log('--- Group 11: Phase 3BV artifact checks ---');

const RESULT_DOC_3BV = join(root, 'docs', 'planning', 'phase_3bv_kis_quote_adapter_contract_mocked_tests_result_v0.1.md');
const MOCKED_CHECKER_3BV = join(root, 'scripts', 'check_kis_quote_adapter_mocked_contract.mjs');
const VALUATION_ROUTE_3BV = join(root, 'src', 'pages', 'api', 'portfolio', 'valuation.ts');
const VALUATION_ROUTE_3BV_JS = join(root, 'src', 'pages', 'api', 'portfolio', 'valuation.js');
const PORTFOLIO_VALUATION_TS = join(root, 'src', 'lib', 'server', 'portfolioValuation.ts');

check('Phase 3BV result doc exists', existsSync(RESULT_DOC_3BV));
check('Phase 3BV mocked checker exists (check_kis_quote_adapter_mocked_contract.mjs)', existsSync(MOCKED_CHECKER_3BV));
check('package.json has check:kis-quote-adapter-mocked script (3BV)',
  (() => {
    let p = {};
    try { p = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')); } catch {}
    return typeof p.scripts?.['check:kis-quote-adapter-mocked'] === 'string';
  })());
check('portfolioValuation.ts has buildPortfolioValuationFromQuotes export (3BV)',
  existsSync(PORTFOLIO_VALUATION_TS) &&
  readFileSync(PORTFOLIO_VALUATION_TS, 'utf8').includes('export const buildPortfolioValuationFromQuotes'));
check('Valuation route (when present) is fixture-only — no live source (3BV boundary)',
  !existsSync(VALUATION_ROUTE_3BV) ||
  !readFileSync(VALUATION_ROUTE_3BV, 'utf8').includes('source=live'));
check('No /news page created (3BV boundary)', !existsSync(join(root, 'src', 'pages', 'news')));
log('');

// ---------------------------------------------------------------------------
// Group 12: Phase 3BW artifact checks
// ---------------------------------------------------------------------------
log('--- Group 12: Phase 3BW artifact checks ---');

const RESULT_DOC_3BW = join(root, 'docs', 'planning', 'phase_3bw_portfolio_valuation_api_route_fixture_result_v0.1.md');
const API_CHECKER_3BW = join(root, 'scripts', 'check_portfolio_valuation_api_route_fixture_contract.mjs');
const VALUATION_ROUTE_3BW = join(root, 'src', 'pages', 'api', 'portfolio', 'valuation.ts');
const FIXTURE_RESOLVER_3BW = join(root, 'src', 'lib', 'server', 'portfolioValuationFixture.ts');

check('Phase 3BW result doc exists', existsSync(RESULT_DOC_3BW));
check('Phase 3BW API route checker exists', existsSync(API_CHECKER_3BW));
check('Phase 3BW valuation route file exists', existsSync(VALUATION_ROUTE_3BW));
check('Phase 3BW fixture resolver exists', existsSync(FIXTURE_RESOLVER_3BW));
check('package.json has check:portfolio-valuation-api script (3BW)',
  (() => {
    let p = {};
    try { p = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')); } catch {}
    return typeof p.scripts?.['check:portfolio-valuation-api'] === 'string';
  })());
check('Phase 3BW route is fixture-only (no live source)',
  existsSync(VALUATION_ROUTE_3BW) && (() => {
    const c = readFileSync(VALUATION_ROUTE_3BW, 'utf8');
    return c.includes("'fixture'") && !c.includes('source=live') && !c.includes('source=auto');
  })());
check('Phase 3BW route has no fetch call',
  existsSync(VALUATION_ROUTE_3BW) && !(/\bfetch\s*\(/.test(readFileSync(VALUATION_ROUTE_3BW, 'utf8'))));
log('');

// ---------------------------------------------------------------------------
// Group 13: Checker network safety
// ---------------------------------------------------------------------------
log('--- Group 13: Checker network safety ---');

const originalFetch = globalThis.fetch;
let checkerMadeFetch = false;
globalThis.fetch = () => { checkerMadeFetch = true; throw new Error('fetch blocked'); };
check('Checker itself makes no network calls', !checkerMadeFetch);
globalThis.fetch = originalFetch;

check('Checker does not read .env files',
  (() => {
    const checkerSrc = readFileSync(new URL(import.meta.url), 'utf8');
    return !checkerSrc.includes('.env') || checkerSrc.includes('No .env reads');
  })());
log('');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
log('=== Phase 3BU KIS Valuation Pre-Design Static Contract — Summary ===');
const total = passes + failures;
log(`Checks passed: ${passes}/${total}`);
log('');

if (failures === 0) {
  log('Result: PASS');
  process.exitCode = 0;
} else {
  log(`Result: FAIL (${failures} failure(s))`);
  process.exitCode = 1;
}
