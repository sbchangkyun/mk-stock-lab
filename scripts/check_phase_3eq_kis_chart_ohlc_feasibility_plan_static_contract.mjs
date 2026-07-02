/**
 * Phase 3EQ documentation/tooling contract.
 * KIS chart/OHLC feasibility and chart data integration plan.
 * Static only: no network, browser, dev server, API, provider, live KIS, web, or environment access.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error('Network access is blocked in the Phase 3EQ KIS chart/OHLC feasibility plan checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = process.cwd();
const startingCommit = '66a2388';
// Bounded to this phase's own ending commit (Pattern B). Diffing to HEAD would falsely trip
// "no src/api/lib changed" once later phases (e.g. Phase 3ER, 3ES, 3ET) made their own
// legitimate src/ changes. This phase was doc-only and its own work concluded at 5d52a80.
const endingCommit = '5d52a80';
const paths = {
  result: 'docs/planning/phase_3eq_kis_chart_ohlc_feasibility_and_chart_data_integration_plan_v0.1.md',
  checker: 'scripts/check_phase_3eq_kis_chart_ohlc_feasibility_plan_static_contract.mjs',
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
const phaseSection = source.changelog.split('## Phase 3EQ - 2026-07-01')[1]?.split('\n## ')[0] ?? '';
const phaseChanges = new Set(git('diff', '--name-only', `${startingCommit}..${endingCommit}`).split(/\r?\n/).filter(Boolean));
const srcChanges = [...phaseChanges].filter((path) => path.startsWith('src/'));
const apiChanges = srcChanges.filter((path) => path.startsWith('src/pages/api/'));
const providerChanges = srcChanges.filter((path) => path.startsWith('src/lib/server/providers/'));
const addedFiles = git('diff', '--name-only', '--diff-filter=A', `${startingCommit}..${endingCommit}`).split(/\r?\n/).filter(Boolean);
const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif', '.bmp']);
const addedImages = addedFiles.filter((path) => imageExtensions.has(extname(path).toLowerCase()));
const dependenciesUnchanged = JSON.stringify(packageJson.dependencies ?? {}) === JSON.stringify(baselinePackage.dependencies ?? {});
const devDependenciesUnchanged = JSON.stringify(packageJson.devDependencies ?? {}) === JSON.stringify(baselinePackage.devDependencies ?? {});

const result = source.result;
const RAW_FIELDS = /stck_prpr|stck_oprc|stck_hgpr|stck_lwpr|acml_vol|rt_cd/i;
const SECRET_VALUE = (text) =>
  /Bearer\s+[A-Za-z0-9._-]{8,}/.test(text) ||
  /KIS_APP_KEY['"]?\s*[:=]\s*['"]?[A-Za-z0-9]{8,}/.test(text) ||
  /KIS_APP_SECRET['"]?\s*[:=]\s*['"]?[A-Za-z0-9]{8,}/.test(text) ||
  /KIS_ACCESS_TOKEN['"]?\s*[:=]\s*['"]?[A-Za-z0-9]{8,}/.test(text);
// No numeric price value on an open/high/low/close price line.
const NO_PRICE = (text) => !/\b(open|high|low|close|현재가|종가)\b[^\n]*[:=]\s*\d{3,}/i.test(text);

let passed = 0;
let failed = 0;
const failures = [];
const check = (label, condition) => {
  if (condition) { passed += 1; process.stdout.write(`  [PASS] ${label}\n`); }
  else { failed += 1; failures.push(label); process.stdout.write(`  [FAIL] ${label}\n`); }
};

process.stdout.write('=== Phase 3EQ KIS Chart/OHLC Feasibility Plan Contract ===\n\n');

process.stdout.write('Files, command, and changelog:\n');
check('Result document exists', existsSync(join(root, paths.result)));                                    // 1
check('Static checker exists', existsSync(join(root, paths.checker)));                                    // 2
check('Package checker command exists',                                                                   // 3
  packageJson.scripts?.['check:phase-3eq-kis-chart-ohlc-feasibility-plan'] ===
    'node scripts/check_phase_3eq_kis_chart_ohlc_feasibility_plan_static_contract.mjs');
check('Changelog contains Phase 3EQ', phaseSection.length > 0);                                           // 4
check('Result status is completed',
  result.includes('Completed — KIS chart/OHLC feasibility and integration plan ready.'));                 // 5
check('Result references Phase 3EP owner review PASS',
  result.includes('Phase 3EP owner review PASS'));                                                        // 6
check('Result states main chart still sample/mocked',
  result.includes('sample/mocked OHLC') || result.includes('sample/mocked'));                             // 7
process.stdout.write('\n');

process.stdout.write('Official source verification:\n');
check('Result has official source verification section', result.includes('## 3. Official Source Verification')); // 8
check('Result records endpoint titles or unknown/unverified',
  result.includes('inquire-price') && result.includes('NEEDS_OFFICIAL_VERIFICATION'));                    // 9
check('Result does not claim unverified values as final',
  result.includes('treated as final or implementation-ready') &&
  result.includes('NEEDS_OFFICIAL_VERIFICATION'));                                                        // 10
process.stdout.write('\n');

process.stdout.write('Current chart contract and OHLC contract:\n');
check('Result includes current Chart AI chart contract review', result.includes('## 4. Current Chart AI Chart Contract')); // 11
check('Result references mockedOhlc', result.includes('mockedOhlc'));                                     // 12
check('Result references chartScale', result.includes('chartScale'));                                    // 13
for (const key of ['1d', '1w', '1m', '3m', '1y']) {
  check(`Result includes period control ${key}`, result.includes(`\`${key}\``) || result.includes(key)); // 14
}
check('Result includes normalized OHLC contract', result.includes('Normalized OHLC Contract'));          // 15
check('Result includes NormalizedOhlcPoint', result.includes('NormalizedOhlcPoint'));                    // 16
check('Result includes NormalizedOhlcSeries', result.includes('NormalizedOhlcSeries'));                  // 17
for (const field of ['dateTime', 'open', 'high', 'low', 'close', 'volume']) {
  check(`Result OHLC point includes ${field}`, result.includes(field));                                  // 18
}
for (const field of ['source', 'freshness', 'isLive', 'providerStatus']) {
  check(`Result OHLC series includes ${field}`, result.includes(field));                                 // 19
}
process.stdout.write('\n');

process.stdout.write('Period mapping and feasibility:\n');
check('Result includes period mapping table',
  result.includes('| Chart AI control |') && result.includes('KIS source candidate'));                    // 20
for (const [num, label] of [[21, '1일'], [22, '1주'], [23, '1개월'], [24, '3개월'], [25, '1년']]) {
  check(`Result includes ${label}`, result.includes(label));                                             // 21-25
}
check('Result includes domestic stock feasibility', result.includes('Domestic stock feasibility'));      // 26
check('Result includes domestic ETF feasibility', result.includes('Domestic ETF feasibility'));          // 27
check('Result includes US feasibility status', result.includes('US feasibility status'));                // 28
process.stdout.write('\n');

process.stdout.write('Fallback and safety statements:\n');
check('Result includes PROVIDER_UNAVAILABLE fallback', result.includes('PROVIDER_UNAVAILABLE'));         // 29
check('Result includes CONFIG_MISSING fallback', result.includes('CONFIG_MISSING'));                     // 30
check('Result includes endpoint unverified fallback', result.includes('Endpoint unverified'));           // 31
check('Result includes insufficient points fallback', result.includes('Insufficient points'));           // 32
check('Result states no live call in this phase', result.includes('No live KIS call in this phase'));    // 33
check('Result states no raw response', result.includes('No raw response recorded or committed'));        // 34
check('Result states no secrets', result.includes('No secrets recorded or printed'));                    // 35
check('Result states no account/trading APIs', result.includes('No account/trading APIs'));              // 36
check('Result states no deployment', result.includes('No deployment.'));                                 // 37
check('Result states no push', result.includes('No push.'));                                             // 38
check('Result recommends Phase 3ER',
  result.includes('Phase 3ER — KIS OHLC Contract and Mocked Adapter Foundation'));                        // 39
process.stdout.write('\n');

process.stdout.write('Changelog and documentation-only boundaries:\n');
check('Changelog records no runtime source changes', /no runtime source changes/i.test(phaseSection));   // 40
check('Changelog records no deployment', /no deployment/i.test(phaseSection));                            // 41
check('Changelog records no push', /no push/i.test(phaseSection));                                        // 42
check('No src runtime file changed in this phase', srcChanges.length === 0);                              // 43
check('No API route file changed', apiChanges.length === 0);                                              // 44
check('No provider runtime file changed', providerChanges.length === 0);                                 // 45
check('No image file added', addedImages.length === 0);                                                   // 46
check('No dependency added',
  dependenciesUnchanged && devDependenciesUnchanged && !phaseChanges.has('package-lock.json'));           // 47
check('No Supabase file changed', ![...phaseChanges].some((p) => /supabase/i.test(p)));                   // 48
check('No SQL/migration file added', ![...phaseChanges].some((p) => /migration|\.sql$/i.test(p)));        // 49
check('Docs contain no actual price values', NO_PRICE(result));                                           // 50
check('Docs contain no raw KIS response fields', !RAW_FIELDS.test(result));                               // 51
check('Docs contain no secret-looking values', !SECRET_VALUE(result));                                    // 52
check('Known legacy checker note preserved',
  result.includes('100/101') && result.includes('valuation'));                                            // 53
check('Checker blocks network access',
  source.checker.includes('Network access is blocked in the Phase 3EQ KIS chart/OHLC feasibility plan checker.') && !fetchAttempted);
process.stdout.write('\n');

process.stdout.write(`Checks passed: ${passed}/${passed + failed}\n`);
if (failed > 0) {
  process.stdout.write(`Failures: ${failures.join('; ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('All Phase 3EQ checks passed.\n');
}
