/**
 * Phase 3FA-B documentation and source contract.
 * Owner-local KIS similarity smoke plan.
 * Static only: no network, browser, dev server, API, provider, live KIS, external AI, or environment access.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error(
    'Network access is blocked in the Phase 3FA-B owner local kis similarity smoke plan checker.',
  );
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = process.cwd();
const startingCommit = '51336a3';

const paths = {
  planning: 'docs/planning/phase_3fa_b_owner_local_kis_similarity_smoke_plan_v0.1.md',
  result: 'docs/planning/phase_3fa_b_owner_local_kis_similarity_smoke_plan_result_v0.1.md',
  changelog: 'docs/planning/planning_changelog.md',
  checker: 'scripts/check_phase_3fa_b_owner_local_kis_similarity_smoke_plan_contract.mjs',
  package: 'package.json',
  route: 'src/pages/api/chart-ai/similarity.ts',
  chartAiUi: 'src/pages/chart-ai.astro',
  engineTypes: 'src/lib/chartSimilarity/types.ts',
  engineIndex: 'src/lib/chartSimilarity/index.ts',
  engineScanner: 'src/lib/chartSimilarity/similarityScanner.ts',
  planTypes: 'src/lib/server/chartSimilarity/similarityOwnerLocalSmokePlanTypes.ts',
  planModule: 'src/lib/server/chartSimilarity/similarityOwnerLocalSmokePlan.ts',
  planFixtures: 'src/lib/server/chartSimilarity/mockedSimilarityOwnerLocalSmokePlanFixtures.ts',
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
const phaseSection = source.changelog.split('## Phase 3FA-B - 2026-07-04')[1]?.split('\n## ')[0] ?? '';
const docScanText = `${source.planning}\n${source.result}\n${phaseSection}`;

const planTypesCode = stripComments(source.planTypes);
const planModuleCode = stripComments(source.planModule);
const planFixturesCode = stripComments(source.planFixtures);
const planAllSourceRaw = [source.planTypes, source.planModule, source.planFixtures].join('\n');

const normalizeLineEndings = (text) => text.replace(/\r\n/g, '\n');
const gitShowTrimmed = (path) => normalizeLineEndings(git('show', `${startingCommit}:${path}`)).trim();
const currentTrimmed = (text) => normalizeLineEndings(text).trim();

const routeUnchanged = currentTrimmed(source.route) === gitShowTrimmed(paths.route);
const chartAiUiUnchanged = currentTrimmed(source.chartAiUi) === gitShowTrimmed(paths.chartAiUi);
const engineTypesUnchanged = currentTrimmed(source.engineTypes) === gitShowTrimmed(paths.engineTypes);
const engineIndexUnchanged = currentTrimmed(source.engineIndex) === gitShowTrimmed(paths.engineIndex);
const engineScannerUnchanged = currentTrimmed(source.engineScanner) === gitShowTrimmed(paths.engineScanner);
const engineFilesUnchanged = engineTypesUnchanged && engineIndexUnchanged && engineScannerUnchanged;

const phaseChanges = new Set(git('diff', '--name-only', startingCommit).split(/\r?\n/).filter(Boolean));
const addedFiles = git('diff', '--name-only', '--diff-filter=A', startingCommit).split(/\r?\n/).filter(Boolean);
const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif', '.bmp']);
const addedImages = addedFiles.filter((path) => imageExtensions.has(extname(path).toLowerCase()));
const dependenciesUnchanged = JSON.stringify(packageJson.dependencies ?? {}) === JSON.stringify(baselinePackage.dependencies ?? {});
const devDependenciesUnchanged = JSON.stringify(packageJson.devDependencies ?? {}) === JSON.stringify(baselinePackage.devDependencies ?? {});

const RAW_FIELDS = /stck_bsop_date|stck_oprc|stck_hgpr|stck_lwpr|stck_clpr|acml_vol|rt_cd|msg_cd|output2/i;
const ACTUAL_PRICE_VOLUME_PATTERN = /closePrice|openPrice|highPrice|lowPrice|\bclosePrc\b|\bvolumeValue\b/i;
const MARKET_TIMESTAMP_PATTERN = /marketTimestamp|barTimestamp|tradeDate|bsopDate|\bohlcDate\b/i;
const SIMILARITY_SCORE_RETURN_PATTERN = /realSimilarityScore|actualSimilarityScore|realizedReturn|actualReturn|realDerivedReturn/i;
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
const DATE_NOW_PATTERN = /Date\.now\(\)|new Date\(\)/;

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

process.stdout.write('=== Phase 3FA-B Owner-local KIS Similarity Smoke Plan ===\n\n');

process.stdout.write('Files and changelog:\n');
check('1. Planning document exists', existsSync(join(root, paths.planning)));
check('2. Result document exists', existsSync(join(root, paths.result)));
check('3. Checker exists', existsSync(join(root, paths.checker)));
check('4. Package checker script exists',
  packageJson.scripts?.['check:phase-3fa-b-owner-local-kis-similarity-smoke-plan'] ===
    'node scripts/check_phase_3fa_b_owner_local_kis_similarity_smoke_plan_contract.mjs');
check('5. Changelog contains Phase 3FA-B', phaseSection.length > 0);
process.stdout.write('\n');

process.stdout.write('Smoke plan files present:\n');
check('6. Owner-local smoke plan types file exists', existsSync(join(root, paths.planTypes)));
check('7. Owner-local smoke plan module exists', existsSync(join(root, paths.planModule)));
check('8. Mocked owner-local smoke plan fixtures file exists', existsSync(join(root, paths.planFixtures)));
check('9. Server index exports owner-local smoke plan symbols',
  /SimilarityOwnerLocalSmokePlanResult/.test(source.index) &&
  /buildSimilarityOwnerLocalSmokePlanResult/.test(source.index) &&
  /buildMockedOwnerLocalSmokePlanResult/.test(source.index));
process.stdout.write('\n');

process.stdout.write('Smoke plan type shape:\n');
check('10. Types include SimilarityOwnerLocalSmokePlanStatus', /SimilarityOwnerLocalSmokePlanStatus/.test(source.planTypes));
check('11. Types include SimilarityOwnerLocalSmokeStage', /SimilarityOwnerLocalSmokeStage/.test(source.planTypes));
check('12. Types include SimilarityOwnerLocalSmokeGate', /SimilarityOwnerLocalSmokeGate/.test(source.planTypes));
check('13. Types include SimilarityOwnerLocalSmokeRedactionPolicy', /SimilarityOwnerLocalSmokeRedactionPolicy/.test(source.planTypes));
check('14. Types include SimilarityOwnerLocalSmokeReportTemplate', /SimilarityOwnerLocalSmokeReportTemplate/.test(source.planTypes));
check('15. Types include SimilarityOwnerLocalSmokePlanPolicy', /SimilarityOwnerLocalSmokePlanPolicy/.test(source.planTypes));
check('16. Types include SimilarityOwnerLocalSmokePlanResult', /SimilarityOwnerLocalSmokePlanResult/.test(source.planTypes));
process.stdout.write('\n');

process.stdout.write('Smoke plan type exclusions:\n');
check('17. Types exclude raw KIS fields', !RAW_FIELDS.test(planTypesCode));
check('18. Types exclude actual price/volume fields', !ACTUAL_PRICE_VOLUME_PATTERN.test(planTypesCode));
check('19. Types exclude market timestamps', !MARKET_TIMESTAMP_PATTERN.test(planTypesCode));
check('20. Types exclude similarity score/return fields from real data', !SIMILARITY_SCORE_RETURN_PATTERN.test(planTypesCode));
check('21. Types exclude KIS credential fields', !KIS_CREDENTIAL_PATTERN.test(planTypesCode));
check('22. Types exclude account/trading fields', !ACCOUNT_TRADING_PATTERN.test(planTypesCode));
check('23. Types exclude token/email/IP/cookies/headers', !TOKEN_EMAIL_IP_COOKIE_HEADER_PATTERN.test(planTypesCode));
check('24. Types exclude DB connection strings', !DB_CONNECTION_PATTERN.test(planTypesCode));
check('25. Types exclude SQL strings', !SQL_PATTERN.test(planTypesCode));
process.stdout.write('\n');

process.stdout.write('Default smoke plan policy:\n');
check('26. Default policy builder exists', /export const buildDefaultSimilarityOwnerLocalSmokePlanPolicy/.test(source.planModule));
check('27. Default policy enabled false', /enabled:\s*false/.test(source.planModule));
check('28. Default policy ownerLocalOnly true', /ownerLocalOnly:\s*true/.test(source.planModule));
check('29. Default policy manualExecutionOnly true', /manualExecutionOnly:\s*true/.test(source.planModule));
check('30. Default policy publicExecutionAllowed false', /publicExecutionAllowed:\s*false/.test(source.planModule));
check('31. Default policy betaExecutionAllowed false', /betaExecutionAllowed:\s*false/.test(source.planModule));
check('32. Default policy routeSuccessAllowed false', /routeSuccessAllowed:\s*false/.test(source.planModule));
check('33. Default policy liveKisCallAllowedInThisPhase false', /liveKisCallAllowedInThisPhase:\s*false/.test(source.planModule));
check('34. Default policy liveSimilarityExecutionAllowedInThisPhase false', /liveSimilarityExecutionAllowedInThisPhase:\s*false/.test(source.planModule));
check('35. Default policy rawProviderPayloadAllowed false', /rawProviderPayloadAllowed:\s*false/.test(source.planModule));
check('36. Default policy actualMarketValuesInReportsAllowed false', /actualMarketValuesInReportsAllowed:\s*false/.test(source.planModule));
check('37. Default policy requires owner approval before smoke', /requiresOwnerApprovalBeforeSmoke:\s*true/.test(source.planModule));
check('38. Default policy requires provider env prepared but unread by plan', /requiresProviderEnvPreparedButUnreadByPlan:\s*true/.test(source.planModule));
check('39. Default policy requires route shell disabled', /requiresRouteShellToRemainDisabled:\s*true/.test(source.planModule));
check('40. Default policy requires no-store response policy', /requiresNoStoreResponsePolicy:\s*true/.test(source.planModule));
process.stdout.write('\n');

process.stdout.write('Smoke stages:\n');
check('41. Stages builder exists', /export const buildOwnerLocalSmokeStages/.test(source.planModule));
check('42. Stages include preflight_boundary_check', /'preflight_boundary_check'/.test(source.planModule));
check('43. Stages include owner_local_environment_confirmation', /'owner_local_environment_confirmation'/.test(source.planModule));
check('44. Stages include route_shell_disabled_confirmation', /'route_shell_disabled_confirmation'/.test(source.planModule));
check('45. Stages include auth_usage_precondition_review', /'auth_usage_precondition_review'/.test(source.planModule));
check('46. Stages include kis_normalized_ohlc_provider_probe', /'kis_normalized_ohlc_provider_probe'/.test(source.planModule));
check('47. Stages include normalized_bar_shape_validation', /'normalized_bar_shape_validation'/.test(source.planModule));
check('48. Stages include similarity_engine_contract_dry_run', /'similarity_engine_contract_dry_run'/.test(source.planModule));
check('49. Stages include safe_response_redaction_check', /'safe_response_redaction_check'/.test(source.planModule));
check('50. Stages include manual_review_closeout', /'manual_review_closeout'/.test(source.planModule));
process.stdout.write('\n');

process.stdout.write('Smoke gates:\n');
check('51. Gates builder exists', /export const buildOwnerLocalSmokeGates/.test(source.planModule));
check('52. Gates include owner approval before smoke', /owner_approval_before_smoke/.test(source.planModule));
check('53. Gates include owner-local environment confirmation', /owner_local_environment_confirmation/.test(source.planModule));
check('54. Gates include provider env prepared but unread by plan', /provider_env_prepared_but_unread_by_plan/.test(source.planModule));
check('55. Gates include route shell remains disabled', /route_shell_remains_disabled/.test(source.planModule));
check('56. Gates include route success remains disabled', /route_success_disabled/.test(source.planModule));
check('57. Gates include public execution disabled', /public_execution_disabled/.test(source.planModule));
check('58. Gates include beta execution disabled', /beta_execution_disabled/.test(source.planModule));
check('59. Gates include raw provider payload exclusion', /raw_provider_payload_exclusion/.test(source.planModule));
check('60. Gates include no actual market values in report', /no_actual_market_values_in_report/.test(source.planModule));
check('61. Gates include no credential/env echo', /no_credential_env_echo/.test(source.planModule));
check('62. Gates include no deployment/push', /no_deployment_or_push/.test(source.planModule));
process.stdout.write('\n');

process.stdout.write('Redaction policy:\n');
check('63. Redaction policy builder exists', /export const buildOwnerLocalSmokeRedactionPolicy/.test(source.planModule));
check('64. Redaction policy disallows raw KIS payload', /allowRawKisPayload:\s*false/.test(source.planModule));
check('65. Redaction policy disallows OHLC values', /allowOhlcValuesInReport:\s*false/.test(source.planModule));
check('66. Redaction policy disallows volume values', /allowVolumeValuesInReport:\s*false/.test(source.planModule));
check('67. Redaction policy disallows timestamps', /allowTimestampsInReport:\s*false/.test(source.planModule));
check('68. Redaction policy disallows similarity scores', /allowSimilarityScoresInReport:\s*false/.test(source.planModule));
check('69. Redaction policy disallows derived returns', /allowDerivedReturnsInReport:\s*false/.test(source.planModule));
check('70. Redaction policy disallows credential echo', /allowCredentialEcho:\s*false/.test(source.planModule));
check('71. Redaction policy disallows token echo', /allowTokenEcho:\s*false/.test(source.planModule));
check('72. Redaction policy disallows env echo', /allowEnvEcho:\s*false/.test(source.planModule));
check('73. Redaction allowed fields are status-only/safe fields',
  /allowedReportFields:\s*\[/.test(source.planModule) &&
  ["'status'", "'smokeId'", "'executedBy'", "'source'", "'providerProbe'", "'normalizationCheck'", "'engineContractCheck'", "'responseRedactionCheck'", "'safeSummary'", "'warnings'"]
    .every((field) => source.planModule.includes(field)));
process.stdout.write('\n');

process.stdout.write('Report template:\n');
check('74. Report template builder exists', /export const buildOwnerLocalSmokeReportTemplate/.test(source.planModule));
check('75. Report template status not_run', /status:\s*notRun/.test(source.planModule) || /status:\s*['"]not_run['"]/.test(source.planModule));
check('76. Report template executedBy owner-local-manual', /executedBy:\s*'owner-local-manual'/.test(source.planModule));
check('77. Report template source owner-local', /source:\s*'owner-local'/.test(source.planModule));
check('78. Report template providerProbe not_run', /providerProbe:\s*notRun/.test(source.planModule) || /providerProbe:\s*['"]not_run['"]/.test(source.planModule));
check('79. Report template normalizationCheck not_run', /normalizationCheck:\s*notRun/.test(source.planModule) || /normalizationCheck:\s*['"]not_run['"]/.test(source.planModule));
check('80. Report template engineContractCheck not_run', /engineContractCheck:\s*notRun/.test(source.planModule) || /engineContractCheck:\s*['"]not_run['"]/.test(source.planModule));
check('81. Report template responseRedactionCheck not_run', /responseRedactionCheck:\s*notRun/.test(source.planModule) || /responseRedactionCheck:\s*['"]not_run['"]/.test(source.planModule));
process.stdout.write('\n');

process.stdout.write('Execution allowed helper and plan result:\n');
check('82. Execution allowed helper exists', /export const isOwnerLocalSmokeAllowedByPlan/.test(source.planModule));
check('83. Execution allowed helper returns false by default',
  /!policy\.enabled/.test(planModuleCode) && /return false/.test(planModuleCode));
check('84. Plan result builder exists', /export const buildSimilarityOwnerLocalSmokePlanResult/.test(source.planModule));
process.stdout.write('\n');

process.stdout.write('Mocked smoke plan fixtures:\n');
check('85. Mocked policy fixture exists', /export const buildMockedOwnerLocalSmokePlanPolicy/.test(source.planFixtures));
check('86. Mocked stages fixture exists', /export const buildMockedOwnerLocalSmokeStages/.test(source.planFixtures));
check('87. Mocked gates fixture exists', /export const buildMockedOwnerLocalSmokeGates/.test(source.planFixtures));
check('88. Mocked redaction policy fixture exists', /export const buildMockedOwnerLocalSmokeRedactionPolicy/.test(source.planFixtures));
check('89. Mocked report template fixture exists', /export const buildMockedOwnerLocalSmokeReportTemplate/.test(source.planFixtures));
check('90. Mocked plan result fixture exists', /export const buildMockedOwnerLocalSmokePlanResult/.test(source.planFixtures));
check('91. Mocked denied result fixture exists', /export const buildMockedOwnerLocalSmokeDeniedResult/.test(source.planFixtures));
process.stdout.write('\n');

process.stdout.write('Smoke plan module safety:\n');
check('92. Plan module does not import KIS provider/client', !KIS_IMPORT_PATTERN.test(planModuleCode));
check('93. Plan module does not call KIS', !KIS_CALL_PATTERN.test(planModuleCode));
check('94. Plan module does not import or call real similarity engine',
  !REAL_ENGINE_IMPORT_PATTERN.test(planModuleCode) && !REAL_ENGINE_CALL_PATTERN.test(planModuleCode));
check('95. Plan module does not import auth provider', !AUTH_PROVIDER_IMPORT_PATTERN.test(planModuleCode));
check('96. Plan module does not import Supabase', !SUPABASE_IMPORT_PATTERN.test(planModuleCode));
check('97. Plan module does not import DB/cache provider', !DB_CACHE_IMPORT_PATTERN.test(planModuleCode));
check('98. Plan module does not call fetch', !/\bfetch\(/.test(planModuleCode));
check('99. Plan module does not read process.env', !/process\.env(\.\w|\[)/.test(planModuleCode));
check('100. Plan module does not read .env',
  !/readFileSync\([^)]*\.env/.test(planModuleCode) && !/require\(['"]dotenv['"]\)/.test(planModuleCode));
check('101. Plan module does not read cookies', !COOKIE_PATTERN.test(planModuleCode));
check('102. Plan module does not read headers', !HEADER_PATTERN.test(planModuleCode));
check('103. Plan module does not read localStorage/sessionStorage', !STORAGE_ACCESS_PATTERN.test(planModuleCode));
check('104. Plan module does not use Date.now', !/Date\.now\(\)/.test(planModuleCode));
check('105. Plan module does not use current runtime date', !DATE_NOW_PATTERN.test(planModuleCode));
process.stdout.write('\n');

process.stdout.write('Route, UI, and engine unchanged:\n');
check('106. API route file is unchanged from starting commit', routeUnchanged);
check('107. /chart-ai UI file is unchanged from starting commit', chartAiUiUnchanged);
check('108. Deterministic similarity engine files are unchanged from starting commit', engineFilesUnchanged);
process.stdout.write('\n');

process.stdout.write('Result document preserved-boundary records:\n');
check('109. Docs record smoke plan only', /smoke plan only|design-only plan|design only|design\/foundation only/i.test(docScanText));
check('110. Docs record no KIS call', /no kis call/i.test(source.result));
check('111. Docs record no live similarity execution', /no live similarity execution/i.test(source.result));
check('112. Docs record no route change', /no api route change|no route change/i.test(source.result));
check('113. Docs record route success remains disabled', /route success remains disabled|route success disabled/i.test(source.result));
check('114. Docs record owner-local manual future smoke only', /owner-local manual/i.test(source.result));
check('115. Docs record no public/beta execution',
  /public execution (is|remains|)\s*disabled|no public execution/i.test(docScanText) &&
  /beta execution (is|remains|)\s*disabled|no beta execution/i.test(docScanText));
check('116. Docs record redaction policy', /redaction policy/i.test(source.result));
check('117. Docs record no market values in reports', /no actual market value/i.test(source.result));
check('118. Docs record no auth/storage implementation', /no real auth runtime or usage storage implementation/i.test(source.result));
check('119. Docs record no DB/cache runtime', /no db.{0,10}cache runtime/i.test(source.result));
check('120. Docs record no SQL/migration', /no sql file or migration/i.test(source.result));
check('121. Docs record no deployment', /no deployment/i.test(source.result));
check('122. Docs record no push', /no push/i.test(source.result));
process.stdout.write('\n');

process.stdout.write('Changelog records:\n');
check('123. Docs record next phase', /next phase/i.test(phaseSection));
process.stdout.write('\n');

process.stdout.write('Forbidden changed paths:\n');
check('124. No src/pages files changed', !pagesChanged);
check('125. No src/pages/api files changed', !apiChanged);
check('126. No src/lib/server/providers files changed', !serverProvidersChanged);
check('127. No src/lib/chartSimilarity files changed', !engineDirChanged);
check('128. No src/data/chartSimilarity files changed', !dataDirChanged);
check('129. No Supabase/migration/SQL files added', !supabaseOrMigrationAdded);
check('130. No Vercel files changed', !vercelChanged);
check('131. No dependency changes', dependenciesUnchanged);
check('132. No devDependency changes', devDependenciesUnchanged);
check('133. No image files added', addedImages.length === 0);
process.stdout.write('\n');

process.stdout.write('Source safety scan:\n');
check('134. Source contains no source=live', !/source\s*=\s*['"]?live/i.test(planAllSourceRaw));
check('135. Source contains no source=auto', !/source\s*=\s*['"]?auto/i.test(planAllSourceRaw));
check('136. Source contains no external AI keywords', !EXTERNAL_AI_PATTERN.test(planAllSourceRaw));
check('137. Source contains no raw KIS response fields', !RAW_FIELDS.test(docScanText));
check('138. Source contains no secret-looking values', !SECRET_VALUE(docScanText));
process.stdout.write('\n');

process.stdout.write('Network and scope safety:\n');
check('139. Checker blocks network access',
  source.checker.includes(
    'Network access is blocked in the Phase 3FA-B owner local kis similarity smoke plan checker.',
  ) && !fetchAttempted);
check('140. Allowed changed files only', unexpectedChanges.length === 0);
process.stdout.write('\n');

process.stdout.write(`Checks passed: ${passed}/${passed + failed}\n`);
if (failed > 0) {
  process.stdout.write(`Failures: ${failures.join('; ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('All Phase 3FA-B checks passed.\n');
}
