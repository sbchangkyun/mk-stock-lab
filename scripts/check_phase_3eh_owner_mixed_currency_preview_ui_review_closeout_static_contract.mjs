/**
 * Phase 3EH owner mixed-currency preview UI review closeout static contract.
 * Documentation-only: no dev server, browser, API, smoke, provider, or environment access.
 */

globalThis.fetch = async () => {
  throw new Error('Network access is blocked in the Phase 3EH closeout checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const paths = {
  result: 'docs/planning/phase_3eh_owner_mixed_currency_preview_ui_review_closeout_result_v0.1.md',
  checker: 'scripts/check_phase_3eh_owner_mixed_currency_preview_ui_review_closeout_static_contract.mjs',
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
const baselinePackage = JSON.parse(git('show', 'c364320:package.json') || '{}');
const diffFiles = git('diff', '--name-only', 'c364320').split(/\r?\n/).filter(Boolean);
const statusFiles = git('status', '--porcelain=v1').split(/\r?\n/).filter(Boolean).map((line) => line.slice(3).trim());
const changedFiles = [...new Set([...diffFiles, ...statusFiles])];
const runtimeChanges = changedFiles.filter((path) => path.startsWith('src/'));
const phaseSection = source.changelog.split('## Phase 3EH - 2026-06-29')[1]?.split('\n## ')[0] ?? '';
const dependenciesUnchanged = JSON.stringify(packageJson.dependencies) === JSON.stringify(baselinePackage.dependencies);
const devDependenciesUnchanged = JSON.stringify(packageJson.devDependencies ?? {}) === JSON.stringify(baselinePackage.devDependencies ?? {});
const imageExtension = /\.(png|jpe?g|webp|gif)$/i;

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

process.stdout.write('=== Phase 3EH Owner Mixed-Currency Preview UI Review Closeout Static Contract ===\n\n');

check('1. Closeout result document exists', existsSync(join(root, paths.result)));
check('2. Static checker exists', existsSync(join(root, paths.checker)));
check('3. Package checker command exists',
  packageJson.scripts?.['check:phase-3eh-owner-mixed-currency-ui-review-closeout'] ===
    'node scripts/check_phase_3eh_owner_mixed_currency_preview_ui_review_closeout_static_contract.mjs');
check('4. Changelog contains Phase 3EH', phaseSection.length > 0);
check('5. Closeout status is completed', /Completed.*owner mixed-currency preview UI review PASS/i.test(source.result));
check('6. Closeout records PASS_WITH_MOBILE_NOTE', source.result.includes('PASS_WITH_MOBILE_NOTE'));
check('7. Closeout references Phase 3EB', source.result.includes('Phase 3EB'));
check('8. Closeout references Phase 3ED', source.result.includes('Phase 3ED'));
check('9. Closeout references Phase 3EE', source.result.includes('Phase 3EE'));
check('10. Closeout references Phase 3EF', source.result.includes('Phase 3EF'));
check('11. Closeout references Phase 3EG', source.result.includes('Phase 3EG'));
check('12. Closeout records fixture default PASS', source.result.includes('Fixture default: PASS'));
check('13. Closeout records KR-only owner preview PASS',
  /KR-only owner preview: PASS.*no regression reported/i.test(source.result));
check('14. Closeout records mixed mocked-FX owner preview PASS',
  /Mixed mocked-FX owner preview: PASS/i.test(source.result));
check('15. Closeout records all individual portfolios checked',
  ['미래에셋증권', '토스증권', '한국투자', '나무증권'].every((name) => source.result.includes(name)));
check('16. Closeout records owner-preview notice visible PASS', source.result.includes('Owner-preview notice visible: PASS'));
check('17. Closeout records 오너 미리보기 PASS', /`오너 미리보기` visible: PASS/.test(source.result));
check('18. Closeout records Mocked FX PASS', /`Mocked FX` visible: PASS/.test(source.result));
check('19. Closeout records 샘플 환율 PASS', /`샘플 환율` visible: PASS/.test(source.result));
check('20. Closeout records 실제 시세 아님 PASS', /`실제 시세 아님` visible: PASS/.test(source.result));
check('21. Closeout records unavailable rows visible PASS', source.result.includes('Unavailable rows remain visible: PASS'));
check('22. Closeout records aggregate values not fabricated PASS',
  source.result.includes('Aggregate values are not fabricated when unavailable/null: PASS'));
check('23. Closeout records forbidden wording check PASS',
  source.result.includes('No forbidden real-time/current/live-FX wording in the mixed-preview notice: PASS'));
check('24. Closeout records production block PASS', source.result.includes('Production block: PASS'));
check('25. Initial aggregate/all-tab review is inconclusive, not a defect',
  /aggregate\/all tab.*appear similar/i.test(source.result) && /inconclusive eligibility state, not a defect/i.test(source.result));
check('26. Closeout records retry with individual portfolios', /retry with individual portfolios/i.test(source.result));
check('27. Mobile 390px was not separately evidenced',
  /Mobile 390px: not separately evidenced by a dedicated owner screenshot/i.test(source.result));
check('28. Closeout records prior static/mobile validation PASS', /Prior static\/mobile validation.*PASS/i.test(source.result));
check('29. Closeout records mobile note as non-blocking', /non-blocking.*local-only closeout/i.test(source.result));
check('30. Voluntary screenshots are recorded as not committed',
  source.result.includes('Screenshots were voluntarily shared in chat for visual review.') &&
    source.result.includes('Screenshots were not committed to the repository.'));
check('31. Closeout records no raw API response', source.result.includes('No raw API response was shared.'));
check('32. Closeout records no request/response body', source.result.includes('No request/response body was shared.'));
check('33. Closeout records no financial values in repository',
  source.result.includes('No prices/totals/P&L were recorded in the repository.'));
check('34. Closeout records no secrets or environment values', source.result.includes('No secrets/environment values were shared.'));
check('35. Closeout records no account data', source.result.includes('No account data was shared.'));
check('36. Closeout records no runtime source changes', source.result.includes('No runtime source changes.'));
check('37. Closeout records no Portfolio UI changes', source.result.includes('No Portfolio UI changes.'));
check('38. Closeout records no API/provider changes', source.result.includes('No API/provider changes.'));
check('39. Closeout records no active owner smoke', source.result.includes('No active owner smoke.'));
check('40. Closeout records no live KIS call', source.result.includes('No live KIS call.'));
check('41. Closeout records no live FX call', source.result.includes('No live FX call.'));
check('42. Closeout records no production geometry', source.result.includes('No production geometry.'));
check('43. Closeout records no deployment', source.result.includes('No deployment.'));
check('44. Closeout records no push', source.result.includes('No push.'));
check('45. Closeout decision is CLOSED', source.result.includes('Phase 3EH decision: CLOSED'));
check('46. Closeout recommends Phase 3EI', source.result.includes('Phase 3EI — KIS Data Surface Impact Plan'));
check('47. Closeout includes the narrow mobile retry alternative',
  source.result.includes('Phase 3EG-Mobile-Retry — Dedicated 390px Owner Visual Check') &&
    /only if the owner wants strict dedicated mobile visual evidence/i.test(source.result));
check('48. No runtime source file changed', runtimeChanges.length === 0);
check('49. Portfolio UI file did not change', !changedFiles.includes(paths.ui));
check('50. No dependency was added', dependenciesUnchanged && devDependenciesUnchanged);
check('51. No screenshot or image file was added', !changedFiles.some((path) => imageExtension.test(path)));
check('52. Checker blocks network access', source.checker.includes('Network access is blocked in the Phase 3EH closeout checker.'));

process.stdout.write(`\nTotal: ${passed + failed} | Passed: ${passed} | Failed: ${failed}\n`);
if (failed > 0) {
  process.stdout.write(`\nFailed checks:\n${failures.map((failure) => `- ${failure}`).join('\n')}\n`);
  process.exit(1);
}
process.stdout.write('All Phase 3EH static checks passed.\n');
