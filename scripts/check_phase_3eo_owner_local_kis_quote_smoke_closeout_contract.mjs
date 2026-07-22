/**
 * Phase 3EO-OWNER-SMOKE-CLOSEOUT documentation/tooling contract.
 * Static only: no network, browser, dev server, API, provider, live smoke, or environment access.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error('Network access is blocked in the Phase 3EO owner-smoke closeout checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = process.cwd();
const startingCommit = '86539e0';
// Pinned to this closeout's own commit so later phases do not pollute this
// documentation-only phase diff.
const endingCommit = 'c85e1f8';
const paths = {
  closeout: 'docs/planning/phase_3eo_owner_local_kis_quote_smoke_closeout_result_v0.1.md',
  result: 'docs/planning/phase_3eo_owner_local_kis_quote_smoke_result_v0.1.md',
  checker: 'scripts/check_phase_3eo_owner_local_kis_quote_smoke_closeout_contract.mjs',
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
const phaseSection = source.changelog.split('## Phase 3EO - 2026-07-01')[1]?.split('\n## ')[0] ?? '';
const phaseChanges = new Set(git('diff', '--name-only', startingCommit, endingCommit).split(/\r?\n/).filter(Boolean));
const srcChanges = [...phaseChanges].filter((path) => path.startsWith('src/'));
const apiChanges = srcChanges.filter((path) => path.startsWith('src/pages/api/'));
const providerChanges = srcChanges.filter((path) => path.startsWith('src/lib/server/providers/'));
const addedFiles = git('diff', '--name-only', '--diff-filter=A', startingCommit, endingCommit).split(/\r?\n/).filter(Boolean);
const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif', '.bmp']);
const addedImages = addedFiles.filter((path) => imageExtensions.has(extname(path).toLowerCase()));
const dependenciesUnchanged = JSON.stringify(packageJson.dependencies ?? {}) === JSON.stringify(baselinePackage.dependencies ?? {});
const devDependenciesUnchanged = JSON.stringify(packageJson.devDependencies ?? {}) === JSON.stringify(baselinePackage.devDependencies ?? {});

// Shared redaction guards applied to both the result and closeout docs.
const NO_PRICE = (text) => !/(last price|lastPrice)[^\n]*\b\d{3,}\b/i.test(text);
const NO_RAW_RESPONSE = (text) => !/rt_cd|stck_prpr|prdy_vrss|prdy_ctrt|acml_vol/i.test(text);
const NO_SECRET_VALUE = (text) =>
  !/Bearer\s+[A-Za-z0-9._-]{8,}/.test(text) &&
  !/KIS_APP_KEY['"]?\s*[:=]\s*['"]?[A-Za-z0-9]{8,}/.test(text) &&
  !/KIS_APP_SECRET['"]?\s*[:=]\s*['"]?[A-Za-z0-9]{8,}/.test(text) &&
  !/KIS_ACCESS_TOKEN['"]?\s*[:=]\s*['"]?[A-Za-z0-9]{8,}/.test(text) &&
  !/authorization:\s*Bearer/i.test(text);

let passed = 0;
let failed = 0;
const failures = [];
const check = (label, condition) => {
  if (condition) { passed += 1; process.stdout.write(`  [PASS] ${label}\n`); }
  else { failed += 1; failures.push(label); process.stdout.write(`  [FAIL] ${label}\n`); }
};

process.stdout.write('=== Phase 3EO-OWNER-SMOKE-CLOSEOUT Static Contract ===\n\n');

process.stdout.write('Files, command, and changelog:\n');
check('Closeout result document exists', existsSync(join(root, paths.closeout)));
check('Static checker exists', existsSync(join(root, paths.checker)));
check('Package checker command exists',
  packageJson.scripts?.['check:phase-3eo-owner-local-kis-quote-smoke-closeout'] ===
    'node scripts/check_phase_3eo_owner_local_kis_quote_smoke_closeout_contract.mjs');
check('Changelog contains Phase 3EO', phaseSection.length > 0);
process.stdout.write('\n');

process.stdout.write('Decision and owner-run evidence:\n');
check('Closeout status records owner-run PASS_WITH_INTERMITTENT_PROVIDER_NOTE',
  source.closeout.includes('Closed — owner-run KIS quote smoke `PASS_WITH_INTERMITTENT_PROVIDER_NOTE`.'));
check('Closeout decision records PASS_WITH_INTERMITTENT_PROVIDER_NOTE',
  source.closeout.includes('## 2. Decision\n\n`PASS_WITH_INTERMITTENT_PROVIDER_NOTE`'));
check('Closeout records first-run PASS evidence',
  source.closeout.includes('First run — `PASS`') && source.closeout.includes('KR_STOCK_QUOTE') &&
  source.closeout.includes('2xx') && source.closeout.includes('kis-local'));
check('Closeout records intermittent retry note',
  source.closeout.includes('PROVIDER_UNAVAILABLE') && source.closeout.includes('5xx') &&
  source.closeout.includes('intermittent'));
check('Result document status is PASS_WITH_INTERMITTENT_PROVIDER_NOTE',
  /##\s*1\.\s*Status\s*\n\s*\nPASS_WITH_INTERMITTENT_PROVIDER_NOTE/.test(source.result));
check('Result document records owner-run first PASS',
  source.result.includes('### 5.2 Owner-run first attempt (PASS)') && source.result.includes('kis-local'));
check('Result document records intermittent retry',
  source.result.includes('### 5.3 Owner-run immediate retry (intermittent provider note)') &&
  source.result.includes('PROVIDER_UNAVAILABLE'));
check('Result document retains automated-session BLOCKED note',
  source.result.includes('Automated-session attempt') && source.result.includes('BLOCKED') &&
  source.result.includes('not-run'));
process.stdout.write('\n');

process.stdout.write('Sanitization (no prices, raw response, or secrets):\n');
check('Closeout records no actual price values', NO_PRICE(source.closeout));
check('Result records no actual price values', NO_PRICE(source.result));
check('Closeout contains no raw response body', NO_RAW_RESPONSE(source.closeout));
check('Result contains no raw response body', NO_RAW_RESPONSE(source.result));
check('Closeout contains no secret values', NO_SECRET_VALUE(source.closeout));
check('Result contains no secret values', NO_SECRET_VALUE(source.result));
check('Closeout confirms no live KIS re-run', source.closeout.includes('No live KIS re-run.'));
check('Closeout confirms no raw response committed', source.closeout.includes('No raw response committed.'));
process.stdout.write('\n');

process.stdout.write('Changelog and documentation-only boundaries:\n');
check('Changelog records owner-run PASS_WITH_INTERMITTENT_PROVIDER_NOTE',
  phaseSection.includes('PASS_WITH_INTERMITTENT_PROVIDER_NOTE'));
check('Changelog records first owner-run PASS',
  phaseSection.includes('first run PASSed') || phaseSection.includes('first attempt `PASS`'));
check('Changelog records intermittent provider note',
  phaseSection.includes('PROVIDER_UNAVAILABLE') && phaseSection.includes('intermittent provider-availability note'));
check('Changelog keeps no public UI quote wiring', phaseSection.includes('no UI quote wiring'));
check('No src runtime file changed in this closeout', srcChanges.length === 0);
check('No Chart AI page changed', !phaseChanges.has('src/pages/chart-ai.astro'));
check('No API route file changed', apiChanges.length === 0);
check('No provider runtime file changed', providerChanges.length === 0);
check('No image file added', addedImages.length === 0);
check('No dependency added',
  dependenciesUnchanged && devDependenciesUnchanged && !phaseChanges.has('package-lock.json'));
check('No migration or SQL file added', ![...phaseChanges].some((path) => /migration|\.sql$/i.test(path)));
check('No Supabase file changed', ![...phaseChanges].some((path) => /supabase/i.test(path)));
check('Changelog records no deployment', /no deployment/i.test(phaseSection));
check('Changelog records no push', /no push/i.test(phaseSection));
check('Closeout recommends Phase 3EP',
  source.closeout.includes('Phase 3EP — Chart AI Owner-Local Quote Preview Wiring'));
check('Checker blocks network access',
  source.checker.includes('Network access is blocked in the Phase 3EO owner-smoke closeout checker.') && !fetchAttempted);
process.stdout.write('\n');

process.stdout.write(`Checks passed: ${passed}/${passed + failed}\n`);
if (failed > 0) {
  process.stdout.write(`Failures: ${failures.join('; ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('All Phase 3EO-OWNER-SMOKE-CLOSEOUT checks passed.\n');
}
