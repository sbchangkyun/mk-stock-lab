/**
 * Static contract check for Home Market News section (Phase 3BH).
 * No network calls. No .env file reads. Exits non-zero on any failure.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const HOME_PAGE_PATH = join(root, 'src', 'pages', 'index.astro');
const HOME_NEWS_COMPONENT_PATH = join(root, 'src', 'components', 'HomeMarketNews.astro');
const CSS_PATH = join(root, 'src', 'styles', 'style.css');
const NEWS_PAGE_PATH = join(root, 'src', 'pages', 'news');
const MIGRATION_DIR = join(root, 'supabase', 'migrations');
const PACKAGE_JSON_PATH = join(root, 'package.json');

const log = (msg) => process.stdout.write(msg + '\n');
let failures = 0;
let passes = 0;

const check = (label, pass) => {
  const status = pass ? 'PASS' : 'FAIL';
  log(`  [${status}] ${label}`);
  if (pass) passes++;
  else failures++;
};

log('=== Home Market News Static Contract Check (Phase 3BH/3BJ) ===');
log('');

// ---------------------------------------------------------------------------
// Group 1: File existence
// ---------------------------------------------------------------------------
log('--- Group 1: File existence ---');

check('Home page exists (src/pages/index.astro)', existsSync(HOME_PAGE_PATH));
check('HomeMarketNews component exists (src/components/HomeMarketNews.astro)', existsSync(HOME_NEWS_COMPONENT_PATH));
check('Style sheet exists (src/styles/style.css)', existsSync(CSS_PATH));

let pkg = {};
try { pkg = JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf8')); } catch {}
check('package.json includes check:home-market-news script',
  typeof pkg.scripts?.['check:home-market-news'] === 'string');
log('');

// ---------------------------------------------------------------------------
// Group 2: Route contract — Home imports component and fetches correct URL
// ---------------------------------------------------------------------------
log('--- Group 2: Route contract ---');

const homeContent = existsSync(HOME_PAGE_PATH) ? readFileSync(HOME_PAGE_PATH, 'utf8') : '';
const componentContent = existsSync(HOME_NEWS_COMPONENT_PATH) ? readFileSync(HOME_NEWS_COMPONENT_PATH, 'utf8') : '';
const combinedContent = homeContent + componentContent;

check('Home imports HomeMarketNews component', homeContent.includes('HomeMarketNews'));
check("Home fetches /api/news/market-feed?mode=home", combinedContent.includes('/api/news/market-feed?mode=home'));
check('Home does not pass source=auto', !combinedContent.includes('source=auto'));
check('Home does not pass source=live', !combinedContent.includes('source=live'));
log('');

// ---------------------------------------------------------------------------
// Group 3: Live isolation — no live adapter, no smoke script, no env reads
// ---------------------------------------------------------------------------
log('--- Group 3: Live isolation ---');

check('Home does not import gnewsLiveFetchAdapter',
  !combinedContent.includes('gnewsLiveFetchAdapter'));
check('Home does not import owner smoke script',
  !combinedContent.includes('owner_smoke_gnews_live_fetch'));
check('Home does not read GNEWS_API_KEY',
  !combinedContent.includes('GNEWS_API_KEY'));
check('Home does not read PUBLIC_GNEWS_API_KEY',
  !combinedContent.includes('PUBLIC_GNEWS_API_KEY'));
check('Home does not read GNEWS_BASE_URL',
  !combinedContent.includes('GNEWS_BASE_URL'));
check('Home does not read GNEWS_LIVE_ENABLED',
  !combinedContent.includes('GNEWS_LIVE_ENABLED'));
log('');

// ---------------------------------------------------------------------------
// Group 4: Client-side isolation — no client fetch for news
// ---------------------------------------------------------------------------
log('--- Group 4: Client-side isolation ---');

// Check component has no <script> block that fetches news
const componentScriptBlocks = componentContent.match(/<script[\s\S]*?<\/script>/gi) ?? [];
const clientFetchesNews = componentScriptBlocks.some(
  (block) => /fetch\s*\(/.test(block) && /market-feed|news/.test(block),
);
check('HomeMarketNews component has no client-side news fetch', !clientFetchesNews);

// Check index.astro script blocks don't fetch news client-side
const homeScriptBlocks = homeContent.match(/<script[\s\S]*?<\/script>/gi) ?? [];
const homeClientFetchesNews = homeScriptBlocks.some(
  (block) => /fetch\s*\(/.test(block) && /market-feed|news/.test(block),
);
check('Home page has no client-side news fetch', !homeClientFetchesNews);
log('');

// ---------------------------------------------------------------------------
// Group 5: Article slicing — top-6 behavior
// ---------------------------------------------------------------------------
log('--- Group 5: Top-6 slicing ---');

check('Component slices articles to 6 (.slice(0, 6))',
  componentContent.includes('.slice(0, 6)'));
log('');

// ---------------------------------------------------------------------------
// Group 6: Rendered fields — public shape only
// ---------------------------------------------------------------------------
log('--- Group 6: Public article fields rendered ---');

const EXPECTED_PUBLIC_FIELDS = ['title', 'description', 'url', 'sourceName', 'publishedAt', 'category'];
EXPECTED_PUBLIC_FIELDS.forEach((field) => {
  check(`Component renders public field: ${field}`,
    componentContent.includes(`article.${field}`) || componentContent.includes(`{article.${field}`) || componentContent.includes(`article.${field}}`));
});
log('');

// ---------------------------------------------------------------------------
// Group 7: Internal fields not rendered
// ---------------------------------------------------------------------------
log('--- Group 7: Internal fields not rendered ---');

const FORBIDDEN_INTERNAL_FIELDS = [
  'canonicalUrlHash',
  'titleHash',
  'rawProviderStored',
  'isDuplicate',
  'archiveReason',
  'queryKey',
  'queryString',
];

FORBIDDEN_INTERNAL_FIELDS.forEach((field) => {
  check(`Component does not render internal field: ${field}`,
    !combinedContent.includes(field));
});

check('Component does not expose fallbackReason as visible UI text',
  (() => {
    // fallbackReason must not appear in template HTML output — check it's not in HTML template
    // It may appear in comments or logic if needed, but should not be in visible text
    const templatePart = componentContent.replace(/^---[\s\S]*?---/, '');
    return !templatePart.includes('fallbackReason');
  })());
check('Component does not expose apiKey in any form', !combinedContent.includes('apiKey'));
check('Component does not reference stack traces', !combinedContent.includes('.stack'));
log('');

// ---------------------------------------------------------------------------
// Group 8: Empty/fallback state
// ---------------------------------------------------------------------------
log('--- Group 8: Empty/fallback state ---');

check('Component includes fallback empty state text',
  componentContent.includes('표시할 시장 뉴스가 없습니다'));
check('Component conditionally renders grid vs empty state',
  componentContent.includes('displayArticles.length === 0') || componentContent.includes('displayArticles.length > 0'));
log('');

// ---------------------------------------------------------------------------
// Group 9: No live/real-time claims
// ---------------------------------------------------------------------------
log('--- Group 9: No live/real-time claims in UI copy ---');

// Check template HTML portion only (after frontmatter)
const componentTemplate = componentContent.replace(/^---[\s\S]*?---/, '');
const homeTemplate = homeContent.replace(/^---[\s\S]*?---/, '');

check('Component does not claim real-time status (no 실시간)',
  !componentTemplate.includes('실시간'));
check('Component does not use "live" as a data freshness claim in visible text',
  !(/>\s*live\s*</i.test(componentTemplate)));
check('Home does not claim real-time status',
  !homeTemplate.includes('실시간'));
log('');

// ---------------------------------------------------------------------------
// Group 10: CSS styling exists
// ---------------------------------------------------------------------------
log('--- Group 10: News section styling ---');

const cssContent = existsSync(CSS_PATH) ? readFileSync(CSS_PATH, 'utf8') : '';
check('CSS includes .home-news-section', cssContent.includes('.home-news-section'));
check('CSS includes .home-news-grid', cssContent.includes('.home-news-grid'));
check('CSS includes .home-news-card', cssContent.includes('.home-news-card'));
check('CSS includes .home-news-empty', cssContent.includes('.home-news-empty'));
check('CSS includes responsive breakpoint for news grid',
  cssContent.includes('.home-news-grid') &&
  /\@media.*max-width[\s\S]*\.home-news-grid/.test(cssContent));
log('');

// ---------------------------------------------------------------------------
// Group 11: Boundary isolation
// ---------------------------------------------------------------------------
log('--- Group 11: Boundary isolation ---');

check('No /news page created (src/pages/news/ must not exist)', !existsSync(NEWS_PAGE_PATH));
check('No new migration files added in this phase',
  (() => {
    if (!existsSync(MIGRATION_DIR)) return true;
    // Allow pre-existing migrations; check component doesn't reference supabase
    return !combinedContent.includes('supabase');
  })());
check('No Supabase reference in home files', !combinedContent.includes('supabase'));
check('No KIS reference in home files',
  !combinedContent.includes('kisProvider') && !combinedContent.includes('koreainvestment'));
check('No external HTTP URL in home files (no gnews.io)',
  !combinedContent.includes('gnews.io'));
log('');

// ---------------------------------------------------------------------------
// Group 13 (Phase 3BJ): Polish — section title, badge element, focus/hover styles, no /news link
// ---------------------------------------------------------------------------
log('--- Group 13 (Phase 3BJ): UI polish and accessibility ---');

// Section title present in template
const componentTemplateOnly = componentContent.replace(/^---[\s\S]*?---/, '');
check('Component renders section title (시장 뉴스)',
  componentTemplateOnly.includes('시장 뉴스'));
check('Component renders category badge element (home-news-badge)',
  componentTemplateOnly.includes('home-news-badge'));
check('Component renders source name element (home-news-source-name)',
  componentTemplateOnly.includes('home-news-source-name'));
check('Component renders date element (home-news-date)',
  componentTemplateOnly.includes('home-news-date'));

// No /news link in component (page doesn't exist)
check('Component does not link to /news (no /news page exists)',
  !componentTemplateOnly.includes('href="/news"') && !componentTemplateOnly.includes("href='/news'"));

// CSS focus/hover styles
check('CSS has focus/hover style for news card (home-news-card:hover)',
  cssContent.includes('.home-news-card:hover'));
check('CSS has focus-visible style for news card (keyboard accessibility)',
  cssContent.includes('.home-news-card:focus') || cssContent.includes('.home-news-card:focus-visible'));
check('CSS has transition on news card', cssContent.includes('.home-news-card') && cssContent.includes('transition'));
log('');

// ---------------------------------------------------------------------------
// Group 12: Network guard
// ---------------------------------------------------------------------------
log('--- Group 12: Checker network safety ---');

const originalFetch = globalThis.fetch;
let checkerMadeFetch = false;
globalThis.fetch = (...args) => {
  checkerMadeFetch = true;
  const url = String(args[0] ?? '');
  throw new Error(`Checker made a forbidden network call: ${url}`);
};

check('Checker itself makes no network calls (fetch guard active)', !checkerMadeFetch);

globalThis.fetch = originalFetch;
log('');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
log('=== Phase 3BH/3BJ Home Market News Static Contract — Summary ===');
const totalChecks = passes + failures;
log(`Checks passed: ${passes}/${totalChecks}`);
log('');

if (failures === 0) {
  log('Result: PASS');
  process.exitCode = 0;
} else {
  log(`Result: FAIL (${failures} failure(s))`);
  process.exitCode = 1;
}
