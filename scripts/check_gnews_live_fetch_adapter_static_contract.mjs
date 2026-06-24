/**
 * Static structural validation for Phase 3BC GNews live fetch adapter skeleton.
 * Verifies the adapter module structure, security boundaries, and route isolation.
 * No network calls. No .env file reads. Exits non-zero on any failure.
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const ADAPTER_PATH = join(root, 'src', 'lib', 'news', 'gnewsLiveFetchAdapter.mjs');
const ADAPTER_TS_PATH = join(root, 'src', 'lib', 'news', 'gnewsLiveFetchAdapter.ts');
const MOCK_FIXTURE_PATH = join(root, 'src', 'data', 'fixtures', 'gnews_live_adapter_mock_response_v0.1.json');
const STATIC_CHECKER_PATH = join(root, 'scripts', 'check_gnews_live_fetch_adapter_static_contract.mjs');
const MOCKED_CHECKER_PATH = join(root, 'scripts', 'check_gnews_live_fetch_adapter_mocked.mjs');
const ROUTE_PATH = join(root, 'src', 'pages', 'api', 'news', 'market-feed.ts');
const HELPER_PATH = join(root, 'src', 'lib', 'news', 'gnewsMarketFeedResponse.mjs');
const HOME_PAGE_PATH = join(root, 'src', 'pages', 'index.astro');
const NEWS_PAGE_PATH = join(root, 'src', 'pages', 'news');
const SUPABASE_MIGRATIONS_PATH = join(root, 'supabase', 'migrations');
const PACKAGE_JSON_PATH = join(root, 'package.json');

const log = (msg) => process.stdout.write(msg + '\n');

let failures = 0;
const check = (label, pass) => {
  const status = pass ? 'PASS' : 'FAIL';
  log(`  [${status}] ${label}`);
  if (!pass) failures++;
};

log('=== GNews Live Fetch Adapter Static Contract Check (Phase 3BC) ===');
log('');

// ---------------------------------------------------------------------------
// Group 1: File existence and package scripts
// ---------------------------------------------------------------------------
log('--- Group 1: File existence and package scripts ---');

const adapterExists = existsSync(ADAPTER_PATH);
check('Adapter file exists (gnewsLiveFetchAdapter.mjs)', adapterExists);
check('No TypeScript adapter file created (gnewsLiveFetchAdapter.ts must not exist)', !existsSync(ADAPTER_TS_PATH));
check('Mock fixture file exists (gnews_live_adapter_mock_response_v0.1.json)', existsSync(MOCK_FIXTURE_PATH));
check('Static checker exists (check_gnews_live_fetch_adapter_static_contract.mjs)', existsSync(STATIC_CHECKER_PATH));
check('Mocked checker exists (check_gnews_live_fetch_adapter_mocked.mjs)', existsSync(MOCKED_CHECKER_PATH));

let pkg = {};
try { pkg = JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf8')); } catch {}
check(
  'Package script check:gnews-live-adapter-static registered',
  typeof pkg.scripts?.['check:gnews-live-adapter-static'] === 'string',
);
check(
  'Package script check:gnews-live-adapter-mocked registered',
  typeof pkg.scripts?.['check:gnews-live-adapter-mocked'] === 'string',
);
log('');

if (!adapterExists) {
  log('ERROR: Adapter file missing — skipping content checks.');
  process.exitCode = 1;
} else {
  const adapterContent = readFileSync(ADAPTER_PATH, 'utf8');

  // ---------------------------------------------------------------------------
  // Group 2: Required exports
  // ---------------------------------------------------------------------------
  log('--- Group 2: Required exports ---');
  const REQUIRED_EXPORTS = [
    'GNEWS_ADAPTER_POLICY',
    'buildGnewsSearchUrl',
    'fetchGnewsTheme',
    'fetchGnewsMarketNewsBatch',
    'normalizeGnewsArticle',
    'normalizeGnewsBatch',
    'sanitizeGnewsAdapterError',
    'summarizeGnewsLiveFetchResult',
  ];
  REQUIRED_EXPORTS.forEach((name) => {
    check(`Adapter exports ${name}`, adapterContent.includes(`export`) && adapterContent.includes(name));
  });
  log('');

  // ---------------------------------------------------------------------------
  // Group 3: Security — no env reads
  // ---------------------------------------------------------------------------
  log('--- Group 3: Security — no env reads ---');
  check('Adapter does not read process.env', !adapterContent.includes('process.env'));
  check('Adapter does not read import.meta.env', !adapterContent.includes('import.meta.env'));
  check('Adapter does not reference GNEWS_API_KEY', !adapterContent.includes('GNEWS_API_KEY'));
  check('Adapter does not reference PUBLIC_GNEWS_API_KEY', !adapterContent.includes('PUBLIC_GNEWS_API_KEY'));
  log('');

  // ---------------------------------------------------------------------------
  // Group 4: Security — no global fetch, uses injected fetchFn
  // ---------------------------------------------------------------------------
  log('--- Group 4: Security — no global fetch, injected fetchFn ---');
  // Replace all fetchFn occurrences to isolate bare fetch( calls
  const adapterWithoutFetchFn = adapterContent.replace(/\bfetchFn\b/g, '_MOCK_FN_');
  const hasRawFetchCall = /\bfetch\s*\(/.test(adapterWithoutFetchFn);
  check('Adapter does not call global fetch directly', !hasRawFetchCall);
  check('Adapter uses injected fetchFn parameter', adapterContent.includes('fetchFn'));
  check('Adapter passes URL to fetchFn (not hardcoded endpoint)', adapterContent.includes('fetchFn('));
  log('');

  // ---------------------------------------------------------------------------
  // Group 5: Security — no forbidden imports
  // ---------------------------------------------------------------------------
  log('--- Group 5: Security — no forbidden imports ---');
  check('Adapter does not contain gnews.io', !adapterContent.includes('gnews.io'));
  check('Adapter does not import @supabase', !adapterContent.includes('@supabase'));
  check('Adapter does not import KIS provider', !adapterContent.includes('kisProvider') && !adapterContent.includes('kis_provider'));
  check('Adapter does not import Vercel', !adapterContent.includes('@vercel/'));
  check('Adapter does not import express or any HTTP framework', !adapterContent.includes("from 'express'") && !adapterContent.includes("from 'fastify'"));
  log('');

  // ---------------------------------------------------------------------------
  // Group 6: Security — no file mutations, no URL logging
  // ---------------------------------------------------------------------------
  log('--- Group 6: Safety — no file mutations, no URL logging ---');
  check('Adapter does not write to filesystem', !adapterContent.includes('writeFileSync') && !adapterContent.includes('writeFile('));
  check('Adapter does not call appendFileSync', !adapterContent.includes('appendFileSync'));
  // Ensure no console.log calls that include url variable references
  const urlLogPattern = /console\.\w+\s*\([^)]*\burl\b[^)]*\)/i;
  check('Adapter does not log URL variables', !urlLogPattern.test(adapterContent));
  check('Adapter does not log apiKey values', !/console\.\w+\s*\([^)]*apiKey[^)]*\)/.test(adapterContent));
  log('');

  // ---------------------------------------------------------------------------
  // Group 7: Implementation — sanitized errors, normalization, URL building
  // ---------------------------------------------------------------------------
  log('--- Group 7: Implementation — error handling and normalization ---');
  check('Adapter defines sanitized error codes object', adapterContent.includes('ADAPTER_ERROR_MESSAGES') || adapterContent.includes('sanitizeGnewsAdapterError'));
  check('Adapter defines normalizeGnewsArticle with context parameter', adapterContent.includes('normalizeGnewsArticle') && adapterContent.includes('context'));
  check('Adapter builds URL with URLSearchParams', adapterContent.includes('URLSearchParams'));
  check('Adapter uses new URL() for URL construction', adapterContent.includes('new URL('));
  log('');

  // ---------------------------------------------------------------------------
  // Group 8: Implementation — policy invariants
  // ---------------------------------------------------------------------------
  log('--- Group 8: Implementation — policy invariants ---');
  check('Adapter forces rawProviderStored: false', adapterContent.includes('rawProviderStored: false'));
  check('RAW_PROVIDER_STORED: false in GNEWS_ADAPTER_POLICY', adapterContent.includes('RAW_PROVIDER_STORED: false'));
  check('Adapter uses category in normalization context', adapterContent.includes('category'));
  check('Adapter uses queryKey in normalization context', adapterContent.includes('queryKey'));
  check('Adapter includes all 6 MARKET_STOCKS, MACRO_POLICY, FX, OIL_COMMODITIES, CRYPTO_DIGITAL_ASSETS, PERSONAL_FINANCE categories',
    adapterContent.includes('MARKET_STOCKS') &&
    adapterContent.includes('MACRO_POLICY') &&
    adapterContent.includes('FX') &&
    adapterContent.includes('OIL_COMMODITIES') &&
    adapterContent.includes('CRYPTO_DIGITAL_ASSETS') &&
    adapterContent.includes('PERSONAL_FINANCE'),
  );
  log('');

  // ---------------------------------------------------------------------------
  // Group 9: Implementation — SHA-256 hashing via node:crypto
  // ---------------------------------------------------------------------------
  log('--- Group 9: Implementation — SHA-256 hashing ---');
  check('Adapter imports from node:crypto', adapterContent.includes("from 'node:crypto'") || adapterContent.includes('from "node:crypto"'));
  check('Adapter uses createHash for SHA-256', adapterContent.includes('createHash'));
  check('Adapter computes canonicalUrlHash', adapterContent.includes('canonicalUrlHash'));
  check('Adapter computes titleHash', adapterContent.includes('titleHash'));
  check('Adapter implements canonical URL normalization (strips tracking params)', adapterContent.includes('TRACKING_PARAMS') || adapterContent.includes('utm_source'));
  check('Adapter implements title normalization (lowercase)', adapterContent.includes('toLowerCase'));
  log('');

  // ---------------------------------------------------------------------------
  // Group 10: Timeout and async safety
  // ---------------------------------------------------------------------------
  log('--- Group 10: Timeout and async safety ---');
  check('Adapter implements request timeout mechanism', adapterContent.includes('timeoutMs') && adapterContent.includes('Promise.race'));
  check('Adapter clears timeout after completion', adapterContent.includes('clearTimeout'));
  check('Adapter handles partial batch failure in fetchGnewsMarketNewsBatch', adapterContent.includes('failureCount') && adapterContent.includes('successCount'));
  log('');
}

// ---------------------------------------------------------------------------
// Group 11: Route boundary isolation
// ---------------------------------------------------------------------------
log('--- Group 11: Route boundary isolation ---');

if (existsSync(ROUTE_PATH)) {
  const routeContent = readFileSync(ROUTE_PATH, 'utf8');
  check(
    'Existing route still returns liveEnabled: false',
    routeContent.includes('liveEnabled: false') ||
    (existsSync(HELPER_PATH) && readFileSync(HELPER_PATH, 'utf8').includes('liveEnabled: false')),
  );
  check(
    "Existing route still returns source: 'fixture'",
    routeContent.includes("source: 'fixture'") || routeContent.includes('source: "fixture"') ||
    (existsSync(HELPER_PATH) && (readFileSync(HELPER_PATH, 'utf8').includes("source: 'fixture'") || readFileSync(HELPER_PATH, 'utf8').includes('source: "fixture"'))),
  );
  check(
    'Existing route does not import live adapter',
    !routeContent.includes('gnewsLiveFetchAdapter'),
  );
} else {
  ['Existing route still returns liveEnabled: false', "Existing route still returns source: 'fixture'", 'Existing route does not import live adapter'].forEach(
    (label) => check(label, false),
  );
}

if (existsSync(HOME_PAGE_PATH)) {
  const homeContent = readFileSync(HOME_PAGE_PATH, 'utf8');
  check('Home page does not import live adapter', !homeContent.includes('gnewsLiveFetchAdapter'));
} else {
  check('Home page does not import live adapter', true);
}

check('No /news page created', !existsSync(NEWS_PAGE_PATH));

const hasGnewsMigration = existsSync(SUPABASE_MIGRATIONS_PATH) &&
  readdirSync(SUPABASE_MIGRATIONS_PATH).some((f) => f.toLowerCase().includes('gnews'));
check('No gnews-related Supabase migration files added', !hasGnewsMigration);
log('');

// ---------------------------------------------------------------------------
// Group 12: Self-check
// ---------------------------------------------------------------------------
log('--- Group 12: Checker self-check ---');
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
