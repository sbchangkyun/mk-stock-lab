/**
 * Static contract check for Phase 4F-UX1-B -- Home MARKET NEWS breaking/exclusive emphasis.
 * Verifies the exact four-prefix whitelist, that no arbitrary bracket text is classified, that
 * the visual treatment is static (no blink/pulse/infinite animation), that the existing news
 * contract (category/source/date/link) is preserved, and that the UX1-A Home surface guard and
 * component order remain unchanged. No network calls, no execution of the parser module itself
 * (that behavior is covered by scripts/smoke_phase_4f_ux1b_home_news_emphasis.mjs) -- this is
 * static source-text analysis only.
 */

globalThis.fetch = async (url) => {
  throw new Error(`[checker] BLOCKED unexpected network call to: ${String(url).slice(0, 60)}`);
};

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const EMPHASIS_MODULE = join(root, 'src', 'lib', 'home', 'homeNewsEmphasis.ts');
const HOME_MARKET_NEWS = join(root, 'src', 'components', 'HomeMarketNews.astro');
const SURFACE_GUARD = join(root, 'src', 'lib', 'home', 'homeDynamicSurfaceGuard.ts');
const INDEX_ASTRO = join(root, 'src', 'pages', 'index.astro');
const STYLE_CSS = join(root, 'src', 'styles', 'style.css');
const PORTFOLIO_ASTRO = join(root, 'src', 'pages', 'portfolio.astro');
const CHART_AI_ASTRO = join(root, 'src', 'pages', 'chart-ai.astro');
const LAB_ASTRO = join(root, 'src', 'pages', 'lab.astro');
const PACKAGE_JSON = join(root, 'package.json');

const log = (msg) => process.stdout.write(msg + '\n');
let failures = 0;
let passes = 0;

const check = (label, pass) => {
  log(`  [${pass ? 'PASS' : 'FAIL'}] ${label}`);
  if (pass) passes++;
  else failures++;
};

const readOr = (path) => (existsSync(path) ? readFileSync(path, 'utf8') : '');

log('=== Phase 4F-UX1-B Home News Emphasis Static Contract ===');
log('');

const emphasisModule = readOr(EMPHASIS_MODULE);
const homeMarketNews = readOr(HOME_MARKET_NEWS);
const surfaceGuard = readOr(SURFACE_GUARD);
const indexAstro = readOr(INDEX_ASTRO);
const styleCss = readOr(STYLE_CSS);
const portfolioAstro = readOr(PORTFOLIO_ASTRO);
const chartAiAstro = readOr(CHART_AI_ASTRO);
const labAstro = readOr(LAB_ASTRO);
const packageJson = readOr(PACKAGE_JSON);

// ---------------------------------------------------------------------------
// Group 1: exact four-prefix whitelist, no arbitrary bracket classification
// ---------------------------------------------------------------------------
log('--- Group 1: exact prefix whitelist ---');
check('src/lib/home/homeNewsEmphasis.ts exists', existsSync(EMPHASIS_MODULE) && emphasisModule.length > 0);
check("whitelist includes exactly '[급보]' -> breaking", /prefix:\s*'\[급보\]',\s*emphasis:\s*'breaking'/.test(emphasisModule));
check("whitelist includes exactly '[긴급]' -> breaking", /prefix:\s*'\[긴급\]',\s*emphasis:\s*'breaking'/.test(emphasisModule));
check("whitelist includes exactly '[속보]' -> breaking", /prefix:\s*'\[속보\]',\s*emphasis:\s*'breaking'/.test(emphasisModule));
check("whitelist includes exactly '[단독]' -> exclusive", /prefix:\s*'\[단독\]',\s*emphasis:\s*'exclusive'/.test(emphasisModule));

const prefixEntryCount = (emphasisModule.match(/prefix:\s*'\[[^\]]*\]'/g) || []).length;
check('whitelist has exactly 4 prefix entries (no extra bracket prefixes registered)', prefixEntryCount === 4);

check(
  'parser matches via exact startsWith on a fixed literal prefix, not a generic bracket regex',
  emphasisModule.includes('trimStart()') &&
    emphasisModule.includes('.startsWith(r.prefix)') &&
    !/\/\^?\\\[.*\\\]/.test(emphasisModule),
);
check(
  'parser exports the NewsEmphasis union type restricted to breaking | exclusive | null',
  /export type NewsEmphasis = 'breaking' \| 'exclusive' \| null/.test(emphasisModule),
);

