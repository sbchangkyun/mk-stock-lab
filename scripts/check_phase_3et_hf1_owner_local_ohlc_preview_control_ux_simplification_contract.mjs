/**
 * Phase 3ET-HF1 static contract.
 * Owner-local OHLC preview control UX simplification.
 * Static text/structure inspection only. No network, no live KIS, no env values, no dev server,
 * no browser, no public API.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error('Network access is blocked in the Phase 3ET-HF1 owner-local OHLC preview control UX simplification checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = process.cwd();
const startingCommit = '1beafbf';
const paths = {
  result: 'docs/planning/phase_3et_hf1_owner_local_ohlc_preview_control_ux_simplification_result_v0.1.md',
  checker: 'scripts/check_phase_3et_hf1_owner_local_ohlc_preview_control_ux_simplification_contract.mjs',
  changelog: 'docs/planning/planning_changelog.md',
  package: 'package.json',
  page: 'src/pages/chart-ai.astro',
  route: 'src/pages/api/chart-ai/owner-local-ohlc-preview.ts',
  quoteRoute: 'src/pages/api/chart-ai/owner-local-quote-preview.ts',
  adapter: 'src/lib/server/providers/kis/kisOwnerLocalOhlcPreview.ts',
  quoteAdapter: 'src/lib/server/providers/kis/kisOwnerLocalQuotePreview.ts',
  chartAdapter: 'src/lib/chart-ai/ohlcPreviewChart.ts',
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
const phaseSection = source.changelog.split('## Phase 3ET-HF1 - 2026-07-02')[1]?.split('\n## ')[0] ?? '';
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

// Only the actual runtime UI file — never the checker's own source (which legitimately mentions
// the forbidden pattern names) or the result doc (which legitimately documents old copy as context).
const combinedPhaseSource = source.page;

const mainChartPanelMatch = source.page.match(/<section class="chart-market-panel"[\s\S]*?<\/section>/);
const mainChartPanel = mainChartPanelMatch ? mainChartPanelMatch[0] : '';
const quotePreviewSectionMatch = source.page.match(/id="chartAiQuotePreview"[\s\S]*?<\/section>/);
const quotePreviewSection = quotePreviewSectionMatch ? quotePreviewSectionMatch[0] : '';

let passed = 0;
let failed = 0;
const failures = [];
const check = (label, condition) => {
  if (condition) { passed += 1; process.stdout.write(`  [PASS] ${label}\n`); }
  else { failed += 1; failures.push(label); process.stdout.write(`  [FAIL] ${label}\n`); }
};

process.stdout.write('=== Phase 3ET-HF1 Owner-Local OHLC Preview Control UX Simplification Contract ===\n\n');

process.stdout.write('Doc/checker/package/changelog existence (1-4):\n');
check('Result document exists', existsSync(join(root, paths.result)));                                     // 1
check('Static checker exists', existsSync(join(root, paths.checker)));                                     // 2
check('Package checker command exists',                                                                    // 3
  packageJson.scripts?.['check:phase-3et-hf1-owner-local-ohlc-preview-control-ux-simplification'] ===
    'node scripts/check_phase_3et_hf1_owner_local_ohlc_preview_control_ux_simplification_contract.mjs');
check('Changelog contains Phase 3ET-HF1 section', phaseSection.length > 0);                                 // 4
process.stdout.write('\n');

process.stdout.write('Status/feedback (5-6):\n');
check('Result document status is Implemented',
  source.result.includes('Implemented — owner-local OHLC preview control UX simplified.'));                 // 5
check('Result document records the owner feedback (too technical / visually unnecessary)',
  /too technical/i.test(source.result) && /visually unnecessary/i.test(source.result));                     // 6
process.stdout.write('\n');

process.stdout.write('Control presence (7-8):\n');
check('Sidebar card contains a combined preview-actions wrapper with both controls',
  quotePreviewSection.includes('chart-preview-actions') &&
  quotePreviewSection.includes('id="chartAiQuotePreviewBtn"') &&
  quotePreviewSection.includes('id="chartAiOhlcPreviewBtn"'));                                               // 7
check('OHLC preview button is disabled by default in markup',
  /id="chartAiOhlcPreviewBtn"[^>]*disabled/.test(source.page));                                              // 8
process.stdout.write('\n');

process.stdout.write('Copy simplification (9):\n');
check('Page uses the simplified allowed copy set',
  source.page.includes('KIS 차트 프리뷰 확인') &&
  source.page.includes('지연 시세 · KIS OHLC · KRW') &&
  source.page.includes('KIS OHLC 차트가 반영되었습니다.') &&
  source.page.includes('KIS OHLC 데이터를 일시적으로 불러올 수 없습니다. 샘플 차트를 유지합니다.') &&
  source.page.includes('오너 로컬 환경에서만 사용할 수 있습니다.'));                                        // 9
process.stdout.write('\n');

process.stdout.write('Main-chart-area exclusion (10-11):\n');
check('Main chart panel markup no longer contains the OHLC preview button/tag',
  !mainChartPanel.includes('chartAiOhlcPreviewBtn') && !mainChartPanel.includes('chartAiOhlcPreviewTag'));   // 10
check('Main chart panel markup contains no owner-local guide copy or developer-facing gate text',
  !mainChartPanel.includes('오너 로컬 OHLC 프리뷰가 활성화되었습니다') &&
  !mainChartPanel.includes('버튼을 눌러 선택 종목의 OHLC 데이터를 확인하세요') &&
  !mainChartPanel.includes('chart-ohlc-preview-row') &&
  !mainChartPanel.includes('(source=owner-local)'));                                                         // 11
process.stdout.write('\n');

process.stdout.write('Chart status copy (12-13):\n');
check('Sample chart status sets the sample-state copy',
  source.page.includes("setChartStatus('샘플 OHLC·거래량 데이터', '실제 시세 아님')"));                      // 12
check('OHLC preview success sets the KIS OHLC preview-applied status copy',
  source.page.includes("setChartStatus('지연 시세 · KIS OHLC · KRW', '오너 로컬 전용')"));                   // 13
process.stdout.write('\n');

process.stdout.write('Gate/click/reset behavior (14-19):\n');
check('OHLC preview is gated strictly on source=owner-local',
  source.page.includes("get('source') === 'owner-local'"));                                                 // 14
check('OHLC button only enabled / handler attached when owner-local is set',
  /if\s*\(ownerLocalOhlcPreview\)\s*\{[\s\S]*?ohlcPreviewBtn\.disabled = false;[\s\S]*?addEventListener\('click'/.test(source.page) &&
  /\}\s*else\s*\{[\s\S]*?ohlcPreviewBtn\.disabled = true;/.test(source.page));                               // 15
check('OHLC fetch only occurs inside the button click handler, never at top level',
  /addEventListener\('click', async \(\) => \{[\s\S]*?fetch\(`\/api\/chart-ai\/owner-local-ohlc-preview/.test(source.page) &&
  !/^\s*(?:await\s+)?fetch\(`\/api\/chart-ai\/owner-local-ohlc-preview/m.test(source.page));                 // 16
check('Fetch call targets the owner-local OHLC preview route with source and preview flags',
  source.page.includes('/api/chart-ai/owner-local-ohlc-preview') &&
  source.page.includes("source: 'owner-local'") && source.page.includes("preview: 'ohlc'"));                // 17
check('Period change resets the OHLC preview state',
  source.page.includes('resetOhlcPreview();') && /periodButtons\.forEach[\s\S]*?resetOhlcPreview\(\);/.test(source.page)); // 18
check('Symbol/selection change resets the OHLC preview state',
  /updateSelection[\s\S]*?resetOhlcPreview\(\);/.test(source.page));                                         // 19
process.stdout.write('\n');

process.stdout.write('Fallback / quote-preview preservation (20-23):\n');
check('Blocked/unavailable/malformed responses fall back to the sample chart with a safe message',
  source.page.includes('fallbackToSampleChart') &&
  source.page.includes("data?.status === 'blocked'") &&
  source.page.includes('catch') &&
  source.page.includes('표시 가능한 OHLC 데이터가 부족하여 샘플 차트를 유지합니다.'));                       // 20
check('Quote preview gate and fetch wiring are unchanged',
  source.page.includes('ownerLocalPreview') &&
  source.page.includes('/api/chart-ai/owner-local-quote-preview') &&
  source.page.includes("source: 'owner-local'") && source.page.includes("preview: 'quote'"));               // 21
check('Quote preview button click handler is intact',
  /id="chartAiQuotePreviewBtn"/.test(source.page) &&
  /previewBtn\.addEventListener\('click'/.test(source.page));                                                // 22
check('Both preview controls are contained within the single KIS local preview sidebar card',
  quotePreviewSection.length > 0 &&
  quotePreviewSection.includes('KIS 로컬 프리뷰') &&
  quotePreviewSection.includes('id="chartAiQuotePreviewBtn"') &&
  quotePreviewSection.includes('id="chartAiOhlcPreviewBtn"'));                                               // 23
process.stdout.write('\n');

process.stdout.write('API route/adapter preservation (24-32):\n');
check('Owner-local OHLC preview route file is untouched by this phase', !phaseChanges.has(paths.route));     // 24
check('Owner-local quote preview route file is untouched by this phase', !phaseChanges.has(paths.quoteRoute)); // 25
check('Owner-local OHLC preview adapter is untouched by this phase', !phaseChanges.has(paths.adapter));      // 26
check('Owner-local quote preview adapter is untouched by this phase', !phaseChanges.has(paths.quoteAdapter)); // 27
check('Chart geometry adapter (ohlcPreviewChart.ts) is untouched by this phase', !phaseChanges.has(paths.chartAdapter)); // 28
check('Route still requires source=owner-local and preview=ohlc query flags',
  source.route.includes("'source') !== 'owner-local'") && source.route.includes("'preview') !== 'ohlc'"));  // 29
check('Route still requires a localhost host guard',
  source.route.includes('isLocalHostRequest') && source.route.includes('127.0.0.1'));                       // 30
check('Route still requires the three owner-local env flags',
  source.route.includes('KIS_OWNER_LOCAL_SMOKE') && source.route.includes('KIS_ALLOW_LIVE_QUOTE') &&
  source.route.includes('KIS_ENABLE_LIVE_QUOTES'));                                                          // 31
check('Route still calls the adapter under the owner-local gate and blocks non-KR before calling it',
  source.route.includes("mode: 'owner-local'") && source.route.includes('allowKisLive: true') &&
  /market !== 'KR'/.test(source.route));                                                                     // 32
process.stdout.write('\n');

process.stdout.write('No source=live/auto, no account API, no KIS_ACCOUNT_NO (33-36):\n');
check('No source=live introduced in phase files', !/source\s*[:=]\s*['"]live['"]/.test(combinedPhaseSource)); // 33
check('No source=auto introduced in phase files', !/source\s*[:=]\s*['"]auto['"]/.test(combinedPhaseSource)); // 34
check('No account/trading/order/balance API usage introduced in phase files',
  !/inquire-balance|placeOrder|submitOrder|주문|잔고/i.test(combinedPhaseSource));                            // 35
check('No KIS_ACCOUNT_NO usage introduced in phase files',
  !combinedPhaseSource.includes('KIS_ACCOUNT_NO'));                                                          // 36
process.stdout.write('\n');

process.stdout.write('No image/dependency/Supabase-Vercel changes (37-39):\n');
check('No image asset added in this phase', addedImages.length === 0);                                      // 37
check('No dependency added',
  dependenciesUnchanged && devDependenciesUnchanged && !phaseChanges.has('package-lock.json'));              // 38
check('No Supabase/SQL/migration or Vercel config file changed',
  ![...phaseChanges].some((p) => /supabase|migration|\.sql$/i.test(p)) &&
  !phaseChanges.has('vercel.json') && ![...phaseChanges].some((p) => p.startsWith('.vercel/')));             // 39
process.stdout.write('\n');

process.stdout.write('Sanitization (40-42):\n');
check('Result document contains no raw KIS response field names', !RAW_FIELDS.test(source.result));         // 40
check('Result document and changelog contain no secret-looking values',
  !SECRET_VALUE(source.result) && !SECRET_VALUE(phaseSection));                                              // 41
check('Result document records no actual OHLC price example values',
  !/\b(open|high|low|close)\b[^\n]{0,20}\b\d{3,}\b/i.test(source.result));                                   // 42
process.stdout.write('\n');

process.stdout.write('Changelog no-deploy/no-push (43-44):\n');
check('Changelog records no deployment', /no deployment/i.test(phaseSection));                               // 43
check('Changelog records no push', /no push/i.test(phaseSection));                                           // 44
process.stdout.write('\n');

process.stdout.write('Recommended next phase (45):\n');
check('Result document recommends Phase 3ET-OWNER-REVIEW-RETRY',
  source.result.includes('Phase 3ET-OWNER-REVIEW-RETRY'));                                                   // 45
process.stdout.write('\n');

process.stdout.write('Known legacy checker notes (46):\n');
check('Result document documents the expected Phase 3ET wiring checker check #37 regression',
  source.result.includes('check:phase-3et-chart-ai-owner-local-ohlc-preview-wiring') &&
  /check\s*#?37/i.test(source.result));                                                                      // 46
process.stdout.write('\n');

process.stdout.write(`Checks passed: ${passed}/${passed + failed}\n`);
if (fetchAttempted) {
  process.stdout.write('Network access was attempted and blocked.\n');
}
if (failed > 0) {
  process.stdout.write(`Failures: ${failures.join('; ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('All Phase 3ET-HF1 checks passed.\n');
}
