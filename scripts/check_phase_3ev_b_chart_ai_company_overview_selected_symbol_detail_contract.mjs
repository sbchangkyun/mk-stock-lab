/**
 * Phase 3EV-B documentation/tooling contract.
 * Chart AI company overview and selected-symbol detail implementation.
 * Static only: no network, browser, dev server, API, provider, live KIS, or environment access.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error('Network access is blocked in the Phase 3EV-B chart ai company overview selected symbol detail checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = process.cwd();
const startingCommit = 'aab865a';
const paths = {
  result: 'docs/planning/phase_3ev_b_chart_ai_company_overview_selected_symbol_detail_result_v0.1.md',
  checker: 'scripts/check_phase_3ev_b_chart_ai_company_overview_selected_symbol_detail_contract.mjs',
  changelog: 'docs/planning/planning_changelog.md',
  package: 'package.json',
  page: 'src/pages/chart-ai.astro',
  ownerLocalQuote: 'src/pages/api/chart-ai/owner-local-quote-preview.ts',
  ownerLocalOhlc: 'src/pages/api/chart-ai/owner-local-ohlc-preview.ts',
  gate: 'src/lib/server/providers/kis/kisOwnerLocalGate.ts',
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
const phaseSection = source.changelog.split('## Phase 3EV-B - 2026-07-02')[1]?.split('\n## ')[0] ?? '';
const scanText = `${source.result}\n${phaseSection}`;
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
const MARKET_VALUE_PATTERN = /\b(open|high|low|close|lastPrice|현재가)\b[^\n]{0,20}\b\d{3,}\b/i;

const updateSelectionBody = (() => {
  const startMarker = 'const updateSelection = (record: ClientSafeSymbolSearchRecord) => {';
  const start = source.page.indexOf(startMarker);
  if (start === -1) return '';
  const end = source.page.indexOf('\n      };', start);
  return end === -1 ? '' : source.page.slice(start, end);
})();

let passed = 0;
let failed = 0;
const failures = [];
const check = (label, condition) => {
  if (condition) { passed += 1; process.stdout.write(`  [PASS] ${label}\n`); }
  else { failed += 1; failures.push(label); process.stdout.write(`  [FAIL] ${label}\n`); }
};

process.stdout.write('=== Phase 3EV-B Chart AI Company Overview and Selected Symbol Detail Contract ===\n\n');

process.stdout.write('Files, command, and changelog:\n');
check('Result document exists', existsSync(join(root, paths.result)));                                          // 1
check('Checker exists', existsSync(join(root, paths.checker)));                                                  // 2
check('Package script exists',                                                                                   // 3
  packageJson.scripts?.['check:phase-3ev-b-chart-ai-company-overview-selected-symbol-detail'] ===
    'node scripts/check_phase_3ev_b_chart_ai_company_overview_selected_symbol_detail_contract.mjs');
check('Changelog contains Phase 3EV-B section', phaseSection.length > 0);                                        // 4
check('Result status is implemented',
  source.result.includes('Implemented — company overview and selected-symbol detail behavior complete.'));       // 5
check('Result records owner request for faster implementation',
  source.result.includes('owner requested faster implementation'));                                             // 6
check('Result records no public KIS data added',
  /no public KIS quote/i.test(scanText) && /no public KIS OHLC/i.test(scanText));                                // 7
process.stdout.write('\n');

process.stdout.write('Selected-symbol overview and detail builder:\n');
check('Page contains selected-symbol-aware overview logic',
  source.page.includes('buildSelectedSymbolOverview'));                                                          // 8
check('Page contains deterministic detail builder / data-status helper',
  source.page.includes('buildSelectedSymbolOverview') && source.page.includes('updateOverviewDataStatus'));      // 9
process.stdout.write('\n');

process.stdout.write('Required overview field labels:\n');
check('Page contains 종목 개요', source.page.includes('종목 개요'));                                              // 10
check('Page contains 종목명', source.page.includes('종목명'));                                                    // 11
check('Page contains 종목코드', source.page.includes('종목코드'));                                                // 12
check('Page contains 시장', source.page.includes('시장'));                                                        // 13
check('Page contains 종목 유형', source.page.includes('종목 유형'));                                              // 14
check('Page contains 통화', source.page.includes('통화'));                                                        // 15
check('Page contains 데이터 상태', source.page.includes('데이터 상태'));                                          // 16
process.stdout.write('\n');

process.stdout.write('Stock/ETF-safe copy and disclaimers:\n');
check('Page contains stock-safe overview copy',
  source.page.includes('에 상장된 국내 주식입니다'));                                                             // 17
check('Page contains ETF-safe overview copy',
  source.page.includes('에 상장된 국내 ETF입니다'));                                                              // 18
check('Page contains 정식 기업 공시 데이터가 아닌',
  source.page.includes('정식 기업 공시 데이터가 아닌'));                                                          // 19
check('Page contains 실제 투자 판단용 정보가 아닙니다',
  source.page.includes('실제 투자 판단용 정보가 아닙니다'));                                                      // 20
process.stdout.write('\n');

process.stdout.write('Selected-symbol synchronization:\n');
check('Overview updates on selected symbol change',
  updateSelectionBody.includes('updateOverviewDataStatus()') &&
  updateSelectionBody.includes('buildSelectedSymbolOverview(record)'));                                          // 21
check('Quote preview state resets on symbol change',
  updateSelectionBody.includes('resetQuotePreview()'));                                                          // 22
check('OHLC preview state resets on symbol change',
  updateSelectionBody.includes('resetOhlcPreview()'));                                                           // 23
check('Sample chart behavior preserved on symbol/period change',
  (source.page.match(/resetOhlcPreview\(\);\s*renderChart\(\);/g) ?? []).length >= 2);                           // 24
process.stdout.write('\n');

process.stdout.write('Preview buttons and KIS connected mode preserved:\n');
check('Page retains owner-local quote preview button',
  source.page.includes('id="chartAiQuotePreviewBtn"'));                                                          // 25
check('Page retains owner-local OHLC preview button',
  source.page.includes('id="chartAiOhlcPreviewBtn"'));                                                           // 26
check('Page retains KIS connected mode label',
  source.page.includes('오너 로컬 KIS 연결 모드'));                                                               // 27
process.stdout.write('\n');

process.stdout.write('No public exposure / no source=live or source=auto:\n');
check('Page does not introduce source: \'live\'', !/source:\s*['"]live['"]/i.test(source.page));                 // 28
check('Page does not introduce source: \'auto\'', !/source:\s*['"]auto['"]/i.test(source.page));                 // 29
check('Owner-local fetch calls target only owner-local endpoints',
  source.page.includes('/api/chart-ai/owner-local-quote-preview') &&
  source.page.includes('/api/chart-ai/owner-local-ohlc-preview') &&
  !source.page.includes('source=live') && !source.page.includes('source=auto'));                                 // 30
process.stdout.write('\n');

process.stdout.write('Owner-local routes and gate untouched:\n');
check('Owner-local quote route still exists', existsSync(join(root, paths.ownerLocalQuote)));                    // 31
check('Owner-local OHLC route still exists', existsSync(join(root, paths.ownerLocalOhlc)));                      // 32
check('Owner-local gate file still exists', existsSync(join(root, paths.gate)));                                 // 33
process.stdout.write('\n');

process.stdout.write('Account/trading boundary and dependency safety:\n');
check('Page does not reference KIS_ACCOUNT_NO for Chart AI', !source.page.includes('KIS_ACCOUNT_NO'));           // 34
check('Page does not reference account/trading/order/balance APIs',
  !/\/api\/(account|trading|order|balance)\b/i.test(source.page));                                                // 35
check('No Supabase/SQL/migration file added',
  !addedFiles.some((p) => /supabase/i.test(p) || /migration|\.sql$/i.test(p)));                                   // 36
check('No dependency added',
  dependenciesUnchanged && devDependenciesUnchanged && !addedFiles.includes('package-lock.json'));                // 37
check('No image files added', addedImages.length === 0);                                                          // 38
process.stdout.write('\n');

process.stdout.write('Docs safety and changelog:\n');
check('Docs contain no actual market values', !MARKET_VALUE_PATTERN.test(scanText));                              // 39
check('Docs contain no raw KIS response fields', !RAW_FIELDS.test(scanText));                                     // 40
check('Docs contain no secret-looking values', !SECRET_VALUE(scanText));                                          // 41
check('Changelog records no deployment', /no deployment/i.test(phaseSection));                                    // 42
check('Changelog records no push', /no push/i.test(phaseSection));                                                // 43
check('Checker blocks network access',
  source.checker.includes('Network access is blocked in the Phase 3EV-B chart ai company overview selected symbol detail checker.') &&
  !fetchAttempted);                                                                                                // 44
process.stdout.write('\n');

process.stdout.write(`Checks passed: ${passed}/${passed + failed}\n`);
if (failed > 0) {
  process.stdout.write(`Failures: ${failures.join('; ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('All Phase 3EV-B checks passed.\n');
}
