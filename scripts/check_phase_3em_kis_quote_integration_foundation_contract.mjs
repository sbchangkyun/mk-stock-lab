/**
 * Phase 3EM static and deterministic behavioral contract.
 * KIS quote integration roadmap reset and local provider foundation.
 * No network, browser, dev server, API, provider, smoke, credential, or environment access.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error('Network access is blocked in the Phase 3EM KIS quote foundation checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { build } from 'esbuild';

const root = process.cwd();
const startingCommit = '32cdd87';
// Pinned to this phase's own ending commit so later phases (e.g. Phase 3EP preview API route)
// do not pollute this phase-scoped diff. Content checks still read current working-tree files.
const endingCommit = '32c666a';
const paths = {
  result: 'docs/planning/phase_3em_kis_quote_integration_roadmap_reset_local_provider_foundation_result_v0.1.md',
  checker: 'scripts/check_phase_3em_kis_quote_integration_foundation_contract.mjs',
  changelog: 'docs/planning/planning_changelog.md',
  package: 'package.json',
  page: 'src/pages/chart-ai.astro',
  contract: 'src/lib/market-data/normalizedQuote.ts',
  interface: 'src/lib/server/market-data/quoteProvider.ts',
  mocked: 'src/lib/server/market-data/mockedQuoteProvider.ts',
  kisBoundary: 'src/lib/server/providers/kis/kisQuoteProvider.ts',
};

const read = (relativePath) => {
  try { return readFileSync(join(root, relativePath), 'utf8'); } catch { return ''; }
};
const git = (...args) => {
  try {
    return execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch { return ''; }
};

const source = Object.fromEntries(Object.entries(paths).map(([key, path]) => [key, read(path)]));
const packageJson = JSON.parse(source.package || '{}');
const baselinePackage = JSON.parse(git('show', `${startingCommit}:package.json`) || '{}');
const phaseSection = source.changelog.split('## Phase 3EM - 2026-07-01')[1]?.split('\n## ')[0] ?? '';
const phaseChanges = new Set(git('diff', '--name-only', startingCommit, endingCommit).split(/\r?\n/).filter(Boolean));
const srcChanges = [...phaseChanges].filter((path) => path.startsWith('src/'));
const apiChanges = srcChanges.filter((path) => path.startsWith('src/pages/api/'));
const supabaseChanges = srcChanges.filter((path) => /supabase/i.test(path));
const migrationChanges = [...phaseChanges].filter((path) => /migration|\.sql$/i.test(path));
const addedFiles = git('diff', '--name-only', '--diff-filter=A', startingCommit, endingCommit).split(/\r?\n/).filter(Boolean);
const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif', '.bmp']);
const addedImages = addedFiles.filter((path) => imageExtensions.has(extname(path).toLowerCase()));
const dependenciesUnchanged = JSON.stringify(packageJson.dependencies ?? {}) ===
  JSON.stringify(baselinePackage.dependencies ?? {});
const devDependenciesUnchanged = JSON.stringify(packageJson.devDependencies ?? {}) ===
  JSON.stringify(baselinePackage.devDependencies ?? {});

const runtimeBundle = await build({
  stdin: {
    contents: `
      export {
        getMockedQuoteSnapshot,
        createMockedQuoteProvider,
        MOCKED_QUOTE_SAMPLE_SYMBOLS,
      } from './src/lib/server/market-data/mockedQuoteProvider.ts';
      export { createKisQuoteProvider } from './src/lib/server/providers/kis/kisQuoteProvider.ts';
    `,
    resolveDir: root,
    sourcefile: 'phase-3em-contract-entry.ts',
    loader: 'ts',
  },
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node18',
  write: false,
  logLevel: 'silent',
});
const runtime = await import(`data:text/javascript;base64,${Buffer.from(runtimeBundle.outputFiles[0].text).toString('base64')}`);

let passed = 0;
let failed = 0;
const failures = [];
const check = (label, condition) => {
  if (condition) {
    passed += 1;
    process.stdout.write(`  [PASS] ${label}\n`);
  } else {
    failed += 1;
    failures.push(label);
    process.stdout.write(`  [FAIL] ${label}\n`);
  }
};

process.stdout.write('=== Phase 3EM KIS Quote Integration Foundation Contract ===\n\n');

process.stdout.write('Files, command, result, and changelog:\n');
check('Result document exists', existsSync(join(root, paths.result)));                                    // 1
check('Static checker exists', existsSync(join(root, paths.checker)));                                    // 2
check('Package checker command exists',                                                                   // 3
  packageJson.scripts?.['check:phase-3em-kis-quote-integration-foundation'] ===
    'node scripts/check_phase_3em_kis_quote_integration_foundation_contract.mjs');
check('Changelog contains Phase 3EM', phaseSection.length > 0);                                           // 4
check('Result records implementation status',                                                             // 5
  source.result.includes('Implemented — KIS quote integration foundation ready for mocked/local validation.'));
check('Result references owner request for faster KIS progress',                                          // 6
  source.result.includes('faster progress toward KIS API integration'));
check('Result references Phase 3EL-OWNER-REVIEW-HF2-LX-CLOSEOUT',                                          // 7
  source.result.includes('Phase 3EL-OWNER-REVIEW-HF2-LX-CLOSEOUT'));
check('Result records copy note applied',                                                                 // 8
  source.result.includes('국내 주식·ETF') && source.result.includes('국내/미국 주식·ETF'));
process.stdout.write('\n');

process.stdout.write('Chart AI eyebrow copy update:\n');
check('Chart AI contains new eyebrow copy', source.page.includes('국내/미국 주식·ETF'));                   // 9
check('Chart AI no longer contains old eyebrow copy', !source.page.includes('>국내 주식·ETF<'));           // 10
check('Chart AI still contains sample chart copy',
  source.page.includes('샘플 차트') && source.page.includes('샘플 OHLC·거래량 데이터') && source.page.includes('실제 시세 아님')); // 50
process.stdout.write('\n');

process.stdout.write('Normalized quote contract:\n');
check('Normalized quote contract file exists', existsSync(join(root, paths.contract)));                   // 11
check('Contract includes NormalizedQuoteSnapshot', source.contract.includes('NormalizedQuoteSnapshot'));  // 12
check('Contract supports market KR', /'KR'/.test(source.contract));                                       // 13
check('Contract supports market US', /'US'/.test(source.contract));                                       // 14
check('Contract includes stock asset type', source.contract.includes("'stock'"));                        // 15
check('Contract includes etf asset type', source.contract.includes("'etf'"));                            // 16
check('Contract includes KRW currency', source.contract.includes("'KRW'"));                              // 17
check('Contract includes USD currency', source.contract.includes("'USD'"));                              // 18
check('Contract includes source field', /\bsource:/.test(source.contract));                              // 19
check('Contract includes freshness field', /\bfreshness:/.test(source.contract));                        // 20
check('Contract includes isLive field', /\bisLive:/.test(source.contract));                              // 21
check('Contract includes providerStatus field', /\bproviderStatus:/.test(source.contract));              // 22
check('Contract includes disclaimer field', /\bdisclaimer:/.test(source.contract));                      // 23
process.stdout.write('\n');

process.stdout.write('Quote provider interface:\n');
check('Quote provider interface exists', existsSync(join(root, paths.interface)));                        // 24
check('Interface includes QuoteProviderRequest', source.interface.includes('QuoteProviderRequest'));      // 25
check('Interface includes QuoteProviderContext', source.interface.includes('QuoteProviderContext'));      // 26
check('Interface includes allowNetwork', source.interface.includes('allowNetwork'));                      // 27
check('Interface includes owner-local mode', source.interface.includes("'owner-local'"));                 // 28
check('Interface includes getQuote', source.interface.includes('getQuote'));                              // 29
process.stdout.write('\n');

process.stdout.write('Mocked quote provider (static):\n');
check('Mocked quote provider exists', existsSync(join(root, paths.mocked)));                              // 30
check('Mocked provider does not use Math.random', !source.mocked.includes('Math.random'));                // 32
check('Mocked provider supports 005930', source.mocked.includes('005930'));                               // 33
check('Mocked provider supports 000660', source.mocked.includes('000660'));                               // 34
check('Mocked provider supports 069500', source.mocked.includes('069500'));                               // 35
check('Mocked provider supports a US stock sample', source.mocked.includes('AAPL'));                       // 36
check('Mocked provider supports a US ETF sample', source.mocked.includes('SPY'));                          // 37
check('Mocked provider declares source mocked', source.mocked.includes("source: 'mocked'"));              // 38
check('Mocked provider declares freshness sample', source.mocked.includes("freshness: 'sample'"));        // 39
check('Mocked provider declares isLive false', source.mocked.includes('isLive: false'));                  // 40
check('Mocked provider declares providerStatus sample', source.mocked.includes("providerStatus: 'sample'")); // 41
process.stdout.write('\n');

process.stdout.write('KIS provider boundary:\n');
check('KIS provider boundary exists', existsSync(join(root, paths.kisBoundary)));                         // 42
check('KIS boundary does not call fetch', !/\bfetch\s*\(/.test(source.kisBoundary));                      // 43
check('KIS boundary does not read process.env or .env',
  !source.kisBoundary.includes('process.env') && !/\.env\b/.test(source.kisBoundary));                    // 44
check('KIS boundary does not require credentials',
  !/appkey|app_key|appsecret|app_secret|Bearer|access_token|KIS_APP/i.test(source.kisBoundary));          // 45
check('KIS boundary blocks live behavior until owner-local smoke',
  source.kisBoundary.includes('owner-local smoke') && source.kisBoundary.includes("'blocked'"));          // 46
check('KIS boundary contains no endpoint URL', !/https?:\/\//.test(source.kisBoundary));
process.stdout.write('\n');

process.stdout.write('No public API route / no UI quote wiring:\n');
check('No public quote API route added',
  addedFiles.every((path) => !path.startsWith('src/pages/api/')));                                         // 47
check('No /api/market/quote route changed', !phaseChanges.has('src/pages/api/market/quote.ts'));          // 48
check('No UI quote wiring added',
  !source.page.includes('normalizedQuote') && !source.page.includes('quoteProvider') &&
  !source.page.includes('getMockedQuoteSnapshot'));                                                        // 49
process.stdout.write('\n');

process.stdout.write('User-facing wording and CTA safety:\n');
for (const wording of ['실시간', '실시간 시세', '현재 시세', 'real-time', 'actual market value', '매수 추천']) {
  check(`No user-facing wording ${wording}`, !source.page.toLowerCase().includes(wording.toLowerCase())); // 51-55, 57
}
check('No affirmative sell recommendation wording', !/매도 추천(?!이 아닙니다)/.test(source.page));       // 58
check('No buy or order CTA introduced', !/<button[^>]*>\s*(?:매수|매도|주문)\s*<\/button>/.test(source.page)); // 56
process.stdout.write('\n');

process.stdout.write('File boundaries and dependency safety:\n');
check('No KIS live call script added',
  addedFiles.every((path) => !/owner_smoke_kis|kis_live|live_kis/i.test(path)));                           // 59
check('No provider payload fixture committed',
  addedFiles.every((path) => !/kis.*payload|quote.*payload|provider.*payload/i.test(path)));               // 60
check('No API route file changed', apiChanges.length === 0);                                              // 61
check('No Supabase file changed', supabaseChanges.length === 0);                                          // 62
check('No migration file added', migrationChanges.length === 0);                                          // 63
check('No image file added', addedImages.length === 0);                                                   // 64
check('No dependency added', dependenciesUnchanged && devDependenciesUnchanged && !phaseChanges.has('package-lock.json')); // 65
check('Changelog records no deployment', /no deployment/i.test(phaseSection));                            // 66
check('Changelog records no push', /no push/i.test(phaseSection));                                        // 67
check('Checker blocks network access',
  source.checker.includes('Network access is blocked in the Phase 3EM KIS quote foundation checker.') && !fetchAttempted); // 68
process.stdout.write('\n');

process.stdout.write('Deterministic mocked provider behavior:\n');
const forbiddenPayload = /access_token|authorization|bearer|appkey|appsecret|password|jwt|supabase\.co|rt_cd|stck_prpr/i;
const krFirst = runtime.getMockedQuoteSnapshot({ symbol: '005930', market: 'KR' });
const krRepeat = runtime.getMockedQuoteSnapshot({ symbol: '005930', market: 'KR' });
check('Mocked 005930 is deterministic', JSON.stringify(krFirst) === JSON.stringify(krRepeat));            // 31, 69
check('Mocked 005930 returns non-live sample snapshot',
  krFirst.source === 'mocked' && krFirst.freshness === 'sample' && krFirst.isLive === false &&
  krFirst.provider === 'mocked' && krFirst.providerStatus === 'sample');                                  // 69
const usFirst = runtime.getMockedQuoteSnapshot({ symbol: 'AAPL', market: 'US' });
const usRepeat = runtime.getMockedQuoteSnapshot({ symbol: 'AAPL', market: 'US' });
check('Mocked AAPL is deterministic', JSON.stringify(usFirst) === JSON.stringify(usRepeat));              // 70
check('Mocked AAPL is a US/USD sample snapshot',
  usFirst.market === 'US' && usFirst.currency === 'USD' && usFirst.isLive === false);                     // 70
check('Mocked snapshots expose no secrets or raw payloads',
  !forbiddenPayload.test(JSON.stringify(krFirst)) && !forbiddenPayload.test(JSON.stringify(usFirst)));    // 71
check('Mocked sample registry covers KR and US stock/ETF',
  ['005930', '000660', '069500', 'AAPL', 'SPY'].every((symbol) => runtime.MOCKED_QUOTE_SAMPLE_SYMBOLS.includes(symbol)));
const kisProvider = runtime.createKisQuoteProvider();
const kisBlocked = await kisProvider.getQuote({ symbol: '005930', market: 'KR' }, { mode: 'owner-local', allowNetwork: false });
const kisAllowed = await kisProvider.getQuote({ symbol: '005930', market: 'KR' }, { mode: 'owner-local', allowNetwork: true });
check('KIS provider returns blocked when network disallowed',
  kisBlocked.provider === 'kis' && kisBlocked.providerStatus === 'blocked' && kisBlocked.isLive === false &&
  kisBlocked.source === 'unavailable');
check('KIS provider stays blocked even when network allowed',
  kisAllowed.providerStatus === 'blocked' && kisAllowed.isLive === false && kisAllowed.lastPrice === null);
check('Result recommends Phase 3EN next',                                                                 // 72
  source.result.includes('Recommended: Phase 3EN — KIS Quote Adapter Owner-Local Gate Implementation.'));
process.stdout.write('\n');

process.stdout.write(`Checks passed: ${passed}/${passed + failed}\n`);
if (failed > 0) {
  process.stdout.write(`Failures: ${failures.join('; ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('All Phase 3EM checks passed.\n');
}
