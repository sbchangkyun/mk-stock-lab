/**
 * Phase 3EW-B documentation/tooling contract.
 * Chart AI MK AI analysis panel interaction and explanation depth.
 * Static only: no network, browser, dev server, API, provider, live KIS, external AI, or environment access.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error('Network access is blocked in the Phase 3EW-B mk ai analysis panel interaction depth checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = process.cwd();
const startingCommit = '285e8d6';
const paths = {
  result: 'docs/planning/phase_3ew_b_mk_ai_analysis_panel_interaction_depth_result_v0.1.md',
  checker: 'scripts/check_phase_3ew_b_mk_ai_analysis_panel_interaction_depth_contract.mjs',
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
const phaseSection = source.changelog.split('## Phase 3EW-B - 2026-07-02')[1]?.split('\n## ')[0] ?? '';
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

const buildMockMkAiAnalysisBody = (() => {
  const startMarker = 'const buildMockMkAiAnalysis = (';
  const start = source.page.indexOf(startMarker);
  if (start === -1) return '';
  const end = source.page.indexOf('\n      };', start);
  return end === -1 ? '' : source.page.slice(start, end);
})();

const guardedApiFiles = ['src/pages/api/chart-ai/owner-local-quote-preview.ts', 'src/pages/api/chart-ai/owner-local-ohlc-preview.ts', 'src/lib/server/providers/kis/kisOwnerLocalGate.ts'];
const guardedFilesChanged = guardedApiFiles.filter((path) => phaseChanges.has(path));

let passed = 0;
let failed = 0;
const failures = [];
const check = (label, condition) => {
  if (condition) { passed += 1; process.stdout.write(`  [PASS] ${label}\n`); }
  else { failed += 1; failures.push(label); process.stdout.write(`  [FAIL] ${label}\n`); }
};

process.stdout.write('=== Phase 3EW-B MK AI Analysis Panel Interaction Depth Contract ===\n\n');

process.stdout.write('Files, command, and changelog:\n');
check('Result document exists', existsSync(join(root, paths.result)));                                          // 1
check('Checker exists', existsSync(join(root, paths.checker)));                                                  // 2
check('Package script exists',                                                                                   // 3
  packageJson.scripts?.['check:phase-3ew-b-mk-ai-analysis-panel-interaction-depth'] ===
    'node scripts/check_phase_3ew_b_mk_ai_analysis_panel_interaction_depth_contract.mjs');
check('Changelog contains Phase 3EW-B section', phaseSection.length > 0);                                        // 4
process.stdout.write('\n');

process.stdout.write('Result content:\n');
check('Result status is implemented',
  source.result.includes('Implemented — MK AI interaction and explanation depth complete.'));                   // 5
check('Result records background reference to Phase 3EW-A', /Phase 3EW-A/.test(scanText));                      // 6
check('Result records no external AI API call', /no external AI (API )?call/i.test(scanText));                  // 7
check('Result records no public KIS data added',
  /no public KIS quote/i.test(scanText) && /no public KIS OHLC/i.test(scanText));                                // 8
process.stdout.write('\n');

process.stdout.write('MK AI panel sectioned structure:\n');
check('Page preserves AI 분석 미리보기 heading', source.page.includes('AI 분석 미리보기'));                       // 9
check('Page contains 요약 section label', source.page.includes('>요약<'));                                       // 10
check('Page contains 핵심 해석 section label', source.page.includes('핵심 해석'));                                // 11
check('Page contains 분석 근거 section label', source.page.includes('분석 근거'));                                // 12
check('Page contains 확인 체크리스트 section label', source.page.includes('확인 체크리스트'));                    // 13
check('Page contains 데이터 한계 section label', source.page.includes('데이터 한계'));                            // 14
process.stdout.write('\n');

process.stdout.write('Expandable/collapsible interaction:\n');
check('Page uses native <details class="chart-mk-ai-details">', source.page.includes('<details class="chart-mk-ai-details">')); // 15
check('Page contains 분석 근거 자세히 보기 expandable summary', source.page.includes('분석 근거 자세히 보기'));    // 16
check('Page contains 데이터 한계 확인 expandable summary', source.page.includes('데이터 한계 확인'));              // 17
process.stdout.write('\n');

process.stdout.write('Deterministic explanation builder:\n');
check('Page contains deterministic MK AI analysis builder', source.page.includes('buildMockMkAiAnalysis'));      // 18
check('Page contains getTopicParticle helper', source.page.includes('getTopicParticle'));                        // 19
check('Builder returns keyInterpretation', buildMockMkAiAnalysisBody.includes('keyInterpretation'));              // 20
check('Builder returns evidence', buildMockMkAiAnalysisBody.includes('evidence'));                                // 21
check('Builder returns checklist', buildMockMkAiAnalysisBody.includes('checklist'));                              // 22
check('Builder returns limitations', buildMockMkAiAnalysisBody.includes('limitations'));                          // 23
check('Builder returns connectedNote', buildMockMkAiAnalysisBody.includes('connectedNote'));                      // 24
check('Page contains renderMkAiList helper', source.page.includes('renderMkAiList'));                             // 25
check('Page wires evidence/checklist/limitations list elements',
  source.page.includes('chartAiMkAiEvidenceList') &&
  source.page.includes('chartAiMkAiChecklist') &&
  source.page.includes('chartAiMkAiLimitations'));                                                                // 26
check('Page contains chartAiMkAiConnectedNote element', source.page.includes('chartAiMkAiConnectedNote'));        // 27
process.stdout.write('\n');

process.stdout.write('Stock/ETF-safe explanation copy:\n');
check('Page contains stock-safe analysis copy', source.page.includes('상장 국내 주식으로'));                     // 28
check('Page contains ETF-safe analysis copy', source.page.includes('상장 국내 ETF로'));                          // 29
check('Page contains ETF composition/NAV/tracking-error disclaimer',
  source.page.includes('구성 종목, NAV, 괴리율, 추적오차'));                                                       // 30
check('Page contains ETF structure sample-analysis disclaimer',
  source.page.includes('ETF 구조 확인용 샘플 분석'));                                                              // 31
process.stdout.write('\n');

process.stdout.write('Checklist guidance content:\n');
check('Page contains identity-confirmation checklist item',
  source.page.includes('종목 식별 정보가 의도한 종목과 일치하는지 확인'));                                        // 32
check('Page contains pre-decision verification checklist item',
  source.page.includes('투자 판단 전 실제 공시·재무·시세 데이터 별도 확인'));                                     // 33
process.stdout.write('\n');

process.stdout.write('Selected-symbol and owner-local synchronization (call sites unchanged):\n');
check('MK AI panel updates on selected symbol change',
  /updateOverviewDataStatus\(\);\s*updateMkAiPanel\(\);/.test(updateSelectionBody));                              // 34
check('MK AI panel updates on owner-local quote success',
  /ownerLocalConnected = true;\s*updateOverviewDataStatus\(\);\s*updateMkAiPanel\(\);\s*const quote = data\.quote;/.test(source.page)); // 35
check('MK AI panel updates on owner-local OHLC success',
  /ownerLocalConnected = true;\s*updateOverviewDataStatus\(\);\s*updateMkAiPanel\(\);\s*setChartStatus\('지연 시세 · KIS OHLC · KRW', '오너 로컬 전용'\);/.test(source.page)); // 36
process.stdout.write('\n');

process.stdout.write('Owner-local connected state reflection:\n');
check('Page contains 오너 로컬 데이터 반영 status', source.page.includes('오너 로컬 데이터 반영'));                // 37
check('Page contains 오너 로컬 연결 대기 status', source.page.includes('오너 로컬 연결 대기'));                    // 38
check('Page contains connected-state explanation copy',
  source.page.includes('오너 로컬 KIS 연결이 확인된 상태입니다. 단, 본 패널은 아직 샘플 분석 로직으로 표시됩니다.')); // 39
check('Page contains 오너 로컬 KIS 연결 상태 data basis entry', source.page.includes('오너 로컬 KIS 연결 상태'));   // 40
process.stdout.write('\n');

process.stdout.write('Mocked-first disclaimers:\n');
check('Page contains mocked-first disclaimer',
  source.page.includes('현재 분석은 샘플 로직 기반 미리보기입니다.'));                                            // 41
check('Page contains investment/recommendation disclaimer',
  source.page.includes('실제 투자 판단용 정보가 아니며 매수·매도 추천이 아닙니다'));                               // 42
process.stdout.write('\n');

process.stdout.write('No external AI, no public exposure, no source=live/auto:\n');
check('Page does not introduce external AI API keywords', !EXTERNAL_AI_PATTERN.test(source.page));               // 43
check('Page does not introduce source: \'live\' or \'auto\'',
  !/source:\s*['"]live['"]/i.test(source.page) && !/source:\s*['"]auto['"]/i.test(source.page));                  // 44
check('Page does not add public KIS route calls outside owner-local mode',
  source.page.includes('/api/chart-ai/owner-local-quote-preview') &&
  source.page.includes('/api/chart-ai/owner-local-ohlc-preview') &&
  !source.page.includes('source=live') && !source.page.includes('source=auto'));                                 // 45
process.stdout.write('\n');

process.stdout.write('Owner-local routes and gate untouched:\n');
check('Owner-local quote route still exists', existsSync(join(root, paths.ownerLocalQuote)));                    // 46
check('Owner-local OHLC route still exists', existsSync(join(root, paths.ownerLocalOhlc)));                      // 47
check('Owner-local gate file still exists', existsSync(join(root, paths.gate)));                                 // 48
process.stdout.write('\n');

process.stdout.write('Account/trading, docs, dependency, and network safety:\n');
check('No unsafe boundary references or file additions (KIS_ACCOUNT_NO, account/trading APIs, raw KIS fields, secrets, market values, Supabase/SQL/migration, images, dependency, network, deployment/push)',
  !source.page.includes('KIS_ACCOUNT_NO') &&
  !/\/api\/(account|trading|order|balance)\b/i.test(source.page) &&
  !RAW_FIELDS.test(scanText) &&
  !SECRET_VALUE(scanText) &&
  !MARKET_VALUE_PATTERN.test(scanText) &&
  !addedFiles.some((p) => /supabase/i.test(p) || /migration|\.sql$/i.test(p)) &&
  addedImages.length === 0 &&
  !phaseChanges.has('package-lock.json') &&
  /no deployment/i.test(phaseSection) &&
  /no push/i.test(phaseSection) &&
  source.checker.includes('Network access is blocked in the Phase 3EW-B mk ai analysis panel interaction depth checker.') &&
  !fetchAttempted &&
  dependenciesUnchanged &&
  devDependenciesUnchanged);                                                                                      // 49
check('No API/provider/gate source files changed in this phase (unless explicitly justified in result document)',
  guardedFilesChanged.length === 0 || guardedApiFiles.every((path) => scanText.includes(path)));                  // 50
process.stdout.write('\n');

process.stdout.write(`Checks passed: ${passed}/${passed + failed}\n`);
if (failed > 0) {
  process.stdout.write(`Failures: ${failures.join('; ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('All Phase 3EW-B checks passed.\n');
}
