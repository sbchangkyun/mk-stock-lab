/**
 * Phase 3EL-OWNER-REVIEW documentation/tooling contract.
 * Static only: no network, browser, dev server, API, provider, smoke, or environment access.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error('Network access is blocked in the Phase 3EL owner review checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const startingCommit = '461cfe1';
const paths = {
  runbook: 'docs/planning/phase_3el_owner_review_chart_ai_domestic_symbol_search_runbook_v0.1.md',
  template: 'docs/planning/phase_3el_owner_review_chart_ai_domestic_symbol_search_result_template_v0.1.md',
  checker: 'scripts/check_phase_3el_owner_review_chart_ai_domestic_symbol_search_static_contract.mjs',
  changelog: 'docs/planning/planning_changelog.md',
  package: 'package.json',
};

const read = (relativePath) => {
  try {
    return readFileSync(join(root, relativePath), 'utf8');
  } catch {
    return '';
  }
};

const git = (...args) => {
  try {
    return execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
};

const source = Object.fromEntries(Object.entries(paths).map(([key, path]) => [key, read(path)]));
const packageJson = JSON.parse(source.package || '{}');
const baselinePackage = JSON.parse(git('show', `${startingCommit}:package.json`) || '{}');
const phaseSection = source.changelog
  .split('## Phase 3EL-OWNER-REVIEW - 2026-06-30')[1]?.split('\n## ')[0] ?? '';
const srcChanges = git('diff', '--name-only', startingCommit, '--', 'src')
  .split(/\r?\n/).filter(Boolean);
const apiChanges = srcChanges.filter((path) => path.startsWith('src/pages/api/'));
const uiChanges = srcChanges.filter((path) =>
  path.startsWith('src/pages/') || path.startsWith('src/components/') || path.startsWith('src/layouts/'));
const providerChanges = srcChanges.filter((path) =>
  path.startsWith('src/lib/server/providers/') || path.startsWith('src/lib/server/marketData/'));
const dependenciesUnchanged = JSON.stringify(packageJson.dependencies ?? {}) ===
  JSON.stringify(baselinePackage.dependencies ?? {});
const devDependenciesUnchanged = JSON.stringify(packageJson.devDependencies ?? {}) ===
  JSON.stringify(baselinePackage.devDependencies ?? {});
const lockfileUnchanged = !git('diff', '--name-only', startingCommit).split(/\r?\n/)
  .includes('package-lock.json');

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

process.stdout.write('=== Phase 3EL-OWNER-REVIEW Static Contract ===\n\n');

process.stdout.write('Files, command, and phase status:\n');
for (const [name, relativePath] of Object.entries(paths)) {
  check(`${name} file exists`, existsSync(join(root, relativePath)));
}
check('Package checker command exists',
  packageJson.scripts?.['check:phase-3el-owner-review-chart-ai-domestic-symbol-search'] ===
    'node scripts/check_phase_3el_owner_review_chart_ai_domestic_symbol_search_static_contract.mjs');
check('Changelog contains Phase 3EL-OWNER-REVIEW', phaseSection.length > 0);
check('Changelog records prepared status and no runtime changes',
  phaseSection.includes('Prepared — owner visual review pending') &&
  phaseSection.includes('No runtime source changes'));
process.stdout.write('\n');

process.stdout.write('Owner runbook contract:\n');
check('Runbook references Phase 3EL', source.runbook.includes('Phase 3EL'));
check('Runbook includes local setup command',
  source.runbook.includes('npm run dev -- --host 127.0.0.1 --port 4321'));
check('Runbook includes local review URL',
  source.runbook.includes('http://127.0.0.1:4321/chart-ai'));
check('Runbook states no production review is required',
  source.runbook.includes('No production review is required'));
check('Runbook states no live quotes or live AI analysis are validated',
  source.runbook.includes('does not validate live quotes, live AI analysis'));
check('Runbook includes safety rules',
  source.runbook.includes('## 2. Safety Rules') && source.runbook.includes('Browser storage or cookies'));
check('Runbook says screenshots are not required', source.runbook.includes('No screenshots are required'));
for (const label of [
  '국내 종목 검색', '국내 주식·ETF', '샘플 종목 데이터',
  '검색 결과', '선택 종목', '실제 시세 아님',
]) {
  check(`Runbook includes required label ${label}`, source.runbook.includes(label));
}
for (const query of ['005930', '삼성', '000660', '하이닉스', '069500', 'KODEX']) {
  check(`Runbook includes query ${query}`, source.runbook.includes(`\`${query}\``));
}
check('Runbook includes filter review',
  source.runbook.includes('### Filters') && ['전체', '주식', 'ETF'].every((value) => source.runbook.includes(`\`${value}\``)));
check('Runbook includes selection review',
  source.runbook.includes('### Selection') && source.runbook.includes('symbol, Korean name, asset type, exchange, and currency'));
check('Runbook includes empty-state review',
  source.runbook.includes('### Empty State') && source.runbook.includes('ZZZ없는종목999'));
check('Runbook includes keyboard/accessibility review',
  source.runbook.includes('### Keyboard and Accessibility') && source.runbook.includes('Arrow Down'));
check('Runbook includes mobile 390px review',
  source.runbook.includes('### Mobile Visual Check') && source.runbook.includes('390px'));
for (const wording of ['실시간', '실시간 시세', '현재 시세', 'live', 'real-time', 'actual market value']) {
  check(`Runbook includes forbidden wording review for ${wording}`, source.runbook.includes(wording));
}
check('Runbook includes all failure routes',
  ['Phase 3EL-OWNER-REVIEW-CLOSEOUT', 'Phase 3EL-HF1', 'Phase 3EL-HF2', 'Phase 3EL-HF3', 'Phase 3EL-HF4']
    .every((value) => source.runbook.includes(value)));
check('Runbook defines owner output format',
  source.runbook.includes('## 6. Owner Output Format') && source.runbook.includes('filled result template'));
process.stdout.write('\n');

process.stdout.write('Owner result template contract:\n');
for (const section of [
  'Review Environment', 'Page Load', 'Required Labels', 'Search Queries', 'Filters',
  'Selection Behavior', 'Empty State', 'Keyboard / Accessibility', 'Mobile / Layout',
  'Forbidden Wording', 'Safety', 'Final Decision', 'Notes',
]) {
  check(`Template includes ${section} section`, source.template.includes(section));
}
for (const decision of [
  'PASS', 'FAIL_SEARCH', 'FAIL_FILTER_SELECTION', 'FAIL_MOBILE_LAYOUT',
  'FAIL_SAFETY_WORDING', 'INCONCLUSIVE',
]) {
  check(`Template includes ${decision}`, source.template.includes(`- ${decision}`));
}
for (const label of [
  '국내 종목 검색', '국내 주식·ETF', '샘플 종목 데이터',
  '검색 결과', '선택 종목', '실제 시세 아님',
]) {
  check(`Template includes required label ${label}`, source.template.includes(label));
}
for (const query of ['005930', '삼성', '000660', '하이닉스', '069500', 'KODEX']) {
  check(`Template includes query ${query}`, source.template.includes(`\`${query}\``));
}
check('Template includes mobile 390px field', source.template.includes('Mobile 390px or similar reviewed'));
check('Template limits notes to failed or inconclusive items',
  source.template.includes('Only include short visual notes for failed or inconclusive items'));
process.stdout.write('\n');

process.stdout.write('Documentation-only and safety boundaries:\n');
check('No src runtime file changed in this phase', srcChanges.length === 0);
check('No UI page file changed in this phase', uiChanges.length === 0);
check('No API route file changed in this phase', apiChanges.length === 0);
check('No provider file changed in this phase', providerChanges.length === 0);
check('No dependency was added', dependenciesUnchanged && devDependenciesUnchanged && lockfileUnchanged);
check('Changelog records no deployment', /no deployment/i.test(phaseSection));
check('Changelog records no push', /no push/i.test(phaseSection));
check('Changelog records no dev server or browser launched by Codex',
  phaseSection.includes('no dev server or browser launched by Codex'));
check('Checker blocks network access',
  source.checker.includes('Network access is blocked in the Phase 3EL owner review checker.'));
check('Checker did not attempt network access', fetchAttempted === false);
check('Checker does not read .env files',
  !/readFileSync\s*\([^)]*["'][^"']*\.env/i.test(source.checker));

process.stdout.write(`\nTotal: ${passed + failed} | Passed: ${passed} | Failed: ${failed}\n`);
if (failed > 0) {
  process.stdout.write(`\nFailed checks:\n${failures.map((failure) => `- ${failure}`).join('\n')}\n`);
  process.exit(1);
}
process.stdout.write('All Phase 3EL-OWNER-REVIEW checks passed.\n');
