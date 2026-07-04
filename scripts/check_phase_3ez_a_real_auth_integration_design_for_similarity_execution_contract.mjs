/**
 * Phase 3EZ-A documentation and source contract.
 * Real auth integration design for Chart Similarity execution.
 * Static only: no network, browser, dev server, API, provider, live KIS, external AI, or environment access.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error('Network access is blocked in the Phase 3EZ-A real auth integration design for similarity execution checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = process.cwd();
const startingCommit = '238fc3f';

const paths = {
  planning: 'docs/planning/phase_3ez_a_real_auth_integration_design_for_similarity_execution_v0.1.md',
  result: 'docs/planning/phase_3ez_a_real_auth_integration_design_for_similarity_execution_result_v0.1.md',
  changelog: 'docs/planning/planning_changelog.md',
  checker: 'scripts/check_phase_3ez_a_real_auth_integration_design_for_similarity_execution_contract.mjs',
  package: 'package.json',
  serverDir: 'src/lib/server/chartSimilarity',
  index: 'src/lib/server/chartSimilarity/index.ts',
  authTypes: 'src/lib/server/chartSimilarity/similarityAuthIntegrationDesignTypes.ts',
  authDesign: 'src/lib/server/chartSimilarity/similarityAuthIntegrationDesign.ts',
  guardTypes: 'src/lib/server/chartSimilarity/similarityExecutionGuardTypes.ts',
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
const phaseSection = source.changelog.split('## Phase 3EZ-A - 2026-07-04')[1]?.split('\n## ')[0] ?? '';
const docScanText = `${source.planning}\n${source.result}\n${phaseSection}`;
const authDesignAllSource = [source.authTypes, source.authDesign, source.index].join('\n');
const authDesignCode = stripComments(source.authDesign);
const authTypesCode = stripComments(source.authTypes);

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
const VERCEL_FILE_PATTERN = /(^|\/)vercel\.(json|ts)$|(^|\/)\.vercel\//i;
const EMAIL_PATTERN = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const IP_PATTERN = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
const TOKEN_LOOKING_PATTERN = /(bearer\s+[a-z0-9]|sk-[a-z0-9]|access_token\s*[:=]|session_token\s*[:=]|refresh_token\s*[:=]|provider_token\s*[:=])/i;
const COOKIE_HEADER_PATTERN = /document\.cookie|req\.cookies|request\.cookies|req\.headers|request\.headers|getHeader\(|Astro\.request\.headers/i;
const STORAGE_ACCESS_PATTERN = /localStorage\.|sessionStorage\./;
const DB_CACHE_IMPORT_PATTERN = /from\s+['"][^'"]*(supabase|redis|postgres|prisma|drizzle|mongodb)[^'"]*['"]/i;

const pagesChanged = [...phaseChanges].some((path) => path.startsWith('src/pages/') && !path.startsWith('src/pages/api/'));
const apiChanged = [...phaseChanges].some((path) => path.startsWith('src/pages/api/'));
const serverProvidersChanged = [...phaseChanges].some((path) => path.startsWith('src/lib/server/providers/'));
const supabaseOrMigrationAdded = addedFiles.some((path) => /migration|\.sql$/i.test(path) || /supabase/i.test(path));
const vercelChanged = [...phaseChanges].some((path) => VERCEL_FILE_PATTERN.test(path));

const allowedChangedPathPrefixes = ['src/lib/server/chartSimilarity/'];
const allowedChangedPaths = new Set([
  'docs/planning/phase_3ez_a_real_auth_integration_design_for_similarity_execution_v0.1.md',
  'docs/planning/phase_3ez_a_real_auth_integration_design_for_similarity_execution_result_v0.1.md',
  'docs/planning/planning_changelog.md',
  'scripts/check_phase_3ez_a_real_auth_integration_design_for_similarity_execution_contract.mjs',
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

process.stdout.write('=== Phase 3EZ-A Real Auth Integration Design for Similarity Execution ===\n\n');

process.stdout.write('Files and changelog:\n');
check('1. Planning document exists', existsSync(join(root, paths.planning)));
check('2. Result document exists', existsSync(join(root, paths.result)));
check('3. Checker exists', existsSync(join(root, paths.checker)));
check('4. Package checker script exists',
  packageJson.scripts?.['check:phase-3ez-a-real-auth-integration-design-for-similarity-execution'] ===
    'node scripts/check_phase_3ez_a_real_auth_integration_design_for_similarity_execution_contract.mjs');
check('5. Changelog contains Phase 3EZ-A', phaseSection.length > 0);
process.stdout.write('\n');

process.stdout.write('Auth integration design files present:\n');
check('6. Server chartSimilarity directory exists', existsSync(join(root, paths.serverDir)));
check('7. Auth integration design types file exists', existsSync(join(root, paths.authTypes)));
check('8. Auth integration design module exists', existsSync(join(root, paths.authDesign)));
check('9. Server index exports auth integration symbols',
  /buildGuardRequestFromAuthDesign/.test(source.index) && /SimilarityAuthIntegrationDesignResult/.test(source.index));
process.stdout.write('\n');

process.stdout.write('Auth integration design type shape:\n');
check('10. Types include SimilarityAuthProviderKind', /SimilarityAuthProviderKind/.test(source.authTypes));
check('11. Types include SimilarityAuthIntegrationStatus', /SimilarityAuthIntegrationStatus/.test(source.authTypes));
check('12. Types include SimilarityAuthSubjectKind', /SimilarityAuthSubjectKind/.test(source.authTypes));
check('13. Types include SimilarityAuthSubject', /SimilarityAuthSubject/.test(source.authTypes));
check('14. Types include SimilarityAuthRoleMappingPolicy', /SimilarityAuthRoleMappingPolicy/.test(source.authTypes));
check('15. Types include SimilarityAuthIntegrationDesignResult', /SimilarityAuthIntegrationDesignResult/.test(source.authTypes));
check('16. Types exclude token fields',
  !/sessionToken|accessToken|refreshToken|providerToken/i.test(authTypesCode));
check('17. Types exclude email', !/email/i.test(authTypesCode));
check('18. Types exclude IP address', !/ipAddress|ip_address|remoteAddr/i.test(authTypesCode));
check('19. Types exclude raw auth provider payload', !/rawPayload|providerPayload|rawSession/i.test(authTypesCode));
check('20. Types exclude cookies/headers', !/cookie|header/i.test(authTypesCode));
process.stdout.write('\n');

process.stdout.write('Role mapping policy:\n');
check('21. Policy builder exists', /export const buildDefaultSimilarityAuthRoleMappingPolicy/.test(source.authDesign));
check('22. Default policy allows anonymous mocked preview', /allowAnonymousMockedPreview:\s*true/.test(source.authDesign));
check('23. Default policy disallows public KIS execution', /allowPublicKisExecution:\s*false/.test(source.authDesign));
check('24. Default policy uses providerKind design-only/not-configured safe defaults',
  /providerKind:\s*'none'/.test(source.authDesign) &&
  /betaRoleSource:\s*'not_configured'/.test(source.authDesign) &&
  /ownerRoleSource:\s*'not_configured'/.test(source.authDesign) &&
  /adminRoleSource:\s*'not_configured'/.test(source.authDesign));
process.stdout.write('\n');

process.stdout.write('Mocked subject builders:\n');
check('25. Anonymous subject builder exists', /export const buildAnonymousSimilarityAuthSubject/.test(source.authDesign));
check('26. Authenticated subject builder exists', /export const buildMockedAuthenticatedSimilarityAuthSubject/.test(source.authDesign));
check('27. Beta subject builder exists', /export const buildMockedBetaSimilarityAuthSubject/.test(source.authDesign));
check('28. Owner subject builder exists', /export const buildMockedOwnerSimilarityAuthSubject/.test(source.authDesign));
check('29. Admin subject builder exists', /export const buildMockedAdminSimilarityAuthSubject/.test(source.authDesign));
process.stdout.write('\n');

process.stdout.write('Mapping and builder functions:\n');
check('30. Guard role mapper exists', /export const mapAuthSubjectToGuardRole/.test(source.authDesign));
check('31. Guard auth-state mapper exists', /export const mapAuthSubjectToGuardAuthState/.test(source.authDesign));
check('32. Design result builder exists', /export const buildSimilarityAuthIntegrationDesignResult/.test(source.authDesign));
check('33. Guard request builder exists', /export const buildGuardRequestFromAuthDesign/.test(source.authDesign));
process.stdout.write('\n');

process.stdout.write('Subject-to-guard-role mapping results:\n');
check('34. Anonymous maps to guard role anonymous',
  /case 'anonymous':[\s\S]{0,40}return 'anonymous'/.test(authDesignCode) || /default:\s*\n\s*return 'anonymous'/.test(authDesignCode));
check('35. Authenticated maps to guard role authenticated',
  /case 'user':\s*\n\s*return 'authenticated'/.test(authDesignCode));
check('36. Beta maps to guard role beta', /case 'beta_user':\s*\n\s*return 'beta'/.test(authDesignCode));
check('37. Owner maps to guard role owner', /case 'owner':\s*\n\s*return 'owner'/.test(authDesignCode));
check('38. Admin maps to guard role admin', /case 'admin':\s*\n\s*return 'admin'/.test(authDesignCode));
process.stdout.write('\n');

process.stdout.write('Guard request builder behavior:\n');
check('39. Guard request builder returns purpose chart-similarity', /purpose:\s*'chart-similarity'/.test(source.authDesign));
check('40. Guard request builder supports source mocked', /SimilarityExecutionSource/.test(source.authDesign) && /'mocked'/.test(source.guardTypes));
check('41. Guard request builder supports source kis-normalized', /kis-normalized/.test(source.guardTypes));
check('42. Guard request builder supports source owner-local', /owner-local/.test(source.guardTypes));
process.stdout.write('\n');

process.stdout.write('Auth design module safety:\n');
check('43. Auth design module does not import Supabase', !SUPABASE_IMPORT_PATTERN.test(authDesignCode));
check('44. Auth design module does not import external auth provider', !AUTH_PROVIDER_IMPORT_PATTERN.test(authDesignCode));
check('45. Auth design module does not call fetch', !/\bfetch\(/.test(authDesignCode));
check('46. Auth design module does not read process.env', !/process\.env(\.\w|\[)/.test(authDesignCode));
check('47. Auth design module does not read .env',
  !/readFileSync\([^)]*\.env/.test(authDesignCode) && !/require\(['"]dotenv['"]\)/.test(authDesignCode));
check('48. Auth design module does not read cookies', !COOKIE_HEADER_PATTERN.test(authDesignCode));
check('49. Auth design module does not read headers', !/\.headers\b/.test(authDesignCode));
check('50. Auth design module does not read localStorage/sessionStorage', !STORAGE_ACCESS_PATTERN.test(authDesignCode));
check('51. Auth design module does not import DB/cache', !DB_CACHE_IMPORT_PATTERN.test(authDesignCode));
check('52. Auth design module does not import KIS provider/client', !KIS_IMPORT_PATTERN.test(authDesignCode));
check('53. Auth design module uses fake subject IDs only',
  /mock-auth-subject/.test(source.authDesign) && /mock-beta-subject/.test(source.authDesign) &&
  /mock-owner-subject/.test(source.authDesign) && /mock-admin-subject/.test(source.authDesign));
check('54. Auth design module contains no real email', !EMAIL_PATTERN.test(authDesignCode));
check('55. Auth design module contains no token-like values', !TOKEN_LOOKING_PATTERN.test(authDesignCode));
process.stdout.write('\n');

process.stdout.write('Result document preserved-boundary records:\n');
check('56. Docs record no real auth runtime', /no real auth runtime/i.test(source.result));
check('57. Docs record no Supabase auth import', /no supabase auth import/i.test(source.result));
check('58. Docs record no API route', /no api route/i.test(source.result));
check('59. Docs record no usage storage', /no usage storage/i.test(source.result));
check('60. Docs record no KIS call', /no kis call/i.test(source.result));
check('61. Docs record no DB/SQL/migration',
  /no db.{0,10}cache runtime/i.test(source.result) && /no sql.{0,10}migration/i.test(source.result));
check('62. Docs record no deployment', /no deployment/i.test(source.result));
check('63. Docs record no push', /no `?git push`? performed|no push/i.test(source.result));
check('64. Docs record no .env/process.env read',
  /no[^\n]*\.env[^\n]*process\.env[^\n]*read/i.test(source.result));
process.stdout.write('\n');

process.stdout.write('Changelog records:\n');
check('65. Changelog records next phase', /next phase/i.test(phaseSection));
process.stdout.write('\n');

process.stdout.write('Forbidden changed paths:\n');
check('66. No src/pages files changed', !pagesChanged);
check('67. No src/pages/api files changed', !apiChanged);
check('68. No src/lib/server/providers files changed', !serverProvidersChanged);
check('69. No Supabase/migration/SQL files added', !supabaseOrMigrationAdded);
check('70. No Vercel files changed', !vercelChanged);
check('71. No dependency changes', dependenciesUnchanged);
check('72. No devDependency changes', devDependenciesUnchanged);
check('73. No image files added', addedImages.length === 0);
process.stdout.write('\n');

process.stdout.write('Source safety scan:\n');
check('74. Source contains no source=live', !/source\s*=\s*['"]?live/i.test(authDesignAllSource));
check('75. Source contains no source=auto', !/source\s*=\s*['"]?auto/i.test(authDesignAllSource));
check('76. Source contains no account/trading/order/balance APIs', !ACCOUNT_TRADING_PATTERN.test(authDesignAllSource));
check('77. Source contains no external AI keywords', !EXTERNAL_AI_PATTERN.test(authDesignAllSource));
check('78. Source contains no raw KIS response fields', !RAW_FIELDS.test(docScanText));
check('79. Source contains no secret-looking values', !SECRET_VALUE(docScanText));
process.stdout.write('\n');

process.stdout.write('Network and scope safety:\n');
check('80. Checker blocks network access',
  source.checker.includes('Network access is blocked in the Phase 3EZ-A real auth integration design for similarity execution checker.') &&
  !fetchAttempted);
check('81. Allowed changed files only', unexpectedChanges.length === 0);
process.stdout.write('\n');

process.stdout.write(`Checks passed: ${passed}/${passed + failed}\n`);
if (failed > 0) {
  process.stdout.write(`Failures: ${failures.join('; ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('All Phase 3EZ-A checks passed.\n');
}
