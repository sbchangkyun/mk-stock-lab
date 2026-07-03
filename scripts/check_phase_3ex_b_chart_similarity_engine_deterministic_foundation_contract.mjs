/**
 * Phase 3EX-B documentation and source contract.
 * Chart similarity engine deterministic foundation.
 * Static only: no network, browser, dev server, API, provider, live KIS, external AI, or environment access.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error('Network access is blocked in the Phase 3EX-B chart similarity engine deterministic foundation checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = process.cwd();
const startingCommit = '52b1276';

const paths = {
  result: 'docs/planning/phase_3ex_b_chart_similarity_engine_deterministic_foundation_result_v0.1.md',
  changelog: 'docs/planning/planning_changelog.md',
  checker: 'scripts/check_phase_3ex_b_chart_similarity_engine_deterministic_foundation_contract.mjs',
  package: 'package.json',
  types: 'src/lib/chartSimilarity/types.ts',
  returns: 'src/lib/chartSimilarity/returns.ts',
  normalize: 'src/lib/chartSimilarity/normalize.ts',
  rollingWindow: 'src/lib/chartSimilarity/rollingWindow.ts',
  similarityScore: 'src/lib/chartSimilarity/similarityScore.ts',
  forwardOutcome: 'src/lib/chartSimilarity/forwardOutcome.ts',
  summaryStats: 'src/lib/chartSimilarity/summaryStats.ts',
  similarityScanner: 'src/lib/chartSimilarity/similarityScanner.ts',
  index: 'src/lib/chartSimilarity/index.ts',
  fixture: 'src/data/chartSimilarity/syntheticOhlcvFixture.ts',
};

const read = (relativePath) => {
  try { return readFileSync(join(root, relativePath), 'utf8'); } catch { return ''; }
};
const git = (...args) => {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch { return ''; }
};

const source = Object.fromEntries(Object.entries(paths).map(([key, path]) => [key, read(path)]));
const packageJson = JSON.parse(source.package || '{}');
const baselinePackage = JSON.parse(git('show', `${startingCommit}:package.json`) || '{}');
const phaseSection = source.changelog.split('## Phase 3EX-B - 2026-07-03')[1]?.split('\n## ')[0] ?? '';
const docScanText = `${source.result}\n${phaseSection}`;
const sourceScanText = [
  source.types, source.returns, source.normalize, source.rollingWindow, source.similarityScore,
  source.forwardOutcome, source.summaryStats, source.similarityScanner, source.index, source.fixture,
].join('\n');

const phaseChanges = new Set(git('diff', '--name-only', startingCommit).split(/\r?\n/).filter(Boolean));
const addedFiles = git('diff', '--name-only', '--diff-filter=A', startingCommit).split(/\r?\n/).filter(Boolean);
const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif', '.bmp']);
const addedImages = addedFiles.filter((path) => imageExtensions.has(extname(path).toLowerCase()));
const dependenciesUnchanged = JSON.stringify(packageJson.dependencies ?? {}) === JSON.stringify(baselinePackage.dependencies ?? {});
const devDependenciesUnchanged = JSON.stringify(packageJson.devDependencies ?? {}) === JSON.stringify(baselinePackage.devDependencies ?? {});

const RAW_FIELDS = /stck_bsop_date|stck_oprc|stck_hgpr|stck_lwpr|stck_clpr|acml_vol|rt_cd|msg_cd|output2/i;
const SECRET_VALUE = (text) =>
  /Bearer\s+[A-Za-z0-9._-]{8,}/.test(text) ||
  /KIS_APP_KEY['"]?\s*[:=]\s*['"]?[A-Za-z0-9]{8,}/.test(text) ||
  /KIS_APP_SECRET['"]?\s*[:=]\s*['"]?[A-Za-z0-9]{8,}/.test(text) ||
  /KIS_ACCESS_TOKEN['"]?\s*[:=]\s*['"]?[A-Za-z0-9]{8,}/.test(text);
const MARKET_VALUE_PATTERN = /\b(open|high|low|close|lastPrice|현재가)\b[^\n]{0,20}\b\d{3,}\b/i;
const EXTERNAL_AI_PATTERN = /openai|anthropic|claude|gemini|gpt-\d|langchain/i;
const ACCOUNT_TRADING_PATTERN = /account[_-]?no|placeorder|trading[_-]?api|order[_-]?api|balance[_-]?api|kis_account/i;
const KIS_IMPORT_PATTERN = /(from\s+['"][^'"]*kis[^'"]*['"])|(require\(\s*['"][^'"]*kis[^'"]*['"]\s*\))/i;

const allowedExactFiles = new Set([
  paths.result,
  paths.changelog,
  paths.checker,
  paths.package,
]);
const allowedPrefixes = ['src/lib/chartSimilarity/', 'src/data/chartSimilarity/'];
const isAllowedPath = (path) => allowedExactFiles.has(path) || allowedPrefixes.some((prefix) => path.startsWith(prefix));
const disallowedChanges = [...phaseChanges].filter((path) => !isAllowedPath(path));
const pagesChanged = [...phaseChanges].some((path) => path.startsWith('src/pages/'));
const apiChanged = [...phaseChanges].some((path) => path.startsWith('src/pages/api/'));
const serverProviderChanged = [...phaseChanges].some((path) => path.startsWith('src/lib/server/'));

let passed = 0;
let failed = 0;
const failures = [];
const check = (label, condition) => {
  if (condition) { passed += 1; process.stdout.write(`  [PASS] ${label}\n`); }
  else { failed += 1; failures.push(label); process.stdout.write(`  [FAIL] ${label}\n`); }
};

process.stdout.write('=== Phase 3EX-B Chart Similarity Engine Deterministic Foundation Contract ===\n\n');

process.stdout.write('Files, command, and changelog:\n');
check('Result document exists', existsSync(join(root, paths.result)));                                          // 1
check('Checker exists', existsSync(join(root, paths.checker)));                                                  // 2
check('Package script exists',                                                                                   // 3
  packageJson.scripts?.['check:phase-3ex-b-chart-similarity-engine-deterministic-foundation'] ===
    'node scripts/check_phase_3ex_b_chart_similarity_engine_deterministic_foundation_contract.mjs');
check('Changelog contains Phase 3EX-B', phaseSection.length > 0);                                                // 4
check('Chart similarity lib directory exists', existsSync(join(root, 'src/lib/chartSimilarity')));               // 5
check('Synthetic fixture exists', existsSync(join(root, paths.fixture)));                                        // 6
check('index export file exists', existsSync(join(root, paths.index)));                                         // 7
check('Types file exists', existsSync(join(root, paths.types)));                                                 // 8
check('Returns module exists', existsSync(join(root, paths.returns)));                                           // 9
check('Normalize module exists', existsSync(join(root, paths.normalize)));                                       // 10
check('Rolling window module exists', existsSync(join(root, paths.rollingWindow)));                              // 11
check('Similarity score module exists', existsSync(join(root, paths.similarityScore)));                          // 12
check('Forward outcome module exists', existsSync(join(root, paths.forwardOutcome)));                            // 13
check('Summary stats module exists', existsSync(join(root, paths.summaryStats)));                                // 14
check('Scanner module exists', existsSync(join(root, paths.similarityScanner)));                                 // 15
process.stdout.write('\n');

process.stdout.write('Type foundation:\n');
check('Types include OhlcBar', /export type OhlcBar/.test(source.types));                                        // 16
check('Types include SimilarityWindow', /export type SimilarityWindow/.test(source.types));                      // 17
check('Types include SimilarityScanOptions', /export type SimilarityScanOptions/.test(source.types));            // 18
check('Types include SimilarityScoreParts', /export type SimilarityScoreParts/.test(source.types));              // 19
check('Types include ForwardOutcome', /export type ForwardOutcome/.test(source.types));                          // 20
check('Types include SimilarityMatch', /export type SimilarityMatch/.test(source.types));                        // 21
check('Types include SimilaritySummaryStats', /export type SimilaritySummaryStats/.test(source.types));          // 22
check('Types include SimilarityAnalysisResult', /export type SimilarityAnalysisResult/.test(source.types));      // 23
process.stdout.write('\n');

process.stdout.write('Synthetic fixture safety:\n');
check('Fixture uses fake symbol SYNTH001', source.fixture.includes('SYNTH001'));                                 // 24
check('Fixture does not include 005930', !source.fixture.includes('005930'));                                    // 25
check('Fixture does not include Samsung/삼성전자',
  !/samsung|삼성전자/i.test(source.fixture));                                                                    // 26
check('Fixture source is synthetic or fixture', /source:\s*'(synthetic|fixture)'/.test(source.fixture));         // 27
process.stdout.write('\n');

process.stdout.write('Module exports:\n');
check('Returns module exports simple returns', /export const toSimpleReturns/.test(source.returns));            // 28
check('Returns module exports log returns', /export const toLogReturns/.test(source.returns));                  // 29
check('Normalize module exports z-score', /export const zScore/.test(source.normalize));                        // 30
check('Normalize module exports normalized price index', /export const toNormalizedPriceIndex/.test(source.normalize)); // 31
check('Rolling module exports current window logic', /export const getCurrentWindow/.test(source.rollingWindow)); // 32
check('Rolling module exports candidate window logic', /export const getCandidateWindows/.test(source.rollingWindow)); // 33
check('Score module exports Pearson correlation', /export const pearsonCorrelation/.test(source.similarityScore)); // 34
check('Score module exports RMSE', /export const rmse/.test(source.similarityScore));                           // 35
check('Score module exports direction match', /export const directionMatchPct/.test(source.similarityScore));   // 36
check('Score module exports computeSimilarityScore', /export const computeSimilarityScore/.test(source.similarityScore)); // 37
check('Forward outcome module exports forward outcome logic',
  /export const computeForwardReturn/.test(source.forwardOutcome) && /export const computeForwardOutcome/.test(source.forwardOutcome)); // 38
check('Summary module exports average/median/summary logic',
  /export const average/.test(source.summaryStats) && /export const median/.test(source.summaryStats) && /export const summarizeMatches/.test(source.summaryStats)); // 39
check('Scanner exports scanSimilarity', /export const scanSimilarity/.test(source.similarityScanner));          // 40
check('Scanner returns Top K sorting logic',
  /\.sort\(/.test(source.similarityScanner) && /topK/.test(source.similarityScanner));                           // 41
check('Scanner records warnings for insufficient data',
  /warnings\.push\(/.test(source.similarityScanner));                                                            // 42
process.stdout.write('\n');

process.stdout.write('Source safety scan:\n');
check('Source contains no KIS provider imports', !KIS_IMPORT_PATTERN.test(sourceScanText));                      // 43
check('Source contains no fetch calls', !/fetch\(/.test(sourceScanText));                                        // 44
check('Source contains no API route changes', !apiChanged);                                                      // 45
check('Source contains no UI/page changes', !pagesChanged);                                                      // 46
check('Source contains no Supabase usage', !/supabase/i.test(sourceScanText));                                   // 47
check('Source contains no SQL/migration additions',
  !addedFiles.some((p) => /migration|\.sql$/i.test(p)) && !/create\s+table|alter\s+table/i.test(sourceScanText)); // 48
check('Source contains no external AI keywords', !EXTERNAL_AI_PATTERN.test(sourceScanText));                     // 49
check('Source contains no source=live', !/source\s*=\s*['"]?live/i.test(sourceScanText));                        // 50
check('Source contains no source=auto', !/source\s*=\s*['"]?auto/i.test(sourceScanText));                        // 51
check('Source contains no account/trading/order/balance APIs', !ACCOUNT_TRADING_PATTERN.test(sourceScanText));   // 52
process.stdout.write('\n');

process.stdout.write('Result document boundary content:\n');
check('Docs record no KIS call', source.result.includes('No KIS call was made.'));                               // 53
check('Docs record no API route', source.result.includes('No API route was added.'));                            // 54
check('Docs record no DB/SQL/migration',
  source.result.includes('No DB/cache runtime was added.') && source.result.includes('No SQL/migration was run.')); // 55
check('Docs record no UI integration', /No UI integration was made/.test(source.result));                        // 56
check('Docs record no deployment', source.result.includes('No deployment was performed.'));                      // 57
check('Docs record no push', source.result.includes('No push was performed.'));                                  // 58
process.stdout.write('\n');

process.stdout.write('Scope, dependency, and network safety:\n');
check('Docs contain no actual market values', !MARKET_VALUE_PATTERN.test(docScanText));                          // 59
check('Docs contain no raw KIS response fields', !RAW_FIELDS.test(docScanText));                                 // 60
check('Docs contain no secret-looking values', !SECRET_VALUE(docScanText));                                      // 61
check('No forbidden tracked paths changed',
  disallowedChanges.length === 0 && !serverProviderChanged && addedImages.length === 0);                         // 62
check('No dependencies changed', dependenciesUnchanged);                                                         // 63
check('No devDependencies changed', devDependenciesUnchanged);                                                   // 64
check('Checker blocks network access',
  source.checker.includes('Network access is blocked in the Phase 3EX-B chart similarity engine deterministic foundation checker.') &&
  !fetchAttempted);                                                                                               // 65
process.stdout.write('\n');

process.stdout.write(`Checks passed: ${passed}/${passed + failed}\n`);
if (failed > 0) {
  process.stdout.write(`Failures: ${failures.join('; ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('All Phase 3EX-B checks passed.\n');
}
