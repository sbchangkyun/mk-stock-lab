/**
 * Phase 3ES static and behavioral contract.
 * Owner-local KIS OHLC smoke preparation and execution.
 * Static only + injected-transport behavioral tests. No network, no live KIS, no env values,
 * no dev server, no browser, no public API.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error('Network access is blocked in the Phase 3ES owner-local KIS OHLC smoke checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { build } from 'esbuild';

const root = process.cwd();
const startingCommit = 'bab2119';
const paths = {
  result: 'docs/planning/phase_3es_owner_local_kis_ohlc_smoke_result_v0.1.md',
  checker: 'scripts/check_phase_3es_owner_local_kis_ohlc_smoke_contract.mjs',
  changelog: 'docs/planning/planning_changelog.md',
  package: 'package.json',
  page: 'src/pages/chart-ai.astro',
  registry: 'src/lib/server/providers/kis/kisOhlcEndpointRegistry.ts',
  request: 'src/lib/server/providers/kis/kisOhlcRequest.ts',
  mapper: 'src/lib/server/providers/kis/kisOhlcMapper.ts',
  client: 'src/lib/server/providers/kis/kisOwnerLocalOhlcClient.ts',
  script: 'scripts/kis_owner_local_ohlc_smoke.mjs',
  kisClient: 'src/lib/server/providers/kisClient.ts',
};

const read = (relativePath) => {
  try { return readFileSync(join(root, relativePath), 'utf8'); } catch { return ''; }
};
const git = (...args) => {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch { return ''; }
};

const source = Object.fromEntries(Object.entries(paths).map(([key, path]) => [key, read(path)]));
const packageJson = JSON.parse(source.package || '{}');
const baselinePackage = JSON.parse(git('show', `${startingCommit}:package.json`) || '{}');
const phaseSection = source.changelog.split('## Phase 3ES - 2026-07-01')[1]?.split('\n## ')[0] ?? '';
const phaseChanges = new Set(git('diff', '--name-only', startingCommit).split(/\r?\n/).filter(Boolean));
const srcChanges = [...phaseChanges].filter((path) => path.startsWith('src/'));
const apiChanges = srcChanges.filter((path) => path.startsWith('src/pages/api/'));
const supabaseChanges = srcChanges.filter((path) => /supabase/i.test(path));
const migrationChanges = [...phaseChanges].filter((path) => /migration|\.sql$/i.test(path));
const addedFiles = git('diff', '--name-only', '--diff-filter=A', startingCommit).split(/\r?\n/).filter(Boolean);
const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif', '.bmp']);
const addedImages = addedFiles.filter((path) => imageExtensions.has(extname(path).toLowerCase()));
const dependenciesUnchanged = JSON.stringify(packageJson.dependencies ?? {}) === JSON.stringify(baselinePackage.dependencies ?? {});
const devDependenciesUnchanged = JSON.stringify(packageJson.devDependencies ?? {}) === JSON.stringify(baselinePackage.devDependencies ?? {});

const runtimeBundle = await build({
  stdin: {
    contents: `
      export { runOwnerLocalKisOhlcSmoke } from './src/lib/server/providers/kis/kisOwnerLocalOhlcClient.ts';
      export { resolveVerifiedKisOhlcEndpoint, isKisOhlcEndpointVerified } from './src/lib/server/providers/kis/kisOhlcEndpointRegistry.ts';
      export { buildKisOhlcRequestDescriptor } from './src/lib/server/providers/kis/kisOhlcRequest.ts';
    `,
    resolveDir: root,
    sourcefile: 'phase-3es-contract-entry.ts',
    loader: 'ts',
  },
  bundle: true, format: 'esm', platform: 'node', target: 'node18', write: false, logLevel: 'silent',
});
const runtime = await import(`data:text/javascript;base64,${Buffer.from(runtimeBundle.outputFiles[0].text).toString('base64')}`);

let passed = 0;
let failed = 0;
const failures = [];
const check = (label, condition) => {
  if (condition) { passed += 1; process.stdout.write(`  [PASS] ${label}\n`); }
  else { failed += 1; failures.push(label); process.stdout.write(`  [FAIL] ${label}\n`); }
};

process.stdout.write('=== Phase 3ES Owner-Local KIS OHLC Smoke Contract ===\n\n');

process.stdout.write('Files, command, and changelog:\n');
check('Result document exists', existsSync(join(root, paths.result)));                                    // 1
check('Static checker exists', existsSync(join(root, paths.checker)));                                    // 2
check('Package checker command exists',                                                                   // 3
  packageJson.scripts?.['check:phase-3es-owner-local-kis-ohlc-smoke'] ===
    'node scripts/check_phase_3es_owner_local_kis_ohlc_smoke_contract.mjs');
check('Package smoke command exists',                                                                     // 4
  packageJson.scripts?.['smoke:kis-owner-local-ohlc'] === 'node scripts/kis_owner_local_ohlc_smoke.mjs');
check('Changelog contains Phase 3ES', phaseSection.length > 0);                                           // 5
check('Endpoint registry exists', existsSync(join(root, paths.registry)));                                // 6
check('Request descriptor exists', existsSync(join(root, paths.request)));                                // 7
check('Sanitized mapper exists', existsSync(join(root, paths.mapper)));                                   // 8
check('Owner-local smoke client exists', existsSync(join(root, paths.client)));                           // 9
check('Owner-local smoke script exists', existsSync(join(root, paths.script)));                           // 10
process.stdout.write('\n');

process.stdout.write('Endpoint registry and verification:\n');
check('Registry has KR_STOCK_DAILY_OHLC', source.registry.includes('KR_STOCK_DAILY_OHLC'));               // 11
check('Registry has KR_ETF_DAILY_OHLC', source.registry.includes('KR_ETF_DAILY_OHLC'));                   // 12
check('Registry records official verification status', source.registry.includes('verified-official-docs')); // 13
check('Registry records correct tr_id', source.registry.includes('FHKST03010100'));                       // 14
check('Registry records correct path',
  source.registry.includes('/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice'));           // 15
check('KR_STOCK_DAILY_OHLC is verified', runtime.isKisOhlcEndpointVerified('KR_STOCK_DAILY_OHLC') === true); // 16
check('Unverified endpoints are blocked for live smoke',
  runtime.resolveVerifiedKisOhlcEndpoint('US_STOCK_DAILY_OHLC') === null &&
  runtime.resolveVerifiedKisOhlcEndpoint('KR_STOCK_DAILY_OHLC') !== null);                                 // 17
check('Intraday endpoints remain unverified',
  runtime.isKisOhlcEndpointVerified('KR_STOCK_INTRADAY_OHLC') === false);                                 // 18
process.stdout.write('\n');

process.stdout.write('Request descriptor safety:\n');
check('Descriptor resolves KR stock to KR_STOCK_DAILY_OHLC',
  runtime.buildKisOhlcRequestDescriptor({ symbol: '005930', market: 'KR', assetType: 'stock', period: '1m' }).endpointKey === 'KR_STOCK_DAILY_OHLC'); // 19
check('Descriptor produces empty query for unverified market',
  Object.keys(runtime.buildKisOhlcRequestDescriptor({ symbol: 'AAPL', market: 'US', assetType: 'stock', period: '1m' }).query).length === 0); // 20
check('Descriptor produces FID_* query for verified KR request',
  'FID_INPUT_ISCD' in runtime.buildKisOhlcRequestDescriptor({ symbol: '005930', market: 'KR', assetType: 'stock', period: '1m' }).query); // 21
process.stdout.write('\n');

process.stdout.write('Smoke script safety:\n');
check('Smoke script requires KIS_OWNER_LOCAL_SMOKE', source.script.includes('KIS_OWNER_LOCAL_SMOKE'));    // 22
check('Smoke script requires KIS_ALLOW_LIVE_QUOTE', source.script.includes('KIS_ALLOW_LIVE_QUOTE'));      // 23
check('Smoke script requires KIS_ENABLE_LIVE_QUOTES', source.script.includes('KIS_ENABLE_LIVE_QUOTES'));  // 24
check('Smoke script never references secret env names',                                                   // 25
  !/process\.env\.KIS_APP_KEY|process\.env\.KIS_APP_SECRET|process\.env\.KIS_ACCESS_TOKEN|process\.env\.KIS_BASE_URL/.test(source.script));
check('Smoke script does not print raw response body',
  source.script.includes('rawResponsePrinted: false') && !/JSON\.stringify\(\s*result\s*\)/.test(source.script)); // 26
check('Smoke script prints sanitized summary only',
  source.script.includes('KIS owner-local OHLC smoke:') && source.script.includes('secretsPrinted: false')); // 27
process.stdout.write('\n');

process.stdout.write('Smoke client safety and structure:\n');
check('Smoke client validates env presence without printing values',
  source.client.includes('hasEnvValue') && !/console\./.test(source.client) &&
  !/process\.stdout\.write/.test(source.client));                                                         // 28
check('Smoke client uses owner-local gate', source.client.includes('evaluateKisOwnerLocalGate'));        // 29
check('Smoke client uses request descriptor', source.client.includes('buildKisOhlcRequestDescriptor'));  // 30
check('Smoke client maps to NormalizedOhlcSeries', source.client.includes('mapSanitizedKisOhlcToSeries')); // 31
check('Smoke client uses fallback series builder', source.client.includes('buildKisOhlcFallbackSeries')); // 32
check('Smoke client returns sanitized result shape',
  source.client.includes('KisOwnerLocalOhlcSmokeResult') && source.client.includes('fieldPresence'));    // 33
check('Smoke client contains no fetch call', !/\bfetch\s*\(/.test(source.client));                        // 34
check('Smoke client does not require KIS_ACCOUNT_NO',
  !/REQUIRED_KR_ENV_NAMES\s*=\s*\[[^\]]*KIS_ACCOUNT_NO/.test(source.client) &&
  !/process\.env\.KIS_ACCOUNT_NO/.test(source.client));                                                    // 35
check('Smoke client uses no account/trading path',
  !/getKisAccount|placeOrder|submitOrder|inquire-balance|trading-order|잔고|주문/i.test(source.client));    // 36
check('kisClient OHLC transport delegates to approved provider file',
  source.kisClient.includes('getKisDomesticDailyOhlcSeries'));                                            // 37
process.stdout.write('\n');

process.stdout.write('Boundaries: no fixtures, API route, UI wiring, deps:\n');
check('No raw response fixture committed',
  addedFiles.every((path) => !/response.*fixture|fixture.*response|raw.*kis|kis.*raw/i.test(path)));       // 38
check('No public OHLC API route added', addedFiles.every((path) => !path.startsWith('src/pages/api/')));  // 39
check('No API route file changed', apiChanges.length === 0);                                              // 40
check('Chart AI page not wired to OHLC provider modules',
  !source.page.includes('kisOhlc') && !source.page.includes('OhlcRequest') &&
  !source.page.includes('kisOwnerLocalOhlc') && !source.page.includes('kisOhlcMapper'));                  // 41
check('No image file added', addedImages.length === 0);                                                   // 42
check('No dependency added',
  dependenciesUnchanged && devDependenciesUnchanged && !phaseChanges.has('package-lock.json'));           // 43
check('No Supabase file changed', supabaseChanges.length === 0);                                          // 44
check('No migration file added', migrationChanges.length === 0);                                          // 45
process.stdout.write('\n');

process.stdout.write('Result document sanitization:\n');
check('Result document contains smoke decision',
  /##\s*1\.\s*Status[\s\S]*?(PASS|FAIL|BLOCKED)/.test(source.result));                                    // 46
check('Result document contains no app key value',
  !/KIS_APP_KEY['"]?\s*[:=]\s*['"]?[A-Za-z0-9]{8,}/.test(source.result));
check('Result document contains no app secret value',
  !/KIS_APP_SECRET['"]?\s*[:=]\s*['"]?[A-Za-z0-9]{8,}/.test(source.result));
check('Result document contains no access token value',
  !/KIS_ACCESS_TOKEN['"]?\s*[:=]\s*['"]?[A-Za-z0-9]{8,}/.test(source.result) &&
  !/Bearer\s+[A-Za-z0-9._-]{8,}/.test(source.result));
check('Result document contains no authorization header value',
  !/authorization:\s*Bearer/i.test(source.result));
check('Result document contains no raw OHLC response body',
  !/rt_cd|stck_oprc|stck_hgpr|stck_lwpr|stck_clpr|stck_bsop_date|acml_vol/i.test(source.result));
check('Result document records HTTP status class only',
  source.result.includes('HTTP status class') && source.result.includes('not-run'));
check('Result document records field-presence booleans only',
  /open\b/.test(source.result) && /close\b/.test(source.result));
check('Result document confirms public production stays blocked',
  source.result.includes('public production cannot trigger KIS live OHLC behavior'));
check('Result document confirms Chart AI unchanged',
  source.result.includes('chart-ai.astro') && /unchanged/i.test(source.result));
check('Changelog records no deployment', /no deployment/i.test(phaseSection));
check('Changelog records no push', /no push/i.test(phaseSection));
check('Known kis-quote-adapter-mocked issue documented',
  source.result.includes('100/101') && source.result.includes('valuation'));
check('Recommended next phase references 3ET or a Phase 3ES hotfix',
  source.result.includes('Phase 3ET') || source.result.includes('Phase 3ES-HF1') || source.result.includes('Phase 3ES-HF2'));
check('Checker blocks network access',
  source.checker.includes('Network access is blocked in the Phase 3ES owner-local KIS OHLC smoke checker.') && !fetchAttempted);
process.stdout.write('\n');

process.stdout.write('Behavioral (injected transport, no network):\n');
const context = { mode: 'owner-local', allowNetwork: true, allowKisLive: true };
const target = { symbol: '005930', market: 'KR', assetType: 'stock', period: '1m' };
const blockedByGate = await runtime.runOwnerLocalKisOhlcSmoke(
  target, { mode: 'mocked', allowNetwork: false });
check('Gate-blocked run returns BLOCKED', blockedByGate.status === 'BLOCKED' && blockedByGate.isLive === false);

const usBlocked = await runtime.runOwnerLocalKisOhlcSmoke(
  { symbol: 'AAPL', market: 'US', assetType: 'stock', period: '1m' }, context,
  { hasEnvValue: () => true, transportKr: async () => ({ ok: true, httpStatusClass: '2xx', points: [], message: 'ok' }) });
check('Non-KR market run is BLOCKED', usBlocked.status === 'BLOCKED');

const envMissing = await runtime.runOwnerLocalKisOhlcSmoke(
  target, context, { hasEnvValue: () => false });
check('Missing-credential run is BLOCKED with not-run status',
  envMissing.status === 'BLOCKED' && envMissing.httpStatusClass === 'not-run');

const fakeClose = 77777;
const fakePoints = [
  { dateTime: '20260630', open: '70000', high: '71000', low: '69500', close: '70500', volume: '1000000' },
  { dateTime: '20260701', open: '70500', high: '71200', low: '70200', close: String(fakeClose), volume: '1200000' },
  { dateTime: 'bad', open: 'nope', high: null, low: undefined, close: '', volume: '900000' },
];
const passResult = await runtime.runOwnerLocalKisOhlcSmoke(
  target, context,
  { hasEnvValue: () => true, transportKr: async () => ({ ok: true, httpStatusClass: '2xx', points: fakePoints, message: 'ok' }) });
check('Fake-transport run returns PASS with safe series',
  passResult.status === 'PASS' && passResult.normalizedSeriesSafe === true && passResult.isLive === true);
check('PASS result records field-presence booleans',
  passResult.fieldPresence.open === true && passResult.fieldPresence.close === true);
check('PASS result has pointCount >= 2 and is renderable',
  passResult.pointCount >= 2 && passResult.renderable === true);
check('Invalid point values map to null, not raw strings',
  passResult.normalizedSeriesSafe === true);
check('Sanitized result leaks no OHLC value',
  !JSON.stringify(passResult).includes(String(fakeClose)));

const failResult = await runtime.runOwnerLocalKisOhlcSmoke(
  target, context,
  { hasEnvValue: () => true, transportKr: async () => ({ ok: false, httpStatusClass: '5xx', message: 'Transport error: PROVIDER_UNAVAILABLE' }) });
check('Transport failure returns FAIL and no live series',
  failResult.status === 'FAIL' && failResult.isLive === false && failResult.source === 'unavailable');

const emptyPointsResult = await runtime.runOwnerLocalKisOhlcSmoke(
  target, context,
  { hasEnvValue: () => true, transportKr: async () => ({ ok: true, httpStatusClass: '2xx', points: [], message: 'ok' }) });
check('Zero-point transport success returns FAIL, not a false PASS',
  emptyPointsResult.status === 'FAIL' && emptyPointsResult.pointCount === 0);
process.stdout.write('\n');

process.stdout.write(`Checks passed: ${passed}/${passed + failed}\n`);
if (failed > 0) {
  process.stdout.write(`Failures: ${failures.join('; ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('All Phase 3ES checks passed.\n');
}