// ---------------------------------------------------------------------------
// Group 2: HomeMarketNews.astro wiring -- explicit badge + dedicated visual classes
// ---------------------------------------------------------------------------
log('--- Group 2: rendering wiring ---');
check(
  'HomeMarketNews.astro imports the emphasis helpers from the reviewed module',
  homeMarketNews.includes("from '../lib/home/homeNewsEmphasis'") &&
    homeMarketNews.includes('parseHomeNewsEmphasis') &&
    homeMarketNews.includes('getHomeNewsEmphasisBadgeLabel') &&
    homeMarketNews.includes('getHomeNewsEmphasisCardClass'),
);
check(
  'article title is classified via parseHomeNewsEmphasis(article.title), not a re-implemented check',
  homeMarketNews.includes('parseHomeNewsEmphasis(article.title)'),
);
check(
  'card gets a dedicated home-news-card--breaking / home-news-card--exclusive modifier class',
  homeMarketNews.includes('getHomeNewsEmphasisCardClass(emphasis)') &&
    homeMarketNews.includes('emphasisCardClass'),
);
check(
  'an explicit text badge (home-news-emphasis-badge) is rendered, not color-only signaling',
  homeMarketNews.includes('home-news-emphasis-badge') && homeMarketNews.includes('emphasisBadgeLabel'),
);
check(
  'the existing category badge (home-news-badge) is preserved alongside the emphasis badge',
  homeMarketNews.includes('class="home-news-badge"'),
);
check('source name is still rendered', homeMarketNews.includes('home-news-source-name'));
check('published date is still rendered', homeMarketNews.includes('home-news-date'));
check(
  'article anchor still links out via href/target=_blank/rel=noopener (link preserved)',
  homeMarketNews.includes('target="_blank"') && homeMarketNews.includes('rel="noopener noreferrer"'),
);
check(
  'accessible name (aria-label) still uses the full, untouched original title, not the display title',
  /aria-label="\$\{title\}"/.test(homeMarketNews),
);
check(
  'headline node renders the derived display title, still HTML-escaped',
  homeMarketNews.includes('${displayTitle}') && homeMarketNews.includes('escapeHtml(deriveHomeNewsDisplayTitle('),
);

// ---------------------------------------------------------------------------
// Group 3: static-only visual treatment -- no blink/pulse/infinite animation
// ---------------------------------------------------------------------------
log('--- Group 3: static treatment only (no flashing) ---');
const newsEmphasisCssBlockStart = styleCss.indexOf('.home-news-emphasis-badge {');
const newsEmphasisCssBlockEnd =
  newsEmphasisCssBlockStart === -1 ? -1 : styleCss.indexOf('@media (max-width: 980px)', newsEmphasisCssBlockStart);
const newsEmphasisCssBlock =
  newsEmphasisCssBlockStart === -1 ? '' : styleCss.slice(newsEmphasisCssBlockStart, newsEmphasisCssBlockEnd);
check('news emphasis CSS block is present in style.css', newsEmphasisCssBlockStart !== -1 && newsEmphasisCssBlock.length > 0);
check(
  'no @keyframes blink/pulse/flash animation defined for the emphasis feature',
  !/@keyframes\s+(blink|pulse|flash)/i.test(newsEmphasisCssBlock),
);
check('no animation: property used in the emphasis CSS block', !/animation\s*:/i.test(newsEmphasisCssBlock));
check('no CSS animation-iteration-count: infinite anywhere tied to news emphasis', !/infinite/i.test(newsEmphasisCssBlock));
check(
  'breaking card modifier class defined with a static border + box-shadow glow',
  newsEmphasisCssBlock.includes('.home-news-card--breaking') && newsEmphasisCssBlock.includes('box-shadow'),
);
check(
  'exclusive card modifier class defined with a static border + box-shadow glow',
  newsEmphasisCssBlock.includes('.home-news-card--exclusive') && newsEmphasisCssBlock.includes('box-shadow'),
);
check(
  'breaking/exclusive badge classes render explicit background/border/color (not color-only signal)',
  newsEmphasisCssBlock.includes('.home-news-emphasis-badge--breaking') &&
    newsEmphasisCssBlock.includes('.home-news-emphasis-badge--exclusive'),
);

// ---------------------------------------------------------------------------
// Group 4: light + dark mode -- semantic variables defined in both blocks
// ---------------------------------------------------------------------------
log('--- Group 4: light + dark mode variables ---');
const rootBlock = styleCss.slice(styleCss.indexOf(':root {'), styleCss.indexOf('body.dark-mode {'));
const darkBlock = styleCss.slice(styleCss.indexOf('body.dark-mode {'), styleCss.indexOf('* {'));
check(
  '--news-breaking-accent defined in both :root and body.dark-mode with distinct values',
  rootBlock.includes('--news-breaking-accent:') &&
    darkBlock.includes('--news-breaking-accent:') &&
    rootBlock.match(/--news-breaking-accent:\s*([^;]+);/)?.[1] !==
      darkBlock.match(/--news-breaking-accent:\s*([^;]+);/)?.[1],
);
check(
  '--news-exclusive-accent defined in both :root and body.dark-mode with distinct values',
  rootBlock.includes('--news-exclusive-accent:') &&
    darkBlock.includes('--news-exclusive-accent:') &&
    rootBlock.match(/--news-exclusive-accent:\s*([^;]+);/)?.[1] !==
      darkBlock.match(/--news-exclusive-accent:\s*([^;]+);/)?.[1],
);
check(
  'card modifier classes reference the semantic variables, not hard-coded hex values',
  newsEmphasisCssBlock.includes('var(--news-breaking-accent)') &&
    newsEmphasisCssBlock.includes('var(--news-exclusive-accent)'),
);

