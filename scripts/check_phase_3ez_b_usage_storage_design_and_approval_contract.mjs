/**
 * Phase 3EZ-B documentation and source contract.
 * Usage storage design and approval for Chart Similarity execution.
 * Static only: no network, browser, dev server, API, provider, live KIS, external AI, or environment access.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error('Network access is blocked in the Phase 3EZ-B usage storage design and approval checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = process.cwd();
const startingCommit = '0388de7';

const paths = {
  planning: 'docs/planning/phase_3ez_b_usage_storage_design_and_approval_v0.1.md',
  result: 'docs/planning/phase_3ez_b_usage_storage_design_and_approval_result_v0.1.md',
  changelog: 'docs/planning/planning_changelog.md',
  checker: 'scripts/check_phase_3ez_b_usage_storage_design_and_approval_contract.mjs',
  package: 'package.json',
  serverDir: 'src/lib/server/chartSimilarity',
  index: 'src/lib/server/chartSimilarity/index.ts',
  usageTypes: 'src/lib/server/chartSimilarity/similarityUsageStorageDesignTypes.ts',
  usageDesign: 'src/lib/server/chartSimilarity/similarityUsageStorageDesign.ts',
  usageFixtures: 'src/lib/server/chartSimilarity/mockedSimilarityUsageStorageDesignFixtures.ts',
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
const phaseSection = source.changelog.split('## Phase 3EZ-B - 2026-07-04')[1]?.split('\n## ')[0] ?? '';
const docScanText = `${source.planning}\n${source.result}\n${phaseSection}`;
const usageDesignAllSource = [source.usageTypes, source.usageDesign, source.usageFixtures, source.index].join('\n');
const usageDesignCode = stripComments(source.usageDesign);
const usageTypesCode = stripComments(source.usageTypes);

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
const SUPABASE_IMPORT_PATTERN = /from\s+['"][^'"]*supabase[^'"]*['"]/i;
const VERCEL_FILE_PATTERN = /(^|\/)vercel\.(json|ts)$|(^|\/)\.vercel\//i;
const COOKIE_HEADER_PATTERN = /document\.cookie|req\.cookies|request\.cookies|req\.headers|request\.headers|getHeader\(|Astro\.request\.headers/i;
const STORAGE_ACCESS_PATTERN = /localStorage\.|sessionStorage\./;
const DB_CACHE_IMPORT_PATTERN = /from\s+['"][^'"]*(supabase|redis|postgres|prisma|drizzle|mongodb|turso)[^'"]*['"]/i;

const pagesChanged = [...phaseChanges].some((path) => path.startsWith('src/pages/') && !path.startsWith('src/pages/api/'));
const apiChanged = [...phaseChanges].some((path) => path.startsWith('src/pages/api/'));
const serverProvidersChanged = [...phaseChanges].some((path) => path.startsWith('src/lib/server/providers/'));
const supabaseOrMigrationAdded = addedFiles.some((path) => /migration|\.sql$/i.test(path) || /supabase/i.test(path));
const vercelChanged = [...phaseChanges].some((path) => VERCEL_FILE_PATTERN.test(path));

const allowedChangedPathPrefixes = ['src/lib/server/chartSimilarity/'];
const allowedChangedPaths = new Set([
  'docs/planning/phase_3ez_b_usage_storage_design_and_approval_v0.1.md',
  'docs/planning/phase_3ez_b_usage_storage_design_and_approval_result_v0.1.md',
  'docs/planning/planning_changelog.md',
  'scripts/check_phase_3ez_b_usage_storage_design_and_approval_contract.mjs',
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

process.stdout.write('=== Phase 3EZ-B Usage Storage Design and Approval ===\n\n');

process.stdout.write('Files and changelog:\n');
check('1. Planning document exists', existsSync(join(root, paths.planning)));
check('2. Result document exists', existsSync(join(root, paths.result)));
check('3. Checker exists', existsSync(join(root, paths.checker)));
check('4. Package checker script exists',
  packageJson.scripts?.['check:phase-3ez-b-usage-storage-design-and-approval'] ===
    'node scripts/check_phase_3ez_b_usage_storage_design_and_approval_contract.mjs');
check('5. Changelog contains Phase 3EZ-B', phaseSection.length > 0);
process.stdout.write('\n');

process.stdout.write('Usage storage design files present:\n');
check('6. Server chartSimilarity directory exists', existsSync(join(root, paths.serverDir)));
check('7. Usage storage design types file exists', existsSync(join(root, paths.usageTypes)));
check('8. Usage storage design module exists', existsSync(join(root, paths.usageDesign)));
check('9. Mocked usage design fixtures file exists', existsSync(join(root, paths.usageFixtures)));
check('10. Server index exports usage design symbols',
  /buildSimilarityUsageStorageDesignResult/.test(source.index) &&
  /SimilarityUsageStoragePolicy/.test(source.index) &&
  /buildMockedUsageStorageDesignResult/.test(source.index));
process.stdout.write('\n');

process.stdout.write('Usage storage design type shape:\n');
check('11. Types include SimilarityUsageStorageBackendKind', /SimilarityUsageStorageBackendKind/.test(source.usageTypes));
check('12. Types include SimilarityUsageStorageStatus', /SimilarityUsageStorageStatus/.test(source.usageTypes));
check('13. Types include SimilarityUsageWindowKind', /SimilarityUsageWindowKind/.test(source.usageTypes));
check('14. Types include SimilarityUsageChargeTiming', /SimilarityUsageChargeTiming/.test(source.usageTypes));
check('15. Types include SimilarityUsageChargeOutcome', /SimilarityUsageChargeOutcome/.test(source.usageTypes));
check('16. Types include SimilarityUsageExecutionOutcome', /SimilarityUsageExecutionOutcome/.test(source.usageTypes));
check('17. Types include SimilarityUsageStorageKey', /SimilarityUsageStorageKey/.test(source.usageTypes));
check('18. Types include SimilarityUsageStoragePolicy', /SimilarityUsageStoragePolicy/.test(source.usageTypes));
check('19. Types include SimilarityUsageChargeDecision', /SimilarityUsageChargeDecision/.test(source.usageTypes));
check('20. Types include SimilarityUsageStorageDesignResult', /SimilarityUsageStorageDesignResult/.test(source.usageTypes));
process.stdout.write('\n');

process.stdout.write('Usage storage design type exclusions:\n');
check('21. Types exclude email', !/email/i.test(usageTypesCode));
check('22. Types exclude token fields', !/sessionToken|accessToken|refreshToken|providerToken|\btoken\b/i.test(usageTypesCode));
check('23. Types exclude IP address', !/ipAddress|ip_address|remoteAddr/i.test(usageTypesCode));
check('24. Types exclude raw auth provider payload', !/rawPayload|providerPayload|rawSession/i.test(usageTypesCode));
check('25. Types exclude cookies/headers', !/cookie|header/i.test(usageTypesCode));
check('26. Types exclude DB connection strings', !/connectionString|DATABASE_URL|postgres:\/\/|mysql:\/\//i.test(usageTypesCode));
check('27. Types exclude SQL strings', !/SELECT\s|INSERT\s|UPDATE\s|DELETE\s|CREATE TABLE/i.test(usageTypesCode));
process.stdout.write('\n');

process.stdout.write('Default storage policy:\n');
check('28. Policy builder exists', /export const buildDefaultSimilarityUsageStoragePolicy/.test(source.usageDesign));
check('29. Default policy backendKind none', /backendKind:\s*'none'/.test(source.usageDesign));
check('30. Default policy enabled false', /enabled:\s*false/.test(source.usageDesign));
check('31. Default policy requires owner approval before storage', /requireOwnerApprovalBeforeStorage:\s*true/.test(source.usageDesign));
check('32. Default policy requires SQL approval before database', /requireSqlApprovalBeforeDatabase:\s*true/.test(source.usageDesign));
check('33. Default policy requires cache approval before runtime', /requireCacheApprovalBeforeRuntime:\s*true/.test(source.usageDesign));
check('34. Default policy subjectKeyStrategy not_configured', /subjectKeyStrategy:\s*'not_configured'/.test(source.usageDesign));
check('35. Default policy chargeTiming after_success', /chargeTiming:\s*'after_success'/.test(source.usageDesign));
check('36. Default policy disallows public KIS execution', /allowPublicKisExecution:\s*false/.test(source.usageDesign));
process.stdout.write('\n');

process.stdout.write('Window model:\n');
check('37. Window start builder exists', /export const buildUsageWindowStartIso/.test(source.usageDesign));
check('38. Daily window starts at UTC midnight', /return\s*`\$\{datePart\}T00:00:00\.000Z`/.test(source.usageDesign));
check('39. Monthly window starts at first day UTC midnight',
  /`\$\{datePart\.slice\(0,\s*7\)\}-01T00:00:00\.000Z`/.test(source.usageDesign));
check('40. Design module does not use Date.now', !/Date\.now\(\)/.test(usageDesignCode));
check('41. Design module does not use current runtime date', !/new Date\(/.test(usageDesignCode));
process.stdout.write('\n');

process.stdout.write('Usage key strategy:\n');
check('42. Usage key builder exists', /export const buildSimilarityUsageStorageKey/.test(source.usageDesign));
check('43. Usage key uses chart-similarity purpose', /purpose:\s*'chart-similarity'/.test(source.usageDesign));
check('44. Usage key supports mocked source', /'mocked'/.test(source.usageDesign));
check('45. Usage key supports kis-normalized source', /kis-normalized/.test(source.usageDesign));
check('46. Usage key supports owner-local source', /owner-local/.test(source.usageDesign));
process.stdout.write('\n');

process.stdout.write('Role limit helper:\n');
check('47. Limit helper exists', /export const getUsageLimitForGuardRole/.test(source.usageDesign));
check('48. Limit helper covers authenticated/default', /policy\.defaultDailyLimit/.test(source.usageDesign));
check('49. Limit helper covers beta', /policy\.betaDailyLimit/.test(source.usageDesign));
check('50. Limit helper covers owner', /policy\.ownerDailyLimit/.test(source.usageDesign));
check('51. Limit helper covers admin', /policy\.adminDailyLimit/.test(source.usageDesign));
process.stdout.write('\n');

process.stdout.write('Charge decision helper:\n');
check('52. Charge decision helper exists', /export const decideSimilarityUsageCharge/.test(source.usageDesign));
check('53. Success outcome charges', /success:\s*'charge'/.test(source.usageDesign));
check('54. Auth required does not charge', /auth_required:\s*'do_not_charge'/.test(source.usageDesign));
check('55. Usage limited does not charge', /usage_limited:\s*'do_not_charge'/.test(source.usageDesign));
check('56. Feature disabled does not charge', /feature_disabled:\s*'do_not_charge'/.test(source.usageDesign));
check('57. Provider disabled does not charge', /provider_disabled:\s*'do_not_charge'/.test(source.usageDesign));
check('58. Provider error does not charge by default', /provider_error:\s*'do_not_charge'/.test(source.usageDesign));
check('59. Internal error does not charge by default', /internal_error:\s*'do_not_charge'/.test(source.usageDesign));
check('60. Disabled policy prevents write/increment',
  /shouldWriteUsage:\s*false/.test(source.usageDesign) &&
  /shouldIncrementUsage:\s*false/.test(source.usageDesign) &&
  /!policy\.enabled/.test(source.usageDesign));
process.stdout.write('\n');

process.stdout.write('Design result builder:\n');
check('61. Design result builder exists', /export const buildSimilarityUsageStorageDesignResult/.test(source.usageDesign));
process.stdout.write('\n');

process.stdout.write('Mocked usage design fixtures:\n');
check('62. Mocked policy fixture exists', /export const buildMockedSimilarityUsageStoragePolicy/.test(source.usageFixtures));
check('63. Mocked authenticated usage key fixture exists', /export const buildMockedAuthenticatedDailyUsageKey/.test(source.usageFixtures));
check('64. Mocked beta usage key fixture exists', /export const buildMockedBetaDailyUsageKey/.test(source.usageFixtures));
check('65. Mocked owner usage key fixture exists', /export const buildMockedOwnerDailyUsageKey/.test(source.usageFixtures));
check('66. Mocked success charge decision fixture exists', /export const buildMockedUsageChargeSuccessDecision/.test(source.usageFixtures));
check('67. Mocked auth-required decision fixture exists', /export const buildMockedUsageChargeAuthRequiredDecision/.test(source.usageFixtures));
check('68. Mocked provider-error decision fixture exists', /export const buildMockedUsageChargeProviderErrorDecision/.test(source.usageFixtures));
check('69. Mocked design result fixture exists', /export const buildMockedUsageStorageDesignResult/.test(source.usageFixtures));
check('70. Fixture uses fake subject keys only',
  /mock-auth-subject/.test(source.usageFixtures) &&
  /mock-beta-subject/.test(source.usageFixtures) &&
  /mock-owner-subject/.test(source.usageFixtures));
process.stdout.write('\n');

process.stdout.write('Design module safety:\n');
check('71. Design module does not import Supabase', !SUPABASE_IMPORT_PATTERN.test(usageDesignCode));
check('72. Design module does not import DB/cache provider', !DB_CACHE_IMPORT_PATTERN.test(usageDesignCode));
check('73. Design module does not call fetch', !/\bfetch\(/.test(usageDesignCode));
check('74. Design module does not read process.env', !/process\.env(\.\w|\[)/.test(usageDesignCode));
check('75. Design module does not read .env',
  !/readFileSync\([^)]*\.env/.test(usageDesignCode) && !/require\(['"]dotenv['"]\)/.test(usageDesignCode));
check('76. Design module does not read cookies', !COOKIE_HEADER_PATTERN.test(usageDesignCode));
check('77. Design module does not read headers', !/\.headers\b/.test(usageDesignCode));
check('78. Design module does not read localStorage/sessionStorage', !STORAGE_ACCESS_PATTERN.test(usageDesignCode));
check('79. Design module does not import KIS provider/client', !KIS_IMPORT_PATTERN.test(usageDesignCode));
process.stdout.write('\n');

process.stdout.write('Result document preserved-boundary records:\n');
check('80. Docs record no usage storage implementation', /no usage storage implementation/i.test(source.result));
check('81. Docs record no DB/cache runtime', /no db.{0,10}cache runtime/i.test(source.result));
check('82. Docs record no SQL/migration', /no sql file or migration/i.test(source.result));
check('83. Docs record owner approval required before storage',
  /owner approval[^\n]*required[^\n]*storage/i.test(source.result));
check('84. Docs record SQL approval required before database',
  /sql\/migration approval is required before a database/i.test(source.result));
check('85. Docs record cache approval required before runtime',
  /cache runtime approval is required before/i.test(source.result));
check('86. Docs record no API route', /no api route/i.test(source.result));
check('87. Docs record no KIS call', /no kis call/i.test(source.result));
check('88. Docs record no real auth runtime', /no real auth runtime/i.test(source.result));
check('89. Docs record no deployment', /no deployment/i.test(source.result));
check('90. Docs record no push', /no push/i.test(source.result));
check('91. Docs record no .env/process.env read', /no[^\n]*\.env[^\n]*process\.env[^\n]*read/i.test(source.result));
process.stdout.write('\n');

process.stdout.write('Changelog records:\n');
check('92. Changelog records next phase', /next phase/i.test(phaseSection));
process.stdout.write('\n');

process.stdout.write('Forbidden changed paths:\n');
check('93. No src/pages files changed', !pagesChanged);
check('94. No src/pages/api files changed', !apiChanged);
check('95. No src/lib/server/providers files changed', !serverProvidersChanged);
check('96. No Supabase/migration/SQL files added', !supabaseOrMigrationAdded);
check('97. No Vercel files changed', !vercelChanged);
check('98. No dependency changes', dependenciesUnchanged);
check('99. No devDependency changes', devDependenciesUnchanged);
check('100. No image files added', addedImages.length === 0);
process.stdout.write('\n');

process.stdout.write('Source safety scan:\n');
check('101. Source contains no source=live', !/source\s*=\s*['"]?live/i.test(usageDesignAllSource));
check('102. Source contains no source=auto', !/source\s*=\s*['"]?auto/i.test(usageDesignAllSource));
check('103. Source contains no account/trading/order/balance APIs', !ACCOUNT_TRADING_PATTERN.test(usageDesignAllSource));
check('104. Source contains no external AI keywords', !EXTERNAL_AI_PATTERN.test(usageDesignAllSource));
check('105. Source contains no raw KIS response fields', !RAW_FIELDS.test(docScanText));
check('106. Source contains no secret-looking values', !SECRET_VALUE(docScanText));
process.stdout.write('\n');

process.stdout.write('Network and scope safety:\n');
check('107. Checker blocks network access',
  source.checker.includes('Network access is blocked in the Phase 3EZ-B usage storage design and approval checker.') &&
  !fetchAttempted);
check('108. Allowed changed files only', unexpectedChanges.length === 0);
process.stdout.write('\n');

process.stdout.write(`Checks passed: ${passed}/${passed + failed}\n`);
if (failed > 0) {
  process.stdout.write(`Failures: ${failures.join('; ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('All Phase 3EZ-B checks passed.\n');
}
