/**
 * No-network response-level check for GNews market-feed helper functions (Phase 3BA).
 * Imports the .mjs response helper directly — does NOT start a server or call a network.
 * The TypeScript route file (market-feed.ts) is intentionally not imported here because
 * it requires Vite/Astro compilation; this script validates the underlying helper logic instead.
 * No network calls. No .env file reads. Exits non-zero on any failure.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  buildMarketNewsHomeResponse,
  buildMarketNewsListResponse,
  buildMarketNewsErrorResponse,
  sanitizeMarketNewsArticle,
  VALID_MODES,
  VALID_CATEGORIES,
} from '../src/lib/news/gnewsMarketFeedResponse.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const FIXTURE_PATH = join(root, 'src', 'data', 'fixtures', 'gnews_market_news_fixture_v0.1.json');
const fixture = JSON.parse(readFileSync(FIXTURE_PATH, 'utf8'));

const log = (msg) => process.stdout.write(msg + '\n');

let failures = 0;

const check = (label, pass) => {
  const status = pass ? 'PASS' : 'FAIL';
  log(`  [${status}] ${label}`);
  if (!pass) failures++;
};

log('=== GNews News API Route Response Check (Phase 3BA) ===');
log(`Fixture: gnews_market_news_fixture_v0.1.json`);
log('');

// ---------------------------------------------------------------------------
// Group 1: Constants
// ---------------------------------------------------------------------------
log('--- Group 1: Mode and category constants ---');
check('VALID_MODES is an array', Array.isArray(VALID_MODES));
check('VALID_MODES includes home', VALID_MODES.includes('home'));
check('VALID_MODES includes list', VALID_MODES.includes('list'));
check('VALID_CATEGORIES is an array with 6 entries', Array.isArray(VALID_CATEGORIES) && VALID_CATEGORIES.length === 6);
log('');

// ---------------------------------------------------------------------------
// Group 2: Home mode response
// ---------------------------------------------------------------------------
log('--- Group 2: Home mode response ---');
const homeResp = buildMarketNewsHomeResponse(fixture);

check('Home response ok is true', homeResp.ok === true);
check("Home response mode is 'home'", homeResp.mode === 'home');
check("Home response source is 'fixture'", homeResp.source === 'fixture');
check('Home response liveEnabled is false', homeResp.liveEnabled === false);
check('Home response articles is an array', Array.isArray(homeResp.articles));
check('Home response count <= 6', homeResp.count <= 6);
check('Home response count equals articles.length', homeResp.count === homeResp.articles.length);
check('Home response totalActive is a number > 0', typeof homeResp.totalActive === 'number' && homeResp.totalActive > 0);
check("Home response staleState is 'fixture'", homeResp.staleState === 'fixture');
log('');

// ---------------------------------------------------------------------------
// Group 3: List mode response (page 1)
// ---------------------------------------------------------------------------
log('--- Group 3: List mode response (page 1) ---');
const listResp1 = buildMarketNewsListResponse(fixture, { page: 1 });

check('List response ok is true', listResp1.ok === true);
check("List response mode is 'list'", listResp1.mode === 'list');
check("List response source is 'fixture'", listResp1.source === 'fixture');
check('List response liveEnabled is false', listResp1.liveEnabled === false);
check('List response has pagination object', typeof listResp1.pagination === 'object' && listResp1.pagination !== null);
check('List response pagination.page is 1', listResp1.pagination?.page === 1);
check('List response pagination.pageSize is 10', listResp1.pagination?.pageSize === 10);
check('List response pagination.totalActive > 0', listResp1.pagination?.totalActive > 0);
check('List response pagination.totalPages >= 1', listResp1.pagination?.totalPages >= 1);
check('List response articles is an array', Array.isArray(listResp1.articles));
check('List response articles.length <= pageSize (10)', listResp1.articles.length <= 10);
log('');

// ---------------------------------------------------------------------------
// Group 4: List mode — page clamping
// ---------------------------------------------------------------------------
log('--- Group 4: List mode page boundary handling ---');
const listRespPage99 = buildMarketNewsListResponse(fixture, { page: 99 });
check(
  'Page 99 is clamped to totalPages',
  listRespPage99.pagination?.page === listRespPage99.pagination?.totalPages,
);

const listRespPageNeg = buildMarketNewsListResponse(fixture, { page: -5 });
check(
  'Page -5 is normalized to page 1',
  listRespPageNeg.pagination?.page === 1,
);
log('');

// ---------------------------------------------------------------------------
// Group 5: List mode — category filter
// ---------------------------------------------------------------------------
log('--- Group 5: List mode with category filter ---');
const listRespFX = buildMarketNewsListResponse(fixture, { page: 1, category: 'FX' });
check('FX category filter returns ok true', listRespFX.ok === true);
check(
  'FX category filter articles all have category FX',
  listRespFX.articles.every((a) => a.category === 'FX'),
);
log('');

// ---------------------------------------------------------------------------
// Group 6: Error responses
// ---------------------------------------------------------------------------
log('--- Group 6: Error response shapes ---');
const modeErr = buildMarketNewsErrorResponse(400, 'invalid_mode');
check('invalid_mode error status is 400', modeErr.status === 400);
check('invalid_mode error body ok is false', modeErr.body.ok === false);
check("invalid_mode error code is 'invalid_mode'", modeErr.body.error?.code === 'invalid_mode');
check('invalid_mode error message is a non-empty string', typeof modeErr.body.error?.message === 'string' && modeErr.body.error.message.length > 0);
check('invalid_mode error body has no .stack', !JSON.stringify(modeErr.body).includes('stack'));

const catErr = buildMarketNewsErrorResponse(400, 'invalid_category');
check('invalid_category error status is 400', catErr.status === 400);
check("invalid_category error code is 'invalid_category'", catErr.body.error?.code === 'invalid_category');
log('');

// ---------------------------------------------------------------------------
// Group 7: Sanitized article shape
// ---------------------------------------------------------------------------
log('--- Group 7: Article sanitization ---');
const activeArticles = (fixture.articles ?? []).filter((a) => a.isActive && !a.isDuplicate);
const sampleArticle = activeArticles[0];
const sanitized = sanitizeMarketNewsArticle(sampleArticle);

const EXPECTED_PUBLIC_FIELDS = ['id', 'title', 'description', 'url', 'imageUrl', 'sourceName', 'publishedAt', 'category', 'relevanceScore'];
const FORBIDDEN_INTERNAL_FIELDS = ['canonicalUrlHash', 'titleHash', 'duplicateGroupId', 'isDuplicate', 'isActive', 'archivedAt', 'archiveReason', 'providerArticleId', 'rawProviderStored'];

EXPECTED_PUBLIC_FIELDS.forEach((field) => {
  check(`Sanitized article has public field: ${field}`, field in sanitized);
});

FORBIDDEN_INTERNAL_FIELDS.forEach((field) => {
  check(`Sanitized article excludes internal field: ${field}`, !(field in sanitized));
});

check(
  'Home articles use sanitized shape (no canonicalUrlHash)',
  homeResp.articles.every((a) => !('canonicalUrlHash' in a)),
);
check(
  'List articles use sanitized shape (no isDuplicate)',
  listResp1.articles.every((a) => !('isDuplicate' in a)),
);
log('');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
const totalChecks = 9 + 9 + 11 + 2 + 3 + 7 + (EXPECTED_PUBLIC_FIELDS.length + FORBIDDEN_INTERNAL_FIELDS.length + 2);
log('=== Phase 3BA Response Check — Summary ===');
log(`Checks passed: ${totalChecks - failures}/${totalChecks}`);
log(`Home selected count: ${homeResp.count}`);
log(`Home categories: ${[...new Set(homeResp.articles.map((a) => a.category))].join(', ')}`);
log(`List page 1 article count: ${listResp1.articles.length} / totalActive: ${listResp1.pagination?.totalActive}`);
log(`VALID_MODES: ${VALID_MODES.join(', ')}`);
log(`VALID_CATEGORIES count: ${VALID_CATEGORIES.length}`);
log('');

if (failures === 0) {
  log('Result: PASS');
  process.exitCode = 0;
} else {
  log(`Result: FAIL (${failures} failure(s))`);
  process.exitCode = 1;
}
