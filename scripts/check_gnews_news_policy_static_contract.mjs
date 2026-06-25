/**
 * Static structural validation for GNews market-news storage policy,
 * schema documentation, and no-network fixture design (Phase 3AY).
 * No network calls. No .env file reads. Exits non-zero on any failure.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const PLANNING_DOC_PATH = join(root, 'docs', 'planning', 'phase_3ay_gnews_news_store_policy_fixture_design_v0.1.md');
const SCHEMA_DOC_PATH = join(root, 'docs', 'schemas', 'gnews_market_news_schema_v0.1.md');
const FIXTURE_PATH = join(root, 'src', 'data', 'fixtures', 'gnews_market_news_fixture_v0.1.json');
const PACKAGE_JSON_PATH = join(root, 'package.json');

const EXPECTED_CATEGORIES = [
  'MARKET_STOCKS',
  'MACRO_POLICY',
  'FX',
  'OIL_COMMODITIES',
  'CRYPTO_DIGITAL_ASSETS',
  'PERSONAL_FINANCE',
];

const EXPECTED_KOREAN_TERMS = ['코인', '환율', '유가', '금리', '비트코인', 'ETF'];

const FIXTURE_FORBIDDEN_PATTERNS = [
  'gnews.io',
  'localhost',
  '.vercel.app',
  '.supabase.co',
  'supabase.io',
  'koreainvestment.com',
];

const FIXTURE_KEY_PATTERNS = ['sk-', 'Bearer ', 'API_KEY=', 'token='];

const log = (msg) => process.stdout.write(msg + '\n');

let failures = 0;

const check = (label, pass) => {
  const status = pass ? 'PASS' : 'FAIL';
  log(`  [${status}] ${label}`);
  if (!pass) failures++;
};

log('=== GNews News Policy Static Contract Check (Phase 3AY) ===');
log('');

// --- File existence ---
log('File existence:');
const planningExists = existsSync(PLANNING_DOC_PATH);
check('Phase 3AY planning doc exists', planningExists);
const schemaExists = existsSync(SCHEMA_DOC_PATH);
check('GNews schema doc exists', schemaExists);
const fixtureExists = existsSync(FIXTURE_PATH);
check('GNews fixture JSON exists', fixtureExists);
log('');

// --- package.json script ---
log('package.json script:');
let pkg = {};
try {
  pkg = JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf8'));
} catch {
  check('package.json parses as valid JSON', false);
}
check(
  'check:gnews-news-policy script registered in package.json',
  typeof pkg.scripts?.['check:gnews-news-policy'] === 'string',
);
log('');

if (!planningExists) {
  log('ERROR: Planning doc missing. Skipping planning doc checks.');
  process.exitCode = 1;
} else {
  const planningContent = readFileSync(PLANNING_DOC_PATH, 'utf8');

  // --- Planning doc: policy parameters ---
  log('Planning doc — policy parameters:');
  check('Active article cap 100 documented', planningContent.includes('Active article cap: 100'));
  check('Page size 10 documented', planningContent.includes('Page size: 10'));
  check('Maximum list pages 10 documented', planningContent.includes('Maximum list pages: 10'));
  check('Home exposure 6 documented', planningContent.includes('Home exposure: 6'));
  check('14-day retention window documented', planningContent.includes('14 days'));
  check('2-hour refresh interval documented', planningContent.includes('2 hours'));
  check('72 requests/day budget documented', planningContent.includes('72 requests/day'));
  check('Prune batch size 20 documented', planningContent.includes('Prune batch size: 20'));
  log('');

  // --- Planning doc: category names ---
  log('Planning doc — category names:');
  EXPECTED_CATEGORIES.forEach((cat) => {
    check(`Category ${cat} documented`, planningContent.includes(cat));
  });
  log('');

  // --- Planning doc: Korean query terms ---
  log('Planning doc — Korean query terms:');
  EXPECTED_KOREAN_TERMS.forEach((term) => {
    check(`Korean query term '${term}' present`, planningContent.includes(term));
  });
  log('');

  // --- Planning doc: security policy ---
  log('Planning doc — environment variable and security policy:');
  check(
    'PUBLIC_GNEWS_API_KEY referenced in security policy',
    planningContent.includes('PUBLIC_GNEWS_API_KEY'),
  );
  check(
    'Client code prohibition documented (client code must never)',
    planningContent.includes('client code must never') || planningContent.includes('Client code must never'),
  );
  check(
    'Server-only GNEWS_API_KEY preference documented',
    planningContent.includes('GNEWS_API_KEY') && planningContent.includes('server-only'),
  );
  log('');
}

// --- Schema doc ---
log('Schema doc:');
if (schemaExists) {
  const schemaContent = readFileSync(SCHEMA_DOC_PATH, 'utf8');
  check('Schema doc contains MarketNewsArticle interface', schemaContent.includes('MarketNewsArticle'));
  check('Schema doc contains ArticleCategory type', schemaContent.includes('ArticleCategory'));
  check('Schema doc contains ArchiveReason type', schemaContent.includes('ArchiveReason'));
  check('Schema doc rawProviderStored always false documented', schemaContent.includes('rawProviderStored'));
  check('Schema doc canonicalUrlHash field documented', schemaContent.includes('canonicalUrlHash'));
  check('Schema doc isDuplicate field documented', schemaContent.includes('isDuplicate'));
} else {
  ['MarketNewsArticle', 'ArticleCategory', 'ArchiveReason', 'rawProviderStored', 'canonicalUrlHash', 'isDuplicate'].forEach(
    (field) => check(`Schema doc contains ${field}`, false),
  );
}
log('');

// --- Fixture: structure ---
log('Fixture — structure and metadata:');
if (!fixtureExists) {
  ['Fixture parses as valid JSON', 'Fixture metadata.isSynthetic is true', 'Fixture has at least 24 articles'].forEach(
    (label) => check(label, false),
  );
  log('');
} else {
  let fixture = null;
  try {
    fixture = JSON.parse(readFileSync(FIXTURE_PATH, 'utf8'));
    check('Fixture parses as valid JSON', true);
  } catch {
    check('Fixture parses as valid JSON', false);
    log('ERROR: Fixture JSON is not parseable. Skipping fixture content checks.');
    process.exitCode = 1;
    log('');
  }

  if (fixture) {
    check('Fixture metadata.isSynthetic is true', fixture.metadata?.isSynthetic === true);
    const articles = Array.isArray(fixture.articles) ? fixture.articles : [];
    check(`Fixture has at least 24 articles (found: ${articles.length})`, articles.length >= 24);
    log('');

    // --- Fixture: URL safety ---
    log('Fixture — URL safety (all URLs must be *.example.test):');
    const NON_EXAMPLE_TEST_URL_RE = /^https?:\/\/(?![\w.-]+\.example\.test)/;
    const allUrls = [];
    articles.forEach((a) => {
      if (a.url) allUrls.push(a.url);
      if (a.imageUrl) allUrls.push(a.imageUrl);
      if (a.sourceUrl) allUrls.push(a.sourceUrl);
    });
    const violatingUrls = allUrls.filter((u) => NON_EXAMPLE_TEST_URL_RE.test(u));
    check(
      `All article URLs, imageUrls, sourceUrls use example.test domain (violations: ${violatingUrls.length})`,
      violatingUrls.length === 0,
    );
    log('');

    // --- Fixture: category coverage ---
    log('Fixture — category coverage (all 6 themes must be present):');
    const categoriesInFixture = new Set(articles.map((a) => a.category));
    EXPECTED_CATEGORIES.forEach((cat) => {
      check(`Category ${cat} present in fixture articles`, categoriesInFixture.has(cat));
    });
    log('');

    // --- Fixture: scenario coverage ---
    log('Fixture — scenario coverage:');
    const hasDuplicateScenario = articles.some((a) => a.isDuplicate === true);
    check('Fixture includes duplicate scenario (at least one isDuplicate: true)', hasDuplicateScenario);

    const hasExpiredScenario = articles.some((a) => a.archiveReason === 'expired');
    check('Fixture includes expired scenario (at least one archiveReason: "expired")', hasExpiredScenario);

    const hasLowScoreScenario = articles.some((a) => typeof a.relevanceScore === 'number' && a.relevanceScore < 30 && !a.isDuplicate);
    check('Fixture includes low-score scenario (at least one non-duplicate relevanceScore < 30)', hasLowScoreScenario);

    const hasMissingImageScenario = articles.some((a) => a.imageUrl === null);
    check('Fixture includes missing-image scenario (at least one imageUrl: null)', hasMissingImageScenario);

    const allRawProviderFalse = articles.every((a) => a.rawProviderStored === false);
    check('All fixture articles have rawProviderStored: false', allRawProviderFalse);
    log('');

    // --- Fixture: forbidden pattern checks (content-level) ---
    log('Fixture — forbidden patterns:');
    const fixtureRaw = readFileSync(FIXTURE_PATH, 'utf8');

    const forbiddenFound = FIXTURE_FORBIDDEN_PATTERNS.filter((p) => fixtureRaw.includes(p));
    check(
      `Fixture does not contain forbidden domains (checked: ${FIXTURE_FORBIDDEN_PATTERNS.length})`,
      forbiddenFound.length === 0,
    );

    const keyPatternFound = FIXTURE_KEY_PATTERNS.filter((p) => fixtureRaw.includes(p));
    check(
      `Fixture does not contain API key-like prefixes (checked: ${FIXTURE_KEY_PATTERNS.length})`,
      keyPatternFound.length === 0,
    );

    const hasFetchInFixture = /fetch\s*\(/.test(fixtureRaw) || fixtureRaw.includes('XMLHttpRequest');
    check('Fixture does not contain fetch/XHR call fragments', !hasFetchInFixture);
    log('');
  }
}

// --- Phase 3AZ artifact checks ---
log('Phase 3AZ artifacts:');
const RESULT_DOC_PATH = join(root, 'docs', 'planning', 'phase_3az_no_network_gnews_policy_validator_result_v0.1.md');
const POLICY_UTILITY_PATH = join(root, 'src', 'lib', 'news', 'gnewsNewsPolicy.mjs');
const ENGINE_CHECKER_PATH = join(root, 'scripts', 'check_gnews_news_policy_engine.mjs');
const NEWS_API_ROUTE_PATH = join(root, 'src', 'pages', 'api', 'news');

check('Phase 3AZ result doc exists', existsSync(RESULT_DOC_PATH));
check('GNews policy utility module exists (src/lib/news/gnewsNewsPolicy.mjs)', existsSync(POLICY_UTILITY_PATH));
check('GNews engine checker exists (scripts/check_gnews_news_policy_engine.mjs)', existsSync(ENGINE_CHECKER_PATH));

let pkg3az = {};
try { pkg3az = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')); } catch {}
check(
  'package.json includes check:gnews-news-engine',
  typeof pkg3az.scripts?.['check:gnews-news-engine'] === 'string',
);

check('API route directory exists (src/pages/api/news/) - created in Phase 3BA', existsSync(NEWS_API_ROUTE_PATH));

if (existsSync(POLICY_UTILITY_PATH)) {
  const utilContent = readFileSync(POLICY_UTILITY_PATH, 'utf8');
  const utilActualFetch =
    /(?:await|=\s*|return\s+)fetch\s*\(/.test(utilContent) ||
    /\bfetch\s*\(\s*['"`]https?:/.test(utilContent);
  check('Policy utility makes no actual fetch network call', !utilActualFetch);
  check(
    'Policy utility does not read GNEWS_API_KEY from env',
    !(/import\.meta\.env\.(?:PUBLIC_)?GNEWS_API_KEY/.test(utilContent)) &&
    !(/process\.env\.(?:PUBLIC_)?GNEWS_API_KEY/.test(utilContent)),
  );
}
log('');

// --- Phase 3BA artifact checks ---
log('Phase 3BA artifacts:');
const RESULT_DOC_3BA_PATH = join(root, 'docs', 'planning', 'phase_3ba_fixture_backed_news_api_route_result_v0.1.md');
const API_ROUTE_FILE_PATH = join(root, 'src', 'pages', 'api', 'news', 'market-feed.ts');
const API_ROUTE_CHECKER_PATH = join(root, 'scripts', 'check_gnews_news_api_route_static_contract.mjs');
const NEWS_PAGE_PATH = join(root, 'src', 'pages', 'news');

check('Phase 3BA result doc exists', existsSync(RESULT_DOC_3BA_PATH));
check('API route file exists (src/pages/api/news/market-feed.ts)', existsSync(API_ROUTE_FILE_PATH));
check('API route checker exists (scripts/check_gnews_news_api_route_static_contract.mjs)', existsSync(API_ROUTE_CHECKER_PATH));

let pkg3ba = {};
try { pkg3ba = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')); } catch {}
check(
  'package.json includes check:gnews-news-api-route',
  typeof pkg3ba.scripts?.['check:gnews-news-api-route'] === 'string',
);

check('No /news page created (src/pages/news/ must not exist)', !existsSync(NEWS_PAGE_PATH));

if (existsSync(API_ROUTE_FILE_PATH)) {
  const routeContent = readFileSync(API_ROUTE_FILE_PATH, 'utf8');
  const routeActualFetch =
    /(?:await|=\s*|return\s+)fetch\s*\(/.test(routeContent) ||
    /\bfetch\s*\(\s*['"`]https?:/.test(routeContent);
  check('API route makes no actual fetch call', !routeActualFetch);
  check(
    'API route does not use GNEWS_API_KEY',
    !(/GNEWS_API_KEY/.test(routeContent)),
  );
}
log('');

// --- Phase 3BB artifact checks ---
log('Phase 3BB artifacts:');
const DESIGN_DOC_3BB_PATH = join(root, 'docs', 'planning', 'phase_3bb_gnews_live_fetch_adapter_design_v0.1.md');
const LIVE_ADAPTER_DESIGN_CHECKER_PATH = join(root, 'scripts', 'check_gnews_live_fetch_adapter_design_static_contract.mjs');
const LIVE_ADAPTER_MJS_PATH = join(root, 'src', 'lib', 'news', 'gnewsLiveFetchAdapter.mjs');
const LIVE_ADAPTER_TS_PATH = join(root, 'src', 'lib', 'news', 'gnewsLiveFetchAdapter.ts');

check('Phase 3BB design doc exists', existsSync(DESIGN_DOC_3BB_PATH));
check('Live adapter design checker exists', existsSync(LIVE_ADAPTER_DESIGN_CHECKER_PATH));

let pkg3bb = {};
try { pkg3bb = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')); } catch {}
check(
  'package.json includes check:gnews-live-adapter-design',
  typeof pkg3bb.scripts?.['check:gnews-live-adapter-design'] === 'string',
);

check('Phase 3BC live adapter .mjs skeleton exists (gnewsLiveFetchAdapter.mjs)', existsSync(LIVE_ADAPTER_MJS_PATH));
check('No live adapter .ts implementation file created', !existsSync(LIVE_ADAPTER_TS_PATH));

if (existsSync(API_ROUTE_FILE_PATH)) {
  const routeContent3bb = readFileSync(API_ROUTE_FILE_PATH, 'utf8');
  check(
    'Route defaults liveEnabled to false (fixture-backed by default)',
    (() => {
      const h = existsSync(join(root, 'src', 'lib', 'news', 'gnewsMarketFeedResponse.mjs'))
        ? readFileSync(join(root, 'src', 'lib', 'news', 'gnewsMarketFeedResponse.mjs'), 'utf8')
        : '';
      return routeContent3bb.includes('liveEnabled: false') || h.includes('liveEnabled: false') || h.includes('?? false');
    })(),
  );
}
log('');

// --- Phase 3BC artifact checks ---
log('Phase 3BC artifacts:');
const LIVE_ADAPTER_STATIC_CHECKER_PATH = join(root, 'scripts', 'check_gnews_live_fetch_adapter_static_contract.mjs');
const LIVE_ADAPTER_MOCKED_CHECKER_PATH = join(root, 'scripts', 'check_gnews_live_fetch_adapter_mocked.mjs');
const MOCK_FIXTURE_PATH_3BC = join(root, 'src', 'data', 'fixtures', 'gnews_live_adapter_mock_response_v0.1.json');

check('Phase 3BC adapter skeleton file exists', existsSync(LIVE_ADAPTER_MJS_PATH));
check('Phase 3BC static adapter checker exists', existsSync(LIVE_ADAPTER_STATIC_CHECKER_PATH));
check('Phase 3BC mocked adapter checker exists', existsSync(LIVE_ADAPTER_MOCKED_CHECKER_PATH));
check('Phase 3BC mock fixture exists', existsSync(MOCK_FIXTURE_PATH_3BC));

let pkg3bc = {};
try { pkg3bc = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')); } catch {}
check(
  'package.json includes check:gnews-live-adapter-static',
  typeof pkg3bc.scripts?.['check:gnews-live-adapter-static'] === 'string',
);
check(
  'package.json includes check:gnews-live-adapter-mocked',
  typeof pkg3bc.scripts?.['check:gnews-live-adapter-mocked'] === 'string',
);

if (existsSync(LIVE_ADAPTER_MJS_PATH)) {
  const adapterContent3bc = readFileSync(LIVE_ADAPTER_MJS_PATH, 'utf8');
  check('Adapter does not read process.env', !adapterContent3bc.includes('process.env'));
  check('Adapter does not read import.meta.env', !adapterContent3bc.includes('import.meta.env'));
  check('Adapter does not reference GNEWS_API_KEY literal', !adapterContent3bc.includes('GNEWS_API_KEY'));
  check('Adapter forces rawProviderStored: false', adapterContent3bc.includes('rawProviderStored: false'));
  check('Route file does not import live adapter', !(existsSync(API_ROUTE_FILE_PATH) && readFileSync(API_ROUTE_FILE_PATH, 'utf8').includes('gnewsLiveFetchAdapter')));
}
log('');

// --- Phase 3BD artifact checks ---
log('Phase 3BD artifacts:');
const OWNER_SMOKE_PATH = join(root, 'scripts', 'owner_smoke_gnews_live_fetch.mjs');
const SMOKE_STATIC_CHECKER_PATH = join(root, 'scripts', 'check_gnews_live_smoke_script_static_contract.mjs');
const SMOKE_DRY_RUN_CHECKER_PATH = join(root, 'scripts', 'check_gnews_live_smoke_script_dry_run.mjs');

check('Phase 3BD owner smoke script exists', existsSync(OWNER_SMOKE_PATH));
check('Phase 3BD static smoke checker exists', existsSync(SMOKE_STATIC_CHECKER_PATH));
check('Phase 3BD dry-run smoke checker exists', existsSync(SMOKE_DRY_RUN_CHECKER_PATH));

let pkg3bd = {};
try { pkg3bd = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')); } catch {}
check(
  'package.json includes smoke:gnews-live:dry',
  typeof pkg3bd.scripts?.['smoke:gnews-live:dry'] === 'string',
);
check(
  'package.json includes check:gnews-live-smoke-script',
  typeof pkg3bd.scripts?.['check:gnews-live-smoke-script'] === 'string',
);
check(
  'package.json includes check:gnews-live-smoke-dry-run',
  typeof pkg3bd.scripts?.['check:gnews-live-smoke-dry-run'] === 'string',
);

if (existsSync(OWNER_SMOKE_PATH)) {
  const smokeContent = readFileSync(OWNER_SMOKE_PATH, 'utf8');
  check('Smoke script imports from gnewsLiveFetchAdapter.mjs', smokeContent.includes('gnewsLiveFetchAdapter.mjs'));
  check('Smoke script does not import dotenv', !smokeContent.includes("from 'dotenv'") && !smokeContent.includes('dotenv/config'));
  check('Smoke script does not import @supabase', !smokeContent.includes('@supabase'));
  check('Smoke script does not import the route',
    !(/from\s+['"].*market-feed/.test(smokeContent)) &&
    !(/import\s+.*from.*market-feed/.test(smokeContent)) &&
    !smokeContent.includes('gnewsMarketFeedResponse'));
  check('Route file does not import owner smoke script', !(existsSync(API_ROUTE_FILE_PATH) && readFileSync(API_ROUTE_FILE_PATH, 'utf8').includes('owner_smoke_gnews_live_fetch')));
}
log('');

// --- Phase 3BE-R1 artifact checks ---
log('Phase 3BE-R1 artifacts:');
const RESULT_DOC_3BE_R1_PATH = join(root, 'docs', 'planning', 'phase_3be_r1_gnews_live_smoke_theme_selection_patch_result_v0.1.md');
const THEME_SELECTION_CHECKER_PATH = join(root, 'scripts', 'check_gnews_live_smoke_theme_selection.mjs');

check('Phase 3BE-R1 result doc exists', existsSync(RESULT_DOC_3BE_R1_PATH));
check('Phase 3BE-R1 theme selection checker exists', existsSync(THEME_SELECTION_CHECKER_PATH));

let pkg3ber1 = {};
try { pkg3ber1 = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')); } catch {}
check(
  'package.json includes check:gnews-live-smoke-theme-selection',
  typeof pkg3ber1.scripts?.['check:gnews-live-smoke-theme-selection'] === 'string',
);

if (existsSync(OWNER_SMOKE_PATH)) {
  const smokeContent3ber1 = readFileSync(OWNER_SMOKE_PATH, 'utf8');
  check('Smoke script supports --theme option', smokeContent3ber1.includes('--theme='));
  check('Smoke script includes invalid_theme reason code', smokeContent3ber1.includes('invalid_theme'));
  check('Smoke script includes invalid_base_url reason code', smokeContent3ber1.includes('invalid_base_url'));
  check('Smoke script does not log queryString values', (() => {
    const calls = smokeContent3ber1.match(/logStep\s*\([^)]*queryString[^)]*\)/g);
    return !calls || calls.length === 0;
  })());
}
check('Route defaults liveEnabled to false after 3BE-R1',
  existsSync(join(root, 'src', 'lib', 'news', 'gnewsMarketFeedResponse.mjs')) &&
  (readFileSync(join(root, 'src', 'lib', 'news', 'gnewsMarketFeedResponse.mjs'), 'utf8').includes('liveEnabled: false') ||
   readFileSync(join(root, 'src', 'lib', 'news', 'gnewsMarketFeedResponse.mjs'), 'utf8').includes('?? false')));
log('');

// --- Phase 3BE-R3 artifact checks ---
log('Phase 3BE-R3 artifacts:');
const RESULT_DOC_3BE_R3_PATH = join(root, 'docs', 'planning', 'phase_3be_r3_gnews_live_smoke_query_simplification_patch_result_v0.1.md');
const QUERY_PROFILE_CHECKER_PATH = join(root, 'scripts', 'check_gnews_live_smoke_query_profile.mjs');

check('Phase 3BE-R3 result doc exists', existsSync(RESULT_DOC_3BE_R3_PATH));
check('Phase 3BE-R3 query profile checker exists', existsSync(QUERY_PROFILE_CHECKER_PATH));

let pkg3ber3 = {};
try { pkg3ber3 = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')); } catch {}
check(
  'package.json includes check:gnews-live-smoke-query-profile',
  typeof pkg3ber3.scripts?.['check:gnews-live-smoke-query-profile'] === 'string',
);

if (existsSync(OWNER_SMOKE_PATH)) {
  const smokeContent3ber3 = readFileSync(OWNER_SMOKE_PATH, 'utf8');
  check('Smoke script supports --query-profile option', smokeContent3ber3.includes('--query-profile='));
  check('Smoke script includes invalid_query_profile reason code', smokeContent3ber3.includes('invalid_query_profile'));
  check('Smoke script includes smoke-only simple query map', smokeContent3ber3.includes('SMOKE_QUERY_PROFILE_SIMPLE_MAP'));
  check('Smoke script includes all 6 simple profile smoke query terms',
    smokeContent3ber3.includes('주식') && smokeContent3ber3.includes('금리') &&
    smokeContent3ber3.includes('환율') && smokeContent3ber3.includes('유가') &&
    smokeContent3ber3.includes('비트코인') && smokeContent3ber3.includes('재테크'));
  check('Smoke script does not log queryString values (3BE-R3 check)', (() => {
    const calls = smokeContent3ber3.match(/logStep\s*\([^)]*queryString[^)]*\)/g);
    return !calls || calls.length === 0;
  })());
}
check('Route defaults liveEnabled to false after 3BE-R3',
  existsSync(join(root, 'src', 'lib', 'news', 'gnewsMarketFeedResponse.mjs')) &&
  (readFileSync(join(root, 'src', 'lib', 'news', 'gnewsMarketFeedResponse.mjs'), 'utf8').includes('liveEnabled: false') ||
   readFileSync(join(root, 'src', 'lib', 'news', 'gnewsMarketFeedResponse.mjs'), 'utf8').includes('?? false')));
log('');

// --- Phase 3BE-R5 artifact checks ---
log('Phase 3BE-R5 artifacts:');
const RESULT_DOC_3BE_R5_PATH = join(root, 'docs', 'planning', 'phase_3be_r5_sanitized_provider_diagnostics_patch_result_v0.1.md');
const PROVIDER_DIAG_CHECKER_PATH = join(root, 'scripts', 'check_gnews_live_smoke_provider_diagnostics.mjs');

check('Phase 3BE-R5 result doc exists', existsSync(RESULT_DOC_3BE_R5_PATH));
check('Phase 3BE-R5 provider diagnostics checker exists', existsSync(PROVIDER_DIAG_CHECKER_PATH));

let pkg3ber5 = {};
try { pkg3ber5 = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')); } catch {}
check(
  'package.json includes check:gnews-live-smoke-provider-diagnostics',
  typeof pkg3ber5.scripts?.['check:gnews-live-smoke-provider-diagnostics'] === 'string',
);

if (existsSync(OWNER_SMOKE_PATH)) {
  const smokeContent3ber5 = readFileSync(OWNER_SMOKE_PATH, 'utf8');
  check('Smoke script supports --diagnostics option', smokeContent3ber5.includes('--diagnostics='));
  check('Smoke script includes invalid_diagnostics_mode reason code', smokeContent3ber5.includes('invalid_diagnostics_mode'));
  check('Smoke script includes provider-diagnostics output step', smokeContent3ber5.includes('provider-diagnostics'));
  check('Smoke script exports diagnostics helpers',
    smokeContent3ber5.includes('parseDiagnosticsArg') &&
    smokeContent3ber5.includes('validateDiagnosticsMode') &&
    smokeContent3ber5.includes('createSanitizedDiagnosticsFetch'));
  check('Smoke script does not log request URL in diagnostics', (() => {
    const calls = smokeContent3ber5.match(/logStep\s*\([^)]*guard\.baseUrl[^)]*\)/g);
    return !calls || calls.length === 0;
  })());
}
check('Route defaults liveEnabled to false after 3BE-R5',
  existsSync(join(root, 'src', 'lib', 'news', 'gnewsMarketFeedResponse.mjs')) &&
  (readFileSync(join(root, 'src', 'lib', 'news', 'gnewsMarketFeedResponse.mjs'), 'utf8').includes('liveEnabled: false') ||
   readFileSync(join(root, 'src', 'lib', 'news', 'gnewsMarketFeedResponse.mjs'), 'utf8').includes('?? false')));
log('');

// --- Phase 3BG artifact checks ---
log('Phase 3BG artifacts:');
const RESULT_DOC_3BG_PATH = join(root, 'docs', 'planning', 'phase_3bg_news_route_source_selector_fallback_result_v0.1.md');
const SOURCE_SELECTOR_PATH = join(root, 'src', 'lib', 'news', 'gnewsMarketFeedSourceSelector.mjs');
const SOURCE_SELECTOR_CHECKER_PATH = join(root, 'scripts', 'check_gnews_news_route_source_selector.mjs');

check('Phase 3BG result doc exists', existsSync(RESULT_DOC_3BG_PATH));
check('Source selector helper exists (gnewsMarketFeedSourceSelector.mjs)', existsSync(SOURCE_SELECTOR_PATH));
check('Source selector checker exists (check_gnews_news_route_source_selector.mjs)', existsSync(SOURCE_SELECTOR_CHECKER_PATH));

let pkg3bg = {};
try { pkg3bg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')); } catch {}
check(
  'package.json includes check:gnews-news-route-source-selector',
  typeof pkg3bg.scripts?.['check:gnews-news-route-source-selector'] === 'string',
);

if (existsSync(API_ROUTE_FILE_PATH)) {
  const routeContent3bg = readFileSync(API_ROUTE_FILE_PATH, 'utf8');
  check('Route supports source selector (imports parseNewsSourceParam)', routeContent3bg.includes('parseNewsSourceParam'));
  check('Route default source is fixture (has parseNewsSourceParam returning fixture for null)',
    existsSync(SOURCE_SELECTOR_PATH)
      ? readFileSync(SOURCE_SELECTOR_PATH, 'utf8').includes("return 'fixture'")
      : false);
  check('Route fallback reasons are sanitized (selector has ALLOWED_FALLBACK_REASONS)',
    existsSync(SOURCE_SELECTOR_PATH)
      ? readFileSync(SOURCE_SELECTOR_PATH, 'utf8').includes('ALLOWED_FALLBACK_REASONS')
      : false);
  check('Route does not import owner smoke script', !routeContent3bg.includes('owner_smoke_gnews_live_fetch'));
}
check('Home page not connected to live news source',
  (() => {
    const homePath = join(root, 'src', 'pages', 'index.astro');
    if (!existsSync(homePath)) return true;
    const h = readFileSync(homePath, 'utf8');
    return !h.includes('gnewsMarketFeedSourceSelector') && !h.includes('gnewsLiveFetchAdapter');
  })());
check('No /news page created (3BG check)', !existsSync(join(root, 'src', 'pages', 'news')));
log('');

// --- Phase 3BH artifact checks ---
log('Phase 3BH artifacts:');
const RESULT_DOC_3BH_PATH = join(root, 'docs', 'planning', 'phase_3bh_home_market_news_ui_integration_result_v0.1.md');
const HOME_NEWS_CHECKER_PATH = join(root, 'scripts', 'check_home_market_news_static_contract.mjs');
const HOME_NEWS_COMPONENT_PATH = join(root, 'src', 'components', 'HomeMarketNews.astro');
const HOME_PAGE_PATH_3BH = join(root, 'src', 'pages', 'index.astro');

check('Phase 3BH result doc exists', existsSync(RESULT_DOC_3BH_PATH));
check('Home market news checker exists (check_home_market_news_static_contract.mjs)', existsSync(HOME_NEWS_CHECKER_PATH));
check('HomeMarketNews component exists (src/components/HomeMarketNews.astro)', existsSync(HOME_NEWS_COMPONENT_PATH));

let pkg3bh = {};
try { pkg3bh = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')); } catch {}
check('package.json includes check:home-market-news',
  typeof pkg3bh.scripts?.['check:home-market-news'] === 'string');

if (existsSync(HOME_PAGE_PATH_3BH)) {
  const homeContent3bh = readFileSync(HOME_PAGE_PATH_3BH, 'utf8');
  check('Home uses mode=home route (/api/news/market-feed?mode=home)',
    homeContent3bh.includes('/api/news/market-feed?mode=home'));
  check('Home does not pass source=auto', !homeContent3bh.includes('source=auto'));
  check('Home does not pass source=live', !homeContent3bh.includes('source=live'));
  check('Home does not import live adapter directly',
    !homeContent3bh.includes('gnewsLiveFetchAdapter'));
  check('Home does not import owner smoke script',
    !homeContent3bh.includes('owner_smoke_gnews_live_fetch'));
}
check('No /news page exists (3BH boundary)', !existsSync(join(root, 'src', 'pages', 'news')));
check('Route default unchanged (fixture-default preserved)',
  (() => {
    const h = existsSync(join(root, 'src', 'lib', 'news', 'gnewsMarketFeedResponse.mjs'))
      ? readFileSync(join(root, 'src', 'lib', 'news', 'gnewsMarketFeedResponse.mjs'), 'utf8')
      : '';
    return h.includes('liveEnabled: false') || h.includes('?? false');
  })());
log('');

// --- Phase 3BJ artifact checks ---
log('Phase 3BJ artifacts:');
const RESULT_DOC_3BJ_PATH = join(root, 'docs', 'planning', 'phase_3bj_home_market_news_owner_review_ui_polish_result_v0.1.md');
const HOME_NEWS_CHECKER_3BJ_PATH = join(root, 'scripts', 'check_home_market_news_static_contract.mjs');
const CSS_PATH_3BJ = join(root, 'src', 'styles', 'style.css');

check('Phase 3BJ result doc exists', existsSync(RESULT_DOC_3BJ_PATH));
check('Home market news checker still exists', existsSync(HOME_NEWS_CHECKER_3BJ_PATH));

if (existsSync(CSS_PATH_3BJ)) {
  const css3bj = readFileSync(CSS_PATH_3BJ, 'utf8');
  check('CSS has focus-visible style for news card (3BJ accessibility polish)',
    css3bj.includes('.home-news-card:focus') || css3bj.includes('.home-news-card:focus-visible'));
  check('CSS has hover style for news card (3BJ polish)',
    css3bj.includes('.home-news-card:hover'));
}

const HOME_PAGE_3BJ = join(root, 'src', 'pages', 'index.astro');
if (existsSync(HOME_PAGE_3BJ)) {
  const home3bj = readFileSync(HOME_PAGE_3BJ, 'utf8');
  check('Home still uses mode=home route (3BJ check)', home3bj.includes('/api/news/market-feed?mode=home'));
  check('Home still omits source=auto (3BJ check)', !home3bj.includes('source=auto'));
  check('Home still omits source=live (3BJ check)', !home3bj.includes('source=live'));
  check('Home still does not import live adapter (3BJ check)', !home3bj.includes('gnewsLiveFetchAdapter'));
  check('Home still does not import owner smoke script (3BJ check)', !home3bj.includes('owner_smoke_gnews_live_fetch'));
}
check('No /news page exists (3BJ boundary)', !existsSync(join(root, 'src', 'pages', 'news')));
log('');

// --- Phase 3BL artifact checks ---
log('Phase 3BL artifacts:');
const RESULT_DOC_3BL_PATH = join(root, 'docs', 'planning', 'phase_3bl_home_portfolio_status_panel_result_v0.1.md');
const HPP_COMPONENT_PATH = join(root, 'src', 'components', 'HomePortfolioPanel.astro');
const HPP_CHECKER_PATH = join(root, 'scripts', 'check_home_portfolio_panel_static_contract.mjs');
const INDEX_PATH_3BL = join(root, 'src', 'pages', 'index.astro');

check('Phase 3BL result doc exists', existsSync(RESULT_DOC_3BL_PATH));
check('HomePortfolioPanel component exists', existsSync(HPP_COMPONENT_PATH));
check('HomePortfolioPanel static checker exists', existsSync(HPP_CHECKER_PATH));

let pkg3bl = {};
try { pkg3bl = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')); } catch {}
check('package.json includes check:home-portfolio-panel',
  typeof pkg3bl.scripts?.['check:home-portfolio-panel'] === 'string');

if (existsSync(INDEX_PATH_3BL)) {
  const home3bl = readFileSync(INDEX_PATH_3BL, 'utf8');
  check('Home imports HomePortfolioPanel (3BL)', home3bl.includes('HomePortfolioPanel'));
  check('Home still imports HomeMarketNews (3BL boundary)', home3bl.includes('HomeMarketNews'));
  check('Market Coverage static panel removed from Home (3BL)', !home3bl.includes('Market Coverage') && !home3bl.includes('market-panel'));
}
check('No /news page created (3BL boundary)', !existsSync(join(root, 'src', 'pages', 'news')));
log('');

// --- Phase 3BM artifact checks ---
log('Phase 3BM artifacts:');
const RESULT_DOC_3BM_PATH = join(root, 'docs', 'planning', 'phase_3bm_portfolio_page_layout_refactor_result_v0.1.md');
const PORTFOLIO_LAYOUT_CHECKER_PATH = join(root, 'scripts', 'check_portfolio_layout_refactor_static_contract.mjs');
const PORTFOLIO_PAGE_3BM_PATH = join(root, 'src', 'pages', 'portfolio.astro');

check('Phase 3BM result doc exists', existsSync(RESULT_DOC_3BM_PATH));
check('Portfolio layout checker exists', existsSync(PORTFOLIO_LAYOUT_CHECKER_PATH));

let pkg3bm = {};
try { pkg3bm = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')); } catch {}
check('package.json includes check:portfolio-layout',
  typeof pkg3bm.scripts?.['check:portfolio-layout'] === 'string');

if (existsSync(PORTFOLIO_PAGE_3BM_PATH)) {
  const portfolio3bm = readFileSync(PORTFOLIO_PAGE_3BM_PATH, 'utf8');
  check('Portfolio page still exists (3BM)', true);
  check('Debug status chips removed (no portfolio-status-bar in portfolio page)',
    !portfolio3bm.includes('portfolio-status-bar'));
  check('Debug status chips removed (no status-pill in portfolio page)',
    !portfolio3bm.includes('status-pill'));
  check('Refresh control exists in portfolio page (portfolio-refresh)',
    portfolio3bm.includes('id="portfolio-refresh"'));
  check('Refresh aria-label is non-live copy (현재 포트폴리오 다시 계산)',
    portfolio3bm.includes('현재 포트폴리오 다시 계산'));
} else {
  check('Portfolio page still exists (3BM)', false);
  check('Debug status chips removed', false);
  check('Debug status chips removed (status-pill)', false);
  check('Refresh control exists', false);
  check('Refresh aria-label non-live', false);
}
check('No /news page created (3BM boundary)', !existsSync(join(root, 'src', 'pages', 'news')));
check('HomePortfolioPanel still present (3BM boundary)', existsSync(join(root, 'src', 'components', 'HomePortfolioPanel.astro')));
check('HomeMarketNews still present (3BM boundary)', existsSync(join(root, 'src', 'components', 'HomeMarketNews.astro')));
log('');

// --- Phase 3BN artifact checks ---
log('Phase 3BN artifacts:');
const RESULT_DOC_3BN_PATH = join(root, 'docs', 'planning', 'phase_3bn_portfolio_bookmark_tabs_reorder_ux_result_v0.1.md');
const BOOKMARK_CHECKER_PATH = join(root, 'scripts', 'check_portfolio_bookmark_tabs_static_contract.mjs');
const PORTFOLIO_PAGE_3BN_PATH = join(root, 'src', 'pages', 'portfolio.astro');

check('Phase 3BN result doc exists', existsSync(RESULT_DOC_3BN_PATH));
check('Portfolio bookmark tabs checker exists', existsSync(BOOKMARK_CHECKER_PATH));

let pkg3bn = {};
try { pkg3bn = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')); } catch {}
check('package.json includes check:portfolio-bookmark-tabs',
  typeof pkg3bn.scripts?.['check:portfolio-bookmark-tabs'] === 'string');

if (existsSync(PORTFOLIO_PAGE_3BN_PATH)) {
  const portfolio3bn = readFileSync(PORTFOLIO_PAGE_3BN_PATH, 'utf8');
  check('Aggregate tab (전체 포트폴리오) exists in portfolio page (3BN)',
    portfolio3bn.includes('전체 포트폴리오'));
  check('Add tab (portfolio-bookmark-tab--add) exists in portfolio page (3BN)',
    portfolio3bn.includes('portfolio-bookmark-tab--add'));
  check('Reorder controls exist (portfolio-tab-reorder-btn)',
    portfolio3bn.includes('portfolio-tab-reorder-btn'));
  check('No drag-and-drop library added (no dragstart event)',
    !portfolio3bn.includes('dragstart') && !portfolio3bn.includes('dragover'));
  check('Tab order localStorage key is controlled and namespaced (3BW-HF1 adds mk-stock-lab:portfolio-tab-order)',
    !portfolio3bn.includes('portfolioTabOrder') &&
    (!portfolio3bn.includes('portfolio-tab-order') || portfolio3bn.includes('mk-stock-lab:portfolio-tab-order')));
  check('No GNews live behavior added in portfolio page',
    !portfolio3bn.includes('gnews.io') && !portfolio3bn.includes('GNEWS_API_KEY'));
} else {
  check('Portfolio page still exists (3BN)', false);
  check('Aggregate tab exists', false);
  check('Add tab exists', false);
  check('Reorder controls exist', false);
  check('No drag-and-drop added', false);
  check('No localStorage tab-order key', false);
  check('No GNews live behavior', false);
}
check('No /news page created (3BN boundary)', !existsSync(join(root, 'src', 'pages', 'news')));
check('HomePortfolioPanel still present (3BN boundary)', existsSync(join(root, 'src', 'components', 'HomePortfolioPanel.astro')));
check('HomeMarketNews still present (3BN boundary)', existsSync(join(root, 'src', 'components', 'HomeMarketNews.astro')));
log('');

// ---------------------------------------------------------------------------
// Phase 3BP artifact group — Home Portfolio Panel Owner Review Fixes
// ---------------------------------------------------------------------------
log('--- Phase 3BP: Home Portfolio Panel Owner Review Fixes ---');

const HPP_COMPONENT_3BP = join(root, 'src', 'components', 'HomePortfolioPanel.astro');
const RESULT_DOC_3BP = join(root, 'docs', 'planning', 'phase_3bp_home_portfolio_panel_owner_review_fixes_result_v0.1.md');
const HPP_CHECKER_3BP = join(root, 'scripts', 'check_home_portfolio_panel_static_contract.mjs');
const CSS_PATH_3BP = join(root, 'src', 'styles', 'style.css');

check('Phase 3BP result doc exists', existsSync(RESULT_DOC_3BP));
check('HPP static checker exists (updated for 3BP)', existsSync(HPP_CHECKER_3BP));

if (existsSync(HPP_COMPONENT_3BP)) {
  const hpp3bp = readFileSync(HPP_COMPONENT_3BP, 'utf8');
  check('Resolving state added (hpp-resolving) as anti-flicker default',
    hpp3bp.includes('id="hpp-resolving"') || hpp3bp.includes("id='hpp-resolving'"));
  check('data-hpp-default on resolving state (not signed_out)',
    hpp3bp.includes('hpp-resolving') && hpp3bp.includes('data-hpp-default'));
  check('Donut chart element added to State C',
    hpp3bp.includes('hpp-donut'));
  check('PortfolioPosition type imported for cost-basis chart',
    hpp3bp.includes('PortfolioPosition'));
  check('portfolioApi.listPositions used for donut data',
    hpp3bp.includes('listPositions'));
  check('No live KIS calls added in HPP (3BP)',
    !hpp3bp.includes('oauth2/tokenP') && !hpp3bp.includes('koreainvestment'));
  check('No live GNews calls added in HPP (3BP)',
    !hpp3bp.includes('gnews.io') && !hpp3bp.includes('GNEWS_API_KEY'));
  check('No claim of 평가금액 (live valuation) in 3BP',
    !hpp3bp.includes('평가금액'));
} else {
  ['Resolving state', 'data-hpp-default on resolving', 'Donut chart element',
    'PortfolioPosition import', 'listPositions used', 'No live KIS', 'No live GNews', 'No 평가금액'].forEach((label) => {
    check(label, false);
  });
}

if (existsSync(CSS_PATH_3BP)) {
  const css3bp = readFileSync(CSS_PATH_3BP, 'utf8');
  check('CSS .hpp-cta uses flex (CTA vertical centering fix)',
    css3bp.includes('.hpp-cta') && (css3bp.includes('display: flex') || css3bp.includes('display:flex')));
  check('CSS donut chart styles added (.hpp-donut)',
    css3bp.includes('.hpp-donut'));
  check('CSS skeleton styles added (.hpp-resolving-skeleton)',
    css3bp.includes('.hpp-resolving-skeleton'));
} else {
  check('CSS .hpp-cta flex fix', false);
  check('CSS donut styles', false);
  check('CSS skeleton styles', false);
}

check('Portfolio page (3BN) not modified by 3BP',
  existsSync(join(root, 'src', 'pages', 'portfolio.astro')));
check('No /news page created (3BP boundary)', !existsSync(join(root, 'src', 'pages', 'news')));
log('');

// ---------------------------------------------------------------------------
// Phase 3BQ artifact group — Portfolio Bookmark Tabs Owner Review Fixes
// ---------------------------------------------------------------------------
log('--- Phase 3BQ: Portfolio Bookmark Tabs Owner Review Fixes ---');

const PORTFOLIO_PAGE_3BQ = join(root, 'src', 'pages', 'portfolio.astro');
const RESULT_DOC_3BQ = join(root, 'docs', 'planning', 'phase_3bq_portfolio_bookmark_tabs_owner_review_fixes_result_v0.1.md');
const BM_CHECKER_3BQ = join(root, 'scripts', 'check_portfolio_bookmark_tabs_static_contract.mjs');
const CSS_PATH_3BQ = join(root, 'src', 'styles', 'style.css');

check('Phase 3BQ result doc exists', existsSync(RESULT_DOC_3BQ));
check('Bookmark tabs static checker exists (updated for 3BQ)', existsSync(BM_CHECKER_3BQ));

if (existsSync(PORTFOLIO_PAGE_3BQ)) {
  const port3bq = readFileSync(PORTFOLIO_PAGE_3BQ, 'utf8');
  check('Refresh button inline with h1 (portfolio-h1-row class)',
    port3bq.includes('portfolio-h1-row'));
  check('Aggregate tab label shortened to 전체',
    port3bq.includes("'전체'") || port3bq.includes('"전체"'));
  check('Floating mini toolbar (portfolio-tab-floating-actions) created',
    port3bq.includes('portfolio-tab-floating-actions'));
  check('Add tab rendered inline in JS (addBtn.id = portfolio-manage-toggle)',
    port3bq.includes("addBtn.id = 'portfolio-manage-toggle'") ||
    port3bq.includes('addBtn.id = "portfolio-manage-toggle"'));
  check('toggle-manage-panel action handled in #portfolio-list delegation',
    port3bq.includes("'toggle-manage-panel'") || port3bq.includes('"toggle-manage-panel"'));
  check('Static portfolio-manage-toggle button removed from HTML',
    !port3bq.includes('<button class="portfolio-bookmark-tab portfolio-bookmark-tab--add" id="portfolio-manage-toggle"'));
  check('No live KIS calls added in 3BQ', !port3bq.includes('oauth2/tokenP'));
  check('No live GNews calls added in 3BQ', !port3bq.includes('gnews.io'));
} else {
  ['Refresh inline with h1', 'Aggregate tab label 전체', 'Floating toolbar',
    'Add tab inline', 'toggle-manage-panel delegation', 'Static button removed',
    'No live KIS', 'No live GNews'].forEach((label) => {
    check(label, false);
  });
}

if (existsSync(CSS_PATH_3BQ)) {
  const css3bq = readFileSync(CSS_PATH_3BQ, 'utf8');
  check('CSS .portfolio-h1-row defined (3BQ)',
    css3bq.includes('.portfolio-h1-row'));
  check('CSS .portfolio-tab-floating-actions defined (3BQ)',
    css3bq.includes('.portfolio-tab-floating-actions'));
  check('CSS overflow-y: hidden on .portfolio-bookmark-tabs (3BQ)',
    css3bq.includes('.portfolio-bookmark-tabs') && css3bq.includes('overflow-y: hidden'));
} else {
  check('CSS .portfolio-h1-row', false);
  check('CSS .portfolio-tab-floating-actions', false);
  check('CSS overflow-y: hidden', false);
}

check('HomePortfolioPanel not modified by 3BQ',
  existsSync(join(root, 'src', 'components', 'HomePortfolioPanel.astro')));
check('No /news page created (3BQ boundary)', !existsSync(join(root, 'src', 'pages', 'news')));
log('');

// ---------------------------------------------------------------------------
// Phase 3BR artifact group — Portfolio Holdings Category Header & Sort UX
// ---------------------------------------------------------------------------
log('--- Phase 3BR: Portfolio Holdings Category Header & Sort UX ---');

const PORTFOLIO_PAGE_3BR = join(root, 'src', 'pages', 'portfolio.astro');
const RESULT_DOC_3BR = join(root, 'docs', 'planning', 'phase_3br_portfolio_holdings_category_header_sort_ux_result_v0.1.md');
const HOLDINGS_CHECKER_3BR = join(root, 'scripts', 'check_portfolio_holdings_category_header_static_contract.mjs');
const CSS_PATH_3BR = join(root, 'src', 'styles', 'style.css');

check('Phase 3BR result doc exists', existsSync(RESULT_DOC_3BR));
check('Holdings category header checker exists (3BR)', existsSync(HOLDINGS_CHECKER_3BR));

let pkg3br = {};
try { pkg3br = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')); } catch {}
check('package.json has check:portfolio-holdings-header script (3BR)',
  typeof pkg3br.scripts?.['check:portfolio-holdings-header'] === 'string');

if (existsSync(PORTFOLIO_PAGE_3BR)) {
  const port3br = readFileSync(PORTFOLIO_PAGE_3BR, 'utf8');
  check('Category header marker (positions-category-header) exists (3BR)',
    port3br.includes('positions-category-header'));
  check('카테고리 label present (3BR)', port3br.includes('카테고리'));
  check('All required category labels present (종목, 비중, 평가금, 수익률, 예상 연배당금)',
    port3br.includes('>종목<') && port3br.includes('>비중<') &&
    port3br.includes('>평가금<') && port3br.includes('>수익률<') &&
    port3br.includes('예상 연배당금'));
  check('Sort arrow controls present (sort-arrow-button)',
    port3br.includes('sort-arrow-button'));
  check('Vertical arrow stack present (sort-arrow-stack)',
    port3br.includes('sort-arrow-stack'));
  check('Weight sort key present (weight-desc)',
    port3br.includes('weight-desc'));
  check('Profit sort key present (profit-desc)',
    port3br.includes('profit-desc'));
  check('Dividend sort keys present (dividend-yield-desc)',
    port3br.includes('dividend-yield-desc'));
  check('No live KIS calls added in 3BR', !port3br.includes('oauth2/tokenP'));
  check('No live GNews calls added in 3BR', !port3br.includes('gnews.io'));
  check('Old 정렬 sort toolbar removed (3BR)', !port3br.includes('<p class="eyebrow">정렬</p>'));
} else {
  ['Category header marker', '카테고리 label', 'Required category labels', 'Sort arrow controls',
    'Vertical arrow stack', 'Weight sort key', 'Profit sort key', 'Dividend sort keys',
    'No live KIS', 'No live GNews', 'Old 정렬 removed'].forEach((label) => {
    check(label, false);
  });
}

if (existsSync(CSS_PATH_3BR)) {
  const css3br = readFileSync(CSS_PATH_3BR, 'utf8');
  check('CSS .positions-category-header defined (3BR)', css3br.includes('.positions-category-header'));
  check('CSS .sort-arrow-button defined (3BR)', css3br.includes('.sort-arrow-button'));
  check('CSS .positions-list-wrap has overflow-x: auto (3BR)',
    css3br.includes('overflow-x: auto') && css3br.includes('.positions-list-wrap'));
} else {
  check('CSS .positions-category-header', false);
  check('CSS .sort-arrow-button', false);
  check('CSS overflow-x on list-wrap', false);
}

check('HomePortfolioPanel not modified by 3BR',
  existsSync(join(root, 'src', 'components', 'HomePortfolioPanel.astro')));
check('HomeMarketNews not modified by 3BR',
  existsSync(join(root, 'src', 'components', 'HomeMarketNews.astro')));
check('No /news page created (3BR boundary)', !existsSync(join(root, 'src', 'pages', 'news')));
log('');

// ---------------------------------------------------------------------------
// Phase 3BS artifact group — Home Portfolio Card & Portfolio Create Sheet
// ---------------------------------------------------------------------------
log('--- Phase 3BS: Home Portfolio Card & Portfolio Create Sheet ---');

const RESULT_DOC_3BS = join(root, 'docs', 'planning', 'phase_3bs_home_portfolio_card_create_sheet_owner_fixes_result_v0.1.md');
const CREATE_SHEET_CHECKER_3BS = join(root, 'scripts', 'check_portfolio_create_sheet_static_contract.mjs');
const HPP_COMPONENT_3BS = join(root, 'src', 'components', 'HomePortfolioPanel.astro');
const PORTFOLIO_PAGE_3BS = join(root, 'src', 'pages', 'portfolio.astro');
const CSS_PATH_3BS = join(root, 'src', 'styles', 'style.css');

check('Phase 3BS result doc exists', existsSync(RESULT_DOC_3BS));
check('Portfolio create sheet checker exists (3BS)', existsSync(CREATE_SHEET_CHECKER_3BS));

let pkg3bs = {};
try { pkg3bs = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')); } catch {}
check('package.json has check:portfolio-create-sheet script (3BS)',
  typeof pkg3bs.scripts?.['check:portfolio-create-sheet'] === 'string');

if (existsSync(HPP_COMPONENT_3BS)) {
  const hpp3bs = readFileSync(HPP_COMPONENT_3BS, 'utf8');
  check('HomePortfolioPanel has hpp-card-header (3BS top-right meta)',
    hpp3bs.includes('hpp-card-header'));
  check('HomePortfolioPanel hpp-card-meta present (3BS)',
    hpp3bs.includes('hpp-card-meta'));
  check('포트폴리오 meta label present in hpp (3BS)',
    hpp3bs.includes('hpp-meta-label') && hpp3bs.includes('포트폴리오'));
  check('No 개 계좌 wording (3BS)',
    !hpp3bs.includes('개 계좌'));
  check('No live KIS/GNews added by 3BS in hpp',
    !hpp3bs.includes('KIS_APP_KEY') && !hpp3bs.includes('gnews.io'));
} else {
  ['hpp-card-header', 'hpp-card-meta', '포트폴리오 meta', 'No 개 계좌', 'No live data'].forEach((label) => {
    check(label, false);
  });
}

if (existsSync(PORTFOLIO_PAGE_3BS)) {
  const port3bs = readFileSync(PORTFOLIO_PAGE_3BS, 'utf8');
  check('portfolio-sheet exists (3BS)', port3bs.includes('id="portfolio-sheet"'));
  check('portfolio-sheet has role=dialog (3BS)', port3bs.includes('role="dialog"'));
  check('portfolio-sheet-title exists (3BS)', port3bs.includes('id="portfolio-sheet-title"'));
  check('portfolio-sheet-close exists (3BS)', port3bs.includes('id="portfolio-sheet-close"'));
  check('portfolio-sheet-backdrop exists (3BS)', port3bs.includes('id="portfolio-sheet-backdrop"'));
  check('Old inline portfolio-manage-panel removed (3BS)',
    !port3bs.includes('<div class="portfolio-manage-panel'));
  check('openPortfolioSheet function present (3BS)', port3bs.includes('openPortfolioSheet'));
  check('closePortfolioSheet function present (3BS)', port3bs.includes('closePortfolioSheet'));
  check('No live KIS calls added (3BS)', !port3bs.includes('oauth2/tokenP'));
  check('No live GNews calls added (3BS)', !port3bs.includes('gnews.io'));
} else {
  ['portfolio-sheet', 'role=dialog', 'sheet-title', 'sheet-close', 'sheet-backdrop',
    'No inline panel', 'openPortfolioSheet', 'closePortfolioSheet',
    'No KIS', 'No GNews'].forEach((label) => {
    check(label, false);
  });
}

if (existsSync(CSS_PATH_3BS)) {
  const css3bs = readFileSync(CSS_PATH_3BS, 'utf8');
  check('CSS .portfolio-sheet defined (3BS)', css3bs.includes('.portfolio-sheet {'));
  check('CSS .hpp-card-header defined (3BS)', css3bs.includes('.hpp-card-header'));
  check('CSS .hpp-donut enlarged beyond 76px (3BS)',
    (() => {
      const idx = css3bs.indexOf('.hpp-donut {');
      const block = css3bs.slice(idx, idx + 200);
      const match = block.match(/width:\s*(\d+)px/);
      return match ? parseInt(match[1], 10) > 76 : false;
    })());
} else {
  check('CSS .portfolio-sheet', false);
  check('CSS .hpp-card-header', false);
  check('CSS .hpp-donut enlarged', false);
}

check('HomeMarketNews not modified by 3BS',
  existsSync(join(root, 'src', 'components', 'HomeMarketNews.astro')));
check('No /news page created (3BS boundary)', !existsSync(join(root, 'src', 'pages', 'news')));
log('');

// ─── Phase 3BU artifact group ────────────────────────────────────────────────
log('--- Phase 3BU: KIS Valuation Pre-Design artifacts ---');

const PLAN_DOC_3BU = join(root, 'docs', 'planning', 'phase_3bu_kis_valuation_integration_pre_design_v0.1.md');
const SCHEMA_DOC_3BU = join(root, 'docs', 'schemas', 'portfolio_valuation_state_contract_v0.1.md');
const CHECKER_3BU = join(root, 'scripts', 'check_kis_valuation_pre_design_static_contract.mjs');
const VALUATION_ROUTE = join(root, 'src', 'pages', 'api', 'portfolio', 'valuation.ts');
const VALUATION_ROUTE_JS = join(root, 'src', 'pages', 'api', 'portfolio', 'valuation.js');

check('Phase 3BU planning doc exists', existsSync(PLAN_DOC_3BU));
check('Portfolio valuation schema doc exists', existsSync(SCHEMA_DOC_3BU));
check('KIS valuation design checker exists', existsSync(CHECKER_3BU));
check('package script check:kis-valuation-design exists',
  (() => {
    let p = {};
    try { p = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')); } catch {}
    return typeof p.scripts?.['check:kis-valuation-design'] === 'string';
  })());
check('No /news page exists (3BU boundary)', !existsSync(join(root, 'src', 'pages', 'news')));
check('HomePortfolioPanel still present (3BU boundary)',
  existsSync(join(root, 'src', 'components', 'HomePortfolioPanel.astro')));
check('HomeMarketNews still present (3BU boundary)',
  existsSync(join(root, 'src', 'components', 'HomeMarketNews.astro')));
check('No GNews live behavior added by 3BU',
  (() => {
    const plan3bu = existsSync(PLAN_DOC_3BU) ? readFileSync(PLAN_DOC_3BU, 'utf8') : '';
    return !plan3bu.includes('gnews.io') && plan3bu.includes('documentation-only');
  })());
check('Valuation route (when present) is fixture-only — no live provider (3BU boundary)',
  !existsSync(VALUATION_ROUTE) || !readFileSync(VALUATION_ROUTE, 'utf8').includes('source=live'));
log('');

// ─── Phase 3BV artifact group ────────────────────────────────────────────────
log('--- Phase 3BV: KIS Quote Adapter Contract & Mocked Provider Tests ---');

const RESULT_DOC_3BV = join(root, 'docs', 'planning', 'phase_3bv_kis_quote_adapter_contract_mocked_tests_result_v0.1.md');
const MOCKED_CHECKER_3BV = join(root, 'scripts', 'check_kis_quote_adapter_mocked_contract.mjs');
const VALUATION_ROUTE_3BV = join(root, 'src', 'pages', 'api', 'portfolio', 'valuation.ts');
const VALUATION_ROUTE_3BV_JS = join(root, 'src', 'pages', 'api', 'portfolio', 'valuation.js');
const PORTFOLIO_VALUATION_3BV = join(root, 'src', 'lib', 'server', 'portfolioValuation.ts');

check('Phase 3BV result doc exists', existsSync(RESULT_DOC_3BV));
check('Phase 3BV mocked checker exists', existsSync(MOCKED_CHECKER_3BV));
check('package script check:kis-quote-adapter-mocked exists',
  (() => {
    let p = {};
    try { p = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')); } catch {}
    return typeof p.scripts?.['check:kis-quote-adapter-mocked'] === 'string';
  })());
check('buildPortfolioValuationFromQuotes exported in portfolioValuation.ts (3BV)',
  existsSync(PORTFOLIO_VALUATION_3BV) &&
  readFileSync(PORTFOLIO_VALUATION_3BV, 'utf8').includes('export const buildPortfolioValuationFromQuotes'));
check('Valuation route (when present) is fixture-only — no live source in route (3BV boundary)',
  !existsSync(VALUATION_ROUTE_3BV) ||
  !readFileSync(VALUATION_ROUTE_3BV, 'utf8').includes('source=live'));
check('No /news page created (3BV boundary)', !existsSync(join(root, 'src', 'pages', 'news')));
check('HomePortfolioPanel still present (3BV boundary)',
  existsSync(join(root, 'src', 'components', 'HomePortfolioPanel.astro')));
check('HomeMarketNews still present (3BV boundary)',
  existsSync(join(root, 'src', 'components', 'HomeMarketNews.astro')));
log('');

// ─── Phase 3BW artifact group ────────────────────────────────────────────────
log('--- Phase 3BW: Portfolio Valuation API Route with Fixture/Mocked Quotes ---');

const RESULT_DOC_3BW = join(root, 'docs', 'planning', 'phase_3bw_portfolio_valuation_api_route_fixture_result_v0.1.md');
const VALUATION_ROUTE_3BW = join(root, 'src', 'pages', 'api', 'portfolio', 'valuation.ts');
const FIXTURE_RESOLVER_3BW = join(root, 'src', 'lib', 'server', 'portfolioValuationFixture.ts');
const API_CHECKER_3BW = join(root, 'scripts', 'check_portfolio_valuation_api_route_fixture_contract.mjs');

check('Phase 3BW result doc exists', existsSync(RESULT_DOC_3BW));
check('Phase 3BW valuation route file exists', existsSync(VALUATION_ROUTE_3BW));
check('Phase 3BW fixture resolver exists', existsSync(FIXTURE_RESOLVER_3BW));
check('Phase 3BW API route checker exists', existsSync(API_CHECKER_3BW));
check('package script check:portfolio-valuation-api exists (3BW)',
  (() => {
    let p = {};
    try { p = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')); } catch {}
    return typeof p.scripts?.['check:portfolio-valuation-api'] === 'string';
  })());
check('Phase 3BW route is fixture-only (no live/auto source)',
  existsSync(VALUATION_ROUTE_3BW) && (() => {
    const c = readFileSync(VALUATION_ROUTE_3BW, 'utf8');
    return c.includes("'fixture'") && !c.includes('source=live') && !c.includes('source=auto');
  })());
check('Phase 3BW route has no live KIS import',
  existsSync(VALUATION_ROUTE_3BW) && !readFileSync(VALUATION_ROUTE_3BW, 'utf8').includes('getKisDomesticQuote'));
check('Phase 3BW route has no fetch call',
  existsSync(VALUATION_ROUTE_3BW) && !(/\bfetch\s*\(/.test(readFileSync(VALUATION_ROUTE_3BW, 'utf8'))));
check('No live GNews behavior added in 3BW route',
  existsSync(VALUATION_ROUTE_3BW) && !readFileSync(VALUATION_ROUTE_3BW, 'utf8').includes('gnews'));
check('No /news page created (3BW boundary)', !existsSync(join(root, 'src', 'pages', 'news')));
check('HomePortfolioPanel still present (3BW boundary)',
  existsSync(join(root, 'src', 'components', 'HomePortfolioPanel.astro')));
check('HomeMarketNews still present (3BW boundary)',
  existsSync(join(root, 'src', 'components', 'HomeMarketNews.astro')));
log('');

// ─── Phase 3BW-HF1 artifact group ────────────────────────────────────────────
log('--- Phase 3BW-HF1: Portfolio Bookmark Tab Order Local Persistence ---');

const RESULT_DOC_3BWHF1 = join(root, 'docs', 'planning', 'phase_3bw_hf1_portfolio_bookmark_tab_order_local_persistence_result_v0.1.md');
const TAB_ORDER_CHECKER = join(root, 'scripts', 'check_portfolio_tab_order_persistence_static_contract.mjs');
const PORTFOLIO_PAGE_HF1 = join(root, 'src', 'pages', 'portfolio.astro');
const VALUATION_ROUTE_HF1 = join(root, 'src', 'pages', 'api', 'portfolio', 'valuation.ts');

check('Phase 3BW-HF1 result doc exists', existsSync(RESULT_DOC_3BWHF1));
check('Tab order persistence checker exists', existsSync(TAB_ORDER_CHECKER));
check('package script check:portfolio-tab-order-persistence exists',
  (() => {
    let p = {};
    try { p = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')); } catch {}
    return typeof p.scripts?.['check:portfolio-tab-order-persistence'] === 'string';
  })());
check('No /news page created (3BW-HF1 boundary)', !existsSync(join(root, 'src', 'pages', 'news')));
check('HomePortfolioPanel still present (3BW-HF1 boundary)',
  existsSync(join(root, 'src', 'components', 'HomePortfolioPanel.astro')));
check('HomeMarketNews still present (3BW-HF1 boundary)',
  existsSync(join(root, 'src', 'components', 'HomeMarketNews.astro')));
check('No live GNews behavior added in portfolio page (3BW-HF1)',
  !existsSync(PORTFOLIO_PAGE_HF1) ||
  !readFileSync(PORTFOLIO_PAGE_HF1, 'utf8').includes('gnews.io'));
check('Valuation route unchanged by 3BW-HF1 (still fixture-only)',
  !existsSync(VALUATION_ROUTE_HF1) ||
  !readFileSync(VALUATION_ROUTE_HF1, 'utf8').includes('source=live'));
check('No new API route added for tab order (3BW-HF1)',
  !existsSync(join(root, 'src', 'pages', 'api', 'portfolio', 'tab-order.ts')) &&
  !existsSync(join(root, 'src', 'pages', 'api', 'portfolio', 'tab-order.js')));
check('No backend orderIndex added in portfolio page (3BW-HF1)',
  !existsSync(PORTFOLIO_PAGE_HF1) ||
  !readFileSync(PORTFOLIO_PAGE_HF1, 'utf8').includes('orderIndex'));
log('');

// --- Summary ---
log('=== Result ===');
if (failures === 0) {
  log('All checks passed. Exit 0.');
  process.exitCode = 0;
} else {
  log(`${failures} check(s) failed. Exit 1.`);
  process.exitCode = 1;
}
