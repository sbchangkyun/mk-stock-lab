/**
 * Phase 3EE Portfolio mixed-currency preview UI wiring plan static contract.
 * Planning-only: no API calls, smoke execution, providers, or environment reads.
 */

globalThis.fetch = async () => {
  throw new Error('Network access is blocked in the Phase 3EE UI wiring plan checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const paths = {
  plan: 'docs/planning/phase_3ee_portfolio_mixed_currency_preview_ui_wiring_plan_v0.1.md',
  checker: 'scripts/check_phase_3ee_portfolio_mixed_currency_preview_ui_wiring_plan_static_contract.mjs',
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

const source = Object.fromEntries(Object.entries(paths).map(([key, path]) => [key, read(path)]));
const packageJson = JSON.parse(source.package || '{}');
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

process.stdout.write('=== Phase 3EE Portfolio Mixed-Currency Preview UI Wiring Plan Static Contract ===\n\n');

process.stdout.write('Files and package command:\n');
check('Phase 3EE plan exists', existsSync(join(root, paths.plan)));
check('Phase 3EE checker exists', existsSync(join(root, paths.checker)));
check('Package checker command exists',
  packageJson.scripts?.['check:phase-3ee-mixed-currency-preview-ui-plan'] ===
    'node scripts/check_phase_3ee_portfolio_mixed_currency_preview_ui_wiring_plan_static_contract.mjs');
const phaseSection = source.changelog.split('## Phase 3EE - 2026-06-28')[1]?.split('\n## ')[0] ?? '';
check('Changelog contains Phase 3EE', phaseSection.length > 0);
process.stdout.write('\n');

process.stdout.write('Plan structure and phase continuity:\n');
for (let section = 1; section <= 15; section += 1) {
  check(`Plan contains section ${section}`, source.plan.includes(`## ${section}.`));
}
check('Plan status records no runtime changes',
  source.plan.includes('Planned - Portfolio mixed-currency preview UI wiring plan completed; no runtime changes.'));
check('Plan references Phase 3EB', source.plan.includes('Phase 3EB'));
check('Plan references Phase 3EC', source.plan.includes('Phase 3EC'));
check('Plan references Phase 3ED', source.plan.includes('Phase 3ED'));
check('Plan records owner active smoke PASS', source.plan.includes('owner active smoke PASS'));
process.stdout.write('\n');

process.stdout.write('Owner smoke evidence and preserved policy:\n');
for (const marker of [
  'HTTP 200',
  'contract PASS',
  '`mixedCurrencyPreview=true`',
  '`mockedFx=true`',
  '`fxSource=mocked`',
  '`fxStaleState=sample`',
  '`rowCount=2`',
  '`unavailableRows=2`',
  '`unsupportedCurrencyRows=0`',
  '`missingQuoteRows=2`',
  '`aggregateState=null`',
  'provider-leakage PASS',
  'final result PASS',
]) {
  check(`Plan records ${marker}`, source.plan.includes(marker));
}
check('Plan keeps public production fixture-only',
  source.plan.includes('Public production remains fixture-only'));
check('Plan keeps source=auto deferred', source.plan.includes('`source=auto` remains deferred'));
check('Plan keeps real FX provider blocked',
  source.plan.includes('Real FX provider integration remains blocked'));
check('Plan keeps real US quotes outside scope', source.plan.includes('real US quotes'));
process.stdout.write('\n');

process.stdout.write('Existing UI baseline:\n');
for (const marker of [
  '`isOwnerPreviewActive()`',
  '`isLivePreviewEligible()`',
  '`portfolio.astro:540-545`',
  '`portfolio.astro:546-561`',
  '`portfolio.astro:593-639`',
  '`portfolio.astro:667-686`',
  '`portfolio.astro:1167-1187`',
  '`portfolio.astro:1242-1256`',
  'KR-only owner preview',
  'fixture request shape',
]) {
  check(`Baseline includes ${marker}`, source.plan.includes(marker));
}
check('Baseline identifies mixed response validator gap',
  source.plan.includes('quoteSource=live-kr-only') && source.plan.includes('branch-specific contract'));
check('Baseline records unavailable row behavior',
  source.plan.includes('render dashes') && source.plan.includes('keeping the row visible'));
check('Baseline records conservative live KPI behavior',
  source.plan.includes('KPI total market value becomes null'));
process.stdout.write('\n');

process.stdout.write('Activation and API mapping:\n');
check('Plan defines local-only hostname activation',
  source.plan.includes('hostname is exactly `localhost` or `127.0.0.1`'));
check('Plan requires previewMode=owner', source.plan.includes('Require `previewMode=owner`'));
check('Plan requires explicit mocked-FX query activation',
  source.plan.includes('fxPreview=mocked') && source.plan.includes('Do not infer mocked FX'));
check('Plan blocks canonical production activation',
  source.plan.includes('Do not display owner-preview controls or labels on canonical production'));
check('Plan preserves fixture default', source.plan.includes('Do not alter fixture default behavior'));
for (const marker of [
  '"source": "live"',
  '"previewMode": "owner"',
  '"allowLiveQuotes": true',
  '"allowMockedFx": true',
  '"fxMode": "mocked"',
  '"baseCurrency": "KRW"',
]) {
  check(`API mapping includes ${marker}`, source.plan.includes(marker));
}
check('Plan blocks request and response body exposure',
  source.plan.includes('Do not log or render the request body') &&
    source.plan.includes('Do not echo the response body'));
check('Plan blocks environment-variable UI toggles',
  source.plan.includes('Do not add production or environment-variable UI toggles'));
process.stdout.write('\n');

process.stdout.write('State, copy, and display policy:\n');
for (const state of [
  '`fixture`',
  '`owner-kr-live-preview`',
  '`owner-mixed-mocked-fx-preview`',
  '`unavailable`',
  '`blocked`',
]) {
  check(`State model contains ${state}`, source.plan.includes(state));
}
for (const label of [
  'owner preview', 'mocked FX', 'sample FX', 'sample valuation',
  'data unavailable', 'preview only', 'not production data',
]) {
  check(`Allowed labels include ${label}`, source.plan.includes(label));
}
for (const label of [
  '`real-time`', '`realtime`', '`실시간`', '`현재 시세`', '`실시간 시세`',
  '`live FX`', '`current FX`', '`actual market value`',
]) {
  check(`Forbidden labels include ${label}`, source.plan.includes(label));
}
check('Plan prohibits mocked FX live/current claims',
  source.plan.includes('must never be described as live, current, real-time, actual, or production-ready'));
check('Plan keeps unavailable rows visible', source.plan.includes('Keep both rows visible'));
check('Plan forbids aggregate cost-basis fabrication',
  source.plan.includes('Do not calculate aggregate market value from cost basis'));
check('Plan withholds P&L for null aggregate',
  source.plan.includes('Do not show aggregate P&L or return when aggregate state is null'));
check('Plan distinguishes missing quotes from unsupported currencies',
  source.plan.includes('A missing quote is not an unsupported currency'));
process.stdout.write('\n');

process.stdout.write('Leakage, layout, and owner review:\n');
for (const marker of [
  'provider metadata', 'raw KIS fields', 'raw FX provider fields',
  'request or response bodies', 'headers', 'tokens or account numbers',
  'API URLs', 'stack traces', 'environment values',
]) {
  check(`Leakage policy blocks ${marker}`, source.plan.includes(marker));
}
check('Safe metadata fields are defined',
  source.plan.includes('`mixedCurrencyPreview`') &&
    source.plan.includes('`fxSource`') &&
    source.plan.includes('aggregate availability state'));
check('Plan references Phase 3DX', source.plan.includes('Phase 3DX'));
check('Plan preserves Portfolio local scroll owners',
  source.plan.includes('`.portfolio-bookmark-tabs`') && source.plan.includes('`.positions-list-wrap`'));
check('Plan requires 390px review', source.plan.includes('390px'));
for (const review of [
  'Local owner mixed-preview activation',
  'Clear owner-preview banner or badge',
  'Mocked FX/sample label',
  'USD row unavailable display',
  'Aggregate null/unavailable display',
  'Fixture default unaffected',
  'Production preview blocked',
]) {
  check(`Owner review includes ${review}`, source.plan.includes(review));
}
check('Owner review is PASS/FAIL only', source.plan.includes('owner only returns PASS/FAIL'));
process.stdout.write('\n');

process.stdout.write('Future phases and validation plan:\n');
check('Plan recommends Phase 3EF implementation',
  source.plan.includes('Phase 3EF - Portfolio Mixed-Currency Preview UI Implementation'));
check('Plan recommends Phase 3EG owner review',
  source.plan.includes('Phase 3EG - Owner Local Mixed-Currency Preview UI Review'));
for (const command of [
  'npm run check:phase-3ef-mixed-currency-preview-ui',
  'npm run check:phase-3eb-mixed-currency-owner-preview-api',
  'npm run check:phase-3ed-owner-mixed-currency-smoke-closeout',
  'npm run check:phase-3dx-ui-architecture-plan',
  'npm run check:mobile-baseline',
  'npm run check:portfolio-live-preview-api',
  'npm run check:production-domain',
  'npm run build',
  'git diff --check',
  'npm run guard:production-mobile-geometry',
]) {
  check(`Phase 3EF validation includes ${command}`, source.plan.includes(command));
}
check('Final recommendation is exact',
  source.plan.includes('Recommended next phase: Phase 3EF - Portfolio Mixed-Currency Preview UI Implementation.'));
check('Plan includes provider-decision alternative',
  source.plan.includes('Alternative: Phase 3EA-HF1 - Owner FX Provider Decision Closeout'));
process.stdout.write('\n');

process.stdout.write('Static checker and change scope:\n');
check('Checker installs required fetch block',
  source.checker.includes('Network access is blocked in the Phase 3EE UI wiring plan checker.'));
const importedModules = [...source.checker.matchAll(/^import .* from '([^']+)';$/gm)]
  .map((match) => match[1]);
const childProcessCommands = [...source.checker.matchAll(/execFileSync\(\s*'([^']+)'/g)]
  .map((match) => match[1]);
check('Checker is static-only',
  importedModules.every((specifier) => specifier.startsWith('node:')) &&
    childProcessCommands.every((command) => command === 'git'));
const environmentFileMarker = ['.', 'env'].join('');
const processEnvironmentMarker = ['process', 'env'].join('.');
check('Checker reads no environment file',
  Object.values(paths).every((path) => !path.toLowerCase().includes(environmentFileMarker)) &&
    !source.checker.includes(processEnvironmentMarker));
let runtimeChanges = ['<git-diff-unavailable>'];
let uiChanged = true;
let lockChanged = true;
let dependenciesChanged = true;
try {
  runtimeChanges = execFileSync('git', ['diff', '--name-only', '01e21a6', '--', 'src'], {
    cwd: root,
    encoding: 'utf8',
  }).trim().split(/\r?\n/).filter(Boolean);
  uiChanged = runtimeChanges.includes(paths.ui);
  lockChanged = execFileSync('git', ['diff', '--name-only', '01e21a6', '--', 'package-lock.json'], {
    cwd: root,
    encoding: 'utf8',
  }).trim().length > 0;
  const baselinePackage = JSON.parse(execFileSync('git', ['show', '01e21a6:package.json'], {
    cwd: root,
    encoding: 'utf8',
  }));
  dependenciesChanged = JSON.stringify(baselinePackage.dependencies) !== JSON.stringify(packageJson.dependencies) ||
    JSON.stringify(baselinePackage.devDependencies) !== JSON.stringify(packageJson.devDependencies);
} catch {
  // Fail closed through initialized values.
}
check('No runtime source file changed', runtimeChanges.length === 0);
check('Portfolio UI is unchanged', !uiChanged);
check('Dependency lockfile is unchanged', !lockChanged);
check('No dependency was added or changed', !dependenciesChanged);
check('Changelog records no deployment and no push',
  phaseSection.includes('no deployment') && phaseSection.includes('no push'));
process.stdout.write('\n');

process.stdout.write(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}\n`);
if (failures.length > 0) {
  process.stdout.write('\nFailed checks:\n');
  for (const failure of failures) process.stdout.write(`  - ${failure}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('Result: PASS\n');
}
