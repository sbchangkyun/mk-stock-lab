/**
 * Phase 3EI KIS data surface impact plan static contract.
 * Planning-only: no dev server, browser, API, smoke, provider, or environment access.
 */

globalThis.fetch = async () => {
  throw new Error('Network access is blocked in the Phase 3EI KIS data surface impact checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const paths = {
  plan: 'docs/planning/phase_3ei_kis_data_surface_impact_plan_v0.1.md',
  checker: 'scripts/check_phase_3ei_kis_data_surface_impact_plan_static_contract.mjs',
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
    return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
};

const source = Object.fromEntries(Object.entries(paths).map(([key, path]) => [key, read(path)]));
const packageJson = JSON.parse(source.package || '{}');
const baselinePackage = JSON.parse(git('show', '87b019a:package.json') || '{}');
const diffFiles = git('diff', '--name-only', '87b019a').split(/\r?\n/).filter(Boolean);
const statusFiles = git('status', '--porcelain=v1').split(/\r?\n/).filter(Boolean).map((line) => line.slice(3).trim());
const changedFiles = [...new Set([...diffFiles, ...statusFiles])];
const runtimeChanges = changedFiles.filter((path) => path.startsWith('src/'));
const apiChanges = changedFiles.filter((path) => path.startsWith('src/pages/api/'));
const uiPageChanges = changedFiles.filter((path) =>
  path.startsWith('src/pages/') || path.startsWith('src/layouts/') || path.startsWith('src/components/'));
const phaseSection = source.changelog.split('## Phase 3EI - 2026-06-29')[1]?.split('\n## ')[0] ?? '';
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

process.stdout.write('=== Phase 3EI KIS Data Surface Impact Plan Static Contract ===\n\n');

check('1. Plan document exists', existsSync(join(root, paths.plan)));
check('2. Static checker exists', existsSync(join(root, paths.checker)));
check('3. Package checker command exists',
  packageJson.scripts?.['check:phase-3ei-kis-data-surface-impact-plan'] ===
    'node scripts/check_phase_3ei_kis_data_surface_impact_plan_static_contract.mjs');
check('4. Changelog contains Phase 3EI', phaseSection.length > 0);
check('5. Plan status records no runtime changes',
  source.plan.includes('Planned — KIS data surface impact plan completed; no runtime changes.'));
check('6. Plan references Phase 3EH', source.plan.includes('Phase 3EH'));
check('7. Plan references KIS KR quote validation',
  /owner-run validation covered KIS KR stock quotes/i.test(source.plan) && source.plan.includes('KR ETF quote'));
check('8. Plan records public source=live disabled', source.plan.includes('Public `source=live` remains disabled'));
check('9. Plan records source=auto deferred', source.plan.includes('`source=auto` remains deferred'));
check('10. Plan records real FX provider not selected', source.plan.includes('real FX provider is not selected'));
check('11. Plan records US quote not implemented', source.plan.includes('US quote provider is not implemented'));
check('12. Plan includes current capability baseline', source.plan.includes('## 3. Current Data Capability Baseline'));
check('13. Plan includes NAV impact summary matrix', source.plan.includes('## 4. NAV Impact Summary Matrix'));
check('14. Plan covers Home ticker belt', source.plan.includes('### Ticker belt'));
check('15. Plan covers Home MARKET SNAPSHOT', source.plan.includes('### MARKET SNAPSHOT'));
check('16. Plan covers Chart AI symbol search', source.plan.includes('### Symbol search'));
check('17. Plan covers Chart AI symbol analysis', source.plan.includes('### Symbol analysis'));
check('18. Plan covers Market KOSPI200 treemap', source.plan.includes('### KOSPI200 Treemap'));
check('19. Plan covers Market KOSDAQ150 treemap', source.plan.includes('### KOSDAQ150 Treemap'));
check('20. Plan covers Market S&P500 treemap', source.plan.includes('### S&P500 Treemap'));
check('21. Plan covers Market NASDAQ100 treemap', source.plan.includes('### NASDAQ100 Treemap'));
check('22. Plan covers Momentum / Trend', source.plan.includes('### Momentum / Trend'));
check('23. Plan covers major index flow', source.plan.includes('### Major index flow'));
check('24. Plan covers asset-class returns', source.plan.includes('### Asset-class returns'));
check('25. Plan covers Lab asset-class return comparison', source.plan.includes('### Asset-class return comparison'));
check('26. Plan covers Lab S&P500 sector returns', source.plan.includes('### S&P 500 sector returns'));
check('27. Plan covers Portfolio registered holdings',
  source.plan.includes('## 9. Portfolio Impact Plan') && source.plan.includes('user-registered holdings'));
check('28. Plan covers MyPage watchlist price alerts',
  source.plan.includes('## 10. MyPage Impact Plan') && source.plan.includes('target-price alert'));
check('29. Plan covers symbol master', source.plan.includes('### Symbol master'));
check('30. Plan covers quote API layer', source.plan.includes('### Quote API layer'));
check('31. Plan covers quote cache', source.plan.includes('### Quote cache'));
check('32. Plan covers market calendar', source.plan.includes('### Market calendar'));
check('33. Plan covers source labels', source.plan.includes('### Source labels'));
check('34. Plan covers provider leakage guard', source.plan.includes('### Provider leakage guard'));
check('35. Plan covers alert worker', source.plan.includes('### Alert worker'));
check('36. Plan includes external data gap register', source.plan.includes('## 12. External Data Gap Register'));
check('37. Plan includes S&P500 constituents gap', source.plan.includes('| S&P500 constituents |'));
check('38. Plan includes NASDAQ100 constituents gap', source.plan.includes('| NASDAQ100 constituents |'));
check('39. Plan includes KOSPI200/KOSDAQ150 source gap',
  source.plan.includes('| KOSPI200/KOSDAQ150 official constituent/weight source |'));
check('40. Plan includes Dollar Index, Gold, and WTI Oil gaps',
  ['| Dollar Index |', '| Gold |', '| WTI Oil |'].every((marker) => source.plan.includes(marker)));
check('41. Plan includes real FX provider gap', source.plan.includes('| Real FX provider |'));
check('42. Plan includes US quote provider gap', source.plan.includes('| US quote provider |'));
check('43. Plan includes priority roadmap', source.plan.includes('## 13. Priority and Roadmap Recommendation'));
check('44. Plan recommends Phase 3EJ infrastructure plan',
  source.plan.includes('Recommended next phase: Phase 3EJ — KIS Symbol Master & Quote Infrastructure Plan.'));
check('45. Plan includes Home alternative',
  source.plan.includes('Alternative: Phase 3EJ — Home Ticker Belt / MARKET SNAPSHOT Preview Plan'));
check('46. Plan includes owner decision matrix', source.plan.includes('## 14. Owner Decision Matrix'));
check('47. Plan includes risk register', source.plan.includes('## 15. Risk Register'));
check('48. Plan includes validation plan', source.plan.includes('## 16. Validation Plan'));
check('49. Plan restricts real-time/live wording to later support',
  /Forbidden unless a later WebSocket-specific phase supports and validates the claim/i.test(source.plan) &&
    source.plan.includes('실시간') && source.plan.includes('real-time'));
check('50. Plan preserves provider leakage restrictions',
  source.plan.includes('no raw KIS fields') && source.plan.includes('no `providerMeta`') &&
    source.plan.includes('no request or response bodies'));
check('51. No runtime source file changed', runtimeChanges.length === 0);
check('52. No API route file changed', apiChanges.length === 0);
check('53. No UI page file changed', uiPageChanges.length === 0);
check('54. No dependency was added', dependenciesUnchanged && devDependenciesUnchanged);
check('55. Changelog records no deployment or push',
  /no deployment/i.test(phaseSection) && /no push/i.test(phaseSection));
check('56. Checker blocks network access',
  source.checker.includes('Network access is blocked in the Phase 3EI KIS data surface impact checker.'));

process.stdout.write(`\nTotal: ${passed + failed} | Passed: ${passed} | Failed: ${failed}\n`);
if (failed > 0) {
  process.stdout.write(`\nFailed checks:\n${failures.map((failure) => `- ${failure}`).join('\n')}\n`);
  process.exit(1);
}
process.stdout.write('All Phase 3EI static checks passed.\n');
