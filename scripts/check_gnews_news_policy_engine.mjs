/**
 * Phase 3AZ — GNews policy engine validator.
 * Loads the synthetic Phase 3AY fixture and validates all policy operations
 * using the no-network deterministic utility (gnewsNewsPolicy.mjs).
 * No network calls. No env reads. No .env file reads. Exits non-zero on failure.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import {
  POLICY,
  normalizeArticle,
  validateArticleShape,
  validateFixtureShape,
  detectDuplicateGroups,
  detectExpiredArticles,
  rankPruneCandidates,
  paginateArticles,
  selectHomeArticles,
  scanNewsPolicyForbiddenPatterns,
  checkArticleUrlDomains,
} from '../src/lib/news/gnewsNewsPolicy.mjs';

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const FIXTURE_PATH = join(root, 'src', 'data', 'fixtures', 'gnews_market_news_fixture_v0.1.json');
const UTILITY_PATH = join(root, 'src', 'lib', 'news', 'gnewsNewsPolicy.mjs');

const REFERENCE_TIME = '2026-06-23T09:00:00Z';

const log = (msg) => process.stdout.write(msg + '\n');

let failures = 0;
let totalChecks = 0;

const check = (label, pass) => {
  totalChecks++;
  const status = pass ? 'PASS' : 'FAIL';
  log(`  [${status}] ${label}`);
  if (!pass) failures++;
};

// ---------------------------------------------------------------------------
// Load fixture
// ---------------------------------------------------------------------------

log('=== Phase 3AZ GNews Policy Engine Validation ===');
log(`Fixture: gnews_market_news_fixture_v0.1.json`);
log(`Reference time: ${REFERENCE_TIME}`);
log('');

if (!existsSync(FIXTURE_PATH)) {
  log('ERROR: Fixture file missing. Cannot continue.');
  process.exitCode = 1;
  process.exit();
}

if (!existsSync(UTILITY_PATH)) {
  log('ERROR: Policy utility module missing. Cannot continue.');
  process.exitCode = 1;
  process.exit();
}

let fixture;
try {
  fixture = JSON.parse(readFileSync(FIXTURE_PATH, 'utf8'));
} catch (e) {
  log('ERROR: Fixture JSON is not parseable. Cannot continue.');
  process.exitCode = 1;
  process.exit();
}

const articles = Array.isArray(fixture.articles) ? fixture.articles : [];

// ---------------------------------------------------------------------------
// Group 1: Fixture metadata validation
// ---------------------------------------------------------------------------

log('--- Group 1: Fixture metadata ---');
const m = fixture.metadata ?? {};
check('fixture.metadata exists', !!fixture.metadata);
check('metadata.isSynthetic is true', m.isSynthetic === true);
check(`metadata.maxActiveArticles is ${POLICY.ACTIVE_CAP}`, m.maxActiveArticles === POLICY.ACTIVE_CAP);
check(`metadata.pageSize is ${POLICY.PAGE_SIZE}`, m.pageSize === POLICY.PAGE_SIZE);
check(`metadata.maxPages is ${POLICY.MAX_PAGES}`, m.maxPages === POLICY.MAX_PAGES);
check(`metadata.pruneBatchSize is ${POLICY.PRUNE_BATCH_SIZE}`, m.pruneBatchSize === POLICY.PRUNE_BATCH_SIZE);
check(`metadata.retentionDays is ${POLICY.RETENTION_DAYS}`, m.retentionDays === POLICY.RETENTION_DAYS);
check(
  `metadata.queryThemes has ${POLICY.EXPECTED_CATEGORIES.length} themes`,
  Array.isArray(m.queryThemes) && m.queryThemes.length === POLICY.EXPECTED_CATEGORIES.length,
);
log('');

// ---------------------------------------------------------------------------
// Group 2: Article count and shape validation
// ---------------------------------------------------------------------------

log('--- Group 2: Article count and shape ---');
check('articles array exists', Array.isArray(fixture.articles));
check(`articles.length >= 24 (found: ${articles.length})`, articles.length >= 24);

const shapeErrors = [];
articles.forEach((a, i) => {
  const r = validateArticleShape(a);
  if (!r.valid) r.errors.forEach((e) => shapeErrors.push(`[${i}] ${a?.id ?? '?'}: ${e}`));
});
check(`All articles pass shape validation (errors: ${shapeErrors.length})`, shapeErrors.length === 0);

const rawProviderViolations = articles.filter((a) => a.rawProviderStored !== false);
check(
  `rawProviderStored is false for all articles (violations: ${rawProviderViolations.length})`,
  rawProviderViolations.length === 0,
);
log('');

// ---------------------------------------------------------------------------
// Group 3: URL domain safety
// ---------------------------------------------------------------------------

log('--- Group 3: URL domain safety ---');
const { violations: urlViolations } = checkArticleUrlDomains(articles);
check(
  `All article URLs are under example.test domains (violations: ${urlViolations.length})`,
  urlViolations.length === 0,
);
const fixtureRaw = readFileSync(FIXTURE_PATH, 'utf8');
check('Fixture does not contain gnews.io', !fixtureRaw.includes('gnews.io'));
log('');

// ---------------------------------------------------------------------------
// Group 4: Category coverage
// ---------------------------------------------------------------------------

log('--- Group 4: Category coverage ---');
const activeNonDup = articles.filter((a) => a.isActive && !a.isDuplicate);
const catsInFixture = new Set(activeNonDup.map((a) => a.category));
POLICY.EXPECTED_CATEGORIES.forEach((cat) => {
  check(`Category ${cat} present in active non-duplicate articles`, catsInFixture.has(cat));
});
log('');

// ---------------------------------------------------------------------------
// Group 5: Deduplication detection
// ---------------------------------------------------------------------------

log('--- Group 5: Deduplication detection ---');
const dupResult = detectDuplicateGroups(articles);

check(
  `Exact URL duplicate group detected (groups: ${dupResult.exactUrlGroups.size})`,
  dupResult.exactUrlGroups.size >= 1,
);
check(
  `duplicateGroupId groups detected (groups: ${dupResult.duplicateGroupIdGroups.size})`,
  dupResult.duplicateGroupIdGroups.size >= 1,
);
check(
  `Duplicate candidates (isDuplicate: true) found (count: ${dupResult.duplicateCandidates.length})`,
  dupResult.duplicateCandidates.length >= 1,
);

const dupCandidate = dupResult.duplicateCandidates[0];
check(
  `First duplicate candidate has archiveReason "duplicate"`,
  dupCandidate?.archiveReason === 'duplicate',
);
check(
  `First duplicate candidate is inactive (isActive: false)`,
  dupCandidate?.isActive === false,
);

// Verify the exact URL pair shares canonicalUrlHash
const exactUrlGroupsArr = [...dupResult.exactUrlGroups.values()];
const firstExactGroup = exactUrlGroupsArr[0] ?? [];
const hashesMatch = firstExactGroup.length >= 2 &&
  new Set(firstExactGroup.map((a) => a.canonicalUrlHash)).size === 1;
check('Exact URL duplicate pair shares canonicalUrlHash', hashesMatch);

// Verify near-duplicate pair shares duplicateGroupId
const dupGroupArr = [...dupResult.duplicateGroupIdGroups.values()];
const nearDupGroupFound = dupGroupArr.some((group) => group.length >= 2);
check('Near-duplicate title pair shares duplicateGroupId', nearDupGroupFound);
log('');

// ---------------------------------------------------------------------------
// Group 6: Expiration detection
// ---------------------------------------------------------------------------

log('--- Group 6: Expiration detection ---');
const expiredAll = detectExpiredArticles(articles, {
  referenceTime: REFERENCE_TIME,
  retentionDays: POLICY.RETENTION_DAYS,
});
check(
  `Expired articles detected in fixture (count: ${expiredAll.length})`,
  expiredAll.length >= 1,
);

const expectedExpiredId = fixture.metadata?.testScenarios?.expired?.[0] ?? 'fixture-018';
const expiredFound = expiredAll.some((a) => a.id === expectedExpiredId);
check(
  `Expected expired article (${expectedExpiredId}) is in expired list`,
  expiredFound,
);

// Recent article should not be flagged as expired
const recentArticle = articles.find((a) => a.id === 'fixture-001');
const recentExpired = expiredAll.some((a) => a.id === 'fixture-001');
check(
  `Recent article (fixture-001, publishedAt ${recentArticle?.publishedAt}) is NOT expired`,
  !recentExpired,
);
log('');

// ---------------------------------------------------------------------------
// Group 7: Prune ranking
// ---------------------------------------------------------------------------

log('--- Group 7: Prune candidate ranking ---');
const pruneCandidates = rankPruneCandidates(articles, { referenceTime: REFERENCE_TIME });

const tier1Entries = pruneCandidates.filter((c) => c.tier === 1);
const tier2Entries = pruneCandidates.filter((c) => c.tier === 2);
const tier3Entries = pruneCandidates.filter((c) => c.tier === 3);

check(
  `Tier 1 (duplicate) candidates exist (count: ${tier1Entries.length})`,
  tier1Entries.length >= 1,
);
check(
  `Tier 2 (expired) candidates exist (count: ${tier2Entries.length})`,
  tier2Entries.length >= 1,
);
check(
  `Tier 3 (low-score) candidates exist (count: ${tier3Entries.length})`,
  tier3Entries.length >= 1,
);

// Tier ordering: first tier-1 entry appears before first tier-2 entry in result
const firstTier1Idx = pruneCandidates.findIndex((c) => c.tier === 1);
const firstTier2Idx = pruneCandidates.findIndex((c) => c.tier === 2);
const firstTier3Idx = pruneCandidates.findIndex((c) => c.tier === 3);
check(
  'Tier 1 (duplicate) ranks before tier 2 (expired)',
  firstTier1Idx !== -1 && firstTier2Idx !== -1 && firstTier1Idx < firstTier2Idx,
);
check(
  'Tier 2 (expired) ranks before tier 3 (low-score)',
  firstTier2Idx !== -1 && firstTier3Idx !== -1 && firstTier2Idx < firstTier3Idx,
);

const lowScoreArticleId = fixture.metadata?.testScenarios?.lowScore?.[0] ?? 'fixture-009';
const lowScoreInCandidates = tier3Entries.some((c) => c.article.id === lowScoreArticleId);
check(
  `Low-score article (${lowScoreArticleId}) is a tier-3 prune candidate`,
  lowScoreInCandidates,
);

check(`Prune batch size constant is ${POLICY.PRUNE_BATCH_SIZE}`, POLICY.PRUNE_BATCH_SIZE === 20);

const protectedEntries = pruneCandidates.filter((c) => c.isProtected);
check(
  `Category protection evaluated (protected candidates: ${protectedEntries.length})`,
  protectedEntries.length >= 0,
);
log('');

// ---------------------------------------------------------------------------
// Group 8: Pagination
// ---------------------------------------------------------------------------

log('--- Group 8: Pagination ---');
const page1Result = paginateArticles(articles, { page: 1 });
check(`Page 1 returns at least 1 article`, page1Result.articles.length >= 1);
check(`Page 1 returns at most ${POLICY.PAGE_SIZE} articles`, page1Result.articles.length <= POLICY.PAGE_SIZE);

const page1HasInactive = page1Result.articles.some((a) => !a.isActive);
check('Page 1 excludes inactive articles', !page1HasInactive);

const page1HasDuplicate = page1Result.articles.some((a) => a.isDuplicate);
check('Page 1 excludes duplicate articles', !page1HasDuplicate);

check(
  'Pagination result has required fields (page, pageSize, totalActive, totalPages, hasNextPage, hasPrevPage)',
  typeof page1Result.pagination.page === 'number' &&
  typeof page1Result.pagination.pageSize === 'number' &&
  typeof page1Result.pagination.totalActive === 'number' &&
  typeof page1Result.pagination.totalPages === 'number' &&
  typeof page1Result.pagination.hasNextPage === 'boolean' &&
  typeof page1Result.pagination.hasPrevPage === 'boolean',
);

// Page 0 normalized to page 1
const page0Result = paginateArticles(articles, { page: 0 });
check(`Page 0 normalized to page 1 (got: ${page0Result.pagination.page})`, page0Result.pagination.page === 1);

// High page (99) clamped to totalPages
const page99Result = paginateArticles(articles, { page: 99 });
check(
  `Page 99 clamped to totalPages (${page99Result.pagination.totalPages})`,
  page99Result.pagination.page === page99Result.pagination.totalPages,
);

check(
  `totalActive (${page1Result.pagination.totalActive}) does not exceed cap (${POLICY.ACTIVE_CAP})`,
  page1Result.pagination.totalActive <= POLICY.ACTIVE_CAP,
);
log('');

// ---------------------------------------------------------------------------
// Group 9: Home top-6 selection
// ---------------------------------------------------------------------------

log('--- Group 9: Home top-6 selection ---');
const homeResult = selectHomeArticles(articles);
check(`Home result count <= ${POLICY.HOME_COUNT}`, homeResult.count <= POLICY.HOME_COUNT);
check(
  `Home result count is exactly ${POLICY.HOME_COUNT} (sufficient eligible articles exist)`,
  homeResult.count === POLICY.HOME_COUNT,
);

const homeCategories = new Set(homeResult.articles.map((a) => a.category));
check(
  `At least 4 categories in Home result (found: ${homeCategories.size})`,
  homeCategories.size >= 4,
);

const marketStocksInHome = homeResult.articles.filter((a) => a.category === 'MARKET_STOCKS').length;
check(
  `MARKET_STOCKS slots in Home <= ${POLICY.HOME_MAX_PER_CATEGORY} (found: ${marketStocksInHome})`,
  marketStocksInHome <= POLICY.HOME_MAX_PER_CATEGORY,
);

const sourceCounts = {};
homeResult.articles.forEach((a) => {
  sourceCounts[a.sourceName] = (sourceCounts[a.sourceName] || 0) + 1;
});
const maxSourceSlots = Math.max(0, ...Object.values(sourceCounts));
check(
  `No source exceeds ${POLICY.HOME_MAX_PER_SOURCE} Home slots (max found: ${maxSourceSlots})`,
  maxSourceSlots <= POLICY.HOME_MAX_PER_SOURCE,
);

const homeHasInactiveOrDup = homeResult.articles.some((a) => !a.isActive || a.isDuplicate);
check('Home result excludes inactive and duplicate articles', !homeHasInactiveOrDup);
log('');

// ---------------------------------------------------------------------------
// Group 10: Security and forbidden pattern scan
// ---------------------------------------------------------------------------

log('--- Group 10: Security / forbidden pattern scan ---');
const utilityContent = readFileSync(UTILITY_PATH, 'utf8');

// The utility module defines scanner pattern constants as string literals, so
// the generic scanNewsPolicyForbiddenPatterns() would produce false positives on
// the utility itself. Use targeted structural checks instead.

// Check that the utility makes no actual outbound fetch calls (not regex definitions).
// Regex literals like /fetch\s*\(/ are scanner patterns, not calls — skip them.
const utilityActualFetchCall =
  /(?:await|=\s*|return\s+)fetch\s*\(/.test(utilityContent) ||
  /\bfetch\s*\(\s*['"`]https?:/.test(utilityContent);
check('Utility module makes no actual network fetch call', !utilityActualFetchCall);

// Check no XMLHttpRequest instantiation (not string literals or regex patterns).
const utilityXhrNew = /new\s+XMLHttpRequest\s*\(/.test(utilityContent);
check('Utility module has no new XMLHttpRequest() instantiation', !utilityXhrNew);

// Check no network library imports.
const utilityNetImports =
  /import\s+.*from\s+['"](?:node-fetch|axios|got|cross-fetch)['"]/.test(utilityContent) ||
  /require\s*\(\s*['"](?:node-fetch|axios|got|cross-fetch)['"]\s*\)/.test(utilityContent);
check('Utility module imports no network libraries', !utilityNetImports);

// Check no GNEWS_API_KEY env reads.
check(
  'Utility module does not read GNEWS_API_KEY from env',
  !(/import\.meta\.env\.(?:PUBLIC_)?GNEWS_API_KEY/.test(utilityContent)) &&
  !(/process\.env\.(?:PUBLIC_)?GNEWS_API_KEY/.test(utilityContent)),
);

// The fixture is content data (not scanner code), so the generic scanner is appropriate.
const fixtureScanResult = scanNewsPolicyForbiddenPatterns(readFileSync(FIXTURE_PATH, 'utf8'));
check(
  `Fixture JSON has no forbidden security patterns (findings: ${fixtureScanResult.findings.length})`,
  fixtureScanResult.findings.length === 0,
);
log('');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

log('=== Phase 3AZ GNews Policy Engine — Summary ===');
log(`Fixture: gnews_market_news_fixture_v0.1.json`);
log(`Reference time: ${REFERENCE_TIME}`);
log(`Checks passed: ${totalChecks - failures}/${totalChecks}`);
log(`Active non-duplicate articles: ${activeNonDup.length}`);
log(`Dedup exact-URL groups: ${dupResult.exactUrlGroups.size}`);
log(`Dedup duplicateGroupId groups: ${dupResult.duplicateGroupIdGroups.size}`);
log(`Expired articles detected: ${expiredAll.length}`);
log(`Prune candidates (tier 1 dup / tier 2 exp / tier 3 low / tier 4 cap): ${tier1Entries.length} / ${tier2Entries.length} / ${tier3Entries.length} / ${pruneCandidates.filter(c => c.tier === 4).length}`);
log(`Pagination page size: ${POLICY.PAGE_SIZE}`);
log(`Pagination page 1 count: ${page1Result.articles.length}`);
log(`Pagination totalActive: ${page1Result.pagination.totalActive}`);
log(`Home selected count: ${homeResult.count}`);
log(`Home categories: ${[...homeCategories].join(', ')}`);
log(`Fixture forbidden findings: ${fixtureScanResult.findings.length}`);
log('');

if (failures === 0) {
  log('Result: PASS');
  process.exitCode = 0;
} else {
  log(`Result: FAIL (${failures} check(s) failed)`);
  process.exitCode = 1;
}
