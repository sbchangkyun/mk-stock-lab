/**
 * Phase 3EY-B documentation and source contract.
 * Server-only KIS OHLC provider contract and mocked adapter test.
 * Static only: no network, browser, dev server, API, provider, live KIS, external AI, or environment access.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error('Network access is blocked in the Phase 3EY-B server-only kis ohlc provider contract mocked adapter test checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = process.cwd();
const startingCommit = '2dcd590';

const paths = {
  planning: 'docs/planning/phase_3ey_b_server_only_kis_ohlc_provider_contract_mocked_adapter_test_v0.1.md',
  result: 'docs/planning/phase_3ey_b_server_only_kis_ohlc_provider_contract_mocked_adapter_test_result_v0.1.md',
  changelog: 'docs/planning/planning_changelog.md',
  checker: 'scripts/check_phase_3ey_b_server_only_kis_ohlc_provider_contract_mocked_adapter_test_contract.mjs',
  smoke: 'scripts/smoke_phase_3ey_b_server_only_kis_ohlc_provider_mocked_adapter.mjs',
  package: 'package.json',
  serverDir: 'src/lib/server/chartSimilarity',
  types: 'src/lib/server/chartSimilarity/kisOhlcProviderTypes.ts',
  policy: 'src/lib/server/chartSimilarity/kisOhlcProviderPolicy.ts',
  provider: 'src/lib/server/chartSimilarity/serverOnlyKisOhlcProvider.ts',
  index: 'src/lib/server/chartSimilarity/index.ts',
  mockedAdapter: 'src/lib/server/chartSimilarity/mockedKisOhlcAdapter.ts',
  mockedFixtures: 'src/lib/server/chartSimilarity/mockedKisOhlcFixtures.ts',
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
const phaseSection = source.changelog.split('## Phase 3EY-B - 2026-07-03')[1]?.split('\n## ')[0] ?? '';
const docScanText = `${source.planning}\n${source.result}\n${phaseSection}`;
const serverAllSource = `${source.types}\n${source.policy}\n${source.provider}\n${source.index}\n${source.mockedAdapter}\n${source.mockedFixtures}`;

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
const REAL_STOCK_CODE_PATTERN = /\b\d{6}\b/;

const pagesChanged = [...phaseChanges].some((path) => path.startsWith('src/pages/') && !path.startsWith('src/pages/api/'));
const apiChanged = [...phaseChanges].some((path) => path.startsWith('src/pages/api/'));
const serverProvidersChanged = [...phaseChanges].some((path) => path.startsWith('src/lib/server/providers/'));
const supabaseOrMigrationAdded = addedFiles.some((path) => /migration|\.sql$/i.test(path) || /supabase/i.test(path));
const vercelChanged = [...phaseChanges].some((path) => VERCEL_FILE_PATTERN.test(path));

const allowedChangedPathPrefixes = ['src/lib/server/chartSimilarity/'];
const allowedChangedPaths = new Set([
  'docs/planning/phase_3ey_b_server_only_kis_ohlc_provider_contract_mocked_adapter_test_v0.1.md',
  'docs/planning/phase_3ey_b_server_only_kis_ohlc_provider_contract_mocked_adapter_test_result_v0.1.md',
  'docs/planning/planning_changelog.md',
  'scripts/check_phase_3ey_b_server_only_kis_ohlc_provider_contract_mocked_adapter_test_contract.mjs',
  'scripts/smoke_phase_3ey_b_server_only_kis_ohlc_provider_mocked_adapter.mjs',
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

process.stdout.write('=== Phase 3EY-B Server-only KIS OHLC Provider Contract and Mocked Adapter Test ===\n\n');

process.stdout.write('Files and changelog:\n');
check('Planning document exists', existsSync(join(root, paths.planning)));                                          // 1
check('Result document exists', existsSync(join(root, paths.result)));                                              // 2
check('Checker exists', existsSync(join(root, paths.checker)));                                                     // 3
check('Smoke script exists', existsSync(join(root, paths.smoke)));                                                  // 4
check('Package checker script exists',                                                                              // 5
  packageJson.scripts?.['check:phase-3ey-b-server-only-kis-ohlc-provider-contract-mocked-adapter-test'] ===
    'node scripts/check_phase_3ey_b_server_only_kis_ohlc_provider_contract_mocked_adapter_test_contract.mjs');
check('Package smoke script exists',                                                                                // 6
  packageJson.scripts?.['smoke:phase-3ey-b-server-only-kis-ohlc-provider-mocked-adapter'] ===
    'node scripts/smoke_phase_3ey_b_server_only_kis_ohlc_provider_mocked_adapter.mjs');
check('Changelog contains Phase 3EY-B', phaseSection.length > 0);                                                    // 7
process.stdout.write('\n');

process.stdout.write('Preserved 3EY-A foundation files:\n');
check('Server chartSimilarity directory exists', existsSync(join(root, paths.serverDir)));                          // 8
check('3EY-A provider types still exist',                                                                            // 9
  existsSync(join(root, paths.types)) && /ServerOnlyKisOhlcProviderStatus/.test(source.types));
check('3EY-A provider policy still exists',                                                                          // 10
  existsSync(join(root, paths.policy)) && /buildDefaultServerOnlyKisOhlcPolicy/.test(source.policy));
check('3EY-A disabled provider foundation still exists',                                                             // 11
  existsSync(join(root, paths.provider)) && /getServerOnlyKisOhlcForSimilarity/.test(source.provider));
check('Server index export still exists', existsSync(join(root, paths.index)));                                     // 12
process.stdout.write('\n');

process.stdout.write('Mocked adapter and fixtures:\n');
check('Mocked adapter file exists', existsSync(join(root, paths.mockedAdapter)));                                    // 13
check('Mocked fixtures file exists', existsSync(join(root, paths.mockedFixtures)));                                  // 14
check('Mocked adapter exports getMockedServerOnlyKisOhlcForSimilarity',                                              // 15
  /export const getMockedServerOnlyKisOhlcForSimilarity/.test(source.mockedAdapter));
check('Mocked adapter uses normalizeServerOnlyKisOhlcRequest',                                                       // 16
  /normalizeServerOnlyKisOhlcRequest/.test(source.mockedAdapter));
check('Mocked adapter uses validateServerOnlyKisOhlcRequest',                                                        // 17
  /validateServerOnlyKisOhlcRequest/.test(source.mockedAdapter));
check('Mocked adapter uses toSimilarityOhlcBarsFromNormalizedDailyBars',                                             // 18
  /toSimilarityOhlcBarsFromNormalizedDailyBars/.test(source.mockedAdapter));
check('Mocked adapter returns disabled when policy disabled',                                                        // 19
  /status:\s*'disabled'/.test(source.mockedAdapter) && /policy\.enabled/.test(source.mockedAdapter));
check('Mocked adapter returns ready only for enabled mocked contract',                                               // 20
  /status:\s*'ready'/.test(source.mockedAdapter));
check('Mocked adapter returns blocked for invalid request',                                                          // 21
  /status:\s*'blocked'/.test(source.mockedAdapter));
check('Mocked adapter handles empty mapped bars safely',                                                             // 22
  /bars\.length === 0/.test(source.mockedAdapter));
check('Mocked adapter returns safeMessage', /safeMessage/.test(source.mockedAdapter));                               // 23
process.stdout.write('\n');

process.stdout.write('Mocked fixture safety:\n');
check('Mocked fixtures use synthetic/fixed arithmetic only',                                                         // 24
  /Math\.sin\(|Math\.cos\(/.test(source.mockedFixtures));
check('Mocked fixtures do not use Math.random', !/Math\.random\(/.test(source.mockedFixtures));                     // 25
check('Mocked fixtures do not use Date.now', !/Date\.now\(/.test(source.mockedFixtures));                            // 26
check('Mocked fixtures do not contain real stock codes', !REAL_STOCK_CODE_PATTERN.test(source.mockedFixtures));      // 27
check('Mocked fixtures do not contain raw KIS field names', !RAW_FIELDS.test(source.mockedFixtures));                // 28
process.stdout.write('\n');

process.stdout.write('Mocked adapter provider-boundary safety:\n');
check('Mocked adapter contains no fetch', !/\bfetch\(/.test(source.mockedAdapter));                                  // 29
check('Mocked adapter imports no KIS provider/client module', !KIS_IMPORT_PATTERN.test(source.mockedAdapter));       // 30
check('Server provider files do not read process.env', !/process\.env(\.\w|\[)/.test(serverAllSource));             // 31
check('Server provider files do not read .env',                                                                     // 32
  !/readFileSync\([^)]*\.env/.test(serverAllSource) && !/require\(['"]dotenv['"]\)/.test(serverAllSource));
process.stdout.write('\n');

process.stdout.write('Smoke script contract:\n');
check('Smoke script copies TS files to temp directory',                                                             // 33
  /mkdtempSync/.test(source.smoke) && /tmpdir/.test(source.smoke));
check('Smoke script rewrites copied relative imports only',                                                         // 34
  /rewriteRelativeImports/.test(source.smoke) && /IMPORT_SPECIFIER_PATTERN/.test(source.smoke));
check('Smoke script cleans temp directory', /rmSync/.test(source.smoke) && /finally/.test(source.smoke));           // 35
check('Smoke script checks disabled provider',                                                                       // 36
  /disabledResult/.test(source.smoke) && /'disabled'/.test(source.smoke));
check('Smoke script checks not_implemented provider',                                                                // 37
  /notImplementedResult/.test(source.smoke) && /'not_implemented'/.test(source.smoke));
check('Smoke script checks invalid request blocked',                                                                 // 38
  /invalidSymbolResult/.test(source.smoke) && /'blocked'/.test(source.smoke));
check('Smoke script checks mocked adapter ready path',                                                               // 39
  /mockedReadyResult/.test(source.smoke) && /'ready'/.test(source.smoke));
check('Smoke script checks OhlcBar source kis-normalized', /kis-normalized/.test(source.smoke));                     // 40
check('Smoke script checks no NaN/Infinity', /hasNonFinite/.test(source.smoke));                                     // 41
check('Smoke script checks invalid bars',                                                                            // 42
  /invalidMockedBars/.test(source.smoke) && /invalidBarsResult/.test(source.smoke));
check('Smoke script checks raw KIS fields absent', /RAW_KIS_FIELD_PATTERN/.test(source.smoke));                      // 43
check('Smoke script checks secret-looking values absent', /SECRET_LOOKING_PATTERN/.test(source.smoke));              // 44
process.stdout.write('\n');

process.stdout.write('Result document preserved-boundary records:\n');
check('Result doc status implemented', /Implemented/.test(source.result));                                          // 45
check('Result doc records no KIS call', /no kis call/i.test(source.result));                                        // 46
check('Result doc records no API route', /no api route/i.test(source.result));                                      // 47
check('Result doc records no UI change', /no `?\/chart-ai`? ui change/i.test(source.result));                       // 48
check('Result doc records no DB/SQL/migration',                                                                     // 49
  /no db(\/| or )cache runtime/i.test(source.result) && /no sql(\/| or )migration/i.test(source.result));
check('Result doc records no auth/usage runtime', /no auth(\/| or )usage( guard)? runtime/i.test(source.result));   // 50
check('Result doc records no external AI', /no external ai/i.test(source.result));                                  // 51
check('Result doc records no deployment', /no deployment/i.test(source.result));                                    // 52
check('Result doc records no push', /no push|no `?git push`? performed/i.test(source.result));                      // 53
check('Result doc records no .env read', /no `?\.env`?[^\n]{0,20}read/i.test(source.result));                       // 54
process.stdout.write('\n');

process.stdout.write('Changelog records:\n');
check('Changelog records mocked adapter contract', /mocked adapter/i.test(phaseSection));                           // 55
check('Changelog records next phase', /next phase/i.test(phaseSection));                                            // 56
process.stdout.write('\n');

process.stdout.write('Forbidden changed paths:\n');
check('No src/pages files changed', !pagesChanged);                                                                  // 57
check('No src/pages/api files changed', !apiChanged);                                                                // 58
check('No src/lib/server/providers files changed', !serverProvidersChanged);                                        // 59
check('No Supabase/migration files added', !supabaseOrMigrationAdded);                                               // 60
check('No Vercel files changed', !vercelChanged);                                                                    // 61
check('No dependency changes', dependenciesUnchanged);                                                               // 62
check('No devDependency changes', devDependenciesUnchanged);                                                         // 63
check('No image files added', addedImages.length === 0);                                                             // 64
process.stdout.write('\n');

process.stdout.write('Source safety scan:\n');
check('Source contains no source=live', !/source\s*=\s*['"]?live/i.test(serverAllSource));                           // 65
check('Source contains no source=auto', !/source\s*=\s*['"]?auto/i.test(serverAllSource));                           // 66
check('Source contains no account/trading/order/balance APIs', !ACCOUNT_TRADING_PATTERN.test(serverAllSource));      // 67
check('Source contains no external AI keywords', !EXTERNAL_AI_PATTERN.test(serverAllSource));                        // 68
check('Docs contain no raw KIS response fields', !RAW_FIELDS.test(docScanText));                                      // 69
check('Docs contain no secret-looking values', !SECRET_VALUE(docScanText));                                          // 70
process.stdout.write('\n');

process.stdout.write('Network and scope safety:\n');
check('Checker blocks network access',                                                                               // 71
  source.checker.includes('Network access is blocked in the Phase 3EY-B server-only kis ohlc provider contract mocked adapter test checker.') &&
  !fetchAttempted);
check('Only allowed paths changed since starting commit', unexpectedChanges.length === 0);                           // 72
process.stdout.write('\n');

process.stdout.write(`Checks passed: ${passed}/${passed + failed}\n`);
if (failed > 0) {
  process.stdout.write(`Failures: ${failures.join('; ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('All Phase 3EY-B checks passed.\n');
}
