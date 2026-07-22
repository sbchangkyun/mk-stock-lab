/**
 * Documentation-only static contract for Phase 3DW-CLOSEOUT.
 * No network, browser, Vercel, credentials, Supabase, or external API calls.
 */

globalThis.fetch = async () => {
  throw new Error('Network access is blocked in the Phase 3DW-CLOSEOUT checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const paths = {
  closeout: 'docs/planning/phase_3dw_production_mobile_geometry_guard_closeout_result_v0.1.md',
  runbook: 'docs/planning/phase_3dw_production_mobile_geometry_guard_result_v0.1.md',
  guard: 'scripts/owner_check_production_mobile_geometry.mjs',
  guardChecker: 'scripts/check_phase_3dw_production_mobile_geometry_guard_static_contract.mjs',
  closeoutChecker: 'scripts/check_phase_3dw_closeout_static_contract.mjs',
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

const closeout = read(paths.closeout);
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

process.stdout.write('=== Phase 3DW-CLOSEOUT Static Contract ===\n\n');

process.stdout.write('Files and package command:\n');
for (const [name, relativePath] of Object.entries(paths)) {
  check(`${name} file exists`, existsSync(join(root, relativePath)));
}
check('Closeout package command exists',
  packageJson.includes('"check:phase-3dw-closeout"') &&
  packageJson.includes('check_phase_3dw_closeout_static_contract.mjs'));
process.stdout.write('\n');

process.stdout.write('Baseline and final decision:\n');
check('Closeout marks the guard completed and validated',
  /Completed - owner-run production mobile geometry guard ready and validated/i.test(closeout));
check('Closeout references starting baseline e0ac265', closeout.includes('e0ac265'));
check('Closeout references the canonical production URL',
  closeout.includes('https://mkstocklab.vercel.app'));
check('Closeout explicitly marks Phase 3DW complete and closed',
  closeout.includes('Phase 3DW is complete and closed'));
check('Closeout recommends a new phase for subsequent work',
  closeout.includes('Recommended next work should proceed as a new phase'));
process.stdout.write('\n');

process.stdout.write('Completed deliverables and commands:\n');
check('Closeout records the owner-run guard script',
  closeout.includes('scripts/owner_check_production_mobile_geometry.mjs'));
check('Closeout records the static guard checker',
  closeout.includes('scripts/check_phase_3dw_production_mobile_geometry_guard_static_contract.mjs'));
check('Closeout records the result runbook',
  closeout.includes('docs/planning/phase_3dw_production_mobile_geometry_guard_result_v0.1.md'));
check('Closeout records the owner-run package command',
  closeout.includes('npm run guard:production-mobile-geometry'));
check('Closeout records the static-check package command',
  closeout.includes('npm run check:phase-3dw-production-mobile-geometry-guard'));
check('Closeout records the production guard variable',
  closeout.includes('PHASE_3DW_ALLOW_PRODUCTION_GEOMETRY=YES'));
check('Closeout records the separate local guard variable',
  closeout.includes('PHASE_3DW_ALLOW_LOCAL_GEOMETRY=YES'));
process.stdout.write('\n');

process.stdout.write('Coverage and accepted threshold:\n');
for (const route of ['`/`', '`/chart-ai`', '`/market`', '`/lab`', '`/portfolio`', '`/mypage`']) {
  check(`Closeout records route ${route}`, closeout.includes(route));
}
for (const viewport of ['390x844', '412x915', '430x932']) {
  check(`Closeout records viewport ${viewport}`, closeout.includes(viewport));
}
check('Closeout records the public login modal state',
  /public login modal state/i.test(closeout) && /without credentials/i.test(closeout));
check('Closeout records the accepted innerWidth plus two threshold',
  closeout.includes('innerWidth + 2'));
check('Closeout records sanitized offender reporting',
  /Sanitized offender reporting/i.test(closeout) && closeout.includes('top 25'));
process.stdout.write('\n');

process.stdout.write('Accepted validation evidence:\n');
check('Closeout records static guard contract PASS 58/58',
  /Static guard contract:\s*PASS \(58\/58\)/i.test(closeout));
check('Closeout records guard dry-run PASS',
  /Guard dry-run:\s*PASS/i.test(closeout));
check('Closeout records production geometry PASS 21/21',
  /Public production geometry:\s*PASS \(21\/21\)/i.test(closeout));
check('Closeout records origin rejection PASS',
  /Origin rejection tests:\s*PASS/i.test(closeout));
check('Closeout records Phase 3DV closeout PASS 41/41',
  /Phase 3DV closeout checker:\s*PASS \(41\/41\)/i.test(closeout));
check('Closeout records production-domain PASS 33/33',
  /Production domain contract:\s*PASS \(33\/33\)/i.test(closeout));
check('Closeout records build and diff checks PASS',
  /Build:\s*PASS/i.test(closeout) && /git diff --check`: PASS/i.test(closeout));
process.stdout.write('\n');

process.stdout.write('Safety model and usage policy:\n');
for (const marker of [
  'No login', 'No credential entry', 'No cookies', 'localStorage', 'sessionStorage',
  'No screenshots', 'No page text collection', 'No raw HTML capture',
  'No request or response body logging', 'Public routes only', 'Disposable browser profile',
]) {
  check(`Closeout safety includes ${marker}`, closeout.includes(marker));
}
check('Closeout records no deployment',
  closeout.includes('No deployment was performed'));
check('Closeout records no runtime source or API changes',
  closeout.includes('No runtime source, API route, provider, auth, or database logic was changed'));
check('Closeout records no remote push',
  closeout.includes('No remote push was performed'));
check('Closeout usage policy requires the guard before owner acceptance',
  closeout.includes('should run this guard before owner acceptance'));
check('Closeout sends failures to a separate diagnosis or hotfix phase',
  closeout.includes('A FAIL result should open a separate diagnosis or hotfix phase'));
process.stdout.write('\n');

process.stdout.write('Changelog and runtime-source boundary:\n');
const closeoutSection = changelog.split('## Phase 3DW-CLOSEOUT - 2026-06-28')[1]?.split('\n## ')[0] ?? '';
check('Changelog contains the Phase 3DW-CLOSEOUT entry', closeoutSection.length > 0);
check('Changelog marks Phase 3DW closed', closeoutSection.includes('Phase 3DW is closed'));
check('Changelog records no deployment and no push',
  closeoutSection.includes('no deployment') && closeoutSection.includes('no push'));

let runtimeChanges = [];
try {
  runtimeChanges = execFileSync('git', ['diff', '--name-only', 'e0ac265', '--', 'src'], {
    cwd: root,
    encoding: 'utf8',
  }).trim().split(/\r?\n/).filter(Boolean);
} catch {
  runtimeChanges = ['<git-diff-unavailable>'];
}
check('No runtime source files changed since e0ac265', runtimeChanges.length === 0);
process.stdout.write('\n');

process.stdout.write(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}\n`);
if (failures.length > 0) {
  process.stdout.write('\nFailed checks:\n');
  for (const failure of failures) process.stdout.write(`  - ${failure}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('Result: PASS\n');
}
