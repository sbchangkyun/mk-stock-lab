/**
 * Static structural validation for Phase 3BB GNews live fetch adapter design document.
 * Verifies design doc completeness and confirms no live adapter was prematurely created.
 * No network calls. No .env file reads. Exits non-zero on any failure.
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const DESIGN_DOC_PATH = join(root, 'docs', 'planning', 'phase_3bb_gnews_live_fetch_adapter_design_v0.1.md');
const ROUTE_PATH = join(root, 'src', 'pages', 'api', 'news', 'market-feed.ts');
const HELPER_PATH = join(root, 'src', 'lib', 'news', 'gnewsMarketFeedResponse.mjs');
const LIVE_ADAPTER_PATH = join(root, 'src', 'lib', 'news', 'gnewsLiveFetchAdapter.mjs');
const LIVE_ADAPTER_TS_PATH = join(root, 'src', 'lib', 'news', 'gnewsLiveFetchAdapter.ts');
const HOME_PAGE_PATH = join(root, 'src', 'pages', 'index.astro');
const NEWS_PAGE_PATH = join(root, 'src', 'pages', 'news');
const PACKAGE_JSON_PATH = join(root, 'package.json');
const SUPABASE_MIGRATIONS_PATH = join(root, 'supabase', 'migrations');
const VERCEL_JSON_PATH = join(root, 'vercel.json');

const EXPECTED_CATEGORIES = [
  'MARKET_STOCKS',
  'MACRO_POLICY',
  'FX',
  'OIL_COMMODITIES',
  'CRYPTO_DIGITAL_ASSETS',
  'PERSONAL_FINANCE',
];
const EXPECTED_KOREAN_TERMS = ['코인', '환율', '유가', '금리', '비트코인', 'ETF'];

const log = (msg) => process.stdout.write(msg + '\n');

let failures = 0;
const check = (label, pass) => {
  const status = pass ? 'PASS' : 'FAIL';
  log(`  [${status}] ${label}`);
  if (!pass) failures++;
};

log('=== GNews Live Fetch Adapter Design Static Contract Check (Phase 3BB) ===');
log('');

// ---------------------------------------------------------------------------
// Group 1: Design document existence
// ---------------------------------------------------------------------------
log('--- Group 1: Design document existence ---');

const docExists = existsSync(DESIGN_DOC_PATH);
check('Phase 3BB design document exists', docExists);

let pkg = {};
try {
  pkg = JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf8'));
} catch {
  check('package.json parses as valid JSON', false);
}
check(
  'check:gnews-live-adapter-design script registered in package.json',
  typeof pkg.scripts?.['check:gnews-live-adapter-design'] === 'string',
);
log('');

if (!docExists) {
  log('ERROR: Design document missing — skipping content checks.');
  process.exitCode = 1;
} else {
  const doc = readFileSync(DESIGN_DOC_PATH, 'utf8');

  // ---------------------------------------------------------------------------
  // Group 2: Metadata and phase identity
  // ---------------------------------------------------------------------------
  log('--- Group 2: Metadata and phase identity ---');
  check('Design doc includes Phase 3BB identifier', doc.includes('Phase 3BB') || doc.includes('Phase: 3BB'));
  check(
    'Design doc states live GNews calls not performed',
    /Live GNews calls.*not performed/i.test(doc),
  );
  check(
    'Design doc states live adapter implementation not performed',
    /live adapter implementation.*not performed/i.test(doc),
  );
  check(
    'Design doc states API route runtime change none',
    /API route runtime change.*none/i.test(doc) || /route runtime change.*none/i.test(doc),
  );
  log('');

  // ---------------------------------------------------------------------------
  // Group 3: Future adapter module
  // ---------------------------------------------------------------------------
  log('--- Group 3: Future adapter module contract ---');
  check(
    'Design doc mentions future gnewsLiveFetchAdapter.mjs',
    doc.includes('gnewsLiveFetchAdapter.mjs'),
  );
  check(
    'Design doc documents buildGnewsSearchUrl function',
    doc.includes('buildGnewsSearchUrl'),
  );
  check(
    'Design doc documents fetchGnewsTheme function',
    doc.includes('fetchGnewsTheme'),
  );
  check(
    'Design doc documents normalizeGnewsArticle function',
    doc.includes('normalizeGnewsArticle'),
  );
  check(
    'Design doc documents sanitizeGnewsAdapterError function',
    doc.includes('sanitizeGnewsAdapterError'),
  );
  log('');

  // ---------------------------------------------------------------------------
  // Group 4: Environment variable policy
  // ---------------------------------------------------------------------------
  log('--- Group 4: Environment variable policy ---');
  check(
    'Design doc names GNEWS_API_KEY as server-only preferred',
    doc.includes('GNEWS_API_KEY') &&
    (doc.includes('server-only') || doc.includes('Server-only') || doc.includes('server only')),
  );
  check(
    'Design doc mentions PUBLIC_GNEWS_API_KEY as server-side fallback only',
    doc.includes('PUBLIC_GNEWS_API_KEY') &&
    (doc.includes('fallback') || doc.includes('compatibility fallback')),
  );
  check(
    'Design doc forbids client/browser use of PUBLIC_GNEWS_API_KEY',
    doc.includes('PUBLIC_GNEWS_API_KEY') &&
    (doc.includes('must never') || doc.includes('must not') || doc.includes('never')) &&
    doc.includes('client') || doc.includes('browser'),
  );
  log('');

  // ---------------------------------------------------------------------------
  // Group 5: Kill-switch policy
  // ---------------------------------------------------------------------------
  log('--- Group 5: Kill-switch policy ---');
  check(
    'Design doc defines GNEWS_LIVE_ENABLED kill-switch variable',
    doc.includes('GNEWS_LIVE_ENABLED'),
  );
  check(
    'Design doc states kill switch is disabled by default',
    doc.includes('disabled') && doc.includes('GNEWS_LIVE_ENABLED'),
  );
  check(
    'Design doc states Production live mode blocked until future approval',
    doc.includes('Production') &&
    (doc.includes('blocked') || doc.includes('disabled until')) &&
    (doc.includes('future') || doc.includes('separately')),
  );
  check(
    'Design doc mentions VERCEL_ENV=production as production guard',
    doc.includes('VERCEL_ENV=production') || doc.includes('VERCEL_ENV'),
  );
  log('');

  // ---------------------------------------------------------------------------
  // Group 6: Query strategy
  // ---------------------------------------------------------------------------
  log('--- Group 6: Query strategy (categories and Korean terms) ---');
  EXPECTED_CATEGORIES.forEach((cat) => {
    check(`Design doc includes category ${cat}`, doc.includes(cat));
  });
  EXPECTED_KOREAN_TERMS.forEach((term) => {
    check(`Design doc includes Korean term '${term}'`, doc.includes(term));
  });
  log('');

  // ---------------------------------------------------------------------------
  // Group 7: Request budget and cache
  // ---------------------------------------------------------------------------
  log('--- Group 7: Request budget and cache policy ---');
  check(
    'Design doc includes 2-hour refresh interval',
    doc.includes('2 hours') || doc.includes('2-hour'),
  );
  check(
    'Design doc includes 72 requests/day budget',
    doc.includes('72 requests/day'),
  );
  check(
    'Design doc includes 28 requests/day headroom',
    doc.includes('28 requests/day') || doc.includes('28 requests'),
  );
  check('Design doc includes s-maxage=7200 cache directive', doc.includes('s-maxage=7200'));
  check(
    'Design doc includes stale-while-revalidate=21600 cache directive',
    doc.includes('stale-while-revalidate=21600'),
  );
  log('');

  // ---------------------------------------------------------------------------
  // Group 8: Failure and fallback policy
  // ---------------------------------------------------------------------------
  log('--- Group 8: Failure and fallback policy ---');
  check('Design doc addresses missing API key failure', doc.includes('Missing API key') || doc.includes('missing') && doc.includes('key'));
  check('Design doc addresses 429 / rate limit', doc.includes('429'));
  check('Design doc addresses 5xx / server error', doc.includes('5xx'));
  check('Design doc addresses network timeout', doc.includes('timeout') || doc.includes('Timeout'));
  check('Design doc addresses empty result failure', doc.includes('empty result') || doc.includes('Empty result'));
  check('Design doc addresses partial query failure', doc.includes('partial') || doc.includes('Partial'));
  log('');

  // ---------------------------------------------------------------------------
  // Group 9: Normalization and security policy
  // ---------------------------------------------------------------------------
  log('--- Group 9: Normalization and security policy ---');
  check(
    'Design doc states raw provider payload must not be stored',
    (doc.includes('raw provider') || doc.includes('Raw provider')) &&
    (doc.includes('must not be stored') || doc.includes('must not be persisted') || doc.includes('not be stored') || doc.includes('not be persist')),
  );
  check(
    'Design doc states raw provider errors must not be exposed',
    (doc.includes('raw provider') || doc.includes('Raw provider') || doc.includes('raw')) &&
    (doc.includes('must not be exposed') || doc.includes('must not propagate') || doc.includes('Never expose') || doc.includes('never expose')),
  );
  check('Design doc mentions rawProviderStored: false invariant', doc.includes('rawProviderStored: false'));
  check(
    'Design doc states response contract must be preserved',
    doc.includes('contract') &&
    (doc.includes('preserved') || doc.includes('preservation') || doc.includes('must preserve')),
  );
  log('');

  // ---------------------------------------------------------------------------
  // Group 10: Owner-run smoke plan
  // ---------------------------------------------------------------------------
  log('--- Group 10: Owner-run smoke validation plan ---');
  check(
    'Design doc includes owner-run smoke plan',
    doc.includes('owner-run smoke') || doc.includes('owner smoke') || doc.includes('owner_smoke'),
  );
  check(
    'Design doc names proposed smoke script owner_smoke_gnews_live_fetch.mjs',
    doc.includes('owner_smoke_gnews_live_fetch'),
  );
  check(
    'Design doc caps smoke run at 2 requests',
    doc.includes('2 requests') || doc.includes('max') && doc.includes('2'),
  );
  check(
    'Design doc forbids printing article URLs in smoke output',
    (doc.includes('Article URLs') || doc.includes('article URLs') || doc.includes('URLs')) &&
    (doc.includes('must not') || doc.includes('Must not') || doc.includes('not print')),
  );
  check(
    'Design doc forbids printing article titles in smoke output',
    (doc.includes('titles') || doc.includes('Article titles')) &&
    (doc.includes('must not') || doc.includes('Must not') || doc.includes('not print')),
  );
  check(
    'Design doc forbids printing article descriptions in smoke output',
    (doc.includes('descriptions') || doc.includes('Article descriptions')) &&
    (doc.includes('must not') || doc.includes('Must not') || doc.includes('not print')),
  );
  log('');

  // ---------------------------------------------------------------------------
  // Group 11: Recommended future phases
  // ---------------------------------------------------------------------------
  log('--- Group 11: Recommended future phases ---');
  check('Design doc recommends future Phase 3BC', doc.includes('3BC'));
  check('Design doc recommends future Phase 3BD', doc.includes('3BD'));
  check('Design doc recommends future Phase 3BE', doc.includes('3BE'));
  check('Design doc recommends future Phase 3BF', doc.includes('3BF'));
  log('');
}

// ---------------------------------------------------------------------------
// Group 12: No premature live implementation
// ---------------------------------------------------------------------------
log('--- Group 12: No premature live implementation ---');

check(
  'No live adapter .mjs file created (gnewsLiveFetchAdapter.mjs must not exist)',
  !existsSync(LIVE_ADAPTER_PATH),
);
check(
  'No live adapter .ts file created (gnewsLiveFetchAdapter.ts must not exist)',
  !existsSync(LIVE_ADAPTER_TS_PATH),
);
check(
  'No /news page created (src/pages/news/ must not exist)',
  !existsSync(NEWS_PAGE_PATH),
);

if (existsSync(ROUTE_PATH)) {
  const routeContent = readFileSync(ROUTE_PATH, 'utf8');
  check(
    'Existing route still has liveEnabled: false',
    routeContent.includes('liveEnabled: false') ||
    (existsSync(HELPER_PATH) && readFileSync(HELPER_PATH, 'utf8').includes('liveEnabled: false')),
  );
  const routeActualFetch =
    /(?:await|=\s*|return\s+)fetch\s*\(/.test(routeContent) ||
    /\bfetch\s*\(\s*['"`]https?:/.test(routeContent);
  check('Existing route makes no actual fetch call', !routeActualFetch);
  check('Existing route does not use GNEWS_API_KEY', !/GNEWS_API_KEY/.test(routeContent));
  check('Existing route does not use PUBLIC_GNEWS_API_KEY', !/PUBLIC_GNEWS_API_KEY/.test(routeContent));
  check('Existing route does not reference gnews.io', !routeContent.includes('gnews.io'));
} else {
  ['Existing route still has liveEnabled: false', 'Existing route makes no actual fetch call',
    'Existing route does not use GNEWS_API_KEY', 'Existing route does not use PUBLIC_GNEWS_API_KEY',
    'Existing route does not reference gnews.io'].forEach((label) => check(label, false));
}

if (existsSync(HELPER_PATH)) {
  const helperContent = readFileSync(HELPER_PATH, 'utf8');
  const helperActualFetch =
    /(?:await|=\s*|return\s+)fetch\s*\(/.test(helperContent) ||
    /\bfetch\s*\(\s*['"`]https?:/.test(helperContent);
  check('Existing helper makes no actual fetch call', !helperActualFetch);
  check('Existing helper does not use GNEWS_API_KEY', !/GNEWS_API_KEY/.test(helperContent));
  check('Existing helper does not use PUBLIC_GNEWS_API_KEY', !/PUBLIC_GNEWS_API_KEY/.test(helperContent));
} else {
  ['Existing helper makes no actual fetch call', 'Existing helper does not use GNEWS_API_KEY',
    'Existing helper does not use PUBLIC_GNEWS_API_KEY'].forEach((label) => check(label, false));
}

if (existsSync(HOME_PAGE_PATH)) {
  const homeContent = readFileSync(HOME_PAGE_PATH, 'utf8');
  check(
    'Home page does not import live adapter',
    !homeContent.includes('gnewsLiveFetchAdapter'),
  );
  check(
    'Home page does not directly call market-feed route',
    !homeContent.includes('/api/news/market-feed'),
  );
} else {
  check('Home page does not import live adapter', true);
  check('Home page does not directly call market-feed route', true);
}

const hasGnewsMigration = existsSync(SUPABASE_MIGRATIONS_PATH) &&
  readdirSync(SUPABASE_MIGRATIONS_PATH).some((f) => f.toLowerCase().includes('gnews'));
check('No gnews-related Supabase migration file added', !hasGnewsMigration);

check(
  'vercel.json not modified (does not reference live adapter)',
  !existsSync(VERCEL_JSON_PATH) || !readFileSync(VERCEL_JSON_PATH, 'utf8').includes('gnewsLiveFetchAdapter'),
);

// Verify this script itself makes no HTTP requests (self-check)
const selfContent = readFileSync(fileURLToPath(import.meta.url), 'utf8');
const selfActualFetch =
  /(?:await|=\s*|return\s+)fetch\s*\(/.test(selfContent) ||
  /\bfetch\s*\(\s*['"`]https?:/.test(selfContent);
check('This checker script makes no HTTP requests', !selfActualFetch);
check(
  'This checker script does not call dotenv or read env file contents',
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
