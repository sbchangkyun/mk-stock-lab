/**
 * Static structural validation for Phase 3BD owner-run GNews live smoke script.
 * Verifies guard conditions, security boundaries, output sanitizer, route isolation.
 * No network calls. No .env file reads. Exits non-zero on any failure.
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const SMOKE_SCRIPT_PATH = join(root, 'scripts', 'owner_smoke_gnews_live_fetch.mjs');
const STATIC_CHECKER_PATH = join(root, 'scripts', 'check_gnews_live_smoke_script_static_contract.mjs');
const DRY_RUN_CHECKER_PATH = join(root, 'scripts', 'check_gnews_live_smoke_script_dry_run.mjs');
const ADAPTER_PATH = join(root, 'src', 'lib', 'news', 'gnewsLiveFetchAdapter.mjs');
const ROUTE_PATH = join(root, 'src', 'pages', 'api', 'news', 'market-feed.ts');
const HELPER_PATH = join(root, 'src', 'lib', 'news', 'gnewsMarketFeedResponse.mjs');
const HOME_PAGE_PATH = join(root, 'src', 'pages', 'index.astro');
const NEWS_PAGE_PATH = join(root, 'src', 'pages', 'news');
const MIGRATIONS_PATH = join(root, 'supabase', 'migrations');
const PACKAGE_JSON_PATH = join(root, 'package.json');

const log = (msg) => process.stdout.write(msg + '\n');

let failures = 0;
const check = (label, pass) => {
  const status = pass ? 'PASS' : 'FAIL';
  log(`  [${status}] ${label}`);
  if (!pass) failures++;
};

log('=== GNews Live Smoke Script Static Contract Check (Phase 3BD) ===');
log('');

// ---------------------------------------------------------------------------
// Group 1: Artifact existence
// ---------------------------------------------------------------------------
log('--- Group 1: Artifact existence ---');

const smokeExists = existsSync(SMOKE_SCRIPT_PATH);
check('Owner smoke script exists (owner_smoke_gnews_live_fetch.mjs)', smokeExists);
check('Static smoke checker exists (check_gnews_live_smoke_script_static_contract.mjs)', existsSync(STATIC_CHECKER_PATH));
check('Dry-run smoke checker exists (check_gnews_live_smoke_script_dry_run.mjs)', existsSync(DRY_RUN_CHECKER_PATH));

let pkg = {};
try { pkg = JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf8')); } catch {}
check(
  'package.json includes smoke:gnews-live:dry script',
  typeof pkg.scripts?.['smoke:gnews-live:dry'] === 'string',
);
check(
  'package.json includes check:gnews-live-smoke-script',
  typeof pkg.scripts?.['check:gnews-live-smoke-script'] === 'string',
);
check(
  'package.json includes check:gnews-live-smoke-dry-run',
  typeof pkg.scripts?.['check:gnews-live-smoke-dry-run'] === 'string',
);
log('');

// ---------------------------------------------------------------------------
// Group 2: Package script safety
// ---------------------------------------------------------------------------
log('--- Group 2: Package script safety ---');

const dryRunScript = pkg.scripts?.['smoke:gnews-live:dry'] ?? '';
check(
  'smoke:gnews-live:dry runs owner smoke script',
  dryRunScript.includes('owner_smoke_gnews_live_fetch'),
);
check(
  'smoke:gnews-live:dry passes --dry-run flag',
  dryRunScript.includes('--dry-run'),
);
check(
  'smoke:gnews-live:dry does not pass --execute-live flag',
  !dryRunScript.includes('--execute-live'),
);

// Verify no package script runs the live mode of the smoke script
const allScriptValues = Object.values(pkg.scripts ?? {}).join('\n');
check(
  'No package script executes owner smoke in live mode (--execute-live not in any script)',
  !allScriptValues.includes('owner_smoke_gnews_live_fetch') ||
  !allScriptValues.split('\n').some((s) => s.includes('owner_smoke_gnews_live_fetch') && s.includes('--execute-live')),
);
log('');

if (!smokeExists) {
  log('ERROR: Smoke script missing — skipping content checks.');
  process.exitCode = 1;
} else {
  const smoke = readFileSync(SMOKE_SCRIPT_PATH, 'utf8');

  // ---------------------------------------------------------------------------
  // Group 3: CLI flag guards
  // ---------------------------------------------------------------------------
  log('--- Group 3: CLI flag guards ---');
  check('Smoke script checks for --dry-run flag', smoke.includes('--dry-run'));
  check('Smoke script checks for --execute-live flag', smoke.includes('--execute-live'));
  check('Smoke script checks for --confirm-owner-approved flag', smoke.includes('--confirm-owner-approved'));
  check(
    'Smoke script defaults to dry-run when --execute-live is absent (isDryRun or similar)',
    smoke.includes('isDryRun') || smoke.includes('dryRun') || smoke.includes('dry-run'),
  );
  check(
    'Smoke script blocks live mode without --execute-live (executeLiveFlag check)',
    smoke.includes('executeLiveFlag') || smoke.includes('execute-live'),
  );
  log('');

  // ---------------------------------------------------------------------------
  // Group 4: Environment variable guard conditions
  // ---------------------------------------------------------------------------
  log('--- Group 4: Environment variable guard conditions ---');
  check('Smoke script checks GNEWS_LIVE_ENABLED', smoke.includes('GNEWS_LIVE_ENABLED'));
  check('Smoke script requires GNEWS_LIVE_ENABLED === "true"',
    smoke.includes("=== 'true'") || smoke.includes('=== "true"') ||
    smoke.includes("!== 'true'") || smoke.includes('!== "true"'));
  check('Smoke script checks GNEWS_BASE_URL', smoke.includes('GNEWS_BASE_URL'));
  check('Smoke script checks GNEWS_API_KEY (preferred key)', smoke.includes('GNEWS_API_KEY'));
  check('Smoke script checks PUBLIC_GNEWS_API_KEY (server-side fallback)', smoke.includes('PUBLIC_GNEWS_API_KEY'));
  check('Smoke script blocks VERCEL_ENV=production', smoke.includes('VERCEL_ENV') && smoke.includes('production'));
  check(
    'Smoke script clamps maxThemes to 2 (MAX_THEMES_CAP or Math.min with 2)',
    smoke.includes('MAX_THEMES_CAP') || (smoke.includes('Math.min') && smoke.includes('2')),
  );
  log('');

  // ---------------------------------------------------------------------------
  // Group 5: Env reads gated behind live flag
  // ---------------------------------------------------------------------------
  log('--- Group 5: Env reads gated in live branch ---');
  // The env reads must appear inside checkLiveGuards or equivalent, which is only called in live branch.
  check(
    'Smoke script has a guard function or block that contains env reads (checkLiveGuards or equivalent)',
    smoke.includes('checkLiveGuards') || smoke.includes('liveGuards') || smoke.includes('guard'),
  );
  check(
    'runDryRun exported function does not contain process.env references',
    (() => {
      // Extract the runDryRun function body by finding its declaration
      const start = smoke.indexOf('export function runDryRun');
      if (start === -1) return false;
      // Use the position of `const checkLiveGuards` or first 500 chars as boundary
      const guardStart = smoke.indexOf('checkLiveGuards');
      const dryRunBody = guardStart > start ? smoke.slice(start, guardStart) : smoke.slice(start, start + 500);
      // Strip single-line comments before checking so comments about process.env don't falsely match
      const dryRunBodyNoComments = dryRunBody.replace(/\/\/[^\n]*/g, '');
      return !dryRunBodyNoComments.includes('process.env');
    })(),
  );
  log('');

  // ---------------------------------------------------------------------------
  // Group 6: Security — no forbidden imports
  // ---------------------------------------------------------------------------
  log('--- Group 6: Security — no forbidden imports ---');
  check('Smoke script does not import dotenv', !smoke.includes("from 'dotenv'") && !smoke.includes('"dotenv"') && !smoke.includes('dotenv/config'));
  check('Smoke script does not read .env files directly', !smoke.includes(".env'") && !smoke.includes('.env"') && !smoke.includes('readFileSync') || !smoke.includes('.env'));
  check('Smoke script does not import @supabase', !smoke.includes('@supabase'));
  check('Smoke script does not import KIS provider', !smoke.includes('kisProvider') && !smoke.includes('kis_provider') && !smoke.includes('/server/providers/'));
  check('Smoke script does not import Vercel', !smoke.includes("from '@vercel'") && !smoke.includes('"@vercel'));
  check('Smoke script does not import the route or helper',
    !smoke.includes('gnewsMarketFeedResponse') &&
    // Check for import statements containing market-feed, not comments
    !(/^import\s.*market-feed/m.test(smoke)) &&
    !(/from\s+['"].*market-feed/.test(smoke)));
  log('');

  // ---------------------------------------------------------------------------
  // Group 7: Security — no file write, no Supabase
  // ---------------------------------------------------------------------------
  log('--- Group 7: Security — no filesystem writes, no Supabase ---');
  check('Smoke script does not call writeFileSync', !smoke.includes('writeFileSync'));
  check('Smoke script does not call appendFileSync', !smoke.includes('appendFileSync'));
  check('Smoke script does not call writeFile(', !smoke.includes('writeFile('));
  check('Smoke script does not call createWriteStream', !smoke.includes('createWriteStream'));
  log('');

  // ---------------------------------------------------------------------------
  // Group 8: Adapter imports
  // ---------------------------------------------------------------------------
  log('--- Group 8: Adapter function imports ---');
  check('Smoke script imports from gnewsLiveFetchAdapter.mjs', smoke.includes('gnewsLiveFetchAdapter.mjs'));
  check('Smoke script imports GNEWS_QUERY_DEFINITIONS', smoke.includes('GNEWS_QUERY_DEFINITIONS'));
  check('Smoke script imports fetchGnewsMarketNewsBatch', smoke.includes('fetchGnewsMarketNewsBatch'));
  check('Smoke script imports summarizeGnewsLiveFetchResult', smoke.includes('summarizeGnewsLiveFetchResult'));
  log('');

  // ---------------------------------------------------------------------------
  // Group 9: Live fetch implementation
  // ---------------------------------------------------------------------------
  log('--- Group 9: Live fetch implementation ---');
  check('Smoke script uses globalThis.fetch in live branch', smoke.includes('globalThis.fetch'));
  check('Smoke script does not call bare fetch() outside adapter injection', (() => {
    // Remove globalThis.fetch and fetchFn references, then check for bare fetch(
    const stripped = smoke.replace(/globalThis\.fetch/g, '_GLOBAL_FETCH_').replace(/\bfetchFn\b/g, '_MOCK_FN_');
    return !/\bfetch\s*\(/.test(stripped);
  })());
  check('Smoke script passes maxThemes to batch call', smoke.includes('maxThemes'));
  check('Smoke script uses summarizeGnewsLiveFetchResult for output', smoke.includes('summarizeGnewsLiveFetchResult'));
  check('Smoke script uses nowIso timestamp', smoke.includes('nowIso'));
  log('');

  // ---------------------------------------------------------------------------
  // Group 10: Output safety — no forbidden output
  // ---------------------------------------------------------------------------
  log('--- Group 10: Output safety ---');
  check(
    'Smoke script has a forbidden output guard (FORBIDDEN_OUTPUT_PATTERN or similar)',
    smoke.includes('FORBIDDEN_OUTPUT') || smoke.includes('safeLog') || smoke.includes('forbidden'),
  );
  check(
    'Smoke script does not log articles array directly',
    !smoke.includes('summary.articles') && !smoke.includes('.articles.map') && !smoke.includes('JSON.stringify(batchResult'),
  );
  check(
    'Smoke script does not log full URLs directly',
    !smoke.includes('guard.baseUrl') || !smoke.includes('logStep') ||
    // guard.baseUrl must only be passed to the adapter, not to logStep/log
    !smoke.includes('logStep(') || (() => {
      // Check that guard.baseUrl doesn't appear as a logStep argument
      const logStepCalls = smoke.match(/logStep\s*\([^)]*guard\.baseUrl[^)]*\)/g);
      return !logStepCalls || logStepCalls.length === 0;
    })(),
  );
  check(
    'Smoke script does not log API key values (guard.apiKey not in logStep)',
    (() => {
      const logStepCalls = smoke.match(/logStep\s*\([^)]*guard\.apiKey[^)]*\)/g);
      return !logStepCalls || logStepCalls.length === 0;
    })(),
  );
  check(
    'Smoke script does not use JSON.stringify on raw batch result',
    !smoke.includes('JSON.stringify(batchResult') && !smoke.includes('JSON.stringify(rawResult'),
  );
  log('');

  // ---------------------------------------------------------------------------
  // Group 11: Direct execution guard
  // ---------------------------------------------------------------------------
  log('--- Group 11: Direct execution guard (import safety) ---');
  check(
    'Smoke script guards main() execution when imported (process.argv[1] check or equivalent)',
    smoke.includes('process.argv[1]') && (smoke.includes('endsWith') || smoke.includes('owner_smoke_gnews_live_fetch')),
  );
  check(
    'Smoke script exports runDryRun for external invocation by dry-run checker',
    smoke.includes('export function runDryRun') || smoke.includes('export const runDryRun'),
  );
  log('');

  // ---------------------------------------------------------------------------
  // Group 14: Phase 3BE-R1 — theme selection and base URL guard
  // ---------------------------------------------------------------------------
  log('--- Group 14: Phase 3BE-R1 theme selection and base URL guard ---');
  check('Smoke script supports --theme flag', smoke.includes('--theme='));
  check('Smoke script exports SMOKE_ALLOWED_THEME_KEYS', smoke.includes('SMOKE_ALLOWED_THEME_KEYS'));
  check('Smoke script allowlist contains all 6 valid queryKeys',
    smoke.includes('market_stocks') && smoke.includes('macro_policy') && smoke.includes('fx') &&
    smoke.includes('oil_commodities') && smoke.includes('crypto_digital_assets') && smoke.includes('personal_finance'));
  check('Smoke script defines invalid_theme reason code', smoke.includes('invalid_theme'));
  check('Smoke script exports parseThemeArg helper',
    smoke.includes('export function parseThemeArg') || smoke.includes('export const parseThemeArg'));
  check('Smoke script exports selectSmokeThemeDefinitions helper', smoke.includes('selectSmokeThemeDefinitions'));
  check('Smoke script exports validateEndpointOnlyBaseUrl helper',
    smoke.includes('export function validateEndpointOnlyBaseUrl') || smoke.includes('export const validateEndpointOnlyBaseUrl'));
  check('Smoke script defines invalid_base_url reason code', smoke.includes('invalid_base_url'));
  check('Smoke script validates endpoint-only baseUrl (uses validateEndpointOnlyBaseUrl in live guard)',
    smoke.includes('validateEndpointOnlyBaseUrl'));
  check('Smoke script rejects query strings in GNEWS_BASE_URL (checks search or query param presence)',
    smoke.includes('.search') || smoke.includes('parsed.search') || smoke.includes('url.search'));
  check('Smoke script rejects embedded apikey/key/token/q fragments in base URL',
    smoke.includes('apikey=') && (smoke.includes('key=') || smoke.includes('token=')));
  check('Smoke script does not log queryString in any logStep call',
    (() => {
      const calls = smoke.match(/logStep\s*\([^)]*queryString[^)]*\)/g);
      return !calls || calls.length === 0;
    })());
  check('Smoke script does not log guard.baseUrl in any logStep call',
    (() => {
      const calls = smoke.match(/logStep\s*\([^)]*guard\.baseUrl[^)]*\)/g);
      return !calls || calls.length === 0;
    })());
  check('Smoke script does not log raw q parameter values (no logStep with q=... value)',
    (() => {
      // Check for logStep calls containing a literal q= key-value pattern
      const calls = smoke.match(/logStep\s*\([^)]*,\s*['"`]q=[^)]*\)/g);
      return !calls || calls.length === 0;
    })());
  log('');

  // ---------------------------------------------------------------------------
  // Group 15: Phase 3BE-R3 — query profile selector
  // ---------------------------------------------------------------------------
  log('--- Group 15: Phase 3BE-R3 query profile selector ---');
  check('Smoke script supports --query-profile flag', smoke.includes('--query-profile='));
  check('Smoke script defines allowed profiles policy and simple',
    smoke.includes("'policy'") && smoke.includes("'simple'"));
  check('Smoke script has invalid_query_profile reason code', smoke.includes('invalid_query_profile'));
  check('Smoke script exports parseQueryProfileArg helper',
    smoke.includes('export function parseQueryProfileArg') || smoke.includes('export const parseQueryProfileArg'));
  check('Smoke script exports validateQueryProfile helper',
    smoke.includes('export function validateQueryProfile') || smoke.includes('export const validateQueryProfile'));
  check('Smoke script exports applySmokeQueryProfile helper',
    smoke.includes('export function applySmokeQueryProfile') || smoke.includes('export const applySmokeQueryProfile'));
  check('Smoke script defines SMOKE_QUERY_PROFILE_SIMPLE_MAP', smoke.includes('SMOKE_QUERY_PROFILE_SIMPLE_MAP'));
  check('Smoke script simple map includes all 6 smoke query terms',
    smoke.includes('주식') && smoke.includes('금리') && smoke.includes('환율') &&
    smoke.includes('유가') && smoke.includes('비트코인') && smoke.includes('재테크'));
  check('Smoke script clones definitions in applySmokeQueryProfile (spread or map)',
    smoke.includes('...def') || (smoke.includes('.map(') && smoke.includes('queryString:')));
  check('Smoke script validates query profile before env reads (validateQueryProfile before checkLiveGuards)',
    (() => {
      const profileCheckIdx = smoke.indexOf('validateQueryProfile');
      const guardCallIdx = smoke.indexOf('checkLiveGuards()');
      return profileCheckIdx > -1 && guardCallIdx > -1 && profileCheckIdx < guardCallIdx;
    })());
  check('Smoke script does not log queryString value in query-profile logStep',
    (() => {
      const calls = smoke.match(/logStep\s*\([^)]*query-profile[^)]*\)/g) ?? [];
      return calls.every((call) => !call.includes('queryString'));
    })());
  check('Smoke script applies query profile to effective definitions before fetch',
    smoke.includes('applySmokeQueryProfile') && smoke.includes('effectiveDefinitions'));
  log('');
}

