/**
 * Phase 3EG owner local mixed-currency preview UI review static contract.
 * Documentation-only: no dev server, browser, API, smoke, provider, or environment access.
 */

globalThis.fetch = async () => {
  throw new Error('Network access is blocked in the Phase 3EG owner review checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const paths = {
  runbook: 'docs/planning/phase_3eg_owner_local_mixed_currency_preview_ui_review_runbook_v0.1.md',
  template: 'docs/planning/phase_3eg_owner_local_mixed_currency_preview_ui_review_result_template_v0.1.md',
  checker: 'scripts/check_phase_3eg_owner_local_mixed_currency_preview_ui_review_static_contract.mjs',
  changelog: 'docs/planning/planning_changelog.md',
  package: 'package.json',
  ui: 'src/pages/portfolio.astro',
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
    return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
};

const source = Object.fromEntries(Object.entries(paths).map(([key, path]) => [key, read(path)]));
const packageJson = JSON.parse(source.package || '{}');
const baselinePackage = JSON.parse(git('show', '5e8a080:package.json') || '{}');
const runtimeChanges = git('diff', '--name-only', '5e8a080', '--', 'src').split(/\r?\n/).filter(Boolean);
const phaseSection = source.changelog.split('## Phase 3EG - 2026-06-28')[1]?.split('\n## ')[0] ?? '';
const dependenciesUnchanged = JSON.stringify(packageJson.dependencies) === JSON.stringify(baselinePackage.dependencies);
const devDependenciesUnchanged = JSON.stringify(packageJson.devDependencies ?? {}) === JSON.stringify(baselinePackage.devDependencies ?? {});

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

process.stdout.write('=== Phase 3EG Owner Local Mixed-Currency Preview UI Review Static Contract ===\n\n');

check('1. Runbook exists', existsSync(join(root, paths.runbook)));
check('2. Result template exists', existsSync(join(root, paths.template)));
check('3. Static checker exists', existsSync(join(root, paths.checker)));
check('4. Package checker command exists',
  packageJson.scripts?.['check:phase-3eg-owner-mixed-currency-ui-review'] ===
    'node scripts/check_phase_3eg_owner_local_mixed_currency_preview_ui_review_static_contract.mjs');
check('5. Changelog contains Phase 3EG', phaseSection.length > 0);
check('6. Runbook identifies visual-only review', /review is visual only/i.test(source.runbook));
check('7. Runbook says no screenshots are required', /No screenshots are required/i.test(source.runbook));
check('8. Runbook forbids raw API responses', /should not share raw API responses/i.test(source.runbook));
check('9. Runbook forbids request and response bodies',
  source.runbook.includes('request bodies') && source.runbook.includes('response bodies'));
check('10. Runbook forbids prices, totals, and P&L',
  source.runbook.includes('prices, totals, P&L values'));
check('11. Runbook forbids secrets and environment values',
  source.runbook.includes('secrets, environment values'));
check('12. Runbook includes the local dev command',
  source.runbook.includes('npm run dev -- --host 127.0.0.1 --port 4321'));
check('13. Runbook includes the fixture URL', source.runbook.includes('http://127.0.0.1:4321/portfolio'));
check('14. Runbook includes the KR-only owner preview URL',
  source.runbook.includes('http://127.0.0.1:4321/portfolio?previewMode=owner'));
check('15. Runbook includes the mixed mocked-FX owner preview URL',
  source.runbook.includes('http://127.0.0.1:4321/portfolio?previewMode=owner&fxPreview=mocked'));
check('16. Runbook includes the production blocked URL',
  source.runbook.includes('https://mkstocklab.vercel.app/portfolio?previewMode=owner&fxPreview=mocked'));
check('17. Runbook includes the mobile 390px check', source.runbook.includes('390px'));
check('18. Runbook includes the owner-preview notice check', /Owner-preview notice is visible/i.test(source.runbook));
check('19. Runbook includes 오너 미리보기', source.runbook.includes('오너 미리보기'));
check('20. Runbook includes Mocked FX', source.runbook.includes('Mocked FX'));
check('21. Runbook includes 샘플 환율', source.runbook.includes('샘플 환율'));
check('22. Runbook includes 실제 시세 아님', source.runbook.includes('실제 시세 아님'));
check('23. Runbook requires unavailable rows to remain visible', /Unavailable rows remain visible/i.test(source.runbook));
check('24. Runbook requires aggregate values not to be fabricated', /are not fabricated/i.test(source.runbook));
check('25. Runbook forbids real-time, current, and live-FX wording',
  ['실시간', '현재 시세', 'real-time', 'live FX'].every((marker) => source.runbook.includes(marker)) &&
    /No forbidden real-time\/current\/live-FX wording appears/i.test(source.runbook));
check('26. Runbook defines PASS criteria', source.runbook.includes('## 5. PASS Criteria'));
check('27. Runbook defines FAIL routing',
  source.runbook.includes('## 6. FAIL Routing') &&
    ['Phase 3EF-HF1', 'Phase 3EF-HF2', 'Phase 3EF-HF3', 'Phase 3EH'].every((phase) => source.runbook.includes(phase)));
check('28. Result template has fixture section', source.template.includes('## 2. Fixture Default Review'));
check('29. Result template has KR-only owner preview section', source.template.includes('## 3. KR-Only Owner Preview Review'));
check('30. Result template has mixed mocked-FX section', source.template.includes('## 4. Mixed Mocked-FX Owner Preview Review'));
check('31. Result template has mobile 390px section', source.template.includes('## 5. Mobile 390px Review'));
check('32. Result template has production block section', source.template.includes('## 6. Production Block Review'));
check('33. Result template has final decision field',
  source.template.includes('## 7. Final Decision') && source.template.includes('PASS / FAIL'));
check('34. Result template has safe failure codes',
  ['VISUAL_ISSUE', 'ACTIVATION_GATE_ISSUE', 'DATA_CONTRACT_ISSUE', 'MOBILE_LAYOUT_ISSUE', 'PRODUCTION_BLOCK_ISSUE', 'UNKNOWN']
    .every((code) => source.template.includes(code)));
check('35. Result template has safety confirmation',
  source.template.includes('## 8. Safety Confirmation') &&
    source.template.includes('No raw API response shared') &&
    source.template.includes('No prices/totals/P&L shared'));
check('36. No runtime source file changed', runtimeChanges.length === 0);
check('37. Portfolio UI file did not change', !runtimeChanges.includes(paths.ui));
check('38. No dependency was added', dependenciesUnchanged && devDependenciesUnchanged);
check('39. Changelog records no deployment or push',
  /no deployment/i.test(phaseSection) && /no push/i.test(phaseSection));
check('40. Checker blocks network access',
  source.checker.includes('Network access is blocked in the Phase 3EG owner review checker.'));

process.stdout.write(`\nTotal: ${passed + failed} | Passed: ${passed} | Failed: ${failed}\n`);
if (failed > 0) {
  process.stdout.write(`\nFailed checks:\n${failures.map((failure) => `- ${failure}`).join('\n')}\n`);
  process.exit(1);
}
process.stdout.write('All Phase 3EG static checks passed.\n');
