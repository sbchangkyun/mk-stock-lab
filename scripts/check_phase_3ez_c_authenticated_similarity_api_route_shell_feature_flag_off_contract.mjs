/**
 * Phase 3EZ-C documentation and source contract.
 * Authenticated Similarity API route shell with feature flag off.
 * Static only: no network, browser, dev server, API, provider, live KIS, external AI, or environment access.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error(
    'Network access is blocked in the Phase 3EZ-C authenticated similarity api route shell feature flag off checker.',
  );
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = process.cwd();
const startingCommit = '6e27916';

const paths = {
  planning: 'docs/planning/phase_3ez_c_authenticated_similarity_api_route_shell_feature_flag_off_v0.1.md',
  result: 'docs/planning/phase_3ez_c_authenticated_similarity_api_route_shell_feature_flag_off_result_v0.1.md',
  changelog: 'docs/planning/planning_changelog.md',
  checker: 'scripts/check_phase_3ez_c_authenticated_similarity_api_route_shell_feature_flag_off_contract.mjs',
  package: 'package.json',
  route: 'src/pages/api/chart-ai/similarity.ts',
  routeTypes: 'src/lib/server/chartSimilarity/similarityApiRouteShellTypes.ts',
  routeShell: 'src/lib/server/chartSimilarity/similarityApiRouteShell.ts',
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
const phaseSection = source.changelog.split('## Phase 3EZ-C - 2026-07-04')[1]?.split('\n## ')[0] ?? '';
const docScanText = `${source.planning}\n${source.result}\n${phaseSection}`;

const routeCode = stripComments(source.route);
const routeTypesCode = stripComments(source.routeTypes);
const routeShellCode = stripComments(source.routeShell);
const routeAllCode = [routeCode, routeTypesCode, routeShellCode].join('\n');
const routeAllSourceRaw = [source.route, source.routeTypes, source.routeShell].join('\n');

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
const KIS_CALL_PATTERN = /kisClient\(|getServerOnlyKisOhlcForSimilarity\(|runOwnerLocalOhlcPreview\(|getMockedServerOnlyKisOhlcForSimilarity\(/i;
const SUPABASE_IMPORT_PATTERN = /from\s+['"][^'"]*supabase[^'"]*['"]/i;
const AUTH_PROVIDER_IMPORT_PATTERN = /from\s+['"][^'"]*(auth0|next-auth|nextauth|clerk|firebase|passport|oauth)[^'"]*['"]/i;
const VERCEL_FILE_PATTERN = /(^|\/)vercel\.(json|ts)$|(^|\/)\.vercel\//i;
const COOKIE_PATTERN = /document\.cookie|req\.cookies|request\.cookies|\.cookies\b/i;
const HEADER_PATTERN = /req\.headers|request\.headers|getHeader\(|Astro\.request\.headers|\.headers\.get\(/i;
const STORAGE_ACCESS_PATTERN = /localStorage\.|sessionStorage\./;
const DB_CACHE_IMPORT_PATTERN = /from\s+['"][^'"]*(supabase|redis|upstash|postgres|prisma|drizzle|mongodb|turso)[^'"]*['"]/i;
const REAL_ENGINE_IMPORT_PATTERN = /from\s+['"][^'"]*\/lib\/chartSimilarity\//i;
const PERSIST_PATTERN = /writeFileSync\(|\.insert\(|\.update\(|\.set\(\s*\{|INSERT INTO|UPDATE\s+\w+\s+SET/i;
const TOKEN_FIELD_PATTERN = /sessionToken|accessToken|refreshToken|providerToken|\btoken\b/i;

const pagesChangedOtherThanRoute = [...phaseChanges].some(
  (path) => path.startsWith('src/pages/') && path !== paths.route,
);
const chartAiAstroChanged = phaseChanges.has('src/pages/chart-ai.astro');
const serverProvidersChanged = [...phaseChanges].some((path) => path.startsWith('src/lib/server/providers/'));
const engineDirChanged = [...phaseChanges].some((path) => path.startsWith('src/lib/chartSimilarity/'));
const dataDirChanged = [...phaseChanges].some((path) => path.startsWith('src/data/chartSimilarity/'));
const supabaseOrMigrationAdded = addedFiles.some((path) => /migration|\.sql$/i.test(path) || /supabase/i.test(path));
const vercelChanged = [...phaseChanges].some((path) => VERCEL_FILE_PATTERN.test(path));

const allowedChangedPathPrefixes = ['src/lib/server/chartSimilarity/'];
const allowedChangedPaths = new Set([
  paths.route,
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

process.stdout.write('=== Phase 3EZ-C Authenticated Similarity API Route Shell with Feature Flag Off ===\n\n');

process.stdout.write('Files and changelog:\n');
check('1. Planning document exists', existsSync(join(root, paths.planning)));
check('2. Result document exists', existsSync(join(root, paths.result)));
check('3. Checker exists', existsSync(join(root, paths.checker)));
check('4. Package checker script exists',
  packageJson.scripts?.['check:phase-3ez-c-authenticated-similarity-api-route-shell-feature-flag-off'] ===
    'node scripts/check_phase_3ez_c_authenticated_similarity_api_route_shell_feature_flag_off_contract.mjs');
check('5. Changelog contains Phase 3EZ-C', phaseSection.length > 0);
process.stdout.write('\n');

process.stdout.write('API route shell:\n');
check('6. API route file exists at src/pages/api/chart-ai/similarity.ts', existsSync(join(root, paths.route)));
check('7. Route exports POST', /export const POST:\s*APIRoute/.test(source.route));
check('8. Route returns JSON Response', /new Response\(JSON\.stringify\(/.test(source.route));
check('9. Route sets Cache-Control no-store', /'Cache-Control':\s*'no-store'/.test(source.route));
check('10. Route sets Content-Type application/json', /'Content-Type':\s*'application\/json/.test(source.route));
process.stdout.write('\n');

process.stdout.write('Route shell modules present:\n');
check('11. Route shell types file exists', existsSync(join(root, paths.routeTypes)));
check('12. Route shell helper module exists', existsSync(join(root, paths.routeShell)));
check('13. Server index exports route shell symbols',
  /SimilarityApiRouteShellPolicy/.test(source.index) &&
  /buildDefaultSimilarityApiRouteShellPolicy/.test(source.index) &&
  /buildSimilarityApiRouteShellResult/.test(source.index));
process.stdout.write('\n');

process.stdout.write('Route shell type shape:\n');
check('14. Types include SimilarityApiRouteShellStatus', /SimilarityApiRouteShellStatus/.test(source.routeTypes));
check('15. Types include SimilarityApiRouteShellPolicy', /SimilarityApiRouteShellPolicy/.test(source.routeTypes));
check('16. Types include SimilarityApiRouteShellRequest', /SimilarityApiRouteShellRequest/.test(source.routeTypes));
check('17. Types include SimilarityApiRouteShellResult', /SimilarityApiRouteShellResult/.test(source.routeTypes));
process.stdout.write('\n');

process.stdout.write('Default route shell policy:\n');
check('18. Route shell policy builder exists', /export const buildDefaultSimilarityApiRouteShellPolicy/.test(source.routeShell));
check('19. Default route shell policy enabled false', /enabled:\s*false/.test(source.routeShell));
check('20. Default route shell policy requires auth', /requireAuth:\s*true/.test(source.routeShell));
check('21. Default route shell policy requires usage storage', /requireUsageStorage:\s*true/.test(source.routeShell));
check('22. Default route shell policy disallows mocked success', /allowMockedSuccess:\s*false/.test(source.routeShell));
check('23. Default route shell policy disallows live KIS execution', /allowLiveKisExecution:\s*false/.test(source.routeShell));
check('24. Default route shell policy disallows public execution', /allowPublicExecution:\s*false/.test(source.routeShell));
process.stdout.write('\n');

process.stdout.write('Request normalizer:\n');
check('25. Request normalizer exists', /export const normalizeSimilarityApiRouteShellRequest/.test(source.routeShell));
check('26. Request normalizer supports mocked source', /'mocked'/.test(source.routeShell));
check('27. Request normalizer supports kis-normalized source', /kis-normalized/.test(source.routeShell));
check('28. Request normalizer supports owner-local source', /owner-local/.test(source.routeShell));
check('29. Request normalizer does not accept source live', !/'live'/.test(routeShellCode));
check('30. Request normalizer does not accept source auto', !/'auto'/.test(routeShellCode));
process.stdout.write('\n');

process.stdout.write('Feature-flag-off result:\n');
check('31. Feature flag off result builder exists', /export const buildFeatureFlagOffSimilarityApiRouteShellResult/.test(source.routeShell));
check('32. Route shell result builder exists', /export const buildSimilarityApiRouteShellResult/.test(source.routeShell));
check('33. Feature flag off result uses HTTP 503', /httpStatus:\s*503/.test(source.routeShell));
check('34. Feature flag off result sets ok false', /ok:\s*false/.test(source.routeShell));
check('35. Feature flag off result sets status feature_disabled', /status:\s*'feature_disabled'/.test(source.routeShell));
check('36. Feature flag off result sets mode feature-flag-off', /mode:\s*'feature-flag-off'/.test(source.routeShell));
check('37. Feature flag off result sets data null', /data:\s*null/.test(source.routeShell));
check('38. Feature flag off result creates safe error object',
  /code:\s*'feature_disabled'/.test(source.routeShell) &&
  /retryable:\s*false/.test(source.routeShell));
process.stdout.write('\n');

process.stdout.write('Route shell safety:\n');
check('39. Route shell never returns success in this phase', !/ok:\s*true/.test(routeShellCode));
check('40. Route shell does not call real similarity engine', !REAL_ENGINE_IMPORT_PATTERN.test(routeAllCode));
check('41. Route shell does not call KIS', !KIS_CALL_PATTERN.test(routeAllCode));
check('42. Route shell does not import KIS provider/client', !KIS_IMPORT_PATTERN.test(routeAllCode));
check('43. Route shell does not import auth provider', !AUTH_PROVIDER_IMPORT_PATTERN.test(routeAllCode));
check('44. Route shell does not import Supabase', !SUPABASE_IMPORT_PATTERN.test(routeAllCode));
check('45. Route shell does not import DB/cache provider', !DB_CACHE_IMPORT_PATTERN.test(routeAllCode));
check('46. Route shell does not read cookies', !COOKIE_PATTERN.test(routeAllCode));
check('47. Route shell does not read headers', !HEADER_PATTERN.test(routeAllCode));
check('48. Route shell does not read process.env', !/process\.env(\.\w|\[)/.test(routeAllCode));
check('49. Route shell does not read .env',
  !/readFileSync\([^)]*\.env/.test(routeAllCode) && !/require\(['"]dotenv['"]\)/.test(routeAllCode));
check('50. Route shell does not use localStorage/sessionStorage', !STORAGE_ACCESS_PATTERN.test(routeAllCode));
check('51. Route shell does not call fetch', !/\bfetch\(/.test(routeAllCode));
check('52. Route shell does not persist usage', !PERSIST_PATTERN.test(routeAllCode));
check('53. Route shell does not include SQL', !/SELECT\s|INSERT\s|UPDATE\s|DELETE\s|CREATE TABLE/i.test(routeAllCode));
check('54. Route shell does not include DB connection strings', !/connectionString|DATABASE_URL|postgres:\/\/|mysql:\/\//i.test(routeAllCode));
check('55. Route shell does not include token fields', !TOKEN_FIELD_PATTERN.test(routeAllCode));
check('56. Route shell does not include email', !/email/i.test(routeAllCode));
check('57. Route shell does not include IP address', !/ipAddress|ip_address|remoteAddr/i.test(routeAllCode));
check('58. Route shell does not include raw auth payload', !/rawPayload|providerPayload|rawSession/i.test(routeAllCode));
check('59. Route shell does not include raw KIS payload', !RAW_FIELDS.test(routeAllCode));
check('60. Route shell does not include account/trading/order/balance fields', !ACCOUNT_TRADING_PATTERN.test(routeAllCode));
process.stdout.write('\n');

process.stdout.write('Route response type exclusions:\n');
check('61. Route response type does not expose userId', !/userId/i.test(routeTypesCode));
check('62. Route response type does not expose role/authState', !/\brole\b|authState/i.test(routeTypesCode));
process.stdout.write('\n');

process.stdout.write('Result document records:\n');
check('63. Docs record route shell only', /route shell/i.test(source.result));
check('64. Docs record feature flag off', /feature flag off|feature-flag-off/i.test(source.result));
check('65. Docs record no real auth runtime', /no real auth runtime/i.test(source.result));
check('66. Docs record no usage storage implementation', /no usage storage implementation/i.test(source.result));
check('67. Docs record no DB/cache runtime', /no db.{0,10}cache runtime/i.test(source.result));
check('68. Docs record no SQL/migration', /no sql file or migration/i.test(source.result));
check('69. Docs record no KIS call', /no kis call/i.test(source.result));
check('70. Docs record no live similarity execution', /no live similarity execution/i.test(source.result));
check('71. Docs record no UI change', /no.{0,15}chart-ai.{0,10}ui file was changed|no ui change/i.test(source.result));
check('72. Docs record no deployment', /no deployment/i.test(source.result));
check('73. Docs record no push', /no push/i.test(source.result));
check('74. Docs record no .env/process.env read', /no[^\n]*\.env[^\n]*process\.env[^\n]*read/i.test(source.result));
process.stdout.write('\n');

process.stdout.write('Changelog records:\n');
check('75. Changelog records next phase', /next phase/i.test(phaseSection));
process.stdout.write('\n');

process.stdout.write('Forbidden changed paths:\n');
check('76. No src/pages/chart-ai.astro change', !chartAiAstroChanged);
check('77. No other src/pages files changed except src/pages/api/chart-ai/similarity.ts', !pagesChangedOtherThanRoute);
check('78. No src/lib/server/providers files changed', !serverProvidersChanged);
check('79. No src/lib/chartSimilarity files changed', !engineDirChanged);
check('80. No src/data/chartSimilarity files changed', !dataDirChanged);
check('81. No Supabase/migration/SQL files added', !supabaseOrMigrationAdded);
check('82. No Vercel files changed', !vercelChanged);
check('83. No dependency changes', dependenciesUnchanged);
check('84. No devDependency changes', devDependenciesUnchanged);
check('85. No image files added', addedImages.length === 0);
process.stdout.write('\n');

process.stdout.write('Source safety scan:\n');
check('86. Source contains no source=live', !/source\s*=\s*['"]?live/i.test(routeAllSourceRaw));
check('87. Source contains no source=auto', !/source\s*=\s*['"]?auto/i.test(routeAllSourceRaw));
check('88. Source contains no external AI keywords', !EXTERNAL_AI_PATTERN.test(routeAllSourceRaw));
check('89. Source contains no raw KIS response fields', !RAW_FIELDS.test(docScanText));
check('90. Source contains no secret-looking values', !SECRET_VALUE(docScanText));
process.stdout.write('\n');

process.stdout.write('Network and scope safety:\n');
check('91. Checker blocks network access',
  source.checker.includes(
    'Network access is blocked in the Phase 3EZ-C authenticated similarity api route shell feature flag off checker.',
  ) && !fetchAttempted);
check('92. Allowed changed files only', unexpectedChanges.length === 0);
process.stdout.write('\n');

process.stdout.write(`Checks passed: ${passed}/${passed + failed}\n`);
if (failed > 0) {
  process.stdout.write(`Failures: ${failures.join('; ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('All Phase 3EZ-C checks passed.\n');
}
