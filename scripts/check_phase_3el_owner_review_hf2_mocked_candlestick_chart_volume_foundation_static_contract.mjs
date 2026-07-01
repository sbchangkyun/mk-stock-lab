/**
 * Phase 3EL-OWNER-REVIEW-HF2 documentation/tooling contract.
 * No network, browser, dev server, API, provider, smoke, credential, or environment access.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error('Network access is blocked in the Phase 3EL owner review HF2 checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = process.cwd();
const startingCommit = '472b72e';
const endingCommit = '8f518a2';
const paths = {
  runbook: 'docs/planning/phase_3el_owner_review_hf2_mocked_candlestick_chart_volume_foundation_runbook_v0.1.md',
  template: 'docs/planning/phase_3el_owner_review_hf2_mocked_candlestick_chart_volume_foundation_result_template_v0.1.md',
  checker: 'scripts/check_phase_3el_owner_review_hf2_mocked_candlestick_chart_volume_foundation_static_contract.mjs',
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
  .split('## Phase 3EL-OWNER-REVIEW-HF2 - 2026-07-01')[1]?.split('\n## ')[0] ?? '';
const phaseChanges = git('diff', '--name-only', startingCommit, endingCommit).split(/\r?\n/).filter(Boolean);
const srcChanges = git('diff', '--name-only', startingCommit, endingCommit, '--', 'src').split(/\r?\n/).filter(Boolean);
const uiChanges = srcChanges.filter((path) => path.startsWith('src/pages/') || path.startsWith('src/components/'));
const chartDataChanges = srcChanges.filter((path) =>
  path.startsWith('src/lib/chart-ai/') || path.startsWith('src/data/chart-ai/'));
const apiChanges = srcChanges.filter((path) => path.startsWith('src/pages/api/'));
const providerChanges = srcChanges.filter((path) =>
  path.startsWith('src/lib/server/providers/') || path.startsWith('src/lib/server/marketData/'));
const addedFiles = git('diff', '--name-only', '--diff-filter=A', startingCommit, endingCommit).split(/\r?\n/).filter(Boolean);
const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif', '.bmp']);
const addedImages = addedFiles.filter((path) => imageExtensions.has(extname(path).toLowerCase()));
const dependenciesUnchanged = JSON.stringify(packageJson.dependencies ?? {}) ===
  JSON.stringify(baselinePackage.dependencies ?? {});
const devDependenciesUnchanged = JSON.stringify(packageJson.devDependencies ?? {}) ===
  JSON.stringify(baselinePackage.devDependencies ?? {});

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

process.stdout.write('=== Phase 3EL-OWNER-REVIEW-HF2 Static Contract ===\n\n');

process.stdout.write('Files, command, and changelog:\n');
for (const [name, relativePath] of Object.entries(paths)) {
  check(`${name} file exists`, existsSync(join(root, relativePath)));
}
check('Package checker command exists',
  packageJson.scripts?.['check:phase-3el-owner-review-hf2-mocked-candlestick-chart-volume-foundation'] ===
    'node scripts/check_phase_3el_owner_review_hf2_mocked_candlestick_chart_volume_foundation_static_contract.mjs');
check('Changelog contains Phase 3EL-OWNER-REVIEW-HF2', phaseSection.length > 0);
process.stdout.write('\n');

process.stdout.write('Runbook contract:\n');
check('Runbook references Phase 3EL-HF2', source.runbook.includes('Phase 3EL-HF2'));
check('Runbook includes local setup command',
  source.runbook.includes('npm run dev -- --host 127.0.0.1 --port 4321'));
check('Runbook includes local review URL', source.runbook.includes('http://127.0.0.1:4321/chart-ai'));
check('Runbook states no production review is required',
  source.runbook.includes('No production review is required in this phase.'));
for (const limit of ['real quotes', 'real historical prices', 'KIS data', 'AI analysis quality']) {
  check(`Runbook excludes validation of ${limit}`, source.runbook.includes(limit));
}
check('Runbook includes safety rules', source.runbook.includes('## 2. Safety Rules'));
for (const item of [
  'API responses', 'request/response bodies', 'browser storage', 'cookies', 'secrets',
  'real prices', 'P&L', 'account numbers', 'provider payloads',
]) {
  check(`Runbook safety excludes ${item}`, source.runbook.includes(item));
}
check('Runbook says screenshots are not required', source.runbook.includes('No screenshots are required.'));
for (const heading of [
  'Page Load and Preserved Layout', 'Chart First Impression', 'Candlestick Readability',
  'Volume Readability', 'Period Controls', 'Selected-Symbol Chart Update',
  'Sample and Safety Labels', 'Light/Dark Theme', 'Mobile Layout',
  'Accessibility Quick Check', 'Forbidden Wording',
]) {
  check(`Runbook includes ${heading}`, source.runbook.includes(`### ${heading}`));
}
for (const period of ['1일', '1주', '1개월', '3개월', '1년']) {
  check(`Runbook includes period ${period}`, source.runbook.includes(period));
}
for (const query of ['005930', '삼성', '000660', '하이닉스', '069500', 'KODEX']) {
  check(`Runbook includes query ${query}`, source.runbook.includes(query));
}
for (const label of ['샘플 차트', '샘플 OHLC·거래량 데이터', '실제 시세 아님']) {
  check(`Runbook includes sample label ${label}`, source.runbook.includes(label));
}
check('Runbook includes mobile 390px review', source.runbook.includes('390px'));
check('Runbook routes PASS to closeout',
  source.runbook.includes('PASS → Phase 3EL-OWNER-REVIEW-HF2-CLOSEOUT'));
for (const route of [
  'FAIL_CHART_VISUAL_QUALITY → Phase 3EL-HF2-CX',
  'FAIL_CANDLE_READABILITY → Phase 3EL-HF2-CR',
  'FAIL_VOLUME_READABILITY → Phase 3EL-HF2-VX',
  'FAIL_PERIOD_INTERACTION → Phase 3EL-HF2-PX',
  'FAIL_SYMBOL_CHART_UPDATE → Phase 3EL-HF2-SYMBOL',
  'FAIL_MOBILE_CHART_LAYOUT → Phase 3EL-HF2-MX',
  'FAIL_THEME_ALIGNMENT → Phase 3EL-HF2-THEME',
  'FAIL_SEARCH_REGRESSION → Phase 3EL-HF2-SEARCH',
  'FAIL_SAFETY_COPY → Phase 3EL-HF2-SAFE',
  'INCONCLUSIVE → clarify owner notes before next implementation',
]) {
  check(`Runbook includes route ${route.split(' → ')[0]}`, source.runbook.includes(route));
}
process.stdout.write('\n');

process.stdout.write('Owner result template contract:\n');
for (const heading of [
  'Review Environment', 'Page Load and Preserved Layout', 'Chart First Impression',
  'Candlestick Readability', 'Volume Readability', 'Period Controls',
  'Selected-Symbol Chart Update', 'Sample and Safety Labels', 'Light/Dark Theme',
  'Mobile / Layout', 'Accessibility Quick Check', 'Forbidden Wording', 'Safety',
  'Final Decision', 'Notes',
]) {
  check(`Template includes ${heading}`, source.template.includes(heading));
}
for (const decision of [
  'PASS', 'FAIL_CHART_VISUAL_QUALITY', 'FAIL_CANDLE_READABILITY', 'FAIL_VOLUME_READABILITY',
  'FAIL_PERIOD_INTERACTION', 'FAIL_SYMBOL_CHART_UPDATE', 'FAIL_MOBILE_CHART_LAYOUT',
  'FAIL_THEME_ALIGNMENT', 'FAIL_SEARCH_REGRESSION', 'FAIL_SAFETY_COPY', 'INCONCLUSIVE',
]) {
  check(`Template includes decision ${decision}`, source.template.includes(`- ${decision}`));
}
check('Template requests short notes only',
  source.template.includes('Only include short visual notes for failed or inconclusive items.'));
process.stdout.write('\n');

process.stdout.write('Documentation-only and safety boundaries:\n');
check('No src runtime file changed in this phase', srcChanges.length === 0);
check('No UI page file changed in this phase', uiChanges.length === 0);
check('No chart data/helper file changed in this phase', chartDataChanges.length === 0);
check('No API route file changed in this phase', apiChanges.length === 0);
check('No provider file changed in this phase', providerChanges.length === 0);
check('No image file was added', addedImages.length === 0);
check('No production dependency was added', dependenciesUnchanged);
check('No development dependency was added', devDependenciesUnchanged);
check('Lockfile unchanged', !phaseChanges.includes('package-lock.json'));
check('Changelog records no deployment', phaseSection.includes('no deployment'));
check('Changelog records no push', phaseSection.includes('no push'));
check('Checker blocks network access',
  source.checker.includes('Network access is blocked in the Phase 3EL owner review HF2 checker.') && !fetchAttempted);
check('Checker does not read environment files',
  !/readFileSync\([^\n]*(?:\.env|environment)/i.test(source.checker));

const allowedChanges = new Set(Object.values(paths));
allowedChanges.add('scripts/check_phase_3el_hf2_mocked_candlestick_chart_volume_foundation_contract.mjs');
check('Phase changes stay within documentation/tooling scope',
  phaseChanges.every((path) => allowedChanges.has(path)));
process.stdout.write('\n');

process.stdout.write(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}\n`);
if (failed > 0) {
  process.stdout.write(`Failures:\n- ${failures.join('\n- ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('All Phase 3EL-OWNER-REVIEW-HF2 checks passed.\n');
}
