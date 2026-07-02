/**
 * Phase 3EU-OWNER-REVIEW-CLOSEOUT static contract.
 * Chart AI data integration policy owner review closeout.
 * Static inspection only. No network, no live KIS, no env values, no dev server, no browser,
 * no public API, no runtime source modification.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error('Network access is blocked in the Phase 3EU-OWNER-REVIEW-CLOSEOUT checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = process.cwd();
const startingCommit = '1c3defc';
const paths = {
  result: 'docs/planning/phase_3eu_owner_review_closeout_chart_ai_data_integration_policy_result_v0.1.md',
  checker: 'scripts/check_phase_3eu_owner_review_closeout_chart_ai_data_policy_static_contract.mjs',
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
const phaseSection = source.changelog.split('## Phase 3EU-OWNER-REVIEW-CLOSEOUT - 2026-07-02')[1]?.split('\n## ')[0] ?? '';
const phaseChanges = new Set(git('diff', '--name-only', startingCommit).split(/\r?\n/).filter(Boolean));
const addedFiles = git('diff', '--name-only', '--diff-filter=A', startingCommit).split(/\r?\n/).filter(Boolean);
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

process.stdout.write('=== Phase 3EU-OWNER-REVIEW-CLOSEOUT Chart AI Data Integration Policy Owner Review Closeout Contract ===\n\n');

check('Closeout document exists', existsSync(join(root, paths.result)));                                       // 1
check('Checker exists', existsSync(join(root, paths.checker)));                                                 // 2
check('Package script exists',
  packageJson.scripts?.['check:phase-3eu-owner-review-closeout-chart-ai-data-policy'] ===
    'node scripts/check_phase_3eu_owner_review_closeout_chart_ai_data_policy_static_contract.mjs');             // 3
check('Changelog contains Phase 3EU-OWNER-REVIEW-CLOSEOUT', phaseSection.length > 0);                            // 4
check('Closeout status is Closed',
  /^Closed — owner review PASS_WITH_POLICY_BOUNDARY\.$/m.test(source.result));                                   // 5
check('Closeout decision is PASS_WITH_POLICY_BOUNDARY',
  /^PASS_WITH_POLICY_BOUNDARY$/m.test(source.result));                                                           // 6
check('Closeout references Phase 3EU',
  /Phase 3EU created the Chart AI data integration policy/i.test(source.result));                                // 7
check('Closeout references Phase 3EU-OWNER-REVIEW',
  /Phase 3EU-OWNER-REVIEW prepared the owner policy review package/i.test(source.result));                       // 8
check('Closeout records owner accepted policy boundary',
  /The owner accepted the recommended policy boundary/i.test(source.result));                                    // 9
check('Closeout records public/default /chart-ai sample/mocked ACCEPT',
  /Public\/default `\/chart-ai` remains sample\/mocked: ACCEPT\./.test(source.result));                          // 10
check('Closeout records owner-local preview as only approved KIS-backed runtime path ACCEPT',
  /Owner-local preview remains only approved KIS-backed runtime path: ACCEPT\./.test(source.result));            // 11
check('Closeout records public live quote unauthorized ACCEPT',
  /Public live quote remains unauthorized: ACCEPT\./.test(source.result));                                       // 12
check('Closeout records public live OHLC unauthorized ACCEPT',
  /Public live OHLC remains unauthorized: ACCEPT\./.test(source.result));                                        // 13
check('Closeout records source=live unauthorized ACCEPT',
  /`source=live` remains unauthorized for public\/default: ACCEPT\./.test(source.result));                       // 14
check('Closeout records source=auto deferred ACCEPT',
  /`source=auto` remains deferred: ACCEPT\./.test(source.result));                                               // 15
check('Closeout records production deployment unauthorized ACCEPT',
  /Production deployment remains unauthorized: ACCEPT\./.test(source.result));                                   // 16
check('Closeout records KIS approval gates ACCEPT',
  /KIS approval gates: ACCEPT\./.test(source.result));                                                           // 17
check('Closeout records UI labeling policy ACCEPT',
  /UI labeling policy: ACCEPT\./.test(source.result));                                                           // 18
check('Closeout records route/API boundary ACCEPT',
  /Route\/API boundary: ACCEPT\./.test(source.result));                                                          // 19
check('Closeout records fallback/degradation policy ACCEPT',
  /Fallback\/degradation policy: ACCEPT\./.test(source.result));                                                 // 20
check('Closeout records security/compliance policy ACCEPT',
  /Security\/compliance policy: ACCEPT\./.test(source.result));                                                  // 21
check('Closeout records decision matrix ACCEPT',
  /Decision matrix: ACCEPT\./.test(source.result));                                                              // 22
check('Closeout records recommended implementation sequence ACCEPT',
  /Recommended implementation sequence: ACCEPT\./.test(source.result));                                          // 23
check('Closeout states no public KIS data authorization',
  /public live quote;/i.test(source.result) && /This closeout does not authorize:/i.test(source.result));       // 24
check('Closeout states no public delayed KIS data authorization',
  /public delayed KIS data;/i.test(source.result));                                                              // 25
check('Closeout states owner-local gates are not weakened',
  /weakening owner-local gates;/i.test(source.result) || /Existing owner-local gates remain intact\./i.test(source.result)); // 26
check('Closeout states owner-local routes must not be reused as public routes',
  /reusing owner-local routes as public routes;/i.test(source.result) ||
  /must not reuse owner-local routes/i.test(source.result));                                                     // 27
check('Closeout states no account/trading/order/balance APIs',
  /account\/trading\/order\/balance APIs;/i.test(source.result));                                                // 28
check('Closeout states no KIS_ACCOUNT_NO usage for Chart AI quote/OHLC',
  /`KIS_ACCOUNT_NO` usage for Chart AI quote\/OHLC;/i.test(source.result));                                      // 29
check('Closeout recommends Phase 3EV-A',
  /Phase 3EV-A — Public Sample\/Fallback Hardening/.test(source.result));                                        // 30
check('Closeout includes Phase 3EV-B and Phase 3EV-C as alternatives only if explicitly chosen',
  /Phase 3EV-B — Owner-Auth Gated Preview Plan, only if the owner wants/i.test(source.result) &&
  /Phase 3EV-C — Public Delayed Data Feasibility Review, only if/i.test(source.result));                         // 31
check('No src runtime files changed in this phase',
  ![...phaseChanges].some((p) => p.startsWith('src/')));                                                         // 32
check('No API route changed in this phase',
  ![...phaseChanges].some((p) => p.startsWith('src/pages/api/')));                                               // 33
check('No provider runtime changed in this phase',
  ![...phaseChanges].some((p) => p.startsWith('src/lib/server/')));                                              // 34
check('No image files added', addedImages.length === 0);                                                         // 35
check('No dependency added',
  dependenciesUnchanged && devDependenciesUnchanged && !phaseChanges.has('package-lock.json'));                   // 36
check('No Supabase/SQL/migration file added',
  !addedFiles.some((p) => /supabase|migration|\.sql$/i.test(p)));                                                // 37
check('Docs contain no actual market values', !MARKET_VALUE_PATTERN.test(scanText));                             // 38
check('Docs contain no raw KIS response fields', !RAW_FIELDS.test(scanText));                                    // 39
check('Docs contain no secret-looking values', !SECRET_VALUE(scanText));                                         // 40
check('Changelog records no deployment', /no deployment/i.test(phaseSection));                                   // 41
check('Changelog records no push', /no push/i.test(phaseSection));                                               // 42
check('Changelog records no public KIS data authorization',
  /no public KIS data authorization/i.test(phaseSection));                                                       // 43
check('Changelog records no source=live/source=auto authorization',
  /no `source=live`, no `source=auto`/i.test(phaseSection) ||
  /no `source=live` or `source=auto` authorization/i.test(phaseSection));                                        // 44
check('Checker blocks network access',
  source.checker.includes('Network access is blocked in the Phase 3EU-OWNER-REVIEW-CLOSEOUT checker.') && !fetchAttempted); // 45

process.stdout.write('\n');
process.stdout.write(`Checks passed: ${passed}/${passed + failed}\n`);
if (failed > 0) {
  process.stdout.write(`Failures: ${failures.join('; ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('All Phase 3EU-OWNER-REVIEW-CLOSEOUT checks passed.\n');
}
