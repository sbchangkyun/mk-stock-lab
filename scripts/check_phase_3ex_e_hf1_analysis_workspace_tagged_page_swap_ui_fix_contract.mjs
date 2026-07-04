/**
 * Phase 3EX-E-HF1 documentation and source contract.
 * Analysis workspace tagged page swap UI fix: post-it tags + separated page canvas.
 * Static only: no network, browser, dev server, API, provider, live KIS, external AI, or environment access.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error('Network access is blocked in the Phase 3EX-E-HF1 analysis workspace tagged page swap ui fix checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = process.cwd();
const startingCommit = '2a1c151';

const paths = {
  result: 'docs/planning/phase_3ex_e_hf1_analysis_workspace_tagged_page_swap_ui_fix_result_v0.1.md',
  changelog: 'docs/planning/planning_changelog.md',
  checker: 'scripts/check_phase_3ex_e_hf1_analysis_workspace_tagged_page_swap_ui_fix_contract.mjs',
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
const phaseSection = source.changelog.split('## Phase 3EX-E-HF1 - 2026-07-04')[1]?.split('\n## ')[0] ?? '';
const docScanText = `${source.result}\n${phaseSection}`;

const workspaceMatch = source.page.match(/<section id="chartAiAnalysisWorkspace"[\s\S]*?>([\s\S]*?)\n {4}<\/section>\n\n {4}<aside class="chart-lookup-disclaimer"/);
const workspaceSource = workspaceMatch ? workspaceMatch[1] : '';

const similarityPanelMatch = source.page.match(/<div id="chartAiSimilarityPanel"[\s\S]*?>([\s\S]*?)\n {6}<\/div>\n\n {6}<div id="chartAiMkAiPanel"/);
const similarityPanelSource = similarityPanelMatch ? similarityPanelMatch[1] : '';

const mkAiPanelMatch = source.page.match(/<div id="chartAiMkAiPanel"[\s\S]*?>([\s\S]*?)\n {4}<\/section>\n\n {4}<aside class="chart-lookup-disclaimer"/);
const mkAiPanelSource = mkAiPanelMatch ? mkAiPanelMatch[1] : '';

const similarityOpenTagMatch = source.page.match(/<div id="chartAiSimilarityPanel"[^>]*>/);
const similarityOpenTag = similarityOpenTagMatch ? similarityOpenTagMatch[0] : '';
const mkAiOpenTagMatch = source.page.match(/<div id="chartAiMkAiPanel"[^>]*>/);
const mkAiOpenTag = mkAiOpenTagMatch ? mkAiOpenTagMatch[0] : '';

const tabScriptMatch = source.page.match(/\/\/ Chart analysis workspace page-swap:[\s\S]*?\n {6}\}\);/);
const tabScriptSource = tabScriptMatch ? tabScriptMatch[0] : '';

const styleMatch = source.page.match(/<style>([\s\S]*?)<\/style>/);
const styleSource = styleMatch ? styleMatch[1] : '';

const reducedMotionSplit = styleSource.split('@media (prefers-reduced-motion: reduce)')[1] ?? '';
const mobileSplit = styleSource.split('@media (max-width: 640px)')[1] ?? '';

const phaseChanges = new Set(git('diff', '--name-only', startingCommit).split(/\r?\n/).filter(Boolean));
const addedFiles = git('diff', '--name-only', '--diff-filter=A', startingCommit).split(/\r?\n/).filter(Boolean);
const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif', '.bmp']);
const addedImages = addedFiles.filter((path) => imageExtensions.has(extname(path).toLowerCase()));
const dependenciesUnchanged = JSON.stringify(packageJson.dependencies ?? {}) === JSON.stringify(baselinePackage.dependencies ?? {});
const devDependenciesUnchanged = JSON.stringify(packageJson.devDependencies ?? {}) === JSON.stringify(baselinePackage.devDependencies ?? {});

const pageDiffRaw = git('diff', startingCommit, '--', paths.page);
const addedLines = pageDiffRaw
  .split(/\r?\n/)
  .filter((line) => line.startsWith('+') && !line.startsWith('+++'))
  .map((line) => line.slice(1))
  .join('\n');

const RAW_FIELDS = /stck_bsop_date|stck_oprc|stck_hgpr|stck_lwpr|stck_clpr|acml_vol|rt_cd|msg_cd|output2/i;
const SECRET_VALUE = (text) =>
  /Bearer\s+[A-Za-z0-9._-]{8,}/.test(text) ||
  /KIS_APP_KEY['"]?\s*[:=]\s*['"]?[A-Za-z0-9]{8,}/.test(text) ||
  /KIS_APP_SECRET['"]?\s*[:=]\s*['"]?[A-Za-z0-9]{8,}/.test(text) ||
  /KIS_ACCESS_TOKEN['"]?\s*[:=]\s*['"]?[A-Za-z0-9]{8,}/.test(text);
const EXTERNAL_AI_PATTERN = /openai|anthropic|claude|gemini|gpt-\d|langchain/i;
const ACCOUNT_TRADING_PATTERN = /account[_-]?no|placeorder|trading[_-]?api|order[_-]?api|balance[_-]?api|kis_account/i;
const KIS_IMPORT_PATTERN = /(from\s+['"][^'"]*kis[^'"]*['"])|(require\(\s*['"][^'"]*kis[^'"]*['"]\s*\))|kisClient/i;
const REAL_AUTH_PATTERN = /supabase|auth0|next-auth|nextauth|clerk|firebase|passport/i;
const DB_CACHE_PATTERN = /redis|upstash|turso|prisma|drizzle/i;
const STORAGE_PATTERN = /localStorage|sessionStorage/i;
const COOKIE_HEADER_PATTERN = /document\.cookie|getHeader\(|headers\.get\(|request\.headers/i;
const VERCEL_FILE_PATTERN = /(^|\/)vercel\.(json|ts)$|(^|\/)\.vercel\//i;

const apiChanged = [...phaseChanges].some((path) => path.startsWith('src/pages/api/'));
const serverLibChanged = [...phaseChanges].some((path) => path.startsWith('src/lib/server/'));
const serverProvidersChanged = [...phaseChanges].some((path) => path.startsWith('src/lib/server/providers/'));
const similarityLibChanged = [...phaseChanges].some((path) => path.startsWith('src/lib/chartSimilarity/'));
const similarityDataChanged = [...phaseChanges].some((path) => path.startsWith('src/data/chartSimilarity/'));
const supabaseOrMigrationAdded = addedFiles.some((path) => /migration|\.sql$/i.test(path) || /supabase/i.test(path));
const vercelChanged = [...phaseChanges].some((path) => VERCEL_FILE_PATTERN.test(path));

const allowedChangedPaths = new Set([
  'src/pages/chart-ai.astro',
  'docs/planning/phase_3ex_e_hf1_analysis_workspace_tagged_page_swap_ui_fix_result_v0.1.md',
  'docs/planning/planning_changelog.md',
  'scripts/check_phase_3ex_e_hf1_analysis_workspace_tagged_page_swap_ui_fix_contract.mjs',
  'package.json',
]);
const unexpectedChanges = [...phaseChanges].filter((path) => !allowedChangedPaths.has(path));

let passed = 0;
let failed = 0;
const failures = [];
const check = (label, condition) => {
  if (condition) { passed += 1; process.stdout.write(`  [PASS] ${label}\n`); }
  else { failed += 1; failures.push(label); process.stdout.write(`  [FAIL] ${label}\n`); }
};

process.stdout.write('=== Phase 3EX-E-HF1 Analysis Workspace Tagged Page Swap UI Fix Contract ===\n\n');

process.stdout.write('Files, commands, and changelog:\n');
check('Result document exists', existsSync(join(root, paths.result)));                                          // 1
check('Checker exists', existsSync(join(root, paths.checker)));                                                  // 2
check('Package checker script exists',                                                                           // 3
  packageJson.scripts?.['check:phase-3ex-e-hf1-analysis-workspace-tagged-page-swap-ui-fix'] ===
    'node scripts/check_phase_3ex_e_hf1_analysis_workspace_tagged_page_swap_ui_fix_contract.mjs');
check('Changelog contains Phase 3EX-E-HF1', phaseSection.length > 0);                                            // 4
check('src/pages/chart-ai.astro changed', phaseChanges.has(paths.page));                                         // 5
process.stdout.write('\n');

process.stdout.write('Structural markup:\n');
check('Page contains chartAiAnalysisWorkspace', source.page.includes('id="chartAiAnalysisWorkspace"'));          // 6
check('Page contains 유사 패턴 분석 보기', source.page.includes('유사 패턴 분석 보기'));                              // 7
check('Page contains MK AI 분석 보기', source.page.includes('MK AI 분석 보기'));                                     // 8
check('Page contains post-it/tag-style class naming', source.page.includes('chart-analysis-tag'));               // 9
check('Page contains page canvas class naming', source.page.includes('chart-analysis-page-canvas'));             // 10
check('Workspace contains role="tablist"', workspaceSource.includes('role="tablist"'));                          // 11
check('Workspace contains role="tab"', workspaceSource.includes('role="tab"'));                                  // 12
check('Workspace contains role="tabpanel"', workspaceSource.includes('role="tabpanel"'));                        // 13
check('Workspace contains aria-selected', workspaceSource.includes('aria-selected'));                            // 14
check('Workspace contains aria-controls', workspaceSource.includes('aria-controls'));                            // 15
check('Workspace contains aria-labelledby', workspaceSource.includes('aria-labelledby'));                        // 16
process.stdout.write('\n');

process.stdout.write('Tabs and panels:\n');
check('Similarity tab exists', workspaceSource.includes('id="chartAiSimilarityTab"'));                           // 17
check('MK AI tab exists', workspaceSource.includes('id="chartAiMkAiTab"'));                                      // 18
check('Similarity panel exists', source.page.includes('id="chartAiSimilarityPanel"'));                           // 19
check('MK AI panel exists', source.page.includes('id="chartAiMkAiPanel"'));                                      // 20
check('Similarity panel visible by default', similarityOpenTag.length > 0 && !similarityOpenTag.includes('hidden')); // 21
check('MK AI panel hidden by default', mkAiOpenTag.includes('hidden'));                                          // 22
check('Inactive panel uses hidden attribute', mkAiOpenTag.includes('hidden'));                                   // 23
check('CSS explicitly hides [hidden] analysis page',
  /\.chart-analysis-page\[hidden\]\s*\{[^}]*display:\s*none\s*!important/.test(styleSource));                    // 24
process.stdout.write('\n');

process.stdout.write('Page-swap script behavior:\n');
check('Script toggles hidden state', /\.hidden\s*=/.test(tabScriptSource));                                      // 25
check('Script toggles active class', /classList\.toggle\('active'/.test(tabScriptSource));                       // 26
check('Script toggles aria-selected', /setAttribute\('aria-selected'/.test(tabScriptSource));                    // 27
check('Script toggles tabindex', /setAttribute\('tabindex'/.test(tabScriptSource));                              // 28
check('Script supports click for both tags',
  /similarityTab\?\.addEventListener\('click'/.test(tabScriptSource) &&
    /mkAiTab\?\.addEventListener\('click'/.test(tabScriptSource));                                               // 29
check('Script supports ArrowLeft/ArrowRight keyboard switching',
  /ArrowLeft/.test(tabScriptSource) && /ArrowRight/.test(tabScriptSource));                                      // 30
check('Script supports Home/End keyboard switching',
  /\bHome\b/.test(tabScriptSource) && /\bEnd\b/.test(tabScriptSource));                                          // 31
process.stdout.write('\n');

process.stdout.write('Similarity page content (only):\n');
check('Similarity panel contains 유사 패턴 분석 결과', similarityPanelSource.includes('유사 패턴 분석 결과'));          // 32
check('Similarity panel contains 현재 패턴 요약', similarityPanelSource.includes('현재 패턴 요약'));                   // 33
check('Similarity panel contains 유사 구간 Top 5', similarityPanelSource.includes('유사 구간 Top 5'));                // 34
check('Similarity panel contains 기준일 100 정규화', similarityPanelSource.includes('기준일 100 정규화'));             // 35
check('Similarity panel contains 사후 성과 요약', similarityPanelSource.includes('사후 성과 요약'));                   // 36
check('Similarity panel contains 데이터 한계 / 투자 유의', similarityPanelSource.includes('데이터 한계 / 투자 유의'));   // 37
process.stdout.write('\n');

process.stdout.write('MK AI page content (only):\n');
check('MK AI panel contains MK AI 해석', mkAiPanelSource.includes('MK AI 해석'));                                   // 38
check('MK AI panel contains AI 분석 미리보기', mkAiPanelSource.includes('AI 분석 미리보기'));                          // 39
check('MK AI panel contains 요약', mkAiPanelSource.includes('요약'));                                               // 40
check('MK AI panel contains 핵심 해석', mkAiPanelSource.includes('핵심 해석'));                                      // 41
check('MK AI panel contains 시나리오 점검', mkAiPanelSource.includes('시나리오 점검'));                               // 42
check('MK AI panel contains 분석 근거', mkAiPanelSource.includes('분석 근거'));                                      // 43
check('MK AI panel contains 리스크 체크리스트', mkAiPanelSource.includes('리스크 체크리스트'));                        // 44
check('MK AI panel contains 데이터 한계', mkAiPanelSource.includes('데이터 한계'));                                   // 45
process.stdout.write('\n');

process.stdout.write('True content separation:\n');
check('MK AI panel does not contain 유사 구간 Top 5', !mkAiPanelSource.includes('유사 구간 Top 5'));                  // 46
check('MK AI panel does not contain 기준일 100 정규화', !mkAiPanelSource.includes('기준일 100 정규화'));               // 47
check('Similarity panel does not contain the full MK AI page wrapper',
  !similarityPanelSource.includes('id="chartAiMkAiPanel"'));                                                     // 48
check('Both panels are not default-visible together',
  !similarityOpenTag.includes('hidden') && mkAiOpenTag.includes('hidden'));                                      // 49
check('Old one-long-stack structure is not present',
  !source.page.includes('class="chart-analysis-tab"') && !source.page.includes('class="chart-analysis-tab active"') &&
    !/class="chart-analysis-panel"/.test(source.page));                                                          // 50
process.stdout.write('\n');

process.stdout.write('Post-it tag / page canvas visual design:\n');
check('Active tag styling exists', /\.chart-analysis-tag\.active\s*\{/.test(styleSource));                       // 51
check('Inactive (base) tag styling exists', /\.chart-analysis-tag\s*\{/.test(styleSource));                      // 52
check('Page canvas styling exists', /\.chart-analysis-page-canvas\s*\{/.test(styleSource));                      // 53
check('Reduced-motion handling exists for tag/page transitions',
  styleSource.includes('prefers-reduced-motion') &&
    (/chart-analysis-tag/.test(reducedMotionSplit) || /chart-analysis-page/.test(reducedMotionSplit)));          // 54
check('Mobile handling exists for tags/page canvas',
  /chart-analysis-tag/.test(mobileSplit) || /chart-analysis-page-canvas/.test(mobileSplit));                     // 55
process.stdout.write('\n');

process.stdout.write('Preserved behavior and copy:\n');
check('Existing chart/sidebar stretch fix remains',
  /\.chart-lookup-content-grid\s*\{[^}]*align-items:\s*start;[^}]*\}/.test(styleSource) &&
    /\.chart-market-panel\s*\{[^}]*align-self:\s*start;[^}]*\}/.test(styleSource) &&
    /\.chart-stock-sidebar\s*\{[^}]*align-self:\s*start;[^}]*\}/.test(styleSource));                             // 56
check('Search input behavior code remains', source.page.includes('chart-ai-search-result'));                    // 57
check('KIS preview buttons remain', source.page.includes('chartAiQuotePreviewBtn'));                             // 58
check('Sample/mock disclaimers remain', source.page.includes('샘플 화면') && source.page.includes('샘플 데이터'));   // 59
check('Investment-not-advice disclaimer remains', source.page.includes('매수·매도 추천'));                          // 60
check('KIS-not-real disclaimer remains', source.page.includes('실제 KIS 데이터 아님'));                              // 61
process.stdout.write('\n');

process.stdout.write('No forbidden runtime/access patterns added:\n');
check('No fetch added', !/\bfetch\(/.test(addedLines));                                                          // 62
check('No API call added', !/\/api\/chart-ai\/similarity/i.test(addedLines));                                    // 63
check('No localStorage/sessionStorage added', !STORAGE_PATTERN.test(addedLines));                                // 64
check('No cookie/header read added', !COOKIE_HEADER_PATTERN.test(addedLines));                                   // 65
check('No process.env read added', !/process\.env/.test(addedLines));                                            // 66
check('No .env read added', !/\.env['"]/.test(addedLines));                                                      // 67
check('No KIS provider/client import added', !KIS_IMPORT_PATTERN.test(addedLines));                              // 68
check('No real auth provider import added', !REAL_AUTH_PATTERN.test(addedLines));                                // 69
check('No DB/cache provider import added', !DB_CACHE_PATTERN.test(addedLines));                                  // 70
check('No external AI keywords introduced', !EXTERNAL_AI_PATTERN.test(addedLines));                              // 71
check('No source=live introduced', !/source\s*=\s*['"]?live/i.test(addedLines));                                 // 72
check('No source=auto introduced', !/source\s*=\s*['"]?auto/i.test(addedLines));                                 // 73
check('No raw KIS response fields introduced', !RAW_FIELDS.test(addedLines));                                    // 74
check('No secret-looking values introduced', !SECRET_VALUE(addedLines));                                         // 75
check('No account/trading/order/balance APIs introduced', !ACCOUNT_TRADING_PATTERN.test(addedLines));            // 76
process.stdout.write('\n');

process.stdout.write('Forbidden changed paths and dependency safety:\n');
check('No src/pages/api files changed', !apiChanged);                                                            // 77
check('No src/lib/server files changed', !serverLibChanged);                                                     // 78
check('No src/lib/server/providers files changed', !serverProvidersChanged);                                     // 79
check('No src/lib/chartSimilarity files changed', !similarityLibChanged);                                        // 80
check('No src/data/chartSimilarity files changed', !similarityDataChanged);                                      // 81
check('No Supabase/migration/SQL files added', !supabaseOrMigrationAdded);                                       // 82
check('No Vercel files changed', !vercelChanged);                                                                 // 83
check('No dependency changes', dependenciesUnchanged);                                                           // 84
check('No devDependency changes', devDependenciesUnchanged);                                                     // 85
check('No image files added', addedImages.length === 0);                                                         // 86
process.stdout.write('\n');

process.stdout.write('Result document content:\n');
check('Docs record owner feedback', /owner (feedback|review|tested|requested)/i.test(docScanText));              // 87
check('Docs record post-it/tagged page swap fix', /post-it|tagged page-swap|page-swap ui/i.test(docScanText));   // 88
check('Docs record true content separation', /content separation/i.test(docScanText));                          // 89
check('Docs record no route change', /no (api )?route change/i.test(docScanText));                               // 90
check('Docs record no KIS call', /no KIS call/i.test(docScanText));                                              // 91
check('Docs record no auth/storage change',
  /no real auth/i.test(docScanText) && /no usage storage/i.test(docScanText));                                   // 92
check('Docs record no deployment', /no deployment/i.test(docScanText));                                          // 93
check('Docs record no push', /no push/i.test(docScanText));                                                      // 94
process.stdout.write('\n');

process.stdout.write('Changelog and network/scope safety:\n');
check('Changelog records next phase', /Phase 3FA-C/.test(phaseSection));                                         // 95
check('Checker blocks network access',
  source.checker.includes('Network access is blocked in the Phase 3EX-E-HF1 analysis workspace tagged page swap ui fix checker.') &&
  !fetchAttempted);                                                                                               // 96
check('Only allowed paths changed since starting commit', unexpectedChanges.length === 0);                       // 97
process.stdout.write('\n');

process.stdout.write(`Checks passed: ${passed}/${passed + failed}\n`);
if (failed > 0) {
  process.stdout.write(`Failures: ${failures.join('; ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('All Phase 3EX-E-HF1 checks passed.\n');
}