// ---------------------------------------------------------------------------
// Group 5: existing news contract untouched (feed/route/behavior)
// ---------------------------------------------------------------------------
log('--- Group 5: existing news contract preserved ---');
check("fetch target /api/news/home.json unchanged", homeMarketNews.includes("fetch('/api/news/home.json')"));
check('feedMode-driven fallback notice logic preserved', homeMarketNews.includes('updateFallbackNotice(fallbackNotice, body.feedMode)'));
check('empty-state container still present', homeMarketNews.includes('data-home-news-empty'));
check('delayed-state container still present', homeMarketNews.includes('data-home-news-delayed'));
check('5-minute refresh interval unchanged', homeMarketNews.includes('REFRESH_MS = 5 * 60 * 1000'));

// ---------------------------------------------------------------------------
// Group 6: UX1-A Home surface guard + order unchanged
// ---------------------------------------------------------------------------
log('--- Group 6: UX1-A surface guard + Home order unchanged ---');
const guardApprovedBlock = surfaceGuard.slice(
  surfaceGuard.indexOf('export const APPROVED_HOME_SURFACES'),
  surfaceGuard.indexOf('export const REJECTED_HOME_SURFACES'),
);
const guardRejectedBlock = surfaceGuard.slice(
  surfaceGuard.indexOf('export const REJECTED_HOME_SURFACES'),
  surfaceGuard.indexOf('export const GLOBAL_SHELL_SURFACES'),
);
check(
  'homeDynamicSurfaceGuard.ts registry still has exactly 5 approved / 1 rejected component entries',
  (guardApprovedBlock.match(/component:\s*'[^']+'/g) || []).length === 5 &&
    (guardRejectedBlock.match(/component:\s*'[^']+'/g) || []).length === 1,
);
check('HomeRetentionPanel is still not imported/rendered by index.astro', !indexAstro.includes('<HomeRetentionPanel'));

const portfolioIdx = indexAstro.indexOf('<HomePortfolioPanel');
const mobileAdIdx = indexAstro.indexOf('<HomeMobileAd');
const snapshotIdx = indexAstro.indexOf('<HomeLiveMarketSnapshot');
const newsIdx = indexAstro.indexOf('<HomeMarketNews');
check(
  'main-column order unchanged: HomePortfolioPanel < HomeMobileAd < HomeLiveMarketSnapshot < HomeMarketNews',
  [portfolioIdx, mobileAdIdx, snapshotIdx, newsIdx].every((i) => i !== -1) &&
    portfolioIdx < mobileAdIdx &&
    mobileAdIdx < snapshotIdx &&
    snapshotIdx < newsIdx,
);
check(
  'no new top-level Home*.astro component introduced (still exactly 5 distinct <Home... tags)',
  new Set(Array.from(indexAstro.matchAll(/<Home[A-Z][A-Za-z0-9]*/g)).map((m) => m[0].slice(1))).size === 5,
);

// ---------------------------------------------------------------------------
// Group 7: no unrelated page changes
// ---------------------------------------------------------------------------
log('--- Group 7: no unrelated page changes ---');
check('portfolio.astro untouched marker (userRetentionApi import) still present', /import\s*{\s*userRetentionApi,\s*hasRetentionSession\s*}/.test(portfolioAstro));
check("chart-ai.astro untouched marker (lastSurface: 'chart_ai') still present", /lastSurface:\s*'chart_ai'/.test(chartAiAstro));
check("lab.astro untouched marker (lastSurface: 'lab') still present", /lastSurface:\s*'lab'/.test(labAstro));

// ---------------------------------------------------------------------------
// Group 8: package.json wiring
// ---------------------------------------------------------------------------
log('--- Group 8: package.json wiring ---');
check('package.json has smoke:phase-4f-ux1b-home-news-emphasis script', packageJson.includes('"smoke:phase-4f-ux1b-home-news-emphasis"'));
check('package.json has check:phase-4f-ux1b-home-news-emphasis script', packageJson.includes('"check:phase-4f-ux1b-home-news-emphasis"'));

log('');
log(`Total: ${passes + failures} | Passed: ${passes} | Failed: ${failures}`);
process.exitCode = failures > 0 ? 1 : 0;
