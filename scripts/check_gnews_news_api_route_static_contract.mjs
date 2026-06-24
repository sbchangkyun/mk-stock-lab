/**
 * Static structural validation for the GNews market-feed API route skeleton (Phase 3BA).
 * No network calls. No .env file reads. Exits non-zero on any failure.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const ROUTE_PATH = join(root, 'src', 'pages', 'api', 'news', 'market-feed.ts');
const HELPER_PATH = join(root, 'src', 'lib', 'news', 'gnewsMarketFeedResponse.mjs');
const POLICY_PATH = join(root, 'src', 'lib', 'news', 'gnewsNewsPolicy.mjs');
const FIXTURE_PATH = join(root, 'src', 'data', 'fixtures', 'gnews_market_news_fixture_v0.1.json');
const PACKAGE_JSON_PATH = join(root, 'package.json');
const HOME_PAGE_PATH = join(root, 'src', 'pages', 'index.astro');
const NEWS_PAGE_PATH = join(root, 'src', 'pages', 'news');

const log = (msg) => process.stdout.write(msg + '\n');

let failures = 0;

const check = (label, pass) => {
  const status = pass ? 'PASS' : 'FAIL';
  log(`  [${status}] ${label}`);
  if (!pass) failures++;
};

log('=== GNews News API Route Static Contract Check (Phase 3BA) ===');
log('');

// ---------------------------------------------------------------------------
// Group 1: File existence
// ---------------------------------------------------------------------------
log('--- Group 1: File existence ---');

const routeExists = existsSync(ROUTE_PATH);
const helperExists = existsSync(HELPER_PATH);
const policyExists = existsSync(POLICY_PATH);

check('API route file exists (src/pages/api/news/market-feed.ts)', routeExists);
check('Response helper exists (src/lib/news/gnewsMarketFeedResponse.mjs)', helperExists);
check('Policy utility exists (src/lib/news/gnewsNewsPolicy.mjs)', policyExists);

let pkg = {};
try {
  pkg = JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf8'));
} catch {
  check('package.json parses as valid JSON', false);
}
check(
  'check:gnews-news-api-route script registered in package.json',
  typeof pkg.scripts?.['check:gnews-news-api-route'] === 'string',
);
log('');

// ---------------------------------------------------------------------------
// Group 2: Route structure
// ---------------------------------------------------------------------------
log('--- Group 2: Route structure ---');

if (routeExists) {
  const routeContent = readFileSync(ROUTE_PATH, 'utf8');

  check('Route exports GET handler (export const GET)', /export\s+const\s+GET\s*:/.test(routeContent));
  check('Route has prerender = false', /prerender\s*=\s*false/.test(routeContent));
  check('Route imports fixture JSON', routeContent.includes('gnews_market_news_fixture_v0.1.json'));
  check(
    'Route imports response helper (gnewsMarketFeedResponse)',
    routeContent.includes('gnewsMarketFeedResponse'),
  );
  check(
    'Route has ALL or fallback method handler',
    /export\s+const\s+ALL\s*:/.test(routeContent) || /method_not_allowed/.test(routeContent),
  );
} else {
  ['Route exports GET handler', 'Route has prerender = false', 'Route imports fixture JSON',
    'Route imports response helper', 'Route has ALL or fallback method handler'].forEach(
    (label) => check(label, false),
  );
}
log('');

// ---------------------------------------------------------------------------
// Group 3: Response helper structure
// ---------------------------------------------------------------------------
log('--- Group 3: Response helper structure ---');

if (helperExists) {
  const helperContent = readFileSync(HELPER_PATH, 'utf8');

  check(
    'Helper exports sanitizeMarketNewsArticle',
    helperContent.includes('sanitizeMarketNewsArticle'),
  );
  check(
    'Helper exports buildMarketNewsHomeResponse',
    helperContent.includes('buildMarketNewsHomeResponse'),
  );
  check(
    'Helper exports buildMarketNewsListResponse',
    helperContent.includes('buildMarketNewsListResponse'),
  );
  check(
    'Helper exports buildMarketNewsErrorResponse',
    helperContent.includes('buildMarketNewsErrorResponse'),
  );
  check("Helper response defaults source to 'fixture'",
    helperContent.includes("source: 'fixture'") || helperContent.includes("?? 'fixture'"));
  check('Helper response defaults liveEnabled to false',
    helperContent.includes('liveEnabled: false') || helperContent.includes('?? false'));
  check(
    'Helper imports from gnewsNewsPolicy.mjs',
    helperContent.includes('gnewsNewsPolicy.mjs'),
  );
} else {
  [
    'Helper exports sanitizeMarketNewsArticle',
    'Helper exports buildMarketNewsHomeResponse',
    'Helper exports buildMarketNewsListResponse',
    'Helper exports buildMarketNewsErrorResponse',
    "Helper response includes source: 'fixture'",
    'Helper response includes liveEnabled: false',
    'Helper imports from gnewsNewsPolicy.mjs',
  ].forEach((label) => check(label, false));
}
log('');

// ---------------------------------------------------------------------------
// Group 4: Public article sanitization — internal fields excluded
// ---------------------------------------------------------------------------
log('--- Group 4: Public article sanitization ---');

if (helperExists) {
  const helperContent = readFileSync(HELPER_PATH, 'utf8');

  const EXCLUDED_FIELDS = [
    'canonicalUrlHash',
    'titleHash',
    'duplicateGroupId',
    'providerArticleId',
    'rawProviderStored',
  ];

  check(
    'sanitizeMarketNewsArticle function is defined',
    /function\s+sanitizeMarketNewsArticle/.test(helperContent),
  );

  const sanitizerStart = helperContent.indexOf('function sanitizeMarketNewsArticle');
  const sanitizerEnd = helperContent.indexOf('\n}', sanitizerStart) + 2;
  const sanitizerBody = sanitizerStart >= 0 ? helperContent.slice(sanitizerStart, sanitizerEnd) : '';

  EXCLUDED_FIELDS.forEach((field) => {
    check(
      `Sanitizer excludes internal field: ${field}`,
      sanitizerBody.length > 0 && !sanitizerBody.includes(field),
    );
  });
} else {
  ['sanitizeMarketNewsArticle function defined',
    ...['canonicalUrlHash', 'titleHash', 'duplicateGroupId', 'providerArticleId', 'rawProviderStored'].map(
      (f) => `Sanitizer excludes internal field: ${f}`,
    ),
  ].forEach((label) => check(label, false));
}
log('');

// ---------------------------------------------------------------------------
// Group 5: Error and mode handling
// ---------------------------------------------------------------------------
log('--- Group 5: Error and mode handling ---');

const routeContent2 = routeExists ? readFileSync(ROUTE_PATH, 'utf8') : '';
const helperContent2 = helperExists ? readFileSync(HELPER_PATH, 'utf8') : '';
const combined = routeContent2 + helperContent2;

check(
  'Invalid mode handling present (VALID_MODES or invalid_mode check)',
  combined.includes('VALID_MODES') || combined.includes('invalid_mode'),
);
check(
  'Invalid category handling present (VALID_CATEGORIES or invalid_category check)',
  combined.includes('VALID_CATEGORIES') || combined.includes('invalid_category'),
);
check(
  "Error code 'invalid_mode' defined",
  combined.includes('invalid_mode'),
);
check(
  "Error code 'invalid_category' defined",
  combined.includes('invalid_category'),
);
check(
  'Error response excludes stack traces (no .stack reference in output)',
  !combined.includes('err.stack') && !combined.includes('error.stack') && !combined.includes('.stack}'),
);
log('');

// ---------------------------------------------------------------------------
// Group 6: Security — no live GNews, no forbidden patterns
// ---------------------------------------------------------------------------
log('--- Group 6: Security and live-mode isolation ---');

const routeRaw = routeExists ? readFileSync(ROUTE_PATH, 'utf8') : '';
const helperRaw = helperExists ? readFileSync(HELPER_PATH, 'utf8') : '';

// Targeted fetch check — must not be an actual HTTP call (not a regex definition)
const routeActualFetch =
  /(?:await|=\s*|return\s+)fetch\s*\(/.test(routeRaw) ||
  /\bfetch\s*\(\s*['"`]https?:/.test(routeRaw);
const helperActualFetch =
  /(?:await|=\s*|return\s+)fetch\s*\(/.test(helperRaw) ||
  /\bfetch\s*\(\s*['"`]https?:/.test(helperRaw);
check('Route makes no actual fetch call', !routeActualFetch);
check('Helper makes no actual fetch call', !helperActualFetch);

check(
  'No XMLHttpRequest instantiation in route or helper',
  !/new\s+XMLHttpRequest\s*\(/.test(routeRaw + helperRaw),
);
check(
  'No axios import in route or helper',
  !/import\s+.*from\s+['"]axios['"]/.test(routeRaw + helperRaw),
);
check(
  'No gnews.io reference in route or helper',
  !routeRaw.includes('gnews.io') && !helperRaw.includes('gnews.io'),
);
check(
  'No GNEWS_API_KEY reference in route',
  !(/GNEWS_API_KEY/.test(routeRaw)),
);
check(
  'No GNEWS_API_KEY reference in helper',
  !(/GNEWS_API_KEY/.test(helperRaw)),
);
check(
  'No PUBLIC_GNEWS_API_KEY reference in route',
  !(/PUBLIC_GNEWS_API_KEY/.test(routeRaw)),
);
check(
  'No import.meta.env.PUBLIC_GNEWS_API_KEY in route',
  !(/import\.meta\.env\.PUBLIC_GNEWS_API_KEY/.test(routeRaw)),
);
check(
  'No Supabase import in route or helper',
  !/from\s+['"]@supabase\//.test(routeRaw + helperRaw),
);
check(
  'No KIS provider import in route or helper',
  !/from\s+['"].*koreainvestment/.test(routeRaw + helperRaw) &&
  !routeRaw.includes('kisProvider') && !helperRaw.includes('kisProvider'),
);
log('');

// ---------------------------------------------------------------------------
// Group 7: Isolation — no Home integration, no /news page
// ---------------------------------------------------------------------------
log('--- Group 7: Boundary isolation ---');

check(
  'No /news page created (src/pages/news/ must not exist)',
  !existsSync(NEWS_PAGE_PATH),
);

if (existsSync(HOME_PAGE_PATH)) {
  const homeContent = readFileSync(HOME_PAGE_PATH, 'utf8');
  check(
    'Home page connects to market-feed via SSR fetch only (not direct import)',
    // Phase 3BH: Home SSR-fetches /api/news/market-feed?mode=home — allowed.
    // Check it does NOT import the route file or live adapter directly.
    !homeContent.includes("from '../api/news/market-feed'") &&
    !homeContent.includes('gnewsLiveFetchAdapter'),
  );
} else {
  check('Home page connects to market-feed via SSR fetch only (not direct import)', true);
}

check(
  'Fixture remains synthetic (metadata.isSynthetic: true)',
  existsSync(FIXTURE_PATH)
    ? JSON.parse(readFileSync(FIXTURE_PATH, 'utf8'))?.metadata?.isSynthetic === true
    : false,
);
log('');

// ---------------------------------------------------------------------------
// Group 8: Phase 3BG — source selector integration
// ---------------------------------------------------------------------------
log('--- Group 8: Phase 3BG source selector integration ---');

const SELECTOR_MJS_PATH = join(root, 'src', 'lib', 'news', 'gnewsMarketFeedSourceSelector.mjs');
const routeContentBG = routeExists ? readFileSync(ROUTE_PATH, 'utf8') : '';

check('Source selector module exists (gnewsMarketFeedSourceSelector.mjs)', existsSync(SELECTOR_MJS_PATH));
check('Route imports source selector helper', routeContentBG.includes('gnewsMarketFeedSourceSelector'));
check('Route supports source query parameter', routeContentBG.includes('parseNewsSourceParam'));
check('Route handles invalid_source error code', routeContentBG.includes('invalid_source'));
check('Route default source remains fixture (parseNewsSourceParam returns fixture for null)',
  existsSync(SELECTOR_MJS_PATH)
    ? readFileSync(SELECTOR_MJS_PATH, 'utf8').includes("return 'fixture'")
    : false);
check('Route does not import owner smoke script',
  !routeContentBG.includes('owner_smoke_gnews_live_fetch'));
check('Route does not import live adapter directly (adapter accessed via selector)',
  !routeContentBG.includes('gnewsLiveFetchAdapter'));
check('Route does not expose GNEWS_API_KEY directly', !(/GNEWS_API_KEY/.test(routeContentBG)));
check('Route has fixture fallback for live failure (uses buildMarketNewsHomeResponse with meta)',
  routeContentBG.includes('feedResult.meta'));
check('Route keeps production live blocked (production check is inside selector/gate, not route)',
  existsSync(SELECTOR_MJS_PATH)
    ? readFileSync(SELECTOR_MJS_PATH, 'utf8').includes('production_blocked')
    : false);
check('Route source=fixture path does not call live fetch (requestedSource === fixture early return)',
  routeContentBG.includes("requestedSource === 'fixture'") || routeContentBG.includes('requestedSource === "fixture"'));
check('Selector exports VALID_NEWS_SOURCES containing fixture/auto/live',
  existsSync(SELECTOR_MJS_PATH) && (() => {
    const sel = readFileSync(SELECTOR_MJS_PATH, 'utf8');
    return sel.includes("'fixture'") && sel.includes("'auto'") && sel.includes("'live'");
  })());
check('Selector has sanitized fallback reason allowlist', existsSync(SELECTOR_MJS_PATH)
  ? readFileSync(SELECTOR_MJS_PATH, 'utf8').includes('ALLOWED_FALLBACK_REASONS')
  : false);
check('No Home integration (home page does not import selector or live adapter)',
  (() => {
    if (!existsSync(HOME_PAGE_PATH)) return true;
    const h = readFileSync(HOME_PAGE_PATH, 'utf8');
    return !h.includes('gnewsMarketFeedSourceSelector') && !h.includes('gnewsLiveFetchAdapter');
  })());
check('No /news page created', !existsSync(NEWS_PAGE_PATH));
log('');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
log('=== Result ===');
if (failures === 0) {
  log(`All checks passed (groups 1-8 validated). Exit 0.`);
  process.exitCode = 0;
} else {
  log(`${failures} check(s) failed. Exit 1.`);
  process.exitCode = 1;
}
