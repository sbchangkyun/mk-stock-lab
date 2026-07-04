/**
 * Phase 3FA-D-MANUAL-RUN documentation and source contract.
 * Owner-local manual smoke execution, separately approved.
 * Static only: no network, browser, dev server, API, provider, live KIS, external AI, or environment access.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error(
    'Network access is blocked in the Phase 3FA-D-MANUAL-RUN owner local manual smoke execution checker.',
  );
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = process.cwd();
const startingCommit = 'f5924cc';

const paths = {
  planning: 'docs/planning/phase_3fa_d_manual_run_owner_local_manual_smoke_execution_v0.1.md',
  result: 'docs/planning/phase_3fa_d_manual_run_owner_local_manual_smoke_execution_result_v0.1.md',
  changelog: 'docs/planning/planning_changelog.md',
  checker: 'scripts/check_phase_3fa_d_manual_run_owner_local_manual_smoke_execution_contract.mjs',
  smoke: 'scripts/smoke_phase_3fa_d_manual_run_owner_local_manual_smoke_execution.mjs',
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
const phaseSection = source.changelog.split('## Phase 3FA-D-MANUAL-RUN - 2026-07-04')[1]?.split('\n## ')[0] ?? '';
const docScanText = `${source.planning}\n${source.result}\n${phaseSection}`;

// Strips known-safe policy/type field identifiers (which legitimately contain substrings like
// "MarketTimestamp" or "MarketValues" as part of an `allow...InReport: false` flag name) before
// running exclusion scans, so a safe field declaration can never trip a forbidden-content check.
const stripSafeFieldNames = (text) =>
  text.replace(
    /\b(allowMarketTimestampsInReport|allowMarketValuesInReport|allowVolumeInReport|allowSimilarityScoresInReport|allowDerivedReturnsInReport|allowRawProviderPayloadInReport|allowCredentialEcho|allowEnvEcho)\b/g,
    '',
  );

const manualRunTypesCode = stripSafeFieldNames(stripComments(source.manualRunTypes));
const manualRunModuleCode = stripComments(source.manualRunModule);
const manualRunFixturesCode = stripComments(source.manualRunFixtures);
const smokeScriptCode = stripComments(source.smoke);
const manualRunAllSourceRaw = [source.manualRunTypes, source.manualRunModule, source.manualRunFixtures].join('\n');

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
const KIS_LIVE_CALL_PATTERN = /getKisDomesticDailyOhlcSeries\(|getKisAccessToken\(/i;
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
const ENV_READ_PATTERN = /process\.env(\.\w|\[)/;
const DEV_SERVER_PATTERN = /astro dev|vite dev|npm run dev|next dev/i;
const BROWSER_TOOL_PATTERN = /playwright|puppeteer/i;
const ACCOUNT_TRADING_ORDER_BALANCE_API_PATTERN = /getKisAccountBalance\(|placeKisOrder\(|getKisTradingHistory\(/i;

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

process.stdout.write('=== Phase 3FA-D-MANUAL-RUN Owner-local Manual Smoke Execution ===\n\n');

process.stdout.write('Files, checker, smoke, package, changelog:\n');
check('1. Planning document exists', existsSync(join(root, paths.planning)));
check('2. Result document exists', existsSync(join(root, paths.result)));
check('3. Checker exists', existsSync(join(root, paths.checker)));
check('4. Smoke script exists', existsSync(join(root, paths.smoke)));
check('5. Package checker script exists',
  packageJson.scripts?.['check:phase-3fa-d-manual-run-owner-local-manual-smoke-execution'] ===
    'node scripts/check_phase_3fa_d_manual_run_owner_local_manual_smoke_execution_contract.mjs');
check('6. Package smoke script exists',
  packageJson.scripts?.['smoke:phase-3fa-d-manual-run-owner-local-manual-smoke-execution'] ===
    'node scripts/smoke_phase_3fa_d_manual_run_owner_local_manual_smoke_execution.mjs');
check('7. Changelog contains Phase 3FA-D-MANUAL-RUN', phaseSection.length > 0);
process.stdout.write('\n');

process.stdout.write('Manual run files present:\n');
check('8. Manual run types file exists', existsSync(join(root, paths.manualRunTypes)));
check('9. Manual run module exists', existsSync(join(root, paths.manualRunModule)));
check('10. Mocked manual run fixtures file exists', existsSync(join(root, paths.manualRunFixtures)));
check('11. Server index exports manual run types',
  /SimilarityOwnerLocalManualRunResult/.test(source.index) &&
  /SimilarityOwnerLocalManualRunReport/.test(source.index) &&
  /SimilarityOwnerLocalManualRunPolicy/.test(source.index));
check('12. Server index exports manual run functions',
  /buildDefaultSimilarityOwnerLocalManualRunPolicy/.test(source.index) &&
  /buildApprovedSimilarityOwnerLocalManualRunPolicy/.test(source.index) &&
  /buildOwnerLocalManualRunBlockedReport/.test(source.index) &&
  /buildOwnerLocalManualRunRedactedReport/.test(source.index) &&
  /buildOwnerLocalManualRunResult/.test(source.index) &&
  /assertManualRunReportIsRedacted/.test(source.index));
check('13. Server index exports mocked manual run fixtures',
  /buildMockedOwnerLocalManualRunDefaultPolicy/.test(source.index) &&
  /buildMockedOwnerLocalManualRunBlockedReport/.test(source.index) &&
  /buildMockedOwnerLocalManualRunExecutedRedactedReport/.test(source.index) &&
  /buildMockedOwnerLocalManualRunFailedRedactedReport/.test(source.index));
process.stdout.write('\n');

process.stdout.write('Manual run type shape:\n');
check('14. Types include SimilarityOwnerLocalManualRunStatus', /SimilarityOwnerLocalManualRunStatus/.test(source.manualRunTypes));
check('15. Status includes not_run/blocked/executed_redacted/failed_redacted',
  /'not_run'/.test(source.manualRunTypes) && /'blocked'/.test(source.manualRunTypes) &&
  /'executed_redacted'/.test(source.manualRunTypes) && /'failed_redacted'/.test(source.manualRunTypes));
check('16. Types include SimilarityOwnerLocalManualRunDecision', /SimilarityOwnerLocalManualRunDecision/.test(source.manualRunTypes));
check('17. Decision includes owner_approved_manual_run', /'owner_approved_manual_run'/.test(source.manualRunTypes));
check('18. Decision includes blocked_by_missing_approval', /'blocked_by_missing_approval'/.test(source.manualRunTypes));
check('19. Types include SimilarityOwnerLocalManualRunCheckStatus', /SimilarityOwnerLocalManualRunCheckStatus/.test(source.manualRunTypes));
check('20. Types include SimilarityOwnerLocalManualRunCheck', /SimilarityOwnerLocalManualRunCheck\b/.test(source.manualRunTypes));
check('21. Types include SimilarityOwnerLocalManualRunPolicy', /SimilarityOwnerLocalManualRunPolicy/.test(source.manualRunTypes));
check('22. Types include SimilarityOwnerLocalManualRunProviderProbe', /SimilarityOwnerLocalManualRunProviderProbe/.test(source.manualRunTypes));
check('23. Types include SimilarityOwnerLocalManualRunEngineContractCheck', /SimilarityOwnerLocalManualRunEngineContractCheck/.test(source.manualRunTypes));
check('24. Types include SimilarityOwnerLocalManualRunRedactionCheck', /SimilarityOwnerLocalManualRunRedactionCheck/.test(source.manualRunTypes));
check('25. Types include SimilarityOwnerLocalManualRunReport', /SimilarityOwnerLocalManualRunReport/.test(source.manualRunTypes));
check('26. Types include SimilarityOwnerLocalManualRunResult', /SimilarityOwnerLocalManualRunResult/.test(source.manualRunTypes));
process.stdout.write('\n');

process.stdout.write('Manual run policy field shape:\n');
check('27. Policy includes ownerApprovedKisCall', /ownerApprovedKisCall/.test(source.manualRunTypes));
check('28. Policy includes ownerLocalOnly: true (literal)', /ownerLocalOnly:\s*true/.test(source.manualRunTypes));
check('29. Policy includes allowKisOhlcProviderCall', /allowKisOhlcProviderCall/.test(source.manualRunTypes));
check('30. Policy includes allowSimilarityEngineContractCheck', /allowSimilarityEngineContractCheck/.test(source.manualRunTypes));
check('31. Policy allowRouteCall literal false', /allowRouteCall:\s*false/.test(source.manualRunTypes));
check('32. Policy allowRouteSuccess literal false', /allowRouteSuccess:\s*false/.test(source.manualRunTypes));
check('33. Policy allowPublicExecution literal false', /allowPublicExecution:\s*false/.test(source.manualRunTypes));
check('34. Policy allowBetaExecution literal false', /allowBetaExecution:\s*false/.test(source.manualRunTypes));
check('35. Policy allowRawProviderPayloadInReport literal false', /allowRawProviderPayloadInReport:\s*false/.test(source.manualRunTypes));
check('36. Policy allowMarketValuesInReport literal false', /allowMarketValuesInReport:\s*false/.test(source.manualRunTypes));
check('37. Policy allowVolumeInReport literal false', /allowVolumeInReport:\s*false/.test(source.manualRunTypes));
check('38. Policy allowMarketTimestampsInReport literal false', /allowMarketTimestampsInReport:\s*false/.test(source.manualRunTypes));
check('39. Policy allowSimilarityScoresInReport literal false', /allowSimilarityScoresInReport:\s*false/.test(source.manualRunTypes));
check('40. Policy allowDerivedReturnsInReport literal false', /allowDerivedReturnsInReport:\s*false/.test(source.manualRunTypes));
check('41. Policy allowCredentialEcho literal false', /allowCredentialEcho:\s*false/.test(source.manualRunTypes));
check('42. Policy allowEnvEcho literal false', /allowEnvEcho:\s*false/.test(source.manualRunTypes));
process.stdout.write('\n');

process.stdout.write('Manual run type exclusions:\n');
check('43. Types exclude raw KIS fields', !RAW_FIELDS.test(manualRunTypesCode));
check('44. Types exclude actual price/volume fields', !ACTUAL_PRICE_VOLUME_PATTERN.test(manualRunTypesCode));
check('45. Types exclude market timestamps', !MARKET_TIMESTAMP_PATTERN.test(manualRunTypesCode));
check('46. Types exclude similarity score/return fields from real data', !SIMILARITY_SCORE_RETURN_PATTERN.test(manualRunTypesCode));
check('47. Types exclude KIS credential fields', !KIS_CREDENTIAL_PATTERN.test(manualRunTypesCode));
check('48. Types exclude account/trading fields', !ACCOUNT_TRADING_PATTERN.test(manualRunTypesCode));
check('49. Types exclude token/email/IP/cookies/headers', !TOKEN_EMAIL_IP_COOKIE_HEADER_PATTERN.test(manualRunTypesCode));
check('50. Types exclude DB connection strings', !DB_CONNECTION_PATTERN.test(manualRunTypesCode));
check('51. Types exclude SQL strings', !SQL_PATTERN.test(manualRunTypesCode));
check('52. Types do not include a raw symbol field', !/\bsymbol\s*:\s*string/.test(manualRunTypesCode));
process.stdout.write('\n');

process.stdout.write('Default and approved policy builders:\n');
check('53. Default policy builder exists', /export const buildDefaultSimilarityOwnerLocalManualRunPolicy/.test(source.manualRunModule));
check('54. Default policy enabled false', /enabled:\s*false/.test(source.manualRunModule));
check('55. Default policy ownerApprovedKisCall false', /ownerApprovedKisCall:\s*false/.test(source.manualRunModule));
check('56. Default policy allowKisOhlcProviderCall false', /allowKisOhlcProviderCall:\s*false/.test(source.manualRunModule));
check('57. Default policy allowSimilarityEngineContractCheck false', /allowSimilarityEngineContractCheck:\s*false/.test(source.manualRunModule));
check('58. Approved policy builder exists', /export const buildApprovedSimilarityOwnerLocalManualRunPolicy/.test(source.manualRunModule));
check('59. Approved policy enabled true', /buildApprovedSimilarityOwnerLocalManualRunPolicy[\s\S]{0,120}enabled:\s*true/.test(manualRunModuleCode));
check('60. Approved policy ownerApprovedKisCall true', /buildApprovedSimilarityOwnerLocalManualRunPolicy[\s\S]{0,200}ownerApprovedKisCall:\s*true/.test(manualRunModuleCode));
check('61. Approved policy still keeps route/public/beta success flags false',
  /buildApprovedSimilarityOwnerLocalManualRunPolicy[\s\S]{0,600}allowRouteSuccess:\s*false[\s\S]{0,300}allowPublicExecution:\s*false[\s\S]{0,300}allowBetaExecution:\s*false/.test(manualRunModuleCode));
process.stdout.write('\n');

process.stdout.write('Bucketing and preflight checks:\n');
check('62. bucketNormalizedBarCount exists', /export const bucketNormalizedBarCount/.test(source.manualRunModule));
check('63. bucketNormalizedBarCount returns "none" for zero', /count === 0\)\s*return\s*'none'/.test(manualRunModuleCode));
check('64. bucketNormalizedBarCount returns "one_to_twenty"', /'one_to_twenty'/.test(source.manualRunModule));
check('65. bucketNormalizedBarCount returns "twenty_one_to_one_hundred"', /'twenty_one_to_one_hundred'/.test(source.manualRunModule));
check('66. bucketNormalizedBarCount returns "over_one_hundred"', /'over_one_hundred'/.test(source.manualRunModule));
check('67. bucketNormalizedBarCount returns "unknown" for invalid input', /'unknown'/.test(source.manualRunModule));
check('68. Preflight checks builder exists', /export const buildOwnerLocalManualRunPreflightChecks/.test(source.manualRunModule));
check('69. Preflight checks include owner_approval_present', /owner_approval_present/.test(source.manualRunModule));
check('70. Preflight checks include policy_enabled_for_manual_run', /policy_enabled_for_manual_run/.test(source.manualRunModule));
check('71. Preflight checks include owner_local_only', /owner_local_only/.test(source.manualRunModule));
check('72. Preflight checks include route_call_disabled', /route_call_disabled/.test(source.manualRunModule));
check('73. Preflight checks include route_success_disabled', /route_success_disabled/.test(source.manualRunModule));
check('74. Preflight checks include public_execution_disabled', /public_execution_disabled/.test(source.manualRunModule));
check('75. Preflight checks include beta_execution_disabled', /beta_execution_disabled/.test(source.manualRunModule));
check('76. Preflight checks include raw_provider_payload_reporting_disabled', /raw_provider_payload_reporting_disabled/.test(source.manualRunModule));
check('77. Preflight checks include market_value_reporting_disabled', /market_value_reporting_disabled/.test(source.manualRunModule));
check('78. Preflight checks include credential_env_echo_disabled', /credential_env_echo_disabled/.test(source.manualRunModule));
check('79. Preflight checks include account_trading_apis_excluded', /account_trading_apis_excluded/.test(source.manualRunModule));
process.stdout.write('\n');

process.stdout.write('Blocked and redacted report builders:\n');
check('81. Blocked report builder exists', /export const buildOwnerLocalManualRunBlockedReport/.test(source.manualRunModule));
check('82. Blocked report status blocked', /status:\s*'blocked'/.test(source.manualRunModule));
check('83. Blocked report decision blocked_by_missing_approval', /decision:\s*'blocked_by_missing_approval'/.test(source.manualRunModule));
check('84. Blocked report smokeExecuted false', /smokeExecuted:\s*false/.test(source.manualRunModule));
check('85. Blocked report source owner-local', /source:\s*'owner-local'/.test(source.manualRunModule));
check('86. Blocked report routeStatus feature_disabled', /routeStatus:\s*'feature_disabled'/.test(source.manualRunModule));
check('87. Redacted report builder exists', /export const buildOwnerLocalManualRunRedactedReport/.test(source.manualRunModule));
check('88. Redacted report input type exists', /export type OwnerLocalManualRunRedactedReportInput/.test(source.manualRunModule));
check('89. Redacted report status can be executed_redacted', /'executed_redacted'/.test(source.manualRunModule));
check('90. Redacted report status can be failed_redacted', /'failed_redacted'/.test(source.manualRunModule));
check('91. Result builder exists', /export const buildOwnerLocalManualRunResult/.test(source.manualRunModule));
process.stdout.write('\n');

process.stdout.write('Redaction assertion and sanitizer:\n');
check('92. sanitizeManualRunSerializedOutput exists', /export const sanitizeManualRunSerializedOutput/.test(source.manualRunModule));
check('93. assertManualRunReportIsRedacted exists', /export const assertManualRunReportIsRedacted/.test(source.manualRunModule));
check('94. Forbidden patterns cover raw KIS fields', /stck_prpr|stck_bsop_date/.test(source.manualRunModule));
check('95. Forbidden patterns cover price/volume/timestamp', /"\(open\|high\|low\|close\|volume\|price\)"|ACTUAL_PRICE_VOLUME_PATTERN/.test(source.manualRunModule));
check('96. Forbidden patterns cover similarity score/return', /similarityScore|SIMILARITY_SCORE_RETURN_PATTERN/.test(source.manualRunModule));
check('97. Forbidden patterns cover credentials/env', /CREDENTIAL_ENV_PATTERN|appKey|appSecret/.test(source.manualRunModule));
check('98. Forbidden patterns cover account/trading/order/balance', /ACCOUNT_TRADING_PATTERN/.test(source.manualRunModule));
check('99. Forbidden patterns cover token/email/ip/cookie/header', /TOKEN_EMAIL_IP_COOKIE_HEADER_PATTERN/.test(source.manualRunModule));
check('100. Forbidden patterns cover source=live/auto', /SOURCE_LIVE_AUTO_PATTERN/.test(source.manualRunModule));
check('101. Forbidden patterns are scoped to JSON key:value shapes (not bare words)',
  /"\(stck_prpr/.test(source.manualRunModule) || /"\(open\|high/.test(source.manualRunModule));
process.stdout.write('\n');

process.stdout.write('Manual run module and fixtures safety:\n');
check('102. Manual run module does not import KIS provider/client', !KIS_IMPORT_PATTERN.test(manualRunModuleCode));
check('103. Manual run module does not call KIS live transport', !KIS_LIVE_CALL_PATTERN.test(manualRunModuleCode));
check('104. Manual run module does not import the real similarity engine', !REAL_ENGINE_IMPORT_PATTERN.test(manualRunModuleCode));
check('105. Manual run module does not call the real similarity engine', !REAL_ENGINE_CALL_PATTERN.test(manualRunModuleCode));
check('106. Manual run module does not import auth provider', !AUTH_PROVIDER_IMPORT_PATTERN.test(manualRunModuleCode));
check('107. Manual run module does not import Supabase', !SUPABASE_IMPORT_PATTERN.test(manualRunModuleCode));
check('108. Manual run module does not import DB/cache provider', !DB_CACHE_IMPORT_PATTERN.test(manualRunModuleCode));
check('109. Manual run module does not call fetch', !/\bfetch\(/.test(manualRunModuleCode));
check('110. Manual run module does not read process.env', !ENV_READ_PATTERN.test(manualRunModuleCode));
check('111. Manual run module does not read .env',
  !/readFileSync\([^)]*\.env/.test(manualRunModuleCode) && !/require\(['"]dotenv['"]\)/.test(manualRunModuleCode));
check('112. Manual run module does not read cookies', !COOKIE_PATTERN.test(manualRunModuleCode));
check('113. Manual run module does not read headers', !HEADER_PATTERN.test(manualRunModuleCode));
check('114. Manual run module does not read localStorage/sessionStorage', !STORAGE_ACCESS_PATTERN.test(manualRunModuleCode));
check('115. Manual run module does not use Date.now or the current runtime date', !DATE_NOW_PATTERN.test(manualRunModuleCode));
check('116. Manual run module does not call account/trading/order/balance APIs', !ACCOUNT_TRADING_ORDER_BALANCE_API_PATTERN.test(manualRunModuleCode));
check('117. Mocked fixtures file does not import KIS provider/client', !KIS_IMPORT_PATTERN.test(manualRunFixturesCode));
check('118. Mocked fixtures file does not call KIS live transport', !KIS_LIVE_CALL_PATTERN.test(manualRunFixturesCode));
process.stdout.write('\n');

process.stdout.write('Smoke script content:\n');
check('119. Smoke script imports the real manual run module', /similarityOwnerLocalManualRun\.ts/.test(smokeScriptCode));
check('120. Smoke script imports the existing owner-local KIS OHLC client (reuse, not a new client)', /kisOwnerLocalOhlcClient\.ts/.test(smokeScriptCode));
check('121. Smoke script does not import a new/raw KIS client module', !/kisClient\.ts/.test(smokeScriptCode));
check('122. Smoke script requires both a CLI flag and an env flag before approval', /--owner-approved-kis-call/.test(smokeScriptCode) && /MKSTOCKLAB_OWNER_APPROVED_KIS_CALL/.test(smokeScriptCode));
check('123. Smoke script never invokes the deterministic similarity engine', !REAL_ENGINE_CALL_PATTERN.test(smokeScriptCode) && !REAL_ENGINE_IMPORT_PATTERN.test(smokeScriptCode));
check('124. Smoke script does not call the API route', !/\/api\/chart-ai\/similarity/.test(smokeScriptCode));
check('125. Smoke script does not start a dev server', !DEV_SERVER_PATTERN.test(smokeScriptCode));
check('126. Smoke script does not use a browser automation tool', !BROWSER_TOOL_PATTERN.test(smokeScriptCode));
check('127. Smoke script does not call account/trading/order/balance APIs', !ACCOUNT_TRADING_ORDER_BALANCE_API_PATTERN.test(smokeScriptCode));
check('128. Smoke script asserts the redacted report before printing (redaction gate present)', /assertManualRunReportIsRedacted/.test(smokeScriptCode));
check('129. Smoke script does not print a raw symbol value (only a generic configuration message)', /Owner-local test symbol configured\./.test(smokeScriptCode));
check('130. Smoke script writes no report file to disk', !/writeFileSync/.test(smokeScriptCode));
process.stdout.write('\n');

process.stdout.write('Route, UI, engine, and existing KIS client unchanged:\n');
check('131. API route file is unchanged from starting commit', routeUnchanged);
check('132. /chart-ai UI file is unchanged from starting commit', chartAiUiUnchanged);
check('133. Deterministic similarity engine files are unchanged from starting commit', engineFilesUnchanged);
check('134. Existing owner-local KIS OHLC client is unchanged from starting commit (reused, not modified)', kisOwnerLocalClientUnchanged);
process.stdout.write('\n');

process.stdout.write('Result document preserved-boundary records:\n');
check('135. Docs record explicit owner approval scope', /owner.{0,10}approv/i.test(docScanText));
check('136. Docs record approval does not extend to route success', /does not (approve|extend).{0,40}route success|route success remains disabled/i.test(docScanText));
check('137. Docs record no public/beta execution', /no public.{0,10}beta execution|no public or beta execution/i.test(docScanText));
check('138. Docs record no route/API integration', /no (api )?route (call|integration|change)/i.test(docScanText));
check('139. Docs record no UI integration', /no ui integration|\/chart-ai.{0,10}ui.{0,20}(unchanged|change)/i.test(docScanText));
check('140. Docs record no DB/cache storage', /no db.{0,10}cache (storage|runtime)/i.test(docScanText));
check('141. Docs record no auth runtime', /no (real )?auth runtime/i.test(docScanText));
check('142. Docs record no deployment', /no deployment/i.test(docScanText));
check('143. Docs record no push', /no push/i.test(docScanText));
check('144. Docs record redacted report only (no raw values)', /redacted/i.test(docScanText));
check('145. Docs record recommended next phase', /next phase/i.test(phaseSection) || /roadmap/i.test(source.result));
process.stdout.write('\n');

process.stdout.write('Forbidden changed paths:\n');
check('146. No src/pages files changed', !pagesChanged);
check('147. No src/pages/api files changed', !apiChanged);
check('148. No src/lib/server/providers files changed (existing KIS client reused unmodified)', !serverProvidersChanged);
check('149. No src/lib/chartSimilarity files changed', !engineDirChanged);
check('150. No src/data/chartSimilarity files changed', !dataDirChanged);
check('151. No Supabase/migration/SQL files added', !supabaseOrMigrationAdded);
check('152. No Vercel files changed', !vercelChanged);
check('153. No lockfile changed', !lockfileChanged);
check('154. No .env file changed', !envFileChanged);
check('155. No dependency changes', dependenciesUnchanged);
check('156. No devDependency changes', devDependenciesUnchanged);
check('157. No image files added', addedImages.length === 0);
process.stdout.write('\n');

process.stdout.write('Forbidden content patterns:\n');
check('158. Source contains no source=live', !/source\s*=\s*['"]?live/i.test(manualRunAllSourceRaw));
check('159. Source contains no source=auto', !/source\s*=\s*['"]?auto/i.test(manualRunAllSourceRaw));
check('160. Source contains no external AI keywords', !EXTERNAL_AI_PATTERN.test(manualRunAllSourceRaw));
check('161. Source contains no raw KIS response fields', !RAW_FIELDS.test(docScanText));
check('162. Source contains no secret-looking values', !SECRET_VALUE(docScanText));
check('163. Docs contain no secret-looking values in the smoke script', !SECRET_VALUE(smokeScriptCode));
process.stdout.write('\n');

process.stdout.write('Network and scope safety:\n');
check('164. Checker blocks network access',
  source.checker.includes(
    'Network access is blocked in the Phase 3FA-D-MANUAL-RUN owner local manual smoke execution checker.',
  ) && !fetchAttempted);
check('165. Allowed changed files only', unexpectedChanges.length === 0);
process.stdout.write('\n');

process.stdout.write(`Checks passed: ${passed}/${passed + failed}\n`);
if (failed > 0) {
  process.stdout.write(`Failures: ${failures.join('; ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('All Phase 3FA-D-MANUAL-RUN checks passed.\n');
}
