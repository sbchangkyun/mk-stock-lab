/**
 * Phase 3EO static and behavioral contract.
 * Owner-local KIS quote smoke preparation and execution.
 * Static only + injected-transport behavioral tests. No network, no live KIS, no env values,
 * no dev server, no browser, no public API.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error('Network access is blocked in the Phase 3EO owner-local KIS quote smoke checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { build } from 'esbuild';

const root = process.cwd();
const startingCommit = '75621c6';
// Pinned to this phase's own ending commit so later phases (e.g. Phase 3EP preview wiring) do not
// pollute this phase-scoped diff. Content checks still read current working-tree files.
const endingCommit = '86539e0';
const paths = {
  result: 'docs/planning/phase_3eo_owner_local_kis_quote_smoke_result_v0.1.md',
  template: 'docs/planning/phase_3eo_owner_local_kis_quote_smoke_result_template_v0.1.md',
  checker: 'scripts/check_phase_3eo_owner_local_kis_quote_smoke_contract.mjs',
  changelog: 'docs/planning/planning_changelog.md',
  package: 'package.json',
  page: 'src/pages/chart-ai.astro',
  registry: 'src/lib/server/providers/kis/kisQuoteEndpointRegistry.ts',
  client: 'src/lib/server/providers/kis/kisOwnerLocalQuoteClient.ts',
  script: 'scripts/kis_owner_local_quote_smoke.mjs',
  env: 'src/lib/server/providers/kis/kisEnvContract.ts',
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
const phaseSection = source.changelog.split('## Phase 3EO - 2026-07-01')[1]?.split('\n## ')[0] ?? '';
const phaseChanges = new Set(git('diff', '--name-only', startingCommit, endingCommit).split(/\r?\n/).filter(Boolean));
const srcChanges = [...phaseChanges].filter((path) => path.startsWith('src/'));
const apiChanges = srcChanges.filter((path) => path.startsWith('src/pages/api/'));
const supabaseChanges = srcChanges.filter((path) => /supabase/i.test(path));
const migrationChanges = [...phaseChanges].filter((path) => /migration|\.sql$/i.test(path));
const addedFiles = git('diff', '--name-only', '--diff-filter=A', startingCommit, endingCommit).split(/\r?\n/).filter(Boolean);
const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif', '.bmp']);
const addedImages = addedFiles.filter((path) => imageExtensions.has(extname(path).toLowerCase()));
const dependenciesUnchanged = JSON.stringify(packageJson.dependencies ?? {}) === JSON.stringify(baselinePackage.dependencies ?? {});
const devDependenciesUnchanged = JSON.stringify(packageJson.devDependencies ?? {}) === JSON.stringify(baselinePackage.devDependencies ?? {});

const runtimeBundle = await build({
  stdin: {
    contents: `
      export { runOwnerLocalKisQuoteSmoke } from './src/lib/server/providers/kis/kisOwnerLocalQuoteClient.ts';
      export { resolveVerifiedKisQuoteEndpoint, isKisQuoteEndpointVerified } from './src/lib/server/providers/kis/kisQuoteEndpointRegistry.ts';
    `,
    resolveDir: root,
    sourcefile: 'phase-3eo-contract-entry.ts',
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

process.stdout.write('=== Phase 3EO Owner-Local KIS Quote Smoke Contract ===\n\n');

process.stdout.write('Files, command, and changelog:\n');
check('Result document exists', existsSync(join(root, paths.result)));                                    // 1
check('Smoke result template exists', existsSync(join(root, paths.template)));                            // 2
check('Static checker exists', existsSync(join(root, paths.checker)));                                    // 3
check('Package checker command exists',                                                                   // 4
  packageJson.scripts?.['check:phase-3eo-owner-local-kis-quote-smoke'] ===
    'node scripts/check_phase_3eo_owner_local_kis_quote_smoke_contract.mjs');
check('Changelog contains Phase 3EO', phaseSection.length > 0);                                           // 5
check('Endpoint registry exists', existsSync(join(root, paths.registry)));                                // 6
check('Owner-local smoke client exists', existsSync(join(root, paths.client)));                           // 7
check('Owner-local smoke script exists', existsSync(join(root, paths.script)));                           // 8
process.stdout.write('\n');

process.stdout.write('Endpoint registry and verification:\n');
check('Registry has KR_STOCK_QUOTE', source.registry.includes('KR_STOCK_QUOTE'));                        // 9
check('Registry records official verification status', source.registry.includes("verified-official-docs")); // 10
check('KR_STOCK_QUOTE is verified', runtime.isKisQuoteEndpointVerified('KR_STOCK_QUOTE') === true);       // 10b
check('Unverified endpoints are blocked for live smoke',
  runtime.resolveVerifiedKisQuoteEndpoint('US_STOCK_QUOTE') === null &&
  runtime.resolveVerifiedKisQuoteEndpoint('KR_STOCK_QUOTE') !== null);                                    // 11
process.stdout.write('\n');

process.stdout.write('Smoke script safety:\n');
check('Smoke script requires KIS_OWNER_LOCAL_SMOKE', source.script.includes('KIS_OWNER_LOCAL_SMOKE'));    // 13-ish/13
check('Smoke script requires KIS_ALLOW_LIVE_QUOTE', source.script.includes('KIS_ALLOW_LIVE_QUOTE'));      // 14/13
check('Smoke script never references secret env names',                                                   // 15
  !/process\.env\.KIS_APP_KEY|process\.env\.KIS_APP_SECRET|process\.env\.KIS_ACCESS_TOKEN|process\.env\.KIS_BASE_URL/.test(source.script));
check('Smoke script does not print raw response body',
  source.script.includes('rawResponsePrinted: false') && !/JSON\.stringify\(\s*result\s*\)/.test(source.script)); // 16
check('Smoke script prints sanitized summary only',
  source.script.includes('KIS owner-local quote smoke:') && source.script.includes('secretsPrinted: false')); // 17
process.stdout.write('\n');

process.stdout.write('Smoke client safety and structure:\n');
check('Smoke client validates env presence without printing values',
  source.client.includes('hasEnvValue') && !/console\./.test(source.client) &&
  !/process\.stdout\.write/.test(source.client));                                                         // 18
check('Smoke client uses owner-local gate', source.client.includes('evaluateKisOwnerLocalGate'));        // 19
check('Smoke client uses endpoint registry', source.client.includes('resolveVerifiedKisQuoteEndpoint')); // 20
check('Smoke client maps to NormalizedQuoteSnapshot',
  source.client.includes('mapSanitizedKisQuoteToSnapshot'));                                              // 21
check('Smoke client returns sanitized result shape',
  source.client.includes('KisOwnerLocalQuoteSmokeResult') && source.client.includes('normalizedFieldsPresent')); // 22
check('Smoke client contains no fetch call', !/\bfetch\s*\(/.test(source.client));
check('Smoke client does not require KIS_ACCOUNT_NO', !source.client.includes('KIS_ACCOUNT_NO'));         // 29
check('Smoke client uses no account/trading path',
  !/getKisAccount|placeOrder|submitOrder|inquire-balance|trading-order|잔고|주문/i.test(source.client));    // 28
process.stdout.write('\n');

process.stdout.write('Boundaries: no fixtures, API route, UI wiring, deps:\n');
check('No raw response fixture committed',
  addedFiles.every((path) => !/response.*fixture|fixture.*response|raw.*kis|kis.*raw/i.test(path)));       // 23
check('No provider payload committed',
  addedFiles.every((path) => !/payload/i.test(path)));                                                     // 24
check('No public quote API route added', addedFiles.every((path) => !path.startsWith('src/pages/api/'))); // 25
check('No /api/market/quote route added', !addedFiles.includes('src/pages/api/market/quote.ts'));         // 26
check('No API route file changed', apiChanges.length === 0);
check('No ungated Chart AI quote UI wiring (server quote modules not imported; only gated preview allowed)',
  !source.page.includes('normalizedQuote') && !source.page.includes('quoteProvider') &&
  !source.page.includes('kisQuote') &&
  (!source.page.includes('quote-preview') ||
    (source.page.includes('owner-local-quote-preview') && source.page.includes('owner-local'))));          // 27
check('KIS_ACCOUNT_NO documented as non-quote scope',
  source.env.includes('KIS_NON_QUOTE_ENV_KEYS') && source.env.includes('KIS_ACCOUNT_NO'));                // 29b
check('No image file added', addedImages.length === 0);                                                   // 30
check('No dependency added',
  dependenciesUnchanged && devDependenciesUnchanged && !phaseChanges.has('package-lock.json'));           // 31
check('No Supabase file changed', supabaseChanges.length === 0);                                          // 32a
check('No migration file added', migrationChanges.length === 0);                                          // 32b
process.stdout.write('\n');

process.stdout.write('Result document sanitization:\n');
check('Result document contains smoke decision',
  /##\s*1\.\s*Status[\s\S]*?(PASS|FAIL|BLOCKED)/.test(source.result));                                    // 33
check('Result document contains no app key value',
  !/KIS_APP_KEY['"]?\s*[:=]\s*['"]?[A-Za-z0-9]{8,}/.test(source.result));                                 // 34
check('Result document contains no app secret value',
  !/KIS_APP_SECRET['"]?\s*[:=]\s*['"]?[A-Za-z0-9]{8,}/.test(source.result));                              // 35
check('Result document contains no access token value',
  !/KIS_ACCESS_TOKEN['"]?\s*[:=]\s*['"]?[A-Za-z0-9]{8,}/.test(source.result) &&
  !/Bearer\s+[A-Za-z0-9._-]{8,}/.test(source.result));                                                    // 36
check('Result document contains no authorization header value',
  !/authorization:\s*Bearer/i.test(source.result));                                                       // 37
check('Result document contains no raw response body',
  !/rt_cd|stck_prpr|prdy_vrss|acml_vol/i.test(source.result));                                            // 38
check('Result document records HTTP status class only',
  source.result.includes('HTTP status class') && source.result.includes('not-run'));                      // 39
check('Result document records field-presence booleans only',
  /lastPrice\b/.test(source.result) && /previousClose\b/.test(source.result));                            // 40
check('Result document records no actual price values',
  !/(last price|lastPrice)[^\n]*\b\d{3,}\b/i.test(source.result));                                        // 41
check('Result document confirms public production stays blocked',
  source.result.includes('public production cannot trigger KIS live behavior'));                          // 42
check('Changelog records no deployment', /no deployment/i.test(phaseSection));                            // 43
check('Changelog records no push', /no push/i.test(phaseSection));                                        // 44
check('Known kis-quote-adapter-mocked issue documented',
  source.result.includes('100/101') && source.result.includes('valuation'));                              // 45
check('Recommended next phase is 3EP / 3EO-HF1 / 3EO-HF2',
  source.result.includes('Phase 3EP') || source.result.includes('Phase 3EO-HF1') || source.result.includes('Phase 3EO-HF2')); // 46
check('Checker blocks network access',
  source.checker.includes('Network access is blocked in the Phase 3EO owner-local KIS quote smoke checker.') && !fetchAttempted);
process.stdout.write('\n');

process.stdout.write('Behavioral (injected transport, no network):\n');
const context = { mode: 'owner-local', allowNetwork: true, allowKisLive: true };
const blockedByGate = await runtime.runOwnerLocalKisQuoteSmoke(
  { symbol: '005930', market: 'KR', assetType: 'stock' },
  { mode: 'mocked', allowNetwork: false });
check('Gate-blocked run returns BLOCKED', blockedByGate.status === 'BLOCKED' && blockedByGate.isLive === false);
const usBlocked = await runtime.runOwnerLocalKisQuoteSmoke(
  { symbol: 'AAPL', market: 'US', assetType: 'stock' }, context,
  { hasEnvValue: () => true, transportKr: async () => ({ ok: true, httpStatusClass: '2xx', quote: { symbol: 'AAPL', lastPrice: 1 }, message: 'ok' }) });
check('Unverified US endpoint run is BLOCKED', usBlocked.status === 'BLOCKED' && usBlocked.endpointVerified === false);
const envMissing = await runtime.runOwnerLocalKisQuoteSmoke(
  { symbol: '005930', market: 'KR', assetType: 'stock' }, context,
  { hasEnvValue: () => false });
check('Missing-credential run is BLOCKED with not-run status',
  envMissing.status === 'BLOCKED' && envMissing.httpStatusClass === 'not-run');
const fakePrice = 88888;
const passResult = await runtime.runOwnerLocalKisQuoteSmoke(
  { symbol: '005930', market: 'KR', assetType: 'stock' }, context,
  {
    hasEnvValue: () => true,
    transportKr: async () => ({
      ok: true, httpStatusClass: '2xx',
      quote: { symbol: '005930', lastPrice: fakePrice, previousClose: 88000, change: 888, changeRate: 1.01, volume: 1000000, asOf: '2026-07-01T00:00:00.000Z' },
      message: 'ok',
    }),
  });
check('Fake-transport run returns PASS with safe snapshot',
  passResult.status === 'PASS' && passResult.normalizedSnapshotSafe === true && passResult.isLive === true);
check('PASS result records field-presence booleans',
  passResult.normalizedFieldsPresent.lastPrice === true && passResult.normalizedFieldsPresent.volume === true);
check('Sanitized result leaks no price value',
  !JSON.stringify(passResult).includes(String(fakePrice)));
const failResult = await runtime.runOwnerLocalKisQuoteSmoke(
  { symbol: '005930', market: 'KR', assetType: 'stock' }, context,
  { hasEnvValue: () => true, transportKr: async () => ({ ok: false, httpStatusClass: '5xx', message: 'Transport error: PROVIDER_UNAVAILABLE' }) });
check('Transport failure returns FAIL and no live snapshot',
  failResult.status === 'FAIL' && failResult.isLive === false && failResult.source === 'unavailable');
process.stdout.write('\n');

process.stdout.write(`Checks passed: ${passed}/${passed + failed}\n`);
if (failed > 0) {
  process.stdout.write(`Failures: ${failures.join('; ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('All Phase 3EO checks passed.\n');
}
