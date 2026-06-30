/**
 * Phase 3EL-OWNER-REVIEW-HF1 documentation/tooling contract.
 * Static only: no network, browser, dev server, API, provider, smoke, or environment access.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error('Network access is blocked in the Phase 3EL owner review HF1 checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = process.cwd();
const startingCommit = '41b0af4';
const paths = {
  runbook: 'docs/planning/phase_3el_owner_review_hf1_chart_ai_stock_lookup_layout_runbook_v0.1.md',
  template: 'docs/planning/phase_3el_owner_review_hf1_chart_ai_stock_lookup_layout_result_template_v0.1.md',
  checker: 'scripts/check_phase_3el_owner_review_hf1_chart_ai_stock_lookup_layout_static_contract.mjs',
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
  .split('## Phase 3EL-OWNER-REVIEW-HF1 - 2026-06-30')[1]?.split('\n## ')[0] ?? '';
const phaseChanges = git('diff', '--name-only', startingCommit).split(/\r?\n/).filter(Boolean);
const srcChanges = git('diff', '--name-only', startingCommit, '--', 'src').split(/\r?\n/).filter(Boolean);
const uiChanges = srcChanges.filter((path) =>
  path.startsWith('src/pages/') || path.startsWith('src/components/') || path.startsWith('src/layouts/'));
const apiChanges = srcChanges.filter((path) => path.startsWith('src/pages/api/'));
const providerChanges = srcChanges.filter((path) =>
  path.startsWith('src/lib/server/providers/') || path.startsWith('src/lib/server/marketData/'));
const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif', '.bmp']);
const addedFiles = git('diff', '--name-only', '--diff-filter=A', startingCommit).split(/\r?\n/).filter(Boolean);
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

process.stdout.write('=== Phase 3EL-OWNER-REVIEW-HF1 Static Contract ===\n\n');

process.stdout.write('Files, package command, and changelog:\n');
check('Runbook exists', existsSync(join(root, paths.runbook)));
check('Result template exists', existsSync(join(root, paths.template)));
check('Static checker exists', existsSync(join(root, paths.checker)));
check('Package checker command exists',
  packageJson.scripts?.['check:phase-3el-owner-review-hf1-chart-ai-stock-lookup-layout'] ===
    'node scripts/check_phase_3el_owner_review_hf1_chart_ai_stock_lookup_layout_static_contract.mjs');
check('Changelog contains Phase 3EL-OWNER-REVIEW-HF1', phaseSection.length > 0);
process.stdout.write('\n');

process.stdout.write('Owner runbook contract:\n');
check('Runbook references Phase 3EL-HF1', source.runbook.includes('Phase 3EL-HF1'));
check('Runbook includes local setup command',
  source.runbook.includes('npm run dev -- --host 127.0.0.1 --port 4321'));
check('Runbook includes local review URL',
  source.runbook.includes('http://127.0.0.1:4321/chart-ai'));
check('Runbook states no production review is required',
  source.runbook.includes('No production review is required'));
check('Runbook excludes real data and analysis validation',
  ['real quotes', 'real candlestick data', 'KIS data', 'AI analysis quality']
    .every((value) => source.runbook.includes(value)));
check('Runbook includes safety rules',
  source.runbook.includes('## 2. Safety Rules') &&
  ['API responses', 'browser storage', 'cookies', 'secrets', 'provider payloads']
    .every((value) => source.runbook.includes(value)));
check('Runbook says screenshots are not required', source.runbook.includes('No screenshots are required'));
check('Runbook includes page identity review', source.runbook.includes('### Page identity'));
check('Runbook includes search UX review', source.runbook.includes('### Search UX'));
for (const query of ['005930', '삼성', '000660', '하이닉스', '069500', 'KODEX']) {
  check(`Runbook includes query ${query}`, source.runbook.includes(`\`${query}\``));
}
check('Runbook includes no-match query', source.runbook.includes('ZZZ없는종목999'));
check('Runbook includes filter review',
  source.runbook.includes('### Filters') && ['전체', '주식', 'ETF'].every((value) => source.runbook.includes(`\`${value}\``)));
check('Runbook includes stock header review', source.runbook.includes('### Stock header'));
check('Runbook includes chart shell review', source.runbook.includes('### Chart shell'));
check('Runbook includes all period controls',
  ['1일', '1주', '1개월', '3개월', '1년'].every((value) => source.runbook.includes(`\`${value}\``)));
check('Runbook includes MK AI CTA review', source.runbook.includes('### MK AI CTA'));
check('Runbook includes default-hidden AI analysis review',
  source.runbook.includes('### Forbidden default AI analysis labels') &&
  source.runbook.includes('No AI analysis cards are visible by default'));
check('Runbook includes company/profile placeholder review',
  source.runbook.includes('### Company/profile placeholder'));
check('Runbook includes mobile 390px review',
  source.runbook.includes('### Mobile layout') && source.runbook.includes('390px'));
check('Runbook includes accessibility quick check', source.runbook.includes('### Accessibility quick check'));
check('Runbook includes forbidden wording review',
  source.runbook.includes('### Forbidden wording') &&
  ['실시간', 'live', 'real-time', 'actual market value'].every((value) => source.runbook.includes(value)));
check('Runbook routes PASS to Phase 3EL-HF2',
  source.runbook.includes('PASS → Phase 3EL-HF2 — Mocked Candlestick Chart and Volume Foundation'));
for (const route of [
  'FAIL_LAYOUT_DIRECTION → Phase 3EL-HF1-Retry',
  'FAIL_SEARCH_UX → Phase 3EL-HF1-SX',
  'FAIL_CHART_SHELL → Phase 3EL-HF1-CX',
  'FAIL_MK_AI_PLACEMENT → Phase 3EL-HF1-AX',
  'FAIL_MOBILE_LAYOUT → Phase 3EL-HF1-MX',
  'FAIL_SAFETY_COPY → Phase 3EL-HF1-SAFE',
  'INCONCLUSIVE → clarify owner notes before next implementation',
]) {
  check(`Runbook includes route ${route.split(' → ')[0]}`, source.runbook.includes(route));
}
process.stdout.write('\n');

process.stdout.write('Owner result template contract:\n');
for (const section of [
  'Review Environment', 'Page Identity', 'Search UX', 'Filters', 'Stock Header', 'Chart Shell',
  'MK AI CTA', 'Forbidden Default AI Analysis Labels', 'Company/Profile Placeholder',
  'Mobile / Layout', 'Accessibility Quick Check', 'Forbidden Wording', 'Safety', 'Final Decision',
]) {
  check(`Template includes ${section}`, source.template.includes(section));
}
for (const decision of [
  'PASS', 'FAIL_LAYOUT_DIRECTION', 'FAIL_SEARCH_UX', 'FAIL_CHART_SHELL',
  'FAIL_MK_AI_PLACEMENT', 'FAIL_MOBILE_LAYOUT', 'FAIL_SAFETY_COPY', 'INCONCLUSIVE',
]) {
  check(`Template includes ${decision}`, source.template.includes(`- ${decision}`));
}
process.stdout.write('\n');

process.stdout.write('Documentation-only and safety boundaries:\n');
check('No src runtime file changed in this phase', srcChanges.length === 0);
check('No UI page file changed in this phase', uiChanges.length === 0);
check('No API route file changed in this phase', apiChanges.length === 0);
check('No provider file changed in this phase', providerChanges.length === 0);
check('No image file was added', addedImages.length === 0);
check('No dependency was added', dependenciesUnchanged && devDependenciesUnchanged && lockfileUnchanged);
check('Changelog records no deployment', /no deployment/i.test(phaseSection));
check('Changelog records no push', /no push/i.test(phaseSection));
check('Checker blocks network access',
  source.checker.includes('Network access is blocked in the Phase 3EL owner review HF1 checker.'));
check('Checker did not attempt network access', fetchAttempted === false);
check('Checker does not read environment files',
  !/readFileSync\s*\([^)]*["'][^"']*\.env/i.test(source.checker));

process.stdout.write(`\nTotal: ${passed + failed} | Passed: ${passed} | Failed: ${failed}\n`);
if (failed > 0) {
  process.stdout.write(`\nFailed checks:\n${failures.map((failure) => `- ${failure}`).join('\n')}\n`);
  process.exit(1);
}

process.stdout.write('All Phase 3EL-OWNER-REVIEW-HF1 checks passed.\n');
