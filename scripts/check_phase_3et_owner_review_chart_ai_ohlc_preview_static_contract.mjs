/**
 * Phase 3ET-OWNER-REVIEW static contract.
 * Owner Local Review preparation package for the Chart AI owner-local OHLC preview.
 * Static inspection only. No network, no live KIS, no env values, no dev server, no browser,
 * no public API, no runtime source modification.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error('Network access is blocked in the Phase 3ET-OWNER-REVIEW checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = process.cwd();
const startingCommit = 'f44bdf3';
// Bounded to this phase's own ending commit (Pattern B). Diffing to HEAD would falsely trip
// "no src/api/lib changed" once later phases (e.g. Phase 3ET-HF1) made their own legitimate
// src/ changes. This phase was doc-only and its own work concluded at 1beafbf.
const endingCommit = '1beafbf';
const paths = {
  result: 'docs/planning/phase_3et_owner_review_chart_ai_ohlc_preview_v0.1.md',
  checker: 'scripts/check_phase_3et_owner_review_chart_ai_ohlc_preview_static_contract.mjs',
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
const phaseSection = source.changelog.split('## Phase 3ET-OWNER-REVIEW - 2026-07-01')[1]?.split('\n## ')[0] ?? '';
const phaseChanges = new Set(git('diff', '--name-only', `${startingCommit}..${endingCommit}`).split(/\r?\n/).filter(Boolean));
const addedFiles = git('diff', '--name-only', '--diff-filter=A', `${startingCommit}..${endingCommit}`).split(/\r?\n/).filter(Boolean);
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
const OHLC_VALUE_PATTERN = /\b(open|high|low|close)\b[^\n]{0,20}\b\d{3,}\b/i;

let passed = 0;
let failed = 0;
const failures = [];
const check = (label, condition) => {
  if (condition) { passed += 1; process.stdout.write(`  [PASS] ${label}\n`); }
  else { failed += 1; failures.push(label); process.stdout.write(`  [FAIL] ${label}\n`); }
};

process.stdout.write('=== Phase 3ET-OWNER-REVIEW Chart AI OHLC Preview Owner Review Contract ===\n\n');

check('Owner review document exists', existsSync(join(root, paths.result)));                              // 1
check('Static checker exists', existsSync(join(root, paths.checker)));                                    // 2
check('Package script exists',
  packageJson.scripts?.['check:phase-3et-owner-review-chart-ai-ohlc-preview'] ===
    'node scripts/check_phase_3et_owner_review_chart_ai_ohlc_preview_static_contract.mjs');                // 3
check('Changelog contains Phase 3ET-OWNER-REVIEW', phaseSection.length > 0);                               // 4
check('Review document status is Prepared',
  source.result.includes('Prepared — owner visual/runtime review pending'));                                // 5
check('Review document references Phase 3ET', source.result.includes('Phase 3ET wired'));                  // 6
check('Review document references owner-local OHLC preview',
  /owner-local OHLC preview/i.test(source.result));                                                         // 7
check('Review document includes default /chart-ai check',
  source.result.includes('Default /chart-ai behavior'));                                                    // 8
check('Review document includes /chart-ai?source=owner-local check',
  source.result.includes('/chart-ai?source=owner-local'));                                                  // 9
check('Review document includes explicit click requirement',
  /explicit[- ]click/i.test(source.result) || source.result.includes('OHLC preview requires explicit click')); // 10
check('Review document includes OHLC preview success path',
  source.result.includes('OHLC preview success path'));                                                     // 11
check('Review document includes period reset behavior',
  source.result.includes('Period behavior') && source.result.includes('resets the chart to sample'));       // 12
check('Review document includes symbol reset behavior',
  source.result.includes('Symbol behavior') && /resets the chart to sample/.test(source.result));           // 13
check('Review document includes blocked/unavailable fallback',
  source.result.includes('Failure/fallback behavior') && source.result.includes('blocked/unavailable'));    // 14
check('Review document includes quote preview preservation',
  source.result.includes('Quote preview preservation'));                                                    // 15
check('Review document includes mobile/theme layout',
  source.result.includes('Layout/theme/mobile'));                                                           // 16
check('Review document includes no unsafe output',
  /No unsafe output/i.test(source.result));                                                                  // 17
check('Review document includes PowerShell setup commands without secret values',
  source.result.includes('npm run dev') && source.result.includes('"your local value"') &&
  !SECRET_VALUE(source.result));                                                                             // 18
check('Review document warns not to paste secrets',
  /do not paste.*secret|secrets\./i.test(source.result) && source.result.includes('access token'));          // 19
check('Review document warns not to paste actual OHLC values',
  /actual OHLC (price )?values/i.test(source.result));                                                       // 20
check('Review document includes PASS criteria', source.result.includes('## 5. PASS Criteria'));             // 21
check('Review document includes FAIL routing', source.result.includes('## 6. FAIL Routing'));               // 22
check('Review document includes owner response template',
  source.result.includes('## 7. Owner Response Template'));                                                 // 23
check('Review document recommends owner manual review',
  source.result.includes('Owner performs manual local review'));                                            // 24
check('Review document recommends closeout on PASS',
  source.result.includes('Phase 3ET-OWNER-REVIEW-CLOSEOUT'));                                                // 25
check('Review document includes Phase 3ET-HF routing',
  /Phase 3ET-HF1/.test(source.result) && /Phase 3ET-HF8/.test(source.result));                               // 26
check('No src runtime files changed in this phase',
  ![...phaseChanges].some((p) => p.startsWith('src/')));                                                     // 27
check('No API route changed in this phase',
  ![...phaseChanges].some((p) => p.startsWith('src/pages/api/')));                                           // 28
check('No provider runtime changed in this phase',
  ![...phaseChanges].some((p) => p.startsWith('src/lib/server/')));                                          // 29
check('No image files added', addedImages.length === 0);                                                     // 30
check('No dependency added',
  dependenciesUnchanged && devDependenciesUnchanged && !phaseChanges.has('package-lock.json'));               // 31
check('No Supabase/SQL/migration file added',
  !addedFiles.some((p) => /supabase|migration|\.sql$/i.test(p)));                                             // 32
check('Docs contain no actual OHLC values', !OHLC_VALUE_PATTERN.test(source.result));                        // 33
check('Docs contain no raw KIS response fields', !RAW_FIELDS.test(source.result));                           // 34
check('Docs contain no secret-looking values',
  !SECRET_VALUE(source.result) && !SECRET_VALUE(phaseSection));                                               // 35
check('Changelog records no deployment', /no deployment/i.test(phaseSection));                               // 36
check('Changelog records no push', /no push/i.test(phaseSection));                                           // 37
check('Checker blocks network access',
  source.checker.includes('Network access is blocked in the Phase 3ET-OWNER-REVIEW checker.') && !fetchAttempted); // 38

process.stdout.write('\n');
process.stdout.write(`Checks passed: ${passed}/${passed + failed}\n`);
if (failed > 0) {
  process.stdout.write(`Failures: ${failures.join('; ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('All Phase 3ET-OWNER-REVIEW checks passed.\n');
}
