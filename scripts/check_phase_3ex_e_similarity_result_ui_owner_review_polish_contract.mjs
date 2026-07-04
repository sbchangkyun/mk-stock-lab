/**
 * Phase 3EX-E documentation and source contract.
 * Similarity result UI owner review and polish: sidebar cleanup + chart-lower tabbed workspace.
 * Static only: no network, browser, dev server, API, provider, live KIS, external AI, or environment access.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error('Network access is blocked in the Phase 3EX-E similarity result ui owner review polish checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = process.cwd();
const startingCommit = '780ab45';

const paths = {
  result: 'docs/planning/phase_3ex_e_similarity_result_ui_owner_review_polish_result_v0.1.md',
  changelog: 'docs/planning/planning_changelog.md',
  checker: 'scripts/check_phase_3ex_e_similarity_result_ui_owner_review_polish_contract.mjs',
  package: 'package.json',
  page: 'src/pages/chart-ai.astro',
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
const phaseSection = source.changelog.split('## Phase 3EX-E - 2026-07-04')[1]?.split('\n## ')[0] ?? '';
const docScanText = `${source.result}\n${phaseSection}`;

const sidebarMatch = source.page.match(/<aside class="chart-stock-sidebar">([\s\S]*?)<\/aside>/);
const sidebarSource = sidebarMatch ? sidebarMatch[1] : '';

const workspaceMatch = source.page.match(/<section id="chartAiAnalysisWorkspace"[\s\S]*?>([\s\S]*?)\n {4}<\/section>\n\n {4}<aside class="chart-lookup-disclaimer"/);
const workspaceSource = workspaceMatch ? workspaceMatch[1] : '';

const similarityPanelMatch = source.page.match(/<div id="chartAiSimilarityPanel"[\s\S]*?>([\s\S]*?)\n {6}<\/div>\n\n {6}<div id="chartAiMkAiPanel"/);
const similarityPanelSource = similarityPanelMatch ? similarityPanelMatch[1] : '';

const mkAiPanelMatch = source.page.match(/<div id="chartAiMkAiPanel"[\s\S]*?>([\s\S]*?)\n {4}<\/section>\n\n {4}<aside class="chart-lookup-disclaimer"/);
const mkAiPanelSource = mkAiPanelMatch ? mkAiPanelMatch[1] : '';

const scriptMatch = source.page.match(/<script>([\s\S]*?)<\/script>/);
const scriptSource = scriptMatch ? scriptMatch[1] : '';

const tabScriptMatch = source.page.match(/\/\/ Chart analysis workspace tabs:[\s\S]*?mkAiTab\?\.addEventListener\('click', \(\) => activateAnalysisTab\('mk-ai'\)\);/);
const tabScriptSource = tabScriptMatch ? tabScriptMatch[0] : '';

const styleMatch = source.page.match(/<style>([\s\S]*?)<\/style>/);
const styleSource = styleMatch ? styleMatch[1] : '';

const contentGridCloseIndex = source.page.indexOf('</aside>\n    </div>');
const workspaceSectionIndex = source.page.indexOf('id="chartAiAnalysisWorkspace"');
const disclaimerIndex = source.page.indexOf('<aside class="chart-lookup-disclaimer"');

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
const EXTERNAL_AI_PATTERN = /openai|anthropic|claude|gemini|gpt-\d|langchain/i;
const ACCOUNT_TRADING_PATTERN = /account[_-]?no|placeorder|trading[_-]?api|order[_-]?api|balance[_-]?api|kis_account/i;
const KIS_IMPORT_PATTERN = /(from\s+['"][^'"]*kis[^'"]*['"])|(require\(\s*['"][^'"]*kis[^'"]*['"]\s*\))/i;
const VERCEL_FILE_PATTERN = /(^|\/)vercel\.(json|ts)$|(^|\/)\.vercel\//i;
const STORAGE_PATTERN = /localStorage|sessionStorage/i;

const apiChanged = [...phaseChanges].some((path) => path.startsWith('src/pages/api/'));
const serverLibChanged = [...phaseChanges].some((path) => path.startsWith('src/lib/server/'));
const similarityLibChanged = [...phaseChanges].some((path) => path.startsWith('src/lib/chartSimilarity/'));
const similarityDataChanged = [...phaseChanges].some((path) => path.startsWith('src/data/chartSimilarity/'));
const supabaseOrMigrationAdded = addedFiles.some((path) => /migration|\.sql$/i.test(path) || /supabase/i.test(path));
const vercelChanged = [...phaseChanges].some((path) => VERCEL_FILE_PATTERN.test(path));

const allowedChangedPaths = new Set([
  'src/pages/chart-ai.astro',
  'docs/planning/phase_3ex_e_similarity_result_ui_owner_review_polish_result_v0.1.md',
  'docs/planning/planning_changelog.md',
  'scripts/check_phase_3ex_e_similarity_result_ui_owner_review_polish_contract.mjs',
  'package.json',
  'scripts/check_phase_3ex_d_similarity_result_ui_mocked_integration_contract.mjs',
  'scripts/check_phase_3ew_c_mk_ai_mocked_scenario_risk_checklist_expansion_contract.mjs',
  'scripts/check_chart_ai_ux_skeleton_static_contract.mjs',
]);
const unexpectedChanges = [...phaseChanges].filter((path) => !allowedChangedPaths.has(path));

let passed = 0;
let failed = 0;
const failures = [];
const check = (label, condition) => {
  if (condition) { passed += 1; process.stdout.write(`  [PASS] ${label}\n`); }
  else { failed += 1; failures.push(label); process.stdout.write(`  [FAIL] ${label}\n`); }
};

process.stdout.write('=== Phase 3EX-E Similarity Result UI Owner Review Polish Contract ===\n\n');

process.stdout.write('Files, commands, and changelog:\n');
check('Result document exists', existsSync(join(root, paths.result)));                                          // 1
check('Checker exists', existsSync(join(root, paths.checker)));                                                  // 2
check('Package checker script exists',                                                                           // 3
  packageJson.scripts?.['check:phase-3ex-e-similarity-result-ui-owner-review-polish'] ===
    'node scripts/check_phase_3ex_e_similarity_result_ui_owner_review_polish_contract.mjs');
check('Changelog contains Phase 3EX-E', phaseSection.length > 0);                                                // 4
check('chart-ai.astro exists', existsSync(join(root, paths.page)));                                              // 5
process.stdout.write('\n');

process.stdout.write('Sidebar cleanup:\n');
check('Sidebar no longer contains chartAiSimilarityCard', !sidebarSource.includes('chartAiSimilarityCard'));      // 6
check('Sidebar no longer contains chartAiSimilarityViewBtn', !sidebarSource.includes('chartAiSimilarityViewBtn')); // 7
check('Sidebar no longer contains chartAiMkAiBtn', !sidebarSource.includes('chartAiMkAiBtn'));                    // 8
check('Sidebar no longer contains a standalone "MK AI" button label',
  !/>MK AI<\/button>/.test(sidebarSource));                                                                       // 9
check('Sidebar still contains 종목 개요', sidebarSource.includes('종목 개요'));                                     // 10
check('Sidebar still contains KIS 연결 프리뷰', sidebarSource.includes('KIS 연결 프리뷰'));                          // 11
check('Sidebar contains a passive analysis note directing to the chart-lower area',
  sidebarSource.includes('차트 분석') && sidebarSource.includes('차트 하단'));                                       // 12
process.stdout.write('\n');

process.stdout.write('Chart analysis workspace structure:\n');
check('Workspace section exists with id chartAiAnalysisWorkspace',
  source.page.includes('id="chartAiAnalysisWorkspace"'));                                                        // 13
check('Workspace heading "차트 분석" present', workspaceSource.includes('차트 분석') || source.page.includes('>차트 분석<')); // 14
check('Workspace is positioned after the sidebar/chart grid and before the page disclaimer',
  contentGridCloseIndex !== -1 && workspaceSectionIndex !== -1 && disclaimerIndex !== -1 &&
    contentGridCloseIndex < workspaceSectionIndex && workspaceSectionIndex < disclaimerIndex);                    // 15
check('Workspace contains a role="tablist" element',
  /class="chart-analysis-tabs"\s+role="tablist"/.test(workspaceSource));                                          // 16
check('Similarity tab button exists with role="tab"',
  /id="chartAiSimilarityTab"[\s\S]{0,200}role="tab"/.test(workspaceSource));                                      // 17
check('MK AI tab button exists with role="tab"',
  /id="chartAiMkAiTab"[\s\S]{0,200}role="tab"/.test(workspaceSource));                                            // 18
check('Similarity tab uses type="button"',
  /id="chartAiSimilarityTab"[\s\S]{0,60}type="button"/.test(workspaceSource));                                    // 19
check('MK AI tab uses type="button"',
  /id="chartAiMkAiTab"[\s\S]{0,60}type="button"/.test(workspaceSource));                                          // 20
check('Similarity tab label is "유사 패턴 분석 보기"', workspaceSource.includes('>유사 패턴 분석 보기</button>'));      // 21
check('MK AI tab label is "MK AI 분석 보기"', workspaceSource.includes('>MK AI 분석 보기</button>'));                 // 22
check('Similarity tab has aria-controls="chartAiSimilarityPanel"',
  /id="chartAiSimilarityTab"[\s\S]{0,200}aria-controls="chartAiSimilarityPanel"/.test(workspaceSource));          // 23
check('MK AI tab has aria-controls="chartAiMkAiPanel"',
  /id="chartAiMkAiTab"[\s\S]{0,200}aria-controls="chartAiMkAiPanel"/.test(workspaceSource));                      // 24
check('Similarity tab defaults to aria-selected="true"',
  /id="chartAiSimilarityTab"[\s\S]{0,200}aria-selected="true"/.test(workspaceSource));                            // 25
check('MK AI tab defaults to aria-selected="false"',
  /id="chartAiMkAiTab"[\s\S]{0,200}aria-selected="false"/.test(workspaceSource));                                 // 26
check('Both tabs share the same visual class chart-analysis-tab',
  /id="chartAiSimilarityTab"[\s\S]{0,200}class="chart-analysis-tab active"/.test(workspaceSource) &&
    /id="chartAiMkAiTab"[\s\S]{0,200}class="chart-analysis-tab"/.test(workspaceSource));                          // 27
process.stdout.write('\n');

process.stdout.write('Tab panels:\n');
check('Similarity tabpanel exists with role="tabpanel"',
  /id="chartAiSimilarityPanel"[\s\S]{0,120}role="tabpanel"/.test(source.page));                                   // 28
check('MK AI tabpanel exists with role="tabpanel"',
  /id="chartAiMkAiPanel"[\s\S]{0,120}role="tabpanel"/.test(source.page));                                         // 29
check('Similarity tabpanel is aria-labelledby the similarity tab',
  /id="chartAiSimilarityPanel"[\s\S]{0,120}aria-labelledby="chartAiSimilarityTab"/.test(source.page));            // 30
check('MK AI tabpanel is aria-labelledby the MK AI tab',
  /id="chartAiMkAiPanel"[\s\S]{0,120}aria-labelledby="chartAiMkAiTab"/.test(source.page));                        // 31
check('MK AI tabpanel is hidden by default (similarity tab active by default)',
  /id="chartAiMkAiPanel"[\s\S]{0,150}hidden/.test(source.page));                                                  // 32
check('Similarity tabpanel is not hidden by default',
  !/id="chartAiSimilarityPanel"[\s\S]{0,150}hidden/.test(source.page));                                           // 33
process.stdout.write('\n');

process.stdout.write('Similarity panel content preserved:\n');
check('유사 패턴 분석 결과 heading preserved', similarityPanelSource.includes('유사 패턴 분석 결과'));                 // 34
check('현재 패턴 요약 heading preserved', similarityPanelSource.includes('현재 패턴 요약'));                          // 35
check('유사 구간 Top 5 heading preserved', similarityPanelSource.includes('유사 구간 Top 5'));                       // 36
check('기준일 100 정규화 heading preserved', similarityPanelSource.includes('기준일 100 정규화'));                    // 37
check('사후 성과 요약 heading preserved', similarityPanelSource.includes('사후 성과 요약'));                          // 38
check('데이터 한계 / 투자 유의 heading preserved', similarityPanelSource.includes('데이터 한계 / 투자 유의'));          // 39
check('샘플 데이터 disclaimer preserved', similarityPanelSource.includes('샘플 데이터'));                             // 40
check('실제 KIS 데이터 아님 disclaimer preserved', similarityPanelSource.includes('실제 KIS 데이터 아님'));            // 41
check('매수·매도 추천 또는 투자자문이 아님 disclaimer preserved',
  similarityPanelSource.includes('매수·매도 추천 또는 투자자문이 아님'));                                              // 42
process.stdout.write('\n');

process.stdout.write('MK AI panel content preserved:\n');
check('MK AI 해석 heading preserved', mkAiPanelSource.includes('MK AI 해석'));                                      // 43
check('요약 section preserved', mkAiPanelSource.includes('요약'));                                                  // 44
check('핵심 해석 section preserved', mkAiPanelSource.includes('핵심 해석'));                                         // 45
check('시나리오 점검 section preserved', mkAiPanelSource.includes('시나리오 점검'));                                  // 46
check('분석 근거 section preserved', mkAiPanelSource.includes('분석 근거'));                                         // 47
check('확인 체크리스트 section preserved', mkAiPanelSource.includes('확인 체크리스트'));                              // 48
check('리스크 체크리스트 section preserved', mkAiPanelSource.includes('리스크 체크리스트'));                           // 49
check('데이터 한계 section preserved', mkAiPanelSource.includes('데이터 한계'));                                      // 50
check('MK AI panel contains no external AI keyword', !EXTERNAL_AI_PATTERN.test(mkAiPanelSource));                 // 51
process.stdout.write('\n');

process.stdout.write('Content separation (only active tab visible by default):\n');
check('Similarity and MK AI content are not both unconditionally visible in one long stack',
  similarityPanelSource.length > 0 && mkAiPanelSource.length > 0 &&
    /id="chartAiMkAiPanel"[\s\S]{0,150}hidden/.test(source.page));                                                // 52
process.stdout.write('\n');

process.stdout.write('Tab-switching script behavior:\n');
check('Script defines an activateAnalysisTab function', /activateAnalysisTab/.test(scriptSource));                // 53
check('Script toggles aria-selected on tab switch', /setAttribute\('aria-selected'/.test(scriptSource));          // 54
check('Script toggles hidden on panel switch',
  /similarityPanel\.hidden\s*=/.test(scriptSource) || /mkAiPanel\.hidden\s*=/.test(scriptSource));                // 55
check('Script wires click listeners for both tabs',
  /similarityTab\?\.addEventListener\('click'/.test(scriptSource) &&
    /mkAiTab\?\.addEventListener\('click'/.test(scriptSource));                                                   // 56
check('Tab-switching code block found in script', tabScriptSource.length > 0);                                    // 57
check('Tab-switching code contains no fetch call', !/\bfetch\(/.test(tabScriptSource));                           // 58
check('Tab-switching code contains no localStorage/sessionStorage access', !STORAGE_PATTERN.test(tabScriptSource)); // 59
check('Tab-switching code contains no KIS provider import', !KIS_IMPORT_PATTERN.test(tabScriptSource));           // 60
check('Script no longer references the deleted chartAiMkAiBtn element',
  !scriptSource.includes("getElementById('chartAiMkAiBtn')"));                                                    // 61
process.stdout.write('\n');

process.stdout.write('CSS behavior:\n');
check('Content grid still uses align-items: start',
  /\.chart-lookup-content-grid\s*\{[^}]*align-items:\s*start;[^}]*\}/.test(styleSource));                         // 62
check('Chart panel and sidebar still use align-self: start',
  /\.chart-market-panel\s*\{[^}]*align-self:\s*start;[^}]*\}/.test(styleSource) &&
    /\.chart-stock-sidebar\s*\{[^}]*align-self:\s*start;[^}]*\}/.test(styleSource));                              // 63
check('Workspace has a full-width card style rule', /\.chart-analysis-workspace\s*\{/.test(styleSource));         // 64
check('Tabs container rule exists', /\.chart-analysis-tabs\s*\{/.test(styleSource));                              // 65
check('Active tab visual state rule exists', /\.chart-analysis-tab\.active\s*\{/.test(styleSource));              // 66
check('No leftover .chart-mk-ai-button rule', !/\.chart-mk-ai-button\s*\{/.test(styleSource));                    // 67
check('Mobile tab CSS exists inside a max-width media query',
  /@media \(max-width:\s*640px\)\s*\{[\s\S]*?\.chart-analysis-tabs\s*\{[\s\S]*?\}/.test(styleSource));            // 68
process.stdout.write('\n');

process.stdout.write('Forbidden changed paths and dependency safety:\n');
check('No src/pages/api files changed', !apiChanged);                                                            // 69
check('No src/lib/server files changed and no src/lib/chartSimilarity/src/data/chartSimilarity files changed',
  !serverLibChanged && !similarityLibChanged && !similarityDataChanged);                                          // 70
check('No Supabase/migration files added, no Vercel files changed, no dependency changes, no images added',
  !supabaseOrMigrationAdded && !vercelChanged && dependenciesUnchanged && devDependenciesUnchanged &&
    addedImages.length === 0);                                                                                    // 71
process.stdout.write('\n');

process.stdout.write('Source content safety scan:\n');
check('Page contains no source=live literal', !/source\s*=\s*['"]?live/i.test(source.page));                      // 72
check('Page contains no source=auto literal', !/source\s*=\s*['"]?auto/i.test(source.page));                      // 73
check('Page contains no account/trading/order/balance API patterns', !ACCOUNT_TRADING_PATTERN.test(source.page)); // 74
check('Page contains no external AI keyword', !EXTERNAL_AI_PATTERN.test(source.page));                            // 75
check('Page contains no raw KIS response fields', !RAW_FIELDS.test(source.page));                                 // 76
check('Docs contain no secret-looking values', !SECRET_VALUE(docScanText));                                       // 77
process.stdout.write('\n');

process.stdout.write('Result document content:\n');
check('Result doc records sidebar cleanup', /sidebar/i.test(source.result) && /removed/i.test(source.result));    // 78
check('Result doc records the new chart analysis workspace', /chart-analysis-workspace|차트 분석/i.test(source.result)); // 79
check('Result doc records tab-switching behavior', /tab/i.test(source.result));                                   // 80
check('Result doc records no API route added',
  /No `\/api\/chart-ai\/similarity` or any other API route/i.test(source.result) ||
    /no api route/i.test(source.result));                                                                         // 81
check('Result doc records no KIS call', /no KIS call/i.test(source.result));                                      // 82
check('Result doc records no real auth', /no real auth/i.test(source.result));                                    // 83
check('Result doc records no usage storage runtime', /no usage storage/i.test(source.result));                    // 84
check('Result doc records no DB/cache runtime', /no DB(\/| or )cache runtime/i.test(source.result));              // 85
check('Result doc records no deployment/push',
  /no deployment/i.test(source.result) && /no `git push`/i.test(source.result));                                  // 86
process.stdout.write('\n');

process.stdout.write('Network and scope safety:\n');
check('Checker blocks network access',
  source.checker.includes('Network access is blocked in the Phase 3EX-E similarity result ui owner review polish checker.') &&
  !fetchAttempted);                                                                                                // 87
check('Only allowed paths changed since starting commit', unexpectedChanges.length === 0);                        // 88
process.stdout.write('\n');

process.stdout.write(`Checks passed: ${passed}/${passed + failed}\n`);
if (failed > 0) {
  process.stdout.write(`Failures: ${failures.join('; ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('All Phase 3EX-E checks passed.\n');
}
