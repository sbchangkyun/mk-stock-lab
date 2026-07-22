/**
 * Phase 3EU-OWNER-REVIEW static contract.
 * Owner review package for the Chart AI data integration policy and public boundary plan.
 * Static inspection only. No network, no live KIS, no env values, no dev server, no browser,
 * no public API, no runtime source modification.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error('Network access is blocked in the Phase 3EU-OWNER-REVIEW checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = process.cwd();
const startingCommit = '0f6df6b';
const endingCommit = '1c3defc';
const paths = {
  result: 'docs/planning/phase_3eu_owner_review_chart_ai_data_integration_policy_public_boundary_plan_v0.1.md',
  checker: 'scripts/check_phase_3eu_owner_review_chart_ai_data_integration_policy_static_contract.mjs',
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
const phaseSection = source.changelog.split('## Phase 3EU-OWNER-REVIEW - 2026-07-02')[1]?.split('\n## ')[0] ?? '';
const phaseChanges = new Set(git('diff', '--name-only', `${startingCommit}..${endingCommit}`).split(/\r?\n/).filter(Boolean));
const addedFiles = git('diff', '--name-only', '--diff-filter=A', `${startingCommit}..${endingCommit}`).split(/\r?\n/).filter(Boolean);
const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif', '.bmp']);
const addedImages = addedFiles.filter((path) => imageExtensions.has(extname(path).toLowerCase()));
const dependenciesUnchanged = JSON.stringify(packageJson.dependencies ?? {}) === JSON.stringify(baselinePackage.dependencies ?? {});
const devDependenciesUnchanged = JSON.stringify(packageJson.devDependencies ?? {}) === JSON.stringify(baselinePackage.devDependencies ?? {});

const scanText = `${source.result}\n${phaseSection}`;

const RAW_FIELDS = /stck_bsop_date|stck_oprc|stck_hgpr|stck_lwpr|stck_clpr|acml_vol|rt_cd|msg_cd|output2/i;
const SECRET_VALUE = (text) =>
  /Bearer\s+[A-Za-z0-9._-]{8,}/.test(text) ||
  /KIS_APP_KEY['"]?\s*[:=]\s*['"]?[A-Za-z0-9]{8,}/.test(text) ||
  /KIS_APP_SECRET['"]?\s*[:=]\s*['"]?[A-Za-z0-9]{8,}/.test(text) ||
  /KIS_ACCESS_TOKEN['"]?\s*[:=]\s*['"]?[A-Za-z0-9]{8,}/.test(text);
const MARKET_VALUE_PATTERN = /\b(open|high|low|close|lastPrice|현재가)\b[^\n]{0,20}\b\d{3,}\b/i;

let passed = 0;
let failed = 0;
const failures = [];
const check = (label, condition) => {
  if (condition) { passed += 1; process.stdout.write(`  [PASS] ${label}\n`); }
  else { failed += 1; failures.push(label); process.stdout.write(`  [FAIL] ${label}\n`); }
};

process.stdout.write('=== Phase 3EU-OWNER-REVIEW Chart AI Data Integration Policy Owner Review Contract ===\n\n');

check('Owner review document exists', existsSync(join(root, paths.result)));                                    // 1
check('Checker exists', existsSync(join(root, paths.checker)));                                                 // 2
check('Package script exists',
  packageJson.scripts?.['check:phase-3eu-owner-review-chart-ai-data-integration-policy'] ===
    'node scripts/check_phase_3eu_owner_review_chart_ai_data_integration_policy_static_contract.mjs');          // 3
check('Changelog contains Phase 3EU-OWNER-REVIEW', phaseSection.length > 0);                                     // 4
check('Owner review document status is prepared',
  source.result.includes('Prepared — owner policy review pending.'));                                            // 5
check('Owner review references Phase 3EU',
  /Phase 3EU created the Chart AI data integration policy/i.test(source.result));                                // 6
check('Owner review references Phase 3EN-HF1',
  /Phase 3EN-HF1 restored validation reliability/i.test(source.result));                                         // 7
check('Owner review references owner-local quote/OHLC preview validation',
  /owner-local quote preview was accepted/i.test(source.result) &&
  /owner-local KIS OHLC smoke passed/i.test(source.result) &&
  /owner-local OHLC preview was accepted/i.test(source.result));                                                 // 8
check('Owner review includes review objective', source.result.includes('## 3. Review Objective'));              // 9
check('Owner review includes public/default /chart-ai decision',
  /1\. Public\/default `\/chart-ai`/.test(source.result));                                                       // 10
check('Owner review includes owner-local preview decision',
  /2\. Owner-local preview/.test(source.result));                                                                // 11
check('Owner review includes source mode policy',
  /3\. Source mode policy/.test(source.result));                                                                 // 12
check('Owner review includes fixture/mocked/owner-local/live/auto',
  /`fixture`/.test(source.result) && /`mocked`/.test(source.result) && /`owner-local`/.test(source.result) &&
  /`live`/.test(source.result) && /`auto`/.test(source.result));                                                 // 13
check('Owner review states public/default /chart-ai remains sample/mocked',
  /Public\/default `\/chart-ai` remains sample\/mocked for now/i.test(source.result));                           // 14
check('Owner review states owner-local preview remains the only approved KIS-backed runtime path',
  /Owner-local preview remains the only approved KIS-backed runtime path/i.test(source.result));                 // 15
check('Owner review states public live quote remains unauthorized',
  /Public live quote remains unauthorized/i.test(source.result));                                                // 16
check('Owner review states public live OHLC remains unauthorized',
  /Public live OHLC remains unauthorized/i.test(source.result));                                                 // 17
check('Owner review states source=live remains unauthorized',
  /`source=live` remains unauthorized/i.test(source.result));                                                    // 18
check('Owner review states source=auto remains deferred',
  /`source=auto` remains deferred/i.test(source.result));                                                        // 19
check('Owner review states production deployment remains unauthorized',
  /Production deployment remains unauthorized/i.test(source.result));                                            // 20
check('Owner review includes KIS approval gates',
  /5\. KIS approval gates/.test(source.result));                                                                 // 21
check('Owner review includes UI labeling policy',
  /6\. UI labeling policy/.test(source.result));                                                                 // 22
check('Owner review includes route/API boundary',
  /7\. Route\/API boundary/.test(source.result));                                                                // 23
check('Owner review includes fallback/degradation policy',
  /Fallback\/degradation policy/i.test(source.result));                                                          // 24
check('Owner review includes security/compliance policy',
  /Security\/compliance policy/i.test(source.result));                                                           // 25
check('Owner review includes production deployment policy',
  /8\. Production deployment policy/.test(source.result));                                                       // 26
check('Owner review includes decision matrix',
  /9\. Decision matrix/.test(source.result));                                                                    // 27
check('Owner review includes recommended owner decision PASS_WITH_POLICY_BOUNDARY',
  /`PASS_WITH_POLICY_BOUNDARY`/.test(source.result));                                                             // 28
check('Owner review includes PASS criteria', source.result.includes('## 6. PASS Criteria'));                     // 29
check('Owner review includes revision routing', source.result.includes('## 7. Revision Routing'));               // 30
check('Owner review includes owner response template',
  source.result.includes('## 8. Owner Response Template'));                                                      // 31
check('Owner review recommends Phase 3EU-OWNER-REVIEW-CLOSEOUT on PASS',
  /Phase 3EU-OWNER-REVIEW-CLOSEOUT — Close out policy review as PASS/.test(source.result));                      // 32
check('Owner review includes Phase 3EV-A alternative after acceptance',
  /Phase 3EV-A — Public Sample\/Fallback Hardening/.test(source.result));                                        // 33
check('No src runtime files changed in this phase',
  ![...phaseChanges].some((p) => p.startsWith('src/')));                                                         // 34
check('No API route changed in this phase',
  ![...phaseChanges].some((p) => p.startsWith('src/pages/api/')));                                               // 35
check('No provider runtime changed in this phase',
  ![...phaseChanges].some((p) => p.startsWith('src/lib/server/')));                                              // 36
check('No image files added', addedImages.length === 0);                                                         // 37
check('No dependency added',
  dependenciesUnchanged && devDependenciesUnchanged && !phaseChanges.has('package-lock.json'));                   // 38
check('No Supabase/SQL/migration file added',
  !addedFiles.some((p) => /supabase|migration|\.sql$/i.test(p)));                                                // 39
check('Docs contain no actual market values', !MARKET_VALUE_PATTERN.test(scanText));                             // 40
check('Docs contain no raw KIS response fields', !RAW_FIELDS.test(scanText));                                    // 41
check('Docs contain no secret-looking values', !SECRET_VALUE(scanText));                                         // 42
check('Changelog records no deployment', /no deployment/i.test(phaseSection));                                   // 43
check('Changelog records no push', /no push/i.test(phaseSection));                                               // 44
check('Changelog records no public KIS data authorization',
  /no public KIS data authorization/i.test(phaseSection));                                                       // 45
check('Changelog records no source=live/source=auto authorization',
  /no `source=live` or `source=auto` authorization/i.test(phaseSection));                                        // 46
check('Checker blocks network access',
  source.checker.includes('Network access is blocked in the Phase 3EU-OWNER-REVIEW checker.') && !fetchAttempted); // 47

process.stdout.write('\n');
process.stdout.write(`Checks passed: ${passed}/${passed + failed}\n`);
if (failed > 0) {
  process.stdout.write(`Failures: ${failures.join('; ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('All Phase 3EU-OWNER-REVIEW checks passed.\n');
}
