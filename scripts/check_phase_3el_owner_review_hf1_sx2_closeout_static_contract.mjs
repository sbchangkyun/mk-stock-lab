/**
 * Phase 3EL-OWNER-REVIEW-HF1-SX2-CLOSEOUT documentation/tooling contract.
 * Static only: no network, browser, dev server, API, provider, smoke, or environment access.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error('Network access is blocked in the Phase 3EL owner review HF1-SX2 closeout checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = process.cwd();
const startingCommit = '09c4e75';
const endingCommit = 'c1e8821';
const paths = {
  result: 'docs/planning/phase_3el_owner_review_hf1_sx2_compact_search_panel_closeout_result_v0.1.md',
  checker: 'scripts/check_phase_3el_owner_review_hf1_sx2_closeout_static_contract.mjs',
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
  .split('## Phase 3EL-OWNER-REVIEW-HF1-SX2-CLOSEOUT - 2026-07-01')[1]?.split('\n## ')[0] ?? '';
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

process.stdout.write('=== Phase 3EL-OWNER-REVIEW-HF1-SX2-CLOSEOUT Static Contract ===\n\n');

process.stdout.write('Files, command, status, and decision:\n');
check('Closeout result document exists', existsSync(join(root, paths.result)));
check('Static checker exists', existsSync(join(root, paths.checker)));
check('Package checker command exists',
  packageJson.scripts?.['check:phase-3el-owner-review-hf1-sx2-closeout'] ===
    'node scripts/check_phase_3el_owner_review_hf1_sx2_closeout_static_contract.mjs');
check('Changelog contains Phase 3EL-OWNER-REVIEW-HF1-SX2-CLOSEOUT', phaseSection.length > 0);
check('Closeout status records owner review PASS',
  source.result.includes('Closed — owner review PASS for compact search panel hotfix.'));
check('Closeout decision records PASS', source.result.includes('## 2. Decision\n\n`PASS`'));
check('Closeout records accepted current scope',
  source.result.includes('Phase 3EL-HF1-SX2 is accepted for the current Chart AI search-panel scope.'));
process.stdout.write('\n');

process.stdout.write('Background and owner-review evidence:\n');
for (const phase of [
  'Phase 3EL-HF1', 'Phase 3EL-HF1-SX', 'Phase 3EL-OWNER-REVIEW-HF1-SX', 'Phase 3EL-HF1-SX2',
]) {
  check(`Closeout references ${phase}`, source.result.includes(phase));
}
check('Closeout records manual local Chart AI review',
  source.result.includes('manually reviewed the local `/chart-ai` UI'));
check('Closeout records owner statement', source.result.includes('검수 결과: 통과'));
check('Closeout records screenshots are not committed',
  source.result.includes('Screenshots may have been shared in chat but are not committed'));
check('Closeout records sanitized feedback only',
  source.result.includes('sanitized owner feedback and the final decision only'));
check('Closeout excludes API response and request body evidence',
  source.result.includes('No raw API response, request/response body'));
check('Closeout excludes browser storage and cookies',
  source.result.includes('cookies, browser storage'));
check('Closeout excludes secrets', source.result.includes('secrets'));
check('Closeout excludes prices, P&L, and account data',
  source.result.includes('prices, P&L, account data'));
process.stdout.write('\n');

process.stdout.write('Accepted SX2 scope:\n');
for (const accepted of [
  'compact `540px` desktop search panel',
  'visible search card/background reduced together with the input group',
  'example query text removed',
  'dropdown width aligned to the compact panel',
  'dropdown attached directly below the search control',
  'filters moved into the result header',
  'filters hidden when the dropdown is inactive',
  'compact one-line result rows',
  'vertical one-result-per-row list preserved',
  'idle / typing / no-match / selection states preserved',
  'required six-query behavior preserved',
  'chart theme alignment preserved',
]) {
  check(`Closeout accepts ${accepted}`, source.result.includes(accepted));
}
process.stdout.write('\n');

process.stdout.write('Deferred scope and next phase:\n');
for (const deferred of [
  'mocked OHLC candlestick data', 'volume data foundation', 'MK AI intro modal',
  'MK AI staged loading', 'MK AI sequential result cards', 'runtime companyProfile data',
  'KIS chart/profile integration', 'quote API integration', 'deployment', 'push',
]) {
  check(`Closeout defers ${deferred}`, source.result.includes(deferred));
}
check('Closeout recommends Phase 3EL-HF2',
  source.result.includes('Recommended: Phase 3EL-HF2 — Mocked Candlestick Chart and Volume Foundation.'));
check('Closeout recommends no alternative before HF2',
  source.result.includes('None recommended before Phase 3EL-HF2 unless the owner requests further visual refinement.'));
process.stdout.write('\n');

process.stdout.write('Closeout safety record:\n');
for (const safety of [
  'No runtime changes in this closeout', 'No UI changes in this closeout',
  'No API route changes', 'No provider changes', 'No image file added',
  'No screenshots committed', 'No dev server launched by Codex', 'No browser automation',
  'No active owner smoke', 'No live KIS call', 'No live FX call', 'No quote API call',
  'No production API call', 'No Supabase, SQL, or migration work',
  'No Vercel environment or project change', 'No dependency added', 'No deployment', 'No push',
]) {
  check(`Closeout records ${safety}`, source.result.includes(safety));
}
process.stdout.write('\n');

process.stdout.write('Preserved policy record:\n');
check('Closeout keeps public source=live disabled',
  source.result.includes('Public `source=live` remains disabled'));
check('Closeout keeps source=auto deferred', source.result.includes('`source=auto` remains deferred'));
check('Closeout keeps public production fixture/default',
  source.result.includes('Public production remains fixture/default'));
check('Closeout records no live/provider integration',
  source.result.includes('No quote, API, provider, or live integration is added'));
check('Closeout records no account/trading APIs',
  source.result.includes('No account or trading APIs are added'));
process.stdout.write('\n');

process.stdout.write('Changelog and documentation-only boundaries:\n');
check('Changelog records owner review PASS',
  phaseSection.includes('Closed — owner review PASS') && phaseSection.includes('**Decision**: `PASS`'));
check('Changelog records Phase 3EL-HF2 next', phaseSection.includes('Phase 3EL-HF2'));
check('No src runtime file changed in this phase', srcChanges.length === 0);
check('No UI page file changed in this phase', uiChanges.length === 0);
check('No API route file changed in this phase', apiChanges.length === 0);
check('No provider file changed in this phase', providerChanges.length === 0);
check('No image file was added', addedImages.length === 0);
check('No dependency was added', dependenciesUnchanged && devDependenciesUnchanged && lockfileUnchanged);
check('Changelog records no deployment', /no deployment/i.test(phaseSection));
check('Changelog records no push', /no push/i.test(phaseSection));
check('Checker blocks network access',
  source.checker.includes('Network access is blocked in the Phase 3EL owner review HF1-SX2 closeout checker.'));
check('Checker did not attempt network access', fetchAttempted === false);
check('Checker does not read environment files',
  !/readFileSync\s*\([^)]*["'][^"']*\.env/i.test(source.checker));

process.stdout.write(`\nTotal: ${passed + failed} | Passed: ${passed} | Failed: ${failed}\n`);
if (failed > 0) {
  process.stdout.write(`\nFailed checks:\n${failures.map((failure) => `- ${failure}`).join('\n')}\n`);
  process.exit(1);
}
process.stdout.write('All Phase 3EL-OWNER-REVIEW-HF1-SX2-CLOSEOUT checks passed.\n');
