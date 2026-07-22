/**
 * Phase 3FA-A documentation and source contract.
 * Owner-local KIS-normalized similarity execution plan.
 * Static only: no network, browser, dev server, API, provider, live KIS, external AI, or environment access.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error(
    'Network access is blocked in the Phase 3FA-A owner local kis normalized similarity execution plan checker.',
  );
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = process.cwd();
const startingCommit = '0cfe9a3';

const paths = {
  planning: 'docs/planning/phase_3fa_a_owner_local_kis_normalized_similarity_execution_plan_v0.1.md',
  result: 'docs/planning/phase_3fa_a_owner_local_kis_normalized_similarity_execution_plan_result_v0.1.md',
  changelog: 'docs/planning/planning_changelog.md',
  checker: 'scripts/check_phase_3fa_a_owner_local_kis_normalized_similarity_execution_plan_contract.mjs',
  package: 'package.json',
  route: 'src/pages/api/chart-ai/similarity.ts',
  chartAiUi: 'src/pages/chart-ai.astro',
  planTypes: 'src/lib/server/chartSimilarity/similarityOwnerLocalExecutionPlanTypes.ts',
  planModule: 'src/lib/server/chartSimilarity/similarityOwnerLocalExecutionPlan.ts',
  planFixtures: 'src/lib/server/chartSimilarity/mockedSimilarityOwnerLocalExecutionPlanFixtures.ts',
  index: 'src/lib/server/chartSimilarity/index.ts',
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

const source = Object.fromEntries(Object.entries(paths).map(([key, path]) => [key, read(path)]));
const packageJson = JSON.parse(source.package || '{}');
const baselinePackage = JSON.parse(git('show', `${startingCommit}:package.json`) || '{}');
const phaseSection = source.changelog.split('## Phase 3FA-A - 2026-07-04')[1]?.split('\n## ')[0] ?? '';
const docScanText = `${source.planning}\n${source.result}\n${phaseSection}`;

const planTypesCode = stripComments(source.planTypes);
const planModuleCode = stripComments(source.planModule);
const planFixturesCode = stripComments(source.planFixtures);
const planAllCode = [planTypesCode, planModuleCode, planFixturesCode].join('\n');
const planAllSourceRaw = [source.planTypes, source.planModule, source.planFixtures].join('\n');

const baselineRoute = git('show', `${startingCommit}:${paths.route}`);
const baselineChartAiUi = git('show', `${startingCommit}:${paths.chartAiUi}`);
const routeUnchanged = source.route.trim() === baselineRoute.trim();
const chartAiUiUnchanged = source.chartAiUi.trim() === baselineChartAiUi.trim();

const phaseChanges = new Set(git('diff', '--name-only', startingCommit).split(/\r?\n/).filter(Boolean));
const addedFiles = git('diff', '--name-only', '--diff-filter=A', startingCommit).split(/\r?\n/).filter(Boolean);
const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif', '.bmp']);
const addedImages = addedFiles.filter((path) => imageExtensions.has(extname(path).toLowerCase()));
const dependenciesUnchanged = JSON.stringify(packageJson.dependencies ?? {}) === JSON.stringify(baselinePackage.dependencies ?? {});
const devDependenciesUnchanged = JSON.stringify(packageJson.devDependencies ?? {}) === JSON.stringify(baselinePackage.devDependencies ?? {});

const RAW_FIELDS = /stck_bsop_date|stck_oprc|stck_hgpr|stck_lwpr|stck_clpr|acml_vol|rt_cd|msg_cd|output2/i;
const ACTUAL_PRICE_VOLUME_PATTERN = /closePrice|openPrice|highPrice|lowPrice|\bclosePrc\b|\bvolumeValue\b/i;
const KIS_CREDENTIAL_PATTERN = /KIS_APP_KEY|KIS_APP_SECRET|appKey|appSecret|kisAccessToken/i;
const SECRET_VALUE = (text) =>
  /Bearer\s+[A-Za-z0-9._-]{8,}/.test(text) ||
  /KIS_APP_KEY['"]?\s*[:=]\s*['"]?[A-Za-z0-9]{8,}/.test(text) ||
  /KIS_APP_SECRET['"]?\s*[:=]\s*['"]?[A-Za-z0-9]{8,}/.test(text) ||
  /KIS_ACCESS_TOKEN['"]?\s*[:=]\s*['"]?[A-Za-z0-9]{8,}/.test(text);
const EXTERNAL_AI_PATTERN = /openai|anthropic|claude|gemini|gpt-\d|langchain/i;
const ACCOUNT_TRADING_PATTERN = /account[_-]?no|placeorder|trading[_-]?api|order[_-]?api|balance[_-]?api|kis_account/i;
const TOKEN_EMAIL_IP_COOKIE_HEADER_PATTERN =
  /sessionToken|accessToken|refreshToken|providerToken|\btoken\b|email|ipAddress|ip_address|remoteAddr|cookie|header/i;
const KIS_IMPORT_PATTERN = /(from\s+['"][^'"]*\/providers\/kis[^'"]*['"])|(from\s+['"][^'"]*kisClient['"])|(require\(\s*['"][^'"]*\/providers\/kis[^'"]*['"]\s*\))/i;
const KIS_CALL_PATTERN = /kisClient\(|getServerOnlyKisOhlcForSimilarity\(|runOwnerLocalOhlcPreview\(|getMockedServerOnlyKisOhlcForSimilarity\(/i;
const SUPABASE_IMPORT_PATTERN = /from\s+['"][^'"]*supabase[^'"]*['"]/i;
const AUTH_PROVIDER_IMPORT_PATTERN = /from\s+['"][^'"]*(auth0|next-auth|nextauth|clerk|firebase|passport|oauth)[^'"]*['"]/i;
const VERCEL_FILE_PATTERN = /(^|\/)vercel\.(json|ts)$|(^|\/)\.vercel\//i;
const COOKIE_PATTERN = /document\.cookie|req\.cookies|request\.cookies|\.cookies\b/i;
const HEADER_PATTERN = /req\.headers|request\.headers|getHeader\(|Astro\.request\.headers|\.headers\.get\(/i;
const STORAGE_ACCESS_PATTERN = /localStorage\.|sessionStorage\./;
const DB_CACHE_IMPORT_PATTERN = /from\s+['"][^'"]*(supabase|redis|upstash|postgres|prisma|drizzle|mongodb|turso)[^'"]*['"]/i;
const REAL_ENGINE_IMPORT_PATTERN = /from\s+['"][^'"]*\/lib\/chartSimilarity\//i;
const REAL_ENGINE_CALL_PATTERN = /similarityScanner\(|scanForSimilarPatterns\(/i;
const DB_CONNECTION_PATTERN = /connectionString|DATABASE_URL|postgres:\/\/|mysql:\/\//i;
const SQL_PATTERN = /SELECT\s|INSERT\s|UPDATE\s|DELETE\s|CREATE TABLE/i;

const pagesChanged = [...phaseChanges].some((path) => path.startsWith('src/pages/') && !path.startsWith('src/pages/api/'));
const apiChanged = [...phaseChanges].some((path) => path.startsWith('src/pages/api/'));
const serverProvidersChanged = [...phaseChanges].some((path) => path.startsWith('src/lib/server/providers/'));
const engineDirChanged = [...phaseChanges].some((path) => path.startsWith('src/lib/chartSimilarity/'));
const dataDirChanged = [...phaseChanges].some((path) => path.startsWith('src/data/chartSimilarity/'));
const supabaseOrMigrationAdded = addedFiles.some((path) => /migration|\.sql$/i.test(path) || /supabase/i.test(path));
const vercelChanged = [...phaseChanges].some((path) => VERCEL_FILE_PATTERN.test(path));

const allowedChangedPathPrefixes = ['src/lib/server/chartSimilarity/'];
const allowedChangedPaths = new Set([
  paths.planning,
  paths.result,
  paths.changelog,
  paths.checker,
  paths.package,
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

process.stdout.write('=== Phase 3FA-A Owner-local KIS-normalized Similarity Execution Plan ===\n\n');

process.stdout.write('Files and changelog:\n');
check('1. Planning document exists', existsSync(join(root, paths.planning)));
check('2. Result document exists', existsSync(join(root, paths.result)));
check('3. Checker exists', existsSync(join(root, paths.checker)));
check('4. Package checker script exists',
  packageJson.scripts?.['check:phase-3fa-a-owner-local-kis-normalized-similarity-execution-plan'] ===
    'node scripts/check_phase_3fa_a_owner_local_kis_normalized_similarity_execution_plan_contract.mjs');
check('5. Changelog contains Phase 3FA-A', phaseSection.length > 0);
process.stdout.write('\n');

process.stdout.write('Execution plan files present:\n');
check('6. Owner-local execution plan types file exists', existsSync(join(root, paths.planTypes)));
check('7. Owner-local execution plan module exists', existsSync(join(root, paths.planModule)));
check('8. Mocked owner-local execution plan fixtures file exists', existsSync(join(root, paths.planFixtures)));
check('9. Server index exports owner-local execution plan symbols',
  /SimilarityOwnerLocalExecutionPlanResult/.test(source.index) &&
  /buildSimilarityOwnerLocalExecutionPlanResult/.test(source.index) &&
  /buildMockedOwnerLocalExecutionPlanResult/.test(source.index));
process.stdout.write('\n');

process.stdout.write('Execution plan type shape:\n');
check('10. Types include SimilarityOwnerLocalExecutionPlanStatus', /SimilarityOwnerLocalExecutionPlanStatus/.test(source.planTypes));
check('11. Types include SimilarityOwnerLocalExecutionStage', /SimilarityOwnerLocalExecutionStage/.test(source.planTypes));
check('12. Types include SimilarityOwnerLocalExecutionSource', /SimilarityOwnerLocalExecutionSource/.test(source.planTypes));
check('13. Types include SimilarityOwnerLocalExecutionGate', /SimilarityOwnerLocalExecutionGate/.test(source.planTypes));
check('14. Types include SimilarityOwnerLocalProviderExpectation', /SimilarityOwnerLocalProviderExpectation/.test(source.planTypes));
check('15. Types include SimilarityOwnerLocalExecutionPlanPolicy', /SimilarityOwnerLocalExecutionPlanPolicy/.test(source.planTypes));
check('16. Types include SimilarityOwnerLocalExecutionPlanResult', /SimilarityOwnerLocalExecutionPlanResult/.test(source.planTypes));
process.stdout.write('\n');

process.stdout.write('Execution plan type exclusions:\n');
check('17. Types exclude raw KIS fields', !RAW_FIELDS.test(planTypesCode));
check('18. Types exclude actual price/volume fields', !ACTUAL_PRICE_VOLUME_PATTERN.test(planTypesCode));
check('19. Types exclude KIS credential fields', !KIS_CREDENTIAL_PATTERN.test(planTypesCode));
check('20. Types exclude account/trading fields', !ACCOUNT_TRADING_PATTERN.test(planTypesCode));
check('21. Types exclude token/email/IP/cookies/headers', !TOKEN_EMAIL_IP_COOKIE_HEADER_PATTERN.test(planTypesCode));
check('22. Types exclude DB connection strings', !DB_CONNECTION_PATTERN.test(planTypesCode));
check('23. Types exclude SQL strings', !SQL_PATTERN.test(planTypesCode));
process.stdout.write('\n');

process.stdout.write('Default execution plan policy:\n');
check('24. Default policy builder exists', /export const buildDefaultSimilarityOwnerLocalExecutionPlanPolicy/.test(source.planModule));
check('25. Default policy enabled false', /enabled:\s*false/.test(source.planModule));
check('26. Default policy ownerLocalOnly true', /ownerLocalOnly:\s*true/.test(source.planModule));
check('27. Default policy publicExecutionAllowed false', /publicExecutionAllowed:\s*false/.test(source.planModule));
check('28. Default policy betaExecutionAllowed false', /betaExecutionAllowed:\s*false/.test(source.planModule));
check('29. Default policy routeSuccessAllowed false', /routeSuccessAllowed:\s*false/.test(source.planModule));
check('30. Default policy liveKisCallAllowed false', /liveKisCallAllowed:\s*false/.test(source.planModule));
check('31. Default policy rawProviderPayloadAllowed false', /rawProviderPayloadAllowed:\s*false/.test(source.planModule));
check('32. Default policy requires auth', /requireAuth:\s*true/.test(source.planModule));
check('33. Default policy requires usage storage', /requireUsageStorage:\s*true/.test(source.planModule));
check('34. Default policy requires owner approval before execution', /requireOwnerApprovalBeforeExecution:\s*true/.test(source.planModule));
check('35. Default policy requires provider smoke before execution', /requireProviderSmokeBeforeExecution:\s*true/.test(source.planModule));
check('36. Default policy requires route shell feature flag approval', /requireRouteShellFeatureFlagApproval:\s*true/.test(source.planModule));
process.stdout.write('\n');

process.stdout.write('Provider expectation:\n');
check('37. Provider expectation builder exists', /export const buildOwnerLocalProviderExpectation/.test(source.planModule));
check('38. Provider expectation source owner-local', /source:\s*'owner-local'/.test(source.planModule));
check('39. Provider expectation market KR', /market:\s*'KR'/.test(source.planModule));
check('40. Provider expectation timeframe daily', /timeframe:\s*'daily'/.test(source.planModule));
check('41. Provider expectation normalizedOnly true', /normalizedOnly:\s*true/.test(source.planModule));
check('42. Provider expectation rawProviderPayloadAllowed false', /rawProviderPayloadAllowed:\s*false/.test(source.planModule));
check('43. Provider expectation accountOrTradingAllowed false', /accountOrTradingAllowed:\s*false/.test(source.planModule));
check('44. Provider expectation publicExecutionAllowed false', /publicExecutionAllowed:\s*false/.test(source.planModule));
process.stdout.write('\n');

process.stdout.write('Execution stages:\n');
check('45. Stages builder exists', /export const buildOwnerLocalExecutionStages/.test(source.planModule));
check('46. Stages include route_shell', /'route_shell'/.test(source.planModule));
check('47. Stages include auth_mapping', /'auth_mapping'/.test(source.planModule));
check('48. Stages include usage_check', /'usage_check'/.test(source.planModule));
check('49. Stages include kis_normalized_ohlc_fetch', /'kis_normalized_ohlc_fetch'/.test(source.planModule));
check('50. Stages include normalized_ohlc_validation', /'normalized_ohlc_validation'/.test(source.planModule));
check('51. Stages include similarity_engine_scan', /'similarity_engine_scan'/.test(source.planModule));
check('52. Stages include safe_response_packaging', /'safe_response_packaging'/.test(source.planModule));
process.stdout.write('\n');

process.stdout.write('Activation gates:\n');
check('53. Gates builder exists', /export const buildOwnerLocalExecutionGates/.test(source.planModule));
check('54. Gates include owner approval', /owner_approval/.test(source.planModule));
check('55. Gates include owner-local environment', /owner_local_environment/.test(source.planModule));
check('56. Gates include auth decision', /auth_decision/.test(source.planModule));
check('57. Gates include usage storage approval', /usage_storage_approval/.test(source.planModule));
check('58. Gates include provider smoke approval', /provider_smoke_approval/.test(source.planModule));
check('59. Gates include route feature flag approval', /route_feature_flag_approval/.test(source.planModule));
check('60. Gates include raw provider payload exclusion', /raw_provider_payload_exclusion/.test(source.planModule));
check('61. Gates include public execution disabled', /public_execution_disabled/.test(source.planModule));
check('62. Gates include route success disabled', /route_success_disabled/.test(source.planModule));
process.stdout.write('\n');

process.stdout.write('Execution allowed helper and plan result:\n');
check('63. Execution allowed helper exists', /export const isOwnerLocalExecutionAllowedByPlan/.test(source.planModule));
check('64. Execution allowed helper returns false by default',
  /!policy\.enabled/.test(planModuleCode) && /return false/.test(planModuleCode));
check('65. Plan result builder exists', /export const buildSimilarityOwnerLocalExecutionPlanResult/.test(source.planModule));
process.stdout.write('\n');

process.stdout.write('Mocked execution plan fixtures:\n');
check('66. Mocked policy fixture exists', /export const buildMockedOwnerLocalExecutionPlanPolicy/.test(source.planFixtures));
check('67. Mocked provider expectation fixture exists', /export const buildMockedOwnerLocalProviderExpectation/.test(source.planFixtures));
check('68. Mocked gates fixture exists', /export const buildMockedOwnerLocalExecutionGates/.test(source.planFixtures));
check('69. Mocked plan result fixture exists', /export const buildMockedOwnerLocalExecutionPlanResult/.test(source.planFixtures));
check('70. Mocked denied result fixture exists', /export const buildMockedOwnerLocalExecutionDeniedResult/.test(source.planFixtures));
process.stdout.write('\n');

process.stdout.write('Execution plan module safety:\n');
check('71. Plan module does not import KIS provider/client', !KIS_IMPORT_PATTERN.test(planModuleCode));
check('72. Plan module does not call KIS', !KIS_CALL_PATTERN.test(planModuleCode));
check('73. Plan module does not import or call real similarity engine',
  !REAL_ENGINE_IMPORT_PATTERN.test(planModuleCode) && !REAL_ENGINE_CALL_PATTERN.test(planModuleCode));
check('74. Plan module does not import auth provider', !AUTH_PROVIDER_IMPORT_PATTERN.test(planModuleCode));
check('75. Plan module does not import Supabase', !SUPABASE_IMPORT_PATTERN.test(planModuleCode));
check('76. Plan module does not import DB/cache provider', !DB_CACHE_IMPORT_PATTERN.test(planModuleCode));
check('77. Plan module does not call fetch', !/\bfetch\(/.test(planModuleCode));
check('78. Plan module does not read process.env', !/process\.env(\.\w|\[)/.test(planModuleCode));
check('79. Plan module does not read .env',
  !/readFileSync\([^)]*\.env/.test(planModuleCode) && !/require\(['"]dotenv['"]\)/.test(planModuleCode));
check('80. Plan module does not read cookies', !COOKIE_PATTERN.test(planModuleCode));
check('81. Plan module does not read headers', !HEADER_PATTERN.test(planModuleCode));
check('82. Plan module does not read localStorage/sessionStorage', !STORAGE_ACCESS_PATTERN.test(planModuleCode));
process.stdout.write('\n');

process.stdout.write('Route and UI unchanged:\n');
check('83. API route file is unchanged from starting commit', routeUnchanged);
check('84. /chart-ai UI file is unchanged from starting commit', chartAiUiUnchanged);
process.stdout.write('\n');

process.stdout.write('Result document preserved-boundary records:\n');
check('85. Docs record design-only plan', /design-only plan|design only/i.test(source.result));
check('86. Docs record no KIS call', /no kis call/i.test(source.result));
check('87. Docs record no live similarity execution', /no live similarity execution/i.test(source.result));
check('88. Docs record owner-local only', /owner-local only/i.test(source.result));
check('89. Docs record no public/beta execution', /no public or beta execution/i.test(source.result));
check('90. Docs record no route success', /no route success/i.test(source.result));
check('91. Docs record no auth/storage implementation', /no real auth runtime or usage storage implementation/i.test(source.result));
check('92. Docs record no DB/cache runtime', /no db.{0,10}cache runtime/i.test(source.result));
check('93. Docs record no SQL/migration', /no sql file or migration/i.test(source.result));
check('94. Docs record no deployment', /no deployment/i.test(source.result));
check('95. Docs record no push', /no push/i.test(source.result));
process.stdout.write('\n');

process.stdout.write('Changelog records:\n');
check('96. Docs record next phase', /next phase/i.test(phaseSection));
process.stdout.write('\n');

process.stdout.write('Forbidden changed paths:\n');
check('97. No src/pages files changed', !pagesChanged);
check('98. No src/pages/api files changed', !apiChanged);
check('99. No src/lib/server/providers files changed', !serverProvidersChanged);
check('100. No src/lib/chartSimilarity files changed', !engineDirChanged);
check('101. No src/data/chartSimilarity files changed', !dataDirChanged);
check('102. No Supabase/migration/SQL files added', !supabaseOrMigrationAdded);
check('103. No Vercel files changed', !vercelChanged);
check('104. No dependency changes', dependenciesUnchanged);
check('105. No devDependency changes', devDependenciesUnchanged);
check('106. No image files added', addedImages.length === 0);
process.stdout.write('\n');

process.stdout.write('Source safety scan:\n');
check('107. Source contains no source=live', !/source\s*=\s*['"]?live/i.test(planAllSourceRaw));
check('108. Source contains no source=auto', !/source\s*=\s*['"]?auto/i.test(planAllSourceRaw));
check('109. Source contains no external AI keywords', !EXTERNAL_AI_PATTERN.test(planAllSourceRaw));
check('110. Source contains no raw KIS response fields', !RAW_FIELDS.test(docScanText));
check('111. Source contains no secret-looking values', !SECRET_VALUE(docScanText));
process.stdout.write('\n');

process.stdout.write('Network and scope safety:\n');
check('112. Checker blocks network access',
  source.checker.includes(
    'Network access is blocked in the Phase 3FA-A owner local kis normalized similarity execution plan checker.',
  ) && !fetchAttempted);
check('113. Allowed changed files only', unexpectedChanges.length === 0);
process.stdout.write('\n');

process.stdout.write(`Checks passed: ${passed}/${passed + failed}\n`);
if (failed > 0) {
  process.stdout.write(`Failures: ${failures.join('; ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('All Phase 3FA-A checks passed.\n');
}
