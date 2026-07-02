/**
 * Phase 3ET-OWNER-REVIEW-RETRY static contract.
 * Owner review retry package for the Chart AI owner-local OHLC preview after the Phase 3ET-HF1
 * UX simplification. Static inspection only. No network, no live KIS, no env values, no dev
 * server, no browser, no public API, no runtime source modification.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error('Network access is blocked in the Phase 3ET-OWNER-REVIEW-RETRY checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = process.cwd();
const startingCommit = '33f0bc3';
const paths = {
  result: 'docs/planning/phase_3et_owner_review_retry_after_ohlc_preview_ux_simplification_v0.1.md',
  checker: 'scripts/check_phase_3et_owner_review_retry_after_ohlc_preview_ux_simplification_static_contract.mjs',
  changelog: 'docs/planning/planning_changelog.md',
  package: 'package.json',
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
const phaseSection = source.changelog.split('## Phase 3ET-OWNER-REVIEW-RETRY - 2026-07-02')[1]?.split('\n## ')[0] ?? '';
const phaseChanges = new Set(git('diff', '--name-only', startingCommit).split(/\r?\n/).filter(Boolean));
const addedFiles = git('diff', '--name-only', '--diff-filter=A', startingCommit).split(/\r?\n/).filter(Boolean);
const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif', '.bmp']);
const addedImages = addedFiles.filter((path) => imageExtensions.has(extname(path).toLowerCase()));
const dependenciesUnchanged = JSON.stringify(packageJson.dependencies ?? {}) === JSON.stringify(baselinePackage.dependencies ?? {});
const devDependenciesUnchanged = JSON.stringify(packageJson.devDependencies ?? {}) === JSON.stringify(baselinePackage.devDependencies ?? {});

// Only the review-retry document + its changelog section — never the checker's own source
// (which legitimately mentions the forbidden pattern names) or the result docs (which
// legitimately document old copy as context).
const scanText = `${source.result}\n${phaseSection}`;

const RAW_FIELDS = /stck_bsop_date|stck_oprc|stck_hgpr|stck_lwpr|stck_clpr|acml_vol|rt_cd|msg_cd|output2/i;
const SECRET_VALUE = (text) =>
  /Bearer\s+[A-Za-z0-9._-]{8,}/.test(text) ||
  /KIS_APP_KEY['"]?\s*[:=]\s*['"]?[A-Za-z0-9]{8,}/.test(text) ||
  /KIS_APP_SECRET['"]?\s*[:=]\s*['"]?[A-Za-z0-9]{8,}/.test(text) ||
  /KIS_ACCESS_TOKEN['"]?\s*[:=]\s*['"]?[A-Za-z0-9]{8,}/.test(text);
const OHLC_VALUE_PATTERN = /\b(open|high|low|close)\b[^\n]{0,20}\b\d{3,}\b/i;

let passed = 0;
let failed = 0;
const failures = [];
const check = (label, condition) => {
  if (condition) { passed += 1; process.stdout.write(`  [PASS] ${label}\n`); }
  else { failed += 1; failures.push(label); process.stdout.write(`  [FAIL] ${label}\n`); }
};

process.stdout.write('=== Phase 3ET-OWNER-REVIEW-RETRY Chart AI OHLC Preview Owner Review Retry Contract ===\n\n');

check('Owner review retry document exists', existsSync(join(root, paths.result)));                        // 1
check('Checker exists', existsSync(join(root, paths.checker)));                                            // 2
check('Package script exists',
  packageJson.scripts?.['check:phase-3et-owner-review-retry-after-ohlc-preview-ux-simplification'] ===
    'node scripts/check_phase_3et_owner_review_retry_after_ohlc_preview_ux_simplification_static_contract.mjs'); // 3
check('Changelog contains Phase 3ET-OWNER-REVIEW-RETRY', phaseSection.length > 0);                          // 4
check('Review retry document status is prepared',
  source.result.includes('Prepared — owner visual/runtime review retry pending'));                          // 5
check('Review retry document references Phase 3ET-HF1', /Phase 3ET-HF1/.test(source.result));               // 6
check('Review retry document references simplified owner-local OHLC preview UI',
  /simplified/i.test(source.result) && /owner-local OHLC preview/i.test(source.result));                     // 7
check('Review retry document includes default /chart-ai check',
  source.result.includes('Default /chart-ai behavior'));                                                    // 8
check('Review retry document includes main chart simplification check',
  source.result.includes('Main chart area simplification'));                                                // 9
check('Review retry document includes right-side KIS 로컬 프리뷰 button layout check',
  source.result.includes('Owner-local sidebar controls') && source.result.includes('KIS 로컬 프리뷰'));         // 10
check('Review retry document includes KIS 시세 프리뷰 확인',
  source.result.includes('KIS 시세 프리뷰 확인'));                                                              // 11
check('Review retry document includes KIS 차트 프리뷰 확인',
  source.result.includes('KIS 차트 프리뷰 확인'));                                                              // 12
check('Review retry document includes explicit click requirement',
  /explicit[- ]click/i.test(source.result));                                                                 // 13
check('Review retry document includes OHLC preview success path',
  source.result.includes('OHLC preview success path'));                                                     // 14
check('Review retry document includes chart status after OHLC preview',
  source.result.includes('Chart status after OHLC preview'));                                                // 15
check('Review retry document includes period reset behavior',
  source.result.includes('Period behavior') && source.result.includes('resets the chart to sample'));        // 16
check('Review retry document includes symbol reset behavior',
  source.result.includes('Symbol behavior') && /resets the chart to sample/.test(source.result));            // 17
check('Review retry document includes blocked/unavailable fallback',
  source.result.includes('Failure/fallback behavior') && source.result.includes('blocked/unavailable'));     // 18
check('Review retry document includes quote preview preservation',
  source.result.includes('Quote preview preservation'));                                                     // 19
check('Review retry document includes mobile/theme layout',
  source.result.includes('Layout/theme/mobile') || /mobile.*theme layout/i.test(source.result));             // 20
check('Review retry document includes no unsafe output',
  /No unsafe output/i.test(source.result));                                                                   // 21
check('Review retry document includes PowerShell setup commands without secret values',
  source.result.includes('npm run dev') && source.result.includes('"your local value"') &&
  !SECRET_VALUE(source.result));                                                                              // 22
check('Review retry document warns not to paste secrets',
  /do not paste.*secret|secrets\./i.test(source.result) && source.result.includes('access token'));           // 23
check('Review retry document warns not to paste actual OHLC values',
  /actual OHLC (price )?values/i.test(source.result));                                                        // 24
check('Review retry document includes PASS criteria', source.result.includes('## 5. PASS Criteria'));        // 25
check('Review retry document includes FAIL routing', source.result.includes('## 6. FAIL Routing'));          // 26
check('Review retry document includes owner response template',
  source.result.includes('## 7. Owner Response Template'));                                                  // 27
check('Review retry document recommends owner manual review retry',
  /Owner performs manual local review retry/i.test(source.result));                                          // 28
check('Review retry document recommends closeout on PASS',
  source.result.includes('Phase 3ET-OWNER-REVIEW-CLOSEOUT'));                                                 // 29
check('Review retry document includes Phase 3ET-HF routing',
  /Phase 3ET-HF1A/.test(source.result) && /Phase 3ET-HF1B/.test(source.result));                              // 30
check('No src runtime files changed in this phase',
  ![...phaseChanges].some((p) => p.startsWith('src/')));                                                      // 31
check('No API route changed in this phase',
  ![...phaseChanges].some((p) => p.startsWith('src/pages/api/')));                                            // 32
check('No provider runtime changed in this phase',
  ![...phaseChanges].some((p) => p.startsWith('src/lib/server/')));                                           // 33
check('No image files added', addedImages.length === 0);                                                      // 34
check('No dependency added',
  dependenciesUnchanged && devDependenciesUnchanged && !phaseChanges.has('package-lock.json'));                // 35
check('No Supabase/SQL/migration file added',
  !addedFiles.some((p) => /supabase|migration|\.sql$/i.test(p)));                                              // 36
check('Docs contain no actual OHLC values', !OHLC_VALUE_PATTERN.test(scanText));                              // 37
check('Docs contain no raw KIS response fields', !RAW_FIELDS.test(scanText));                                 // 38
check('Docs contain no secret-looking values', !SECRET_VALUE(scanText));                                      // 39
check('Changelog records no deployment', /no deployment/i.test(phaseSection));                                // 40
check('Changelog records no push', /no push/i.test(phaseSection));                                            // 41
check('Checker blocks network access',
  source.checker.includes('Network access is blocked in the Phase 3ET-OWNER-REVIEW-RETRY checker.') &&
  !fetchAttempted);                                                                                            // 42
check('Known legacy checker notes preserved',
  source.result.includes('## 10. Known Legacy Checker Notes') &&
  source.result.includes('check:kis-quote-adapter-mocked') &&
  source.result.includes('check:phase-3et-owner-review-chart-ai-ohlc-preview') &&
  source.result.includes('check:phase-3et-chart-ai-owner-local-ohlc-preview-wiring') &&
  source.result.includes('check:phase-3es-owner-local-kis-ohlc-smoke-closeout') &&
  source.result.includes('check:phase-3es-owner-local-kis-ohlc-smoke'));                                       // 43
check('Recommended next step is owner manual review retry',
  source.result.includes('## 11. Recommended Next Step') &&
  /Owner performs manual local review retry/i.test(source.result));                                            // 44

process.stdout.write('\n');
process.stdout.write(`Checks passed: ${passed}/${passed + failed}\n`);
if (failed > 0) {
  process.stdout.write(`Failures: ${failures.join('; ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('All Phase 3ET-OWNER-REVIEW-RETRY checks passed.\n');
}
