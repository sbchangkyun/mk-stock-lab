/**
 * Phase 3EP static and behavioral contract.
 * Chart AI owner-local quote preview wiring.
 * Static inspection + injected-transport behavioral tests. No network, no live KIS, no env values,
 * no dev server, no browser, no public API.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error('Network access is blocked in the Phase 3EP owner-local quote preview checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { build } from 'esbuild';

const root = process.cwd();
const startingCommit = 'c85e1f8';
const paths = {
  result: 'docs/planning/phase_3ep_chart_ai_owner_local_quote_preview_wiring_result_v0.1.md',
  checker: 'scripts/check_phase_3ep_chart_ai_owner_local_quote_preview_wiring_contract.mjs',
  changelog: 'docs/planning/planning_changelog.md',
  package: 'package.json',
  page: 'src/pages/chart-ai.astro',
  adapter: 'src/lib/server/providers/kis/kisOwnerLocalQuotePreview.ts',
  route: 'src/pages/api/chart-ai/owner-local-quote-preview.ts',
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
const phaseSection = source.changelog.split('## Phase 3EP - 2026-07-01')[1]?.split('\n## ')[0] ?? '';
const phaseChanges = new Set(git('diff', '--name-only', startingCommit).split(/\r?\n/).filter(Boolean));
const addedFiles = git('diff', '--name-only', '--diff-filter=A', startingCommit).split(/\r?\n/).filter(Boolean);
const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif', '.bmp']);
const addedImages = addedFiles.filter((path) => imageExtensions.has(extname(path).toLowerCase()));
const dependenciesUnchanged = JSON.stringify(packageJson.dependencies ?? {}) === JSON.stringify(baselinePackage.dependencies ?? {});
const devDependenciesUnchanged = JSON.stringify(packageJson.devDependencies ?? {}) === JSON.stringify(baselinePackage.devDependencies ?? {});

const RAW_FIELDS = /stck_prpr|prdy_vrss|prdy_ctrt|acml_vol|rt_cd|msg_cd/i;
const SECRET_VALUE = (text) =>
  /Bearer\s+[A-Za-z0-9._-]{8,}/.test(text) ||
  /KIS_APP_KEY['"]?\s*[:=]\s*['"]?[A-Za-z0-9]{8,}/.test(text) ||
  /KIS_APP_SECRET['"]?\s*[:=]\s*['"]?[A-Za-z0-9]{8,}/.test(text) ||
  /KIS_ACCESS_TOKEN['"]?\s*[:=]\s*['"]?[A-Za-z0-9]{8,}/.test(text);

const runtimeBundle = await build({
  stdin: {
    contents: `export { runOwnerLocalQuotePreview } from './src/lib/server/providers/kis/kisOwnerLocalQuotePreview.ts';`,
    resolveDir: root,
    sourcefile: 'phase-3ep-contract-entry.ts',
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

process.stdout.write('=== Phase 3EP Chart AI Owner-Local Quote Preview Wiring Contract ===\n\n');

process.stdout.write('Files, command, changelog, and references:\n');
check('Result document exists', existsSync(join(root, paths.result)));                                    // 1
check('Static checker exists', existsSync(join(root, paths.checker)));                                    // 2
check('Package checker command exists',                                                                   // 3
  packageJson.scripts?.['check:phase-3ep-chart-ai-owner-local-quote-preview-wiring'] ===
    'node scripts/check_phase_3ep_chart_ai_owner_local_quote_preview_wiring_contract.mjs');
check('Changelog contains Phase 3EP', phaseSection.length > 0);                                           // 4
check('Result references Phase 3EO PASS_WITH_INTERMITTENT_PROVIDER_NOTE',
  source.result.includes('PASS_WITH_INTERMITTENT_PROVIDER_NOTE'));                                        // 5
check('Result references PROVIDER_UNAVAILABLE fallback', source.result.includes('PROVIDER_UNAVAILABLE')); // 6
check('Preview adapter exists', existsSync(join(root, paths.adapter)));                                   // 7
check('Preview API route exists', existsSync(join(root, paths.route)));                                   // 8
check('Chart AI page includes KIS local preview UI',
  source.page.includes('chartAiQuotePreview') && source.page.includes('KIS 로컬 프리뷰'));                // 9
process.stdout.write('\n');

process.stdout.write('Route gate and safety:\n');
check('Route requires owner-local source flag',
  source.route.includes("'owner-local'") && source.route.includes("'source'") || source.route.includes("get('source')")); // 10
check('Route requires localhost host guard',
  source.route.includes('isLocalHostRequest') && source.route.includes('127.0.0.1'));                     // 11
check('Route requires owner-local env flags',
  source.route.includes('KIS_OWNER_LOCAL_SMOKE') && source.route.includes('KIS_ALLOW_LIVE_QUOTE') &&
  source.route.includes('KIS_ENABLE_LIVE_QUOTES'));                                                       // 12
check('Route uses owner-local provider gate',
  source.route.includes("mode: 'owner-local'") && source.route.includes('allowKisLive: true'));           // 13
check('Route sets no-store cache header', source.route.includes("'Cache-Control': 'no-store'"));          // 14
check('Route does not expose raw provider response', !RAW_FIELDS.test(source.route));                     // 15
check('Route exposes no secrets or authorization header',
  !SECRET_VALUE(source.route) && !/authorization/i.test(source.route));                                   // 16
process.stdout.write('\n');

process.stdout.write('Adapter behavior and safety:\n');
check('Adapter uses endpoint registry', source.adapter.includes('resolveVerifiedKisQuoteEndpoint'));     // 17
check('Adapter blocks unverified endpoints',
  /if\s*\(\s*!endpoint/.test(source.adapter) || source.adapter.includes('!endpoint'));                    // 18
check('Adapter handles PROVIDER_UNAVAILABLE', source.adapter.includes('PROVIDER_UNAVAILABLE'));           // 19
check('Adapter maps provider failure to safe unavailable',
  source.adapter.includes('buildUnavailablePreview'));                                                    // 20
check('Adapter uses no account/trading API path',
  !/getKisAccount|placeOrder|submitOrder|inquire-balance|잔고|주문/i.test(source.adapter));                // 21
check('Adapter contains no fetch call', !/\bfetch\s*\(/.test(source.adapter));
process.stdout.write('\n');

process.stdout.write('Chart AI page wiring and wording:\n');
check('Chart AI does not auto-fetch on normal public load',
  source.page.includes('ownerLocalPreview') && /addEventListener\('click'[\s\S]*?fetch\(/.test(source.page) &&
  source.page.includes('disabled = true'));                                                               // 22
check('Chart AI fetch requires source=owner-local',
  source.page.includes("get('source') === 'owner-local'"));                                               // 23
check('Chart AI selected-symbol preview uses selected symbol',
  source.page.includes('symbol: selectedSymbol'));                                                        // 24
check('Chart AI preserves sample chart wording',
  source.page.includes('샘플 차트') && source.page.includes('실제 시세 아님'));                            // 25
for (const [num, wording] of [[26, '실시간'], [27, '실시간 시세'], [28, '매수 추천']]) {
  check(`Chart AI avoids user-facing ${wording}`, !source.page.includes(wording));                        // 26-28
}
check('Chart AI avoids 매도 추천', !/매도 추천(?!이 아닙니다)/.test(source.page));                        // 29
process.stdout.write('\n');

process.stdout.write('Boundaries and dependency safety:\n');
check('No generic /api/market/quote route added', !addedFiles.includes('src/pages/api/market/quote.ts')); // 30
check('No production deployment config changed',
  !phaseChanges.has('vercel.json') && ![...phaseChanges].some((p) => p.startsWith('.vercel/')));          // 31
check('No Supabase file changed', ![...phaseChanges].some((p) => /supabase/i.test(p)));                   // 32
check('No SQL/migration file added', ![...phaseChanges].some((p) => /migration|\.sql$/i.test(p)));        // 33
check('No image file added', addedImages.length === 0);                                                   // 34
check('No dependency added',
  dependenciesUnchanged && devDependenciesUnchanged && !phaseChanges.has('package-lock.json'));           // 35
check('Docs contain no actual price values', !/(last price|lastPrice)[^\n]*\b\d{3,}\b/i.test(source.result)); // 36
check('Docs contain no raw response fields', !RAW_FIELDS.test(source.result));                            // 37
check('Docs contain no secret-looking values', !SECRET_VALUE(source.result));                             // 38
check('Changelog records no deployment', /no deployment/i.test(phaseSection));                            // 39
check('Changelog records no push', /no push/i.test(phaseSection));                                        // 40
check('Known legacy checker note preserved',
  source.result.includes('100/101') && source.result.includes('valuation'));                              // 41
check('Recommended next phase is Phase 3EP-OWNER-REVIEW',
  source.result.includes('Phase 3EP-OWNER-REVIEW'));                                                      // 42
check('Checker blocks network access',
  source.checker.includes('Network access is blocked in the Phase 3EP owner-local quote preview checker.') && !fetchAttempted);
process.stdout.write('\n');

process.stdout.write('Behavioral (injected transport, no network):\n');
const ownerLocalCtx = { mode: 'owner-local', allowNetwork: true, allowKisLive: true };
const blocked = await runtime.runOwnerLocalQuotePreview(
  { symbol: '005930', market: 'KR', assetType: 'stock' }, { mode: 'mocked', allowNetwork: false });
check('Gate-blocked preview returns blocked/no quote',
  blocked.status === 'blocked' && blocked.quote === null && blocked.isLive === false &&
  blocked.safety.publicProductionBlocked === true);
const unavailable = await runtime.runOwnerLocalQuotePreview(
  { symbol: '005930', market: 'KR', assetType: 'stock' }, ownerLocalCtx,
  { transportKr: async () => ({ ok: false, code: 'PROVIDER_UNAVAILABLE' }) });
check('PROVIDER_UNAVAILABLE maps to safe unavailable state',
  unavailable.status === 'unavailable' && unavailable.quote === null && unavailable.isLive === false &&
  unavailable.providerStatus === 'PROVIDER_UNAVAILABLE');
const usBlocked = await runtime.runOwnerLocalQuotePreview(
  { symbol: 'AAPL', market: 'US', assetType: 'stock' }, ownerLocalCtx,
  { transportKr: async () => ({ ok: true, price: 1, previousClose: 1, change: 0, changeRate: 0, volume: 1, asOf: null, currency: 'USD' }) });
check('Unverified US market is blocked in preview', usBlocked.status === 'blocked' && usBlocked.quote === null);
const syntheticPrice = 12345;
const ok = await runtime.runOwnerLocalQuotePreview(
  { symbol: '005930', market: 'KR', assetType: 'stock' }, ownerLocalCtx,
  { transportKr: async () => ({ ok: true, price: syntheticPrice, previousClose: 12000, change: 345, changeRate: 2.87, volume: 1000000, asOf: '2026-07-01T00:00:00.000Z', currency: 'KRW' }) });
check('Owner-local gate + verified endpoint returns ok quote',
  ok.status === 'ok' && ok.source === 'kis-local' && ok.isLive === true && ok.quote?.lastPrice === syntheticPrice);
check('OK preview response carries no raw fields or secrets',
  !RAW_FIELDS.test(JSON.stringify(ok)) && !SECRET_VALUE(JSON.stringify(ok)));
process.stdout.write('\n');

process.stdout.write(`Checks passed: ${passed}/${passed + failed}\n`);
if (failed > 0) {
  process.stdout.write(`Failures: ${failures.join('; ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('All Phase 3EP checks passed.\n');
}
