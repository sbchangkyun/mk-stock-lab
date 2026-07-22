/**
 * Phase 3FA-D documentation and source contract.
 * Owner-local manual smoke execution closeout.
 * Static only: no network, browser, dev server, API, provider, live KIS, external AI, or environment access.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error(
    'Network access is blocked in the Phase 3FA-D owner local manual smoke execution closeout checker.',
  );
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = process.cwd();
const startingCommit = '53cf39a';

const paths = {
  planning: 'docs/planning/phase_3fa_d_owner_local_manual_smoke_execution_closeout_v0.1.md',
  result: 'docs/planning/phase_3fa_d_owner_local_manual_smoke_execution_closeout_result_v0.1.md',
  changelog: 'docs/planning/planning_changelog.md',
  checker: 'scripts/check_phase_3fa_d_owner_local_manual_smoke_execution_closeout_contract.mjs',
  smoke: 'scripts/smoke_phase_3fa_d_owner_local_manual_smoke_execution_closeout.mjs',
  package: 'package.json',
  route: 'src/pages/api/chart-ai/similarity.ts',
  chartAiUi: 'src/pages/chart-ai.astro',
  engineTypes: 'src/lib/chartSimilarity/types.ts',
  engineIndex: 'src/lib/chartSimilarity/index.ts',
  engineScanner: 'src/lib/chartSimilarity/similarityScanner.ts',
  closeoutTypes: 'src/lib/server/chartSimilarity/similarityOwnerLocalSmokeCloseoutTypes.ts',
  closeoutModule: 'src/lib/server/chartSimilarity/similarityOwnerLocalSmokeCloseout.ts',
  closeoutFixtures: 'src/lib/server/chartSimilarity/mockedSimilarityOwnerLocalSmokeCloseoutFixtures.ts',
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
const phaseSection = source.changelog.split('## Phase 3FA-D - 2026-07-04')[1]?.split('\n## ')[0] ?? '';
const docScanText = `${source.planning}\n${source.result}\n${phaseSection}`;

const closeoutTypesCode = stripComments(source.closeoutTypes);
const closeoutModuleCode = stripComments(source.closeoutModule);
const closeoutFixturesCode = stripComments(source.closeoutFixtures);
const smokeScriptCode = stripComments(source.smoke);
const closeoutAllSourceRaw = [source.closeoutTypes, source.closeoutModule, source.closeoutFixtures].join('\n');

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
  paths.smoke,
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

process.stdout.write('=== Phase 3FA-D Owner-local Manual Smoke Execution Closeout ===\n\n');

process.stdout.write('Files, checker, smoke, package, changelog:\n');
check('1. Planning document exists', existsSync(join(root, paths.planning)));
check('2. Result document exists', existsSync(join(root, paths.result)));
check('3. Checker exists', existsSync(join(root, paths.checker)));
check('4. Smoke script exists', existsSync(join(root, paths.smoke)));
check('5. Package checker script exists',
  packageJson.scripts?.['check:phase-3fa-d-owner-local-manual-smoke-execution-closeout'] ===
    'node scripts/check_phase_3fa_d_owner_local_manual_smoke_execution_closeout_contract.mjs');
check('6. Package smoke script exists',
  packageJson.scripts?.['smoke:phase-3fa-d-owner-local-manual-smoke-execution-closeout'] ===
    'node scripts/smoke_phase_3fa_d_owner_local_manual_smoke_execution_closeout.mjs');
check('7. Changelog contains Phase 3FA-D', phaseSection.length > 0);
process.stdout.write('\n');

process.stdout.write('Closeout files present:\n');
check('8. Closeout types file exists', existsSync(join(root, paths.closeoutTypes)));
check('9. Closeout module exists', existsSync(join(root, paths.closeoutModule)));
check('10. Mocked closeout fixtures file exists', existsSync(join(root, paths.closeoutFixtures)));
check('11. Server index exports closeout symbols',
  /SimilarityOwnerLocalSmokeCloseoutResult/.test(source.index) &&
  /buildSimilarityOwnerLocalSmokeCloseoutResult/.test(source.index) &&
  /buildMockedOwnerLocalSmokeCloseoutResult/.test(source.index));
process.stdout.write('\n');

process.stdout.write('Closeout type shape:\n');
check('12. Types include SimilarityOwnerLocalSmokeCloseoutStatus', /SimilarityOwnerLocalSmokeCloseoutStatus/.test(source.closeoutTypes));
check('13. Types include SimilarityOwnerLocalSmokeCloseoutDecision', /SimilarityOwnerLocalSmokeCloseoutDecision/.test(source.closeoutTypes));
check('14. Types include SimilarityOwnerLocalSmokeCloseoutCheckStatus', /SimilarityOwnerLocalSmokeCloseoutCheckStatus/.test(source.closeoutTypes));
check('15. Types include SimilarityOwnerLocalSmokeCloseoutCheck', /SimilarityOwnerLocalSmokeCloseoutCheck\b/.test(source.closeoutTypes));
check('16. Types include SimilarityOwnerLocalSmokeCloseoutPolicy', /SimilarityOwnerLocalSmokeCloseoutPolicy/.test(source.closeoutTypes));
check('17. Types include SimilarityOwnerLocalSmokeCloseoutReport', /SimilarityOwnerLocalSmokeCloseoutReport/.test(source.closeoutTypes));
check('18. Types include SimilarityOwnerLocalSmokeCloseoutResult', /SimilarityOwnerLocalSmokeCloseoutResult/.test(source.closeoutTypes));
process.stdout.write('\n');

process.stdout.write('Closeout type exclusions:\n');
check('19. Types exclude raw KIS fields', !RAW_FIELDS.test(closeoutTypesCode));
check('20. Types exclude actual price/volume fields', !ACTUAL_PRICE_VOLUME_PATTERN.test(closeoutTypesCode));
check('21. Types exclude market timestamps', !MARKET_TIMESTAMP_PATTERN.test(closeoutTypesCode));
check('22. Types exclude similarity score/return fields from real data', !SIMILARITY_SCORE_RETURN_PATTERN.test(closeoutTypesCode));
check('23. Types exclude KIS credential fields', !KIS_CREDENTIAL_PATTERN.test(closeoutTypesCode));
check('24. Types exclude account/trading fields', !ACCOUNT_TRADING_PATTERN.test(closeoutTypesCode));
check('25. Types exclude token/email/IP/cookies/headers', !TOKEN_EMAIL_IP_COOKIE_HEADER_PATTERN.test(closeoutTypesCode));
check('26. Types exclude DB connection strings', !DB_CONNECTION_PATTERN.test(closeoutTypesCode));
check('27. Types exclude SQL strings', !SQL_PATTERN.test(closeoutTypesCode));
process.stdout.write('\n');

process.stdout.write('Default closeout policy:\n');
check('28. Default policy builder exists', /export const buildDefaultSimilarityOwnerLocalSmokeCloseoutPolicy/.test(source.closeoutModule));
check('29. Default policy enabled false', /enabled:\s*false/.test(source.closeoutModule));
check('30. Default policy liveSmokeExecuted false', /liveSmokeExecuted:\s*false/.test(source.closeoutModule));
check('31. Default policy allowLiveKisCall false', /allowLiveKisCall:\s*false/.test(source.closeoutModule));
check('32. Default policy allowLiveSimilarityExecution false', /allowLiveSimilarityExecution:\s*false/.test(source.closeoutModule));
check('33. Default policy allowRouteSuccess false', /allowRouteSuccess:\s*false/.test(source.closeoutModule));
check('34. Default policy allowRouteCall false', /allowRouteCall:\s*false/.test(source.closeoutModule));
check('35. Default policy allowEnvRead false', /allowEnvRead:\s*false/.test(source.closeoutModule));
check('36. Default policy allowMarketDataInReport false', /allowMarketDataInReport:\s*false/.test(source.closeoutModule));
check('37. Default policy allowRawProviderPayload false', /allowRawProviderPayload:\s*false/.test(source.closeoutModule));
check('38. Default policy allowCredentialEcho false', /allowCredentialEcho:\s*false/.test(source.closeoutModule));
check('39. Default policy requireOwnerApprovalForNextPhase true', /requireOwnerApprovalForNextPhase:\s*true/.test(source.closeoutModule));
check('40. Default policy requireManualSmokeSeparateCommand true', /requireManualSmokeSeparateCommand:\s*true/.test(source.closeoutModule));
process.stdout.write('\n');

process.stdout.write('Closeout checks builder:\n');
check('41. Checks builder exists', /export const buildOwnerLocalSmokeCloseoutChecks/.test(source.closeoutModule));
check('42. Checks cover disabled harness exists', /disabled_harness_exists/.test(source.closeoutModule));
check('43. Checks cover disabled harness remains disabled', /disabled_harness_remains_disabled/.test(source.closeoutModule));
check('44. Checks cover route remains feature disabled', /route_remains_feature_disabled/.test(source.closeoutModule));
check('45. Checks cover live KIS call not executed', /live_kis_call_not_executed/.test(source.closeoutModule));
check('46. Checks cover live similarity execution not executed', /live_similarity_execution_not_executed/.test(source.closeoutModule));
check('47. Checks cover route call not executed', /route_call_not_executed/.test(source.closeoutModule));
check('48. Checks cover env read not executed', /env_read_not_executed/.test(source.closeoutModule));
check('49. Checks cover market data not reported', /market_data_not_reported/.test(source.closeoutModule));
check('50. Checks cover raw provider payload not reported', /raw_provider_payload_not_reported/.test(source.closeoutModule));
check('51. Checks cover credential echo not reported', /credential_echo_not_reported/.test(source.closeoutModule));
check('52. Checks cover owner approval required for next phase', /owner_approval_required_for_next_phase/.test(source.closeoutModule));
check('53. Checks cover manual smoke requires separate command', /manual_smoke_requires_separate_command/.test(source.closeoutModule));
process.stdout.write('\n');

process.stdout.write('Closeout report:\n');
check('54. Report builder exists', /export const buildOwnerLocalSmokeCloseoutReport/.test(source.closeoutModule));
check('55. Report status closed_without_execution', /status:\s*['"]closed_without_execution['"]/.test(source.closeoutModule));
check('56. Report smokeExecuted false', /smokeExecuted:\s*false/.test(source.closeoutModule));
check('57. Report harnessStatus disabled', /harnessStatus:\s*['"]disabled['"]/.test(source.closeoutModule));
check('58. Report routeStatus feature_disabled', /routeStatus:\s*['"]feature_disabled['"]/.test(source.closeoutModule));
check('59. Report source owner-local', /source:\s*['"]owner-local['"]/.test(source.closeoutModule));
check('60. Report nextAllowedPhase 3FA-D-MANUAL-RUN', /nextAllowedPhase:\s*['"]3FA-D-MANUAL-RUN['"]/.test(source.closeoutModule));
process.stdout.write('\n');

process.stdout.write('Closeout result and helpers:\n');
check('61. Result builder exists', /export const buildSimilarityOwnerLocalSmokeCloseoutResult/.test(source.closeoutModule));
check('62. isOwnerLocalManualSmokeExecutionClosed helper exists', /export const isOwnerLocalManualSmokeExecutionClosed/.test(source.closeoutModule));
check('63. isOwnerLocalManualSmokeReadyForSeparateApproval helper exists', /export const isOwnerLocalManualSmokeReadyForSeparateApproval/.test(source.closeoutModule));
const resultFunctionMatch = closeoutModuleCode.match(
  /export const buildSimilarityOwnerLocalSmokeCloseoutResult[\s\S]*?\n};/,
);
const resultFunctionSource = resultFunctionMatch ? resultFunctionMatch[0] : closeoutModuleCode;
check('64. Result builder never returns a live success top-level status literal',
  Boolean(resultFunctionMatch) && !/\bstatus:\s*['"](pass|success|live)['"]/.test(resultFunctionSource));
process.stdout.write('\n');

process.stdout.write('Mocked closeout fixtures:\n');
check('65. Mocked policy fixture exists', /export const buildMockedOwnerLocalSmokeCloseoutPolicy/.test(source.closeoutFixtures));
check('66. Mocked checks fixture exists', /export const buildMockedOwnerLocalSmokeCloseoutChecks/.test(source.closeoutFixtures));
check('67. Mocked report fixture exists', /export const buildMockedOwnerLocalSmokeCloseoutReport/.test(source.closeoutFixtures));
check('68. Mocked result fixture exists', /export const buildMockedOwnerLocalSmokeCloseoutResult\b/.test(source.closeoutFixtures));
check('69. Mocked blocked result fixture exists', /export const buildMockedOwnerLocalSmokeCloseoutBlockedResult/.test(source.closeoutFixtures));
process.stdout.write('\n');

process.stdout.write('Smoke script content:\n');
check('70. Smoke script imports the real closeout module', /similarityOwnerLocalSmokeCloseout\.ts/.test(smokeScriptCode));
check('71. Smoke script does not call KIS', !KIS_CALL_PATTERN.test(smokeScriptCode));
check('72. Smoke script does not import KIS provider/client', !KIS_IMPORT_PATTERN.test(smokeScriptCode));
check('73. Smoke script does not import the real similarity engine', !REAL_ENGINE_IMPORT_PATTERN.test(smokeScriptCode));
check('74. Smoke script guards against env access', /process\.env\s*=\s*new Proxy/.test(smokeScriptCode));
check('75. Smoke script blocks/avoids network calls', /globalThis\.fetch\s*=/.test(smokeScriptCode));
check('76. Smoke script does not call the API route', !/\/api\/chart-ai\/similarity/.test(smokeScriptCode));
check('77. Smoke script asserts the default policy is disabled', /enabled\s*===\s*false/.test(smokeScriptCode));
check('78. Smoke script asserts liveSmokeExecuted false', /liveSmokeExecuted\s*===\s*false/.test(smokeScriptCode));
check('79. Smoke script asserts no prohibited fields in serialized output',
  /USER_STATE_FIELD_PATTERN/.test(smokeScriptCode) && /MARKET_DATA_FIELD_PATTERN/.test(smokeScriptCode));
process.stdout.write('\n');

process.stdout.write('Closeout module safety:\n');
check('80. Closeout module does not import KIS provider/client', !KIS_IMPORT_PATTERN.test(closeoutModuleCode));
check('81. Closeout module does not call KIS', !KIS_CALL_PATTERN.test(closeoutModuleCode));
check('82. Closeout module does not import the real similarity engine', !REAL_ENGINE_IMPORT_PATTERN.test(closeoutModuleCode));
check('83. Closeout module does not call the real similarity engine', !REAL_ENGINE_CALL_PATTERN.test(closeoutModuleCode));
check('84. Closeout module does not import auth provider', !AUTH_PROVIDER_IMPORT_PATTERN.test(closeoutModuleCode));
check('85. Closeout module does not import Supabase', !SUPABASE_IMPORT_PATTERN.test(closeoutModuleCode));
check('86. Closeout module does not import DB/cache provider', !DB_CACHE_IMPORT_PATTERN.test(closeoutModuleCode));
check('87. Closeout module does not call fetch', !/\bfetch\(/.test(closeoutModuleCode));
check('88. Closeout module does not read process.env', !/process\.env(\.\w|\[)/.test(closeoutModuleCode));
check('89. Closeout module does not read .env',
  !/readFileSync\([^)]*\.env/.test(closeoutModuleCode) && !/require\(['"]dotenv['"]\)/.test(closeoutModuleCode));
check('90. Closeout module does not read cookies', !COOKIE_PATTERN.test(closeoutModuleCode));
check('91. Closeout module does not read headers', !HEADER_PATTERN.test(closeoutModuleCode));
check('92. Closeout module does not read localStorage/sessionStorage', !STORAGE_ACCESS_PATTERN.test(closeoutModuleCode));
check('93. Closeout module does not use Date.now or the current runtime date', !DATE_NOW_PATTERN.test(closeoutModuleCode));
process.stdout.write('\n');

process.stdout.write('Route, UI, and engine unchanged:\n');
check('94. API route file is unchanged from starting commit', routeUnchanged);
check('95. /chart-ai UI file is unchanged from starting commit', chartAiUiUnchanged);
check('96. Deterministic similarity engine files are unchanged from starting commit', engineFilesUnchanged);
process.stdout.write('\n');

process.stdout.write('Result document preserved-boundary records:\n');
check('97. Docs record closeout without live execution', /closed.{0,20}without.{0,20}execution|not executed/i.test(docScanText));
check('98. Docs record no KIS call', /no kis call/i.test(source.result));
check('99. Docs record no live similarity execution', /no live similarity execution/i.test(source.result));
check('100. Docs record no route call', /no (api )?route call/i.test(source.result));
check('101. Docs record route success remains disabled', /route success remains disabled|route (success )?remains feature.disabled/i.test(docScanText));
check('102. Docs record no public/beta execution', /no public.{0,10}beta execution|no public or beta execution/i.test(docScanText));
check('103. Docs record no market values in reports', /no actual market value/i.test(source.result));
check('104. Docs record no auth/storage implementation', /no real auth runtime or usage storage implementation|no real auth|no usage storage/i.test(source.result));
check('105. Docs record no DB/cache runtime', /no db.{0,10}cache runtime/i.test(source.result));
check('106. Docs record no SQL/migration', /no sql file or migration/i.test(source.result));
check('107. Docs record no deployment', /no deployment/i.test(source.result));
check('108. Docs record no push', /no push/i.test(source.result));
check('109. Docs record separate owner approval required', /separate.{0,20}owner approval/i.test(docScanText));
check('110. Docs record next phase', /next phase/i.test(phaseSection) || /roadmap/i.test(source.result));
process.stdout.write('\n');

process.stdout.write('Forbidden changed paths:\n');
check('111. No src/pages files changed', !pagesChanged);
check('112. No src/pages/api files changed', !apiChanged);
check('113. No src/lib/server/providers files changed', !serverProvidersChanged);
check('114. No src/lib/chartSimilarity files changed', !engineDirChanged);
check('115. No src/data/chartSimilarity files changed', !dataDirChanged);
check('116. No Supabase/migration/SQL files added', !supabaseOrMigrationAdded);
check('117. No Vercel files changed', !vercelChanged);
check('118. No dependency changes', dependenciesUnchanged);
check('119. No devDependency changes', devDependenciesUnchanged);
check('120. No image files added', addedImages.length === 0);
process.stdout.write('\n');

process.stdout.write('Forbidden content patterns:\n');
check('121. Source contains no source=live', !/source\s*=\s*['"]?live/i.test(closeoutAllSourceRaw));
check('122. Source contains no source=auto', !/source\s*=\s*['"]?auto/i.test(closeoutAllSourceRaw));
check('123. Source contains no external AI keywords', !EXTERNAL_AI_PATTERN.test(closeoutAllSourceRaw));
check('124. Source contains no raw KIS response fields', !RAW_FIELDS.test(docScanText));
check('125. Source contains no secret-looking values', !SECRET_VALUE(docScanText));
process.stdout.write('\n');

process.stdout.write('Network and scope safety:\n');
check('126. Checker blocks network access',
  source.checker.includes(
    'Network access is blocked in the Phase 3FA-D owner local manual smoke execution closeout checker.',
  ) && !fetchAttempted);
check('127. Allowed changed files only', unexpectedChanges.length === 0);
process.stdout.write('\n');

process.stdout.write(`Checks passed: ${passed}/${passed + failed}\n`);
if (failed > 0) {
  process.stdout.write(`Failures: ${failures.join('; ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('All Phase 3FA-D checks passed.\n');
}
