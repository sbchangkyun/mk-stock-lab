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

check('No live adapter .mjs implementation file created', !existsSync(LIVE_ADAPTER_MJS_PATH));
check('No live adapter .ts implementation file created', !existsSync(LIVE_ADAPTER_TS_PATH));

if (existsSync(API_ROUTE_FILE_PATH)) {
  const routeContent3bb = readFileSync(API_ROUTE_FILE_PATH, 'utf8');
  check(
    'Existing route remains fixture-backed (liveEnabled: false in route or helper)',
    routeContent3bb.includes('liveEnabled: false') ||
    (existsSync(join(root, 'src', 'lib', 'news', 'gnewsMarketFeedResponse.mjs')) &&
     readFileSync(join(root, 'src', 'lib', 'news', 'gnewsMarketFeedResponse.mjs'), 'utf8').includes('liveEnabled: false')),
  );
}
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
