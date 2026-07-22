/**
 * Phase 3FA-D-MANUAL-RUN-HF1 documentation and source contract.
 * Owner-local KIS credential configuration check, no secret echo.
 * Static only: no network, browser, dev server, API, provider, live KIS, external AI, or environment access.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error(
    'Network access is blocked in the Phase 3FA-D-MANUAL-RUN-HF1 kis credential configuration check checker.',
  );
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = process.cwd();
const startingCommit = '4f9eff0';

const paths = {
  planning: 'docs/planning/phase_3fa_d_manual_run_hf1_kis_credential_configuration_check_v0.1.md',
  result: 'docs/planning/phase_3fa_d_manual_run_hf1_kis_credential_configuration_check_result_v0.1.md',
  changelog: 'docs/planning/planning_changelog.md',
  checker: 'scripts/check_phase_3fa_d_manual_run_hf1_kis_credential_configuration_check_contract.mjs',
  smoke: 'scripts/smoke_phase_3fa_d_manual_run_hf1_kis_credential_configuration_check.mjs',
  package: 'package.json',
  route: 'src/pages/api/chart-ai/similarity.ts',
  chartAiUi: 'src/pages/chart-ai.astro',
  engineTypes: 'src/lib/chartSimilarity/types.ts',
  engineIndex: 'src/lib/chartSimilarity/index.ts',
  engineScanner: 'src/lib/chartSimilarity/similarityScanner.ts',
  kisOwnerLocalClient: 'src/lib/server/providers/kis/kisOwnerLocalOhlcClient.ts',
  manualRunTypes: 'src/lib/server/chartSimilarity/similarityOwnerLocalManualRunTypes.ts',
  manualRunModule: 'src/lib/server/chartSimilarity/similarityOwnerLocalManualRun.ts',
  manualRunFixtures: 'src/lib/server/chartSimilarity/mockedSimilarityOwnerLocalManualRunFixtures.ts',
  credentialCheckTypes: 'src/lib/server/chartSimilarity/similarityOwnerLocalCredentialCheckTypes.ts',
  credentialCheckModule: 'src/lib/server/chartSimilarity/similarityOwnerLocalCredentialCheck.ts',
  credentialCheckFixtures: 'src/lib/server/chartSimilarity/mockedSimilarityOwnerLocalCredentialCheckFixtures.ts',
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
const phaseSection = source.changelog.split('## Phase 3FA-D-MANUAL-RUN-HF1 - 2026-07-04')[1]?.split('\n## ')[0] ?? '';
const docScanText = `${source.planning}\n${source.result}\n${phaseSection}`;

// Strips known-safe policy/type field identifiers (which legitimately contain substrings like
// "EnvEcho" or "CredentialPersistence" as part of an `allow...: false` flag name) before running
// exclusion scans, so a safe field declaration can never trip a forbidden-content check.
const stripSafeFieldNames = (text) =>
  text.replace(
    /\b(allowEnvValueEcho|allowValueLengthEcho|allowValuePrefixSuffixEcho|allowValueHashEcho|allowKisCall|allowRouteCall|allowCredentialPersistence|allowProcessEnvPresenceCheck|allowDotenvRead)\b/g,
    '',
  );

const credentialCheckTypesCode = stripSafeFieldNames(stripComments(source.credentialCheckTypes));
const credentialCheckModuleCode = stripSafeFieldNames(stripComments(source.credentialCheckModule));
const credentialCheckFixturesCode = stripComments(source.credentialCheckFixtures);
const smokeScriptCode = stripComments(source.smoke);
const credentialCheckAllSourceRaw = [
  source.credentialCheckTypes,
  source.credentialCheckModule,
  source.credentialCheckFixtures,
].join('\n');

const normalizeLineEndings = (text) => text.replace(/\r\n/g, '\n');
const gitShowTrimmed = (path) => normalizeLineEndings(git('show', `${startingCommit}:${path}`)).trim();
const currentTrimmed = (text) => normalizeLineEndings(text).trim();

const routeUnchanged = currentTrimmed(source.route) === gitShowTrimmed(paths.route);
const chartAiUiUnchanged = currentTrimmed(source.chartAiUi) === gitShowTrimmed(paths.chartAiUi);
const engineTypesUnchanged = currentTrimmed(source.engineTypes) === gitShowTrimmed(paths.engineTypes);
const engineIndexUnchanged = currentTrimmed(source.engineIndex) === gitShowTrimmed(paths.engineIndex);
const engineScannerUnchanged = currentTrimmed(source.engineScanner) === gitShowTrimmed(paths.engineScanner);
const engineFilesUnchanged = engineTypesUnchanged && engineIndexUnchanged && engineScannerUnchanged;
const kisOwnerLocalClientUnchanged = currentTrimmed(source.kisOwnerLocalClient) === gitShowTrimmed(paths.kisOwnerLocalClient);
const manualRunTypesUnchanged = currentTrimmed(source.manualRunTypes) === gitShowTrimmed(paths.manualRunTypes);
const manualRunModuleUnchanged = currentTrimmed(source.manualRunModule) === gitShowTrimmed(paths.manualRunModule);
const manualRunFixturesUnchanged = currentTrimmed(source.manualRunFixtures) === gitShowTrimmed(paths.manualRunFixtures);
const manualRunFilesUnchanged = manualRunTypesUnchanged && manualRunModuleUnchanged && manualRunFixturesUnchanged;

const phaseChanges = new Set(git('diff', '--name-only', startingCommit).split(/\r?\n/).filter(Boolean));
const addedFiles = git('diff', '--name-only', '--diff-filter=A', startingCommit).split(/\r?\n/).filter(Boolean);
const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif', '.bmp']);
const addedImages = addedFiles.filter((path) => imageExtensions.has(extname(path).toLowerCase()));
const dependenciesUnchanged = JSON.stringify(packageJson.dependencies ?? {}) === JSON.stringify(baselinePackage.dependencies ?? {});
const devDependenciesUnchanged = JSON.stringify(packageJson.devDependencies ?? {}) === JSON.stringify(baselinePackage.devDependencies ?? {});

const CREDENTIAL_VALUE_PATTERN =
  /"(appKey|appSecret|app_key|app_secret|accessToken|access_token|authorization|password)"\s*:\s*"[^"]{4,}"/i;
const KIS_ENV_VALUE_PATTERN = /"(KIS_APP_KEY|KIS_APP_SECRET|KIS_BASE_URL|KIS_ACCESS_TOKEN)"\s*:\s*"[^"]{4,}"/;
const BEARER_PATTERN = /Bearer\s+[A-Za-z0-9._-]{8,}/i;
const RAW_KIS_FIELD_PATTERN =
  /"(stck_prpr|stck_oprc|stck_hgpr|stck_lwpr|stck_clpr|stck_bsop_date|rt_cd|acml_vol|hts_kor_isnm)"/i;
const ACCOUNT_TRADING_PATTERN = /"(account|accountNo|accountNumber|trading|order|orderId|balance)"\s*:/i;
const MARKET_VALUE_PATTERN =
  /"(open|high|low|close|volume|price|date|dateTime|timestamp|bsopDate|similarityScore|score|return|returns)"\s*:\s*-?\d/i;
const DB_CONNECTION_PATTERN = /connectionString|DATABASE_URL|postgres:\/\/|mysql:\/\//i;
const SQL_PATTERN = /SELECT\s|INSERT\s|UPDATE\s|DELETE\s|CREATE TABLE/i;
const EXTERNAL_AI_PATTERN = /openai|anthropic|claude|gemini|gpt-\d|langchain/i;
const KIS_IMPORT_PATTERN = /(from\s+['"][^'"]*\/providers\/kis[^'"]*['"])|(from\s+['"][^'"]*kisClient['"])|(require\(\s*['"][^'"]*\/providers\/kis[^'"]*['"]\s*\))/i;
const KIS_LIVE_CALL_PATTERN = /getKisDomesticDailyOhlcSeries\(|getKisAccessToken\(|runOwnerLocalKisOhlcSmoke\(/i;
const SUPABASE_IMPORT_PATTERN = /from\s+['"][^'"]*supabase[^'"]*['"]/i;
const AUTH_PROVIDER_IMPORT_PATTERN = /from\s+['"][^'"]*(auth0|next-auth|nextauth|clerk|firebase|passport|oauth)[^'"]*['"]/i;
const VERCEL_FILE_PATTERN = /(^|\/)vercel\.(json|ts)$|(^|\/)\.vercel\//i;
const COOKIE_PATTERN = /document\.cookie|req\.cookies|request\.cookies|\.cookies\b/i;
const HEADER_PATTERN = /req\.headers|request\.headers|getHeader\(|Astro\.request\.headers|\.headers\.get\(/i;
const STORAGE_ACCESS_PATTERN = /localStorage\.|sessionStorage\./;
const DB_CACHE_IMPORT_PATTERN = /from\s+['"][^'"]*(supabase|redis|upstash|postgres|prisma|drizzle|mongodb|turso)[^'"]*['"]/i;
const REAL_ENGINE_IMPORT_PATTERN = /from\s+['"][^'"]*\/lib\/chartSimilarity\//i;
const REAL_ENGINE_CALL_PATTERN = /similarityScanner\(|scanForSimilarPatterns\(/i;
const DEV_SERVER_PATTERN = /astro dev|vite dev|npm run dev|next dev/i;
const BROWSER_TOOL_PATTERN = /playwright|puppeteer/i;
const ACCOUNT_TRADING_ORDER_BALANCE_API_PATTERN = /getKisAccountBalance\(|placeKisOrder\(|getKisTradingHistory\(/i;
const ENV_READ_PATTERN = /process\.env(\.\w|\[)/;
const DOTENV_PATTERN = /require\(['"]dotenv['"]\)|from\s+['"]dotenv['"]|readFileSync\([^)]*\.env/i;
const SECRET_VALUE = (text) =>
  BEARER_PATTERN.test(text) ||
  /KIS_APP_KEY['"]?\s*[:=]\s*['"]?[A-Za-z0-9]{8,}/.test(text) ||
  /KIS_APP_SECRET['"]?\s*[:=]\s*['"]?[A-Za-z0-9]{8,}/.test(text) ||
  /KIS_ACCESS_TOKEN['"]?\s*[:=]\s*['"]?[A-Za-z0-9]{8,}/.test(text);
const RANDOM_OR_TIME_PATTERN = /Math\.random\(\)|Date\.now\(\)|new Date\(\)/;

const pagesChanged = [...phaseChanges].some((path) => path.startsWith('src/pages/') && !path.startsWith('src/pages/api/'));
const apiChanged = [...phaseChanges].some((path) => path.startsWith('src/pages/api/'));
const serverProvidersChanged = [...phaseChanges].some((path) => path.startsWith('src/lib/server/providers/'));
const engineDirChanged = [...phaseChanges].some((path) => path.startsWith('src/lib/chartSimilarity/'));
const dataDirChanged = [...phaseChanges].some((path) => path.startsWith('src/data/chartSimilarity/'));
const supabaseOrMigrationAdded = addedFiles.some((path) => /migration|\.sql$/i.test(path) || /supabase/i.test(path));
const vercelChanged = [...phaseChanges].some((path) => VERCEL_FILE_PATTERN.test(path));
const lockfileChanged = [...phaseChanges].some((path) => /package-lock\.json|pnpm-lock\.yaml|yarn\.lock/i.test(path));
const envFileChanged = [...phaseChanges].some((path) => /(^|\/)\.env(\.|$)/i.test(path));

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

process.stdout.write('=== Phase 3FA-D-MANUAL-RUN-HF1 Owner-local KIS Credential Configuration Check ===\n\n');

process.stdout.write('Files, checker, smoke, package, changelog:\n');
check('1. Planning document exists', existsSync(join(root, paths.planning)));
check('2. Result document exists', existsSync(join(root, paths.result)));
check('3. Checker exists', existsSync(join(root, paths.checker)));
check('4. Smoke script exists', existsSync(join(root, paths.smoke)));
check('5. Package checker script exists',
  packageJson.scripts?.['check:phase-3fa-d-manual-run-hf1-kis-credential-configuration-check'] ===
    'node scripts/check_phase_3fa_d_manual_run_hf1_kis_credential_configuration_check_contract.mjs');
check('6. Package smoke script exists',
  packageJson.scripts?.['smoke:phase-3fa-d-manual-run-hf1-kis-credential-configuration-check'] ===
    'node scripts/smoke_phase_3fa_d_manual_run_hf1_kis_credential_configuration_check.mjs');
check('7. Changelog contains Phase 3FA-D-MANUAL-RUN-HF1', phaseSection.length > 0);
process.stdout.write('\n');

process.stdout.write('Credential check files present:\n');
check('8. Credential check types file exists', existsSync(join(root, paths.credentialCheckTypes)));
check('9. Credential check module exists', existsSync(join(root, paths.credentialCheckModule)));
check('10. Mocked credential check fixtures file exists', existsSync(join(root, paths.credentialCheckFixtures)));
check('11. Server index exports credential check types',
  /SimilarityOwnerLocalCredentialCheckResult/.test(source.index) &&
  /SimilarityOwnerLocalCredentialCheckReport/.test(source.index) &&
  /SimilarityOwnerLocalCredentialCheckPolicy/.test(source.index));
check('12. Server index exports credential check functions',
  /buildDefaultSimilarityOwnerLocalCredentialCheckPolicy/.test(source.index) &&
  /buildOwnerLocalCredentialKeyRequirements/.test(source.index) &&
  /buildOwnerLocalCredentialKeyStatuses/.test(source.index) &&
  /buildOwnerLocalCredentialCheckReport/.test(source.index) &&
  /buildOwnerLocalCredentialCheckResult/.test(source.index) &&
  /assertCredentialCheckReportHasNoSecretEcho/.test(source.index));
check('13. Server index exports mocked credential check fixtures',
  /buildMockedOwnerLocalCredentialCheckPolicy/.test(source.index) &&
  /buildMockedOwnerLocalCredentialRequirements/.test(source.index) &&
  /buildMockedOwnerLocalCredentialMissingResult/.test(source.index) &&
  /buildMockedOwnerLocalCredentialPartialResult/.test(source.index) &&
  /buildMockedOwnerLocalCredentialConfiguredResult/.test(source.index));
check('14. Index does not import credential check module into pages', !/pages\/chart-ai/.test(source.index));
process.stdout.write('\n');

process.stdout.write('Credential check type shape:\n');
check('15. Types include SimilarityOwnerLocalCredentialCheckStatus', /SimilarityOwnerLocalCredentialCheckStatus/.test(source.credentialCheckTypes));
check('16. Status includes configured/missing/partial/blocked/not_checked',
  /'configured'/.test(source.credentialCheckTypes) && /'missing'/.test(source.credentialCheckTypes) &&
  /'partial'/.test(source.credentialCheckTypes) && /'blocked'/.test(source.credentialCheckTypes) &&
  /'not_checked'/.test(source.credentialCheckTypes));
check('17. Types include SimilarityOwnerLocalCredentialCheckDecision', /SimilarityOwnerLocalCredentialCheckDecision/.test(source.credentialCheckTypes));
check('18. Decision includes ready_for_manual_run_retry', /'ready_for_manual_run_retry'/.test(source.credentialCheckTypes));
check('19. Decision includes missing_required_env', /'missing_required_env'/.test(source.credentialCheckTypes));
check('20. Decision includes blocked_by_no_secret_echo_policy', /'blocked_by_no_secret_echo_policy'/.test(source.credentialCheckTypes));
check('21. Types include SimilarityOwnerLocalCredentialCheckSource', /SimilarityOwnerLocalCredentialCheckSource/.test(source.credentialCheckTypes));
check('22. Types include SimilarityOwnerLocalCredentialKeyRequirement', /SimilarityOwnerLocalCredentialKeyRequirement\b/.test(source.credentialCheckTypes));
check('23. Types include SimilarityOwnerLocalCredentialKeyStatus', /SimilarityOwnerLocalCredentialKeyStatus\b/.test(source.credentialCheckTypes));
check('24. Types include SimilarityOwnerLocalCredentialCheckPolicy', /SimilarityOwnerLocalCredentialCheckPolicy/.test(source.credentialCheckTypes));
check('25. Types include SimilarityOwnerLocalCredentialCheckReport', /SimilarityOwnerLocalCredentialCheckReport/.test(source.credentialCheckTypes));
check('26. Types include SimilarityOwnerLocalCredentialCheckResult', /SimilarityOwnerLocalCredentialCheckResult/.test(source.credentialCheckTypes));
check('27. KeyStatus type has valueEchoed literal false', /valueEchoed:\s*false/.test(source.credentialCheckTypes));
check('28. Report type has valueEchoed/dotenvRead/kisCallAttempted/routeCallAttempted literal false',
  /valueEchoed:\s*false/.test(source.credentialCheckTypes) && /dotenvRead:\s*false/.test(source.credentialCheckTypes) &&
  /kisCallAttempted:\s*false/.test(source.credentialCheckTypes) && /routeCallAttempted:\s*false/.test(source.credentialCheckTypes));
process.stdout.write('\n');

process.stdout.write('Policy field shape:\n');
check('29. Policy includes enabled', /enabled:\s*boolean/.test(source.credentialCheckTypes));
check('30. Policy includes allowProcessEnvPresenceCheck', /allowProcessEnvPresenceCheck/.test(source.credentialCheckTypes));
check('31. Policy allowDotenvRead literal false type', /allowDotenvRead:\s*false/.test(source.credentialCheckTypes));
check('32. Policy allowEnvValueEcho literal false type', /allowEnvValueEcho:\s*false/.test(source.credentialCheckTypes));
check('33. Policy allowValueLengthEcho literal false type', /allowValueLengthEcho:\s*false/.test(source.credentialCheckTypes));
check('34. Policy allowValuePrefixSuffixEcho literal false type', /allowValuePrefixSuffixEcho:\s*false/.test(source.credentialCheckTypes));
check('35. Policy allowValueHashEcho literal false type', /allowValueHashEcho:\s*false/.test(source.credentialCheckTypes));
check('36. Policy allowKisCall literal false type', /allowKisCall:\s*false/.test(source.credentialCheckTypes));
check('37. Policy allowRouteCall literal false type', /allowRouteCall:\s*false/.test(source.credentialCheckTypes));
check('38. Policy allowCredentialPersistence literal false type', /allowCredentialPersistence:\s*false/.test(source.credentialCheckTypes));
check('39. Policy ownerLocalOnly literal true type', /ownerLocalOnly:\s*true/.test(source.credentialCheckTypes));
process.stdout.write('\n');

process.stdout.write('Key requirements and statuses:\n');
check('40. KeyRequirement has name/required/description/source fields',
  /SimilarityOwnerLocalCredentialKeyRequirement\s*=\s*\{[\s\S]{0,200}name:\s*string[\s\S]{0,200}required:\s*true[\s\S]{0,200}description:\s*string[\s\S]{0,200}source:/.test(source.credentialCheckTypes));
check('41. KeyStatus has name/required/present/valueEchoed/safeMessage fields',
  /SimilarityOwnerLocalCredentialKeyStatus\s*=\s*\{[\s\S]{0,200}name:\s*string[\s\S]{0,200}required:\s*true[\s\S]{0,200}present:\s*boolean/.test(source.credentialCheckTypes));
check('42. Module exports buildOwnerLocalCredentialKeyRequirements', /export const buildOwnerLocalCredentialKeyRequirements/.test(source.credentialCheckModule));
check('43. Requirements list includes KIS_APP_KEY, KIS_APP_SECRET, KIS_BASE_URL',
  /KIS_APP_KEY/.test(source.credentialCheckModule) && /KIS_APP_SECRET/.test(source.credentialCheckModule) &&
  /KIS_BASE_URL/.test(source.credentialCheckModule));
check('44. Module exports buildOwnerLocalCredentialKeyStatuses', /export const buildOwnerLocalCredentialKeyStatuses/.test(source.credentialCheckModule));
process.stdout.write('\n');

process.stdout.write('Report builder behavior:\n');
check('45. Module exports buildDefaultSimilarityOwnerLocalCredentialCheckPolicy', /export const buildDefaultSimilarityOwnerLocalCredentialCheckPolicy/.test(source.credentialCheckModule));
check('46. Default policy enabled true', /buildDefaultSimilarityOwnerLocalCredentialCheckPolicy[\s\S]{0,200}enabled:\s*true/.test(credentialCheckModuleCode));
check('47. Default policy allowProcessEnvPresenceCheck true', /allowProcessEnvPresenceCheck:\s*true/.test(source.credentialCheckModule));
check('48. Default policy allowDotenvRead false', /allowDotenvRead:\s*false/.test(source.credentialCheckModule));
check('49. Default policy allowKisCall false', /allowKisCall:\s*false/.test(source.credentialCheckModule));
check('50. Default policy allowRouteCall false', /allowRouteCall:\s*false/.test(source.credentialCheckModule));
check('51. Module exports buildOwnerLocalCredentialCheckReport', /export const buildOwnerLocalCredentialCheckReport/.test(source.credentialCheckModule));
check('52. Report builder resolves status configured when all present', /presentCount === keyStatuses\.length\)\s*return\s*'configured'/.test(credentialCheckModuleCode));
check('53. Report builder resolves status missing when none present', /presentCount === 0\)\s*return\s*'missing'/.test(credentialCheckModuleCode));
check('54. Report builder resolves status partial otherwise', /return\s*'partial'/.test(credentialCheckModuleCode));
check('55. Report builder resolves decision ready_for_manual_run_retry only when configured', /'ready_for_manual_run_retry'\s*:\s*'missing_required_env'/.test(credentialCheckModuleCode));
check('56. Report always sets valueEchoed/dotenvRead/kisCallAttempted/routeCallAttempted false',
  /valueEchoed:\s*false/.test(source.credentialCheckModule) && /dotenvRead:\s*false/.test(source.credentialCheckModule) &&
  /kisCallAttempted:\s*false/.test(source.credentialCheckModule) && /routeCallAttempted:\s*false/.test(source.credentialCheckModule));
check('57. Module exports buildOwnerLocalCredentialCheckResult', /export const buildOwnerLocalCredentialCheckResult/.test(source.credentialCheckModule));
process.stdout.write('\n');

process.stdout.write('Redaction assertion:\n');
check('58. Module exports assertCredentialCheckReportHasNoSecretEcho', /export const assertCredentialCheckReportHasNoSecretEcho/.test(source.credentialCheckModule));
check('59. Forbidden patterns cover credential value assignment', /CREDENTIAL_VALUE_PATTERN/.test(source.credentialCheckModule));
check('60. Forbidden patterns cover KIS env value assignment', /KIS_ENV_VALUE_PATTERN/.test(source.credentialCheckModule));
check('61. Forbidden patterns cover bearer tokens', /BEARER_PATTERN/.test(source.credentialCheckModule));
check('62. Forbidden patterns cover raw KIS payload fields', /RAW_KIS_FIELD_PATTERN/.test(source.credentialCheckModule));
check('63. Forbidden patterns cover account/trading/order/balance fields', /ACCOUNT_TRADING_PATTERN/.test(source.credentialCheckModule));
check('64. Forbidden patterns cover market OHLC/volume/timestamp/score/return fields', /MARKET_VALUE_PATTERN/.test(source.credentialCheckModule));
check('65. Forbidden patterns cover DB connection strings', /DB_CONNECTION_PATTERN/.test(source.credentialCheckModule));
check('66. Forbidden patterns cover SQL strings', /SQL_PATTERN/.test(source.credentialCheckModule));
check('67. Forbidden patterns are scoped to JSON key:value shapes (not bare words)',
  /"\(appKey/.test(source.credentialCheckModule) || /"\(KIS_APP_KEY/.test(source.credentialCheckModule));
process.stdout.write('\n');

process.stdout.write('Mocked fixtures:\n');
check('68. Fixtures export buildMockedOwnerLocalCredentialCheckPolicy', /export const buildMockedOwnerLocalCredentialCheckPolicy/.test(source.credentialCheckFixtures));
check('69. Fixtures export buildMockedOwnerLocalCredentialRequirements', /export const buildMockedOwnerLocalCredentialRequirements/.test(source.credentialCheckFixtures));
check('70. Fixtures export buildMockedOwnerLocalCredentialMissingResult', /export const buildMockedOwnerLocalCredentialMissingResult/.test(source.credentialCheckFixtures));
check('71. Fixtures export buildMockedOwnerLocalCredentialPartialResult', /export const buildMockedOwnerLocalCredentialPartialResult/.test(source.credentialCheckFixtures));
check('72. Fixtures export buildMockedOwnerLocalCredentialConfiguredResult', /export const buildMockedOwnerLocalCredentialConfiguredResult/.test(source.credentialCheckFixtures));
check('73. Fixtures are deterministic (no Math.random/Date.now)', !RANDOM_OR_TIME_PATTERN.test(credentialCheckFixturesCode));
check('74. Fixtures do not import KIS provider/client', !KIS_IMPORT_PATTERN.test(credentialCheckFixturesCode));
check('75. Fixtures do not read process.env', !ENV_READ_PATTERN.test(credentialCheckFixturesCode));
process.stdout.write('\n');

process.stdout.write('Smoke script content:\n');
check('76. Smoke script is the only file reading process.env for this feature', ENV_READ_PATTERN.test(smokeScriptCode));
check('77. Smoke script uses a presence-only boolean check (trim().length > 0 style)', /trim\(\)\.length\s*>\s*0/.test(smokeScriptCode));
check('78. Smoke script does not read .env files or import dotenv', !DOTENV_PATTERN.test(smokeScriptCode));
check('79. Smoke script imports the credential check module', /similarityOwnerLocalCredentialCheck\.ts/.test(smokeScriptCode));
check('80. Smoke script does not import a live KIS provider/client', !KIS_IMPORT_PATTERN.test(smokeScriptCode));
check('81. Smoke script does not call KIS live transport', !KIS_LIVE_CALL_PATTERN.test(smokeScriptCode));
check('82. Smoke script does not call the API route', !/\/api\/chart-ai\/similarity/.test(smokeScriptCode));
check('83. Smoke script asserts no secret echo before printing (redaction gate present)', /assertCredentialCheckReportHasNoSecretEcho/.test(smokeScriptCode));
check('84. Smoke script does not start a dev server', !DEV_SERVER_PATTERN.test(smokeScriptCode));
check('85. Smoke script does not use a browser automation tool', !BROWSER_TOOL_PATTERN.test(smokeScriptCode));
check('86. Smoke script does not call account/trading/order/balance APIs', !ACCOUNT_TRADING_ORDER_BALANCE_API_PATTERN.test(smokeScriptCode));
check('87. Smoke script writes no report file to disk', !/writeFileSync/.test(smokeScriptCode));
process.stdout.write('\n');

process.stdout.write('Module safety (never reads process.env/.env, never calls KIS/route/auth/storage/DB/cache):\n');
check('88. Credential check module does not read process.env', !ENV_READ_PATTERN.test(credentialCheckModuleCode));
check('89. Credential check module does not read .env or import dotenv', !DOTENV_PATTERN.test(credentialCheckModuleCode));
check('90. Credential check module does not import a live KIS provider/client', !KIS_IMPORT_PATTERN.test(credentialCheckModuleCode));
check('91. Credential check module does not call KIS live transport', !KIS_LIVE_CALL_PATTERN.test(credentialCheckModuleCode));
check('92. Credential check module does not call fetch', !/\bfetch\(/.test(credentialCheckModuleCode));
check('93. Credential check module does not call the API route', !/\/api\/chart-ai\/similarity/.test(credentialCheckModuleCode));
check('94. Credential check module does not import auth provider', !AUTH_PROVIDER_IMPORT_PATTERN.test(credentialCheckModuleCode));
check('95. Credential check module does not import Supabase', !SUPABASE_IMPORT_PATTERN.test(credentialCheckModuleCode));
check('96. Credential check module does not import DB/cache provider', !DB_CACHE_IMPORT_PATTERN.test(credentialCheckModuleCode));
check('97. Credential check module does not read cookies', !COOKIE_PATTERN.test(credentialCheckModuleCode));
check('98. Credential check module does not read headers', !HEADER_PATTERN.test(credentialCheckModuleCode));
check('99. Credential check module does not read localStorage/sessionStorage', !STORAGE_ACCESS_PATTERN.test(credentialCheckModuleCode));
check('100. Credential check module does not import the real similarity engine', !REAL_ENGINE_IMPORT_PATTERN.test(credentialCheckModuleCode));
check('101. Credential check module does not call the real similarity engine', !REAL_ENGINE_CALL_PATTERN.test(credentialCheckModuleCode));
process.stdout.write('\n');

process.stdout.write('Route, UI, engine, existing KIS client, and manual-run files unchanged:\n');
check('102. API route file is unchanged from starting commit', routeUnchanged);
check('103. /chart-ai UI file is unchanged from starting commit', chartAiUiUnchanged);
check('104. Deterministic similarity engine files are unchanged from starting commit', engineFilesUnchanged);
check('105. Existing owner-local KIS OHLC client is unchanged from starting commit', kisOwnerLocalClientUnchanged);
check('106. Phase 3FA-D-MANUAL-RUN files are unchanged from starting commit (behavior preserved)', manualRunFilesUnchanged);
process.stdout.write('\n');

process.stdout.write('Documentation content:\n');
check('107. Docs describe this as a credential configuration check, not a KIS call', /credential.{0,20}configuration.{0,10}check/i.test(docScanText));
check('108. Docs record this is not a retry of the manual smoke', /not a retry|not.{0,10}retry.{0,20}manual smoke/i.test(docScanText));
check('109. Docs record no secret/value is recorded', /do not record actual env values|no (env|environment) value/i.test(docScanText));
check('110. Docs record no KIS call was made', /no kis call/i.test(docScanText));
check('111. Docs record no route call was made', /no (api )?route call/i.test(docScanText));
check('112. Docs record boundaries preserved (route/UI/auth/storage/DB/cache/deploy/push)', /no deployment/i.test(docScanText) && /no push/i.test(docScanText));
check('113. Docs record a recommended next step', /next step|roadmap/i.test(docScanText));
check('114. Result doc contains a Credential Check Result section', /Credential Check Result/i.test(source.result));
check('115. Result doc does not contain a raw env value assignment', !SECRET_VALUE(source.result));
process.stdout.write('\n');

process.stdout.write('Forbidden changed paths:\n');
check('116. No src/pages files changed', !pagesChanged);
check('117. No src/pages/api files changed', !apiChanged);
check('118. No src/lib/server/providers files changed', !serverProvidersChanged);
check('119. No src/lib/chartSimilarity files changed', !engineDirChanged);
check('120. No src/data/chartSimilarity files changed', !dataDirChanged);
check('121. No Supabase/migration/SQL files added', !supabaseOrMigrationAdded);
check('122. No Vercel files changed', !vercelChanged);
check('123. No lockfile changed', !lockfileChanged);
check('124. No .env file changed', !envFileChanged);
check('125. No dependency changes', dependenciesUnchanged);
check('126. No devDependency changes', devDependenciesUnchanged);
check('127. No image files added', addedImages.length === 0);
process.stdout.write('\n');

process.stdout.write('Forbidden content patterns:\n');
check('128. Source contains no source=live', !/source\s*=\s*['"]?live/i.test(credentialCheckAllSourceRaw));
check('129. Source contains no source=auto', !/source\s*=\s*['"]?auto/i.test(credentialCheckAllSourceRaw));
check('130. Source contains no external AI keywords', !EXTERNAL_AI_PATTERN.test(credentialCheckAllSourceRaw));
check('131. Source contains no raw KIS response fields', !RAW_KIS_FIELD_PATTERN.test(docScanText));
check('132. Docs contain no secret-looking values', !SECRET_VALUE(docScanText));
check('133. Smoke script contains no secret-looking values', !SECRET_VALUE(smokeScriptCode));
process.stdout.write('\n');

process.stdout.write('Network and scope safety:\n');
check('134. Checker blocks network access',
  source.checker.includes(
    'Network access is blocked in the Phase 3FA-D-MANUAL-RUN-HF1 kis credential configuration check checker.',
  ) && !fetchAttempted);
check('135. Allowed changed files only', unexpectedChanges.length === 0);
process.stdout.write('\n');

process.stdout.write(`Checks passed: ${passed}/${passed + failed}\n`);
if (failed > 0) {
  process.stdout.write(`Failures: ${failures.join('; ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('All Phase 3FA-D-MANUAL-RUN-HF1 checks passed.\n');
}
