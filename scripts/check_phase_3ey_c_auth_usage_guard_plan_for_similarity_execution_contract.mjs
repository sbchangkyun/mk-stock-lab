/**
 * Phase 3EY-C documentation and source contract.
 * Auth and usage guard plan/foundation for Chart Similarity execution.
 * Static only: no network, browser, dev server, API, provider, live KIS, external AI, or environment access.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error('Network access is blocked in the Phase 3EY-C auth usage guard plan for similarity execution checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = process.cwd();
const startingCommit = '9d548d4';

const paths = {
  planning: 'docs/planning/phase_3ey_c_auth_usage_guard_plan_for_similarity_execution_v0.1.md',
  result: 'docs/planning/phase_3ey_c_auth_usage_guard_plan_for_similarity_execution_result_v0.1.md',
  changelog: 'docs/planning/planning_changelog.md',
  checker: 'scripts/check_phase_3ey_c_auth_usage_guard_plan_for_similarity_execution_contract.mjs',
  smoke: 'scripts/smoke_phase_3ey_c_auth_usage_guard_plan_for_similarity_execution.mjs',
  package: 'package.json',
  serverDir: 'src/lib/server/chartSimilarity',
  types: 'src/lib/server/chartSimilarity/kisOhlcProviderTypes.ts',
  policy: 'src/lib/server/chartSimilarity/kisOhlcProviderPolicy.ts',
  provider: 'src/lib/server/chartSimilarity/serverOnlyKisOhlcProvider.ts',
  index: 'src/lib/server/chartSimilarity/index.ts',
  mockedAdapter: 'src/lib/server/chartSimilarity/mockedKisOhlcAdapter.ts',
  mockedFixtures: 'src/lib/server/chartSimilarity/mockedKisOhlcFixtures.ts',
  guardTypes: 'src/lib/server/chartSimilarity/similarityExecutionGuardTypes.ts',
  guardPolicy: 'src/lib/server/chartSimilarity/similarityExecutionGuardPolicy.ts',
  guardEvaluator: 'src/lib/server/chartSimilarity/similarityExecutionGuard.ts',
  guardFixtures: 'src/lib/server/chartSimilarity/mockedSimilarityExecutionGuardFixtures.ts',
};

const read = (relativePath) => {
  try { return readFileSync(join(root, relativePath), 'utf8'); } catch { return ''; }
};
const git = (...args) => {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch { return ''; }
};

const stripComments = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

const source = Object.fromEntries(
  Object.entries(paths)
    .filter(([key]) => key !== 'serverDir')
    .map(([key, path]) => [key, read(path)]),
);
const packageJson = JSON.parse(source.package || '{}');
const baselinePackage = JSON.parse(git('show', `${startingCommit}:package.json`) || '{}');
const phaseSection = source.changelog.split('## Phase 3EY-C - 2026-07-03')[1]?.split('\n## ')[0] ?? '';
const docScanText = `${source.planning}\n${source.result}\n${phaseSection}`;
const serverAllSource = [
  source.types,
  source.policy,
  source.provider,
  source.index,
  source.mockedAdapter,
  source.mockedFixtures,
  source.guardTypes,
  source.guardPolicy,
  source.guardEvaluator,
  source.guardFixtures,
].join('\n');
const guardEvaluatorCode = stripComments(source.guardEvaluator);
const guardPolicyCode = stripComments(source.guardPolicy);

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
const EXTERNAL_AI_PATTERN = /openai|anthropic|claude|gemini|gpt-\d|langchain/i;
const ACCOUNT_TRADING_PATTERN = /account[_-]?no|placeorder|trading[_-]?api|order[_-]?api|balance[_-]?api|kis_account/i;
const KIS_IMPORT_PATTERN = /(from\s+['"][^'"]*\/providers\/kis[^'"]*['"])|(from\s+['"][^'"]*kisClient['"])|(require\(\s*['"][^'"]*\/providers\/kis[^'"]*['"]\s*\))/i;
const AUTH_PROVIDER_IMPORT_PATTERN = /from\s+['"][^'"]*(next-auth|firebase|auth0|clerk|passport|oauth)[^'"]*['"]/i;
const SUPABASE_IMPORT_PATTERN = /from\s+['"][^'"]*supabase[^'"]*['"]/i;
const PERSIST_USAGE_PATTERN = /\.insert\(|\.upsert\(|\.update\(|INSERT\s+INTO|UPDATE\s+\w+\s+SET/i;
const VERCEL_FILE_PATTERN = /(^|\/)vercel\.(json|ts)$|(^|\/)\.vercel\//i;
const EMAIL_PATTERN = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const IP_PATTERN = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
const TOKEN_LOOKING_PATTERN = /(bearer\s+[a-z0-9]|sk-[a-z0-9]|access_token\s*[:=]|session_token\s*[:=])/i;

const pagesChanged = [...phaseChanges].some((path) => path.startsWith('src/pages/') && !path.startsWith('src/pages/api/'));
const apiChanged = [...phaseChanges].some((path) => path.startsWith('src/pages/api/'));
const serverProvidersChanged = [...phaseChanges].some((path) => path.startsWith('src/lib/server/providers/'));
const supabaseOrMigrationAdded = addedFiles.some((path) => /migration|\.sql$/i.test(path) || /supabase/i.test(path));
const vercelChanged = [...phaseChanges].some((path) => VERCEL_FILE_PATTERN.test(path));

const allowedChangedPathPrefixes = ['src/lib/server/chartSimilarity/'];
const allowedChangedPaths = new Set([
  'docs/planning/phase_3ey_c_auth_usage_guard_plan_for_similarity_execution_v0.1.md',
  'docs/planning/phase_3ey_c_auth_usage_guard_plan_for_similarity_execution_result_v0.1.md',
  'docs/planning/planning_changelog.md',
  'scripts/check_phase_3ey_c_auth_usage_guard_plan_for_similarity_execution_contract.mjs',
  'scripts/smoke_phase_3ey_c_auth_usage_guard_plan_for_similarity_execution.mjs',
  'package.json',
]);
const isAllowedPath = (path) =>
  allowedChangedPaths.has(path) || allowedChangedPathPrefixes.some((prefix) => path.startsWith(prefix));
const unexpectedChanges = [...phaseChanges].filter((path) => !isAllowedPath(path));

let passed = 0;
let failed = 0;
const failures = [];
const check = (label, condition) => {
  if (condition) { passed += 1; process.stdout.write(`  [PASS] ${label}\n`); }
  else { failed += 1; failures.push(label); process.stdout.write(`  [FAIL] ${label}\n`); }
};

process.stdout.write('=== Phase 3EY-C Auth and Usage Guard Plan for Similarity Execution ===\n\n');

process.stdout.write('Files and changelog:\n');
check('1. Planning document exists', existsSync(join(root, paths.planning)));
check('2. Result document exists', existsSync(join(root, paths.result)));
check('3. Checker exists', existsSync(join(root, paths.checker)));
check('4. Smoke script exists', existsSync(join(root, paths.smoke)));
check('5. Package checker script exists',
  packageJson.scripts?.['check:phase-3ey-c-auth-usage-guard-plan-for-similarity-execution'] ===
    'node scripts/check_phase_3ey_c_auth_usage_guard_plan_for_similarity_execution_contract.mjs');
check('6. Package smoke script exists',
  packageJson.scripts?.['smoke:phase-3ey-c-auth-usage-guard-plan-for-similarity-execution'] ===
    'node scripts/smoke_phase_3ey_c_auth_usage_guard_plan_for_similarity_execution.mjs');
check('7. Changelog contains Phase 3EY-C', phaseSection.length > 0);
process.stdout.write('\n');

process.stdout.write('Guard files present:\n');
check('8. Server chartSimilarity directory exists', existsSync(join(root, paths.serverDir)));
check('9. Guard types file exists', existsSync(join(root, paths.guardTypes)));
check('10. Guard policy file exists', existsSync(join(root, paths.guardPolicy)));
check('11. Guard evaluator file exists', existsSync(join(root, paths.guardEvaluator)));
check('12. Mocked guard fixtures file exists', existsSync(join(root, paths.guardFixtures)));
check('13. Server index exports guard symbols',
  /evaluateSimilarityExecutionGuard/.test(source.index) && /SimilarityExecutionGuardResult/.test(source.index));
process.stdout.write('\n');

process.stdout.write('Guard type shape:\n');
check('14. Types include SimilarityExecutionRole', /SimilarityExecutionRole/.test(source.guardTypes));
check('15. Types include SimilarityExecutionAuthState', /SimilarityExecutionAuthState/.test(source.guardTypes));
check('16. Types include SimilarityExecutionGuardStatus', /SimilarityExecutionGuardStatus/.test(source.guardTypes));
check('17. Types include SimilarityExecutionGuardRequest', /SimilarityExecutionGuardRequest/.test(source.guardTypes));
check('18. Types include SimilarityExecutionUsageSnapshot', /SimilarityExecutionUsageSnapshot/.test(source.guardTypes));
check('19. Types include SimilarityExecutionGuardPolicy', /SimilarityExecutionGuardPolicy/.test(source.guardTypes));
check('20. Types include SimilarityExecutionGuardResult', /SimilarityExecutionGuardResult/.test(source.guardTypes));
process.stdout.write('\n');

process.stdout.write('Guard policy defaults:\n');
check('21. Policy default enabled false', /enabled:\s*false/.test(source.guardPolicy));
check('22. Policy requires auth', /requireAuth:\s*true/.test(source.guardPolicy));
check('23. Policy requires usage guard', /requireUsageGuard:\s*true/.test(source.guardPolicy));
check('24. Policy allows anonymous mocked preview', /allowAnonymousMockedPreview:\s*true/.test(source.guardPolicy));
check('25. Policy disallows public KIS execution', /allowPublicKisExecution:\s*false/.test(source.guardPolicy));
check('26. Policy defines daily limits',
  /defaultDailyLimit/.test(source.guardPolicy) && /betaDailyLimit/.test(source.guardPolicy) &&
  /ownerDailyLimit/.test(source.guardPolicy) && /adminDailyLimit/.test(source.guardPolicy));
check('27. Policy does not read process.env', !/process\.env(\.\w|\[)/.test(guardPolicyCode));
check('28. Policy does not read .env',
  !/readFileSync\([^)]*\.env/.test(guardPolicyCode) && !/require\(['"]dotenv['"]\)/.test(guardPolicyCode));
process.stdout.write('\n');

process.stdout.write('Guard evaluator contract:\n');
check('29. Guard evaluator exports evaluateSimilarityExecutionGuard',
  /export const evaluateSimilarityExecutionGuard/.test(source.guardEvaluator));
check('30. Guard evaluator validates symbol', /invalid_symbol/.test(source.guardEvaluator));
check('31. Guard evaluator validates market KR',
  /invalid_market/.test(source.guardEvaluator) && /market !== 'KR'/.test(source.guardEvaluator));
check('32. Guard evaluator validates assetType', /invalid_asset_type/.test(source.guardEvaluator));
check('33. Guard evaluator validates purpose chart-similarity',
  /invalid_purpose/.test(source.guardEvaluator) && /chart-similarity/.test(source.guardEvaluator));
check('34. Guard evaluator handles mocked source', /source === 'mocked'/.test(source.guardEvaluator));
check('35. Guard evaluator handles kis-normalized source', /kis-normalized/.test(source.guardEvaluator));
check('36. Guard evaluator handles owner-local source', /source === 'owner-local'/.test(source.guardEvaluator));
check('37. Guard evaluator returns feature_disabled', /'feature_disabled'/.test(source.guardEvaluator));
check('38. Guard evaluator returns auth_required', /'auth_required'/.test(source.guardEvaluator));
check('39. Guard evaluator returns usage_limited', /'usage_limited'/.test(source.guardEvaluator));
check('40. Guard evaluator returns not_configured', /'not_configured'/.test(source.guardEvaluator));
check('41. Guard evaluator returns allowed', /'allowed'/.test(source.guardEvaluator));
check('42. Guard evaluator uses supplied usage only',
  /options\?\.usage/.test(guardEvaluatorCode) && !/Date\.now\(/.test(guardEvaluatorCode));
check('43. Guard evaluator does not persist usage', !PERSIST_USAGE_PATTERN.test(guardEvaluatorCode));
check('44. Guard evaluator does not import Supabase', !SUPABASE_IMPORT_PATTERN.test(guardEvaluatorCode));
check('45. Guard evaluator does not import auth provider', !AUTH_PROVIDER_IMPORT_PATTERN.test(guardEvaluatorCode));
check('46. Guard evaluator does not import KIS provider/client', !KIS_IMPORT_PATTERN.test(guardEvaluatorCode));
check('47. Guard evaluator does not call fetch', !/\bfetch\(/.test(guardEvaluatorCode));
check('48. Guard evaluator does not read process.env', !/process\.env(\.\w|\[)/.test(guardEvaluatorCode));
check('49. Guard evaluator does not read .env',
  !/readFileSync\([^)]*\.env/.test(guardEvaluatorCode) && !/require\(['"]dotenv['"]\)/.test(guardEvaluatorCode));
process.stdout.write('\n');

process.stdout.write('Mocked guard fixture safety:\n');
check('50. Mocked fixtures contain no real email/token/IP',
  !EMAIL_PATTERN.test(source.guardFixtures) && !IP_PATTERN.test(source.guardFixtures) &&
  !TOKEN_LOOKING_PATTERN.test(source.guardFixtures));
check('51. Mocked fixtures contain fake user IDs only',
  /mock-user-authenticated/.test(source.guardFixtures) && /mock-user-beta/.test(source.guardFixtures) &&
  /mock-user-owner/.test(source.guardFixtures));
process.stdout.write('\n');

process.stdout.write('Smoke script contract:\n');
check('52. Smoke script copies TS files to temp directory',
  /mkdtempSync/.test(source.smoke) && /tmpdir/.test(source.smoke));
check('53. Smoke script rewrites copied relative imports only',
  /rewriteRelativeImports/.test(source.smoke) && /IMPORT_SPECIFIER_PATTERN/.test(source.smoke));
check('54. Smoke script cleans temp directory', /rmSync/.test(source.smoke) && /finally/.test(source.smoke));
check('55. Smoke script checks default policy',
  /defaultPolicy/.test(source.smoke) && /enabled === false/.test(source.smoke));
check('56. Smoke script checks anonymous mocked preview', /mockedAnonymousResult/.test(source.smoke));
check('57. Smoke script checks auth_required/feature_disabled paths',
  /'auth_required'/.test(source.smoke) && /'feature_disabled'/.test(source.smoke));
check('58. Smoke script checks not_configured missing usage',
  /notConfiguredResult/.test(source.smoke) && /'not_configured'/.test(source.smoke));
check('59. Smoke script checks usage_limited',
  /usageLimitedResult/.test(source.smoke) && /'usage_limited'/.test(source.smoke));
check('60. Smoke script checks allowed path', /allowedResult/.test(source.smoke) && /'allowed'/.test(source.smoke));
check('61. Smoke script checks owner-local role restriction', /ownerLocalAnonymousResult/.test(source.smoke));
check('62. Smoke script checks invalid request blocked',
  /invalidSymbolResult/.test(source.smoke) && /'blocked'/.test(source.smoke));
check('63. Smoke script checks secret/auth payload absence',
  /TOKEN_LIKE_PATTERN/.test(source.smoke) && /AUTH_PROVIDER_PAYLOAD_PATTERN/.test(source.smoke));
process.stdout.write('\n');

process.stdout.write('Result document preserved-boundary records:\n');
check('64. Result doc status implemented/prepared', /Prepared\/Implemented|Implemented/.test(source.result));
check('65. Result doc records no real auth runtime', /no real auth runtime/i.test(source.result));
check('66. Result doc records no usage storage',
  /no usage persistence/i.test(source.result) || /no usage storage/i.test(source.result));
check('67. Result doc records no KIS call', /no kis call/i.test(source.result));
check('68. Result doc records no API route', /no api route/i.test(source.result));
check('69. Result doc records no UI change', /no `?\/chart-ai`? ui change/i.test(source.result));
check('70. Result doc records no DB/SQL/migration',
  /no db or cache runtime/i.test(source.result) && /no sql or migration/i.test(source.result));
check('71. Result doc records no external AI', /no external ai/i.test(source.result));
check('72. Result doc records no deployment', /no deployment/i.test(source.result));
check('73. Result doc records no push', /no push|no `?git push`? performed/i.test(source.result));
check('74. Result doc records no .env/process.env read',
  /no[^\n]*\.env[^\n]*process\.env[^\n]*read/i.test(source.result));
process.stdout.write('\n');

process.stdout.write('Changelog records:\n');
check('75. Changelog records next phase', /next phase/i.test(phaseSection));
process.stdout.write('\n');

process.stdout.write('Forbidden changed paths:\n');
check('76. No src/pages files changed', !pagesChanged);
check('77. No src/pages/api files changed', !apiChanged);
check('78. No src/lib/server/providers files changed', !serverProvidersChanged);
check('79. No Supabase/migration files added', !supabaseOrMigrationAdded);
check('80. No Vercel files changed', !vercelChanged);
check('81. No dependency changes', dependenciesUnchanged);
check('82. No devDependency changes', devDependenciesUnchanged);
check('83. No image files added', addedImages.length === 0);
process.stdout.write('\n');

process.stdout.write('Source safety scan:\n');
check('84. Source contains no source=live', !/source\s*=\s*['"]?live/i.test(serverAllSource));
check('85. Source contains no source=auto', !/source\s*=\s*['"]?auto/i.test(serverAllSource));
check('86. Source contains no account/trading/order/balance APIs', !ACCOUNT_TRADING_PATTERN.test(serverAllSource));
check('87. Source contains no external AI keywords', !EXTERNAL_AI_PATTERN.test(serverAllSource));
check('88. Docs contain no raw KIS response fields', !RAW_FIELDS.test(docScanText));
check('89. Docs contain no secret-looking values', !SECRET_VALUE(docScanText));
process.stdout.write('\n');

process.stdout.write('Network and scope safety:\n');
check('90. Checker blocks network access',
  source.checker.includes('Network access is blocked in the Phase 3EY-C auth usage guard plan for similarity execution checker.') &&
  !fetchAttempted);
check('91. Allowed changed files only', unexpectedChanges.length === 0);
process.stdout.write('\n');

process.stdout.write(`Checks passed: ${passed}/${passed + failed}\n`);
if (failed > 0) {
  process.stdout.write(`Failures: ${failures.join('; ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('All Phase 3EY-C checks passed.\n');
}
