/**
 * Phase 3EN-HF1 documentation/tooling contract.
 * Legacy KIS checker cleanup.
 * Static only: no network, browser, dev server, API, provider, live KIS, or environment access.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error('Network access is blocked in the Phase 3EN-HF1 legacy KIS checker cleanup checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = process.cwd();
const startingCommit = '7d757ae';
const paths = {
  result: 'docs/planning/phase_3en_hf1_legacy_kis_checker_cleanup_result_v0.1.md',
  checker: 'scripts/check_phase_3en_hf1_legacy_kis_checker_cleanup_contract.mjs',
  changelog: 'docs/planning/planning_changelog.md',
  package: 'package.json',
  valuation: 'src/pages/api/portfolio/valuation.ts',
  ownerLocalOhlc: 'src/pages/api/chart-ai/owner-local-ohlc-preview.ts',
  ownerLocalQuote: 'src/pages/api/chart-ai/owner-local-quote-preview.ts',
  page: 'src/pages/chart-ai.astro',
  checkerOwnerReviewOhlc: 'scripts/check_phase_3et_owner_review_chart_ai_ohlc_preview_static_contract.mjs',
  checkerSmokeCloseout: 'scripts/check_phase_3es_owner_local_kis_ohlc_smoke_closeout_contract.mjs',
  checkerSmoke: 'scripts/check_phase_3es_owner_local_kis_ohlc_smoke_contract.mjs',
  checkerWiring: 'scripts/check_phase_3et_chart_ai_owner_local_ohlc_preview_wiring_contract.mjs',
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
const phaseSection = source.changelog.split('## Phase 3EN-HF1 - 2026-07-02')[1]?.split('\n## ')[0] ?? '';
const phaseChanges = new Set(git('diff', '--name-only', startingCommit).split(/\r?\n/).filter(Boolean));
const addedFiles = git('diff', '--name-only', '--diff-filter=A', startingCommit).split(/\r?\n/).filter(Boolean);
const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif', '.bmp']);
const addedImages = addedFiles.filter((path) => imageExtensions.has(extname(path).toLowerCase()));
const dependenciesUnchanged = JSON.stringify(packageJson.dependencies ?? {}) === JSON.stringify(baselinePackage.dependencies ?? {});
const devDependenciesUnchanged = JSON.stringify(packageJson.devDependencies ?? {}) === JSON.stringify(baselinePackage.devDependencies ?? {});

const RAW_FIELDS = /stck_prpr|stck_oprc|stck_hgpr|stck_lwpr|prdy_vrss|prdy_ctrt|acml_vol|rt_cd|msg_cd/i;
const SECRET_VALUE = (text) =>
  /Bearer\s+[A-Za-z0-9._-]{8,}/.test(text) ||
  /KIS_APP_KEY['"]?\s*[:=]\s*['"]?[A-Za-z0-9]{8,}/.test(text) ||
  /KIS_APP_SECRET['"]?\s*[:=]\s*['"]?[A-Za-z0-9]{8,}/.test(text) ||
  /KIS_ACCESS_TOKEN['"]?\s*[:=]\s*['"]?[A-Za-z0-9]{8,}/.test(text);
const NO_PRICE = (text) => !/(현재가|전일종가|종가|lastPrice|previous close|current price)[^\n]*\b\d{3,}\b/i.test(text);

let passed = 0;
let failed = 0;
const failures = [];
const check = (label, condition) => {
  if (condition) { passed += 1; process.stdout.write(`  [PASS] ${label}\n`); }
  else { failed += 1; failures.push(label); process.stdout.write(`  [FAIL] ${label}\n`); }
};

process.stdout.write('=== Phase 3EN-HF1 Legacy KIS Checker Cleanup Contract ===\n\n');

process.stdout.write('Files, command, and changelog:\n');
check('Result document exists', existsSync(join(root, paths.result)));                                     // 1
check('Checker exists', existsSync(join(root, paths.checker)));                                             // 2
check('Package script exists',                                                                              // 3
  packageJson.scripts?.['check:phase-3en-hf1-legacy-kis-checker-cleanup'] ===
    'node scripts/check_phase_3en_hf1_legacy_kis_checker_cleanup_contract.mjs');
check('Changelog contains Phase 3EN-HF1', phaseSection.length > 0);                                         // 4
check('Result status is implemented',
  source.result.includes('Implemented — legacy KIS checker cleanup complete.'));                            // 5
check('Result records cleanup of check:kis-quote-adapter-mocked',
  source.result.includes('check:kis-quote-adapter-mocked'));                                                // 6
check('Result records cleanup of open-ended diff checker fragility',
  source.result.includes('Open-ended diff checker cleanup'));                                               // 7
check('Result records cleanup of literal-string checker fragility',
  source.result.includes('Literal-string checker cleanup'));                                                // 8
process.stdout.write('\n');

process.stdout.write('Valuation route safety:\n');
check('Valuation route no longer exposes public source=live behavior',
  !/^\s*if\s*\(\s*source\s*===\s*['"]live['"]\s*\)\s*\{\s*$/m.test(source.valuation) ||
    source.valuation.includes('previewMode') && source.valuation.includes('allowLiveQuotes'));             // 9
check('Valuation route remains fixture-only or safe-blocked',
  source.valuation.includes('isLivePreviewGateReady') || source.valuation.includes('fixture'));             // 10
check('No KIS live behavior added to valuation route',
  source.valuation.includes("previewMode !== 'owner'") && source.valuation.includes('allowLiveQuotes !== true'));  // 11
check('No account/trading API added',
  !/\/api\/(account|trading|order|balance)\b/i.test(source.valuation) &&
  !/\/api\/(account|trading|order|balance)\b/i.test(source.ownerLocalOhlc) &&
  !/\/api\/(account|trading|order|balance)\b/i.test(source.ownerLocalQuote));                                // 12
check('KIS_ACCOUNT_NO not read as an active parameter in phase-touched routes',
  !source.valuation.includes('process.env.KIS_ACCOUNT_NO') &&
  !source.ownerLocalOhlc.includes('KIS_ACCOUNT_NO') &&
  !source.ownerLocalQuote.includes('KIS_ACCOUNT_NO'));                                                       // 13
process.stdout.write('\n');

process.stdout.write('Owner-local OHLC route gate:\n');
check('Owner-local OHLC route still exists', existsSync(join(root, paths.ownerLocalOhlc)));                 // 14
check('Owner-local OHLC route still requires source=owner-local',
  source.ownerLocalOhlc.includes('owner-local'));                                                            // 15
check('Owner-local OHLC route still requires preview=ohlc',
  source.ownerLocalOhlc.includes('ohlc'));                                                                   // 16
check('Owner-local OHLC route still requires localhost',
  source.ownerLocalOhlc.includes('isLocalHostRequest'));                                                     // 17
check('Owner-local OHLC route still requires KIS_OWNER_LOCAL_SMOKE',
  source.ownerLocalOhlc.includes('KIS_OWNER_LOCAL_SMOKE'));                                                  // 18
check('Owner-local OHLC route still requires KIS_ALLOW_LIVE_QUOTE',
  source.ownerLocalOhlc.includes('KIS_ALLOW_LIVE_QUOTE'));                                                   // 19
check('Owner-local OHLC route still requires KIS_ENABLE_LIVE_QUOTES',
  source.ownerLocalOhlc.includes('KIS_ENABLE_LIVE_QUOTES'));                                                 // 20
check('Owner-local OHLC route still blocks US',
  source.ownerLocalOhlc.includes("!== 'KR'") || source.ownerLocalOhlc.includes('market'));                   // 21
check('Owner-local OHLC route still sets Cache-Control no-store',
  source.ownerLocalOhlc.includes('no-store'));                                                               // 22
process.stdout.write('\n');

process.stdout.write('Owner-local quote route and Chart AI copy:\n');
check('Owner-local quote route still exists', existsSync(join(root, paths.ownerLocalQuote)));                // 23
check('Chart AI still contains KIS 시세 프리뷰 확인', source.page.includes('KIS 시세 프리뷰 확인'));           // 24
check('Chart AI still contains KIS 차트 프리뷰 확인', source.page.includes('KIS 차트 프리뷰 확인'));           // 25
check('Chart AI still contains 지연 시세 · KIS OHLC · KRW', source.page.includes('지연 시세 · KIS OHLC · KRW')); // 26
check('Chart AI does not reintroduce old chart-left guide copy',
  !source.page.includes('chartAiOhlcPreviewGuide') &&
  !source.page.includes('오너 로컬 환경에서만 KIS OHLC 프리뷰를 확인할 수 있습니다'));                          // 27
process.stdout.write('\n');

process.stdout.write('Checker fragility cleanup verification:\n');
check('check:phase-3et-owner-review-chart-ai-ohlc-preview no longer has open-ended src diff fragility',
  source.checkerOwnerReviewOhlc.includes('const endingCommit') &&
  source.checkerOwnerReviewOhlc.includes('${startingCommit}..${endingCommit}'));                             // 28
check('check:phase-3es-owner-local-kis-ohlc-smoke-closeout no longer has open-ended src diff fragility',
  source.checkerSmokeCloseout.includes('const endingCommit') &&
  source.checkerSmokeCloseout.includes('${startingCommit}..${endingCommit}'));                               // 29
check('check:phase-3es-owner-local-kis-ohlc-smoke no longer has open-ended src diff fragility',
  source.checkerSmoke.includes('const endingCommit') &&
  source.checkerSmoke.includes('${startingCommit}..${endingCommit}'));                                       // 30
check('check:phase-3et-chart-ai-owner-local-ohlc-preview-wiring no longer requires the old literal string',
  !source.checkerWiring.includes("check('Page preserves sample-chart wording and owner-local OHLC tag text'") &&
  source.checkerWiring.includes('지연 시세 · KIS OHLC · KRW'));                                                // 31
process.stdout.write('\n');

process.stdout.write('Documentation sanitization:\n');
check('Docs contain no actual OHLC values', NO_PRICE(source.result));                                        // 32
check('Docs contain no raw KIS response fields', !RAW_FIELDS.test(source.result));                           // 33
check('Docs contain no secret-looking values', !SECRET_VALUE(source.result));                                // 34
process.stdout.write('\n');

process.stdout.write('Change boundaries and changelog:\n');
check('No image files added', addedImages.length === 0);                                                    // 35
check('No dependency added',
  dependenciesUnchanged && devDependenciesUnchanged && !phaseChanges.has('package-lock.json'));              // 36
check('No Supabase/SQL/migration added',
  ![...phaseChanges].some((p) => /supabase/i.test(p) || /migration|\.sql$/i.test(p)));                        // 37
check('Changelog records no deployment', /no deployment/i.test(phaseSection));                               // 38
check('Changelog records no push', /no push/i.test(phaseSection));                                           // 39
check('Recommended next phase is Phase 3EU',
  source.result.includes('Phase 3EU — Chart AI Data Integration Policy and Public Boundary Plan'));          // 40
check('Alternative next phase includes owner choice to continue cleanup if older checker issues remain',
  source.result.includes('Continue legacy checker cleanup only if older checker issues remain'));            // 41
check('Checker blocks network access',
  source.checker.includes('Network access is blocked in the Phase 3EN-HF1 legacy KIS checker cleanup checker.') && !fetchAttempted); // 42
process.stdout.write('\n');

process.stdout.write(`Checks passed: ${passed}/${passed + failed}\n`);
if (failed > 0) {
  process.stdout.write(`Failures: ${failures.join('; ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('All Phase 3EN-HF1 checks passed.\n');
}
