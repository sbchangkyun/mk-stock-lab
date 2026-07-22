/**
 * Phase 3EU static contract.
 * Chart AI data integration policy and public boundary plan. Static inspection only. No network,
 * no live KIS, no env values, no dev server, no browser, no public API, no runtime source
 * modification.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error('Network access is blocked in the Phase 3EU checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = process.cwd();
const startingCommit = '8a32501';
const endingCommit = '0f6df6b';
const paths = {
  result: 'docs/planning/phase_3eu_chart_ai_data_integration_policy_and_public_boundary_plan_v0.1.md',
  checker: 'scripts/check_phase_3eu_chart_ai_data_integration_policy_public_boundary_plan_static_contract.mjs',
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
const phaseSection = source.changelog.split('## Phase 3EU - 2026-07-02')[1]?.split('\n## ')[0] ?? '';
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

process.stdout.write('=== Phase 3EU Chart AI Data Integration Policy and Public Boundary Plan Contract ===\n\n');

check('Policy plan document exists', existsSync(join(root, paths.result)));                                   // 1
check('Checker exists', existsSync(join(root, paths.checker)));                                                // 2
check('Package script exists',
  packageJson.scripts?.['check:phase-3eu-chart-ai-data-integration-policy-public-boundary-plan'] ===
    'node scripts/check_phase_3eu_chart_ai_data_integration_policy_public_boundary_plan_static_contract.mjs'); // 3
check('Changelog contains Phase 3EU', phaseSection.length > 0);                                                 // 4
check('Policy status is completed',
  source.result.includes('Completed — policy and public boundary plan ready.'));                                // 5
check('Policy references Phase 3ET owner review PASS',
  /Phase 3ET-OWNER-REVIEW-CLOSEOUT/.test(source.result) && /owner review PASS/i.test(source.result));           // 6
check('Policy references Phase 3EN-HF1 checker cleanup',
  /Phase 3EN-HF1/.test(source.result) && /checker cleanup/i.test(source.result));                                // 7
check('Policy records current accepted state', source.result.includes('## 3. Current Accepted State'));         // 8
check('Policy defines fixture source mode', /\*\*`fixture`\*\*/.test(source.result));                            // 9
check('Policy defines mocked source mode', /\*\*`mocked`\*\*/.test(source.result));                              // 10
check('Policy defines owner-local source mode', /\*\*`owner-local`\*\*/.test(source.result));                    // 11
check('Policy blocks live source mode',
  /\*\*`live`\*\*: not authorized/.test(source.result));                                                         // 12
check('Policy defers auto source mode', /\*\*`auto`\*\*: deferred/.test(source.result));                         // 13
check('Policy states public/default Chart AI remains sample/mocked',
  /public\/default Chart AI remains sample\/mocked/i.test(scanText));                                            // 14
check('Policy states owner-local preview is the only approved KIS-backed runtime path',
  /Owner-local preview remains the only.*KIS-backed runtime path/i.test(scanText));                              // 15
check('Policy states public live quote is unauthorized',
  /public live quote is not\s+authorized/i.test(source.result));                                                 // 16
check('Policy states public live OHLC is unauthorized',
  /public live OHLC is not\s+authorized/i.test(source.result));                                                  // 17
check('Policy states source=live is unauthorized',
  /`source=live` is not\s+authorized/i.test(source.result));                                                     // 18
check('Policy states source=auto is unauthorized',
  /`source=auto` is not\s+authorized/i.test(source.result));                                                     // 19
check('Policy states production deployment is unauthorized',
  /production deployment is not\s+authorized/i.test(source.result));                                             // 20
check('Policy defines owner-local gate requirements', source.result.includes('## 6. Owner-Local Boundary'));    // 21
check('Policy defines KIS approval gates',
  source.result.includes('## 7. KIS Data Use and Approval Gates'));                                              // 22
check('Policy defines UI labeling policy',
  source.result.includes('## 8. Chart AI UI Labeling Policy'));                                                  // 23
check('Policy forbids real-time/current wording unless approved',
  /실시간.*현재가.*unless data rights/is.test(source.result) || /must not introduce "실시간"/i.test(source.result)); // 24
check('Policy defines route/API boundary',
  source.result.includes('## 9. Route and API Boundary Policy'));                                                // 25
check('Policy defines fallback/degradation policy',
  source.result.includes('## 10. Fallback and Degradation Policy'));                                             // 26
check('Policy defines security/compliance policy',
  source.result.includes('## 11. Security and Compliance Policy'));                                              // 27
check('Policy states no account/trading APIs',
  /No account, trading, order, or balance API usage/i.test(source.result));                                      // 28
check('Policy states no KIS_ACCOUNT_NO for Chart AI quote/OHLC',
  /No `KIS_ACCOUNT_NO` usage for Chart AI/i.test(source.result));                                                // 29
check('Policy states Vercel env presence alone does not authorize public live data',
  /Vercel environment variable presence alone does not authorize public live data/i.test(source.result));        // 30
check('Policy defines production deployment policy',
  source.result.includes('## 12. Production Deployment Policy'));                                                // 31
check('Policy includes recommended implementation sequence',
  source.result.includes('## 13. Recommended Implementation Sequence'));                                         // 32
check('Policy includes decision matrix', source.result.includes('## 14. Decision Matrix'));                      // 33
check('Policy includes open questions', source.result.includes('## 15. Open Questions'));                        // 34
check('Policy recommends Phase 3EU-OWNER-REVIEW',
  /Phase 3EU-OWNER-REVIEW — Owner Review of Chart AI Data Integration Policy/i.test(source.result));             // 35
check('Policy alternative includes Phase 3EV-A',
  /Phase 3EV-A — Public Sample\/Fallback Hardening/i.test(source.result));                                       // 36
check('No src runtime files changed in this phase',
  ![...phaseChanges].some((p) => p.startsWith('src/')));                                                         // 37
check('No API route changed in this phase',
  ![...phaseChanges].some((p) => p.startsWith('src/pages/api/')));                                               // 38
check('No provider runtime changed in this phase',
  ![...phaseChanges].some((p) => p.startsWith('src/lib/server/')));                                              // 39
check('No image files added', addedImages.length === 0);                                                         // 40
check('No dependency added',
  dependenciesUnchanged && devDependenciesUnchanged && !phaseChanges.has('package-lock.json'));                   // 41
check('No Supabase/SQL/migration file added',
  !addedFiles.some((p) => /supabase|migration|\.sql$/i.test(p)));                                                 // 42
check('Docs contain no actual market values', !MARKET_VALUE_PATTERN.test(scanText));                              // 43
check('Docs contain no raw KIS response fields', !RAW_FIELDS.test(scanText));                                     // 44
check('Docs contain no secret-looking values', !SECRET_VALUE(scanText));                                          // 45
check('Changelog records no deployment', /no deployment/i.test(phaseSection));                                    // 46
check('Changelog records no push', /no push/i.test(phaseSection));                                                // 47
check('Checker blocks network access',
  source.checker.includes('Network access is blocked in the Phase 3EU checker.') && !fetchAttempted);            // 48

process.stdout.write('\n');
process.stdout.write(`Checks passed: ${passed}/${passed + failed}\n`);
if (failed > 0) {
  process.stdout.write(`Failures: ${failures.join('; ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('All Phase 3EU checks passed.\n');
}
