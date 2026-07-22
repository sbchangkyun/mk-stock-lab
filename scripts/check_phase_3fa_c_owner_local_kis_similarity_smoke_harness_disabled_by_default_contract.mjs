/**
 * Phase 3FA-C documentation and source contract.
 * Owner-local KIS similarity smoke harness, disabled by default.
 * Static only: no network, browser, dev server, API, provider, live KIS, external AI, or environment access.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error(
    'Network access is blocked in the Phase 3FA-C owner local kis similarity smoke harness checker.',
  );
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = process.cwd();
const startingCommit = 'e90d1b3';

const paths = {
  planning: 'docs/planning/phase_3fa_c_owner_local_kis_similarity_smoke_harness_disabled_by_default_v0.1.md',
  result: 'docs/planning/phase_3fa_c_owner_local_kis_similarity_smoke_harness_disabled_by_default_result_v0.1.md',
  changelog: 'docs/planning/planning_changelog.md',
  checker: 'scripts/check_phase_3fa_c_owner_local_kis_similarity_smoke_harness_disabled_by_default_contract.mjs',
  smoke: 'scripts/smoke_phase_3fa_c_owner_local_kis_similarity_smoke_harness_disabled_by_default.mjs',
  package: 'package.json',
  route: 'src/pages/api/chart-ai/similarity.ts',
  chartAiUi: 'src/pages/chart-ai.astro',
  engineTypes: 'src/lib/chartSimilarity/types.ts',
  engineIndex: 'src/lib/chartSimilarity/index.ts',
  engineScanner: 'src/lib/chartSimilarity/similarityScanner.ts',
  harnessTypes: 'src/lib/server/chartSimilarity/similarityOwnerLocalSmokeHarnessTypes.ts',
  harnessModule: 'src/lib/server/chartSimilarity/similarityOwnerLocalSmokeHarness.ts',
  harnessFixtures: 'src/lib/server/chartSimilarity/mockedSimilarityOwnerLocalSmokeHarnessFixtures.ts',
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
const phaseSection = source.changelog.split('## Phase 3FA-C - 2026-07-04')[1]?.split('\n## ')[0] ?? '';
const docScanText = `${source.planning}\n${source.result}\n${phaseSection}`;

const harnessTypesCode = stripComments(source.harnessTypes);
const harnessModuleCode = stripComments(source.harnessModule);
const harnessFixturesCode = stripComments(source.harnessFixtures);
const smokeScriptCode = stripComments(source.smoke);
const harnessAllSourceRaw = [source.harnessTypes, source.harnessModule, source.harnessFixtures].join('\n');

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

process.stdout.write('=== Phase 3FA-C Owner-local KIS Similarity Smoke Harness, Disabled by Default ===\n\n');

process.stdout.write('Files, checker, smoke, package, changelog:\n');
check('1. Planning document exists', existsSync(join(root, paths.planning)));
check('2. Result document exists', existsSync(join(root, paths.result)));
check('3. Checker exists', existsSync(join(root, paths.checker)));
check('4. Smoke script exists', existsSync(join(root, paths.smoke)));
check('5. Package checker script exists',
  packageJson.scripts?.['check:phase-3fa-c-owner-local-kis-similarity-smoke-harness-disabled-by-default'] ===
    'node scripts/check_phase_3fa_c_owner_local_kis_similarity_smoke_harness_disabled_by_default_contract.mjs');
check('6. Package smoke script exists',
  packageJson.scripts?.['smoke:phase-3fa-c-owner-local-kis-similarity-smoke-harness-disabled-by-default'] ===
    'node scripts/smoke_phase_3fa_c_owner_local_kis_similarity_smoke_harness_disabled_by_default.mjs');
check('7. Changelog contains Phase 3FA-C', phaseSection.length > 0);
process.stdout.write('\n');

process.stdout.write('Harness files present:\n');
check('8. Harness types file exists', existsSync(join(root, paths.harnessTypes)));
check('9. Harness module exists', existsSync(join(root, paths.harnessModule)));
check('10. Mocked harness fixtures file exists', existsSync(join(root, paths.harnessFixtures)));
check('11. Server index exports harness symbols',
  /SimilarityOwnerLocalSmokeHarnessResult/.test(source.index) &&
  /runOwnerLocalSmokeHarnessDisabled/.test(source.index) &&
  /buildMockedOwnerLocalSmokeHarnessResult/.test(source.index));
process.stdout.write('\n');

process.stdout.write('Harness type shape:\n');
check('12. Types include SimilarityOwnerLocalSmokeHarnessStatus', /SimilarityOwnerLocalSmokeHarnessStatus/.test(source.harnessTypes));
check('13. Types include SimilarityOwnerLocalSmokeHarnessMode', /SimilarityOwnerLocalSmokeHarnessMode/.test(source.harnessTypes));
check('14. Types include SimilarityOwnerLocalSmokeHarnessStep', /SimilarityOwnerLocalSmokeHarnessStep/.test(source.harnessTypes));
check('15. Types include SimilarityOwnerLocalSmokeHarnessCheck', /SimilarityOwnerLocalSmokeHarnessCheck/.test(source.harnessTypes));
check('16. Types include SimilarityOwnerLocalSmokeHarnessPolicy', /SimilarityOwnerLocalSmokeHarnessPolicy/.test(source.harnessTypes));
check('17. Types include SimilarityOwnerLocalSmokeHarnessReport', /SimilarityOwnerLocalSmokeHarnessReport/.test(source.harnessTypes));
check('18. Types include SimilarityOwnerLocalSmokeHarnessResult', /SimilarityOwnerLocalSmokeHarnessResult/.test(source.harnessTypes));
process.stdout.write('\n');

process.stdout.write('Harness type exclusions:\n');
check('19. Types exclude raw KIS fields', !RAW_FIELDS.test(harnessTypesCode));
check('20. Types exclude actual price/volume fields', !ACTUAL_PRICE_VOLUME_PATTERN.test(harnessTypesCode));
check('21. Types exclude market timestamps', !MARKET_TIMESTAMP_PATTERN.test(harnessTypesCode));
check('22. Types exclude similarity score/return fields from real data', !SIMILARITY_SCORE_RETURN_PATTERN.test(harnessTypesCode));
check('23. Types exclude KIS credential fields', !KIS_CREDENTIAL_PATTERN.test(harnessTypesCode));
check('24. Types exclude account/trading fields', !ACCOUNT_TRADING_PATTERN.test(harnessTypesCode));
check('25. Types exclude token/email/IP/cookies/headers', !TOKEN_EMAIL_IP_COOKIE_HEADER_PATTERN.test(harnessTypesCode));
check('26. Types exclude DB connection strings', !DB_CONNECTION_PATTERN.test(harnessTypesCode));
check('27. Types exclude SQL strings', !SQL_PATTERN.test(harnessTypesCode));
process.stdout.write('\n');

process.stdout.write('Default harness policy:\n');
check('28. Default policy builder exists', /export const buildDefaultSimilarityOwnerLocalSmokeHarnessPolicy/.test(source.harnessModule));
check('29. Default policy enabled false', /enabled:\s*false/.test(source.harnessModule));
check('30. Default policy mode disabled_harness', /mode:\s*['"]disabled_harness['"]/.test(source.harnessModule));
check('31. Default policy ownerLocalOnly true', /ownerLocalOnly:\s*true/.test(source.harnessModule));
check('32. Default policy manualExecutionOnly true', /manualExecutionOnly:\s*true/.test(source.harnessModule));
check('33. Default policy allowKisProviderCall false', /allowKisProviderCall:\s*false/.test(source.harnessModule));
check('34. Default policy allowSimilarityEngineRun false', /allowSimilarityEngineRun:\s*false/.test(source.harnessModule));
check('35. Default policy allowRouteSuccess false', /allowRouteSuccess:\s*false/.test(source.harnessModule));
check('36. Default policy allowMarketDataInReport false', /allowMarketDataInReport:\s*false/.test(source.harnessModule));
check('37. Default policy allowRawProviderPayload false', /allowRawProviderPayload:\s*false/.test(source.harnessModule));
check('38. Default policy allowEnvRead false', /allowEnvRead:\s*false/.test(source.harnessModule));
check('39. Default policy allowCredentialEcho false', /allowCredentialEcho:\s*false/.test(source.harnessModule));
check('40. Default policy requireOwnerApprovalBeforeLiveSmoke true', /requireOwnerApprovalBeforeLiveSmoke:\s*true/.test(source.harnessModule));
check('41. Default policy requireSeparateHarnessEnableApproval true', /requireSeparateHarnessEnableApproval:\s*true/.test(source.harnessModule));
process.stdout.write('\n');

process.stdout.write('Harness steps:\n');
check('42. Steps builder exists', /export const buildOwnerLocalSmokeHarnessSteps/.test(source.harnessModule));
check('43. Steps include load_smoke_plan', /'load_smoke_plan'/.test(source.harnessModule));
check('44. Steps include check_harness_policy', /'check_harness_policy'/.test(source.harnessModule));
check('45. Steps include verify_route_remains_disabled', /'verify_route_remains_disabled'/.test(source.harnessModule));
check('46. Steps include verify_redaction_policy', /'verify_redaction_policy'/.test(source.harnessModule));
check('47. Steps include verify_no_live_provider', /'verify_no_live_provider'/.test(source.harnessModule));
check('48. Steps include verify_no_live_engine', /'verify_no_live_engine'/.test(source.harnessModule));
check('49. Steps include build_safe_blocked_report', /'build_safe_blocked_report'/.test(source.harnessModule));
process.stdout.write('\n');

process.stdout.write('Harness checks:\n');
check('50. Checks builder exists', /export const buildOwnerLocalSmokeHarnessChecks/.test(source.harnessModule));
check('51. Checks cover smoke plan loaded', /smoke_plan_loaded/.test(source.harnessModule));
check('52. Checks cover harness disabled by default', /harness_disabled_by_default/.test(source.harnessModule));
check('53. Checks cover route success disabled', /route_success_disabled/.test(source.harnessModule));
check('54. Checks cover KIS provider call disabled', /kis_provider_call_disabled/.test(source.harnessModule));
check('55. Checks cover similarity engine run disabled', /similarity_engine_run_disabled/.test(source.harnessModule));
check('56. Checks cover market data in report disabled', /market_data_in_report_disabled/.test(source.harnessModule));
check('57. Checks cover raw provider payload disabled', /raw_provider_payload_disabled/.test(source.harnessModule));
check('58. Checks cover env read disabled', /env_read_disabled/.test(source.harnessModule));
check('59. Checks cover credential echo disabled', /credential_echo_disabled/.test(source.harnessModule));
check('60. Checks cover separate owner approval required', /separate_owner_approval_required/.test(source.harnessModule));
process.stdout.write('\n');

process.stdout.write('Blocked report:\n');
check('61. Blocked report builder exists', /export const buildOwnerLocalSmokeHarnessBlockedReport/.test(source.harnessModule));
check('62. Blocked report status blocked', /status:\s*['"]blocked['"]/.test(source.harnessModule));
check('63. Blocked report smokeId is owner-local-kis-similarity-disabled-harness',
  /smokeId:\s*['"]owner-local-kis-similarity-disabled-harness['"]/.test(source.harnessModule));
check('64. Blocked report providerProbe/normalizationCheck/engineContractCheck are not_run',
  /providerProbe:\s*['"]not_run['"]/.test(source.harnessModule) &&
  /normalizationCheck:\s*['"]not_run['"]/.test(source.harnessModule) &&
  /engineContractCheck:\s*['"]not_run['"]/.test(source.harnessModule));
check('65. Blocked report responseRedactionCheck is pass', /responseRedactionCheck:\s*['"]pass['"]/.test(source.harnessModule));
check('66. Blocked report executedBy disabled-harness and source owner-local',
  /executedBy:\s*['"]disabled-harness['"]/.test(source.harnessModule) &&
  /source:\s*['"]owner-local['"]/.test(source.harnessModule));
process.stdout.write('\n');

process.stdout.write('Disabled harness runner:\n');
check('67. Disabled harness runner exists', /export const runOwnerLocalSmokeHarnessDisabled/.test(source.harnessModule));
const runnerFunctionMatch = harnessModuleCode.match(
  /export const runOwnerLocalSmokeHarnessDisabled[\s\S]*?\n};/,
);
const runnerFunctionSource = runnerFunctionMatch ? runnerFunctionMatch[0] : harnessModuleCode;
check('68. Disabled harness runner never returns a pass/success top-level status literal',
  Boolean(runnerFunctionMatch) && !/\bstatus:\s*['"]pass['"]/.test(runnerFunctionSource));
process.stdout.write('\n');

process.stdout.write('Enabled helper:\n');
check('69. Enabled helper exists', /export const isOwnerLocalSmokeHarnessEnabled/.test(source.harnessModule));
check('70. Enabled helper requires policy.enabled and every execution permission true',
  /policy\.enabled/.test(harnessModuleCode) &&
  /policy\.allowKisProviderCall/.test(harnessModuleCode) &&
  /policy\.allowSimilarityEngineRun/.test(harnessModuleCode) &&
  /policy\.allowRouteSuccess/.test(harnessModuleCode));
process.stdout.write('\n');

process.stdout.write('Mocked harness fixtures:\n');
check('71. Mocked policy fixture exists', /export const buildMockedOwnerLocalSmokeHarnessPolicy/.test(source.harnessFixtures));
check('72. Mocked steps fixture exists', /export const buildMockedOwnerLocalSmokeHarnessSteps/.test(source.harnessFixtures));
check('73. Mocked checks fixture exists', /export const buildMockedOwnerLocalSmokeHarnessChecks/.test(source.harnessFixtures));
check('74. Mocked blocked report fixture exists', /export const buildMockedOwnerLocalSmokeHarnessBlockedReport/.test(source.harnessFixtures));
check('75. Mocked harness result fixture exists', /export const buildMockedOwnerLocalSmokeHarnessResult/.test(source.harnessFixtures));
process.stdout.write('\n');

process.stdout.write('Smoke script content:\n');
check('76. Smoke script imports the real harness module', /similarityOwnerLocalSmokeHarness\.ts/.test(smokeScriptCode));
check('77. Smoke script does not call KIS', !KIS_CALL_PATTERN.test(smokeScriptCode));
check('78. Smoke script does not import KIS provider/client', !KIS_IMPORT_PATTERN.test(smokeScriptCode));
check('79. Smoke script does not import the real similarity engine', !REAL_ENGINE_IMPORT_PATTERN.test(smokeScriptCode));
check('80. Smoke script guards against env access', /process\.env\s*=\s*new Proxy/.test(smokeScriptCode));
check('81. Smoke script blocks/avoids network calls', /globalThis\.fetch\s*=/.test(smokeScriptCode));
check('82. Smoke script does not call the API route', !/\/api\/chart-ai\/similarity/.test(smokeScriptCode));
check('83. Smoke script asserts the default policy is disabled', /enabled\s*===\s*false/.test(smokeScriptCode));
check('84. Smoke script asserts blocked/not_run outcomes',
  /\['disabled',\s*'blocked'\]/.test(smokeScriptCode) || /'blocked'/.test(smokeScriptCode));
check('85. Smoke script asserts no prohibited fields in serialized output',
  /USER_STATE_FIELD_PATTERN/.test(smokeScriptCode) && /MARKET_DATA_FIELD_PATTERN/.test(smokeScriptCode));
process.stdout.write('\n');

process.stdout.write('Harness module safety:\n');
check('86. Harness module does not import KIS provider/client', !KIS_IMPORT_PATTERN.test(harnessModuleCode));
check('87. Harness module does not call KIS', !KIS_CALL_PATTERN.test(harnessModuleCode));
check('88. Harness module does not import the real similarity engine', !REAL_ENGINE_IMPORT_PATTERN.test(harnessModuleCode));
check('89. Harness module does not call the real similarity engine', !REAL_ENGINE_CALL_PATTERN.test(harnessModuleCode));
check('90. Harness module does not import auth provider', !AUTH_PROVIDER_IMPORT_PATTERN.test(harnessModuleCode));
check('91. Harness module does not import Supabase', !SUPABASE_IMPORT_PATTERN.test(harnessModuleCode));
check('92. Harness module does not import DB/cache provider', !DB_CACHE_IMPORT_PATTERN.test(harnessModuleCode));
check('93. Harness module does not call fetch', !/\bfetch\(/.test(harnessModuleCode));
check('94. Harness module does not read process.env', !/process\.env(\.\w|\[)/.test(harnessModuleCode));
check('95. Harness module does not read .env',
  !/readFileSync\([^)]*\.env/.test(harnessModuleCode) && !/require\(['"]dotenv['"]\)/.test(harnessModuleCode));
check('96. Harness module does not read cookies', !COOKIE_PATTERN.test(harnessModuleCode));
check('97. Harness module does not read headers', !HEADER_PATTERN.test(harnessModuleCode));
check('98. Harness module does not read localStorage/sessionStorage', !STORAGE_ACCESS_PATTERN.test(harnessModuleCode));
check('99. Harness module does not use Date.now or the current runtime date', !DATE_NOW_PATTERN.test(harnessModuleCode));
process.stdout.write('\n');

process.stdout.write('Route, UI, and engine unchanged:\n');
check('100. API route file is unchanged from starting commit', routeUnchanged);
check('101. /chart-ai UI file is unchanged from starting commit', chartAiUiUnchanged);
check('102. Deterministic similarity engine files are unchanged from starting commit', engineFilesUnchanged);
process.stdout.write('\n');

process.stdout.write('Result document preserved-boundary records:\n');
check('103. Docs record disabled harness only', /disabled.{0,20}harness/i.test(docScanText));
check('104. Docs record no KIS call', /no kis call/i.test(source.result));
check('105. Docs record no live similarity execution', /no live similarity execution/i.test(source.result));
check('106. Docs record no route change', /no api route change|no route change/i.test(source.result));
check('107. Docs record route success remains disabled', /route success remains disabled|route success disabled/i.test(docScanText));
check('108. Docs record no public/beta execution', /no public.{0,10}beta execution|no public or beta execution/i.test(docScanText));
check('109. Docs record no market values in reports', /no actual market value/i.test(source.result));
check('110. Docs record no auth/storage implementation', /no real auth runtime or usage storage implementation/i.test(source.result));
check('111. Docs record no DB/cache runtime', /no db.{0,10}cache runtime/i.test(source.result));
check('112. Docs record no SQL/migration', /no sql file or migration/i.test(source.result));
check('113. Docs record no deployment', /no deployment/i.test(source.result));
check('114. Docs record no push', /no push/i.test(source.result));
check('115. Docs record next phase', /next phase/i.test(phaseSection) || /roadmap/i.test(source.result));
process.stdout.write('\n');

process.stdout.write('Forbidden changed paths:\n');
check('116. No src/pages files changed', !pagesChanged);
check('117. No src/pages/api files changed', !apiChanged);
check('118. No src/lib/server/providers files changed', !serverProvidersChanged);
check('119. No src/lib/chartSimilarity files changed', !engineDirChanged);
check('120. No src/data/chartSimilarity files changed', !dataDirChanged);
check('121. No Supabase/migration/SQL files added', !supabaseOrMigrationAdded);
check('122. No Vercel files changed', !vercelChanged);
process.stdout.write('\n');

process.stdout.write('Dependency and image safety:\n');
check('123. No dependency changes', dependenciesUnchanged);
check('124. No devDependency changes', devDependenciesUnchanged);
check('125. No image files added', addedImages.length === 0);
process.stdout.write('\n');

process.stdout.write('Forbidden content patterns:\n');
check('126. Source contains no source=live', !/source\s*=\s*['"]?live/i.test(harnessAllSourceRaw));
check('127. Source contains no source=auto', !/source\s*=\s*['"]?auto/i.test(harnessAllSourceRaw));
check('128. Source contains no external AI keywords', !EXTERNAL_AI_PATTERN.test(harnessAllSourceRaw));
check('129. Source contains no raw KIS response fields', !RAW_FIELDS.test(docScanText));
check('130. Source contains no secret-looking values', !SECRET_VALUE(docScanText));
process.stdout.write('\n');

process.stdout.write('Network and scope safety:\n');
check('131. Checker blocks network access',
  source.checker.includes(
    'Network access is blocked in the Phase 3FA-C owner local kis similarity smoke harness checker.',
  ) && !fetchAttempted);
check('132. Allowed changed files only', unexpectedChanges.length === 0);
process.stdout.write('\n');

process.stdout.write(`Checks passed: ${passed}/${passed + failed}\n`);
if (failed > 0) {
  process.stdout.write(`Failures: ${failures.join('; ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('All Phase 3FA-C checks passed.\n');
}
