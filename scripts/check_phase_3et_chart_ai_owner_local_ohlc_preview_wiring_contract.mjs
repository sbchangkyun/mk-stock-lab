/**
 * Phase 3ET static and behavioral contract.
 * Chart AI owner-local OHLC preview wiring.
 * Static inspection + injected-transport behavioral tests. No network, no live KIS, no env values,
 * no dev server, no browser, no public API.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error('Network access is blocked in the Phase 3ET owner-local OHLC preview checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { build } from 'esbuild';

const root = process.cwd();
const startingCommit = 'd6b555c';
const paths = {
  result: 'docs/planning/phase_3et_chart_ai_owner_local_ohlc_preview_wiring_result_v0.1.md',
  checker: 'scripts/check_phase_3et_chart_ai_owner_local_ohlc_preview_wiring_contract.mjs',
  changelog: 'docs/planning/planning_changelog.md',
  package: 'package.json',
  page: 'src/pages/chart-ai.astro',
  adapter: 'src/lib/server/providers/kis/kisOwnerLocalOhlcPreview.ts',
  route: 'src/pages/api/chart-ai/owner-local-ohlc-preview.ts',
  chartAdapter: 'src/lib/chart-ai/ohlcPreviewChart.ts',
  quoteRoute: 'src/pages/api/chart-ai/owner-local-quote-preview.ts',
  quoteAdapter: 'src/lib/server/providers/kis/kisOwnerLocalQuotePreview.ts',
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
const phaseSection = source.changelog.split('## Phase 3ET - 2026-07-01')[1]?.split('\n## ')[0] ?? '';
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

const phaseFiles = [paths.adapter, paths.route, paths.chartAdapter, paths.page];
const combinedPhaseSource = phaseFiles.map((p) => source[Object.keys(paths).find((k) => paths[k] === p)]).join('\n');

const runtimeBundle = await build({
  stdin: {
    contents: `export { runOwnerLocalOhlcPreview } from './src/lib/server/providers/kis/kisOwnerLocalOhlcPreview.ts';`,
    resolveDir: root,
    sourcefile: 'phase-3et-contract-entry.ts',
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

process.stdout.write('=== Phase 3ET Chart AI Owner-Local OHLC Preview Wiring Contract ===\n\n');

process.stdout.write('Files, command, changelog existence (1-4):\n');
check('Result document exists', existsSync(join(root, paths.result)));                                    // 1
check('Static checker exists', existsSync(join(root, paths.checker)));                                    // 2
check('Package checker command exists',                                                                   // 3
  packageJson.scripts?.['check:phase-3et-chart-ai-owner-local-ohlc-preview-wiring'] ===
    'node scripts/check_phase_3et_chart_ai_owner_local_ohlc_preview_wiring_contract.mjs');
check('Changelog contains Phase 3ET section', phaseSection.length > 0);                                   // 4
process.stdout.write('\n');

process.stdout.write('Result content correctness (5-6):\n');
check('Result references Phase 3ES PASS_WITH_OWNER_LOCAL_RUN background',
  source.result.includes('PASS_WITH_OWNER_LOCAL_RUN'));                                                   // 5
check('Result references verified KR_STOCK_DAILY_OHLC endpoint',
  source.result.includes('KR_STOCK_DAILY_OHLC') && source.result.includes('verified'));                   // 6
process.stdout.write('\n');

process.stdout.write('Adapter/route existence and structure (7-28):\n');
check('Preview adapter exists', existsSync(join(root, paths.adapter)));                                   // 7
check('Preview API route exists', existsSync(join(root, paths.route)));                                   // 8
check('Chart geometry adapter exists', existsSync(join(root, paths.chartAdapter)));                       // 9
check('Adapter exports runOwnerLocalOhlcPreview',
  source.adapter.includes('export const runOwnerLocalOhlcPreview'));                                      // 10
check('Adapter asserts server runtime',
  source.adapter.includes('assertServerRuntime'));                                                        // 11
check('Adapter uses owner-local gate and blocks when not allowed',
  source.adapter.includes('evaluateKisOwnerLocalGate') && source.adapter.includes('!gate.allowed'));      // 12
check('Adapter builds a KIS OHLC request descriptor',
  source.adapter.includes('buildKisOhlcRequestDescriptor'));                                               // 13
check('Adapter blocks unverified endpoints and non-KR markets',
  source.adapter.includes('endpointVerified') && source.adapter.includes("request.market !== 'KR'"));     // 14
check('Adapter uses the shared kisClient transport, never calls fetch directly',
  source.adapter.includes('getKisDomesticDailyOhlcSeries') && !/\bfetch\s*\(/.test(source.adapter));       // 15
check('Adapter transport is injectable for static/behavioral testing',
  source.adapter.includes('deps.transportKr') && source.adapter.includes('PreviewOhlcDeps'));             // 16
check('Adapter wraps transport call in try/catch and never throws a raw error',
  /try\s*\{[\s\S]*?transportKr\(/.test(source.adapter) && source.adapter.includes('catch'));              // 17
check('Adapter maps CONFIG_MISSING to a blocked response',
  source.adapter.includes("transport.code === 'CONFIG_MISSING'"));                                        // 18
check('Adapter maps other transport failures to an unavailable response',
  source.adapter.includes('buildUnavailablePreview'));                                                    // 19
check('Adapter checks series renderability before returning ok',
  source.adapter.includes('isRenderableOhlcSeries'));                                                     // 20
check('Adapter maps sanitized points via mapSanitizedKisOhlcToSeries with isLive true',
  source.adapter.includes('mapSanitizedKisOhlcToSeries') && source.adapter.includes('isLive: true'));     // 21
check('Adapter response always carries the safe safety block',
  source.adapter.includes('rawResponsePrinted: false') && source.adapter.includes('secretsPrinted: false') &&
  source.adapter.includes('publicProductionBlocked: true'));                                              // 22
check('Route disables prerendering', source.route.includes('export const prerender = false'));            // 23
check('Route is GET-only with a 405 fallback for other methods',
  source.route.includes('export const GET') && source.route.includes('export const ALL') && source.route.includes('405')); // 24
check('Route requires source=owner-local and preview=ohlc query flags',
  source.route.includes("'source') !== 'owner-local'") && source.route.includes("'preview') !== 'ohlc'")); // 25
check('Route requires a localhost host guard',
  source.route.includes('isLocalHostRequest') && source.route.includes('127.0.0.1'));                     // 26
check('Route requires the three owner-local env flags',
  source.route.includes('KIS_OWNER_LOCAL_SMOKE') && source.route.includes('KIS_ALLOW_LIVE_QUOTE') &&
  source.route.includes('KIS_ENABLE_LIVE_QUOTES'));                                                       // 27
check('Route calls the adapter under the owner-local gate and blocks non-KR before calling it',
  source.route.includes("mode: 'owner-local'") && source.route.includes('allowKisLive: true') &&
  /market !== 'KR'/.test(source.route));                                                                   // 28
process.stdout.write('\n');

process.stdout.write('Chart AI page wiring correctness (29-37):\n');
check('Page imports the chart geometry adapter',
  source.page.includes("toMockedOhlcPoints") && source.page.includes('OwnerLocalOhlcPreviewPoint') &&
  source.page.includes("from '../lib/chart-ai/ohlcPreviewChart'"));                                        // 29
check('Page defines the OHLC preview control disabled by default in markup',
  /id="chartAiOhlcPreviewBtn"[^>]*disabled/.test(source.page));                                            // 30
check('Page gates the preview strictly on source=owner-local',
  source.page.includes("get('source') === 'owner-local'"));                                                // 31
check('Page only enables the button / attaches the fetch handler when owner-local is set',
  /if\s*\(ownerLocalOhlcPreview\)\s*\{[\s\S]*?ohlcPreviewBtn\.disabled = false;[\s\S]*?addEventListener\('click'/.test(source.page) &&
  /\}\s*else\s*\{[\s\S]*?ohlcPreviewBtn\.disabled = true;/.test(source.page));                             // 32
check('Fetch call targets the owner-local OHLC preview route with source and preview flags',
  source.page.includes('/api/chart-ai/owner-local-ohlc-preview') &&
  source.page.includes("source: 'owner-local'") && source.page.includes("preview: 'ohlc'"));              // 33
check('Period change resets the OHLC preview state',
  /resetOhlcPreview\(\);\s*\n\s*renderChart\(\);\s*\n\s*\}\);\s*\n\s*\}\);/.test(source.page) ||
  (source.page.includes('resetOhlcPreview();') && /periodButtons\.forEach[\s\S]*?resetOhlcPreview\(\);/.test(source.page))); // 34
check('Symbol/selection change resets the OHLC preview state',
  /updateSelection[\s\S]*?resetOhlcPreview\(\);/.test(source.page));                                       // 35
check('Page falls back to the sample chart on blocked/unavailable/malformed/error responses',
  source.page.includes('fallbackToSampleChart') &&
  source.page.includes("data?.status === 'blocked'") &&
  source.page.includes('catch') &&
  source.page.includes('KIS 응답을 차트에 표시할 수 없어 샘플 차트를 유지합니다.'));                    // 36
// The tag text was intentionally simplified by Phase 3ET-HF1: the original
// '지연 시세 · 오너 로컬 OHLC · KRW' copy was replaced with the current approved
// '지연 시세 · KIS OHLC · KRW' copy after owner review. This checks the current accepted
// state, not the superseded pre-HF1 string.
check('Page preserves sample-chart wording and current KIS OHLC delayed-state tag text',
  source.page.includes('샘플 차트') && source.page.includes('실제 시세 아님') &&
  source.page.includes('지연 시세 · KIS OHLC · KRW'));                                                     // 37
process.stdout.write('\n');

process.stdout.write('Phase-boundary and forbidden-pattern checks (38-46):\n');
check('No source=live introduced in phase files', !/source\s*[:=]\s*['"]live['"]/.test(combinedPhaseSource)); // 38
check('No source=auto introduced in phase files', !/source\s*[:=]\s*['"]auto['"]/.test(combinedPhaseSource)); // 39
check('No new public (non-owner-local) OHLC API route added',
  !addedFiles.some((p) => p.startsWith('src/pages/api/') && /ohlc/i.test(p) && p !== paths.route));        // 40
check('No account/trading/order/balance API usage in adapter or route',
  !/process\.env\.KIS_ACCOUNT_NO|inquire-balance|placeOrder|submitOrder|주문|잔고/i.test(source.adapter + source.route)); // 41
check('No Supabase/SQL/migration file changed', ![...phaseChanges].some((p) => /supabase|migration|\.sql$/i.test(p))); // 42
check('No Vercel config file changed',
  !phaseChanges.has('vercel.json') && ![...phaseChanges].some((p) => p.startsWith('.vercel/')));           // 43
check('No dependency added',
  dependenciesUnchanged && devDependenciesUnchanged && !phaseChanges.has('package-lock.json'));            // 44
check('Existing KIS quote preview route and adapter are untouched by this phase',
  !phaseChanges.has(paths.quoteRoute) && !phaseChanges.has(paths.quoteAdapter));                            // 45
check('OHLC preview fetch only occurs inside the button click handler, never at top level',
  /addEventListener\('click', async \(\) => \{[\s\S]*?fetch\(`\/api\/chart-ai\/owner-local-ohlc-preview/.test(source.page) &&
  !/^\s*(?:await\s+)?fetch\(`\/api\/chart-ai\/owner-local-ohlc-preview/m.test(source.page));              // 46
process.stdout.write('\n');

process.stdout.write('Sanitization checks (47-49):\n');
check('Result document contains no raw KIS response field names', !RAW_FIELDS.test(source.result));        // 47
check('Result document and changelog contain no secret-looking values',
  !SECRET_VALUE(source.result) && !SECRET_VALUE(phaseSection));                                             // 48
check('Result document records no actual OHLC price example values',
  !/\b(open|high|low|close)\b[^\n]{0,20}\b\d{3,}\b/i.test(source.result));                                  // 49
process.stdout.write('\n');

process.stdout.write('Changelog no-deploy/no-push (50-51):\n');
check('Changelog records no deployment', /no deployment/i.test(phaseSection));                              // 50
check('Changelog records no push', /no push/i.test(phaseSection));                                          // 51
process.stdout.write('\n');

process.stdout.write('Recommended next phase (52):\n');
check('Result document recommends Phase 3ET-OWNER-REVIEW',
  source.result.includes('Phase 3ET-OWNER-REVIEW'));                                                        // 52
process.stdout.write('\n');

process.stdout.write('Known legacy checker notes preserved (53):\n');
check('Result document documents the known legacy check:kis-quote-adapter-mocked note',
  source.result.includes('100/101') && source.result.includes('kis-quote-adapter-mocked'));                 // 53
process.stdout.write('\n');

process.stdout.write('Checker network safety:\n');
check('Checker blocks network access',
  source.checker.includes('Network access is blocked in the Phase 3ET owner-local OHLC preview checker.') && !fetchAttempted);
process.stdout.write('\n');

process.stdout.write('Behavioral (injected transport, no network):\n');
const ownerLocalCtx = { mode: 'owner-local', allowNetwork: true, allowKisLive: true };
const blockedRequest = { symbol: '005930', market: 'KR', assetType: 'stock', period: '1m' };

const gateBlocked = await runtime.runOwnerLocalOhlcPreview(blockedRequest, { mode: 'mocked', allowNetwork: false });
check('Gate-blocked preview returns blocked with no points',
  gateBlocked.status === 'blocked' && gateBlocked.points.length === 0 && gateBlocked.isLive === false &&
  gateBlocked.safety.publicProductionBlocked === true);

const usBlocked = await runtime.runOwnerLocalOhlcPreview(
  { symbol: 'AAPL', market: 'US', assetType: 'stock', period: '1m' }, ownerLocalCtx,
  { transportKr: async () => ({ ok: true, points: [] }) });
check('Unverified US market is blocked in preview', usBlocked.status === 'blocked' && usBlocked.points.length === 0);

const unavailable = await runtime.runOwnerLocalOhlcPreview(blockedRequest, ownerLocalCtx,
  { transportKr: async () => ({ ok: false, code: 'PROVIDER_UNAVAILABLE' }) });
check('PROVIDER_UNAVAILABLE maps to a safe unavailable state with no points',
  unavailable.status === 'unavailable' && unavailable.points.length === 0 && unavailable.isLive === false);

const configMissing = await runtime.runOwnerLocalOhlcPreview(blockedRequest, ownerLocalCtx,
  { transportKr: async () => ({ ok: false, code: 'CONFIG_MISSING' }) });
check('CONFIG_MISSING maps to a blocked state', configMissing.status === 'blocked' && configMissing.points.length === 0);

const throwing = await runtime.runOwnerLocalOhlcPreview(blockedRequest, ownerLocalCtx,
  { transportKr: async () => { throw new Error('synthetic transport failure'); } });
check('A thrown transport error never surfaces raw error text and maps to unavailable',
  throwing.status === 'unavailable' && !/synthetic transport failure/.test(JSON.stringify(throwing)));

const insufficient = await runtime.runOwnerLocalOhlcPreview(blockedRequest, ownerLocalCtx,
  { transportKr: async () => ({ ok: true, points: [{ dateTime: '20260101', open: 1, high: 1, low: 1, close: 1, volume: 1 }] }) });
check('A single-point (non-renderable) series falls back to unavailable, not ok',
  insufficient.status === 'unavailable' && insufficient.renderable === false && insufficient.points.length === 0);

const syntheticPoints = [
  { dateTime: '20260101', open: 111, high: 222, low: 100, close: 150, volume: 500 },
  { dateTime: '20260102', open: 150, high: 260, low: 140, close: 200, volume: 600 },
];
const ok = await runtime.runOwnerLocalOhlcPreview(blockedRequest, ownerLocalCtx,
  { transportKr: async () => ({ ok: true, points: syntheticPoints }) });
check('Owner-local gate + verified endpoint + renderable series returns an ok preview with points',
  ok.status === 'ok' && ok.isLive === true && ok.renderable === true && ok.points.length === 2 &&
  ok.endpointKey === 'KR_STOCK_DAILY_OHLC' && ok.endpointVerified === true);
check('OK preview response carries no raw provider fields or secrets',
  !RAW_FIELDS.test(JSON.stringify(ok)) && !SECRET_VALUE(JSON.stringify(ok)));
process.stdout.write('\n');

process.stdout.write(`Checks passed: ${passed}/${passed + failed}\n`);
if (failed > 0) {
  process.stdout.write(`Failures: ${failures.join('; ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('All Phase 3ET checks passed.\n');
}
