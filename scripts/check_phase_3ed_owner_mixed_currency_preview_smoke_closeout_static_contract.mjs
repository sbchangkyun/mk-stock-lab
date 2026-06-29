/**
 * Phase 3ED owner mixed-currency smoke closeout static contract.
 * No smoke execution, local API access, provider calls, or environment-file reads.
 */

globalThis.fetch = async () => {
  throw new Error('Network access is blocked in the Phase 3ED closeout checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const paths = {
  result: 'docs/planning/phase_3ed_owner_mixed_currency_preview_smoke_closeout_result_v0.1.md',
  changelog: 'docs/planning/planning_changelog.md',
  checker: 'scripts/check_phase_3ed_owner_mixed_currency_preview_smoke_closeout_static_contract.mjs',
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

process.stdout.write('=== Phase 3ED Owner Mixed-Currency Preview Smoke Closeout Static Contract ===\n\n');

process.stdout.write('Files and package command:\n');
check('Closeout document exists', existsSync(join(root, paths.result)));
check('Closeout checker exists', existsSync(join(root, paths.checker)));
check('Package checker command exists',
  packageJson.scripts?.['check:phase-3ed-owner-mixed-currency-smoke-closeout'] ===
    'node scripts/check_phase_3ed_owner_mixed_currency_preview_smoke_closeout_static_contract.mjs');
const phaseSection = source.changelog.split('## Phase 3ED - 2026-06-28')[1]?.split('\n## ')[0] ?? '';
check('Changelog contains Phase 3ED', phaseSection.length > 0);
process.stdout.write('\n');

process.stdout.write('Closeout structure and status:\n');
for (const heading of [
  '## 1. Status',
  '## 2. Background',
  '## 3. Owner Smoke Result',
  '## 4. Completed Result Template',
  '## 5. Decision',
  '## 6. Safety Confirmation',
  '## 7. Validation',
  '## 8. Next Phase Recommendation',
]) {
  check(`Closeout contains ${heading}`, source.result.includes(heading));
}
check('Closeout status is completed PASS',
  source.result.includes('Completed - owner mixed-currency preview smoke PASS.'));
check('Closeout records owner manual execution',
  source.result.includes('The owner manually ran the active local smoke.'));
check('Closeout embeds the completed Phase 3EC report',
  source.result.includes('# Phase 3EC Owner Smoke Report') &&
    source.result.includes('- PASS / FAIL: PASS'));
process.stdout.write('\n');

process.stdout.write('Exact sanitized owner evidence:\n');
const sanitizedLines = [
  'phase3ec step=preflight status=pass target=local-api sanitized=true',
  'phase3ec step=api-call status=pass httpStatus=200 sanitized=true',
  'phase3ec step=contract status=pass source=live previewMode=owner mixedCurrencyPreview=true mockedFx=true sanitized=true',
  'phase3ec step=rows status=pass rowCount=2 unavailableRows=2 unsupportedCurrencyRows=0 missingQuoteRows=2 sanitized=true',
  'phase3ec step=fx status=pass fxSource=mocked fxStaleState=sample rateValuePrinted=false sanitized=true',
  'phase3ec step=aggregate status=pass aggregateState=null valuesPrinted=false sanitized=true',
  'phase3ec step=provider-leakage status=pass sanitized=true',
  'phase3ec result=PASS sanitized=true',
];
for (const line of sanitizedLines) {
  check(`Closeout includes ${line}`, source.result.includes(line));
}
check('Closeout contains each sanitized line exactly once',
  sanitizedLines.every((line) => source.result.split(line).length === 2));
process.stdout.write('\n');

process.stdout.write('Owner result interpretation:\n');
for (const marker of [
  'HTTP status**: 200',
  'Contract**: PASS',
  'Mixed currency preview**: true',
  'Mocked FX**: true',
  'FX source**: mocked',
  'FX stale state**: sample',
  '`rowCount=2`',
  '`unavailableRows=2`',
  '`unsupportedCurrencyRows=0`',
  '`missingQuoteRows=2`',
  'Aggregate state**: null',
  'Provider leakage check**: PASS',
  'Final result**: PASS',
]) {
  check(`Decision records ${marker}`, source.result.includes(marker));
}
check('Unavailable rows are explicitly accepted for this phase',
  source.result.includes('The two unavailable rows, two missing quote rows, and null aggregate are expected'));
check('Closeout keeps real US quotes outside scope', source.result.includes('Real US quotes'));
check('Closeout keeps real FX integration outside scope',
  source.result.includes('real FX provider integration remain outside scope'));
process.stdout.write('\n');

process.stdout.write('Safety closeout:\n');
for (const marker of [
  'No active smoke was run by Codex.',
  'No live KIS call was run by Codex.',
  'No live FX call was run.',
  'No real FX provider was connected.',
  'No production endpoint was touched.',
  'No `source=auto` enablement occurred; it remains deferred.',
  'No public `source=live` enablement occurred.',
  'No secrets or environment values were shared.',
  'No API response body was shared.',
  'No prices, totals, market values, or P&L were shared.',
  'No server logs or screenshots were used as evidence.',
  'No Supabase access, SQL, migration, Vercel environment change, deployment, or push occurred.',
]) {
  check(`Closeout records ${marker}`, source.result.includes(marker));
}
check('Changelog records no active smoke by Codex', phaseSection.includes('no active smoke by Codex'));
check('Changelog records no deployment and no push',
  phaseSection.includes('no deployment') && phaseSection.includes('no push'));
process.stdout.write('\n');

process.stdout.write('Next phase recommendation:\n');
check('Closeout recommends Phase 3EE',
  source.result.includes('Phase 3EE - Portfolio Mixed-Currency Preview UI Wiring Plan'));
check('Closeout includes the provider-decision alternative',
  source.result.includes('Phase 3EA-HF1 - Owner FX Provider Decision Closeout'));
check('Closeout rejects public deployment as the next step',
  source.result.includes('rather than public deployment'));
check('Closeout keeps public production fixture-only',
  source.result.includes('Public production remains fixture-only'));
check('Changelog recommends Phase 3EE', phaseSection.includes('Phase 3EE'));
process.stdout.write('\n');

process.stdout.write('Static checker and change scope:\n');
check('Checker installs the required fetch block',
  source.checker.includes('Network access is blocked in the Phase 3ED closeout checker.'));
const importedModules = [...source.checker.matchAll(/^import .* from '([^']+)';$/gm)]
  .map((match) => match[1]);
const childProcessCommands = [...source.checker.matchAll(/execFileSync\(\s*'([^']+)'/g)]
  .map((match) => match[1]);
check('Checker does not import or execute owner smoke',
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
  runtimeChanges = execFileSync('git', ['diff', '--name-only', '6e05ecd', '01e21a6', '--', 'src'], {
    cwd: root,
    encoding: 'utf8',
  }).trim().split(/\r?\n/).filter(Boolean);
  uiChanged = runtimeChanges.includes(paths.ui);
  lockChanged = execFileSync('git', ['diff', '--name-only', '6e05ecd', '01e21a6', '--', 'package-lock.json'], {
    cwd: root,
    encoding: 'utf8',
  }).trim().length > 0;
  const baselinePackage = JSON.parse(execFileSync('git', ['show', '6e05ecd:package.json'], {
    cwd: root,
    encoding: 'utf8',
  }));
  const phasePackage = JSON.parse(execFileSync('git', ['show', '01e21a6:package.json'], {
    cwd: root,
    encoding: 'utf8',
  }));
  dependenciesChanged = JSON.stringify(baselinePackage.dependencies) !== JSON.stringify(phasePackage.dependencies) ||
    JSON.stringify(baselinePackage.devDependencies) !== JSON.stringify(phasePackage.devDependencies);
} catch {
  // Fail closed through initialized values.
}
check('No runtime source file changed', runtimeChanges.length === 0);
check('Portfolio UI is unchanged', !uiChanged);
check('Dependency lockfile is unchanged', !lockChanged);
check('No dependency was added or changed', !dependenciesChanged);
process.stdout.write('\n');

process.stdout.write(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}\n`);
if (failures.length > 0) {
  process.stdout.write('\nFailed checks:\n');
  for (const failure of failures) process.stdout.write(`  - ${failure}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('Result: PASS\n');
}
