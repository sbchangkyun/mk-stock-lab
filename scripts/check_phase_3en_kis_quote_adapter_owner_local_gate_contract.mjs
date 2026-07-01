/**
 * Phase 3EN static and deterministic behavioral contract.
 * KIS quote adapter owner-local gate implementation.
 * No network, browser, dev server, API, provider, smoke, credential, or environment access.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error('Network access is blocked in the Phase 3EN KIS owner-local gate checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { build } from 'esbuild';

const root = process.cwd();
const startingCommit = '32c666a';
// Pinned to this phase's own ending commit so later phases (e.g. Phase 3EP preview wiring)
// do not pollute this phase-scoped diff. Content checks still read current working-tree files.
const endingCommit = '75621c6';
const paths = {
  result: 'docs/planning/phase_3en_kis_quote_adapter_owner_local_gate_result_v0.1.md',
  checker: 'scripts/check_phase_3en_kis_quote_adapter_owner_local_gate_contract.mjs',
  changelog: 'docs/planning/planning_changelog.md',
  package: 'package.json',
  page: 'src/pages/chart-ai.astro',
  gate: 'src/lib/server/providers/kis/kisOwnerLocalGate.ts',
  env: 'src/lib/server/providers/kis/kisEnvContract.ts',
  descriptor: 'src/lib/server/providers/kis/kisQuoteRequest.ts',
  mapper: 'src/lib/server/providers/kis/kisQuoteMapper.ts',
  provider: 'src/lib/server/providers/kis/kisQuoteProvider.ts',
  context: 'src/lib/server/market-data/quoteProvider.ts',
  mocked: 'src/lib/server/market-data/mockedQuoteProvider.ts',
  contract: 'src/lib/market-data/normalizedQuote.ts',
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
const phaseSection = source.changelog.split('## Phase 3EN - 2026-07-01')[1]?.split('\n## ')[0] ?? '';
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
      export { evaluateKisOwnerLocalGate, resolveKisRuntimeMode } from './src/lib/server/providers/kis/kisOwnerLocalGate.ts';
      export { getMockedQuoteSnapshot } from './src/lib/server/market-data/mockedQuoteProvider.ts';
      export { createKisQuoteProvider, prepareKisQuoteRequest } from './src/lib/server/providers/kis/kisQuoteProvider.ts';
      export { buildKisQuoteRequestDescriptor } from './src/lib/server/providers/kis/kisQuoteRequest.ts';
      export { toNullableNumber, mapSanitizedKisQuoteToSnapshot, buildKisQuoteFallbackSnapshot } from './src/lib/server/providers/kis/kisQuoteMapper.ts';
    `,
    resolveDir: root,
    sourcefile: 'phase-3en-contract-entry.ts',
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

process.stdout.write('=== Phase 3EN KIS Quote Adapter Owner-Local Gate Contract ===\n\n');

process.stdout.write('Files, command, result, and changelog:\n');
check('Result document exists', existsSync(join(root, paths.result)));                                    // 1
check('Static checker exists', existsSync(join(root, paths.checker)));                                    // 2
check('Package checker command exists',                                                                   // 3
  packageJson.scripts?.['check:phase-3en-kis-quote-adapter-owner-local-gate'] ===
    'node scripts/check_phase_3en_kis_quote_adapter_owner_local_gate_contract.mjs');
check('Changelog contains Phase 3EN', phaseSection.length > 0);                                           // 4
check('Result records implementation status',                                                             // 5
  source.result.includes('Implemented — KIS quote adapter owner-local gate ready for smoke preparation.'));
check('Result references Phase 3EM', source.result.includes('Phase 3EM'));                                // 6
check('Result records first KIS call deferred to Phase 3EO',                                              // 7
  source.result.includes('deferred to Phase 3EO'));
process.stdout.write('\n');

process.stdout.write('Owner-local gate:\n');
check('Owner-local gate file exists', existsSync(join(root, paths.gate)));                                // 8
check('Gate defines KisRuntimeMode', source.gate.includes('KisRuntimeMode'));                            // 9
check('Gate input defines mode', /mode:\s*'fixture'\s*\|\s*'mocked'\s*\|\s*'owner-local'/.test(source.gate)); // 10
check('Gate input defines allowNetwork', source.gate.includes('allowNetwork'));                          // 11
check('Gate input defines allowKisLive', source.gate.includes('allowKisLive'));                          // 12
process.stdout.write('\n');

process.stdout.write('Env-name contract:\n');
check('Env-name contract file exists', existsSync(join(root, paths.env)));                               // 17
check('Env contract lists KIS_APP_KEY', source.env.includes('KIS_APP_KEY'));                             // 18
check('Env contract lists KIS_APP_SECRET', source.env.includes('KIS_APP_SECRET'));                       // 19
check('Env contract lists KIS_ACCESS_TOKEN', source.env.includes('KIS_ACCESS_TOKEN'));                   // 20
check('Env contract lists KIS_MODE', source.env.includes('KIS_MODE'));                                   // 21
check('Env contract does not read process.env', !source.env.includes('process.env'));                    // 22
check('Env contract does not read .env', !/\.env\b/.test(source.env));                                   // 23
process.stdout.write('\n');

process.stdout.write('KIS quote request descriptor:\n');
check('Descriptor file exists', existsSync(join(root, paths.descriptor)));                               // 24
check('Descriptor supports market KR', source.descriptor.includes("'KR'"));                              // 25
check('Descriptor supports market US', source.descriptor.includes("'US'"));                              // 26
check('Descriptor includes endpoint keys', source.descriptor.includes('endpointKey'));                   // 27
check('Descriptor includes KR stock quote endpoint key', source.descriptor.includes('KR_STOCK_QUOTE'));  // 28
check('Descriptor includes KR ETF endpoint key', source.descriptor.includes('KR_ETF_QUOTE'));            // 29
check('Descriptor includes US stock endpoint key', source.descriptor.includes('US_STOCK_QUOTE'));        // 30
check('Descriptor includes US ETF endpoint key', source.descriptor.includes('US_ETF_QUOTE'));            // 31
check('Descriptor uses endpointKey not raw URL',
  source.descriptor.includes('endpointKey') && !/https?:\/\//.test(source.descriptor));                   // 32
check('Descriptor marks verification-required transaction IDs',
  source.descriptor.includes('VERIFY_WITH_KIS_DOCS'));                                                    // 33
process.stdout.write('\n');

process.stdout.write('KIS quote mapper:\n');
check('Mapper file exists', existsSync(join(root, paths.mapper)));                                        // 34
check('Mapper defines sanitized quote-like input', source.mapper.includes('SanitizedKisQuoteLike'));     // 35
check('Mapper maps to NormalizedQuoteSnapshot', source.mapper.includes('NormalizedQuoteSnapshot'));      // 36
check('Mapper coerces invalid numbers helper exists', source.mapper.includes('toNullableNumber'));       // 37 (static)
check('Mapper does not embed raw provider payload fields',
  !/stck_prpr|prdy_vrss|prdy_ctrt|acml_vol|rt_cd|msg_cd|output\d?/i.test(source.mapper));                 // 38
process.stdout.write('\n');

process.stdout.write('KIS provider boundary and context:\n');
check('KIS provider uses owner-local gate', source.provider.includes('evaluateKisOwnerLocalGate'));      // 39
check('KIS provider uses request descriptor', source.provider.includes('buildKisQuoteRequestDescriptor')); // 40
check('KIS provider uses mapper/fallback', source.provider.includes('buildKisQuoteFallbackSnapshot'));    // 41
check('KIS provider contains no fetch call', !/\bfetch\s*\(/.test(source.provider));                     // 42
check('KIS provider does not read .env', !/\.env\b/.test(source.provider));                              // 43
check('KIS provider does not use process.env', !source.provider.includes('process.env'));                // 44
check('KIS provider returns not-implemented in Phase 3EN', /not implemented in Phase 3EN/i.test(source.provider)); // 45
check('KIS provider adds no account/trading behavior',
  !/\b(order|trading|account_no)\b/i.test(source.provider) && !/매수|매도|주문/.test(source.provider));   // 46
check('QuoteProviderContext supports allowKisLive', source.context.includes('allowKisLive'));            // 47
process.stdout.write('\n');

process.stdout.write('Mocked provider and normalized contract preservation:\n');
check('Mocked provider does not use Math.random', !source.mocked.includes('Math.random'));                // 50
check('Normalized quote contract still exists', existsSync(join(root, paths.contract)));                 // 51
check('Normalized quote contract includes NormalizedQuoteSnapshot',
  source.contract.includes('NormalizedQuoteSnapshot'));                                                   // 52
process.stdout.write('\n');

process.stdout.write('Chart AI, API, and boundary safety:\n');
check('Chart AI eyebrow remains 국내/미국 주식·ETF', source.page.includes('국내/미국 주식·ETF'));           // 53
check('No ungated Chart AI quote UI (server quote modules not imported; only gated preview allowed)',
  !source.page.includes('normalizedQuote') && !source.page.includes('quoteProvider') &&
  !source.page.includes('kisQuote') &&
  (!source.page.includes('quote-preview') ||
    (source.page.includes('owner-local-quote-preview') && source.page.includes('owner-local'))));         // 54
check('No public quote API route added', addedFiles.every((path) => !path.startsWith('src/pages/api/'))); // 55
check('No /api/market/quote route added',
  !addedFiles.includes('src/pages/api/market/quote.ts'));                                                 // 56
check('No API route file changed', apiChanges.length === 0);                                             // 57
check('No provider payload fixture committed',
  addedFiles.every((path) => !/payload|fixture.*kis|kis.*fixture/i.test(path)));                          // 58
check('No image file added', addedImages.length === 0);                                                  // 59
check('No dependency added',
  dependenciesUnchanged && devDependenciesUnchanged && !phaseChanges.has('package-lock.json'));           // 60
check('No migration file added', migrationChanges.length === 0);                                         // 61
check('No Supabase file changed', supabaseChanges.length === 0);                                         // 62
for (const wording of ['실시간', '실시간 시세', '현재 시세', 'real-time', 'actual market value', '매수 추천']) {
  check(`No user-facing wording ${wording}`, !source.page.toLowerCase().includes(wording.toLowerCase())); // 63-67, 69
}
check('No affirmative sell recommendation wording', !/매도 추천(?!이 아닙니다)/.test(source.page));       // 70
check('No buy or order CTA introduced', !/<button[^>]*>\s*(?:매수|매도|주문)\s*<\/button>/.test(source.page)); // 68
process.stdout.write('\n');

process.stdout.write('Gate behavior (deterministic):\n');
const gate = (mode, allowNetwork, allowKisLive) =>
  runtime.evaluateKisOwnerLocalGate({ mode, allowNetwork, allowKisLive });
check('Gate allows only owner-local + network + live',                                                    // 13
  gate('owner-local', true, true).allowed === true &&
  gate('owner-local', true, false).allowed === false &&
  gate('mocked', true, true).allowed === false);
check('Gate returns blocked_by_mode for wrong mode', gate('fixture', true, true).reason === 'blocked_by_mode'); // 14
check('Gate returns network_not_allowed', gate('owner-local', false, true).reason === 'network_not_allowed'); // 15
check('Gate returns live_flag_missing', gate('owner-local', true, false).reason === 'live_flag_missing'); // 16
check('Gate blocks fixture/false', gate('fixture', false, false).allowed === false);                     // 71
check('Gate blocks mocked/false', gate('mocked', false, false).allowed === false);                       // 72
check('Gate blocks owner-local/false', gate('owner-local', false, false).allowed === false);             // 73
check('Gate blocks owner-local/true without live flag', gate('owner-local', true, false).allowed === false); // 74
check('Gate allows owner-local/true/live-flag', gate('owner-local', true, true).allowed === true);       // 75
process.stdout.write('\n');

process.stdout.write('Provider behavior and mapper behavior (deterministic):\n');
const provider = runtime.createKisQuoteProvider();
const blocked = await provider.getQuote({ symbol: '005930', market: 'KR' }, { mode: 'fixture', allowNetwork: false });
const allowed = await provider.getQuote({ symbol: '005930', market: 'KR' }, { mode: 'owner-local', allowNetwork: true, allowKisLive: true });
check('Even allowed gate returns no live result in Phase 3EN',                                            // 76
  allowed.isLive === false && allowed.source === 'unavailable');
check('No provider result is isLive true', blocked.isLive === false && allowed.isLive === false);         // 77
check('Blocked result has source unavailable', blocked.source === 'unavailable' && blocked.providerStatus === 'blocked'); // 78
check('prepareKisQuoteRequest returns null when gate blocked',
  runtime.prepareKisQuoteRequest({ symbol: '005930', market: 'KR' }, { mode: 'mocked', allowNetwork: false }) === null);
check('prepareKisQuoteRequest returns descriptor when gate allowed',
  runtime.prepareKisQuoteRequest({ symbol: '069500', market: 'KR', assetType: 'etf' }, { mode: 'owner-local', allowNetwork: true, allowKisLive: true })?.endpointKey === 'KR_ETF_QUOTE');
const krDesc = runtime.buildKisQuoteRequestDescriptor({ symbol: '005930', market: 'KR', assetType: 'stock' });
const usDesc = runtime.buildKisQuoteRequestDescriptor({ symbol: 'SPY', market: 'US', assetType: 'etf' });
check('Descriptor resolves KR stock and US ETF endpoint keys',
  krDesc.endpointKey === 'KR_STOCK_QUOTE' && usDesc.endpointKey === 'US_ETF_QUOTE');
check('Mapper coerces invalid numeric fields to null',                                                    // 37 (behavioral)
  runtime.toNullableNumber('abc') === null && runtime.toNullableNumber('') === null &&
  runtime.toNullableNumber(Number.NaN) === null && runtime.toNullableNumber('12.5') === 12.5);
const mapped = runtime.mapSanitizedKisQuoteToSnapshot(
  { symbol: '005930', lastPrice: 'not-a-number', volume: '1000' },
  { market: 'KR', exchange: 'KOSPI', assetType: 'stock', currency: 'KRW' });
check('Mapper output is client-safe and non-live by default',
  mapped.lastPrice === null && mapped.volume === 1000 && mapped.isLive === false && mapped.source === 'kis-local');
check('Mocked provider stays deterministic and non-live',                                                 // 48, 49
  (() => {
    const a = runtime.getMockedQuoteSnapshot({ symbol: '005930', market: 'KR' });
    const b = runtime.getMockedQuoteSnapshot({ symbol: '005930', market: 'KR' });
    return JSON.stringify(a) === JSON.stringify(b) && a.isLive === false && a.source === 'mocked';
  })());
process.stdout.write('\n');

process.stdout.write('Changelog and network safety:\n');
check('Changelog records no live KIS call', /no live KIS call/i.test(phaseSection));                     // 79
check('Changelog records no deployment', /no deployment/i.test(phaseSection));                           // 80
check('Changelog records no push', /no push/i.test(phaseSection));                                       // 81
check('Checker blocks network access',
  source.checker.includes('Network access is blocked in the Phase 3EN KIS owner-local gate checker.') && !fetchAttempted); // 82
check('Result recommends Phase 3EO as first live smoke',                                                  // 83
  source.result.includes('Phase 3EO') && source.result.includes('first live call'));
process.stdout.write('\n');

process.stdout.write(`Checks passed: ${passed}/${passed + failed}\n`);
if (failed > 0) {
  process.stdout.write(`Failures: ${failures.join('; ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('All Phase 3EN checks passed.\n');
}
