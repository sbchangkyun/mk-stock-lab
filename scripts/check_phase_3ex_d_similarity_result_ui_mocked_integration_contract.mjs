/**
 * Phase 3EX-D documentation and source contract.
 * Similarity result UI mocked integration.
 * Static only: no network, browser, dev server, API, provider, live KIS, external AI, or environment access.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error('Network access is blocked in the Phase 3EX-D similarity result ui mocked integration checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = process.cwd();
const startingCommit = '72ff8b5';

const paths = {
  result: 'docs/planning/phase_3ex_d_similarity_result_ui_mocked_integration_result_v0.1.md',
  changelog: 'docs/planning/planning_changelog.md',
  checker: 'scripts/check_phase_3ex_d_similarity_result_ui_mocked_integration_contract.mjs',
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
const phaseSection = source.changelog.split('## Phase 3EX-D - 2026-07-03')[1]?.split('\n## ')[0] ?? '';
const docScanText = `${source.result}\n${phaseSection}`;

const frontmatterMatch = source.page.match(/^---\r?\n([\s\S]*?)\r?\n---/);
const frontmatter = frontmatterMatch ? frontmatterMatch[1] : '';

const sidebarMatch = source.page.match(/<aside class="chart-stock-sidebar">([\s\S]*?)<\/aside>/);
const sidebarSource = sidebarMatch ? sidebarMatch[1] : '';
const panelMatch = source.page.match(/<section class="chart-similarity-panel"[\s\S]*?id="chartAiSimilarityPanel"[\s\S]*?>([\s\S]*?)\n {4}<\/section>\n\n {4}<aside class="chart-lookup-disclaimer"/);
const panelSource = panelMatch ? panelMatch[1] : '';

const contentGridCloseIndex = source.page.indexOf('</div>\n\n    <section class="chart-similarity-panel"');
const panelSectionIndex = source.page.indexOf('id="chartAiSimilarityPanel"');
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
const MARKET_VALUE_PATTERN = /\b(open|high|low|close|lastPrice|현재가)\b[^\n]{0,20}\b\d{3,}\b/i;
const EXTERNAL_AI_PATTERN = /openai|anthropic|claude|gemini|gpt-\d|langchain/i;
const ACCOUNT_TRADING_PATTERN = /account[_-]?no|placeorder|trading[_-]?api|order[_-]?api|balance[_-]?api|kis_account/i;
const KIS_IMPORT_PATTERN = /(from\s+['"][^'"]*kis[^'"]*['"])|(require\(\s*['"][^'"]*kis[^'"]*['"]\s*\))/i;
const VERCEL_FILE_PATTERN = /(^|\/)vercel\.(json|ts)$|(^|\/)\.vercel\//i;
const CHART_LIBRARY_PATTERN = /recharts|chart\.js|chartjs|echarts|highcharts|d3-shape|from\s+['"]d3['"]/i;

const apiChanged = [...phaseChanges].some((path) => path.startsWith('src/pages/api/'));
const serverProviderChanged = [...phaseChanges].some((path) => path.startsWith('src/lib/server/'));
const similarityLibChanged = [...phaseChanges].some((path) => path.startsWith('src/lib/chartSimilarity/'));
const similarityDataChanged = [...phaseChanges].some((path) => path.startsWith('src/data/chartSimilarity/'));
const supabaseOrMigrationAdded = addedFiles.some((path) => /migration|\.sql$/i.test(path) || /supabase/i.test(path));
const vercelChanged = [...phaseChanges].some((path) => VERCEL_FILE_PATTERN.test(path));

const allowedChangedPaths = new Set([
  'src/pages/chart-ai.astro',
  'docs/planning/phase_3ex_d_similarity_result_ui_mocked_integration_result_v0.1.md',
  'docs/planning/planning_changelog.md',
  'scripts/check_phase_3ex_d_similarity_result_ui_mocked_integration_contract.mjs',
  'package.json',
  'scripts/check_chart_ai_ux_skeleton_static_contract.mjs',
  'scripts/check_phase_3ew_c_mk_ai_mocked_scenario_risk_checklist_expansion_contract.mjs',
]);
const unexpectedChanges = [...phaseChanges].filter((path) => !allowedChangedPaths.has(path));

let passed = 0;
let failed = 0;
const failures = [];
const check = (label, condition) => {
  if (condition) { passed += 1; process.stdout.write(`  [PASS] ${label}\n`); }
  else { failed += 1; failures.push(label); process.stdout.write(`  [FAIL] ${label}\n`); }
};

process.stdout.write('=== Phase 3EX-D Similarity Result UI Mocked Integration Contract ===\n\n');

process.stdout.write('Files, commands, and changelog:\n');
check('Result document exists', existsSync(join(root, paths.result)));                                          // 1
check('Checker exists', existsSync(join(root, paths.checker)));                                                  // 2
check('Package checker script exists',                                                                           // 3
  packageJson.scripts?.['check:phase-3ex-d-similarity-result-ui-mocked-integration'] ===
    'node scripts/check_phase_3ex_d_similarity_result_ui_mocked_integration_contract.mjs');
check('Changelog contains Phase 3EX-D', phaseSection.length > 0);                                                // 4
check('chart-ai.astro exists', existsSync(join(root, paths.page)));                                              // 5
process.stdout.write('\n');

process.stdout.write('Sidebar compact similarity card copy:\n');
check('Sidebar card heading present', sidebarSource.includes('유사 패턴 분석'));                                    // 6
check('Sidebar card status badge present', sidebarSource.includes('샘플 분석'));                                    // 7
check('Sidebar card guide copy present',
  sidebarSource.includes('최근 흐름과 유사했던 과거 구간을 샘플 데이터로 비교합니다.'));                                 // 8
check('Sidebar card button label present', sidebarSource.includes('유사 패턴 분석 보기'));                           // 9
check('Sidebar card gating note present',
  sidebarSource.includes('실제 KIS 기반 실행은 로그인/권한/사용량 제한 적용 후 별도 활성화됩니다.'));                     // 10
process.stdout.write('\n');

process.stdout.write('Full-width panel required copy:\n');
check('Panel heading present', source.page.includes('유사 패턴 분석 결과'));                                        // 11
check('Panel sample-data notice present', panelSource.includes('샘플 데이터'));                                     // 12
check('Panel not-real-KIS notice present', panelSource.includes('실제 KIS 데이터 아님'));                            // 13
check('Panel not-investment-advice notice present', panelSource.includes('투자자문'));                              // 14
check('Section heading 현재 패턴 요약 present', panelSource.includes('현재 패턴 요약'));                              // 15
check('Section heading 유사 구간 Top 5 present', panelSource.includes('유사 구간 Top 5'));                           // 16
check('Section heading 기준일 100 정규화 present', panelSource.includes('기준일 100 정규화'));                       // 17
process.stdout.write('\n');

process.stdout.write('Deterministic engine usage:\n');
check('Frontmatter imports scanSimilarity and buildSyntheticOhlcvFixture, computes result with required options',
  /import\s*\{\s*scanSimilarity\s*\}\s*from\s*['"]\.\.\/lib\/chartSimilarity['"]/.test(frontmatter) &&
    /import\s*\{\s*buildSyntheticOhlcvFixture\s*\}\s*from\s*['"]\.\.\/data\/chartSimilarity\/syntheticOhlcvFixture['"]/.test(frontmatter) &&
    /baseWindow:\s*20/.test(frontmatter) &&
    /forwardWindows:\s*\[5,\s*20\]/.test(frontmatter) &&
    /topK:\s*5/.test(frontmatter) &&
    /similarityMethod:\s*'return_correlation_rmse'/.test(frontmatter) &&
    /excludeRecentBars:\s*40/.test(frontmatter));                                                                // 18
process.stdout.write('\n');

process.stdout.write('No live KIS / no new API surface:\n');
check('Frontmatter contains no fetch call', !/fetch\(/.test(frontmatter));                                       // 19
check('Frontmatter contains no XMLHttpRequest', !/XMLHttpRequest/.test(frontmatter));                            // 20
check('Frontmatter contains no KIS provider import', !KIS_IMPORT_PATTERN.test(frontmatter));                     // 21
check('No new /api/chart-ai/similarity route added',
  !addedFiles.some((path) => path.includes('api/chart-ai/similarity')));                                        // 22
check('Panel/card copy contains no source=live', !/source\s*=\s*['"]?live/i.test(panelSource + sidebarSource));  // 23
check('Panel/card copy contains no source=auto', !/source\s*=\s*['"]?auto/i.test(panelSource + sidebarSource));  // 24
check('Page contains no account/trading/order/balance API patterns', !ACCOUNT_TRADING_PATTERN.test(source.page)); // 25
process.stdout.write('\n');

process.stdout.write('Chart/sidebar stretch layout fix:\n');
check('Content grid uses align-items: start',
  /\.chart-lookup-content-grid\s*\{[^}]*align-items:\s*start;[^}]*\}/.test(source.page));                        // 26
check('Chart panel and sidebar use align-self: start',
  /\.chart-market-panel\s*\{[^}]*align-self:\s*start;[^}]*\}/.test(source.page) &&
    /\.chart-stock-sidebar\s*\{[^}]*align-self:\s*start;[^}]*\}/.test(source.page));                             // 27
process.stdout.write('\n');

process.stdout.write('MK AI relocation and panel placement:\n');
check('MK AI note relocated out of the sidebar into the full-width panel',
  !sidebarSource.includes('id="chartAiMkAiNote"') && panelSource.includes('id="chartAiMkAiNote"'));              // 28
check('Full-width panel is placed after the content grid and before the page disclaimer',
  contentGridCloseIndex !== -1 && panelSectionIndex !== -1 && disclaimerIndex !== -1 &&
    contentGridCloseIndex < panelSectionIndex && panelSectionIndex < disclaimerIndex);                           // 29
process.stdout.write('\n');

process.stdout.write('Accessibility:\n');
check('Similarity button is type="button"',
  /id="chartAiSimilarityViewBtn"[\s\S]{0,40}type="button"|type="button"[\s\S]{0,120}id="chartAiSimilarityViewBtn"/.test(source.page));  // 30
check('Similarity button has aria-controls pointing at the panel',
  /aria-controls="chartAiSimilarityPanel"/.test(source.page));                                                   // 31
check('Similarity button has aria-expanded', /id="chartAiSimilarityViewBtn"/.test(source.page) && /aria-expanded="false"[\s\S]{0,120}aria-controls="chartAiSimilarityPanel"/.test(source.page)); // 32
check('Top 5 table has a caption', /<table class="chart-similarity-top5-table">\s*<caption>/.test(source.page)); // 33
check('Overlay SVG has role and aria-label',
  /class="chart-similarity-overlay-svg"[\s\S]{0,200}role="img"[\s\S]{0,200}aria-label=/.test(source.page));      // 34
process.stdout.write('\n');

process.stdout.write('No external chart library, no dependency changes:\n');
check('No external chart library referenced', !CHART_LIBRARY_PATTERN.test(source.page));                        // 35
check('No dependencies changed', dependenciesUnchanged);                                                         // 36
check('No devDependencies changed', devDependenciesUnchanged);                                                   // 37
process.stdout.write('\n');

process.stdout.write('Forbidden changed paths:\n');
check('No src/pages/api files changed', !apiChanged);                                                            // 38
check('No src/lib/server files changed', !serverProviderChanged);                                                // 39
check('No src/lib/chartSimilarity files changed', !similarityLibChanged);                                        // 40
check('No src/data/chartSimilarity files changed', !similarityDataChanged);                                      // 41
check('No Supabase/migration files added and no Vercel files changed', !supabaseOrMigrationAdded && !vercelChanged); // 42
process.stdout.write('\n');

process.stdout.write('Source safety scan:\n');
check('Page contains no raw KIS response fields', !RAW_FIELDS.test(source.page));                                // 43
check('Docs contain no secret-looking values', !SECRET_VALUE(docScanText));                                      // 44
check('Docs contain no real market value patterns', !MARKET_VALUE_PATTERN.test(docScanText));                    // 45
process.stdout.write('\n');

process.stdout.write('Result document content:\n');
check('Result doc status is implemented',
  source.result.includes('Implemented — mocked similarity result UI integrated into `/chart-ai`'));              // 46
check('Result doc records the layout decision',
  /compact control\/status area only/i.test(source.result) && /full-width panel/i.test(source.result));          // 47
check('Result doc records the mocked data policy',
  /deterministic engine/i.test(source.result) && /synthetic fixture/i.test(source.result));                      // 48
check('Result doc records no KIS provider', source.result.includes('No KIS provider code added.'));              // 49
check('Result doc records no KIS call', source.result.includes('No KIS API call made.'));                        // 50
check('Result doc records no new API route',
  source.result.includes('No `/api/chart-ai/similarity` or any other new API route added.'));                   // 51
check('Result doc records no auth', source.result.includes('No login/auth implemented.'));                       // 52
check('Result doc records no usage guard', source.result.includes('No usage guard implemented.'));               // 53
check('Result doc records no DB/cache runtime', source.result.includes('No DB or cache runtime added.'));        // 54
check('Result doc records no external AI', source.result.includes('No external AI API call made.'));            // 55
check('Result doc records no deployment/push',
  source.result.includes('No Vercel deployment performed.') && source.result.includes('No `git push` performed.')); // 56
process.stdout.write('\n');

process.stdout.write('Network and scope safety:\n');
check('Checker blocks network access',
  source.checker.includes('Network access is blocked in the Phase 3EX-D similarity result ui mocked integration checker.') &&
  !fetchAttempted);                                                                                               // 57
check('Only allowed paths changed since starting commit', unexpectedChanges.length === 0 && addedImages.length === 0); // 58
process.stdout.write('\n');

process.stdout.write(`Checks passed: ${passed}/${passed + failed}\n`);
if (failed > 0) {
  process.stdout.write(`Failures: ${failures.join('; ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('All Phase 3EX-D checks passed.\n');
}