// ---------------------------------------------------------------------------
// Group 12: Route boundary isolation
// ---------------------------------------------------------------------------
log('--- Group 12: Route boundary isolation ---');

const helperContent = existsSync(HELPER_PATH) ? readFileSync(HELPER_PATH, 'utf8') : '';
const routeContent = existsSync(ROUTE_PATH) ? readFileSync(ROUTE_PATH, 'utf8') : '';

check(
  'Existing route still returns liveEnabled: false',
  helperContent.includes('liveEnabled: false') || routeContent.includes('liveEnabled: false'),
);
check(
  "Existing route/helper still contains source: 'fixture'",
  helperContent.includes("source: 'fixture'") || helperContent.includes('source: "fixture"') ||
  routeContent.includes("source: 'fixture'") || routeContent.includes('source: "fixture"'),
);
check(
  'Existing route does not import gnewsLiveFetchAdapter',
  !routeContent.includes('gnewsLiveFetchAdapter'),
);
check(
  'Existing route does not import owner smoke script',
  !routeContent.includes('owner_smoke_gnews_live_fetch'),
);

const homeContent = existsSync(HOME_PAGE_PATH) ? readFileSync(HOME_PAGE_PATH, 'utf8') : '';
check('Home page does not import gnewsLiveFetchAdapter', !homeContent.includes('gnewsLiveFetchAdapter'));
check('Home page does not import owner smoke script', !homeContent.includes('owner_smoke_gnews_live_fetch'));

check('No /news page created', !existsSync(NEWS_PAGE_PATH));

const hasMigration = existsSync(MIGRATIONS_PATH) &&
  readdirSync(MIGRATIONS_PATH).some((f) => f.toLowerCase().includes('gnews'));
check('No gnews migration files added', !hasMigration);
log('');

// ---------------------------------------------------------------------------
// Group 13: Self-check
// ---------------------------------------------------------------------------
log('--- Group 13: Checker self-check ---');
const selfContent = readFileSync(fileURLToPath(import.meta.url), 'utf8');
const selfActualFetch =
  /(?:await|=\s*|return\s+)fetch\s*\(/.test(selfContent) ||
  /\bfetch\s*\(\s*['"`]https?:/.test(selfContent);
check('Checker script makes no HTTP requests', !selfActualFetch);
check(
  'Checker script does not call dotenv or read .env file contents',
  !/dotenv\.config/.test(selfContent) && !/readFileSync\s*\(\s*['"`][^'"`)]*\.env/.test(selfContent),
);
log('');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
log('=== Result ===');
if (failures === 0) {
  log('All checks passed. Exit 0.');
  process.exitCode = 0;
} else {
  log(`${failures} check(s) failed. Exit 1.`);
  process.exitCode = 1;
}
