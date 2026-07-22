/**
 * Documentation-only static contract for Phase 3DV-CLOSEOUT.
 * No network, browser, Vercel, credentials, Supabase, or external API calls.
 */

globalThis.fetch = async () => {
  throw new Error('Network access is blocked in the Phase 3DV-CLOSEOUT checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const paths = {
  result: 'docs/planning/phase_3dv_mobile_home_banner_production_closeout_result_v0.1.md',
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

const result = read(paths.result);
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

process.stdout.write('=== Phase 3DV-CLOSEOUT Static Contract ===\n\n');

process.stdout.write('Files and package script:\n');
for (const [name, relativePath] of Object.entries(paths)) {
  check(`${name} file exists`, existsSync(join(root, relativePath)));
}
check('Closeout package script exists',
  packageJson.includes('"check:phase-3dv-closeout"') &&
  packageJson.includes('check_phase_3dv_closeout_static_contract.mjs'));
process.stdout.write('\n');

process.stdout.write('Production closeout baseline:\n');
check('Closeout records production owner re-check PASS',
  /owner final production re-check PASS/i.test(result));
check('Closeout references final runtime fix commit 9f7f4a1', result.includes('9f7f4a1'));
check('Closeout references documentation baseline c814f62', result.includes('c814f62'));
check('Closeout references canonical production URL', result.includes('https://mkstocklab.vercel.app'));
check('Closeout records production geometry PASS',
  result.includes('Production geometry') && result.includes('PASS (21/21)'));
process.stdout.write('\n');

process.stdout.write('Completed banner and admin scope:\n');
check('Closeout records PC slots 1-5', /PC[^\n]*slots? 1-5/i.test(result));
check('Closeout records mobile slots 1-5', /Mobile[^\n]*slots?[^\n]*1-5/i.test(result));
check('Closeout records required mobile placement',
  result.includes('MY PORTFOLIO') && result.includes('MARKET SNAPSHOT'));
check('Closeout records 859px and 860px behavior',
  result.includes('859px') && result.includes('860px'));
check('Closeout records PC rail at 1440px+',
  result.includes('1440px') && /PC (?:Home )?rail/i.test(result));
check('Closeout records URL-only workflow and no file upload',
  result.includes('URL-only') && result.includes('no file upload UI'));
check('Closeout records PC banner persistence fix',
  /PC banner admin persistence fixed/i.test(result) && /Owner re-test\*{0,2}:\s*PASS/i.test(result));
check('Closeout records checkbox policy', result.includes('Checkbox behavior accepted'));
check('Closeout records both storage shapes',
  result.includes('Legacy array-shaped') && result.includes('object-shaped'));
process.stdout.write('\n');

process.stdout.write('Hotfix history and final owner result:\n');
check('Closeout records fixed 728x70 footer ad root cause',
  result.includes('fixed 728x70 footer partner ad'));
check('Closeout records footer-ad-wrapper', result.includes('.footer-ad-wrapper'));
check('Closeout records containment targets',
  ['.bottom-document-area', '.bottom-ad-banner', 'ins', 'iframe'].every((marker) => result.includes(marker)));
check('Closeout records deploy verification conclusion',
  result.includes('not a stale alias') && result.includes('wrong Vercel project'));
for (const item of [
  'Home mobile viewport', 'Chart AI mobile viewport', 'Market mobile viewport',
  'Lab mobile viewport', 'Portfolio mobile viewport', 'MyPage mobile viewport',
  'Login modal', 'Footer and slide ads', 'Mobile Home banner',
]) {
  check(`Owner PASS scope includes ${item}`, result.includes(item));
}
process.stdout.write('\n');

process.stdout.write('Safety and final decision:\n');
check('Closeout records no SQL or migration',
  result.includes('No SQL or migration was performed'));
check('Closeout records no Supabase Storage upload',
  result.includes('No Supabase Storage upload was performed'));
check('Closeout records no Vercel environment changes',
  result.includes('No Vercel environment variables were changed'));
check('Closeout records no new project or relink',
  result.includes('No new Vercel project was created') && result.includes('no project relink was performed'));
check('Closeout records no deployment and no push',
  result.includes('No production deployment was performed during closeout') &&
  result.includes('No remote push was performed'));
check('Closeout explicitly marks Phase 3DV complete and closed',
  result.includes('Phase 3DV is complete and closed'));
check('Changelog contains exact closeout phase',
  changelog.includes('## Phase 3DV-CLOSEOUT - 2026-06-28'));
check('Changelog marks owner re-check PASS',
  changelog.includes('production owner re-check PASS'));
check('Changelog marks Phase 3DV closed', changelog.includes('Phase 3DV is closed'));

let runtimeChanges = [];
try {
  runtimeChanges = execFileSync('git', ['diff', '--name-only', 'c814f62', '--', 'src'], {
    cwd: root,
    encoding: 'utf8',
  }).trim().split(/\r?\n/).filter(Boolean);
} catch {
  runtimeChanges = ['<git-diff-unavailable>'];
}
check('No runtime source files changed in closeout', runtimeChanges.length === 0);
process.stdout.write('\n');

process.stdout.write(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}\n`);
if (failures.length > 0) {
  process.stdout.write('\nFailed checks:\n');
  for (const failure of failures) process.stdout.write(`  - ${failure}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('Result: PASS\n');
}
