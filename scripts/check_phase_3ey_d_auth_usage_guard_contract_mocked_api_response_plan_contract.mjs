/**
 * Phase 3EY-D documentation and source contract.
 * Auth/usage guard contract and mocked API response plan for Chart Similarity execution.
 * Static only: no network, browser, dev server, API, provider, live KIS, external AI, or environment access.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error('Network access is blocked in the Phase 3EY-D auth usage guard contract mocked api response plan checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = process.cwd();
const startingCommit = '0487b56';

const paths = {
  planning: 'docs/planning/phase_3ey_d_auth_usage_guard_contract_mocked_api_response_plan_v0.1.md',
  result: 'docs/planning/phase_3ey_d_auth_usage_guard_contract_mocked_api_response_plan_result_v0.1.md',
  changelog: 'docs/planning/planning_changelog.md',
  checker: 'scripts/check_phase_3ey_d_auth_usage_guard_contract_mocked_api_response_plan_contract.mjs',
  smoke: 'scripts/smoke_phase_3ey_d_auth_usage_guard_contract_mocked_api_response_plan.mjs',
  package: 'package.json',
  serverDir: 'src/lib/server/chartSimilarity',
  index: 'src/lib/server/chartSimilarity/index.ts',
  responseTypes: 'src/lib/server/chartSimilarity/similarityApiResponseTypes.ts',
  responseBuilder: 'src/lib/server/chartSimilarity/similarityApiResponseBuilder.ts',
  responseFixtures: 'src/lib/server/chartSimilarity/mockedSimilarityApiResponseFixtures.ts',
  guardTypes: 'src/lib/server/chartSimilarity/similarityExecutionGuardTypes.ts',
  guardEvaluator: 'src/lib/server/chartSimilarity/similarityExecutionGuard.ts',
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
const phaseSection = source.changelog.split('## Phase 3EY-D - 2026-07-04')[1]?.split('\n## ')[0] ?? '';
const docScanText = `${source.planning}\n${source.result}\n${phaseSection}`;
const serverAllSource = [
  source.index,
  source.responseTypes,
  source.responseBuilder,
  source.responseFixtures,
].join('\n');
const responseBuilderCode = stripComments(source.responseBuilder);
const responseFixturesCode = stripComments(source.responseFixtures);
const responseTypesCode = stripComments(source.responseTypes);

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
const USER_ID_FIELD_PATTERN = /\buserId\s*[:?]/;
const ROLE_AUTH_STATE_FIELD_PATTERN = /\b(role|authState)\s*[:?]\s*(SimilarityExecution|['"])/;
const SIMILARITY_ENGINE_IMPORT_PATTERN = /from\s+['"][^'"]*(similarityEngine|chartSimilarityEngine)[^'"]*['"]/i;

const pagesChanged = [...phaseChanges].some((path) => path.startsWith('src/pages/') && !path.startsWith('src/pages/api/'));
const apiChanged = [...phaseChanges].some((path) => path.startsWith('src/pages/api/'));
const serverProvidersChanged = [...phaseChanges].some((path) => path.startsWith('src/lib/server/providers/'));
const clientChartSimilarityChanged = [...phaseChanges].some((path) => path.startsWith('src/lib/chartSimilarity/'));
const dataChartSimilarityChanged = [...phaseChanges].some((path) => path.startsWith('src/data/chartSimilarity/'));
const supabaseOrMigrationAdded = addedFiles.some((path) => /migration|\.sql$/i.test(path) || /supabase/i.test(path));
const vercelChanged = [...phaseChanges].some((path) => VERCEL_FILE_PATTERN.test(path));

const allowedChangedPathPrefixes = ['src/lib/server/chartSimilarity/'];
const allowedChangedPaths = new Set([
  'docs/planning/phase_3ey_d_auth_usage_guard_contract_mocked_api_response_plan_v0.1.md',
  'docs/planning/phase_3ey_d_auth_usage_guard_contract_mocked_api_response_plan_result_v0.1.md',
  'docs/planning/planning_changelog.md',
  'scripts/check_phase_3ey_d_auth_usage_guard_contract_mocked_api_response_plan_contract.mjs',
  'scripts/smoke_phase_3ey_d_auth_usage_guard_contract_mocked_api_response_plan.mjs',
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

process.stdout.write('=== Phase 3EY-D Auth/Usage Guard Contract and Mocked API Response Plan ===\n\n');

process.stdout.write('Files and changelog:\n');
check('1. Planning document exists', existsSync(join(root, paths.planning)));
check('2. Result document exists', existsSync(join(root, paths.result)));
check('3. Checker exists', existsSync(join(root, paths.checker)));
check('4. Smoke script exists', existsSync(join(root, paths.smoke)));
check('5. Package checker script exists',
  packageJson.scripts?.['check:phase-3ey-d-auth-usage-guard-contract-mocked-api-response-plan'] ===
    'node scripts/check_phase_3ey_d_auth_usage_guard_contract_mocked_api_response_plan_contract.mjs');
check('6. Package smoke script exists',
  packageJson.scripts?.['smoke:phase-3ey-d-auth-usage-guard-contract-mocked-api-response-plan'] ===
    'node scripts/smoke_phase_3ey_d_auth_usage_guard_contract_mocked_api_response_plan.mjs');
check('7. Changelog contains Phase 3EY-D', phaseSection.length > 0);
process.stdout.write('\n');

process.stdout.write('Response contract files present:\n');
check('8. Server chartSimilarity directory exists', existsSync(join(root, paths.serverDir)));
check('9. Response types file exists', existsSync(join(root, paths.responseTypes)));
check('10. Response builder file exists', existsSync(join(root, paths.responseBuilder)));
check('11. Mocked API response fixtures file exists', existsSync(join(root, paths.responseFixtures)));
check('12. Server index exports response builder and response type symbols',
  /buildSimilarityApiResponseFromGuard/.test(source.index) && /SimilarityApiResponse\b/.test(source.index));
process.stdout.write('\n');

process.stdout.write('Response type shape:\n');
check('13. Types include SimilarityApiResponseStatus', /SimilarityApiResponseStatus/.test(source.responseTypes));
check('14. Types include SimilarityApiResponseSource', /SimilarityApiResponseSource/.test(source.responseTypes));
check('15. Types include SimilarityApiResponseMode', /SimilarityApiResponseMode/.test(source.responseTypes));
check('16. Types include SimilarityApiSafeRequest', /SimilarityApiSafeRequest/.test(source.responseTypes));
check('17. Types include SimilarityApiSafeUsage', /SimilarityApiSafeUsage/.test(source.responseTypes));
check('18. Types include SimilarityApiSafeError', /SimilarityApiSafeError/.test(source.responseTypes));
check('19. Types include SimilarityApiMockedMatch', /SimilarityApiMockedMatch/.test(source.responseTypes));
check('20. Types include SimilarityApiMockedSuccessData', /SimilarityApiMockedSuccessData/.test(source.responseTypes));
check('21. Types include SimilarityApiResponse', /export type SimilarityApiResponse\s*=/.test(source.responseTypes));
check('22. SimilarityApiSafeError has code/message/retryable fields',
  /code:\s*string/.test(source.responseTypes) && /message:\s*string/.test(source.responseTypes) && /retryable:\s*boolean/.test(source.responseTypes));
process.stdout.write('\n');

process.stdout.write('Response type sensitive-field exclusion:\n');
check('23. Response types do not declare a userId field', !USER_ID_FIELD_PATTERN.test(responseTypesCode));
check('24. Response types do not declare a role/authState field', !ROLE_AUTH_STATE_FIELD_PATTERN.test(responseTypesCode));
check('25. Response types do not mention a token/session/IP field name',
  !/(sessionToken|accessToken|providerToken|ipAddress)\s*[:?]/.test(responseTypesCode));
process.stdout.write('\n');

process.stdout.write('Response builder contract:\n');
check('26. Builder exports toSimilarityApiSafeRequest', /export const toSimilarityApiSafeRequest/.test(source.responseBuilder));
check('27. Builder exports toSimilarityApiSafeUsage', /export const toSimilarityApiSafeUsage/.test(source.responseBuilder));
check('28. Builder exports mapGuardStatusToApiStatus', /export const mapGuardStatusToApiStatus/.test(source.responseBuilder));
check('29. Builder exports buildSimilarityApiErrorFromGuard', /export const buildSimilarityApiErrorFromGuard/.test(source.responseBuilder));
check('30. Builder exports buildSimilarityApiResponseFromGuard', /export const buildSimilarityApiResponseFromGuard/.test(source.responseBuilder));
check('31. Builder exports buildMockedSimilarityApiSuccessData', /export const buildMockedSimilarityApiSuccessData/.test(source.responseBuilder));
check('32. Builder exports buildMockedAllowedSimilarityApiResponse', /export const buildMockedAllowedSimilarityApiResponse/.test(source.responseBuilder));
check('33. mapGuardStatusToApiStatus maps allowed to success', /status === 'allowed'[\s\S]{0,40}'success'/.test(source.responseBuilder));
check('34. Builder handles blocked status', /\bblocked\s*:/.test(source.responseBuilder));
check('35. Builder handles auth_required status', /'auth_required'/.test(source.responseBuilder));
check('36. Builder handles usage_limited status', /'usage_limited'/.test(source.responseBuilder));
check('37. Builder handles feature_disabled status', /'feature_disabled'/.test(source.responseBuilder));
check('38. Builder handles not_configured status', /'not_configured'/.test(source.responseBuilder));
check('39. Builder derives mode mocked-plan for mocked-source success', /'mocked-plan'/.test(source.responseBuilder));
check('40. Builder derives mode guard-allowed for non-mocked success', /'guard-allowed'/.test(source.responseBuilder));
check('41. Builder derives mode feature-flag-off for feature_disabled', /'feature-flag-off'/.test(source.responseBuilder));
check('42. Builder derives mode guard-blocked fallback', /'guard-blocked'/.test(source.responseBuilder));
check('43. Builder success data has exactly 3 fixed mocked matches', (source.responseBuilder.match(/rank:\s*[123],/g) || []).length === 3);
check('44. Builder does not import or call the similarity engine', !SIMILARITY_ENGINE_IMPORT_PATTERN.test(responseBuilderCode));
check('45. Builder does not import KIS provider/client', !KIS_IMPORT_PATTERN.test(responseBuilderCode));
check('46. Builder does not call fetch', !/\bfetch\(/.test(responseBuilderCode));
check('47. Builder does not read process.env', !/process\.env(\.\w|\[)/.test(responseBuilderCode));
check('48. Builder does not read .env',
  !/readFileSync\([^)]*\.env/.test(responseBuilderCode) && !/require\(['"]dotenv['"]\)/.test(responseBuilderCode));
check('49. Builder does not persist usage', !PERSIST_USAGE_PATTERN.test(responseBuilderCode));
check('50. Builder does not import Supabase', !SUPABASE_IMPORT_PATTERN.test(responseBuilderCode));
check('51. Builder does not import an auth provider', !AUTH_PROVIDER_IMPORT_PATTERN.test(responseBuilderCode));
process.stdout.write('\n');

process.stdout.write('Mocked API response fixtures:\n');
check('52. Fixtures export buildMockedSimilarityApiAllowedResponse', /export const buildMockedSimilarityApiAllowedResponse/.test(source.responseFixtures));
check('53. Fixtures export buildMockedSimilarityApiAuthRequiredResponse', /export const buildMockedSimilarityApiAuthRequiredResponse/.test(source.responseFixtures));
check('54. Fixtures export buildMockedSimilarityApiUsageLimitedResponse', /export const buildMockedSimilarityApiUsageLimitedResponse/.test(source.responseFixtures));
check('55. Fixtures export buildMockedSimilarityApiFeatureDisabledResponse', /export const buildMockedSimilarityApiFeatureDisabledResponse/.test(source.responseFixtures));
check('56. Fixtures export buildMockedSimilarityApiNotConfiguredResponse', /export const buildMockedSimilarityApiNotConfiguredResponse/.test(source.responseFixtures));
check('57. Fixtures export buildMockedSimilarityApiBlockedResponse', /export const buildMockedSimilarityApiBlockedResponse/.test(source.responseFixtures));
check('58. Fixtures reuse the real guard evaluator', /evaluateSimilarityExecutionGuard/.test(source.responseFixtures));
check('59. Fixtures reuse existing mocked guard fixtures', /mockedSimilarityExecutionGuardFixtures/.test(source.responseFixtures));
check('60. Fixtures contain no real email/token/IP',
  !EMAIL_PATTERN.test(source.responseFixtures) && !IP_PATTERN.test(source.responseFixtures) && !TOKEN_LOOKING_PATTERN.test(source.responseFixtures));
check('61. Fixtures do not import KIS provider/client or an auth provider',
  !KIS_IMPORT_PATTERN.test(responseFixturesCode) && !AUTH_PROVIDER_IMPORT_PATTERN.test(responseFixturesCode));
check('62. Fixtures do not produce source=live or source=auto',
  !/source\s*:\s*['"]live['"]/.test(source.responseFixtures) && !/source\s*:\s*['"]auto['"]/.test(source.responseFixtures));
process.stdout.write('\n');

process.stdout.write('Smoke script contract:\n');
check('63. Smoke script copies TS files to temp directory', /mkdtempSync/.test(source.smoke) && /tmpdir/.test(source.smoke));
check('64. Smoke script rewrites copied relative imports only',
  /rewriteRelativeImports/.test(source.smoke) && /IMPORT_SPECIFIER_PATTERN/.test(source.smoke));
check('65. Smoke script cleans temp directory', /rmSync/.test(source.smoke) && /finally/.test(source.smoke));
check('66. Smoke script checks allowed/success response shape',
  /buildMockedSimilarityApiAllowedResponse/.test(source.smoke) && /'success'/.test(source.smoke));
check('67. Smoke script checks auth_required response shape',
  /buildMockedSimilarityApiAuthRequiredResponse/.test(source.smoke) && /'auth_required'/.test(source.smoke));
check('68. Smoke script checks usage_limited response shape',
  /buildMockedSimilarityApiUsageLimitedResponse/.test(source.smoke) && /'usage_limited'/.test(source.smoke));
check('69. Smoke script checks feature_disabled response shape',
  /buildMockedSimilarityApiFeatureDisabledResponse/.test(source.smoke) && /'feature_disabled'/.test(source.smoke));
check('70. Smoke script checks not_configured response shape',
  /buildMockedSimilarityApiNotConfiguredResponse/.test(source.smoke) && /'not_configured'/.test(source.smoke));
check('71. Smoke script checks blocked response shape',
  /buildMockedSimilarityApiBlockedResponse/.test(source.smoke) && /'blocked'/.test(source.smoke));
check('72. Smoke script checks secret/token/auth/KIS/account safety patterns',
  /TOKEN_LIKE_PATTERN/.test(source.smoke) && /AUTH_PROVIDER_PAYLOAD_PATTERN/.test(source.smoke) &&
  /KIS_CREDENTIAL_PATTERN/.test(source.smoke) && /ACCOUNT_TRADING_PATTERN/.test(source.smoke));
check('73. Smoke script checks userId/role/authState field absence',
  /USER_ID_FIELD_PATTERN/.test(source.smoke) && /ROLE_AUTH_STATE_FIELD_PATTERN/.test(source.smoke));
check('74. Smoke script checks a process.env Proxy no-env-access path', /new Proxy\(originalEnv/.test(source.smoke));
process.stdout.write('\n');

process.stdout.write('Result document preserved-boundary records:\n');
check('75. Result doc status implemented/prepared', /Prepared\/Implemented|Implemented/.test(source.result));
check('76. Result doc records no API route', /no api route/i.test(source.result));
check('77. Result doc records no real auth runtime', /no real auth runtime/i.test(source.result));
check('78. Result doc records no usage persistence', /no usage persistence/i.test(source.result));
check('79. Result doc records no KIS call', /no kis call/i.test(source.result));
check('80. Result doc records no /chart-ai UI change', /no `?\/chart-ai`? ui change/i.test(source.result));
check('81. Result doc records no DB/cache runtime and no SQL/migration',
  /no db or cache runtime/i.test(source.result) && /no sql or migration/i.test(source.result));
check('82. Result doc records no external AI', /no external ai/i.test(source.result));
check('83. Result doc records no deployment and no push',
  /no deployment/i.test(source.result) && /no `?git push`? performed/i.test(source.result));
check('84. Result doc records no dependency/devDependency changes', /no dependency or devDependency changes/i.test(source.result));
check('85. Result doc records no .env/process.env read',
  /no[^\n]*\.env[^\n]*process\.env[^\n]*read/i.test(source.result));
process.stdout.write('\n');

process.stdout.write('Changelog records:\n');
check('86. Changelog records next phase', /next phase/i.test(phaseSection));
process.stdout.write('\n');

process.stdout.write('Forbidden changed paths:\n');
check('87. No src/pages files changed', !pagesChanged);
check('88. No src/pages/api files changed', !apiChanged);
check('89. No src/lib/server/providers files changed', !serverProvidersChanged);
check('90. No src/lib/chartSimilarity files changed', !clientChartSimilarityChanged);
check('91. No src/data/chartSimilarity files changed', !dataChartSimilarityChanged);
check('92. No Supabase/migration files added', !supabaseOrMigrationAdded);
check('93. No Vercel files changed', !vercelChanged);
check('94. No dependency changes', dependenciesUnchanged);
check('95. No devDependency changes', devDependenciesUnchanged);
check('96. No image files added', addedImages.length === 0);
process.stdout.write('\n');

process.stdout.write('Source safety scan:\n');
check('97. Source contains no source=live', !/source\s*=\s*['"]?live/i.test(serverAllSource));
check('98. Source contains no source=auto', !/source\s*=\s*['"]?auto/i.test(serverAllSource));
check('99. Source contains no account/trading/order/balance APIs', !ACCOUNT_TRADING_PATTERN.test(serverAllSource));
check('100. Source contains no external AI keywords', !EXTERNAL_AI_PATTERN.test(serverAllSource));
check('101. Docs contain no raw KIS response fields', !RAW_FIELDS.test(docScanText));
check('102. Docs contain no secret-looking values', !SECRET_VALUE(docScanText));
process.stdout.write('\n');

process.stdout.write('Network and scope safety:\n');
check('103. Checker blocks network access',
  source.checker.includes('Network access is blocked in the Phase 3EY-D auth usage guard contract mocked api response plan checker.') &&
  !fetchAttempted);
check('104. Allowed changed files only', unexpectedChanges.length === 0);
process.stdout.write('\n');

process.stdout.write(`Checks passed: ${passed}/${passed + failed}\n`);
if (failed > 0) {
  process.stdout.write(`Failures: ${failures.join('; ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('All Phase 3EY-D checks passed.\n');
}
