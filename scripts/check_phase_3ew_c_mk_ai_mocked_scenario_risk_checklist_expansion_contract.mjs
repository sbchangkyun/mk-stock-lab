/**
 * Phase 3EW-C documentation/tooling contract.
 * Chart AI MK AI mocked scenario and risk checklist expansion, with Vercel deployment reporting.
 * Static only: no network, browser, dev server, API, provider, live KIS, external AI, or environment access.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error('Network access is blocked in the Phase 3EW-C mk ai mocked scenario risk checklist expansion checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = process.cwd();
const startingCommit = 'a169d9f';
const paths = {
  result: 'docs/planning/phase_3ew_c_mk_ai_mocked_scenario_risk_checklist_expansion_result_v0.1.md',
  checker: 'scripts/check_phase_3ew_c_mk_ai_mocked_scenario_risk_checklist_expansion_contract.mjs',
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
const phaseSection = source.changelog.split('## Phase 3EW-C - 2026-07-02')[1]?.split('\n## ')[0] ?? '';
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
const BLOCKER_PATTERN = /VERCEL_AUTH_BLOCKED|VERCEL_PROJECT_NOT_LINKED|VERCEL_CLI_MISSING|NETWORK_BLOCKED/;

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

const updateMkAiPanelBody = (() => {
  const startMarker = 'const updateMkAiPanel = () => {';
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

process.stdout.write('=== Phase 3EW-C MK AI Mocked Scenario and Risk Checklist Expansion Contract ===\n\n');

process.stdout.write('Files, command, and changelog:\n');
check('Result document exists', existsSync(join(root, paths.result)));                                          // 1
check('Checker exists', existsSync(join(root, paths.checker)));                                                  // 2
check('Package script exists',                                                                                   // 3
  packageJson.scripts?.['check:phase-3ew-c-mk-ai-mocked-scenario-risk-checklist-expansion'] ===
    'node scripts/check_phase_3ew_c_mk_ai_mocked_scenario_risk_checklist_expansion_contract.mjs');
check('Changelog contains Phase 3EW-C section', phaseSection.length > 0);                                        // 4
process.stdout.write('\n');

process.stdout.write('Result content and deployment reporting:\n');
check('Result status is implemented, or honestly records a deployment blocker',
  source.result.includes('Implemented — mocked scenario and risk checklist expansion complete.') ||
  (/Implemented — local implementation complete; Vercel deployment blocked by/.test(source.result) &&
    BLOCKER_PATTERN.test(source.result)));                                                                       // 5
check('Result records owner-authorized Vercel deployment', /owner[^\n]{0,30}authoriz/i.test(scanText));          // 6
check('Result records no external AI API call', /no external AI (API )?call/i.test(scanText));                  // 7
check('Result records no public KIS data added',
  /no public KIS quote/i.test(scanText) && /no public KIS OHLC/i.test(scanText));                                // 8
process.stdout.write('\n');

process.stdout.write('MK AI panel structure preserved:\n');
check('Page preserves AI 분석 미리보기 heading', source.page.includes('AI 분석 미리보기'));                       // 9
check('Page contains 시나리오 점검 section', source.page.includes('시나리오 점검'));                              // 10
check('Page contains 긍정 관찰 시나리오 card', source.page.includes('긍정 관찰 시나리오'));                        // 11
check('Page contains 기준 유지 시나리오 card', source.page.includes('기준 유지 시나리오'));                        // 12
check('Page contains 주의 점검 시나리오 card', source.page.includes('주의 점검 시나리오'));                        // 13
check('Page contains 리스크 체크리스트 section', source.page.includes('리스크 체크리스트'));                       // 14
process.stdout.write('\n');

process.stdout.write('Deterministic scenario/risk builder:\n');
check('Builder returns deterministic scenarios and riskChecklist (no Math.random/Date.now)',
  buildMockMkAiAnalysisBody.includes('scenarios') &&
  buildMockMkAiAnalysisBody.includes('riskChecklist') &&
  !buildMockMkAiAnalysisBody.includes('Math.random(') &&
  !buildMockMkAiAnalysisBody.includes('Date.now('));                                                             // 15
check('Page contains stock-safe scenario copy',
  source.page.includes('실제 실적, 공시, 수급, 가격 변동 데이터가 반영되지 않았으므로 투자 판단에는 사용할 수 없습니다.')); // 16
check('Page contains ETF-safe scenario copy',
  source.page.includes('실제 구성 종목, NAV, 괴리율, 추적오차가 반영되지 않았으므로 투자 판단에는 사용할 수 없습니다.')); // 17
check('Page contains NAV reference', source.page.includes('NAV'));                                               // 18
check('Page contains 괴리율 reference', source.page.includes('괴리율'));                                          // 19
check('Page contains 추적오차 reference', source.page.includes('추적오차'));                                      // 20
check('Page contains 샘플 분석과 실제 투자 판단 구분 checklist item',
  source.page.includes('샘플 분석과 실제 투자 판단 구분'));                                                        // 21
process.stdout.write('\n');

process.stdout.write('Owner-local connected-state scenario reflection:\n');
check('Builder returns connectedScenarioNote', buildMockMkAiAnalysisBody.includes('connectedScenarioNote'));      // 22
check('Page contains 오너 로컬 KIS 연결 상태가 확인 connected scenario note',
  source.page.includes('오너 로컬 KIS 연결 상태가 확인'));                                                         // 23
process.stdout.write('\n');

process.stdout.write('Selected-symbol and owner-local synchronization (protected call sites unchanged, folded into updateMkAiPanel):\n');
check('Scenario/risk sections update on selected symbol change',
  /updateOverviewDataStatus\(\);\s*updateMkAiPanel\(\);/.test(updateSelectionBody) &&
  updateMkAiPanelBody.includes('mkAiRiskChecklistEl'));                                                          // 24
check('Scenario/risk sections update on owner-local quote success',
  /ownerLocalConnected = true;\s*updateOverviewDataStatus\(\);\s*updateMkAiPanel\(\);\s*const quote = data\.quote;/.test(source.page) &&
  updateMkAiPanelBody.includes('mkAiScenarioPositiveEl'));                                                       // 25
check('Scenario/risk sections update on owner-local OHLC success',
  /ownerLocalConnected = true;\s*updateOverviewDataStatus\(\);\s*updateMkAiPanel\(\);\s*setChartStatus\('지연 시세 · KIS OHLC · KRW', '오너 로컬 전용'\);/.test(source.page) &&
  updateMkAiPanelBody.includes('mkAiConnectedScenarioNoteEl'));                                                  // 26
process.stdout.write('\n');

process.stdout.write('Mocked-first disclaimers preserved:\n');
check('Page contains mocked-first disclaimer',
  source.page.includes('현재 분석은 샘플 로직 기반 미리보기입니다.'));                                            // 27
check('Page contains investment/recommendation disclaimer',
  source.page.includes('실제 투자 판단용 정보가 아니며 매수·매도 추천이 아닙니다'));                               // 28
process.stdout.write('\n');

process.stdout.write('No external AI, no public exposure, no source=live/auto:\n');
check('Page does not introduce external AI API keywords', !EXTERNAL_AI_PATTERN.test(source.page));               // 29
check('Page does not introduce source: \'live\'', !/source:\s*['"]live['"]/i.test(source.page));                 // 30
check('Page does not introduce source: \'auto\'', !/source:\s*['"]auto['"]/i.test(source.page));                 // 31
check('Page does not add public KIS route calls outside owner-local mode',
  source.page.includes('/api/chart-ai/owner-local-quote-preview') &&
  source.page.includes('/api/chart-ai/owner-local-ohlc-preview') &&
  !source.page.includes('source=live') && !source.page.includes('source=auto'));                                 // 32
process.stdout.write('\n');

process.stdout.write('Owner-local routes and gate untouched:\n');
check('Owner-local quote route still exists', existsSync(join(root, paths.ownerLocalQuote)));                    // 33
check('Owner-local OHLC route still exists', existsSync(join(root, paths.ownerLocalOhlc)));                      // 34
check('Owner-local gate file still exists', existsSync(join(root, paths.gate)));                                 // 35
check('No API/provider/gate source files changed in this phase (unless explicitly justified in result document)',
  guardedFilesChanged.length === 0 || guardedApiFiles.every((path) => scanText.includes(path)));                  // 36
process.stdout.write('\n');

process.stdout.write('Account/trading, docs, dependency, and network safety:\n');
check('No KIS_ACCOUNT_NO reference for Chart AI', !source.page.includes('KIS_ACCOUNT_NO'));                      // 37
check('No account/trading/order/balance API references', !/\/api\/(account|trading|order|balance)\b/i.test(source.page)); // 38
check('No Supabase/SQL/migration files added',
  !addedFiles.some((p) => /supabase/i.test(p) || /migration|\.sql$/i.test(p)));                                  // 39
check('No dependency added', dependenciesUnchanged);                                                             // 40
check('No image files added', addedImages.length === 0);                                                         // 41
check('Docs contain no actual market values', !MARKET_VALUE_PATTERN.test(scanText));                             // 42
check('Docs contain no raw KIS response fields', !RAW_FIELDS.test(scanText));                                    // 43
check('Docs contain no secret-looking values', !SECRET_VALUE(scanText));                                         // 44
check('Changelog records no Vercel env changes', /no vercel env change/i.test(phaseSection));                    // 45
check('Changelog records deployment status or blocker',
  /deployment url/i.test(phaseSection) || BLOCKER_PATTERN.test(phaseSection));                                   // 46
check('Checker blocks network access',
  source.checker.includes('Network access is blocked in the Phase 3EW-C mk ai mocked scenario risk checklist expansion checker.') &&
  !fetchAttempted);                                                                                               // 47
check('Package dependencies unchanged', dependenciesUnchanged);                                                  // 48
check('Package devDependencies unchanged', devDependenciesUnchanged);                                            // 49
check('Result records no fabricated deployment URL if deployment was blocked',
  !BLOCKER_PATTERN.test(source.result) || !/https:\/\/[a-z0-9-]+\.vercel\.app/i.test(source.result));            // 50
process.stdout.write('\n');

process.stdout.write(`Checks passed: ${passed}/${passed + failed}\n`);
if (failed > 0) {
  process.stdout.write(`Failures: ${failures.join('; ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('All Phase 3EW-C checks passed.\n');
}
