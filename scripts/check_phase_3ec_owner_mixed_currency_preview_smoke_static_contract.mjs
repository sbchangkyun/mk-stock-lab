/**
 * Phase 3EC owner mixed-currency smoke preparation static contract.
 * This checker never imports or executes the smoke script.
 */

globalThis.fetch = async () => {
  throw new Error('Network access is blocked in the Phase 3EC static checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const paths = {
  smoke: 'scripts/owner_smoke_portfolio_mixed_currency_preview_api.mjs',
  checker: 'scripts/check_phase_3ec_owner_mixed_currency_preview_smoke_static_contract.mjs',
  runbook: 'docs/planning/phase_3ec_owner_mixed_currency_preview_smoke_runbook_v0.1.md',
  template: 'docs/planning/phase_3ec_owner_mixed_currency_preview_smoke_result_template_v0.1.md',
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

process.stdout.write('=== Phase 3EC Owner Mixed-Currency Preview Smoke Static Contract ===\n\n');

process.stdout.write('Files and package commands:\n');
check('Owner smoke script exists', existsSync(join(root, paths.smoke)));
check('Static checker exists', existsSync(join(root, paths.checker)));
check('Runbook exists', existsSync(join(root, paths.runbook)));
check('Result template exists', existsSync(join(root, paths.template)));
check('Package smoke command exists',
  packageJson.scripts?.['smoke:portfolio-mixed-currency-preview-api:owner'] ===
    'node scripts/owner_smoke_portfolio_mixed_currency_preview_api.mjs');
check('Package checker command exists',
  packageJson.scripts?.['check:phase-3ec-owner-mixed-currency-smoke'] ===
    'node scripts/check_phase_3ec_owner_mixed_currency_preview_smoke_static_contract.mjs');
process.stdout.write('\n');

process.stdout.write('Fail-closed execution gate:\n');
const guards = [
  'PHASE_3EC_OWNER_SMOKE',
  'PHASE_3EC_ALLOW_LOCAL_API',
  'PHASE_3EC_ALLOW_MOCKED_FX',
  'PHASE_3EC_ALLOW_MIXED_CURRENCY',
  'PHASE_3EC_SANITIZED_OUTPUT_ONLY',
];
for (const guard of guards) {
  check(`Smoke requires ${guard}=YES`, source.smoke.includes(`${guard}: 'YES'`));
}
check('Smoke requires every guard', source.smoke.includes('guardStatus.every(Boolean)'));
check('Smoke defaults to dry-run when guards are incomplete',
  source.smoke.includes('if (!activeApproved)') && source.smoke.includes('runDryRun()'));
check('Dry-run branch occurs before active invocation',
  source.smoke.indexOf('if (!activeApproved)') < source.smoke.lastIndexOf('runActiveSmoke()'));
check('Dry-run reports missing guard count only',
  source.smoke.includes('missingGuardCount') && source.smoke.includes("guardGroup: 'owner-local-mocked'"));
check('Active path blocks production runtime',
  source.smoke.includes('isProductionRuntime()') && source.smoke.includes('PRODUCTION_RUNTIME_BLOCKED'));
process.stdout.write('\n');

process.stdout.write('Local target and request contract:\n');
const urls = source.smoke.match(/https?:\/\/[^'"`\s]+/g) ?? [];
check('Smoke contains exactly one fixed URL', urls.length === 1);
check('Fixed URL is the approved local endpoint',
  urls[0] === 'http://127.0.0.1:4321/api/portfolio/valuation');
check('Smoke contains no production URL', !/https:\/\//.test(source.smoke));
check('Smoke logs only target=local-api',
  source.smoke.includes("target: 'local-api'") &&
    !/process\.stdout\.write\([^)]*API_TARGET/.test(source.smoke));
for (const marker of [
  "source: 'live'",
  "previewMode: 'owner'",
  'allowLiveQuotes: true',
  'allowMockedFx: true',
  "fxMode: 'mocked'",
  "baseCurrency: 'KRW'",
]) {
  check(`Request includes ${marker}`, source.smoke.includes(marker));
}
check('Request includes a KRW position',
  /market:\s*'KR'[\s\S]{0,180}currency:\s*'KRW'/.test(source.smoke));
check('Request includes a USD position',
  /market:\s*'US'[\s\S]{0,180}currency:\s*'USD'/.test(source.smoke));
check('Request uses placeholder numeric inputs',
  (source.smoke.match(/buyPrice:\s*1/g) ?? []).length === 2 &&
    (source.smoke.match(/quantity:\s*1/g) ?? []).length === 2);
process.stdout.write('\n');

process.stdout.write('Sanitized output and response handling:\n');
check('Smoke uses an output field allowlist', source.smoke.includes('safeFieldKeys'));
check('Smoke uses numeric and boolean output allowlists',
  source.smoke.includes('safeNumericKeys') && source.smoke.includes('safeBooleanKeys'));
check('Smoke uses enumerated safe string values', source.smoke.includes('safeStringValues'));
check('Every emitted line is marked sanitized', source.smoke.includes("parts.push('sanitized=true')"));
check('Smoke does not use console logging', !/console\.(log|error|warn)/.test(source.smoke));
check('Smoke does not print the request object',
  !/process\.stdout\.write\([^)]*requestBody/.test(source.smoke));
check('Smoke does not print response text or parsed response',
  !/process\.stdout\.write\([^)]*(responseText|parsed)/.test(source.smoke));
check('Smoke does not print prices, quantities, totals, or PnL',
  !/emitSafe\([\s\S]{0,220}(buyPrice|quantity|totalMarketValue|totalUnrealizedPnl|marketValue)/.test(source.smoke));
check('Smoke checks mocked FX source',
  source.smoke.includes("meta.fxSource !== 'mocked'") && source.smoke.includes("fxSource: 'mocked'"));
check('Smoke checks mocked FX sample state',
  source.smoke.includes("meta.fxStaleState !== 'sample'") && source.smoke.includes("fxStaleState: 'sample'"));
check('Smoke suppresses the FX rate value', source.smoke.includes('rateValuePrinted: false'));
check('Smoke reports safe row counts',
  source.smoke.includes('unavailableRows') && source.smoke.includes('unsupportedCurrencyRows'));
check('Smoke reports aggregate state without values',
  source.smoke.includes('aggregateState') && source.smoke.includes('valuesPrinted: false'));
check('Smoke checks provider leakage before contract output',
  source.smoke.includes('containsProviderLeakage(responseText)') &&
    source.smoke.includes('PROVIDER_LEAKAGE_DETECTED'));
check('Smoke emits only safe failure codes',
  source.smoke.includes('LOCAL_SERVER_UNAVAILABLE') &&
    source.smoke.includes('HTTP_STATUS_UNEXPECTED') &&
    source.smoke.includes('CONTRACT_MISMATCH') &&
    source.smoke.includes('UNSAFE_OUTPUT_BLOCKED'));
process.stdout.write('\n');

process.stdout.write('Provider and secret boundaries:\n');
check('Smoke imports no live FX provider', !/fxLiveAdapter|fxProvider/i.test(source.smoke));
check('Smoke imports no KIS module', !/from\s+['"][^'"]*kis|import\([^)]*kis/i.test(source.smoke));
check('Smoke reads no environment file',
  !/readFileSync\s*\([^)]*\.env|dotenv|\.env\.local/i.test(source.smoke));
check('Smoke contains no production domain', !/mkstocklab\.vercel\.app|vercel\.app\//i.test(source.smoke));
check('Smoke contains no hardcoded credential assignment',
  !/(APP_KEY|APP_SECRET|API_KEY|TOKEN|PASSWORD)\s*[:=]\s*['"][^'"]+['"]/i.test(source.smoke));
check('Smoke does not expose response headers', !/response\.headers|request\.headers/i.test(source.smoke));
check('Static checker blocks fetch',
  source.checker.includes('Network access is blocked in the Phase 3EC static checker.'));
check('Static checker never imports the smoke',
  !/import\s+.*owner_smoke_portfolio_mixed_currency|await\s+import\([^)]*owner_smoke/.test(source.checker));
check('Static checker does not execute the smoke',
  !/exec(File)?Sync\([^)]*owner_smoke|spawnSync\([^)]*owner_smoke/.test(source.checker));
check('Static checker reads no environment file',
  !/readFileSync\s*\([^)]*["'][^"']*\.env/i.test(source.checker));
process.stdout.write('\n');

process.stdout.write('Owner documentation:\n');
for (const heading of [
  '## 1. Purpose',
  '## 2. Safety Boundary',
  '## 3. Preconditions',
  '## 4. Start Local Dev Server',
  '## 5. Dry-Run Command',
  '## 6. Active Owner Smoke Command',
  '## 7. Expected Sanitized Output',
  '## 8. What Not to Share',
  '## 9. Pass / Fail Decision Rules',
  '## 10. Next Phase Routing',
]) {
  check(`Runbook contains ${heading}`, source.runbook.includes(heading));
}
for (const marker of [
  '# Phase 3EC Owner Smoke Report',
  '## 1. Local Setup',
  '## 2. Smoke Summary',
  '## 3. Safety Confirmation',
  '## 4. Decision',
]) {
  check(`Result template contains ${marker}`, source.template.includes(marker));
}
check('Runbook contains the exact active guard command',
  guards.every((guard) => source.runbook.includes(`$env:${guard}="YES"`)) &&
    source.runbook.includes('npm run smoke:portfolio-mixed-currency-preview-api:owner'));
check('Runbook prohibits sharing values and response contents',
  source.runbook.includes('## 8. What Not to Share') &&
    /prices.*quantities.*totals/i.test(source.runbook));
check('Result template defaults safety disclosures to No',
  source.template.includes('Raw response shared: No') &&
    source.template.includes('Prices/totals shared: No') &&
    source.template.includes('Secrets shared: No'));
const phaseSection = source.changelog.split('## Phase 3EC - 2026-06-28')[1]?.split('\n## ')[0] ?? '';
check('Changelog contains Phase 3EC', phaseSection.length > 0);
check('Changelog records owner execution pending',
  phaseSection.includes('owner execution pending') &&
    phaseSection.includes('No active owner smoke was run by Codex'));
process.stdout.write('\n');

process.stdout.write('Change scope and dependencies:\n');
let runtimeChanges = ['<git-diff-unavailable>'];
let uiChanged = true;
let lockChanged = true;
let dependenciesChanged = true;
try {
  runtimeChanges = execFileSync('git', ['diff', '--name-only', 'ede8f65', '--', 'src'], {
    cwd: root,
    encoding: 'utf8',
  }).trim().split(/\r?\n/).filter(Boolean);
  uiChanged = runtimeChanges.includes(paths.ui);
  lockChanged = execFileSync('git', ['diff', '--name-only', 'ede8f65', '--', 'package-lock.json'], {
    cwd: root,
    encoding: 'utf8',
  }).trim().length > 0;
  const baselinePackage = JSON.parse(execFileSync('git', ['show', 'ede8f65:package.json'], {
    cwd: root,
    encoding: 'utf8',
  }));
  dependenciesChanged = JSON.stringify(baselinePackage.dependencies) !== JSON.stringify(packageJson.dependencies) ||
    JSON.stringify(baselinePackage.devDependencies) !== JSON.stringify(packageJson.devDependencies);
} catch {
  // Fail closed through the initialized values.
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
