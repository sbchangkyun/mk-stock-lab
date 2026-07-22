/**
 * Phase 3EY-A documentation and source contract.
 * Server-only KIS OHLC provider planning/foundation.
 * Static only: no network, browser, dev server, API, provider, live KIS, external AI, or environment access.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error('Network access is blocked in the Phase 3EY-A server-only kis ohlc provider planning foundation checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = process.cwd();
const startingCommit = '007208a';

const paths = {
  planning: 'docs/planning/phase_3ey_a_server_only_kis_ohlc_provider_planning_foundation_v0.1.md',
  result: 'docs/planning/phase_3ey_a_server_only_kis_ohlc_provider_planning_foundation_result_v0.1.md',
  changelog: 'docs/planning/planning_changelog.md',
  checker: 'scripts/check_phase_3ey_a_server_only_kis_ohlc_provider_planning_foundation_contract.mjs',
  package: 'package.json',
  serverDir: 'src/lib/server/chartSimilarity',
  types: 'src/lib/server/chartSimilarity/kisOhlcProviderTypes.ts',
  policy: 'src/lib/server/chartSimilarity/kisOhlcProviderPolicy.ts',
  provider: 'src/lib/server/chartSimilarity/serverOnlyKisOhlcProvider.ts',
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

const source = Object.fromEntries(
  Object.entries(paths)
    .filter(([key]) => key !== 'serverDir')
    .map(([key, path]) => [key, read(path)]),
);
const packageJson = JSON.parse(source.package || '{}');
const baselinePackage = JSON.parse(git('show', `${startingCommit}:package.json`) || '{}');
const phaseSection = source.changelog.split('## Phase 3EY-A - 2026-07-03')[1]?.split('\n## ')[0] ?? '';
const docScanText = `${source.planning}\n${source.result}\n${phaseSection}`;
const providerSource = `${source.types}\n${source.policy}\n${source.provider}\n${source.index}`;

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
const VERCEL_FILE_PATTERN = /(^|\/)vercel\.(json|ts)$|(^|\/)\.vercel\//i;

const pagesChanged = [...phaseChanges].some((path) => path.startsWith('src/pages/') && !path.startsWith('src/pages/api/'));
const apiChanged = [...phaseChanges].some((path) => path.startsWith('src/pages/api/'));
const serverProvidersChanged = [...phaseChanges].some((path) => path.startsWith('src/lib/server/providers/'));
const supabaseOrMigrationAdded = addedFiles.some((path) => /migration|\.sql$/i.test(path) || /supabase/i.test(path));
const vercelChanged = [...phaseChanges].some((path) => VERCEL_FILE_PATTERN.test(path));

const allowedChangedPathPrefixes = ['src/lib/server/chartSimilarity/'];
const allowedChangedPaths = new Set([
  'docs/planning/phase_3ey_a_server_only_kis_ohlc_provider_planning_foundation_v0.1.md',
  'docs/planning/phase_3ey_a_server_only_kis_ohlc_provider_planning_foundation_result_v0.1.md',
  'docs/planning/planning_changelog.md',
  'scripts/check_phase_3ey_a_server_only_kis_ohlc_provider_planning_foundation_contract.mjs',
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

process.stdout.write('=== Phase 3EY-A Server-only KIS OHLC Provider Planning/Foundation Contract ===\n\n');

process.stdout.write('Files and changelog:\n');
check('Planning/foundation document exists', existsSync(join(root, paths.planning)));                              // 1
check('Result document exists', existsSync(join(root, paths.result)));                                              // 2
check('Checker exists', existsSync(join(root, paths.checker)));                                                     // 3
check('Package checker script exists',                                                                              // 4
  packageJson.scripts?.['check:phase-3ey-a-server-only-kis-ohlc-provider-planning-foundation'] ===
    'node scripts/check_phase_3ey_a_server_only_kis_ohlc_provider_planning_foundation_contract.mjs');
check('Changelog contains Phase 3EY-A', phaseSection.length > 0);                                                    // 5
process.stdout.write('\n');

process.stdout.write('Server-only provider foundation files:\n');
check('Server chartSimilarity directory exists', existsSync(join(root, paths.serverDir)));                          // 6
check('Provider types file exists', existsSync(join(root, paths.types)));                                           // 7
check('Provider policy file exists', existsSync(join(root, paths.policy)));                                         // 8
check('Disabled provider foundation file exists', existsSync(join(root, paths.provider)));                          // 9
check('Server index export file exists', existsSync(join(root, paths.index)));                                      // 10
process.stdout.write('\n');

process.stdout.write('Type foundation:\n');
check('Types include ServerOnlyKisOhlcProviderStatus', /ServerOnlyKisOhlcProviderStatus/.test(source.types));       // 11
check('Types include ServerOnlyKisOhlcRequest', /ServerOnlyKisOhlcRequest/.test(source.types));                     // 12
check('Types include ServerOnlyKisOhlcPolicy', /ServerOnlyKisOhlcPolicy/.test(source.types));                       // 13
check('Types include ServerOnlyKisOhlcResult', /ServerOnlyKisOhlcResult/.test(source.types));                       // 14
check('Request type is KR/daily/chart-similarity scoped',
  /market:\s*'KR'/.test(source.types) &&
    /timeframe:\s*'daily'/.test(source.types) &&
    /purpose:\s*'chart-similarity'/.test(source.types));                                                             // 15
process.stdout.write('\n');

process.stdout.write('Policy defaults:\n');
check('Policy default enabled false', /enabled:\s*false/.test(source.policy));                                       // 16
check('Policy requires auth', /requireAuth:\s*true/.test(source.policy));                                            // 17
check('Policy requires usage guard', /requireUsageGuard:\s*true/.test(source.policy));                               // 18
check('Policy disallows public execution', /allowPublicExecution:\s*false/.test(source.policy));                     // 19
check('Policy disallows client secret exposure', /allowClientSecretExposure:\s*false/.test(source.policy));          // 20
check('Policy disallows raw provider payload', /allowRawProviderPayload:\s*false/.test(source.policy));              // 21
process.stdout.write('\n');

process.stdout.write('Disabled-by-default provider foundation:\n');
check('Provider returns disabled when policy disabled',
  /status:\s*'disabled'/.test(source.provider) && /policy\.enabled/.test(source.provider));                          // 22
check('Provider returns not_implemented if enabled but live wiring deferred',
  /status:\s*'not_implemented'/.test(source.provider));                                                              // 23
check('Provider does not call fetch', !/\bfetch\(/.test(providerSource));                                            // 24
check('Provider does not import KIS provider/client modules', !KIS_IMPORT_PATTERN.test(providerSource));             // 25
check('Provider does not read process.env', !/process\.env(\.\w|\[)/.test(providerSource));                          // 26
check('Provider does not read .env', !/readFileSync\([^)]*\.env/.test(providerSource) && !/require\(['"]dotenv['"]\)/.test(providerSource)); // 27
check('Provider returns safeMessage', /safeMessage/.test(source.provider));                                          // 28
process.stdout.write('\n');

process.stdout.write('Request validation/normalization:\n');
check('Provider validates/sanitizes symbol', /symbol\.length === 0/.test(source.provider) || /invalid_symbol/.test(source.provider)); // 29
check('Provider validates/sanitizes lookbackYears', /lookbackYears/.test(source.provider) && /MAX_LOOKBACK_YEARS/.test(source.provider)); // 30
check('Provider validates/sanitizes maxBars', /maxBars/.test(source.provider) && /MAX_BARS/.test(source.provider));  // 31
check('Provider blocks non-KR market', /invalid_market/.test(source.provider));                                      // 32
check('Provider blocks non-daily timeframe', /invalid_timeframe/.test(source.provider));                             // 33
check('Provider blocks invalid assetType', /invalid_asset_type/.test(source.provider));                              // 34
process.stdout.write('\n');

process.stdout.write('Normalized bar adapter placeholder:\n');
check('Adapter uses already-normalized safe bars only if implemented',
  /toSimilarityOhlcBarsFromNormalizedDailyBars/.test(source.provider) &&
    /NormalizedDailyOhlcInput/.test(source.provider));                                                               // 35
check('Adapter does not contain raw KIS field names', !RAW_FIELDS.test(providerSource));                             // 36
check('Adapter maps to OhlcBar source "kis-normalized" if implemented',
  /source:\s*'kis-normalized'/.test(source.provider));                                                               // 37
process.stdout.write('\n');

process.stdout.write('Forbidden changed paths:\n');
check('No src/pages files changed', !pagesChanged);                                                                  // 38
check('No src/pages/api files changed', !apiChanged);                                                                // 39
check('No src/lib/server/providers files changed', !serverProvidersChanged);                                        // 40
check('No Supabase/migration files added', !supabaseOrMigrationAdded);                                               // 41
check('No Vercel files changed', !vercelChanged);                                                                    // 42
check('No dependency changes', dependenciesUnchanged);                                                               // 43
check('No devDependency changes', devDependenciesUnchanged);                                                         // 44
check('No image files added', addedImages.length === 0);                                                             // 45
process.stdout.write('\n');

process.stdout.write('Documentation preserved-boundary records:\n');
check('Docs record no KIS call', /no kis call/i.test(docScanText));                                                  // 46
check('Docs record no API route', /no api route/i.test(docScanText));                                                // 47
check('Docs record no UI change', /no `?\/chart-ai`? ui change/i.test(docScanText));                                 // 48
check('Docs record no DB/SQL/migration',
  /no db(\/| or )cache runtime/i.test(docScanText) && /no sql(\/| or )migration/i.test(docScanText));                // 49
check('Docs record no auth/usage runtime', /no auth(\/| or )usage( guard)? runtime/i.test(docScanText));             // 50
check('Docs record no external AI', /no external ai/i.test(docScanText));                                            // 51
check('Docs record no deployment', /no deployment/i.test(docScanText));                                              // 52
check('Docs record no push', /no push|no `?git push`? performed/i.test(docScanText));                                // 53
check('Docs record no .env read', /no `?\.env`?[^\n]{0,20}read/i.test(docScanText));                                 // 54
check('Docs record no actual market values', /no actual[^\n]{0,20}market values/i.test(docScanText));                // 55
process.stdout.write('\n');

process.stdout.write('Source safety scan:\n');
check('Source contains no source=live', !/source\s*=\s*['"]?live/i.test(providerSource));                            // 56
check('Source contains no source=auto', !/source\s*=\s*['"]?auto/i.test(providerSource));                            // 57
check('Source contains no account/trading/order/balance APIs', !ACCOUNT_TRADING_PATTERN.test(providerSource));       // 58
check('Source contains no external AI keywords', !EXTERNAL_AI_PATTERN.test(providerSource));                        // 59
check('Docs contain no raw KIS response fields', !RAW_FIELDS.test(docScanText));                                     // 60
check('Docs contain no secret-looking values', !SECRET_VALUE(docScanText));                                          // 61
process.stdout.write('\n');

process.stdout.write('Network and scope safety:\n');
check('Checker blocks network access',
  source.checker.includes('Network access is blocked in the Phase 3EY-A server-only kis ohlc provider planning foundation checker.') &&
  !fetchAttempted);                                                                                                  // 62
check('Only allowed paths changed since starting commit', unexpectedChanges.length === 0);                           // 63
process.stdout.write('\n');

process.stdout.write(`Checks passed: ${passed}/${passed + failed}\n`);
if (failed > 0) {
  process.stdout.write(`Failures: ${failures.join('; ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('All Phase 3EY-A checks passed.\n');
}
