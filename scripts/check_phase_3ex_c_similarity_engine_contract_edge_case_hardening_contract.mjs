/**
 * Phase 3EX-C documentation and source contract.
 * Similarity engine contract and edge case hardening.
 * Static only: no network, browser, dev server, API, provider, live KIS, external AI, or environment access.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error('Network access is blocked in the Phase 3EX-C similarity engine contract and edge case hardening checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = process.cwd();
const startingCommit = '9f8cfcb';

const paths = {
  result: 'docs/planning/phase_3ex_c_similarity_engine_contract_edge_case_hardening_result_v0.1.md',
  changelog: 'docs/planning/planning_changelog.md',
  checker: 'scripts/check_phase_3ex_c_similarity_engine_contract_edge_case_hardening_contract.mjs',
  smoke: 'scripts/smoke_phase_3ex_c_similarity_engine_edge_cases.mjs',
  package: 'package.json',
  types: 'src/lib/chartSimilarity/types.ts',
  returns: 'src/lib/chartSimilarity/returns.ts',
  normalize: 'src/lib/chartSimilarity/normalize.ts',
  rollingWindow: 'src/lib/chartSimilarity/rollingWindow.ts',
  similarityScore: 'src/lib/chartSimilarity/similarityScore.ts',
  forwardOutcome: 'src/lib/chartSimilarity/forwardOutcome.ts',
  summaryStats: 'src/lib/chartSimilarity/summaryStats.ts',
  similarityScanner: 'src/lib/chartSimilarity/similarityScanner.ts',
  scanOptions: 'src/lib/chartSimilarity/scanOptions.ts',
  index: 'src/lib/chartSimilarity/index.ts',
  fixture: 'src/data/chartSimilarity/syntheticOhlcvFixture.ts',
  edgeCaseFixture: 'src/data/chartSimilarity/edgeCaseOhlcvFixtures.ts',
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
const phaseSection = source.changelog.split('## Phase 3EX-C - 2026-07-03')[1]?.split('\n## ')[0] ?? '';
const docScanText = `${source.result}\n${phaseSection}`;
const sourceScanText = [
  source.types, source.returns, source.normalize, source.rollingWindow, source.similarityScore,
  source.forwardOutcome, source.summaryStats, source.similarityScanner, source.scanOptions, source.index,
  source.fixture, source.edgeCaseFixture, source.smoke,
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
const VERCEL_FILE_PATTERN = /(^|\/)vercel\.(json|ts)$|(^|\/)\.vercel\//i;

const pagesChanged = [...phaseChanges].some((path) => path.startsWith('src/pages/'));
const apiChanged = [...phaseChanges].some((path) => path.startsWith('src/pages/api/'));
const serverProviderChanged = [...phaseChanges].some((path) => path.startsWith('src/lib/server/'));
const supabaseOrMigrationAdded = addedFiles.some((path) => /migration|\.sql$/i.test(path) || /supabase/i.test(path));
const vercelChanged = [...phaseChanges].some((path) => VERCEL_FILE_PATTERN.test(path));

let passed = 0;
let failed = 0;
const failures = [];
const check = (label, condition) => {
  if (condition) { passed += 1; process.stdout.write(`  [PASS] ${label}\n`); }
  else { failed += 1; failures.push(label); process.stdout.write(`  [FAIL] ${label}\n`); }
};

process.stdout.write('=== Phase 3EX-C Similarity Engine Contract and Edge Case Hardening Contract ===\n\n');

process.stdout.write('Files, commands, and changelog:\n');
check('Result document exists', existsSync(join(root, paths.result)));                                          // 1
check('Checker exists', existsSync(join(root, paths.checker)));                                                  // 2
check('Smoke script exists', existsSync(join(root, paths.smoke)));                                               // 3
check('Package checker script exists',                                                                           // 4
  packageJson.scripts?.['check:phase-3ex-c-similarity-engine-contract-edge-case-hardening'] ===
    'node scripts/check_phase_3ex_c_similarity_engine_contract_edge_case_hardening_contract.mjs');
check('Package smoke script exists',                                                                             // 5
  packageJson.scripts?.['smoke:phase-3ex-c-similarity-engine-edge-cases'] ===
    'node scripts/smoke_phase_3ex_c_similarity_engine_edge_cases.mjs');
check('Changelog contains Phase 3EX-C', phaseSection.length > 0);                                                // 6
process.stdout.write('\n');

process.stdout.write('Existing engine files still present:\n');
check('Existing chart similarity directory still exists', existsSync(join(root, 'src/lib/chartSimilarity')));   // 7
check('Types file still exists', existsSync(join(root, paths.types)));                                           // 8
check('Returns module still exists', existsSync(join(root, paths.returns)));                                     // 9
check('Normalize module still exists', existsSync(join(root, paths.normalize)));                                 // 10
check('Rolling module still exists', existsSync(join(root, paths.rollingWindow)));                               // 11
check('Similarity score module still exists', existsSync(join(root, paths.similarityScore)));                    // 12
check('Forward outcome module still exists', existsSync(join(root, paths.forwardOutcome)));                      // 13
check('Summary stats module still exists', existsSync(join(root, paths.summaryStats)));                          // 14
check('Scanner module still exists', existsSync(join(root, paths.similarityScanner)));                           // 15
check('Index export file still exists', existsSync(join(root, paths.index)));                                    // 16
check('Synthetic fixture still exists', existsSync(join(root, paths.fixture)));                                  // 17
check('Optional edge-case fixture exists, or smoke script includes inline edge-case fixtures',                   // 18
  existsSync(join(root, paths.edgeCaseFixture)) ||
    /buildFlatSyntheticOhlcvFixture|buildShortSyntheticOhlcvFixture/.test(source.smoke));
process.stdout.write('\n');

process.stdout.write('Option normalization and scanner hardening:\n');
check('Scanner or option module includes option normalization',                                                  // 19
  /normalizeScanOptions/.test(source.similarityScanner) && /export const normalizeScanOptions/.test(source.scanOptions));
check('Scanner handles empty bars',                                                                              // 20
  /if \(!currentWindow\)/.test(source.similarityScanner) && /matches:\s*\[\]/.test(source.similarityScanner));
check('Scanner handles insufficient current window',                                                             // 21
  /Insufficient bars to build the current window/.test(source.similarityScanner));
check('Scanner records warnings', /warnings\.push\(/.test(source.similarityScanner));                            // 22
check('Scanner returns empty matches for insufficient data', /matches:\s*\[\]/.test(source.similarityScanner));  // 23
check('Scanner respects topK', /scored\.slice\(0,\s*topK\)/.test(source.similarityScanner));                     // 24
check('Scanner uses sanitized forward windows',
  /forwardWindows\s*}\s*=\s*normalizedOptions/.test(source.similarityScanner) ||
    /\{\s*baseWindow,\s*forwardWindows,\s*topK,\s*excludeRecentBars\s*\}\s*=\s*normalizedOptions/.test(source.similarityScanner)); // 25
check('Scanner uses excludeRecentBars',
  /getCandidateWindows\(sorted,\s*baseWindow,\s*maxForwardWindow,\s*excludeRecentBars\)/.test(source.similarityScanner)); // 26
process.stdout.write('\n');

process.stdout.write('Engine module edge-case guards:\n');
check('Rolling module prevents current-window overlap',
  /exclusionBoundary\s*=\s*currentStart\s*-\s*excludeRecentBars/.test(source.rollingWindow));                    // 27
check('Score module clamps score 0..100',
  /clamp\(corrScore \* 0\.45 \+ rmseScore \* 0\.35 \+ directionScore \* 0\.2,\s*0,\s*100\)/.test(source.similarityScore)); // 28
check('Score module handles empty arrays',
  (source.similarityScore.match(/if \(n === 0\) return 0;/g) ?? []).length >= 3);                                // 29
check('Score module handles zero variance correlation',
  /if \(varianceA === 0 \|\| varianceB === 0\) return 0;/.test(source.similarityScore));                         // 30
check('Normalize module handles constant array',
  /if \(std === 0\) return values\.map\(\(\) => 0\);/.test(source.normalize));                                   // 31
check('Normalize module handles invalid first close',
  /if \(!Number\.isFinite\(firstClose\) \|\| firstClose <= 0\)/.test(source.normalize));                         // 32
check('Returns module guards non-positive close',
  (source.returns.match(/prevClose <= 0/g) ?? []).length >= 2);                                                  // 33
check('Returns module avoids NaN/Infinity',
  /Number\.isFinite\(value\) \? value : 0/.test(source.returns));                                                // 34
check('Forward outcome returns null for insufficient data',
  (source.forwardOutcome.match(/return null;/g) ?? []).length >= 2);                                             // 35
check('Summary stats ignores null/non-finite values',
  /typeof value === 'number' && Number\.isFinite\(value\)/.test(source.summaryStats));                           // 36
process.stdout.write('\n');

process.stdout.write('Committed smoke script coverage:\n');
check('Smoke script checks normal synthetic fixture', /buildSyntheticOhlcvFixture/.test(source.smoke));          // 37
check('Smoke script checks empty bars', /scanSimilarity\(\[\]/.test(source.smoke));                              // 38
check('Smoke script checks one-bar input', /buildShortSyntheticOhlcvFixture\(1\)/.test(source.smoke));           // 39
check('Smoke script checks flat/all-identical closes', /buildFlatSyntheticOhlcvFixture/.test(source.smoke));     // 40
check('Smoke script checks invalid bars', /buildInvalidSyntheticOhlcvFixture/.test(source.smoke));                // 41
check('Smoke script checks extreme excludeRecentBars', /excludeRecentBars:\s*100000/.test(source.smoke));         // 42
check('Smoke script checks topK 0', /topK:\s*0,/.test(source.smoke));                                            // 43
check('Smoke script checks invalid/duplicate forward windows',
  /forwardWindows:\s*\[5,\s*5,\s*-3,\s*0,\s*2\.5,\s*10\]/.test(source.smoke));                                    // 44
check('Smoke script checks no NaN/Infinity in output', /hasNonFinite/.test(source.smoke));                        // 45
process.stdout.write('\n');

process.stdout.write('Result document boundary content:\n');
check('Result doc status is implemented',
  source.result.includes('Implemented — similarity engine contract and edge-case hardening complete.'));         // 46
check('Result doc records committed smoke verification',
  /committed runtime smoke script/i.test(source.result) && /27\/27/.test(source.result));                        // 47
check('Result doc records no KIS provider', source.result.includes('No KIS provider code added.'));               // 48
check('Result doc records no KIS call', source.result.includes('No KIS API call made.'));                         // 49
check('Result doc records no API route', source.result.includes('No public KIS route added or modified.'));       // 50
check('Result doc records no UI integration', /No `\/chart-ai` or other UI integration\./.test(source.result));   // 51
check('Result doc records no DB/SQL/migration',
  source.result.includes('No DB or cache runtime added.') && source.result.includes('No SQL or migration run or added.')); // 52
check('Result doc records no auth/usage guard',
  source.result.includes('No login/auth implemented.') && source.result.includes('No usage guard implemented.')); // 53
check('Result doc records no external AI', source.result.includes('No external AI API call made.'));              // 54
check('Result doc records no deployment', source.result.includes('No Vercel deployment performed.'));             // 55
check('Result doc records no push', source.result.includes('No `git push` performed.'));                          // 56
process.stdout.write('\n');

process.stdout.write('Changelog content:\n');
check('Changelog records edge-case hardening', /edge-case hardening/i.test(phaseSection));                        // 57
check('Changelog records smoke verification', /smoke/i.test(phaseSection));                                       // 58
check('Changelog records next phase 3EX-D or 3EY-A decision path',
  /Phase 3EX-D/.test(phaseSection) && /Phase 3EY-A/.test(phaseSection));                                          // 59
process.stdout.write('\n');

process.stdout.write('Source safety scan:\n');
check('Source contains no KIS provider imports', !KIS_IMPORT_PATTERN.test(sourceScanText));                       // 60
check('Source contains no fetch calls', !/fetch\(/.test(sourceScanText));                                         // 61
check('Source contains no external AI keywords', !EXTERNAL_AI_PATTERN.test(sourceScanText));                      // 62
check('Source contains no source=live', !/source\s*=\s*['"]?live/i.test(sourceScanText));                         // 63
check('Source contains no source=auto', !/source\s*=\s*['"]?auto/i.test(sourceScanText));                         // 64
check('Source contains no account/trading/order/balance APIs', !ACCOUNT_TRADING_PATTERN.test(sourceScanText));    // 65
process.stdout.write('\n');

process.stdout.write('Scope, dependency, and network safety:\n');
check('No src/pages files changed', !pagesChanged);                                                               // 66
check('No src/pages/api files changed', !apiChanged);                                                             // 67
check('No src/lib/server files changed', !serverProviderChanged);                                                 // 68
check('No Supabase/migration files added', !supabaseOrMigrationAdded);                                            // 69
check('No Vercel files changed', !vercelChanged);                                                                 // 70
check('No dependencies changed', dependenciesUnchanged);                                                          // 71
check('No devDependencies changed', devDependenciesUnchanged);                                                    // 72
check('No image files added', addedImages.length === 0);                                                          // 73
check('Docs contain no actual KIS values', !MARKET_VALUE_PATTERN.test(docScanText));                              // 74
check('Docs contain no raw KIS response fields', !RAW_FIELDS.test(docScanText));                                  // 75
check('Docs contain no secret-looking values', !SECRET_VALUE(docScanText));                                       // 76
check('Checker blocks network access',
  source.checker.includes('Network access is blocked in the Phase 3EX-C similarity engine contract and edge case hardening checker.') &&
  !fetchAttempted);                                                                                                // 77
check('Smoke script blocks or avoids network access',
  !/\bfetch\(/.test(source.smoke) && !/from\s+['"]node:https?['"]/.test(source.smoke) &&
    !/require\(\s*['"]https?['"]\s*\)/.test(source.smoke));                                                       // 78
process.stdout.write('\n');

process.stdout.write(`Checks passed: ${passed}/${passed + failed}\n`);
if (failed > 0) {
  process.stdout.write(`Failures: ${failures.join('; ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('All Phase 3EX-C checks passed.\n');
}
