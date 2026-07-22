/**
 * Phase 3EW-A documentation/tooling contract.
 * Chart AI MK AI analysis panel mocked-first implementation.
 * Static only: no network, browser, dev server, API, provider, live KIS, external AI, or environment access.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error('Network access is blocked in the Phase 3EW-A mk ai analysis panel mocked first checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = process.cwd();
const startingCommit = '1212698';
const paths = {
  result: 'docs/planning/phase_3ew_a_mk_ai_analysis_panel_mocked_first_result_v0.1.md',
  checker: 'scripts/check_phase_3ew_a_mk_ai_analysis_panel_mocked_first_contract.mjs',
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
const phaseSection = source.changelog.split('## Phase 3EW-A - 2026-07-02')[1]?.split('\n## ')[0] ?? '';
const scanText = `${source.result}\n${phaseSection}`;
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
const MARKET_VALUE_PATTERN = /\b(open|high|low|close|lastPrice|현재가)\b[^\n]{0,20}\b\d{3,}\b/i;
const EXTERNAL_AI_PATTERN = /openai|anthropic|gemini|claude-3|claude-4|gpt-3|gpt-4|gpt-5|@ai-sdk|OPENAI_API_KEY|ANTHROPIC_API_KEY/i;

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

process.stdout.write('=== Phase 3EW-A MK AI Analysis Panel Mocked-First Contract ===\n\n');

process.stdout.write('Files, command, and changelog:\n');
check('Result document exists', existsSync(join(root, paths.result)));                                          // 1
check('Checker exists', existsSync(join(root, paths.checker)));                                                  // 2
check('Package script exists',                                                                                   // 3
  packageJson.scripts?.['check:phase-3ew-a-mk-ai-analysis-panel-mocked-first'] ===
    'node scripts/check_phase_3ew_a_mk_ai_analysis_panel_mocked_first_contract.mjs');
check('Changelog contains Phase 3EW-A section', phaseSection.length > 0);                                        // 4
check('Result status is implemented',
  source.result.includes('Implemented — mocked-first MK AI analysis panel complete.'));                         // 5
check('Result records owner request for faster implementation',
  source.result.includes('owner requested faster implementation'));                                             // 6
check('Result records no external AI API call',
  /no external AI (API )?call/i.test(scanText));                                                                 // 7
check('Result records no public KIS data added',
  /no public KIS quote/i.test(scanText) && /no public KIS OHLC/i.test(scanText));                                // 8
process.stdout.write('\n');

process.stdout.write('MK AI panel structure:\n');
check('Page contains MK AI panel heading', source.page.includes('id="chart-mk-ai-heading"'));                    // 9
check('Page contains AI 분석 미리보기', source.page.includes('AI 분석 미리보기'));                                // 10
check('Page contains 샘플 분석 status', source.page.includes('샘플 분석'));                                       // 11
check('Page contains 오너 로컬 연결 대기 status', source.page.includes('오너 로컬 연결 대기'));                    // 12
check('Page contains 오너 로컬 데이터 반영 status', source.page.includes('오너 로컬 데이터 반영'));                // 13
process.stdout.write('\n');

process.stdout.write('Deterministic mocked analysis builder:\n');
check('Page contains deterministic MK AI analysis builder', source.page.includes('buildMockMkAiAnalysis'));      // 14
check('Page contains stock-safe analysis copy', source.page.includes('상장 국내 주식으로'));                     // 15
check('Page contains ETF-safe analysis copy', source.page.includes('상장 국내 ETF로'));                          // 16
check('Page contains selected-symbol-aware MK AI update logic',
  updateSelectionBody.includes('selectedRecord = record;') && updateSelectionBody.includes('updateMkAiPanel();')); // 17
check('Page contains data basis list', source.page.includes('chartAiMkAiBasisList'));                             // 18
check('Page contains 종목 식별 정보', source.page.includes('종목 식별 정보'));                                     // 19
check('Page contains 샘플 OHLC·거래량 데이터', source.page.includes('샘플 OHLC·거래량 데이터'));                   // 20
check('Page contains 오너 로컬 KIS 연결 상태', source.page.includes('오너 로컬 KIS 연결 상태'));                   // 21
check('Page contains mocked-first disclaimer',
  source.page.includes('현재 분석은 샘플 로직 기반 미리보기입니다.'));                                            // 22
check('Page contains investment/recommendation disclaimer',
  source.page.includes('실제 투자 판단용 정보가 아니며 매수·매도 추천이 아닙니다'));                               // 23
process.stdout.write('\n');

process.stdout.write('Selected-symbol and owner-local synchronization:\n');
check('MK AI panel updates on selected symbol change',
  /updateOverviewDataStatus\(\);\s*updateMkAiPanel\(\);/.test(updateSelectionBody));                              // 24
check('MK AI panel updates on owner-local quote success',
  /ownerLocalConnected = true;\s*updateOverviewDataStatus\(\);\s*updateMkAiPanel\(\);\s*const quote = data\.quote;/.test(source.page)); // 25
check('MK AI panel updates on owner-local OHLC success',
  /ownerLocalConnected = true;\s*updateOverviewDataStatus\(\);\s*updateMkAiPanel\(\);\s*setChartStatus\('지연 시세 · KIS OHLC · KRW', '오너 로컬 전용'\);/.test(source.page)); // 26
process.stdout.write('\n');

process.stdout.write('No external AI, no public exposure, no source=live/auto:\n');
check('Page does not introduce external AI API keywords', !EXTERNAL_AI_PATTERN.test(source.page));               // 27
check('Page does not introduce source: \'live\'', !/source:\s*['"]live['"]/i.test(source.page));                 // 28
check('Page does not introduce source: \'auto\'', !/source:\s*['"]auto['"]/i.test(source.page));                 // 29
check('Page does not add public KIS route calls outside owner-local mode',
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
check('No dependency added (package-lock untouched)', !phaseChanges.has('package-lock.json'));                   // 37
check('No image files added', addedImages.length === 0);                                                          // 38
process.stdout.write('\n');

process.stdout.write('Docs safety and changelog:\n');
check('Docs contain no actual market values', !MARKET_VALUE_PATTERN.test(scanText));                              // 39
check('Docs contain no raw KIS response fields', !RAW_FIELDS.test(scanText));                                     // 40
check('Docs contain no secret-looking values', !SECRET_VALUE(scanText));                                          // 41
check('Changelog records no deployment', /no deployment/i.test(phaseSection));                                    // 42
check('Changelog records no push', /no push/i.test(phaseSection));                                                // 43
check('Checker blocks network access',
  source.checker.includes('Network access is blocked in the Phase 3EW-A mk ai analysis panel mocked first checker.') &&
  !fetchAttempted);                                                                                                // 44
check('Package dependencies unchanged', dependenciesUnchanged);                                                   // 45
check('Package devDependencies unchanged', devDependenciesUnchanged);                                             // 46
process.stdout.write('\n');

process.stdout.write(`Checks passed: ${passed}/${passed + failed}\n`);
if (failed > 0) {
  process.stdout.write(`Failures: ${failures.join('; ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('All Phase 3EW-A checks passed.\n');
}
