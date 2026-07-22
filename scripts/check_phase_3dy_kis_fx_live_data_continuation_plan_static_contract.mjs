/**
 * Static contract for the Phase 3DY KIS / FX continuation plan.
 * No network, browser, Vercel, credentials, Supabase, or external API calls.
 */

globalThis.fetch = async () => {
  throw new Error('Network access is blocked in the Phase 3DY static checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const paths = {
  plan: 'docs/planning/phase_3dy_kis_fx_live_data_integration_continuation_plan_v0.1.md',
  changelog: 'docs/planning/planning_changelog.md',
  package: 'package.json',
  checker: 'scripts/check_phase_3dy_kis_fx_live_data_continuation_plan_static_contract.mjs',
};

const read = (relativePath) => {
  try {
    return readFileSync(join(root, relativePath), 'utf8');
  } catch {
    return '';
  }
};

const plan = read(paths.plan);
const changelog = read(paths.changelog);
const packageJson = read(paths.package);
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

process.stdout.write('=== Phase 3DY KIS / FX Live Data Continuation Plan Static Contract ===\n\n');

process.stdout.write('Files and package command:\n');
for (const [name, relativePath] of Object.entries(paths)) {
  check(`${name} file exists`, existsSync(join(root, relativePath)));
}
check('Continuation-plan package command exists',
  packageJson.includes('"check:phase-3dy-kis-fx-live-data-plan"') &&
  packageJson.includes('check_phase_3dy_kis_fx_live_data_continuation_plan_static_contract.mjs'));
process.stdout.write('\n');

process.stdout.write('Status and prior-phase evidence:\n');
check('Plan status records completion with no runtime changes',
  /continuation plan completed; no runtime changes/i.test(plan));
check('Plan references Phase 3DX', plan.includes('Phase 3DX'));
check('Plan references Phase 3DW', plan.includes('Phase 3DW'));
check('Plan references KIS KR stock quote PASS evidence',
  plan.includes('KIS KR stock quote') && plan.includes('005930') && plan.includes('000660'));
check('Plan references KIS KR ETF quote PASS evidence',
  plan.includes('KIS KR ETF quote') && plan.includes('069500'));
check('Plan references owner Portfolio live preview API smoke PASS',
  /Portfolio live preview API smoke passed/i.test(plan));
check('Plan references owner Portfolio UI review PASS',
  /Portfolio preview UI review passed/i.test(plan));
check('Plan references the FX mocked adapter',
  plan.includes('fxMockAdapter.ts') && /mocked FX adapter/i.test(plan));
process.stdout.write('\n');

process.stdout.write('Required plan sections:\n');
for (const heading of [
  '## 3. Current Capability Matrix',
  '## 4. Existing Contracts to Preserve',
  '## 5. Gap Analysis',
  '## 6. Recommended Next Implementation Path',
  '## 7. Phase 3DZ Scope Proposal',
  '## 8. Owner Decisions Required',
  '## 9. Safety Model',
  '## 10. UI / Architecture Constraints',
  '## 11. Validation Plan for Future Runtime Phases',
  '## 12. Recommended Next Phase',
]) {
  check(`Plan contains ${heading.replace(/^## \d+\. /, '')}`, plan.includes(heading));
}
process.stdout.write('\n');

process.stdout.write('Capability matrix coverage:\n');
for (const area of [
  'KIS KR stock quote', 'KIS KR ETF quote', 'KIS token/runtime guard',
  'In-memory quote cache', 'Persistent quote cache', 'Mocked FX adapter',
  'Mixed-currency valuation with mocked FX', 'Portfolio valuation API fixture path',
  'Portfolio valuation API owner live preview', 'Portfolio UI owner preview mode',
  'Production public live quote path', '`source=auto`', 'US quote endpoint',
  'Real FX provider', 'Production mobile geometry guard',
]) {
  check(`Capability matrix includes ${area}`, plan.includes(`| ${area} |`));
}
check('Plan states the real FX provider is not selected',
  /real FX provider is not selected/i.test(plan));
check('Plan states the US quote endpoint is not implemented',
  /KIS US quote endpoint is not implemented|US quote endpoint \| Not implemented/i.test(plan));
check('Plan states public live quotes remain disabled',
  /Public live quotes remain disabled|Production public live quote path \| Disabled/i.test(plan));
check('Plan states source=auto remains deferred',
  /`source=auto` remains deferred/i.test(plan));
process.stdout.write('\n');

process.stdout.write('Contracts to preserve:\n');
for (const marker of [
  'Public `source=fixture` remains the default',
  'Unguarded public `source=live` remains disabled',
  '`source=live`, `previewMode=owner`, and `allowLiveQuotes=true`',
  'non-production runtime',
  'KR-only',
  'maximum of 10 positions',
  'KIS_ACCOUNT_NO',
  'must not silently fall back to fixture data',
  '`providerMeta` must not appear',
  'Secrets and account numbers must not be printed',
  'Missing live quotes remain explicit null/unavailable rows',
  'UI copy must not say `실시간`',
]) {
  check(`Preserved contract includes ${marker}`, plan.includes(marker));
}
check('Plan preserves conservative freshness states',
  ['fresh', 'stale-but-usable', 'sample', 'unavailable'].every((state) => plan.includes(`\`${state}\``)));
process.stdout.write('\n');

process.stdout.write('Gap analysis and next path:\n');
for (const gap of [
  'real FX provider is not selected',
  'KIS US/overseas quote endpoint is not implemented',
  'production public live path remains disabled',
  '`source=auto` routing remains deferred',
  'Public quote caching, rate-limit budgets',
  'Market-open versus market-closed quote freshness policy is not finalized',
  'FX freshness tolerance, stale window, and fallback policy are not finalized',
  'Mixed-currency production valuation is not ready',
  'Provider outage and partial-data UX is not finalized',
  'Final owner live-data UX acceptance for real FX has not occurred',
]) {
  check(`Gap analysis includes ${gap}`, plan.includes(gap));
}
for (const phase of ['Phase 3DZ', 'Phase 3EA', 'Phase 3EB', 'Phase 3EC', 'Phase 3ED', 'Phase 3EE']) {
  check(`Implementation path includes ${phase}`, plan.includes(phase));
}
check('Plan recommends Phase 3DZ by exact name',
  plan.includes('Recommended next phase: Phase 3DZ - FX Provider Selection and Real FX Adapter Plan.'));
process.stdout.write('\n');

process.stdout.write('Phase 3DZ scope and owner decisions:\n');
for (const marker of [
  'Planning and inspection only; no runtime changes',
  'provider-neutral FX request/result interface',
  'Define freshness states',
  'Define safe error classifications',
  'Define no-secret and no-provider-payload logging requirements',
  'Define a mocked-first adapter contract',
  'provider selection, paid usage, account creation, or new credentials require explicit owner approval',
]) {
  check(`Phase 3DZ scope includes ${marker}`, plan.includes(marker));
}
for (const decision of [
  'Which FX provider should be used?',
  'Is a paid provider acceptable',
  'Which currency pairs are required first?',
  'Should USD/KRW be the only initial pair?',
  'What freshness tolerance is acceptable for FX',
  'Should mixed-currency valuation appear only in owner preview first?',
  'Should public production remain fixture-only',
  'When can `source=auto` be reconsidered',
]) {
  check(`Owner decisions include ${decision}`, plan.includes(decision));
}
process.stdout.write('\n');

process.stdout.write('Safety, UI, and validation policy:\n');
for (const marker of [
  'Codex does not run live KIS calls',
  'Codex does not run live FX calls',
  'Codex does not read `.env`',
  'Owner-run smoke scripts remain fail-closed and explicit-guard only',
  'Raw provider payloads are not persisted or printed',
  '`providerMeta` and raw KIS fields do not leak',
  'Live-data production enablement requires explicit owner approval',
  'No Supabase row inspection, SQL, migration, or Storage operation',
]) {
  check(`Safety model includes ${marker}`, plan.includes(marker));
}
check('Plan binds future UI work to Phase 3DX',
  plan.includes('Phase 3DX remains binding'));
check('Plan preserves local scrolling for dense Portfolio data',
  /Dense Portfolio tables.*local horizontal scrolling/i.test(plan));
check('Plan requires Phase 3DW guard for public UI acceptance',
  /public UI change must run the Phase 3DW geometry guard dry-run/i.test(plan));
for (const validation of [
  'Provider mocked contract checker', 'API route contract checker', 'Owner smoke dry-run',
  'Owner smoke closeout', 'Portfolio UI preview checker',
  '`npm run check:mobile-baseline`', '`npm run check:phase-3dx-ui-architecture-plan`',
  '`npm run guard:production-mobile-geometry`', '`npm run build`', '`git diff --check`',
]) {
  check(`Future validation plan includes ${validation}`, plan.includes(validation));
}
process.stdout.write('\n');

process.stdout.write('Changelog and source boundary:\n');
const phaseSection = changelog.split('## Phase 3DY - 2026-06-28')[1]?.split('\n## ')[0] ?? '';
check('Planning changelog contains Phase 3DY', phaseSection.length > 0);
check('Changelog marks continuation plan ready',
  /continuation plan ready/i.test(phaseSection));
check('Changelog recommends Phase 3DZ', phaseSection.includes('Phase 3DZ'));
check('Changelog records no deployment and no push',
  /\*\*Deployment\*\*:\s*none/i.test(phaseSection) &&
  /\*\*Push\*\*:\s*none/i.test(phaseSection));
check('Plan records no deployment', plan.includes('No deployment was performed'));
check('Plan records no remote push', plan.includes('No remote push was performed'));

let runtimeChanges = [];
try {
  runtimeChanges = execFileSync('git', ['diff', '--name-only', '3436288..7d546f6', '--', 'src'], {
    cwd: root,
    encoding: 'utf8',
  }).trim().split(/\r?\n/).filter(Boolean);
} catch {
  runtimeChanges = ['<git-diff-unavailable>'];
}
check('No runtime source files changed during Phase 3DY', runtimeChanges.length === 0);
process.stdout.write('\n');

process.stdout.write(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}\n`);
if (failures.length > 0) {
  process.stdout.write('\nFailed checks:\n');
  for (const failure of failures) process.stdout.write(`  - ${failure}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('Result: PASS\n');
}
