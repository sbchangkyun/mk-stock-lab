/**
 * Phase 3EL-OWNER-REVIEW-HF2-LX-CLOSEOUT documentation/tooling contract.
 * Static only: no network, browser, dev server, API, provider, smoke, or environment access.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error('Network access is blocked in the Phase 3EL owner review HF2-LX closeout checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = process.cwd();
const startingCommit = 'be7a885';
// Pinned to this closeout's own commit so later phases do not pollute this
// documentation-only phase diff.
const endingCommit = '32cdd87';
const paths = {
  result: 'docs/planning/phase_3el_owner_review_hf2_lx_closeout_result_v0.1.md',
  checker: 'scripts/check_phase_3el_owner_review_hf2_lx_closeout_static_contract.mjs',
  changelog: 'docs/planning/planning_changelog.md',
  package: 'package.json',
};

const read = (relativePath) => {
  try { return readFileSync(join(root, relativePath), 'utf8'); } catch { return ''; }
};
const git = (...args) => {
  try {
    return execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch { return ''; }
};

const source = Object.fromEntries(Object.entries(paths).map(([key, path]) => [key, read(path)]));
const packageJson = JSON.parse(source.package || '{}');
const baselinePackage = JSON.parse(git('show', `${startingCommit}:package.json`) || '{}');
const phaseSection = source.changelog
  .split('## Phase 3EL-OWNER-REVIEW-HF2-LX-CLOSEOUT - 2026-07-01')[1]?.split('\n## ')[0] ?? '';
const phaseChanges = git('diff', '--name-only', startingCommit, endingCommit).split(/\r?\n/).filter(Boolean);
const srcChanges = git('diff', '--name-only', startingCommit, endingCommit, '--', 'src').split(/\r?\n/).filter(Boolean);
const uiChanges = srcChanges.filter((path) =>
  path.startsWith('src/pages/') || path.startsWith('src/components/') || path.startsWith('src/layouts/'));
const apiChanges = srcChanges.filter((path) => path.startsWith('src/pages/api/'));
const providerChanges = srcChanges.filter((path) =>
  path.startsWith('src/lib/server/providers/') || path.startsWith('src/lib/server/marketData/'));
const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif', '.bmp']);
const addedFiles = git('diff', '--name-only', '--diff-filter=A', startingCommit, endingCommit).split(/\r?\n/).filter(Boolean);
const addedImages = addedFiles.filter((path) => imageExtensions.has(extname(path).toLowerCase()));
const dependenciesUnchanged = JSON.stringify(packageJson.dependencies ?? {}) ===
  JSON.stringify(baselinePackage.dependencies ?? {});
const devDependenciesUnchanged = JSON.stringify(packageJson.devDependencies ?? {}) ===
  JSON.stringify(baselinePackage.devDependencies ?? {});
const lockfileUnchanged = !phaseChanges.includes('package-lock.json');

let passed = 0;
let failed = 0;
const failures = [];
const check = (label, condition) => {
  if (condition) {
    passed += 1;
    process.stdout.write(`  [PASS] ${label}\n`);
  } else {
    failed += 1;
    failures.push(label);
    process.stdout.write(`  [FAIL] ${label}\n`);
  }
};

process.stdout.write('=== Phase 3EL-OWNER-REVIEW-HF2-LX-CLOSEOUT Static Contract ===\n\n');

process.stdout.write('Files, command, status, and decision:\n');
check('Closeout result document exists', existsSync(join(root, paths.result)));
check('Static checker exists', existsSync(join(root, paths.checker)));
check('Package checker command exists',
  packageJson.scripts?.['check:phase-3el-owner-review-hf2-lx-closeout'] ===
    'node scripts/check_phase_3el_owner_review_hf2_lx_closeout_static_contract.mjs');
check('Changelog contains Phase 3EL-OWNER-REVIEW-HF2-LX-CLOSEOUT', phaseSection.length > 0);
check('Closeout status records owner review PASS_WITH_COPY_NOTE',
  source.result.includes('Closed — owner review PASS_WITH_COPY_NOTE for Phase 3EL-HF2-LX.'));
check('Closeout decision records PASS_WITH_COPY_NOTE',
  source.result.includes('## 2. Decision\n\n`PASS_WITH_COPY_NOTE`'));
check('Closeout references Phase 3EL-HF2-LX', source.result.includes('Phase 3EL-HF2-LX'));
process.stdout.write('\n');

process.stdout.write('Owner accepted scope:\n');
for (const accepted of [
  'Standalone white selected-stock header card removed.',
  'Selected stock identity moved into the gray chart header.',
  'Right-side duplicate `종목 정보` card removed.',
  '`기업 개요` kept as the first sidebar card.',
  'MK AI moved below `기업 개요` at sidebar width.',
  'Candlestick chart preserved.',
  'Volume band preserved.',
  'Period controls preserved.',
  'Selected-symbol update preserved.',
  'Compact search UX preserved.',
]) {
  check(`Closeout accepts ${accepted}`, source.result.includes(accepted));
}
process.stdout.write('\n');

process.stdout.write('Owner copy note:\n');
check('Closeout records current eyebrow copy', source.result.includes('Current eyebrow: `국내 주식·ETF`'));
check('Closeout records requested eyebrow copy', source.result.includes('Requested eyebrow: `국내/미국 주식·ETF`'));
check('Closeout records copy note reason', source.result.includes('should support Korean and US stocks/ETFs'));
check('Closeout defers copy note to next implementation phase',
  source.result.includes('deferred to the next implementation phase; no runtime change is made in this closeout'));
process.stdout.write('\n');

process.stdout.write('Deferred scope and next phase:\n');
for (const deferred of [
  'KIS chart data', 'KIS quote data', 'US stock/ETF support', 'quote API integration',
  'MK AI intro modal', 'MK AI staged loading', 'MK AI result cards',
  'runtime companyProfile data', 'deployment', 'push',
]) {
  check(`Closeout defers ${deferred}`, source.result.includes(deferred));
}
check('Closeout recommends Phase 3EM',
  source.result.includes('Recommended: Phase 3EM — KIS Quote Integration Roadmap Reset and Local Provider Foundation.'));
check('Closeout records Phase 3EL-HF3 alternative',
  source.result.includes('Alternative: Phase 3EL-HF3 — MK AI Activation Intro and Staged Loading Foundation.'));
process.stdout.write('\n');

process.stdout.write('Closeout safety record:\n');
for (const safety of [
  'No runtime source changes in this closeout.', 'No UI changes in this closeout.',
  'No API route changes.', 'No provider changes.', 'No image files added.',
  'No screenshots committed.', 'No dependency added.', 'No live KIS call.', 'No live FX call.',
  'No Supabase, SQL, or migration work.', 'No Vercel environment or project change.',
  'No deployment.', 'No push.',
]) {
  check(`Closeout records ${safety}`, source.result.includes(safety));
}
process.stdout.write('\n');

process.stdout.write('Changelog and documentation-only boundaries:\n');
check('Changelog records owner review PASS_WITH_COPY_NOTE',
  phaseSection.includes('Closed — owner review PASS_WITH_COPY_NOTE') &&
  phaseSection.includes('PASS_WITH_COPY_NOTE'));
check('Changelog records copy note', phaseSection.includes('국내/미국 주식·ETF'));
check('Changelog records Phase 3EM next', phaseSection.includes('Phase 3EM'));
check('No src runtime file changed in this phase', srcChanges.length === 0);
check('No UI page/layout file changed in this phase', uiChanges.length === 0);
check('No chart-ai.astro change in this phase', !phaseChanges.includes('src/pages/chart-ai.astro'));
check('No API route file changed in this phase', apiChanges.length === 0);
check('No provider file changed in this phase', providerChanges.length === 0);
check('No image file was added', addedImages.length === 0);
check('No dependency was added', dependenciesUnchanged && devDependenciesUnchanged && lockfileUnchanged);
check('Changelog records no deployment', /no deployment/i.test(phaseSection));
check('Changelog records no push', /no push/i.test(phaseSection));
check('Checker blocks network access',
  source.checker.includes('Network access is blocked in the Phase 3EL owner review HF2-LX closeout checker.'));
check('Checker did not attempt network access', fetchAttempted === false);
check('Checker does not read environment files',
  !/readFileSync\s*\([^)]*["'][^"']*\.env/i.test(source.checker));

process.stdout.write(`\nTotal: ${passed + failed} | Passed: ${passed} | Failed: ${failed}\n`);
if (failed > 0) {
  process.stdout.write(`\nFailed checks:\n${failures.map((failure) => `- ${failure}`).join('\n')}\n`);
  process.exit(1);
}
process.stdout.write('All Phase 3EL-OWNER-REVIEW-HF2-LX-CLOSEOUT checks passed.\n');
