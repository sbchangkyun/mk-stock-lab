/**
 * Phase 3ET-OWNER-REVIEW-CLOSEOUT static contract.
 * Owner review closeout for the Chart AI owner-local OHLC preview after the Phase 3ET-HF1 UX
 * simplification and the Phase 3ET-OWNER-REVIEW-RETRY manual review. Static inspection only. No
 * network, no live KIS, no env values, no dev server, no browser, no public API, no screenshot
 * inspection, no runtime source modification.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error('Network access is blocked in the Phase 3ET-OWNER-REVIEW-CLOSEOUT checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = process.cwd();
const startingCommit = '30c2830';
// Bounded to this phase's own ending commit (Pattern B). Diffing to HEAD would falsely trip
// "no src/api files changed" once later phases (e.g. Phase 3EN-HF1) made their own legitimate
// src/ changes. This closeout was doc-only and its own work concluded at 7d757ae.
const endingCommit = '7d757ae';
const paths = {
  result: 'docs/planning/phase_3et_owner_review_closeout_chart_ai_ohlc_preview_result_v0.1.md',
  checker: 'scripts/check_phase_3et_owner_review_closeout_chart_ai_ohlc_preview_static_contract.mjs',
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
const phaseSection = source.changelog.split('## Phase 3ET-OWNER-REVIEW-CLOSEOUT - 2026-07-02')[1]?.split('\n## ')[0] ?? '';
const phaseChanges = new Set(git('diff', '--name-only', `${startingCommit}..${endingCommit}`).split(/\r?\n/).filter(Boolean));
const addedFiles = git('diff', '--name-only', '--diff-filter=A', `${startingCommit}..${endingCommit}`).split(/\r?\n/).filter(Boolean);
const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif', '.bmp']);
const addedImages = addedFiles.filter((path) => imageExtensions.has(extname(path).toLowerCase()));
const dependenciesUnchanged = JSON.stringify(packageJson.dependencies ?? {}) === JSON.stringify(baselinePackage.dependencies ?? {});
const devDependenciesUnchanged = JSON.stringify(packageJson.devDependencies ?? {}) === JSON.stringify(baselinePackage.devDependencies ?? {});

// Only the closeout document + its changelog section — never the checker's own source (which
// legitimately mentions the forbidden pattern names) or the result docs (which legitimately
// document old copy as context).
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

process.stdout.write('=== Phase 3ET-OWNER-REVIEW-CLOSEOUT Chart AI OHLC Preview Owner Review Closeout Contract ===\n\n');

check('Closeout document exists', existsSync(join(root, paths.result)));                                   // 1
check('Checker exists', existsSync(join(root, paths.checker)));                                             // 2
check('Package script exists',
  packageJson.scripts?.['check:phase-3et-owner-review-closeout-chart-ai-ohlc-preview'] ===
    'node scripts/check_phase_3et_owner_review_closeout_chart_ai_ohlc_preview_static_contract.mjs');         // 3
check('Changelog contains Phase 3ET-OWNER-REVIEW-CLOSEOUT', phaseSection.length > 0);                        // 4
check('Closeout status is Closed',
  source.result.includes('Closed — owner review PASS after HF1 UX simplification'));                         // 5
check('Decision is PASS', /## 2\. Decision\s*\n\s*PASS/.test(source.result));                                 // 6
check('Closeout references Phase 3ET', /Phase 3ET\b/.test(source.result));                                   // 7
check('Closeout references Phase 3ET-HF1', /Phase 3ET-HF1\b/.test(source.result));                            // 8
check('Closeout references Phase 3ET-OWNER-REVIEW-RETRY',
  /Phase 3ET-OWNER-REVIEW-RETRY\b/.test(source.result));                                                      // 9
check('Closeout records owner manual review',
  /owner manually reviewed/i.test(source.result));                                                            // 10
check('Closeout records main chart simplification PASS',
  /Main chart simplification: PASS/.test(source.result));                                                     // 11
check('Closeout records old chart-left control removed PASS',
  /Old chart-left OHLC button\/guide removed: PASS/.test(source.result));                                     // 12
check('Closeout records right-side KIS local preview card PASS',
  /Right-side KIS local preview card contains both quote and chart preview controls: PASS/.test(source.result)); // 13
check('Closeout records quote and chart preview controls',
  source.result.includes('KIS 시세 프리뷰 확인') && source.result.includes('KIS 차트 프리뷰 확인'));               // 14
check('Closeout records OHLC preview success state visible',
  /OHLC preview success state visible: PASS/.test(source.result));                                            // 15
check('Closeout records delayed KIS OHLC state',
  /Main chart status shows delayed KIS OHLC state: PASS/.test(source.result));                                // 16
check('Closeout records quote preview remains present',
  /Existing quote preview area remains present: PASS/.test(source.result));                                   // 17
check('Closeout records no unsafe output visible',
  /No raw response, secret, stack trace, request header, or unsafe output visible: PASS/.test(source.result)); // 18
check('Closeout states no screenshot committed',
  /no screenshot file is\s*\n?\s*committed|No screenshot committed/i.test(source.result));                    // 19
check('Closeout forbids recording actual OHLC values',
  /No actual OHLC values recorded/i.test(source.result));                                                     // 20
check('Closeout forbids recording quote/price/volume/timestamp values from screenshot',
  /quote\/current price\/volume\/timestamp values recorded from the screenshot/i.test(source.result) ||
  /quote values, price values, OHLC values, volume values, or timestamp values from the/i.test(source.result)); // 21
check('Closeout states public live OHLC is not authorized',
  /does not authorize public live OHLC/i.test(source.result));                                                // 22
check('Closeout states source=live is not authorized',
  /does not authorize source=live/i.test(source.result));                                                     // 23
check('Closeout states source=auto is not authorized',
  /does not authorize source=auto/i.test(source.result));                                                     // 24
check('Closeout states production deployment is not authorized',
  /does not authorize production deployment/i.test(source.result));                                           // 25
check('Closeout states owner-local gates are not weakened',
  /does not remove owner-local gates/i.test(source.result));                                                  // 26
check('No src runtime files changed in this phase',
  ![...phaseChanges].some((p) => p.startsWith('src/')));                                                      // 27
check('No API route changed in this phase',
  ![...phaseChanges].some((p) => p.startsWith('src/pages/api/')));                                            // 28
check('No provider runtime changed in this phase',
  ![...phaseChanges].some((p) => p.startsWith('src/lib/server/')));                                           // 29
check('No image files added', addedImages.length === 0);                                                      // 30
check('No dependency added',
  dependenciesUnchanged && devDependenciesUnchanged && !phaseChanges.has('package-lock.json'));                // 31
check('No Supabase/SQL/migration file added',
  !addedFiles.some((p) => /supabase|migration|\.sql$/i.test(p)));                                              // 32
check('Docs contain no actual OHLC values', !OHLC_VALUE_PATTERN.test(scanText));                              // 33
check('Docs contain no raw KIS response fields', !RAW_FIELDS.test(scanText));                                 // 34
check('Docs contain no secret-looking values', !SECRET_VALUE(scanText));                                      // 35
check('Changelog records no deployment', /no deployment/i.test(phaseSection));                                // 36
check('Changelog records no push', /no push/i.test(phaseSection));                                            // 37
check('Recommended next phase is Phase 3EN-HF1',
  /Phase 3EN-HF1 — Legacy KIS Checker Cleanup/.test(source.result));                                           // 38
check('Alternative next phase is Phase 3EU',
  /Phase 3EU — Chart AI Data Integration Policy and Public Boundary Plan/.test(source.result));                // 39
check('Known legacy checker notes preserved',
  source.result.includes('## 9. Known Legacy Checker Notes') &&
  source.result.includes('check:kis-quote-adapter-mocked') &&
  source.result.includes('check:phase-3et-owner-review-chart-ai-ohlc-preview') &&
  source.result.includes('check:phase-3et-chart-ai-owner-local-ohlc-preview-wiring') &&
  source.result.includes('check:phase-3es-owner-local-kis-ohlc-smoke-closeout') &&
  source.result.includes('check:phase-3es-owner-local-kis-ohlc-smoke'));                                       // 40
check('Checker blocks network access',
  source.checker.includes('Network access is blocked in the Phase 3ET-OWNER-REVIEW-CLOSEOUT checker.') &&
  !fetchAttempted);                                                                                            // 41

process.stdout.write('\n');
process.stdout.write(`Checks passed: ${passed}/${passed + failed}\n`);
if (failed > 0) {
  process.stdout.write(`Failures: ${failures.join('; ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('All Phase 3ET-OWNER-REVIEW-CLOSEOUT checks passed.\n');
}
