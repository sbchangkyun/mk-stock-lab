/**
 * Phase 3EF Portfolio mixed-currency preview UI static contract.
 * Static only: no API calls, owner smoke, provider calls, or environment reads.
 */

globalThis.fetch = async () => {
  throw new Error('Network access is blocked in the Phase 3EF UI checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const paths = {
  result: 'docs/planning/phase_3ef_portfolio_mixed_currency_preview_ui_implementation_result_v0.1.md',
  checker: 'scripts/check_phase_3ef_mixed_currency_preview_ui_static_contract.mjs',
  changelog: 'docs/planning/planning_changelog.md',
  package: 'package.json',
  ui: 'src/pages/portfolio.astro',
  styles: 'src/styles/style.css',
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
const baselinePackage = JSON.parse(git('show', 'cc15cb4:package.json') || '{}');
const changedFiles = git('diff', '--name-only', 'cc15cb4').split(/\r?\n/).filter(Boolean);
const changedSrcFiles = git('diff', '--name-only', 'cc15cb4', '--', 'src').split(/\r?\n/).filter(Boolean);
const phaseSection = source.changelog.split('## Phase 3EF - 2026-06-28')[1]?.split('\n## ')[0] ?? '';
const activationStart = source.ui.indexOf('const isMixedMockedFxPreviewActive');
const activationEnd = source.ui.indexOf('const isLivePreviewEligible', activationStart);
const activation = source.ui.slice(activationStart, activationEnd);
const requestStart = source.ui.indexOf('const requestBody = useMixedMockedFxPreview');
const requestEnd = source.ui.indexOf("const response = await fetch", requestStart);
const mixedRequest = source.ui.slice(requestStart, requestEnd);
const noticeStart = source.ui.indexOf('<aside class="mixed-fx-preview-notice');
const noticeEnd = source.ui.indexOf('<div class="portfolio-kpi-summary', noticeStart);
const mixedCopy = source.ui.slice(noticeStart, noticeEnd);
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

process.stdout.write('=== Phase 3EF Portfolio Mixed-Currency Preview UI Static Contract ===\n\n');

process.stdout.write('Files, command, changelog, and scope:\n');
check('1. Result document exists', existsSync(join(root, paths.result)));
check('2. Static checker exists', existsSync(join(root, paths.checker)));
check('3. Package checker command exists',
  packageJson.scripts?.['check:phase-3ef-mixed-currency-preview-ui'] ===
    'node scripts/check_phase_3ef_mixed_currency_preview_ui_static_contract.mjs');
check('4. Changelog contains Phase 3EF', phaseSection.length > 0);
check('5. Portfolio UI changed from cc15cb4', changedSrcFiles.includes(paths.ui));

process.stdout.write('\nActivation and preserved modes:\n');
check('6. Separate mixed preview activation helper exists', activationStart >= 0);
check('7. Hostname gate requires localhost or 127.0.0.1',
  activation.includes("host === 'localhost'") && activation.includes("host === '127.0.0.1'"));
check('8. previewMode=owner is required', activation.includes("params.get('previewMode') === 'owner'"));
check('9. fxPreview=mocked is explicitly required', activation.includes("params.get('fxPreview') === 'mocked'"));
check('10. Mixed mode is not inferred from USD positions', !/USD|currency|market/.test(activation));
check('11. Canonical production cannot satisfy exact local host gate',
  activation.includes('isLocalHost &&') && !activation.includes('mkstocklab.vercel.app'));
check('12. Fixture request remains present', source.ui.includes("source: 'fixture' as const"));
check('13. KR-only owner preview helper and request remain present',
  source.ui.includes('const isLivePreviewEligible') && source.ui.includes('useKrLivePreview'));

process.stdout.write('\nMixed request contract:\n');
check('14. Mixed request uses the live preview source constant', mixedRequest.includes('source: previewSource'));
check('15. Mixed request uses owner preview mode', mixedRequest.includes('previewMode,'));
check('16. Mixed request enables owner live quotes', mixedRequest.includes('allowLiveQuotes: true'));
check('17. Mixed request explicitly enables mocked FX', mixedRequest.includes('allowMockedFx: true'));
check('18. Mixed request selects mocked FX mode', mixedRequest.includes("fxMode: 'mocked'"));
check('19. Mixed request fixes base currency to KRW', mixedRequest.includes("baseCurrency: 'KRW'"));
check('20. source=auto was not added', !source.ui.includes("source: 'auto'") && !source.ui.includes('source=auto'));
check('21. No production or environment-variable mixed UI toggle exists',
  !activation.includes('import.meta.env') && !mixedRequest.includes('import.meta.env') && !mixedRequest.includes('process.env'));

process.stdout.write('\nState model and branch validation:\n');
for (const [number, stateName] of [
  [22, 'fixture'],
  [23, 'owner-kr-live-preview'],
  [24, 'owner-mixed-mocked-fx-preview'],
  [25, 'unavailable'],
  [26, 'blocked'],
]) {
  check(`${number}. State model contains ${stateName}`, source.ui.includes(`| '${stateName}'`) || source.ui.includes(`: '${stateName}'`));
}
check('27. Mixed validator checks mixedCurrencyPreview=true', source.ui.includes('metaObj?.mixedCurrencyPreview === true'));
check('28. Mixed validator checks mockedFx=true',
  source.ui.includes('const mockedFx = metaObj?.sampleFx === true') && source.ui.includes('mockedFx === true'));
check('29. Mixed validator checks fxSource=mocked', source.ui.includes("metaObj?.fxSource === 'mocked'"));
check('30. Mixed validator checks fxStaleState=sample', source.ui.includes("metaObj?.fxStaleState === 'sample'"));
check('31. Mixed validator accepts aggregateState=null',
  source.ui.includes("? 'available' : null") && source.ui.includes('aggregateState,'));
check('32. Mixed validator counts unavailable rows without rejecting them',
  source.ui.includes('const unavailableRows =') && !source.ui.includes('unavailableRows === 0'));

process.stdout.write('\nMixed-only copy and display policy:\n');
check('33. UI includes owner-preview label', mixedCopy.includes('오너 미리보기'));
check('34. UI includes mocked/sample FX labels', mixedCopy.includes('Mocked FX') && mixedCopy.includes('샘플 환율'));
check('35. UI states that values are not actual prices', mixedCopy.includes('실제 시세 아님'));
check('36. UI includes evaluation-unavailable copy', source.ui.includes('평가 불가'));
check('37. Mixed copy does not use 실시간', !mixedCopy.includes('실시간'));
check('38. Mixed copy does not use 현재 시세', !mixedCopy.includes('현재 시세'));
check('39. Mixed copy does not use real-time', !/real-time/i.test(mixedCopy));
check('40. Mixed copy does not use live FX', !/live FX/i.test(mixedCopy));
check('41. Unavailable rows remain in the rendered list',
  source.ui.includes('sortedPositions.forEach((position) =>') && source.ui.includes('list.appendChild(item)'));
check('42. Unavailable mixed values render as dashes',
  source.ui.includes("liveUnavailable ? '—'") && source.ui.includes("marketValueFinal = liveUnavailable ? '—'"));
check('43. Aggregate null withholds total market value',
  source.ui.includes('mixedAggregateUnavailable') && source.ui.includes('totalMarketValue = null'));
check('44. Aggregate null withholds P&L and return',
  source.ui.includes('합계와 손익을 표시하지 않습니다.') && source.ui.includes("kpiProfitEl.className = 'kpi-profit neutral'"));
check('45. Mixed failures do not substitute fixture values',
  source.ui.includes('혼합 통화 미리보기를 불러오지 못했습니다.') && !source.ui.includes('useMixedMockedFxPreview = false'));

process.stdout.write('\nLeakage and change boundaries:\n');
check('46. UI does not render providerMeta', !source.ui.includes('providerMeta'));
check('47. UI does not reference raw KIS fields', !/stck_prpr|prdy_vrss|output1/.test(source.ui));
check('48. UI does not reference raw FX fields', !/rawFx|rawProviderPayload|providerResponse/.test(source.ui));
check('49. UI does not render request body', !/textContent\s*=\s*requestBody|innerHTML\s*=\s*requestBody/.test(source.ui));
check('50. UI does not render response body', !/textContent\s*=\s*(data|response)|innerHTML\s*=\s*(data|response)/.test(source.ui));
check('51. UI does not log API payloads', !/console\.(log|debug|info)\s*\(/.test(source.ui));
check('52. No dependency changed', dependenciesUnchanged && devDependenciesUnchanged);
check('53. Portfolio API route behavior is unchanged', !changedSrcFiles.includes('src/pages/api/portfolio/valuation.ts'));
check('54. FX adapters are unchanged', !changedSrcFiles.some((file) => file.startsWith('src/lib/server/providers/fx')));
check('55. KIS providers are unchanged', !changedSrcFiles.some((file) => /kis/i.test(file)));

process.stdout.write('\nLayout, result, and changelog:\n');
check('56. Preview CSS is scoped and shrink-safe',
  source.ui.includes('.mixed-fx-preview-notice') && source.ui.includes('max-width: 100%') && source.ui.includes('min-width: 0'));
check('57. No fixed wide preview panel was added', !/mixed-fx-preview[^}]*width:\s*\d+(px|rem)/s.test(source.ui));
check('58. Mobile containment markers remain present',
  source.styles.includes('.portfolio-mvp') && source.styles.includes('.portfolio-dashboard') &&
  source.styles.includes('.portfolio-bookmark-tabs') && source.styles.includes('.positions-list-wrap'));
check('59. Result records no deployment and recommends Phase 3EG',
  /No deployment|Deployment.*None/i.test(source.result) && source.result.includes('Phase 3EG'));
check('60. Changelog records Phase 3EF implementation',
  phaseSection.includes('Portfolio Mixed-Currency Preview UI Implementation') && phaseSection.includes('No deployment'));
check('61. Runtime source scope is Portfolio UI only',
  changedSrcFiles.length === 1 && changedSrcFiles[0] === paths.ui);
check('62. Result document records no push', /No push|Push.*None/i.test(source.result));
check('63. Changelog preserves fixture-only production', phaseSection.includes('public production remains fixture-only'));
check('64. Checker itself blocks network access',
  source.checker.includes('Network access is blocked in the Phase 3EF UI checker.'));
check('65. Required implementation files exist and Portfolio UI is in the phase diff',
  changedFiles.includes(paths.ui) && existsSync(join(root, paths.result)) && existsSync(join(root, paths.checker)));

process.stdout.write(`\nTotal: ${passed + failed} | Passed: ${passed} | Failed: ${failed}\n`);
if (failed > 0) {
  process.stdout.write(`\nFailed checks:\n${failures.map((failure) => `- ${failure}`).join('\n')}\n`);
  process.exit(1);
}
process.stdout.write('All Phase 3EF static checks passed.\n');
